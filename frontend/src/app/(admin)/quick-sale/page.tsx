'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  UtensilsCrossed,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  Save,
  CheckCircle2,
  RotateCcw,
  ChefHat,
  Wine,
  BedDouble,
  Check,
  Edit2,
  TrendingUp,
  History,
  Clock,
  ArrowLeft,
  User,
  Phone,
  Tag,
} from 'lucide-react';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { RestaurantReceiptModal, ReceiptModalProps, ReceiptItem } from '@/components/common/RestaurantReceiptModal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import {
  POSProductData,
  QuickSalePayload,
  QuickSaleReceipt,
  DailySalesSummaryData,
} from '@/lib/types';
import {
  DEFAULT_MENU_CATALOG,
  MenuItemCatalogEntry,
  getSettedMenuItems,
  resolveItemUnitInfo,
  consolidateMenuCatalog,
} from '@/lib/menuData';

// Cart line item structure matching table order items
export interface QuickCartItem {
  id: string;
  productId?: string;
  name: string;
  baseName?: string;
  category: string;
  unit?: string;
  availableUnits?: { unit: string; price: number }[];
  unitPrice: number;
  quantity: number;
  remarks?: string;
  trackStock?: boolean;
  stock?: number;
  department?: 'KOT' | 'BOT';
  dispatchedQuantity?: number;
  kotNumber?: string;
  botNumber?: string;
}

export default function QuickSalePage() {
  const toast = useToast();

  // Active Order / Ticket Number
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<QuickCartItem[]>([]);

  // Search & Direct Add Input State
  const [orderProductName, setOrderProductName] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Dynamic In-Table Draft Rows for the "+ Add New" button feature
  const [draftRows, setDraftRows] = useState<
    { id: string; search: string; isOpen: boolean; selectedIndex: number }[]
  >([]);

  // Setted Menu Catalog (Menu items + POS Products)
  const [menuCatalog, setMenuCatalog] = useState<MenuItemCatalogEntry[]>(() => getSettedMenuItems());
  const [posProducts, setPosProducts] = useState<POSProductData[]>([]);

  // Dedicated Billing Panel State (matching user reference screenshot)
  const [billDisPercent, setBillDisPercent] = useState<string>('');
  const [billDisAmt, setBillDisAmt] = useState<string>('');
  const [billRoundOff, setBillRoundOff] = useState<string>('0');
  const [billPaidAmt, setBillPaidAmt] = useState<string>('');
  const [billMode, setBillMode] = useState<string>('Cash');
  const [billRemarks, setBillRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Optional Customer Info (Never required for normal counter walk-in)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');


  // Charge to Room Verification State (for hotel guests at counter)
  const [roomNumberInput, setRoomNumberInput] = useState<string>('');
  const [isVerifyingRoom, setIsVerifyingRoom] = useState<boolean>(false);
  const [verifiedStay, setVerifiedStay] = useState<{
    valid: boolean;
    reservationId?: string;
    roomId?: string;
    roomNumber?: string;
    guestName?: string;
    bookingCode?: string;
  } | null>(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptModalProps | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Daily Sales Summary Modal State
  const [dailySales, setDailySales] = useState<DailySalesSummaryData | null>(null);
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState<boolean>(false);
  const [isLoadingDailySales, setIsLoadingDailySales] = useState<boolean>(false);

  // In-Page Recent Bills Table State
  const [showRecentBills, setShowRecentBills] = useState<boolean>(false);
  const [localRecentOrders, setLocalRecentOrders] = useState<any[]>([]);
  const recentBillsRef = useRef<HTMLDivElement>(null);

  // Quick Add Variant Selection Modal (Requirement: For multi-size items like Sprite, pop up size choices)
  const [variantModal, setVariantModal] = useState<{
    isOpen: boolean;
    menuItem: MenuItemCatalogEntry;
    quantity: number;
    draftId?: string;
  } | null>(null);

  // Load cached recent bills from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('hotel_recent_quick_bills');
        if (stored) {
          setLocalRecentOrders(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.warn('Could not read cached quick bills', e);
    }
  }, []);

  // Generate a clean fresh order ticket
  const generateNewOrderNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `QS-${dateStr}-${rand}`;
  };

  // Initial Load: Generate Ticket & Fetch Menu / Products
  useEffect(() => {
    setActiveOrderNumber(generateNewOrderNumber());

    // Load setted menu items
    const localMenu = getSettedMenuItems();
    setMenuCatalog(localMenu);

    // Load backend POS products & daily sales
    (async () => {
      try {
        const products = await api.getPOSProducts({ outlet: 'RESTAURANT' });
        if (products && products.length > 0) {
          setPosProducts(products);

          // Merge backend products into menu catalog if not already present
          const existingCodes = new Set(localMenu.map((m) => m.code.toLowerCase()));
          const existingNames = new Set(localMenu.map((m) => m.name.toLowerCase()));
          const merged: MenuItemCatalogEntry[] = [...localMenu];

          products.forEach((p) => {
            const clean = p.name.toLowerCase().trim();
            if (!existingNames.has(clean) && !existingCodes.has(p.id.toLowerCase())) {
              merged.push({
                id: p.id,
                code: p.id.slice(0, 8).toUpperCase(),
                name: p.name,
                baseName: p.name,
                category: p.category || 'Counter & Retail',
                price: p.price,
                trackStock: p.trackStock ?? false,
                stock: p.stock ?? 0,
                isAvailable: p.isAvailable ?? true,
              });
            }
          });

          setMenuCatalog(consolidateMenuCatalog(merged));
        }
      } catch (err) {
        console.warn('Could not load POS products from backend, using setted menu', err);
      }
    })();

    loadDailySales();
  }, []);

  const [dbOrders, setDbOrders] = useState<any[]>([]);

  const loadDailySales = async () => {
    setIsLoadingDailySales(true);
    try {
      const [salesRes, ordersRes] = await Promise.allSettled([
        api.getDailySales(),
        api.getRestaurantOrders({ orderType: 'COUNTER_SALE,TAKEAWAY' }),
      ]);

      if (salesRes.status === 'fulfilled' && salesRes.value) {
        setDailySales(salesRes.value);
      }
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setDbOrders(ordersRes.value);
      }
    } catch (err) {
      console.warn('Could not load daily sales or orders from database', err);
    } finally {
      setIsLoadingDailySales(false);
    }
  };

  // Combine and sort recent bills from database API (dailySales + restaurant orders) and local storage
  const allRecentBills = useMemo(() => {
    const apiOrders = dailySales?.recentOrders || [];
    const map = new Map<string, any>();

    // 1. Direct database orders
    dbOrders.forEach((o) => {
      if (o && o.orderNumber) {
        map.set(o.orderNumber, {
          ...o,
          itemCount: o.itemCount || (o.items ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1),
        });
      }
    });

    // 2. Daily sales recent orders
    apiOrders.forEach((o) => {
      if (o && o.orderNumber && !map.has(o.orderNumber)) {
        map.set(o.orderNumber, o);
      }
    });

    // 3. Local recent orders cache
    localRecentOrders.forEach((o) => {
      if (o && o.orderNumber && !map.has(o.orderNumber)) {
        map.set(o.orderNumber, o);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [dailySales, dbOrders, localRecentOrders]);

  // Toggle in-page recent bills table and smooth scroll
  const handleToggleRecentBills = () => {
    setShowRecentBills((prev) => {
      const next = !prev;
      if (next) {
        loadDailySales();
        setTimeout(() => {
          recentBillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return next;
    });
  };

  // View / Print receipt from recent bills row
  const handleViewRecentBillReceipt = (ord: any) => {
    if (ord.receiptData) {
      setReceiptData(ord.receiptData);
    } else {
      setReceiptData({
        isOpen: true,
        onClose: () => setIsReceiptModalOpen(false),
        orderNumber: ord.orderNumber,
        receiptNumber: `REC-${ord.orderNumber.replace('QS-', '').replace('ORD-', '')}`,
        orderType: ord.orderType || 'COUNTER_SALE',
        tableNumber: ord.tableNumber || null,
        seatingNote: ord.tableNumber ? `Table ${ord.tableNumber}` : 'Counter Takeaway',
        createdAt: ord.createdAt || new Date().toISOString(),
        serverName: ord.serverName || 'Counter Staff',
        customerName: 'Walk-in Customer',
        items: ord.items || [{ productName: 'Order Items', quantity: ord.itemCount || 1, unitPrice: ord.total, total: ord.total }],
        subtotal: ord.total,
        discountAmount: 0,
        tax: 0,
        serviceCharge: 0,
        total: ord.total,
        paidAmount: ord.total,
        changeDue: 0,
        paymentMethod: ord.paymentMethod || 'Cash',
        paymentStatus: 'PAID',
      });
    }
    setIsReceiptModalOpen(true);
  };

  // Filtered autocomplete suggestions for the main search bar
  const suggestions = useMemo(() => {
    const rawCatalog = menuCatalog && menuCatalog.length > 0 ? menuCatalog : getSettedMenuItems();
    const catalogList = consolidateMenuCatalog(rawCatalog);
    const q = orderProductName.toLowerCase().trim();
    if (!q) {
      return catalogList;
    }
    return catalogList.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.baseName && item.baseName.toLowerCase().includes(q)) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [menuCatalog, orderProductName]);

  // Calculations
  const basicTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const parsedDisAmt = parseFloat(billDisAmt) || 0;
  const parsedDisPercent = parseFloat(billDisPercent) || 0;
  const effectiveDisAmt =
    billDisAmt !== ''
      ? parsedDisAmt
      : billDisPercent !== ''
      ? (basicTotal * parsedDisPercent) / 100
      : 0;

  const parsedRoundOff = parseFloat(billRoundOff) || 0;
  const netAmount = Math.max(0, Math.round((basicTotal - effectiveDisAmt + parsedRoundOff) * 100) / 100);
  const parsedPaidAmt = billPaidAmt === '' ? netAmount : parseFloat(billPaidAmt) || 0;
  const changeDue = Math.max(0, Math.round((parsedPaidAmt - netAmount) * 100) / 100);
  const refDue = Math.max(0, Math.round((netAmount - parsedPaidAmt) * 100) / 100);

  // Discount Percentage & Amount Bidirectional Sync
  const handleDisPercentChange = (val: string) => {
    setBillDisPercent(val);
    if (val === '') {
      setBillDisAmt('');
      return;
    }
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    const calculatedAmt = (basicTotal * num) / 100;
    setBillDisAmt(calculatedAmt > 0 ? (Math.round(calculatedAmt * 100) / 100).toString() : '0');
  };

  const handleDisAmtChange = (val: string) => {
    setBillDisAmt(val);
    if (val === '') {
      setBillDisPercent('');
      return;
    }
    const num = Math.min(basicTotal, Math.max(0, parseFloat(val) || 0));
    const calculatedPercent = basicTotal > 0 ? (num / basicTotal) * 100 : 0;
    setBillDisPercent(calculatedPercent > 0 ? (Math.round(calculatedPercent * 10) / 10).toString() : '0');
  };

  // Helper to push confirmed item & size into the cart
  const pushItemToCart = (
    menuItem: MenuItemCatalogEntry,
    selectedTier: { unit: string; price: number },
    qty: number
  ) => {
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const unit = selectedTier.unit || 'Regular';
    const unitPrice = selectedTier.price;

    // Stock check for tracked items
    if (menuItem.trackStock && menuItem.stock !== undefined && menuItem.stock <= 0) {
      toast.error('Out of Stock', `"${name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.name.toLowerCase() === name.toLowerCase() && (i.unit || '').toLowerCase() === unit.toLowerCase()
      );

      if (menuItem.trackStock && menuItem.stock !== undefined) {
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty + qty > menuItem.stock) {
          toast.error('Stock Limit Reached', `Only ${menuItem.stock} units of "${name} (${unit})" available.`);
          return prev;
        }
      }

      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }

      return [
        ...prev,
        {
          id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: menuItem.id,
          name,
          baseName: unitInfo.baseName,
          category: menuItem.category,
          unit,
          availableUnits: unitInfo.availableUnits,
          unitPrice,
          quantity: qty,
          trackStock: menuItem.trackStock,
          stock: menuItem.stock,
          department: unitInfo.department || menuItem.department || 'KOT',
          dispatchedQuantity: 0,
        },
      ];
    });

    toast.success('Item Added', `${qty}x ${name} · ${unit} (Rs. ${(unitPrice * qty).toFixed(2)}) added to cart.`);
  };

  // Add Item Directly from Search Autocomplete
  const handleAddDirectMenuItem = (menuItem: MenuItemCatalogEntry, qtyOverride?: number) => {
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const hasMultipleUnits = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;
    const qty = qtyOverride && qtyOverride > 0 ? qtyOverride : Math.max(1, orderQuantity);

    // Rule 1 & 2: For multi-variant items, open the Quick Add popup to select size
    if (hasMultipleUnits) {
      setVariantModal({
        isOpen: true,
        menuItem,
        quantity: qty,
      });
      setIsSuggestionsOpen(false);
      return;
    }

    // Rule 4: Single-variant items add directly with default unit and price
    const defaultTier = unitInfo.availableUnits[0] || { unit: unitInfo.unit || 'Regular', price: menuItem.price };
    pushItemToCart(menuItem, defaultTier, qty);
    setOrderProductName('');
    setOrderQuantity(1);
    setIsSuggestionsOpen(false);
  };

  // ---------------------------------------------------------------------------
  // In-Table "Add New" Draft Row Actions (Matching User Reference Layout)
  // ---------------------------------------------------------------------------
  const handleAddNewDraftRow = () => {
    const newId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setDraftRows((prev) => [
      ...prev.map((d) => ({ ...d, isOpen: false })),
      { id: newId, search: '', isOpen: true, selectedIndex: 0 },
    ]);
  };

  const handleRemoveDraftRow = (draftId: string) => {
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleUpdateDraftSearch = (draftId: string, search: string) => {
    setDraftRows((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, search, isOpen: true, selectedIndex: 0 } : d))
    );
  };

  const handleSelectMenuItemForDraft = (draftId: string, menuItem: MenuItemCatalogEntry) => {
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const hasMultipleUnits = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;

    // Rule 1 & 2: For multi-variant items, open the Quick Add popup to select size
    if (hasMultipleUnits) {
      setVariantModal({
        isOpen: true,
        menuItem,
        quantity: 1,
        draftId,
      });
      setDraftRows((prev) => prev.map((d) => (d.id === draftId ? { ...d, isOpen: false } : d)));
      return;
    }

    // Rule 4: Single-variant items add directly with default unit and price
    const defaultTier = unitInfo.availableUnits[0] || { unit: unitInfo.unit || 'Regular', price: menuItem.price };
    pushItemToCart(menuItem, defaultTier, 1);
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Change order item unit/portion (e.g. Sprite Glass -> Can -> 500ml Bottle)
  const handleUpdateItemUnit = (itemId: string, newUnit: string) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const unitMeta = resolveItemUnitInfo(
          { name: i.name, price: i.unitPrice, unit: i.unit, baseName: i.baseName, availableUnits: i.availableUnits },
          menuCatalog
        );
        const targetTier =
          unitMeta.availableUnits.find((u) => u.unit.toLowerCase() === newUnit.toLowerCase()) ||
          unitMeta.availableUnits.find((u) => u.unit === newUnit);

        const newPrice = targetTier ? targetTier.price : (newUnit ? i.unitPrice : 0);
        const cleanBase = unitMeta.baseName || i.baseName || i.name.replace(/\s*\([^)]*\)$/, '').trim();

        if (targetTier) {
          toast.success('Size Selected', `${cleanBase} (${newUnit}) · Rs. ${newPrice.toFixed(2)}`);
        }

        return {
          ...i,
          name: cleanBase,
          baseName: cleanBase,
          unit: newUnit,
          unitPrice: newPrice,
          availableUnits: unitMeta.availableUnits,
        };
      })
    );
  };

  // Adjust item quantity
  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== itemId) return i;
          if (delta > 0 && i.trackStock && i.stock !== undefined && i.quantity >= i.stock) {
            toast.error('Stock Limit', `Only ${i.stock} units available in stock.`);
            return i;
          }
          const nextQty = i.quantity + delta;
          return nextQty > 0 ? { ...i, quantity: nextQty } : null;
        })
        .filter(Boolean) as QuickCartItem[]
    );
  };

  // Update item remarks
  const handleUpdateItemRemarks = (itemId: string, remarks: string) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, remarks } : i))
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Reset entire sale
  const handleClearCart = () => {
    setCart([]);
    setDraftRows([]);
    setBillDisPercent('');
    setBillDisAmt('');
    setBillRoundOff('0');
    setBillPaidAmt('');
    setBillRemarks('');
    setCustomerName('');
    setCustomerPhone('');
    setActiveOrderNumber(generateNewOrderNumber());
    toast.info('Sale Cleared', 'Order reset for next counter customer.');
  };

  // Verify room stay for room charging
  const handleVerifyRoom = async (roomNumberToVerify?: string) => {
    const num = (roomNumberToVerify || roomNumberInput).trim();
    if (!num) {
      toast.error('Room Number Required', 'Please enter a valid room number to verify active stay.');
      return;
    }

    setIsVerifyingRoom(true);
    try {
      const res = await api.verifyRoomStay(num);
      if (res && res.valid) {
        setVerifiedStay(res);
        toast.celebrate('Stay Verified', `Guest: ${res.guestName} · Room ${res.roomNumber}`);
        if (!customerName) {
          setCustomerName(res.guestName || '');
        }
      } else {
        setVerifiedStay(null);
        toast.error('Stay Not Found', res?.message || `No active checked-in stay found for Room ${num}.`);
      }
    } catch (err: any) {
      setVerifiedStay(null);
      toast.error('Verification Failed', err.message || 'Error occurred while verifying room stay.');
    } finally {
      setIsVerifyingRoom(false);
    }
  };

  // Save optional customer details from modal
  const handleSaveCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerName(customerNameInput.trim());
    setCustomerPhone(customerPhoneInput.trim());
    setIsCustomerModalOpen(false);
    toast.success('Customer Details Saved', customerNameInput.trim() || 'Details updated.');
  };

  // Dispatch KOT / BOT / All Tickets from Quick Sale
  const handleDispatchTicket = (targetDept: 'KOT' | 'BOT' | 'ALL') => {
    if (cart.length === 0) {
      toast.error('Cart Empty', 'Please add items before printing tickets.');
      return;
    }

    const unselectedItem = cart.find((i) => i.availableUnits && i.availableUnits.length > 1 && !i.unit);
    if (unselectedItem) {
      toast.error('Select Size', `Please select a size for "${unselectedItem.name}".`);
      return;
    }

    let pendingItems = cart.filter((i) => {
      const isPending = i.quantity > (i.dispatchedQuantity || 0);
      if (!isPending) return false;
      if (targetDept === 'KOT') return (i.department === 'KOT' || !i.department);
      if (targetDept === 'BOT') return i.department === 'BOT';
      return true;
    });

    if (pendingItems.length === 0) {
      pendingItems = cart.filter((i) => {
        if (targetDept === 'KOT') return (i.department === 'KOT' || !i.department);
        if (targetDept === 'BOT') return i.department === 'BOT';
        return true;
      });
    }

    if (pendingItems.length === 0) {
      toast.info('No Items', `No ${targetDept === 'BOT' ? 'bar/beverage' : 'kitchen'} items in order.`);
      return;
    }

    const ticketNumber = targetDept === 'BOT' ? `BOT-${Math.floor(100 + Math.random() * 900)}` : `KOT-${Math.floor(200 + Math.random() * 800)}`;

    setCart((prev) =>
      prev.map((i) => {
        const matches =
          targetDept === 'ALL' ||
          (targetDept === 'KOT' && (i.department === 'KOT' || !i.department)) ||
          (targetDept === 'BOT' && i.department === 'BOT');
        if (matches) {
          return {
            ...i,
            dispatchedQuantity: i.quantity,
            kotNumber: targetDept === 'BOT' ? i.kotNumber : ticketNumber,
            botNumber: targetDept === 'KOT' ? i.botNumber : ticketNumber,
          };
        }
        return i;
      })
    );

    const printItems = pendingItems.map((i) => {
      const remainingQty = i.quantity - (i.dispatchedQuantity || 0);
      const qty = remainingQty > 0 ? remainingQty : i.quantity;
      return {
        productName: i.unit ? `${i.name} (${i.unit})` : i.name,
        quantity: qty,
        unitPrice: i.unitPrice,
        total: i.unitPrice * qty,
        notes: i.remarks,
      };
    });

    setReceiptData({
      isOpen: true,
      onClose: () => setIsReceiptModalOpen(false),
      orderNumber: activeOrderNumber || 'QS-ORDER',
      ticketType: (targetDept === 'BOT' ? 'BOT' : targetDept === 'ALL' ? 'ALL' : 'KOT') as any,
      kotNumber: targetDept !== 'BOT' ? ticketNumber : undefined,
      botNumber: targetDept === 'BOT' ? ticketNumber : undefined,
      receiptNumber: ticketNumber,
      orderType: 'COUNTER_SALE',
      tableNumber: null,
      seatingNote: 'Counter Sale',
      createdAt: new Date().toISOString(),
      serverName: 'ADMIN',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: printItems,
      subtotal: printItems.reduce((s, i) => s + i.total, 0),
      tax: 0,
      total: printItems.reduce((s, i) => s + i.total, 0),
    });
    setIsReceiptModalOpen(true);
    toast.celebrate(`Ticket Dispatched!`, `${printItems.length} item(s) printed (${ticketNumber}).`);
  };

  // ---------------------------------------------------------------------------
  // Complete Quick Sale & Settle
  // ---------------------------------------------------------------------------
  const handleCompleteSale = async (shouldPrint = false) => {
    if (cart.length === 0) {
      toast.error('Cart is Empty', 'Please add at least one item before completing the sale.');
      return;
    }

    const unselectedItem = cart.find((i) => i.availableUnits && i.availableUnits.length > 1 && !i.unit);
    if (unselectedItem) {
      toast.error('Select Size', `Please select a size for "${unselectedItem.name}" before completing the sale.`);
      return;
    }

    // Room charge validation
    if ((billMode === 'Charge to Room' || billMode === 'Room Charge') && (!verifiedStay || !verifiedStay.valid)) {
      toast.error('Room Stay Not Verified', 'Please verify an active checked-in room stay to charge this bill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: QuickSalePayload = {
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          notes: i.remarks,
        })),
        paymentMethod: billMode,
        paidAmount: parsedPaidAmt,
        discountPercent: parsedDisPercent > 0 ? parsedDisPercent : undefined,
        discountAmount: effectiveDisAmt > 0 ? effectiveDisAmt : undefined,
        tax: 0,
        serviceCharge: 0,
        serverName: 'Counter Cashier',
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: billRemarks.trim() || undefined,
        sendToKitchen: false,
        outlet: 'RESTAURANT',
      };

      const result = await api.quickSale(payload);

      const savedOrderNumber = result.receipt?.orderNumber || activeOrderNumber;
      toast.celebrate(
        'Sale Completed Successfully!',
        `Bill #${savedOrderNumber} settled for Rs. ${netAmount.toFixed(0)} (${billMode}).`
      );

      // Prepare receipt data
      const receiptProps: ReceiptModalProps = {
        isOpen: true,
        onClose: () => setIsReceiptModalOpen(false),
        orderNumber: savedOrderNumber,
        receiptNumber: `REC-${savedOrderNumber.replace('QS-', '').replace('ORD-', '')}`,
        orderType: 'COUNTER_SALE',
        tableNumber: null,
        seatingNote: 'Counter Takeaway',
        createdAt: new Date().toISOString(),
        serverName: 'Counter Cashier',
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map((i) => ({
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          notes: i.remarks,
        })),
        subtotal: basicTotal,
        discountAmount: effectiveDisAmt,
        discountPercent: parsedDisPercent,
        tax: 0,
        serviceCharge: 0,
        total: netAmount,
        paidAmount: parsedPaidAmt,
        changeDue: changeDue,
        paymentMethod: billMode,
        paymentStatus: 'PAID',
      };

      setReceiptData(receiptProps);

      if (shouldPrint) {
        setIsReceiptModalOpen(true);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.print();
          }
        }, 300);
      } else {
        setIsReceiptModalOpen(true);
      }

      // Reset cart and tender for next customer
      handleClearCart();

      // Refresh daily sales
      await loadDailySales();

      // Immediately cache in local recent orders for instant in-table display
      const newRecentRecord = {
        id: `bill-${Date.now()}`,
        orderNumber: savedOrderNumber,
        orderType: 'COUNTER_SALE',
        tableNumber: undefined,
        status: 'PAID',
        serverName: 'Counter Cashier',
        total: netAmount,
        paymentMethod: billMode,
        itemCount: cart.reduce((s, i) => s + i.quantity, 0),
        items: receiptProps.items,
        receiptData: receiptProps,
        createdAt: new Date().toISOString(),
      };

      setLocalRecentOrders((prev) => {
        const updated = [newRecentRecord, ...prev.filter((o) => o.orderNumber !== savedOrderNumber)].slice(0, 50);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('hotel_recent_quick_bills', JSON.stringify(updated));
          }
        } catch {}
        return updated;
      });
    } catch (err: any) {
      toast.error('Sale Failed', err.message || 'Error occurred while completing counter sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-150">
      {/* =======================================================================
          TOP NAVIGATION BOXES (RESTAURANT HUB MODULES)
          ======================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Restaurant Management Suite
          </span>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Counter POS & Quick Sale</span>
          </span>
        </div>
        <RestaurantManagementNavBoxes activeId="quick-sale" />
      </div>

      {/* =======================================================================
          TOP SERVICE & CUSTOMER INFORMATION STRIP (MATCHING TABLE ORDER PAGE)
          ======================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-[3px] bg-[#FAFBF9] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64736C] dark:text-[#879B90]">Order No:</span>
          <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400 bg-white dark:bg-[#061D18] px-2.5 py-0.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
            {activeOrderNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">

          {/* Daily Sales Quick Metric Button */}
          {dailySales && (
            <button
              type="button"
              onClick={() => setIsDailySalesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-[#0B3D32] dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
              title="Click to view daily sales & audit report"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Today: Rs. {dailySales.totalSales.toFixed(0)}</span>
              <span className="font-mono text-[10px] opacity-75">({dailySales.totalOrders} bills)</span>
            </button>
          )}

          {/* Recent Bills History Toggle */}
          <button
            type="button"
            onClick={handleToggleRecentBills}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold shadow-2xs cursor-pointer transition-all',
              showRecentBills
                ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-500'
                : 'border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-[#24352F] dark:text-white hover:bg-slate-50'
            )}
            title="Click to view recent bills history below"
          >
            <History className={cn('w-3.5 h-3.5', showRecentBills ? 'text-emerald-300' : 'text-slate-500')} />
            <span>Recent Bills</span>
            {allRecentBills.length > 0 && (
              <span
                className={cn(
                  'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  showRecentBills
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
              >
                {allRecentBills.length}
              </span>
            )}
          </button>

          {/* Reset / Clear Sale Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center gap-1 rounded-[3px] border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#A51F36] hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors cursor-pointer"
              title="Clear all cart items and reset tender"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SEARCH / ADD ITEM WITH INSTANT AUTOCOMPLETE SUGGESTIONS
          Fetches directly from Setted Menu & POS Products Catalog
          ========================================================================= */}
      <div className="space-y-3 max-w-5xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-heading text-[#24352F] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
            <span>Add Order · Quick Sale</span>
          </h2>
        </div>

        {/* Search Input Bar with Instant Dropdown Suggestions Below */}
        <div className="relative w-full max-w-sm sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879B90] pointer-events-none z-40" />
            <input
              type="text"
              placeholder="search item & Add"
              value={orderProductName}
              onFocus={() => setIsSuggestionsOpen(true)}
              onClick={() => setIsSuggestionsOpen(true)}
              onChange={(e) => {
                setOrderProductName(e.target.value);
                setIsSuggestionsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (suggestions.length > 0) {
                    handleAddDirectMenuItem(suggestions[0]);
                  }
                }
              }}
              className="relative z-40 w-full rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#061D18] pl-9 pr-8 py-2.5 text-xs text-[#24352F] placeholder-[#879B90] dark:border-[#145447] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs transition-colors"
            />
            {orderProductName && (
              <button
                type="button"
                onClick={() => setOrderProductName('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown Appearing Directly Below Input */}
          {isSuggestionsOpen && (
            <>
              {/* Transparent backdrop to dismiss on click outside */}
              <div
                className="fixed inset-0 z-30 cursor-default bg-transparent"
                onClick={() => setIsSuggestionsOpen(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-1.5 bg-[#FAFBF9] dark:bg-[#061D18] text-[10px] font-bold uppercase tracking-wider text-[#64736C] dark:text-[#879B90] flex items-center justify-between">
                  <span>
                    {orderProductName.trim()
                      ? `Matching Menu Suggestions (${suggestions.length})`
                      : `All Setted Menu Items (${menuCatalog.length})`}
                  </span>
                  <span className="text-[9px] font-normal normal-case opacity-75">
                    Click item to add directly
                  </span>
                </div>

                {suggestions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#879B90] dark:text-[#64736C]">
                    <p className="font-semibold text-[#24352F] dark:text-white">
                      No menu items found for &quot;{orderProductName}&quot;
                    </p>
                  </div>
                ) : (
                  suggestions.map((item) => {
                    const unitInfo = resolveItemUnitInfo(item, menuCatalog);
                    const isMulti = unitInfo.availableUnits && unitInfo.availableUnits.length > 1;
                    const variantCount = unitInfo.availableUnits?.length || 0;

                    return (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddDirectMenuItem(item);
                        }}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer transition-colors group"
                      >
                        {/* 1. Item Name & 2. Category */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300">
                              {item.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-[#0E3B31] text-[#64736C] dark:text-[#A4B8AE]">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {item.code}
                          </div>
                        </div>

                        {/* 3. Variant Summary / Price & 4. Action Button */}
                        {isMulti ? (
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-[3px] border border-emerald-200/70 dark:border-emerald-800/60 whitespace-nowrap">
                              {variantCount} Sizes Available
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Select</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                              Rs. {item.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] group-hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors dark:bg-emerald-600 dark:group-hover:bg-emerald-500 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>


      {/* ===================================================================
          TOP SECTION: STRUCTURED ORDER TABLE (MATCHING EXACT TABLE ORDER LAYOUT)
          # | Particular | Unit | Rate | Qty | Amount | Status | Remarks | Add New
          =================================================================== */}
      <div
        className={cn(
          'border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-[#071F1A] shadow-2xs transition-all',
          draftRows.some((d) => d.isOpen) ? 'min-h-[420px] pb-44 overflow-visible' : 'overflow-hidden'
        )}
      >
        <div
          className={cn(
            'w-full',
            draftRows.some((d) => d.isOpen) ? 'overflow-visible' : 'overflow-x-auto'
          )}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#061D18]">
                <th className="py-2 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">#</th>
                <th className="py-2 px-3.5 text-left border-r border-slate-200 dark:border-slate-800">Particular</th>
                <th className="py-2 px-2.5 text-center w-40 min-w-[145px] border-r border-slate-200 dark:border-slate-800">Unit</th>
                <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Rate</th>
                <th className="py-2 px-3 text-center w-20 border-r border-slate-200 dark:border-slate-800">Qty</th>
                <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Amount</th>
                <th className="py-2 px-2.5 text-center w-28 border-r border-slate-200 dark:border-slate-800">Status</th>
                <th className="py-2 px-3 text-left border-r border-slate-200 dark:border-slate-800">Remarks</th>
                <th className="py-1 px-2 text-center w-28">
                  <button
                    type="button"
                    onClick={handleAddNewDraftRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 dark:hover:text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer select-none"
                    title="Click to add new row"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 && draftRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-[#879B90] dark:text-[#64736C]">
                    <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-[#24352F] dark:text-white">
                      No items in Quick Sale yet
                    </p>
                    <p className="text-xs text-[#879B90] dark:text-[#64736C] mt-1 max-w-sm mx-auto">
                      Click &quot;Add New&quot; above to add a row and search dishes directly, or search above.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddNewDraftRow}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Row</span>
                    </button>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Existing Cart Items */}
                  {cart.map((item, index) => {
                    const unitMeta = resolveItemUnitInfo(
                      { name: item.name, price: item.unitPrice, unit: item.unit, baseName: item.baseName, availableUnits: item.availableUnits },
                      menuCatalog
                    );
                    const currentUnit = item.unit || unitMeta.unit;
                    const hasMultipleUnits = unitMeta.availableUnits && unitMeta.availableUnits.length > 1;
                    const itemAmount = item.unitPrice * item.quantity;
                    const particularName =
                      item.baseName || unitMeta.baseName || item.name.replace(/\s*\([^)]*\)$/, '').trim();

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-[#FAFBF9] dark:hover:bg-[#07241E]/80 transition-colors"
                      >
                        {/* # Serial Number */}
                        <td className="py-2 px-3 text-center text-xs text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800/80">
                          {index + 1}
                        </td>

                        {/* Particular */}
                        <td className="py-2 px-3.5 text-xs text-[#24352F] dark:text-white border-r border-slate-100 dark:border-slate-800/80 font-medium">
                          {particularName}
                        </td>

                        {/* Unit (Non-clickable, selected when choosing item in modal) */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-[3px] text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
                            {currentUnit || 'Regular'}
                          </span>
                        </td>

                        {/* Rate (Styled with light grey background box matching screenshot) */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className={cn(
                            'px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right',
                            item.unitPrice > 0
                              ? 'bg-[#E9ECEF] dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400'
                          )}>
                            {item.unitPrice > 0 ? item.unitPrice.toFixed(2) : '-'}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, -1)}
                              className="w-4 h-4 rounded text-[10px] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-mono font-medium text-slate-800 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, 1)}
                              className="w-4 h-4 rounded text-[10px] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>

                        {/* Amount (Styled with light grey background box matching screenshot) */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className={cn(
                            'px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right',
                            itemAmount > 0
                              ? 'bg-[#E9ECEF] dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400'
                          )}>
                            {itemAmount > 0 ? itemAmount.toFixed(2) : '0.00'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          {item.kotNumber ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {item.kotNumber}
                            </span>
                          ) : item.botNumber ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <Wine className="w-2.5 h-2.5" />
                              {item.botNumber}
                            </span>
                          ) : item.dispatchedQuantity && item.dispatchedQuantity >= item.quantity ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              <Clock className="w-2.5 h-2.5" />
                              Unsent
                            </span>
                          )}
                        </td>

                        {/* Remarks */}
                        <td className="py-1.5 px-2 text-left border-r border-slate-100 dark:border-slate-800/80">
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={item.remarks || ''}
                            onChange={(e) => handleUpdateItemRemarks(item.id, e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-[#0B3D32] focus:outline-none text-slate-700 dark:text-slate-300"
                          />
                        </td>

                        {/* Action / Delete */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Active In-Table Draft Rows (Matching Reference Design) */}
                  {draftRows.map((draft, draftIdx) => {
                    const rawCatalog = menuCatalog && menuCatalog.length > 0 ? menuCatalog : getSettedMenuItems();
                    const catalogList = consolidateMenuCatalog(rawCatalog);
                    const q = draft.search.toLowerCase().trim();
                    const filteredDraftItems = catalogList.filter((item) => {
                      if (!q) return true;
                      return (
                        item.name.toLowerCase().includes(q) ||
                        (item.baseName && item.baseName.toLowerCase().includes(q)) ||
                        item.category.toLowerCase().includes(q) ||
                        item.code.toLowerCase().includes(q)
                      );
                    });

                    return (
                      <tr
                        key={draft.id}
                        className={cn(
                          'border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#071F1A]',
                          draft.isOpen && 'relative z-30'
                        )}
                      >
                        {/* # Serial Number */}
                        <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800/80">
                          {cart.length + draftIdx + 1}
                        </td>

                        {/* Particular Input with Green Border & Autocomplete Popover */}
                        <td className={cn('py-1 px-2 relative border-r border-slate-100 dark:border-slate-800/80', draft.isOpen && 'z-50')}>
                          <div className={cn('relative', draft.isOpen && 'z-50')}>
                            <input
                              type="text"
                              autoFocus
                              placeholder="search item & Add"
                              value={draft.search}
                              onChange={(e) => handleUpdateDraftSearch(draft.id, e.target.value)}
                              onFocus={() => {
                                setDraftRows((prev) =>
                                  prev.map((d) => (d.id === draft.id ? { ...d, isOpen: true } : d))
                                );
                              }}
                              onClick={() => {
                                setDraftRows((prev) =>
                                  prev.map((d) => (d.id === draft.id ? { ...d, isOpen: true } : d))
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setDraftRows((prev) =>
                                    prev.map((d) =>
                                      d.id === draft.id
                                        ? {
                                            ...d,
                                            isOpen: true,
                                            selectedIndex: Math.min(
                                              filteredDraftItems.length - 1,
                                              d.selectedIndex + 1
                                            ),
                                          }
                                        : d
                                    )
                                  );
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setDraftRows((prev) =>
                                    prev.map((d) =>
                                      d.id === draft.id
                                        ? { ...d, isOpen: true, selectedIndex: Math.max(0, d.selectedIndex - 1) }
                                        : d
                                    )
                                  );
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (
                                    filteredDraftItems.length > 0 &&
                                    filteredDraftItems[draft.selectedIndex]
                                  ) {
                                    handleSelectMenuItemForDraft(
                                      draft.id,
                                      filteredDraftItems[draft.selectedIndex]
                                    );
                                  }
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleRemoveDraftRow(draft.id);
                                }
                              }}
                              className="relative z-50 w-full px-2 py-1 text-xs bg-white dark:bg-[#061D18] border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-slate-900 dark:text-white font-medium shadow-xs"
                            />

                            {/* Popover Table Directly Under Input (Matching Reference Screenshot) */}
                            {draft.isOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                                  onClick={() => {
                                    setDraftRows((prev) =>
                                      prev.map((d) => (d.id === draft.id ? { ...d, isOpen: false } : d))
                                    );
                                  }}
                                />
                                <div className="absolute left-0 top-full mt-1 z-50 w-[540px] max-w-[90vw] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[4px] overflow-hidden animate-in fade-in-0 duration-75">
                                  {/* Teal Header Bar */}
                                  <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                                    <span className="w-44 text-left">ITEM</span>
                                    <span className="w-32 text-left">GENERIC NAME</span>
                                    <span className="w-20 text-right">RATE</span>
                                    <span className="w-16 text-center">SRATE</span>
                                    <span className="w-12 text-center">QTY</span>
                                  </div>

                                  {/* Items List */}
                                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {filteredDraftItems.length === 0 ? (
                                      <div className="py-6 text-center text-xs text-slate-500">
                                        No items found for &quot;{draft.search}&quot;
                                      </div>
                                    ) : (
                                      filteredDraftItems.map((item, idx) => {
                                        const isSelected = idx === draft.selectedIndex;
                                        return (
                                          <div
                                            key={item.id}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleSelectMenuItemForDraft(draft.id, item);
                                            }}
                                            onMouseEnter={() => {
                                              setDraftRows((prev) =>
                                                prev.map((d) =>
                                                  d.id === draft.id ? { ...d, selectedIndex: idx } : d
                                                )
                                              );
                                            }}
                                            className={cn(
                                              'px-2.5 py-2 flex items-center cursor-pointer transition-colors text-xs font-sans select-none',
                                              isSelected
                                                ? 'bg-[#1E293B] text-white dark:bg-[#0E3B31]'
                                                : 'hover:bg-[#1E293B] hover:text-white text-slate-800 dark:text-slate-200 bg-white dark:bg-[#071F1A]'
                                            )}
                                          >
                                            {(() => {
                                              const itemUnitMeta = resolveItemUnitInfo(item, menuCatalog);
                                              const isMulti = itemUnitMeta.availableUnits && itemUnitMeta.availableUnits.length > 1;
                                              return (
                                                <>
                                                  <span className="w-44 truncate font-medium text-left">
                                                    {item.name}
                                                  </span>
                                                  <span className="w-32 truncate text-left text-[11px] opacity-75">
                                                    {item.category || '-'}
                                                  </span>
                                                  <span className={cn(
                                                    "w-20 text-right font-medium",
                                                    isMulti ? "text-emerald-400 font-semibold text-[11px]" : "font-mono"
                                                  )}>
                                                    {isMulti ? `${itemUnitMeta.availableUnits.length} Sizes` : `Rs. ${item.price.toFixed(2)}`}
                                                  </span>
                                                  <span className="w-16 text-center text-[11px] opacity-90">
                                                    {isMulti ? (
                                                      <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-700/80 text-white text-[10px] font-bold">
                                                        Select
                                                      </span>
                                                    ) : (
                                                      item.portion || item.unit || '1'
                                                    )}
                                                  </span>
                                                  <span className="w-12 text-center font-mono opacity-75">
                                                    {item.stock !== undefined ? item.stock : '-'}
                                                  </span>
                                                </>
                                              );
                                            })()}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Unit placeholder */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span className="text-[11px] text-slate-400">-</span>
                        </td>

                        {/* Rate placeholder */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-400">
                            0.00
                          </div>
                        </td>

                        {/* Qty placeholder */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span className="text-xs font-mono text-slate-400">1</span>
                        </td>

                        {/* Amount placeholder */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-400">
                            0.00
                          </div>
                        </td>

                        {/* Status placeholder */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 font-medium">New</span>
                        </td>

                        {/* Remarks placeholder */}
                        <td className="py-1.5 px-2 text-left border-r border-slate-100 dark:border-slate-800/80">
                          <span className="text-xs text-slate-400"></span>
                        </td>

                        {/* Action / Delete draft row */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftRow(draft.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Cancel row"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Order Action Bar: Save, Print KOT, Print BOT, All in One (Directly below table, above billing) */}
        <div className="flex items-center justify-end gap-2 px-3.5 py-2 bg-slate-50/80 dark:bg-[#061D18] border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Save */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(false)}
              className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07241E] hover:bg-slate-50 dark:hover:bg-[#0c382f] text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Save order"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
            </button>

            {/* 2. Print KOT */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleDispatchTicket('KOT')}
              className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07241E] hover:bg-slate-50 dark:hover:bg-[#0c382f] text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dispatch and print Kitchen Order Ticket (KOT)"
            >
              <ChefHat className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Print KOT</span>
              {cart.some(
                (i) => (i.department === 'KOT' || !i.department) && (i.quantity > (i.dispatchedQuantity || 0))
              ) && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold">
                  {cart
                    .filter((i) => (i.department === 'KOT' || !i.department) && (i.quantity > (i.dispatchedQuantity || 0)))
                    .reduce((s, i) => s + (i.quantity - (i.dispatchedQuantity || 0)), 0)}
                </span>
              )}
            </button>

            {/* 3. Print BOT */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleDispatchTicket('BOT')}
              className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07241E] hover:bg-slate-50 dark:hover:bg-[#0c382f] text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dispatch and print Bar Order Ticket (BOT)"
            >
              <Wine className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Print BOT</span>
              {cart.some(
                (i) => i.department === 'BOT' && (i.quantity > (i.dispatchedQuantity || 0))
              ) && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold">
                  {cart
                    .filter((i) => i.department === 'BOT' && (i.quantity > (i.dispatchedQuantity || 0)))
                    .reduce((s, i) => s + (i.quantity - (i.dispatchedQuantity || 0)), 0)}
                </span>
              )}
            </button>

            {/* 4. All in One */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleDispatchTicket('ALL')}
              className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07241E] hover:bg-slate-50 dark:hover:bg-[#0c382f] text-slate-700 dark:text-slate-200 font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dispatch both Kitchen and Bar tickets together"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>All in One</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          BOTTOM SECTION: BILLING PANEL (EXACT DESIGN MATCHING USER SCREENSHOT)
          =================================================================== */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-md p-3.5 bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
        {/* Row 1: Basic Total | Dis % | Dis Amt | Round off | Net Amount | Paid Amt. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Basic Total
            </label>
            <input
              type="text"
              readOnly
              value={basicTotal.toFixed(0)}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-slate-800 dark:text-slate-200 cursor-default"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Dis %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              placeholder=""
              value={billDisPercent}
              onChange={(e) => handleDisPercentChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Dis Amt
            </label>
            <input
              type="number"
              min={0}
              max={basicTotal}
              step="1"
              placeholder="0"
              value={billDisAmt}
              onChange={(e) => handleDisAmtChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Round off
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={billRoundOff}
              onChange={(e) => setBillRoundOff(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Net Amount
            </label>
            <input
              type="text"
              readOnly
              value={netAmount.toFixed(0)}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-slate-800 dark:text-slate-200 cursor-default"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Paid Amt.
            </label>
            <input
              type="number"
              min={0}
              step="1"
              placeholder={netAmount.toFixed(0)}
              value={billPaidAmt}
              onChange={(e) => setBillPaidAmt(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>

        {/* Row 2: Ref. Due / Change | Payment Mode | Remarks | Send KOT | Action Buttons */}
        <div className="flex flex-wrap items-end gap-3 pt-1">
          <div className="w-28">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {changeDue > 0 ? 'Change Due' : 'Ref. Due'}
            </label>
            <input
              type="text"
              readOnly
              value={changeDue > 0 ? changeDue.toFixed(0) : refDue.toFixed(0)}
              className={cn(
                'w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] cursor-default',
                refDue > 0
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : changeDue > 0
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-800 dark:text-slate-200'
              )}
            />
          </div>

          <div className="w-40">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Payment Mode
            </label>
            <select
              value={billMode}
              onChange={(e) => setBillMode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0B3D32] cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="UPI / QR">UPI / QR</option>
              <option value="Charge to Room">Charge to Room (Hotel Guest)</option>
              <option value="Due / Credit">Due / Credit</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="Optional billing note..."
              value={billRemarks}
              onChange={(e) => setBillRemarks(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          {/* Billing Action Buttons: Settle Payment & Settle and Print */}
          <div className="ml-auto flex items-end gap-2">
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(false)}
              className="px-3.5 py-1.5 rounded-[3px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Settle payment"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Processing...' : 'Settle Payment'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(true)}
              className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Settle payment and print receipt"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Settle &amp; Print</span>
            </button>
          </div>
        </div>

        {/* Charge to Room Verification Panel */}
        {(billMode === 'Charge to Room' || billMode === 'Room Charge') && (
          <div className="p-3 bg-amber-50/70 dark:bg-[#0E2E25] border border-amber-300 dark:border-amber-700/60 rounded-md space-y-2 mt-2 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <BedDouble className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Charge to Hotel Room Folio</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                Verified Active Checked-In Stay Required
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48">
                <input
                  type="text"
                  placeholder="Room number (e.g. 101)"
                  value={roomNumberInput}
                  onChange={(e) => setRoomNumberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyRoom();
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold font-mono bg-white dark:bg-[#071F1A] border border-amber-300 dark:border-amber-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleVerifyRoom(roomNumberInput)}
                disabled={isVerifyingRoom || !roomNumberInput.trim()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isVerifyingRoom ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify Stay</span>
                  </>
                )}
              </button>
              {verifiedStay && verifiedStay.valid && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded text-xs text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Verified: <strong>{verifiedStay.guestName}</strong> (Room {verifiedStay.roomNumber})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          RECENT BILLS & SALES HISTORY SECTION (DISPLAYED BELOW QUICK SALE FORM)
          Clean, Simple & Professional Table Format
          ========================================================================= */}
      {showRecentBills && (
        <div
          ref={recentBillsRef}
          className="rounded-[4px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-2xs overflow-hidden animate-in fade-in-50 duration-150 space-y-0"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-[#FAFBF9] dark:bg-[#061B16]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <h3 className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wider">
                Recent Bills &amp; Sales History
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {allRecentBills.length} {allRecentBills.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadDailySales}
                disabled={isLoadingDailySales}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Refresh recent sales"
              >
                <RotateCcw className={cn('w-3 h-3', isLoadingDailySales && 'animate-spin')} />
                <span>{isLoadingDailySales ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRecentBills(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Hide Recent Bills"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-[#061D18]">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-100 dark:border-slate-800/80">#</th>
                  <th className="py-2.5 px-3.5 text-left border-r border-slate-100 dark:border-slate-800/80">Bill / Order No</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-100 dark:border-slate-800/80">Date &amp; Time</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-slate-100 dark:border-slate-800/80">Type</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-slate-100 dark:border-slate-800/80">Items</th>
                  <th className="py-2.5 px-3 text-center w-32 border-r border-slate-100 dark:border-slate-800/80">Payment Method</th>
                  <th className="py-2.5 px-3.5 text-right w-32 border-r border-slate-100 dark:border-slate-800/80">Net Amount</th>
                  <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-100 dark:border-slate-800/80">Status</th>
                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {allRecentBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-xs text-slate-400">
                      <History className="w-7 h-7 mx-auto mb-2 opacity-35" />
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        No Recent Bills Recorded Today
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Completed sales will appear in this table automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  allRecentBills.map((ord, idx) => {
                    const formattedDate = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Today';
                    const formattedTime = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-';

                    return (
                      <tr
                        key={ord.id || ord.orderNumber || idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#0E362C]/30 transition-colors"
                      >
                        {/* Serial Number */}
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-400 border-r border-slate-100 dark:border-slate-800/80">
                          {idx + 1}
                        </td>

                        {/* Order Number */}
                        <td className="py-2 px-3.5 font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/80">
                          {ord.orderNumber}
                        </td>

                        {/* Date & Time */}
                        <td className="py-2 px-3 text-xs text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/80">
                          <span className="font-medium">{formattedTime}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 opacity-80">· {formattedDate}</span>
                        </td>

                        {/* Order Type */}
                        <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider',
                              ord.orderType === 'COUNTER_SALE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : ord.tableNumber
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            )}
                          >
                            {ord.orderType === 'COUNTER_SALE'
                              ? 'Counter'
                              : ord.tableNumber
                              ? `Table ${ord.tableNumber}`
                              : 'Takeaway'}
                          </span>
                        </td>

                        {/* Items count */}
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/80">
                          {ord.itemCount || (ord.items ? ord.items.reduce((s: number, i: any) => s + i.quantity, 0) : 1)}
                        </td>

                        {/* Payment Method */}
                        <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span className="inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                            {ord.paymentMethod || 'Cash'}
                          </span>
                        </td>

                        {/* Net Amount */}
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/80">
                          Rs. {Number(ord.total || 0).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-2.5 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Paid</span>
                          </span>
                        </td>

                        {/* Action: Receipt */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewRecentBillReceipt(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border border-slate-300 hover:border-[#0B3D32] hover:bg-[#0B3D32] hover:text-white dark:border-slate-700 dark:hover:bg-emerald-600 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                            title="View or print receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* =========================================================================
          DAILY SALES AUDIT & RECENT BILLS MODAL
          ========================================================================= */}
      {isDailySalesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDailySalesModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] rounded-[4px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    Restaurant Daily Sales &amp; Counter Audit
                  </h3>
                  <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                    Reconciled sales by order type, payment breakdown and recent receipts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDailySalesModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {dailySales ? (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        Total Sales
                      </div>
                      <div className="text-lg font-black font-mono text-[#0B3D32] dark:text-emerald-300">
                        Rs. {dailySales.totalSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">{dailySales.totalOrders} total bills</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                        Quick Sales
                      </div>
                      <div className="text-lg font-black font-mono text-amber-900 dark:text-amber-200">
                        Rs. {dailySales.breakdownByType.quickSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-amber-700/80">Counter &amp; Takeaway</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-0.5">
                        Dine-In Sales
                      </div>
                      <div className="text-lg font-black font-mono text-sky-900 dark:text-sky-200">
                        Rs. {dailySales.breakdownByType.dineInSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-sky-700/80">Floor Tables</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-0.5">
                        VAT Collected
                      </div>
                      <div className="text-lg font-black font-mono text-purple-900 dark:text-purple-200">
                        Rs. {dailySales.totalTax.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-purple-700/80">Discounts: Rs. {dailySales.totalDiscounts.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                      Payment Mode Reconciliation
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Cash:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.cashSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Card:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.cardSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">QR / UPI:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.upiSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Room Folio:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.roomFolioSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Paid Transactions Table */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Recent Paid Bills
                    </div>
                    <div className="overflow-x-auto rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                            <th className="p-2">Bill / Order</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Items</th>
                            <th className="p-2">Method</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                          {dailySales.recentOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-[#0E362C]/30">
                              <td className="p-2 font-mono font-bold text-[#0B3D32] dark:text-emerald-300">
                                {ord.orderNumber}
                              </td>
                              <td className="p-2">
                                <span className={cn(
                                  'px-1.5 py-0.2 rounded-[2px] text-[9px] font-bold uppercase',
                                  ord.orderType === 'COUNTER_SALE' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                                )}>
                                  {ord.orderType === 'COUNTER_SALE' ? 'Counter' : ord.tableNumber ? `Table ${ord.tableNumber}` : 'Dine-In'}
                                </span>
                              </td>
                              <td className="p-2 font-mono">{ord.itemCount} items</td>
                              <td className="p-2 font-bold uppercase text-[10px]">{ord.paymentMethod}</td>
                              <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                                Rs. {ord.total.toFixed(2)}
                              </td>
                              <td className="p-2 text-right text-[10px] text-slate-400 font-mono">
                                {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">Loading daily sales...</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex justify-end">
              <button
                type="button"
                onClick={() => setIsDailySalesModalOpen(false)}
                className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          QUICK ADD MODAL FOR MULTI-VARIANT ITEMS (e.g. Sprite: Glass, Can, 500ml)
          ========================================================================= */}
      {variantModal && variantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (variantModal.draftId) {
                setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
              }
              setVariantModal(null);
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-700 shadow-2xl p-5 animate-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {variantModal.menuItem.category || 'Portion / Size'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {variantModal.menuItem.baseName || variantModal.menuItem.name.replace(/\s*\([^)]*\)$/, '').trim()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (variantModal.draftId) {
                    setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                  }
                  setVariantModal(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVariantModal((prev) => (prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null))
                  }
                  className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 dark:text-white select-none">
                  {variantModal.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setVariantModal((prev) => (prev ? { ...prev, quantity: prev.quantity + 1 } : null))
                  }
                  className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Sizes / Variants Grid */}
            <div className="pt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Size to Add:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {resolveItemUnitInfo(variantModal.menuItem, menuCatalog).availableUnits.map((tier) => (
                  <button
                    key={tier.unit}
                    type="button"
                    onClick={() => {
                      pushItemToCart(variantModal.menuItem, tier, variantModal.quantity);
                      if (variantModal.draftId) {
                        setDraftRows((prev) => prev.filter((d) => d.id !== variantModal.draftId));
                      }
                      setVariantModal(null);
                      setOrderProductName('');
                      setOrderQuantity(1);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-md border-2 border-emerald-600/30 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 transition-all text-center group cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <span className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      {tier.unit}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                      Rs. {tier.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINTABLE RESTAURANT RECEIPT MODAL
          ========================================================================= */}
      {receiptData && (
        <RestaurantReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          orderNumber={receiptData.orderNumber}
          receiptNumber={receiptData.receiptNumber}
          orderType={receiptData.orderType}
          tableNumber={receiptData.tableNumber}
          seatingNote={receiptData.seatingNote}
          createdAt={receiptData.createdAt}
          serverName={receiptData.serverName}
          customerName={receiptData.customerName}
          customerPhone={receiptData.customerPhone}
          items={receiptData.items}
          subtotal={receiptData.subtotal}
          discountAmount={receiptData.discountAmount}
          discountPercent={receiptData.discountPercent}
          tax={receiptData.tax}
          serviceCharge={receiptData.serviceCharge}
          total={receiptData.total}
          paidAmount={receiptData.paidAmount}
          changeDue={receiptData.changeDue}
          paymentMethod={receiptData.paymentMethod}
          paymentStatus={receiptData.paymentStatus}
        />
      )}
    </div>
  );
}

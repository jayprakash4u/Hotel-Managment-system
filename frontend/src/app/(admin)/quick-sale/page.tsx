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
  Users,
  AlertCircle,
  Phone,
  Tag,
} from 'lucide-react';
import { RestaurantReceiptModal, ReceiptModalProps, ReceiptItem } from '@/components/common/RestaurantReceiptModal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import {
  POSProductData,
  QuickSalePayload,
  QuickSaleReceipt,
  DailySalesSummaryData,
  CustomerData,
} from '@/lib/types';
import {
  DEFAULT_MENU_CATALOG,
  MenuItemCatalogEntry,
  getSettedMenuItems,
  resolveItemUnitInfo,
  consolidateMenuCatalog,
} from '@/lib/menuData';
import {
  QuickBillRecord,
  BillSource,
  BillType,
  getOpenOrders,
  getPaidBills,
  getAllBills,
  saveOpenOrder,
  addItemsToOpenOrder,
  settleAndPrintBill,
  cancelOpenOrder,
  getNextVatInvoiceNumber,
  isTokenInUse,
  timeElapsed,
} from '@/lib/quickBillingData';

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

  // Credit Customer State for Quick Billing POS
  const [creditCustomers, setCreditCustomers] = useState<CustomerData[]>([]);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<CustomerData | null>(null);
  const [creditSearchQuery, setCreditSearchQuery] = useState<string>('');
  const [isCreditDropdownOpen, setIsCreditDropdownOpen] = useState<boolean>(false);
  const [isManagerOverrideAllowed, setIsManagerOverrideAllowed] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideDialog, setShowOverrideDialog] = useState<boolean>(false);

  // Load active credit customers when Credit mode is chosen
  useEffect(() => {
    if (billMode === 'Credit') {
      api.getCustomers({ type: 'CREDIT', status: 'ACTIVE' })
        .then((res) => setCreditCustomers(res || []))
        .catch(() => {});
    }
  }, [billMode]);

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
  const topSearchRef = useRef<HTMLDivElement>(null);

  // Global click outside listener ensuring mutual exclusivity between search popups
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (topSearchRef.current && !topSearchRef.current.contains(target)) {
        setIsSuggestionsOpen(false);
      }
      if (!target.closest?.('.draft-row-container')) {
        setDraftRows((prev) => {
          if (prev.some((d) => d.isOpen)) {
            return prev.map((d) => ({ ...d, isOpen: false }));
          }
          return prev;
        });
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Open Order POS Lane & Open Orders State (Save != Print)
  const [isOpenOrder, setIsOpenOrder] = useState<boolean>(false);
  const [openOrderToken, setOpenOrderToken] = useState<string>('');
  const [openOrderSource, setOpenOrderSource] = useState<BillSource>('NO_TABLE');
  const [openBillType, setOpenBillType] = useState<BillType>('NORMAL');
  const [editingOpenBill, setEditingOpenBill] = useState<QuickBillRecord | null>(null);
  const [openOrdersList, setOpenOrdersList] = useState<QuickBillRecord[]>([]);
  const [showOpenOrders, setShowOpenOrders] = useState<boolean>(false);
  const [openOrderSearch, setOpenOrderSearch] = useState<string>('');
  const openOrdersRef = useRef<HTMLDivElement>(null);

  const refreshOpenOrders = () => {
    try {
      setOpenOrdersList(getOpenOrders());
    } catch (e) {
      console.warn('Could not read open orders', e);
    }
  };

  useEffect(() => {
    refreshOpenOrders();
    const handleSync = () => refreshOpenOrders();
    if (typeof window !== 'undefined') {
      window.addEventListener('restaurant_quick_bills_updated', handleSync);
      return () => window.removeEventListener('restaurant_quick_bills_updated', handleSync);
    }
  }, []);

  const filteredOpenOrders = useMemo(() => {
    if (!openOrderSearch.trim()) return openOrdersList;
    const q = openOrderSearch.toLowerCase().trim();
    return openOrdersList.filter(
      (b) =>
        b.masterBillNumber.toLowerCase().includes(q) ||
        b.token.toLowerCase().includes(q) ||
        (b.customerName && b.customerName.toLowerCase().includes(q))
    );
  }, [openOrdersList, openOrderSearch]);

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

  const taxableAmount = Math.max(0, basicTotal - effectiveDisAmt);
  const isVatBill = openBillType === 'VAT';
  const vatRate = isVatBill ? 0.13 : 0;
  const vatAmount = isVatBill ? Math.round(taxableAmount * vatRate * 100) / 100 : 0;
  const parsedRoundOff = parseFloat(billRoundOff) || 0;
  const netAmount = Math.max(0, Math.round((taxableAmount + vatAmount + parsedRoundOff) * 100) / 100);
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
    setIsSuggestionsOpen(false);
    const newId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setDraftRows((prev) => [
      ...prev.map((d) => ({ ...d, isOpen: false })),
      { id: newId, search: '', isOpen: false, selectedIndex: 0 },
    ]);
  };

  const handleRemoveDraftRow = (draftId: string) => {
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleUpdateDraftSearch = (draftId: string, search: string) => {
    setIsSuggestionsOpen(false);
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
    setEditingOpenBill(null);
    setIsOpenOrder(false);
    setOpenOrderToken('');
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
  // Save != Print POS Engine: Open Orders vs Direct Quick Bill
  // ---------------------------------------------------------------------------
  const handleSaveAction = async (shouldPrint = false) => {
    if (cart.length === 0) {
      toast.error('Cart Empty', 'Please add at least one item before saving.');
      return;
    }

    const unselectedItem = cart.find((i) => i.availableUnits && i.availableUnits.length > 1 && !i.unit);
    if (unselectedItem) {
      toast.error('Select Size', `Please select a size for "${unselectedItem.name}" before saving.`);
      return;
    }

    // LANE 1: Ticked -> OPEN ORDER (Save != Print)
    if (isOpenOrder) {
      if (!openOrderToken.trim()) {
        toast.error('Token Required', 'Please enter a Token #, Chair position, or Customer identifier for open orders.');
        return;
      }

      // Proforma notice if printed while open
      if (shouldPrint) {
        const proformaConfirm = confirm('Ticked open order cannot be printed as final legal tax invoice until settlement.\n\nPrint a "PROFORMA – NOT FINAL" copy?');
        if (!proformaConfirm) return;
      }

      // Case A: Editing an existing open order (Adding another round)
      if (editingOpenBill) {
        const roundNum = (editingOpenBill.currentRound || 1) + 1;
        const newItems = cart.map((i, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          roundNumber: roundNum,
          addedAt: new Date().toISOString(),
          productId: i.productId,
          name: i.unit ? `${i.name} (${i.unit})` : i.name,
          category: i.category || 'Kitchen',
          unit: i.unit || 'Regular',
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          total: i.unitPrice * i.quantity,
          notes: i.remarks,
        }));

        const updated = addItemsToOpenOrder(editingOpenBill.id, newItems, {
          discountPercent: parsedDisPercent,
          discountAmount: effectiveDisAmt,
          roundOff: parsedRoundOff,
          notes: billRemarks.trim() || undefined,
        });

        if (updated) {
          toast.celebrate(
            'Round Added to Open Order!',
            `Order ${updated.masterBillNumber} (${updated.token}) updated with Round ${roundNum}. Total: Rs. ${updated.grandTotal.toFixed(0)}`
          );

          if (shouldPrint) {
            setReceiptData({
              isOpen: true,
              onClose: () => setIsReceiptModalOpen(false),
              orderNumber: updated.masterBillNumber,
              receiptNumber: `PROFORMA-${updated.masterBillNumber}`,
              orderType: 'COUNTER_SALE',
              tableNumber: null,
              seatingNote: `[PROFORMA - NOT FINAL] ${updated.token} (Round ${roundNum})`,
              createdAt: updated.lastUpdatedAt,
              serverName: updated.staffUser,
              customerName: updated.customerName || updated.token,
              customerPhone: updated.customerPhone,
              items: updated.items.map((it: any) => ({
                productName: `[R${it.roundNumber}] ${it.name}`,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                total: it.total,
                notes: it.notes,
              })),
              subtotal: updated.subtotal,
              discountAmount: updated.discountAmount,
              discountPercent: updated.discountPercent,
              tax: updated.vatAmount,
              serviceCharge: 0,
              total: updated.grandTotal,
              paymentMethod: 'UNPAID (OPEN TAB)',
              paymentStatus: 'UNPAID' as any,
            });
            setIsReceiptModalOpen(true);
          }

          setEditingOpenBill(null);
          setIsOpenOrder(false);
          setOpenOrderToken('');
          handleClearCart();
          refreshOpenOrders();
        }
        return;
      }

      // Case B: Brand new open order
      if (isTokenInUse(openOrderToken)) {
        toast.error('Token In Use', `"${openOrderToken}" already has an active open order. Please choose another token or reopen the existing one.`);
        return;
      }

      const created = saveOpenOrder({
        token: openOrderToken.trim(),
        source: openOrderSource,
        billType: openBillType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map((i, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          roundNumber: 1,
          addedAt: new Date().toISOString(),
          productId: i.productId,
          name: i.unit ? `${i.name} (${i.unit})` : i.name,
          category: i.category || 'Kitchen',
          unit: i.unit || 'Regular',
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          total: i.unitPrice * i.quantity,
          notes: i.remarks,
        })),
        subtotal: basicTotal,
        discountPercent: parsedDisPercent,
        discountAmount: effectiveDisAmt,
        taxableAmount: taxableAmount,
        vatPercent: isVatBill ? 13 : 0,
        vatAmount: vatAmount,
        roundOff: parsedRoundOff,
        grandTotal: netAmount,
        notes: billRemarks.trim() || undefined,
        staffUser: 'Counter Cashier',
      });

      toast.celebrate(
        'Open Order Saved (Save != Print)',
        `Bill #${created.masterBillNumber} saved for ${created.token}. Moved to Open Orders.`
      );

      if (shouldPrint) {
        setReceiptData({
          isOpen: true,
          onClose: () => setIsReceiptModalOpen(false),
          orderNumber: created.masterBillNumber,
          receiptNumber: `PROFORMA-${created.masterBillNumber}`,
          orderType: 'COUNTER_SALE',
          tableNumber: null,
          seatingNote: `[PROFORMA - NOT FINAL] ${created.token}`,
          createdAt: created.openedAt,
          serverName: created.staffUser,
          customerName: created.customerName || created.token,
          customerPhone: created.customerPhone,
          items: created.items.map((it: any) => ({
            productName: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            notes: it.notes,
          })),
          subtotal: created.subtotal,
          discountAmount: created.discountAmount,
          discountPercent: created.discountPercent,
          tax: created.vatAmount,
          serviceCharge: 0,
          total: created.grandTotal,
          paymentMethod: 'UNPAID (OPEN TAB)',
          paymentStatus: 'UNPAID' as any,
        });
        setIsReceiptModalOpen(true);
      }

      setIsOpenOrder(false);
      setOpenOrderToken('');
      handleClearCart();
      refreshOpenOrders();
      return;
    }

    // LANE 2: Unticked -> Normal quick bill
    await handleCompleteSale(shouldPrint);
  };

  const handleReopenOpenOrder = (bill: QuickBillRecord) => {
    setEditingOpenBill(bill);
    setIsOpenOrder(true);
    setOpenOrderToken(bill.token);
    setOpenOrderSource(bill.source);
    setOpenBillType(bill.billType);
    if (bill.customerName) setCustomerName(bill.customerName);
    if (bill.customerPhone) setCustomerPhone(bill.customerPhone);
    if (bill.notes) setBillRemarks(bill.notes);
    if (bill.discountPercent) setBillDisPercent(bill.discountPercent.toString());
    if (bill.discountAmount) setBillDisAmt(bill.discountAmount.toString());

    const loadedCart: QuickCartItem[] = bill.items.map((it, idx) => ({
      id: `open-item-${idx}-${it.id}`,
      productId: it.productId,
      name: it.name,
      unit: it.unit,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      remarks: it.notes,
      category: it.category,
      trackStock: false,
    }));
    setCart(loadedCart);
    setActiveOrderNumber(bill.masterBillNumber);
    toast.info(
      'Editing Open Order',
      `Loaded ${bill.token} (${bill.masterBillNumber}). Add more items and click Save to append round.`
    );
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSettleOpenOrderRow = (bill: QuickBillRecord) => {
    const paid = settleAndPrintBill(bill.id, {
      paymentMethod: billMode || 'CASH',
      paidAmount: bill.grandTotal,
      billType: bill.billType,
    });

    if (paid) {
      toast.celebrate(
        'Open Order Settled & Paid!',
        `Bill #${paid.masterBillNumber} (${paid.token}) settled for Rs. ${paid.grandTotal.toFixed(0)}.`
      );

      setReceiptData({
        isOpen: true,
        onClose: () => setIsReceiptModalOpen(false),
        orderNumber: paid.masterBillNumber,
        receiptNumber: paid.vatInvoiceNumber || `REC-${paid.masterBillNumber}`,
        orderType: 'COUNTER_SALE',
        tableNumber: null,
        seatingNote: paid.token,
        createdAt: paid.paidAt || new Date().toISOString(),
        serverName: paid.staffUser,
        customerName: paid.customerName || paid.token,
        customerPhone: paid.customerPhone,
        items: paid.items.map((it: any) => ({
          productName: `[R${it.roundNumber}] ${it.name}`,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          notes: it.notes,
        })),
        subtotal: paid.subtotal,
        discountAmount: paid.discountAmount,
        discountPercent: paid.discountPercent,
        tax: paid.vatAmount,
        serviceCharge: 0,
        total: paid.grandTotal,
        paidAmount: paid.paidAmount,
        changeDue: paid.changeDue,
        paymentMethod: paid.paymentMethod,
        paymentStatus: 'PAID',
      });
      setIsReceiptModalOpen(true);
      refreshOpenOrders();
      loadDailySales();
    }
  };

  const handleCancelOpenOrderRow = (bill: QuickBillRecord) => {
    const reason = window.prompt(`Cancel open order for ${bill.token} (${bill.masterBillNumber})?\nPlease enter cancellation reason:`, 'Customer cancelled order');
    if (reason !== null) {
      cancelOpenOrder(bill.id, reason || 'Cancelled by staff');
      toast.warning('Open Order Cancelled', `${bill.masterBillNumber} (${bill.token}) marked CANCELLED. Number preserved.`);
      refreshOpenOrders();
    }
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

    const isCreditSale = billMode === 'Credit' || billMode === 'CREDIT';

    // Credit Customer validation
    if (isCreditSale) {
      if (!selectedCreditCustomer) {
        toast.error('Credit Customer Required', 'Please select an eligible registered credit customer before confirming the bill.');
        return;
      }
      if (selectedCreditCustomer.creditStatus !== 'ACTIVE') {
        toast.error('Customer Blocked', `Customer "${selectedCreditCustomer.name}" is currently blocked from taking new credit.`);
        return;
      }
      if ((selectedCreditCustomer.creditLimit || 0) <= 0) {
        toast.error('Zero Credit Limit', `Customer "${selectedCreditCustomer.name}" has a credit limit of zero and cannot take credit.`);
        return;
      }
      const availCredit = Math.max(0, (selectedCreditCustomer.creditLimit || 0) - (selectedCreditCustomer.currentOutstanding || 0));
      if (netAmount > availCredit && !isManagerOverrideAllowed) {
        toast.error(
          'Credit Limit Exceeded',
          `Credit limit exceeded. Available credit: Rs. ${availCredit.toLocaleString()}.`
        );
        setShowOverrideDialog(true);
        return;
      }
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
        paymentMethod: isCreditSale ? 'CREDIT' : billMode,
        paidAmount: isCreditSale ? 0 : parsedPaidAmt,
        customerId: isCreditSale ? selectedCreditCustomer?.id : undefined,
        overrideLimit: isCreditSale ? isManagerOverrideAllowed : undefined,
        overrideReason: isCreditSale && isManagerOverrideAllowed ? overrideReason : undefined,
        discountPercent: parsedDisPercent > 0 ? parsedDisPercent : undefined,
        discountAmount: effectiveDisAmt > 0 ? effectiveDisAmt : undefined,
        tax: 0,
        serviceCharge: 0,
        serverName: 'Counter Cashier',
        customerName: isCreditSale ? selectedCreditCustomer?.name : (customerName.trim() || undefined),
        customerPhone: isCreditSale ? selectedCreditCustomer?.phone : (customerPhone.trim() || undefined),
        notes: billRemarks.trim() || undefined,
        sendToKitchen: false,
        outlet: 'RESTAURANT',
      };

      const result = await api.quickSale(payload);

      const savedOrderNumber = result.receipt?.orderNumber || activeOrderNumber;
      toast.celebrate(
        'Sale Completed Successfully!',
        isCreditSale
          ? `Bill #${savedOrderNumber} saved as CREDIT for ${selectedCreditCustomer?.name || 'Customer'} (Rs. ${netAmount.toFixed(0)}).`
          : `Bill #${savedOrderNumber} settled for Rs. ${netAmount.toFixed(0)} (${billMode}).`
      );

      // Assign VAT invoice number if VAT Bill
      let vatInvoiceNum: string | undefined = undefined;
      if (isVatBill) {
        try {
          vatInvoiceNum = getNextVatInvoiceNumber();
        } catch {
          vatInvoiceNum = `INV-${Date.now().toString().slice(-4)}`;
        }
      }

      // Prepare receipt data
      const receiptProps: ReceiptModalProps = {
        isOpen: true,
        onClose: () => setIsReceiptModalOpen(false),
        orderNumber: savedOrderNumber,
        receiptNumber: isVatBill && vatInvoiceNum ? vatInvoiceNum : `REC-${savedOrderNumber.replace('QS-', '').replace('ORD-', '')}`,
        orderType: 'COUNTER_SALE',
        tableNumber: null,
        seatingNote: isVatBill ? 'TAX INVOICE (VAT 13%) · Counter Takeaway' : 'Counter Takeaway',
        createdAt: new Date().toISOString(),
        serverName: 'Counter Cashier',
        customerName: isCreditSale && selectedCreditCustomer ? selectedCreditCustomer.name : (customerName.trim() || 'Walk-in Customer'),
        customerPhone: isCreditSale && selectedCreditCustomer ? selectedCreditCustomer.phone : (customerPhone.trim() || undefined),
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
        tax: isVatBill ? vatAmount : 0,
        serviceCharge: 0,
        total: netAmount,
        paidAmount: isCreditSale ? 0 : parsedPaidAmt,
        changeDue: isCreditSale ? 0 : changeDue,
        paymentMethod: isCreditSale ? 'CREDIT' : billMode,
        paymentStatus: isCreditSale ? 'CREDIT' : 'PAID',
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

      // Reset cart, tender and credit customer for next customer
      handleClearCart();
      setSelectedCreditCustomer(null);
      setCreditSearchQuery('');
      setIsManagerOverrideAllowed(false);
      setOverrideReason('');

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

          
          {/* Open Orders History Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowOpenOrders((prev) => !prev);
              setTimeout(() => {
                openOrdersRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-semibold shadow-2xs cursor-pointer transition-all',
              showOpenOrders
                ? 'bg-amber-600 text-white border border-amber-600'
                : 'border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-[#24352F] dark:text-white hover:bg-slate-50'
            )}
            title="Click to view open unpaid orders (Save != Print lane)"
          >
            <Clock className={cn('w-3.5 h-3.5', showOpenOrders ? 'text-white' : 'text-amber-500')} />
            <span>Open Orders</span>
            {openOrdersList.length > 0 && (
              <span
                className={cn(
                  'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  showOpenOrders
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                )}
              >
                {openOrdersList.length}
              </span>
            )}
          </button>

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
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-heading text-[#24352F] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
            <span>Add Order · Quick Sale</span>
          </h2>
        </div>

        {/* Search Input Bar with Instant Dropdown Suggestions Below */}
        <div ref={topSearchRef} className={cn('relative w-full max-w-sm sm:max-w-md', isSuggestionsOpen ? 'z-30' : 'z-10')}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879B90] pointer-events-none" />
            <input
              type="text"
              placeholder="search item & Add"
              value={orderProductName}
              onFocus={() => {
                setIsSuggestionsOpen(true);
                setDraftRows((prev) => prev.map((d) => ({ ...d, isOpen: false })));
              }}
              onClick={() => {
                setIsSuggestionsOpen(true);
                setDraftRows((prev) => prev.map((d) => ({ ...d, isOpen: false })));
              }}
              onChange={(e) => {
                setOrderProductName(e.target.value);
                setIsSuggestionsOpen(true);
                setDraftRows((prev) => prev.map((d) => ({ ...d, isOpen: false })));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (suggestions.length > 0) {
                    handleAddDirectMenuItem(suggestions[0]);
                  }
                }
              }}
              className="relative w-full rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#061D18] pl-9 pr-8 py-2.5 text-xs text-[#24352F] placeholder-[#879B90] dark:border-[#145447] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs transition-colors"
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

          {/* Suggestions Dropdown Appearing Directly Below Input (Exact Tabular Design matching Screenshot 1) */}
          {isSuggestionsOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 w-full max-w-[620px] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[4px] overflow-hidden animate-in fade-in-0 duration-75">
                {/* Teal Header Bar */}
                <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                  <span className="flex-1 min-w-[170px] text-left">ITEM</span>
                  <span className="w-36 text-left">GENERIC NAME</span>
                  <span className="w-24 text-right">RATE</span>
                  <span className="w-20 text-center">SRATE</span>
                  <span className="w-16 text-center">QTY</span>
                </div>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {suggestions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No menu items found for &quot;{orderProductName}&quot;
                    </div>
                  ) : (
                    suggestions.map((item) => {
                      const itemUnitMeta = resolveItemUnitInfo(item, menuCatalog);
                      const isMulti = itemUnitMeta.availableUnits && itemUnitMeta.availableUnits.length > 1;

                      return (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddDirectMenuItem(item);
                          }}
                          className={cn(
                            'px-2.5 py-2 flex items-center cursor-pointer transition-colors text-xs font-sans select-none',
                            'hover:bg-[#1E293B] hover:text-white text-slate-800 dark:text-slate-200 bg-white dark:bg-[#071F1A] group'
                          )}
                        >
                          <span className="flex-1 min-w-[170px] truncate font-medium text-left">
                            {item.name}
                          </span>
                          <span className="w-36 truncate text-left text-[11px] opacity-75">
                            {item.category || '-'}
                          </span>
                          <span
                            className={cn(
                              'w-24 text-right font-medium',
                              isMulti ? 'text-emerald-500 font-semibold text-[11px]' : 'font-mono'
                            )}
                          >
                            {isMulti ? `${itemUnitMeta.availableUnits?.length || 0} Sizes` : `Rs. ${item.price.toFixed(2)}`}
                          </span>
                          <span className="w-20 text-center text-[11px] opacity-90">
                            {isMulti ? (
                              <span className="px-2 py-0.5 rounded-[2px] bg-emerald-700 text-white text-[10px] font-bold">
                                Select
                              </span>
                            ) : (
                              item.portion || item.unit || '1'
                            )}
                          </span>
                          <span className="w-16 text-center font-mono opacity-75">
                            {item.stock !== undefined ? item.stock : '-'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Editing Open Order Notification Banner */}
      {editingOpenBill && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded mb-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px]">
              Editing Open Order
            </span>
            <span>
              <strong>{editingOpenBill.token}</strong> · Bill #{editingOpenBill.masterBillNumber} (Round {(editingOpenBill.currentRound || 1) + 1}). Add new items and click Save to update.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingOpenBill(null);
              setIsOpenOrder(false);
              setOpenOrderToken('');
              handleClearCart();
            }}
            className="px-2 py-0.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 hover:underline cursor-pointer"
          >
            Cancel Editing
          </button>
        </div>
      )}

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
                        <td className={cn('py-1 px-2 relative border-r border-slate-100 dark:border-slate-800/80', draft.isOpen && 'z-30')}>
                          <div className={cn('relative draft-row-container', draft.isOpen && 'z-30')}>
                            <input
                              type="text"
                              placeholder="search item & Add"
                              value={draft.search}
                              onChange={(e) => {
                                setIsSuggestionsOpen(false);
                                handleUpdateDraftSearch(draft.id, e.target.value);
                              }}
                              onFocus={() => {
                                setIsSuggestionsOpen(false);
                              }}
                              onClick={() => {
                                setIsSuggestionsOpen(false);
                                setDraftRows((prev) =>
                                  prev.map((d) => (d.id === draft.id ? { ...d, isOpen: true } : { ...d, isOpen: false }))
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
                              className={cn(
                                'relative w-full px-2 py-1 text-xs bg-white dark:bg-[#061D18] border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-slate-900 dark:text-white font-medium shadow-xs',
                                draft.isOpen && 'z-30'
                              )}
                            />

                            {/* Popover Table Directly Under Input (Matching Reference Screenshot) */}
                            {draft.isOpen && (
                              <div className="absolute left-0 top-full mt-1 z-30 w-[540px] max-w-[90vw] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[4px] overflow-hidden animate-in fade-in-0 duration-75">
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
        <div className="flex items-center justify-end gap-2 px-3.5 py-2 bg-slate-50/80 dark:bg-[#061D18] border-t border-slate-200 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Simple Checkbox: Open Order (exact left side of Save button) */}
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 mr-1">
              <input
                type="checkbox"
                checked={isOpenOrder}
                onChange={(e) => setIsOpenOrder(e.target.checked)}
                className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] rounded cursor-pointer"
              />
              <span>Open Order</span>
            </label>

            {isOpenOrder && (
              <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-150 mr-1">
                <input
                  type="text"
                  placeholder="Token / Chair # *"
                  value={openOrderToken}
                  onChange={(e) => setOpenOrderToken(e.target.value)}
                  className="px-2 py-1 text-xs border border-amber-400 dark:border-amber-600 rounded bg-white dark:bg-[#071F1A] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0B3D32] w-32 placeholder:text-slate-400"
                />
              </div>
            )}

            {/* 1. Save */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleSaveAction(false)}
              className={cn(
                'px-3.5 py-1.5 rounded-[3px] border font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed',
                isOpenOrder
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07241E] hover:bg-slate-50 dark:hover:bg-[#0c382f] text-slate-700 dark:text-slate-200'
              )}
              title={isOpenOrder ? 'Save as open order (Save ≠ Print)' : 'Save order'}
            >
              <Save className={cn('w-3.5 h-3.5', isOpenOrder ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isOpenOrder
                  ? editingOpenBill
                    ? 'Update Open Order'
                    : 'Save Open Order'
                  : 'Save'}
              </span>
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

          <div className="w-36">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Payment Mode
            </label>
            <select
              value={billMode}
              onChange={(e) => {
                const val = e.target.value;
                setBillMode(val);
                if (val === 'Credit') {
                  setSelectedCreditCustomer(null);
                  setIsCreditDropdownOpen(false);
                  setIsManagerOverrideAllowed(false);
                  setOverrideReason('');
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0B3D32] cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Wallet">Wallet</option>
              <option value="Credit">Credit</option>
              <option value="Charge to Room">Charge to Room (Hotel Guest)</option>
            </select>
          </div>

          {/* Credit Customer Selector: Exact right side of Payment Mode */}
          {billMode === 'Credit' && (
            <div className="w-52 sm:w-60 relative">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Credit Customer <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select customer..."
                  value={
                    selectedCreditCustomer
                      ? `${selectedCreditCustomer.name} (${selectedCreditCustomer.phone})`
                      : creditSearchQuery
                  }
                  onFocus={() => {
                    setIsCreditDropdownOpen(true);
                    if (selectedCreditCustomer) {
                      setCreditSearchQuery('');
                    }
                  }}
                  onClick={() => setIsCreditDropdownOpen(true)}
                  onChange={(e) => {
                    setSelectedCreditCustomer(null);
                    setCreditSearchQuery(e.target.value);
                    setIsCreditDropdownOpen(true);
                  }}
                  className={cn(
                    'w-full pl-2.5 pr-7 py-1.5 text-xs rounded-[3px] border bg-white dark:bg-[#061D18] text-slate-900 dark:text-white focus:outline-none shadow-2xs',
                    selectedCreditCustomer
                      ? 'border-emerald-500 font-semibold text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 focus:border-[#0B3D32]'
                  )}
                />
                {selectedCreditCustomer || creditSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCreditCustomer(null);
                      setCreditSearchQuery('');
                      setIsCreditDropdownOpen(false);
                      setIsManagerOverrideAllowed(false);
                      setOverrideReason('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear selected customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                )}
              </div>

              {/* Clean suggestions dropdown */}
              {isCreditDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30 cursor-default bg-transparent"
                    onClick={() => setIsCreditDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white dark:bg-[#061D18] border border-slate-200 dark:border-slate-700 rounded-[3px] shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {creditCustomers
                      .filter((c) => {
                        const q = creditSearchQuery.toLowerCase().trim();
                        const matches = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                        return matches && c.customerType === 'CREDIT' && c.creditStatus === 'ACTIVE';
                      })
                      .map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCreditCustomer(cust);
                            setCreditSearchQuery('');
                            setIsCreditDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-slate-50 dark:hover:bg-[#0E2E25] cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{cust.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{cust.phone}</span>
                        </div>
                      ))}
                    {creditCustomers.filter((c) => {
                      const q = creditSearchQuery.toLowerCase().trim();
                      const matches = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                      return matches && c.customerType === 'CREDIT' && c.creditStatus === 'ACTIVE';
                    }).length === 0 && (
                      <div className="p-2.5 text-center text-[11px] text-slate-400 italic">
                        No credit customers found
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Remarks / Notes - made small */}
          <div className="w-36 sm:w-44">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="Optional note..."
              value={billRemarks}
              onChange={(e) => setBillRemarks(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          {/* Billing Action Buttons: VAT Bill Checkbox, Settle Payment, Settle and Print */}
          <div className="ml-auto flex items-end gap-2.5">
            {/* VAT Bill Checkbox (Ticked = VAT Bill, Unticked = Normal Bill) */}
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 pb-1.5 mr-1">
              <input
                type="checkbox"
                checked={isVatBill}
                onChange={(e) => setOpenBillType(e.target.checked ? 'VAT' : 'NORMAL')}
                className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] rounded cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <span>VAT Bill</span>
                {isVatBill && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    13%
                  </span>
                )}
              </span>
            </label>

            {/* Settle Payment */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(false)}
              className="px-3.5 py-1.5 rounded-[3px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title={isVatBill ? 'Settle VAT invoice' : 'Settle payment'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Processing...' : 'Settle Payment'}</span>
            </button>

            {/* Settle & Print */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(true)}
              className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title={isVatBill ? 'Settle payment and print legal VAT invoice' : 'Settle payment and print receipt'}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Settle &amp; Print</span>
            </button>
          </div>
        </div>

        {/* Manager Override Modal */}
        {showOverrideDialog && selectedCreditCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Manager Credit Limit Override</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Customer <strong className="text-slate-900 dark:text-white">{selectedCreditCustomer.name}</strong> has available credit of Rs. {Math.max(0, (selectedCreditCustomer.creditLimit || 0) - (selectedCreditCustomer.currentOutstanding || 0)).toLocaleString()}. Current bill amount is Rs. {netAmount.toFixed(0)}.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Exceeding Limit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter manager authorization reason (e.g. Approved by Director for event)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowOverrideDialog(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!overrideReason.trim()}
                  onClick={() => {
                    setIsManagerOverrideAllowed(true);
                    setShowOverrideDialog(false);
                    toast.warning('Override Approved', 'Credit limit override granted for this transaction.');
                  }}
                  className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Approve Override
                </button>
              </div>
            </div>
          </div>
        )}

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
          OPEN ORDERS AREA (TAB / SEPARATE AREA FOR UNPAID OPEN BILLS)
          Columns: Bill # | Token/Customer | Items count | Total | Opened time | Time elapsed | Status | Actions
          ========================================================================= */}
      {(showOpenOrders || openOrdersList.length > 0) && (
        <div
          ref={openOrdersRef}
          className="rounded-[4px] border border-amber-300 dark:border-amber-900/70 bg-white dark:bg-[#071F1A] shadow-2xs overflow-hidden animate-in fade-in-50 duration-150"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-[#0d2a23]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h3 className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wider">
                Open Orders &amp; Active Tabs
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                {openOrdersList.length} Unpaid {openOrdersList.length === 1 ? 'Tab' : 'Tabs'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1 hidden sm:inline">
                (Save ≠ Print · Editable in multiple rounds)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter token or bill #..."
                  value={openOrderSearch}
                  onChange={(e) => setOpenOrderSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-xs border border-amber-300 dark:border-amber-800 rounded bg-white dark:bg-[#061D18] text-slate-900 dark:text-white focus:outline-none w-44"
                />
              </div>
              <button
                type="button"
                onClick={refreshOpenOrders}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 hover:bg-amber-50 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Refresh open orders"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOpenOrders(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title="Hide Open Orders"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredOpenOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active open orders matching filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-amber-200 dark:border-amber-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-amber-50/40 dark:bg-[#061D18]">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-amber-100 dark:border-amber-900/40">#</th>
                    <th className="py-2.5 px-3.5 text-left border-r border-amber-100 dark:border-amber-900/40">Bill #</th>
                    <th className="py-2.5 px-3.5 text-left border-r border-amber-100 dark:border-amber-900/40">Token / Chair</th>
                    <th className="py-2.5 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">Source</th>
                    <th className="py-2.5 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">Type</th>
                    <th className="py-2.5 px-3.5 text-center border-r border-amber-100 dark:border-amber-900/40">Items &amp; Rounds</th>
                    <th className="py-2.5 px-3.5 text-right border-r border-amber-100 dark:border-amber-900/40">Total</th>
                    <th className="py-2.5 px-3.5 text-left border-r border-amber-100 dark:border-amber-900/40">Opened / Elapsed</th>
                    <th className="py-2.5 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">Status</th>
                    <th className="py-2.5 px-3.5 text-right w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-amber-900/40">
                  {filteredOpenOrders.map((bill, index) => {
                    const elapsed = timeElapsed(bill.openedAt);
                    return (
                      <tr
                        key={bill.id}
                        className={cn(
                          'hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors',
                          editingOpenBill?.id === bill.id && 'bg-amber-100/60 dark:bg-amber-900/30'
                        )}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-amber-100 dark:border-amber-900/40">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-100 border-r border-amber-100 dark:border-amber-900/40">
                          {bill.masterBillNumber}
                        </td>
                        <td className="py-2 px-3.5 border-r border-amber-100 dark:border-amber-900/40">
                          <span className="font-bold text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/50">
                            {bill.token}
                          </span>
                          {bill.customerName && bill.customerName !== bill.token && (
                            <span className="text-[11px] text-slate-500 ml-1.5">({bill.customerName})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">
                          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                            {bill.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded',
                              bill.billType === 'VAT'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {bill.billType}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-center border-r border-amber-100 dark:border-amber-900/40">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {bill.items.reduce((s, it) => s + it.quantity, 0)} items
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono ml-1">
                            (R{bill.currentRound || 1})
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-amber-100 dark:border-amber-900/40">
                          Rs. {bill.grandTotal.toFixed(0)}
                        </td>
                        <td className="py-2 px-3.5 border-r border-amber-100 dark:border-amber-900/40">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{new Date(bill.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 font-medium ml-1">
                              ({elapsed})
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center border-r border-amber-100 dark:border-amber-900/40">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider animate-pulse">
                            OPEN
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-right space-x-1 whitespace-nowrap">
                          {/* Add items */}
                          <button
                            type="button"
                            onClick={() => handleReopenOpenOrder(bill)}
                            className="px-2 py-1 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Reopen order to add more items/rounds"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Items</span>
                          </button>
                          {/* Settle & Print */}
                          <button
                            type="button"
                            onClick={() => handleSettleOpenOrderRow(bill)}
                            className="px-2 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Settle payment and print final tax invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Settle</span>
                          </button>
                          {/* Cancel */}
                          <button
                            type="button"
                            onClick={() => handleCancelOpenOrderRow(bill)}
                            className="px-1.5 py-1 rounded-[3px] border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] transition-colors cursor-pointer"
                            title="Cancel open order"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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
                          <span className="text-[10px] text-slate-400 ml-1.5 opacity-80">┬╖ {formattedDate}</span>
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

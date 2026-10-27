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
  CheckCircle2,
  RotateCcw,
  ChefHat,
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
  const [menuCatalog, setMenuCatalog] = useState<MenuItemCatalogEntry[]>([]);
  const [posProducts, setPosProducts] = useState<POSProductData[]>([]);

  // Dedicated Billing Panel State (matching user reference screenshot)
  const [billDisPercent, setBillDisPercent] = useState<string>('');
  const [billDisAmt, setBillDisAmt] = useState<string>('');
  const [billRoundOff, setBillRoundOff] = useState<string>('0');
  const [billPaidAmt, setBillPaidAmt] = useState<string>('');
  const [billMode, setBillMode] = useState<string>('Cash');
  const [billRemarks, setBillRemarks] = useState<string>('');
  const [sendToKitchen, setSendToKitchen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Optional Customer Info (Never required for normal counter walk-in)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');

  // Category filter state for touch-friendly menu browsing
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(menuCatalog.map((m) => m.category).filter(Boolean)))];
  }, [menuCatalog]);

  const categoryFilteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return menuCatalog.slice(0, 18);
    }
    return menuCatalog.filter((m) => m.category === selectedCategory);
  }, [menuCatalog, selectedCategory]);

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

          setMenuCatalog(merged);
        }
      } catch (err) {
        console.warn('Could not load POS products from backend, using setted menu', err);
      }
    })();

    loadDailySales();
  }, []);

  const loadDailySales = async () => {
    setIsLoadingDailySales(true);
    try {
      const data = await api.getDailySales();
      if (data) {
        setDailySales(data);
      }
    } catch (err) {
      console.warn('Could not load daily sales summary', err);
    } finally {
      setIsLoadingDailySales(false);
    }
  };

  // Filtered autocomplete suggestions for the main search bar
  const suggestions = useMemo(() => {
    const q = orderProductName.toLowerCase().trim();
    if (!q) {
      return menuCatalog;
    }
    return menuCatalog.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
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

  // Add Item Directly from Search Autocomplete (1-Click)
  const handleAddDirectMenuItem = (menuItem: MenuItemCatalogEntry, qtyOverride?: number) => {
    const unitInfo = resolveItemUnitInfo(menuItem, menuCatalog);
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const price = menuItem.price;
    const qty = qtyOverride && qtyOverride > 0 ? qtyOverride : Math.max(1, orderQuantity);

    // Stock check for tracked items
    if (menuItem.trackStock && menuItem.stock !== undefined && menuItem.stock <= 0) {
      toast.error('Out of Stock', `"${name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.name.toLowerCase() === name.toLowerCase());

      if (menuItem.trackStock && menuItem.stock !== undefined) {
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty + qty > menuItem.stock) {
          toast.error('Stock Limit Reached', `Only ${menuItem.stock} units of "${name}" available in stock.`);
          return prev;
        }
      }

      if (existing) {
        return prev.map((i) =>
          i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
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
          unit: unitInfo.unit,
          availableUnits: unitInfo.availableUnits,
          unitPrice: price,
          quantity: qty,
          trackStock: menuItem.trackStock,
          stock: menuItem.stock,
        },
      ];
    });

    toast.success('Item Added', `${qty}x ${name} (Rs. ${price * qty}) added to Quick Sale.`);
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
      ...prev,
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
    const name = unitInfo.baseName || menuItem.baseName || menuItem.name.replace(/\s*\([^)]*\)$/, '').trim();
    const price = menuItem.price;
    const qty = 1;

    setCart((prev) => {
      const existing = prev.find((i) => i.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return prev.map((i) =>
          i.name.toLowerCase() === name.toLowerCase() ? { ...i, quantity: i.quantity + qty } : i
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
          unit: unitInfo.unit,
          availableUnits: unitInfo.availableUnits,
          unitPrice: price,
          quantity: qty,
          trackStock: menuItem.trackStock,
          stock: menuItem.stock,
        },
      ];
    });

    toast.success('Item Added', `${name} (Rs. ${price}) added to Quick Sale.`);
    setDraftRows((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Change order item unit/portion (e.g. Momo Half <-> Full)
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

        const newPrice = targetTier ? targetTier.price : i.unitPrice;
        const cleanBase = unitMeta.baseName || i.baseName || i.name.replace(/\s*\([^)]*\)$/, '').trim();

        toast.info('Unit Updated', `${cleanBase} set to ${newUnit} · Rs. ${newPrice}`);

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

  // ---------------------------------------------------------------------------
  // Complete Quick Sale & Settle
  // ---------------------------------------------------------------------------
  const handleCompleteSale = async (shouldPrint = false) => {
    if (cart.length === 0) {
      toast.error('Cart is Empty', 'Please add at least one item before completing the sale.');
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
        sendToKitchen,
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[3px] bg-[#FAFBF9] dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Service:</span>
            <span className="rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Quick Sale · Counter POS (Takeaway / Walk-In)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Order No:</span>
            <strong className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
              {activeOrderNumber}
            </strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Customer:</span>
            <strong className="font-bold text-[#24352F] dark:text-white">
              {customerName.trim() || 'Walk-in Customer'}
            </strong>
          </div>

          {customerPhone && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#64736C] dark:text-[#879B90]">Phone:</span>
              <strong className="font-mono font-bold text-[#24352F] dark:text-white">
                {customerPhone}
              </strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Details Optional Edit Button */}
          <button
            type="button"
            onClick={() => {
              setCustomerNameInput(customerName);
              setCustomerPhoneInput(customerPhone);
              setIsCustomerModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071F1A] text-[11px] font-bold text-[#0B3D32] dark:text-emerald-400 hover:bg-[#FAFBF9] dark:hover:bg-[#093027] transition-colors cursor-pointer shadow-2xs"
          >
            <Edit2 className="w-3 h-3" />
            <span>Customer Details (Optional)</span>
          </button>

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

          {/* Recent Bills History */}
          <button
            type="button"
            onClick={() => setIsDailySalesModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-[#24352F] dark:text-white hover:bg-slate-50 text-[11px] font-semibold shadow-2xs cursor-pointer"
          >
            <History className="w-3 h-3 text-slate-500" />
            <span>Recent Bills</span>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879B90]" />
            <input
              type="text"
              placeholder="search item & Add"
              value={orderProductName}
              onFocus={() => setIsSuggestionsOpen(true)}
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
              className="w-full rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#061D18] pl-9 pr-8 py-2.5 text-xs text-[#24352F] placeholder-[#879B90] dark:border-[#145447] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs transition-colors"
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
                  suggestions.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddDirectMenuItem(item);
                      }}
                      className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300">
                            {item.name}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-[2px] bg-slate-100 dark:bg-[#0E3B31] text-[#64736C] dark:text-[#A4B8AE]">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#879B90] flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-medium">{item.code}</span>
                          <span>·</span>
                          <span>{item.portion || '1 Portion'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                          Rs. {item.price.toFixed(0)}
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] group-hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors dark:bg-emerald-600 dark:group-hover:bg-emerald-500"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Touch-Friendly Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              )}
            >
              {cat === 'ALL' ? '🍽️ All Items' : cat}
            </button>
          );
        })}
      </div>

      {/* Quick-Pick Menu Item Cards (Large touch-friendly for counter staff) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {categoryFilteredItems.slice(0, 12).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleAddDirectMenuItem(item)}
            className="group flex flex-col justify-between p-2.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] hover:border-[#0B3D32] hover:shadow-xs transition-all text-left cursor-pointer min-h-[72px]"
          >
            <div className="min-w-0">
              <span className="block font-bold text-xs text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300 truncate">
                {item.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {item.portion || item.category || 'Standard'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                Rs. {item.price.toFixed(0)}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[#0B3D32] dark:text-emerald-300">
                + Add
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ===================================================================
          TOP SECTION: STRUCTURED ORDER TABLE (MATCHING EXACT TABLE ORDER LAYOUT)
          # | Particular | Unit | Rate | Qty | Amount | Status | Remarks | Add New
          =================================================================== */}
      <div
        className={cn(
          'border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-[#071F1A] shadow-2xs transition-all',
          draftRows.some((d) => d.isOpen) ? 'min-h-[380px] pb-32' : 'overflow-hidden'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#061D18]">
                <th className="py-2 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">#</th>
                <th className="py-2 px-3.5 text-left border-r border-slate-200 dark:border-slate-800">Particular</th>
                <th className="py-2 px-2.5 text-center w-28 border-r border-slate-200 dark:border-slate-800">Unit</th>
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

                        {/* Unit */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          {hasMultipleUnits ? (
                            <select
                              value={currentUnit}
                              onChange={(e) => handleUpdateItemUnit(item.id, e.target.value)}
                              className="w-full text-center rounded-[2px] border border-slate-200 bg-white dark:bg-[#061D18] dark:border-slate-700 py-0.5 px-1.5 text-xs text-[#0B3D32] dark:text-emerald-300 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                              title="Change portion / unit"
                            >
                              {unitMeta.availableUnits.map((u) => (
                                <option key={u.unit} value={u.unit}>
                                  {u.unit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded-[2px] text-[11px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {currentUnit || 'Standard'}
                            </span>
                          )}
                        </td>

                        {/* Rate (Styled with light grey background box matching screenshot) */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-800 dark:text-slate-200">
                            {item.unitPrice.toFixed(2)}
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
                          <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2.5 py-0.5 rounded-[2px] font-mono text-xs text-right text-slate-900 dark:text-white">
                            {itemAmount.toFixed(0)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          {sendToKitchen ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <ChefHat className="w-2.5 h-2.5" />
                              Kitchen KOT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Ready
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
                    const filteredDraftItems = menuCatalog.filter((item) => {
                      const q = draft.search.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.category.toLowerCase().includes(q) ||
                        item.code.toLowerCase().includes(q)
                      );
                    });

                    return (
                      <tr
                        key={draft.id}
                        className="border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#071F1A]"
                      >
                        {/* # Serial Number */}
                        <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800/80">
                          {cart.length + draftIdx + 1}
                        </td>

                        {/* Particular Input with Green Border & Autocomplete Popover */}
                        <td className="py-1 px-2 relative border-r border-slate-100 dark:border-slate-800/80">
                          <div className="relative">
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
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setDraftRows((prev) =>
                                    prev.map((d) =>
                                      d.id === draft.id
                                        ? {
                                            ...d,
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
                                        ? { ...d, selectedIndex: Math.max(0, d.selectedIndex - 1) }
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
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-[#061D18] border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-slate-900 dark:text-white font-medium"
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
                                <div className="absolute left-0 top-full mt-1 z-50 w-[520px] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[2px] overflow-hidden animate-in fade-in-0 duration-75">
                                  {/* Teal Header Bar */}
                                  <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                                    <span className="w-44 text-left">ITEM</span>
                                    <span className="w-32 text-left">GENERIC NAME</span>
                                    <span className="w-20 text-right">RATE</span>
                                    <span className="w-16 text-center">SRATE</span>
                                    <span className="w-12 text-center">QTY</span>
                                  </div>

                                  {/* Items List */}
                                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {filteredDraftItems.length === 0 ? (
                                      <div className="py-5 text-center text-xs text-slate-500">
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
                                              'px-2.5 py-1.5 flex items-center cursor-pointer transition-colors text-xs font-sans',
                                              isSelected
                                                ? 'bg-[#1E293B] text-white dark:bg-[#0E3B31]'
                                                : 'hover:bg-[#1E293B] hover:text-white text-slate-800 dark:text-slate-200 bg-white dark:bg-[#071F1A]'
                                            )}
                                          >
                                            <span className="w-44 truncate font-medium text-left">
                                              {item.name}
                                            </span>
                                            <span className="w-32 truncate text-left text-[11px] opacity-75">
                                              {item.category || '-'}
                                            </span>
                                            <span className="w-20 font-mono text-right">
                                              {item.price.toFixed(2)}
                                            </span>
                                            <span className="w-16 text-center text-[11px] opacity-75">
                                              {item.portion || '0'}
                                            </span>
                                            <span className="w-12 text-center font-mono opacity-75">
                                              0
                                            </span>
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
                            0
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

          {/* Kitchen KOT Toggle */}
          <div className="flex items-center gap-1.5 pb-2 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={sendToKitchen}
                onChange={(e) => setSendToKitchen(e.target.checked)}
                className="rounded text-[#0B3D32] focus:ring-[#0B3D32] cursor-pointer"
              />
              <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Send KOT</span>
            </label>
          </div>

          {/* Action Buttons: Complete Quick Sale & Settle and Print */}
          <div className="ml-auto flex items-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(false)}
              className="px-4 py-1.5 rounded-[4px] bg-[#28a745] hover:bg-[#218838] disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Processing...' : 'Complete Quick Sale'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={() => handleCompleteSale(true)}
              className="px-4 py-1.5 rounded-[4px] bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
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
          OPTIONAL WALK-IN CUSTOMER DETAILS MODAL (MATCHING TABLE ORDER MODAL)
          Never required for normal counter sales, but available if requested
          ========================================================================= */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Customer Details (Optional)
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  Optional for Quick Counter Sale
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerInfo}>
              <div className="p-5 space-y-3.5">
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <p className="font-semibold">Quick Counter Sales Do Not Require Registration</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Orders proceed smoothly as walk-in customers. Only enter details if customer specifically requests an invoice with their name or phone.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    CUSTOMER NAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    PHONE / MOBILE (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +977 9801234567"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  Save Details
                </button>
              </div>
            </form>
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

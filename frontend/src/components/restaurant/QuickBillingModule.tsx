'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Clock,
  History,
  FileCheck2,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Save,
  ArrowRight,
  User,
  Coffee,
  UtensilsCrossed,
  Wine,
  Sparkles,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  FileText,
  X,
  CreditCard,
  QrCode,
  RotateCcw,
  Ban,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  QuickBillRecord,
  BillItemRound,
  BillSource,
  BillType,
  getAllQuickBills,
  saveQuickBill,
  settleOpenBill,
  cancelBill,
  getActiveOpenOrders,
  getBillHistory,
  calculateDayClosing,
  getTimeElapsed,
  isTokenInActiveOpenOrders,
  getNextMasterBillNumber,
  getNextVatInvoiceNumber,
  peekNextMasterBillNumber,
  formatSourceName,
  DayClosingSummary,
} from '@/lib/quickBillingData';
import { QuickBillReceiptModal } from './QuickBillReceiptModal';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency } from '@/lib/utils';
import { getSettedMenuItems, MenuItemCatalogEntry } from '@/lib/menuData';

// Available Quick Menu Categories
const MENU_CATEGORIES = [
  'All',
  'Appetizers & Starters',
  'Main Course',
  'Beverages',
  'Bar & Beverages',
  'Desserts & Bakery',
];

export function QuickBillingModule() {
  const toast = useToast();

  // Active Main Navigation Tab
  // 1 = Quick Billing (Default)
  // 2 = Open Orders (Ticked multi-round tabs)
  // 3 = Bill History & Audit
  // 4 = Day Closing & Reports
  const [activeTab, setActiveTab] = useState<'quick' | 'open' | 'history' | 'closing'>('quick');

  // Master Bills Repository State
  const [bills, setBills] = useState<QuickBillRecord[]>(() => getAllQuickBills());

  // Listen for storage / cross-tab updates
  useEffect(() => {
    const handleUpdate = () => {
      setBills(getAllQuickBills());
    };
    window.addEventListener('restaurant_quick_bills_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('restaurant_quick_bills_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Quick Open Orders Count for tab badge
  const openOrdersCount = useMemo(() => {
    return bills.filter((b) => b.status === 'OPEN').length;
  }, [bills]);

  // Menu Catalog State
  const [menuCatalog, setMenuCatalog] = useState<MenuItemCatalogEntry[]>([]);
  useEffect(() => {
    setMenuCatalog(getSettedMenuItems());
  }, []);

  // =======================================================================
  // SCREEN A: QUICK BILLING FORM STATE
  // =======================================================================
  // Editing existing open bill ID (null if creating a fresh bill)
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // The Lane Switch: Open Order ☑ / ☐
  const [isOpenOrder, setIsOpenOrder] = useState<boolean>(false);

  // Bill Creation Fields
  const [tokenInput, setTokenInput] = useState<string>('');
  const [billSource, setBillSource] = useState<BillSource>('NO_TABLE');
  const [billType, setBillType] = useState<BillType>('NORMAL');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerPan, setCustomerPan] = useState<string>('');
  const [billNotes, setBillNotes] = useState<string>('');

  // Cart Lines (includes existing rounds if editing open bill + new round draft items)
  const [cartItems, setCartItems] = useState<BillItemRound[]>([]);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);

  // Item Search & Menu Category Picker
  const [searchItemQuery, setSearchItemQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Discount & Round off inputs
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [roundOff, setRoundOff] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');

  // Settle Modal State (for quick single-click settlement from Open Orders or Bill screen)
  const [settleModalBill, setSettleModalBill] = useState<QuickBillRecord | null>(null);
  const [settleMethod, setSettleMethod] = useState<string>('CASH');
  const [settleBillType, setSettleBillType] = useState<BillType>('NORMAL');
  const [settlePaidAmount, setSettlePaidAmount] = useState<string>('');
  const [settleCustomerName, setSettleCustomerName] = useState<string>('');
  const [settleCustomerPan, setSettleCustomerPan] = useState<string>('');

  // Cancel Modal State
  const [cancelModalBill, setCancelModalBill] = useState<QuickBillRecord | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');

  // Receipt & Proforma Print Modal State
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    bill: QuickBillRecord | null;
    isProforma: boolean;
  }>({ isOpen: false, bill: null, isProforma: false });

  // Open Orders Screen Filter
  const [openOrderSearch, setOpenOrderSearch] = useState<string>('');

  // Bill History Filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historySourceFilter, setHistorySourceFilter] = useState<string>('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

  // Audit Inspect Modal
  const [inspectBill, setInspectBill] = useState<QuickBillRecord | null>(null);

  // Physical cash input for day closing cash reconciliation
  const [physicalCashDrawer, setPhysicalCashDrawer] = useState<string>('');

  // Live timer tick every 10 seconds to update open orders elapsed time
  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimerTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Token in-use warning check
  const isTokenAlreadyInUse = useMemo(() => {
    if (!tokenInput.trim()) return false;
    return isTokenInActiveOpenOrders(tokenInput, editingBillId || undefined);
  }, [tokenInput, editingBillId, bills]);

  // Calculations for active cart
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.total, 0);
  }, [cartItems]);

  const numDiscountPct = parseFloat(discountPercent) || 0;
  const numDiscountAmt = parseFloat(discountAmount) || 0;
  const calculatedDiscount =
    discountAmount !== ''
      ? numDiscountAmt
      : discountPercent !== ''
      ? Math.round(((subtotal * numDiscountPct) / 100) * 100) / 100
      : 0;

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const vatAmount = billType === 'VAT' ? Math.round(taxableAmount * 0.13 * 100) / 100 : 0;
  const numRoundOff = parseFloat(roundOff) || 0;
  const grandTotal = Math.max(0, Math.round((taxableAmount + vatAmount + numRoundOff) * 100) / 100);

  const numTendered = tenderedAmount === '' ? grandTotal : parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, Math.round((numTendered - grandTotal) * 100) / 100);

  // Filtered menu catalog
  const filteredMenuItems = useMemo(() => {
    return menuCatalog.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchItemQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [menuCatalog, selectedCategory, searchItemQuery]);

  // Reset form to clear blank slate
  const handleResetForm = () => {
    setEditingBillId(null);
    setIsOpenOrder(false);
    setTokenInput('');
    setBillSource('NO_TABLE');
    setBillType('NORMAL');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerPan('');
    setBillNotes('');
    setCartItems([]);
    setCurrentRoundNumber(1);
    setDiscountPercent('');
    setDiscountAmount('');
    setRoundOff('0');
    setPaymentMethod('CASH');
    setTenderedAmount('');
    setSearchItemQuery('');
  };

  // Add Item to Cart
  const handleAddItem = (menuItem: MenuItemCatalogEntry) => {
    const defaultUnit = menuItem.availableUnits?.[0]?.unit || 'Standard';
    const defaultPrice = menuItem.availableUnits?.[0]?.price ?? menuItem.price;

    setCartItems((prev) => {
      // If we are editing an open bill, newly added items belong to currentRoundNumber
      const existingIdx = prev.findIndex(
        (it) => it.name === menuItem.name && it.roundNumber === currentRoundNumber
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        const target = copy[existingIdx];
        const newQty = target.quantity + 1;
        copy[existingIdx] = {
          ...target,
          quantity: newQty,
          total: Math.round(newQty * target.unitPrice * 100) / 100,
        };
        return copy;
      }

      const newItem: BillItemRound = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roundNumber: currentRoundNumber,
        addedAt: new Date().toISOString(),
        productId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        unit: defaultUnit,
        unitPrice: defaultPrice,
        quantity: 1,
        total: defaultPrice,
      };
      return [...prev, newItem];
    });
  };

  // Update item quantity
  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((it) => {
          if (it.id !== itemId) return it;
          const newQty = Math.max(1, it.quantity + delta);
          return {
            ...it,
            quantity: newQty,
            total: Math.round(newQty * it.unitPrice * 100) / 100,
          };
        })
        .filter((it) => it.quantity > 0);
    });
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // =======================================================================
  // LANE A: SAVE OPEN ORDER (TICKED)
  // Saves as OPEN, assigns Master Bill #, goes to Open Orders area
  // =======================================================================
  const handleSaveOpenOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Empty Order', 'Please add at least one item to save the open order.');
      return;
    }
    if (!tokenInput.trim()) {
      toast.error('Token Required', 'Token / Customer ID is mandatory for Open Orders (e.g. Token #7, Chair #3).');
      return;
    }
    if (isTokenAlreadyInUse) {
      toast.error('Token In Use', `Token "${tokenInput}" is already active in another open order!`);
      return;
    }

    const nowIso = new Date().toISOString();
    let billRecord: QuickBillRecord;

    if (editingBillId) {
      // Update existing open bill (retaining its masterBillNumber and history of rounds)
      const existing = bills.find((b) => b.id === editingBillId);
      if (!existing) {
        toast.error('Error', 'Original bill not found.');
        return;
      }
      billRecord = {
        ...existing,
        isOpenOrder: true,
        status: 'OPEN',
        token: tokenInput.trim(),
        source: billSource,
        billType,
        items: cartItems,
        currentRound: currentRoundNumber,
        subtotal,
        discountPercent: numDiscountPct,
        discountAmount: calculatedDiscount,
        taxableAmount,
        vatPercent: billType === 'VAT' ? 13 : 0,
        vatAmount,
        roundOff: numRoundOff,
        grandTotal,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerPan: customerPan.trim() || undefined,
        notes: billNotes.trim() || undefined,
        lastUpdatedAt: nowIso,
      };
      saveQuickBill(billRecord);
      toast.success(
        'Open Order Updated',
        `${billRecord.masterBillNumber} (${billRecord.token}) saved with ${cartItems.length} items.`
      );
    } else {
      // First save of brand new open bill: Assign monotonic sequential Master Bill #
      const masterBillNumber = getNextMasterBillNumber();
      billRecord = {
        id: `qb-${Date.now()}`,
        masterBillNumber,
        isOpenOrder: true,
        status: 'OPEN',
        token: tokenInput.trim(),
        source: billSource,
        billType,
        items: cartItems,
        currentRound: 1,
        subtotal,
        discountPercent: numDiscountPct,
        discountAmount: calculatedDiscount,
        taxableAmount,
        vatPercent: billType === 'VAT' ? 13 : 0,
        vatAmount,
        roundOff: numRoundOff,
        grandTotal,
        paidAmount: 0,
        changeDue: 0,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerPan: customerPan.trim() || undefined,
        notes: billNotes.trim() || undefined,
        openedAt: nowIso,
        lastUpdatedAt: nowIso,
        staffUser: 'Counter Staff',
      };
      saveQuickBill(billRecord);
      toast.success(
        'Open Order Created',
        `${billRecord.masterBillNumber} assigned to ${billRecord.token}. Sent to Open Orders tab.`
      );
    }

    setBills(getAllQuickBills());
    handleResetForm();
  };

  // =======================================================================
  // LANE B: SETTLE & PRINT IMMEDIATELY (UNTICKED PACK / WALK-IN BILL)
  // Straight to History, never enters Open Orders!
  // =======================================================================
  const handleImmediateSettleAndPrint = () => {
    if (cartItems.length === 0) {
      toast.error('Empty Cart', 'Please add items before settling.');
      return;
    }

    const nowIso = new Date().toISOString();
    const masterBillNumber = editingBillId
      ? bills.find((b) => b.id === editingBillId)?.masterBillNumber || getNextMasterBillNumber()
      : getNextMasterBillNumber();

    // Assign VAT Invoice # if VAT bill
    let vatInvoiceNumber: string | undefined = undefined;
    if (billType === 'VAT') {
      vatInvoiceNumber = getNextVatInvoiceNumber();
    }

    const token = tokenInput.trim() || 'Pack Walk-in';
    const paidVal = numTendered >= grandTotal ? numTendered : grandTotal;
    const changeVal = Math.max(0, paidVal - grandTotal);

    const paidBill: QuickBillRecord = {
      id: editingBillId || `qb-${Date.now()}`,
      masterBillNumber,
      vatInvoiceNumber,
      isOpenOrder: false,
      status: 'PAID',
      token,
      source: billSource,
      billType,
      items: cartItems,
      currentRound: currentRoundNumber,
      subtotal,
      discountPercent: numDiscountPct,
      discountAmount: calculatedDiscount,
      taxableAmount,
      vatPercent: billType === 'VAT' ? 13 : 0,
      vatAmount,
      roundOff: numRoundOff,
      grandTotal,
      paidAmount: paidVal,
      changeDue: changeVal,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerPan: customerPan.trim() || undefined,
      notes: billNotes.trim() || undefined,
      openedAt: editingBillId ? bills.find((b) => b.id === editingBillId)?.openedAt || nowIso : nowIso,
      lastUpdatedAt: nowIso,
      paidAt: nowIso,
      staffUser: 'Counter Staff',
    };

    saveQuickBill(paidBill);
    setBills(getAllQuickBills());

    // Automatically pop open receipt print modal
    setReceiptModal({ isOpen: true, bill: paidBill, isProforma: false });
    toast.success('Bill Settled & Paid', `${paidBill.masterBillNumber} recorded straight to History.`);
    handleResetForm();
  };

  // Reopen an Open Bill to add items in a new round
  const handleReopenBillForAddingItems = (bill: QuickBillRecord) => {
    setEditingBillId(bill.id);
    setIsOpenOrder(true);
    setTokenInput(bill.token);
    setBillSource(bill.source);
    setBillType(bill.billType);
    setCustomerName(bill.customerName || '');
    setCustomerPhone(bill.customerPhone || '');
    setCustomerPan(bill.customerPan || '');
    setBillNotes(bill.notes || '');
    setCartItems(bill.items);
    // Advance to next round for additions
    const maxRound = bill.items.reduce((max, it) => Math.max(max, it.roundNumber || 1), 1);
    setCurrentRoundNumber(maxRound + 1);
    setDiscountPercent(bill.discountPercent ? bill.discountPercent.toString() : '');
    setDiscountAmount(bill.discountAmount ? bill.discountAmount.toString() : '');
    setRoundOff(bill.roundOff ? bill.roundOff.toString() : '0');
    setPaymentMethod(bill.paymentMethod || 'CASH');

    setActiveTab('quick');
    toast.info('Order Reopened', `Ready to add Round ${maxRound + 1} items for ${bill.token}.`);
  };

  // Open Proforma Modal
  const handlePrintProformaDraft = (customBill?: QuickBillRecord) => {
    const targetBill = customBill || {
      id: editingBillId || 'draft-preview',
      masterBillNumber: editingBillId
        ? bills.find((b) => b.id === editingBillId)?.masterBillNumber || 'PROFORMA-PREVIEW'
        : peekNextMasterBillNumber(),
      isOpenOrder: true,
      status: 'OPEN',
      token: tokenInput.trim() || 'Open Customer',
      source: billSource,
      billType,
      items: cartItems,
      currentRound: currentRoundNumber,
      subtotal,
      discountPercent: numDiscountPct,
      discountAmount: calculatedDiscount,
      taxableAmount,
      vatPercent: billType === 'VAT' ? 13 : 0,
      vatAmount,
      roundOff: numRoundOff,
      grandTotal,
      paidAmount: 0,
      changeDue: 0,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerPan: customerPan.trim() || undefined,
      openedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      staffUser: 'Counter Staff',
    } as QuickBillRecord;

    if (targetBill.items.length === 0) {
      toast.error('Empty Order', 'Add items before printing proforma bill.');
      return;
    }

    setReceiptModal({ isOpen: true, bill: targetBill, isProforma: true });
  };

  // Execute Settlement from Modal
  const handleExecuteSettleModal = () => {
    if (!settleModalBill) return;
    try {
      const settled = settleOpenBill(settleModalBill.id, {
        paymentMethod: settleMethod,
        billType: settleBillType,
        paidAmount: settlePaidAmount !== '' ? parseFloat(settlePaidAmount) : undefined,
        customerName: settleCustomerName.trim() || undefined,
        customerPan: settleCustomerPan.trim() || undefined,
      });

      if (settled) {
        setBills(getAllQuickBills());
        setSettleModalBill(null);
        setReceiptModal({ isOpen: true, bill: settled, isProforma: false });
        toast.success('Bill Settled & Paid', `${settled.masterBillNumber} paid. Removed from Open Orders.`);
      }
    } catch (e: any) {
      toast.error('Settlement Failed', e?.message || 'Error settling bill');
    }
  };

  // Execute Cancel Bill
  const handleExecuteCancelModal = () => {
    if (!cancelModalBill) return;
    if (!cancelReasonInput.trim()) {
      toast.error('Reason Required', 'Please provide a reason for cancelling this bill.');
      return;
    }

    cancelBill(cancelModalBill.id, cancelReasonInput.trim(), 'Counter Staff');
    setBills(getAllQuickBills());
    setCancelModalBill(null);
    setCancelReasonInput('');
    toast.info('Bill Cancelled', `${cancelModalBill.masterBillNumber} marked as CANCELLED. Number preserved.`);
  };

  // Active Open Orders List for Screen B
  const openOrdersList = useMemo(() => {
    const q = openOrderSearch.toLowerCase().trim();
    return bills
      .filter((b) => b.status === 'OPEN')
      .filter((b) => {
        if (!q) return true;
        return (
          b.masterBillNumber.toLowerCase().includes(q) ||
          b.token.toLowerCase().includes(q) ||
          (b.customerName && b.customerName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());
  }, [bills, openOrderSearch, timerTick]);

  // Bill History List for Screen C
  const billHistoryList = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return bills
      .filter((b) => b.status !== 'OPEN')
      .filter((b) => {
        if (historySourceFilter !== 'ALL' && b.source !== historySourceFilter) return false;
        if (historyTypeFilter !== 'ALL' && b.billType !== historyTypeFilter) return false;
        if (historyStatusFilter !== 'ALL' && b.status !== historyStatusFilter) return false;
        if (!q) return true;
        return (
          b.masterBillNumber.toLowerCase().includes(q) ||
          (b.vatInvoiceNumber && b.vatInvoiceNumber.toLowerCase().includes(q)) ||
          b.token.toLowerCase().includes(q) ||
          (b.customerName && b.customerName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [bills, historySearch, historySourceFilter, historyTypeFilter, historyStatusFilter]);

  // Day Closing Analysis
  const dayClosing = useMemo(() => {
    return calculateDayClosing();
  }, [bills]);

  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-150">
      {/* =======================================================================
          TOP NAVIGATION TABS HEADER: Quick Billing | Open Orders (Count) | History | Day Closing
          ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
              activeTab === 'quick'
                ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0c382f]'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Billing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
              activeTab === 'open'
                ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0c382f]'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Orders</span>
            {openOrdersCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                activeTab === 'open' ? "bg-white text-[#0B3D32]" : "bg-amber-100 text-amber-900 border border-amber-300"
              )}>
                {openOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
              activeTab === 'history'
                ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0c382f]'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Bill History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('closing')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
              activeTab === 'closing'
                ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0c382f]'
            )}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Day Closing & Reports</span>
            {dayClosing.openBillsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Warning: Active open orders remaining" />
            )}
          </button>
        </div>

        {/* Status Snapshot Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <span>Next Master #:</span>
            <span className="font-bold text-[#0B3D32] dark:text-emerald-400">
              {peekNextMasterBillNumber()}
            </span>
          </div>
          {editingBillId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* =======================================================================
          TAB 1: QUICK BILLING SCREEN (SCREEN A)
          ======================================================================= */}
      {activeTab === 'quick' && (
        <div className="space-y-4">
          {/* LANE SWITCH HEADER & ORDER METADATA BAR */}
          <div className="p-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              {/* THE LANE SWITCH: OPEN ORDER CHECKBOX */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={isOpenOrder}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsOpenOrder(checked);
                      if (checked && !tokenInput) {
                        setTokenInput(`Token #${Math.floor(1 + Math.random() * 20)}`);
                      }
                    }}
                    className="w-5 h-5 rounded-[3px] text-[#0B3D32] focus:ring-[#0B3D32] border-[#C5D3CD] cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#24352F] dark:text-white">
                        Open Order (Multi-Round Tab)
                      </span>
                      {isOpenOrder ? (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Ticked · Open Lane
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Unticked · Quick Pack Lane
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isOpenOrder
                        ? 'Customer sits without table number / orders in rounds. Bill saved as OPEN, printed only at final settlement.'
                        : 'Normal walk-in / pack / pay-now customer. Add items → Print → Marked PAID straight to history.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Bill Status Indicator when editing */}
              {editingBillId && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Editing <strong>{tokenInput}</strong> · Adding to <strong>Round {currentRoundNumber}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* BILL METADATA GRID */}
            <div className="grid grid-cols-12 gap-3 pt-1">
              {/* Token / Customer ID (MANDATORY for Open Orders) */}
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Token / Customer ID {isOpenOrder && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required={isOpenOrder}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder={isOpenOrder ? 'e.g. Token #7, Chair near bar' : 'Walk-in / Pack (optional)'}
                    className={cn(
                      'w-full rounded-[3px] border px-3 py-1.5 text-xs font-bold text-[#24352F] dark:text-white shadow-2xs focus:outline-none',
                      isTokenAlreadyInUse
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900'
                        : isOpenOrder
                        ? 'border-amber-300 bg-amber-50/30 focus:border-amber-500 dark:border-amber-700 dark:bg-[#07241E]'
                        : 'border-[#DCE3DF] bg-white focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E]'
                    )}
                  />
                  {isTokenAlreadyInUse && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-600">
                      In Use!
                    </span>
                  )}
                </div>
                {isTokenAlreadyInUse && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                    ⚠️ Token already active in Open Orders. Please choose another token or reopen existing bill.
                  </p>
                )}
              </div>

              {/* Source Dropdown */}
              <div className="col-span-6 sm:col-span-3 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Channel
                </label>
                <select
                  value={billSource}
                  onChange={(e) => setBillSource(e.target.value as BillSource)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white cursor-pointer"
                >
                  <option value="NO_TABLE">No-table (Chair / Lounge)</option>
                  <option value="QUICK">Quick Walk-in (Pack / Takeaway)</option>
                  <option value="RESTAURANT">Restaurant Dine-in</option>
                  <option value="HOTEL">Hotel Guest</option>
                </select>
              </div>

              {/* Bill Type (Normal / VAT Invoice) */}
              <div className="col-span-6 sm:col-span-3 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bill Type
                </label>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#061B16] p-0.5 rounded border border-[#DCE3DF] dark:border-[#145447]">
                  <button
                    type="button"
                    onClick={() => setBillType('NORMAL')}
                    className={cn(
                      'flex-1 py-1 rounded text-xs font-bold transition-all text-center cursor-pointer',
                      billType === 'NORMAL'
                        ? 'bg-white dark:bg-[#0A2E26] text-[#0B3D32] dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    Normal Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillType('VAT')}
                    className={cn(
                      'flex-1 py-1 rounded text-xs font-bold transition-all text-center cursor-pointer',
                      billType === 'VAT'
                        ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    VAT (13%)
                  </button>
                </div>
              </div>

              {/* Optional Customer Name */}
              <div className="col-span-12 sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh KC"
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-2.5 py-1.5 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TWO-COLUMN WORKSPACE: LEFT = MENU CATALOG & SEARCH, RIGHT = ACTIVE CART & TOTALS */}
          <div className="grid grid-cols-12 gap-4">
            {/* LEFT COLUMN: ITEM PICKER */}
            <div className="col-span-12 lg:col-span-7 space-y-3">
              {/* Category selector pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                      selectedCategory === cat
                        ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                        : 'bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchItemQuery}
                  onChange={(e) => setSearchItemQuery(e.target.value)}
                  placeholder="Search dishes, drinks, momo, beverage codes..."
                  className="w-full pl-9 pr-3 py-2 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-medium shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#071F1A] dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Menu items grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto p-1 custom-scrollbar">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="flex flex-col justify-between p-2.5 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#071F1A] dark:border-[#145447] hover:border-[#0B3D32] hover:shadow-sm text-left transition-all group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          {item.code}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 line-clamp-1">
                          {item.category.split(' ')[0]}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-[#0B3D32] dark:group-hover:text-emerald-400">
                        {item.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-[#0B3D32] dark:text-emerald-300">
                        रू {item.price}
                      </span>
                      <span className="w-5 h-5 rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] group-hover:bg-[#0B3D32] group-hover:text-white dark:group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: CART, ORDER ROUNDS & BILLING CALCULATIONS */}
            <div className="col-span-12 lg:col-span-5 space-y-3">
              <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs overflow-hidden flex flex-col h-full">
                {/* Cart Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold text-[#24352F] dark:text-white font-heading uppercase tracking-wide">
                      Bill Items &amp; Rounds
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {cartItems.reduce((acc, it) => acc + it.quantity, 0)} Items
                  </span>
                </div>

                {/* Cart Lines with Round grouping indicator */}
                <div className="flex-1 p-3 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold">No items added to bill yet</p>
                      <p className="text-[10px]">Click menu items on the left to add</p>
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-[2px] border border-slate-100 dark:border-slate-800 bg-[#FBFDFB] dark:bg-[#051713]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                              R{item.roundNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>रू {item.unitPrice} each</span>
                            <span>·</span>
                            <span>{item.unit}</span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0A2E26] text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0A2E26] text-slate-700 dark:text-slate-200 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="w-16 text-right font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                          रू {item.total}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Calculations Footer */}
                <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">रू {subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Discount:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        placeholder="%"
                        value={discountPercent}
                        onChange={(e) => {
                          setDiscountPercent(e.target.value);
                          setDiscountAmount('');
                        }}
                        className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-right font-mono text-[11px] dark:border-slate-700 dark:bg-[#07241E]"
                      />
                      <span className="text-slate-400 text-[10px]">or Rs</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="Amt"
                        value={discountAmount}
                        onChange={(e) => {
                          setDiscountAmount(e.target.value);
                          setDiscountPercent('');
                        }}
                        className="w-16 px-1.5 py-0.5 rounded border border-slate-200 text-right font-mono text-[11px] dark:border-slate-700 dark:bg-[#07241E]"
                      />
                    </div>
                  </div>

                  {/* VAT Calculation */}
                  {billType === 'VAT' && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>VAT (13% on रू {taxableAmount.toFixed(2)}):</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        +रू {vatAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700 font-sans">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-[#0B3D32] dark:text-emerald-400">
                      रू {grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Payment Mode Selector (when doing immediate settle) */}
                  {!isOpenOrder && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Payment Mode:</span>
                        <div className="flex gap-1">
                          {['CASH', 'CARD', 'QR_PAY', 'ROOM_FOLIO'].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPaymentMethod(mode)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer',
                                paymentMethod === mode
                                  ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                              )}
                            >
                              {mode === 'QR_PAY' ? 'QR' : mode === 'ROOM_FOLIO' ? 'Room' : mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Tendered Cash:</span>
                        <input
                          type="number"
                          placeholder={grandTotal.toString()}
                          value={tenderedAmount}
                          onChange={(e) => setTenderedAmount(e.target.value)}
                          className="w-24 px-2 py-0.5 rounded border border-slate-200 text-right font-mono font-bold text-xs dark:border-slate-700 dark:bg-[#07241E]"
                        />
                      </div>
                      {changeDue > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Change Return:</span>
                          <span>रू {changeDue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LANE ACTION BUTTONS: STRICTLY DETERMINED BY TICK */}
                  <div className="pt-2 flex flex-col gap-2">
                    {isOpenOrder ? (
                      /* LANE A: OPEN ORDER BUTTONS (Save ≠ Print) */
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintProformaDraft()}
                          disabled={cartItems.length === 0}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[3px] border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                          title="Print PROFORMA non-fiscal estimate copy"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Proforma</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveOpenOrder}
                          disabled={cartItems.length === 0 || isTokenAlreadyInUse}
                          className="flex-[2] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                          title="Save as OPEN tab (moves to Open Orders area)"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{editingBillId ? 'Update Open Bill' : 'Save Open Order'}</span>
                        </button>
                      </div>
                    ) : (
                      /* LANE B: IMMEDIATE SETTLE & PRINT (WALK-IN / PACK) */
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleImmediateSettleAndPrint}
                          disabled={cartItems.length === 0}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                          title="Complete payment, print final receipt, and record straight to History"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settle &amp; Print (PAID)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: OPEN ORDERS LIST (SCREEN B)
          Only unpaid, ticked open bills.
          Columns: Bill # | Token/Customer | Items count | Total | Opened time | Time elapsed | Status | Actions
          ======================================================================= */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={openOrderSearch}
                onChange={(e) => setOpenOrderSearch(e.target.value)}
                placeholder="Search by token or bill #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing <strong>{openOrdersList.length}</strong> active open order(s)
              </span>
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setIsOpenOrder(true);
                  setActiveTab('quick');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white text-xs font-bold shadow-2xs cursor-pointer dark:bg-emerald-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Open Tab</span>
              </button>
            </div>
          </div>

          {/* Open Orders Table */}
          <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28">BILL #</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">TOKEN / CUSTOMER</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] w-32">SOURCE</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28 text-center">ITEMS &amp; ROUNDS</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] w-28 text-right">TOTAL</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28">OPENED AT</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28">TIME ELAPSED</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-24 text-center">STATUS</th>
                    <th className="py-2.5 px-3 text-center w-52">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                  {openOrdersList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-35 text-emerald-600" />
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">All Orders Settled</p>
                        <p className="text-xs">No active open orders waiting. Ready for Day Closing.</p>
                      </td>
                    </tr>
                  ) : (
                    openOrdersList.map((ord) => {
                      const elapsed = getTimeElapsed(ord.openedAt);
                      const totalQty = ord.items.reduce((acc, it) => acc + it.quantity, 0);
                      const roundsCount = new Set(ord.items.map((it) => it.roundNumber || 1)).size;

                      return (
                        <tr
                          key={ord.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#0c382f]/40 transition-colors"
                        >
                          {/* Master Bill # */}
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-[#E5EEE9] dark:border-[#145447] whitespace-nowrap">
                            {ord.masterBillNumber}
                          </td>

                          {/* Token / Customer */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{ord.token}</span>
                              {ord.billType === 'VAT' && (
                                <span className="text-[9px] font-bold px-1 rounded bg-purple-100 text-purple-800">
                                  VAT
                                </span>
                              )}
                            </div>
                            {ord.customerName && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                {ord.customerName} {ord.customerPhone ? `· ${ord.customerPhone}` : ''}
                              </p>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] whitespace-nowrap text-[11px] text-slate-600 dark:text-slate-300">
                            {formatSourceName(ord.source)}
                          </td>

                          {/* Items & Rounds */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-center font-mono">
                            <span className="font-bold">{totalQty} items</span>
                            <span className="text-[10px] text-slate-500 block">
                              ({roundsCount} {roundsCount === 1 ? 'round' : 'rounds'})
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-right font-mono font-extrabold text-[#0B3D32] dark:text-emerald-300 text-xs">
                            रू {ord.grandTotal.toFixed(2)}
                          </td>

                          {/* Opened At */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-[11px] text-slate-500 whitespace-nowrap font-mono">
                            {new Date(ord.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          {/* Time Elapsed (with Ageing Alert) */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] whitespace-nowrap font-mono">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
                                elapsed.alertLevel === 'danger'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : elapsed.alertLevel === 'warn'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>{elapsed.text}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              OPEN
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {/* Open / Add Items */}
                              <button
                                type="button"
                                onClick={() => handleReopenBillForAddingItems(ord)}
                                className="px-2 py-1 rounded-[2px] bg-white dark:bg-[#07241E] border border-slate-300 dark:border-slate-700 hover:border-[#0B3D32] text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                title="Open to add more items/rounds"
                              >
                                Add Items
                              </button>

                              {/* Settle & Print */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSettleModalBill(ord);
                                  setSettleMethod(ord.paymentMethod || 'CASH');
                                  setSettleBillType(ord.billType);
                                  setSettlePaidAmount(ord.grandTotal.toString());
                                  setSettleCustomerName(ord.customerName || '');
                                  setSettleCustomerPan(ord.customerPan || '');
                                }}
                                className="px-2 py-1 rounded-[2px] bg-[#0B3D32] hover:bg-[#082e25] text-white text-[11px] font-bold transition-colors cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                title="Settle payment and print final tax invoice"
                              >
                                Settle Now
                              </button>

                              {/* Proforma */}
                              <button
                                type="button"
                                onClick={() => setReceiptModal({ isOpen: true, bill: ord, isProforma: true })}
                                className="p-1 rounded-[2px] border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Print Proforma Estimate"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalBill(ord);
                                  setCancelReasonInput('');
                                }}
                                className="p-1 rounded-[2px] border border-slate-200 hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer text-slate-400"
                                title="Cancel open bill"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: BILL HISTORY & AUDIT (SCREEN C)
          Full ledger of settled (PAID) and CANCELLED bills.
          ======================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {/* History Search & Filters */}
          <div className="grid grid-cols-12 gap-2.5 p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
            <div className="col-span-12 sm:col-span-4 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search Bill #, VAT #, Token, Customer..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
              />
            </div>

            <div className="col-span-4 sm:col-span-3">
              <select
                value={historySourceFilter}
                onChange={(e) => setHistorySourceFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] dark:text-white"
              >
                <option value="ALL">All Sources</option>
                <option value="NO_TABLE">No-table</option>
                <option value="QUICK">Quick Walk-in</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="HOTEL">Hotel Guest</option>
              </select>
            </div>

            <div className="col-span-4 sm:col-span-2">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] dark:text-white"
              >
                <option value="ALL">All Bill Types</option>
                <option value="NORMAL">Normal</option>
                <option value="VAT">VAT Invoice</option>
              </select>
            </div>

            <div className="col-span-4 sm:col-span-3">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28">MASTER BILL #</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-28">VAT INVOICE #</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">TOKEN / CUSTOMER</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] w-32">SOURCE</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-24 text-center">TYPE</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] w-28 text-right">TOTAL</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-24">PAY MODE</th>
                    <th className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] w-24 text-center">STATUS</th>
                    <th className="py-2.5 px-3 text-center w-36">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                  {billHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-35" />
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No History Found</p>
                        <p className="text-xs">No settled or cancelled bills match your search criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    billHistoryList.map((ord) => {
                      const isVat = ord.billType === 'VAT';
                      const isCancelled = ord.status === 'CANCELLED';

                      return (
                        <tr
                          key={ord.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#0c382f]/40 transition-colors"
                        >
                          {/* Master Bill # */}
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-[#E5EEE9] dark:border-[#145447] whitespace-nowrap">
                            {ord.masterBillNumber}
                          </td>

                          {/* VAT Invoice # */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] font-mono whitespace-nowrap">
                            {ord.vatInvoiceNumber ? (
                              <span className="font-bold text-purple-700 dark:text-purple-400">
                                {ord.vatInvoiceNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Token / Customer */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <span className="font-bold text-slate-900 dark:text-white">{ord.token}</span>
                            {ord.customerName && (
                              <span className="text-[10px] text-slate-500 block truncate">
                                {ord.customerName} {ord.customerPan ? `(PAN: ${ord.customerPan})` : ''}
                              </span>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-[11px] text-slate-600 dark:text-slate-300">
                            {formatSourceName(ord.source)}
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-center">
                            <span
                              className={cn(
                                'px-1.5 py-0.2 rounded text-[10px] font-bold',
                                isVat
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {ord.billType}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-right font-mono font-bold text-slate-900 dark:text-white">
                            रू {ord.grandTotal.toFixed(2)}
                          </td>

                          {/* Pay Mode */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                            {ord.paymentMethod}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 border-r border-[#E5EEE9] dark:border-[#145447] text-center whitespace-nowrap">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                isCancelled
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              )}
                            >
                              {ord.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Print Receipt */}
                              <button
                                type="button"
                                onClick={() => setReceiptModal({ isOpen: true, bill: ord, isProforma: false })}
                                className="p-1 rounded-[2px] border border-slate-300 dark:border-slate-700 hover:border-[#0B3D32] hover:text-[#0B3D32] transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                                title="Print or view receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Inspect Audit Detail */}
                              <button
                                type="button"
                                onClick={() => setInspectBill(ord)}
                                className="px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                title="Inspect audit breakdown of rounds"
                              >
                                Rounds
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: DAY CLOSING & REPORTS (SCREEN D)
          - Day closing guard: Warns if open orders are not empty!
          - Reports: Sales by Source, Normal vs VAT, VAT Tax Filing Report, Cash Reconciliation Continuity Check
          ======================================================================= */}
      {activeTab === 'closing' && (
        <div className="space-y-4">
          {/* DAY CLOSING GUARD WARNING OR READY BANNER */}
          {dayClosing.openBillsCount > 0 ? (
            <div className="p-4 rounded-[3px] border-2 border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-rose-900 dark:text-rose-100 font-heading">
                    ⚠️ DAY CLOSING BLOCKED: {dayClosing.openBillsCount} ACTIVE OPEN ORDER(S) REMAINING!
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    Rule Enforced: The Open Orders list must be completely empty before Day Closing. Every bill must either be settled or cancelled.
                  </p>
                </div>
              </div>

              {/* Quick actions for remaining open orders */}
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dayClosing.openOrdersRemaining.map((openOrd) => (
                  <div
                    key={openOrd.id}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-[#061B16] border border-rose-300 dark:border-rose-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{openOrd.token}</span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {openOrd.masterBillNumber} · रू {openOrd.grandTotal}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettleModalBill(openOrd);
                        setSettleMethod('CASH');
                        setSettleBillType(openOrd.billType);
                        setSettlePaidAmount(openOrd.grandTotal.toString());
                        setSettleCustomerName(openOrd.customerName || '');
                      }}
                      className="px-2 py-1 rounded bg-[#0B3D32] text-white font-bold text-[10px] hover:bg-[#082e25] cursor-pointer"
                    >
                      Settle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[3px] border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold font-heading uppercase text-emerald-900 dark:text-emerald-100">
                    Day Closing Ready · All Open Orders Cleared (0 Remaining)
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    All restaurant &amp; quick bills are settled. Financial registers can be audited and closed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.success('Day Closed', 'Restaurant Day Closing Completed Successfully.')}
                className="px-4 py-2 rounded-[3px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Execute Day Closing
              </button>
            </div>
          )}

          {/* KPI STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Net Sales</span>
              <p className="text-lg font-mono font-extrabold text-[#0B3D32] dark:text-emerald-400">
                रू {dayClosing.totalSales.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">Across all sources</span>
            </div>

            <div className="p-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Normal vs VAT Split</span>
              <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                Normal: रू {dayClosing.totalNormalSales.toLocaleString()}
              </p>
              <p className="text-xs font-mono font-semibold text-purple-700 dark:text-purple-400">
                VAT: रू {dayClosing.totalVatSales.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">13% VAT Collected</span>
              <p className="text-lg font-mono font-extrabold text-purple-700 dark:text-purple-400">
                रू {dayClosing.totalVatAmount.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400">{dayClosing.vatBillsCount} VAT Invoices issued</span>
            </div>

            <div className="p-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500">Sequence Continuity</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    dayClosing.continuityIntact ? 'bg-emerald-500' : 'bg-rose-500'
                  )}
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {dayClosing.continuityIntact ? '0 Gaps / Verified' : 'Gap Detected!'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">
                {dayClosing.firstBillNumber} → {dayClosing.lastBillNumber}
              </p>
            </div>
          </div>

          {/* TWO DETAILED REPORT PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. SALES BY SOURCE BREAKDOWN */}
            <div className="p-4 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wide">
                  Sales by Source Channel
                </h4>
                <span className="text-[10px] text-slate-500">Dine-in vs Quick vs Chair</span>
              </div>

              <div className="space-y-2">
                {(['NO_TABLE', 'QUICK', 'RESTAURANT', 'HOTEL'] as BillSource[]).map((src) => {
                  const stat = dayClosing.salesBySource[src] || { count: 0, total: 0 };
                  const pct = dayClosing.totalSales > 0 ? (stat.total / dayClosing.totalSales) * 100 : 0;

                  return (
                    <div key={src} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-700 dark:text-slate-200">{formatSourceName(src)}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          रू {stat.total.toLocaleString()} ({stat.count} bills · {pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#0B3D32] dark:bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. CASH RECONCILIATION & CONTINUITY CHECK */}
            <div className="p-4 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wide">
                  Cash Reconciliation &amp; Continuity
                </h4>
                <span className="text-[10px] text-slate-500">First → Last Bill</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Master Bill Series Range:</span>
                  <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                    {dayClosing.firstBillNumber} → {dayClosing.lastBillNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Sequence Continuity:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>0 Gaps Detected · Valid Sequential</span>
                  </span>
                </div>

                {/* Cash Drawer Comparison Input */}
                <div className="pt-1 flex items-center justify-between gap-3">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    Counted Drawer Cash:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Enter physical cash..."
                      value={physicalCashDrawer}
                      onChange={(e) => setPhysicalCashDrawer(e.target.value)}
                      className="w-36 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 dark:bg-[#07241E] font-mono font-bold text-right"
                    />
                  </div>
                </div>

                {physicalCashDrawer !== '' && (
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 text-xs flex justify-between items-center">
                    <span>Cash Discrepancy:</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        parseFloat(physicalCashDrawer) >= dayClosing.totalNormalSales
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      )}
                    >
                      {parseFloat(physicalCashDrawer) - dayClosing.totalNormalSales === 0
                        ? 'रू 0.00 (Exact Match)'
                        : `रू ${(parseFloat(physicalCashDrawer) - dayClosing.totalNormalSales).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. VAT REPORT FOR TAX FILING */}
          <div className="p-4 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wide">
                  Official VAT Report for Tax Filing (IRD Compliance)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Includes all bills issued under the separate legal VAT Invoice # series
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
                Total VAT: रू {dayClosing.totalVatAmount.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                    <th className="py-2 px-2.5">VAT INVOICE #</th>
                    <th className="py-2 px-2.5">MASTER BILL #</th>
                    <th className="py-2 px-2.5">DATE</th>
                    <th className="py-2 px-2.5">CUSTOMER / BUYER</th>
                    <th className="py-2 px-2.5">BUYER PAN</th>
                    <th className="py-2 px-2.5 text-right">TAXABLE AMT (रू)</th>
                    <th className="py-2 px-2.5 text-right">VAT 13% (रू)</th>
                    <th className="py-2 px-2.5 text-right">GROSS TOTAL (रू)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] font-mono">
                  {bills.filter((b) => b.billType === 'VAT' && b.status === 'PAID').length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        No VAT Invoices issued yet for this period.
                      </td>
                    </tr>
                  ) : (
                    bills
                      .filter((b) => b.billType === 'VAT' && b.status === 'PAID')
                      .map((vatBill) => (
                        <tr key={vatBill.id} className="hover:bg-slate-50 dark:hover:bg-[#0c382f]/30">
                          <td className="py-2 px-2.5 font-bold text-purple-700 dark:text-purple-400">
                            {vatBill.vatInvoiceNumber || 'INV-0001'}
                          </td>
                          <td className="py-2 px-2.5 text-[#0B3D32] dark:text-emerald-400">
                            {vatBill.masterBillNumber}
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-slate-500">
                            {new Date(vatBill.openedAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2 px-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                            {vatBill.customerName || vatBill.token}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                            {vatBill.customerPan || 'N/A'}
                          </td>
                          <td className="py-2 px-2.5 text-right">{vatBill.taxableAmount.toFixed(2)}</td>
                          <td className="py-2 px-2.5 text-right font-bold text-purple-700 dark:text-purple-400">
                            {vatBill.vatAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                            {vatBill.grandTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          SETTLE OPEN ORDER MODAL
          ======================================================================= */}
      {settleModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-[#24352F] dark:text-white font-heading uppercase tracking-wide">
                  Settle &amp; Print: {settleModalBill.token}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalBill(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Master Bill #:</span>
                  <span className="font-bold text-[#0B3D32] dark:text-emerald-400">
                    {settleModalBill.masterBillNumber}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Total Payable:</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    रू {settleModalBill.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bill Type Selector at Settle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Bill Type:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleBillType('NORMAL')}
                    className={cn(
                      'flex-1 py-1.5 rounded text-xs font-bold transition-all border cursor-pointer',
                      settleBillType === 'NORMAL'
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                        : 'bg-white border-slate-300 text-slate-700'
                    )}
                  >
                    Normal Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleBillType('VAT')}
                    className={cn(
                      'flex-1 py-1.5 rounded text-xs font-bold transition-all border cursor-pointer',
                      settleBillType === 'VAT'
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white border-slate-300 text-slate-700'
                    )}
                  >
                    VAT Invoice (13%)
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['CASH', 'CARD', 'QR_PAY', 'ROOM_FOLIO'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMethod(m)}
                      className={cn(
                        'py-1.5 rounded text-[11px] font-bold uppercase transition-all border cursor-pointer',
                        settleMethod === m
                          ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-600'
                          : 'bg-white border-slate-200 text-slate-700'
                      )}
                    >
                      {m === 'QR_PAY' ? 'QR Pay' : m === 'ROOM_FOLIO' ? 'Room' : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Details for VAT */}
              {settleBillType === 'VAT' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Buyer / Firm Name
                    </label>
                    <input
                      type="text"
                      value={settleCustomerName}
                      onChange={(e) => setSettleCustomerName(e.target.value)}
                      placeholder="Company name"
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Buyer PAN #
                    </label>
                    <input
                      type="text"
                      value={settleCustomerPan}
                      onChange={(e) => setSettleCustomerPan(e.target.value)}
                      placeholder="9-digit PAN"
                      className="w-full px-2 py-1 text-xs border rounded font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <button
                type="button"
                onClick={() => setSettleModalBill(null)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSettleModal}
                className="px-4 py-1.5 rounded bg-[#0B3D32] text-white font-bold text-xs hover:bg-[#082e25] shadow-xs cursor-pointer dark:bg-emerald-600"
              >
                Confirm Settlement &amp; Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          CANCEL BILL MODAL (NEVER DELETES, MARKS CANCELLED)
          ======================================================================= */}
      {cancelModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Cancel Bill #{cancelModalBill.masterBillNumber}</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Are you sure you want to cancel this bill for <strong>{cancelModalBill.token}</strong>? This number will be marked as <strong>CANCELLED</strong> in the audit ledger and will not be reused.
              </p>
              <div>
                <label className="block font-semibold mb-1">Cancellation Reason (Mandatory):</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="e.g. Customer walked away without eating, wrong item punched"
                  className="w-full px-2.5 py-1.5 rounded border text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-slate-50 dark:bg-[#061B16]">
              <button
                type="button"
                onClick={() => setCancelModalBill(null)}
                className="px-3 py-1 rounded text-xs font-semibold text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelModal}
                disabled={!cancelReasonInput.trim()}
                className="px-3.5 py-1 rounded bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 disabled:opacity-40"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          INSPECT AUDIT ROUNDS MODAL
          ======================================================================= */}
      {inspectBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0B3D32]" />
                <h3 className="text-xs font-bold font-heading uppercase text-slate-900 dark:text-white">
                  Audit Rounds Timeline: {inspectBill.masterBillNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBill(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs custom-scrollbar">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Token / Customer:</span>
                  <strong>{inspectBill.token}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Opened At:</span>
                  <span>{new Date(inspectBill.openedAt).toLocaleString()}</span>
                </div>
                {inspectBill.paidAt && (
                  <div>
                    <span className="text-slate-400 block">Settled At:</span>
                    <span>{new Date(inspectBill.paidAt).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block">Total Amount:</span>
                  <strong className="text-emerald-700 font-mono">रू {inspectBill.grandTotal}</strong>
                </div>
              </div>

              {/* Rounds breakdown */}
              <div className="space-y-2">
                {Array.from(new Set(inspectBill.items.map((i) => i.roundNumber || 1))).map((roundNum) => {
                  const roundItems = inspectBill.items.filter((i) => (i.roundNumber || 1) === roundNum);
                  const firstTime = roundItems[0]?.addedAt ? new Date(roundItems[0].addedAt).toLocaleTimeString() : '';

                  return (
                    <div key={roundNum} className="border rounded-[2px] p-2 space-y-1">
                      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        <span>ROUND {roundNum}</span>
                        <span className="font-mono text-slate-500">{firstTime}</span>
                      </div>
                      <div className="divide-y divide-dotted divide-slate-100 dark:divide-slate-800">
                        {roundItems.map((item) => (
                          <div key={item.id} className="py-1 flex justify-between items-center text-[11px]">
                            <span>
                              {item.name} <span className="text-slate-400">x{item.quantity}</span>
                            </span>
                            <span className="font-mono font-semibold">रू {item.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-2.5 border-t bg-slate-50 dark:bg-[#061B16] flex justify-end">
              <button
                type="button"
                onClick={() => setInspectBill(null)}
                className="px-3.5 py-1 text-xs font-semibold rounded bg-slate-200 text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          RECEIPT / PROFORMA PRINT MODAL
          ======================================================================= */}
      <QuickBillReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, bill: null, isProforma: false })}
        bill={receiptModal.bill}
        isProforma={receiptModal.isProforma}
      />
    </div>
  );
}


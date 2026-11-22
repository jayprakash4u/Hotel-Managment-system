'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Eye,
  Printer,
  Receipt,
  Table2,
  Armchair,
  ShoppingBag,
  Clock,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  User,
  Phone,
  Bike,
  Plus,
  Trash2,
  ChefHat,
  Wine,
  BedDouble,
} from 'lucide-react';
import { ActiveRestaurantOrderData } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
  getOpenOrders,
  settleAndPrintBill,
  cancelOpenOrder,
  QuickBillRecord,
} from '@/lib/quickBillingData';
import { useToast } from '@/components/ui/Toast';

export interface ActiveOrdersViewProps {
  orders: ActiveRestaurantOrderData[];
  isLoading: boolean;
  initialFilter?: 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'OPEN_ORDERS';
  onRefresh: () => void;
  onOpenOrder: (order: ActiveRestaurantOrderData) => void;
  onGenerateBill: (order: ActiveRestaurantOrderData) => void;
  onPrintReceipt: (order: ActiveRestaurantOrderData) => void;
  onAssignTable: (order: ActiveRestaurantOrderData) => void;
  onNewTableOrder: () => void;
  onNewNoTableOrder: () => void;
  onNewOnlineOrder?: () => void;
}

type SortField = 'sn' | 'orderNumber' | 'ticket' | 'table' | 'customer' | 'items' | 'total' | 'status' | 'payment' | 'time';

const isGenericLabel = (str: string) => {
  return /^(takeaway\s*(customer|order)?|online\s*(customer|order)?|walk-in\s*(customer|guest)?|dine-in\s*(guest|order)?|delivery\s*(customer|order)?)$/i.test(
    str.trim()
  );
};

export const isBeverageCategory = (cat?: string, name?: string) => {
  const c = (cat || '').toLowerCase();
  const n = (name || '').toLowerCase();
  return (
    c.includes('drink') ||
    c.includes('beverage') ||
    c.includes('bar') ||
    c.includes('wine') ||
    c.includes('beer') ||
    c.includes('cocktail') ||
    c.includes('liquor') ||
    c.includes('juice') ||
    c.includes('whiskey') ||
    c.includes('whisky') ||
    c.includes('vodka') ||
    c.includes('rum') ||
    c.includes('gin') ||
    c.includes('mocktail') ||
    c.includes('coffee') ||
    c.includes('tea') ||
    n.includes('beer') ||
    n.includes('wine') ||
    n.includes('carlsberg') ||
    n.includes('tuborg') ||
    n.includes('coke') ||
    n.includes('sprite') ||
    n.includes('fanta') ||
    n.includes('soda') ||
    n.includes('water') ||
    n.includes('whisky') ||
    n.includes('vodka') ||
    n.includes('rum') ||
    n.includes('cocktail') ||
    n.includes('mocktail')
  );
};

export const getOrderDepartmentInfo = (ord: ActiveRestaurantOrderData) => {
  const items = ord.items || [];
  let hasKot = Boolean(ord.kotNumber);
  let hasBot = Boolean(ord.botNumber);

  for (const it of items) {
    const dept = (it as any).department;
    if (dept === 'BOT' || it.botNumber) {
      hasBot = true;
    } else if (dept === 'KOT' || it.kotNumber) {
      hasKot = true;
    } else if (isBeverageCategory((it as any).category, it.productName)) {
      hasBot = true;
    } else {
      hasKot = true;
    }
  }

  // If no items yet or neither explicitly detected
  if (!hasKot && !hasBot) {
    if (ord.botNumber) hasBot = true;
    else hasKot = true;
  }

  return {
    hasKot,
    hasBot,
    isBoth: hasKot && hasBot,
    isKotOnly: hasKot && !hasBot,
    isBotOnly: !hasKot && hasBot,
    kotNumber: ord.kotNumber,
    botNumber: ord.botNumber,
  };
};

export const getCustomerInfo = (ord: ActiveRestaurantOrderData) => {
  // 1. Explicit customerName from order entity
  if (ord.customerName && ord.customerName.trim() && !isGenericLabel(ord.customerName)) {
    return {
      name: ord.customerName.trim(),
      phone: ord.customerPhone?.trim() || ord.guest?.phone?.trim() || null,
      isRegisteredGuest: false,
    };
  }

  // 2. Hotel guest profile
  if (ord.guest && (ord.guest.firstName || ord.guest.lastName)) {
    const fullName = `${ord.guest.firstName || ''} ${ord.guest.lastName || ''}`.trim();
    if (fullName) {
      return {
        name: fullName,
        phone: ord.guest.phone?.trim() || null,
        isRegisteredGuest: true,
      };
    }
  }

  // 3. Extract from notes if formatted (e.g. "Guest: Rahul | Phone: 9800000000")
  if (ord.notes) {
    const nameMatch = ord.notes.match(/(?:Guest|Customer)\s*:\s*([^|\n,]+)/i);
    const phoneMatch = ord.notes.match(/(?:Phone)\s*:\s*([^|\n,]+)/i);
    if (nameMatch && nameMatch[1]?.trim() && !isGenericLabel(nameMatch[1].trim())) {
      return {
        name: nameMatch[1].trim(),
        phone: phoneMatch ? phoneMatch[1].trim() : ord.customerPhone?.trim() || null,
        isRegisteredGuest: false,
      };
    }
  }

  // 4. Default clean fallback
  return {
    name: 'Walk-in Customer',
    phone: ord.customerPhone?.trim() || null,
    isRegisteredGuest: false,
  };
};

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  orders,
  isLoading,
  initialFilter = 'ALL',
  onRefresh,
  onOpenOrder,
  onGenerateBill,
  onPrintReceipt,
  onAssignTable,
  onNewTableOrder,
  onNewNoTableOrder,
  onNewOnlineOrder,
}) => {
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<
    'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'OPEN_ORDERS'
  >(initialFilter);
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'KOT' | 'BOT' | 'BOTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');

  // Sync initialFilter prop if it changes via URL
  useEffect(() => {
    if (initialFilter) {
      setServiceTypeFilter(initialFilter);
    }
  }, [initialFilter]);

  // Quick Billing LocalStorage Open Orders (Running Tabs)
  const [quickOpenBills, setQuickOpenBills] = useState<QuickBillRecord[]>([]);

  const refreshQuickOpenBills = () => {
    try {
      setQuickOpenBills(getOpenOrders());
    } catch (e) {
      console.warn('Could not read open quick bills', e);
    }
  };

  useEffect(() => {
    refreshQuickOpenBills();
    const handleSync = () => refreshQuickOpenBills();
    if (typeof window !== 'undefined') {
      window.addEventListener('restaurant_quick_bills_updated', handleSync);
      return () => window.removeEventListener('restaurant_quick_bills_updated', handleSync);
    }
  }, []);

  // Convert QuickBillRecord to ActiveRestaurantOrderData
  const convertedQuickOrders = useMemo(() => {
    return quickOpenBills.map((b): ActiveRestaurantOrderData & { isQuickBill?: boolean; rawQuickBill?: QuickBillRecord } => ({
      id: b.id,
      orderNumber: b.masterBillNumber,
      kotNumber: b.token,
      outlet: 'RESTAURANT',
      tableId: null,
      status: 'RECEIVED',
      orderType: 'COUNTER_SALE',
      serverName: b.staffUser || 'Cashier',
      subtotal: b.subtotal,
      discountAmount: b.discountAmount || 0,
      discountPercent: b.discountPercent || 0,
      tax: b.vatAmount || 0,
      serviceCharge: 0,
      total: b.grandTotal,
      paymentMethod: b.paymentMethod || null,
      isPaid: false,
      notes: b.notes || `Open Tab (${b.token}) · Round ${b.currentRound || 1}`,
      customerName: b.customerName || b.token,
      customerPhone: b.customerPhone || null,
      createdAt: b.openedAt,
      updatedAt: b.lastUpdatedAt,
      items: (b.items || []).map((it, idx) => ({
        id: `it-${idx}-${it.id}`,
        productId: it.productId,
        productName: `[R${it.roundNumber || 1}] ${it.name}`,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        notes: it.notes,
      })),
      isQuickBill: true,
      rawQuickBill: b,
    }));
  }, [quickOpenBills]);

  // Combined orders (backend active orders + quick billing open bills)
  const allCombinedOrders = useMemo(() => {
    const existingOrderNumbers = new Set(orders.map((o) => o.orderNumber.toLowerCase()));
    const dedupedQuickOrders = convertedQuickOrders.filter(
      (q) => !existingOrderNumbers.has(q.orderNumber.toLowerCase())
    );
    return [...orders, ...dedupedQuickOrders];
  }, [orders, convertedQuickOrders]);

  // Pagination & Sorting state
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Order Details Modal state
  const [viewingOrder, setViewingOrder] = useState<ActiveRestaurantOrderData | null>(null);

  // Helper type checks
  const isDeliveryOrder = (o: ActiveRestaurantOrderData) =>
    (o.orderType as string) === 'DELIVERY' ||
    (o.orderType as string) === 'ONLINE' ||
    (o as any).source === 'ONLINE' ||
    Boolean(o.notes && /delivery|online|zomato|swiggy|uber/i.test(o.notes));

  const isTakeawayOrder = (o: ActiveRestaurantOrderData) =>
    (o.orderType as string) === 'TAKEAWAY' && !isDeliveryOrder(o);

  const isDineInOrder = (o: ActiveRestaurantOrderData) =>
    Boolean(o.tableId) || o.orderType === 'DINE_IN' || (!isTakeawayOrder(o) && !isDeliveryOrder(o) && o.orderType !== 'COUNTER_SALE');

  const isOpenOrderRecord = (o: ActiveRestaurantOrderData) =>
    !o.isPaid && o.status !== 'COMPLETED' && o.status !== 'CANCELLED';

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allCombinedOrders.filter((order) => {
      // 1. Service Type Filter
      if (serviceTypeFilter === 'OPEN_ORDERS') {
        if (!isOpenOrderRecord(order)) return false;
      } else if (serviceTypeFilter === 'DINE_IN') {
        if (!isDineInOrder(order)) return false;
      } else if (serviceTypeFilter === 'TAKEAWAY') {
        if (!isTakeawayOrder(order)) return false;
      } else if (serviceTypeFilter === 'DELIVERY') {
        if (!isDeliveryOrder(order)) return false;
      }

      // 2. Department Filter (Kitchen KOT, Bar BOT, Both)
      if (departmentFilter !== 'ALL') {
        const dept = getOrderDepartmentInfo(order);
        if (departmentFilter === 'KOT' && !dept.hasKot) return false;
        if (departmentFilter === 'BOT' && !dept.hasBot) return false;
        if (departmentFilter === 'BOTH' && !dept.isBoth) return false;
      }

      // 3. Status Filter
      if (statusFilter === 'UNPAID' && order.isPaid) return false;
      if (statusFilter === 'PAID' && !order.isPaid) return false;
      if (statusFilter === 'RECEIVED' && order.status !== 'RECEIVED') return false;
      if (statusFilter === 'PREPARING' && order.status !== 'PREPARING') return false;
      if (statusFilter === 'READY' && order.status !== 'READY') return false;
      if (statusFilter === 'SERVED' && order.status !== 'SERVED') return false;

      // 4. Search Query
      if (!q) return true;

      const cust = getCustomerInfo(order);
      const orderNo = (order.orderNumber || '').toLowerCase();
      const kotNo = (order.kotNumber || '').toLowerCase();
      const botNo = (order.botNumber || '').toLowerCase();
      const tableNo = (order.table?.tableNumber || '').toLowerCase();
      const roomNo = (order.room?.number || '').toLowerCase();
      const serverName = (order.serverName || '').toLowerCase();
      const custName = cust.name.toLowerCase();
      const custPhone = (cust.phone || '').toLowerCase();
      const notes = (order.notes || '').toLowerCase();
      const itemMatch = (order.items || []).some((i) => i.productName.toLowerCase().includes(q));

      return (
        orderNo.includes(q) ||
        kotNo.includes(q) ||
        botNo.includes(q) ||
        tableNo.includes(q) ||
        roomNo.includes(q) ||
        serverName.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        notes.includes(q) ||
        itemMatch
      );
    });
  }, [allCombinedOrders, serviceTypeFilter, departmentFilter, statusFilter, searchQuery]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let diff = 0;
      if (sortField === 'orderNumber') {
        diff = a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortField === 'ticket') {
        const aT = a.kotNumber || a.botNumber || '';
        const bT = b.kotNumber || b.botNumber || '';
        diff = aT.localeCompare(bT);
      } else if (sortField === 'table') {
        const aT = a.table?.tableNumber || a.orderType || '';
        const bT = b.table?.tableNumber || b.orderType || '';
        diff = aT.localeCompare(bT, undefined, { numeric: true });
      } else if (sortField === 'customer') {
        const aC = getCustomerInfo(a).name;
        const bC = getCustomerInfo(b).name;
        diff = aC.localeCompare(bC);
      } else if (sortField === 'items') {
        const aQty = (a.items || []).reduce((s, i) => s + i.quantity, 0);
        const bQty = (b.items || []).reduce((s, i) => s + i.quantity, 0);
        diff = aQty - bQty;
      } else if (sortField === 'total') {
        diff = (a.total || 0) - (b.total || 0);
      } else if (sortField === 'status') {
        diff = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'payment') {
        diff = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
      } else if (sortField === 'time') {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? diff : -diff;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Pagination calculation
  const totalEntries = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + entriesPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleManageOrderClick = (ord: ActiveRestaurantOrderData & { isQuickBill?: boolean }) => {
    if (ord.isQuickBill) {
      router.push(`/quick-sale?reopenOpenBill=${ord.id}`);
    } else {
      onOpenOrder(ord);
    }
  };

  const handleSettleOrderClick = (ord: ActiveRestaurantOrderData & { isQuickBill?: boolean; rawQuickBill?: QuickBillRecord }) => {
    if (ord.isQuickBill && ord.rawQuickBill) {
      const paid = settleAndPrintBill(ord.id, {
        paymentMethod: 'CASH',
        paidAmount: ord.total,
        billType: ord.rawQuickBill.billType,
      });
      if (paid) {
        toast.success('Open Order Settled', `Bill #${paid.masterBillNumber} settled successfully.`);
        refreshQuickOpenBills();
        onPrintReceipt({
          ...ord,
          isPaid: true,
        });
      }
    } else {
      onGenerateBill(ord);
    }
  };

  const handleCancelQuickBill = (ord: ActiveRestaurantOrderData & { isQuickBill?: boolean; rawQuickBill?: QuickBillRecord }) => {
    if (!ord.isQuickBill) return;
    const reason = window.prompt(`Cancel open order #${ord.orderNumber} (${ord.kotNumber})?\nEnter reason:`, 'Customer cancelled order');
    if (reason !== null) {
      cancelOpenOrder(ord.id, reason || 'Cancelled by staff');
      toast.warning('Open Order Cancelled', `Order #${ord.orderNumber} marked cancelled.`);
      refreshQuickOpenBills();
    }
  };

  const statusBadges: Record<string, { label: string; cls: string }> = {
    RECEIVED: { label: 'Received', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' },
    PREPARING: { label: 'Preparing', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' },
    READY: { label: 'Ready', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' },
    SERVED: { label: 'Served', cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300' },
    BILLED: { label: 'Billed', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' },
    COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300' },
  };

  return (
    <div className="space-y-3.5 select-none animate-in fade-in duration-150">
      {/* -------------------------------------------------------------------
          TOP TOOLBAR: Clean Segmented Service Type Tabs + Search & Status Filter
          ------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Order Service Types (Dine-in, Takeaway, Delivery, Open Orders) + All */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Orders', icon: UtensilsCrossed },
            { id: 'DINE_IN', label: 'Dine-In', icon: Armchair },
            { id: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
            { id: 'DELIVERY', label: 'Delivery', icon: Bike },
            { id: 'OPEN_ORDERS', label: 'Open Orders', icon: Clock },
          ].map((tab) => {
            const isSelected = serviceTypeFilter === tab.id;
            const Icon = tab.icon;
            const isOpenTab = tab.id === 'OPEN_ORDERS';

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setServiceTypeFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer whitespace-nowrap shadow-2xs',
                  isSelected
                    ? isOpenTab
                      ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                      : 'bg-[#0B3D32] text-white border-[#0B3D32] font-bold dark:bg-emerald-700 dark:border-emerald-700 shadow-xs'
                    : isOpenTab
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5',
                    isSelected ? 'text-white' : isOpenTab ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Department Filter, Status Filter Dropdown, Compact Search Box & Refresh */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end">
          {/* Department Filter (Kitchen / Bar / Both) */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs focus:border-[#0B3D32] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="KOT">Kitchen (KOT)</option>
              <option value="BOT">Bar (BOT)</option>
              <option value="BOTH">Kitchen &amp; Bar</option>
            </select>
          </div>

          {/* Prep Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs focus:border-[#0B3D32] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="UNPAID">Unpaid Only</option>
              <option value="PAID">Paid Only</option>
              <option value="RECEIVED">Received</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="SERVED">Served</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              onRefresh();
              refreshQuickOpenBills();
            }}
            className="h-[30px] w-[30px] flex items-center justify-center rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Refresh orders list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#0B3D32] dark:text-emerald-400')} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          MAIN ORDERS TABLE (Clean DataTables Grid with Vertical Lines)
          ------------------------------------------------------------------- */}
      <div className="border border-slate-200 dark:border-slate-700/60 rounded overflow-hidden bg-white dark:bg-slate-850 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                {/* 1. SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 2. Order # */}
                <th
                  onClick={() => handleSort('orderNumber')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Order #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 3. Ticket # (KOT / BOT) */}
                <th
                  onClick={() => handleSort('ticket')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Ticket (KOT/BOT)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 3. Source */}
                <th
                  onClick={() => handleSort('table')}
                  className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Source</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 4. Customer & Staff */}
                <th
                  onClick={() => handleSort('customer')}
                  className="py-2.5 px-3.5 min-w-[160px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Customer &amp; Staff</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 5. Items & Department */}
                <th
                  onClick={() => handleSort('items')}
                  className="py-2.5 px-3 min-w-[180px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Ordered Items</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 6. Amount */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 7. Preparation / Fulfillment Status (KOT & BOT) */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 w-28 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Prep Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 8. Payment Status */}
                <th
                  onClick={() => handleSort('payment')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Payment</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 9. Time */}
                <th
                  onClick={() => handleSort('time')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 10. Actions */}
                <th className="py-2.5 px-3 w-48 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                    {serviceTypeFilter === 'OPEN_ORDERS'
                      ? 'No active open orders / running tabs found.'
                      : 'No orders found matching the selected filters.'}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord: any, idx) => {
                  const sn = startIndex + idx + 1;
                  const isTable = !!ord.table?.tableNumber;
                  const isDelivery = isDeliveryOrder(ord);
                  const isTakeaway = isTakeawayOrder(ord);
                  const isQuickBill = !!ord.isQuickBill;
                  const isOpenTab = !ord.isPaid && ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED';

                  const cust = getCustomerInfo(ord);
                  const dept = getOrderDepartmentInfo(ord);
                  const totalItemsQty = (ord.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);

                  const itemsList = ord.items || [];
                  const itemsPreview = itemsList.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ');

                  const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000));
                  const statusConf = statusBadges[ord.status] || { label: ord.status, cls: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr
                      key={ord.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px] border-r border-slate-200 dark:border-slate-700 align-middle">
                        {sn}
                      </td>

                      {/* 2. Order # */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {ord.orderNumber}
                        </span>
                      </td>

                      {/* 3. Ticket # (KOT / BOT) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {dept.isBoth ? (
                          <div className="font-mono text-xs space-y-0.5 leading-tight">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {dept.kotNumber ? (dept.kotNumber.startsWith('KOT') ? dept.kotNumber : `KOT-${dept.kotNumber}`) : 'KOT'}
                            </div>
                            <div className="font-semibold text-violet-700 dark:text-violet-400">
                              {dept.botNumber ? (dept.botNumber.startsWith('BOT') ? dept.botNumber : `BOT-${dept.botNumber}`) : 'BOT'}
                            </div>
                          </div>
                        ) : dept.hasKot ? (
                          <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {dept.kotNumber ? (dept.kotNumber.startsWith('KOT') ? dept.kotNumber : `KOT-${dept.kotNumber}`) : 'KOT'}
                          </span>
                        ) : dept.hasBot ? (
                          <span className="font-mono text-xs font-semibold text-violet-700 dark:text-violet-400">
                            {dept.botNumber ? (dept.botNumber.startsWith('BOT') ? dept.botNumber : `BOT-${dept.botNumber}`) : 'BOT'}
                          </span>
                        ) : isQuickBill && ord.kotNumber ? (
                          <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Tab #{ord.kotNumber}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 3. Service / Table - Clean plain text & subtle icon, NO outline box */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {isTable ? (
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Table2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Table {ord.table!.tableNumber}</span>
                            </span>
                            {ord.table?.section && (
                              <div className="text-[10px] text-slate-400 pl-5">{ord.table.section}</div>
                            )}
                          </div>
                        ) : ord.room?.number ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Room {ord.room.number}</span>
                          </span>
                        ) : isDelivery ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>Delivery</span>
                          </span>
                        ) : isTakeaway ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Takeaway</span>
                          </span>
                        ) : isQuickBill ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Open Tab ({ord.kotNumber || 'Counter'})</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Armchair className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Dine-in (No Table)</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Customer & Staff */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                            {cust.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 flex items-center gap-1.5">
                          {cust.phone ? (
                            <span className="font-mono">{cust.phone}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Direct order</span>
                          )}
                          {ord.serverName && ord.serverName !== 'Cashier' && ord.serverName !== 'Staff' && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="truncate max-w-[80px]" title={`Server: ${ord.serverName}`}>{ord.serverName}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 5. Ordered Items & Department */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {totalItemsQty} {totalItemsQty === 1 ? 'item' : 'items'}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          {dept.isBoth ? (
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                              <ChefHat className="w-3 h-3 text-emerald-600" />
                              <span>Kitchen &amp;</span>
                              <Wine className="w-3 h-3 text-violet-600" />
                              <span>Bar</span>
                            </span>
                          ) : dept.hasBot ? (
                            <span className="text-[11px] text-violet-700 dark:text-violet-400 flex items-center gap-1 font-medium">
                              <Wine className="w-3 h-3" />
                              <span>Bar (BOT)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                              <ChefHat className="w-3 h-3" />
                              <span>Kitchen (KOT)</span>
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] mt-0.5"
                          title={itemsPreview}
                        >
                          {itemsPreview || 'No items listed'}
                        </div>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400 align-middle">
                        {formatCurrency(ord.total)}
                      </td>

                      {/* 7. Preparation / Fulfillment Status (KOT & BOT) */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              ord.status === 'RECEIVED' && 'bg-amber-500 animate-pulse',
                              ord.status === 'PREPARING' && 'bg-blue-500',
                              ord.status === 'READY' && 'bg-emerald-500',
                              ord.status === 'SERVED' && 'bg-teal-500',
                              ord.status === 'BILLED' && 'bg-purple-500',
                              ord.status === 'COMPLETED' && 'bg-slate-400',
                              ord.status === 'CANCELLED' && 'bg-rose-500'
                            )}
                          />
                          <span
                            className={cn(
                              ord.status === 'RECEIVED' && 'text-amber-700 dark:text-amber-400',
                              ord.status === 'PREPARING' && 'text-blue-700 dark:text-blue-400',
                              ord.status === 'READY' && 'text-emerald-700 dark:text-emerald-400',
                              ord.status === 'SERVED' && 'text-teal-700 dark:text-teal-400',
                              ord.status === 'BILLED' && 'text-purple-700 dark:text-purple-400',
                              ord.status === 'COMPLETED' && 'text-slate-600 dark:text-slate-400',
                              ord.status === 'CANCELLED' && 'text-rose-700 dark:text-rose-400'
                            )}
                          >
                            {statusConf.label}
                          </span>
                        </span>
                      </td>

                      {/* 8. Payment Status - Clean dot + label, NO badge box */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              ord.isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                            )}
                          />
                          <span className={ord.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                            {ord.isPaid ? 'PAID' : 'OPEN'}
                          </span>
                        </span>
                      </td>

                      {/* 9. Time */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 align-middle">
                        <div>{timeStr}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{minsAgo}m ago</div>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        <div className="inline-flex items-center gap-1 justify-center">
                          {/* Manage / Add Items */}
                          <button
                            type="button"
                            onClick={() => handleManageOrderClick(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B3D32] hover:bg-[#082e25] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                            title={isQuickBill ? 'Reopen in Quick Sale to append items/rounds' : 'Manage & add items to order'}
                          >
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>{isOpenTab ? 'Add Items' : 'Manage'}</span>
                          </button>

                          {/* Settle / Bill button if unpaid */}
                          {!ord.isPaid && (
                            <button
                              type="button"
                              onClick={() => handleSettleOrderClick(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                              title="Settle bill & payment"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* Print Receipt / KOT */}
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(ord)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                            title="Print receipt or ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel button if quick bill open order */}
                          {isQuickBill && (
                            <button
                              type="button"
                              onClick={() => handleCancelQuickBill(ord)}
                              className="p-1 rounded border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer shadow-2xs"
                              title="Cancel open order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Details modal */}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(ord)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                            title="View full order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* -------------------------------------------------------------------
            PAGINATION BAR (DataTables layout: Showing 1 to 10 of X orders | Previous 1 2 3 ... Next)
            ------------------------------------------------------------------- */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/40 select-none">
          {/* Entries summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 font-medium text-[11px]">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

            <div className="text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{totalEntries > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(startIndex + entriesPerPage, totalEntries)}</span> of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{totalEntries}</span> orders
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs text-xs font-medium"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;
                const isActive = pageNum === currentPage;

                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-1 text-slate-400 select-none font-bold">…</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-[28px] h-7 px-2 font-mono text-xs font-semibold rounded transition cursor-pointer flex items-center justify-center shadow-2xs',
                        isActive
                          ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-600'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          ORDER DETAILS MODAL (Clean, Structured & Intuitive)
          ------------------------------------------------------------------- */}
      {viewingOrder && (() => {
        const modalCust = getCustomerInfo(viewingOrder);
        const isQuickBill = !!(viewingOrder as any).isQuickBill;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setViewingOrder(null)}
          >
            <div
              className="w-full max-w-lg rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#EAF1EE] dark:bg-[#07241E]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0B3D32] text-white font-mono text-xs font-bold">
                    #
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Order {viewingOrder.orderNumber}
                      </h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          viewingOrder.isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-500 text-white animate-pulse'
                        )}
                      >
                        {viewingOrder.isPaid ? 'PAID' : 'OPEN TAB'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Placed at {new Date(viewingOrder.createdAt).toLocaleTimeString()} · Server: {viewingOrder.serverName || 'Staff'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Customer & Service Card */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-50 dark:bg-[#092922] border border-slate-200/70 dark:border-border-default/70">
                  <div>
                    <span className="block text-[10px] font-bold text-muted uppercase">Customer Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {modalCust.name}
                    </span>
                    {modalCust.phone && (
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{modalCust.phone}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-muted uppercase">Source</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {viewingOrder.table?.tableNumber
                        ? `Table ${viewingOrder.table.tableNumber}`
                        : isDeliveryOrder(viewingOrder)
                        ? 'Delivery / Online'
                        : viewingOrder.orderType === 'TAKEAWAY'
                        ? 'Takeaway'
                        : isQuickBill
                        ? `Open Tab (${viewingOrder.kotNumber || 'Counter'})`
                        : 'Dine-In (No Table)'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-muted uppercase">Prep Status</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {viewingOrder.status}
                    </span>
                  </div>

                  {viewingOrder.kotNumber && (
                    <div>
                      <span className="block text-[10px] font-bold text-muted uppercase">
                        {isQuickBill ? 'Token' : 'KOT Ticket'}
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        {viewingOrder.kotNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes if any */}
                {viewingOrder.notes && (
                  <div className="p-2.5 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200">
                    <span className="font-bold uppercase text-[10px] block text-amber-800 dark:text-amber-300">Special Notes / Address</span>
                    {viewingOrder.notes}
                  </div>
                )}

                {/* Items List */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Order Items ({viewingOrder.items?.length || 0})
                  </h4>
                  <div className="rounded border border-slate-200 dark:border-border-default overflow-hidden divide-y divide-slate-100 dark:divide-border-default">
                    {(viewingOrder.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-surface-card">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.quantity}x {item.productName}
                          </div>
                          {item.notes && <div className="text-[10px] text-slate-400 italic">{item.notes}</div>}
                        </div>
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.total || item.unitPrice * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Totals */}
                  <div className="p-3 bg-slate-50 dark:bg-[#07241E] rounded mt-2 space-y-1 text-right">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(viewingOrder.subtotal)}</span>
                    </div>
                    {viewingOrder.tax > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tax / VAT:</span>
                        <span className="font-mono">{formatCurrency(viewingOrder.tax)}</span>
                      </div>
                    )}
                    {viewingOrder.serviceCharge > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Service Charge:</span>
                        <span className="font-mono">{formatCurrency(viewingOrder.serviceCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-border-default pt-1 mt-1 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-mono text-[#0B3D32] dark:text-emerald-400">
                        {formatCurrency(viewingOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const ord = viewingOrder;
                      setViewingOrder(null);
                      handleManageOrderClick(ord);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Manage / Add Items</span>
                  </button>

                  {!viewingOrder.isPaid && (
                    <button
                      type="button"
                      onClick={() => {
                        const ord = viewingOrder;
                        setViewingOrder(null);
                        handleSettleOrderClick(ord);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Settle &amp; Bill</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const ord = viewingOrder;
                      onPrintReceipt(ord);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

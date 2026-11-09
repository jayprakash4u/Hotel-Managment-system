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

type SortField = 'sn' | 'orderNumber' | 'table' | 'customer' | 'items' | 'total' | 'status' | 'payment' | 'time';

const isGenericLabel = (str: string) => {
  return /^(takeaway\s*(customer|order)?|online\s*(customer|order)?|walk-in\s*(customer|guest)?|dine-in\s*(guest|order)?|delivery\s*(customer|order)?)$/i.test(
    str.trim()
  );
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'PREPARING' | 'READY'>('ALL');

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

      // 2. Status Filter
      if (statusFilter === 'UNPAID' && order.isPaid) return false;
      if (statusFilter === 'PAID' && !order.isPaid) return false;
      if (statusFilter === 'PREPARING' && order.status !== 'PREPARING') return false;
      if (statusFilter === 'READY' && order.status !== 'READY') return false;

      // 3. Search Query
      if (!q) return true;

      const cust = getCustomerInfo(order);
      const orderNo = order.orderNumber.toLowerCase();
      const kotNo = (order.kotNumber || '').toLowerCase();
      const tableNo = (order.table?.tableNumber || '').toLowerCase();
      const custName = cust.name.toLowerCase();
      const custPhone = (cust.phone || '').toLowerCase();
      const notes = (order.notes || '').toLowerCase();
      const itemMatch = (order.items || []).some((i) => i.productName.toLowerCase().includes(q));

      return (
        orderNo.includes(q) ||
        kotNo.includes(q) ||
        tableNo.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        notes.includes(q) ||
        itemMatch
      );
    });
  }, [allCombinedOrders, serviceTypeFilter, statusFilter, searchQuery]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let diff = 0;
      if (sortField === 'orderNumber') {
        diff = a.orderNumber.localeCompare(b.orderNumber);
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

        {/* Right Side: Status Filter Dropdown, Compact Search Box & Refresh */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end">
          {/* Quick Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs focus:border-[#0B3D32] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="UNPAID">Unpaid Only</option>
              <option value="PAID">Paid Only</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search order #, table, customer..."
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
          MAIN ORDERS TABLE (Clean, Spacious, Customer-First Layout)
          ------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-default rounded-[4px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EAF1EE] dark:bg-[#07241E] text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-border-default select-none font-bold">
                {/* 1. SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 2. Order # */}
                <th
                  onClick={() => handleSort('orderNumber')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Order #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 3. Service / Table */}
                <th
                  onClick={() => handleSort('table')}
                  className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Service / Table</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 4. Customer Details */}
                <th
                  onClick={() => handleSort('customer')}
                  className="py-2.5 px-3.5 min-w-[170px] border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Customer Details</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 5. Items */}
                <th
                  onClick={() => handleSort('items')}
                  className="py-2.5 px-3 min-w-[150px] border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Ordered Items</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 6. Amount */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 7. Kitchen Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Kitchen</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 8. Payment Status */}
                <th
                  onClick={() => handleSort('payment')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Payment</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 9. Time */}
                <th
                  onClick={() => handleSort('time')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
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

            <tbody className="divide-y divide-slate-200 dark:divide-border-default">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-muted">
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
                  const totalItemsQty = (ord.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);

                  const itemsList = ord.items || [];
                  const itemsPreview = itemsList.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ');

                  const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000));
                  const statusConf = statusBadges[ord.status] || { label: ord.status, cls: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr
                      key={ord.id}
                      className={cn(
                        'hover:bg-[#F2F6F4] dark:hover:bg-surface-hover transition-colors',
                        isOpenTab && 'bg-amber-50/20 dark:bg-amber-950/10',
                        idx % 2 === 1 && !isOpenTab ? 'bg-[#FAFAFA] dark:bg-surface-card/60' : ''
                      )}
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-border-default">
                        {sn}
                      </td>

                      {/* 2. Order # */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-border-default font-mono">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{ord.orderNumber}</div>
                        {ord.kotNumber && (
                          <span
                            className={cn(
                              'text-[10px] font-bold block',
                              isQuickBill
                                ? 'text-amber-800 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-400'
                            )}
                          >
                            {ord.kotNumber}
                          </span>
                        )}
                      </td>

                      {/* 3. Service / Table */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-border-default font-medium">
                        {isTable ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold whitespace-nowrap">
                            <Table2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Table {ord.table!.tableNumber}</span>
                          </div>
                        ) : isDelivery ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold whitespace-nowrap">
                            <Bike className="w-3.5 h-3.5 text-sky-600" />
                            <span>Delivery</span>
                          </div>
                        ) : isTakeaway ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold whitespace-nowrap">
                            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Takeaway</span>
                          </div>
                        ) : isQuickBill ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Open Tab ({ord.kotNumber || 'Counter'})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold whitespace-nowrap">
                            <Armchair className="w-3.5 h-3.5 text-purple-600" />
                            <span>Dine-in (No Table)</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Customer Details */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-border-default">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                            {cust.name}
                          </span>
                        </div>
                        {cust.phone ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 pl-5">
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{cust.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 pl-5 italic">Direct order</span>
                        )}
                      </td>

                      {/* 5. Ordered Items */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-border-default">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {totalItemsQty} {totalItemsQty === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div
                          className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5"
                          title={itemsPreview}
                        >
                          {itemsPreview || 'No items listed'}
                        </div>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-border-default font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(ord.total)}
                      </td>

                      {/* 7. Kitchen Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-border-default">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', statusConf.cls)}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* 8. Payment Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-border-default">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block',
                            ord.isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-500 text-white animate-pulse'
                          )}
                        >
                          {ord.isPaid ? 'PAID' : 'OPEN'}
                        </span>
                      </td>

                      {/* 9. Time */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-border-default font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div>{timeStr}</div>
                        <div className="text-[10px] text-muted">{minsAgo}m ago</div>
                      </td>

                      {/* 10. Actions (Clean, Direct & Useful) */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1 justify-center">
                          {/* Manage / Add Items */}
                          <button
                            type="button"
                            onClick={() => handleManageOrderClick(ord)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
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
                            className="p-1 rounded-[3px] border border-slate-300 dark:border-border-default text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                            title="Print receipt or ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel button if quick bill open order */}
                          {isQuickBill && (
                            <button
                              type="button"
                              onClick={() => handleCancelQuickBill(ord)}
                              className="p-1 rounded-[3px] border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer shadow-2xs"
                              title="Cancel open order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Details modal */}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(ord)}
                            className="p-1 rounded-[3px] border border-slate-300 dark:border-border-default text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
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
            PAGINATION BAR
            ------------------------------------------------------------------- */}
        <div className="p-3 border-t border-slate-200 dark:border-border-default flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
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
                className="h-[28px] px-2 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

            <div>
              Showing <strong className="text-slate-800 dark:text-slate-200">{totalEntries > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong className="text-slate-800 dark:text-slate-200">{Math.min(startIndex + entriesPerPage, totalEntries)}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalEntries}</strong> orders
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
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
                          'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                          isActive
                            ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                            : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
                    <span className="block text-[10px] font-bold text-muted uppercase">Service / Table</span>
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
                    <span className="block text-[10px] font-bold text-muted uppercase">Kitchen Status</span>
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

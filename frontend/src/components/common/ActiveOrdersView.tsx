'use client';

import React, { useState, useMemo } from 'react';
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
  Plus,
  RefreshCw,
  DollarSign,
  X,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  User,
  ChefHat,
  Wine,
} from 'lucide-react';
import { ActiveRestaurantOrderData } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export interface ActiveOrdersViewProps {
  orders: ActiveRestaurantOrderData[];
  isLoading: boolean;
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

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  orders,
  isLoading,
  onRefresh,
  onOpenOrder,
  onGenerateBill,
  onPrintReceipt,
  onAssignTable,
  onNewTableOrder,
  onNewNoTableOrder,
  onNewOnlineOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'ALL' | 'TABLE' | 'NO_TABLE' | 'TAKEAWAY' | 'ONLINE' | 'UNPAID' | 'READY'
  >('ALL');

  // Pagination & Sorting state
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Order Details Modal state
  const [viewingOrder, setViewingOrder] = useState<ActiveRestaurantOrderData | null>(null);

  // Helper to identify online orders
  const isOnlineOrder = (o: ActiveRestaurantOrderData) =>
    (o.orderType as string) === 'ONLINE' ||
    (o.orderType as string) === 'DELIVERY' ||
    (o as any).source === 'ONLINE' ||
    Boolean(o.notes && /online|zomato|swiggy|uber\s*eats|web\s*order|delivery/i.test(o.notes)) ||
    Boolean(o.serverName && /online/i.test(o.serverName));

  // Counts for filter pills
  const tableCount = orders.filter((o) => !!o.tableId || o.orderType === 'DINE_IN').length;
  const onlineCount = orders.filter(isOnlineOrder).length;
  const noTableCount = orders.filter((o) => !o.tableId && o.orderType !== 'TAKEAWAY' && !isOnlineOrder(o)).length;
  const takeawayCount = orders.filter((o) => o.orderType === 'TAKEAWAY' && !isOnlineOrder(o)).length;
  const unpaidCount = orders.filter((o) => !o.isPaid).length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      // 1. Category Filter
      if (selectedFilter === 'TABLE') {
        if (!order.tableId && order.orderType !== 'DINE_IN') return false;
      } else if (selectedFilter === 'NO_TABLE') {
        if (order.tableId || order.orderType === 'TAKEAWAY' || isOnlineOrder(order)) return false;
      } else if (selectedFilter === 'TAKEAWAY') {
        if (order.orderType !== 'TAKEAWAY' || isOnlineOrder(order)) return false;
      } else if (selectedFilter === 'ONLINE') {
        if (!isOnlineOrder(order)) return false;
      } else if (selectedFilter === 'UNPAID') {
        if (order.isPaid) return false;
      } else if (selectedFilter === 'READY') {
        if (order.status !== 'READY') return false;
      }

      // 2. Search Filter
      if (!q) return true;

      const orderNo = order.orderNumber.toLowerCase();
      const tableNo = order.table?.tableNumber?.toLowerCase() || '';
      const server = order.serverName?.toLowerCase() || '';
      const notes = order.notes?.toLowerCase() || '';
      const guest = order.guest ? `${order.guest.firstName} ${order.guest.lastName}`.toLowerCase() : '';
      const itemMatch = (order.items || []).some((i) => i.productName.toLowerCase().includes(q));

      return (
        orderNo.includes(q) ||
        tableNo.includes(q) ||
        server.includes(q) ||
        notes.includes(q) ||
        guest.includes(q) ||
        itemMatch
      );
    });
  }, [orders, selectedFilter, searchQuery]);

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
        const aC = a.guest ? `${a.guest.firstName} ${a.guest.lastName}` : a.notes || '';
        const bC = b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : b.notes || '';
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
    <div className="space-y-4 select-none animate-in fade-in duration-150">
      {/* 1. Filter Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
        {[
          { id: 'ALL', label: 'All Active Orders', count: orders.length },
          { id: 'TABLE', label: 'Table Orders', count: tableCount },
          { id: 'NO_TABLE', label: 'Quick Orders', count: noTableCount },
          { id: 'TAKEAWAY', label: 'Takeaway Orders', count: takeawayCount },
          { id: 'ONLINE', label: 'Online Orders', count: onlineCount },
          { id: 'UNPAID', label: 'Unpaid Orders', count: unpaidCount },
          { id: 'READY', label: 'Ready Orders', count: readyCount },
        ].map((pill) => {
          const isSelected = selectedFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setSelectedFilter(pill.id as any);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer',
                isSelected
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#FAFBF9] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  'rounded-[2px] px-1.5 py-0.2 text-[10px] font-mono',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-[#0E362C] text-[#64736C] dark:text-emerald-300'
                )}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Classic DataTable Top Bar: "Show [10] entries" on Left, Search & Actions on Right */}
      <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-border-default rounded-[4px] p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Show Entries Dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card px-2 py-1 text-xs font-bold focus:outline-none focus:border-brand cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        {/* Right: Search Box + Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-600 dark:text-slate-400">Search:</span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search orders..."
                className="border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card px-2.5 py-1 text-xs w-44 sm:w-56 focus:outline-none focus:border-brand"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>

          <button
            type="button"
            onClick={onNewTableOrder}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 3. Main Data Table */}
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
                    <span>SN</span>
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

                {/* 3. Table / Type */}
                <th
                  onClick={() => handleSort('table')}
                  className="py-2.5 px-3 w-28 sm:w-32 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Table / Type</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 4. Customer */}
                <th
                  onClick={() => handleSort('customer')}
                  className="py-2.5 px-3 w-40 sm:w-44 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Customer</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 5. Items (Qty) */}
                <th
                  onClick={() => handleSort('items')}
                  className="py-2.5 px-3 min-w-[140px] border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Items</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 6. Amount */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 7. Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 w-28 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 8. Payment */}
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

                {/* 10. Action */}
                <th className="py-2.5 px-3 w-40 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-border-default">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-muted">
                    No active orders found matching your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord, idx) => {
                  const sn = startIndex + idx + 1;
                  const isTable = !!ord.table?.tableNumber;
                  const isOnline = isOnlineOrder(ord);
                  const isTakeaway = !isOnline && ord.orderType === 'TAKEAWAY';
                  const isNoTable = !isTable && !isTakeaway && !isOnline;

                  const totalItemsQty = (ord.items || []).reduce((sum, i) => sum + i.quantity, 0);
                  const customerName = ord.guest
                    ? `${ord.guest.firstName || ''} ${ord.guest.lastName || ''}`.trim()
                    : ord.notes || 'Walk-in Guest';

                  const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000));
                  const statusConf = statusBadges[ord.status] || { label: ord.status, cls: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr
                      key={ord.id}
                      className={cn(
                        'hover:bg-[#F2F6F4] dark:hover:bg-surface-hover transition-colors',
                        idx % 2 === 1 ? 'bg-[#FAFAFA] dark:bg-surface-card/60' : 'bg-white dark:bg-surface-card'
                      )}
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-border-default">
                        {sn}
                      </td>

                      {/* 2. Order # */}
                      <td className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default font-mono">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {ord.orderNumber}
                        </div>
                        {ord.kotNumber && (
                          <span className="text-[10px] text-brand dark:text-emerald-400 font-bold">
                            {ord.kotNumber}
                          </span>
                        )}
                      </td>

                      {/* 3. Table / Type */}
                      <td className="py-2.5 px-3 w-28 sm:w-32 border-r border-slate-200 dark:border-border-default font-medium">
                        {isTable ? (
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            Table {ord.table!.tableNumber}
                          </span>
                        ) : isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-400 whitespace-nowrap">
                            <Globe className="w-3 h-3" />
                            <span>Online Order</span>
                          </span>
                        ) : isTakeaway ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                            <ShoppingBag className="w-3 h-3" />
                            <span>Takeaway</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                            <Armchair className="w-3 h-3" />
                            <span>No Table</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Customer */}
                      <td className="py-2.5 px-3 w-40 sm:w-44 border-r border-slate-200 dark:border-border-default">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[150px]">
                          {customerName}
                        </div>
                        {ord.guest?.phone && (
                          <div className="text-[11px] text-muted font-mono truncate">
                            {ord.guest.phone}
                          </div>
                        )}
                      </td>

                      {/* 5. Items */}
                      <td className="py-2.5 px-3 min-w-[140px] border-r border-slate-200 dark:border-border-default">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {totalItemsQty} item{totalItemsQty !== 1 ? 's' : ''}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={(ord.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                          {(ord.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-2.5 px-3 w-28 text-right border-r border-slate-200 dark:border-border-default font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(ord.total)}
                      </td>

                      {/* 7. Status */}
                      <td className="py-2.5 px-3 w-28 text-center border-r border-slate-200 dark:border-border-default">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', statusConf.cls)}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* 8. Payment */}
                      <td className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-border-default">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            ord.isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          )}
                        >
                          {ord.isPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>

                      {/* 9. Time */}
                      <td className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div>{timeStr}</div>
                        <div className="text-[10px] text-muted">{minsAgo}m ago</div>
                      </td>

                      {/* 10. Actions: View Details, Print, Bill/Manage */}
                      <td className="py-2.5 px-3 w-40 text-center">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(ord)}
                            className="bg-[#159A80] hover:bg-[#12826c] text-white text-[11px] font-bold px-2 py-1 rounded-[3px] shadow-2xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="View complete order details and item breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>

                          {/* Print Receipt button */}
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(ord)}
                            className="p-1 rounded-[3px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Print receipt / KOT"
                          >
                            <Printer className="w-3.5 h-3.5" />
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

        {/* 4. Bottom Pagination Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-border-default flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
          <div>
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;
                const isActive = pageNum === currentPage;

                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-[28px] h-7 px-2 rounded-[3px] font-bold text-xs transition-colors cursor-pointer',
                        isActive
                          ? 'bg-[#159A80] text-white shadow-2xs'
                          : 'border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-300'
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
              className="px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ORDER DETAILS MODAL ("view details they can able to see detils")
         ========================================================================= */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className="w-full max-w-xl rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
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
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}
                    >
                      {viewingOrder.isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Created on {new Date(viewingOrder.createdAt).toLocaleString()} · Server: {viewingOrder.serverName || 'Staff'}
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
              {/* Order Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded bg-slate-50 dark:bg-[#092922] border border-slate-200/70 dark:border-border-default/70">
                <div>
                  <span className="block text-[10px] font-bold text-muted uppercase">Service / Table</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewingOrder.table?.tableNumber
                      ? `Table ${viewingOrder.table.tableNumber}`
                      : isOnlineOrder(viewingOrder)
                      ? 'Online Order'
                      : viewingOrder.orderType === 'TAKEAWAY'
                      ? 'Takeaway'
                      : 'No Table'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-muted uppercase">Customer / Guest</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {viewingOrder.guest
                      ? `${viewingOrder.guest.firstName || ''} ${viewingOrder.guest.lastName || ''}`.trim()
                      : viewingOrder.notes || 'Walk-in'}
                  </span>
                  {viewingOrder.guest?.phone && (
                    <span className="text-[10px] text-muted font-mono">{viewingOrder.guest.phone}</span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-muted uppercase">Kitchen Prep Status</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewingOrder.status}
                  </span>
                </div>

                {viewingOrder.kotNumber && (
                  <div>
                    <span className="block text-[10px] font-bold text-muted uppercase">KOT Ticket</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {viewingOrder.kotNumber}
                    </span>
                  </div>
                )}

                {viewingOrder.paymentMethod && (
                  <div>
                    <span className="block text-[10px] font-bold text-muted uppercase">Payment Mode</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {viewingOrder.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
                  Ordered Items ({viewingOrder.items?.length || 0})
                </h4>
                <div className="border border-slate-200 dark:border-border-default rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-border-default">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Item Particular</th>
                        <th className="py-2 px-3 w-16 text-right">Rate</th>
                        <th className="py-2 px-3 w-14 text-center">Qty</th>
                        <th className="py-2 px-3 w-20 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-border-default">
                      {(viewingOrder.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-surface-hover/50">
                          <td className="py-2 px-3 text-center font-mono text-muted">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                            <div>{it.productName}</div>
                            {it.notes && (
                              <div className="text-[10px] text-muted italic">Note: {it.notes}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-center font-bold font-mono">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(it.total || it.unitPrice * it.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-3 rounded bg-slate-50 dark:bg-[#092922] border border-slate-200/70 dark:border-border-default/70 space-y-1 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(viewingOrder.subtotal)}</span>
                </div>
                {viewingOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrency(viewingOrder.discountAmount)}</span>
                  </div>
                )}
                {viewingOrder.tax > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Tax:</span>
                    <span className="font-mono">{formatCurrency(viewingOrder.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-border-default font-black text-sm text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-brand dark:text-emerald-400">
                    {formatCurrency(viewingOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onPrintReceipt(viewingOrder);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ord = viewingOrder;
                    setViewingOrder(null);
                    onOpenOrder(ord);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Manage Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

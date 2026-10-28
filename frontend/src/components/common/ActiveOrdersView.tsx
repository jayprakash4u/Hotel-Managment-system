'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Receipt,
  Table2,
  Armchair,
  ShoppingBag,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  DollarSign,
  UtensilsCrossed,
  Plus,
  Flame,
  CheckCircle2,
  User,
  X,
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
}

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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'ALL' | 'TABLE' | 'NO_TABLE' | 'TAKEAWAY' | 'UNPAID' | 'READY'
  >('ALL');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      // 1. Category Filter
      if (selectedFilter === 'TABLE') {
        if (!order.tableId && order.orderType !== 'DINE_IN') return false;
      } else if (selectedFilter === 'NO_TABLE') {
        if (order.tableId || order.orderType === 'TAKEAWAY') return false;
      } else if (selectedFilter === 'TAKEAWAY') {
        if (order.orderType !== 'TAKEAWAY') return false;
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

  // Counts for filter pills
  const tableCount = orders.filter((o) => !!o.tableId || o.orderType === 'DINE_IN').length;
  const noTableCount = orders.filter((o) => !o.tableId && o.orderType !== 'TAKEAWAY').length;
  const takeawayCount = orders.filter((o) => o.orderType === 'TAKEAWAY').length;
  const unpaidCount = orders.filter((o) => !o.isPaid).length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-150">
      {/* Top Filter and Search Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All Active Orders', count: orders.length },
            { id: 'TABLE', label: 'Table Orders', count: tableCount },
            { id: 'NO_TABLE', label: 'Quick Orders', count: noTableCount },
            { id: 'TAKEAWAY', label: 'Takeaway Orders', count: takeawayCount },
            { id: 'UNPAID', label: 'Unpaid Orders', count: unpaidCount },
            { id: 'READY', label: 'Ready Orders', count: readyCount },
          ].map((pill) => {
            const isSelected = selectedFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedFilter(pill.id as any)}
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

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, table, item..."
              className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh active orders"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A]">
          <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No active orders found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No active orders match "${searchQuery}". Clear your search query or change filters.`
              : 'There are currently no active dine-in, counter, or takeaway orders.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={onNewTableOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Table Order</span>
            </button>
            <button
              type="button"
              onClick={onNewNoTableOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Quick Order</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map((ord) => {
            const isTable = !!ord.table?.tableNumber;
            const isTakeaway = ord.orderType === 'TAKEAWAY';
            const isNoTable = !isTable && !isTakeaway;
            const isExpanded = expandedOrderIds.has(ord.id);
            const totalItems = (ord.items || []).reduce((sum, i) => sum + i.quantity, 0);

            const isReceived = ord.status === 'RECEIVED';
            const isPreparing = ord.status === 'PREPARING';
            const isReady = ord.status === 'READY';
            const isServed = ord.status === 'SERVED';
            const isBilled = ord.status === 'BILLED';

            const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const minsAgo = Math.max(0, Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000));

            return (
              <div
                key={ord.id}
                onClick={() => onOpenOrder(ord)}
                className={cn(
                  'rounded-lg border bg-white dark:bg-[#071F1A] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group',
                  isBilled
                    ? 'border-amber-300 dark:border-amber-700'
                    : isReady
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                {/* Order Card Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {ord.orderNumber}
                    </span>
                    {ord.kotNumber && (
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {ord.kotNumber}
                      </span>
                    )}
                  </div>

                  {/* Destination Badge */}
                  <div>
                    {isTable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                        <Table2 className="w-3 h-3" />
                        <span>Table {ord.table!.tableNumber}</span>
                      </span>
                    ) : isTakeaway ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Takeaway</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800"
                        title={ord.notes || 'No Table customer'}
                      >
                        <Armchair className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">
                          No Table{ord.notes ? ` · ${ord.notes}` : ''}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges & Time Bar */}
                <div className="px-3 pt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Preparation Status */}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        isReceived
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : isPreparing
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : isReady
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isServed
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : isBilled
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {ord.status}
                    </span>

                    {/* Payment Status */}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        ord.isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isBilled
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}
                    >
                      {ord.isPaid ? 'PAID' : isBilled ? 'BILLED' : 'UNPAID'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{timeStr}</span>
                    <span className="opacity-70">({minsAgo}m ago)</span>
                  </div>
                </div>

                {/* Items Summary & Toggle */}
                <div className="p-3 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">
                      {totalItems} item{totalItems !== 1 ? 's' : ''} in order
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(ord.id, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expandable itemized list */}
                  {isExpanded ? (
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded p-2 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
                      {(ord.items || []).map((item, idx) => (
                        <div key={item.id || idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <span className="font-medium truncate pr-2">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                            {formatCurrency(item.total || item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                      {(ord.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  )}

                  {ord.notes && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-1.5 rounded">
                      <strong>Note:</strong> {ord.notes}
                    </div>
                  )}
                </div>

                {/* Total & Action Bar */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total Amount</span>
                    <span className="text-sm font-black font-mono text-emerald-800 dark:text-emerald-300">
                      {formatCurrency(ord.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Assign Table button for No-Table orders */}
                    {isNoTable && (
                      <button
                        type="button"
                        onClick={() => onAssignTable(ord)}
                        className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Assign an available registered table"
                      >
                        <Table2 className="w-3 h-3" />
                        <span>Assign Table</span>
                      </button>
                    )}

                    {/* Print Receipt button */}
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(ord)}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Print or reprint customer bill receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Generate Bill / Collect Payment button */}
                    {!ord.isPaid && (
                      <button
                        type="button"
                        onClick={() => onGenerateBill(ord)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Bill / Pay</span>
                      </button>
                    )}

                    {/* Manage Order button */}
                    <button
                      type="button"
                      onClick={() => onOpenOrder(ord)}
                      className="px-2.5 py-1 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

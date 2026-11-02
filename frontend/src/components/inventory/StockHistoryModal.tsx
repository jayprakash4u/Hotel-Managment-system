'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Package,
  AlertCircle,
  Calendar,
  X,
  Filter,
  Building,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

export interface HistoryTransaction {
  id: string;
  date: string;
  activity: string;
  rawType: string;
  reference: string;
  purchaseQuantity?: string | null;
  purchaseAmount?: number | null;
  supplierName?: string | null;
  stockIn: number;
  stockOut: number;
  balance: number;
  reason?: string;
  performedBy?: string;
}

export interface StockHistoryData {
  item: {
    id: string;
    name: string;
    department: string;
    category: string;
    sku: string;
    unit: string;
    purchaseUnit?: string | null;
    conversionFactor?: number;
    trackStock?: boolean;
    previousStock?: number | null;
    recentlyAddedStock?: number | null;
    currentStock: number;
    minThreshold: number;
    totalPurchaseAmount: number;
    lastPurchaseDate?: string | null;
    lastPurchaseQuantity?: string | null;
    lastPurchaseAmount?: number | null;
    previousPurchaseAmount?: number | null;
    lastSupplier?: string | null;
    stockStatus?: string;
  };
  summary: {
    openingStock: number;
    totalStockAdded: number;
    totalStockRemoved: number;
    currentStock: number;
    totalPurchaseAmount: number;
  };
  history: HistoryTransaction[];
}

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName?: string;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
}) => {
  const [data, setData] = useState<StockHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchHistory = async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/items/${itemId}/history`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || json.error || 'Failed to fetch stock history');
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading stock history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && itemId) {
      fetchHistory();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, itemId]);

  const unit = data?.item?.unit || 'units';

  // Filter & Sort History
  const filteredHistory = useMemo(() => {
    if (!data?.history) return [];
    let list = [...data.history];

    // Activity Filter
    if (activityFilter !== 'ALL') {
      list = list.filter((tx) => tx.rawType === activityFilter);
    }

    // Date Filters
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((tx) => new Date(tx.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((tx) => new Date(tx.date) <= to);
    }

    // Sort Order
    list.sort((a, b) => {
      const d1 = new Date(a.date).getTime();
      const d2 = new Date(b.date).getTime();
      return sortOrder === 'desc' ? d2 - d1 : d1 - d2;
    });

    return list;
  }, [data?.history, activityFilter, dateFrom, dateTo, sortOrder]);

  const getActivityBadge = (activity: string, rawType: string) => {
    if (rawType === 'PURCHASE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" />
          Confirmed Purchase
        </span>
      );
    }
    if (rawType === 'INITIAL_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
          <Package className="w-2.5 h-2.5 text-sky-600" />
          Opening Stock
        </span>
      );
    }
    if (rawType.includes('SALE') || rawType.includes('CONSUMPTION') || rawType === 'DINE_IN') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <ArrowUpRight className="w-2.5 h-2.5 text-amber-600" />
          Sale / Consumption
        </span>
      );
    }
    if (rawType.includes('TRANSFER')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
          <ArrowLeftRight className="w-2.5 h-2.5 text-indigo-600" />
          {activity}
        </span>
      );
    }
    if (rawType.includes('USAGE')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <ArrowUpRight className="w-2.5 h-2.5 text-rose-600" />
          Usage
        </span>
      );
    }
    if (rawType.includes('ADJUSTMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          Adjustment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
        {activity}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Stock History: {data?.item?.name || itemName || 'Item History'}
                </h3>
                {data?.item?.sku && (
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300">
                    {data.item.sku}
                  </span>
                )}
                <span
                  className={cn(
                    'px-2 py-0.2 rounded text-[10px] font-bold uppercase border',
                    data?.item?.trackStock !== false
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {data?.item?.trackStock !== false ? 'Stock Tracked' : 'Not Tracked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chronological stock movements, confirmed purchases, deductions, and current balances
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <RotateCcw className="w-6 h-6 animate-spin text-[#0B3D32] dark:text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">Loading stock history and purchase records...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-3.5 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                className="px-2.5 py-1 text-xs font-bold rounded bg-rose-600 text-white cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Opening Stock</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {data.item.trackStock !== false ? `${data.summary.openingStock} ${unit}` : 'Not Tracked'}
                  </div>
                </div>

                <div className="p-2.5 rounded-[3px] border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Total Stock Added</span>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                    {data.item.trackStock !== false ? `+${data.summary.totalStockAdded} ${unit}` : 'Not Tracked'}
                  </div>
                </div>

                <div className="p-2.5 rounded-[3px] border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20">
                  <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">Total Stock Deducted</span>
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                    {data.item.trackStock !== false ? `-${data.summary.totalStockRemoved} ${unit}` : 'Not Tracked'}
                  </div>
                </div>

                <div className="p-2.5 rounded-[3px] border border-[#0B3D32]/30 bg-[#E8F2EE] dark:border-emerald-700/50 dark:bg-emerald-950/30">
                  <span className="text-[10px] font-bold uppercase text-[#0B3D32] dark:text-emerald-300 block">Current Available Stock</span>
                  <div className="text-sm font-bold text-[#0B3D32] dark:text-emerald-200 font-mono mt-0.5">
                    {data.item.trackStock !== false ? `${data.summary.currentStock} ${unit}` : 'Not Tracked'}
                  </div>
                </div>

                <div className="p-2.5 rounded-[3px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 block">Total Purchase Spending</span>
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-300 font-mono mt-0.5">
                    Rs. {(data.summary.totalPurchaseAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs select-none bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Activity:</span>
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="ALL">All Activities</option>
                      <option value="PURCHASE">Purchases</option>
                      <option value="POS_CONSUMPTION">Sales / Consumption</option>
                      <option value="KITCHEN_USAGE">Kitchen Usage</option>
                      <option value="HOUSEKEEPING_USAGE">Housekeeping Usage</option>
                      <option value="TRANSFER_IN">Transfer In</option>
                      <option value="TRANSFER_OUT">Transfer Out</option>
                      <option value="ADJUSTMENT">Adjustments</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">From:</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[11px]"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">To:</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[11px]"
                    />
                  </div>

                  {(dateFrom || dateTo || activityFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setActivityFilter('ALL');
                      }}
                      className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-slate-500">Order:</span>
                  <button
                    type="button"
                    onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="border border-slate-200 dark:border-border-default rounded-[3px] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      <th className="py-2 px-2.5 w-32">Date & Time</th>
                      <th className="py-2 px-2.5 w-32">Activity</th>
                      <th className="py-2 px-2.5 min-w-[150px]">Reference / Reason</th>
                      <th className="py-2 px-2.5 w-36">Purchase Details</th>
                      <th className="py-2 px-2.5 w-24 text-right text-emerald-700 dark:text-emerald-400">Stock In</th>
                      <th className="py-2 px-2.5 w-24 text-right text-rose-700 dark:text-rose-400">Stock Out</th>
                      <th className="py-2 px-2.5 w-24 text-right">Balance</th>
                      <th className="py-2 px-2.5 w-24 text-center">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#071F1A]">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No stock movement records found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Date */}
                          <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {formatDateTime(tx.date)}
                          </td>

                          {/* Activity */}
                          <td className="py-2 px-2.5">
                            {getActivityBadge(tx.activity, tx.rawType)}
                          </td>

                          {/* Reference */}
                          <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold block">{tx.reference}</span>
                            {tx.reason && tx.reason !== tx.reference && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 italic">{tx.reason}</span>
                            )}
                          </td>

                          {/* Purchase Details */}
                          <td className="py-2 px-2.5 text-[11px]">
                            {tx.rawType === 'PURCHASE' ? (
                              <div>
                                {tx.purchaseQuantity && (
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                    Qty: {tx.purchaseQuantity}
                                  </span>
                                )}
                                {tx.purchaseAmount !== undefined && tx.purchaseAmount !== null && (
                                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                                    Total: Rs. {tx.purchaseAmount.toLocaleString()}
                                  </span>
                                )}
                                {tx.supplierName && (
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                                    {tx.supplierName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">—</span>
                            )}
                          </td>

                          {/* Stock In */}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {tx.stockIn > 0 ? `+${tx.stockIn} ${unit}` : '—'}
                          </td>

                          {/* Stock Out */}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                            {tx.stockOut > 0 ? `-${tx.stockOut} ${unit}` : '—'}
                          </td>

                          {/* Balance */}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {data.item.trackStock !== false ? `${tx.balance} ${unit}` : 'Not Tracked'}
                          </td>

                          {/* Staff */}
                          <td className="py-2 px-2.5 text-center text-slate-500 text-[11px]">
                            {tx.performedBy || 'Staff'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-border-default flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

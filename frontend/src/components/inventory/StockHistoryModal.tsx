'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { formatDateTime, cn } from '@/lib/utils';
import { RefreshCw, History, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Package, AlertCircle } from 'lucide-react';

export interface HistoryTransaction {
  id: string;
  date: string;
  activity: string;
  rawType: string;
  reference: string;
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
    currentStock: number;
    minThreshold: number;
    costPerUnit: number;
  };
  summary: {
    openingStock: number;
    totalStockAdded: number;
    totalStockRemoved: number;
    currentStock: number;
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

  const fetchHistory = async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/items/${itemId}/history`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch stock history');
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

  const unit = data?.item?.unit || 'Units';

  const getActivityBadge = (activity: string, rawType: string) => {
    if (rawType === 'PURCHASE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Purchase
        </span>
      );
    }
    if (rawType === 'INITIAL_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
          <Package className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          Opening Stock
        </span>
      );
    }
    if (rawType.includes('SALE') || rawType.includes('CONSUMPTION') || rawType === 'DINE_IN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Sale
        </span>
      );
    }
    if (rawType.includes('TRANSFER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
          <ArrowLeftRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          {activity}
        </span>
      );
    }
    if (rawType.includes('USAGE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Usage
        </span>
      );
    }
    if (rawType.includes('ADJUSTMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          Adjustment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
        {activity}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.item ? `Stock History: ${data.item.name}` : `Stock History ${itemName ? `: ${itemName}` : ''}`}
      description={data?.item ? `${data.item.department} Inventory · SKU: ${data.item.sku} · Unit: ${data.item.unit}` : 'Traceable stock movements and chronological balance history'}
      size="xl"
    >
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0B3D32] dark:text-emerald-400 mb-2" />
            <p className="text-xs font-medium">Fetching verified ledger transactions...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Error loading history:</span> {error}
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory} className="text-xs h-7 py-0">
              Retry
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Opening Stock
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {data.summary.openingStock}
                  </span>
                  <span className="text-xs text-slate-500">{unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Stock Added
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                    +{data.summary.totalStockAdded}
                  </span>
                  <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">{unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Total Stock Removed
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-rose-700 dark:text-rose-300">
                    -{data.summary.totalStockRemoved}
                  </span>
                  <span className="text-xs text-rose-600/80 dark:text-rose-400/80">{unit}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#0B3D32]/30 bg-[#E8F2EE] dark:border-emerald-700/50 dark:bg-emerald-950/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3D32] dark:text-emerald-300">
                  Current Stock
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-base font-bold text-[#0B3D32] dark:text-emerald-200">
                    {data.summary.currentStock}
                  </span>
                  <span className="text-xs text-[#0B3D32]/70 dark:text-emerald-300">{unit}</span>
                </div>
              </div>
            </div>

            {/* Stock History Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                    <TableHead className="w-36 text-xs font-bold">Date & Time</TableHead>
                    <TableHead className="w-32 text-xs font-bold">Activity</TableHead>
                    <TableHead className="text-xs font-bold">Reference / Reason</TableHead>
                    <TableHead className="w-24 text-right text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Stock In
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs font-bold text-rose-700 dark:text-rose-400">
                      Stock Out
                    </TableHead>
                    <TableHead className="w-24 text-right text-xs font-bold text-slate-900 dark:text-white">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No recorded movements found for this item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.history.map((tx) => (
                      <TableRow key={tx.id} className="text-xs hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(tx.date)}
                        </TableCell>
                        <TableCell>
                          {getActivityBadge(tx.activity, tx.rawType)}
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-xs sm:max-w-md font-medium text-slate-800 dark:text-slate-200" title={tx.reference}>
                            {tx.reference}
                          </div>
                          {tx.performedBy && (
                            <div className="text-[10px] text-slate-400">By: {tx.performedBy}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {tx.stockIn > 0 ? `+${tx.stockIn}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {tx.stockOut > 0 ? `-${tx.stockOut}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-white">
                          {tx.balance} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={fetchHistory} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Ledger
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

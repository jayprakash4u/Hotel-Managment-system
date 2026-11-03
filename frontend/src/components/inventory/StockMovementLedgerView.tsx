'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { InventoryItemData, StockMovementLedgerRecord } from '@/lib/types';

interface StockMovementLedgerViewProps {
  items: InventoryItemData[];
  initialItemId?: string | null;
}

export const StockMovementLedgerView: React.FC<StockMovementLedgerViewProps> = ({
  items,
  initialItemId,
}) => {
  const toast = useToast();

  const [movements, setMovements] = useState<StockMovementLedgerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || 'ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await api.getStockMovements({
        itemId: selectedItemId !== 'ALL' ? selectedItemId : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        movementType: movementTypeFilter !== 'ALL' ? movementTypeFilter : undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
        search: searchQuery || undefined,
      });
      setMovements(data || []);
    } catch (err: any) {
      console.error('Failed to load stock movements:', err);
      toast.error('Load Error', err.message || 'Could not fetch stock movement ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [selectedItemId, movementTypeFilter, departmentFilter, startDate, endDate]);

  // Client search if needed
  const filteredMovements = useMemo(() => {
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase().trim();
    return movements.filter(
      (m) =>
        m.itemName?.toLowerCase().includes(q) ||
        m.itemCode?.toLowerCase().includes(q) ||
        m.referenceNumber?.toLowerCase().includes(q) ||
        m.reason?.toLowerCase().includes(q) ||
        m.performedBy?.toLowerCase().includes(q)
    );
  }, [movements, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const totalIn = filteredMovements.reduce((acc, m) => acc + (m.quantityIn || 0), 0);
    const totalOut = filteredMovements.reduce((acc, m) => acc + (m.quantityOut || 0), 0);
    const adjustments = filteredMovements.filter((m) =>
      m.movementType.includes('ADJUSTMENT') || m.movementType.includes('WASTAGE') || m.movementType.includes('DAMAGED')
    ).length;

    return {
      totalMovements: filteredMovements.length,
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      adjustments,
    };
  }, [filteredMovements]);

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / pageSize) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  // Format Movement Type display badge
  const formatMovementType = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'OPENING_STOCK' || t === 'INITIAL_STOCK') {
      return { label: 'Opening Stock', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (t === 'PURCHASE' || t === 'PURCHASE_RECEIVED') {
      return { label: 'Purchase Received', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (t === 'SALES_DEDUCTION' || t === 'POS_CONSUMPTION') {
      return { label: 'Sales Deduction', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (t === 'KITCHEN_USAGE' || t === 'KITCHEN_CONSUMPTION') {
      return { label: 'Kitchen Consumption', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (t === 'HOUSEKEEPING_USAGE') {
      return { label: 'Housekeeping Usage', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (t === 'BAR_CONSUMPTION') {
      return { label: 'Bar Consumption', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (t === 'TRANSFER_IN') {
      return { label: 'Stock Transfer In', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    }
    if (t === 'TRANSFER_OUT') {
      return { label: 'Stock Transfer Out', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
    if (t === 'ADJUSTMENT_INCREASE' || t === 'ADJUSTMENT_IN') {
      return { label: 'Adjustment Increase', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (t === 'ADJUSTMENT_DECREASE' || t === 'ADJUSTMENT_OUT') {
      return { label: 'Adjustment Decrease', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (t === 'DAMAGED_STOCK') {
      return { label: 'Damaged Stock', color: 'bg-rose-50 text-rose-800 border-rose-300' };
    }
    if (t === 'EXPIRED_STOCK') {
      return { label: 'Expired Stock', color: 'bg-red-50 text-red-800 border-red-300' };
    }
    if (t === 'WASTAGE') {
      return { label: 'Wastage', color: 'bg-orange-50 text-orange-800 border-orange-200' };
    }
    if (t === 'PURCHASE_RETURN') {
      return { label: 'Purchase Return', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
    return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#00A884] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Stock Movement Ledger
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Audited Stock Log
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete chronological audit trail of all inventory increases, deductions, transfers and stock adjustments.
            </p>
          </div>
        </div>

        {/* Item Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Filter Item:
          </label>
          <div className="relative min-w-[220px]">
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-[4px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00A884] shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Items</option>
              <optgroup label="Inventory Items">
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Movements
          </span>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">
            {metrics.totalMovements.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Audit entries recorded
          </div>
        </div>

        <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Inflow (+)
          </span>
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
            +{metrics.totalIn.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Purchases, transfers & adjustments
          </div>
        </div>

        <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Outflow (-)
          </span>
          <div className="text-base font-bold text-rose-700 dark:text-rose-400 font-mono mt-1">
            -{metrics.totalOut.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sales, usage, transfers & wastage
          </div>
        </div>

        <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Adjustments & Wastage
          </span>
          <div className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono mt-1">
            {metrics.adjustments}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Count corrections & wastage logs
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Item, Ref #, Reason..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00A884]"
              />
            </div>

            {/* Movement Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Movement Type:</span>
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#00A884] cursor-pointer"
              >
                <option value="ALL">All Movement Types</option>
                <option value="PURCHASE">Purchase Received</option>
                <option value="POS_CONSUMPTION">Sales Deduction</option>
                <option value="KITCHEN_USAGE">Kitchen Consumption</option>
                <option value="HOUSEKEEPING_USAGE">Housekeeping Usage</option>
                <option value="TRANSFER_IN">Stock Transfer In</option>
                <option value="TRANSFER_OUT">Stock Transfer Out</option>
                <option value="ADJUSTMENT_INCREASE">Stock Adjustment Increase</option>
                <option value="ADJUSTMENT_DECREASE">Stock Adjustment Decrease</option>
                <option value="DAMAGED_STOCK">Damaged Stock</option>
                <option value="EXPIRED_STOCK">Expired Stock</option>
                <option value="WASTAGE">Wastage</option>
                <option value="PURCHASE_RETURN">Purchase Return</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#00A884] cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="HOTEL">Hotel</option>
                <option value="RESTAURANT">Restaurant</option>
              </select>
            </div>
          </div>

          {/* Date Range & Clear */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] focus:outline-none focus:border-[#00A884]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] focus:outline-none focus:border-[#00A884]"
              />
            </div>

            {(searchQuery || movementTypeFilter !== 'ALL' || departmentFilter !== 'ALL' || startDate || endDate || selectedItemId !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMovementTypeFilter('ALL');
                  setDepartmentFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                  setSelectedItemId('ALL');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-[3px] bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <th className="py-2.5 px-3">Date and Time</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Movement Type</th>
                <th className="py-2.5 px-3">Reference Number</th>
                <th className="py-2.5 px-3 text-right">Quantity In</th>
                <th className="py-2.5 px-3 text-right">Quantity Out</th>
                <th className="py-2.5 px-3 text-right">Previous Balance</th>
                <th className="py-2.5 px-3 text-right">New Balance</th>
                <th className="py-2.5 px-3">Stock Unit</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading stock movement records...
                  </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No stock movements found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m) => {
                  const badge = formatMovementType(m.movementType);
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date and Time */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {new Date(m.createdAt).toLocaleString('en-GB')}
                      </td>

                      {/* Item Name */}
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        {m.itemName}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {m.itemCode}
                        </span>
                      </td>

                      {/* Movement Type */}
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
                            badge.color
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Reference Number */}
                      <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {m.referenceNumber}
                      </td>

                      {/* Quantity In */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {m.quantityIn > 0 ? `+${m.quantityIn}` : '—'}
                      </td>

                      {/* Quantity Out */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                        {m.quantityOut > 0 ? `-${m.quantityOut}` : '—'}
                      </td>

                      {/* Previous Balance */}
                      <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                        {m.previousBalance !== null && m.previousBalance !== undefined ? m.previousBalance : '—'}
                      </td>

                      {/* New Balance */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        {m.newBalance !== null && m.newBalance !== undefined ? m.newBalance : '—'}
                      </td>

                      {/* Stock Unit */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">
                        {m.stockUnit}
                      </td>

                      {/* Reason */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={m.reason}>
                        {m.reason}
                      </td>

                      {/* Performed By */}
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200 font-medium">
                        {m.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-2">
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredMovements.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredMovements.length)} of {filteredMovements.length} movements
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  FileText,
  Calendar,
  Filter,
  Package,
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle,
  Building,
} from 'lucide-react';
import { InventoryItem, SupplierOption } from './DepartmentInventoryView';
import { AddPurchaseModal } from './AddPurchaseModal';

export interface PurchaseRecord {
  id: string;
  poNumber: string;
  invoiceNumber?: string;
  supplierId?: string;
  supplier?: { id: string; name: string; contactName?: string; email?: string; phone?: string };
  totalAmount: number;
  status: string;
  itemsJson: string;
  allocationsJson?: string;
  orderedAt: string;
  receivedAt?: string;
}

interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  items: InventoryItem[];
  suppliers: SupplierOption[];
  loading: boolean;
  onRefresh: () => void;
}

export interface PurchaseHistoryItem {
  id: string;
  poId: string;
  poNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  itemId?: string;
  itemName: string;
  category: string;
  department: string;
  quantity: number;
  unit: string;
  totalCost: number;
  supplierId?: string;
  supplierName: string;
  trackStock: boolean;
  status: string;
  rawPo: PurchaseRecord;
}

type DateFilterType = 'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

// =========================================================================
// HELPER: CALCULATE COMPATIBLE TOTAL QUANTITY
// Evaluates whether recorded quantities for an item can be summed
// =========================================================================
function calculateCompatibleTotalQuantity(records: Array<{ quantity: number; unit: string }>): {
  compatible: boolean;
  total?: number;
  unit?: string;
  message?: string;
} {
  if (records.length === 0) {
    return { compatible: true, total: 0, unit: '' };
  }

  const normalized = records.map((r) => ({
    qty: Number(r.quantity) || 0,
    unit: (r.unit || '').trim().toLowerCase(),
    origUnit: r.unit || '',
  }));

  const firstUnit = normalized[0].unit;
  const allIdentical = normalized.every((r) => r.unit === firstUnit);
  if (allIdentical) {
    const sum = normalized.reduce((acc, r) => acc + r.qty, 0);
    return {
      compatible: true,
      total: Math.round(sum * 100) / 100,
      unit: records[0].unit,
    };
  }

  // Weight compatibility (kg vs g)
  const isWeight = normalized.every((r) =>
    ['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams'].includes(r.unit)
  );
  if (isWeight) {
    let totalKg = 0;
    for (const r of normalized) {
      if (['g', 'gram', 'grams'].includes(r.unit)) {
        totalKg += r.qty / 1000;
      } else {
        totalKg += r.qty;
      }
    }
    return {
      compatible: true,
      total: Math.round(totalKg * 100) / 100,
      unit: 'kg',
    };
  }

  // Volume compatibility (l vs ml)
  const isVolume = normalized.every((r) =>
    ['l', 'litre', 'litres', 'liter', 'liters', 'ml', 'millilitres', 'milliliters'].includes(r.unit)
  );
  if (isVolume) {
    let totalL = 0;
    for (const r of normalized) {
      if (['ml', 'millilitres', 'milliliters'].includes(r.unit)) {
        totalL += r.qty / 1000;
      } else {
        totalL += r.qty;
      }
    }
    return {
      compatible: true,
      total: Math.round(totalL * 100) / 100,
      unit: 'litres',
    };
  }

  // Count/Pieces compatibility
  const isPieces = normalized.every((r) =>
    ['pcs', 'piece', 'pieces', 'unit', 'units'].includes(r.unit)
  );
  if (isPieces) {
    const sum = normalized.reduce((acc, r) => acc + r.qty, 0);
    return {
      compatible: true,
      total: Math.round(sum),
      unit: 'pieces',
    };
  }

  // Incompatible units (e.g. boxes vs kg)
  const distinctUnits = Array.from(new Set(normalized.map((r) => r.origUnit))).filter(Boolean);
  return {
    compatible: false,
    message: `Different units used (${distinctUnits.join(', ')})`,
  };
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  items,
  suppliers,
  loading,
  onRefresh,
}) => {
  const toast = useToast();

  // Modals
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<PurchaseHistoryItem | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedItemFilter, setSelectedItemFilter] = useState('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Flatten purchases into individual line entries
  const allHistoryItems = useMemo<PurchaseHistoryItem[]>(() => {
    const list: PurchaseHistoryItem[] = [];

    for (const po of purchases) {
      let lines: any[] = [];
      try {
        lines = JSON.parse(po.itemsJson || '[]');
      } catch {
        lines = [];
      }

      if (!Array.isArray(lines) || lines.length === 0) {
        // Fallback for single purchase with no parsed items
        list.push({
          id: po.id,
          poId: po.id,
          poNumber: po.poNumber,
          invoiceNumber: po.invoiceNumber || '—',
          purchaseDate: po.orderedAt,
          itemName: 'General Supplies',
          category: 'GENERAL',
          department: 'RESTAURANT',
          quantity: 1,
          unit: 'units',
          totalCost: po.totalAmount,
          supplierId: po.supplierId,
          supplierName: po.supplier?.name || 'Direct Purchase',
          trackStock: false,
          status: po.status,
          rawPo: po,
        });
      } else {
        lines.forEach((line, idx) => {
          // Cross-reference with item list for category/trackStock if missing
          const matchedItem = items.find((i) => i.id === line.itemId || i.name.toLowerCase() === (line.itemName || '').toLowerCase());
          const cat = line.category || matchedItem?.category || 'GENERAL';
          const dept = line.department || matchedItem?.department || 'RESTAURANT';
          const isTrack = typeof line.trackStock === 'boolean'
            ? line.trackStock
            : matchedItem ? matchedItem.trackStock !== false : true;

          list.push({
            id: `${po.id}-${idx}`,
            poId: po.id,
            poNumber: po.poNumber,
            invoiceNumber: po.invoiceNumber || line.invoiceNumber || '—',
            purchaseDate: line.purchaseDate || po.orderedAt,
            itemId: line.itemId || matchedItem?.id,
            itemName: line.itemName || matchedItem?.name || 'Unnamed Item',
            category: cat,
            department: dept,
            quantity: Number(line.quantity) || 0,
            unit: line.unit || matchedItem?.unit || 'pieces',
            totalCost: Number(line.totalCost ?? (lines.length === 1 ? po.totalAmount : 0)) || 0,
            supplierId: po.supplierId,
            supplierName: po.supplier?.name || 'Direct Purchase',
            trackStock: isTrack,
            status: po.status,
            rawPo: po,
          });
        });
      }
    }

    return list.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [purchases, items]);

  // Distinct item names for item filter dropdown
  const distinctItemNames = useMemo(() => {
    const set = new Set<string>();
    allHistoryItems.forEach((item) => {
      if (item.itemName) set.add(item.itemName);
    });
    // Also include catalog items
    items.forEach((item) => {
      if (item.name) set.add(item.name);
    });
    return Array.from(set).sort();
  }, [allHistoryItems, items]);

  // 2. Filter purchases by Date, Item, Supplier, and Search
  const filteredHistory = useMemo(() => {
    const now = new Date();

    return allHistoryItems.filter((item) => {
      const pDate = new Date(item.purchaseDate);

      // Date Range Filter
      if (dateFilter === 'THIS_WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (pDate < weekAgo) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (pDate < firstOfMonth) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) {
          const s = new Date(customStartDate);
          s.setHours(0, 0, 0, 0);
          if (pDate < s) return false;
        }
        if (customEndDate) {
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          if (pDate > e) return false;
        }
      }

      // Item Filter
      if (selectedItemFilter !== 'ALL') {
        if (item.itemName.toLowerCase() !== selectedItemFilter.toLowerCase()) {
          return false;
        }
      }

      // Supplier Filter
      if (selectedSupplierFilter !== 'ALL') {
        if (item.supplierId !== selectedSupplierFilter && item.supplierName.toLowerCase() !== selectedSupplierFilter.toLowerCase()) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.itemName.toLowerCase().includes(q);
        const matchesInv = item.invoiceNumber.toLowerCase().includes(q);
        const matchesPo = item.poNumber.toLowerCase().includes(q);
        const matchesSup = item.supplierName.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesInv && !matchesPo && !matchesSup && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [allHistoryItems, dateFilter, customStartDate, customEndDate, selectedItemFilter, selectedSupplierFilter, searchQuery]);

  // 3. Reports & Summaries
  const totalExpenditure = useMemo(() => {
    return filteredHistory.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [filteredHistory]);

  const resaleExpenditure = useMemo(() => {
    return filteredHistory.filter((i) => i.trackStock).reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [filteredHistory]);

  const purchaseOnlyExpenditure = useMemo(() => {
    return filteredHistory.filter((i) => !i.trackStock).reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [filteredHistory]);

  // Total quantity for an individual item (evaluated only when single item is filtered)
  const itemQuantitySummary = useMemo(() => {
    if (selectedItemFilter === 'ALL') {
      return null;
    }
    const itemRecords = filteredHistory.filter(
      (i) => i.itemName.toLowerCase() === selectedItemFilter.toLowerCase()
    );
    return calculateCompatibleTotalQuantity(itemRecords);
  }, [filteredHistory, selectedItemFilter]);

  return (
    <div className="space-y-5 select-none">
      {/* ========================================================================= */}
      {/* 1. HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Purchases & Procurement
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unified purchase ledger for stock-tracked resale products and operational expense supplies
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddPurchaseOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Purchase
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY & EXPENDITURE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Purchase Expenditure */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Purchase Expenditure
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-[#0B3D32] dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalExpenditure)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {dateFilter === 'ALL'
              ? 'Cumulative expenditure across all purchases'
              : dateFilter === 'THIS_WEEK'
              ? 'Expenditure logged for this week'
              : dateFilter === 'THIS_MONTH'
              ? 'Expenditure logged for this month'
              : 'Expenditure for selected date range'}
          </p>
        </div>

        {/* Card 2: Filtered Item Quantity OR Total Purchase Count */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {selectedItemFilter !== 'ALL' ? `Total Quantity: ${selectedItemFilter}` : 'Purchases Recorded'}
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Package className="w-4 h-4" />
            </div>
          </div>

          {selectedItemFilter !== 'ALL' && itemQuantitySummary ? (
            itemQuantitySummary.compatible ? (
              <>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {itemQuantitySummary.total} <span className="text-sm font-semibold uppercase">{itemQuantitySummary.unit}</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Compatible units verified for {selectedItemFilter}
                </p>
              </>
            ) : (
              <>
                <div className="mt-2 text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Incompatible Units
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {itemQuantitySummary.message}
                </p>
              </>
            )
          ) : (
            <>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {filteredHistory.length} <span className="text-sm font-semibold text-slate-400">items</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Across {new Set(filteredHistory.map((i) => i.poId)).size} purchase invoices
              </p>
            </>
          )}
        </div>

        {/* Card 3: Resale vs Purchase-Only Breakdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Procurement Breakdown
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Resale (Stock):
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(resaleExpenditure)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Supplies & Raw:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(purchaseOnlyExpenditure)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Split by inventory tracking configuration</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTERS (DATE, ITEM, SUPPLIER, SEARCH) */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 dark:bg-[#071F1A] dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Range Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            <button
              onClick={() => setDateFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                dateFilter === 'ALL'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('THIS_WEEK')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                dateFilter === 'THIS_WEEK'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('THIS_MONTH')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                dateFilter === 'THIS_MONTH'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('CUSTOM')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                dateFilter === 'CUSTOM'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              Custom Range
            </button>
          </div>

          {/* Reset Filters */}
          {(dateFilter !== 'ALL' || selectedItemFilter !== 'ALL' || selectedSupplierFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setDateFilter('ALL');
                setSelectedItemFilter('ALL');
                setSelectedSupplierFilter('ALL');
                setSearchQuery('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
            <span className="font-semibold text-slate-600 dark:text-slate-300 ml-2">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
        )}

        {/* Item Filter, Supplier Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Item Filter */}
          <div>
            <select
              value={selectedItemFilter}
              onChange={(e) => setSelectedItemFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
            >
              <option value="ALL">All Items (Catalog & Purchases)</option>
              {distinctItemNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
            >
              <option value="ALL">All Suppliers (Direct & Vendors)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div>
            <Input
              placeholder="Search item, invoice #, supplier..."
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PURCHASE HISTORY TABLE */}
      {/* Columns: Date | Item Name | Item Category | Quantity & Unit | Total Cost | Supplier | Invoice Number | Actions */}
      {/* ========================================================================= */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#071F1A] shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/60">
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Date</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Item Name</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Item Category</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Quantity & Unit</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Total Cost</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Supplier</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Invoice #</TableHead>
              <TableHead className="text-right font-bold text-xs text-slate-900 dark:text-white">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B3D32] dark:text-emerald-400 mb-2" />
                  Loading purchase records...
                </TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No purchase records found</p>
                    <p className="text-[11px] text-slate-400">
                      {searchQuery || dateFilter !== 'ALL' || selectedItemFilter !== 'ALL' || selectedSupplierFilter !== 'ALL'
                        ? 'No purchases match your active filter criteria.'
                        : 'No purchases recorded yet. Click "+ Add Purchase" to log your first supplier delivery.'}
                    </p>
                    <div className="pt-1">
                      <Button variant="primary" size="sm" onClick={() => setIsAddPurchaseOpen(true)} className="text-xs">
                        + Add Purchase
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => {
                return (
                  <TableRow key={item.id} className="text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {/* 1. Date */}
                    <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                      {formatDate(item.purchaseDate)}
                    </TableCell>

                    {/* 2. Item Name */}
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.itemName}</span>
                        {item.trackStock ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Resale
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Purchase Only
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Ref: {item.poNumber}
                      </div>
                    </TableCell>

                    {/* 3. Item Category */}
                    <TableCell className="text-slate-600 dark:text-slate-300 font-medium">
                      {item.category.replace(/_/g, ' ')}
                    </TableCell>

                    {/* 4. Quantity and Unit */}
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-white">
                      {item.quantity} <span className="text-[11px] font-normal text-slate-500 uppercase">{item.unit}</span>
                    </TableCell>

                    {/* 5. Total Cost */}
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(item.totalCost)}
                    </TableCell>

                    {/* 6. Supplier */}
                    <TableCell className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">
                      {item.supplierName}
                    </TableCell>

                    {/* 7. Invoice Number */}
                    <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                      {item.invoiceNumber || '—'}
                    </TableCell>

                    {/* 8. Details */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItemDetail(item)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs h-7 py-1 px-2.5"
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL 1: UNIFIED ADD PURCHASE FORM */}
      {/* ========================================================================= */}
      <AddPurchaseModal
        isOpen={isAddPurchaseOpen}
        onClose={() => setIsAddPurchaseOpen(false)}
        items={items}
        suppliers={suppliers}
        onPurchaseCompleted={onRefresh}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL 2: VIEW PURCHASE LINE DETAILS */}
      {/* ========================================================================= */}
      {selectedItemDetail && (
        <Modal
          isOpen={Boolean(selectedItemDetail)}
          onClose={() => setSelectedItemDetail(null)}
          title={`Purchase Record: ${selectedItemDetail.itemName}`}
          description={`Logged on ${formatDateTime(selectedItemDetail.purchaseDate)}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Item Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedItemDetail.itemName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedItemDetail.category.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity Purchased</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedItemDetail.quantity} {selectedItemDetail.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Cost</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(selectedItemDetail.totalCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Supplier</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedItemDetail.supplierName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {selectedItemDetail.invoiceNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Reference</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {selectedItemDetail.poNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tracking Type</span>
                <span className="font-semibold">
                  {selectedItemDetail.trackStock ? (
                    <span className="text-emerald-700 dark:text-emerald-400">Resale (Tracked Stock)</span>
                  ) : (
                    <span className="text-blue-700 dark:text-blue-400">Purchase History Only</span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400">
              {selectedItemDetail.trackStock ? (
                <p>
                  📦 <strong>Resale Product:</strong> Stock was increased when this purchase was logged and is automatically deducted when sold via restaurant or room service orders.
                </p>
              ) : (
                <p>
                  📝 <strong>Purchase History Only:</strong> Saved as an operational expense record. Does not track current stock or deduct quantities when dishes or services are ordered.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedItemDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

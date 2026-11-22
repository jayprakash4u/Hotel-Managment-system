'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ProductLedgerResponse,
  ProductLedgerEntry,
  ProductLedgerSelectedItem,
  ProductLedgerItemOption,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function ProductLedgerTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error } = useToast();

  const initialItemId = searchParams.get('itemId') || '';

  // Data States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductLedgerResponse | null>(null);

  // Filter States
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'balanceQty' | 'balanceVal'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load Data
  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await api.getProductLedger({
        itemId: selectedItemId || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        transactionType: transactionTypeFilter !== 'ALL' ? transactionTypeFilter : undefined,
        dateFrom: fromDate || undefined,
        dateTo: toDate || undefined,
        search: searchQuery || undefined,
      });

      setData(res);
      // Auto-set selected item id if none was explicitly picked
      if (!selectedItemId && res.selectedItem) {
        setSelectedItemId(res.selectedItem.id);
      }
    } catch (err: any) {
      console.error('Failed to load product ledger:', err);
      error(err.message || 'Failed to load product ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [selectedItemId, categoryFilter, departmentFilter, transactionTypeFilter, fromDate, toDate]);

  // Handle Preset Dates
  const applyDatePreset = (preset: 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => {
    setActiveDatePreset(preset);
    const now = new Date();

    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
    } else if (preset === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
    } else if (preset === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
    }
  };

  const handleClearFilters = () => {
    setCategoryFilter('ALL');
    setDepartmentFilter('ALL');
    setTransactionTypeFilter('ALL');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setActiveDatePreset('ALL');
    setCurrentPage(1);
  };

  // Filter & Search local rows
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    let list = [...data.entries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.referenceNumber.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.transactionType.toLowerCase().includes(q) ||
          r.performedBy.toLowerCase().includes(q)
      );
    }

    if (sortField === 'date') {
      list.sort((a, b) => {
        const tA = new Date(a.date).getTime();
        const tB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? tA - tB : tB - tA;
      });
    } else if (sortField === 'balanceQty') {
      list.sort((a, b) => (sortOrder === 'asc' ? a.balanceQuantity - b.balanceQuantity : b.balanceQuantity - a.balanceQuantity));
    } else if (sortField === 'balanceVal') {
      list.sort((a, b) => (sortOrder === 'asc' ? a.balanceValue - b.balanceValue : b.balanceValue - a.balanceValue));
    }

    return list;
  }, [data?.entries, searchQuery, sortField, sortOrder]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredEntries.length) {
      error('No ledger records to export');
      return;
    }

    const headers = [
      'Date',
      'Reference No',
      'Transaction Type',
      'Description',
      'Qty In',
      'Qty Out',
      'Balance Qty',
      'Unit Cost (NPR)',
      'Stock In Value (NPR)',
      'Stock Out Value (NPR)',
      'Balance Value (NPR)',
    ];

    const rows = filteredEntries.map((e) => [
      new Date(e.date).toLocaleString(),
      `"${e.referenceNumber}"`,
      `"${e.transactionType}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.quantityIn,
      e.quantityOut,
      e.balanceQuantity,
      e.unitCost.toFixed(2),
      e.stockInValue.toFixed(2),
      e.stockOutValue.toFixed(2),
      e.balanceValue.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Ledger_${data?.selectedItem?.sku || 'Item'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Product ledger exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItem = data?.selectedItem;
  const summary = data?.summary;

  return (
    <div className="space-y-4 pb-12 text-slate-800 dark:text-slate-100">
      {/* 1. Header with Breadcrumb & Costing Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link
              href="/accounts"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accounts Dashboard
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Product Ledger</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Product Ledger
            </h1>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Moving Weighted Average Cost
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Item-wise stock transactions, chronological running quantities, and perpetual inventory values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLedger}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            Print
          </button>
          <Link
            href="/accounts?tab=inventory-valuation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm"
          >
            Inventory Valuation
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inventory Items
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary?.totalInventoryItems ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Tracked across Hotel & Restaurant
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Period Stock In Qty
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +{summary?.totalStockInQuantity ?? 0} {selectedItem?.unit || 'units'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Purchases & inward adjustments
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            Period Stock Out Qty
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            -{summary?.totalStockOutQuantity ?? 0} {selectedItem?.unit || 'units'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Sales, consumption & usage
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inventory Value
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            NPR {(summary?.totalInventoryValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            GL Asset Acct: 1200 / 1210
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="p-3 rounded border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-850 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* Item Selector */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select Product / Item *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-medium rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {data?.items && data.items.length > 0 ? (
                data.items.map((it) => (
                  <option key={it.id} value={it.id}>
                    [{it.sku}] {it.name} ({it.department} · {it.currentStock} {it.unit})
                  </option>
                ))
              ) : (
                <option value="">No items available</option>
              )}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Categories</option>
              <option value="BEVERAGES">Beverages</option>
              <option value="FOOD_RAW">Food & Groceries</option>
              <option value="LINEN">Linen</option>
              <option value="TOILETRIES">Toiletries</option>
              <option value="CLEANING_SUPPLIES">Cleaning Supplies</option>
              <option value="MINIBAR">Minibar</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Departments</option>
              <option value="HOTEL">Hotel</option>
              <option value="RESTAURANT">Restaurant</option>
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Transaction Type
            </label>
            <select
              value={transactionTypeFilter}
              onChange={(e) => {
                setTransactionTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Types</option>
              <option value="OPENING">Opening Stock</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale / POS</option>
              <option value="ADJUSTMENT">Stock Adjustment</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RETURN">Return</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Search Ref / Details
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Date Presets and Range */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActiveDatePreset('ALL');
                setCurrentPage(1);
              }}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActiveDatePreset('ALL');
                setCurrentPage(1);
              }}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-800 dark:text-slate-200"
            />

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => applyDatePreset('ALL')}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded transition-colors',
                  activeDatePreset === 'ALL'
                    ? 'bg-sky-600 text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                )}
              >
                All Time
              </button>
              <button
                onClick={() => applyDatePreset('THIS_MONTH')}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded transition-colors',
                  activeDatePreset === 'THIS_MONTH'
                    ? 'bg-sky-600 text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                )}
              >
                This Month
              </button>
              <button
                onClick={() => applyDatePreset('LAST_MONTH')}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded transition-colors',
                  activeDatePreset === 'LAST_MONTH'
                    ? 'bg-sky-600 text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                )}
              >
                Last Month
              </button>
              <button
                onClick={() => applyDatePreset('THIS_YEAR')}
                className={cn(
                  'px-2 py-0.5 text-[11px] rounded transition-colors',
                  activeDatePreset === 'THIS_YEAR'
                    ? 'bg-sky-600 text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                )}
              >
                This Year
              </button>
            </div>
          </div>

          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* 4. Selected Product Summary Overview Card */}
      {selectedItem && (
        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm">
                {selectedItem.sku.slice(0, 3)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedItem.name}
                  </h2>
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    ({selectedItem.sku})
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    · {selectedItem.category} · {selectedItem.department}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Primary Supplier: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedItem.supplierName}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Current Stock</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedItem.currentStock} {selectedItem.unit}
                </div>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-700/60 pl-4">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Unit Cost (Moving Avg)</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  NPR {selectedItem.costPerUnit.toFixed(2)}
                </div>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-700/60 pl-4">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Valuation</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  NPR {selectedItem.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Period Balances & Reconciliation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Opening Balance (as of period start):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {summary?.openingStockQuantity ?? 0} {selectedItem.unit}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1.5">
                (NPR {(summary?.openingStockValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Closing Balance (as of period end):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {summary?.closingStockQuantity ?? 0} {selectedItem.unit}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1.5">
                (NPR {(summary?.closingStockValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Period Net Flow:</span>
              <span className={cn(
                'font-semibold',
                (summary?.netQuantityChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {(summary?.netQuantityChange ?? 0) > 0 ? '+' : ''}{summary?.netQuantityChange ?? 0} {selectedItem.unit}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                {summary?.isReconciledWithInventory
                  ? 'Reconciled with live stock in Inventory'
                  : `Closing balance matches historical transactions (${summary?.closingStockQuantity} vs system ${summary?.currentSystemStock})`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Product Ledger Grid Table */}
      <div className="rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm overflow-hidden">
        {/* Table top info & page size */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600 dark:text-slate-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-slate-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-600 dark:text-slate-400">entries</span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                <th
                  onClick={() => {
                    if (sortField === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('date');
                      setSortOrder('asc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Reference No.</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Transaction Type</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Description</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Quantity In</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Quantity Out</th>
                <th
                  onClick={() => {
                    if (sortField === 'balanceQty') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('balanceQty');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Balance Qty {sortField === 'balanceQty' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Unit Cost (NPR)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Stock In Value</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Stock Out Value</th>
                <th
                  onClick={() => {
                    if (sortField === 'balanceVal') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('balanceVal');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Balance Value (NPR) {sortField === 'balanceVal' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      Loading product ledger entries...
                    </div>
                  </td>
                </tr>
              ) : paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No ledger transactions found for the selected product and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((row, idx) => {
                  const isPurchase = row.rawType === 'PURCHASE';
                  const isSale = row.rawType.includes('SALE') || row.rawType.includes('POS');
                  const isAdj = row.rawType.includes('ADJUST');
                  const isOpening = row.rawType === 'INITIAL_STOCK' || row.rawType === 'OPENING';

                  return (
                    <tr
                      key={row.id || idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* Date */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {new Date(row.date).toLocaleString([], {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Reference No. */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-mono font-medium text-slate-900 dark:text-white">
                        {row.referenceNumber}
                      </td>

                      {/* Transaction Type - Clean without outline boxes */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                        <span
                          className={cn(
                            'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                            isPurchase ? 'bg-emerald-500' :
                            isSale ? 'bg-blue-500' :
                            isAdj ? 'bg-amber-500' :
                            isOpening ? 'bg-purple-500' : 'bg-slate-400'
                          )}
                        />
                        {row.transactionType}
                      </td>

                      {/* Description */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={row.description}>
                        {row.description}
                      </td>

                      {/* Quantity In */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {row.quantityIn > 0 ? `+${row.quantityIn}` : '-'}
                      </td>

                      {/* Quantity Out */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-medium text-rose-600 dark:text-rose-400">
                        {row.quantityOut > 0 ? `-${row.quantityOut}` : '-'}
                      </td>

                      {/* Balance Quantity */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-bold text-slate-900 dark:text-white">
                        {row.balanceQuantity} {selectedItem?.unit}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-700 dark:text-slate-200">
                        {row.unitCost > 0 ? row.unitCost.toFixed(2) : '-'}
                      </td>

                      {/* Stock In Value */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {row.stockInValue > 0 ? row.stockInValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Stock Out Value */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-rose-600 dark:text-rose-400">
                        {row.stockOutValue > 0 ? row.stockOutValue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Balance Value */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.balanceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Action - Link to source transaction */}
                      <td className="py-2 px-3 text-center">
                        {isPurchase ? (
                          <Link
                            href={`/accounts?tab=purchase-transactions&search=${encodeURIComponent(row.referenceNumber)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                            title="View Purchase Transaction"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Link>
                        ) : isSale ? (
                          <Link
                            href={`/accounts?tab=sales-transactions&search=${encodeURIComponent(row.referenceNumber)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            title="View Sales Transaction"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-700/60 bg-[#F8F9FA] dark:bg-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
            Showing {filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded border',
                    currentPage === pageNum
                      ? 'bg-sky-600 border-sky-600 text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-slate-400">... {totalPages}</span>}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

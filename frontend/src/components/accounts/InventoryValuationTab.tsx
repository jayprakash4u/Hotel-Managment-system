'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeDollarSign,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  RotateCcw,
  Boxes,
  Building2,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  InventoryValuationResponse,
  ValuationItem,
  ValuationCategoryBreakdown,
  ValuationDepartmentBreakdown,
  ValuationGlReconciliation,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function InventoryValuationTab() {
  const router = useRouter();
  const { success, error } = useToast();

  // Data States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryValuationResponse | null>(null);

  // Filter States
  const [asOfDate, setAsOfDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'cost' | 'value'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load Valuation Data
  const loadValuation = async () => {
    setLoading(true);
    try {
      const res = await api.getInventoryValuation({
        asOfDate: asOfDate || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        stockStatus: stockStatusFilter !== 'ALL' ? stockStatusFilter : undefined,
        search: searchQuery || undefined,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load inventory valuation:', err);
      error(err.message || 'Failed to load inventory valuation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValuation();
  }, [asOfDate, categoryFilter, departmentFilter, stockStatusFilter]);

  const handleClearFilters = () => {
    setAsOfDate('');
    setCategoryFilter('ALL');
    setDepartmentFilter('ALL');
    setStockStatusFilter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter & Search local items
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let list = [...data.items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.itemName.toLowerCase().includes(q) ||
          it.itemCode.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.supplierName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.itemName.localeCompare(b.itemName) : b.itemName.localeCompare(a.itemName);
      } else if (sortField === 'quantity') {
        return sortOrder === 'asc' ? a.currentQuantity - b.currentQuantity : b.currentQuantity - a.currentQuantity;
      } else if (sortField === 'cost') {
        return sortOrder === 'asc' ? a.valuationCost - b.valuationCost : b.valuationCost - a.valuationCost;
      } else if (sortField === 'value') {
        return sortOrder === 'asc' ? a.totalStockValue - b.totalStockValue : b.totalStockValue - a.totalStockValue;
      }
      return 0;
    });

    return list;
  }, [data?.items, searchQuery, sortField, sortOrder]);

  // Paginated Items
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredItems.length) {
      error('No valuation items to export');
      return;
    }

    const headers = [
      'SN',
      'Item Code',
      'Item Name',
      'Category',
      'Department',
      'Current Quantity',
      'Unit',
      'Valuation Cost (NPR)',
      'Total Stock Value (NPR)',
      'Stock Status',
      'Supplier',
    ];

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${item.itemCode}"`,
      `"${item.itemName.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.department}"`,
      item.currentQuantity,
      `"${item.unit}"`,
      item.valuationCost.toFixed(2),
      item.totalStockValue.toFixed(2),
      `"${item.stockStatus}"`,
      `"${item.supplierName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Inventory valuation exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = data?.summary;
  const gl = data?.glReconciliation;

  return (
    <div className="space-y-4 pb-12 text-slate-800 dark:text-slate-100">
      {/* 1. Header with Breadcrumb & Navigation */}
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
            <span className="font-semibold text-slate-700 dark:text-slate-200">Inventory Valuation</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Inventory Valuation
            </h1>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Perpetual Balance & GL Reconciliation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Financial value of all inventory held across Hotel and Restaurant operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadValuation}
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
            href="/accounts?tab=product-ledger"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm"
          >
            Product Ledger
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm md:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inventory Value
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            NPR {(summary?.totalInventoryValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Moving Weighted Average
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Tracked Items
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary?.totalInventoryItems ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Distinct Inventory SKUs
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            In Stock Items
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {summary?.inStockCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Above reorder threshold
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Low Stock Alerts
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {summary?.lowStockCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Requires restocking
          </div>
        </div>

        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Out of Stock
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {summary?.outOfStockCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Zero or negative stock
          </div>
        </div>
      </div>

      {/* 3. General Ledger Asset Reconciliation Card */}
      {gl && (
        <div className="p-3.5 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Scale className={cn('w-5 h-5 mt-0.5', gl.isReconciled ? 'text-emerald-600' : 'text-amber-500')} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    General Ledger Inventory Asset Reconciliation
                  </h3>
                  <span className={cn(
                    'text-[11px] font-semibold',
                    gl.isReconciled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  )}>
                    ● {gl.isReconciled ? 'Reconciled' : 'Variance Detected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {gl.note}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">F&B Inventory (Acct 1200):</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  NPR {gl.account1200Balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-l border-slate-200 dark:border-slate-700/60 pl-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Hotel Supplies (Acct 1210):</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  NPR {gl.account1210Balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-l border-slate-200 dark:border-slate-700/60 pl-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total GL Asset Balance:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  NPR {gl.totalGlBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-l border-slate-200 dark:border-slate-700/60 pl-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Valuation Variance:</span>
                <span className={cn(
                  'font-bold',
                  gl.isReconciled ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  NPR {Math.abs(gl.variance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Bar */}
      <div className="p-3 rounded border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-850">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* As Of Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => {
                setAsOfDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
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
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Departments</option>
              <option value="HOTEL">Hotel</option>
              <option value="RESTAURANT">Restaurant</option>
            </select>
          </div>

          {/* Stock Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Stock Status
            </label>
            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Search Item
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Code or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2 text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {asOfDate ? `Calculating historical valuation as of ${asOfDate}` : 'Showing current live inventory valuation'}
          </span>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* 5. Breakdown Sections: Category-wise & Department-wise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category-wise Valuation */}
        <div className="rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-sky-600" />
              Category-wise Valuation Breakdown
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              {data?.categoryBreakdown?.length || 0} categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Category</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Items</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Stock Value (NPR)</th>
                  <th className="py-2 px-3 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                  data.categoryBreakdown.map((cat, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                        {cat.category}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">
                        {cat.totalItems}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-medium text-slate-900 dark:text-white">
                        {cat.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {cat.percentageOfTotal}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No category data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department-wise Valuation */}
        <div className="rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Department-wise Valuation Breakdown
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Hotel & Restaurant Operations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Department</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Items</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Stock Value (NPR)</th>
                  <th className="py-2 px-3 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data?.departmentBreakdown && data.departmentBreakdown.length > 0 ? (
                  data.departmentBreakdown.map((dept, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                        {dept.department}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">
                        {dept.totalItems}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-medium text-slate-900 dark:text-white">
                        {dept.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {dept.percentageOfTotal}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No department data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. Inventory Valuation Main Table */}
      <div className="rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm overflow-hidden">
        {/* Table Top Controls */}
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
            Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} entries
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">SN</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Item Code</th>
                <th
                  onClick={() => {
                    if (sortField === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('name');
                      setSortOrder('asc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Item Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Category</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Department</th>
                <th
                  onClick={() => {
                    if (sortField === 'quantity') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('quantity');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Current Quantity {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Unit</th>
                <th
                  onClick={() => {
                    if (sortField === 'cost') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('cost');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Valuation Cost (NPR) {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    if (sortField === 'value') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else {
                      setSortField('value');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Total Stock Value (NPR) {sortField === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Stock Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      Loading inventory valuation...
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No items found matching the selected valuation filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isInStock = item.stockStatus === 'IN_STOCK';
                  const isLow = item.stockStatus === 'LOW_STOCK';
                  const isOut = item.stockStatus === 'OUT_OF_STOCK';

                  return (
                    <tr
                      key={item.id || idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* SN */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-slate-500">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Item Code */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-mono font-medium text-slate-900 dark:text-white">
                        {item.itemCode}
                      </td>

                      {/* Item Name */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                        {item.itemName}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </td>

                      {/* Department */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {item.department}
                      </td>

                      {/* Current Quantity */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-bold text-slate-900 dark:text-white">
                        {item.currentQuantity}
                      </td>

                      {/* Unit */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {item.unit}
                      </td>

                      {/* Valuation Cost */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono text-slate-700 dark:text-slate-200">
                        {item.valuationCost.toFixed(2)}
                      </td>

                      {/* Total Stock Value */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Stock Status - Clean dot, no outline box */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                        <span
                          className={cn(
                            'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                            isInStock ? 'bg-emerald-500' :
                            isLow ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                        />
                        {isInStock ? 'In Stock' : isLow ? 'Low Stock' : 'Out of Stock'}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-center">
                        <Link
                          href={`/accounts?tab=product-ledger&itemId=${item.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                          title="View Product Ledger for this item"
                        >
                          <Boxes className="w-3 h-3" />
                          Ledger
                        </Link>
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
            Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} entries
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
                      ? 'bg-amber-600 border-amber-600 text-white font-semibold'
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

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MenuItemSalesRecord, MenuItemSalesSummaryResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

type SortField = 'menuItem' | 'category' | 'quantitySold' | 'totalSales' | 'averagePrice';
type SortOrder = 'asc' | 'desc';

export default function MenuItemSalesPage() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dates: default to Today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Table filters & controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('quantitySold');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [reportData, setReportData] = useState<MenuItemSalesSummaryResponse | null>(null);

  const loadSalesData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      let params: any = {};
      if (startDate === todayStr && endDate === todayStr) {
        params = { preset: 'today' };
      } else if (startDate === yesterdayStr && endDate === yesterdayStr) {
        params = { preset: 'yesterday' };
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await api.getMenuItemSales(params);
      const data = (res as any)?.data || res;
      if (data && typeof data === 'object') {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load menu item sales report:', err);
      if (isManual) {
        error('Could not load menu item sales report. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Automatically update when date changes
  useEffect(() => {
    loadSalesData();
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Currency Formatter
  const formatNpr = (amount: number | undefined | null): string => {
    const val = Number(amount) || 0;
    return val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    });
  };

  const formatNumber = (num: number | undefined | null): string => {
    return (Number(num) || 0).toLocaleString('en-IN');
  };

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    if (!reportData?.items) return [];

    let list = [...reportData.items];

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(
        (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.menuItem?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        const cmp = (aVal as string).localeCompare(bVal as string);
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return list;
  }, [reportData?.items, selectedCategory, searchQuery, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, currentPage, pageSize]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to highest first
    }
    setCurrentPage(1);
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
    setSearchQuery('');
    setSelectedCategory('All');
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!processedItems.length) return;

    const headers = ['#', 'Menu Item', 'Category', 'Type', 'Quantity Sold', 'Average Price (NPR)', 'Total Sales (NPR)'];
    const rows = processedItems.map((item, idx) => [
      idx + 1,
      `"${item.menuItem.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.isVeg ? 'Veg' : 'Non-Veg',
      item.quantitySold,
      item.averagePrice,
      item.totalSales,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `menu-item-sales-${startDate || 'report'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currencySymbol = reportData?.currencySymbol || 'रु';
  const categoriesList = reportData?.categories || ['All'];

  // Summary Metrics
  const totalQuantity = useMemo(
    () => processedItems.reduce((acc, it) => acc + (Number(it.quantitySold) || 0), 0),
    [processedItems]
  );
  const totalRevenue = useMemo(
    () => processedItems.reduce((acc, it) => acc + (Number(it.totalSales) || 0), 0),
    [processedItems]
  );

  const isToday = startDate === todayStr && endDate === todayStr;
  const isYesterday = startDate === yesterdayStr && endDate === yesterdayStr;

  return (
    <div className="w-full space-y-3 select-none font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Menu Item Sales
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSalesData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Refresh sales list"
          >
            <RefreshCw className={cn('w-3 h-3 text-slate-500', refreshing && 'animate-spin')} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!processedItems.length}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-[#0B3D32] hover:bg-[#082d25] rounded transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP (Clean & Subtle, NO Boxy Clutter) */}
      <div className="flex items-center gap-4 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-medium">Unique Items:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{processedItems.length}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-medium">Total Qty Sold:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatNumber(totalQuantity)}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-medium">Total Sales:</span>
          <span className="font-bold text-[#0B3D32] dark:text-emerald-400 font-mono">
            {currencySymbol} {formatNpr(totalRevenue)}
          </span>
        </div>
        {reportData?.bestSellingItem && (
          <>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400 font-medium">Top Seller:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {reportData.bestSellingItem.name} ({reportData.bestSellingItem.quantitySold} sold)
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. TOOLBAR CONTROLS (DataTables exact layout: Show entries | Today | Yestdy | Date range | Clear | Search) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        {/* Left Side: Show entries + Date Controls + Category */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Show entries */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Quick Date Checkboxes / Buttons */}
          <label className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isToday}
              onChange={() => {
                setStartDate(todayStr);
                setEndDate(todayStr);
              }}
              className="rounded border-slate-300 dark:border-slate-700 text-[#0B3D32] focus:ring-0 cursor-pointer"
            />
            <span>Today</span>
          </label>

          <label className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isYesterday}
              onChange={() => {
                setStartDate(yesterdayStr);
                setEndDate(yesterdayStr);
              }}
              className="rounded border-slate-300 dark:border-slate-700 text-[#0B3D32] focus:ring-0 cursor-pointer"
            />
            <span>Yestdy</span>
          </label>

          {/* Date range inputs */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Clear button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="h-7 px-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-2xs transition cursor-pointer"
          >
            Clear
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: Search */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Search:</span>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="h-7 px-2 pr-6 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none w-44"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE (DataTables grid: border-r on all columns, light gray header #F8F9FA, no boxy outlines inside cells) */}
      <div className="border border-slate-200 dark:border-slate-700/60 rounded overflow-hidden bg-white dark:bg-slate-850 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">
                  SN
                </th>

                {/* Menu Item Column */}
                <th
                  onClick={() => handleSort('menuItem')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Menu Item</span>
                    {sortField === 'menuItem' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Category Column */}
                <th
                  onClick={() => handleSort('category')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Category</span>
                    {sortField === 'category' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Type Column (Veg / Non-Veg) */}
                <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700">
                  Type
                </th>

                {/* Quantity Sold Column */}
                <th
                  onClick={() => handleSort('quantitySold')}
                  className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Quantity Sold</span>
                    {sortField === 'quantitySold' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Average Price Column */}
                <th
                  onClick={() => handleSort('averagePrice')}
                  className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Average Price ({currencySymbol})</span>
                    {sortField === 'averagePrice' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Total Sales Column */}
                <th
                  onClick={() => handleSort('totalSales')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Sales ({currencySymbol})</span>
                    {sortField === 'totalSales' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !reportData ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading sales data...</span>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'No menu items match your search or filter.'
                      : 'No menu items have been sold during the selected date range.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.menuItem + idx}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* SN */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200 dark:border-slate-700 align-middle">
                        {rowNumber}
                      </td>

                      {/* Menu Item Name */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.menuItem}
                        </span>
                      </td>

                      {/* Category - Plain Text, NO Outline Box */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Type - Clean Dot + Text, NO Outline Box */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            )}
                          />
                          <span className={item.isVeg ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </span>
                      </td>

                      {/* Quantity Sold */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono border-r border-slate-200 dark:border-slate-700 align-middle">
                        {formatNumber(item.quantitySold)}
                      </td>

                      {/* Average Price */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {formatNpr(item.averagePrice)}
                      </td>

                      {/* Total Sales */}
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-[#0B3D32] dark:text-emerald-400 align-middle">
                        {formatNpr(item.totalSales)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION CONTROLS (DataTables exact layout: Showing 1 to 10 of X entries | Previous 1 2 3 ... Next) */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/40">
          <div className="text-slate-500 dark:text-slate-400">
            {processedItems.length > 0 ? (
              <span>
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(processedItems.length, currentPage * pageSize)}</span> of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{processedItems.length}</span> entries
              </span>
            ) : (
              <span>Showing 0 to 0 of 0 entries</span>
            )}
          </div>

          {/* Right Bottom Side Pagination: Previous 1 2 3 ... Next */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-medium shadow-2xs"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'min-w-[28px] h-7 px-2 font-mono text-xs font-semibold rounded transition cursor-pointer flex items-center justify-center shadow-2xs',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-600'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400 select-none font-bold">
                    …
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-medium shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

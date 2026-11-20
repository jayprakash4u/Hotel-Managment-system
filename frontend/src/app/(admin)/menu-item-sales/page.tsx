'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MenuItemSalesRecord, MenuItemSalesSummaryResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom';
type SortField = 'menuItem' | 'category' | 'quantitySold' | 'totalSales' | 'averagePrice';
type SortOrder = 'asc' | 'desc';

export default function MenuItemSalesPage() {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Single Selected Date: default to Today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

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
      const isToday = selectedDate === todayStr;
      const params: any = isToday
        ? { preset: 'today' }
        : { startDate: selectedDate, endDate: selectedDate };

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
    if (selectedDate) {
      loadSalesData();
      setCurrentPage(1);
    }
  }, [selectedDate]);

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

  // Export to CSV
  const handleExportCsv = () => {
    if (!processedItems.length) return;

    const headers = ['#', 'Menu Item', 'Category', 'Quantity Sold', 'Total Sales (NPR)', 'Average Price (NPR)'];
    const rows = processedItems.map((item, idx) => [
      idx + 1,
      `"${item.menuItem.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.quantitySold,
      item.totalSales,
      item.averagePrice,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `menu-item-sales-${reportData?.startDate || 'report'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currencySymbol = reportData?.currencySymbol || 'रु';
  const categoriesList = reportData?.categories || ['All'];

  return (
    <div className="w-full space-y-4 select-none font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Menu Item Sales
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSalesData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Refresh sales list"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', refreshing && 'animate-spin')} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!processedItems.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B3D32] hover:bg-[#082d25] rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. TOOLBAR CONTROLS: DATE SELECTOR CALENDAR, SEARCH, CATEGORY, PAGE SIZE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Clean Single Date Selector Calendar: default Today */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                title="Select Date"
              />
            </div>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
                title="View Today's Sales"
              >
                Today
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search menu items..."
              className="w-full h-9 pl-8 pr-7 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32] cursor-pointer"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Rows Per Page & Item Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32] cursor-pointer"
            >
              {[10, 25, 50, 100].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>

                {/* Menu Item Column */}
                <th
                  onClick={() => handleSort('menuItem')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
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
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    {sortField === 'category' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0B3D32]" /> : <ArrowDown className="w-3 h-3 text-[#0B3D32]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Quantity Sold Column */}
                <th
                  onClick={() => handleSort('quantitySold')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition"
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

                {/* Total Sales Column */}
                <th
                  onClick={() => handleSort('totalSales')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition"
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

                {/* Average Price Column */}
                <th
                  onClick={() => handleSort('averagePrice')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition"
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
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !reportData ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading sales data...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
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
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Menu Item Name */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            )}
                            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.menuItem}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Quantity Sold */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatNumber(item.quantitySold)}
                      </td>

                      {/* Total Sales */}
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-[#0B3D32] dark:text-emerald-400">
                        {currencySymbol} {formatNpr(item.totalSales)}
                      </td>

                      {/* Average Price */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {currencySymbol} {formatNpr(item.averagePrice)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION CONTROLS */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/40">
          <div className="text-slate-500 dark:text-slate-400">
            {processedItems.length > 0 ? (
              <span>
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(processedItems.length, currentPage * pageSize)}</span> of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{processedItems.length}</span> items
              </span>
            ) : (
              <span>No items to display</span>
            )}
          </div>

          {/* Right Bottom Side Pagination: Prev 1 2 3 Next */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
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
                      'min-w-[30px] h-7 px-2 font-mono text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs text-xs font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

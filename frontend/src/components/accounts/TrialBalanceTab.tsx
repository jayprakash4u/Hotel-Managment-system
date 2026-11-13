'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Calculator,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  BookOpen,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TrialBalanceReport, TrialBalanceItem, TrialBalanceTotals } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function TrialBalanceTab() {
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<TrialBalanceReport | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activePreset, setActivePreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME'>('THIS_MONTH');
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL');
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Default to current month
  useEffect(() => {
    const today = new Date();
    const f = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const t = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setFromDate(f);
    setToDate(t);
  }, []);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await api.getTrialBalance({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        accountType: accountTypeFilter === 'ALL' ? undefined : accountTypeFilter,
        showZeroBalances,
        search: searchQuery || undefined,
      });
      setReport(res);
      setPage(1);
    } catch (err: any) {
      error(err?.message || 'Failed to load trial balance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) {
      loadTrialBalance();
    }
  }, [fromDate, toDate, accountTypeFilter, showZeroBalances]);

  // Filtered account items for client search
  const filteredAccounts = useMemo(() => {
    if (!report?.accounts) return [];
    if (!searchQuery.trim()) return report.accounts;
    const q = searchQuery.toLowerCase().trim();
    return report.accounts.filter(
      (a) =>
        a.accountCode.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        (a.subCategory && a.subCategory.toLowerCase().includes(q)) ||
        a.accountType.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, safeCurrentPage, pageSize]);

  // Date Preset Switcher
  const handleSetPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') => {
    setActivePreset(preset);
    const today = new Date();
    if (preset === 'THIS_MONTH') {
      const f = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const t = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setFromDate(f);
      setToDate(t);
    } else if (preset === 'LAST_MONTH') {
      const f = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const t = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      setFromDate(f);
      setToDate(t);
    } else if (preset === 'THIS_YEAR') {
      const f = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const t = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
      setFromDate(f);
      setToDate(t);
    } else if (preset === 'ALL_TIME') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setAccountTypeFilter('ALL');
    setShowZeroBalances(false);
    setSearchQuery('');
    handleSetPreset('THIS_MONTH');
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    if (!report || !report.accounts) return;

    const headers = [
      'Account Code',
      'Account Name',
      'Type',
      'SubCategory',
      'Opening Debit (Rs.)',
      'Opening Credit (Rs.)',
      'Period Debit (Rs.)',
      'Period Credit (Rs.)',
      'Closing Debit (Rs.)',
      'Closing Credit (Rs.)',
    ];

    const rows = filteredAccounts.map((a) => [
      `"${a.accountCode}"`,
      `"${a.accountName.replace(/"/g, '""')}"`,
      `"${a.accountType}"`,
      `"${a.subCategory || ''}"`,
      a.openingDebit.toFixed(2),
      a.openingCredit.toFixed(2),
      a.periodDebit.toFixed(2),
      a.periodCredit.toFixed(2),
      a.closingDebit.toFixed(2),
      a.closingCredit.toFixed(2),
    ]);

    const csvContent =
      `"Trial Balance Report"\n` +
      `"Period:","${fromDate || 'Beginning'} to ${toDate || 'Current'}"\n` +
      `"Status:","${report.isBalanced ? 'Balanced' : 'Out of Balance'}"\n` +
      `"Difference:",${report.difference.toFixed(2)}\n\n` +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n') +
      `\n\n"Grand Totals:",,"","",${report.totals.openingDebit.toFixed(2)},${report.totals.openingCredit.toFixed(2)},${report.totals.periodDebit.toFixed(2)},${report.totals.periodCredit.toFixed(2)},${report.totals.closingDebit.toFixed(2)},${report.totals.closingCredit.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Trial_Balance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Trial balance statement exported to CSV successfully.');
  };

  // Print Report
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const navigateToAccountLedger = (accountId: string) => {
    router.push(`/accounts?tab=general-ledger&accountId=${accountId}&fromDate=${fromDate}&toDate=${toDate}`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Trial Balance
          </h1>
        </div>

        {/* Export & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Export trial balance to Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Print printable statement"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 3. Filter & Control Toolbar */}
      <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Left: Account Type Filter & Zero Balance Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              title="Filter by Account Category"
            >
              <option value="ALL">All Account Types</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expenses</option>
            </select>

            {/* Zero balance toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showZeroBalances}
                onChange={(e) => setShowZeroBalances(e.target.checked)}
                className="rounded text-[#0B3D32] focus:ring-[#0B3D32] cursor-pointer"
              />
              <span className="font-medium">Show Zero Balance Accounts</span>
            </label>
          </div>

          {/* Right: Date Presets, Date Pickers, Search & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              {(['THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'ALL_TIME'] as const).map((p) => {
                const isSelected = activePreset === p;
                const label =
                  p === 'THIS_MONTH' ? 'This Month' : p === 'LAST_MONTH' ? 'Last Month' : p === 'THIS_YEAR' ? 'This Year' : 'All Time';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSetPreset(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer border',
                      isSelected
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Inline Date Pickers */}
            <div className="flex items-center gap-1.5 h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                title="End Date"
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search account code/name..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 text-xs font-medium text-slate-800 dark:text-white shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 h-[28px] rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              title="Reset all filters"
            >
              Reset
            </button>

            {/* Refresh / Generate Button */}
            <button
              type="button"
              onClick={loadTrialBalance}
              className="inline-flex items-center gap-1.5 px-3 h-[28px] rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
              title="Generate Trial Balance"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Trial Balance Table */}
      <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                <th className="py-3 px-3 w-28 border-r border-slate-200/70 dark:border-slate-800">ACCOUNT CODE</th>
                <th className="py-3 px-3 min-w-[220px] border-r border-slate-200/70 dark:border-slate-800">ACCOUNT NAME</th>
                <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">CATEGORY</th>
                <th className="py-3 px-3 text-right w-24 border-r border-slate-200/70 dark:border-slate-800">OPEN DR</th>
                <th className="py-3 px-3 text-right w-24 border-r border-slate-200/70 dark:border-slate-800">OPEN CR</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">PERIOD DR</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">PERIOD CR</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">CLOSING DR</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">CLOSING CR</th>
                <th className="py-3 px-3 text-center w-20">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Calculating Trial Balance Accounts...</span>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No accounts match selected filters</p>
                    <p className="text-[11px] mt-1 text-slate-400">Check &quot;Show Zero Balance Accounts&quot; or expand your date range.</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, idx) => (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                      {(safeCurrentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => navigateToAccountLedger(acc.accountId)}
                        className="text-[#0B3D32] dark:text-emerald-400 hover:underline cursor-pointer"
                        title="View Detailed General Ledger"
                      >
                        {acc.accountCode}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                      {acc.accountName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.openingDebit > 0 ? formatCurrency(acc.openingDebit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.openingCredit > 0 ? formatCurrency(acc.openingCredit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-900 dark:text-sky-300 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.periodDebit > 0 ? formatCurrency(acc.periodDebit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.periodCredit > 0 ? formatCurrency(acc.periodCredit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-950 dark:text-sky-200 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-950 dark:text-amber-200 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => navigateToAccountLedger(acc.accountId)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-bold bg-[#0B3D32] text-white hover:bg-[#093027] cursor-pointer shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        title="Open account ledger"
                      >
                        <span>Ledger</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {report && report.accounts.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/70 dark:bg-slate-900/80 font-mono font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                  <td colSpan={4} className="py-3 px-3 text-right uppercase text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                    Grand Totals:
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-slate-800">
                    {formatCurrency(report.totals.openingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-slate-800">
                    {formatCurrency(report.totals.openingCredit)}
                  </td>
                  <td className="py-3 px-3 text-right text-sky-900 dark:text-sky-300 border-r border-slate-200 dark:border-slate-800">
                    {formatCurrency(report.totals.periodDebit)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800">
                    {formatCurrency(report.totals.periodCredit)}
                  </td>
                  <td className="py-3 px-3 text-right text-sky-950 dark:text-sky-200 font-black border-r border-slate-200 dark:border-slate-800">
                    Rs. {formatCurrency(report.totals.closingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-950 dark:text-amber-200 font-black border-r border-slate-200 dark:border-slate-800">
                    Rs. {formatCurrency(report.totals.closingCredit)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {report.isBalanced ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Balanced
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        Diff: {report.difference.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. DataTables Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

          <div>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {filteredAccounts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * pageSize, filteredAccounts.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredAccounts.length}</strong> accounts
          </div>
        </div>

        {/* Permanent Pagination Buttons on Bottom Right */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
            const pageNum = idx + 1;
            if (pageNum === 1 || pageNum === totalPages || (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)) {
              const isCurrent = pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                    isCurrent
                      ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
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
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Printable Report Sign-off Section (Active when printed) */}
      <div className="hidden print:block pt-10 text-xs">
        <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-slate-300">
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold">Prepared By</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Accountant / Cashier</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold">Verified By</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Senior Accountant</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold">Approved By</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Financial Controller / Auditor</div>
          </div>
        </div>
      </div>
    </div>
  );
}


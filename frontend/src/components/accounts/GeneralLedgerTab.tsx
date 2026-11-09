'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Book,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Building2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  RotateCcw,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  GeneralLedgerReport,
  GeneralLedgerTransaction,
  AccountItem,
  JournalEntryItem,
  AllAccountsLedgerReport,
  AllAccountsLedgerItem,
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export default function GeneralLedgerTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId');
  const { success, error } = useToast();

  // Mode: Single Account Ledger vs All Accounts Consolidated View
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL_ACCOUNTS'>('SINGLE');

  // Single Account State
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountIdParam || '');
  const [report, setReport] = useState<GeneralLedgerReport | null>(null);

  // All Accounts State
  const [loadingAll, setLoadingAll] = useState(false);
  const [allAccountsReport, setAllAccountsReport] = useState<AllAccountsLedgerReport | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activePreset, setActivePreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME'>('THIS_MONTH');
  const [accountTypeFilter, setAccountTypeFilter] = useState('ALL');
  const [sourceModuleFilter, setSourceModuleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination for Single Account Transactions
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Pagination for All Accounts View
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(25);

  // Modal to preview source voucher
  const [previewVoucherId, setPreviewVoucherId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<JournalEntryItem | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [selectedTx, setSelectedTx] = useState<GeneralLedgerTransaction | null>(null);

  // Format currency helper
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper for Dr/Cr designation
  const getBalanceDesignation = (balance: number, normalBalance?: string) => {
    const norm = (normalBalance || 'DEBIT').toUpperCase();
    if (balance === 0) return '0.00';
    if (balance > 0) {
      return norm === 'DEBIT' ? 'Dr' : 'Cr';
    } else {
      return norm === 'DEBIT' ? 'Cr' : 'Dr';
    }
  };

  // Initial load of posting accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.getChartOfAccounts({ activeOnly: true });
        const postingAccounts = (res.accounts || []).filter((a) => !a.isGroup);
        setAccounts(postingAccounts);

        if (!selectedAccountId && postingAccounts.length > 0) {
          const defaultAcc = postingAccounts.find((a) => a.accountCode === '1101') || postingAccounts[0];
          setSelectedAccountId(defaultAcc.id);
        }
      } catch (err: any) {
        error('Failed to load chart of accounts');
      }
    };
    fetchAccounts();

    // Default to This Month
    const today = new Date();
    const f = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const t = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setFromDate(f);
    setToDate(t);
  }, []);

  // Sync selected account from URL query param
  useEffect(() => {
    if (accountIdParam) {
      setSelectedAccountId(accountIdParam);
      setViewMode('SINGLE');
    }
  }, [accountIdParam]);

  // Load single account ledger
  const loadLedger = async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const data = await api.getGeneralLedger({
        accountId: selectedAccountId,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sourceModule: sourceModuleFilter === 'ALL' ? undefined : sourceModuleFilter,
        search: searchQuery || undefined,
      });
      setReport(data);
      setCurrentPage(1);
    } catch (err: any) {
      error(err?.message || 'Failed to load ledger transactions');
    } finally {
      setLoading(false);
    }
  };

  // Load All Accounts report
  const loadAllAccounts = async () => {
    try {
      setLoadingAll(true);
      const data = await api.getAllAccountsLedger({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        accountType: accountTypeFilter === 'ALL' ? undefined : accountTypeFilter,
      });
      setAllAccountsReport(data);
      setAllPage(1);
    } catch (err: any) {
      error(err?.message || 'Failed to load consolidated accounts report');
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'SINGLE' && selectedAccountId) {
      loadLedger();
    } else if (viewMode === 'ALL_ACCOUNTS') {
      loadAllAccounts();
    }
  }, [viewMode, selectedAccountId, fromDate, toDate, sourceModuleFilter, accountTypeFilter]);

  // Filter accounts dropdown by Account Type
  const filteredAccountsList = useMemo(() => {
    if (accountTypeFilter === 'ALL') return accounts;
    return accounts.filter((a) => a.accountType === accountTypeFilter);
  }, [accounts, accountTypeFilter]);

  // Filter single account transactions by local search
  const filteredTransactions = useMemo(() => {
    if (!report?.transactions) return [];
    if (!searchQuery.trim()) return report.transactions;

    const q = searchQuery.toLowerCase().trim();
    return report.transactions.filter((tx) => {
      return (
        tx.entryNumber.toLowerCase().includes(q) ||
        (tx.reference && tx.reference.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.lineDescription && tx.lineDescription.toLowerCase().includes(q)) ||
        (tx.sourceModule && tx.sourceModule.toLowerCase().includes(q))
      );
    });
  }, [report, searchQuery]);

  // Pagination for single account
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, safeCurrentPage, pageSize]);

  // Filter All Accounts by search
  const filteredAllAccountsList = useMemo(() => {
    if (!allAccountsReport?.accounts) return [];
    if (!searchQuery.trim()) return allAccountsReport.accounts;
    const q = searchQuery.toLowerCase().trim();
    return allAccountsReport.accounts.filter(
      (a) =>
        a.accountCode.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        (a.subCategory && a.subCategory.toLowerCase().includes(q)) ||
        a.accountType.toLowerCase().includes(q)
    );
  }, [allAccountsReport, searchQuery]);

  // Pagination for All Accounts
  const totalAllPages = Math.max(1, Math.ceil(filteredAllAccountsList.length / allPageSize));
  const safeAllPage = Math.min(allPage, totalAllPages);
  const paginatedAllAccounts = useMemo(() => {
    const start = (safeAllPage - 1) * allPageSize;
    return filteredAllAccountsList.slice(start, start + allPageSize);
  }, [filteredAllAccountsList, safeAllPage, allPageSize]);

  // Preset Date Switcher
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
    setSourceModuleFilter('ALL');
    setSearchQuery('');
    handleSetPreset('THIS_MONTH');
  };

  // Open voucher preview
  const handleOpenVoucherPreview = async (tx: GeneralLedgerTransaction) => {
    try {
      setSelectedTx(tx);
      setLoadingVoucher(true);
      setPreviewVoucherId(tx.journalEntryId);
      const res = await api.getJournalEntryById(tx.journalEntryId);
      if (res) {
        setPreviewEntry(res);
      } else {
        error('Voucher details could not be found');
        setPreviewVoucherId(null);
      }
    } catch (err: any) {
      error('Could not load journal voucher details');
      setPreviewVoucherId(null);
    } finally {
      setLoadingVoucher(false);
    }
  };

  // Print ledger
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    if (viewMode === 'SINGLE') {
      if (!report || !report.account) return;
      const headers = ['Date', 'Voucher Number', 'Reference', 'Description', 'Memo', 'Source Module', 'Debit (Rs.)', 'Credit (Rs.)', 'Running Balance (Rs.)'];
      const rows = filteredTransactions.map((tx) => [
        new Date(tx.entryDate).toLocaleDateString(),
        `"${tx.entryNumber}"`,
        `"${tx.reference || ''}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${(tx.lineDescription || '').replace(/"/g, '""')}"`,
        `"${tx.sourceModule || ''}"`,
        tx.debit.toFixed(2),
        tx.credit.toFixed(2),
        tx.runningBalance.toFixed(2),
      ]);

      const csvContent =
        `"General Ledger Statement"\n` +
        `"Account:","[${report.account.accountCode}] ${report.account.accountName} (${report.account.accountType})"\n` +
        `"Statement Period:","${fromDate || 'Beginning'} to ${toDate || 'Current'}"\n` +
        `"Opening Balance:",${report.openingBalance.toFixed(2)}\n\n` +
        headers.join(',') +
        '\n' +
        rows.map((r) => r.join(',')).join('\n') +
        `\n\n"Period Total Debit:",${report.totalDebit.toFixed(2)}\n` +
        `"Period Total Credit:",${report.totalCredit.toFixed(2)}\n` +
        `"Closing Balance:",${report.closingBalance.toFixed(2)}\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `General_Ledger_${report.account.accountCode}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Ledger statement exported to CSV successfully.');
    } else {
      if (!allAccountsReport) return;
      const headers = ['Account Code', 'Account Name', 'Type', 'SubCategory', 'Opening Debit', 'Opening Credit', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit'];
      const rows = filteredAllAccountsList.map((a) => [
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
        `"All Accounts Consolidated General Ledger"\n` +
        `"Period:","${fromDate || 'Beginning'} to ${toDate || 'Current'}"\n\n` +
        headers.join(',') +
        '\n' +
        rows.map((r) => r.join(',')).join('\n') +
        `\n\n"Totals:",,"","",${allAccountsReport.totals.openingDebit.toFixed(2)},${allAccountsReport.totals.openingCredit.toFixed(2)},${allAccountsReport.totals.periodDebit.toFixed(2)},${allAccountsReport.totals.periodCredit.toFixed(2)},${allAccountsReport.totals.closingDebit.toFixed(2)},${allAccountsReport.totals.closingCredit.toFixed(2)}\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Consolidated_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Consolidated ledger exported to CSV successfully.');
    }
  };

  const handleSelectAccountFromConsolidated = (accountId: string) => {
    setSelectedAccountId(accountId);
    setViewMode('SINGLE');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Breadcrumb, Mode Switcher & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/accounts"
              className="p-1 rounded-[3px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Back to Accounts Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              General Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
              Account-Wise Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View detailed chronological transactions, running balances, and opening/closing reconciliations.
          </p>
        </div>

        {/* Top Actions: Mode Switcher & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-0.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('SINGLE')}
              className={cn(
                'px-3 py-1 rounded-[2px] text-xs font-bold transition-all cursor-pointer',
                viewMode === 'SINGLE'
                  ? 'bg-white dark:bg-slate-900 text-[#0B3D32] dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Single Account
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ALL_ACCOUNTS')}
              className={cn(
                'px-3 py-1 rounded-[2px] text-xs font-bold transition-all cursor-pointer',
                viewMode === 'ALL_ACCOUNTS'
                  ? 'bg-white dark:bg-slate-900 text-[#0B3D32] dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              All Accounts View
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Export current view to Excel / CSV"
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
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar (Hotel & Restaurant Standard Style) */}
      <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Account Selector (for Single Account view) */}
          {viewMode === 'SINGLE' ? (
            <div className="flex-1 max-w-lg">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Active Posting Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-[30px] px-2.5 rounded-[3px] text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs cursor-pointer"
              >
                {filteredAccountsList.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    [{acc.accountCode}] {acc.accountName} — {acc.accountType} ({acc.normalBalance})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Consolidated General Ledger
              </span>
              <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {allAccountsReport?.totalAccounts || 0} Accounts
              </span>
            </div>
          )}

          {/* Controls: Account Type, Module, Date Range & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Type Filter */}
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              title="Filter by Account Type"
            >
              <option value="ALL">All Account Types</option>
              <option value="ASSET">Assets (1000)</option>
              <option value="LIABILITY">Liabilities (2000)</option>
              <option value="EQUITY">Equity (3000)</option>
              <option value="INCOME">Income / Revenue (4000)</option>
              <option value="EXPENSE">Expenses (5000)</option>
            </select>

            {/* Source Module Filter (Single view) */}
            {viewMode === 'SINGLE' && (
              <select
                value={sourceModuleFilter}
                onChange={(e) => setSourceModuleFilter(e.target.value)}
                className="h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                title="Filter by Source Module"
              >
                <option value="ALL">All Source Modules</option>
                <option value="MANUAL">Manual Journal</option>
                <option value="POS_SALE">POS / Restaurant</option>
                <option value="ROOM_BILL">Room Stay Billing</option>
                <option value="PURCHASE">Inventory Purchase</option>
                <option value="EXPENSE">Expense Voucher</option>
                <option value="PAYROLL">Payroll / Salary</option>
                <option value="REVERSAL">Reversal Voucher</option>
              </select>
            )}

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

            {/* Date Pickers */}
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
                placeholder="Search ledger..."
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={viewMode === 'SINGLE' ? loadLedger : loadAllAccounts}
              className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Refresh statement"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', (loading || loadingAll) && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: SINGLE ACCOUNT LEDGER STATEMENT
          ========================================================================= */}
      {viewMode === 'SINGLE' && (
        <>
          {/* Account Statement Header & Summary Cards */}
          {report?.account && (
            <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      [{report.account.accountCode}]
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {report.account.accountName}
                    </span>
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {report.account.accountType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Subcategory: <strong>{report.account.subCategory}</strong> · Normal Balance: <strong>{report.account.normalBalance}</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-500 md:text-right">
                  <div>Statement Period:</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {fromDate ? new Date(fromDate).toLocaleDateString() : 'Beginning'} —{' '}
                    {toDate ? new Date(toDate).toLocaleDateString() : 'Current Date'}
                  </div>
                </div>
              </div>

              {/* 5 Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {/* 1. Opening Balance */}
                <div className="p-2.5 rounded-[3px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening Balance</span>
                  <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-slate-200 mt-0.5 flex items-center justify-between">
                    <span>Rs. {formatCurrency(Math.abs(report.openingBalance))}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getBalanceDesignation(report.openingBalance, report.account.normalBalance)}
                    </span>
                  </div>
                </div>

                {/* 2. Total Period Debit */}
                <div className="p-2.5 rounded-[3px] bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Total Debit</span>
                  <div className="text-sm font-extrabold font-mono text-sky-800 dark:text-sky-300 mt-0.5">
                    Rs. {formatCurrency(report.totalDebit)}
                  </div>
                </div>

                {/* 3. Total Period Credit */}
                <div className="p-2.5 rounded-[3px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Total Credit</span>
                  <div className="text-sm font-extrabold font-mono text-amber-800 dark:text-amber-300 mt-0.5">
                    Rs. {formatCurrency(report.totalCredit)}
                  </div>
                </div>

                {/* 4. Net Period Change */}
                <div className="p-2.5 rounded-[3px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Period Change</span>
                  <div
                    className={cn(
                      'text-sm font-extrabold font-mono mt-0.5',
                      report.netChange >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    )}
                  >
                    {report.netChange >= 0 ? '+' : ''}Rs. {formatCurrency(report.netChange)}
                  </div>
                </div>

                {/* 5. Closing Balance */}
                <div className="p-2.5 rounded-[3px] bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Closing Balance</span>
                  <div className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-300 mt-0.5 flex items-center justify-between">
                    <span>Rs. {formatCurrency(Math.abs(report.closingBalance))}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200">
                      {getBalanceDesignation(report.closingBalance, report.account.normalBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Transactions Table */}
          <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                    <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">DATE</th>
                    <th className="py-3 px-3 w-28 border-r border-slate-200/70 dark:border-slate-800">JOURNAL NO.</th>
                    <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">REFERENCE</th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200/70 dark:border-slate-800">DESCRIPTION</th>
                    <th className="py-3 px-3 min-w-[140px] border-r border-slate-200/70 dark:border-slate-800">LINE MEMO</th>
                    <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">SOURCE</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">DEBIT (RS.)</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">CREDIT (RS.)</th>
                    <th className="py-3 px-3 text-right w-32 border-r border-slate-200/70 dark:border-slate-800">RUNNING BAL</th>
                    <th className="py-3 px-3 text-center w-14">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* Row for Opening Balance B/Fwd */}
                  {report && (
                    <tr className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-semibold italic text-[11px]">
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800/60 font-mono text-[10px] text-slate-400">
                        —
                      </td>
                      <td className="py-2.5 px-3 font-mono border-r border-slate-100 dark:border-slate-800/60">
                        {fromDate ? new Date(fromDate).toLocaleDateString() : 'Beginning'}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800/60" colSpan={5}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">[ Opening Balance B/Fwd ]</span>
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800/60">—</td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800/60">—</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                        Rs. {formatCurrency(Math.abs(report.openingBalance))}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          {getBalanceDesignation(report.openingBalance, report.account?.normalBalance)}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  )}

                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0B3D32] dark:text-emerald-400" />
                        <span>Loading General Ledger...</span>
                      </td>
                    </tr>
                  ) : !report || filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Book className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions recorded in this period</p>
                        <p className="text-[11px] mt-1 text-slate-400">Try selecting a different date range or source module.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx, idx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                          {(safeCurrentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                          {new Date(tx.entryDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => handleOpenVoucherPreview(tx)}
                            className="text-[#0B3D32] dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {tx.entryNumber}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                          {tx.reference || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800/60">
                          <div className="line-clamp-1">{tx.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                          {tx.lineDescription || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                          <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {tx.sourceModule || 'MANUAL'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-900 dark:text-sky-300 border-r border-slate-100 dark:border-slate-800/60">
                          {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300 border-r border-slate-100 dark:border-slate-800/60">
                          {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                          Rs. {formatCurrency(Math.abs(tx.runningBalance))}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            {getBalanceDesignation(tx.runningBalance, report?.account?.normalBalance)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenVoucherPreview(tx)}
                            className="p-1 rounded-[3px] text-slate-500 hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                            title="View Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {report && report.transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/70 dark:bg-slate-900/80 font-mono font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                      <td colSpan={7} className="py-3 px-3 text-right uppercase text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        Period Totals &amp; Closing Balance:
                      </td>
                      <td className="py-3 px-3 text-right text-sky-900 dark:text-sky-300 border-r border-slate-200 dark:border-slate-800">
                        Rs. {formatCurrency(report.totalDebit)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800">
                        Rs. {formatCurrency(report.totalCredit)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-400 font-black border-r border-slate-200 dark:border-slate-800">
                        Rs. {formatCurrency(Math.abs(report.closingBalance))}{' '}
                        <span className="text-[10px] font-normal">
                          {getBalanceDesignation(report.closingBalance, report.account?.normalBalance)}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* DataTables Pagination Footer for Single Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 font-medium text-[11px]">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
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
                  {filteredTransactions.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(safeCurrentPage * pageSize, filteredTransactions.length)}
                </strong>{' '}
                of <strong className="text-slate-800 dark:text-slate-200">{filteredTransactions.length}</strong> transactions
              </div>
            </div>

            {/* Pagination Buttons (Always Visible) */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW MODE 2: ALL ACCOUNTS CONSOLIDATED VIEW (Section 11)
          ========================================================================= */}
      {viewMode === 'ALL_ACCOUNTS' && (
        <>
          {/* Consolidated Trial Balance / Summary Cards */}
          {allAccountsReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Active Accounts Count */}
              <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Accounts</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {allAccountsReport.totalAccounts}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Posting sub-ledgers evaluated</div>
              </div>

              {/* Card 2: Total Opening Balance */}
              <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Opening Debits</span>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  Rs. {formatCurrency(allAccountsReport.totals.openingDebit)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Opening Credits: Rs. {formatCurrency(allAccountsReport.totals.openingCredit)}
                </div>
              </div>

              {/* Card 3: Total Period Turnover */}
              <div className="p-3.5 rounded-[3px] border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Period Turnover</span>
                <div className="text-xl font-black font-mono text-blue-950 dark:text-blue-200 mt-1">
                  Rs. {formatCurrency(allAccountsReport.totals.periodDebit)}
                </div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-0.5">
                  Balanced Double-Entry Activity
                </div>
              </div>

              {/* Card 4: Total Closing Debits */}
              <div className="p-3.5 rounded-[3px] border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total Closing Debits</span>
                <div className="text-xl font-black font-mono text-emerald-950 dark:text-emerald-200 mt-1">
                  Rs. {formatCurrency(allAccountsReport.totals.closingDebit)}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  Closing Credits: Rs. {formatCurrency(allAccountsReport.totals.closingCredit)}
                </div>
              </div>
            </div>
          )}

          {/* Consolidated All Accounts Table */}
          <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                    <th className="py-3 px-3 w-28 border-r border-slate-200/70 dark:border-slate-800">ACCOUNT CODE</th>
                    <th className="py-3 px-3 min-w-[200px] border-r border-slate-200/70 dark:border-slate-800">ACCOUNT NAME</th>
                    <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">TYPE</th>
                    <th className="py-3 px-3 text-right w-24 border-r border-slate-200/70 dark:border-slate-800">OPEN DR</th>
                    <th className="py-3 px-3 text-right w-24 border-r border-slate-200/70 dark:border-slate-800">OPEN CR</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">PERIOD DR</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">PERIOD CR</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">CLOSE DR</th>
                    <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">CLOSE CR</th>
                    <th className="py-3 px-3 text-center w-20">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loadingAll ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0B3D32] dark:text-emerald-400" />
                        <span>Loading Consolidated Accounts Ledger...</span>
                      </td>
                    </tr>
                  ) : filteredAllAccountsList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Book className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No accounts match selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAllAccounts.map((acc, idx) => (
                      <tr
                        key={acc.accountId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                          {(safeAllPage - 1) * allPageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => handleSelectAccountFromConsolidated(acc.accountId)}
                            className="text-[#0B3D32] dark:text-emerald-400 hover:underline cursor-pointer"
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
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 dark:text-emerald-300 border-r border-slate-100 dark:border-slate-800/60">
                          {acc.closingDebit > 0 ? formatCurrency(acc.closingDebit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900 dark:text-purple-300 border-r border-slate-100 dark:border-slate-800/60">
                          {acc.closingCredit > 0 ? formatCurrency(acc.closingCredit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelectAccountFromConsolidated(acc.accountId)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-bold bg-[#0B3D32] text-white hover:bg-[#093027] cursor-pointer shadow-2xs"
                          >
                            <span>Ledger</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {allAccountsReport && allAccountsReport.accounts.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/70 dark:bg-slate-900/80 font-mono font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                      <td colSpan={4} className="py-3 px-3 text-right uppercase text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        Consolidated Totals:
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.openingDebit)}
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.openingCredit)}
                      </td>
                      <td className="py-3 px-3 text-right text-sky-900 dark:text-sky-300 border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.periodDebit)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.periodCredit)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.closingDebit)}
                      </td>
                      <td className="py-3 px-3 text-right text-purple-900 dark:text-purple-300 border-r border-slate-200 dark:border-slate-800">
                        {formatCurrency(allAccountsReport.totals.closingCredit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* DataTables Pagination Footer for All Accounts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 font-medium text-[11px]">Show</span>
                <select
                  value={allPageSize}
                  onChange={(e) => {
                    setAllPageSize(Number(e.target.value));
                    setAllPage(1);
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
                  {filteredAllAccountsList.length === 0 ? 0 : (safeAllPage - 1) * allPageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(safeAllPage * allPageSize, filteredAllAccountsList.length)}
                </strong>{' '}
                of <strong className="text-slate-800 dark:text-slate-200">{filteredAllAccountsList.length}</strong> accounts
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <button
                type="button"
                disabled={safeAllPage <= 1}
                onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: Math.max(1, totalAllPages) }).map((_, idx) => {
                const pageNum = idx + 1;
                if (pageNum === 1 || pageNum === totalAllPages || (pageNum >= safeAllPage - 1 && pageNum <= safeAllPage + 1)) {
                  const isCurrent = pageNum === safeAllPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setAllPage(pageNum)}
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
                if (pageNum === safeAllPage - 2 || pageNum === safeAllPage + 2) {
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
                disabled={safeAllPage >= totalAllPages}
                onClick={() => setAllPage((p) => Math.min(totalAllPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL: VIEW JOURNAL VOUCHER & TRANSACTION DETAILS (Section 6)
          ========================================================================= */}
      {previewVoucherId && previewEntry && (
        <Modal
          isOpen={!!previewVoucherId}
          onClose={() => setPreviewVoucherId(null)}
          title={`Journal Voucher: ${previewEntry.entryNumber}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-1">
            {/* Header Voucher Card */}
            <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Voucher Number</span>
                  <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                    {previewEntry.entryNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {new Date(previewEntry.entryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10.5px]">Type:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {previewEntry.entryType || 'GENERAL'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Status:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {previewEntry.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Reference:</span>{' '}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {previewEntry.reference || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Source:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {previewEntry.sourceModule}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10.5px]">Description / Narration:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {previewEntry.description}
                </p>
              </div>

              {previewEntry.reversedFromId && (
                <div className="p-2 rounded-[3px] bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Contra Reversal Voucher of entry: {previewEntry.reversedFromId}
                </div>
              )}
            </div>

            {/* Lines Table */}
            <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Account</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Memo</th>
                    <th className="py-2.5 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">Debit (Rs.)</th>
                    <th className="py-2.5 px-3 text-right w-28">Credit (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {previewEntry.lines?.map((line, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800/60">
                        <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                          {line.accountCode}
                        </span>{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          — {line.accountName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                        {line.lineDescription || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-900 dark:text-sky-300 border-r border-slate-100 dark:border-slate-800/60">
                        {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300">
                        {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 font-mono font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      Total:
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-900 dark:text-sky-300 font-extrabold border-r border-slate-200 dark:border-slate-800">
                      Rs. {formatCurrency(previewEntry.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-900 dark:text-amber-300 font-extrabold">
                      Rs. {formatCurrency(previewEntry.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                {/* View Original Transaction Button (Section 6) */}
                {selectedTx && selectedTx.sourceModule === 'POS_SALE' && (
                  <Link
                    href="/pos"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-blue-300 text-blue-700 hover:bg-blue-50 font-bold transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View POS Order</span>
                  </Link>
                )}
                {selectedTx && selectedTx.sourceModule === 'ROOM_BILL' && (
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Room Booking</span>
                  </Link>
                )}
                {selectedTx && selectedTx.sourceModule === 'EXPENSE' && (
                  <Link
                    href="/expenses"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Expense Record</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVoucherId(null)}
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold transition-colors cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

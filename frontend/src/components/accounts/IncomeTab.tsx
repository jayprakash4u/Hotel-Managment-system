'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  SlidersHorizontal,
  X,
  CreditCard,
  Edit2,
  Trash2,
  RotateCcw,
  BarChart3,
  Layers,
  ArrowRight,
  Check,
  Tag
} from 'lucide-react';
import { incomeApi, api } from '@/lib/api';
import {
  IncomeCategoryItem,
  IncomeTransactionItem,
  IncomeSummary,
  IncomeReceivingAccount,
  IncomeReportsData,
  CreateIncomeDto,
  CreateIncomeCategoryDto,
  AccountItem
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/lib/useDebounce';

export default function IncomeTab() {
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<IncomeTransactionItem[]>([]);
  const [summary, setSummary] = useState<IncomeSummary>({
    totalIncome: 0,
    thisMonthIncome: 0,
    todayIncome: 0,
    totalDraftIncome: 0,
    draftCount: 0,
    totalPostedCount: 0,
    operatingIncome: 0,
    nonOperatingIncome: 0,
  });

  const [categories, setCategories] = useState<IncomeCategoryItem[]>([]);
  const [receivingAccounts, setReceivingAccounts] = useState<IncomeReceivingAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<AccountItem[]>([]);

  // Pagination & Filtering
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected Transaction for View / Edit / Reverse / Print
  const [selectedTx, setSelectedTx] = useState<IncomeTransactionItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Add / Edit Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formReceivedThrough, setFormReceivedThrough] = useState('CASH');
  const [formReceivingAccountId, setFormReceivingAccountId] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formPayerName, setFormPayerName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAutoPost, setFormAutoPost] = useState(true);

  // Category Configuration Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'OPERATING' | 'NON_OPERATING'>('OPERATING');
  const [newCatAccountId, setNewCatAccountId] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Reports Data
  const [reportsData, setReportsData] = useState<IncomeReportsData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await incomeApi.getIncomeSummary(dateFrom || undefined, dateTo || undefined);
      if (res) setSummary(res);
    } catch (err: any) {
      console.error('Failed to load income summary:', err);
    }
  }, [dateFrom, dateTo]);

  // 2. Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await incomeApi.getIncomeTransactions({
        search: debouncedSearch.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        categoryId: categoryFilter,
        categoryType: categoryTypeFilter,
        receivingAccountId: accountFilter,
        status: statusFilter,
        page,
        pageSize,
      });

      if (res) {
        setTransactions(res.items || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load income transactions.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFrom, dateTo, categoryFilter, categoryTypeFilter, accountFilter, statusFilter, page, pageSize, toastError]);

  // 3. Fetch Master Data (Categories, Receiving Accounts, GL Accounts)
  const fetchMasterData = useCallback(async () => {
    try {
      const [cats, recvAccs, accountsRes] = await Promise.all([
        incomeApi.getIncomeCategories(),
        incomeApi.getIncomeReceivingAccounts(),
        api.getChartOfAccounts().catch(() => ({ accounts: [] })),
      ]);

      if (cats) setCategories(cats);
      if (recvAccs) {
        setReceivingAccounts(recvAccs);
        if (recvAccs.length > 0 && !formReceivingAccountId) {
          setFormReceivingAccountId(recvAccs[0].id);
        }
      }
      if (accountsRes && accountsRes.accounts) {
        setGlAccounts(accountsRes.accounts);
      }
    } catch (err: any) {
      console.error('Failed to load master metadata:', err);
    }
  }, [formReceivingAccountId]);

  // Initial Load
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, [fetchSummary, fetchTransactions]);

  // Date Preset Handlers
  const handleDatePreset = (preset: 'ALL' | 'TODAY' | 'MONTH' | 'YEAR') => {
    setDateRangePreset(preset);
    setPage(1);
    const now = new Date();
    if (preset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'TODAY') {
      const d = now.toISOString().slice(0, 10);
      setDateFrom(d);
      setDateTo(d);
    } else if (preset === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === 'YEAR') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setDateFrom(start);
      setDateTo(end);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategoryId(categories[0]?.id || '');
    setFormDescription('');
    setFormAmount('');
    setFormReceivedThrough('CASH');
    setFormReceivingAccountId(receivingAccounts[0]?.id || '');
    setFormReferenceNumber('');
    setFormPayerName('');
    setFormNotes('');
    setFormAutoPost(true);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal (Draft Only)
  const openEditModal = (tx: IncomeTransactionItem) => {
    setSelectedTx(tx);
    setFormDate(tx.incomeDate ? tx.incomeDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormCategoryId(tx.categoryId);
    setFormDescription(tx.description);
    setFormAmount(tx.amount);
    setFormReceivedThrough(tx.receivedThrough);
    setFormReceivingAccountId(tx.receivingAccountId);
    setFormReferenceNumber(tx.referenceNumber || '');
    setFormPayerName(tx.payerName || '');
    setFormNotes(tx.notes || '');
    setFormAutoPost(false);
    setIsEditModalOpen(true);
  };

  // Handle Save / Submit Income
  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryId) {
      toastError('Please select a valid income category.');
      return;
    }
    if (!formDescription.trim()) {
      toastError('Income description is required.');
      return;
    }
    const numAmount = Number(formAmount);
    if (!numAmount || numAmount <= 0) {
      toastError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formReceivingAccountId) {
      toastError('Please select a receiving account.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: CreateIncomeDto = {
        incomeDate: new Date(formDate).toISOString(),
        categoryId: formCategoryId,
        description: formDescription.trim(),
        amount: numAmount,
        receivedThrough: formReceivedThrough,
        receivingAccountId: formReceivingAccountId,
        referenceNumber: formReferenceNumber.trim() || undefined,
        payerName: formPayerName.trim() || undefined,
        notes: formNotes.trim() || undefined,
        autoPost: formAutoPost,
      };

      if (isEditModalOpen && selectedTx) {
        await incomeApi.updateIncomeTransaction(selectedTx.id, payload);
        success(`Income draft ${selectedTx.voucherNumber} updated successfully.`);
        setIsEditModalOpen(false);
      } else {
        const created = await incomeApi.createIncomeTransaction(payload);
        success(
          formAutoPost
            ? `Income voucher ${created?.voucherNumber || ''} created & posted successfully!`
            : `Income draft ${created?.voucherNumber || ''} saved successfully.`
        );
        setIsAddModalOpen(false);
      }

      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save income transaction.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Post Draft
  const handlePostDraft = async (tx: IncomeTransactionItem) => {
    try {
      setIsSubmittingAction(true);
      await incomeApi.postIncomeTransaction(tx.id);
      success(`Income voucher ${tx.voucherNumber} posted to General Ledger successfully!`);
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post income draft.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async (tx: IncomeTransactionItem) => {
    if (!confirm(`Are you sure you want to delete draft ${tx.voucherNumber}? This cannot be undone.`)) return;
    try {
      setIsSubmittingAction(true);
      await incomeApi.deleteIncomeTransaction(tx.id);
      success(`Draft ${tx.voucherNumber} deleted.`);
      fetchSummary();
      fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete draft.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Reverse Posted Transaction
  const handleConfirmReverse = async () => {
    if (!selectedTx) return;
    if (!reversalReason.trim()) {
      toastError('Reversal reason is required for audit trail.');
      return;
    }
    try {
      setIsSubmittingAction(true);
      await incomeApi.reverseIncomeTransaction(selectedTx.id, {
        reason: reversalReason.trim(),
        reversedBy: 'Accountant',
      });
      success(`Income voucher ${selectedTx.voucherNumber} reversed successfully.`);
      setIsReverseModalOpen(false);
      setReversalReason('');
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to reverse income voucher.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Category Configuration Handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toastError('Category name is required.');
      return;
    }
    if (!newCatAccountId) {
      toastError('Please link a Chart of Accounts code.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const catDto: CreateIncomeCategoryDto = {
        categoryName: newCatName.trim(),
        categoryType: newCatType,
        accountId: newCatAccountId,
        description: newCatDesc.trim() || undefined,
      };

      if (editingCatId) {
        await incomeApi.updateIncomeCategory(editingCatId, catDto);
        success('Income category updated.');
      } else {
        await incomeApi.createIncomeCategory(catDto);
        success('New income category created.');
      }

      setNewCatName('');
      setNewCatDesc('');
      setEditingCatId(null);
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save category.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDeleteCategory = async (cat: IncomeCategoryItem) => {
    if (cat.isSystem) {
      toastError('System default categories cannot be deleted.');
      return;
    }
    if (!confirm(`Delete category "${cat.categoryName}"?`)) return;
    try {
      await incomeApi.deleteIncomeCategory(cat.id);
      success('Category deleted.');
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete category.');
    }
  };

  // Load Reports
  const openReportsModal = async () => {
    setIsReportsModalOpen(true);
    try {
      setReportsLoading(true);
      const rep = await incomeApi.getIncomeReports(dateFrom || undefined, dateTo || undefined);
      setReportsData(rep);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load income reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Voucher Number',
      'Date',
      'Category',
      'Type',
      'Description',
      'Amount',
      'Received Through',
      'Receiving Account',
      'Reference #',
      'Payer',
      'Status',
      'Journal Entry #',
    ];
    const rows = transactions.map((t) => [
      t.voucherNumber,
      new Date(t.incomeDate).toLocaleDateString(),
      `"${t.categoryName}"`,
      t.categoryType,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.receivedThrough,
      `"${t.receivingAccountName} (${t.receivingAccountCode})"`,
      `"${t.referenceNumber || ''}"`,
      `"${t.payerName || ''}"`,
      t.status,
      t.journalEntryNumber || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Income_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to open Print Modal
  const openPrintModal = (tx: IncomeTransactionItem) => {
    setSelectedTx(tx);
    setIsPrintModalOpen(true);
  };

  // Receiving account options grouped by type
  const groupedReceivingAccounts = useMemo(() => {
    return {
      cash: receivingAccounts.filter((a) => a.accountType === 'CASH'),
      bank: receivingAccounts.filter((a) => a.accountType === 'BANK'),
      wallet: receivingAccounts.filter((a) => a.accountType === 'WALLET'),
    };
  }, [receivingAccounts]);

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Income Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-[#0B3D32] text-white dark:bg-emerald-600 hover:bg-[#082d25] dark:hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Add Income</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={openReportsModal}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Reports</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchSummary();
              fetchTransactions();
            }}
            disabled={loading}
            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Income Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[1.25] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher, description, payer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Income Category Filter */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName} ({c.categoryType === 'OPERATING' ? 'Op' : 'Non-Op'})
                </option>
              ))}
            </select>
          </div>

          {/* Operating vs Non-Operating Filter */}
          <div className="md:col-span-2">
            <select
              value={categoryTypeFilter}
              onChange={(e) => {
                setCategoryTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Revenue Types</option>
              <option value="OPERATING">Operating Income Only</option>
              <option value="NON_OPERATING">Non-Operating Only</option>
            </select>
          </div>

          {/* Receiving Account Filter */}
          <div className="md:col-span-3">
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Receiving Accounts</option>
              <optgroup label="Physical Cash">
                {groupedReceivingAccounts.cash.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.accountCode})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Bank Accounts">
                {groupedReceivingAccounts.bank.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.bankName || a.accountCode})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Digital Wallets">
                {groupedReceivingAccounts.wallet.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.walletProvider || a.accountCode})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">POSTED (Active GL)</option>
              <option value="DRAFT">DRAFT (Unposted)</option>
              <option value="REVERSED">REVERSED</option>
            </select>
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Period:</span>
            {(['ALL', 'TODAY', 'MONTH', 'YEAR'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleDatePreset(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  dateRangePreset === p
                    ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {p === 'ALL' ? 'All Time' : p === 'TODAY' ? 'Today' : p === 'MONTH' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDateRangePreset('CUSTOM');
                  setPage(1);
                }}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDateRangePreset('CUSTOM');
                  setPage(1);
                }}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white"
              />
            </div>
            {(dateFrom || dateTo || searchQuery || categoryFilter !== 'ALL' || categoryTypeFilter !== 'ALL' || accountFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                  setDateRangePreset('ALL');
                  setCategoryFilter('ALL');
                  setCategoryTypeFilter('ALL');
                  setAccountFilter('ALL');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className="px-2 py-0.5 text-[11px] text-rose-600 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Income Records Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Received Via</th>
                <th className="py-2.5 px-3">Receiving Account</th>
                <th className="py-2.5 px-3">Reference / Payer</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-emerald-600" />
                    <span>Loading income transactions...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-[1.25]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No income transactions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || dateFrom || categoryFilter !== 'ALL'
                        ? 'Try clearing filters to view all records.'
                        : 'Click "+ Add Income" above to record non-POS earnings.'}
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isOperating = t.categoryType === 'OPERATING';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {new Date(t.incomeDate).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Voucher Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTx(t);
                            setIsViewModalOpen(true);
                          }}
                          className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {t.voucherNumber}
                        </button>
                        {t.journalEntryNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {t.journalEntryNumber}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{t.categoryName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isOperating
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {isOperating ? 'Operating' : 'Non-Op'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{t.incomeAccountCode} - {t.incomeAccountName}</div>
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 max-w-[240px]">
                        <p className="truncate text-slate-800 dark:text-slate-200" title={t.description}>
                          {t.description}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Received Via */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
                          {t.receivedThrough}
                        </span>
                      </td>

                      {/* Receiving Account */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{t.receivingAccountName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{t.receivingAccountCode}</div>
                      </td>

                      {/* Reference # / Payer */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200">{t.payerName || '—'}</div>
                        {t.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">Ref: {t.referenceNumber}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        {t.status === 'POSTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-2.5 h-2.5" />
                            POSTED
                          </span>
                        )}
                        {t.status === 'DRAFT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-2.5 h-2.5" />
                            DRAFT
                          </span>
                        )}
                        {t.status === 'REVERSED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <RotateCcw className="w-2.5 h-2.5" />
                            REVERSED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTx(t);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>

                          {/* Print */}
                          <button
                            type="button"
                            onClick={() => openPrintModal(t)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>

                          {/* Post (Draft Only) */}
                          {t.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handlePostDraft(t)}
                              disabled={isSubmittingAction}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Post to General Ledger"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          {/* Edit (Draft Only) */}
                          {t.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="Edit Draft"
                            >
                              <Edit2 className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          {/* Delete (Draft Only) */}
                          {t.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(t)}
                              disabled={isSubmittingAction}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          {/* Reverse (Posted Only) */}
                          {t.status === 'POSTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTx(t);
                                setReversalReason('');
                                setIsReverseModalOpen(true);
                              }}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Reverse Transaction"
                            >
                              <RotateCcw className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Permanent Bottom-Right DataTables Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${
                    page === pageNum
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT INCOME TRANSACTION */}
      {/* ========================================================================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditModalOpen ? `Edit Income Draft (${selectedTx?.voucherNumber})` : 'Record New Income'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncome} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Income Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Income Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Income Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Income Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    <optgroup label="Operating Income">
                      {categories
                        .filter((c) => c.categoryType === 'OPERATING')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.categoryName} ({c.accountCode})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Non-Operating Income">
                      {categories
                        .filter((c) => c.categoryType === 'NON_OPERATING')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.categoryName} ({c.accountCode})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Amount (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Received Through */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Received Through <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formReceivedThrough}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setFormReceivedThrough(mode);
                      // Auto-suggest appropriate account
                      if (mode === 'CASH' && groupedReceivingAccounts.cash[0]) {
                        setFormReceivingAccountId(groupedReceivingAccounts.cash[0].id);
                      } else if (mode === 'BANK' && groupedReceivingAccounts.bank[0]) {
                        setFormReceivingAccountId(groupedReceivingAccounts.bank[0].id);
                      } else if (mode === 'WALLET' && groupedReceivingAccounts.wallet[0]) {
                        setFormReceivingAccountId(groupedReceivingAccounts.wallet[0].id);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="CASH">Physical Cash</option>
                    <option value="BANK">Bank Deposit / Transfer</option>
                    <option value="WALLET">Digital Wallet (eSewa / Khalti)</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="OTHER">Other Channel</option>
                  </select>
                </div>

                {/* Receiving Account */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Receiving Account (Debit Asset) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formReceivingAccountId}
                    onChange={(e) => setFormReceivingAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <optgroup label="Physical Cash Drawers">
                      {groupedReceivingAccounts.cash.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} ({a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Bank Accounts">
                      {groupedReceivingAccounts.bank.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} ({a.bankName || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Digital Wallets">
                      {groupedReceivingAccounts.wallet.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} ({a.walletProvider || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Description / Purpose <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Catering package for Rotary Club banquet, party hall deposit..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Payer Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Received From / Payer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Client or organization name"
                    value={formPayerName}
                    onChange={(e) => setFormPayerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Reference # / Cheque / Tx ID
                  </label>
                  <input
                    type="text"
                    placeholder="Bank reference or receipt number"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Additional Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional details or terms..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Auto Post Checkbox (Only for new) */}
              {!isEditModalOpen && (
                <div className="p-2.5 rounded border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                      Auto-Post to General Ledger
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Creates balanced Journal Entry immediately: Debit Receiving Account, Credit Income.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAutoPost}
                    onChange={(e) => setFormAutoPost(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-1.5 rounded font-semibold text-white bg-[#0B3D32] hover:bg-[#082d25] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditModalOpen ? 'Save Changes' : formAutoPost ? 'Record & Post Income' : 'Save as Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW DETAILS & DOUBLE-ENTRY PREVIEW */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Income Voucher: {selectedTx.voucherNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Header Badge Row */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Income Amount</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    Rs. {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedTx.status === 'POSTED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : selectedTx.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {selectedTx.status}
                  </span>
                </div>
              </div>

              {/* Voucher Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Income Date:</span>
                  <span className="font-semibold">
                    {new Date(selectedTx.incomeDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Revenue Category:</span>
                  <span className="font-semibold">{selectedTx.categoryName}</span>{' '}
                  <span className="text-[10px] text-slate-400">({selectedTx.categoryType})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Payment Received Through:</span>
                  <span className="font-semibold uppercase">{selectedTx.receivedThrough}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Receiving Account:</span>
                  <span className="font-semibold">{selectedTx.receivingAccountName}</span>{' '}
                  <span className="font-mono text-[10px] text-slate-400">({selectedTx.receivingAccountCode})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Received From / Payer:</span>
                  <span className="font-semibold">{selectedTx.payerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Reference Number:</span>
                  <span className="font-mono font-semibold">{selectedTx.referenceNumber || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">Description:</span>
                  <span className="font-medium">{selectedTx.description}</span>
                </div>
                {selectedTx.notes && (
                  <div className="col-span-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Internal Notes:</span>
                    <span className="text-slate-600 dark:text-slate-400">{selectedTx.notes}</span>
                  </div>
                )}
              </div>

              {/* Double-Entry Journal Entry Preview */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Double-Entry General Ledger Postings
                  </span>
                  {selectedTx.journalEntryNumber && (
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {selectedTx.journalEntryNumber}
                    </span>
                  )}
                </div>

                <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="py-1 px-2.5">Account / Code</th>
                        <th className="py-1 px-2.5">Classification</th>
                        <th className="py-1 px-2.5 text-right">Debit (Dr)</th>
                        <th className="py-1 px-2.5 text-right">Credit (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Debit Receiving Account */}
                      <tr>
                        <td className="py-1.5 px-2.5">
                          <span className="font-bold">{selectedTx.receivingAccountName}</span>
                          <span className="font-mono text-slate-400 text-[10px] ml-1">({selectedTx.receivingAccountCode})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500">Asset (Cash/Bank)</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600">
                          Rs. {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">0.00</td>
                      </tr>
                      {/* Credit Income Account */}
                      <tr>
                        <td className="py-1.5 px-2.5">
                          <span className="font-bold">{selectedTx.incomeAccountName}</span>
                          <span className="font-mono text-slate-400 text-[10px] ml-1">({selectedTx.incomeAccountCode})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500">Revenue (Income)</td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-blue-600">
                          Rs. {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reversal Audit Info if Reversed */}
              {selectedTx.status === 'REVERSED' && (
                <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    Reversed under Reversal Voucher: {selectedTx.reversalJournalEntryNumber || 'N/A'}
                  </div>
                  <div className="text-[11px]">
                    <span className="font-semibold">Reason:</span> {selectedTx.reversalReason || 'No reason specified'}
                  </div>
                  {selectedTx.reversedAt && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400">
                      Reversed on {new Date(selectedTx.reversedAt).toLocaleString()} by {selectedTx.reversedBy || 'Staff'}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openPrintModal(selectedTx)}
                  className="px-3 py-1.5 rounded font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedTx.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => handlePostDraft(selectedTx)}
                      disabled={isSubmittingAction}
                      className="px-3 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Post Now</span>
                    </button>
                  )}
                  {selectedTx.status === 'POSTED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReversalReason('');
                        setIsReverseModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reverse Voucher</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-3 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVERSE INCOME TRANSACTION */}
      {/* ========================================================================= */}
      {isReverseModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold">Reverse Income Voucher: {selectedTx.voucherNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReverseModalOpen(false)}
                className="p-1 rounded text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Reversing will create an offsetting adjustment Journal Entry in the General Ledger and deduct{' '}
                <span className="font-bold text-rose-600">
                  Rs. {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>{' '}
                from receiving account <span className="font-semibold">{selectedTx.receivingAccountName}</span>.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Reversal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Booking cancelled, duplicate voucher entry, refund issued..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReverseModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReverse}
                  disabled={isSubmittingAction || !reversalReason.trim()}
                  className="px-4 py-1.5 rounded font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Reversal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIGURE CATEGORIES */}
      {/* ========================================================================= */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Income Categories &amp; GL Account Mappings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoriesModalOpen(false);
                  setEditingCatId(null);
                  setNewCatName('');
                  setNewCatDesc('');
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Add / Edit Category Form */}
              <form onSubmit={handleSaveCategory} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {editingCatId ? 'Edit Income Category' : 'Create Custom Income Category'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cooking Class Fee"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Category Type</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="OPERATING">Operating Income</option>
                      <option value="NON_OPERATING">Non-Operating Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Linked GL Account *</label>
                    <select
                      required
                      value={newCatAccountId}
                      onChange={(e) => setNewCatAccountId(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="" disabled>
                        Select Account
                      </option>
                      {glAccounts
                        .filter((a) => a.accountType === 'REVENUE' || a.accountType === 'INCOME')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.accountCode} - {a.accountName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Description</label>
                    <input
                      type="text"
                      placeholder="Brief note on when to use this income category..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setNewCatName('');
                        setNewCatDesc('');
                      }}
                      className="px-2.5 py-1 rounded text-slate-500 hover:bg-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="px-3 py-1 rounded bg-[#0B3D32] dark:bg-emerald-600 text-white font-semibold hover:opacity-90"
                  >
                    {editingCatId ? 'Update Category' : '+ Add Category'}
                  </button>
                </div>
              </form>

              {/* Categories Listing Table */}
              <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3">Category Name</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Linked GL Account</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                          {c.categoryName}
                          {c.isSystem && (
                            <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              System
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.categoryType === 'OPERATING'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {c.categoryType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {c.accountCode} - {c.accountName}
                        </td>
                        <td className="py-2 px-3 text-slate-500 max-w-[180px] truncate" title={c.description}>
                          {c.description || '—'}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          {!c.isSystem && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(c.id);
                                  setNewCatName(c.categoryName);
                                  setNewCatType(c.categoryType);
                                  setNewCatAccountId(c.accountId);
                                  setNewCatDesc(c.description || '');
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REPORTS & REVENUE ANALYTICS */}
      {/* ========================================================================= */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Income Analysis &amp; Revenue Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {reportsLoading || !reportsData ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-emerald-600" />
                  <span>Calculating revenue breakdown...</span>
                </div>
              ) : (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Posted Income</div>
                      <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                        Rs. {reportsData.totalIncome.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Operating Income</div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                        Rs. {reportsData.operatingTotal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{reportsData.operatingPercentage}% share</div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Non-Operating Income</div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                        Rs. {reportsData.nonOperatingTotal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-blue-600 font-semibold">{reportsData.nonOperatingPercentage}% share</div>
                    </div>
                  </div>

                  {/* Revenue by Category Breakdown */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Revenue by Category</h4>
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Category</th>
                            <th className="py-1.5 px-3">Classification</th>
                            <th className="py-1.5 px-3 text-right">Transactions</th>
                            <th className="py-1.5 px-3 text-right">Total Amount</th>
                            <th className="py-1.5 px-3 text-right">% Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportsData.byCategory.map((c) => (
                            <tr key={c.categoryId}>
                              <td className="py-1.5 px-3 font-semibold">{c.categoryName}</td>
                              <td className="py-1.5 px-3 text-[10px] text-slate-500">{c.categoryType}</td>
                              <td className="py-1.5 px-3 text-right font-mono">{c.count}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-600">
                                Rs. {c.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">{c.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Revenue by Receiving Account Breakdown */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Revenue by Receiving Account</h4>
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Receiving Account</th>
                            <th className="py-1.5 px-3 text-right">Vouchers</th>
                            <th className="py-1.5 px-3 text-right">Collected Amount</th>
                            <th className="py-1.5 px-3 text-right">% Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportsData.byAccount.map((a) => (
                            <tr key={a.receivingAccountId}>
                              <td className="py-1.5 px-3 font-semibold">
                                {a.receivingAccountName}{' '}
                                <span className="font-mono text-slate-400 text-[10px]">({a.receivingAccountCode})</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">{a.count}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-600">
                                Rs. {a.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">{a.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PRINTABLE THERMAL / STANDARD VOUCHER */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Income Voucher Receipt</span>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Body (Print-Ready) */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-900 bg-white" id="printable-income-voucher">
              {/* Restaurant Header */}
              <div className="text-center border-b pb-3 border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-wider uppercase">Everest Family Restaurant</h2>
                <p className="text-[10px] text-slate-500">Hospitality &amp; Dining ERP</p>
                <p className="text-[10px] text-slate-500">Kathmandu, Nepal • PAN: 601234567</p>
                <div className="inline-block px-2 py-0.5 mt-2 rounded bg-slate-100 text-[11px] font-bold tracking-widest uppercase">
                  OFFICIAL INCOME RECEIPT
                </div>
              </div>

              {/* Voucher Meta */}
              <div className="space-y-1 text-[11px] border-b pb-3 border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voucher #:</span>
                  <span className="font-bold">{selectedTx.voucherNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{new Date(selectedTx.incomeDate).toLocaleDateString()}</span>
                </div>
                {selectedTx.journalEntryNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">GL Journal Entry:</span>
                    <span>{selectedTx.journalEntryNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue Category:</span>
                  <span className="font-bold">{selectedTx.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="uppercase">{selectedTx.receivedThrough}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receiving Account:</span>
                  <span>{selectedTx.receivingAccountName}</span>
                </div>
                {selectedTx.payerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Received From:</span>
                    <span className="font-bold">{selectedTx.payerName}</span>
                  </div>
                )}
                {selectedTx.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference #:</span>
                    <span>{selectedTx.referenceNumber}</span>
                  </div>
                )}
              </div>

              {/* Purpose / Description */}
              <div className="border-b pb-3 border-dashed border-slate-300 text-[11px]">
                <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Description:</div>
                <p className="font-sans font-medium">{selectedTx.description}</p>
              </div>

              {/* Total Amount Box */}
              <div className="p-3 rounded bg-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase">Total Received:</span>
                <span className="text-base font-black">
                  Rs. {selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">Received By / Cashier</div>
                <div className="border-t border-slate-300 pt-1">Authorized Accountant</div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B3D32] rounded flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


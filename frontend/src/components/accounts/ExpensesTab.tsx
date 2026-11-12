'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingDown,
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
  Tag,
  Receipt,
  DollarSign
} from 'lucide-react';
import { expenseApi, api } from '@/lib/api';
import {
  ExpenseCategoryItem,
  ExpenseTransactionItem,
  ExpensePaymentItem,
  ExpenseSummary,
  ExpensePaymentAccount,
  ExpenseReportsData,
  CreateExpenseDto,
  RecordExpensePaymentDto,
  CreateExpenseCategoryDto,
  AccountItem
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function ExpensesTab() {
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ExpenseTransactionItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    thisMonthExpenses: 0,
    todayExpenses: 0,
    totalDraftExpenses: 0,
    draftCount: 0,
    totalPostedCount: 0,
    operatingExpenses: 0,
    nonOperatingExpenses: 0,
    totalPaid: 0,
    totalUnpaidPayable: 0,
    unpaidCount: 0,
  });

  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<ExpensePaymentAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<AccountItem[]>([]);

  // Pagination & Filtering
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | 'TODAY' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected Transaction for View / Edit / Reverse / Payment / Print
  const [selectedTx, setSelectedTx] = useState<ExpenseTransactionItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Add / Edit Form State
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formIsPaid, setFormIsPaid] = useState(true);
  const [formPaymentMode, setFormPaymentMode] = useState('CASH');
  const [formPaymentAccountId, setFormPaymentAccountId] = useState('');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAutoPost, setFormAutoPost] = useState(true);

  // Record Payment Form State
  const [pmtDate, setPmtDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pmtAmount, setPmtAmount] = useState<number | ''>('');
  const [pmtMode, setPmtMode] = useState('CASH');
  const [pmtAccountId, setPmtAccountId] = useState('');
  const [pmtRef, setPmtRef] = useState('');
  const [pmtNotes, setPmtNotes] = useState('');

  // Category Configuration Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'OPERATING' | 'NON_OPERATING'>('OPERATING');
  const [newCatAccountId, setNewCatAccountId] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Reports Data
  const [reportsData, setReportsData] = useState<ExpenseReportsData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await expenseApi.getExpenseSummary(dateFrom || undefined, dateTo || undefined);
      if (res) setSummary(res);
    } catch (err: any) {
      console.error('Failed to load expense summary:', err);
    }
  }, [dateFrom, dateTo]);

  // 2. Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await expenseApi.getExpenseTransactions({
        search: searchQuery.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        categoryId: categoryFilter,
        categoryType: categoryTypeFilter,
        paymentAccountId: accountFilter,
        paymentStatus: paymentStatusFilter,
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
      toastError(err?.message || 'Failed to load expense transactions.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateFrom, dateTo, categoryFilter, categoryTypeFilter, accountFilter, paymentStatusFilter, statusFilter, page, pageSize, toastError]);

  // 3. Fetch Master Data (Categories, Payment Accounts, GL Accounts)
  const fetchMasterData = useCallback(async () => {
    try {
      const [cats, pmtAccs, accountsRes] = await Promise.all([
        expenseApi.getExpenseCategories(),
        expenseApi.getExpensePaymentAccounts(),
        api.getChartOfAccounts().catch(() => ({ accounts: [] })),
      ]);

      if (cats) setCategories(cats);
      if (pmtAccs) {
        setPaymentAccounts(pmtAccs);
        const cashAcc = pmtAccs.find((a) => a.accountType === 'CASH');
        if (cashAcc && !formPaymentAccountId) {
          setFormPaymentAccountId(cashAcc.id);
        }
      }
      if (accountsRes && accountsRes.accounts) {
        setGlAccounts(accountsRes.accounts);
      }
    } catch (err: any) {
      console.error('Failed to load master metadata:', err);
    }
  }, [formPaymentAccountId]);

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

  // Grouped payment accounts by type
  const groupedPaymentAccounts = useMemo(() => {
    return {
      cash: paymentAccounts.filter((a) => a.accountType === 'CASH'),
      bank: paymentAccounts.filter((a) => a.accountType === 'BANK'),
      wallet: paymentAccounts.filter((a) => a.accountType === 'WALLET'),
      payable: paymentAccounts.filter((a) => a.accountType === 'PAYABLE'),
    };
  }, [paymentAccounts]);

  // Open Add Modal
  const openAddModal = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormCategoryId(categories[0]?.id || '');
    setFormDescription('');
    setFormAmount('');
    setFormIsPaid(true);
    setFormPaymentMode('CASH');
    const firstCash = paymentAccounts.find((a) => a.accountType === 'CASH');
    setFormPaymentAccountId(firstCash?.id || paymentAccounts[0]?.id || '');
    setFormPaidTo('');
    setFormReferenceNumber('');
    setFormDueDate('');
    setFormNotes('');
    setFormAutoPost(true);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal (Draft Only)
  const openEditModal = (tx: ExpenseTransactionItem) => {
    setSelectedTx(tx);
    setFormDate(tx.expenseDate ? tx.expenseDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormCategoryId(tx.categoryId);
    setFormDescription(tx.description);
    setFormAmount(tx.totalAmount);
    setFormIsPaid(tx.paymentStatus !== 'UNPAID');
    setFormPaymentMode(tx.paymentMode);
    setFormPaymentAccountId(tx.paymentAccountId);
    setFormPaidTo(tx.paidTo || '');
    setFormReferenceNumber(tx.referenceNumber || '');
    setFormDueDate(tx.dueDate ? tx.dueDate.slice(0, 10) : '');
    setFormNotes(tx.notes || '');
    setFormAutoPost(false);
    setIsEditModalOpen(true);
  };

  // Open Record Payment Modal
  const openRecordPaymentModal = (tx: ExpenseTransactionItem) => {
    setSelectedTx(tx);
    setPmtDate(new Date().toISOString().slice(0, 10));
    setPmtAmount(tx.remainingPayable);
    setPmtMode('CASH');
    const firstCash = paymentAccounts.find((a) => a.accountType === 'CASH');
    setPmtAccountId(firstCash?.id || paymentAccounts[0]?.id || '');
    setPmtRef('');
    setPmtNotes('');
    setIsRecordPaymentModalOpen(true);
  };

  // Handle Save / Submit Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryId) {
      toastError('Please select a valid expense category.');
      return;
    }
    if (!formDescription.trim()) {
      toastError('Expense description is required.');
      return;
    }
    const numAmount = Number(formAmount);
    if (!numAmount || numAmount <= 0) {
      toastError('Please enter an amount greater than 0.');
      return;
    }
    if (formIsPaid && !formPaymentAccountId) {
      toastError('Please select a payment asset account for paid expenses.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: CreateExpenseDto = {
        expenseDate: new Date(formDate).toISOString(),
        categoryId: formCategoryId,
        description: formDescription.trim(),
        amount: numAmount,
        isPaid: formIsPaid,
        paymentMode: formIsPaid ? formPaymentMode : 'CREDIT',
        paymentAccountId: formIsPaid ? formPaymentAccountId : undefined,
        paidTo: formPaidTo.trim() || undefined,
        referenceNumber: formReferenceNumber.trim() || undefined,
        dueDate: !formIsPaid && formDueDate ? new Date(formDueDate).toISOString() : undefined,
        notes: formNotes.trim() || undefined,
        autoPost: formAutoPost,
      };

      if (isEditModalOpen && selectedTx) {
        await expenseApi.updateExpenseTransaction(selectedTx.id, payload);
        success(`Expense draft ${selectedTx.voucherNumber} updated successfully.`);
        setIsEditModalOpen(false);
      } else {
        const created = await expenseApi.createExpenseTransaction(payload);
        success(
          formAutoPost
            ? `Expense voucher ${created?.voucherNumber || ''} created & posted to General Ledger!`
            : `Expense draft ${created?.voucherNumber || ''} saved successfully.`
        );
        setIsAddModalOpen(false);
      }

      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save expense transaction.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    const numAmt = Number(pmtAmount);
    if (!numAmt || numAmt <= 0) {
      toastError('Payment amount must be greater than zero.');
      return;
    }
    if (numAmt > selectedTx.remainingPayable) {
      toastError(`Payment cannot exceed remaining payable (Rs. ${selectedTx.remainingPayable.toLocaleString()}).`);
      return;
    }
    if (!pmtAccountId) {
      toastError('Please select an active Cash, Bank, or Wallet account.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: RecordExpensePaymentDto = {
        paymentDate: new Date(pmtDate).toISOString(),
        amount: numAmt,
        paymentMode: pmtMode,
        paymentAccountId: pmtAccountId,
        referenceNumber: pmtRef.trim() || undefined,
        notes: pmtNotes.trim() || undefined,
      };

      const res = await expenseApi.recordExpensePayment(selectedTx.id, payload);
      success(`Payment of Rs. ${numAmt.toLocaleString()} recorded under receipt ${res.paymentReceiptNumber}.`);
      setIsRecordPaymentModalOpen(false);
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record expense payment.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Post Draft
  const handlePostDraft = async (tx: ExpenseTransactionItem) => {
    try {
      setIsSubmittingAction(true);
      await expenseApi.postExpenseTransaction(tx.id);
      success(`Expense voucher ${tx.voucherNumber} posted to General Ledger successfully!`);
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post expense draft.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async (tx: ExpenseTransactionItem) => {
    if (!confirm(`Are you sure you want to delete draft ${tx.voucherNumber}? This cannot be undone.`)) return;
    try {
      setIsSubmittingAction(true);
      await expenseApi.deleteExpenseTransaction(tx.id);
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
      await expenseApi.reverseExpenseTransaction(selectedTx.id, {
        reason: reversalReason.trim(),
        reversedBy: 'Accountant',
      });
      success(`Expense voucher ${selectedTx.voucherNumber} reversed successfully.`);
      setIsReverseModalOpen(false);
      setReversalReason('');
      if (isViewModalOpen) setIsViewModalOpen(false);
      fetchSummary();
      fetchTransactions();
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to reverse expense voucher.');
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
      toastError('Please link a Chart of Accounts expense code.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const catDto: CreateExpenseCategoryDto = {
        categoryName: newCatName.trim(),
        categoryType: newCatType,
        accountId: newCatAccountId,
        description: newCatDesc.trim() || undefined,
      };

      if (editingCatId) {
        await expenseApi.updateExpenseCategory(editingCatId, catDto);
        success('Expense category updated.');
      } else {
        await expenseApi.createExpenseCategory(catDto);
        success('New expense category created.');
      }

      setNewCatName('');
      setNewCatDesc('');
      setEditingCatId(null);
      fetchMasterData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save expense category.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDeleteCategory = async (cat: ExpenseCategoryItem) => {
    if (cat.isSystem) {
      toastError('System default categories cannot be deleted.');
      return;
    }
    if (!confirm(`Delete category "${cat.categoryName}"?`)) return;
    try {
      await expenseApi.deleteExpenseCategory(cat.id);
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
      const rep = await expenseApi.getExpenseReports(dateFrom || undefined, dateTo || undefined);
      setReportsData(rep);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load expense reports.');
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
      'Total Amount',
      'Paid Amount',
      'Remaining Payable',
      'Payment Status',
      'Payment Mode',
      'Payment/Payable Account',
      'Paid To / Payee',
      'Reference #',
      'Status',
      'Journal Entry #',
    ];
    const rows = transactions.map((t) => [
      t.voucherNumber,
      new Date(t.expenseDate).toLocaleDateString(),
      `"${t.categoryName}"`,
      t.categoryType,
      `"${t.description.replace(/"/g, '""')}"`,
      t.totalAmount,
      t.paidAmount,
      t.remainingPayable,
      t.paymentStatus,
      t.paymentMode,
      `"${t.paymentAccountName} (${t.paymentAccountCode})"`,
      `"${t.paidTo || ''}"`,
      `"${t.referenceNumber || ''}"`,
      t.status,
      t.journalEntryNumber || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to open Print Modal
  const openPrintModal = (tx: ExpenseTransactionItem) => {
    setSelectedTx(tx);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/accounts"
            className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accounts Hub</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 stroke-[1.25]" />
            <span>Expense Management</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-[#0B3D32] text-white dark:bg-emerald-600 hover:bg-[#082d25] dark:hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Add Expense</span>
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
            <span>Reports &amp; Payables</span>
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
            title="Refresh Expense Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[1.25] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Three Compact Summary Cards (Requirement: Total Expenses, This Month, Today) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Total Expenses */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-600 stroke-[1.25]" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
            Rs. {(summary.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{summary.totalPostedCount || 0} posted vouchers</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Op: Rs. {(summary.operatingExpenses || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: This Month */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>This Month</span>
            <Calendar className="w-4 h-4 text-blue-600 stroke-[1.25]" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-blue-900 dark:text-blue-300">
            Rs. {(summary.thisMonthExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Paid: Rs. {(summary.totalPaid || 0).toLocaleString()}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Payables: Rs. {(summary.totalUnpaidPayable || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Today */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Today</span>
            <Clock className="w-4 h-4 text-teal-600 stroke-[1.25]" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-teal-900 dark:text-teal-300">
            Rs. {(summary.todayExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {summary.unpaidCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {summary.unpaidCount} Pending Payables
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                All Payables Cleared
              </span>
            )}
          </div>
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
              placeholder="Search voucher, description, payee..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Expense Category Filter */}
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

          {/* Payment Account Filter */}
          <div className="md:col-span-3">
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Payment &amp; Payable Accounts</option>
              <optgroup label="Physical Cash">
                {groupedPaymentAccounts.cash.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.accountCode})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Bank Accounts">
                {groupedPaymentAccounts.bank.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.bankName || a.accountCode})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Digital Wallets">
                {groupedPaymentAccounts.wallet.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.walletProvider || a.accountCode})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Accrued Payables">
                {groupedPaymentAccounts.payable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({a.accountCode})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">PAID (Settled)</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="UNPAID">UNPAID (Payable)</option>
            </select>
          </div>

          {/* Workflow Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Workflow Statuses</option>
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
            {(dateFrom || dateTo || searchQuery || categoryFilter !== 'ALL' || categoryTypeFilter !== 'ALL' || accountFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || statusFilter !== 'ALL') && (
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
                  setPaymentStatusFilter('ALL');
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

      {/* 4. Expense Records Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Payment Status</th>
                <th className="py-2.5 px-3">Paid Via / Account</th>
                <th className="py-2.5 px-3">Paid To / Payee</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-emerald-600" />
                    <span>Loading expense transactions...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <TrendingDown className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-[1.25]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No expense records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || dateFrom || categoryFilter !== 'ALL'
                        ? 'Try clearing filters to view all records.'
                        : 'Click "+ Add Expense" above to record restaurant operating costs.'}
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
                        {new Date(t.expenseDate).toLocaleDateString('en-US', {
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
                          className="font-mono font-bold text-rose-700 dark:text-rose-400 hover:underline"
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
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {isOperating ? 'Operating' : 'Non-Op'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{t.expenseAccountCode} - {t.expenseAccountName}</div>
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <p className="truncate text-slate-800 dark:text-slate-200" title={t.description}>
                          {t.description}
                        </p>
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        <div>Rs. {t.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {t.remainingPayable > 0 && (
                          <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                            Due: Rs. {t.remainingPayable.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center">
                        {t.paymentStatus === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-2.5 h-2.5" />
                            PAID
                          </span>
                        )}
                        {t.paymentStatus === 'PARTIALLY_PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            PARTIAL
                          </span>
                        )}
                        {t.paymentStatus === 'UNPAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Clock className="w-2.5 h-2.5" />
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Paid Through / Payment Account */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{t.paymentAccountName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {t.paymentMode} • {t.paymentAccountCode}
                        </div>
                      </td>

                      {/* Paid To / Payee */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200">{t.paidTo || '—'}</div>
                      </td>

                      {/* Reference Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {t.referenceNumber || '—'}
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

                          {/* Record Payment (If posted & remainingPayable > 0) */}
                          {t.status === 'POSTED' && t.remainingPayable > 0 && (
                            <button
                              type="button"
                              onClick={() => openRecordPaymentModal(t)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Record Payment Settlement"
                            >
                              <CreditCard className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

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
      {/* MODAL 1: ADD / EDIT EXPENSE */}
      {/* ========================================================================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditModalOpen ? `Edit Expense Draft (${selectedTx?.voucherNumber})` : 'Record New Expense'}
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

            <form onSubmit={handleSubmitExpense} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Expense Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Expense Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
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
                    <optgroup label="Operating Expenses">
                      {categories
                        .filter((c) => c.categoryType === 'OPERATING')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.categoryName} ({c.accountCode})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Non-Operating Expenses">
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

                {/* Payment Status Toggle (Paid Immediately vs Unpaid / Payable) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFormIsPaid(true)}
                      className={`py-1.5 rounded text-xs font-semibold border text-center transition-colors ${
                        formIsPaid
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Paid Immediately
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsPaid(false)}
                      className={`py-1.5 rounded text-xs font-semibold border text-center transition-colors ${
                        !formIsPaid
                          ? 'border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Unpaid / Accrue Bill
                    </button>
                  </div>
                </div>

                {/* Conditional Fields if Paid vs Unpaid */}
                {formIsPaid ? (
                  <>
                    {/* Payment Mode */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Paid Through <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formPaymentMode}
                        onChange={(e) => {
                          const mode = e.target.value;
                          setFormPaymentMode(mode);
                          if (mode === 'CASH' && groupedPaymentAccounts.cash[0]) {
                            setFormPaymentAccountId(groupedPaymentAccounts.cash[0].id);
                          } else if (mode === 'BANK' && groupedPaymentAccounts.bank[0]) {
                            setFormPaymentAccountId(groupedPaymentAccounts.bank[0].id);
                          } else if (mode === 'WALLET' && groupedPaymentAccounts.wallet[0]) {
                            setFormPaymentAccountId(groupedPaymentAccounts.wallet[0].id);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="CASH">Physical Cash</option>
                        <option value="BANK">Bank Transfer / Cheque</option>
                        <option value="WALLET">Digital Wallet (eSewa / Khalti)</option>
                        <option value="CHEQUE">Bank Cheque</option>
                      </select>
                    </div>

                    {/* Payment Account */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Payment Account (Credit Asset) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={formPaymentAccountId}
                        onChange={(e) => setFormPaymentAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <optgroup label="Physical Cash">
                          {groupedPaymentAccounts.cash.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountName} ({a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Bank Accounts">
                          {groupedPaymentAccounts.bank.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountName} ({a.bankName || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Digital Wallets">
                          {groupedPaymentAccounts.wallet.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountName} ({a.walletProvider || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Due Date for Unpaid Expense */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Bill Due Date
                      </label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Liability Accrual Account Notice */}
                    <div className="p-2.5 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                      <div className="font-semibold text-[11px]">Accrual Credit Account:</div>
                      <div className="text-[10px] mt-0.5">
                        Will credit <strong>2025 Accrued Expenses &amp; Operating Payables</strong> (Liability). Cash/Bank will NOT be deducted until a settlement payment is recorded.
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Description / Purpose <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electricity bill for Falgun, kitchen chimney grease cleaning..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Paid To / Payee */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Paid To / Vendor / Payee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nepal Electricity Authority, landlord, service provider"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Bill # / Reference / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="Bill, invoice or cheque number"
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes or remarks..."
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
                      Generates balanced double-entry Journal Entry immediately upon saving.
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
                  <span>{isEditModalOpen ? 'Save Changes' : formAutoPost ? 'Record & Post Expense' : 'Save as Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT AGAINST EXPENSE */}
      {/* ========================================================================= */}
      {isRecordPaymentModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record Payment: {selectedTx.voucherNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3.5 text-xs">
              {/* Summary of expense payable */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense Category:</span>
                  <span className="font-semibold">{selectedTx.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payee:</span>
                  <span className="font-semibold">{selectedTx.paidTo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Expense:</span>
                  <span className="font-mono">Rs. {selectedTx.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Payable:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    Rs. {selectedTx.remainingPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={pmtDate}
                  onChange={(e) => setPmtDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedTx.remainingPayable}
                  required
                  value={pmtAmount}
                  onChange={(e) => setPmtAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Mode
                </label>
                <select
                  value={pmtMode}
                  onChange={(e) => {
                    const m = e.target.value;
                    setPmtMode(m);
                    if (m === 'CASH' && groupedPaymentAccounts.cash[0]) {
                      setPmtAccountId(groupedPaymentAccounts.cash[0].id);
                    } else if (m === 'BANK' && groupedPaymentAccounts.bank[0]) {
                      setPmtAccountId(groupedPaymentAccounts.bank[0].id);
                    } else if (m === 'WALLET' && groupedPaymentAccounts.wallet[0]) {
                      setPmtAccountId(groupedPaymentAccounts.wallet[0].id);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="CASH">Physical Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="WALLET">Digital Wallet (eSewa / Khalti)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              {/* Payment Account */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Disburse From (Credit Asset) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={pmtAccountId}
                  onChange={(e) => setPmtAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <optgroup label="Physical Cash">
                    {groupedPaymentAccounts.cash.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bank Accounts">
                    {groupedPaymentAccounts.bank.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.bankName || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Digital Wallets">
                    {groupedPaymentAccounts.wallet.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.walletProvider || a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Reference / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="Receipt #, Cheque #, or Tx ID"
                  value={pmtRef}
                  onChange={(e) => setPmtRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
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
                  <span>Record &amp; Post Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW DETAILS, PAYMENT HISTORY & GL BREAKDOWN */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Expense Voucher: {selectedTx.voucherNumber}
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

            <div className="p-4 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Header Badge Row */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Expense Amount</div>
                  <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">
                    Rs. {selectedTx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {selectedTx.remainingPayable > 0 && (
                    <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                      Payable Due: Rs. {selectedTx.remainingPayable.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTx.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : selectedTx.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {selectedTx.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        selectedTx.status === 'POSTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedTx.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedTx.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Expense Date:</span>
                  <span className="font-semibold">
                    {new Date(selectedTx.expenseDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Expense Category:</span>
                  <span className="font-semibold">{selectedTx.categoryName}</span>{' '}
                  <span className="text-[10px] text-slate-400">({selectedTx.categoryType})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Payment / Disbursal Account:</span>
                  <span className="font-semibold">{selectedTx.paymentAccountName}</span>{' '}
                  <span className="font-mono text-[10px] text-slate-400">({selectedTx.paymentAccountCode})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Paid To / Payee:</span>
                  <span className="font-semibold">{selectedTx.paidTo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Bill / Cheque Reference #:</span>
                  <span className="font-mono font-semibold">{selectedTx.referenceNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Bill Due Date:</span>
                  <span>{selectedTx.dueDate ? new Date(selectedTx.dueDate).toLocaleDateString() : 'N/A (Immediate)'}</span>
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

              {/* Payment History Log (if payments exist) */}
              {selectedTx.payments && selectedTx.payments.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Settlement History
                  </div>
                  <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="py-1 px-2.5">Receipt #</th>
                          <th className="py-1 px-2.5">Date</th>
                          <th className="py-1 px-2.5">Account / Mode</th>
                          <th className="py-1 px-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedTx.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-1 px-2.5 font-mono font-bold text-emerald-600">{p.paymentReceiptNumber}</td>
                            <td className="py-1 px-2.5">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="py-1 px-2.5">
                              {p.paymentAccountName} ({p.paymentMode})
                            </td>
                            <td className="py-1 px-2.5 text-right font-mono font-bold">
                              Rs. {p.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Double-Entry Journal Entry Preview */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    General Ledger Postings
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
                      {/* Debit Expense Account */}
                      <tr>
                        <td className="py-1.5 px-2.5">
                          <span className="font-bold">{selectedTx.expenseAccountName}</span>
                          <span className="font-mono text-slate-400 text-[10px] ml-1">({selectedTx.expenseAccountCode})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500">Expense</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-rose-600">
                          Rs. {selectedTx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">0.00</td>
                      </tr>
                      {/* Credit Cash/Bank Asset (if paid) OR Payable Liability (if unpaid) */}
                      <tr>
                        <td className="py-1.5 px-2.5">
                          <span className="font-bold">{selectedTx.paymentAccountName}</span>
                          <span className="font-mono text-slate-400 text-[10px] ml-1">({selectedTx.paymentAccountCode})</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500">
                          {selectedTx.paymentStatus === 'UNPAID' ? 'Liability (Payable)' : 'Asset (Cash/Bank)'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">0.00</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600">
                          Rs. {selectedTx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  {selectedTx.status === 'POSTED' && selectedTx.remainingPayable > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openRecordPaymentModal(selectedTx);
                      }}
                      className="px-3 py-1.5 rounded font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}
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
      {/* MODAL 4: REVERSE EXPENSE TRANSACTION */}
      {/* ========================================================================= */}
      {isReverseModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold">Reverse Expense Voucher: {selectedTx.voucherNumber}</h3>
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
                Reversing will create an offsetting adjustment Journal Entry in the General Ledger. Cash/Bank disbursements will be refunded or outstanding payables will be cancelled for{' '}
                <span className="font-bold text-rose-600">
                  Rs. {selectedTx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Reversal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bill cancelled, wrong expense category, duplicate invoice entry..."
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
      {/* MODAL 5: CONFIGURE EXPENSE CATEGORIES */}
      {/* ========================================================================= */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Expense Categories &amp; GL Account Mappings
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
                  {editingCatId ? 'Edit Expense Category' : 'Create Custom Expense Category'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pest Control Expense"
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
                      <option value="OPERATING">Operating Expense</option>
                      <option value="NON_OPERATING">Non-Operating Expense</option>
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
                        Select Expense Account
                      </option>
                      {glAccounts
                        .filter((a) => a.accountType === 'EXPENSE')
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
                      placeholder="Description and usage instructions..."
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

              {/* Categories Table */}
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
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
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
      {/* MODAL 6: REPORTS & EXPENSE PAYABLES */}
      {/* ========================================================================= */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Expenses &amp; Payables Reports
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
                  <span>Loading expense reports...</span>
                </div>
              ) : (
                <>
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Posted Expenses</div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                        Rs. {reportsData.totalExpenses.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Settled (Paid)</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        Rs. {reportsData.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Payables</div>
                      <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                        Rs. {reportsData.totalUnpaidPayable.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Payables List */}
                  {reportsData.outstandingPayables.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Unpaid &amp; Partially Paid Expense Payables
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {reportsData.outstandingPayables.length} bills pending
                        </span>
                      </div>
                      <div className="rounded border border-rose-200 dark:border-rose-900/60 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold">
                            <tr>
                              <th className="py-1.5 px-3">Voucher #</th>
                              <th className="py-1.5 px-3">Category / Payee</th>
                              <th className="py-1.5 px-3">Due Date</th>
                              <th className="py-1.5 px-3 text-right">Total Amount</th>
                              <th className="py-1.5 px-3 text-right">Remaining Due</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                            {reportsData.outstandingPayables.map((op) => (
                              <tr key={op.id}>
                                <td className="py-1.5 px-3 font-mono font-bold text-rose-700 dark:text-rose-400">
                                  {op.voucherNumber}
                                </td>
                                <td className="py-1.5 px-3">
                                  <div className="font-semibold">{op.categoryName}</div>
                                  <div className="text-[10px] text-slate-500">{op.paidTo || op.description}</div>
                                </td>
                                <td className="py-1.5 px-3 text-slate-500">
                                  {op.dueDate ? new Date(op.dueDate).toLocaleDateString() : 'Immediate'}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono">Rs. {op.totalAmount.toLocaleString()}</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-600">
                                  Rs. {op.remainingPayable.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Expenses by Category Breakdown */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Expenses by Category</h4>
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Category</th>
                            <th className="py-1.5 px-3">Classification</th>
                            <th className="py-1.5 px-3 text-right">Count</th>
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
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-600">
                                Rs. {c.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">{c.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expenses by Payment Account Breakdown */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Expenses by Disbursal Account</h4>
                    <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="py-1.5 px-3">Account</th>
                            <th className="py-1.5 px-3 text-right">Vouchers</th>
                            <th className="py-1.5 px-3 text-right">Total Disbursed</th>
                            <th className="py-1.5 px-3 text-right">Outstanding Due</th>
                            <th className="py-1.5 px-3 text-right">% Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportsData.byAccount.map((a) => (
                            <tr key={a.paymentAccountId}>
                              <td className="py-1.5 px-3 font-semibold">
                                {a.paymentAccountName}{' '}
                                <span className="font-mono text-slate-400 text-[10px]">({a.paymentAccountCode})</span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">{a.count}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-600">
                                Rs. {a.paidAmount.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-rose-600">
                                Rs. {a.remainingPayable.toLocaleString()}
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
      {/* MODAL 7: PRINTABLE EXPENSE VOUCHER */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Expense Payment Voucher</span>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Body */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-900 bg-white" id="printable-expense-voucher">
              {/* Header */}
              <div className="text-center border-b pb-3 border-dashed border-slate-300">
                <h2 className="text-base font-black tracking-wider uppercase">Everest Family Restaurant</h2>
                <p className="text-[10px] text-slate-500">Hospitality &amp; Dining ERP</p>
                <p className="text-[10px] text-slate-500">Kathmandu, Nepal • PAN: 601234567</p>
                <div className="inline-block px-2 py-0.5 mt-2 rounded bg-slate-100 text-[11px] font-bold tracking-widest uppercase">
                  OFFICIAL EXPENSE PAYMENT VOUCHER
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-1 text-[11px] border-b pb-3 border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voucher #:</span>
                  <span className="font-bold">{selectedTx.voucherNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{new Date(selectedTx.expenseDate).toLocaleDateString()}</span>
                </div>
                {selectedTx.journalEntryNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">GL Journal Entry:</span>
                    <span>{selectedTx.journalEntryNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense Category:</span>
                  <span className="font-bold">{selectedTx.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold uppercase">{selectedTx.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disbursed Via:</span>
                  <span>{selectedTx.paymentAccountName}</span>
                </div>
                {selectedTx.paidTo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid To / Payee:</span>
                    <span className="font-bold">{selectedTx.paidTo}</span>
                  </div>
                )}
                {selectedTx.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference / Bill #:</span>
                    <span>{selectedTx.referenceNumber}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-b pb-3 border-dashed border-slate-300 text-[11px]">
                <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Description:</div>
                <p className="font-sans font-medium">{selectedTx.description}</p>
              </div>

              {/* Total Box */}
              <div className="p-3 rounded bg-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase block">Total Amount:</span>
                  {selectedTx.remainingPayable > 0 && (
                    <span className="text-[10px] text-rose-600 block">
                      Payable Due: Rs. {selectedTx.remainingPayable.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-base font-black">
                  Rs. {selectedTx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">Prepared / Paid By</div>
                <div className="border-t border-slate-300 pt-1">Approved By / Accountant</div>
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


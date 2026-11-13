'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Scale,
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
  Edit2
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  CashAccountRecord,
  CashAccountsSummary,
  CashTransactionItem,
  CashReconciliationRecord
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function CashAccountsTab() {
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CashAccountRecord[]>([]);
  const [summary, setSummary] = useState<CashAccountsSummary>({
    totalCashBalance: 0,
    cashReceived: 0,
    cashPaid: 0,
    todayCashBalance: 0,
  });
  const [branches, setBranches] = useState<string[]>([]);

  // Navigation / View Modes: 'LIST' or 'DETAILS' (Transaction Ledger)
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<CashAccountRecord | null>(null);

  // Filters
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'today' | 'thisMonth' | 'fiscalYear' | 'all'>('thisMonth');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Transaction Ledger State (when in DETAILS mode)
  const [transactions, setTransactions] = useState<CashTransactionItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [ledgerSummary, setLedgerSummary] = useState({
    periodOpeningBalance: 0,
    periodClosingBalance: 0,
    periodCashIn: 0,
    periodCashOut: 0,
    netMovement: 0,
  });

  // Pagination for Accounts List
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsPageSize, setAccountsPageSize] = useState(25);

  // Pagination for Transactions Ledger
  const [txnPage, setTxnPage] = useState(1);
  const [txnPageSize, setTxnPageSize] = useState(25);
  const [totalTxnRecords, setTotalTxnRecords] = useState(0);

  // Modals
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<CashTransactionItem | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Form States - Add Cash Account
  const [newAccName, setNewAccName] = useState('');
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccBranch, setNewAccBranch] = useState('Main Restaurant');
  const [newAccOpening, setNewAccOpening] = useState<number>(0);
  const [newAccDate, setNewAccDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAccEmployee, setNewAccEmployee] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // Form States - Edit Cash Account
  const [editAccId, setEditAccId] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccBranch, setEditAccBranch] = useState('Main Restaurant');
  const [editAccEmployee, setEditAccEmployee] = useState('');
  const [editAccDesc, setEditAccDesc] = useState('');
  const [editAccActive, setEditAccActive] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form States - Cash Receipt
  const [rcptAccountId, setRcptAccountId] = useState('');
  const [rcptDate, setRcptDate] = useState(new Date().toISOString().slice(0, 10));
  const [rcptFrom, setRcptFrom] = useState('');
  const [rcptCategory, setRcptCategory] = useState('Other Income');
  const [rcptAmount, setRcptAmount] = useState<number>(0);
  const [rcptRef, setRcptRef] = useState('');
  const [rcptDesc, setRcptDesc] = useState('');
  const [rcptBranch, setRcptBranch] = useState('Main Restaurant');
  const [rcptBy, setRcptBy] = useState('Cashier In-Charge');
  const [isSubmittingRcpt, setIsSubmittingRcpt] = useState(false);

  // Form States - Cash Payment
  const [pmtAccountId, setPmtAccountId] = useState('');
  const [pmtDate, setPmtDate] = useState(new Date().toISOString().slice(0, 10));
  const [pmtPayee, setPmtPayee] = useState('');
  const [pmtCategory, setPmtCategory] = useState('Operating Expenses');
  const [pmtAmount, setPmtAmount] = useState<number>(0);
  const [pmtRef, setPmtRef] = useState('');
  const [pmtDesc, setPmtDesc] = useState('');
  const [pmtBranch, setPmtBranch] = useState('Main Restaurant');
  const [pmtBy, setPmtBy] = useState('Cashier In-Charge');
  const [isSubmittingPmt, setIsSubmittingPmt] = useState(false);

  // Form States - Cash Transfer (Contra)
  const [xferFromId, setXferFromId] = useState('');
  const [xferToId, setXferToId] = useState('');
  const [xferAmount, setXferAmount] = useState<number>(0);
  const [xferDate, setXferDate] = useState(new Date().toISOString().slice(0, 10));
  const [xferDesc, setXferDesc] = useState('');
  const [xferRef, setXferRef] = useState('');
  const [xferBy, setXferBy] = useState('Finance Manager');
  const [isSubmittingXfer, setIsSubmittingXfer] = useState(false);

  // Form States - Reconciliation
  const [recAccountId, setRecAccountId] = useState('');
  const [recDate, setRecDate] = useState(new Date().toISOString().slice(0, 10));
  const [recPhysicalCash, setRecPhysicalCash] = useState<number>(0);
  const [recExplanation, setRecExplanation] = useState('');
  const [recBy, setRecBy] = useState('Cashier');
  const [recWitness, setRecWitness] = useState('Manager');
  const [recAutoAdjust, setRecAutoAdjust] = useState(true);
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  // Currency Denominations State for Reconciliation
  const [denom, setDenom] = useState<{ [key: string]: number }>({
    '1000': 0,
    '500': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    'coins': 0,
  });

  // Calculate sum of denominations
  const totalDenominations = useMemo(() => {
    return (
      (denom['1000'] || 0) * 1000 +
      (denom['500'] || 0) * 500 +
      (denom['100'] || 0) * 100 +
      (denom['50'] || 0) * 50 +
      (denom['20'] || 0) * 20 +
      (denom['10'] || 0) * 10 +
      (denom['coins'] || 0)
    );
  }, [denom]);

  // Synchronize denominations sum with physical cash count
  useEffect(() => {
    if (totalDenominations > 0) {
      setRecPhysicalCash(totalDenominations);
    }
  }, [totalDenominations]);

  // Date Presets Helper
  const setPresetDates = (preset: 'today' | 'thisMonth' | 'fiscalYear' | 'all') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const today = now.toISOString().slice(0, 10);
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'thisMonth') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setDateFrom(first);
      setDateTo(last);
    } else if (preset === 'fiscalYear') {
      // Assuming April/July fiscal year
      const first = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const last = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      setDateFrom(first);
      setDateTo(last);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Initial load
  useEffect(() => {
    setPresetDates('thisMonth');
  }, []);

  // Fetch Cash Accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getCashAccounts({
        branch: branchFilter !== 'ALL' ? branchFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (res) {
        setAccounts(res.accounts || []);
        setSummary(
          res.summary || {
            totalCashBalance: 0,
            cashReceived: 0,
            cashPaid: 0,
            todayCashBalance: 0,
          }
        );
        if (res.branches?.length) {
          setBranches(res.branches);
        }
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load cash accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [branchFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  // Fetch Ledger Transactions for Selected Account
  const fetchTransactions = async () => {
    if (viewMode !== 'DETAILS') return;
    try {
      setLedgerLoading(true);
      const res = await api.getCashAccountTransactions(selectedAccountId, {
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
        type: txnTypeFilter !== 'ALL' ? txnTypeFilter : undefined,
        search: txnSearchQuery || undefined,
        page: txnPage,
        pageSize: txnPageSize,
      });

      if (res) {
        setTransactions(res.transactions || []);
        setTotalTxnRecords(res.totalRecords || 0);
        setLedgerSummary({
          periodOpeningBalance: res.periodOpeningBalance || 0,
          periodClosingBalance: res.periodClosingBalance || 0,
          periodCashIn: res.periodCashIn || 0,
          periodCashOut: res.periodCashOut || 0,
          netMovement: res.netMovement || 0,
        });
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load transaction history.');
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'DETAILS') {
      fetchTransactions();
    }
  }, [viewMode, selectedAccountId, dateFrom, dateTo, txnTypeFilter, txnSearchQuery, txnPage, txnPageSize]);

  // Handle Opening an Account for Details
  const handleOpenAccountDetails = async (accId: string) => {
    setSelectedAccountId(accId);
    if (accId === 'ALL') {
      setSelectedAccount({
        id: 'ALL',
        accountName: 'All Cash Accounts (Consolidated)',
        accountCode: '1000-CASH',
        branchOrOutlet: 'All Outlets',
        accountType: 'Cash & Cash Equivalents',
        openingBalance: accounts.reduce((acc, a) => acc + a.openingBalance, 0),
        currentBalance: summary.totalCashBalance,
        totalCashIn: summary.cashReceived,
        totalCashOut: summary.cashPaid,
        todayCashIn: 0,
        todayCashOut: 0,
        responsibleEmployee: 'Finance Team',
        isActive: true,
      });
    } else {
      const found = accounts.find((a) => a.id === accId);
      if (found) {
        setSelectedAccount(found);
      }
    }
    setViewMode('DETAILS');
    setTxnPage(1);
  };

  // Helper currency format
  const formatCur = (num?: number | null) => {
    return (num ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handlers for Operations
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      toastError('Account name is required.');
      return;
    }
    try {
      setIsSubmittingAccount(true);
      await api.createCashAccount({
        accountName: newAccName.trim(),
        accountCode: newAccCode.trim() || undefined,
        branchOrOutlet: newAccBranch,
        openingBalance: Number(newAccOpening) || 0,
        openingBalanceDate: newAccDate,
        responsibleEmployee: newAccEmployee.trim() || undefined,
        description: newAccDesc.trim() || undefined,
        isActive: true,
      });
      success('Cash account created successfully.');
      setIsAddAccountModalOpen(false);
      setNewAccName('');
      setNewAccCode('');
      setNewAccOpening(0);
      setNewAccDesc('');
      fetchAccounts();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create cash account.');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccName.trim()) return;
    try {
      setIsSubmittingEdit(true);
      await api.updateCashAccount(editAccId, {
        accountName: editAccName.trim(),
        branchOrOutlet: editAccBranch,
        responsibleEmployee: editAccEmployee.trim(),
        description: editAccDesc.trim(),
        isActive: editAccActive,
      });
      success('Cash account updated successfully.');
      setIsEditAccountModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update cash account.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRecordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcptAccountId) {
      toastError('Please select a destination cash account.');
      return;
    }
    if (rcptAmount <= 0) {
      toastError('Receipt amount must be greater than zero.');
      return;
    }
    try {
      setIsSubmittingRcpt(true);
      await api.recordCashReceipt({
        accountId: rcptAccountId,
        date: rcptDate,
        receivedFrom: rcptFrom.trim() || 'Customer / Guest',
        category: rcptCategory,
        amount: Number(rcptAmount),
        referenceNumber: rcptRef.trim() || undefined,
        description: rcptDesc.trim() || undefined,
        branch: rcptBranch,
        receivedBy: rcptBy.trim() || undefined,
      });
      success('Cash receipt posted successfully.');
      setIsReceiptModalOpen(false);
      setRcptAmount(0);
      setRcptFrom('');
      setRcptRef('');
      setRcptDesc('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post cash receipt.');
    } finally {
      setIsSubmittingRcpt(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtAccountId) {
      toastError('Please select a cash account.');
      return;
    }
    if (pmtAmount <= 0) {
      toastError('Payment amount must be greater than zero.');
      return;
    }
    try {
      setIsSubmittingPmt(true);
      await api.recordCashPayment({
        accountId: pmtAccountId,
        date: pmtDate,
        payee: pmtPayee.trim() || 'Vendor / Payee',
        category: pmtCategory,
        amount: Number(pmtAmount),
        referenceNumber: pmtRef.trim() || undefined,
        description: pmtDesc.trim() || undefined,
        branch: pmtBranch,
        paidBy: pmtBy.trim() || undefined,
      });
      success('Cash payment voucher posted successfully.');
      setIsPaymentModalOpen(false);
      setPmtAmount(0);
      setPmtPayee('');
      setPmtRef('');
      setPmtDesc('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post cash payment.');
    } finally {
      setIsSubmittingPmt(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xferFromId || !xferToId) {
      toastError('Please select both source and destination accounts.');
      return;
    }
    if (xferFromId === xferToId) {
      toastError('Source and destination accounts must be distinct.');
      return;
    }
    if (xferAmount <= 0) {
      toastError('Transfer amount must be greater than zero.');
      return;
    }
    try {
      setIsSubmittingXfer(true);
      await api.transferCash({
        fromAccountId: xferFromId,
        toAccountId: xferToId,
        amount: Number(xferAmount),
        date: xferDate,
        description: xferDesc.trim() || undefined,
        reference: xferRef.trim() || undefined,
        transferredBy: xferBy.trim() || undefined,
      });
      success('Cash transfer recorded successfully.');
      setIsTransferModalOpen(false);
      setXferAmount(0);
      setXferDesc('');
      setXferRef('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to transfer cash.');
    } finally {
      setIsSubmittingXfer(false);
    }
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recAccountId) {
      toastError('Please select a cash account to reconcile.');
      return;
    }
    try {
      setIsSubmittingRec(true);
      await api.reconcileCash({
        accountId: recAccountId,
        reconciliationDate: recDate,
        actualCountedCash: Number(recPhysicalCash),
        explanation: recExplanation.trim() || undefined,
        denominationsJson: JSON.stringify(denom),
        reconciledBy: recBy.trim() || 'Cashier',
        witnessManager: recWitness.trim() || undefined,
        autoApproveAdjustment: recAutoAdjust,
      });
      success('Cash count reconciliation submitted successfully.');
      setIsReconcileModalOpen(false);
      setRecPhysicalCash(0);
      setRecExplanation('');
      setDenom({ '1000': 0, '500': 0, '100': 0, '50': 0, '20': 0, '10': 0, coins: 0 });
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to submit reconciliation.');
    } finally {
      setIsSubmittingRec(false);
    }
  };

  // Helper to open Edit Modal
  const openEditModal = (acc: CashAccountRecord) => {
    setEditAccId(acc.id);
    setEditAccName(acc.accountName);
    setEditAccBranch(acc.branchOrOutlet || 'Main Restaurant');
    setEditAccEmployee(acc.responsibleEmployee || '');
    setEditAccDesc(acc.description || '');
    setEditAccActive(acc.isActive);
    setIsEditAccountModalOpen(true);
  };

  // Quick Open Modal Helpers with Pre-selected Account
  const openReceiptWithAccount = (accId?: string) => {
    setRcptAccountId(accId || accounts[0]?.id || '');
    setIsReceiptModalOpen(true);
  };

  const openPaymentWithAccount = (accId?: string) => {
    setPmtAccountId(accId || accounts[0]?.id || '');
    setIsPaymentModalOpen(true);
  };

  const openTransferWithAccount = (accId?: string) => {
    setXferFromId(accId || accounts[0]?.id || '');
    setXferToId(accounts.find((a) => a.id !== accId)?.id || '');
    setIsTransferModalOpen(true);
  };

  const openReconcileWithAccount = (accId?: string) => {
    setRecAccountId(accId || accounts[0]?.id || '');
    setIsReconcileModalOpen(true);
  };

  // Filtered Accounts for Table Presentation
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (branchFilter !== 'ALL' && acc.branchOrOutlet !== branchFilter) return false;
      if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        if (acc.isActive !== isActive) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !acc.accountName.toLowerCase().includes(q) &&
          !acc.accountCode.toLowerCase().includes(q) &&
          !(acc.responsibleEmployee || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [accounts, branchFilter, statusFilter, searchQuery]);

  // Paginated accounts for List view
  const paginatedAccounts = useMemo(() => {
    const start = (accountsPage - 1) * accountsPageSize;
    return filteredAccounts.slice(start, start + accountsPageSize);
  }, [filteredAccounts, accountsPage, accountsPageSize]);

  const totalAccountPages = Math.ceil(filteredAccounts.length / accountsPageSize) || 1;

  // Selected Account in Reconcile Modal for Difference Preview
  const selectedReconAccount = accounts.find((a) => a.id === recAccountId);
  const reconDifference = selectedReconAccount
    ? Number((recPhysicalCash - selectedReconAccount.currentBalance).toFixed(2))
    : 0;

  // Export to CSV
  const handleExportCSV = () => {
    if (viewMode === 'LIST') {
      const headers = ['Account Code', 'Account Name', 'Branch / Outlet', 'Opening Balance', 'Cash In', 'Cash Out', 'Current Balance', 'Status'];
      const rows = filteredAccounts.map((a) => [
        a.accountCode,
        `"${a.accountName}"`,
        `"${a.branchOrOutlet}"`,
        a.openingBalance,
        a.totalCashIn,
        a.totalCashOut,
        a.currentBalance,
        a.isActive ? 'Active' : 'Inactive',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Cash_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Date', 'Reference #', 'Type', 'Description', 'Cash In (Dr)', 'Cash Out (Cr)', 'Running Balance', 'Created By'];
      const rows = transactions.map((t) => [
        new Date(t.date).toLocaleString(),
        `"${t.referenceNumber}"`,
        `"${t.transactionType}"`,
        `"${t.description}"`,
        t.cashIn,
        t.cashOut,
        t.runningBalance,
        `"${t.createdBy}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Cash_Ledger_${selectedAccountId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton
            href="/accounts"
            label="Back"
            onClick={viewMode === 'DETAILS' ? () => setViewMode('LIST') : undefined}
          />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Cash Accounts</span>
            {viewMode === 'DETAILS' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                {selectedAccount?.accountName || 'Ledger'}
              </span>
            )}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'LIST' && (
            <button
              type="button"
              onClick={() => setIsAddAccountModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[#0B3D32] text-white dark:bg-emerald-600 hover:bg-[#082d25] dark:hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Add Cash Account</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openReceiptWithAccount()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Cash Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => openPaymentWithAccount()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Cash Payment</span>
          </button>

          <button
            type="button"
            onClick={() => openTransferWithAccount()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Cash Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => openReconcileWithAccount()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center gap-1.5 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Reconcile Cash</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.25]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchAccounts();
              if (viewMode === 'DETAILS') fetchTransactions();
            }}
            className="p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[1.25]" />
          </button>
        </div>
      </div>

      {/* 3. Filters & Quick Selection Bar */}
      <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-3">
        {/* Date presets & Custom Date Range */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
            {(['today', 'thisMonth', 'fiscalYear', 'all'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPresetDates(preset)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                  datePreset === preset
                    ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'thisMonth' && 'This Month'}
                {preset === 'fiscalYear' && 'Fiscal Year'}
                {preset === 'all' && 'All Time'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDatePreset('all');
              }}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDatePreset('all');
              }}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              title="To Date"
            />
          </div>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Branch / Outlet Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setAccountsPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
            >
              <option value="ALL">All Branches &amp; Outlets</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter (when in Details or List) */}
          <div>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  handleOpenAccountDetails('ALL');
                } else {
                  handleOpenAccountDetails(val);
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
            >
              <option value="ALL">All Cash Accounts (Consolidated)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountCode} - {a.accountName} (Rs. {formatCur(a.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setAccountsPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={viewMode === 'LIST' ? searchQuery : txnSearchQuery}
              onChange={(e) => {
                if (viewMode === 'LIST') {
                  setSearchQuery(e.target.value);
                  setAccountsPage(1);
                } else {
                  setTxnSearchQuery(e.target.value);
                  setTxnPage(1);
                }
              }}
              placeholder={viewMode === 'LIST' ? 'Search cash account name or code...' : 'Search voucher, particulars, cashier...'}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {viewMode === 'LIST' ? (
        /* ======================== ACCOUNTS LIST TABLE ======================== */
        <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cash Accounts Register
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAccountDetails('ALL')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>View Consolidated Cash Book</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Account Name</th>
                  <th className="px-3 py-2.5">Account Code</th>
                  <th className="px-3 py-2.5">Branch / Outlet</th>
                  <th className="px-3 py-2.5 text-right">Opening Balance</th>
                  <th className="px-3 py-2.5 text-right">Total Cash In</th>
                  <th className="px-3 py-2.5 text-right">Total Cash Out</th>
                  <th className="px-3 py-2.5 text-right">Current Balance</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Loading cash accounts...
                    </td>
                  </tr>
                ) : paginatedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No cash accounts found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[1.25]" />
                        <button
                          type="button"
                          onClick={() => handleOpenAccountDetails(acc.id)}
                          className="hover:text-emerald-600 hover:underline text-left"
                        >
                          {acc.accountName}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                          {acc.accountCode}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {acc.branchOrOutlet || 'Main Restaurant'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                        Rs. {formatCur(acc.openingBalance)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        + Rs. {formatCur(acc.totalCashIn)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        - Rs. {formatCur(acc.totalCashOut)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                        Rs. {formatCur(acc.currentBalance)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {acc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAccountDetails(acc.id)}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="View Transaction History"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReceiptWithAccount(acc.id)}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                            title="Receive Cash"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPaymentWithAccount(acc.id)}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                            title="Pay Cash"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openTransferWithAccount(acc.id)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                            title="Transfer Cash"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openReconcileWithAccount(acc.id)}
                            className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded"
                            title="Reconcile Cash"
                          >
                            <Scale className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(acc)}
                            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom-right DataTables Pagination for Accounts */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {filteredAccounts.length > 0 ? (accountsPage - 1) * accountsPageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min(accountsPage * accountsPageSize, filteredAccounts.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredAccounts.length}</span> cash accounts
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows:</span>
                <select
                  value={accountsPageSize}
                  onChange={(e) => {
                    setAccountsPageSize(Number(e.target.value));
                    setAccountsPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={accountsPage <= 1}
                  onClick={() => setAccountsPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                  {accountsPage} / {totalAccountPages}
                </span>
                <button
                  type="button"
                  disabled={accountsPage >= totalAccountPages}
                  onClick={() => setAccountsPage((p) => Math.min(totalAccountPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== TRANSACTION HISTORY (DETAILS VIEW) ======================== */
        <div className="space-y-4">
          {/* Account Details Header Card */}
          <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedAccount?.accountName}
                </h3>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedAccount?.accountCode}
                </span>
                <span className="text-xs text-slate-500">• {selectedAccount?.branchOrOutlet}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Responsible: {selectedAccount?.responsibleEmployee || 'Cashier In-Charge'}
              </div>
            </div>

            {/* Quick Metrics for the Account */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Opening Balance</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Rs. {formatCur(ledgerSummary.periodOpeningBalance)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Cash In (Period)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  + Rs. {formatCur(ledgerSummary.periodCashIn)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Cash Out (Period)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  - Rs. {formatCur(ledgerSummary.periodCashOut)}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Current Balance</span>
                <span className="text-sm font-black text-[#0B3D32] dark:text-emerald-400">
                  Rs. {formatCur(ledgerSummary.periodClosingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Type Filter for Ledger */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 dark:text-slate-400">Filter Type:</span>
              {[
                { id: 'ALL', label: 'All Transactions' },
                { id: 'POS_CASH_SALE', label: 'POS Sales' },
                { id: 'CASH_RECEIPT', label: 'Receipts' },
                { id: 'CASH_PAYMENT', label: 'Payments' },
                { id: 'SUPPLIER_PAYMENT', label: 'Supplier Payments' },
                { id: 'PETTY_CASH_EXPENSE', label: 'Petty Expenses' },
                { id: 'CASH_TRANSFER', label: 'Transfers' },
                { id: 'RECONCILIATION_ADJUSTMENT', label: 'Adjustments' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTxnTypeFilter(t.id);
                    setTxnPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    txnTypeFilter === t.id
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Reference #</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Description</th>
                    {selectedAccountId === 'ALL' && <th className="px-3 py-2.5">Account</th>}
                    <th className="px-3 py-2.5 text-right">Cash In (Dr)</th>
                    <th className="px-3 py-2.5 text-right">Cash Out (Cr)</th>
                    <th className="px-3 py-2.5 text-right">Running Balance</th>
                    <th className="px-3 py-2.5">Source Module</th>
                    <th className="px-3 py-2.5">Created By</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Loading transaction history...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString()}{' '}
                          <span className="text-slate-400 text-[10px]">
                            {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {t.referenceNumber}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.transactionType.includes('SALE') || t.transactionType.includes('RECEIPT')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : t.transactionType.includes('PAYMENT') || t.transactionType.includes('EXPENSE')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : t.transactionType.includes('TRANSFER')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {t.transactionType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={t.description}>
                          {t.description}
                        </td>
                        {selectedAccountId === 'ALL' && (
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-[11px]">
                            {t.accountName}
                          </td>
                        )}
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.cashIn > 0 ? `+ Rs. ${formatCur(t.cashIn)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.cashOut > 0 ? `- Rs. ${formatCur(t.cashOut)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-black text-slate-900 dark:text-white">
                          Rs. {formatCur(t.runningBalance)}
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">
                          {t.sourceModule}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-[11px]">
                          {t.createdBy}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTxn(t);
                              setIsVoucherModalOpen(true);
                            }}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="View Voucher Drilldown"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom-right DataTables Pagination for Transactions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {totalTxnRecords > 0 ? (txnPage - 1) * txnPageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(txnPage * txnPageSize, totalTxnRecords)}
                </span>{' '}
                of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalTxnRecords}</span> entries
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Rows:</span>
                  <select
                    value={txnPageSize}
                    onChange={(e) => {
                      setTxnPageSize(Number(e.target.value));
                      setTxnPage(1);
                    }}
                    className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={txnPage <= 1}
                    onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                    {txnPage} / {Math.ceil(totalTxnRecords / txnPageSize) || 1}
                  </span>
                  <button
                    type="button"
                    disabled={txnPage >= Math.ceil(totalTxnRecords / txnPageSize)}
                    onClick={() => setTxnPage((p) => Math.min(Math.ceil(totalTxnRecords / txnPageSize), p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== 5. MODALS & WORKFLOWS ======================== */}

      {/* MODAL 1: ADD CASH ACCOUNT */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Create New Cash Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bar POS Cash Drawer, Manager Safe"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. 1025)"
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet *
                  </label>
                  <select
                    value={newAccBranch}
                    onChange={(e) => setNewAccBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="Main Restaurant">Main Restaurant</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Central Kitchen">Central Kitchen</option>
                    <option value="Bar">Bar</option>
                    <option value="Manager Safe">Manager Safe</option>
                    <option value="Central Store">Central Store</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Float / Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAccOpening || ''}
                    onChange={(e) => setNewAccOpening(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Date
                  </label>
                  <input
                    type="date"
                    value={newAccDate}
                    onChange={(e) => setNewAccDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Responsible Employee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Thapa (Head Cashier)"
                  value={newAccEmployee}
                  onChange={(e) => setNewAccEmployee(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Register notes or physical location..."
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAccount}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] dark:bg-emerald-600 text-white font-bold hover:bg-[#082d25] disabled:opacity-50"
                >
                  {isSubmittingAccount ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CASH ACCOUNT */}
      {isEditAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Edit Cash Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleEditAccount} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch / Outlet
                </label>
                <input
                  type="text"
                  value={editAccBranch}
                  onChange={(e) => setEditAccBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Responsible Employee
                </label>
                <input
                  type="text"
                  value={editAccEmployee}
                  onChange={(e) => setEditAccEmployee(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editAccDesc}
                  onChange={(e) => setEditAccDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAccActive"
                  checked={editAccActive}
                  onChange={(e) => setEditAccActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editAccActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account is Active &amp; Ready for Transactions
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditAccountModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] dark:bg-emerald-600 text-white font-bold hover:bg-[#082d25] disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CASH RECEIPT */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Record Cash Receipt</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleRecordReceipt} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Cash Account *
                  </label>
                  <select
                    value={rcptAccountId}
                    onChange={(e) => setRcptAccountId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Cash Account</option>
                    {accounts.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={rcptDate}
                    onChange={(e) => setRcptDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Received From *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Guest, Customer, or Partner name"
                    value={rcptFrom}
                    onChange={(e) => setRcptFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Category *
                  </label>
                  <select
                    value={rcptCategory}
                    onChange={(e) => setRcptCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="Other Income">Other Income / Miscellaneous</option>
                    <option value="Customer Payment">Customer Payment (Non-POS Direct)</option>
                    <option value="Supplier Refund">Supplier Refund</option>
                    <option value="Owner / Capital Contribution">Owner / Capital Contribution</option>
                    <option value="Cash In / Float Top-up">Cash In / Float Top-up</option>
                    <option value="Other Approved Receipts">Other Approved Receipts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Received (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={rcptAmount || ''}
                    onChange={(e) => setRcptAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Bill # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-1029, CHQ-882"
                    value={rcptRef}
                    onChange={(e) => setRcptRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet
                  </label>
                  <input
                    type="text"
                    value={rcptBranch}
                    onChange={(e) => setRcptBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Received By
                  </label>
                  <input
                    type="text"
                    value={rcptBy}
                    onChange={(e) => setRcptBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Particulars
                </label>
                <textarea
                  rows={2}
                  placeholder="Narration of the receipt transaction..."
                  value={rcptDesc}
                  onChange={(e) => setRcptDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRcpt}
                  className="px-4 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingRcpt ? 'Posting...' : 'Post Cash Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CASH PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600 stroke-[1.25]" />
                <span>Record Cash Payment Voucher</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursing Cash Account *
                  </label>
                  <select
                    value={pmtAccountId}
                    onChange={(e) => setPmtAccountId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Cash Account</option>
                    {accounts.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName} (Avail: Rs. {formatCur(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pmtDate}
                    onChange={(e) => setPmtDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paid To / Payee *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vendor, staff, or service provider"
                    value={pmtPayee}
                    onChange={(e) => setPmtPayee(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Category *
                  </label>
                  <select
                    value={pmtCategory}
                    onChange={(e) => setPmtCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="Operating Expenses">Operating &amp; Kitchen Supplies</option>
                    <option value="Petty Cash Expenses">Petty Cash Daily Expenses</option>
                    <option value="Supplier Payments">Supplier Cash Payment</option>
                    <option value="Utilities">Electricity &amp; Utilities</option>
                    <option value="Repairs & Maintenance">Repairs &amp; Maintenance</option>
                    <option value="Staff Payments">Staff Advance / Wage Payment</option>
                    <option value="Other Approved Payments">Other Approved Payments</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={pmtAmount || ''}
                    onChange={(e) => setPmtAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-rose-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Bill # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-920, VOUCH-11"
                    value={pmtRef}
                    onChange={(e) => setPmtRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet
                  </label>
                  <input
                    type="text"
                    value={pmtBranch}
                    onChange={(e) => setPmtBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paid By
                  </label>
                  <input
                    type="text"
                    value={pmtBy}
                    onChange={(e) => setPmtBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Particulars
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of the payment voucher..."
                  value={pmtDesc}
                  onChange={(e) => setPmtDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPmt}
                  className="px-4 py-1.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingPmt ? 'Posting...' : 'Post Cash Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CASH TRANSFER (CONTRA ENTRY) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 stroke-[1.25]" />
                <span>Internal Cash Transfer (Contra Entry)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-[11px] text-blue-800 dark:text-blue-300">
                Transfers move cash between physical accounts (e.g. POS Register to Safe). Total restaurant cash remains unchanged.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    From Cash Account *
                  </label>
                  <select
                    value={xferFromId}
                    onChange={(e) => setXferFromId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Source Account</option>
                    {accounts.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName} (Avail: Rs. {formatCur(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Cash Account *
                  </label>
                  <select
                    value={xferToId}
                    onChange={(e) => setXferToId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Destination Account</option>
                    {accounts.filter((a) => a.isActive && a.id !== xferFromId).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={xferAmount || ''}
                    onChange={(e) => setXferAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-blue-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={xferDate}
                    onChange={(e) => setXferDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transferred By
                  </label>
                  <input
                    type="text"
                    value={xferBy}
                    onChange={(e) => setXferBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Bag # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BAG-01, DROP-05"
                    value={xferRef}
                    onChange={(e) => setXferRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cash drop from Restaurant POS to Main Safe"
                  value={xferDesc}
                  onChange={(e) => setXferDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingXfer}
                  className="px-4 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingXfer ? 'Transferring...' : 'Execute Cash Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CASH RECONCILIATION & PHYSICAL COUNT */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-600 stroke-[1.25]" />
                <span>Physical Cash Count &amp; Reconciliation</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleReconcile} className="p-4 space-y-3 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cash Account *
                  </label>
                  <select
                    value={recAccountId}
                    onChange={(e) => setRecAccountId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Cash Account</option>
                    {accounts.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reconciliation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              {/* System vs Counted Comparison Box */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">System Balance</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Rs. {formatCur(selectedReconAccount?.currentBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">Actual Counted</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    Rs. {formatCur(recPhysicalCash)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500 block">Difference</span>
                  <span
                    className={`font-black ${
                      reconDifference === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : reconDifference < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {reconDifference > 0 ? '+' : ''}Rs. {formatCur(reconDifference)}
                  </span>
                </div>
              </div>

              {/* Denomination Counter Accordion/Grid */}
              <div className="border border-slate-200 dark:border-slate-800 rounded p-2.5 bg-white dark:bg-[#071F1A]">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Currency Denomination Calculator (Counts)
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
                  {[
                    { key: '1000', label: 'Rs. 1,000' },
                    { key: '500', label: 'Rs. 500' },
                    { key: '100', label: 'Rs. 100' },
                    { key: '50', label: 'Rs. 50' },
                    { key: '20', label: 'Rs. 20' },
                    { key: '10', label: 'Rs. 10' },
                    { key: 'coins', label: 'Coins (Total)' },
                  ].map((d) => (
                    <div key={d.key}>
                      <span className="text-[10px] font-sans text-slate-500 block">{d.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={denom[d.key] || ''}
                        onChange={(e) =>
                          setDenom({ ...denom, [d.key]: parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Physical Cash Override */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Counted Cash (Rs.) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={recPhysicalCash || ''}
                  onChange={(e) => setRecPhysicalCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-sm text-purple-600"
                />
              </div>

              {reconDifference !== 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Explanation / Reason for Discrepancy *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide detailed explanation for cashier discrepancy or shortage/overage..."
                    value={recExplanation}
                    onChange={(e) => setRecExplanation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reconciled By
                  </label>
                  <input
                    type="text"
                    value={recBy}
                    onChange={(e) => setRecBy(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Witness / Manager
                  </label>
                  <input
                    type="text"
                    value={recWitness}
                    onChange={(e) => setRecWitness(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recAutoAdjust"
                  checked={recAutoAdjust}
                  onChange={(e) => setRecAutoAdjust(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="recAutoAdjust" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Automatically post accounting adjustment if discrepancy exists
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRec}
                  className="px-4 py-1.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmittingRec ? 'Reconciling...' : 'Submit Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: VOUCHER DRILLDOWN MODAL */}
      {isVoucherModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Transaction Voucher Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference / Voucher</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTxn.referenceNumber}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedTxn.transactionType.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date &amp; Time</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(selectedTxn.date).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Account</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedTxn.accountName}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Particulars / Description</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedTxn.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono py-2 bg-slate-50 dark:bg-slate-900/40 rounded">
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Cash In (Dr)</span>
                  <span className="font-bold text-emerald-600">
                    {selectedTxn.cashIn > 0 ? `Rs. ${formatCur(selectedTxn.cashIn)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Cash Out (Cr)</span>
                  <span className="font-bold text-rose-600">
                    {selectedTxn.cashOut > 0 ? `Rs. ${formatCur(selectedTxn.cashOut)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Running Balance</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    Rs. {formatCur(selectedTxn.runningBalance)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-500 text-[11px] pt-1">
                <div>
                  <span className="font-bold">Source Module:</span> {selectedTxn.sourceModule}
                </div>
                <div>
                  <span className="font-bold">Created By:</span> {selectedTxn.createdBy}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] dark:bg-emerald-600 text-white font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

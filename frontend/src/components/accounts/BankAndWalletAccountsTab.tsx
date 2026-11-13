'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Landmark,
  Smartphone,
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
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Scale
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  BankWalletAccountRecord,
  BankWalletSummary,
  BankWalletTransactionItem
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function BankAndWalletAccountsTab() {
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankWalletAccountRecord[]>([]);
  const [digitalWallets, setDigitalWallets] = useState<BankWalletAccountRecord[]>([]);
  const [summary, setSummary] = useState<BankWalletSummary>({
    totalAccountBalance: 0,
    totalBankBalance: 0,
    totalWalletBalance: 0,
  });
  const [branches, setBranches] = useState<string[]>([]);

  // Active Tab: 'BANK' or 'WALLET'
  const [activeTab, setActiveTab] = useState<'BANK' | 'WALLET'>('BANK');

  // Navigation / View Modes: 'LIST' or 'DETAILS' (Transaction Ledger)
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<BankWalletAccountRecord | null>(null);

  // Filters
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<'today' | 'thisMonth' | 'fiscalYear' | 'all'>('thisMonth');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Transaction Ledger State (when in DETAILS mode)
  const [transactions, setTransactions] = useState<BankWalletTransactionItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [ledgerSummary, setLedgerSummary] = useState({
    periodOpeningBalance: 0,
    periodClosingBalance: 0,
    periodIn: 0,
    periodOut: 0,
    netMovement: 0,
  });

  // Pagination for Bank Accounts
  const [bankPage, setBankPage] = useState(1);
  const [bankPageSize, setBankPageSize] = useState(25);

  // Pagination for Digital Wallets
  const [walletPage, setWalletPage] = useState(1);
  const [walletPageSize, setWalletPageSize] = useState(25);

  // Pagination for Transactions Ledger
  const [txnPage, setTxnPage] = useState(1);
  const [txnPageSize, setTxnPageSize] = useState(25);
  const [totalTxnRecords, setTotalTxnRecords] = useState(0);

  // Modals
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<BankWalletTransactionItem | null>(null);

  // Form States - Add Account
  const [modalAccountType, setModalAccountType] = useState<'BANK' | 'WALLET'>('BANK');
  const [addAccName, setAddAccName] = useState('');
  const [addAccCode, setAddAccCode] = useState('');
  const [addAccOpening, setAddAccOpening] = useState<number>(0);
  const [addAccDate, setAddAccDate] = useState(new Date().toISOString().slice(0, 10));
  const [addAccBranch, setAddAccBranch] = useState('Kathmandu Main');
  const [addAccNotes, setAddAccNotes] = useState('');
  // Bank fields
  const [addBankName, setAddBankName] = useState('Nabil Bank');
  const [addAccNumber, setAddAccNumber] = useState('');
  const [addAccHolder, setAddAccHolder] = useState('Everest Family Restaurant Pvt. Ltd.');
  // Wallet fields
  const [addWalletProvider, setAddWalletProvider] = useState('eSewa');
  const [addMerchantId, setAddMerchantId] = useState('');
  const [addMobileNumber, setAddMobileNumber] = useState('');
  const [addSettlementBankId, setAddSettlementBankId] = useState('');
  const [addDirectBankSettlement, setAddDirectBankSettlement] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form States - Edit Account
  const [editAccId, setEditAccId] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccBranch, setEditAccBranch] = useState('Kathmandu Main');
  const [editAccNotes, setEditAccNotes] = useState('');
  const [editAccActive, setEditAccActive] = useState(true);
  const [editBankName, setEditBankName] = useState('');
  const [editAccNumber, setEditAccNumber] = useState('');
  const [editAccHolder, setEditAccHolder] = useState('');
  const [editWalletProvider, setEditWalletProvider] = useState('eSewa');
  const [editMerchantId, setEditMerchantId] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editDirectBankSettlement, setEditDirectBankSettlement] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form States - Wallet Settlement
  const [stlmWalletId, setStlmWalletId] = useState('');
  const [stlmBankId, setStlmBankId] = useState('');
  const [stlmGross, setStlmGross] = useState<number>(0);
  const [stlmCharges, setStlmCharges] = useState<number>(0);
  const [stlmDate, setStlmDate] = useState(new Date().toISOString().slice(0, 10));
  const [stlmRef, setStlmRef] = useState('');
  const [stlmBankRef, setStlmBankRef] = useState('');
  const [stlmDesc, setStlmDesc] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  // Form States - Transfer
  const [xferFromId, setXferFromId] = useState('');
  const [xferToId, setXferToId] = useState('');
  const [xferAmount, setXferAmount] = useState<number>(0);
  const [xferDate, setXferDate] = useState(new Date().toISOString().slice(0, 10));
  const [xferRef, setXferRef] = useState('');
  const [xferDesc, setXferDesc] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Form States - Record Charge
  const [chgAccountId, setChgAccountId] = useState('');
  const [chgAmount, setChgAmount] = useState<number>(0);
  const [chgDate, setChgDate] = useState(new Date().toISOString().slice(0, 10));
  const [chgType, setChgType] = useState('Bank Service Charge');
  const [chgRef, setChgRef] = useState('');
  const [chgDesc, setChgDesc] = useState('');
  const [isSubmittingCharge, setIsSubmittingCharge] = useState(false);

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
      const first = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const last = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      setDateFrom(first);
      setDateTo(last);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  useEffect(() => {
    setPresetDates('thisMonth');
  }, []);

  // Fetch Accounts Overview
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getBankWalletAccounts({
        type: 'ALL',
        provider: activeTab === 'WALLET' && providerFilter !== 'ALL' ? providerFilter : undefined,
        branch: branchFilter !== 'ALL' ? branchFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (res) {
        setBankAccounts(res.bankAccounts || []);
        setDigitalWallets(res.digitalWallets || []);
        setSummary(
          res.summary || {
            totalAccountBalance: 0,
            totalBankBalance: 0,
            totalWalletBalance: 0,
          }
        );
        if (res.branches?.length) {
          setBranches(res.branches);
        }
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load bank & wallet accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeTab, branchFilter, providerFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  // Fetch Ledger Transactions for Selected Account
  const fetchTransactions = async () => {
    if (viewMode !== 'DETAILS' || !selectedAccountId) return;
    try {
      setLedgerLoading(true);
      const res = await api.getBankWalletAccountTransactions(selectedAccountId, {
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
          periodIn: res.periodIn || 0,
          periodOut: res.periodOut || 0,
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
  const handleOpenAccountDetails = (acc: BankWalletAccountRecord) => {
    setSelectedAccountId(acc.id);
    setSelectedAccount(acc);
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
    if (!addAccName.trim()) {
      toastError('Account name is required.');
      return;
    }
    try {
      setIsSubmittingAdd(true);
      await api.createBankWalletAccount({
        accountName: addAccName.trim(),
        accountType: modalAccountType,
        accountCode: addAccCode.trim() || undefined,
        openingBalance: Number(addAccOpening) || 0,
        openingDate: addAccDate,
        branch: addAccBranch,
        notes: addAccNotes.trim() || undefined,
        isActive: true,
        // Bank
        bankName: modalAccountType === 'BANK' ? addBankName.trim() : undefined,
        accountNumber: modalAccountType === 'BANK' ? addAccNumber.trim() : undefined,
        accountHolderName: modalAccountType === 'BANK' ? addAccHolder.trim() : undefined,
        // Wallet
        walletProvider: modalAccountType === 'WALLET' ? addWalletProvider : undefined,
        merchantId: modalAccountType === 'WALLET' ? addMerchantId.trim() : undefined,
        registeredMobileNumber: modalAccountType === 'WALLET' ? addMobileNumber.trim() : undefined,
        settlementBankAccountId: modalAccountType === 'WALLET' ? addSettlementBankId || undefined : undefined,
        directBankSettlement: modalAccountType === 'WALLET' && addDirectBankSettlement,
      });
      success(`${modalAccountType === 'BANK' ? 'Bank' : 'Digital Wallet'} account created successfully.`);
      setIsAddAccountModalOpen(false);
      setAddAccName('');
      setAddAccCode('');
      setAddAccOpening(0);
      setAddAccNumber('');
      setAddMerchantId('');
      setAddMobileNumber('');
      fetchAccounts();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccName.trim()) return;
    try {
      setIsSubmittingEdit(true);
      await api.updateBankWalletAccount(editAccId, {
        accountName: editAccName.trim(),
        branch: editAccBranch,
        notes: editAccNotes.trim() || undefined,
        isActive: editAccActive,
        bankName: editBankName.trim() || undefined,
        accountNumber: editAccNumber.trim() || undefined,
        accountHolderName: editAccHolder.trim() || undefined,
        walletProvider: editWalletProvider,
        merchantId: editMerchantId.trim() || undefined,
        registeredMobileNumber: editMobileNumber.trim() || undefined,
        directBankSettlement: editDirectBankSettlement,
      });
      success('Account updated successfully.');
      setIsEditAccountModalOpen(false);
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update account.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stlmWalletId || !stlmBankId) {
      toastError('Please select both wallet and destination bank accounts.');
      return;
    }
    if (stlmGross <= 0) {
      toastError('Gross settlement amount must be greater than zero.');
      return;
    }
    try {
      setIsSubmittingSettlement(true);
      await api.recordWalletSettlement({
        walletAccountId: stlmWalletId,
        destinationBankAccountId: stlmBankId,
        grossAmount: Number(stlmGross),
        walletCharges: Number(stlmCharges) || 0,
        otherDeductions: 0,
        settlementDate: stlmDate,
        settlementReference: stlmRef.trim() || `PAYOUT-${Date.now().toString().slice(-6)}`,
        bankReference: stlmBankRef.trim() || undefined,
        description: stlmDesc.trim() || undefined,
      });
      success('Wallet settlement posted to bank account successfully.');
      setIsSettlementModalOpen(false);
      setStlmGross(0);
      setStlmCharges(0);
      setStlmRef('');
      setStlmBankRef('');
      setStlmDesc('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to post settlement.');
    } finally {
      setIsSubmittingSettlement(false);
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
      setIsSubmittingTransfer(true);
      await api.transferBankWalletFunds({
        fromAccountId: xferFromId,
        toAccountId: xferToId,
        amount: Number(xferAmount),
        date: xferDate,
        reference: xferRef.trim() || undefined,
        description: xferDesc.trim() || undefined,
      });
      success('Funds transferred successfully.');
      setIsTransferModalOpen(false);
      setXferAmount(0);
      setXferRef('');
      setXferDesc('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to transfer funds.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleRecordCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chgAccountId) {
      toastError('Please select an account.');
      return;
    }
    if (chgAmount <= 0) {
      toastError('Charge amount must be greater than zero.');
      return;
    }
    try {
      setIsSubmittingCharge(true);
      await api.recordBankWalletCharge({
        accountId: chgAccountId,
        amount: Number(chgAmount),
        date: chgDate,
        chargeType: chgType,
        reference: chgRef.trim() || undefined,
        description: chgDesc.trim() || undefined,
      });
      success('Charge recorded successfully.');
      setIsChargeModalOpen(false);
      setChgAmount(0);
      setChgRef('');
      setChgDesc('');
      fetchAccounts();
      if (viewMode === 'DETAILS') fetchTransactions();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record charge.');
    } finally {
      setIsSubmittingCharge(false);
    }
  };

  // Open Edit Modal Helper
  const openEditModal = (acc: BankWalletAccountRecord) => {
    setEditAccId(acc.id);
    setEditAccName(acc.accountName);
    setEditAccBranch(acc.branch || 'Kathmandu Main');
    setEditAccNotes(acc.description || '');
    setEditAccActive(acc.isActive);
    setEditBankName(acc.bankName || '');
    setEditAccNumber(acc.rawAccountNumber || '');
    setEditAccHolder(acc.accountHolderName || '');
    setEditWalletProvider(acc.walletProvider || 'eSewa');
    setEditMerchantId(acc.rawMerchantId || '');
    setEditMobileNumber(acc.registeredMobileNumber || '');
    setEditDirectBankSettlement(!!acc.directBankSettlement);
    setIsEditAccountModalOpen(true);
  };

  // Open Settlement Modal with Pre-selected Wallet
  const openSettlementWithWallet = (walletId?: string) => {
    setStlmWalletId(walletId || digitalWallets[0]?.id || '');
    setStlmBankId(bankAccounts[0]?.id || '');
    setIsSettlementModalOpen(true);
  };

  // Open Transfer Modal Helper
  const openTransfer = (fromId?: string) => {
    setXferFromId(fromId || bankAccounts[0]?.id || '');
    setXferToId(bankAccounts.find((a) => a.id !== fromId)?.id || '');
    setIsTransferModalOpen(true);
  };

  // Open Charge Modal Helper
  const openCharge = (accId?: string) => {
    setChgAccountId(accId || bankAccounts[0]?.id || digitalWallets[0]?.id || '');
    setIsChargeModalOpen(true);
  };

  // Filtered lists
  const filteredBankAccounts = useMemo(() => {
    return bankAccounts.filter((acc) => {
      if (branchFilter !== 'ALL' && acc.branch !== branchFilter) return false;
      if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        if (acc.isActive !== isActive) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !acc.accountName.toLowerCase().includes(q) &&
          !acc.accountCode.toLowerCase().includes(q) &&
          !(acc.bankName || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bankAccounts, branchFilter, statusFilter, searchQuery]);

  const filteredWallets = useMemo(() => {
    return digitalWallets.filter((acc) => {
      if (providerFilter !== 'ALL' && acc.walletProvider?.toLowerCase() !== providerFilter.toLowerCase()) return false;
      if (branchFilter !== 'ALL' && acc.branch !== branchFilter) return false;
      if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        if (acc.isActive !== isActive) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !acc.accountName.toLowerCase().includes(q) &&
          !acc.accountCode.toLowerCase().includes(q) &&
          !(acc.walletProvider || '').toLowerCase().includes(q) &&
          !(acc.merchantId || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [digitalWallets, providerFilter, branchFilter, statusFilter, searchQuery]);

  // Paginated Slices
  const paginatedBankAccounts = useMemo(() => {
    const start = (bankPage - 1) * bankPageSize;
    return filteredBankAccounts.slice(start, start + bankPageSize);
  }, [filteredBankAccounts, bankPage, bankPageSize]);

  const paginatedWallets = useMemo(() => {
    const start = (walletPage - 1) * walletPageSize;
    return filteredWallets.slice(start, start + walletPageSize);
  }, [filteredWallets, walletPage, walletPageSize]);

  // Export CSV
  const handleExportCSV = () => {
    if (viewMode === 'LIST') {
      if (activeTab === 'BANK') {
        const headers = ['Account Code', 'Account Name', 'Bank Name', 'Account Number', 'Branch', 'Current Balance', 'Status'];
        const rows = filteredBankAccounts.map((a) => [
          a.accountCode,
          `"${a.accountName}"`,
          `"${a.bankName || ''}"`,
          `"${a.accountNumber}"`,
          `"${a.branch}"`,
          a.currentBalance,
          a.isActive ? 'Active' : 'Inactive',
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Bank_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const headers = ['Account Code', 'Wallet Name', 'Provider', 'Merchant ID', 'Branch', 'Current Balance', 'Status'];
        const rows = filteredWallets.map((a) => [
          a.accountCode,
          `"${a.accountName}"`,
          `"${a.walletProvider || ''}"`,
          `"${a.merchantId}"`,
          `"${a.branch}"`,
          a.currentBalance,
          a.isActive ? 'Active' : 'Inactive',
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Digital_Wallets_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const headers = ['Date', 'Reference #', 'Type', 'Description', 'Debit', 'Credit', 'Running Balance', 'Source', 'Status'];
      const rows = transactions.map((t) => [
        new Date(t.date).toLocaleString(),
        `"${t.referenceNumber}"`,
        `"${t.transactionType}"`,
        `"${t.description}"`,
        t.debit,
        t.credit,
        t.runningBalance,
        `"${t.sourceModule}"`,
        `"${t.status}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Account_Ledger_${selectedAccountId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton
            href="/accounts"
            label="Back"
            onClick={viewMode === 'DETAILS' ? () => setViewMode('LIST') : undefined}
          />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Bank &amp; Wallet Accounts</span>
            {viewMode === 'DETAILS' && selectedAccount && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {selectedAccount.accountName}
              </span>
            )}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'LIST' && (
            <button
              type="button"
              onClick={() => {
                setModalAccountType(activeTab);
                setIsAddAccountModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-[#0B3D32] text-white dark:bg-emerald-600 hover:bg-[#082d25] dark:hover:bg-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Add {activeTab === 'BANK' ? 'Bank Account' : 'Digital Wallet'}</span>
            </button>
          )}

          {activeTab === 'WALLET' ? (
            <button
              type="button"
              onClick={() => openSettlementWithWallet()}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Record Settlement</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openTransfer()}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Bank Transfer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openCharge()}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Record Charge</span>
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

      {/* 3. Navigation Tabs (Bank Accounts vs Digital Wallets) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('BANK');
              setViewMode('LIST');
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'BANK'
                ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Bank Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('WALLET');
              setViewMode('LIST');
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'WALLET'
                ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Digital Wallets</span>
          </button>
        </div>

        {/* Quick Link to Separate Bank Reconciliation Workflow */}
        <Link
          href="/accounts?tab=bank-reconciliation"
          className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 pb-1"
        >
          <Scale className="w-3.5 h-3.5 stroke-[1.25]" />
          <span>Go to Bank &amp; Wallet Reconciliation</span>
        </Link>
      </div>

      {/* 4. Filters Bar */}
      <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Branch / Outlet */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setBankPage(1);
                setWalletPage(1);
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

          {/* Provider Filter (Only in Wallet Tab) */}
          {activeTab === 'WALLET' ? (
            <div>
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setWalletPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
              >
                <option value="ALL">All Wallet Providers</option>
                <option value="eSewa">eSewa</option>
                <option value="Khalti">Khalti</option>
                <option value="IME Pay">IME Pay</option>
                <option value="Fonepay">Fonepay</option>
                <option value="Custom">Other Custom Wallets</option>
              </select>
            </div>
          ) : (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setBankPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Accounts Only</option>
                <option value="INACTIVE">Deactivated Accounts Only</option>
              </select>
            </div>
          )}

          {/* Status Filter for Wallet or Date Range */}
          {activeTab === 'WALLET' ? (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setWalletPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Wallets</option>
                <option value="INACTIVE">Deactivated Wallets</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDatePreset('all');
                }}
                className="w-1/2 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
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
                className="w-1/2 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                title="To Date"
              />
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={viewMode === 'LIST' ? searchQuery : txnSearchQuery}
              onChange={(e) => {
                if (viewMode === 'LIST') {
                  setSearchQuery(e.target.value);
                  setBankPage(1);
                  setWalletPage(1);
                } else {
                  setTxnSearchQuery(e.target.value);
                  setTxnPage(1);
                }
              }}
              placeholder={
                viewMode === 'LIST'
                  ? activeTab === 'BANK'
                    ? 'Search bank name, account #...'
                    : 'Search wallet, provider, merchant ID...'
                  : 'Search voucher, description, source...'
              }
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 5. MAIN CONTENT AREA */}
      {viewMode === 'LIST' ? (
        activeTab === 'BANK' ? (
          /* ======================== BANK ACCOUNTS TAB TABLE ======================== */
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Account Name</th>
                    <th className="px-3 py-2.5">Bank Name</th>
                    <th className="px-3 py-2.5">Account Number</th>
                    <th className="px-3 py-2.5">Branch</th>
                    <th className="px-3 py-2.5 text-right">Current Balance</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading bank accounts...
                      </td>
                    </tr>
                  ) : paginatedBankAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No bank accounts found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedBankAccounts.map((acc) => (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[1.25]" />
                          <button
                            type="button"
                            onClick={() => handleOpenAccountDetails(acc)}
                            className="hover:text-blue-600 hover:underline text-left"
                          >
                            {acc.accountName}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                          {acc.bankName || 'Commercial Bank'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                            {acc.accountNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                          {acc.branch || 'Kathmandu Main'}
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
                              onClick={() => handleOpenAccountDetails(acc)}
                              className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="View Details & Ledger"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openTransfer(acc.id)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                              title="Transfer Funds"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCharge(acc.id)}
                              className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                              title="Record Bank Charge"
                            >
                              <Receipt className="w-3.5 h-3.5 stroke-[1.25]" />
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

            {/* Bottom-right DataTables Pagination for Bank Accounts */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {filteredBankAccounts.length > 0 ? (bankPage - 1) * bankPageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(bankPage * bankPageSize, filteredBankAccounts.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredBankAccounts.length}</span> bank accounts
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Rows:</span>
                  <select
                    value={bankPageSize}
                    onChange={(e) => {
                      setBankPageSize(Number(e.target.value));
                      setBankPage(1);
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
                    disabled={bankPage <= 1}
                    onClick={() => setBankPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                    {bankPage} / {Math.ceil(filteredBankAccounts.length / bankPageSize) || 1}
                  </span>
                  <button
                    type="button"
                    disabled={bankPage >= Math.ceil(filteredBankAccounts.length / bankPageSize)}
                    onClick={() => setBankPage((p) => Math.min(Math.ceil(filteredBankAccounts.length / bankPageSize), p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================== DIGITAL WALLETS TAB TABLE ======================== */
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Wallet Name</th>
                    <th className="px-3 py-2.5">Provider</th>
                    <th className="px-3 py-2.5">Merchant ID</th>
                    <th className="px-3 py-2.5">Branch / Outlet</th>
                    <th className="px-3 py-2.5 text-right">Current Balance</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading digital wallets...
                      </td>
                    </tr>
                  ) : paginatedWallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No digital wallets found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedWallets.map((acc) => (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0 stroke-[1.25]" />
                          <button
                            type="button"
                            onClick={() => handleOpenAccountDetails(acc)}
                            className="hover:text-teal-600 hover:underline text-left"
                          >
                            {acc.accountName}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              acc.walletProvider === 'eSewa'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : acc.walletProvider === 'Khalti'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : acc.walletProvider === 'IME Pay'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {acc.walletProvider || 'eSewa'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                            {acc.merchantId}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                          {acc.branch || 'Main Restaurant'}
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
                              onClick={() => handleOpenAccountDetails(acc)}
                              className="p-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              title="View Details & Ledger"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openSettlementWithWallet(acc.id)}
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                              title="Settle Wallet to Bank"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCharge(acc.id)}
                              className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                              title="Record Wallet Fee"
                            >
                              <Receipt className="w-3.5 h-3.5 stroke-[1.25]" />
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

            {/* Bottom-right DataTables Pagination for Wallets */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {filteredWallets.length > 0 ? (walletPage - 1) * walletPageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(walletPage * walletPageSize, filteredWallets.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredWallets.length}</span> digital wallets
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Rows:</span>
                  <select
                    value={walletPageSize}
                    onChange={(e) => {
                      setWalletPageSize(Number(e.target.value));
                      setWalletPage(1);
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
                    disabled={walletPage <= 1}
                    onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                    {walletPage} / {Math.ceil(filteredWallets.length / walletPageSize) || 1}
                  </span>
                  <button
                    type="button"
                    disabled={walletPage >= Math.ceil(filteredWallets.length / walletPageSize)}
                    onClick={() => setWalletPage((p) => Math.min(Math.ceil(filteredWallets.length / walletPageSize), p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ======================== ACCOUNT DETAILS & TRANSACTION HISTORY VIEW ======================== */
        <div className="space-y-4">
          {/* Account Details Header Strip */}
          <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedAccount?.accountName}
                </h3>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedAccount?.accountCode}
                </span>
                <span className="text-xs text-slate-500">• {selectedAccount?.branch}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                {selectedAccount?.accountType === 'BANK' ? (
                  <>
                    <span>Bank: <strong className="text-slate-700 dark:text-slate-300">{selectedAccount.bankName}</strong></span>
                    <span>A/C: <strong className="text-slate-700 dark:text-slate-300 font-mono">{selectedAccount.accountNumber}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Provider: <strong className="text-slate-700 dark:text-slate-300">{selectedAccount?.walletProvider}</strong></span>
                    <span>Merchant ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{selectedAccount?.merchantId}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Metrics for Selected Account */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Opening Balance</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Rs. {formatCur(ledgerSummary.periodOpeningBalance)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Money In (Dr)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  + Rs. {formatCur(ledgerSummary.periodIn)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Money Out (Cr)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  - Rs. {formatCur(ledgerSummary.periodOut)}
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

          {/* Transactions Table */}
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Reference #</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-right">Debit (In)</th>
                    <th className="px-3 py-2.5 text-right">Credit (Out)</th>
                    <th className="px-3 py-2.5 text-right">Running Balance</th>
                    <th className="px-3 py-2.5">Source</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Loading transaction history...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No transactions recorded for this account.
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
                              t.transactionType.includes('RECEIPT') || t.transactionType.includes('INCOME')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : t.transactionType.includes('PAYMENT') || t.transactionType.includes('CHARGE')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : t.transactionType.includes('SETTLEMENT') || t.transactionType.includes('TRANSFER')
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
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.debit > 0 ? `+ Rs. ${formatCur(t.debit)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.credit > 0 ? `- Rs. ${formatCur(t.credit)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-black text-slate-900 dark:text-white">
                          Rs. {formatCur(t.runningBalance)}
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">
                          {t.sourceModule}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTxn(t);
                              setIsVoucherModalOpen(true);
                            }}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="View Voucher"
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

            {/* Bottom-right DataTables Pagination for Ledger */}
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

      {/* ======================== MODALS ======================== */}

      {/* MODAL 1: ADD ACCOUNT (BANK OR WALLET) */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Add {modalAccountType === 'BANK' ? 'Bank Account' : 'Digital Wallet'}</span>
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
              {/* Type Switcher */}
              <div className="flex rounded border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setModalAccountType('BANK')}
                  className={`flex-1 py-1 rounded font-bold text-center transition-colors ${
                    modalAccountType === 'BANK'
                      ? 'bg-white dark:bg-[#071F1A] text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Bank Account
                </button>
                <button
                  type="button"
                  onClick={() => setModalAccountType('WALLET')}
                  className={`flex-1 py-1 rounded font-bold text-center transition-colors ${
                    modalAccountType === 'WALLET'
                      ? 'bg-white dark:bg-[#071F1A] text-teal-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Digital Wallet
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalAccountType === 'BANK' ? 'e.g. Nabil Bank Operating Account' : 'e.g. eSewa Merchant Wallet - POS'}
                  value={addAccName}
                  onChange={(e) => setAddAccName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Conditional Bank Fields */}
              {modalAccountType === 'BANK' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nabil Bank, Global IME"
                        value={addBankName}
                        onChange={(e) => setAddBankName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01201017500123"
                        value={addAccNumber}
                        onChange={(e) => setAddAccNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={addAccHolder}
                      onChange={(e) => setAddAccHolder(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                    />
                  </div>
                </>
              ) : (
                /* Conditional Wallet Fields */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Wallet Provider *
                      </label>
                      <select
                        value={addWalletProvider}
                        onChange={(e) => setAddWalletProvider(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                      >
                        <option value="eSewa">eSewa</option>
                        <option value="Khalti">Khalti</option>
                        <option value="IME Pay">IME Pay</option>
                        <option value="Fonepay">Fonepay</option>
                        <option value="Custom">Custom Provider</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Merchant ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EPAYTEST, KHALTI_01"
                        value={addMerchantId}
                        onChange={(e) => setAddMerchantId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registered Mobile #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9801234567"
                        value={addMobileNumber}
                        onChange={(e) => setAddMobileNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Settlement Bank
                      </label>
                      <select
                        value={addSettlementBankId}
                        onChange={(e) => setAddSettlementBankId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                      >
                        <option value="">Select Settlement Bank</option>
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="addDirectBankSettlement"
                      checked={addDirectBankSettlement}
                      onChange={(e) => setAddDirectBankSettlement(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="addDirectBankSettlement" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Direct-to-bank settlement (QR receipts credit bank directly)
                    </label>
                  </div>
                </>
              )}

              {/* Common Financial Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addAccOpening || ''}
                    onChange={(e) => setAddAccOpening(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet
                  </label>
                  <input
                    type="text"
                    value={addAccBranch}
                    onChange={(e) => setAddAccBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={addAccNotes}
                  onChange={(e) => setAddAccNotes(e.target.value)}
                  placeholder="Optional remarks..."
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
                  disabled={isSubmittingAdd}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] dark:bg-emerald-600 text-white font-bold hover:bg-[#082d25] disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ACCOUNT */}
      {isEditAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Edit Account Details</span>
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editAccNotes}
                  onChange={(e) => setEditAccNotes(e.target.value)}
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
                  Account is Active
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

      {/* MODAL 3: RECORD WALLET SETTLEMENT */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
                <span>Record Digital Wallet Settlement to Bank</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleSettlement} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300">
                Transfers merchant funds from Digital Wallet to Bank Account. Wallet charges are automatically booked to expenses.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Source Wallet Account *
                  </label>
                  <select
                    value={stlmWalletId}
                    onChange={(e) => setStlmWalletId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Wallet</option>
                    {digitalWallets.filter((w) => w.isActive).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.walletProvider} - {w.accountName} (Avail: Rs. {formatCur(w.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Bank Account *
                  </label>
                  <select
                    value={stlmBankId}
                    onChange={(e) => setStlmBankId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.filter((b) => b.isActive).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gross Settlement (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={stlmGross || ''}
                    onChange={(e) => setStlmGross(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Wallet Fee / Charges (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stlmCharges || ''}
                    onChange={(e) => setStlmCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Net Bank Inflow (Rs.)
                  </label>
                  <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono font-black text-emerald-600 truncate">
                    Rs. {formatCur(Math.max(0, stlmGross - stlmCharges))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Settlement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={stlmDate}
                    onChange={(e) => setStlmDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Settlement / Payout Ref *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ESEWA-PAYOUT-991"
                    value={stlmRef}
                    onChange={(e) => setStlmRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  value={stlmDesc}
                  onChange={(e) => setStlmDesc(e.target.value)}
                  placeholder="Details of batch settlement..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSettlement}
                  className="px-4 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingSettlement ? 'Posting...' : 'Post Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BANK TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 stroke-[1.25]" />
                <span>Inter-Account Funds Transfer</span>
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
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  From Account *
                </label>
                <select
                  value={xferFromId}
                  onChange={(e) => setXferFromId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                >
                  <option value="">Select Source Account</option>
                  {[...bankAccounts, ...digitalWallets].filter((a) => a.isActive).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Avail: Rs. {formatCur(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  To Account *
                </label>
                <select
                  value={xferToId}
                  onChange={(e) => setXferToId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                >
                  <option value="">Select Destination Account</option>
                  {[...bankAccounts, ...digitalWallets].filter((a) => a.isActive && a.id !== xferFromId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-991, FT-001"
                  value={xferRef}
                  onChange={(e) => setXferRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
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
                  disabled={isSubmittingTransfer}
                  className="px-4 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingTransfer ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD CHARGE */}
      {isChargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-600 stroke-[1.25]" />
                <span>Record Bank or Wallet Charge</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChargeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4 stroke-[1.25]" />
              </button>
            </div>

            <form onSubmit={handleRecordCharge} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Charged Account *
                </label>
                <select
                  value={chgAccountId}
                  onChange={(e) => setChgAccountId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                >
                  <option value="">Select Account</option>
                  {[...bankAccounts, ...digitalWallets].filter((a) => a.isActive).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Charge Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={chgAmount || ''}
                    onChange={(e) => setChgAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Charge Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={chgDate}
                    onChange={(e) => setChgDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Charge Category / Type *
                </label>
                <select
                  value={chgType}
                  onChange={(e) => setChgType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                >
                  <option value="Bank Service Charge">Bank Service / Maintenance Charge</option>
                  <option value="SMS Alert Charge">SMS &amp; Internet Banking Charge</option>
                  <option value="Wallet Gateway Commission">Wallet Gateway Commission / MDR</option>
                  <option value="Cheque Return Fee">Cheque Processing Fee</option>
                  <option value="Other Bank Deduction">Other Bank Deduction</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Narration
                </label>
                <textarea
                  rows={2}
                  value={chgDesc}
                  onChange={(e) => setChgDesc(e.target.value)}
                  placeholder="Details of charge deduction..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCharge}
                  className="px-4 py-1.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingCharge ? 'Posting...' : 'Post Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: VOUCHER DRILLDOWN */}
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="font-bold text-emerald-600">
                    {selectedTxn.status}
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
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Debit (In)</span>
                  <span className="font-bold text-emerald-600">
                    {selectedTxn.debit > 0 ? `Rs. ${formatCur(selectedTxn.debit)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">Credit (Out)</span>
                  <span className="font-bold text-rose-600">
                    {selectedTxn.credit > 0 ? `Rs. ${formatCur(selectedTxn.credit)}` : '—'}
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
                  <span>Print Slip</span>
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


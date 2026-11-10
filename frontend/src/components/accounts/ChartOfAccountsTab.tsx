'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Building2,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AccountItem, ChartOfAccountsSummary, AccountCategoryType, AccountMappingItem } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/lib/utils';

export default function ChartOfAccountsTab() {
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [summary, setSummary] = useState<ChartOfAccountsSummary | null>(null);

  // Filters & Search
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // DataTable Pagination (entries per page, prev/next, page buttons)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isMappingsModalOpen, setIsMappingsModalOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestingCode, setSuggestingCode] = useState(false);

  // Account Mappings
  const [mappings, setMappings] = useState<AccountMappingItem[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'ASSET' as AccountCategoryType,
    parentId: '',
    subCategory: 'Current Asset',
    normalBalance: 'DEBIT' as 'DEBIT' | 'CREDIT',
    isGroup: false,
    isControlAccount: false,
    allowManualEntries: true,
    openingBalance: 0,
    description: '',
    isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getChartOfAccounts({
        type: selectedType === 'ALL' ? undefined : selectedType,
        search: searchQuery || undefined,
        activeOnly: statusFilter === 'ACTIVE' ? true : undefined,
      });

      let list = res.accounts || [];
      if (statusFilter === 'INACTIVE') {
        list = list.filter((a) => !a.isActive);
      }

      setAccounts(list);
      setSummary(res.summary || null);
    } catch (err: any) {
      error(err?.message || 'Failed to load Chart of Accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleSeedDefault = async () => {
    if (!confirm('Initialize standard Chart of Accounts for your hotel & restaurant?')) return;
    try {
      setLoading(true);
      const res = await api.seedDefaultAccounts();
      success(res.added > 0 ? `Successfully initialized ${res.added} standard accounts.` : 'Chart of Accounts is already initialized.');
      loadData();
    } catch (err: any) {
      error(err?.message || 'Failed to initialize accounts');
      setLoading(false);
    }
  };

  const loadMappings = async () => {
    try {
      const data = await api.getAccountMappings();
      setMappings(data || []);
      setIsMappingsModalOpen(true);
    } catch (err: any) {
      error('Failed to load transaction account mappings');
    }
  };

  // Group accounts available as parents
  const groupAccounts = useMemo(() => {
    return accounts.filter((a) => a.isGroup && a.isActive);
  }, [accounts]);

  const handleOpenAdd = async (presetParentId?: string) => {
    const parent = presetParentId ? accounts.find((a) => a.id === presetParentId) : null;
    const initialType = parent ? parent.accountType : 'ASSET';
    const initialNormal = initialType === 'ASSET' || initialType === 'EXPENSE' ? 'DEBIT' : 'CREDIT';

    setFormData({
      accountCode: '',
      accountName: '',
      accountType: initialType,
      parentId: presetParentId || '',
      subCategory: parent?.subCategory || 'Current Asset',
      normalBalance: initialNormal,
      isGroup: false,
      isControlAccount: false,
      allowManualEntries: true,
      openingBalance: 0,
      description: '',
      isActive: true,
    });

    setIsAddModalOpen(true);

    try {
      setSuggestingCode(true);
      const codeRes = await api.suggestAccountCode({
        parentId: presetParentId || undefined,
        type: initialType,
      });
      if (codeRes?.suggestedCode) {
        setFormData((prev) => ({ ...prev, accountCode: codeRes.suggestedCode }));
      }
    } catch (e) {
      // ignore
    } finally {
      setSuggestingCode(false);
    }
  };

  const handleParentSelectChange = async (parentId: string) => {
    const parent = accounts.find((a) => a.id === parentId);
    if (parent) {
      const normal = parent.normalBalance;
      setFormData((prev) => ({
        ...prev,
        parentId,
        accountType: parent.accountType,
        normalBalance: normal,
        subCategory: parent.subCategory,
      }));

      try {
        setSuggestingCode(true);
        const codeRes = await api.suggestAccountCode({ parentId, type: parent.accountType });
        if (codeRes?.suggestedCode) {
          setFormData((prev) => ({ ...prev, accountCode: codeRes.suggestedCode }));
        }
      } catch (e) {
        // ignore
      } finally {
        setSuggestingCode(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, parentId: '' }));
    }
  };

  const handleOpenEdit = (acc: AccountItem) => {
    setEditingAccount(acc);
    setFormData({
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      accountType: acc.accountType,
      parentId: acc.parentId || '',
      subCategory: acc.subCategory,
      normalBalance: acc.normalBalance,
      isGroup: acc.isGroup,
      isControlAccount: acc.isControlAccount,
      allowManualEntries: acc.allowManualEntries,
      openingBalance: acc.openingBalance,
      description: acc.description || '',
      isActive: acc.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = (acc: AccountItem) => {
    setSelectedAccount(acc);
    setIsDetailsDrawerOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountCode.trim() || !formData.accountName.trim()) {
      error('Please provide Account Code and Account Name');
      return;
    }

    try {
      setSubmitting(true);
      await api.createAccount({
        accountCode: formData.accountCode.trim(),
        accountName: formData.accountName.trim(),
        accountType: formData.accountType,
        parentId: formData.parentId || undefined,
        subCategory: formData.subCategory,
        normalBalance: formData.normalBalance,
        isGroup: formData.isGroup,
        isControlAccount: formData.isControlAccount,
        allowManualEntries: formData.allowManualEntries,
        openingBalance: Number(formData.openingBalance) || 0,
        description: formData.description,
        isActive: formData.isActive,
      });

      success('Account created successfully');
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err?.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setSubmitting(true);
      await api.updateAccount(editingAccount.id, {
        accountName: formData.accountName.trim(),
        parentId: formData.parentId || undefined,
        subCategory: formData.subCategory,
        description: formData.description,
        allowManualEntries: formData.allowManualEntries,
        isControlAccount: formData.isControlAccount,
        isActive: formData.isActive,
      });

      success('Account updated successfully');
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err?.message || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (acc: AccountItem) => {
    if (acc.isSystemAccount) {
      error('Cannot delete a system core account');
      return;
    }

    if (!confirm(`Are you sure you want to delete/deactivate "${acc.accountCode} - ${acc.accountName}"?`)) {
      return;
    }

    try {
      await api.deleteAccount(acc.id);
      success('Account deleted or deactivated');
      if (isDetailsDrawerOpen) setIsDetailsDrawerOpen(false);
      loadData();
    } catch (err: any) {
      error(err?.message || 'Failed to delete account');
    }
  };

  const handleExportCSV = () => {
    if (accounts.length === 0) {
      error('No accounts to export');
      return;
    }

    const headers = ['Account Code', 'Account Name', 'Type', 'Sub Category', 'Nature', 'Balance', 'Is Group', 'Status'];
    const rows = accounts.map((a) => [
      `"${a.accountCode}"`,
      `"${a.accountName}"`,
      `"${a.accountType}"`,
      `"${a.subCategory}"`,
      `"${a.normalBalance}"`,
      a.currentBalance,
      a.isGroup ? 'Yes' : 'No',
      a.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chart_of_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Chart of Accounts exported to CSV');
  };

  // Safe Currency Formatter (Prevents any toLocaleString on undefined crash)
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Badge styling
  const getTypeBadgeStyle = (type: AccountCategoryType) => {
    switch (type) {
      case 'ASSET':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'LIABILITY':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'EQUITY':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'INCOME':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'EXPENSE':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // DataTable pagination calculations
  const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return accounts.slice(start, start + pageSize);
  }, [accounts, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* 1. Page Header with Title & Action Buttons */}
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
              Chart of Accounts
            </h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadMappings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Configure auto-posting account mappings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Posting Mappings</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSeedDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="Initialize standard accounts"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Initialize Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Account</span>
          </button>
        </div>
      </div>

      {/* 2. Account Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Assets */}
          <div className="p-3.5 rounded-[3px] border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              <span>Total Assets</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-950 dark:text-emerald-300 mt-1 truncate">
              Rs. {formatCurrency(summary.totalAssets)}
            </div>
            
          </div>

          {/* Liabilities */}
          <div className="p-3.5 rounded-[3px] border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <span>Total Liabilities</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-900 dark:text-amber-300 mt-1 truncate">
              Rs. {formatCurrency(summary.totalLiabilities)}
            </div>
            
          </div>

          {/* Equity */}
          <div className="p-3.5 rounded-[3px] border border-purple-200/90 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400">
              <span>Total Equity</span>
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-purple-900 dark:text-purple-300 mt-1 truncate">
              Rs. {formatCurrency(summary.totalEquity)}
            </div>
            
          </div>

          {/* Income */}
          <div className="p-3.5 rounded-[3px] border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
              <span>Total Income</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-blue-900 dark:text-blue-300 mt-1 truncate">
              Rs. {formatCurrency(summary.totalIncome ?? (summary as any).totalRevenue)}
            </div>
            
          </div>

          {/* Expenses */}
          <div className="p-3.5 rounded-[3px] border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
              <span>Total Expenses</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-rose-900 dark:text-rose-300 mt-1 truncate">
              Rs. {formatCurrency(summary.totalExpenses)}
            </div>
            
          </div>
        </div>
      )}

      {/* 3. Clean Filter & Search Bar */}
      <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const).map((cat) => {
              const isSelected = selectedType === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedType(cat);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border',
                    isSelected
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                  )}
                >
                  {cat === 'ALL' ? 'All Accounts' : cat === 'ASSET' ? 'Assets' : cat === 'LIABILITY' ? 'Liabilities' : cat === 'EQUITY' ? 'Equity' : cat === 'INCOME' ? 'Income' : 'Expenses'}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search, Status, Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Search Box with Clear Button */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code or account..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Refresh accounts"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Accounts Table (Clean, Professional & Styled like Restaurant/Hotel Pages) */}
      <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                <th className="py-3 px-4 w-28 border-r border-slate-200/70 dark:border-slate-800">CODE</th>
                <th className="py-3 px-4 border-r border-slate-200/70 dark:border-slate-800">ACCOUNT NAME</th>
                <th className="py-3 px-4 w-28 border-r border-slate-200/70 dark:border-slate-800">CATEGORY</th>
                <th className="py-3 px-4 w-36 border-r border-slate-200/70 dark:border-slate-800">SUB-CATEGORY</th>
                <th className="py-3 px-4 w-24 text-center border-r border-slate-200/70 dark:border-slate-800">NATURE</th>
                <th className="py-3 px-4 text-right min-w-[130px] border-r border-slate-200/70 dark:border-slate-800">BALANCE (RS.)</th>
                <th className="py-3 px-4 w-24 text-center border-r border-slate-200/70 dark:border-slate-800">STATUS</th>
                <th className="py-3 px-4 w-28 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Loading Chart of Accounts...</span>
                  </td>
                </tr>
              ) : paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">No accounts match your filter or search.</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, idx) => (
                  <tr
                    key={acc.id}
                    onClick={() => handleOpenDetails(acc)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                      {(safeCurrentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      {acc.accountCode}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn('font-medium text-slate-900 dark:text-white', acc.isGroup && 'font-bold')}>
                          {acc.accountName}
                        </span>
                        {acc.isGroup && (
                          <span className="px-1.5 py-0.2 rounded-[2px] text-[8.5px] font-bold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                            Group
                          </span>
                        )}
                        
                      </div>
                      
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800/60">
                      <span className={cn('px-2 py-0.5 rounded-[3px] text-[9.5px] font-bold uppercase tracking-wider border', getTypeBadgeStyle(acc.accountType))}>
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                      {acc.subCategory}
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800/60">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-mono font-bold',
                        acc.normalBalance === 'DEBIT' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      )}>
                        {acc.normalBalance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                      Rs. {formatCurrency(acc.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800/60">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium border',
                        acc.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', acc.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                        <span>{acc.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {!acc.isGroup && (
                          <button
                            type="button"
                            onClick={() => router.push(`/accounts?tab=general-ledger&accountId=${acc.id}`)}
                            className="p-1.5 rounded-[3px] text-slate-500 hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                            title="View General Ledger"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 rounded-[3px] text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DataTables Pagination Footer (Hotel & Restaurant Standard Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
        {/* Left side: Show Entries per page + Entries summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[28px] px-2 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
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
              {accounts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * pageSize, accounts.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{accounts.length}</strong>{' '}
            accounts
          </div>
        </div>

        {/* Right side: Prev / Page Numbers / Next (Always Visible) */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
            const pageNum = idx + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
            ) {
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
                      : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD NEW ACCOUNT
          ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Financial Account"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parent Account (Optional) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Parent Group Account
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => handleParentSelectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-[3px] text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              >
                <option value="">None (Top-Level)</option>
                {groupAccounts.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.accountCode} — {g.accountName} ({g.accountType})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  placeholder="e.g. 1105"
                  className="w-full px-3 py-2 font-mono text-xs font-bold rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
                />
                {suggestingCode && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-2.5 top-2.5" />
                )}
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g. Petty Cash - Kitchen"
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => {
                  const newType = e.target.value as AccountCategoryType;
                  const normal = newType === 'ASSET' || newType === 'EXPENSE' ? 'DEBIT' : 'CREDIT';
                  setFormData({ ...formData, accountType: newType, normalBalance: normal });
                }}
                className="w-full px-3 py-2 rounded-[3px] text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Normal Balance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Normal Balance <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.normalBalance}
                onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value as any })}
                className="w-full px-3 py-2 rounded-[3px] text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {/* Classification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sub-Classification
              </label>
              <input
                type="text"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                placeholder="e.g. Current Asset, Fixed Asset, Cost of Sales"
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opening Balance (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-3 py-2 font-mono text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Options */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isGroup}
                  onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })}
                  className="rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span className="font-semibold">Group Header (For grouping child accounts)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.allowManualEntries}
                  onChange={(e) => setFormData({ ...formData, allowManualEntries: e.target.checked })}
                  className="rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span className="font-semibold">Allow Manual Journal Entries</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span className="font-semibold">Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#083027] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: EDIT ACCOUNT
          ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Account: ${editingAccount?.accountCode}`}
        className="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Account Code &amp; Type</span>
                <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                  {editingAccount?.accountCode} — {editingAccount?.accountType}
                </div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-[3px] text-[9.5px] font-bold uppercase tracking-wider border', editingAccount ? getTypeBadgeStyle(editingAccount.accountType) : '')}>
                {editingAccount?.normalBalance} Normal
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Parent Group Account
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 rounded-[3px] text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              >
                <option value="">None (Top-Level)</option>
                {groupAccounts
                  .filter((g) => g.id !== editingAccount?.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.accountCode} — {g.accountName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sub-Classification
              </label>
              <input
                type="text"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.allowManualEntries}
                  onChange={(e) => setFormData({ ...formData, allowManualEntries: e.target.checked })}
                  className="rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span className="font-semibold">Allow Manual Journal Vouchers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span className="font-semibold">Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#083027] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          DRAWER: ACCOUNT DETAILS
          ========================================================================= */}
      <Drawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        title={selectedAccount ? `[${selectedAccount.accountCode}] ${selectedAccount.accountName}` : 'Account Details'}
        width="md"
      >
        {selectedAccount && (() => {
          const parentAcc = selectedAccount.parentId ? accounts.find((a) => a.id === selectedAccount.parentId) : null;
          return (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-[3px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Balance</span>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                      Rs. {formatCurrency(selectedAccount.currentBalance)}
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-[3px] text-xs font-bold uppercase tracking-wider border', getTypeBadgeStyle(selectedAccount.accountType))}>
                    {selectedAccount.accountType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>Normal: <strong>{selectedAccount.normalBalance}</strong></span>
                  <span>•</span>
                  <span>Type: <strong>{selectedAccount.isGroup ? 'Group Header' : 'Posting Ledger'}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {!selectedAccount.isGroup && (
                  <button
                    type="button"
                    onClick={() => router.push(`/accounts?tab=general-ledger&accountId=${selectedAccount.id}`)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                    <span>View General Ledger</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedAccount);
                    setIsDetailsDrawerOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Account</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Account Code</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAccount.accountCode}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Account Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.accountName}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.accountType}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Sub-Classification</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.subCategory}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Normal Balance</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedAccount.normalBalance}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Opening Balance</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    Rs. {formatCurrency(selectedAccount.openingBalance)}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Parent Account</span>
                  <span className="text-slate-800 dark:text-slate-200">{parentAcc ? `${parentAcc.accountCode} - ${parentAcc.accountName}` : 'Top-Level'}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Posting Allowed</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.isGroup ? 'No (Group Header)' : 'Yes (Ledger Account)'}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-400">Status</span>
                  <span className={cn('px-2 py-0.5 rounded-[3px] text-[10px] font-bold', selectedAccount.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                    {selectedAccount.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {!selectedAccount.isSystemAccount && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(selectedAccount)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[3px] border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete / Deactivate Account</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* =========================================================================
          MODAL: OPERATIONAL TRANSACTION MAPPINGS
          ========================================================================= */}
      <Modal
        isOpen={isMappingsModalOpen}
        onClose={() => setIsMappingsModalOpen(false)}
        title="Automated ERP Posting Mappings"
        className="max-w-3xl"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500">Map transactions to Chart of Accounts ledgers.</p>

          <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Operational Key</th>
                  <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Description</th>
                  <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Assigned Account</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                      {m.transactionType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                      {m.description || m.transactionCategory}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                      {m.creditAccount ? (
                        <span className="font-mono text-[#0B3D32] dark:text-emerald-400 font-bold">
                          [{m.creditAccount.accountCode}] {m.creditAccount.accountName}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold italic">Not mapped</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <select
                        value={m.creditAccountId}
                        onChange={async (e) => {
                          const newAccId = e.target.value;
                          try {
                            await api.saveAccountMapping({
                              transactionType: m.transactionType,
                              transactionCategory: m.transactionCategory,
                              debitAccountId: m.debitAccountId,
                              creditAccountId: newAccId,
                              taxAccountId: m.taxAccountId || undefined,
                              description: m.description || undefined,
                            });
                            success(`Updated mapping for ${m.transactionType}`);
                            loadMappings();
                          } catch (err: any) {
                            error('Failed to update mapping');
                          }
                        }}
                        className="px-2 py-1 text-xs rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        {accounts
                          .filter((a) => !a.isGroup)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountCode} - {a.accountName}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

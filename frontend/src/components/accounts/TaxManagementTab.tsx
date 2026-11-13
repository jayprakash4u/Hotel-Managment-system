'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wallet,
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  Info,
  X,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Search,
  Filter,
  Plus,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Receipt
} from 'lucide-react';
import { taxManagementApi, expenseApi } from '@/lib/api';
import { TaxSummaryResponse, TaxRecordItem, ExpensePaymentAccount } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import { cn } from '@/lib/utils';

export default function TaxManagementTab() {
  // Date State - Default to Current Month
  const now = new Date();
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayStr);
  const [endDate, setEndDate] = useState<string>(lastDayStr);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [taxTypeFilter, setTaxTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<TaxSummaryResponse | null>(null);
  const [records, setRecords] = useState<TaxRecordItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [paymentAccounts, setPaymentAccounts] = useState<ExpensePaymentAccount[]>([]);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<TaxRecordItem | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Form State
  const [payTaxType, setPayTaxType] = useState<string>('VAT');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payAccountId, setPayAccountId] = useState<string>('');
  const [payRef, setPayRef] = useState<string>('');
  const [payPeriod, setPayPeriod] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taxManagementApi.getSummary({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setSummary(res);
    } catch (err: any) {
      console.error('Failed to load tax summary:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // 2. Fetch Records
  const fetchRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      const res = await taxManagementApi.getRecords({
        taxType: taxTypeFilter,
        status: statusFilter,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      });
      setRecords(res.records || []);
      setTotalRecords(res.totalCount || 0);
    } catch (err: any) {
      console.error('Failed to load tax records:', err);
    } finally {
      setRecordsLoading(false);
    }
  }, [taxTypeFilter, statusFilter, startDate, endDate, debouncedSearch, page, pageSize]);

  // 3. Fetch Payment Accounts
  const fetchPaymentAccounts = useCallback(async () => {
    try {
      const accs = await expenseApi.getExpensePaymentAccounts();
      if (accs && accs.length > 0) {
        setPaymentAccounts(accs);
        if (!payAccountId) {
          const bank = accs.find((a) => a.accountType === 'BANK') || accs[0];
          setPayAccountId(bank.id);
        }
      }
    } catch (err) {
      console.error('Failed to load payment accounts:', err);
    }
  }, [payAccountId]);

  useEffect(() => {
    fetchSummary();
    fetchPaymentAccounts();
  }, [fetchSummary, fetchPaymentAccounts]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Date Preset Handlers
  const handlePreset = (type: 'TODAY' | 'THIS_MONTH' | 'PREV_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR') => {
    const d = new Date();
    let s = '';
    let e = '';

    if (type === 'TODAY') {
      s = d.toISOString().split('T')[0];
      e = s;
    } else if (type === 'THIS_MONTH') {
      s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (type === 'PREV_MONTH') {
      s = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
      e = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
    } else if (type === 'THIS_QUARTER') {
      const qMonth = Math.floor(d.getMonth() / 3) * 3;
      s = new Date(d.getFullYear(), qMonth, 1).toISOString().split('T')[0];
      e = new Date(d.getFullYear(), qMonth + 3, 0).toISOString().split('T')[0];
    } else if (type === 'THIS_YEAR') {
      s = new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
      e = new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    setStartDate(s);
    setEndDate(e);
    setPage(1);
  };

  // Open Payment Modal
  const handleOpenPayment = (type: 'VAT' | 'TDS' = 'VAT', suggestedAmount?: number) => {
    setPayTaxType(type);
    setPayAmount(suggestedAmount && suggestedAmount > 0 ? suggestedAmount.toString() : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayPeriod(summary?.taxPeriod || '');
    setPayNotes('');
    setFormError(null);
    setShowPaymentModal(true);
  };

  // Submit Tax Settlement
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (!payAccountId) {
      setFormError('Please select a payment bank or cash account.');
      return;
    }

    if (!payRef.trim()) {
      setFormError('Please provide a government challan or reference number.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      await taxManagementApi.recordPayment({
        taxType: payTaxType,
        amount: amt,
        paymentDate: payDate,
        paymentAccountId: payAccountId,
        referenceNumber: payRef.trim(),
        taxPeriod: payPeriod.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      showToast(`Tax payment of Rs. ${amt.toLocaleString()} recorded successfully! Journal voucher posted.`);
      setShowPaymentModal(false);
      fetchSummary();
      fetchRecords();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record tax payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-2',
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          )}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Tax Management
          </h1>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenPayment('VAT', summary?.netVatPayable)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B3D32] hover:bg-[#093027] rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Record Tax Payment
          </button>
          <button
            onClick={() => {
              fetchSummary();
              fetchRecords();
            }}
            disabled={loading || recordsLoading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh Tax Data"
          >
            <RefreshCw className={cn('w-4 h-4', (loading || recordsLoading) && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Date Filter & Preset Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Period:
            </span>
            {(['TODAY', 'THIS_MONTH', 'PREV_MONTH', 'THIS_QUARTER', 'THIS_YEAR'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePreset(preset)}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                {preset === 'TODAY' && 'Today'}
                {preset === 'THIS_MONTH' && 'This Month'}
                {preset === 'PREV_MONTH' && 'Previous Month'}
                {preset === 'THIS_QUARTER' && 'This Quarter'}
                {preset === 'THIS_YEAR' && 'This Year'}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Analytical Cards: VAT Breakdown & TDS Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VAT Detailed Calculation Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  VAT Position & Credit Flow (13%)
                </h3>
                <p className="text-[11px] text-slate-500">Sales Output VAT vs Eligible Input Tax Credits</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenPayment('VAT', summary?.netVatPayable)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1"
            >
              Deposit VAT <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Gross Output VAT (Sales Invoices & POS)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                Rs. {(summary?.outputVatCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <span className="text-rose-500 font-bold">-</span> Eligible Input VAT (Purchases & Supplies)
              </span>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                Rs. {(summary?.inputVatPaid ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Tax Settlement Already Remitted to IRD</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                Rs. {(summary?.totalTaxPaidPeriod ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 pt-3 font-bold bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg">
              <span className="text-slate-900 dark:text-slate-100">Net Outstanding VAT Due to Government</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                Rs. {(summary?.netVatPayable ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Filing Requirement:</strong> Nepalese VAT returns must be filed and paid by the 25th day of the following Nepalese calendar month.
            </span>
          </div>
        </div>

        {/* TDS Withholding Detailed Breakdown Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  TDS Withholding Obligations
                </h3>
                <p className="text-[11px] text-slate-500">Tax Deducted at Source on Rent, Services, and Contracts</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenPayment('TDS', summary?.totalTdsPayable)}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1"
            >
              Deposit TDS <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">TDS on Premises / Building Lease Rent (10%)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                Rs. {(summary?.tdsOnRent ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">TDS on Contract Services & Maintenance (1.5%)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                Rs. {(summary?.tdsOnServices ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">TDS on Staff Salaries & Allowances</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                Rs. {(summary?.tdsOnPayroll ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 pt-3 font-bold bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg">
              <span className="text-slate-900 dark:text-slate-100">Total Outstanding TDS Payable</span>
              <span className="font-mono text-blue-700 dark:text-blue-400 text-sm">
                Rs. {(summary?.totalTdsPayable ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>e-TDS Requirement:</strong> Withholding taxes must be deposited to the government treasury with verified PAN numbers of landlords and contractors.
            </span>
          </div>
        </div>
      </div>

      {/* Tax Records Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher, ref #, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Tax Type Filter */}
            <select
              value={taxTypeFilter}
              onChange={(e) => {
                setTaxTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ALL">All Tax Types</option>
              <option value="VAT">VAT Only (13%)</option>
              <option value="TDS">TDS Only</option>
              <option value="CORPORATE_TAX">Corporate Tax</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Settlement</option>
              <option value="PAID">Remitted / Paid</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{records.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> entries
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Tax Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Taxable Base (Rs.)</th>
                <th className="py-3 px-4 text-right">Rate</th>
                <th className="py-3 px-4 text-right">Tax Amount (Rs.)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recordsLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading tax ledger transactions...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No tax transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {new Date(r.transactionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {r.voucherNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          r.taxType === 'VAT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.taxType === 'TDS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        )}
                      >
                        {r.taxType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {r.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {r.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {r.taxableAmount > 0 ? r.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {r.taxRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      Rs. {r.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          r.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="View Tax Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Tax Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Record Tax Payment to Government
                  </h3>
                  <p className="text-[11px] text-slate-500">Posts settlement Journal Entry clearing tax liability</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Type *
                  </label>
                  <select
                    value={payTaxType}
                    onChange={(e) => setPayTaxType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="VAT">VAT Settlement (13%)</option>
                    <option value="TDS">TDS Withholding Settlement</option>
                    <option value="CORPORATE_TAX">Corporate Income Tax Advance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Account (Bank / Cash) *
                </label>
                <select
                  required
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">Select Account</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.accountCode}) — Bal: Rs. {a.currentBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount to Remit (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 25000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IRD Challan / Cheque # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CH-2083-9941"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Period (Nepali / English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kartik 2083 or Oct 2026"
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Narration / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes for the auditor or accountant..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B3D32] hover:bg-[#093027] rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Post Payment Voucher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tax Transaction Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Voucher Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedRecord.voucherNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Date</span>
                <span className="font-mono">{new Date(selectedRecord.transactionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tax Type</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedRecord.taxType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold">{selectedRecord.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Reference Number</span>
                <span className="font-mono">{selectedRecord.referenceNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Taxable Base Amount</span>
                <span className="font-mono">Rs. {selectedRecord.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tax Rate</span>
                <span className="font-mono">{selectedRecord.taxRate}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 font-bold">
                <span className="text-slate-700 dark:text-slate-300">Total Tax Amount</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  Rs. {selectedRecord.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Settlement Status</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                    selectedRecord.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  )}
                >
                  {selectedRecord.status}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


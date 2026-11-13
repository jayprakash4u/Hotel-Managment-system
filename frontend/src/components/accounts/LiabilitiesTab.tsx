'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import { useDebounce } from '@/lib/useDebounce';
import {
  ArrowLeft,
  Receipt,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Calendar,
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
  DollarSign,
  ExternalLink,
  ShieldAlert,
  Building2,
  Landmark,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { liabilitiesApi, api } from '@/lib/api';
import {
  LiabilityOverviewItem,
  LiabilitiesSummary,
  LoanObligationItem,
  LoanRepaymentScheduleItem,
  CreateLoanDto,
  RecordLoanRepaymentDto,
  LiabilitiesReportsData,
  LiabilityAccountConfigItem,
  LiabilityClassification,
  LiabilityStatus
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function LiabilitiesTab() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [liabilities, setLiabilities] = useState<LiabilityOverviewItem[]>([]);
  const [summary, setSummary] = useState<LiabilitiesSummary>({
    totalLiabilities: 0,
    currentLiabilities: 0,
    nonCurrentLiabilities: 0,
    overdueLiabilities: 0,
    totalObligationsCount: 0,
    overdueCount: 0,
    categoryBreakdown: [],
  });

  const [bankAccounts, setBankAccounts] = useState<Array<{
    id: string;
    accountCode: string;
    accountName: string;
    currentBalance: number;
    subCategory?: string;
  }>>([]);

  const [accountConfigs, setAccountConfigs] = useState<LiabilityAccountConfigItem[]>([]);

  // Pagination & Filtering
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Selected Detail Item
  const [selectedDetail, setSelectedDetail] = useState<{
    id: string;
    liabilityName: string;
    category: string;
    classification: string;
    relatedParty: string;
    originalAmount: number;
    totalPaid: number;
    outstandingBalance: number;
    dueDate?: string;
    status: string;
    sourceModule: string;
    sourceTransactionId?: string;
    sourceReferenceNumber?: string;
    linkedAccountCode: string;
    linkedAccountName: string;
    sourceRoute?: string;
    transactionHistory?: Array<{
      id: string;
      entryDate: string;
      description: string;
      debitAmount: number;
      creditAmount: number;
      balance: number;
      dueDate?: string;
    }>;
    loanDetails?: LoanObligationItem;
    repaymentSchedule?: LoanRepaymentScheduleItem[];
  } | null>(null);

  // Selected Loan for Repayment
  const [selectedLoan, setSelectedLoan] = useState<LoanObligationItem | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State - Add Loan
  const [loanName, setLoanName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanRefNum, setLoanRefNum] = useState('');
  const [loanCategory, setLoanCategory] = useState('Long-Term Bank Loans');
  const [loanClass, setLoanClass] = useState<LiabilityClassification>('NON_CURRENT');
  const [loanAmount, setLoanAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>(10.5);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [disbursementAccountId, setDisbursementAccountId] = useState('');
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [loanNotes, setLoanNotes] = useState('');

  // Form State - Record Repayment
  const [repayPrincipal, setRepayPrincipal] = useState<number | ''>('');
  const [repayInterest, setRepayInterest] = useState<number | ''>(0);
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayRef, setRepayRef] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  // Reports State
  const [reportsData, setReportsData] = useState<LiabilitiesReportsData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await liabilitiesApi.getSummary();
      if (res) setSummary(res);
    } catch (err: any) {
      console.error('Failed to load liabilities summary:', err);
    }
  }, []);

  // 2. Fetch Liabilities Overview List
  const fetchLiabilities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await liabilitiesApi.getOverview({
        search: debouncedSearch.trim() || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        classification: classificationFilter !== 'ALL' ? classificationFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      });

      if (res) {
        setLiabilities(res.items || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to load liabilities register.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, classificationFilter, statusFilter, dateFrom, dateTo, page, pageSize, toastError]);

  // 3. Fetch Master Metadata (Bank accounts & config)
  const fetchMasterData = useCallback(async () => {
    try {
      const [banks, configs] = await Promise.all([
        liabilitiesApi.getBankAccounts(),
        liabilitiesApi.getAccountConfigs(),
      ]);

      if (banks && banks.length > 0) {
        setBankAccounts(banks);
        if (!disbursementAccountId) setDisbursementAccountId(banks[0].id);
        if (!repayAccountId) setRepayAccountId(banks[0].id);
      }

      if (configs) {
        setAccountConfigs(configs);
      }
    } catch (err: any) {
      console.error('Failed to load master metadata for liabilities:', err);
    }
  }, [disbursementAccountId, repayAccountId]);

  // Initial Load
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchSummary();
    fetchLiabilities();
  }, [fetchSummary, fetchLiabilities]);

  // Open Details Modal
  const handleOpenDetail = async (item: LiabilityOverviewItem) => {
    try {
      const res = await liabilitiesApi.getLiabilityDetail(item.id);
      setSelectedDetail(res);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      toastError('Failed to fetch liability details: ' + (err?.message || ''));
    }
  };

  // Open Repayment Modal
  const handleOpenRepay = async (item: LiabilityOverviewItem) => {
    if (item.sourceModule === 'LOAN' && item.sourceTransactionId) {
      try {
        const loan = await liabilitiesApi.getLoanById(item.sourceTransactionId);
        setSelectedLoan(loan);
        setRepayPrincipal(loan.monthlyInstallmentAmount > 0 ? Math.min(loan.outstandingPrincipal, loan.monthlyInstallmentAmount) : '');
        setRepayInterest(0);
        setRepayDate(new Date().toISOString().slice(0, 10));
        setRepayRef('');
        setRepayNotes('');
        setIsRepayModalOpen(true);
      } catch (err: any) {
        toastError('Failed to load loan record: ' + (err?.message || ''));
      }
    } else {
      // Direct jump to source module for non-loan liabilities
      handleJumpToSource(item);
    }
  };

  // Jump to Source Module
  const handleJumpToSource = (item: LiabilityOverviewItem) => {
    if (item.sourceModule === 'SUPPLIER_LEDGER') {
      router.push(`/accounts?tab=supplier-ledger&supplierId=${item.sourceTransactionId || ''}`);
    } else if (item.sourceModule === 'EXPENSES') {
      router.push(`/accounts?tab=expenses&search=${item.sourceReferenceNumber || ''}`);
    } else if (item.sourceModule === 'CUSTOMER_ADVANCE') {
      router.push('/accounts?tab=customer-ledger');
    } else {
      router.push(`/accounts?tab=general-ledger&accountCode=${item.linkedAccountCode}`);
    }
  };

  // Submit Add Loan
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName.trim()) {
      toastError('Loan name is required.');
      return;
    }
    if (!lenderName.trim()) {
      toastError('Lender name is required.');
      return;
    }
    const numAmount = Number(loanAmount);
    if (!numAmount || numAmount <= 0) {
      toastError('Loan amount must be greater than zero.');
      return;
    }
    if (autoCapitalize && !disbursementAccountId) {
      toastError('Please select a disbursement bank account.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: CreateLoanDto = {
        loanName: loanName.trim(),
        lenderName: lenderName.trim(),
        loanReferenceNumber: loanRefNum.trim() || undefined,
        category: loanCategory,
        liabilityType: loanClass,
        originalLoanAmount: numAmount,
        interestRate: Number(interestRate) || 0,
        loanStartDate: new Date(startDate).toISOString(),
        maturityDate: new Date(maturityDate).toISOString(),
        repaymentFrequency: 'MONTHLY',
        disbursementBankAccountId: autoCapitalize ? disbursementAccountId : undefined,
        autoCapitalize,
        notes: loanNotes.trim() || undefined,
      };

      const created = await liabilitiesApi.createLoan(payload);
      success(`Loan obligation ${created.loanReferenceNumber} registered and schedule created!`);
      setIsAddLoanModalOpen(false);
      setLoanName('');
      setLoanAmount('');
      fetchSummary();
      fetchLiabilities();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create loan obligation.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Record Loan Repayment
  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const numPrincipal = Number(repayPrincipal) || 0;
    const numInterest = Number(repayInterest) || 0;
    const totalPmt = numPrincipal + numInterest;

    if (totalPmt <= 0) {
      toastError('Total repayment amount must be greater than zero.');
      return;
    }
    if (numPrincipal > selectedLoan.outstandingPrincipal + 0.01) {
      toastError(`Principal repayment cannot exceed outstanding principal (Rs. ${selectedLoan.outstandingPrincipal.toLocaleString()}).`);
      return;
    }
    if (!repayAccountId) {
      toastError('Please select a payment disbursement bank account.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const payload: RecordLoanRepaymentDto = {
        principalAmount: numPrincipal,
        interestAmount: numInterest,
        paymentDate: new Date(repayDate).toISOString(),
        paymentAccountId: repayAccountId,
        referenceNumber: repayRef.trim() || undefined,
        notes: repayNotes.trim() || undefined,
      };

      const res = await liabilitiesApi.recordLoanRepayment(selectedLoan.id, payload);
      success(`Repayment of Rs. ${totalPmt.toLocaleString()} recorded under JV #${res.journalEntryNumber}!`);
      setIsRepayModalOpen(false);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchSummary();
      fetchLiabilities();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record loan repayment.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Reports Modal
  const openReportsModal = async () => {
    setIsReportsModalOpen(true);
    try {
      setReportsLoading(true);
      const rep = await liabilitiesApi.getReports();
      setReportsData(rep);
    } catch (err: any) {
      toastError('Failed to load liabilities report.');
    } finally {
      setReportsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Liability Name',
      'Category',
      'Classification',
      'Related Party',
      'Original Amount',
      'Total Paid',
      'Outstanding Balance',
      'Due Date',
      'Status',
      'Source Module',
      'Reference #',
      'Linked Account Code',
      'Linked Account Name',
    ];

    const rows = liabilities.map((item) => [
      `"${item.liabilityName.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.classification,
      `"${item.relatedParty.replace(/"/g, '""')}"`,
      item.originalAmount,
      item.totalPaid,
      item.outstandingBalance,
      item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '',
      item.status,
      item.sourceModule,
      `"${item.sourceReferenceNumber || ''}"`,
      item.linkedAccountCode,
      `"${item.linkedAccountName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Liabilities_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Liabilities Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setLoanName('');
              setLenderName('');
              setLoanAmount('');
              setIsAddLoanModalOpen(true);
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Loan / Borrowing</span>
          </button>

          <button
            onClick={openReportsModal}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Aging &amp; Reports</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>Account Mapping</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              fetchSummary();
              fetchLiabilities();
            }}
            disabled={loading}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0B3D32]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search liability, supplier, vendor, bank, reference..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="ALL">All Categories</option>
              <option value="Supplier Payables">Supplier Payables</option>
              <option value="Expense Payables">Expense Payables</option>
              <option value="Salary & Wages Payables">Salary &amp; Wages Payables</option>
              <option value="Tax Payables">Tax Payables</option>
              <option value="Customer Advances">Customer Advances</option>
              <option value="Short-Term Loans">Short-Term Loans</option>
              <option value="Long-Term Bank Loans">Long-Term Bank Loans</option>
              <option value="Long-Term Borrowings">Long-Term Borrowings</option>
              <option value="Other Current Liabilities">Other Current Liabilities</option>
            </select>
          </div>

          {/* Classification Filter (Current / Non-Current) */}
          <div>
            <select
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="ALL">All Classifications</option>
              <option value="CURRENT">Current Liabilities (≤ 12 mo)</option>
              <option value="NON_CURRENT">Non-Current Liabilities (&gt; 12 mo)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="OUTSTANDING">Outstanding</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Liabilities Overview Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Liability Name &amp; Ref</th>
                <th className="py-2.5 px-3">Category &amp; Class</th>
                <th className="py-2.5 px-3">Related Party</th>
                <th className="py-2.5 px-3 text-right">Original Obligation</th>
                <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Source</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                      <span>Aggregating restaurant liabilities...</span>
                    </div>
                  </td>
                </tr>
              ) : liabilities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.25]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No liabilities found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || categoryFilter !== 'ALL' || classificationFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try clearing your active filters.'
                        : 'No pending supplier bills, unpaid expenses, or loans recorded.'}
                    </p>
                  </td>
                </tr>
              ) : (
                liabilities.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Name & Reference */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.liabilityName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        {item.sourceReferenceNumber && (
                          <span>Ref: {item.sourceReferenceNumber}</span>
                        )}
                        <span>• GL: {item.linkedAccountCode}</span>
                      </div>
                    </td>

                    {/* Category & Classification */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.category}
                      </div>
                      <div className="mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.classification === 'CURRENT'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}>
                          {item.classification === 'CURRENT' ? 'CURRENT (≤1Y)' : 'LONG-TERM (>1Y)'}
                        </span>
                      </div>
                    </td>

                    {/* Related Party */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{item.relatedParty}</div>
                    </td>

                    {/* Original Amount */}
                    <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap font-medium">
                      Rs. {item.originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Outstanding Balance */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      Rs. {item.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Due Date & Overdue Indicator */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.dueDate ? (
                        <div>
                          <div className={`font-medium ${item.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                          {item.isOverdue && (
                            <div className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {item.daysOverdue} days overdue
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">On Demand</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {item.status === 'OVERDUE' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          OVERDUE
                        </span>
                      )}
                      {item.status === 'OUTSTANDING' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          OUTSTANDING
                        </span>
                      )}
                      {item.status === 'PARTIALLY_PAID' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          PARTIAL
                        </span>
                      )}
                      {item.status === 'PAID' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          PAID
                        </span>
                      )}
                    </td>

                    {/* Source Module */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleJumpToSource(item)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1"
                        title="Click to view in source module"
                      >
                        <span>{item.sourceModule.replace('_', ' ')}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors"
                          title="View Liability Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Repayment (If Loan) */}
                        {item.sourceModule === 'LOAN' && item.outstandingBalance > 0 && (
                          <button
                            onClick={() => handleOpenRepay(item)}
                            className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Record Loan Repayment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Source Jump */}
                        <button
                          onClick={() => handleJumpToSource(item)}
                          className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Open Source Record"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Permanent DataTables Bottom-Right Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {totalCount}
            </span>{' '}
            obligations
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                « First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Last »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LIABILITY DETAILS MODAL                                          */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedDetail.liabilityName}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedDetail.status === 'OVERDUE'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : selectedDetail.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                    {selectedDetail.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Category: {selectedDetail.category} | Related Party: {selectedDetail.relatedParty} | Account: {selectedDetail.linkedAccountCode} - {selectedDetail.linkedAccountName}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Original Amount</span>
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  Rs. {selectedDetail.originalAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Total Settled / Paid</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  Rs. {selectedDetail.totalPaid.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Outstanding Balance</span>
                <div className="font-bold text-red-600 dark:text-red-400">
                  Rs. {selectedDetail.outstandingBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Details Specific: Loan Schedule or Transaction History */}
            <div className="space-y-3 text-xs">
              {selectedDetail.loanDetails ? (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                    <span>Repayment Installment Schedule</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Interest Rate: {selectedDetail.loanDetails.interestRate}% p.a.
                    </span>
                  </h4>
                  <div className="rounded border border-slate-200 dark:border-slate-800 max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                          <th className="py-2 px-2.5 text-center">#</th>
                          <th className="py-2 px-2.5">Due Date</th>
                          <th className="py-2 px-2.5 text-right">Principal</th>
                          <th className="py-2 px-2.5 text-right">Interest</th>
                          <th className="py-2 px-2.5 text-right">Total Installment</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                          <th className="py-2 px-2.5 text-center">JV #</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedDetail.repaymentSchedule?.map((sch) => (
                          <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{sch.periodNumber}</td>
                            <td className="py-1.5 px-2.5">{new Date(sch.dueDate).toLocaleDateString()}</td>
                            <td className="py-1.5 px-2.5 text-right">Rs. {sch.principalDue.toLocaleString()}</td>
                            <td className="py-1.5 px-2.5 text-right text-amber-600">Rs. {sch.interestDue.toLocaleString()}</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                              Rs. {sch.totalDue.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${sch.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {sch.status}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-500">
                              {sch.journalEntryNumber || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedDetail.transactionHistory && selectedDetail.transactionHistory.length > 0 ? (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Recent Transaction &amp; Settlement Log
                  </h4>
                  <div className="rounded border border-slate-200 dark:border-slate-800 max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Description</th>
                          <th className="py-2 px-2.5 text-right">Debit (Paid)</th>
                          <th className="py-2 px-2.5 text-right">Credit (Billed)</th>
                          <th className="py-2 px-2.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedDetail.transactionHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-1.5 px-2.5 text-slate-500">{new Date(tx.entryDate).toLocaleDateString()}</td>
                            <td className="py-1.5 px-2.5 font-medium text-slate-800 dark:text-slate-200">{tx.description}</td>
                            <td className="py-1.5 px-2.5 text-right text-emerald-600 font-medium">
                              {tx.debitAmount > 0 ? `Rs. ${tx.debitAmount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-rose-600 font-medium">
                              {tx.creditAmount > 0 ? `Rs. ${tx.creditAmount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                              Rs. {tx.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Liability recognized from Chart of Accounts balance. Open the General Ledger to see detailed line items.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
              {selectedDetail.sourceRoute ? (
                <Link
                  href={selectedDetail.sourceRoute}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in {selectedDetail.sourceModule.replace('_', ' ')}</span>
                </Link>
              ) : (
                <div />
              )}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD DIRECT LOAN / BORROWING                                       */}
      {/* ========================================================================= */}
      {isAddLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <Landmark className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Register Bank Loan or Borrowing
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Captures loan principal, interest parameters, and generates General Ledger capitalization entry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddLoanModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Loan / Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nabil Bank Commercial Kitchen Term Loan"
                    value={loanName}
                    onChange={(e) => setLoanName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lender / Financial Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nabil Bank Limited"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Loan Category *
                  </label>
                  <select
                    value={loanCategory}
                    onChange={(e) => {
                      setLoanCategory(e.target.value);
                      if (e.target.value === 'Short-Term Loans') setLoanClass('CURRENT');
                      else setLoanClass('NON_CURRENT');
                    }}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  >
                    <option value="Long-Term Bank Loans">Long-Term Bank Loans (Acc. 2500)</option>
                    <option value="Long-Term Borrowings">Long-Term Borrowings (Acc. 2510)</option>
                    <option value="Short-Term Loans">Short-Term Loans / Overdraft (Acc. 2110)</option>
                    <option value="Other Long-Term Liabilities">Directors / Partners Loan (Acc. 2590)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Loan Reference / Sanction #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LN-NAB-2026-001"
                    value={loanRefNum}
                    onChange={(e) => setLoanRefNum(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Principal Loan Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="0.00"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Annual Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="10.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Loan Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Maturity Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Disbursement Bank & Capitalization */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoCapitalizeLoan"
                    checked={autoCapitalize}
                    onChange={(e) => setAutoCapitalize(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
                  />
                  <label htmlFor="autoCapitalizeLoan" className="font-semibold text-slate-800 dark:text-slate-200">
                    Auto-disburse to Bank Account &amp; Post Capitalization Entry
                  </label>
                </div>

                {autoCapitalize && (
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Receiving Bank Account *
                    </label>
                    <select
                      value={disbursementAccountId}
                      onChange={(e) => setDisbursementAccountId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                    >
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.accountCode}) — Current Balance: Rs. {acc.currentBalance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Accounting Entry: Debit Receiving Bank (Asset) | Credit Loan Principal Account (Liability). Does not impact Income.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLoanModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Register Loan Facility</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD LOAN REPAYMENT (SPLIT PRINCIPAL & INTEREST)                */}
      {/* ========================================================================= */}
      {isRepayModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <CreditCard className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Record Loan Repayment: {selectedLoan.loanReferenceNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Separates principal reduction from interest expense in General Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRepayModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordRepayment} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Outstanding Principal</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Rs. {selectedLoan.outstandingPrincipal.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Lender / Facility</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedLoan.lenderName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Principal Repayment (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={repayPrincipal}
                    onChange={(e) => setRepayPrincipal(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  />
                  <span className="text-[10px] text-slate-400">Debits Loan Liability (Acc. {selectedLoan.linkedAccountCode})</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Interest Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={repayInterest}
                    onChange={(e) => setRepayInterest(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:border-[#0B3D32]"
                  />
                  <span className="text-[10px] text-slate-400">Debits Interest Expense (Acc. 6100)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={repayDate}
                    onChange={(e) => setRepayDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Disbursing Bank / Cash Account *
                  </label>
                  <select
                    value={repayAccountId}
                    onChange={(e) => setRepayAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cheque / Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-928347 or Bank Tx ID"
                  value={repayRef}
                  onChange={(e) => setRepayRef(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono focus:outline-hidden focus:border-[#0B3D32]"
                />
              </div>

              {/* Total Settlement Calculation Card */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Bank Outflow (Credit Cash/Bank):</span>
                  <span className="text-sm">
                    Rs. {((Number(repayPrincipal) || 0) + (Number(repayInterest) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  Compliance Notice: The principal repayment portion directly reduces loan obligation on the Balance Sheet and is never treated as a deductible operational expense.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Post Repayment to GL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: AGING & LIABILITIES REPORTS MODAL                                 */}
      {/* ========================================================================= */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <BarChart3 className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Liabilities Portfolio &amp; Aging Reports
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Detailed maturity profile, overdue obligations matrix, and category balances
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportsLoading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                <span>Generating liabilities analytics...</span>
              </div>
            ) : reportsData ? (
              <div className="space-y-4 text-xs">
                {/* High-level Totals */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Total Liabilities</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      Rs. {reportsData.totalLiabilities.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Current (≤ 12 Months)</span>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                      Rs. {reportsData.currentTotal.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Non-Current (Long-Term)</span>
                    <div className="text-base font-bold text-[#0B3D32] dark:text-emerald-400">
                      Rs. {reportsData.nonCurrentTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Aging Matrix Table */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Obligations Aging Breakdown
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Current / Not Due</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1">
                        Rs. {reportsData.aging.notDue.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase">1 - 30 Days</div>
                      <div className="font-bold text-amber-600 mt-1">
                        Rs. {reportsData.aging.days1To30.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase">31 - 60 Days</div>
                      <div className="font-bold text-amber-600 mt-1">
                        Rs. {reportsData.aging.days31To60.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <div className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold uppercase">61 - 90 Days</div>
                      <div className="font-bold text-rose-600 mt-1">
                        Rs. {reportsData.aging.days61To90.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                      <div className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold uppercase">90+ Days Overdue</div>
                      <div className="font-bold text-rose-700 dark:text-rose-400 mt-1">
                        Rs. {reportsData.aging.days90Plus.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown Table */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Obligations by Category
                  </h4>
                  <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                          <th className="py-2 px-3">Category Name</th>
                          <th className="py-2 px-3 text-center">Active Obligations</th>
                          <th className="py-2 px-3 text-right">Total Outstanding</th>
                          <th className="py-2 px-3 text-right">Overdue Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reportsData.categoryBreakdown.map((cat) => (
                          <tr key={cat.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{cat.category}</td>
                            <td className="py-2 px-3 text-center text-slate-600">{cat.count}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              Rs. {cat.totalOutstanding.toLocaleString()}
                            </td>
                            <td className={`py-2 px-3 text-right font-semibold ${cat.overdueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {cat.overdueAmount > 0 ? `Rs. ${cat.overdueAmount.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ACCOUNT MAPPING CONFIGURATION MODAL                              */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B3D32] dark:text-emerald-400">
                  <Tag className="w-5 h-5 stroke-[1.25]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Chart of Accounts Liability Classifications
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Standard 2000-2999 liability accounts mapped to categories and current/non-current schedules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                      <th className="py-2 px-3">Account Code</th>
                      <th className="py-2 px-3">Account Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Classification</th>
                      <th className="py-2 px-3 text-right">GL Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accountConfigs.map((cfg) => (
                      <tr key={cfg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                          {cfg.accountCode}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {cfg.accountName}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {cfg.category}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cfg.classification === 'CURRENT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                            {cfg.classification}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          Rs. {cfg.currentBalance.toLocaleString()}
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
    </div>
  );
}


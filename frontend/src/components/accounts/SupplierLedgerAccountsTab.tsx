'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import { useDebounce } from '@/lib/useDebounce';
import {
  ArrowLeft,
  Truck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Download,
  Eye,
  CreditCard,
  RotateCcw,
  Ban,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  Receipt,
  Building2,
  DollarSign,
  User,
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Calendar,
  Percent,
  Check,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Wallet,
  Landmark,
  Scale
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  SupplierRecord,
  SupplierLedgerEntryData,
  SupplierLedgerSummary,
  SupplierUnpaidPurchaseData,
  SupplierAgingReport,
  SupplierStatementReport
} from '@/lib/types';

export default function SupplierLedgerAccountsTab() {
  // Suppliers List State
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Selected Supplier & Ledger Filter State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [datePreset, setDatePreset] = useState<'today' | 'thisMonth' | 'fiscalYear' | 'all'>('thisMonth');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [outletFilter, setOutletFilter] = useState('ALL');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState('');
  const debouncedInvoiceNumberSearch = useDebounce(invoiceNumberSearch, 350);

  // Ledger Data State
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntryData[]>([]);
  const [periodOpeningBalance, setPeriodOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [summary, setSummary] = useState<SupplierLedgerSummary>({
    openingPayableBalance: 0,
    totalPurchases: 0,
    totalPayments: 0,
    purchaseReturns: 0,
    debitNotes: 0,
    creditNotes: 0,
    outstandingPayable: 0,
    supplierAdvanceBalance: 0,
    overdueAmount: 0,
  });

  // Pagination for Ledger Table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  // 1. Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [unpaidPurchases, setUnpaidPurchases] = useState<SupplierUnpaidPurchaseData[]>([]);
  const [allocations, setAllocations] = useState<{ [purchaseId: string]: number }>({});
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('CASH');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payVoucherNo, setPayVoucherNo] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payOutlet, setPayOutlet] = useState('Main Kitchen');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // 2. Record Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState<number>(0);
  const [advMode, setAdvMode] = useState<string>('BANK');
  const [advDate, setAdvDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [advRef, setAdvRef] = useState('');
  const [advNotes, setAdvNotes] = useState('');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  // 3. Allocate Advance Modal
  const [isAllocateAdvanceModalOpen, setIsAllocateAdvanceModalOpen] = useState(false);
  const [advanceAllocations, setAdvanceAllocations] = useState<{ [purchaseId: string]: number }>({});
  const [isSubmittingAdvanceAlloc, setIsSubmittingAdvanceAlloc] = useState(false);

  // 4. Controlled Account Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjRef, setAdjRef] = useState('');
  const [adjApprovedBy, setAdjApprovedBy] = useState('Accounting Manager');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // 5. Aging Analysis Modal
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [agingData, setAgingData] = useState<SupplierAgingReport | null>(null);
  const [isLoadingAging, setIsLoadingAging] = useState(false);

  // 6. Statement Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<SupplierStatementReport | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  // 7. Transaction Drilldown Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SupplierLedgerEntryData | null>(null);

  // Date Preset Helper
  const setPresetDates = (preset: 'today' | 'thisMonth' | 'fiscalYear' | 'all') => {
    setDatePreset(preset);
    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const d = fmt(now);
      setDateFrom(d);
      setDateTo(d);
    } else if (preset === 'thisMonth') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFrom(fmt(first));
      setDateTo(fmt(last));
    } else if (preset === 'fiscalYear') {
      const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      const startFy = new Date(year, 6, 16);
      const endFy = new Date(year + 1, 6, 15);
      setDateFrom(fmt(startFy));
      setDateTo(fmt(endFy));
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
    setPage(1);
  };

  // Set default to This Month on load
  useEffect(() => {
    setPresetDates('thisMonth');
  }, []);

  // Fetch Suppliers List
  const loadSuppliers = useCallback(async () => {
    setIsLoadingSuppliers(true);
    try {
      const list = await api.getSuppliers();
      setSuppliers(list || []);
      if (list && list.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, [selectedSupplierId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Load Selected Supplier Ledger
  const loadSupplierLedger = useCallback(async () => {
    if (!selectedSupplierId) return;

    setIsLoadingLedger(true);
    setLedgerError(null);
    try {
      const res = await api.getSupplierLedgerV2(selectedSupplierId, {
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        transactionType: transactionTypeFilter !== 'ALL' ? transactionTypeFilter : undefined,
        outlet: outletFilter !== 'ALL' ? outletFilter : undefined,
        outstandingOnly: outstandingOnly,
        overdueOnly: overdueOnly,
        invoiceNumber: debouncedInvoiceNumberSearch.trim() || undefined,
      });

      setSelectedSupplier(res?.supplier || null);
      setPeriodOpeningBalance(res?.periodOpeningBalance ?? 0);
      setClosingBalance(res?.closingBalance ?? 0);
      if (res?.summary) {
        setSummary({
          openingPayableBalance: res.summary.openingPayableBalance ?? res.periodOpeningBalance ?? 0,
          totalPurchases: res.summary.totalPurchases ?? (res.summary as any).totalCredit ?? 0,
          totalPayments: res.summary.totalPayments ?? (res.summary as any).totalDebit ?? 0,
          purchaseReturns: res.summary.purchaseReturns ?? 0,
          debitNotes: res.summary.debitNotes ?? 0,
          creditNotes: res.summary.creditNotes ?? 0,
          outstandingPayable: res.summary.outstandingPayable ?? (res.summary as any).outstandingBalance ?? 0,
          supplierAdvanceBalance: res.summary.supplierAdvanceBalance ?? 0,
          overdueAmount: res.summary.overdueAmount ?? 0,
          creditLimit: res.summary.creditLimit,
          paymentTermsDays: res.summary.paymentTermsDays,
        });
      }
      setLedgerEntries(res?.entries || []);
    } catch (err: any) {
      setLedgerError(err?.message || 'Failed to load supplier ledger');
    } finally {
      setIsLoadingLedger(false);
    }
  }, [selectedSupplierId, dateFrom, dateTo, transactionTypeFilter, outletFilter, outstandingOnly, overdueOnly, debouncedInvoiceNumberSearch]);

  useEffect(() => {
    if (selectedSupplierId) {
      loadSupplierLedger();
    }
  }, [selectedSupplierId, dateFrom, dateTo, transactionTypeFilter, outletFilter, outstandingOnly, overdueOnly, loadSupplierLedger]);

  // Filtered Suppliers for Dropdown / Selector
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (categoryFilter !== 'ALL' && s.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (!supplierSearch.trim()) return true;
      const q = supplierSearch.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.panVatNumber && s.panVatNumber.toLowerCase().includes(q))
      );
    });
  }, [suppliers, categoryFilter, supplierSearch]);

  // Pagination slice for Ledger Table
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ledgerEntries.slice(start, start + pageSize);
  }, [ledgerEntries, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(ledgerEntries.length / pageSize));

  // Open Record Payment Modal
  const handleOpenPaymentModal = async () => {
    if (!selectedSupplierId) return;
    setIsSubmittingPayment(false);
    setPayMode('CASH');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef('');
    setPayVoucherNo(`PV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPayNotes('');
    setPayOutlet('Main Kitchen');

    try {
      const unpaids = await api.getSupplierUnpaidPurchases(selectedSupplierId);
      setUnpaidPurchases(unpaids || []);

      // Auto-allocate against all unpaid purchases if total due > 0
      const initAlloc: { [k: string]: number } = {};
      let totalDue = 0;
      (unpaids || []).forEach((p) => {
        initAlloc[p.id] = p.dueAmount;
        totalDue += p.dueAmount;
      });
      setAllocations(initAlloc);
      setPayAmount(totalDue > 0 ? totalDue : (summary.outstandingPayable > 0 ? summary.outstandingPayable : 0));
      setIsPaymentModalOpen(true);
    } catch (e: any) {
      alert('Failed to load unpaid purchases for payment allocation: ' + (e?.message || ''));
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) return;

    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    const allocList = Object.entries(allocations)
      .filter(([_, amt]) => amt > 0)
      .map(([id, amt]) => ({ purchaseOrderId: id, amount: amt }));

    const totalAlloc = allocList.reduce((acc, curr) => acc + curr.amount, 0);
    if (totalAlloc > payAmount + 0.01) {
      alert(`Total allocated amount (Rs. ${totalAlloc.toFixed(2)}) cannot exceed payment amount (Rs. ${payAmount.toFixed(2)}).`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await api.recordSupplierPaymentMulti(selectedSupplierId, {
        amount: payAmount,
        paymentMode: payMode,
        paymentDate: payDate,
        referenceNumber: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
        voucherNumber: payVoucherNo.trim() || undefined,
        branchOrOutlet: payOutlet,
        paidBy: 'Accounts Cashier',
        allocations: allocList,
      });

      setIsPaymentModalOpen(false);
      loadSupplierLedger();
      loadSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to record supplier payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open Advance Modal
  const handleOpenAdvanceModal = () => {
    setAdvAmount(0);
    setAdvMode('BANK');
    setAdvDate(new Date().toISOString().slice(0, 10));
    setAdvRef('');
    setAdvNotes('');
    setIsAdvanceModalOpen(true);
  };

  // Submit Advance
  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || advAmount <= 0) {
      alert('Advance amount must be greater than zero.');
      return;
    }

    setIsSubmittingAdvance(true);
    try {
      await api.recordSupplierAdvance(selectedSupplierId, {
        amount: advAmount,
        paymentMode: advMode,
        paymentDate: advDate,
        referenceNumber: advRef.trim() || undefined,
        notes: advNotes.trim() || undefined,
        branchOrOutlet: 'Main Kitchen',
        paidBy: 'Accounts Cashier',
      });

      setIsAdvanceModalOpen(false);
      loadSupplierLedger();
      loadSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to record advance');
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  // Open Allocate Advance Modal
  const handleOpenAllocateAdvance = async () => {
    if (!selectedSupplierId) return;
    try {
      const unpaids = await api.getSupplierUnpaidPurchases(selectedSupplierId);
      setUnpaidPurchases(unpaids || []);
      setAdvanceAllocations({});
      setIsAllocateAdvanceModalOpen(true);
    } catch (e: any) {
      alert('Failed to load unpaid purchases: ' + (e?.message || ''));
    }
  };

  // Submit Advance Allocation
  const handleSubmitAllocateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) return;

    const allocList = Object.entries(advanceAllocations)
      .filter(([_, amt]) => amt > 0)
      .map(([id, amt]) => ({ purchaseOrderId: id, amount: amt }));

    if (allocList.length === 0) {
      alert('Please specify an allocation amount for at least one purchase invoice.');
      return;
    }

    const totalAlloc = allocList.reduce((acc, curr) => acc + curr.amount, 0);
    if (totalAlloc > (selectedSupplier?.advanceBalance || 0) + 0.01) {
      alert(`Allocated amount (Rs. ${totalAlloc.toFixed(2)}) exceeds available advance balance (Rs. ${(selectedSupplier?.advanceBalance || 0).toFixed(2)}).`);
      return;
    }

    setIsSubmittingAdvanceAlloc(true);
    try {
      await api.allocateSupplierAdvance(selectedSupplierId, {
        allocations: allocList,
        notes: 'Advance Balance Allocated against purchase invoice(s)',
        authorizedBy: 'Store Incharge',
      });

      setIsAllocateAdvanceModalOpen(false);
      loadSupplierLedger();
      loadSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to allocate advance balance');
    } finally {
      setIsSubmittingAdvanceAlloc(false);
    }
  };

  // Open Adjustment Modal
  const handleOpenAdjustmentModal = () => {
    setAdjType('DEBIT');
    setAdjAmount(0);
    setAdjReason('');
    setAdjRef('');
    setAdjApprovedBy('Accounting Manager');
    setIsAdjustmentModalOpen(true);
  };

  // Submit Adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || adjAmount <= 0 || !adjReason.trim()) {
      alert('Please enter a valid amount and mandatory adjustment reason.');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      await api.createSupplierAdjustment(selectedSupplierId, {
        adjustmentType: adjType,
        amount: adjAmount,
        reason: adjReason.trim(),
        referenceNumber: adjRef.trim() || undefined,
        approvedBy: adjApprovedBy.trim() || 'Accounting Manager',
      });

      setIsAdjustmentModalOpen(false);
      loadSupplierLedger();
      loadSuppliers();
    } catch (err: any) {
      alert(err?.message || 'Failed to post adjustment');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Open Aging Modal
  const handleOpenAgingModal = async () => {
    if (!selectedSupplierId) return;
    setIsLoadingAging(true);
    setIsAgingModalOpen(true);
    try {
      const data = await api.getSupplierAgingReport(selectedSupplierId);
      setAgingData(data);
    } catch (err: any) {
      alert('Failed to load aging report: ' + (err?.message || ''));
      setIsAgingModalOpen(false);
    } finally {
      setIsLoadingAging(false);
    }
  };

  // Open Statement Modal
  const handleOpenStatementModal = async () => {
    if (!selectedSupplierId) return;
    setIsLoadingStatement(true);
    setIsStatementModalOpen(true);
    try {
      const data = await api.getSupplierStatementReport(selectedSupplierId, {
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
      });
      setStatementData(data);
    } catch (err: any) {
      alert('Failed to load statement: ' + (err?.message || ''));
      setIsStatementModalOpen(false);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) {
      alert('No ledger transactions to export.');
      return;
    }

    const headers = [
      'Date',
      'Transaction No',
      'Type',
      'Purchase / Invoice No',
      'Description',
      'Due Date',
      'Debit (Rs.)',
      'Credit (Rs.)',
      'Running Balance (Rs.)',
      'Status',
      'Outlet',
      'Created By'
    ];

    const rows = [
      [
        dateFrom || 'Opening',
        'OB',
        'OPENING_BALANCE',
        '-',
        'Period Opening Balance',
        '-',
        '0.00',
        '0.00',
        periodOpeningBalance.toFixed(2),
        '-',
        '-',
        'System'
      ],
      ...ledgerEntries.map((e) => [
        e.entryDate ? e.entryDate.slice(0, 10) : '-',
        e.transactionNumber || '-',
        e.referenceType,
        e.purchaseInvoiceNumber || e.purchaseOrderNumber || '-',
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.dueDate || '-',
        e.debitAmount.toFixed(2),
        e.creditAmount.toFixed(2),
        e.balance.toFixed(2),
        e.status,
        e.branchOrOutlet || '-',
        e.createdBy || '-'
      ])
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Supplier_Ledger_${selectedSupplier?.name || 'All'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton
            href="/accounts"
            label="Back"
            onClick={selectedSupplier ? () => setSelectedSupplier(null) : undefined}
          />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Supplier Ledger</span>
            {selectedSupplier && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {selectedSupplier.name}
              </span>
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadSupplierLedger}
            disabled={isLoadingLedger}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLedger ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenStatementModal}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Statement</span>
          </button>

          <button
            onClick={handleOpenAgingModal}
            className="px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 rounded border border-violet-200 dark:border-violet-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Aging Report</span>
          </button>

          <button
            onClick={handleOpenAdjustmentModal}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Adjust Account</span>
          </button>

          <button
            onClick={handleOpenAdvanceModal}
            className="px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/60 hover:bg-teal-200 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Pay Advance</span>
          </button>

          <button
            onClick={handleOpenPaymentModal}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 3. Supplier Selector & Advanced Filter Panel */}
      <div className="p-3.5 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-3">
        {/* Row A: Supplier Picker & Period Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Supplier Picker */}
          <div className="md:col-span-1 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Select Supplier *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
            >
              {filteredSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'SUP'}) - Balance: Rs. {(s.currentBalance || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Reporting Accounting Period
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
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

              <div className="flex items-center gap-1 ml-auto">
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
                <span className="text-slate-400">to</span>
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
          </div>
        </div>

        {/* Row B: Secondary Filters & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Supplier Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Search supplier name, PAN, phone..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Invoice / Purchase No search */}
          <div>
            <input
              type="text"
              value={invoiceNumberSearch}
              onChange={(e) => setInvoiceNumberSearch(e.target.value)}
              placeholder="Search Invoice No..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="PURCHASE_CREDIT">Credit Purchase</option>
              <option value="CASH_PURCHASE">Cash Purchase</option>
              <option value="PAYMENT">Supplier Payment</option>
              <option value="SUPPLIER_ADVANCE">Supplier Advance</option>
              <option value="ADVANCE_ALLOCATION">Advance Allocation</option>
              <option value="PURCHASE_RETURN">Purchase Return</option>
              <option value="DEBIT_NOTE">Debit Note</option>
              <option value="ACCOUNT_ADJUSTMENT">Account Adjustment</option>
              <option value="OPENING_BALANCE">Opening Balance</option>
            </select>
          </div>

          {/* Outlet */}
          <div>
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            >
              <option value="ALL">All Outlets / Branches</option>
              <option value="Main Kitchen">Main Kitchen</option>
              <option value="Restaurant Dine-In">Restaurant Dine-In</option>
              <option value="Rooftop Bar">Rooftop Bar</option>
              <option value="Banquet Hall">Banquet Hall</option>
            </select>
          </div>

          {/* Toggles: Outstanding Only & Overdue Only */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={outstandingOnly}
                onChange={(e) => setOutstandingOnly(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Outstanding Only</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>Overdue</span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Selected Supplier Information Panel */}
      {selectedSupplier && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0B3D32] text-white flex items-center justify-center font-bold text-sm">
                {selectedSupplier.name ? selectedSupplier.name.slice(0, 2).toUpperCase() : 'SU'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{selectedSupplier.name}</h2>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                    {selectedSupplier.code || 'SUP'}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedSupplier.category || 'General'}
                  </span>
                  {selectedSupplier.supplierType && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {selectedSupplier.supplierType}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 mt-1">
                  {selectedSupplier.contactPerson && <span>Contact: {selectedSupplier.contactPerson}</span>}
                  {selectedSupplier.phone && <span>Phone: {selectedSupplier.phone}</span>}
                  {selectedSupplier.panVatNumber && <span>PAN/VAT: {selectedSupplier.panVatNumber}</span>}
                  {selectedSupplier.address && <span>Location: {selectedSupplier.address}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Payment Terms</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedSupplier.paymentTermsDays ? `${selectedSupplier.paymentTermsDays} Days` : 'Net 30'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Credit Limit</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedSupplier.creditLimit && selectedSupplier.creditLimit > 0
                    ? `Rs. ${(selectedSupplier.creditLimit || 0).toLocaleString()}`
                    : 'No Limit'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Advance Balance</div>
                <div className="font-bold text-teal-600 dark:text-teal-400">
                  Rs. {(selectedSupplier.advanceBalance || 0).toLocaleString()}
                </div>
              </div>
              {selectedSupplier.advanceBalance && selectedSupplier.advanceBalance > 0 && (
                <button
                  type="button"
                  onClick={handleOpenAllocateAdvance}
                  className="px-2 py-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer"
                >
                  Allocate Advance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Chronological Supplier Ledger Transaction Table */}
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        {isLoadingLedger ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading supplier financial history...</span>
          </div>
        ) : ledgerError ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            <span>{ledgerError}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Txn No / Voucher</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Invoice No / Ref</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Debit (Rs.)</th>
                  <th className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400">Credit (Rs.)</th>
                  <th className="py-2.5 px-3 text-right font-black">Running Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {/* Opening Balance Row */}
                <tr className="bg-slate-50/70 dark:bg-slate-900/30 font-semibold italic text-slate-600 dark:text-slate-400">
                  <td className="py-2 px-3">{dateFrom || 'Period Start'}</td>
                  <td className="py-2 px-3 font-mono text-[10px]">OB</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      OPENING
                    </span>
                  </td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3">Opening Balance Carried Forward</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-right font-mono">-</td>
                  <td className="py-2 px-3 text-right font-mono">-</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    Rs. {(periodOpeningBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {paginatedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No transactions recorded in this period for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map((e) => {
                    const isCredit = e.creditAmount > 0;
                    const isDebit = e.debitAmount > 0;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {e.entryDate ? e.entryDate.slice(0, 10) : '-'}
                        </td>

                        <td className="py-2 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {e.transactionNumber || '-'}
                        </td>

                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              e.referenceType === 'PAYMENT' || e.referenceType === 'BANK_PAYMENT' || e.referenceType === 'CASH_PAYMENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : e.referenceType === 'SUPPLIER_ADVANCE'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                : e.referenceType === 'PURCHASE_RETURN' || e.referenceType === 'DEBIT_NOTE'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : e.referenceType === 'ACCOUNT_ADJUSTMENT'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {e.referenceType.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">
                          {e.purchaseInvoiceNumber || e.purchaseOrderNumber || '-'}
                        </td>

                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={e.description}>
                          {e.description}
                        </td>

                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {e.dueDate ? e.dueDate.slice(0, 10) : '-'}
                        </td>

                        {/* Debit */}
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {isDebit ? `Rs. ${e.debitAmount.toFixed(2)}` : '-'}
                        </td>

                        {/* Credit */}
                        <td className="py-2 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {isCredit ? `Rs. ${e.creditAmount.toFixed(2)}` : '-'}
                        </td>

                        {/* Running Balance */}
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          Rs. {(e.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-[9px] font-normal text-slate-400 ml-1">
                            {e.balance >= 0 ? 'Cr' : 'Dr (Adv)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              e.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : e.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : e.status === 'ADVANCE'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEntry(e);
                              setDetailModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="View Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Permanent DataTables Pagination Controls Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A]">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {ledgerEntries.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, ledgerEntries.length)} of {ledgerEntries.length} entries
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-1.5 py-0.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden"
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pNum = page - 2 + i;
                if (pNum > totalPages) pNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-7 h-7 text-xs font-bold rounded transition-colors ${
                    page === pNum
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD SUPPLIER PAYMENT WITH MULTI-INVOICE ALLOCATION           */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs my-8">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-300 stroke-[1.25]" />
                <span className="font-bold">Record Supplier Payment ({selectedSupplier.name})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Payment Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Account</option>
                    <option value="QR">FonePay / QR</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Debit/Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Voucher No
                  </label>
                  <input
                    type="text"
                    value={payVoucherNo}
                    onChange={(e) => setPayVoucherNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Reference / Cheque
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. TXN-4912, Cheque #8812"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet
                  </label>
                  <select
                    value={payOutlet}
                    onChange={(e) => setPayOutlet(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value="Main Kitchen">Main Kitchen</option>
                    <option value="Restaurant Dine-In">Restaurant Dine-In</option>
                    <option value="Rooftop Bar">Rooftop Bar</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Description / Notes
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Remarks or payment notes"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              {/* Unpaid Purchase Invoices Allocation Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Allocate to Outstanding Purchase Invoices:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Total Allocated: Rs.{' '}
                    {Object.values(allocations)
                      .reduce((a, b) => a + (b || 0), 0)
                      .toFixed(2)}{' '}
                    / Rs. {payAmount.toFixed(2)}
                  </span>
                </div>

                {unpaidPurchases.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    No outstanding purchase invoices found. Entire payment amount will be recorded as a Supplier Advance.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-2.5">Purchase No</th>
                          <th className="py-2 px-2">Inv No</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2 text-right">Total Bill</th>
                          <th className="py-2 px-2 text-right text-rose-600">Due Amount</th>
                          <th className="py-2 px-2 text-right">Allocate (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {unpaidPurchases.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-2.5 font-bold font-mono">{po.purchaseNumber}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-500">{po.supplierInvoiceNumber || '-'}</td>
                            <td className="py-1.5 px-2 text-slate-500">{po.purchaseDate}</td>
                            <td className="py-1.5 px-2 text-right font-mono">Rs. {po.grandTotal.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-600">
                              Rs. {po.dueAmount.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                max={po.dueAmount}
                                step="any"
                                value={allocations[po.id] ?? 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [po.id]: Math.min(po.dueAmount, val),
                                  }));
                                }}
                                className="w-24 px-1.5 py-0.5 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 rounded flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm &amp; Post Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD SUPPLIER ADVANCE PAYMENT                                 */}
      {/* ========================================================================= */}
      {isAdvanceModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-teal-800 text-white">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="font-bold">Pay Supplier Advance ({selectedSupplier.name})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-teal-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className="p-4 space-y-3">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded text-teal-800 dark:text-teal-300 text-[11px]">
                Advance payments are recorded as a Current Asset (Prepayment) and can be allocated against future supplier purchase bills.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={advMode}
                    onChange={(e) => setAdvMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="QR">FonePay / QR</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Bank Slip
                </label>
                <input
                  type="text"
                  value={advRef}
                  onChange={(e) => setAdvRef(e.target.value)}
                  placeholder="e.g. Bank slip or transaction id"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={advNotes}
                  onChange={(e) => setAdvNotes(e.target.value)}
                  placeholder="Reason for advance payment"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvance}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center gap-1.5"
                >
                  {isSubmittingAdvance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Disburse Advance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ALLOCATE SUPPLIER ADVANCE TO BILLS                              */}
      {/* ========================================================================= */}
      {isAllocateAdvanceModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs my-8">
            <div className="flex items-center justify-between p-3.5 bg-teal-800 text-white">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="font-bold">Allocate Supplier Advance Balance</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAllocateAdvanceModalOpen(false)}
                className="text-teal-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAllocateAdvance} className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded">
                <div>
                  <span className="text-slate-500 block">Available Advance Balance:</span>
                  <span className="text-base font-black text-teal-800 dark:text-teal-200 font-mono">
                    Rs. {(selectedSupplier.advanceBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Allocated in this request:</span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                    Rs.{' '}
                    {Object.values(advanceAllocations)
                      .reduce((a, b) => a + (b || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Select Unpaid Purchase Bills:
                </span>
                {unpaidPurchases.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded">
                    No unpaid purchases found for this supplier.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-2.5">Purchase No</th>
                          <th className="py-2 px-2">Inv No</th>
                          <th className="py-2 px-2 text-right">Due Amount</th>
                          <th className="py-2 px-2 text-right">Allocate (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {unpaidPurchases.map((po) => (
                          <tr key={po.id}>
                            <td className="py-1.5 px-2.5 font-bold font-mono">{po.purchaseNumber}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-500">{po.supplierInvoiceNumber || '-'}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-600">
                              Rs. {po.dueAmount.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                max={po.dueAmount}
                                step="any"
                                value={advanceAllocations[po.id] ?? 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setAdvanceAllocations((prev) => ({
                                    ...prev,
                                    [po.id]: Math.min(po.dueAmount, val),
                                  }));
                                }}
                                className="w-24 px-1.5 py-0.5 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocateAdvanceModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvanceAlloc}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded flex items-center gap-1.5"
                >
                  {isSubmittingAdvanceAlloc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Apply Advance to Invoices</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONTROLLED ACCOUNT ADJUSTMENT                                    */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-300" />
                <span className="font-bold">Controlled Account Adjustment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('DEBIT')}
                    className={`p-2 rounded text-center font-bold border transition-colors ${
                      adjType === 'DEBIT'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    DEBIT (Reduces Payable)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('CREDIT')}
                    className={`p-2 rounded text-center font-bold border transition-colors ${
                      adjType === 'CREDIT'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    CREDIT (Increases Payable)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Reason * (Mandatory for audit trail)
                </label>
                <textarea
                  rows={2}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Discrepancy reconciliation, approved supplier concession"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supporting Reference
                </label>
                <input
                  type="text"
                  value={adjRef}
                  onChange={(e) => setAdjRef(e.target.value)}
                  placeholder="e.g. Email approval reference"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Authorized By
                </label>
                <input
                  type="text"
                  value={adjApprovedBy}
                  onChange={(e) => setAdjApprovedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded flex items-center gap-1.5"
                >
                  {isSubmittingAdjustment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  <span>Post Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: AGING ANALYSIS MODAL                                            */}
      {/* ========================================================================= */}
      {isAgingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs my-8">
            <div className="flex items-center justify-between p-3.5 bg-violet-900 text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-bold">Accounts Payable Aging Analysis ({selectedSupplier?.name})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAgingModalOpen(false)}
                className="text-violet-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingAging || !agingData ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
                <span>Computing aging buckets...</span>
              </div>
            ) : (
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* 5-Bucket Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded">
                    <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Current / Not Due</div>
                    <div className="text-sm font-black text-emerald-900 dark:text-emerald-200 mt-1 font-mono">
                      Rs. {agingData.currentNotDue.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">1–30 Days Overdue</div>
                    <div className="text-sm font-black text-blue-900 dark:text-blue-200 mt-1 font-mono">
                      Rs. {agingData.overdue1to30.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded">
                    <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">31–60 Days Overdue</div>
                    <div className="text-sm font-black text-amber-900 dark:text-amber-200 mt-1 font-mono">
                      Rs. {agingData.overdue31to60.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded">
                    <div className="text-[10px] uppercase font-bold text-orange-800 dark:text-orange-300">61–90 Days Overdue</div>
                    <div className="text-sm font-black text-orange-900 dark:text-orange-200 mt-1 font-mono">
                      Rs. {agingData.overdue61to90.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded">
                    <div className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">&gt; 90 Days Overdue</div>
                    <div className="text-sm font-black text-rose-900 dark:text-rose-200 mt-1 font-mono">
                      Rs. {agingData.overdueAbove90.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Overdue Invoices Breakdown Table */}
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Outstanding Invoices Breakdown ({agingData.invoices.length} invoices)
                  </h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-2.5">Purchase No</th>
                          <th className="py-2 px-2">Inv No</th>
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2">Due Date</th>
                          <th className="py-2 px-2 text-right">Days Overdue</th>
                          <th className="py-2 px-2 text-right">Due Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {agingData.invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-1.5 px-2.5 font-bold font-mono">{inv.purchaseNumber}</td>
                            <td className="py-1.5 px-2 font-mono text-slate-500">{inv.supplierInvoiceNumber || '-'}</td>
                            <td className="py-1.5 px-2 text-slate-500">{inv.purchaseDate}</td>
                            <td className="py-1.5 px-2 font-mono">{inv.dueDate}</td>
                            <td className="py-1.5 px-2 text-right font-bold">
                              {inv.isOverdue ? (
                                <span className="text-rose-600">{inv.daysOverdue} days</span>
                              ) : (
                                <span className="text-emerald-600">Not due</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {inv.dueAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAgingModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-violet-800 hover:bg-violet-900 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: A4 PRINTABLE SUPPLIER STATEMENT                                  */}
      {/* ========================================================================= */}
      {isStatementModalOpen && statementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden my-8 p-6 print:p-0 print:m-0 print:border-none print:shadow-none">
            {/* Top Toolbar (hidden on print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <span className="font-bold text-sm text-[#0B3D32]">Supplier Statement Print Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => setIsStatementModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Statement Document */}
            <div className="space-y-4 text-xs font-sans">
              {/* Hotel Header */}
              <div className="text-center pb-3 border-b-2 border-slate-800">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {statementData.restaurantName}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  {statementData.restaurantAddress} | Phone: {statementData.restaurantPhone} | PAN: {statementData.restaurantPan}
                </p>
                <div className="inline-block px-3 py-0.5 mt-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  OFFICIAL SUPPLIER STATEMENT OF ACCOUNT
                </div>
              </div>

              {/* Meta & Supplier Info */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Supplier Details:</div>
                  <div className="font-bold text-sm text-slate-900">{statementData.supplier.name}</div>
                  <div>Supplier Code: {statementData.supplier.code}</div>
                  <div>Contact Person: {statementData.supplier.contactPerson || '-'}</div>
                  <div>Phone: {statementData.supplier.phone || '-'}</div>
                  <div>PAN / VAT No: {statementData.supplier.panVatNumber || 'N/A'}</div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Statement Meta:</div>
                  <div>Statement No: <strong className="font-mono text-slate-900">{statementData.statementNumber}</strong></div>
                  <div>Date Issued: {statementData.statementDate}</div>
                  <div>Statement Period: {statementData.startDate} to {statementData.endDate}</div>
                  <div>Opening Balance: <span className="font-mono font-bold">Rs. {statementData.openingBalance.toFixed(2)}</span></div>
                  <div>Current Advance Balance: <span className="font-mono font-bold text-teal-700">Rs. {(statementData.supplier.advanceBalance || 0).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Chronological Transactions Table */}
              <div className="border border-slate-300 rounded overflow-hidden mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2">Ref No</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 text-right">Debit (Rs.)</th>
                      <th className="py-2 px-2 text-right">Credit (Rs.)</th>
                      <th className="py-2 px-2.5 text-right font-black">Balance (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50 italic">
                      <td className="py-1.5 px-2.5">{statementData.startDate}</td>
                      <td className="py-1.5 px-2 font-mono">OB</td>
                      <td className="py-1.5 px-2">OPENING</td>
                      <td className="py-1.5 px-2">Opening Payable Balance</td>
                      <td className="py-1.5 px-2 text-right font-mono">-</td>
                      <td className="py-1.5 px-2 text-right font-mono">-</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                        Rs. {statementData.openingBalance.toFixed(2)}
                      </td>
                    </tr>
                    {statementData.transactions.map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2.5">{t.date}</td>
                        <td className="py-1.5 px-2 font-mono">{t.referenceNumber}</td>
                        <td className="py-1.5 px-2 uppercase text-[10px]">{t.referenceType}</td>
                        <td className="py-1.5 px-2">{t.description}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-700">
                          {t.debit > 0 ? `Rs. ${t.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-amber-700">
                          {t.credit > 0 ? `Rs. ${t.credit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold">
                          Rs. {t.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 font-medium text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Period Purchases:</span>
                    <span className="font-mono">Rs. {statementData.totalPurchases.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Period Payments:</span>
                    <span className="font-mono">Rs. {statementData.totalPayments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                    <span>Closing Payable Balance:</span>
                    <span className="font-mono text-emerald-800">Rs. {statementData.closingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-4 gap-4 pt-16 text-center text-[10px] text-slate-600 uppercase font-semibold">
                <div className="border-t border-slate-400 pt-1">Prepared By</div>
                <div className="border-t border-slate-400 pt-1">Accounts Officer</div>
                <div className="border-t border-slate-400 pt-1">Internal Auditor</div>
                <div className="border-t border-slate-400 pt-1">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: TRANSACTION DETAIL MODAL                                         */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-300" />
                <span className="font-bold">Transaction Information</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Transaction Number</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedEntry.transactionNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedEntry.entryDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Transaction Type</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{selectedEntry.referenceType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Payment Mode</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedEntry.paymentMode || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Invoice / PO Reference</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedEntry.purchaseInvoiceNumber || selectedEntry.purchaseOrderNumber || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Outlet / Branch</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedEntry.branchOrOutlet || 'Main'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Description</span>
                <p className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedEntry.description}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Debit (Decreases Payable):</span>
                  <span className="font-mono font-bold text-emerald-600">Rs. {selectedEntry.debitAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit (Increases Payable):</span>
                  <span className="font-mono font-bold text-amber-600">Rs. {selectedEntry.creditAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                  <span>Balance after Transaction:</span>
                  <span className="font-mono text-slate-900 dark:text-white">Rs. {selectedEntry.balance.toFixed(2)}</span>
                </div>
              </div>

              {selectedEntry.journalEntryId && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Posted to General Ledger (JE: {selectedEntry.journalEntryId.slice(0, 8)})</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] rounded"
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


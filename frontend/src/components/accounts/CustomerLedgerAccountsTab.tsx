'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  DollarSign,
  CreditCard,
  Ban,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  Receipt,
  Download,
  Filter,
  Check,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  Phone,
  MapPin,
  FileSpreadsheet,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Building2,
  Printer,
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency } from '@/lib/utils';
import type {
  CustomerData,
  CustomerLedgerEntryData,
  CustomerUnpaidBillData,
  CustomerAgingReport,
  CustomerStatementReport
} from '@/lib/types';

export default function CustomerLedgerAccountsTab() {
  const toast = useToast();

  // Customers List State
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CASH' | 'CREDIT' | 'OUTSTANDING' | 'ADVANCE' | 'BLOCKED'>('ALL');
  const [outletFilter, setOutletFilter] = useState('ALL');

  // Selected Customer Ledger State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');

  // Pagination for Ledger Table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);

  // Receive Payment Modal
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
  const [selectedAllocations, setSelectedAllocations] = useState<{ [billId: string]: number }>({});
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Allocate Advance Modal
  const [isAllocateAdvanceOpen, setIsAllocateAdvanceOpen] = useState(false);
  const [advanceAllocations, setAdvanceAllocations] = useState<{ [billId: string]: number }>({});
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  // Account Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentRef, setAdjustmentRef] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Aging Analysis Modal
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [agingData, setAgingData] = useState<CustomerAgingReport | null>(null);
  const [isLoadingAging, setIsLoadingAging] = useState(false);

  // Statement / Print Modal
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementData, setStatementData] = useState<CustomerStatementReport | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  // Add / Edit Customer Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPanVat, setFormPanVat] = useState('');
  const [formCustomerType, setFormCustomerType] = useState<string>('CREDIT');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(10000);
  const [formCreditTerms, setFormCreditTerms] = useState<number>(30);
  const [formCreditStatus, setFormCreditStatus] = useState<string>('ACTIVE');
  const [formOpeningBalance, setFormOpeningBalance] = useState<number>(0);
  const [formBranch, setFormBranch] = useState('RESTAURANT');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch customers list
  const loadCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const data: any = await api.getCustomers();
      if (data && Array.isArray(data)) {
        setCustomers(data);
      } else if (data && data.items) {
        setCustomers(data.items);
      } else {
        setCustomers([]);
      }
    } catch (err: any) {
      toast.error('Failed to load customers', err.message || 'Network error');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Load customer ledger
  const loadCustomerLedger = useCallback(async (customerId: string) => {
    setIsLoadingLedger(true);
    try {
      const data = await api.getCustomerLedger(customerId, {
        fromDate: ledgerDateFrom || undefined,
        toDate: ledgerDateTo || undefined,
      });

      if (data) {
        setSelectedCustomer(data.customer);
        let entries = data.entries || [];
        if (transactionTypeFilter !== 'ALL') {
          entries = entries.filter((e: any) => e.referenceType === transactionTypeFilter);
        }
        setLedgerEntries(entries);
        setLedgerSummary(data.summary || null);
      }
    } catch (err: any) {
      toast.error('Failed to load customer ledger', err.message || 'Error loading records');
    } finally {
      setIsLoadingLedger(false);
    }
  }, [ledgerDateFrom, ledgerDateTo, transactionTypeFilter, toast]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerLedger(selectedCustomerId);
    }
  }, [selectedCustomerId, ledgerDateFrom, ledgerDateTo, transactionTypeFilter, loadCustomerLedger]);

  // Quick date presets
  const setDatePreset = (preset: 'today' | 'thisMonth' | 'fiscalYear' | 'all') => {
    const today = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const d = formatDate(today);
      setLedgerDateFrom(d);
      setLedgerDateTo(d);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setLedgerDateFrom(formatDate(firstDay));
      setLedgerDateTo(formatDate(today));
    } else if (preset === 'fiscalYear') {
      const year = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
      const startFy = new Date(year, 6, 16);
      setLedgerDateFrom(formatDate(startFy));
      setLedgerDateTo(formatDate(today));
    } else {
      setLedgerDateFrom('');
      setLedgerDateTo('');
    }
    setPage(1);
  };

  // Filtered customers for selector & list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'CASH') return c.customerType === 'CASH';
      if (statusFilter === 'CREDIT') return c.customerType === 'CREDIT' || c.customerType === 'CORPORATE';
      if (statusFilter === 'OUTSTANDING') return (c.currentOutstanding || 0) > 0;
      if (statusFilter === 'ADVANCE') return (c.advanceBalance || 0) > 0;
      if (statusFilter === 'BLOCKED') return c.creditStatus === 'BLOCKED';

      return true;
    });
  }, [customers, searchQuery, statusFilter]);

  // Handle customer selection
  const handleSelectCustomer = (cust: CustomerData) => {
    setSelectedCustomerId(cust.id);
    setSelectedCustomer(cust);
    setPage(1);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormCode('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormPanVat('');
    setFormCustomerType('CREDIT');
    setFormCreditLimit(10000);
    setFormCreditTerms(30);
    setFormCreditStatus('ACTIVE');
    setFormOpeningBalance(0);
    setFormBranch('RESTAURANT');
    setFormNotes('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust: CustomerData) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormCode(cust.customerCode || '');
    setFormPhone(cust.phone);
    setFormEmail(cust.email || '');
    setFormAddress(cust.address || '');
    setFormPanVat(cust.panVatNumber || '');
    setFormCustomerType(cust.customerType);
    setFormCreditLimit(cust.creditLimit || 0);
    setFormCreditTerms(cust.creditTerms || 30);
    setFormCreditStatus(cust.creditStatus);
    setFormOpeningBalance(cust.openingBalance || 0);
    setFormBranch(cust.branchOrOutlet || 'RESTAURANT');
    setFormNotes(cust.notes || '');
    setIsAddEditModalOpen(true);
  };

  // Save Customer (Create / Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Validation Error', 'Customer Name is mandatory.');
      return;
    }
    if (!formPhone.trim()) {
      toast.error('Validation Error', 'Phone Number is mandatory.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim() || undefined,
          customerType: formCustomerType as any,
          creditLimit: formCustomerType === 'CREDIT' ? formCreditLimit : 0,
          creditStatus: formCreditStatus as any,
          notes: formNotes.trim() || undefined,
        });
        toast.success('Customer Updated', `Customer "${formName}" updated successfully.`);
      } else {
        await api.createCustomer({
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim() || undefined,
          customerType: formCustomerType as any,
          creditLimit: formCustomerType === 'CREDIT' ? formCreditLimit : 0,
          creditStatus: formCreditStatus as any,
          openingBalance: formOpeningBalance || 0,
          notes: formNotes.trim() || undefined,
        });
        toast.success('Customer Registered', `Customer "${formName}" created successfully.`);
      }

      setIsAddEditModalOpen(false);
      loadCustomers();
      if (selectedCustomerId && editingCustomer && selectedCustomerId === editingCustomer.id) {
        loadCustomerLedger(selectedCustomerId);
      }
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Error occurred while saving customer record.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Open Receive Payment Modal
  const handleOpenReceivePayment = async (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setPaymentAmount(cust.currentOutstanding || 0);
    setPaymentMode('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRefNumber('');
    setPaymentNotes('');
    setSelectedAllocations({});

    try {
      const bills = await api.getCustomerUnpaidBills(cust.id);
      setUnpaidBills(bills || []);
      // Pre-allocate to bills FIFO by default
      let remaining = cust.currentOutstanding || 0;
      const initialAllocs: { [id: string]: number } = {};
      for (const b of bills || []) {
        if (remaining <= 0) break;
        const bal = b.outstandingAmount ?? b.balanceDue ?? 0;
        const apply = Math.min(remaining, bal);
        initialAllocs[b.id] = apply;
        remaining -= apply;
      }
      setSelectedAllocations(initialAllocs);
      setIsReceivePaymentOpen(true);
    } catch (err: any) {
      toast.error('Failed to load unpaid bills', err.message);
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const allocationsList = Object.entries(selectedAllocations)
        .filter(([_, amt]) => amt > 0)
        .map(([billId, amt]) => ({ billId, amount: amt }));

      await api.recordCustomerPaymentV2(selectedCustomer.id, {
        amount: paymentAmount,
        paymentMode,
        allocations: allocationsList.length > 0 ? allocationsList : undefined,
        paymentDate,
        referenceNumber: paymentRefNumber.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        receivedBy: 'Cashier',
      });

      toast.success(
        'Payment Recorded',
        `Payment of Rs. ${paymentAmount.toFixed(2)} recorded via ${paymentMode}.`
      );

      setIsReceivePaymentOpen(false);
      loadCustomers();
      loadCustomerLedger(selectedCustomer.id);
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Error processing payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open Allocate Advance Modal
  const handleOpenAllocateAdvance = async (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setAdvanceAllocations({});
    try {
      const bills = await api.getCustomerUnpaidBills(cust.id);
      setUnpaidBills(bills || []);
      setIsAllocateAdvanceOpen(true);
    } catch (err: any) {
      toast.error('Failed to load bills', err.message);
    }
  };

  // Submit Advance Allocation
  const handleSubmitAdvanceAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const allocationsList = Object.entries(advanceAllocations)
      .filter(([_, amt]) => amt > 0)
      .map(([billId, amt]) => ({ billId, amount: amt }));

    if (allocationsList.length === 0) {
      toast.error('Allocation Error', 'Please allocate amount to at least one invoice.');
      return;
    }

    setIsSubmittingAdvance(true);
    try {
      await api.allocateCustomerAdvance(selectedCustomer.id, {
        allocations: allocationsList,
        authorizedBy: 'Accountant',
      });

      toast.success('Advance Applied', 'Customer advance successfully applied against invoices.');
      setIsAllocateAdvanceOpen(false);
      loadCustomers();
      loadCustomerLedger(selectedCustomer.id);
    } catch (err: any) {
      toast.error('Allocation Failed', err.message);
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  // Open Adjustment Modal
  const handleOpenAdjustment = (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setAdjustmentType('CREDIT');
    setAdjustmentAmount(0);
    setAdjustmentReason('');
    setAdjustmentRef('');
    setIsAdjustmentModalOpen(true);
  };

  // Submit Adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || adjustmentAmount <= 0) return;
    if (!adjustmentReason.trim()) {
      toast.error('Validation Error', 'Adjustment reason is mandatory.');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      await api.createCustomerAdjustment(selectedCustomer.id, {
        adjustmentType,
        amount: adjustmentAmount,
        reason: adjustmentReason.trim(),
        referenceNumber: adjustmentRef.trim() || undefined,
        approvedBy: 'Admin / Manager',
      });

      toast.success('Adjustment Posted', `${adjustmentType} adjustment of Rs. ${adjustmentAmount.toFixed(2)} recorded.`);
      setIsAdjustmentModalOpen(false);
      loadCustomers();
      loadCustomerLedger(selectedCustomer.id);
    } catch (err: any) {
      toast.error('Adjustment Failed', err.message);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Open Aging Modal
  const handleOpenAging = async (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setIsAgingModalOpen(true);
    setIsLoadingAging(true);
    try {
      const res = await api.getCustomerAgingReport(cust.id);
      setAgingData(res);
    } catch (err: any) {
      toast.error('Failed to load aging', err.message);
    } finally {
      setIsLoadingAging(false);
    }
  };

  // Open Statement Modal
  const handleOpenStatement = async (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setIsStatementModalOpen(true);
    setIsLoadingStatement(true);
    try {
      const res = await api.getCustomerStatementReport(cust.id, {
        startDate: ledgerDateFrom || undefined,
        endDate: ledgerDateTo || undefined,
      });
      setStatementData(res);
    } catch (err: any) {
      toast.error('Failed to load statement', err.message);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) {
      toast.error('Export Error', 'No ledger records to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Reference', 'Invoice', 'Description', 'Due Date', 'Debit', 'Credit', 'Balance', 'Outlet'];
    const rows = ledgerEntries.map((e) => [
      `"${new Date(e.entryDate || e.date).toISOString().slice(0, 10)}"`,
      `"${e.referenceType}"`,
      `"${e.referenceId || ''}"`,
      `"${e.invoiceNumber || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.dueDate ? new Date(e.dueDate).toISOString().slice(0, 10) : ''}"`,
      (e.debitAmount || e.debit || 0).toFixed(2),
      (e.creditAmount || e.credit || 0).toFixed(2),
      (e.balance || 0).toFixed(2),
      `"${e.outlet || 'RESTAURANT'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Ledger_${selectedCustomer?.name || 'Customer'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginated ledger entries
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ledgerEntries.slice(start, start + pageSize);
  }, [ledgerEntries, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(ledgerEntries.length / pageSize));

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton
            href="/accounts"
            label="Back"
            onClick={selectedCustomer ? () => setSelectedCustomer(null) : undefined}
          />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Customer Ledger</span>
            {selectedCustomer && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                {selectedCustomer.name}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {selectedCustomer && (
            <button
              type="button"
              onClick={() => setSelectedCustomerId(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Customers</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadCustomers}
            disabled={isLoadingCustomers}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoadingCustomers && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* 2. CUSTOMER SELECTOR & QUICK SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Customer Dropdown Selector */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Customer Account</label>
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setSelectedCustomerId(null);
                  setSelectedCustomer(null);
                } else {
                  const found = customers.find((c) => c.id === id);
                  if (found) handleSelectCustomer(found);
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Choose Customer to View Detailed Ledger --</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode || 'CUST'} &middot; {c.name} &middot; {c.phone} (Due: Rs. {(c.currentOutstanding || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Search Filter</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, code..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              />
            </div>
          </div>

          {/* Customer Status / Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Account Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            >
              <option value="ALL">All Account Types</option>
              <option value="CREDIT">Credit Customers</option>
              <option value="OUTSTANDING">With Outstanding Due</option>
              <option value="ADVANCE">With Advance Balance</option>
              <option value="CASH">Cash Customers</option>
              <option value="BLOCKED">Blocked Customers</option>
            </select>
          </div>

          {/* Outlet Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Branch / Outlet</label>
            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            >
              <option value="ALL">All Outlets</option>
              <option value="RESTAURANT">Everest Restaurant</option>
              <option value="ROOFTOP_BAR">Rooftop Lounge</option>
              <option value="ZENITH_SPA">Zenith Spa</option>
              <option value="ROOM_SERVICE">Room Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: INDIVIDUAL CUSTOMER LEDGER (When customer is selected)
          ========================================================================= */}
      {selectedCustomer ? (
        <div className="space-y-4">
          {/* Customer Profile Banner */}
          <div className="p-4 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {selectedCustomer.customerCode || `CUST-${selectedCustomer.id.slice(0, 6).toUpperCase()}`}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h2>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                    selectedCustomer.customerType === 'CREDIT' || selectedCustomer.customerType === 'CORPORATE'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {selectedCustomer.customerType}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                    selectedCustomer.creditStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  )}
                >
                  {selectedCustomer.creditStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedCustomer.phone}
                </span>
                {selectedCustomer.email && (
                  <span className="flex items-center gap-1">
                    <span>Email:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{selectedCustomer.email}</strong>
                  </span>
                )}
                {selectedCustomer.panVatNumber && (
                  <span className="flex items-center gap-1 font-mono">
                    <span>PAN/VAT:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{selectedCustomer.panVatNumber}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span>Terms:</span>
                  <strong className="text-slate-700 dark:text-slate-300">{selectedCustomer.creditTerms || 30} Days</strong>
                </span>
                {selectedCustomer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedCustomer.address}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenReceivePayment(selectedCustomer)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>

              {(selectedCustomer.advanceBalance || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenAllocateAdvance(selectedCustomer)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Apply Advance</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenAdjustment(selectedCustomer)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjustment</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAging(selectedCustomer)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Aging</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenStatement(selectedCustomer)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Statement</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedCustomer)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded border border-slate-300 dark:border-slate-700"
                title="Edit Customer Details"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ledger Filter Toolbar */}
          <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Statement Range:</span>
              <input
                type="date"
                value={ledgerDateFrom}
                onChange={(e) => setLedgerDateFrom(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              />
              <span className="text-slate-400">&minus;</span>
              <input
                type="date"
                value={ledgerDateTo}
                onChange={(e) => setLedgerDateTo(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              />

              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => setDatePreset('today')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('thisMonth')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('fiscalYear')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
                >
                  This Fiscal Year
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('all')}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
                >
                  All Time
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="CREDIT_BILL">Sales Invoices / Bills</option>
                <option value="PAYMENT">Payments Received</option>
                <option value="CUSTOMER_ADVANCE">Customer Advances</option>
                <option value="ADVANCE_ADJUSTMENT">Advance Adjustments</option>
                <option value="SALES_RETURN">Sales Returns</option>
                <option value="CREDIT_NOTE">Credit Notes</option>
                <option value="DEBIT_NOTE">Debit Notes</option>
                <option value="OPENING_BALANCE">Opening Balance</option>
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded flex items-center gap-1 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Ref / Invoice #</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Debit (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Balance (Rs.)</th>
                    <th className="py-2.5 px-3">Outlet</th>
                    <th className="py-2.5 px-3">Cashier</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {isLoadingLedger ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading customer ledger transactions...</span>
                      </td>
                    </tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">No Ledger Entries Found</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">There are no transactions recorded for this customer in this period.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((e, idx) => {
                      const entryDate = new Date(e.entryDate || e.date);
                      const dueDate = e.dueDate ? new Date(e.dueDate) : null;
                      const isOverdue = dueDate && dueDate < new Date() && e.balance > 0;

                      const typeBadge =
                        e.referenceType === 'CREDIT_BILL' || e.referenceType === 'INVOICE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : e.referenceType === 'PAYMENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : e.referenceType === 'CUSTOMER_ADVANCE'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : e.referenceType === 'ADVANCE_ADJUSTMENT'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : e.referenceType === 'SALES_RETURN' || e.referenceType === 'CREDIT_NOTE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                      const debitAmt = e.debitAmount ?? e.debit ?? 0;
                      const creditAmt = e.creditAmount ?? e.credit ?? 0;

                      return (
                        <tr key={e.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeBadge}`}>
                              {e.referenceType?.replace('_', ' ') || 'TRANSACTION'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {e.invoiceNumber || e.billNumber || e.referenceId || e.referenceNumber || '&minus;'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[240px] truncate">
                            {e.description}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {dueDate ? (
                              <span className={cn('text-[11px]', isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500')}>
                                {dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            ) : (
                              <span className="text-slate-400">&minus;</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {debitAmt > 0 ? debitAmt.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {creditAmt > 0 ? creditAmt.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            Rs. {(e.balance || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {e.outlet || 'Restaurant'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[90px]">
                            {e.createdBy || 'Cashier'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {e.billId && (
                              <Link
                                href={`/accounts?tab=sales-transactions&search=${e.invoiceNumber || e.billNumber}`}
                                className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span>Invoice</span>
                                <ArrowLeft className="w-3 h-3 rotate-180" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries per page</span>
                </div>
                <span>
                  Showing {ledgerEntries.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                  {Math.min(page * pageSize, ledgerEntries.length)} of {ledgerEntries.length} records
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded border',
                        page === pNum
                          ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 border-slate-300 hover:bg-slate-100'
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: ALL CUSTOMERS DIRECTORY & SUMMARY OVERVIEW
            ========================================================================= */
        <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Customer Accounts Directory
            </span>
            <span className="text-[11px] text-slate-500">
              Click any customer row or &ldquo;View Ledger&rdquo; to inspect statement
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Credit Limit</th>
                  <th className="py-2.5 px-3 text-right">Outstanding (Due)</th>
                  <th className="py-2.5 px-3 text-right">Advance Balance</th>
                  <th className="py-2.5 px-3 text-right">Available Credit</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {isLoadingCustomers ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading customers directory...</span>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <div className="font-semibold text-slate-700 dark:text-slate-300">No Customers Found</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;New Customer&rdquo; above to register an account.</div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.customerCode || `CUST-${c.id.slice(0, 6).toUpperCase()}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                        {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{c.phone}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.customerType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        Rs. {(c.creditLimit || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {(c.currentOutstanding || 0) > 0 ? (
                          <span className="text-rose-600">Rs. {c.currentOutstanding.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {(c.advanceBalance || 0) > 0 ? (
                          <span className="text-blue-600">Rs. {(c.advanceBalance || 0).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        Rs. {Math.max(0, (c.creditLimit || 0) - (c.currentOutstanding || 0)).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            c.creditStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          )}
                        >
                          {c.creditStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded flex items-center gap-1 shadow-2xs"
                          >
                            <span>View Ledger</span>
                            <ArrowLeft className="w-3 h-3 rotate-180" />
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
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT CUSTOMER
          ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit Customer Account' : 'Register New Customer Account'}
              </h3>
              <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Ram Sharma"
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    placeholder="e.g. 9841234567"
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">PAN / VAT Details</label>
                  <input
                    type="text"
                    value={formPanVat}
                    onChange={(e) => setFormPanVat(e.target.value)}
                    placeholder="e.g. PAN-601948203"
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Customer Type</label>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="CREDIT">Credit</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Terms (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCreditTerms}
                    onChange={(e) => setFormCreditTerms(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Migrated Opening Receivable Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Lakeside, Pokhara"
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Notes / Internal Remarks</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Account instructions or credit agreement..."
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCustomer ? 'Update Account' : 'Register Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RECEIVE PAYMENT & MULTI-INVOICE ALLOCATION
          ========================================================================= */}
      {isReceivePaymentOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Receive Customer Payment &middot; {selectedCustomer.name}
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    Outstanding Due: Rs. {(selectedCustomer.currentOutstanding || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setIsReceivePaymentOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border rounded bg-slate-50 dark:bg-slate-900 text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="UPI">QR / UPI / Fonepay</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Invoice Allocation Table */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Allocate to Unpaid Invoices ({unpaidBills.length} open)
                </label>
                {unpaidBills.length === 0 ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px]">
                    No open credit invoices found. The full amount of <strong>Rs. {paymentAmount.toFixed(2)}</strong> will be credited as a <strong>Customer Advance Deposit</strong>.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="py-1.5 px-2">Invoice #</th>
                          <th className="py-1.5 px-2">Date</th>
                          <th className="py-1.5 px-2 text-right">Balance Due</th>
                          <th className="py-1.5 px-2 text-right">Allocate (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {unpaidBills.map((b) => {
                          const bal = b.outstandingAmount ?? b.balanceDue ?? 0;
                          const alloc = selectedAllocations[b.id] || 0;
                          return (
                            <tr key={b.id}>
                              <td className="py-1.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {b.billNumber}
                              </td>
                              <td className="py-1.5 px-2 text-slate-500">
                                {new Date(b.date).toLocaleDateString()}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-rose-600 font-bold">
                                Rs. {bal.toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  max={bal}
                                  step="0.01"
                                  value={alloc}
                                  onChange={(e) => {
                                    const val = Math.min(bal, Math.max(0, Number(e.target.value)));
                                    setSelectedAllocations((prev) => ({ ...prev, [b.id]: val }));
                                  }}
                                  className="w-24 px-1.5 py-0.5 text-xs text-right border rounded bg-white dark:bg-slate-800 font-mono font-bold"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Receipt Ref / Cheque #</label>
                  <input
                    type="text"
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    placeholder="e.g. CHQ-98124 or Fonepay TXN"
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Remarks..."
                    className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReceivePaymentOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingPayment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record &amp; Post to GL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: APPLY ADVANCE TO INVOICES
          ========================================================================= */}
      {isAllocateAdvanceOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                    Apply Advance Balance &middot; {selectedCustomer.name}
                  </h3>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400">
                    Available Advance Deposit: Rs. {(selectedCustomer.advanceBalance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setIsAllocateAdvanceOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdvanceAllocation} className="p-4 space-y-3 text-xs">
              <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-1.5 px-2">Invoice #</th>
                      <th className="py-1.5 px-2">Date</th>
                      <th className="py-1.5 px-2 text-right">Balance Due</th>
                      <th className="py-1.5 px-2 text-right">Apply (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {unpaidBills.map((b) => {
                      const bal = b.outstandingAmount ?? b.balanceDue ?? 0;
                      const alloc = advanceAllocations[b.id] || 0;
                      return (
                        <tr key={b.id}>
                          <td className="py-1.5 px-2 font-mono font-bold">{b.billNumber}</td>
                          <td className="py-1.5 px-2 text-slate-500">{new Date(b.date).toLocaleDateString()}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-rose-600 font-bold">Rs. {bal.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max={Math.min(bal, selectedCustomer.advanceBalance || 0)}
                              step="0.01"
                              value={alloc}
                              onChange={(e) => {
                                const val = Math.min(bal, Math.max(0, Number(e.target.value)));
                                setAdvanceAllocations((prev) => ({ ...prev, [b.id]: val }));
                              }}
                              className="w-24 px-1.5 py-0.5 text-xs text-right border rounded bg-white dark:bg-slate-800 font-mono font-bold"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocateAdvanceOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvance}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAdvance && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Apply Advance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ACCOUNT ADJUSTMENT (DEBIT / CREDIT NOTE)
          ========================================================================= */}
      {isAdjustmentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Account Adjustment &middot; {selectedCustomer.name}
              </h3>
              <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('CREDIT')}
                    className={cn(
                      'py-1.5 px-2 rounded text-xs font-bold border transition-colors',
                      adjustmentType === 'CREDIT' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    Credit Note (Reduce Due)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('DEBIT')}
                    className={cn(
                      'py-1.5 px-2 rounded text-xs font-bold border transition-colors',
                      adjustmentType === 'DEBIT' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    Debit Note (Increase Due)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Adjustment Amount (Rs.) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Reason / Narration *</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Approved price correction, agreed discount, or service compensation"
                  required
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Supporting Reference # (Optional)</label>
                <input
                  type="text"
                  value={adjustmentRef}
                  onChange={(e) => setAdjustmentRef(e.target.value)}
                  placeholder="e.g. APPROVAL-902"
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment || adjustmentAmount <= 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAdjustment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Approve &amp; Post to GL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: AGING ANALYSIS
          ========================================================================= */}
      {isAgingModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Receivables Aging Analysis &middot; {selectedCustomer.name}
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    Calculated by invoice due dates (Credit Terms: {selectedCustomer.creditTerms || 30} days)
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setIsAgingModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {isLoadingAging ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span>Calculating aging breakdown...</span>
                </div>
              ) : !agingData ? (
                <div className="py-8 text-center text-slate-400">No open invoices to analyze.</div>
              ) : (
                <>
                  {/* Aging Buckets Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded">
                      <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Current / Not Due</div>
                      <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                        Rs. {agingData.agingSummary.currentNotDue.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
                      <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">1 - 30 Days</div>
                      <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                        Rs. {agingData.agingSummary.days1To30.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded">
                      <div className="text-[10px] uppercase font-bold text-orange-800 dark:text-orange-300">31 - 60 Days</div>
                      <div className="text-sm font-bold font-mono text-orange-700 dark:text-orange-300 mt-1">
                        Rs. {agingData.agingSummary.days31To60.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded">
                      <div className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">61 - 90 Days</div>
                      <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
                        Rs. {agingData.agingSummary.days61To90.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded">
                      <div className="text-[10px] uppercase font-bold text-red-900 dark:text-red-300">&gt; 90 Days Overdue</div>
                      <div className="text-sm font-bold font-mono text-red-900 dark:text-red-300 mt-1">
                        Rs. {agingData.agingSummary.above90Days.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Overdue Invoices Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="py-2 px-2.5">Invoice #</th>
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Due Date</th>
                          <th className="py-2 px-2.5 text-center">Days Overdue</th>
                          <th className="py-2 px-2.5 text-right">Balance Due</th>
                          <th className="py-2 px-2.5 text-center">Bucket</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {agingData.invoices?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No outstanding invoices. Account is fully settled.
                            </td>
                          </tr>
                        ) : (
                          agingData.invoices.map((inv) => (
                            <tr key={inv.billId}>
                              <td className="py-2 px-2.5 font-mono font-bold">{inv.billNumber}</td>
                              <td className="py-2 px-2.5 text-slate-500">
                                {new Date(inv.invoiceDate).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className={cn('font-bold', inv.daysOverdue > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                  {inv.daysOverdue} days
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                Rs. {inv.balanceDue.toFixed(2)}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                                  {inv.agingBucket.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAgingModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: STATEMENT OF ACCOUNT (PRINT & PREVIEW)
          ========================================================================= */}
      {isStatementModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Customer Statement of Account</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button type="button" onClick={() => setIsStatementModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white text-black font-sans text-xs">
              {/* Restaurant Header */}
              <div className="text-center pb-4 border-b border-slate-300">
                <h1 className="text-xl font-black uppercase tracking-wide">Everest Family Restaurant &amp; Resort</h1>
                <p className="text-xs text-slate-600">Lakeside Boulevard, Pokhara, Nepal &middot; Tel: +977-61-460123</p>
                <p className="text-xs text-slate-600 font-bold font-mono">PAN: 601948203 &middot; VAT: 10928374</p>
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 mt-2">
                  STATEMENT OF ACCOUNT
                </h2>
              </div>

              {/* Customer and Period Details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Customer Details:</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedCustomer.name}</div>
                  <div className="font-mono text-slate-600">Code: {selectedCustomer.customerCode || 'CUST'}</div>
                  <div className="font-mono text-slate-600">Phone: {selectedCustomer.phone}</div>
                  {selectedCustomer.address && <div className="text-slate-600">Address: {selectedCustomer.address}</div>}
                  {selectedCustomer.panVatNumber && (
                    <div className="font-mono text-slate-600 font-bold">PAN/VAT: {selectedCustomer.panVatNumber}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Statement Period:</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {ledgerDateFrom || 'Inception'} &minus; {ledgerDateTo || 'Current Date'}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mt-2">Current Position:</div>
                  <div className="text-base font-black text-rose-700 font-mono">
                    Outstanding Due: Rs. {(selectedCustomer.currentOutstanding || 0).toFixed(2)}
                  </div>
                  {(selectedCustomer.advanceBalance || 0) > 0 && (
                    <div className="text-xs font-bold text-blue-700 font-mono">
                      Advance Deposit: Rs. {(selectedCustomer.advanceBalance || 0).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Reference #</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5 text-right">Debit (Rs.)</th>
                      <th className="py-2 px-2.5 text-right">Credit (Rs.)</th>
                      <th className="py-2 px-2.5 text-right">Balance (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {ledgerEntries.map((e, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2.5 font-sans">
                          {new Date(e.entryDate || e.date).toLocaleDateString()}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold">
                          {e.invoiceNumber || e.billNumber || e.referenceId || e.referenceNumber || '-'}
                        </td>
                        <td className="py-1.5 px-2.5 font-sans truncate max-w-[200px]">{e.description}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold">
                          {(e.debitAmount || e.debit || 0) > 0 ? (e.debitAmount || e.debit).toFixed(2) : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-emerald-700">
                          {(e.creditAmount || e.credit || 0) > 0 ? (e.creditAmount || e.credit).toFixed(2) : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold">Rs. {(e.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300 font-mono">
                    <tr>
                      <td colSpan={3} className="py-2 px-2.5 text-right font-sans">
                        Closing Balance:
                      </td>
                      <td colSpan={3} className="py-2 px-2.5 text-right text-sm text-rose-700">
                        Rs. {(selectedCustomer.currentOutstanding || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remittance & Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold">Bank Remittance Details:</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Bank: Nabil Bank Limited, Lakeside Branch</div>
                  <div className="text-[11px] text-slate-600 font-mono">A/C: 01920391029301 &middot; Everest Restaurant</div>
                  <div className="text-[11px] text-slate-600 font-mono">Fonepay QR: info@everestfamilyrestaurant.com</div>
                </div>

                <div className="text-right flex flex-col justify-end">
                  <div className="border-t border-slate-400 w-44 ml-auto pt-1 text-center font-bold">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency } from '@/lib/utils';
import {
  CustomerData,
  CustomerLedgerEntryData,
  CustomerUnpaidBillData,
  CustomerType,
  CreditStatus,
} from '@/lib/types';

export default function CustomerLedgerAccountsTab() {
  const toast = useToast();

  // State
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CASH' | 'CREDIT' | 'OUTSTANDING' | 'BLOCKED'>('ALL');

  // Selected customer for Ledger View
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntryData[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);

  // Receive Payment Modal
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [unpaidBills, setUnpaidBills] = useState<CustomerUnpaidBillData[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'WALLET'>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCustomerType, setFormCustomerType] = useState<CustomerType>('CREDIT');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(0);
  const [formCreditStatus, setFormCreditStatus] = useState<CreditStatus>('ACTIVE');
  const [formOpeningBalance, setFormOpeningBalance] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch customers list
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err: any) {
      toast.error('Failed to load customers', err.message || 'Network error');
    } finally {
      setIsLoading(false);
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
      setSelectedCustomer(data.customer);
      setLedgerEntries(data.entries || []);
      setLedgerSummary(data.summary || null);
    } catch (err: any) {
      toast.error('Failed to load customer ledger', err.message || 'Error loading records');
    } finally {
      setIsLoadingLedger(false);
    }
  }, [ledgerDateFrom, ledgerDateTo, toast]);

  // When selectedCustomer is set and dates change
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerLedger(selectedCustomer.id);
    }
  }, [ledgerDateFrom, ledgerDateTo]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'CASH') return c.customerType === 'CASH';
      if (statusFilter === 'CREDIT') return c.customerType === 'CREDIT';
      if (statusFilter === 'OUTSTANDING') return (c.currentOutstanding || 0) > 0;
      if (statusFilter === 'BLOCKED') return c.creditStatus === 'BLOCKED';

      return true;
    });
  }, [customers, searchQuery, statusFilter]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormCustomerType('CREDIT');
    setFormCreditLimit(5000);
    setFormCreditStatus('ACTIVE');
    setFormOpeningBalance(0);
    setFormNotes('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust: CustomerData) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormAddress(cust.address || '');
    setFormCustomerType(cust.customerType);
    setFormCreditLimit(cust.creditLimit || 0);
    setFormCreditStatus(cust.creditStatus);
    setFormOpeningBalance(cust.openingBalance || 0);
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
    if (formCreditLimit < 0) {
      toast.error('Validation Error', 'Credit limit must be zero or a positive amount.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim() || undefined,
          customerType: formCustomerType,
          creditLimit: formCustomerType === 'CREDIT' ? formCreditLimit : 0,
          creditStatus: formCreditStatus,
          notes: formNotes.trim() || undefined,
        });
        toast.success('Customer Updated', `Customer "${formName}" updated successfully.`);
      } else {
        await api.createCustomer({
          name: formName.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim() || undefined,
          customerType: formCustomerType,
          creditLimit: formCustomerType === 'CREDIT' ? formCreditLimit : 0,
          creditStatus: formCreditStatus,
          openingBalance: formOpeningBalance || 0,
          notes: formNotes.trim() || undefined,
        });
        toast.success('Customer Registered', `Customer "${formName}" created successfully.`);
      }

      setIsAddEditModalOpen(false);
      loadCustomers();
      if (selectedCustomer && editingCustomer && selectedCustomer.id === editingCustomer.id) {
        loadCustomerLedger(selectedCustomer.id);
      }
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Error occurred while saving customer record.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Toggle Block / Activate status
  const handleToggleStatus = async (cust: CustomerData) => {
    const newStatus: CreditStatus = cust.creditStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      await api.updateCustomerStatus(cust.id, newStatus);
      toast.success(
        'Status Updated',
        `Customer "${cust.name}" is now ${newStatus === 'ACTIVE' ? 'Active' : 'Blocked'}.`
      );
      loadCustomers();
      if (selectedCustomer && selectedCustomer.id === cust.id) {
        loadCustomerLedger(cust.id);
      }
    } catch (err: any) {
      toast.error('Failed to update status', err.message || 'Operation failed');
    }
  };

  // Open Receive Payment Modal
  const handleOpenReceivePayment = async (cust: CustomerData) => {
    setSelectedCustomer(cust);
    setIsReceivePaymentOpen(true);
    setSelectedBillIds([]);
    setPaymentAmount(0);
    setPaymentMode('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRefNumber('');
    setPaymentNotes('');

    try {
      const bills = await api.getCustomerUnpaidBills(cust.id);
      setUnpaidBills(bills || []);
      if (bills && bills.length > 0) {
        // Select all by default
        const allIds = bills.map((b) => b.id);
        setSelectedBillIds(allIds);
        const totalDue = bills.reduce((sum, b) => sum + (b.outstandingAmount || 0), 0);
        setPaymentAmount(totalDue);
      } else {
        // Migration or opening balance payment
        setPaymentAmount(cust.currentOutstanding || 0);
      }
    } catch (err: any) {
      toast.error('Failed to load unpaid bills', err.message || 'Error loading bills');
    }
  };

  // Toggle Bill selection
  const handleToggleBillSelect = (billId: string) => {
    let nextIds: string[];
    if (selectedBillIds.includes(billId)) {
      nextIds = selectedBillIds.filter((id) => id !== billId);
    } else {
      nextIds = [...selectedBillIds, billId];
    }
    setSelectedBillIds(nextIds);

    // Recalculate default payment amount for selected bills
    const totalSelected = unpaidBills
      .filter((b) => nextIds.includes(b.id))
      .reduce((sum, b) => sum + (b.outstandingAmount || 0), 0);
    setPaymentAmount(totalSelected);
  };

  // Submit Receive Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (paymentAmount <= 0) {
      toast.error('Validation Error', 'Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > (selectedCustomer.currentOutstanding || 0)) {
      toast.error(
        'Validation Error',
        `Payment amount (Rs. ${paymentAmount}) cannot exceed customer current outstanding (Rs. ${selectedCustomer.currentOutstanding}).`
      );
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await api.receiveCustomerPayment({
        customerId: selectedCustomer.id,
        billIds: selectedBillIds,
        amount: paymentAmount,
        paymentMode: paymentMode,
        paymentDate: paymentDate,
        referenceNumber: paymentRefNumber.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      toast.success(
        'Payment Received',
        `Received Rs. ${res.totalSettled.toFixed(2)} via ${paymentMode}. New balance: Rs. ${res.newOutstanding.toFixed(2)}`
      );

      setIsReceivePaymentOpen(false);
      loadCustomers();
      loadCustomerLedger(selectedCustomer.id);
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Error settling customer payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Print ledger statement
  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          VIEW A: CUSTOMER LEDGER STATEMENT (If a customer is selected)
          ========================================================================= */}
      {selectedCustomer ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="Back to Customer List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      selectedCustomer.customerType === 'CREDIT'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {selectedCustomer.customerType} Customer
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
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3" />
                    {selectedCustomer.phone}
                  </span>
                  {selectedCustomer.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedCustomer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {(selectedCustomer.currentOutstanding || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenReceivePayment(selectedCustomer)}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Receive Payment</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintLedger}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071F1A] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>

              <button
                type="button"
                onClick={() => loadCustomerLedger(selectedCustomer.id)}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh Ledger"
              >
                <RefreshCw className={cn('w-4 h-4', isLoadingLedger && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Credit Limit
              </span>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                Rs. {(selectedCustomer.creditLimit || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Credit Given
              </span>
              <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                Rs. {(ledgerSummary?.totalCreditGiven || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Received
              </span>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                Rs. {(ledgerSummary?.totalPaymentReceived || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                Current Outstanding
              </span>
              <p className="text-lg font-black font-mono text-rose-700 dark:text-rose-300 mt-1">
                Rs. {(selectedCustomer.currentOutstanding || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Available Credit
              </span>
              <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                Rs. {(selectedCustomer.availableCredit || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Date Filter & Statement Table */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
            {/* Filter Toolbar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#07241E] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Transaction Statement
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {ledgerEntries.length} entries
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">From:</span>
                <input
                  type="date"
                  value={ledgerDateFrom}
                  onChange={(e) => setLedgerDateFrom(e.target.value)}
                  className="px-2 py-1 text-xs border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
                <span className="text-slate-500">To:</span>
                <input
                  type="date"
                  value={ledgerDateTo}
                  onChange={(e) => setLedgerDateTo(e.target.value)}
                  className="px-2 py-1 text-xs border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
                {(ledgerDateFrom || ledgerDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLedgerDateFrom('');
                      setLedgerDateTo('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D32] text-white uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bill # / Ref</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingLedger ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0B3D32]" />
                        <span>Loading ledger statement...</span>
                      </td>
                    </tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No transactions recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Credit sales and received settlements will appear here chronologically.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#0E2E25]/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {entry.billNumber || entry.referenceNumber || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {entry.description}
                          {entry.notes && (
                            <span className="block text-[10px] text-slate-400 italic">{entry.notes}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {entry.debit > 0 ? `Rs. ${entry.debit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {entry.credit > 0 ? `Rs. ${entry.credit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {entry.balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {entry.paymentMode || (entry.entryType === 'DEBIT' ? 'CREDIT' : 'CASH')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                              entry.entryType === 'DEBIT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            )}
                          >
                            {entry.paymentStatus || (entry.entryType === 'DEBIT' ? 'CREDIT' : 'SETTLED')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: CUSTOMER MASTER & CREDIT DIRECTORY
            ========================================================================= */
        <div className="space-y-4">
          {/* Header & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                <span>Credit Customer Master &amp; Accounts Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register cash and credit customers, set credit limits, review dues, and manage receivables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Customer</span>
              </button>

              <button
                type="button"
                onClick={loadCustomers}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Refresh customer list"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Customers', count: customers.length },
                { id: 'CREDIT', label: 'Credit Customers', count: customers.filter((c) => c.customerType === 'CREDIT').length },
                { id: 'CASH', label: 'Cash Customers', count: customers.filter((c) => c.customerType === 'CASH').length },
                { id: 'OUTSTANDING', label: 'Outstanding Dues > 0', count: customers.filter((c) => (c.currentOutstanding || 0) > 0).length },
                { id: 'BLOCKED', label: 'Blocked', count: customers.filter((c) => c.creditStatus === 'BLOCKED').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
                    statusFilter === tab.id
                      ? 'bg-[#0B3D32] text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                      statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#061D18] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B3D32] text-white uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Address</th>
                    <th className="py-2.5 px-3">Customer Type</th>
                    <th className="py-2.5 px-3 text-right">Credit Limit</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                    <th className="py-2.5 px-3 text-right">Available Credit</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0B3D32]" />
                        <span>Loading customer directory...</span>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No customers found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Register your first customer or try adjusting your search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => {
                      const availCredit = Math.max(0, (cust.creditLimit || 0) - (cust.currentOutstanding || 0));
                      return (
                        <tr
                          key={cust.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-[#0E2E25]/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {cust.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                            {cust.phone}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                            {cust.address || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                cust.customerType === 'CREDIT'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              )}
                            >
                              {cust.customerType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {cust.customerType === 'CREDIT' ? `Rs. ${(cust.creditLimit || 0).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            Rs. {(cust.currentOutstanding || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {cust.customerType === 'CREDIT' ? `Rs. ${availCredit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                cust.creditStatus === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              )}
                            >
                              {cust.creditStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Ledger */}
                              <button
                                type="button"
                                onClick={() => loadCustomerLedger(cust.id)}
                                className="px-2 py-1 rounded bg-[#0B3D32] hover:bg-[#082e25] text-white font-semibold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Open customer ledger statement"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ledger</span>
                              </button>

                              {/* Receive Payment */}
                              {(cust.currentOutstanding || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceivePayment(cust)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Receive settlement against dues"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cust)}
                                className="p-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Customer"
                              >
                                <Edit className="w-3 h-3" />
                              </button>

                              {/* Block / Activate Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(cust)}
                                className={cn(
                                  'p-1 rounded border',
                                  cust.creditStatus === 'ACTIVE'
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                )}
                                title={cust.creditStatus === 'ACTIVE' ? 'Block credit for this customer' : 'Activate customer'}
                              >
                                {cust.creditStatus === 'ACTIVE' ? (
                                  <Ban className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT CUSTOMER
          ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0B3D32] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{editingCustomer ? 'Edit Customer' : 'Register New Customer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Traders / John Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-rose-500">*</span> (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9841234567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thamel, Kathmandu"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value as CustomerType)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  >
                    <option value="CREDIT">Credit Customer</option>
                    <option value="CASH">Cash Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={formCustomerType === 'CASH'}
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Status
                  </label>
                  <select
                    value={formCreditStatus}
                    onChange={(e) => setFormCreditStatus(e.target.value as CreditStatus)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Balance (Optional Due from Past)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Enter existing past dues if migrating this customer to the system.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms, tax ID, business details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-1.5 rounded bg-[#0B3D32] hover:bg-[#082e25] disabled:opacity-50 text-white font-bold"
                >
                  {isSubmittingForm ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RECEIVE PAYMENT (SETTLE CREDIT BILLS)
          ========================================================================= */}
      {isReceivePaymentOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0B3D32] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Receive Payment · {selectedCustomer.name}</span>
                </h3>
                <p className="text-[11px] text-white/80 mt-0.5">
                  Current Outstanding Due: Rs. {(selectedCustomer.currentOutstanding || 0).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReceivePaymentOpen(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-4 text-xs">
              {/* Unpaid Bills Selection */}
              {unpaidBills.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Select Bills to Settle:
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {selectedBillIds.length} of {unpaidBills.length} selected
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border rounded divide-y dark:border-slate-800">
                    {unpaidBills.map((b) => {
                      const isSelected = selectedBillIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBillSelect(b.id)}
                          className={cn(
                            'p-2.5 flex items-center justify-between cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-[#0E2E25]'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="rounded border-slate-300 text-[#0B3D32]"
                            />
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {b.billNumber}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                {new Date(b.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              Rs. {b.outstandingAmount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Total: Rs. {b.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Received (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCustomer.currentOutstanding || undefined}
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-sm border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online (Bank / Fonepay)</option>
                    <option value="WALLET">Wallet (eSewa / Khalti)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Txn ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank slip or Txn Ref"
                    value={paymentRefNumber}
                    onChange={(e) => setPaymentRefNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full settlement via cashier"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-[#061D18] dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Summary Calculation */}
              <div className="p-3 bg-slate-50 dark:bg-[#061D18] rounded border border-slate-200 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Current Outstanding:</span>
                  <span className="font-mono font-bold">Rs. {(selectedCustomer.currentOutstanding || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Amount Paying Now:</span>
                  <span className="font-mono font-bold">- Rs. {paymentAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-bold text-slate-900 dark:text-white">
                  <span>Remaining Outstanding:</span>
                  <span className="font-mono">
                    Rs. {Math.max(0, (selectedCustomer.currentOutstanding || 0) - paymentAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceivePaymentOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment || paymentAmount <= 0}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingPayment ? 'Processing...' : 'Confirm Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


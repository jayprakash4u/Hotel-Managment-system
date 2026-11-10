'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  SalesTransactionListItem,
  SalesTransactionsSummary,
  SalesTransactionDetail,
  CreateSalesTransactionRequest
} from '@/lib/types';

export default function SalesTransactionsTab() {
  // Filters state
  const [search, setSearch] = useState('');
  const [salesChannel, setSalesChannel] = useState('ALL');
  const [outlet, setOutlet] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [transactionStatus, setTransactionStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SalesTransactionListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<SalesTransactionsSummary>({
    totalSales: 0,
    totalInvoices: 0,
    paidSales: 0,
    unpaidSales: 0,
    partiallyPaidCount: 0,
    salesReturnsCount: 0,
    refundAmount: 0,
    netSales: 0,
  });

  // Modals state
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<SalesTransactionDetail | null>(null);

  // New Sale Modal
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SalesTransactionListItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<SalesTransactionListItem | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<
    { name: string; maxQty: number; returnQty: number; unitPrice: number; reason: string; restock: boolean }[]
  >([]);
  const [returnReasonGlobal, setReturnReasonGlobal] = useState('');
  const [returnRefundMethod, setReturnRefundMethod] = useState('CASH');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SalesTransactionListItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<SalesTransactionDetail | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal80' | 'thermal58' | 'a4'>('thermal80');

  // Load Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSalesTransactions({
        search: search.trim() || undefined,
        salesChannel: salesChannel !== 'ALL' ? salesChannel : undefined,
        outlet: outlet !== 'ALL' ? outlet : undefined,
        paymentMethod: paymentMethod !== 'ALL' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
        transactionStatus: transactionStatus !== 'ALL' ? transactionStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });

      if (res) {
        setItems(res.items || []);
        setTotalItems(res.totalItems || 0);
        setTotalPages(res.totalPages || 1);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to load sales transactions:', err);
      setError(err?.message || 'Failed to load sales transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, sortBy, sortOrder]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSalesChannel('ALL');
    setOutlet('ALL');
    setPaymentMethod('ALL');
    setPaymentStatus('ALL');
    setTransactionStatus('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => {
      fetchTransactions();
    }, 0);
  };

  // Quick Date Presets
  const setDatePreset = (preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => {
    const today = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const d = formatDate(today);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatDate(y);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'thisWeek') {
      const curr = new Date(today);
      const first = curr.getDate() - curr.getDay() + 1;
      const firstDay = new Date(curr.setDate(first));
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  // View Details
  const handleViewDetail = async (id: string) => {
    setSelectedTxId(id);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.getSalesTransactionById(id);
      setDetailData(res);
    } catch (err: any) {
      console.error('Failed to load transaction detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (item: SalesTransactionListItem) => {
    setPaymentTarget(item);
    setPaymentAmount(Math.round(item.balanceDue * 100) / 100);
    setPaymentMethodChoice('CASH');
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || paymentAmount <= 0) return;
    setPaymentSubmitting(true);
    try {
      await api.recordSalesPayment(paymentTarget.id, {
        amount: paymentAmount,
        paymentMethod: paymentMethodChoice,
        transactionRef: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        receivedBy: 'Cashier',
      });
      setPaymentModalOpen(false);
      fetchTransactions();
      if (detailModalOpen && selectedTxId === paymentTarget.id) {
        handleViewDetail(paymentTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Open Return Modal
  const handleOpenReturn = async (item: SalesTransactionListItem) => {
    setReturnTarget(item);
    setReturnReasonGlobal('');
    setReturnRefundMethod('CASH');
    setReturnSubmitting(false);
    try {
      const detail = await api.getSalesTransactionById(item.id);
      const items = detail.transaction.items || [];
      setReturnItemsState(
        items.map((it: any) => ({
          name: it.name,
          maxQty: it.quantity,
          returnQty: 0,
          unitPrice: it.unitPrice,
          reason: '',
          restock: true,
        }))
      );
      setReturnModalOpen(true);
    } catch (err: any) {
      alert('Failed to load transaction items for return');
    }
  };

  // Submit Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;

    const returnItems = returnItemsState
      .filter((it) => it.returnQty > 0)
      .map((it) => ({
        name: it.name,
        quantity: it.returnQty,
        unitPrice: it.unitPrice,
        reason: it.reason || returnReasonGlobal,
        restockInventory: it.restock,
      }));

    if (returnItems.length === 0) {
      alert('Please select at least 1 item and quantity to return.');
      return;
    }

    if (!returnReasonGlobal.trim()) {
      alert('A return reason is required.');
      return;
    }

    setReturnSubmitting(true);
    try {
      await api.processSalesReturn(returnTarget.id, {
        returnItems,
        reason: returnReasonGlobal.trim(),
        authorizedBy: 'Supervisor / Manager',
        refundPaymentMethod: returnRefundMethod,
      });
      setReturnModalOpen(false);
      fetchTransactions();
      if (detailModalOpen && selectedTxId === returnTarget.id) {
        handleViewDetail(returnTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to process return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Open Cancel Modal
  const handleOpenCancel = (item: SalesTransactionListItem) => {
    setCancelTarget(item);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  // Submit Cancel
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelSubmitting(true);
    try {
      await api.cancelSalesTransaction(cancelTarget.id, {
        reason: cancelReason.trim(),
        authorizedBy: 'Admin / Manager',
      });
      setCancelModalOpen(false);
      fetchTransactions();
      if (detailModalOpen && selectedTxId === cancelTarget.id) {
        handleViewDetail(cancelTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel transaction');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Open Print Modal
  const handleOpenPrint = async (itemOrId: string | SalesTransactionListItem) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    try {
      const detail = await api.getSalesTransactionById(id);
      setPrintTarget(detail);
      setPrintModalOpen(true);
    } catch (err: any) {
      alert('Failed to load invoice for printing');
    }
  };

  // Open New Sale Modal
  const handleOpenNewSale = async () => {
    setNewSaleModalOpen(true);
    try {
      const [prods, custs] = await Promise.all([api.getSalesMenuItems(), api.getSalesCustomers()]);
      setMenuItems(prods || []);
      setCustomerList(custs || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      alert('No sales transactions to export.');
      return;
    }

    const headers = [
      'Invoice No',
      'Date',
      'Time',
      'Customer',
      'Phone',
      'Order No',
      'Channel',
      'Outlet',
      'Cashier',
      'Subtotal',
      'Discount',
      'Tax',
      'Grand Total',
      'Paid Amount',
      'Balance Due',
      'Refund Amount',
      'Payment Method',
      'Payment Status',
      'Transaction Status',
    ];

    const rows = items.map((it) => {
      const d = new Date(it.createdAt);
      return [
        `"${it.billNumber}"`,
        `"${d.toISOString().slice(0, 10)}"`,
        `"${d.toLocaleTimeString()}"`,
        `"${it.customerName.replace(/"/g, '""')}"`,
        `"${it.customerPhone || ''}"`,
        `"${it.orderNumber || ''}"`,
        `"${it.salesChannel}"`,
        `"${it.outlet}"`,
        `"${it.serverOrStaff}"`,
        it.subtotal.toFixed(2),
        it.discountAmount.toFixed(2),
        it.taxAmount.toFixed(2),
        it.grandTotal.toFixed(2),
        it.amountPaid.toFixed(2),
        it.balanceDue.toFixed(2),
        it.refundAmount.toFixed(2),
        `"${it.paymentMethod}"`,
        `"${it.paymentStatus}"`,
        `"${it.transactionStatus}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Navigation Breadcrumb Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/accounts"
            className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accounts Hub</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sales Transactions</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          
        </div>
      </div>

      {/* 2. Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sales Transactions</h1>
            
          </div>
          
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
            onClick={handleOpenNewSale}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* 3. Sales Summary Cards (8 KPI metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {/* Total Sales */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Sales</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1 truncate">
            Rs. {summary.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
        </div>

        {/* Total Invoices */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoices</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1">{summary.totalInvoices}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Bills count</div>
        </div>

        {/* Paid Sales */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid Sales</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            Rs. {summary.paidSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Cash &amp; bank</div>
        </div>

        {/* Unpaid / Credit */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unpaid Due</div>
          <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-1 truncate">
            Rs. {summary.unpaidSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Receivables balance</div>
        </div>

        {/* Partially Paid */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Partially Paid</div>
          <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1">{summary.partiallyPaidCount}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Partial bills</div>
        </div>

        {/* Sales Returns */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Returns</div>
          <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">{summary.salesReturnsCount}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Return records</div>
        </div>

        {/* Refund Amount */}
        <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Refunds</div>
          <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-1 truncate">
            Rs. {summary.refundAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Refunded money</div>
        </div>

        {/* Net Sales */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Net Sales</div>
          <div className="text-base font-black text-[#0B3D32] dark:text-emerald-300 mt-1 truncate">
            Rs. {summary.netSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Total &minus; Refunds</div>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-2.5">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice, order, customer, table..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Channel */}
          <div>
            <select
              value={salesChannel}
              onChange={(e) => setSalesChannel(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Channels</option>
              <option value="POS">POS / Counter</option>
              <option value="DINE_IN">Dine-In</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
              <option value="ONLINE">Online</option>
              <option value="ROOM_SERVICE">Room Service</option>
            </select>
          </div>

          {/* Outlet */}
          <div>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Outlets</option>
              <option value="RESTAURANT">Everest Restaurant</option>
              <option value="ROOFTOP_BAR">Rooftop Lounge</option>
              <option value="ZENITH_SPA">Zenith Spa</option>
              <option value="ROOM_SERVICE">Room Service</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">QR / UPI / Wallet</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Customer Credit</option>
              <option value="SPLIT">Split Payment</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CREDIT">Credit</option>
              <option value="VOID">Void</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </form>

        {/* Secondary filters row (Date range, Transaction status, Reset) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            />
            <span className="text-slate-400">&minus;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            />

            {/* Quick date presets */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('yesterday')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('thisWeek')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('thisMonth')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                All Time
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={transactionStatus}
              onChange={(e) => setTransactionStatus(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
            >
              <option value="ALL">All Transaction Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
              <option value="PARTIALLY_RETURNED">Partially Returned</option>
            </select>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 5. Sales Transactions Enterprise Data Table */}
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortBy('billNumber'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Invoice No.
                </th>
                <th className="py-2.5 px-3 cursor-pointer" onClick={() => { setSortBy('createdAt'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Date &amp; Time
                </th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Outlet</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">Tax</th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => { setSortBy('grandTotal'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Grand Total
                </th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => { setSortBy('balanceDue'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                  Due
                </th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Trans. Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading sales transactions...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300">No Sales Transactions Found</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or click "+ New Sale" to record a sale.</div>
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const dateObj = new Date(it.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Status badges
                  const paymentBadgeColor =
                    it.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : it.paymentStatus === 'PARTIAL'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                      : it.paymentStatus === 'CREDIT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      : it.paymentStatus === 'VOID'
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 line-through'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300';

                  const transBadgeColor =
                    it.transactionStatus === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : it.transactionStatus === 'CANCELLED'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : it.transactionStatus === 'RETURNED'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : it.transactionStatus === 'PARTIALLY_RETURNED'
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                      : 'bg-slate-50 text-slate-700 border border-slate-200';

                  return (
                    <tr
                      key={it.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{rowNum}</td>

                      {/* Invoice No */}
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(it.id)}
                          className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{it.billNumber}</span>
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                          {it.customerName}
                        </div>
                        {it.customerPhone && (
                          <div className="text-[10px] text-slate-400">{it.customerPhone}</div>
                        )}
                      </td>

                      {/* Order Number */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                          {it.orderNumber || '&minus;'}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {it.salesChannel.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Outlet */}
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">
                          {it.outlet === 'RESTAURANT' ? 'Restaurant' : it.outlet === 'ROOFTOP_BAR' ? 'Rooftop Bar' : it.outlet}
                        </span>
                      </td>

                      {/* Cashier */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[90px]">
                        {it.serverOrStaff}
                      </td>

                      {/* Subtotal */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {it.subtotal.toFixed(2)}
                      </td>

                      {/* Tax */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {it.taxAmount.toFixed(2)}
                      </td>

                      {/* Grand Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {it.grandTotal.toFixed(2)}
                      </td>

                      {/* Paid */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {it.amountPaid.toFixed(2)}
                      </td>

                      {/* Due */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {it.balanceDue > 0.01 ? (
                          <span className="text-amber-600 dark:text-amber-400">{it.balanceDue.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">0.00</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {it.paymentMethod}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${paymentBadgeColor}`}>
                          {it.paymentStatus}
                        </span>
                      </td>

                      {/* Transaction Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${transBadgeColor}`}>
                          {it.transactionStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => handleViewDetail(it.id)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="View Transaction Details & Accounting"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment (if due) */}
                          {it.balanceDue > 0.01 && it.transactionStatus !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(it)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print Invoice / Receipt */}
                          <button
                            type="button"
                            onClick={() => handleOpenPrint(it.id)}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Print Invoice / Thermal Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Return (if completed) */}
                          {it.transactionStatus === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturn(it)}
                              className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition-colors"
                              title="Process Sales Return & Refund"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel (if active) */}
                          {it.transactionStatus !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(it)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title="Cancel / Void Sale"
                            >
                              <Ban className="w-3.5 h-3.5" />
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

        {/* 6. Always-Visible DataTables Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs">
          {/* Entries per page & count */}
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

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span>
              Showing {totalItems === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, totalItems)} of {totalItems} transactions
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pNum = page - 2 + i;
                if (pNum > totalPages) pNum = totalPages - (4 - i);
              }
              if (pNum <= 0) pNum = 1;

              const isActive = pNum === page;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${
                    isActive
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-600 dark:border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. MODALS */}

      {/* Modal A: View Transaction Details & Accounting */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {detailData?.transaction.billNumber || 'Invoice Details'}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Channel: {detailData?.transaction.salesChannel} &middot; Outlet: {detailData?.transaction.outlet}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {detailData && (
                  <button
                    type="button"
                    onClick={() => handleOpenPrint(detailData.transaction.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded flex items-center gap-1 hover:bg-slate-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span>Loading transaction details &amp; journal lines...</span>
                </div>
              ) : !detailData ? (
                <div className="py-8 text-center text-rose-500">Could not load transaction details.</div>
              ) : (
                <>
                  {/* Top Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {detailData.transaction.customerName}
                      </div>
                      {detailData.transaction.customerPhone && (
                        <div className="text-[10px] text-slate-500">{detailData.transaction.customerPhone}</div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Order / Table</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {detailData.transaction.orderNumber || 'Counter Sale'}
                      </div>
                      {detailData.transaction.tableNumber && (
                        <div className="text-[10px] text-slate-500">Table: {detailData.transaction.tableNumber}</div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Cashier / Staff</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {detailData.transaction.serverOrStaff}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(detailData.transaction.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {detailData.transaction.paymentStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {detailData.transaction.transactionStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Line Items ({detailData.transaction.items?.length || 0})</span>
                    </h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="py-2 px-3">Item Name</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Unit Price</th>
                            <th className="py-2 px-3 text-right">Discount</th>
                            <th className="py-2 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {detailData.transaction.items?.map((it: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {it.name}
                                {it.notes && <span className="block text-[10px] text-slate-400 italic">{it.notes}</span>}
                              </td>
                              <td className="py-2 px-3 text-center">{it.quantity}</td>
                              <td className="py-2 px-3 text-right font-mono">{Number(it.unitPrice).toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">
                                {it.discount ? Number(it.discount).toFixed(2) : '0.00'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {Number(it.total).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payments History */}
                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Payment Records ({detailData.transaction.payments?.length || 0})</span>
                      </h4>
                      {detailData.transaction.payments?.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px]">No payment records (Unsettled / Credit).</div>
                      ) : (
                        <div className="space-y-1.5">
                          {detailData.transaction.payments?.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/60 rounded text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{p.paymentMethod}</span>
                                {p.transactionRef && (
                                  <span className="text-[10px] text-slate-400 ml-1.5">Ref: {p.transactionRef}</span>
                                )}
                                <div className="text-[10px] text-slate-400">
                                  {new Date(p.paymentDate).toLocaleString()} &middot; Rec: {p.receivedBy}
                                </div>
                              </div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                Rs. {Number(p.amount).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Totals Summary Card */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                        <span>Subtotal:</span>
                        <span>Rs. {detailData.transaction.subtotal.toFixed(2)}</span>
                      </div>
                      {detailData.transaction.discountAmount > 0 && (
                        <div className="flex justify-between py-0.5 text-rose-600">
                          <span>Total Discount:</span>
                          <span>&minus; Rs. {detailData.transaction.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {detailData.transaction.taxAmount > 0 && (
                        <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                          <span>Tax (VAT):</span>
                          <span>Rs. {detailData.transaction.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {detailData.transaction.serviceCharge > 0 && (
                        <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                          <span>Service Charge:</span>
                          <span>Rs. {detailData.transaction.serviceCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {(detailData.transaction.deliveryCharge > 0 || detailData.transaction.packingCharge > 0) && (
                        <div className="flex justify-between py-0.5 text-slate-600 dark:text-slate-400">
                          <span>Delivery &amp; Packing:</span>
                          <span>
                            Rs. {(detailData.transaction.deliveryCharge + detailData.transaction.packingCharge).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                        <span>Grand Total:</span>
                        <span>Rs. {detailData.transaction.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 text-emerald-600 font-bold">
                        <span>Amount Paid:</span>
                        <span>Rs. {detailData.transaction.amountPaid.toFixed(2)}</span>
                      </div>
                      {detailData.transaction.balanceDue > 0.01 && (
                        <div className="flex justify-between py-0.5 text-amber-600 font-bold">
                          <span>Balance Due:</span>
                          <span>Rs. {detailData.transaction.balanceDue.toFixed(2)}</span>
                        </div>
                      )}
                      {detailData.transaction.refundAmount > 0 && (
                        <div className="flex justify-between py-0.5 text-purple-600 font-bold">
                          <span>Refunded Amount:</span>
                          <span>Rs. {detailData.transaction.refundAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accounting Journal Entry (Double-Entry Verification) */}
                  <div className="p-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#0B3D32] dark:text-emerald-300">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>General Ledger Journal Entry (Double-Entry Posting)</span>
                      </div>
                      {detailData.accounting && (
                        <Link
                          href={`/accounts?tab=journal-entries&search=${detailData.accounting.entryNumber}`}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>View in Journal Entries</span>
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                        </Link>
                      )}
                    </div>

                    {!detailData.accounting ? (
                      <div className="text-[11px] text-slate-500 italic">
                        No separate journal entry recorded for this invoice or legacy transaction.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <span>
                            Entry No: <strong className="text-slate-900 dark:text-white">{detailData.accounting.entryNumber}</strong>
                          </span>
                          <span>&middot;</span>
                          <span>Date: {new Date(detailData.accounting.entryDate).toLocaleDateString()}</span>
                          <span>&middot;</span>
                          <span className="px-1.5 py-0.2 rounded font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800">
                            {detailData.accounting.status}
                          </span>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                              <tr>
                                <th className="py-1.5 px-2.5">Account Code</th>
                                <th className="py-1.5 px-2.5">Account Name</th>
                                <th className="py-1.5 px-2.5">Line Description</th>
                                <th className="py-1.5 px-2.5 text-right">Debit (Rs.)</th>
                                <th className="py-1.5 px-2.5 text-right">Credit (Rs.)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {detailData.accounting.lines?.map((line: any) => (
                                <tr key={line.id}>
                                  <td className="py-1.5 px-2.5 font-bold text-slate-700 dark:text-slate-300">
                                    {line.accountCode}
                                  </td>
                                  <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                                    {line.accountName}
                                  </td>
                                  <td className="py-1.5 px-2.5 font-sans text-slate-500 text-[11px]">
                                    {line.lineDescription}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                                    {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 dark:text-white">
                                    {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                              <tr>
                                <td colSpan={3} className="py-1.5 px-2.5 text-right">
                                  Total:
                                </td>
                                <td className="py-1.5 px-2.5 text-right text-emerald-700 dark:text-emerald-400">
                                  Rs. {detailData.accounting.totalDebit.toFixed(2)}
                                </td>
                                <td className="py-1.5 px-2.5 text-right text-emerald-700 dark:text-emerald-400">
                                  Rs. {detailData.accounting.totalCredit.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Create New Sales Transaction */}
      {newSaleModalOpen && (
        <CreateSaleModal
          menuItems={menuItems}
          customerList={customerList}
          onClose={() => setNewSaleModalOpen(false)}
          onSuccess={() => {
            setNewSaleModalOpen(false);
            fetchTransactions();
          }}
        />
      )}

      {/* Modal C: Record Payment */}
      {paymentModalOpen && paymentTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record Payment &middot; {paymentTarget.billNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Customer</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{paymentTarget.customerName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Balance</span>
                  <div className="font-mono font-bold text-amber-600">Rs. {paymentTarget.balanceDue.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentTarget.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method *</label>
                <select
                  value={paymentMethodChoice}
                  onChange={(e) => setPaymentMethodChoice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="UPI">QR / UPI / Fonepay</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Ref / Receipt No (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TXN-984021"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="Payment remarks..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting || paymentAmount <= 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {paymentSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal D: Process Return & Refund */}
      {returnModalOpen && returnTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sales Return &amp; Refund &middot; {returnTarget.billNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300">
                Select items to return, specify returned quantity, and choose whether to restock kitchen inventory.
              </div>

              {/* Items Return Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-2.5">Item Name</th>
                      <th className="py-2 px-2.5 text-center">Sold Qty</th>
                      <th className="py-2 px-2.5 text-center">Return Qty</th>
                      <th className="py-2 px-2.5 text-right">Price</th>
                      <th className="py-2 px-2.5 text-center">Restock?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {returnItemsState.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2.5 font-semibold text-slate-800 dark:text-slate-200">{it.name}</td>
                        <td className="py-2 px-2.5 text-center text-slate-500">{it.maxQty}</td>
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={it.maxQty}
                            value={it.returnQty}
                            onChange={(e) => {
                              const val = Math.min(it.maxQty, Math.max(0, Number(e.target.value)));
                              setReturnItemsState((prev) => {
                                const next = [...prev];
                                next[idx].returnQty = val;
                                return next;
                              });
                            }}
                            className="w-16 px-1.5 py-0.5 text-xs text-center border rounded bg-slate-50 dark:bg-slate-900"
                          />
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono">Rs. {it.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={it.restock}
                            onChange={(e) => {
                              setReturnItemsState((prev) => {
                                const next = [...prev];
                                next[idx].restock = e.target.checked;
                                return next;
                              });
                            }}
                            className="rounded text-emerald-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculated return refund */}
              {(() => {
                const sub = returnItemsState.reduce((acc, it) => acc + it.returnQty * it.unitPrice, 0);
                const tax = Math.round(sub * 0.1 * 100) / 100;
                const tot = Math.round((sub + tax) * 100) / 100;
                return (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 font-mono text-xs flex justify-between">
                    <div>
                      Return Subtotal: <strong>Rs. {sub.toFixed(2)}</strong> &middot; Tax Reversal (10%):{' '}
                      <strong>Rs. {tax.toFixed(2)}</strong>
                    </div>
                    <div className="text-purple-600 font-bold">Total Refund: Rs. {tot.toFixed(2)}</div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Return Reason *
                </label>
                <input
                  type="text"
                  value={returnReasonGlobal}
                  onChange={(e) => setReturnReasonGlobal(e.target.value)}
                  placeholder="e.g. Customer changed mind, wrong order, cold food"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Refund Method *</label>
                <select
                  value={returnRefundMethod}
                  onChange={(e) => setReturnRefundMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="BANK">Bank / Card Reversal</option>
                  <option value="CREDIT_NOTE">Customer Credit Note / AR Reversal</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {returnSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Approve &amp; Process Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal E: Cancel / Void Transaction */}
      {cancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Cancel Transaction &middot; {cancelTarget.billNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel} className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-rose-600" />
                <strong>Warning:</strong> Cancelling this transaction will void the invoice, reverse customer ledger
                entries, and automatically post a reversal entry to the General Ledger.
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this sales invoice is being cancelled..."
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting || !cancelReason.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  {cancelSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal F: Print Invoice / Thermal Receipt */}
      {printModalOpen && printTarget && (
        <PrintModal
          detail={printTarget}
          format={printFormat}
          onFormatChange={setPrintFormat}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}

// =========================================================================
// Sub-Component: Create Sale Modal
// =========================================================================
interface CreateSaleModalProps {
  menuItems: any[];
  customerList: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateSaleModal({ menuItems, customerList, onClose, onSuccess }: CreateSaleModalProps) {
  const [salesChannel, setSalesChannel] = useState('POS');
  const [outlet, setOutlet] = useState('RESTAURANT');
  const [tableNumber, setTableNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [cashierOrStaff, setCashierOrStaff] = useState('Cashier');
  const [customerMode, setCustomerMode] = useState<'walkin' | 'registered'>('walkin');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Items
  const [selectedProductSearch, setSelectedProductSearch] = useState('');
  const [lineItems, setLineItems] = useState<
    { productId?: string; name: string; quantity: number; unitPrice: number; discountAmount: number; notes?: string }[]
  >([]);

  // Charges & Discounts
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(10); // 10% VAT default
  const [serviceRate, setServiceRate] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [packingCharge, setPackingCharge] = useState<number>(0);

  // Payment
  const [paymentChoice, setPaymentChoice] = useState<'FULL_CASH' | 'FULL_CARD' | 'FULL_UPI' | 'CREDIT' | 'SPLIT'>('FULL_CASH');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [cardPaid, setCardPaid] = useState<number>(0);
  const [upiPaid, setUpiPaid] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Calculations
  const rawSubtotal = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }, [lineItems]);

  const totalItemDiscounts = useMemo(() => {
    return lineItems.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
  }, [lineItems]);

  const totalDiscounts = totalItemDiscounts + (invoiceDiscount || 0);
  const subtotalAfterDiscounts = Math.max(0, rawSubtotal - totalDiscounts);
  const taxAmount = Math.round(subtotalAfterDiscounts * (taxRate / 100) * 100) / 100;
  const serviceCharge = Math.round(subtotalAfterDiscounts * (serviceRate / 100) * 100) / 100;
  const grandTotal = Math.round((subtotalAfterDiscounts + taxAmount + serviceCharge + (deliveryCharge || 0) + (packingCharge || 0)) * 100) / 100;

  // Add Item to sale
  const handleAddItem = (prod: any) => {
    const existingIdx = lineItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      setLineItems((prev) => {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      });
    } else {
      setLineItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.price,
          discountAmount: 0,
        },
      ]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      alert('Please add at least one line item to the sale.');
      return;
    }

    setSubmitting(true);
    try {
      const paymentsList: any[] = [];
      if (paymentChoice === 'FULL_CASH') {
        paymentsList.push({
          id: `PAY-1`,
          amount: grandTotal,
          paymentMethod: 'CASH',
          paymentDate: new Date().toISOString(),
          transactionRef: paymentRef,
          receivedBy: cashierOrStaff,
        });
      } else if (paymentChoice === 'FULL_CARD') {
        paymentsList.push({
          id: `PAY-1`,
          amount: grandTotal,
          paymentMethod: 'CARD',
          paymentDate: new Date().toISOString(),
          transactionRef: paymentRef,
          receivedBy: cashierOrStaff,
        });
      } else if (paymentChoice === 'FULL_UPI') {
        paymentsList.push({
          id: `PAY-1`,
          amount: grandTotal,
          paymentMethod: 'UPI',
          paymentDate: new Date().toISOString(),
          transactionRef: paymentRef,
          receivedBy: cashierOrStaff,
        });
      } else if (paymentChoice === 'SPLIT') {
        if (cashPaid > 0) {
          paymentsList.push({
            id: `PAY-CASH`,
            amount: cashPaid,
            paymentMethod: 'CASH',
            paymentDate: new Date().toISOString(),
            receivedBy: cashierOrStaff,
          });
        }
        if (cardPaid > 0) {
          paymentsList.push({
            id: `PAY-CARD`,
            amount: cardPaid,
            paymentMethod: 'CARD',
            paymentDate: new Date().toISOString(),
            transactionRef: paymentRef,
            receivedBy: cashierOrStaff,
          });
        }
        if (upiPaid > 0) {
          paymentsList.push({
            id: `PAY-UPI`,
            amount: upiPaid,
            paymentMethod: 'UPI',
            paymentDate: new Date().toISOString(),
            transactionRef: paymentRef,
            receivedBy: cashierOrStaff,
          });
        }
      }
      // If CREDIT, paymentsList is empty, invoice balance is credit

      const reqPayload: CreateSalesTransactionRequest = {
        customerId: customerMode === 'registered' ? selectedCustomerId : undefined,
        customerName: customerMode === 'registered' ? undefined : customerName,
        customerPhone: customerPhone.trim() || undefined,
        salesChannel,
        outlet,
        tableNumber: tableNumber.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        cashierOrStaff,
        items: lineItems,
        invoiceDiscountAmount: invoiceDiscount,
        taxRatePercent: taxRate,
        serviceChargePercent: serviceRate,
        deliveryCharge,
        packingCharge,
        payments: paymentsList,
        notes: notes.trim() || undefined,
      };

      await api.createSalesTransaction(reqPayload);
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Failed to create sales transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProds = useMemo(() => {
    if (!selectedProductSearch.trim()) return menuItems.slice(0, 15);
    const s = selectedProductSearch.toLowerCase();
    return menuItems.filter((p) => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)).slice(0, 15);
  }, [menuItems, selectedProductSearch]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Sales Transaction</h3>
              <div className="text-[10px] text-slate-500">Record direct restaurant sale, POS bill, or dine-in transaction</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Top Options Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sales Channel</label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
              >
                <option value="POS">POS Quick Sale</option>
                <option value="DINE_IN">Dine-In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
                <option value="ONLINE">Online</option>
                <option value="ROOM_SERVICE">Room Service</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Outlet</label>
              <select
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
              >
                <option value="RESTAURANT">Everest Restaurant</option>
                <option value="ROOFTOP_BAR">Rooftop Lounge</option>
                <option value="ZENITH_SPA">Zenith Spa</option>
                <option value="ROOM_SERVICE">Room Service</option>
              </select>
            </div>

            {salesChannel === 'DINE_IN' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Table Number</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-04"
                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                />
              </div>
            ) : salesChannel === 'ROOM_SERVICE' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204"
                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cashier / Staff</label>
                <input
                  type="text"
                  value={cashierOrStaff}
                  onChange={(e) => setCashierOrStaff(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Customer Type</label>
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={customerMode === 'walkin'}
                    onChange={() => setCustomerMode('walkin')}
                  />
                  <span>Walk-in</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="custType"
                    checked={customerMode === 'registered'}
                    onChange={() => setCustomerMode('registered')}
                  />
                  <span>Credit / Account</span>
                </label>
              </div>
            </div>
          </div>

          {/* Customer info fields */}
          {customerMode === 'walkin' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Guest"
                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9841000000"
                  className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Customer Account *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="">-- Choose Customer --</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} &middot; Phone: {c.phone} (Outstanding: Rs. {c.currentOutstanding.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Menu items picker and line items table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left: Quick Item Picker */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-[280px]">
              <div className="mb-2">
                <input
                  type="text"
                  value={selectedProductSearch}
                  onChange={(e) => setSelectedProductSearch(e.target.value)}
                  placeholder="Search item to add..."
                  className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {filteredProds.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod)}
                    className="w-full p-1.5 text-left rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{prod.category}</div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Rs. {prod.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selected Line Items */}
            <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col h-[280px]">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs">
                Selected Line Items ({lineItems.length})
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-1.5 px-2">Item</th>
                      <th className="py-1.5 px-2 text-center w-16">Qty</th>
                      <th className="py-1.5 px-2 text-right w-20">Price</th>
                      <th className="py-1.5 px-2 text-right w-20">Total</th>
                      <th className="py-1.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Click items on the left to add them to this sale.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {it.name}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => {
                                const q = Math.max(1, Number(e.target.value));
                                setLineItems((prev) => {
                                  const next = [...prev];
                                  next[idx].quantity = q;
                                  return next;
                                });
                              }}
                              className="w-14 px-1 py-0.5 text-xs text-center border rounded bg-slate-50 dark:bg-slate-900"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">{it.unitPrice.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                            {(it.quantity * it.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Charges and Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-200 dark:border-slate-800">
            {/* Left: Additional Charges Inputs */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Discount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceDiscount}
                    onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">VAT Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Delivery Fee (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Packing Fee (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packingCharge}
                    onChange={(e) => setPackingCharge(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right: Calculated Totals */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rs. {rawSubtotal.toFixed(2)}</span>
              </div>
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>&minus; Rs. {totalDiscounts.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>VAT ({taxRate}%):</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <label className="block font-bold text-slate-800 dark:text-slate-200">Payment Collection</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setPaymentChoice('FULL_CASH')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
                  paymentChoice === 'FULL_CASH'
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                Cash Full
              </button>
              <button
                type="button"
                onClick={() => setPaymentChoice('FULL_CARD')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
                  paymentChoice === 'FULL_CARD'
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                Card Full
              </button>
              <button
                type="button"
                onClick={() => setPaymentChoice('FULL_UPI')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
                  paymentChoice === 'FULL_UPI'
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                QR / UPI Full
              </button>
              <button
                type="button"
                onClick={() => setPaymentChoice('CREDIT')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
                  paymentChoice === 'CREDIT'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                Credit / Due
              </button>
              <button
                type="button"
                onClick={() => setPaymentChoice('SPLIT')}
                className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
                  paymentChoice === 'SPLIT'
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                Split Payment
              </button>
            </div>

            {paymentChoice === 'SPLIT' && (
              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Cash (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Card (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cardPaid}
                    onChange={(e) => setCardPaid(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">QR / UPI (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={upiPaid}
                    onChange={(e) => setUpiPaid(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || lineItems.length === 0}
              className="px-5 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Complete Sale &amp; Post Journal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// Sub-Component: Print Receipt / Invoice Modal
// =========================================================================
interface PrintModalProps {
  detail: SalesTransactionDetail;
  format: 'thermal80' | 'thermal58' | 'a4';
  onFormatChange: (fmt: 'thermal80' | 'thermal58' | 'a4') => void;
  onClose: () => void;
}

function PrintModal({ detail, format, onFormatChange, onClose }: PrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { transaction: tx, hotel } = detail;
  const items = tx.items || [];
  const dateStr = new Date(tx.createdAt).toLocaleDateString();
  const timeStr = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Print Preview</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onFormatChange('thermal80')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${
                format === 'thermal80' ? 'bg-[#0B3D32] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('thermal58')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${
                format === 'thermal58' ? 'bg-[#0B3D32] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
              }`}
            >
              58mm Thermal
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('a4')}
              className={`px-2 py-1 text-[11px] font-bold rounded ${
                format === 'a4' ? 'bg-[#0B3D32] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
              }`}
            >
              A4 Invoice
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="ml-2 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>

            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={printAreaRef}
            className={`bg-white text-black p-4 font-mono shadow-md ${
              format === 'thermal58'
                ? 'w-[240px] text-[10px]'
                : format === 'thermal80'
                ? 'w-[320px] text-xs'
                : 'w-[520px] text-xs'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <div className="font-bold text-sm uppercase">{hotel.name}</div>
              <div className="text-[10px]">{hotel.address}</div>
              <div className="text-[10px]">Tel: {hotel.phone}</div>
              <div className="text-[10px] font-bold">{hotel.panVat}</div>
            </div>

            {/* Bill Details */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{tx.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE: {dateStr}</span>
                <span>TIME: {timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span>{tx.customerName}</span>
              </div>
              {tx.tableNumber && (
                <div className="flex justify-between">
                  <span>TABLE: {tx.tableNumber}</span>
                  <span>OUTLET: {tx.outlet}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{tx.serverOrStaff}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-black">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="py-0.5 truncate max-w-[120px]">{it.name}</td>
                      <td className="py-0.5 text-center">{it.quantity}</td>
                      <td className="py-0.5 text-right">{Number(it.unitPrice).toFixed(0)}</td>
                      <td className="py-0.5 text-right">{Number(it.total).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-2 space-y-0.5 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {tx.subtotal.toFixed(2)}</span>
              </div>
              {tx.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>&minus;Rs. {tx.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {tx.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT (10%):</span>
                  <span>Rs. {tx.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                <span>TOTAL:</span>
                <span>Rs. {tx.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>PAID ({tx.paymentMethod}):</span>
                <span>Rs. {tx.amountPaid.toFixed(2)}</span>
              </div>
              {tx.balanceDue > 0.01 && (
                <div className="flex justify-between font-bold">
                  <span>DUE:</span>
                  <span>Rs. {tx.balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-black text-[10px] space-y-0.5">
              <div>Thank you for dining with us!</div>
              <div>Please visit us again.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


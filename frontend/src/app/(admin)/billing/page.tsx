'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import {
  FileText,
  Search,
  RefreshCw,
  Printer,
  Eye,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  DollarSign,
  Receipt,
  UtensilsCrossed,
  Hotel,
  Zap,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BillData, BillingType, BillPaymentStatus, BillingSummaryData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ViewBillModal } from '@/components/billing/ViewBillModal';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';

function BillingContent() {
  const toast = useToast();
  const searchParams = useSearchParams();

  // URL query params initialization
  const initialType = searchParams.get('type') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';

  // State
  const [bills, setBills] = useState<BillData[]>([]);
  const [summary, setSummary] = useState<BillingSummaryData>({
    totalBilled: 0,
    totalPaid: 0,
    totalDue: 0,
    totalBills: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');

  // Modals
  const [viewBill, setViewBill] = useState<BillData | null>(null);
  const [paymentBill, setPaymentBill] = useState<BillData | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Pagination calculation
  const totalEntries = bills.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBills = useMemo(() => {
    return bills.slice(startIndex, startIndex + pageSize);
  }, [bills, startIndex, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus, dateFilter]);

  // Load Bills from API
  const loadBills = async () => {
    setIsLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      if (dateFilter === 'TODAY') {
        const todayStr = now.toISOString().split('T')[0];
        startDate = todayStr;
        endDate = todayStr;
      } else if (dateFilter === 'YESTERDAY') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split('T')[0];
        startDate = yestStr;
        endDate = yestStr;
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const res = await api.getBills({
        search: searchQuery.trim() || undefined,
        billingType: selectedType !== 'ALL' ? selectedType : undefined,
        paymentStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate,
        endDate,
        page: 1,
        pageSize: 100,
      });

      setBills(res.items || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      toast.error('Failed to load bills', err.message || 'Check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [selectedType, selectedStatus, dateFilter]);

  // Client-side quick search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBills();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePaymentSuccess = (updatedBill: BillData) => {
    setBills((prev) =>
      prev.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    );
    // Reload totals
    loadBills();
  };

  const getBillingTypeBadge = (type: BillingType) => {
    switch (type) {
      case 'QUICK_BILL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
            <Zap className="w-2.5 h-2.5" />
            <span>Quick Bill</span>
          </span>
        );
      case 'WALK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <span>Walk-in</span>
          </span>
        );
      case 'TABLE_ORDER':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <UtensilsCrossed className="w-2.5 h-2.5" />
            <span>Table Order</span>
          </span>
        );
      case 'ROOM_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <span>Room Service</span>
          </span>
        );
      case 'HOTEL_CHECKOUT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Hotel className="w-2.5 h-2.5" />
            <span>Hotel Checkout</span>
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: BillPaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Paid</span>
          </span>
        );
      case 'CREDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
            <CreditCard className="w-2.5 h-2.5" />
            <span>Credit</span>
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-2.5 h-2.5" />
            <span>Partial</span>
          </span>
        );
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Unpaid</span>
          </span>
        );
      case 'VOID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <span>Voided</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 pb-14 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Billing & Invoices
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/quick-sale"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Bill</span>
          </Link>
          <button
            type="button"
            onClick={loadBills}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh bills ledger"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Main Data Panel & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Filter Strip */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bill #, guest, order, stay ref..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Select Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-[30px] px-2.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="QUICK_BILL">Quick Bill (Counter)</option>
                <option value="WALK_IN">Walk-in Order</option>
                <option value="TABLE_ORDER">Table Order</option>
                <option value="ROOM_SERVICE">Room Service</option>
                <option value="HOTEL_CHECKOUT">Hotel Checkout</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-[30px] px-2.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="CREDIT">Credit</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>

          {/* Date Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'WEEK', label: 'Last 7 Days' },
                { id: 'MONTH', label: 'Last 30 Days' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer shadow-2xs',
                  dateFilter === df.id
                    ? 'bg-[#0B3D32] text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                )}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================================
            4. THE 9-COLUMN CENTRAL BILLS TABLE
            ===================================================================== */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAF9] dark:bg-[#07241E] text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#DCE3DF] dark:border-[#145447]">
              <tr>
                <th className="p-3 w-36">Bill Number</th>
                <th className="p-3 w-32">Date & Time</th>
                <th className="p-3 w-32">Billing Type</th>
                <th className="p-3">Reference (Order / Stay)</th>
                <th className="p-3 text-right w-28">Grand Total</th>
                <th className="p-3 text-right w-24">Amount Paid</th>
                <th className="p-3 text-right w-24">Balance Due</th>
                <th className="p-3 text-center w-24">Payment Status</th>
                <th className="p-3 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F2] dark:divide-[#103D33]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                      <span>Loading unified bills ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    No bills found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((b) => {
                  const formattedDateTime = new Date(b.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  // Build reference display
                  const refParts: string[] = [];
                  if (b.orderNumber) refParts.push(b.orderNumber);
                  if (b.bookingCode) refParts.push(`Stay: ${b.bookingCode}`);
                  if (b.tableNumber) refParts.push(`Table ${b.tableNumber}`);
                  if (b.roomNumber) refParts.push(`Room ${b.roomNumber}`);
                  if (b.customerName && b.customerName !== 'Counter Guest') {
                    refParts.push(b.customerName);
                  }

                  const refText = refParts.length > 0 ? refParts.join(' · ') : 'Direct Sale';

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-[#F9FCFA] dark:hover:bg-[#07241E]/60 transition-colors"
                    >
                      {/* 1. Bill Number */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400 block">
                          {b.billNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Method: {b.paymentMethod}
                        </span>
                      </td>

                      {/* 2. Date & Time */}
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {formattedDateTime}
                      </td>

                      {/* 3. Billing Type */}
                      <td className="p-3 whitespace-nowrap">
                        {getBillingTypeBadge(b.billingType)}
                      </td>

                      {/* 4. Order Number or Stay Reference */}
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                        <div className="truncate max-w-xs">{refText}</div>
                        {b.serverOrStaff && (
                          <div className="text-[10px] text-slate-400">
                            By: {b.serverOrStaff}
                          </div>
                        )}
                      </td>

                      {/* 5. Grand Total */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {b.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 6. Amount Paid */}
                      <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        Rs. {b.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 7. Balance Due */}
                      <td className="p-3 text-right font-mono">
                        {b.balanceDue > 0.01 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            Rs. {b.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0.00</span>
                        )}
                      </td>

                      {/* 8. Payment Status */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {getPaymentStatusBadge(b.paymentStatus)}
                      </td>

                      {/* 9. Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Record Payment if due */}
                          {b.balanceDue > 0.01 && (
                            <button
                              type="button"
                              onClick={() => setPaymentBill(b)}
                              title="Record Payment"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* View Bill Modal */}
                          <button
                            type="button"
                            onClick={() => setViewBill(b)}
                            title="View Document & Print"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
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

        {/* Table Footer Strip: DataTables Pagination */}
        <div className="p-3 border-t border-[#F0F4F2] dark:border-[#103D33] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-[#F8FAF9] dark:bg-[#07241E] select-none">
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
                {totalEntries === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(startIndex + pageSize, totalEntries)}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalEntries}</strong>{' '}
              entries
            </div>
          </div>

          {/* Right: DataTables Style Pagination Group */}
          {totalPages > 1 && (
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

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safeCurrentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const isGap = prev && page - prev > 1;

                  return (
                    <React.Fragment key={page}>
                      {isGap && (
                        <span className="px-1 text-slate-400 select-none font-bold">
                          …
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                          page === safeCurrentPage
                            ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                            : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
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
          )}
        </div>
      </div>

      {/* =====================================================================
          5. DOCUMENT VIEW & PRINT MODAL
          ===================================================================== */}
      <ViewBillModal
        bill={viewBill}
        isOpen={!!viewBill}
        onClose={() => setViewBill(null)}
        onOpenRecordPayment={(b) => setPaymentBill(b)}
      />

      {/* =====================================================================
          6. RECORD PAYMENT MODAL
          ===================================================================== */}
      <RecordPaymentModal
        bill={paymentBill}
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 p-12 text-center text-xs text-slate-400">
          Loading Shared Billing & Invoicing System...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

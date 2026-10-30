'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { BillData, BillingType, BillPaymentStatus, BillingSummaryData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { BillingNavBoxes } from '@/components/billing/BillingNavBoxes';
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
    <div className="space-y-4 max-w-7xl mx-auto pb-14 select-none">
      {/* =====================================================================
          1. TOP NAVIGATION MODULE BOXES (QUICK HUB)
          ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Billing & Invoicing Hub
          </span>
        </div>
        <BillingNavBoxes />
      </div>

      {/* =====================================================================
          2. FINANCIAL SUMMARY METRICS STRIP
          ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Total Billed / Invoiced
          </span>
          <div className="text-lg font-black font-mono text-[#0B3D32] dark:text-emerald-400 mt-0.5">
            Rs. {summary.totalBilled.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Across {summary.totalBills} recorded bills
          </span>
        </div>

        <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Collected / Settled
          </span>
          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-300 mt-0.5">
            Rs. {summary.totalPaid.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Cash, Card & QR collections
          </span>
        </div>

        <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Balance Due / Outstanding
          </span>
          <div
            className={cn(
              'text-lg font-black font-mono mt-0.5',
              summary.totalDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
            )}
          >
            Rs. {summary.totalDue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Pending table & stay balances
          </span>
        </div>

        <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Total Bills Count
          </span>
          <div className="text-lg font-black font-mono text-slate-800 dark:text-white mt-0.5">
            {summary.totalBills} Bills
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Sequential & permanent
          </span>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN DATA PANEL: HEADER, FILTERS & TABLE
          ===================================================================== */}
      <div className="bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs overflow-hidden">
        {/* Panel Header */}
        <div className="p-3.5 border-b border-[#DCE3DF] dark:border-[#145447] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAF9] dark:bg-[#07241E]">
          <div>
            <h1 className="text-sm font-bold font-heading text-[#24352F] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <span>Central Bills & Invoices Ledger</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Unified billing for hotel checkouts, restaurant dining, quick sales, and room service folios
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadBills}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-semibold text-[#24352F] dark:text-slate-200 hover:bg-[#F2F6F4] transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="p-3 border-b border-[#F0F4F2] dark:border-[#103D33] space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Bill # (e.g. BILL-2026-000001), Order #, Stay Ref, Guest name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Billing Type Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Type:
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="ALL">All Billing Types</option>
                <option value="QUICK_BILL">Quick Bill (Counter)</option>
                <option value="WALK_IN">Walk-in Order</option>
                <option value="TABLE_ORDER">Table Order</option>
                <option value="ROOM_SERVICE">Room Service</option>
                <option value="HOTEL_CHECKOUT">Hotel Checkout</option>
              </select>
            </div>

            {/* Payment Status Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="UNPAID">Unpaid / Due</option>
                <option value="VOID">Voided</option>
              </select>
            </div>
          </div>

          {/* Date Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Date Filter:
            </span>
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
                  'px-2 py-0.5 rounded-[2px] text-[11px] font-semibold transition-colors cursor-pointer',
                  dateFilter === df.id
                    ? 'bg-[#0B3D32] text-white shadow-2xs'
                    : 'bg-[#F2F6F4] text-slate-600 hover:bg-slate-200 dark:bg-[#0A2E26] dark:text-slate-300 dark:hover:bg-[#0F3D32]'
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
                bills.map((b) => {
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
                        <div className="inline-flex items-center gap-1">
                          {/* Record Payment if due */}
                          {b.balanceDue > 0.01 && (
                            <button
                              type="button"
                              onClick={() => setPaymentBill(b)}
                              title="Record Payment"
                              className="p-1.5 rounded-[2px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Bill Modal */}
                          <button
                            type="button"
                            onClick={() => setViewBill(b)}
                            title="View Document"
                            className="p-1.5 rounded-[2px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print / Reprint */}
                          <button
                            type="button"
                            onClick={() => setViewBill(b)}
                            title="Print / Reprint Bill"
                            className="p-1.5 rounded-[2px] bg-[#0B3D32] hover:bg-[#124D40] text-white transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
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

        {/* Table Footer Strip */}
        <div className="p-3 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center justify-between text-[11px] text-slate-500 bg-[#F8FAF9] dark:bg-[#07241E]">
          <div>
            Showing <strong>{bills.length}</strong> finalized bills
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px]">
              Concurrency Safe · Unique Database Constraint · Permanent Audit Record
            </span>
          </div>
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
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400">
          Loading Shared Billing & Invoicing System...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

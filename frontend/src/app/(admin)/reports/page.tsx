'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CreditCard,
  XCircle,
  BarChart3,
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  loadBookingsFromStorage,
  loadCancellationsFromStorage,
  getAllStayRecords,
  getAllCafeOrders,
  getAllPaymentTransactions,
  calculateHotelRevenueMetrics,
  RoomBooking,
  CancellationRecord,
  ConsolidatedStayRecord,
  ConsolidatedOrderRecord,
  ConsolidatedPaymentRecord,
  AVAILABLE_ROOMS_CATALOG,
} from '../reservations/reservationsData';

// Human-friendly date range formatter (e.g. 15 – 17 Oct 2026)
function formatDisplayDates(checkIn: string, checkOut: string): string {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const p1 = checkIn.split('-');
    const p2 = checkOut.split('-');
    if (p1.length === 3 && p2.length === 3) {
      const d1 = parseInt(p1[2], 10);
      const m1 = months[parseInt(p1[1], 10) - 1];
      const y1 = p1[0];
      const d2 = parseInt(p2[2], 10);
      const m2 = months[parseInt(p2[1], 10) - 1];
      const y2 = p2[0];

      if (y1 === y2) {
        if (m1 === m2) {
          return `${d1} – ${d2} ${m1} ${y1}`;
        }
        return `${d1} ${m1} – ${d2} ${m2} ${y1}`;
      }
      return `${d1} ${m1} ${y1} – ${d2} ${m2} ${y2}`;
    }
  } catch {}
  return `${checkIn} – ${checkOut}`;
}

export default function StayHistoryAndReportsPage() {
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active top tab: stays | payments | cancellations | revenue (NO separate orders tab)
  const [activeTab, setActiveTab] = useState<'stays' | 'payments' | 'cancellations' | 'revenue'>('stays');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'OCT_2026' | 'SEP_2026'>('ALL');

  // Load from local storage
  const reloadData = () => {
    const loadedBookings = loadBookingsFromStorage();
    const loadedCancellations = loadCancellationsFromStorage();
    setBookings(loadedBookings);
    setCancellations(loadedCancellations);
    setIsLoaded(true);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Aggregated data
  const allStays = useMemo(() => getAllStayRecords(bookings), [bookings]);
  const allPayments = useMemo(() => getAllPaymentTransactions(bookings), [bookings]);
  const revenueMetrics = useMemo(() => calculateHotelRevenueMetrics(bookings, cancellations), [bookings, cancellations]);

  // Filtered Stays
  const filteredStays = useMemo(() => {
    return allStays.filter((stay) => {
      if (selectedRoom !== 'ALL' && stay.roomNumber !== selectedRoom) return false;
      if (selectedStatus !== 'ALL' && stay.status !== selectedStatus) return false;

      if (dateFilter === 'OCT_2026') {
        if (!stay.checkIn.includes('2026-10') && !stay.checkOut.includes('2026-10')) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        stay.guestName.toLowerCase().includes(q) ||
        stay.guestPhone.toLowerCase().includes(q) ||
        stay.roomNumber.toLowerCase().includes(q) ||
        stay.bookingCode.toLowerCase().includes(q) ||
        stay.roomType.toLowerCase().includes(q)
      );
    });
  }, [allStays, selectedRoom, selectedStatus, dateFilter, searchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      if (selectedRoom !== 'ALL' && p.roomNumber !== selectedRoom) return false;
      if (selectedMethod !== 'ALL' && p.method !== selectedMethod) return false;
      if (selectedStatus !== 'ALL' && p.type !== selectedStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.receiptNo.toLowerCase().includes(q) ||
        p.guestName.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [allPayments, selectedRoom, selectedMethod, selectedStatus, searchQuery]);

  // Filtered Cancellations
  const filteredCancellations = useMemo(() => {
    return cancellations.filter((c) => {
      if (selectedRoom !== 'ALL' && c.roomNumber !== selectedRoom) return false;
      if (selectedStatus !== 'ALL' && c.refundStatus !== selectedStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.bookingCode.toLowerCase().includes(q) ||
        c.guestName.toLowerCase().includes(q) ||
        c.guestPhone.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
      );
    });
  }, [cancellations, selectedRoom, selectedStatus, searchQuery]);

  // Divided Table Totals
  const stayTotals = useMemo(() => {
    return filteredStays.reduce(
      (acc, s) => {
        acc.roomCharges += s.roomCharges;
        acc.cafeTotal += s.cafeTotal;
        acc.totalCharges += s.totalCharges;
        acc.totalPaid += s.totalPaid;
        return acc;
      },
      { roomCharges: 0, cafeTotal: 0, totalCharges: 0, totalPaid: 0 }
    );
  }, [filteredStays]);

  const paymentTotal = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const cancellationTotal = useMemo(() => {
    return filteredCancellations.reduce((sum, c) => sum + c.originalAmount, 0);
  }, [filteredCancellations]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let filename = '';
    let rows: string[][] = [];

    if (activeTab === 'stays') {
      filename = `hotel_stay_history_${new Date().toISOString().split('T')[0]}.csv`;
      rows.push([
        'Booking Code',
        'Guest Name',
        'Guest Phone',
        'Room Number',
        'Room Type',
        'Check-In Date',
        'Check-Out Date',
        'Nights',
        'Room Fare (Rs.)',
        'Cafe Orders Total (Rs.)',
        'Total Folio (Rs.)',
        'Total Paid (Rs.)',
        'Partially Paid / Balance Due (Rs.)',
        'Payment Status',
        'Stay Status',
      ]);
      filteredStays.forEach((s) => {
        const paymentLabel = s.balanceDue === 0 ? 'Paid in Full' : s.totalPaid > 0 ? 'Partially Paid' : 'Unpaid';
        rows.push([
          s.bookingCode,
          s.guestName,
          s.guestPhone,
          s.roomNumber,
          s.roomType,
          s.checkIn,
          s.checkOut,
          s.nights.toString(),
          s.roomCharges.toString(),
          s.cafeTotal.toString(),
          s.totalCharges.toString(),
          s.totalPaid.toString(),
          s.balanceDue.toString(),
          paymentLabel,
          s.status,
        ]);
      });
    } else if (activeTab === 'payments') {
      filename = `hotel_cashiering_payments_${new Date().toISOString().split('T')[0]}.csv`;
      rows.push(['Receipt Number', 'Date', 'Booking Code', 'Room', 'Guest', 'Amount (Rs.)', 'Payment Method', 'Payment Type', 'Notes']);
      filteredPayments.forEach((p) => {
        rows.push([
          p.receiptNo,
          p.date,
          p.bookingCode,
          p.roomNumber,
          p.guestName,
          p.amount.toString(),
          p.method,
          p.type,
          p.notes || '',
        ]);
      });
    } else if (activeTab === 'cancellations') {
      filename = `hotel_cancellations_log_${new Date().toISOString().split('T')[0]}.csv`;
      rows.push([
        'Booking Code',
        'Guest Name',
        'Guest Phone',
        'Room Number',
        'Room Type',
        'Scheduled Check-In',
        'Scheduled Check-Out',
        'Cancelled At',
        'Cancellation Reason',
        'Original Value (Rs.)',
        'Deposit Paid (Rs.)',
        'Refund Status',
        'Refund Amount (Rs.)',
      ]);
      filteredCancellations.forEach((c) => {
        rows.push([
          c.bookingCode,
          c.guestName,
          c.guestPhone,
          c.roomNumber,
          c.roomType,
          c.checkIn,
          c.checkOut,
          c.cancelledAt,
          c.reason,
          c.originalAmount.toString(),
          c.depositPaid.toString(),
          c.refundStatus,
          c.refundAmount.toString(),
        ]);
      });
    } else {
      filename = `hotel_revenue_summary_${new Date().toISOString().split('T')[0]}.csv`;
      rows.push(['KPI Metric', 'Value', 'Notes']);
      rows.push(['Gross Hotel Revenue', `Rs. ${revenueMetrics.totalGrossRevenue.toLocaleString()}`, 'Lodging + Dining total']);
      rows.push(['Room Lodging Revenue', `Rs. ${revenueMetrics.roomRevenue.toLocaleString()}`, 'Room night charges']);
      rows.push(['Cafe & Dining Revenue', `Rs. ${revenueMetrics.cafeRevenue.toLocaleString()}`, 'F&B room service']);
      rows.push(['Average Daily Rate (ADR)', `Rs. ${revenueMetrics.averageDailyRate.toLocaleString()}`, 'Avg rate per room night']);
      rows.push(['RevPAR', `Rs. ${revenueMetrics.revPar.toLocaleString()}`, 'Revenue per available room']);
      rows.push(['Occupancy Rate', `${revenueMetrics.occupancyRate}%`, 'Active occupied rooms']);
      rows.push(['Completed Stays', revenueMetrics.completedStays.toString(), 'Checked-out stays']);
      rows.push(['Active In-House Stays', revenueMetrics.inHouseStays.toString(), 'In-house guests']);
      rows.push(['Total Cancellations', revenueMetrics.totalCancellations.toString(), `${revenueMetrics.cancellationRate}% cancellation rate`]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report Exported', `${filename} generated successfully.`);
  };

  if (!isLoaded) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto p-4 md:p-6">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-900 rounded-[4px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      {/* -----------------------------------------------------------------------
          TOP HEADER
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#24352F] dark:text-white font-heading">
              Stay History & Reports
            </h1>
          </div>
        </div>

        {/* Top Controls: Period filter, Export CSV, Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="h-8.5 text-xs font-semibold px-2.5 rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
          >
            <option value="ALL">All Records</option>
            <option value="OCT_2026">October 2026</option>
            <option value="SEP_2026">September 2026</option>
          </select>

          <button
            type="button"
            onClick={reloadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-bold text-[#0B3D32] hover:bg-[#F2F6F4] transition-all dark:border-[#145447] dark:bg-[#07241E] dark:text-emerald-300 cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          NAVIGATION TABS (Separate & Clean - Orders included inside Stay History)
          ----------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 p-1 bg-[#EEF4F1] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] rounded-[4px] overflow-x-auto">
        {[
          { id: 'stays' as const, label: 'Stay History', icon: CalendarCheck },
          { id: 'payments' as const, label: 'Payment History', icon: CreditCard },
          { id: 'cancellations' as const, label: 'Cancellations', icon: XCircle },
          { id: 'revenue' as const, label: 'Revenue Reports', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
                setSelectedRoom('ALL');
                setSelectedStatus('ALL');
                setSelectedMethod('ALL');
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-[3px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-white text-[#0B3D32] shadow-2xs dark:bg-[#0B3D32] dark:text-white'
                  : 'text-[#4A6458] hover:text-[#0B3D32] hover:bg-white/50 dark:text-[#A4B8AE] dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =======================================================================
          TAB 1: STAY HISTORY (Previous Guests, Room Fare, Orders, Paid & Settlement)
          ======================================================================= */}
      {activeTab === 'stays' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            {/* Search Box - Professional enclosed input with search icon & clear X */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-[#879B90] dark:text-[#647F75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest name, room, or booking code..."
                className="w-full h-8.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-9 pr-8 text-xs font-medium text-[#24352F] shadow-2xs transition-all placeholder:text-[#879B90] focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:placeholder:text-[#647F75] dark:focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Room filter */}
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Rooms</option>
                {AVAILABLE_ROOMS_CATALOG.map((r) => (
                  <option key={r.id} value={r.number}>
                    Room {r.number}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CHECKED_IN">In-House</option>
                <option value="CHECKED_OUT">Completed</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
          </div>

          {/* Stays Table (Clean, human-designed divided ledger format) */}
          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">GUEST</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">ROOM</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">DATES</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">ROOM FARE</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">ORDERS</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">TOTAL</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">PAID</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#DCE3DF] dark:border-[#145447]">STATUS</th>
                    <th className="py-2.5 px-3 text-right w-12"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] dark:divide-[#103D33]">
                  {filteredStays.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No stay records found matching current search/filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStays.map((stay) => {
                      const isCheckedIn = stay.status === 'CHECKED_IN';
                      const isReserved = stay.status === 'RESERVED';
                      const isCheckedOut = stay.status === 'CHECKED_OUT';

                      return (
                        <tr key={stay.bookingId} className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26] even:bg-[#FAFBF9]/80 dark:even:bg-[#061B16]/60 transition-colors">
                          {/* Column 1: Guest */}
                          <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-semibold text-[#1F2E28] dark:text-white flex items-center gap-1.5">
                              <span>{stay.guestName}</span>
                              {stay.vipTier === 'GOLD' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[#64736C] dark:text-[#A4B8AE]">
                              {stay.bookingCode}
                            </div>
                          </td>

                          {/* Column 2: Room */}
                          <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-semibold text-[#1F2E28] dark:text-white">
                              Room {stay.roomNumber}
                            </div>
                            <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                              {stay.roomType}
                            </div>
                          </td>

                          {/* Column 3: Dates */}
                          <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="text-xs text-[#1F2E28] dark:text-white font-medium">
                              {formatDisplayDates(stay.checkIn, stay.checkOut)}
                            </div>
                            <div className="text-[11px] text-[#879B90] dark:text-[#647F75]">
                              {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}
                            </div>
                          </td>

                          {/* Column 4: Room Fare */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-medium text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                            Rs. {stay.roomCharges.toLocaleString()}
                          </td>

                          {/* Column 5: Room Orders */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-medium border-r border-[#E8EFEA] dark:border-[#103D33]">
                            {stay.cafeTotal > 0 ? (
                              <span className="text-[#0B3D32] dark:text-emerald-400">
                                Rs. {stay.cafeTotal.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* Column 6: Total */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                            Rs. {stay.totalCharges.toLocaleString()}
                          </td>

                          {/* Column 7: Paid & Balance */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-mono text-xs font-medium text-[#1F2E28] dark:text-white">
                              Rs. {stay.totalPaid.toLocaleString()}
                            </div>
                            {stay.balanceDue === 0 ? (
                              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                Paid
                              </span>
                            ) : stay.totalPaid > 0 ? (
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                Due: Rs. {stay.balanceDue.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                Due: Rs. {stay.totalCharges.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Column 8: Status */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            {isCheckedIn && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300 dark:border-[#145447]">
                                In-House
                              </span>
                            )}
                            {isReserved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                Reserved
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                Completed
                              </span>
                            )}
                          </td>

                          {/* Column 9: Action */}
                          <td className="py-2 px-3 text-right">
                            <Link
                              href={`/reservations/${stay.bookingId}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] border border-[#CBD5D0] bg-[#EEF4F1] hover:bg-[#DDE9E3] text-[#0B3D32] hover:border-[#0B3D32] dark:border-[#145447] dark:bg-[#0B3D32]/40 dark:text-[#E5EEE9] dark:hover:text-white dark:hover:bg-[#0B3D32] transition-colors shadow-2xs group"
                              title="View stay details & folio"
                              aria-label="View Details"
                            >
                              <Eye className="w-4 h-4 transition-transform group-hover:scale-110 text-[#0B3D32] dark:text-[#E5EEE9]" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredStays.length > 0 && (
                  <tfoot className="bg-[#FAFBF9] dark:bg-[#061B16] border-t-2 border-[#DCE3DF] dark:border-[#145447] text-[#1F2E28] dark:text-white font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">
                        <span className="text-[#64736C] dark:text-[#A4B8AE] text-[11px] uppercase tracking-wider font-semibold">
                          Total ({filteredStays.length} {filteredStays.length === 1 ? 'Stay' : 'Stays'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.roomCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447] text-[#0B3D32] dark:text-emerald-400">
                        Rs. {stayTotals.cafeTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.totalCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447] text-emerald-700 dark:text-emerald-400">
                        Rs. {stayTotals.totalPaid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] text-[11px] font-normal">
                        —
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: PAYMENT HISTORY (CASHIERING AUDIT TRAIL)
          ======================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            {/* Search Box - Professional enclosed input with search icon & clear X */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-[#879B90] dark:text-[#647F75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt #, guest, room, or note..."
                className="w-full h-8.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-9 pr-8 text-xs font-medium text-[#24352F] shadow-2xs transition-all placeholder:text-[#879B90] focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:placeholder:text-[#647F75] dark:focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Payment Method Filter */}
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="UPI_QR">UPI / QR</option>
                <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>

              {/* Transaction Type Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="ADVANCE">Advance Deposit</option>
                <option value="SETTLEMENT">Final Settlement</option>
                <option value="PARTIAL">Partial Payment</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">RECEIPT</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">GUEST & ROOM</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">METHOD</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">TYPE</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">AMOUNT</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">NOTES</th>
                    <th className="py-2.5 px-3 text-right w-12"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] dark:divide-[#103D33]">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No payment transactions found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26] even:bg-[#FAFBF9]/80 dark:even:bg-[#061B16]/60 transition-colors">
                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span className="font-mono font-medium text-[#1F2E28] dark:text-white block">
                            {p.receiptNo}
                          </span>
                          <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">{p.date}</span>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <div className="font-semibold text-[#1F2E28] dark:text-white">
                            {p.guestName}
                          </div>
                          <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                            Room {p.roomNumber} • <span className="font-mono">{p.bookingCode}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-[#EEF4F1] border border-[#DCE3DF] dark:bg-[#0E362C] dark:border-[#145447] text-[11px] font-medium text-[#24352F] dark:text-slate-200">
                            {p.method === 'CASH' && 'Cash'}
                            {p.method === 'CARD' && 'Card'}
                            {p.method === 'UPI_QR' && 'UPI / QR'}
                            {p.method === 'ESEWA_KHALTI' && 'eSewa / Khalti'}
                            {p.method === 'BANK_TRANSFER' && 'Bank Transfer'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold',
                              p.type === 'SETTLEMENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            )}
                          >
                            {p.type === 'SETTLEMENT' ? 'Settlement' : p.type === 'ADVANCE' ? 'Advance' : 'Partial'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          Rs. {p.amount.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3 text-[#64736C] dark:text-[#A4B8AE] max-w-xs truncate border-r border-[#E8EFEA] dark:border-[#103D33]">
                          {p.notes || '—'}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <Link
                            href={`/reservations/${p.bookingId}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] border border-[#CBD5D0] bg-[#EEF4F1] hover:bg-[#DDE9E3] text-[#0B3D32] hover:border-[#0B3D32] dark:border-[#145447] dark:bg-[#0B3D32]/40 dark:text-[#E5EEE9] dark:hover:text-white dark:hover:bg-[#0B3D32] transition-all cursor-pointer shadow-2xs group"
                            title="View transaction & folio"
                            aria-label="View Details"
                          >
                            <Eye className="w-4 h-4 transition-transform group-hover:scale-110 text-[#0B3D32] dark:text-[#E5EEE9]" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
                  <tfoot className="bg-[#FAFBF9] dark:bg-[#061B16] border-t-2 border-[#DCE3DF] dark:border-[#145447] text-[#1F2E28] dark:text-white font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">
                        <span className="text-[#64736C] dark:text-[#A4B8AE] text-[11px] uppercase tracking-wider font-semibold">
                          Total Collected ({filteredPayments.length} {filteredPayments.length === 1 ? 'Transaction' : 'Transactions'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447] text-emerald-700 dark:text-emerald-400">
                        Rs. {paymentTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]"></td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: CANCELLATIONS LOG
          ======================================================================= */}
      {activeTab === 'cancellations' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            {/* Search Box - Professional enclosed input with search icon & clear X */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-[#879B90] dark:text-[#647F75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search booking code, guest name, room, or reason..."
                className="w-full h-8.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-9 pr-8 text-xs font-medium text-[#24352F] shadow-2xs transition-all placeholder:text-[#879B90] focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:placeholder:text-[#647F75] dark:focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Rooms</option>
                {AVAILABLE_ROOMS_CATALOG.map((r) => (
                  <option key={r.id} value={r.number}>
                    Room {r.number}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8.5 text-xs font-medium px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
              >
                <option value="ALL">All Refunds</option>
                <option value="FULL_REFUND">Full Refund</option>
                <option value="NO_DEPOSIT">No Deposit</option>
                <option value="NO_REFUND">Deposit Retained</option>
              </select>
            </div>
          </div>

          {/* Cancellations Table */}
          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">BOOKING REF</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">GUEST</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">ROOM</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">DATES</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">CANCELLED ON</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">REASON</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">ORIGINAL VALUE</th>
                    <th className="py-2.5 px-3">REFUND RESOLUTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] dark:divide-[#103D33]">
                  {filteredCancellations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No cancellations logged matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCancellations.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26] even:bg-[#FAFBF9]/80 dark:even:bg-[#061B16]/60 transition-colors">
                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span className="font-mono font-medium text-rose-700 dark:text-rose-400 block">
                            {c.bookingCode}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span className="font-semibold text-[#1F2E28] dark:text-white block">{c.guestName}</span>
                          <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">{c.guestPhone}</span>
                        </td>

                        <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <span className="font-semibold text-[#1F2E28] dark:text-white block">Room {c.roomNumber}</span>
                          <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">{c.roomType}</span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                          <div className="text-xs text-[#1F2E28] dark:text-white font-medium">
                            {formatDisplayDates(c.checkIn, c.checkOut)}
                          </div>
                          <div className="text-[11px] text-[#879B90] dark:text-[#647F75]">
                            {c.nights} {c.nights === 1 ? 'night' : 'nights'}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#64736C] dark:text-[#A4B8AE] border-r border-[#E8EFEA] dark:border-[#103D33]">
                          {c.cancelledAt}
                        </td>

                        <td className="py-2.5 px-3 text-[#24352F] dark:text-slate-200 text-xs max-w-xs border-r border-[#E8EFEA] dark:border-[#103D33]">
                          {c.reason}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-[#64736C] dark:text-[#A4B8AE] border-r border-[#E8EFEA] dark:border-[#103D33]">
                          Rs. {c.originalAmount.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3">
                          {c.refundStatus === 'FULL_REFUND' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              Full Refund (Rs. {c.refundAmount.toLocaleString()})
                            </span>
                          )}
                          {c.refundStatus === 'NO_DEPOSIT' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              No Deposit
                            </span>
                          )}
                          {c.refundStatus === 'NO_REFUND' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              Retained
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredCancellations.length > 0 && (
                  <tfoot className="bg-[#FAFBF9] dark:bg-[#061B16] border-t-2 border-[#DCE3DF] dark:border-[#145447] text-[#1F2E28] dark:text-white font-bold text-xs">
                    <tr>
                      <td colSpan={6} className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">
                        <span className="text-[#64736C] dark:text-[#A4B8AE] text-[11px] uppercase tracking-wider font-semibold">
                          Total ({filteredCancellations.length} {filteredCancellations.length === 1 ? 'Cancellation' : 'Cancellations'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#DCE3DF] dark:border-[#145447] text-rose-700 dark:text-rose-400">
                        Rs. {cancellationTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: REVENUE REPORTS & YIELD PERFORMANCE
          ======================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-5">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs">
              <span className="text-xs font-semibold text-[#64736C] dark:text-[#A4B8AE]">Total Gross Revenue</span>
              <p className="text-2xl font-bold font-mono text-[#0B3D32] dark:text-emerald-400 mt-1">
                Rs. {revenueMetrics.totalGrossRevenue.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1.5">
                +14.2% vs previous period
              </span>
            </div>

            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs">
              <span className="text-xs font-semibold text-[#64736C] dark:text-[#A4B8AE]">Room Lodging Revenue</span>
              <p className="text-2xl font-bold font-mono text-[#24352F] dark:text-white mt-1">
                Rs. {revenueMetrics.roomRevenue.toLocaleString()}
              </p>
              <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] block mt-1.5">
                {Math.round((revenueMetrics.roomRevenue / (revenueMetrics.totalGrossRevenue || 1)) * 100)}% of total gross
              </span>
            </div>

            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs">
              <span className="text-xs font-semibold text-[#64736C] dark:text-[#A4B8AE]">Café & Dining Revenue</span>
              <p className="text-2xl font-bold font-mono text-[#24352F] dark:text-white mt-1">
                Rs. {revenueMetrics.cafeRevenue.toLocaleString()}
              </p>
              <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] block mt-1.5">
                {Math.round((revenueMetrics.cafeRevenue / (revenueMetrics.totalGrossRevenue || 1)) * 100)}% of total gross
              </span>
            </div>

            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs">
              <span className="text-xs font-semibold text-[#64736C] dark:text-[#A4B8AE]">Average Daily Rate (ADR)</span>
              <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                Rs. {revenueMetrics.averageDailyRate.toLocaleString()}
              </p>
              <span className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] block mt-1.5">
                RevPAR: Rs. {revenueMetrics.revPar.toLocaleString()} • {revenueMetrics.occupancyRate}% Occupancy
              </span>
            </div>
          </div>

          {/* Revenue Breakdown by Category */}
          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Revenue Yield by Room Category
                </h3>
                <p className="text-xs text-[#64736C] dark:text-[#A4B8AE]">
                  Category performance, nights sold, and lodging yield.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-y border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">ROOM CATEGORY</th>
                    <th className="py-2.5 px-3">INVENTORY ROOMS</th>
                    <th className="py-2.5 px-3">NIGHTS LODGED</th>
                    <th className="py-2.5 px-3">AVG RATE / NIGHT</th>
                    <th className="py-2.5 px-3 text-right">CATEGORY REVENUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F2] dark:divide-[#103D33]">
                  {revenueMetrics.categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-[#FAFBF9] dark:hover:bg-[#0A2E26]/50">
                      <td className="py-3 px-3 font-bold text-[#24352F] dark:text-white">
                        {cat.category}
                      </td>
                      <td className="py-3 px-3 text-[#64736C] dark:text-[#A4B8AE]">
                        {cat.roomsCount} Suites
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-[#24352F] dark:text-white">
                        {cat.nightsSold} Nights
                      </td>
                      <td className="py-3 px-3 font-mono text-[#64736C] dark:text-[#A4B8AE]">
                        Rs. {cat.avgRate.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-right text-emerald-700 dark:text-emerald-400">
                        Rs. {cat.roomRevenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Collection Channels Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                Cashiering Channel Split
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Cash Collections</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    Rs. {revenueMetrics.paymentMethodBreakdown.cash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Bank Transfers</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    Rs. {revenueMetrics.paymentMethodBreakdown.bankTransfer.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Credit / Debit Card (POS)</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    Rs. {revenueMetrics.paymentMethodBreakdown.card.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">UPI / Fonepay QR</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    Rs. {revenueMetrics.paymentMethodBreakdown.upiQr.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">eSewa / Khalti Wallets</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    Rs. {revenueMetrics.paymentMethodBreakdown.esewaKhalti.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                Operational Audit Snapshot
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Total Checked-out Guests</span>
                  <span className="font-mono font-bold text-[#24352F] dark:text-white">
                    {revenueMetrics.completedStays} Stays
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Current In-House Stays</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {revenueMetrics.inHouseStays} Active
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Upcoming Reservations</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {revenueMetrics.reservedStays} Booked
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Cancelled Bookings Log</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {revenueMetrics.totalCancellations} Cancelled ({revenueMetrics.cancellationRate}%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#64736C] dark:text-[#A4B8AE]">Total Refunds Disbursed</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Rs. {revenueMetrics.totalRefunds.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Filter,
  Calendar,
  Utensils,
  Receipt,
  DoorOpen,
  User,
  Phone,
  Mail,
  MapPin,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  loadBookingsFromStorage,
  loadCancellationsFromStorage,
  getAllStayRecords,
  getAllPaymentTransactions,
  calculateHotelRevenueMetrics,
  getBookingFinancials,
  getRelativeDate,
  RoomBooking,
  CancellationRecord,
  ConsolidatedStayRecord,
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

type DateRangeOption = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export default function StayHistoryAndReportsPage() {
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active top tab: stays | payments | cancellations | revenue
  const [activeTab, setActiveTab] = useState<'stays' | 'payments' | 'cancellations' | 'revenue'>('stays');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');

  // Date Range Filters
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected Booking for In-Place "View Details" Modal
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<RoomBooking | null>(null);

  const todayStr = useMemo(() => getRelativeDate(0), []);

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

  // Filtered Stays with Date Range Filtering
  const filteredStays = useMemo(() => {
    return allStays.filter((stay) => {
      // Room filter
      if (selectedRoom !== 'ALL' && stay.roomNumber !== selectedRoom) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && stay.status !== selectedStatus) return false;

      // Date Range Filter
      if (dateRangeFilter === 'TODAY') {
        const touchesToday =
          stay.checkIn === todayStr ||
          stay.checkOut === todayStr ||
          (stay.checkIn <= todayStr && stay.checkOut >= todayStr);
        if (!touchesToday) return false;
      } else if (dateRangeFilter === 'THIS_WEEK') {
        const weekEndStr = getRelativeDate(7);
        const inThisWeek = stay.checkIn <= weekEndStr && stay.checkOut >= todayStr;
        if (!inThisWeek) return false;
      } else if (dateRangeFilter === 'THIS_MONTH') {
        const currentYearMonth = todayStr.substring(0, 7);
        const inThisMonth =
          stay.checkIn.startsWith(currentYearMonth) || stay.checkOut.startsWith(currentYearMonth);
        if (!inThisMonth) return false;
      } else if (dateRangeFilter === 'CUSTOM') {
        if (customStartDate && stay.checkOut < customStartDate) return false;
        if (customEndDate && stay.checkIn > customEndDate) return false;
      }

      // Text search
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
  }, [allStays, selectedRoom, selectedStatus, dateRangeFilter, customStartDate, customEndDate, searchQuery, todayStr]);

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
        acc.balanceDue += s.balanceDue;
        return acc;
      },
      { roomCharges: 0, cafeTotal: 0, totalCharges: 0, totalPaid: 0, balanceDue: 0 }
    );
  }, [filteredStays]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'stays') {
      const headers = ['Booking ID,Guest Name,Phone,Room,Check In,Check Out,Nights,Room Fare,Orders,Total,Paid,Balance Due,Status'];
      const rows = filteredStays.map((s) =>
        `"${s.bookingCode}","${s.guestName}","${s.guestPhone}","Room ${s.roomNumber}","${s.checkIn}","${s.checkOut}",${s.nights},${s.roomCharges},${s.cafeTotal},${s.totalCharges},${s.totalPaid},${s.balanceDue},"${s.status}"`
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `hotel-stay-history-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.celebrate('Report Exported', 'Stay history downloaded as CSV file.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 select-none">
      {/* -----------------------------------------------------------------------
          PAGE HEADER
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#24352F] dark:text-white font-heading">
              Stay History & Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical ledger of guest stays, room fares, orders, and settlements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reloadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-[#24352F] hover:bg-[#F2F6F4] transition-all dark:border-[#145447] dark:bg-[#07241E] dark:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          NAVIGATION TABS
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
          TAB 1: STAY HISTORY
          Table with: Guest, Room, Dates, Room Fare, Orders, Total, Paid, Status, View Details
          ======================================================================= */}
      {activeTab === 'stays' && (
        <div className="space-y-3.5">
          {/* Filter Bar: Search + Date Range Presets + Room & Status Selectors */}
          <div className="flex flex-col gap-2.5 bg-white dark:bg-[#071F1A] p-3 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#879B90] dark:text-[#647F75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest, phone, room, or code..."
                  className="w-full h-8.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-9 pr-8 text-xs font-medium text-[#24352F] shadow-2xs transition-all placeholder:text-[#879B90] focus:border-[#0B3D32] focus:bg-white focus:outline-none dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Room & Status Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="h-8.5 text-xs font-semibold px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
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
                  className="h-8.5 text-xs font-semibold px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] shadow-2xs dark:border-[#145447] dark:bg-[#061B16] dark:text-white cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CHECKED_IN">In-House</option>
                  <option value="CHECKED_OUT">Completed</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No-Show</option>
                </select>
              </div>
            </div>

            {/* Date Range Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                  <span>Date Range:</span>
                </span>

                {(
                  [
                    { id: 'ALL', label: 'All Time' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'THIS_WEEK', label: 'Next 7 Days' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                    { id: 'CUSTOM', label: 'Custom' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateRangeFilter(d.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                      dateRangeFilter === d.id
                        ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                        : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-600 dark:text-slate-300 hover:bg-[#F2F6F4]'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {dateRangeFilter === 'CUSTOM' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2 py-0.5 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2 py-0.5 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-auto">
                Showing <strong className="text-[#0B3D32] dark:text-emerald-400">{filteredStays.length}</strong> records
              </span>
            </div>
          </div>

          {/* Stays Ledger Table */}
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
                    <th className="py-2.5 px-3 text-center w-28">ACTION</th>
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
                      const isCancelled = stay.status === 'CANCELLED';
                      const isNoShow = stay.status === 'NO_SHOW';

                      return (
                        <tr
                          key={stay.bookingId}
                          className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26] even:bg-[#FAFBF9]/80 dark:even:bg-[#061B16]/60 transition-colors"
                        >
                          {/* 1. Guest */}
                          <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-semibold text-[#1F2E28] dark:text-white flex items-center gap-1.5">
                              <span>{stay.guestName}</span>
                              {stay.vipTier === 'GOLD' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[#64736C] dark:text-[#A4B8AE]">
                              {stay.bookingCode} · {stay.guestPhone}
                            </div>
                          </td>

                          {/* 2. Room */}
                          <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-semibold text-[#1F2E28] dark:text-white">
                              Room {stay.roomNumber}
                            </div>
                            <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                              {stay.roomType}
                            </div>
                          </td>

                          {/* 3. Dates */}
                          <td className="py-2.5 px-3 whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="text-xs text-[#1F2E28] dark:text-white font-medium">
                              {formatDisplayDates(stay.checkIn, stay.checkOut)}
                            </div>
                            <div className="text-[11px] text-[#879B90] dark:text-[#647F75]">
                              {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}
                            </div>
                          </td>

                          {/* 4. Room Fare */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-medium text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                            Rs. {stay.roomCharges.toLocaleString()}
                          </td>

                          {/* 5. Orders */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-medium border-r border-[#E8EFEA] dark:border-[#103D33]">
                            {stay.cafeTotal > 0 ? (
                              <span className="text-[#0B3D32] dark:text-emerald-400 font-bold">
                                Rs. {stay.cafeTotal.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* 6. Total */}
                          <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                            Rs. {stay.totalCharges.toLocaleString()}
                          </td>

                          {/* 7. Paid & Balance */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            <div className="font-mono text-xs font-medium text-[#1F2E28] dark:text-white">
                              Rs. {stay.totalPaid.toLocaleString()}
                            </div>
                            {stay.balanceDue === 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                Paid
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                Due: Rs. {stay.balanceDue.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* 8. Status */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E8EFEA] dark:border-[#103D33]">
                            {isCheckedIn && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300">
                                In-House
                              </span>
                            )}
                            {isReserved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                                Reserved
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                                Completed
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                                Cancelled
                              </span>
                            )}
                            {isNoShow && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                                No-Show
                              </span>
                            )}
                          </td>

                          {/* 9. View Details Action (In-Place Modal) */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const fullBooking = bookings.find((b) => b.id === stay.bookingId);
                                setSelectedBookingForDetails(fullBooking || null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#EEF4F1] hover:bg-[#0B3D32] hover:text-white text-[#0B3D32] text-xs font-bold transition-all shadow-2xs dark:bg-[#0B3D32]/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Ledger Summary Footer */}
                {filteredStays.length > 0 && (
                  <tfoot className="bg-[#FAFBF9] dark:bg-[#061B16] font-bold text-xs border-t-2 border-[#DCE3DF] dark:border-[#145447]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-[#24352F] dark:text-white border-r border-[#DCE3DF] dark:border-[#145447]">
                        TOTAL ({filteredStays.length} Stays)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#24352F] dark:text-white border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.roomCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#0B3D32] dark:text-emerald-400 border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.cafeTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#24352F] dark:text-white border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.totalCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 border-r border-[#DCE3DF] dark:border-[#145447]">
                        Rs. {stayTotals.totalPaid.toLocaleString()}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {stayTotals.balanceDue > 0 ? `Rs. ${stayTotals.balanceDue.toLocaleString()} Due` : 'Fully Settled'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: PAYMENT HISTORY
          ======================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt, guest, room, notes..."
                className="w-full h-8.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-9 pr-3 text-xs font-medium dark:border-[#145447] dark:bg-[#061B16] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="h-8.5 text-xs font-semibold px-2.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] text-[#24352F] dark:border-[#145447] dark:bg-[#061B16] dark:text-white"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="UPI_QR">UPI / Fonepay QR</option>
                <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">RECEIPT NO</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">GUEST NAME</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">ROOM</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">DATE</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">METHOD</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">PAYMENT TYPE</th>
                    <th className="py-2.5 px-3 text-right">AMOUNT (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] dark:divide-[#103D33]">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {p.receiptNo}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {p.guestName}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        Room {p.roomNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {p.date}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        <span className="font-semibold text-[#24352F] dark:text-slate-200">
                          {p.method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        Rs. {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: CANCELLATIONS
          ======================================================================= */}
      {activeTab === 'cancellations' && (
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">BOOKING ID</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">GUEST NAME</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">ROOM</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">ORIGINAL DATES</th>
                    <th className="py-2.5 px-3 border-r border-[#DCE3DF] dark:border-[#145447]">REASON</th>
                    <th className="py-2.5 px-3 text-right border-r border-[#DCE3DF] dark:border-[#145447]">REFUND</th>
                    <th className="py-2.5 px-3 text-center">REFUND STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEA] dark:divide-[#103D33]">
                  {filteredCancellations.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F2F7F4] dark:hover:bg-[#0A2E26]">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700 dark:text-rose-400 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {c.bookingCode}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {c.guestName}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        Room {c.roomNumber}
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {c.checkIn} – {c.checkOut}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-[#E8EFEA] dark:border-[#103D33]">
                        {c.reason}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1F2E28] dark:text-white border-r border-[#E8EFEA] dark:border-[#103D33]">
                        Rs. {c.refundAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {c.refundStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: REVENUE REPORTS & KPI DASHBOARD
          ======================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Gross Invoiced
              </span>
              <span className="text-xl font-bold font-mono text-[#0B3D32] dark:text-emerald-400 mt-1 block">
                Rs. {revenueMetrics.totalGrossRevenue.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Collections
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                Rs. {revenueMetrics.totalCollected.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Balance Due
              </span>
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                Rs. {revenueMetrics.totalBalanceDue.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Occupancy Rate
              </span>
              <span className="text-xl font-bold font-mono text-[#24352F] dark:text-white mt-1 block">
                {revenueMetrics.occupancyRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          IN-PLACE "VIEW DETAILS" MODAL
          Shows Complete Stay, Food Orders, and Payment History without leaving page
          ======================================================================= */}
      {selectedBookingForDetails && (() => {
        const b = selectedBookingForDetails;
        const fin = getBookingFinancials(b);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150"
            onClick={() => setSelectedBookingForDetails(null)}
          >
            <div
              className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="p-4 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                        Stay Folio: {b.guest.firstName} {b.guest.lastName}
                      </h3>
                      <span className="font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400">
                        {b.bookingCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Room {b.room.number} ({b.room.type}) · {b.checkIn} to {b.checkOut} ({b.nights} {b.nights === 1 ? 'night' : 'nights'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/reservations/${b.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300"
                  >
                    <span>Full Folio</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDetails(null)}
                    className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* Financial Summary Cards Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#E5EEE9] dark:border-[#145447]">
                    <span className="text-[10px] text-slate-400 block font-semibold">ROOM FARE</span>
                    <span className="font-mono font-bold text-sm text-[#24352F] dark:text-white">
                      Rs. {fin.roomCharges.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#E5EEE9] dark:border-[#145447]">
                    <span className="text-[10px] text-slate-400 block font-semibold">FOOD & ORDERS</span>
                    <span className="font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                      Rs. {fin.cafeTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#E5EEE9] dark:border-[#145447]">
                    <span className="text-[10px] text-slate-400 block font-semibold">TOTAL CHARGES</span>
                    <span className="font-mono font-bold text-sm text-[#24352F] dark:text-white">
                      Rs. {fin.totalCharges.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#E5EEE9] dark:border-[#145447]">
                    <span className="text-[10px] text-slate-400 block font-semibold">BALANCE DUE</span>
                    {fin.balanceDue > 0 ? (
                      <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                        Rs. {fin.balanceDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        Settled (Paid)
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 1: Guest & Room Details */}
                <div className="p-3 rounded-[3px] border border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-2">
                  <h4 className="text-[11px] font-bold text-[#0B3D32] dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Guest & Stay Information</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Full Name:</span>
                      <strong className="text-[#24352F] dark:text-white">{b.guest.firstName} {b.guest.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Phone:</span>
                      <span className="font-mono text-[#24352F] dark:text-white">{b.guest.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email:</span>
                      <span className="text-[#24352F] dark:text-white truncate block">{b.guest.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Room Rate:</span>
                      <span className="font-mono font-semibold">Rs. {b.room.pricePerNight.toLocaleString()}/night</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">AC / Bed:</span>
                      <span>{b.room.acType} · {b.room.bedType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Status:</span>
                      <span className="font-bold text-[#0B3D32] dark:text-emerald-300">{b.status}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Complete Food & Cafe Orders History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-[#0B3D32] dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Room Service & Food Orders ({(b.cafeOrders || []).length})</span>
                  </h4>

                  {(!b.cafeOrders || b.cafeOrders.length === 0) ? (
                    <div className="p-3 text-center text-slate-400 border border-dashed border-[#E5EEE9] dark:border-[#145447] rounded-[3px]">
                      No food or room service orders placed during this stay.
                    </div>
                  ) : (
                    <div className="rounded-[3px] border border-[#E5EEE9] dark:border-[#145447] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#E5EEE9] dark:border-[#145447] text-[10px] font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="py-1.5 px-2.5">ORDER NO</th>
                            <th className="py-1.5 px-2.5">TIME</th>
                            <th className="py-1.5 px-2.5">ITEMS ORDERED</th>
                            <th className="py-1.5 px-2.5 text-right">TOTAL</th>
                            <th className="py-1.5 px-2.5 text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                          {b.cafeOrders.map((ord) => (
                            <tr key={ord.id}>
                              <td className="py-2 px-2.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                {ord.orderNumber}
                              </td>
                              <td className="py-2 px-2.5 text-slate-500 text-[11px]">
                                {ord.timestamp}
                              </td>
                              <td className="py-2 px-2.5">
                                {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-semibold">
                                Rs. {ord.subtotal.toLocaleString()}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Complete Payment & Transaction History */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-[#0B3D32] dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Payment & Settlement History ({(b.payments || []).length})</span>
                  </h4>

                  {(!b.payments || b.payments.length === 0) ? (
                    <div className="p-3 text-center text-slate-400 border border-dashed border-[#E5EEE9] dark:border-[#145447] rounded-[3px]">
                      No payments recorded yet for this booking.
                    </div>
                  ) : (
                    <div className="rounded-[3px] border border-[#E5EEE9] dark:border-[#145447] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#E5EEE9] dark:border-[#145447] text-[10px] font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="py-1.5 px-2.5">RECEIPT</th>
                            <th className="py-1.5 px-2.5">DATE</th>
                            <th className="py-1.5 px-2.5">METHOD</th>
                            <th className="py-1.5 px-2.5">TYPE</th>
                            <th className="py-1.5 px-2.5 text-right">AMOUNT PAID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                          {b.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2 px-2.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                                {p.receiptNo}
                              </td>
                              <td className="py-2 px-2.5 text-slate-500 text-[11px]">{p.date}</td>
                              <td className="py-2 px-2.5 font-medium">{p.method.replace('_', ' ')}</td>
                              <td className="py-2 px-2.5">
                                <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {p.type}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                Rs. {p.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    toast.info('Printing Stay Receipt', 'Sent to printer dialog.');
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-[#24352F] hover:bg-[#F2F6F4] dark:border-[#145447] dark:bg-[#07241E] dark:text-slate-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDetails(null)}
                    className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

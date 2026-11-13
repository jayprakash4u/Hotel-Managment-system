'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  LogOut,
  Search,
  Calendar,
  BedDouble,
  Receipt,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  getRelativeDate,
  performCheckOut,
} from '../reservations/reservationsData';

type TabFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'IN_HOUSE' | 'DUE' | 'CHECKED_OUT';

function CheckOutListContent() {
  const toast = useToast();

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filter states
  const [activeTab, setActiveTab] = useState<TabFilter>('TODAY');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Checkout modal states
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<RoomBooking | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER'>('CASH');
  const [settlementAmount, setSettlementAmount] = useState<number>(0);

  // Reload bookings from storage
  const reloadData = () => {
    setBookings(loadBookingsFromStorage());
    toast.info('Refreshed', 'Departures list updated.');
  };

  // Sync to storage
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFrom, dateTo, searchQuery]);

  // Tab definitions (Box-type, no numbers or zero badges)
  const tabs = useMemo(() => {
    return [
      { id: 'ALL' as const, label: 'All Departures' },
      { id: 'TODAY' as const, label: 'Departing Today' },
      { id: 'TOMORROW' as const, label: 'Tomorrow' },
      { id: 'WEEK' as const, label: 'This Week' },
      { id: 'IN_HOUSE' as const, label: 'In-House' },
      { id: 'DUE' as const, label: 'Balance Due' },
      { id: 'CHECKED_OUT' as const, label: 'Checked Out' },
    ];
  }, []);

  // Filtered Departures List
  const checkOutList = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Tab Status & Date Filter
      if (activeTab === 'TODAY' && b.checkOut !== todayStr) return false;
      if (activeTab === 'TOMORROW' && b.checkOut !== tomorrowStr) return false;
      if (activeTab === 'WEEK') {
        const weekEnd = getRelativeDate(7);
        if (b.checkOut < todayStr || b.checkOut > weekEnd) return false;
      }
      if (activeTab === 'IN_HOUSE' && b.status !== 'CHECKED_IN') return false;
      if (activeTab === 'CHECKED_OUT' && b.status !== 'CHECKED_OUT') return false;
      if (activeTab === 'DUE') {
        const fin = getBookingFinancials(b);
        if (fin.balanceDue <= 0 || b.status !== 'CHECKED_IN') return false;
      }

      // General departure filter: keep bookings that are checked in or checked out
      if (activeTab !== 'CHECKED_OUT' && activeTab !== 'IN_HOUSE' && b.status !== 'CHECKED_IN' && b.status !== 'CHECKED_OUT') {
        return false;
      }

      // 2. Custom Date Range
      if (dateFrom && b.checkOut < dateFrom) return false;
      if (dateTo && b.checkOut > dateTo) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesName = fullName.includes(q);
        const matchesRoom = b.room.number.toLowerCase().includes(q);
        const matchesPhone = b.guest.phone.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesRoom && !matchesPhone) return false;
      }

      return true;
    });
  }, [bookings, activeTab, dateFrom, dateTo, searchQuery, todayStr, tomorrowStr]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(checkOutList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return checkOutList.slice(start, start + pageSize);
  }, [checkOutList, safeCurrentPage, pageSize]);

  // Open Checkout Modal
  const handleOpenCheckOut = (b: RoomBooking) => {
    const fin = getBookingFinancials(b);
    setSelectedBookingForCheckOut(b);
    setSettlementAmount(fin.balanceDue);
    setSettlementMethod('CASH');
  };

  // Submit Checkout & Settle
  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCheckOut) return;

    const { updatedBookings } = performCheckOut(bookings, selectedBookingForCheckOut.id, {
      settlementAmount: Number(settlementAmount) || 0,
      paymentMethod: settlementMethod,
      housekeepingNotes: `Checkout completed for ${selectedBookingForCheckOut.guest.firstName} ${selectedBookingForCheckOut.guest.lastName}. Room sent for cleaning.`,
    });

    setBookings(updatedBookings);
    saveBookingsToStorage(updatedBookings);

    // Notify backend DB room status if room exists in database
    try {
      if (selectedBookingForCheckOut.room.id) {
        await fetch(`/api/rooms/${selectedBookingForCheckOut.room.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cleaningStatus: 'DIRTY' }),
        });
      }
    } catch {
      // Non-blocking sync
    }

    const roomNumber = selectedBookingForCheckOut.room.number;
    setSelectedBookingForCheckOut(null);

    toast.celebrate(
      'Check-Out Completed',
      `Room ${roomNumber} folio settled and released for housekeeping.`
    );
  };

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Action Buttons
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default dark:border-border-default">
        <div className="flex items-center gap-3">
          <BackButton href="/front-desk" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Check-Out &amp; Departures
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/front-desk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Room Board</span>
          </Link>

          <button
            type="button"
            onClick={reloadData}
            title="Refresh list"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          TOOLBAR: Box-Type Filter Buttons, Date Selector & Search Box
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Box-type Status Buttons (No Numbers) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap',
                  isActive
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
                    : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Date Selector & Search Bar */}
        <div className="flex items-center gap-2 flex-wrap self-start xl:self-auto w-full xl:w-auto">
          {/* Date Selector Inputs [From] to [To] */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] px-2.5 h-[30px] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
              title="Departure date from"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
              title="Departure date to"
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                title="Clear date filter"
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, room, ID..."
              className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>



      {/* -----------------------------------------------------------------------
          MAIN CHECK-OUT DATATABLE
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                <th className="py-2.5 px-3.5 w-28 border-r border-slate-200 dark:border-slate-700">RES ID</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">GUEST NAME</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ROOM</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">STAY DATES</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700">ROOM FARE</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700">ORDERS</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700">TOTAL BILL</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700">PAID</th>
                <th className="py-2.5 px-3.5 text-right border-r border-slate-200 dark:border-slate-700">BALANCE DUE</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">STATUS</th>
                <th className="py-2.5 px-3 text-center w-36">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No departures found matching the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedList.map((booking, idx) => {
                  const fin = getBookingFinancials(booking);
                  const isCheckedOut = booking.status === 'CHECKED_OUT';

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* 2. Res ID */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-mono font-bold text-[#0B3D32] hover:underline dark:text-emerald-400"
                        >
                          {booking.bookingCode}
                        </Link>
                      </td>

                      {/* 3. Guest Name */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{booking.guest.phone}</div>
                      </td>

                      {/* 4. Room */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                          <span>Room {booking.room.number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{booking.room.type}</div>
                      </td>

                      {/* 5. Stay Dates */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                          {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                          {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                        </div>
                      </td>

                      {/* 6. Room Fare */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        Rs. {fin.roomCharges.toLocaleString()}
                      </td>

                      {/* 7. Orders */}
                      <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-800">
                        {fin.cafeTotal > 0 ? (
                          <span className="font-semibold text-[#0B3D32] dark:text-emerald-400">
                            Rs. {fin.cafeTotal.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 8. Total Bill */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                        Rs. {fin.totalCharges.toLocaleString()}
                      </td>

                      {/* 9. Paid */}
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold border-r border-slate-200 dark:border-slate-800">
                        Rs. {fin.totalPaid.toLocaleString()}
                      </td>

                      {/* 10. Balance Due */}
                      <td className="py-2.5 px-3.5 text-right font-mono border-r border-slate-200 dark:border-slate-800">
                        {fin.balanceDue > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            Rs. {fin.balanceDue.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Settled
                          </span>
                        )}
                      </td>

                      {/* 11. Status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                        {isCheckedOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            Checked Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            In-House
                          </span>
                        )}
                      </td>

                      {/* 12. Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/reservations/${booking.id}`}
                            className="p-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-600 hover:text-[#0B3D32] hover:bg-slate-50 dark:text-slate-300 cursor-pointer shadow-2xs"
                            title="View Guest Folio"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {!isCheckedOut ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCheckOut(booking)}
                              className="px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
                            >
                              Check Out
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Completed
                            </span>
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
      </div>

      {/* -----------------------------------------------------------------------
          DATATABLES PAGINATION FOOTER
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
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
              {checkOutList.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * pageSize, checkOutList.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {checkOutList.length}
            </strong>{' '}
            entries
          </div>
        </div>

        {/* DataTables Style Pagination Group (Exact match to screenshot) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {/* Previous */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
              ) {
                const isCurrent = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border border-[#0B3D32]'
                        : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                return (
                  <span
                    key={pageNum}
                    className="px-2 text-slate-400 select-none font-bold"
                  >
                    …
                  </span>
                );
              }
              return null;
            })}

            {/* Next */}
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

      {/* -----------------------------------------------------------------------
          CHECK-OUT & SETTLEMENT MODAL (BILLING STYLE LAYOUT)
          ----------------------------------------------------------------------- */}
      {selectedBookingForCheckOut && (() => {
        const b = selectedBookingForCheckOut;
        const fin = getBookingFinancials(b);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
            onClick={() => setSelectedBookingForCheckOut(null)}
          >
            <div
              className="w-full max-w-lg rounded-[4px] bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-heading">
                    Check-Out Settlement · Room {b.room.number}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {b.guest.firstName} {b.guest.lastName} · {b.bookingCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCheckOut(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmCheckOut} className="p-4 space-y-3.5 text-xs">
                {/* Billing Summary Box */}
                <div className="border border-slate-200 dark:border-border-default rounded-[3px] bg-slate-50/60 dark:bg-slate-900/40 p-3 space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between items-center text-xs">
                    <span>Room Charges ({b.nights} {b.nights === 1 ? 'night' : 'nights'})</span>
                    <span className="font-mono font-semibold">Rs. {fin.roomCharges.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span>Restaurant & Room Orders</span>
                    <span className="font-mono font-semibold">Rs. {fin.cafeTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Bill</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">Rs. {fin.totalCharges.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Advance Deposit Paid</span>
                    <span className="font-mono">Rs. {fin.totalPaid.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-slate-300 dark:border-slate-700">
                    <span className="text-slate-900 dark:text-white">Net Balance Due</span>
                    <span className={cn('font-mono text-base', fin.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                      Rs. {fin.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Settlement Controls (if balance due > 0) */}
                {fin.balanceDue > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Payment Method
                      </label>
                      <select
                        value={settlementMethod}
                        onChange={(e) => setSettlementMethod(e.target.value as any)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Credit/Debit Card</option>
                        <option value="UPI_QR">Fonepay / QR Code</option>
                        <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Settlement Amount (Rs.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={fin.balanceDue}
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Folio fully settled. Ready to complete check-out.</span>
                  </div>
                )}

                {/* Auto Housekeeping Status Tag */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[3px] bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Housekeeping Post-Checkout:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Dirty (Sanitization Queue)</span>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForCheckOut(null)}
                    className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
                  >
                    Complete Check-Out
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function CheckOutListPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 p-12 text-center text-xs text-slate-400">
          Loading Check-Out List...
        </div>
      }
    >
      <CheckOutListContent />
    </Suspense>
  );
}

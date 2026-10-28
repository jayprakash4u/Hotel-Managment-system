'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
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
  CreditCard,
  Building2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  getRelativeDate,
} from '../reservations/reservationsData';

function CheckOutListContent() {
  const toast = useToast();

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'WEEK' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState(todayStr);
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DUE' | 'SETTLED'>('ALL');

  // Modals
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<RoomBooking | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');

  // Reload bookings from storage
  const reloadData = () => {
    setBookings(loadBookingsFromStorage());
    toast.info('List Refreshed', 'Latest bookings loaded.');
  };

  // Sync to storage
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Filtered Departures List
  const checkOutList = useMemo(() => {
    return bookings.filter((b) => {
      // Must be currently checked in or checked out recently
      if (b.status !== 'CHECKED_IN' && b.status !== 'CHECKED_OUT') return false;

      // Date Filter
      if (dateFilter === 'TODAY') {
        if (b.checkOut !== todayStr) return false;
      } else if (dateFilter === 'TOMORROW') {
        if (b.checkOut !== tomorrowStr) return false;
      } else if (dateFilter === 'WEEK') {
        const weekEnd = getRelativeDate(7);
        if (b.checkOut < todayStr || b.checkOut > weekEnd) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customDate && b.checkOut !== customDate) return false;
      }

      // Balance Filter
      const fin = getBookingFinancials(b);
      if (balanceFilter === 'DUE' && fin.balanceDue <= 0) return false;
      if (balanceFilter === 'SETTLED' && fin.balanceDue > 0) return false;

      // Search Query
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
  }, [bookings, dateFilter, customDate, balanceFilter, searchQuery, todayStr, tomorrowStr]);

  // Open Checkout Modal
  const handleOpenCheckOut = (b: RoomBooking) => {
    setSelectedBookingForCheckOut(b);
    setSettlementMethod('CASH');
  };

  // Submit Checkout & Settle
  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCheckOut) return;

    const fin = getBookingFinancials(selectedBookingForCheckOut);

    const updated = bookings.map((b) => {
      if (b.id !== selectedBookingForCheckOut.id) return b;

      const payments = [...(b.payments || [])];
      if (fin.balanceDue > 0) {
        payments.push({
          id: `pay-${Date.now()}`,
          receiptNo: `REC-${b.bookingCode}-FIN`,
          date: 'Checkout Settlement',
          amount: fin.balanceDue,
          method: settlementMethod,
          type: 'SETTLEMENT',
          notes: 'Final settlement at checkout desk',
        });
      }

      return {
        ...b,
        status: 'CHECKED_OUT' as const,
        payments,
      };
    });

    setBookings(updated);
    saveBookingsToStorage(updated);
    setSelectedBookingForCheckOut(null);

    toast.celebrate(
      'Checkout Completed!',
      `Room ${selectedBookingForCheckOut.room.number} bill settled and released for housekeeping.`
    );
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Hotel Management Option Boxes */}
      <HotelManagementNavBoxes activeId="check-out" />

      {/* -----------------------------------------------------------------------
          HEADER & TOOLBAR: Departure Date & Balance Filter
          ----------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-surface-card p-3 rounded-[3px] border border-border-default dark:border-border-default shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold font-heading text-body dark:text-white flex items-center gap-2">
              <LogOut className="w-5 h-5 text-muted dark:text-slate-300" />
              <span>Departures & Check-Out List</span>
            </h1>
            <p className="text-xs text-muted dark:text-muted">
              Review guest charges, settle restaurant/room service balances, and complete checkout
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reloadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-border-default bg-white text-xs font-semibold text-body hover:bg-[#F2F6F4] dark:border-border-default dark:bg-surface-card dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] dark:border-border-default text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-muted dark:text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-muted" />
              <span>Departure Date:</span>
            </span>

            {(
              [
                { id: 'TODAY', label: "Departing Today" },
                { id: 'TOMORROW', label: 'Tomorrow' },
                { id: 'WEEK', label: 'Next 7 Days' },
                { id: 'ALL', label: 'All Departures' },
                { id: 'CUSTOM', label: 'Custom Date' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  dateFilter === df.id
                    ? 'bg-slate-800 text-white shadow-2xs dark:bg-slate-700'
                    : 'bg-surface-muted dark:bg-surface-muted border border-border-default dark:border-border-default text-slate-600 dark:text-slate-300 hover:bg-[#F2F6F4]'
                )}
              >
                {df.label}
              </button>
            ))}

            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-0.5 rounded-[2px] border border-border-default dark:border-border-default text-xs font-mono"
              />
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, Res ID, room..."
              className="w-full h-8 rounded-[3px] border border-border-default bg-surface-muted py-1 pl-8 pr-7 text-xs font-medium dark:border-border-default dark:bg-surface-muted dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          CHECK-OUT LIST TABLE
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-border-default bg-white dark:border-border-default dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-muted dark:bg-surface-muted border-b border-border-default dark:border-border-default text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-border-default">#</th>
                <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-border-default">RES ID</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-border-default">GUEST NAME</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-border-default">ROOM</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-border-default">STAY DATES</th>
                <th className="py-2.5 px-3 text-right border-r border-[#E5EEE9] dark:border-border-default">ROOM FARE</th>
                <th className="py-2.5 px-3 text-right border-r border-[#E5EEE9] dark:border-border-default">ORDERS</th>
                <th className="py-2.5 px-3 text-right border-r border-[#E5EEE9] dark:border-border-default">TOTAL</th>
                <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-border-default">BALANCE DUE</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-border-default">STATUS</th>
                <th className="py-2.5 px-3 text-center w-36">SETTLE & CHECKOUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
              {checkOutList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted">
                    No departing guests found for the selected departure date filter.
                  </td>
                </tr>
              ) : (
                checkOutList.map((booking, idx) => {
                  const fin = getBookingFinancials(booking);
                  const isCheckedOut = booking.status === 'CHECKED_OUT';

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                    >
                      {/* 1. Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted border-r border-[#E5EEE9] dark:border-border-default">
                        {idx + 1}
                      </td>

                      {/* 2. Res ID */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-border-default">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-mono font-bold text-brand hover:underline dark:text-success"
                        >
                          {booking.bookingCode}
                        </Link>
                      </td>

                      {/* 3. Guest Name */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-border-default">
                        <div className="font-bold text-body dark:text-white">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </div>
                        <div className="text-[11px] text-muted font-mono">{booking.guest.phone}</div>
                      </td>

                      {/* 4. Room */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-border-default">
                        <div className="font-semibold text-body dark:text-white flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-slate-600 dark:text-muted" />
                          <span>Room {booking.room.number}</span>
                        </div>
                        <div className="text-[10px] text-muted">{booking.room.type}</div>
                      </td>

                      {/* 5. Stay Dates */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-border-default">
                        <div className="text-xs text-body dark:text-slate-200 font-medium">
                          {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                          {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-[10px] text-muted">
                          {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                        </div>
                      </td>

                      {/* 6. Room Fare */}
                      <td className="py-2.5 px-3 text-right font-mono text-muted dark:text-slate-300 border-r border-[#E5EEE9] dark:border-border-default">
                        Rs. {fin.roomCharges.toLocaleString()}
                      </td>

                      {/* 7. Orders */}
                      <td className="py-2.5 px-3 text-right font-mono border-r border-[#E5EEE9] dark:border-border-default">
                        {fin.cafeTotal > 0 ? (
                          <span className="font-bold text-brand dark:text-success">
                            Rs. {fin.cafeTotal.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* 8. Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-body dark:text-white border-r border-[#E5EEE9] dark:border-border-default">
                        Rs. {fin.totalCharges.toLocaleString()}
                      </td>

                      {/* 9. Balance Due */}
                      <td className="py-2.5 px-3.5 text-right font-mono border-r border-[#E5EEE9] dark:border-border-default">
                        {fin.balanceDue > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            Rs. {fin.balanceDue.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="font-bold text-success dark:text-success">
                            Settled
                          </span>
                        )}
                      </td>

                      {/* 10. Status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-border-default">
                        {isCheckedOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-muted" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-brand">
                            In-House
                          </span>
                        )}
                      </td>

                      {/* 11. Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/reservations/${booking.id}`}
                            className="p-1.5 rounded-[2px] border border-border-default bg-white text-slate-600 hover:text-brand hover:bg-[#F2F6F4] dark:border-border-default dark:bg-surface-card dark:text-slate-300 cursor-pointer"
                            title="View Full Folio"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {!isCheckedOut ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCheckOut(booking)}
                              className="px-2.5 py-1 rounded-[3px] bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors dark:bg-brand dark:hover:bg-brand-hover cursor-pointer shadow-2xs"
                            >
                              Check Out
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-muted">
                              Checked Out
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
          CHECK-OUT & SETTLEMENT MODAL
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
              className="w-full max-w-md rounded-[4px] bg-white dark:bg-surface-card border border-border-default dark:border-border-default shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#E5EEE9] dark:border-border-default bg-surface-muted dark:bg-surface-muted flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-body dark:text-white uppercase font-heading">
                    Check-Out & Settle: Room {b.room.number}
                  </h3>
                  <p className="text-[11px] text-muted font-mono">
                    {b.guest.firstName} {b.guest.lastName} · {b.bookingCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCheckOut(null)}
                  className="text-muted hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmCheckOut} className="p-4 space-y-3.5 text-xs">
                {/* Folio Charges Strip */}
                <div className="p-3 bg-slate-50 dark:bg-surface-muted border border-slate-200 dark:border-border-default rounded space-y-2">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Room Charges ({b.nights} nights):</span>
                    <span className="font-mono font-semibold">Rs. {fin.roomCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Restaurant & Room Orders:</span>
                    <span className="font-mono font-semibold">Rs. {fin.cafeTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Total Invoiced:</span>
                    <span className="font-mono font-bold">Rs. {fin.totalCharges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 dark:text-success pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Advance Deposit Paid:</span>
                    <span className="font-mono font-bold">Rs. {fin.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-1 border-t-2 border-slate-300 dark:border-slate-700">
                    <span className="text-body dark:text-white">Balance to Settle:</span>
                    <span className={cn('font-mono', fin.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-success')}>
                      Rs. {fin.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {fin.balanceDue > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                      Settlement Payment Method *
                    </label>
                    <select
                      value={settlementMethod}
                      onChange={(e) => setSettlementMethod(e.target.value as any)}
                      className="w-full rounded-[3px] border border-border-default bg-white px-3 py-2 text-xs font-bold text-body dark:border-border-default dark:bg-surface-card dark:text-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Credit/Debit Card</option>
                      <option value="UPI_QR">Fonepay / QR Code</option>
                      <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                    </select>
                  </div>
                )}

                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                  Room {b.room.number} will automatically be marked as <strong>DIRTY</strong> and sent to the housekeeping queue.
                </div>

                <div className="pt-3 border-t border-[#E5EEE9] dark:border-border-default flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForCheckOut(null)}
                    className="px-3.5 py-1.5 rounded-[3px] border border-border-default text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[3px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-2xs dark:bg-brand dark:hover:bg-brand-hover cursor-pointer"
                  >
                    Confirm Settle & Check-Out
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
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Check-Out List...
        </div>
      }
    >
      <CheckOutListContent />
    </Suspense>
  );
}

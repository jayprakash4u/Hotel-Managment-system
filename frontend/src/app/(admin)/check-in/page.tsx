'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserCheck,
  Building2,
  Calendar,
  BedDouble,
  CreditCard,
  Printer,
  X,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Receipt,
  FileText,
  User,
  Phone,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { FrontDeskNavBoxes } from '@/components/common/FrontDeskNavBoxes';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getBookingFinancials,
  getRelativeDate,
} from '../reservations/reservationsData';

function CheckInListContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramBookingId = searchParams.get('bookingId');
  const paramRoomId = searchParams.get('roomId');
  const paramMode = searchParams.get('mode');

  // If someone navigated to /check-in with booking params, immediately redirect them to /booking
  useEffect(() => {
    if (paramBookingId) {
      router.replace(`/booking?bookingId=${paramBookingId}&from=check-in`);
    } else if (paramRoomId || paramMode) {
      const q = new URLSearchParams();
      if (paramRoomId) q.set('roomId', paramRoomId);
      if (paramMode) q.set('mode', paramMode);
      q.set('from', 'desk');
      router.replace(`/booking?${q.toString()}`);
    }
  }, [paramBookingId, paramRoomId, paramMode, router]);

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Reload bookings from storage on focus
  useEffect(() => {
    const handleFocus = () => {
      setBookings(loadBookingsFromStorage());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'WEEK' | 'ALL'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'RESERVED'>('ALL');

  // Printable Registration Card Modal
  const [selectedBookingForRegCard, setSelectedBookingForRegCard] = useState<RoomBooking | null>(null);

  // Compute Check-In List
  const checkInList = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter === 'CHECKED_IN' && b.status !== 'CHECKED_IN') return false;
      if (statusFilter === 'RESERVED' && b.status !== 'RESERVED') return false;

      // Date filter
      if (dateFilter === 'TODAY') {
        if (b.checkIn !== todayStr && b.status !== 'CHECKED_IN') return false;
      } else if (dateFilter === 'TOMORROW') {
        if (b.checkIn !== tomorrowStr) return false;
      } else if (dateFilter === 'WEEK') {
        const weekEnd = getRelativeDate(7);
        if (b.checkIn < todayStr || b.checkIn > weekEnd) return false;
      }

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
  }, [bookings, statusFilter, dateFilter, searchQuery, todayStr, tomorrowStr]);

  // Counts for summary pills
  const stats = useMemo(() => {
    const totalToday = bookings.filter((b) => b.checkIn === todayStr).length;
    const inHouse = bookings.filter((b) => b.status === 'CHECKED_IN').length;
    const pendingToday = bookings.filter((b) => b.checkIn === todayStr && b.status === 'RESERVED').length;
    return { totalToday, inHouse, pendingToday };
  }, [bookings, todayStr]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16 select-none font-sans text-slate-800 dark:text-slate-100">
      {/* Front Desk Option Boxes */}
      <FrontDeskNavBoxes activeId="check-in" />

      {/* Main Container Card: Pure Check-In List Table */}
      <div className="bg-white dark:bg-[#071F1A] rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#A51F36] text-white">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#24352F] dark:text-emerald-400 font-heading">
                Check-In List
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manifest of in-house guests and expected arrivals
              </p>
            </div>
          </div>

          {/* Action: Open New Booking Form on Dedicated Booking Page */}
          <div className="flex items-center gap-2">
            <Link
              href="/booking?from=check-in"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Booking / Walk-In</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 divide-x divide-[#DCE3DF] dark:divide-[#145447] border-b border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-xs">
          <div className="p-3 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Currently In-House
            </span>
            <span className="text-base font-bold text-[#0B3D32] dark:text-emerald-400 font-mono">
              {stats.inHouse} Guests
            </span>
          </div>
          <div className="p-3 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Expected Today
            </span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
              {stats.pendingToday} Arrivals
            </span>
          </div>
          <div className="p-3 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Today's Schedule
            </span>
            <span className="text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
              {stats.totalToday} Bookings
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'ALL'
                    ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                    : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-[#F2F6F4]'
                )}
              >
                All Manifest
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CHECKED_IN')}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'CHECKED_IN'
                    ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                    : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-[#F2F6F4]'
                )}
              >
                In-House ({stats.inHouse})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RESERVED')}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'RESERVED'
                    ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                    : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-[#F2F6F4]'
                )}
              >
                Expected Arrivals
              </button>
            </div>

            {/* Date Filters + Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                {[
                  { id: 'TODAY', label: 'Today' },
                  { id: 'TOMORROW', label: 'Tomorrow' },
                  { id: 'WEEK', label: '7 Days' },
                  { id: 'ALL', label: 'All' },
                ].map((df) => (
                  <button
                    key={df.id}
                    type="button"
                    onClick={() => setDateFilter(df.id as any)}
                    className={cn(
                      'px-2.5 py-1 rounded-[3px] text-[11px] font-semibold transition-colors cursor-pointer',
                      dateFilter === df.id
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                        : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-600 dark:text-slate-300 hover:bg-[#F2F6F4]'
                    )}
                  >
                    {df.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest, code, room..."
                  className="w-full h-8 rounded border border-[#DCE3DF] bg-[#FAFBF9] py-1 pl-8 pr-7 text-xs font-medium dark:border-[#145447] dark:bg-[#061B16] dark:text-white outline-none focus:border-[#0B3D32]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                    <th className="py-2.5 px-3.5 w-24 border-r border-[#E5EEE9] dark:border-[#145447]">Booking Code</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">Guest Details</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">Stay Period</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">Assigned Room</th>
                    <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">Tariff & Advance</th>
                    <th className="py-2.5 px-3.5 text-center border-r border-[#E5EEE9] dark:border-[#145447]">Status</th>
                    <th className="py-2.5 px-3.5 text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                  {checkInList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No bookings found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    checkInList.map((booking, idx) => {
                      const fin = getBookingFinancials(booking);
                      const isCheckedIn = booking.status === 'CHECKED_IN';

                      return (
                        <tr
                          key={booking.id}
                          className="hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {booking.bookingCode}
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-bold text-[#24352F] dark:text-white">
                              {booking.guest.firstName} {booking.guest.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {booking.guest.phone}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {booking.checkIn} → {booking.checkOut}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Room {booking.room.number}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{booking.room.type}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              Rs. {fin.totalCharges.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Adv: Rs. {fin.totalPaid.toLocaleString()}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                In-House
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Reserved
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isCheckedIn ? (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/booking?bookingId=${booking.id}&from=check-in`)}
                                  className="px-3 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer shadow-2xs"
                                >
                                  Check In
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingForRegCard(booking)}
                                    className="px-2 py-1 rounded-[3px] border border-[#DCE3DF] hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:border-[#145447] dark:text-slate-300 cursor-pointer"
                                    title="Print Registration Card"
                                  >
                                    Reg Card
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/booking?bookingId=${booking.id}&from=check-in`)}
                                    className="px-2 py-1 rounded-[3px] border border-[#DCE3DF] hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:border-[#145447] dark:text-slate-300 cursor-pointer"
                                    title="Edit details"
                                  >
                                    Edit
                                  </button>
                                </>
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
        </div>
      </div>

      {/* Printable Guest Registration Card Modal */}
      {selectedBookingForRegCard && (() => {
        const b = selectedBookingForRegCard;
        const fin = getBookingFinancials(b);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
            onClick={() => setSelectedBookingForRegCard(null)}
          >
            <div
              className="w-full max-w-2xl rounded bg-white border border-[#DCE3DF] shadow-2xl p-6 text-black select-text"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hotel Letterhead */}
              <div className="text-center pb-4 border-b-2 border-black">
                <h2 className="text-xl font-bold tracking-widest uppercase font-serif">
                  AURA GRAND HOTEL & RESORT
                </h2>
                <p className="text-xs text-slate-600">
                  Kathmandu, Nepal · Tel: +977-1-4455667 · info@auragrandhotel.com
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 border border-black text-xs font-bold uppercase tracking-wider">
                  Guest Registration Card
                </div>
              </div>

              {/* Reg Card Fields */}
              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Reservation Code:</span>
                    <strong className="font-mono text-sm">{b.bookingCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Assigned Room:</span>
                    <strong className="text-sm">Room {b.room.number} ({b.room.type})</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Guest Full Name:</span>
                    <strong className="text-sm">{b.guest.firstName} {b.guest.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Phone Number:</span>
                    <strong className="font-mono">{b.guest.phone}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Arrival Date:</span>
                    <strong>{b.checkIn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Departure Date:</span>
                    <strong>{b.checkOut}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Stay Duration:</span>
                    <strong>{b.nights} {b.nights === 1 ? 'Night' : 'Nights'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Room Rate:</span>
                    <strong>Rs. {b.room.pricePerNight.toLocaleString()}/night</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Total Paid / Advance:</span>
                    <strong className="text-emerald-700">Rs. {fin.totalPaid.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Balance Due at Checkout:</span>
                    <strong className={fin.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      Rs. {fin.balanceDue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 space-y-1">
                  <p><strong>Hotel Terms:</strong> Check-out time is 11:00 AM. Key cards must be returned upon departure. Smoking is strictly prohibited inside the room. The management is not responsible for valuables left unattended in rooms.</p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="border-t border-black pt-1 text-center">
                    <span className="text-[11px] font-semibold block">Guest Signature</span>
                  </div>
                  <div className="border-t border-black pt-1 text-center">
                    <span className="text-[11px] font-semibold block">Front Desk Officer Signature</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForRegCard(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0B3D32] text-white text-xs font-bold cursor-pointer hover:bg-[#07241E]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Registration Card</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function CheckInListPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Check-In List...
        </div>
      }
    >
      <CheckInListContent />
    </Suspense>
  );
}

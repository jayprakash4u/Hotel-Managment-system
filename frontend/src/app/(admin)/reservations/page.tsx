'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck,
  Search,
  Plus,
  DoorOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Eye,
  LayoutGrid,
  List,
  ArrowRight,
  Filter,
  BarChart3,
  UserCheck,
  UserX,
  LogOut,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { FrontDeskNavBoxes } from '@/components/common/FrontDeskNavBoxes';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  getRelativeDate,
  markBookingAsNoShow,
} from './reservationsData';
import { GuidedBookingModal } from '@/components/business/GuidedBookingModal';

type StatusFilter = 'ALL' | 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
type DateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

function RoomBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Guided Booking Modal State
  const [showGuidedBookingModal, setShowGuidedBookingModal] = useState(false);

  const todayStr = useMemo(() => getRelativeDate(0), []);

  // Persist bookings to localStorage whenever they change
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Navigate directly to dedicated folio page if query parameter 'code' exists
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const found = bookings.find((b) => b.bookingCode.toLowerCase() === codeParam.toLowerCase());
      if (found) {
        router.push(`/reservations/${found.id}`);
      }
    }
  }, [searchParams, bookings, router]);

  // Counts for each status tab
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      reserved: bookings.filter((b) => b.status === 'RESERVED').length,
      checkedIn: bookings.filter((b) => b.status === 'CHECKED_IN').length,
      checkedOut: bookings.filter((b) => b.status === 'CHECKED_OUT').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
      noShow: bookings.filter((b) => b.status === 'NO_SHOW').length,
    };
  }, [bookings]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Status Filter
      if (activeTab !== 'ALL' && b.status !== activeTab) {
        return false;
      }

      // 2. Date Filter
      if (dateFilter === 'TODAY') {
        const touchesToday =
          b.checkIn === todayStr ||
          b.checkOut === todayStr ||
          (b.checkIn <= todayStr && b.checkOut >= todayStr);
        if (!touchesToday) return false;
      } else if (dateFilter === 'THIS_WEEK') {
        const weekEndStr = getRelativeDate(7);
        const inThisWeek = b.checkIn <= weekEndStr && b.checkOut >= todayStr;
        if (!inThisWeek) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        const currentYearMonth = todayStr.substring(0, 7);
        const inThisMonth =
          b.checkIn.startsWith(currentYearMonth) || b.checkOut.startsWith(currentYearMonth);
        if (!inThisMonth) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && b.checkOut < customStartDate) return false;
        if (customEndDate && b.checkIn > customEndDate) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesName = fullName.includes(q);
        const matchesRoom = b.room.number.toLowerCase().includes(q);
        const matchesPhone = b.guest.phone.toLowerCase().includes(q);
        const matchesEmail = b.guest.email.toLowerCase().includes(q);

        if (!matchesCode && !matchesName && !matchesRoom && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeTab, dateFilter, customStartDate, customEndDate, searchQuery, todayStr]);

  // Actions on Bookings
  const handleCheckInGuest = (bookingId: string) => {
    router.push(`/check-in?bookingId=${bookingId}`);
  };

  const handleCheckOutGuest = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const fin = getBookingFinancials(booking);
      if (fin.balanceDue > 0) {
        toast.error(
          'Balance Outstanding',
          `Cannot check out with an outstanding balance of Rs. ${fin.balanceDue.toLocaleString()}. Redirecting to folio page.`
        );
        router.push(`/reservations/${booking.id}`);
        return;
      }
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'CHECKED_OUT' as const };
        }
        return b;
      })
    );
    toast.celebrate('Guest Checked Out!', 'Reservation settled and completed.');
  };

  const handleMarkNoShow = (bookingId: string) => {
    const updated = markBookingAsNoShow(bookings, bookingId);
    setBookings(updated);
    toast.warning('Marked as No-Show', 'Guest did not arrive. Room released for new bookings.');
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b))
    );
    toast.info('Booking Cancelled', 'Reservation status updated to Cancelled.');
  };

  const renderStatusBadge = (status: RoomBooking['status']) => {
    switch (status) {
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300 dark:border-[#145447]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Checked In
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Reserved
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Checked Out
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-500" />
            Cancelled
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <AlertCircle className="w-3 h-3 text-purple-500" />
            No-Show
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Front Desk Option Boxes (Matching Hotel Setup) */}
      <FrontDeskNavBoxes activeId="reservations" />

      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean, Professional Page Title & Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#24352F] dark:text-white font-heading">
              Bookings & Reservations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all reservations: reserved, checked in, checked out, cancelled, and no-shows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher: Cards vs Table */}
          <div className="flex items-center rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] p-0.5 dark:border-[#145447] dark:bg-[#061B16]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                  : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Reports & History shortcut */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-bold text-[#0B3D32] hover:bg-[#F2F6F4] transition-all dark:border-[#145447] dark:bg-[#07241E] dark:text-emerald-300"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stay History & Reports</span>
          </Link>

          {/* New Booking Button (Triggers Guided Flow) */}
          <button
            type="button"
            onClick={() => setShowGuidedBookingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STATUS FILTER TABS & SEARCH BAR
          Supports: ALL, RESERVED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'ALL'
                ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            All ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESERVED')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'RESERVED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Reserved ({counts.reserved})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_IN')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'CHECKED_IN'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Checked In ({counts.checkedIn})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHECKED_OUT')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'CHECKED_OUT'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>Checked Out ({counts.checkedOut})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'CANCELLED'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>Cancelled ({counts.cancelled})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NO_SHOW')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-colors cursor-pointer',
              activeTab === 'NO_SHOW'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-[#4A6458] hover:bg-[#F0F4F2] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span>No-Show ({counts.noShow})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, room, booking ID..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
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

      {/* -----------------------------------------------------------------------
          DATE FILTERS STRIP
          Filters by: All Dates, Today, Next 7 Days, This Month, Custom Range
          ----------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#FAFBF9] dark:bg-[#061B16] px-3 py-2 rounded-[3px] border border-[#E0E7E3] dark:border-[#145447] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
            <span>Stay Dates:</span>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: 'ALL', label: 'All Dates' },
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'Next 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  dateFilter === df.id
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-white dark:bg-[#07241E] text-slate-600 dark:text-slate-300 border border-[#DCE3DF] dark:border-[#145447] hover:bg-[#F2F6F4]'
                )}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Pickers (shown when 'CUSTOM' selected) */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-0.5 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-0.5 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-mono"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <div className="text-[11px] text-slate-500 dark:text-slate-400 ml-auto font-medium">
          Showing <span className="font-bold text-[#0B3D32] dark:text-emerald-400">{filteredBookings.length}</span> of{' '}
          {bookings.length} reservations
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          ROOM BOOKING LIST: CARDS VIEW
          ----------------------------------------------------------------------- */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBookings.map((booking) => {
            const financials = getBookingFinancials(booking);
            const isCheckedIn = booking.status === 'CHECKED_IN';
            const isReserved = booking.status === 'RESERVED';

            return (
              <div
                key={booking.id}
                className="rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] p-4 shadow-2xs flex flex-col justify-between hover:border-[#0B3D32] dark:hover:border-emerald-500 transition-all group"
              >
                <div>
                  {/* Top Row: Customer Name, Booking ID & Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#F0F4F2] dark:border-[#103D33]">
                    <div className="min-w-0">
                      <Link
                        href={`/reservations/${booking.id}`}
                        className="text-sm font-bold text-[#24352F] dark:text-white truncate block hover:text-[#0B3D32] dark:hover:text-emerald-300 transition-colors"
                      >
                        {booking.guest.firstName} {booking.guest.lastName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400">
                          {booking.bookingCode}
                        </span>
                        {booking.guest.vipTier === 'GOLD' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            GOLD VIP
                          </span>
                        )}
                        {booking.guest.vipTier === 'PLATINUM' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                            PLATINUM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">{renderStatusBadge(booking.status)}</div>
                  </div>

                  {/* Room Details Row */}
                  <div className="pt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#24352F] dark:text-slate-200 font-semibold">
                        <DoorOpen className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                        <span>Room {booking.room.number}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium">
                          {booking.room.type} ({booking.room.acType})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#64736C] dark:text-slate-400">
                        {booking.room.floorLevel}
                      </span>
                    </div>

                    {/* Stay Dates */}
                    <div className="flex items-center gap-1.5 text-xs text-[#52685E] dark:text-[#A4B8AE]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-semibold text-[#0B3D32] dark:text-emerald-400 ml-auto">
                        ({booking.nights} {booking.nights === 1 ? 'night' : 'nights'})
                      </span>
                    </div>

                    {/* Charges & Balance Summary Strip */}
                    <div className="pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Charges</span>
                        <span className="font-mono font-bold text-[#24352F] dark:text-white">
                          Rs. {financials.totalCharges.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Balance</span>
                        {financials.balanceDue > 0 ? (
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            Rs. {financials.balanceDue.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Dedicated Page Link + Quick Actions */}
                <div className="pt-3 mt-3 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/reservations/${booking.id}`}
                    className="flex-1 min-w-[100px] py-1.5 px-3 rounded-[3px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3 text-[#0B3D32]/60 dark:text-emerald-300/60 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Reserved Actions: Check In, No-Show, Cancel */}
                  {isReserved && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCheckInGuest(booking.id)}
                        className="py-1.5 px-2.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer flex items-center gap-1"
                        title="Check in guest today"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Check In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkNoShow(booking.id)}
                        className="py-1.5 px-2 rounded-[3px] border border-purple-200 text-purple-700 hover:bg-purple-50 text-[11px] font-semibold transition-colors dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/40 cursor-pointer"
                        title="Mark guest as No-Show"
                      >
                        No-Show
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="py-1.5 px-2 rounded-[3px] border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Cancel this reservation"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Checked In Actions: Check Out */}
                  {isCheckedIn && (
                    <button
                      type="button"
                      onClick={() => handleCheckOutGuest(booking.id)}
                      className="py-1.5 px-3 rounded-[3px] bg-slate-800 hover:bg-black text-white text-xs font-bold transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer flex items-center gap-1"
                      title="Quick Checkout & Settle"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Check Out</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
              No room bookings found matching your selected filters.
            </div>
          )}
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           ROOM BOOKINGS: TABLE VIEW
           ----------------------------------------------------------------------- */
        <div className="rounded-[3px] border border-[#DCE3DF] bg-white overflow-hidden shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                  <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">BOOKING ID</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">GUEST NAME</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM</th>
                  <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">STAY DATES</th>
                  <th className="py-2.5 px-3 w-20 text-center border-r border-[#E5EEE9] dark:border-[#145447]">NIGHTS</th>
                  <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">CHARGES</th>
                  <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">BALANCE DUE</th>
                  <th className="py-2.5 px-3.5 w-32 border-r border-[#E5EEE9] dark:border-[#145447]">STATUS</th>
                  <th className="py-2.5 px-3 w-44 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                {filteredBookings.map((booking, idx) => {
                  const financials = getBookingFinancials(booking);

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-mono font-bold text-[#0B3D32] hover:underline dark:text-emerald-400"
                        >
                          {booking.bookingCode}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-bold text-[#24352F] hover:text-[#0B3D32] dark:text-white dark:hover:text-emerald-300"
                        >
                          {booking.guest.firstName} {booking.guest.lastName}
                        </Link>
                        <div className="text-[11px] text-slate-400">{booking.guest.phone}</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-semibold text-[#24352F] dark:text-white">
                          Room {booking.room.number}
                        </div>
                        <div className="text-[10px] text-slate-400">{booking.room.type} ({booking.room.acType})</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#0B3D32] dark:text-emerald-300 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {booking.nights}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#24352F] dark:text-white border-r border-[#E5EEE9] dark:border-[#145447]">
                        Rs. {financials.totalCharges.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold border-r border-[#E5EEE9] dark:border-[#145447]">
                        {financials.balanceDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            Rs. {financials.balanceDue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Paid</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        {renderStatusBadge(booking.status)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/reservations/${booking.id}`}
                            className="inline-block px-2 py-1 rounded-[2px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 cursor-pointer"
                          >
                            Details
                          </Link>

                          {booking.status === 'RESERVED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCheckInGuest(booking.id)}
                                className="px-2 py-1 rounded-[2px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                              >
                                Check In
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkNoShow(booking.id)}
                                className="px-1.5 py-1 rounded-[2px] text-purple-700 border border-purple-200 hover:bg-purple-50 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="No-Show"
                              >
                                No-Show
                              </button>
                            </>
                          )}

                          {booking.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              onClick={() => handleCheckOutGuest(booking.id)}
                              className="px-2 py-1 rounded-[2px] bg-slate-800 hover:bg-black text-white text-xs font-bold transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          GUIDED BOOKING MODAL (Step 1-4 Flow)
          ----------------------------------------------------------------------- */}
      <GuidedBookingModal
        isOpen={showGuidedBookingModal}
        onClose={() => setShowGuidedBookingModal(false)}
        onSuccess={(_newBooking, _isCheckedIn) => {
          setBookings(loadBookingsFromStorage());
          setShowGuidedBookingModal(false);
        }}
      />
    </div>
  );
}

export default function RoomBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Room Bookings...
        </div>
      }
    >
      <RoomBookingsContent />
    </Suspense>
  );
}

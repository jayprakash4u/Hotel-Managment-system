'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  UserCheck,
  UserX,
  LogOut,
  MoreVertical,
  Check,
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
  markBookingAsNoShow,
} from './reservationsData';

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const dateFilterDropdownRef = useRef<HTMLDivElement>(null);

  // Close 3-dots menu & date filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setOpenMenuId(null);
      if (
        dateFilterDropdownRef.current &&
        !dateFilterDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDateFilterDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // Status tab definitions
  const statusTabs = useMemo(() => {
    return [
      { id: 'ALL' as const, label: 'All', count: counts.all },
      { id: 'RESERVED' as const, label: 'Reserved', count: counts.reserved },
      { id: 'CHECKED_IN' as const, label: 'Checked In', count: counts.checkedIn },
      { id: 'CHECKED_OUT' as const, label: 'Checked Out', count: counts.checkedOut },
      { id: 'CANCELLED' as const, label: 'Cancelled', count: counts.cancelled },
      { id: 'NO_SHOW' as const, label: 'No-Show', count: counts.noShow },
    ];
  }, [counts]);

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
          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            Checked In
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            Reserved
          </span>
        );
      case 'CHECKED_OUT':
        return (
          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Checked Out
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            Cancelled
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-block px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            No-Show
          </span>
        );
      default:
        return null;
    }
  };

  const isFromDesk = searchParams.get('from') === 'desk' || searchParams.get('from') === 'front-desk';

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="reservations" />

      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean, Professional Page Title & Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default dark:border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Bookings & Reservations
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher: Cards vs Table */}
          <div className="flex items-center rounded-[3px] border border-slate-200 bg-slate-100/60 p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-[#0B3D32] shadow-2xs dark:bg-slate-800 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card view"
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-[#0B3D32] shadow-2xs dark:bg-slate-800 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Book Now Button (Navigates directly to the Book Now form page) */}
          <Link
            href="/booking?from=reservations"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </Link>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STATUS TABS, SEARCH & DATE FILTER (Combined Single Minimal Row)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-default dark:border-border-default pt-1">
        {/* Left Side: Minimal Text Tabs with Underline */}
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar -mb-px">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative pb-2.5 px-2 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                  isActive
                    ? 'text-[#0B3D32] dark:text-emerald-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.2 rounded-full transition-colors',
                    isActive
                      ? 'bg-[#E8F2EE] text-[#0B3D32] dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>

                {/* Underline for Active Tab */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0B3D32] dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Search Bar & Filter Icon Button */}
        <div className="flex items-center gap-2 pb-2 self-end md:self-auto w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, room, ID..."
              className="w-full rounded-[3px] border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
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

          {/* Filter Icon Button (with dropdown for date ranges) */}
          <div className="relative shrink-0" ref={dateFilterDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDateFilterDropdown((prev) => !prev);
              }}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-[3px] border text-xs font-semibold transition-colors cursor-pointer shadow-2xs',
                dateFilter !== 'ALL'
                  ? 'bg-[#E8F2EE] border-[#0B3D32] text-[#0B3D32] dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
              title="Filter by Stay Dates"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-xs">
                {dateFilter === 'ALL'
                  ? 'Filter'
                  : dateFilter === 'TODAY'
                  ? 'Today'
                  : dateFilter === 'THIS_WEEK'
                  ? '7 Days'
                  : dateFilter === 'THIS_MONTH'
                  ? 'This Month'
                  : 'Custom'}
              </span>
              {dateFilter !== 'ALL' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B3D32] dark:bg-emerald-400" />
              )}
            </button>

            {/* Dropdown for date ranges */}
            {showDateFilterDropdown && (
              <div
                className="absolute right-0 top-full mt-1.5 z-40 w-60 rounded-[3px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl p-2.5 text-xs space-y-2 animate-in fade-in duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider">
                    Stay Dates
                  </span>
                  {dateFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter('ALL');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {(
                    [
                      { id: 'ALL', label: 'All Dates' },
                      { id: 'TODAY', label: 'Today' },
                      { id: 'THIS_WEEK', label: 'Next 7 Days' },
                      { id: 'THIS_MONTH', label: 'This Month' },
                      { id: 'CUSTOM', label: 'Custom Range...' },
                    ] as const
                  ).map((df) => {
                    const isSelected = dateFilter === df.id;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => {
                          setDateFilter(df.id);
                          if (df.id !== 'CUSTOM') {
                            setShowDateFilterDropdown(false);
                          }
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs transition-colors cursor-pointer text-left',
                          isSelected
                            ? 'bg-[#0B3D32] text-white font-semibold dark:bg-emerald-600'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                      >
                        <span>{df.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range Pickers */}
                {dateFilter === 'CUSTOM' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        From:
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-2 py-1 rounded-[2px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        To:
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-2 py-1 rounded-[2px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDateFilterDropdown(false)}
                      className="w-full py-1.5 rounded-[2px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer text-center"
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar showing active filter tags and result count if filtered */}
      {(searchQuery || dateFilter !== 'ALL' || activeTab !== 'ALL') && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-400">Active Filters:</span>
            {activeTab !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[#0B3D32] dark:text-emerald-400 font-semibold border border-slate-200 dark:border-slate-700">
                Status: {activeTab}
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className="hover:text-rose-500 cursor-pointer"
                  title="Remove status filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {dateFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[#0B3D32] dark:text-emerald-400 font-semibold border border-slate-200 dark:border-slate-700">
                Dates: {dateFilter === 'TODAY' ? 'Today' : dateFilter === 'THIS_WEEK' ? 'Next 7 Days' : dateFilter === 'THIS_MONTH' ? 'This Month' : 'Custom'}
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('ALL');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="hover:text-rose-500 cursor-pointer"
                  title="Remove date filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[#0B3D32] dark:text-emerald-400 font-semibold border border-slate-200 dark:border-slate-700">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-500 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
          <div>
            Showing <span className="font-bold text-[#0B3D32] dark:text-emerald-400">{filteredBookings.length}</span> of {bookings.length}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
         ROOM BOOKINGS: TABLE VIEW
         ----------------------------------------------------------------------- */}
      {viewMode === 'table' ? (
        <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                  <th className="py-3 px-4 w-28 border-r border-slate-200/70 dark:border-slate-800">BOOKING ID</th>
                  <th className="py-3 px-4 border-r border-slate-200/70 dark:border-slate-800">GUEST NAME</th>
                  <th className="py-3 px-4 border-r border-slate-200/70 dark:border-slate-800">ROOM</th>
                  <th className="py-3 px-4 border-r border-slate-200/70 dark:border-slate-800">STAY DATES</th>
                  <th className="py-3 px-4 w-20 text-center border-r border-slate-200/70 dark:border-slate-800">NIGHTS</th>
                  <th className="py-3 px-4 text-right border-r border-slate-200/70 dark:border-slate-800">CHARGES</th>
                  <th className="py-3 px-4 text-right border-r border-slate-200/70 dark:border-slate-800">BALANCE DUE</th>
                  <th className="py-3 px-4 w-32 border-r border-slate-200/70 dark:border-slate-800">STATUS</th>
                  <th className="py-3 px-4 w-44 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredBookings.map((booking, idx) => {
                  const financials = getBookingFinancials(booking);

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-mono font-bold text-[#0B3D32] hover:underline dark:text-emerald-400"
                        >
                          {booking.bookingCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800/60">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="font-bold text-slate-900 hover:text-[#0B3D32] hover:underline dark:text-white dark:hover:text-emerald-400 block"
                        >
                          {booking.guest.firstName} {booking.guest.lastName}
                        </Link>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{booking.guest.phone || '—'}</span>
                          {booking.guest.email && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-slate-400 dark:text-slate-500">{booking.guest.email}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Room {booking.room.number}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{booking.room.type} ({booking.room.acType})</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                        {booking.nights}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-normal text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                        Rs. {financials.totalCharges.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono border-r border-slate-100 dark:border-slate-800/60">
                        {financials.balanceDue > 0 ? (
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            Rs. {financials.balanceDue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                        {renderStatusBadge(booking.status)}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Details Icon Button */}
                          <Link
                            href={`/reservations/${booking.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 cursor-pointer"
                            title="View Details & Folio"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* 2. Solid Primary Action (Check In or Check Out) */}
                          {booking.status === 'RESERVED' && (
                            <button
                              type="button"
                              onClick={() => handleCheckInGuest(booking.id)}
                              className="px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
                              title="Check in guest today"
                            >
                              Check In
                            </button>
                          )}

                          {booking.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              onClick={() => handleCheckOutGuest(booking.id)}
                              className="px-2.5 py-1 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
                              title="Check out & settle"
                            >
                              Check Out
                            </button>
                          )}

                          {/* 3. Three-Dots (⋮) Menu for Secondary Actions */}
                          {booking.status === 'RESERVED' && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === booking.id ? null : booking.id);
                                }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {openMenuId === booking.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 z-30 w-38 rounded-[3px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg py-1 text-left text-xs divide-y divide-slate-100 dark:divide-slate-800/80"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleMarkNoShow(booking.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold transition-colors"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Mark No-Show</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleCancelBooking(booking.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Cancel Booking</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                      No room bookings found matching your selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           ROOM BOOKING LIST: CARDS VIEW
           ----------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBookings.map((booking) => {
            const financials = getBookingFinancials(booking);
            const isCheckedIn = booking.status === 'CHECKED_IN';
            const isReserved = booking.status === 'RESERVED';

            return (
              <div
                key={booking.id}
                className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-5 shadow-2xs flex flex-col justify-between hover:border-[#0B3D32] dark:hover:border-emerald-500 transition-all group"
              >
                <div className="space-y-4">
                  {/* Top Row: Guest Name (large) & Status Badge (top right, softer) */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/reservations/${booking.id}`}
                        className="text-lg font-black text-slate-900 dark:text-white truncate block hover:text-[#0B3D32] dark:hover:text-emerald-400 transition-colors"
                      >
                        {booking.guest.firstName} {booking.guest.lastName}
                      </Link>
                      {booking.guest.vipTier === 'GOLD' && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          GOLD VIP
                        </span>
                      )}
                      {booking.guest.vipTier === 'PLATINUM' && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                          PLATINUM
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        {booking.guest.phone || '—'}
                      </p>
                    </div>

                    {/* Status Badge: top right, smaller, softer */}
                    <div className="shrink-0 mt-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-medium border">
                        {booking.status === 'CHECKED_IN' && (
                          <span className="bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50">
                            Checked In
                          </span>
                        )}
                        {booking.status === 'RESERVED' && (
                          <span className="bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50">
                            Reserved
                          </span>
                        )}
                        {booking.status === 'CHECKED_OUT' && (
                          <span className="bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700/50">
                            Checked Out
                          </span>
                        )}
                        {booking.status === 'CANCELLED' && (
                          <span className="bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50">
                            Cancelled
                          </span>
                        )}
                        {booking.status === 'NO_SHOW' && (
                          <span className="bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50">
                            No-Show
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Room Details Section */}
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 space-y-3">
                    {/* Combined Room + Floor on one line */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                        <DoorOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          Room {booking.room.number} - {booking.room.type} ({booking.room.acType})
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 ml-1">
                          · {booking.room.floorLevel}
                        </span>
                      </div>
                    </div>

                    {/* Compressed Stay Dates */}
                    <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })} →{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-auto">
                        ({booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'})
                      </span>
                    </div>

                    {/* Balance Due / Paid Status */}
                    <div className="flex items-center justify-end text-xs border-t border-slate-50 dark:border-slate-800/40 pt-2">
                      {financials.balanceDue > 0 ? (
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          Due: Rs. {financials.balanceDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action: Dedicated Page Link + Quick Actions */}
                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reservations/${booking.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 cursor-pointer"
                      title="View booking folio & details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {booking.bookingCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Reserved Actions: Check In, No-Show, Cancel */}
                    {isReserved && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckInGuest(booking.id)}
                          className="px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Check in guest today"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Check In</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === `card-${booking.id}` ? null : `card-${booking.id}`);
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {openMenuId === `card-${booking.id}` && (
                            <div
                              className="absolute right-0 bottom-full mb-1 z-30 w-38 rounded-[3px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg py-1 text-left text-xs divide-y divide-slate-100 dark:divide-slate-800/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleMarkNoShow(booking.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold transition-colors"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Mark No-Show</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleCancelBooking(booking.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Cancel Booking</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Checked In Actions: Check Out */}
                    {isCheckedIn && (
                      <button
                        type="button"
                        onClick={() => handleCheckOutGuest(booking.id)}
                        className="px-3 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Check out & settle"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3px] space-y-3">
              <p>No room bookings found matching your selected filters.</p>
              <div>
                <Link
                  href="/booking?from=reservations"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Now</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function RoomBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400 dark:text-slate-500">
          Loading Room Bookings...
        </div>
      }
    >
      <RoomBookingsContent />
    </Suspense>
  );
}

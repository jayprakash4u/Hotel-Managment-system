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
  X,
  Eye,
  LayoutGrid,
  List,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomBooking,
  AVAILABLE_ROOMS_CATALOG,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
} from './reservationsData';

function RoomBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);

  // New Booking Form States
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestAddress, setNewGuestAddress] = useState('');
  const [newRoomId, setNewRoomId] = useState('rm-101');
  const [newCheckIn, setNewCheckIn] = useState('2026-10-15');
  const [newCheckOut, setNewCheckOut] = useState('2026-10-17');
  const [newInitialStatus, setNewInitialStatus] = useState<'RESERVED' | 'CHECKED_IN'>('RESERVED');
  const [newAdvancePaid, setNewAdvancePaid] = useState<string>('2000');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');

  // Persist bookings to localStorage
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Navigate directly to dedicated page if query parameter 'code' exists
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const found = bookings.find((b) => b.bookingCode.toLowerCase() === codeParam.toLowerCase());
      if (found) {
        router.push(`/reservations/${found.id}`);
      }
    }
  }, [searchParams, bookings, router]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      checkedIn: bookings.filter((b) => b.status === 'CHECKED_IN').length,
      reserved: bookings.filter((b) => b.status === 'RESERVED').length,
      checkedOut: bookings.filter((b) => b.status === 'CHECKED_OUT').length,
    };
  }, [bookings]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === 'CHECKED_IN' && b.status !== 'CHECKED_IN') return false;
      if (activeTab === 'RESERVED' && b.status !== 'RESERVED') return false;
      if (activeTab === 'CHECKED_OUT' && b.status !== 'CHECKED_OUT') return false;

      // Search query
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
  }, [bookings, activeTab, searchQuery]);

  // Actions on Bookings
  const handleCheckInGuest = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return { ...b, status: 'CHECKED_IN' as const };
        }
        return b;
      })
    );
    toast.celebrate('Guest Checked In!', 'Room status switched to Occupied.');
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

  // Create New Booking Submit
  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newGuestPhone.trim()) {
      toast.error('Required Fields Missing', 'Please enter customer name and phone number.');
      return;
    }

    const roomObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === newRoomId) || AVAILABLE_ROOMS_CATALOG[0];
    const nights = Math.max(
      1,
      Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24))
    );
    const roomCharges = roomObj.pricePerNight * nights;
    const advance = parseFloat(newAdvancePaid) || 0;

    const nextCodeNum = 1000 + bookings.length + 1;
    const newBookingCode = `BK-${nextCodeNum}`;

    const names = newGuestName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Guest';

    const newBooking: RoomBooking = {
      id: `bk-${Date.now()}`,
      bookingCode: newBookingCode,
      status: newInitialStatus,
      guest: {
        id: `gst-${Date.now()}`,
        firstName,
        lastName,
        phone: newGuestPhone.trim(),
        email: newGuestEmail.trim() || `${newGuestPhone.trim()}@guest.hotel`,
        address: newGuestAddress.trim() || 'Kathmandu, Nepal',
        idType: 'Citizenship',
        idNumber: 'Pending',
        country: 'Nepal',
        vipTier: 'STANDARD',
      },
      room: {
        id: roomObj.id,
        number: roomObj.number,
        type: roomObj.type,
        acType: roomObj.acType,
        bedType: roomObj.bedType,
        floorLevel: roomObj.floorLevel,
        pricePerNight: roomObj.pricePerNight,
      },
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights,
      roomCharges,
      cafeOrders: [],
      payments:
        advance > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                receiptNo: `REC-${nextCodeNum}-A`,
                date: 'Today, Advance',
                amount: advance,
                method: newPaymentMethod,
                type: 'ADVANCE',
                notes: 'Advance deposit at booking',
              },
            ]
          : [],
      bookingHistory: [],
    };

    setBookings((prev) => [newBooking, ...prev]);
    setShowNewBookingModal(false);
    // Reset form
    setNewGuestName('');
    setNewGuestPhone('');
    setNewGuestEmail('');
    setNewGuestAddress('');
    setNewAdvancePaid('2000');
    toast.celebrate('Booking Created!', `Assigned ${newBooking.room.number} (${newBookingCode}) to ${firstName} ${lastName}.`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean, Professional Page Title & Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#24352F] dark:text-white font-heading">
            Room Bookings
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
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

          {/* New Booking Button */}
          <button
            type="button"
            onClick={() => setShowNewBookingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          STATUS FILTER TABS & SEARCH BAR
          Tabs: All, Checked In, Reserved, Checked Out
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
          ROOM BOOKING LIST: CARDS VIEW (Clean, Professional Page Navigation)
          ----------------------------------------------------------------------- */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredBookings.map((booking) => {
            const financials = getBookingFinancials(booking);
            const isCheckedIn = booking.status === 'CHECKED_IN';
            const isReserved = booking.status === 'RESERVED';
            const isCheckedOut = booking.status === 'CHECKED_OUT';

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
                    <div className="shrink-0">
                      {isCheckedIn && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300 dark:border-[#145447]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Checked In
                        </span>
                      )}
                      {isReserved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Reserved
                        </span>
                      )}
                      {isCheckedOut && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          Checked Out
                        </span>
                      )}
                    </div>
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
                        {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} –{' '}
                        {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                <div className="pt-3 mt-3 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center gap-2">
                  <Link
                    href={`/reservations/${booking.id}`}
                    className="flex-1 py-1.5 px-3 rounded-[3px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3 text-[#0B3D32]/60 dark:text-emerald-300/60 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* Fast Action button based on status */}
                  {isReserved && (
                    <button
                      type="button"
                      onClick={() => handleCheckInGuest(booking.id)}
                      className="py-1.5 px-2.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                      title="Quick Check-In"
                    >
                      Check In
                    </button>
                  )}
                  {isCheckedIn && (
                    <button
                      type="button"
                      onClick={() => handleCheckOutGuest(booking.id)}
                      className="py-1.5 px-2.5 rounded-[3px] bg-slate-800 hover:bg-black text-white text-xs font-bold transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
                      title="Quick Checkout & Settle"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 border border-dashed border-[#DCE3DF] dark:border-[#145447] rounded-[3px]">
              No room bookings found matching &ldquo;{searchQuery}&rdquo;.
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
                  <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">STATUS</th>
                  <th className="py-2.5 px-3 w-36 text-center">ACTION</th>
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
                        {booking.status === 'CHECKED_IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-[#0E362C] dark:text-emerald-300">
                            Checked In
                          </span>
                        )}
                        {booking.status === 'RESERVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            Reserved
                          </span>
                        )}
                        {booking.status === 'CHECKED_OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                            Checked Out
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Link
                          href={`/reservations/${booking.id}`}
                          className="inline-block px-2.5 py-1 rounded-[2px] bg-[#EEF4F1] hover:bg-[#E2ECE7] text-[#0B3D32] text-xs font-bold transition-colors dark:bg-[#0E362C] dark:hover:bg-[#144A3C] dark:text-emerald-300 cursor-pointer"
                        >
                          View Details
                        </Link>
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
          MODAL: + NEW BOOKING (Fast Front Desk Entry)
          ----------------------------------------------------------------------- */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#24352F] dark:text-white uppercase tracking-wider font-heading">
                Create Room Booking
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Ramesh Karki"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 98XXXXXXXX"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Room *
                  </label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    {AVAILABLE_ROOMS_CATALOG.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} — {room.type} ({room.acType}, {room.bedType}) · Rs. {room.pricePerNight}/night
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newInitialStatus}
                    onChange={(e) => setNewInitialStatus(e.target.value as any)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="RESERVED">Reserved</option>
                    <option value="CHECKED_IN">Checked In Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Advance Deposit (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvancePaid}
                    onChange={(e) => setNewAdvancePaid(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5EEE9] dark:border-[#145447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-slate-600 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs dark:bg-emerald-600 cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

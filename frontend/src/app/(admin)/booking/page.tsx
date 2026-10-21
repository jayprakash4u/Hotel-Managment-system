'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bed,
  Calendar,
  ChevronDown,
  ArrowLeft,
  X,
  Check,
  KeyRound,
  RotateCcw,
  Printer,
  Phone,
  User,
  Mail,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { FrontDeskNavBoxes } from '@/components/common/FrontDeskNavBoxes';
import {
  RoomBooking,
  PaymentEntry,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getRelativeDate,
  AVAILABLE_ROOMS_CATALOG,
  AvailableRoomOption,
  getBookingFinancials,
} from '../reservations/reservationsData';

// Registered Guest Interface for search/autocomplete
interface RegisteredGuest {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const DEFAULT_GUESTS: RegisteredGuest[] = [
  { id: 'gst-1', name: 'Ram Sharma', phone: '+977 9841234567', email: 'ram.sharma@gmail.com' },
  { id: 'gst-2', name: 'Sita Thapa', phone: '+977 9851122334', email: 'sita.thapa@outlook.com' },
  { id: 'gst-3', name: 'Rajesh Hamal', phone: '+977 9801998877', email: 'rajesh.hamal@kollywood.np' },
  { id: 'gst-4', name: 'Maya Gurung', phone: '+977 9813445566', email: 'maya.gurung@annapurna.org' },
  { id: 'gst-5', name: 'Johnathan Doe', phone: '+1 415 555 2671', email: 'john.doe@techcorp.io' },
];

function loadRegisteredGuests(): RegisteredGuest[] {
  if (typeof window === 'undefined') return DEFAULT_GUESTS;
  try {
    const raw = localStorage.getItem('hotel_registered_guests');
    if (raw) return JSON.parse(raw);
  } catch { }
  return DEFAULT_GUESTS;
}

function NewRoomBookingContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramBookingId = searchParams.get('bookingId');
  const paramRoomId = searchParams.get('roomId');
  const paramCheckIn = searchParams.get('checkIn');
  const paramCheckOut = searchParams.get('checkOut');
  const fromParam = searchParams.get('from');

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [registeredGuests] = useState<RegisteredGuest[]>(() => loadRegisteredGuests());

  // ---------------------------------------------------------------------------
  // 1. STAY SCHEDULE STATE
  // ---------------------------------------------------------------------------
  const [checkInDate, setCheckInDate] = useState<string>(paramCheckIn || todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(paramCheckOut || tomorrowStr);
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  // Compute Stay Nights
  const nights = useMemo(() => {
    try {
      const inDate = new Date(checkInDate);
      const outDate = new Date(checkOutDate);
      const diffMs = outDate.getTime() - inDate.getTime();
      const n = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, isNaN(n) ? 1 : n);
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  // When check-in changes, keep check-out valid
  const handleCheckInDateChange = (newIn: string) => {
    setCheckInDate(newIn);
    try {
      const inD = new Date(newIn);
      const outD = new Date(checkOutDate);
      if (outD <= inD) {
        inD.setDate(inD.getDate() + 1);
        setCheckOutDate(inD.toISOString().split('T')[0]);
      }
    } catch { }
  };

  // ---------------------------------------------------------------------------
  // 2. GUEST DETAILS STATE
  // ---------------------------------------------------------------------------
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');
  const [showGuestSuggestions, setShowGuestSuggestions] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('Ram Sharma');
  const [guestPhone, setGuestPhone] = useState<string>('+977 9841234567');
  const [guestEmail, setGuestEmail] = useState<string>('ram.sharma@gmail.com');

  const guestSuggestions = useMemo(() => {
    if (!guestSearchQuery.trim()) return [];
    const q = guestSearchQuery.toLowerCase().trim();
    return registeredGuests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.phone.toLowerCase().includes(q)
    );
  }, [guestSearchQuery, registeredGuests]);

  const handleSelectGuestSuggestion = (g: RegisteredGuest) => {
    setGuestName(g.name);
    setGuestPhone(g.phone);
    if (g.email) setGuestEmail(g.email);
    setGuestSearchQuery('');
    setShowGuestSuggestions(false);
  };

  // ---------------------------------------------------------------------------
  // 3. ROOM INFORMATION TABLE STATE (Matches user reference design)
  // ---------------------------------------------------------------------------
  const [selectedRoomId, setSelectedRoomId] = useState<string>(paramRoomId || 'rm-101');

  const selectedRoomObj: AvailableRoomOption = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS_CATALOG[0];
  }, [selectedRoomId]);

  const [customRate, setCustomRate] = useState<number>(3500);
  const [discount, setDiscount] = useState<number>(0);

  // Sync rate when room changes
  useEffect(() => {
    if (selectedRoomObj) {
      setCustomRate(selectedRoomObj.pricePerNight);
    }
  }, [selectedRoomObj]);

  // Compute Subtotal & Total Payable
  const subtotal = useMemo(() => {
    return (Number(customRate) || 0) * nights;
  }, [customRate, nights]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0));
  }, [subtotal, discount]);

  // ---------------------------------------------------------------------------
  // 4. NOTIFICATIONS, REMARKS & PAYMENT STATE
  // ---------------------------------------------------------------------------
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [printRegCard, setPrintRegCard] = useState<boolean>(true);

  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'LATER' | 'ADVANCE' | 'FULL'>('FULL');
  const [advancedAmount, setAdvancedAmount] = useState<number>(3500);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  // Keep advance synced with total payable when total changes
  useEffect(() => {
    if (paymentChoice === 'FULL') {
      setAdvancedAmount(totalPayable);
    } else if (paymentChoice === 'LATER') {
      setAdvancedAmount(0);
    } else {
      setAdvancedAmount((prev) => (prev > totalPayable ? totalPayable : prev === 0 ? Math.min(2000, totalPayable) : prev));
    }
  }, [totalPayable, paymentChoice]);

  const dueAmount = useMemo(() => {
    if (paymentChoice === 'LATER') return totalPayable;
    return Math.max(0, totalPayable - (Number(advancedAmount) || 0));
  }, [totalPayable, advancedAmount, paymentChoice]);

  // Registration Card Modal state
  const [selectedBookingForRegCard, setSelectedBookingForRegCard] = useState<RoomBooking | null>(null);

  // Pre-fill if editing an existing booking
  useEffect(() => {
    if (paramBookingId) {
      const b = bookings.find((item) => item.id === paramBookingId);
      if (b) {
        setGuestName(`${b.guest.firstName} ${b.guest.lastName}`.trim());
        setGuestPhone(b.guest.phone || '');
        setGuestEmail(b.guest.email || '');
        setCheckInDate(b.checkIn);
        setCheckOutDate(b.checkOut);
        setSelectedRoomId(b.room.id);
        setCustomRate(b.room.pricePerNight);
        setBookingNotes(b.notes || '');

        const totalPaid = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid === 0) {
          setPaymentChoice('LATER');
          setAdvancedAmount(0);
        } else if (totalPaid >= b.roomCharges) {
          setPaymentChoice('FULL');
          setAdvancedAmount(totalPaid);
        } else {
          setPaymentChoice('ADVANCE');
          setAdvancedAmount(totalPaid);
        }
      }
    }
  }, [paramBookingId, bookings]);

  // Back navigation
  const handleBackNavigation = () => {
    if (fromParam === 'reservations') {
      router.push('/reservations');
    } else if (fromParam === 'check-in') {
      router.push('/check-in');
    } else if (fromParam === 'rooms') {
      router.push('/rooms');
    } else {
      router.push('/front-desk');
    }
  };

  const activeNavBoxId = fromParam === 'reservations' ? 'reservations' : fromParam === 'check-in' ? 'check-in' : 'desk';

  // ---------------------------------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------------------------------
  const handleResetForm = () => {
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setBookingNotes('');
    setDiscount(0);
    setCheckInDate(todayStr);
    setCheckOutDate(tomorrowStr);
    setAdultsCount(2);
    setChildrenCount(0);
    const defRoom = AVAILABLE_ROOMS_CATALOG[0];
    if (defRoom) {
      setSelectedRoomId(defRoom.id);
      setCustomRate(defRoom.pricePerNight);
      setAdvancedAmount(defRoom.pricePerNight);
    }
    setPaymentChoice('FULL');
    setPaymentMethod('CASH');
    toast.info('Form Reset', 'All booking fields have been reset.');
  };

  // ---------------------------------------------------------------------------
  // SAVE BOOKING (Reserved vs Checked In)
  // ---------------------------------------------------------------------------
  const handleSaveBooking = (shouldCheckInNow: boolean) => {
    if (!guestName.trim()) {
      toast.error('Name Required', 'Please enter guest full name.');
      return;
    }
    if (!guestPhone.trim()) {
      toast.error('Phone Required', 'Please enter mobile number.');
      return;
    }

    const [first, ...rest] = guestName.trim().split(' ');
    const firstName = first || 'Guest';
    const lastName = rest.join(' ') || 'Customer';

    const paidNow = paymentChoice === 'LATER' ? 0 : Math.min(Number(advancedAmount) || 0, totalPayable);

    const paymentRecords: PaymentEntry[] = paidNow > 0 ? [
      {
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${Date.now().toString().slice(-4)}`,
        date: 'Today',
        amount: paidNow,
        method: (paymentMethod === 'PAY_LATER' ? 'CASH' : paymentMethod) as any,
        type: paidNow >= totalPayable ? 'SETTLEMENT' : 'ADVANCE',
        notes: paidNow >= totalPayable ? 'Full payment received at booking' : 'Advance deposit received at booking',
      },
    ] : [];

    const newBookingId = paramBookingId || `bk-${Date.now().toString().slice(-4)}`;
    const newBookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentBookings = loadBookingsFromStorage();

    const bookingPayload: RoomBooking = {
      id: newBookingId,
      bookingCode: newBookingCode,
      status: shouldCheckInNow ? 'CHECKED_IN' : 'RESERVED',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      roomCharges: totalPayable,
      room: {
        id: selectedRoomObj.id,
        number: selectedRoomObj.number,
        type: selectedRoomObj.type,
        acType: selectedRoomObj.acType,
        bedType: selectedRoomObj.bedType,
        floorLevel: selectedRoomObj.floorLevel,
        pricePerNight: Number(customRate) || selectedRoomObj.pricePerNight,
      },
      guest: {
        id: `gst-${Date.now()}`,
        firstName,
        lastName,
        phone: guestPhone.trim(),
        email: guestEmail.trim() || `${guestPhone.trim()}@guest.hotel`,
        address: 'Kathmandu, Nepal',
        idType: 'Citizenship',
        idNumber: 'To be collected at check-in',
        country: 'Nepal',
        vipTier: 'STANDARD',
      },
      cafeOrders: [],
      payments: paymentRecords,
      bookingHistory: [],
      notes: bookingNotes.trim() || undefined,
    };

    let updated: RoomBooking[];
    if (paramBookingId && currentBookings.some((b) => b.id === paramBookingId)) {
      updated = currentBookings.map((b) => (b.id === paramBookingId ? bookingPayload : b));
    } else {
      updated = [bookingPayload, ...currentBookings];
    }

    setBookings(updated);
    saveBookingsToStorage(updated);

    if (printRegCard) {
      setSelectedBookingForRegCard(bookingPayload);
      if (shouldCheckInNow) {
        toast.celebrate('Guest Checked In!', `Room ${selectedRoomObj.number} assigned to ${guestName.trim()}. Room marked Occupied.`);
      } else {
        toast.success('Booking Saved!', `Reservation ${newBookingCode} confirmed for ${guestName.trim()}. Room held.`);
      }
    } else {
      if (shouldCheckInNow) {
        toast.celebrate('Guest Checked In!', `Room ${selectedRoomObj.number} assigned to ${guestName.trim()}. Room marked Occupied.`);
        router.push('/check-in');
      } else {
        toast.success('Booking Confirmed!', `Reservation ${newBookingCode} confirmed for ${guestName.trim()}. Room held.`);
        router.push('/reservations');
      }
    }
  };

  const handleCloseRegCardModal = () => {
    const isCheckedIn = selectedBookingForRegCard?.status === 'CHECKED_IN';
    setSelectedBookingForRegCard(null);
    if (isCheckedIn) {
      router.push('/check-in');
    } else {
      router.push('/reservations');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16 select-none font-sans text-slate-900 dark:text-neutral-100">
      {/* Front Desk Top Navigation Boxes */}
      <FrontDeskNavBoxes activeId={activeNavBoxId} />

      {/* Main Container Card: Clean & Professional */}
      <div className="bg-white dark:bg-[#071F1A] rounded-xl border border-slate-200 dark:border-[#145447] shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              New Room Booking
            </h1>
          </div>

          <button
            type="button"
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-[#F2F6F4]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {fromParam === 'reservations'
                ? 'Back to Reservation List'
                : fromParam === 'check-in'
                ? 'Back to Check-In List'
                : fromParam === 'rooms'
                ? 'Back to Rooms'
                : 'Back to Front Desk'}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-8">
          {/* ===============================================================
              SECTION 1: GUEST & STAY DURATION
              =============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-100 dark:border-[#145447] pb-8">
            {/* Stay Schedule (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                  Stay Schedule
                </span>
              </div>

              {/* Check-in & Check-out Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Check-in date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => handleCheckInDateChange(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Check-out date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
              </div>

              {/* Adults & Children */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Adults
                  </label>
                  <div className="relative">
                    <select
                      value={adultsCount}
                      onChange={(e) => setAdultsCount(Number(e.target.value))}
                      className="w-full appearance-none px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer pr-8"
                    >
                      <option value={1}>1 Adult</option>
                      <option value={2}>2 Adults</option>
                      <option value={3}>3 Adults</option>
                      <option value={4}>4 Adults</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Children
                  </label>
                  <div className="relative">
                    <select
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value))}
                      className="w-full appearance-none px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer pr-8"
                    >
                      <option value={0}>0 Children</option>
                      <option value={1}>1 Child</option>
                      <option value={2}>2 Children</option>
                      <option value={3}>3 Children</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details (Reduced width, compact & professional) */}
            <div className="lg:col-span-7 space-y-4 max-w-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 block">
                Search guest
              </span>

              {/* Fast Autocomplete Guest Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={guestSearchQuery}
                    onChange={(e) => {
                      setGuestSearchQuery(e.target.value);
                      setShowGuestSuggestions(true);
                    }}
                    onFocus={() => setShowGuestSuggestions(true)}
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                  {guestSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuestSearchQuery('');
                        setShowGuestSuggestions(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showGuestSuggestions && guestSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-slate-200 dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-xl overflow-hidden py-1">
                    {guestSuggestions.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectGuestSuggestion(g)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-[#093027] flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 dark:border-[#145447]/40 last:border-0"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">{g.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{g.phone}</span>
                        </div>
                        <span className="text-[10px] text-[#0B3D32] dark:text-emerald-400 font-semibold uppercase tracking-wider">
                          Autofill
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Guest Fields: Name, Phone & Email in a balanced 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Guest name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Full name"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+977 mobile number"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Email address (optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================================
              SECTION 2: ROOM INFORMATION (Exact Match of User Specification)
              =============================================================== */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Room Information
              </h2>
            </div>

            {/* Structured Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-[#145447] rounded-lg bg-white dark:bg-[#071F1A]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-[#145447]">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-[#145447]">
                      SL.
                    </th>
                    <th className="py-2.5 px-4 min-w-[170px] border-r border-slate-200 dark:border-[#145447]">
                      ROOM CATEGORY
                    </th>
                    <th className="py-2.5 px-4 min-w-[210px] border-r border-slate-200 dark:border-[#145447]">
                      ASSIGNED ROOM
                    </th>
                    <th className="py-2.5 px-3 text-center w-16 border-r border-slate-200 dark:border-[#145447]">
                      GUEST
                    </th>
                    <th className="py-2.5 px-3 text-center min-w-[110px] border-r border-slate-200 dark:border-[#145447]">
                      AMOUNT (RS.)
                    </th>
                    <th className="py-2.5 px-3 text-center w-16 border-r border-slate-200 dark:border-[#145447]">
                      NIGHT
                    </th>
                    <th className="py-2.5 px-3 text-center min-w-[110px] border-r border-slate-200 dark:border-[#145447]">
                      DISCOUNT (RS.)
                    </th>
                    <th className="py-2.5 px-4 text-right min-w-[120px]">
                      T. AMOUNT (RS.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#145447]">
                  <tr>
                    {/* Serial */}
                    <td className="py-3.5 px-3 text-center text-slate-500 font-medium border-r border-slate-200 dark:border-[#145447]">
                      1
                    </td>

                    {/* Room Category */}
                    <td className="py-3.5 px-4 border-r border-slate-200 dark:border-[#145447]">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {selectedRoomObj.type}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedRoomObj.acType} · {selectedRoomObj.bedType}
                      </div>
                    </td>

                    {/* Assigned Room (Fixed / Read-Only as room is already selected) */}
                    <td className="py-3.5 px-4 border-r border-slate-200 dark:border-[#145447]">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#C5D5CC] dark:border-[#145447] bg-[#F4F7F5] dark:bg-[#06241D] text-xs font-bold text-[#0B3D32] dark:text-emerald-300 shadow-2xs">
                        <Bed className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                        <span>Room {selectedRoomObj.number} ({selectedRoomObj.floorLevel})</span>
                      </div>
                    </td>

                    {/* Guest Count */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-[#145447]">
                      {adultsCount + childrenCount}
                    </td>

                    {/* Amount per night (Editable) */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-[#145447]">
                      <input
                        type="number"
                        min={0}
                        value={customRate}
                        onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value) || 0))}
                        className="w-24 text-center font-bold px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                      />
                    </td>

                    {/* Nights */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-[#145447]">
                      {nights}
                    </td>

                    {/* Discount (Editable) */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-[#145447]">
                      <input
                        type="number"
                        min={0}
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-20 text-center font-medium px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                      Rs. {totalPayable.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notification Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                />
                <span>Send SMS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                />
                <span>Send Email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printRegCard}
                  onChange={(e) => setPrintRegCard(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                />
                <span>Print Registration Card on Save</span>
              </label>
            </div>

            {/* Bottom Split: Remarks (Left) & Accounting / Payment (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
              {/* Left Column: Special Notes / Remarks */}
              <div className="lg:col-span-7 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Special Notes / Remarks
                </label>
                <textarea
                  rows={4}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] resize-none"
                />
              </div>

              {/* Right Column: Financial Breakdown & Payment (Compact & Balanced) */}
              <div className="lg:col-span-5 space-y-2.5 font-sans max-w-sm ml-auto w-full">
                {/* Options: Pay later / Advance payment / Full payment */}
                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200 dark:border-[#145447]">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentChoice === 'LATER'}
                      onChange={() => {
                        setPaymentChoice('LATER');
                        setAdvancedAmount(0);
                      }}
                      className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                    />
                    <span>Pay later</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentChoice === 'ADVANCE'}
                      onChange={() => {
                        setPaymentChoice('ADVANCE');
                        const defaultAdv = Math.min(2000, totalPayable);
                        setAdvancedAmount(defaultAdv > 0 ? defaultAdv : Math.round(totalPayable / 2));
                      }}
                      className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                    />
                    <span>Advance payment</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="paymentChoice"
                      checked={paymentChoice === 'FULL'}
                      onChange={() => {
                        setPaymentChoice('FULL');
                        setAdvancedAmount(totalPayable);
                      }}
                      className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] cursor-pointer"
                    />
                    <span>Full payment</span>
                  </label>
                </div>

                {/* Billing & Payment Table (Compact & Structured) */}
                <div className="border border-slate-200 dark:border-[#145447] rounded-lg overflow-hidden bg-white dark:bg-[#071F1A]">
                  <table className="w-full text-xs table-fixed">
                    <tbody className="divide-y divide-slate-200 dark:divide-[#145447]">
                      {/* Subtotal */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                        <td className="w-1/2 py-2 px-3 text-slate-600 dark:text-slate-400 font-medium border-r border-slate-200 dark:border-[#145447]">
                          Subtotal
                        </td>
                        <td className="w-1/2 py-2 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                          Rs. {subtotal.toLocaleString()}
                        </td>
                      </tr>

                      {/* Total Payable */}
                      <tr className="bg-[#FAFBF9] dark:bg-[#061B16] font-bold">
                        <td className="w-1/2 py-2 px-3 text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#145447]">
                          Total Payable
                        </td>
                        <td className="w-1/2 py-2 px-3 text-right text-sm text-[#0B3D32] dark:text-emerald-400 tabular-nums">
                          Rs. {totalPayable.toLocaleString()}
                        </td>
                      </tr>

                      {/* Payment Fields based on Choice */}
                      {paymentChoice !== 'LATER' ? (
                        <>
                          {/* Amount Received / Advanced Amount */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                            <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                              {paymentChoice === 'FULL' ? 'Amount Received' : 'Advanced Amount'} <span className="text-emerald-600 font-bold">*</span>
                            </td>
                            <td className="w-1/2 py-1.5 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={totalPayable}
                                value={advancedAmount}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setAdvancedAmount(val);
                                  if (val >= totalPayable && paymentChoice === 'ADVANCE') {
                                    setPaymentChoice('FULL');
                                  }
                                }}
                                className="w-28 text-right font-bold px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                              />
                            </td>
                          </tr>

                          {/* Due Amount */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                            <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                              Due Amount
                            </td>
                            <td className="w-1/2 py-2 px-3 text-right">
                              <span
                                className={cn(
                                  'inline-block font-bold px-2 py-0.5 rounded text-xs tabular-nums',
                                  dueAmount === 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                                )}
                              >
                                Rs. {dueAmount.toLocaleString()}
                              </span>
                            </td>
                          </tr>

                          {/* Payment Method */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                            <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                              Payment Method
                            </td>
                            <td className="w-1/2 py-1.5 px-3 text-right">
                              <div className="relative inline-block w-36">
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="w-full appearance-none px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#0B3D32] cursor-pointer pr-6 text-left"
                                >
                                  <option value="CASH">Cash at Desk</option>
                                  <option value="CARD">Credit / Debit Card</option>
                                  <option value="UPI_QR">Mobile Banking / QR</option>
                                  <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                                  <option value="BANK_TRANSFER">Bank Transfer</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          {/* Due Amount when Pay Later */}
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                            <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                              Due Amount
                            </td>
                            <td className="w-1/2 py-2 px-3 text-right">
                              <span className="inline-block font-bold px-2 py-0.5 rounded text-xs tabular-nums bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                                Rs. {totalPayable.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="py-2 px-3 text-[11px] text-slate-500 dark:text-neutral-400 italic bg-[#FAFBF9] dark:bg-[#061B16]">
                              Payment will be collected and settled upon arrival or checkout.
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action Button: Only Save Booking */}
                <div className="flex items-center justify-end pt-2.5">
                  <button
                    type="button"
                    onClick={() => handleSaveBooking(false)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0B3D32] hover:bg-[#07241E] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Booking</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          PRINTABLE GUEST REGISTRATION CARD (Reg Card Modal)
          ----------------------------------------------------------------------- */}
      {selectedBookingForRegCard && (() => {
        const b = selectedBookingForRegCard;
        const fin = getBookingFinancials(b);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={handleCloseRegCardModal}
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
                  <p>
                    <strong>Hotel Terms:</strong> Check-out time is 11:00 AM. Key cards must be returned upon departure. Smoking is strictly prohibited inside the room. The management is not responsible for valuables left unattended in rooms.
                  </p>
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
                  onClick={handleCloseRegCardModal}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close & Proceed
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

export default function QuickBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Quick Room Booking...
        </div>
      }
    >
      <NewRoomBookingContent />
    </Suspense>
  );
}

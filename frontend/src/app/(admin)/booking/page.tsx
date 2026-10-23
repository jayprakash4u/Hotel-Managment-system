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
  ShieldCheck,
  Luggage,
  UserCheck,
  UploadCloud,
  FileCheck,
  Trash2,
  Plus,
  Receipt,
  UserPlus,
  CheckCircle2,
  Sparkles,
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
  AccompanyingGuest,
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

const ID_DOCUMENT_TYPES = [
  'Citizenship Card',
  'Passport',
  'Driving License',
  'National ID Card',
  'Voter ID Card',
  'PAN Card',
  'Diplomatic / Official ID',
];

const NATIONALITY_OPTIONS = [
  'Nepal',
  'India',
  'United States',
  'United Kingdom',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'China',
  'Japan',
  'Other / International',
];

const PURPOSE_OF_VISIT_OPTIONS = [
  'Tourism / Leisure',
  'Business / Corporate',
  'Transit / Airport Layover',
  'Conference / Seminar',
  'Family / Social Event',
  'Medical / Health',
  'Official / Diplomatic',
  'Other',
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
  const paramMode = searchParams.get('mode');
  const fromParam = searchParams.get('from');

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [registeredGuests] = useState<RegisteredGuest[]>(() => loadRegisteredGuests());

  // ---------------------------------------------------------------------------
  // 0. FORM MODE: 'BOOKING' (Quick Book Now) vs 'CHECK_IN' (Full Check-In Desk)
  // ---------------------------------------------------------------------------
  const [formMode, setFormMode] = useState<'BOOKING' | 'CHECK_IN'>(() => {
    if (paramBookingId || fromParam === 'check-in' || paramMode === 'walkin' || paramMode === 'walk-in' || paramMode === 'checkin') {
      return 'CHECK_IN';
    }
    return 'BOOKING';
  });

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
  // 2. GUEST DETAILS & KYC STATE (Includes extended check-in fields)
  // ---------------------------------------------------------------------------
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');
  const [showGuestSuggestions, setShowGuestSuggestions] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('Ram Sharma');
  const [guestPhone, setGuestPhone] = useState<string>('+977 9841234567');
  const [guestEmail, setGuestEmail] = useState<string>('ram.sharma@gmail.com');
  const [guestNationality, setGuestNationality] = useState<string>('Nepal');
  const [guestAddress, setGuestAddress] = useState<string>('New Baneshwor, Kathmandu');
  const [guestCity, setGuestCity] = useState<string>('Kathmandu');

  // KYC Fields (Identification)
  const [idType, setIdType] = useState<string>('Citizenship Card');
  const [idNumber, setIdNumber] = useState<string>('27-01-72-0451');
  const [idIssuePlace, setIdIssuePlace] = useState<string>('Kathmandu');
  const [idIssueDate, setIdIssueDate] = useState<string>('');
  const [idExpiryDate, setIdExpiryDate] = useState<string>('');
  const [idDocumentImage, setIdDocumentImage] = useState<string | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(true);

  // Accompanying Guests & Travel Purpose
  const [purposeOfVisit, setPurposeOfVisit] = useState<string>('Tourism / Leisure');
  const [arrivedFrom, setArrivedFrom] = useState<string>('');
  const [proceedingTo, setProceedingTo] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [accompanyingGuests, setAccompanyingGuests] = useState<AccompanyingGuest[]>([]);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccAge, setNewAccAge] = useState<string>('');
  const [newAccGender, setNewAccGender] = useState<string>('M');
  const [newAccRelation, setNewAccRelation] = useState<string>('Spouse');

  // Key Card & Luggage
  const [keyCardNumber, setKeyCardNumber] = useState<string>('KC-101-A');
  const [luggageCount, setLuggageCount] = useState<number>(1);

  // Existing Reservation Search & Auto-Fill (when in Check-In mode)
  const [resSearchQuery, setResSearchQuery] = useState<string>('');
  const [showResSuggestions, setShowResSuggestions] = useState<boolean>(false);
  const [linkedBooking, setLinkedBooking] = useState<RoomBooking | null>(null);
  const [advancePaidAtBooking, setAdvancePaidAtBooking] = useState<number>(0);
  const [advanceReceiptInfo, setAdvanceReceiptInfo] = useState<string>('');

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

  // Reservation Search for Auto-Fill
  const reservationSearchResults = useMemo(() => {
    if (!resSearchQuery.trim()) return [];
    const q = resSearchQuery.toLowerCase().trim();
    return bookings.filter((b) => {
      const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        b.guest.phone.toLowerCase().includes(q) ||
        b.room.number.toLowerCase().includes(q)
      );
    });
  }, [bookings, resSearchQuery]);

  const handleSelectReservationToAutoFill = (b: RoomBooking) => {
    setLinkedBooking(b);
    setGuestName(`${b.guest.firstName} ${b.guest.lastName}`.trim());
    setGuestPhone(b.guest.phone || '');
    setGuestEmail(b.guest.email || '');
    setGuestAddress(b.guest.address || 'Kathmandu, Nepal');
    setGuestNationality(b.guest.country || 'Nepal');
    if (b.guest.city) setGuestCity(b.guest.city);
    if (b.guest.idType && b.guest.idType !== 'Citizenship') setIdType(b.guest.idType);
    if (b.guest.idNumber && !b.guest.idNumber.toLowerCase().includes('to be collected')) {
      setIdNumber(b.guest.idNumber);
    }
    setCheckInDate(b.checkIn);
    setCheckOutDate(b.checkOut);
    setSelectedRoomId(b.room.id);
    setCustomRate(b.room.pricePerNight);
    setKeyCardNumber(b.keyCardNumber || `KC-${b.room.number}-A`);
    if (b.guest.accompanyingGuests) setAccompanyingGuests(b.guest.accompanyingGuests);

    // Calculate advance paid
    const fin = getBookingFinancials(b);
    const totalPaid = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
    setAdvancePaidAtBooking(totalPaid || fin.totalPaid || 0);
    if (b.payments && b.payments[0]) {
      setAdvanceReceiptInfo(`Receipt: ${b.payments[0].receiptNo} (${b.payments[0].method})`);
    }

    setResSearchQuery('');
    setShowResSuggestions(false);

    toast.info(
      'Reservation Auto-Filled!',
      `Loaded booking ${b.bookingCode} for ${b.guest.firstName} ${b.guest.lastName}. Advance paid: Rs. ${(totalPaid || fin.totalPaid || 0).toLocaleString()}.`
    );
  };

  // Add / Remove Accompanying Guest
  const handleAddAccompanyingGuest = () => {
    if (!newAccName.trim()) {
      toast.error('Name Required', 'Please enter accompanying guest name.');
      return;
    }
    const newGuest: AccompanyingGuest = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      age: newAccAge ? Number(newAccAge) : undefined,
      gender: newAccGender,
      relation: newAccRelation,
    };
    setAccompanyingGuests([...accompanyingGuests, newGuest]);
    setNewAccName('');
    setNewAccAge('');
    setAdultsCount((prev) => prev + 1);
    toast.success('Guest Added', `${newGuest.name} added to accompanying manifest.`);
  };

  const handleRemoveAccompanyingGuest = (id?: string) => {
    setAccompanyingGuests(accompanyingGuests.filter((g) => g.id !== id));
    setAdultsCount((prev) => Math.max(1, prev - 1));
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
      setKeyCardNumber(`KC-${selectedRoomObj.number}-A`);
    }
  }, [selectedRoomObj]);

  // Compute Subtotal & Total Payable
  const subtotal = useMemo(() => {
    return (Number(customRate) || 0) * nights;
  }, [customRate, nights]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0));
  }, [subtotal, discount]);

  // Remaining Balance Due after advance
  const remainingDue = useMemo(() => {
    return Math.max(0, totalPayable - advancePaidAtBooking);
  }, [totalPayable, advancePaidAtBooking]);

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
    if (formMode === 'CHECK_IN' && advancePaidAtBooking > 0) {
      if (paymentChoice === 'FULL') {
        setAdvancedAmount(remainingDue);
      } else if (paymentChoice === 'LATER') {
        setAdvancedAmount(0);
      }
    } else {
      if (paymentChoice === 'FULL') {
        setAdvancedAmount(totalPayable);
      } else if (paymentChoice === 'LATER') {
        setAdvancedAmount(0);
      } else {
        setAdvancedAmount((prev) => (prev > totalPayable ? totalPayable : prev === 0 ? Math.min(2000, totalPayable) : prev));
      }
    }
  }, [totalPayable, paymentChoice, formMode, remainingDue, advancePaidAtBooking]);

  const dueAmount = useMemo(() => {
    if (paymentChoice === 'LATER') return remainingDue;
    return Math.max(0, remainingDue - (Number(advancedAmount) || 0));
  }, [remainingDue, advancedAmount, paymentChoice]);

  // Registration Card Modal state
  const [selectedBookingForRegCard, setSelectedBookingForRegCard] = useState<RoomBooking | null>(null);

  // Pre-fill if editing an existing booking or check-in param
  useEffect(() => {
    if (paramBookingId) {
      const b = bookings.find((item) => item.id === paramBookingId);
      if (b) {
        handleSelectReservationToAutoFill(b);
        setFormMode('CHECK_IN');
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

  // Reset form
  const handleResetForm = () => {
    setLinkedBooking(null);
    setAdvancePaidAtBooking(0);
    setAdvanceReceiptInfo('');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setBookingNotes('');
    setIdNumber('');
    setAccompanyingGuests([]);
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
    toast.info('Form Reset', 'All booking & check-in fields have been cleared.');
  };

  // ---------------------------------------------------------------------------
  // SAVE BOOKING OR CHECK IN
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
    if (shouldCheckInNow && !idNumber.trim()) {
      toast.error('ID Required', 'Check-in requires a valid ID document number (Citizenship / Passport / License).');
      return;
    }

    const [first, ...rest] = guestName.trim().split(' ');
    const firstName = first || 'Guest';
    const lastName = rest.join(' ') || 'Customer';

    const paidNow = paymentChoice === 'LATER' ? 0 : Math.min(Number(advancedAmount) || 0, totalPayable);

    const paymentRecords: PaymentEntry[] = [...(linkedBooking?.payments || [])];
    if (paidNow > 0) {
      paymentRecords.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${Date.now().toString().slice(-4)}`,
        date: 'Today',
        amount: paidNow,
        method: (paymentMethod === 'PAY_LATER' ? 'CASH' : paymentMethod) as any,
        type: paidNow >= remainingDue ? 'SETTLEMENT' : 'ADVANCE',
        notes: shouldCheckInNow ? 'Check-in desk payment received' : 'Advance deposit received at booking',
      });
    }

    const newBookingId = paramBookingId || linkedBooking?.id || `bk-${Date.now().toString().slice(-4)}`;
    const newBookingCode = linkedBooking?.bookingCode || `BK-${Math.floor(1000 + Math.random() * 9000)}`;

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
        id: linkedBooking?.guest.id || `gst-${Date.now()}`,
        firstName,
        lastName,
        phone: guestPhone.trim(),
        email: guestEmail.trim() || `${guestPhone.trim()}@guest.hotel`,
        address: guestAddress,
        city: guestCity,
        country: guestNationality,
        idType,
        idNumber: idNumber.trim() || 'To be collected at check-in',
        idIssuePlace,
        idIssueDate,
        idExpiryDate,
        idDocumentImage: idDocumentImage || undefined,
        purposeOfVisit,
        arrivedFrom,
        proceedingTo,
        vehicleNumber,
        accompanyingGuests,
        vipTier: linkedBooking?.guest.vipTier || 'STANDARD',
      },
      cafeOrders: linkedBooking?.cafeOrders || [],
      payments: paymentRecords,
      bookingHistory: linkedBooking?.bookingHistory || [],
      notes: bookingNotes.trim() || undefined,
      keyCardNumber,
      luggageCount,
    };

    let updated: RoomBooking[];
    if (currentBookings.some((b) => b.id === newBookingId)) {
      updated = currentBookings.map((b) => (b.id === newBookingId ? bookingPayload : b));
    } else {
      updated = [bookingPayload, ...currentBookings];
    }

    setBookings(updated);
    saveBookingsToStorage(updated);

    if (printRegCard) {
      setSelectedBookingForRegCard(bookingPayload);
      if (shouldCheckInNow) {
        toast.celebrate('Guest Checked In!', `Room ${selectedRoomObj.number} assigned to ${guestName.trim()}. Key Card ${keyCardNumber} issued.`);
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
    <div className="space-y-4 max-w-6xl mx-auto pb-16 select-none font-sans text-slate-800 dark:text-slate-100">
      {/* Front Desk Category Option Boxes */}
      <FrontDeskNavBoxes activeId={activeNavBoxId} />

      {/* Main Booking Container Card */}
      <div className="bg-white dark:bg-[#071F1A] rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                {formMode === 'CHECK_IN' ? 'Guest Check-In' : 'New Room Booking'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formMode === 'CHECK_IN'
                  ? 'Verify guest details, assign room key, and settle payment'
                  : 'Reserve a room, schedule stay dates, and enter guest details'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] p-0.5">
              <button
                type="button"
                onClick={() => setFormMode('BOOKING')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  formMode === 'BOOKING'
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Now</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/check-in')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  formMode === 'CHECK_IN'
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Check-In Desk</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-[#F2F6F4]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* SEARCH RESERVATION BAR (Shown in Check-In Mode) */}
          {formMode === 'CHECK_IN' && (
            <div className="space-y-2 max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={resSearchQuery}
                  onChange={(e) => {
                    setResSearchQuery(e.target.value);
                    setShowResSuggestions(true);
                  }}
                  onFocus={() => setShowResSuggestions(true)}
                  placeholder="Search reservation by code, guest name, phone, or room..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0B3D32] focus:bg-white dark:focus:bg-[#071F1A] transition-all"
                />
                {resSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setResSearchQuery('');
                      setShowResSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {showResSuggestions && reservationSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden divide-y divide-[#E5EEE9] dark:divide-[#145447] max-h-60 overflow-y-auto">
                    {reservationSearchResults.map((b) => {
                      const fin = getBookingFinancials(b);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleSelectReservationToAutoFill(b)}
                          className="p-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{b.guest.firstName} {b.guest.lastName}</span>
                              <span className="font-mono text-slate-400">({b.bookingCode})</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Room {b.room.number}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {b.guest.phone} · {b.checkIn} to {b.checkOut} ({b.nights}n)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800 dark:text-white block">
                              Rs. {fin.totalCharges.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 block">
                              {fin.totalPaid > 0 ? `Adv Paid: Rs. ${fin.totalPaid.toLocaleString()}` : 'No Advance'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

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

              {/* Adults & Children Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Adults
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={adultsCount}
                    onChange={(e) => setAdultsCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Physical Key Card Assignment in Check-In Mode */}
              {formMode === 'CHECK_IN' && (
                <div className="p-3 bg-slate-50 dark:bg-[#061B16] rounded border border-[#DCE3DF] dark:border-[#145447] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Card #</span>
                    </label>
                    <input
                      type="text"
                      value={keyCardNumber}
                      onChange={(e) => setKeyCardNumber(e.target.value)}
                      placeholder="e.g. KC-101-A"
                      className="w-full px-2 py-1.5 font-mono font-bold text-xs rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                      <Luggage className="w-3.5 h-3.5 text-slate-500" />
                      <span>Luggage Pieces</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={luggageCount}
                      onChange={(e) => setLuggageCount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1.5 font-mono font-bold text-xs rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Guest Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                  Guest Information
                </span>
              </div>

              {/* Guest Fields: Name, Phone & Email */}
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

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Nationality / Country
                  </label>
                  <select
                    value={guestNationality}
                    onChange={(e) => setGuestNationality(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  >
                    {NATIONALITY_OPTIONS.map((nat) => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================================
              SECTION 1.5: MANDATORY IDENTIFICATION & KYC (Expanded Check-In)
              =============================================================== */}
          {formMode === 'CHECK_IN' && (
            <div className="space-y-4 border-b border-slate-100 dark:border-[#145447] pb-8 bg-emerald-50/30 dark:bg-[#061B16] p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#A51F36] dark:text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Mandatory Guest Identification & KYC Document
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200">
                  Required for Check-In
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ID Document Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#071F1A] text-xs font-medium text-slate-900 dark:text-white outline-none"
                  >
                    {ID_DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ID Document Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 27-01-72-0451 or PA-908123"
                    className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#071F1A] text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Place of Issue / Authority
                  </label>
                  <input
                    type="text"
                    value={idIssuePlace}
                    onChange={(e) => setIdIssuePlace(e.target.value)}
                    placeholder="e.g. DAO Kathmandu"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#071F1A] text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Document Scan / File Preview */}
              <div className="p-3 bg-white dark:bg-[#071F1A] rounded border border-dashed border-[#DCE3DF] dark:border-[#145447] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ID Document Scan Attachment:
                  </span>
                  {idDocumentImage ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> Attached
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No document attached</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdDocumentImage('attached');
                      toast.success('Document Attached', 'Citizenship scan sample attached.');
                    }}
                    className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-white cursor-pointer"
                  >
                    + Sample ID Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdDocumentImage('passport');
                      toast.success('Document Attached', 'Passport page sample attached.');
                    }}
                    className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-white cursor-pointer"
                  >
                    + Sample Passport
                  </button>
                </div>
              </div>

              {/* Accompanying Guests Dynamic List */}
              <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Accompanying Secondary Guests ({accompanyingGuests.length}):
                </span>
                {accompanyingGuests.length > 0 && (
                  <div className="space-y-1">
                    {accompanyingGuests.map((acc, idx) => (
                      <div
                        key={acc.id || idx}
                        className="flex items-center justify-between p-2 rounded bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] text-xs"
                      >
                        <span>
                          {idx + 1}. <strong>{acc.name}</strong> ({acc.relation || 'Guest'} · Age: {acc.age || 'N/A'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccompanyingGuest(acc.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="Accompanying Guest Full Name"
                    className="h-8 px-2.5 text-xs rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] dark:text-white flex-1 min-w-[140px]"
                  />
                  <input
                    type="number"
                    value={newAccAge}
                    onChange={(e) => setNewAccAge(e.target.value)}
                    placeholder="Age"
                    className="h-8 w-16 px-2 text-xs rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] dark:text-white"
                  />
                  <select
                    value={newAccRelation}
                    onChange={(e) => setNewAccRelation(e.target.value)}
                    className="h-8 px-2 text-xs rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] dark:text-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAccompanyingGuest}
                    className="h-8 px-3 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all dark:bg-emerald-600 cursor-pointer"
                  >
                    + Add Guest
                  </button>
                </div>
              </div>
            </div>
          )}

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

            {/* Structured Table - Clean, Simple & Professional like Reference Grid */}
            <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071F1A]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F4F6F8] dark:bg-[#0a231c] text-xs font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-12 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      SL.
                    </th>
                    <th className="py-2 px-3 min-w-[170px] border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ROOM CATEGORY
                    </th>
                    <th className="py-2 px-3 min-w-[210px] border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ASSIGNED ROOM
                    </th>
                    <th className="py-2 px-2.5 text-center w-16 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      GUEST
                    </th>
                    <th className="py-2 px-3 text-right w-28 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      AMOUNT (RS.)
                    </th>
                    <th className="py-2 px-2.5 text-center w-16 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      NIGHT
                    </th>
                    <th className="py-2 px-3 text-right w-28 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      DISCOUNT (RS.)
                    </th>
                    <th className="py-2 px-3 text-right w-32 font-semibold text-slate-700 dark:text-slate-200">
                      T. AMOUNT (RS.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-[#071F1A]">
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                    {/* Serial */}
                    <td className="py-1.5 px-2.5 text-center text-slate-600 dark:text-slate-400 font-normal border-r border-slate-300 dark:border-slate-700">
                      1
                    </td>

                    {/* Room Category */}
                    <td className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-normal">
                        {selectedRoomObj.type}
                      </div>
                    </td>

                    {/* Assigned Room */}
                    <td className="py-1.5 px-2 border-r border-slate-300 dark:border-slate-700">
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xs bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer"
                      >
                        {AVAILABLE_ROOMS_CATALOG.map((r) => (
                          <option key={r.id} value={r.id}>
                            Room {r.number}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Guest Count */}
                    <td className="py-1.5 px-2.5 text-center text-xs text-slate-700 dark:text-slate-300 font-normal border-r border-slate-300 dark:border-slate-700">
                      {adultsCount + childrenCount}
                    </td>

                    {/* Amount per night (Editable with soft gray box matching reference Rate) */}
                    <td className="py-1.5 px-2 border-r border-slate-300 dark:border-slate-700">
                      <input
                        type="number"
                        min={0}
                        value={customRate}
                        onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-7 px-2 text-right font-mono text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xs outline-none focus:bg-white dark:focus:bg-[#071F1A] focus:border-slate-400"
                      />
                    </td>

                    {/* Nights */}
                    <td className="py-1.5 px-2.5 text-center text-xs text-slate-800 dark:text-slate-200 font-normal border-r border-slate-300 dark:border-slate-700">
                      {nights}
                    </td>

                    {/* Discount (Editable) */}
                    <td className="py-1.5 px-2 border-r border-slate-300 dark:border-slate-700">
                      <input
                        type="number"
                        min={0}
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xs outline-none focus:border-slate-400"
                      />
                    </td>

                    {/* Total Amount (Soft gray box matching reference Amount) */}
                    <td className="py-1.5 px-2 text-right">
                      <div className="w-full h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xs tabular-nums">
                        {totalPayable.toLocaleString()}
                      </div>
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
          </div>

          {/* ===============================================================
              SECTION 3: REMARKS & BILLING / ADVANCE RECONCILIATION
              =============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-slate-100 dark:border-[#145447] pt-8">
            {/* Left: Remarks */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                  Remarks / Special Requests
                </span>
              </div>
              <textarea
                rows={4}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Airport pickup, high floor requested, dietary preferences..."
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Right: Structured Billing & Advance Reconcile Table */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                  Billing & Settlement
                </span>
              </div>

              {/* Billing Table */}
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

                    {/* Total Room Charges */}
                    <tr className="bg-[#FAFBF9] dark:bg-[#061B16] font-bold">
                      <td className="w-1/2 py-2 px-3 text-slate-900 dark:text-white border-r border-slate-200 dark:border-[#145447]">
                        Total Room Charges
                      </td>
                      <td className="w-1/2 py-2 px-3 text-right text-sm text-[#0B3D32] dark:text-emerald-400 tabular-nums">
                        Rs. {totalPayable.toLocaleString()}
                      </td>
                    </tr>

                    {/* ADVANCE PAID AT BOOKING (Highlighted in Emerald when advance exists) */}
                    {advancePaidAtBooking > 0 && (
                      <tr className="bg-emerald-50/70 dark:bg-emerald-950/40">
                        <td className="w-1/2 py-2 px-3 text-emerald-800 dark:text-emerald-300 font-bold border-r border-slate-200 dark:border-[#145447] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Advance Paid at Booking</span>
                        </td>
                        <td className="w-1/2 py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          - Rs. {advancePaidAtBooking.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* REMAINING DUE AMOUNT */}
                    {advancePaidAtBooking > 0 && (
                      <tr className="font-bold">
                        <td className="w-1/2 py-2 px-3 text-slate-800 dark:text-white border-r border-slate-200 dark:border-[#145447]">
                          Remaining Balance Due
                        </td>
                        <td className="w-1/2 py-2 px-3 text-right text-amber-700 dark:text-amber-400 tabular-nums">
                          Rs. {remainingDue.toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Payment Strategy Choice */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                      <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                        Payment Option
                      </td>
                      <td className="w-1/2 py-1.5 px-3 text-right">
                        <div className="inline-flex gap-2 text-xs">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="payOption"
                              checked={paymentChoice === 'FULL'}
                              onChange={() => setPaymentChoice('FULL')}
                              className="accent-[#0B3D32]"
                            />
                            <span>{formMode === 'CHECK_IN' ? 'Pay Balance' : 'Pay Full'}</span>
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="payOption"
                              checked={paymentChoice === 'ADVANCE'}
                              onChange={() => setPaymentChoice('ADVANCE')}
                              className="accent-[#0B3D32]"
                            />
                            <span>Advance</span>
                          </label>
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="payOption"
                              checked={paymentChoice === 'LATER'}
                              onChange={() => setPaymentChoice('LATER')}
                              className="accent-[#0B3D32]"
                            />
                            <span>Pay Later</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {paymentChoice !== 'LATER' && (
                      <>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                          <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                            Amount Collected Now <span className="text-emerald-600 font-bold">*</span>
                          </td>
                          <td className="w-1/2 py-1.5 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={advancedAmount}
                              onChange={(e) => setAdvancedAmount(Math.max(0, Number(e.target.value) || 0))}
                              className="w-32 text-right font-bold px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                            />
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                          <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                            Due Amount at Checkout
                          </td>
                          <td className="w-1/2 py-2 px-3 text-right">
                            <span
                              className={cn(
                                'inline-block font-bold px-2 py-0.5 rounded text-xs tabular-nums',
                                dueAmount > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                              )}
                            >
                              Rs. {dueAmount.toLocaleString()}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                          <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                            Payment Method
                          </td>
                          <td className="w-1/2 py-1.5 px-3 text-right">
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-36 text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none"
                            >
                              <option value="CASH">Cash</option>
                              <option value="CARD">Credit / Debit Card</option>
                              <option value="UPI_QR">UPI / Fonepay QR</option>
                              <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons: Save Booking vs Check In */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-[#145447] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Reset
                </button>

                {formMode === 'CHECK_IN' ? (
                  <button
                    type="button"
                    onClick={() => handleSaveBooking(true)}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-md bg-[#0B3D32] hover:bg-[#07241E] text-white text-xs font-bold cursor-pointer transition-all shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Complete Check-In & Issue Key</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveBooking(false)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0B3D32] hover:bg-[#07241E] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Booking (Hold Room)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMode('CHECK_IN')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#0B3D32] text-[#0B3D32] hover:bg-emerald-50 text-xs font-bold cursor-pointer transition-all dark:border-emerald-500 dark:text-emerald-400"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Check In Now →</span>
                    </button>
                  </>
                )}
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
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs"
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
                  Guest Registration Card (KYC Verified)
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
                    <span className="text-slate-500 text-[10px] block uppercase">Assigned Room & Key:</span>
                    <strong className="text-sm">
                      Room {b.room.number} ({b.room.type}) · Key: {b.keyCardNumber || `KC-${b.room.number}`}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Guest Full Name:</span>
                    <strong className="text-sm">{b.guest.firstName} {b.guest.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Phone & ID:</span>
                    <strong className="font-mono">
                      {b.guest.phone} · {b.guest.idType || 'ID'}: {b.guest.idNumber || 'Verified'}
                    </strong>
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
                    <span className="text-slate-500 text-[10px] block uppercase">Total Charges:</span>
                    <strong>Rs. {fin.totalCharges.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Total Paid / Advance:</span>
                    <strong className="text-emerald-700">Rs. {fin.totalPaid.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Balance Due:</span>
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

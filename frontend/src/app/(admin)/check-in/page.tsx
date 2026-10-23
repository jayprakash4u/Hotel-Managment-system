'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
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
  FileText,
  AlertCircle,
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
  performCheckIn,
  performDirectCheckIn,
  AccompanyingGuest,
} from '../reservations/reservationsData';

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

function CheckInDeskContent() {
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

  // Reload bookings on focus
  useEffect(() => {
    const handleFocus = () => setBookings(loadBookingsFromStorage());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // View: 'FORM' (The Check-In Form) vs 'MANIFEST' (Arrivals Manifest List)
  const [activeTab, setActiveTab] = useState<'FORM' | 'MANIFEST'>('FORM');

  // ---------------------------------------------------------------------------
  // 1. SEARCH EXISTING RESERVATION / BOOK NOW TO AUTO-FILL
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [linkedBooking, setLinkedBooking] = useState<RoomBooking | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return bookings.filter((b) => {
      const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        b.guest.phone.toLowerCase().includes(q) ||
        b.room.number.toLowerCase().includes(q)
      );
    });
  }, [bookings, searchQuery]);

  // Expected arrivals today for quick-pick chips
  const expectedArrivalsToday = useMemo(() => {
    return bookings.filter((b) => b.status === 'RESERVED' && b.checkIn <= todayStr);
  }, [bookings, todayStr]);

  // ---------------------------------------------------------------------------
  // 2. STAY SCHEDULE STATE
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
  // 3. GUEST DETAILS & KYC VERIFICATION STATE
  // ---------------------------------------------------------------------------
  const [guestName, setGuestName] = useState<string>('Ram Sharma');
  const [guestPhone, setGuestPhone] = useState<string>('+977 9841234567');
  const [guestEmail, setGuestEmail] = useState<string>('ram.sharma@gmail.com');
  const [guestNationality, setGuestNationality] = useState<string>('Nepal');
  const [guestAddress, setGuestAddress] = useState<string>('New Baneshwor, Kathmandu');
  const [guestCity, setGuestCity] = useState<string>('Kathmandu');

  // KYC Fields
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

  // Key Card & Luggage Allocation
  const [keyCardNumber, setKeyCardNumber] = useState<string>('KC-101-A');
  const [luggageCount, setLuggageCount] = useState<number>(1);

  // ---------------------------------------------------------------------------
  // 4. ROOM INFORMATION TABLE STATE (Exact match of Book Now)
  // ---------------------------------------------------------------------------
  const [selectedRoomId, setSelectedRoomId] = useState<string>(paramRoomId || 'rm-101');

  const selectedRoomObj: AvailableRoomOption = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS_CATALOG[0];
  }, [selectedRoomId]);

  const [customRate, setCustomRate] = useState<number>(3500);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    if (selectedRoomObj) {
      setCustomRate(selectedRoomObj.pricePerNight);
      setKeyCardNumber(`KC-${selectedRoomObj.number}-A`);
    }
  }, [selectedRoomObj]);

  const subtotal = useMemo(() => {
    return (Number(customRate) || 0) * nights;
  }, [customRate, nights]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0));
  }, [subtotal, discount]);

  // ---------------------------------------------------------------------------
  // 5. BILLING, ADVANCE PAID AT BOOKING & DESK SETTLEMENT
  // ---------------------------------------------------------------------------
  const [advancePaidAtBooking, setAdvancePaidAtBooking] = useState<number>(0);
  const [advanceReceiptInfo, setAdvanceReceiptInfo] = useState<string>('');

  const remainingBalanceDue = useMemo(() => {
    return Math.max(0, totalPayable - advancePaidAtBooking);
  }, [totalPayable, advancePaidAtBooking]);

  const [paymentChoice, setPaymentChoice] = useState<'FULL' | 'ADVANCE' | 'LATER'>('FULL');
  const [advancedAmount, setAdvancedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  // Notifications & Remarks
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [printRegCard, setPrintRegCard] = useState<boolean>(true);
  const [bookingNotes, setBookingNotes] = useState<string>('');

  // Keep desk collection amount synchronized with remaining balance
  useEffect(() => {
    if (paymentChoice === 'FULL') {
      setAdvancedAmount(remainingBalanceDue);
    } else if (paymentChoice === 'LATER') {
      setAdvancedAmount(0);
    } else {
      setAdvancedAmount((prev) => (prev > remainingBalanceDue ? remainingBalanceDue : prev === 0 ? Math.min(2000, remainingBalanceDue) : prev));
    }
  }, [remainingBalanceDue, paymentChoice]);

  const dueAmountAtCheckout = useMemo(() => {
    if (paymentChoice === 'LATER') return remainingBalanceDue;
    return Math.max(0, remainingBalanceDue - (Number(advancedAmount) || 0));
  }, [remainingBalanceDue, advancedAmount, paymentChoice]);

  // Registration Card Modal State
  const [selectedBookingForRegCard, setSelectedBookingForRegCard] = useState<RoomBooking | null>(null);

  // ---------------------------------------------------------------------------
  // AUTO-FILL HANDLER: Populates All Fields from an Existing Reservation
  // ---------------------------------------------------------------------------
  const handleSelectReservationToAutoFill = (b: RoomBooking) => {
    setLinkedBooking(b);
    setActiveTab('FORM');

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
    if (b.notes) setBookingNotes(b.notes);
    if (b.guest.accompanyingGuests) setAccompanyingGuests(b.guest.accompanyingGuests);

    // Calculate advance paid during booking
    const fin = getBookingFinancials(b);
    const totalPaid = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
    setAdvancePaidAtBooking(totalPaid || fin.totalPaid || 0);
    if (b.payments && b.payments[0]) {
      setAdvanceReceiptInfo(`Receipt #${b.payments[0].receiptNo} (${b.payments[0].method})`);
    }

    setSearchQuery('');
    setShowSearchSuggestions(false);

    toast.info(
      'Reservation Auto-Filled!',
      `Loaded booking ${b.bookingCode} for ${b.guest.firstName} ${b.guest.lastName}. Advance paid: Rs. ${(totalPaid || fin.totalPaid || 0).toLocaleString()}.`
    );
  };

  // URL Query handling: pre-fill if bookingId or roomId param provided
  useEffect(() => {
    if (paramBookingId) {
      const b = bookings.find((item) => item.id === paramBookingId);
      if (b) {
        handleSelectReservationToAutoFill(b);
      }
    } else if (paramRoomId) {
      setSelectedRoomId(paramRoomId);
      const found = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === paramRoomId);
      if (found) {
        setCustomRate(found.pricePerNight);
        setKeyCardNumber(`KC-${found.number}-A`);
      }
    }
  }, [paramBookingId, paramRoomId]);

  // Accompanying guests handlers
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
    toast.success('Guest Added', `${newGuest.name} added to room manifest.`);
  };

  const handleRemoveAccompanyingGuest = (id?: string) => {
    setAccompanyingGuests(accompanyingGuests.filter((g) => g.id !== id));
    setAdultsCount((prev) => Math.max(1, prev - 1));
  };

  // Reset form
  const handleResetForm = () => {
    setLinkedBooking(null);
    setAdvancePaidAtBooking(0);
    setAdvanceReceiptInfo('');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestAddress('');
    setIdNumber('');
    setBookingNotes('');
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
      setKeyCardNumber(`KC-${defRoom.number}-A`);
    }
    setPaymentChoice('FULL');
    setPaymentMethod('CASH');
    toast.info('Form Reset', 'All check-in fields have been cleared.');
  };

  // ---------------------------------------------------------------------------
  // COMPLETE CHECK-IN
  // ---------------------------------------------------------------------------
  const handleCompleteCheckIn = () => {
    if (!guestName.trim()) {
      toast.error('Name Required', 'Please enter guest full legal name.');
      return;
    }
    if (!guestPhone.trim()) {
      toast.error('Phone Required', 'Please enter mobile phone number.');
      return;
    }
    if (!idNumber.trim()) {
      toast.error('ID Required', 'Hotel check-in regulation requires a valid ID document number.');
      return;
    }

    const [first, ...rest] = guestName.trim().split(' ');
    const firstName = first || 'Guest';
    const lastName = rest.join(' ') || 'Customer';

    const paidNow = paymentChoice === 'LATER' ? 0 : Math.min(Number(advancedAmount) || 0, remainingBalanceDue);

    const paymentRecords: PaymentEntry[] = [...(linkedBooking?.payments || [])];
    if (paidNow > 0) {
      paymentRecords.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${Date.now().toString().slice(-4)}`,
        date: 'Today',
        amount: paidNow,
        method: (paymentMethod === 'PAY_LATER' ? 'CASH' : paymentMethod) as any,
        type: paidNow >= remainingBalanceDue ? 'SETTLEMENT' : 'ADVANCE',
        notes: 'Check-in desk payment collected',
      });
    }

    const newBookingId = linkedBooking?.id || `bk-${Date.now().toString().slice(-4)}`;
    const newBookingCode = linkedBooking?.bookingCode || `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentBookings = loadBookingsFromStorage();

    const bookingPayload: RoomBooking = {
      id: newBookingId,
      bookingCode: newBookingCode,
      status: 'CHECKED_IN',
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
        idNumber: idNumber.trim(),
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
      toast.celebrate('Guest Checked In!', `Room ${selectedRoomObj.number} assigned to ${guestName.trim()}. Key Card ${keyCardNumber} issued.`);
    } else {
      toast.celebrate('Guest Checked In!', `Room ${selectedRoomObj.number} assigned to ${guestName.trim()}. Key Card ${keyCardNumber} issued.`);
      setActiveTab('MANIFEST');
    }
  };

  const handleCloseRegCardModal = () => {
    setSelectedBookingForRegCard(null);
    setActiveTab('MANIFEST');
  };

  // Back Navigation
  const handleBackNavigation = () => {
    if (fromParam === 'reservations') {
      router.push('/reservations');
    } else {
      router.push('/front-desk');
    }
  };

  // ---------------------------------------------------------------------------
  // MANIFEST LIST COMPUTATION (For Tab 2)
  // ---------------------------------------------------------------------------
  const [manifestFilter, setManifestFilter] = useState<'ALL' | 'IN_HOUSE' | 'ARRIVALS'>('ARRIVALS');
  const [manifestSearch, setManifestSearch] = useState('');

  const manifestList = useMemo(() => {
    return bookings.filter((b) => {
      if (manifestFilter === 'IN_HOUSE' && b.status !== 'CHECKED_IN') return false;
      if (manifestFilter === 'ARRIVALS' && b.status !== 'RESERVED') return false;

      if (manifestSearch.trim()) {
        const q = manifestSearch.toLowerCase().trim();
        const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesName = fullName.includes(q);
        const matchesRoom = b.room.number.toLowerCase().includes(q);
        const matchesPhone = b.guest.phone.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesRoom && !matchesPhone) return false;
      }

      return true;
    });
  }, [bookings, manifestFilter, manifestSearch]);

  const stats = useMemo(() => {
    const inHouse = bookings.filter((b) => b.status === 'CHECKED_IN').length;
    const pendingToday = bookings.filter((b) => b.checkIn <= todayStr && b.status === 'RESERVED').length;
    return { inHouse, pendingToday };
  }, [bookings, todayStr]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16 select-none font-sans text-slate-800 dark:text-slate-100">
      {/* Front Desk Category Option Boxes */}
      <FrontDeskNavBoxes activeId="check-in" />

      {/* Main Check-In Container Card (Matches Book Now Design Pattern 100%) */}
      <div className="bg-white dark:bg-[#071F1A] rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                Guest Check-In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify guest details, assign room key, and settle payment
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Check-In Form vs Arrivals Manifest */}
            <div className="inline-flex rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  activeTab === 'FORM'
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Check-In Form</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MANIFEST')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  activeTab === 'MANIFEST'
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Arrivals Manifest ({stats.pendingToday})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-[#F2F6F4]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Front Desk</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* VIEW 1: THE CHECK-IN FORM                                           */}
        {/* =================================================================== */}
        {activeTab === 'FORM' && (
          <div className="p-6 lg:p-8 space-y-8">
            {/* SEARCH RESERVATION TO AUTO-FILL (Constrained to clean professional width) */}
            <div className="space-y-2 max-w-xl">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder="Search reservation by code, guest name, phone, or room..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0B3D32] focus:bg-white dark:focus:bg-[#071F1A] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {showSearchSuggestions && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-slate-200 dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-xl overflow-hidden divide-y divide-[#E5EEE9] dark:divide-[#145447] max-h-60 overflow-y-auto">
                    {searchResults.map((b) => {
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
                              {fin.totalPaid > 0 ? `Adv: Rs. ${fin.totalPaid.toLocaleString()}` : 'No Advance'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Linked Reservation Status Banner */}
              {linkedBooking && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-neutral-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs transition-all">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-700 text-white font-mono font-bold text-[11px] tracking-wide shadow-xs">
                        {linkedBooking.bookingCode}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {linkedBooking.guest.firstName} {linkedBooking.guest.lastName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                        · Room <strong className="text-slate-700 dark:text-slate-200">{linkedBooking.room.number}</strong>
                      </span>
                      {advancePaidAtBooking > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] border border-emerald-200/60 dark:border-emerald-700/40">
                          Advance Paid: Rs. {advancePaidAtBooking.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Switch to Direct Walk-In</span>
                  </button>
                </div>
              )}
            </div>

            {/* ===============================================================
                SECTION 1: STAY SCHEDULE & GUEST INFORMATION (5 + 7 Cols)
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

                {/* Key Card & Luggage Assignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Card No.</span>
                    </label>
                    <input
                      type="text"
                      value={keyCardNumber}
                      onChange={(e) => setKeyCardNumber(e.target.value)}
                      placeholder="KC-101"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                      <Luggage className="w-3.5 h-3.5 text-slate-500" />
                      <span>Luggage Pieces</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={luggageCount}
                      onChange={(e) => setLuggageCount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
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
                        placeholder="Mobile number"
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
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                      Nationality
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

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="Street address, city"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>
            </div>

            {/* ===============================================================
                SECTION 2: IDENTIFICATION (KYC) & TRAVEL LOGISTICS (6 + 6 Cols)
                =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-100 dark:border-[#145447] pb-8">
              {/* Left 6 cols: Identification & KYC */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                    Identification (KYC)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ID Document Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
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
                      placeholder="ID number"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Place of Issue / Authority
                  </label>
                  <input
                    type="text"
                    value={idIssuePlace}
                    onChange={(e) => setIdIssuePlace(e.target.value)}
                    placeholder="DAO / Issuing authority"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* ID Document Scan Attachment */}
                <div className="p-3 bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200 dark:border-[#145447] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck className={cn("w-4 h-4 shrink-0", idDocumentImage ? "text-emerald-600" : "text-slate-400")} />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {idDocumentImage ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Attached: {idDocumentImage}
                        </span>
                      ) : (
                        'No ID document attached'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#145447] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#093027] cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                      <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                      <span>Attach</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdDocumentImage(file.name);
                            toast.success('Document Attached', `${file.name} uploaded.`);
                          }
                        }}
                      />
                    </label>
                    {idDocumentImage && (
                      <button
                        type="button"
                        onClick={() => setIdDocumentImage(null)}
                        className="text-rose-600 text-xs font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 6 cols: Travel Logistics & Accompanying Guests */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                    Travel & Accompanying Guests
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                      Purpose of Visit
                    </label>
                    <select
                      value={purposeOfVisit}
                      onChange={(e) => setPurposeOfVisit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    >
                      {PURPOSE_OF_VISIT_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                      Vehicle Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="Vehicle number"
                      className="w-full px-3 py-2 font-mono font-medium rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                      Origin
                    </label>
                    <input
                      type="text"
                      value={arrivedFrom}
                      onChange={(e) => setArrivedFrom(e.target.value)}
                      placeholder="City / Country"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={proceedingTo}
                      onChange={(e) => setProceedingTo(e.target.value)}
                      placeholder="City / Country"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                {/* Accompanying Guests Dynamic List */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Accompanying Secondary Guests ({accompanyingGuests.length})
                    </span>
                  </div>

                  {accompanyingGuests.length > 0 && (
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {accompanyingGuests.map((acc, idx) => (
                        <div
                          key={acc.id || idx}
                          className="flex items-center justify-between p-1.5 px-2.5 rounded bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-xs"
                        >
                          <span className="truncate">
                            {idx + 1}. <strong>{acc.name}</strong> ({acc.relation || 'Guest'} · Age: {acc.age || 'N/A'})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAccompanyingGuest(acc.id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer ml-2 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="Guest name"
                      className="h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white flex-1 min-w-[110px] max-w-[180px] outline-none focus:border-[#0B3D32]"
                    />
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={newAccAge}
                      onChange={(e) => setNewAccAge(e.target.value)}
                      placeholder="Age"
                      className="h-8 w-14 px-2 text-xs rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                    <select
                      value={newAccRelation}
                      onChange={(e) => setNewAccRelation(e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddAccompanyingGuest}
                      className="h-8 px-3 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all dark:bg-emerald-600 cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                SECTION 4: ROOM INFORMATION (Matches Book Now Pattern)
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

                      {/* Assigned Room with Reassignment Dropdown */}
                      <td className="py-3.5 px-4 border-r border-slate-200 dark:border-[#145447]">
                        <select
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="px-2.5 py-1.5 rounded border border-[#C5D5CC] dark:border-[#145447] bg-[#F4F7F5] dark:bg-[#06241D] text-xs font-bold text-[#0B3D32] dark:text-emerald-300 shadow-2xs outline-none"
                        >
                          {AVAILABLE_ROOMS_CATALOG.map((r) => (
                            <option key={r.id} value={r.id}>
                              Room {r.number} ({r.floorLevel}) — {r.type}
                            </option>
                          ))}
                        </select>
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
                  <span>Print Registration Card on Check-In</span>
                </label>
              </div>
            </div>

            {/* ===============================================================
                SECTION 5: REMARKS & BILLING / ADVANCE RECONCILIATION (6 + 6)
                =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-t border-slate-100 dark:border-[#145447] pt-8">
              {/* Left: Remarks */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                    Remarks / Notes
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Special requests or front desk notes..."
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

                      {/* ADVANCE PAID AT BOOKING */}
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

                      {/* REMAINING BALANCE DUE */}
                      {advancePaidAtBooking > 0 && (
                        <tr className="font-bold">
                          <td className="w-1/2 py-2 px-3 text-slate-800 dark:text-white border-r border-slate-200 dark:border-[#145447]">
                            Remaining Balance Due
                          </td>
                          <td className="w-1/2 py-2 px-3 text-right text-amber-700 dark:text-amber-400 tabular-nums">
                            Rs. {remainingBalanceDue.toLocaleString()}
                          </td>
                        </tr>
                      )}

                      {/* Payment Option Selection */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-[#06241D]/30 transition-colors">
                        <td className="w-1/2 py-2 px-3 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-[#145447]">
                          Payment Option
                        </td>
                        <td className="w-1/2 py-1.5 px-3 text-right">
                          <div className="inline-flex gap-2 text-xs">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="payChoice"
                                checked={paymentChoice === 'FULL'}
                                onChange={() => setPaymentChoice('FULL')}
                                className="accent-[#0B3D32]"
                              />
                              <span>Pay Balance</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="payChoice"
                                checked={paymentChoice === 'ADVANCE'}
                                onChange={() => setPaymentChoice('ADVANCE')}
                                className="accent-[#0B3D32]"
                              />
                              <span>Advance</span>
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="payChoice"
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
                              Balance Due at Checkout
                            </td>
                            <td className="w-1/2 py-2 px-3 text-right">
                              <span
                                className={cn(
                                  'inline-block font-bold px-2 py-0.5 rounded text-xs tabular-nums',
                                  dueAmountAtCheckout > 0
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                )}
                              >
                                Rs. {dueAmountAtCheckout.toLocaleString()}
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

                {/* Action Button: Complete Check-In */}
                <div className="flex items-center justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleCompleteCheckIn}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#0B3D32] hover:bg-[#07241E] text-white text-xs font-bold cursor-pointer transition-all shadow-sm hover:shadow dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Complete Check-In & Issue Key</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: ARRIVALS MANIFEST & IN-HOUSE LIST (When Tab is Toggled)     */}
        {/* =================================================================== */}
        {activeTab === 'MANIFEST' && (
          <div className="p-6 lg:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Manifest Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setManifestFilter('ARRIVALS')}
                  className={cn(
                    'px-3 py-1.5 rounded-[3px] text-xs font-semibold cursor-pointer transition-colors',
                    manifestFilter === 'ARRIVALS'
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300'
                  )}
                >
                  Expected Arrivals ({stats.pendingToday})
                </button>
                <button
                  type="button"
                  onClick={() => setManifestFilter('IN_HOUSE')}
                  className={cn(
                    'px-3 py-1.5 rounded-[3px] text-xs font-semibold cursor-pointer transition-colors',
                    manifestFilter === 'IN_HOUSE'
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300'
                  )}
                >
                  Currently In-House ({stats.inHouse})
                </button>
                <button
                  type="button"
                  onClick={() => setManifestFilter('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-[3px] text-xs font-semibold cursor-pointer transition-colors',
                    manifestFilter === 'ALL'
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300'
                  )}
                >
                  All Manifest
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manifestSearch}
                  onChange={(e) => setManifestSearch(e.target.value)}
                  placeholder="Search guest, code, room..."
                  className="w-full h-8 rounded border border-[#DCE3DF] bg-[#FAFBF9] py-1 pl-8 pr-7 text-xs font-medium dark:border-[#145447] dark:bg-[#061B16] dark:text-white outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            {/* Manifest Table */}
            <div className="border border-slate-200 dark:border-[#145447] rounded-lg overflow-hidden bg-white dark:bg-[#071F1A]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-[#145447]">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 dark:border-[#145447]">#</th>
                    <th className="py-2.5 px-3.5 w-24 border-r border-slate-200 dark:border-[#145447]">Code</th>
                    <th className="py-2.5 px-4 border-r border-slate-200 dark:border-[#145447]">Guest & ID</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#145447]">Stay Period</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#145447]">Room</th>
                    <th className="py-2.5 px-3.5 text-right border-r border-slate-200 dark:border-[#145447]">Tariff & Advance</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-[#145447]">Status</th>
                    <th className="py-2.5 px-3 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#145447]">
                  {manifestList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No bookings found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    manifestList.map((booking, idx) => {
                      const fin = getBookingFinancials(booking);
                      const isCheckedIn = booking.status === 'CHECKED_IN';

                      return (
                        <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-[#093027]/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-[#145447]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-slate-200 dark:border-[#145447]">
                            {booking.bookingCode}
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200 dark:border-[#145447]">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {booking.guest.firstName} {booking.guest.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {booking.guest.phone} · ID: {booking.guest.idNumber || 'Verified'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#145447]">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {booking.checkIn} → {booking.checkOut}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#145447]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Room {booking.room.number}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{booking.room.type}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right border-r border-slate-200 dark:border-[#145447]">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              Rs. {fin.totalCharges.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Adv: Rs. {fin.totalPaid.toLocaleString()}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-[#145447]">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                                In-House
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                                Reserved
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {!isCheckedIn ? (
                              <button
                                type="button"
                                onClick={() => handleSelectReservationToAutoFill(booking)}
                                className="px-3 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer shadow-2xs"
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBookingForRegCard(booking)}
                                className="px-2 py-1 rounded-[3px] border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:border-[#145447] dark:text-slate-300 cursor-pointer"
                              >
                                Reg Card
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Check-In Desk...
        </div>
      }
    >
      <CheckInDeskContent />
    </Suspense>
  );
}

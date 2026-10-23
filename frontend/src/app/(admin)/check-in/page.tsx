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
import { useMasterOptions } from '@/lib/mastersData';
import MasterSearchableSelect from '@/components/ui/MasterSearchableSelect';

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

const AGENT_OPTIONS = [
  { id: 'agt-1', code: 'AGT-001', name: 'Himalayan Travels' },
  { id: 'agt-2', code: 'AGT-002', name: 'Everest Holidays' },
  { id: 'agt-3', code: 'AGT-003', name: 'Nepal Vista Tours' },
  { id: 'agt-4', code: 'AGT-004', name: 'Walk-In Direct' },
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
  const [guestNationality, setGuestNationality] = useState<string>('');
  const [guestAddress, setGuestAddress] = useState<string>('New Baneshwor, Kathmandu');
  const [guestCity, setGuestCity] = useState<string>('Kathmandu');

  // KYC Fields
  const [idType, setIdType] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('27-01-72-0451');
  const [idIssuePlace, setIdIssuePlace] = useState<string>('Kathmandu');
  const [idIssueDate, setIdIssueDate] = useState<string>('');
  const [idExpiryDate, setIdExpiryDate] = useState<string>('');
  const [idDocumentImage, setIdDocumentImage] = useState<string | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(true);

  // Accompanying Guests & Travel Purpose
  const relMaster = useMasterOptions('relationships');
  const idDocMaster = useMasterOptions('idDocumentTypes');
  const natMaster = useMasterOptions('nationalities');
  const povMaster = useMasterOptions('purposeOfVisit');
  const agentMaster = useMasterOptions('bookingAgents');

  const [purposeOfVisit, setPurposeOfVisit] = useState<string>('');
  const [bookingAgent, setBookingAgent] = useState<string>('');
  const [arrivedFrom, setArrivedFrom] = useState<string>('');
  const [proceedingTo, setProceedingTo] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [accompanyingGuests, setAccompanyingGuests] = useState<AccompanyingGuest[]>([]);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccAge, setNewAccAge] = useState<string>('');
  const [newAccGender, setNewAccGender] = useState<string>('M');
  const [newAccRelation, setNewAccRelation] = useState<string>('');

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
  const [printLabel, setPrintLabel] = useState<boolean>(false);
  const [disableProxy, setDisableProxy] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
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
    setGuestNationality(b.guest.country || '');
    if (b.guest.city) setGuestCity(b.guest.city);
    if (b.guest.idType && b.guest.idType !== 'Citizenship') {
      setIdType(b.guest.idType);
    } else {
      setIdType('');
    }
    if (b.guest.idNumber && !b.guest.idNumber.toLowerCase().includes('to be collected')) {
      setIdNumber(b.guest.idNumber);
    }
    if (b.bookingAgent) setBookingAgent(b.bookingAgent);
    if (b.guest.purposeOfVisit) setPurposeOfVisit(b.guest.purposeOfVisit);
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
      relation: newAccRelation || 'Guest',
    };
    setAccompanyingGuests([...accompanyingGuests, newGuest]);
    setNewAccName('');
    setNewAccAge('');
    setNewAccRelation('');
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
    setGuestNationality('');
    setIdType('');
    setIdNumber('');
    setPurposeOfVisit('');
    setBookingAgent('');
    setNewAccRelation('');
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
      bookingAgent,
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

        {/* =============================================================== */}
        {/* VIEW 1: THE CHECK-IN FORM                                       */}
        {/* =============================================================== */}
        {activeTab === 'FORM' && (
          <div className="p-6 lg:p-8 space-y-8">
            {/* SEARCH RESERVATION TO AUTO-FILL */}
            <div className="space-y-2 max-w-sm">
              <label className="block mb-1 text-xs font-bold text-slate-600 dark:text-neutral-400">
                Search Guest
              </label>
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
                  placeholder="Search by name or Mobilenumber"
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-[#145447] text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-[#0B3D32] transition-all"
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
                    <MasterSearchableSelect
                      label="Nationality"
                      value={guestNationality}
                      onChange={setGuestNationality}
                      options={natMaster.activeItems.map((i) => ({
                        label: i.name,
                        value: i.name,
                        subtext: i.description,
                      }))}
                      placeholder="Select Nationality"
                      searchPlaceholder="Search nationality / country..."
                      onAddNew={(val, desc) => {
                        natMaster.addItem(val, desc);
                        toast.success('Nationality Added', `"${val}" added to Nationality masters.`);
                      }}
                      addNewTitle="Nationality"
                    />
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
                    <MasterSearchableSelect
                      label="ID Document Type"
                      required
                      value={idType}
                      onChange={setIdType}
                      options={idDocMaster.activeItems.map((i) => ({
                        label: i.name,
                        value: i.name,
                        subtext: i.description,
                      }))}
                      placeholder="Select ID Document Type"
                      searchPlaceholder="Search ID type..."
                      onAddNew={(val, desc) => {
                        idDocMaster.addItem(val, desc);
                        toast.success('ID Type Added', `"${val}" added to ID Document masters.`);
                      }}
                      addNewTitle="ID Document Type"
                    />
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
                    Travel & Additional Guests
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <MasterSearchableSelect
                      label="Purpose of Visit"
                      value={purposeOfVisit}
                      onChange={setPurposeOfVisit}
                      options={povMaster.activeItems.map((i) => ({
                        label: i.name,
                        value: i.name,
                        subtext: i.description,
                      }))}
                      placeholder="Select Purpose of Visit"
                      searchPlaceholder="Search purpose..."
                      onAddNew={(val, desc) => {
                        povMaster.addItem(val, desc);
                        toast.success('Purpose Added', `"${val}" added to Purpose masters.`);
                      }}
                      addNewTitle="Purpose of Visit"
                    />
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

                {/* Booking Agent */}
                <div className="pt-1">
                  <MasterSearchableSelect
                    label="Booking Agent"
                    value={bookingAgent}
                    onChange={setBookingAgent}
                    options={agentMaster.activeItems.map((a) => ({
                      label: a.name,
                      value: a.name,
                      subtext: a.code ? `${a.code}${a.description ? ` · ${a.description}` : ''}` : a.description,
                    }))}
                    placeholder="Select Booking Agent"
                    searchPlaceholder="Search booking agent..."
                    onAddNew={(val, desc) => {
                      agentMaster.addItem(val, desc);
                      toast.success('Agent Added', `"${val}" added to Booking Agents master.`);
                    }}
                    addNewTitle="Booking Agent"
                  />
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
                      Additional Guests ({accompanyingGuests.length})
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
                    <div className="w-36 shrink-0">
                      <MasterSearchableSelect
                        compact
                        value={newAccRelation}
                        onChange={setNewAccRelation}
                        options={relMaster.activeItems.map((r) => ({
                          label: r.name,
                          value: r.name,
                          subtext: r.description,
                        }))}
                        placeholder="Select Relation"
                        searchPlaceholder="Search relation..."
                        onAddNew={(val, desc) => {
                          relMaster.addItem(val, desc);
                          toast.success('Relationship Added', `"${val}" added to Relationship masters.`);
                        }}
                        addNewTitle="Relationship"
                        allowClear={true}
                      />
                    </div>
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
                      <td className="py-1.5 px-2.5 text-center text-slate-600 dark:text-slate-400 font-normal border-r border-slate-300 dark:border-slate-700">
                        1
                      </td>
                      <td className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        <div className="text-xs text-slate-800 dark:text-slate-200 font-normal">
                          {selectedRoomObj.type}
                        </div>
                      </td>
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
                      <td className="py-1.5 px-2.5 text-center text-xs text-slate-700 dark:text-slate-300 font-normal border-r border-slate-300 dark:border-slate-700">
                        {adultsCount + childrenCount}
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-300 dark:border-slate-700">
                        <input
                          type="number"
                          min={0}
                          value={customRate}
                          onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full h-7 px-2 text-right font-mono text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xs outline-none focus:bg-white dark:focus:bg-[#071F1A] focus:border-slate-400"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-xs text-slate-800 dark:text-slate-200 font-normal border-r border-slate-300 dark:border-slate-700">
                        {nights}
                      </td>
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
                  <span>Print Registration Card on Check-In</span>
                </label>
              </div>
            </div>

            {/* ===============================================================
                SECTION 5: BILLING & SETTLEMENT (Boxed Container Matching Image 2)
                =============================================================== */}
            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Billing & Settlement
                </h2>
              </div>

              {/* The Reference Pattern Card (Box ONLY Here) */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-[#071F1A] space-y-3.5 shadow-2xs">
                {/* Row 1: Basic Total, Dis %, Dis Amt, Tax Amt(3%), Round off, Net Amount */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Basic Total
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      {subtotal.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Dis %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent || ''}
                      onChange={(e) => {
                        const p = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setDiscountPercent(p);
                        setDiscount(Math.round(((subtotal || 0) * p) / 100));
                      }}
                      placeholder="0"
                      className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#061B16] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Dis Amt
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discount || ''}
                      onChange={(e) => {
                        const d = Math.max(0, Number(e.target.value) || 0);
                        setDiscount(d);
                        setDiscountPercent(subtotal > 0 ? Math.round((d / subtotal) * 100) : 0);
                      }}
                      placeholder="0"
                      className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#061B16] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Tax Amt(3%)
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      0.00
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Round off
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      0.00
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Net Amount
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      {totalPayable.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Row 2: Paid Amt., Ref. Due, Mode, Remarks, Print, Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Paid Amt.
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={advancedAmount}
                      onChange={(e) => setAdvancedAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#061B16] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Ref. Due
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      {dueAmountAtCheckout.toLocaleString()}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xs bg-white dark:bg-[#061B16] text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI_QR">UPI / QR</option>
                      <option value="BANK_TRANSFER">Bank</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder=""
                      className="w-full h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xs bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="lg:col-span-1 flex flex-col items-center justify-end pb-0.5">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 text-center cursor-pointer">
                      Print
                    </label>
                    <input
                      type="checkbox"
                      checked={printRegCard}
                      onChange={(e) => setPrintRegCard(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 border-slate-300 cursor-pointer"
                    />
                  </div>

                  <div className="lg:col-span-1 flex flex-col items-center justify-end pb-0.5">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 text-center cursor-pointer">
                      Label
                    </label>
                    <input
                      type="checkbox"
                      checked={printLabel}
                      onChange={(e) => setPrintLabel(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 border-slate-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Row 3: Disable proxy & Save */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-1">
                  <div className="lg:col-span-2 flex flex-col items-start">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Disable proxy
                    </span>
                    <input
                      type="checkbox"
                      checked={disableProxy}
                      onChange={(e) => setDisableProxy(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-600 border-slate-300 cursor-pointer"
                    />
                  </div>

                  <div className="lg:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCompleteCheckIn}
                      className="h-7 px-6 rounded-xs border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-[#071F1A]"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="h-7 px-3.5 rounded-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 text-xs font-normal cursor-pointer bg-white dark:bg-[#071F1A]"
                    >
                      Reset
                    </button>
                  </div>
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

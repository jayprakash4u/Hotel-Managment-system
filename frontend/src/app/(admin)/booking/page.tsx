'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bed,
  Calendar,
  CalendarCheck,
  Clock,
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
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
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
  doDatesOverlap,
} from '../reservations/reservationsData';
import { useMasterOptions } from '@/lib/mastersData';
import MasterSearchableSelect from '@/components/ui/MasterSearchableSelect';

// Form Room Row for multi-room bookings
export interface FormRoomRow {
  id: string;
  roomId: string;
  rate: number;
  discount: number;
  guestsCount: number;
}

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

  // Helper to format current local time as HH:mm
  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const parseTimeToHHmm = (val?: string) => {
    if (!val) return getCurrentTimeString();
    const match = val.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = match[2];
      if (val.toLowerCase().includes('pm') && hours < 12) hours += 12;
      if (val.toLowerCase().includes('am') && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${mins}`;
    }
    return getCurrentTimeString();
  };

  // ---------------------------------------------------------------------------
  // 1. STAY SCHEDULE STATE
  // ---------------------------------------------------------------------------
  const [checkInDate, setCheckInDate] = useState<string>(paramCheckIn || todayStr);
  const [checkInTime, setCheckInTime] = useState<string>(() => getCurrentTimeString());
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
  const [guestNationality, setGuestNationality] = useState<string>('');
  const [guestAddress, setGuestAddress] = useState<string>('New Baneshwor, Kathmandu');
  const [guestCity, setGuestCity] = useState<string>('Kathmandu');

  // KYC Fields (Identification)
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

  // Key Card & Luggage
  const [keyCardNumber, setKeyCardNumber] = useState<string>('KC-101-A');
  const [luggageCount, setLuggageCount] = useState<number>(1);

  // Search Guest / Reservation to Auto-Fill
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
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

  // Search Guest / Reservation for Auto-Fill
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

  const handleSelectReservationToAutoFill = (b: RoomBooking) => {
    setLinkedBooking(b);
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
    setCheckInTime(b.checkInTime ? parseTimeToHHmm(b.checkInTime) : getCurrentTimeString());
    setCheckOutDate(b.checkOut);
    const roomStayTotal = (b.room.pricePerNight || 3500) * (b.nights || 1);
    const rowDiscount = Math.max(0, roomStayTotal - (b.roomCharges || roomStayTotal));
    setRoomItems([
      {
        id: 'row-1',
        roomId: b.room.id,
        rate: b.room.pricePerNight,
        discount: rowDiscount,
        guestsCount: 1 + (b.guest.accompanyingGuests?.length || 0),
      },
    ]);
    setKeyCardNumber(b.keyCardNumber || `KC-${b.room.number}-A`);
    if (b.notes) setBookingNotes(b.notes);
    if (b.guest.accompanyingGuests) setAccompanyingGuests(b.guest.accompanyingGuests);

    // Calculate advance paid
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
      relation: newAccRelation || 'Guest',
    };
    setAccompanyingGuests([...accompanyingGuests, newGuest]);
    setNewAccName('');
    setNewAccAge('');
    setNewAccRelation('');
    setAdultsCount((prev) => prev + 1);
    toast.success('Guest Added', `${newGuest.name} added to accompanying manifest.`);
  };

  const handleRemoveAccompanyingGuest = (id?: string) => {
    setAccompanyingGuests(accompanyingGuests.filter((g) => g.id !== id));
    setAdultsCount((prev) => Math.max(1, prev - 1));
  };

  // ---------------------------------------------------------------------------
  // 3. ROOM INFORMATION TABLE STATE (Multi-Room Support)
  // ---------------------------------------------------------------------------
  const [roomItems, setRoomItems] = useState<FormRoomRow[]>(() => {
    const initRoomId = paramRoomId;
    let initRoom = initRoomId ? AVAILABLE_ROOMS_CATALOG.find((r) => r.id === initRoomId) : undefined;
    if (!initRoom || initRoom.status !== 'AVAILABLE' || initRoom.cleaningStatus === 'DIRTY') {
      initRoom = AVAILABLE_ROOMS_CATALOG.find(
        (r) => r.status === 'AVAILABLE' && r.cleaningStatus === 'CLEAN'
      ) || AVAILABLE_ROOMS_CATALOG[0];
    }
    return [
      {
        id: 'row-1',
        roomId: initRoom ? initRoom.id : 'rm-101',
        rate: initRoom ? initRoom.pricePerNight : 3500,
        discount: 0,
        guestsCount: 2,
      },
    ];
  });

  // Check room availability status for the selected stay dates
  // Automatically considers: booked dates, checked in / occupied, dirty rooms, and maintenance rooms
  const checkRoomAvailability = (
    room: AvailableRoomOption,
    currentRowId?: string
  ): { isAvailable: boolean; reason?: string } => {
    // 1. Is it selected in another row in this form?
    const isSelectedInOther = roomItems.some(
      (item) => item.id !== currentRowId && item.roomId === room.id
    );
    if (isSelectedInOther) {
      return { isAvailable: false, reason: 'ALREADY_SELECTED' };
    }

    // 2. Is it under maintenance?
    if (room.status === 'MAINTENANCE') {
      return { isAvailable: false, reason: 'MAINTENANCE' };
    }

    // 3. Is it dirty or currently being cleaned?
    if (room.status === 'DIRTY' || room.cleaningStatus === 'DIRTY' || room.cleaningStatus === 'IN_CLEANING') {
      return { isAvailable: false, reason: 'DIRTY' };
    }

    // 4. Is it occupied / checked-in in the room catalog?
    if (room.status === 'OCCUPIED') {
      return { isAvailable: false, reason: 'OCCUPIED' };
    }

    // 5. Does it conflict with an existing reservation or stay in storage?
    const conflictBooking = bookings.find((b) => {
      if (linkedBooking && b.id === linkedBooking.id) return false;
      if (paramBookingId && b.id === paramBookingId) return false;
      if (b.status === 'CHECKED_OUT' || b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
      if (b.room.number !== room.number) return false;
      return doDatesOverlap(b.checkIn, b.checkOut, checkInDate, checkOutDate);
    });

    if (conflictBooking) {
      return {
        isAvailable: false,
        reason: conflictBooking.status === 'CHECKED_IN' ? 'OCCUPIED' : 'BOOKED',
      };
    }

    // 6. Genuinely available & clean!
    return { isAvailable: true };
  };

  // Auto-switch any room row whose assigned room is no longer available/clean for selected dates
  useEffect(() => {
    setRoomItems((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        const roomObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === item.roomId);
        const isCurrentAvail = roomObj && checkRoomAvailability(roomObj, item.id).isAvailable;
        if (!isCurrentAvail) {
          // Find first available clean room not selected in other rows
          const replacement = AVAILABLE_ROOMS_CATALOG.find((r) => {
            return checkRoomAvailability(r, item.id).isAvailable;
          });
          if (replacement && replacement.id !== item.roomId) {
            changed = true;
            return {
              ...item,
              roomId: replacement.id,
              rate: replacement.pricePerNight,
            };
          }
        }
        return item;
      });
      return changed ? updated : prev;
    });
  }, [checkInDate, checkOutDate, bookings]);

  // Calculate per-row subtotal, discount, and Total Amount instantly
  const roomRowsCalculated = useMemo(() => {
    return roomItems.map((item) => {
      const roomObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === item.roomId) || AVAILABLE_ROOMS_CATALOG[0];
      const rateNum = Number(item.rate) || 0;
      const discountNum = Number(item.discount) || 0;
      const rowSubtotal = rateNum * nights;
      const rowTotal = Math.max(0, rowSubtotal - discountNum);
      const avail = checkRoomAvailability(roomObj, item.id);
      return {
        ...item,
        roomObj,
        subtotal: rowSubtotal,
        total: rowTotal,
        isAvailable: avail.isAvailable,
        availabilityStatus: avail,
      };
    });
  }, [roomItems, nights, bookings, checkInDate, checkOutDate, linkedBooking, paramBookingId, formMode, todayStr]);

  // Aggregate Totals across all room rows
  const subtotal = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + r.subtotal, 0);
  }, [roomRowsCalculated]);

  const totalDiscount = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + (Number(r.discount) || 0), 0);
  }, [roomRowsCalculated]);

  const totalPayable = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  const totalGuests = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + (Number(r.guestsCount) || 1), 0);
  }, [roomRowsCalculated]);

  const discountPercent = useMemo(() => {
    if (subtotal <= 0) return 0;
    return Math.round((totalDiscount / subtotal) * 100);
  }, [totalDiscount, subtotal]);

  // Remaining Balance Due after advance
  const remainingBalanceDue = useMemo(() => {
    return Math.max(0, totalPayable - advancePaidAtBooking);
  }, [totalPayable, advancePaidAtBooking]);

  // ---------------------------------------------------------------------------
  // 4. NOTIFICATIONS, REMARKS & PAYMENT STATE
  // ---------------------------------------------------------------------------
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [printLabel, setPrintLabel] = useState<boolean>(false);

  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'LATER' | 'ADVANCE' | 'FULL'>('FULL');
  const [advancedAmount, setAdvancedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  const dueAmountAtCheckout = useMemo(() => {
    if (paymentChoice === 'LATER') return remainingBalanceDue;
    return Math.max(0, remainingBalanceDue - (Number(advancedAmount) || 0));
  }, [remainingBalanceDue, advancedAmount, paymentChoice]);

  // Keep advance synced with remaining balance when total changes
  useEffect(() => {
    if (paymentChoice === 'FULL') {
      setAdvancedAmount(remainingBalanceDue);
    } else if (paymentChoice === 'LATER') {
      setAdvancedAmount(0);
    } else {
      setAdvancedAmount((prev) => (prev > remainingBalanceDue ? remainingBalanceDue : prev === 0 ? Math.min(2000, remainingBalanceDue) : prev));
    }
  }, [remainingBalanceDue, paymentChoice]);

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

  // Add / Remove / Update Room row actions
  const handleAddRoomRow = () => {
    const availableRoom = AVAILABLE_ROOMS_CATALOG.find((r) => {
      const status = checkRoomAvailability(r);
      return status.isAvailable;
    });

    if (!availableRoom) {
      toast.warning('No More Rooms', 'All rooms are either occupied, under maintenance, or already selected.');
      return;
    }

    const newRowId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setRoomItems((prev) => [
      ...prev,
      {
        id: newRowId,
        roomId: availableRoom.id,
        rate: availableRoom.pricePerNight,
        discount: 0,
        guestsCount: 2,
      },
    ]);

    toast.success('Room Added', `Room ${availableRoom.number} (${availableRoom.type}) added to booking table.`);
  };

  const handleRemoveRoomRow = (rowId: string) => {
    if (roomItems.length <= 1) {
      toast.warning('Cannot Remove', 'At least one room is required for a reservation.');
      return;
    }
    const target = roomItems.find((r) => r.id === rowId);
    const roomObj = target ? AVAILABLE_ROOMS_CATALOG.find((x) => x.id === target.roomId) : null;
    setRoomItems((prev) => prev.filter((r) => r.id !== rowId));
    toast.info('Room Removed', `Room ${roomObj?.number || ''} was removed from the booking.`);
  };

  const handleUpdateRoomRow = (rowId: string, updates: Partial<FormRoomRow>) => {
    setRoomItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return { ...item, ...updates };
      })
    );
  };

  const handleSelectRoomInRow = (rowId: string, newRoomId: string) => {
    const rObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === newRoomId);
    setRoomItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return {
          ...item,
          roomId: newRoomId,
          rate: rObj ? rObj.pricePerNight : item.rate,
        };
      })
    );
  };

  const handleBillingDisAmtChange = (d: number) => {
    const amt = Math.max(0, d);
    if (roomItems.length === 1) {
      setRoomItems((prev) => [{ ...prev[0], discount: amt }]);
    } else {
      const ratio = subtotal > 0 ? amt / subtotal : 0;
      setRoomItems((prev) =>
        prev.map((r) => ({
          ...r,
          discount: Math.round((Number(r.rate) || 0) * nights * ratio),
        }))
      );
    }
  };

  const handleBillingDisPercentChange = (pct: number) => {
    const p = Math.max(0, Math.min(100, pct));
    setRoomItems((prev) =>
      prev.map((r) => ({
        ...r,
        discount: Math.round((((Number(r.rate) || 0) * nights) * p) / 100),
      }))
    );
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
    setIdIssuePlace('');
    setIdDocumentImage(null);
    setVehicleNumber('');
    setArrivedFrom('');
    setProceedingTo('');
    setPurposeOfVisit('');
    setBookingAgent('');
    setNewAccRelation('');
    setNewAccName('');
    setNewAccAge('');
    setBookingNotes('');
    setAccompanyingGuests([]);
    setCheckInDate(todayStr);
    setCheckInTime(getCurrentTimeString());
    setCheckOutDate(tomorrowStr);
    setAdultsCount(2);
    setChildrenCount(0);
    const defRoom = AVAILABLE_ROOMS_CATALOG[0];
    setRoomItems([
      {
        id: 'row-1',
        roomId: defRoom ? defRoom.id : 'rm-101',
        rate: defRoom ? defRoom.pricePerNight : 3500,
        discount: 0,
        guestsCount: 2,
      },
    ]);
    if (defRoom) {
      setKeyCardNumber(`KC-${defRoom.number}-A`);
    }
    setPaymentChoice('FULL');
    setPaymentMethod('CASH');
    setPrintLabel(false);
    toast.info('Form Reset', 'All booking & check-in fields have been cleared.');
  };

  // ---------------------------------------------------------------------------
  // SAVE BOOKING OR CHECK IN
  // ---------------------------------------------------------------------------
  const handleSaveBooking = (shouldCheckInNow: boolean = false, forcePrint: boolean = false) => {
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

    const paidNow = paymentChoice === 'LATER' ? 0 : Math.min(Number(advancedAmount) || 0, remainingBalanceDue);

    const baseBookingId = paramBookingId || linkedBooking?.id || `bk-${Date.now().toString().slice(-4)}`;
    const baseBookingCode = linkedBooking?.bookingCode || `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentBookings = loadBookingsFromStorage();

    const createdBookings: RoomBooking[] = roomRowsCalculated.map((rowItem, idx) => {
      const isPrimary = idx === 0;
      const bId = isPrimary ? baseBookingId : `${baseBookingId}-${idx + 1}`;
      const bCode = isPrimary ? baseBookingCode : `${baseBookingCode}-${idx + 1}`;

      const paymentRecords: PaymentEntry[] = [];
      if (isPrimary && linkedBooking?.payments) {
        paymentRecords.push(...linkedBooking.payments);
      }
      if (isPrimary && paidNow > 0) {
        paymentRecords.push({
          id: `pay-${Date.now()}-${idx}`,
          receiptNo: `REC-${Date.now().toString().slice(-4)}`,
          date: 'Today',
          amount: paidNow,
          method: (paymentMethod === 'PAY_LATER' ? 'CASH' : paymentMethod) as any,
          type: paidNow >= remainingBalanceDue ? 'SETTLEMENT' : 'ADVANCE',
          notes: shouldCheckInNow ? 'Check-in desk payment received' : 'Advance deposit received at booking',
        });
      }

      return {
        id: bId,
        bookingCode: bCode,
        status: shouldCheckInNow ? 'CHECKED_IN' : 'RESERVED',
        checkIn: checkInDate,
        checkInTime: shouldCheckInNow ? (checkInTime || getCurrentTimeString()) : undefined,
        checkOut: checkOutDate,
        nights,
        roomCharges: rowItem.total,
        room: {
          id: rowItem.roomObj.id,
          number: rowItem.roomObj.number,
          type: rowItem.roomObj.type,
          acType: rowItem.roomObj.acType,
          bedType: rowItem.roomObj.bedType,
          floorLevel: rowItem.roomObj.floorLevel,
          pricePerNight: Number(rowItem.rate) || rowItem.roomObj.pricePerNight,
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
          accompanyingGuests: isPrimary ? accompanyingGuests : [],
          vipTier: linkedBooking?.guest.vipTier || 'STANDARD',
        },
        cafeOrders: isPrimary ? (linkedBooking?.cafeOrders || []) : [],
        payments: paymentRecords,
        bookingHistory: isPrimary ? (linkedBooking?.bookingHistory || []) : [],
        notes: bookingNotes.trim()
          ? `${bookingNotes.trim()}${roomRowsCalculated.length > 1 ? ` (Room ${idx + 1} of ${roomRowsCalculated.length})` : ''}`
          : (roomRowsCalculated.length > 1 ? `Room ${idx + 1} of ${roomRowsCalculated.length}` : undefined),
        keyCardNumber: `KC-${rowItem.roomObj.number}-A`,
        luggageCount: isPrimary ? luggageCount : 0,
        bookingAgent,
      };
    });

    let updated = [...currentBookings];
    createdBookings.forEach((nb) => {
      const existingIdx = updated.findIndex((b) => b.id === nb.id);
      if (existingIdx >= 0) {
        updated[existingIdx] = nb;
      } else {
        updated.unshift(nb);
      }
    });

    setBookings(updated);
    saveBookingsToStorage(updated);

    const roomNumbersStr = roomRowsCalculated.map((r) => r.roomObj.number).join(', ');

    if (forcePrint) {
      setSelectedBookingForRegCard(createdBookings[0]);
      if (shouldCheckInNow) {
        toast.celebrate(
          'Guest Checked In!',
          `${roomRowsCalculated.length} Room(s) (${roomNumbersStr}) assigned to ${guestName.trim()}.`
        );
      } else {
        toast.success(
          'Booking Saved & Ready to Print!',
          `Reservation ${baseBookingCode} confirmed for ${guestName.trim()} (${roomRowsCalculated.length} room(s): ${roomNumbersStr}).`
        );
      }
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      if (shouldCheckInNow) {
        toast.celebrate(
          'Guest Checked In!',
          `${roomRowsCalculated.length} Room(s) (${roomNumbersStr}) assigned to ${guestName.trim()}.`
        );
      } else {
        toast.success(
          'Booking Saved!',
          `Reservation ${baseBookingCode} confirmed for ${guestName.trim()} (${roomRowsCalculated.length} room(s): ${roomNumbersStr}).`
        );
      }
      setTimeout(() => {
        router.push(fromParam === 'reservations' ? '/reservations' : '/front-desk');
      }, 1000);
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
    <div className="space-y-4 max-w-7xl mx-auto pb-16 select-none font-sans text-body dark:text-slate-100">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId={formMode === 'CHECK_IN' ? 'check-in' : 'reservations'} />

      {/* Main Booking Container Card */}
      <div className="bg-white dark:bg-surface-card rounded-[4px] border border-border-default dark:border-border-default shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-border-default bg-surface-muted dark:bg-surface-card gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-body dark:text-white font-heading">
                {formMode === 'CHECK_IN' ? 'Guest Check-In' : 'New Room Booking'}
              </h1>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card p-0.5">
              <button
                type="button"
                onClick={() => setFormMode('BOOKING')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  formMode === 'BOOKING'
                    ? 'bg-brand text-white shadow-2xs dark:bg-emerald-700'
                    : 'text-muted dark:text-slate-300 hover:bg-slate-50'
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
                    ? 'bg-brand text-white shadow-2xs dark:bg-emerald-700'
                    : 'text-muted dark:text-slate-300 hover:bg-slate-50'
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Check-In Desk</span>
              </button>
            </div>

            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-brand dark:text-emerald-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4]"
              title="View all existing bookings and reservations"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-success dark:text-brand" />
              <span>Booked List</span>
            </Link>

            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-body dark:text-slate-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{fromParam === 'reservations' ? 'Back to Reservations' : fromParam === 'check-in' ? 'Back to Check-In' : 'Back to Front Desk'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-8">
          {/* SEARCH GUEST / RESERVATION TO AUTO-FILL */}
          <div className="space-y-2 max-w-sm">
            <label className="block mb-1 text-xs font-bold text-muted dark:text-neutral-400">
              Search Guest
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder="Search by name or Mobilenumber"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-border-default dark:border-border-default text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchSuggestions(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-muted cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSearchSuggestions && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card shadow-xl overflow-hidden divide-y divide-[#E2E8F0] dark:divide-[#334155] max-h-60 overflow-y-auto">
                  {searchResults.map((b) => {
                    const fin = getBookingFinancials(b);
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelectReservationToAutoFill(b)}
                        className="p-3 hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-body dark:text-white flex items-center gap-2">
                            <span>{b.guest.firstName} {b.guest.lastName}</span>
                            <span className="font-mono text-muted">({b.bookingCode})</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-muted dark:bg-slate-800 text-body dark:text-slate-300">
                              Room {b.room.number}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted font-mono">
                            {b.guest.phone} · {b.checkIn} to {b.checkOut} ({b.nights}n)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-body dark:text-white block">
                            Rs. {fin.totalCharges.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-success block">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-100 dark:border-border-default pb-8">
            {/* Stay Schedule (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-body dark:text-neutral-300">
                  Stay Schedule
                </span>
              </div>

              {/* Stay Schedule: Check-in Date, Time & Check-out Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Check-in date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => handleCheckInDateChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Actual Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Check-out date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Adults & Children Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Adults
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={adultsCount}
                    onChange={(e) => setAdultsCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Children
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

            </div>

            {/* Guest Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-body dark:text-neutral-300">
                  Guest Information
                </span>
              </div>

              {/* Guest Fields: Name, Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Guest name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Mobile number"
                      className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
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
                <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  placeholder="Street address, city"
                  className="w-full h-9 px-3 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>
          </div>

          {/* ===============================================================
              SECTION 2: ROOM INFORMATION
              =============================================================== */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-brand dark:text-blue-400" />
              <h2 className="text-sm font-bold text-body dark:text-white tracking-tight">
                Room Information
              </h2>
            </div>

            {/* Structured Table */}
            <div className="overflow-x-auto border border-border-default dark:border-border-default bg-white dark:bg-surface-card">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F4F6F8] dark:bg-[#0a231c] text-xs font-semibold text-body dark:text-slate-200 border-b border-border-default dark:border-border-default">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-12 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      SL.
                    </th>
                    <th className="py-2 px-3 min-w-[160px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ROOM CATEGORY
                    </th>
                    <th className="py-2 px-3 min-w-[220px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ASSIGNED ROOM
                    </th>
                    <th className="py-2 px-2 text-center w-20 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      GUEST
                    </th>
                    <th className="py-2 px-3 text-right w-28 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      AMOUNT (RS.)
                    </th>
                    <th className="py-2 px-2.5 text-center w-16 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      NIGHT
                    </th>
                    <th className="py-2 px-3 text-right w-28 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      DISCOUNT (RS.)
                    </th>
                    <th className="py-2 px-3 text-right w-32 font-semibold text-body dark:text-slate-200">
                      T. AMOUNT (RS.)
                    </th>
                    {roomItems.length > 1 && (
                      <th className="py-2 px-2 text-center w-12 border-l border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                        ACTION
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-surface-card">
                  {roomRowsCalculated.map((row, idx) => {
                    // Only show genuinely available & clean rooms for the selected stay dates
                    const availableRoomsForDropdown = AVAILABLE_ROOMS_CATALOG.filter((r) => {
                      return r.id === row.roomId || checkRoomAvailability(r, row.id).isAvailable;
                    });

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                        <td className="py-2 px-2.5 text-center text-muted dark:text-muted font-medium border-r border-border-default dark:border-border-default">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-border-default dark:border-border-default">
                          <div className="text-xs text-body dark:text-slate-200 font-medium">
                            {row.roomObj.type}
                          </div>
                          <div className="text-[10px] text-muted dark:text-muted">
                            {row.roomObj.acType} · {row.roomObj.bedType}
                          </div>
                        </td>
                        <td className="py-2 px-2 border-r border-border-default dark:border-border-default">
                          <select
                            value={row.roomId}
                            onChange={(e) => handleSelectRoomInRow(row.id, e.target.value)}
                            className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer font-medium"
                          >
                            {availableRoomsForDropdown.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                Room {rm.number} ({rm.type}) - Rs. {rm.pricePerNight.toLocaleString()}/night
                              </option>
                            ))}
                            {availableRoomsForDropdown.length === 0 && (
                              <option disabled value="">
                                No available rooms for selected dates
                              </option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2 border-r border-border-default dark:border-border-default">
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={row.guestsCount}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                              handleUpdateRoomRow(row.id, { guestsCount: val });
                            }}
                            className="w-full h-7 text-center font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2 border-r border-border-default dark:border-border-default">
                          <input
                            type="number"
                            min={0}
                            value={row.rate === 0 ? '' : row.rate}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                              handleUpdateRoomRow(row.id, { rate: val });
                            }}
                            className="w-full h-7 px-2 text-right font-mono text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-border-default dark:border-border-default text-body dark:text-white rounded-xs outline-none focus:bg-white dark:focus:bg-surface-card focus:border-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2.5 text-center text-xs text-body dark:text-slate-200 font-mono border-r border-border-default dark:border-border-default">
                          {nights}
                        </td>
                        <td className="py-2 px-2 border-r border-border-default dark:border-border-default">
                          <input
                            type="number"
                            min={0}
                            value={row.discount === 0 ? '' : row.discount}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                              handleUpdateRoomRow(row.id, { discount: val });
                            }}
                            placeholder="0"
                            className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 text-body dark:text-white rounded-xs outline-none focus:border-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="w-full h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-border-default dark:border-border-default text-body dark:text-white rounded-xs tabular-nums">
                            {row.total.toLocaleString()}
                          </div>
                        </td>
                        {roomItems.length > 1 && (
                          <td className="py-2 px-2 text-center border-l border-border-default dark:border-border-default">
                            <button
                              type="button"
                              onClick={() => handleRemoveRoomRow(row.id)}
                              title="Remove this room"
                              className="p-1 rounded text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

                {roomItems.length > 1 && (
                  <tfoot className="bg-surface-muted dark:bg-surface-card font-semibold text-xs border-t-2 border-border-default dark:border-slate-600">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-body dark:text-slate-300 border-r border-border-default dark:border-border-default"
                      >
                        Total
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-body dark:text-slate-200 border-r border-border-default dark:border-border-default font-mono">
                        {totalGuests}
                      </td>
                      <td className="py-2.5 px-3 border-r border-border-default dark:border-border-default"></td>
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-body dark:text-slate-200 font-mono border-r border-border-default dark:border-border-default">
                        {nights}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-emerald-700 dark:text-brand border-r border-border-default dark:border-border-default">
                        {totalDiscount > 0 ? `Rs. ${totalDiscount.toLocaleString()}` : '0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-brand dark:text-blue-400 tabular-nums">
                        Rs. {totalPayable.toLocaleString()}
                      </td>
                      <td className="border-l border-border-default dark:border-border-default"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Controls Below Table: Add Room Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddRoomRow}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xs border border-[#0B3D32] text-brand dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-surface-card shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>

          </div>
          {/* ===============================================================
              SECTION 3: BILLING & SETTLEMENT (Boxed Container Matching Check-In)
              =============================================================== */}
          <div className="space-y-3 pt-6 border-t border-border-default dark:border-border-default">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand dark:text-blue-400" />
              <h2 className="text-sm font-bold text-body dark:text-white tracking-tight">
                Billing & Settlement
              </h2>
            </div>

            {/* The Reference Pattern Card (Boxed Container Matching Check-In Desk) */}
            <div className="border border-border-default dark:border-border-default rounded-md p-4 bg-white dark:bg-surface-card space-y-3.5 shadow-2xs">
              {/* Row 1: Basic Total, Dis %, Dis Amt, Tax Amt(3%), Round off, Net Amount */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Basic Total
                  </label>
                  <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                    {subtotal.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Dis %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent || ''}
                    onChange={(e) => {
                      const p = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      handleBillingDisPercentChange(p);
                    }}
                    placeholder="0"
                    className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Dis Amt
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalDiscount || ''}
                    onChange={(e) => {
                      const d = Math.max(0, Number(e.target.value) || 0);
                      handleBillingDisAmtChange(d);
                    }}
                    placeholder="0"
                    className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Tax Amt(3%)
                  </label>
                  <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                    0.00
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Round off
                  </label>
                  <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                    0.00
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Net Amount
                  </label>
                  <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                    {totalPayable.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Previously Paid Advance Info Banner (if linked reservation has deposit) */}
              {advancePaidAtBooking > 0 && (
                <div className="p-2.5 rounded bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Advance Previously Paid: <strong className="font-mono">Rs. {advancePaidAtBooking.toLocaleString()}</strong></span>
                    {advanceReceiptInfo && <span className="text-[11px] font-normal text-success">({advanceReceiptInfo})</span>}
                  </div>
                  <div className="text-body dark:text-slate-200 font-bold">
                    Remaining Balance Due: <span className="font-mono text-amber-700 dark:text-amber-400">Rs. {remainingBalanceDue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Row 2: Payment Option, Paid Amt., Ref. Due, Mode, Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Payment Option
                  </label>
                  <select
                    value={paymentChoice}
                    onChange={(e) => setPaymentChoice(e.target.value as 'FULL' | 'ADVANCE' | 'LATER')}
                    className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer font-semibold"
                  >
                    <option value="FULL">Pay Full</option>
                    <option value="ADVANCE">Advance</option>
                    <option value="LATER">Pay Later</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Paid Amt.
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={paymentChoice === 'LATER'}
                    value={paymentChoice === 'LATER' ? 0 : advancedAmount}
                    onChange={(e) => setAdvancedAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400 disabled:opacity-50 disabled:bg-surface-muted dark:disabled:bg-slate-800"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Ref. Due
                  </label>
                  <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                    {dueAmountAtCheckout.toLocaleString()}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={paymentChoice === 'LATER'}
                    className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer disabled:opacity-50"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI_QR">UPI / QR</option>
                    <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                    <option value="BANK_TRANSFER">Bank</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                    Remarks / Special Requests
                  </label>
                  <input
                    type="text"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Airport pickup, high floor, preferences..."
                    className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Row 3: Options & Check-In Style Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5 text-xs text-muted dark:text-muted">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-brand accent-[#0B3D32] border-border-default cursor-pointer"
                    />
                    <span className="text-[11px] font-medium">Send SMS</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-brand accent-[#0B3D32] border-border-default cursor-pointer"
                    />
                    <span className="text-[11px] font-medium">Send Email</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveBooking(false, false)}
                    className="h-7 px-4 rounded-xs border border-[#0B3D32] bg-brand text-white hover:bg-[#093027] text-xs font-semibold cursor-pointer transition-colors shadow-2xs dark:bg-brand dark:hover:bg-[#093027]"
                  >
                    Save Booking
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBooking(false, true)}
                    className="h-7 px-3.5 rounded-xs border border-[#093027] bg-[#093027] hover:bg-[#06241D] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs dark:bg-[#093027] dark:hover:bg-[#06241D] inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Save & Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBooking(true, false)}
                    className="h-7 px-4 rounded-xs border border-emerald-600 text-emerald-700 dark:text-brand hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-surface-card"
                  >
                    Check In Now →
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-7 px-3.5 rounded-xs border border-border-default dark:border-slate-600 text-muted dark:text-muted hover:border-[#DC2626] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-normal cursor-pointer bg-white dark:bg-surface-card transition-colors"
                  >
                    Reset
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
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs"
            onClick={handleCloseRegCardModal}
          >
            <div
              className="w-full max-w-2xl rounded bg-white border border-border-default shadow-2xl p-6 text-black select-text printable-invoice"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hotel Letterhead */}
              <div className="text-center pb-4 border-b-2 border-black">
                <h2 className="text-xl font-bold tracking-widest uppercase font-serif">
                  AURA GRAND HOTEL & RESORT
                </h2>
                <p className="text-xs text-muted">
                  Kathmandu, Nepal · Tel: +977-1-4455667 · info@auragrandhotel.com
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 border border-black text-xs font-bold uppercase tracking-wider">
                  Guest Registration Card (KYC Verified)
                </div>
              </div>

              {/* Reg Card Fields */}
              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-border-default pb-3">
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Reservation Code:</span>
                    <strong className="font-mono text-sm">{b.bookingCode}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Assigned Room & Key:</span>
                    <strong className="text-sm">
                      Room {b.room.number} ({b.room.type}) · Key: {b.keyCardNumber || `KC-${b.room.number}`}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-border-default pb-3">
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Guest Full Name:</span>
                    <strong className="text-sm">{b.guest.firstName} {b.guest.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Phone & ID:</span>
                    <strong className="font-mono">
                      {b.guest.phone} · {b.guest.idType || 'ID'}: {b.guest.idNumber || 'Verified'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-border-default pb-3">
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Arrival Date & Time:</span>
                    <strong>{b.checkIn} {b.checkInTime ? `(${b.checkInTime})` : ''}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Departure Date:</span>
                    <strong>{b.checkOut}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Stay Duration:</span>
                    <strong>{b.nights} {b.nights === 1 ? 'Night' : 'Nights'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-border-default pb-3">
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Total Charges:</span>
                    <strong>Rs. {fin.totalCharges.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Total Paid / Advance:</span>
                    <strong className="text-emerald-700">Rs. {fin.totalPaid.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted text-[10px] block uppercase">Balance Due:</span>
                    <strong className={fin.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      Rs. {fin.balanceDue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-border-default rounded text-[10px] text-muted space-y-1">
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
              <div className="pt-3 border-t border-border-default flex items-center justify-between no-print print:hidden">
                <button
                  type="button"
                  onClick={handleCloseRegCardModal}
                  className="px-3 py-1.5 rounded border border-border-default text-xs font-semibold text-body hover:bg-slate-50 cursor-pointer"
                >
                  Close & Proceed
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-brand text-white text-xs font-bold cursor-pointer hover:bg-[#093027]"
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

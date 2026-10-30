'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bed,
  Calendar,
  Clock,
  ChevronDown,
  ArrowLeft,
  X,
  Check,
  Eye,
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
  doDatesOverlap,
} from '../reservations/reservationsData';
import { useMasterOptions } from '@/lib/mastersData';
import MasterSearchableSelect from '@/components/ui/MasterSearchableSelect';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';

// Form Room Row for multi-room check-in
export interface FormRoomRow {
  id: string;
  roomId: string;
  rate: number;
  discount: number;
  guestsCount: number;
}

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
  // 2. STAY SCHEDULE STATE
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
  const [idDocumentPhotos, setIdDocumentPhotos] = useState<{ id: string; name: string; dataUrl: string; size?: number }[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<{ name: string; dataUrl: string } | null>(null);
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
  // 4. ROOM INFORMATION TABLE STATE (Multi-Room Support matching Book Room)
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

  // Calculate per-row subtotal, discount, and Total Amount
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
  }, [roomItems, nights, bookings, checkInDate, checkOutDate, linkedBooking, paramBookingId]);

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

  const selectedRoomObj: AvailableRoomOption = useMemo(() => {
    return roomRowsCalculated[0]?.roomObj || AVAILABLE_ROOMS_CATALOG[0];
  }, [roomRowsCalculated]);
  const selectedRoomId = roomItems[0]?.roomId || 'rm-101';
  const customRate = roomItems[0]?.rate || 3500;
  const discount = totalDiscount;

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

    toast.success('Room Added', `Room ${availableRoom.number} (${availableRoom.type}) added to check-in table.`);
  };

  const handleRemoveRoomRow = (rowId: string) => {
    if (roomItems.length <= 1) {
      toast.warning('Cannot Remove', 'At least one room is required for check-in.');
      return;
    }
    const target = roomItems.find((r) => r.id === rowId);
    const roomObj = target ? AVAILABLE_ROOMS_CATALOG.find((x) => x.id === target.roomId) : null;
    setRoomItems((prev) => prev.filter((r) => r.id !== rowId));
    toast.info('Room Removed', `Room ${roomObj?.number || ''} was removed from check-in.`);
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
    if (b.guest.idDocumentImages && b.guest.idDocumentImages.length > 0) {
      setIdDocumentPhotos(
        b.guest.idDocumentImages.map((img, idx) => ({
          id: `doc-${idx}-${Date.now()}`,
          name: img.startsWith('data:') ? `KYC_Photo_${idx + 1}.png` : img,
          dataUrl: img,
        }))
      );
      setIdDocumentImage(b.guest.idDocumentImages[0]);
    } else if (b.guest.idDocumentImage) {
      setIdDocumentPhotos([
        {
          id: `doc-0-${Date.now()}`,
          name: b.guest.idDocumentImage,
          dataUrl: b.guest.idDocumentImage,
        },
      ]);
      setIdDocumentImage(b.guest.idDocumentImage);
    } else {
      setIdDocumentPhotos([]);
      setIdDocumentImage(null);
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
      const found = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === paramRoomId);
      if (found) {
        setRoomItems([
          {
            id: 'row-1',
            roomId: found.id,
            rate: found.pricePerNight,
            discount: 0,
            guestsCount: 2,
          },
        ]);
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

  // Multi-Photo KYC Document Handlers
  const handleUploadPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setIdDocumentPhotos((prev) => {
          const updated = [
            ...prev,
            {
              id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              dataUrl: result,
              size: file.size,
            },
          ];
          setIdDocumentImage(updated[0]?.name || null);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    toast.success(
      'Photos Attached',
      `${fileArray.length} photo${fileArray.length > 1 ? 's' : ''} added to KYC documentation.`
    );
  };

  const handleRemovePhoto = (id: string) => {
    setIdDocumentPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      setIdDocumentImage(filtered[0]?.name || null);
      return filtered;
    });
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
    setIdDocumentImage(null);
    setIdDocumentPhotos([]);
    setPurposeOfVisit('');
    setBookingAgent('');
    setNewAccRelation('');
    setBookingNotes('');
    setAccompanyingGuests([]);
    setCheckInDate(todayStr);
    setCheckInTime(getCurrentTimeString());
    setCheckOutDate(tomorrowStr);
    setAdultsCount(2);
    setChildrenCount(0);
    const defRoom = AVAILABLE_ROOMS_CATALOG[0];
    if (defRoom) {
      setRoomItems([
        {
          id: 'row-1',
          roomId: defRoom.id,
          rate: defRoom.pricePerNight,
          discount: 0,
          guestsCount: 2,
        },
      ]);
      setKeyCardNumber(`KC-${defRoom.number}-A`);
    }
    setPaymentChoice('FULL');
    setPaymentMethod('CASH');
    toast.info('Form Reset', 'All check-in fields have been cleared.');
  };

  // ---------------------------------------------------------------------------
  // COMPLETE CHECK-IN (Multi-Room Support)
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

    const baseBookingId = linkedBooking?.id || `bk-${Date.now().toString().slice(-4)}`;
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
          notes: 'Check-in desk payment collected',
        });
      }

      return {
        id: bId,
        bookingCode: bCode,
        status: 'CHECKED_IN',
        checkIn: checkInDate,
        checkInTime: checkInTime || getCurrentTimeString(),
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
          idNumber: idNumber.trim(),
          idIssuePlace,
          idIssueDate,
          idExpiryDate,
          idDocumentImage: idDocumentPhotos[0]?.name || idDocumentImage || undefined,
          idDocumentImages: idDocumentPhotos.map((p) => p.dataUrl),
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
        notes: bookingNotes.trim() || undefined,
        keyCardNumber: isPrimary ? keyCardNumber : `KC-${rowItem.roomObj.number}-A`,
        luggageCount: isPrimary ? luggageCount : 0,
        bookingAgent,
      };
    });

    let updated = [...currentBookings];
    createdBookings.forEach((newB) => {
      const idx = updated.findIndex((b) => b.id === newB.id);
      if (idx >= 0) {
        updated[idx] = newB;
      } else {
        updated = [newB, ...updated];
      }
    });

    setBookings(updated);
    saveBookingsToStorage(updated);

    const allRoomNumbersStr = roomRowsCalculated.map((r) => r.roomObj.number).join(', ');
    const primaryBooking = createdBookings[0];

    // 1. Save KYC details to registered guests master database
    if (typeof window !== 'undefined') {
      try {
        const rawGuests = localStorage.getItem('hotel_registered_guests');
        const existingGuests = rawGuests ? JSON.parse(rawGuests) : [];
        const kycRecord = {
          id: primaryBooking.guest.id,
          name: `${firstName} ${lastName}`.trim(),
          phone: guestPhone.trim(),
          email: guestEmail.trim() || `${guestPhone.trim()}@guest.hotel`,
          idType,
          idNumber: idNumber.trim(),
          idIssuePlace,
          idIssueDate,
          idExpiryDate,
          idDocumentImage: idDocumentPhotos[0]?.name || idDocumentImage || null,
          idDocumentImages: idDocumentPhotos.map((p) => p.dataUrl),
          address: guestAddress,
          city: guestCity,
          country: guestNationality,
          purposeOfVisit,
          arrivedFrom,
          proceedingTo,
          vehicleNumber,
          accompanyingGuests,
          lastCheckedIn: new Date().toISOString(),
          checkInDate,
          checkInTime: checkInTime || getCurrentTimeString(),
          assignedRoom: allRoomNumbersStr,
        };
        const idx = existingGuests.findIndex((g: any) => g.phone === guestPhone.trim() || (idNumber && g.idNumber === idNumber.trim()));
        let updatedGuests;
        if (idx >= 0) {
          updatedGuests = existingGuests.map((g: any, i: number) => (i === idx ? { ...g, ...kycRecord } : g));
        } else {
          updatedGuests = [kycRecord, ...existingGuests];
        }
        localStorage.setItem('hotel_registered_guests', JSON.stringify(updatedGuests));
      } catch (err) {
        console.warn('Failed to save KYC guest to storage', err);
      }
    }

    // 2. Change the assigned rooms status to "Occupied" across room setups
    if (typeof window !== 'undefined') {
      const roomIdsToOccupy = new Set(roomRowsCalculated.map((r) => r.roomObj.id));
      const roomNumbersToOccupy = new Set(roomRowsCalculated.map((r) => r.roomObj.number));

      try {
        const rawRoomsV2 = localStorage.getItem('hotel_rooms_setup_v2');
        if (rawRoomsV2) {
          const parsed = JSON.parse(rawRoomsV2);
          const updatedRooms = parsed.map((r: any) =>
            roomIdsToOccupy.has(r.id) || roomNumbersToOccupy.has(r.number)
              ? { ...r, operationalStatus: 'OCCUPIED', status: 'OCCUPIED' }
              : r
          );
          localStorage.setItem('hotel_rooms_setup_v2', JSON.stringify(updatedRooms));
        }
      } catch (err) {
        console.warn('Failed to update room status in hotel_rooms_setup_v2', err);
      }

      try {
        const rawRoomsV1 = localStorage.getItem('hotel_rooms_setup');
        if (rawRoomsV1) {
          const parsed = JSON.parse(rawRoomsV1);
          const updatedRooms = parsed.map((r: any) =>
            roomIdsToOccupy.has(r.id) || roomNumbersToOccupy.has(r.number)
              ? { ...r, status: 'OCCUPIED', operationalStatus: 'OCCUPIED' }
              : r
          );
          localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedRooms));
        }
      } catch (err) {
        console.warn('Failed to update room status in hotel_rooms_setup', err);
      }

      window.dispatchEvent(new Event('storage'));
    }

    // 3. Print Registration Card (if print checkbox is ticked) and celebrate check-in
    if (printRegCard) {
      setSelectedBookingForRegCard(primaryBooking);
      toast.celebrate('Check-In Confirmed!', `Room(s) ${allRoomNumbersStr} now Occupied by ${guestName.trim()}. Registration card is printing.`);
      setTimeout(() => {
        try {
          window.print();
        } catch { }
      }, 400);
    } else {
      toast.celebrate('Check-In Confirmed!', `Room(s) ${allRoomNumbersStr} now Occupied by ${guestName.trim()}. Key Card ${keyCardNumber} issued.`);
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
    <div className="space-y-4 max-w-7xl mx-auto pb-16 select-none font-sans text-slate-800 dark:text-slate-100">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="check-in" />

      {/* Main Check-In Container Card (Matches Book Now Design Pattern 100%) */}
      <div className="bg-surface-card dark:bg-surface-card rounded-[4px] border border-border-default dark:border-border-default shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card gap-3">
          <div className="flex items-center gap-3">
            <div>
<h1 className="text-lg font-bold tracking-tight text-body dark:text-body font-heading">
  Guest Check-In
</h1>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Check-In Form vs Arrivals Manifest */}
            <div className="inline-flex rounded border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold cursor-pointer transition-all',
                  activeTab === 'FORM'
                    ? 'bg-brand text-white shadow-2xs dark:bg-brand'
                    : 'text-muted dark:text-muted hover:bg-surface-muted'
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
                    ? 'bg-brand text-white shadow-2xs dark:bg-brand'
                    : 'text-muted dark:text-muted hover:bg-surface-muted'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Arrivals Manifest ({stats.pendingToday})</span>
              </button>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* VIEW 1: THE CHECK-IN FORM                                       */}
        {/* =============================================================== */}
        {activeTab === 'FORM' && (
          <div className="p-6 lg:p-8 space-y-8">
            {/* SEARCH RESERVATION TO AUTO-FILL */}
            <div className="space-y-2 max-w-sm">
              <label className="block mb-1 text-xs font-bold text-muted dark:text-muted">
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
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-border-default dark:border-border-default text-xs font-medium text-body dark:text-body outline-none focus:border-brand transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {showSearchSuggestions && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card shadow-xl overflow-hidden divide-y divide-border-default dark:divide-border-default max-h-60 overflow-y-auto">
                    {searchResults.map((b) => {
                      const fin = getBookingFinancials(b);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleSelectReservationToAutoFill(b)}
                          className="p-3 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-body dark:text-body flex items-center gap-2">
                              <span>{b.guest.firstName} {b.guest.lastName}</span>
                              <span className="font-mono text-muted">({b.bookingCode})</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-muted dark:bg-surface-card text-body dark:text-body">
                                Room {b.room.number}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {b.guest.phone} · {b.checkIn} to {b.checkOut} ({b.nights}n)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-body dark:text-body block">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-success-subtle/90 via-success-subtle/50 to-white dark:from-success-subtle/40 dark:via-success-subtle/20 dark:to-surface-card border-success/80 dark:border-success/60 shadow-xs transition-all">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-8 h-8 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-success text-white font-mono font-bold text-[11px] tracking-wide shadow-xs">
                        {linkedBooking.bookingCode}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {linkedBooking.guest.firstName} {linkedBooking.guest.lastName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-muted font-medium">
                        · Room <strong className="text-slate-700 dark:text-slate-200">{linkedBooking.room.number}</strong>
                      </span>
                      {advancePaidAtBooking > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success-subtle/90 dark:bg-success-subtle/60 text-success dark:text-success font-bold text-[11px] border border-success/60 dark:border-success/40">
                          Advance Paid: Rs. {advancePaidAtBooking.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-surface-card/90 dark:bg-surface-card text-xs font-semibold text-muted dark:text-muted hover:text-danger dark:hover:text-danger hover:border-danger dark:hover:border-danger hover:bg-danger-subtle/50 dark:hover:bg-danger-subtle/20 transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto whitespace-nowrap"
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

                {/* Stay Schedule: Check-in Date, Time & Check-out Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Check-in date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => handleCheckInDateChange(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs font-medium text-body dark:text-body outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Actual Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Check-out date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs font-medium text-body dark:text-body outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Adults & Children Count */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Key Card No.</span>
                    </label>
                    <input
                      type="text"
                      value={keyCardNumber}
                      onChange={(e) => setKeyCardNumber(e.target.value)}
                      placeholder="KC-101"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs text-body dark:text-body outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1 flex items-center gap-1">
                      <Luggage className="w-3.5 h-3.5 text-slate-500" />
                      <span>Luggage Pieces</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={luggageCount}
                      onChange={(e) => setLuggageCount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs text-body dark:text-body outline-none focus:border-brand"
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Guest name <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Full name"
                        className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Phone number <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full h-9 pl-9 pr-3 rounded-[3px] border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
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
                  <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="Street address, city"
                    className="w-full h-9 px-3 rounded-[3px] border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
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
                      ID Document Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="ID number"
                      className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs text-body dark:text-body outline-none focus:border-brand"
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

                {/* ID Document Photos & Multi-Scan Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#0B3D32]" />
                      <span>ID Document Photos ({idDocumentPhotos.length})</span>
                    </label>
                    <label className="px-2.5 py-1 rounded border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#093027] hover:border-[#0B3D32] cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-2xs">
                      <UploadCloud className="w-3.5 h-3.5 text-[#0B3D32]" />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleUploadPhotos(e.target.files)}
                      />
                    </label>
                  </div>

                  {idDocumentPhotos.length === 0 ? (
                    <label className="border-2 border-dashed border-slate-200 dark:border-[#145447] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#0B3D32] hover:bg-blue-50/20 dark:hover:bg-[#093027]/30 transition-all group">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1.5 text-muted group-hover:text-[#0B3D32] group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition-colors">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Click or select to upload multiple document photos
                      </span>
                      <span className="text-[10px] text-muted mt-0.5">
                        Upload ID front side, back side, passport, or visa photos (PNG, JPG, WEBP, PDF)
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleUploadPhotos(e.target.files)}
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {idDocumentPhotos.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className="relative group rounded border border-slate-200 dark:border-[#145447] bg-slate-50 dark:bg-[#093027]/40 p-2 flex items-center gap-2 overflow-hidden hover:border-[#0B3D32] transition-colors"
                          >
                            {doc.dataUrl && doc.dataUrl.startsWith('data:image') ? (
                              <img
                                src={doc.dataUrl}
                                alt={doc.name}
                                className="w-9 h-9 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-white"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded bg-blue-50 dark:bg-blue-950/40 text-[#0B3D32] flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                                <FileCheck className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.name}>
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-muted block font-mono">
                                Photo #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              {doc.dataUrl && doc.dataUrl.startsWith('data:image') && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto(doc)}
                                  title="View Photo"
                                  className="text-muted hover:text-[#0B3D32] p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(doc.id)}
                                title="Delete Photo"
                                className="text-muted hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {idDocumentPhotos.length} photo(s) attached
                        </span>
                        <label className="text-[#0B3D32] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add more photos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleUploadPhotos(e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  )}
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
                      Vehicle Number
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
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
                    <label className="block text-xs font-medium text-muted dark:text-muted mb-1">
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
                            className="text-muted hover:text-rose-600 cursor-pointer ml-2 shrink-0"
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
                      className="h-8 px-3 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all dark:bg-[#0B3D32] cursor-pointer shrink-0"
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
                <Bed className="w-4 h-4 text-[#0B3D32] dark:text-[#8AB4F8]" />
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
                      <th className="py-2 px-3 min-w-[160px] border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                        ROOM CATEGORY
                      </th>
                      <th className="py-2 px-3 min-w-[220px] border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                        ASSIGNED ROOM
                      </th>
                      <th className="py-2 px-2 text-center w-20 border-r border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
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
                      {roomItems.length > 1 && (
                        <th className="py-2 px-2 text-center w-12 border-l border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                          ACTION
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-[#071F1A]">
                    {roomRowsCalculated.map((row, idx) => {
                      // Only show genuinely available & clean rooms for the selected stay dates
                      const availableRoomsForDropdown = AVAILABLE_ROOMS_CATALOG.filter((r) => {
                        return r.id === row.roomId || checkRoomAvailability(r, row.id).isAvailable;
                      });

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                          <td className="py-2 px-2.5 text-center text-slate-600 dark:text-muted font-medium border-r border-slate-300 dark:border-slate-700">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">
                            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                              {row.roomObj.type}
                            </div>
                            <div className="text-[10px] text-muted dark:text-slate-500">
                              {row.roomObj.acType} · {row.roomObj.bedType}
                            </div>
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 dark:border-slate-700">
                            <select
                              value={row.roomId}
                              onChange={(e) => handleSelectRoomInRow(row.id, e.target.value)}
                              className="w-full h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xs bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer font-medium"
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
                          <td className="py-2 px-2 border-r border-slate-300 dark:border-slate-700">
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={row.guestsCount}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                                handleUpdateRoomRow(row.id, { guestsCount: val });
                              }}
                              className="w-full h-7 text-center font-mono text-xs bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                            />
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 dark:border-slate-700">
                            <input
                              type="number"
                              min={0}
                              value={row.rate === 0 ? '' : row.rate}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                                handleUpdateRoomRow(row.id, { rate: val });
                              }}
                              className="w-full h-7 px-2 text-right font-mono text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xs outline-none focus:bg-white dark:focus:bg-[#071F1A] focus:border-slate-400"
                            />
                          </td>
                          <td className="py-2 px-2.5 text-center text-xs text-slate-800 dark:text-slate-200 font-mono border-r border-slate-300 dark:border-slate-700">
                            {nights}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-300 dark:border-slate-700">
                            <input
                              type="number"
                              min={0}
                              value={row.discount === 0 ? '' : row.discount}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                                handleUpdateRoomRow(row.id, { discount: val });
                              }}
                              placeholder="0"
                              className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xs outline-none focus:border-slate-400"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <div className="w-full h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xs tabular-nums">
                              {row.total.toLocaleString()}
                            </div>
                          </td>
                          {roomItems.length > 1 && (
                            <td className="py-2 px-2 text-center border-l border-slate-300 dark:border-slate-700">
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
                    <tfoot className="bg-[#FAFBF9] dark:bg-[#061B16] font-semibold text-xs border-t-2 border-slate-300 dark:border-slate-600">
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-700"
                        >
                          Total
                        </td>
                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 font-mono">
                          {totalGuests}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700"></td>
                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 font-mono">
                          {nights}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-r border-slate-300 dark:border-slate-700">
                          {totalDiscount > 0 ? `Rs. ${totalDiscount.toLocaleString()}` : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-[#0B3D32] dark:text-blue-400 tabular-nums">
                          Rs. {totalPayable.toLocaleString()}
                        </td>
                        <td className="border-l border-slate-300 dark:border-slate-700"></td>
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
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xs border border-[#0B3D32] text-[#0B3D32] dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-[#0F172A] shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>
            </div>

            {/* ===============================================================
                SECTION 5: BILLING & SETTLEMENT (Boxed Container Matching Image 2)
                =============================================================== */}
            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0B3D32] dark:text-[#8AB4F8]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Billing & Settlement
                </h2>
              </div>

              {/* The Reference Pattern Card (Box ONLY Here) */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-[#071F1A] space-y-3.5 shadow-2xs">
                {/* Row 1: Basic Total, Dis %, Dis Amt, Tax Amt(3%), Round off, Net Amount */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
                      Basic Total
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      {subtotal.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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
                      className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#061B16] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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
                      className="w-full h-7 px-2 text-right font-mono text-xs bg-white dark:bg-[#061B16] border border-slate-300 dark:border-slate-600 rounded-xs text-slate-900 dark:text-white outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
                      Tax Amt(3%)
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      0.00
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
                      Round off
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      0.00
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
                      Ref. Due
                    </label>
                    <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-slate-900 dark:text-white rounded-xs border border-slate-200 dark:border-slate-700 tabular-nums">
                      {dueAmountAtCheckout.toLocaleString()}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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

                  <div className="lg:col-span-5">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-muted mb-1">
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
                </div>
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
                      ? 'bg-[#0B3D32] text-white dark:bg-[#0B3D32]'
                      : 'bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#334155] text-slate-700 dark:text-slate-300'
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
                      ? 'bg-[#0B3D32] text-white dark:bg-[#0B3D32]'
                      : 'bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#334155] text-slate-700 dark:text-slate-300'
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
                      ? 'bg-[#0B3D32] text-white dark:bg-[#0B3D32]'
                      : 'bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#CBD5E1] dark:border-[#334155] text-slate-700 dark:text-slate-300'
                  )}
                >
                  All Manifest
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
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
                      <td colSpan={8} className="py-12 text-center text-muted">
                        No bookings found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    manifestList.map((booking, idx) => {
                      const fin = getBookingFinancials(booking);
                      const isCheckedIn = booking.status === 'CHECKED_IN';

                      return (
                        <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-[#093027]/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-muted border-r border-slate-200 dark:border-[#145447]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#0B3D32] dark:text-[#8AB4F8] border-r border-slate-200 dark:border-[#334155]">
                            {booking.bookingCode}
                          </td>
                          <td className="py-2.5 px-4 border-r border-slate-200 dark:border-[#334155]">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {booking.guest.firstName} {booking.guest.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {booking.guest.phone} · ID: {booking.guest.idNumber || 'Verified'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#334155]">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {booking.checkIn} → {booking.checkOut}
                            </div>
                            <div className="text-[10px] text-muted flex items-center gap-1.5">
                              <span>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span>
                              {booking.checkInTime && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-slate-600 dark:text-slate-300">In: {booking.checkInTime}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-[#334155]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Room {booking.room.number}
                            </span>
                            <span className="text-[11px] text-muted block">{booking.room.type}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right border-r border-slate-200 dark:border-[#334155]">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              Rs. {fin.totalCharges.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Adv: Rs. {fin.totalPaid.toLocaleString()}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-[#334155]">
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
                                className="px-3 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-[#0B3D32] cursor-pointer shadow-2xs"
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
                    <span className="text-slate-500 text-[10px] block uppercase">Arrival Date & Time:</span>
                    <strong>{b.checkIn} {b.checkInTime ? `(${b.checkInTime})` : ''}</strong>
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
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0B3D32] text-white text-xs font-bold cursor-pointer hover:bg-[#093027]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Registration Card</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-2xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] shadow-2xl p-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#145447] mb-3">
              <span className="font-bold text-sm truncate pr-2">{previewPhoto.name}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-muted hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-auto rounded bg-slate-950/5 dark:bg-black/40 p-2">
              <img
                src={previewPhoto.dataUrl}
                alt={previewPhoto.name}
                className="max-h-[65vh] w-auto max-w-full rounded object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
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

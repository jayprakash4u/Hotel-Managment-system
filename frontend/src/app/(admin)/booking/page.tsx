'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
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
  Building2,
  Compass,
  UploadCloud,
  FileCheck,
  Trash2,
  Plus,
  Receipt,
  UserPlus,
  CheckCircle2,
  Sparkles,
  Award,
  Percent,
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
  AccompanyingGuest,
  doDatesOverlap,
  RegisteredGuest,
  DEFAULT_GUESTS,
} from '../reservations/reservationsData';
import { INITIAL_GUEST_360_PROFILES } from '@/lib/guest360Data';
import { useMasterOptions } from '@/lib/mastersData';
import { useCountryMaster } from '@/lib/countryMasterData';
import MasterSearchableSelect from '@/components/ui/MasterSearchableSelect';
import { MembershipTierBadge } from '@/components/membership/MembershipTierBadge';
import {
  BusinessPartner,
  loadBusinessPartnersFromStorage,
  saveBusinessPartnersToStorage,
  calculatePartnerCommission,
  PartnerCommission,
  loadCommissionsFromStorage,
  saveCommissionsToStorage,
  recordCorporatePaymentTransaction,
} from '@/lib/businessPartners';

// Form Room Row for multi-room bookings
interface FormRoomRow {
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
  const [guestName, setGuestName] = useState<string>('Ram Sharma');
  const [guestPhone, setGuestPhone] = useState<string>('+977 9841234567');
  const [guestEmail, setGuestEmail] = useState<string>('ram.sharma@gmail.com');
  const countryMaster = useCountryMaster();
  const [guestCountryId, setGuestCountryId] = useState<string>('c-np');
  const [guestNationality, setGuestNationality] = useState<string>('Nepali');
  const [guestCountryName, setGuestCountryName] = useState<string>('Nepal');
  const [guestVipTier, setGuestVipTier] = useState<string>('GOLD');
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

  // Business Partner Integration - Exactly 4 Booking Source Categories
  const [partnersList] = useState<BusinessPartner[]>(() => loadBusinessPartnersFromStorage());
  const [bookingSource, setBookingSource] = useState<
    'DIRECT_WALKIN' | 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL'
  >('DIRECT_WALKIN');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [paymentResponsibility, setPaymentResponsibility] = useState<'COMPANY_PAYS' | 'GUEST_PAYS' | 'SPLIT'>('COMPANY_PAYS');
  const [billingArrangement, setBillingArrangement] = useState<'COMPANY_ACCOUNT' | 'GUEST_DIRECT' | 'SPLIT_BILLING'>('COMPANY_ACCOUNT');
  const [splitCompanyAmount, setSplitCompanyAmount] = useState<number>(0);
  const [splitGuestAmount, setSplitGuestAmount] = useState<number>(0);

  // Separation of Bill Responsibility from Actual Payment Payer
  const [paymentReceivedFrom, setPaymentReceivedFrom] = useState<'COMPANY' | 'GUEST_EMPLOYEE' | 'OTHER'>('COMPANY');
  const [actualPayerName, setActualPayerName] = useState<string>('');
  const [paymentAllocatedTo, setPaymentAllocatedTo] = useState<'COMPANY_ACCOUNT' | 'GUEST_FOLIO'>('COMPANY_ACCOUNT');
  const [paymentTxReference, setPaymentTxReference] = useState<string>('');

  const selectedPartner = useMemo(() => {
    return partnersList.find((p) => p.id === selectedPartnerId) || null;
  }, [partnersList, selectedPartnerId]);

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

  // Search Guest / Returning Guest Lookup State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const [linkedBooking, setLinkedBooking] = useState<RoomBooking | null>(null);
  const [advancePaidAtBooking, setAdvancePaidAtBooking] = useState<number>(0);
  const [advanceReceiptInfo, setAdvanceReceiptInfo] = useState<string>('');

  // Search for guests who lived in our hotel earlier (Returning Guest History Lookup)
  const guestSuggestions = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return [];

    const combined: RegisteredGuest[] = [...DEFAULT_GUESTS];

    // Add registered/past CRM profiles from INITIAL_GUEST_360_PROFILES
    INITIAL_GUEST_360_PROFILES.forEach((p) => {
      const pClean = (p.phone || '').replace(/\D/g, '');
      if (!combined.some((c) => (pClean && c.phone.replace(/\D/g, '').endsWith(pClean)) || c.name.toLowerCase() === p.fullName.toLowerCase())) {
        combined.push({
          id: p.id,
          code: p.id,
          title: 'Mr.',
          name: p.fullName,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          email: p.email,
          country: p.country,
          address: p.address,
          city: p.address.split(',').pop()?.trim() || 'Kathmandu',
          idType: p.idType,
          idNumber: p.idNumber,
          vipTier: p.vipTier,
          gender: 'M',
        });
      }
    });

    // Add unique guests who lived in our hotel earlier from bookings database
    bookings.forEach((b) => {
      const bName = `${b.guest.firstName} ${b.guest.lastName}`.trim();
      const bClean = (b.guest.phone || '').replace(/\D/g, '');
      if (!combined.some((c) => (bClean && c.phone.replace(/\D/g, '').endsWith(bClean)) || c.name.toLowerCase() === bName.toLowerCase())) {
        combined.push({
          id: b.id,
          code: `P${b.bookingCode.replace(/\D/g, '').slice(-4) || '100'}`,
          title: 'Mr.',
          name: bName,
          firstName: b.guest.firstName,
          lastName: b.guest.lastName,
          phone: b.guest.phone || '',
          email: b.guest.email || '',
          country: b.guest.country || 'Nepal',
          address: b.guest.address || '',
          city: b.guest.city || '',
          idType: b.guest.idType || '',
          idNumber: b.guest.idNumber || '',
          vipTier: (b.guest as any).vipTier || ((b.guest as any).isVip ? 'VIP' : 'MEMBER'),
          gender: 'M',
        });
      }
    });

    const cleanQ = q.replace(/[\s\-\+]/g, '');

    return combined.filter((g) => {
      const fName = (g.firstName || '').toLowerCase();
      const lName = (g.lastName || '').toLowerCase();
      const fullName = (g.name || '').toLowerCase();
      const email = (g.email || '').toLowerCase();
      const code = (g.code || g.id || '').toLowerCase();
      const phoneClean = (g.phone || '').replace(/[\s\-\+]/g, '').toLowerCase();

      return (
        fullName.includes(q) ||
        fName.includes(q) ||
        lName.includes(q) ||
        email.includes(q) ||
        code.includes(q) ||
        (cleanQ && phoneClean.includes(cleanQ))
      );
    });
  }, [searchQuery, bookings]);

  const handleNationalityChange = (val: string) => {
    const match = countryMaster.findCountry(val);
    if (match) {
      setGuestCountryId(match.id);
      setGuestNationality(match.nationalityName);
      setGuestCountryName(match.countryName);
    } else {
      setGuestCountryId(val);
      setGuestNationality(val);
      setGuestCountryName(val);
    }
  };

  // When a returning guest is selected: only auto-fill their contact & KYC profile!
  // NEVER touch advance payment, stay dates, or room allocations for the new booking!
  const handleSelectGuestSuggestion = (g: RegisteredGuest) => {
    setGuestName(g.name);
    setGuestPhone(g.phone);
    if (g.email) setGuestEmail(g.email);
    if (g.countryId) {
      setGuestCountryId(g.countryId);
      const match = countryMaster.findCountry(g.countryId);
      if (match) {
        setGuestNationality(match.nationalityName);
        setGuestCountryName(match.countryName);
      }
    } else if (g.country || g.nationality) {
      const query = g.nationality || g.country || '';
      const match = countryMaster.findCountry(query);
      if (match) {
        setGuestCountryId(match.id);
        setGuestNationality(match.nationalityName);
        setGuestCountryName(match.countryName);
      } else {
        setGuestNationality(query);
        setGuestCountryName(g.country || query);
      }
    }
    if (g.address) setGuestAddress(g.address);
    if (g.city) setGuestCity(g.city);
    if (g.idType) setIdType(g.idType);
    if (g.idNumber) setIdNumber(g.idNumber);
    if (g.vipTier) {
      const v = g.vipTier.toUpperCase();
      if (v.includes('PLATINUM')) setGuestVipTier('PLATINUM');
      else if (v.includes('GOLD')) setGuestVipTier('GOLD');
      else if (v.includes('SILVER')) setGuestVipTier('SILVER');
      else if (v.includes('VIP')) setGuestVipTier('VIP');
      else setGuestVipTier('REGULAR');
    } else {
      setGuestVipTier('REGULAR');
    }
    setApplyMemberDiscountAtBooking(false); // ALWAYS unchecked by default!
    setSearchQuery('');
    setShowSearchSuggestions(false);
    toast.success('Returning Guest Loaded', `${g.name} (${g.phone}) profile details loaded.`);
  };

  // Only used when editing a specific reservation via URL query param: ?id=bk-1001
  const handleLoadParamBookingForEdit = (b: RoomBooking) => {
    setLinkedBooking(b);
    setGuestName(`${b.guest.firstName} ${b.guest.lastName}`.trim());
    setGuestPhone(b.guest.phone || '');
    setGuestEmail(b.guest.email || '');
    setGuestAddress(b.guest.address || 'Kathmandu, Nepal');
    if (b.guest.countryId) {
      setGuestCountryId(b.guest.countryId);
      const match = countryMaster.findCountry(b.guest.countryId);
      if (match) {
        setGuestNationality(match.nationalityName);
        setGuestCountryName(match.countryName);
      }
    } else if (b.guest.country || b.guest.nationality) {
      const query = b.guest.nationality || b.guest.country || '';
      const match = countryMaster.findCountry(query);
      if (match) {
        setGuestCountryId(match.id);
        setGuestNationality(match.nationalityName);
        setGuestCountryName(match.countryName);
      } else {
        setGuestNationality(query);
        setGuestCountryName(b.guest.country || query);
      }
    } else {
      setGuestNationality('');
    }
    if (b.guest.city) setGuestCity(b.guest.city);
    if (b.guest.vipTier) {
      const v = b.guest.vipTier.toUpperCase();
      if (v.includes('PLATINUM')) setGuestVipTier('PLATINUM');
      else if (v.includes('GOLD')) setGuestVipTier('GOLD');
      else if (v.includes('SILVER')) setGuestVipTier('SILVER');
      else if (v.includes('VIP')) setGuestVipTier('VIP');
      else setGuestVipTier('REGULAR');
    }
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

    // Restore saved booking source and partner when editing an existing reservation
    if (b.bookingSource) {
      const src = b.bookingSource;
      const normalizedSource: 'DIRECT_WALKIN' | 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL' =
        src === 'CORPORATE'
          ? 'CORPORATE'
          : src === 'TRAVEL_AGENT'
          ? 'TRAVEL_AGENT'
          : src === 'INDIVIDUAL_REFERRAL'
          ? 'INDIVIDUAL_REFERRAL'
          : 'DIRECT_WALKIN';
      setBookingSource(normalizedSource);

      if (b.partnerId && normalizedSource !== 'DIRECT_WALKIN') {
        setSelectedPartnerId(b.partnerId);
      } else {
        setSelectedPartnerId('');
      }

      if (normalizedSource === 'CORPORATE') {
        if (b.billingArrangement) {
          const arr = b.billingArrangement;
          setBillingArrangement(
            arr === 'GUEST_DIRECT' || arr === 'GUEST_PAYS'
              ? 'GUEST_DIRECT'
              : arr === 'SPLIT_BILLING' || arr === 'SPLIT'
              ? 'SPLIT_BILLING'
              : 'COMPANY_ACCOUNT'
          );
        } else if (b.paymentResponsibility) {
          setBillingArrangement(
            b.paymentResponsibility === 'GUEST_PAYS'
              ? 'GUEST_DIRECT'
              : b.paymentResponsibility === 'SPLIT'
              ? 'SPLIT_BILLING'
              : 'COMPANY_ACCOUNT'
          );
        }
        if (b.splitCompanyAmount !== undefined) setSplitCompanyAmount(b.splitCompanyAmount);
        if (b.splitGuestAmount !== undefined) setSplitGuestAmount(b.splitGuestAmount);
      }
    } else {
      setBookingSource('DIRECT_WALKIN');
      setSelectedPartnerId('');
    }

    // Calculate advance paid
    const fin = getBookingFinancials(b);
    const totalPaid = (b.payments || []).reduce((sum, p) => sum + p.amount, 0);
    setAdvancePaidAtBooking(totalPaid || fin.totalPaid || 0);
    if (b.payments && b.payments[0]) {
      setAdvanceReceiptInfo(`Receipt #${b.payments[0].receiptNo} (${b.payments[0].method})`);
    }
  };

  // Handle Booking Source Change (Segment Switcher)
  const handleBookingSourceChange = (src: 'DIRECT_WALKIN' | 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL') => {
    setBookingSource(src);
    setSelectedPartnerId('');

    if (src === 'DIRECT_WALKIN') {
      setBillingArrangement('GUEST_DIRECT');
      setPaymentResponsibility('GUEST_PAYS');
      setPaymentAllocatedTo('GUEST_FOLIO');
      setPaymentReceivedFrom('GUEST_EMPLOYEE');
      setActualPayerName(guestName.trim());
    } else if (src === 'CORPORATE') {
      setBillingArrangement('COMPANY_ACCOUNT');
      setPaymentResponsibility('COMPANY_PAYS');
      setPaymentAllocatedTo('COMPANY_ACCOUNT');
      setPaymentReceivedFrom('COMPANY');
    } else {
      setBillingArrangement('GUEST_DIRECT');
      setPaymentResponsibility('GUEST_PAYS');
      setPaymentAllocatedTo('GUEST_FOLIO');
      setPaymentReceivedFrom('GUEST_EMPLOYEE');
      setActualPayerName(guestName.trim());
    }
  };

  // Handle Business Partner Selection
  const handlePartnerSelect = (pId: string) => {
    setSelectedPartnerId(pId);
    const p = partnersList.find((x) => x.id === pId);
    if (p) {
      if (bookingSource === 'CORPORATE') {
        const defArr = p.defaultBillingArrangement || p.defaultPaymentResponsibility || 'COMPANY_ACCOUNT';
        const normalizedArr =
          defArr === 'GUEST_PAYS' || defArr === 'GUEST_DIRECT'
            ? 'GUEST_DIRECT'
            : defArr === 'SPLIT' || defArr === 'SPLIT_BILLING'
            ? 'SPLIT_BILLING'
            : 'COMPANY_ACCOUNT';
        setBillingArrangement(normalizedArr);
        setPaymentResponsibility(
          normalizedArr === 'GUEST_DIRECT' ? 'GUEST_PAYS' : normalizedArr === 'SPLIT_BILLING' ? 'SPLIT' : 'COMPANY_PAYS'
        );
        setSplitCompanyAmount(subtotal);
        setSplitGuestAmount(Math.max(0, totalPayable - subtotal));
        setActualPayerName(p.partnerName);
        setPaymentAllocatedTo('COMPANY_ACCOUNT');

        if (p.negotiatedDiscountPercent && p.negotiatedDiscountPercent > 0) {
          toast.info('Corporate Discount', `${p.negotiatedDiscountPercent}% discount applied to selected rooms.`);
        }
      } else {
        setActualPayerName(guestName.trim());
        setPaymentAllocatedTo('GUEST_FOLIO');
        setPaymentReceivedFrom('GUEST_EMPLOYEE');
      }
    }
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

  // Manual membership discount checkbox (unchecked by default per business rules)
  const [applyMemberDiscountAtBooking, setApplyMemberDiscountAtBooking] = useState<boolean>(false);
  const memberDiscountRate = useMemo(() => {
    if (guestVipTier === 'PLATINUM') return 15;
    if (guestVipTier === 'GOLD') return 10;
    if (guestVipTier === 'SILVER') return 5;
    return 0;
  }, [guestVipTier]);

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
        handleLoadParamBookingForEdit(b);
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
    setGuestCountryId('');
    setGuestNationality('');
    setGuestCountryName('');
    setGuestVipTier('REGULAR');
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

    // Validate partner selection for non-direct sources
    if (bookingSource !== 'DIRECT_WALKIN' && !selectedPartnerId) {
      const partnerRole =
        bookingSource === 'CORPORATE'
          ? 'Corporate Company'
          : bookingSource === 'TRAVEL_AGENT'
          ? 'Travel Agent'
          : 'Individual Referral Partner';
      toast.error('Partner Required', `Please select an active ${partnerRole} for this reservation.`);
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
          receivedFrom: bookingSource === 'CORPORATE' ? paymentReceivedFrom : 'GUEST_EMPLOYEE',
          payerName: bookingSource === 'CORPORATE' ? (actualPayerName.trim() || guestName) : guestName,
          allocatedTo: bookingSource === 'CORPORATE' ? paymentAllocatedTo : 'GUEST_FOLIO',
          transactionReference: paymentTxReference.trim() || undefined,
          notes:
            bookingSource === 'CORPORATE' && paymentAllocatedTo === 'COMPANY_ACCOUNT' && actualPayerName && actualPayerName !== selectedPartner?.partnerName
              ? `Advance deposit collected from ${actualPayerName} on behalf of ${selectedPartner?.partnerName}`
              : (shouldCheckInNow ? 'Check-in desk payment received' : 'Advance deposit received at booking'),
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
          country: guestCountryName || guestNationality || 'Nepal',
          countryId: guestCountryId || undefined,
          nationality: guestNationality || 'Nepali',
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
          vipTier: (guestVipTier as any) || linkedBooking?.guest.vipTier || 'STANDARD',
        },
        cafeOrders: isPrimary ? (linkedBooking?.cafeOrders || []) : [],
        payments: paymentRecords,
        bookingHistory: isPrimary ? (linkedBooking?.bookingHistory || []) : [],
        notes: bookingNotes.trim()
          ? `${bookingNotes.trim()}${roomRowsCalculated.length > 1 ? ` (Room ${idx + 1} of ${roomRowsCalculated.length})` : ''}`
          : (roomRowsCalculated.length > 1 ? `Room ${idx + 1} of ${roomRowsCalculated.length}` : undefined),
        keyCardNumber: `KC-${rowItem.roomObj.number}-A`,
        luggageCount: isPrimary ? luggageCount : 0,
        bookingAgent: bookingSource !== 'DIRECT_WALKIN' && selectedPartner ? `${selectedPartner.partnerName} (${selectedPartner.partnerCode})` : bookingAgent,
        bookingSource,
        partnerId: bookingSource !== 'DIRECT_WALKIN' ? selectedPartner?.id : undefined,
        partnerCode: bookingSource !== 'DIRECT_WALKIN' ? selectedPartner?.partnerCode : undefined,
        partnerName: bookingSource !== 'DIRECT_WALKIN' ? selectedPartner?.partnerName : undefined,
        partnerType: bookingSource !== 'DIRECT_WALKIN' ? selectedPartner?.partnerType : undefined,
        billingArrangement: bookingSource === 'CORPORATE' ? billingArrangement : undefined,
        paymentResponsibility: bookingSource === 'CORPORATE' ? paymentResponsibility : undefined,
        splitCompanyAmount: bookingSource === 'CORPORATE' && billingArrangement === 'SPLIT_BILLING' ? splitCompanyAmount : undefined,
        splitGuestAmount: bookingSource === 'CORPORATE' && billingArrangement === 'SPLIT_BILLING' ? splitGuestAmount : undefined,
        negotiatedRate: bookingSource === 'CORPORATE' ? selectedPartner?.negotiatedRoomRate : undefined,
        calculatedCommission: (bookingSource === 'TRAVEL_AGENT' || bookingSource === 'INDIVIDUAL_REFERRAL') && selectedPartner?.commissionEnabled
          ? calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights)
          : 0,
      };
    });

    // Record Partner Commission for Travel Agents and Individual Referrals
    if (
      (bookingSource === 'TRAVEL_AGENT' || bookingSource === 'INDIVIDUAL_REFERRAL') &&
      selectedPartner &&
      selectedPartner.commissionEnabled
    ) {
      const commAmt = calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights);
      if (commAmt > 0) {
        const commRec: PartnerCommission = {
          id: `comm_${Date.now()}`,
          partnerId: selectedPartner.id,
          partnerCode: selectedPartner.partnerCode,
          partnerName: selectedPartner.partnerName,
          partnerType: selectedPartner.partnerType,
          reservationId: createdBookings[0].id,
          bookingCode: createdBookings[0].bookingCode,
          guestName: guestName.trim(),
          checkIn: checkInDate,
          checkOut: checkOutDate,
          roomNights: nights,
          roomRate: roomRowsCalculated[0]?.rate || roomRowsCalculated[0]?.roomObj.pricePerNight || 0,
          eligibleAmount: subtotal,
          commissionType: selectedPartner.commissionType,
          commissionRate: selectedPartner.commissionValue,
          commissionAmount: commAmt,
          calculationBasis: selectedPartner.commissionBasis,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        const allComms = loadCommissionsFromStorage();
        saveCommissionsToStorage([commRec, ...allComms]);

        // Update partner aggregate numbers
        const allPartners = loadBusinessPartnersFromStorage();
        const updatedAll = allPartners.map((p) =>
          p.id === selectedPartner.id
            ? {
                ...p,
                totalBookings: p.totalBookings + 1,
                totalCommissionEarned: p.totalCommissionEarned + commAmt,
                outstandingCommission: p.outstandingCommission + commAmt,
                updatedAt: new Date().toISOString(),
              }
            : p
        );
        saveBusinessPartnersToStorage(updatedAll);
      }
    } else if (selectedPartner && bookingSource === 'CORPORATE') {
      const allPartners = loadBusinessPartnersFromStorage();
      const billedToCompany =
        billingArrangement === 'COMPANY_ACCOUNT' || paymentResponsibility === 'COMPANY_PAYS'
          ? totalPayable
          : billingArrangement === 'SPLIT_BILLING' || paymentResponsibility === 'SPLIT'
          ? (splitCompanyAmount || subtotal)
          : 0;

      const advanceCreditedToCompany =
        paidNow > 0 && paymentAllocatedTo === 'COMPANY_ACCOUNT' ? paidNow : 0;
      const netReceivableAddition = Math.max(0, billedToCompany - advanceCreditedToCompany);

      const updatedAll = allPartners.map((p) =>
        p.id === selectedPartner.id
          ? {
              ...p,
              totalBookings: p.totalBookings + 1,
              corporateReceivableBalance: p.corporateReceivableBalance + netReceivableAddition,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      saveBusinessPartnersToStorage(updatedAll);

      // Record in corporate statement if an advance payment was allocated to company account
      if (advanceCreditedToCompany > 0) {
        recordCorporatePaymentTransaction({
          partnerId: selectedPartner.id,
          amount: advanceCreditedToCompany,
          paymentMethod: paymentMethod === 'PAY_LATER' ? 'CASH' : paymentMethod,
          referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
          reservationCode: createdBookings[0].bookingCode,
          guestName: guestName.trim(),
          actualPayerName: actualPayerName.trim() || guestName.trim(),
          receivedFrom: paymentReceivedFrom,
          notes: 'Advance deposit received at reservation creation',
        });
      }
    }

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
    <div className="space-y-4 w-full min-w-0 pb-16 select-none font-sans text-body dark:text-slate-100">
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

            <BackButton
              onClick={handleBackNavigation}
              label="Back"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* TOP BAR: BOOKING CATEGORY (DIRECT, CORPORATE, TRAVEL AGENT, REFERRAL) & RETURNING GUEST SEARCH */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-border-default dark:border-border-default">
            {/* Booking Type Segment: Direct/Walk-in | Corporate | Travel Agent | Referral */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted dark:text-neutral-400">
                Booking Type
              </label>
              <div className="inline-flex rounded-lg border border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card p-1 gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleBookingSourceChange('DIRECT_WALKIN')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                    bookingSource === 'DIRECT_WALKIN'
                      ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Direct / Walk-in</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingSourceChange('CORPORATE')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                    bookingSource === 'CORPORATE'
                      ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Corporate / Company</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingSourceChange('TRAVEL_AGENT')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                    bookingSource === 'TRAVEL_AGENT'
                      ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                  )}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Travel Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingSourceChange('INDIVIDUAL_REFERRAL')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                    bookingSource === 'INDIVIDUAL_REFERRAL'
                      ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Referral Partner</span>
                </button>
              </div>
            </div>

            {/* SEARCH GUEST WHO LIVED IN HOTEL EARLIER (GUEST HISTORY LOOKUP) */}
            <div className="space-y-1.5 w-full lg:w-80 relative">
              <label className="block text-xs font-bold text-slate-800 dark:text-neutral-200">
                Search Returning Guest
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
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchSuggestions(true);
                }}
                className="w-full h-9 pl-9 pr-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] focus:ring-1 focus:ring-[#0B3D32] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchSuggestions(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Suggestions Dropdown Table Matching App Brand Color Pattern */}
              {showSearchSuggestions && guestSuggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-[700px] max-w-[92vw] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-card shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F4F7F5] dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <th className="py-2.5 px-3">ID / Code</th>
                        <th className="py-2.5 px-3">Guest Name</th>
                        <th className="py-2.5 px-3">Mobile No</th>
                        <th className="py-2.5 px-3">Country / City</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3 text-right">VIP Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {guestSuggestions.map((g) => (
                        <tr
                          key={g.id}
                          onClick={() => handleSelectGuestSuggestion(g)}
                          className="hover:bg-[#EBF3F0] dark:hover:bg-[#1E293B] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-xs font-bold text-brand dark:text-emerald-400 bg-brand/5 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              {g.code || g.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {g.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                            {g.phone}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {g.country || g.city || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {g.email || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {g.vipTier ? (
                              <span
                                className={cn(
                                  'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                  g.vipTier.toUpperCase().includes('PLATINUM')
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                    : g.vipTier.toUpperCase().includes('GOLD')
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                    : g.vipTier.toUpperCase().includes('SILVER')
                                    ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                )}
                              >
                                {g.vipTier}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Partner & Billing Arrangement Bar (Shows when Corporate, Travel Agent, or Referral is active) */}
          {bookingSource !== 'DIRECT_WALKIN' && (
            <div className="p-3 rounded border border-border-default dark:border-border-default bg-[#F8FAFC] dark:bg-surface-card/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="w-72">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {bookingSource === 'CORPORATE' ? 'Corporate Company' : bookingSource === 'TRAVEL_AGENT' ? 'Travel Agency' : 'Referral Partner'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => handlePartnerSelect(e.target.value)}
                    className="w-full h-7.5 px-2.5 rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                  >
                    <option value="">
                      {bookingSource === 'CORPORATE' ? '— Choose Corporate Company —' : bookingSource === 'TRAVEL_AGENT' ? '— Choose Travel Agency —' : '— Choose Referral Partner —'}
                    </option>
                    {partnersList
                      .filter((p) => p.partnerType === bookingSource && p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.partnerName} ({p.partnerCode})
                        </option>
                      ))}
                  </select>
                </div>

                {bookingSource === 'CORPORATE' && selectedPartner && (
                  <div className="w-60">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Arrangement
                    </label>
                    <select
                      value={billingArrangement}
                      onChange={(e) => {
                        const val = e.target.value as 'COMPANY_ACCOUNT' | 'GUEST_DIRECT' | 'SPLIT_BILLING';
                        setBillingArrangement(val);
                        setPaymentResponsibility(
                          val === 'GUEST_DIRECT' ? 'GUEST_PAYS' : val === 'SPLIT_BILLING' ? 'SPLIT' : 'COMPANY_PAYS'
                        );
                        if (val === 'SPLIT_BILLING') {
                          setSplitCompanyAmount(subtotal);
                          setSplitGuestAmount(Math.max(0, totalPayable - subtotal));
                        }
                      }}
                      className="w-full h-7.5 px-2.5 rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                    >
                      <option value="COMPANY_ACCOUNT">Company Account (Direct Billing)</option>
                      <option value="GUEST_DIRECT">Guest Direct Payment</option>
                      <option value="SPLIT_BILLING">Split Billing</option>
                    </select>
                  </div>
                )}
              </div>

              {selectedPartner && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 pt-1 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border-default dark:border-border-default lg:pl-3">
                  {bookingSource === 'CORPORATE' ? (
                    <>
                      <div className="px-2 py-1 rounded bg-white dark:bg-surface-card border border-border-default dark:border-border-default text-[11px]">
                        Credit: <strong className="text-slate-900 dark:text-white font-semibold">{selectedPartner.creditAllowed === false ? 'No Credit' : `${selectedPartner.paymentTerms?.replace('NET_', '') || '30'} Days`}</strong>
                      </div>
                      {selectedPartner.negotiatedDiscountPercent ? (
                        <div className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                          Discount: <strong className="font-bold">{selectedPartner.negotiatedDiscountPercent}% Off</strong>
                        </div>
                      ) : null}
                      <div className="text-[11px] text-muted dark:text-neutral-400">
                        Contact: <strong className="text-slate-800 dark:text-slate-200">{selectedPartner.contactPerson || selectedPartner.phone}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                        Commission: <strong className="font-bold">{selectedPartner.commissionEnabled ? `NPR ${calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights).toLocaleString()}` : 'None'}</strong>
                      </div>
                      <div className="text-[11px] text-muted dark:text-neutral-400">
                        Contact: <strong className="text-slate-800 dark:text-slate-200">{selectedPartner.contactPerson || selectedPartner.phone}</strong>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Split Charge Input (When Split Billing is Active) */}
          {bookingSource === 'CORPORATE' && selectedPartner && billingArrangement === 'SPLIT_BILLING' && (
            <div className="p-2.5 rounded border border-border-default dark:border-border-default bg-[#F8FAFC] dark:bg-surface-card/60 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wide text-[11px]">
                Split Allocation:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Company (Room):</span>
                <input
                  type="number"
                  value={splitCompanyAmount}
                  onChange={(e) => {
                    const cAmt = Number(e.target.value);
                    setSplitCompanyAmount(cAmt);
                    setSplitGuestAmount(Math.max(0, totalPayable - cAmt));
                  }}
                  className="w-28 h-7 px-2 rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-bold font-mono text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Guest (Incidentals):</span>
                <input
                  type="number"
                  value={splitGuestAmount}
                  onChange={(e) => {
                    const gAmt = Number(e.target.value);
                    setSplitGuestAmount(gAmt);
                    setSplitCompanyAmount(Math.max(0, totalPayable - gAmt));
                  }}
                  className="w-28 h-7 px-2 rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-bold font-mono text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-between pb-2 border-b border-border-default dark:border-border-default">
                <span className="text-xs font-bold uppercase tracking-wider text-body dark:text-neutral-300">
                  Guest Information
                </span>
                {guestVipTier && guestVipTier !== 'REGULAR' && (
                  <MembershipTierBadge tierCode={guestVipTier} size="xs" />
                )}
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
                  <label className="block text-xs font-medium text-muted dark:text-neutral-400 mb-1">
                    Membership / VIP Tier
                  </label>
                  <select
                    value={guestVipTier}
                    onChange={(e) => setGuestVipTier(e.target.value)}
                    className="w-full h-9 px-3 rounded-[3px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-medium text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  >
                    <option value="REGULAR">Standard / Non-Member</option>
                    <option value="SILVER">Silver Member</option>
                    <option value="GOLD">Gold VIP</option>
                    <option value="PLATINUM">Platinum VIP</option>
                    <option value="VIP">VIP Guest</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <MasterSearchableSelect
                    label="Nationality"
                    value={guestCountryId || guestNationality}
                    onChange={handleNationalityChange}
                    options={countryMaster.options}
                    placeholder="Select Nationality"
                    searchPlaceholder="Search nationality / country..."
                    allowClear={true}
                  />
                  {countryMaster.error && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      {countryMaster.error}
                    </p>
                  )}
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
              SECTION 3: BILLING & SETTLEMENT
              =============================================================== */}
          <div className="space-y-4 pt-6 border-t border-border-default dark:border-border-default">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand dark:text-blue-400" />
                <h2 className="text-sm font-bold text-body dark:text-white tracking-tight">
                  Billing &amp; Settlement
                </h2>
              </div>
              <span className="text-[11px] text-muted dark:text-muted hidden sm:inline">
                Tariff breakdown, payment settlement &amp; corporate folio
              </span>
            </div>

            {/* The Reference Pattern Card */}
            <div className="border border-border-default dark:border-border-default rounded-lg p-5 bg-white dark:bg-surface-card space-y-4 shadow-2xs">
              {/* Membership recognition & manual discount application (Never automatic) */}
              {guestVipTier && guestVipTier !== 'REGULAR' && memberDiscountRate > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <MembershipTierBadge tierCode={guestVipTier} size="xs" />
                    <span className="text-amber-950 dark:text-amber-200 font-medium">
                      Loyalty Privilege: Guest is eligible for a <strong>{memberDiscountRate}% room fare discount</strong> (Room Tariff only).
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300 cursor-pointer select-none bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-amber-300 dark:border-amber-700 shadow-2xs hover:bg-amber-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyMemberDiscountAtBooking}
                      onChange={(e) => {
                        const willApply = e.target.checked;
                        setApplyMemberDiscountAtBooking(willApply);
                        handleBillingDisPercentChange(willApply ? memberDiscountRate : 0);
                      }}
                      className="w-4 h-4 rounded border-amber-400 text-amber-700 focus:ring-amber-600 cursor-pointer"
                    />
                    <span>Apply Membership Discount</span>
                  </label>
                </div>
              )}

              {/* Previously Paid Advance Info Banner (if linked reservation has deposit) */}
              {advancePaidAtBooking > 0 && (
                <div className="p-3 rounded-md bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Advance Previously Paid: <strong className="font-mono">Rs. {advancePaidAtBooking.toLocaleString()}</strong></span>
                    {advanceReceiptInfo && <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400">({advanceReceiptInfo})</span>}
                  </div>
                  <div className="text-body dark:text-slate-200 font-semibold">
                    Remaining Balance Due: <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">Rs. {remainingBalanceDue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Tariff Calculation Breakdown */}
              <div className="bg-slate-50/70 dark:bg-slate-800/30 p-3.5 rounded-md border border-slate-200/80 dark:border-slate-700/60">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                  {/* Basic Total */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Basic Total
                    </label>
                    <div className="h-8 px-2.5 flex items-center justify-end font-mono font-medium text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-700 tabular-nums">
                      <span className="text-slate-400 mr-1 text-[10px]">Rs.</span>
                      {subtotal.toLocaleString()}
                    </div>
                  </div>

                  {/* Dis % */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Dis %
                    </label>
                    <div className="relative">
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
                        className="w-full h-8 pl-2.5 pr-6 text-right font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
                    </div>
                  </div>

                  {/* Dis Amt */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Dis Amt (Rs.)
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
                      className="w-full h-8 px-2.5 text-right font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
                    />
                  </div>

                  {/* Tax Amt */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Tax (3%)
                    </label>
                    <div className="h-8 px-2.5 flex items-center justify-end font-mono text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 tabular-nums">
                      <span className="text-slate-400 mr-1 text-[10px]">Rs.</span>
                      0.00
                    </div>
                  </div>

                  {/* Round off */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Round off
                    </label>
                    <div className="h-8 px-2.5 flex items-center justify-end font-mono text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 tabular-nums">
                      0.00
                    </div>
                  </div>

                  {/* Net Amount */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                      Net Amount
                    </label>
                    <div className="h-8 px-2.5 flex items-center justify-end font-mono font-bold text-sm bg-slate-900 dark:bg-slate-700 text-white rounded border border-slate-900 dark:border-slate-600 tabular-nums shadow-2xs">
                      <span className="text-slate-400 mr-1 text-[11px] font-normal">Rs.</span>
                      {totalPayable.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Settlement Method & Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Option
                  </label>
                  <select
                    value={paymentChoice}
                    onChange={(e) => setPaymentChoice(e.target.value as 'FULL' | 'ADVANCE' | 'LATER')}
                    className="w-full h-8 px-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-surface-card text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300 cursor-pointer"
                  >
                    <option value="FULL">Pay Full</option>
                    <option value="ADVANCE">Advance Deposit</option>
                    <option value="LATER">Pay Later (Credit)</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      disabled={paymentChoice === 'LATER'}
                      value={paymentChoice === 'LATER' ? 0 : advancedAmount}
                      onChange={(e) => setAdvancedAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full h-8 pl-6 pr-2.5 text-right font-mono text-xs font-semibold bg-white dark:bg-surface-card border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">Rs.</span>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Balance Due
                  </label>
                  <div className={cn(
                    "h-8 px-2.5 flex items-center justify-end font-mono font-bold text-xs rounded border tabular-nums",
                    dueAmountAtCheckout > 0 
                      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  )}>
                    <span className="text-slate-400 mr-1 text-[10px] font-normal">Rs.</span>
                    {dueAmountAtCheckout.toLocaleString()}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={paymentChoice === 'LATER'}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-surface-card text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300 cursor-pointer disabled:opacity-50"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="UPI_QR">UPI / Fonepay QR</option>
                    <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Folio Note
                  </label>
                  <input
                    type="text"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Guest preferences, billing notes, or corporate instructions..."
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-surface-card text-slate-900 dark:text-white outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>



              {/* Action Buttons & Notification Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                {/* Notification Options */}
                <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-500 cursor-pointer"
                    />
                    <span className="font-medium">Send SMS Confirmation</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-500 cursor-pointer"
                    />
                    <span className="font-medium">Send Email Voucher</span>
                  </label>
                </div>

                {/* Main Action CTAs */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-8 px-3.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-medium cursor-pointer bg-white dark:bg-surface-card transition-colors"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBooking(false, false)}
                    className="h-8 px-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    Save Booking
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBooking(false, true)}
                    className="h-8 px-4 rounded border border-slate-700 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Save &amp; Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBooking(true, false)}
                    className="h-8 px-5 rounded bg-[#0B3D32] hover:bg-[#072821] text-white text-xs font-bold cursor-pointer transition-all shadow-xs hover:shadow-sm inline-flex items-center gap-1.5"
                  >
                    <span>Check In Now</span>
                    <span>&rarr;</span>
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
        <div className="w-full min-w-0 p-12 text-center text-xs text-[#879B90]">
          Loading Quick Room Booking...
        </div>
      }
    >
      <NewRoomBookingContent />
    </Suspense>
  );
}

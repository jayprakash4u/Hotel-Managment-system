'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceTabs } from '@/context/WorkspaceTabsContext';
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
  Smartphone,
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
  Users,
  UserPlus,
  CheckCircle2,
  Sparkles,
  Award,
  Percent,
  Copy,
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
  evaluateMembershipDiscountEligibility,
  calculateReservationDiscounts,
  getMembershipEligibilitySettings,
} from '@/lib/loyalty';
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
  adultsCount?: number;
  childrenCount?: number;
  occupantName?: string;
  occupantPhone?: string;
  occupant2Name?: string;
  occupant2Phone?: string;
  checkInDate?: string;
  checkOutDate?: string;
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

function formatStayDates(inStr: string, outStr: string): string {
  try {
    const parse = (str: string) => {
      const parts = str.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(str);
    };
    const inDate = parse(inStr);
    const outDate = parse(outStr);
    const inMonth = inDate.toLocaleDateString('en-US', { month: 'short' });
    const inDay = String(inDate.getDate()).padStart(2, '0');
    const outMonth = outDate.toLocaleDateString('en-US', { month: 'short' });
    const outDay = String(outDate.getDate()).padStart(2, '0');
    return `${inMonth} ${inDay} - ${outMonth} ${outDay}`;
  } catch {
    return `${inStr} - ${outStr}`;
  }
}

function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function calculateStayNights(inStr: string, outStr: string): number {
  try {
    const inDate = new Date(inStr);
    const outDate = new Date(outStr);
    const diffMs = outDate.getTime() - inDate.getTime();
    const n = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(n) ? 1 : n);
  } catch {
    return 1;
  }
}

function addDaysToDate(dateStr: string, days: number): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    }
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function NewRoomBookingContent() {
  const toast = useToast();
  const router = useRouter();
  const { openTab } = useWorkspaceTabs();
  const searchParams = useSearchParams();

  const paramBookingId = searchParams.get('bookingId');
  const paramRoomId = searchParams.get('roomId');
  const paramCheckIn = searchParams.get('checkIn');
  const paramCheckOut = searchParams.get('checkOut');
  const paramMode = searchParams.get('mode');
  const fromParam = searchParams.get('from');
  const paramSource = searchParams.get('source') || searchParams.get('bookingSource');

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

  // Business Partner & Group Integration - Booking Source Categories
  const [partnersList] = useState<BusinessPartner[]>(() => loadBusinessPartnersFromStorage());
  const [bookingSource, setBookingSource] = useState<
    'DIRECT_WALKIN' | 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL' | 'GROUP'
  >(() => {
    if (paramSource) {
      const ps = paramSource.toUpperCase();
      if (ps === 'CORPORATE') return 'CORPORATE';
      if (ps === 'TRAVEL_AGENT') return 'TRAVEL_AGENT';
      if (ps === 'GROUP') return 'GROUP';
      if (ps === 'INDIVIDUAL_REFERRAL') return 'INDIVIDUAL_REFERRAL';
      if (ps === 'DIRECT_WALKIN' || ps === 'DIRECT') return 'DIRECT_WALKIN';
    }
    return 'DIRECT_WALKIN';
  });

  // Synchronize bookingSource whenever paramSource changes (e.g. sidebar navigation to /booking)
  useEffect(() => {
    if (!paramSource) {
      setBookingSource('DIRECT_WALKIN');
      setPartnerTypeSelector('');
      setSelectedPartnerId('');
      try {
        sessionStorage.removeItem('activeBookingSource');
      } catch { }
    } else {
      const ps = paramSource.toUpperCase();
      if (ps === 'CORPORATE' || ps === 'TRAVEL_AGENT' || ps === 'GROUP' || ps === 'INDIVIDUAL_REFERRAL') {
        setBookingSource(ps as any);
        setPartnerTypeSelector(ps === 'CORPORATE' || ps === 'TRAVEL_AGENT' || ps === 'GROUP' ? ps : '');
      } else {
        setBookingSource('DIRECT_WALKIN');
        setPartnerTypeSelector('');
      }
    }
  }, [paramSource]);
  const isCorporateOrAgent = bookingSource === 'CORPORATE' || bookingSource === 'TRAVEL_AGENT' || bookingSource === 'GROUP';
  const [partnerTypeSelector, setPartnerTypeSelector] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [paymentResponsibility, setPaymentResponsibility] = useState<'COMPANY_PAYS' | 'GUEST_PAYS' | 'SPLIT'>('COMPANY_PAYS');
  const [billingArrangement, setBillingArrangement] = useState<'COMPANY_ACCOUNT' | 'GUEST_DIRECT' | 'SPLIT_BILLING' | ''>('');
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

  // Corporate Company / Travel Agency Details Form State
  const [corporateContactPerson, setCorporateContactPerson] = useState<string>('');
  const [corporateEmail, setCorporateEmail] = useState<string>('');
  const [corporatePhone, setCorporatePhone] = useState<string>('');
  const [corporatePanVat, setCorporatePanVat] = useState<string>('');
  const [corporateAddress, setCorporateAddress] = useState<string>('');
  const [corporateCity, setCorporateCity] = useState<string>('');
  const [corporateCountry, setCorporateCountry] = useState<string>('Nepal');

  useEffect(() => {
    if (selectedPartner && isCorporateOrAgent) {
      setCorporateContactPerson(selectedPartner.contactPerson || '');
      setCorporateEmail(selectedPartner.email || '');
      setCorporatePhone(selectedPartner.phone || '');
      setCorporatePanVat(selectedPartner.panVatNumber || '');
      setCorporateAddress(selectedPartner.address || '');
      setCorporateCity(selectedPartner.city || '');
      setCorporateCountry(selectedPartner.country || 'Nepal');
      const defArr = selectedPartner.defaultBillingArrangement || selectedPartner.defaultPaymentResponsibility || 'COMPANY_ACCOUNT';
      const normalizedArr: 'COMPANY_ACCOUNT' | 'GUEST_DIRECT' | 'SPLIT_BILLING' =
        defArr === 'GUEST_PAYS' || defArr === 'GUEST_DIRECT'
          ? 'GUEST_DIRECT'
          : defArr === 'SPLIT' || defArr === 'SPLIT_BILLING'
            ? 'SPLIT_BILLING'
            : 'COMPANY_ACCOUNT';
      setBillingArrangement(normalizedArr);
      setPaymentResponsibility(
        normalizedArr === 'GUEST_DIRECT' ? 'GUEST_PAYS' : normalizedArr === 'SPLIT_BILLING' ? 'SPLIT' : 'COMPANY_PAYS'
      );
    }
  }, [selectedPartner, isCorporateOrAgent]);

  // Keep active booking segment persistent across page refreshes
  useEffect(() => {
    if (typeof window !== 'undefined' && bookingSource) {
      try {
        sessionStorage.setItem('activeBookingSource', bookingSource);
        const url = new URL(window.location.href);
        if (url.searchParams.get('source') !== bookingSource) {
          url.searchParams.set('source', bookingSource);
          window.history.replaceState({}, '', url.toString());
        }
      } catch { }
    }
  }, [bookingSource]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const corporatePartners = useMemo(() => {
    return partnersList.filter(
      (p) => p.partnerType === (bookingSource === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : 'CORPORATE') && p.status === 'ACTIVE'
    );
  }, [partnersList, bookingSource]);

  const filteredCorporatePartners = useMemo(() => {
    const q = companySearchQuery.trim().toLowerCase();
    if (!q) return corporatePartners;
    return corporatePartners.filter((p) => {
      return (
        p.partnerName.toLowerCase().includes(q) ||
        p.partnerCode.toLowerCase().includes(q) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
        (p.panVatNumber && p.panVatNumber.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    });
  }, [corporatePartners, companySearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    if (isCompanyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCompanyDropdownOpen]);

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
  const handleBookingSourceChange = (src: 'DIRECT_WALKIN' | 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL' | 'GROUP') => {
    setBookingSource(src);
    setSelectedPartnerId('');
    if (src === 'CORPORATE' || src === 'TRAVEL_AGENT' || src === 'GROUP') {
      setPartnerTypeSelector(src);
    } else {
      setPartnerTypeSelector('');
    }

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (src === 'DIRECT_WALKIN') {
          sessionStorage.removeItem('activeBookingSource');
          url.searchParams.delete('source');
        } else {
          sessionStorage.setItem('activeBookingSource', src);
          url.searchParams.set('source', src);
        }
        window.history.replaceState({}, '', url.toString());
      } catch { }
    }

    if (src === 'DIRECT_WALKIN') {
      setBillingArrangement('GUEST_DIRECT');
      setPaymentResponsibility('GUEST_PAYS');
      setPaymentAllocatedTo('GUEST_FOLIO');
      setPaymentReceivedFrom('GUEST_EMPLOYEE');
      setActualPayerName(guestName.trim());
    } else if (src === 'CORPORATE' || src === 'TRAVEL_AGENT' || src === 'GROUP') {
      setBillingArrangement('');
      setPaymentResponsibility('COMPANY_PAYS');
      setPaymentAllocatedTo('COMPANY_ACCOUNT');
      setPaymentReceivedFrom('COMPANY');
      setCorporateContactPerson('');
      setCorporateEmail('');
      setCorporatePhone('');
      setCorporatePanVat('');
      setCorporateAddress('');
      setCorporateCity('');
      setCorporateCountry('Nepal');
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
      if (bookingSource === 'CORPORATE' || bookingSource === 'TRAVEL_AGENT') {
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
          toast.info('Partner Discount', `${p.negotiatedDiscountPercent}% discount applied to selected rooms.`);
        }
      } else {
        setActualPayerName(guestName.trim());
        setPaymentAllocatedTo('GUEST_FOLIO');
        setPaymentReceivedFrom('GUEST_EMPLOYEE');
      }
    } else {
      if (bookingSource === 'CORPORATE' || bookingSource === 'TRAVEL_AGENT') {
        setBillingArrangement('');
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
        adultsCount: 2,
        childrenCount: 0,
      },
    ];
  });

  // Selected Room Rows for batch management
  const [selectedRoomRowIds, setSelectedRoomRowIds] = useState<string[]>([]);
  // Row-specific stay dates editor popover state
  const [editingStayDatesRowId, setEditingStayDatesRowId] = useState<string | null>(null);

  const toggleSelectAllRoomRows = () => {
    if (selectedRoomRowIds.length === roomItems.length) {
      setSelectedRoomRowIds([]);
    } else {
      setSelectedRoomRowIds(roomItems.map((r) => r.id));
    }
  };

  const toggleSelectRoomRow = (id: string) => {
    setSelectedRoomRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Check room availability status for the selected stay dates
  // Automatically considers: booked dates, checked in / occupied, dirty rooms, and maintenance rooms
  const checkRoomAvailability = (
    room: AvailableRoomOption,
    currentRowId?: string,
    customCheckIn?: string,
    customCheckOut?: string
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
    const inD = customCheckIn || checkInDate;
    const outD = customCheckOut || checkOutDate;
    const conflictBooking = bookings.find((b) => {
      if (linkedBooking && b.id === linkedBooking.id) return false;
      if (paramBookingId && b.id === paramBookingId) return false;
      if (b.status === 'CHECKED_OUT' || b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
      if (b.room.number !== room.number) return false;
      return doDatesOverlap(b.checkIn, b.checkOut, inD, outD);
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
      const rowIn = item.checkInDate || checkInDate;
      const rowOut = item.checkOutDate || checkOutDate;
      const rowNights = calculateStayNights(rowIn, rowOut);
      const rowSubtotal = rateNum * rowNights;
      const rowTotal = Math.max(0, rowSubtotal - discountNum);
      const avail = checkRoomAvailability(roomObj, item.id, rowIn, rowOut);
      return {
        ...item,
        roomObj,
        rowIn,
        rowOut,
        rowNights,
        subtotal: rowSubtotal,
        total: rowTotal,
        isAvailable: avail.isAvailable,
        availabilityStatus: avail,
      };
    });
  }, [roomItems, nights, bookings, checkInDate, checkOutDate, linkedBooking, paramBookingId, formMode, todayStr]);

  const totalRoomNights = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + r.rowNights, 0);
  }, [roomRowsCalculated]);

  // Aggregate Totals across all room rows
  const subtotal = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + r.subtotal, 0);
  }, [roomRowsCalculated]);

  // Separate Discounts State: Corporate, Guest Membership & Manual/Promotional
  const [manualDiscountAmount, setManualDiscountAmount] = useState<number>(0);
  const [applyMemberDiscountAtBooking, setApplyMemberDiscountAtBooking] = useState<boolean>(false);

  const corporateDiscountPercent = useMemo(() => {
    return isCorporateOrAgent ? (selectedPartner?.negotiatedDiscountPercent || 0) : 0;
  }, [isCorporateOrAgent, selectedPartner]);

  // Dynamic Membership Discount Eligibility based on Booking Source and Hotel Stacking Policies
  const membershipEligibility = useMemo(() => {
    return evaluateMembershipDiscountEligibility({
      bookingSource,
      guestTierCode: guestVipTier,
      hasCorporateDiscount: corporateDiscountPercent > 0,
      hasCorporateRate: Boolean(selectedPartner?.negotiatedRoomRate),
      hasOtherPromotions: manualDiscountAmount > 0,
      eligibleSubtotal: subtotal,
    });
  }, [bookingSource, guestVipTier, corporateDiscountPercent, selectedPartner, manualDiscountAmount, subtotal]);

  // Automatically uncheck if conditions become ineligible
  useEffect(() => {
    if (!membershipEligibility.canApply && applyMemberDiscountAtBooking) {
      setApplyMemberDiscountAtBooking(false);
    }
  }, [membershipEligibility.canApply, applyMemberDiscountAtBooking]);

  // Multi-Benefit & Stacking Discount Breakdown
  const discountBreakdown = useMemo(() => {
    const settings = getMembershipEligibilitySettings();
    return calculateReservationDiscounts({
      subtotal,
      corporateDiscountPercent,
      applyMembershipDiscount: applyMemberDiscountAtBooking && membershipEligibility.canApply,
      membershipDiscountPercent: membershipEligibility.tierDiscountPercent,
      manualDiscountAmount,
      allowStackingWithCorporate: settings.allowStackWithCorporateDiscount,
    });
  }, [subtotal, corporateDiscountPercent, applyMemberDiscountAtBooking, membershipEligibility, manualDiscountAmount]);

  const totalDiscount = discountBreakdown.totalDiscountAmount;
  const totalPayable = discountBreakdown.netRoomCharges;

  const totalAdults = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + (Number(r.adultsCount ?? r.guestsCount) || 1), 0);
  }, [roomRowsCalculated]);

  const totalChildren = useMemo(() => {
    return roomRowsCalculated.reduce((sum, r) => sum + (Number(r.childrenCount) || 0), 0);
  }, [roomRowsCalculated]);

  const totalGuests = useMemo(() => {
    return totalAdults + totalChildren;
  }, [totalAdults, totalChildren]);

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

  const memberDiscountRate = useMemo(() => {
    return membershipEligibility.tierDiscountPercent;
  }, [membershipEligibility.tierDiscountPercent]);

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

  // Add New Room Modal State
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [modalCheckIn, setModalCheckIn] = useState<string>(checkInDate);
  const [modalNights, setModalNights] = useState<number>(nights || 1);
  const [modalRoomType, setModalRoomType] = useState<string>('');
  const [modalAdults, setModalAdults] = useState<number>(2);
  const [modalChildren, setModalChildren] = useState<number>(0);
  const [modalRoomCount, setModalRoomCount] = useState<number>(1);
  const modalCheckInInputRef = useRef<HTMLInputElement>(null);

  const modalAvailableRoomTypes = useMemo(() => {
    const types = new Set<string>();
    AVAILABLE_ROOMS_CATALOG.forEach((r) => {
      if (r.type) types.add(r.type);
    });
    return Array.from(types);
  }, []);

  const modalAvailableRooms = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.filter((r) => {
      if (modalRoomType && r.type !== modalRoomType) return false;
      if (roomItems.some((item) => item.roomId === r.id)) return false;
      const status = checkRoomAvailability(r);
      return status.isAvailable;
    });
  }, [modalRoomType, roomItems, checkRoomAvailability]);

  const handleOpenAddRoomModal = () => {
    setModalCheckIn(checkInDate);
    setModalNights(nights || 1);
    const initialType = AVAILABLE_ROOMS_CATALOG[0]?.type || '';
    setModalRoomType(initialType);
    const match = AVAILABLE_ROOMS_CATALOG.find((r) => r.type === initialType);
    setModalAdults(match?.maxAdults || match?.capacity || 2);
    setModalChildren(0);
    setModalRoomCount(1);
    setIsAddRoomModalOpen(true);
  };

  const handleConfirmAddRoomFromModal = () => {
    if (!modalRoomType) {
      toast.warning('Select Room Type', 'Please choose a room type.');
      return;
    }

    const countToAdd = Math.max(1, modalRoomCount || 1);
    const allOfType = AVAILABLE_ROOMS_CATALOG.filter((r) => r.type === modalRoomType);
    if (allOfType.length === 0) {
      toast.warning('Invalid Room Type', 'No rooms found for this category.');
      return;
    }

    const computedCheckOut = addDaysToDate(modalCheckIn, modalNights);
    const templateRoom = allOfType[0];
    const effectiveAdults = modalAdults > 0 ? modalAdults : (templateRoom.capacity || 2);

    const newRows: FormRoomRow[] = [];
    const usedRoomIds = new Set(roomItems.map((r) => r.roomId));

    for (let i = 0; i < countToAdd; i++) {
      // Find an available unassigned room of this type
      const assignable = allOfType.find((r) => !usedRoomIds.has(r.id) && checkRoomAvailability(r).isAvailable)
        || allOfType.find((r) => !usedRoomIds.has(r.id))
        || allOfType[i % allOfType.length];

      usedRoomIds.add(assignable.id);

      newRows.push({
        id: `row-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        roomId: assignable.id,
        rate: assignable.pricePerNight,
        discount: 0,
        guestsCount: effectiveAdults + modalChildren,
        adultsCount: effectiveAdults,
        childrenCount: modalChildren,
        checkInDate: modalCheckIn,
        checkOutDate: computedCheckOut,
        occupantName: '',
        occupantPhone: '',
      });
    }

    setRoomItems((prev) => [...prev, ...newRows]);
    toast.success(
      'Rooms Added',
      countToAdd === 1
        ? `Added 1 ${modalRoomType} room to booking.`
        : `Added ${countToAdd} ${modalRoomType} rooms to booking.`
    );
    setIsAddRoomModalOpen(false);
  };

  // Attach / Add Guest Modal State
  const [isAttachGuestsModalOpen, setIsAttachGuestsModalOpen] = useState(false);

  interface RoomGuestDraft {
    guest1Title: string;
    guest1FirstName: string;
    guest1LastName: string;
    guest1Phone: string;
    guest1PhoneType: 'PHONE' | 'MOBILE';
    guest1Id: string;
    guest2Title: string;
    guest2FirstName: string;
    guest2LastName: string;
    guest2Phone: string;
    guest2PhoneType: 'PHONE' | 'MOBILE';
    guest2Id: string;
  }

  const [guestDrafts, setGuestDrafts] = useState<Record<string, RoomGuestDraft>>({});

  const handleOpenAttachGuestsModal = () => {
    if (selectedRoomRowIds.length === 0) {
      toast.warning('Select Room Row(s)', 'Please check at least one room row in the table to attach guests.');
      return;
    }

    const drafts: Record<string, RoomGuestDraft> = {};
    roomItems.forEach((r, idx) => {
      if (!selectedRoomRowIds.includes(r.id)) return;

      const rawName1 = idx === 0 ? (r.occupantName !== undefined ? r.occupantName : guestName) : (r.occupantName || '');
      const rawPhone1 = idx === 0 ? (r.occupantPhone !== undefined ? r.occupantPhone : guestPhone) : (r.occupantPhone || '');
      const parts1 = rawName1.trim().split(' ');
      const first1 = parts1[0] || '';
      const last1 = parts1.slice(1).join(' ') || '';

      const rawName2 = r.occupant2Name || '';
      const rawPhone2 = r.occupant2Phone || '';
      const parts2 = rawName2.trim().split(' ');
      const first2 = parts2[0] || '';
      const last2 = parts2.slice(1).join(' ') || '';

      drafts[r.id] = {
        guest1Title: '',
        guest1FirstName: first1,
        guest1LastName: last1,
        guest1Phone: rawPhone1,
        guest1PhoneType: 'PHONE',
        guest1Id: idx === 0 && idNumber ? idNumber : '',
        guest2Title: '',
        guest2FirstName: first2,
        guest2LastName: last2,
        guest2Phone: rawPhone2,
        guest2PhoneType: 'PHONE',
        guest2Id: '',
      };
    });
    setGuestDrafts(drafts);
    setIsAttachGuestsModalOpen(true);
  };

  const handleUpdateGuestDraft = (roomId: string, field: keyof RoomGuestDraft, value: string) => {
    setGuestDrafts((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || {
          guest1Title: 'Mr.',
          guest1FirstName: '',
          guest1LastName: '',
          guest1Phone: '',
          guest1Id: '--',
          guest2Title: 'Mr.',
          guest2FirstName: '',
          guest2LastName: '',
          guest2Phone: '',
          guest2Id: '--',
        }),
        [field]: value,
      },
    }));
  };

  const handleClearGuestDraft = (roomId: string, guestNumber: 1 | 2) => {
    setGuestDrafts((prev) => {
      const current = prev[roomId];
      if (!current) return prev;
      if (guestNumber === 1) {
        return {
          ...prev,
          [roomId]: {
            ...current,
            guest1Title: '',
            guest1FirstName: '',
            guest1LastName: '',
            guest1Phone: '',
            guest1PhoneType: 'PHONE',
            guest1Id: '',
          },
        };
      } else {
        return {
          ...prev,
          [roomId]: {
            ...current,
            guest2Title: '',
            guest2FirstName: '',
            guest2LastName: '',
            guest2Phone: '',
            guest2PhoneType: 'PHONE',
            guest2Id: '',
          },
        };
      }
    });
  };

  const handleSaveAttachGuests = () => {
    setRoomItems((prev) =>
      prev.map((r, idx) => {
        const draft = guestDrafts[r.id];
        if (!draft) return r;
        const full1 = `${draft.guest1FirstName.trim()} ${draft.guest1LastName.trim()}`.trim();
        const phone1 = draft.guest1Phone.trim();
        const id1 = draft.guest1Id.trim();
        const full2 = `${draft.guest2FirstName.trim()} ${draft.guest2LastName.trim()}`.trim();
        const phone2 = draft.guest2Phone.trim();

        if (idx === 0) {
          if (full1) setGuestName(full1);
          if (phone1) setGuestPhone(phone1);
          if (id1) setIdNumber(id1);
        }

        return {
          ...r,
          occupantName: full1,
          occupantPhone: phone1,
          occupant2Name: full2,
          occupant2Phone: phone2,
        };
      })
    );
    toast.success('Guests Attached', 'Guest manifest has been updated for all rooms.');
    setIsAttachGuestsModalOpen(false);
  };

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
        adultsCount: 2,
        childrenCount: 0,
        occupantName: '',
        occupantPhone: '',
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

  const distinctRoomTypes = useMemo(
    () => Array.from(new Set(AVAILABLE_ROOMS_CATALOG.map((r) => r.type))),
    []
  );

  const handleSelectRoomTypeInRow = (rowId: string, newType: string) => {
    const availableOfType = AVAILABLE_ROOMS_CATALOG.find(
      (r) => r.type === newType && checkRoomAvailability(r, rowId).isAvailable
    );
    if (!availableOfType) {
      toast.warning('No Available Rooms', `All ${newType} rooms are currently occupied or unavailable for these dates.`);
      return;
    }
    handleSelectRoomInRow(rowId, availableOfType.id);
  };

  const handleSelectRoomInRow = (rowId: string, newRoomId: string) => {
    const rObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === newRoomId);
    const roomCapacity = rObj?.capacity || 2;
    setRoomItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        const currentAdults = item.adultsCount ?? item.guestsCount ?? 2;
        const newAdults = Math.min(Math.max(1, currentAdults), roomCapacity);
        const children = item.childrenCount ?? 0;
        return {
          ...item,
          roomId: newRoomId,
          rate: rObj ? rObj.pricePerNight : item.rate,
          adultsCount: newAdults,
          guestsCount: newAdults + children,
        };
      })
    );
  };

  const handleBillingDisAmtChange = (d: number) => {
    setManualDiscountAmount(Math.max(0, d));
  };

  const handleBillingDisPercentChange = (pct: number) => {
    const p = Math.max(0, Math.min(100, pct));
    const amt = Math.round(subtotal * (p / 100));
    setManualDiscountAmount(amt);
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
    setApplyMemberDiscountAtBooking(false);
    setManualDiscountAmount(0);
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
    const effectiveGuestName = isCorporateOrAgent
      ? (roomItems[0]?.occupantName?.trim() || corporateContactPerson?.trim() || selectedPartner?.contactPerson || selectedPartner?.partnerName || guestName.trim() || (bookingSource === 'CORPORATE' ? 'Corporate Guest' : 'Agent Guest'))
      : guestName.trim();

    const effectiveGuestPhone = isCorporateOrAgent
      ? (roomItems[0]?.occupantPhone?.trim() || corporatePhone?.trim() || selectedPartner?.phone || guestPhone.trim() || 'N/A')
      : guestPhone.trim();

    if (!effectiveGuestName) {
      toast.error('Name Required', 'Please enter guest full name.');
      return;
    }
    if (!effectiveGuestPhone && !isCorporateOrAgent) {
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

    // Validate Pay Terms for corporate & travel agent bookings
    if (isCorporateOrAgent && !billingArrangement) {
      toast.error('Pay Terms Required', 'Please select Pay Terms for this reservation.');
      return;
    }

    const [first, ...rest] = effectiveGuestName.trim().split(' ');
    const firstName = first || (isCorporateOrAgent ? (selectedPartner?.partnerName || 'Partner') : 'Guest');
    const lastName = rest.join(' ') || (isCorporateOrAgent ? 'Guest' : 'Customer');

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
          receivedFrom: isCorporateOrAgent ? paymentReceivedFrom : 'GUEST_EMPLOYEE',
          payerName: isCorporateOrAgent ? (actualPayerName.trim() || guestName) : guestName,
          allocatedTo: isCorporateOrAgent ? paymentAllocatedTo : 'GUEST_FOLIO',
          transactionReference: paymentTxReference.trim() || undefined,
          notes:
            isCorporateOrAgent && paymentAllocatedTo === 'COMPANY_ACCOUNT' && actualPayerName && actualPayerName !== selectedPartner?.partnerName
              ? `Advance deposit collected from ${actualPayerName} on behalf of ${selectedPartner?.partnerName}`
              : (shouldCheckInNow ? 'Check-in desk payment received' : 'Advance deposit received at booking'),
        });
      }

      return {
        id: bId,
        bookingCode: bCode,
        status: shouldCheckInNow ? 'CHECKED_IN' : 'RESERVED',
        checkIn: rowItem.rowIn || checkInDate,
        checkInTime: shouldCheckInNow ? (checkInTime || getCurrentTimeString()) : undefined,
        checkOut: rowItem.rowOut || checkOutDate,
        nights: rowItem.rowNights || nights,
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
          id: isPrimary ? (linkedBooking?.guest.id || `gst-${Date.now()}`) : `gst-${Date.now()}-${idx}`,
          firstName: isPrimary
            ? firstName
            : (rowItem.occupantName?.trim()
              ? rowItem.occupantName.trim().split(' ')[0]
              : `${firstName} (Room ${rowItem.roomObj.number})`),
          lastName: isPrimary
            ? lastName
            : (rowItem.occupantName?.trim() && rowItem.occupantName.trim().split(' ').length > 1
              ? rowItem.occupantName.trim().split(' ').slice(1).join(' ')
              : lastName),
          phone: isPrimary ? guestPhone.trim() : (rowItem.occupantPhone?.trim() || guestPhone.trim()),
          email: isPrimary ? (guestEmail.trim() || `${guestPhone.trim()}@guest.hotel`) : `${(rowItem.occupantPhone?.trim() || guestPhone.trim())}@guest.hotel`,
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
          accompanyingGuests: [
            ...(isPrimary ? accompanyingGuests : []),
            ...(rowItem.occupant2Name?.trim()
              ? [
                {
                  id: `acc-${Date.now()}-${idx}`,
                  name: rowItem.occupant2Name.trim(),
                  phone: rowItem.occupant2Phone?.trim(),
                  relation: '2nd Guest',
                },
              ]
              : []),
          ],
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
        billingArrangement: isCorporateOrAgent ? (billingArrangement || 'COMPANY_ACCOUNT') : undefined,
        paymentResponsibility: isCorporateOrAgent ? paymentResponsibility : undefined,
        splitCompanyAmount: isCorporateOrAgent && billingArrangement === 'SPLIT_BILLING' ? splitCompanyAmount : undefined,
        splitGuestAmount: isCorporateOrAgent && billingArrangement === 'SPLIT_BILLING' ? splitGuestAmount : undefined,
        negotiatedRate: isCorporateOrAgent ? selectedPartner?.negotiatedRoomRate : undefined,
        calculatedCommission: (bookingSource === 'TRAVEL_AGENT' || bookingSource === 'INDIVIDUAL_REFERRAL') && selectedPartner?.commissionEnabled
          ? calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights)
          : 0,
        // Membership Discount & Stacking Audit Fields
        guestMembershipTier: guestVipTier,
        isMembershipDiscountApplied: applyMemberDiscountAtBooking && membershipEligibility.canApply,
        membershipDiscountPercent: applyMemberDiscountAtBooking && membershipEligibility.canApply ? membershipEligibility.tierDiscountPercent : 0,
        membershipDiscountAmount: discountBreakdown.membershipDiscountAmount,
        corporateDiscountPercent,
        corporateDiscountAmount: discountBreakdown.corporateDiscountAmount,
        discountStackingPolicy: corporateDiscountPercent > 0
          ? (getMembershipEligibilitySettings().allowStackWithCorporateDiscount ? 'STACK_ALLOWED' : 'STACK_PREVENTED')
          : 'NONE',
        discountAppliedBy: 'Front Desk Staff',
        discountAppliedAt: (applyMemberDiscountAtBooking || corporateDiscountPercent > 0) ? new Date().toISOString() : undefined,
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
    } else if (selectedPartner && isCorporateOrAgent) {
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
                {formMode === 'CHECK_IN'
                  ? 'Guest Check-In'
                  : bookingSource === 'CORPORATE'
                    ? 'Corporate Reservation'
                    : bookingSource === 'TRAVEL_AGENT'
                      ? 'Travel Agent Reservation'
                      : bookingSource === 'GROUP'
                        ? 'Group Reservation'
                        : 'New Room Booking'}
              </h1>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isCorporateOrAgent && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    openTab({
                      path: '/booking?source=CORPORATE',
                      title: 'Reservation',
                      iconName: 'CalendarCheck',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-brand dark:text-emerald-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4] shadow-2xs"
                  title="Open Corporate Company Booking in Reservation Tab"
                >
                  <Building2 className="w-3.5 h-3.5 text-brand dark:text-emerald-400" />
                  <span>Corporate Booking</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openTab({
                      path: '/booking?source=TRAVEL_AGENT',
                      title: 'Reservation',
                      iconName: 'CalendarCheck',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-brand dark:text-emerald-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4] shadow-2xs"
                  title="Open Travel Agent Booking in Reservation Tab"
                >
                  <Compass className="w-3.5 h-3.5 text-brand dark:text-emerald-400" />
                  <span>Travel Agent Booking</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openTab({
                      path: '/booking?source=GROUP',
                      title: 'Reservation',
                      iconName: 'CalendarCheck',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-brand dark:text-emerald-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4] shadow-2xs"
                  title="Open Group Booking in Reservation Tab"
                >
                  <Users className="w-3.5 h-3.5 text-brand dark:text-emerald-400" />
                  <span>Group Booking</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => router.push('/check-in')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-body dark:text-slate-200 border-border-default dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Switch to Check-In Desk"
            >
              <UserCheck className="w-3.5 h-3.5 text-muted" />
              <span>Check-In Desk</span>
            </button>

            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border bg-white dark:bg-surface-card text-brand dark:text-emerald-300 border-border-default dark:border-border-default hover:bg-[#F2F6F4]"
              title="View all existing bookings and reservations"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-success dark:text-brand" />
              <span>Booked List</span>
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 lg:p-8 space-y-6">
          {/* SEARCH GUEST WHO LIVED IN HOTEL EARLIER (GUEST HISTORY LOOKUP) - Direct / Walk-in only */}
          {!isCorporateOrAgent && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 pb-4 border-b border-border-default dark:border-border-default">
              <div className="space-y-1.5 w-full sm:w-80 relative">
                <label className="block text-xs font-bold text-slate-800 dark:text-neutral-200">
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
          )}

          {/* Partner & Billing Arrangement Bar (Shows for Referral Only) */}
          {bookingSource === 'INDIVIDUAL_REFERRAL' && (
            <div className="p-3 rounded border border-border-default dark:border-border-default bg-[#F8FAFC] dark:bg-surface-card/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="w-72">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Referral Partner <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => handlePartnerSelect(e.target.value)}
                    className="w-full h-7.5 px-2.5 rounded border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                  >
                    <option value="">— Choose Referral Partner —</option>
                    {partnersList
                      .filter((p) => p.partnerType === 'INDIVIDUAL_REFERRAL' && p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.partnerName} ({p.partnerCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selectedPartner && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 pt-1 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border-default dark:border-border-default lg:pl-3">
                  <div className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                    Commission: <strong className="font-bold">{selectedPartner.commissionEnabled ? `NPR ${calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights).toLocaleString()}` : 'None'}</strong>
                  </div>
                  <div className="text-[11px] text-muted dark:text-neutral-400">
                    Contact: <strong className="text-slate-800 dark:text-slate-200">{selectedPartner.contactPerson || selectedPartner.phone}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
              COMPANY / TRAVEL AGENT DETAILS (Above Room Information)
              =============================================================== */}
          {isCorporateOrAgent && (
            <div className="border border-border-default dark:border-border-default bg-white dark:bg-surface-card rounded-xs p-5 space-y-4 shadow-2xs">
              {/* Card Header with Exact Right-Side Selector: Corporate/Company or Travel Agent */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-default dark:border-border-default">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 text-brand dark:text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-body dark:text-slate-200 truncate">
                    {bookingSource === 'CORPORATE' ? 'Company Details' : bookingSource === 'TRAVEL_AGENT' ? 'Travel Agent Details' : 'Group Details'}
                  </h3>
                  {selectedPartner && (
                    <span className="text-[11px] font-mono text-muted hidden sm:inline ml-1">
                      Code: {selectedPartner.partnerCode}
                    </span>
                  )}
                  {bookingSource === 'TRAVEL_AGENT' && selectedPartner?.commissionEnabled && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-xs border border-emerald-200 dark:border-emerald-800 hidden md:inline ml-1">
                      Commission: NPR {calculatePartnerCommission(selectedPartner, subtotal, totalPayable, nights).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Exact Right Side Selector with 'Select' Placeholder */}
                <div className="shrink-0 ml-auto">
                  <select
                    value={partnerTypeSelector}
                    onChange={(e) => {
                      const nextSource = e.target.value as 'CORPORATE' | 'TRAVEL_AGENT' | 'GROUP' | '';
                      setPartnerTypeSelector(nextSource);
                      if (nextSource) {
                        handleBookingSourceChange(nextSource);
                      }
                    }}
                    className={cn(
                      'h-7 px-2.5 text-xs rounded-xs border border-border-default dark:border-slate-700 bg-white dark:bg-surface-card outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs font-semibold',
                      !partnerTypeSelector ? 'text-muted font-normal' : 'text-slate-800 dark:text-white'
                    )}
                  >
                    <option value="">Select</option>
                    <option value="CORPORATE">Corporate / Company</option>
                    <option value="TRAVEL_AGENT">Travel Agent</option>
                    <option value="GROUP">Group Booking</option>
                  </select>
                </div>
              </div>

              {/* Row 1: Company / Agent / Group Name, Contact Person, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative" ref={companyDropdownRef}>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {bookingSource === 'CORPORATE' ? 'Company Name' : bookingSource === 'TRAVEL_AGENT' ? 'Travel Agency Name' : 'Group / Organizer Name'} <span className="text-rose-500">*</span>
                  </label>

                  {/* Trigger Box */}
                  <div
                    onClick={() => {
                      setIsCompanyDropdownOpen(!isCompanyDropdownOpen);
                      setCompanySearchQuery('');
                    }}
                    className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer hover:border-[#0B3D32] transition-colors shadow-2xs"
                  >
                    <span className={cn('truncate', !selectedPartner && 'text-muted font-normal')}>
                      {selectedPartner
                        ? `${selectedPartner.partnerName} (${selectedPartner.partnerCode})`
                        : 'Select'}
                    </span>
                    <div className="flex items-center gap-1 text-muted shrink-0 ml-1">
                      {selectedPartner && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePartnerSelect('');
                          }}
                          className="p-0.5 hover:text-rose-600 transition-colors"
                          title="Clear selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150', isCompanyDropdownOpen && 'rotate-180')} />
                    </div>
                  </div>

                  {/* Searchable Dropdown Popover */}
                  {isCompanyDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[320px] rounded-xs border border-border-default dark:border-slate-700 bg-white dark:bg-surface-card shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                      {/* Search Box Input */}
                      <div className="p-2 border-b border-border-default dark:border-slate-700 bg-[#F4F6F8] dark:bg-[#0a231c]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            autoFocus
                            value={companySearchQuery}
                            onChange={(e) => setCompanySearchQuery(e.target.value)}
                            className="w-full h-7 pl-7 pr-2.5 text-xs rounded-xs border border-border-default dark:border-slate-600 bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Filtered Companies List */}
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs custom-scrollbar">
                        {filteredCorporatePartners.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted">
                            {bookingSource === 'CORPORATE' ? 'No matching corporate companies found' : 'No matching travel agencies found'}
                          </div>
                        ) : (
                          filteredCorporatePartners.map((p) => {
                            const isSelected = p.id === selectedPartnerId;
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  handlePartnerSelect(p.id);
                                  setIsCompanyDropdownOpen(false);
                                  setCompanySearchQuery('');
                                }}
                                className={cn(
                                  'px-3 py-2 cursor-pointer transition-colors flex items-center justify-between gap-2',
                                  isSelected
                                    ? 'bg-[#f0f7f5] dark:bg-[#0d2a22] text-[#0B3D32] dark:text-emerald-300 font-semibold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-body dark:text-slate-200'
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold truncate">
                                    {p.partnerName}
                                  </div>
                                  <div className="text-[10px] text-muted truncate">
                                    {p.partnerCode} {p.panVatNumber ? `· PAN: ${p.panVatNumber}` : ''} {p.city ? `· ${p.city}` : ''}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-brand dark:text-emerald-400 shrink-0" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={corporateContactPerson}
                    onChange={(e) => setCorporateContactPerson(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Row 2: Phone, PAN/VAT No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={corporatePhone}
                    onChange={(e) => setCorporatePhone(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PAN / VAT No.
                  </label>
                  <input
                    type="text"
                    value={corporatePanVat}
                    onChange={(e) => setCorporatePanVat(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Subheading: Address Details */}
              <div className="pt-2 border-t border-border-default dark:border-border-default">
                <div className="text-xs font-bold uppercase tracking-wider text-muted dark:text-slate-400 mb-3">
                  Address and Contact Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Address Line
                    </label>
                    <input
                      type="text"
                      value={corporateAddress}
                      onChange={(e) => setCorporateAddress(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={corporateCity}
                      onChange={(e) => setCorporateCity(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={corporateCountry}
                      onChange={(e) => setCorporateCountry(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              SECTION 1: STAY SCHEDULE & GUEST INFORMATION (5 + 7 Cols)
              Hidden specifically for Corporate / Travel Agent Booking flow
              =============================================================== */}
          {!isCorporateOrAgent && (
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
          )}

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
                    <th className="py-2 px-1 text-center w-8 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={roomItems.length > 0 && selectedRoomRowIds.length === roomItems.length}
                        onChange={toggleSelectAllRoomRows}
                        className="w-3.5 h-3.5 rounded-xs accent-[#0B3D32] cursor-pointer"
                        title="Select All Rooms"
                      />
                    </th>
                    <th className="py-2 px-1.5 text-center w-10 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      SL.
                    </th>
                    <th className="py-2 px-2.5 w-32 min-w-[110px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ROOM TYPE
                    </th>
                    <th className="py-2 px-2 text-center w-24 min-w-[95px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ASSIGNED ROOM
                    </th>
                    <th className="py-2 px-2.5 w-44 min-w-[150px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      GUEST NAME
                    </th>
                    <th className="py-2 px-2.5 w-40 min-w-[140px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      PHONE
                    </th>
                    <th className="py-2 px-2 text-center w-22 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ADULT / CHILD
                    </th>
                    <th className="py-2 px-2 text-right w-20 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      AMT
                    </th>
                    <th className="py-2 px-2 text-center w-32 min-w-[110px] border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      Chk-in Chk-out
                    </th>
                    <th className="py-2 px-1 text-center w-16 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      NIGHT
                    </th>
                    <th className="py-2 px-2 text-right w-20 border-r border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      DSC
                    </th>
                    <th className="py-2 px-3 text-right w-24 font-semibold text-body dark:text-slate-200">
                      T. AMT
                    </th>
                    <th className="py-2 px-2 text-center w-12 border-l border-border-default dark:border-border-default font-semibold text-body dark:text-slate-200">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-surface-card">
                  {roomRowsCalculated.map((row, idx) => {
                    // Only show genuinely available & clean rooms matching the row's selected Room Type
                    const availableRoomsForDropdown = AVAILABLE_ROOMS_CATALOG.filter((r) => {
                      return r.id === row.roomId || (r.type === row.roomObj.type && checkRoomAvailability(r, row.id).isAvailable);
                    });

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                        <td className="py-2 px-1 text-center w-8 border-r border-border-default dark:border-border-default">
                          <input
                            type="checkbox"
                            checked={selectedRoomRowIds.includes(row.id)}
                            onChange={() => toggleSelectRoomRow(row.id)}
                            className="w-3.5 h-3.5 rounded-xs accent-[#0B3D32] cursor-pointer"
                            title={`Select Row ${idx + 1}`}
                          />
                        </td>
                        <td className="py-2 px-1.5 text-center text-muted dark:text-muted font-medium border-r border-border-default dark:border-border-default">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 w-40 border-r border-border-default dark:border-border-default">
                          <select
                            value={row.roomObj.type}
                            onChange={(e) => handleSelectRoomTypeInRow(row.id, e.target.value)}
                            className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer font-medium"
                            title="Select Room Type"
                          >
                            {distinctRoomTypes.map((rType) => (
                              <option key={rType} value={rType}>
                                {rType}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-1.5 w-24 border-r border-border-default dark:border-border-default">
                          <select
                            value={row.roomId}
                            onChange={(e) => handleSelectRoomInRow(row.id, e.target.value)}
                            className="w-full h-7 px-1 text-center font-mono text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer font-medium"
                          >
                            {availableRoomsForDropdown.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.number.startsWith('F') ? rm.number : `F${rm.number}`}
                              </option>
                            ))}
                            {availableRoomsForDropdown.length === 0 && (
                              <option disabled value="">
                                No rooms
                              </option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2 w-44 border-r border-border-default dark:border-border-default align-middle">
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder={idx === 0 ? 'Primary Guest' : `Guest 1 (Room ${row.roomObj.number})`}
                              value={idx === 0 ? (row.occupantName !== undefined ? row.occupantName : guestName) : (row.occupantName || '')}
                              onChange={(e) => {
                                handleUpdateRoomRow(row.id, { occupantName: e.target.value });
                                if (idx === 0) setGuestName(e.target.value);
                              }}
                              className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-slate-400"
                            />
                            {Boolean(row.occupant2Name?.trim() || row.occupant2Phone?.trim()) && (
                              <input
                                type="text"
                                placeholder="2nd Guest"
                                value={row.occupant2Name || ''}
                                onChange={(e) => handleUpdateRoomRow(row.id, { occupant2Name: e.target.value })}
                                className="w-full h-6 px-2 text-[11px] border border-border-default dark:border-slate-600 rounded-xs bg-slate-50/70 dark:bg-surface-card/60 text-body dark:text-white outline-none focus:border-slate-400"
                                title="Second person staying in this room"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 w-40 border-r border-border-default dark:border-border-default align-middle">
                          <div className="space-y-1">
                            <input
                              type="tel"
                              placeholder="Mobile 1"
                              value={idx === 0 ? (row.occupantPhone !== undefined ? row.occupantPhone : guestPhone) : (row.occupantPhone || '')}
                              onChange={(e) => {
                                handleUpdateRoomRow(row.id, { occupantPhone: e.target.value });
                                if (idx === 0) setGuestPhone(e.target.value);
                              }}
                              className="w-full h-7 px-2 text-xs font-mono border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-slate-400"
                            />
                            {Boolean(row.occupant2Name?.trim() || row.occupant2Phone?.trim()) && (
                              <input
                                type="tel"
                                placeholder="Mobile 2"
                                value={row.occupant2Phone || ''}
                                onChange={(e) => handleUpdateRoomRow(row.id, { occupant2Phone: e.target.value })}
                                className="w-full h-6 px-2 text-[11px] font-mono border border-border-default dark:border-slate-600 rounded-xs bg-slate-50/70 dark:bg-surface-card/60 text-body dark:text-white outline-none focus:border-slate-400"
                                title="Second person mobile number"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 w-24 border-r border-border-default dark:border-border-default">
                          <div className="flex items-center justify-center gap-1.5">
                            <select
                              value={row.adultsCount ?? row.guestsCount ?? 2}
                              onChange={(e) => {
                                const adults = Math.max(1, Number(e.target.value) || 1);
                                const children = row.childrenCount ?? 0;
                                handleUpdateRoomRow(row.id, {
                                  adultsCount: adults,
                                  guestsCount: adults + children,
                                });
                              }}
                              title="Adults"
                              className="w-9 h-7 px-1 text-center font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400 cursor-pointer"
                            >
                              {Array.from({ length: Math.max(2, row.roomObj.capacity || 2) }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">/</span>
                            <select
                              value={row.childrenCount ?? 0}
                              onChange={(e) => {
                                const children = Math.max(0, Number(e.target.value) || 0);
                                const adults = row.adultsCount ?? row.guestsCount ?? 2;
                                handleUpdateRoomRow(row.id, {
                                  childrenCount: children,
                                  guestsCount: adults + children,
                                });
                              }}
                              title="Children"
                              className="w-9 h-7 px-1 text-center font-mono text-xs bg-white dark:bg-surface-card border border-border-default dark:border-slate-600 rounded-xs text-body dark:text-white outline-none focus:border-slate-400 cursor-pointer"
                            >
                              {[0, 1, 2, 3, 4].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </div>
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
                        <td className="py-2 px-2 text-center text-xs border-r border-border-default dark:border-border-default relative select-none">
                          <button
                            type="button"
                            onClick={() => setEditingStayDatesRowId(editingStayDatesRowId === row.id ? null : row.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-xs text-[#1E40AF] dark:text-blue-300 font-medium whitespace-nowrap cursor-pointer transition-all border border-blue-200 dark:border-blue-800 shadow-2xs group"
                            title="Click to edit check-in and check-out dates"
                          >
                            <span>{formatStayDates(row.rowIn, row.rowOut)}</span>
                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                          </button>

                          {/* Date Range Popover */}
                          {editingStayDatesRowId === row.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setEditingStayDatesRowId(null)}
                              />
                              <div
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 w-64 bg-white dark:bg-surface-card border border-border-default dark:border-slate-700 shadow-2xl rounded-xs p-3 text-left space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between border-b border-border-default dark:border-slate-700 pb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-brand dark:text-emerald-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-body dark:text-slate-200">
                                      Dates · Room {row.roomObj.number}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStayDatesRowId(null)}
                                    className="text-muted hover:text-body p-0.5 cursor-pointer"
                                    title="Close"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-muted dark:text-slate-400 mb-1">
                                    Check-In Date
                                  </label>
                                  <input
                                    type="date"
                                    value={row.rowIn}
                                    onChange={(e) => {
                                      const newIn = e.target.value;
                                      if (newIn) {
                                        let newOut = row.rowOut;
                                        if (newIn >= row.rowOut) {
                                          const d = new Date(newIn);
                                          d.setDate(d.getDate() + 1);
                                          newOut = d.toISOString().split('T')[0];
                                        }
                                        handleUpdateRoomRow(row.id, { checkInDate: newIn, checkOutDate: newOut });
                                      }
                                    }}
                                    className="w-full h-7 px-2 text-xs font-mono border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-muted dark:text-slate-400 mb-1">
                                    Check-Out Date
                                  </label>
                                  <input
                                    type="date"
                                    min={row.rowIn}
                                    value={row.rowOut}
                                    onChange={(e) => {
                                      const newOut = e.target.value;
                                      if (newOut && newOut > row.rowIn) {
                                        handleUpdateRoomRow(row.id, { checkOutDate: newOut });
                                      }
                                    }}
                                    className="w-full h-7 px-2 text-xs font-mono border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-border-default dark:border-slate-700">
                                  <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                    {row.rowNights} {row.rowNights === 1 ? 'Night' : 'Nights'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStayDatesRowId(null)}
                                    className="h-6 px-3 rounded-xs bg-brand text-white hover:bg-[#093027] text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </td>
                        <td className="py-2 px-1 text-center font-mono text-xs font-semibold text-body dark:text-slate-200 border-r border-border-default dark:border-border-default">
                          {row.rowNights}
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
                        <td className="py-2 px-2 text-center border-l border-border-default dark:border-border-default">
                          <button
                            type="button"
                            onClick={() => handleRemoveRoomRow(row.id)}
                            disabled={roomItems.length <= 1}
                            title={roomItems.length <= 1 ? 'At least one room is required' : 'Remove this room'}
                            className={cn(
                              'p-1 rounded transition-colors',
                              roomItems.length <= 1
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                                : 'text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-surface-muted dark:bg-surface-card font-semibold text-xs border-t-2 border-border-default dark:border-slate-600">
                  <tr>
                    <td
                      colSpan={6}
                      className="py-2.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-body dark:text-slate-300 border-r border-border-default dark:border-border-default"
                    >
                      Total
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs font-semibold text-body dark:text-slate-200 border-r border-border-default dark:border-border-default font-mono">
                      {totalAdults} / {totalChildren}
                    </td>
                    <td className="py-2.5 px-2 border-r border-border-default dark:border-border-default"></td>
                    <td className="py-2.5 px-2 border-r border-border-default dark:border-border-default"></td>
                    <td className="py-2.5 px-1 border-r border-border-default dark:border-border-default"></td>
                    <td className="py-2.5 px-2 text-right font-mono text-xs font-semibold text-emerald-700 dark:text-brand border-r border-border-default dark:border-border-default">
                      {totalDiscount > 0 ? `Rs. ${totalDiscount.toLocaleString()}` : '0'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-brand dark:text-blue-400 tabular-nums">
                      Rs. {totalPayable.toLocaleString()}
                    </td>
                    <td className="border-l border-border-default dark:border-border-default"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Controls Below Table: Add Room & Copy Contact Buttons */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleOpenAddRoomModal}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xs border border-[#0B3D32] text-brand dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-surface-card shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAttachGuestsModal}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-xs border border-[#0B3D32] text-brand dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold cursor-pointer transition-colors bg-white dark:bg-surface-card shadow-2xs"
                title="Add and attach guests to rooms"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Guest</span>
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
            </div>

            {/* Row 2: Payment Option, Pay Terms (for Corporate), Paid Amt., Ref. Due, Mode, Remarks */}
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

              {isCorporateOrAgent && (
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pay Terms <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={billingArrangement}
                    required
                    onChange={(e) => {
                      const val = e.target.value as 'COMPANY_ACCOUNT' | 'GUEST_DIRECT' | 'SPLIT_BILLING' | '';
                      setBillingArrangement(val);
                      if (val) {
                        setPaymentResponsibility(
                          val === 'GUEST_DIRECT' ? 'GUEST_PAYS' : val === 'SPLIT_BILLING' ? 'SPLIT' : 'COMPANY_PAYS'
                        );
                        if (val === 'SPLIT_BILLING') {
                          setSplitCompanyAmount(subtotal);
                          setSplitGuestAmount(Math.max(0, totalPayable - subtotal));
                        }
                      }
                    }}
                    className={cn(
                      'w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card outline-none focus:border-[#0B3D32] cursor-pointer font-semibold',
                      !billingArrangement ? 'text-muted font-normal' : 'text-body dark:text-slate-200'
                    )}
                  >
                    <option value="">— Select Pay Terms —</option>
                    <option value="COMPANY_ACCOUNT">Balance To be Paid by Company</option>
                    <option value="GUEST_DIRECT">Balance To be collected from Guest</option>
                    <option value="SPLIT_BILLING">Split Billing</option>
                  </select>
                </div>
              )}

              <div className={isCorporateOrAgent ? 'lg:col-span-2' : 'lg:col-span-2'}>
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

              <div className={isCorporateOrAgent ? 'lg:col-span-1' : 'lg:col-span-2'}>
                <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                  Ref. Due
                </label>
                <div className="h-7 px-2 flex items-center justify-end font-mono font-medium text-xs bg-[#eaedf1] dark:bg-slate-800 text-body dark:text-white rounded-xs border border-border-default dark:border-border-default tabular-nums">
                  {dueAmountAtCheckout.toLocaleString()}
                </div>
              </div>

              <div className={isCorporateOrAgent ? 'lg:col-span-1' : 'lg:col-span-2'}>
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

              <div className={isCorporateOrAgent ? 'lg:col-span-3' : 'lg:col-span-4'}>
                <label className="block text-[11px] font-medium text-muted dark:text-muted mb-1">
                  Remarks / Special Requests
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Split Billing Allocator (if active) */}
            {isCorporateOrAgent && billingArrangement === 'SPLIT_BILLING' && (
              <div className="p-2.5 rounded-xs border border-border-default dark:border-border-default bg-[#F8FAFC] dark:bg-surface-card/60 flex flex-wrap items-center gap-4 text-xs">
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
                    className="w-28 h-7 px-2 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-bold font-mono text-slate-800 dark:text-white"
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
                    className="w-28 h-7 px-2 rounded-xs border border-border-default dark:border-border-default bg-white dark:bg-surface-card text-xs font-bold font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Row 3: Membership Discount Option & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center">
                {!isCorporateOrAgent && (
                  <label className={cn(
                    "inline-flex items-center gap-1.5 text-xs select-none",
                    membershipEligibility.canApply ? "cursor-pointer text-slate-800 dark:text-slate-200" : "cursor-not-allowed opacity-50 text-slate-400"
                  )}>
                    <input
                      type="checkbox"
                      disabled={!membershipEligibility.canApply}
                      checked={applyMemberDiscountAtBooking && membershipEligibility.canApply}
                      onChange={(e) => setApplyMemberDiscountAtBooking(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-border-default text-brand accent-[#0B3D32] cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-medium">Apply Membership Disc.</span>
                  </label>
                )}
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



      {/* -----------------------------------------------------------------------
          ADD NEW ROOM MODAL
          ----------------------------------------------------------------------- */}
      {isAddRoomModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in duration-150"
          onClick={() => setIsAddRoomModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-xs overflow-hidden bg-white dark:bg-surface-card shadow-2xl border border-border-default dark:border-border-default flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clean, Professional Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-default dark:border-border-default bg-[#F4F6F8] dark:bg-[#0a231c]">
              <h3 className="text-sm font-semibold text-body dark:text-white">
                Add New Room
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1 rounded-xs text-muted hover:text-body hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 bg-white dark:bg-surface-card space-y-4 text-xs">
              {/* Form Grid Styled Like Main Software Table */}
              <div className="border border-border-default dark:border-border-default rounded-xs overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 bg-[#F4F6F8] dark:bg-[#0a231c] text-[11px] font-bold uppercase tracking-wider text-body dark:text-slate-200 border-b border-border-default dark:border-border-default py-2 px-3">
                  <div className="col-span-3">Check-In</div>
                  <div className="col-span-1 text-center">Nights</div>
                  <div className="col-span-3">Room Type</div>
                  <div className="col-span-1 text-center">Adult</div>
                  <div className="col-span-1 text-center">Child</div>
                  <div className="col-span-3">Rooms</div>
                </div>

                {/* Input Fields Row */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-white dark:bg-surface-card items-center">
                  {/* Check-In */}
                  <div className="col-span-3 relative">
                    <input
                      type="date"
                      value={modalCheckIn}
                      onChange={(e) => {
                        if (e.target.value) setModalCheckIn(e.target.value);
                      }}
                      className="w-full h-8 px-2.5 pr-7 text-xs border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white font-mono outline-none focus:border-[#0B3D32] cursor-pointer"
                    />
                    <Calendar className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Nights */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={modalNights}
                      onChange={(e) => setModalNights(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-8 px-1 text-center font-mono text-xs border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  {/* Room Type */}
                  <div className="col-span-3">
                    <select
                      value={modalRoomType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalRoomType(val);
                        const match = AVAILABLE_ROOMS_CATALOG.find((r) => r.type === val);
                        if (match && match.capacity) {
                          setModalAdults(match.maxAdults || match.capacity || 2);
                        }
                      }}
                      className="w-full h-8 px-2 text-xs border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer truncate"
                    >
                      <option value="">Select Room Type</option>
                      {modalAvailableRoomTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Adult */}
                  <div className="col-span-1">
                    <select
                      value={modalAdults}
                      onChange={(e) => setModalAdults(Number(e.target.value))}
                      className="w-full h-8 px-1 text-xs text-center font-mono border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Child */}
                  <div className="col-span-1">
                    <select
                      value={modalChildren}
                      onChange={(e) => setModalChildren(Number(e.target.value))}
                      className="w-full h-8 px-1 text-xs text-center font-mono border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer"
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rooms (Quantity to Add) */}
                  <div className="col-span-3">
                    <select
                      value={modalRoomCount}
                      onChange={(e) => setModalRoomCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-8 px-2 text-xs border border-border-default dark:border-border-default rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer font-medium"
                      title="Select how many rooms to book"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Software Standard Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-default dark:border-border-default bg-[#F4F6F8] dark:bg-[#0a231c]">
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="h-7 px-4 rounded-xs border border-border-default dark:border-slate-600 bg-white dark:bg-surface-card text-body dark:text-slate-200 hover:bg-surface-muted text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddRoomFromModal}
                className="h-7 px-4 rounded-xs border border-[#0B3D32] bg-brand text-white hover:bg-[#093027] text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          ATTACH GUESTS MODAL
          ----------------------------------------------------------------------- */}
      {isAttachGuestsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in duration-150"
          onClick={() => setIsAttachGuestsModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[85vh] rounded-xs overflow-hidden bg-white dark:bg-surface-card shadow-2xl border border-border-default dark:border-border-default flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clean, Professional Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-default dark:border-border-default bg-[#F4F6F8] dark:bg-[#0a231c]">
              <h3 className="text-sm font-semibold text-body dark:text-white">
                Attach Guests
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachGuestsModalOpen(false)}
                className="p-1 rounded-xs text-muted hover:text-body hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 overflow-y-auto text-xs max-h-[calc(85vh-105px)] custom-scrollbar">
              <div className="border border-border-default dark:border-border-default rounded-xs overflow-x-auto bg-white dark:bg-surface-card">
                <table className="w-full min-w-[880px] text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F4F6F8] dark:bg-[#0a231c] border-b border-border-default dark:border-border-default text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-slate-300">
                      <th className="py-2 px-3 text-center w-10 border-r border-border-default dark:border-slate-700">#</th>
                      <th className="py-2 px-2.5 text-left min-w-[280px] border-r border-border-default dark:border-slate-700">
                        Guest Name <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2 px-2.5 text-left w-44 min-w-[165px] border-r border-border-default dark:border-slate-700">
                        Phone <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2 px-2 text-center w-16 whitespace-nowrap border-r border-border-default dark:border-slate-700">Stay</th>
                      <th className="py-2 px-2 text-center w-28 whitespace-nowrap border-r border-border-default dark:border-slate-700">Guest Id</th>
                      <th className="py-2 px-2 text-center w-16 border-r border-border-default dark:border-slate-700">Type</th>
                      <th className="py-2 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomItems
                      .filter((r) => selectedRoomRowIds.includes(r.id))
                      .map((r) => {
                        const roomObj = AVAILABLE_ROOMS_CATALOG.find((x) => x.id === r.roomId) || AVAILABLE_ROOMS_CATALOG[0];
                        const rIn = r.checkInDate || checkInDate;
                        const rOut = r.checkOutDate || checkOutDate;
                        const stayParts = formatStayDates(rIn, rOut).split(' - ');
                        const draft = guestDrafts[r.id] || {
                          guest1Title: 'Mr.',
                          guest1FirstName: '',
                          guest1LastName: '',
                          guest1Phone: '',
                          guest1PhoneType: 'PHONE' as const,
                          guest1Id: '',
                          guest2Title: 'Mr.',
                          guest2FirstName: '',
                          guest2LastName: '',
                          guest2Phone: '',
                          guest2PhoneType: 'PHONE' as const,
                          guest2Id: '',
                        };
                        const hasSecondGuest = (roomObj.capacity || 2) >= 2;

                        const guestRows = [
                          {
                            num: 1,
                            title: draft.guest1Title,
                            firstName: draft.guest1FirstName,
                            lastName: draft.guest1LastName,
                            phone: draft.guest1Phone,
                            phoneType: draft.guest1PhoneType || 'PHONE',
                            guestId: draft.guest1Id || '',
                            titleKey: 'guest1Title' as const,
                            firstKey: 'guest1FirstName' as const,
                            lastKey: 'guest1LastName' as const,
                            phoneKey: 'guest1Phone' as const,
                            phoneTypeKey: 'guest1PhoneType' as const,
                            idKey: 'guest1Id' as const,
                          },
                          ...(hasSecondGuest
                            ? [
                                {
                                  num: 2,
                                  title: draft.guest2Title,
                                  firstName: draft.guest2FirstName,
                                  lastName: draft.guest2LastName,
                                  phone: draft.guest2Phone,
                                  phoneType: draft.guest2PhoneType || 'PHONE',
                                  guestId: draft.guest2Id || '',
                                  titleKey: 'guest2Title' as const,
                                  firstKey: 'guest2FirstName' as const,
                                  lastKey: 'guest2LastName' as const,
                                  phoneKey: 'guest2Phone' as const,
                                  phoneTypeKey: 'guest2PhoneType' as const,
                                  idKey: 'guest2Id' as const,
                                },
                              ]
                            : []),
                        ];

                        return (
                          <React.Fragment key={r.id}>
                            {/* Room Group Header Row */}
                            <tr className="bg-[#F2F6F4] dark:bg-[#0d2a22] border-y border-border-default dark:border-slate-700">
                              <td colSpan={7} className="py-1.5 px-3 text-xs text-[#0B3D32] dark:text-emerald-300">
                                <span className="font-semibold">
                                  Room {roomObj.number} — {roomObj.type}
                                </span>
                              </td>
                            </tr>

                            {/* Guest Rows */}
                            {guestRows.map((g) => (
                              <tr
                                key={`${r.id}-${g.num}`}
                                className="border-b border-border-default dark:border-slate-800 bg-white dark:bg-surface-card hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
                              >
                                <td className="py-2 px-3 text-center font-mono text-muted border-r border-border-default dark:border-slate-800">
                                  {g.num}
                                </td>
                                <td className="py-2 px-2 border-r border-border-default dark:border-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={g.title}
                                      onChange={(e) => handleUpdateGuestDraft(r.id, g.titleKey, e.target.value)}
                                      className="w-16 h-7 px-1.5 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32] cursor-pointer shrink-0"
                                    >
                                      <option value="">Title</option>
                                      <option value="Mr.">Mr.</option>
                                      <option value="Ms.">Ms.</option>
                                      <option value="Mrs.">Mrs.</option>
                                      <option value="Dr.">Dr.</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="First Name"
                                      value={g.firstName}
                                      onChange={(e) => handleUpdateGuestDraft(r.id, g.firstKey, e.target.value)}
                                      className="flex-1 min-w-0 h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Last Name"
                                      value={g.lastName}
                                      onChange={(e) => handleUpdateGuestDraft(r.id, g.lastKey, e.target.value)}
                                      className="flex-1 min-w-0 h-7 px-2 text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-2 border-r border-border-default dark:border-slate-800">
                                  <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={g.phone}
                                    onChange={(e) => handleUpdateGuestDraft(r.id, g.phoneKey, e.target.value)}
                                    className="w-full h-7 px-2 font-mono text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                                  />
                                </td>
                                <td className="py-2 px-2 text-left text-[11px] leading-tight font-mono text-blue-700 dark:text-blue-400 border-r border-border-default dark:border-slate-800 whitespace-nowrap">
                                  <div>{stayParts[0]}-</div>
                                  <div>{stayParts[1] || stayParts[0]}</div>
                                </td>
                                <td className="py-2 px-2 border-r border-border-default dark:border-slate-800 whitespace-nowrap">
                                  <input
                                    type="text"
                                    placeholder="Guest ID"
                                    value={g.guestId}
                                    onChange={(e) => handleUpdateGuestDraft(r.id, g.idKey, e.target.value)}
                                    className="w-full h-7 px-2 font-mono text-xs border border-border-default dark:border-slate-600 rounded-xs bg-white dark:bg-surface-card text-body dark:text-white outline-none focus:border-[#0B3D32]"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center text-xs text-muted border-r border-border-default dark:border-slate-800 whitespace-nowrap">
                                  Adult
                                </td>
                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleClearGuestDraft(r.id, g.num as 1 | 2)}
                                    className="p-1.5 rounded-xs border border-border-default dark:border-slate-600 text-muted dark:text-slate-300 bg-white dark:bg-surface-card hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center"
                                    title="Reset row"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-border-default dark:border-border-default bg-[#F4F6F8] dark:bg-[#0a231c]">
              <button
                type="button"
                onClick={() => setIsAttachGuestsModalOpen(false)}
                className="h-7 px-4 rounded-xs border border-border-default dark:border-slate-600 bg-white dark:bg-surface-card text-body dark:text-slate-200 hover:bg-surface-muted text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttachGuests}
                className="h-7 px-4 rounded-xs border border-[#0B3D32] bg-brand text-white hover:bg-[#093027] text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          PRINTABLE GUEST REGISTRATION CARD (Reg Card Modal)
          ----------------------------------------------------------------------- */}
      {
        selectedBookingForRegCard && (() => {
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

                  {/* Applied Discounts Breakdown in Invoice / Reg Card */}
                  {((b.corporateDiscountAmount && b.corporateDiscountAmount > 0) || (b.membershipDiscountAmount && b.membershipDiscountAmount > 0)) && (
                    <div className="p-2.5 bg-slate-50 border border-border-default rounded text-[11px] flex flex-wrap items-center gap-4">
                      <span className="font-semibold text-slate-700">Applied Discounts:</span>
                      {b.corporateDiscountAmount ? (
                        <span className="text-emerald-800">
                          • Corporate ({b.corporateDiscountPercent}%): <strong>-Rs. {b.corporateDiscountAmount.toLocaleString()}</strong>
                        </span>
                      ) : null}
                      {b.membershipDiscountAmount ? (
                        <span className="text-amber-800">
                          • Guest Membership ({b.membershipDiscountPercent}% {b.guestMembershipTier}): <strong>-Rs. {b.membershipDiscountAmount.toLocaleString()}</strong>
                        </span>
                      ) : null}
                    </div>
                  )}

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
        })()
      }
    </div >
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

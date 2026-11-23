'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  Mail,
  Plus,
  X,
  Eye,
  Calendar,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  Percent,
  Sparkles,
  Settings,
} from 'lucide-react';
import {
  Guest360ProfileRecord,
  loadGuest360Profiles,
  saveGuest360Profiles,
  getBusinessMode,
  saveBusinessMode,
  BusinessMode,
} from '@/lib/guest360Data';
import { Guest360ProfileView } from '@/components/guests/Guest360ProfileView';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getBookingFinancials,
} from '../reservations/reservationsData';
import {
  MembershipTier,
  getMembershipTiers,
  calculateGuestCompletedStays,
  determineEligibleTier,
  calculateTierProgress,
  DEFAULT_MEMBERSHIP_TIERS,
} from '@/lib/loyalty';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export interface GuestStayRecord {
  bookingId: string;
  bookingCode: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalCharges: number;
  status: RoomBooking['status'];
}

export interface GuestProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  idType: string;
  idNumber: string;
  memberSince?: string;
  vipTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalStays: number;
  completedStaysCount: number;
  totalNights: number;
  totalSpent: number;
  roomCharges?: number;
  restaurantOrder?: number;
  itemsOrdered?: string;
  balanceDue?: number;
  currentStatus: 'IN_HOUSE' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED';
  currentRoom?: string;
  lastStayRoom?: string;
  lastStayCheckIn?: string;
  lastStayCheckOut?: string;
  stays: GuestStayRecord[];
}

// Initial fallback guests for rich CRM experience if storage is empty
const INITIAL_DIRECTORY_GUESTS: GuestProfile[] = [
  {
    id: 'gst-101',
    firstName: 'Ram',
    lastName: 'Sharma',
    fullName: 'Ram Sharma',
    phone: '+977 9841234567',
    email: 'ram.sharma@gmail.com',
    address: 'New Baneshwor, Ward 10',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-01-72-0451',
    memberSince: '2024-01-15',
    vipTier: 'GOLD',
    totalStays: 7,
    completedStaysCount: 7,
    totalNights: 18,
    totalSpent: 85000,
    roomCharges: 10500,
    restaurantOrder: 3250,
    itemsOrdered: 'Chicken Biryani (2), Butter Naan (4), Cold Coffee (2)',
    balanceDue: 0,
    currentStatus: 'IN_HOUSE',
    currentRoom: '102',
    lastStayRoom: '102',
    lastStayCheckIn: '2026-11-04',
    lastStayCheckOut: '2026-11-07',
    stays: [
      {
        bookingId: 'bk-102',
        bookingCode: 'BK-1002',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        checkIn: '2026-11-04',
        checkOut: '2026-11-07',
        nights: 3,
        totalCharges: 10500,
        status: 'CHECKED_IN',
      },
      {
        bookingId: 'bk-091',
        bookingCode: 'BK-0912',
        roomNumber: '201',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-09-12',
        checkOut: '2026-09-15',
        nights: 3,
        totalCharges: 14700,
        status: 'CHECKED_OUT',
      },
      {
        bookingId: 'bk-078',
        bookingCode: 'BK-0788',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        checkIn: '2026-07-20',
        checkOut: '2026-07-23',
        nights: 3,
        totalCharges: 10500,
        status: 'CHECKED_OUT',
      },
      {
        bookingId: 'bk-061',
        bookingCode: 'BK-0610',
        roomNumber: '104',
        roomType: 'Standard Twin Room',
        checkIn: '2026-05-10',
        checkOut: '2026-05-12',
        nights: 2,
        totalCharges: 6000,
        status: 'CHECKED_OUT',
      },
      {
        bookingId: 'bk-045',
        bookingCode: 'BK-0455',
        roomNumber: '201',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-03-01',
        checkOut: '2026-03-04',
        nights: 3,
        totalCharges: 14700,
        status: 'CHECKED_OUT',
      },
      {
        bookingId: 'bk-030',
        bookingCode: 'BK-0302',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        checkIn: '2026-01-18',
        checkOut: '2026-01-21',
        nights: 3,
        totalCharges: 10500,
        status: 'CHECKED_OUT',
      },
      {
        bookingId: 'bk-015',
        bookingCode: 'BK-0150',
        roomNumber: '202',
        roomType: 'Executive Ocean Suite',
        checkIn: '2025-11-10',
        checkOut: '2025-11-13',
        nights: 3,
        totalCharges: 14700,
        status: 'CHECKED_OUT',
      },
    ],
  },
  {
    id: 'gst-102',
    firstName: 'Priya',
    lastName: 'Sharma',
    fullName: 'Priya Sharma',
    phone: '+977 9801987654',
    email: 'priya.sharma@nepalcorp.com',
    address: 'Jhamsikhel, Lalitpur',
    country: 'Nepal',
    idType: 'National ID',
    idNumber: '102-4589-99',
    memberSince: '2023-08-20',
    vipTier: 'PLATINUM',
    totalStays: 12,
    completedStaysCount: 11,
    totalNights: 28,
    totalSpent: 148500,
    roomCharges: 14700,
    restaurantOrder: 7800,
    itemsOrdered: 'Grilled Salmon (2), Red Wine (1), Caesar Salad (2)',
    balanceDue: 0,
    currentStatus: 'IN_HOUSE',
    currentRoom: '201',
    lastStayRoom: '201',
    lastStayCheckIn: '2026-11-04',
    lastStayCheckOut: '2026-11-07',
    stays: [
      {
        bookingId: 'bk-201',
        bookingCode: 'BK-2001',
        roomNumber: '201',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-11-04',
        checkOut: '2026-11-07',
        nights: 3,
        totalCharges: 14700,
        status: 'CHECKED_IN',
      },
      {
        bookingId: 'bk-190',
        bookingCode: 'BK-1902',
        roomNumber: '201',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-10-15',
        checkOut: '2026-10-18',
        nights: 3,
        totalCharges: 14700,
        status: 'CHECKED_OUT',
      },
    ],
  },
  {
    id: 'gst-103',
    firstName: 'Bikash',
    lastName: 'Gurung',
    fullName: 'Bikash Gurung',
    phone: '+977 9856012345',
    email: 'bikash.gurung@outlook.com',
    address: 'Lakeside 6, Pokhara',
    country: 'Nepal',
    idType: 'Driving License',
    idNumber: 'DL-06-88741',
    memberSince: '2024-04-10',
    vipTier: 'SILVER',
    totalStays: 2,
    completedStaysCount: 2,
    totalNights: 5,
    totalSpent: 12000,
    roomCharges: 4800,
    restaurantOrder: 1850,
    itemsOrdered: 'Club Sandwich (2), Masala Tea (3), French Fries (1)',
    balanceDue: 0,
    currentStatus: 'IN_HOUSE',
    currentRoom: '104',
    lastStayRoom: '104',
    lastStayCheckIn: '2026-11-04',
    lastStayCheckOut: '2026-11-06',
    stays: [
      {
        bookingId: 'bk-104',
        bookingCode: 'BK-1004',
        roomNumber: '104',
        roomType: 'Standard Twin Room',
        checkIn: '2026-11-04',
        checkOut: '2026-11-06',
        nights: 2,
        totalCharges: 4800,
        status: 'CHECKED_IN',
      },
      {
        bookingId: 'bk-080',
        bookingCode: 'BK-0805',
        roomNumber: '104',
        roomType: 'Standard Twin Room',
        checkIn: '2026-08-10',
        checkOut: '2026-08-13',
        nights: 3,
        totalCharges: 7200,
        status: 'CHECKED_OUT',
      },
    ],
  },
  {
    id: 'gst-104',
    firstName: 'Siddharth',
    lastName: 'Shrestha',
    fullName: 'Siddharth Shrestha',
    phone: '+977 9813245678',
    email: 'siddharth@shresthait.com',
    address: 'New Road, Kathmandu',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-02-74-8841',
    memberSince: '2024-02-14',
    vipTier: 'GOLD',
    totalStays: 6,
    completedStaysCount: 6,
    totalNights: 14,
    totalSpent: 42000,
    roomCharges: 7000,
    restaurantOrder: 0,
    itemsOrdered: '—',
    balanceDue: 7000,
    currentStatus: 'RESERVED',
    currentRoom: '101',
    lastStayRoom: '101',
    lastStayCheckIn: '2026-11-04',
    lastStayCheckOut: '2026-11-06',
    stays: [
      {
        bookingId: 'bk-101',
        bookingCode: 'BK-1001',
        roomNumber: '101',
        roomType: 'Deluxe Garden Suite',
        checkIn: '2026-11-04',
        checkOut: '2026-11-06',
        nights: 2,
        totalCharges: 7000,
        status: 'RESERVED',
      },
    ],
  },
  {
    id: 'gst-105',
    firstName: 'Elena',
    lastName: 'Rostova',
    fullName: 'Elena Rostova',
    phone: '+44 7911 123456',
    email: 'elena.rostova@traveler.co.uk',
    address: '14 Kensington High St, London',
    country: 'United Kingdom',
    idType: 'Passport',
    idNumber: 'GB94827104',
    memberSince: '2023-11-05',
    vipTier: 'PLATINUM',
    totalStays: 10,
    completedStaysCount: 10,
    totalNights: 26,
    totalSpent: 118400,
    roomCharges: 29400,
    restaurantOrder: 12400,
    itemsOrdered: 'Pasta Alfredo (3), Margherita Pizza (2), Iced Lemon Tea (4)',
    balanceDue: 0,
    currentStatus: 'CHECKED_OUT',
    lastStayRoom: '203',
    lastStayCheckIn: '2026-10-20',
    lastStayCheckOut: '2026-10-26',
    stays: [
      {
        bookingId: 'bk-203',
        bookingCode: 'BK-0899',
        roomNumber: '203',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-10-20',
        checkOut: '2026-10-26',
        nights: 6,
        totalCharges: 29400,
        status: 'CHECKED_OUT',
      },
    ],
  },
  {
    id: 'gst-106',
    firstName: 'David',
    lastName: 'Miller',
    fullName: 'David Miller',
    phone: '+1 415 555 2671',
    email: 'dmiller@pacificventures.io',
    address: 'San Francisco, CA',
    country: 'United States',
    idType: 'Passport',
    idNumber: 'US589210432',
    memberSince: '2024-05-18',
    vipTier: 'SILVER',
    totalStays: 3,
    completedStaysCount: 3,
    totalNights: 8,
    totalSpent: 26400,
    roomCharges: 19600,
    restaurantOrder: 6800,
    itemsOrdered: 'Chicken Tikka (2), Garlic Naan (3), Espresso (4)',
    balanceDue: 0,
    currentStatus: 'CHECKED_OUT',
    lastStayRoom: '202',
    lastStayCheckIn: '2026-10-10',
    lastStayCheckOut: '2026-10-14',
    stays: [
      {
        bookingId: 'bk-202',
        bookingCode: 'BK-0820',
        roomNumber: '202',
        roomType: 'Executive Ocean Suite',
        checkIn: '2026-10-10',
        checkOut: '2026-10-14',
        nights: 4,
        totalCharges: 19600,
        status: 'CHECKED_OUT',
      },
    ],
  },
];

type MainTab = 'GUEST_LIST' | 'GUEST_360' | 'MEMBERSHIP_LOYALTY';
type TierFilter = 'ALL' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'IN_HOUSE';

function GuestDirectoryContent() {
  const toast = useToast();
  const [bookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [configuredTiers, setConfiguredTiers] = useState<MembershipTier[]>(() => getMembershipTiers());

  // Listen for membership tiers updates
  useEffect(() => {
    const handleUpdated = () => setConfiguredTiers(getMembershipTiers());
    window.addEventListener('hotel_membership_tiers_updated', handleUpdated);
    return () => window.removeEventListener('hotel_membership_tiers_updated', handleUpdated);
  }, []);

  // Main Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('GUEST_LIST');

  // Guest 360 & Business Configuration States
  const [guest360List, setGuest360List] = useState<Guest360ProfileRecord[]>(() => loadGuest360Profiles());
  const [selected360Guest, setSelected360Guest] = useState<Guest360ProfileRecord>(() => {
    const list = loadGuest360Profiles();
    return list[0];
  });
  const [businessMode, setBusinessModeState] = useState<BusinessMode>(() => getBusinessMode());

  const handleBusinessModeChange = (mode: BusinessMode) => {
    setBusinessModeState(mode);
    saveBusinessMode(mode);
    toast.success('Scope Updated', `Switched business scope to ${mode.replace(/_/g, ' ')}.`);
  };

  const handleUpdateGuest360 = (updated: Guest360ProfileRecord) => {
    setGuest360List((prev) => {
      const next = prev.map((g) => (g.id === updated.id ? updated : g));
      saveGuest360Profiles(next);
      return next;
    });
    setSelected360Guest(updated);
  };

  // Filters & Search
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);

  const openGuest360 = (g: GuestProfile) => {
    let found = guest360List.find(
      (p) =>
        p.id.toLowerCase() === g.id.toLowerCase() ||
        (g.phone && p.phone && p.phone.replace(/\D/g, '') === g.phone.replace(/\D/g, '')) ||
        p.fullName.toLowerCase().trim() === g.fullName.toLowerCase().trim()
    );

    if (!found) {
      const parts = g.fullName.trim().split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';
      const totalSpend = (g.roomCharges || 0) + (g.restaurantOrder || 0);

      const newGuest: Guest360ProfileRecord = {
        id: g.id.toUpperCase().startsWith('GST-') ? g.id.toUpperCase() : `GST-${g.id.replace(/\D/g, '') || '099'}`,
        legacyId: g.id,
        fullName: g.fullName,
        firstName: fName,
        lastName: lName,
        phone: g.phone || '9800000000',
        email: g.email || `${g.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: g.address || 'Kathmandu, Nepal',
        country: g.country || 'Nepal',
        idType: g.idType || 'Citizenship',
        idNumber: g.idNumber || 'Verified',
        memberSince: g.memberSince || '2024-01-01',
        vipTier: (g.vipTier as any) || 'SILVER',
        currentStatus: g.currentStatus === 'IN_HOUSE' ? 'IN_HOUSE' : 'CHECKED_OUT',
        currentRoom: g.currentRoom,
        totalVisits: g.completedStaysCount || g.totalStays || 1,
        totalNights: g.totalNights || 1,
        totalSpending: totalSpend,
        roomSpending: g.roomCharges || 0,
        restaurantSpending: g.restaurantOrder || 0,
        otherServicesSpending: 0,
        totalPaid: Math.max(0, totalSpend - (g.balanceDue || 0)),
        outstandingBalance: g.balanceDue || 0,
        totalRefunds: 0,
        lastVisitDate: g.lastStayCheckOut || '2026-11-07',
        visits: (g.stays || []).map((st, i) => ({
          visitNumber: (g.stays?.length || 1) - i,
          reservationNumber: st.bookingCode || `BK-${st.roomNumber}`,
          bookingId: st.bookingId,
          checkIn: st.checkIn,
          checkOut: st.checkOut,
          roomNumber: st.roomNumber,
          roomType: st.roomType,
          durationNights: st.nights,
          roomRatePerNight: Math.round(st.totalCharges / Math.max(1, st.nights)),
          roomCharges: st.totalCharges,
          restaurantSpending: i === 0 ? (g.restaurantOrder || 0) : 0,
          otherServices: 0,
          totalVisitAmount: st.totalCharges + (i === 0 ? (g.restaurantOrder || 0) : 0),
          amountPaid: Math.max(0, st.totalCharges + (i === 0 ? (g.restaurantOrder || 0) : 0) - (i === 0 ? (g.balanceDue || 0) : 0)),
          balanceDue: i === 0 ? (g.balanceDue || 0) : 0,
          paymentStatus: (i === 0 && (g.balanceDue || 0) > 0 ? 'PARTIAL' : 'PAID') as any,
          reservationStatus: (st.status === 'CHECKED_IN' ? 'CHECKED_IN' : 'CHECKED_OUT') as any,
          restaurantOrders: [],
          otherServicesList: [],
        })),
        restaurantOrders: [],
        paymentsAndInvoices: [],
        notes: [],
      };
      setGuest360List((prev) => [newGuest, ...prev]);
      found = newGuest;
    }

    if (found) {
      setSelected360Guest(found);
      setActiveMainTab('GUEST_360');
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Aggregate guests from live bookings + fallback records with dynamic loyalty computation
  const guestList: GuestProfile[] = useMemo(() => {
    const map = new Map<string, GuestProfile>();

    // 1. Seed base default guests first
    INITIAL_DIRECTORY_GUESTS.forEach((g) => {
      const key = `${g.firstName.trim().toLowerCase()}_${g.lastName.trim().toLowerCase()}`;
      map.set(key, { ...g, stays: [...g.stays] });
    });

    // 2. Overlay live room bookings from hotel operations storage
    bookings.forEach((b) => {
      const fName = (b.guest?.firstName || '').trim();
      const lName = (b.guest?.lastName || '').trim();
      if (!fName && !lName) return;

      const key = `${fName.toLowerCase()}_${lName.toLowerCase()}`;
      const financials = getBookingFinancials(b);
      const orderedItemsList = (b.cafeOrders || []).flatMap((o) =>
        (o.items || []).map((it) => `${it.name} (${it.quantity})`)
      );
      const orderedItemsStr = orderedItemsList.length > 0 ? orderedItemsList.join(', ') : '—';

      const stayRecord: GuestStayRecord = {
        bookingId: b.id,
        bookingCode: b.bookingCode,
        roomNumber: b.room.number,
        roomType: b.room.type,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        totalCharges: financials.totalCharges,
        status: b.status,
      };

      if (!map.has(key)) {
        map.set(key, {
          id: b.guest.id || `gst-${b.id}`,
          firstName: fName,
          lastName: lName,
          fullName: `${fName} ${lName}`.trim(),
          phone: b.guest.phone || '',
          email: b.guest.email || '',
          address: b.guest.address || '',
          country: b.guest.country || 'Nepal',
          idType: b.guest.idType || 'Citizenship',
          idNumber: b.guest.idNumber || '',
          memberSince: b.checkIn || '2024-01-01',
          vipTier: 'SILVER',
          totalStays: 1,
          completedStaysCount: b.status === 'CHECKED_OUT' ? 1 : 0,
          totalNights: b.nights || 1,
          totalSpent: financials.totalCharges,
          roomCharges: financials.roomCharges,
          restaurantOrder: financials.cafeTotal,
          itemsOrdered: orderedItemsStr,
          balanceDue: financials.balanceDue,
          currentStatus: b.status === 'CHECKED_IN' ? 'IN_HOUSE' : b.status === 'RESERVED' ? 'RESERVED' : 'CHECKED_OUT',
          currentRoom: b.status === 'CHECKED_IN' ? b.room.number : undefined,
          lastStayRoom: b.room.number,
          lastStayCheckIn: b.checkIn,
          lastStayCheckOut: b.checkOut,
          stays: [stayRecord],
        });
      } else {
        const existing = map.get(key)!;
        const hasStay = existing.stays.some((s) => s.bookingCode === b.bookingCode);
        if (!hasStay) {
          existing.stays.unshift(stayRecord);
          existing.totalStays += 1;
          if (b.status === 'CHECKED_OUT') {
            existing.completedStaysCount += 1;
          }
          existing.totalNights += b.nights || 1;
          existing.totalSpent += financials.totalCharges;
        }

        if (b.status === 'CHECKED_IN') {
          existing.currentStatus = 'IN_HOUSE';
          existing.currentRoom = b.room.number;
          existing.lastStayRoom = b.room.number;
          existing.lastStayCheckIn = b.checkIn;
          existing.lastStayCheckOut = b.checkOut;
          existing.roomCharges = financials.roomCharges;
          existing.restaurantOrder = financials.cafeTotal;
          if (orderedItemsStr !== '—') {
            existing.itemsOrdered = orderedItemsStr;
          }
          existing.balanceDue = financials.balanceDue;
        } else if (b.status === 'RESERVED' && existing.currentStatus !== 'IN_HOUSE') {
          existing.currentStatus = 'RESERVED';
          existing.currentRoom = b.room.number;
        }

        if (!existing.phone && b.guest.phone) existing.phone = b.guest.phone;
        if (!existing.email && b.guest.email) existing.email = b.guest.email;
        if (!existing.address && b.guest.address) existing.address = b.guest.address;
      }
    });

    // 3. Dynamically compute eligible tier based on completed stay count & configured thresholds
    map.forEach((guest) => {
      // Calculate completed stays strictly: 1 completed reservation = 1 stay
      const { completedStays, totalSpending, lastStayDate } = calculateGuestCompletedStays(
        { id: guest.id, phone: guest.phone, email: guest.email, name: guest.fullName },
        bookings
      );

      // Merge with base stays if bookings list is fresh
      const effectiveCompletedStays = Math.max(guest.completedStaysCount || 0, completedStays);
      guest.completedStaysCount = effectiveCompletedStays;
      if (totalSpending > 0) {
        guest.totalSpent = Math.max(guest.totalSpent, totalSpending);
      }
      if (lastStayDate) {
        guest.lastStayCheckOut = lastStayDate;
      }

      const tier = determineEligibleTier(effectiveCompletedStays, configuredTiers);
      guest.vipTier = (tier.code as any) || 'SILVER';
    });

    return Array.from(map.values());
  }, [bookings, configuredTiers]);

  // Filtered List
  const filteredGuests = useMemo(() => {
    return guestList.filter((g) => {
      // 1. Tier Filter
      if (tierFilter === 'IN_HOUSE' && g.currentStatus !== 'IN_HOUSE') return false;
      if (tierFilter === 'SILVER' && g.vipTier !== 'SILVER') return false;
      if (tierFilter === 'GOLD' && g.vipTier !== 'GOLD') return false;
      if (tierFilter === 'PLATINUM' && g.vipTier !== 'PLATINUM') return false;

      // 2. Search Query (Guest Name, Phone Number, Email, Stay count)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = g.fullName.toLowerCase().includes(q);
        const matchesPhone = g.phone.toLowerCase().includes(q);
        const matchesEmail = g.email.toLowerCase().includes(q);
        const matchesStays = String(g.completedStaysCount) === q || String(g.totalStays) === q;
        const matchesTier = g.vipTier.toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesStays && !matchesTier) {
          return false;
        }
      }

      return true;
    });
  }, [guestList, tierFilter, searchQuery]);

  type GuestSortField =
    | 'sn'
    | 'id'
    | 'name'
    | 'address'
    | 'mobile'
    | 'tier'
    | 'visits'
    | 'nights'
    | 'roomCharge'
    | 'restaurantOrder'
    | 'totalSpend'
    | 'due'
    | 'latestVisit';
  type GuestSortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<GuestSortField>('sn');
  const [sortOrder, setSortOrder] = useState<GuestSortOrder>('asc');

  const handleSort = (field: GuestSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedGuests = useMemo(() => {
    const list = [...filteredGuests];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortField === 'name') {
        valA = a.fullName.toLowerCase();
        valB = b.fullName.toLowerCase();
      } else if (sortField === 'address') {
        valA = `${a.address} ${a.country}`.toLowerCase();
        valB = `${b.address} ${b.country}`.toLowerCase();
      } else if (sortField === 'mobile') {
        valA = a.phone || '';
        valB = b.phone || '';
      } else if (sortField === 'tier') {
        valA = a.vipTier;
        valB = b.vipTier;
      } else if (sortField === 'visits') {
        valA = a.completedStaysCount || a.totalStays || 0;
        valB = b.completedStaysCount || b.totalStays || 0;
      } else if (sortField === 'nights') {
        valA = a.totalNights || 0;
        valB = b.totalNights || 0;
      } else if (sortField === 'roomCharge') {
        valA = a.roomCharges || 0;
        valB = b.roomCharges || 0;
      } else if (sortField === 'restaurantOrder') {
        valA = a.restaurantOrder || 0;
        valB = b.restaurantOrder || 0;
      } else if (sortField === 'totalSpend') {
        valA = a.totalSpent || 0;
        valB = b.totalSpent || 0;
      } else if (sortField === 'due') {
        valA = a.balanceDue || 0;
        valB = b.balanceDue || 0;
      } else if (sortField === 'latestVisit') {
        valA = a.lastStayCheckOut || a.lastStayCheckIn || a.memberSince || '';
        valB = b.lastStayCheckOut || b.lastStayCheckIn || b.memberSince || '';
      } else {
        return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredGuests, sortField, sortOrder]);

  // Pagination calculation
  const totalEntries = sortedGuests.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedGuests = useMemo(() => {
    return sortedGuests.slice(startIndex, startIndex + pageSize);
  }, [sortedGuests, startIndex, pageSize]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tierFilter, searchQuery]);

  // Loyalty Summary Counts
  const loyaltyStats = useMemo(() => {
    let silver = 0;
    let gold = 0;
    let platinum = 0;
    let totalSpent = 0;

    guestList.forEach((g) => {
      if (g.vipTier === 'PLATINUM') platinum++;
      else if (g.vipTier === 'GOLD') gold++;
      else silver++;
      totalSpent += g.totalSpent || 0;
    });

    return {
      total: guestList.length,
      silver,
      gold,
      platinum,
      avgSpend: guestList.length > 0 ? Math.round(totalSpent / guestList.length) : 0,
      totalSpend: totalSpent,
    };
  }, [guestList]);

  // Render membership badge matching specified styling
  const renderMembershipBadge = (tierCode: string, size: 'sm' | 'md' = 'sm') => {
    const code = (tierCode || 'SILVER').toUpperCase();
    if (code === 'PLATINUM') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 font-bold rounded-[3px] border uppercase tracking-wider',
            size === 'sm'
              ? 'px-2 py-0.5 text-[10px] bg-slate-900 text-white border-slate-700 shadow-2xs'
              : 'px-3 py-1 text-xs bg-slate-900 text-indigo-300 border-indigo-700 shadow-xs'
          )}
        >
          <Award className={cn(size === 'sm' ? 'w-3 h-3 text-indigo-400' : 'w-4 h-4 text-indigo-400')} />
          <span>Platinum</span>
        </span>
      );
    }
    if (code === 'GOLD') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 font-bold rounded-[3px] border uppercase tracking-wider',
            size === 'sm'
              ? 'px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 shadow-2xs'
              : 'px-3 py-1 text-xs bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-600 shadow-xs'
          )}
        >
          <Award className={cn(size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-4 h-4 text-amber-500')} />
          <span>Gold</span>
        </span>
      );
    }
    // Silver / Default
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-bold rounded-[3px] border uppercase tracking-wider',
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs'
            : 'px-3 py-1 text-xs bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 shadow-xs'
        )}
      >
        <Award className={cn(size === 'sm' ? 'w-3 h-3 text-slate-500' : 'w-4 h-4 text-slate-400')} />
        <span>Silver</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 w-full min-w-0 pb-12 select-none animate-in fade-in duration-150">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Module Navigation (Matching Restaurant Style)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Guest Management
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab('GUEST_LIST')}
            className={cn(
              'px-3.5 py-1.5 rounded-[3px] text-xs font-semibold border transition-colors cursor-pointer select-none',
              activeMainTab === 'GUEST_LIST'
                ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700 shadow-2xs'
                : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            Guest List
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('MEMBERSHIP_LOYALTY')}
            className={cn(
              'px-3.5 py-1.5 rounded-[3px] text-xs font-semibold border transition-colors cursor-pointer select-none',
              activeMainTab === 'MEMBERSHIP_LOYALTY'
                ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700 shadow-2xs'
                : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            Membership
          </button>
        </div>
      </div>

      {/* =======================================================================
          TAB 1: GUEST LIST (Clean, Professional DataTables Design)
         ======================================================================= */}
      {activeMainTab === 'GUEST_LIST' && (
        <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
          {/* Top Controls Bar: Show entries, Tier Filters & Search Box */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-[#FAFBFB] dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Left Controls: Show entries & Tier Filter Tabs */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Show Entries */}
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="font-medium text-xs">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="font-medium text-xs">entries</span>
              </div>

              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

              {/* Tier Filter Tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTierFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer select-none',
                    tierFilter === 'ALL'
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700'
                      : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50'
                  )}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => setTierFilter('SILVER')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer select-none',
                    tierFilter === 'SILVER'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-2xs font-bold'
                      : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50'
                  )}
                >
                  Silver
                </button>

                <button
                  type="button"
                  onClick={() => setTierFilter('GOLD')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer select-none',
                    tierFilter === 'GOLD'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                      : 'bg-white dark:bg-surface-card text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50'
                  )}
                >
                  Gold
                </button>

                <button
                  type="button"
                  onClick={() => setTierFilter('PLATINUM')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer select-none',
                    tierFilter === 'PLATINUM'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs font-bold'
                      : 'bg-white dark:bg-surface-card text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50'
                  )}
                >
                  Platinum
                </button>

                <button
                  type="button"
                  onClick={() => setTierFilter('IN_HOUSE')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-all cursor-pointer select-none',
                    tierFilter === 'IN_HOUSE'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold'
                      : 'bg-white dark:bg-surface-card text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50'
                  )}
                >
                  In-House
                </button>
              </div>
            </div>

            {/* Right Side: Search Box */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-slate-600 dark:text-slate-400 font-medium text-xs shrink-0">Search:</span>
              <div className="relative w-full md:w-56 shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=""
                  className="w-full h-[27px] rounded-[2px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card px-2.5 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500"
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
          </div>

          {/* Table: Separate Name, Separate Address, Room Charge, Restaurant Order in Rs, Items Ordered */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
                <tr>
                  <th
                    onClick={() => handleSort('sn')}
                    className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>SN</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'sn' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('id')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Guest ID</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'id' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[150px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Customer Name</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'name' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('address')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-w-[160px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Address</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'address' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('mobile')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Mobile No</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'mobile' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('tier')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Membership Level</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'tier' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('visits')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Visits</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'visits' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('nights')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Nights</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'nights' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('roomCharge')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Room Spend</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'roomCharge' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('restaurantOrder')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Dining Spend</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'restaurantOrder' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalSpend')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'totalSpend' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('latestVisit')}
                    className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Latest Visit</span>
                      <span className="text-slate-400 text-[10px]">{sortField === 'latestVisit' ? (sortOrder === 'asc' ? '▼' : '▲') : '⇅'}</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center w-14">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-200">
                {sortedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No guests found matching your membership filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedGuests.map((g, idx) => {
                    const totalBill = (g.roomCharges || 0) + (g.restaurantOrder || 0);

                    return (
                      <tr
                        key={g.id}
                        className="bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                      >
                        {/* 1. SN */}
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                          {startIndex + idx + 1}
                        </td>

                        {/* 2. Guest ID */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {g.id.toUpperCase()}
                        </td>

                        {/* 3. Customer Name (Separate column, clean plain text without box badge, clickable) */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-semibold text-slate-900 dark:text-white text-xs">
                          <button
                            type="button"
                            onClick={() => openGuest360(g)}
                            className="hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:underline cursor-pointer text-left"
                            title="Click to view Guest 360° Profile"
                          >
                            {g.fullName}
                          </button>
                        </td>

                        {/* 4. Address (Separate column, clean text) */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs">
                          {g.address ? `${g.address}${g.country && g.country !== 'Nepal' ? `, ${g.country}` : ''}` : '—'}
                        </td>

                        {/* 5. Mobile No */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono text-slate-700 dark:text-slate-300 text-xs">
                          {g.phone || '—'}
                        </td>

                        {/* 6. Membership Level */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center">
                          {renderMembershipBadge(g.vipTier, 'sm')}
                        </td>

                        {/* 7. Total Visits */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60 font-mono text-xs text-center font-bold text-slate-800 dark:text-slate-200">
                          {g.completedStaysCount || g.totalStays || 0}
                        </td>

                        {/* 8. Total Nights */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60 font-mono text-xs text-center text-slate-600 dark:text-slate-400">
                          {g.totalNights || 0}
                        </td>

                        {/* 9. Room Charge (Rs.) */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-900 dark:text-white text-xs text-right">
                          Rs. {(g.roomCharges || 0).toLocaleString()}
                        </td>

                        {/* 10. Restaurant Order in Rs. */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-900 dark:text-white text-xs text-right">
                          Rs. {(g.restaurantOrder || 0).toLocaleString()}
                        </td>

                        {/* 11. Total */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-900 dark:text-white text-xs text-right">
                          Rs. {totalBill.toLocaleString()}
                        </td>

                        {/* 12. Latest Visit Date */}
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {g.lastStayCheckOut || g.lastStayCheckIn || g.memberSince || '—'}
                        </td>

                        {/* 13. Action: Compact Eye Icon with Hover Tooltip */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="relative inline-flex items-center justify-center group">
                            <button
                              type="button"
                              onClick={() => openGuest360(g)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] bg-slate-50 hover:bg-[#0284c7] text-slate-600 hover:text-white border border-slate-300 hover:border-[#0284c7] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#0284c7] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
                              title="View 360°"
                              aria-label="View 360°"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30">
                              <div className="px-2 py-0.5 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-800 rounded-[2px] shadow-md whitespace-nowrap border border-slate-700">
                                View 360°
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer: Left: Showing X to Y of Z entries | Right: Prev / Next */}
          <div className="px-3.5 py-2.5 bg-[#FAFBFB] dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
            <div>
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {sortedGuests.length === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(startIndex + pageSize, sortedGuests.length)}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{sortedGuests.length}</strong>{' '}
              entries
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 font-medium">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                  ) {
                    const isCurrent = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'min-w-[26px] h-[26px] px-1.5 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                          isCurrent
                            ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700'
                            : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400 select-none font-bold">
                        …
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: GUEST 360° PROFILE (Centralized Customer 360 Dashboard)
         ======================================================================= */}
      {activeMainTab === 'GUEST_360' && (
        <Guest360ProfileView
          guest={selected360Guest}
          allGuests={guest360List}
          configuredTiers={configuredTiers}
          businessMode={businessMode}
          onUpdateGuest={handleUpdateGuest360}
          onBusinessModeChange={handleBusinessModeChange}
          onClose={() => setActiveMainTab('GUEST_LIST')}
        />
      )}

      {/* =======================================================================
          TAB 3: GUEST MEMBERSHIP / LOYALTY (OVERVIEW & TIER DISTRIBUTION)
         ======================================================================= */}
      {activeMainTab === 'MEMBERSHIP_LOYALTY' && (
        <div className="space-y-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Loyalty Members</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {loyaltyStats.total}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Registered guests</span>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Silver Members</span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono mt-1">
                {loyaltyStats.silver}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">0–4 completed stays</span>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase">Gold Members</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
                {loyaltyStats.gold}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 block">5–9 completed stays</span>
            </div>

            <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs">
              <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-400 uppercase">Platinum Members</span>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono mt-1">
                {loyaltyStats.platinum}
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-500 mt-0.5 block">10+ completed stays</span>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Spend Per Member</span>
              <div className="text-xl font-black text-[#0B3D32] dark:text-emerald-400 font-mono mt-1">
                Rs. {loyaltyStats.avgSpend.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime hotel spend</span>
            </div>
          </div>

          {/* Quick link to Hotel Setup -> Membership Settings */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                  Configure Loyalty Tiers &amp; Stay Thresholds
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hotel Administrators can add, reorder, edit discounts, and adjust minimum stay thresholds under Hotel Setup.
                </p>
              </div>
            </div>

            <Link
              href="/hotel?category=room-setup&sub=membership-settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold text-xs shadow-2xs dark:bg-emerald-700"
            >
              <span>Manage Tiers in Hotel Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Loyalty Members Roster Table */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Loyalty Member Directory
              </h3>
              <span className="text-xs text-slate-500">{guestList.length} Total Enrolled</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700">Member Name</th>
                    <th className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Current Level</th>
                    <th className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Completed Stays</th>
                    <th className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Next Tier Target</th>
                    <th className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">Lifetime Spend</th>
                    <th className="py-2 px-3 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {guestList.map((g, idx) => {
                    const prog = calculateTierProgress(g.completedStaysCount, configuredTiers);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700/60">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-bold text-slate-900 dark:text-white">{g.fullName}</td>
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center">{renderMembershipBadge(g.vipTier)}</td>
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-center">{g.completedStaysCount} Stays</td>
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {prog.nextTier ? `${prog.staysNeededForNext} stays to ${prog.nextTier.name}` : 'Max Tier'}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-right font-mono font-bold text-slate-900 dark:text-white">Rs. {g.totalSpent.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="relative inline-flex items-center justify-center group">
                            <button
                              type="button"
                              onClick={() => openGuest360(g)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] bg-slate-50 hover:bg-[#0284c7] text-slate-600 hover:text-white border border-slate-300 hover:border-[#0284c7] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#0284c7] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
                              title="View 360°"
                              aria-label="View 360°"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <div className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30">
                              <div className="px-2 py-0.5 text-[10px] font-bold text-white bg-slate-900 dark:bg-slate-800 rounded-[2px] shadow-md whitespace-nowrap border border-slate-700">
                                View 360°
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuestDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-w-0 p-12 text-center text-xs text-slate-400 dark:text-slate-500">
          Loading Guest Directory...
        </div>
      }
    >
      <GuestDirectoryContent />
    </Suspense>
  );
}

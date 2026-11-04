'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Contact,
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
  User,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getBookingFinancials,
} from '../reservations/reservationsData';
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
  vipTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalStays: number;
  totalNights: number;
  totalSpent: number;
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
    firstName: 'Aarav',
    lastName: 'Karki',
    fullName: 'Aarav Karki',
    phone: '+977 9841234567',
    email: 'aarav.karki@gmail.com',
    address: 'Baluwatar, Ward 4',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-01-78-1245',
    vipTier: 'GOLD',
    totalStays: 3,
    totalNights: 8,
    totalSpent: 28400,
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
    vipTier: 'PLATINUM',
    totalStays: 5,
    totalNights: 14,
    totalSpent: 68600,
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
    vipTier: 'SILVER',
    totalStays: 2,
    totalNights: 5,
    totalSpent: 12000,
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
    vipTier: 'GOLD',
    totalStays: 4,
    totalNights: 10,
    totalSpent: 35000,
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
    vipTier: 'PLATINUM',
    totalStays: 2,
    totalNights: 9,
    totalSpent: 44100,
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
    vipTier: 'GOLD',
    totalStays: 1,
    totalNights: 4,
    totalSpent: 19600,
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
  {
    id: 'gst-107',
    firstName: 'Anjali',
    lastName: 'Thapa',
    fullName: 'Anjali Thapa',
    phone: '+977 9861239870',
    email: 'anjali.thapa@gmail.com',
    address: 'Dharan, Sunsari',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '14-01-79-4512',
    vipTier: 'STANDARD',
    totalStays: 1,
    totalNights: 2,
    totalSpent: 4800,
    currentStatus: 'CHECKED_OUT',
    lastStayRoom: '103',
    lastStayCheckIn: '2026-10-02',
    lastStayCheckOut: '2026-10-04',
    stays: [
      {
        bookingId: 'bk-103',
        bookingCode: 'BK-0790',
        roomNumber: '103',
        roomType: 'Standard Twin Room',
        checkIn: '2026-10-02',
        checkOut: '2026-10-04',
        nights: 2,
        totalCharges: 4800,
        status: 'CHECKED_OUT',
      },
    ],
  },
];

type DirectoryFilterTab = 'ALL' | 'IN_HOUSE' | 'VIP' | 'FREQUENT' | 'STANDARD';

function GuestDirectoryContent() {
  const toast = useToast();
  const [bookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filters & Search
  const [activeTab, setActiveTab] = useState<DirectoryFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Aggregate guests from live bookings + fallback records
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
          vipTier: b.guest.vipTier || 'STANDARD',
          totalStays: 1,
          totalNights: b.nights || 1,
          totalSpent: financials.totalCharges,
          currentStatus: b.status === 'CHECKED_IN' ? 'IN_HOUSE' : b.status === 'RESERVED' ? 'RESERVED' : 'CHECKED_OUT',
          currentRoom: b.status === 'CHECKED_IN' ? b.room.number : undefined,
          lastStayRoom: b.room.number,
          lastStayCheckIn: b.checkIn,
          lastStayCheckOut: b.checkOut,
          stays: [stayRecord],
        });
      } else {
        const existing = map.get(key)!;
        // Check if this booking is already recorded in stays
        const hasStay = existing.stays.some((s) => s.bookingCode === b.bookingCode);
        if (!hasStay) {
          existing.stays.unshift(stayRecord);
          existing.totalStays += 1;
          existing.totalNights += b.nights || 1;
          existing.totalSpent += financials.totalCharges;
        }

        // Update active stay status if currently checked in
        if (b.status === 'CHECKED_IN') {
          existing.currentStatus = 'IN_HOUSE';
          existing.currentRoom = b.room.number;
          existing.lastStayRoom = b.room.number;
          existing.lastStayCheckIn = b.checkIn;
          existing.lastStayCheckOut = b.checkOut;
        } else if (b.status === 'RESERVED' && existing.currentStatus !== 'IN_HOUSE') {
          existing.currentStatus = 'RESERVED';
          existing.currentRoom = b.room.number;
        }

        // Sync contact details if existing is empty
        if (!existing.phone && b.guest.phone) existing.phone = b.guest.phone;
        if (!existing.email && b.guest.email) existing.email = b.guest.email;
        if (!existing.address && b.guest.address) existing.address = b.guest.address;
        if (b.guest.vipTier && b.guest.vipTier !== 'STANDARD') existing.vipTier = b.guest.vipTier;
      }
    });

    return Array.from(map.values());
  }, [bookings]);

  // Tab definitions (Box-type, no numbers)
  const tabs = [
    { id: 'ALL' as const, label: 'All' },
    { id: 'IN_HOUSE' as const, label: 'In-House' },
    { id: 'VIP' as const, label: 'VIP Guests' },
    { id: 'FREQUENT' as const, label: 'Frequent' },
    { id: 'STANDARD' as const, label: 'Standard' },
  ];

  // Filtered List
  const filteredGuests = useMemo(() => {
    return guestList.filter((g) => {
      // 1. Tab Filter
      if (activeTab === 'IN_HOUSE' && g.currentStatus !== 'IN_HOUSE') return false;
      if (activeTab === 'VIP' && (g.vipTier === 'STANDARD' || !g.vipTier)) return false;
      if (activeTab === 'FREQUENT' && g.totalStays < 2) return false;
      if (activeTab === 'STANDARD' && g.vipTier !== 'STANDARD') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = g.fullName.toLowerCase().includes(q);
        const matchesPhone = g.phone.toLowerCase().includes(q);
        const matchesEmail = g.email.toLowerCase().includes(q);
        const matchesCountry = g.country.toLowerCase().includes(q);
        const matchesId = g.idNumber.toLowerCase().includes(q);
        const matchesRoom = (g.currentRoom || g.lastStayRoom || '').toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCountry && !matchesId && !matchesRoom) {
          return false;
        }
      }

      return true;
    });
  }, [guestList, activeTab, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredGuests.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedGuests = useMemo(() => {
    return filteredGuests.slice(startIndex, startIndex + pageSize);
  }, [filteredGuests, startIndex, pageSize]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const renderVipBadge = (tier: GuestProfile['vipTier']) => {
    switch (tier) {
      case 'PLATINUM':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Award className="w-2.5 h-2.5" />
            PLATINUM
          </span>
        );
      case 'GOLD':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Award className="w-2.5 h-2.5" />
            GOLD
          </span>
        );
      case 'SILVER':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            SILVER
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Quick New Reservation
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Contact className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
            <span>Guest Directory</span>
          </h1>
        </div>

        <Link
          href="/booking?from=guests"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* -----------------------------------------------------------------------
          FILTER TOOLBAR: Box-type Status Buttons (No numbers) & Search Bar
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Box-type Status Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap',
                  isActive
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
                    : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Search Box */}
        <div className="relative flex-1 sm:w-64 min-w-[200px] self-start xl:self-auto w-full xl:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, phone, room, ID..."
            className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
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
          MAIN GUEST DIRECTORY DATATABLE
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">GUEST NAME</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">CONTACT</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">VISITS & NIGHTS</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700">TOTAL SPEND</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">STATUS / LAST ROOM</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ID / KYC</th>
                <th className="py-2.5 px-3 text-center w-36">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No guest profiles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedGuests.map((g, idx) => {
                  const isInHouse = g.currentStatus === 'IN_HOUSE';
                  const isReserved = g.currentStatus === 'RESERVED';

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Serial Number */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {startIndex + idx + 1}
                      </td>

                      {/* 2. Guest Name with VIP Tier & Nationality */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedGuest(g)}
                            className="font-bold text-slate-900 dark:text-white hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:underline cursor-pointer text-left"
                          >
                            {g.fullName}
                          </button>
                          {renderVipBadge(g.vipTier)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{g.country || 'Nepal'}</span>
                          {g.address && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[120px]">{g.address}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 3. Contact (Phone & Email) */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{g.phone || '—'}</span>
                        </div>
                        {g.email && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{g.email}</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Visits & Nights */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {g.totalStays} {g.totalStays === 1 ? 'Stay' : 'Stays'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {g.totalNights} {g.totalNights === 1 ? 'Night' : 'Nights'} Total
                        </div>
                      </td>

                      {/* 5. Total Lifetime Spend */}
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {g.totalSpent.toLocaleString()}
                      </td>

                      {/* 6. Current / Last Stay Room */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                        {isInHouse ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <BedDouble className="w-3 h-3 text-emerald-600" />
                              In-House (Rm {g.currentRoom})
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Depart: {g.lastStayCheckOut}
                            </div>
                          </div>
                        ) : isReserved ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Reserved (Rm {g.currentRoom})
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Arrive: {g.lastStayCheckIn}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              Room {g.lastStayRoom || '—'}
                            </span>
                            {g.lastStayCheckOut && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Left {g.lastStayCheckOut}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 7. ID / KYC Details */}
                      <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          {g.idType || 'ID Document'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {g.idNumber || 'Not Uploaded'}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedGuest(g)}
                            className="p-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-600 hover:text-[#0B3D32] hover:bg-slate-50 dark:text-slate-300 cursor-pointer shadow-2xs"
                            title="View Guest CRM Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/booking?guestName=${encodeURIComponent(g.fullName)}&phone=${encodeURIComponent(g.phone)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-[11px] font-bold shadow-2xs transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
                            title="Create new reservation for guest"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Book</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          DATATABLES PAGINATION FOOTER: Entries & Page Selector on Left, Next/Prev on Right
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
        {/* Left side: Show Entries per page + Entries summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[28px] px-2 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

          <div>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(startIndex + pageSize, totalEntries)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalEntries}</strong>{' '}
            entries
          </div>
        </div>

        {/* DataTables Style Pagination Group (Image 2 style) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
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
                      'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                        : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------------
          GUEST PROFILE & STAY HISTORY MODAL
          ----------------------------------------------------------------------- */}
      {selectedGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 backdrop-blur-xs select-none"
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#07241E] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0B3D32] text-white flex items-center justify-center font-bold text-sm">
                  {selectedGuest.firstName[0]}
                  {selectedGuest.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedGuest.fullName}
                    </h3>
                    {renderVipBadge(selectedGuest.vipTier)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Guest Profile ID: <span className="font-mono text-slate-700 dark:text-slate-300">{selectedGuest.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Visits</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedGuest.totalStays} {selectedGuest.totalStays === 1 ? 'Stay' : 'Stays'}
                  </p>
                </div>

                <div className="p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Nights</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                    {selectedGuest.totalNights} Nights
                  </p>
                </div>

                <div className="p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Lifetime Revenue</span>
                  <p className="text-base font-black text-[#0B3D32] dark:text-emerald-400 mt-0.5 font-mono">
                    Rs. {selectedGuest.totalSpent.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                  <div className="mt-1">
                    {selectedGuest.currentStatus === 'IN_HOUSE' ? (
                      <span className="inline-block px-2 py-0.5 rounded-[2px] font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        In-House Rm {selectedGuest.currentRoom}
                      </span>
                    ) : selectedGuest.currentStatus === 'RESERVED' ? (
                      <span className="inline-block px-2 py-0.5 rounded-[2px] font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        Reserved Rm {selectedGuest.currentRoom}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-[2px] font-bold text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Checked Out
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal & Verification Details */}
              <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                  <span>Contact & KYC Verification</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Phone Number:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                      {selectedGuest.phone || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Email Address:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedGuest.email || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Nationality / Country:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedGuest.country || 'Nepal'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Address:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedGuest.address || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Identification Type:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedGuest.idType || 'Citizenship'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">ID Document Number:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedGuest.idNumber || 'Verified at desk'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stay History Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                  <span>Stay History ({selectedGuest.stays.length})</span>
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                      <tr>
                        <th className="py-2 px-3">Booking Code</th>
                        <th className="py-2 px-3">Room</th>
                        <th className="py-2 px-3">Stay Dates</th>
                        <th className="py-2 px-3 text-right">Charges</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedGuest.stays.map((st) => (
                        <tr key={st.bookingId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                            {st.bookingCode}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Room {st.roomNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{st.roomType}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px]">
                            {st.checkIn} → {st.checkOut} ({st.nights}N)
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            Rs. {st.totalCharges.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Close
              </button>

              <Link
                href={`/booking?guestName=${encodeURIComponent(selectedGuest.fullName)}&phone=${encodeURIComponent(selectedGuest.phone)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Stay For Guest</span>
              </Link>
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

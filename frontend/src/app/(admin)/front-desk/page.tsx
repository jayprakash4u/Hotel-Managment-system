'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LogIn,
  LogOut,
  Users,
  Search,
  CheckCircle2,
  Receipt,
  RefreshCw,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  Plus,
  BedDouble,
  Sparkles,
  Calendar,
  Utensils,
  Printer,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  AlertCircle,
  Building2,
  Layers,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MoreVertical,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { FrontDeskNavBoxes } from '@/components/common/FrontDeskNavBoxes';
import { RoomTapeChart } from '@/components/business/RoomTapeChart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ReservationStatusBadge, VipBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  AVAILABLE_ROOMS_CATALOG,
  AvailableRoomOption,
  CAFE_MENU_ITEMS,
  performCheckIn,
  performCheckOut,
  addCafeOrderToBooking,
  getRelativeDate,
  getAvailableRoomsForDates,
} from '@/app/(admin)/reservations/reservationsData';
import { GuidedBookingModal } from '@/components/business/GuidedBookingModal';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface FrontDeskRoom {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType: string;
  acType?: 'AC' | 'Non-AC';
  pricePerNight: number;
  capacity: number;
  operationalStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
  maintenanceReason?: string;
}

const DEFAULT_FRONT_DESK_ROOMS: FrontDeskRoom[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Room', bedType: 'Twin Beds', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Room', bedType: 'Twin Beds', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'AC Servicing & Plumbing' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 5500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 5500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 3, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Painting & Touchup' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Electrical Inspection' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', acType: 'AC', pricePerNight: 9500, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', acType: 'AC', pricePerNight: 18500, capacity: 6, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
];

function getDateWindow(centerDateStr: string, totalDays = 10) {
  const [y, m, d] = centerDateStr.split('-').map(Number);
  const centerDate = new Date(y, m - 1, d);
  const result: { dateStr: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] = [];
  const todayStr = getRelativeDate(0);

  let daysBefore = 0;
  if (totalDays === 1) {
    daysBefore = 0;
  } else if (totalDays === 2) {
    daysBefore = 0;
  } else if (totalDays === 7) {
    daysBefore = 1;
  } else if (totalDays === 10) {
    daysBefore = 2;
  } else if (totalDays === 14) {
    daysBefore = 2;
  } else if (totalDays === 30) {
    daysBefore = 3;
  } else {
    daysBefore = Math.floor(totalDays / 5);
  }

  const daysAfter = totalDays - 1 - daysBefore;

  for (let i = -daysBefore; i <= daysAfter; i++) {
    const target = new Date(centerDate.getTime() + i * 86400000);
    const dateStr = target.toISOString().split('T')[0];
    const dayName = target.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = target.getDate();
    const monthName = target.toLocaleDateString('en-US', { month: 'short' });
    result.push({
      dateStr,
      dayName,
      dayNum,
      monthName,
      isToday: dateStr === todayStr,
    });
  }
  return result;
}

type RoomDeskStatus = 'AVAILABLE' | 'ARRIVING' | 'OCCUPIED' | 'DEPARTING' | 'MAINTENANCE';

function getRoomStatusForDate(
  room: FrontDeskRoom,
  bookings: RoomBooking[],
  targetDate: string
): { status: RoomDeskStatus; booking: RoomBooking | null; isDeparting: boolean } {
  if (room.operationalStatus === 'MAINTENANCE') {
    return { status: 'MAINTENANCE', booking: null, isDeparting: false };
  }

  // 1. Arriving on targetDate
  const arriving = bookings.find(
    (b) =>
      b.room.number === room.number &&
      b.checkIn === targetDate &&
      b.status === 'RESERVED'
  );
  if (arriving) {
    return { status: 'ARRIVING', booking: arriving, isDeparting: false };
  }

  // 2. Departing on targetDate (checked in and checking out on targetDate)
  const departing = bookings.find(
    (b) =>
      b.room.number === room.number &&
      b.status === 'CHECKED_IN' &&
      b.checkOut === targetDate
  );
  if (departing) {
    return { status: 'DEPARTING', booking: departing, isDeparting: true };
  }

  // 3. In-House on targetDate (checked in on/before targetDate and checking out after targetDate)
  const inHouse = bookings.find(
    (b) =>
      b.room.number === room.number &&
      b.status === 'CHECKED_IN' &&
      b.checkIn <= targetDate &&
      targetDate < b.checkOut
  );
  if (inHouse) {
    return { status: 'OCCUPIED', booking: inHouse, isDeparting: false };
  }

  // 4. Reserved stay covering targetDate
  const reservedCovering = bookings.find(
    (b) =>
      b.room.number === room.number &&
      b.status === 'RESERVED' &&
      b.checkIn <= targetDate &&
      targetDate < b.checkOut
  );
  if (reservedCovering) {
    return { status: 'OCCUPIED', booking: reservedCovering, isDeparting: false };
  }

  return { status: 'AVAILABLE', booking: null, isDeparting: false };
}

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs';

function FrontDeskContent() {
  const toast = useToast();
  const searchParams = useSearchParams();

  // Primary State: Bookings loaded from local storage
  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Today's Date String: YYYY-MM-DD
  const todayDateStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowDateStr = useMemo(() => getRelativeDate(1), []);

  // Selected date for the Box-Type Room Desk view
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [dateWindowDays, setDateWindowDays] = useState<number>(10);

  // Active Main Tab: Arrivals, Currently Staying, Departures
  const [activeTab, setActiveTab] = useState<'arrivals' | 'staying' | 'departures'>('arrivals');
  const [viewMode, setViewMode] = useState<'boxes' | 'chart'>('boxes');
  const [searchQuery, setSearchQuery] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState<'TODAY' | 'ALL'>('TODAY');

  // Box View Filters
  const [boxStatusFilter, setBoxStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'ARRIVING' | 'MAINTENANCE'>('ALL');
  const [boxFloorFilter, setBoxFloorFilter] = useState<string>('ALL');
  const [boxTypeFilter, setBoxTypeFilter] = useState<string>('ALL');
  const [boxSearchQuery, setBoxSearchQuery] = useState('');

  // URL Query handling
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'staying') setActiveTab('staying');
    else if (tabParam === 'departures') setActiveTab('departures');
    else if (tabParam === 'arrivals') setActiveTab('arrivals');

    const actionParam = searchParams.get('action');
    if (actionParam === 'checkin') {
      // Find today's arrival for Ram Sharma or first pending arrival
      const ram = bookings.find((b) => b.id === 'bk-1001' && b.status === 'RESERVED');
      if (ram) {
        handleOpenCheckInModal(ram);
      } else {
        const firstPending = bookings.find((b) => b.status === 'RESERVED');
        if (firstPending) handleOpenCheckInModal(firstPending);
      }
    }
  }, [searchParams]);

  // Synchronize storage whenever bookings change
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Room State & Dynamic Date Calculation for Room Box Desk
  const [rooms, setRooms] = useState<FrontDeskRoom[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_rooms_setup_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as FrontDeskRoom[];
          }
        }
      } catch (e) {}
    }
    return DEFAULT_FRONT_DESK_ROOMS;
  });

  // Sync rooms to localStorage whenever modified
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_rooms_setup_v2', JSON.stringify(rooms));
    }
  }, [rooms]);

  // Option Menu state: which room's option box is open
  const [openOptionMenuId, setOpenOptionMenuId] = useState<string | null>(null);

  const handleSetCleaningStatus = (roomId: string, cleaningStatus: 'CLEAN' | 'DIRTY') => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        return { ...r, cleaningStatus };
      })
    );
    toast.celebrate(
      'Housekeeping Updated',
      `Room marked as ${cleaningStatus === 'CLEAN' ? 'Clean' : 'Dirty'}.`
    );
  };

  const handleToggleMaintenance = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const isMaint = r.operationalStatus === 'MAINTENANCE';
        const nextStatus = isMaint ? 'AVAILABLE' : 'MAINTENANCE';
        toast.info(
          'Room Maintenance',
          isMaint
            ? `Room ${r.number} is now Available.`
            : `Room ${r.number} is placed under Maintenance.`
        );
        return {
          ...r,
          operationalStatus: nextStatus,
          maintenanceReason: isMaint ? undefined : 'AC & General Servicing',
        };
      })
    );
  };

  const distinctFloors = useMemo(() => {
    const s = new Set<number>();
    rooms.forEach((r) => s.add(r.floor));
    return Array.from(s).sort((a, b) => a - b);
  }, [rooms]);

  const distinctTypes = useMemo(() => {
    const s = new Set<string>();
    rooms.forEach((r) => s.add(r.type));
    return Array.from(s).sort();
  }, [rooms]);

  const dateTiles = useMemo(() => {
    return getDateWindow(selectedDate, dateWindowDays);
  }, [selectedDate, dateWindowDays]);

  const countsOnDate = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let arriving = 0;
    let maintenance = 0;

    rooms.forEach((r) => {
      const st = getRoomStatusForDate(r, bookings, selectedDate);
      if (st.status === 'AVAILABLE') available++;
      else if (st.status === 'ARRIVING') arriving++;
      else if (st.status === 'OCCUPIED' || st.status === 'DEPARTING') occupied++;
      else if (st.status === 'MAINTENANCE') maintenance++;
    });

    return {
      all: rooms.length,
      available,
      occupied,
      arriving,
      maintenance,
    };
  }, [rooms, bookings, selectedDate]);

  const filteredBoxRooms = useMemo(() => {
    return rooms.filter((room) => {
      const roomStatus = getRoomStatusForDate(room, bookings, selectedDate);

      // 1. Status Filter
      if (boxStatusFilter !== 'ALL') {
        if (boxStatusFilter === 'AVAILABLE' && roomStatus.status !== 'AVAILABLE') return false;
        if (boxStatusFilter === 'ARRIVING' && roomStatus.status !== 'ARRIVING') return false;
        if (boxStatusFilter === 'OCCUPIED' && (roomStatus.status !== 'OCCUPIED' && roomStatus.status !== 'DEPARTING')) return false;
        if (boxStatusFilter === 'MAINTENANCE' && roomStatus.status !== 'MAINTENANCE') return false;
      }

      // 2. Floor Filter
      if (boxFloorFilter !== 'ALL' && room.floor.toString() !== boxFloorFilter) return false;

      // 3. Type Filter
      if (boxTypeFilter !== 'ALL' && room.type !== boxTypeFilter) return false;

      // 4. Search Query
      if (boxSearchQuery.trim()) {
        const q = boxSearchQuery.toLowerCase().trim();
        const matchesNum = room.number.toLowerCase().includes(q);
        const matchesType = room.type.toLowerCase().includes(q);
        let matchesGuest = false;
        if (roomStatus.booking) {
          const fullName = `${roomStatus.booking.guest.firstName} ${roomStatus.booking.guest.lastName}`.toLowerCase();
          const matchesCode = roomStatus.booking.bookingCode.toLowerCase().includes(q);
          const matchesPhone = roomStatus.booking.guest.phone.includes(q);
          matchesGuest = fullName.includes(q) || matchesCode || matchesPhone;
        }
        if (!matchesNum && !matchesType && !matchesGuest) return false;
      }

      return true;
    });
  }, [rooms, bookings, selectedDate, boxStatusFilter, boxFloorFilter, boxTypeFilter, boxSearchQuery]);

  const handleQuickBookRoom = (room: FrontDeskRoom) => {
    setGuidedBookingWalkIn(true);
    setGuidedBookingInitialRoom(room.id);
    setGuidedBookingCheckIn(selectedDate);
    const nextDate = new Date(new Date(selectedDate).getTime() + 86400000).toISOString().split('T')[0];
    setGuidedBookingCheckOut(nextDate);
    setIsGuidedBookingOpen(true);
  };

  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    setSelectedDate(dt.toISOString().split('T')[0]);
  };

  // Guided Booking Flow (Walk-in / Guided New Reservation)
  const [isGuidedBookingOpen, setIsGuidedBookingOpen] = useState(false);
  const [guidedBookingWalkIn, setGuidedBookingWalkIn] = useState(false);
  const [guidedBookingInitialRoom, setGuidedBookingInitialRoom] = useState<string | undefined>(undefined);
  const [guidedBookingCheckIn, setGuidedBookingCheckIn] = useState<string | undefined>(undefined);
  const [guidedBookingCheckOut, setGuidedBookingCheckOut] = useState<string | undefined>(undefined);

  // Live Room Availability Search Widget State
  const [searchCheckIn, setSearchCheckIn] = useState(todayDateStr);
  const [searchCheckOut, setSearchCheckOut] = useState(tomorrowDateStr);
  const [showAvailabilityWidget, setShowAvailabilityWidget] = useState(true);

  const searchedRooms = useMemo(() => {
    return getAvailableRoomsForDates(searchCheckIn, searchCheckOut, bookings);
  }, [searchCheckIn, searchCheckOut, bookings]);

  // ---------------------------------------------------------------------------
  // 1. FILTERED LISTS
  // ---------------------------------------------------------------------------

  // Today's Arrivals (status === 'RESERVED')
  const arrivals = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status !== 'RESERVED') return false;
      if (arrivalFilter === 'TODAY') {
        return b.checkIn <= todayDateStr;
      }
      return true;
    });
  }, [bookings, arrivalFilter, todayDateStr]);

  // Currently Staying (status === 'CHECKED_IN')
  const currentlyStaying = useMemo(() => {
    return bookings.filter((b) => b.status === 'CHECKED_IN');
  }, [bookings]);

  // Departures (status === 'CHECKED_IN' & checkOut <= todayDateStr or departing soon)
  const departures = useMemo(() => {
    return bookings.filter((b) => b.status === 'CHECKED_IN' && b.checkOut <= todayDateStr);
  }, [bookings, todayDateStr]);

  // Clean rooms ready for key assignment
  const cleanRooms = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.filter((r) => r.status === 'AVAILABLE' && r.cleaningStatus === 'CLEAN');
  }, []);

  // Filtered arrivals by search
  const filteredArrivals = useMemo(() => {
    if (!searchQuery.trim()) return arrivals;
    const q = searchQuery.toLowerCase().trim();
    return arrivals.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.guest.firstName.toLowerCase().includes(q) ||
        b.guest.lastName.toLowerCase().includes(q) ||
        b.room.number.toLowerCase().includes(q) ||
        b.guest.phone.includes(q)
    );
  }, [arrivals, searchQuery]);

  // Filtered staying guests by search
  const filteredStaying = useMemo(() => {
    if (!searchQuery.trim()) return currentlyStaying;
    const q = searchQuery.toLowerCase().trim();
    return currentlyStaying.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.guest.firstName.toLowerCase().includes(q) ||
        b.guest.lastName.toLowerCase().includes(q) ||
        b.room.number.toLowerCase().includes(q) ||
        b.guest.phone.includes(q)
    );
  }, [currentlyStaying, searchQuery]);

  // ---------------------------------------------------------------------------
  // 2. CHECK IN GUEST MODAL WORKFLOW
  // ---------------------------------------------------------------------------
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<RoomBooking | null>(null);

  // Check In Form Fields
  const [checkInGuestName, setCheckInGuestName] = useState('');
  const [checkInPhone, setCheckInPhone] = useState('');
  const [checkInEmail, setCheckInEmail] = useState('');
  const [checkInIdType, setCheckInIdType] = useState('Citizenship');
  const [checkInIdNumber, setCheckInIdNumber] = useState('');
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkInRoomId, setCheckInRoomId] = useState('rm-101');
  const [checkInDepositAmount, setCheckInDepositAmount] = useState<number>(2000);
  const [checkInPaymentMethod, setCheckInPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER'>('CASH');

  const handleOpenCheckInModal = (booking: RoomBooking) => {
    setSelectedBookingForCheckIn(booking);
    setCheckInGuestName(`${booking.guest.firstName} ${booking.guest.lastName}`.trim());
    setCheckInPhone(booking.guest.phone);
    setCheckInEmail(booking.guest.email);
    setCheckInIdType(booking.guest.idType || 'Citizenship');
    setCheckInIdNumber(booking.guest.idNumber || '');
    setCheckInAddress(booking.guest.address || 'Kathmandu, Nepal');
    setCheckInRoomId(booking.room.id || 'rm-101');

    // Default recommended deposit: 50% or standard advance
    const totalEst = booking.roomCharges || 3500;
    const existingPaid = (booking.payments || []).reduce((s, p) => s + p.amount, 0);
    const needed = Math.max(0, Math.round(totalEst * 0.5) - existingPaid);
    setCheckInDepositAmount(needed > 0 ? needed : 2000);
    setCheckInPaymentMethod('CASH');

    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = () => {
    if (!selectedBookingForCheckIn) return;

    const [first, ...rest] = checkInGuestName.split(' ');
    const lastName = rest.join(' ') || 'Guest';

    const { updatedBookings, checkedInBooking } = performCheckIn(bookings, selectedBookingForCheckIn.id, {
      assignedRoomId: checkInRoomId,
      depositAmount: Number(checkInDepositAmount) || 0,
      paymentMethod: checkInPaymentMethod,
      verifiedGuest: {
        firstName: first || 'Guest',
        lastName,
        phone: checkInPhone,
        email: checkInEmail,
        idType: checkInIdType,
        idNumber: checkInIdNumber,
        address: checkInAddress,
      },
    });

    setBookings(updatedBookings);
    setIsCheckInModalOpen(false);

    toast.celebrate(
      'Guest Checked In Successfully!',
      `${checkedInBooking?.guest.firstName} ${checkedInBooking?.guest.lastName} is now in Room ${checkedInBooking?.room.number}. Key issued.`
    );

    // Switch view to Currently Staying so receptionist immediately sees guest in-house
    setActiveTab('staying');
  };

  // ---------------------------------------------------------------------------
  // 3. CHECK OUT GUEST MODAL WORKFLOW
  // ---------------------------------------------------------------------------
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<RoomBooking | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER'>('CASH');
  const [checkoutSettlementAmount, setCheckoutSettlementAmount] = useState<number>(0);
  const [checkoutHousekeepingNote, setCheckoutHousekeepingNote] = useState('Checkout completed. Room sent for sanitization.');

  const handleOpenCheckOutModal = (booking: RoomBooking) => {
    setSelectedBookingForCheckOut(booking);
    const fin = getBookingFinancials(booking);
    setCheckoutSettlementAmount(fin.balanceDue);
    setCheckoutPaymentMethod('CASH');
    setCheckoutHousekeepingNote(`Checkout completed for ${booking.guest.firstName} ${booking.guest.lastName}. Room ${booking.room.number} sent to cleaning.`);
    setIsCheckOutModalOpen(true);
  };

  const handleConfirmCheckOut = () => {
    if (!selectedBookingForCheckOut) return;

    const { updatedBookings, checkedOutBooking } = performCheckOut(bookings, selectedBookingForCheckOut.id, {
      settlementAmount: Number(checkoutSettlementAmount) || 0,
      paymentMethod: checkoutPaymentMethod,
      housekeepingNotes: checkoutHousekeepingNote,
    });

    setBookings(updatedBookings);
    setIsCheckOutModalOpen(false);

    toast.celebrate(
      'Checkout Confirmed & Folio Settled!',
      `${checkedOutBooking?.guest.firstName} ${checkedOutBooking?.guest.lastName} checked out. Room ${checkedOutBooking?.room.number} marked as DIRTY for Housekeeping.`
    );
  };

  // ---------------------------------------------------------------------------
  // 4. ADD FOOD & CAFE ORDER TO ROOM WORKFLOW
  // ---------------------------------------------------------------------------
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [selectedBookingForFood, setSelectedBookingForFood] = useState<RoomBooking | null>(null);
  const [selectedFoodItems, setSelectedFoodItems] = useState<Record<string, number>>({});

  const handleOpenAddFoodModal = (booking: RoomBooking) => {
    setSelectedBookingForFood(booking);
    setSelectedFoodItems({});
    setIsAddFoodModalOpen(true);
  };

  const handleConfirmAddFood = () => {
    if (!selectedBookingForFood) return;

    const orderItems: { name: string; quantity: number; price: number }[] = [];
    Object.entries(selectedFoodItems).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const item = CAFE_MENU_ITEMS.find((m) => m.id === itemId);
        if (item) {
          orderItems.push({ name: item.name, quantity: qty, price: item.price });
        }
      }
    });

    if (orderItems.length === 0) {
      toast.error('No items selected', 'Please choose at least one dish or drink.');
      return;
    }

    const updated = addCafeOrderToBooking(bookings, selectedBookingForFood.id, orderItems);
    setBookings(updated);
    setIsAddFoodModalOpen(false);

    toast.celebrate(
      'Food Charged to Room!',
      `Added ${orderItems.length} items to Room ${selectedBookingForFood.room.number}'s bill.`
    );
  };

  // ---------------------------------------------------------------------------
  // 5. VIEW FOLIO DRAWER
  // ---------------------------------------------------------------------------
  const [isFolioDrawerOpen, setIsFolioDrawerOpen] = useState(false);
  const [selectedBookingForFolio, setSelectedBookingForFolio] = useState<RoomBooking | null>(null);

  const handleOpenFolioDrawer = (booking: RoomBooking) => {
    setSelectedBookingForFolio(booking);
    setIsFolioDrawerOpen(true);
  };


  // ---------------------------------------------------------------------------
  // 7. ROOM TAPE CHART HANDLERS
  // ---------------------------------------------------------------------------
  const handleTapeChartNewBooking = (roomNumber: string, checkInDate: string) => {
    setGuidedBookingWalkIn(checkInDate <= todayDateStr);
    const matchedRoom = AVAILABLE_ROOMS_CATALOG.find(
      (r) => r.number === roomNumber || r.id === roomNumber
    );
    setGuidedBookingInitialRoom(matchedRoom ? matchedRoom.id : undefined);
    setGuidedBookingCheckIn(checkInDate);
    const nextOut = new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split('T')[0];
    setGuidedBookingCheckOut(nextOut);
    setIsGuidedBookingOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Front Desk Option Boxes (Matching Hotel Setup Category Boxes) */}
      <FrontDeskNavBoxes activeId="desk" />

      {/* Clean Front Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
            Check-in Desk
          </h1>
          {/* View Mode Toggle: Room Boxes vs Timeline Matrix */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('boxes')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'boxes'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Room Boxes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'chart'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Timeline Matrix</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGuidedBookingWalkIn(true);
              setGuidedBookingInitialRoom(undefined);
              setGuidedBookingCheckIn(selectedDate);
              const nextOut = new Date(new Date(selectedDate).getTime() + 86400000).toISOString().split('T')[0];
              setGuidedBookingCheckOut(nextOut);
              setIsGuidedBookingOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-semibold bg-[#0B3D32] hover:bg-[#072B23] text-white"
          >
            + Walk-in Check-in
          </Button>
        </div>
      </div>

      {/* Conditionally render: Room Boxes (Default) OR Timeline Matrix OR Guest Lists */}
      {viewMode === 'boxes' ? (
        <div className="space-y-3.5">
          {/* -----------------------------------------------------------------
              PROMINENT DATE SELECTOR BAR ("date should show above all date")
              ----------------------------------------------------------------- */}
          <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs space-y-3">
            {/* Row 1: Quick Jump, Date Navigation & Status Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Date Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Days Range Dropdown (1 day, 2 days, 7 days, 10 days, 14 days, 1 month) */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">View:</span>
                  <select
                    value={dateWindowDays}
                    onChange={(e) => setDateWindowDays(Number(e.target.value))}
                    className="text-xs font-semibold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
                    title="Select number of days to display in the date strip"
                  >
                    <option value={1}>1 Day</option>
                    <option value={2}>2 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={10}>10 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>1 Month</option>
                  </select>
                </div>

                {/* Unified Date Stepper: < Today > (Matching User Screenshot) */}
                <div className="flex items-center rounded-md border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-[#0E362C] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayDateStr)}
                    className={cn(
                      'px-3.5 py-1 text-xs font-bold rounded transition-all cursor-pointer',
                      selectedDate === todayDateStr
                        ? 'bg-white text-[#0B3D32] shadow-2xs font-extrabold dark:bg-[#0E362C] dark:text-emerald-300'
                        : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 hover:bg-white/60'
                    )}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-[#0E362C] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Date Picker */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="text-xs font-mono font-bold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
                  />
                </div>

                {/* Formatted Date Title */}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden xl:inline ml-1 font-mono">
                  {new Date(selectedDate).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {selectedDate === todayDateStr && ' (Today)'}
                </span>
              </div>

              {/* Status Summary Chips (Quick Filters - 100% Unscrollable, Always Showing All) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'All', count: countsOnDate.all, dot: null },
                  { id: 'AVAILABLE', label: 'Available', count: countsOnDate.available, dot: 'bg-emerald-500' },
                  { id: 'OCCUPIED', label: 'Booked', count: countsOnDate.occupied, dot: 'bg-blue-500' },
                  { id: 'ARRIVING', label: 'Arriving', count: countsOnDate.arriving, dot: 'bg-amber-500' },
                  { id: 'MAINTENANCE', label: 'Maintenance', count: countsOnDate.maintenance, dot: 'bg-slate-400' },
                ].map((pill) => {
                  const isSelected = boxStatusFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setBoxStatusFilter(pill.id as any)}
                      className={cn(
                        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                          : 'bg-[#FAFBF9] border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#F2F6F4] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                      )}
                    >
                      {pill.dot && <span className={cn('w-1.5 h-1.5 rounded-full', pill.dot)} />}
                      <span>{pill.label}</span>
                      <span
                        className={cn(
                          'rounded-[2px] px-1 py-0.2 text-[10px] font-mono',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-[#0E362C] text-[#64736C] dark:text-emerald-300'
                        )}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Horizontal Date Strip (Carousel of Dates) */}
            <div className="pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] overflow-x-auto custom-scrollbar">
              <div className="flex items-center gap-1.5 min-w-max pb-1">
                {dateTiles.map((tile) => {
                  const isSelected = tile.dateStr === selectedDate;
                  return (
                    <button
                      key={tile.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(tile.dateStr)}
                      className={cn(
                        'flex flex-col items-center justify-center py-1.5 px-3 rounded-[3px] min-w-[70px] border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs dark:bg-emerald-700 dark:border-emerald-600'
                          : 'bg-white dark:bg-[#061B16] border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-[#F2F6F4] dark:hover:bg-[#093027]'
                      )}
                    >
                      <span className={cn(
                        'text-[10px] uppercase font-bold tracking-wider',
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      )}>
                        {tile.isToday ? 'TODAY' : tile.dayName}
                      </span>
                      <span className="font-mono text-base font-extrabold leading-tight">
                        {tile.dayNum}
                      </span>
                      <span className={cn(
                        'text-[9px] uppercase font-semibold',
                        isSelected ? 'text-emerald-100' : 'text-slate-400'
                      )}>
                        {tile.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Secondary Filters: Floor, Room Type & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Floor Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Floor:</span>
                  <select
                    value={boxFloorFilter}
                    onChange={(e) => setBoxFloorFilter(e.target.value)}
                    className="rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] dark:border-[#145447] px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white"
                  >
                    <option value="ALL">All Floors</option>
                    {distinctFloors.map((f) => (
                      <option key={f} value={f.toString()}>
                        Floor {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Type Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Type:</span>
                  <select
                    value={boxTypeFilter}
                    onChange={(e) => setBoxTypeFilter(e.target.value)}
                    className="rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] dark:border-[#145447] px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white max-w-[150px] truncate"
                  >
                    <option value="ALL">All Types</option>
                    {distinctTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {(boxStatusFilter !== 'ALL' || boxFloorFilter !== 'ALL' || boxTypeFilter !== 'ALL' || boxSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBoxStatusFilter('ALL');
                      setBoxFloorFilter('ALL');
                      setBoxTypeFilter('ALL');
                      setBoxSearchQuery('');
                    }}
                    className="text-xs text-[#0B3D32] dark:text-emerald-400 underline font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={boxSearchQuery}
                  onChange={(e) => setBoxSearchQuery(e.target.value)}
                  placeholder="Search room #, guest, Res ID..."
                  className="w-full h-8 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1 pl-8 pr-7 text-xs font-medium dark:border-[#145447] dark:bg-[#061B16] dark:text-white"
                />
                {boxSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBoxSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              ROOM BOXES GRID ("it should be box type")
              ----------------------------------------------------------------- */}
          {filteredBoxRooms.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] text-slate-400 text-xs">
              No rooms match the selected filters for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredBoxRooms.map((room) => {
                const roomStatus = getRoomStatusForDate(room, bookings, selectedDate);
                const status = roomStatus.status;
                const activeBooking = roomStatus.booking;

                // State analysis for smart option handling
                const isBooked = status === 'ARRIVING'; // Reserved booking exists for this room on selected date
                const isOccupied = status === 'OCCUPIED' || status === 'DEPARTING'; // Guest is currently staying in room
                const isMaintenance = status === 'MAINTENANCE';
                const isAvailable = status === 'AVAILABLE';

                // Book Now: ONLY clickable when room is vacant and not under maintenance
                const canBookNow = isAvailable && !isMaintenance;

                // Check In:
                // - Clickable when room is booked (ARRIVING with reservation ready to check in)
                // - Clickable when room is available (direct walk-in check-in)
                // - Disabled when room is already occupied or in maintenance
                const canCheckIn = (isBooked && !!activeBooking) || isAvailable;

                // Check Out:
                // - ONLY clickable when guest is currently staying in the room
                // - Disabled for vacant, booked, or maintenance rooms
                const canCheckOut = isOccupied && !!activeBooking;

                // Housekeeping
                const isClean = room.cleaningStatus === 'CLEAN';
                const isDirty = room.cleaningStatus === 'DIRTY';

                // Maintenance toggle: cannot place room in maintenance while guest is in-house
                const canToggleMaintenance = !isOccupied;

                return (
                  <div
                    key={room.id}
                    className={cn(
                      'relative flex flex-col justify-between p-3 rounded-[3px] border transition-all duration-150 shadow-2xs select-none',
                      openOptionMenuId === room.id ? 'z-50 ring-2 ring-[#0B3D32] dark:ring-emerald-500 shadow-md' : 'z-0',
                      status === 'AVAILABLE' && 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-emerald-600 hover:shadow-xs',
                      status === 'ARRIVING' && 'bg-[#FFFDF5] dark:bg-[#251D08] border-amber-300 dark:border-amber-700/80 hover:border-amber-500',
                      (status === 'OCCUPIED' || status === 'DEPARTING') && 'bg-[#F9FAFC] dark:bg-[#0E1E2C] border-blue-200 dark:border-blue-900/60 hover:border-blue-400',
                      status === 'MAINTENANCE' && 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                    )}
                  >
                    {/* Top: Room Number + Floor/Type (Left) | Status Badge & Right-Side Option Trigger (Right) */}
                    <div>
                      <div className="flex items-start justify-between gap-1 pb-2 border-b border-[#EAEFEA] dark:border-[#145447]/60">
                        <div className="min-w-0 flex-1 pr-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-xl font-extrabold text-[#24352F] dark:text-white tracking-tight">
                              {room.number}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Fl {room.floor}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                            {room.type}
                          </div>
                        </div>

                        {/* Right side: Status Badge + Clickable Option Trigger (Clicking right side opens options) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                          }}
                          className="shrink-0 flex items-center gap-1.5 cursor-pointer group"
                          title={`Click right side for Room ${room.number} options`}
                        >
                          <div>
                            {status === 'AVAILABLE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Available
                              </span>
                            )}
                            {status === 'ARRIVING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Booked
                              </span>
                            )}
                            {status === 'DEPARTING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Departing
                              </span>
                            )}
                            {status === 'OCCUPIED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Occupied
                              </span>
                            )}
                            {status === 'MAINTENANCE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                Service
                              </span>
                            )}
                          </div>

                          {/* 3-DOTS OPTION TRIGGER BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                            }}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-[2px] border transition-colors cursor-pointer",
                              openOptionMenuId === room.id
                                ? "border-[#0B3D32] bg-[#0B3D32] text-white dark:border-emerald-600 dark:bg-emerald-600"
                                : "border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-slate-600 group-hover:text-[#0B3D32] group-hover:bg-[#F2F6F4] dark:text-slate-300 dark:group-hover:bg-[#093027]"
                            )}
                            title={`Room ${room.number} Options`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Clean, Simple & Professional Room Info Only (No guest details) */}
                      <div className="py-2.5 flex flex-col justify-center text-xs min-h-[58px] space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div className="font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                            Rs. {room.pricePerNight.toLocaleString()}
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> / night</span>
                          </div>
                          <span
                            className={cn(
                              'font-semibold px-1.5 py-0.5 rounded-[2px] text-[10px]',
                              room.cleaningStatus === 'CLEAN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                            )}
                          >
                            {room.cleaningStatus === 'CLEAN' ? 'Clean' : 'Dirty'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{room.bedType}</span>
                          {room.operationalStatus === 'MAINTENANCE' ? (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Service</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">{room.acType || 'AC'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* THE OPTION BOX (POPOVER MENU: User clicks right side on box) */}
                    {openOptionMenuId === room.id && (
                      <>
                        {/* Transparent Backdrop to close option box on outside click */}
                        <div
                          className="fixed inset-0 z-40 cursor-default bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptionMenuId(null);
                          }}
                        />

                        {/* Floating Option Box: Flush with card borders, attached directly below the card */}
                        <div
                          className="absolute left-[-1px] right-[-1px] top-[calc(100%+3px)] z-50 rounded-[3px] border border-[#0B3D32] dark:border-emerald-600 bg-white dark:bg-[#07241E] shadow-2xl py-1 divide-y divide-[#F0F4F2] dark:divide-[#103D33] text-xs select-none animate-in fade-in zoom-in-95 duration-100 max-h-[340px] overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Option Box Header */}
                          <div className="px-3 py-1.5 bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">Room {room.number}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">• {room.type}</span>
                            </div>
                            <span
                              className={cn(
                                'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[2px]',
                                status === 'AVAILABLE' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                                status === 'ARRIVING' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                                (status === 'OCCUPIED' || status === 'DEPARTING') && 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                                status === 'MAINTENANCE' && 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              )}
                            >
                              {status === 'ARRIVING' ? 'Booked' : status}
                            </span>
                          </div>

                          {/* SECTION 1: Booking & Front-Desk Actions */}
                          <div className="py-1">
                            {/* 1. BOOK NOW (Disabled if room is already booked, occupied, or maintenance) */}
                            <button
                              type="button"
                              disabled={!canBookNow}
                              onClick={() => {
                                if (!canBookNow) return;
                                setOpenOptionMenuId(null);
                                handleQuickBookRoom(room);
                              }}
                              className={cn(
                                'w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors',
                                canBookNow
                                  ? 'hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-slate-800 dark:text-slate-100 cursor-pointer font-medium'
                                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-55'
                              )}
                              title={
                                !canBookNow
                                  ? isBooked
                                    ? 'Room is already booked for this date'
                                    : isOccupied
                                    ? 'Room is currently occupied'
                                    : 'Room is out of service'
                                  : `Book Room ${room.number}`
                              }
                            >
                              <span className="flex items-center gap-2">
                                <Plus className={cn('w-3.5 h-3.5', canBookNow ? 'text-[#0B3D32] dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600')} />
                                <span>Book Now</span>
                              </span>
                              {!canBookNow ? (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {isBooked ? 'Booked' : isOccupied ? 'Occupied' : 'Out of Order'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Available
                                </span>
                              )}
                            </button>

                            {/* 2. CHECK IN (Clickable for Booked guest arrival OR Walk-in; disabled if already in-house) */}
                            <button
                              type="button"
                              disabled={!canCheckIn}
                              onClick={() => {
                                if (!canCheckIn) return;
                                setOpenOptionMenuId(null);
                                if (isBooked && activeBooking) {
                                  handleOpenCheckInModal(activeBooking);
                                } else if (isAvailable) {
                                  handleQuickBookRoom(room);
                                }
                              }}
                              className={cn(
                                'w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors',
                                canCheckIn
                                  ? 'hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-slate-800 dark:text-slate-100 cursor-pointer font-medium'
                                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-55'
                              )}
                              title={
                                !canCheckIn
                                  ? isOccupied
                                    ? 'Guest is already checked in and in-house'
                                    : 'Room is under maintenance'
                                  : isBooked
                                  ? 'Check in arriving reservation'
                                  : 'Start Walk-in Check-in'
                              }
                            >
                              <span className="flex items-center gap-2">
                                <UserCheck className={cn('w-3.5 h-3.5', canCheckIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600')} />
                                <span>{isAvailable ? 'Walk-in Check In' : 'Check In'}</span>
                              </span>
                              {isBooked && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                                  Arriving
                                </span>
                              )}
                              {isOccupied && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  In-House
                                </span>
                              )}
                              {isAvailable && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Walk-in
                                </span>
                              )}
                            </button>

                            {/* 3. CHECK OUT (Clickable ONLY when guest is in-house; disabled if vacant or un-arrived) */}
                            <button
                              type="button"
                              disabled={!canCheckOut}
                              onClick={() => {
                                if (!canCheckOut) return;
                                setOpenOptionMenuId(null);
                                if (activeBooking) {
                                  handleOpenCheckOutModal(activeBooking);
                                }
                              }}
                              className={cn(
                                'w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors',
                                canCheckOut
                                  ? 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 cursor-pointer font-medium'
                                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-55'
                              )}
                              title={
                                !canCheckOut
                                  ? isBooked
                                    ? 'Guest has not checked in yet'
                                    : 'No active guest currently in this room'
                                  : 'Check out and settle folio'
                              }
                            >
                              <span className="flex items-center gap-2">
                                <LogOut className={cn('w-3.5 h-3.5', canCheckOut ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-600')} />
                                <span>Check Out</span>
                              </span>
                              {canCheckOut ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  {status === 'DEPARTING' ? 'Departing Today' : 'Settle Folio'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {isBooked ? 'Not Checked In' : 'Vacant'}
                                </span>
                              )}
                            </button>
                          </div>

                          {/* SECTION 2: Housekeeping (Clean, Dirty) */}
                          <div className="py-1">
                            {/* CLEAN */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenOptionMenuId(null);
                                handleSetCleaningStatus(room.id, 'CLEAN');
                              }}
                              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Clean</span>
                              </span>
                              {isClean ? (
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                                  ✓ Clean
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">Mark Clean</span>
                              )}
                            </button>

                            {/* DIRTY */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenOptionMenuId(null);
                                handleSetCleaningStatus(room.id, 'DIRTY');
                              }}
                              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>Dirty</span>
                              </span>
                              {isDirty ? (
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded">
                                  ✓ Dirty
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">Mark Dirty</span>
                              )}
                            </button>
                          </div>

                          {/* SECTION 3: Maintenance & Folio Tools */}
                          <div className="py-1">
                            {/* MAINTENANCE */}
                            <button
                              type="button"
                              disabled={!canToggleMaintenance && !isMaintenance}
                              onClick={() => {
                                if (!canToggleMaintenance && !isMaintenance) {
                                  toast.info('Cannot Set Maintenance', 'Please check out the current guest before placing room in maintenance.');
                                  return;
                                }
                                setOpenOptionMenuId(null);
                                handleToggleMaintenance(room.id);
                              }}
                              className={cn(
                                'w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors',
                                canToggleMaintenance || isMaintenance
                                  ? 'hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-slate-800 dark:text-slate-100 cursor-pointer'
                                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-55'
                              )}
                              title={
                                isOccupied
                                  ? 'Room is currently occupied by guest'
                                  : isMaintenance
                                  ? 'Restore room to available'
                                  : 'Place room out of order for maintenance'
                              }
                            >
                              <span className="flex items-center gap-2">
                                <Wrench className={cn('w-3.5 h-3.5', isMaintenance ? 'text-amber-500' : 'text-slate-500')} />
                                <span>{isMaintenance ? 'Exit Maintenance' : 'Maintenance'}</span>
                              </span>
                              {isMaintenance && (
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                                  Restore
                                </span>
                              )}
                              {isOccupied && (
                                <span className="text-[9px] text-slate-400">Occupied</span>
                              )}
                            </button>

                            {/* VIEW FOLIO (Only when active booking exists) */}
                            {activeBooking && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  handleOpenFolioDrawer(activeBooking);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#F2F6F4] dark:hover:bg-[#093027] text-blue-700 dark:text-blue-400 text-left cursor-pointer transition-colors"
                              >
                                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Folio / Bill</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : viewMode === 'chart' ? (
        <RoomTapeChart
          bookings={bookings}
          rooms={rooms}
          onSelectBooking={(booking) => handleOpenFolioDrawer(booking)}
          onOpenCheckInModal={(booking) => handleOpenCheckInModal(booking)}
          onOpenCheckOutModal={(booking) => handleOpenCheckOutModal(booking)}
          onOpenNewBookingModal={handleTapeChartNewBooking}
          onBookingCreated={(newBooking) => {
            const nextBookings = [newBooking, ...bookings.filter((b) => b.id !== newBooking.id)];
            saveBookingsToStorage(nextBookings);
            setBookings(nextBookings);
            toast.celebrate(
              newBooking.status === 'CHECKED_IN' ? 'Guest Checked In!' : 'Room Reserved!',
              `Room ${newBooking.room.number} is ${
                newBooking.status === 'CHECKED_IN' ? 'now Occupied by' : 'booked for'
              } ${newBooking.guest.firstName} ${newBooking.guest.lastName} (${newBooking.nights} nights).`
            );
          }}
          onUpdateBookings={(updated) => {
            saveBookingsToStorage(updated);
            setBookings(updated);
          }}
          onClose={() => setViewMode('boxes')}
        />
      ) : (
        <div className="space-y-4">
          {/* Clean Guest List Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('arrivals')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'arrivals'
                    ? 'bg-[#0B3D32] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Arrivals</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'arrivals' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}>
                  {arrivals.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staying')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'staying'
                    ? 'bg-[#0B3D32] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>In-House</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'staying' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}>
                  {currentlyStaying.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('departures')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'departures'
                    ? 'bg-[#0B3D32] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Departures</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'departures' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}>
                  {departures.length}
                </span>
              </button>
            </div>

            <div className="w-64">
              <Input
                placeholder="Search guest or room..."
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* TAB 1: TODAY'S ARRIVALS */}
          {activeTab === 'arrivals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Expected Arrivals
                </span>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setArrivalFilter('TODAY')}
                className={cn(
                  'px-3 py-1 rounded-md transition-all',
                  arrivalFilter === 'TODAY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                )}
              >
                Today's Arrivals ({arrivals.length})
              </button>
              <button
                onClick={() => setArrivalFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-md transition-all',
                  arrivalFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                )}
              >
                All Upcoming Arrivals
              </button>
            </div>
          </div>

          {filteredArrivals.length === 0 ? (
            <div className={`p-12 text-center ${cardClass} space-y-3`}>
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">All Arrivals Checked In!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No pending arrivals remaining for today.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArrivals.map((res) => {
                const fin = getBookingFinancials(res);
                const isRam = res.guest.firstName.toLowerCase() === 'ram';

                return (
                  <div
                    key={res.id}
                    className={cn(
                      `p-5 ${cardClass} flex flex-col justify-between transition-all hover:shadow-md`,
                      isRam && 'border-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-600 dark:ring-emerald-600'
                    )}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Name & Tag */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                              {res.guest.firstName} {res.guest.lastName}
                            </h4>
                            <VipBadge tier={res.guest.vipTier} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {res.bookingCode} • {res.guest.phone}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          Check-in today
                        </span>
                      </div>

                      {/* Room & Stay Details */}
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Assigned Room</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                            Room {res.room.number} ({res.room.type})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Stay Duration</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {res.nights} {res.nights === 1 ? 'Night' : 'Nights'} ({formatDate(res.checkIn)} – {formatDate(res.checkOut)})
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Advance Deposit</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {fin.totalPaid > 0 ? formatCurrency(fin.totalPaid) : 'Pending at desk'}
                          </span>
                        </div>
                      </div>

                      {res.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded border border-amber-200/50 dark:border-amber-900/30 line-clamp-2">
                          <strong className="text-amber-800 dark:text-amber-300">Note:</strong> {res.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Button: Check In Guest */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenCheckInModal(res)}
                        leftIcon={<LogIn className="w-4 h-4" />}
                        className="w-full font-bold shadow-xs py-2 h-9"
                      >
                        Check In Guest
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: CURRENTLY STAYING */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'staying' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              In-House Guests
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
              {currentlyStaying.length} Rooms Occupied
            </span>
          </div>

          {filteredStaying.length === 0 ? (
            <div className={`p-12 text-center ${cardClass} space-y-3`}>
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 mx-auto flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No In-House Guests Right Now</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Check in an arriving guest from Today's Arrivals to view their active stay, room orders, and live folio.
              </p>
              <Button variant="primary" size="sm" onClick={() => setActiveTab('arrivals')} leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                Go to Today's Arrivals
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaying.map((res) => {
                const fin = getBookingFinancials(res);
                const isRam = res.guest.firstName.toLowerCase() === 'ram';

                // Friendly stay text (e.g., "Staying until tomorrow")
                let stayText = `Staying until ${formatDate(res.checkOut)}`;
                if (res.checkOut === tomorrowDateStr) {
                  stayText = 'Staying until tomorrow';
                } else if (res.checkOut === todayDateStr) {
                  stayText = 'Departing today';
                }

                return (
                  <div
                    key={res.id}
                    className={cn(
                      `p-5 ${cardClass} flex flex-col justify-between transition-all hover:shadow-md`,
                      isRam && 'border-blue-300 dark:border-blue-700'
                    )}
                  >
                    <div className="space-y-3">
                      {/* Header: Room & Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                              Room {res.room.number}
                            </span>
                            <VipBadge tier={res.guest.vipTier} />
                          </div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading mt-1">
                            {res.guest.firstName} {res.guest.lastName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {res.room.type} • {res.room.bedType}
                          </p>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {stayText}
                        </span>
                      </div>

                      {/* Live Folio Summary Card */}
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span>Room Charges ({res.nights} Nights)</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(fin.roomCharges)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span>Food & Cafe Orders ({(res.cafeOrders || []).length})</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(fin.cafeTotal)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                          <span>Payments & Deposit Paid</span>
                          <span className="font-semibold">
                            -{formatCurrency(fin.totalPaid)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm">
                          <span className="text-slate-900 dark:text-white">Balance Due</span>
                          <span className={fin.balanceDue > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600'}>
                            {formatCurrency(fin.balanceDue)}
                          </span>
                        </div>
                      </div>

                      {/* Food Orders mini-pill summary */}
                      {(res.cafeOrders || []).length > 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Recent Food Orders:</p>
                          <div className="flex flex-wrap gap-1">
                            {res.cafeOrders.flatMap((o) => o.items).slice(0, 3).map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {res.cafeOrders.flatMap((o) => o.items).length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                                +{res.cafeOrders.flatMap((o) => o.items).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Add Food, View Folio, Check Out */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAddFoodModal(res)}
                          leftIcon={<Utensils className="w-3.5 h-3.5 text-amber-600" />}
                          className="text-xs h-8"
                        >
                          Order Food
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFolioDrawer(res)}
                          leftIcon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                          className="text-xs h-8"
                        >
                          View Bill
                        </Button>
                      </div>

                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleOpenCheckOutModal(res)}
                        leftIcon={<LogOut className="w-3.5 h-3.5" />}
                        className="w-full text-xs font-bold h-9"
                      >
                        Check Out Guest
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: CHECK OUT TODAY */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'departures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Departing Guests & Folios
            </span>
          </div>

          {currentlyStaying.length === 0 ? (
            <div className={`p-12 text-center ${cardClass} space-y-3`}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No guests currently staying</p>
            </div>
          ) : (
            <div className={cardClass}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Stay Duration</TableHead>
                    <TableHead className="text-right">Room Rent</TableHead>
                    <TableHead className="text-right">Food Orders</TableHead>
                    <TableHead className="text-right">Paid Advance</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentlyStaying.map((res) => {
                    const fin = getBookingFinancials(res);
                    return (
                      <TableRow key={res.id}>
                        <TableCell className="font-bold text-slate-900 dark:text-white">
                          Room {res.room.number}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {res.guest.firstName} {res.guest.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500">{res.bookingCode}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(res.checkIn)} – {formatDate(res.checkOut)} ({res.nights}n)
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(fin.roomCharges)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(fin.cafeTotal)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(fin.totalPaid)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-amber-700 dark:text-amber-400">
                          {formatCurrency(fin.balanceDue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => handleOpenCheckOutModal(res)}
                            leftIcon={<Receipt className="w-3.5 h-3.5" />}
                            className="text-xs py-1 h-8"
                          >
                            Check Out Guest
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CHECK IN GUEST                                               */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Check In Guest"
        description="Assign room key and record check-in deposit"
        size="lg"
      >
        {selectedBookingForCheckIn && (
          <div className="space-y-5">
            {/* Guest Details */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wider">
                Guest Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guest Full Name *
                  </label>
                  <Input
                    value={checkInGuestName}
                    onChange={(e) => setCheckInGuestName(e.target.value)}
                    placeholder="e.g. Ram Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    value={checkInPhone}
                    onChange={(e) => setCheckInPhone(e.target.value)}
                    placeholder="+977 9841234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Document Type
                  </label>
                  <select
                    value={checkInIdType}
                    onChange={(e) => setCheckInIdType(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Citizenship">Citizenship</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Number
                  </label>
                  <Input
                    value={checkInIdNumber}
                    onChange={(e) => setCheckInIdNumber(e.target.value)}
                    placeholder="CT-27-01-72-0451"
                  />
                </div>
              </div>
            </div>

            {/* Room Assignment */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wider">
                Room Assignment
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Room (Inspected & Clean)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_ROOMS_CATALOG.filter((r) => r.status === 'AVAILABLE' || r.id === checkInRoomId).map((rm) => {
                    const isSelected = checkInRoomId === rm.id;
                    return (
                      <div
                        key={rm.id}
                        onClick={() => setCheckInRoomId(rm.id)}
                        className={cn(
                          'p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between',
                          isSelected
                            ? 'border-[#0B3D32] bg-emerald-50/60 dark:border-emerald-600 dark:bg-emerald-950/40 ring-1 ring-[#0B3D32]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span>Room {rm.number}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Clean & Ready
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {rm.type} • {rm.acType}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(rm.pricePerNight)}/n
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Check-in Deposit */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wider">
                Check-in Deposit
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deposit Amount Collected (Rs.)
                    </label>
                    <Input
                      type="number"
                      value={checkInDepositAmount}
                      onChange={(e) => setCheckInDepositAmount(Number(e.target.value))}
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deposit Payment Mode
                    </label>
                    <select
                      value={checkInPaymentMethod}
                      onChange={(e) => setCheckInPaymentMethod(e.target.value as any)}
                      className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                    >
                      <option value="CASH">💵 Cash at Desk</option>
                      <option value="CARD">💳 POS / Credit / Debit Card</option>
                      <option value="UPI_QR">📱 UPI / QR Code Pay</option>
                      <option value="ESEWA_KHALTI">📲 eSewa / Khalti</option>
                      <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Check-in Button */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsCheckInModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCheckIn}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="font-bold px-6 shadow-sm"
              >
                Confirm Check-in
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: CHECK OUT GUEST (CHECK ROOM CHARGES, FOOD ORDERS, PAYMENTS)  */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        title="Check Out Guest"
        description="Folio settlement and key return"
        size="lg"
      >
        {selectedBookingForCheckOut && (
          <div className="space-y-4">
            {/* Guest & Room Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Guest Checkout</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {selectedBookingForCheckOut.guest.firstName} {selectedBookingForCheckOut.guest.lastName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Room {selectedBookingForCheckOut.room.number} • {selectedBookingForCheckOut.room.type}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500">Stay Duration</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedBookingForCheckOut.nights} {selectedBookingForCheckOut.nights === 1 ? 'Night' : 'Nights'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatDate(selectedBookingForCheckOut.checkIn)} – {formatDate(selectedBookingForCheckOut.checkOut)}
                </p>
              </div>
            </div>

            {/* Clear Folio Breakdown: Room charges, Food orders, Payments */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Folio Statement & Charge Summary
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
                {/* Room Charges */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Room Charges</span>
                    <p className="text-[11px] text-slate-500">
                      Room {selectedBookingForCheckOut.room.number} ({selectedBookingForCheckOut.nights} nights @ {formatCurrency(selectedBookingForCheckOut.room.pricePerNight)}/night)
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedBookingForCheckOut.roomCharges)}
                  </span>
                </div>

                {/* Food Orders */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Food & Cafe Orders ({(selectedBookingForCheckOut.cafeOrders || []).length})
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(
                        (selectedBookingForCheckOut.cafeOrders || []).reduce((s, o) => s + (o.subtotal || 0), 0)
                      )}
                    </span>
                  </div>

                  {(selectedBookingForCheckOut.cafeOrders || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No food orders charged to this room.</p>
                  ) : (
                    <div className="space-y-1 pl-3 pt-1 border-l-2 border-amber-300 dark:border-amber-700">
                      {selectedBookingForCheckOut.cafeOrders.map((ord) => (
                        <div key={ord.id} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>
                            {ord.orderNumber}: {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {formatCurrency(ord.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payments & Deposits */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                    <span className="font-bold">Advance Deposits Paid</span>
                    <span className="font-bold">
                      -{formatCurrency(
                        (selectedBookingForCheckOut.payments || []).reduce((s, p) => s + (p.amount || 0), 0)
                      )}
                    </span>
                  </div>

                  {(selectedBookingForCheckOut.payments || []).map((pay) => (
                    <div key={pay.id} className="flex justify-between text-[11px] text-slate-500 pl-3">
                      <span>{pay.receiptNo} ({pay.method} • {pay.type})</span>
                      <span>{formatCurrency(pay.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* 4. Net Balance Due */}
                <div className="pt-3 flex justify-between items-center text-sm font-bold bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <span className="text-slate-900 dark:text-white">Outstanding Balance Due to Settle:</span>
                  <span className="text-base text-amber-800 dark:text-amber-300">
                    {formatCurrency(
                      getBookingFinancials(selectedBookingForCheckOut).balanceDue
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Settlement Input */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Collect Payment & Settle Folio
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Settlement Amount Collected (Rs.)
                  </label>
                  <Input
                    type="number"
                    value={checkoutSettlementAmount}
                    onChange={(e) => setCheckoutSettlementAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Settlement Payment Method
                  </label>
                  <select
                    value={checkoutPaymentMethod}
                    onChange={(e) => setCheckoutPaymentMethod(e.target.value as any)}
                    className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="CARD">💳 POS / Credit / Debit Card</option>
                    <option value="UPI_QR">📱 UPI / QR Code</option>
                    <option value="ESEWA_KHALTI">📲 eSewa / Khalti</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Room <strong>{selectedBookingForCheckOut.room.number}</strong> will automatically be set to <strong>DIRTY</strong> and sent to Room Management for cleaning.
                </span>
              </div>
            </div>

            {/* Confirm Check-out Action Button */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsCheckOutModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleConfirmCheckOut}
                leftIcon={<Check className="w-4 h-4" />}
                className="font-bold px-6 shadow-sm"
              >
                Confirm Check-out
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: ORDER FOOD / CHARGE ROOM SERVICE                             */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        title="Charge Food & Cafe to Room"
        description={selectedBookingForFood ? `Order food items for Room ${selectedBookingForFood.room.number} (${selectedBookingForFood.guest.firstName} ${selectedBookingForFood.guest.lastName})` : ''}
        size="md"
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {CAFE_MENU_ITEMS.map((item) => {
              const qty = selectedFoodItems[item.id] || 0;
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                    <p className="text-[11px] text-slate-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedFoodItems((prev) => ({
                          ...prev,
                          [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900 dark:text-white">{qty}</span>
                    <button
                      onClick={() =>
                        setSelectedFoodItems((prev) => ({
                          ...prev,
                          [item.id]: (prev[item.id] || 0) + 1,
                        }))
                      }
                      className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">Order Subtotal:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {formatCurrency(
                Object.entries(selectedFoodItems).reduce((sum, [id, q]) => {
                  const m = CAFE_MENU_ITEMS.find((item) => item.id === id);
                  return sum + (m ? m.price * q : 0);
                }, 0)
              )}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddFoodModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAddFood}
              leftIcon={<Utensils className="w-3.5 h-3.5" />}
              className="font-bold"
            >
              Confirm Food Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* DRAWER: DETAILED FOLIO STATEMENT                                      */}
      {/* ===================================================================== */}
      <Drawer
        isOpen={isFolioDrawerOpen}
        onClose={() => setIsFolioDrawerOpen(false)}
        title={selectedBookingForFolio ? `Room ${selectedBookingForFolio.room.number} Folio` : ''}
        description={selectedBookingForFolio ? `${selectedBookingForFolio.guest.firstName} ${selectedBookingForFolio.guest.lastName} • ${selectedBookingForFolio.bookingCode}` : ''}
        width="md"
      >
        {selectedBookingForFolio && (
          <div className="space-y-5 text-xs">
            {/* Stay info */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedBookingForFolio.room.type} ({selectedBookingForFolio.room.bedType})
              </p>
              <p className="text-slate-500">
                Check-in: {formatDate(selectedBookingForFolio.checkIn)} • Check-out: {formatDate(selectedBookingForFolio.checkOut)} ({selectedBookingForFolio.nights} nights)
              </p>
              <p className="text-slate-500">
                Contact: {selectedBookingForFolio.guest.phone} • {selectedBookingForFolio.guest.email}
              </p>
            </div>

            {/* Charges */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Itemized Charges
              </h5>
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span>Room Tariff ({selectedBookingForFolio.nights} nights)</span>
                  <span>{formatCurrency(selectedBookingForFolio.roomCharges)}</span>
                </div>
                {(selectedBookingForFolio.cafeOrders || []).map((o) => (
                  <div key={o.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{o.orderNumber} ({o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')})</span>
                    <span>{formatCurrency(o.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Payments & Receipts
              </h5>
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {(selectedBookingForFolio.payments || []).length === 0 ? (
                  <p className="text-slate-400 italic">No payments recorded yet.</p>
                ) : (
                  selectedBookingForFolio.payments.map((p) => (
                    <div key={p.id} className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                      <span>{p.receiptNo} ({p.method})</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Balance Due */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex justify-between items-center text-sm font-bold">
              <span>Current Balance Due</span>
              <span className="text-amber-800 dark:text-amber-300">
                {formatCurrency(getBookingFinancials(selectedBookingForFolio).balanceDue)}
              </span>
            </div>

            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                setIsFolioDrawerOpen(false);
                handleOpenCheckOutModal(selectedBookingForFolio);
              }}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="w-full font-bold"
            >
              Proceed to Check-Out
            </Button>
          </div>
        )}
      </Drawer>

      {/* Guided Multi-Step Booking / Walk-in Modal */}
      <GuidedBookingModal
        isOpen={isGuidedBookingOpen}
        onClose={() => setIsGuidedBookingOpen(false)}
        isWalkIn={guidedBookingWalkIn}
        initialRoomId={guidedBookingInitialRoom}
        initialCheckIn={guidedBookingCheckIn}
        initialCheckOut={guidedBookingCheckOut}
        onSuccess={(newBooking, isCheckedIn) => {
          setBookings(loadBookingsFromStorage());
          if (isCheckedIn) {
            setActiveTab('staying');
          } else {
            setActiveTab('arrivals');
          }
        }}
      />
    </div>
  );
}

export default function FrontDeskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Check-in Desk...</div>}>
      <FrontDeskContent />
    </Suspense>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
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
import { getSettedMenuItems, MenuItemCatalogEntry } from '@/lib/menuData';

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
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
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
    return { status: 'ARRIVING', booking: reservedCovering, isDeparting: false };
  }

  // 5. Direct operationalStatus fallback
  if (room.operationalStatus === 'OCCUPIED') {
    return { status: 'OCCUPIED', booking: inHouse || null, isDeparting: false };
  }

  return { status: 'AVAILABLE', booking: null, isDeparting: false };
}

const cardClass = 'rounded-xl bg-surface-card border border-border-default dark:bg-surface-card dark:border-border-default shadow-xs';

function FrontDeskContent() {
  const toast = useToast();
  const router = useRouter();
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
      } catch (e) { }
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
        if (r.id !== roomId && String(r.number) !== String(roomId) && r.id !== `rm-${roomId}`) return r;
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
    router.push(`/booking?roomId=${room.id}&checkIn=${selectedDate}&mode=reserve&from=desk`);
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
    router.push(`/check-in?bookingId=${booking.id}`);
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
  const [foodMenuSearch, setFoodMenuSearch] = useState('');
  const [foodCatalog, setFoodCatalog] = useState<MenuItemCatalogEntry[]>([]);

  useEffect(() => {
    const setted = getSettedMenuItems();
    if (setted && setted.length > 0) {
      setFoodCatalog(setted);
    }
  }, []);

  const handleOpenAddFoodModal = (booking: RoomBooking) => {
    setSelectedBookingForFood(booking);
    setSelectedFoodItems({});
    setFoodMenuSearch('');
    setFoodCatalog(getSettedMenuItems());
    setIsAddFoodModalOpen(true);
  };

  const filteredFoodCatalog = useMemo(() => {
    const list =
      foodCatalog.length > 0
        ? foodCatalog
        : CAFE_MENU_ITEMS.map((m) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            category: 'Cafe',
            code: m.id,
          }));
    const q = foodMenuSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.code && item.code.toLowerCase().includes(q))
    );
  }, [foodCatalog, foodMenuSearch]);

  const handleConfirmAddFood = () => {
    if (!selectedBookingForFood) return;

    const orderItems: { name: string; quantity: number; price: number }[] = [];
    Object.entries(selectedFoodItems).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const item =
          foodCatalog.find((m) => m.id === itemId) ||
          CAFE_MENU_ITEMS.find((m) => m.id === itemId);
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
      'Order Charged to Room!',
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
    const matchedRoom = AVAILABLE_ROOMS_CATALOG.find(
      (r) => r.number === roomNumber || r.id === roomNumber
    );
    router.push(`/booking?roomId=${matchedRoom ? matchedRoom.id : roomNumber}&checkIn=${checkInDate}&mode=reserve&from=desk`);
  };

  return (
    <div className="space-y-4">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="room-board" />

      {/* Clean Front Desk / Room Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-body dark:text-white font-heading tracking-tight">
            Room Board
          </h1>
          {/* View Mode Toggle: Room Boxes vs Timeline Matrix */}
          <div className="flex items-center bg-surface-card border border-border-default dark:bg-surface-card dark:border-border-default p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('boxes')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'boxes'
                  ? 'bg-surface-card text-body shadow-2xs dark:bg-surface-card dark:text-white font-bold'
                  : 'text-muted hover:text-body dark:text-muted dark:hover:text-white'
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
                  ? 'bg-surface-card text-body shadow-2xs dark:bg-surface-card dark:text-white font-bold'
                  : 'text-muted hover:text-body dark:text-muted dark:hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-muted dark:text-slate-300" />
              <span>Timeline Matrix</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              router.push('/check-in?mode=walk-in');
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-semibold bg-brand hover:bg-brand-hover text-white cursor-pointer"
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
          <div className="bg-surface-card dark:bg-surface-card p-3 rounded-[3px] border border-border-default dark:border-border-default shadow-2xs space-y-3">
            {/* Row 1: Quick Jump, Date Navigation & Status Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Date Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Days Range Dropdown (1 day, 2 days, 7 days, 10 days, 14 days, 1 month) */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card">
                  <span className="text-[11px] font-semibold text-muted dark:text-muted">View:</span>
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
                <div className="flex items-center rounded-md border border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-surface-hover text-muted dark:text-slate-300 transition-colors cursor-pointer"
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
                        ? 'bg-white text-brand shadow-2xs font-extrabold dark:bg-surface-hover dark:text-success'
                        : 'text-muted hover:text-body dark:text-slate-300 hover:bg-white/60'
                    )}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-surface-hover text-muted dark:text-slate-300 transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Date Picker */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card">
                  <span className="text-[11px] font-semibold text-muted dark:text-muted">Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="text-xs font-mono font-bold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Summary Chips (Quick Filters - 100% Unscrollable, Always Showing All) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'All', count: countsOnDate.all, dot: null, activeBg: 'bg-brand' },
                  { id: 'AVAILABLE', label: 'Available', count: countsOnDate.available, dot: 'bg-emerald-600', activeBg: 'bg-brand' },
                  { id: 'OCCUPIED', label: 'Occupied', count: countsOnDate.occupied, dot: 'bg-brand', activeBg: 'bg-brand' },
                  { id: 'ARRIVING', label: 'Booked', count: countsOnDate.arriving, dot: 'bg-amber-500', activeBg: 'bg-warning-subtle' },
                  { id: 'MAINTENANCE', label: 'Maintenance', count: countsOnDate.maintenance, dot: 'bg-slate-500', activeBg: 'bg-surface-muted' },
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
                          ? `${pill.activeBg} text-white shadow-2xs`
                          : 'bg-surface-muted dark:bg-surface-card text-[#4A6B5D] hover:bg-surface-hover dark:bg-surface-card dark:border-border-default dark:text-[#A4B8AE]'
                      )}
                    >
                      {pill.dot && <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : pill.dot)} />}
                      <span>{pill.label}</span>
                      <span
                        className={cn(
                          'rounded-[2px] px-1 py-0.2 text-[10px] font-mono',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-muted dark:bg-surface-card text-[#4A6B5D] dark:text-[#A4B8AE]'
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
            <div className="pt-2 border-t border-border-default dark:border-border-default overflow-x-auto custom-scrollbar">
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
                          ? 'bg-brand text-white border-brand shadow-2xs dark:bg-brand dark:border-brand'
                          : 'bg-surface-card dark:bg-surface-card border-border-default dark:border-border-default text-muted dark:text-slate-300 hover:bg-[#F2F6F4] dark:hover:bg-[#093027]'
                      )}
                    >
                      <span className={cn(
                        'text-[10px] uppercase font-bold tracking-wider',
                        isSelected ? 'text-success dark:text-success' : 'text-muted'
                      )}>
                        {tile.isToday ? 'TODAY' : tile.dayName}
                      </span>
                      <span className="font-mono text-base font-extrabold leading-tight">
                        {tile.dayNum}
                      </span>
                      <span className={cn(
                        'text-[9px] uppercase font-semibold',
                        isSelected ? 'text-success dark:text-success' : 'text-muted'
                      )}>
                        {tile.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Secondary Filters: Floor, Room Type & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-default dark:border-border-default text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Floor Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-muted dark:text-muted">Floor:</span>
                  <select
                    value={boxFloorFilter}
                    onChange={(e) => setBoxFloorFilter(e.target.value)}
                    className="rounded-[3px] border border-border-default bg-surface-muted dark:bg-surface-card dark:border-border-default px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white"
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
                  <span className="text-[11px] font-semibold text-muted dark:text-muted">Type:</span>
                  <select
                    value={boxTypeFilter}
                    onChange={(e) => setBoxTypeFilter(e.target.value)}
                    className="rounded-[3px] border border-border-default bg-surface-muted dark:bg-surface-card dark:border-border-default px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white max-w-[150px] truncate"
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
                    className="text-xs text-brand dark:text-success underline font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={boxSearchQuery}
                  onChange={(e) => setBoxSearchQuery(e.target.value)}
                  placeholder="Search room #, guest, Res ID..."
                  className="w-full h-8 rounded-[3px] border border-border-default bg-surface-muted py-1 pl-8 pr-7 text-xs font-medium dark:border-border-default dark:bg-surface-card dark:text-white"
                />
                {boxSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBoxSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-muted"
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
            <div className="p-12 text-center bg-surface-card dark:bg-surface-card rounded-[3px] border border-border-default dark:border-border-default text-muted text-xs">
              No rooms match the selected filters for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredBoxRooms.map((room) => {
                const roomStatus = getRoomStatusForDate(room, bookings, selectedDate);
                const status = roomStatus.status;
                const activeBooking = roomStatus.booking;

                // State analysis for smart option handling
                const isBooked = status === 'ARRIVING'; // Reserved booking exists for this room on selected date
                const isOccupied = status === 'OCCUPIED'; // Guest is currently staying in room
                const isDeparting = status === 'DEPARTING'; // Guest departing today
                const isMaintenance = status === 'MAINTENANCE';
                const isAvailable = status === 'AVAILABLE';

                // ONLY Checked-In / Occupied is a solid dark card!
                const isDarkCard = isOccupied;

                // Book Now: ONLY clickable when room is vacant and not under maintenance
                const canBookNow = isAvailable && !isMaintenance;

                // Check In:
                // - Clickable when room is booked (ARRIVING with reservation ready to check in)
                // - Clickable when room is available (direct walk-in check-in)
                const canCheckIn = (isBooked && !!activeBooking) || isAvailable;

                // Check Out:
                // - ONLY clickable when guest is currently staying in the room
                const canCheckOut = (isOccupied || isDeparting) && !!activeBooking;

                // Housekeeping Status
                const isClean = room.cleaningStatus === 'CLEAN';
                const isDirty = room.cleaningStatus === 'DIRTY';

                // Maintenance toggle: cannot place room in maintenance while guest is in-house
                const canToggleMaintenance = !isOccupied && !isDeparting;

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                    }}
                    className={cn(
                      'relative flex flex-col justify-between p-3.5 sm:p-4 rounded-[6px] border transition-all duration-150 shadow-2xs hover:shadow-xs select-none cursor-pointer group min-h-[185px]',
                      openOptionMenuId === room.id ? (isDarkCard ? 'z-50 shadow-md ring-2 ring-white/60' : 'z-50 shadow-md ring-2 ring-[#0B3D32]') : 'z-0',
                      // 1. Occupied (Checked In): THE ONLY SOLID DARK CARD (Signature Pine Emerald #0B3D32)
                      isOccupied && 'bg-brand border-brand text-white hover:bg-brand-hover dark:bg-surface-hover dark:border-brand shadow-sm',
                      // 2. Booked (Arriving / Reserved): Clean LIGHT card with subtle reserved sky accent
                      isBooked && 'bg-surface-card dark:bg-surface-card border-info dark:border-info hover:border-info hover:shadow-xs text-body dark:text-white',
                      // 3. Departing: Clean LIGHT card with subtle rose border
                      isDeparting && 'bg-surface-card dark:bg-surface-card border-danger dark:border-danger hover:border-danger hover:shadow-xs text-body dark:text-white',
                      // 4. Out of Service / Maintenance: Muted light slate card
                      isMaintenance && 'bg-surface-muted dark:bg-surface-card border-border-default dark:border-border-default hover:border-border-default hover:shadow-xs text-body dark:text-white',
                      // 5. Available: Clean LIGHT white card
                      isAvailable && 'bg-surface-card dark:bg-surface-card border-border-default dark:border-border-default hover:border-brand dark:hover:border-success hover:shadow-xs text-body dark:text-white'
                    )}
                  >
                    {/* Top Row: Room Number + Floor (Left) | Status Badge & 3-Dots Trigger (Right) */}
                    <div>
                      <div
                        className={cn(
                          'flex items-center justify-between gap-1 pb-2.5 border-b',
                          isDarkCard ? 'border-white/20' : 'border-white/20'
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={cn(
                                'font-mono text-xl sm:text-2xl font-black tracking-tight',
                                isDarkCard ? 'text-white' : 'text-body dark:text-white'
                              )}
                            >
                              {room.number}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider',
                                isDarkCard ? 'text-white/80' : 'text-muted dark:text-muted'
                              )}
                            >
                              Fl {room.floor}
                            </span>
                          </div>
                        </div>

                        {/* Right side: Status Badge + 3-Dots Trigger */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          <div>
                            {isOccupied && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-success text-white" />
                                <span>Occupied</span>
                              </span>
                            )}
                            {isBooked && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-info-subtle text-info border-info dark:border-info">
                                <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                                <span>Reserved</span>
                              </span>
                            )}
                            {isDeparting && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-danger-subtle text-danger border-danger dark:border-danger">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                                <span>Departing</span>
                              </span>
                            )}
                            {isMaintenance && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-surface-muted text-muted border-border-default dark:border-border-default">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>Out of Service</span>
                              </span>
                            )}
                            {isAvailable && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase tracking-wider bg-success-subtle text-success border-success dark:border-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
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
                              'w-6 h-6 flex items-center justify-center rounded-[3px] border transition-colors cursor-pointer',
                              isDarkCard
                                ? openOptionMenuId === room.id
                                  ? 'border-white bg-white text-[#0B3D32]'
                                  : 'border-white/30 bg-white/10 hover:bg-white/20 text-white'
                                : openOptionMenuId === room.id
                                ? 'bg-white bg-brand text-white dark:border-success dark:bg-success'
                                : 'text-muted group-hover:text-brand group-hover:bg-surface-hover dark:text-muted dark:group-hover:bg-surface-hover'
                            )}
                            title={`Room ${room.number} Options`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Room Type & Context Info (Guest Name, Dates, Rates) */}
                      <div className="py-2.5 flex flex-col justify-center text-xs space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={cn(
                              'text-xs font-bold truncate',
                              isDarkCard ? 'text-white' : 'text-body dark:text-white'
                            )}
                          >
                            {room.type}
                          </p>
                          <span
                            className={cn(
                              'font-mono font-bold text-[11px] shrink-0',
                              isDarkCard ? 'text-white/90' : 'text-brand dark:text-success'
                            )}
                          >
                            Rs. {room.pricePerNight.toLocaleString()}
                          </span>
                        </div>

                        {/* Guest / State Info */}
                        {isOccupied && activeBooking ? (
                          <div className="text-[10px] space-y-0.5">
                            <p className="font-medium text-success dark:text-success truncate flex items-center gap-1">
                              <span className="opacity-75 font-normal">Guest:</span>
                              <strong className="font-bold text-white">
                                {activeBooking.guest.firstName} {activeBooking.guest.lastName}
                              </strong>
                            </p>
                            <p className="text-[10px] text-success dark:text-success/80 truncate">
                              Check-out: {formatDate(activeBooking.checkOut)}
                            </p>
                          </div>
                        ) : isBooked && activeBooking ? (
                          <div className="text-[10px] space-y-0.5">
                            <p className="font-medium text-info dark:text-info truncate flex items-center gap-1">
                              <span className="opacity-75 font-normal">Guest:</span>
                              <strong className="font-bold text-body dark:text-white">
                                {activeBooking.guest.firstName} {activeBooking.guest.lastName}
                              </strong>
                            </p>
                            <p className="text-[10px] text-info dark:text-info truncate">
                              Check-in: {formatDate(activeBooking.checkIn)}
                            </p>
                          </div>
                        ) : isDeparting && activeBooking ? (
                          <div className="text-[10px] space-y-0.5">
                            <p className="font-medium text-danger dark:text-danger truncate flex items-center gap-1">
                              <span className="opacity-75 font-normal">Departing:</span>
                              <strong className="font-bold text-[#24352F] dark:text-white">
                                {activeBooking.guest.firstName} {activeBooking.guest.lastName}
                              </strong>
                            </p>
                            <p className="text-[10px] text-danger/80 truncate">
                              Check-out due today (11:00 AM)
                            </p>
                          </div>
                        ) : isMaintenance ? (
                          <p className="text-[10px] font-medium text-muted dark:text-muted truncate flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-muted" />
                            <span>{room.maintenanceReason || 'Servicing in progress'}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] font-medium text-muted dark:text-muted truncate">
                            {room.bedType} · {room.acType || 'AC'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Housekeeping Status Badge on Left | High-Contrast Action Box on Right */}
                    <div
                      className={cn(
                        'flex items-center justify-between pt-2.5 border-t min-h-[34px] mt-auto',
                        isDarkCard ? 'border-white/20' : 'border-border-default dark:border-border-default/60'
                      )}
                    >
                      {/* Left: Housekeeping / Maintenance Semantic Pill Badge */}
                      <div className="flex items-center gap-1.5">
                        {isMaintenance ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold border shadow-2xs',
                              isDarkCard
                                ? 'bg-white/90 text-body border-border-default'
                                : 'bg-surface-muted text-muted border-border-default dark:bg-surface-card dark:text-muted dark:border-border-default'
                            )}
                          >
                            <Wrench className="w-3 h-3 text-muted" />
                            <span>Maintenance</span>
                          </span>
                        ) : room.cleaningStatus === 'DIRTY' ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold border shadow-2xs',
                              isDarkCard
                                ? 'bg-warning-subtle text-warning border-warning'
                                : 'bg-warning-subtle text-warning border-warning dark:bg-warning-subtle dark:text-warning dark:border-warning'
                            )}
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Dirty</span>
                          </span>
                        ) : room.cleaningStatus === 'IN_CLEANING' ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold border shadow-2xs',
                              isDarkCard
                                ? 'bg-warning-subtle text-warning border-warning'
                                : 'bg-warning-subtle text-warning border-warning dark:bg-warning-subtle dark:text-warning dark:border-warning'
                            )}
                          >
                            <RefreshCw className="w-3 h-3 text-warning" />
                            <span>Cleaning</span>
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold border shadow-2xs',
                              isDarkCard
                                ? 'bg-white/95 text-[#0B3D32] border-white/40'
                                : 'bg-success-subtle text-success border-success dark:bg-success-subtle dark:text-success dark:border-success'
                            )}
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Clean</span>
                          </span>
                        )}
                      </div>

                      {/* Right: High-contrast Action Box Button */}
                      <div>
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickBookRoom(room);
                            }}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-brand hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Book Now
                          </button>
                        ) : isOccupied ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeBooking) {
                                handleOpenCheckOutModal(activeBooking);
                              } else {
                                setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                              }
                            }}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-white text-[#0B3D32] hover:bg-emerald-50 font-bold text-[11px] shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Check Out
                          </button>
                        ) : isBooked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeBooking) {
                                router.push(`/check-in?bookingId=${activeBooking.id}`);
                              } else {
                                setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                              }
                            }}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-brand hover:bg-[#093027] text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
                          >
                            Check In
                          </button>
                        ) : isDeparting ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeBooking) {
                                handleOpenCheckOutModal(activeBooking);
                              } else {
                                setOpenOptionMenuId(openOptionMenuId === room.id ? null : room.id);
                              }
                            }}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            Check Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMaintenance(room.id);
                            }}
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-slate-100 text-muted hover:bg-slate-200 border border-border-default dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            {isMaintenance ? 'End Service' : 'Service'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Floating Dropdown Menu (Anchored under 3-dots button, simple & professional) */}
                    {openOptionMenuId === room.id && (
                      <>
                        {/* Transparent Backdrop to close on outside click */}
                        <div
                          className="fixed inset-0 z-40 cursor-default bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenOptionMenuId(null);
                          }}
                        />

                        {/* Floating Dropdown anchored right below 3-dots button */}
                        <div
                          className="absolute right-2.5 top-10 z-50 w-48 rounded-md border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card shadow-xl py-1 text-xs select-none animate-in fade-in-0 zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Active Guest Info Header when room has guest */}
                          {activeBooking && (
                            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-border-default bg-slate-50 dark:bg-slate-900/50">
                              <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                {activeBooking.guest.firstName} {activeBooking.guest.lastName}
                              </div>
                              <div className="text-[10px] text-muted dark:text-muted">
                                {status === 'ARRIVING'
                                  ? `Arrives: ${formatDate(activeBooking.checkIn)}`
                                  : `Departs: ${formatDate(activeBooking.checkOut)}`}
                              </div>
                            </div>
                          )}
                          {/* Front Desk Actions based on room state */}
                          {isAvailable && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  handleQuickBookRoom(room);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>Book Room</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  router.push(`/check-in?roomId=${room.id}&mode=walk-in`);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>Walk-in Check In</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  toast.info(
                                    `Room ${room.number} is Available`,
                                    `Check in a guest first before ordering room service.`
                                  );
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <Utensils className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>Add Order</span>
                              </button>
                            </>
                          )}

                          {isBooked && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  if (activeBooking) {
                                    router.push(`/check-in?bookingId=${activeBooking.id}`);
                                  }
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>Check In Guest</span>
                              </button>
                              {activeBooking && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenOptionMenuId(null);
                                    handleOpenAddFoodModal(activeBooking);
                                  }}
                                  className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                                >
                                  <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Add Order</span>
                                </button>
                              )}
                            </>
                          )}

                          {isOccupied && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  const targetBooking =
                                    activeBooking ||
                                    bookings.find(
                                      (b) =>
                                        b.room.number === room.number &&
                                        (b.status === 'CHECKED_IN' || b.status === 'RESERVED')
                                    );
                                  if (targetBooking) {
                                    handleOpenAddFoodModal(targetBooking);
                                  }
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Add Order</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  if (activeBooking) {
                                    handleOpenCheckOutModal(activeBooking);
                                  }
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>Check Out</span>
                              </button>
                            </>
                          )}

                          {/* View Folio (Arriving or Occupied with active booking) */}
                          {activeBooking && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenOptionMenuId(null);
                                handleOpenFolioDrawer(activeBooking);
                              }}
                              className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-muted dark:text-muted" />
                              <span>View Folio</span>
                            </button>
                          )}

                          {/* Divider */}
                          <div className="my-1 border-t border-slate-100 dark:border-border-default" />

                          {/* Housekeeping Actions */}
                          {(() => {
                            const isRoomClean = room.cleaningStatus === 'CLEAN';
                            const isRoomDirty = room.cleaningStatus === 'DIRTY';

                            return (
                              <>
                                <button
                                  type="button"
                                  disabled={isRoomClean}
                                  aria-disabled={isRoomClean}
                                  onClick={(e) => {
                                    if (isRoomClean) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return;
                                    }
                                    setOpenOptionMenuId(null);
                                    handleSetCleaningStatus(room.id, 'CLEAN');
                                  }}
                                  className={cn(
                                    'w-full px-3 py-1.5 flex items-center justify-between text-left text-xs font-medium transition-colors',
                                    isRoomClean
                                      ? 'text-muted dark:text-muted cursor-not-allowed bg-slate-50/70 dark:bg-slate-800/40 select-none opacity-60'
                                      : 'text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer'
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Sparkles className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                    <span>Mark Clean</span>
                                  </div>
                                  {isRoomClean && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={isRoomDirty}
                                  aria-disabled={isRoomDirty}
                                  onClick={(e) => {
                                    if (isRoomDirty) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return;
                                    }
                                    setOpenOptionMenuId(null);
                                    handleSetCleaningStatus(room.id, 'DIRTY');
                                  }}
                                  className={cn(
                                    'w-full px-3 py-1.5 flex items-center justify-between text-left text-xs font-medium transition-colors',
                                    isRoomDirty
                                      ? 'text-muted dark:text-muted cursor-not-allowed bg-slate-50/70 dark:bg-slate-800/40 select-none opacity-60'
                                      : 'text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer'
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                    <span>Mark Dirty</span>
                                  </div>
                                  {isRoomDirty && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">✓</span>
                                  )}
                                </button>
                              </>
                            );
                          })()}

                          {/* Maintenance Actions */}
                          {(isAvailable || isMaintenance) && (
                            <>
                              <div className="my-1 border-t border-slate-100 dark:border-border-default" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenOptionMenuId(null);
                                  handleToggleMaintenance(room.id);
                                }}
                                className="w-full px-3 py-1.5 flex items-center gap-2.5 text-left text-xs font-medium text-muted dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5 text-muted dark:text-muted" />
                                <span>{isMaintenance ? 'End Maintenance' : 'Out of Service'}</span>
                              </button>
                            </>
                          )}
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
          onSetCleaningStatus={handleSetCleaningStatus}
          onBookingCreated={(newBooking) => {
            const nextBookings = [newBooking, ...bookings.filter((b) => b.id !== newBooking.id)];
            saveBookingsToStorage(nextBookings);
            setBookings(nextBookings);
            toast.celebrate(
              newBooking.status === 'CHECKED_IN' ? 'Guest Checked In!' : 'Room Reserved!',
              `Room ${newBooking.room.number} is ${newBooking.status === 'CHECKED_IN' ? 'now Occupied by' : 'booked for'
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default dark:border-border-default pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('arrivals')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'arrivals'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-muted hover:text-body dark:text-muted dark:hover:text-white'
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Arrivals</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'arrivals' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted dark:text-slate-300'
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
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-muted hover:text-body dark:text-muted dark:hover:text-white'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>In-House</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'staying' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted dark:text-slate-300'
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
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-muted hover:text-body dark:text-muted dark:hover:text-white'
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Departures</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[11px] font-bold',
                  activeTab === 'departures' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted dark:text-slate-300'
                )}>
                  {departures.length}
                </span>
              </button>
            </div>

            <div className="w-64">
              <Input
                placeholder="Search guest or room..."
                leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
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
                <span className="text-sm font-bold text-body dark:text-white">
                  Expected Arrivals
                </span>

                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setArrivalFilter('TODAY')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all',
                      arrivalFilter === 'TODAY' ? 'bg-white dark:bg-slate-700 text-body dark:text-white shadow-2xs font-bold' : 'text-muted hover:text-slate-800 dark:text-muted'
                    )}
                  >
                    Today's Arrivals ({arrivals.length})
                  </button>
                  <button
                    onClick={() => setArrivalFilter('ALL')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all',
                      arrivalFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-body dark:text-white shadow-2xs font-bold' : 'text-muted hover:text-slate-800 dark:text-muted'
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
                  <h4 className="text-base font-bold text-body dark:text-white">All Arrivals Checked In!</h4>
                  <p className="text-xs text-muted max-w-md mx-auto">
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
                                <h4 className="font-bold text-base text-body dark:text-white font-heading">
                                  {res.guest.firstName} {res.guest.lastName}
                                </h4>
                                <VipBadge tier={res.guest.vipTier} />
                              </div>
                              <p className="text-xs text-muted dark:text-muted mt-0.5">
                                {res.bookingCode} • {res.guest.phone}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              Check-in today
                            </span>
                          </div>

                          {/* Room & Stay Details */}
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-border-default space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted dark:text-muted">Assigned Room</span>
                              <span className="font-bold text-body dark:text-white flex items-center gap-1.5">
                                <BedDouble className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                                Room {res.room.number} ({res.room.type})
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted dark:text-muted">Stay Duration</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {res.nights} {res.nights === 1 ? 'Night' : 'Nights'} ({formatDate(res.checkIn)} – {formatDate(res.checkOut)})
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border-default/60 dark:border-border-default">
                              <span className="text-muted dark:text-muted">Advance Deposit</span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {fin.totalPaid > 0 ? formatCurrency(fin.totalPaid) : 'Pending at desk'}
                              </span>
                            </div>
                          </div>

                          {res.notes && (
                            <p className="text-[11px] text-muted dark:text-muted bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded border border-amber-200/50 dark:border-amber-900/30 line-clamp-2">
                              <strong className="text-amber-800 dark:text-amber-300">Note:</strong> {res.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Button: Check In Guest */}
                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-border-default">
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
                <span className="text-sm font-bold text-body dark:text-white">
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
                  <h4 className="text-base font-bold text-body dark:text-white">No In-House Guests Right Now</h4>
                  <p className="text-xs text-muted max-w-md mx-auto">
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
                              <h4 className="font-bold text-base text-body dark:text-white font-heading mt-1">
                                {res.guest.firstName} {res.guest.lastName}
                              </h4>
                              <p className="text-xs text-muted dark:text-muted">
                                {res.room.type} • {res.room.bedType}
                              </p>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {stayText}
                            </span>
                          </div>

                          {/* Live Folio Summary Card */}
                          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-border-default space-y-2 text-xs">
                            <div className="flex justify-between items-center text-muted dark:text-slate-300">
                              <span>Room Charges ({res.nights} Nights)</span>
                              <span className="font-medium text-body dark:text-white">
                                {formatCurrency(fin.roomCharges)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-muted dark:text-slate-300">
                              <span>Food & Cafe Orders ({(res.cafeOrders || []).length})</span>
                              <span className="font-medium text-body dark:text-white">
                                {formatCurrency(fin.cafeTotal)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                              <span>Payments & Deposit Paid</span>
                              <span className="font-semibold">
                                -{formatCurrency(fin.totalPaid)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-border-default dark:border-border-default font-bold text-sm">
                              <span className="text-body dark:text-white">Balance Due</span>
                              <span className={fin.balanceDue > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600'}>
                                {formatCurrency(fin.balanceDue)}
                              </span>
                            </div>
                          </div>

                          {/* Food Orders mini-pill summary */}
                          {(res.cafeOrders || []).length > 0 && (
                            <div className="text-[11px] text-muted dark:text-muted space-y-1">
                              <p className="font-semibold text-muted dark:text-slate-300">Recent Food Orders:</p>
                              <div className="flex flex-wrap gap-1">
                                {res.cafeOrders.flatMap((o) => o.items).slice(0, 3).map((item, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                                    {item.quantity}x {item.name}
                                  </span>
                                ))}
                                {res.cafeOrders.flatMap((o) => o.items).length > 3 && (
                                  <span className="px-1.5 py-0.5 text-[10px] text-muted">
                                    +{res.cafeOrders.flatMap((o) => o.items).length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: Add Food, View Folio, Check Out */}
                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-border-default space-y-2">
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
                <span className="text-sm font-bold text-body dark:text-white">
                  Departing Guests & Folios
                </span>
              </div>

              {currentlyStaying.length === 0 ? (
                <div className={`p-12 text-center ${cardClass} space-y-3`}>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-muted">
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
                            <TableCell className="font-bold text-body dark:text-white">
                              Room {res.room.number}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-body dark:text-white">
                                {res.guest.firstName} {res.guest.lastName}
                              </div>
                              <div className="text-[11px] text-muted">{res.bookingCode}</div>
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
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                    Guest Full Name *
                  </label>
                  <Input
                    value={checkInGuestName}
                    onChange={(e) => setCheckInGuestName(e.target.value)}
                    placeholder="e.g. Ram Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    value={checkInPhone}
                    onChange={(e) => setCheckInPhone(e.target.value)}
                    placeholder="+977 9841234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                    ID Document Type
                  </label>
                  <select
                    value={checkInIdType}
                    onChange={(e) => setCheckInIdType(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-body dark:border-border-default dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Citizenship">Citizenship</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
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
            <div className="space-y-3 pt-3 border-t border-border-default dark:border-border-default">
              <div className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wider">
                Room Assignment
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1.5">
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
                            : 'border-border-default dark:border-border-default bg-white dark:bg-slate-900 hover:border-slate-300'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-body dark:text-white">
                            <span>Room {rm.number}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Clean & Ready
                            </span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            {rm.type} • {rm.acType}
                          </p>
                        </div>
                        <span className="font-bold text-body dark:text-white">
                          {formatCurrency(rm.pricePerNight)}/n
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Check-in Deposit */}
            <div className="space-y-3 pt-3 border-t border-border-default dark:border-border-default">
              <div className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 uppercase tracking-wider">
                Check-in Deposit
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-border-default dark:border-border-default space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
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
                    <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                      Deposit Payment Mode
                    </label>
                    <select
                      value={checkInPaymentMethod}
                      onChange={(e) => setCheckInPaymentMethod(e.target.value as any)}
                      className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-body dark:border-border-default dark:bg-slate-900 dark:text-white font-medium"
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
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-default dark:border-border-default">
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
                Check In
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
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-border-default dark:border-border-default flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Guest Checkout</span>
                <h4 className="text-lg font-bold text-body dark:text-white font-heading">
                  {selectedBookingForCheckOut.guest.firstName} {selectedBookingForCheckOut.guest.lastName}
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Room {selectedBookingForCheckOut.room.number} • {selectedBookingForCheckOut.room.type}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted">Stay Duration</span>
                <p className="text-sm font-bold text-body dark:text-white">
                  {selectedBookingForCheckOut.nights} {selectedBookingForCheckOut.nights === 1 ? 'Night' : 'Nights'}
                </p>
                <p className="text-[11px] text-muted">
                  {formatDate(selectedBookingForCheckOut.checkIn)} – {formatDate(selectedBookingForCheckOut.checkOut)}
                </p>
              </div>
            </div>

            {/* Clear Folio Breakdown: Room charges, Food orders, Payments */}
            <div className="rounded-xl border border-border-default dark:border-border-default overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Folio Statement & Charge Summary
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
                {/* Room Charges */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-body dark:text-white">Room Charges</span>
                    <p className="text-[11px] text-muted">
                      Room {selectedBookingForCheckOut.room.number} ({selectedBookingForCheckOut.nights} nights @ {formatCurrency(selectedBookingForCheckOut.room.pricePerNight)}/night)
                    </p>
                  </div>
                  <span className="font-bold text-body dark:text-white">
                    {formatCurrency(selectedBookingForCheckOut.roomCharges)}
                  </span>
                </div>

                {/* Food Orders */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-body dark:text-white">
                      Food & Cafe Orders ({(selectedBookingForCheckOut.cafeOrders || []).length})
                    </span>
                    <span className="font-bold text-body dark:text-white">
                      {formatCurrency(
                        (selectedBookingForCheckOut.cafeOrders || []).reduce((s, o) => s + (o.subtotal || 0), 0)
                      )}
                    </span>
                  </div>

                  {(selectedBookingForCheckOut.cafeOrders || []).length === 0 ? (
                    <p className="text-[11px] text-muted italic">No food orders charged to this room.</p>
                  ) : (
                    <div className="space-y-1 pl-3 pt-1 border-l-2 border-amber-300 dark:border-amber-700">
                      {selectedBookingForCheckOut.cafeOrders.map((ord) => (
                        <div key={ord.id} className="flex justify-between text-[11px] text-muted dark:text-muted">
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
                    <div key={pay.id} className="flex justify-between text-[11px] text-muted pl-3">
                      <span>{pay.receiptNo} ({pay.method} • {pay.type})</span>
                      <span>{formatCurrency(pay.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* 4. Net Balance Due */}
                <div className="pt-3 flex justify-between items-center text-sm font-bold bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <span className="text-body dark:text-white">Outstanding Balance Due to Settle:</span>
                  <span className="text-base text-amber-800 dark:text-amber-300">
                    {formatCurrency(
                      getBookingFinancials(selectedBookingForCheckOut).balanceDue
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Settlement Input */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-border-default dark:border-border-default space-y-3">
              <h5 className="text-xs font-bold text-body dark:text-white uppercase tracking-wider">
                Collect Payment & Settle Folio
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-muted dark:text-slate-300 mb-1">
                    Settlement Payment Method
                  </label>
                  <select
                    value={checkoutPaymentMethod}
                    onChange={(e) => setCheckoutPaymentMethod(e.target.value as any)}
                    className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-body dark:border-border-default dark:bg-slate-900 dark:text-white font-medium"
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
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-default dark:border-border-default">
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
        title="Add Order (Room Service)"
        description={
          selectedBookingForFood
            ? `Order food & beverages for Room ${selectedBookingForFood.room.number} (${selectedBookingForFood.guest.firstName} ${selectedBookingForFood.guest.lastName})`
            : ''
        }
        size="md"
      >
        <div className="space-y-3">
          {/* Quick Menu Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search dishes or drinks (e.g. Momo, Biryani, Coffee)..."
              value={foodMenuSearch}
              onChange={(e) => setFoodMenuSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-slate-900 text-body dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3D32]"
            />
            {foodMenuSearch && (
              <button
                type="button"
                onClick={() => setFoodMenuSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-muted dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
            {filteredFoodCatalog.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No items match &quot;{foodMenuSearch}&quot;.
              </div>
            ) : (
              filteredFoodCatalog.map((item) => {
                const qty = selectedFoodItems[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-body dark:text-white">
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-muted dark:text-muted">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                        Rs. {item.price.toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFoodItems((prev) => ({
                            ...prev,
                            [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                          }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 dark:border-border-default flex items-center justify-center font-bold text-muted hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-body dark:text-white font-mono">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFoodItems((prev) => ({
                            ...prev,
                            [item.id]: (prev[item.id] || 0) + 1,
                          }))
                        }
                        className="w-7 h-7 rounded border border-slate-300 dark:border-border-default flex items-center justify-center font-bold text-muted hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-border-default dark:border-border-default flex justify-between items-center text-xs">
            <span className="text-muted font-medium">Order Subtotal:</span>
            <span className="font-bold text-sm text-[#0B3D32] dark:text-emerald-400 font-mono">
              Rs.{' '}
              {Object.entries(selectedFoodItems)
                .reduce((sum, [id, q]) => {
                  const m =
                    foodCatalog.find((item) => item.id === id) ||
                    CAFE_MENU_ITEMS.find((item) => item.id === id);
                  return sum + (m ? m.price * q : 0);
                }, 0)
                .toLocaleString()}
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
              Charge to Room Folio
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
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-border-default dark:border-border-default space-y-1">
              <p className="font-bold text-body dark:text-white">
                {selectedBookingForFolio.room.type} ({selectedBookingForFolio.room.bedType})
              </p>
              <p className="text-muted">
                Check-in: {formatDate(selectedBookingForFolio.checkIn)} • Check-out: {formatDate(selectedBookingForFolio.checkOut)} ({selectedBookingForFolio.nights} nights)
              </p>
              <p className="text-muted">
                Contact: {selectedBookingForFolio.guest.phone} • {selectedBookingForFolio.guest.email}
              </p>
            </div>

            {/* Charges */}
            <div className="space-y-2">
              <h5 className="font-bold text-body dark:text-white uppercase tracking-wider text-[11px]">
                Itemized Charges
              </h5>
              <div className="space-y-1.5 p-3 rounded-lg border border-border-default dark:border-border-default">
                <div className="flex justify-between font-semibold">
                  <span>Room Tariff ({selectedBookingForFolio.nights} nights)</span>
                  <span>{formatCurrency(selectedBookingForFolio.roomCharges)}</span>
                </div>
                {(selectedBookingForFolio.cafeOrders || []).map((o) => (
                  <div key={o.id} className="flex justify-between text-muted dark:text-muted">
                    <span>{o.orderNumber} ({o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')})</span>
                    <span>{formatCurrency(o.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <h5 className="font-bold text-body dark:text-white uppercase tracking-wider text-[11px]">
                Payments & Receipts
              </h5>
              <div className="space-y-1.5 p-3 rounded-lg border border-border-default dark:border-border-default">
                {(selectedBookingForFolio.payments || []).length === 0 ? (
                  <p className="text-muted italic">No payments recorded yet.</p>
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading Check-in Desk...</div>}>
      <FrontDeskContent />
    </Suspense>
  );
}

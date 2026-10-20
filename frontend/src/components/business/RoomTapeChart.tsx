'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  UserCheck,
  LogOut,
  Receipt,
  Search,
  CheckCircle2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Bed,
  User,
  Baby,
  Tag,
  Phone,
  Mail,
  BookmarkCheck,
  LogIn,
} from 'lucide-react';
import {
  RoomBooking,
  getRelativeDate,
  saveBookingsToStorage,
  getBookingFinancials,
} from '@/app/(admin)/reservations/reservationsData';
import { cn } from '@/lib/utils';

export interface TapeChartRoom {
  id: string;
  number: string;
  floor: number;
  category: string;
  type: string;
  bedType: string;
  acType?: 'AC' | 'Non-AC';
  pricePerNight: number;
  capacity: number;
  operationalStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
}

export interface QuickReservationModalState {
  isOpen: boolean;
  room: TapeChartRoom;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  title: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Prof.';
  firstName: string;
  lastName: string;
  adults: number;
  children: number;
  ratePlan: 'Seasonal Rate' | 'Standard Rate' | 'Corporate Rate' | 'Special Direct';
  roomsCount: number;
  isAssigned: boolean;
  phone: string;
  email: string;
  segment: 'Single' | 'Group' | 'Agent / Corporate';
  showGuarantee: boolean;
  idType: string;
  idNumber: string;
  depositAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
}

function formatMonthDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface RoomTapeChartProps {
  bookings: RoomBooking[];
  rooms?: any[];
  onSelectBooking: (booking: RoomBooking) => void;
  onOpenCheckInModal: (booking: RoomBooking) => void;
  onOpenCheckOutModal: (booking: RoomBooking) => void;
  onOpenNewBookingModal?: (roomNumber: string, checkInDate: string) => void;
  onBookingCreated?: (newBooking: RoomBooking) => void;
  onUpdateBookings?: (updatedBookings: RoomBooking[]) => void;
  onClose?: () => void;
}

// Brand Hotel Room Setup categorized cleanly
export const DEFAULT_TAPE_ROOMS: TapeChartRoom[] = [
  // AC Room
  { id: 'rm-101', number: '101', floor: 1, category: 'AC Room', type: 'Deluxe AC Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-108', number: '108', floor: 1, category: 'AC Room', type: 'Deluxe AC Room', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },

  // Deluxe Room
  { id: 'rm-104', number: '104', floor: 1, category: 'Deluxe Room', type: 'Deluxe Premium', bedType: 'King Bed', acType: 'AC', pricePerNight: 3800, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },

  // Non AC Room
  { id: 'rm-102', number: '102', floor: 1, category: 'Non AC Room', type: 'Standard Non-AC', bedType: 'Queen Bed', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, category: 'Non AC Room', type: 'Standard Non-AC', bedType: 'Queen Bed', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-106', number: '106', floor: 1, category: 'Non AC Room', type: 'Standard Non-AC', bedType: 'Queen Bed', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-109', number: '109', floor: 1, category: 'Non AC Room', type: 'Standard Non-AC', bedType: 'Twin Beds', acType: 'Non-AC', pricePerNight: 2000, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },

  // Suite room
  { id: 'rm-103', number: '103', floor: 1, category: 'Suite room', type: 'Junior Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 4800, capacity: 3, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-107', number: '107', floor: 1, category: 'Suite room', type: 'Executive Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 5500, capacity: 3, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-110', number: '110', floor: 1, category: 'Suite room', type: 'Executive Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 5500, capacity: 3, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },

  // Super Deluxe
  { id: 'rm-201', number: '201', floor: 2, category: 'Super Deluxe', type: 'Super Deluxe Ocean Suite', bedType: 'Emperor Bed', acType: 'AC', pricePerNight: 7500, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-301', number: '301', floor: 3, category: 'Super Deluxe', type: 'Royal Club Penthouse', bedType: 'Emperor Bed', acType: 'AC', pricePerNight: 9500, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, category: 'Super Deluxe', type: 'Presidential Suite', bedType: 'Royal Emperor Bed', acType: 'AC', pricePerNight: 18500, capacity: 6, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
];

function getCategoryForRoom(room: any): string {
  if (room.category) return room.category;
  if (room.acType === 'Non-AC' || String(room.type).toLowerCase().includes('non ac') || String(room.type).toLowerCase().includes('non-ac')) {
    return 'Non AC Room';
  }
  if (String(room.type).toLowerCase().includes('presidential') || String(room.type).toLowerCase().includes('penthouse') || String(room.type).toLowerCase().includes('super')) {
    return 'Super Deluxe';
  }
  if (String(room.type).toLowerCase().includes('suite')) {
    return 'Suite room';
  }
  if (String(room.type).toLowerCase().includes('deluxe')) {
    return 'Deluxe Room';
  }
  if (room.acType === 'AC' || String(room.type).toLowerCase().includes('ac')) {
    return 'AC Room';
  }
  return 'Standard Room';
}

export function RoomTapeChart({
  bookings,
  rooms,
  onSelectBooking,
  onOpenCheckInModal,
  onOpenCheckOutModal,
  onOpenNewBookingModal,
  onBookingCreated,
  onUpdateBookings,
  onClose,
}: RoomTapeChartProps) {
  // Start date in YYYY-MM-DD
  const [startDateStr, setStartDateStr] = useState<string>(() => getRelativeDate(0));

  // Quick Day Span: 3, 7, 10, 15, 30 days
  const [daysCount, setDaysCount] = useState<3 | 7 | 10 | 15 | 30>(7);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Active highlighted room
  const [activeRoomNumber, setActiveRoomNumber] = useState<string>('102');

  // Drag-to-Book state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    roomId: string;
    roomNumber: string;
    roomType: string;
    category: string;
    pricePerNight: number;
    startColIndex: number;
    currentColIndex: number;
  } | null>(null);

  // Quick Booking / Check-in Modal State
  const [bookingModal, setBookingModal] = useState<QuickReservationModalState | null>(null);

  // Close quick reservation modal on Escape key and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBookingModal(null);
      }
    };
    if (bookingModal?.isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bookingModal?.isOpen]);

  // Existing booking inspection modal
  const [inspectedBooking, setInspectedBooking] = useState<RoomBooking | null>(null);

  // Build rooms list
  const roomsList = useMemo<TapeChartRoom[]>(() => {
    if (rooms && rooms.length > 0) {
      return rooms.map((r) => ({
        id: r.id || `rm-${r.number}`,
        number: String(r.number),
        floor: Number(r.floor) || 1,
        category: getCategoryForRoom(r),
        type: r.type || 'Standard Room',
        bedType: r.bedType || 'King Bed',
        acType: r.acType || (r.type?.toLowerCase().includes('non') ? 'Non-AC' : 'AC'),
        pricePerNight: Number(r.pricePerNight) || 3000,
        capacity: Number(r.capacity) || 2,
        operationalStatus: r.operationalStatus || 'AVAILABLE',
        cleaningStatus: r.cleaningStatus || 'CLEAN',
      }));
    }
    return DEFAULT_TAPE_ROOMS;
  }, [rooms]);

  // Group rooms by category
  const groupedRooms = useMemo(() => {
    const map = new Map<string, TapeChartRoom[]>();
    const order = ['AC Room', 'Deluxe Room', 'Non AC Room', 'Suite room', 'Super Deluxe'];

    order.forEach((cat) => map.set(cat, []));

    roomsList.forEach((rm) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRoom = rm.number.toLowerCase().includes(q) || rm.type.toLowerCase().includes(q);
        const matchesBooking = bookings.some(
          (b) =>
            b.room.number === rm.number &&
            (b.guest.firstName.toLowerCase().includes(q) ||
              b.guest.lastName.toLowerCase().includes(q) ||
              b.bookingCode.toLowerCase().includes(q))
        );
        if (!matchesRoom && !matchesBooking) return;
      }

      const cat = rm.category || getCategoryForRoom(rm);
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(rm);
    });

    const entries: { category: string; rooms: TapeChartRoom[] }[] = [];
    map.forEach((rms, cat) => {
      if (rms.length > 0) {
        entries.push({ category: cat, rooms: rms });
      }
    });
    return entries;
  }, [roomsList, bookings, searchQuery]);

  // Generate Date Column Array (daysCount + 1 to include checkout day column)
  const timelineDates = useMemo(() => {
    const list: {
      dateStr: string;
      displayDate: string; // DD/MM
      dayName: string;
      dayNum: number;
      monthNum: number;
      year: number;
      isToday: boolean;
    }[] = [];

    const [y, m, d] = (startDateStr || getRelativeDate(0)).split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const todayStr = getRelativeDate(0);

    const totalCols = daysCount + 1;

    for (let i = 0; i < totalCols; i++) {
      const cur = new Date(base.getTime() + i * 86400000);
      const year = cur.getFullYear();
      const monthNum = cur.getMonth() + 1;
      const dayNum = cur.getDate();
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const displayDate = `${String(dayNum).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}`;
      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });

      list.push({
        dateStr,
        displayDate,
        dayName,
        dayNum,
        monthNum,
        year,
        isToday: dateStr === todayStr,
      });
    }

    return list;
  }, [startDateStr, daysCount]);

  const rangeStartStr = timelineDates[0]?.dateStr || startDateStr;
  const rangeEndStr = timelineDates[timelineDates.length - 1]?.dateStr || startDateStr;

  // Global mouseup listener for drag-to-book release
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState && dragState.isDragging) {
        finishDragSelection();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState, timelineDates, bookings, roomsList]);

  // Handle Drag Selection Finish
  const finishDragSelection = () => {
    if (!dragState) return;

    const minIdx = Math.min(dragState.startColIndex, dragState.currentColIndex);
    const maxIdx = Math.max(dragState.startColIndex, dragState.currentColIndex);

    const checkIn = timelineDates[minIdx]?.dateStr;
    const lastStay = timelineDates[maxIdx]?.dateStr;

    if (!checkIn || !lastStay) {
      setDragState(null);
      return;
    }

    // Checkout date is the next day after the last stay date
    const [y, m, d] = lastStay.split('-').map(Number);
    const nextObj = new Date(y, m - 1, d + 1);
    const checkOut = `${nextObj.getFullYear()}-${String(nextObj.getMonth() + 1).padStart(2, '0')}-${String(nextObj.getDate()).padStart(2, '0')}`;

    const nights = Math.max(1, maxIdx - minIdx + 1);

    // Conflict check
    const hasConflict = bookings.some((b) => {
      if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
      if (b.room.number !== dragState.roomNumber) return false;
      return !(b.checkOut <= checkIn || b.checkIn >= checkOut);
    });

    if (hasConflict) {
      alert(`Cannot book: Room ${dragState.roomNumber} already has an active reservation during the selected dates.`);
      setDragState(null);
      return;
    }

    const matchedRoom = roomsList.find((r) => r.id === dragState.roomId) || {
      id: dragState.roomId,
      number: dragState.roomNumber,
      category: dragState.category,
      type: dragState.roomType,
      bedType: 'King Bed',
      floor: 1,
      pricePerNight: dragState.pricePerNight,
      capacity: 2,
      operationalStatus: 'AVAILABLE' as const,
      cleaningStatus: 'CLEAN' as const,
    };

    setBookingModal({
      isOpen: true,
      room: matchedRoom,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      title: 'Mr.',
      firstName: '',
      lastName: '',
      adults: matchedRoom.capacity || 2,
      children: 0,
      ratePlan: 'Seasonal Rate',
      roomsCount: 1,
      isAssigned: true,
      phone: '',
      email: '',
      segment: 'Single',
      showGuarantee: false,
      idType: 'Citizenship',
      idNumber: '',
      depositAmount: matchedRoom.pricePerNight,
      paymentMethod: 'CASH',
    });

    setDragState(null);
  };

  // Start cell drag
  const handleCellMouseDown = (room: TapeChartRoom, colIdx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const colDate = timelineDates[colIdx]?.dateStr;
    const isBooked = bookings.some((b) => {
      if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
      if (b.room.number !== room.number) return false;
      return b.checkIn <= colDate && colDate < b.checkOut;
    });

    if (isBooked) return;

    setActiveRoomNumber(room.number);
    setDragState({
      isDragging: true,
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      category: room.category,
      pricePerNight: room.pricePerNight,
      startColIndex: colIdx,
      currentColIndex: colIdx,
    });
  };

  const handleCellMouseEnter = (room: TapeChartRoom, colIdx: number) => {
    if (dragState && dragState.isDragging && dragState.roomId === room.id) {
      setDragState((prev) => (prev ? { ...prev, currentColIndex: colIdx } : null));
    }
  };

  // Confirm Quick Reservation with designated Action (Hold, Temp Reserve, Reserve, Check-In/Walk-In)
  const handleQuickReservationAction = (action: 'HOLD' | 'TEMP_RESERVE' | 'RESERVE' | 'CHECKIN') => {
    if (!bookingModal) return;

    const fName = bookingModal.firstName.trim() || 'Guest';
    const lName = bookingModal.lastName.trim();

    const isCheckIn = action === 'CHECKIN';
    const status: RoomBooking['status'] = isCheckIn ? 'CHECKED_IN' : 'RESERVED';

    // Pricing calculation based on rate plan & nights
    let rateMultiplier = 1;
    if (bookingModal.ratePlan === 'Seasonal Rate') rateMultiplier = 1.15;
    if (bookingModal.ratePlan === 'Corporate Rate') rateMultiplier = 0.90;
    if (bookingModal.ratePlan === 'Special Direct') rateMultiplier = 0.85;

    const effectiveNightPrice = Math.round(bookingModal.room.pricePerNight * rateMultiplier);
    const totalTariff = effectiveNightPrice * bookingModal.nights * (bookingModal.roomsCount || 1);

    const actionTag =
      action === 'HOLD'
        ? '[HOLD]'
        : action === 'TEMP_RESERVE'
        ? '[TEMP]'
        : action === 'CHECKIN'
        ? '[CHECKIN]'
        : '[CONFIRMED]';

    const newBooking: RoomBooking = {
      id: `bk-${Date.now()}`,
      bookingCode: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      status,
      guest: {
        id: `gst-${Date.now()}`,
        firstName: `${bookingModal.title} ${fName}`.trim(),
        lastName: lName || (bookingModal.firstName.trim() ? '' : 'Walk-in'),
        phone: bookingModal.phone.trim() || '+977 9800000000',
        email: bookingModal.email.trim() || `${fName.toLowerCase()}@hotelguest.com`,
        address: 'Kathmandu, Nepal',
        idType: bookingModal.idType || 'Citizenship',
        idNumber: bookingModal.idNumber || 'CT-VERIFIED',
        country: 'Nepal',
        vipTier: bookingModal.segment === 'Agent / Corporate' ? 'PLATINUM' : 'STANDARD',
      },
      room: {
        id: bookingModal.room.id,
        number: bookingModal.room.number,
        type: bookingModal.room.type,
        acType: (bookingModal.room.acType as any) || 'AC',
        bedType: bookingModal.room.bedType,
        floorLevel: `${bookingModal.room.floor || 1}st Floor`,
        pricePerNight: effectiveNightPrice,
      },
      checkIn: bookingModal.checkInDate,
      checkOut: bookingModal.checkOutDate,
      nights: bookingModal.nights,
      roomCharges: totalTariff,
      cafeOrders: [],
      payments:
        Number(bookingModal.depositAmount) > 0 && bookingModal.showGuarantee
          ? [
              {
                id: `pay-${Date.now()}`,
                receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
                date: 'Today',
                amount: Number(bookingModal.depositAmount),
                method: bookingModal.paymentMethod,
                type: isCheckIn ? 'SETTLEMENT' : 'ADVANCE',
                notes: `${actionTag} Quick reservation guarantee / deposit`,
              },
            ]
          : [],
      bookingHistory: [],
      notes: `${actionTag} Quick Reservation • Plan: ${bookingModal.ratePlan} • Segment: ${bookingModal.segment}`,
    };

    const nextBookings = [newBooking, ...bookings.filter((b) => b.id !== newBooking.id)];

    // Persist to storage
    saveBookingsToStorage(nextBookings);
    try {
      localStorage.setItem('hotel_pms_bookings_v2', JSON.stringify(nextBookings));
    } catch (err) {}

    // Notify parent
    if (onBookingCreated) {
      onBookingCreated(newBooking);
    }
    if (onUpdateBookings) {
      onUpdateBookings(nextBookings);
    }

    setBookingModal(null);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    let csv = `"STAY VIEW TIMELINE MATRIX"\n`;
    csv += `"From Date:","${rangeStartStr}","To Date:","${rangeEndStr}"\n\n`;

    // Header
    const colHeaders = ['Room No.', 'Category', 'Floor', 'Tariff/Night', ...timelineDates.map((d) => d.displayDate)];
    csv += colHeaders.map((h) => `"${h}"`).join(',') + '\n';

    // Room rows
    groupedRooms.forEach((group) => {
      csv += `"[CATEGORY: ${group.category.toUpperCase()}]",,,,` + timelineDates.map(() => '""').join(',') + '\n';
      group.rooms.forEach((r) => {
        const row = [r.number, r.category, `${r.floor}F`, `Rs. ${r.pricePerNight}`];
        timelineDates.forEach((col) => {
          const b = bookings.find(
            (bk) =>
              bk.room.number === r.number &&
              bk.status !== 'CANCELLED' &&
              bk.status !== 'NO_SHOW' &&
              bk.checkIn <= col.dateStr &&
              col.dateStr < bk.checkOut
          );
          if (b) {
            const statusLabel =
              b.status === 'CHECKED_IN'
                ? b.checkOut === col.dateStr
                  ? 'Departing'
                  : 'Occupied'
                : 'Booked';
            row.push(`${b.guest.firstName} ${b.guest.lastName} (${statusLabel})`);
          } else {
            row.push('Vacant');
          }
        });
        csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
      });
    });

    // Totals rows
    csv += '\n"[TOTALS]"\n';

    // Booked
    const bookedRow = ['Booked (Reserved)', '', '', ''];
    timelineDates.forEach((col) => {
      const count = roomsList.filter((r) =>
        bookings.some(
          (b) =>
            b.room.number === r.number &&
            b.status === 'RESERVED' &&
            b.checkIn <= col.dateStr &&
            col.dateStr < b.checkOut
        )
      ).length;
      bookedRow.push(String(count));
    });
    csv += bookedRow.map((c) => `"${c}"`).join(',') + '\n';

    // Occupied
    const occupiedRow = ['Occupied (In-House)', '', '', ''];
    timelineDates.forEach((col) => {
      const count = roomsList.filter((r) =>
        bookings.some(
          (b) =>
            b.room.number === r.number &&
            b.status === 'CHECKED_IN' &&
            b.checkIn <= col.dateStr &&
            col.dateStr < b.checkOut
        )
      ).length;
      occupiedRow.push(String(count));
    });
    csv += occupiedRow.map((c) => `"${c}"`).join(',') + '\n';

    // Vacant
    const vacantRow = ['Vacant (Available)', '', '', ''];
    timelineDates.forEach((col) => {
      const bookedCount = roomsList.filter((r) =>
        bookings.some(
          (b) =>
            b.room.number === r.number &&
            (b.status === 'RESERVED' || b.status === 'CHECKED_IN') &&
            b.checkIn <= col.dateStr &&
            col.dateStr < b.checkOut
        )
      ).length;
      const vacantCount = Math.max(0, roomsList.length - bookedCount);
      vacantRow.push(String(vacantCount));
    });
    csv += vacantRow.map((c) => `"${c}"`).join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stay_View_${rangeStartStr}_to_${rangeEndStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Column width calculations
  const totalCols = timelineDates.length;
  const colWidth = useMemo(() => {
    if (daysCount === 3) return 'minmax(140px, 1fr)';
    if (daysCount === 7) return 'minmax(95px, 1fr)';
    if (daysCount === 10) return 'minmax(75px, 1fr)';
    if (daysCount === 15) return 'minmax(60px, 1fr)';
    return 'minmax(45px, 1fr)';
  }, [daysCount]);

  return (
    <div className="space-y-2 select-none font-sans text-slate-800">
      {/* ------------------------------------------------------------- */}
      {/* 1. CLEAN ENTERPRISE TOOLBAR (Matching Front-Desk Card Style)  */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Dropdown + < Today > Stepper + From Date Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeline Duration Dropdown */}
          <div className="flex items-center gap-1.5 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] dark:border-[#145447] px-2.5 py-1">
            <span className="text-[11px] font-semibold text-[#64736C] dark:text-slate-400">View:</span>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value) as 3 | 7 | 10 | 15 | 30)}
              className="text-xs font-semibold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
              title="Select timeline duration"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (1 Week)</option>
              <option value={10}>10 Days</option>
              <option value={15}>15 Days</option>
              <option value={30}>1 Month (30 Days)</option>
            </select>
          </div>

          {/* Quick Date Stepper (< Today > matching Room Boxes) */}
          <div className="flex items-center rounded-md border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const [y, m, d] = startDateStr.split('-').map(Number);
                const prev = new Date(y, m - 1, d - daysCount);
                setStartDateStr(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`);
              }}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-[#0E362C] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Range"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setStartDateStr(getRelativeDate(0))}
              className={cn(
                'px-3.5 py-1 text-xs font-bold rounded transition-all cursor-pointer',
                startDateStr === getRelativeDate(0)
                  ? 'bg-white text-[#0B3D32] shadow-2xs font-extrabold dark:bg-[#0E362C] dark:text-emerald-300'
                  : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 hover:bg-white/60'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const [y, m, d] = startDateStr.split('-').map(Number);
                const next = new Date(y, m - 1, d + daysCount);
                setStartDateStr(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
              }}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-[#0E362C] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Range"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "From" Date Picker */}
          <div className="flex items-center gap-1.5 border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] px-2 py-1 bg-[#FAFBF9] dark:bg-[#061B16]">
            <span className="text-[11px] font-semibold text-[#64736C] dark:text-slate-400">From</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Refined Legend & Actions */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Subtle Legend (Refined dots matching app tokens) */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#64736C] dark:text-slate-400 pr-2 border-r border-[#E4E9E5] dark:border-[#145447]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Booked</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Occupied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Departing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-[#DCE3DF] bg-white" />
              <span>Vacant</span>
            </span>
          </div>

          {/* Room / Guest Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 sm:w-36 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] py-1 pl-7 pr-2 text-xs text-[#24352F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
            />
          </div>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] hover:bg-[#F2F6F4] text-[#43534D] dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Export CSV/Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] hover:bg-rose-50 text-[#43534D] hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Close Stay View"
            >
              <X className="w-3.5 h-3.5 text-rose-500" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. REFINED TIMELINE MATRIX TABLE                              */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="w-full min-w-[720px]"
            style={{
              display: 'grid',
              gridTemplateColumns: `135px repeat(${totalCols}, ${colWidth})`,
            }}
          >
            {/* Top Left Corner */}
            <div className="sticky left-0 z-30 bg-[#F2F4F2] dark:bg-[#061B16] text-[#24352F] dark:text-slate-200 font-bold text-xs px-3 py-2 border-b border-r border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
              <span>Room No.</span>
              <span className="text-[10px] text-[#64736C] font-normal">Tariff</span>
            </div>

            {/* Date Column Headers */}
            {timelineDates.map((col) => (
              <div
                key={col.dateStr}
                className={cn(
                  'bg-[#F2F4F2] dark:bg-[#061B16] text-[#24352F] dark:text-slate-200 py-1.5 px-1 text-center border-b border-r border-[#DCE3DF] dark:border-[#145447] transition-colors',
                  col.isToday && 'bg-[#E8F2EE] dark:bg-[#0E362C]'
                )}
              >
                <div className="text-[10px] font-semibold text-[#64736C] dark:text-slate-400 uppercase">
                  {col.dayName}
                </div>
                <div
                  className={cn(
                    'text-xs font-bold font-mono tracking-tight',
                    col.isToday ? 'text-[#0B3D32] dark:text-emerald-300 font-extrabold' : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {col.displayDate}
                </div>
              </div>
            ))}

            {/* Category Groups and Room Rows */}
            {groupedRooms.map((group) => (
              <React.Fragment key={group.category}>
                {/* Refined Category Divider: Neutral Subtle Grey Banner */}
                <div className="sticky left-0 z-20 bg-[#F8FAF8] dark:bg-[#0A2620] text-[#43534D] dark:text-[#A4B8AE] font-bold text-[10px] uppercase tracking-wider px-3 py-1 border-b border-r border-[#DCE3DF] dark:border-[#145447]">
                  {group.category}
                </div>
                <div
                  className="bg-[#F8FAF8] dark:bg-[#0A2620] border-b border-[#DCE3DF] dark:border-[#145447]"
                  style={{ gridColumn: `span ${totalCols}` }}
                />

                {/* Individual Room Rows under this category */}
                {group.rooms.map((room) => {
                  const roomBookings = bookings.filter((b) => {
                    if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
                    if (b.room.number !== room.number) return false;
                    return b.checkIn <= rangeEndStr && b.checkOut > rangeStartStr;
                  });

                  const isRowActive = activeRoomNumber === room.number;

                  return (
                    <React.Fragment key={room.id}>
                      {/* Sticky Left: Room Number */}
                      <div
                        onClick={() => setActiveRoomNumber(room.number)}
                        className={cn(
                          'sticky left-0 z-20 border-b border-r border-[#E4E9E5] dark:border-[#145447] px-3 py-1.5 flex items-center justify-between transition-colors cursor-pointer',
                          isRowActive
                            ? 'bg-[#F2F6F4] dark:bg-[#0E362C]'
                            : 'bg-white dark:bg-[#071F1A] hover:bg-[#FAFBF9] dark:hover:bg-[#092B23]'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-xs font-bold font-mono px-1 py-0.5 rounded-[2px]',
                              isRowActive
                                ? 'bg-[#0B3D32] text-white shadow-2xs'
                                : 'text-[#24352F] dark:text-white'
                            )}
                          >
                            {room.number}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64736C] dark:text-slate-400 font-mono">
                          ₹{room.pricePerNight}
                        </span>
                      </div>

                      {/* Date Cells & Booking Bars Container */}
                      <div
                        className="relative border-b border-[#E4E9E5] dark:border-[#145447] h-8"
                        style={{
                          gridColumn: `span ${totalCols}`,
                          display: 'grid',
                          gridTemplateColumns: `repeat(${totalCols}, ${colWidth})`,
                        }}
                      >
                        {/* Background Vacant Grid Cells (handles drag-to-book) */}
                        {timelineDates.map((col, colIdx) => {
                          const isBeingDragged =
                            dragState &&
                            dragState.roomId === room.id &&
                            colIdx >= Math.min(dragState.startColIndex, dragState.currentColIndex) &&
                            colIdx <= Math.max(dragState.startColIndex, dragState.currentColIndex);

                          return (
                            <div
                              key={col.dateStr}
                              onMouseDown={(e) => handleCellMouseDown(room, colIdx, e)}
                              onMouseEnter={() => handleCellMouseEnter(room, colIdx)}
                              className={cn(
                                'h-full border-r border-[#E4E9E5] dark:border-[#145447]/60 transition-colors cursor-pointer relative select-none flex items-center justify-center',
                                isBeingDragged
                                  ? 'bg-[#E8F2EE] dark:bg-emerald-950/60 border-2 border-dashed border-[#0B3D32] dark:border-emerald-500 font-bold text-xs'
                                  : 'bg-white dark:bg-[#071F1A] hover:bg-[#FAFBF9] dark:hover:bg-[#092B23]'
                              )}
                              title={`Click or drag to book Room ${room.number} (${col.displayDate})`}
                            >
                              {isBeingDragged && colIdx === Math.min(dragState.startColIndex, dragState.currentColIndex) && (
                                <span className="text-[10px] text-white font-bold px-1.5 py-0.5 rounded-[2px] bg-[#0B3D32] shadow-2xs z-10 whitespace-nowrap">
                                  + {Math.abs(dragState.currentColIndex - dragState.startColIndex) + 1} Days
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Booking Bars Overlay (Refined, Subtle, Calm Enterprise Cards) */}
                        {roomBookings.map((b) => {
                          const startIndex = timelineDates.findIndex((d) => d.dateStr === b.checkIn);
                          const endIndex = timelineDates.findIndex((d) => d.dateStr === b.checkOut);

                          const actualStart = startIndex === -1 ? 0 : startIndex;
                          const actualEnd = endIndex === -1 ? totalCols : endIndex;
                          const span = Math.max(1, actualEnd - actualStart);

                          const isStartClipped = b.checkIn < rangeStartStr;
                          const isEndClipped = b.checkOut > rangeEndStr;

                          // -------------------------------------------------------------
                          // REFINED ENTERPRISE COLOR PALETTE:
                          // - Booked: Soft Amber card with amber left border & dark text
                          // - Occupied: Soft Blue card with blue left border & dark text
                          // - Departing: Soft Rose card with burgundy left border
                          // - Checked Out: Soft Slate card with grey border
                          // -------------------------------------------------------------
                          const isArriving = b.status === 'RESERVED';
                          const isOccupied = b.status === 'CHECKED_IN';
                          const isDeparting = isOccupied && b.checkOut === timelineDates[0]?.dateStr;

                          let barStyle = 'border-l-3 border-l-amber-500 bg-[#FFFBEB] dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-y border-r border-amber-200 dark:border-amber-800/60';
                          let dotColor = 'bg-amber-500';

                          if (isDeparting) {
                            barStyle = 'border-l-3 border-l-rose-500 bg-[#FFF1F2] dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-y border-r border-rose-200 dark:border-rose-800/60';
                            dotColor = 'bg-rose-500';
                          } else if (isOccupied) {
                            barStyle = 'border-l-3 border-l-blue-600 bg-[#EFF6FF] dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-y border-r border-blue-200 dark:border-blue-800/60';
                            dotColor = 'bg-blue-600';
                          } else if (b.status === 'CHECKED_OUT') {
                            barStyle = 'border-l-3 border-l-slate-400 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-700';
                            dotColor = 'bg-slate-400';
                          }

                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedBooking(b);
                              }}
                              className={cn(
                                'absolute top-0.5 bottom-0.5 z-10 px-2 flex items-center justify-between shadow-2xs transition-transform hover:scale-[1.01] cursor-pointer rounded-[2px]',
                                barStyle,
                                isStartClipped && 'rounded-l-none border-l-0',
                                isEndClipped && 'rounded-r-none border-r-0'
                              )}
                              style={{
                                left: `${(actualStart / totalCols) * 100}%`,
                                width: `calc(${(span / totalCols) * 100}% - 1px)`,
                              }}
                              title={`${b.guest.firstName} ${b.guest.lastName} (${
                                isDeparting ? 'Departing' : isOccupied ? 'Occupied' : 'Booked'
                              } · ${b.nights}N)`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
                                <span className="text-xs font-semibold tracking-tight truncate">
                                  {b.guest.firstName} {b.guest.lastName}
                                </span>
                              </div>
                              <span className="text-[10px] opacity-75 font-mono shrink-0 hidden sm:inline">
                                {b.nights}n
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}

            {/* ------------------------------------------------------------- */}
            {/* 3. BOTTOM "TOTALS" SECTION (Refined, Non-Intrusive Counts)   */}
            {/* ------------------------------------------------------------- */}
            {/* Totals Banner */}
            <div className="sticky left-0 z-20 bg-[#F8FAF8] dark:bg-[#0A2620] text-[#64736C] dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider px-3 py-1 border-b border-t border-r border-[#DCE3DF] dark:border-[#145447]">
              Totals
            </div>
            <div
              className="bg-[#F8FAF8] dark:bg-[#0A2620] border-b border-t border-[#DCE3DF] dark:border-[#145447]"
              style={{ gridColumn: `span ${totalCols}` }}
            />

            {/* Totals Row 1: Booked */}
            <div className="sticky left-0 z-20 bg-white dark:bg-[#071F1A] text-[#43534D] dark:text-slate-300 font-medium text-xs px-3 py-1.5 border-b border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Booked</span>
              </span>
            </div>
            {timelineDates.map((col) => {
              const bookedCount = roomsList.filter((r) =>
                bookings.some(
                  (b) =>
                    b.room.number === r.number &&
                    b.status === 'RESERVED' &&
                    b.checkIn <= col.dateStr &&
                    col.dateStr < b.checkOut
                )
              ).length;

              return (
                <div
                  key={`totals-booked-${col.dateStr}`}
                  className="bg-white dark:bg-[#071F1A] text-xs py-1.5 text-center border-b border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-center font-mono font-bold"
                >
                  <span className={cn(bookedCount > 0 ? 'text-[#92400E] dark:text-amber-400 font-bold' : 'text-slate-300 dark:text-slate-600 font-normal')}>
                    {bookedCount}
                  </span>
                </div>
              );
            })}

            {/* Totals Row 2: Occupied */}
            <div className="sticky left-0 z-20 bg-white dark:bg-[#071F1A] text-[#43534D] dark:text-slate-300 font-medium text-xs px-3 py-1.5 border-b border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Occupied</span>
              </span>
            </div>
            {timelineDates.map((col) => {
              const occupiedCount = roomsList.filter((r) =>
                bookings.some(
                  (b) =>
                    b.room.number === r.number &&
                    b.status === 'CHECKED_IN' &&
                    b.checkIn <= col.dateStr &&
                    col.dateStr < b.checkOut
                )
              ).length;

              return (
                <div
                  key={`totals-occupied-${col.dateStr}`}
                  className="bg-white dark:bg-[#071F1A] text-xs py-1.5 text-center border-b border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-center font-mono font-bold"
                >
                  <span className={cn(occupiedCount > 0 ? 'text-[#1E40AF] dark:text-blue-400 font-bold' : 'text-slate-300 dark:text-slate-600 font-normal')}>
                    {occupiedCount}
                  </span>
                </div>
              );
            })}

            {/* Totals Row 3: Vacant */}
            <div className="sticky left-0 z-20 bg-white dark:bg-[#071F1A] text-[#43534D] dark:text-slate-300 font-medium text-xs px-3 py-1.5 border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full border border-[#CBD5D0] bg-white" />
                <span>Vacant</span>
              </span>
            </div>
            {timelineDates.map((col) => {
              const occupiedOrBookedCount = roomsList.filter((r) =>
                bookings.some(
                  (b) =>
                    b.room.number === r.number &&
                    (b.status === 'RESERVED' || b.status === 'CHECKED_IN') &&
                    b.checkIn <= col.dateStr &&
                    col.dateStr < b.checkOut
                )
              ).length;
              const vacantCount = Math.max(0, roomsList.length - occupiedOrBookedCount);

              return (
                <div
                  key={`totals-vacant-${col.dateStr}`}
                  className="bg-white dark:bg-[#071F1A] text-xs py-1.5 text-center border-r border-[#E4E9E5] dark:border-[#145447] flex items-center justify-center font-mono font-bold"
                >
                  <span className="text-[#0B3D32] dark:text-emerald-400 font-bold">{vacantCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ADD QUICK RESERVATION MODAL (Matching Enterprise PMS Crop) */}
      {/* ------------------------------------------------------------- */}
      {bookingModal && bookingModal.isOpen && (() => {
        const baseNightPrice = bookingModal.room.pricePerNight || 3000;
        let rateMultiplier = 1;
        if (bookingModal.ratePlan === 'Seasonal Rate') rateMultiplier = 1.15;
        if (bookingModal.ratePlan === 'Corporate Rate') rateMultiplier = 0.90;
        if (bookingModal.ratePlan === 'Special Direct') rateMultiplier = 0.85;

        const effectiveNightPrice = Math.round(baseNightPrice * rateMultiplier);
        const totalPrice = effectiveNightPrice * bookingModal.nights * (bookingModal.roomsCount || 1);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
            {/* Translucent Backdrop: Charcoal Green Overlay #24352F with 60% opacity */}
            <div
              className="fixed inset-0 bg-[#24352F]/60 backdrop-blur-sm transition-opacity"
              onClick={() => setBookingModal(null)}
            />

            {/* Modal Dialog: White Surface #FFFFFF, Border #DCE3DF, 16px Radius (rounded-2xl) */}
            <div className="relative w-full max-w-3xl bg-white border border-[#DCE3DF] rounded-2xl shadow-modal overflow-hidden z-10 my-8 flex flex-col dark:bg-[#0d1e19] dark:border-[#1a332c]">
              {/* Modal Header: Clean White surface with Calendar Icon Badge, Title, Subtitle & Close Button */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E4E9E5] dark:border-[#145447]/60 bg-white dark:bg-[#0d1e19] shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F2EE] dark:bg-[#145447]/40 text-[#0B3D32] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading">
                      Quick Reservation
                    </h3>
                    <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-0.5">
                      Room {bookingModal.room.number} • {bookingModal.room.type || bookingModal.room.category} • {bookingModal.nights} {bookingModal.nights === 1 ? 'Night' : 'Nights'} ({formatMonthDay(bookingModal.checkInDate)} – {formatMonthDay(bookingModal.checkOutDate)})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="rounded-lg p-2 text-[#64736C] hover:text-[#24352F] hover:bg-[#F2F4F2] dark:hover:text-white dark:hover:bg-[#145447] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-160px)] bg-white dark:bg-[#0d1e19]">
                {/* Row 1: Stay Dates, Room Category, Assign Checkbox & Live Price Banner */}
                <div className="p-4 rounded-xl bg-[#FAFBF9] dark:bg-[#072D26]/40 border border-[#DCE3DF] dark:border-[#145447]/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Calendar + Date Range */}
                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#0B3D32] dark:text-emerald-400 font-mono">
                      <Calendar className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                      <span>
                        {formatMonthDay(bookingModal.checkInDate)} – {formatMonthDay(bookingModal.checkOutDate)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#E8F2EE] text-[#0B3D32] dark:bg-[#0E362C] dark:text-emerald-300 font-sans border border-[#C5DED3] dark:border-[#145447]">
                        {bookingModal.nights} {bookingModal.nights === 1 ? 'Night' : 'Nights'}
                      </span>
                    </div>

                    {/* Bed + Room Info */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#24352F] dark:text-white">
                      <Bed className="w-4 h-4 text-[#64736C] dark:text-slate-400 shrink-0" />
                      <span>
                        Room {bookingModal.room.number} • {bookingModal.room.type || bookingModal.room.category}
                      </span>
                    </div>

                    {/* Auto Assign Checkbox */}
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#43534D] dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bookingModal.isAssigned}
                        onChange={(e) => setBookingModal({ ...bookingModal, isAssigned: e.target.checked })}
                        className="rounded accent-[#0B3D32] w-4 h-4 cursor-pointer"
                      />
                      <span>Auto-Assign</span>
                    </label>
                  </div>

                  {/* Right Price Display */}
                  <div className="text-right ml-auto">
                    <div className="text-2xl font-extrabold font-mono text-[#0B3D32] dark:text-emerald-400 leading-none">
                      ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[#64736C] dark:text-slate-400 font-mono mt-1">
                      (₹{effectiveNightPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / night)
                    </div>
                  </div>
                </div>

                {/* Row 2: Selectors: Adults, Children, Rate Plan, Rooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Adults Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-slate-400 mb-1">Adults</label>
                    <div className="h-10 px-3 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#072D26]/30 flex items-center gap-2 hover:border-[#879B90] transition-colors">
                      <User className="w-4 h-4 text-[#64736C] shrink-0" />
                      <select
                        value={bookingModal.adults}
                        onChange={(e) => setBookingModal({ ...bookingModal, adults: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer"
                        title="Adults"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Adult' : 'Adults'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Children Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-slate-400 mb-1">Children</label>
                    <div className="h-10 px-3 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#072D26]/30 flex items-center gap-2 hover:border-[#879B90] transition-colors">
                      <Baby className="w-4 h-4 text-[#64736C] shrink-0" />
                      <select
                        value={bookingModal.children}
                        onChange={(e) => setBookingModal({ ...bookingModal, children: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer"
                        title="Children"
                      >
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Child' : 'Children'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rate Plan Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-slate-400 mb-1">Rate Plan</label>
                    <div className="h-10 px-3 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#072D26]/30 flex items-center gap-2 hover:border-[#879B90] transition-colors">
                      <Tag className="w-4 h-4 text-[#64736C] shrink-0" />
                      <select
                        value={bookingModal.ratePlan}
                        onChange={(e) => setBookingModal({ ...bookingModal, ratePlan: e.target.value as any })}
                        className="w-full bg-transparent text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer"
                        title="Rate Plan"
                      >
                        <option value="Seasonal Rate">Seasonal Rate</option>
                        <option value="Standard Rate">Standard Rate</option>
                        <option value="Corporate Rate">Corporate Rate</option>
                        <option value="Special Direct">Special Direct</option>
                      </select>
                    </div>
                  </div>

                  {/* Rooms Count Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-slate-400 mb-1">Rooms</label>
                    <div className="h-10 px-3 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#072D26]/30 flex items-center gap-2 hover:border-[#879B90] transition-colors">
                      <Bed className="w-4 h-4 text-[#64736C] shrink-0" />
                      <select
                        value={bookingModal.roomsCount}
                        onChange={(e) => setBookingModal({ ...bookingModal, roomsCount: Number(e.target.value) })}
                        className="w-full bg-transparent text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer"
                        title="Room Quantity"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Room' : 'Rooms'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 3: Guest Name Inputs (Title, First Name, Last Name) */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-slate-400 mb-1">
                    Guest Information <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="w-full sm:w-28 shrink-0">
                      <select
                        value={bookingModal.title}
                        onChange={(e) => setBookingModal({ ...bookingModal, title: e.target.value as any })}
                        className="w-full h-10 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#0A2620] px-3 text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                        title="Guest Title"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="First Name *"
                        required
                        value={bookingModal.firstName}
                        onChange={(e) => setBookingModal({ ...bookingModal, firstName: e.target.value })}
                        className="w-full h-10 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#0A2620] px-3.5 text-xs font-semibold text-[#24352F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={bookingModal.lastName}
                        onChange={(e) => setBookingModal({ ...bookingModal, lastName: e.target.value })}
                        className="w-full h-10 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#0A2620] px-3.5 text-xs font-semibold text-[#24352F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Phone, Email & Guarantee / Deposit Toggle */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={bookingModal.phone}
                      onChange={(e) => setBookingModal({ ...bookingModal, phone: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#0A2620] pl-9 pr-3 text-xs font-semibold text-[#24352F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                    />
                  </div>

                  <div className="flex-1 relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={bookingModal.email}
                      onChange={(e) => setBookingModal({ ...bookingModal, email: e.target.value })}
                      className="w-full h-10 rounded-lg border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#0A2620] pl-9 pr-3 text-xs font-semibold text-[#24352F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                    />
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setBookingModal({ ...bookingModal, showGuarantee: !bookingModal.showGuarantee })}
                      className={cn(
                        'h-10 px-3.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
                        bookingModal.showGuarantee
                          ? 'bg-[#E8F2EE] border-[#0B3D32] text-[#0B3D32] dark:bg-[#0E362C] dark:border-emerald-500 dark:text-emerald-300'
                          : 'bg-white dark:bg-[#0A2620] border-[#DCE3DF] dark:border-[#145447] text-[#0B3D32] dark:text-emerald-400 hover:bg-[#EEF5F2]'
                      )}
                    >
                      <span>Advance Deposit</span>
                      <span className="text-[10px]">{bookingModal.showGuarantee ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Guarantee / Deposit Section */}
                {bookingModal.showGuarantee && (
                  <div className="p-4 rounded-xl bg-[#FAFBF9] dark:bg-[#072D26]/40 border border-[#DCE3DF] dark:border-[#145447]/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-[#43534D] dark:text-slate-300 mb-1.5">
                        Advance Deposit Amount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bookingModal.depositAmount}
                        onChange={(e) => setBookingModal({ ...bookingModal, depositAmount: Number(e.target.value) })}
                        className="w-full h-10 rounded-lg border border-[#CBD5D0] dark:border-[#145447] bg-white dark:bg-[#071F1A] px-3 text-xs font-mono font-bold text-[#24352F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#43534D] dark:text-slate-300 mb-1.5">
                        Payment Mode
                      </label>
                      <select
                        value={bookingModal.paymentMethod}
                        onChange={(e) => setBookingModal({ ...bookingModal, paymentMethod: e.target.value as any })}
                        className="w-full h-10 rounded-lg border border-[#CBD5D0] dark:border-[#145447] bg-white dark:bg-[#071F1A] px-3 text-xs font-semibold text-[#24352F] dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-[#0B3D32]/20 focus:border-[#0B3D32]"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="UPI_QR">UPI / Fonepay QR</option>
                        <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer: Matching our pattern, strictly keeping only 2 buttons: Book Now and Check-In / Walk-In */}
              <div className="p-4 sm:p-5 border-t border-[#E4E9E5] bg-[#F2F4F2] dark:bg-[#072D26]/70 dark:border-[#145447]/60 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-[#64736C] hover:text-[#24352F] hover:bg-white dark:hover:bg-[#145447] dark:hover:text-white transition-colors border border-transparent hover:border-[#DCE3DF] cursor-pointer"
                >
                  Cancel
                </button>

                {/* Exactly 2 Buttons: Book Now and Check-In / Walk-In */}
                <div className="flex items-center gap-2.5">
                  {/* 1. Book Now */}
                  <button
                    type="button"
                    onClick={() => handleQuickReservationAction('RESERVE')}
                    className="h-10 px-5 rounded-xl border border-[#CBD5D0] dark:border-[#145447] bg-white dark:bg-[#0A2620] hover:bg-[#EEF2F0] dark:hover:bg-[#145447]/50 text-[#24352F] dark:text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    title="Save as confirmed room reservation"
                  >
                    <BookmarkCheck className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Book Now</span>
                  </button>

                  {/* 2. Check-In / Walk-In */}
                  <button
                    type="button"
                    onClick={() => handleQuickReservationAction('CHECKIN')}
                    className="h-10 px-5 rounded-xl bg-[#0B3D32] hover:bg-[#072821] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    title="Direct Check-In / Walk-In guest now"
                  >
                    <LogIn className="w-4 h-4 text-emerald-300" />
                    <span>Check-In / Walk-In</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* 5. EXISTING BOOKING INSPECTION MODAL                          */}
      {/* ------------------------------------------------------------- */}
      {inspectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider',
                    inspectedBooking.status === 'CHECKED_IN'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  )}
                >
                  {inspectedBooking.status === 'CHECKED_IN' ? 'Occupied' : 'Booked (Reserved)'}
                </span>
                <h4 className="text-base font-bold text-[#24352F] dark:text-white mt-1">
                  {inspectedBooking.guest.firstName} {inspectedBooking.guest.lastName}
                </h4>
                <p className="text-xs text-[#64736C]">
                  Room {inspectedBooking.room.number} · {inspectedBooking.room.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedBooking(null)}
                className="p-1 rounded-[2px] hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64736C]">Stay Duration:</span>
                <span className="font-semibold text-[#24352F] dark:text-white font-mono">
                  {inspectedBooking.checkIn} → {inspectedBooking.checkOut} ({inspectedBooking.nights} Nights)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64736C]">Contact:</span>
                <span className="font-semibold text-[#24352F] dark:text-white">
                  {inspectedBooking.guest.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64736C]">Tariff:</span>
                <span className="font-semibold text-[#24352F] dark:text-white font-mono">
                  Rs. {inspectedBooking.roomCharges?.toLocaleString()}
                </span>
              </div>
              {(() => {
                const fin = getBookingFinancials(inspectedBooking);
                return (
                  <div className="flex justify-between pt-1 border-t border-[#DCE3DF] dark:border-[#145447]">
                    <span className="text-[#24352F] dark:text-white font-bold">Balance Due:</span>
                    <span className={cn('font-bold font-mono', fin.balanceDue > 0 ? 'text-amber-700' : 'text-[#0B3D32]')}>
                      Rs. {fin.balanceDue.toLocaleString()}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 pt-2">
              {inspectedBooking.status === 'RESERVED' && (
                <button
                  type="button"
                  onClick={() => {
                    const b = inspectedBooking;
                    setInspectedBooking(null);
                    onOpenCheckInModal(b);
                  }}
                  className="flex-1 py-2 rounded-[3px] bg-[#0B3D32] hover:bg-[#145447] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Check In Guest</span>
                </button>
              )}

              {inspectedBooking.status === 'CHECKED_IN' && (
                <button
                  type="button"
                  onClick={() => {
                    const b = inspectedBooking;
                    setInspectedBooking(null);
                    onOpenCheckOutModal(b);
                  }}
                  className="flex-1 py-2 rounded-[3px] bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out Guest</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const b = inspectedBooking;
                  setInspectedBooking(null);
                  onSelectBooking(b);
                }}
                className="py-2 px-3.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] hover:bg-[#FAFBF9] text-[#24352F] dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                <span>View Folio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

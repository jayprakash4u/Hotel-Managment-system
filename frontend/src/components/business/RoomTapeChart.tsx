'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  UserCheck,
  LogOut,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  RoomBooking,
  getRelativeDate,
  getBookingFinancials,
} from '@/app/(admin)/reservations/reservationsData';
import { cn, formatCurrency } from '@/lib/utils';

export interface RoomTapeChartProps {
  bookings: RoomBooking[];
  onSelectBooking: (booking: RoomBooking) => void;
  onOpenCheckInModal: (booking: RoomBooking) => void;
  onOpenCheckOutModal: (booking: RoomBooking) => void;
  onOpenNewBookingModal: (roomNumber: string, checkInDate: string) => void;
  onResetDemoData?: () => void;
}

export interface TapeChartRoom {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType: string;
  pricePerNight: number;
  capacity: number;
  operationalStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
}

const DEFAULT_ROOMS: TapeChartRoom[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 3500, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'DIRTY' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 3500, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 4900, capacity: 3, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 6200, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 6200, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', pricePerNight: 9500, capacity: 4, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', pricePerNight: 18500, capacity: 6, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
];

export function RoomTapeChart({
  bookings,
  onSelectBooking,
  onOpenCheckInModal,
  onOpenCheckOutModal,
  onOpenNewBookingModal,
}: RoomTapeChartProps) {
  // Timeline Date Window (1, 2, 7, 14, 30 days)
  const [daysCount, setDaysCount] = useState<1 | 2 | 7 | 14 | 30>(7);
  const [startDateOffset, setStartDateOffset] = useState<number>(0);

  // Filter states
  const [floorFilter, setFloorFilter] = useState<'ALL' | string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Hovered Booking for Quick Inspection Card
  const [hoveredBooking, setHoveredBooking] = useState<{
    booking: RoomBooking;
    x: number;
    y: number;
  } | null>(null);

  const todayStr = useMemo(() => getRelativeDate(0), []);

  // Compute list of rooms
  const roomsList = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_rooms_setup_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as TapeChartRoom[];
          }
        }
      } catch (e) {}
    }
    return DEFAULT_ROOMS;
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return roomsList.filter((room) => {
      if (floorFilter !== 'ALL' && String(room.floor) !== floorFilter) return false;
      if (typeFilter !== 'ALL' && room.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRoom = room.number.toLowerCase().includes(q) || room.type.toLowerCase().includes(q);
        const matchesBooking = bookings.some(
          (b) =>
            b.room.number === room.number &&
            (b.guest.firstName.toLowerCase().includes(q) ||
              b.guest.lastName.toLowerCase().includes(q) ||
              b.bookingCode.toLowerCase().includes(q))
        );
        if (!matchesRoom && !matchesBooking) return false;
      }
      return true;
    });
  }, [roomsList, floorFilter, typeFilter, searchQuery, bookings]);

  // Unique types and floors
  const uniqueTypes = useMemo(() => Array.from(new Set(roomsList.map((r) => r.type))), [roomsList]);
  const distinctFloors = useMemo(() => Array.from(new Set(roomsList.map((r) => String(r.floor)))).sort(), [roomsList]);

  // Generate Date Column Array
  const timelineDates = useMemo(() => {
    const list: {
      dateStr: string;
      dayName: string;
      dayNum: number;
      monthName: string;
      year: number;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    const base = new Date();
    base.setDate(base.getDate() + startDateOffset);

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const dayOfWeek = d.getDay();

      list.push({
        dateStr,
        dayName,
        dayNum,
        monthName,
        year,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return list;
  }, [daysCount, startDateOffset, todayStr]);

  const rangeStartStr = timelineDates[0]?.dateStr || todayStr;
  const rangeEndStr = timelineDates[timelineDates.length - 1]?.dateStr || todayStr;

  // Daily Occupancy %
  const dailyOccupancy = useMemo(() => {
    return timelineDates.map((col) => {
      const totalRooms = roomsList.length;
      let bookedCount = 0;

      roomsList.forEach((rm) => {
        const isBooked = bookings.some((b) => {
          if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
          if (b.room.number !== rm.number) return false;
          return b.checkIn <= col.dateStr && col.dateStr < b.checkOut;
        });
        if (isBooked) bookedCount++;
      });

      const occupancyRate = totalRooms > 0 ? Math.round((bookedCount / totalRooms) * 100) : 0;
      return {
        dateStr: col.dateStr,
        bookedCount,
        totalRooms,
        occupancyRate,
      };
    });
  }, [timelineDates, roomsList, bookings]);

  const colMinWidth = useMemo(() => {
    if (daysCount === 1) return 'minmax(260px, 1fr)';
    if (daysCount === 2) return 'minmax(180px, 1fr)';
    if (daysCount === 7) return 'minmax(80px, 1fr)';
    if (daysCount === 14) return 'minmax(56px, 1fr)';
    return 'minmax(42px, 1fr)';
  }, [daysCount]);

  const containerMinWidth = useMemo(() => {
    if (daysCount === 1) return 'min-w-[460px]';
    if (daysCount === 2) return 'min-w-[560px]';
    if (daysCount === 7) return 'min-w-[760px]';
    if (daysCount === 14) return 'min-w-[960px]';
    return 'min-w-[1440px]';
  }, [daysCount]);

  return (
    <div className="space-y-3 select-none">
      {/* Clean, Human Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
        {/* Left: Date Navigation & Day Count Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5">
            <button
              type="button"
              onClick={() => setStartDateOffset((prev) => prev - (daysCount >= 30 ? 15 : daysCount))}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStartDateOffset(0)}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer',
                startDateOffset === 0
                  ? 'bg-white text-slate-900 shadow-2xs font-bold dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setStartDateOffset((prev) => prev + (daysCount >= 30 ? 15 : daysCount))}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 px-1 hidden sm:inline">
            {daysCount === 1
              ? `${timelineDates[0]?.dayName}, ${timelineDates[0]?.dayNum} ${timelineDates[0]?.monthName} ${timelineDates[0]?.year}`
              : `${timelineDates[0]?.dayNum} ${timelineDates[0]?.monthName} – ${timelineDates[timelineDates.length - 1]?.dayNum} ${timelineDates[timelineDates.length - 1]?.monthName} ${timelineDates[0]?.year}`}
          </span>

          {/* Days Span Dropdown */}
          <select
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value) as 1 | 2 | 7 | 14 | 30)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32] cursor-pointer shadow-2xs ml-1"
          >
            <option value={1}>1 Day (Daily)</option>
            <option value={2}>2 Days</option>
            <option value={7}>7 Days (1 Week)</option>
            <option value={14}>14 Days (2 Weeks)</option>
            <option value={30}>30 Days (1 Month)</option>
          </select>
        </div>

        {/* Right: Filters & Subtle Legend */}
        <div className="flex items-center gap-2.5">
          {/* Subtle Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B3D32]" />
              In-House
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Arriving
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              Reserved
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search room or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 lg:w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 pl-8 pr-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
            />
          </div>

          {/* Room Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 px-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 px-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Floors</option>
            {distinctFloors.map((fl) => (
              <option key={fl} value={fl}>Floor {fl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clean Matrix Timeline Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className={containerMinWidth}
            style={{
              display: 'grid',
              gridTemplateColumns: `170px repeat(${daysCount}, ${colMinWidth})`,
            }}
          >
            {/* Top-Left Corner Header */}
            <div className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/80 border-b border-r border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Room
              </span>
              <span className="text-[10px] text-slate-400">Rate</span>
            </div>

            {/* Date Headers */}
            {timelineDates.map((col) => (
              <div
                key={col.dateStr}
                className={cn(
                  'border-b border-r border-slate-200 dark:border-slate-800 py-1.5 px-1 text-center transition-colors',
                  col.isToday
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                    : col.isWeekend
                    ? 'bg-slate-50/60 dark:bg-slate-800/30'
                    : 'bg-white dark:bg-slate-900'
                )}
              >
                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                  {col.dayName}
                </div>
                <div
                  className={cn(
                    'text-xs font-bold my-0.5 inline-flex items-center justify-center',
                    col.isToday
                      ? 'w-5 h-5 rounded-full bg-[#0B3D32] text-white text-[11px]'
                      : 'text-slate-800 dark:text-slate-200'
                  )}
                >
                  {col.dayNum}
                </div>
              </div>
            ))}

            {/* Room Rows & Booking Bars */}
            {filteredRooms.map((room) => {
              const roomBookings = bookings.filter((b) => {
                if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
                if (b.room.number !== room.number) return false;
                return b.checkIn <= rangeEndStr && b.checkOut > rangeStartStr;
              });

              return (
                <React.Fragment key={room.id}>
                  {/* Sticky Room Label */}
                  <div className="sticky left-0 z-10 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {room.number}
                        </span>
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            room.cleaningStatus === 'CLEAN'
                              ? 'bg-emerald-500'
                              : room.cleaningStatus === 'IN_CLEANING'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          )}
                          title={`Cleaning: ${room.cleaningStatus}`}
                        />
                        <span className="text-[10px] text-slate-400">
                          {room.floor}F
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block leading-tight">
                        {room.type}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        ₹{room.pricePerNight.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Booking Grid Cells & Bars Container */}
                  <div
                    className="relative border-b border-slate-200 dark:border-slate-800"
                    style={{
                      gridColumn: `span ${daysCount}`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${daysCount}, ${colMinWidth})`,
                    }}
                  >
                    {/* Background Grid Cells */}
                    {timelineDates.map((col) => (
                      <div
                        key={col.dateStr}
                        onClick={() => onOpenNewBookingModal(room.number, col.dateStr)}
                        className={cn(
                          'h-11 border-r border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer group/cell relative flex items-center justify-center',
                          col.isToday
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            : col.isWeekend
                            ? 'bg-slate-50/40 dark:bg-slate-800/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        )}
                        title={`Click to book Room ${room.number}`}
                      >
                        <div className="opacity-0 group-hover/cell:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    ))}

                    {/* Booking Bars */}
                    {roomBookings.map((b) => {
                      const startIndex = timelineDates.findIndex((d) => d.dateStr === b.checkIn);
                      const endIndex = timelineDates.findIndex((d) => d.dateStr === b.checkOut);

                      const actualStart = startIndex === -1 ? 0 : startIndex;
                      const actualEnd = endIndex === -1 ? daysCount : endIndex;
                      const span = Math.max(1, actualEnd - actualStart);

                      const isStartClipped = b.checkIn < rangeStartStr;
                      const isEndClipped = b.checkOut > rangeEndStr;
                      const isArrivingToday = b.checkIn === todayStr && b.status === 'RESERVED';

                      let barBg = 'bg-[#0B3D32] text-white';
                      if (isArrivingToday) {
                        barBg = 'bg-amber-600 text-white';
                      } else if (b.status === 'RESERVED') {
                        barBg = 'bg-slate-700 text-white';
                      } else if (b.status === 'CHECKED_OUT') {
                        barBg = 'bg-slate-400 text-white';
                      }

                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(b);
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBooking({
                              booking: b,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredBooking(null)}
                          className={cn(
                            'absolute top-1.5 bottom-1.5 rounded-md z-10 px-2 flex items-center justify-between shadow-2xs transition-transform hover:scale-[1.01] cursor-pointer',
                            barBg,
                            isStartClipped && 'rounded-l-none',
                            isEndClipped && 'rounded-r-none'
                          )}
                          style={{
                            left: `${(actualStart / daysCount) * 100}%`,
                            width: `calc(${(span / daysCount) * 100}% - 2px)`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            <span className="text-xs font-semibold truncate">
                              {b.guest.firstName} {b.guest.lastName}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 shrink-0 font-medium hidden sm:inline">
                            {b.nights}n
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}

            {/* Clean Occupancy Summary Row */}
            <div className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/90 border-t border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Occupancy
              </span>
            </div>

            {dailyOccupancy.map((metric) => (
              <div
                key={metric.dateStr}
                className={cn(
                  'border-t border-r border-slate-200 dark:border-slate-800 py-1 text-center flex items-center justify-center',
                  metric.dateStr === todayStr
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'bg-slate-50/40 dark:bg-slate-800/40'
                )}
              >
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {metric.occupancyRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clean Floating Popover Card */}
      {hoveredBooking && (
        <div
          className="fixed z-50 pointer-events-auto transition-all animate-in fade-in duration-100"
          style={{
            left: `${Math.min(window.innerWidth - 300, Math.max(16, hoveredBooking.x - 130))}px`,
            top: `${hoveredBooking.y - 8}px`,
            transform: 'translateY(-100%)',
          }}
          onMouseEnter={() => setHoveredBooking(hoveredBooking)}
          onMouseLeave={() => setHoveredBooking(null)}
        >
          <div className="w-68 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {hoveredBooking.booking.guest.firstName} {hoveredBooking.booking.guest.lastName}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {hoveredBooking.booking.status.replace('_', ' ')}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
              <div>Room {hoveredBooking.booking.room.number} · {hoveredBooking.booking.room.type}</div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{hoveredBooking.booking.checkIn} → {hoveredBooking.booking.checkOut} ({hoveredBooking.booking.nights}n)</span>
              </div>
            </div>

            {(() => {
              const fin = getBookingFinancials(hoveredBooking.booking);
              return (
                <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
                  <span className="text-slate-500">Balance:</span>
                  <span className={cn('font-bold', fin.balanceDue > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600')}>
                    ₹{fin.balanceDue.toLocaleString()}
                  </span>
                </div>
              );
            })()}

            <div className="flex items-center gap-1.5 pt-1">
              {hoveredBooking.booking.status === 'RESERVED' && (
                <button
                  type="button"
                  onClick={() => {
                    const b = hoveredBooking.booking;
                    setHoveredBooking(null);
                    onOpenCheckInModal(b);
                  }}
                  className="flex-1 py-1 rounded bg-[#0B3D32] hover:bg-[#072B23] text-white text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Check In</span>
                </button>
              )}

              {hoveredBooking.booking.status === 'CHECKED_IN' && (
                <button
                  type="button"
                  onClick={() => {
                    const b = hoveredBooking.booking;
                    setHoveredBooking(null);
                    onOpenCheckOutModal(b);
                  }}
                  className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const b = hoveredBooking.booking;
                  setHoveredBooking(null);
                  onSelectBooking(b);
                }}
                className="py-1 px-2.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                Folio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

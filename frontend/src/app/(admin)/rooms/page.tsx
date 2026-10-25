'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BedDouble,
  Search,
  Plus,
  X,
  Filter,
  Calendar,
  Sparkles,
  Check,
  Wrench,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getRelativeDate,
  getRoomOccupancyInfo,
  isRoomAvailableForDates,
  AVAILABLE_ROOMS_CATALOG,
} from '@/app/(admin)/reservations/reservationsData';
import { GuidedBookingModal } from '@/components/business/GuidedBookingModal';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';

export type CleaningStatus = 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
export type OperationalStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface RoomRecord {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType: string;
  acType: 'AC' | 'Non-AC';
  pricePerNight: number;
  capacity: number;
  operationalStatus: OperationalStatus;
  cleaningStatus: CleaningStatus;
  maintenanceReason?: string;
}

const INITIAL_ROOMS: RoomRecord[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'DIRTY' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'AC Servicing & Plumbing' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 3, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Painting & Touchup' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Electrical Inspection' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', acType: 'AC', pricePerNight: 9500, capacity: 4, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', acType: 'AC', pricePerNight: 18500, capacity: 6, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
];

export default function RoomsPage() {
  const router = useRouter();
  const toast = useToast();

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_rooms_setup_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) { }
    }
    return INITIAL_ROOMS;
  });

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Date selectors for availability calculation
  const [targetCheckIn, setTargetCheckIn] = useState<string>(todayStr);
  const [targetCheckOut, setTargetCheckOut] = useState<string>(tomorrowStr);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [guidedModalOpen, setGuidedModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomRecord | null>(null);

  // New room form state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState('1');
  const [newType, setNewType] = useState('Deluxe Suite');
  const [newBedType, setNewBedType] = useState('King Bed');
  const [newPrice, setNewPrice] = useState('3500');

  // Save rooms to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_rooms_setup_v2', JSON.stringify(rooms));
    }
  }, [rooms]);

  // Sync bookings
  useEffect(() => {
    const handleStorageChange = () => {
      setBookings(loadBookingsFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Floor options
  const floorOptions = useMemo(() => {
    const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
    return floors;
  }, [rooms]);

  // Room type options
  const roomTypeOptions = useMemo(() => {
    const types = Array.from(new Set(rooms.map((r) => r.type))).sort();
    return types;
  }, [rooms]);

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Status Filter (Available, Occupied, Dirty, Maintenance)
      if (statusFilter === 'AVAILABLE') {
        const isFreeForDates = isRoomAvailableForDates(room.number, targetCheckIn, targetCheckOut, bookings);
        if (!isFreeForDates || room.operationalStatus === 'MAINTENANCE') return false;
      } else if (statusFilter === 'OCCUPIED') {
        const occInfo = getRoomOccupancyInfo(room.number, bookings, todayStr);
        if (!occInfo.currentOccupant && room.operationalStatus !== 'OCCUPIED') return false;
      } else if (statusFilter === 'DIRTY') {
        if (room.cleaningStatus !== 'DIRTY') return false;
      } else if (statusFilter === 'MAINTENANCE') {
        if (room.operationalStatus !== 'MAINTENANCE') return false;
      }

      // 2. Floor Filter
      if (floorFilter !== 'ALL' && room.floor !== parseInt(floorFilter, 10)) {
        return false;
      }

      // 3. Room Type Filter
      if (typeFilter !== 'ALL' && room.type !== typeFilter) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = room.number.toLowerCase().includes(q);
        const matchesType = room.type.toLowerCase().includes(q);
        const matchesBed = room.bedType.toLowerCase().includes(q);
        if (!matchesNumber && !matchesType && !matchesBed) return false;
      }

      return true;
    });
  }, [rooms, statusFilter, floorFilter, typeFilter, searchQuery, targetCheckIn, targetCheckOut, bookings, todayStr]);

  // Counts for status bar
  const counts = useMemo(() => {
    let availableCount = 0;
    let occupiedCount = 0;
    let dirtyCount = 0;
    let maintenanceCount = 0;

    rooms.forEach((r) => {
      const isFree = isRoomAvailableForDates(r.number, targetCheckIn, targetCheckOut, bookings);
      const occInfo = getRoomOccupancyInfo(r.number, bookings, todayStr);

      if (r.operationalStatus === 'MAINTENANCE') {
        maintenanceCount++;
      } else if (occInfo.currentOccupant || r.operationalStatus === 'OCCUPIED') {
        occupiedCount++;
      } else if (isFree) {
        availableCount++;
      }

      if (r.cleaningStatus === 'DIRTY') {
        dirtyCount++;
      }
    });

    return {
      all: rooms.length,
      available: availableCount,
      occupied: occupiedCount,
      dirty: dirtyCount,
      maintenance: maintenanceCount,
    };
  }, [rooms, targetCheckIn, targetCheckOut, bookings, todayStr]);

  // Toggle Cleaning Status
  const handleToggleCleaningStatus = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const nextCleaning: CleaningStatus =
          r.cleaningStatus === 'CLEAN' ? 'DIRTY' : r.cleaningStatus === 'DIRTY' ? 'IN_CLEANING' : 'CLEAN';

        toast.info(
          `Room ${r.number} Housekeeping`,
          `Cleaning status updated to ${nextCleaning.replace('_', ' ')}.`
        );
        return { ...r, cleaningStatus: nextCleaning };
      })
    );
  };

  // Navigate directly to unified booking & check-in page for a specific room
  const handleStartBookingForRoom = (room: RoomRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/booking?roomId=${room.id}&checkIn=${targetCheckIn}&checkOut=${targetCheckOut}&mode=reserve&from=desk`);
  };

  // Add room submit
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const newRoom: RoomRecord = {
      id: `rm-${Date.now()}`,
      number: newRoomNumber.trim(),
      floor: parseInt(newFloor, 10) || 1,
      type: newType.trim(),
      bedType: newBedType,
      acType: 'AC',
      pricePerNight: parseFloat(newPrice) || 3500,
      capacity: 2,
      operationalStatus: 'AVAILABLE',
      cleaningStatus: 'CLEAN',
    };

    setRooms((prev) => [...prev, newRoom]);
    toast.celebrate('Room Added', `Room ${newRoom.number} is now active.`);
    setNewRoomNumber('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12 select-none max-w-7xl mx-auto">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="room-setup" />

      {/* -----------------------------------------------------------------------
          TOP HEADER: Title & Quick Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#24352F] dark:text-white tracking-tight">
            Room Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time room availability, separate cleaning status, and occupancy tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Room</span>
        </button>
      </div>

      {/* -----------------------------------------------------------------------
          DATE AVAILABILITY SELECTOR BAR
          Calculates availability for requested dates rather than just current snapshot
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-[4px] bg-[#EEF4F1] dark:bg-[#06241C] border border-[#C5DED3] dark:border-[#145447]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-[#0B3D32] dark:text-emerald-300 block">
              Live Date Availability Filter
            </span>
            <span className="text-[11px] text-slate-600 dark:text-[#A4B8AE]">
              Rooms show &ldquo;Book Now&rdquo; only if free for these specific dates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#071F1A] px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Check-In:</span>
            <input
              type="date"
              value={targetCheckIn}
              onChange={(e) => setTargetCheckIn(e.target.value)}
              className="text-xs font-mono font-bold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#071F1A] px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Check-Out:</span>
            <input
              type="date"
              value={targetCheckOut}
              onChange={(e) => setTargetCheckOut(e.target.value)}
              className="text-xs font-mono font-bold text-[#24352F] dark:text-white bg-transparent outline-none cursor-pointer"
            />
          </div>

          {(targetCheckIn !== todayStr || targetCheckOut !== tomorrowStr) && (
            <button
              type="button"
              onClick={() => {
                setTargetCheckIn(todayStr);
                setTargetCheckOut(tomorrowStr);
              }}
              className="text-xs text-[#0B3D32] dark:text-emerald-300 underline font-medium hover:opacity-80 cursor-pointer"
            >
              Reset to Today
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          FILTER STRIP: Status Pills + Floor Filter + Room Type Filter + Search
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#071F1A] p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All', count: counts.all },
            { id: 'AVAILABLE', label: 'Available', count: counts.available },
            { id: 'OCCUPIED', label: 'Occupied', count: counts.occupied },
            { id: 'DIRTY', label: 'Dirty', count: counts.dirty },
            { id: 'MAINTENANCE', label: 'Maintenance', count: counts.maintenance },
          ].map((pill) => {
            const isSelected = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id as any)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#FAFBF9] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'rounded-[2px] px-1.5 py-0.2 text-[10px] font-mono',
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

        {/* Secondary Filters: Floor, Room Type & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Floor Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] dark:border-[#145447] px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white"
            >
              <option value="ALL">All Floors</option>
              {floorOptions.map((f) => (
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] dark:border-[#145447] px-2 py-1 text-xs font-semibold text-[#24352F] dark:text-white max-w-[130px] truncate"
            >
              <option value="ALL">All Types</option>
              {roomTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-44 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room..."
              className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          ROOM CARDS GRID
          Features:
          - Shows Current Occupant and Future Booking SEPARATELY (No contradictory states!)
          - Clear Operational Status (Available, Occupied, Maintenance)
          - Separate Cleaning Status (Clean, Dirty, In Cleaning)
          - "Book Now" only appears if room is available for the selected dates
          ----------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredRooms.map((room) => {
          // Check availability for selected dates
          const isAvailableForSelectedDates =
            isRoomAvailableForDates(room.number, targetCheckIn, targetCheckOut, bookings) &&
            room.operationalStatus !== 'MAINTENANCE';

          // Get Current Occupant vs Next Booking
          const occInfo = getRoomOccupancyInfo(room.number, bookings, todayStr);
          const currentOccupant = occInfo.currentOccupant;
          const nextBooking = occInfo.nextBooking;

          const isCurrentlyInHouse = !!currentOccupant || room.operationalStatus === 'OCCUPIED';
          const isUnderMaintenance = room.operationalStatus === 'MAINTENANCE';

          // ONLY Occupied / In-House rooms are dark!
          const isDarkRoom = isCurrentlyInHouse;

          return (
            <div
              key={room.id}
              className={cn(
                'group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-[6px] border shadow-2xs transition-all duration-150 select-none min-h-[185px]',
                isCurrentlyInHouse
                  ? 'bg-[#0B3D32] border-[#082C24] text-white hover:bg-[#093027] dark:bg-[#06241D] dark:border-[#0E3B31] shadow-sm'
                  : isUnderMaintenance
                  ? 'bg-white dark:bg-[#07241E] border-slate-200 dark:border-slate-800 hover:border-slate-300 text-[#24352F] dark:text-white'
                  : 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32] dark:hover:border-emerald-500'
              )}
            >
              <div>
                {/* Top Row: Room Number & Cleaning Status Button */}
                <div
                  className={cn(
                    'flex items-start justify-between gap-1.5 pb-2 border-b',
                    isDarkRoom ? 'border-white/20' : 'border-[#F0F4F2] dark:border-[#103D33]'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'font-heading font-black text-2xl tracking-tight',
                          isDarkRoom ? 'text-white' : 'text-[#24352F] dark:text-white'
                        )}
                      >
                        {room.number}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                          isDarkRoom ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#093027] text-slate-600 dark:text-slate-300'
                        )}
                      >
                        Floor {room.floor}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'text-[11px] font-bold truncate',
                        isDarkRoom ? 'text-white/90' : 'text-[#0B3D32] dark:text-emerald-300'
                      )}
                    >
                      {room.type}
                    </div>
                  </div>

                  {/* Cleaning Status (Separate toggleable badge) */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleCleaningStatus(room.id, e)}
                    title={`Cleaning status: ${room.cleaningStatus}. Click to toggle.`}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border transition-colors cursor-pointer',
                      isDarkRoom
                        ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                        : room.cleaningStatus === 'CLEAN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : room.cleaningStatus === 'DIRTY'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isDarkRoom
                          ? 'bg-white'
                          : room.cleaningStatus === 'CLEAN'
                          ? 'bg-emerald-500'
                          : room.cleaningStatus === 'DIRTY'
                          ? 'bg-amber-500'
                          : 'bg-sky-500 animate-pulse'
                      )}
                    />
                    <span>{room.cleaningStatus === 'IN_CLEANING' ? 'Cleaning' : room.cleaningStatus}</span>
                  </button>
                </div>

                {/* Middle Info: Operational Status, Bed Info & Non-Contradictory Occupant Display */}
                <div className="py-2.5 space-y-2 text-xs">
                  {/* Bed & Feature specs */}
                  <div
                    className={cn(
                      'text-[11px]',
                      isDarkRoom ? 'text-white/80' : 'text-[#64736C] dark:text-[#A4B8AE]'
                    )}
                  >
                    {room.bedType} · {room.acType} · Up to {room.capacity} guests
                  </div>

                  {/* Operational / Stay Status Breakdown */}
                  {isUnderMaintenance ? (
                    <div className="p-2 rounded-[3px] bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-slate-700 dark:text-slate-200">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        <span>Under Maintenance</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {room.maintenanceReason || 'Servicing in progress'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Current In-House Occupant (if any) */}
                      {currentOccupant ? (
                        <div
                          className={cn(
                            'p-2 rounded-[3px] border',
                            isDarkRoom
                              ? 'bg-white/15 border-white/25 text-white'
                              : 'bg-[#FFF5F6] dark:bg-[#320810] border-[#FAD2D8] dark:border-rose-900/60'
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={cn(
                                'font-bold uppercase tracking-wider flex items-center gap-1',
                                isDarkRoom ? 'text-white' : 'text-rose-700 dark:text-rose-300'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  isDarkRoom ? 'bg-white' : 'bg-rose-500 animate-pulse'
                                )}
                              />
                              Current Occupant
                            </span>
                            <span className={cn(isDarkRoom ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>
                              Depart: {new Date(currentOccupant.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'font-bold text-xs mt-0.5 truncate',
                              isDarkRoom ? 'text-white' : 'text-[#24352F] dark:text-white'
                            )}
                          >
                            {currentOccupant.guest.firstName} {currentOccupant.guest.lastName}
                          </div>
                          <div
                            className={cn(
                              'text-[10px] font-mono',
                              isDarkRoom ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {currentOccupant.bookingCode} · {currentOccupant.guest.phone}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Currently Vacant (Today)</span>
                        </div>
                      )}

                      {/* Future Upcoming Booking (Separately shown!) */}
                      {nextBooking && (
                        <div
                          className={cn(
                            'p-1.5 rounded-[3px] border text-[10px]',
                            isDarkRoom
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center justify-between font-semibold',
                              isDarkRoom ? 'text-white' : 'text-amber-800 dark:text-amber-300'
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Next: {nextBooking.guest.firstName} {nextBooking.guest.lastName}
                            </span>
                            <span>
                              {new Date(nextBooking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Price on Left, High-Contrast Action Box on Right */}
              <div
                className={cn(
                  'pt-2.5 mt-2 border-t flex items-center justify-between',
                  isDarkRoom ? 'border-white/20' : 'border-[#F0F4F2] dark:border-[#103D33]'
                )}
              >
                <div>
                  <span
                    className={cn(
                      'text-[10px] block font-medium',
                      isDarkRoom ? 'text-white/70' : 'text-slate-400'
                    )}
                  >
                    Rate
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span
                      className={cn(
                        'font-mono font-bold text-sm',
                        isDarkRoom ? 'text-white' : 'text-[#24352F] dark:text-white'
                      )}
                    >
                      Rs. {room.pricePerNight.toLocaleString()}
                    </span>
                    <span
                      className={cn(
                        'text-[10px]',
                        isDarkRoom ? 'text-white/70' : 'text-[#64736C] dark:text-slate-400'
                      )}
                    >
                      /nt
                    </span>
                  </div>
                </div>

                {/* Show "Book Now" ONLY when selected dates are available */}
                {isAvailableForSelectedDates ? (
                  <button
                    type="button"
                    onClick={(e) => handleStartBookingForRoom(room, e)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : isCurrentlyInHouse ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-bold bg-white text-[#0B3D32] shadow-2xs">
                    In House
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-[2px] text-[10px] font-bold',
                      isDarkRoom
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {isUnderMaintenance ? 'Under Service' : 'Booked on Dates'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="rounded-[3px] border border-[#DCE3DF] bg-white p-12 text-center shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
          <BedDouble className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#24352F] dark:text-white">No rooms found</h3>
          <p className="text-xs text-[#64736C] dark:text-[#A4B8AE] mt-1">
            Try adjusting your search query, floor, or date filter.
          </p>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          ADD ROOM MODAL
          ----------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Add New Room
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  Configure room number, floor, category, and nightly rate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  ROOM NUMBER *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 206"
                  autoFocus
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    FLOOR *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    PRICE / NIGHT (Rs.) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    ROOM TYPE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe Suite"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    BED TYPE *
                  </label>
                  <select
                    value={newBedType}
                    onChange={(e) => setNewBedType(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="King Bed">King Bed</option>
                    <option value="Queen Bed">Queen Bed</option>
                    <option value="2 Queen Beds">2 Queen Beds</option>
                    <option value="Super King Bed">Super King Bed</option>
                    <option value="Twin Beds">Twin Beds</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          GUIDED BOOKING MODAL (Step 1-4 Flow with Pre-selected Room & Dates)
          ----------------------------------------------------------------------- */}
      {guidedModalOpen && (
        <GuidedBookingModal
          isOpen={guidedModalOpen}
          initialRoomId={selectedRoomForBooking?.id}
          initialCheckIn={targetCheckIn}
          initialCheckOut={targetCheckOut}
          onClose={() => {
            setGuidedModalOpen(false);
            setSelectedRoomForBooking(null);
          }}
          onSuccess={(_newBooking, _isCheckedIn) => {
            setBookings(loadBookingsFromStorage());
            setGuidedModalOpen(false);
            setSelectedRoomForBooking(null);
          }}
        />
      )}
    </div>
  );
}

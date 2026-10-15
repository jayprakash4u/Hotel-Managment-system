'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BedDouble, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface RoomItem {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType?: string;
  pricePerNight: number;
  capacity?: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';
  guestName?: string;
  guestPhone?: string;
}

const DEFAULT_ROOMS: RoomItem[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 350, capacity: 2, status: 'OCCUPIED', guestName: 'Alexander Hayes', guestPhone: '+1 555-0192' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 350, capacity: 2, status: 'AVAILABLE' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', pricePerNight: 240, capacity: 4, status: 'DIRTY' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', pricePerNight: 240, capacity: 4, status: 'AVAILABLE' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', pricePerNight: 350, capacity: 2, status: 'MAINTENANCE' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 490, capacity: 2, status: 'OCCUPIED', guestName: 'Sophia Loren', guestPhone: '+1 555-0144' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 490, capacity: 2, status: 'OCCUPIED', guestName: 'David Miller', guestPhone: '+1 555-0188' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 490, capacity: 2, status: 'AVAILABLE' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 490, capacity: 2, status: 'AVAILABLE' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', pricePerNight: 490, capacity: 3, status: 'MAINTENANCE' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 620, capacity: 2, status: 'OCCUPIED', guestName: 'Elena Rostova', guestPhone: '+1 555-0163' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 620, capacity: 2, status: 'AVAILABLE' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', pricePerNight: 620, capacity: 2, status: 'MAINTENANCE' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', pricePerNight: 950, capacity: 4, status: 'OCCUPIED', guestName: 'Marcus Sterling', guestPhone: '+1 555-0129' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', pricePerNight: 1850, capacity: 6, status: 'OCCUPIED', guestName: 'Lady Genevieve', guestPhone: '+1 555-0111' },
];

const STATUS_CONFIG: Record<
  RoomItem['status'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-[#FFF5F6] dark:bg-[#320810]',
    text: 'text-[#A51F36] dark:text-rose-200',
    border: 'border-[#FAD2D8] dark:border-rose-800',
    dot: 'bg-[#A51F36]',
  },
  DIRTY: {
    label: 'Dirty',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
};

export default function RoomsPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState<RoomItem[]>(DEFAULT_ROOMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quick Book modal state (name & mobile number only)
  const [bookingRoom, setBookingRoom] = useState<RoomItem | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // New room form state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState('1');
  const [newType, setNewType] = useState('Deluxe Suite');
  const [newBedType, setNewBedType] = useState('King Bed');
  const [newPrice, setNewPrice] = useState('300');

  // Load from API or Hotel Setup localStorage
  useEffect(() => {
    // Check if custom rooms have been configured in Hotel Setup
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_rooms_setup');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRooms(
              parsed.map((r: any) => {
                let fl = 1;
                if (typeof r.floorLevel === 'string') {
                  const num = parseInt(r.floorLevel.replace(/\D/g, ''), 10);
                  if (!isNaN(num)) fl = num;
                  else if (r.floorLevel.toLowerCase().includes('ground')) fl = 0;
                } else if (typeof r.floor === 'number') {
                  fl = r.floor;
                }
                return {
                  id: r.id,
                  number: r.roomNumber || r.code || r.number || '101',
                  floor: fl,
                  type: r.roomType || r.type || 'Standard Room',
                  bedType: r.bedType || 'King Bed',
                  pricePerNight: r.basePrice || r.pricePerNight || 250,
                  capacity: r.capacity || 2,
                  status: (r.status as RoomItem['status']) || 'AVAILABLE',
                  guestName: r.guestName,
                  guestPhone: r.guestPhone,
                };
              })
            );
            return;
          }
        }
      } catch (e) {}
    }

    async function fetchRooms() {
      try {
        const res = await api.getRooms();
        if (res && res.length > 0) {
          setRooms(
            res.map((r: any) => ({
              id: r.id,
              number: r.number,
              floor: r.floor || 1,
              type: r.type || 'Standard Room',
              bedType: r.bedType || 'King Bed',
              pricePerNight: r.pricePerNight || 250,
              capacity: r.capacity || 2,
              status: (r.status as RoomItem['status']) || 'AVAILABLE',
            }))
          );
        }
      } catch (err) {
        // Fallback to default clean rooms list
      }
    }
    fetchRooms();
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;
      const matchesSearch =
        !searchQuery.trim() ||
        room.number.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesStatus && matchesSearch;
    });
  }, [rooms, selectedStatus, searchQuery]);

  // Status counts
  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const dirtyCount = rooms.filter((r) => r.status === 'DIRTY').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'MAINTENANCE').length;

  // Toggle status cycle on card click (for non-available rooms)
  const handleToggleRoomStatus = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const nextStatus: RoomItem['status'] =
          r.status === 'AVAILABLE'
            ? 'OCCUPIED'
            : r.status === 'OCCUPIED'
            ? 'DIRTY'
            : r.status === 'DIRTY'
            ? 'AVAILABLE'
            : 'AVAILABLE';

        if (r.status === 'AVAILABLE') {
          toast.celebrate(`Room ${r.number} Booked!`, `Room ${r.number} is now marked as Occupied.`);
        } else {
          toast.info(`Room ${r.number} Updated`, `Status changed to ${STATUS_CONFIG[nextStatus].label}.`);
        }
        return { ...r, status: nextStatus };
      })
    );
  };

  // Open quick booking form for an available room
  const handleOpenBookingModal = (room: RoomItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookingRoom(room);
    setGuestName('');
    setGuestPhone('');
  };

  // Submit quick booking form (Name & Mobile Number only)
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom || !guestName.trim() || !guestPhone.trim()) return;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === bookingRoom.id
          ? {
              ...r,
              status: 'OCCUPIED',
              guestName: guestName.trim(),
              guestPhone: guestPhone.trim(),
            }
          : r
      )
    );

    toast.celebrate(
      `Room ${bookingRoom.number} Booked!`,
      `Reserved for ${guestName.trim()} (${guestPhone.trim()}).`
    );

    setBookingRoom(null);
    setGuestName('');
    setGuestPhone('');
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const newRoom: RoomItem = {
      id: `rm-${Date.now()}`,
      number: newRoomNumber.trim(),
      floor: parseInt(newFloor, 10) || 1,
      type: newType.trim(),
      bedType: newBedType,
      pricePerNight: parseFloat(newPrice) || 250,
      status: 'AVAILABLE',
    };

    setRooms((prev) => [...prev, newRoom]);
    toast.celebrate('Room Added', `Room ${newRoom.number} is now active.`);
    setNewRoomNumber('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#24352F] dark:text-white tracking-tight">
            Rooms
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Room</span>
        </button>
      </div>

      {/* Filter Strip: Status Pills + Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All', count: rooms.length },
            { id: 'AVAILABLE', label: 'Available', count: availableCount },
            { id: 'OCCUPIED', label: 'Occupied', count: occupiedCount },
            { id: 'DIRTY', label: 'Dirty', count: dirtyCount },
            { id: 'MAINTENANCE', label: 'Maintenance', count: maintenanceCount },
          ].map((pill) => {
            const isSelected = selectedStatus === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedStatus(pill.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 py-1 text-xs font-bold transition-all shrink-0',
                  isSelected
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-[#FAFBF9] dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'rounded-[2px] px-1.5 py-0.2 text-[10px] font-mono',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#0E362C] text-[#64736C] dark:text-emerald-300'
                  )}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room number..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clean Room Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'OCCUPIED';
          const isAvailable = room.status === 'AVAILABLE';
          const statusMeta = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE;

          return (
            <div
              key={room.id}
              onClick={() => (isAvailable ? handleOpenBookingModal(room) : handleToggleRoomStatus(room.id))}
              className={cn(
                'group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[3px] border shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer select-none',
                isOccupied
                  ? 'bg-[#A51F36] border-[#8E1B2F] text-white hover:bg-[#961B30] dark:bg-[#8E1B2F] dark:border-[#731526]'
                  : isAvailable
                  ? 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32] dark:hover:border-emerald-500'
                  : 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32] dark:hover:border-emerald-500'
              )}
              title={
                isAvailable
                  ? `Click to Book Room ${room.number}`
                  : isOccupied
                  ? `Room ${room.number} (Occupied by ${room.guestName || 'Guest'})`
                  : `Room ${room.number} (${statusMeta.label})`
              }
            >
              {/* Room Number & Stable Status Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    'font-heading font-black text-xl sm:text-2xl tracking-tight',
                    isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {room.number}
                </span>

                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                    isOccupied
                      ? 'bg-white/20 text-white border-white/30 backdrop-blur-xs'
                      : cn(statusMeta.bg, statusMeta.text, statusMeta.border)
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isOccupied ? 'bg-white' : statusMeta.dot
                    )}
                  />
                  <span>{statusMeta.label}</span>
                </span>
              </div>

              {/* Room Type & Details */}
              <div className="mb-3">
                <p
                  className={cn(
                    'text-xs font-bold truncate',
                    isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {room.type}
                </p>
                {isOccupied && room.guestName ? (
                  <p className="text-[10px] font-medium text-rose-100 truncate mt-0.5 flex items-center gap-1">
                    <span className="opacity-75">Guest:</span>
                    <strong className="font-bold text-white">{room.guestName}</strong>
                  </p>
                ) : (
                  <p className="text-[10px] font-medium text-[#64736C] dark:text-[#A4B8AE] mt-0.5">
                    Floor {room.floor}{room.bedType ? ` · ${room.bedType}` : ''}
                  </p>
                )}
              </div>

              {/* Card Footer: Price on Left, Clean Action on Right */}
              <div
                className={cn(
                  'flex items-center justify-between pt-2 border-t min-h-[30px]',
                  isOccupied
                    ? 'border-white/20 text-rose-100/90'
                    : 'border-[#E5EEE9] dark:border-[#145447]/60'
                )}
              >
                {/* Money / Price ALWAYS in its clean proper spot on the left */}
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={cn(
                      'font-mono font-bold text-sm tracking-tight',
                      isOccupied ? 'text-white' : 'text-[#24352F] dark:text-white'
                    )}
                  >
                    ${room.pricePerNight}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isOccupied ? 'text-rose-100/70' : 'text-[#64736C] dark:text-[#879B90]'
                    )}
                  >
                    /nt
                  </span>
                </div>

                {/* Right side: Clean "Book Now" Button (NO money on button) or Floor info */}
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={(e) => handleOpenBookingModal(room, e)}
                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all active:scale-95"
                  >
                    Book Now
                  </button>
                ) : (
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isOccupied ? 'text-rose-100/80' : 'text-[#64736C] dark:text-[#879B90]'
                    )}
                  >
                    Floor {room.floor}
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
            Try adjusting your search or status filter.
          </p>
        </div>
      )}

      {/* Add Room Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
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
                  Enter room number, floor, type and price
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                  placeholder="e.g. 106"
                  autoFocus
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
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
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    PRICE / NIGHT ($) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
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
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    BED TYPE *
                  </label>
                  <select
                    value={newBedType}
                    onChange={(e) => setNewBedType(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="King Bed">King Bed</option>
                    <option value="Queen Bed">Queen Bed</option>
                    <option value="2 Queen Beds">2 Queen Beds</option>
                    <option value="Super King Bed">Super King Bed</option>
                    <option value="Emperor Bed">Emperor Bed</option>
                    <option value="Single Bed">Single Bed</option>
                    <option value="Double Bed">Double Bed</option>
                    <option value="Twin Beds">Twin Beds</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5EEE9] dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          QUICK BOOKING FORM MODAL: NAME & MOBILE NUMBER ONLY
          Opens when user clicks "Book Now" on an available room
         ========================================================================= */}
      {bookingRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setBookingRoom(null)}
        >
          <div
            className="w-full max-w-sm rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Book Room {bookingRoom.number}
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  {bookingRoom.type} · ${bookingRoom.pricePerNight}/night
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingRoom(null)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Booking Form: ONLY 2 FIELDS: NAME & MOBILE NUMBER */}
            <form onSubmit={handleConfirmBooking}>
              <div className="p-5 space-y-3.5">
                {/* 1. Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>

                {/* 2. Mobile Number */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    MOBILE NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 555-0192 or 9876543210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!guestName.trim() || !guestPhone.trim()}
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Book Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

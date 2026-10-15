'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  Check,
  Receipt,
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  Calendar,
  Users,
  Search,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export interface BookingRoomItem {
  id: string;
  number: string;
  floor: number;
  type: string;
  category: string;
  bedType: string;
  pricePerNight: number;
  capacity: number;
  hasAC: boolean;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';
  amenities?: string[];
}

const DEFAULT_BOOKING_ROOMS: BookingRoomItem[] = [
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', category: 'Deluxe', bedType: 'King Bed', pricePerNight: 350, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Air Conditioning', 'Garden Terrace'] },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', category: 'Standard', bedType: '2 Queen Beds', pricePerNight: 240, capacity: 4, hasAC: false, status: 'AVAILABLE', amenities: ['Ceiling Fan', 'Double Queen'] },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', category: 'Executive', bedType: 'King Bed', pricePerNight: 490, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Ocean View', 'Balcony', 'Jacuzzi'] },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', category: 'Executive', bedType: 'King Bed', pricePerNight: 490, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Ocean View', 'Balcony'] },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', category: 'Club', bedType: 'Super King Bed', pricePerNight: 620, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Club Lounge Access', 'VIP Service'] },
  { id: 'rm-402', number: '402', floor: 4, type: 'Horizon Penthouse Suite', category: 'Penthouse', bedType: 'Emperor Bed', pricePerNight: 950, capacity: 4, hasAC: true, status: 'AVAILABLE', amenities: ['Panoramic View', 'Private Elevator'] },
  { id: 'rm-106', number: '106', floor: 1, type: 'Deluxe Garden Suite', category: 'Deluxe', bedType: 'King Bed', pricePerNight: 350, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Air Conditioning', 'Garden Terrace'] },
  { id: 'rm-206', number: '206', floor: 2, type: 'Executive Ocean Suite', category: 'Executive', bedType: 'King Bed', pricePerNight: 490, capacity: 2, hasAC: true, status: 'AVAILABLE', amenities: ['Ocean View', 'Jacuzzi'] },
];

const PAYMENT_METHODS: Array<{ id: 'CASH' | 'CARD' | 'ESEWA_KHALTI' | 'BANK_QR'; label: string; icon: React.ReactNode }> = [
  { id: 'CASH', label: 'Cash', icon: <Wallet className="w-3.5 h-3.5" /> },
  { id: 'CARD', label: 'Card / POS', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'BANK_QR', label: 'Bank / QR', icon: <Landmark className="w-3.5 h-3.5" /> },
  { id: 'ESEWA_KHALTI', label: 'Mobile Pay', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

function CheckInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [rooms, setRooms] = useState<BookingRoomItem[]>(DEFAULT_BOOKING_ROOMS);
  const [climateFilter, setClimateFilter] = useState<'ALL' | 'AC' | 'NON_AC' | 'SUITE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(searchParams.get('room') || 'rm-102');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [adults, setAdults] = useState<number>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('Citizenship');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [paymentChoice, setPaymentChoice] = useState<'PAY_LATER' | 'PAY_NOW'>('PAY_LATER');
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ESEWA_KHALTI' | 'BANK_QR'>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch from API with graceful fallback to DEFAULT_BOOKING_ROOMS
  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await api.getRooms();
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((r: any) => ({
            id: r.id,
            number: r.number,
            floor: r.floor || 1,
            type: r.type || 'Deluxe Suite',
            category: r.type?.toLowerCase().includes('suite') ? 'Suite' : 'Standard',
            bedType: r.bedType || 'King Bed',
            pricePerNight: r.pricePerNight || 350,
            capacity: r.capacity || 2,
            hasAC: r.hasAC !== undefined ? r.hasAC : (r.type?.toLowerCase().includes('(ac)') || true),
            status: (r.status === 'INSPECTED' ? 'AVAILABLE' : r.status) as BookingRoomItem['status'],
            amenities: r.amenities || [],
          }));
          setRooms(mapped);
        }
      } catch (err) {
        // Fallback to DEFAULT_BOOKING_ROOMS so available rooms are always present!
      }
    }
    loadRooms();
  }, []);

  // Filter available rooms only
  const availableRooms = useMemo(() => {
    return rooms.filter((r) => r.status === 'AVAILABLE');
  }, [rooms]);

  // Apply climate/category filter and search query
  const filteredRooms = useMemo(() => {
    return availableRooms.filter((r) => {
      if (climateFilter === 'AC' && !r.hasAC) return false;
      if (climateFilter === 'NON_AC' && r.hasAC) return false;
      if (climateFilter === 'SUITE' && !r.type.toLowerCase().includes('suite')) return false;
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.toLowerCase().trim();
        const matchesNumber = r.number.toLowerCase().includes(q);
        const matchesType = r.type.toLowerCase().includes(q);
        const matchesFloor = `floor ${r.floor}`.includes(q);
        if (!matchesNumber && !matchesType && !matchesFloor) return false;
      }
      return true;
    });
  }, [availableRooms, climateFilter, roomSearchQuery]);

  // Keep a valid selected room
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam && rooms.some((r) => r.id === roomParam)) {
      setSelectedRoomId(roomParam);
    } else if (availableRooms.length > 0 && !availableRooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(availableRooms[0].id);
    }
  }, [availableRooms, selectedRoomId, searchParams, rooms]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || availableRooms[0] || rooms[0];

  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  const roomTariffPerNight = selectedRoom?.pricePerNight || 0;
  const totalRoomRent = roomTariffPerNight * nights;

  const depositPaid = paymentChoice === 'PAY_NOW' ? Math.max(0, amountPaidNow) : 0;
  const isFullyPaid = depositPaid >= totalRoomRent && totalRoomRent > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom?.id) {
      toast.error('Room Selection Required', 'Please select an available room.');
      return;
    }
    if (!firstName.trim()) {
      toast.error('Guest Name Required', 'Please enter guest first name.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone Required', 'Please enter guest phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdRes: any = null;
      try {
        createdRes = await api.createReservation({
          firstName: firstName.trim(),
          lastName: lastName.trim() || 'Guest',
          phone: phone.trim(),
          email: email.trim() || `${phone.trim()}@guest.hotel`,
          idType,
          idNumber: idNumber.trim() || 'N/A',
          roomId: selectedRoom.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults,
          specialRequests,
          isWalkIn: true,
          initialPayment: depositPaid,
        });
      } catch (apiErr) {}

      // Synchronize with Room Bookings registry
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('hotel_room_bookings_list');
          const currentBookings = raw ? JSON.parse(raw) : [];
          const nextCode = `BK-${1000 + currentBookings.length + 1}`;
          const newEntry = {
            id: `bk-${Date.now()}`,
            bookingCode: createdRes?.bookingCode || nextCode,
            status: depositPaid > 0 ? 'CHECKED_IN' : 'RESERVED',
            guest: {
              id: `gst-${Date.now()}`,
              firstName: firstName.trim(),
              lastName: lastName.trim() || 'Guest',
              phone: phone.trim(),
              email: email.trim() || `${phone.trim()}@guest.hotel`,
              address: 'Kathmandu, Nepal',
              idType,
              idNumber: idNumber.trim() || 'N/A',
              country: 'Nepal',
              vipTier: 'STANDARD',
            },
            room: {
              id: selectedRoom.id,
              number: selectedRoom.number,
              type: selectedRoom.type,
              acType: selectedRoom.hasAC ? 'AC' : 'Non-AC',
              bedType: selectedRoom.bedType,
              floorLevel: `Floor ${selectedRoom.floor}`,
              pricePerNight: selectedRoom.pricePerNight,
            },
            checkIn: checkInDate,
            checkOut: checkOutDate,
            nights,
            roomCharges: totalRoomRent,
            cafeOrders: [],
            payments:
              depositPaid > 0
                ? [
                    {
                      id: `pay-${Date.now()}`,
                      receiptNo: `REC-${Date.now().toString().slice(-4)}`,
                      date: 'Today, Advance',
                      amount: depositPaid,
                      method: paymentMethod,
                      type: 'ADVANCE',
                      notes: 'Initial payment at booking',
                    },
                  ]
                : [],
            bookingHistory: [],
            notes: specialRequests || undefined,
          };
          localStorage.setItem('hotel_room_bookings_list', JSON.stringify([newEntry, ...currentBookings]));
        } catch (storageErr) {}
      }

      toast.celebrate(
        isFullyPaid ? 'Booking & Payment Completed!' : 'Booking Complete!',
        `Room ${selectedRoom?.number} assigned to ${firstName} ${lastName}.`
      );
      router.push('/reservations');
    } catch (err: any) {
      toast.error('Booking Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12 select-none">
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-[3px] text-slate-500 hover:text-slate-900 hover:bg-[#F2F4F2] border border-[#DCE3DF] dark:border-[#145447] dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#07241E] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#24352F] dark:text-white tracking-tight">
            Book Now
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] bg-white border border-[#DCE3DF] text-xs font-semibold text-[#24352F] dark:bg-[#07241E] dark:border-[#145447] dark:text-white shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>{availableRooms.length} Available Rooms</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Room Selection, Stay Dates, Guest Details (7-8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Card 1: Select Room (Clean, spacious, professional layout) */}
          <div className="rounded-[3px] border border-[#DCE3DF] bg-white p-4 sm:p-5 shadow-2xs dark:border-[#145447] dark:bg-[#071F1A] space-y-3.5">
            {/* Header: Title & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
                  <BedDouble className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                    Select Room
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-[#E8F2EE] dark:bg-[#0E362C] text-[#0B3D32] dark:text-emerald-300 text-[10px] font-bold">
                    {filteredRooms.length} available
                  </span>
                </div>
              </div>

              {/* Search, Filter & View Controls */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search Bar */}
                <div className="relative w-full sm:w-36">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879B90]" />
                  <input
                    type="text"
                    value={roomSearchQuery}
                    onChange={(e) => setRoomSearchQuery(e.target.value)}
                    placeholder="Search room #..."
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white"
                  />
                  {roomSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRoomSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-0.5 bg-[#FAFBF9] dark:bg-[#061B16] p-0.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] text-xs font-semibold shrink-0">
                  {[
                    { id: 'ALL' as const, label: 'All' },
                    { id: 'AC' as const, label: 'AC' },
                    { id: 'NON_AC' as const, label: 'Non-AC' },
                    { id: 'SUITE' as const, label: 'Suites' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClimateFilter(tab.id)}
                      className={cn(
                        'px-2 py-0.5 rounded-[2px] transition-colors text-xs font-medium',
                        climateFilter === tab.id
                          ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600 font-bold'
                          : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE] dark:hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Grid / List Switcher */}
                <div className="hidden sm:flex items-center bg-[#FAFBF9] dark:bg-[#061B16] p-0.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={cn(
                      'p-1 rounded-[2px] transition-colors',
                      viewMode === 'grid'
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                        : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE]'
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="Compact list view"
                    className={cn(
                      'p-1 rounded-[2px] transition-colors',
                      viewMode === 'list'
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                        : 'text-[#64736C] hover:text-[#24352F] dark:text-[#A4B8AE]'
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Room Display Area */}
            {filteredRooms.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#879B90] border border-dashed border-[#DCE3DF] rounded-[3px] dark:border-[#145447]">
                <BedDouble className="w-7 h-7 mx-auto mb-2 opacity-30 text-[#0B3D32]" />
                <p className="font-bold text-xs text-[#24352F] dark:text-white">No rooms match your filter</p>
                <button
                  type="button"
                  onClick={() => {
                    setClimateFilter('ALL');
                    setRoomSearchQuery('');
                  }}
                  className="mt-1.5 text-xs font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Clean 2-column Grid with generous breathing space */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto custom-scrollbar p-0.5">
                {filteredRooms.map((room) => {
                  const isSelected = room.id === selectedRoom?.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRoomId(room.id);
                        }
                      }}
                      className={cn(
                        'group relative flex flex-col justify-between p-3.5 rounded-[3px] border cursor-pointer transition-all duration-150 text-left shadow-2xs',
                        isSelected
                          ? 'border-[#0B3D32] bg-[#E8F2EE]/35 ring-1.5 ring-[#0B3D32] dark:border-emerald-500 dark:bg-[#0E362C]/50 dark:ring-emerald-500'
                          : 'border-[#DCE3DF] bg-white hover:border-[#0B3D32]/60 hover:bg-[#FAFBF9] dark:border-[#145447] dark:bg-[#07241E] dark:hover:border-emerald-500/70 dark:hover:bg-[#082a23]'
                      )}
                    >
                      {/* Top: Room Number & Selection Radio */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-base text-[#24352F] dark:text-white tracking-tight">
                            Room {room.number}
                          </span>
                          <span className="text-[10px] font-medium text-[#64736C] dark:text-[#A4B8AE]">
                            Floor {room.floor}
                          </span>
                        </div>

                        {/* Minimalist Radio Indicator */}
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-[#0B3D32] text-white dark:bg-emerald-500'
                              : 'border border-[#CBD5D0] dark:border-[#145447] group-hover:border-[#0B3D32]'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Room Type & Details */}
                      <div className="mb-2.5">
                        <p className="text-xs font-bold text-[#24352F] dark:text-white truncate">
                          {room.type}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                          <span>{room.bedType}</span>
                          <span>·</span>
                          <span>{room.capacity} Guests</span>
                          {room.hasAC ? (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-[#0B3D32] dark:text-emerald-300">AC</span>
                            </>
                          ) : (
                            <>
                              <span>·</span>
                              <span className="text-[#879B90]">Fan</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Nightly Rate & Action Status */}
                      <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447]/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#24352F] dark:text-white">
                            {formatCurrency(room.pricePerNight)}
                          </span>
                          <span className="text-[10px] text-[#879B90] ml-1">/ night</span>
                        </div>

                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-[2px] transition-colors',
                            isSelected
                              ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                              : 'text-[#64736C] group-hover:text-[#0B3D32] dark:text-[#A4B8AE] dark:group-hover:text-emerald-300'
                          )}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Ultra-clean Compact List View */
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar p-0.5">
                {filteredRooms.map((room) => {
                  const isSelected = room.id === selectedRoom?.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRoomId(room.id);
                        }
                      }}
                      className={cn(
                        'group flex items-center justify-between px-3.5 py-2.5 rounded-[3px] border cursor-pointer transition-all duration-150',
                        isSelected
                          ? 'border-[#0B3D32] bg-[#E8F2EE]/40 ring-1.5 ring-[#0B3D32] shadow-2xs dark:border-emerald-500 dark:bg-[#0E362C]/50 dark:ring-emerald-500'
                          : 'border-[#DCE3DF] bg-white hover:border-[#0B3D32]/60 hover:bg-[#FAFBF9] dark:border-[#145447] dark:bg-[#07241E] dark:hover:border-emerald-500/70'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        {/* Radio Indicator */}
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all',
                            isSelected
                              ? 'bg-[#0B3D32] text-white dark:bg-emerald-500'
                              : 'border border-[#CBD5D0] dark:border-[#145447] group-hover:border-[#0B3D32]'
                          )}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        {/* Room Number Badge */}
                        <div className="shrink-0 font-heading font-black text-xs text-[#24352F] dark:text-white px-2 py-0.5 rounded-[2px] bg-[#F2F4F2] dark:bg-[#092B23] border border-[#DCE3DF] dark:border-[#145447]">
                          Room {room.number}
                        </div>

                        {/* Room Type & Details */}
                        <div className="min-w-0 truncate">
                          <span className="text-xs font-bold text-[#24352F] dark:text-white truncate">
                            {room.type}
                          </span>
                          <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] flex items-center gap-1.5 truncate">
                            <span>Fl. {room.floor}</span>
                            <span>·</span>
                            <span>{room.bedType}</span>
                            <span>·</span>
                            <span>{room.capacity} Guests</span>
                            <span>·</span>
                            <span className={room.hasAC ? 'font-semibold text-[#0B3D32] dark:text-emerald-300' : 'text-[#879B90]'}>
                              {room.hasAC ? 'AC' : 'Fan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-[#0B3D32] dark:text-emerald-300">
                          {formatCurrency(room.pricePerNight)}
                          <span className="text-[10px] font-normal text-[#879B90]"> / nt</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Stay Dates & Guests */}
          <div className="rounded-[3px] border border-[#DCE3DF] bg-white p-4 shadow-2xs dark:border-[#145447] dark:bg-[#071F1A] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE3DF] dark:border-[#145447]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                  Stay Dates & Guests
                </h3>
              </div>

              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-[2px] bg-[#E8F2EE] text-[#0B3D32] dark:bg-[#0E362C] dark:text-emerald-300">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  CHECK-IN DATE
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  CHECK-OUT DATE
                </label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  GUESTS
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests (Couple)</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests (Family)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Guest Information */}
          <div className="rounded-[3px] border border-[#DCE3DF] bg-white p-4 shadow-2xs dark:border-[#145447] dark:bg-[#071F1A] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE3DF] dark:border-[#145447]">
              <Users className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                Guest Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  FIRST NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  LAST NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  PHONE NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  ID DOCUMENT TYPE
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                >
                  <option value="Citizenship">Citizenship</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="National ID">National ID</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                  ID / PASSPORT #
                </label>
                <input
                  type="text"
                  placeholder="e.g. P12345678"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                placeholder="e.g. guest@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Reservation Summary & Payment (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="sticky top-20 rounded-[3px] border border-[#DCE3DF] bg-white p-5 shadow-2xs dark:border-[#145447] dark:bg-[#071F1A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF] dark:border-[#145447]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                  Summary & Bill
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#E8F2EE] text-[#0B3D32] dark:bg-[#0E362C] dark:text-emerald-300">
                Walk-In
              </span>
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE]">
                <span>Room</span>
                <span className="font-semibold text-[#24352F] dark:text-white">
                  {selectedRoom ? `Room ${selectedRoom.number} (${selectedRoom.type})` : 'Select a room'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE]">
                <span>Stay Period</span>
                <span className="font-semibold text-[#24352F] dark:text-white">
                  {formatDate(checkInDate)} → {formatDate(checkOutDate)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE]">
                <span>Rate & Nights</span>
                <span className="font-mono text-[#24352F] dark:text-white">
                  {formatCurrency(roomTariffPerNight)} × {nights} {nights === 1 ? 'nt' : 'nts'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
                <span className="font-bold text-sm text-[#24352F] dark:text-white">Total Amount</span>
                <span className="font-heading font-black text-lg text-[#0B3D32] dark:text-emerald-400 font-mono">
                  {formatCurrency(totalRoomRent)}
                </span>
              </div>
            </div>

            {/* Payment Settlement Options */}
            <div className="pt-2 border-t border-[#DCE3DF] dark:border-[#145447] space-y-3">
              <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE]">
                PAYMENT OPTION
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice('PAY_LATER');
                    setAmountPaidNow(0);
                  }}
                  className={cn(
                    'p-2.5 rounded-[3px] border text-center transition-all',
                    paymentChoice === 'PAY_LATER'
                      ? 'border-[#0B3D32] bg-[#E8F2EE]/50 text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-500 dark:bg-[#0E362C] dark:text-emerald-300'
                      : 'border-[#DCE3DF] bg-white text-[#64736C] hover:border-[#879B90] dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]'
                  )}
                >
                  Pay Later
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice('PAY_NOW');
                    if (amountPaidNow === 0 && totalRoomRent > 0) {
                      setAmountPaidNow(totalRoomRent);
                    }
                  }}
                  className={cn(
                    'p-2.5 rounded-[3px] border text-center transition-all',
                    paymentChoice === 'PAY_NOW'
                      ? 'border-[#0B3D32] bg-[#E8F2EE]/50 text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-500 dark:bg-[#0E362C] dark:text-emerald-300'
                      : 'border-[#DCE3DF] bg-white text-[#64736C] hover:border-[#879B90] dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]'
                  )}
                >
                  Pay Now
                </button>
              </div>

              {paymentChoice === 'PAY_NOW' && (
                <div className="p-3 rounded-[3px] bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE]">
                        AMOUNT PAID ($)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAmountPaidNow(totalRoomRent)}
                        className="text-[11px] text-[#0B3D32] hover:underline font-bold dark:text-emerald-400"
                      >
                        Full ({formatCurrency(totalRoomRent)})
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={amountPaidNow || ''}
                      onChange={(e) => setAmountPaidNow(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-sm font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                      PAYMENT METHOD
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={cn(
                            'p-2 rounded-[2px] border flex items-center justify-center gap-1.5 transition-colors',
                            paymentMethod === method.id
                              ? 'border-[#0B3D32] bg-white text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-500 dark:bg-[#0E362C] dark:text-emerald-300'
                              : 'border-[#DCE3DF] bg-white text-[#64736C] hover:border-[#879B90] dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE]'
                          )}
                        >
                          {method.icon}
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedRoom?.id || !firstName.trim() || !phone.trim()}
                className="w-full py-2.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm & Book Room'}
              </button>

              <Link href="/" className="block">
                <button
                  type="button"
                  className="w-full py-2 rounded-[3px] border border-[#DCE3DF] bg-white hover:bg-[#FAFBF9] text-xs font-semibold text-[#64736C] dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading booking form...
        </div>
      }
    >
      <CheckInPageContent />
    </Suspense>
  );
}

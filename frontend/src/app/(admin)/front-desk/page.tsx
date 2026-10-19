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
  resetBookingsToInitial,
  getRelativeDate,
  getAvailableRoomsForDates,
} from '@/app/(admin)/reservations/reservationsData';
import { GuidedBookingModal } from '@/components/business/GuidedBookingModal';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs';

function FrontDeskContent() {
  const toast = useToast();
  const searchParams = useSearchParams();

  // Primary State: Bookings loaded from local storage
  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Active Main Tab: Arrivals, Currently Staying, Departures
  const [activeTab, setActiveTab] = useState<'arrivals' | 'staying' | 'departures'>('arrivals');
  const [viewMode, setViewMode] = useState<'chart' | 'dashboard'>('chart');
  const [searchQuery, setSearchQuery] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState<'TODAY' | 'ALL'>('TODAY');

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

  // Today's Date String: YYYY-MM-DD
  const todayDateStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowDateStr = useMemo(() => getRelativeDate(1), []);

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
  // 6. RESET DEMO DATA
  // ---------------------------------------------------------------------------
  const handleResetDemoData = () => {
    const initial = resetBookingsToInitial();
    setBookings([...initial]);
    toast.celebrate('Check-in Desk Reset!', "Ram Sharma is back in Today's Arrivals ready for check-in.");
    setActiveTab('arrivals');
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
          {/* View Mode Toggle: Timeline vs Lists */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
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
              <Layers className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Timeline Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Guest Lists</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemoData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Reset Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGuidedBookingWalkIn(true);
              setGuidedBookingInitialRoom(undefined);
              setGuidedBookingCheckIn(todayDateStr);
              setGuidedBookingCheckOut(tomorrowDateStr);
              setIsGuidedBookingOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-semibold bg-[#0B3D32] hover:bg-[#072B23] text-white"
          >
            + Walk-in Check-in
          </Button>
        </div>
      </div>

      {/* Conditionally render: Tape Chart Matrix OR Action Cards & Tabs */}
      {viewMode === 'chart' ? (
        <RoomTapeChart
          bookings={bookings}
          onSelectBooking={(booking) => handleOpenFolioDrawer(booking)}
          onOpenCheckInModal={(booking) => handleOpenCheckInModal(booking)}
          onOpenCheckOutModal={(booking) => handleOpenCheckOutModal(booking)}
          onOpenNewBookingModal={handleTapeChartNewBooking}
          onResetDemoData={handleResetDemoData}
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
                No pending arrivals remaining for today. You can reset the demo data anytime to test Ram Sharma's check-in again.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetDemoData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Reset Demo to Arrive Today
              </Button>
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

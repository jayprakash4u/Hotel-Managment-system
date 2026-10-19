'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  BedDouble,
  Check,
  ArrowRight,
  ArrowLeft,
  LogIn,
  BookmarkCheck,
  CreditCard,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getRelativeDate,
  getAvailableRoomsForDates,
  AvailableRoomOption,
  AVAILABLE_ROOMS_CATALOG,
  syncRoomStatuses,
} from '@/app/(admin)/reservations/reservationsData';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export interface GuidedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: RoomBooking, isCheckedIn: boolean) => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRoomId?: string;
  isWalkIn?: boolean;
}

export function GuidedBookingModal({
  isOpen,
  onClose,
  onSuccess,
  initialCheckIn,
  initialCheckOut,
  initialRoomId,
  isWalkIn = false,
}: GuidedBookingModalProps) {
  const toast = useToast();

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  // Guided Steps: 1 = Dates & Guests, 2 = Select Room, 3 = Guest Details, 4 = Review & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn || todayStr);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut || tomorrowStr);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('ALL');

  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || '');

  // Guest Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState('Citizenship');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('Kathmandu, Nepal');
  const [vipTier, setVipTier] = useState<'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM'>('STANDARD');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment
  const [depositAmount, setDepositAmount] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER'>('CASH');

  // Load existing bookings from storage to calculate dynamic availability
  const [existingBookings, setExistingBookings] = useState<RoomBooking[]>([]);

  useEffect(() => {
    if (isOpen) {
      setExistingBookings(loadBookingsFromStorage());
      setCurrentStep(initialRoomId ? 2 : 1);
      if (initialCheckIn) setCheckIn(initialCheckIn);
      if (initialCheckOut) setCheckOut(initialCheckOut);
      if (initialRoomId) setSelectedRoomId(initialRoomId);
    }
  }, [isOpen, initialCheckIn, initialCheckOut, initialRoomId]);

  // Ensure checkOut is strictly after checkIn
  const nights = useMemo(() => {
    try {
      const d1 = new Date(checkIn).getTime();
      const d2 = new Date(checkOut).getTime();
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [checkIn, checkOut]);

  // Dynamically calculate room availability for the requested dates
  const evaluatedRooms = useMemo(() => {
    const list = getAvailableRoomsForDates(checkIn, checkOut, existingBookings);
    if (roomTypeFilter === 'ALL') return list;
    return list.filter((r) => r.type.toLowerCase().includes(roomTypeFilter.toLowerCase()));
  }, [checkIn, checkOut, existingBookings, roomTypeFilter]);

  // Selected Room Object
  const selectedRoom = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.find((r) => r.id === selectedRoomId);
  }, [selectedRoomId]);

  // Tariff calculation
  const totalTariff = (selectedRoom?.pricePerNight || 3500) * nights;

  // When step 1 completes, auto-select first available room if none selected
  const handleProceedToRooms = () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      toast.error('Invalid Dates', 'Check-out date must be after check-in date.');
      return;
    }
    const avail = evaluatedRooms.filter((r) => r.isAvailableForDates);
    if (avail.length > 0 && (!selectedRoomId || !avail.some((r) => r.id === selectedRoomId))) {
      setSelectedRoomId(avail[0].id);
    }
    setCurrentStep(2);
  };

  const handleProceedToGuest = () => {
    if (!selectedRoomId) {
      toast.error('Room Selection Required', 'Please choose an available room for your stay.');
      return;
    }
    setCurrentStep(3);
  };

  const handleProceedToReview = () => {
    if (!firstName.trim()) {
      toast.error('First Name Required', 'Please enter guest first name.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone Required', 'Please enter guest contact number.');
      return;
    }
    // Set recommended deposit (e.g. 50% or full amount)
    setDepositAmount(Math.min(totalTariff, Math.max(1500, Math.round(totalTariff * 0.5))));
    setCurrentStep(4);
  };

  // Final submission: either as instant check-in (if arriving today) or future reservation
  const handleFinalSubmit = (checkInNow: boolean) => {
    if (!selectedRoom) return;

    const currentBookings = loadBookingsFromStorage();
    const nextCodeNum = 1001 + currentBookings.length;
    const bookingCode = `BK-${nextCodeNum}`;
    const newBookingId = `bk-${Date.now()}`;

    const paymentsList = [];
    if (depositAmount > 0) {
      paymentsList.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${nextCodeNum}-DEP`,
        date: 'Today, Initial Deposit',
        amount: Number(depositAmount),
        method: paymentMethod,
        type: 'ADVANCE' as const,
        notes: checkInNow ? 'Deposit collected during front-desk walk-in check-in' : 'Advance deposit for room booking',
      });
    }

    const newBooking: RoomBooking = {
      id: newBookingId,
      bookingCode,
      status: checkInNow ? 'CHECKED_IN' : 'RESERVED',
      guest: {
        id: `gst-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim() || 'Guest',
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@guest.hotel`,
        address: address.trim() || 'Kathmandu, Nepal',
        idType,
        idNumber: idNumber.trim() || 'N/A',
        country: 'Nepal',
        vipTier,
      },
      room: {
        id: selectedRoom.id,
        number: selectedRoom.number,
        type: selectedRoom.type,
        acType: selectedRoom.acType,
        bedType: selectedRoom.bedType,
        floorLevel: selectedRoom.floorLevel,
        pricePerNight: selectedRoom.pricePerNight,
      },
      checkIn,
      checkOut,
      nights,
      roomCharges: totalTariff,
      cafeOrders: [],
      payments: paymentsList,
      bookingHistory: [],
      notes: specialRequests.trim() || undefined,
    };

    const updated = [newBooking, ...currentBookings];
    saveBookingsToStorage(updated);
    syncRoomStatuses(updated);

    if (checkInNow) {
      toast.celebrate(
        'Guest Checked In Successfully!',
        `${newBooking.guest.firstName} ${newBooking.guest.lastName} is now checked into Room ${newBooking.room.number}. Key issued.`
      );
    } else {
      toast.celebrate(
        'Reservation Confirmed!',
        `Room ${newBooking.room.number} reserved for ${newBooking.guest.firstName} (${bookingCode}).`
      );
    }

    onSuccess(newBooking, checkInNow);
    onClose();
  };

  const isCheckInToday = checkIn <= todayStr;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isWalkIn ? 'Walk-in Guest Check-In' : 'Guided Room Reservation'}
      description="Step-by-step receptionist booking: select dates, choose verified room, enter guest info, and confirm"
      size="lg"
    >
      <div className="space-y-5">
        {/* Step Progress Stepper */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-semibold">
          {[
            { step: 1, label: '1. Dates' },
            { step: 2, label: '2. Room' },
            { step: 3, label: '3. Guest' },
            { step: 4, label: '4. Confirm' },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                'py-1.5 px-2 text-center rounded-md transition-all',
                currentStep === item.step
                  ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                  : currentStep > item.step
                  ? 'bg-emerald-100 text-[#0B3D32] dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-slate-400'
              )}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* STEP 1: DATES & GUEST CAPACITY                                     */}
        {/* ----------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0 text-[#0B3D32] dark:text-emerald-400" />
              <span>
                Room availability and prices will be calculated dynamically for your exact stay dates.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Check-in Date *
                </label>
                <Input
                  type="date"
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => {
                    const nextIn = e.target.value;
                    setCheckIn(nextIn);
                    if (nextIn >= checkOut) {
                      const nextOutDate = new Date(new Date(nextIn).getTime() + 86400000)
                        .toISOString()
                        .split('T')[0];
                      setCheckOut(nextOutDate);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Check-out Date *
                </label>
                <Input
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stay Duration
                </label>
                <div className="h-9 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center font-bold text-xs text-slate-800 dark:text-slate-200">
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adults
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4+ Adults</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Children
                </label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToRooms}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bold"
              >
                Search Available Rooms
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 2: AVAILABLE ROOMS SELECTION (DATE OVERLAP SAFE)              */}
        {/* ----------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Available Rooms ({formatDate(checkIn)} – {formatDate(checkOut)})
                </h4>
                <p className="text-xs text-slate-500">
                  Select a room. Rooms booked for these dates are clearly marked to prevent double booking.
                </p>
              </div>

              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="text-xs h-8 rounded border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="ALL">All Categories</option>
                <option value="Deluxe">Deluxe Rooms</option>
                <option value="Standard">Standard Rooms</option>
                <option value="Suite">Suites</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {evaluatedRooms.map((rm) => {
                const isSelected = selectedRoomId === rm.id;
                const totalForRoom = rm.pricePerNight * nights;

                if (!rm.isAvailableForDates) {
                  return (
                    <div
                      key={rm.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40 text-xs opacity-75"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                            <span>Room {rm.number}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                              Booked for these dates
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{rm.type}</p>
                        </div>
                      </div>
                      {rm.conflictBooking && (
                        <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-200 dark:border-slate-800 pt-1">
                          Booked by: <strong>{rm.conflictBooking.guest.firstName} {rm.conflictBooking.guest.lastName}</strong> ({formatDate(rm.conflictBooking.checkIn)} – {formatDate(rm.conflictBooking.checkOut)})
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={rm.id}
                    onClick={() => setSelectedRoomId(rm.id)}
                    className={cn(
                      'p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col justify-between',
                      isSelected
                        ? 'border-[#0B3D32] bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/40 ring-1 ring-[#0B3D32]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    )}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <BedDouble className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                          <span>Room {rm.number}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            Free for Dates
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(rm.pricePerNight)}/n
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rm.type} • {rm.bedType} • {rm.floorLevel}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                      <span className="text-[11px] text-slate-500">{nights} Nights Total:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(totalForRoom)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Change Dates
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToGuest}
                disabled={!selectedRoomId}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bold"
              >
                Continue to Guest Details
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 3: GUEST INFORMATION                                          */}
        {/* ----------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Guest Identification & Profile</h4>
              <p className="text-xs text-slate-500">Enter personal and ID details for the guest register</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name *
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ram"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 9841234567"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="CT-27-01-72-0451"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Special Requests or Notes
              </label>
              <Input
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Airport pickup, high floor, quiet room, late check-in..."
              />
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to Rooms
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToReview}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="font-bold"
              >
                Review & Confirm
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 4: REVIEW, DEPOSIT & IMMEDIATE CHECK-IN OFFER                 */}
        {/* ----------------------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Stay & Room Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Guest</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {firstName} {lastName}
                  </p>
                  <p className="text-[11px] text-slate-500">{phone} • ID: {idNumber || idType}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Room</span>
                  <p className="font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                    Room {selectedRoom?.number}
                  </p>
                  <p className="text-[11px] text-slate-500">{selectedRoom?.type}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-600 dark:text-slate-400">Stay Period:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatDate(checkIn)} – {formatDate(checkOut)} ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total Room Tariff:</span>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {formatCurrency(totalTariff)}
                </span>
              </div>
            </div>

            {/* Deposit & Advance Payment */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Deposit & Payment Method
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Deposit Amount Collected (Rs.)
                  </label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="CARD">💳 POS / Credit / Debit Card</option>
                    <option value="UPI_QR">📱 UPI / QR Code</option>
                    <option value="ESEWA_KHALTI">📲 eSewa / Khalti</option>
                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Immediate Check-in Action Box */}
            {isCheckInToday && (
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Guest is arriving today! Offer immediate check-in:</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Click <strong>Confirm & Check In Now</strong> to issue Room {selectedRoom?.number} key and add directly to In-House Guests.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(3)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>

              <div className="flex items-center gap-2">
                {isCheckInToday ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFinalSubmit(false)}
                      className="text-xs"
                    >
                      Save as Reserved
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFinalSubmit(true)}
                      leftIcon={<LogIn className="w-4 h-4" />}
                      className="font-bold px-4 shadow-sm"
                    >
                      Confirm & Check In Now
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleFinalSubmit(false)}
                    leftIcon={<BookmarkCheck className="w-4 h-4" />}
                    className="font-bold px-5 shadow-sm"
                  >
                    Confirm Future Reservation
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

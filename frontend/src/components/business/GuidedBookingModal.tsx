'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  BedDouble,
  Check,
  CreditCard,
  ShieldCheck,
  X,
  UserPlus,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getRelativeDate,
  AVAILABLE_ROOMS_CATALOG,
} from '@/app/(admin)/reservations/reservationsData';
import { cn } from '@/lib/utils';

export interface GuidedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: RoomBooking, isCheckedIn: boolean) => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRoomId?: string;
  isWalkIn?: boolean;
}

interface RegisteredGuest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  country?: string;
  address?: string;
}

const DEFAULT_GUESTS: RegisteredGuest[] = [
  { id: 'gst-1', name: 'Ram Sharma', phone: '+977 9841234567', email: 'ram.sharma@gmail.com', idType: 'Citizenship', idNumber: 'CT-27-01-72-0451', country: 'Nepal', address: 'New Baneshwor, Kathmandu' },
  { id: 'gst-2', name: 'Sita Thapa', phone: '+977 9851122334', email: 'sita.thapa@outlook.com', idType: 'Passport', idNumber: 'PP-0899214', country: 'Nepal', address: 'Pokhara-8, Kaski' },
  { id: 'gst-3', name: 'Rajesh Hamal', phone: '+977 9801998877', email: 'rajesh.hamal@kollywood.np', idType: 'Citizenship', idNumber: 'CT-18-02-65-8891', country: 'Nepal', address: 'Baluwatar, Kathmandu' },
  { id: 'gst-4', name: 'Maya Gurung', phone: '+977 9813445566', email: 'maya.gurung@annapurna.org', idType: 'Citizenship', idNumber: 'CT-33-04-79-1122', country: 'Nepal', address: 'Dharan-12, Sunsari' },
  { id: 'gst-5', name: 'Johnathan Doe', phone: '+1 415 555 2671', email: 'john.doe@techcorp.io', idType: 'Passport', idNumber: 'USA-7821990', country: 'United States', address: 'San Francisco, CA' },
];

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

  const [registeredGuests, setRegisteredGuests] = useState<RegisteredGuest[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_GUESTS;
    try {
      const raw = localStorage.getItem('hotel_registered_guests');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_GUESTS;
  });

  // Modal: + Add New Guest
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestIdType, setNewGuestIdType] = useState('Citizenship');
  const [newGuestIdNumber, setNewGuestIdNumber] = useState('');

  // Top Form Fields
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('gst-1');
  const [guestPhone, setGuestPhone] = useState<string>('+977 9841234567');
  const [guestEmail, setGuestEmail] = useState<string>('ram.sharma@gmail.com');
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckIn || todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(initialCheckOut || tomorrowStr);
  const [bookingType, setBookingType] = useState<string>('Direct Walk-In');
  const [paxCount, setPaxCount] = useState<number>(2);

  // The Star Toggle: Check In Now
  const [checkInNow, setCheckInNow] = useState<boolean>(isWalkIn);

  // Room Info
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<string>('Deluxe Room');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || 'rm-101');
  const [customRoomRate, setCustomRoomRate] = useState<number>(3500);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [breakfastIncluded, setBreakfastIncluded] = useState<boolean>(false);

  // Financials
  const [advancedAmount, setAdvancedAmount] = useState<number>(3500);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER'>('CASH');

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialCheckIn) setCheckInDate(initialCheckIn);
      if (initialCheckOut) setCheckOutDate(initialCheckOut);
      if (initialRoomId) {
        setSelectedRoomId(initialRoomId);
        const r = AVAILABLE_ROOMS_CATALOG.find((rm) => rm.id === initialRoomId);
        if (r) {
          setSelectedRoomCategory(r.type);
          setCustomRoomRate(r.pricePerNight);
          setAdvancedAmount(r.pricePerNight);
        }
      }
      setCheckInNow(isWalkIn);
    }
  }, [isOpen, initialCheckIn, initialCheckOut, initialRoomId, isWalkIn]);

  // Selected Guest Object
  const currentGuest = useMemo(() => {
    return registeredGuests.find((g) => g.id === selectedGuestId) || registeredGuests[0] || DEFAULT_GUESTS[0];
  }, [registeredGuests, selectedGuestId]);

  useEffect(() => {
    if (currentGuest) {
      setGuestPhone(currentGuest.phone || '');
      setGuestEmail(currentGuest.email || '');
    }
  }, [currentGuest]);

  // Selected Room Object
  const selectedRoomObj = useMemo(() => {
    return AVAILABLE_ROOMS_CATALOG.find((r) => r.id === selectedRoomId) || AVAILABLE_ROOMS_CATALOG[0];
  }, [selectedRoomId]);

  // Nights
  const nights = useMemo(() => {
    try {
      const inD = new Date(checkInDate).getTime();
      const outD = new Date(checkOutDate).getTime();
      const diff = Math.ceil((outD - inD) / (1000 * 60 * 60 * 24));
      return Math.max(1, isNaN(diff) ? 1 : diff);
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  // Financial Calculations
  const roomTariffSubtotal = useMemo(() => {
    return (Number(customRoomRate) || 0) * nights;
  }, [customRoomRate, nights]);

  const breakfastCost = useMemo(() => {
    if (!breakfastIncluded) return 0;
    return 350 * paxCount * nights;
  }, [breakfastIncluded, paxCount, nights]);

  const totalPayable = useMemo(() => {
    return Math.max(0, roomTariffSubtotal + breakfastCost - (Number(discountAmount) || 0));
  }, [roomTariffSubtotal, breakfastCost, discountAmount]);

  const dueAmount = useMemo(() => {
    return Math.max(0, totalPayable - (Number(advancedAmount) || 0));
  }, [totalPayable, advancedAmount]);

  // Add new guest in popup
  const handleAddNewGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newGuestPhone.trim()) {
      toast.error('Required Fields', 'Guest name and phone are required.');
      return;
    }
    const created: RegisteredGuest = {
      id: `gst-${Date.now()}`,
      name: newGuestName.trim(),
      phone: newGuestPhone.trim(),
      email: newGuestEmail.trim(),
      idType: newGuestIdType,
      idNumber: newGuestIdNumber.trim(),
      country: 'Nepal',
      address: 'Kathmandu, Nepal',
    };
    const updated = [created, ...registeredGuests];
    setRegisteredGuests(updated);
    try {
      localStorage.setItem('hotel_registered_guests', JSON.stringify(updated));
    } catch {}

    setSelectedGuestId(created.id);
    setGuestPhone(created.phone);
    setGuestEmail(created.email || '');
    setIsAddGuestModalOpen(false);
    setNewGuestName('');
    setNewGuestPhone('');
    setNewGuestEmail('');
    toast.success('Guest Created', `${created.name} was added.`);
  };

  // Submit Booking / Check-in
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const [first, ...rest] = (currentGuest.name || 'Guest').split(' ');
    const lastName = rest.join(' ') || 'Guest';

    const currentBookings = loadBookingsFromStorage();
    const nextCodeNum = 1001 + currentBookings.length;
    const bookingCode = `BK-${nextCodeNum}`;
    const newBookingId = `bk-${Date.now()}`;

    const paidNow = Number(advancedAmount) || 0;
    const paymentsList = [];
    if (paidNow > 0) {
      paymentsList.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${nextCodeNum}-${checkInNow ? 'CHK' : 'ADV'}`,
        date: 'Today',
        amount: paidNow,
        method: paymentMethod,
        type: (checkInNow && dueAmount === 0 ? 'SETTLEMENT' : 'ADVANCE') as any,
        notes: checkInNow ? 'Check-in Desk Payment' : 'Advance Reservation Deposit',
      });
    }

    const newBooking: RoomBooking = {
      id: newBookingId,
      bookingCode,
      status: checkInNow ? 'CHECKED_IN' : 'RESERVED',
      guest: {
        id: currentGuest.id,
        firstName: first,
        lastName,
        phone: guestPhone.trim(),
        email: guestEmail.trim() || `${guestPhone.trim()}@guest.hotel`,
        address: currentGuest.address || 'Kathmandu, Nepal',
        idType: currentGuest.idType || 'Citizenship',
        idNumber: currentGuest.idNumber || 'N/A',
        country: currentGuest.country || 'Nepal',
        vipTier: 'STANDARD',
      },
      room: {
        id: selectedRoomObj.id,
        number: selectedRoomObj.number,
        type: selectedRoomObj.type,
        acType: selectedRoomObj.acType,
        bedType: selectedRoomObj.bedType,
        floorLevel: selectedRoomObj.floorLevel,
        pricePerNight: selectedRoomObj.pricePerNight,
      },
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      roomCharges: totalPayable,
      cafeOrders: [],
      payments: paymentsList,
      bookingHistory: [],
    };

    const updated = [newBooking, ...currentBookings];
    saveBookingsToStorage(updated);

    if (checkInNow) {
      toast.celebrate('Checked In!', `Room ${selectedRoomObj.number} allocated to ${currentGuest.name}.`);
    } else {
      toast.success('Reservation Confirmed', `Booking ${bookingCode} saved for ${currentGuest.name}.`);
    }

    onSuccess(newBooking, checkInNow);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-2xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[4px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B3D32] dark:text-emerald-400 font-heading">
                Add New Booking & Check-In
              </h2>
              <span className="text-[11px] text-slate-500">
                {checkInNow ? '● Instant Check-In & Room Key' : '○ Hold Room for Future Reservation'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs">
          {/* Top 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
            {/* Left */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Booking Date *</label>
                <div className="col-span-2">
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Guest Name *</label>
                <div className="col-span-2 flex items-center gap-1.5">
                  <select
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-semibold outline-none cursor-pointer"
                  >
                    {registeredGuests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.phone})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddGuestModalOpen(true)}
                    className="p-1.5 rounded bg-[#0B3D32] hover:bg-[#093027] text-white shrink-0 cursor-pointer"
                    title="Add Guest"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Check In Date *</label>
                <div className="col-span-2">
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Check Out Date *</label>
                <div className="col-span-2">
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-mono outline-none"
                  />
                </div>
              </div>

              {/* The Check In Now Toggle */}
              <div className="grid grid-cols-3 items-center gap-2 pt-2 border-t border-[#F0F4F2] dark:border-[#103D33]">
                <label className="font-bold text-[#0B3D32] dark:text-emerald-400">Check In Now</label>
                <div className="col-span-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCheckInNow(!checkInNow)}
                    className={cn(
                      'relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      checkInNow ? 'bg-[#0B3D32] dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                        checkInNow ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {checkInNow ? 'Yes (Instant Key & Occupied)' : 'No (Hold as Reservation)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Booking Type</label>
                <div className="col-span-2">
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] outline-none cursor-pointer"
                  >
                    <option value="Direct Walk-In">Direct Walk-In</option>
                    <option value="Front Desk Phone Call">Phone Call</option>
                    <option value="Website / Online">Official Website</option>
                    <option value="Corporate / Company">Corporate</option>
                    <option value="Booking.com / OTA">OTA / Booking.com</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                <div className="col-span-2">
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="col-span-2">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Booking Pax</label>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={paxCount}
                    onChange={(e) => setPaxCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 px-2 py-1 rounded border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#061B16] font-bold text-center outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room Information Table */}
          <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#145447] space-y-2">
            <h3 className="font-bold text-[#0B3D32] dark:text-emerald-400 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4" />
              <span>Room Information</span>
            </h3>

            <div className="border border-[#DCE3DF] dark:border-[#145447] rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] text-slate-600 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3 border-r">Room Category</th>
                    <th className="py-2 px-3 border-r">Assigned Room</th>
                    <th className="py-2 px-3 border-r text-right">Amount (Rs.)</th>
                    <th className="py-2 px-3 border-r text-center">Nights</th>
                    <th className="py-2 px-3 border-r text-right">Discount</th>
                    <th className="py-2 px-3 text-right">Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#071F1A]">
                  <tr>
                    <td className="py-2.5 px-3 border-r">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {selectedRoomObj.type}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {selectedRoomObj.acType} · {selectedRoomObj.bedType}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 border-r">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EBF3F0] dark:bg-[#0E3D32] border border-[#0B3D32]/25 dark:border-emerald-600/30 text-[#0B3D32] dark:text-emerald-300 font-bold text-xs">
                        <BedDouble className="w-3.5 h-3.5 shrink-0" />
                        <span>Room {selectedRoomObj.number}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          ({selectedRoomObj.floorLevel})
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3 border-r text-right">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={customRoomRate}
                        onChange={(e) => setCustomRoomRate(Math.max(0, Number(e.target.value) || 0))}
                        className="w-20 px-1.5 py-1 rounded border text-right font-mono font-bold outline-none"
                      />
                    </td>

                    <td className="py-2 px-3 border-r text-center font-bold font-mono">{nights}</td>

                    <td className="py-2 px-3 border-r text-right">
                      <input
                        type="number"
                        min={0}
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-16 px-1.5 py-1 rounded border text-right font-mono outline-none"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                      Rs. {totalPayable.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Financial Stack */}
          <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#145447] flex flex-col sm:flex-row items-end justify-between gap-4">
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>• If guest pays partial, balance will be collected upon check-out.</p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAdvancedAmount(totalPayable)}
                  className="px-2 py-0.5 rounded border border-[#0B3D32] bg-[#E8F2EE] text-[#0B3D32] font-bold text-[10px]"
                >
                  Pay Full
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedAmount(Math.round(totalPayable * 0.5))}
                  className="px-2 py-0.5 rounded border border-slate-300 text-[10px]"
                >
                  50% Advance
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedAmount(0)}
                  className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[10px]"
                >
                  Pay at Checkout
                </button>
              </div>
            </div>

            <div className="w-full sm:w-80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold border-b pb-1">
                <span>Total Payable:</span>
                <span className="font-mono text-sm text-[#0B3D32] dark:text-emerald-400">
                  Rs. {totalPayable.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Advanced Amount:</label>
                <input
                  type="number"
                  min={0}
                  value={advancedAmount}
                  onChange={(e) => setAdvancedAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2 py-1 rounded border border-[#0B3D32] font-mono font-bold text-right outline-none text-[#0B3D32] dark:text-emerald-300"
                />
              </div>

              <div className="grid grid-cols-2 items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Due Amount:</span>
                <div className="text-right">
                  <span
                    className={cn(
                      'font-mono font-bold text-xs px-2 py-0.5 rounded inline-block',
                      dueAmount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    Rs. {dueAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Payment Mode:</label>
                <select
                  value={paymentMethod}
                  disabled={advancedAmount === 0}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2 py-1 rounded border text-xs outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="CASH">💵 Cash at Desk</option>
                  <option value="CARD">💳 POS Card</option>
                  <option value="UPI_QR">📱 Fonepay / QR</option>
                  <option value="ESEWA_KHALTI">📲 eSewa / Khalti</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#145447] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {checkInNow ? 'Save & Check In' : 'Save Booking'}
            </button>
          </div>
        </form>

        {/* Modal: + Add New Guest */}
        {isAddGuestModalOpen && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs"
            onClick={() => setIsAddGuestModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded bg-white dark:bg-[#071F1A] border p-5 space-y-3 select-text shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-bold text-sm text-[#0B3D32] dark:text-emerald-400">Add New Guest</h4>
                <button type="button" onClick={() => setIsAddGuestModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewGuestSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="e.g. Ram Sharma"
                    className="w-full px-2.5 py-1.5 rounded border outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    placeholder="+977 98..."
                    className="w-full px-2.5 py-1.5 rounded border outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-2.5 py-1.5 rounded border outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">ID Type</label>
                    <select
                      value={newGuestIdType}
                      onChange={(e) => setNewGuestIdType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border outline-none"
                    >
                      <option value="Citizenship">Citizenship</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="National ID">National ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ID Number</label>
                    <input
                      type="text"
                      value={newGuestIdNumber}
                      onChange={(e) => setNewGuestIdNumber(e.target.value)}
                      placeholder="Doc No."
                      className="w-full px-2 py-1.5 rounded border outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGuestModalOpen(false)}
                    className="px-3 py-1.5 rounded border text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#0B3D32] text-white text-xs font-bold"
                  >
                    Save & Select
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

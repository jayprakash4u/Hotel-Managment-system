'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  LogIn,
  Search,
  Calendar,
  BedDouble,
  UserCheck,
  Printer,
  X,
  RefreshCw,
  CheckCircle2,
  FileText,
  User,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { FrontDeskNavBoxes } from '@/components/common/FrontDeskNavBoxes';
import {
  RoomBooking,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  getRelativeDate,
  AVAILABLE_ROOMS_CATALOG,
} from '../reservations/reservationsData';

function CheckInListContent() {
  const toast = useToast();

  const todayStr = useMemo(() => getRelativeDate(0), []);
  const tomorrowStr = useMemo(() => getRelativeDate(1), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'WEEK' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'CHECKED_IN' | 'ALL'>('PENDING');
  const [roomTypeFilter, setRoomTypeFilter] = useState('ALL');

  // Modals
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<RoomBooking | null>(null);
  const [selectedBookingForRegCard, setSelectedBookingForRegCard] = useState<RoomBooking | null>(null);

  // Check-In Form States
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [guestIdType, setGuestIdType] = useState('Citizenship');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [depositAmount, setDepositAmount] = useState('2000');
  const [depositMethod, setDepositMethod] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');

  // Reload bookings from storage
  const reloadData = () => {
    setBookings(loadBookingsFromStorage());
    toast.info('List Refreshed', 'Latest bookings loaded.');
  };

  // Sync to storage
  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

  // Filtered Arrivals List
  const checkInList = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Status Filter:
      if (statusFilter === 'PENDING') {
        if (b.status !== 'RESERVED') return false;
      } else if (statusFilter === 'CHECKED_IN') {
        if (b.status !== 'CHECKED_IN') return false;
      } else if (statusFilter === 'ALL') {
        if (b.status !== 'RESERVED' && b.status !== 'CHECKED_IN') return false;
      }

      // 2. Date Filter:
      if (dateFilter === 'TODAY') {
        if (b.checkIn !== todayStr) return false;
      } else if (dateFilter === 'TOMORROW') {
        if (b.checkIn !== tomorrowStr) return false;
      } else if (dateFilter === 'WEEK') {
        const weekEnd = getRelativeDate(7);
        if (b.checkIn < todayStr || b.checkIn > weekEnd) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customDate && b.checkIn !== customDate) return false;
      }

      // 3. Room Type Filter:
      if (roomTypeFilter !== 'ALL' && b.room.type !== roomTypeFilter) {
        return false;
      }

      // 4. Search Query:
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(q);
        const matchesName = fullName.includes(q);
        const matchesRoom = b.room.number.toLowerCase().includes(q);
        const matchesPhone = b.guest.phone.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesRoom && !matchesPhone) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, dateFilter, customDate, roomTypeFilter, searchQuery, todayStr, tomorrowStr]);

  // Open Check-in Modal
  const handleOpenCheckIn = (b: RoomBooking) => {
    setSelectedBookingForCheckIn(b);
    setAssignedRoomId(b.room.id);
    setGuestIdType(b.guest.idType || 'Citizenship');
    setGuestIdNumber(b.guest.idNumber || '');
    const fin = getBookingFinancials(b);
    const needed = Math.max(0, Math.round(fin.roomCharges * 0.5) - fin.totalPaid);
    setDepositAmount(needed > 0 ? needed.toString() : '2000');
    setDepositMethod('CASH');
  };

  // Submit Check-in
  const handleConfirmCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCheckIn) return;

    const roomObj = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === assignedRoomId) || selectedBookingForCheckIn.room;
    const depVal = parseFloat(depositAmount) || 0;

    const updated = bookings.map((b) => {
      if (b.id !== selectedBookingForCheckIn.id) return b;

      const payments = [...(b.payments || [])];
      if (depVal > 0) {
        payments.push({
          id: `pay-${Date.now()}`,
          receiptNo: `REC-${b.bookingCode}-CHK`,
          date: 'Check-in Deposit',
          amount: depVal,
          method: depositMethod,
          type: 'ADVANCE',
          notes: 'Recorded at check-in desk',
        });
      }

      return {
        ...b,
        status: 'CHECKED_IN' as const,
        guest: {
          ...b.guest,
          idType: guestIdType,
          idNumber: guestIdNumber.trim() || 'Verified',
        },
        room: {
          ...b.room,
          id: roomObj.id,
          number: roomObj.number,
          type: roomObj.type,
          acType: roomObj.acType,
          bedType: roomObj.bedType,
          floorLevel: roomObj.floorLevel,
          pricePerNight: roomObj.pricePerNight,
        },
        payments,
      };
    });

    setBookings(updated);
    saveBookingsToStorage(updated);
    setSelectedBookingForCheckIn(null);

    toast.celebrate(
      'Guest Checked In!',
      `${selectedBookingForCheckIn.guest.firstName} ${selectedBookingForCheckIn.guest.lastName} is now assigned to Room ${roomObj.number}.`
    );
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Front Desk Option Boxes (Matching Hotel Setup) */}
      <FrontDeskNavBoxes activeId="check-in" />

      {/* -----------------------------------------------------------------------
          HEADER & TOOLBAR: Filter by Check-In Date, Search & Status
          ----------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#071F1A] p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold font-heading text-[#24352F] dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Arrivals & Check-In List</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify arriving guests, assign rooms, take deposits, and print registration cards
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reloadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] bg-white text-xs font-semibold text-[#24352F] hover:bg-[#F2F6F4] dark:border-[#145447] dark:bg-[#07241E] dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] dark:border-[#103D33] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Arrival Date:</span>
            </span>

            {(
              [
                { id: 'TODAY', label: "Today's Arrivals" },
                { id: 'TOMORROW', label: 'Tomorrow' },
                { id: 'WEEK', label: 'Next 7 Days' },
                { id: 'ALL', label: 'All Upcoming' },
                { id: 'CUSTOM', label: 'Custom Date' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilter(df.id)}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                  dateFilter === df.id
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-[#FAFBF9] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] text-slate-600 dark:text-slate-300 hover:bg-[#F2F6F4]'
                )}
              >
                {df.label}
              </button>
            ))}

            {dateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-0.5 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] text-xs font-mono"
              />
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, Res ID, room..."
              className="w-full h-8 rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] py-1 pl-8 pr-7 text-xs font-medium dark:border-[#145447] dark:bg-[#061B16] dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          CHECK-IN LIST TABLE (Dense Ledger Modeled After Hotel PMS Reg Card Manifest)
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAFBF9] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[#64736C] dark:text-[#A4B8AE] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">RES ID</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">GUEST NAME</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">STAY DURATION</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM / TYPE / FLOOR</th>
                <th className="py-2.5 px-3 text-center border-r border-[#E5EEE9] dark:border-[#145447]">PAX</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">STATUS</th>
                <th className="py-2.5 px-3.5 text-right border-r border-[#E5EEE9] dark:border-[#145447]">AMOUNT & ADVANCE</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">PREFERENCES / NOTES</th>
                <th className="py-2.5 px-3 text-center w-36">CHECK IN / REG CARD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
              {checkInList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No arriving guests found for the selected date filter.
                  </td>
                </tr>
              ) : (
                checkInList.map((booking, idx) => {
                  const fin = getBookingFinancials(booking);
                  const isCheckedIn = booking.status === 'CHECKED_IN';

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                    >
                      {/* 1. Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {idx + 1}
                      </td>

                      {/* 2. Res ID */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                          {booking.bookingCode}
                        </span>
                      </td>

                      {/* 3. Guest Name */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-bold text-[#24352F] dark:text-white">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{booking.guest.phone}</div>
                      </td>

                      {/* 4. Stay Duration */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="text-xs text-[#24352F] dark:text-slate-200 font-medium">
                          {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                          {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                        </div>
                      </td>

                      {/* 5. Room / Type / Floor */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-semibold text-[#24352F] dark:text-white flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                          <span>Room {booking.room.number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {booking.room.type} · {booking.room.floorLevel}
                        </div>
                      </td>

                      {/* 6. Pax */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-[#E5EEE9] dark:border-[#145447]">
                        2 Pax
                      </td>

                      {/* 7. Status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#C5DED3]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Reserved
                          </span>
                        )}
                      </td>

                      {/* 8. Amount & Advance */}
                      <td className="py-2.5 px-3.5 text-right font-mono border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-bold text-[#24352F] dark:text-white">
                          Rs. {fin.roomCharges.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Adv: Rs. {fin.totalPaid.toLocaleString()}
                        </div>
                      </td>

                      {/* 9. Preferences / Notes */}
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 border-r border-[#E5EEE9] dark:border-[#145447] text-[11px]">
                        {booking.notes || 'Standard booking'}
                      </td>

                      {/* 10. Check-in Card & Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Print Reg Card Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForRegCard(booking)}
                            className="p-1.5 rounded-[2px] border border-[#DCE3DF] bg-white text-slate-600 hover:text-[#0B3D32] hover:bg-[#F2F6F4] dark:border-[#145447] dark:bg-[#07241E] dark:text-slate-300 cursor-pointer"
                            title="Print Guest Registration Card"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Check In Action */}
                          {!isCheckedIn ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCheckIn(booking)}
                              className="px-2.5 py-1 rounded-[2px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 cursor-pointer"
                            >
                              Check In
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              In-House
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          CHECK-IN MODAL (Assign Room, Verify ID, Record Deposit)
          ----------------------------------------------------------------------- */}
      {selectedBookingForCheckIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
          onClick={() => setSelectedBookingForCheckIn(null)}
        >
          <div
            className="w-full max-w-lg rounded-[4px] bg-white dark:bg-[#07241E] border border-[#DCE3DF] dark:border-[#145447] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white uppercase font-heading">
                  Check-In: {selectedBookingForCheckIn.guest.firstName} {selectedBookingForCheckIn.guest.lastName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedBookingForCheckIn.bookingCode} · {selectedBookingForCheckIn.room.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForCheckIn(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Room *
                  </label>
                  <select
                    value={assignedRoomId}
                    onChange={(e) => setAssignedRoomId(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    {AVAILABLE_ROOMS_CATALOG.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} — {r.type} ({r.floorLevel}) · Rs. {r.pricePerNight}/night
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Type
                  </label>
                  <select
                    value={guestIdType}
                    onChange={(e) => setGuestIdType(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="Citizenship">Citizenship</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Document Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 27-01-78-00123"
                    value={guestIdNumber}
                    onChange={(e) => setGuestIdNumber(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as any)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="UPI_QR">Fonepay / QR</option>
                    <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5EEE9] dark:border-[#145447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCheckIn(null)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-[#DCE3DF] text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs dark:bg-emerald-600"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          PRINTABLE GUEST REGISTRATION CARD (Reg Card Modal)
          ----------------------------------------------------------------------- */}
      {selectedBookingForRegCard && (() => {
        const b = selectedBookingForRegCard;
        const fin = getBookingFinancials(b);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
            onClick={() => setSelectedBookingForRegCard(null)}
          >
            <div
              className="w-full max-w-2xl rounded-[4px] bg-white border border-[#DCE3DF] shadow-2xl p-6 text-black select-text"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hotel Letterhead */}
              <div className="text-center pb-4 border-b-2 border-black">
                <h2 className="text-xl font-bold tracking-widest uppercase font-serif">
                  AURA GRAND HOTEL & RESORT
                </h2>
                <p className="text-xs text-slate-600">
                  Kathmandu, Nepal · Tel: +977-1-4455667 · info@auragrandhotel.com
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 border border-black text-xs font-bold uppercase tracking-wider">
                  Guest Registration Card
                </div>
              </div>

              {/* Reg Card Fields */}
              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Reservation ID:</span>
                    <strong className="font-mono text-sm">{b.bookingCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Assigned Room:</span>
                    <strong className="text-sm">Room {b.room.number} ({b.room.type})</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Guest Full Name:</span>
                    <strong className="text-sm">{b.guest.firstName} {b.guest.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Phone Number:</span>
                    <strong className="font-mono">{b.guest.phone}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Arrival Date:</span>
                    <strong>{b.checkIn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Departure Date:</span>
                    <strong>{b.checkOut}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Duration:</span>
                    <strong>{b.nights} {b.nights === 1 ? 'Night' : 'Nights'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Room Rate:</span>
                    <strong>Rs. {b.room.pricePerNight.toLocaleString()}/night</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Advance Deposit:</span>
                    <strong>Rs. {fin.totalPaid.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Est. Balance Due:</span>
                    <strong>Rs. {fin.balanceDue.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Terms & Policies */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 space-y-1">
                  <p><strong>Hotel Terms:</strong> Check-out time is 11:00 AM. Key cards must be returned upon departure. Smoking is prohibited inside all rooms. The hotel is not responsible for valuables left unattended.</p>
                </div>

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="border-t border-black pt-1 text-center">
                    <span className="text-[11px] font-semibold block">Guest Signature</span>
                  </div>
                  <div className="border-t border-black pt-1 text-center">
                    <span className="text-[11px] font-semibold block">Front Desk Officer Signature</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForRegCard(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0B3D32] text-white text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Registration Card</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function CheckInListPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#879B90]">
          Loading Check-In List...
        </div>
      }
    >
      <CheckInListContent />
    </Suspense>
  );
}

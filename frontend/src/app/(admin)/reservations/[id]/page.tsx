'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DoorOpen,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  Coffee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Plus,
  X,
  History,
  ShieldCheck,
  User,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomBooking,
  CAFE_MENU_ITEMS,
  loadBookingsFromStorage,
  saveBookingsToStorage,
  getBookingFinancials,
  findBooking,
  PaymentEntry,
  CafeOrder,
} from '../reservationsData';

export default function ReservationDetailPage() {
  const params = useParams();
  const rawId = (params?.id as string) || '';
  const router = useRouter();
  const toast = useToast();

  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stay' | 'cafe' | 'payments' | 'bill' | 'history'>('all');

  // Mini dialog states for actions
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Add Cafe Order states
  const [selectedCafeDishId, setSelectedCafeDishId] = useState(CAFE_MENU_ITEMS[0].id);
  const [cafeOrderQuantity, setCafeOrderQuantity] = useState(1);

  // Add Payment states
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI'>('CASH');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');

  // Load bookings from storage
  useEffect(() => {
    const data = loadBookingsFromStorage();
    setBookings(data);
    setIsLoaded(true);
  }, []);

  // Sync back to storage on change
  const updateBookings = (updater: (prev: RoomBooking[]) => RoomBooking[]) => {
    setBookings((prev) => {
      const next = updater(prev);
      saveBookingsToStorage(next);
      return next;
    });
  };

  const booking = useMemo(() => {
    if (!rawId) return undefined;
    return findBooking(bookings, rawId);
  }, [bookings, rawId]);

  const financials = useMemo(() => {
    if (!booking) return null;
    return getBookingFinancials(booking);
  }, [booking]);

  // Actions
  const handleCheckIn = () => {
    if (!booking) return;
    updateBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'CHECKED_IN' as const } : b))
    );
    toast.celebrate('Guest Checked In', `Room ${booking.room.number} is now active.`);
  };

  const handleMarkNoShow = () => {
    if (!booking) return;
    updateBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'NO_SHOW' as const } : b))
    );
    toast.warning('Marked as No-Show', 'Guest did not arrive. Room released for new bookings.');
  };

  const handleCancelBooking = () => {
    if (!booking) return;
    updateBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' as const } : b))
    );
    toast.info('Booking Cancelled', 'Reservation status updated to Cancelled.');
  };

  const handleCheckOut = () => {
    if (!booking || !financials) return;
    if (financials.balanceDue > 0) {
      toast.error(
        'Outstanding Balance Due',
        `Guest has Rs. ${financials.balanceDue.toLocaleString()} unpaid. Please record payment before checkout.`
      );
      setPaymentAmountInput(financials.balanceDue.toString());
      setShowAddPaymentModal(true);
      return;
    }

    updateBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, status: 'CHECKED_OUT' as const } : b))
    );
    toast.celebrate('Check-Out Completed', `Folio #${booking.bookingCode} settled.`);
  };

  const handleExtendStay = () => {
    if (!booking) return;
    const newNights = booking.nights + 1;
    const newRoomCharges = newNights * booking.room.pricePerNight;
    const currentOut = new Date(booking.checkOut);
    currentOut.setDate(currentOut.getDate() + 1);
    const newCheckOutStr = currentOut.toISOString().split('T')[0];

    updateBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              nights: newNights,
              checkOut: newCheckOutStr,
              roomCharges: newRoomCharges,
            }
          : b
      )
    );
    toast.success('Stay Extended', `Check-out moved to ${newCheckOutStr} (+1 Night).`);
  };

  const handleAddCafeOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    const dish = CAFE_MENU_ITEMS.find((d) => d.id === selectedCafeDishId);
    if (!dish) return;

    const itemTotal = dish.price * cafeOrderQuantity;
    const newOrder: CafeOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      orderNumber: `CO-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'DELIVERED',
      subtotal: itemTotal,
      items: [
        {
          id: `item-${Date.now()}`,
          name: dish.name,
          quantity: cafeOrderQuantity,
          price: dish.price,
          total: itemTotal,
        },
      ],
    };

    updateBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              cafeOrders: [newOrder, ...b.cafeOrders],
            }
          : b
      )
    );

    setShowAddCafeModal(false);
    setCafeOrderQuantity(1);
    toast.success('Order Added', `Charged Rs. ${itemTotal.toLocaleString()} to Room ${booking.room.number}.`);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    const amount = parseFloat(paymentAmountInput);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const newPayment: PaymentEntry = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      receiptNo: `REC-${booking.bookingCode.replace('BK-', '')}-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      amount,
      method: paymentMethodInput,
      type: booking.payments.length === 0 ? 'ADVANCE' : 'PARTIAL',
      notes: paymentNotesInput.trim() || undefined,
    };

    updateBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              payments: [newPayment, ...b.payments],
            }
          : b
      )
    );

    setShowAddPaymentModal(false);
    setPaymentAmountInput('');
    setPaymentNotesInput('');
    toast.celebrate('Payment Recorded', `Receipt #${newPayment.receiptNo} for Rs. ${amount.toLocaleString()}.`);
  };

  const handlePrintFolio = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-6 h-6 border-2 border-[#0B3D32] border-t-transparent rounded-full animate-spin dark:border-emerald-400" />
      </div>
    );
  }

  if (!booking || !financials) {
    return (
      <div className="space-y-4 max-w-md mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
          Reservation &ldquo;{rawId}&rdquo; Not Found
        </h2>
        <div>
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reservations</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCheckedIn = booking.status === 'CHECKED_IN';
  const isReserved = booking.status === 'RESERVED';
  const isCheckedOut = booking.status === 'CHECKED_OUT';

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP NAVIGATION BAR & WORKFLOW ACTIONS
          ----------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] border border-slate-200 bg-white font-semibold text-slate-700 hover:text-[#0B3D32] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Reservations</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {booking.bookingCode}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintFolio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Folio</span>
          </button>

          <button
            type="button"
            onClick={handleExtendStay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-[#0B3D32] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-400 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Extend (+1 Night)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddCafeModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-[#0B3D32] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-400 cursor-pointer shadow-2xs"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Add Café Order</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (financials.balanceDue > 0) {
                setPaymentAmountInput(financials.balanceDue.toString());
              }
              setShowAddPaymentModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          {isReserved && (
            <>
              <button
                type="button"
                onClick={handleCheckIn}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Check In Guest</span>
              </button>

              <button
                type="button"
                onClick={handleMarkNoShow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer shadow-2xs"
                title="Mark guest as No-Show"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Mark No-Show</span>
              </button>

              <button
                type="button"
                onClick={handleCancelBooking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40 cursor-pointer shadow-2xs"
                title="Cancel reservation"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {isCheckedIn && (
            <button
              type="button"
              onClick={handleCheckOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Check Out</span>
            </button>
          )}

          {isCheckedOut && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold dark:bg-slate-800 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Checked Out</span>
            </span>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          CONCISE EXECUTIVE SUMMARY BANNER (Non-repetitive & Clean)
          ----------------------------------------------------------------------- */}
      <div className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Guest Identity & Room */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[3px] bg-[#E8F2EE] border border-[#CBD5D0] text-[#0B3D32] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm font-heading shrink-0">
              {booking.guest.firstName[0]}
              {booking.guest.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {booking.guest.firstName} {booking.guest.lastName}
                </h1>
                <span className="font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400">
                  {booking.bookingCode}
                </span>
                {booking.guest.vipTier === 'GOLD' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    VIP
                  </span>
                )}
                {isCheckedIn && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Checked In
                  </span>
                )}
                {isReserved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
                    Reserved
                  </span>
                )}
                {isCheckedOut && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                    Checked Out
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Room {booking.room.number} ({booking.room.type})
                </span>
                <span>·</span>
                <span>
                  {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                  {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                  ({booking.nights}n)
                </span>
                <span>·</span>
                <span>{booking.guest.phone}</span>
              </div>
            </div>
          </div>

          {/* Executive Financial Scannable Strip */}
          <div className="flex items-center gap-3 md:gap-5 text-xs pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 flex-wrap">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Room Fare</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Rs. {booking.roomCharges.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {booking.nights}n @ Rs. {booking.room.pricePerNight.toLocaleString()}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Room Orders (F&B)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Rs. {financials.cafeTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {booking.cafeOrders.length} {booking.cafeOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Total Charges</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                Rs. {financials.totalCharges.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Gross Folio</span>
            </div>

            <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Amount Paid</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Rs. {financials.totalPaid.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {booking.payments.length} {booking.payments.length === 1 ? 'receipt' : 'receipts'}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Payment Status</span>
              {financials.balanceDue === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[2px] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Paid in Full</span>
                </span>
              ) : financials.totalPaid > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[2px] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  <span>Partially Paid (Rs. {financials.balanceDue.toLocaleString()} Due)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-[2px] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  <AlertCircle className="w-3 h-3" />
                  <span>Unpaid (Rs. {financials.balanceDue.toLocaleString()} Due)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          NAVIGATION TABS
          ----------------------------------------------------------------------- */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all' as const, label: 'All Details & Folio' },
          { id: 'stay' as const, label: 'Room & Stay' },
          { id: 'cafe' as const, label: 'Café Orders' },
          { id: 'payments' as const, label: 'Payments & Receipts' },
          { id: 'bill' as const, label: 'Folio Invoice' },
          { id: 'history' as const, label: 'Past Stays' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-[#0B3D32] text-white dark:bg-emerald-600 shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* -----------------------------------------------------------------------
          TAB 1: STAY & GUEST DETAILS (Clean 2-Column Scannable Grid)
          ----------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'stay') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Room & Stay Specifications */}
          <div className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <DoorOpen className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Room & Stay</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Assigned Room</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Room {booking.room.number}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {booking.room.type} ({booking.room.acType})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Floor & Bed Setup</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {booking.room.floorLevel}
                </span>
                <span className="text-[11px] text-slate-500 block">{booking.room.bedType}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Check-In</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Check-Out</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Rate / Night</span>
                <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                  Rs. {booking.room.pricePerNight.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Room Total</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {booking.nights}n × Rs. {booking.room.pricePerNight.toLocaleString()} = Rs. {booking.roomCharges.toLocaleString()}
                </span>
              </div>
            </div>

            {booking.notes && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Stay Notes</span>
                <p className="text-slate-600 dark:text-slate-300">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Card 2: Guest Profile & Verified ID */}
          <div className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <User className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
              <span>Guest Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.guest.firstName} {booking.guest.lastName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">VIP Tier</span>
                <span className="font-semibold text-[#0B3D32] dark:text-emerald-400">
                  {booking.guest.vipTier}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Phone</span>
                <a
                  href={`tel:${booking.guest.phone}`}
                  className="font-mono font-semibold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{booking.guest.phone}</span>
                </a>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Email</span>
                <a
                  href={`mailto:${booking.guest.email}`}
                  className="font-semibold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                >
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{booking.guest.email}</span>
                </a>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">ID Verification</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{booking.guest.idType}: {booking.guest.idNumber}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Country</span>
                <span className="font-semibold text-slate-900 dark:text-white">{booking.guest.country}</span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block font-medium">Address</span>
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{booking.guest.address}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB 2: CAFÉ ORDERS (Clean, Professional Table)
          ----------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'cafe') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Café & Dining Orders
            </h3>

            <button
              type="button"
              onClick={() => setShowAddCafeModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Café Order</span>
            </button>
          </div>

          {booking.cafeOrders.length > 0 ? (
            <div className="space-y-3">
              {booking.cafeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden shadow-2xs"
                >
                  {/* Order Bar */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded-[2px] bg-[#0B3D32] text-white text-[11px] dark:bg-emerald-600">
                        #{order.orderNumber}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{order.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#CBD5D0] dark:bg-emerald-950/40 dark:text-emerald-300">
                        {order.status}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {order.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          <th className="py-2 px-3 w-12 text-center border-r border-slate-100 dark:border-slate-800/60">#</th>
                          <th className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/60">ITEM</th>
                          <th className="py-2 px-3 text-right w-28 border-r border-slate-100 dark:border-slate-800/60">UNIT PRICE</th>
                          <th className="py-2 px-3 text-center w-20 border-r border-slate-100 dark:border-slate-800/60">QTY</th>
                          <th className="py-2 px-3 text-right w-32">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {order.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60">
                              Rs. {item.price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/60">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3px] bg-white dark:bg-slate-900/50">
              No café orders charged to this room.
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB 3: PAYMENTS & RECEIPTS (Clean Table)
          ----------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'payments') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Payments & Ledger
            </h3>

            <button
              type="button"
              onClick={() => setShowAddPaymentModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>

          {booking.payments.length > 0 ? (
            <div className="overflow-hidden rounded-[3px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-2.5 px-3">RECEIPT #</th>
                    <th className="py-2.5 px-3">DATE & TIME</th>
                    <th className="py-2.5 px-3">TYPE</th>
                    <th className="py-2.5 px-3">METHOD</th>
                    <th className="py-2.5 px-3">NOTES</th>
                    <th className="py-2.5 px-3 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {booking.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                        {p.receiptNo}
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{p.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{p.type}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                        {p.notes || '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Rs. {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3px] bg-white dark:bg-slate-900/50">
              No payments recorded yet.
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB 4: FOLIO INVOICE
          ----------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'bill') && (
        <div className="rounded-[4px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-6 space-y-4 shadow-2xs">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                AURA GRAND HOSPITALITY RESORT
              </h3>
              <p className="text-xs text-slate-500">Official Guest Folio Statement</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                FOLIO #{booking.bookingCode}
              </span>
              <p className="text-slate-400 text-[11px]">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 dark:border-slate-800">
                <th className="py-2">Description</th>
                <th className="py-2 text-center w-24">Qty / Nights</th>
                <th className="py-2 text-right w-28">Rate (Rs.)</th>
                <th className="py-2 text-right w-32">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr>
                <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                  Room {booking.room.number} ({booking.room.type})
                </td>
                <td className="py-2.5 text-center font-mono">{booking.nights}</td>
                <td className="py-2.5 text-right font-mono">{booking.room.pricePerNight.toLocaleString()}</td>
                <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {financials.roomCharges.toLocaleString()}
                </td>
              </tr>
              {booking.cafeOrders.map((order) => (
                <tr key={order.id} className="text-slate-600 dark:text-slate-300">
                  <td className="py-2">
                    Café Order #{order.orderNumber} ({order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')})
                  </td>
                  <td className="py-2 text-center font-mono">1</td>
                  <td className="py-2 text-right font-mono">{order.subtotal.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {order.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Charges:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">Rs. {financials.totalCharges.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Payments Received:</span>
              <span className="font-mono font-semibold">- Rs. {financials.totalPaid.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold">
              <span>Balance Due:</span>
              <span
                className={cn(
                  'font-mono text-base',
                  financials.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                Rs. {financials.balanceDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB 5: PAST STAY HISTORY
          ----------------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Past Stay History
          </h3>

          {booking.bookingHistory.length > 0 ? (
            <div className="overflow-hidden rounded-[3px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-2 px-3">BOOKING ID</th>
                    <th className="py-2 px-3">ROOM</th>
                    <th className="py-2 px-3">DATES</th>
                    <th className="py-2 px-3 text-right">AMOUNT</th>
                    <th className="py-2 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {booking.bookingHistory.map((past) => (
                    <tr key={past.bookingCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                        {past.bookingCode}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        Room {past.roomNumber} ({past.roomType})
                      </td>
                      <td className="py-2 px-3 text-slate-500">{past.dates}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {past.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {past.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3px] bg-white dark:bg-slate-900/50">
              No previous stays recorded for this guest.
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: ADD CAFÉ ORDER
          ----------------------------------------------------------------------- */}
      {showAddCafeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-[4px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Add Café Order · Room {booking.room.number}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCafeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCafeOrderSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item
                </label>
                <select
                  value={selectedCafeDishId}
                  onChange={(e) => setSelectedCafeDishId(e.target.value)}
                  className="w-full rounded-[3px] border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#0B3D32] focus:outline-none"
                >
                  {CAFE_MENU_ITEMS.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} (Rs. {dish.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cafeOrderQuantity}
                  onChange={(e) => setCafeOrderQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-[3px] border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#0B3D32] focus:outline-none"
                />
              </div>

              {(() => {
                const dish = CAFE_MENU_ITEMS.find((d) => d.id === selectedCafeDishId);
                const total = (dish?.price || 0) * cafeOrderQuantity;
                return (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Order Total:</span>
                    <span className="font-mono text-slate-900 dark:text-white">Rs. {total.toLocaleString()}</span>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCafeModal(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: RECORD PAYMENT
          ----------------------------------------------------------------------- */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-[4px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Record Payment · {booking.bookingCode}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  autoFocus
                  placeholder="0"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full rounded-[3px] border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#0B3D32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full rounded-[3px] border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#0B3D32] focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="UPI_QR">QR Code</option>
                  <option value="ESEWA_KHALTI">eSewa / Khalti</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Ref / Transaction ID"
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  className="w-full rounded-[3px] border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[#0B3D32] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shadow-2xs"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

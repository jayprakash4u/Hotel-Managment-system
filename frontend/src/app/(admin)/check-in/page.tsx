'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Receipt,
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { RoomWithDetails } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';
const fieldClass =
  'w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors';
const fieldLabelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400';

const StepLabel: React.FC<{ step: number; children: React.ReactNode }> = ({ step, children }) => (
  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
    <span className="flex h-5 w-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] items-center justify-center font-semibold">
      {step}
    </span>
    {children}
  </div>
);

const PAYMENT_METHODS: Array<{ id: 'CASH' | 'CARD' | 'ESEWA_KHALTI' | 'BANK_QR'; label: string; icon: React.ReactNode }> = [
  { id: 'CASH', label: 'Cash Counter', icon: <Wallet className="w-3.5 h-3.5" /> },
  { id: 'ESEWA_KHALTI', label: 'eSewa / Khalti', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'CARD', label: 'Card / POS', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'BANK_QR', label: 'Bank / QR Pay', icon: <Landmark className="w-3.5 h-3.5" /> },
];

function CheckInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [climateFilter, setClimateFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(searchParams.get('room') || '');

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
  const [paymentNote, setPaymentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const roomsData = await api.getRooms();
        setRooms(roomsData);
      } catch (err: any) {
        toast.error('Failed to load rooms', err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE' || r.status === 'INSPECTED');

  const filteredRooms = availableRooms.filter((r) => {
    const isAC =
      r.type.toLowerCase().includes('(ac)') ||
      r.amenities?.some((a) => a.toLowerCase().includes('air conditioning'));
    if (climateFilter === 'AC') return isAC;
    if (climateFilter === 'NON_AC') return !isAC;
    return true;
  });

  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setSelectedRoomId(roomParam);
    } else if (filteredRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(filteredRooms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRooms.length]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  const roomTariffPerNight = selectedRoom?.pricePerNight || 0;
  const totalRoomRent = roomTariffPerNight * nights;

  const depositPaid = paymentChoice === 'PAY_NOW' ? Math.max(0, amountPaidNow) : 0;
  const isFullyPaid = depositPaid >= totalRoomRent && totalRoomRent > 0;
  const remainingBalanceDue = Math.max(0, totalRoomRent - depositPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error('Room Selection Required', 'Please select an available room from the list.');
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
      await api.createReservation({
        firstName: firstName.trim(),
        lastName: lastName.trim() || 'Guest',
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@guest.hotel`,
        idType,
        idNumber: idNumber.trim() || 'N/A',
        roomId: selectedRoomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults,
        specialRequests: paymentNote ? `[Payment Note: ${paymentNote}] ${specialRequests}` : specialRequests,
        isWalkIn: true,
        initialPayment: depositPaid,
      });

      toast.celebrate(
        isFullyPaid ? 'Check-In & Full Payment Completed!' : 'Check-In Complete!',
        `Room ${selectedRoom?.number} assigned to ${firstName} ${lastName}. ${
          isFullyPaid ? 'Bill Paid in Full.' : `Paid: ${formatCurrency(depositPaid)} | Due: ${formatCurrency(remainingBalanceDue)}.`
        }`
      );
      router.push('/active-stays');
    } catch (err: any) {
      toast.error('Check-In Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white font-heading">New Guest Check-In</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Assign room, record guest ID, and collect payment</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`${cardClass} overflow-hidden`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Left Column: Room & Guest Info (7 Cols) */}
          <div className="lg:col-span-7 p-6 space-y-6">
            {/* Step 1: Room Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <StepLabel step={1}>Select Available Room</StepLabel>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  {[
                    { id: 'ALL' as const, label: `All (${availableRooms.length})` },
                    { id: 'AC' as const, label: 'AC Only' },
                    { id: 'NON_AC' as const, label: 'Non-AC' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClimateFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                        climateFilter === tab.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  No clean rooms available in this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-0.5">
                  {filteredRooms.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    const hasAC =
                      room.type.toLowerCase().includes('(ac)') ||
                      room.amenities?.some((a) => a.toLowerCase().includes('air conditioning'));

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-3 rounded-lg border text-left transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/50'
                            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-950/60 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                            Room {room.number}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                            {hasAC ? 'AC' : 'Fan'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">{room.type}</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                          {formatCurrency(room.pricePerNight)}
                          <span className="text-[10px] text-slate-400 font-normal"> /nt</span>
                        </p>

                        {isSelected && (
                          <div className="absolute top-2 right-2 text-amber-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Stay Duration */}
            <div className="space-y-3">
              <StepLabel step={2}>Stay Duration & Guests</StepLabel>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={fieldLabelClass}>Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={fieldLabelClass}>Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={fieldLabelClass}>Guests</label>
                  <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className={fieldClass}>
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests (Couple)</option>
                    <option value={3}>3 Guests (Triple)</option>
                    <option value={4}>4 Guests (Family)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Guest Info & ID Proof */}
            <div className="space-y-3">
              <StepLabel step={3}>Guest Information & ID Proof</StepLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={fieldLabelClass}>First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={fieldLabelClass}>Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={fieldLabelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={fieldLabelClass}>ID Document</label>
                  <select value={idType} onChange={(e) => setIdType(e.target.value)} className={fieldClass}>
                    <option value="Citizenship">Citizenship</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="National ID">National ID</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={fieldLabelClass}>ID / Document #</label>
                  <input
                    type="text"
                    placeholder="e.g. 27-01-78-XXXX"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bill & Payment Settlement (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">Stay Bill & Settlement</h3>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Walk-In Folio
                </span>
              </div>

              {/* Room Tariff Calculation Card */}
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Room Selected</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedRoom ? `Room ${selectedRoom.number} (${selectedRoom.type})` : 'Select a room'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Stay Duration</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {nights} {nights === 1 ? 'Night' : 'Nights'} ({formatDate(checkInDate)} – {formatDate(checkOutDate)})
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Tariff Rate</span>
                  <span>{formatCurrency(roomTariffPerNight)} × {nights} nt</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-semibold text-sm">
                  <span className="text-slate-900 dark:text-white">Total Room Tariff</span>
                  <span className="text-slate-900 dark:text-white font-heading">{formatCurrency(totalRoomRent)}</span>
                </div>
              </div>

              {/* Step 4: Payment */}
              <div className="space-y-3">
                <StepLabel step={4}>Payment at Check-In</StepLabel>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentChoice('PAY_LATER');
                      setAmountPaidNow(0);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paymentChoice === 'PAY_LATER'
                        ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <strong className="text-xs block text-slate-900 dark:text-white font-semibold">Pay Later at Checkout</strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">$0 paid now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentChoice('PAY_NOW');
                      if (amountPaidNow === 0 && totalRoomRent > 0) {
                        setAmountPaidNow(totalRoomRent);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paymentChoice === 'PAY_NOW'
                        ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <strong className="text-xs block text-slate-900 dark:text-white font-semibold">Pay Now</strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Collect payment now</span>
                  </button>
                </div>

                {paymentChoice === 'PAY_NOW' && (
                  <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Amount collected now
                        </label>
                        <button
                          type="button"
                          onClick={() => setAmountPaidNow(totalRoomRent)}
                          className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                        >
                          Full amount ({formatCurrency(totalRoomRent)})
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-sm">
                          Rs.
                        </div>
                        <input
                          type="number"
                          min="1"
                          step="50"
                          placeholder="e.g. 500"
                          value={amountPaidNow || ''}
                          onChange={(e) => setAmountPaidNow(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-11 pl-11 pr-4 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Payment Mode</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                              paymentMethod === method.id
                                ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white'
                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            {method.icon}
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Balance Due Card */}
                <div
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    isFullyPaid
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                      : 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30'
                  }`}
                >
                  <div>
                    <span
                      className={`text-xs font-semibold block ${
                        isFullyPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isFullyPaid
                        ? 'Full payment completed'
                        : paymentChoice === 'PAY_NOW' && depositPaid > 0
                        ? `Partial deposit (paid ${formatCurrency(depositPaid)})`
                        : 'Pay later — full bill due at checkout'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isFullyPaid ? 'Stay is fully settled' : `Remaining balance: ${formatCurrency(remainingBalanceDue)}`}
                    </span>
                  </div>

                  <h4
                    className={`text-lg font-semibold font-heading ${
                      isFullyPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isFullyPaid ? 'Paid' : formatCurrency(remainingBalanceDue)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href="/" className="w-1/3">
                <Button variant="secondary" type="button" className="w-full h-11 text-xs">
                  Cancel
                </Button>
              </Link>

              <Button variant="gold" type="submit" isLoading={isSubmitting} className="w-2/3 h-11 text-xs font-semibold">
                {isFullyPaid ? 'Complete Check-In (Paid in Full)' : 'Complete Check-In'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>}>
      <CheckInPageContent />
    </Suspense>
  );
}

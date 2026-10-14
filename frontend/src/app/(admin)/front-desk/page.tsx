'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  LogIn,
  LogOut,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Receipt,
  RefreshCw,
  CreditCard,
  Banknote,
  DollarSign,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ReservationStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { ReservationData, RoomWithDetails } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PermissionGate } from '@/context/RoleContext';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

const TABS: Array<{ id: 'overview' | 'reservations' | 'arrivals' | 'departures' | 'current_guests'; label: string; icon: any }> = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'reservations', label: 'Reservations Ledger', icon: Receipt },
  { id: 'arrivals', label: 'Expected Arrivals', icon: LogIn },
  { id: 'departures', label: 'Departures & Settle', icon: LogOut },
  { id: 'current_guests', label: 'Current In-House Guests', icon: Users },
];

function FrontDeskContent() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'arrivals' | 'departures' | 'current_guests'>('overview');
  const [loading, setLoading] = useState(true);

  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout & Settlement Modal States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedResForCheckout, setSelectedResForCheckout] = useState<ReservationData | null>(null);
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [extraSundryItem, setExtraSundryItem] = useState<{ desc: string; price: number } | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, roomData] = await Promise.all([api.getReservations(), api.getRooms()]);
      setReservations(resData);
      setRooms(roomData);
    } catch (e: any) {
      toast.error('Failed to load front desk data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckIn = async (id: string) => {
    try {
      await api.checkInGuest(id);
      toast.celebrate('Guest Checked In!', 'Room status switched to Occupied.');
      loadData();
    } catch (e: any) {
      toast.error('Check-in failed', e.message);
    }
  };

  const handleOpenCheckoutModal = (res: ReservationData) => {
    setSelectedResForCheckout(res);
    setExtraSundryItem(null);
    setIsCheckoutModalOpen(true);
  };

  const handleAddSundryToFolio = async (desc: string, price: number) => {
    if (!selectedResForCheckout) return;
    try {
      await api.addFolioItem({
        reservationId: selectedResForCheckout.id,
        outlet: 'MINIBAR',
        description: desc,
        unitPrice: price,
        quantity: 1,
        billedBy: 'Front Desk Checkout',
      });
      toast.success('Added to Bill', `${desc} ($${price.toFixed(2)}) charged to folio.`);
      const updatedRes = await api.getReservation(selectedResForCheckout.id);
      setSelectedResForCheckout(updatedRes);
      loadData();
    } catch (e: any) {
      toast.error('Failed to add sundry', e.message);
    }
  };

  const handleCompleteCheckoutAndSettlement = async () => {
    if (!selectedResForCheckout) return;
    setIsSettling(true);
    try {
      const remainingBalance = Math.max(0, selectedResForCheckout.totalAmount - selectedResForCheckout.paidAmount);
      await api.checkOutGuest(selectedResForCheckout.id, {
        finalPaymentAmount: remainingBalance,
        housekeepingNotes: `Guest checked out with ${checkoutPaymentMode}. Please deep sanitize room ${selectedResForCheckout.room.number}.`,
      });

      toast.celebrate(
        'Checkout Completed & Settled!',
        `Collected ${formatCurrency(remainingBalance)} via ${checkoutPaymentMode}. Room ${selectedResForCheckout.room.number} sent to Housekeeping.`
      );
      setIsCheckoutModalOpen(false);
      setSelectedResForCheckout(null);
      loadData();
    } catch (e: any) {
      toast.error('Settlement & checkout failed', e.message);
    } finally {
      setIsSettling(false);
    }
  };

  const arrivals = reservations.filter((r) => r.status === 'CONFIRMED');
  const departures = reservations.filter((r) => r.status === 'CHECKED_IN');
  const currentGuests = reservations.filter((r) => r.status === 'CHECKED_IN');

  const tabCount = (id: typeof activeTab) =>
    id === 'reservations'
      ? reservations.length
      : id === 'arrivals'
      ? arrivals.length
      : id === 'departures'
      ? departures.length
      : id === 'current_guests'
      ? currentGuests.length
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Front Desk & Reception"
        subtitle="Walk-in check-ins, in-house guest ledger, and complete checkout settlement"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <PermissionGate permission="hotel:reservations:create">
              <Link href="/check-in">
                <Button variant="gold" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  New Check-In
                </Button>
              </Link>
            </PermissionGate>
          </>
        }
      />

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCount(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count !== null && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-900/60 text-current">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expected Arrivals</span>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">{arrivals.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending check-in</p>
            </div>

            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Departures Today</span>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">{departures.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ready for settlement & check-out</p>
            </div>

            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In-House Guests</span>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">{currentGuests.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active suites occupied</p>
            </div>
          </div>

          {/* Rapid Arrival Action Table */}
          <div className={`p-6 ${cardClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Arrivals Requiring Check-In</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{arrivals.length} pending</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Code</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivals.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{res.bookingCode}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {res.guest.firstName} {res.guest.lastName}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      Room {res.room.number} ({res.room.type})
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(res.checkIn)} - {formatDate(res.checkOut)}
                    </TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={res.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleCheckIn(res.id)}
                        leftIcon={<LogIn className="w-3.5 h-3.5" />}
                        className="text-xs py-1 h-7"
                      >
                        Check-In Guest
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="max-w-xs w-full">
            <Input
              placeholder="Search booking code, guest, room..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Code</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Stay Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations
                .filter(
                  (res) =>
                    !searchQuery ||
                    res.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    res.guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    res.guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    res.room.number.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{res.bookingCode}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {res.guest.firstName} {res.guest.lastName}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      Room {res.room.number} ({res.room.type})
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(res.checkIn)} - {formatDate(res.checkOut)}
                    </TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={res.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={res.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(res.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: ARRIVALS */}
      {activeTab === 'arrivals' && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Code</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrivals.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{res.bookingCode}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {res.guest.firstName} {res.guest.lastName}
                  </TableCell>
                  <TableCell className="text-xs font-medium">Room {res.room.number}</TableCell>
                  <TableCell className="text-xs">
                    {formatDate(res.checkIn)} - {formatDate(res.checkOut)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => handleCheckIn(res.id)}
                      leftIcon={<LogIn className="w-3.5 h-3.5" />}
                      className="text-xs py-1 h-7"
                    >
                      Check-In
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: DEPARTURES & SETTLE */}
      {activeTab === 'departures' && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Code</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Total Charges</TableHead>
                <TableHead className="text-right">Advance Paid</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departures.map((res) => {
                const balanceDue = Math.max(0, res.totalAmount - res.paidAmount);
                return (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{res.bookingCode}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {res.guest.firstName} {res.guest.lastName}
                    </TableCell>
                    <TableCell className="text-xs font-medium">Room {res.room.number}</TableCell>
                    <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                      {formatCurrency(res.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(res.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">
                      {formatCurrency(balanceDue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleOpenCheckoutModal(res)}
                        leftIcon={<Receipt className="w-3.5 h-3.5" />}
                        className="text-xs py-1 h-7"
                      >
                        Settle & Check-Out
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 5: CURRENT GUESTS */}
      {activeTab === 'current_guests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentGuests.map((res) => {
            const balanceDue = Math.max(0, res.totalAmount - res.paidAmount);
            return (
              <div key={res.id} className={`p-5 ${cardClass} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-base text-slate-900 dark:text-white">Room {res.room.number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 text-[10px] font-medium">
                    In-House
                  </span>
                </div>
                <div>
                  <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                    {res.guest.firstName} {res.guest.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{res.room.type}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Balance Due</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenCheckoutModal(res)} className="text-xs h-7 w-full">
                    Open Folio & Check-Out
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETE SETTLE & CHECK-OUT MODAL */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Guest Folio Settlement & Check-Out"
        description="Review room charges, F&B and minibar sundries, collect balance, and complete check-out"
        size="lg"
      >
        {selectedResForCheckout && (
          <div className="space-y-5">
            {/* Guest & Room Header */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guest Departing</span>
                <h4 className="font-heading font-semibold text-base text-slate-900 dark:text-white">
                  {selectedResForCheckout.guest.firstName} {selectedResForCheckout.guest.lastName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Room {selectedResForCheckout.room.number} • {selectedResForCheckout.room.type}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Booking Code</span>
                <p className="font-mono text-xs font-medium text-amber-700 dark:text-amber-400">{selectedResForCheckout.bookingCode}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(selectedResForCheckout.checkIn)} — Today</p>
              </div>
            </div>

            {/* Quick Sundries Addition (Water, Cigarettes, Soda) */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Quick minibar / sundry consumption at checkout
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { desc: 'Evian Mineral Water (750ml)', price: 4.0 },
                  { desc: 'Cigarettes & Lighter Pack', price: 15.0 },
                  { desc: 'Cold Can Soda / Coke', price: 3.5 },
                  { desc: 'Gourmet Roasted Nuts', price: 6.0 },
                  { desc: 'Red Bull Energy Drink', price: 5.5 },
                ].map((item) => (
                  <button
                    key={item.desc}
                    type="button"
                    onClick={() => handleAddSundryToFolio(item.desc, item.price)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <span>+ {item.desc}</span>
                    <span className="font-semibold">(${item.price.toFixed(2)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Itemized Folio Items List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Itemized folio breakdown ({selectedResForCheckout.folioItems?.length || 0} items)
              </span>
              <div className="space-y-1.5">
                {(selectedResForCheckout.folioItems || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300">
                        {item.outlet}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{item.description}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals & Settlement Calculation */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Total Accumulated Charges</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(selectedResForCheckout.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Less Advance Deposit Paid</span>
                <span className="font-medium">- {formatCurrency(selectedResForCheckout.paidAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Remaining Balance to Collect</span>
                <span className="text-lg font-semibold text-amber-700 dark:text-amber-400 font-heading">
                  {formatCurrency(Math.max(0, selectedResForCheckout.totalAmount - selectedResForCheckout.paidAmount))}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Settlement Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'CASH', label: 'Cash', icon: Banknote },
                  { mode: 'CARD', label: 'Card', icon: CreditCard },
                  { mode: 'UPI', label: 'Digital / UPI', icon: DollarSign },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.mode}
                      type="button"
                      onClick={() => setCheckoutPaymentMode(pm.mode as any)}
                      className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                        checkoutPaymentMode === pm.mode
                          ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" type="button" onClick={() => setIsCheckoutModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={handleCompleteCheckoutAndSettlement}
                isLoading={isSettling}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Collect Balance & Check-Out
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function FrontDeskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading Front Desk...</div>}>
      <FrontDeskContent />
    </Suspense>
  );
}

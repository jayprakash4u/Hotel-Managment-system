'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { VipBadge, ReservationStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { GuestData } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PermissionGate } from '@/context/RoleContext';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

export default function GuestsPage() {
  const toast = useToast();

  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Guest for Unified Profile Drawer
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [guestDrawerTab, setGuestDrawerTab] = useState<'stays' | 'orders' | 'payments'>('stays');

  // New Guest Modal
  const [isNewGuestOpen, setIsNewGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    country: 'United States',
    vipTier: 'STANDARD',
    preferences: '',
    notes: '',
  });

  const loadGuests = async () => {
    setLoading(true);
    try {
      const data = await api.getGuests();
      setGuests(data);
    } catch (e: any) {
      toast.error('Failed to load guests', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
  }, []);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGuest(guestForm as any);
      toast.celebrate('Guest Created', `${guestForm.firstName} ${guestForm.lastName} registered.`);
      setIsNewGuestOpen(false);
      loadGuests();
    } catch (e: any) {
      toast.error('Failed to create guest', e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Guests & VIP CRM"
        subtitle="Unified guest profiles linked to stays, cafe/restaurant orders, and payment folios"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadGuests} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <PermissionGate permission="people:guests:create">
              <Button variant="gold" size="sm" onClick={() => setIsNewGuestOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Register Guest
              </Button>
            </PermissionGate>
          </>
        }
      />

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="max-w-xs w-full">
          <Input
            placeholder="Search by name, email, or phone..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{guests.length} guest profiles</span>
      </div>

      {/* Guest Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guests
          .filter(
            (g) =>
              !searchQuery ||
              g.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              g.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              g.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((guest) => (
            <div
              key={guest.id}
              onClick={() => {
                setSelectedGuest(guest);
                setIsDrawerOpen(true);
              }}
              className={`p-5 ${cardClass} hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-base text-slate-900 dark:text-white font-heading group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {guest.firstName} {guest.lastName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {guest.country} • ID: {guest.idNumber}
                    </p>
                  </div>
                  <VipBadge tier={guest.vipTier} />
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{guest.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{guest.phone}</span>
                  </p>
                </div>

                {guest.preferences && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {guest.preferences}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Stays: <strong className="font-medium text-slate-900 dark:text-white">{guest.totalStays || 1}</strong>
                </span>
                <span className="font-medium text-amber-700 dark:text-amber-400">{guest.loyaltyPoints.toLocaleString()} pts</span>
              </div>
            </div>
          ))}
      </div>

      {/* UNIFIED GUEST PROFILE SLIDEOVER DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedGuest ? `${selectedGuest.firstName} ${selectedGuest.lastName}` : ''}
        description={selectedGuest ? `${selectedGuest.email} • ${selectedGuest.phone}` : ''}
        width="xl"
      >
        {selectedGuest && (
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">VIP Membership</span>
                <div className="mt-1">
                  <VipBadge tier={selectedGuest.vipTier} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loyalty Rewards</span>
                <p className="text-lg font-semibold text-amber-700 dark:text-amber-400 font-heading">
                  {selectedGuest.loyaltyPoints.toLocaleString()} Pts
                </p>
              </div>
            </div>

            {/* Sub-Tab Navigation for Unified Guest Profile */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              {[
                { id: 'stays' as const, label: 'Stay History' },
                { id: 'orders' as const, label: 'Cafe & Spa Orders' },
                { id: 'payments' as const, label: 'Payments & Folios' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGuestDrawerTab(tab.id)}
                  className={`py-1.5 rounded-md font-medium transition-all ${
                    guestDrawerTab === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: STAYS */}
            {guestDrawerTab === 'stays' && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Stay Ledger ({selectedGuest.reservations?.length || 1})
                </h4>
                <div className="space-y-2">
                  {(selectedGuest.reservations || [
                    {
                      id: 'mock',
                      bookingCode: 'RES-849201',
                      roomNumber: '501',
                      roomType: 'Grand Imperial Presidential Suite',
                      checkIn: new Date(),
                      checkOut: new Date(Date.now() + 86400000 * 3),
                      status: 'CHECKED_IN',
                      totalAmount: 9250,
                    },
                  ]).map((res: any) => (
                    <div key={res.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-medium text-amber-700 dark:text-amber-400">{res.bookingCode}</span>
                        <ReservationStatusBadge status={res.status} />
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">Room {res.roomNumber} — {res.roomType}</p>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                        <span>{formatDate(res.checkIn)} - {formatDate(res.checkOut)}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(res.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ORDERS */}
            {guestDrawerTab === 'orders' && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Outlet Dining & Spa Orders</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Le Ciel Fine Dining: A5 Wagyu & Caviar</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Order ORD-1048 • Charged to Room 501</p>
                    </div>
                    <span className="font-medium text-amber-700 dark:text-amber-400">$251.85</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Zenith Spa: Couple Sunset Sanctuary Ritual</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Wellness appointment • Folio posted</p>
                    </div>
                    <span className="font-medium text-amber-700 dark:text-amber-400">$650.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PAYMENTS */}
            {guestDrawerTab === 'payments' && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment History & Settlement Records</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">Deposit Paid: $5,000.00</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Credit Card (Visa ****4892)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-medium">
                      Settled
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* REGISTER GUEST MODAL */}
      <Modal
        isOpen={isNewGuestOpen}
        onClose={() => setIsNewGuestOpen(false)}
        title="Register New Guest Profile"
        description="Single source of truth profile for CRM, loyalty and stays"
      >
        <form onSubmit={handleCreateGuest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              required
              value={guestForm.firstName}
              onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name *"
              required
              value={guestForm.lastName}
              onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address *"
              type="email"
              required
              value={guestForm.email}
              onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={guestForm.phone}
              onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Passport / National ID"
              value={guestForm.idNumber}
              onChange={(e) => setGuestForm({ ...guestForm, idNumber: e.target.value })}
            />
            <Select
              label="VIP Tier"
              value={guestForm.vipTier}
              onChange={(e) => setGuestForm({ ...guestForm, vipTier: e.target.value })}
            >
              <option value="STANDARD">Standard</option>
              <option value="SILVER">Silver VIP (5% off)</option>
              <option value="GOLD">Gold VIP (10% off)</option>
              <option value="PLATINUM">Platinum VIP (15% off)</option>
              <option value="DIAMOND">Diamond Royal (20% off)</option>
            </Select>
          </div>

          <Input
            label="Special Preferences"
            placeholder="e.g. Feather pillows, sparkling water, almond milk..."
            value={guestForm.preferences}
            onChange={(e) => setGuestForm({ ...guestForm, preferences: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsNewGuestOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save Guest Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

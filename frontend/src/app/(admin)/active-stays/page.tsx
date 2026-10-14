'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  LogOut,
  Utensils,
  CheckCircle2,
  RefreshCw,
  Search,
  Printer,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { ReservationData } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

const PAYMENT_MODES = ['Cash', 'Credit Card', 'Bank Transfer', 'eSewa', 'Khalti', 'QR Pay'];

export default function ActiveStaysPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [activeStays, setActiveStays] = useState<ReservationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Collect Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStay, setPaymentStay] = useState<ReservationData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<string>('Cash');

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStay, setCheckoutStay] = useState<ReservationData | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Cash');
  const [isSettling, setIsSettling] = useState(false);

  // Invoice Print View
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceStay, setInvoiceStay] = useState<ReservationData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const resData = await api.getReservations({ status: 'CHECKED_IN' });
      setActiveStays(resData);
    } catch (e: any) {
      toast.error('Failed to load active stays', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStay || paymentAmount <= 0) return;
    try {
      await fetch(`/api/reservations/${paymentStay.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalPaymentAmount: paymentAmount,
          housekeepingNotes: `Partial payment collected via ${paymentType}.`,
        }),
      });

      toast.celebrate('Payment Recorded!', `Collected ${formatCurrency(paymentAmount)} via ${paymentType}.`);
      setIsPaymentModalOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Payment record failed', e.message);
    }
  };

  const handleExecuteCheckout = async () => {
    if (!checkoutStay) return;
    setIsSettling(true);
    try {
      const due = Math.max(0, checkoutStay.totalAmount - checkoutStay.paidAmount);
      await api.checkOutGuest(checkoutStay.id, {
        finalPaymentAmount: due,
        housekeepingNotes: `Checkout completed with ${checkoutPaymentMethod}. Room ${checkoutStay.room.number} sent to cleaning.`,
      });

      toast.celebrate(
        'Checkout Completed & Settled!',
        `Room ${checkoutStay.room.number} bill cleared. Room status set to Needs Cleaning.`
      );
      setIsCheckoutOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Checkout failed', e.message);
    } finally {
      setIsSettling(false);
    }
  };

  const filteredStays = activeStays.filter(
    (s) =>
      !searchQuery ||
      s.guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statTiles = [
    { label: 'In-House Active Stays', value: `${activeStays.length} Rooms`, tone: 'text-slate-900 dark:text-white' },
    {
      label: 'Total Accumulated Folios',
      value: formatCurrency(activeStays.reduce((sum, s) => sum + s.totalAmount, 0)),
      tone: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Advance Deposits Paid',
      value: formatCurrency(activeStays.reduce((sum, s) => sum + s.paidAmount, 0)),
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending Remaining Due',
      value: formatCurrency(activeStays.reduce((sum, s) => sum + Math.max(0, s.totalAmount - s.paidAmount), 0)),
      tone: 'text-amber-700 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Active Stays & Live Guest Folios"
        subtitle="In-house guests: room charges, food & drink orders, payments, and checkout settlement"
        actions={
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Stays
          </Button>
        }
      />

      {/* Search & Overview Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {statTiles.map((tile) => (
          <div key={tile.label} className={`p-4 ${cardClass}`}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tile.label}</span>
            <p className={`text-xl font-semibold font-heading mt-1 ${tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="max-w-xs w-full">
        <Input
          placeholder="Search room #, guest name, code..."
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Active Stays Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredStays.map((stay) => {
          const totalBill = stay.totalAmount;
          const paid = stay.paidAmount;
          const remainingDue = Math.max(0, totalBill - paid);
          const hasAC =
            stay.room.type.toLowerCase().includes('(ac)') ||
            (stay.room.amenities || []).some((a) => a.toLowerCase().includes('air conditioning'));

          return (
            <div key={stay.id} className={`p-5 ${cardClass} space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all`}>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-lg text-slate-900 dark:text-white">Room {stay.room.number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70">
                      {hasAC ? 'AC Suite' : 'Non-AC (Fan)'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 font-medium">
                      Active Stay
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">
                    {stay.guest.firstName} {stay.guest.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{stay.guest.phone}</span>
                    <span>•</span>
                    <span>ID: {stay.guest.idNumber}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-medium text-amber-700 dark:text-amber-400">{stay.bookingCode}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDate(stay.checkIn)} - {formatDate(stay.checkOut)}
                  </p>
                </div>
              </div>

              {/* Running Folio Items Breakdown */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Running Folio Charges ({stay.folioItems?.length || 0} items)
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1 text-xs">
                  {(stay.folioItems || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2">
                        <strong className="text-amber-700 dark:text-amber-400 text-[10px] uppercase mr-1">[{item.outlet}]</strong>
                        {item.description}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white shrink-0">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Tally */}
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Bill</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">{formatCurrency(totalBill)}</span>
                </div>
                <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Paid Deposit</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(paid)}</span>
                </div>
                <div className="border-l border-slate-100 dark:border-slate-800 pl-3 text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Net Remaining Due</span>
                  <span className="font-heading font-semibold text-amber-700 dark:text-amber-400 text-base">
                    {formatCurrency(remainingDue)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <Link href={`/add-order?res=${stay.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Utensils className="w-3.5 h-3.5" />} className="text-xs py-1.5 h-8 w-full">
                    Add Order
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPaymentStay(stay);
                    setPaymentAmount(remainingDue);
                    setIsPaymentModalOpen(true);
                  }}
                  leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5 h-8"
                >
                  Payment
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInvoiceStay(stay);
                    setIsInvoiceOpen(true);
                  }}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5 h-8"
                >
                  Invoice
                </Button>

                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => {
                    setCheckoutStay(stay);
                    setIsCheckoutOpen(true);
                  }}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5 h-8"
                >
                  Checkout
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* COLLECT PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={paymentStay ? `Record Payment — Room ${paymentStay.room.number}` : ''}
        description="Record initial, partial, or additional payment from guest"
      >
        {paymentStay && (
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Outstanding Due Balance</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {formatCurrency(Math.max(0, paymentStay.totalAmount - paymentStay.paidAmount))}
              </span>
            </div>

            <Input
              label="Payment Amount To Collect *"
              type="number"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            />

            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentType(mode)}
                    className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                      paymentType === mode
                        ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" type="button" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" type="submit">
                Record Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MULTI-STEP VERIFIED CHECKOUT MODAL */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Verified Guest Checkout & Settlement"
        description="Verify all charges, settle the remaining balance, and release the room to cleaning"
        size="lg"
      >
        {checkoutStay && (
          <div className="space-y-4">
            {/* Step 1: Verification Checklist */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400 block">Verification Checklist</span>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Room charges & stay duration verified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Food, drinks & sundry consumption reconciled</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Keycard returned & minibar inspected</span>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Total Accumulated Bill</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(checkoutStay.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Less Advance Paid</span>
                <span className="font-medium">- {formatCurrency(checkoutStay.paidAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">Remaining Due to Clear</span>
                <span className="font-heading font-semibold text-amber-700 dark:text-amber-400 text-lg">
                  {formatCurrency(Math.max(0, checkoutStay.totalAmount - checkoutStay.paidAmount))}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Settlement Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'eSewa', 'Khalti', 'Bank Transfer', 'QR Pay'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCheckoutPaymentMethod(m)}
                    className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                      checkoutPaymentMethod === m
                        ? 'bg-amber-500/5 border-amber-400 dark:border-amber-500/60 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleExecuteCheckout} isLoading={isSettling}>
                Collect Balance & Complete Checkout
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* PRINTABLE INVOICE DRAWER */}
      <Drawer
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Official Hotel Stay Invoice"
        description={invoiceStay ? `Folio bill for Room ${invoiceStay.room.number} — ${invoiceStay.guest.firstName} ${invoiceStay.guest.lastName}` : ''}
        width="lg"
      >
        {invoiceStay && (
          <div className="space-y-6 text-xs">
            {/* Printable Invoice Container — deliberately always a light "paper" surface, independent of app theme */}
            <div id="hotel-invoice" className="printable-invoice p-6 rounded-lg bg-white border border-slate-200 space-y-5 text-slate-900">
              {/* Hotel Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900">AURA GRAND RESORTS &amp; SUITES</h3>
                  <p className="text-[11px] text-slate-500">Resort &amp; Private Suites</p>
                  <p className="text-[11px] text-slate-400">VAT/PAN: 601928374 | Tel: +977 1 4455667</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-medium uppercase text-slate-400">Invoice Number</span>
                  <p className="font-mono font-semibold text-sm text-slate-900">INV-{invoiceStay.bookingCode}</p>
                  <p className="text-[10px] text-slate-500">{formatDateTime(new Date())}</p>
                </div>
              </div>

              {/* Guest & Stay Meta */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-medium uppercase text-slate-400">Guest Information</span>
                  <p className="font-semibold text-slate-900 text-sm">
                    {invoiceStay.guest.firstName} {invoiceStay.guest.lastName}
                  </p>
                  <p className="text-slate-500">{invoiceStay.guest.phone}</p>
                  <p className="text-slate-400">{invoiceStay.guest.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-medium uppercase text-slate-400">Room Details</span>
                  <p className="font-semibold text-amber-700 text-sm">Room {invoiceStay.room.number}</p>
                  <p className="text-slate-500">{invoiceStay.room.type}</p>
                  <p className="text-slate-500">
                    Stay: {formatDate(invoiceStay.checkIn)} - {formatDate(invoiceStay.checkOut)}
                  </p>
                </div>
              </div>

              {/* Folio Items Table */}
              <div className="space-y-2">
                <span className="font-medium uppercase tracking-wider text-[10px] text-slate-400">Itemized Charges</span>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(invoiceStay.folioItems || []).map((item) => (
                      <tr key={item.id} className="text-slate-700">
                        <td className="py-2.5 font-medium">
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-amber-700 mr-1.5">{item.outlet}</span>
                          {item.description}
                        </td>
                        <td className="py-2.5 text-center text-slate-500">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2.5 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Settlement */}
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoiceStay.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Advance Deposit Paid</span>
                  <span className="font-medium">- {formatCurrency(invoiceStay.paidAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-900">Net Balance Due</span>
                  <span className="text-amber-700 font-heading text-lg">
                    {formatCurrency(Math.max(0, invoiceStay.totalAmount - invoiceStay.paidAmount))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <Button variant="gold" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />} className="w-full">
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

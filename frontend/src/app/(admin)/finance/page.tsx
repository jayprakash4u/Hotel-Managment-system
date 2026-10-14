'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Banknote,
  TrendingDown,
  Plus,
  Printer,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { ReservationData } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime, calculateFolio } from '@/lib/utils';
import { PermissionGate } from '@/context/RoleContext';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

interface ExpenseItem {
  id: string;
  expenseCode: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
  paidTo: string;
  paidBy: string;
  date: string;
}

interface CashRegisterData {
  id: string;
  shift: string;
  cashierName: string;
  openingFloat: number;
  closingCash?: number;
  cashSales: number;
  cardSales: number;
  roomCharges: number;
  expensesPaid: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
}

const TABS: Array<{ id: 'folios' | 'register' | 'expenses'; label: string; icon: any }> = [
  { id: 'folios', label: 'Folios & Invoices', icon: Receipt },
  { id: 'register', label: 'Cash Register & Shift Tally', icon: Banknote },
  { id: 'expenses', label: 'Operating Expenses', icon: TrendingDown },
];

export default function FinancePage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'folios' | 'register' | 'expenses'>('folios');
  const [loading, setLoading] = useState(true);

  // Data states
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegisterData | null>(null);

  // Selected Folio for Invoice Drawer
  const [selectedRes, setSelectedRes] = useState<ReservationData | null>(null);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  // Modals
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    outlet: 'MINIBAR',
    description: 'Minibar Champagne & Snacks',
    unitPrice: 75,
    quantity: 1,
  });

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Kitchen Supplies',
    description: 'Fresh local herbs and fruit market purchase',
    amount: 85,
    paymentMode: 'CASH_REGISTER',
    paidTo: 'Organic Fresh Markets',
  });

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    action: 'OPEN',
    shift: 'Evening Shift (15:00 - 23:30)',
    cashierName: 'Marcus Vance',
    openingFloat: 500,
    closingCash: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, expRes, regRes] = await Promise.all([
        api.getReservations(),
        fetch('/api/finance/expenses').then((r) => r.json()),
        fetch('/api/finance/cash-register').then((r) => r.json()),
      ]);

      setReservations(resData);
      if (expRes.success) setExpenses(expRes.data);
      if (regRes.success && regRes.data.active) setActiveRegister(regRes.data.active);
    } catch (e: any) {
      toast.error('Failed to load finance data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Post Manual Folio Charge
  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;

    try {
      await api.addFolioItem({
        reservationId: selectedRes.id,
        outlet: chargeForm.outlet,
        description: chargeForm.description,
        unitPrice: chargeForm.unitPrice,
        quantity: chargeForm.quantity,
      });

      toast.success('Charge Posted to Folio', `${chargeForm.description} added.`);
      setIsAddChargeOpen(false);
      loadData();
      // Update local selectedRes
      const updatedRes = await api.getReservation(selectedRes.id);
      setSelectedRes(updatedRes);
    } catch (e: any) {
      toast.error('Failed to post charge', e.message);
    }
  };

  // Settle Bill / Record Payment
  const handleSettleFolio = async (resId: string, amountToPay: number) => {
    try {
      await api.checkOutGuest(resId, { finalPaymentAmount: amountToPay });
      toast.celebrate('Payment Settled & Guest Checked Out!', 'Folio marked as Paid.');
      setIsInvoiceDrawerOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Payment settlement failed', e.message);
    }
  };

  // Record Operating Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Expense Voucher Recorded', `${formatCurrency(expenseForm.amount)} logged.`);
      setIsAddExpenseOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Expense logging failed', e.message);
    }
  };

  // Shift Management (Open / Close Cash Register)
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        action: shiftForm.action,
        shift: shiftForm.shift,
        cashierName: shiftForm.cashierName,
        openingFloat: shiftForm.openingFloat,
        closingCash: shiftForm.closingCash,
      };
      if (shiftForm.action === 'CLOSE' && activeRegister) {
        payload.id = activeRegister.id;
      }

      const res = await fetch('/api/finance/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate(
        shiftForm.action === 'OPEN' ? 'Shift Float Opened!' : 'Shift Closed & Reconciled!',
        'Register audit logged.'
      );
      setIsShiftModalOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Register action failed', e.message);
    }
  };

  const selectedFolioSummary = selectedRes
    ? calculateFolio(selectedRes.folioItems || [], selectedRes.paidAmount, 0)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Finance & Cash Register"
        subtitle="Itemized folios, printable invoices, payment settlements, shift cash floats and expense vouchers"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <PermissionGate permission="finance:expenses:create">
              <Button variant="outline" size="sm" onClick={() => setIsAddExpenseOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Record Expense
              </Button>
            </PermissionGate>
            <PermissionGate permission="finance:cash_register:open_shift">
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setShiftForm({
                    action: activeRegister ? 'CLOSE' : 'OPEN',
                    shift: 'Day Shift',
                    cashierName: 'Elena Rostova',
                    openingFloat: 500,
                    closingCash: activeRegister ? activeRegister.openingFloat + activeRegister.cashSales - activeRegister.expensesPaid : 0,
                  });
                  setIsShiftModalOpen(true);
                }}
                leftIcon={activeRegister ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              >
                {activeRegister ? 'Close Register Shift' : 'Open Shift Float'}
              </Button>
            </PermissionGate>
          </>
        }
      />

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'folios' ? reservations.length : tab.id === 'expenses' ? expenses.length : null;

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
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-900/60 text-current">{count}</span>
              )}
              {tab.id === 'register' && activeRegister && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-medium">
                  Shift Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FOLIOS & INVOICES */}
      {activeTab === 'folios' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Code</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Folio Items</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Total Billed</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((res) => {
              const total = res.totalAmount || 0;
              const paid = res.paidAmount || 0;
              const balance = Math.max(0, total - paid);

              return (
                <TableRow key={res.id}>
                  <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{res.bookingCode}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {res.guest.firstName} {res.guest.lastName}
                  </TableCell>
                  <TableCell className="text-xs font-medium">Room {res.room.number}</TableCell>
                  <TableCell className="text-xs">
                    {res.folioItems?.length || 1} line item{(res.folioItems?.length || 1) > 1 ? 's' : ''}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={res.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900 dark:text-white">{formatCurrency(total)}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(paid)}</TableCell>
                  <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(balance)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRes(res);
                        setIsInvoiceDrawerOpen(true);
                      }}
                      leftIcon={<Receipt className="w-3.5 h-3.5" />}
                      className="text-xs py-1 h-7"
                    >
                      Inspect Folio
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* TAB 2: CASH REGISTER & SHIFTS */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {activeRegister ? (
            <div className={`p-6 ${cardClass} space-y-6`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">Active Shift Cash Register</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Opened at {formatDateTime(activeRegister.openedAt)} by {activeRegister.cashierName}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {activeRegister.shift}
                </span>
              </div>

              {/* Stat Tally Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Opening Float</span>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">{formatCurrency(activeRegister.openingFloat)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cash Sales</span>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(activeRegister.cashSales)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Card & Room Postings</span>
                  <p className="text-xl font-semibold text-amber-700 dark:text-amber-400 mt-1">
                    {formatCurrency(activeRegister.cardSales + activeRegister.roomCharges)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expected Drawer Cash</span>
                  <p className="text-xl font-semibold text-amber-700 dark:text-amber-400 mt-1">
                    {formatCurrency(activeRegister.openingFloat + activeRegister.cashSales - activeRegister.expensesPaid)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setShiftForm({
                      action: 'CLOSE',
                      shift: activeRegister.shift,
                      cashierName: activeRegister.cashierName,
                      openingFloat: activeRegister.openingFloat,
                      closingCash: activeRegister.openingFloat + activeRegister.cashSales - activeRegister.expensesPaid,
                    });
                    setIsShiftModalOpen(true);
                  }}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  Close Shift & Settle Drawer
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
              <Lock className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cash Register is Currently Closed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Open a shift with an initial opening cash float to begin receiving cash payments at the front desk and outlets.
              </p>
              <Button
                variant="gold"
                size="md"
                className="mt-5"
                onClick={() => {
                  setShiftForm({
                    action: 'OPEN',
                    shift: 'Day Shift (07:00 - 15:30)',
                    cashierName: 'Elena Rostova',
                    openingFloat: 500,
                    closingCash: 0,
                  });
                  setIsShiftModalOpen(true);
                }}
                leftIcon={<Unlock className="w-4 h-4" />}
              >
                Open Shift Float
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Paid To</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{exp.expenseCode}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-white text-xs">{exp.category}</TableCell>
                <TableCell className="text-xs">{exp.description}</TableCell>
                <TableCell className="text-xs">{exp.paidTo}</TableCell>
                <TableCell>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {exp.paymentMode.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(exp.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* INVOICE & FOLIO INSPECTION DRAWER */}
      <Drawer
        isOpen={isInvoiceDrawerOpen}
        onClose={() => setIsInvoiceDrawerOpen(false)}
        title={selectedRes ? `Guest Folio — ${selectedRes.guest.firstName} ${selectedRes.guest.lastName}` : ''}
        description={selectedRes ? `Booking: ${selectedRes.bookingCode} • Room ${selectedRes.room.number}` : ''}
        width="xl"
      >
        {selectedRes && selectedFolioSummary && (
          <div className="space-y-6">
            {/* Printable Invoice — deliberately a light "paper" surface, independent of app theme */}
            <div className="printable-invoice p-5 rounded-lg bg-white border border-slate-200 space-y-4 text-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">AURA GRAND RESORTS &amp; SUITES</h4>
                  <p className="text-[11px] text-slate-500">Resort &amp; Private Suites</p>
                  <p className="text-[11px] text-slate-400">Tax Registration: US-TAX-9482103</p>
                </div>
                <QRCodeSVG value={`https://auragrand.com/verify?code=${selectedRes.bookingCode}`} size={56} bgColor="#ffffff" fgColor="#0f172a" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400">Guest:</span>{' '}
                  <strong className="text-slate-700 font-medium">{selectedRes.guest.firstName} {selectedRes.guest.lastName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Room:</span>{' '}
                  <strong className="text-slate-700 font-medium">Room {selectedRes.room.number} ({selectedRes.room.type})</strong>
                </div>
                <div>
                  <span className="text-slate-400">Stay Dates:</span>{' '}
                  <span className="text-slate-600">{formatDate(selectedRes.checkIn)} - {formatDate(selectedRes.checkOut)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>{' '}
                  <strong className="text-amber-700 font-medium">{selectedRes.status}</strong>
                </div>
              </div>
            </div>

            {/* Actions (Add Item / Print) */}
            <div className="flex items-center justify-between no-print">
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Itemized Folio Transactions ({selectedRes.folioItems?.length || 0})
              </h4>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddChargeOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />} className="text-xs py-1 h-7">
                  Add Charge
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-3.5 h-3.5" />} className="text-xs py-1 h-7">
                  Print Bill
                </Button>
              </div>
            </div>

            {/* Folio Items Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Outlet</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {(selectedRes.folioItems || []).map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400">{formatDate(item.timestamp)}</td>
                      <td className="p-2.5 font-medium text-amber-700 dark:text-amber-400">{item.outlet.replace('_', ' ')}</td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-200">{item.description}</td>
                      <td className="p-2.5 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Lodging & Amenities Subtotal</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(selectedFolioSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Occupancy & Sales Tax (10%)</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(selectedFolioSummary.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Service Charge (5%)</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(selectedFolioSummary.serviceChargeAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Folio Amount</span>
                <span className="font-heading text-amber-700 dark:text-amber-400 text-base">{formatCurrency(selectedFolioSummary.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Total Paid to Date</span>
                <span className="font-medium">{formatCurrency(selectedRes.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-amber-700 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Outstanding Balance Due</span>
                <span>{formatCurrency(selectedFolioSummary.balanceDue)}</span>
              </div>
            </div>

            {/* Settlement Action */}
            {selectedFolioSummary.balanceDue > 0 ? (
              <Button
                variant="gold"
                size="lg"
                className="w-full text-sm"
                onClick={() => handleSettleFolio(selectedRes.id, selectedFolioSummary.balanceDue)}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Settle Balance & Complete Checkout ({formatCurrency(selectedFolioSummary.balanceDue)})
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center font-medium text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Folio is Fully Settled & Reconciled</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ADD MANUAL FOLIO CHARGE MODAL */}
      <Modal
        isOpen={isAddChargeOpen}
        onClose={() => setIsAddChargeOpen(false)}
        title="Post Charge to Guest Folio"
        description="Add minibar, spa package, transfer, or manual adjustment to the active reservation folio"
      >
        <form onSubmit={handlePostCharge} className="space-y-4">
          <Select label="Outlet / Category" value={chargeForm.outlet} onChange={(e) => setChargeForm({ ...chargeForm, outlet: e.target.value })}>
            <option value="MINIBAR">Minibar Consumables</option>
            <option value="ZENITH_SPA">Spa & Wellness Treatment</option>
            <option value="RESTAURANT">Dining / Restaurant Charge</option>
            <option value="ROOFTOP_BAR">Skyline Bar / Drinks</option>
            <option value="ROOM_SERVICE">Room Service Extra</option>
            <option value="LAUNDRY">Express Laundry</option>
            <option value="TRANSPORT">Limousine / Airport Transfer</option>
            <option value="DISCOUNT">Manager Discretionary Discount (-)</option>
          </Select>

          <Input
            label="Item Description *"
            required
            placeholder="e.g. Laurent-Perrier Champagne 375ml"
            value={chargeForm.description}
            onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Price ($) *"
              type="number"
              required
              value={chargeForm.unitPrice}
              onChange={(e) => setChargeForm({ ...chargeForm, unitPrice: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Quantity *"
              type="number"
              required
              value={chargeForm.quantity}
              onChange={(e) => setChargeForm({ ...chargeForm, quantity: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddChargeOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Post to Folio
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECORD OPERATING EXPENSE MODAL */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Operating Expense"
        description="Log vendor payments, market purchases, or maintenance expenses"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Select label="Expense Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
            <option value="Kitchen Supplies">Kitchen Supplies & Produce</option>
            <option value="Maintenance Supplies">Maintenance & Engineering Parts</option>
            <option value="Housekeeping Supplies">Housekeeping & Cleaning Materials</option>
            <option value="Utilities & Power">Utilities & Power</option>
            <option value="Staff Welfare">Staff Welfare & Meals</option>
            <option value="Marketing">Marketing & Promotion</option>
          </Select>

          <Input
            label="Description *"
            required
            placeholder="e.g. Organic micro-greens and fresh truffles"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($) *"
              type="number"
              required
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
            />
            <Select label="Payment Source" value={expenseForm.paymentMode} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}>
              <option value="CASH_REGISTER">Cash Register Drawer</option>
              <option value="BANK_TRANSFER">Bank Wire Transfer</option>
              <option value="CORPORATE_CARD">Corporate Card</option>
            </Select>
          </div>

          <Input
            label="Paid To (Vendor / Payee) *"
            required
            placeholder="e.g. Green Valley Farm"
            value={expenseForm.paidTo}
            onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Log Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* OPEN / CLOSE SHIFT MODAL */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title={shiftForm.action === 'OPEN' ? 'Open Cash Register Shift Float' : 'Close Shift & Reconcile Tally'}
        description="Reconcile physical cash in drawer against system sales"
      >
        <form onSubmit={handleShiftSubmit} className="space-y-4">
          <Input label="Cashier / Shift Lead" value={shiftForm.cashierName} onChange={(e) => setShiftForm({ ...shiftForm, cashierName: e.target.value })} />

          <Select label="Shift Schedule" value={shiftForm.shift} onChange={(e) => setShiftForm({ ...shiftForm, shift: e.target.value })}>
            <option value="Morning Shift (07:00 - 15:30)">Morning Shift (07:00 - 15:30)</option>
            <option value="Evening Shift (15:00 - 23:30)">Evening Shift (15:00 - 23:30)</option>
            <option value="Night Shift (23:00 - 07:30)">Night Shift (23:00 - 07:30)</option>
          </Select>

          {shiftForm.action === 'OPEN' ? (
            <Input
              label="Opening Cash Float ($)"
              type="number"
              value={shiftForm.openingFloat}
              onChange={(e) => setShiftForm({ ...shiftForm, openingFloat: parseFloat(e.target.value) || 0 })}
            />
          ) : (
            <Input
              label="Closing Physical Cash Count ($)"
              type="number"
              value={shiftForm.closingCash}
              onChange={(e) => setShiftForm({ ...shiftForm, closingCash: parseFloat(e.target.value) || 0 })}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              {shiftForm.action === 'OPEN' ? 'Start Shift' : 'Submit & Close Shift'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

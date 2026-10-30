'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
} from 'lucide-react';
import { BillData } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency } from '@/lib/utils';

export interface RecordPaymentModalProps {
  bill: BillData | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (updatedBill: BillData) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const toast = useToast();

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Cashier');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default amount to remaining balance when modal opens
  React.useEffect(() => {
    if (bill) {
      setAmount(bill.balanceDue.toString());
      setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
      setNotes(`Payment against ${bill.billNumber}`);
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const numAmount = parseFloat(amount) || 0;
  const isOverpaying = numAmount > bill.balanceDue + 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.warning('Invalid Amount', 'Payment amount must be greater than zero.');
      return;
    }

    if (isOverpaying) {
      toast.warning('Overpayment', `Amount cannot exceed balance due (Rs. ${bill.balanceDue.toLocaleString()}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = transactionRef || `PAY-${bill.id}-${Date.now()}`;
      const updated = await api.recordBillPayment(bill.id, {
        amount: numAmount,
        paymentMethod,
        transactionRef,
        receivedBy,
        notes,
        idempotencyKey,
      });

      toast.celebrate(
        'Payment Recorded!',
        `Rs. ${numAmount.toLocaleString()} received via ${paymentMethod} for Bill ${bill.billNumber}.`
      );
      onPaymentSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Could not record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE3DF] dark:border-[#145447] bg-[#F8FAF9] dark:bg-[#07241E]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-emerald-600 text-white">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#24352F] dark:text-white">
                Record Payment
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Bill #{bill.billNumber} · {bill.billingType}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Outstanding Balance Banner */}
          <div className="p-3 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Outstanding Balance Due
              </span>
              <span className="text-lg font-black font-mono text-emerald-900 dark:text-white">
                Rs. {bill.balanceDue.toLocaleString()}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-600 dark:text-slate-400">
              <div>Total: Rs. {bill.grandTotal.toLocaleString()}</div>
              <div>Paid: Rs. {bill.amountPaid.toLocaleString()}</div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Payment Amount (NPR) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(bill.balanceDue.toString())}
                className="text-[10px] text-emerald-600 font-semibold hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                Rs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={bill.balanceDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            {isOverpaying && (
              <p className="text-[10px] text-rose-500 mt-1">
                Amount cannot exceed remaining balance due.
              </p>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'UPI', label: 'Fonepay / QR', icon: QrCode },
                { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-[3px] border text-left font-semibold transition-all cursor-pointer',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-white'
                        : 'border-[#DCE3DF] dark:border-[#145447] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26]'
                    )}
                  >
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference # and Received By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Reference / Receipt #
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. TXN-102934"
                className="w-full px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Received By
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Staff name"
                className="w-full px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Payment Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Settle remaining restaurant bill"
              className="w-full px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-[#DCE3DF] dark:border-[#145447] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#07241E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || isOverpaying}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording...' : `Confirm Settle (Rs. ${numAmount.toLocaleString()})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

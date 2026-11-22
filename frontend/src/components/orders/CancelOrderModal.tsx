'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { ActiveRestaurantOrderData } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const formatNpr = (val: number) => {
  return `Rs. ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export interface CancelOrderModalProps {
  isOpen: boolean;
  order: ActiveRestaurantOrderData | null;
  onClose: () => void;
  onOrderCancelled: () => void;
  currentUser?: { name?: string };
}

const COMMON_REASONS = [
  'Customer changed mind',
  'Entered by mistake / duplicate order',
  'Items unavailable / kitchen stockout',
  'Guest requested cancellation',
  'Table vacated without dining',
  'Payment declined / customer left',
  'Other reason',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onOrderCancelled,
  currentUser,
}) => {
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customRemarks, setCustomRemarks] = useState('');
  const [staffName, setStaffName] = useState(currentUser?.name || 'Manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirmCancel = async () => {
    if (order.status === 'CANCELLED') {
      toast.warning('Order is already cancelled.');
      onClose();
      return;
    }

    const finalReason =
      selectedReason === 'Other reason'
        ? customRemarks.trim() || 'No reason specified'
        : customRemarks.trim()
        ? `${selectedReason} - ${customRemarks.trim()}`
        : selectedReason;

    setIsSubmitting(true);
    try {
      const cancelNote = `[Cancelled by ${staffName} on ${new Date().toLocaleString()}]: ${finalReason}`;
      await api.updateRestaurantOrderStatus(order.id, {
        status: 'CANCELLED',
        notes: cancelNote,
      });

      toast.success(`Order ${order.orderNumber} successfully cancelled. Table and stock updated.`);
      onOrderCancelled();
      onClose();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      toast.error(err.message || 'Failed to cancel order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel Order #{order.orderNumber}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to cancel this order?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Order Quick Summary */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.customerName || 'Walk-in Customer'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Source:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.room?.number ? `Room ${order.room.number}` : order.orderType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Items Count:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.items?.length || 0} items
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Order Amount:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatNpr(order.total)}
              </span>
            </div>
          </div>

          {/* Cancellation Reason Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Remarks / Justification
            </label>
            <textarea
              rows={2}
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              placeholder="Provide context or explanation for auditing..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Authorized Staff Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Authorized By (Staff Member)
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Reversal Guarantee Note */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">Workflow Safeguards:</span> Cancelling this order will release any occupied table, stop active kitchen/bar preparation, and safely reverse deducted inventory if applicable. Order history remains preserved for auditing.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cancelling Order...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { InventoryItemData } from '@/lib/types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItemData[];
  onSuccess?: () => void;
  initialItemId?: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
  initialItemId,
}) => {
  const toast = useToast();

  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || (items[0]?.id || ''));
  const [adjustmentType, setAdjustmentType] = useState<string>('ADJUSTMENT_INCREASE');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [performedBy, setPerformedBy] = useState<string>('Inventory Manager');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  if (!isOpen) return null;

  const isIncrease = adjustmentType === 'ADJUSTMENT_INCREASE';
  const currentStock = selectedItem ? selectedItem.currentStock : 0;
  const isTracked = selectedItem?.trackStock ?? true;
  const previewNewStock = isTracked
    ? isIncrease
      ? currentStock + quantity
      : Math.max(0, currentStock - quantity)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error('Selection Missing', 'Please select an item to adjust.');
      return;
    }
    if (quantity <= 0) {
      toast.error('Invalid Quantity', 'Adjustment quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordStockAdjustment({
        itemId: selectedItemId,
        adjustmentType,
        quantity,
        reason: reason.trim() || undefined,
        performedBy: performedBy.trim() || 'Inventory Manager',
      });

      toast.success(
        'Stock Adjusted',
        `Stock for ${selectedItem?.name} updated to ${res.item?.currentStock} ${selectedItem?.unit}. (Ref: ${res.referenceNumber})`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit adjustment:', err);
      toast.error('Adjustment Failed', err.message || 'Could not record stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#071F1A] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl space-y-4 font-sans select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Stock Adjustment
              </h3>
              <p className="text-[11px] text-slate-400">
                Correct stock counts, record wastage, damages, or shrinkage with an audited log.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Select Item */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Inventory Item *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-[#00A884]"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.sku}) · Available: {i.trackStock ? `${i.currentStock} ${i.unit}` : 'Not Tracked'} [{i.department}]
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Adjustment Type *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { id: 'ADJUSTMENT_INCREASE', label: 'Stock Increase (+)', color: 'text-emerald-700' },
                { id: 'ADJUSTMENT_DECREASE', label: 'Stock Decrease (-)', color: 'text-rose-700' },
                { id: 'DAMAGED_STOCK', label: 'Damaged Stock (-)', color: 'text-rose-800' },
                { id: 'EXPIRED_STOCK', label: 'Expired Stock (-)', color: 'text-red-800' },
                { id: 'WASTAGE', label: 'Wastage (-)', color: 'text-orange-800' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAdjustmentType(opt.id)}
                  className={cn(
                    'p-2 rounded-md border text-left text-xs font-semibold transition-all cursor-pointer',
                    adjustmentType === opt.id
                      ? 'border-[#00A884] bg-emerald-50/50 dark:bg-emerald-950/30 text-[#00A884] ring-1 ring-[#00A884]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className={opt.color}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Stock Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold text-xs focus:outline-none focus:border-[#00A884]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Unit
              </label>
              <input
                type="text"
                disabled
                value={selectedItem?.unit || 'pieces'}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-semibold capitalize"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          {selectedItem && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Current Stock</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                  {isTracked ? `${currentStock} ${selectedItem.unit}` : 'Not Tracked'}
                </span>
              </div>
              <div className="text-center font-bold text-slate-400 text-sm">
                →
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">New Balance</span>
                <span
                  className={cn(
                    'font-bold font-mono text-sm',
                    isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {isTracked ? `${previewNewStock} ${selectedItem.unit}` : 'Not Tracked'}
                </span>
              </div>
            </div>
          )}

          {/* Reason & Performed By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Justification *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Month-end physical count recount / Damaged bottle in transit"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00A884]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Performed By
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00A884]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-[4px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-[4px] bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


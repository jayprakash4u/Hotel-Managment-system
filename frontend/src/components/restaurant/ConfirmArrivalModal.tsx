'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { TableReservationData } from '@/lib/types';

export interface ConfirmArrivalModalProps {
  isOpen: boolean;
  reservation?: TableReservationData | null;
  table?: any;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmArrivalModal: React.FC<ConfirmArrivalModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-[360px] rounded-xl bg-white dark:bg-[#0C1815] border border-border-default dark:border-white/15 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center text-center">
        {/* Clean Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        {/* Message */}
        <h3 className="text-base font-semibold text-body dark:text-white">
          Are you sure your guest arrived?
        </h3>

        {/* Actions: No / Yes */}
        <div className="mt-6 flex items-center gap-3 w-full">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-slate-200 text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

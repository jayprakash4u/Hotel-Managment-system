'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: string;
  description: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
  confirmText?: string;
  cancelText?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemDetails = [],
  confirmText = 'Confirm Destructive Action',
  cancelText = 'Cancel & Keep',
  requireReason = true,
  reasonPlaceholder = 'Please enter reason for audit ledger (e.g. Guest requested refund, room change)...',
  variant = 'danger',
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('A reason is mandatory for financial and audit logs.');
      return;
    }
    setError('');
    await onConfirm(reason);
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {/* Warning Banner: Operational status colors */}
        <div
          className={`p-3.5 rounded-lg border flex items-start gap-3 ${
            variant === 'danger'
              ? 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B] dark:bg-[#991B1B]/20 dark:border-[#991B1B]/40 dark:text-[#F87171]'
              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E] dark:bg-[#92400E]/20 dark:border-[#92400E]/40 dark:text-[#FCD34D]'
          }`}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold">{description}</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              This action cannot be automatically undone. An audit record will be logged with your user credentials.
            </p>
          </div>
        </div>

        {/* Item Details Box */}
        {itemDetails.length > 0 && (
          <div className="p-3.5 rounded-lg bg-[#F2F4F2] dark:bg-[#072D26]/50 border border-[#DCE3DF] dark:border-[#145447] space-y-2 text-xs">
            {itemDetails.map((d, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[#64736C] dark:text-[#B7CDC3]">{d.label}:</span>
                <span className="font-bold text-[#24352F] dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mandatory Reason Input */}
        {requireReason && (
          <div>
            <label className="text-xs font-semibold text-[#24352F] dark:text-slate-300 block mb-1.5">
              Audit Reason <span className="text-[#A51F36]">*</span>
            </label>
            <Input
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className="text-xs"
            />
            {error && <p className="text-[11px] text-[#B42332] mt-1 font-semibold">{error}</p>}
          </div>
        )}

        {/* Modal Actions: Secondary (Surface) & Destructive (Burgundy #A51F36) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E9E5] dark:border-[#145447]/60">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            size="md"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

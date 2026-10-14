'use client';

import React from 'react';
import { FolioSummary } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface PaymentSummaryProps {
  summary: FolioSummary;
  className?: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ summary, className }) => {
  return (
    <div className={`p-4 rounded-xl bg-white border border-[#DCE3DF] dark:bg-[#0d1e19] dark:border-[#1a332c] shadow-2xs space-y-2 text-xs ${className}`}>
      <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8]">
        <span>Lodging Subtotal:</span>
        <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.roomTotal)}</span>
      </div>
      {summary.restaurantTotal > 0 && (
        <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8]">
          <span>Restaurant & Cafe POS:</span>
          <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.restaurantTotal)}</span>
        </div>
      )}
      {summary.spaTotal > 0 && (
        <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8]">
          <span>Zenith Spa Treatments:</span>
          <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.spaTotal)}</span>
        </div>
      )}
      {summary.minibarTotal > 0 && (
        <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8]">
          <span>Minibar & Amenities:</span>
          <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.minibarTotal)}</span>
        </div>
      )}

      <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8] pt-1 border-t border-[#E4E9E5] dark:border-[#145447]/60">
        <span>Occupancy Tax (10%):</span>
        <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.taxAmount)}</span>
      </div>
      <div className="flex justify-between text-[#64736C] dark:text-[#94A3B8]">
        <span>Resort Service Charge (5%):</span>
        <span className="font-semibold text-[#24352F] dark:text-[#E2E8F0]">{formatCurrency(summary.serviceChargeAmount)}</span>
      </div>

      <div className="flex justify-between text-sm font-bold text-[#24352F] dark:text-white pt-2 border-t border-[#E4E9E5] dark:border-[#145447]/60">
        <span>Grand Total:</span>
        <span className="font-heading text-[#0B3D32] dark:text-[#4ADE80] text-base">{formatCurrency(summary.grandTotal)}</span>
      </div>
      <div className="flex justify-between text-xs text-[#166534] dark:text-[#4ADE80]">
        <span>Total Paid:</span>
        <span className="font-bold">{formatCurrency(summary.paidAmount)}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-[#92400E] dark:text-[#FCD34D] pt-2 border-t border-[#E4E9E5] dark:border-[#145447]/60">
        <span>Balance Due:</span>
        <span>{formatCurrency(summary.balanceDue)}</span>
      </div>
    </div>
  );
};

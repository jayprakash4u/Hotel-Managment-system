'use client';

import React from 'react';
import { ReservationData } from '@/lib/types';
import { ReservationStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface ReservationCardProps {
  reservation: ReservationData;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onClick?: () => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl bg-white hover:bg-[#F8FAF8] border border-[#DCE3DF] hover:border-[#0B3D32] shadow-2xs dark:bg-[#0d1e19] dark:border-[#1a332c] dark:hover:border-[#4ADE80] transition-all cursor-pointer space-y-3"
    >
      <div className="flex justify-between items-center">
        <span className="font-mono font-bold text-[#0B3D32] dark:text-[#4ADE80] text-xs">{reservation.bookingCode}</span>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <div>
        <h4 className="font-bold text-sm text-[#24352F] dark:text-white">
          {reservation.guest.firstName} {reservation.guest.lastName}
        </h4>
        <p className="text-xs text-[#64736C] dark:text-[#94A3B8]">
          Room {reservation.room.number} • {reservation.room.type}
        </p>
        <p className="text-[10px] text-[#64736C] dark:text-[#94A3B8] mt-1">
          {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
        </p>
      </div>

      <div className="pt-2 border-t border-[#E4E9E5] dark:border-[#145447]/60 flex justify-between items-center text-xs">
        <PaymentStatusBadge status={reservation.paymentStatus} />
        <span className="font-bold text-[#24352F] dark:text-white">{formatCurrency(reservation.totalAmount)}</span>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { GuestData } from '@/lib/types';
import { VipBadge } from '@/components/ui/Badge';

export interface GuestCardProps {
  guest: GuestData;
  onClick?: () => void;
}

export const GuestCard: React.FC<GuestCardProps> = ({ guest, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-5 rounded-xl bg-white hover:bg-[#F8FAF8] border border-[#DCE3DF] hover:border-[#0B3D32] shadow-2xs dark:bg-[#0d1e19] dark:border-[#1a332c] dark:hover:border-[#4ADE80] transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-base text-[#24352F] dark:text-white font-heading group-hover:text-[#0B3D32] dark:group-hover:text-[#4ADE80] transition-colors">
              {guest.firstName} {guest.lastName}
            </h4>
            <p className="text-[11px] text-[#64736C] dark:text-[#94A3B8] mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#64736C]" />
              {guest.country} • ID: {guest.idNumber}
            </p>
          </div>
          <VipBadge tier={guest.vipTier} />
        </div>

        <div className="space-y-1.5 text-xs text-[#43534D] dark:text-[#CBD5E1]">
          <p className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-[#0B3D32] dark:text-[#4ADE80] shrink-0" />
            <span className="truncate">{guest.email}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#0B3D32] dark:text-[#4ADE80] shrink-0" />
            <span>{guest.phone}</span>
          </p>
        </div>

        {guest.preferences && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#E8F2EE] border border-[#CBD5D0] dark:bg-[#072D26]/60 dark:border-[#145447] text-[11px] text-[#0B3D32] dark:text-[#E5EEE9] line-clamp-2">
            ✨ {guest.preferences}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E4E9E5] dark:border-[#145447]/60 flex justify-between text-xs">
        <span className="text-[#64736C] dark:text-[#94A3B8]">
          Stays: <strong className="text-[#24352F] dark:text-white">{guest.totalStays || 1}</strong>
        </span>
        <span className="font-bold text-[#0B3D32] dark:text-[#4ADE80]">{guest.loyaltyPoints.toLocaleString()} Pts</span>
      </div>
    </div>
  );
};

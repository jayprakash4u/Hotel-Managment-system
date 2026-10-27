'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { RoomWithDetails } from '@/lib/types';
import { RoomStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface RoomCardProps {
  room: RoomWithDetails;
  onClick?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const isOccupied = room.status === 'OCCUPIED';
  const isDirty = room.status === 'DIRTY' || room.status === 'CLEANING';
  const isMaint = room.status === 'MAINTENANCE';

  const isAvailable = room.status === 'AVAILABLE';

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-[4px] border transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-2xs min-h-[185px] ${
        isOccupied
          ? 'bg-[#0B3D32] text-white border-[#082C24] hover:bg-[#093027] dark:bg-[#06241D] dark:border-[#0E3B31] shadow-sm'
          : isDirty
          ? 'bg-white dark:bg-[#0d1e19] border-[#FDE68A] hover:border-[#D97706]'
          : isMaint
          ? 'bg-slate-50 dark:bg-[#0d1e19] border-slate-200 hover:border-slate-300'
          : 'bg-white dark:bg-[#0d1e19] border-[#DCE3DF] hover:border-[#0B3D32] hover:ring-1 hover:ring-[#0B3D32]/20'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`font-heading font-bold text-xl tracking-tight transition-colors ${
                isOccupied
                  ? 'text-white'
                  : 'text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-[#4ADE80]'
              }`}
            >
              {room.number}
            </span>
            <span className={`text-[10px] font-semibold ${isOccupied ? 'text-white/80' : 'text-[#64736C] dark:text-[#94A3B8]'}`}>
              Fl {room.floor}
            </span>
          </div>
          <RoomStatusBadge status={room.status} />
        </div>

        <h4 className={`text-xs font-bold line-clamp-1 ${isOccupied ? 'text-white' : 'text-[#24352F] dark:text-slate-200'}`}>
          {room.type}
        </h4>
        <p className={`text-[11px] mt-0.5 ${isOccupied ? 'text-emerald-100/90' : 'text-[#64736C] dark:text-[#94A3B8]'}`}>
          {room.bedType}
        </p>

        {room.activeReservation ? (
          <div className="mt-3 p-2.5 rounded-[3px] bg-white/10 border border-white/20 text-xs text-white">
            <div className="flex items-center justify-between">
              <span className="font-bold truncate">{room.activeReservation.guestName}</span>
              <span className="text-[10px] font-bold">{room.activeReservation.vipTier}</span>
            </div>
            <p className="text-[10px] text-emerald-200/80 mt-0.5">Out: {formatDate(room.activeReservation.checkOut)}</p>
          </div>
        ) : room.activeHousekeepingTask ? (
          <div className="mt-3 p-2.5 rounded-[3px] bg-[#FEF3C7] border border-[#FDE68A] text-xs">
            <span className="font-bold text-[#92400E]">Needs Cleaning</span>
            <p className="text-[10px] text-[#92400E] mt-0.5">Assigned: {room.activeHousekeepingTask.assignedTo}</p>
          </div>
        ) : null}
      </div>

      <div className={`mt-4 pt-3 border-t min-h-[30px] flex items-center justify-between text-xs ${isOccupied ? 'border-white/20' : 'border-[#E4E9E5] dark:border-[#145447]/60'}`}>
        <span className={`font-bold ${isOccupied ? 'text-white' : 'text-[#0B3D32] dark:text-[#4ADE80]'}`}>
          {formatCurrency(room.pricePerNight)}/nt
        </span>
        {isOccupied ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-white text-[#0B3D32] font-bold text-[11px] shadow-2xs">
            <Eye className="w-3.5 h-3.5" /> In House
          </span>
        ) : isAvailable ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] text-white font-bold text-[11px] shadow-2xs">
            Book Now
          </span>
        ) : (
          <span className="text-[11px] flex items-center gap-1 text-[#64736C] group-hover:text-[#24352F] dark:text-[#94A3B8] dark:group-hover:text-white">
            <Eye className="w-3.5 h-3.5" /> Details
          </span>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  CalendarPlus,
  Calendar,
  UserCheck,
  LogOut,
  UtensilsCrossed,
  Receipt,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Wrench,
  Check,
  CheckCircle2,
  Info,
  ChevronRight,
  ArrowLeft,
  FileText,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';

export interface RoomItemData {
  id: string;
  number: string;
  type: string;
  floor: number;
  bedType: string;
  pricePerNight: number;
  cleaningStatus?: 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
  maintenanceReason?: string;
  acType?: string;
}

export interface RoomActionsDropdownProps {
  room: RoomItemData | null;
  status: 'AVAILABLE' | 'OCCUPIED' | 'ARRIVING' | 'DEPARTING' | 'MAINTENANCE';
  activeBooking?: any | null;
  selectedDate?: string;
  onClose: () => void;
  // Front Desk Actions
  onBookNow?: (room: RoomItemData) => void;
  onWalkInCheckIn?: (room: RoomItemData) => void;
  onCheckInGuest?: (booking: any) => void;
  onCheckOutGuest?: (booking: any) => void;
  onAddRoomService?: (booking: any) => void;
  onViewFolio?: (booking: any) => void;
  // Housekeeping & Operations
  onUpdateCleaningStatus?: (roomId: string, status: 'CLEAN' | 'DIRTY' | 'IN_CLEANING') => void;
  onToggleMaintenance?: (roomId: string, reason?: string) => void;
}

export const RoomActionsDropdown: React.FC<RoomActionsDropdownProps> = ({
  room,
  status,
  activeBooking,
  selectedDate,
  onClose,
  onBookNow,
  onWalkInCheckIn,
  onCheckInGuest,
  onCheckOutGuest,
  onAddRoomService,
  onViewFolio,
  onUpdateCleaningStatus,
  onToggleMaintenance,
}) => {
  const toast = useToast();
  const { role } = useRole();
  const [activeSubView, setActiveSubView] = useState<'NONE' | 'DETAILS' | 'MAINTENANCE_NOTES' | 'CONFIRM_OUT_OF_SERVICE'>('NONE');
  const [maintenanceNotesInput, setMaintenanceNotesInput] = useState(room?.maintenanceReason || '');

  if (!room) return null;

  const isOccupied = status === 'OCCUPIED';
  const isArriving = status === 'ARRIVING';
  const isDeparting = status === 'DEPARTING';
  const isMaintenance = status === 'MAINTENANCE';
  const isAvailable = status === 'AVAILABLE';

  const cleaningStatus = room.cleaningStatus || 'CLEAN';
  const isClean = cleaningStatus === 'CLEAN';
  const isDirty = cleaningStatus === 'DIRTY';
  const isCleaning = cleaningStatus === 'IN_CLEANING';

  // Role permissions
  const canPerformDesk = role === 'ADMIN' || role === 'FRONT_DESK';
  const canPerformHousekeeping = role === 'ADMIN' || role === 'HOUSEKEEPING' || role === 'FRONT_DESK';

  const handleMarkCleaned = () => {
    onClose();
    onUpdateCleaningStatus?.(room.id, 'CLEAN');
    toast.success(`Room ${room.number} Cleaned`, 'Room is sanitised and ready for guest check-in.');
  };

  const handleMarkDirty = () => {
    onClose();
    onUpdateCleaningStatus?.(room.id, 'DIRTY');
    toast.info(`Room ${room.number} Marked Dirty`, 'Housekeeping needed before assigning to a guest.');
  };

  const handleConfirmOutOfService = () => {
    onClose();
    onToggleMaintenance?.(room.id, maintenanceNotesInput.trim() || 'Scheduled room maintenance');
    toast.warning(`Room ${room.number} Out of Service`, 'Room blocked from new reservations & check-ins.');
  };

  const handleReturnToService = () => {
    onClose();
    onToggleMaintenance?.(room.id);
    toast.success(`Room ${room.number} Returned to Service`, `Room is now active (${cleaningStatus}).`);
  };

  const renderOptionRow = ({
    icon: Icon,
    label,
    rightText,
    onClick,
    disabled = false,
    disabledReason,
    danger = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    rightText?: string;
    onClick?: () => void;
    disabled?: boolean;
    disabledReason?: string;
    danger?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) {
          onClick();
        }
      }}
      title={disabled ? disabledReason : undefined}
      className={cn(
        'w-full px-3 py-2 flex items-center justify-between text-left border-b border-white/10 last:border-b-0 transition-colors select-none',
        disabled
          ? 'opacity-35 cursor-not-allowed bg-black/10'
          : danger
          ? 'hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-rose-400 cursor-pointer group'
          : 'hover:bg-white/10 active:bg-white/15 text-slate-200 hover:text-white cursor-pointer group'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-1">
        <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-white transition-colors" />
        <span className="text-[12px] font-medium truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 font-mono">
        {rightText && <span>{rightText}</span>}
        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>
    </button>
  );

  return (
    <>
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 z-40 bg-transparent cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Dropdown Box Positioned Below 3-Dots */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 rounded-md bg-[#0C1815] text-white border border-white/15 shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-100 select-none divide-y divide-white/10 text-left font-sans"
      >
        {/* Header Preview of Room / Active Guest */}
        {activeBooking?.guest ? (
          <div className="px-3 py-2 bg-white/5 border-b border-white/10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                {isOccupied ? 'In-House' : isArriving ? 'Arriving Today' : 'Departing'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Fl {room.floor}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5">
              {activeBooking.guest.firstName} {activeBooking.guest.lastName}
            </p>
          </div>
        ) : (
          <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold text-slate-300">{room.type}</span>
            <span className="font-mono text-emerald-400 font-bold">Rs. {room.pricePerNight.toLocaleString()}</span>
          </div>
        )}

        {/* Options Body */}
        <div className="overflow-y-auto max-h-[320px] divide-y divide-white/10 custom-scrollbar">
          {activeSubView === 'NONE' ? (
            <>
              {/* Housekeeping Only View */}
              {role === 'HOUSEKEEPING' ? (
                <>
                  {!isClean &&
                    renderOptionRow({
                      icon: Sparkles,
                      label: 'Mark Clean',
                      onClick: handleMarkCleaned,
                    })}
                  {!isDirty &&
                    renderOptionRow({
                      icon: AlertCircle,
                      label: 'Mark Dirty',
                      onClick: handleMarkDirty,
                    })}
                  {isMaintenance &&
                    renderOptionRow({
                      icon: CheckCircle2,
                      label: 'Return to Service',
                      onClick: handleReturnToService,
                    })}
                  {renderOptionRow({
                    icon: Info,
                    label: 'Room Details',
                    onClick: () => setActiveSubView('DETAILS'),
                  })}
                </>
              ) : (
                <>
                  {/* AVAILABLE ROOM ACTIONS */}
                  {isAvailable && (
                    <>
                      {canPerformDesk &&
                        renderOptionRow({
                          icon: CalendarPlus,
                          label: 'Book Room',
                          onClick: () => {
                            onClose();
                            onBookNow?.(room);
                          },
                        })}

                      {canPerformDesk &&
                        renderOptionRow({
                          icon: UserCheck,
                          label: 'Walk-in Check In',
                          disabled: isDirty,
                          disabledReason: 'Clean room before guest check-in',
                          onClick: () => {
                            onClose();
                            onWalkInCheckIn?.(room);
                          },
                        })}

                      {canPerformHousekeeping && !isClean &&
                        renderOptionRow({
                          icon: Sparkles,
                          label: 'Mark Clean',
                          onClick: handleMarkCleaned,
                        })}

                      {canPerformHousekeeping && isClean &&
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })}

                      {canPerformDesk &&
                        renderOptionRow({
                          icon: Wrench,
                          label: 'Out of Service',
                          onClick: () => setActiveSubView('CONFIRM_OUT_OF_SERVICE'),
                        })}
                    </>
                  )}

                  {/* ARRIVING / RESERVED ROOM ACTIONS */}
                  {isArriving && (
                    <>
                      {canPerformDesk &&
                        renderOptionRow({
                          icon: UserCheck,
                          label: 'Check In Guest',
                          disabled: isDirty,
                          disabledReason: 'Clean room before checking in guest',
                          onClick: () => {
                            onClose();
                            if (activeBooking) onCheckInGuest?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: UtensilsCrossed,
                          label: 'Add Room Service',
                          onClick: () => {
                            onClose();
                            onAddRoomService?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: Receipt,
                          label: 'View Folio',
                          onClick: () => {
                            onClose();
                            onViewFolio?.(activeBooking);
                          },
                        })}

                      {canPerformHousekeeping && !isClean &&
                        renderOptionRow({
                          icon: Sparkles,
                          label: 'Mark Clean',
                          onClick: handleMarkCleaned,
                        })}

                      {canPerformHousekeeping && isClean &&
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })}
                    </>
                  )}

                  {/* OCCUPIED ROOM ACTIONS */}
                  {isOccupied && (
                    <>
                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: UtensilsCrossed,
                          label: 'Add Room Service',
                          onClick: () => {
                            onClose();
                            onAddRoomService?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: Receipt,
                          label: 'View Folio',
                          onClick: () => {
                            onClose();
                            onViewFolio?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: LogOut,
                          label: 'Check Out',
                          onClick: () => {
                            onClose();
                            onCheckOutGuest?.(activeBooking);
                          },
                        })}

                      {canPerformHousekeeping && (
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })
                      )}
                    </>
                  )}

                  {/* DEPARTING ROOM ACTIONS */}
                  {isDeparting && (
                    <>
                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: LogOut,
                          label: 'Check Out Guest',
                          onClick: () => {
                            onClose();
                            onCheckOutGuest?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: Receipt,
                          label: 'View Folio & Settle',
                          onClick: () => {
                            onClose();
                            onViewFolio?.(activeBooking);
                          },
                        })}

                      {canPerformDesk && activeBooking &&
                        renderOptionRow({
                          icon: UtensilsCrossed,
                          label: 'Add Last Order',
                          onClick: () => {
                            onClose();
                            onAddRoomService?.(activeBooking);
                          },
                        })}

                      {canPerformHousekeeping && (
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })
                      )}
                    </>
                  )}

                  {/* MAINTENANCE / OUT OF SERVICE ACTIONS */}
                  {isMaintenance && (
                    <>
                      {canPerformDesk &&
                        renderOptionRow({
                          icon: CheckCircle2,
                          label: 'Return to Service',
                          onClick: handleReturnToService,
                        })}

                      {renderOptionRow({
                        icon: FileText,
                        label: 'Maintenance Reason',
                        onClick: () => setActiveSubView('MAINTENANCE_NOTES'),
                      })}
                    </>
                  )}

                  {/* Common Room Details Option */}
                  {renderOptionRow({
                    icon: Info,
                    label: 'Room Details',
                    onClick: () => setActiveSubView('DETAILS'),
                  })}
                </>
              )}
            </>
          ) : (
            /* Subviews (Details, Maintenance Confirm, Notes) */
            <div className="p-3 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubView('NONE')}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>

              {/* DETAILS SUBVIEW */}
              {activeSubView === 'DETAILS' && (
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Room:</span>
                    <span className="text-white font-mono font-bold">{room.number}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Floor:</span>
                    <span className="text-white font-medium">Floor {room.floor}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white font-medium">{room.type}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Bedding:</span>
                    <span className="text-white font-medium">{room.bedType}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Climate:</span>
                    <span className="text-white font-medium">{room.acType || 'AC'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Cleanliness:</span>
                    <span className="text-emerald-400 font-medium">{cleaningStatus}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Rate:</span>
                    <span className="text-white font-mono font-medium">Rs. {room.pricePerNight.toLocaleString()} / night</span>
                  </div>

                  {activeBooking?.guest && (
                    <div className="pt-1 text-[10px] text-slate-300 space-y-0.5">
                      <span className="text-slate-400 font-medium">Current Guest:</span>
                      <p className="font-bold text-white truncate">
                        {activeBooking.guest.firstName} {activeBooking.guest.lastName}
                      </p>
                      {activeBooking.guest.phone && (
                        <p className="text-slate-400">{activeBooking.guest.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CONFIRM OUT OF SERVICE SUBVIEW */}
              {activeSubView === 'CONFIRM_OUT_OF_SERVICE' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-200 font-medium block">
                    Mark Room {room.number} Out of Service?
                  </span>
                  <input
                    type="text"
                    value={maintenanceNotesInput}
                    onChange={(e) => setMaintenanceNotesInput(e.target.value)}
                    placeholder="Reason (e.g. AC repair, plumbing)"
                    className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/20 text-white text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubView('NONE')}
                      className="px-2 py-1 rounded text-[10px] text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOutOfService}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* MAINTENANCE NOTES SUBVIEW */}
              {activeSubView === 'MAINTENANCE_NOTES' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-200 font-medium block">
                    Maintenance Reason
                  </span>
                  <p className="p-2 rounded bg-white/5 border border-white/10 text-[11px] text-amber-300 italic">
                    {room.maintenanceReason || 'Servicing in progress'}
                  </p>
                  <button
                    type="button"
                    onClick={handleReturnToService}
                    className="w-full mt-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Return Room to Service
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};


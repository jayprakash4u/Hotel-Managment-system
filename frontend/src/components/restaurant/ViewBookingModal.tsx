'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  Table as TableIcon,
  Check,
  Copy,
  Utensils,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { TableReservationData } from '@/lib/types';
import { TableItem } from '@/lib/tablesData';
import { cn } from '@/lib/utils';
import { ConfirmArrivalModal } from './ConfirmArrivalModal';

export interface ViewBookingModalProps {
  reservation: TableReservationData | null;
  isOpen: boolean;
  onClose: () => void;
  table?: TableItem | null;
  onCustomerArrived?: (reservation: TableReservationData) => void;
}

export function ViewBookingModal({
  reservation,
  isOpen,
  onClose,
  table,
  onCustomerArrived,
}: ViewBookingModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showArrivalConfirm, setShowArrivalConfirm] = useState(false);

  if (!isOpen || !reservation) return null;

  const handleCopyCode = () => {
    if (reservation.reservationCode) {
      navigator.clipboard.writeText(reservation.reservationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const calculateEndTime12h = (
    timeStr?: string,
    duration?: number,
    endTimeStr?: string
  ): string => {
    if (endTimeStr) return formatTime12h(endTimeStr);
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const dur = duration && duration > 0 ? duration : 120;
    const totalMins = hours * 60 + minutes + dur;
    const endMins = totalMins % (24 * 60);
    const endHours = Math.floor(endMins / 60);
    const endMinutes = endMins % 60;
    const hh = String(endHours).padStart(2, '0');
    const mm = String(endMinutes).padStart(2, '0');
    return formatTime12h(`${hh}:${mm}`);
  };

  const formatDisplayDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '—';
    try {
      const dateStr = typeof dateVal === 'string' ? dateVal.split('T')[0] : '';
      if (!dateStr) return '—';
      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const customerName =
    reservation.guest?.firstName || reservation.guest?.lastName
      ? `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim()
      : reservation.customerName;

  const resolvedTable = reservation.table || table;
  const isPending = reservation.status === 'PENDING';
  const isConfirmed = reservation.status === 'CONFIRMED';
  const isSeated = reservation.status === 'SEATED';
  const isCancelled = reservation.status === 'CANCELLED';
  const isCompleted = reservation.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-[#0C1815] border border-border-default dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 dark:bg-emerald-950/50 border border-brand/20 dark:border-emerald-800/60 flex items-center justify-center text-brand dark:text-success">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-body dark:text-white">
                  Booking Details
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-muted dark:bg-white/10 text-body dark:text-slate-200 border border-border-default dark:border-white/10">
                  {reservation.reservationCode || 'NO-CODE'}
                </span>
                {reservation.reservationCode && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 rounded text-muted hover:text-body dark:hover:text-white transition-colors cursor-pointer"
                    title="Copy Booking Code"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted dark:text-slate-400">
                Read-only reservation overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wider bg-surface-muted dark:bg-white/10 text-body dark:text-slate-200 border border-border-default dark:border-white/15">
              {reservation.status}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-muted hover:text-body dark:hover:text-white hover:bg-surface-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Information Tiles */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Customer Information Card */}
          <div className="p-3.5 rounded-lg border border-border-default dark:border-white/10 bg-surface-muted/20 dark:bg-white/5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Name
                </span>
                <span className="text-xs font-bold text-body dark:text-white">
                  {customerName || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Phone Number
                </span>
                {reservation.phoneNumber ? (
                  <a
                    href={`tel:${reservation.phoneNumber}`}
                    className="text-xs font-mono font-semibold text-brand dark:text-success hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{reservation.phoneNumber}</span>
                  </a>
                ) : (
                  <span className="text-xs text-muted dark:text-slate-400">—</span>
                )}
              </div>

              {reservation.guest?.email && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-muted dark:text-slate-400 block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${reservation.guest.email}`}
                    className="text-xs text-brand dark:text-success hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 shrink-0" />
                    <span>{reservation.guest.email}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Timing Card */}
          <div className="p-3.5 rounded-lg border border-border-default dark:border-white/10 bg-surface-muted/20 dark:bg-white/5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule & Duration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-3">
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Reservation Date
                </span>
                <span className="text-xs font-bold text-body dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-brand dark:text-success shrink-0" />
                  <span>{formatDisplayDate(reservation.reservationDate)}</span>
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Booking Time
                </span>
                <span className="text-xs font-mono font-bold text-body dark:text-white mt-0.5 block">
                  {formatTime12h(reservation.reservationTime)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Booked Till
                </span>
                <span className="text-xs font-mono font-bold text-body dark:text-white mt-0.5 block">
                  {calculateEndTime12h(
                    reservation.reservationTime,
                    reservation.durationMinutes,
                    reservation.endTime
                  )}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Duration
                </span>
                <span className="text-xs font-semibold text-body dark:text-white mt-0.5 block">
                  {reservation.durationMinutes || 120} mins
                </span>
              </div>
            </div>
          </div>

          {/* Table & Party Card */}
          <div className="p-3.5 rounded-lg border border-border-default dark:border-white/10 bg-surface-muted/20 dark:bg-white/5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table & Party Size</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Assigned Table
                </span>
                {resolvedTable ? (
                  <span className="text-xs font-bold text-body dark:text-white flex items-center gap-1 mt-0.5">
                    <span>Table {resolvedTable.tableNumber}</span>
                    {resolvedTable.section && (
                      <span className="text-muted dark:text-slate-400 font-normal">
                        ({resolvedTable.section})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted dark:text-slate-400 mt-0.5 block">
                    Any available table (auto-assign)
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block">
                  Number of Guests
                </span>
                <span className="text-xs font-mono font-bold text-body dark:text-white flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>
                    {reservation.partySize}{' '}
                    {reservation.partySize === 1 ? 'Guest' : 'Guests'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests & Notes */}
          {(reservation.specialRequests || reservation.internalNotes) && (
            <div className="p-3.5 rounded-lg border border-border-default dark:border-white/10 bg-surface-muted/20 dark:bg-white/5 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Special Requests & Notes</span>
              </div>

              {reservation.specialRequests && (
                <div>
                  <span className="text-[11px] text-muted dark:text-slate-400 block">
                    Guest Special Requests
                  </span>
                  <p className="text-xs text-body dark:text-slate-200 mt-0.5 italic bg-white dark:bg-slate-900/60 p-2 rounded border border-border-default dark:border-white/10">
                    "{reservation.specialRequests}"
                  </p>
                </div>
              )}

              {reservation.internalNotes && (
                <div>
                  <span className="text-[11px] text-muted dark:text-slate-400 block">
                    Internal Staff Notes
                  </span>
                  <p className="text-xs text-body dark:text-slate-200 mt-0.5 bg-white dark:bg-slate-900/60 p-2 rounded border border-border-default dark:border-white/10">
                    {reservation.internalNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-white/5">
          <div className="text-[11px] text-muted dark:text-slate-400">
            {reservation.createdAt && (
              <span>
                Created{' '}
                {new Date(reservation.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCustomerArrived && !isCancelled && !isCompleted && (
              <button
                type="button"
                onClick={() => {
                  if (isSeated) {
                    onClose();
                    onCustomerArrived?.(reservation);
                  } else {
                    setShowArrivalConfirm(true);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer",
                  isSeated
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600"
                )}
                title={isSeated ? "Customer already seated - Add Items" : `Mark ${customerName} as Arrived and add items`}
              >
                {isSeated ? <Plus className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{isSeated ? 'Add Items' : 'Arrived'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Guest Arrival Confirmation Modal (Yes / No) */}
      <ConfirmArrivalModal
        isOpen={showArrivalConfirm}
        reservation={reservation}
        table={table}
        onClose={() => setShowArrivalConfirm(false)}
        onConfirm={() => {
          setShowArrivalConfirm(false);
          onClose();
          onCustomerArrived?.(reservation);
        }}
      />
    </div>
  );
}

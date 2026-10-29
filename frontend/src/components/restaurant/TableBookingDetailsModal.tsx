'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  Users,
  Clock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Check,
  Table,
  Eye,
  History,
  Plus,
  Phone,
  ChevronDown,
} from 'lucide-react';
import { TableItem } from '@/lib/tablesData';
import { TableReservationData } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { ConfirmArrivalModal } from './ConfirmArrivalModal';

export interface TableBookingDetailsModalProps {
  table: TableItem | null;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onViewBooking?: (res: TableReservationData) => void;
  onEditBooking?: (res: TableReservationData) => void;
  onSeatGuests?: (res: TableReservationData) => void;
  onCustomerArrived?: (res: TableReservationData) => void;
  onConfirmBooking?: (id: string) => Promise<void> | void;
  onCancelBooking?: (id: string) => Promise<void> | void;
  onMarkNoShow?: (id: string) => Promise<void> | void;
  onUpdateBookingStatus?: (id: string, newStatus: string) => Promise<void> | void;
  onNewBooking?: (table: TableItem) => void;
}

export const TableBookingDetailsModal: React.FC<TableBookingDetailsModalProps> = ({
  table,
  isOpen,
  onClose,
  selectedDate,
  onViewBooking,
  onEditBooking,
  onSeatGuests,
  onCustomerArrived,
  onConfirmBooking,
  onCancelBooking,
  onMarkNoShow,
  onUpdateBookingStatus,
  onNewBooking,
}) => {
  const toast = useToast();
  const { role } = useRole();

  const showReservationActions =
    role === 'ADMIN' || role === 'FRONT_DESK' || role === 'POS_CASHIER';

  const [activeTab, setActiveTab] = useState<'SELECTED_DATE' | 'HISTORY'>('SELECTED_DATE');
  const [bookings, setBookings] = useState<TableReservationData[]>([]);
  const [historyBookings, setHistoryBookings] = useState<TableReservationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [arrivalConfirmReservation, setArrivalConfirmReservation] = useState<TableReservationData | null>(null);

  const statusColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    PENDING: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/60' },
    CONFIRMED: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-800 dark:text-sky-300', dot: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-800/60' },
    SEATED: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/60' },
    COMPLETED: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    CANCELLED: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-800/60' },
    NO_SHOW: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-800 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800/60' },
  };

  const formatTime12h = (timeStr?: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parts[1] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const calculateEndTime12h = (timeStr?: string, duration?: number, endTimeStr?: string): string => {
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

  const normalizeDate = (dateVal: string | Date | null | undefined): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    try {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, '0');
      const d = String(dateVal.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const fetchBookings = async () => {
    if (!table?.id) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getTableReservations({
        tableId: table.id,
      });
      if (Array.isArray(data)) {
        // Exclude completed, cancelled, and no-show bookings from active selected date list
        const filtered = data.filter((r) => {
          if (r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW') return false;
          if (r.tableId && r.tableId !== table.id) return false;
          const rDate = normalizeDate(r.reservationDate);
          return !rDate || rDate === selectedDate;
        });
        filtered.sort((a, b) => (a.reservationTime || '').localeCompare(b.reservationTime || ''));
        setBookings(filtered);
      } else if (table.upcomingReservations) {
        const clientFiltered = table.upcomingReservations.filter((r: any) => {
          if (r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW') return false;
          const rDate = normalizeDate(r.reservationDate);
          return rDate === selectedDate;
        });
        clientFiltered.sort((a: any, b: any) => (a.reservationTime || '').localeCompare(b.reservationTime || ''));
        setBookings(clientFiltered);
      }
    } catch (err) {
      console.error('Failed to fetch table bookings', err);
      if (table.upcomingReservations) {
        const clientFiltered = table.upcomingReservations.filter((r: any) => {
          if (r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW') return false;
          const rDate = normalizeDate(r.reservationDate);
          return rDate === selectedDate;
        });
        clientFiltered.sort((a: any, b: any) => (a.reservationTime || '').localeCompare(b.reservationTime || ''));
        setBookings(clientFiltered);
      } else {
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!table?.id) {
      setHistoryBookings([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const data = await api.getTableReservations({
        tableId: table.id,
      });
      if (Array.isArray(data)) {
        // Keep past history: completed/cancelled/no-show on any date (including today), plus any past dates
        const past = data.filter((r) => {
          if (r.tableId && r.tableId !== table.id) return false;
          const rDate = normalizeDate(r.reservationDate);
          const isTerminal = r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW';
          const isPastDate = Boolean(rDate && selectedDate && rDate < selectedDate);
          return isTerminal || isPastDate;
        });
        past.sort((a, b) => {
          const dComp = (normalizeDate(b.reservationDate) || '').localeCompare(normalizeDate(a.reservationDate) || '');
          if (dComp !== 0) return dComp;
          return (b.reservationTime || '').localeCompare(a.reservationTime || '');
        });
        setHistoryBookings(past);
      } else if ((table as any).pastReservations || table.upcomingReservations) {
        const pool = [...((table as any).pastReservations || []), ...(table.upcomingReservations || [])];
        const past = pool.filter((r: any) => {
          const rDate = normalizeDate(r.reservationDate);
          const isTerminal = r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW';
          const isPastDate = Boolean(rDate && selectedDate && rDate < selectedDate);
          return isTerminal || isPastDate;
        });
        past.sort((a: any, b: any) => {
          const dComp = (normalizeDate(b.reservationDate) || '').localeCompare(normalizeDate(a.reservationDate) || '');
          if (dComp !== 0) return dComp;
          return (b.reservationTime || '').localeCompare(a.reservationTime || '');
        });
        setHistoryBookings(past);
      } else {
        setHistoryBookings([]);
      }
    } catch (err) {
      console.error('Failed to fetch table booking history', err);
      if ((table as any).pastReservations || table.upcomingReservations) {
        const pool = [...((table as any).pastReservations || []), ...(table.upcomingReservations || [])];
        const past = pool.filter((r: any) => {
          const rDate = normalizeDate(r.reservationDate);
          const isTerminal = r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'NO_SHOW';
          const isPastDate = Boolean(rDate && selectedDate && rDate < selectedDate);
          return isTerminal || isPastDate;
        });
        setHistoryBookings(past);
      } else {
        setHistoryBookings([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && table?.id) {
      fetchBookings();
      fetchHistory();
    } else if (!isOpen) {
      setBookings([]);
      setHistoryBookings([]);
      setLoading(false);
      setHistoryLoading(false);
      setActiveTab('SELECTED_DATE');
    }
  }, [isOpen, table?.id, selectedDate]);

  if (!isOpen || !table) return null;

  const currentList = activeTab === 'SELECTED_DATE' ? bookings : historyBookings;
  const isCurrentLoading = activeTab === 'SELECTED_DATE' ? loading : historyLoading;

  const handleConfirmAction = async (id: string) => {
    try {
      setActionInProgressId(id);
      await onConfirmBooking?.(id);
      await fetchBookings();
      await fetchHistory();
    } catch (err) {
      console.error('Failed to confirm booking', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCancelAction = async (id: string) => {
    try {
      setActionInProgressId(id);
      await onCancelBooking?.(id);
      await fetchBookings();
      await fetchHistory();
    } catch (err) {
      console.error('Failed to cancel booking', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleNoShowAction = async (id: string) => {
    try {
      setActionInProgressId(id);
      await onMarkNoShow?.(id);
      await fetchBookings();
      await fetchHistory();
    } catch (err) {
      console.error('Failed to mark no-show', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setActionInProgressId(id);
      await api.updateTableReservationStatus(id, newStatus);
      toast.success('Status Updated', `Booking status changed to ${newStatus}.`);
      await fetchBookings();
      await fetchHistory();
      if (onUpdateBookingStatus) {
        await onUpdateBookingStatus(id, newStatus);
      }
    } catch (err: any) {
      console.error('Failed to update booking status', err);
      toast.error('Update Failed', err.message || 'Failed to update booking status.');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#0C1815] border border-border-default dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-body dark:text-white font-heading">
                  Table {table.tableNumber} · Bookings
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-muted dark:bg-white/10 text-muted dark:text-slate-300 font-semibold border border-border-default dark:border-white/10">
                  {table.capacity} Seats
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                  {table.section}
                </span>
              </div>
              <p className="text-xs text-muted dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand dark:text-success" />
                <span>{formatDisplayDate(selectedDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showReservationActions && onNewBooking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewBooking(table);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                title={`Book Table ${table.tableNumber}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Booking</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-body dark:text-slate-400 dark:hover:text-white hover:bg-surface-muted dark:hover:bg-white/10 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Selected Date vs Past History */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border-default dark:border-white/10 bg-surface-muted/20 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setActiveTab('SELECTED_DATE')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 py-1.5 px-4 rounded-[4px] text-xs font-bold transition-all cursor-pointer border',
              activeTab === 'SELECTED_DATE'
                ? 'bg-brand text-white border-brand shadow-xs'
                : 'bg-white dark:bg-surface-card text-muted hover:text-body border-border-default dark:border-white/10'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Selected Date Bookings</span>
            <span
              className={cn(
                'ml-1 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold',
                activeTab === 'SELECTED_DATE'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-muted dark:bg-slate-800 text-muted'
              )}
            >
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 py-1.5 px-4 rounded-[4px] text-xs font-bold transition-all cursor-pointer border',
              activeTab === 'HISTORY'
                ? 'bg-brand text-white border-brand shadow-xs'
                : 'bg-white dark:bg-surface-card text-muted hover:text-body border-border-default dark:border-white/10'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past History</span>
            <span
              className={cn(
                'ml-1 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold',
                activeTab === 'HISTORY'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-muted dark:bg-slate-800 text-muted'
              )}
            >
              {historyBookings.length}
            </span>
          </button>
        </div>

        {/* Modal Body / Table Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {isCurrentLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted">
              <Clock className="w-6 h-6 animate-spin text-brand dark:text-success" />
              <span className="text-xs font-medium">
                {activeTab === 'SELECTED_DATE'
                  ? `Loading reservations for ${formatDisplayDate(selectedDate)}...`
                  : 'Loading booking history...'}
              </span>
            </div>
          ) : currentList.length === 0 ? (
            /* Clear Empty State */
            <div className="py-12 px-4 flex flex-col items-center justify-center gap-3 text-center rounded-xl border-2 border-dashed border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-surface-muted/10">
              <div className="w-12 h-12 rounded-full bg-brand/10 dark:bg-emerald-950/40 text-brand dark:text-success flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-body dark:text-white">
                  {activeTab === 'SELECTED_DATE'
                    ? `No Reservations for Table ${table.tableNumber}`
                    : `No Past Booking History`}
                </h3>
                <p className="text-xs text-muted dark:text-slate-400 max-w-md">
                  {activeTab === 'SELECTED_DATE'
                    ? `Table ${table.tableNumber} has zero bookings on ${formatDisplayDate(selectedDate)}. It is completely available for guest reservations.`
                    : `No prior reservations recorded for Table ${table.tableNumber}.`}
                </p>
              </div>

              {activeTab === 'SELECTED_DATE' && showReservationActions && onNewBooking && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewBooking(table);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Table {table.tableNumber} for this Date</span>
                </button>
              )}
            </div>
          ) : (
            /* 6-Column Reservations Table */
            <div className="rounded-lg border border-border-default dark:border-white/10 overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-muted/60 dark:bg-slate-900/60 border-b border-border-default dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-300">
                    <th className="py-3 px-4 w-[13%]">Booking Time</th>
                    <th className="py-3 px-4 w-[13%]">Booked Till</th>
                    <th className="py-3 px-4 w-[22%]">Customer Name</th>
                    <th className="py-3 px-4 w-[15%] text-center">Number of Guests</th>
                    <th className="py-3 px-4 w-[15%] text-center">Booking Status</th>
                    <th className="py-3 px-4 w-[22%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default dark:divide-white/10 bg-white dark:bg-transparent">
                  {currentList.map((res) => {
                    const status = statusColors[res.status] || statusColors.PENDING;
                    const customerName =
                      res.guest?.firstName || res.guest?.lastName
                        ? `${res.guest.firstName} ${res.guest.lastName}`.trim()
                        : res.customerName;
                    const isPending = res.status === 'PENDING';
                    const isConfirmed = res.status === 'CONFIRMED';
                    const isSeated = res.status === 'SEATED';
                    const isCompleted = res.status === 'COMPLETED';
                    const isNoShow = res.status === 'NO_SHOW';
                    const isCancelled = res.status === 'CANCELLED';
                    const isActionBusy = actionInProgressId === res.id;

                    return (
                      <tr
                        key={res.id}
                        className="hover:bg-surface-muted/30 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Column 1: Booking Time */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-0.5">
                            {activeTab === 'HISTORY' && (
                              <span className="inline-block text-[10px] font-bold text-brand dark:text-success px-1.5 py-0.2 rounded bg-brand/10 dark:bg-emerald-950/40">
                                {normalizeDate(res.reservationDate) === selectedDate
                                  ? 'Today'
                                  : formatDisplayDate(normalizeDate(res.reservationDate))}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                              <span className="text-xs font-bold text-body dark:text-white">
                                {formatTime12h(res.reservationTime)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Booked Till */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span className="text-xs font-bold text-body dark:text-white">
                              {calculateEndTime12h(res.reservationTime, res.durationMinutes, res.endTime)}
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Customer Name */}
                        <td className="py-3.5 px-4 align-middle">
                          <div>
                            <div className="text-xs font-bold text-body dark:text-white">
                              {customerName}
                            </div>
                            {res.phoneNumber && (
                              <div className="text-[11px] text-muted dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-muted shrink-0" />
                                <span>{res.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 4: Number of Guests */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-muted dark:bg-white/10 text-body dark:text-white font-mono font-bold text-xs border border-border-default dark:border-white/10">
                            <Users className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{res.partySize} {res.partySize === 1 ? 'Guest' : 'Guests'}</span>
                          </span>
                        </td>

                        {/* Column 5: Booking Status Dropdown / Badge */}
                        <td className="py-3.5 px-4 text-center align-middle">
                          {actionInProgressId === res.id ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-surface-muted dark:bg-white/10 text-muted border border-border-default dark:border-white/10">
                              <Clock className="w-3.5 h-3.5 animate-spin text-brand dark:text-success" />
                              <span>Updating...</span>
                            </span>
                          ) : isCompleted || isCancelled || isNoShow || activeTab === 'HISTORY' ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wider border shadow-2xs',
                                statusColors[res.status]?.bg,
                                statusColors[res.status]?.text,
                                statusColors[res.status]?.border
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[res.status]?.dot)} />
                              <span>{res.status}</span>
                            </span>
                          ) : (
                            <div className="relative inline-block text-left">
                              <select
                                value={res.status}
                                disabled={actionInProgressId === res.id}
                                onChange={(e) => handleStatusChange(res.id, e.target.value)}
                                className="appearance-none pl-2.5 pr-7 py-1 rounded-[4px] text-xs font-semibold uppercase tracking-wider border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-slate-200 cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-brand dark:focus:ring-success shadow-2xs"
                                title="Change Booking Status"
                              >
                                <option value="CONFIRMED" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                  CONFIRMED
                                </option>
                                <option value="PENDING" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                  PENDING
                                </option>
                                <option value="SEATED" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                  SEATED
                                </option>
                                <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                  COMPLETED
                                </option>
                                <option value="CANCELLED" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                  CANCELLED
                                </option>
                                {res.status === 'NO_SHOW' && (
                                  <option value="NO_SHOW" className="bg-white dark:bg-slate-900 text-body dark:text-white">
                                    NO SHOW
                                  </option>
                                )}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted dark:text-slate-400" />
                            </div>
                          )}
                        </td>

                        {/* Column 6: Actions (Arrived, View, Edit) */}
                        <td className="py-3.5 px-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {/* 1. Arrived / Add Items (Only active bookings on selected date) */}
                            {!isCompleted && !isCancelled && !isNoShow && activeTab === 'SELECTED_DATE' && (
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSeated) {
                                    if (onCustomerArrived) {
                                      onCustomerArrived(res);
                                    } else if (onSeatGuests) {
                                      onSeatGuests(res);
                                    }
                                  } else {
                                    setArrivalConfirmReservation(res);
                                  }
                                }}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer",
                                  isSeated
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600"
                                )}
                                title={isSeated ? "Customer already seated - Add Items" : `Mark ${customerName} as Arrived and add items`}
                              >
                                {isActionBusy ? (
                                  <Clock className="w-3.5 h-3.5 animate-spin" />
                                ) : isSeated ? (
                                  <Plus className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>{isSeated ? 'Add Items' : 'Arrived'}</span>
                              </button>
                            )}

                            {/* 2. View (Always available for full read-only details) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewBooking?.(res);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="View Booking Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted" />
                              <span>View</span>
                            </button>

                            {/* 3. Edit (Only for active bookings on selected date) */}
                            {!isCompleted && !isCancelled && !isNoShow && activeTab === 'SELECTED_DATE' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onEditBooking?.(res);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title="Edit Booking"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Guest Arrival Confirmation Modal (Yes / No) */}
      <ConfirmArrivalModal
        isOpen={!!arrivalConfirmReservation}
        reservation={arrivalConfirmReservation}
        table={table}
        onClose={() => setArrivalConfirmReservation(null)}
        onConfirm={() => {
          const target = arrivalConfirmReservation;
          setArrivalConfirmReservation(null);
          if (target) {
            if (onCustomerArrived) {
              onCustomerArrived(target);
            } else if (onSeatGuests) {
              onSeatGuests(target);
            }
          }
        }}
      />
    </div>
  );
};


'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
  Check,
  Calendar,
  Clock,
  Users,
  Phone,
  X,
  AlertCircle,
} from 'lucide-react';
import { TableReservationData } from '@/lib/types';
import { TableItem } from '@/lib/tablesData';
import { ConfirmArrivalModal } from './ConfirmArrivalModal';
import { cn } from '@/lib/utils';

export interface TableReservationsViewProps {
  reservations: TableReservationData[];
  tables: TableItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onNewBooking: () => void;
  onViewBooking: (reservation: TableReservationData) => void;
  onEditBooking: (reservation: TableReservationData) => void;
  onCustomerArrived: (reservation: TableReservationData) => void;
  onUpdateStatus: (id: string, newStatus: string) => Promise<void> | void;
  onOpenOrder: (tableId: string) => void;
  onAssignTable?: (reservation: TableReservationData) => void;
}

type SortField = 'sn' | 'client' | 'table' | 'date' | 'time' | 'party' | 'status' | 'remarks';

export const TableReservationsView: React.FC<TableReservationsViewProps> = ({
  reservations,
  tables,
  isLoading,
  onRefresh,
  onNewBooking,
  onViewBooking,
  onEditBooking,
  onCustomerArrived,
  onUpdateStatus,
  onOpenOrder,
  onAssignTable,
}) => {
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Simple Confirmation Modal state
  const [arrivalConfirmRes, setArrivalConfirmRes] = useState<TableReservationData | null>(null);

  // Helper to format date as DD/MM/YYYY matching screenshot
  const formatTableDate = (val?: string | Date | null): string => {
    if (!val) return '—';
    try {
      const raw = typeof val === 'string' ? val.split('T')[0] : '';
      if (raw && raw.includes('-')) {
        const [y, m, d] = raw.split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      const dateObj = new Date(val);
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    } catch {
      return String(val);
    }
  };

  const formatTime12h = (t?: string): string => {
    if (!t) return '';
    const clean = t.trim();
    const matchAmpm = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
    if (!matchAmpm) return clean;
    let h = parseInt(matchAmpm[1], 10);
    const m = matchAmpm[2];
    const existingAmpm = matchAmpm[3]?.toLowerCase();

    if (existingAmpm) {
      if (h === 0) h = 12;
      return `${h}:${m}${existingAmpm}`;
    }

    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}${ampm}`;
  };

  const calculateEndTime = (timeStr?: string, durationMinutes?: number): string => {
    if (!timeStr) return '';
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '';
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (/pm/i.test(timeStr) && h < 12) h += 12;
    if (/am/i.test(timeStr) && h === 12) h = 0;
    const startMins = h * 60 + m;
    const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : 120;
    const endMins = (startMins + duration) % (24 * 60);
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const formatTimeRange = (res: TableReservationData): string => {
    if (!res.reservationTime) return '—';
    const start = formatTime12h(res.reservationTime);
    const endRaw = res.endTime || calculateEndTime(res.reservationTime, res.durationMinutes);
    const end = formatTime12h(endRaw);
    if (!end || end === start) return start;
    return `${start} - ${end}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter((r) => r.status === 'CONFIRMED').length;
    const pending = reservations.filter((r) => r.status === 'PENDING').length;
    const seated = reservations.filter((r) => r.status === 'SEATED').length;
    const completed = reservations.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length;
    return { total, confirmed, pending, seated, completed, cancelled };
  }, [reservations]);

  // Filter & Sort
  const filteredList = useMemo(() => {
    return reservations
      .filter((r) => {
        // Status Filter
        if (statusFilter !== 'ALL' && r.status !== statusFilter) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (r.customerName || '').toLowerCase();
          const phone = (r.phoneNumber || '').toLowerCase();
          const code = (r.reservationCode || '').toLowerCase();
          const tableNum = (r.table?.tableNumber || '').toLowerCase();
          const remarks = (r.specialRequests || r.internalNotes || '').toLowerCase();
          if (
            !name.includes(q) &&
            !phone.includes(q) &&
            !code.includes(q) &&
            !tableNum.includes(q) &&
            !remarks.includes(q)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'client') {
          diff = (a.customerName || '').localeCompare(b.customerName || '');
        } else if (sortField === 'table') {
          const aTable = a.table?.tableNumber || '';
          const bTable = b.table?.tableNumber || '';
          diff = aTable.localeCompare(bTable, undefined, { numeric: true });
        } else if (sortField === 'date') {
          const aDate = `${a.reservationDate || ''} ${a.reservationTime || ''}`;
          const bDate = `${b.reservationDate || ''} ${b.reservationTime || ''}`;
          diff = aDate.localeCompare(bDate);
        } else if (sortField === 'time') {
          diff = (a.reservationTime || '').localeCompare(b.reservationTime || '');
        } else if (sortField === 'party') {
          diff = (a.partySize || 0) - (b.partySize || 0);
        } else if (sortField === 'status') {
          diff = (a.status || '').localeCompare(b.status || '');
        } else if (sortField === 'remarks') {
          diff = (a.specialRequests || '').localeCompare(b.specialRequests || '');
        }
        return sortDirection === 'asc' ? diff : -diff;
      });
  }, [reservations, statusFilter, searchQuery, sortField, sortDirection]);

  // Pagination calculation
  const totalEntries = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  // Status configuration
  const statusStyles: Record<string, { label: string; badge: string }> = {
    CONFIRMED: {
      label: 'Confirmed',
      badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    PENDING: {
      label: 'Pending',
      badge: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    SEATED: {
      label: 'Seated',
      badge: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    },
    COMPLETED: {
      label: 'Completed',
      badge: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    CANCELLED: {
      label: 'Cancelled',
      badge: 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
    NO_SHOW: {
      label: 'No Show',
      badge: 'bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    },
  };

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {[
          { id: 'ALL', label: 'All', count: reservations.length },
          { id: 'CONFIRMED', label: 'Confirmed', count: metrics.confirmed },
          { id: 'PENDING', label: 'Pending', count: metrics.pending },
          { id: 'SEATED', label: 'Seated', count: metrics.seated },
          { id: 'COMPLETED', label: 'Completed', count: metrics.completed },
          { id: 'CANCELLED', label: 'Cancelled', count: metrics.cancelled },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] border transition-colors cursor-pointer shrink-0',
                isSelected
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs'
                  : 'bg-white dark:bg-surface-card border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onRefresh}
          className="ml-auto p-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
          title="Refresh reservations"
        >
          <RotateCcw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#0B3D32]')} />
        </button>
      </div>

      {/* 2. Main DataTables Card */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: "Show [ 10 v ] entries" on left, "Search: [ ___ ]" on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left: Show Entries */}
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          {/* Right: Search & Book Table Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 pr-6 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] w-48 sm:w-60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onNewBooking}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold rounded-[3px] shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Table</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-200 dark:border-border-default rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header (Matching Reference Screenshot with ⇅ sorting arrows) */}
            <thead>
              <tr className="bg-[#F8F9FA] dark:bg-surface-muted border-b border-slate-200 dark:border-border-default text-slate-700 dark:text-slate-200 font-bold text-[11px] select-none">
                {/* 1. SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>SN</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 2. Client / Customer */}
                <th
                  onClick={() => handleSort('client')}
                  className="py-2.5 px-3 w-48 sm:w-52 max-w-[220px] border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Client / Customer</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 3. Table */}
                <th
                  onClick={() => handleSort('table')}
                  className="py-2.5 px-3 w-28 sm:w-32 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Table</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 4. Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 5. Time */}
                <th
                  onClick={() => handleSort('time')}
                  className="py-2.5 px-3 w-36 sm:w-40 border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 6. Party Size */}
                <th
                  onClick={() => handleSort('party')}
                  className="py-2.5 px-3 w-16 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Pax</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 7. Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 w-32 text-center border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1 justify-center">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 8. Remarks */}
                <th
                  onClick={() => handleSort('remarks')}
                  className="py-2.5 px-3 min-w-[140px] border-r border-slate-200 dark:border-border-default cursor-pointer hover:bg-slate-100 dark:hover:bg-surface-hover"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Remarks</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                  </div>
                </th>

                {/* 9. Action (Matching Reference: [Edit] [Delete]) */}
                <th className="py-2.5 px-3 w-44 text-center">
                  Action
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-border-default">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-muted dark:text-muted">
                    No reservations found matching the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedList.map((res, idx) => {
                  const sn = startIndex + idx + 1;
                  const customerName =
                    res.guest?.firstName || res.guest?.lastName
                      ? `${res.guest.firstName || ''} ${res.guest.lastName || ''}`.trim()
                      : res.customerName || 'Guest';

                  const tableNumber = res.table?.tableNumber;
                  const isConfirmed = res.status === 'CONFIRMED';
                  const isPending = res.status === 'PENDING';
                  const isSeated = res.status === 'SEATED';
                  const isCompleted = res.status === 'COMPLETED';
                  const isCancelled = res.status === 'CANCELLED' || res.status === 'NO_SHOW';

                  const conf = statusStyles[res.status] || {
                    label: res.status,
                    badge: 'bg-slate-100 text-slate-700 border-slate-300',
                  };

                  return (
                    <tr
                      key={res.id}
                      className={cn(
                        'hover:bg-[#F2F6F4] dark:hover:bg-surface-hover transition-colors',
                        idx % 2 === 1 ? 'bg-[#FAFAFA] dark:bg-surface-card/60' : 'bg-white dark:bg-surface-card'
                      )}
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-border-default">
                        {sn}
                      </td>

                      {/* 2. Client / Customer */}
                      <td className="py-2.5 px-3 w-48 sm:w-52 max-w-[220px] border-r border-slate-200 dark:border-border-default">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {customerName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted dark:text-muted font-mono">
                          {res.phoneNumber && <span className="truncate">{res.phoneNumber}</span>}
                          {res.reservationCode && (
                            <span className="text-[10px] text-brand dark:text-success font-bold shrink-0">
                              #{res.reservationCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Table */}
                      <td className="py-2.5 px-3 w-28 sm:w-32 border-r border-slate-200 dark:border-border-default font-medium">
                        {tableNumber ? (
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {tableNumber.toString().toLowerCase().startsWith('table')
                              ? tableNumber
                              : `Table ${tableNumber}`}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onAssignTable) onAssignTable(res);
                              else onEditBooking(res);
                            }}
                            className="text-amber-700 dark:text-amber-400 hover:underline text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Assign Table
                          </button>
                        )}
                      </td>

                      {/* 4. Date */}
                      <td className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-border-default font-mono text-xs text-slate-800 dark:text-slate-200">
                        {formatTableDate(res.reservationDate)}
                      </td>

                      {/* 5. Time */}
                      <td className="py-2.5 px-3 w-36 sm:w-40 border-r border-slate-200 dark:border-border-default font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatTimeRange(res)}
                      </td>

                      {/* 6. Party Size */}
                      <td className="py-2.5 px-3 w-16 text-center border-r border-slate-200 dark:border-border-default font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {res.partySize}
                      </td>

                      {/* 7. Status Dropdown (Matching Screenshot Options) */}
                      <td className="py-2.5 px-3 w-32 text-center border-r border-slate-200 dark:border-border-default">
                        <select
                          value={res.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === 'SEATED') {
                              onCustomerArrived(res);
                            } else {
                              onUpdateStatus(res.id, newStatus);
                            }
                          }}
                          className={cn(
                            'px-2 py-1 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0B3D32] shadow-2xs',
                            conf.badge
                          )}
                          title="Change Reservation Status"
                        >
                          <option value="CONFIRMED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            CONFIRMED
                          </option>
                          <option value="PENDING" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            PENDING
                          </option>
                          <option value="SEATED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            SEATED
                          </option>
                          <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            COMPLETED
                          </option>
                          <option value="CANCELLED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            CANCELLED
                          </option>
                        </select>
                      </td>

                      {/* 8. Remarks */}
                      <td className="py-2.5 px-3 min-w-[140px] border-r border-slate-200 dark:border-border-default text-xs text-slate-600 dark:text-slate-300">
                        {res.specialRequests || res.internalNotes || '—'}
                      </td>

                      {/* 9. Action (Matching Screenshot: [Edit] [Delete] + Arrived) */}
                      <td className="py-2.5 px-3 w-44 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* Arrived Button (for Confirmed / Pending) */}
                          {(isConfirmed || isPending) && (
                            <button
                              type="button"
                              onClick={() => setArrivalConfirmRes(res)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#28A745] hover:bg-[#218838] text-white text-[11px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
                              title="Customer has arrived"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Arrived</span>
                            </button>
                          )}

                          {/* Add Items (for Seated) */}
                          {isSeated && (
                            <button
                              type="button"
                              onClick={() => {
                                if (res.tableId) {
                                  onOpenOrder(res.tableId);
                                } else {
                                  onCustomerArrived(res);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#0B3D32] hover:bg-[#082d25] text-white text-[11px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
                              title="Customer is seated · Open Order"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Order</span>
                            </button>
                          )}

                          {/* [ Edit ] Button (Exact match: teal button with pencil icon) */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#17A2B8] hover:bg-[#138496] text-white text-[11px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
                              title="Edit Reservation"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* [ Delete / Cancel ] Button (Exact match: red button with trash icon) */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to cancel the reservation for "${customerName}"?`)) {
                                  onUpdateStatus(res.id, 'CANCELLED');
                                }
                              }}
                              className="inline-flex items-center justify-center p-1 bg-[#DC3545] hover:bg-[#C82333] text-white text-[11px] rounded-[3px] shadow-2xs transition-colors cursor-pointer"
                              title="Cancel Reservation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Booking Details */}
                          <button
                            type="button"
                            onClick={() => onViewBooking(res)}
                            className="inline-flex items-center justify-center p-1 border border-slate-300 dark:border-border-default hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300 text-[11px] rounded-[3px] shadow-2xs transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Footer / Pagination (Exact Match to Screenshot: Showing X to Y of Z entries | Previous [1] [2] ... Next) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          {/* Left: Entries summary */}
          <div>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(startIndex + pageSize, totalEntries)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {totalEntries.toLocaleString()}
            </strong>{' '}
            entries
            {totalEntries !== reservations.length && (
              <span> (filtered from {reservations.length.toLocaleString()} total entries)</span>
            )}
          </div>

          {/* Right: DataTables Style Pagination Group */}
          {totalPages > 1 && (
            <div className="flex items-center -space-x-px text-xs font-medium">
              {/* Previous */}
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-l-[3px] cursor-pointer transition-colors"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safeCurrentPage) <= 2
                  );
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const isGap = prev && page - prev > 1;

                  return (
                    <React.Fragment key={page}>
                      {isGap && (
                        <span className="px-2.5 py-1.5 border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-400 select-none">
                          …
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'px-3 py-1.5 border border-slate-300 dark:border-border-default font-mono font-bold transition-colors cursor-pointer',
                          page === safeCurrentPage
                            ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                            : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover'
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next */}
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-r-[3px] cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Guest Arrival Confirmation Modal */}
      <ConfirmArrivalModal
        isOpen={!!arrivalConfirmRes}
        reservation={arrivalConfirmRes}
        table={arrivalConfirmRes ? tables.find((t) => t.id === arrivalConfirmRes.tableId) : null}
        onClose={() => setArrivalConfirmRes(null)}
        onConfirm={() => {
          const target = arrivalConfirmRes;
          setArrivalConfirmRes(null);
          if (target) {
            onCustomerArrived(target);
          }
        }}
      />
    </div>
  );
};

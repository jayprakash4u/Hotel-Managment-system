'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Users,
  User,
  Phone,
  Table2,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  Plus,
  Eye,
  Edit2,
  AlertCircle,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Check,
  MoreVertical,
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
  const [dateScope, setDateScope] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'PAST'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'PARTY_DESC' | 'GUEST_ASC'>('DATE_DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Simple Confirmation Modal state
  const [arrivalConfirmRes, setArrivalConfirmRes] = useState<TableReservationData | null>(null);

  // Row Action Dropdown state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Helper to get YYYY-MM-DD string
  const getDateStr = (val?: string | Date | null): string => {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    try {
      const d = new Date(val);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return '';
    }
  };

  const todayStr = useMemo(() => getDateStr(new Date()), []);

  const formatDisplayDate = (val?: string): string => {
    if (!val) return '—';
    try {
      const raw = val.split('T')[0];
      const [y, m, d] = raw.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const formatTime12h = (t?: string) => {
    if (!t) return '';
    const parts = t.split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  // Metrics calculation across all database reservations
  const metrics = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter((r) => r.status === 'CONFIRMED').length;
    const pending = reservations.filter((r) => r.status === 'PENDING').length;
    const seated = reservations.filter((r) => r.status === 'SEATED').length;
    const completed = reservations.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length;
    const todayCount = reservations.filter((r) => getDateStr(r.reservationDate) === todayStr).length;

    return { total, confirmed, pending, seated, completed, cancelled, todayCount };
  }, [reservations, todayStr]);

  // Filtered & Sorted list
  const filteredList = useMemo(() => {
    return reservations
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'ALL' && r.status !== statusFilter) {
          return false;
        }

        // Custom Date filter
        const rDate = getDateStr(r.reservationDate);
        if (customDate) {
          if (rDate !== customDate) return false;
        } else {
          // Date Scope filter
          if (dateScope === 'TODAY' && rDate !== todayStr) return false;
          if (dateScope === 'UPCOMING' && rDate < todayStr) return false;
          if (dateScope === 'PAST' && rDate >= todayStr && r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'NO_SHOW') return false;
        }

        // Table filter
        if (tableFilter !== 'ALL') {
          if (tableFilter === 'UNASSIGNED') {
            if (r.tableId) return false;
          } else {
            if (r.tableId !== tableFilter) return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesCustomer = (r.customerName || '').toLowerCase().includes(q);
          const matchesPhone = (r.phoneNumber || '').includes(q);
          const matchesCode = (r.reservationCode || '').toLowerCase().includes(q);
          const matchesTable = (r.table?.tableNumber || '').toLowerCase().includes(q);
          if (!matchesCustomer && !matchesPhone && !matchesCode && !matchesTable) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') {
          const dComp = (getDateStr(b.reservationDate) || '').localeCompare(getDateStr(a.reservationDate) || '');
          if (dComp !== 0) return dComp;
          return (b.reservationTime || '').localeCompare(a.reservationTime || '');
        }
        if (sortBy === 'DATE_ASC') {
          const dComp = (getDateStr(a.reservationDate) || '').localeCompare(getDateStr(b.reservationDate) || '');
          if (dComp !== 0) return dComp;
          return (a.reservationTime || '').localeCompare(b.reservationTime || '');
        }
        if (sortBy === 'PARTY_DESC') {
          return (b.partySize || 0) - (a.partySize || 0);
        }
        if (sortBy === 'GUEST_ASC') {
          return (a.customerName || '').localeCompare(b.customerName || '');
        }
        return 0;
      });
  }, [reservations, statusFilter, dateScope, customDate, tableFilter, searchQuery, sortBy, todayStr]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const statusConfigs: Record<
    string,
    { label: string; badge: string; dot: string }
  > = {
    CONFIRMED: {
      label: 'Confirmed',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    PENDING: {
      label: 'Pending',
      badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    },
    SEATED: {
      label: 'Seated',
      badge: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
      dot: 'bg-sky-500',
    },
    COMPLETED: {
      label: 'Completed',
      badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    CANCELLED: {
      label: 'Cancelled',
      badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    },
    NO_SHOW: {
      label: 'No Show',
      badge: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
      dot: 'bg-orange-500',
    },
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setDateScope('ALL');
            setCustomDate('');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'ALL' && dateScope === 'ALL' && !customDate
              ? 'bg-brand/5 dark:bg-emerald-950/40 border-brand dark:border-emerald-700'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-brand/40'
          )}
        >
          <div className="flex items-center justify-between text-muted dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">All Bookings</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-lg font-bold text-body dark:text-white font-mono">
            {metrics.total}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Total in database</div>
        </div>

        <div
          onClick={() => {
            setDateScope('TODAY');
            setCustomDate('');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            dateScope === 'TODAY' && !customDate
              ? 'bg-brand/5 dark:bg-emerald-950/40 border-brand dark:border-emerald-700'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-brand/40'
          )}
        >
          <div className="flex items-center justify-between text-muted dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's</span>
            <Clock className="w-3.5 h-3.5 text-brand dark:text-success" />
          </div>
          <div className="mt-1 text-lg font-bold text-brand dark:text-success font-mono">
            {metrics.todayCount}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Scheduled today</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('CONFIRMED');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'CONFIRMED'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-500'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-emerald-400'
          )}
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-300 font-mono">
            {metrics.confirmed}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Ready for arrival</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('SEATED');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'SEATED'
              ? 'bg-sky-50/50 dark:bg-sky-950/40 border-sky-500'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-sky-400'
          )}
        >
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Seated</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-lg font-bold text-sky-800 dark:text-sky-300 font-mono">
            {metrics.seated}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Currently dining</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('PENDING');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'PENDING'
              ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-500'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-amber-400'
          )}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-lg font-bold text-amber-800 dark:text-amber-300 font-mono">
            {metrics.pending}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Awaiting confirm</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('COMPLETED');
            setCurrentPage(1);
          }}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'COMPLETED'
              ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-400'
              : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 hover:border-slate-400'
          )}
        >
          <div className="flex items-center justify-between text-muted dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 text-lg font-bold text-body dark:text-white font-mono">
            {metrics.completed}
          </div>
          <div className="text-[10px] text-muted dark:text-slate-400">Past & billed</div>
        </div>
      </div>

      {/* 2. Unified Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-surface-card border border-border-default dark:border-white/10 shadow-2xs">
        {/* Left: Quick Date Scopes & Custom Date */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center p-0.5 rounded-[4px] bg-surface-muted dark:bg-slate-900 border border-border-default dark:border-white/10">
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'TODAY', label: 'Today' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'PAST', label: 'History' },
            ].map((scope) => {
              const active = dateScope === scope.id && !customDate;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => {
                    setDateScope(scope.id as any);
                    setCustomDate('');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                    active
                      ? 'bg-white dark:bg-surface-card text-brand dark:text-success shadow-2xs'
                      : 'text-muted dark:text-slate-400 hover:text-body'
                  )}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          {/* Jump to Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setCurrentPage(1);
              }}
              className={cn(
                'rounded-[4px] border py-1 px-2.5 text-xs font-semibold focus:outline-none transition-all',
                customDate
                  ? 'border-brand bg-brand/5 text-brand dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600'
                  : 'border-border-default bg-white dark:bg-slate-900 dark:border-white/10 text-body dark:text-slate-200'
              )}
              title="Filter by specific date"
            />
            {customDate && (
              <button
                type="button"
                onClick={() => {
                  setCustomDate('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body p-0.5"
                title="Clear date"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Search, Table Filter, Sort & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search customer, phone, code..."
              className="w-full pl-8 pr-7 py-1 rounded-[4px] text-xs border border-border-default dark:border-white/10 bg-white dark:bg-slate-900 text-body dark:text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Table Filter Dropdown */}
          <select
            value={tableFilter}
            onChange={(e) => {
              setTableFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1 px-2.5 rounded-[4px] text-xs border border-border-default dark:border-white/10 bg-white dark:bg-slate-900 text-body dark:text-slate-200 cursor-pointer focus:outline-none"
            title="Filter by Table"
          >
            <option value="ALL">All Tables</option>
            <option value="UNASSIGNED">Unassigned Tables</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.tableNumber} ({t.capacity}p)
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            className="py-1 px-2.5 rounded-[4px] text-xs border border-border-default dark:border-white/10 bg-white dark:bg-slate-900 text-body dark:text-slate-200 cursor-pointer focus:outline-none"
            title="Sort Bookings"
          >
            <option value="DATE_DESC">Newest / Upcoming</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="PARTY_DESC">Party Size (High to Low)</option>
            <option value="GUEST_ASC">Guest Name (A-Z)</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-[4px] border border-border-default dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-surface-muted text-muted dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh database bookings"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-brand')} />
          </button>

          {/* Book Table Button */}
          <button
            type="button"
            onClick={onNewBooking}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Table</span>
          </button>
        </div>
      </div>

      {/* 3. Status Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'ALL', label: 'All Statuses', count: reservations.length },
          { id: 'CONFIRMED', label: 'Confirmed', count: metrics.confirmed },
          { id: 'PENDING', label: 'Pending', count: metrics.pending },
          { id: 'SEATED', label: 'Seated', count: metrics.seated },
          { id: 'COMPLETED', label: 'Completed', count: metrics.completed },
          { id: 'CANCELLED', label: 'Cancelled', count: reservations.filter((r) => r.status === 'CANCELLED').length },
          { id: 'NO_SHOW', label: 'No-Show', count: reservations.filter((r) => r.status === 'NO_SHOW').length },
        ].map((pill) => {
          const isSelected = statusFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setStatusFilter(pill.id);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer border',
                isSelected
                  ? 'bg-brand text-white border-brand shadow-xs'
                  : 'bg-white dark:bg-surface-card border-border-default dark:border-white/10 text-muted hover:text-body'
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-muted dark:bg-slate-800 text-muted'
                )}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Reservations Table */}
      {paginatedList.length === 0 ? (
        <div className="py-14 px-4 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border-default dark:border-white/10 bg-white dark:bg-surface-card">
          <div className="w-12 h-12 rounded-full bg-surface-muted dark:bg-slate-800 text-muted flex items-center justify-center mb-3">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-body dark:text-white">
            No Bookings Found
          </h3>
          <p className="text-xs text-muted dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery || customDate || statusFilter !== 'ALL' || dateScope !== 'ALL'
              ? 'No reservations matched your current filter criteria. Try clearing search or choosing another date/status.'
              : 'There are currently no table reservations recorded in the database.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {(searchQuery || customDate || statusFilter !== 'ALL' || dateScope !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setDateScope('ALL');
                  setCustomDate('');
                  setSearchQuery('');
                  setTableFilter('ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-[4px] border border-border-default dark:border-white/15 text-xs font-semibold hover:bg-surface-muted cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onNewBooking}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Table</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border-default dark:border-white/10 bg-white dark:bg-surface-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-muted/60 dark:bg-slate-900/60 border-b border-border-default dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-slate-300">
                  <th className="py-3 px-4 w-[11%]">Code</th>
                  <th className="py-3 px-4 w-[21%]">Customer</th>
                  <th className="py-3 px-4 w-[17%]">Reservation Date & Time</th>
                  <th className="py-3 px-4 w-[18%]">Assigned Table & Party</th>
                  <th className="py-3 px-4 w-[12%] text-center">Status</th>
                  <th className="py-3 px-4 w-[21%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-white/5">
                {paginatedList.map((res) => {
                  const conf = statusConfigs[res.status] || {
                    label: res.status,
                    badge: 'bg-surface-muted text-body border-border-default',
                    dot: 'bg-slate-400',
                  };

                  const isSeated = res.status === 'SEATED';
                  const isConfirmed = res.status === 'CONFIRMED';
                  const isPending = res.status === 'PENDING';
                  const isCompleted = res.status === 'COMPLETED';
                  const isCancelled = res.status === 'CANCELLED';
                  const isNoShow = res.status === 'NO_SHOW';

                  const customerName =
                    res.guest?.firstName || res.guest?.lastName
                      ? `${res.guest.firstName || ''} ${res.guest.lastName || ''}`.trim()
                      : res.customerName || 'Booking Guest';

                  const tableNumber = res.table?.tableNumber;
                  const tableSection = res.table?.section;
                  const tableCapacity = res.table?.capacity;

                  const isToday = getDateStr(res.reservationDate) === todayStr;

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-surface-muted/40 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* 1. Code */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-mono font-bold text-brand dark:text-success bg-brand/5 dark:bg-emerald-950/40 border border-brand/20 dark:border-emerald-700/50 px-2 py-0.5 rounded-[4px] text-[11px]">
                          {res.reservationCode || res.id.slice(-6).toUpperCase()}
                        </span>
                        {isToday && (
                          <span className="block mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            ● Today
                          </span>
                        )}
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-body dark:text-white flex items-center gap-1.5 text-xs">
                          <User className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="truncate">{customerName}</span>
                        </div>
                        {res.phoneNumber && (
                          <div className="text-[11px] font-mono text-muted dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-muted shrink-0" />
                            <a
                              href={`tel:${res.phoneNumber}`}
                              className="hover:underline hover:text-brand"
                            >
                              {res.phoneNumber}
                            </a>
                          </div>
                        )}
                        {res.specialRequests && (
                          <div
                            className="mt-1 text-[10px] text-muted italic truncate max-w-[220px]"
                            title={res.specialRequests}
                          >
                            "{res.specialRequests}"
                          </div>
                        )}
                      </td>

                      {/* 3. Date & Time */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-body dark:text-white flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>{formatDisplayDate(res.reservationDate)}</span>
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-muted shrink-0" />
                          <span>
                            {formatTime12h(res.reservationTime)}
                            {res.endTime ? ` – ${formatTime12h(res.endTime)}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* 4. Table & Party */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface-muted dark:bg-white/10 font-mono font-bold text-xs text-body dark:text-white border border-border-default dark:border-white/10">
                            <Users className="w-3 h-3 text-muted shrink-0" />
                            <span>
                              {res.partySize} {res.partySize === 1 ? 'Guest' : 'Guests'}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1">
                          {tableNumber ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-body dark:text-slate-200">
                              <Table2 className="w-3 h-3 text-brand dark:text-success shrink-0" />
                              <span>Table {tableNumber}</span>
                              {tableCapacity && (
                                <span className="text-[10px] text-muted">
                                  ({tableCapacity}s)
                                </span>
                              )}
                              {tableSection && (
                                <span className="text-[10px] text-muted truncate max-w-[100px]">
                                  · {tableSection}
                                </span>
                              )}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onAssignTable) onAssignTable(res);
                                else onEditBooking(res);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                              title="Click to assign table"
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Assign Table</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border shadow-2xs',
                            conf.badge
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />
                          <span>{conf.label}</span>
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* Arrived Button (for Confirmed / Pending) */}
                          {(isConfirmed || isPending) && (
                            <button
                              type="button"
                              onClick={() => setArrivalConfirmRes(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title={`Mark ${customerName} as Arrived and add items`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Arrived</span>
                            </button>
                          )}

                          {/* Add Items Button (if already Seated) */}
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="Customer is seated · Click to Add Items"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Items</span>
                            </button>
                          )}

                          {/* View Booking */}
                          <button
                            type="button"
                            onClick={() => onViewBooking(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-body dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                            title="View Full Booking Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-muted" />
                            <span>View</span>
                          </button>

                          {/* Edit Booking */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => onEditBooking(res)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="Edit Booking"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}

                          {/* More Status Actions Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === res.id ? null : res.id);
                              }}
                              className="p-1 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted dark:hover:bg-slate-800 text-muted transition-colors cursor-pointer"
                              title="More Status Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {openActionMenuId === res.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-44 z-30 rounded-lg bg-white dark:bg-[#0C1815] border border-border-default dark:border-white/15 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                {isSeated && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      onUpdateStatus(res.id, 'COMPLETED');
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-surface-muted dark:hover:bg-white/10 flex items-center gap-2 text-body dark:text-white"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Mark Completed</span>
                                  </button>
                                )}

                                {!isCompleted && !isCancelled && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        onUpdateStatus(res.id, 'NO_SHOW');
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center gap-2"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Mark No-Show</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        onUpdateStatus(res.id, 'CANCELLED');
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Cancel Booking</span>
                                    </button>
                                  </>
                                )}

                                {(isCancelled || isNoShow || isCompleted) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      onUpdateStatus(res.id, 'CONFIRMED');
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-surface-muted dark:hover:bg-white/10 text-body dark:text-white flex items-center gap-2"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-brand" />
                                    <span>Reactivate to Confirmed</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination Bar ("it should page from the database") */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border-default dark:border-white/10 bg-surface-muted/30 dark:bg-white/5 text-xs text-muted dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-body dark:text-white">
                  {filteredList.length === 0 ? 0 : startIndex + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-body dark:text-white">
                  {Math.min(startIndex + pageSize, filteredList.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-body dark:text-white">
                  {filteredList.length}
                </strong>{' '}
                bookings
                {filteredList.length !== reservations.length && (
                  <span> (filtered from {reservations.length} total)</span>
                )}
              </span>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 ml-3">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-0.5 px-2 rounded border border-border-default dark:border-white/15 bg-white dark:bg-surface-card text-body dark:text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted text-body dark:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and surrounding pages
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - safeCurrentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const isGap = prev && page - prev > 1;

                    return (
                      <React.Fragment key={page}>
                        {isGap && <span className="px-1 text-muted">…</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'min-w-[28px] h-7 px-2 rounded-[4px] font-mono font-bold text-xs transition-all cursor-pointer',
                            page === safeCurrentPage
                              ? 'bg-brand text-white shadow-2xs'
                              : 'border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted text-body dark:text-white'
                          )}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-[4px] border border-border-default dark:border-white/15 bg-white dark:bg-surface-card hover:bg-surface-muted text-body dark:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Simple Guest Arrival Confirmation Modal ("Are you sure your guest arrived? Yes / No") */}
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

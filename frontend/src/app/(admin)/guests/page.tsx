'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Contact,
  Search,
  Phone,
  Mail,
  UserCheck,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  RoomBooking,
  loadBookingsFromStorage,
} from '../reservations/reservationsData';
import { cn } from '@/lib/utils';

interface GuestProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vip: boolean;
  totalStays: number;
  totalSpent: number;
  lastRoom: string;
  lastCheckIn: string;
  status: string;
}

export default function GuestDirectoryPage() {
  const [bookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [searchQuery, setSearchQuery] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique guests from bookings and defaults
  const guestList: GuestProfile[] = useMemo(() => {
    const map = new Map<string, GuestProfile>();

    bookings.forEach((b) => {
      const key = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          id: b.guest.id || b.id,
          name: `${b.guest.firstName} ${b.guest.lastName}`,
          phone: b.guest.phone || '',
          email: b.guest.email || '',
          vip: Boolean(b.guest.vipTier && b.guest.vipTier !== 'STANDARD'),
          totalStays: 1,
          totalSpent: b.roomCharges || (b.room ? b.room.pricePerNight * b.nights : 0),
          lastRoom: b.room.number,
          lastCheckIn: b.checkIn,
          status: b.status,
        });
      } else {
        const existing = map.get(key)!;
        existing.totalStays += 1;
        existing.totalSpent += b.roomCharges || (b.room ? b.room.pricePerNight * b.nights : 0);
        if (b.checkIn > existing.lastCheckIn) {
          existing.lastCheckIn = b.checkIn;
          existing.lastRoom = b.room.number;
          existing.status = b.status;
        }
      }
    });

    return Array.from(map.values());
  }, [bookings]);

  const filteredGuests = useMemo(() => {
    return guestList.filter((g) => {
      if (vipOnly && !g.vip) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = g.name.toLowerCase().includes(q);
        const matchPhone = g.phone.includes(q);
        const matchEmail = g.email.toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail;
      }
      return true;
    });
  }, [guestList, vipOnly, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedGuests = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, safeCurrentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [vipOnly, searchQuery]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-body dark:text-body flex items-center gap-2">
            <Contact className="w-4 h-4 text-info" />
            Guest Directory ({guestList.length} Registered Guests)
          </h2>
          <p className="text-xs text-muted dark:text-muted mt-0.5">
            Profiles, loyalty history, and contact records for all hotel guests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={cn(
              'px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors whitespace-nowrap',
              vipOnly
                ? 'border-warning bg-warning-subtle text-warning dark:bg-warning-subtle dark:text-warning'
                : 'border-border-default dark:border-border-default text-muted dark:text-muted hover:bg-surface-muted'
            )}
          >
            VIP Guests Only
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>
      </div>

      {/* Guest Directory Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Guest Profile</th>
                <th className="py-3 px-3">Phone & Email</th>
                <th className="py-3 px-3">Loyalty & Stays</th>
                <th className="py-3 px-3">Total Spend</th>
                <th className="py-3 px-3">Recent Room</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No guest profiles found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedGuests.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                      {(safeCurrentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{g.name}</span>
                        {g.vip && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ID: <span className="font-mono">{g.id.slice(0, 8)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{g.phone || 'N/A'}</span>
                      </div>
                      {g.email && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{g.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {g.totalStays} {g.totalStays === 1 ? 'Stay' : 'Stays'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      Rs. {g.totalSpent.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      <span className="font-medium text-[#0B3D32] dark:text-emerald-400">Room {g.lastRoom}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{g.lastCheckIn}</div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/booking`}
                        className="inline-flex items-center px-2.5 py-1 rounded border border-[#0B3D32] text-[#0B3D32] hover:bg-[#E8F2EE] dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/40 text-[11px] font-semibold"
                      >
                        Book Stay <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          DATATABLES PAGINATION FOOTER
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
        {/* Left side: Show Entries per page + Entries summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[28px] px-2 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

          <div>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {filteredGuests.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * pageSize, filteredGuests.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{filteredGuests.length}</strong>{' '}
            entries
          </div>
        </div>

        {/* DataTables Prev / Page Numbers / Next */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
              ) {
                const isCurrent = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                        : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400 select-none font-bold">
                    …
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

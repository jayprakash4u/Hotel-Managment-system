'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  LogOut,
  Receipt,
  BedDouble,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getBookingFinancials,
} from '../reservations/reservationsData';
import { cn } from '@/lib/utils';

export default function InHouseGuestsPage() {
  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handleFocus = () => {
      setBookings(loadBookingsFromStorage());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const inHouseList = useMemo(() => {
    return bookings.filter((b) => b.status === 'CHECKED_IN');
  }, [bookings]);

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return inHouseList;
    const q = searchQuery.toLowerCase().trim();
    return inHouseList.filter((b) => {
      const matchName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().includes(q);
      const matchRoom = b.room.number.toLowerCase().includes(q);
      const matchPhone = b.guest.phone ? b.guest.phone.includes(q) : false;
      const matchEmail = b.guest.email ? b.guest.email.toLowerCase().includes(q) : false;
      return matchName || matchRoom || matchPhone || matchEmail;
    });
  }, [inHouseList, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedGuests = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, safeCurrentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-body dark:text-body flex items-center gap-2">
            <Users className="w-4 h-4 text-info" />
            In-House Guests Roster ({inHouseList.length} Active Stays)
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Real-time directory of all currently checked-in guests and active room folios.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guest, room or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card text-body dark:text-body placeholder-text-muted focus:outline-none focus:border-[#0B3D32]"
          />
        </div>
      </div>

      {/* In-House Guests Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card text-muted dark:text-muted font-semibold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Guest Information</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Dates & Nights</th>
                <th className="py-3 px-3">Folio Financials</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default dark:divide-border-default text-body dark:text-body">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    {searchQuery ? 'No in-house guests match your search criteria.' : 'No in-house guests currently registered.'}
                  </td>
                </tr>
              ) : (
                paginatedGuests.map((b, idx) => {
                  const fin = getBookingFinancials(b);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0B3D32] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900 text-xs inline-flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span>Room {b.room.number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                          {b.room.type}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{b.guest.firstName} {b.guest.lastName}</span>
                          {b.guest.vipTier && b.guest.vipTier !== 'STANDARD' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              {b.guest.vipTier}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Booking ID: <span className="font-mono text-slate-500">{b.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-muted">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.guest.phone || 'N/A'}</span>
                        </div>
                        {b.guest.email && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{b.guest.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">{b.checkIn}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-medium text-slate-900 dark:text-white">{b.checkOut}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {b.nights} {b.nights === 1 ? 'Night' : 'Nights'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Rs. {fin.totalCharges.toLocaleString()}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {fin.balanceDue > 0 ? (
                            <span className="text-rose-600 font-bold">
                              Due: Rs. {fin.balanceDue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Fully Settled</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/checkout`}
                          className="inline-flex items-center px-2.5 py-1 rounded border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-[11px] font-semibold"
                        >
                          <LogOut className="w-3 h-3 mr-1" /> Check-Out
                        </Link>
                      </td>
                    </tr>
                  );
                })
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

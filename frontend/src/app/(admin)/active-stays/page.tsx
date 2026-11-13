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
  ChevronLeft,
  ChevronRight,
  X,
  Award,
  Plus,
  Eye,
  CreditCard,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getBookingFinancials,
  getRelativeDate,
} from '../reservations/reservationsData';
import { cn } from '@/lib/utils';

type InHouseTab = 'ALL' | 'DEPARTING_TODAY' | 'STAYOVER' | 'BALANCE_DUE' | 'VIP';

export default function InHouseGuestsPage() {
  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [activeTab, setActiveTab] = useState<InHouseTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFolioBooking, setSelectedFolioBooking] = useState<RoomBooking | null>(null);

  const todayStr = useMemo(() => getRelativeDate(0), []);

  useEffect(() => {
    const handleSync = () => {
      setBookings(loadBookingsFromStorage());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const inHouseList = useMemo(() => {
    return bookings.filter((b) => b.status === 'CHECKED_IN');
  }, [bookings]);

  // Tab definitions (Box-type, no numbers)
  const tabs: { id: InHouseTab; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'DEPARTING_TODAY', label: 'Departing Today' },
    { id: 'STAYOVER', label: 'Stayover' },
    { id: 'BALANCE_DUE', label: 'Balance Due' },
    { id: 'VIP', label: 'VIP Guests' },
  ];

  const filteredGuests = useMemo(() => {
    return inHouseList.filter((b) => {
      const fin = getBookingFinancials(b);
      const isDepartingToday = b.checkOut === todayStr;
      const isStayover = b.checkOut > todayStr;
      const hasBalance = fin.balanceDue > 0;
      const isVip = b.guest.vipTier && b.guest.vipTier !== 'STANDARD';

      // 1. Tab filter
      if (activeTab === 'DEPARTING_TODAY' && !isDepartingToday) return false;
      if (activeTab === 'STAYOVER' && !isStayover) return false;
      if (activeTab === 'BALANCE_DUE' && !hasBalance) return false;
      if (activeTab === 'VIP' && !isVip) return false;

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().includes(q);
        const matchRoom = b.room.number.toLowerCase().includes(q);
        const matchPhone = b.guest.phone ? b.guest.phone.includes(q) : false;
        const matchEmail = b.guest.email ? b.guest.email.toLowerCase().includes(q) : false;
        const matchCode = b.bookingCode ? b.bookingCode.toLowerCase().includes(q) : false;
        const matchId = b.id.toLowerCase().includes(q);
        return matchName || matchRoom || matchPhone || matchEmail || matchCode || matchId;
      }
      return true;
    });
  }, [inHouseList, activeTab, todayStr, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedGuests = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, safeCurrentPage, pageSize]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Quick Actions (No filler description)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            In-House Guests
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/roomboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Room Board</span>
          </Link>

          <Link
            href="/check-in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Check-In</span>
          </Link>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          FILTER TOOLBAR: Box-type Status Buttons (No numbers) & Search Box
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Box-type Status Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap',
                  isActive
                    ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
                    : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Search Box (compact, aligned to right) */}
        <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest, room #..."
            className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MAIN IN-HOUSE GUESTS DATATABLE
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ROOM & SUITE</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">GUEST & VIP</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">CONTACT</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">DATES & STAY</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">FOLIO CHARGES</th>
                <th className="py-2.5 px-3 text-right w-44">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No in-house guests found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedGuests.map((b, idx) => {
                  const fin = getBookingFinancials(b);
                  const isDepartingToday = b.checkOut === todayStr;
                  const isOverstay = b.checkOut < todayStr;
                  const isVip = b.guest.vipTier && b.guest.vipTier !== 'STANDARD';

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Room & Suite */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B3D32] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-emerald-200 dark:border-emerald-800 text-xs inline-block">
                            Room {b.room.number}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{b.room.floorLevel || 'Floor 1'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {b.room.type}
                        </div>
                      </td>

                      {/* Guest & VIP */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>
                            {b.guest.firstName} {b.guest.lastName}
                          </span>
                          {isVip && (
                            <span
                              className={cn(
                                'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-[2px] text-[9px] font-black uppercase tracking-wider border',
                                b.guest.vipTier === 'PLATINUM'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              )}
                            >
                              <Award className="w-2.5 h-2.5" />
                              {b.guest.vipTier}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {b.bookingCode || b.id}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{b.guest.phone || 'N/A'}</span>
                        </div>
                        {b.guest.email && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{b.guest.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Dates & Stay */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-medium text-slate-900 dark:text-white text-xs">
                          <span>{b.checkIn}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span>{b.checkOut}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {b.nights} {b.nights === 1 ? 'Night' : 'Nights'}
                          </span>
                          {isDepartingToday && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 uppercase">
                              Departs Today
                            </span>
                          )}
                          {isOverstay && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 uppercase">
                              Overstay
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Folio Charges & Balance */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          Rs. {fin.totalCharges.toLocaleString()}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {fin.balanceDue > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              Due: Rs. {fin.balanceDue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Settled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedFolioBooking(b)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          >
                            <Receipt className="w-3 h-3 text-slate-500" />
                            <span>Folio</span>
                          </button>

                          <Link
                            href="/checkout"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          >
                            <LogOut className="w-3 h-3 text-rose-600" />
                            <span>Check-Out</span>
                          </Link>
                        </div>
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
          Left: Show [10 v] entries per page | Showing X to Y of Z entries
          Right: [< Previous] [1] [2] [Next >]
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

      {/* -----------------------------------------------------------------------
          GUEST FOLIO INSPECTION MODAL
          ----------------------------------------------------------------------- */}
      {selectedFolioBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center font-bold text-xs">
                  {selectedFolioBooking.room.number}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {selectedFolioBooking.guest.firstName} {selectedFolioBooking.guest.lastName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 uppercase">
                      In-House
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedFolioBooking.room.type} • Booking ID: {selectedFolioBooking.bookingCode || selectedFolioBooking.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFolioBooking(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Stay Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Check-In</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedFolioBooking.checkIn}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Check-Out</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedFolioBooking.checkOut}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Nights</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedFolioBooking.nights} Nights</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Nightly Rate</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Rs. {selectedFolioBooking.room.pricePerNight.toLocaleString()}</div>
                </div>
              </div>

              {/* Financial Folio Summary */}
              {(() => {
                const fin = getBookingFinancials(selectedFolioBooking);
                return (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Folio Breakdown
                    </h4>
                    <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-surface-card">
                        <span className="text-slate-600 dark:text-slate-400">Room Tariff Charges ({selectedFolioBooking.nights} nights)</span>
                        <span className="font-bold text-slate-900 dark:text-white">Rs. {fin.roomCharges.toLocaleString()}</span>
                      </div>
                      {fin.cafeTotal > 0 && (
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-surface-card">
                          <span className="text-slate-600 dark:text-slate-400">Cafe & Restaurant Orders Charged to Room</span>
                          <span className="font-bold text-slate-900 dark:text-white">Rs. {fin.cafeTotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Total Folio Charges</span>
                        <span className="text-slate-900 dark:text-white">Rs. {fin.totalCharges.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-surface-card">
                        <span className="text-emerald-600 font-semibold">Total Payments & Advance Received</span>
                        <span className="font-bold text-emerald-600">- Rs. {fin.totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/60 font-bold">
                        <span className="text-slate-900 dark:text-white">Outstanding Balance Due</span>
                        <span className={cn('text-sm', fin.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                          Rs. {fin.balanceDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setSelectedFolioBooking(null)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Close
              </button>

              <Link
                href="/checkout"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Go to Check-Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

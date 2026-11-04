'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BedDouble,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomRecord,
  CleaningStatus,
  loadHotelRoomsFromStorage,
  saveHotelRoomsToStorage,
} from '@/lib/hotelRoomsData';

export default function HousekeepingPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    return loadHotelRoomsFromStorage();
  });

  const [filterTab, setFilterTab] = useState<'ALL' | 'DIRTY' | 'IN_CLEANING' | 'CLEAN'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync with storage on external updates
  useEffect(() => {
    const handleStorageChange = () => {
      setRooms(loadHotelRoomsFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const persistRooms = (updatedRooms: RoomRecord[]) => {
    setRooms(updatedRooms);
    saveHotelRoomsToStorage(updatedRooms);
  };

  const updateCleanStatus = (roomId: string, newStatus: CleaningStatus) => {
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, cleaningStatus: newStatus } : r));
    persistRooms(updated);
    const label = newStatus === 'CLEAN' ? 'Clean & Ready' : newStatus === 'IN_CLEANING' ? 'In Cleaning' : 'Dirty';
    toast.success(`Room marked as ${label}`);
  };

  const handleMarkAllClean = () => {
    const dirtyOrInCleaning = rooms.some((r) => r.cleaningStatus !== 'CLEAN');
    if (!dirtyOrInCleaning) {
      toast.info('All rooms are already marked as Clean & Ready.');
      return;
    }
    const updated = rooms.map((r) => ({ ...r, cleaningStatus: 'CLEAN' as CleaningStatus }));
    persistRooms(updated);
    toast.success('All rooms have been marked as Clean & Ready.');
  };

  // Status Box Tabs (No numbers)
  const statusTabs: { id: 'ALL' | 'DIRTY' | 'IN_CLEANING' | 'CLEAN'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'DIRTY', label: 'Dirty' },
    { id: 'IN_CLEANING', label: 'In Cleaning' },
    { id: 'CLEAN', label: 'Clean & Ready' },
  ];

  // Filtered List
  const filteredList = useMemo(() => {
    return rooms.filter((r) => {
      if (filterTab === 'DIRTY' && r.cleaningStatus !== 'DIRTY') return false;
      if (filterTab === 'IN_CLEANING' && r.cleaningStatus !== 'IN_CLEANING') return false;
      if (filterTab === 'CLEAN' && r.cleaningStatus !== 'CLEAN') return false;
      if (floorFilter !== 'ALL' && String(r.floor) !== floorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.number.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.bedType.toLowerCase().includes(q) ||
          (r.maintenanceReason && r.maintenanceReason.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rooms, filterTab, floorFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, safeCurrentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, floorFilter, searchQuery]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Quick Actions (No filler description)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
            <span>Housekeeping</span>
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

          <button
            type="button"
            onClick={handleMarkAllClean}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Clean</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          FILTER TOOLBAR: Box-type Status Buttons (No numbers) & Search Box
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Box-type Status Buttons + Floor Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusTabs.map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
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

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Floor Selector Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 mr-0.5 hidden sm:inline">Floor:</span>
            {['ALL', '1', '2', '3', '4', '5'].map((fl) => {
              const isActive = floorFilter === fl;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setFloorFilter(fl)}
                  className={cn(
                    'px-2 py-1 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none',
                    isActive
                      ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200 font-bold'
                      : 'bg-white dark:bg-surface-card text-slate-600 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {fl === 'ALL' ? 'All Floors' : `F${fl}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Search Box (compact, aligned to right) */}
        <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room #, type..."
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
          MAIN HOUSEKEEPING DATATABLE
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ROOM</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ROOM TYPE & BED</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">FRONT DESK STATUS</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">CLEANING STATUS</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">NOTES / DETAILS</th>
                <th className="py-2.5 px-3 text-right">DISPATCH ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No rooms found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((r, idx) => {
                  const isClean = r.cleaningStatus === 'CLEAN';
                  const isInCleaning = r.cleaningStatus === 'IN_CLEANING';
                  const isDirty = r.cleaningStatus === 'DIRTY';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                        {(safeCurrentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Room & Floor */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B3D32] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-emerald-200 dark:border-emerald-800 text-xs inline-block">
                            Room {r.number}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">Floor {r.floor}</span>
                        </div>
                      </td>

                      {/* Room Type & Bed */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">{r.type}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {r.bedType} • {r.acType}
                        </div>
                      </td>

                      {/* Operational / Front Desk Status */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase inline-block',
                            r.operationalStatus === 'OCCUPIED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              : r.operationalStatus === 'MAINTENANCE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          )}
                        >
                          {r.operationalStatus}
                        </span>
                      </td>

                      {/* Cleaning Status */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-[2px] inline-flex items-center gap-1 uppercase',
                            isClean
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : isInCleaning
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          )}
                        >
                          {isClean && <Sparkles className="w-2.5 h-2.5 text-emerald-600" />}
                          {isInCleaning && <Clock className="w-2.5 h-2.5 text-cyan-600 animate-spin" />}
                          {isDirty && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
                          <span>{isClean ? 'Clean & Ready' : isInCleaning ? 'In Cleaning' : 'Dirty'}</span>
                        </span>
                      </td>

                      {/* Notes / Details */}
                      <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        {r.operationalStatus === 'MAINTENANCE' ? (
                          <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
                            <Wrench className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{r.maintenanceReason || 'Under Service'}</span>
                          </div>
                        ) : r.operationalStatus === 'OCCUPIED' ? (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            Guest In-House
                          </span>
                        ) : isClean ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Ready for Check-In
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Turnaround Required
                          </span>
                        )}
                      </td>

                      {/* Dispatch Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDirty && (
                            <button
                              type="button"
                              onClick={() => updateCleanStatus(r.id, 'IN_CLEANING')}
                              className="px-2 py-1 rounded-[3px] border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                            >
                              Start Cleaning
                            </button>
                          )}
                          {!isClean && (
                            <button
                              type="button"
                              onClick={() => updateCleanStatus(r.id, 'CLEAN')}
                              className="px-2 py-1 rounded-[3px] border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                            >
                              Mark Clean
                            </button>
                          )}
                          {isClean && (
                            <button
                              type="button"
                              onClick={() => updateCleanStatus(r.id, 'DIRTY')}
                              className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium text-[11px] cursor-pointer transition-colors shadow-2xs"
                            >
                              Mark Dirty
                            </button>
                          )}
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
              {filteredList.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * pageSize, filteredList.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{filteredList.length}</strong>{' '}
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

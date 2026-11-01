'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BedDouble,
  User,
  Wrench,
  Filter,
} from 'lucide-react';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomRecord,
  OperationalStatus,
  CleaningStatus,
  loadHotelRoomsFromStorage,
  saveHotelRoomsToStorage,
} from '@/lib/hotelRoomsData';

const DEFAULT_HOUSEKEEPING_ROOMS: RoomRecord[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'DIRTY' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'AC Servicing & Plumbing' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 3, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Painting & Touchup' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Electrical Inspection' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', acType: 'AC', pricePerNight: 9500, capacity: 4, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', acType: 'AC', pricePerNight: 18500, capacity: 6, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
];

export default function HousekeepingPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('hotel_rooms_setup_v2') || localStorage.getItem('hotel_rooms_setup');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_HOUSEKEEPING_ROOMS;
  });

  const [filterTab, setFilterTab] = useState<'ALL' | 'DIRTY' | 'IN_CLEANING' | 'CLEAN'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const persistRooms = (updatedRooms: RoomRecord[]) => {
    setRooms(updatedRooms);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_rooms_setup_v2', JSON.stringify(updatedRooms));
    }
  };

  const updateCleanStatus = (roomId: string, newStatus: CleaningStatus) => {
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, cleaningStatus: newStatus } : r));
    persistRooms(updated);
    toast.success(`Room marked as ${newStatus}`);
  };

  const dirtyCount = rooms.filter((r) => r.cleaningStatus === 'DIRTY').length;
  const inCleaningCount = rooms.filter((r) => r.cleaningStatus === 'IN_CLEANING').length;
  const cleanCount = rooms.filter((r) => r.cleaningStatus === 'CLEAN').length;

  const filteredList = useMemo(() => {
    return rooms.filter((r) => {
      if (filterTab === 'DIRTY' && r.cleaningStatus !== 'DIRTY') return false;
      if (filterTab === 'IN_CLEANING' && r.cleaningStatus !== 'IN_CLEANING') return false;
      if (filterTab === 'CLEAN' && r.cleaningStatus !== 'CLEAN') return false;
      if (floorFilter !== 'ALL' && String(r.floor) !== floorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return r.number.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rooms, filterTab, floorFilter, searchQuery]);

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="housekeeping" />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterTab('ALL')}
          className={cn(
            'p-3.5 rounded-lg border text-left transition-all',
            filterTab === 'ALL'
              ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] ring-1 ring-[#1A73E8]'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200'
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">All Rooms</div>
          <div className="text-xl font-black mt-1 tabular-nums">{rooms.length}</div>
        </button>

        <button
          onClick={() => setFilterTab('DIRTY')}
          className={cn(
            'p-3.5 rounded-lg border text-left transition-all',
            filterTab === 'DIRTY'
              ? 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200'
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Dirty</div>
          <div className="text-xl font-black mt-1 tabular-nums text-amber-700">{dirtyCount}</div>
        </button>

        <button
          onClick={() => setFilterTab('IN_CLEANING')}
          className={cn(
            'p-3.5 rounded-lg border text-left transition-all',
            filterTab === 'IN_CLEANING'
              ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-500'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200'
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">In Cleaning</div>
          <div className="text-xl font-black mt-1 tabular-nums text-cyan-700">{inCleaningCount}</div>
        </button>

        <button
          onClick={() => setFilterTab('CLEAN')}
          className={cn(
            'p-3.5 rounded-lg border text-left transition-all',
            filterTab === 'CLEAN'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200'
          )}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Clean & Ready</div>
          <div className="text-xl font-black mt-1 tabular-nums text-emerald-700">{cleanCount}</div>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A]">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Floor:</span>
          {['ALL', '1', '2', '3', '4', '5'].map((fl) => (
            <button
              key={fl}
              onClick={() => setFloorFilter(fl)}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded border transition-colors',
                floorFilter === fl
                  ? 'border-[#1A73E8] bg-[#1A73E8] text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              )}
            >
              {fl === 'ALL' ? 'All' : `F${fl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Housekeeping Tasks Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Room Type</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Cleaning Status</th>
                <th className="py-2.5 px-3 text-right">Quick Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredList.map((r) => {
                const isClean = r.cleaningStatus === 'CLEAN';
                const isInCleaning = r.cleaningStatus === 'IN_CLEANING';
                const isDirty = r.cleaningStatus === 'DIRTY';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900 text-xs inline-block">
                        Room {r.number}
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-medium">Floor {r.floor}</span>
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {r.type}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                          r.operationalStatus === 'OCCUPIED'
                            ? 'bg-blue-100 text-[#1A73E8]'
                            : r.operationalStatus === 'MAINTENANCE'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        )}
                      >
                        {r.operationalStatus}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 uppercase',
                          isClean
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInCleaning
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {isClean && <Sparkles className="w-3 h-3" />}
                        {isClean ? 'Clean' : isInCleaning ? 'In Cleaning' : 'Dirty'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      {isDirty && (
                        <button
                          onClick={() => updateCleanStatus(r.id, 'IN_CLEANING')}
                          className="px-2 py-1 rounded border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-semibold text-[11px]"
                        >
                          Start Cleaning
                        </button>
                      )}
                      {!isClean && (
                        <button
                          onClick={() => updateCleanStatus(r.id, 'CLEAN')}
                          className="px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px]"
                        >
                          Mark Clean
                        </button>
                      )}
                      {isClean && (
                        <button
                          onClick={() => updateCleanStatus(r.id, 'DIRTY')}
                          className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-[11px]"
                        >
                          Mark Dirty
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

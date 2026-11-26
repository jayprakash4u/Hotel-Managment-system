'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Sparkles,
  Clock,
  Check,
  Save,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  RoomRecord,
  CleaningStatus,
  OperationalStatus,
  loadHotelRoomsFromStorage,
  saveHotelRoomsToStorage,
} from '@/lib/hotelRoomsData';

const COMMON_MAINTENANCE_PRESETS = [
  'AC / Climate Control Issue',
  'Plumbing & Water Leak',
  'Electrical / Lighting Fault',
  'Deep Sanitization & Pest Control',
  'Door Lock / Keycard Repair',
  'Furniture / Fixture Damage',
  'Painting & Touch-up Renovation',
  'Bathroom Fitting Replacement',
];

export default function HousekeepingPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    return loadHotelRoomsFromStorage();
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const [filterTab, setFilterTab] = useState<'ALL' | 'CLEAN' | 'DIRTY' | 'MAINTENANCE'>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Maintenance & Service Modal State
  const [serviceModalRoom, setServiceModalRoom] = useState<RoomRecord | null>(null);
  const [serviceReason, setServiceReason] = useState('');

  // Sync with storage on external updates only when there are no unsaved changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (!hasUnsavedChanges) {
        setRooms(loadHotelRoomsFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hotel_rooms_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hotel_rooms_updated', handleStorageChange);
    };
  }, [hasUnsavedChanges]);

  // Warn on tab close/refresh if changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Commit changes to storage when "Save Changes" button is clicked
  const handleSaveChanges = () => {
    saveHotelRoomsToStorage(rooms);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated'));
    }
    setHasUnsavedChanges(false);
    toast.success('Saved Successfully', 'All housekeeping status changes have been saved.');
  };

  // Change room cleaning status directly via 3 checkbox buttons (staged locally)
  const handleSetRoomStatus = (room: RoomRecord, targetStatus: 'CLEAN' | 'DIRTY') => {
    // If room is currently in Maintenance / Out of Service, switching to Clean or Dirty stages its return to active service!
    if (room.operationalStatus === 'MAINTENANCE') {
      const updated = rooms.map((r) =>
        r.id === room.id
          ? {
              ...r,
              operationalStatus: 'AVAILABLE' as OperationalStatus,
              maintenanceReason: undefined,
              cleaningStatus: targetStatus as CleaningStatus,
            }
          : r
      );
      setRooms(updated);
      setHasUnsavedChanges(true);
      const statusLabel = targetStatus === 'CLEAN' ? 'Clean & Ready' : 'Dirty (Turnaround Required)';
      toast.info(
        'Staged for Return',
        `Room ${room.number} set as ${statusLabel}. Click "Save Changes" to apply.`
      );
      return;
    }

    // If room is already in this status, notify user
    if (room.cleaningStatus === targetStatus) {
      const label = targetStatus === 'CLEAN' ? 'Clean & Ready' : 'Dirty';
      toast.info(`Room ${room.number} is already marked as ${label}.`);
      return;
    }

    // Normal cleaning status update staged
    const updated = rooms.map((r) =>
      r.id === room.id ? { ...r, cleaningStatus: targetStatus as CleaningStatus } : r
    );
    setRooms(updated);
    setHasUnsavedChanges(true);
    const label = targetStatus === 'CLEAN' ? 'Clean & Ready' : 'Dirty';
    toast.info(`Room ${room.number} set as ${label}. Click "Save Changes" to apply.`);
  };

  // Toggle Out of Service status / open modal
  const handleToggleOutOfService = (room: RoomRecord) => {
    setServiceModalRoom(room);
    setServiceReason(room.maintenanceReason || '');
  };

  // Confirm Out of Service from modal (staged locally)
  const handleConfirmOutOfService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModalRoom) return;

    const reason = serviceReason.trim() || 'Under scheduled maintenance & servicing';
    const updated = rooms.map((r) =>
      r.id === serviceModalRoom.id
        ? {
            ...r,
            operationalStatus: 'MAINTENANCE' as OperationalStatus,
            maintenanceReason: reason,
            cleaningStatus: 'DIRTY' as CleaningStatus,
          }
        : r
    );

    setRooms(updated);
    setHasUnsavedChanges(true);
    toast.info(
      'Out of Service Staged',
      `Room ${serviceModalRoom.number} marked Out of Service. Click "Save Changes" to apply.`
    );
    setServiceModalRoom(null);
  };

  // Quick return to service from inside Out of Service modal (staged locally)
  const handleReturnToServiceFromModal = (cleanStatus: 'CLEAN' | 'DIRTY' = 'CLEAN') => {
    if (!serviceModalRoom) return;

    const updated = rooms.map((r) =>
      r.id === serviceModalRoom.id
        ? {
            ...r,
            operationalStatus: 'AVAILABLE' as OperationalStatus,
            maintenanceReason: undefined,
            cleaningStatus: cleanStatus as CleaningStatus,
          }
        : r
    );

    setRooms(updated);
    setHasUnsavedChanges(true);
    toast.info(
      'Return Staged',
      `Room ${serviceModalRoom.number} staged as ${
        cleanStatus === 'CLEAN' ? 'Clean & Ready' : 'Dirty'
      }. Click "Save Changes" to apply.`
    );
    setServiceModalRoom(null);
  };

  // Mark all rooms as clean (staged locally)
  const handleMarkAllClean = () => {
    const dirtyRooms = rooms.some(
      (r) => r.cleaningStatus !== 'CLEAN' && r.operationalStatus !== 'MAINTENANCE'
    );
    if (!dirtyRooms) {
      toast.info('All active rooms are already marked as Clean & Ready.');
      return;
    }
    const updated = rooms.map((r) =>
      r.operationalStatus !== 'MAINTENANCE'
        ? { ...r, cleaningStatus: 'CLEAN' as CleaningStatus }
        : r
    );
    setRooms(updated);
    setHasUnsavedChanges(true);
    toast.info('All rooms marked Clean. Click "Save Changes" to apply.');
  };

  // Available unique floors for dropdown
  const availableFloors = useMemo(() => {
    const floorSet = new Set(rooms.map((r) => String(r.floor)));
    const sorted = Array.from(floorSet).sort((a, b) => Number(a) - Number(b));
    return sorted.length > 0 ? sorted : ['1', '2', '3', '4', '5'];
  }, [rooms]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: rooms.length,
      clean: rooms.filter((r) => r.cleaningStatus === 'CLEAN' && r.operationalStatus !== 'MAINTENANCE').length,
      dirty: rooms.filter((r) => r.cleaningStatus !== 'CLEAN' && r.operationalStatus !== 'MAINTENANCE').length,
      maintenance: rooms.filter((r) => r.operationalStatus === 'MAINTENANCE').length,
    };
  }, [rooms]);

  // Status Filter Tabs: Clean, Dirty, Out of Service (No numbers displayed)
  const statusTabs: {
    id: 'ALL' | 'CLEAN' | 'DIRTY' | 'MAINTENANCE';
    label: string;
  }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'CLEAN', label: 'Clean' },
    { id: 'DIRTY', label: 'Dirty' },
    { id: 'MAINTENANCE', label: 'Out of Service' },
  ];

  // Filtered List
  const filteredList = useMemo(() => {
    return rooms.filter((r) => {
      const isMaint = r.operationalStatus === 'MAINTENANCE';
      const isCln = r.cleaningStatus === 'CLEAN' && !isMaint;
      const isDrty = !isCln && !isMaint;

      if (filterTab === 'CLEAN' && !isCln) return false;
      if (filterTab === 'DIRTY' && !isDrty) return false;
      if (filterTab === 'MAINTENANCE' && !isMaint) return false;
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
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedList = useMemo(() => {
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, startIndex, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, floorFilter, searchQuery]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Quick Actions
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Housekeeping
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/room-status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <BedDouble className="w-3.5 h-3.5 text-slate-500" />
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
          FILTER TOOLBAR: Status Tabs + Floor Dropdown + Save Changes Button + Page Size Changer + Search Box (No placeholder)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Show Entries (Far Left) + Status Tabs + Floor Dropdown + Save Changes */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Show [ 10 ] entries per page (Placed at Far Left, matching Hotel Setup & Guest List) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[28px] px-2 border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] bg-white dark:bg-[#07241E] text-xs font-semibold text-[#24352F] dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">entries per page</span>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* Status Tabs (Clean, Dirty, Out of Service - No numbers displayed) */}
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

          {/* Floor Selector Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Floor:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="h-[28px] px-2.5 text-xs font-semibold rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Floors</option>
              {availableFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Floor {fl}
                </option>
              ))}
            </select>
          </div>

          {/* Save Changes Button (Simple, clean and professional) */}
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-1.5 h-[28px] px-3 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>

        {/* Right Side: Search Box (No placeholder) */}
        <div className="relative w-full sm:w-56 shrink-0 sm:ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MAIN HOUSEKEEPING DATATABLE (With Inside Pagination Footer)
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM TYPE &amp; BED</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">FRONT DESK STATUS</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">CLEANING STATUS</th>
                <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">NOTES / DETAILS</th>
                <th className="py-2.5 px-3.5 text-right w-[330px]">DISPATCH ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-slate-700 dark:text-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No rooms found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((r, idx) => {
                  const isMaintenance = r.operationalStatus === 'MAINTENANCE';
                  const isClean = r.cleaningStatus === 'CLEAN' && !isMaintenance;
                  const isDirty = !isClean && !isMaintenance;
                  const isOccupied = r.operationalStatus === 'OCCUPIED';

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'group transition-colors border-b border-[#E5EEE9] dark:border-[#145447]',
                        'bg-white even:bg-[#F9FAFB] dark:bg-[#07241E] dark:even:bg-[#061B16]',
                        'hover:bg-[#F1F5F9] dark:hover:bg-[#0B3D32]/20',
                        isMaintenance && 'bg-rose-50/20 even:bg-rose-50/40 dark:bg-rose-950/10'
                      )}
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#64736C] dark:text-[#A4B8AE] border-r border-[#E5EEE9] dark:border-[#145447]">
                        {startIndex + idx + 1}
                      </td>

                      {/* Room & Floor */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#24352F] dark:text-white text-xs">
                            Room {r.number}
                          </span>
                          <span className="text-[11px] text-[#879B90] dark:text-slate-400 font-medium">
                            Floor {r.floor}
                          </span>
                        </div>
                      </td>

                      {/* Room Type & Bed */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <div className="font-semibold text-[#24352F] dark:text-white text-xs">{r.type}</div>
                        <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                          {r.bedType} • {r.acType}
                        </div>
                      </td>

                      {/* Operational / Front Desk Status */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <span
                          className={cn(
                            'text-xs font-semibold inline-flex items-center gap-1.5',
                            isOccupied
                              ? 'text-blue-600 dark:text-blue-400'
                              : isMaintenance
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isOccupied
                                ? 'bg-blue-500'
                                : isMaintenance
                                ? 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900'
                                : 'bg-emerald-500'
                            )}
                          />
                          <span>{isMaintenance ? 'OUT OF SERVICE' : r.operationalStatus}</span>
                        </span>
                      </td>

                      {/* Cleaning Status */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        <span
                          className={cn(
                            'text-xs font-semibold inline-flex items-center gap-1.5',
                            isClean
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isMaintenance
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isClean
                                ? 'bg-emerald-500'
                                : isMaintenance
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            )}
                          />
                          <span>{isClean ? 'Clean & Ready' : isMaintenance ? 'Under Service' : 'Dirty'}</span>
                        </span>
                      </td>

                      {/* Notes / Details */}
                      <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                        {isMaintenance ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                            <Wrench className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[200px] font-medium" title={r.maintenanceReason}>
                              {r.maintenanceReason || 'Servicing in progress'}
                            </span>
                          </div>
                        ) : isOccupied ? (
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

                      {/* ONLY 3 Checkbox-Style Action Buttons: Clean, Dirty, Out of Service */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* 1. Clean Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleSetRoomStatus(r, 'CLEAN')}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap',
                              isClean
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold dark:bg-emerald-700 dark:border-emerald-700'
                                : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 hover:border-emerald-300'
                            )}
                            title={
                              isClean
                                ? 'Room is currently Clean & Ready'
                                : isMaintenance
                                ? 'Complete service and return room as Clean & Ready'
                                : 'Mark room as Clean & Ready'
                            }
                          >
                            <span
                              className={cn(
                                'w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center transition-all',
                                isClean
                                  ? 'bg-white text-emerald-700 border-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              )}
                            >
                              {isClean && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>Clean</span>
                          </button>

                          {/* 2. Dirty Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleSetRoomStatus(r, 'DIRTY')}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap',
                              isDirty
                                ? 'bg-amber-600 text-white border-amber-600 font-bold dark:bg-amber-700 dark:border-amber-700'
                                : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 hover:border-amber-300'
                            )}
                            title={
                              isDirty
                                ? 'Room is currently Dirty'
                                : isMaintenance
                                ? 'Return from service (Dirty - turnaround required)'
                                : 'Mark room as Dirty (needs turnaround cleaning)'
                            }
                          >
                            <span
                              className={cn(
                                'w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center transition-all',
                                isDirty
                                  ? 'bg-white text-amber-700 border-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              )}
                            >
                              {isDirty && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>Dirty</span>
                          </button>

                          {/* 3. Out of Service Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleOutOfService(r)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap',
                              isMaintenance
                                ? 'bg-rose-600 text-white border-rose-600 font-bold dark:bg-rose-700 dark:border-rose-700'
                                : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 hover:border-rose-300'
                            )}
                            title={
                              isMaintenance
                                ? `Out of Service: ${r.maintenanceReason || 'Click to view / edit servicing note'}`
                                : 'Report fault and place room Out of Service'
                            }
                          >
                            <span
                              className={cn(
                                'w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center transition-all',
                                isMaintenance
                                  ? 'bg-white text-rose-700 border-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              )}
                            >
                              {isMaintenance && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>Out of Service</span>
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

        {/* DataTables Pagination Footer: Showing X to Y of Z entries | Prev / Page Numbers / Next */}
        <div className="px-4 py-2.5 bg-[#FAFBF9] dark:bg-[#061B16] border-t border-[#E5EEE9] dark:border-[#145447] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64736C] dark:text-[#A4B8AE] select-none">
          <div className="text-[11px]">
            Showing{' '}
            <strong className="text-[#24352F] dark:text-white">
              {filteredList.length === 0 ? 0 : startIndex + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-[#24352F] dark:text-white">
              {Math.min(startIndex + pageSize, filteredList.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-[#24352F] dark:text-white">{filteredList.length}</strong>{' '}
            entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 font-medium">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7F5] dark:hover:bg-[#0A2E26] cursor-pointer shadow-2xs"
              >
                Previous
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
                        'px-2.5 py-1 rounded-[2px] text-xs font-semibold cursor-pointer border shadow-2xs font-mono',
                        isCurrent
                          ? 'bg-[#0B3D32] border-[#0B3D32] text-white font-bold'
                          : 'border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-[#24352F] dark:text-slate-200 hover:bg-[#F4F7F5]'
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
                className="px-2.5 py-1 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7F5] dark:hover:bg-[#0A2E26] cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MODAL: Mark Room Out of Service / Edit Servicing
          ----------------------------------------------------------------------- */}
      {serviceModalRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setServiceModalRoom(null)}
        >
          <div
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <Wrench className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    Room {serviceModalRoom.number} – Out of Service
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {serviceModalRoom.type} • Floor {serviceModalRoom.floor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalRoom(null)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmOutOfService}>
              <div className="p-5 space-y-3.5 text-xs">
                {/* Notice if room is already in maintenance */}
                {serviceModalRoom.operationalStatus === 'MAINTENANCE' && (
                  <div className="p-2.5 rounded-[3px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold block">Currently Under Service</span>
                      <span className="text-[11px] opacity-80">
                        {serviceModalRoom.maintenanceReason || 'No notes specified.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReturnToServiceFromModal('CLEAN')}
                      className="px-2.5 py-1 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shrink-0 shadow-2xs"
                    >
                      Return to Service
                    </button>
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Common Maintenance Reasons
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_MAINTENANCE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setServiceReason(preset)}
                        className={cn(
                          'px-2 py-1 rounded-[2px] text-[11px] font-medium border transition-all cursor-pointer',
                          serviceReason === preset
                            ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950/80 dark:border-rose-700 dark:text-rose-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Reason / Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Servicing Notes / Issue Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={serviceReason}
                    onChange={(e) => setServiceReason(e.target.value)}
                    placeholder="e.g. AC cooling malfunction, plumber scheduled..."
                    className="w-full px-2.5 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-medium text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-5 py-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServiceModalRoom(null)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  {serviceModalRoom.operationalStatus === 'MAINTENANCE'
                    ? 'Save Updated Notes'
                    : 'Confirm Out of Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

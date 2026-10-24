'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  BedDouble,
  Users,
  CalendarCheck,
  UserCheck,
  LogOut,
  Sparkles,
  Contact,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Phone,
} from 'lucide-react';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
import {
  RoomBooking,
  loadBookingsFromStorage,
  getRelativeDate,
  AVAILABLE_ROOMS_CATALOG,
} from '../reservations/reservationsData';
import { cn } from '@/lib/utils';

export default function HotelManagementPage() {
  const todayStr = useMemo(() => getRelativeDate(0), []);

  const [bookings, setBookings] = useState<RoomBooking[]>(() => loadBookingsFromStorage());
  const [rooms, setRooms] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('hotel_rooms_setup_v2') || localStorage.getItem('hotel_rooms_setup');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return AVAILABLE_ROOMS_CATALOG;
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleFocus = () => {
      setBookings(loadBookingsFromStorage());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Operational metrics
  const totalRooms = rooms.length || AVAILABLE_ROOMS_CATALOG.length;
  const occupiedRooms = useMemo(() => {
    return rooms.filter((r: any) => r.status === 'OCCUPIED' || r.operationalStatus === 'OCCUPIED').length;
  }, [rooms]);

  const availableRooms = useMemo(() => {
    return rooms.filter(
      (r: any) =>
        (r.status === 'AVAILABLE' || r.operationalStatus === 'AVAILABLE' || !r.status) &&
        r.cleaningStatus !== 'DIRTY' &&
        r.status !== 'OCCUPIED' &&
        r.status !== 'MAINTENANCE'
    ).length;
  }, [rooms]);

  const dirtyRooms = useMemo(() => {
    return rooms.filter((r: any) => r.cleaningStatus === 'DIRTY' || r.cleaningStatus === 'IN_CLEANING').length;
  }, [rooms]);

  const inHouseGuests = useMemo(() => {
    return bookings.filter((b) => b.status === 'CHECKED_IN');
  }, [bookings]);

  const todayArrivals = useMemo(() => {
    return bookings.filter((b) => b.checkIn === todayStr && b.status === 'RESERVED');
  }, [bookings, todayStr]);

  const todayDepartures = useMemo(() => {
    return bookings.filter((b) => b.checkOut === todayStr && b.status === 'CHECKED_IN');
  }, [bookings, todayStr]);

  // Filtered in-house preview
  const filteredInHouse = useMemo(() => {
    if (!searchQuery.trim()) return inHouseGuests;
    const q = searchQuery.toLowerCase().trim();
    return inHouseGuests.filter(
      (b) =>
        b.room.number.toLowerCase().includes(q) ||
        b.guest.firstName.toLowerCase().includes(q) ||
        b.guest.lastName.toLowerCase().includes(q) ||
        (b.guest.phone && b.guest.phone.includes(q))
    );
  }, [inHouseGuests, searchQuery]);

  return (
    <div className="space-y-4 pb-12">
      {/* =====================================================================
          HOTEL MANAGEMENT SUB-OPTIONS (Box Type Options)
          ===================================================================== */}
      <HotelManagementNavBoxes />

      {/* Divider */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] -mt-1 mb-2" />

      {/* =====================================================================
          OPERATIONAL SUMMARY METRIC CARDS
          ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total & Occupancy */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Room Occupancy
            </span>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1A73E8]">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({occupiedRooms} / {totalRooms} Rooms)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {availableRooms} Vacant Clean Ready
          </div>
        </div>

        {/* In-House Guests */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In-House Guests
            </span>
            <div className="p-1.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {inHouseGuests.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Active Stays</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">
            <Link href="/active-stays" className="hover:underline inline-flex items-center gap-1">
              View In-House Roster <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Today's Arrivals */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expected Arrivals
            </span>
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {todayArrivals.length}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Due Check-In
            </span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
            <Link href="/check-in" className="hover:underline inline-flex items-center gap-1">
              Open Check-In Station <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Housekeeping Tasks */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Housekeeping Queue
            </span>
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {dirtyRooms}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Dirty / In Cleaning
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-400 font-medium">
            <Link href="/housekeeping" className="hover:underline inline-flex items-center gap-1">
              Dispatch Housekeeping <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CURRENT IN-HOUSE GUESTS LIVE ROSTER
          ===================================================================== */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Currently In-House Guests ({inHouseGuests.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
            <Link
              href="/active-stays"
              className="text-xs font-semibold text-[#1A73E8] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              All In-House <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Guest Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredInHouse.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {searchQuery ? 'No in-house guests match your search.' : 'No in-house guests at this time.'}
                  </td>
                </tr>
              ) : (
                filteredInHouse.slice(0, 6).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900 text-[11px]">
                        Room {b.room.number}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {b.guest.firstName} {b.guest.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{b.room.type}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.guest.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {b.checkIn}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {b.checkOut}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <Link
                        href={`/checkout`}
                        className="inline-flex items-center px-2.5 py-1 rounded border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-[11px] font-semibold"
                      >
                        Check-Out
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

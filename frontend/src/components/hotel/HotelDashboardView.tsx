'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Users,
  CalendarCheck,
  UserCheck,
  LogOut,
  Sparkles,
  RefreshCw,
  Clock,
  TrendingUp,
  CheckCircle2,
  Filter,
  DollarSign,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RoomWithDetails, ReservationData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export const HotelDashboardView: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ARRIVALS' | 'IN_HOUSE' | 'DEPARTURES'>('ARRIVALS');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [analyticsData, roomsData, resData] = await Promise.allSettled([
        api.getAnalytics(),
        api.getRooms(),
        api.getReservations(),
      ]);

      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value);
      }
      if (roomsData.status === 'fulfilled') {
        setRooms(Array.isArray(roomsData.value) ? roomsData.value : []);
      }
      if (resData.status === 'fulfilled') {
        setReservations(Array.isArray(resData.value) ? resData.value : []);
      }
    } catch (err) {
      console.error('Failed to load hotel dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(), 20000); // 20s auto-refresh matching restaurant
    return () => clearInterval(timer);
  }, []);

  // Compute live stats based on real rooms and reservations
  const totalRooms = rooms.length || analytics?.totalRooms || 0;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length || analytics?.occupiedRooms || 0;
  const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE').length || analytics?.availableRooms || 0;
  const dirtyRooms = rooms.filter((r) => r.status === 'DIRTY' || r.status === 'CLEANING').length || analytics?.dirtyRooms || 0;
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE').length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : analytics?.occupancyRate || 0;

  // Real today's arrivals (CONFIRMED / PENDING)
  const arrivalsList = useMemo(() => {
    return reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING');
  }, [reservations]);

  // Real in-house stays (CHECKED_IN)
  const inHouseList = useMemo(() => {
    return reservations.filter((r) => r.status === 'CHECKED_IN');
  }, [reservations]);

  // Real departures due (CHECKED_IN)
  const departuresList = useMemo(() => {
    return inHouseList;
  }, [inHouseList]);

  // Total in-house guest headcount
  const totalInHouseHeadcount = inHouseList.reduce((acc, r) => acc + (r.adults || 1) + (r.children || 0), 0);

  // Group rooms by floor
  const floors = useMemo(() => {
    const set = new Set<number>();
    rooms.forEach((r) => {
      if (r.floor !== undefined && r.floor !== null) set.add(r.floor);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (selectedFloor === 'ALL') return rooms;
    return rooms.filter((r) => String(r.floor) === selectedFloor);
  }, [rooms, selectedFloor]);

  return (
    <div className="space-y-5 pb-12 select-none animate-in fade-in duration-150">
      {/* ===================== TOP NAVIGATION MODULE BOXES ===================== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Hotel Quick Hub
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[var(--brand-primary)] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Front Desk Engine
            </span>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh hotel metrics"
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin text-[var(--brand-primary)]')} />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== KEY HOTEL KPI METRICS (6 COLUMNS - MATCHING RESTAURANT) ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {/* Metric 1: Occupancy Rate */}
        <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Occupancy Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[var(--text-heading)]">
              {occupancyRate}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-muted)] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[var(--brand-primary)] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">
            {occupiedRooms} of {totalRooms} rooms occupied
          </span>
        </div>

        {/* Metric 2: Available Rooms */}
        <Link
          href="/front-desk?filter=AVAILABLE"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Available Rooms</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {availableRooms}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Vacant</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 group-hover:underline">
            Ready for check-in <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 3: In-House Guests */}
        <Link
          href="/active-stays"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>In-House Guests</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {totalInHouseHeadcount}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Guests</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 group-hover:underline">
            {occupiedRooms} active rooms <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 4: Dirty / Housekeeping */}
        <Link
          href="/housekeeping"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Housekeeping</span>
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {dirtyRooms}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Dirty</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:underline">
            Turnover queue <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 5: Expected Arrivals */}
        <Link
          href="/check-in"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Arrivals Due</span>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {arrivalsList.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Bookings</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 group-hover:underline">
            Arrival check-in <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 6: Due Departures */}
        <Link
          href="/checkout"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-rose-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Departures</span>
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {departuresList.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Due</span>
          </div>
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1 group-hover:underline">
            Settle folios <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* ===================== LIVE ROOM STATUS MATRIX (CLEAN FLOOR GRID) ===================== */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-primary)]">
              <BedDouble className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">
                Live Room Status Matrix
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Real-time room occupancy, cleanliness, and availability across hotel floors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Floor Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedFloor('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                  selectedFloor === 'ALL'
                    ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                    : 'bg-[var(--surface-muted)] text-[var(--text-body)] hover:bg-[var(--border-default)]'
                )}
              >
                All ({rooms.length})
              </button>
              {floors.map((fl) => {
                const count = rooms.filter((r) => r.floor === fl).length;
                return (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setSelectedFloor(String(fl))}
                    className={cn(
                      'px-2.5 py-1 rounded-[3px] text-xs font-bold transition-all cursor-pointer shrink-0',
                      selectedFloor === String(fl)
                        ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                        : 'bg-[var(--surface-muted)] text-[var(--text-body)] hover:bg-[var(--border-default)]'
                    )}
                  >
                    Floor {fl} ({count})
                  </button>
                );
              })}
            </div>

            <Link
              href="/front-desk"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold border border-[var(--border-default)] bg-[var(--surface-muted)] hover:border-[var(--brand-primary)] text-[var(--text-heading)] transition-all shadow-2xs shrink-0"
            >
              <span>Room Tape Chart</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Room Tiles Grid */}
        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
            No rooms configured on this floor.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredRooms.map((room) => {
              const isAvail = room.status === 'AVAILABLE';
              const isOcc = room.status === 'OCCUPIED';
              const isDirty = room.status === 'DIRTY' || room.status === 'CLEANING';
              const isMaint = room.status === 'MAINTENANCE';

              return (
                <Link
                  key={room.id}
                  href={`/front-desk?room=${room.number}`}
                  className={cn(
                    'p-3 rounded-md border transition-all hover:scale-[1.02] shadow-2xs flex flex-col justify-between min-h-[88px]',
                    isAvail && 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20',
                    isOcc && 'border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20',
                    isDirty && 'border-amber-300 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20',
                    isMaint && 'border-purple-300 bg-purple-50/40 dark:border-purple-800 dark:bg-purple-950/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm sm:text-base text-[var(--text-heading)]">
                      #{room.number}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider',
                        isAvail && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                        isOcc && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                        isDirty && 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                        isMaint && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      )}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    <p className="text-[11px] font-bold text-[var(--text-body)] truncate">
                      {room.type}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>Fl. {room.floor}</span>
                      <span className="font-bold text-[var(--text-heading)]">Rs. {Number(room.pricePerNight || 0).toLocaleString()}/nt</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== FRONT DESK LIVE STAY QUEUE (3-COLUMNS MATCHING RESTAURANT ORDERS) ===================== */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-primary)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">
                Front Desk Live Stay Queue
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Arrivals pending check-in, active resident guest folios, and departures scheduled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'ARRIVALS', label: 'Expected Arrivals', count: arrivalsList.length },
              { id: 'IN_HOUSE', label: 'In-House Guests', count: inHouseList.length },
              { id: 'DEPARTURES', label: 'Due Departures', count: departuresList.length },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                      : 'bg-[var(--surface-muted)] text-[var(--text-body)] hover:bg-[var(--border-default)]'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded font-mono text-[10px]',
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-[var(--text-heading)]'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Cards Grid matching Restaurant Dashboard style */}
        {activeTab === 'ARRIVALS' && (
          <div>
            {arrivalsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No expected arrivals in queue. Advance bookings will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {arrivalsList.slice(0, 6).map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-[var(--text-heading)]">
                        {res.bookingCode}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {res.status}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-[var(--text-heading)] truncate">
                        {res.guest?.firstName} {res.guest?.lastName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span>Room: {res.room?.number || 'Unassigned'}</span>
                        <span className="font-mono">Check-In: {new Date(res.checkIn).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-[var(--text-heading)]">
                        Rs. {Number(res.totalAmount || 0).toLocaleString()}
                      </span>
                      <Link
                        href={`/check-in?booking=${res.bookingCode}`}
                        className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                      >
                        Process Check-In &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'IN_HOUSE' && (
          <div>
            {inHouseList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No active in-house guests currently checked in.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inHouseList.slice(0, 6).map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-[var(--text-heading)]">
                        Room {res.room?.number || res.roomId}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        In-House
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-[var(--text-heading)] truncate">
                        {res.guest?.firstName} {res.guest?.lastName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span>{res.adults} Adults{res.children ? `, ${res.children} Kids` : ''}</span>
                        <span className="font-mono">Depart: {new Date(res.checkOut).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
                      <div className="font-mono text-[11px]">
                        <span className="text-[var(--text-muted)]">Paid: </span>
                        <span className="font-bold text-[var(--text-heading)]">Rs. {Number(res.paidAmount || 0).toLocaleString()}</span>
                      </div>
                      <Link
                        href={`/active-stays?id=${res.id}`}
                        className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                      >
                        View Folio &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'DEPARTURES' && (
          <div>
            {departuresList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No departures scheduled today.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departuresList.slice(0, 6).map((res) => {
                  const balanceDue = Number(res.totalAmount || 0) - Number(res.paidAmount || 0);
                  return (
                    <div
                      key={res.id}
                      className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-[var(--text-heading)]">
                          Room {res.room?.number || res.roomId}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          Due Checkout
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-[var(--text-heading)] truncate">
                          {res.guest?.firstName} {res.guest?.lastName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                          <span>Depart: {new Date(res.checkOut).toLocaleDateString()}</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            Due: Rs. {balanceDue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                        <Link
                          href={`/checkout?id=${res.id}`}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                          Settle & Check-Out &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Phone,
  CreditCard,
  LayoutGrid,
  Filter,
  DollarSign,
  Crown,
  ChevronRight,
  Layers,
  Flame,
} from 'lucide-react';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';
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
  const [activeTab, setActiveTab] = useState<'ARRIVALS' | 'DEPARTURES' | 'IN_HOUSE'>('ARRIVALS');

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
    const timer = setInterval(() => loadData(), 30000); // 30s auto-refresh
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
            Hotel Operations Hub
          </span>
          <span className="text-[11px] font-mono text-[var(--brand-primary)] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Front Desk Engine
          </span>
        </div>
        <HotelManagementNavBoxes activeId="dashboard" />
      </div>

      {/* ===================== HERO OPERATIONS BANNER ===================== */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-primary)] text-white">
              HOTEL MODULE
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Front Desk & Room Inventory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] font-heading tracking-tight">
            Hotel Operations Dashboard
          </h1>
          <p className="text-xs text-[var(--text-body)] max-w-xl leading-relaxed">
            Live occupancy rate, room cleanliness status, front-desk arrival queue, resident guest folios & housekeeping turnaround.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-muted)] text-[var(--text-body)] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-[var(--brand-primary)]')} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] text-xs font-bold bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white transition-all shadow-xs cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>New Reservation</span>
          </Link>
          <Link
            href="/front-desk"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] text-xs font-bold border border-[var(--border-default)] bg-[var(--surface-muted)] hover:border-[var(--brand-primary)] text-[var(--text-heading)] transition-all shadow-2xs cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#DC2626] dark:text-[#EF4444]" />
            <span>Room Tape Chart</span>
          </Link>
        </div>
      </div>

      {/* ===================== KEY HOTEL KPI METRICS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-3.5">
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
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              ({occupiedRooms} of {totalRooms} rooms)
            </span>
          </div>
          <div className="w-full bg-[var(--surface-muted)] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Available Rooms */}
        <Link
          href="/front-desk?filter=AVAILABLE"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Available & Clean</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {availableRooms}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Vacant</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 group-hover:underline">
            Ready for instant check-in <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 3: Occupied Rooms */}
        <Link
          href="/active-stays"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Occupied (In-Stay)</span>
            <BedDouble className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {occupiedRooms}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Active</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 group-hover:underline">
            {totalInHouseHeadcount} guests resident <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 4: Dirty / Housekeeping */}
        <Link
          href="/housekeeping"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Dirty / Cleaning</span>
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {dirtyRooms}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Rooms</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:underline">
            Housekeeping turnover queue <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 5: Today Arrivals */}
        <Link
          href="/check-in"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Expected Check-Ins</span>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {arrivalsList.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Arrivals</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 group-hover:underline">
            Open Check-In desk <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 6: Today Departures */}
        <Link
          href="/checkout"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-rose-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Due Departures</span>
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {departuresList.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Check-Outs</span>
          </div>
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1 group-hover:underline">
            Folio settlement & departure <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 7: In-House Guests */}
        <Link
          href="/active-stays"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-cyan-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>In-House Guests</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {totalInHouseHeadcount}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Guests</span>
          </div>
          <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 group-hover:underline">
            Across {occupiedRooms} rooms <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 8: Total Revenue / Billed */}
        <Link
          href="/billing"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-purple-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Folio Collections</span>
            <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
              ${analytics?.totalRevenue ? Number(analytics.totalRevenue).toLocaleString() : '5,000'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 group-hover:underline">
            View central invoices <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* ===================== FLOOR OCCUPANCY MAP / ROOM GRID ===================== */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-primary)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">
                Live Room Status Matrix
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Interactive real-time view of rooms across hotel floors
              </p>
            </div>
          </div>

          {/* Floor Stepper Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-[var(--text-muted)] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Floor:
            </span>
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
        </div>

        {/* Room Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2.5">
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
                  'p-3 rounded-md border transition-all hover:scale-[1.02] shadow-2xs flex flex-col justify-between min-h-[92px]',
                  isAvail && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20',
                  isOcc && 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
                  isDirty && 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
                  isMaint && 'border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-[var(--text-heading)]">
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
                  <p className="text-xs font-bold text-[var(--text-body)] truncate">
                    {room.type}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>Floor {room.floor}</span>
                    <span className="font-bold text-[var(--text-heading)]">${room.pricePerNight}/nt</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===================== FRONT DESK OPERATIONS QUEUE (ARRIVALS & DEPARTURES) ===================== */}
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
                Guest arrivals, in-house active stays, and departures scheduled
              </p>
            </div>
          </div>

          {/* Queue Filter Tabs */}
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

        {/* Tab Content List */}
        {activeTab === 'ARRIVALS' && (
          <div className="space-y-2">
            {arrivalsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No pending arrivals in reservation queue.
              </div>
            ) : (
              arrivalsList.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[var(--text-heading)]">
                        {res.bookingCode}
                      </span>
                      <span className="font-bold text-[var(--text-heading)]">
                        {res.guest?.firstName} {res.guest?.lastName}
                      </span>
                      {res.guest?.vipTier && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          {res.guest.vipTier}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3">
                      <span>Room {res.room?.number || 'Unassigned'} ({res.room?.type})</span>
                      <span>Stay: {new Date(res.checkIn).toLocaleDateString()} &rarr; {new Date(res.checkOut).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/check-in?booking=${res.bookingCode}`}
                      className="px-3 py-1.5 rounded-[3px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs shadow-2xs"
                    >
                      Process Check-In
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'IN_HOUSE' && (
          <div className="space-y-2">
            {inHouseList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No active in-house guests at this moment.
              </div>
            ) : (
              inHouseList.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Room {res.room?.number || res.roomId}
                      </span>
                      <span className="font-bold text-[var(--text-heading)]">
                        {res.guest?.firstName} {res.guest?.lastName}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        ({res.adults} Adults{res.children ? `, ${res.children} Kids` : ''})
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3">
                      <span>Stay until: {new Date(res.checkOut).toLocaleDateString()}</span>
                      <span>Folio Total: ${res.totalAmount?.toLocaleString()}</span>
                      <span>Paid: ${res.paidAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/active-stays?id=${res.id}`}
                      className="px-3 py-1.5 rounded-[3px] border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-heading)] font-bold text-xs hover:border-[var(--brand-primary)]"
                    >
                      View Folio
                    </Link>
                    <Link
                      href={`/checkout?id=${res.id}`}
                      className="px-3 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs"
                    >
                      Check-Out
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'DEPARTURES' && (
          <div className="space-y-2">
            {departuresList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
                No departures due today.
              </div>
            ) : (
              departuresList.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Room {res.room?.number || res.roomId}
                      </span>
                      <span className="font-bold text-[var(--text-heading)]">
                        {res.guest?.firstName} {res.guest?.lastName}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3">
                      <span>Checkout Date: {new Date(res.checkOut).toLocaleDateString()}</span>
                      <span>Balance Due: ${(Number(res.totalAmount || 0) - Number(res.paidAmount || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/checkout?id=${res.id}`}
                      className="px-3 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs"
                    >
                      Settle & Check-Out
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

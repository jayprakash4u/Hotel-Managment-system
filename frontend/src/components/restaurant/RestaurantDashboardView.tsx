'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Table2,
  ChefHat,
  Receipt,
  CalendarCheck,
  TrendingUp,
  Flame,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { api } from '@/lib/api';
import { TableReservationData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export const RestaurantDashboardView: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<TableReservationData[]>([]);
  const [dailySales, setDailySales] = useState<any>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [tablesRes, ordersRes, resData, salesRes] = await Promise.allSettled([
        api.getRestaurantTables(),
        api.getRestaurantOrders({ activeOnly: true }),
        api.getTableReservations(),
        api.getDailySales(),
      ]);

      if (tablesRes.status === 'fulfilled') {
        const raw = tablesRes.value;
        const list = Array.isArray(raw) ? raw : ((raw as any)?.data || []);
        setTables(list);
      }
      if (ordersRes.status === 'fulfilled') {
        const raw = ordersRes.value;
        const list = Array.isArray(raw) ? raw : ((raw as any)?.data || []);
        setOrders(list);
      }
      if (resData.status === 'fulfilled') {
        setReservations(Array.isArray(resData.value) ? resData.value : []);
      }
      if (salesRes.status === 'fulfilled') {
        setDailySales(salesRes.value);
      }
    } catch (err) {
      console.error('Failed to load restaurant dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(), 20000); // 20s auto-refresh
    return () => clearInterval(timer);
  }, []);

  const totalTables = tables.length || 0;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'SEATED').length;
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE' || !t.status).length;
  const reservedTables = tables.filter((t) => t.status === 'RESERVED').length;
  const seatingRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  // Kitchen prep queue (received or preparing)
  const kitchenQueue = orders.filter((o) => ['RECEIVED', 'PREPARING', 'IN_KITCHEN'].includes(o.status));
  const readyQueue = orders.filter((o) => o.status === 'READY');

  const todayGrossSales = dailySales?.totalSales || orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="space-y-5 pb-12 select-none animate-in fade-in duration-150">
      {/* ===================== TOP NAVIGATION MODULE BOXES ===================== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Restaurant Quick Hub
          </span>
          <span className="text-[11px] font-mono text-[var(--brand-primary)] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Dine-In POS Engine
          </span>
        </div>
        <RestaurantManagementNavBoxes activeId="dashboard" />
      </div>



      {/* ===================== KEY RESTAURANT KPI METRICS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {/* Metric 1: Seating Rate */}
        <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Floor Seating</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[var(--text-heading)]">
              {seatingRate}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-muted)] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[var(--brand-primary)] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(seatingRate, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">
            {occupiedTables} of {totalTables} tables seated
          </span>
        </div>

        {/* Metric 2: Available Tables */}
        <Link
          href="/tables?tab=TABLE_BOARD"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Available Tables</span>
            <Table2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {availableTables}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Vacant</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 group-hover:underline">
            Ready to seat <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 3: Active Orders */}
        <Link
          href="/tables?tab=ACTIVE_ORDERS"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Active Orders</span>
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {orders.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">In Service</span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 group-hover:underline">
            Dine-in & counter <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 4: Kitchen Queue */}
        <Link
          href="/restaurant-management?section=kitchen"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Kitchen Queue</span>
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {kitchenQueue.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Cooking</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:underline">
            {readyQueue.length} ready to serve <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 5: Table Reservations */}
        <Link
          href="/tables?tab=RESERVATIONS"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Reservations</span>
            <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {reservations.length}
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Bookings</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 group-hover:underline">
            Advance dining <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Metric 6: Today Sales */}
        <Link
          href="/billing"
          className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-purple-500 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Today Sales</span>
            <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
              ${Number(todayGrossSales || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 group-hover:underline">
            Total sales & bills <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>



      {/* ===================== ACTIVE ORDERS & PREP QUEUE ===================== */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-primary)]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">
                Active Orders & Service Queue
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Live orders in preparation and awaiting billing settlement
              </p>
            </div>
          </div>

          <Link
            href="/tables?tab=ACTIVE_ORDERS"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold border border-[var(--border-default)] bg-[var(--surface-muted)] hover:border-[var(--brand-primary)] text-[var(--text-heading)] transition-all shadow-2xs"
          >
            <span>View All Active Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Orders Cards Grid */}
        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed rounded-md">
            No active orders in service queue. Start an order on Table Board or Quick Bill.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.slice(0, 6).map((ord) => {
              const tableNum = ord.table?.tableNumber;
              const isCooking = ['RECEIVED', 'PREPARING', 'IN_KITCHEN'].includes(ord.status);
              const isReady = ord.status === 'READY';

              return (
                <div
                  key={ord.id}
                  className="p-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-muted)] flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-[var(--text-heading)]">
                      {ord.kotNumber || ord.orderNumber}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider',
                        isCooking && 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                        isReady && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                        !isCooking && !isReady && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      )}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>
                      {tableNum ? `Table ${tableNum}` : ord.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Walk-In'}
                    </span>
                    <span>{ord.items?.length || 0} items</span>
                    <span className="font-mono font-bold text-[var(--text-heading)]">
                      ${Number(ord.total || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                    <Link
                      href="/tables?tab=ACTIVE_ORDERS"
                      className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline"
                    >
                      Open Order Details &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

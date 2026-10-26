'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UtensilsCrossed,
  Flame,
  ArrowRight,
  Table2,
  BedDouble,
  Receipt,
  User,
  ShoppingBag,
  Armchair,
} from 'lucide-react';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface KitchenItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  kotNumber?: string;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  orderType: string;
  createdAt: string;
  serverName?: string;
  customerName?: string;
  room?: { number: string };
  table?: { tableNumber: string; section?: string };
  items: KitchenItem[];
  notes?: string;
  total: number;
}

function KitchenKDSContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') || 'kitchen';

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RECEIVED' | 'PREPARING' | 'READY'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchKitchenOrders = async () => {
    try {
      const res = await (api as any).getRestaurantOrders({ status: 'RECEIVED,PREPARING,READY' });
      if (res && res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res)) {
        setOrders(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch kitchen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000); // 10s auto-polling for kitchen tickets
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await (api as any).updateRestaurantOrderStatus(orderId, { status: nextStatus });
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
          .filter((o) => (nextStatus === 'SERVED' ? false : true))
      );
      toast.success(
        `Ticket Updated`,
        `Order marked as ${nextStatus === 'PREPARING' ? 'Preparing (Cooking)' : nextStatus === 'READY' ? 'Ready to Serve' : 'Served'}.`
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === 'ALL') return true;
    return o.status === selectedFilter;
  });

  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="space-y-6 pb-12 select-none animate-in fade-in duration-150">
      {/* =====================================================================
          TOP NAVIGATION BOXES (QUICK HUB MODULES)
          ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Restaurant Quick Hub
          </span>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
            Live Kitchen Workflow
          </span>
        </div>
        <RestaurantManagementNavBoxes activeId={activeSection === 'kitchen' ? 'kitchen' : 'restaurant-management'} />
      </div>

      {/* =====================================================================
          KITCHEN DISPLAY SYSTEM (KDS) HEADER & CONTROLS
          ===================================================================== */}
      <div className="p-4 rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kitchen Display System (KDS)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  {orders.length} Active Orders
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live Kitchen Orders dispatched from Tables, No-Table orders, and Counter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchKitchenOrders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh Queue</span>
            </button>
            <Link
              href="/tables"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#0B3D32] hover:bg-[#093027] text-white transition-colors cursor-pointer"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Table Board</span>
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'RECEIVED', label: 'New / Received', count: receivedCount, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
            { id: 'PREPARING', label: 'Cooking / Preparing', count: preparingCount, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
            { id: 'READY', label: 'Ready to Serve', count: readyCount, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
          ].map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id as any)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-[#071F1A] dark:border-slate-700 dark:text-slate-300'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded font-mono text-[10px]',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          KITCHEN TICKETS GRID
          ===================================================================== */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A]">
          <ChefHat className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No active orders in kitchen queue</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            When a waiter starts an order on the Table Board and clicks &quot;Send Order&quot;, it will appear here immediately for preparation.
          </p>
          <Link
            href="/tables"
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Open Table Board</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((ord) => {
            const isReceived = ord.status === 'RECEIVED';
            const isPreparing = ord.status === 'PREPARING';
            const isReady = ord.status === 'READY';
            const isBusy = updatingId === ord.id;
            const tableNum = ord.table?.tableNumber;
            const roomNum = ord.room?.number;
            const orderTime = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={ord.id}
                className={cn(
                  'rounded-lg border bg-white dark:bg-[#071F1A] shadow-xs flex flex-col justify-between overflow-hidden transition-all',
                  isReceived
                    ? 'border-amber-300 dark:border-amber-700/70 ring-1 ring-amber-300/40'
                    : isPreparing
                    ? 'border-blue-300 dark:border-blue-700/70 ring-1 ring-blue-300/40'
                    : 'border-emerald-300 dark:border-emerald-700/70 ring-1 ring-emerald-300/40'
                )}
              >
                {/* Ticket Top Header */}
                <div
                  className={cn(
                    'p-3 border-b flex items-center justify-between',
                    isReceived
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                      : isPreparing
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {ord.kotNumber || ord.orderNumber}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider',
                          isReceived
                            ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                            : isPreparing
                            ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                        )}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 opacity-70" />
                      <span>{orderTime}</span>
                      {ord.serverName && <span>· Server: {ord.serverName}</span>}
                    </div>
                  </div>

                  {/* Destination Badge: Table, Room, Takeaway, or No Table */}
                  <div className="text-right">
                    {tableNum ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0B3D32] text-white font-mono font-bold text-xs shadow-2xs">
                        <Table2 className="w-3.5 h-3.5" />
                        <span>Table {tableNum}</span>
                      </span>
                    ) : roomNum ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-600 text-white font-mono font-bold text-xs shadow-2xs">
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>Room {roomNum}</span>
                      </span>
                    ) : ord.orderType === 'TAKEAWAY' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Takeaway</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-700 text-white font-mono font-bold text-xs shadow-2xs" title={ord.notes || 'No Table customer'}>
                        <Armchair className="w-3.5 h-3.5" />
                        <span>No Table{ord.notes ? ` · ${ord.notes}` : ''}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-3.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {(ord.items || []).map((item, idx) => (
                    <div key={item.id || idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                            {item.productName}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 italic mt-0.5 font-medium">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {ord.notes && (
                    <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                      <strong>Order Note:</strong> {ord.notes}
                    </div>
                  )}
                </div>

                {/* Ticket Action Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {ord.items?.length || 0} item{(ord.items?.length || 0) > 1 ? 's' : ''}
                  </span>

                  {isReceived && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                      className="px-3 py-1.5 rounded-[4px] bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'Updating...' : 'Start Cooking'}</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      className="px-3 py-1.5 rounded-[4px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'Updating...' : 'Mark Ready'}</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                      className="px-3 py-1.5 rounded-[4px] bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'Updating...' : 'Mark Served'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RestaurantManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Restaurant Module...</div>}>
      <KitchenKDSContent />
    </Suspense>
  );
}

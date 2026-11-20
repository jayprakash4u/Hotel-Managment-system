'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wine,
  Clock,
  CheckCircle2,
  RefreshCw,
  GlassWater,
  Sparkles,
  Table2,
  BedDouble,
  ShoppingBag,
  Armchair,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Search,
  Check,
  X,
  Eye,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Play,
  CheckCheck,
  Timer,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isBeverageCategory } from '@/lib/menuData';

export type PreparationMethodType = 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED';
export type ItemPreparationStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export interface BarItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  remarks?: string;
  unit?: string;
  department?: string;
  category?: string;
  preparationMethod?: PreparationMethodType;
  status?: ItemPreparationStatus;
  preparationStartedAt?: string;
  preparationCompletedAt?: string;
  preparedBy?: string;
  preparationDurationMinutes?: number;
}

export interface BarOrder {
  id: string;
  orderNumber: string;
  kotNumber?: string;
  botNumber?: string;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  orderType: string;
  createdAt: string;
  serverName?: string;
  customerName?: string;
  room?: { number: string };
  table?: { tableNumber: string; section?: string };
  items: BarItem[];
  notes?: string;
  total?: number;
}

/**
 * Filter out reservation boilerplate (e.g. "Reservation TR-1005...", "Walk-in Guest")
 * so bar staff only see actual drink preparation remarks.
 */
export function getCleanBarNote(note?: string): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  if (
    /^reservation\s+(tr-|\w+)/i.test(trimmed) ||
    trimmed.toLowerCase().startsWith('reservation ') ||
    trimmed.toLowerCase().includes('walk-in guest') ||
    trimmed.toLowerCase() === 'walk-in' ||
    trimmed.toLowerCase().includes('birthday celebration') ||
    trimmed.toLowerCase().includes('window side') ||
    trimmed.toLowerCase().includes('quiet romantic corner')
  ) {
    return null;
  }
  return trimmed;
}

function playBarChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1); // B5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function getElapsedMinutes(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 60000));
}

function formatElapsed(minutes: number): string {
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function BarBDSView() {
  const toast = useToast();
  const [orders, setOrders] = useState<BarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeModalOrder, setActiveModalOrder] = useState<BarOrder | null>(null);
  const [, setLastRefreshed] = useState<Date>(new Date());
  const prevOrderCountRef = useRef(0);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load sound setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bds_sound_enabled');
      if (stored !== null) setSoundEnabled(stored === 'true');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bds_sound_enabled', String(next));
    }
  };

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const fetchBarOrders = async () => {
    try {
      const res = await api.getRestaurantOrders({ status: 'RECEIVED,PREPARING,READY,IN_KITCHEN,SERVED' });
      const rawList = Array.isArray(res)
        ? res
        : (res as any)?.success && Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];

      const normalized: BarOrder[] = rawList
        .map((o: any) => {
          // STRICT SEPARATION: Only bar / beverage / BOT items in Bar BDS
          const barItems: BarItem[] = (o.items || [])
            .filter((it: any) => {
              if (it.department === 'BOT') return true;
              if (isBeverageCategory(it.category, it.productName)) return true;
              return false;
            })
            .map((it: any) => {
              // Ensure default values for preparation method and status if missing from DB
              const prepMethod: PreparationMethodType =
                it.preparationMethod === 'READY_TO_SERVE' ||
                it.preparationMethod === 'REQUIRES_PREPARATION' ||
                it.preparationMethod === 'NOT_CONFIGURED'
                  ? it.preparationMethod
                  : 'NOT_CONFIGURED';

              const itemStatus: ItemPreparationStatus =
                it.status === 'PREPARING' ||
                it.status === 'READY' ||
                it.status === 'SERVED' ||
                it.status === 'CANCELLED'
                  ? it.status
                  : 'RECEIVED';

              return {
                ...it,
                preparationMethod: prepMethod,
                status: itemStatus,
              };
            });

          // Calculate effective ticket status based on active items
          const active = barItems.filter((i) => i.status !== 'CANCELLED');
          let effectiveStatus: BarOrder['status'] = o.status === 'IN_KITCHEN' ? 'PREPARING' : o.status;
          if (active.length > 0) {
            if (active.every((i) => i.status === 'SERVED')) {
              effectiveStatus = 'SERVED';
            } else if (active.every((i) => i.status === 'READY' || i.status === 'SERVED')) {
              effectiveStatus = 'READY';
            } else if (active.some((i) => i.status === 'PREPARING' || i.status === 'READY' || i.status === 'SERVED')) {
              effectiveStatus = 'PREPARING';
            } else {
              effectiveStatus = 'RECEIVED';
            }
          }

          return {
            ...o,
            status: effectiveStatus,
            items: barItems,
          };
        })
        .filter((o: any) => o.items && o.items.length > 0);

      // Chime if new bar orders arrived
      if (soundEnabled && normalized.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        playBarChime();
      }
      prevOrderCountRef.current = normalized.length;

      setOrders(normalized);
      setLastRefreshed(new Date());

      // If modal is open, keep its order data updated
      if (activeModalOrder) {
        const found = normalized.find((item: BarOrder) => item.id === activeModalOrder.id);
        if (found) setActiveModalOrder(found);
      }
    } catch (err: any) {
      console.error('Failed to fetch bar orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarOrders();
    const interval = setInterval(fetchBarOrders, 6000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery, pageSize]);

  // Update status for an INDIVIDUAL drink item
  const handleUpdateItemStatus = async (
    orderId: string,
    itemId: string,
    nextStatus: ItemPreparationStatus
  ) => {
    setUpdatingItemId(itemId);
    try {
      await api.updateRestaurantOrderItemStatus(orderId, itemId, {
        status: nextStatus,
        staffName: 'Bar Staff',
      });

      // Optimistic update of local state
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const nowIso = new Date().toISOString();
          const updatedItems = ord.items.map((it) => {
            if (it.id !== itemId) return it;
            const startedAt =
              nextStatus === 'PREPARING' && !it.preparationStartedAt ? nowIso : it.preparationStartedAt;
            const completedAt = nextStatus === 'READY' ? nowIso : it.preparationCompletedAt;
            let durationMins = it.preparationDurationMinutes;
            if (nextStatus === 'READY' && startedAt) {
              const diffMs = Date.now() - new Date(startedAt).getTime();
              durationMins = Math.max(0.5, Math.round((diffMs / 60000) * 10) / 10);
            }

            return {
              ...it,
              status: nextStatus,
              preparationStartedAt: startedAt,
              preparationCompletedAt: completedAt,
              preparedBy: 'Bar Staff',
              preparationDurationMinutes: durationMins,
            };
          });

          // Recalculate ticket-level status from active items
          const active = updatedItems.filter((i) => i.status !== 'CANCELLED');
          let computedStatus: BarOrder['status'] = ord.status;
          if (active.length > 0) {
            if (active.every((i) => i.status === 'SERVED')) {
              computedStatus = 'SERVED';
            } else if (active.every((i) => i.status === 'READY' || i.status === 'SERVED')) {
              computedStatus = 'READY';
            } else if (active.some((i) => i.status === 'PREPARING' || i.status === 'READY' || i.status === 'SERVED')) {
              computedStatus = 'PREPARING';
            } else {
              computedStatus = 'RECEIVED';
            }
          }

          const updatedOrder = { ...ord, items: updatedItems, status: computedStatus };
          if (activeModalOrder && activeModalOrder.id === orderId) {
            setActiveModalOrder(updatedOrder);
          }
          return updatedOrder;
        })
      );

      toast.success(
        'Drink Status Updated',
        nextStatus === 'PREPARING'
          ? 'Preparation started.'
          : nextStatus === 'READY'
          ? 'Drink marked as Ready to Serve.'
          : 'Drink marked as Served.'
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update drink status.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Update status for the ENTIRE ticket (e.g. Mark Served when all ready, or Mark All Ready)
  const handleUpdateTicketStatus = async (orderId: string, nextStatus: 'READY' | 'SERVED') => {
    setUpdatingTicketId(orderId);
    try {
      await api.updateRestaurantOrderStatus(orderId, { status: nextStatus });
      setOrders((prev) =>
        prev
          .map((ord) => {
            if (ord.id !== orderId) return ord;
            const updatedItems = ord.items.map((it) => {
              if (it.status === 'CANCELLED') return it;
              return {
                ...it,
                status: nextStatus as ItemPreparationStatus,
                preparationCompletedAt: nextStatus === 'READY' ? new Date().toISOString() : it.preparationCompletedAt,
              };
            });
            const updated = { ...ord, status: nextStatus, items: updatedItems };
            if (activeModalOrder && activeModalOrder.id === orderId) {
              if (nextStatus === 'SERVED' && selectedFilter !== 'SERVED' && selectedFilter !== 'ALL') {
                setActiveModalOrder(null);
              } else {
                setActiveModalOrder(updated);
              }
            }
            return updated;
          })
          .filter((ord) => {
            if (nextStatus === 'SERVED' && selectedFilter !== 'SERVED' && selectedFilter !== 'ALL') {
              return false;
            }
            return true;
          })
      );

      toast.success(
        'Bar Ticket Updated',
        nextStatus === 'READY' ? 'All drinks marked as Ready.' : 'All drinks marked as Served.'
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update ticket status.');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      if (active.length === 0) return false;

      // Status Filter
      if (selectedFilter === 'RECEIVED') {
        // Tickets with active items that have not started prep and are not yet ready
        const isAllReceived = active.every((i) => (i.status || 'RECEIVED') === 'RECEIVED');
        if (!isAllReceived) return false;
      } else if (selectedFilter === 'PREPARING') {
        // Tickets with at least one item currently being prepared, or in-progress
        const hasPreparing = active.some((i) => i.status === 'PREPARING');
        const hasMixed = active.some((i) => i.status === 'READY') && active.some((i) => (i.status || 'RECEIVED') === 'RECEIVED');
        if (!hasPreparing && !hasMixed) return false;
      } else if (selectedFilter === 'READY') {
        // Tickets where ALL active items are ready
        const isAllReady = active.every((i) => i.status === 'READY');
        if (!isAllReady) return false;
      } else if (selectedFilter === 'SERVED') {
        // Tickets where all active items are served
        const isAllServed = active.every((i) => i.status === 'SERVED');
        if (!isAllServed) return false;
      } else if (selectedFilter === 'ALL') {
        // Show active tickets (omit fully served unless explicitly requested)
        if (active.every((i) => i.status === 'SERVED')) return false;
      }

      // Quick Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketNum = (o.botNumber || o.kotNumber || o.orderNumber || '').toLowerCase();
        const tableNum = (o.table?.tableNumber || '').toLowerCase();
        const roomNum = (o.room?.number || '').toLowerCase();
        const serverName = (o.serverName || '').toLowerCase();
        const hasItem = o.items?.some((it) => it.productName.toLowerCase().includes(q));
        const hasRemark = o.items?.some((it) => (it.notes || it.remarks || '').toLowerCase().includes(q));
        if (
          !ticketNum.includes(q) &&
          !tableNum.includes(q) &&
          !roomNum.includes(q) &&
          !serverName.includes(q) &&
          !hasItem &&
          !hasRemark
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedFilter, searchQuery]);

  // Tab counters based on item-level status rules
  const receivedCount = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      return active.length > 0 && active.every((i) => (i.status || 'RECEIVED') === 'RECEIVED');
    }).length;
  }, [orders]);

  const preparingCount = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      if (active.length === 0) return false;
      const hasPreparing = active.some((i) => i.status === 'PREPARING');
      const hasMixed = active.some((i) => i.status === 'READY') && active.some((i) => (i.status || 'RECEIVED') === 'RECEIVED');
      return hasPreparing || hasMixed;
    }).length;
  }, [orders]);

  const readyCount = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      return active.length > 0 && active.every((i) => i.status === 'READY');
    }).length;
  }, [orders]);

  const servedCount = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      return active.length > 0 && active.every((i) => i.status === 'SERVED');
    }).length;
  }, [orders]);

  const allActiveCount = useMemo(() => {
    return orders.filter((o) => {
      const active = o.items.filter((i) => i.status !== 'CANCELLED');
      return active.length > 0 && !active.every((i) => i.status === 'SERVED');
    }).length;
  }, [orders]);

  // Pagination calculation
  const totalEntries = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, startIndex, pageSize]);

  return (
    <div className="w-full space-y-4 select-none font-sans">
      {/* =========================================================================
          1. HEADER: Title, Stats & Action Controls
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/60 shadow-2xs">
            <Wine className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Bar Display
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
              {allActiveCount} Active BOT
            </span>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2">
          {/* Table / Cards View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
              title="Table View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={cn(
              'p-2 rounded-lg text-xs font-medium border transition shadow-2xs cursor-pointer',
              soundEnabled
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600'
            )}
            title={soundEnabled ? 'Alert chime enabled' : 'Alert chime muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchBarOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh bar orders"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>{loading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TOOLBAR: Status Tabs, Entries Per Page & Quick Search
         ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        {/* Status Filter Tabs (Replacing "Mixing" with "Preparing" as requested) */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders', count: allActiveCount },
            { id: 'RECEIVED', label: 'Received', count: receivedCount },
            { id: 'PREPARING', label: 'Preparing', count: preparingCount },
            { id: 'READY', label: 'Ready', count: readyCount },
            { id: 'SERVED', label: 'Served', count: servedCount },
          ].map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id as any)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold',
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Section: Show Entries + Search Input */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Show [10] entries per page */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-[30px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BOT, table, drink..."
              className="w-full h-[30px] pl-8 pr-7 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN CONTENT: TABLE VIEW (PRIMARY) OR CARDS VIEW
         ========================================================================= */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <Wine className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No orders found in {selectedFilter === 'ALL' ? 'active' : selectedFilter.toLowerCase()} tab
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Bar queue is cleared for this view</p>
        </div>
      ) : viewMode === 'table' ? (
        /* -----------------------------------------------------------------------
           TABLE FORM (With Item-Level Preparation Method & Status)
           ----------------------------------------------------------------------- */
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-32">BOT / Ticket</th>
                  <th className="py-3 px-3 w-28">Destination</th>
                  <th className="py-3 px-4 min-w-[340px]">Ordered Drinks (Method & Status)</th>
                  <th className="py-3 px-4 min-w-[200px]">Note / Remarks</th>
                  <th className="py-3 px-3 w-28">Waiter / Server</th>
                  <th className="py-3 px-3 w-28 text-center">Ticket Status</th>
                  <th className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOrders.map((ord, idx) => {
                  const isBusy = updatingTicketId === ord.id;
                  const tableNum = ord.table?.tableNumber;
                  const roomNum = ord.room?.number;
                  const orderTime = new Date(ord.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  // Item-level remarks entered when taking order
                  const itemRemarks = (ord.items || [])
                    .filter((it) => (it.notes || it.remarks) && String(it.notes || it.remarks).trim())
                    .map((it) => ({
                      productName: it.productName,
                      remark: String(it.notes || it.remarks).trim(),
                    }));
                  const cleanOrderNote = getCleanBarNote(ord.notes);
                  const hasRemarks = itemRemarks.length > 0 || !!cleanOrderNote;

                  const activeItems = ord.items.filter((i) => i.status !== 'CANCELLED');
                  const readyItems = activeItems.filter((i) => i.status === 'READY' || i.status === 'SERVED');
                  const isAllReady = activeItems.length > 0 && activeItems.every((i) => i.status === 'READY');
                  const isAllServed = activeItems.length > 0 && activeItems.every((i) => i.status === 'SERVED');
                  const isAnyPreparing = activeItems.some((i) => i.status === 'PREPARING');

                  return (
                    <tr
                      key={ord.id}
                      className={cn(
                        'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
                        ord.status === 'RECEIVED' && 'bg-amber-50/15 dark:bg-amber-950/10',
                        isAllReady && 'bg-emerald-50/15 dark:bg-emerald-950/10'
                      )}
                    >
                      {/* 1. Index */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                        {startIndex + idx + 1}
                      </td>

                      {/* 2. BOT / Ticket */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight">
                            {ord.botNumber || (ord.kotNumber ? ord.kotNumber.replace(/^KOT/i, 'BOT') : `BOT-${ord.orderNumber.replace(/^[A-Za-z]+-/, '')}`)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{orderTime}</div>
                      </td>

                      {/* 3. Destination (Table / Room / Takeaway) */}
                      <td className="py-3 px-3">
                        {tableNum ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                            <Table2 className="w-3 h-3 text-emerald-400 dark:text-emerald-700" />
                            <span>T-{tableNum}</span>
                          </div>
                        ) : roomNum ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs bg-purple-900 text-purple-100 dark:bg-purple-100 dark:text-purple-900">
                            <BedDouble className="w-3 h-3 text-purple-300 dark:text-purple-700" />
                            <span>R-{roomNum}</span>
                          </div>
                        ) : ord.orderType?.toUpperCase() === 'TAKEAWAY' ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs bg-amber-900 text-amber-100 dark:bg-amber-100 dark:text-amber-900">
                            <ShoppingBag className="w-3 h-3 text-amber-300 dark:text-amber-700" />
                            <span>Takeaway</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Armchair className="w-3 h-3 text-slate-500" />
                            <span>Walk-In</span>
                          </div>
                        )}
                        {ord.customerName && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px] mt-0.5">
                            {ord.customerName}
                          </div>
                        )}
                      </td>

                      {/* 4. Ordered Drinks Column: Dynamic Item Status & Action Buttons */}
                      <td className="py-3 px-4">
                        <div className="space-y-2">
                          {ord.items.map((it, itemIdx) => {
                            const isItemBusy = updatingItemId === it.id;
                            const isReadyToServe = it.preparationMethod === 'READY_TO_SERVE';
                            const isPrepRequired = it.preparationMethod === 'REQUIRES_PREPARATION';
                            const isNotConfigured = !isReadyToServe && !isPrepRequired;

                            const itemStatus = it.status || 'RECEIVED';
                            const isItemReceived = itemStatus === 'RECEIVED';
                            const isItemPreparing = itemStatus === 'PREPARING';
                            const isItemReady = itemStatus === 'READY';
                            const isItemServed = itemStatus === 'SERVED';

                            return (
                              <div
                                key={it.id || itemIdx}
                                className={cn(
                                  'p-1.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2',
                                  isItemReady
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                                    : isItemPreparing
                                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/40'
                                    : isNotConfigured
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40'
                                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                                )}
                              >
                                {/* Left: Item Details & Method Badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold font-mono text-[11px]">
                                    {it.quantity}×
                                  </span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                    {it.productName}
                                    {it.unit ? ` (${it.unit})` : ''}
                                  </span>

                                  {/* Preparation Method Badge */}
                                  {isReadyToServe ? (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      Ready to Serve
                                    </span>
                                  ) : isPrepRequired ? (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                      Requires Prep
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse"
                                      title="This drink has no preparation method configured in Menu Setup."
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      Not Configured
                                    </span>
                                  )}
                                </div>

                                {/* Right: Dynamic Item-Level Action Button */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                  {/* If Ready to Serve and Received: Immediately show 'Mark Ready' */}
                                  {isReadyToServe && isItemReceived && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                      disabled={isItemBusy}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                                    >
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Mark Ready</span>
                                    </button>
                                  )}

                                  {/* If Requires Prep and Received: Show 'Start Preparing' */}
                                  {isPrepRequired && isItemReceived && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemStatus(ord.id, it.id, 'PREPARING')}
                                      disabled={isItemBusy}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                                    >
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                      <span>Start Preparing</span>
                                    </button>
                                  )}

                                  {/* If Requires Prep and Preparing: Show 'Mark Ready' with elapsed timer */}
                                  {isPrepRequired && isItemPreparing && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                      disabled={isItemBusy}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50 animate-pulse"
                                    >
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Mark Ready</span>
                                      {it.preparationStartedAt && (
                                        <span className="text-[10px] opacity-90 font-mono">
                                          ({formatElapsed(getElapsedMinutes(it.preparationStartedAt))})
                                        </span>
                                      )}
                                    </button>
                                  )}

                                  {/* If Unconfigured item: Allow staff to mark ready directly or start prep */}
                                  {isNotConfigured && isItemReceived && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                        disabled={isItemBusy}
                                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                                        title="Quick-serve as ready"
                                      >
                                        Mark Ready
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemStatus(ord.id, it.id, 'PREPARING')}
                                        disabled={isItemBusy}
                                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-2xs cursor-pointer"
                                        title="Start drink preparation"
                                      >
                                        Prep
                                      </button>
                                    </div>
                                  )}

                                  {isNotConfigured && isItemPreparing && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                      disabled={isItemBusy}
                                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                                    >
                                      Mark Ready
                                    </button>
                                  )}

                                  {/* If Item is already Ready */}
                                  {isItemReady && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Ready</span>
                                      {it.preparationDurationMinutes && (
                                        <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-200">
                                          ({it.preparationDurationMinutes}m)
                                        </span>
                                      )}
                                    </span>
                                  )}

                                  {/* If Item is Served */}
                                  {isItemServed && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                                      Served
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* 5. Note / Remarks Column */}
                      <td className="py-3 px-4">
                        {hasRemarks ? (
                          <div className="space-y-1 max-w-[280px]">
                            {itemRemarks.map((ir, rIdx) => (
                              <div
                                key={rIdx}
                                className="inline-flex items-start gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/50"
                              >
                                <span className="font-semibold text-amber-800 dark:text-amber-300">
                                  {ir.productName}:
                                </span>
                                <span className="italic">{ir.remark}</span>
                              </div>
                            ))}
                            {cleanOrderNote && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                                <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="italic truncate">{cleanOrderNote}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* 6. Waiter / Server */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs">
                        <span className="truncate max-w-[100px] block font-medium">
                          {ord.serverName || 'Staff'}
                        </span>
                      </td>

                      {/* 7. Overall Ticket Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            isAllServed
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              : isAllReady
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : isAnyPreparing || readyItems.length > 0
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          )}
                        >
                          {isAllServed
                            ? 'Served'
                            : isAllReady
                            ? 'Ready'
                            : isAnyPreparing || readyItems.length > 0
                            ? `Preparing (${readyItems.length}/${activeItems.length})`
                            : 'Received'}
                        </span>
                      </td>

                      {/* 8. Action Area */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Items Modal Button */}
                          <button
                            type="button"
                            onClick={() => setActiveModalOrder(ord)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            title="View drinks detail & checklist"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* When ALL drinks are ready: Allow Marking Ticket Served */}
                          {isAllReady && !isAllServed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ord.id, 'SERVED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                              <span>Mark Served</span>
                            </button>
                          )}

                          {/* Shortcut: Mark All Drinks on ticket Ready at once if not all ready */}
                          {!isAllReady && !isAllServed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ord.id, 'READY')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs transition cursor-pointer disabled:opacity-50"
                              title="Mark all remaining active drinks ready on this ticket"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>All Ready</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* -------------------------------------------------------------------
              DATATABLES PAGINATION FOOTER
              ------------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + pageSize, totalEntries)} of {totalEntries} entries
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {hasGap && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          'w-8 h-8 rounded-md text-xs font-semibold flex items-center justify-center transition shadow-2xs cursor-pointer',
                          safeCurrentPage === p
                            ? 'bg-[#0B3D32] text-white border border-[#0B3D32]'
                            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           CARDS VIEW
           ----------------------------------------------------------------------- */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedOrders.map((ord) => {
              const activeItems = ord.items.filter((i) => i.status !== 'CANCELLED');
              const isAllReady = activeItems.length > 0 && activeItems.every((i) => i.status === 'READY');
              const isAllServed = activeItems.length > 0 && activeItems.every((i) => i.status === 'SERVED');
              const isAnyPreparing = activeItems.some((i) => i.status === 'PREPARING');
              const isBusy = updatingTicketId === ord.id;
              const tableNum = ord.table?.tableNumber;
              const roomNum = ord.room?.number;

              return (
                <div
                  key={ord.id}
                  className={cn(
                    'rounded-xl border bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between overflow-hidden transition',
                    isAllServed
                      ? 'border-slate-200 dark:border-slate-800 opacity-80'
                      : isAllReady
                      ? 'border-emerald-300 dark:border-emerald-900/60'
                      : isAnyPreparing
                      ? 'border-blue-300 dark:border-blue-900/60'
                      : 'border-amber-200 dark:border-amber-900/60'
                  )}
                >
                  {/* Card Header */}
                  <div
                    className={cn(
                      'p-3 border-b flex items-center justify-between',
                      isAllReady
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70'
                        : isAnyPreparing
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/70'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70'
                    )}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {ord.botNumber || (ord.kotNumber ? ord.kotNumber.replace(/^KOT/i, 'BOT') : `BOT-${ord.orderNumber.replace(/^[A-Za-z]+-/, '')}`)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tableNum ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                          T-{tableNum}
                        </span>
                      ) : roomNum ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-900 text-purple-100">
                          R-{roomNum}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-800 text-amber-100">
                          Takeaway
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Items with Individual Actions */}
                  <div className="p-3 space-y-2 flex-1">
                    {ord.items.map((it, itemIdx) => {
                      const isItemBusy = updatingItemId === it.id;
                      const isReadyToServe = it.preparationMethod === 'READY_TO_SERVE';
                      const isPrepRequired = it.preparationMethod === 'REQUIRES_PREPARATION';
                      const isNotConfigured = !isReadyToServe && !isPrepRequired;

                      const itemStatus = it.status || 'RECEIVED';
                      const isItemReceived = itemStatus === 'RECEIVED';
                      const isItemPreparing = itemStatus === 'PREPARING';
                      const isItemReady = itemStatus === 'READY';
                      const isItemServed = itemStatus === 'SERVED';

                      return (
                        <div
                          key={it.id || itemIdx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {it.quantity}×
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {it.productName}
                              </span>
                            </div>
                            <div className="mt-0.5">
                              {isReadyToServe ? (
                                <span className="text-[9px] text-emerald-700 font-semibold">Ready to Serve</span>
                              ) : isPrepRequired ? (
                                <span className="text-[9px] text-violet-700 font-semibold">Requires Prep</span>
                              ) : (
                                <span className="text-[9px] text-amber-600 font-semibold">⚠️ Unconfigured</span>
                              )}
                            </div>
                          </div>

                          {/* Quick Action */}
                          <div>
                            {isItemReady ? (
                              <span className="text-[10px] font-bold text-emerald-600">✓ Ready</span>
                            ) : isItemServed ? (
                              <span className="text-[10px] text-slate-400">Served</span>
                            ) : isReadyToServe && isItemReceived ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                disabled={isItemBusy}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white cursor-pointer"
                              >
                                Ready
                              </button>
                            ) : isPrepRequired && isItemReceived ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(ord.id, it.id, 'PREPARING')}
                                disabled={isItemBusy}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-600 text-white cursor-pointer"
                              >
                                Prep
                              </button>
                            ) : isPrepRequired && isItemPreparing ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                disabled={isItemBusy}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white cursor-pointer animate-pulse"
                              >
                                Ready
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(ord.id, it.id, 'READY')}
                                disabled={isItemBusy}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white cursor-pointer"
                              >
                                Ready
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/20">
                    <button
                      type="button"
                      onClick={() => setActiveModalOrder(ord)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      title="View all details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {isAllReady && !isAllServed && (
                      <button
                        type="button"
                        onClick={() => handleUpdateTicketStatus(ord.id, 'SERVED')}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark Served</span>
                      </button>
                    )}

                    {!isAllReady && !isAllServed && (
                      <button
                        type="button"
                        onClick={() => handleUpdateTicketStatus(ord.id, 'READY')}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>All Ready</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. VIEW DRINKS DETAIL MODAL
         ========================================================================= */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-violet-50/50 dark:bg-violet-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                  <Wine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {activeModalOrder.botNumber ||
                      (activeModalOrder.kotNumber
                        ? activeModalOrder.kotNumber.replace(/^KOT/i, 'BOT')
                        : `BOT-${activeModalOrder.orderNumber.replace(/^[A-Za-z]+-/, '')}`)}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {activeModalOrder.table?.tableNumber
                      ? `Table ${activeModalOrder.table.tableNumber}`
                      : activeModalOrder.room?.number
                      ? `Room ${activeModalOrder.room.number}`
                      : 'Takeaway'}{' '}
                    • {new Date(activeModalOrder.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Items List with Dynamic Item Status Workflow */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Ordered Drinks Workflow
              </div>
              {activeModalOrder.items.map((it, itemIdx) => {
                const isReadyToServe = it.preparationMethod === 'READY_TO_SERVE';
                const isPrepRequired = it.preparationMethod === 'REQUIRES_PREPARATION';
                const isItemReady = it.status === 'READY';
                const isItemPreparing = it.status === 'PREPARING';
                const isItemServed = it.status === 'SERVED';
                const isItemReceived = !it.status || it.status === 'RECEIVED';

                return (
                  <div
                    key={it.id || itemIdx}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-1.5 py-0.5 rounded">
                          {it.quantity}×
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {it.productName}
                          {it.unit ? ` (${it.unit})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {isReadyToServe ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Ready to Serve
                          </span>
                        ) : isPrepRequired ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                            Requires Prep
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800">
                            ⚠️ Not Configured
                          </span>
                        )}

                        {it.preparationStartedAt && isItemPreparing && (
                          <span className="text-[10px] text-blue-600 font-mono inline-flex items-center gap-0.5">
                            <Timer className="w-3 h-3" />
                            Prep: {formatElapsed(getElapsedMinutes(it.preparationStartedAt))}
                          </span>
                        )}

                        {it.preparationDurationMinutes && (
                          <span className="text-[10px] text-emerald-600 font-mono">
                            Took {it.preparationDurationMinutes}m
                          </span>
                        )}
                      </div>

                      {(it.notes || it.remarks) && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 italic">
                          Remark: {it.notes || it.remarks}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {isItemReady ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                          <Check className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : isItemServed ? (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-semibold">
                          Served
                        </span>
                      ) : isReadyToServe && isItemReceived ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(activeModalOrder.id, it.id, 'READY')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      ) : isPrepRequired && isItemReceived ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(activeModalOrder.id, it.id, 'PREPARING')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-2xs cursor-pointer"
                        >
                          Start Preparing
                        </button>
                      ) : isPrepRequired && isItemPreparing ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(activeModalOrder.id, it.id, 'READY')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(activeModalOrder.id, it.id, 'READY')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {getCleanBarNote(activeModalOrder.notes) && (
                <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                    Order Note:
                  </div>
                  <div>{getCleanBarNote(activeModalOrder.notes)}</div>
                </div>
              )}
            </div>

            {/* Modal Footer with Ticket Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setActiveModalOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {activeModalOrder.items.some((i) => i.status !== 'READY' && i.status !== 'SERVED' && i.status !== 'CANCELLED') && (
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(activeModalOrder.id, 'READY')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark All Ready</span>
                  </button>
                )}

                {activeModalOrder.items.every((i) => i.status === 'READY' || i.status === 'SERVED' || i.status === 'CANCELLED') &&
                  activeModalOrder.items.some((i) => i.status === 'READY') && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTicketStatus(activeModalOrder.id, 'SERVED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Ticket Served</span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

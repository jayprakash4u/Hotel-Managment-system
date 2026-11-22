'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  RefreshCw,
  UtensilsCrossed,
  Flame,
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
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isBeverageCategory } from '@/lib/menuData';

export interface KitchenItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  remarks?: string;
  unit?: string;
}

export interface KitchenOrder {
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
  total?: number;
}

/**
 * Filter out reservation metadata (e.g., "Reservation TR-1005 - Pooja Sharma (4 guests)...", "Walk-in Guest")
 * so the kitchen only sees actual culinary/cooking notes.
 */
export function getCleanKitchenNote(note?: string): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  if (
    /^reservation\s+(tr-|\w+)/i.test(trimmed) ||
    trimmed.toLowerCase().startsWith('reservation ') ||
    trimmed.toLowerCase().includes('walk-in guest') ||
    trimmed.toLowerCase() === 'walk-in' ||
    trimmed.toLowerCase().includes('birthday celebration, window side preference') ||
    trimmed.toLowerCase().includes('quiet romantic corner') ||
    trimmed.toLowerCase().includes('birthday celebration') ||
    trimmed.toLowerCase().includes('window side')
  ) {
    return null;
  }
  return trimmed;
}

function playKitchenChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
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

export function KitchenKDSView() {
  const toast = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RECEIVED' | 'PREPARING' | 'READY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeModalOrder, setActiveModalOrder] = useState<KitchenOrder | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [, setLastRefreshed] = useState<Date>(new Date());
  const prevOrderCountRef = useRef(0);

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load sound setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kds_sound_enabled');
      if (stored !== null) setSoundEnabled(stored === 'true');
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kds_sound_enabled', String(next));
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

  const fetchKitchenOrders = async () => {
    try {
      const res = await api.getRestaurantOrders({ status: 'RECEIVED,PREPARING,READY,IN_KITCHEN' });
      const rawList = Array.isArray(res)
        ? res
        : (res as any)?.success && Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      const normalized = rawList
        .map((o: any) => {
          // STRICT SEPARATION: Only food/kitchen items in KDS, never bar/drinks
          const foodItems = (o.items || []).filter((it: any) => {
            if (it.department === 'BOT') return false;
            if (isBeverageCategory(it.category, it.productName)) return false;
            return true;
          });
          return {
            ...o,
            status: o.status === 'IN_KITCHEN' ? 'PREPARING' : o.status,
            items: foodItems,
          };
        })
        .filter((o: any) => o.items && o.items.length > 0);

      // Chime if new orders arrived
      if (soundEnabled && normalized.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        playKitchenChime();
      }
      prevOrderCountRef.current = normalized.length;

      setOrders(normalized);
      setLastRefreshed(new Date());

      // If modal is open, keep its order data updated
      if (activeModalOrder) {
        const found = normalized.find((item: KitchenOrder) => item.id === activeModalOrder.id);
        if (found) setActiveModalOrder(found);
      }
    } catch (err: any) {
      console.error('Failed to fetch kitchen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 8000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery, pageSize]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await (api as any).updateRestaurantOrderStatus(orderId, { status: nextStatus });
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
          .filter((o) => (nextStatus === 'SERVED' ? false : true))
      );

      if (activeModalOrder && activeModalOrder.id === orderId) {
        if (nextStatus === 'SERVED') {
          setActiveModalOrder(null);
        } else {
          setActiveModalOrder((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
        }
      }

      toast.success(
        'Status Updated',
        nextStatus === 'PREPARING'
          ? 'Ticket marked as Cooking.'
          : nextStatus === 'READY'
          ? 'Ticket marked as Ready to Serve.'
          : 'Ticket marked as Served.'
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleItemChecked = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedFilter !== 'ALL' && o.status !== selectedFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketNum = (o.kotNumber || o.orderNumber || '').toLowerCase();
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

  // Pagination calculation
  const totalEntries = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, startIndex, pageSize]);

  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="w-full space-y-4 select-none font-sans">
      {/* =========================================================================
          1. HEADER: Title, Stats & Action Controls
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Kitchen Display
            </h1>
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
            onClick={fetchKitchenOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh kitchen orders"
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
        {/* Status Filter Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'RECEIVED', label: 'Received', count: receivedCount },
            { id: 'PREPARING', label: 'Cooking', count: preparingCount },
            { id: 'READY', label: 'Ready', count: readyCount },
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
              placeholder=""
              className="w-full h-[30px] pl-8 pr-7 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
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
          <ChefHat className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No active kitchen orders
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Kitchen queue is cleared</p>
        </div>
      ) : viewMode === 'table' ? (
        /* -----------------------------------------------------------------------
           TABLE FORM (With dedicated Note / Remarks Column & Zero Reservation Junk)
           ----------------------------------------------------------------------- */
        <div className="border border-slate-200 dark:border-slate-700/60 rounded overflow-hidden bg-white dark:bg-slate-850 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">KOT / Ticket</th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">Destination</th>
                  <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-200 dark:border-slate-700">Ordered Items</th>
                  <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-200 dark:border-slate-700">Note / Remarks</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">Waiter / Server</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                  <th className="py-2.5 px-4 w-48 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOrders.map((ord, idx) => {
                  const isReceived = ord.status === 'RECEIVED';
                  const isPreparing = ord.status === 'PREPARING';
                  const isReady = ord.status === 'READY';
                  const isBusy = updatingId === ord.id;
                  const tableNum = ord.table?.tableNumber;
                  const roomNum = ord.room?.number;
                  const orderTime = new Date(ord.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const elapsedMins = getElapsedMinutes(ord.createdAt);
                  const isUrgent = elapsedMins >= 20;
                  const isWarning = elapsedMins >= 10 && elapsedMins < 20;

                  // Extract item-level remarks entered when adding dishes in POS / Quick Sale
                  const itemRemarks = (ord.items || [])
                    .filter((it) => (it.notes || it.remarks) && String(it.notes || it.remarks).trim())
                    .map((it) => ({
                      productName: it.productName,
                      remark: String(it.notes || it.remarks).trim(),
                    }));

                  // Clean culinary order note (discards reservation details like TR-1005, walk-in guest notes)
                  const cleanOrderNote = getCleanKitchenNote(ord.notes);
                  const hasRemarks = itemRemarks.length > 0 || !!cleanOrderNote;

                  return (
                    <tr
                      key={ord.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* 1. Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px] border-r border-slate-200 dark:border-slate-700 align-middle">
                        {startIndex + idx + 1}
                      </td>

                      {/* 2. Ticket / KOT */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {ord.kotNumber || ord.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{orderTime}</span>
                        </div>
                      </td>

                      {/* 3. Destination - Clean text, no rounded dark box */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {tableNum ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Table2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Table {tableNum}</span>
                          </span>
                        ) : roomNum ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Room {roomNum}</span>
                          </span>
                        ) : ord.orderType === 'TAKEAWAY' ? (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>Takeaway</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Armchair className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Walk-In</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Ordered Items Preview */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {(ord.items || []).length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No items punched yet</span>
                        ) : (
                          <div className="space-y-1">
                            {(ord.items || []).map((item, itemIdx) => {
                              const isChecked = !!checkedItems[`${ord.id}-${itemIdx}`];
                              return (
                                <div key={item.id || itemIdx} className="flex items-center gap-1.5 text-xs">
                                  <span
                                    className={cn(
                                      'font-bold font-mono text-xs',
                                      isChecked
                                        ? 'text-slate-400'
                                        : 'text-emerald-700 dark:text-emerald-400'
                                    )}
                                  >
                                    {item.quantity}x
                                  </span>
                                  <span
                                    className={cn(
                                      'font-medium text-slate-800 dark:text-slate-200',
                                      isChecked && 'line-through text-slate-400 dark:text-slate-500'
                                    )}
                                  >
                                    {item.productName}
                                  </span>
                                  {item.unit && (
                                    <span className="text-[11px] text-slate-400 font-normal">
                                      ({item.unit})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* 5. Note / Remarks Column */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {hasRemarks ? (
                          <div className="space-y-1 max-w-xs">
                            {/* Item-level Remarks */}
                            {itemRemarks.map((ir, rIdx) => (
                              <div
                                key={rIdx}
                                className="text-xs text-amber-700 dark:text-amber-300 leading-snug flex items-start gap-1"
                              >
                                <span className="font-semibold text-amber-900 dark:text-amber-200">
                                  {ir.productName}:
                                </span>
                                <span>{ir.remark}</span>
                              </div>
                            ))}

                            {/* Overall Culinary Order Note */}
                            {cleanOrderNote && (
                              <div className="text-xs text-amber-700 dark:text-amber-300 leading-snug flex items-start gap-1">
                                <span className="font-semibold text-amber-900 dark:text-amber-200">
                                  Order Note:
                                </span>
                                <span>{cleanOrderNote}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono text-xs select-none">
                            —
                          </span>
                        )}
                      </td>

                      {/* 6. Waiter / Server */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ord.serverName || 'Staff'}
                        </span>
                      </td>

                      {/* 7. Status */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {isReceived && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-amber-700 dark:text-amber-400">Received</span>
                            </>
                          )}
                          {isPreparing && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                              <span className="text-sky-700 dark:text-sky-400">Cooking</span>
                            </>
                          )}
                          {isReady && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-400">Ready</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 8. Action Buttons */}
                      <td className="py-2.5 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Items Button */}
                          <button
                            type="button"
                            onClick={() => setActiveModalOrder(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            title="View all items and notes"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Progression Action */}
                          {isReceived && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>{isBusy ? 'Updating...' : 'Start'}</span>
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(ord.id, 'READY')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isBusy ? 'Updating...' : 'Ready'}</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>{isBusy ? 'Updating...' : 'Served'}</span>
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
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           CARDS VIEW (Secondary / Alternative View)
           ----------------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedOrders.map((ord) => {
            const isReceived = ord.status === 'RECEIVED';
            const isPreparing = ord.status === 'PREPARING';
            const isReady = ord.status === 'READY';
            const isBusy = updatingId === ord.id;
            const tableNum = ord.table?.tableNumber;
            const roomNum = ord.room?.number;
            const orderTime = new Date(ord.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const elapsedMins = getElapsedMinutes(ord.createdAt);
            const isUrgent = elapsedMins >= 20;
            const isWarning = elapsedMins >= 10 && elapsedMins < 20;

            const cleanOrderNote = getCleanKitchenNote(ord.notes);

            return (
              <div
                key={ord.id}
                className={cn(
                  'rounded-xl border bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between overflow-hidden transition-all',
                  isReceived
                    ? 'border-amber-300/80 dark:border-amber-700/60'
                    : isPreparing
                    ? 'border-sky-300/80 dark:border-sky-700/60'
                    : 'border-emerald-300/80 dark:border-emerald-700/60'
                )}
              >
                {/* Ticket Top Header */}
                <div
                  className={cn(
                    'p-3 border-b flex items-center justify-between',
                    isReceived
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40'
                      : isPreparing
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/70 dark:border-sky-900/40'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {ord.kotNumber || ord.orderNumber}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider',
                          isReceived
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                            : isPreparing
                            ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                        )}
                      >
                        {isReceived ? 'Received' : isPreparing ? 'Cooking' : 'Ready'}
                      </span>
                    </div>

                    {/* Meta: Timestamp & Elapsed Timer */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{orderTime}</span>
                      </span>

                      <span
                        className={cn(
                          'font-mono font-semibold px-1 py-0.2 rounded text-[10px]',
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {formatElapsed(elapsedMins)}
                      </span>

                      {ord.serverName && <span className="truncate">· {ord.serverName}</span>}
                    </div>
                  </div>

                  {/* Destination Badge */}
                  <div className="shrink-0">
                    {tableNum ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0B3D32] text-white font-mono font-bold text-xs shadow-2xs">
                        <Table2 className="w-3.5 h-3.5" />
                        <span>Table {tableNum}</span>
                      </span>
                    ) : roomNum ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white font-mono font-bold text-xs shadow-2xs">
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>Room {roomNum}</span>
                      </span>
                    ) : ord.orderType === 'TAKEAWAY' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Takeaway</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-700 text-white font-mono font-bold text-xs shadow-2xs">
                        <Armchair className="w-3.5 h-3.5" />
                        <span>Walk-In</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-3 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 space-y-2">
                  {(ord.items || []).length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      No food items punched yet
                    </div>
                  ) : (
                    (ord.items || []).map((item, idx) => {
                      const isChecked = !!checkedItems[`${ord.id}-${idx}`];
                      const itemRemark = item.notes || item.remarks;
                      return (
                        <div
                          key={item.id || idx}
                          onClick={() => toggleItemChecked(ord.id, idx)}
                          className={cn(
                            'pt-2 first:pt-0 flex items-start justify-between text-xs cursor-pointer group transition-opacity',
                            isChecked ? 'opacity-40 line-through' : 'opacity-100'
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                'w-5 h-5 rounded-[4px] font-mono font-bold flex items-center justify-center shrink-0 text-xs transition-colors',
                                isChecked
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700'
                              )}
                            >
                              {item.quantity}
                            </span>

                            <div>
                              <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                                {item.productName}
                                {item.unit && (
                                  <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                    ({item.unit})
                                  </span>
                                )}
                              </p>
                              {itemRemark && (
                                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-amber-900">
                                  <span className="font-bold">Note:</span>
                                  <span>{itemRemark}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5',
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-700 opacity-0 group-hover:opacity-100'
                            )}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Clean Order-Level Note */}
                  {cleanOrderNote && (
                    <div className="pt-2 text-[11px] font-medium text-amber-900 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/50 p-2 rounded-md border border-amber-200/60 dark:border-amber-900/60">
                      <strong>Order Note:</strong> {cleanOrderNote}
                    </div>
                  )}
                </div>

                {/* Ticket Action Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalOrder(ord)}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View ({ord.items?.length || 0})</span>
                  </button>

                  {isReceived && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* =========================================================================
          4. DATATABLES PAGINATION FOOTER
          Left: Showing X to Y of Z entries
          Right: Prev 1 2 3 ... Next
         ========================================================================= */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 select-none shadow-2xs">
          {/* Left side: Entries summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[11px]">
              Showing{' '}
              <strong className="text-slate-900 dark:text-white">
                {totalEntries === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white">
                {Math.min(startIndex + pageSize, totalEntries)}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-900 dark:text-white">{totalEntries}</strong>{' '}
              entries
              {totalEntries !== orders.length && (
                <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  Filtered from {orders.length} total
                </span>
              )}
            </div>
          </div>

          {/* Right side: Prev 1 2 3 Next */}
          <div className="flex items-center gap-1.5 text-xs font-medium self-end sm:self-auto">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
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
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
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
              className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium text-xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. VIEW ITEMS MODAL (Clean, Professional & Action-Enabled)
         ========================================================================= */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {activeModalOrder.kotNumber || activeModalOrder.orderNumber}
                    </h3>
                    {/* Destination Badge */}
                    {activeModalOrder.table?.tableNumber ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0B3D32] text-white font-mono font-bold text-[11px]">
                        <Table2 className="w-3 h-3" />
                        <span>Table {activeModalOrder.table.tableNumber}</span>
                      </span>
                    ) : activeModalOrder.room?.number ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 text-white font-mono font-bold text-[11px]">
                        <BedDouble className="w-3 h-3" />
                        <span>Room {activeModalOrder.room.number}</span>
                      </span>
                    ) : activeModalOrder.orderType === 'TAKEAWAY' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[11px]">
                        <ShoppingBag className="w-3 h-3" />
                        <span>Takeaway</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-white font-mono font-bold text-[11px]">
                        <Armchair className="w-3 h-3" />
                        <span>Walk-In</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>
                      {new Date(activeModalOrder.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>·</span>
                    <span className="font-mono font-medium">
                      {formatElapsed(getElapsedMinutes(activeModalOrder.createdAt))} elapsed
                    </span>
                    {activeModalOrder.serverName && (
                      <>
                        <span>·</span>
                        <span>Server: {activeModalOrder.serverName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Itemized Checklist */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ordered Items ({activeModalOrder.items?.length || 0})
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {(activeModalOrder.items || []).map((item, idx) => {
                  const isChecked = !!checkedItems[`${activeModalOrder.id}-${idx}`];
                  const itemRemark = item.notes || item.remarks;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => toggleItemChecked(activeModalOrder.id, idx)}
                      className={cn(
                        'p-3 flex items-start justify-between cursor-pointer transition-colors',
                        isChecked
                          ? 'bg-slate-50/70 dark:bg-slate-800/30 opacity-50'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center shrink-0 text-xs border',
                            isChecked
                              ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                          )}
                        >
                          {item.quantity}x
                        </span>
                        <div>
                          <p
                            className={cn(
                              'text-sm font-semibold text-slate-900 dark:text-slate-100',
                              isChecked && 'line-through'
                            )}
                          >
                            {item.productName}
                            {item.unit && (
                              <span className="ml-1.5 text-xs font-normal text-slate-500">
                                ({item.unit})
                              </span>
                            )}
                          </p>
                          {itemRemark && (
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 mt-1">
                              <span className="font-bold">Note:</span>
                              <span>{itemRemark}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Strike/Check circle */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-1',
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        )}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean Culinary Order Level Note */}
              {getCleanKitchenNote(activeModalOrder.notes) && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold mb-0.5">Order Remarks / Instructions:</div>
                  <div>{getCleanKitchenNote(activeModalOrder.notes)}</div>
                </div>
              )}
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveModalOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {activeModalOrder.status === 'RECEIVED' && (
                  <button
                    type="button"
                    disabled={updatingId === activeModalOrder.id}
                    onClick={() => handleUpdateStatus(activeModalOrder.id, 'PREPARING')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Start Cooking</span>
                  </button>
                )}

                {activeModalOrder.status === 'PREPARING' && (
                  <button
                    type="button"
                    disabled={updatingId === activeModalOrder.id}
                    onClick={() => handleUpdateStatus(activeModalOrder.id, 'READY')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Ready</span>
                  </button>
                )}

                {activeModalOrder.status === 'READY' && (
                  <button
                    type="button"
                    disabled={updatingId === activeModalOrder.id}
                    onClick={() => handleUpdateStatus(activeModalOrder.id, 'SERVED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Mark Served</span>
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

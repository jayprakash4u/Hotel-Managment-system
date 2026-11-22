'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wine,
  Clock,
  CheckCircle2,
  RefreshCw,
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

export interface BarItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  remarks?: string;
  unit?: string;
  category?: string;
  department?: string;
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

export function BarBDSView() {
  const toast = useToast();
  const [orders, setOrders] = useState<BarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeModalOrder, setActiveModalOrder] = useState<BarOrder | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
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
            .map((it: any) => ({
              id: it.id,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
              notes: it.notes,
              remarks: it.remarks,
              unit: it.unit,
              category: it.category,
              department: it.department,
            }));

          const effectiveStatus: BarOrder['status'] =
            o.status === 'IN_KITCHEN' ? 'PREPARING' : o.status || 'RECEIVED';

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

  const toggleItemChecked = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Update status for the entire bar ticket: RECEIVED -> PREPARING -> READY -> SERVED
  const handleUpdateTicketStatus = async (
    orderId: string,
    nextStatus: 'PREPARING' | 'READY' | 'SERVED'
  ) => {
    setUpdatingTicketId(orderId);
    try {
      await api.updateRestaurantOrderStatus(orderId, { status: nextStatus });
      setOrders((prev) =>
        prev
          .map((ord) => {
            if (ord.id !== orderId) return ord;
            const updated = { ...ord, status: nextStatus };
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
        nextStatus === 'PREPARING'
          ? 'Ticket marked as Preparing.'
          : nextStatus === 'READY'
          ? 'Ticket marked as Ready to Serve.'
          : 'Ticket marked as Served.'
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
      if (selectedFilter !== 'ALL' && o.status !== selectedFilter) return false;

      // Text search
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

  // Tab counts
  const allActiveCount = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const servedCount = orders.filter((o) => o.status === 'SERVED').length;

  const tabs: { key: typeof selectedFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Orders', count: allActiveCount },
    { key: 'RECEIVED', label: 'Received', count: receivedCount },
    { key: 'PREPARING', label: 'Preparing', count: preparingCount },
    { key: 'READY', label: 'Ready', count: readyCount },
    { key: 'SERVED', label: 'Served', count: servedCount },
  ];

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium shadow-2xs transition cursor-pointer"
            title="Refresh order queue"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TOOLBAR: Status Tabs + Page Size + Search Box
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stage Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-x-auto">
          {tabs.map((tab) => {
            const isSelected = selectedFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
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
           TABLE VIEW (Simple, Clean, Professional)
           ----------------------------------------------------------------------- */
        <div className="border border-slate-200 dark:border-slate-700/60 rounded overflow-hidden bg-white dark:bg-slate-850 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">BOT / Ticket</th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">Destination</th>
                  <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-200 dark:border-slate-700">Ordered Drinks</th>
                  <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-200 dark:border-slate-700">Note / Remarks</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">Waiter / Server</th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                  <th className="py-2.5 px-4 w-48 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOrders.map((ord, idx) => {
                  const isBusy = updatingTicketId === ord.id;
                  const isReceived = ord.status === 'RECEIVED';
                  const isPreparing = ord.status === 'PREPARING';
                  const isReady = ord.status === 'READY';
                  const isServed = ord.status === 'SERVED';
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

                  return (
                    <tr
                      key={ord.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* 1. Index */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px] border-r border-slate-200 dark:border-slate-700 align-middle">
                        {startIndex + idx + 1}
                      </td>

                      {/* 2. BOT / Ticket */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {ord.botNumber || (ord.kotNumber ? ord.kotNumber.replace(/^KOT/i, 'BOT') : `BOT-${ord.orderNumber.replace(/^[A-Za-z]+-/, '')}`)}
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
                        ) : ord.orderType?.toUpperCase() === 'TAKEAWAY' ? (
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
                        {ord.customerName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px] mt-0.5">
                            {ord.customerName}
                          </div>
                        )}
                      </td>

                      {/* 4. Ordered Drinks Column: Clean simple list with click-to-strike */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        {(ord.items || []).length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No drinks punched yet</span>
                        ) : (
                          <div className="space-y-1">
                            {ord.items.map((it, itemIdx) => {
                              const isChecked = !!checkedItems[`${ord.id}-${itemIdx}`];
                              return (
                                <div
                                  key={it.id || itemIdx}
                                  onClick={() => toggleItemChecked(ord.id, itemIdx)}
                                  className={cn(
                                    'flex items-center gap-1.5 text-xs cursor-pointer select-none group transition-opacity',
                                    isChecked && 'opacity-50'
                                  )}
                                  title="Click to check off drink"
                                >
                                  <span
                                    className={cn(
                                      'font-bold font-mono text-xs',
                                      isChecked
                                        ? 'text-slate-400'
                                        : 'text-emerald-700 dark:text-emerald-400'
                                    )}
                                  >
                                    {it.quantity}x
                                  </span>
                                  <span
                                    className={cn(
                                      'font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors',
                                      isChecked && 'line-through text-slate-400 dark:text-slate-500'
                                    )}
                                  >
                                    {it.productName}
                                  </span>
                                  {it.unit && (
                                    <span className="text-[11px] text-slate-400 font-normal shrink-0">
                                      ({it.unit})
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
                          <span className="text-slate-300 dark:text-slate-600 font-mono text-xs select-none">—</span>
                        )}
                      </td>

                      {/* 6. Waiter / Server */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {ord.serverName || 'Staff'}
                        </span>
                      </td>

                      {/* 7. Status Column */}
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
                              <span className="text-sky-700 dark:text-sky-400">Preparing</span>
                            </>
                          )}
                          {isReady && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-400">Ready</span>
                            </>
                          )}
                          {isServed && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span className="text-slate-500 dark:text-slate-400">Served</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 8. Action Area */}
                      <td className="py-2.5 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Drinks Detail Modal Button */}
                          <button
                            type="button"
                            onClick={() => setActiveModalOrder(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            title="View drinks detail & checklist"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Primary Stage Action Button */}
                          {isReceived && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ord.id, 'PREPARING')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <Wine className="w-3.5 h-3.5" />
                              <span>Start</span>
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ord.id, 'READY')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Ready</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(ord.id, 'SERVED')}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-50 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Served</span>
                            </button>
                          )}

                          {isServed && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Served</span>
                            </span>
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
                          'w-7 h-7 rounded-md text-xs font-semibold transition cursor-pointer',
                          safeCurrentPage === p
                            ? 'bg-[#0B3D32] text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
              const isReceived = ord.status === 'RECEIVED';
              const isPreparing = ord.status === 'PREPARING';
              const isReady = ord.status === 'READY';
              const isServed = ord.status === 'SERVED';
              const isBusy = updatingTicketId === ord.id;
              const tableNum = ord.table?.tableNumber;
              const roomNum = ord.room?.number;

              return (
                <div
                  key={ord.id}
                  className={cn(
                    'rounded-xl border bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between overflow-hidden transition',
                    isServed
                      ? 'border-slate-200 dark:border-slate-800 opacity-80'
                      : isReady
                      ? 'border-emerald-300 dark:border-emerald-900/60'
                      : isPreparing
                      ? 'border-blue-300 dark:border-blue-900/60'
                      : 'border-amber-200 dark:border-amber-900/60'
                  )}
                >
                  {/* Card Header */}
                  <div
                    className={cn(
                      'p-3 border-b flex items-center justify-between',
                      isReady
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70'
                        : isPreparing
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

                  {/* Card Items with click-to-strike checkmarks */}
                  <div className="p-3 space-y-1.5 flex-1">
                    {(ord.items || []).map((it, itemIdx) => {
                      const isChecked = !!checkedItems[`${ord.id}-${itemIdx}`];
                      return (
                        <div
                          key={it.id || itemIdx}
                          onClick={() => toggleItemChecked(ord.id, itemIdx)}
                          className={cn(
                            'flex items-center gap-2 text-xs cursor-pointer select-none group transition-opacity',
                            isChecked && 'opacity-50'
                          )}
                        >
                          <span
                            className={cn(
                              'font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border transition-colors shrink-0',
                              isChecked
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            )}
                          >
                            {it.quantity}x
                          </span>
                          <span
                            className={cn(
                              'font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 transition-colors',
                              isChecked && 'line-through text-slate-400'
                            )}
                          >
                            {it.productName}
                          </span>
                          {it.unit && (
                            <span className="text-[11px] text-slate-400 font-normal shrink-0">
                              ({it.unit})
                            </span>
                          )}
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

                    {isReceived && (
                      <button
                        type="button"
                        onClick={() => handleUpdateTicketStatus(ord.id, 'PREPARING')}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <Wine className="w-3.5 h-3.5" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        onClick={() => handleUpdateTicketStatus(ord.id, 'READY')}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && (
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

                    {isServed && (
                      <span className="flex-1 text-center py-1 text-xs font-medium text-slate-400">
                        Served
                      </span>
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
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400">
                  <Wine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeModalOrder.botNumber || activeModalOrder.kotNumber || activeModalOrder.orderNumber}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>
                      {activeModalOrder.table?.tableNumber
                        ? `Table ${activeModalOrder.table.tableNumber}`
                        : activeModalOrder.room?.number
                        ? `Room ${activeModalOrder.room.number}`
                        : activeModalOrder.orderType || 'Walk-In'}
                    </span>
                    <span>•</span>
                    <span>{activeModalOrder.serverName || 'Staff'}</span>
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

            {/* Modal Items List with Checklist */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                Ordered Drinks ({activeModalOrder.items.length})
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {activeModalOrder.items.map((it, itemIdx) => {
                  const isChecked = !!checkedItems[`${activeModalOrder.id}-${itemIdx}`];
                  return (
                    <div
                      key={it.id || itemIdx}
                      onClick={() => toggleItemChecked(activeModalOrder.id, itemIdx)}
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
                              ? 'bg-slate-100 border-slate-200 text-slate-400'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                          )}
                        >
                          {it.quantity}x
                        </span>
                        <div>
                          <p
                            className={cn(
                              'font-semibold text-xs text-slate-900 dark:text-slate-100',
                              isChecked && 'line-through text-slate-400'
                            )}
                          >
                            {it.productName}
                          </p>
                          {it.unit && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({it.unit})
                            </span>
                          )}
                          {(it.notes || it.remarks) && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                              Note: {it.notes || it.remarks}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

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
                {activeModalOrder.status === 'RECEIVED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateTicketStatus(activeModalOrder.id, 'PREPARING');
                      setActiveModalOrder(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer"
                  >
                    <Wine className="w-3.5 h-3.5" />
                    <span>Start Preparing</span>
                  </button>
                )}

                {activeModalOrder.status === 'PREPARING' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateTicketStatus(activeModalOrder.id, 'READY');
                      setActiveModalOrder(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Mark Ready</span>
                  </button>
                )}

                {activeModalOrder.status === 'READY' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateTicketStatus(activeModalOrder.id, 'SERVED');
                      setActiveModalOrder(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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

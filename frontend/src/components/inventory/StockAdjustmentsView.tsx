'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Eye,
  Calendar,
  Clock,
  User,
  X,
  Printer,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  InventoryItemData,
  StockAdjustmentRecord,
  StockAdjustmentItem,
  StockAdjustmentSummary,
  CreateStockAdjustmentRequest,
} from '@/lib/types';

interface StockAdjustmentsViewProps {
  items?: InventoryItemData[];
  onOpenNewAdjustment?: () => void;
  showHeader?: boolean;
}

type AdjustmentTypeFilter = 'ALL' | 'INCREASE' | 'DECREASE' | 'MIXED';

// Default realistic demo fallback adjustments matching database schema
export const DEFAULT_DEMO_ADJUSTMENTS: StockAdjustmentRecord[] = [
  {
    id: 'adj-doc-1',
    adjustmentNumber: 'ADJ-20261122-841',
    adjustmentDate: '2026-11-22T08:15:00Z',
    department: 'RESTAURANT',
    status: 'COMPLETED',
    adjustmentType: 'DECREASE',
    itemCount: 1,
    totalQuantity: 2,
    primaryReason: 'Damaged',
    notes: 'Bottle seal punctured during crate handling at Restaurant bar store',
    adjustedBy: 'Bar Supervisor',
    itemsJson: JSON.stringify([
      {
        itemId: 'inv-item-1',
        itemName: 'Sprite 500ml',
        itemCode: 'SPR-500',
        category: 'BEVERAGE',
        department: 'RESTAURANT',
        unit: 'bottles',
        currentStock: 25,
        adjustmentType: 'DECREASE',
        quantity: 2,
        newStock: 23,
        reason: 'Damaged',
        notes: 'Disposed by bar steward',
      },
    ]),
    createdAt: '2026-11-22T08:15:00Z',
    updatedAt: '2026-11-22T08:15:00Z',
  },
  {
    id: 'adj-doc-2',
    adjustmentNumber: 'ADJ-20261121-502',
    adjustmentDate: '2026-11-21T18:00:00Z',
    department: 'RESTAURANT',
    status: 'COMPLETED',
    adjustmentType: 'INCREASE',
    itemCount: 1,
    totalQuantity: 3,
    primaryReason: 'Physical Stock Count',
    notes: 'Variance found 3 extra unopened bottles during evening stock take',
    adjustedBy: 'Inventory Auditor',
    itemsJson: JSON.stringify([
      {
        itemId: 'inv-item-1',
        itemName: 'Sprite 500ml',
        itemCode: 'SPR-500',
        category: 'BEVERAGE',
        department: 'RESTAURANT',
        unit: 'bottles',
        currentStock: 23,
        adjustmentType: 'INCREASE',
        quantity: 3,
        newStock: 26,
        reason: 'Physical Stock Count',
        notes: 'Approved by general manager',
      },
    ]),
    createdAt: '2026-11-21T18:00:00Z',
    updatedAt: '2026-11-21T18:00:00Z',
  },
  {
    id: 'adj-doc-3',
    adjustmentNumber: 'ADJ-20261121-119',
    adjustmentDate: '2026-11-21T11:00:00Z',
    department: 'RESTAURANT',
    status: 'COMPLETED',
    adjustmentType: 'DECREASE',
    itemCount: 1,
    totalQuantity: 5,
    primaryReason: 'Stock Correction',
    notes: 'Weekly manual usage recording for bakery dough preparation',
    adjustedBy: 'Head Chef',
    itemsJson: JSON.stringify([
      {
        itemId: 'inv-item-2',
        itemName: 'Flour (All Purpose)',
        itemCode: 'FLR-AP-50',
        category: 'GROCERY',
        department: 'RESTAURANT',
        unit: 'kg',
        currentStock: 70,
        adjustmentType: 'DECREASE',
        quantity: 5,
        newStock: 65,
        reason: 'Stock Correction',
        notes: 'Monthly kitchen consumption reconciles',
      },
    ]),
    createdAt: '2026-11-21T11:00:00Z',
    updatedAt: '2026-11-21T11:00:00Z',
  },
  {
    id: 'adj-doc-4',
    adjustmentNumber: 'ADJ-20261120-771',
    adjustmentDate: '2026-11-20T16:30:00Z',
    department: 'HOTEL',
    status: 'COMPLETED',
    adjustmentType: 'DECREASE',
    itemCount: 2,
    totalQuantity: 8,
    primaryReason: 'Mixed',
    notes: 'Housekeeping linen check & washroom replenishment audit',
    adjustedBy: 'Housekeeping Manager',
    itemsJson: JSON.stringify([
      {
        itemId: 'inv-item-3',
        itemName: 'Luxury Bath Towels 700GSM',
        itemCode: 'TWL-BTH-WHT',
        category: 'LINEN',
        department: 'HOTEL',
        unit: 'pieces',
        currentStock: 75,
        adjustmentType: 'DECREASE',
        quantity: 5,
        newStock: 70,
        reason: 'Damaged',
        notes: 'Permanent laundry stain damage',
      },
      {
        itemId: 'inv-item-7',
        itemName: 'Herbal Body Wash 50ml',
        itemCode: 'TOI-BW-50',
        category: 'TOILETRIES',
        department: 'HOTEL',
        unit: 'bottles',
        currentStock: 120,
        adjustmentType: 'DECREASE',
        quantity: 3,
        newStock: 117,
        reason: 'Expired',
        notes: 'Batch expiry date passed',
      },
    ]),
    createdAt: '2026-11-20T16:30:00Z',
    updatedAt: '2026-11-20T16:30:00Z',
  },
  {
    id: 'adj-doc-5',
    adjustmentNumber: 'ADJ-20261119-332',
    adjustmentDate: '2026-11-19T17:40:00Z',
    department: 'RESTAURANT',
    status: 'COMPLETED',
    adjustmentType: 'DECREASE',
    itemCount: 1,
    totalQuantity: 6,
    primaryReason: 'Spoiled',
    notes: 'High heat humidity produce disposal',
    adjustedBy: 'Sous Chef',
    itemsJson: JSON.stringify([
      {
        itemId: 'inv-item-5',
        itemName: 'Fresh Roma Tomatoes',
        itemCode: 'VEG-TOM-ROMA',
        category: 'PRODUCE',
        department: 'RESTAURANT',
        unit: 'kg',
        currentStock: 28,
        adjustmentType: 'DECREASE',
        quantity: 6,
        newStock: 22,
        reason: 'Spoiled',
        notes: 'Kitchen wastage log logged',
      },
    ]),
    createdAt: '2026-11-19T17:40:00Z',
    updatedAt: '2026-11-19T17:40:00Z',
  },
];

export const StockAdjustmentsView: React.FC<StockAdjustmentsViewProps> = ({
  items: propItems,
  onOpenNewAdjustment,
  showHeader = true,
}) => {
  const toast = useToast();

  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>(DEFAULT_DEMO_ADJUSTMENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsList, setItemsList] = useState<InventoryItemData[]>(propItems || []);

  // Summary Metrics from Database / Active Records
  const [summary, setSummary] = useState<StockAdjustmentSummary>({
    totalAdjustments: DEFAULT_DEMO_ADJUSTMENTS.length,
    stockIncreased: 3,
    stockDecreased: 21,
    todayAdjustments: 1,
  });

  // Filters
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState<AdjustmentTypeFilter>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [sortField, setSortField] = useState<'date' | 'adjustmentNumber' | 'itemCount' | 'totalQuantity'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toolbar Menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Modals & Drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAdjustmentForView, setSelectedAdjustmentForView] = useState<StockAdjustmentRecord | null>(null);

  // Close menus on window click
  useEffect(() => {
    const handleOutside = () => setShowSettingsMenu(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Load Data from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, adjRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()).catch(() => null),
        api.getStockAdjustments({
          department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
          adjustmentType: adjustmentTypeFilter !== 'ALL' ? adjustmentTypeFilter : undefined,
          reason: reasonFilter !== 'ALL' ? reasonFilter : undefined,
          search: searchQuery || undefined,
          fromDate: startDate || undefined,
          toDate: endDate || undefined,
          page: 1,
          pageSize: 200,
        }).catch(() => null),
      ]);

      if (itemsRes?.success && Array.isArray(itemsRes.data)) {
        setItemsList(itemsRes.data);
      }

      if (adjRes?.data && Array.isArray(adjRes.data) && adjRes.data.length > 0) {
        setAdjustments(adjRes.data);
        if (adjRes.summary) {
          setSummary(adjRes.summary);
        }
      } else {
        setAdjustments(DEFAULT_DEMO_ADJUSTMENTS);
      }
    } catch {
      setAdjustments(DEFAULT_DEMO_ADJUSTMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter, adjustmentTypeFilter, reasonFilter, startDate, endDate]);

  // Client Filter & Sort
  const filteredAndSortedAdjustments = useMemo(() => {
    let list = adjustments.filter((adj) => {
      // Department filter
      if (departmentFilter !== 'ALL' && adj.department?.toUpperCase() !== departmentFilter) {
        return false;
      }

      // Adjustment Type filter
      if (adjustmentTypeFilter !== 'ALL' && adj.adjustmentType?.toUpperCase() !== adjustmentTypeFilter) {
        return false;
      }

      // Reason filter
      if (reasonFilter !== 'ALL') {
        const rNorm = (adj.primaryReason || '').toLowerCase();
        const fNorm = reasonFilter.toLowerCase();
        if (!rNorm.includes(fNorm) && !(adj.itemsJson || '').toLowerCase().includes(fNorm)) {
          return false;
        }
      }

      // Date Range filter
      if (startDate) {
        const adjDate = new Date(adj.adjustmentDate);
        const from = new Date(startDate);
        if (adjDate < from) return false;
      }
      if (endDate) {
        const adjDate = new Date(adj.adjustmentDate);
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        if (adjDate > to) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (adj.adjustmentNumber || '').toLowerCase();
        const by = (adj.adjustedBy || '').toLowerCase();
        const notes = (adj.notes || '').toLowerCase();
        const itemsText = (adj.itemsJson || '').toLowerCase();

        if (!num.includes(q) && !by.includes(q) && !notes.includes(q) && !itemsText.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        diff = new Date(a.adjustmentDate).getTime() - new Date(b.adjustmentDate).getTime();
      } else if (sortField === 'adjustmentNumber') {
        diff = (a.adjustmentNumber || '').localeCompare(b.adjustmentNumber || '');
      } else if (sortField === 'itemCount') {
        diff = a.itemCount - b.itemCount;
      } else if (sortField === 'totalQuantity') {
        diff = a.totalQuantity - b.totalQuantity;
      }
      return sortDirection === 'asc' ? diff : -diff;
    });

    return list;
  }, [adjustments, departmentFilter, adjustmentTypeFilter, reasonFilter, startDate, endDate, searchQuery, sortField, sortDirection]);

  // Live Summary metrics responding to current filtered set
  const dynamicSummary = useMemo(() => {
    let inc = 0;
    let dec = 0;
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;

    filteredAndSortedAdjustments.forEach((adj) => {
      if ((adj.adjustmentDate || '').startsWith(today)) {
        todayCount++;
      }

      try {
        const parsed = JSON.parse(adj.itemsJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((itm: any) => {
            const t = (itm.adjustmentType || '').toUpperCase();
            const q = Number(itm.quantity) || 0;
            if (t.includes('INC')) inc += q;
            else if (t.includes('DEC')) dec += q;
          });
          return;
        }
      } catch {
        // Fallback
      }

      if (adj.adjustmentType === 'INCREASE') inc += adj.totalQuantity;
      else if (adj.adjustmentType === 'DECREASE') dec += adj.totalQuantity;
      else {
        inc += Math.round(adj.totalQuantity / 2);
        dec += Math.round(adj.totalQuantity / 2);
      }
    });

    return {
      totalAdjustments: filteredAndSortedAdjustments.length,
      stockIncreased: inc,
      stockDecreased: dec,
      todayAdjustments: todayCount,
    };
  }, [filteredAndSortedAdjustments]);

  // Pagination
  const totalEntries = filteredAndSortedAdjustments.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedAdjustments = filteredAndSortedAdjustments.slice(startIndex, startIndex + pageSize);

  // Parse items safely from json
  const parseItems = (adj: StockAdjustmentRecord): StockAdjustmentItem[] => {
    try {
      if (adj.items && Array.isArray(adj.items)) return adj.items;
      const parsed = JSON.parse(adj.itemsJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Sorting
  const handleSort = (field: 'date' | 'adjustmentNumber' | 'itemCount' | 'totalQuantity') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  const renderSortIndicator = (field: 'date' | 'adjustmentNumber' | 'itemCount' | 'totalQuantity') => {
    if (sortField === field) {
      return (
        <span className="text-[#0B3D32] dark:text-emerald-400 font-bold ml-1">
          {sortDirection === 'asc' ? '▲' : '▼'}
        </span>
      );
    }
    return <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">⇅</span>;
  };

  // Clear Filters
  const handleClearFilters = () => {
    setAdjustmentTypeFilter('ALL');
    setReasonFilter('ALL');
    setDepartmentFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'SN',
        'Adjustment No.',
        'Date & Time',
        'Items Count',
        'Adjustment Type',
        'Total Quantity',
        'Primary Reason',
        'Department',
        'Adjusted By',
        'Status',
        'Notes',
      ];

      const rows = filteredAndSortedAdjustments.map((adj, idx) => [
        idx + 1,
        `"${adj.adjustmentNumber}"`,
        `"${new Date(adj.adjustmentDate).toLocaleString('en-GB')}"`,
        adj.itemCount,
        adj.adjustmentType,
        adj.totalQuantity,
        `"${adj.primaryReason}"`,
        adj.department,
        `"${adj.adjustedBy}"`,
        adj.status,
        `"${(adj.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Stock_Adjustments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Ready', `Exported ${filteredAndSortedAdjustments.length} adjustment records to CSV.`);
    } catch {
      toast.error('Export Failed', 'Could not generate CSV file.');
    }
  };

  return (
    <div className="space-y-3.5 font-sans select-none">
      {/* 1. Page Header (Requirement 1) */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Stock Adjustments</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage stock corrections, damaged products, expired items, stock losses, and physical inventory differences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenNewAdjustment) onOpenNewAdjustment();
                else setIsNewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Adjustment</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh adjustments"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Compact Summary Cards (Requirement 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Adjustments */}
        <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Adjustments
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
              {dynamicSummary.totalAdjustments}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[2px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#0B3D32] dark:text-emerald-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Stock Increased */}
        <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Stock Increased
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              +{dynamicSummary.stockIncreased}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[2px] bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Stock Decreased */}
        <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Stock Decreased
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
              -{dynamicSummary.stockDecreased}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[2px] bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Today's Adjustments */}
        <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Today&apos;s Adjustments
            </span>
            <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
              {dynamicSummary.todayAdjustments}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[2px] bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Main DataTables Card (Requirement 3 & 4) */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: Show entries & Filters on left, Search on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries + Adjustment Type + Reason + Department + Dates + Clear + Settings */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Show Entries */}
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Adjustment Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Type:</span>
              <select
                value={adjustmentTypeFilter}
                onChange={(e) => {
                  setAdjustmentTypeFilter(e.target.value as AdjustmentTypeFilter);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="INCREASE">Increase</option>
                <option value="DECREASE">Decrease</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>

            {/* Reason Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[150px]"
              >
                <option value="ALL">All Reasons</option>
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
                <option value="Lost">Lost / Missing</option>
                <option value="Spoiled">Spoiled</option>
                <option value="Stock Correction">Stock Correction</option>
                <option value="Physical Stock Count">Physical Count</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="HOTEL">Hotel</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="SHARED">Shared</option>
              </select>
            </div>

            {/* Date Range: From */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Date Range: To */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-[27px] px-3 rounded-[2px] bg-[#f39c12] hover:bg-[#e08e0b] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            >
              Clear
            </button>

            {/* Settings / Gear Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                title="Table Settings & Export"
                className="h-[27px] w-[27px] inline-flex items-center justify-center rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </button>

              {showSettingsMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportCSV();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Export to CSV / Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Print Table View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadData();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Refresh Records</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Clean Search Input */}
          <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="h-[27px] w-full sm:w-48 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>

        {/* 4. Adjustment History Table (Exact 10 Required Columns) */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-t border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* 1. SN */}
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">
                  <span>SN</span>
                </th>

                {/* 2. Adjustment No. */}
                <th
                  onClick={() => handleSort('adjustmentNumber')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Adjustment No.</span>
                    {renderSortIndicator('adjustmentNumber')}
                  </div>
                </th>

                {/* 3. Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                {/* 4. Items */}
                <th
                  onClick={() => handleSort('itemCount')}
                  className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Items</span>
                    {renderSortIndicator('itemCount')}
                  </div>
                </th>

                {/* 5. Adjustment Type */}
                <th className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                  <span>Adjustment Type</span>
                </th>

                {/* 6. Total Quantity */}
                <th
                  onClick={() => handleSort('totalQuantity')}
                  className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Quantity</span>
                    {renderSortIndicator('totalQuantity')}
                  </div>
                </th>

                {/* 7. Reason */}
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  <span>Reason</span>
                </th>

                {/* 8. Adjusted By */}
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  <span>Adjusted By</span>
                </th>

                {/* 9. Status */}
                <th className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                  <span>Status</span>
                </th>

                {/* 10. Action */}
                <th className="py-2.5 px-3 text-center whitespace-nowrap">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading stock adjustments history...</span>
                  </td>
                </tr>
              ) : paginatedAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No stock adjustment records found matching your filter criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click &quot;+ New Adjustment&quot; to correct inventory stock counts.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAdjustments.map((adj, index) => {
                  const serialNumber = startIndex + index + 1;
                  const lineItems = parseItems(adj);
                  const isIncrease = adj.adjustmentType?.toUpperCase() === 'INCREASE';
                  const isDecrease = adj.adjustmentType?.toUpperCase() === 'DECREASE';
                  const isMixed = !isIncrease && !isDecrease;

                  return (
                    <tr
                      key={adj.id}
                      className="group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {serialNumber}
                      </td>

                      {/* 2. Adjustment No. */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {adj.adjustmentNumber}
                      </td>

                      {/* 3. Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {new Date(adj.adjustmentDate).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* 4. Items (with hover breakdown) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <div className="relative group inline-block">
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs cursor-help">
                            {adj.itemCount} {adj.itemCount === 1 ? 'item' : 'items'}
                          </span>

                          {/* Hover item summary preview */}
                          {lineItems.length > 0 && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 text-white rounded-[3px] shadow-xl text-left text-[11px] pointer-events-none">
                              <span className="font-bold text-slate-200 block border-b border-slate-700 pb-1 mb-1">
                                Adjusted Items ({lineItems.length}):
                              </span>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {lineItems.map((itm, i) => (
                                  <div key={i} className="flex justify-between items-center text-[10px]">
                                    <span className="truncate max-w-[130px] font-medium">{itm.itemName}</span>
                                    <span
                                      className={cn(
                                        'font-mono font-bold',
                                        itm.adjustmentType === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'
                                      )}
                                    >
                                      {itm.adjustmentType === 'INCREASE' ? `+${itm.quantity}` : `-${itm.quantity}`}{' '}
                                      {itm.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Adjustment Type */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <span
                          className={cn(
                            'font-semibold text-xs',
                            isIncrease
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isDecrease
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {isIncrease ? 'Increase' : isDecrease ? 'Decrease' : 'Mixed'}
                        </span>
                      </td>

                      {/* 6. Total Quantity */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <span
                          className={cn(
                            isIncrease ? 'text-emerald-600 dark:text-emerald-400' : isDecrease ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                          )}
                        >
                          {isIncrease ? `+${adj.totalQuantity}` : isDecrease ? `-${adj.totalQuantity}` : adj.totalQuantity}
                        </span>
                      </td>

                      {/* 7. Reason */}
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <span>{adj.primaryReason || 'Stock Correction'}</span>
                      </td>

                      {/* 8. Adjusted By */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{adj.adjustedBy || 'Inventory Manager'}</span>
                        </div>
                      </td>

                      {/* 9. Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{adj.status || 'Completed'}</span>
                        </span>
                      </td>

                      {/* 10. Action: View Details */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedAdjustmentForView(adj)}
                            title="View Adjustment Details"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#00acd6] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
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

        {/* 5. Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1 text-xs text-slate-600 dark:text-slate-400 gap-2 select-none">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {Math.min(startIndex + pageSize, totalEntries)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {totalEntries}
            </span>{' '}
            entries
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                return Math.abs(page - safeCurrentPage) <= 1;
              })
              .map((page, index, array) => {
                const prev = array[index - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'min-w-[27px] h-[27px] px-2 rounded-[2px] text-xs font-bold transition-colors cursor-pointer shadow-2xs',
                        safeCurrentPage === page
                          ? 'bg-[#0B3D32] text-white border border-[#0B3D32]'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. NEW STOCK ADJUSTMENT MODAL (Multi-Item Support - Requirement 5)
         ========================================================================= */}
      {isNewModalOpen && (
        <NewStockAdjustmentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          items={itemsList}
          onSuccess={() => {
            setIsNewModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* =========================================================================
          6. VIEW ADJUSTMENT DETAILS MODAL (Requirement 6)
         ========================================================================= */}
      {selectedAdjustmentForView && (
        <ViewStockAdjustmentModal
          adjustment={selectedAdjustmentForView}
          onClose={() => setSelectedAdjustmentForView(null)}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: NEW MULTI-ITEM STOCK ADJUSTMENT MODAL
// =========================================================================

interface NewStockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItemData[];
  onSuccess: () => void;
}

interface NewAdjustmentRow {
  itemId: string;
  adjustmentType: 'INCREASE' | 'DECREASE';
  quantity: number | '';
  reason: string;
  otherReasonExplanation?: string;
  notes?: string;
}

export const NewStockAdjustmentModal: React.FC<NewStockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
}) => {
  const toast = useToast();

  const [adjustmentNumber] = useState(() => `ADJ-${new Date().toISOString().replace(/\D/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`);
  const [adjustmentDate, setAdjustmentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [department, setDepartment] = useState<'HOTEL' | 'RESTAURANT' | 'SHARED'>('SHARED');
  const [documentNotes, setDocumentNotes] = useState('');
  const [adjustedBy, setAdjustedBy] = useState('Inventory Manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rows of items
  const [rows, setRows] = useState<NewAdjustmentRow[]>([
    {
      itemId: items[0]?.id || '',
      adjustmentType: 'DECREASE',
      quantity: '',
      reason: 'Damaged',
      notes: '',
    },
  ]);

  // Add Item Row
  const handleAddRow = () => {
    // Pick first unused item
    const usedIds = new Set(rows.map((r) => r.itemId));
    const available = items.find((i) => !usedIds.has(i.id));

    setRows((prev) => [
      ...prev,
      {
        itemId: available ? available.id : items[0]?.id || '',
        adjustmentType: 'DECREASE',
        quantity: '',
        reason: 'Damaged',
        notes: '',
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.warning('Minimum Required', 'An adjustment document must contain at least one item.');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Item Row
  const handleUpdateRow = (index: number, patch: Partial<NewAdjustmentRow>) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rows.length === 0) {
      toast.error('Validation Error', 'Please add at least one item.');
      return;
    }

    // Check duplicate items
    const itemIds = rows.map((r) => r.itemId).filter(Boolean);
    const duplicates = itemIds.filter((id, idx) => itemIds.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      toast.error('Duplicate Item', 'Each inventory item can only be adjusted once per document.');
      return;
    }

    // Validate quantities & stocks
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const itm = items.find((it) => it.id === r.itemId);
      const itemName = itm?.name || `Row #${i + 1}`;
      const qty = Number(r.quantity);

      if (!r.itemId) {
        toast.error('Missing Item', `Please select an inventory item for Row #${i + 1}.`);
        return;
      }

      if (isNaN(qty) || qty <= 0) {
        toast.error('Invalid Quantity', `Quantity for '${itemName}' must be greater than zero.`);
        return;
      }

      if (r.adjustmentType === 'DECREASE' && itm && itm.trackStock !== false) {
        const available = itm.currentStock ?? 0;
        if (qty > available) {
          toast.error(
            'Insufficient Stock',
            `Cannot decrease ${qty} ${itm.unit || 'units'} of '${itemName}'. Available stock is only ${available}. Negative stock is not permitted.`
          );
          return;
        }
      }

      if (r.reason === 'Other' && !r.otherReasonExplanation?.trim() && !r.notes?.trim()) {
        toast.error('Explanation Required', `Please explain the reason for '${itemName}' since 'Other' was selected.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateStockAdjustmentRequest = {
        adjustmentNumber,
        adjustmentDate: new Date(adjustmentDate).toISOString(),
        department,
        notes: documentNotes,
        adjustedBy,
        items: rows.map((r) => {
          const finalReason = r.reason === 'Other' && r.otherReasonExplanation?.trim()
            ? `Other: ${r.otherReasonExplanation.trim()}`
            : r.reason;

          return {
            itemId: r.itemId,
            adjustmentType: r.adjustmentType,
            quantity: Number(r.quantity),
            reason: finalReason,
            notes: r.notes || undefined,
          };
        }),
      };

      const res = await api.createStockAdjustment(payload);

      toast.success(
        'Adjustment Finalized',
        `Stock adjustment document '${adjustmentNumber}' successfully posted to inventory and movement history.`
      );
      onSuccess();
    } catch (err: any) {
      toast.error('Adjustment Failed', err.message || 'Failed to finalize stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B3D32] text-white shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
            <h3 className="text-sm font-bold tracking-tight">New Stock Adjustment Document</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Section A: Document Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              1. Document Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Adjustment No. (Auto)
                </label>
                <input
                  type="text"
                  value={adjustmentNumber}
                  readOnly
                  className="h-[28px] w-full px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 select-all cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Adjustment Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  required
                  className="h-[28px] w-full px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="h-[28px] w-full px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value="SHARED">Shared (Central Store)</option>
                  <option value="RESTAURANT">Restaurant Outlet</option>
                  <option value="HOTEL">Hotel Department</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Adjusted By
                </label>
                <input
                  type="text"
                  value={adjustedBy}
                  onChange={(e) => setAdjustedBy(e.target.value)}
                  required
                  className="h-[28px] w-full px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            <div className="mt-2.5">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Document Notes (Optional)
              </label>
              <input
                type="text"
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                placeholder="e.g. Monthly stock take discrepancy adjustment approved by general manager"
                className="h-[28px] w-full px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>
          </div>

          {/* Section B: Add Inventory Items (Multi-Item Table) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                2. Inventory Items to Adjust ({rows.length})
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white text-[11px] font-semibold hover:bg-[#082d25] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBFB] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <th className="py-2 px-2.5 min-w-[200px]">Inventory Item</th>
                    <th className="py-2 px-2.5 w-24 text-right">Current Stock</th>
                    <th className="py-2 px-2.5 w-28">Type</th>
                    <th className="py-2 px-2.5 w-24 text-right">Adj Qty</th>
                    <th className="py-2 px-2.5 w-24 text-right">New Stock</th>
                    <th className="py-2 px-2.5 min-w-[150px]">Reason</th>
                    <th className="py-2 px-2.5 min-w-[120px]">Notes</th>
                    <th className="py-2 px-2 w-10 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row, index) => {
                    const itm = items.find((i) => i.id === row.itemId);
                    const curStock = itm?.currentStock ?? 0;
                    const unit = itm?.unit || 'pcs';
                    const qtyVal = Number(row.quantity) || 0;
                    const isIncrease = row.adjustmentType === 'INCREASE';
                    const newCalculatedStock = isIncrease ? curStock + qtyVal : Math.max(0, curStock - qtyVal);
                    const isOverdrawn = !isIncrease && qtyVal > curStock && itm?.trackStock !== false;

                    return (
                      <tr
                        key={index}
                        className={cn(
                          'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                          isOverdrawn && 'bg-rose-50/40 dark:bg-rose-950/20'
                        )}
                      >
                        {/* Serial */}
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400 text-[11px]">
                          {index + 1}
                        </td>

                        {/* Inventory Item Select */}
                        <td className="py-2 px-2.5">
                          <select
                            value={row.itemId}
                            onChange={(e) => handleUpdateRow(index, { itemId: e.target.value })}
                            required
                            className="h-[27px] w-full px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                          >
                            <option value="">-- Select Inventory Item --</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} ({it.sku}) · Available: {it.currentStock} {it.unit}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Current Stock */}
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                          {curStock} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
                        </td>

                        {/* Adjustment Type: Increase or Decrease */}
                        <td className="py-2 px-2.5">
                          <select
                            value={row.adjustmentType}
                            onChange={(e) => {
                              const newType = e.target.value as 'INCREASE' | 'DECREASE';
                              handleUpdateRow(index, {
                                adjustmentType: newType,
                                reason: newType === 'INCREASE' ? 'Stock Correction' : 'Damaged',
                              });
                            }}
                            className={cn(
                              'h-[27px] w-full px-1.5 border rounded-[2px] text-xs font-semibold focus:outline-none',
                              row.adjustmentType === 'INCREASE'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'
                            )}
                          >
                            <option value="INCREASE">+ Increase</option>
                            <option value="DECREASE">- Decrease</option>
                          </select>
                        </td>

                        {/* Adj Qty */}
                        <td className="py-2 px-2.5 text-right">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0);
                              handleUpdateRow(index, { quantity: val });
                            }}
                            placeholder="Qty"
                            required
                            className={cn(
                              'h-[27px] w-full px-1.5 text-right border rounded-[2px] bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-none',
                              isOverdrawn
                                ? 'border-rose-500 text-rose-600 focus:border-rose-600'
                                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-[#0B3D32]'
                            )}
                          />
                        </td>

                        {/* New Stock Preview */}
                        <td className="py-2 px-2.5 text-right font-mono font-bold whitespace-nowrap text-xs">
                          <span
                            className={cn(
                              isOverdrawn
                                ? 'text-rose-600'
                                : isIncrease
                                ? 'text-emerald-600'
                                : 'text-slate-800 dark:text-slate-200'
                            )}
                          >
                            {newCalculatedStock}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
                        </td>

                        {/* Reason Dropdown */}
                        <td className="py-2 px-2.5">
                          <div className="space-y-1">
                            <select
                              value={row.reason}
                              onChange={(e) => handleUpdateRow(index, { reason: e.target.value })}
                              required
                              className="h-[27px] w-full px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                            >
                              {row.adjustmentType === 'INCREASE' ? (
                                <>
                                  <option value="Stock Correction">Stock Correction</option>
                                  <option value="Physical Stock Count">Physical Stock Count</option>
                                  <option value="Found Stock">Found Stock</option>
                                  <option value="Other">Other</option>
                                </>
                              ) : (
                                <>
                                  <option value="Damaged">Damaged</option>
                                  <option value="Expired">Expired</option>
                                  <option value="Lost / Missing">Lost / Missing</option>
                                  <option value="Spoiled">Spoiled</option>
                                  <option value="Stock Correction">Physical Stock Correction</option>
                                  <option value="Other">Other</option>
                                </>
                              )}
                            </select>

                            {/* Required explanation if 'Other' */}
                            {row.reason === 'Other' && (
                              <input
                                type="text"
                                value={row.otherReasonExplanation || ''}
                                onChange={(e) => handleUpdateRow(index, { otherReasonExplanation: e.target.value })}
                                placeholder="Explain reason..."
                                required
                                className="h-[24px] w-full px-1.5 border border-amber-300 dark:border-amber-700 rounded-[2px] bg-amber-50/50 dark:bg-amber-950/20 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                              />
                            )}
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={row.notes || ''}
                            onChange={(e) => handleUpdateRow(index, { notes: e.target.value })}
                            placeholder="Optional notes"
                            className="h-[27px] w-full px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Action: Remove Item */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            title="Remove line"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Warning if overdrawn */}
            {rows.some((r) => {
              const itm = items.find((i) => i.id === r.itemId);
              return r.adjustmentType === 'DECREASE' && Number(r.quantity) > (itm?.currentStock ?? 0) && itm?.trackStock !== false;
            }) && (
              <div className="p-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>One or more items exceed available stock. Decreasing stock cannot cause negative inventory.</span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer (Form Actions - Requirement 5E) */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Adjustment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Adjustment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: VIEW ADJUSTMENT DETAILS MODAL / DRAWER (Requirement 6)
// =========================================================================

interface ViewStockAdjustmentModalProps {
  adjustment: StockAdjustmentRecord;
  onClose: () => void;
}

export const ViewStockAdjustmentModal: React.FC<ViewStockAdjustmentModalProps> = ({
  adjustment,
  onClose,
}) => {
  const lineItems: StockAdjustmentItem[] = useMemo(() => {
    try {
      if (adjustment.items && Array.isArray(adjustment.items)) return adjustment.items;
      const parsed = JSON.parse(adjustment.itemsJson || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [adjustment]);

  const isIncrease = adjustment.adjustmentType?.toUpperCase() === 'INCREASE';
  const isDecrease = adjustment.adjustmentType?.toUpperCase() === 'DECREASE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B3D32] text-white shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
            <h3 className="text-sm font-bold tracking-tight">Stock Adjustment Details: {adjustment.adjustmentNumber}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Adjustment No.</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                {adjustment.adjustmentNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Date &amp; Time</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                {new Date(adjustment.adjustmentDate).toLocaleString('en-GB')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                {adjustment.department || 'SHARED'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>{adjustment.status || 'Completed'}</span>
              </span>
            </div>
          </div>

          {/* User & Notes */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Adjusted By:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {adjustment.adjustedBy || 'Inventory Manager'}
              </span>
            </div>

            {adjustment.notes && (
              <div className="py-1">
                <span className="text-slate-500 block mb-0.5">Notes:</span>
                <p className="p-2 bg-slate-50 dark:bg-slate-800 rounded-[2px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                  {adjustment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Adjusted Items Table (Requirement 6) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden">
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Adjusted Items ({lineItems.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBFB] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Type</th>
                    <th className="py-2 px-3 text-right">Previous Stock</th>
                    <th className="py-2 px-3 text-right">Adjustment Qty</th>
                    <th className="py-2 px-3 text-right">New Stock</th>
                    <th className="py-2 px-3">Reason</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lineItems.map((itm, idx) => {
                    const itmInc = itm.adjustmentType === 'INCREASE';
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {/* Item Name */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {itm.itemName}
                          </span>
                          {itm.itemCode && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {itm.itemCode}
                            </span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.2 rounded-[2px] text-[10px] font-semibold border',
                              itmInc
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            )}
                          >
                            {itmInc ? 'Increase' : 'Decrease'}
                          </span>
                        </td>

                        {/* Previous Stock */}
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                          {itm.currentStock} {itm.unit}
                        </td>

                        {/* Adjustment Qty */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={itmInc ? 'text-emerald-600' : 'text-rose-600'}>
                            {itmInc ? `+${itm.quantity}` : `-${itm.quantity}`} {itm.unit}
                          </span>
                        </td>

                        {/* New Stock */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {itm.newStock} {itm.unit}
                        </td>

                        {/* Reason */}
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                          <span>{itm.reason}</span>
                          {itm.notes && (
                            <span className="block text-[10px] text-slate-400 italic mt-0.5">
                              {itm.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Related Stock Movement Link (Requirement 8) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-[2px] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Audit Trail</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                Recorded in Stock Movements Ledger under Reference #{adjustment.adjustmentNumber}
              </span>
            </div>

            <Link
              href="/stock-movements"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-[#0B3D32] text-white text-xs font-semibold hover:bg-[#082d25] transition-colors shadow-2xs"
            >
              <span>View Stock Movements</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[2px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

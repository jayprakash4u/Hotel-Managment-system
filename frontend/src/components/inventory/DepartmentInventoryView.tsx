'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  ArrowUpDown,
  X,
  History,
  Eye,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Layers,
  Building,
  Check,
  ChevronDown,
  Receipt,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { StockHistoryModal } from './StockHistoryModal';
import { AddItemModal } from './AddItemModal';
import { ItemPurchaseLedgerView } from './ItemPurchaseLedgerView';
import { InventoryItemData } from '@/lib/types';

export type InventoryItem = InventoryItemData;

export interface SupplierOption {
  id: string;
  name: string;
  category?: string;
}

interface DepartmentInventoryViewProps {
  department?: 'HOTEL' | 'RESTAURANT' | 'ALL';
  items: InventoryItem[];
  suppliers: SupplierOption[];
  loading: boolean;
  onRefresh: () => void;
}

type SortField =
  | 'sn'
  | 'sku'
  | 'name'
  | 'category'
  | 'prevStock'
  | 'recentlyAdded'
  | 'currentStock'
  | 'lastPurchaseDate'
  | 'lastPurchaseAmount'
  | 'totalPurchaseAmount'
  | 'supplier'
  | 'status';

interface ColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
}

const TABLE_COLUMNS: ColumnDef[] = [
  { id: 'sn', label: '#', defaultVisible: true, align: 'center', minWidth: '48px' },
  { id: 'code', label: 'Item Code', defaultVisible: true, align: 'left', minWidth: '110px' },
  { id: 'name', label: 'Item Name', defaultVisible: true, align: 'left', minWidth: '220px' },
  { id: 'category', label: 'Category', defaultVisible: true, align: 'left', minWidth: '130px' },
  { id: 'prevStock', label: 'Previous Stock', defaultVisible: true, align: 'right', minWidth: '120px' },
  { id: 'recentlyAdded', label: 'Recently Added Stock', defaultVisible: true, align: 'right', minWidth: '140px' },
  { id: 'currentStock', label: 'Current Stock', defaultVisible: true, align: 'right', minWidth: '120px' },
  { id: 'stockUnit', label: 'Stock Unit', defaultVisible: true, align: 'center', minWidth: '90px' },
  { id: 'prevPurchaseDate', label: 'Previous Purchase Date', defaultVisible: true, align: 'center', minWidth: '140px' },
  { id: 'lastPurchaseDate', label: 'Last Purchase Date', defaultVisible: true, align: 'center', minWidth: '130px' },
  { id: 'lastPurchaseQty', label: 'Last Purchase Quantity', defaultVisible: true, align: 'center', minWidth: '140px' },
  { id: 'prevPurchaseAmount', label: 'Previous Purchase Amount', defaultVisible: true, align: 'right', minWidth: '160px' },
  { id: 'lastPurchaseAmount', label: 'Last Purchase Amount', defaultVisible: true, align: 'right', minWidth: '150px' },
  { id: 'totalPurchaseAmount', label: 'Total Purchase Amount', defaultVisible: true, align: 'right', minWidth: '160px' },
  { id: 'lastSupplier', label: 'Last Supplier', defaultVisible: true, align: 'left', minWidth: '160px' },
  { id: 'minStock', label: 'Minimum Stock', defaultVisible: true, align: 'center', minWidth: '110px' },
  { id: 'status', label: 'Stock Status', defaultVisible: true, align: 'center', minWidth: '115px' },
  { id: 'actions', label: 'Actions', defaultVisible: true, align: 'center', minWidth: '130px' },
];

export const DepartmentInventoryView: React.FC<DepartmentInventoryViewProps> = ({
  department,
  items,
  suppliers,
  loading,
  onRefresh,
}) => {
  const toast = useToast();

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((col) => {
      map[col.id] = col.defaultVisible;
    });
    return map;
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Close column dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Modals State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemName, setHistoryItemName] = useState<string>('');
  const [purchaseHistoryItemId, setPurchaseHistoryItemId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Filter department items
  const deptItems = useMemo(() => {
    if (!department || department === 'ALL') return items;
    return items.filter((i) => i.department?.toUpperCase() === department.toUpperCase());
  }, [items, department]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(deptItems.map((i) => i.category.toUpperCase()));
    return ['ALL', ...Array.from(set)];
  }, [deptItems]);

  const formatCategoryName = (cat: string) => {
    if (cat === 'ALL') return 'All Categories';
    return cat
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDateDisplay = (val?: string | Date | null): string => {
    if (!val) return '—';
    try {
      const dObj = new Date(val);
      if (isNaN(dObj.getTime())) return '—';
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = dObj.getFullYear();
      return `${d}/${m}/${y}`;
    } catch {
      return '—';
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = deptItems.length;
    const trackedItems = deptItems.filter((i) => i.trackStock !== false);
    const notTracked = deptItems.filter((i) => i.trackStock === false).length;
    const outOfStock = trackedItems.filter((i) => i.currentStock <= 0).length;
    const lowStock = trackedItems.filter((i) => i.minThreshold > 0 && i.currentStock <= i.minThreshold && i.currentStock > 0).length;
    const inStock = trackedItems.length - outOfStock - lowStock;
    const cumulativePurchases = deptItems.reduce((sum, i) => sum + (Number(i.totalPurchaseAmount) || 0), 0);

    return { total, inStock, lowStock, outOfStock, notTracked, cumulativePurchases };
  }, [deptItems]);

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Toggle Column
  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  const resetColumns = () => {
    const map: Record<string, boolean> = {};
    TABLE_COLUMNS.forEach((col) => {
      map[col.id] = col.defaultVisible;
    });
    setVisibleColumns(map);
  };

  // Filtered & Sorted Records
  const processedItems = useMemo(() => {
    return deptItems
      .filter((item) => {
        const isTracked = item.trackStock !== false;
        const status = isTracked
          ? item.currentStock <= 0
            ? 'OUT_OF_STOCK'
            : item.minThreshold > 0 && item.currentStock <= item.minThreshold
            ? 'LOW_STOCK'
            : 'IN_STOCK'
          : 'NOT_TRACKED';

        if (statusFilter !== 'ALL' && status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && item.category.toUpperCase() !== categoryFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchSup =
            (item.lastSupplierName || item.lastSupplier || item.supplier?.name || '').toLowerCase().includes(q);

          if (!matchName && !matchSku && !matchCat && !matchSup) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortField === 'sku') {
          diff = a.sku.localeCompare(b.sku);
        } else if (sortField === 'category') {
          diff = a.category.localeCompare(b.category);
        } else if (sortField === 'prevStock') {
          diff = (a.previousStock || 0) - (b.previousStock || 0);
        } else if (sortField === 'recentlyAdded') {
          diff = (a.recentlyAddedStock || 0) - (b.recentlyAddedStock || 0);
        } else if (sortField === 'currentStock') {
          diff = a.currentStock - b.currentStock;
        } else if (sortField === 'lastPurchaseDate') {
          const d1 = new Date(a.lastPurchaseDate || 0).getTime();
          const d2 = new Date(b.lastPurchaseDate || 0).getTime();
          diff = d1 - d2;
        } else if (sortField === 'lastPurchaseAmount') {
          diff = (a.lastPurchaseAmount || 0) - (b.lastPurchaseAmount || 0);
        } else if (sortField === 'totalPurchaseAmount') {
          diff = (a.totalPurchaseAmount || 0) - (b.totalPurchaseAmount || 0);
        } else if (sortField === 'supplier') {
          const s1 = a.lastSupplierName || a.lastSupplier || a.supplier?.name || '';
          const s2 = b.lastSupplierName || b.lastSupplier || b.supplier?.name || '';
          diff = s1.localeCompare(s2);
        } else if (sortField === 'status') {
          const score = (i: InventoryItem) => (i.trackStock === false ? -1 : i.currentStock <= 0 ? 0 : i.currentStock <= i.minThreshold ? 1 : 2);
          diff = score(a) - score(b);
        } else {
          diff = a.name.localeCompare(b.name);
        }
        return sortDirection === 'asc' ? diff : -diff;
      });
  }, [deptItems, statusFilter, categoryFilter, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalEntries = processedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = processedItems.slice(startIndex, startIndex + pageSize);

  // Edit Submission
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/inventory/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
          category: editingItem.category,
          sku: editingItem.sku,
          minThreshold: Number(editingItem.minThreshold) || 0,
          unit: editingItem.unit,
          purchaseUnit: editingItem.purchaseUnit || null,
          conversionFactor: Number(editingItem.conversionFactor) || 1.0,
          trackStock: editingItem.trackStock ?? true,
        }),
      });

      const json = await res.json();
      if (json && json.success) {
        toast.success('Item Updated', `"${editingItem.name}" updated successfully.`);
        setEditingItem(null);
        onRefresh();
      } else {
        toast.error('Failed to update item', json?.message || 'Server error occurred.');
      }
    } catch (err: any) {
      toast.error('Network Error', err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const visibleColumnCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  return (
    <div className="space-y-3 font-sans select-none">
      {/* =========================================================================
          1. QUICK STATUS FILTER TABS
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {[
          { id: 'ALL', label: 'All Items' },
          { id: 'IN_STOCK', label: 'In Stock' },
          { id: 'LOW_STOCK', label: 'Low Stock' },
          { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
          { id: 'NOT_TRACKED', label: 'Not Tracked' },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] border transition-colors cursor-pointer shrink-0',
                isSelected
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs'
                  : 'bg-white dark:bg-surface-card border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-hover'
              )}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Refresh inventory"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-[#0B3D32]')} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN DATATABLES CARD
         ========================================================================= */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries & Category Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[170px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Controls: Column Visibility, Search, & "+ Add Item" */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Show / Hide Columns Dropdown */}
            <div className="relative" ref={columnDropdownRef}>
              <button
                type="button"
                onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns ({visibleColumnCount}/{TABLE_COLUMNS.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-1 z-50 w-64 bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[3px] shadow-xl p-2.5 text-xs animate-in fade-in duration-100 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-border-default">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Toggle Columns</span>
                    <button
                      type="button"
                      onClick={resetColumns}
                      className="text-[11px] text-[#0B3D32] dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Reset All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {TABLE_COLUMNS.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.id] ?? true}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded text-[#0B3D32] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Code, name, category, supplier..."
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 pr-6 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] w-48 sm:w-56"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* "+ Add Item" Button */}
            <button
              type="button"
              onClick={() => setIsAddItemOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold rounded-[3px] shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. MAIN INVENTORY TABLE (HORIZONTALLY SCROLLABLE WITH 18 SPEC COLUMNS)
           ========================================================================= */}
        <div className="overflow-x-auto border border-slate-200 dark:border-border-default rounded-[3px]">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 font-bold select-none text-[11px]">
                {/* 1. Serial Number */}
                {visibleColumns.sn && (
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                )}

                {/* 2. Item Code */}
                {visibleColumns.code && (
                  <th
                    onClick={() => handleSort('sku')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item Code</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 3. Item Name */}
                {visibleColumns.name && (
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 4. Category */}
                {visibleColumns.category && (
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 5. Previous Stock */}
                {visibleColumns.prevStock && (
                  <th
                    onClick={() => handleSort('prevStock')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Previous Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 6. Recently Added Stock */}
                {visibleColumns.recentlyAdded && (
                  <th
                    onClick={() => handleSort('recentlyAdded')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/50 text-emerald-800 dark:text-emerald-400"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Recently Added</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 7. Current Stock */}
                {visibleColumns.currentStock && (
                  <th
                    onClick={() => handleSort('currentStock')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Current Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 8. Stock Unit */}
                {visibleColumns.stockUnit && (
                  <th className="py-2.5 px-3 text-center">Stock Unit</th>
                )}

                {/* 9. Previous Purchase Date */}
                {visibleColumns.prevPurchaseDate && (
                  <th className="py-2.5 px-3 text-center">Previous Purchase Date</th>
                )}

                {/* 10. Last Purchase Date */}
                {visibleColumns.lastPurchaseDate && (
                  <th
                    onClick={() => handleSort('lastPurchaseDate')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Last Purchase Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 11. Last Purchase Quantity */}
                {visibleColumns.lastPurchaseQty && (
                  <th className="py-2.5 px-3 text-center">Last Purchase Qty</th>
                )}

                {/* 12. Previous Purchase Amount */}
                {visibleColumns.prevPurchaseAmount && (
                  <th className="py-2.5 px-3 text-right">Previous Purchase Amount</th>
                )}

                {/* 13. Last Purchase Amount */}
                {visibleColumns.lastPurchaseAmount && (
                  <th
                    onClick={() => handleSort('lastPurchaseAmount')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Last Purchase Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 14. Total Purchase Amount */}
                {visibleColumns.totalPurchaseAmount && (
                  <th
                    onClick={() => handleSort('totalPurchaseAmount')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Purchase Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 15. Last Supplier */}
                {visibleColumns.lastSupplier && (
                  <th
                    onClick={() => handleSort('supplier')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>Last Supplier</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 16. Minimum Stock */}
                {visibleColumns.minStock && (
                  <th className="py-2.5 px-3 text-center">Minimum Stock</th>
                )}

                {/* 17. Stock Status */}
                {visibleColumns.status && (
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/50"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Stock Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* 18. Actions */}
                {visibleColumns.actions && (
                  <th className="py-2.5 px-3 text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#071F1A]">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading inventory items...</span>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="py-10 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {searchQuery ? 'No inventory items match your search filter.' : 'No items recorded in this department.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Add Item" or record a new purchase to populate stock.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const serialNumber = startIndex + index + 1;
                  const isTracked = item.trackStock !== false;

                  const status = !isTracked
                    ? 'NOT_TRACKED'
                    : item.currentStock <= 0
                    ? 'OUT_OF_STOCK'
                    : item.minThreshold > 0 && item.currentStock <= item.minThreshold
                    ? 'LOW_STOCK'
                    : 'IN_STOCK';

                  const supplierName = item.lastSupplierName || item.lastSupplier || item.supplier?.name || '—';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. # */}
                      {visibleColumns.sn && (
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {serialNumber}
                        </td>
                      )}

                      {/* 2. Item Code */}
                      {visibleColumns.code && (
                        <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {item.sku}
                          </span>
                        </td>
                      )}

                      {/* 3. Item Name */}
                      {visibleColumns.name && (
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-[240px] truncate">
                          {item.name}
                        </td>
                      )}

                      {/* 4. Category */}
                      {visibleColumns.category && (
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {formatCategoryName(item.category)}
                          </span>
                        </td>
                      )}

                      {/* 5. Previous Stock */}
                      {visibleColumns.prevStock && (
                        <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                          {isTracked ? (
                            item.previousStock !== null && item.previousStock !== undefined ? (
                              <span>{item.previousStock.toLocaleString()} {item.unit}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not Tracked</span>
                          )}
                        </td>
                      )}

                      {/* 6. Recently Added Stock */}
                      {visibleColumns.recentlyAdded && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {isTracked ? (
                            item.recentlyAddedStock !== null && item.recentlyAddedStock !== undefined && item.recentlyAddedStock > 0 ? (
                              <span>+{item.recentlyAddedStock.toLocaleString()} {item.unit}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">0</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-normal">Not Tracked</span>
                          )}
                        </td>
                      )}

                      {/* 7. Current Stock */}
                      {visibleColumns.currentStock && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {isTracked ? (
                            <span>{item.currentStock.toLocaleString()} {item.unit}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-normal">Not Tracked</span>
                          )}
                        </td>
                      )}

                      {/* 8. Stock Unit */}
                      {visibleColumns.stockUnit && (
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 text-xs">
                          {item.unit}
                        </td>
                      )}

                      {/* 9. Previous Purchase Date */}
                      {visibleColumns.prevPurchaseDate && (
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {formatDateDisplay(item.previousPurchaseDate)}
                        </td>
                      )}

                      {/* 10. Last Purchase Date */}
                      {visibleColumns.lastPurchaseDate && (
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                          {formatDateDisplay(item.lastPurchaseDate)}
                        </td>
                      )}

                      {/* 11. Last Purchase Quantity */}
                      {visibleColumns.lastPurchaseQty && (
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-700 dark:text-slate-300">
                          {item.lastPurchaseQuantity || '—'}
                        </td>
                      )}

                      {/* 12. Previous Purchase Amount */}
                      {visibleColumns.prevPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                          {item.previousPurchaseAmount !== null && item.previousPurchaseAmount !== undefined && item.previousPurchaseAmount > 0 ? (
                            <span>Rs. {item.previousPurchaseAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* 13. Last Purchase Amount */}
                      {visibleColumns.lastPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.lastPurchaseAmount !== null && item.lastPurchaseAmount !== undefined && item.lastPurchaseAmount > 0 ? (
                            <span>Rs. {item.lastPurchaseAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                      )}

                      {/* 14. Total Purchase Amount */}
                      {visibleColumns.totalPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Rs. {(item.totalPurchaseAmount || 0).toLocaleString()}
                        </td>
                      )}

                      {/* 15. Last Supplier */}
                      {visibleColumns.lastSupplier && (
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={supplierName}>
                          {supplierName}
                        </td>
                      )}

                      {/* 16. Minimum Stock */}
                      {visibleColumns.minStock && (
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                          {isTracked ? `${item.minThreshold} ${item.unit}` : '—'}
                        </td>
                      )}

                      {/* 17. Stock Status */}
                      {visibleColumns.status && (
                        <td className="py-2 px-3 text-center">
                          {status === 'NOT_TRACKED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              Not Tracked
                            </span>
                          ) : status === 'OUT_OF_STOCK' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          ) : status === 'LOW_STOCK' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock
                            </span>
                          )}
                        </td>
                      )}

                      {/* 18. Actions */}
                      {visibleColumns.actions && (
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Item Details */}
                            <button
                              type="button"
                              onClick={() => setViewingItem(item)}
                              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Item */}
                            <button
                              type="button"
                              onClick={() => setEditingItem({ ...item })}
                              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Purchase History */}
                            <button
                              type="button"
                              onClick={() => setPurchaseHistoryItemId(item.id)}
                              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Purchase history / ledger"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            {/* Stock History */}
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryItemId(item.id);
                                setHistoryItemName(item.name);
                              }}
                              className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View stock history ledger"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. BOTTOM CONTROLS: ENTRIES COUNT & PAGINATION
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          {/* Entries count */}
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalEntries === 0 ? 0 : startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {Math.min(startIndex + pageSize, totalEntries)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalEntries}
            </span>{' '}
            entries
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
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
                      'min-w-[28px] h-7 px-2 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                        : 'bg-white dark:bg-surface-card border-slate-300 dark:border-border-default hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: VIEW ITEM DETAILS
         ========================================================================= */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto font-sans">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {viewingItem.name}
                </h3>
                <span className="font-mono text-[10px] text-slate-500">
                  {viewingItem.sku} · {viewingItem.department} Inventory
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Stock Summary Grid */}
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Previous Stock</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {viewingItem.trackStock !== false
                      ? `${viewingItem.previousStock ?? 0} ${viewingItem.unit}`
                      : 'Not Tracked'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-bold block">Recently Added</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5 block">
                    {viewingItem.trackStock !== false
                      ? `+${viewingItem.recentlyAddedStock ?? 0} ${viewingItem.unit}`
                      : 'Not Tracked'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#0B3D32] dark:text-emerald-300 font-bold block">Current Stock</span>
                  <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-200 text-xs mt-0.5 block">
                    {viewingItem.trackStock !== false
                      ? `${viewingItem.currentStock} ${viewingItem.unit}`
                      : 'Not Tracked'}
                  </span>
                </div>
              </div>

              {/* Purchase Amounts & Dates Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-200 dark:border-slate-700 pb-1">
                  Purchase Amount Tracking
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Previous Purchase:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {viewingItem.previousPurchaseAmount ? `Rs. ${viewingItem.previousPurchaseAmount.toLocaleString()}` : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Date: {formatDateDisplay(viewingItem.previousPurchaseDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">Last Purchase:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {viewingItem.lastPurchaseAmount ? `Rs. ${viewingItem.lastPurchaseAmount.toLocaleString()}` : '—'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Qty: {viewingItem.lastPurchaseQuantity || '—'} · Date: {formatDateDisplay(viewingItem.lastPurchaseDate)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Total Purchase Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    Rs. {(viewingItem.totalPurchaseAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Item Properties */}
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Category:</span>
                  <span className="font-semibold">{formatCategoryName(viewingItem.category)}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Stock Unit:</span>
                  <span className="font-semibold">{viewingItem.unit}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Minimum Threshold:</span>
                  <span className="font-semibold">{viewingItem.minThreshold} {viewingItem.unit}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Last Supplier:</span>
                  <span className="font-semibold">{viewingItem.lastSupplierName || viewingItem.lastSupplier || viewingItem.supplier?.name || '—'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingItem.id;
                      setViewingItem(null);
                      setPurchaseHistoryItemId(id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Purchase Ledger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingItem.id;
                      const name = viewingItem.name;
                      setViewingItem(null);
                      setHistoryItemId(id);
                      setHistoryItemName(name);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Stock History</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT INVENTORY ITEM
         ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Item: {editingItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. carton"
                    value={editingItem.purchaseUnit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, purchaseUnit: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Conversion Factor
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={editingItem.conversionFactor || 1.0}
                    onChange={(e) => setEditingItem({ ...editingItem, conversionFactor: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingItem.minThreshold}
                  onChange={(e) => setEditingItem({ ...editingItem, minThreshold: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingItem.trackStock !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, trackStock: e.target.checked })}
                    className="rounded text-[#0B3D32] focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Track Inventory Stock Quantity
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  If disabled, shows &quot;Not Tracked&quot; for stock quantities while continuing to record purchase spending.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD ITEM MODAL
         ========================================================================= */}
      {isAddItemOpen && (
        <AddItemModal
          isOpen={isAddItemOpen}
          onClose={() => setIsAddItemOpen(false)}
          department={department === 'HOTEL' ? 'HOTEL' : 'RESTAURANT'}
          existingItems={deptItems.map(i => ({ name: i.name, department: i.department || (department === 'HOTEL' ? 'HOTEL' : 'RESTAURANT') }))}
          onItemCreated={() => {
            setIsAddItemOpen(false);
            onRefresh();
          }}
        />
      )}

      {/* =========================================================================
          MODAL 4: DETAILED STOCK HISTORY MODAL
         ========================================================================= */}
      {historyItemId && (
        <StockHistoryModal
          isOpen={!!historyItemId}
          onClose={() => {
            setHistoryItemId(null);
            setHistoryItemName('');
          }}
          itemId={historyItemId}
          itemName={historyItemName}
        />
      )}

      {/* =========================================================================
          MODAL 5: ITEM PURCHASE LEDGER MODAL
         ========================================================================= */}
      {purchaseHistoryItemId && (
        <ItemPurchaseLedgerView
          initialItemId={purchaseHistoryItemId}
          items={items}
          suppliers={suppliers as any}
          onClose={() => setPurchaseHistoryItemId(null)}
          isModal={true}
        />
      )}
    </div>
  );
};

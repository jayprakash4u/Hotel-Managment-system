'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Plus,
  Search,
  AlertTriangle,
  History,
  Boxes,
  RefreshCw,
  PackageX,
  PackageCheck,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { StockHistoryModal } from './StockHistoryModal';
import { AddItemModal } from './AddItemModal';
import { AddStockModal } from './AddStockModal';

export interface InventoryItem {
  id: string;
  name: string;
  department: 'HOTEL' | 'RESTAURANT';
  category: string;
  sku: string;
  trackStock?: boolean;
  currentStock: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  supplier?: { id: string; name: string };
  lastRestocked: string;
}

export interface SupplierOption {
  id: string;
  name: string;
  category?: string;
}

interface DepartmentInventoryViewProps {
  department: 'HOTEL' | 'RESTAURANT';
  items: InventoryItem[];
  suppliers: SupplierOption[];
  loading: boolean;
  onRefresh: () => void;
}

export const DepartmentInventoryView: React.FC<DepartmentInventoryViewProps> = ({
  department,
  items,
  suppliers,
  loading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemName, setHistoryItemName] = useState<string>('');

  // Filter items belonging to this department
  const deptItems = useMemo(() => {
    return items.filter((i) => i.department.toUpperCase() === department.toUpperCase());
  }, [items, department]);

  // Dynamic categories from existing data
  const categories = useMemo(() => {
    const set = new Set(deptItems.map((i) => i.category.toUpperCase()));
    return ['ALL', ...Array.from(set)];
  }, [deptItems]);

  // Filtered items for display
  const filteredItems = useMemo(() => {
    return deptItems.filter((item) => {
      const matchCat = categoryFilter === 'ALL' || item.category.toUpperCase() === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      const isTracked = item.trackStock !== false;
      const isLow = isTracked && item.minThreshold > 0 && item.currentStock <= item.minThreshold && item.currentStock > 0;
      const isOut = isTracked && item.currentStock <= 0;

      if (showLowStockOnly && !isLow) return false;
      if (showOutOfStockOnly && !isOut) return false;

      return matchCat && matchSearch;
    });
  }, [deptItems, categoryFilter, searchQuery, showLowStockOnly, showOutOfStockOnly]);

  // Summary Metrics strictly computed from backend data (no cross-unit totals)
  const totalItemsCount = deptItems.length;
  const lowStockCount = deptItems.filter(
    (i) => i.trackStock !== false && i.minThreshold > 0 && i.currentStock <= i.minThreshold && i.currentStock > 0
  ).length;
  const outOfStockCount = deptItems.filter((i) => i.trackStock !== false && i.currentStock <= 0).length;

  const title = department === 'HOTEL' ? 'Hotel Inventory' : 'Restaurant Inventory';
  const subtitle =
    department === 'HOTEL'
      ? 'Manage bedding, guest toiletries, room amenities, and housekeeping cleaning stock'
      : 'Manage beverages, kitchen raw materials, pantry staples, and restaurant service supplies';

  // Format unit quantity cleanly (e.g. "15 Bottles", "8 Kg", "12 Litres")
  const formatQuantity = (qty: number, unitName: string) => {
    const capUnit = unitName ? unitName.charAt(0).toUpperCase() + unitName.slice(1) : 'Units';
    return `${qty} ${capUnit}`;
  };

  return (
    <div className="space-y-5 select-none">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER WITH TOP-RIGHT ACTIONS: + Add Item, + Add Stock */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddItemOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />}
            className="border-[#0B3D32]/30 text-[#0B3D32] hover:bg-[#E8F2EE] dark:border-emerald-600/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
          >
            + Add Item
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddStockOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Purchase
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED INVENTORY HEALTH & KPI FILTER STRIP */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/90">
          {/* Segment 1: Total SKUs */}
          <button
            type="button"
            onClick={() => {
              setShowLowStockOnly(false);
              setShowOutOfStockOnly(false);
            }}
            className={cn(
              'group relative flex items-center justify-between p-3.5 sm:p-4 text-left transition-all cursor-pointer',
              !showLowStockOnly && !showOutOfStockOnly
                ? 'bg-slate-50/80 dark:bg-slate-800/40'
                : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors shrink-0',
                  !showLowStockOnly && !showOutOfStockOnly
                    ? 'bg-[var(--brand-primary-subtle)] text-[var(--brand-primary)]'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                <Boxes className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate font-heading">
                  Total Items
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
                    {totalItemsCount}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    registered SKUs
                  </span>
                </div>
              </div>
            </div>

            <span
              className={cn(
                'hidden md:inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors',
                !showLowStockOnly && !showOutOfStockOnly
                  ? 'bg-[var(--brand-primary-subtle)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              All Items
            </span>

            {/* Active Indicator Bar */}
            {!showLowStockOnly && !showOutOfStockOnly && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)]" />
            )}
          </button>

          {/* Segment 2: Low Stock Alert */}
          <button
            type="button"
            onClick={() => {
              setShowLowStockOnly(!showLowStockOnly);
              setShowOutOfStockOnly(false);
            }}
            className={cn(
              'group relative flex items-center justify-between p-3.5 sm:p-4 text-left transition-all cursor-pointer',
              showLowStockOnly
                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors shrink-0',
                  lowStockCount > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate font-heading">
                  Low Stock
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'text-xl font-bold font-mono leading-tight',
                      lowStockCount > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {lowStockCount}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    under threshold
                  </span>
                </div>
              </div>
            </div>

            {lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Reorder
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Optimal
              </span>
            )}

            {/* Active Indicator Bar */}
            {showLowStockOnly && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>

          {/* Segment 3: Out of Stock */}
          <button
            type="button"
            onClick={() => {
              setShowOutOfStockOnly(!showOutOfStockOnly);
              setShowLowStockOnly(false);
            }}
            className={cn(
              'group relative flex items-center justify-between p-3.5 sm:p-4 text-left transition-all cursor-pointer',
              showOutOfStockOnly
                ? 'bg-rose-50/50 dark:bg-rose-950/20'
                : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors shrink-0',
                  outOfStockCount > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                )}
              >
                <PackageX className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate font-heading">
                  Out of Stock
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'text-xl font-bold font-mono leading-tight',
                      outOfStockCount > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {outOfStockCount}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    depleted items
                  </span>
                </div>
              </div>
            </div>

            {outOfStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Critical
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                0 Depleted
              </span>
            )}

            {/* Active Indicator Bar */}
            {showOutOfStockOnly && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTERS & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#071F1A] dark:border-slate-800 shadow-2xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                categoryFilter === cat
                  ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              {cat === 'ALL' ? 'All Categories' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <Input
            placeholder="Search item name, SKU..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INVENTORY TABLE */}
      {/* Columns: Item Name | Category | Current Stock | Unit | Stock Value | Actions */}
      {/* ========================================================================= */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#071F1A] shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/60">
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Item Name</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Category</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Current Stock</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Unit</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Stock Value</TableHead>
              <TableHead className="text-right font-bold text-xs text-slate-900 dark:text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B3D32] dark:text-emerald-400 mb-2" />
                  Loading {department.toLowerCase()} inventory items...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No inventory items found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {searchQuery || categoryFilter !== 'ALL' || showLowStockOnly || showOutOfStockOnly
                        ? 'Try clearing active filters or search terms.'
                        : `No items registered under ${department} Inventory yet. Click "+ Add Item" to register your first item.`}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      {(searchQuery || categoryFilter !== 'ALL' || showLowStockOnly || showOutOfStockOnly) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('ALL');
                            setShowLowStockOnly(false);
                            setShowOutOfStockOnly(false);
                          }}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAddItemOpen(true)}
                        className="text-xs"
                      >
                        + Add Item
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const isTracked = item.trackStock !== false;
                const isOutOfStock = isTracked && item.currentStock <= 0;
                const isLowStock = isTracked && item.minThreshold > 0 && item.currentStock <= item.minThreshold && !isOutOfStock;
                const hasReliableCost = isTracked && typeof item.costPerUnit === 'number' && item.costPerUnit > 0;
                const stockValue = hasReliableCost ? item.currentStock * item.costPerUnit : null;

                return (
                  <TableRow key={item.id} className="text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {/* Item Name */}
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {!isTracked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Purchase Only
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.sku}
                        {item.supplier && ` · ${item.supplier.name}`}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-slate-600 dark:text-slate-300 font-medium">
                      {item.category.replace(/_/g, ' ')}
                    </TableCell>

                    {/* Current Stock */}
                    <TableCell>
                      {!isTracked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Purchase Only
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold font-mono text-sm',
                              isOutOfStock
                                ? 'text-rose-600 dark:text-rose-400'
                                : isLowStock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            )}
                          >
                            {formatQuantity(item.currentStock, item.unit)}
                          </span>

                          {/* Status Badges */}
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableCell>

                    {/* Unit */}
                    <TableCell className="text-slate-600 dark:text-slate-400 uppercase text-[11px] font-semibold">
                      {item.unit}
                    </TableCell>

                    {/* Stock Value */}
                    <TableCell className="font-mono text-slate-700 dark:text-slate-300">
                      {isTracked && stockValue !== null && stockValue >= 0 ? (
                        <span>{formatCurrency(stockValue)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Actions: View History */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHistoryItemId(item.id);
                          setHistoryItemName(item.name);
                        }}
                        leftIcon={<History className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />}
                        className="text-xs h-7 py-1 px-2.5 font-medium hover:border-[#0B3D32] hover:bg-[#E8F2EE] dark:hover:bg-emerald-950/40"
                      >
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        department={department}
        existingItems={items}
        onItemCreated={onRefresh}
      />

      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        items={deptItems}
        suppliers={suppliers}
        onStockAdded={onRefresh}
      />

      <StockHistoryModal
        isOpen={Boolean(historyItemId)}
        onClose={() => {
          setHistoryItemId(null);
          setHistoryItemName('');
        }}
        itemId={historyItemId}
        itemName={historyItemName}
      />
    </div>
  );
};

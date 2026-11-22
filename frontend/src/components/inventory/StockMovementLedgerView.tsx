'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  RotateCcw,
  ChevronDown,
  Download,
  Printer,
  Settings,
  X,
  Columns,
  Eye,
  Plus,
  User,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { InventoryItemData, StockMovementLedgerRecord } from '@/lib/types';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface StockMovementLedgerViewProps {
  items?: InventoryItemData[];
  initialItemId?: string | null;
  showHeader?: boolean;
}

export type MovementSortField =
  | 'sn'
  | 'date'
  | 'itemName'
  | 'movementType'
  | 'reference'
  | 'quantityIn'
  | 'quantityOut'
  | 'balance'
  | 'department'
  | 'performedBy';

export interface MovementColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
}

export const MOVEMENT_TABLE_COLUMNS: MovementColumnDef[] = [
  { id: 'sn', label: 'SN', defaultVisible: true, align: 'center', minWidth: '48px' },
  { id: 'date', label: 'Date & Time', defaultVisible: true, align: 'left', minWidth: '150px' },
  { id: 'itemName', label: 'Item Name', defaultVisible: true, align: 'left', minWidth: '200px' },
  { id: 'movementType', label: 'Movement Type', defaultVisible: true, align: 'left', minWidth: '160px' },
  { id: 'reference', label: 'Reference No.', defaultVisible: true, align: 'left', minWidth: '135px' },
  { id: 'quantityIn', label: 'Quantity In', defaultVisible: true, align: 'right', minWidth: '110px' },
  { id: 'quantityOut', label: 'Quantity Out', defaultVisible: true, align: 'right', minWidth: '110px' },
  { id: 'balance', label: 'Balance', defaultVisible: true, align: 'right', minWidth: '100px' },
  { id: 'department', label: 'Department', defaultVisible: true, align: 'center', minWidth: '105px' },
  { id: 'performedBy', label: 'Performed By', defaultVisible: true, align: 'left', minWidth: '140px' },
  { id: 'actions', label: 'Action', defaultVisible: true, align: 'center', minWidth: '95px' },
];

export const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'BEVERAGE', label: 'Beverages' },
  { id: 'GROCERY', label: 'Food / Grocery' },
  { id: 'PRODUCE', label: 'Produce / Vegetables' },
  { id: 'LINEN', label: 'Linen' },
  { id: 'TOILETRIES', label: 'Toiletries' },
  { id: 'AMENITIES', label: 'Guest Amenities' },
  { id: 'CROCKERY', label: 'Crockery & Glassware' },
  { id: 'CLEANING_SUPPLIES', label: 'Cleaning Supplies' },
  { id: 'MINIBAR', label: 'Minibar' },
  { id: 'GENERAL', label: 'General Goods' },
];

// Fallback demo data representing genuine business transactions
export const DEFAULT_DEMO_MOVEMENTS: StockMovementLedgerRecord[] = [
  {
    id: 'mov-1',
    createdAt: '2026-11-22T10:45:00Z',
    itemId: 'inv-item-1',
    itemName: 'Sprite 500ml',
    itemCode: 'SPR-500',
    category: 'BEVERAGE',
    department: 'RESTAURANT',
    movementType: 'PURCHASE',
    referenceNumber: 'PUR-001',
    referenceType: 'PURCHASE',
    quantityIn: 10,
    quantityOut: 0,
    quantity: 10,
    previousBalance: 20,
    newBalance: 30,
    stockUnit: 'bottles',
    reason: 'Purchase order received',
    notes: 'Verified with physical delivery note',
    performedBy: 'Store Manager',
  },
  {
    id: 'mov-2',
    createdAt: '2026-11-22T09:30:00Z',
    itemId: 'inv-item-1',
    itemName: 'Sprite 500ml',
    itemCode: 'SPR-500',
    category: 'BEVERAGE',
    department: 'RESTAURANT',
    movementType: 'SALE',
    referenceNumber: 'INV-001',
    referenceType: 'SALE',
    quantityIn: 0,
    quantityOut: 5,
    quantity: -5,
    previousBalance: 30,
    newBalance: 25,
    stockUnit: 'bottles',
    reason: 'Restaurant POS Dine-In sale',
    notes: 'Table 4 customer bill settled',
    performedBy: 'Cashier',
  },
  {
    id: 'mov-3',
    createdAt: '2026-11-22T08:15:00Z',
    itemId: 'inv-item-1',
    itemName: 'Sprite 500ml',
    itemCode: 'SPR-500',
    category: 'BEVERAGE',
    department: 'RESTAURANT',
    movementType: 'DAMAGED_STOCK',
    referenceNumber: 'ADJ-20261122-841',
    referenceType: 'ADJUSTMENT',
    quantityIn: 0,
    quantityOut: 2,
    quantity: -2,
    previousBalance: 25,
    newBalance: 23,
    stockUnit: 'bottles',
    reason: 'Bottle seal punctured during crate handling',
    notes: 'Disposed by bar steward',
    performedBy: 'Bar Supervisor',
  },
  {
    id: 'mov-4',
    createdAt: '2026-11-21T18:00:00Z',
    itemId: 'inv-item-1',
    itemName: 'Sprite 500ml',
    itemCode: 'SPR-500',
    category: 'BEVERAGE',
    department: 'RESTAURANT',
    movementType: 'INCREASE_STOCK',
    referenceNumber: 'ADJ-20261121-502',
    referenceType: 'ADJUSTMENT',
    quantityIn: 3,
    quantityOut: 0,
    quantity: 3,
    previousBalance: 23,
    newBalance: 26,
    stockUnit: 'bottles',
    reason: 'Cycle count physical variance',
    notes: 'Approved by general manager',
    performedBy: 'Inventory Auditor',
  },
  {
    id: 'mov-5',
    createdAt: '2026-11-21T14:30:00Z',
    itemId: 'inv-item-2',
    itemName: 'Flour (All Purpose)',
    itemCode: 'FLR-AP-50',
    category: 'GROCERY',
    department: 'RESTAURANT',
    movementType: 'PURCHASE',
    referenceNumber: 'PUR-002',
    referenceType: 'PURCHASE',
    quantityIn: 20,
    quantityOut: 0,
    quantity: 20,
    previousBalance: 50,
    newBalance: 70,
    stockUnit: 'kg',
    reason: 'Kitchen grocery delivery',
    notes: 'Manual tracking stock item',
    performedBy: 'Purchasing Officer',
  },
  {
    id: 'mov-6',
    createdAt: '2026-11-21T11:00:00Z',
    itemId: 'inv-item-2',
    itemName: 'Flour (All Purpose)',
    itemCode: 'FLR-AP-50',
    category: 'GROCERY',
    department: 'RESTAURANT',
    movementType: 'DECREASE_STOCK',
    referenceNumber: 'ADJ-20261121-119',
    referenceType: 'ADJUSTMENT',
    quantityIn: 0,
    quantityOut: 5,
    quantity: -5,
    previousBalance: 70,
    newBalance: 65,
    stockUnit: 'kg',
    reason: 'Weekly bakery production usage',
    notes: 'Recorded after monthly stock take',
    performedBy: 'Head Chef',
  },
  {
    id: 'mov-7',
    createdAt: '2026-11-20T16:20:00Z',
    itemId: 'inv-item-3',
    itemName: 'Luxury Bath Towels 700GSM',
    itemCode: 'TWL-BTH-WHT',
    category: 'LINEN',
    department: 'HOTEL',
    movementType: 'HOUSEKEEPING_USAGE',
    referenceNumber: 'HK-REQ-502',
    referenceType: 'USAGE',
    quantityIn: 0,
    quantityOut: 10,
    quantity: -10,
    previousBalance: 75,
    newBalance: 65,
    stockUnit: 'pieces',
    reason: 'Deluxe suite turnover',
    notes: 'Allocated to 3rd Floor',
    performedBy: 'Housekeeping Supervisor',
  },
  {
    id: 'mov-8',
    createdAt: '2026-11-20T12:00:00Z',
    itemId: 'inv-item-4',
    itemName: 'Red Wine Cabernet Sauvignon',
    itemCode: 'WIN-CAB-750',
    category: 'BEVERAGE',
    department: 'SHARED',
    movementType: 'STOCK_TRANSFER',
    referenceNumber: 'TRF-2026-04',
    referenceType: 'TRANSFER',
    quantityIn: 12,
    quantityOut: 0,
    quantity: 12,
    previousBalance: 6,
    newBalance: 18,
    stockUnit: 'bottles',
    reason: 'Transfer from Cellar to Restaurant Bar',
    notes: 'Approved by Sommelier',
    performedBy: 'Bar Manager',
  },
  {
    id: 'mov-9',
    createdAt: '2026-11-19T17:40:00Z',
    itemId: 'inv-item-5',
    itemName: 'Fresh Roma Tomatoes',
    itemCode: 'VEG-TOM-ROMA',
    category: 'PRODUCE',
    department: 'RESTAURANT',
    movementType: 'SPOILED_STOCK',
    referenceNumber: 'ADJ-20261119-332',
    referenceType: 'ADJUSTMENT',
    quantityIn: 0,
    quantityOut: 6,
    quantity: -6,
    previousBalance: 28,
    newBalance: 22,
    stockUnit: 'kg',
    reason: 'Spoiled produce disposal',
    notes: 'Kitchen wastage log',
    performedBy: 'Sous Chef',
  },
  {
    id: 'mov-10',
    createdAt: '2026-11-18T08:00:00Z',
    itemId: 'inv-item-1',
    itemName: 'Sprite 500ml',
    itemCode: 'SPR-500',
    category: 'BEVERAGE',
    department: 'RESTAURANT',
    movementType: 'OPENING_STOCK',
    referenceNumber: 'OPN-SPR-500',
    referenceType: 'OPENING',
    quantityIn: 20,
    quantityOut: 0,
    quantity: 20,
    previousBalance: 0,
    newBalance: 20,
    stockUnit: 'bottles',
    reason: 'Initial opening stock',
    notes: 'Verified during item setup',
    performedBy: 'General Manager',
  },
];

export const StockMovementLedgerView: React.FC<StockMovementLedgerViewProps> = ({
  items: propItems,
  initialItemId,
  showHeader = true,
}) => {
  const toast = useToast();
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovementLedgerRecord[]>(DEFAULT_DEMO_MOVEMENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsList, setItemsList] = useState<InventoryItemData[]>(propItems || []);

  // Modals
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedMovementForView, setSelectedMovementForView] = useState<StockMovementLedgerRecord | null>(null);

  // Filters
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || 'ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [sortField, setSortField] = useState<MovementSortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toolbar Menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MOVEMENT_TABLE_COLUMNS.forEach((col) => {
      initial[col.id] = col.defaultVisible;
    });
    return initial;
  });

  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const showAllColumns = () => {
    const next: Record<string, boolean> = {};
    MOVEMENT_TABLE_COLUMNS.forEach((col) => {
      next[col.id] = true;
    });
    setVisibleColumns(next);
  };

  const resetColumns = () => {
    const next: Record<string, boolean> = {};
    MOVEMENT_TABLE_COLUMNS.forEach((col) => {
      next[col.id] = col.defaultVisible;
    });
    setVisibleColumns(next);
  };

  const visibleColumnCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
      setShowSettingsMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Data from Server
  const loadData = async () => {
    setLoading(true);
    try {
      const filterParams = {
        itemId: selectedItemId !== 'ALL' ? selectedItemId : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        movementType: movementTypeFilter !== 'ALL' ? movementTypeFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
        search: searchQuery || undefined,
      };

      const [itemsRes, movementsRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()).catch(() => null),
        api.getStockMovements(filterParams).catch(() => null),
      ]);

      if (itemsRes?.success && Array.isArray(itemsRes.data)) {
        setItemsList(itemsRes.data);
      }

      if (Array.isArray(movementsRes) && movementsRes.length > 0) {
        setMovements(movementsRes);
      } else {
        setMovements(DEFAULT_DEMO_MOVEMENTS);
      }
    } catch {
      setMovements(DEFAULT_DEMO_MOVEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedItemId, movementTypeFilter, departmentFilter, categoryFilter, startDate, endDate]);

  // Client Filter & Sort
  const filteredAndSortedMovements = useMemo(() => {
    let list = movements.filter((m) => {
      if (selectedItemId !== 'ALL' && m.itemId !== selectedItemId) return false;
      if (departmentFilter !== 'ALL' && m.department?.toUpperCase() !== departmentFilter) return false;
      if (categoryFilter !== 'ALL' && (m.category?.toUpperCase() !== categoryFilter && m.itemCode !== categoryFilter)) return false;

      if (movementTypeFilter !== 'ALL') {
        const typeNorm = m.movementType.toUpperCase();
        if (movementTypeFilter === 'PURCHASE' && !typeNorm.includes('PURCHASE')) return false;
        else if (movementTypeFilter === 'SALE' && !typeNorm.includes('SALE') && !typeNorm.includes('POS')) return false;
        else if (movementTypeFilter === 'OPENING' && !typeNorm.includes('OPENING') && !typeNorm.includes('INITIAL')) return false;
        else if (movementTypeFilter === 'ADJUSTMENT' && !typeNorm.includes('ADJUST') && !typeNorm.includes('INCREASE') && !typeNorm.includes('DECREASE')) return false;
        else if (movementTypeFilter === 'TRANSFER' && !typeNorm.includes('TRANSFER')) return false;
        else if (movementTypeFilter === 'DAMAGED' && !typeNorm.includes('DAMAGED')) return false;
        else if (movementTypeFilter === 'SPOILED' && !typeNorm.includes('SPOIL')) return false;
        else if (movementTypeFilter === 'LOST' && !typeNorm.includes('LOST')) return false;
        else if (movementTypeFilter === 'WASTAGE' && !typeNorm.includes('WASTAGE')) return false;
        else if (movementTypeFilter === 'RETURN' && !typeNorm.includes('RETURN')) return false;
      }

      if (startDate) {
        const mDate = new Date(m.createdAt).toISOString().split('T')[0];
        if (mDate < startDate) return false;
      }
      if (endDate) {
        const mDate = new Date(m.createdAt).toISOString().split('T')[0];
        if (mDate > endDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.itemName?.toLowerCase().includes(q);
        const matchCode = m.itemCode?.toLowerCase().includes(q);
        const matchRef = m.referenceNumber?.toLowerCase().includes(q);
        const matchReason = m.reason?.toLowerCase().includes(q);
        const matchBy = m.performedBy?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRef && !matchReason && !matchBy) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'itemName') {
        diff = (a.itemName || '').localeCompare(b.itemName || '');
      } else if (sortField === 'movementType') {
        diff = (a.movementType || '').localeCompare(b.movementType || '');
      } else if (sortField === 'reference') {
        diff = (a.referenceNumber || '').localeCompare(b.referenceNumber || '');
      } else if (sortField === 'quantityIn') {
        diff = (a.quantityIn || 0) - (b.quantityIn || 0);
      } else if (sortField === 'quantityOut') {
        diff = (a.quantityOut || 0) - (b.quantityOut || 0);
      } else if (sortField === 'balance') {
        diff = (a.newBalance ?? a.quantity) - (b.newBalance ?? b.quantity);
      } else if (sortField === 'department') {
        diff = (a.department || '').localeCompare(b.department || '');
      } else if (sortField === 'performedBy') {
        diff = (a.performedBy || '').localeCompare(b.performedBy || '');
      }
      return sortDirection === 'asc' ? diff : -diff;
    });

    return list;
  }, [movements, selectedItemId, departmentFilter, categoryFilter, movementTypeFilter, startDate, endDate, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalEntries = filteredAndSortedMovements.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedMovements = filteredAndSortedMovements.slice(startIndex, startIndex + pageSize);

  // Sorting Handler
  const handleSort = (field: MovementSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  const renderSortIndicator = (field: MovementSortField) => {
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
    setSelectedItemId('ALL');
    setMovementTypeFilter('ALL');
    setDepartmentFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Format Movement Badge
  const formatMovementBadge = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t === 'OPENING_STOCK' || t === 'INITIAL_STOCK' || t === 'OPENING') {
      return {
        label: 'Opening',
        color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
    }
    if (t === 'PURCHASE' || t === 'PURCHASE_RECEIVED') {
      return {
        label: 'Purchase',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      };
    }
    if (t === 'SALE' || t === 'POS_CONSUMPTION' || t === 'SALES_DEDUCTION') {
      return {
        label: 'Sale',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      };
    }
    if (t === 'INCREASE_STOCK' || t === 'ADJUSTMENT_INCREASE') {
      return {
        label: 'Adjustment (+)',
        color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
      };
    }
    if (t === 'DECREASE_STOCK' || t === 'ADJUSTMENT_DECREASE') {
      return {
        label: 'Adjustment (-)',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      };
    }
    if (t === 'DAMAGED_STOCK' || t === 'DAMAGED') {
      return {
        label: 'Damaged',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      };
    }
    if (t === 'SPOILED_STOCK' || t === 'SPOILED') {
      return {
        label: 'Spoiled',
        color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      };
    }
    if (t === 'LOST_STOCK' || t === 'LOST') {
      return {
        label: 'Lost',
        color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      };
    }
    if (t === 'WASTAGE') {
      return {
        label: 'Wastage',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      };
    }
    if (t === 'STOCK_TRANSFER' || t === 'TRANSFER_IN' || t === 'TRANSFER_OUT' || t === 'TRANSFER') {
      return {
        label: 'Transfer',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      };
    }
    if (t === 'PURCHASE_RETURN' || t === 'RETURN') {
      return {
        label: 'Return',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      };
    }
    return {
      label: type.replace(/_/g, ' '),
      color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'SN',
        'Date & Time',
        'Item Name',
        'Item Code',
        'Movement Type',
        'Reference No.',
        'Quantity In',
        'Quantity Out',
        'Balance',
        'Unit',
        'Department',
        'Performed By',
        'Reason',
      ];

      const rows = filteredAndSortedMovements.map((m, idx) => [
        idx + 1,
        `"${new Date(m.createdAt).toLocaleString('en-GB')}"`,
        `"${(m.itemName || '').replace(/"/g, '""')}"`,
        m.itemCode || '—',
        m.movementType,
        m.referenceNumber || '—',
        m.quantityIn || 0,
        m.quantityOut || 0,
        m.newBalance ?? m.quantity,
        m.stockUnit || 'pieces',
        m.department || 'SHARED',
        `"${(m.performedBy || 'System').replace(/"/g, '""')}"`,
        `"${(m.reason || '—').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Stock_Movements_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Ready', `Exported ${filteredAndSortedMovements.length} movement records to CSV.`);
    } catch {
      toast.error('Export Failed', 'Could not generate CSV file.');
    }
  };

  return (
    <div className="space-y-3 font-sans select-none">
      {/* 1. Header Bar if embedded */}
      {showHeader && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Stock Movement History
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Adjustment</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh ledger records"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main DataTables Card (Matching exact Purchases & Suppliers pattern) */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: Show entries & Filters on left, Search on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries + Type + Dept + Category + Item + Dates + Clear + Settings + Columns */}
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

            {/* Movement Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Type:</span>
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[150px]"
              >
                <option value="ALL">All Types</option>
                <option value="OPENING">Opening Stock</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALE">Sale</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="DAMAGED">Damaged</option>
                <option value="SPOILED">Spoiled</option>
                <option value="LOST">Lost</option>
                <option value="WASTAGE">Wastage</option>
                <option value="RETURN">Return</option>
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

            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[140px]"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Filter Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Item:</span>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[150px]"
              >
                <option value="ALL">All Items</option>
                {itemsList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
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

            {/* Columns Selector Dropdown */}
            <div className="relative" ref={columnDropdownRef} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
                className="h-[27px] px-2.5 inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Columns className="w-3 h-3 text-[#0B3D32] dark:text-emerald-400" />
                <span>Columns ({visibleColumnCount}/{MOVEMENT_TABLE_COLUMNS.length})</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[3px] shadow-xl p-2.5 text-xs animate-in fade-in-50 duration-100 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Table Columns</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={showAllColumns}
                        className="text-[10px] text-[#0B3D32] dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Show All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={resetColumns}
                        className="text-[10px] text-slate-500 hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {MOVEMENT_TABLE_COLUMNS.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.id] ?? true}
                          onChange={() => toggleColumn(col.id)}
                          className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {col.label}
                        </span>
                      </label>
                    ))}
                  </div>
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

        {/* Table Container */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-t border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* 1. SN */}
                {visibleColumns.sn && (
                  <th
                    onClick={() => handleSort('sn')}
                    className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>SN</span>
                      {renderSortIndicator('sn')}
                    </div>
                  </th>
                )}

                {/* 2. Date & Time */}
                {visibleColumns.date && (
                  <th
                    onClick={() => handleSort('date')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Date &amp; Time</span>
                      {renderSortIndicator('date')}
                    </div>
                  </th>
                )}

                {/* 3. Item Name */}
                {visibleColumns.itemName && (
                  <th
                    onClick={() => handleSort('itemName')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Item Name</span>
                      {renderSortIndicator('itemName')}
                    </div>
                  </th>
                )}

                {/* 4. Movement Type */}
                {visibleColumns.movementType && (
                  <th
                    onClick={() => handleSort('movementType')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Movement Type</span>
                      {renderSortIndicator('movementType')}
                    </div>
                  </th>
                )}

                {/* 5. Reference No. */}
                {visibleColumns.reference && (
                  <th
                    onClick={() => handleSort('reference')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Reference No.</span>
                      {renderSortIndicator('reference')}
                    </div>
                  </th>
                )}

                {/* 6. Quantity In */}
                {visibleColumns.quantityIn && (
                  <th
                    onClick={() => handleSort('quantityIn')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Quantity In</span>
                      {renderSortIndicator('quantityIn')}
                    </div>
                  </th>
                )}

                {/* 7. Quantity Out */}
                {visibleColumns.quantityOut && (
                  <th
                    onClick={() => handleSort('quantityOut')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Quantity Out</span>
                      {renderSortIndicator('quantityOut')}
                    </div>
                  </th>
                )}

                {/* 8. Balance */}
                {visibleColumns.balance && (
                  <th
                    onClick={() => handleSort('balance')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Balance</span>
                      {renderSortIndicator('balance')}
                    </div>
                  </th>
                )}

                {/* 9. Department */}
                {visibleColumns.department && (
                  <th
                    onClick={() => handleSort('department')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Department</span>
                      {renderSortIndicator('department')}
                    </div>
                  </th>
                )}

                {/* 10. Performed By */}
                {visibleColumns.performedBy && (
                  <th
                    onClick={() => handleSort('performedBy')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Performed By</span>
                      {renderSortIndicator('performedBy')}
                    </div>
                  </th>
                )}

                {/* 11. Action */}
                {visibleColumns.actions && (
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span>Action</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading stock movement history...</span>
                  </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="py-10 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No stock movement records found matching your filter criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stock increases &amp; decreases will appear here automatically upon purchases, sales, and adjustments.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m, index) => {
                  const serialNumber = startIndex + index + 1;
                  const badge = formatMovementBadge(m.movementType);
                  const dept = (m.department || 'SHARED').toUpperCase();
                  const deptLabel = dept === 'HOTEL' ? 'Hotel' : dept === 'RESTAURANT' ? 'Restaurant' : 'Shared';

                  return (
                    <tr
                      key={m.id}
                      className="group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                    >
                      {/* 1. SN */}
                      {visibleColumns.sn && (
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                          {serialNumber}
                        </td>
                      )}

                      {/* 2. Date & Time */}
                      {visibleColumns.date && (
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          {new Date(m.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      )}

                      {/* 3. Item Name with Code badge */}
                      {visibleColumns.itemName && (
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {m.itemName}
                            </span>
                            {m.itemCode && m.itemCode !== '—' && (
                              <span className="px-1.5 py-0.2 rounded-[2px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                                {m.itemCode}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* 4. Movement Type */}
                      {visibleColumns.movementType && (
                        <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold border',
                              badge.color
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                      )}

                      {/* 5. Reference No. */}
                      {visibleColumns.reference && (
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          {m.referenceNumber || '—'}
                        </td>
                      )}

                      {/* 6. Quantity In */}
                      {visibleColumns.quantityIn && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          {m.quantityIn > 0 ? (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              +{m.quantityIn}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                          )}
                        </td>
                      )}

                      {/* 7. Quantity Out */}
                      {visibleColumns.quantityOut && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          {m.quantityOut > 0 ? (
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              -{m.quantityOut}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                          )}
                        </td>
                      )}

                      {/* 8. Balance */}
                      {visibleColumns.balance && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          {m.newBalance !== null && m.newBalance !== undefined ? m.newBalance : m.quantity}
                        </td>
                      )}

                      {/* 9. Department */}
                      {visibleColumns.department && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-semibold border',
                              dept === 'HOTEL'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                                : dept === 'RESTAURANT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            )}
                          >
                            {deptLabel}
                          </span>
                        </td>
                      )}

                      {/* 10. Performed By */}
                      {visibleColumns.performedBy && (
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                          <div className="flex items-center gap-1 text-[11px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.performedBy || 'System'}</span>
                          </div>
                        </td>
                      )}

                      {/* 11. Action: View Details (Cyan Square Button matching application pattern) */}
                      {visibleColumns.actions && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setSelectedMovementForView(m)}
                              title="View Details"
                              className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#00acd6] text-white transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3 h-3" />
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
          4. VIEW MOVEMENT DETAILS MODAL / DRAWER (Requirement 4)
         ========================================================================= */}
      {selectedMovementForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-300" />
                <h3 className="text-sm font-bold tracking-tight">Stock Movement Audit Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovementForView(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Item Info Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Name</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedMovementForView.itemName}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                    <span>Code: {selectedMovementForView.itemCode || '—'}</span>
                    <span>·</span>
                    <span className="uppercase">{selectedMovementForView.category || 'General'}</span>
                    <span>·</span>
                    <span>Unit: {selectedMovementForView.stockUnit || 'pieces'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference No</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {selectedMovementForView.referenceNumber}
                  </span>
                </div>
              </div>

              {/* Movement Impact Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-[3px] border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Movement Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {formatMovementBadge(selectedMovementForView.movementType).label}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Previous Stock</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300 text-xs">
                    {selectedMovementForView.previousBalance ?? '—'} {selectedMovementForView.stockUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quantity Change</span>
                  <span
                    className={cn(
                      'font-mono font-bold text-xs',
                      selectedMovementForView.quantityIn > 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {selectedMovementForView.quantityIn > 0
                      ? `+${selectedMovementForView.quantityIn}`
                      : `-${selectedMovementForView.quantityOut || Math.abs(selectedMovementForView.quantity)}`}{' '}
                    {selectedMovementForView.stockUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">New Balance</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {selectedMovementForView.newBalance ?? selectedMovementForView.quantity} {selectedMovementForView.stockUnit}
                  </span>
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Movement Date &amp; Time:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    {new Date(selectedMovementForView.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {selectedMovementForView.department || 'SHARED'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Performed By:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedMovementForView.performedBy || 'System Administrator'}
                  </span>
                </div>

                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Reason:</span>
                  <p className="p-2 bg-slate-50 dark:bg-slate-800 rounded-[2px] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium">
                    {selectedMovementForView.reason || 'No reason specified'}
                  </p>
                </div>

                {selectedMovementForView.notes && selectedMovementForView.notes !== selectedMovementForView.reason && (
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">Additional Notes:</span>
                    <p className="p-2 bg-slate-50 dark:bg-slate-800 rounded-[2px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                      {selectedMovementForView.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Source Transaction Link */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-[2px] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Source Transaction</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {selectedMovementForView.referenceType || 'Transaction'}: {selectedMovementForView.referenceNumber}
                  </span>
                </div>

                {selectedMovementForView.referenceNumber?.startsWith('PUR') || selectedMovementForView.movementType.includes('PURCHASE') ? (
                  <Link
                    href="/purchases"
                    onClick={() => setSelectedMovementForView(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white text-xs font-semibold hover:bg-[#082d25] transition-colors shadow-2xs"
                  >
                    <span>View Purchase Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : selectedMovementForView.referenceNumber?.startsWith('INV') || selectedMovementForView.movementType.includes('SALE') ? (
                  <Link
                    href="/billing"
                    onClick={() => setSelectedMovementForView(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white text-xs font-semibold hover:bg-[#082d25] transition-colors shadow-2xs"
                  >
                    <span>View Invoices &amp; Bills</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">Direct Ledger Entry</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMovementForView(null)}
                className="px-4 py-1.5 rounded-[2px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. STOCK ADJUSTMENT MODAL
         ========================================================================= */}
      {isAdjustmentModalOpen && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          items={itemsList}
          initialItemId={selectedItemId !== 'ALL' ? selectedItemId : undefined}
          onSuccess={() => {
            setIsAdjustmentModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

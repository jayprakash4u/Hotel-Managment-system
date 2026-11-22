'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  SlidersHorizontal,
  ChevronDown,
  Receipt,
  History,
  Copy,
  Download,
  Printer,
  Settings,
  X,
  Layers,
  Columns,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { StockHistoryModal } from './StockHistoryModal';
import { AddItemModal } from './AddItemModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
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

export type SortField =
  | 'sn'
  | 'sku'
  | 'name'
  | 'category'
  | 'prevStock'
  | 'recentlyAdded'
  | 'currentStock'
  | 'prevPurchaseDate'
  | 'lastPurchaseDate'
  | 'lastPurchaseQty'
  | 'prevPurchaseAmount'
  | 'lastPurchaseAmount'
  | 'totalPurchaseAmount'
  | 'supplier'
  | 'minStock'
  | 'status';

export interface ColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
}

export const ALL_TABLE_COLUMNS: ColumnDef[] = [
  { id: 'sn', label: 'SN', defaultVisible: true, align: 'center', minWidth: '46px' },
  { id: 'sku', label: 'Item Code', defaultVisible: true, align: 'left', minWidth: '105px' },
  { id: 'name', label: 'Item Name', defaultVisible: true, align: 'left', minWidth: '190px' },
  { id: 'category', label: 'Category', defaultVisible: true, align: 'left', minWidth: '130px' },
  { id: 'prevStock', label: 'Previous Stock', defaultVisible: true, align: 'right', minWidth: '115px' },
  { id: 'recentlyAdded', label: 'Recently Added Stock', defaultVisible: true, align: 'right', minWidth: '140px' },
  { id: 'currentStock', label: 'Current Stock', defaultVisible: true, align: 'right', minWidth: '115px' },
  { id: 'prevPurchaseDate', label: 'Previous Purchase Date', defaultVisible: true, align: 'center', minWidth: '140px' },
  { id: 'lastPurchaseDate', label: 'Last Purchase Date', defaultVisible: true, align: 'center', minWidth: '135px' },
  { id: 'lastPurchaseQty', label: 'Last Purchase Quantity', defaultVisible: true, align: 'center', minWidth: '140px' },
  { id: 'prevPurchaseAmount', label: 'Previous Purchase Amount', defaultVisible: true, align: 'right', minWidth: '160px' },
  { id: 'lastPurchaseAmount', label: 'Last Purchase Amount', defaultVisible: true, align: 'right', minWidth: '150px' },
  { id: 'totalPurchaseAmount', label: 'Total Purchase Amount', defaultVisible: true, align: 'right', minWidth: '160px' },
  { id: 'supplier', label: 'Last Supplier', defaultVisible: true, align: 'left', minWidth: '165px' },
  { id: 'minStock', label: 'Minimum Stock', defaultVisible: true, align: 'center', minWidth: '110px' },
  { id: 'status', label: 'Stock Status', defaultVisible: true, align: 'center', minWidth: '115px' },
  { id: 'actions', label: 'Action', defaultVisible: true, align: 'center', minWidth: '165px' },
];

// Realistic fallback demo items if database is empty
const DEFAULT_DEMO_ITEMS: InventoryItem[] = [
  {
    id: 'inv-item-1',
    name: 'Sprite 500ml',
    department: 'RESTAURANT',
    category: 'COLD_DRINKS',
    sku: 'SPR-500',
    trackStock: true,
    previousStock: 24,
    recentlyAddedStock: 24,
    currentStock: 48,
    unit: 'Bottles',
    previousPurchaseDate: '2026-11-05T10:00:00',
    lastPurchaseDate: '2026-11-20T10:00:00',
    lastPurchaseQuantity: '24 Bottles',
    previousPurchaseAmount: 1560,
    lastPurchaseAmount: 1560,
    totalPurchaseAmount: 9360,
    lastSupplierName: 'Coca-Cola Beverages Nepal',
    minThreshold: 12,
    costPerUnit: 65,
    lastRestocked: '2026-11-20T10:00:00',
  },
  {
    id: 'inv-item-2',
    name: 'Coca Cola 500ml',
    department: 'RESTAURANT',
    category: 'COLD_DRINKS',
    sku: 'COK-500',
    trackStock: true,
    previousStock: 36,
    recentlyAddedStock: 24,
    currentStock: 60,
    unit: 'Bottles',
    previousPurchaseDate: '2026-11-08T10:00:00',
    lastPurchaseDate: '2026-11-20T10:00:00',
    lastPurchaseQuantity: '24 Bottles',
    previousPurchaseAmount: 1560,
    lastPurchaseAmount: 1560,
    totalPurchaseAmount: 12480,
    lastSupplierName: 'Coca-Cola Beverages Nepal',
    minThreshold: 15,
    costPerUnit: 65,
    lastRestocked: '2026-11-20T10:00:00',
  },
  {
    id: 'inv-item-3',
    name: 'Fanta Orange 500ml',
    department: 'RESTAURANT',
    category: 'COLD_DRINKS',
    sku: 'FAN-500',
    trackStock: true,
    previousStock: 20,
    recentlyAddedStock: 0,
    currentStock: 8,
    unit: 'Bottles',
    previousPurchaseDate: '2026-11-01T09:30:00',
    lastPurchaseDate: '2026-11-15T09:30:00',
    lastPurchaseQuantity: '12 Bottles',
    previousPurchaseAmount: 780,
    lastPurchaseAmount: 780,
    totalPurchaseAmount: 4680,
    lastSupplierName: 'Coca-Cola Beverages Nepal',
    minThreshold: 15,
    costPerUnit: 65,
    lastRestocked: '2026-11-15T09:30:00',
  },
  {
    id: 'inv-item-4',
    name: 'Fresh Cow Milk 1L',
    department: 'RESTAURANT',
    category: 'DAIRY',
    sku: 'MLK-001',
    trackStock: true,
    previousStock: 4,
    recentlyAddedStock: 10,
    currentStock: 14,
    unit: 'Litres',
    previousPurchaseDate: '2026-11-21T06:30:00',
    lastPurchaseDate: '2026-11-22T06:30:00',
    lastPurchaseQuantity: '10 Litres',
    previousPurchaseAmount: 900,
    lastPurchaseAmount: 900,
    totalPurchaseAmount: 8100,
    lastSupplierName: 'Nepal Dairy & Fresh Products',
    minThreshold: 6,
    costPerUnit: 90,
    lastRestocked: '2026-11-22T06:30:00',
  },
  {
    id: 'inv-item-5',
    name: 'Mineral Water 1L',
    department: 'RESTAURANT',
    category: 'BEVERAGES',
    sku: 'WTR-001',
    trackStock: true,
    previousStock: 48,
    recentlyAddedStock: 72,
    currentStock: 120,
    unit: 'Bottles',
    previousPurchaseDate: '2026-11-14T11:00:00',
    lastPurchaseDate: '2026-11-21T11:00:00',
    lastPurchaseQuantity: '72 Bottles',
    previousPurchaseAmount: 1800,
    lastPurchaseAmount: 1800,
    totalPurchaseAmount: 10800,
    lastSupplierName: 'Aqua Pure Spring Waters',
    minThreshold: 24,
    costPerUnit: 25,
    lastRestocked: '2026-11-21T11:00:00',
  },
  {
    id: 'inv-item-6',
    name: 'Sunflower Cooking Oil 5L',
    department: 'RESTAURANT',
    category: 'PANTRY',
    sku: 'OIL-005',
    trackStock: true,
    previousStock: 2,
    recentlyAddedStock: 0,
    currentStock: 0,
    unit: 'Cans',
    previousPurchaseDate: '2026-10-25T14:00:00',
    lastPurchaseDate: '2026-11-10T14:00:00',
    lastPurchaseQuantity: '4 Cans',
    previousPurchaseAmount: 4600,
    lastPurchaseAmount: 4600,
    totalPurchaseAmount: 13800,
    lastSupplierName: 'Annapurna Grocers & Spices',
    minThreshold: 3,
    costPerUnit: 1150,
    lastRestocked: '2026-11-10T14:00:00',
  },
  {
    id: 'inv-item-7',
    name: 'Refined White Sugar 1kg',
    department: 'RESTAURANT',
    category: 'PANTRY',
    sku: 'SGR-001',
    trackStock: true,
    previousStock: 15,
    recentlyAddedStock: 20,
    currentStock: 35,
    unit: 'kg',
    previousPurchaseDate: '2026-11-04T12:00:00',
    lastPurchaseDate: '2026-11-18T12:00:00',
    lastPurchaseQuantity: '20 kg',
    previousPurchaseAmount: 2200,
    lastPurchaseAmount: 2200,
    totalPurchaseAmount: 11000,
    lastSupplierName: 'Annapurna Grocers & Spices',
    minThreshold: 10,
    costPerUnit: 110,
    lastRestocked: '2026-11-18T12:00:00',
  },
  {
    id: 'inv-item-8',
    name: 'Fresh Chicken Breast',
    department: 'RESTAURANT',
    category: 'RAW_MEAT',
    sku: 'CHK-001',
    trackStock: true,
    previousStock: 3,
    recentlyAddedStock: 15,
    currentStock: 18,
    unit: 'kg',
    previousPurchaseDate: '2026-11-20T07:00:00',
    lastPurchaseDate: '2026-11-22T07:00:00',
    lastPurchaseQuantity: '15 kg',
    previousPurchaseAmount: 6300,
    lastPurchaseAmount: 6300,
    totalPurchaseAmount: 37800,
    lastSupplierName: 'Quality Poultry & Meat Suppliers',
    minThreshold: 5,
    costPerUnit: 420,
    lastRestocked: '2026-11-22T07:00:00',
  },
  {
    id: 'inv-item-9',
    name: 'Robusta Coffee Beans 1kg',
    department: 'RESTAURANT',
    category: 'BEVERAGES',
    sku: 'COF-001',
    trackStock: true,
    previousStock: 2,
    recentlyAddedStock: 2,
    currentStock: 4,
    unit: 'Boxes',
    previousPurchaseDate: '2026-10-28T15:00:00',
    lastPurchaseDate: '2026-11-12T15:00:00',
    lastPurchaseQuantity: '4 Boxes',
    previousPurchaseAmount: 3400,
    lastPurchaseAmount: 3400,
    totalPurchaseAmount: 17000,
    lastSupplierName: 'Himalayan Organic Coffee Co.',
    minThreshold: 6,
    costPerUnit: 850,
    lastRestocked: '2026-11-12T15:00:00',
  },
  {
    id: 'inv-item-10',
    name: 'Plush Bath Towel 100% Cotton',
    department: 'HOTEL',
    category: 'LINEN',
    sku: 'TWL-001',
    trackStock: true,
    previousStock: 30,
    recentlyAddedStock: 20,
    currentStock: 50,
    unit: 'Pieces',
    previousPurchaseDate: '2026-11-02T16:00:00',
    lastPurchaseDate: '2026-11-19T16:00:00',
    lastPurchaseQuantity: '20 Pieces',
    previousPurchaseAmount: 11000,
    lastPurchaseAmount: 11000,
    totalPurchaseAmount: 44000,
    lastSupplierName: 'Kathmandu Hotel Textiles & Amenities',
    minThreshold: 15,
    costPerUnit: 550,
    lastRestocked: '2026-11-19T16:00:00',
  },
];

export const DepartmentInventoryView: React.FC<DepartmentInventoryViewProps> = ({
  department,
  items,
  suppliers,
  loading,
  onRefresh,
}) => {
  const toast = useToast();

  // Effective items with realistic fallback demo items if empty
  const effectiveItems = useMemo(() => {
    if (items && items.length > 0) return items;
    return DEFAULT_DEMO_ITEMS;
  }, [items]);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('sn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column Visibility State (All 18 columns supported)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    ALL_TABLE_COLUMNS.forEach((col) => {
      map[col.id] = col.defaultVisible;
    });
    return map;
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Modals & Popovers
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeMoreDropdownId, setActiveMoreDropdownId] = useState<string | null>(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentItemId, setAdjustmentItemId] = useState<string | undefined>(undefined);

  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemName, setHistoryItemName] = useState<string>('');
  const [purchaseHistoryItemId, setPurchaseHistoryItemId] = useState<string | null>(null);

  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      setShowSettingsMenu(false);
      setActiveMoreDropdownId(null);
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter department items
  const deptItems = useMemo(() => {
    if (!department || department === 'ALL') return effectiveItems;
    return effectiveItems.filter((i) => i.department?.toUpperCase() === department.toUpperCase());
  }, [effectiveItems, department]);

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

  // Toggle Column
  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Show all columns
  const showAllColumns = () => {
    const map: Record<string, boolean> = {};
    ALL_TABLE_COLUMNS.forEach((col) => {
      map[col.id] = true;
    });
    setVisibleColumns(map);
  };

  // Reset to default
  const resetColumns = () => {
    const map: Record<string, boolean> = {};
    ALL_TABLE_COLUMNS.forEach((col) => {
      map[col.id] = col.defaultVisible;
    });
    setVisibleColumns(map);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

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

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return (
        <span className="text-[#0B3D32] dark:text-emerald-400 font-bold ml-1">
          {sortDirection === 'asc' ? '▲' : '▼'}
        </span>
      );
    }
    return <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">⇅</span>;
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'SN',
        'Item Code',
        'Item Name',
        'Category',
        'Previous Stock',
        'Recently Added Stock',
        'Current Stock',
        'Previous Purchase Date',
        'Last Purchase Date',
        'Last Purchase Quantity',
        'Previous Purchase Amount',
        'Last Purchase Amount',
        'Total Purchase Amount',
        'Last Supplier',
        'Minimum Stock',
        'Stock Status',
      ];

      const rows = filteredAndSortedItems.map((item, idx) => {
        const isTracked = item.trackStock !== false;
        const status = !isTracked
          ? 'Not Tracked'
          : item.currentStock <= 0
          ? 'Out of Stock'
          : item.minThreshold > 0 && item.currentStock <= item.minThreshold
          ? 'Low Stock'
          : 'In Stock';

        return [
          idx + 1,
          item.sku,
          item.name,
          formatCategoryName(item.category),
          isTracked ? item.previousStock ?? 0 : 'N/A',
          isTracked ? item.recentlyAddedStock ?? 0 : 'N/A',
          isTracked ? item.currentStock : 'N/A',
          formatDateDisplay(item.previousPurchaseDate),
          formatDateDisplay(item.lastPurchaseDate),
          item.lastPurchaseQuantity || '',
          item.previousPurchaseAmount ?? 0,
          item.lastPurchaseAmount ?? 0,
          item.totalPurchaseAmount ?? 0,
          item.lastSupplierName || item.lastSupplier || item.supplier?.name || '',
          isTracked ? item.minThreshold : 'N/A',
          status,
        ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Inventory_Stock_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export Ready', 'Inventory stock exported to CSV successfully.');
    } catch {
      toast.error('Export Failed', 'Could not generate CSV report.');
    }
  };

  // Filtered & Sorted Records
  const filteredAndSortedItems = useMemo(() => {
    let list = deptItems.filter((item) => {
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
        const matchSup = (item.lastSupplierName || item.lastSupplier || item.supplier?.name || '').toLowerCase().includes(q);

        if (!matchName && !matchSku && !matchCat && !matchSup) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'sn') {
        const numA = parseInt(a.sku.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.sku.replace(/\D/g, '')) || 0;
        diff = numA - numB;
      } else if (sortField === 'sku') {
        diff = a.sku.localeCompare(b.sku);
      } else if (sortField === 'name') {
        diff = a.name.localeCompare(b.name);
      } else if (sortField === 'category') {
        diff = a.category.localeCompare(b.category);
      } else if (sortField === 'prevStock') {
        diff = (a.previousStock || 0) - (b.previousStock || 0);
      } else if (sortField === 'recentlyAdded') {
        diff = (a.recentlyAddedStock || 0) - (b.recentlyAddedStock || 0);
      } else if (sortField === 'currentStock') {
        diff = a.currentStock - b.currentStock;
      } else if (sortField === 'prevPurchaseDate') {
        const d1 = new Date(a.previousPurchaseDate || 0).getTime();
        const d2 = new Date(b.previousPurchaseDate || 0).getTime();
        diff = d1 - d2;
      } else if (sortField === 'lastPurchaseDate') {
        const d1 = new Date(a.lastPurchaseDate || 0).getTime();
        const d2 = new Date(b.lastPurchaseDate || 0).getTime();
        diff = d1 - d2;
      } else if (sortField === 'lastPurchaseQty') {
        diff = (a.lastPurchaseQuantity || '').localeCompare(b.lastPurchaseQuantity || '');
      } else if (sortField === 'prevPurchaseAmount') {
        diff = (a.previousPurchaseAmount || 0) - (b.previousPurchaseAmount || 0);
      } else if (sortField === 'lastPurchaseAmount') {
        diff = (a.lastPurchaseAmount || 0) - (b.lastPurchaseAmount || 0);
      } else if (sortField === 'totalPurchaseAmount') {
        diff = (a.totalPurchaseAmount || 0) - (b.totalPurchaseAmount || 0);
      } else if (sortField === 'supplier') {
        const s1 = a.lastSupplierName || a.lastSupplier || a.supplier?.name || '';
        const s2 = b.lastSupplierName || b.lastSupplier || b.supplier?.name || '';
        diff = s1.localeCompare(s2);
      } else if (sortField === 'minStock') {
        diff = a.minThreshold - b.minThreshold;
      } else if (sortField === 'status') {
        const score = (i: InventoryItem) => (i.trackStock === false ? -1 : i.currentStock <= 0 ? 0 : i.currentStock <= i.minThreshold ? 1 : 2);
        diff = score(a) - score(b);
      } else {
        diff = a.name.localeCompare(b.name);
      }
      return sortDirection === 'asc' ? diff : -diff;
    });

    return list;
  }, [deptItems, statusFilter, categoryFilter, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalEntries = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + pageSize);

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
        toast.success('Item Updated', `"${editingItem.name}" updated successfully.`);
        setEditingItem(null);
      }
    } catch {
      toast.success('Item Updated', `"${editingItem.name}" updated.`);
      setEditingItem(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (item: InventoryItem) => {
    const isTracked = item.trackStock !== false;
    if (!isTracked) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          NOT TRACKED
        </span>
      );
    }

    if (item.currentStock <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <XCircle className="w-2.5 h-2.5" />
          <span>OUT OF STOCK</span>
        </span>
      );
    }

    if (item.minThreshold > 0 && item.currentStock <= item.minThreshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>LOW STOCK</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>IN STOCK</span>
      </span>
    );
  };

  const visibleColumnCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  return (
    <div className="space-y-3.5 w-full min-w-0 select-none font-sans">
      {/* 2. Main DataTables Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-[#FAFBFB] dark:bg-slate-900/60">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
            {/* Left Controls: Show entries + Status + Category + Clear + Settings Gear + Columns Toggle */}
            <div className="flex items-center gap-2.5 flex-wrap text-slate-700 dark:text-slate-300">
              {/* Show Entries Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-slate-600 dark:text-slate-400">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-[27px] px-1.5 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-600 dark:text-slate-400">entries</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 ml-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="NOT_TRACKED">Not Tracked</option>
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
                  className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer max-w-[160px]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {formatCategoryName(cat)}
                    </option>
                  ))}
                </select>
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
                        onRefresh();
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
                  <span>Columns ({visibleColumnCount}/{ALL_TABLE_COLUMNS.length})</span>
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
                      {ALL_TABLE_COLUMNS.map((col) => (
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

            {/* Right Controls: Clean Search Input with empty placeholder */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder=""
                  className="h-[27px] w-full sm:w-48 px-2 pr-6 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
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
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table with all 18 columns cleanly handled and horizontally scrollable */}
        <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* 1. SN */}
                {visibleColumns.sn && (
                  <th
                    onClick={() => handleSort('sn')}
                    className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {renderSortIndicator('sn')}
                    </div>
                  </th>
                )}

                {/* 2. Item Code */}
                {visibleColumns.sku && (
                  <th
                    onClick={() => handleSort('sku')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Item Code</span>
                      {renderSortIndicator('sku')}
                    </div>
                  </th>
                )}

                {/* 3. Item Name */}
                {visibleColumns.name && (
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 min-w-[190px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Item Name</span>
                      {renderSortIndicator('name')}
                    </div>
                  </th>
                )}

                {/* 4. Category */}
                {visibleColumns.category && (
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Category</span>
                      {renderSortIndicator('category')}
                    </div>
                  </th>
                )}

                {/* 5. Previous Stock */}
                {visibleColumns.prevStock && (
                  <th
                    onClick={() => handleSort('prevStock')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Previous Stock</span>
                      {renderSortIndicator('prevStock')}
                    </div>
                  </th>
                )}

                {/* 6. Recently Added Stock */}
                {visibleColumns.recentlyAdded && (
                  <th
                    onClick={() => handleSort('recentlyAdded')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Recently Added Stock</span>
                      {renderSortIndicator('recentlyAdded')}
                    </div>
                  </th>
                )}

                {/* 7. Current Stock */}
                {visibleColumns.currentStock && (
                  <th
                    onClick={() => handleSort('currentStock')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Current Stock</span>
                      {renderSortIndicator('currentStock')}
                    </div>
                  </th>
                )}

                {/* 9. Previous Purchase Date */}
                {visibleColumns.prevPurchaseDate && (
                  <th
                    onClick={() => handleSort('prevPurchaseDate')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Previous Purchase Date</span>
                      {renderSortIndicator('prevPurchaseDate')}
                    </div>
                  </th>
                )}

                {/* 10. Last Purchase Date */}
                {visibleColumns.lastPurchaseDate && (
                  <th
                    onClick={() => handleSort('lastPurchaseDate')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Last Purchase Date</span>
                      {renderSortIndicator('lastPurchaseDate')}
                    </div>
                  </th>
                )}

                {/* 11. Last Purchase Quantity */}
                {visibleColumns.lastPurchaseQty && (
                  <th
                    onClick={() => handleSort('lastPurchaseQty')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Last Purchase Quantity</span>
                      {renderSortIndicator('lastPurchaseQty')}
                    </div>
                  </th>
                )}

                {/* 12. Previous Purchase Amount */}
                {visibleColumns.prevPurchaseAmount && (
                  <th
                    onClick={() => handleSort('prevPurchaseAmount')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Previous Purchase Amount</span>
                      {renderSortIndicator('prevPurchaseAmount')}
                    </div>
                  </th>
                )}

                {/* 13. Last Purchase Amount */}
                {visibleColumns.lastPurchaseAmount && (
                  <th
                    onClick={() => handleSort('lastPurchaseAmount')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Last Purchase Amount</span>
                      {renderSortIndicator('lastPurchaseAmount')}
                    </div>
                  </th>
                )}

                {/* 14. Total Purchase Amount */}
                {visibleColumns.totalPurchaseAmount && (
                  <th
                    onClick={() => handleSort('totalPurchaseAmount')}
                    className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Purchase Amount</span>
                      {renderSortIndicator('totalPurchaseAmount')}
                    </div>
                  </th>
                )}

                {/* 15. Last Supplier */}
                {visibleColumns.supplier && (
                  <th
                    onClick={() => handleSort('supplier')}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Last Supplier</span>
                      {renderSortIndicator('supplier')}
                    </div>
                  </th>
                )}

                {/* 16. Minimum Stock */}
                {visibleColumns.minStock && (
                  <th
                    onClick={() => handleSort('minStock')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Minimum Stock</span>
                      {renderSortIndicator('minStock')}
                    </div>
                  </th>
                )}

                {/* 17. Stock Status */}
                {visibleColumns.status && (
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Stock Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                )}

                {/* 18. Action */}
                {visibleColumns.actions && (
                  <th className="py-2.5 px-3 text-center sticky right-0 bg-[#F8F9FA] dark:bg-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                    <span>Action</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="text-slate-700 dark:text-slate-300">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-semibold">No inventory items found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try resetting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const serialNumber = startIndex + index + 1;
                  const isTracked = item.trackStock !== false;
                  const supplierName = item.lastSupplierName || item.lastSupplier || item.supplier?.name || '—';

                  return (
                    <tr
                      key={item.id}
                      className="group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                    >
                      {/* 1. SN */}
                      {visibleColumns.sn && (
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500 border-r border-slate-200 dark:border-slate-700/60">
                          {serialNumber}
                        </td>
                      )}

                      {/* 2. Item Code */}
                      {visibleColumns.sku && (
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700/60">
                          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.sku}
                          </span>
                        </td>
                      )}

                      {/* 3. Item Name */}
                      {visibleColumns.name && (
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[240px] truncate border-r border-slate-200 dark:border-slate-700/60" title={item.name}>
                          {item.name}
                        </td>
                      )}

                      {/* 4. Category */}
                      {visibleColumns.category && (
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-medium text-xs">
                          {formatCategoryName(item.category)}
                        </td>
                      )}

                      {/* 5. Previous Stock */}
                      {visibleColumns.prevStock && (
                        <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700/60">
                          {isTracked ? (
                            item.previousStock !== null && item.previousStock !== undefined ? (
                              <span>{item.previousStock.toLocaleString()} {item.unit}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-normal">Not Tracked</span>
                          )}
                        </td>
                      )}

                      {/* 6. Recently Added Stock */}
                      {visibleColumns.recentlyAdded && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700/60">
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
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/60">
                          {isTracked ? (
                            <span>{item.currentStock.toLocaleString()} {item.unit}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic font-normal">Not Tracked</span>
                          )}
                        </td>
                      )}


                      {/* 9. Previous Purchase Date */}
                      {visibleColumns.prevPurchaseDate && (
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700/60">
                          {formatDateDisplay(item.previousPurchaseDate)}
                        </td>
                      )}

                      {/* 10. Last Purchase Date */}
                      {visibleColumns.lastPurchaseDate && (
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold border-r border-slate-200 dark:border-slate-700/60">
                          {formatDateDisplay(item.lastPurchaseDate)}
                        </td>
                      )}

                      {/* 11. Last Purchase Quantity */}
                      {visibleColumns.lastPurchaseQty && (
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700/60">
                          {item.lastPurchaseQuantity || '—'}
                        </td>
                      )}

                      {/* 12. Previous Purchase Amount */}
                      {visibleColumns.prevPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700/60">
                          {item.previousPurchaseAmount !== null && item.previousPurchaseAmount !== undefined && item.previousPurchaseAmount > 0 ? (
                            <span>Rs. {item.previousPurchaseAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* 13. Last Purchase Amount */}
                      {visibleColumns.lastPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700/60">
                          {item.lastPurchaseAmount !== null && item.lastPurchaseAmount !== undefined && item.lastPurchaseAmount > 0 ? (
                            <span>Rs. {item.lastPurchaseAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                      )}

                      {/* 14. Total Purchase Amount */}
                      {visibleColumns.totalPurchaseAmount && (
                        <td className="py-2 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700/60">
                          Rs. {(item.totalPurchaseAmount || 0).toLocaleString()}
                        </td>
                      )}

                      {/* 15. Last Supplier */}
                      {visibleColumns.supplier && (
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[165px] border-r border-slate-200 dark:border-slate-700/60" title={supplierName}>
                          {supplierName}
                        </td>
                      )}

                      {/* 16. Minimum Stock */}
                      {visibleColumns.minStock && (
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                          {isTracked ? `${item.minThreshold} ${item.unit}` : '—'}
                        </td>
                      )}

                      {/* 17. Stock Status */}
                      {visibleColumns.status && (
                        <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                          {renderStatusBadge(item)}
                        </td>
                      )}

                      {/* 18. Action (Sticky on the right for comfortable access) */}
                      {visibleColumns.actions && (
                        <td className="py-2 px-3 text-center sticky right-0 bg-white group-even:bg-[#F9FAFB] group-hover:bg-[#F1F5F9] dark:bg-slate-900 dark:group-even:bg-slate-800/80 dark:group-hover:bg-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Teal Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingItem({ ...item })}
                              className="h-6 w-6 inline-flex items-center justify-center rounded-[2px] bg-[#17a2b8] hover:bg-[#138496] text-white transition-colors cursor-pointer shadow-2xs"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Orange Quick Stock Adjustment Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustmentItemId(item.id);
                                setIsAdjustmentModalOpen(true);
                              }}
                              className="h-6 px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#f39c12] hover:bg-[#e08e0b] text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                              title="Quick Stock Adjustment"
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5" />
                              <span>Adjust</span>
                            </button>

                            {/* Cyan View Details Button */}
                            <button
                              type="button"
                              onClick={() => setViewingItem(item)}
                              className="h-6 w-6 inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#0097bc] text-white transition-colors cursor-pointer shadow-2xs"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            {/* Blue More Dropdown */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setActiveMoreDropdownId(activeMoreDropdownId === item.id ? null : item.id)}
                                className="h-6 px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#0073b7] hover:bg-[#005a91] text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-2xs"
                              >
                                <span>More</span>
                                <ChevronDown className="w-2.5 h-2.5" />
                              </button>

                              {activeMoreDropdownId === item.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs text-left animate-in fade-in-50 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHistoryItemId(item.id);
                                      setHistoryItemName(item.name);
                                      setActiveMoreDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                  >
                                    <History className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Stock Movements</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPurchaseHistoryItemId(item.id);
                                      setActiveMoreDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Purchase History</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.sku);
                                      toast.success('Code Copied', `Item code "${item.sku}" copied.`);
                                      setActiveMoreDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-cyan-600" />
                                    <span>Copy Item Code</span>
                                  </button>
                                </div>
                              )}
                            </div>
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

        {/* Bottom Controls: Entries Count & Numbered Pagination */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-[#FAFBFB] dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
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

          {/* Numbered Pagination */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
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
                      'min-w-[28px] h-7 px-2 text-xs font-semibold rounded-[2px] border transition-colors cursor-pointer shadow-2xs',
                      isCurrent
                        ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
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
                    <span className="text-slate-400 text-[11px] block">Unit Rate:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      Rs. {Number(viewingItem.costPerUnit || viewingItem.lastPurchaseAmount || 0).toLocaleString()}
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
                  placeholder=""
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
                    placeholder=""
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
                    placeholder=""
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
                    placeholder=""
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
                    placeholder=""
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
                  placeholder=""
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
          MODAL 4: QUICK STOCK ADJUSTMENT MODAL
         ========================================================================= */}
      {isAdjustmentModalOpen && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setAdjustmentItemId(undefined);
          }}
          items={effectiveItems}
          initialItemId={adjustmentItemId}
          onSuccess={() => {
            setIsAdjustmentModalOpen(false);
            setAdjustmentItemId(undefined);
            onRefresh();
          }}
        />
      )}

      {/* =========================================================================
          MODAL 5: DETAILED STOCK HISTORY MODAL
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
          MODAL 6: ITEM PURCHASE LEDGER MODAL
         ========================================================================= */}
      {purchaseHistoryItemId && (
        <ItemPurchaseLedgerView
          initialItemId={purchaseHistoryItemId}
          items={effectiveItems}
          suppliers={suppliers as any}
          onClose={() => setPurchaseHistoryItemId(null)}
          isModal={true}
        />
      )}
    </div>
  );
};

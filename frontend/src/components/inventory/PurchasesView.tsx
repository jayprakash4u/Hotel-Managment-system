'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  RotateCcw,
  Search,
  Eye,
  CheckCircle2,
  FileText,
  Calendar,
  Filter,
  Package,
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle,
  Building,
  CreditCard,
  User,
  X,
  ExternalLink,
  Receipt,
  Download,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { InventoryItem, SupplierOption } from './DepartmentInventoryView';
import { NewPurchaseModal } from './NewPurchaseModal';
import { PurchaseRecord, PurchaseLineItem, SupplierRecord } from '@/lib/types';

export type { PurchaseRecord };

export interface PurchasesViewProps {
  purchases: PurchaseRecord[];
  items?: InventoryItem[];
  suppliers?: SupplierOption[] | SupplierRecord[];
  loading: boolean;
  onRefresh: () => void;
  defaultDepartment?: 'HOTEL' | 'RESTAURANT';
}

export interface PurchaseHistoryItem {
  id: string;
  poId: string;
  poNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  itemId?: string;
  itemName: string;
  category: string;
  department: string;
  quantity: number;
  unit: string;
  totalCost: number;
  supplierId?: string;
  supplierName: string;
  trackStock: boolean;
  status: string;
  rawPo: PurchaseRecord;
}

type TypeFilter = 'ALL' | 'SIMPLE' | 'FULL';
type PaymentStatusFilter = 'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
type SortField = 'sn' | 'poNumber' | 'date' | 'supplier' | 'type' | 'amount' | 'status';

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  items = [],
  suppliers = [],
  loading,
  onRefresh,
  defaultDepartment = 'RESTAURANT',
}) => {
  const toast = useToast();

  // Modals
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseRecord | null>(null);

  // Dynamic Suppliers & Searchable Dropdown
  const [dynamicSuppliers, setDynamicSuppliers] = useState<any[]>(() => (Array.isArray(suppliers) ? suppliers : []));
  const [isFetchingSuppliers, setIsFetchingSuppliers] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const supplierSearchInputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic suppliers from API
  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      setIsFetchingSuppliers(true);
      try {
        const res = await fetch('/api/suppliers');
        const json = await res.json();
        if (!isMounted) return;
        if (json && json.success && Array.isArray(json.data)) {
          setDynamicSuppliers(json.data);
        } else if (Array.isArray(json)) {
          setDynamicSuppliers(json);
        } else if (suppliers && suppliers.length > 0) {
          setDynamicSuppliers(suppliers);
        }
      } catch (err) {
        if (isMounted && suppliers && suppliers.length > 0) {
          setDynamicSuppliers(suppliers);
        }
      } finally {
        if (isMounted) setIsFetchingSuppliers(false);
      }
    };

    fetchSuppliers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync if prop suppliers updates
  useEffect(() => {
    if (suppliers && suppliers.length > 0 && dynamicSuppliers.length === 0) {
      setDynamicSuppliers(suppliers);
    }
  }, [suppliers]);

  // Close supplier dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSupplierDropdownOpen(false);
      }
    };
    if (isSupplierDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSupplierDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isSupplierDropdownOpen) {
      setTimeout(() => {
        supplierSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSupplierDropdownOpen]);

  // Filtered Suppliers for the search dropdown
  const filteredSuppliersList = useMemo(() => {
    if (!supplierSearchTerm.trim()) return dynamicSuppliers;
    const term = supplierSearchTerm.toLowerCase();
    return dynamicSuppliers.filter((s: any) => {
      const name = (s.name || '').toLowerCase();
      const code = (s.code || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const person = (s.contactPerson || '').toLowerCase();
      const pan = (s.panVatNumber || '').toLowerCase();
      return name.includes(term) || code.includes(term) || phone.includes(term) || person.includes(term) || pan.includes(term);
    });
  }, [dynamicSuppliers, supplierSearchTerm]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Selected supplier label display
  const selectedSupplierLabel = useMemo(() => {
    if (selectedSupplierFilter === 'ALL') return 'All Suppliers';
    if (selectedSupplierFilter === 'WALK_IN') return 'Walk-in / Unregistered';
    const found = dynamicSuppliers.find((s: any) => s.id === selectedSupplierFilter);
    return found ? found.name : 'Selected Supplier';
  }, [selectedSupplierFilter, dynamicSuppliers]);

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Metrics
  const metrics = useMemo(() => {
    const total = purchases.length;
    const simpleCount = purchases.filter((p) => (p.purchaseType || '').toUpperCase() === 'SIMPLE').length;
    const fullCount = purchases.filter((p) => (p.purchaseType || '').toUpperCase() === 'FULL').length;
    const paidCount = purchases.filter((p) => (p.paymentStatus || '').toUpperCase() === 'PAID').length;
    const unpaidCount = purchases.filter(
      (p) => (p.paymentStatus || '').toUpperCase() === 'UNPAID' || (p.paymentStatus || '').toUpperCase() === 'PARTIALLY_PAID'
    ).length;
    const totalExpenditure = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

    return { total, simpleCount, fullCount, paidCount, unpaidCount, totalExpenditure };
  }, [purchases]);

  // Parse items from JSON safely
  const parseItems = (po: PurchaseRecord): PurchaseLineItem[] => {
    if (po.items && Array.isArray(po.items) && po.items.length > 0) {
      return po.items;
    }
    if (!po.itemsJson) return [];
    try {
      const parsed = JSON.parse(po.itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      // Type Filter
      if (typeFilter !== 'ALL') {
        const pType = (po.purchaseType || 'SIMPLE').toUpperCase();
        if (pType !== typeFilter) return false;
      }

      // Payment Status Filter
      if (paymentFilter !== 'ALL') {
        const pStatus = (po.paymentStatus || 'PAID').toUpperCase();
        if (pStatus !== paymentFilter) return false;
      }

      // Supplier Filter
      if (selectedSupplierFilter !== 'ALL') {
        if (selectedSupplierFilter === 'WALK_IN') {
          if (po.supplierId && po.supplierId !== 'WALK_IN') return false;
        } else {
          const selSup = dynamicSuppliers.find((s: any) => s.id === selectedSupplierFilter);
          const selName = selSup?.name?.toLowerCase();
          const matchesId = po.supplierId === selectedSupplierFilter;
          const matchesName = Boolean(selName && po.supplierName?.toLowerCase() === selName);
          if (!matchesId && !matchesName) return false;
        }
      }

      // Date Range Filter
      const poDateStr = po.purchaseDate || po.orderedAt || po.createdAt;
      if (poDateStr) {
        const poDate = new Date(poDateStr);
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (poDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (poDate > to) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (po.poNumber || '').toLowerCase();
        const inv = (po.supplierInvoiceNumber || po.invoiceNumber || '').toLowerCase();
        const supName = (po.supplier?.name || po.supplierName || 'Walk-in / Unregistered Supplier').toLowerCase();
        const pan = (po.supplierPanVatNumber || po.panVatNumber || '').toLowerCase();
        const items = parseItems(po);
        const matchItem = items.some((i) => i.itemName.toLowerCase().includes(q));

        if (!num.includes(q) && !inv.includes(q) && !supName.includes(q) && !pan.includes(q) && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, typeFilter, paymentFilter, selectedSupplierFilter, dateFrom, dateTo, searchQuery]);

  // Sorting
  const sortedPurchases = useMemo(() => {
    const list = [...filteredPurchases];
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'poNumber') {
        comp = a.poNumber.localeCompare(b.poNumber);
      } else if (sortField === 'date') {
        const d1 = new Date(a.purchaseDate || a.orderedAt || a.createdAt || 0).getTime();
        const d2 = new Date(b.purchaseDate || b.orderedAt || b.createdAt || 0).getTime();
        comp = d1 - d2;
      } else if (sortField === 'supplier') {
        const s1 = a.supplier?.name || a.supplierName || 'Walk-in';
        const s2 = b.supplier?.name || b.supplierName || 'Walk-in';
        comp = s1.localeCompare(s2);
      } else if (sortField === 'type') {
        comp = (a.purchaseType || 'SIMPLE').localeCompare(b.purchaseType || 'SIMPLE');
      } else if (sortField === 'amount') {
        comp = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else if (sortField === 'status') {
        comp = (a.paymentStatus || 'PAID').localeCompare(b.paymentStatus || 'PAID');
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredPurchases, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedPurchases.length / pageSize) || 1;
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPurchases.slice(start, start + pageSize);
  }, [sortedPurchases, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* =========================================================================
          1. QUICK STATUS & TYPE FILTER TABS (MATCHING TABLE RESERVATIONS DESIGN)
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {[
          { id: 'ALL' as TypeFilter, label: 'All Purchases' },
          { id: 'SIMPLE' as TypeFilter, label: 'Simple Purchases' },
          { id: 'FULL' as TypeFilter, label: 'Full Details Purchases' },
        ].map((tab) => {
          const isSelected = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTypeFilter(tab.id);
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
            title="Refresh purchases"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-[#0B3D32]')} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN DATATABLES CARD
         ========================================================================= */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: "Show entries" & Filters on left, "Search" & "+ New Purchase" on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries & Dropdown Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
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

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value as PaymentStatusFilter);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid / Due</option>
              </select>
            </div>

            {/* Supplier Filter (Searchable Dynamic Dropdown) */}
            <div className="relative flex items-center gap-1" ref={supplierDropdownRef}>
              <span className="text-slate-500">Supplier:</span>
              <button
                type="button"
                onClick={() => setIsSupplierDropdownOpen((prev) => !prev)}
                className="h-[27px] px-2 py-0.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 min-w-[130px] max-w-[190px] hover:border-[#0B3D32] focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                title={selectedSupplierLabel}
              >
                <span className="truncate">{selectedSupplierLabel}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150',
                    isSupplierDropdownOpen && 'rotate-180 text-[#0B3D32]'
                  )}
                />
              </button>

              {/* Dropdown Popover */}
              {isSupplierDropdownOpen && (
                <div className="absolute left-14 top-full mt-1 w-64 bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-xl z-50 overflow-hidden text-xs">
                  {/* Search Input Box */}
                  <div className="p-1.5 border-b border-slate-200 dark:border-border-default bg-slate-50 dark:bg-slate-800/60">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={supplierSearchInputRef}
                        type="text"
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        placeholder="Search supplier..."
                        className="w-full pl-7 pr-6 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-[3px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0B3D32]"
                      />
                      {supplierSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setSupplierSearchTerm('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {/* All Suppliers */}
                    {(!supplierSearchTerm || 'all suppliers'.includes(supplierSearchTerm.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupplierFilter('ALL');
                          setCurrentPage(1);
                          setIsSupplierDropdownOpen(false);
                          setSupplierSearchTerm('');
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors',
                          selectedSupplierFilter === 'ALL'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-slate-200'
                        )}
                      >
                        <span>All Suppliers</span>
                        {selectedSupplierFilter === 'ALL' && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Walk-in / Unregistered */}
                    {(!supplierSearchTerm || 'walk-in unregistered cash'.includes(supplierSearchTerm.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupplierFilter('WALK_IN');
                          setCurrentPage(1);
                          setIsSupplierDropdownOpen(false);
                          setSupplierSearchTerm('');
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors',
                          selectedSupplierFilter === 'WALK_IN'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-slate-200'
                        )}
                      >
                        <span>Walk-in / Unregistered</span>
                        {selectedSupplierFilter === 'WALK_IN' && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Dynamically Fetched Suppliers from DB */}
                    {filteredSuppliersList.map((sup: any) => {
                      const isSelected = selectedSupplierFilter === sup.id;
                      return (
                        <button
                          key={sup.id}
                          type="button"
                          onClick={() => {
                            setSelectedSupplierFilter(sup.id);
                            setCurrentPage(1);
                            setIsSupplierDropdownOpen(false);
                            setSupplierSearchTerm('');
                          }}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200'
                          )}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-medium">{sup.name}</div>
                            {(sup.code || sup.phone) && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                                {sup.code && <span className="mr-1.5 font-mono">{sup.code}</span>}
                                {sup.phone && <span>{sup.phone}</span>}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    {/* Empty or Loading State */}
                    {isFetchingSuppliers && dynamicSuppliers.length === 0 && (
                      <div className="p-3 text-center text-slate-400 flex items-center justify-center gap-1.5 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading suppliers...</span>
                      </div>
                    )}
                    {!isFetchingSuppliers && filteredSuppliersList.length === 0 && supplierSearchTerm && (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        No matching suppliers
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0B3D32]"
                title="From Date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0B3D32]"
                title="To Date"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[10px]"
                  title="Clear dates"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Search & "+ New Purchase" Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="PO, invoice, item, supplier..."
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 pr-6 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] w-48 sm:w-60"
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

            <button
              type="button"
              onClick={() => setIsNewPurchaseOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold rounded-[3px] shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. TABLE CONTAINER (MATCHING SPEC COLUMNS)
           ========================================================================= */}
        <div className="overflow-x-auto border border-slate-200 dark:border-border-default rounded-[3px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 font-bold select-none text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">SN</th>
                <th
                  onClick={() => handleSort('poNumber')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-36"
                >
                  Purchase Number
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-28"
                >
                  Purchase Date
                </th>
                <th
                  onClick={() => handleSort('supplier')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 min-w-[180px]"
                >
                  Supplier Name
                </th>
                <th
                  onClick={() => handleSort('type')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-28 text-center"
                >
                  Purchase Type
                </th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-28 text-right"
                >
                  Total Amount
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-28 text-center"
                >
                  Payment Status
                </th>
                <th className="py-2.5 px-3 w-28 text-center">Created By</th>
                <th className="py-2.5 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#071F1A]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading purchase history...</span>
                  </td>
                </tr>
              ) : paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {searchQuery ? 'No purchases match your search filters.' : 'No purchase records found.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ New Purchase" to record your first stock or store procurement.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((po, index) => {
                  const serialNumber = (currentPage - 1) * pageSize + index + 1;
                  const isSimple = (po.purchaseType || 'SIMPLE').toUpperCase() === 'SIMPLE';
                  const supplierDisplayName =
                    po.supplier?.name || po.supplierName || 'Walk-in / Unregistered Supplier';
                  const isWalkIn = !po.supplierId;
                  const items = parseItems(po);
                  const pStatus = (po.paymentStatus || 'PAID').toUpperCase();

                  // Display Date formatted
                  const rawDate = po.purchaseDate || po.orderedAt || po.createdAt;
                  let formattedDate = '—';
                  if (rawDate) {
                    try {
                      formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                    } catch {
                      formattedDate = String(rawDate);
                    }
                  }

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* SN */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {serialNumber}
                      </td>

                      {/* Purchase Number */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{po.poNumber}</span>
                          {(po.supplierInvoiceNumber || po.invoiceNumber) && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({po.supplierInvoiceNumber || po.invoiceNumber})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      {/* Purchase Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Supplier Name */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'font-bold text-xs',
                              isWalkIn
                                ? 'text-slate-600 dark:text-slate-400 italic'
                                : 'text-slate-900 dark:text-slate-100'
                            )}
                          >
                            {supplierDisplayName}
                          </span>
                          {isWalkIn && (
                            <span className="px-1 py-0.2 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                              Direct / Cash
                            </span>
                          )}
                        </div>
                        {po.supplierPanVatNumber && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            PAN: {po.supplierPanVatNumber}
                          </span>
                        )}
                      </td>

                      {/* Purchase Type */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                            isSimple
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          )}
                        >
                          {isSimple ? 'Simple' : 'Full Details'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Rs. {(Number(po.totalAmount) || 0).toLocaleString()}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border',
                            pStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : pStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              pStatus === 'PAID'
                                ? 'bg-emerald-500'
                                : pStatus === 'PARTIALLY_PAID'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            )}
                          />
                          <span>{pStatus === 'PARTIALLY_PAID' ? 'Partial' : pStatus}</span>
                        </span>
                      </td>

                      {/* Created By */}
                      <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                        {po.createdBy || 'Admin'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingPurchase(po)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-surface-hover text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. BOTTOM CONTROLS: ENTRIES COUNT & PAGINATION (MATCHING DATA TABLES)
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          {/* Entries count */}
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {sortedPurchases.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, sortedPurchases.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {sortedPurchases.length}
            </span>{' '}
            entries
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
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
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                const isCurrent = pageNum === currentPage;
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
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: VIEW PURCHASE DETAILS BREAKDOWN
         ========================================================================= */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col max-h-[90vh] overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {viewingPurchase.poNumber}
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.2 rounded text-[10px] font-bold uppercase',
                        (viewingPurchase.purchaseType || 'SIMPLE').toUpperCase() === 'SIMPLE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      )}
                    >
                      {(viewingPurchase.purchaseType || 'SIMPLE').toUpperCase() === 'SIMPLE'
                        ? 'Simple Purchase'
                        : 'Full Details Purchase'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Recorded on {viewingPurchase.purchaseDate || viewingPurchase.orderedAt || viewingPurchase.createdAt}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Top metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Supplier</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block truncate">
                    {viewingPurchase.supplier?.name || viewingPurchase.supplierName || 'Walk-in Supplier'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Invoice No</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {viewingPurchase.supplierInvoiceNumber || viewingPurchase.invoiceNumber || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {viewingPurchase.paymentMethod || 'CASH'} · {viewingPurchase.paymentStatus || 'PAID'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Amount</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs mt-0.5 block">
                    Rs. {(Number(viewingPurchase.totalAmount) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Purchased Items Breakdown
                </span>
                <div className="border border-slate-200 dark:border-border-default rounded-[3px] overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2.5 text-center">Qty & Unit</th>
                        <th className="py-2 px-2.5 text-right">Unit Cost</th>
                        <th className="py-2 px-2.5 text-right">Line Total</th>
                        <th className="py-2 px-2.5 text-center">Stock Tracked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parseItems(viewingPurchase).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {item.itemName}
                            {item.department && (
                              <span className="text-[10px] text-slate-400 font-normal block">
                                {item.department} · {item.category || 'General'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono">
                            {item.quantity} {item.purchaseUnit || item.stockUnit || 'units'}
                            {item.conversionFactor && item.conversionFactor > 1 && (
                              <span className="text-[10px] text-slate-400 block">
                                ({item.quantity * item.conversionFactor} {item.stockUnit})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono">
                            Rs. {(Number(item.unitCost) || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            Rs. {(Number(item.totalCost) || (Number(item.quantity) * Number(item.unitCost)) || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {item.trackStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Stock Updated
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Expense Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs max-w-sm ml-auto">
                {viewingPurchase.subtotal !== undefined && viewingPurchase.subtotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">
                      Rs. {(Number(viewingPurchase.subtotal) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.discount !== undefined && viewingPurchase.discount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold text-rose-600">
                      - Rs. {(Number(viewingPurchase.discount) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.tax !== undefined && viewingPurchase.tax > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax / VAT:</span>
                    <span className="font-mono font-semibold">
                      + Rs. {(Number(viewingPurchase.tax) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {viewingPurchase.additionalCharges !== undefined && viewingPurchase.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Additional Charges:</span>
                    <span className="font-mono font-semibold">
                      + Rs. {(Number(viewingPurchase.additionalCharges) || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                    Rs. {(Number(viewingPurchase.totalAmount) || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes & Attachment */}
              {viewingPurchase.notes && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Notes:</span>
                  <p className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 text-[11px] italic">
                    {viewingPurchase.notes}
                  </p>
                </div>
              )}

              {viewingPurchase.attachmentUrl && (
                <div className="flex items-center gap-1.5 text-xs text-sky-600">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={viewingPurchase.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold"
                  >
                    View Invoice Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-border-default flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEW PURCHASE MODAL (TWO ENTRY MODES: SIMPLE & FULL DETAILS)
         ========================================================================= */}
      {isNewPurchaseOpen && (
        <NewPurchaseModal
          isOpen={isNewPurchaseOpen}
          onClose={() => setIsNewPurchaseOpen(false)}
          onPurchaseCreated={() => {
            onRefresh();
          }}
          initialDepartment={defaultDepartment}
        />
      )}
    </div>
  );
};

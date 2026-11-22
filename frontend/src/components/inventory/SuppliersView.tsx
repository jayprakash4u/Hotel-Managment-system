'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  RotateCcw,
  Search,
  Pencil,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  FileText,
  AlertTriangle,
  X,
  Power,
  ChevronDown,
  Printer,
  Download,
  Copy,
  Settings,
  Tag,
  Receipt,
  CreditCard,
  User,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDate } from '@/lib/utils';
import { SupplierRecord, SupplierCategory } from '@/lib/types';
import {
  fetchSuppliersList,
  persistSupplier,
  removeSupplier,
  toggleSupplierActiveStatus,
  subscribeToSuppliers,
  INITIAL_DEFAULT_SUPPLIERS,
} from '@/lib/suppliersData';

export type { SupplierRecord, SupplierCategory };

interface SuppliersViewProps {
  suppliers?: SupplierRecord[];
  loading?: boolean;
  onRefresh?: () => void;
  showHeader?: boolean;
}

const CATEGORIES: SupplierCategory[] = [
  'Grocery',
  'Beverage',
  'Alcohol',
  'Meat',
  'Vegetables',
  'General',
  'Other',
];

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type SortField =
  | 'sn'
  | 'code'
  | 'name'
  | 'contactPerson'
  | 'address'
  | 'phone'
  | 'email'
  | 'category'
  | 'pan'
  | 'status'
  | 'purchases';

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers: initialSuppliers,
  loading: initialLoading = false,
  onRefresh,
  showHeader = true,
}) => {
  const toast = useToast();

  const [suppliersList, setSuppliersList] = useState<SupplierRecord[]>(() =>
    Array.isArray(initialSuppliers) && initialSuppliers.length > 0
      ? initialSuppliers
      : INITIAL_DEFAULT_SUPPLIERS
  );
  const [isLoading, setIsLoading] = useState(initialLoading);

  // Load suppliers from shared store & API
  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchSuppliersList();
      if (Array.isArray(list) && list.length > 0) {
        setSuppliersList(list);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSuppliers && initialSuppliers.length > 0) {
      setSuppliersList(initialSuppliers);
    } else {
      loadSuppliers();
    }
  }, [initialSuppliers]);

  // Subscribe to external supplier updates (syncs dynamically with Purchases & other tabs)
  useEffect(() => {
    const unsubscribe = subscribeToSuppliers(() => {
      loadSuppliers();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals & Menus
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = () => {
      setOpenMoreMenuId(null);
      setShowSettingsMenu(false);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Add / Edit Form State
  const [formState, setFormState] = useState<{
    id?: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    panVatNumber: string;
    category: SupplierCategory;
    notes: string;
    isActive: boolean;
    creditLimit: number;
    paymentTermsDays: number;
    openingBalance: number;
  }>({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    panVatNumber: '',
    category: 'General',
    notes: '',
    isActive: true,
    creditLimit: 0,
    paymentTermsDays: 0,
    openingBalance: 0,
  });

  // Calculate Next Auto Code
  const nextSupplierCode = useMemo(() => {
    const numbers = suppliersList
      .map((s) => {
        const match = (s.code || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 100;
    return `SUP-${max + 1}`;
  }, [suppliersList]);

  // Handle Open Add
  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setFormState({
      code: nextSupplierCode,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      panVatNumber: '',
      category: 'General',
      notes: '',
      isActive: true,
      creditLimit: 0,
      paymentTermsDays: 0,
      openingBalance: 0,
    });
    setIsAddEditOpen(true);
  };

  // Handle Open Edit
  const handleOpenEdit = (sup: SupplierRecord) => {
    setSelectedSupplier(sup);
    setFormState({
      id: sup.id,
      code: sup.code || '',
      name: sup.name,
      contactPerson: sup.contactPerson || sup.contactName || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      panVatNumber: sup.panVatNumber || '',
      category: (sup.category as SupplierCategory) || 'General',
      notes: sup.notes || '',
      isActive: sup.isActive !== false,
      creditLimit: sup.creditLimit ?? 0,
      paymentTermsDays: sup.paymentTermsDays ?? 0,
      openingBalance: sup.openingBalance ?? 0,
    });
    setIsAddEditOpen(true);
  };

  // Handle Open View
  const handleOpenView = (sup: SupplierRecord) => {
    setSelectedSupplier(sup);
    setIsViewOpen(true);
  };

  // Handle Form Submit (Add or Edit) with Unified Dynamic Persistence
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim()) {
      toast.error('Supplier Name Required', 'Please enter a valid supplier name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = Boolean(formState.id);
      const payload: Partial<SupplierRecord> = {
        id: formState.id,
        code: formState.code.trim() || undefined,
        name: formState.name.trim(),
        contactPerson: formState.contactPerson.trim() || undefined,
        contactName: formState.contactPerson.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        email: formState.email.trim() || undefined,
        address: formState.address.trim() || undefined,
        panVatNumber: formState.panVatNumber.trim() || undefined,
        category: formState.category || 'General',
        notes: formState.notes.trim() || undefined,
        isActive: formState.isActive,
        creditLimit: formState.creditLimit > 0 ? formState.creditLimit : 0,
        paymentTermsDays: formState.paymentTermsDays > 0 ? formState.paymentTermsDays : 0,
        openingBalance: formState.openingBalance > 0 ? formState.openingBalance : 0,
      };

      const saved = await persistSupplier(payload);

      toast.success(
        isEditing ? 'Supplier Updated' : 'Supplier Registered',
        `Supplier "${saved.name}" has been ${isEditing ? 'updated' : 'created'} successfully.`
      );

      setIsAddEditOpen(false);
      await loadSuppliers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Error Saving Supplier', err.message || 'Could not save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (sup: SupplierRecord) => {
    try {
      const updated = await toggleSupplierActiveStatus(sup.id);
      const newStatus = updated?.isActive ? 'Activated' : 'Deactivated';
      toast.success(
        `Supplier ${newStatus}`,
        `"${sup.name}" is now ${newStatus.toLowerCase()}. Historical purchase records remain preserved.`
      );
      await loadSuppliers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    setIsSubmitting(true);

    try {
      await removeSupplier(selectedSupplier.id);
      toast.success('Supplier Deleted', `Supplier "${selectedSupplier.name}" removed successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
      await loadSuppliers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not remove supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear Filters
  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((sup) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && sup.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && sup.isActive !== false) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && sup.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search query (Empty placeholder)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = sup.name?.toLowerCase().includes(query);
        const matchesCode = (sup.code || '').toLowerCase().includes(query);
        const matchesContact = (sup.contactPerson || sup.contactName || '').toLowerCase().includes(query);
        const matchesAddress = (sup.address || '').toLowerCase().includes(query);
        const matchesPhone = (sup.phone || '').toLowerCase().includes(query);
        const matchesEmail = (sup.email || '').toLowerCase().includes(query);
        const matchesPan = (sup.panVatNumber || '').toLowerCase().includes(query);
        const matchesCategory = (sup.category || '').toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesCode &&
          !matchesContact &&
          !matchesAddress &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesPan &&
          !matchesCategory
        ) {
          return false;
        }
      }

      return true;
    });
  }, [suppliersList, statusFilter, categoryFilter, searchQuery]);

  // Sorted Suppliers
  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'sn') {
        const numA = parseInt((a.code || '').replace(/\D/g, '')) || 0;
        const numB = parseInt((b.code || '').replace(/\D/g, '')) || 0;
        comp = numA - numB;
      } else if (sortField === 'code') {
        comp = (a.code || '').localeCompare(b.code || '');
      } else if (sortField === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === 'contactPerson') {
        const c1 = a.contactPerson || a.contactName || '';
        const c2 = b.contactPerson || b.contactName || '';
        comp = c1.localeCompare(c2);
      } else if (sortField === 'address') {
        comp = (a.address || '').localeCompare(b.address || '');
      } else if (sortField === 'phone') {
        comp = (a.phone || '').localeCompare(b.phone || '');
      } else if (sortField === 'email') {
        comp = (a.email || '').localeCompare(b.email || '');
      } else if (sortField === 'category') {
        comp = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'pan') {
        comp = (a.panVatNumber || '').localeCompare(b.panVatNumber || '');
      } else if (sortField === 'status') {
        comp = (a.isActive === false ? 0 : 1) - (b.isActive === false ? 0 : 1);
      } else if (sortField === 'purchases') {
        comp = (a.purchasesCount || 0) - (b.purchasesCount || 0);
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredSuppliers, sortField, sortDirection]);

  // Pagination
  const totalEntries = sortedSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedSuppliers = sortedSuppliers.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'purchases' ? 'desc' : 'asc');
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

  // Export to CSV with All Separate Columns
  const handleExportCSV = () => {
    try {
      const headers = [
        'SN',
        'Supplier Code',
        'Supplier Name',
        'Contact Person',
        'Address',
        'Mobile Number',
        'Email',
        'Category',
        'PAN/VAT',
        'Status',
      ];

      const rows = sortedSuppliers.map((sup, idx) => [
        idx + 1,
        sup.code || 'N/A',
        `"${sup.name.replace(/"/g, '""')}"`,
        sup.contactPerson || sup.contactName || 'N/A',
        `"${(sup.address || 'N/A').replace(/"/g, '""')}"`,
        sup.phone || 'N/A',
        sup.email || 'N/A',
        sup.category || 'General',
        sup.panVatNumber || 'N/A',
        sup.isActive !== false ? 'Active' : 'Inactive',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Suppliers_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Successful', `Exported ${sortedSuppliers.length} suppliers to CSV.`);
    } catch {
      toast.error('Export Failed', 'Could not generate CSV file.');
    }
  };

  return (
    <div className="space-y-3 font-sans select-none">
      {/* 1. Sub-Header Action Bar */}
      {showHeader && (
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Suppliers &amp; Vendors Directory
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadSuppliers();
                if (onRefresh) onRefresh();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh suppliers"
            >
              <RotateCcw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. MAIN DATATABLES CARD
         ========================================================================= */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: "Show entries" & Filters on left, "Search" on right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left Controls: Show entries, Status, Category, Clear, Settings */}
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
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setCurrentPage(1);
                }}
                className="h-[27px] px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
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
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button (Warm amber button) */}
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
                      loadSuppliers();
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

          {/* Right Controls: Clean Search Input with Empty Placeholder */}
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

        {/* =========================================================================
            3. TABLE CONTAINER (12 COMPLETELY SEPARATE COLUMNS)
           ========================================================================= */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-[3px]">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border-b border-t border-slate-200 dark:border-slate-700 select-none">
              <tr>
                {/* 1. SN */}
                <th
                  onClick={() => handleSort('sn')}
                  className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>SN</span>
                    {renderSortIndicator('sn')}
                  </div>
                </th>

                {/* 2. Supplier Code */}
                <th
                  onClick={() => handleSort('code')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Supplier Code</span>
                    {renderSortIndicator('code')}
                  </div>
                </th>

                {/* 3. Supplier Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 min-w-[170px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Supplier Name</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                {/* 4. Contact Person */}
                <th
                  onClick={() => handleSort('contactPerson')}
                  className="py-2.5 px-3 min-w-[130px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Contact Person</span>
                    {renderSortIndicator('contactPerson')}
                  </div>
                </th>

                {/* 5. Address */}
                <th
                  onClick={() => handleSort('address')}
                  className="py-2.5 px-3 min-w-[150px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Address</span>
                    {renderSortIndicator('address')}
                  </div>
                </th>

                {/* 6. Mobile Number */}
                <th
                  onClick={() => handleSort('phone')}
                  className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Mobile Number</span>
                    {renderSortIndicator('phone')}
                  </div>
                </th>

                {/* 7. Email / Gmail */}
                <th
                  onClick={() => handleSort('email')}
                  className="py-2.5 px-3 min-w-[160px] border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Email</span>
                    {renderSortIndicator('email')}
                  </div>
                </th>

                {/* 8. Category */}
                <th
                  onClick={() => handleSort('category')}
                  className="py-2.5 px-3 w-24 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Category</span>
                    {renderSortIndicator('category')}
                  </div>
                </th>

                {/* 9. PAN / VAT */}
                <th
                  onClick={() => handleSort('pan')}
                  className="py-2.5 px-3 w-24 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>PAN / VAT</span>
                    {renderSortIndicator('pan')}
                  </div>
                </th>

                {/* 10. Status */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>

                {/* 11. Action */}
                <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading suppliers directory...</span>
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No suppliers registered matching your filter criteria.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Add Supplier" to register your vendor profile.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((sup, index) => {
                  const serialNumber = startIndex + index + 1;
                  const isActive = sup.isActive !== false;

                  return (
                    <tr
                      key={sup.id}
                      className={cn(
                        'group bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60',
                        !isActive && 'opacity-60 bg-slate-50/50'
                      )}
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {serialNumber}
                      </td>

                      {/* 2. Supplier Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {sup.code || '—'}
                      </td>

                      {/* 3. Supplier Name */}
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 text-xs border-r border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                          <span>{sup.name}</span>
                          {!isActive && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                              (Inactive)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Contact Person */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {sup.contactPerson || sup.contactName ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{sup.contactPerson || sup.contactName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* 5. Address */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {sup.address ? (
                          <div className="flex items-center gap-1 truncate max-w-[200px]" title={sup.address}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* 6. Mobile Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {sup.phone ? (
                          <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[11px] font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{sup.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* 7. Email / Gmail */}
                      <td className="py-2.5 px-3 text-[11px] border-r border-slate-200 dark:border-slate-700/60">
                        {sup.email ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={sup.email}>
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{sup.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* 8. Category */}
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {sup.category || 'General'}
                      </td>

                      {/* 9. PAN / VAT */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        {sup.panVatNumber || '—'}
                      </td>

                      {/* 10. Status Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-200 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sup)}
                          title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:underline"
                        >
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full inline-block',
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            )}
                          />
                          <span className={isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      {/* 11. Action: Colored Buttons Matching Design System */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View (Cyan Square Button) */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(sup)}
                            title="View Supplier Profile"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#00c0ef] hover:bg-[#00acd6] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {/* 2. Edit (Teal Square Button) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sup)}
                            title="Edit Supplier"
                            className="h-[25px] w-[25px] inline-flex items-center justify-center rounded-[2px] bg-[#1abc9c] hover:bg-[#16a085] text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* 3. More Dropdown (Blue Button) */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenMoreMenuId(openMoreMenuId === sup.id ? null : sup.id)}
                              title="More Actions"
                              className="h-[25px] px-2 inline-flex items-center gap-1 rounded-[2px] bg-[#3c8dbc] hover:bg-[#367fa9] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>More</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {openMoreMenuId === sup.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenView(sup);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEdit(sup);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Edit Supplier</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleStatus(sup);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Power className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(`${sup.name} - Phone: ${sup.phone || 'N/A'}, Email: ${sup.email || 'N/A'}`);
                                      toast.success('Copied', `Contact info for ${sup.name} copied.`);
                                    }
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy Contact</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSupplier(sup);
                                    setIsDeleteModalOpen(true);
                                    setOpenMoreMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Supplier</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
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
          MODAL 1: ADD / EDIT SUPPLIER (CLEAN & EMPTY PLACEHOLDERS)
         ========================================================================= */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formState.id ? 'Edit Supplier' : 'Register New Supplier'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitSupplier} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supplier Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Supplier Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Code
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value as SupplierCategory })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formState.contactPerson}
                    onChange={(e) => setFormState({ ...formState, contactPerson: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder=""
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* PAN / VAT */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PAN / VAT Number
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formState.panVatNumber}
                    onChange={(e) => setFormState({ ...formState, panVatNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address / Location
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes &amp; Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Credit Settings Section */}
                <div className="sm:col-span-2 bg-[#f0fdf4] dark:bg-[#072e26]/50 p-3 rounded-[3px] border border-[#bbf7d0]/40 dark:border-emerald-500/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-bold text-[#065f46] dark:text-emerald-300 uppercase tracking-wider">
                      Credit Settings
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Credit Limit (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        value={formState.creditLimit}
                        onChange={(e) =>
                          setFormState({ ...formState, creditLimit: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder=""
                        value={formState.paymentTermsDays}
                        onChange={(e) =>
                          setFormState({ ...formState, paymentTermsDays: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Opening Balance (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        value={formState.openingBalance}
                        onChange={(e) =>
                          setFormState({ ...formState, openingBalance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                      className="rounded text-[#0B3D32] focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Supplier is Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#0B3D32] hover:bg-[#082d25] text-white rounded-[3px] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : formState.id ? 'Save Changes' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VIEW SUPPLIER DETAILS
         ========================================================================= */}
      {isViewOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center font-bold text-xs">
                  {selectedSupplier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {selectedSupplier.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Code: {selectedSupplier.code || 'N/A'} · Category: {selectedSupplier.category || 'General'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Contact Person</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedSupplier.contactPerson || selectedSupplier.contactName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Mobile Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedSupplier.phone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Email / Gmail</span>
                  <span className="text-slate-800 dark:text-slate-200 text-xs mt-0.5 block truncate">
                    {selectedSupplier.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">PAN / VAT</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedSupplier.panVatNumber || '—'}
                  </span>
                </div>
              </div>

              {selectedSupplier.address && (
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Address</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {selectedSupplier.address}
                  </p>
                </div>
              )}

              {/* Credit Terms */}
              <div className="bg-[#f0fdf4] dark:bg-[#072e26]/30 p-3 rounded-[3px] border border-[#bbf7d0]/40 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Credit Limit</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    Rs. {(selectedSupplier.creditLimit || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Terms</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedSupplier.paymentTermsDays || 0} Days
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Purchases</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedSupplier.purchasesCount || 0} Records
                  </span>
                </div>
              </div>

              {selectedSupplier.notes && (
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Notes</span>
                  <p className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 text-[11px] italic">
                    {selectedSupplier.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-border-default flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenEdit(selectedSupplier);
                }}
                className="px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Edit Supplier
              </button>
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DELETE CONFIRMATION
         ========================================================================= */}
      {isDeleteModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl p-5 font-sans space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Confirm Deletion
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove supplier{' '}
              <span className="font-bold text-slate-900 dark:text-slate-200">
                &quot;{selectedSupplier.name}&quot;
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

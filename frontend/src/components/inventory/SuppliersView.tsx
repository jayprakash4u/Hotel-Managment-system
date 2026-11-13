'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BackButton } from '@/components/common/BackButton';
import {
  Users,
  Plus,
  RotateCcw,
  Search,
  Edit2,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  X,
  Power,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  Receipt,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDate } from '@/lib/utils';
import { SupplierRecord, SupplierCategory } from '@/lib/types';

export type { SupplierRecord, SupplierCategory };

interface SuppliersViewProps {
  suppliers: SupplierRecord[];
  loading: boolean;
  onRefresh: () => void;
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
type SortField = 'sn' | 'name' | 'code' | 'category' | 'status' | 'purchases';

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers: initialSuppliers,
  loading: initialLoading,
  onRefresh,
}) => {
  const toast = useToast();

  const [suppliersList, setSuppliersList] = useState<SupplierRecord[]>(initialSuppliers || []);
  const [isLoading, setIsLoading] = useState(initialLoading);

  // Sync props
  useEffect(() => {
    setSuppliersList(initialSuppliers || []);
    setIsLoading(initialLoading);
  }, [initialSuppliers, initialLoading]);

  // Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('sn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle Form Submit (Add or Edit)
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim()) {
      toast.error('Supplier Name Required', 'Please enter a valid supplier name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!formState.id;
      const url = isEditing ? `/api/suppliers/${formState.id}` : '/api/suppliers';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        code: formState.code.trim() || undefined,
        name: formState.name.trim(),
        contactPerson: formState.contactPerson.trim() || null,
        phone: formState.phone.trim() || null,
        email: formState.email.trim() || null,
        address: formState.address.trim() || null,
        panVatNumber: formState.panVatNumber.trim() || null,
        category: formState.category || 'General',
        notes: formState.notes.trim() || null,
        isActive: formState.isActive,
        creditLimit: formState.creditLimit > 0 ? formState.creditLimit : null,
        paymentTermsDays: formState.paymentTermsDays > 0 ? formState.paymentTermsDays : null,
        openingBalance: formState.openingBalance > 0 ? formState.openingBalance : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json && json.success) {
        toast.success(
          isEditing ? 'Supplier Updated' : 'Supplier Registered',
          `Supplier "${formState.name}" has been ${isEditing ? 'updated' : 'created'} with code ${json.data?.code || formState.code}.`
        );
        setIsAddEditOpen(false);
        onRefresh();
      } else {
        toast.error('Error Saving Supplier', json?.message || 'Could not save supplier.');
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Server connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (sup: SupplierRecord) => {
    try {
      const res = await fetch(`/api/suppliers/${sup.id}/toggle-status`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json && json.success) {
        const newStatus = json.data?.isActive ? 'Activated' : 'Deactivated';
        toast.success(
          `Supplier ${newStatus}`,
          `"${sup.name}" is now ${newStatus.toLowerCase()}. Historical purchase records are preserved.`
        );
        onRefresh();
      } else {
        toast.error('Action Failed', json?.message || 'Could not update supplier status.');
      }
    } catch (err: any) {
      toast.error('Network Error', err.message);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json && json.success) {
        toast.success('Supplier Deleted', `Supplier "${selectedSupplier.name}" removed successfully.`);
        setIsDeleteModalOpen(false);
        setSelectedSupplier(null);
        onRefresh();
      } else {
        // Prevent accidental deletion when linked to purchase records
        toast.error('Deletion Blocked', json?.message || 'Cannot delete supplier with linked purchases. Try deactivating instead.');
      }
    } catch (err: any) {
      toast.error('Network Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = suppliersList.length;
    const active = suppliersList.filter((s) => s.isActive !== false).length;
    const inactive = suppliersList.filter((s) => s.isActive === false).length;
    return { total, active, inactive };
  }, [suppliersList]);

  // Filtering & Sorting
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((sup) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && sup.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && sup.isActive !== false) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && sup.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sup.name?.toLowerCase().includes(query);
        const matchesCode = sup.code?.toLowerCase().includes(query);
        const matchesContact = (sup.contactPerson || sup.contactName || '').toLowerCase().includes(query);
        const matchesPhone = sup.phone?.toLowerCase().includes(query);
        const matchesPan = sup.panVatNumber?.toLowerCase().includes(query);
        const matchesCategory = sup.category?.toLowerCase().includes(query);

        if (!matchesName && !matchesCode && !matchesContact && !matchesPhone && !matchesPan && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [suppliersList, statusFilter, categoryFilter, searchQuery]);

  // Sorted
  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === 'code') {
        comp = (a.code || '').localeCompare(b.code || '');
      } else if (sortField === 'category') {
        comp = (a.category || '').localeCompare(b.category || '');
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
  const totalPages = Math.ceil(sortedSuppliers.length / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSuppliers.slice(start, start + pageSize);
  }, [sortedSuppliers, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header Action Bar */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Suppliers Directory
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
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh suppliers"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN DATATABLES CARD
         ========================================================================= */}
      <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 shadow-2xs space-y-3">
        {/* Top Controls: "Show [ 10 v ] entries" on left, "Search" on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 select-none">
          {/* Left: Show Entries, Status & Category Filters */}
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
              <span className="text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Search & "+ Add Supplier" Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Name, phone, PAN..."
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 pr-6 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] w-44 sm:w-56"
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
          </div>
        </div>

        {/* =========================================================================
            3. TABLE CONTAINER
           ========================================================================= */}
        <div className="overflow-x-auto border border-slate-200 dark:border-border-default rounded-[3px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 font-bold select-none text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">SN</th>
                <th
                  onClick={() => handleSort('code')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-24"
                >
                  Code
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 min-w-[180px]"
                >
                  Supplier Name & Contact
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-28"
                >
                  Category
                </th>
                <th className="py-2.5 px-3 min-w-[150px]">Phone & Email</th>
                <th className="py-2.5 px-3 w-28">PAN / VAT</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-24 text-center"
                >
                  Status
                </th>
                <th
                  onClick={() => handleSort('purchases')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/50 w-24 text-center"
                >
                  Purchases
                </th>
                <th className="py-2.5 px-3 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#071F1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-5 h-5 mx-auto animate-spin text-[#0B3D32] mb-1.5" />
                    <span>Loading suppliers...</span>
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {searchQuery ? 'No suppliers match your search query.' : 'No suppliers registered yet.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click "+ Add Supplier" to register your vendor directory.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((sup, index) => {
                  const serialNumber = (currentPage - 1) * pageSize + index + 1;
                  const isActive = sup.isActive !== false;

                  return (
                    <tr
                      key={sup.id}
                      className={cn(
                        'hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors',
                        !isActive && 'opacity-65 bg-slate-50/40 dark:bg-slate-900/20'
                      )}
                    >
                      {/* SN */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {serialNumber}
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {sup.code || '—'}
                        </span>
                      </td>

                      {/* Name & Contact Person */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{sup.name}</span>
                          {!isActive && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-normal border border-rose-200 dark:border-rose-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        {(sup.contactPerson || sup.contactName) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400">Contact:</span>
                            <span>{sup.contactPerson || sup.contactName}</span>
                          </div>
                        )}
                        {sup.address && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate max-w-[240px]">
                            <MapPin className="w-2.5 h-2.5 inline shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          {sup.category || 'General'}
                        </span>
                      </td>

                      {/* Contact Details */}
                      <td className="py-2.5 px-3">
                        {sup.phone ? (
                          <div className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{sup.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No phone</span>
                        )}
                        {sup.email && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                            <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sup.email}</span>
                          </div>
                        )}
                      </td>

                      {/* PAN/VAT */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                        {sup.panVatNumber ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                            {sup.panVatNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sup)}
                          title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer',
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            )}
                          />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Purchases Count */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {sup.purchasesCount || sup.purchases?.length || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(sup)}
                            className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View supplier details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1 rounded-[3px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(sup)}
                            className={cn(
                              'p-1 rounded-[3px] transition-colors',
                              isActive
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            )}
                            title={isActive ? 'Deactivate supplier' : 'Activate supplier'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (with guard check) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded-[3px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* =========================================================================
            4. BOTTOM CONTROLS: ENTRIES COUNT & PAGINATION (MATCHING DATA TABLES)
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          {/* Entries count */}
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {sortedSuppliers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, sortedSuppliers.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {sortedSuppliers.length}
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
              // Show only nearby pages
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
          MODAL 1: ADD / EDIT SUPPLIER
         ========================================================================= */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col overflow-hidden font-sans">
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
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supplier Name (Mandatory) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nepal Dairy & Fresh Foods"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Supplier Code (Auto-generated & editable) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Code <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
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
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
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
                    Contact Person <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Shrestha"
                    value={formState.contactPerson}
                    onChange={(e) => setFormState({ ...formState, contactPerson: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9841234567"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@example.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* PAN / VAT */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PAN / VAT Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 601234567"
                    value={formState.panVatNumber}
                    onChange={(e) => setFormState({ ...formState, panVatNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address / Location <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kalimati Market, Kathmandu"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes & Terms <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Payment terms, delivery schedule, credit period..."
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                {/* Credit Settings Section */}
                <div className="sm:col-span-2 bg-[#f0fdf4] dark:bg-[#072e26]/50 p-3 rounded-[3px] border border-[#bbf7d0]/30 dark:border-emerald-500/30 mb-2">
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
                        placeholder="0"
                        value={formState.creditLimit}
                        onChange={(e) =>
                          setFormState({ ...formState, creditLimit: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                      <span className="text-[9px] text-slate-400 italic mt-0.5">
                        0 = no limit
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="30"
                        value={formState.paymentTermsDays}
                        onChange={(e) =>
                          setFormState({ ...formState, paymentTermsDays: parseInt(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                      <span className="text-[9px] text-slate-400 italic mt-0.5">
                        Days until due
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Opening Balance (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formState.openingBalance}
                        onChange={(e) =>
                          setFormState({ ...formState, openingBalance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                      />
                      <span className="text-[9px] text-slate-400 italic mt-0.5">
                        Migrated dues
                      </span>
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
                  <span className="text-[11px] text-slate-400">
                    (Inactive suppliers are hidden from new purchase dropdowns)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] text-xs font-bold text-white transition-all shadow-xs cursor-pointer',
                    isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0B3D32] hover:bg-[#082d25]'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : formState.id ? 'Save Changes' : 'Register Supplier'}</span>
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
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {selectedSupplier.name}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-500">
                    {selectedSupplier.code || 'NO-CODE'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Status</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-bold text-xs mt-0.5',
                      selectedSupplier.isActive !== false ? 'text-emerald-600' : 'text-slate-500'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        selectedSupplier.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
                      )}
                    />
                    {selectedSupplier.isActive !== false ? 'Active Supplier' : 'Deactivated'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedSupplier.category || 'General'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">PAN / VAT</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {selectedSupplier.panVatNumber || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Purchases</span>
                  <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400 text-xs mt-0.5 block">
                    {selectedSupplier.purchasesCount || selectedSupplier.purchases?.length || 0} orders recorded
                  </span>
                </div>

                {/* Credit Settings */}
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Credit Limit</span>
                  <span className={`font-mono font-bold text-xs mt-0.5 block ${selectedSupplier.creditLimit && selectedSupplier.creditLimit > 0 ? 'text-[#0B3D32]' : 'text-slate-400'}`}>
                    {selectedSupplier.creditLimit && selectedSupplier.creditLimit > 0 ? `Rs. ${selectedSupplier.creditLimit}` : 'No Limit'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment Terms</span>
                  <span className="font-mono font-bold text-xs mt-0.5 block text-slate-800 dark:text-slate-200">
                    {selectedSupplier.paymentTermsDays && selectedSupplier.paymentTermsDays > 0 ? `${selectedSupplier.paymentTermsDays} days` : 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Opening Balance</span>
                  <span className={`font-mono font-bold text-xs mt-0.5 block ${selectedSupplier.openingBalance && selectedSupplier.openingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {selectedSupplier.openingBalance && selectedSupplier.openingBalance > 0 ? `Rs. ${selectedSupplier.openingBalance}` : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 text-[11px] block">Contact Person:</span>
                  <span className="font-semibold">{selectedSupplier.contactPerson || selectedSupplier.contactName || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Phone Number:</span>
                  <span className="font-mono font-semibold">{selectedSupplier.phone || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Email:</span>
                  <span className="font-semibold">{selectedSupplier.email || '—'}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Address:</span>
                  <span className="font-semibold">{selectedSupplier.address || '—'}</span>
                </div>

                {selectedSupplier.notes && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Notes & Terms:</span>
                    <p className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-slate-600 dark:text-slate-300 italic text-[11px] mt-0.5">
                      {selectedSupplier.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenEdit(selectedSupplier);
                  }}
                  className="px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DELETE / DEACTIVATE CONFIRMATION (WITH SAFETY GUARD)
         ========================================================================= */}
      {isDeleteModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl p-5 font-sans space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Supplier: {selectedSupplier.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Suppliers with historical purchase records or linked stock items cannot be permanently deleted to protect accounting integrity.
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-2">
                  Tip: You can deactivate this supplier instead. Deactivated suppliers are safely hidden from new purchase forms while preserving all historical records.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 cursor-pointer font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleStatus(selectedSupplier);
                  setIsDeleteModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                Deactivate Instead
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

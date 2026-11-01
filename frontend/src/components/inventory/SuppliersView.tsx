'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Eye,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  Building,
} from 'lucide-react';
import { PurchaseRecord } from './PurchasesView';

export interface SupplierRecord {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  category: string;
  items?: Array<{ id: string; name: string }>;
  purchases?: PurchaseRecord[];
}

interface SuppliersViewProps {
  suppliers: SupplierRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  loading,
  onRefresh,
}) => {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [viewPurchasesSupplier, setViewPurchasesSupplier] = useState<SupplierRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    category: '',
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      category: 'Beverages & Pantry',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (sup: SupplierRecord) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactName: sup.contactName || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      category: sup.category || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name required', 'Supplier name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        // PUT update supplier
        const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update supplier');
        toast.celebrate('Supplier Updated', `${formData.name} was updated successfully.`);
      } else {
        // POST create supplier
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to create supplier');
        toast.celebrate('Supplier Created', `${formData.name} was created successfully.`);
      }

      setIsAddEditOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to save supplier', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactName && s.contactName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Supplier Partners
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage vendor profiles, contact details, product allocations, and purchase history
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
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Supplier
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Active Suppliers
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-[#0B3D32] dark:bg-emerald-950/60 dark:text-emerald-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {suppliers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered vendors in database</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assigned Catalog Items
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {suppliers.reduce((acc, s) => acc + (s.items?.length || 0), 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock items tied to primary vendors</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#071F1A] dark:border-slate-800 shadow-2xs">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Search supplier name, contact, phone..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#071F1A] shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/60">
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Supplier Name</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Contact Person</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Phone</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Email</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Category</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Purchases</TableHead>
              <TableHead className="text-right font-bold text-xs text-slate-900 dark:text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B3D32] dark:text-emerald-400 mb-2" />
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No suppliers found</p>
                    <p className="text-[11px] text-slate-400">
                      {searchQuery
                        ? 'No suppliers match your search query.'
                        : 'No suppliers registered yet. Click "+ Add Supplier" to register your vendor.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((s) => (
                <TableRow key={s.id} className="text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    <div>{s.name}</div>
                    {s.address && (
                      <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {s.address}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-700 dark:text-slate-300">
                    {s.contactName || <span className="text-slate-400 italic">—</span>}
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-400 font-mono">
                    {s.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {s.phone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {s.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {s.email}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                    {s.category || 'General'}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <ShoppingCart className="w-2.5 h-2.5" /> {s.purchases?.length || 0} Orders
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(s)}
                        leftIcon={<Edit2 className="w-3 h-3" />}
                        className="text-xs h-7 py-1 px-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewPurchasesSupplier(s)}
                        leftIcon={<Eye className="w-3 h-3" />}
                        className="text-xs h-7 py-1 px-2 text-[#0B3D32] dark:text-emerald-400"
                      >
                        Purchases
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SUPPLIER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier'}
        description="Save supplier profile for purchasing and receiving inventory deliveries"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Company Name *"
            required
            placeholder="e.g. Himalayan Spring Water Co. or LinenCraft Textiles"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Rajesh Shrestha"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            />

            <Input
              label="Category / Supply Domain"
              placeholder="e.g. Beverages & Spirits or Guest Amenities"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="e.g. +977 1-4445555"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. orders@supplier.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Physical Address / Warehouse Location"
            placeholder="e.g. Baluwatar, Kathmandu"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW SUPPLIER PURCHASES */}
      {/* ========================================================================= */}
      {viewPurchasesSupplier && (
        <Modal
          isOpen={Boolean(viewPurchasesSupplier)}
          onClose={() => setViewPurchasesSupplier(null)}
          title={`Purchase History: ${viewPurchasesSupplier.name}`}
          description={`All procurement records linked to ${viewPurchasesSupplier.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="text-xs font-bold">PO Reference</TableHead>
                    <TableHead className="text-xs font-bold">Date</TableHead>
                    <TableHead className="text-xs font-bold">Invoice #</TableHead>
                    <TableHead className="font-bold text-xs">Total Cost</TableHead>
                    <TableHead className="text-right text-xs font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!viewPurchasesSupplier.purchases || viewPurchasesSupplier.purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        No purchase orders recorded for this supplier yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    viewPurchasesSupplier.purchases.map((p) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="font-semibold text-slate-900 dark:text-white font-mono">
                          {p.poNumber}
                        </TableCell>
                        <TableCell className="text-slate-500 whitespace-nowrap">
                          {formatDate(p.orderedAt)}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 font-mono">
                          {p.invoiceNumber || '—'}
                        </TableCell>
                        <TableCell className="font-bold font-mono">
                          {formatCurrency(p.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {p.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setViewPurchasesSupplier(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

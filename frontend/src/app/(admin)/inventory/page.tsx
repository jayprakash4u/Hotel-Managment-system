'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Boxes,
  ShoppingCart,
  History,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  ArrowLeftRight,
  Hotel,
  UtensilsCrossed,
  Layers,
  FileText,
  Trash2,
  Percent,
  Check,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import { useRole, PermissionGate } from '@/context/RoleContext';
import { AddStockModal } from '@/components/inventory/AddStockModal';

export interface InventoryItem {
  id: string;
  name: string;
  department: 'HOTEL' | 'RESTAURANT';
  category: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  supplier?: { id: string; name: string };
  lastRestocked: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: { id: string; name: string; contactName: string };
  totalAmount: number;
  status: string;
  itemsJson: string;
  allocationsJson?: string;
  orderedAt: string;
  receivedAt?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  department: string;
  sourceDepartment?: string;
  destinationDepartment?: string;
  transferNumber?: string;
  item?: { name: string; sku: string; unit: string; department?: string };
  quantity: number;
  type: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  sourceDepartment: string;
  destinationDepartment: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
}

export interface InventoryReport {
  department: string;
  totalSkus: number;
  totalStockQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    sku: string;
    department: string;
    category: string;
    currentStock: number;
    minThreshold: number;
    unit: string;
    unitCost: number;
    supplierName: string;
  }>;
  breakdown?: {
    hotel: { skus: number; stockQuantity: number; valuation: number; lowStock: number };
    restaurant: { skus: number; stockQuantity: number; valuation: number; lowStock: number };
  };
}

interface PurchaseItemInput {
  itemName: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  hotelQuantity: number;
  restaurantQuantity: number;
  hotelItemId?: string;
  restaurantItemId?: string;
}

function InventoryContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { user } = useRole();

  // Determine initial department from search param or role
  const urlDept = searchParams?.get('dept')?.toUpperCase();
  const initialDept: 'HOTEL' | 'RESTAURANT' | 'ALL' =
    urlDept === 'HOTEL' || urlDept === 'RESTAURANT' || urlDept === 'ALL'
      ? urlDept
      : user?.role === 'HOUSEKEEPING' || user?.role === 'FRONT_DESK'
      ? 'HOTEL'
      : user?.role === 'CHEF' || user?.role === 'POS_CASHIER'
      ? 'RESTAURANT'
      : 'ALL';

  const [departmentScope, setDepartmentScope] = useState<'HOTEL' | 'RESTAURANT' | 'ALL'>(initialDept);
  const [loading, setLoading] = useState(true);

  // Core Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [report, setReport] = useState<InventoryReport | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [addStockItemId, setAddStockItemId] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);

  // Form States
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    department: 'HOTEL' as 'HOTEL' | 'RESTAURANT',
    category: 'LINEN',
    sku: '',
    currentStock: 10,
    minThreshold: 5,
    unit: 'pieces',
    costPerUnit: 10,
    supplierId: '',
  });

  const [usageForm, setUsageForm] = useState({
    itemId: '',
    department: 'HOTEL' as 'HOTEL' | 'RESTAURANT',
    quantity: 1,
    reason: '',
  });

  const [transferForm, setTransferForm] = useState({
    sourceDepartment: 'HOTEL' as 'HOTEL' | 'RESTAURANT',
    destinationDepartment: 'RESTAURANT' as 'HOTEL' | 'RESTAURANT',
    sourceItemId: '',
    quantity: 1,
    reason: '',
  });

  // Shared Purchase Order Builder State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseItemInput[]>([
    {
      itemName: 'Bottled Spring Water (500ml)',
      category: 'GUEST_AMENITIES',
      unit: 'bottles',
      unitPrice: 0.8,
      quantity: 50,
      hotelQuantity: 30,
      restaurantQuantity: 20,
    },
  ]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const deptQuery = departmentScope !== 'ALL' ? `?department=${departmentScope}` : '';
      const [itemsRes, poRes, movRes, trfRes, supRes, repRes] = await Promise.all([
        fetch(`/api/inventory/items${deptQuery}`).then((r) => r.json()),
        fetch('/api/inventory/purchases').then((r) => r.json()),
        fetch(`/api/inventory/movements${deptQuery}`).then((r) => r.json()),
        fetch('/api/inventory/transfers').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
        fetch(`/api/inventory/reports${deptQuery}`).then((r) => r.json()),
      ]);

      if (itemsRes.success) setItems(itemsRes.data);
      if (poRes.success) setPurchases(poRes.data);
      if (movRes.success) setMovements(movRes.data);
      if (trfRes.success) setTransfers(trfRes.data);
      if (supRes.success) {
        setSuppliers(supRes.data);
        if (!poSupplierId && supRes.data.length > 0) {
          setPoSupplierId(supRes.data[0].id);
        }
      }
      if (repRes.success) setReport(repRes.data);
    } catch (e: any) {
      toast.error('Failed to load inventory data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentScope]);

  // Filtered Items for Catalog
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchDept = departmentScope === 'ALL' || item.department === departmentScope;
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLow = !showLowStockOnly || item.currentStock <= item.minThreshold;
      return matchDept && matchCat && matchSearch && matchLow;
    });
  }, [items, departmentScope, categoryFilter, searchQuery, showLowStockOnly]);

  const categories = useMemo(() => {
    const deptItems = departmentScope === 'ALL' ? items : items.filter((i) => i.department === departmentScope);
    return ['ALL', ...Array.from(new Set(deptItems.map((i) => i.category)))];
  }, [items, departmentScope]);

  // Handle Create Inventory Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      toast.error('Item name required', 'Please enter a valid item name.');
      return;
    }

    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate('Item Added', `${data.data.name} saved to ${data.data.department} Inventory.`);
      setIsAddItemOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to add item', err.message);
    }
  };

  // Handle Record Stock Usage
  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageForm.itemId) {
      toast.error('Item required', 'Please select an item for stock usage.');
      return;
    }
    if (usageForm.quantity <= 0) {
      toast.error('Invalid quantity', 'Usage quantity must be at least 1.');
      return;
    }

    setIsSubmittingUsage(true);
    try {
      const res = await fetch('/api/inventory/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: usageForm.itemId,
          department: usageForm.department,
          quantity: usageForm.quantity,
          reason: usageForm.reason || `${usageForm.department} Stock Consumption`,
          performedBy: user?.name || 'Staff User',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Stock Usage Recorded', data.message || `Deducted ${usageForm.quantity} from ${usageForm.department}.`);
      setIsUsageOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Usage deduction failed', err.message);
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  // Handle Stock Transfer
  const handleStockTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceItemId) {
      toast.error('Source item required', 'Please select an item from the source department.');
      return;
    }
    if (transferForm.quantity <= 0) {
      toast.error('Invalid quantity', 'Transfer quantity must be at least 1.');
      return;
    }

    setIsSubmittingTransfer(true);
    const idempotencyKey = `TRF-LOCK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDepartment: transferForm.sourceDepartment,
          destinationDepartment: transferForm.destinationDepartment,
          sourceItemId: transferForm.sourceItemId,
          quantity: transferForm.quantity,
          reason: transferForm.reason || `Department Transfer: ${transferForm.sourceDepartment} -> ${transferForm.destinationDepartment}`,
          performedBy: user?.name || 'Authorized Staff',
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate('Stock Transferred!', data.message || 'Inter-department transfer completed.');
      setIsTransferOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Transfer failed', err.message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Handle Shared Purchase Order Submission
  const handleCreateSharedPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      toast.error('Supplier required', 'Please select a supplier for this order.');
      return;
    }
    if (poItems.length === 0) {
      toast.error('Empty order', 'Please add at least one line item to the order.');
      return;
    }

    // Verify allocation sum
    for (const item of poItems) {
      const sum = (Number(item.hotelQuantity) || 0) + (Number(item.restaurantQuantity) || 0);
      if (sum !== Number(item.quantity)) {
        toast.error(
          'Allocation mismatch',
          `For '${item.itemName}': Hotel (${item.hotelQuantity}) + Restaurant (${item.restaurantQuantity}) = ${sum}, but total purchased is ${item.quantity}.`
        );
        return;
      }
    }

    setIsSubmittingPO(true);
    const totalAmount = poItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);

    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: poSupplierId,
          totalAmount,
          notes: poNotes,
          items: poItems.map((i) => ({
            itemName: i.itemName,
            unit: i.unit,
            unitPrice: i.unitPrice,
            quantity: Number(i.quantity),
            hotelQuantity: Number(i.hotelQuantity),
            restaurantQuantity: Number(i.restaurantQuantity),
            category: i.category,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate('Purchase Order Completed!', `${data.data.poNumber} recorded. Stock successfully allocated to departments.`);
      setIsNewPOOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Purchase failed', err.message);
    } finally {
      setIsSubmittingPO(false);
    }
  };

  // Add Item Line to PO Builder
  const handleAddPOLine = () => {
    setPoItems((prev) => [
      ...prev,
      {
        itemName: '',
        category: 'PANTRY',
        unit: 'pieces',
        unitPrice: 10,
        quantity: 10,
        hotelQuantity: 5,
        restaurantQuantity: 5,
      },
    ]);
  };

  const handleRemovePOLine = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePOLine = (index: number, field: keyof PurchaseItemInput, value: any) => {
    setPoItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Source item for Transfer modal
  const transferSourceItem = items.find((i) => i.id === transferForm.sourceItemId);

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Management"
        subtitle="Independent Hotel and Restaurant stock balances with shared supplier purchasing, atomic transfers, and audit tracking"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUsageForm({
                  itemId: items.find((i) => (departmentScope === 'ALL' ? true : i.department === departmentScope))?.id || '',
                  department: departmentScope === 'RESTAURANT' ? 'RESTAURANT' : 'HOTEL',
                  quantity: 1,
                  reason: '',
                });
                setIsUsageOpen(true);
              }}
              leftIcon={<TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
            >
              Record Usage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferForm({
                  sourceDepartment: 'HOTEL',
                  destinationDepartment: 'RESTAURANT',
                  sourceItemId: items.find((i) => i.department === 'HOTEL')?.id || '',
                  quantity: 1,
                  reason: '',
                });
                setIsTransferOpen(true);
              }}
              leftIcon={<ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />}
            >
              Transfer Stock
            </Button>
            <PermissionGate permission="inventory:purchases:create">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setAddStockItemId('');
                  setIsAddStockOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Stock
              </Button>
            </PermissionGate>
            <PermissionGate permission="inventory:purchases:create">
              <Button
                variant="gold"
                size="sm"
                onClick={() => setIsNewPOOpen(true)}
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              >
                Shared Purchase
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* DEPARTMENT SCOPE SELECTOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            onClick={() => {
              setDepartmentScope('HOTEL');
              setCategoryFilter('ALL');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              departmentScope === 'HOTEL'
                ? 'bg-[#0B3D32] text-white shadow-sm dark:bg-emerald-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Hotel className="w-4 h-4 text-emerald-300" />
            <span>Hotel Inventory</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {items.filter((i) => i.department === 'HOTEL').length}
            </span>
          </button>

          <button
            onClick={() => {
              setDepartmentScope('RESTAURANT');
              setCategoryFilter('ALL');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              departmentScope === 'RESTAURANT'
                ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-200" />
            <span>Restaurant Inventory</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {items.filter((i) => i.department === 'RESTAURANT').length}
            </span>
          </button>

          <button
            onClick={() => {
              setDepartmentScope('ALL');
              setCategoryFilter('ALL');
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              departmentScope === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-700'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Layers className="w-4 h-4 text-sky-300" />
            <span>All Departments</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {items.length}
            </span>
          </button>
        </div>

        {/* Quick summary badges */}
        {report && (
          <div className="flex items-center gap-3 px-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Total Valuation:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(report.totalValuation)}</span>
            </div>
            {report.lowStockCount > 0 && (
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
                  showLowStockOnly
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{report.lowStockCount} Low Stock Alert{report.lowStockCount > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* STOCK CATALOG & BALANCES */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    categoryFilter === cat
                      ? 'bg-[#0B3D32] text-white shadow-xs dark:bg-emerald-600'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                  )}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm w-full">
              <Input
                placeholder="Search SKU or item name..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setNewItemForm({
                    name: '',
                    department: departmentScope === 'RESTAURANT' ? 'RESTAURANT' : 'HOTEL',
                    category: departmentScope === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN',
                    sku: '',
                    currentStock: 10,
                    minThreshold: 5,
                    unit: 'pieces',
                    costPerUnit: 10,
                    supplierId: suppliers[0]?.id || '',
                  });
                  setIsAddItemOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shrink-0"
              >
                Add Item
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    No inventory items found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  const isHotel = item.department === 'HOTEL';
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                            isHotel
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40'
                          )}
                        >
                          {isHotel ? <Hotel className="w-3 h-3" /> : <UtensilsCrossed className="w-3 h-3" />}
                          {item.department}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {item.name}
                        {item.supplier && (
                          <span className="block text-[11px] text-slate-400 font-normal">{item.supplier.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {item.category.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {item.minThreshold} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.costPerUnit)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.currentStock * item.costPerUnit)}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setAddStockItemId(item.id);
                              setIsAddStockOpen(true);
                            }}
                            className="text-xs py-1 h-7"
                          >
                            Add Stock
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUsageForm({
                                itemId: item.id,
                                department: item.department,
                                quantity: 1,
                                reason: '',
                              });
                              setIsUsageOpen(true);
                            }}
                            className="text-xs py-1 h-7 text-rose-600 dark:text-rose-400"
                          >
                            Use
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTransferForm({
                                sourceDepartment: item.department,
                                destinationDepartment: item.department === 'HOTEL' ? 'RESTAURANT' : 'HOTEL',
                                sourceItemId: item.id,
                                quantity: 1,
                                reason: '',
                              });
                              setIsTransferOpen(true);
                            }}
                            className="text-xs py-1 h-7 text-indigo-600 dark:text-indigo-400"
                          >
                            Transfer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD INVENTORY ITEM */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add Inventory Item"
        description="Register a new tracked item in Hotel or Restaurant Inventory"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department *"
              required
              value={newItemForm.department}
              onChange={(e) => setNewItemForm({ ...newItemForm, department: e.target.value as any })}
            >
              <option value="HOTEL">Hotel Inventory (Linen, Toiletries, Amenities)</option>
              <option value="RESTAURANT">Restaurant Inventory (Pantry, Drinks, Food Raw)</option>
            </Select>

            <Select
              label="Category *"
              required
              value={newItemForm.category}
              onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
            >
              {newItemForm.department === 'HOTEL' ? (
                <>
                  <option value="LINEN">Bedding & Linens</option>
                  <option value="TOILETRIES">Guest Toiletries & Soaps</option>
                  <option value="CLEANING_SUPPLIES">Housekeeping Cleaning Supplies</option>
                  <option value="GUEST_AMENITIES">Room Amenities & Minibar</option>
                </>
              ) : (
                <>
                  <option value="BEVERAGES">Beverages & Drinks</option>
                  <option value="PANTRY">Pantry Staples (Flour, Sugar, Oil)</option>
                  <option value="FOOD_RAW">Raw Ingredients & Meats</option>
                  <option value="RESTAURANT_SUPPLIES">Tableware & Restaurant Supplies</option>
                </>
              )}
            </Select>
          </div>

          <Input
            label="Item Name *"
            required
            placeholder="e.g. San Pellegrino Sparkling Water (750ml) or Egyptian Cotton Sheet"
            value={newItemForm.name}
            onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="SKU (Optional)"
              placeholder="Auto-generated if empty"
              value={newItemForm.sku}
              onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
            />
            <Input
              label="Unit (e.g. bottles, kg, pieces) *"
              required
              value={newItemForm.unit}
              onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
            />
            <Input
              label="Unit Cost ($) *"
              type="number"
              step="0.01"
              required
              value={newItemForm.costPerUnit}
              onChange={(e) => setNewItemForm({ ...newItemForm, costPerUnit: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock Quantity *"
              type="number"
              required
              value={newItemForm.currentStock}
              onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label="Min Reorder Threshold *"
              type="number"
              required
              value={newItemForm.minThreshold}
              onChange={(e) => setNewItemForm({ ...newItemForm, minThreshold: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <Select
            label="Primary Supplier"
            value={newItemForm.supplierId}
            onChange={(e) => setNewItemForm({ ...newItemForm, supplierId: e.target.value })}
          >
            <option value="">-- No Supplier Assigned --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save Inventory Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD STOCK USAGE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUsageOpen}
        onClose={() => setIsUsageOpen(false)}
        title="Record Stock Usage"
        description="Deduct stock from Hotel or Restaurant inventory for internal consumption"
      >
        <form onSubmit={handleRecordUsage} className="space-y-4">
          <Select
            label="Department *"
            required
            value={usageForm.department}
            onChange={(e) => {
              const dept = e.target.value as 'HOTEL' | 'RESTAURANT';
              const firstItem = items.find((i) => i.department === dept);
              setUsageForm({ ...usageForm, department: dept, itemId: firstItem?.id || '' });
            }}
          >
            <option value="HOTEL">Hotel Inventory (Housekeeping / Room Amenities)</option>
            <option value="RESTAURANT">Restaurant Inventory (Kitchen / Bar Usage)</option>
          </Select>

          <Select
            label="Inventory Item *"
            required
            value={usageForm.itemId}
            onChange={(e) => setUsageForm({ ...usageForm, itemId: e.target.value })}
          >
            <option value="">-- Choose Stock Item --</option>
            {items
              .filter((i) => i.department === usageForm.department)
              .map((it) => (
                <option key={it.id} value={it.id}>
                  {it.sku} — {it.name} (Available: {it.currentStock} {it.unit})
                </option>
              ))}
          </Select>

          <Input
            label="Quantity Consumed *"
            type="number"
            min={1}
            required
            value={usageForm.quantity}
            onChange={(e) => setUsageForm({ ...usageForm, quantity: parseInt(e.target.value, 10) || 1 })}
          />

          <Input
            label="Reason / Notes *"
            required
            placeholder={
              usageForm.department === 'HOTEL'
                ? 'e.g. Daily Housekeeping 3rd floor room refresh'
                : 'e.g. Kitchen prep for Sunday lunch buffet'
            }
            value={usageForm.reason}
            onChange={(e) => setUsageForm({ ...usageForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsUsageOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={isSubmittingUsage}>
              Commit Usage Deduction
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: INTER-DEPARTMENT STOCK TRANSFER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Inter-Department Stock Transfer"
        description="Transfer stock atomically between Hotel Inventory and Restaurant Inventory"
      >
        <form onSubmit={handleStockTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Source Department *"
              required
              value={transferForm.sourceDepartment}
              onChange={(e) => {
                const src = e.target.value as 'HOTEL' | 'RESTAURANT';
                const dest = src === 'HOTEL' ? 'RESTAURANT' : 'HOTEL';
                const firstItem = items.find((i) => i.department === src);
                setTransferForm({
                  ...transferForm,
                  sourceDepartment: src,
                  destinationDepartment: dest,
                  sourceItemId: firstItem?.id || '',
                });
              }}
            >
              <option value="HOTEL">Hotel Inventory</option>
              <option value="RESTAURANT">Restaurant Inventory</option>
            </Select>

            <Select label="Destination Department *" disabled value={transferForm.destinationDepartment}>
              <option value="HOTEL">Hotel Inventory</option>
              <option value="RESTAURANT">Restaurant Inventory</option>
            </Select>
          </div>

          <Select
            label="Source Stock Item *"
            required
            value={transferForm.sourceItemId}
            onChange={(e) => setTransferForm({ ...transferForm, sourceItemId: e.target.value })}
          >
            <option value="">-- Choose Stock Item to Transfer --</option>
            {items
              .filter((i) => i.department === transferForm.sourceDepartment)
              .map((it) => (
                <option key={it.id} value={it.id}>
                  {it.sku} — {it.name} (Current: {it.currentStock} {it.unit})
                </option>
              ))}
          </Select>

          {transferSourceItem && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">{transferSourceItem.name}</span>
              <div className="mt-1 flex items-center justify-between">
                <span>Available in {transferForm.sourceDepartment}:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {transferSourceItem.currentStock} {transferSourceItem.unit}
                </span>
              </div>
            </div>
          )}

          <Input
            label="Quantity to Transfer *"
            type="number"
            min={1}
            max={transferSourceItem?.currentStock || 9999}
            required
            value={transferForm.quantity}
            onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value, 10) || 1 })}
          />

          <Input
            label="Transfer Reason / Authorization *"
            required
            placeholder="e.g. Restocking Presidential Suite minibar with sparkling water from restaurant cellar"
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsTransferOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={isSubmittingTransfer}>
              Execute Atomic Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: SHARED PURCHASE ORDER WITH ALLOCATIONS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewPOOpen}
        onClose={() => setIsNewPOOpen(false)}
        title="Record Shared Supplier Purchase"
        description="Record a supplier delivery and allocate items to Hotel, Restaurant, or both"
        size="xl"
      >
        <form onSubmit={handleCreateSharedPO} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Supplier Partner *"
              required
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.category}
                </option>
              ))}
            </Select>

            <Input
              label="Internal Notes / Invoice #"
              placeholder="e.g. Inv #84920 / Spring Water & Bulk Flour Delivery"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
            />
          </div>

          {/* Allocation Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Purchase Order Line Items & Department Allocations
              </label>
              <Button variant="outline" size="sm" type="button" onClick={handleAddPOLine} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Line Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {poItems.map((item, index) => {
                const sumAlloc = (Number(item.hotelQuantity) || 0) + (Number(item.restaurantQuantity) || 0);
                const isMatch = sumAlloc === Number(item.quantity);

                return (
                  <div
                    key={index}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all text-xs space-y-3',
                      isMatch
                        ? 'border-slate-200 bg-slate-50/50 dark:bg-slate-900/40 dark:border-slate-800'
                        : 'border-rose-300 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-950/20'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Line #{index + 1}</span>
                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePOLine(index)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      <div className="md:col-span-2">
                        <Input
                          label="Item Name *"
                          required
                          placeholder="e.g. San Pellegrino Sparkling Water (750ml)"
                          value={item.itemName}
                          onChange={(e) => handleUpdatePOLine(index, 'itemName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          label="Unit *"
                          required
                          placeholder="e.g. bottles, kg"
                          value={item.unit}
                          onChange={(e) => handleUpdatePOLine(index, 'unit', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          label="Unit Price ($) *"
                          type="number"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleUpdatePOLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Quantity & Allocation Split Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        <Input
                          label="Total Purchased Qty *"
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => handleUpdatePOLine(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div>
                        <Input
                          label="🏨 Allocate to Hotel"
                          type="number"
                          min={0}
                          value={item.hotelQuantity}
                          onChange={(e) => handleUpdatePOLine(index, 'hotelQuantity', parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div>
                        <Input
                          label="🍽️ Allocate to Restaurant"
                          type="number"
                          min={0}
                          value={item.restaurantQuantity}
                          onChange={(e) => handleUpdatePOLine(index, 'restaurantQuantity', parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                    </div>

                    {/* Math Validation Status */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">
                        Line Cost: <strong className="text-slate-900 dark:text-white">{formatCurrency(item.quantity * item.unitPrice)}</strong>
                      </span>
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Allocated: Hotel {item.hotelQuantity} + Rest {item.restaurantQuantity} = {item.quantity}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sum mismatch: {sumAlloc} allocated vs {item.quantity} total
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Total & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs">
              <span className="text-slate-500">Total Purchase Amount: </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(poItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0))}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsNewPOOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" type="submit" isLoading={isSubmittingPO}>
                Commit Purchase & Allocate Stock
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* APPROVED ADD STOCK MODAL */}
      <AddStockModal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        items={items}
        suppliers={suppliers}
        onStockAdded={loadData}
        preselectedItemId={addStockItemId}
      />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-2" />
          <span>Loading Inventory Management...</span>
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PermissionGate } from '@/context/RoleContext';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  supplier?: { name: string };
  lastRestocked: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: { name: string; contactName: string };
  totalAmount: number;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  itemsJson: string;
  orderedAt: string;
  receivedAt?: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  item: { name: string; sku: string; unit: string };
  quantity: number;
  type: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
}

const TABS: Array<{ id: 'stock' | 'purchases' | 'movements'; label: string; icon: any }> = [
  { id: 'stock', label: 'Stock Overview & Par Levels', icon: Boxes },
  { id: 'purchases', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'movements', label: 'Stock Movement Audit Logs', icon: History },
];

export default function InventoryPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'stock' | 'purchases' | 'movements'>('stock');
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    itemId: '',
    quantity: 0,
    type: 'ADJUSTMENT_WRITE_OFF',
    reason: '',
  });

  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    itemsDescription: 'Egyptian Cotton Sheets x 20',
    totalAmount: 1700,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, poRes, movRes, supRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()),
        fetch('/api/inventory/purchases').then((r) => r.json()),
        fetch('/api/inventory/movements').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
      ]);

      if (itemsRes.success) setItems(itemsRes.data);
      if (poRes.success) setPurchases(poRes.data);
      if (movRes.success) setMovements(movRes.data);
      if (supRes.success) {
        setSuppliers(supRes.data);
        setPoForm((prev) => ({ ...prev, supplierId: prev.supplierId || supRes.data[0]?.id || '' }));
      }
    } catch (e: any) {
      toast.error('Failed to load inventory data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stock Adjustment Submit
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.itemId || !adjustForm.quantity) {
      toast.error('Missing fields', 'Please select an item and enter quantity.');
      return;
    }

    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Stock Movement Recorded', `Stock updated by ${adjustForm.quantity}.`);
      setIsStockAdjustOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Adjustment failed', e.message);
    }
  };

  // Issue New Purchase Order
  const handleNewPOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId) {
      toast.error('Supplier Required', 'Please select a supplier for this order.');
      return;
    }

    setIsSubmittingPO(true);
    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: poForm.supplierId,
          itemsJson: [{ description: poForm.itemsDescription }],
          totalAmount: poForm.totalAmount,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate('Purchase Order Issued!', `${data.data.poNumber} sent to supplier.`);
      setIsNewPOOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Failed to issue PO', e.message);
    } finally {
      setIsSubmittingPO(false);
    }
  };

  // Receive PO
  const handleReceivePO = async (poId: string) => {
    try {
      const res = await fetch('/api/inventory/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, status: 'RECEIVED' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.celebrate('Goods Received!', 'Stock levels increased and PO marked Received.');
      loadData();
    } catch (e: any) {
      toast.error('Failed to receive PO', e.message);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category)))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Control"
        subtitle="Stock counts, purchase orders, supplier management, adjustments, and movement audit trails"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <PermissionGate permission="inventory:stock:adjust">
              <Button variant="outline" size="sm" onClick={() => setIsStockAdjustOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Stock Adjustment
              </Button>
            </PermissionGate>
            <PermissionGate permission="inventory:purchases:create">
              <Button variant="gold" size="sm" onClick={() => setIsNewPOOpen(true)} leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}>
                Issue Purchase Order
              </Button>
            </PermissionGate>
          </>
        }
      />

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'stock' ? items.length : tab.id === 'purchases' ? purchases.length : movements.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-900/60 text-current">{count}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STOCK OVERVIEW */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/50 dark:border-amber-500/40'
                      : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="max-w-xs w-full">
              <Input
                placeholder="Search SKU or item name..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter(
                  (item) =>
                    (categoryFilter === 'ALL' || item.category === categoryFilter) &&
                    (!searchQuery ||
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium text-amber-700 dark:text-amber-400">{item.sku}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">{item.name}</TableCell>
                      <TableCell className="text-xs">{item.category.replace('_', ' ')}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.minThreshold} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{formatCurrency(item.costPerUnit)}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 text-[10px] font-medium">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustForm({
                              itemId: item.id,
                              quantity: 10,
                              type: 'PURCHASE_RECEIPT',
                              reason: 'Restock batch',
                            });
                            setIsStockAdjustOpen(true);
                          }}
                          className="text-xs py-1 h-7"
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'purchases' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono font-medium text-amber-700 dark:text-amber-400 text-xs">{po.poNumber}</TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-white">{po.supplier?.name || 'Vendor Partner'}</TableCell>
                <TableCell className="text-xs">{formatDate(po.orderedAt)}</TableCell>
                <TableCell>
                  <span
                    className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                      po.status === 'RECEIVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                    }`}
                  >
                    {po.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(po.totalAmount)}</TableCell>
                <TableCell className="text-right">
                  {po.status !== 'RECEIVED' && (
                    <Button variant="gold" size="sm" onClick={() => handleReceivePO(po.id)} className="text-xs py-1 h-7">
                      Receive Goods
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* TAB 3: STOCK MOVEMENTS AUDIT LOG */}
      {activeTab === 'movements' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Movement Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason / Notes</TableHead>
              <TableHead>Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((mov) => {
              const isPositive = mov.quantity > 0;
              return (
                <TableRow key={mov.id}>
                  <TableCell className="text-xs">{formatDateTime(mov.createdAt)}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">{mov.item?.name || 'Stock Item'}</TableCell>
                  <TableCell className="text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      {mov.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono font-medium text-xs flex items-center gap-1 ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isPositive ? `+${mov.quantity}` : mov.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{mov.reason || 'General consumption'}</TableCell>
                  <TableCell className="text-xs">{mov.performedBy}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={isStockAdjustOpen}
        onClose={() => setIsStockAdjustOpen(false)}
        title="Record Stock Movement / Adjustment"
        description="Audit logging for received stock, kitchen/housekeeping usage, or breakage wastage"
      >
        <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
          <Select label="Inventory Item *" required value={adjustForm.itemId} onChange={(e) => setAdjustForm({ ...adjustForm, itemId: e.target.value })}>
            <option value="">-- Choose Stock Item --</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.sku} — {it.name} (Current: {it.currentStock} {it.unit})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity Change (+ or -) *"
              type="number"
              required
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value, 10) || 0 })}
            />

            <Select label="Movement Reason Type" value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
              <option value="PURCHASE_RECEIPT">Inbound Delivery (+)</option>
              <option value="POS_CONSUMPTION">F&B Order Consumption (-)</option>
              <option value="HOUSEKEEPING_USAGE">Housekeeping Room Linen (-)</option>
              <option value="WASTAGE_SPOILAGE">Wastage / Spoilage (-)</option>
              <option value="ADJUSTMENT_WRITE_OFF">Manual Stock Audit Count (Variance)</option>
            </Select>
          </div>

          <Input
            label="Audit Notes / Explanation"
            placeholder="e.g. Physical cycle count discrepancy or broken bottle..."
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsStockAdjustOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Commit Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ISSUE NEW PURCHASE ORDER MODAL */}
      <Modal
        isOpen={isNewPOOpen}
        onClose={() => setIsNewPOOpen(false)}
        title="Issue Purchase Order"
        description="Send a new stock order to one of your registered suppliers"
      >
        <form onSubmit={handleNewPOSubmit} className="space-y-4">
          {suppliers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No suppliers on file yet — add one in Settings before issuing a purchase order.
            </p>
          ) : (
            <Select
              label="Supplier *"
              required
              value={poForm.supplierId}
              onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.category}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Order Contents *"
            required
            placeholder="e.g. Egyptian Cotton Sheets x 20"
            value={poForm.itemsDescription}
            onChange={(e) => setPoForm({ ...poForm, itemsDescription: e.target.value })}
          />

          <Input
            label="Total Amount ($) *"
            type="number"
            required
            value={poForm.totalAmount}
            onChange={(e) => setPoForm({ ...poForm, totalAmount: parseFloat(e.target.value) || 0 })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsNewPOOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" isLoading={isSubmittingPO} disabled={suppliers.length === 0}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

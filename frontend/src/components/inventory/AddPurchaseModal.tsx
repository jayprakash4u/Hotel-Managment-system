'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Plus, Search, ChevronDown, CheckCircle2, Package, FileText, Sparkles, Building2, UtensilsCrossed } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  department: string;
  trackStock?: boolean;
  supplierId?: string;
  category?: string;
}

export interface SupplierOption {
  id: string;
  name: string;
  category?: string;
}

export interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItemOption[];
  suppliers?: SupplierOption[];
  onPurchaseCompleted: () => void;
  preselectedItemId?: string;
  defaultDepartment?: 'HOTEL' | 'RESTAURANT';
}

const COMMON_UNITS = [
  'pieces',
  'bottles',
  'cans',
  'kg',
  'litres',
  'boxes',
  'packets',
  'sets',
  'rolls',
  'tins',
];

const HOTEL_CATEGORIES = [
  { value: 'LINEN', label: 'Bedding & Linens (Purchase Only)' },
  { value: 'TOILETRIES', label: 'Guest Toiletries & Soaps' },
  { value: 'CLEANING_SUPPLIES', label: 'Cleaning & Housekeeping' },
  { value: 'GUEST_AMENITIES', label: 'Room Amenities & Minibar' },
  { value: 'EQUIPMENT', label: 'Hotel Equipment & Fixtures' },
];

const RESTAURANT_CATEGORIES = [
  { value: 'BEVERAGES', label: 'Beverages & Soft Drinks (Resale)' },
  { value: 'SNACKS', label: 'Packaged Snacks & Confectionery (Resale)' },
  { value: 'PANTRY', label: 'Pantry Staples (Flour, Sugar, Oils)' },
  { value: 'FOOD_RAW', label: 'Raw Ingredients, Meats & Vegetables' },
  { value: 'EQUIPMENT', label: 'Kitchen Equipment & Cutlery (Plates, Spoons)' },
  { value: 'RESTAURANT_SUPPLIES', label: 'Cleaning & Outlets Supplies' },
];

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  suppliers: initialSuppliers,
  onPurchaseCompleted,
  preselectedItemId,
  defaultDepartment = 'RESTAURANT',
}) => {
  const toast = useToast();

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const [itemsList, setItemsList] = useState<InventoryItemOption[]>(initialItems || []);
  const [suppliersList, setSuppliersList] = useState<SupplierOption[]>(initialSuppliers || []);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Tab: 'EXISTING' or 'NEW'
  const [itemMode, setItemMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Existing item selection
  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New item creation fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemDepartment, setNewItemDepartment] = useState<'HOTEL' | 'RESTAURANT'>(defaultDepartment);
  const [newItemCategory, setNewItemCategory] = useState(defaultDepartment === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN');
  const [newItemTrackStock, setNewItemTrackStock] = useState<boolean>(true);
  const [newItemMinThreshold, setNewItemMinThreshold] = useState<number>(5);

  // Purchase line details
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('pieces');
  const [totalCost, setTotalCost] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDate());
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items and suppliers
  const fetchData = async () => {
    setIsLoadingItems(true);
    try {
      const [itemsRes, supRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
      ]);

      if (itemsRes.success && Array.isArray(itemsRes.data)) {
        setItemsList(itemsRes.data);
      }
      if (supRes.success && Array.isArray(supRes.data)) {
        setSuppliersList(supRes.data);
      }
    } catch (e: any) {
      console.error('Failed to fetch inventory options', e);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setError(null);
      setItemMode('EXISTING');
      setPurchaseDate(getTodayDate());
      setQuantity('');
      setTotalCost('');
      setInvoiceNumber('');
      if (preselectedItemId) {
        setSelectedItemId(preselectedItemId);
      }
    }
  }, [isOpen, preselectedItemId]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItemsList(initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    if (initialSuppliers && initialSuppliers.length > 0) {
      setSuppliersList(initialSuppliers);
    }
  }, [initialSuppliers]);

  // Click outside listener for searchable dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items for searchable dropdown
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return itemsList;
    const q = searchTerm.toLowerCase();
    return itemsList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q))
    );
  }, [itemsList, searchTerm]);

  // Currently selected item in existing mode
  const selectedItem = useMemo(() => {
    return itemsList.find((i) => i.id === selectedItemId);
  }, [itemsList, selectedItemId]);

  // When selected item changes, sync unit and supplier
  useEffect(() => {
    if (selectedItem) {
      setUnit(selectedItem.unit || 'pieces');
      if (selectedItem.supplierId && !supplierId) {
        setSupplierId(selectedItem.supplierId);
      }
    }
  }, [selectedItem]);

  // Determine whether current item being purchased is Track Stock (Resale) or Record Purchases Only
  const isResaleTracked = itemMode === 'EXISTING'
    ? (selectedItem ? selectedItem.trackStock !== false : true)
    : newItemTrackStock;

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please enter a valid quantity greater than zero.');
      return;
    }

    const costNum = parseFloat(totalCost);
    if (isNaN(costNum) || costNum < 0) {
      setError('Total cost must be zero or greater.');
      return;
    }

    if (!unit.trim()) {
      setError('Unit is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetItemId = selectedItemId;
      let targetItemName = selectedItem?.name || '';

      // If creating a new item first
      if (itemMode === 'NEW') {
        if (!newItemName.trim()) {
          setError('Item name is required for new items.');
          setIsSubmitting(false);
          return;
        }

        const createRes = await fetch('/api/inventory/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newItemName.trim(),
            department: newItemDepartment,
            category: newItemCategory,
            unit: unit.trim(),
            currentStock: 0,
            minThreshold: newItemTrackStock ? Number(newItemMinThreshold) || 5 : 0,
            costPerUnit: 0,
            supplierId: supplierId || null,
            trackStock: newItemTrackStock,
          }),
        });

        const createData = await createRes.json();
        if (!createData.success) {
          throw new Error(createData.error || 'Failed to create new item');
        }

        targetItemId = createData.data.id;
        targetItemName = createData.data.name;
      } else {
        if (!targetItemId) {
          setError('Please select an item from the list or create a new one.');
          setIsSubmitting(false);
          return;
        }
      }

      // Save purchase via add-stock
      const idempotencyKey = `PURCHASE-${targetItemId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch('/api/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: targetItemId,
          quantityAdded: qtyNum,
          unit: unit.trim(),
          totalCost: costNum,
          supplierId: supplierId || null,
          purchaseDate: new Date(purchaseDate).toISOString(),
          invoiceNumber: invoiceNumber.trim() || null,
          performedBy: 'Purchasing Officer',
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to record purchase');
      }

      if (isResaleTracked) {
        toast.celebrate(
          'Purchase Saved & Stock Updated!',
          `Added ${qtyNum} ${unit.trim()} to '${targetItemName}'. Stock ledger updated successfully.`
        );
      } else {
        toast.celebrate(
          'Purchase Record Saved!',
          `Recorded purchase of ${qtyNum} ${unit.trim()} for '${targetItemName}' (Rs. ${costNum.toLocaleString()}). Saved to purchase history.`
        );
      }

      onPurchaseCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while saving the purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = newItemDepartment === 'RESTAURANT' ? RESTAURANT_CATEGORIES : HOTEL_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Purchase"
      description="Record supplier deliveries for resale products or business expense supplies"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger-subtle dark:bg-danger-subtle border border-danger dark:border-danger text-danger dark:text-danger text-xs">
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ITEM SELECTION MODE TOGGLE */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 p-1 bg-surface-muted dark:bg-surface-card rounded-xl">
          <button
            type="button"
            onClick={() => setItemMode('EXISTING')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              itemMode === 'EXISTING'
                ? 'bg-surface-card dark:bg-surface-card text-body dark:text-body shadow-xs'
                : 'text-muted hover:text-body dark:text-muted dark:hover:text-body'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Select Existing Item
          </button>
          <button
            type="button"
            onClick={() => setItemMode('NEW')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              itemMode === 'NEW'
                ? 'bg-surface-card dark:bg-surface-card text-body dark:text-body shadow-xs'
                : 'text-muted hover:text-body dark:text-muted dark:hover:text-body'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Item
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: SELECT EXISTING ITEM */}
        {/* ========================================================================= */}
        {itemMode === 'EXISTING' && (
          <div className="space-y-3">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Item to Purchase *
              </label>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-xs cursor-pointer hover:border-border-default transition-colors"
              >
                {selectedItem ? (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-body dark:text-body truncate">
                      {selectedItem.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-muted dark:bg-surface-card text-muted shrink-0">
                      {selectedItem.sku}
                    </span>
                    {selectedItem.trackStock === false ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Purchase Only
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Resale
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted">Search or choose an item...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted shrink-0" />
              </div>

              {/* Popover Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-border-default dark:border-border-default bg-surface-muted dark:bg-surface-card">
                    <Input
                      autoFocus
                      placeholder="Type to filter items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-border-default dark:divide-border-default">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted">
                        No matching items found.
                      </div>
                    ) : (
                      filteredItems.map((item) => {
                        const isResale = item.trackStock !== false;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              'p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-muted dark:hover:bg-surface-card transition-colors text-xs',
                              item.id === selectedItemId && 'bg-success-subtle dark:bg-success-subtle'
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-medium text-body dark:text-body truncate">
                                {item.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono mt-0.5">
                                <span>{item.department}</span>
                                <span>·</span>
                                <span>{item.category}</span>
                                <span>·</span>
                                <span>{item.sku}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {isResale ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                  Stock: {item.currentStock} {item.unit}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-muted text-muted border border-border-default dark:bg-surface-card dark:text-muted dark:border-border-default">
                                  Purchase Only
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Item Configuration Banner */}
            {selectedItem && (
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs flex items-start gap-3',
                  selectedItem.trackStock !== false
                    ? 'bg-success-subtle border-success text-success dark:bg-success-subtle dark:border-success dark:text-success'
                    : 'bg-info-subtle border-info text-info dark:bg-info-subtle dark:border-info dark:text-info'
                )}
              >
                {selectedItem.trackStock !== false ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success dark:text-success shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>Resale Product (Stock Tracked)</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-emerald-950 font-bold border border-emerald-300 dark:border-emerald-700">
                          Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-success dark:text-success/80">
                        Saving this purchase will increase stock to{' '}
                        <strong className="font-mono">
                          {selectedItem.currentStock + (parseFloat(quantity) || 0)} {selectedItem.unit}
                        </strong>{' '}
                        and automatically deduct stock when sold via POS orders.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-info dark:text-info shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold">Purchase History Only (No Stock Balance)</div>
                      <p className="text-[11px] text-info dark:text-info/80">
                        This item records purchase expenses and supplier invoices without maintaining stock quantities or stock deductions.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CREATE NEW ITEM */}
        {/* ========================================================================= */}
        {itemMode === 'NEW' && (
          <div className="space-y-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="text-xs font-bold text-body dark:text-body flex items-center gap-1.5 pb-1 border-b border-border-default dark:border-border-default">
              <Sparkles className="w-3.5 h-3.5 text-brand dark:text-success" />
              New Item Configuration
            </div>

            {/* Department & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Department *"
                required
                value={newItemDepartment}
                onChange={(e) => {
                  const newDept = e.target.value as 'HOTEL' | 'RESTAURANT';
                  setNewItemDepartment(newDept);
                  setNewItemCategory(newDept === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN');
                }}
              >
                <option value="RESTAURANT">Restaurant Inventory</option>
                <option value="HOTEL">Hotel Inventory</option>
              </Select>

              <Select
                label="Category *"
                required
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Item Name */}
            <div>
              <Input
                label="Item Name *"
                required
                placeholder="e.g. Heineken Beer Can (330ml), Basmati Rice (25kg), or Table Spoons Set"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>

            {/* ========================================================================= */}
            {/* CLEAR CHOICE: TRACK STOCK FOR RESALE VS RECORD PURCHASES ONLY */}
            {/* ========================================================================= */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Purchasing Behavior *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Choice 1: Resale */}
                <div
                  onClick={() => setNewItemTrackStock(true)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-xs',
                    newItemTrackStock
                      ? 'border-success bg-success-subtle dark:bg-success-subtle text-success dark:text-success ring-1 ring-success'
                      : 'border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-muted dark:text-muted hover:border-border-default'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-success dark:text-success" />
                      1. Track Stock for Resale
                    </span>
                    <input
                      type="radio"
                      name="purchasingBehavior"
                      checked={newItemTrackStock}
                      onChange={() => setNewItemTrackStock(true)}
                      className="accent-brand"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-muted leading-relaxed">
                    For products sold directly to guests (beer, soda, bottled water, snacks). Stock increases on purchase and deducts on sale.
                  </p>
                </div>

                {/* Choice 2: Purchase History Only */}
                <div
                  onClick={() => setNewItemTrackStock(false)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-xs',
                    !newItemTrackStock
                      ? 'border-info bg-info-subtle dark:bg-info-subtle text-info dark:text-info ring-1 ring-info'
                      : 'border-border-default dark:border-border-default bg-surface-card dark:bg-surface-card text-muted dark:text-muted hover:border-border-default'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-info dark:text-info" />
                      2. Record Purchases Only
                    </span>
                    <input
                      type="radio"
                      name="purchasingBehavior"
                      checked={!newItemTrackStock}
                      onChange={() => setNewItemTrackStock(false)}
                      className="accent-info"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-muted leading-relaxed">
                    For kitchen ingredients, spices, oil, equipment, hotel supplies & cleaning items. Saved to purchase history without stock balances.
                  </p>
                </div>
              </div>
            </div>

            {/* Show stock-related field (threshold) ONLY if resale tracked */}
            {newItemTrackStock && (
              <div className="p-2.5 rounded-lg bg-success-subtle dark:bg-success-subtle border-border-default dark:border-border-default">
                <Input
                  label="Low Stock Alert Threshold"
                  type="number"
                  min={0}
                  placeholder="e.g. 10 (Alert when stock reaches this level)"
                  value={newItemMinThreshold}
                  onChange={(e) => setNewItemMinThreshold(parseInt(e.target.value, 10) || 0)}
                  className="text-xs h-9"
                />
                <p className="text-[10px] text-success dark:text-success mt-1">
                  Alerts will trigger on the dashboard when stock falls below this quantity.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PURCHASE DETAILS (COMMON FOR ALL PURCHASES) */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Purchase Details
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity Purchased *"
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 24 or 5.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measurement *
              </label>
              <div className="relative">
                <input
                  list="unit-suggestions"
                  required
                  placeholder="e.g. bottles, kg, cans, pieces"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-1 focus-ring-[var(--brand-primary)]"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Total Cost & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Total Cost (Rs.) *"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
              {parseFloat(quantity) > 0 && parseFloat(totalCost) >= 0 && (
                <div className="text-[11px] text-muted">
                  Cost per {unit}: Rs. {(parseFloat(totalCost) / parseFloat(quantity)).toFixed(2)}
                </div>
              )}
            </div>

            <Input
              label="Purchase Date *"
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {/* Supplier & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Supplier (Optional)"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Direct Purchase (No Supplier)</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Input
              label="Invoice / Bill Number (Optional)"
              placeholder="e.g. INV-2026-904"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-border-default dark:border-border-default flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isResaleTracked ? (
              <span className="text-success dark:text-success font-medium">
                Stock balance will increase by {parseFloat(quantity) || 0} {unit}
              </span>
            ) : (
              <span className="text-muted">
                Purchase record only · No stock deduction or balance
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {isResaleTracked ? 'Save Purchase & Update Stock' : 'Save Purchase Record'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

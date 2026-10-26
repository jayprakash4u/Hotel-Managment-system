'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { Plus, Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  department: string;
  supplierId?: string;
  category?: string;
}

export interface SupplierOption {
  id: string;
  name: string;
  category?: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItemOption[];
  suppliers?: SupplierOption[];
  onStockAdded: () => void;
  preselectedItemId?: string;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  suppliers: initialSuppliers,
  onStockAdded,
  preselectedItemId,
}) => {
  const toast = useToast();
  const { user } = useRole();

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Dynamic inventory items and suppliers
  const [itemsList, setItemsList] = useState<InventoryItemOption[]>(initialItems || []);
  const [suppliersList, setSuppliersList] = useState<SupplierOption[]>(initialSuppliers || []);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Form fields in exact required order:
  // 1. Item Name
  const [itemId, setItemId] = useState(preselectedItemId || '');
  // 2. Quantity Added
  const [quantityAdded, setQuantityAdded] = useState<string>('');
  // 3. Unit (loaded dynamically from selected item)
  const [unit, setUnit] = useState<string>('');
  // 4. Total Cost (Rs.)
  const [totalCost, setTotalCost] = useState<string>('');
  // 5. Supplier
  const [supplierId, setSupplierId] = useState<string>('');
  // 6. Purchase Date (default to today)
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDate());
  // 7. Invoice Number
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Dropdown search & popover state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add Item child modal state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    department: 'HOTEL' as 'HOTEL' | 'RESTAURANT',
    category: 'LINEN',
    sku: '',
    unit: 'Pieces',
    minThreshold: 5,
    supplierId: '',
  });

  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items dynamically from API/database
  const fetchItems = async () => {
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
      console.error('Failed to fetch inventory items', e);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setError(null);
    }
  }, [isOpen]);

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

  // Sync preselected item
  useEffect(() => {
    if (preselectedItemId) {
      setItemId(preselectedItemId);
    }
  }, [preselectedItemId]);

  // Dynamically load selected item's unit configuration
  useEffect(() => {
    if (itemId) {
      const selected = itemsList.find((i) => i.id === itemId);
      if (selected) {
        setUnit(selected.unit || 'Pieces');
        if (selected.supplierId && !supplierId) {
          setSupplierId(selected.supplierId);
        }
      }
    } else {
      setUnit('');
    }
  }, [itemId, itemsList]);

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

  const selectedItem = itemsList.find((i) => i.id === itemId);

  // Handle Creating a New Inventory Item from "+ Add Item"
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      toast.error('Item name required', 'Please enter a name for the new inventory item.');
      return;
    }
    if (!newItemForm.unit.trim()) {
      toast.error('Unit required', 'Please enter a unit of measurement.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      // "Creating an item must not increase stock by itself" -> currentStock: 0
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemForm.name.trim(),
          department: newItemForm.department,
          category: newItemForm.category,
          sku: newItemForm.sku.trim() || undefined,
          currentStock: 0,
          minThreshold: newItemForm.minThreshold || 5,
          unit: newItemForm.unit.trim(),
          costPerUnit: 0,
          supplierId: newItemForm.supplierId || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create item');
      }

      toast.celebrate(
        'Item Created!',
        `'${data.data.name}' was created and selected in Add Stock.`
      );

      // Refresh dropdown dynamically
      const updatedListRes = await fetch('/api/inventory/items').then((r) => r.json());
      if (updatedListRes.success && Array.isArray(updatedListRes.data)) {
        setItemsList(updatedListRes.data);
      }

      // Automatically select the new item and its dynamic unit
      setItemId(data.data.id);
      setUnit(data.data.unit);
      if (data.data.supplierId && !supplierId) {
        setSupplierId(data.data.supplierId);
      }

      // Close child Add Item form and return to Add Stock
      setIsAddItemOpen(false);

      // Reset new item form fields
      setNewItemForm({
        name: '',
        department: 'HOTEL',
        category: 'LINEN',
        sku: '',
        unit: 'Pieces',
        minThreshold: 5,
        supplierId: '',
      });
    } catch (err: any) {
      toast.error('Failed to create item', err.message);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle Saving Add Stock
  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError('Item Name is required. Please select an inventory item.');
      return;
    }

    const qty = parseInt(quantityAdded, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity Added must be greater than zero.');
      return;
    }

    if (!unit.trim()) {
      setError('Unit is required. Please select an item with a configured unit.');
      return;
    }

    const cost = parseFloat(totalCost);
    if (isNaN(cost) || cost < 0) {
      setError('Total Cost (Rs.) must be zero or greater.');
      return;
    }

    if (!purchaseDate) {
      setError('Purchase Date is required.');
      return;
    }

    setIsSubmittingStock(true);
    const idempotencyKey = `ADD-STOCK-${itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch('/api/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          quantityAdded: qty,
          unit: unit.trim(),
          totalCost: cost,
          supplierId: supplierId || null,
          purchaseDate: new Date(purchaseDate).toISOString(),
          invoiceNumber: invoiceNumber.trim() || null,
          performedBy: user?.name || 'Staff User',
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save stock addition');
      }

      toast.celebrate(
        'Stock Added Successfully!',
        data.message || `Added ${qty} ${unit} to inventory.`
      );

      // Close modal and refresh parent data
      onClose();
      onStockAdded();

      // Reset fields
      setQuantityAdded('');
      setTotalCost('');
      setInvoiceNumber('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while saving stock.');
      toast.error('Failed to add stock', err.message);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isAddItemOpen}
        onClose={onClose}
        title="Add Stock"
        description="Receive stock purchases into inventory with atomic balance updates and audit tracking"
        size="md"
      >
        <form onSubmit={handleSubmitStock} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* 1. Item Name field with compact + Add Item button on label row */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1E293B] dark:text-[#E2E8F0]">
                Item Name <span className="text-[#DC2626] font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewItemForm({
                    name: '',
                    department: selectedItem?.department === 'RESTAURANT' ? 'RESTAURANT' : 'HOTEL',
                    category: selectedItem?.department === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN',
                    sku: '',
                    unit: 'Pieces',
                    minThreshold: 5,
                    supplierId: supplierId || '',
                  });
                  setIsAddItemOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D32] hover:text-[#06241D] dark:text-emerald-400 dark:hover:text-emerald-300 py-0.5 px-2 rounded hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Below the label row: Searchable item dropdown */}
            <div className="relative">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  'w-full h-[42px] rounded-lg px-3.5 text-sm transition-all duration-150 flex items-center justify-between cursor-pointer select-none',
                  'bg-white border border-[#CBD5D0] text-[#1E293B]',
                  'hover:border-[#94A3B8]',
                  isDropdownOpen && 'border-[#0B3D32] ring-3 ring-[#0B3D32]/15',
                  'dark:bg-[#0F172A] dark:border-[#334155] dark:text-white'
                )}
              >
                <span className={selectedItem ? 'font-medium text-slate-900 dark:text-white truncate' : 'text-slate-400'}>
                  {selectedItem
                    ? `${selectedItem.name} (${selectedItem.sku})`
                    : '-- Select Inventory Item --'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ml-2', isDropdownOpen && 'rotate-180')} />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/40">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search by name, SKU, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    {searchTerm && (
                      <button type="button" onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {isLoadingItems ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading items...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No items found matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setItemId(item.id);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                          className={cn(
                            'p-2.5 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors',
                            item.id === itemId && 'bg-emerald-50/60 dark:bg-emerald-950/40 font-semibold text-[#0B3D32] dark:text-emerald-300'
                          )}
                        >
                          <div className="truncate mr-2">
                            <div className="text-slate-900 dark:text-white font-medium truncate">{item.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{item.sku}</span>
                              <span>•</span>
                              <span>Unit: {item.unit}</span>
                              <span>•</span>
                              <span className={item.department === 'HOTEL' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                                {item.department}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-slate-500 font-mono text-[11px] shrink-0">
                            Stock: {item.currentStock}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. Quantity Added (required) & 2. Unit (loaded dynamically from selected item) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Quantity Added *"
              type="number"
              min={1}
              required
              placeholder="e.g. 10"
              value={quantityAdded}
              onChange={(e) => setQuantityAdded(e.target.value)}
            />

            <Input
              label="Unit *"
              required
              readOnly
              placeholder={selectedItem ? selectedItem.unit : 'Item unit'}
              value={unit}
              className="bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium cursor-not-allowed"
            />
          </div>

          {/* 3. Total Cost (Rs.) (required, total cost not cost per unit) */}
          <div>
            <Input
              label="Total Cost (Rs.) *"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="e.g. 1500.00"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
            />
          </div>

          {/* 4. Supplier (optional) */}
          <div>
            <Select
              label="Supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- Optional: No Supplier / Direct Purchase --</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.category ? `(${s.category})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Purchase Date (required, default to today) */}
          <div>
            <Input
              label="Purchase Date *"
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {/* 6. Invoice Number (optional) */}
          <div>
            <Input
              label="Invoice Number (Optional)"
              placeholder="e.g. INV-84920"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Bottom Actions: Keep only Cancel and Save Stock */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmittingStock}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingStock}
            >
              Save Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD INVENTORY ITEM MODAL (TRIGGERED BY + ADD ITEM) */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Add Inventory Item"
        description="Register a new item. Initial stock will be 0 until stock is added."
        size="md"
      >
        <form onSubmit={handleCreateNewItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department *"
              required
              value={newItemForm.department}
              onChange={(e) => setNewItemForm({ ...newItemForm, department: e.target.value as any })}
            >
              <option value="HOTEL">Hotel Inventory</option>
              <option value="RESTAURANT">Restaurant Inventory</option>
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
                  <option value="CLEANING_SUPPLIES">Housekeeping Supplies</option>
                  <option value="GUEST_AMENITIES">Room Amenities</option>
                </>
              ) : (
                <>
                  <option value="BEVERAGES">Beverages & Drinks</option>
                  <option value="PANTRY">Pantry Staples</option>
                  <option value="FOOD_RAW">Raw Ingredients</option>
                  <option value="RESTAURANT_SUPPLIES">Restaurant Supplies</option>
                </>
              )}
            </Select>
          </div>

          <Input
            label="Item Name *"
            required
            placeholder="e.g. Sparkling Mineral Water (500ml)"
            value={newItemForm.name}
            onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit (e.g. Bottles, Pieces, Kg, Packets, Litres) *"
              required
              placeholder="e.g. Bottles"
              value={newItemForm.unit}
              onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
            />
            <Input
              label="SKU (Optional)"
              placeholder="Auto-generated if empty"
              value={newItemForm.sku}
              onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Reorder Threshold"
              type="number"
              min={0}
              value={newItemForm.minThreshold}
              onChange={(e) => setNewItemForm({ ...newItemForm, minThreshold: parseInt(e.target.value, 10) || 0 })}
            />
            <Select
              label="Primary Supplier"
              value={newItemForm.supplierId}
              onChange={(e) => setNewItemForm({ ...newItemForm, supplierId: e.target.value })}
            >
              <option value="">-- No Supplier --</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsAddItemOpen(false)}
              disabled={isSubmittingItem}
            >
              Back to Add Stock
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingItem}
            >
              Create Item & Select
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

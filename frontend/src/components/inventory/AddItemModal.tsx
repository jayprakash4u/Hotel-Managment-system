'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Plus,
  Check,
  AlertTriangle,
  Package,
  Sparkles,
  X,
  Layers,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMasterItems, saveMasterItems, SimpleMasterItem } from '@/lib/mastersData';

export interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: 'HOTEL' | 'RESTAURANT';
  existingItems?: Array<{ name: string; department: string }>;
  onItemCreated: (newItem: any) => void;
}

export interface MasterProductOption {
  id: string;
  name: string;
  code: string;
  category?: string;
  unit?: string;
  basePrice?: number;
  trackStock?: boolean;
}

const COMMON_CATEGORIES = [
  'Cold Drinks',
  'Beverages',
  'Raw Materials',
  'Kitchen Pantry',
  'Dairy & Fresh',
  'Food & Meats',
  'Tableware & Supplies',
  'Bedding & Linens',
  'Toiletries & Hygiene',
  'Cleaning & Housekeeping',
  'Room Amenities',
  'General Supplies',
];

const COMMON_UNITS = [
  'Pieces',
  'Bottles',
  'Cans',
  'kg',
  'Grams',
  'Litres',
  'Boxes',
  'Packets',
  'Cartons',
  'Sets',
];

// Fallback master products from catalog setup
const CATALOG_PRESETS: MasterProductOption[] = [
  { id: 'cat-1', name: 'Sprite 500ml', code: 'SPR-500', category: 'Cold Drinks', unit: 'Bottles', basePrice: 65, trackStock: true },
  { id: 'cat-2', name: 'Coca Cola 500ml', code: 'COK-500', category: 'Cold Drinks', unit: 'Bottles', basePrice: 65, trackStock: true },
  { id: 'cat-3', name: 'Fanta Orange 500ml', code: 'FAN-500', category: 'Cold Drinks', unit: 'Bottles', basePrice: 65, trackStock: true },
  { id: 'cat-4', name: 'Mineral Water 1L', code: 'WTR-001', category: 'Beverages', unit: 'Bottles', basePrice: 25, trackStock: true },
  { id: 'cat-5', name: 'Fresh Cow Milk 1L', code: 'MLK-001', category: 'Dairy & Fresh', unit: 'Litres', basePrice: 90, trackStock: true },
  { id: 'cat-6', name: 'Sunflower Cooking Oil 5L', code: 'OIL-005', category: 'Kitchen Pantry', unit: 'Cans', basePrice: 1150, trackStock: true },
  { id: 'cat-7', name: 'Refined White Sugar 1kg', code: 'SGR-001', category: 'Kitchen Pantry', unit: 'kg', basePrice: 110, trackStock: true },
  { id: 'cat-8', name: 'Fresh Chicken Breast', code: 'CHK-001', category: 'Food & Meats', unit: 'kg', basePrice: 420, trackStock: true },
  { id: 'cat-9', name: 'Robusta Coffee Beans 1kg', code: 'COF-001', category: 'Beverages', unit: 'Boxes', basePrice: 850, trackStock: true },
  { id: 'cat-10', name: 'Plush Bath Towel (White Cotton)', code: 'TWL-001', category: 'Bedding & Linens', unit: 'Pieces', basePrice: 550, trackStock: true },
  { id: 'cat-11', name: 'Dental Kit (Toothbrush + Paste)', code: 'KIT-001', category: 'Toiletries & Hygiene', unit: 'Sets', basePrice: 25, trackStock: true },
  { id: 'cat-12', name: 'Multi-Surface Cleaner 5L', code: 'CLN-001', category: 'Cleaning & Housekeeping', unit: 'Cans', basePrice: 650, trackStock: true },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  department: initialDepartment,
  existingItems = [],
  onItemCreated,
}) => {
  const toast = useToast();

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [department, setDepartment] = useState<'HOTEL' | 'RESTAURANT'>(initialDepartment);
  const [category, setCategory] = useState('Cold Drinks');
  const [unit, setUnit] = useState('Pieces');
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [trackStock, setTrackStock] = useState(true);

  // Master Products Integration
  const [masterProducts, setMasterProducts] = useState<MasterProductOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProductOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products from Product Setup (localStorage & mastersData & API)
  useEffect(() => {
    if (!isOpen) return;

    try {
      // 1. Read from mastersData items & hotel_master_product-setup
      const storedMasters = getMasterItems('items');
      const loaded: MasterProductOption[] = [];

      if (Array.isArray(storedMasters)) {
        storedMasters.forEach((m) => {
          if (m.name) {
            loaded.push({
              id: m.id || `prd-${m.code || m.name}`,
              name: m.name,
              code: m.code || '',
              category: m.category || 'General Supplies',
              unit: m.unit || 'Pieces',
              basePrice: m.basePrice || 0,
              trackStock: m.trackStock ?? true,
            });
          }
        });
      }

      // 2. Merge with CATALOG_PRESETS (deduplicating by name)
      const mergedMap = new Map<string, MasterProductOption>();
      CATALOG_PRESETS.forEach((p) => mergedMap.set(p.name.toLowerCase(), p));
      loaded.forEach((p) => mergedMap.set(p.name.toLowerCase(), p));

      setMasterProducts(Array.from(mergedMap.values()));
    } catch {
      setMasterProducts(CATALOG_PRESETS);
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartment(initialDepartment);
      setName('');
      setSku('');
      setCategory(initialDepartment === 'RESTAURANT' ? 'Cold Drinks' : 'Bedding & Linens');
      setUnit('Pieces');
      setOpeningStock(0);
      setMinThreshold(5);
      setCostPerUnit(0);
      setTrackStock(true);
      setSelectedMasterProduct(null);
      setError(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialDepartment]);

  // Close product search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter master products matching user search
  const filteredProducts = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return masterProducts.slice(0, 8);
    return masterProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [masterProducts, name]);

  const exactMatchExists = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return false;
    return masterProducts.some((p) => p.name.toLowerCase() === q);
  }, [masterProducts, name]);

  // Handle selecting a product from the list
  const handleSelectProduct = (prod: MasterProductOption) => {
    setName(prod.name);
    setSku(prod.code || prod.name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, ''));
    if (prod.category) {
      setCategory(prod.category);
    }
    if (prod.unit) {
      setUnit(prod.unit);
    }
    if (prod.basePrice !== undefined && prod.basePrice > 0) {
      setCostPerUnit(prod.basePrice);
    }
    if (prod.trackStock !== undefined) {
      setTrackStock(prod.trackStock);
    }
    setSelectedMasterProduct(prod);
    setIsDropdownOpen(false);
  };

  // Duplicate Warning check
  const duplicateWarning = useMemo(() => {
    if (!name.trim()) return null;
    const clean = name.trim().toLowerCase();
    const exactMatch = existingItems.find(
      (i) => i.department.toUpperCase() === department.toUpperCase() && i.name.toLowerCase() === clean
    );
    if (exactMatch) {
      return `Item "${exactMatch.name}" already exists in ${department} Inventory.`;
    }
    return null;
  }, [name, department, existingItems]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    if (duplicateWarning) {
      setError(duplicateWarning);
      return;
    }

    setIsSubmitting(true);
    const finalCode = sku.trim() || name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');

    try {
      // 1. Save to inventory backend API
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sku: finalCode,
          department,
          category,
          unit,
          openingStock: trackStock ? Number(openingStock) || 0 : 0,
          currentStock: trackStock ? Number(openingStock) || 0 : 0,
          minThreshold: trackStock ? Number(minThreshold) || 0 : 0,
          costPerUnit: Number(costPerUnit) || 0,
          trackStock,
        }),
      });

      const json = await res.json();
      const savedItem = json?.data || {
        id: `item-${Date.now()}`,
        name: name.trim(),
        sku: finalCode,
        department,
        category,
        unit,
        currentStock: trackStock ? Number(openingStock) || 0 : 0,
        minThreshold: trackStock ? Number(minThreshold) || 0 : 0,
        costPerUnit: Number(costPerUnit) || 0,
        trackStock,
      };

      // 2. If product did NOT exist in Product Setup master, add it there as well
      if (!exactMatchExists) {
        try {
          const currentMasters = getMasterItems('items');
          const newMasterEntry: SimpleMasterItem = {
            id: `prd-${Date.now()}`,
            code: finalCode,
            name: name.trim(),
            category,
            unit,
            basePrice: Number(costPerUnit) || 0,
            trackStock,
            isActive: true,
          };
          saveMasterItems('items', [newMasterEntry, ...currentMasters]);
        } catch (masterErr) {
          console.warn('Could not sync to master products:', masterErr);
        }
      }

      toast.success(
        'Item Added',
        `"${name.trim()}" has been successfully added to inventory${!exactMatchExists ? ' and saved to Product Setup' : ''}.`
      );

      onItemCreated(savedItem);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      className="p-0 overflow-hidden font-sans"
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#FAFBFB] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Add Inventory Item
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-[2px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-800 text-xs dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Search / Fetch from Product Setup */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Product Name / Search from Product Setup *
            </label>
            {selectedMasterProduct && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Linked to Product Setup
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={name}
              placeholder=""
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setName(e.target.value);
                setSelectedMasterProduct(null);
                setIsDropdownOpen(true);
              }}
              className="w-full h-8 px-2.5 pr-8 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32]"
            />
            {name ? (
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setSelectedMasterProduct(null);
                  setIsDropdownOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Dropdown from Product Setup */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-xs animate-in fade-in-50 duration-100">
              <div className="px-3 py-1 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Products from Master Setup</span>
                <span>{masterProducts.length} items</span>
              </div>

              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <button
                    key={p.id || p.code || p.name}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/40 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.category || 'General'} · Unit: {p.unit || 'Pieces'}
                        {p.basePrice ? ` · Rs. ${p.basePrice}` : ''}
                      </span>
                    </div>
                    {p.code && (
                      <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {p.code}
                      </span>
                    )}
                  </button>
                ))
              ) : null}

              {/* Add as New Product action if not in master */}
              {name.trim() && !exactMatchExists && (
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 text-[#0B3D32] dark:text-emerald-300 font-semibold cursor-pointer border-t border-emerald-100 dark:border-emerald-800/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add &quot;{name.trim()}&quot; as a new product</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Department & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as 'HOTEL' | 'RESTAURANT')}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            >
              <option value="RESTAURANT">Restaurant Inventory</option>
              <option value="HOTEL">Hotel Inventory</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Item Code / SKU & Stock Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Code / SKU
            </label>
            <input
              type="text"
              placeholder=""
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Stock Unit *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Opening Stock, Low Stock Threshold & Unit Rate */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Opening Stock
            </label>
            <input
              type="number"
              min="0"
              placeholder=""
              value={openingStock}
              onChange={(e) => setOpeningStock(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Min Threshold
            </label>
            <input
              type="number"
              min="0"
              placeholder=""
              value={minThreshold}
              onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unit Rate (Rs.)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder=""
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-8 px-2 border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
            />
          </div>
        </div>

        {/* 5. Track Stock Option */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="w-3.5 h-3.5 rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Track stock balance for this item
            </span>
          </label>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-8 px-4 rounded-[2px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Item'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

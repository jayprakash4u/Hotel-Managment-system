'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: 'HOTEL' | 'RESTAURANT';
  existingItems?: Array<{ name: string; department: string }>;
  onItemCreated: (newItem: any) => void;
}

const HOTEL_CATEGORIES = [
  { value: 'LINEN', label: 'Bedding & Linens' },
  { value: 'TOILETRIES', label: 'Guest Toiletries & Soaps' },
  { value: 'CLEANING_SUPPLIES', label: 'Cleaning & Housekeeping' },
  { value: 'GUEST_AMENITIES', label: 'Room Amenities & Minibar' },
];

const RESTAURANT_CATEGORIES = [
  { value: 'BEVERAGES', label: 'Beverages & Soft Drinks' },
  { value: 'PANTRY', label: 'Pantry Staples (Flour, Sugar, Oils)' },
  { value: 'FOOD_RAW', label: 'Raw Ingredients, Meats & Produce' },
  { value: 'RESTAURANT_SUPPLIES', label: 'Tableware & Outlets Supplies' },
];

const SYSTEM_UNITS = [
  { value: 'pieces', label: 'Pieces (pcs)' },
  { value: 'bottles', label: 'Bottles (btl)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'litres', label: 'Litres (L)' },
  { value: 'cans', label: 'Cans (can)' },
  { value: 'boxes', label: 'Boxes (box)' },
  { value: 'packets', label: 'Packets (pkt)' },
  { value: 'rolls', label: 'Rolls (roll)' },
  { value: 'sets', label: 'Sets (set)' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  department: initialDepartment,
  existingItems = [],
  onItemCreated,
}) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState<'HOTEL' | 'RESTAURANT'>(initialDepartment);
  const [category, setCategory] = useState(
    initialDepartment === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN'
  );
  const [unit, setUnit] = useState('pieces');
  const [minThreshold, setMinThreshold] = useState<number>(5);
  const [trackStock, setTrackStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDepartment(initialDepartment);
      setCategory(initialDepartment === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN');
      setName('');
      setUnit('pieces');
      setMinThreshold(5);
      setTrackStock(true);
      setError(null);
    }
  }, [isOpen, initialDepartment]);

  // Check for duplicate or similar items in real-time
  const duplicateWarning = useMemo(() => {
    if (!name.trim()) return null;
    const clean = name.trim().toLowerCase();
    const exactMatch = existingItems.find(
      (i) => i.department.toUpperCase() === department.toUpperCase() && i.name.toLowerCase() === clean
    );
    if (exactMatch) {
      return {
        type: 'exact' as const,
        message: `An item named "${exactMatch.name}" already exists in ${department} Inventory.`,
      };
    }
    const similarMatch = existingItems.find(
      (i) =>
        i.department.toUpperCase() === department.toUpperCase() &&
        (i.name.toLowerCase().includes(clean) || clean.includes(i.name.toLowerCase()))
    );
    if (similarMatch) {
      return {
        type: 'similar' as const,
        message: `Similar item found in ${department} Inventory: "${similarMatch.name}". Please verify to avoid duplicates.`,
      };
    }
    return null;
  }, [name, department, existingItems]);

  const categories = department === 'RESTAURANT' ? RESTAURANT_CATEGORIES : HOTEL_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }

    if (duplicateWarning?.type === 'exact') {
      setError(duplicateWarning.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          department,
          category,
          unit,
          currentStock: 0, // Item creation never adds initial stock
          minThreshold: trackStock ? (Number(minThreshold) || 0) : 0,
          costPerUnit: 0,
          trackStock,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to register inventory item.');
      }

      const behaviorText = trackStock ? 'for stock-tracked resale' : 'for purchase history only';
      toast.celebrate(
        'Item Created!',
        `'${json.data.name}' was registered ${behaviorText}.`
      );

      onItemCreated(json.data);
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
      title="Add Inventory Item"
      description={`Register a new item in ${department} Inventory`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Department & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Department *"
            required
            value={department}
            onChange={(e) => {
              const newDept = e.target.value as 'HOTEL' | 'RESTAURANT';
              setDepartment(newDept);
              setCategory(newDept === 'RESTAURANT' ? 'BEVERAGES' : 'LINEN');
            }}
          >
            <option value="HOTEL">Hotel Inventory</option>
            <option value="RESTAURANT">Restaurant Inventory</option>
          </Select>

          <Select
            label="Category *"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            placeholder="e.g. San Pellegrino Sparkling Water, Wheat Flour, or Plush Bath Towel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Duplicate / Similar Warning Notice */}
          {duplicateWarning && (
            <div
              className={cn(
                'mt-1.5 p-2 rounded text-xs flex items-center gap-2 border',
                duplicateWarning.type === 'exact'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{duplicateWarning.message}</span>
            </div>
          )}
        </div>

        {/* Clear Choice: Resale vs Purchase History Only */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Item Configuration *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => setTrackStock(true)}
              className={cn(
                'p-2.5 rounded-xl border cursor-pointer text-xs transition-all flex flex-col justify-between',
                trackStock
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">1. Track stock for resale</span>
                <input
                  type="radio"
                  name="itemTrackStockOption"
                  checked={trackStock}
                  onChange={() => setTrackStock(true)}
                  className="accent-[#0B3D32]"
                />
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Beer, soda, bottled water, snacks. Stock tracked and deducted on order.
              </p>
            </div>

            <div
              onClick={() => setTrackStock(false)}
              className={cn(
                'p-2.5 rounded-xl border cursor-pointer text-xs transition-all flex flex-col justify-between',
                !trackStock
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">2. Record purchases only</span>
                <input
                  type="radio"
                  name="itemTrackStockOption"
                  checked={!trackStock}
                  onChange={() => setTrackStock(false)}
                  className="accent-blue-600"
                />
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Ingredients, spices, oil, equipment, supplies. No stock balance tracked.
              </p>
            </div>
          </div>
        </div>

        {/* Unit & Low Stock Threshold (Threshold shown only for Resale) */}
        <div className={cn('grid gap-3', trackStock ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
          <Select
            label="Unit of Measurement *"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {SYSTEM_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>

          {trackStock && (
            <Input
              label="Low Stock Threshold"
              type="number"
              min={0}
              placeholder="e.g. 5 (Optional reorder alert)"
              value={minThreshold}
              onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 0)}
            />
          )}
        </div>

        {/* Informative Note */}
        <div className="p-2.5 rounded text-[11px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          ℹ️ <strong>Note:</strong> Creating an item registers it in catalog with <strong>0 stock</strong>. To log a delivery, click <strong>+ Add Purchase</strong>.
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={duplicateWarning?.type === 'exact'}
          >
            Save Item
          </Button>
        </div>
      </form>
    </Modal>
  );
};

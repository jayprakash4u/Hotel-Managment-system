'use client';

import React, { useMemo } from 'react';
import { BackButton } from '@/components/common/BackButton';
import {
  Tag,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryItemData } from '@/lib/types';

interface CategoriesViewProps {
  items: InventoryItemData[];
  onSelectCategory?: (category: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  items,
  onSelectCategory,
}) => {
  const categoryStats = useMemo(() => {
    const groups: { [cat: string]: InventoryItemData[] } = {};

    items.forEach((item) => {
      const cat = (item.category || 'GENERAL').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return Object.entries(groups).map(([cat, list]) => {
      const totalItems = list.length;
      const trackedItems = list.filter((i) => i.trackStock).length;
      const currentStockTotal = list.reduce((acc, i) => acc + (i.trackStock ? i.currentStock : 0), 0);
      const totalPurchaseSpent = list.reduce((acc, i) => acc + (i.totalPurchaseAmount || 0), 0);
      const lowStockCount = list.filter((i) => i.trackStock && i.minThreshold > 0 && i.currentStock <= i.minThreshold).length;

      return {
        category: cat,
        displayName: cat.replace(/_/g, ' '),
        totalItems,
        trackedItems,
        nonTrackedItems: totalItems - trackedItems,
        currentStockTotal,
        totalPurchaseSpent,
        lowStockCount,
        sampleUnits: Array.from(new Set(list.map((i) => i.unit))).slice(0, 3).join(', '),
      };
    }).sort((a, b) => b.totalItems - a.totalItems);
  }, [items]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Inventory Categories
        </span>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categoryStats.map((c) => (
          <div
            key={c.category}
            className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between hover:border-[#00A884] dark:hover:border-[#00A884] transition-all"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00A884]" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    {c.displayName}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
                  {c.totalItems} Items
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Stock Tracked</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {c.trackedItems} of {c.totalItems}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Available Units</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {c.currentStockTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Spent</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    Rs. {c.totalPurchaseSpent.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Low Stock Alerts</span>
                  <span
                    className={cn(
                      'font-bold font-mono',
                      c.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'
                    )}
                  >
                    {c.lowStockCount} items
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[150px]">
                Units: {c.sampleUnits || 'pieces'}
              </span>
              {onSelectCategory && (
                <button
                  type="button"
                  onClick={() => onSelectCategory(c.category)}
                  className="font-semibold text-[#00A884] hover:underline cursor-pointer"
                >
                  View Items →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


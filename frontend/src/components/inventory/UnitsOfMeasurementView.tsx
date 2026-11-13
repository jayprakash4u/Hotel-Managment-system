'use client';

import React, { useMemo } from 'react';
import { BackButton } from '@/components/common/BackButton';
import {
  Scale,
  Layers,
  ArrowRight,
  Boxes,
  Package,
} from 'lucide-react';
import { InventoryItemData } from '@/lib/types';

interface UnitsOfMeasurementViewProps {
  items: InventoryItemData[];
}

export const UnitsOfMeasurementView: React.FC<UnitsOfMeasurementViewProps> = ({ items }) => {
  // Common conversion matrix and items usage
  const unitStats = useMemo(() => {
    const unitMap: { [unit: string]: { count: number; items: string[]; conversions: { [pu: string]: number } } } = {};

    items.forEach((item) => {
      const u = (item.unit || 'pieces').toLowerCase();
      if (!unitMap[u]) {
        unitMap[u] = { count: 0, items: [], conversions: {} };
      }
      unitMap[u].count += 1;
      if (unitMap[u].items.length < 3) {
        unitMap[u].items.push(item.name);
      }

      if (item.purchaseUnit && item.conversionFactor && item.conversionFactor > 1) {
        const pu = item.purchaseUnit.toLowerCase();
        unitMap[u].conversions[pu] = item.conversionFactor;
      }
    });

    // Also include standard hospitality units if not yet in map
    const standards = [
      { unit: 'bottles', purchaseUnit: 'carton', defaultFactor: 12, desc: 'Beverages, spirits, wines and beers' },
      { unit: 'cans', purchaseUnit: 'case', defaultFactor: 24, desc: 'Sodas, energy drinks and canned beers' },
      { unit: 'kg', purchaseUnit: 'bag', defaultFactor: 25, desc: 'Grains, rice, flour, meats, sugar' },
      { unit: 'litre', purchaseUnit: 'canister', defaultFactor: 5, desc: 'Cooking oil, milk, syrups, juices' },
      { unit: 'pieces', purchaseUnit: 'box', defaultFactor: 50, desc: 'Amenities, soaps, dental kits, stationery' },
      { unit: 'sets', purchaseUnit: 'bundle', defaultFactor: 10, desc: 'Bed linens, towels, napkins' },
    ];

    return standards.map((std) => {
      const existing = unitMap[std.unit];
      const itemsUsing = existing ? existing.count : 0;
      const sampleNames = existing ? existing.items : [];
      const customConversions = existing ? Object.entries(existing.conversions) : [];

      return {
        unit: std.unit,
        defaultPurchaseUnit: std.purchaseUnit,
        defaultFactor: customConversions.length > 0 ? customConversions[0][1] : std.defaultFactor,
        description: std.desc,
        itemsCount: itemsUsing,
        sampleItems: sampleNames.join(', '),
      };
    });
  }, [items]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Sub-Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Units of Measurement
        </span>
      </div>

      {/* Conversion Matrix Table */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <th className="py-2.5 px-3">Stock Unit</th>
                <th className="py-2.5 px-3">Standard Purchase Package</th>
                <th className="py-2.5 px-3">Conversion Factor</th>
                <th className="py-2.5 px-3">Items Configured</th>
                <th className="py-2.5 px-3">Sample Products</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {unitStats.map((u) => (
                <tr key={u.unit} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white capitalize">
                    {u.unit}
                  </td>
                  <td className="py-2.5 px-3 capitalize font-semibold text-indigo-700 dark:text-indigo-400">
                    1 {u.defaultPurchaseUnit}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    1 {u.defaultPurchaseUnit} = {u.defaultFactor} {u.unit}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {u.itemsCount} items
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[200px] truncate" title={u.sampleItems}>
                    {u.sampleItems || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {u.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


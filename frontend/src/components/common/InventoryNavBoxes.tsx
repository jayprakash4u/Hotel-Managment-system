'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { WorkspaceTabsContext } from '@/context/WorkspaceTabsContext';
import {
  Package,
  Receipt,
  Activity,
  Users,
  ShoppingBag,
  SlidersHorizontal,
  ArrowLeftRight,
  Tag,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessModules } from '@/lib/businessSetup';

export interface InventorySubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export const INVENTORY_SUB_OPTIONS: InventorySubOption[] = [
  {
    id: 'items',
    name: 'Inventory Items',
    href: '/inventory?tab=items',
    icon: Package,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'receive-stock',
    name: 'Receive Stock & Purchases',
    href: '/inventory?tab=receive-stock',
    icon: ShoppingBag,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'purchase-ledger',
    name: 'Item Purchase Ledger',
    href: '/inventory?tab=purchase-ledger',
    icon: Receipt,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'stock-movements',
    name: 'Stock Movement Ledger',
    href: '/inventory?tab=stock-movements',
    icon: Activity,
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'suppliers',
    name: 'Suppliers Directory',
    href: '/inventory?tab=suppliers',
    icon: Users,
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    id: 'stock-adjustments',
    name: 'Stock Adjustments',
    href: '/inventory?tab=stock-adjustments',
    icon: SlidersHorizontal,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'stock-transfers',
    name: 'Stock Transfers',
    href: '/inventory?tab=transfers',
    icon: ArrowLeftRight,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'categories',
    name: 'Inventory Categories',
    href: '/inventory?tab=categories',
    icon: Tag,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'units',
    name: 'Units of Measurement',
    href: '/inventory?tab=units',
    icon: Scale,
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
];

export const InventoryNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
}> = ({ className, activeId, onSelectOption }) => {
  const searchParams = useSearchParams();
  const tabsContext = useContext(WorkspaceTabsContext);
  const { isTransfersEnabled } = useBusinessModules();

  const urlDept = searchParams?.get('dept')?.toUpperCase();
  const urlTab = searchParams?.get('tab')?.toLowerCase();

  const visibleOptions = INVENTORY_SUB_OPTIONS.filter((item) => {
    if (item.id === 'stock-transfers') return isTransfersEnabled;
    return true;
  });

  const handleBoxClick = (e: React.MouseEvent, item: InventorySubOption) => {
    onSelectOption?.(item.id);
    if (tabsContext && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      tabsContext.openTab({
        path: item.href,
        title: item.name,
      });
    }
  };

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 select-none', className)}>
      {visibleOptions.map((item) => {
        const Icon = item.icon;

        let isSelected = false;
        if (activeId) {
          isSelected = activeId === item.id;
        } else if (item.id === 'items') {
          isSelected = urlTab === 'items' || urlDept === 'RESTAURANT' || urlDept === 'HOTEL';
        } else if (item.id === 'purchase-ledger') {
          isSelected = urlTab === 'purchase-ledger';
        } else if (item.id === 'stock-movements') {
          isSelected = urlTab === 'stock-movements';
        } else if (item.id === 'suppliers') {
          isSelected = urlTab === 'suppliers';
        } else if (item.id === 'receive-stock') {
          isSelected = urlTab === 'receive-stock' || urlTab === 'purchases';
        } else if (item.id === 'stock-adjustments') {
          isSelected = urlTab === 'stock-adjustments';
        } else if (item.id === 'stock-transfers') {
          isSelected = urlTab === 'transfers';
        } else if (item.id === 'categories') {
          isSelected = urlTab === 'categories';
        } else if (item.id === 'units') {
          isSelected = urlTab === 'units';
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={(e) => handleBoxClick(e, item)}
            className={cn(
              'group relative flex flex-col items-center justify-center p-2.5 text-center transition-all duration-150',
              'rounded-[4px] border min-h-[68px] sm:min-h-[72px] cursor-pointer',
              isSelected
                ? 'border-[#0B3D32] bg-[#EAF1EE] text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-500 dark:bg-[#082820] dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-700 dark:text-slate-200 hover:border-[#0B3D32] hover:bg-slate-50/70 dark:hover:bg-slate-800/60'
            )}
            title={item.name}
          >
            <Icon
              className={cn(
                'w-4 h-4 sm:w-4.5 sm:h-4.5 mb-1.5 transition-transform group-hover:scale-105 stroke-[1.25]',
                item.iconColor
              )}
            />
            <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
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
}

export const INVENTORY_SUB_OPTIONS: InventorySubOption[] = [
  {
    id: 'overview',
    name: 'Inventory Overview',
    href: '/inventory?tab=overview',
    icon: LayoutDashboard,
  },
  {
    id: 'items',
    name: 'Inventory Items',
    href: '/inventory?tab=items',
    icon: Package,
  },
  {
    id: 'purchase-ledger',
    name: 'Item Purchase Ledger',
    href: '/inventory?tab=purchase-ledger',
    icon: Receipt,
  },
  {
    id: 'stock-movements',
    name: 'Stock Movement Ledger',
    href: '/inventory?tab=stock-movements',
    icon: Activity,
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    href: '/inventory?tab=suppliers',
    icon: Users,
  },
  {
    id: 'receive-stock',
    name: 'Receive Stock',
    href: '/inventory?tab=receive-stock',
    icon: ShoppingBag,
  },
  {
    id: 'stock-adjustments',
    name: 'Stock Adjustment',
    href: '/inventory?tab=stock-adjustments',
    icon: SlidersHorizontal,
  },
  {
    id: 'stock-transfers',
    name: 'Stock Transfer',
    href: '/inventory?tab=transfers',
    icon: ArrowLeftRight,
  },
  {
    id: 'categories',
    name: 'Inventory Categories',
    href: '/inventory?tab=categories',
    icon: Tag,
  },
  {
    id: 'units',
    name: 'Units of Measurement',
    href: '/inventory?tab=units',
    icon: Scale,
  },
];

export const InventoryNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
  counts?: {
    restaurant?: number;
    hotel?: number;
    purchases?: number;
    suppliers?: number;
    transfers?: number;
  };
}> = ({ className, activeId, onSelectOption }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isTransfersEnabled } = useBusinessModules();

  const urlDept = searchParams?.get('dept')?.toUpperCase();
  const urlTab = searchParams?.get('tab')?.toLowerCase();

  const visibleOptions = INVENTORY_SUB_OPTIONS.filter((item) => {
    if (item.id === 'stock-transfers') return isTransfersEnabled;
    return true;
  });

  return (
    <div className={cn('select-none', className)}>
      {/* Small compact cards with at least 7 to 8 options per row on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2">
        {visibleOptions.map((item) => {
          const Icon = item.icon;

          let isActive = false;
          if (activeId) {
            isActive = activeId === item.id;
          } else if (item.id === 'overview') {
            isActive = !urlTab || urlTab === 'overview';
          } else if (item.id === 'items') {
            isActive = urlTab === 'items' || urlDept === 'RESTAURANT' || urlDept === 'HOTEL';
          } else if (item.id === 'purchase-ledger') {
            isActive = urlTab === 'purchase-ledger';
          } else if (item.id === 'stock-movements') {
            isActive = urlTab === 'stock-movements';
          } else if (item.id === 'suppliers') {
            isActive = urlTab === 'suppliers';
          } else if (item.id === 'receive-stock') {
            isActive = urlTab === 'receive-stock' || urlTab === 'purchases';
          } else if (item.id === 'stock-adjustments') {
            isActive = urlTab === 'stock-adjustments';
          } else if (item.id === 'stock-transfers') {
            isActive = urlTab === 'transfers';
          } else if (item.id === 'categories') {
            isActive = urlTab === 'categories';
          } else if (item.id === 'units') {
            isActive = urlTab === 'units';
          }

          const handleClick = () => {
            if (onSelectOption) {
              onSelectOption(item.id);
            }
          };

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleClick}
              className={cn(
                'group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-[4px] border text-center transition-all duration-150 cursor-pointer min-h-[66px] sm:min-h-[72px]',
                isActive
                  ? 'border-[#DC2626] bg-red-50/30 text-[#DC2626] ring-1 ring-[#DC2626] dark:border-[#DC2626] dark:bg-red-950/20 dark:text-[#EF4444]'
                  : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-100 hover:border-[#DC2626] hover:bg-red-50/15 hover:shadow-xs'
              )}
            >
              {/* Centered Red Icon */}
              <div className="mb-1 text-[#DC2626] dark:text-[#EF4444] group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 stroke-[1.8] text-[#DC2626] dark:text-[#EF4444]" />
              </div>

              {/* Title Only (Clean & Compact) */}
              <span
                className={cn(
                  'text-[11px] font-semibold leading-tight line-clamp-1 px-1 transition-colors',
                  isActive
                    ? 'text-[#DC2626] dark:text-[#EF4444]'
                    : 'text-slate-800 dark:text-slate-100 group-hover:text-[#DC2626] dark:group-hover:text-[#EF4444]'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

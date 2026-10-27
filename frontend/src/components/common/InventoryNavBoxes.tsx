'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed,
  Hotel,
  ShoppingCart,
  Users,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessModules } from '@/lib/businessSetup';

export interface InventorySubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  badge?: string;
  description?: string;
}

export const INVENTORY_SUB_OPTIONS: InventorySubOption[] = [
  {
    id: 'restaurant-inventory',
    name: 'Restaurant Inventory',
    href: '/inventory?dept=RESTAURANT',
    icon: UtensilsCrossed,
    iconColor: 'text-amber-600 dark:text-amber-400',
    tag: 'KITCHEN',
    badge: 'Kitchen & Bar',
    description: 'Raw food materials, kitchen stock, beverages & bar supplies',
  },
  {
    id: 'hotel-inventory',
    name: 'Hotel Inventory',
    href: '/inventory?dept=HOTEL',
    icon: Hotel,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    tag: 'HOTEL',
    badge: 'Rooms & Linens',
    description: 'Linens, amenities, housekeeping supplies & room consumables',
  },
  {
    id: 'purchases',
    name: 'Purchases',
    href: '/inventory?tab=purchases',
    icon: ShoppingCart,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'PURCHASES',
    badge: 'Inward Orders',
    description: 'Purchase orders, receiving items, vendor invoices & intake',
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    href: '/inventory?tab=suppliers',
    icon: Users,
    iconColor: 'text-sky-600 dark:text-sky-400',
    tag: 'VENDORS',
    badge: 'Vendor Directory',
    description: 'Vendor directory, contact persons, phone numbers & payment terms',
  },
  {
    id: 'stock-transfers',
    name: 'Stock Transfers',
    href: '/inventory?tab=transfers',
    icon: ArrowLeftRight,
    iconColor: 'text-purple-600 dark:text-purple-400',
    tag: 'TRANSFERS',
    badge: 'Dept Movement',
    description: 'Stock movement between main store, kitchen & housekeeping',
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
}> = ({ className, activeId, onSelectOption, counts }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isHotelEnabled, isRestaurantEnabled, isTransfersEnabled } = useBusinessModules();

  const urlDept = searchParams?.get('dept')?.toUpperCase();
  const urlTab = searchParams?.get('tab')?.toLowerCase();

  const visibleOptions = INVENTORY_SUB_OPTIONS.filter((item) => {
    if (item.id === 'restaurant-inventory') return isRestaurantEnabled;
    if (item.id === 'hotel-inventory') return isHotelEnabled;
    if (item.id === 'stock-transfers') return isTransfersEnabled;
    return true;
  });

  return (
    <div className={cn('select-none', className)}>
      <div
        className={cn(
          'grid gap-2.5 sm:gap-3',
          visibleOptions.length === 5
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            : visibleOptions.length === 4
            ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
            : visibleOptions.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2'
        )}
      >
        {visibleOptions.map((item) => {
          const Icon = item.icon;

          // Determine active status:
          // 1. Explicit activeId passed
          // 2. Query param match
          // 3. Sub-path match (e.g. /inventory/restaurant)
          // 4. Default /inventory with no params -> defaults to Restaurant or Hotel
          let isActive = false;
          if (activeId) {
            isActive = activeId === item.id;
          } else if (item.id === 'restaurant-inventory') {
            isActive =
              urlDept === 'RESTAURANT' ||
              pathname === '/inventory/restaurant' ||
              (pathname === '/inventory' && !urlDept && !urlTab && isRestaurantEnabled);
          } else if (item.id === 'hotel-inventory') {
            isActive =
              urlDept === 'HOTEL' ||
              pathname === '/inventory/hotel' ||
              (pathname === '/inventory' && !urlDept && !urlTab && !isRestaurantEnabled && isHotelEnabled);
          } else if (item.id === 'purchases') {
            isActive = urlTab === 'purchases' || pathname === '/inventory/purchases';
          } else if (item.id === 'suppliers') {
            isActive = urlTab === 'suppliers' || pathname === '/inventory/suppliers';
          } else if (item.id === 'stock-transfers') {
            isActive = urlTab === 'transfers' || pathname === '/inventory/transfers';
          }

          const count =
            counts &&
            (item.id === 'restaurant-inventory'
              ? counts.restaurant
              : item.id === 'hotel-inventory'
              ? counts.hotel
              : item.id === 'purchases'
              ? counts.purchases
              : item.id === 'suppliers'
              ? counts.suppliers
              : counts.transfers);

          const handleClick = (e: React.MouseEvent) => {
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
                'group relative flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-all duration-150',
                'rounded-lg border bg-white dark:bg-[#071F1A] shadow-xs min-h-[82px] sm:min-h-[90px]',
                isActive
                  ? 'border-[#0B3D32] bg-[#E8F2EE] text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#0B3D32] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:shadow-xs'
              )}
            >
              {/* Top-Right Badge */}
              <span
                className={cn(
                  'absolute top-1.5 right-1.5 rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider',
                  isActive
                    ? 'border border-[#0B3D32]/30 bg-[#0B3D32]/10 text-[#0B3D32] dark:border-emerald-700/50 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]'
                )}
              >
                {item.tag}
              </span>

              {/* Centered Icon */}
              <div className="mb-2 transition-transform duration-150 group-hover:scale-110">
                <Icon className={cn('w-5 h-5 stroke-[1.8]', item.iconColor)} />
              </div>

              {/* Title & Count */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold leading-tight px-0.5 line-clamp-1">
                  {item.name}
                </span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold',
                      isActive
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Sub-label badge */}
              {item.badge && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

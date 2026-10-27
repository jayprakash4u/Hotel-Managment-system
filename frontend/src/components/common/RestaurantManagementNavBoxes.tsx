'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Table2,
  CalendarCheck,
  Receipt,
  ChefHat,
  UtensilsCrossed,
  Boxes,
  Zap,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RestaurantManagementSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  badge?: string;
  description?: string;
}

export const RESTAURANT_MANAGEMENT_OPTIONS: RestaurantManagementSubOption[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    iconColor: 'text-[#0B3D32] dark:text-emerald-400',
    tag: 'OVERVIEW',
  },
  {
    id: 'quick-sale',
    name: 'Quick Bill',
    href: '/quick-sale',
    icon: Zap,
    iconColor: 'text-amber-500 dark:text-amber-400',
    tag: 'POS',
    badge: 'Quick Sale',
    description: 'Fast walk-in counter sales, takeaway & instant billing',
  },
  {
    id: 'tables',
    name: 'Table Board',
    href: '/tables',
    icon: Table2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'TABLES',
    badge: 'Live Floor',
    description: 'Dining tables, seating status & live table cards',
  },
  {
    id: 'reservations',
    name: 'Table Reservations',
    href: '/tables?tab=RESERVATIONS',
    icon: CalendarCheck,
    iconColor: 'text-sky-600 dark:text-sky-400',
    tag: 'BOOKING',
    badge: 'Advance',
    description: 'Advance dining reservations & guest seating',
  },
  {
    id: 'orders',
    name: 'Orders',
    href: '/tables?tab=ACTIVE_ORDERS',
    icon: Receipt,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    tag: 'ORDERS',
    badge: 'Live Queue',
    description: 'Table, walk-in & takeaway active orders & billing',
  },
  {
    id: 'kitchen',
    name: 'Kitchen Display',
    href: '/restaurant-management?section=kitchen',
    icon: ChefHat,
    iconColor: 'text-amber-600 dark:text-amber-400',
    tag: 'KDS',
    badge: 'Prep Queue',
    description: 'Kitchen Display System (KDS) & chef prep queue',
  },
  {
    id: 'menu',
    name: 'Menu',
    href: '/menu',
    icon: UtensilsCrossed,
    iconColor: 'text-rose-600 dark:text-rose-400',
    tag: 'CATALOG',
    badge: 'Dishes',
    description: 'Food & beverage catalog, recipes & portion rates',
  },
  {
    id: 'inventory',
    name: 'Restaurant Inventory',
    href: '/inventory?filter=restaurant',
    icon: Boxes,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    tag: 'STOCK',
    badge: 'Supplies',
    description: 'Kitchen raw materials, pantry & reorder levels',
  },
  {
    id: 'billing',
    name: 'Bills & Invoices',
    href: '/billing',
    icon: FileText,
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    tag: 'SHARED',
    badge: 'Invoicing',
    description: 'Shared billing history, invoices & settlements',
  },
];

export const RestaurantManagementNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
}> = ({ className, activeId, onSelectOption }) => {
  const pathname = usePathname();

  return (
    <div className={cn('select-none', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-2.5">
        {RESTAURANT_MANAGEMENT_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeId === item.id ||
            pathname === item.href ||
            (item.id === 'quick-sale' && pathname.startsWith('/quick-sale')) ||
            (item.id === 'tables' && pathname === '/tables') ||
            (item.id === 'orders' && (pathname.startsWith('/cafe') || pathname.startsWith('/add-order'))) ||
            (item.id === 'menu' && pathname.startsWith('/menu')) ||
            (item.id === 'inventory' && pathname.startsWith('/inventory')) ||
            (item.id === 'billing' && pathname.startsWith('/billing')) ||
            (item.id === 'dashboard' && pathname === '/');

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

              <div className="mb-2 transition-transform duration-150 group-hover:scale-110">
                <Icon className={cn('w-5 h-5 stroke-[1.8]', item.iconColor)} />
              </div>

              <span className="text-xs font-semibold leading-tight px-0.5 line-clamp-1">
                {item.name}
              </span>

              {item.badge && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
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

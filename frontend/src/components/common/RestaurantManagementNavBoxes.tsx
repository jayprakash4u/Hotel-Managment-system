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
    href: '/restaurant-management',
    icon: LayoutDashboard,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'OVERVIEW',
  },
  {
    id: 'quick-sale',
    name: 'Quick Bill',
    href: '/quick-sale',
    icon: Zap,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'POS',
    badge: 'Quick Sale',
    description: 'Fast walk-in counter sales, takeaway & instant billing',
  },
  {
    id: 'tables',
    name: 'Table Board',
    href: '/tables',
    icon: Table2,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'TABLES',
    badge: 'Live Floor',
    description: 'Dining tables, seating status & live table cards',
  },
  {
    id: 'reservations',
    name: 'Table Reservations',
    href: '/tables?tab=RESERVATIONS',
    icon: CalendarCheck,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'BOOKING',
    badge: 'Advance',
    description: 'Advance dining reservations & guest seating',
  },
  {
    id: 'orders',
    name: 'Orders',
    href: '/tables?tab=ACTIVE_ORDERS',
    icon: Receipt,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'ORDERS',
    badge: 'Live Queue',
    description: 'Table, walk-in & takeaway active orders & billing',
  },
  {
    id: 'kitchen',
    name: 'Kitchen Display',
    href: '/restaurant-management?section=kitchen',
    icon: ChefHat,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'KDS',
    badge: 'Prep Queue',
    description: 'Kitchen Display System (KDS) & chef prep queue',
  },
  {
    id: 'menu',
    name: 'Menu',
    href: '/menu',
    icon: UtensilsCrossed,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'CATALOG',
    badge: 'Dishes',
    description: 'Food & beverage catalog, recipes & portion rates',
  },
  {
    id: 'inventory',
    name: 'Restaurant Inventory',
    href: '/inventory?filter=restaurant',
    icon: Boxes,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'STOCK',
    badge: 'Supplies',
    description: 'Kitchen raw materials, pantry & reorder levels',
  },
  {
    id: 'billing',
    name: 'Bills & Invoices',
    href: '/billing',
    icon: FileText,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
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
          const isExplicitActive = activeId ? activeId === item.id : false;
          const isRouteActive =
            !activeId &&
            (pathname === item.href ||
              (item.id === 'quick-sale' && pathname.startsWith('/quick-sale')) ||
              (item.id === 'tables' && pathname === '/tables') ||
              (item.id === 'orders' && (pathname.startsWith('/cafe') || pathname.startsWith('/add-order'))) ||
              (item.id === 'menu' && pathname.startsWith('/menu')) ||
              (item.id === 'inventory' && pathname.startsWith('/inventory')) ||
              (item.id === 'billing' && pathname.startsWith('/billing')) ||
              (item.id === 'dashboard' && pathname === '/'));
          const isActive = isExplicitActive || isRouteActive;

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
                'rounded-lg border shadow-xs min-h-[82px] sm:min-h-[90px]',
                isActive
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)] text-[var(--brand-primary)] shadow-xs ring-1 ring-[var(--brand-ring)]'
                  : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-body)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-muted)] hover:shadow-xs dark:border-[var(--border-default)] dark:bg-[var(--surface-card)] dark:text-[var(--text-body)] dark:hover:border-[var(--brand-primary)] dark:hover:bg-[var(--surface-muted)]'
              )}
            >
              {/* Top-Right Badge */}
              <span
                className={cn(
                  'absolute top-1.5 right-1.5 rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider',
                  isActive
                    ? 'border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-muted)] dark:border-[var(--border-default)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]'
                )}
              >
                {item.tag}
              </span>

              {/* Centered Icon - Pure Red matching Sidebar */}
              <div className="mb-2 flex items-center justify-center transition-transform duration-150 group-hover:scale-110 text-[#DC2626] dark:text-[#EF4444]">
                <Icon className={cn('w-5 h-5 stroke-[1.8] text-[#DC2626] dark:text-[#EF4444]', item.iconColor)} />
              </div>

              <span
                className={cn(
                  'text-xs font-semibold leading-tight px-0.5 line-clamp-1',
                  isActive
                    ? 'font-bold text-[var(--brand-primary)]'
                    : 'text-[var(--text-body)] group-hover:text-[var(--brand-primary)] dark:text-[var(--text-body)] dark:group-hover:text-[var(--brand-primary)]'
                )}
              >
                {item.name}
              </span>

              {item.badge && (
                <span className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">
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

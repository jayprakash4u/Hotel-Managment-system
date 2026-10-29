'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  CalendarCheck,
  UserCheck,
  LogOut,
  Users,
  Contact,
  Sparkles,
  BedDouble,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HotelManagementSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  badge?: string;
  description?: string;
}

// Dedicated Hotel Sub-Options:
// 1. Dashboard
// 2. Room Board
// 3. Reservations
// 4. Check-In
// 5. Check-Out
// 6. Inhouse Guest
// 7. Guest Directory
// 8. Housekeeping
// 9. Room Setup
// 10. Hotel Stock
export const HOTEL_MANAGEMENT_OPTIONS: HotelManagementSubOption[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/hotel-management',
    icon: LayoutDashboard,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'OVERVIEW',
    badge: 'Occupancy',
    description: 'Hotel occupancy, room status, today check-ins & key metrics',
  },
  {
    id: 'room-board',
    name: 'Room Board',
    href: '/front-desk',
    icon: LayoutGrid,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'ROOMS',
    badge: 'Floor Grid',
    description: 'Floor layout, tape chart & live room status matrix',
  },
  {
    id: 'reservations',
    name: 'Reservations',
    href: '/reservations',
    icon: CalendarCheck,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'BOOKING',
    badge: 'Advance',
    description: 'Advance room bookings & guest reservations',
  },
  {
    id: 'check-in',
    name: 'Check-In',
    href: '/check-in',
    icon: UserCheck,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'ARRIVAL',
    badge: 'Front Desk',
    description: 'Guest arrival check-in, key card & registration',
  },
  {
    id: 'check-out',
    name: 'Check-Out',
    href: '/checkout',
    icon: LogOut,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'DEPART',
    badge: 'Billing',
    description: 'Guest departure, folio balance review & checkout',
  },
  {
    id: 'in-house',
    name: 'Inhouse Guest',
    href: '/active-stays',
    icon: Users,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'STAYS',
    badge: 'In-Stay',
    description: 'Currently resident guests, room folios & stay extensions',
  },
  {
    id: 'guest-directory',
    name: 'Guest Directory',
    href: '/guests',
    icon: Contact,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'CRM',
    badge: 'Profiles',
    description: 'Guest history, contact info, VIP tier & preferences',
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    href: '/housekeeping',
    icon: Sparkles,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'CLEAN',
    badge: 'Turnover',
    description: 'Room cleaning tasks, maid assignments & inspections',
  },
  {
    id: 'room-setup',
    name: 'Room Setup',
    href: '/hotel',
    icon: BedDouble,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'SETUP',
    badge: 'Inventory',
    description: 'Room types, room numbers, floors & master rates',
  },
  {
    id: 'hotel-inventory',
    name: 'Hotel Stock',
    href: '/inventory?dept=HOTEL',
    icon: Boxes,
    iconColor: 'text-[#DC2626] dark:text-[#EF4444]',
    tag: 'STOCK',
    badge: 'Amenities',
    description: 'Linens, guest amenities, toiletries & room supplies',
  },
];

export const HotelManagementNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
}> = ({ className, activeId, onSelectOption }) => {
  const pathname = usePathname();

  return (
    <div className={cn('select-none', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 gap-2 sm:gap-2.5">
        {HOTEL_MANAGEMENT_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isExplicitActive = activeId ? activeId === item.id : false;
          const isRouteActive =
            !activeId &&
            (pathname === item.href ||
              (item.id === 'dashboard' && pathname === '/hotel-management') ||
              (item.id === 'room-board' && (pathname === '/front-desk' || pathname === '/room-board')) ||
              (item.id === 'room-setup' && (pathname === '/hotel' || pathname.startsWith('/hotel') || pathname === '/rooms')) ||
              (item.id === 'hotel-inventory' && pathname.startsWith('/inventory')) ||
              (item.href !== '/hotel-management' && pathname.startsWith(item.href)));
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

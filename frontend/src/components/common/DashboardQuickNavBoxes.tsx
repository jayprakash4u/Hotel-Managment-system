'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BedDouble,
  Table2,
  CalendarCheck,
  UserCheck,
  LogOut,
  Building2,
  UtensilsCrossed,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickNavOptionItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export const DASHBOARD_NAV_OPTIONS: QuickNavOptionItem[] = [
  {
    id: 'room-dashboard',
    name: 'Room Dashboard',
    href: '/rooms',
    icon: BedDouble,
    iconColor: 'text-[#0B3D32] dark:text-emerald-400',
  },
  {
    id: 'table-dashboard',
    name: 'Table Dashboard',
    href: '/tables',
    icon: Table2,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'room-booking',
    name: 'Reservations',
    href: '/reservations',
    icon: CalendarCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'room-checkin',
    name: 'Room Check-In',
    href: '/check-in',
    icon: UserCheck,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'room-checkout',
    name: 'Room Check-Out',
    href: '/checkout',
    icon: LogOut,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'front-desk',
    name: 'Front Desk',
    href: '/front-desk',
    icon: Building2,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'cafe-dining',
    name: 'Cafe & Dining',
    href: '/cafe',
    icon: UtensilsCrossed,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'hotel-setup',
    name: 'Hotel Setup',
    href: '/hotel',
    icon: Settings,
    iconColor: 'text-slate-600 dark:text-slate-300',
  },
];

export const DashboardQuickNavBoxes: React.FC<{ className?: string }> = ({ className }) => {
  const pathname = usePathname();

  return (
    <div className={cn('select-none', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {DASHBOARD_NAV_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-all duration-150',
                'rounded-lg border bg-white dark:bg-[#071F1A] shadow-xs min-h-[76px] sm:min-h-[84px]',
                isActive
                  ? 'border-[#0B3D32] bg-[#E8F2EE] text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#0B3D32] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:shadow-xs'
              )}
            >
              <div className="mb-2 transition-transform duration-150 group-hover:scale-110">
                <Icon className={cn('w-5 h-5 stroke-[1.8]', item.iconColor)} />
              </div>
              <span className="text-xs font-semibold leading-tight px-0.5 line-clamp-1">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

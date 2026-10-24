'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Users,
  LogOut,
  LayoutGrid,
  Sparkles,
  Contact,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HotelManagementSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export const HOTEL_MANAGEMENT_OPTIONS: HotelManagementSubOption[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    iconColor: 'text-[#1A73E8] dark:text-[#8AB4F8]',
  },
  {
    id: 'reservations',
    name: 'Reservations',
    href: '/reservations',
    icon: CalendarCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'check-in',
    name: 'Check-In',
    href: '/check-in',
    icon: UserCheck,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'in-house',
    name: 'In-House Guests',
    href: '/active-stays',
    icon: Users,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'check-out',
    name: 'Check-Out',
    href: '/checkout',
    icon: LogOut,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'room-board',
    name: 'Room Board',
    href: '/front-desk',
    icon: LayoutGrid,
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    href: '/housekeeping',
    icon: Sparkles,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'guest-directory',
    name: 'Guest Directory',
    href: '/guests',
    icon: Contact,
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
];

export const HotelManagementNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
}> = ({ className, activeId }) => {
  const pathname = usePathname();

  return (
    <div className={cn('select-none', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {HOTEL_MANAGEMENT_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeId === item.id ||
            pathname === item.href ||
            (item.id === 'room-board' && (pathname === '/front-desk' || pathname === '/room-board')) ||
            (item.href !== '/' && item.href !== '/front-desk' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-all duration-150',
                'rounded-lg border bg-white dark:bg-[#071F1A] shadow-xs min-h-[76px] sm:min-h-[84px]',
                isActive
                  ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] ring-1 ring-[#1A73E8] dark:border-blue-500 dark:bg-[#1A73E8]/10 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#1A73E8] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:shadow-xs'
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

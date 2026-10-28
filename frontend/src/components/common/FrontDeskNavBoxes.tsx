'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  UserCheck,
  CalendarCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FrontDeskOptionId = 'desk' | 'check-in' | 'reservations' | 'checkout';

export interface FrontDeskOptionItem {
  id: FrontDeskOptionId;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const FRONT_DESK_OPTIONS: FrontDeskOptionItem[] = [
  {
    id: 'desk',
    name: 'Front Desk Matrix',
    href: '/front-desk',
    icon: Building2,
    description: 'Front desk room grid, tape chart & occupancy',
  },
  {
    id: 'check-in',
    name: 'Check-In Desk & Form',
    href: '/check-in',
    icon: UserCheck,
    description: 'Guest check-in station, KYC verification & reg cards',
  },
  {
    id: 'reservations',
    name: 'Reservation List',
    href: '/reservations',
    icon: CalendarCheck,
    description: 'All room bookings & reservations',
  },
  {
    id: 'checkout',
    name: 'Check-Out List',
    href: '/checkout',
    icon: LogOut,
    description: 'Departing guests & bill settlements',
  },
];

export const FrontDeskNavBoxes: React.FC<{
  activeId?: FrontDeskOptionId;
}> = ({ activeId }) => {
  const pathname = usePathname();

  // Determine active item based on prop or pathname
  const currentActiveId: FrontDeskOptionId =
    activeId ||
    (pathname === '/check-in'
      ? 'check-in'
      : pathname === '/reservations' || pathname.startsWith('/reservations/')
      ? 'reservations'
      : pathname === '/checkout'
      ? 'checkout'
      : 'desk');

  return (
    <div className="shrink-0 select-none pb-2">
      {/* 1. TOP ROW: FRONT DESK OPTION BOXES (Matching Hotel Setup Category Boxes) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {FRONT_DESK_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = currentActiveId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group relative flex flex-col items-center justify-center p-2 text-center transition-all duration-150',
                'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px] w-36 sm:w-44',
                isSelected
                  ? 'border-brand bg-brand-subtle text-brand ring-1 ring-brand dark:border-brand dark:bg-brand-subtle dark:text-brand'
                  : 'border-border-default bg-white text-body hover:border-brand hover:bg-surface-hover dark:border-border-default dark:bg-surface-card dark:text-body dark:hover:border-brand'
              )}
              title={item.description}
            >
                <div
                  className={cn(
                    'mb-1 transition-transform group-hover:scale-110 text-muted dark:text-muted'
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-muted dark:text-muted" />
              </div>

              <span
                className={cn(
                  'text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-2 px-0.5',
                  isSelected
                    ? 'font-bold text-brand dark:text-brand'
                    : 'text-body group-hover:text-brand dark:text-body dark:group-hover:text-brand'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 2. STRAIGHT DIVIDER LINE (Full bleed across viewport, matching Hotel Setup) */}
      <div className="shrink-0 -mx-3 sm:-mx-4 lg:-mx-5 border-b border-divider dark:border-border-default my-2 sm:my-2.5" />
    </div>
  );
};

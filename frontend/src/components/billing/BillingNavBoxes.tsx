'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  UtensilsCrossed,
  Hotel,
  AlertCircle,
  Zap,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BillingSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  badge?: string;
  description?: string;
}

export const BILLING_SUB_OPTIONS: BillingSubOption[] = [
  {
    id: 'all-bills',
    name: 'All Bills & Invoices',
    href: '/billing',
    icon: FileText,
    iconColor: 'text-[#0B3D32] dark:text-emerald-400',
    tag: 'SHARED',
    badge: 'Central Ledger',
    description: 'Unified hotel & restaurant bill history & audit',
  },
  {
    id: 'restaurant-bills',
    name: 'Restaurant & POS Bills',
    href: '/billing?type=TABLE_ORDER',
    icon: UtensilsCrossed,
    iconColor: 'text-amber-600 dark:text-amber-400',
    tag: 'DINING',
    badge: 'Orders & Tables',
    description: 'Dine-in, walk-in, room service & takeaway bills',
  },
  {
    id: 'hotel-checkouts',
    name: 'Hotel Invoices',
    href: '/billing?type=HOTEL_CHECKOUT',
    icon: Hotel,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    tag: 'STAYS',
    badge: 'Folio Invoices',
    description: 'Room stays, extra charges & departure tax invoices',
  },
  {
    id: 'due-balances',
    name: 'Unpaid / Due Balances',
    href: '/billing?status=UNPAID',
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
    tag: 'CREDIT',
    badge: 'Pending Settle',
    description: 'Unpaid restaurant tables and partial guest folios',
  },
  {
    id: 'quick-sale-pos',
    name: 'Quick Sale POS',
    href: '/quick-sale',
    icon: Zap,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'COUNTER',
    badge: 'Instant Bill',
    description: 'Fast walk-in counter sales, drinks & snacks',
  },
];

export const BillingNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
}> = ({ className, activeId, onSelectOption }) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5',
        className
      )}
    >
      {BILLING_SUB_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isCurrent =
          activeId === opt.id ||
          (opt.id === 'all-bills' && pathname === '/billing' && !activeId);

        return (
          <Link
            key={opt.id}
            href={opt.href}
            onClick={() => onSelectOption?.(opt.id)}
            className={cn(
              'group relative flex flex-col justify-between p-3 rounded-[3px] border transition-all text-left select-none',
              'bg-white dark:bg-[#071F1A]',
              isCurrent
                ? 'border-[#0B3D32] dark:border-emerald-500 ring-1 ring-[#0B3D32] dark:ring-emerald-500 shadow-2xs'
                : 'border-[#DCE3DF] dark:border-[#145447] hover:border-[#0B3D32]/60 dark:hover:border-emerald-500/60 hover:bg-[#F2F6F4]/50 dark:hover:bg-[#07241E]'
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-[3px] transition-colors',
                    isCurrent
                      ? 'bg-[#0B3D32] text-white'
                      : 'bg-[#F2F6F4] dark:bg-[#0A2E26] group-hover:bg-[#0B3D32] group-hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isCurrent
                        ? 'text-white'
                        : opt.iconColor + ' group-hover:text-white'
                    )}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {opt.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {opt.badge}
                    </span>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {opt.tag}
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-[#24352F] dark:text-white group-hover:text-[#0B3D32] dark:group-hover:text-emerald-300 transition-colors">
                {opt.name}
              </h4>
              {opt.description && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                  {opt.description}
                </p>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#F0F4F2] dark:border-[#103D33] flex items-center justify-between text-[10px] text-slate-400">
              <span className="group-hover:text-[#0B3D32] dark:group-hover:text-emerald-400 font-semibold transition-colors">
                Open view &rarr;
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BedDouble,
  Users,
  LogIn,
  UserCheck,
  Receipt,
  Sparkles,
  BarChart3,
  Settings,
  X,
  Building2,
  Sun,
  Moon,
  UtensilsCrossed,
  ChefHat,
  Boxes,
  ShieldCheck,
  Search,
  Table2,
  CalendarCheck,
  Utensils,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export interface NavBoxItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  category?: string;
  description?: string;
}

const HOTEL_MODULE_OPTIONS: NavBoxItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    tag: 'OVERVIEW',
    description: 'System overview & live metrics',
  },
  {
    id: 'hotel-setup',
    name: 'Hotel Setup',
    href: '/hotel',
    icon: Building2,
    tag: 'SETUP',
    description: 'Resort profile & room types',
  },
  {
    id: 'room-bookings',
    name: 'Room Bookings',
    href: '/reservations',
    icon: CalendarCheck,
    tag: 'BOOKINGS',
    description: 'Customer bookings, stays & folios',
  },
  {
    id: 'book-now',
    name: 'Book Now',
    href: '/check-in',
    icon: LogIn,
    tag: 'BOOKING',
    description: 'Instant room reservation & check-in',
  },
  {
    id: 'book-table',
    name: 'Book Table',
    href: '/tables?action=book',
    icon: Utensils,
    tag: 'TABLE',
    description: 'Reserve dining tables & seating',
  },
  {
    id: 'front-desk',
    name: 'Check-In Desk',
    href: '/front-desk',
    icon: LogIn,
    tag: 'FRONT DESK',
    description: 'Arrivals & key issuance',
  },
  {
    id: 'active-stays',
    name: 'In-House Guests',
    href: '/active-stays',
    icon: Users,
    tag: 'LIVE',
    description: 'Active staying guests & folios',
  },
  {
    id: 'rooms',
    name: 'Rooms',
    href: '/rooms',
    icon: BedDouble,
    tag: 'ROOMS',
    description: 'Live occupancy & floor grid',
  },
  {
    id: 'table',
    name: 'Tables',
    href: '/tables',
    icon: Table2,
    tag: 'TABLES',
    description: 'Clean dining tables & layout cards',
  },
  {
    id: 'guests',
    name: 'Guest CRM',
    href: '/guests',
    icon: UserCheck,
    tag: 'GUESTS',
    description: 'VIP profiles & guest history',
  },
  {
    id: 'cafe',
    name: 'Cafe & Dining',
    href: '/cafe',
    icon: UtensilsCrossed,
    tag: 'F&B POS',
    description: 'Restaurant orders & room service',
  },
  {
    id: 'our-menu',
    name: 'Our Menu',
    href: '/menu',
    icon: ChefHat,
    tag: 'MENU',
    description: 'Dishes, pricing & portions',
  },
  {
    id: 'finance',
    name: 'Bills & Invoices',
    href: '/finance',
    icon: Receipt,
    tag: 'FINANCE',
    description: 'Settlements & payments',
  },
  {
    id: 'housekeeping',
    name: 'Room Cleaning',
    href: '/rooms?tab=housekeeping',
    icon: Sparkles,
    tag: 'CLEANING',
    description: 'Housekeeping task queue',
  },
  {
    id: 'inventory',
    name: 'Inventory Stock',
    href: '/inventory',
    icon: Boxes,
    tag: 'STOCK',
    description: 'Supplies & warehouse levels',
  },
  {
    id: 'staff',
    name: 'Staff & Team',
    href: '/staff',
    icon: ShieldCheck,
    tag: 'STAFF',
    description: 'Shifts, roles & roster',
  },
  {
    id: 'reports',
    name: 'Reports & P&L',
    href: '/reports',
    icon: BarChart3,
    tag: 'ANALYTICS',
    description: 'RevPAR & financial audit',
  },
  {
    id: 'settings',
    name: 'System Config',
    href: '/settings',
    icon: Settings,
    tag: 'CONFIG',
    description: 'System preferences & security',
  },
];

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  // Real-time search filter for navigation box widgets
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return HOTEL_MODULE_OPTIONS;
    const q = searchQuery.toLowerCase().trim();
    return HOTEL_MODULE_OPTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#24352F]/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Box-Type 2-Column Grid Sidebar Panel */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex w-72 sm:w-80 flex-col border-r transition-transform duration-300 select-none shadow-xs',
          'lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0',
          'bg-white border-[#DCE3DF] text-[#24352F] dark:bg-[#071F1A] dark:border-[#145447] dark:text-[#E5EEE9]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Logo & Close Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#E5EEE9] bg-white dark:bg-[#071F1A] dark:border-[#145447]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B3D32] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-[#24352F] dark:text-white leading-tight font-heading">
                AURA GRAND
              </h1>
              <p className="text-[10px] font-semibold text-[#64736C] dark:text-[#B7CDC3]">
                Hospitality OS · Front Desk
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-[#64736C] hover:text-[#24352F] hover:bg-[#F2F4F2] dark:text-[#B7CDC3] dark:hover:text-white dark:hover:bg-[#0B3D32] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Widget Input (Matching Reference Screenshot) */}
        <div className="p-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#879B90] dark:text-[#647F75]" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-9 pr-8 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs transition-all focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:placeholder-[#647F75] dark:focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable 2-Grid Content Area */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {/* 2-Column Grid Box Layout (Direct Normal Grid) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {filteredOptions.map((item) => {
              const isQuery = item.href.includes('?');
              const [baseHref, queryStr] = item.href.split('?');

              let isActive = false;
              if (isQuery) {
                isActive = pathname === baseHref && (currentSearch ? currentSearch.includes(queryStr) : false);
              } else if (item.href === '/') {
                isActive = pathname === '/';
              } else if (pathname === item.href) {
                if (item.id === 'table' && currentSearch.includes('action=book')) {
                  isActive = false;
                } else if (item.id === 'rooms' && currentSearch.includes('tab=housekeeping')) {
                  isActive = false;
                } else {
                  isActive = true;
                }
              } else {
                isActive = pathname.startsWith(`${item.href}/`);
              }

              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (item.href.includes('?')) {
                      setCurrentSearch(`?${item.href.split('?')[1]}`);
                    } else {
                      setCurrentSearch('');
                    }
                    onClose();
                  }}
                  className={cn(
                    'group relative flex flex-col items-center justify-center rounded-[3px] border p-3 pt-4 text-center transition-all duration-150 shadow-2xs',
                    'min-h-[88px] sm:min-h-[94px]',
                    isActive
                      ? 'border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] shadow-xs ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200'
                      : 'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#0B3D32] hover:bg-[#F9FAF9] hover:shadow-xs dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-emerald-500 dark:hover:bg-[#093027]'
                  )}
                >
                  {/* Top-Right Widget Badge (Exact Reference Style) */}
                  <span
                    className={cn(
                      'absolute top-1.5 right-1.5 rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider',
                      isActive
                        ? 'border border-[#A51F36]/30 bg-[#A51F36]/10 text-[#A51F36] dark:border-rose-700/50 dark:bg-rose-950 dark:text-rose-300'
                        : 'border border-[#E5EEE9] bg-[#F7F5F0] text-[#64736C] dark:border-[#145447] dark:bg-[#041A15] dark:text-[#8CA498]'
                    )}
                  >
                    {item.tag}
                  </span>

                  {/* Centered Icon (Default Red) */}
                  <div
                    className={cn(
                      'flex items-center justify-center mb-2 transition-transform group-hover:scale-110',
                      isActive
                        ? 'text-[#A51F36] dark:text-rose-300'
                        : 'text-[#A51F36] group-hover:text-[#7F1D1D] dark:text-rose-400 dark:group-hover:text-rose-300'
                    )}
                  >
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  {/* Label Text Below Icon (Matching Reference Screenshot) */}
                  <span
                    className={cn(
                      'text-xs font-semibold leading-tight line-clamp-2 px-1',
                      isActive
                        ? 'font-bold text-[#A51F36] dark:text-rose-200'
                        : 'text-[#24352F] group-hover:text-[#0B3D32] dark:text-white dark:group-hover:text-emerald-300'
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Empty search fallback */}
          {filteredOptions.length === 0 && (
            <div className="py-8 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#64736C] dark:text-[#8CA498]">
                No widgets match &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Footer Quick Controls: Theme Toggle & System Status */}
        <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-[#DCE3DF] bg-white text-[#24352F] hover:bg-[#F2F4F2] hover:border-[#879B90] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:hover:bg-[#093027] transition-all"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-[#FDE68A]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#0B3D32]" />
              )}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Mode'}</span>
            </div>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F2F4F2] text-[#43534D] dark:bg-[#05201B] dark:text-[#B7CDC3]">
              {theme}
            </span>
          </button>

          {/* Live Operational Status */}
          <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-[#52635B] dark:text-[#9FB5AB]">
            <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="font-semibold text-[#24352F] dark:text-white truncate">
              Front Desk Online
            </span>
            <span className="text-[10px] ml-auto text-[#879B90]">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

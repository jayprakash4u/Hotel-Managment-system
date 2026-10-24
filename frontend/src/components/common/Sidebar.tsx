'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
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
  UtensilsCrossed,
  ChefHat,
  Boxes,
  ShieldCheck,
  Search,
  Table2,
  CalendarCheck,
  Utensils,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ConciergeBell,
} from 'lucide-react';
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
    description: 'Resort profile, masters & setup',
  },
  {
    id: 'front-desk',
    name: 'Front Desk',
    href: '/front-desk',
    icon: ConciergeBell,
    tag: 'DESK',
    description: 'Check-in Desk, Check-In List, Reservation List & Check-Out List',
  },
  {
    id: 'rooms',
    name: 'Room Management',
    href: '/rooms',
    icon: BedDouble,
    tag: 'ROOMS',
    description: 'Room availability, cleaning & maintenance',
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
    name: 'Stay History & Reports',
    href: '/reports',
    icon: BarChart3,
    tag: 'REPORTS',
    description: 'Guest stays, dining orders, payments & cancellations',
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

export const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle?: () => void;
  onClose: () => void;
}> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  // Real-time search filter for navigation box widgets
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return HOTEL_MODULE_OPTIONS;
    const q = searchQuery.toLowerCase().trim();
    return HOTEL_MODULE_OPTIONS.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchTag = item.tag.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      return matchName || matchTag || matchDesc;
    });
  }, [searchQuery]);

  const [hoveredItem, setHoveredItem] = useState<{
    item: NavBoxItem;
    top: number;
  } | null>(null);
  const [hoveredToggle, setHoveredToggle] = useState<number | null>(null);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#24352F]/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel: Full 2-column or Slim Mini Icon Rail */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r select-none shadow-xs transition-all duration-300 ease-in-out',
          'bg-white border-[#DCE3DF] text-[#24352F] dark:bg-[#071F1A] dark:border-[#145447] dark:text-[#E5EEE9]',
          isOpen
            ? 'w-72 sm:w-80 translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-[68px] lg:sticky lg:top-0 lg:h-screen lg:shrink-0'
        )}
      >
        {/* ===================== BRAND HEADER ===================== */}
        {isOpen ? (
          <div className="flex h-16 items-center justify-between px-4 border-b border-[#E2E8F0] bg-white dark:bg-[#0F172A] dark:border-[#334155] shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A73E8] text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-black tracking-wide text-[#1E293B] dark:text-white leading-tight font-heading">
                  AURA GRAND
                </h1>
                <p className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] truncate">
                  Hospitality OS · Front Desk
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex lg:hidden items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-800 dark:text-slate-400"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center border-b border-[#E2E8F0] bg-white dark:bg-[#0F172A] dark:border-[#334155] shrink-0">
            <Link
              href="/"
              title="Aura Grand Hospitality OS"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A73E8] text-white shadow-xs hover:scale-105 transition-transform shrink-0"
            >
              <Building2 className="w-5 h-5 text-white" />
            </Link>
          </div>
        )}

        {/* ===================== SEARCH BAR ===================== */}
        {isOpen && (
          <div className="p-3 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search widgets & lists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[3px] border border-[#CBD5E1] bg-white py-2 pl-9 pr-8 text-xs font-medium text-[#1E293B] placeholder-[#94A3B8] shadow-2xs transition-all focus:border-[#1A73E8] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] dark:border-[#334155] dark:bg-[#1E293B] dark:text-white dark:placeholder-[#64748B] dark:focus:border-[#1A73E8]"
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
        )}

        {/* ===================== NAVIGATION CONTENT ===================== */}
        {isOpen ? (
          /* EXPANDED: 2-Column Grid Box Layout with Sub-Options Accordion */
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {filteredOptions.map((item) => {
                const isQuery = item.href.includes('?');
                const [baseHref, queryStr] = item.href.split('?');

                let isActive = false;
                if (item.id === 'front-desk') {
                  isActive = ['/front-desk', '/booking', '/check-in', '/checkout', '/reservations'].some((p) => pathname.startsWith(p));
                } else if (isQuery) {
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
                        ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] shadow-xs ring-1 ring-[#1A73E8] dark:border-blue-600 dark:bg-[#1A73E8]/10 dark:text-blue-200'
                        : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:border-[#1A73E8] hover:bg-[#F8FAFC] hover:shadow-xs dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#E2E8F0] dark:hover:border-blue-400 dark:hover:bg-[#1E293B]/80'
                    )}
                  >
                    {/* Top-Right Widget Badge */}
                    <span
                      className={cn(
                        'absolute top-1.5 right-1.5 rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider',
                        isActive
                          ? 'border border-[#1A73E8]/30 bg-[#1A73E8]/10 text-[#1A73E8] dark:border-blue-700/50 dark:bg-blue-950 dark:text-blue-300'
                          : 'border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]'
                      )}
                    >
                      {item.tag}
                    </span>

                    {/* Centered Icon - Pure Red per user specification */}
                    <div
                      className={cn(
                        'flex items-center justify-center mb-2 transition-transform group-hover:scale-110 text-[#DC2626] dark:text-[#EF4444]'
                      )}
                    >
                      <Icon className="w-6 h-6 stroke-[1.8] text-[#DC2626] dark:text-[#EF4444]" />
                    </div>

                    {/* Label Text Below Icon */}
                    <span
                      className={cn(
                        'text-xs font-semibold leading-tight line-clamp-2 px-1',
                        isActive
                          ? 'font-bold text-[#1A73E8] dark:text-blue-200'
                          : 'text-[#1E293B] group-hover:text-[#1A73E8] dark:text-white dark:group-hover:text-blue-300'
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
                <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  No widgets match &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-[#1A73E8] dark:text-blue-400 hover:underline"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        ) : (
          /* COLLAPSED: Mini Rail of Icons with Hover Popover */
          <div
            className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar flex flex-col items-center gap-1.5"
            onScroll={() => setHoveredItem(null)}
          >
            {HOTEL_MODULE_OPTIONS.map((item) => {
              const isQuery = item.href.includes('?');
              const [baseHref, queryStr] = item.href.split('?');

              let isActive = false;
              if (item.id === 'front-desk') {
                isActive = ['/front-desk', '/booking', '/check-in', '/checkout', '/reservations'].some((p) => pathname.startsWith(p));
              } else if (isQuery) {
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
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredItem({
                      item,
                      top: rect.top + rect.height / 2,
                    });
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => {
                    if (item.href.includes('?')) {
                      setCurrentSearch(`?${item.href.split('?')[1]}`);
                    } else {
                      setCurrentSearch('');
                    }
                    setHoveredItem(null);
                    onClose();
                  }}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-lg border transition-all duration-150 group shrink-0',
                    isActive
                      ? 'border-[#1A73E8] bg-[#E8F0FE] shadow-xs ring-1 ring-[#1A73E8] dark:border-blue-600 dark:bg-[#1A73E8]/20'
                      : 'border-transparent hover:border-[#CBD5E1] hover:bg-slate-50 dark:hover:border-[#334155] dark:hover:bg-[#1E293B]'
                  )}
                >
                  <Icon className="w-5 h-5 text-[#DC2626] dark:text-[#EF4444]" />
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-1 rounded-r-full bg-[#1A73E8] dark:bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* ===================== FOOTER TOGGLE BUTTON ===================== */}
        <div
          className={cn(
            'border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] shrink-0 p-2.5',
            isOpen ? 'flex justify-end' : 'flex justify-center'
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            onMouseEnter={(e) => {
              if (!isOpen) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredToggle(rect.top + rect.height / 2);
              }
            }}
            onMouseLeave={() => setHoveredToggle(null)}
            title={isOpen ? 'Collapse sidebar (<)' : 'Expand sidebar (>)'}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5D0] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1A73E8] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#8AB4F8] transition-all cursor-pointer shadow-2xs group"
          >
            {isOpen ? (
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-[#1A73E8] dark:text-[#8AB4F8]" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 text-[#1A73E8] dark:text-[#8AB4F8]" />
            )}
          </button>
        </div>
      </aside>

      {/* ===================== FLOATING HOVER TOOLTIPS FOR MINI RAIL ===================== */}
      {!isOpen && hoveredItem && (
        <div
          className="fixed z-50 transition-all duration-100 ease-out"
          style={{
            left: '74px',
            top: `${hoveredItem.top}px`,
            transform: 'translateY(-50%)',
          }}
          onMouseEnter={() => setHoveredItem(hoveredItem)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="relative rounded-lg border border-[#CBD5D0] bg-white px-3.5 py-2.5 shadow-xl dark:border-[#145447] dark:bg-[#07241E] whitespace-nowrap min-w-[200px] max-w-[290px] animate-in fade-in zoom-in-95 duration-100">
            {/* Notch pointing left to the icon */}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 border-l border-b border-[#CBD5D0] bg-white dark:border-[#145447] dark:bg-[#07241E]" />

            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-xs text-[#24352F] dark:text-white">
                  {hoveredItem.item.name}
                </span>
                <span className="rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider border border-[#CBD5D0] bg-[#F7F5F0] text-[#64736C] dark:border-[#145447] dark:bg-[#041A15] dark:text-[#8CA498]">
                  {hoveredItem.item.tag}
                </span>
              </div>
              {hoveredItem.item.description && (
                <p className="text-[10px] text-[#64736C] dark:text-[#9FB5AB] leading-tight whitespace-normal">
                  {hoveredItem.item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Toggle Button Hover Tooltip */}
      {!isOpen && hoveredToggle && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-100 ease-out"
          style={{
            left: '74px',
            top: `${hoveredToggle}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="relative rounded-md border border-[#CBD5D0] bg-white px-2.5 py-1 shadow-lg dark:border-[#145447] dark:bg-[#07241E] whitespace-nowrap text-[11px] font-medium text-[#24352F] dark:text-white">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 border-l border-b border-[#CBD5D0] bg-white dark:border-[#145447] dark:bg-[#07241E]" />
            Expand sidebar
          </div>
        </div>
      )}
    </>
  );
};

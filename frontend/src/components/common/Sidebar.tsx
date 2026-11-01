'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Receipt,
  Settings,
  X,
  Building2,
  UtensilsCrossed,
  ChefHat,
  Search,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Hotel,
  BarChart3,
  Zap,
  Boxes,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  FileText,
  LayoutDashboard,
  Table2,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  LayoutGrid,
  UserCheck,
  LogOut,
  Contact,
  Sparkles,
  BedDouble,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessModules } from '@/lib/businessSetup';
import { useRole } from '@/context/RoleContext';

export interface NavBoxItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  category?: string;
  description?: string;
}

export const HOTEL_SIDEBAR_OPTIONS: NavBoxItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/hotel-management',
    icon: LayoutDashboard,
    tag: 'OVERVIEW',
    description: 'Hotel occupancy, room status, today check-ins & metrics',
  },
  {
    id: 'room-board',
    name: 'Room Board',
    href: '/front-desk',
    icon: LayoutGrid,
    tag: 'ROOMS',
    description: 'Live room status matrix, tape chart & front desk floor grid',
  },
  {
    id: 'reservations',
    name: 'Reservations',
    href: '/reservations',
    icon: CalendarCheck,
    tag: 'BOOKING',
    description: 'Advance room bookings & guest reservations',
  },
  {
    id: 'check-in',
    name: 'Check-In',
    href: '/check-in',
    icon: UserCheck,
    tag: 'ARRIVAL',
    description: 'Guest arrival check-in, key assignment & registration',
  },
  {
    id: 'check-out',
    name: 'Check-Out',
    href: '/checkout',
    icon: LogOut,
    tag: 'DEPART',
    description: 'Guest departure, folio bill settlement & checkout',
  },
  {
    id: 'in-house',
    name: 'In-House Guests',
    href: '/active-stays',
    icon: Users,
    tag: 'STAYS',
    description: 'Currently resident guests, room folios & extensions',
  },
  {
    id: 'guest-directory',
    name: 'Guest Directory',
    href: '/guests',
    icon: Contact,
    tag: 'CRM',
    description: 'Guest history, VIP tiers, preferences & profiles',
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    href: '/housekeeping',
    icon: Sparkles,
    tag: 'CLEAN',
    description: 'Room cleaning tasks, maid assignments & inspections',
  },
  {
    id: 'room-setup',
    name: 'Room Setup',
    href: '/hotel',
    icon: BedDouble,
    tag: 'SETUP',
    description: 'Room types, inventory numbers, floors & master rates',
  },
  {
    id: 'hotel-inventory',
    name: 'Hotel Stock',
    href: '/inventory?dept=HOTEL',
    icon: Boxes,
    tag: 'STOCK',
    description: 'Linens, toiletries, amenities & housekeeping supplies',
  },
  {
    id: 'bills-invoices',
    name: 'Bills & Invoices',
    href: '/billing',
    icon: FileText,
    tag: 'BILLS',
    description: 'Central hotel folios, guest invoices & tax receipts',
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports?section=hotel',
    icon: BarChart3,
    tag: 'REPORTS',
    description: 'Hotel occupancy reports, RevPAR & audit reports',
  },
  {
    id: 'accounts',
    name: 'Accounts',
    href: '/accounts',
    icon: BookOpen,
    tag: 'ACCOUNTS',
    description: 'General accounting, ledgers & financial reports',
  },
  {
    id: 'administration',
    name: 'Administration',
    href: '/administration',
    icon: Settings,
    tag: 'ADMIN',
    description: 'Property settings, staff permissions & business profile',
  },
];

export const RESTAURANT_SIDEBAR_OPTIONS: NavBoxItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/restaurant-management',
    icon: LayoutDashboard,
    tag: 'OVERVIEW',
    description: 'Daily restaurant sales, active tables & summary',
  },
  {
    id: 'table-board',
    name: 'Table Board',
    href: '/tables',
    icon: Table2,
    tag: 'TABLES',
    description: 'Floor layout, seating status & live table cards',
  },
  {
    id: 'table-reservations',
    name: 'Table Reservations',
    href: '/tables?tab=RESERVATIONS',
    icon: CalendarCheck,
    tag: 'BOOKING',
    description: 'Advance dining reservations & guest seating',
  },
  {
    id: 'orders',
    name: 'Orders',
    href: '/tables?tab=ACTIVE_ORDERS',
    icon: Receipt,
    tag: 'ORDERS',
    description: 'Live table, walk-in & takeaway active orders',
  },
  {
    id: 'kitchen-display',
    name: 'Kitchen Display',
    href: '/restaurant-management?section=kitchen',
    icon: ChefHat,
    tag: 'KDS',
    description: 'Live kitchen order tickets & prep queue',
  },
  {
    id: 'quick-bill',
    name: 'Quick Bill',
    href: '/quick-sale',
    icon: Zap,
    tag: 'POS',
    description: 'Counter sales, takeaway & instant billing',
  },
  {
    id: 'menu',
    name: 'Menu',
    href: '/menu',
    icon: UtensilsCrossed,
    tag: 'MENU',
    description: 'Food & drinks catalog, portion rates & categories',
  },
  {
    id: 'restaurant-inventory',
    name: 'Restaurant Inventory',
    href: '/inventory?dept=RESTAURANT',
    icon: Boxes,
    tag: 'STOCK',
    description: 'Kitchen raw materials, beverages & pantry stock',
  },
  {
    id: 'purchases',
    name: 'Purchases',
    href: '/inventory?tab=purchases',
    icon: ShoppingCart,
    tag: 'PURCHASE',
    description: 'Supplier purchase orders, receiving & invoices',
  },
  {
    id: 'bills-invoices',
    name: 'Bills & Invoices',
    href: '/billing',
    icon: FileText,
    tag: 'BILLS',
    description: 'All central bills, tax invoices & audit trail',
  },
  {
    id: 'payments-refunds',
    name: 'Payments & Refunds',
    href: '/billing?status=PAID',
    icon: CreditCard,
    tag: 'PAYMENTS',
    description: 'Settled receipts, payment records & refunds',
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports?section=restaurant',
    icon: BarChart3,
    tag: 'REPORTS',
    description: 'Restaurant revenue, popular items & shift summaries',
  },
];

const BOTTOM_NAV_OPTIONS: NavBoxItem[] = [];

export const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle?: () => void;
  onClose: () => void;
  onOpenProfile?: () => void;
}> = ({
  isOpen,
  onToggle,
  onClose,
  onOpenProfile,
}) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  const { moduleType, isHotelEnabled, isRestaurantEnabled } = useBusinessModules();
  const { role } = useRole();

  const isRestaurantPath = useMemo(() => {
    return [
      '/restaurant-management',
      '/tables',
      '/quick-sale',
      '/menu',
      '/kitchen',
      '/cafe',
      '/restaurant-setup',
    ].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }, [pathname]);

  const isHotelPath = useMemo(() => {
    return [
      '/hotel-management',
      '/front-desk',
      '/room-board',
      '/rooms',
      '/booking',
      '/check-in',
      '/checkout',
      '/reservations',
      '/active-stays',
      '/housekeeping',
      '/guests',
      '/hotel',
    ].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }, [pathname]);

  const [viewMode, setViewMode] = useState<'RESTAURANT' | 'HOTEL'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hospitality_view_mode');
      if (stored === 'RESTAURANT' || stored === 'HOTEL') return stored;
    }
    if (moduleType === 'RESTAURANT_ONLY') return 'RESTAURANT';
    if (moduleType === 'HOTEL_ONLY') return 'HOTEL';
    if (isRestaurantPath) return 'RESTAURANT';
    return 'HOTEL';
  });

  const handleSetViewMode = (mode: 'RESTAURANT' | 'HOTEL') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hospitality_view_mode', mode);
      window.dispatchEvent(new CustomEvent('hospitality_view_mode_changed', { detail: mode }));
    }
  };

  useEffect(() => {
    const handleModeEvent = (e: any) => {
      if (e.detail === 'RESTAURANT' || e.detail === 'HOTEL') {
        setViewMode(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hospitality_view_mode_changed', handleModeEvent);
      return () => window.removeEventListener('hospitality_view_mode_changed', handleModeEvent);
    }
  }, []);

  useEffect(() => {
    if (moduleType === 'RESTAURANT_ONLY') {
      handleSetViewMode('RESTAURANT');
    } else if (moduleType === 'HOTEL_ONLY') {
      handleSetViewMode('HOTEL');
    } else if (isRestaurantPath) {
      handleSetViewMode('RESTAURANT');
    } else if (isHotelPath) {
      handleSetViewMode('HOTEL');
    }
  }, [pathname, moduleType, isRestaurantPath, isHotelPath]);

  const roleFilteredHotelOptions = useMemo(() => {
    if (!isHotelEnabled) return [];
    return HOTEL_SIDEBAR_OPTIONS.filter((item) => {
      if (role === 'CHEF') {
        return ['dashboard', 'hotel-inventory', 'reports'].includes(item.id);
      }
      if (role === 'HOUSEKEEPING') {
        return ['dashboard', 'room-board', 'housekeeping', 'hotel-inventory'].includes(item.id);
      }
      if (role === 'FRONT_DESK') {
        return [
          'dashboard',
          'room-board',
          'reservations',
          'check-in',
          'check-out',
          'in-house',
          'guest-directory',
          'housekeeping',
          'bills-invoices',
          'reports',
        ].includes(item.id);
      }
      if (role === 'POS_CASHIER') {
        return ['dashboard', 'bills-invoices', 'reports'].includes(item.id);
      }
      return true;
    });
  }, [role, isHotelEnabled]);

  const roleFilteredRestaurantOptions = useMemo(() => {
    if (!isRestaurantEnabled) return [];
    return RESTAURANT_SIDEBAR_OPTIONS.filter((item) => {
      if (role === 'CHEF') {
        return ['kitchen-display', 'orders', 'menu', 'restaurant-inventory', 'reports'].includes(item.id);
      }
      if (role === 'HOUSEKEEPING') {
        return ['table-board'].includes(item.id);
      }
      if (role === 'POS_CASHIER') {
        return ['dashboard', 'table-board', 'table-reservations', 'orders', 'quick-bill', 'menu', 'bills-invoices', 'payments-refunds'].includes(item.id);
      }
      if (role === 'FRONT_DESK') {
        return ['dashboard', 'table-board', 'table-reservations', 'orders', 'quick-bill', 'bills-invoices', 'payments-refunds'].includes(item.id);
      }
      return true;
    });
  }, [role, isRestaurantEnabled]);

  const displayModuleOptions = useMemo(() => {
    if (viewMode === 'RESTAURANT') {
      return roleFilteredRestaurantOptions;
    }
    return roleFilteredHotelOptions;
  }, [viewMode, roleFilteredRestaurantOptions, roleFilteredHotelOptions]);

  // Real-time search filter for navigation box widgets
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return displayModuleOptions;
    const q = searchQuery.toLowerCase().trim();
    return displayModuleOptions.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchTag = item.tag.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      return matchName || matchTag || matchDesc;
    });
  }, [searchQuery, displayModuleOptions]);

  const getIsActive = (item: NavBoxItem) => {
    const isQuery = item.href.includes('?');
    const [baseHref, queryStr] = item.href.split('?');

    if (item.id === 'dashboard') {
      if (viewMode === 'HOTEL') {
        return pathname === '/hotel-management' || pathname === '/';
      } else {
        return pathname === '/restaurant-management' && (!currentSearch || currentSearch === '');
      }
    }
    if (item.id === 'room-board') {
      return pathname === '/front-desk' || pathname === '/room-board';
    }
    if (item.id === 'reservations') {
      return pathname === '/reservations' || pathname === '/booking';
    }
    if (item.id === 'check-in') {
      return pathname === '/check-in';
    }
    if (item.id === 'check-out') {
      return pathname === '/checkout';
    }
    if (item.id === 'in-house') {
      return pathname === '/active-stays';
    }
    if (item.id === 'guest-directory') {
      return pathname === '/guests';
    }
    if (item.id === 'housekeeping') {
      return pathname === '/housekeeping';
    }
    if (item.id === 'room-setup') {
      return pathname === '/hotel' || pathname.startsWith('/hotel') || pathname === '/rooms';
    }
    if (item.id === 'hotel-inventory') {
      return pathname.startsWith('/inventory') && (currentSearch.includes('dept=HOTEL') || currentSearch.includes('filter=hotel'));
    }
    if (item.id === 'table-board') {
      return pathname === '/tables' && (!currentSearch || currentSearch === '' || currentSearch.includes('tab=TABLE_BOARD') || currentSearch.includes('tab=FLOOR_PLAN'));
    }
    if (item.id === 'table-reservations') {
      return pathname === '/tables' && currentSearch.includes('tab=RESERVATIONS');
    }
    if (item.id === 'orders') {
      return pathname === '/tables' && currentSearch.includes('tab=ACTIVE_ORDERS');
    }
    if (item.id === 'kitchen-display') {
      return pathname === '/restaurant-management' && currentSearch.includes('section=kitchen');
    }
    if (item.id === 'quick-bill') {
      return pathname.startsWith('/quick-sale');
    }
    if (item.id === 'menu') {
      return pathname.startsWith('/menu');
    }
    if (item.id === 'restaurant-inventory') {
      return pathname.startsWith('/inventory') && (currentSearch.includes('dept=RESTAURANT') || currentSearch.includes('filter=restaurant'));
    }
    if (item.id === 'purchases') {
      return pathname.startsWith('/inventory') && currentSearch.includes('tab=purchases');
    }
    if (item.id === 'bills-invoices') {
      return pathname.startsWith('/billing') && (!currentSearch || !currentSearch.includes('status=PAID'));
    }
    if (item.id === 'payments-refunds') {
      return pathname.startsWith('/billing') && currentSearch.includes('status=PAID');
    }
    if (item.id === 'reports') {
      return pathname.startsWith('/reports');
    }
    if (item.id === 'administration') {
      return ['/administration', '/staff', '/settings'].some((p) => pathname === p || pathname.startsWith(`${p}/`));
    }
    if (isQuery) {
      return pathname === baseHref && (currentSearch ? currentSearch.includes(queryStr) : false);
    }
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

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
          'bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-body)] dark:bg-[var(--surface-card)] dark:border-[var(--border-default)] dark:text-[var(--text-body)]',
          isOpen
            ? 'w-72 sm:w-80 translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-[68px] lg:sticky lg:top-0 lg:h-screen lg:shrink-0'
        )}
      >
        {/* ===================== BRAND HEADER ===================== */}
        {isOpen ? (
          <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border-divider)] bg-[var(--surface-card)] dark:bg-[var(--surface-card)] dark:border-[var(--border-default)] shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-black tracking-wide text-[var(--text-heading)] dark:text-[var(--text-heading)] leading-tight font-heading">
                  AURA GRAND
                </h1>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] dark:text-[var(--text-muted)] truncate">
                  {viewMode === 'RESTAURANT' ? 'Restaurant POS & Outlets' : 'Hospitality OS · Front Desk'}
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
          <div className="flex h-16 items-center justify-center border-b border-[var(--border-divider)] bg-[var(--surface-card)] dark:bg-[var(--surface-card)] dark:border-[var(--border-default)] shrink-0">
            <Link
              href="/"
              title="Aura Grand Hospitality OS"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs hover:scale-105 transition-transform shrink-0"
            >
              <Building2 className="w-5 h-5 text-white" />
            </Link>
          </div>
        )}

        {/* ===================== MODULE MODE SWITCHER (HOTEL vs RESTAURANT) ===================== */}
        {isHotelEnabled && isRestaurantEnabled && (
          isOpen ? (
            <div className="px-3 pt-2.5 pb-1 bg-[var(--surface-card)] dark:bg-[var(--surface-card)] shrink-0">
              <div className="grid grid-cols-2 p-0.5 rounded-[4px] bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)] border border-[var(--border-default)] dark:border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('RESTAURANT')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer',
                    viewMode === 'RESTAURANT'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--brand-primary)] dark:text-[var(--text-muted)] dark:hover:text-[var(--brand-primary)]'
                  )}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Restaurant</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('HOTEL')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer',
                    viewMode === 'HOTEL'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--brand-primary)] dark:text-[var(--text-muted)] dark:hover:text-[var(--brand-primary)]'
                  )}
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span>Hotel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2 flex justify-center border-b border-[#E2E8F0] dark:border-[#334155] shrink-0">
              <button
                type="button"
                onClick={() => handleSetViewMode(viewMode === 'RESTAURANT' ? 'HOTEL' : 'RESTAURANT')}
                title={viewMode === 'RESTAURANT' ? 'Switch to Hotel Navigation' : 'Switch to Restaurant Navigation'}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)] border border-[var(--border-default)] dark:border-[var(--border-default)] text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer shadow-2xs"
              >
                {viewMode === 'RESTAURANT' ? <UtensilsCrossed className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
              </button>
            </div>
          )
        )}

        {/* ===================== SEARCH BAR ===================== */}
        {isOpen && (
          <div className="p-3 border-b border-[var(--border-divider)] dark:border-[var(--border-default)] bg-[var(--surface-muted)] dark:bg-[var(--surface-muted)] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={viewMode === 'RESTAURANT' ? 'Search restaurant tasks...' : 'Search widgets & lists...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[3px] border border-[var(--border-input)] bg-[var(--surface-card)] py-2 pl-9 pr-8 text-xs font-medium text-[var(--text-body)] placeholder-[var(--text-placeholder)] shadow-2xs transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus-ring-[var(--brand-primary)] dark:border-[var(--border-input)] dark:bg-[var(--surface-card)] dark:text-[var(--text-body)] dark:placeholder-[var(--text-muted)] dark:focus:border-[var(--brand-primary)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-body)] dark:hover:text-[var(--text-inverse)]"
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
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {filteredOptions.map((item) => {
                const isActive = getIsActive(item);
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
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={cn(
                      'group relative flex flex-col items-center justify-center rounded-[3px] border p-3 pt-4 text-center transition-all duration-150 shadow-2xs',
                      'min-h-[88px] sm:min-h-[94px]',
                      isActive
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)] text-[var(--brand-primary)] shadow-xs ring-1 ring-[var(--brand-ring)]'
                        : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-body)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-muted)] hover:shadow-xs dark:border-[var(--border-default)] dark:bg-[var(--surface-card)] dark:text-[var(--text-body)] dark:hover:border-[var(--brand-primary)] dark:hover:bg-[var(--surface-muted)]'
                    )}
                  >
                    {/* Top-Right Widget Badge */}
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
                          ? 'font-bold text-[var(--brand-primary)]'
                          : 'text-[var(--text-body)] group-hover:text-[var(--brand-primary)] dark:text-[var(--text-body)] dark:group-hover:text-[var(--brand-primary)]'
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
                  No items match &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-bold text-[var(--brand-primary)] hover:underline"
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
            {displayModuleOptions.map((item) => {
              const isActive = getIsActive(item);
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
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-lg border transition-all duration-150 group shrink-0',
                    isActive
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)] shadow-xs ring-1 ring-[var(--brand-ring)]'
                      : 'border-transparent hover:border-[var(--border-default)] hover:bg-[var(--surface-muted)] dark:hover:border-[var(--border-default)] dark:hover:bg-[var(--surface-muted)]'
                  )}
                >
                  <Icon className="w-5 h-5 text-[var(--accent-danger)] dark:text-[var(--accent-danger)]" />
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-1 rounded-r-full bg-[var(--brand-primary)]" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* ===================== BOTTOM UTILITY SECTION (HELP & PROFILE) ===================== */}
        <div className="border-t border-[var(--border-divider)] dark:border-[var(--border-default)] bg-[var(--surface-card)] dark:bg-[var(--surface-card)] p-2 space-y-1 shrink-0">
          {BOTTOM_NAV_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return isOpen ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (item.id === 'profile' && onOpenProfile) {
                    e.preventDefault();
                    onOpenProfile();
                  }
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)] text-[var(--brand-primary)] ring-1 ring-[var(--brand-ring)]'
                    : 'border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:bg-[var(--surface-muted)] dark:text-[var(--text-muted)] dark:hover:border-[var(--border-default)] dark:hover:bg-[var(--surface-muted)]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444]" />
                  <span>{item.name}</span>
                </div>
                <span className="rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-muted)] dark:border-[var(--border-default)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-muted)]">
                  {item.tag}
                </span>
              </Link>
            ) : (
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
                onClick={(e) => {
                  if (item.id === 'profile' && onOpenProfile) {
                    e.preventDefault();
                    onOpenProfile();
                  }
                  setHoveredItem(null);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={cn(
                  'relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg border transition-all duration-150 group shrink-0',
                  isActive
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] shadow-xs ring-1 ring-[var(--brand-primary)]'
                    : 'border-transparent hover:border-[#CBD5E1] hover:bg-slate-50 dark:hover:border-[#334155] dark:hover:bg-[#1E293B]'
                )}
              >
                <Icon className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444]" />
              </Link>
            );
          })}
        </div>

        {/* ===================== FOOTER TOGGLE BUTTON & ACTIONS ===================== */}
        <div
          className={cn(
            'border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] shrink-0 p-2.5',
            isOpen ? 'flex items-center justify-end gap-2' : 'flex flex-col items-center gap-2'
          )}
        >
          <button
            type="button"
            title="Dashboard"
            aria-label="Dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5D0] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[var(--brand-primary)] dark:border-[#334155] dark:bg-[#1E293B] transition-all cursor-pointer shadow-2xs group"
          >
            <LayoutDashboard className="w-4 h-4 text-[var(--brand-primary)] transition-transform group-hover:scale-105" />
          </button>
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5D0] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[var(--brand-primary)] dark:border-[#334155] dark:bg-[#1E293B] transition-all cursor-pointer shadow-2xs group"
          >
            {isOpen ? (
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-[var(--brand-primary)]" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 text-[var(--brand-primary)]" />
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

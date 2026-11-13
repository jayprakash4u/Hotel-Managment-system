'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export interface WorkspaceTab {
  id: string; // unique tab identifier (e.g. '/billing' or '/tables?tab=RESERVATIONS')
  path: string; // full URL to push
  title: string;
  iconName: string;
  closable: boolean;
}

export interface WorkspaceTabsContextType {
  tabs: WorkspaceTab[];
  activeTabId: string;
  openTab: (tab: { path: string; title?: string; iconName?: string }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  switchTab: (tabId: string) => void;
  registerPage: (tabId: string, node: React.ReactNode) => void;
  getCachedPage: (tabId: string) => React.ReactNode | undefined;
}

const STORAGE_KEY = 'hotel_workspace_open_tabs_v2';

export function getTabInfoForUrl(
  pathname: string,
  search: string = ''
): { id: string; path: string; title: string; iconName: string; closable: boolean } {
  const fullPath = search ? `${pathname}?${search}` : pathname;

  // Specific query param routes
  if (pathname === '/tables') {
    if (search.includes('tab=RESERVATIONS')) {
      return { id: '/tables?tab=RESERVATIONS', path: '/tables?tab=RESERVATIONS', title: 'Table Bookings', iconName: 'CalendarCheck', closable: true };
    }
    if (search.includes('tab=ACTIVE_ORDERS')) {
      return { id: '/tables?tab=ACTIVE_ORDERS', path: '/tables?tab=ACTIVE_ORDERS', title: 'Live Orders', iconName: 'Receipt', closable: true };
    }
    return { id: '/tables', path: '/tables', title: 'Floor & Tables', iconName: 'Table2', closable: true };
  }

  if (pathname === '/inventory') {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');
    const dept = params.get('dept');

    if (dept === 'HOTEL') {
      return { id: '/inventory?dept=HOTEL', path: fullPath, title: 'Hotel Stock', iconName: 'Hotel', closable: true };
    }
    if (dept === 'RESTAURANT') {
      return { id: '/inventory?dept=RESTAURANT', path: fullPath, title: 'Kitchen Stock', iconName: 'UtensilsCrossed', closable: true };
    }

    if (tab) {
      const INVENTORY_CONFIG: Record<string, { title: string; iconName: string }> = {
        'items': { title: 'Inventory Items', iconName: 'Package' },
        'receive-stock': { title: 'Receive Stock', iconName: 'ShoppingBag' },
        'purchases': { title: 'Purchases', iconName: 'ShoppingBag' },
        'purchase-ledger': { title: 'Purchase Ledger', iconName: 'Receipt' },
        'stock-movements': { title: 'Stock Movements', iconName: 'Activity' },
        'suppliers': { title: 'Suppliers', iconName: 'Users' },
        'stock-adjustments': { title: 'Stock Adjustments', iconName: 'SlidersHorizontal' },
        'transfers': { title: 'Stock Transfers', iconName: 'ArrowLeftRight' },
        'categories': { title: 'Categories', iconName: 'Tag' },
        'units': { title: 'Units of Measure', iconName: 'Scale' },
      };

      const info = INVENTORY_CONFIG[tab];
      if (info) {
        return {
          id: `/inventory?tab=${tab}`,
          path: fullPath,
          title: info.title,
          iconName: info.iconName,
          closable: true,
        };
      }
    }

    return { id: '/inventory', path: '/inventory', title: 'Inventory', iconName: 'Boxes', closable: true };
  }

  if (pathname === '/reports') {
    if (search.includes('section=restaurant')) {
      return { id: '/reports?section=restaurant', path: '/reports?section=restaurant', title: 'Restaurant Reports', iconName: 'BarChart3', closable: true };
    }
    return { id: '/reports', path: '/reports', title: 'Hotel Reports', iconName: 'BarChart3', closable: true };
  }

  if (pathname === '/billing') {
    const params = new URLSearchParams(search);
    const status = params.get('status');
    const type = params.get('type');
    if (status === 'PAID') {
      return { id: '/billing?status=PAID', path: fullPath, title: 'Payments & Refunds', iconName: 'CreditCard', closable: true };
    }
    if (status === 'UNPAID') {
      return { id: '/billing?status=UNPAID', path: fullPath, title: 'Due Balances', iconName: 'AlertCircle', closable: true };
    }
    if (type === 'TABLE_ORDER') {
      return { id: '/billing?type=TABLE_ORDER', path: fullPath, title: 'Restaurant Bills', iconName: 'UtensilsCrossed', closable: true };
    }
    if (type === 'HOTEL_CHECKOUT') {
      return { id: '/billing?type=HOTEL_CHECKOUT', path: fullPath, title: 'Hotel Invoices', iconName: 'Hotel', closable: true };
    }
    return { id: '/billing', path: '/billing', title: 'Billing & Invoices', iconName: 'FileText', closable: true };
  }

  if (pathname === '/hotel') {
    if (search.includes('category=restaurant-setup')) {
      return { id: '/hotel?category=restaurant-setup', path: fullPath, title: 'Restaurant Setup', iconName: 'Building2', closable: true };
    }
    if (search.includes('category=room-setup')) {
      return { id: '/hotel?category=room-setup', path: fullPath, title: 'Hotel Setup', iconName: 'Building2', closable: true };
    }
    return { id: '/hotel', path: fullPath, title: 'Master Setup', iconName: 'Building2', closable: true };
  }

  if (pathname === '/accounts') {
    const params = new URLSearchParams(search);
    const tab = params.get('tab');

    if (tab) {
      const ACCOUNTS_CONFIG: Record<string, { title: string; iconName: string }> = {
        'chart-of-accounts': { title: 'Chart of Accounts', iconName: 'BookOpen' },
        'journal-entries': { title: 'Journal Entries', iconName: 'FileText' },
        'general-ledger': { title: 'General Ledger', iconName: 'Book' },
        'trial-balance': { title: 'Trial Balance', iconName: 'Calculator' },
        'sales-transactions': { title: 'Sales Transactions', iconName: 'TrendingUp' },
        'customer-ledger': { title: 'Customer Ledger', iconName: 'Users' },
        'purchase-transactions': { title: 'Purchase Transactions', iconName: 'Truck' },
        'supplier-ledger': { title: 'Supplier Ledger', iconName: 'Truck' },
        'cash-accounts': { title: 'Cash Accounts', iconName: 'Wallet' },
        'bank-accounts': { title: 'Bank & Wallet', iconName: 'Landmark' },
        'bank-reconciliation': { title: 'Bank Reconciliation', iconName: 'Receipt' },
        'income': { title: 'Income Management', iconName: 'TrendingUp' },
        'expenses': { title: 'Expense Management', iconName: 'TrendingDown' },
        'fixed-assets': { title: 'Fixed Assets', iconName: 'Building2' },
        'liabilities': { title: 'Liabilities', iconName: 'Receipt' },
        'tax-management': { title: 'Tax Management', iconName: 'ShieldCheck' },
        'tax': { title: 'Tax Management', iconName: 'ShieldCheck' },
        'profit-loss': { title: 'Profit & Loss', iconName: 'BarChart3' },
        'balance-sheet': { title: 'Balance Sheet', iconName: 'Scale' },
        'cash-flow': { title: 'Cash Flow', iconName: 'Landmark' },
        'financial-summary': { title: 'Financial Summary', iconName: 'PieChart' },
      };

      const info = ACCOUNTS_CONFIG[tab];
      if (info) {
        return {
          id: `/accounts?tab=${tab}`,
          path: fullPath,
          title: info.title,
          iconName: info.iconName,
          closable: true,
        };
      }
    }

    return {
      id: '/accounts',
      path: '/accounts',
      title: 'Accounts',
      iconName: 'BookOpen',
      closable: true,
    };
  }

  // Exact known routes
  const MAP: Record<string, { title: string; iconName: string; closable?: boolean }> = {
    '/': { title: 'Dashboard', iconName: 'LayoutDashboard', closable: false },
    '/hotel-management': { title: 'Hotel Overview', iconName: 'LayoutDashboard', closable: true },
    '/front-desk': { title: 'Room Board', iconName: 'BedDouble', closable: true },
    '/room-board': { title: 'Room Board', iconName: 'BedDouble', closable: true },
    '/booking': { title: 'Book Now', iconName: 'CalendarPlus', closable: true },
    '/reservations': { title: 'Room Bookings', iconName: 'CalendarCheck', closable: true },
    '/check-in': { title: 'Guest Check-In', iconName: 'UserCheck', closable: true },
    '/checkout': { title: 'Guest Check-Out', iconName: 'LogOut', closable: true },
    '/active-stays': { title: 'Active Stays', iconName: 'Users', closable: true },
    '/guests': { title: 'Guests CRM', iconName: 'Contact', closable: true },
    '/housekeeping': { title: 'Housekeeping', iconName: 'Sparkles', closable: true },
    '/hotel': { title: 'Master Setup', iconName: 'Building2', closable: true },
    '/billing': { title: 'Billing & Folios', iconName: 'FileText', closable: true },
    '/restaurant-management': { title: 'Restaurant Overview', iconName: 'UtensilsCrossed', closable: true },
    '/quick-sale': { title: 'Quick Sale POS', iconName: 'Zap', closable: true },
    '/menu': { title: 'Menu Management', iconName: 'UtensilsCrossed', closable: true },
    '/staff': { title: 'Staff', iconName: 'Users', closable: true },
    '/profile': { title: 'User Profile', iconName: 'User', closable: true },
  };

  if (MAP[pathname]) {
    return {
      id: pathname,
      path: fullPath,
      title: MAP[pathname].title,
      iconName: MAP[pathname].iconName,
      closable: MAP[pathname].closable ?? true,
    };
  }

  // Dynamic fallback for any nested or sub-path
  const segments = pathname.replace(/^\//, '').split('/');
  const lastSegment = segments[segments.length - 1] || 'Page';
  const cleanTitle = lastSegment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: pathname,
    path: fullPath,
    title: cleanTitle,
    iconName: 'LayoutGrid',
    closable: true,
  };
}

const DEFAULT_HOME_TAB: WorkspaceTab = {
  id: '/',
  path: '/',
  title: 'Dashboard',
  iconName: 'LayoutDashboard',
  closable: false,
};

export const WorkspaceTabsContext = createContext<WorkspaceTabsContextType | undefined>(undefined);

export const WorkspaceTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchStr = searchParams?.toString() || '';

  // Initialize tabs from localStorage or default
  const [tabs, setTabs] = useState<WorkspaceTab[]>([DEFAULT_HOME_TAB]);
  const [activeTabId, setActiveTabId] = useState<string>(DEFAULT_HOME_TAB.id);
  const pageCacheRef = useRef<Record<string, React.ReactNode>>({});
  const [, forceUpdate] = useState(0);

  // Load saved tabs on initial mount
  useEffect(() => {
    try {
      localStorage.removeItem('hotel_workspace_open_tabs_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((t) => {
            const info = getTabInfoForUrl(t.path?.split('?')[0] || t.id, t.path?.includes('?') ? t.path.split('?')[1] : '');
            return {
              ...t,
              closable: info.closable,
            };
          });
          setTabs(cleaned);
          return;
        }
      }
      setTabs([DEFAULT_HOME_TAB]);
    } catch {}
  }, []);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch {}
  }, [tabs]);

  // Synchronize active tab whenever URL changes (e.g. user navigates)
  useEffect(() => {
    if (!pathname || pathname === '/super-admin' || pathname === '/login') return;

    const currentTabInfo = getTabInfoForUrl(pathname, searchStr);

    setTabs((prevTabs) => {
      const exists = prevTabs.some((t) => t.id === currentTabInfo.id);
      if (exists) {
        // Update path in case query params changed
        return prevTabs.map((t) => (t.id === currentTabInfo.id ? { ...t, path: currentTabInfo.path } : t));
      }
      return [...prevTabs, currentTabInfo];
    });

    setActiveTabId(currentTabInfo.id);
  }, [pathname, searchStr]);

  const registerPage = useCallback((tabId: string, node: React.ReactNode) => {
    if (!tabId || !node) return;
    if (pageCacheRef.current[tabId] !== node) {
      pageCacheRef.current[tabId] = node;
    }
  }, []);

  const getCachedPage = useCallback((tabId: string) => {
    return pageCacheRef.current[tabId];
  }, []);

  const switchTab = useCallback((tabId: string) => {
    const target = tabs.find((t) => t.id === tabId);
    if (target) {
      setActiveTabId(target.id);
      router.push(target.path);
    }
  }, [tabs, router]);

  const openTab = useCallback((tabData: { path: string; title?: string; iconName?: string }) => {
    const parsedPath = tabData.path.split('?')[0];
    const parsedSearch = tabData.path.includes('?') ? tabData.path.split('?')[1] : '';
    const info = getTabInfoForUrl(parsedPath, parsedSearch);

    const newTab: WorkspaceTab = {
      id: info.id,
      path: tabData.path,
      title: tabData.title || info.title,
      iconName: tabData.iconName || info.iconName,
      closable: info.closable,
    };

    setTabs((prev) => {
      if (prev.some((t) => t.id === newTab.id)) {
        return prev.map((t) => (t.id === newTab.id ? { ...t, path: newTab.path } : t));
      }
      return [...prev, newTab];
    });

    setActiveTabId(newTab.id);
    router.push(newTab.path);
  }, [router]);

  const closeTab = useCallback((tabIdToClose: string) => {
    setTabs((prevTabs) => {
      const tabToClose = prevTabs.find((t) => t.id === tabIdToClose);
      if (!tabToClose || !tabToClose.closable) return prevTabs;

      const remaining = prevTabs.filter((t) => t.id !== tabIdToClose);

      // Clean up cached page from memory
      delete pageCacheRef.current[tabIdToClose];

      // If we closed the active tab, switch to the nearest adjacent tab
      if (activeTabId === tabIdToClose) {
        const closedIndex = prevTabs.findIndex((t) => t.id === tabIdToClose);
        const nextIndex = Math.max(0, closedIndex - 1);
        const nextTab = remaining[nextIndex] || DEFAULT_HOME_TAB;
        setActiveTabId(nextTab.id);
        router.push(nextTab.path);
      }

      return remaining.length > 0 ? remaining : [DEFAULT_HOME_TAB];
    });
  }, [activeTabId, router]);

  const closeOtherTabs = useCallback((keepTabId: string) => {
    setTabs((prevTabs) => {
      const toKeep = prevTabs.filter((t) => t.id === keepTabId || !t.closable);
      // Clean up closed pages from cache
      Object.keys(pageCacheRef.current).forEach((key) => {
        if (!toKeep.some((t) => t.id === key)) {
          delete pageCacheRef.current[key];
        }
      });
      return toKeep;
    });
    switchTab(keepTabId);
  }, [switchTab]);

  const closeAllTabs = useCallback(() => {
    setTabs((prevTabs) => {
      const rootTabs = prevTabs.filter((t) => !t.closable);
      Object.keys(pageCacheRef.current).forEach((key) => {
        if (!rootTabs.some((t) => t.id === key)) {
          delete pageCacheRef.current[key];
        }
      });
      return rootTabs.length > 0 ? rootTabs : [DEFAULT_HOME_TAB];
    });
    const root = tabs.find((t) => !t.closable) || DEFAULT_HOME_TAB;
    setActiveTabId(root.id);
    router.push(root.path);
  }, [tabs, router]);

  return (
    <WorkspaceTabsContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        closeOtherTabs,
        closeAllTabs,
        switchTab,
        registerPage,
        getCachedPage,
      }}
    >
      {children}
    </WorkspaceTabsContext.Provider>
  );
};

export const useWorkspaceTabs = () => {
  const context = useContext(WorkspaceTabsContext);
  if (!context) {
    throw new Error('useWorkspaceTabs must be used within a WorkspaceTabsProvider');
  }
  return context;
};


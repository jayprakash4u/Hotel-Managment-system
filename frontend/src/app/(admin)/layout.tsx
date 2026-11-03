'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { ProfileDrawer } from '@/components/common/ProfileDrawer';
import { WorkspaceTabBar } from '@/components/common/WorkspaceTabBar';
import { WorkspaceTabsProvider, useWorkspaceTabs } from '@/context/WorkspaceTabsContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SIDEBAR_STORAGE_KEY = 'hotel_sidebar_is_open';

function AdminWorkspaceContent({
  children,
  sidebarOpen,
  isHotelSetup,
  handleToggleSidebar,
  setIsProfileDrawerOpen,
}: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  isHotelSetup: boolean;
  handleToggleSidebar: () => void;
  setIsProfileDrawerOpen: (v: boolean) => void;
}) {
  const { tabs, activeTabId, registerPage, getCachedPage } = useWorkspaceTabs();
  const pathname = usePathname();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isInventory =
    activeTab?.path?.startsWith('/inventory') ||
    pathname === '/inventory' ||
    pathname?.startsWith('/inventory');
  const isDashboard =
    activeTab?.path === '/' ||
    activeTab?.path === '/hotel-management' ||
    activeTab?.path === '/restaurant-management' ||
    pathname === '/' ||
    pathname === '/hotel-management' ||
    pathname === '/restaurant-management';

  // Keep page component cached when active so state is not lost when switching tabs
  useEffect(() => {
    if (activeTabId && children) {
      registerPage(activeTabId, children);
    }
  }, [activeTabId, children, registerPage]);

  return (
    <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
      <Header
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onOpenProfile={() => setIsProfileDrawerOpen(true)}
      />

      {/* Multi-Page Workspace Tab Bar (Chrome / ERP style tabs) */}
      <WorkspaceTabBar />

      <main
        className={
          isHotelSetup
            ? 'flex-1 overflow-hidden p-3 sm:p-4 lg:p-5 flex flex-col min-h-0'
            : 'flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 w-full min-w-0'
        }
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const cachedNode = getCachedPage(tab.id);
          const content = cachedNode || (isActive ? children : null);
          if (!content) return null;

          return (
            <div
              key={tab.id}
              className={cn(
                isHotelSetup ? 'w-full flex-1 flex flex-col min-h-0' : 'w-full min-w-0',
                isActive ? 'block' : 'hidden'
              )}
              style={{ display: isActive ? undefined : 'none' }}
            >
              {content}
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHotelSetup = pathname === '/hotel' || pathname?.startsWith('/hotel');
  const isSuperAdmin = pathname === '/super-admin' || pathname?.startsWith('/super-admin');

  // Instant synchronous auth verification on client to eliminate "Verifying session..." delays
  const [isAuthVerified, setIsAuthVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        let token = localStorage.getItem('auth_token');
        if (!token && process.env.NODE_ENV !== 'production') {
          token = 'dev-admin-token-' + Date.now();
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_username', 'admin');
          localStorage.setItem('auth_role', 'HOTEL_ADMIN');
          localStorage.setItem('auth_name', 'Property Administrator');
          return true;
        }
        return Boolean(token);
      } catch {
        return false;
      }
    }
    return false;
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('auth_token');
        if (token || process.env.NODE_ENV !== 'production') return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  // Safety watchdog: never allow the loading spinner to block the screen for more than 400ms
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsCheckingAuth(false);
      if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
        if (process.env.NODE_ENV !== 'production') {
          localStorage.setItem('auth_token', 'dev-admin-token-' + Date.now());
          localStorage.setItem('auth_username', 'admin');
          localStorage.setItem('auth_role', 'HOTEL_ADMIN');
          setIsAuthVerified(true);
        } else {
          router.replace('/login');
        }
      }
    }, 400);

    return () => clearTimeout(safetyTimer);
  }, [router]);

  // Strict Authentication & Authorization Gate
  useEffect(() => {
    try {
      let token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      let role = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_role') : null;
      let username = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_username') : null;

      // In development or local preview, auto-provision session so developer/user is never blocked
      if (!token && process.env.NODE_ENV !== 'production') {
        token = 'dev-admin-token-' + Date.now();
        role = 'HOTEL_ADMIN';
        username = 'admin';
        try {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_role', role);
          localStorage.setItem('auth_username', username);
          localStorage.setItem('auth_name', 'Property Administrator');
        } catch {}
      }

      // 1. If not logged in at all, immediately redirect to /login and block rendering
      if (!token) {
        setIsAuthVerified(false);
        setIsCheckingAuth(false);
        router.replace('/login');
        return;
      }

      // 2. If accessing /super-admin, strictly verify super admin role
      if (isSuperAdmin) {
        const isSuper =
          role === 'SUPER_ADMIN' ||
          role === 'PLATFORM_ADMIN' ||
          username?.toLowerCase() === 'superadmin';

        if (!isSuper) {
          setIsAuthVerified(false);
          setIsCheckingAuth(false);
          router.replace('/login');
          return;
        }

        setIsAuthVerified(true);
        setIsCheckingAuth(false);
        return;
      }

      // 3. User is authenticated for general admin
      setIsAuthVerified(true);
      setIsCheckingAuth(false);
    } catch {
      setIsAuthVerified(false);
      setIsCheckingAuth(false);
      router.replace('/login');
    }
  }, [pathname, isSuperAdmin, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setSidebarOpen(stored === 'true');
      } else {
        setSidebarOpen(window.innerWidth >= 1024);
      }
    } catch {
      setSidebarOpen(true);
    }
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // While verifying authorization, DO NOT mount or display children or admin panels
  if (isCheckingAuth || !isAuthVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC2626]" />
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Dedicated Super Admin Portal has its own custom navigation and layout (rendered only once verified)
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--surface-page)]" />}>
      <WorkspaceTabsProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--surface-page)] text-[var(--text-body)] transition-colors duration-150">
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={handleToggleSidebar}
            onOpenProfile={() => setIsProfileDrawerOpen(true)}
            onClose={() => {
              setSidebarOpen(false);
              try {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
              } catch {}
            }}
          />

          {/* Main Content Area with Multi-Page Workspace Tabs */}
          <AdminWorkspaceContent
            sidebarOpen={sidebarOpen}
            isHotelSetup={isHotelSetup}
            handleToggleSidebar={handleToggleSidebar}
            setIsProfileDrawerOpen={setIsProfileDrawerOpen}
          >
            {children}
          </AdminWorkspaceContent>

          {/* Right-Side Profile & Appearance Slide-Over Drawer */}
          <ProfileDrawer
            isOpen={isProfileDrawerOpen}
            onClose={() => setIsProfileDrawerOpen(false)}
          />
        </div>
      </WorkspaceTabsProvider>
    </Suspense>
  );
}

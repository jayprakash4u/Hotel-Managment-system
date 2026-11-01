'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { ProfileDrawer } from '@/components/common/ProfileDrawer';
import { WorkspaceTabBar } from '@/components/common/WorkspaceTabBar';
import { WorkspaceTabsProvider, useWorkspaceTabs } from '@/context/WorkspaceTabsContext';
import { cn } from '@/lib/utils';

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
            : 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'
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
                isHotelSetup ? 'w-full flex-1 flex flex-col min-h-0' : 'w-full',
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

  // If not logged in, smoothly redirect to login page
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
      }
    } catch {}
  }, [router]);

  // Dedicated Super Admin Portal has its own custom navigation and layout
  if (isSuperAdmin) {
    return <>{children}</>;
  }

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

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { ProfileDrawer } from '@/components/common/ProfileDrawer';

const SIDEBAR_STORAGE_KEY = 'hotel_sidebar_is_open';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const isHotelSetup = pathname === '/hotel' || pathname?.startsWith('/hotel');
  const isSuperAdmin = pathname === '/super-admin' || pathname?.startsWith('/super-admin');

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
    <div className="flex h-screen overflow-hidden bg-[var(--surface-page)] text-[var(--text-body)] transition-colors duration-150">
      {/* Sidebar surface (slightly distinct from page) */}
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

      {/* Main Content Area in Warm Ivory Background */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
        <Header
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenProfile={() => setIsProfileDrawerOpen(true)}
        />
        <main
          className={
            isHotelSetup
              ? 'flex-1 overflow-hidden p-3 sm:p-4 lg:p-5 flex flex-col min-h-0'
              : 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'
          }
        >
          <div className={isHotelSetup ? 'w-full flex-1 flex flex-col min-h-0' : 'w-full'}>
            {children}
          </div>
        </main>
      </div>

      {/* Full Viewport Right-Side Profile & Appearance Slide-Over Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
    </div>
  );
}

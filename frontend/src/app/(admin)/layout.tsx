'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';

const SIDEBAR_STORAGE_KEY = 'hotel_sidebar_is_open';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const isHotelSetup = pathname === '/hotel' || pathname?.startsWith('/hotel');

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
    <div className="flex h-screen overflow-hidden bg-[#F7F5F0] text-[#24352F] dark:bg-[#071512] dark:text-slate-100 transition-colors duration-150">
      {/* Deep Forest Green Sidebar (#0B3D32) - Collapsible with smooth transition */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        onClose={() => {
          setSidebarOpen(false);
          try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
          } catch {}
        }}
      />

      {/* Main Content Area in Warm Ivory Background */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
        <Header isSidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
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
    </div>
  );
}

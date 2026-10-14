'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isHotelSetup = pathname === '/hotel' || pathname?.startsWith('/hotel');

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F0] text-[#24352F] dark:bg-[#071512] dark:text-slate-100 transition-colors duration-150">
      {/* Deep Forest Green Sidebar (#0B3D32) - Fixed & locked on the left, never scrolls with the page */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area in Warm Ivory Background */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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

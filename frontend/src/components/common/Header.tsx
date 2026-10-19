'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, RefreshCw, Menu, Sun, Moon, ShieldCheck, LogIn } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { QuickSearchModal } from './QuickSearchModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';
import { useRole } from '@/context/RoleContext';
import { api } from '@/lib/api';

export const Header: React.FC<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const toast = useToast();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useRole();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleResetData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      toast.celebrate('Database Refreshed!', 'Sample rooms, reservations, and active stays restored.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error('Reset Failed', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 sm:px-6 backdrop-blur-md transition-all bg-white/95 border-[#DCE3DF] text-[#24352F] dark:bg-[#071512]/90 dark:border-[#1a332c] dark:text-white shadow-2xs">
      {/* Left side: Mobile menu toggle (< lg) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex lg:hidden items-center justify-center h-8.5 w-8.5 rounded-[3px] bg-[#EEF4F1] hover:bg-[#DDE9E3] border border-[#CBD5D0] text-[#0B3D32] dark:bg-[#0B3D32]/40 dark:border-[#145447] dark:text-[#E5EEE9] dark:hover:text-white dark:hover:bg-[#0B3D32] transition-all shadow-2xs cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: Search, Theme Toggle & Check-In Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2F4F2] border border-[#CBD5D0] text-[#64736C] hover:text-[#24352F] hover:border-[#879B90] dark:bg-[#0B3D32]/30 dark:border-[#145447] dark:text-[#B7CDC3] dark:hover:text-white transition-all text-xs group"
        >
          <Search className="w-3.5 h-3.5 text-[#0B3D32] dark:text-[#B7CDC3] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium">Quick Search (Rooms, Guests...)</span>
          <kbd className="hidden md:inline-flex items-center rounded bg-white px-1.5 py-0.5 text-[10px] text-[#64736C] border border-[#CBD5D0] dark:bg-[#072D26] dark:text-[#B7CDC3] dark:border-[#145447] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Ivory' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-white border border-[#CBD5D0] text-[#43534D] hover:text-[#0B3D32] hover:border-[#879B90] dark:bg-[#0B3D32]/40 dark:border-[#145447] dark:text-[#B7CDC3] dark:hover:text-white transition-all shadow-2xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FDE68A]" />
          ) : (
            <Moon className="w-4 h-4 text-[#0B3D32]" />
          )}
        </button>

        {/* Reset / Demo Data Button (Secondary Action) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetData}
          isLoading={isSeeding}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />}
          className="hidden sm:inline-flex text-xs px-3 py-1.5 h-9 font-semibold"
        >
          Reset Demo
        </Button>

        {/* Check-In Desk Shortcut (Primary Action: Forest Green #0B3D32) */}
        <Link href="/front-desk">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<LogIn className="w-4 h-4" />}
            className="text-xs px-3.5 py-1.5 h-9 font-bold shadow-xs"
          >
            Check-in Desk
          </Button>
        </Link>

        {/* Active Super Admin Hotel Status Indicator */}
        <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-[#DCE3DF] dark:border-[#145447]">
          <div className="text-right leading-tight">
            <div className="flex items-center justify-end gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
              <p className="text-xs font-bold text-[#24352F] dark:text-slate-100 truncate max-w-[150px]">{user.name}</p>
            </div>
            <p className="text-[10px] text-[#0B3D32] dark:text-[#B7CDC3] font-semibold truncate max-w-[150px]">
              {user.department || 'Aura Grand Resort'}
            </p>
          </div>
          <div
            title="Active — Enterprise Front Desk"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F2EE] border border-[#CBD5D0] text-[#0B3D32] dark:bg-[#0B3D32] dark:border-[#145447] dark:text-[#E5EEE9] shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#0B3D32] dark:text-white" />
          </div>
        </div>
      </div>

      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

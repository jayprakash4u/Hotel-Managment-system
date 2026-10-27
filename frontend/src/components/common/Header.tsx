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
import { cn } from '@/lib/utils';

export const Header: React.FC<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenProfile?: () => void;
}> = ({ isSidebarOpen = true, onToggleSidebar, onOpenProfile }) => {
  const toast = useToast();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useRole();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleOpenProfile = () => {
    onOpenProfile?.();
  };

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

  const userInitials = (user.name || user.email || 'Admin')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 sm:px-6 backdrop-blur-md transition-all bg-white/95 border-[#DCE3DF] text-[#24352F] dark:bg-[#071512]/90 dark:border-[#1a332c] dark:text-white shadow-2xs">
      {/* Left side: Mobile menu toggle (< lg) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex lg:hidden items-center justify-center h-8.5 w-8.5 rounded-[3px] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5D0] text-[var(--brand-primary)] dark:bg-[#1E293B] dark:border-[#334155] dark:text-emerald-400 transition-all shadow-2xs cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: Search, Theme Toggle & Profile Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1F5F9] border border-[#CBD5D0] text-[#64748B] hover:text-[#1E293B] hover:border-[#94A3B8] dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#CBD5E1] dark:hover:text-white transition-all text-xs group cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[var(--brand-primary)] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium">Quick Search (Rooms, Guests...)</span>
          <kbd className="hidden md:inline-flex items-center rounded bg-white px-1.5 py-0.5 text-[10px] text-[#64748B] border border-[#CBD5D0] dark:bg-[#0F172A] dark:text-[#CBD5E1] dark:border-[#334155] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quick Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-white border border-[#CBD5D0] text-[#475569] hover:text-[var(--brand-primary)] hover:border-[#94A3B8] dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#CBD5E1] dark:hover:text-white transition-all shadow-2xs cursor-pointer"
          aria-label="Toggle light or dark theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#F59E0B]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--brand-primary)]" />
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

        {/* Check-In Desk Shortcut (Primary Action using active Theme Color) */}
        <Link href="/front-desk">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<LogIn className="w-4 h-4" />}
            className="text-xs px-3.5 py-1.5 h-9 font-bold shadow-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
          >
            Check-in Desk
          </Button>
        </Link>

        {/* User Profile Trigger -> Opens Right-Side Profile & Appearance Drawer */}
        <button
          type="button"
          onClick={handleOpenProfile}
          title="Open Profile, Workspace & Appearance (Click to customize)"
          className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-[#E2E8F0] dark:border-[#334155] text-left cursor-pointer group hover:opacity-90 transition-opacity"
          aria-label="Open Profile & Appearance Drawer"
        >
          <div className="hidden md:block text-right leading-tight">
            <div className="flex items-center justify-end gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
              <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100 truncate max-w-[150px] group-hover:text-[var(--brand-primary)] transition-colors">
                {user.name}
              </p>
            </div>
            <p className="text-[10px] text-[var(--brand-primary)] font-semibold truncate max-w-[150px]">
              {user.department || 'Aura Grand Resort'}
            </p>
          </div>

          <div
            className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white shadow-xs font-bold text-xs select-none group-hover:scale-105 transition-transform"
          >
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#071512]" />
          </div>
        </button>
      </div>

      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

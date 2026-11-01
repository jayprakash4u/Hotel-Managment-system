'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Mail,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  GitBranch,
  LifeBuoy,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { AppearanceSettings } from './AppearanceSettings';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useRole();
  const toast = useToast();
  const router = useRouter();

  const [financialYear, setFinancialYear] = useState('FY 2026-2027');
  const [branch, setBranch] = useState('Main Resort & Outlets');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      toast.info('Signed Out', 'You have been safely signed out.');
      onClose();
      router.push('/login');
    }
  };

  // Derive user initials
  const initials = (user.name || user.email || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const orgInitials = (user.department || 'Tanzeera Tech')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer (Right Side) */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-[390px] sm:max-w-[420px] bg-white shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-in-out flex flex-col justify-between dark:bg-[#0B1120] dark:border-slate-800',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Profile and Workspace Drawer"
      >
        {/* Top Header Section with Close Button */}
        <div className="relative p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Profile Summary */}
          <div className="flex items-start gap-3.5 pr-8">
            {/* Avatar Circle with Active Status Dot */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-lg shadow-xs select-none">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
            </div>

            {/* User details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight font-heading">
                {user.email || user.name || 'tanzeeratech@gmail.com'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{user.email || 'tanzeeratech@gmail.com'}</span>
              </div>

              {/* Status and Role Badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Admin</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span className="truncate max-w-[130px]">{user.department || 'Tanzeera Tech'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* My Account Button */}
          <Link
            href="/profile"
            onClick={onClose}
            className="w-full mt-3.5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>My Account</span>
          </Link>
        </div>

        {/* Scrollable Middle Content: WORKSPACE + APPEARANCE + HELP & SUPPORT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* ===================== WORKSPACE SECTION ===================== */}
          <div className="space-y-2 select-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 font-heading">
              WORKSPACE
            </span>

            <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900/95 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
              {/* Organization Row */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {orgInitials}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-medium text-slate-400 block leading-tight">
                      Organization
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.department || 'Tanzeera Tech'}
                    </h4>
                    <span className="text-[10px] text-slate-400">ID: 13</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toast.info('Organization', 'Active primary organization: Tanzeera Tech (ID: 13)')
                  }
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                >
                  Switch ›
                </button>
              </div>

              {/* Financial Year Row */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--brand-primary-subtle-calc)] border border-[var(--brand-primary-border-calc)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Financial year
                  </span>
                </div>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                >
                  <option value="FY 2026-2027">Select Financial Year · FY 2026-2027</option>
                  <option value="FY 2025-2026">FY 2025-2026</option>
                  <option value="FY 2024-2025">FY 2024-2025</option>
                </select>
              </div>

              {/* Branch Row */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--brand-primary-subtle-calc)] border border-[var(--brand-primary-border-calc)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                    <GitBranch className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Branch
                  </span>
                </div>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                >
                  <option value="Main Resort & Outlets">Select Branch · Main Resort &amp; Outlets</option>
                  <option value="Beach Cabana & Marina">Beach Cabana &amp; Marina</option>
                  <option value="Downtown Club Suites">Downtown Club Suites</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===================== APPEARANCE SECTION ===================== */}
          <AppearanceSettings />

          {/* ===================== HELP & SUPPORT SECTION ===================== */}
          <div className="space-y-2 select-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 font-heading">
              HELP &amp; SUPPORT
            </span>

            <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900/95 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
              {/* Talk to us */}
              <a
                href="mailto:support@bigin.com"
                className="p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-subtle-calc)] border border-[var(--brand-primary-border-calc)] flex items-center justify-center text-[var(--brand-primary)] shrink-0 group-hover:scale-105 transition-transform">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    Talk to us
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    support@bigin.com
                  </span>
                </div>
              </a>

              {/* Book a demo */}
              <Link
                href="/help"
                onClick={onClose}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Book a demo
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ===================== BOTTOM SIGN OUT ACTION ===================== */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

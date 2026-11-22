'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  CalendarCheck,
  UserCheck,
  LogOut,
  Users,
  Contact,
  Sparkles,
  BedDouble,
  Boxes,
  FileText,
  BookOpen,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Table2,
  Zap,
  Receipt,
  User,
  X,
  MoreVertical,
  Check,
  Calculator,
  Book,
  TrendingUp,
  TrendingDown,
  Truck,
  Wallet,
  Landmark,
  Building2,
  ShieldCheck,
  Scale,
  PieChart,
  Globe,
  QrCode,
  ChefHat,
  Wine,
} from 'lucide-react';
import { useWorkspaceTabs } from '@/context/WorkspaceTabsContext';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  LayoutGrid,
  CalendarCheck,
  UserCheck,
  LogOut,
  Users,
  Contact,
  Sparkles,
  BedDouble,
  Boxes,
  FileText,
  BookOpen,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Table2,
  Zap,
  Receipt,
  User,
  Calculator,
  Book,
  TrendingUp,
  TrendingDown,
  Truck,
  Wallet,
  Landmark,
  Building2,
  ShieldCheck,
  Scale,
  PieChart,
  Globe,
  QrCode,
  ChefHat,
  Wine,
};

export const WorkspaceTabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, closeTab, closeOtherTabs, closeAllTabs } = useWorkspaceTabs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Auto scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  return (
    <div className="relative z-20 flex items-center justify-between bg-[#EAF1EE] dark:bg-[#061C16] border-b border-[#D4E2DE] dark:border-[#13493D] px-2 sm:px-4 pt-1.5 transition-colors select-none">

      {/* Tabs Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto flex-1 no-scrollbar scroll-smooth pr-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const IconComp = ICON_MAP[tab.iconName] || LayoutGrid;

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => switchTab(tab.id)}
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-t-[5px] transition-all cursor-pointer shrink-0 border-t-2 relative',
                isActive
                  ? 'bg-white dark:bg-surface-card text-[#0B3D32] dark:text-emerald-300 font-bold border-t-[#0B3D32] dark:border-t-emerald-500 border-x border-[#D4E2DE] dark:border-[#13493D] -mb-[1px] shadow-2xs z-10'
                  : 'bg-transparent text-[#4A6B5D] dark:text-[#A4B8AE] hover:text-[#18392F] dark:hover:text-white hover:bg-white/60 dark:hover:bg-surface-card/60 border-t-transparent border-x border-transparent'
              )}
              title={`${tab.title} (${tab.path})`}
            >
              <IconComp
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isActive ? 'text-[#0B3D32] dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{tab.title}</span>

              {/* Close Button (X) */}
              {tab.closable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={cn(
                    'p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 ml-0.5',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Side Actions: Tab Options (3-dots menu to close tabs) */}
      <div className="flex items-center shrink-0 ml-2 pb-1">
        <div className="relative" ref={menuDropdownRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center justify-center h-6 w-6 rounded-[3px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#093027] transition-all cursor-pointer"
            title="Tab options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg bg-white dark:bg-[#071F1A] border border-border-default dark:border-border-default shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <button
                type="button"
                onClick={() => {
                  closeOtherTabs(activeTabId);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#0E3E33] text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close Other Tabs
              </button>
              <button
                type="button"
                onClick={() => {
                  closeAllTabs();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#0E3E33] text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                Close All Tabs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


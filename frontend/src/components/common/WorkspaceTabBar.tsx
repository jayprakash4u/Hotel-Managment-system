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
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
} from 'lucide-react';
import { useWorkspaceTabs, WorkspaceTab } from '@/context/WorkspaceTabsContext';
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
};

const QUICK_MODULES = [
  { path: '/billing', title: 'Billing & Folios', icon: FileText, desc: 'Guest folios, central invoicing & checkout bills' },
  { path: '/booking', title: 'Room Booking', icon: CalendarCheck, desc: 'Advance room reservation & rate selector' },
  { path: '/quick-sale', title: 'Quick Sale POS', icon: Zap, desc: 'Instant counter billing & quick takeaways' },
  { path: '/tables', title: 'Tables & Floor', icon: Table2, desc: 'Dine-in floor plan & table orders' },
  { path: '/tables?tab=ACTIVE_ORDERS', title: 'Live Kitchen Orders', icon: Receipt, desc: 'Active order tickets & prep status' },
  { path: '/front-desk', title: 'Front Desk Matrix', icon: LayoutGrid, desc: 'Tape chart & live room grid' },
  { path: '/housekeeping', title: 'Housekeeping', icon: Sparkles, desc: 'Room cleaning & maid task status' },
  { path: '/inventory', title: 'Inventory Stock', icon: Boxes, desc: 'Kitchen pantry & hotel linen stock' },
  { path: '/reports', title: 'Reports & Analytics', icon: BarChart3, desc: 'Daily revenue, audits & metrics' },
  { path: '/hotel-management', title: 'Hotel Overview', icon: LayoutDashboard, desc: 'Manager overview & occupancy summary' },
];

export const WorkspaceTabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, closeTab, closeOtherTabs, closeAllTabs, openTab } = useWorkspaceTabs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNewTabOpen, setIsNewTabOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const newTabDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (newTabDropdownRef.current && !newTabDropdownRef.current.contains(e.target as Node)) {
        setIsNewTabOpen(false);
      }
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

  const handleScrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="relative z-20 flex items-center justify-between bg-[#EAF1EE] dark:bg-[#061C16] border-b border-[#D4E2DE] dark:border-[#13493D] px-2 sm:px-4 pt-1.5 transition-colors select-none">
      {/* Scroll Left Button (if overflow) */}
      <button
        type="button"
        onClick={handleScrollLeft}
        className="hidden sm:flex items-center justify-center h-7 w-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
        title="Scroll left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

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

      {/* Scroll Right Button (if overflow) */}
      <button
        type="button"
        onClick={handleScrollRight}
        className="hidden sm:flex items-center justify-center h-7 w-5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white shrink-0 cursor-pointer"
        title="Scroll right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Right Side Actions: + New Tab Dropdown & More Options */}
      <div className="flex items-center gap-1 shrink-0 ml-2 pb-1">
        {/* + Quick Open New Tab */}
        <div className="relative" ref={newTabDropdownRef}>
          <button
            type="button"
            onClick={() => setIsNewTabOpen((prev) => !prev)}
            className="flex items-center justify-center h-6 w-6 rounded-[3px] bg-white/70 dark:bg-[#093027] border border-[#D4E2DE] dark:border-[#13493D] text-[#0B3D32] dark:text-emerald-300 hover:bg-white dark:hover:bg-[#0E3E33] transition-all cursor-pointer shadow-2xs"
            title="Open another page in a new tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {isNewTabOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-lg bg-white dark:bg-[#071F1A] border border-border-default dark:border-border-default shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-muted border-b border-border-default/60 dark:border-border-default/60 mb-1">
                Open in New Tab
              </div>
              <div className="max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
                {QUICK_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isOpen = tabs.some((t) => t.path === mod.path);

                  return (
                    <button
                      key={mod.path}
                      type="button"
                      onClick={() => {
                        openTab({ path: mod.path, title: mod.title });
                        setIsNewTabOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#0E3E33] transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#EAF1EE] dark:bg-[#0C3026] text-[#0B3D32] dark:text-emerald-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {mod.title}
                          </p>
                          <p className="text-[10px] text-muted truncate">{mod.desc}</p>
                        </div>
                      </div>
                      {isOpen && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60">
                          Open
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tab Context Menu (Close other tabs / Close all tabs) */}
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


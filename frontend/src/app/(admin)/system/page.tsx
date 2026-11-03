'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  User,
  Users,
  ShieldCheck,
  Sliders,
  Mail,
  MessageCircle,
  Package,
  Bell,
  Landmark,
  Receipt,
  ChevronLeft,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserProfileView } from '@/components/profile/UserProfileView';

export type SystemTab =
  | 'overview'
  | 'profile'
  | 'user-setup'
  | 'user-group'
  | 'system-control'
  | 'email-setup'
  | 'whatsapp-setup'
  | 'my-service'
  | 'notification-setup'
  | 'ird-setup'
  | 'billing-settings';

export default function SystemAdminPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SystemTab>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as SystemTab | null;
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // System Cards List (Icon + Name only, 7 cards in 1 row per user instruction)
  const SYSTEM_CARDS = [
    {
      id: 'user-setup' as SystemTab,
      name: 'UserSetup',
      icon: Users,
    },
    {
      id: 'user-group' as SystemTab,
      name: 'UserGroup',
      icon: ShieldCheck,
    },
    {
      id: 'system-control' as SystemTab,
      name: 'System Control',
      icon: Sliders,
    },
    {
      id: 'email-setup' as SystemTab,
      name: 'Email Setup',
      icon: Mail,
    },
    {
      id: 'profile' as SystemTab,
      name: 'Update Profile',
      icon: User,
    },
    {
      id: 'whatsapp-setup' as SystemTab,
      name: 'WhatsApp Setup',
      icon: MessageCircle,
    },
    {
      id: 'my-service' as SystemTab,
      name: 'My Service',
      icon: Package,
    },
    {
      id: 'notification-setup' as SystemTab,
      name: 'Notification Setup',
      icon: Bell,
    },
    {
      id: 'ird-setup' as SystemTab,
      name: 'IRD Setup',
      icon: Landmark,
    },
    {
      id: 'billing-settings' as SystemTab,
      name: 'Billing Settings',
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-4 pb-12 font-sans text-slate-800 antialiased">
      {/* Back button only shown when viewing a sub-view */}
      {activeTab !== 'overview' && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to System Cards</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: SYSTEM OPTIONS AS CARDS (NAME AND ICON ONLY, 7 PER ROW)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5 lg:[grid-template-columns:repeat(7,minmax(0,1fr))]">
            {SYSTEM_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveTab(card.id)}
                  className="group relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-[4px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#071F1A] hover:border-[#DC2626] dark:hover:border-[#DC2626] hover:bg-red-50/20 dark:hover:bg-red-950/10 hover:shadow-xs transition-all duration-150 cursor-pointer min-h-[76px] sm:min-h-[82px] text-center"
                >
                  <div className="mb-1.5 text-[#DC2626] dark:text-[#EF4444] group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 stroke-[1.8] text-[#DC2626] dark:text-[#EF4444]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#DC2626] dark:group-hover:text-[#EF4444] transition-colors leading-tight">
                    {card.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: UPDATE PROFILE (EXACT REPLICA OF THE UPLOADED SCREENSHOT)
         ========================================================================= */}
      {activeTab === 'profile' && (
        <UserProfileView onBack={() => setActiveTab('overview')} showBackButton={false} />
      )}

      {/* =========================================================================
          OTHER SUB-OPTIONS PLACEHOLDER VIEW
         ========================================================================= */}
      {activeTab !== 'overview' && activeTab !== 'profile' && (
        <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">System Settings</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Back to System Cards
            </button>
          </div>

          <div className="p-8 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-[#DC2626] dark:text-[#EF4444] mx-auto flex items-center justify-center">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {activeTab.replace('-', ' ')} Active
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This module is active and licensed for your system.
            </p>
            <button
              type="button"
              onClick={() => {
                toast.success('Configuration Saved', `${activeTab.replace('-', ' ')} preferences updated.`);
                setActiveTab('overview');
              }}
              className="mt-3 px-4 py-2 rounded-md bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

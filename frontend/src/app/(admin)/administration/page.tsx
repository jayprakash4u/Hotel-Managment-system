'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdministrationNavBoxes } from '@/components/common/AdministrationNavBoxes';
import { useBusinessModules, BusinessModuleType } from '@/lib/businessSetup';
import { useToast } from '@/components/ui/Toast';
import {
  Building2,
  CheckCircle2,
  Hotel,
  UtensilsCrossed,
  Boxes,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles,
  Settings,
} from 'lucide-react';
import { AppearanceSettings } from '@/components/common/AppearanceSettings';
import { cn } from '@/lib/utils';

function AdministrationContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'business-setup';
  const { moduleType, setModuleType } = useBusinessModules();
  const toast = useToast();

  const handleSelectModuleType = (type: BusinessModuleType) => {
    setModuleType(type);
    const label =
      type === 'HOTEL_AND_RESTAURANT'
        ? 'Hotel & Restaurant (Both Modules)'
        : type === 'RESTAURANT_ONLY'
        ? 'Restaurant Only'
        : 'Hotel Only';
    toast.celebrate('Business Setup Updated', `Operational modules switched to: ${label}`);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Nav Boxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Hub Modules
          </span>
        </div>
        <AdministrationNavBoxes activeId={activeTab} />
      </div>

      {/* Tab 1: Business Setup */}
      {activeTab === 'business-setup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                  Business Setup &amp; Module Configuration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure which business outlets and inventory departments are enabled for this property.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F2EE] text-[#0B3D32] border border-[#0B3D32]/20 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700/50">
                Active: {moduleType.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Business Module Options Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Hotel + Restaurant */}
              <div
                onClick={() => handleSelectModuleType('HOTEL_AND_RESTAURANT')}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-4',
                  moduleType === 'HOTEL_AND_RESTAURANT'
                    ? 'border-[#0B3D32] bg-[#E8F2EE]/50 ring-2 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-100 text-[#0B3D32] dark:bg-emerald-900/50 dark:text-emerald-300">
                      <Hotel className="w-4 h-4" />
                      <span className="text-xs font-bold">+</span>
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    {moduleType === 'HOTEL_AND_RESTAURANT' && (
                      <CheckCircle2 className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
                    Hotel &amp; Restaurant
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Combined full-service hospitality resort with lodging and F&amp;B dining outlets.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-[#0B3D32] dark:text-emerald-400">Inventory Sections Enabled:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                    <li>Restaurant Inventory</li>
                    <li>Hotel Inventory</li>
                    <li>Purchases &amp; Suppliers</li>
                    <li>Inter-Department Stock Transfers</li>
                  </ul>
                </div>
              </div>

              {/* Option 2: Restaurant Only */}
              <div
                onClick={() => handleSelectModuleType('RESTAURANT_ONLY')}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-4',
                  moduleType === 'RESTAURANT_ONLY'
                    ? 'border-[#0B3D32] bg-[#E8F2EE]/50 ring-2 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    {moduleType === 'RESTAURANT_ONLY' && (
                      <CheckCircle2 className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
                    Restaurant Only
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Standalone restaurant, café, bar, or takeaway outlet without room lodging.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-amber-600 dark:text-amber-400">Inventory Sections Enabled:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                    <li>Restaurant Inventory</li>
                    <li>Purchases &amp; Suppliers</li>
                    <li className="line-through text-slate-400">Hotel Inventory (Hidden)</li>
                    <li className="line-through text-slate-400">Stock Transfers (Hidden)</li>
                  </ul>
                </div>
              </div>

              {/* Option 3: Hotel Only */}
              <div
                onClick={() => handleSelectModuleType('HOTEL_ONLY')}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-4',
                  moduleType === 'HOTEL_ONLY'
                    ? 'border-[#0B3D32] bg-[#E8F2EE]/50 ring-2 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                      <Hotel className="w-4 h-4" />
                    </div>
                    {moduleType === 'HOTEL_ONLY' && (
                      <CheckCircle2 className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3">
                    Hotel Only
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Boutique hotel, lodge, or guest house focusing on room stays and housekeeping.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-sky-600 dark:text-sky-400">Inventory Sections Enabled:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                    <li>Hotel Inventory</li>
                    <li>Purchases &amp; Suppliers</li>
                    <li className="line-through text-slate-400">Restaurant Inventory (Hidden)</li>
                    <li className="line-through text-slate-400">Stock Transfers (Hidden)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: System Settings & Appearance */}
      {activeTab === 'system-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppearanceSettings />
          <div className="p-6 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Settings className="w-5 h-5 text-[var(--brand-primary)]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                System Preferences & Policies
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Theme colors are saved locally to your device and session. Configure additional hotel tax rates, check-in policies, and invoice layouts in Master Settings.
            </p>
            <div className="pt-2">
              <a
                href="/settings"
                className="inline-flex items-center justify-center text-xs font-bold px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white hover:opacity-90 transition-all shadow-xs"
              >
                Go to Property Profile &amp; Taxes →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdministrationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Administration...</div>}>
      <AdministrationContent />
    </Suspense>
  );
}

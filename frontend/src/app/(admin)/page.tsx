'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Hotel, UtensilsCrossed } from 'lucide-react';
import { useBusinessModules } from '@/lib/businessSetup';
import { HotelDashboardView } from '@/components/hotel/HotelDashboardView';
import { RestaurantDashboardView } from '@/components/restaurant/RestaurantDashboardView';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { moduleType, isHotelEnabled, isRestaurantEnabled } = useBusinessModules();

  const [activeModule, setActiveModule] = useState<'HOTEL' | 'RESTAURANT'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hospitality_view_mode');
      if (stored === 'HOTEL' || stored === 'RESTAURANT') return stored;
    }
    if (moduleType === 'RESTAURANT_ONLY') return 'RESTAURANT';
    return 'HOTEL';
  });

  const handleSwitchModule = (mode: 'HOTEL' | 'RESTAURANT') => {
    setActiveModule(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hospitality_view_mode', mode);
      window.dispatchEvent(new CustomEvent('hospitality_view_mode_changed', { detail: mode }));
    }
  };

  useEffect(() => {
    const handleModeEvent = (e: any) => {
      if (e.detail === 'HOTEL' || e.detail === 'RESTAURANT') {
        setActiveModule(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hospitality_view_mode_changed', handleModeEvent);
      return () => window.removeEventListener('hospitality_view_mode_changed', handleModeEvent);
    }
  }, []);

  useEffect(() => {
    if (moduleType === 'RESTAURANT_ONLY') {
      setActiveModule('RESTAURANT');
    } else if (moduleType === 'HOTEL_ONLY') {
      setActiveModule('HOTEL');
    }
  }, [moduleType]);

  if (activeModule === 'RESTAURANT') {
    return (
      <div className="w-full space-y-4 pb-4">
        <RestaurantDashboardView />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Module Switcher Bar (only visible when both modules are enabled and on hotel dashboard) */}
      {isHotelEnabled && isRestaurantEnabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pl-1">
              Active Dashboard:
            </span>
            <div className="inline-flex p-0.5 rounded-[4px] bg-[var(--surface-muted)] border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => handleSwitchModule('HOTEL')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer bg-[var(--brand-primary)] text-white shadow-xs"
              >
                <Hotel className="w-3.5 h-3.5" />
                <span>Hotel Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchModule('RESTAURANT')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer text-[var(--text-body)] hover:text-[var(--brand-primary)]"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Restaurant Dashboard</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-[var(--text-muted)] hidden md:block">
            Viewing Hotel front-desk, room occupancy & reservations
          </div>
        </div>
      )}

      <HotelDashboardView />
    </div>
  );
}

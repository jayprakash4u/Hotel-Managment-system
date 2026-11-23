'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useBusinessModules } from '@/lib/businessSetup';
import { HotelDashboardView } from '@/components/hotel/HotelDashboardView';
import { RestaurantDashboardView } from '@/components/restaurant/RestaurantDashboardView';

export default function DashboardPage() {
  const { moduleType } = useBusinessModules();

  const [activeModule, setActiveModule] = useState<'HOTEL' | 'RESTAURANT'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hospitality_view_mode');
      if (stored === 'HOTEL' || stored === 'RESTAURANT') return stored;
    }
    if (moduleType === 'RESTAURANT_ONLY') return 'RESTAURANT';
    return 'HOTEL';
  });

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
    <div className="w-full min-w-0 space-y-4 pb-4">
      <HotelDashboardView />
    </div>
  );
}

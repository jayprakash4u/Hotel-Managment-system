'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { HotelDashboardView } from '@/components/hotel/HotelDashboardView';

export default function HotelManagementPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <HotelDashboardView />
    </div>
  );
}

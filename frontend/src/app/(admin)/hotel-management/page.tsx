'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { HotelDashboardView } from '@/components/hotel/HotelDashboardView';

export default function HotelManagementPage() {
  return (
    <div className="w-full min-w-0 space-y-4 pb-4">
      <HotelDashboardView />
    </div>
  );
}

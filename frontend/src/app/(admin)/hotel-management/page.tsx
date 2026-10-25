'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';

export default function HotelManagementPage() {
  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-12 select-none">
      {/* Hotel Management Top Navigation Boxes */}
      <HotelManagementNavBoxes activeId="hotel-management" />
    </div>
  );
}

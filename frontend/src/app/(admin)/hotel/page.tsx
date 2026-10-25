'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import HotelSetupContent from './HotelSetupContent';
import { HotelManagementNavBoxes } from '@/components/common/HotelManagementNavBoxes';

export default function HotelSetupPage() {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0 space-y-3">
      <div className="shrink-0">
        <HotelManagementNavBoxes activeId="room-setup" />
      </div>
      <div className="flex-1 min-h-0">
        <HotelSetupContent />
      </div>
    </div>
  );
}

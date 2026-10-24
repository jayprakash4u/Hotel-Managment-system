'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { DashboardQuickNavBoxes } from '@/components/common/DashboardQuickNavBoxes';

export default function DashboardPage() {
  return (
    <div className="w-full">
      <DashboardQuickNavBoxes />
    </div>
  );
}

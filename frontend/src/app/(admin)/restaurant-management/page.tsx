'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RestaurantDashboardView } from '@/components/restaurant/RestaurantDashboardView';
import { KitchenKDSView } from '@/components/restaurant/KitchenKDSView';
import { BarBDSView } from '@/components/restaurant/BarBDSView';

function RestaurantModuleContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');

  if (section === 'kitchen') {
    return <KitchenKDSView />;
  }

  if (section === 'bar') {
    return <BarBDSView />;
  }

  return <RestaurantDashboardView />;
}

export default function RestaurantManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Restaurant Module...</div>}>
      <RestaurantModuleContent />
    </Suspense>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HotelSetupContent from '../hotel/HotelSetupContent';

function RestaurantSetupPageInner() {
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub') || null;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <HotelSetupContent initialCategory="restaurant-setup" initialSub={subParam} />
    </div>
  );
}

export default function RestaurantSetupPage() {
  return (
    <Suspense fallback={null}>
      <RestaurantSetupPageInner />
    </Suspense>
  );
}

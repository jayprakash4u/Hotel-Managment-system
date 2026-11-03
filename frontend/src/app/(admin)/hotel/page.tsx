'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HotelSetupContent from './HotelSetupContent';

function HotelSetupPageInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'general';
  const subParam = searchParams.get('sub') || null;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <HotelSetupContent initialCategory={categoryParam} initialSub={subParam} />
    </div>
  );
}

export default function HotelSetupPage() {
  return (
    <Suspense fallback={null}>
      <HotelSetupPageInner />
    </Suspense>
  );
}

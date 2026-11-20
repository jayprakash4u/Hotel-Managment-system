'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HotelSetupContent from './HotelSetupContent';

function HotelSetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'general';
  const subParam = searchParams.get('sub') || null;

  useEffect(() => {
    if (categoryParam === 'restaurant-setup') {
      const target = subParam ? `/restaurant-setup?sub=${encodeURIComponent(subParam)}` : '/restaurant-setup';
      router.replace(target);
    }
  }, [categoryParam, subParam, router]);

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

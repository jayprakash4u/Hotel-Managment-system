'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import HotelSetupContent from '../hotel/HotelSetupContent';

function MasterSetupPageInner() {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <HotelSetupContent initialCategory="general" initialSub={null} />
    </div>
  );
}

export default function MasterSetupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading Master Setup…</div>}>
      <MasterSetupPageInner />
    </Suspense>
  );
}

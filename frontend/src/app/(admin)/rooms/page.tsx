'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RoomsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hotel?category=room-setup');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-xs text-slate-500 font-medium">
      <RefreshCw className="w-4 h-4 mr-2 animate-spin text-[#DC2626]" />
      <span>Redirecting to Hotel & Room Setup...</span>
    </div>
  );
}

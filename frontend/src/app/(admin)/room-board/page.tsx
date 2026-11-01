'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomBoardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/front-desk');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-500">
      Loading Room Board & Front Desk Matrix...
    </div>
  );
}

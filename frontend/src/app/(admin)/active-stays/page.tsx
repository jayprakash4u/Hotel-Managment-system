'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActiveStaysRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/front-desk?tab=staying');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-sm text-slate-500">
      Loading Currently Staying guests...
    </div>
  );
}

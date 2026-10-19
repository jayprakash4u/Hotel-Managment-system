'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function GuestsRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-500">
      Redirecting to Stay History & Reports...
    </div>
  );
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <GuestsRedirectContent />
    </Suspense>
  );
}

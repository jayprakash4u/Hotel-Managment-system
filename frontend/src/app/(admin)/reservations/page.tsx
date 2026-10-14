'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ReservationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'walkin') {
      router.replace('/check-in');
    } else {
      router.replace('/front-desk');
    }
  }, [router, searchParams]);

  return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Redirecting to Front Desk...</div>;
}

export default function ReservationsRedirect() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading...</div>}>
      <ReservationsContent />
    </Suspense>
  );
}

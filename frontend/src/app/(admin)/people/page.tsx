'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function PeopleRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/guests');
  }, [router]);

  return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Redirecting to Guests...</div>;
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading...</div>}>
      <PeopleRedirectContent />
    </Suspense>
  );
}

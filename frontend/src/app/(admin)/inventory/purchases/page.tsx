'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasesSubpage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/purchases');
  }, [router]);

  return null;
}

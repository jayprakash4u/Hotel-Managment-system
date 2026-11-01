'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomStatusRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/front-desk');
  }, [router]);

  return null;
}

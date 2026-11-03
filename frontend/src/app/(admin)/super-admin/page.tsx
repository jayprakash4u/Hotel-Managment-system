'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SuperAdminDashboard } from '@/components/super-admin/SuperAdminDashboard';

export default function SuperAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const role = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_role') : null;
      const username = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_username') : null;

      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.replace('/login');
        return;
      }

      const isSuper =
        role === 'SUPER_ADMIN' ||
        role === 'PLATFORM_ADMIN' ||
        username?.toLowerCase() === 'superadmin';

      if (!isSuper) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.replace('/login');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    } catch {
      setIsAuthorized(false);
      setIsLoading(false);
      router.replace('/login');
    }
  }, [router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
          <p className="text-xs font-semibold text-slate-500">Checking Super Admin authorization...</p>
        </div>
      </div>
    );
  }

  return <SuperAdminDashboard />;
}

'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SuperAdminDashboard } from '@/components/super-admin/SuperAdminDashboard';
import { api } from '@/lib/api';

export default function SuperAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        // If there's an auth_token in localStorage, allow authenticated access
        if (typeof localStorage !== 'undefined' && localStorage.getItem('auth_token')) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07131D]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return <SuperAdminDashboard />;
}

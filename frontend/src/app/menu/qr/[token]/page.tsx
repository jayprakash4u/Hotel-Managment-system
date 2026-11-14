'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QrRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.getPublicMenuByQr(params.token);
        if (res?.data?.restaurantSlug) {
          router.replace(`/menu/${res.data.restaurantSlug}?qr=${encodeURIComponent(params.token)}`);
        } else if (res?.data?.isDisabled) {
          setError(res.data.message || 'This digital menu is temporarily disabled.');
        } else if (res?.data?.isRevoked) {
          setError(res.data.message || 'This QR code has been revoked or has expired.');
        } else {
          setError('Invalid or expired QR code.');
        }
      } catch (err) {
        setError('Unable to verify QR code. Please check your connection or notify restaurant staff.');
      }
    };

    resolve();
  }, [params.token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">QR Code Notice</h2>
          <p className="text-xs text-stone-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-3" />
      <p className="text-sm font-semibold text-stone-700">Connecting to Digital Menu...</p>
    </div>
  );
}

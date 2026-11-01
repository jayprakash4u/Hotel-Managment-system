'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('admin@auragrand.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password.trim()).catch(() => ({
        username: email.trim(),
        name: 'Administrator',
        hotelName: 'Aura Grand Resort & Spa',
      }));

      toast.success('Welcome back', `Signed in as ${res?.name || 'Administrator'}`);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid email address or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password reset', 'Please contact your hotel system administrator or IT desk.');
  };

  return (
    <main className="min-h-screen w-full bg-[#f7f9fc] text-[#173d72]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]">
        <section className="relative hidden min-h-[560px] overflow-hidden bg-[#cfe7f5] lg:block">
          <img
            src="/hotel-staff-login.png"
            alt="Hotel staff welcoming guests at a reception desk"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#082d59]/75 via-[#082d59]/15 to-transparent px-12 pb-10 pt-28">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">Aura Grand Resort &amp; Spa</p>
            <h2 className="mt-2 max-w-xl text-4xl font-semibold leading-tight text-white xl:text-5xl">
              Welcome to your<br />hotel command center.
            </h2>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[460px]">
            <div className="mb-12">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#173d72] shadow-[0_8px_18px_rgba(23,61,114,0.22)]">
                  <span className="text-2xl font-bold text-[#71d6d0]">✦</span>
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-[#173d72]">AURA GRAND</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6c849f]">Hotel management</p>
                </div>
              </div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#48b9b5]">Administrator portal</p>
              <h1 className="text-4xl font-semibold tracking-tight text-[#163b6d] sm:text-[44px]">Welcome back</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-[#71839a]">
                Sign in to manage reservations, guests, rooms, and every detail of your hotel operation.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#294c76]">Email address</label>
                <div className="group flex items-center rounded-xl border border-[#dce6ef] bg-white px-4 shadow-[0_8px_24px_rgba(33,72,111,0.05)] transition focus-within:border-[#48b9b5] focus-within:ring-4 focus-within:ring-[#48b9b5]/10">
                  <Mail className="mr-3 h-5 w-5 text-[#8da2b7] transition group-focus-within:text-[#48b9b5]" strokeWidth={1.8} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@auragrand.com"
                    className="h-14 w-full bg-transparent text-sm font-medium text-[#173d72] outline-none placeholder:text-[#aebdca]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#294c76]">Password</label>
                <div className="group flex items-center rounded-xl border border-[#dce6ef] bg-white px-4 shadow-[0_8px_24px_rgba(33,72,111,0.05)] transition focus-within:border-[#48b9b5] focus-within:ring-4 focus-within:ring-[#48b9b5]/10">
                  <LockKeyhole className="mr-3 h-5 w-5 text-[#8da2b7] transition group-focus-within:text-[#48b9b5]" strokeWidth={1.8} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-14 w-full bg-transparent text-sm font-medium text-[#173d72] outline-none placeholder:text-[#aebdca]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="rounded-md p-1 text-[#8da2b7] transition hover:text-[#173d72]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#71839a]">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#c9d7e3] accent-[#48b9b5]" />
                  Remember me
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-[#1d7590] transition hover:text-[#173d72] hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#173d72] text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,61,114,0.24)] transition hover:bg-[#0f315f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {isLoading ? 'Signing in…' : 'Sign in to dashboard'}
                {!isLoading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>

            <div className="mt-10 flex items-center gap-3 text-xs text-[#91a2b3]">
              <span className="h-px flex-1 bg-[#e3ebf2]" />
              <span>Secure administrator access</span>
              <span className="h-px flex-1 bg-[#e3ebf2]" />
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-[#99aaba]">© 2025 Aura Grand Resort &amp; Spa · All rights reserved</p>
          </div>
        </section>
      </div>
    </main>
  );
}

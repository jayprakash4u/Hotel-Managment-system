'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail, Loader2, Hotel } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter your username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const isSuper = cleanUser.toLowerCase() === 'superadmin' || cleanUser.toLowerCase().includes('super');

      // 1. Super Admin Authentication (Instant Local Verification)
      if (isSuper) {
        if (cleanPass === 'superadmin@123' || cleanPass === 'superadmin') {
          const token = `super-token-${Date.now()}`;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_username', 'superadmin');
            localStorage.setItem('auth_role', 'SUPER_ADMIN');
            localStorage.setItem('auth_name', 'Super Administrator');
            localStorage.setItem('auth_hotel_name', 'Company SaaS Platform');
          }
          toast.success('Super Admin Access Granted', 'Signed in as Super Administrator.');
          router.push('/super-admin');
          return;
        }

        // Custom password verification against backend with timeout
        const backendSuper = await api.login(cleanUser, cleanPass).catch(() => null);
        if (!backendSuper) {
          setError('Invalid credentials for Super Administrator.');
          setIsLoading(false);
          return;
        }

        const token = backendSuper.token || `super-token-${Date.now()}`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_username', 'superadmin');
          localStorage.setItem('auth_role', 'SUPER_ADMIN');
          localStorage.setItem('auth_name', 'Super Administrator');
          localStorage.setItem('auth_hotel_name', 'Company SaaS Platform');
        }

        toast.success('Super Admin Access Granted', 'Signed in as Super Administrator.');
        router.push('/super-admin');
        return;
      }

      // 2. Client Property Authentication (Instant Local Verification)
      let registeredClients: any[] = [];
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('superadmin_clean_clients');
          if (raw) registeredClients = JSON.parse(raw);
        } catch {}
      }

      const matchedClient = registeredClients.find(
        (c) =>
          c.username?.toLowerCase() === cleanUser.toLowerCase() ||
          c.clientCode === cleanUser ||
          (c.email && c.email.toLowerCase() === cleanUser.toLowerCase()) ||
          c.name?.toLowerCase() === cleanUser.toLowerCase() ||
          c.identifier?.toLowerCase() === cleanUser.toLowerCase()
      );

      if (matchedClient) {
        // Verify Client Status (Active vs Disabled)
        if (matchedClient.status === 'DISABLED') {
          setError(`Property account for "${matchedClient.name}" has been deactivated. Please contact the Super Admin.`);
          setIsLoading(false);
          return;
        }

        // Verify Client Password
        const clientPass = matchedClient.password || 'admin@123';
        if (cleanPass !== clientPass) {
          setError('Invalid username or password. Please verify your credentials.');
          setIsLoading(false);
          return;
        }

        // Determine business module setup for this client
        const mods = matchedClient.modules || ['Hotel', 'Restaurant'];
        const hasHotel = mods.some((m: string) => m.toLowerCase().includes('hotel') || m.toLowerCase().includes('room'));
        const hasRest = mods.some((m: string) => m.toLowerCase().includes('restaurant') || m.toLowerCase().includes('pos'));
        const modSetup = hasHotel && hasRest ? 'HOTEL_AND_RESTAURANT' : hasHotel ? 'HOTEL_ONLY' : 'RESTAURANT_ONLY';

        // Instant local authentication: Set session immediately (0ms delay)
        const token = `client-token-${matchedClient.id}-${Date.now()}`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_username', matchedClient.username);
          localStorage.setItem('auth_role', 'HOTEL_ADMIN');
          localStorage.setItem('auth_name', matchedClient.contactPerson || matchedClient.name);
          localStorage.setItem('auth_hotel_name', matchedClient.name);
          localStorage.setItem('auth_hotel_id', matchedClient.id);
          localStorage.setItem('auth_client_code', matchedClient.clientCode);
          localStorage.setItem('auth_modules', JSON.stringify(mods));
          localStorage.setItem('aura_business_module_setup', modSetup);
          localStorage.setItem('hospitality_view_mode', hasHotel ? 'HOTEL' : 'RESTAURANT');
          localStorage.setItem('active_hotel', JSON.stringify(matchedClient));
          localStorage.setItem('hotel_name', matchedClient.name);
          if (matchedClient.logo) {
            localStorage.setItem('auth_hotel_logo', matchedClient.logo);
          } else {
            localStorage.removeItem('auth_hotel_logo');
          }
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('aura_business_module_updated', { detail: modSetup }));
        }

        // Background non-blocking sync with backend API (never blocks user login)
        api.login(matchedClient.username, cleanPass).then((res) => {
          if (res?.token && typeof localStorage !== 'undefined') {
            localStorage.setItem('auth_token', res.token);
          }
        }).catch(() => {});

        toast.success(`Welcome to ${matchedClient.name}`, `Signed in as ${matchedClient.contactPerson || matchedClient.username}.`);
        router.push('/');
        return;
      }

      // 3. Local Admin / Demo Account (Instant Local Verification)
      if (cleanUser.toLowerCase() === 'admin' && (cleanPass === 'admin@123' || cleanPass === 'admin')) {
        const token = `demo-token-${Date.now()}`;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_username', 'admin');
          localStorage.setItem('auth_role', 'HOTEL_ADMIN');
          localStorage.setItem('auth_name', 'Hotel Administrator');
          localStorage.setItem('auth_hotel_name', 'Hotel Master');
        }

        // Background non-blocking sync with backend API
        api.login('admin', cleanPass).then((res) => {
          if (res?.token && typeof localStorage !== 'undefined') {
            localStorage.setItem('auth_token', res.token);
          }
        }).catch(() => {});

        toast.success('Welcome back', 'Signed in successfully.');
        router.push('/');
        return;
      }

      // 4. Fallback: Authenticate against backend database
      const res = await api.login(cleanUser, cleanPass);

      if (res?.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('auth_username', res.username || cleanUser);
        localStorage.setItem('auth_role', (res as any)?.role || 'HOTEL_ADMIN');
        localStorage.setItem('auth_name', res.name || 'Hotel Administrator');
        localStorage.setItem('auth_hotel_name', res.hotelName || 'Hotel Master');
      }

      toast.success('Welcome back', `Signed in successfully.`);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password Reset', 'Please contact your system administrator to reset your password.');
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 flex selection:bg-[#DC2626] selection:text-white">
      <div className="grid min-h-screen w-full lg:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.8fr)]">
        {/* =====================================================================
            LEFT COLUMN: PURE IMAGE ONLY (NO TEXT)
           ===================================================================== */}
        <section className="relative hidden lg:block overflow-hidden bg-slate-100">
          <img
            src="/hotel-staff-login.png"
            alt="Hotel Staff"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </section>

        {/* =====================================================================
            RIGHT COLUMN: SIMPLE LIGHT FORM
           ===================================================================== */}
        <section className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white border-l border-slate-200 overflow-y-auto">
          {/* Top Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC2626] text-white shadow-xs">
              <Hotel className="w-5 h-5" />
            </div>
            <span className="text-base font-black tracking-wider text-slate-900 font-heading">
              HOTEL <span className="text-[#DC2626]">MASTER</span>
            </span>
          </div>

          {/* Form */}
          <div className="my-auto w-full max-w-[360px] mx-auto py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                Sign in
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Enter your account details to sign in.
              </p>
            </div>

            {error && (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
                    <LockKeyhole className="w-4 h-4" />
                  </div>
                  {showPassword ? (
                    <input
                      key="input-text"
                      id="password"
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-10 pl-9 pr-11 text-sm rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all font-mono"
                    />
                  ) : (
                    <input
                      key="input-password"
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-10 pl-9 pr-11 text-sm rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute inset-y-0 right-0 px-3.5 z-30 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer select-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-[#DC2626] pointer-events-none" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5 select-none">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-[#DC2626] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-[#DC2626] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-md text-white font-bold text-sm bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          </div>

          {/* Simple Bottom Copyright */}
          <footer className="text-center text-[11px] text-slate-400 pt-4">
            <p>© 2026 Hotel Master ERP. All rights reserved.</p>
          </footer>
        </section>
      </div>
    </main>
  );
}

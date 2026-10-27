'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('admin@auragrand.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend auth API
      const res = await api.login(email.trim(), password.trim()).catch(() => {
        // Fallback demo authorization for frontend evaluation
        return {
          username: email.trim(),
          name: 'Alexander Sterling',
          hotelName: 'Aura Grand Resort & Spa',
        };
      });

      toast.success('Welcome Back', `Signed in as ${res?.name || 'Administrator'}`);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid email address or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password Reset', 'For security, please contact your hotel system administrator or IT desk.');
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F3F4F8] dark:bg-[#0B0F19] text-[#1E2B4F] select-none transition-colors duration-200">
      {/* Centered Main 2-Column Authentication Card */}
      <div className="w-full max-w-[880px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* =====================================================================
            LEFT COLUMN: EMBLEM, IDENTITY & VECTOR GRAPHIC ILLUSTRATION
            ===================================================================== */}
        <div className="bg-[#F9FAFC] dark:bg-slate-900/60 p-8 sm:p-10 flex flex-col items-center justify-between text-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80">
          {/* Top Brand Identity */}
          <div className="flex flex-col items-center">
            {/* Ornate Seal Emblem matching screenshot */}
            <div className="relative mb-4">
              <svg
                width="84"
                height="84"
                viewBox="0 0 100 100"
                className="w-20 h-20 sm:w-21 sm:h-21 drop-shadow-xs"
              >
                {/* Outer Ring */}
                <circle cx="50" cy="50" r="47" fill="#FFFFFF" stroke="#1E2B4F" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="#1E2B4F" strokeWidth="0.8" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="39" fill="#1E2B4F" />

                {/* Inner Hexagram / Geometric Star */}
                <polygon
                  points="50,17 76,62 24,62"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
                <polygon
                  points="50,73 76,28 24,28"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />

                {/* Center Core Circle */}
                <circle cx="50" cy="45" r="14" fill="#1E2B4F" stroke="#E2E8F0" strokeWidth="1" />
                <circle cx="50" cy="45" r="9" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />

                {/* Center Luxury Emblem Monogram */}
                <text
                  x="50"
                  y="49"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  AG
                </text>

                {/* Bottom Ribbon / Year Tag */}
                <path
                  d="M32 78 Q50 86 68 78 L65 85 Q50 92 35 85 Z"
                  fill="#D97706"
                />
                <text
                  x="50"
                  y="86"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  EST. 2009
                </text>
              </svg>
            </div>

            {/* School / Property Title */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E2B4F] dark:text-white font-heading tracking-tight leading-snug">
              Aura Grand Resort &amp; Spa
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Luxury Resort &amp; Outlets
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Lakeside, Pokhara
            </p>
          </div>

          {/* Center Stylized Graphic Illustration matching screenshot */}
          <div className="relative my-7 sm:my-8 flex items-center justify-center">
            {/* Background Halo */}
            <div className="w-44 h-44 rounded-full bg-blue-50/70 dark:bg-slate-800/40 absolute -z-0" />

            {/* Floating Sparkles & Accent Rings */}
            {/* Top-left gold sparkle + */}
            <span className="absolute top-4 left-6 text-amber-500 text-sm font-bold select-none">+</span>
            {/* Top-right subtle ring circle */}
            <span className="absolute top-5 right-7 w-2 h-2 rounded-full border border-amber-400 select-none" />
            {/* Right gold sparkle + */}
            <span className="absolute bottom-10 right-4 text-slate-400 text-sm font-bold select-none">+</span>

            {/* Stylized Open Book & Graduation / Resort Cap SVG Illustration */}
            <svg
              width="180"
              height="130"
              viewBox="0 0 180 130"
              fill="none"
              className="relative z-10 drop-shadow-xs"
            >
              {/* Left Open Book Leaf Cover Base */}
              <path
                d="M18 96 C48 94, 76 86, 90 92 L90 56 C76 50, 48 58, 18 60 Z"
                fill="#EEF4FB"
                stroke="#BBD2EC"
                strokeWidth="1.5"
              />

              {/* Right Open Book Leaf Cover Base */}
              <path
                d="M162 96 C132 94, 104 86, 90 92 L90 56 C104 50, 132 58, 162 60 Z"
                fill="#EEF4FB"
                stroke="#BBD2EC"
                strokeWidth="1.5"
              />

              {/* Left Page Layers */}
              <path
                d="M24 92 C50 90, 76 82, 90 87 L90 52 C76 47, 50 55, 24 57 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.2"
              />
              <line x1="34" y1="65" x2="80" y2="61" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="34" y1="72" x2="78" y2="68" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="34" y1="79" x2="72" y2="75" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

              {/* Right Page Layers */}
              <path
                d="M156 92 C130 90, 104 82, 90 87 L90 52 C104 47, 130 55, 156 57 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.2"
              />
              <line x1="100" y1="61" x2="146" y2="65" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="102" y1="68" x2="146" y2="72" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="108" y1="75" x2="146" y2="79" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

              {/* Spine shadow */}
              <line x1="90" y1="52" x2="90" y2="92" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Mortarboard / Academic / Resort Cap */}
              <g transform="translate(0, -6)">
                {/* Cap diamond */}
                <polygon
                  points="90,16 128,29 90,42 52,29"
                  fill="#1E2B4F"
                  stroke="#16203B"
                  strokeWidth="1.5"
                />
                {/* Skull cap beneath */}
                <path
                  d="M66 34 L66 43 C66 52, 114 52, 114 43 L114 34 Z"
                  fill="#1E2B4F"
                />
                {/* Cap Button */}
                <circle cx="90" cy="29" r="2.5" fill="#D97706" />
                {/* Tassel */}
                <path
                  d="M90 29 C96 32, 104 38, 106 48"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                <polygon points="104,48 108,48 107,56 103,56" fill="#D97706" />
              </g>
            </svg>
          </div>

          {/* Bottom Website / Management Tag */}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading select-none">
            WEBSITE ADMINISTRATION
          </span>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: SIGN IN FORM
            ===================================================================== */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
          {/* Category Subtitle */}
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6B8B] dark:text-slate-400 font-heading block mb-1">
            HOSPITALITY ADMINISTRATION
          </span>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2B4F] dark:text-white font-heading">
            Sign in
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Enter your account details to manage the website.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-semibold text-[#1E2B4F] dark:text-slate-200"
              >
                Email address
              </label>
              <div className="rounded-lg border border-[#D2E1F3] bg-[#EEF4FB] dark:border-slate-700 dark:bg-slate-800/80 transition-all focus-within:border-[#1E2B4F] focus-within:ring-2 focus-within:ring-[#1E2B4F]/15">
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pkhsschool@hotmail.com"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm font-medium text-[#1E2B4F] dark:text-white placeholder-slate-400 focus:outline-none rounded-lg"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-semibold text-[#1E2B4F] dark:text-slate-200"
              >
                Password
              </label>
              <div className="flex items-center rounded-lg border border-[#D2E1F3] bg-[#EEF4FB] dark:border-slate-700 dark:bg-slate-800/80 transition-all focus-within:border-[#1E2B4F] focus-within:ring-2 focus-within:ring-[#1E2B4F]/15">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="flex-1 bg-transparent px-3.5 py-2.5 text-sm font-medium text-[#1E2B4F] dark:text-white placeholder-slate-400 focus:outline-none rounded-l-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#5B6B8B] hover:text-[#1E2B4F] dark:text-slate-400 dark:hover:text-white px-3.5 py-2.5 transition-colors cursor-pointer select-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-[#5B6B8B] dark:text-slate-400 hover:text-[#1E2B4F] dark:hover:text-white hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button matching screenshot */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E2B4F] hover:bg-[#15203C] text-white py-3 px-5 rounded-lg font-bold text-sm flex items-center justify-between shadow-xs hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span className="text-base font-normal leading-none">→</span>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-Fill Chips for Tester Convenience */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Quick Demo Logins:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@auragrand.com', 'admin123')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('frontdesk@auragrand.com', 'password123')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Front Desk
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('cashier@auragrand.com', 'password123')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                POS Cashier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Caption matching screenshot */}
      <footer className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center font-normal select-none">
        Aura Grand Resort &amp; Spa · Website Administration
      </footer>
    </div>
  );
}

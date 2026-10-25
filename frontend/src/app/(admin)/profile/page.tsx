'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Key,
  Clock,
  Sparkles,
  Lock,
  Globe,
  Bell,
  CheckCircle2,
  Sliders,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export default function UserProfilePage() {
  const toast = useToast();

  const [operator, setOperator] = useState({
    name: 'Alexander Sterling',
    email: 'alexander@auragrand.com',
    role: 'General Manager (Super Admin)',
    department: 'Executive Leadership',
    phone: '+1 (555) 019-2831',
    employeeId: 'EMP-001',
    joinedDate: '12 January 2024',
    location: 'Aura Grand Resort & Spa · Front Desk HQ',
  });

  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    posSound: true,
    autoPrintReceipts: false,
    darkTheme: false,
  });

  const handleSavePreferences = () => {
    toast.success('Preferences Updated', 'Account preferences and display options saved.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================================
          HEADER SECTION
          ===================================================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm shrink-0">
              <User className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  User Profile & Account
                </h1>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Active Session
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Operator credentials, Role-Based Access Control privileges, active session logs, and personal settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Shift: <span className="text-slate-800 dark:text-slate-200 font-bold">Executive Management</span>
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN PROFILE CARD & IDENTITY
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Identity Card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-xs text-center flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#0B3D32] to-emerald-600 p-0.5 shadow-md">
                <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xl text-[#0B3D32] dark:text-emerald-400">
                  AS
                </div>
              </div>
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {operator.name}
            </h2>
            <p className="text-xs font-semibold text-[#0B3D32] dark:text-emerald-400 mb-1">
              {operator.role}
            </p>
            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 mb-4">
              {operator.department}
            </span>

            {/* Quick Details */}
            <div className="w-full text-left space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{operator.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{operator.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{operator.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Tenure since {operator.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Active Session Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-4 shadow-xs text-xs space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active Session Security
            </h3>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Authentication</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Password + RBAC</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Current Node</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Terminal 01 (Front Desk)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Audit Status</span>
              <span className="font-bold text-emerald-600">Logged & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Privileges & Preferences */}
        <div className="lg:col-span-2 space-y-5">
          {/* Privileges Matrix Summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Assigned Permissions & Privileges
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your profile has full Super Admin clearance across all resort operational modules.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Reservations & Check-In</div>
                  <div className="text-[10px] text-slate-400">Create, edit, cancel & refund bookings</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Dining POS & Tables</div>
                  <div className="text-[10px] text-slate-400">Order entry, menu pricing & room posting</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Financial Cash Register</div>
                  <div className="text-[10px] text-slate-400">Shift open/close, expense vouchers & ledger</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">System Config & Settings</div>
                  <div className="text-[10px] text-slate-400">Tax rules, outlet setup & database resets</div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              Operator System Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Customize notification alerts and front desk workstation settings.
            </p>

            <div className="space-y-3.5 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Real-time Check-In Alerts</div>
                  <div className="text-[10px] text-slate-400">Play chime when new reservations arrive</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailAlerts}
                  onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                  className="h-4 w-4 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Kitchen Order Chimes (KDS)</div>
                  <div className="text-[10px] text-slate-400">Sound notification when ticket marked ready</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.posSound}
                  onChange={(e) => setPreferences({ ...preferences, posSound: e.target.checked })}
                  className="h-4 w-4 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
                />
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" onClick={handleSavePreferences}>
                Save Profile Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

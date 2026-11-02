'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Key,
  Camera,
  MapPin,
  ArrowUpDown,
  X,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export interface UserProfileViewProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

interface LoginActivityRecord {
  sn: number;
  userName: string;
  loginTime: string;
  browser: string;
  ip: string;
  hasLocation: boolean;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onBack,
  showBackButton = false,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read current tenant details from localStorage or sensible defaults
  const currentTenant = useMemo(() => {
    if (typeof localStorage === 'undefined') {
      return {
        username: 'tilottama',
        name: '-',
        hotelName: 'Tilottama Hi Tech Lab',
        clientCode: '101',
        phone: '9867296018',
        email: 'tilottamahitechlab@gmail.com',
      };
    }
    const username = localStorage.getItem('auth_username') || 'tilottama';
    const hotelName = localStorage.getItem('auth_hotel_name') || 'Tilottama Hi Tech Lab';
    const name = localStorage.getItem('auth_name') || '-';
    const clientCode = localStorage.getItem('auth_client_code') || '101';
    const phone = localStorage.getItem('auth_phone') || '9867296018';
    const email = localStorage.getItem('auth_email') || 'tilottamahitechlab@gmail.com';

    return {
      username,
      name,
      hotelName,
      clientCode,
      phone,
      email,
    };
  }, []);

  const [profileData, setProfileData] = useState({
    fullName: currentTenant.name,
    username: currentTenant.username,
    mobile: currentTenant.phone,
    email: currentTenant.email,
    organization: currentTenant.hotelName,
    avatarUrl: '',
  });

  useEffect(() => {
    const savedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem('user_avatar_url') || '' : '';
    setProfileData({
      fullName: currentTenant.name,
      username: currentTenant.username,
      mobile: currentTenant.phone,
      email: currentTenant.email,
      organization: currentTenant.hotelName,
      avatarUrl: savedAvatar,
    });
  }, [currentTenant]);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: profileData.fullName,
    mobile: profileData.mobile,
    email: profileData.email,
    organization: profileData.organization,
  });

  useEffect(() => {
    setEditForm({
      fullName: profileData.fullName,
      mobile: profileData.mobile,
      email: profileData.email,
      organization: profileData.organization,
    });
  }, [profileData]);

  // Login Activity Pagination & Filter
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterDate, setFilterDate] = useState<string>('');

  // 10 mock records matching the exact screenshot
  const activityData: LoginActivityRecord[] = useMemo(() => {
    const baseSn = 11696;
    return [
      {
        sn: baseSn,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 01:28:08 PM',
        browser: '',
        ip: '113.199.224.234',
        hasLocation: true,
      },
      {
        sn: baseSn - 1,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 09:02:59 AM',
        browser: '',
        ip: '113.199.254.41',
        hasLocation: false,
      },
      {
        sn: baseSn - 2,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 09:01:05 AM',
        browser: '',
        ip: '113.199.254.41',
        hasLocation: false,
      },
      {
        sn: baseSn - 3,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 06:39:00 AM',
        browser: '',
        ip: '113.199.254.41',
        hasLocation: true,
      },
      {
        sn: baseSn - 4,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 06:24:30 AM',
        browser: '',
        ip: '113.199.254.41',
        hasLocation: false,
      },
      {
        sn: baseSn - 5,
        userName: profileData.username,
        loginTime: 'Nov 2, 2026, 06:21:47 AM',
        browser: '',
        ip: '113.199.252.235',
        hasLocation: true,
      },
      {
        sn: baseSn - 6,
        userName: profileData.username,
        loginTime: 'Nov 1, 2026, 09:00:40 PM',
        browser: '',
        ip: '113.199.252.4',
        hasLocation: false,
      },
      {
        sn: baseSn - 7,
        userName: profileData.username,
        loginTime: 'Nov 1, 2026, 08:01:19 PM',
        browser: '',
        ip: '113.199.252.4',
        hasLocation: false,
      },
      {
        sn: baseSn - 8,
        userName: profileData.username,
        loginTime: 'Nov 1, 2026, 07:05:36 PM',
        browser: '',
        ip: '113.199.252.4',
        hasLocation: false,
      },
      {
        sn: baseSn - 9,
        userName: profileData.username,
        loginTime: 'Nov 1, 2026, 07:01:51 PM',
        browser: '',
        ip: '113.199.252.4',
        hasLocation: false,
      },
    ];
  }, [profileData.username]);

  const filteredActivity = useMemo(() => {
    if (!filterDate) return activityData;
    return activityData.filter((item) =>
      item.loginTime.toLowerCase().includes(filterDate.toLowerCase())
    );
  }, [activityData, filterDate]);

  const paginatedActivity = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredActivity.slice(start, start + entriesPerPage);
  }, [filteredActivity, currentPage, entriesPerPage]);

  const totalPages = 1170; // Matching the screenshot's "1 2 3 4 5 ... 1170"

  // Handle password submit
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      toast.error('Mismatch', 'New password and confirm password do not match.');
      return;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('superadmin_clean_clients');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map((c: any) =>
            c.username?.toLowerCase() === profileData.username.toLowerCase()
              ? { ...c, password: newPasswordInput }
              : c
          );
          localStorage.setItem('superadmin_clean_clients', JSON.stringify(updated));
        }
      } catch {}
    }

    toast.success('Password Changed', 'Your account password has been updated securely.');
    setIsPasswordModalOpen(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  // Handle photo upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileData((prev) => ({ ...prev, avatarUrl: result }));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user_avatar_url', result);
      }
      toast.success('Profile Photo Updated', 'Your profile picture has been changed successfully.');
    };
    reader.readAsDataURL(file);
  };

  // Handle save edit profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileData((prev) => ({
      ...prev,
      fullName: editForm.fullName,
      mobile: editForm.mobile,
      email: editForm.email,
      organization: editForm.organization,
    }));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_name', editForm.fullName);
      localStorage.setItem('auth_phone', editForm.mobile);
      localStorage.setItem('auth_email', editForm.email);
      localStorage.setItem('auth_hotel_name', editForm.organization);
    }
    toast.success('Profile Updated', 'Personal information saved.');
    setIsEditProfileModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-10 font-sans text-slate-800 antialiased">
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Optional Back Button */}
      {showBackButton && onBack && (
        <div className="mb-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            ← Back to System Cards
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP HERO CARD: AVATAR, IDENTITY & 3 KEY STATS (EXACT TO SCREENSHOT)
         ========================================================================= */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shadow-xs">
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-9 h-9 stroke-[1.5]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#00A884] hover:bg-[#008f70] text-white flex items-center justify-center shadow-xs cursor-pointer transition-transform group-hover:scale-105"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              {profileData.username}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {profileData.username}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                SuperSchools
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1.5 text-[#00A884] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00A884] inline-block" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: 3 Key Metrics */}
        <div className="flex items-center gap-6 sm:gap-10 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 text-left md:text-right">
          {/* Stat 1: Last Login */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              LAST LOGIN
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              Nov 2, 2026
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              01:28 PM · 1 minute ago
            </div>
          </div>

          {/* Stat 2: Total Logins */}
          <div className="border-l border-slate-200 dark:border-slate-700 pl-6 sm:pl-10">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              TOTAL LOGINS
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              11,696
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              all time
            </div>
          </div>

          {/* Stat 3: Fiscal Year */}
          <div className="border-l border-slate-200 dark:border-slate-700 pl-6 sm:pl-10">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              FISCAL YEAR
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              -
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              current
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN SECTION: PERSONAL INFO & SECURITY (LEFT) vs LOGIN ACTIVITY (RIGHT)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Personal Information Card */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Personal Information
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="text-[11px] text-[#00A884] hover:underline font-semibold cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Full Name</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-medium">
                  {profileData.fullName || '-'}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Username</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  {profileData.username}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Mobile</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">
                  {profileData.mobile}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Email</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 truncate font-mono">
                  {profileData.email}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Organization</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                  {profileData.organization}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Account Security Card */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              Account Security
            </h3>

            {/* Row 1: Password */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E6F7F4] dark:bg-emerald-950/60 text-[#00A884] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Password</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Keep your account secure with a strong password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3.5 py-1.5 rounded-[4px] bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Change
              </button>
            </div>

            {/* Row 2: Profile Photo */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E6F7F4] dark:bg-emerald-950/60 text-[#00A884] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Profile Photo</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Shown in the top bar and on your activity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-[4px] bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Login Activity Card */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Login Activity
              </h3>

              <div className="flex items-center gap-4 text-xs flex-wrap">
                {/* Show entries dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 px-2 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-slate-400 dark:text-slate-500">entries</span>
                </div>

                {/* Date Picker & Clear */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Date</span>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-7 px-2 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 text-[11px]"
                  />
                  {filterDate && (
                    <button
                      type="button"
                      onClick={() => setFilterDate('')}
                      className="px-2.5 py-1 rounded-[4px] bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-[11px] cursor-pointer shadow-2xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Login Activity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>SN</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>User Name</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>Login Time</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span>Browser</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 cursor-pointer">
                        <span>IP</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {paginatedActivity.map((row) => (
                    <tr
                      key={row.sn}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {row.sn}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {row.userName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {row.loginTime}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {row.browser || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <span>{row.ip}</span>
                          {row.hasLocation && (
                            <MapPin className="w-3.5 h-3.5 text-[#00A884] shrink-0" />
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Matching Screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Previous
                </button>

                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-7 h-7 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                      currentPage === pageNum
                        ? 'bg-[#00A884] text-white shadow-2xs'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {pageNum}
                  </button>
                ))}

                <span className="px-1 text-slate-400 font-mono">...</span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    'px-2 h-7 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer',
                    currentPage === totalPages
                      ? 'bg-[#00A884] text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {totalPages}
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: CHANGE PASSWORD MODAL
         ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071F1A] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E6F7F4] text-[#00A884] flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update password for user <strong className="text-slate-700 dark:text-slate-300">{profileData.username}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 pr-9 focus:outline-hidden focus:border-[#00A884]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT PERSONAL INFORMATION MODAL
         ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071F1A] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E6F7F4] text-[#00A884] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Personal Information
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update contact details for profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="e.g. Tilottama Administrator"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  placeholder="e.g. 9867296018"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="e.g. tilottamahitechlab@gmail.com"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={editForm.organization}
                  onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                  placeholder="e.g. Tilottama Hi Tech Lab"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#00A884]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#00A884] hover:bg-[#008f70] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Save Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


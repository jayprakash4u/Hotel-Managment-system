'use client';

import React, { useState } from 'react';
import { Users, ShieldCheck, Calendar, CheckCircle2, Lock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { SYSTEM_PERMISSIONS, checkPermission } from '@/lib/permissions';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

const TABS: Array<{ id: 'directory' | 'rbac' | 'shifts'; label: string; icon: any }> = [
  { id: 'directory', label: 'Staff Directory', icon: Users },
  { id: 'rbac', label: 'RBAC Permissions Matrix', icon: ShieldCheck },
  { id: 'shifts', label: 'Duty Shifts & Rosters', icon: Calendar },
];

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'rbac' | 'shifts'>('directory');
  const [selectedRole, setSelectedRole] = useState('ADMIN');

  const staffRoster = [
    {
      id: '1',
      name: 'Alexander Sterling',
      email: 'alexander@hotelos.app',
      role: 'ADMIN',
      roleTitle: 'General Manager (Super Admin)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      shift: 'Executive Management (All Day)',
      phone: '+1 (555) 019-2831',
    },
    {
      id: '2',
      name: 'Elena Rostova',
      email: 'elena.frontdesk@hotelos.app',
      role: 'FRONT_DESK',
      roleTitle: 'Chief Receptionist',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      shift: 'Day Shift (07:00 - 15:30)',
      phone: '+1 (555) 019-8832',
    },
    {
      id: '3',
      name: 'Marcus Vance',
      email: 'marcus.frontdesk@hotelos.app',
      role: 'FRONT_DESK',
      roleTitle: 'Evening Duty Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      shift: 'Evening Shift (15:00 - 23:30)',
      phone: '+1 (555) 019-3321',
    },
    {
      id: '4',
      name: 'Maria Santos',
      email: 'maria.housekeeping@hotelos.app',
      role: 'HOUSEKEEPING',
      roleTitle: 'Housekeeping Lead',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      shift: 'Morning Cleaning (06:30 - 15:00)',
      phone: '+1 (555) 019-7711',
    },
    {
      id: '5',
      name: 'David Kim',
      email: 'david.cashier@hotelos.app',
      role: 'POS_CASHIER',
      roleTitle: 'Outlets POS Captain',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      shift: 'F&B Shift (12:00 - 22:00)',
      phone: '+1 (555) 019-4450',
    },
    {
      id: '6',
      name: 'Chef Jean-Pierre Laurent',
      email: 'jeanpierre@hotelos.app',
      role: 'CHEF',
      roleTitle: 'Executive Head Chef',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      shift: 'Kitchen Executive (10:00 - 22:00)',
      phone: '+1 (555) 019-9944',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Staff & Access Control"
        subtitle="Employee directory, duty shift schedules, and the module → resource → action RBAC permissions matrix"
      />

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'directory' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-900/60 text-current">
                  {staffRoster.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffRoster.map((staff) => (
            <div key={staff.id} className={`p-5 ${cardClass} flex items-start gap-4`}>
              <img src={staff.avatar} alt={staff.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white font-heading truncate">{staff.name}</h4>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{staff.roleTitle}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{staff.email}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{staff.shift}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className={`flex flex-wrap items-center justify-between gap-3 p-4 ${cardClass}`}>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Granular RBAC System</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hierarchical module → resource → action permissions</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">Role:</span>
              {['ADMIN', 'FRONT_DESK', 'HOUSEKEEPING', 'POS_CASHIER', 'CHEF', 'FINANCE_OFFICER'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedRole === r
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Permission Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Access for {selectedRole}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SYSTEM_PERMISSIONS.map((perm) => {
                const isGranted = checkPermission(selectedRole, perm.key);
                return (
                  <TableRow key={perm.key}>
                    <TableCell className="font-medium text-xs text-amber-700 dark:text-amber-400">{perm.moduleLabel}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900 dark:text-white">{perm.resourceLabel}</TableCell>
                    <TableCell className="text-xs font-mono">{perm.action}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{perm.key}</TableCell>
                    <TableCell className="text-xs">{perm.description}</TableCell>
                    <TableCell className="text-right">
                      {isGranted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 text-[10px]">
                          <Lock className="w-3 h-3" /> Denied
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: SHIFTS */}
      {activeTab === 'shifts' && (
        <div className={`p-6 ${cardClass} space-y-4`}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Active Duty Shift Schedules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-medium text-xs text-amber-700 dark:text-amber-400">Morning Shift (07:00 - 15:30)</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Front Desk: Elena Rostova</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Housekeeping: Maria Santos</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-medium text-xs text-blue-700 dark:text-blue-300">Evening Shift (15:00 - 23:30)</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Front Desk: Marcus Vance</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Cafe POS: David Kim</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-medium text-xs text-purple-700 dark:text-purple-300">Night Shift (23:00 - 07:30)</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">Night Auditor & Security Team</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

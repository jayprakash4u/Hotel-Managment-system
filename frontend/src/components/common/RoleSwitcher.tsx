'use client';

import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { UserRole } from '@/lib/types';
import { Shield, Sparkles, Check, ChevronDown, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoleSwitcher: React.FC = () => {
  const { role, user, setRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const roles: Array<{ id: UserRole; title: string; desc: string; icon: string; badge: string }> = [
    {
      id: 'ADMIN',
      title: 'General Manager (Admin)',
      desc: 'Full PMS access, revenue analytics, financial controls & system settings',
      icon: '👑',
      badge: 'All Permissions',
    },
    {
      id: 'FRONT_DESK',
      title: 'Front Desk Receptionist',
      desc: 'Guest check-in/out, tape chart, walk-ins, reservations & room matrix',
      icon: '🛎️',
      badge: 'Front Office',
    },
    {
      id: 'HOUSEKEEPING',
      title: 'Housekeeping Lead',
      desc: 'Room cleaning board, inspections, linen inventory & maintenance reporting',
      icon: '🧹',
      badge: 'Room Operations',
    },
    {
      id: 'POS_CASHIER',
      title: 'F&B & Spa POS Cashier',
      desc: 'Point of sale ordering for restaurant, rooftop bar, and direct folio charges',
      icon: '🍷',
      badge: 'Outlets POS',
    },
    {
      id: 'GUEST',
      title: 'VIP In-Stay Guest',
      desc: 'Guest view: Room service ordering, spa bookings & live folio',
      icon: '✨',
      badge: 'Guest Concierge',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs shadow-sm group"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
          {role === 'ADMIN' ? '👑' : role === 'FRONT_DESK' ? '🛎️' : role === 'HOUSEKEEPING' ? '🧹' : role === 'POS_CASHIER' ? '🍷' : '✨'}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <span>{user.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-amber-500/20">
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-2.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-800 mb-1.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulate Staff Role</p>
                <p className="text-[11px] text-slate-500">Switch role to test specific workflows</p>
              </div>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-1">
              {roles.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRole(r.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 group',
                      isActive
                        ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                        : 'hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent'
                    )}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-xs font-semibold', isActive ? 'text-amber-300' : 'text-slate-200')}>
                          {r.title}
                        </p>
                        {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

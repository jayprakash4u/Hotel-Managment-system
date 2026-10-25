'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, ShieldCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdministrationSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  badge?: string;
  description?: string;
}

export const ADMINISTRATION_SUB_OPTIONS: AdministrationSubOption[] = [
  {
    id: 'business-setup',
    name: 'Business Setup',
    href: '/administration?tab=business-setup',
    icon: Building2,
    iconColor: 'text-[#0B3D32] dark:text-emerald-400',
    tag: 'ORGANIZATION',
    badge: 'Property & Masters',
    description: 'Property details, contact info, legal entity & resort branches',
  },
  {
    id: 'staff-users',
    name: 'Staff & Users',
    href: '/administration?tab=staff-users',
    icon: Users,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    tag: 'PERSONNEL',
    badge: 'Roster & Shifts',
    description: 'Staff directory, duty shifts, phone contact & account status',
  },
  {
    id: 'roles-permissions',
    name: 'Roles & Permissions',
    href: '/administration?tab=roles-permissions',
    icon: ShieldCheck,
    iconColor: 'text-rose-600 dark:text-rose-400',
    tag: 'SECURITY',
    badge: 'RBAC Matrix',
    description: 'Role access control, supervisor override & module privileges',
  },
  {
    id: 'system-settings',
    name: 'System Settings',
    href: '/administration?tab=system-settings',
    icon: Settings,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'PREFERENCES',
    badge: 'Taxes & Policies',
    description: 'VAT percentage, check-out rules, system currencies & backup',
  },
];

export const AdministrationNavBoxes: React.FC<{
  className?: string;
  activeId?: string;
  onSelectOption?: (id: string) => void;
}> = ({ className, activeId, onSelectOption }) => {
  const pathname = usePathname();

  return (
    <div className={cn('select-none', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {ADMINISTRATION_SUB_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          const handleClick = () => {
            if (onSelectOption) {
              onSelectOption(item.id);
            }
          };

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleClick}
              className={cn(
                'group relative flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-all duration-150',
                'rounded-lg border bg-white dark:bg-[#071F1A] shadow-xs min-h-[82px] sm:min-h-[88px]',
                isActive
                  ? 'border-[#0B3D32] bg-[#E8F2EE] text-[#0B3D32] ring-1 ring-[#0B3D32] dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#0B3D32] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:shadow-xs'
              )}
            >
              <span
                className={cn(
                  'absolute top-1.5 right-1.5 rounded-[2px] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider',
                  isActive
                    ? 'border border-[#0B3D32]/30 bg-[#0B3D32]/10 text-[#0B3D32] dark:border-emerald-700/50 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]'
                )}
              >
                {item.tag}
              </span>

              <div className="mb-2 transition-transform duration-150 group-hover:scale-110">
                <Icon className={cn('w-5 h-5 stroke-[1.8]', item.iconColor)} />
              </div>

              <span className="text-xs font-semibold leading-tight px-0.5 line-clamp-1">
                {item.name}
              </span>

              {item.badge && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

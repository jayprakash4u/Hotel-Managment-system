'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceTabsContext } from '@/context/WorkspaceTabsContext';
import {
  BookOpen,
  FileText,
  Book,
  Calculator,
  Users,
  Truck,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  Landmark,
  Receipt,
  BarChart3,
  Scale,
  ShieldCheck,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccountSubOption {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  tag: string;
  description?: string;
}

export const ACCOUNTS_SUB_OPTIONS: AccountSubOption[] = [
  { id: 'chart-of-accounts', name: 'Chart of Accounts', href: '/accounts?tab=chart-of-accounts', icon: BookOpen, iconColor: 'text-emerald-600 dark:text-emerald-400', tag: 'GL' },
  { id: 'journal-entries', name: 'Journal Entries', href: '/accounts?tab=journal-entries', icon: FileText, iconColor: 'text-blue-600 dark:text-blue-400', tag: 'JOURNAL' },
  { id: 'general-ledger', name: 'General Ledger', href: '/accounts?tab=general-ledger', icon: Book, iconColor: 'text-indigo-600 dark:text-indigo-400', tag: 'LEDGER' },
  { id: 'trial-balance', name: 'Trial Balance', href: '/accounts?tab=trial-balance', icon: Calculator, iconColor: 'text-violet-600 dark:text-violet-400', tag: 'BALANCE' },
  { id: 'sales-transactions', name: 'Sales Transactions', href: '/accounts?tab=sales-transactions', icon: TrendingUp, iconColor: 'text-green-600 dark:text-green-400', tag: 'SALES' },
  { id: 'customer-ledger', name: 'Customer Ledger', href: '/accounts?tab=customer-ledger', icon: Users, iconColor: 'text-teal-600 dark:text-teal-400', tag: 'AR' },
  { id: 'purchase-transactions', name: 'Purchase Transactions', href: '/accounts?tab=purchase-transactions', icon: Truck, iconColor: 'text-orange-600 dark:text-orange-400', tag: 'PURCHASES' },
  { id: 'supplier-ledger', name: 'Supplier Ledger', href: '/accounts?tab=supplier-ledger', icon: Truck, iconColor: 'text-amber-600 dark:text-amber-400', tag: 'AP' },
  { id: 'cash-accounts', name: 'Cash Accounts', href: '/accounts?tab=cash-accounts', icon: Wallet, iconColor: 'text-emerald-600 dark:text-emerald-400', tag: 'CASH' },
  { id: 'bank-accounts', name: 'Bank & Wallet Accounts', href: '/accounts?tab=bank-accounts', icon: Landmark, iconColor: 'text-blue-600 dark:text-blue-400', tag: 'BANK & WALLET' },
  { id: 'bank-reconciliation', name: 'Bank Reconciliation', href: '/accounts?tab=bank-reconciliation', icon: Receipt, iconColor: 'text-cyan-600 dark:text-cyan-400', tag: 'RECON' },
  { id: 'income', name: 'Income', href: '/accounts?tab=income', icon: TrendingUp, iconColor: 'text-green-600 dark:text-green-400', tag: 'INCOME' },
  { id: 'expenses', name: 'Expenses', href: '/accounts?tab=expenses', icon: TrendingDown, iconColor: 'text-rose-600 dark:text-rose-400', tag: 'EXPENSES' },
  { id: 'fixed-assets', name: 'Fixed Assets', href: '/accounts?tab=fixed-assets', icon: Building2, iconColor: 'text-slate-600 dark:text-slate-400', tag: 'ASSETS' },
  { id: 'liabilities', name: 'Liabilities', href: '/accounts?tab=liabilities', icon: Receipt, iconColor: 'text-red-600 dark:text-red-400', tag: 'LIAB' },
  { id: 'tax-management', name: 'Tax Management', href: '/accounts?tab=tax-management', icon: ShieldCheck, iconColor: 'text-purple-600 dark:text-purple-400', tag: 'TAX' },
  { id: 'profit-loss', name: 'Profit & Loss', href: '/accounts?tab=profit-loss', icon: BarChart3, iconColor: 'text-indigo-600 dark:text-indigo-400', tag: 'P&L' },
  { id: 'balance-sheet', name: 'Balance Sheet', href: '/accounts?tab=balance-sheet', icon: Scale, iconColor: 'text-blue-600 dark:text-blue-400', tag: 'BS' },
  { id: 'cash-flow', name: 'Cash Flow', href: '/accounts?tab=cash-flow', icon: Landmark, iconColor: 'text-cyan-600 dark:text-cyan-400', tag: 'CF' },
  { id: 'financial-summary', name: 'Financial Summary', href: '/accounts?tab=financial-summary', icon: PieChart, iconColor: 'text-emerald-600 dark:text-emerald-400', tag: 'SUMMARY' },
];

export const AccountsNavBoxes: React.FC<{ className?: string; activeId?: string }> = ({
  className,
  activeId,
}) => {
  const tabsContext = useContext(WorkspaceTabsContext);

  const handleBoxClick = (e: React.MouseEvent, item: AccountSubOption) => {
    if (tabsContext && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      tabsContext.openTab({
        path: item.href,
        title: item.name,
      });
    }
  };

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5', className)}>
      {ACCOUNTS_SUB_OPTIONS.map((item) => {
        const Icon = item.icon;
        const isSelected = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={(e) => handleBoxClick(e, item)}
            className={cn(
              'group relative flex flex-col items-center justify-center p-2.5 text-center transition-all duration-150',
              'rounded-[4px] border min-h-[68px] sm:min-h-[72px]',
              isSelected
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)] text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] dark:border-[var(--brand-primary)] dark:bg-[var(--brand-primary-subtle-calc)] dark:text-[var(--brand-primary)]'
                : 'border-[var(--border-default)] bg-[var(--surface-card)] text-slate-700 dark:text-slate-200 hover:border-[var(--brand-primary)] hover:bg-slate-50/70 dark:hover:bg-slate-800/60'
            )}
            title={item.name}
          >
            <Icon className={cn('w-4 h-4 sm:w-4.5 sm:h-4.5 mb-1.5 transition-transform group-hover:scale-105 stroke-[1.25]', item.iconColor)} />
            <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

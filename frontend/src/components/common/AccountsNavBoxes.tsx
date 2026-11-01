'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
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
  { id: 'overview', name: 'Overview', href: '/accounts', icon: LayoutGrid, iconColor: 'text-slate-600', tag: 'OVERVIEW', description: 'Accounts overview & summary' },
  { id: 'chart-of-accounts', name: 'Chart of Accounts', href: '/accounts?tab=chart-of-accounts', icon: BookOpen, iconColor: 'text-emerald-600', tag: 'GL', description: 'Chart of accounts master' },
  { id: 'journal-entries', name: 'Journal Entries', href: '/accounts?tab=journal-entries', icon: FileText, iconColor: 'text-blue-600', tag: 'JOURNAL', description: 'Journal entries & postings' },
  { id: 'general-ledger', name: 'General Ledger', href: '/accounts?tab=general-ledger', icon: Book, iconColor: 'text-indigo-600', tag: 'LEDGER', description: 'General ledger view' },
  { id: 'trial-balance', name: 'Trial Balance', href: '/accounts?tab=trial-balance', icon: Calculator, iconColor: 'text-violet-600', tag: 'BALANCE', description: 'Trial balance report' },
  { id: 'sales-transactions', name: 'Sales Transactions', href: '/accounts?tab=sales-transactions', icon: TrendingUp, iconColor: 'text-green-600', tag: 'SALES', description: 'Sales transactions' },
  { id: 'customer-ledger', name: 'Customer Ledger', href: '/accounts?tab=customer-ledger', icon: Users, iconColor: 'text-teal-600', tag: 'AR', description: 'Customer ledger / receivables' },
  { id: 'purchase-transactions', name: 'Purchase Transactions', href: '/accounts?tab=purchase-transactions', icon: Truck, iconColor: 'text-orange-600', tag: 'PURCHASES', description: 'Purchase transactions' },
  { id: 'supplier-ledger', name: 'Supplier Ledger', href: '/accounts?tab=supplier-ledger', icon: Truck, iconColor: 'text-amber-600', tag: 'AP', description: 'Supplier ledger / payables' },
  { id: 'cash-accounts', name: 'Cash Accounts', href: '/accounts?tab=cash-accounts', icon: Wallet, iconColor: 'text-emerald-600', tag: 'CASH', description: 'Cash accounts' },
  { id: 'bank-accounts', name: 'Bank Accounts', href: '/accounts?tab=bank-accounts', icon: Landmark, iconColor: 'text-blue-600', tag: 'BANK', description: 'Bank accounts' },
  { id: 'bank-reconciliation', name: 'Bank Reconciliation', href: '/accounts?tab=bank-reconciliation', icon: Receipt, iconColor: 'text-cyan-600', tag: 'RECON', description: 'Bank reconciliation' },
  { id: 'income', name: 'Income', href: '/accounts?tab=income', icon: TrendingUp, iconColor: 'text-green-600', tag: 'INCOME', description: 'Income entries' },
  { id: 'expenses', name: 'Expenses', href: '/accounts?tab=expenses', icon: TrendingDown, iconColor: 'text-rose-600', tag: 'EXPENSES', description: 'Expense entries' },
  { id: 'fixed-assets', name: 'Fixed Assets', href: '/accounts?tab=fixed-assets', icon: Building2, iconColor: 'text-slate-600', tag: 'ASSETS', description: 'Fixed assets' },
  { id: 'liabilities', name: 'Liabilities', href: '/accounts?tab=liabilities', icon: Receipt, iconColor: 'text-red-600', tag: 'LIAB', description: 'Liabilities' },
  { id: 'tax-management', name: 'Tax Management', href: '/accounts?tab=tax-management', icon: Calculator, iconColor: 'text-purple-600', tag: 'TAX', description: 'Tax management' },
  { id: 'profit-loss', name: 'Profit & Loss', href: '/accounts?tab=profit-loss', icon: BarChart3, iconColor: 'text-indigo-600', tag: 'P&L', description: 'Profit & loss' },
  { id: 'balance-sheet', name: 'Balance Sheet', href: '/accounts?tab=balance-sheet', icon: BarChart3, iconColor: 'text-indigo-600', tag: 'BS', description: 'Balance sheet' },
  { id: 'cash-flow', name: 'Cash Flow', href: '/accounts?tab=cash-flow', icon: BarChart3, iconColor: 'text-indigo-600', tag: 'CF', description: 'Cash flow' },
  { id: 'financial-summary', name: 'Financial Summary', href: '/accounts?tab=financial-summary', icon: BarChart3, iconColor: 'text-indigo-600', tag: 'SUMMARY', description: 'Financial summary' },
];

export const AccountsNavBoxes: React.FC<{ className?: string; activeId?: string }> = ({ className, activeId }) => {
  const pathname = usePathname();
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2', className)}>
      {ACCOUNTS_SUB_OPTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center rounded border p-3 text-center min-h-[84px]',
              activeId === item.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle-calc)]' : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-primary)]'
            )}
          >
            <Icon className={cn('w-6 h-6 mb-2', item.iconColor)} />
            <span className="text-xs font-semibold">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

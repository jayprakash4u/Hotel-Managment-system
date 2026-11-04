'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { AccountsNavBoxes } from '@/components/common/AccountsNavBoxes';
import CustomerLedgerAccountsTab from '@/components/accounts/CustomerLedgerAccountsTab';

function AccountsContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  if (currentTab === 'customer-ledger') {
    return (
      <div className="space-y-4 pb-12 select-none">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/accounts"
              className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accounts Hub</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Customer Ledger &amp; Receivables</span>
            </span>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300">
            Accounts · Shared Module
          </span>
        </div>

        {/* Customer Ledger Tab */}
        <CustomerLedgerAccountsTab />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Accounts &amp; Financial Management Hub
          </span>
        </div>
        <AccountsNavBoxes activeId={currentTab || 'overview'} />
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

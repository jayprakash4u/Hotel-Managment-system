'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { AccountsNavBoxes } from '@/components/common/AccountsNavBoxes';

export default function AccountsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Accounts
          </span>
        </div>
        <AccountsNavBoxes />
      </div>
    </div>
  );
}

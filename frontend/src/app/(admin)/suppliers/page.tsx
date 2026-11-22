'use client';

import React from 'react';
import { SuppliersView } from '@/components/inventory/SuppliersView';
import { BackButton } from '@/components/common/BackButton';

export default function SuppliersPage() {
  return (
    <div className="space-y-3.5 w-full min-w-0 pb-14 select-none font-sans">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Suppliers &amp; Vendors</span>
          </h1>
        </div>
      </div>

      <SuppliersView showHeader={true} />
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { AdministrationNavBoxes } from '@/components/common/AdministrationNavBoxes';

export default function AdministrationPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================================
          TOP NAVIGATION BOXES (QUICK HUB MODULES ONLY)
          ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick Hub Modules
          </span>
        </div>
        <AdministrationNavBoxes />
      </div>
    </div>
  );
}

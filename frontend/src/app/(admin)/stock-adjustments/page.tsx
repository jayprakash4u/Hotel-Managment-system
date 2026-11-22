'use client';

import React, { useState, useEffect } from 'react';
import { StockAdjustmentsView } from '@/components/inventory/StockAdjustmentsView';
import { BackButton } from '@/components/common/BackButton';
import { InventoryItemData } from '@/lib/types';

export default function StockAdjustmentsPage() {
  const [items, setItems] = useState<InventoryItemData[]>([]);

  useEffect(() => {
    fetch('/api/inventory/items')
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setItems(res.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-14 select-none font-sans">
      {/* 1. Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Stock Adjustments</span>
          </h1>
        </div>
      </div>

      {/* 2. Stock Adjustments View */}
      <StockAdjustmentsView items={items} showHeader={false} />
    </div>
  );
}

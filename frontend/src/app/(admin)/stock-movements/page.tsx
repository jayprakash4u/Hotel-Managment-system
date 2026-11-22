'use client';

import React, { useState, useEffect } from 'react';
import { StockMovementLedgerView } from '@/components/inventory/StockMovementLedgerView';
import { BackButton } from '@/components/common/BackButton';
import { Activity, Plus, RotateCcw } from 'lucide-react';
import { InventoryItemData } from '@/lib/types';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';

export default function StockMovementsPage() {
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
            <span>Stock Movements</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Adjustment</span>
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh movements ledger"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Stock Movement Ledger View */}
      <StockMovementLedgerView key={refreshKey} items={items} showHeader={false} />

      {/* Quick Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          items={items}
          onSuccess={() => {
            setIsAdjustmentModalOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

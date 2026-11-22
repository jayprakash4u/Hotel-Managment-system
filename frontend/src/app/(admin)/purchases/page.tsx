'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PurchasesView } from '@/components/inventory/PurchasesView';
import { BackButton } from '@/components/common/BackButton';
import { Plus, RotateCcw, ShoppingCart } from 'lucide-react';
import { PurchaseRecord, SupplierRecord } from '@/lib/types';
import { InventoryItem } from '@/components/inventory/DepartmentInventoryView';
import { NewPurchaseModal } from '@/components/inventory/NewPurchaseModal';
import { cn } from '@/lib/utils';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, poRes, supRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/inventory/purchases').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/suppliers').then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (itemsRes?.success && Array.isArray(itemsRes.data)) {
        setItems(itemsRes.data);
      }
      if (poRes?.success && Array.isArray(poRes.data)) {
        setPurchases(poRes.data);
      }
      if (supRes?.success && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data);
      }
    } catch {
      // Fallback demo purchases handled inside PurchasesView
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-14 select-none font-sans">
      {/* 1. Dedicated Page Header Bar (matching Billing & Invoices) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Purchases</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewPurchaseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh purchases"
          >
            <RotateCcw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Main Purchases View */}
      <PurchasesView
        purchases={purchases}
        items={items}
        suppliers={suppliers}
        loading={loading}
        onRefresh={loadData}
        showHeader={false}
      />

      {/* 3. New Purchase Modal Trigger from Page Header */}
      {isNewPurchaseOpen && (
        <NewPurchaseModal
          isOpen={isNewPurchaseOpen}
          onClose={() => setIsNewPurchaseOpen(false)}
          onPurchaseCreated={() => {
            loadData();
          }}
          initialDepartment="RESTAURANT"
        />
      )}
    </div>
  );
}

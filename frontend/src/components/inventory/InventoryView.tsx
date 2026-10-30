'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useBusinessModules } from '@/lib/businessSetup';
import { DepartmentInventoryView, InventoryItem } from './DepartmentInventoryView';
import { PurchasesView, PurchaseRecord } from './PurchasesView';
import { SuppliersView, SupplierRecord } from './SuppliersView';
import { StockTransfersView, StockTransferRecord } from './StockTransfersView';
import {
  Boxes,
  Hotel,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { InventoryNavBoxes } from '@/components/common/InventoryNavBoxes';

export type InventoryTab =
  | 'RESTAURANT_INVENTORY'
  | 'HOTEL_INVENTORY'
  | 'PURCHASES'
  | 'SUPPLIERS'
  | 'STOCK_TRANSFERS';

interface InventoryViewProps {
  initialTab?: InventoryTab;
}

function InventoryContent({ initialTab }: InventoryViewProps) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { moduleType, isHotelEnabled, isRestaurantEnabled, isTransfersEnabled } = useBusinessModules();

  const urlDept = searchParams?.get('dept')?.toUpperCase();
  const urlTab = searchParams?.get('tab')?.toLowerCase();

  // Determine active tab from search params or business module
  const computeActiveTab = (): InventoryTab => {
    if (initialTab) return initialTab;
    if (urlDept === 'RESTAURANT' && isRestaurantEnabled) return 'RESTAURANT_INVENTORY';
    if (urlDept === 'HOTEL' && isHotelEnabled) return 'HOTEL_INVENTORY';
    if (urlTab === 'purchases') return 'PURCHASES';
    if (urlTab === 'suppliers') return 'SUPPLIERS';
    if (urlTab === 'transfers' && isTransfersEnabled) return 'STOCK_TRANSFERS';

    if (isRestaurantEnabled) return 'RESTAURANT_INVENTORY';
    if (isHotelEnabled) return 'HOTEL_INVENTORY';
    return 'PURCHASES';
  };

  const [activeTab, setActiveTab] = useState<InventoryTab>(computeActiveTab);

  // Sync tab when search params or module setup change
  useEffect(() => {
    setActiveTab(computeActiveTab());
  }, [urlDept, urlTab, isHotelEnabled, isRestaurantEnabled, isTransfersEnabled]);

  // Core Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [transfers, setTransfers] = useState<StockTransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, poRes, supRes, trfRes] = await Promise.all([
        fetch('/api/inventory/items').then((r) => r.json()),
        fetch('/api/inventory/purchases').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
        fetch('/api/inventory/transfers').then((r) => r.json()),
      ]);

      if (itemsRes.success && Array.isArray(itemsRes.data)) {
        setItems(itemsRes.data);
      }
      if (poRes.success && Array.isArray(poRes.data)) {
        setPurchases(poRes.data);
      }
      if (supRes.success && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data);
      }
      if (trfRes.success && Array.isArray(trfRes.data)) {
        setTransfers(trfRes.data);
      }
    } catch (err: any) {
      toast.error('Failed to load inventory data', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Tab Change
  const handleTabSelect = (tab: InventoryTab) => {
    setActiveTab(tab);
    if (tab === 'RESTAURANT_INVENTORY') {
      router.push('/inventory?dept=RESTAURANT');
    } else if (tab === 'HOTEL_INVENTORY') {
      router.push('/inventory?dept=HOTEL');
    } else if (tab === 'PURCHASES') {
      router.push('/inventory?tab=purchases');
    } else if (tab === 'SUPPLIERS') {
      router.push('/inventory?tab=suppliers');
    } else if (tab === 'STOCK_TRANSFERS') {
      router.push('/inventory?tab=transfers');
    }
  };

  const activeNavId = useMemo(() => {
    switch (activeTab) {
      case 'RESTAURANT_INVENTORY':
        return 'restaurant-inventory';
      case 'HOTEL_INVENTORY':
        return 'hotel-inventory';
      case 'PURCHASES':
        return 'purchases';
      case 'SUPPLIERS':
        return 'suppliers';
      case 'STOCK_TRANSFERS':
        return 'stock-transfers';
      default:
        return 'restaurant-inventory';
    }
  }, [activeTab]);

  const counts = useMemo(
    () => ({
      restaurant: items.filter((i) => i.department === 'RESTAURANT').length,
      hotel: items.filter((i) => i.department === 'HOTEL').length,
      purchases: purchases.length,
      suppliers: suppliers.length,
      transfers: transfers.length,
    }),
    [items, purchases, suppliers, transfers]
  );

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* =====================================================================
          TOP INVENTORY NAVIGATION BOXES (MATCHING RESTAURANT & HOTEL PATTERN)
          ===================================================================== */}
      <InventoryNavBoxes
        activeId={activeNavId}
        counts={counts}
        onSelectOption={(navId) => {
          if (navId === 'restaurant-inventory') handleTabSelect('RESTAURANT_INVENTORY');
          else if (navId === 'hotel-inventory') handleTabSelect('HOTEL_INVENTORY');
          else if (navId === 'purchases') handleTabSelect('PURCHASES');
          else if (navId === 'suppliers') handleTabSelect('SUPPLIERS');
          else if (navId === 'stock-transfers') handleTabSelect('STOCK_TRANSFERS');
        }}
      />

      {/* =====================================================================
          VIEW SWITCHER
          ===================================================================== */}
      {activeTab === 'RESTAURANT_INVENTORY' && isRestaurantEnabled && (
        <DepartmentInventoryView
          department="RESTAURANT"
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'HOTEL_INVENTORY' && isHotelEnabled && (
        <DepartmentInventoryView
          department="HOTEL"
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'PURCHASES' && (
        <PurchasesView
          purchases={purchases}
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'SUPPLIERS' && (
        <SuppliersView
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'STOCK_TRANSFERS' && isTransfersEnabled && (
        <StockTransfersView
          transfers={transfers}
          items={items}
          isTransfersEnabled={isTransfersEnabled}
          loading={loading}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

export function InventoryView({ initialTab }: InventoryViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#0B3D32] dark:text-emerald-400 mr-2" />
          <span>Loading Inventory Management...</span>
        </div>
      }
    >
      <InventoryContent initialTab={initialTab} />
    </Suspense>
  );
}

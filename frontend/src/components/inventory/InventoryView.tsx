'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useBusinessModules } from '@/lib/businessSetup';
import { DepartmentInventoryView, InventoryItem } from './DepartmentInventoryView';
import { PurchasesView, PurchaseRecord } from './PurchasesView';
import { SuppliersView, SupplierRecord } from './SuppliersView';
import { StockTransfersView, StockTransferRecord } from './StockTransfersView';
import { ItemPurchaseLedgerView } from './ItemPurchaseLedgerView';
import { StockMovementLedgerView } from './StockMovementLedgerView';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { CategoriesView } from './CategoriesView';
import { UnitsOfMeasurementView } from './UnitsOfMeasurementView';
import {
  Boxes,
  Hotel,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  RefreshCw,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Receipt as ReceiptIcon,
  Activity,
  ShoppingBag,
  Tag,
  Scale,
} from 'lucide-react';

export type InventoryTab =
  | 'OVERVIEW'
  | 'ITEMS'
  | 'PURCHASE_LEDGER'
  | 'STOCK_MOVEMENTS'
  | 'SUPPLIERS'
  | 'RECEIVE_STOCK'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_TRANSFERS'
  | 'CATEGORIES'
  | 'UNITS'
  | 'RESTAURANT_INVENTORY'
  | 'HOTEL_INVENTORY'
  | 'PURCHASES';

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
    if (urlTab === 'overview') return 'OVERVIEW';
    if (urlTab === 'items') return 'ITEMS';
    if (urlTab === 'purchase-ledger') return 'PURCHASE_LEDGER';
    if (urlTab === 'stock-movements') return 'STOCK_MOVEMENTS';
    if (urlTab === 'suppliers') return 'SUPPLIERS';
    if (urlTab === 'receive-stock' || urlTab === 'purchases') return 'RECEIVE_STOCK';
    if (urlTab === 'stock-adjustments') return 'STOCK_ADJUSTMENT';
    if (urlTab === 'transfers' && isTransfersEnabled) return 'STOCK_TRANSFERS';
    if (urlTab === 'categories') return 'CATEGORIES';
    if (urlTab === 'units') return 'UNITS';

    // Legacy department query params
    if (urlDept === 'RESTAURANT' && isRestaurantEnabled) return 'ITEMS';
    if (urlDept === 'HOTEL' && isHotelEnabled) return 'ITEMS';

    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState<InventoryTab>(computeActiveTab);
  const [selectedDept, setSelectedDept] = useState<'RESTAURANT' | 'HOTEL'>(
    isRestaurantEnabled ? 'RESTAURANT' : 'HOTEL'
  );
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Sync tab when search params or module setup change
  useEffect(() => {
    setActiveTab(computeActiveTab());
    if (urlDept === 'RESTAURANT' || urlDept === 'HOTEL') {
      setSelectedDept(urlDept as 'RESTAURANT' | 'HOTEL');
    }
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
    switch (tab) {
      case 'OVERVIEW':
        router.push('/inventory?tab=overview');
        break;
      case 'ITEMS':
        router.push(`/inventory?tab=items&dept=${selectedDept}`);
        break;
      case 'PURCHASE_LEDGER':
        router.push('/inventory?tab=purchase-ledger');
        break;
      case 'STOCK_MOVEMENTS':
        router.push('/inventory?tab=stock-movements');
        break;
      case 'SUPPLIERS':
        router.push('/inventory?tab=suppliers');
        break;
      case 'RECEIVE_STOCK':
        router.push('/inventory?tab=receive-stock');
        break;
      case 'STOCK_ADJUSTMENT':
        router.push('/inventory?tab=stock-adjustments');
        break;
      case 'STOCK_TRANSFERS':
        router.push('/inventory?tab=transfers');
        break;
      case 'CATEGORIES':
        router.push('/inventory?tab=categories');
        break;
      case 'UNITS':
        router.push('/inventory?tab=units');
        break;
      default:
        router.push('/inventory?tab=overview');
        break;
    }
  };

  const activeNavId = useMemo(() => {
    switch (activeTab) {
      case 'OVERVIEW':
        return 'overview';
      case 'ITEMS':
      case 'RESTAURANT_INVENTORY':
      case 'HOTEL_INVENTORY':
        return 'items';
      case 'PURCHASE_LEDGER':
        return 'purchase-ledger';
      case 'STOCK_MOVEMENTS':
        return 'stock-movements';
      case 'SUPPLIERS':
        return 'suppliers';
      case 'RECEIVE_STOCK':
        return 'receive-stock';
      case 'STOCK_ADJUSTMENT':
        return 'stock-adjustments';
      case 'STOCK_TRANSFERS':
        return 'stock-transfers';
      case 'CATEGORIES':
        return 'categories';
      case 'UNITS':
        return 'units';
      default:
        return 'overview';
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

  interface InventoryTabItem {
    id: InventoryTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }

  const tabItems: InventoryTabItem[] = useMemo(() => {
    const list: InventoryTabItem[] = [
      { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
      { id: 'ITEMS', label: 'Inventory Items', icon: Package, count: items.length },
      { id: 'PURCHASE_LEDGER', label: 'Purchase Ledger', icon: ReceiptIcon },
      { id: 'STOCK_MOVEMENTS', label: 'Stock Movements', icon: Activity },
      { id: 'SUPPLIERS', label: 'Suppliers', icon: Users, count: suppliers.length },
      { id: 'RECEIVE_STOCK', label: 'Receive Stock', icon: ShoppingBag, count: purchases.length },
      { id: 'STOCK_ADJUSTMENT', label: 'Adjustments', icon: SlidersHorizontal },
    ];
    if (isTransfersEnabled) {
      list.push({ id: 'STOCK_TRANSFERS', label: 'Transfers', icon: ArrowLeftRight, count: transfers.length });
    }
    list.push(
      { id: 'CATEGORIES', label: 'Categories', icon: Tag },
      { id: 'UNITS', label: 'Units', icon: Scale }
    );
    return list;
  }, [items.length, suppliers.length, purchases.length, transfers.length, isTransfersEnabled]);

  return (
    <div className="space-y-3.5 select-none w-full min-w-0 pb-12 font-sans">
      {/* =====================================================================
          SLEEK HORIZONTAL INVENTORY NAVIGATION TAB STRIP
          ===================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-default dark:border-border-default no-scrollbar">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer shrink-0',
                isActive
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs dark:bg-emerald-700 dark:border-emerald-600'
                  : 'bg-white dark:bg-surface-card border-slate-200 dark:border-border-default text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-hover hover:border-slate-300'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-none',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-surface-muted dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          VIEW 1: INVENTORY OVERVIEW (MAIN COMPREHENSIVE TABLE)
          ===================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <DepartmentInventoryView
          department="ALL"
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {/* =====================================================================
          VIEW 2: INVENTORY ITEMS
          ===================================================================== */}
      {activeTab === 'ITEMS' && (
        <DepartmentInventoryView
          department="ALL"
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {/* =====================================================================
          VIEW 3: ITEM PURCHASE LEDGER (PURCHASE HISTORY)
          ===================================================================== */}
      {activeTab === 'PURCHASE_LEDGER' && (
        <ItemPurchaseLedgerView
          items={items}
          suppliers={suppliers}
        />
      )}

      {/* =====================================================================
          VIEW 4: STOCK MOVEMENT LEDGER
          ===================================================================== */}
      {activeTab === 'STOCK_MOVEMENTS' && (
        <StockMovementLedgerView
          items={items}
        />
      )}

      {/* =====================================================================
          VIEW 5: SUPPLIERS DIRECTORY
          ===================================================================== */}
      {activeTab === 'SUPPLIERS' && (
        <SuppliersView
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {/* =====================================================================
          VIEW 6: RECEIVE STOCK (SIMPLE & FULL DETAILS PURCHASES)
          ===================================================================== */}
      {activeTab === 'RECEIVE_STOCK' && (
        <PurchasesView
          purchases={purchases}
          items={items}
          suppliers={suppliers}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {/* =====================================================================
          VIEW 7: STOCK ADJUSTMENT
          ===================================================================== */}
      {activeTab === 'STOCK_ADJUSTMENT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Stock Adjustments & Corrections
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record physical counts, damaged stock, expiry, wastage or manual increases/decreases.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </div>

          <StockMovementLedgerView
            items={items}
          />

          <StockAdjustmentModal
            isOpen={isAdjustmentModalOpen}
            onClose={() => setIsAdjustmentModalOpen(false)}
            items={items}
            onSuccess={() => {
              loadData();
              setIsAdjustmentModalOpen(false);
            }}
          />
        </div>
      )}

      {/* =====================================================================
          VIEW 8: STOCK TRANSFER
          ===================================================================== */}
      {activeTab === 'STOCK_TRANSFERS' && isTransfersEnabled && (
        <StockTransfersView
          transfers={transfers}
          items={items}
          isTransfersEnabled={isTransfersEnabled}
          loading={loading}
          onRefresh={loadData}
        />
      )}

      {/* =====================================================================
          VIEW 9: INVENTORY CATEGORIES
          ===================================================================== */}
      {activeTab === 'CATEGORIES' && (
        <CategoriesView
          items={items}
          onSelectCategory={(cat) => {
            handleTabSelect('OVERVIEW');
          }}
        />
      )}

      {/* =====================================================================
          VIEW 10: UNITS OF MEASUREMENT
          ===================================================================== */}
      {activeTab === 'UNITS' && (
        <UnitsOfMeasurementView
          items={items}
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

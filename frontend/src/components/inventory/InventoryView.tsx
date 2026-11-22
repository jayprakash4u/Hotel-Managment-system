'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useBusinessModules } from '@/lib/businessSetup';
import { BackButton } from '@/components/common/BackButton';
import { InventoryNavBoxes } from '@/components/common/InventoryNavBoxes';
import { DepartmentInventoryView, InventoryItem } from './DepartmentInventoryView';
import { PurchasesView, PurchaseRecord } from './PurchasesView';
import { SuppliersView, SupplierRecord } from './SuppliersView';
import { StockTransfersView, StockTransferRecord } from './StockTransfersView';
import { ItemPurchaseLedgerView } from './ItemPurchaseLedgerView';
import { StockMovementLedgerView } from './StockMovementLedgerView';
import { StockAdjustmentsView } from './StockAdjustmentsView';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { AddItemModal } from './AddItemModal';
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
    if (initialTab && initialTab !== 'PURCHASES' && initialTab !== 'RECEIVE_STOCK') return initialTab;
    if (urlTab === 'suppliers') return 'SUPPLIERS';
    if (urlTab === 'stock-movements') return 'STOCK_MOVEMENTS';
    if (urlTab === 'purchase-ledger') return 'PURCHASE_LEDGER';
    if (urlTab === 'stock-adjustments') return 'STOCK_ADJUSTMENT';
    if (urlTab === 'transfers' && isTransfersEnabled) return 'STOCK_TRANSFERS';
    if (urlTab === 'categories') return 'CATEGORIES';
    if (urlTab === 'units') return 'UNITS';

    // Default to items table
    return 'ITEMS';
  };

  const [activeTab, setActiveTab] = useState<InventoryTab>(computeActiveTab);
  const [selectedDept, setSelectedDept] = useState<'RESTAURANT' | 'HOTEL'>(
    isRestaurantEnabled ? 'RESTAURANT' : 'HOTEL'
  );
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // Sync tab when search params or module setup change
  useEffect(() => {
    if (urlTab === 'receive-stock' || urlTab === 'purchases' || initialTab === 'PURCHASES' || initialTab === 'RECEIVE_STOCK') {
      router.replace('/purchases');
      return;
    }
    if (urlTab === 'suppliers' || initialTab === 'SUPPLIERS') {
      router.replace('/suppliers');
      return;
    }
    if (urlTab === 'stock-movements' || initialTab === 'STOCK_MOVEMENTS') {
      router.replace('/stock-movements');
      return;
    }
    setActiveTab(computeActiveTab());
    if (urlDept === 'RESTAURANT' || urlDept === 'HOTEL') {
      setSelectedDept(urlDept as 'RESTAURANT' | 'HOTEL');
    }
  }, [urlDept, urlTab, isHotelEnabled, isRestaurantEnabled, isTransfersEnabled, initialTab, router]);

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
      case 'ITEMS':
        router.push('/inventory?tab=items');
        break;
      case 'PURCHASE_LEDGER':
        router.push('/inventory?tab=purchase-ledger');
        break;
      case 'STOCK_MOVEMENTS':
        router.push('/stock-movements');
        break;
      case 'SUPPLIERS':
        router.push('/suppliers');
        break;
      case 'RECEIVE_STOCK':
      case 'PURCHASES':
        router.push('/purchases');
        break;
      case 'STOCK_ADJUSTMENT':
        router.push('/stock-adjustments');
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
        router.push('/inventory?tab=items');
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
  }

  const tabItems: InventoryTabItem[] = useMemo(() => {
    const list: InventoryTabItem[] = [
      { id: 'STOCK_MOVEMENTS', label: 'Stock Movements', icon: Activity },
      { id: 'SUPPLIERS', label: 'Suppliers', icon: Users },
      { id: 'STOCK_ADJUSTMENT', label: 'Adjustments', icon: SlidersHorizontal },
    ];
    if (isTransfersEnabled) {
      list.push({ id: 'STOCK_TRANSFERS', label: 'Transfers', icon: ArrowLeftRight });
    }
    return list;
  }, [isTransfersEnabled]);

  return (
    <div className="space-y-3 select-none w-full min-w-0 pb-12 font-sans">
      {/* 1. Header Bar: Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <h1
            onClick={() => handleTabSelect('ITEMS')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 cursor-pointer hover:text-[#0B3D32] transition-colors"
            title="Return to Stock Items"
          >
            Inventory
          </h1>
          {activeTab !== 'ITEMS' && activeTab !== 'OVERVIEW' && (
            <button
              type="button"
              onClick={() => handleTabSelect('ITEMS')}
              className="text-xs font-semibold text-[#0B3D32] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              ← Back to Stock Items
            </button>
          )}
        </div>

        {/* Action Buttons: Add Item & Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddItemModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh inventory"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tab Pills (Matching Image 2 exactly) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSelect(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap shadow-2xs shrink-0',
                isActive
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          VIEW: INVENTORY ITEMS (DEFAULT)
          ===================================================================== */}
      {(activeTab === 'ITEMS' || activeTab === 'OVERVIEW') && (
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
        <StockAdjustmentsView
          items={items}
          showHeader={false}
        />
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

      {/* Global Add Item Modal */}
      {isAddItemModalOpen && (
        <AddItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          department={selectedDept}
          existingItems={items.map((i) => ({ name: i.name, department: i.department || selectedDept }))}
          onItemCreated={() => {
            setIsAddItemModalOpen(false);
            loadData();
          }}
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

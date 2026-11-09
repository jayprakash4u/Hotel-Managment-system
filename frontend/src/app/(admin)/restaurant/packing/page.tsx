'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Boxes,
  FileText,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  CheckCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

type MainTab = 'ORDERS' | 'MATERIALS' | 'MAPPING' | 'REPORTS';
type OrderStatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type OrderTypeFilter = 'ALL' | 'TAKEAWAY' | 'DELIVERY';

interface PackingMaterial {
  id: string;
  name: string;
  unit: string;
  purchaseCost: number;
  packingCharge: number;
  availableStock: number;
  minStockThreshold: number;
  status: string;
  isLowStock: boolean;
  totalValuation: number;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderMaterial {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  packingCharge: number;
  totalCost: number;
  totalCharge: number;
  availableStock: number;
}

interface PackingOrder {
  orderId: string;
  orderNumber: string;
  kotNumber: string;
  orderType: string;
  kitchenStatus: string;
  packingStatus: string;
  packingCharge: number;
  totalActualCost: number;
  serverName: string;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  itemsCount: number;
  items: OrderItem[];
  materials: OrderMaterial[];
  materialsCount: number;
  packedAt: string | null;
  packedBy: string | null;
  createdAt: string;
}

interface MenuConfigItem {
  productId: string;
  productName: string;
  category: string;
  department: string;
  price: number;
  materialsCount: number;
  materials: {
    materialId: string;
    materialName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    packingCharge: number;
    totalEstimatedCost: number;
    totalEstimatedCharge: number;
  }[];
  estimatedPackingCharge: number;
  estimatedCost: number;
}

export default function PackingManagementPage() {
  const toast = useToast();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('ORDERS');

  // Orders Tab States
  const [orders, setOrders] = useState<PackingOrder[]>([]);
  const [orderCounts, setOrderCounts] = useState({ all: 0, pending: 0, inProgress: 0, completed: 0 });
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Materials Tab States
  const [materials, setMaterials] = useState<PackingMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialStatusFilter, setMaterialStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOW_STOCK'>('ALL');
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // Menu Mapping States
  const [menuConfigs, setMenuConfigs] = useState<MenuConfigItem[]>([]);
  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);

  // Reports States
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [consumptionReport, setConsumptionReport] = useState<any>(null);
  const [stockReport, setStockReport] = useState<any[]>([]);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportsLoading, setReportsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals States
  const [selectedOrderForComplete, setSelectedOrderForComplete] = useState<PackingOrder | null>(null);
  const [completePackingStaff, setCompletePackingStaff] = useState('Staff');
  const [editableOrderMaterials, setEditableOrderMaterials] = useState<OrderMaterial[]>([]);

  const [editingMaterial, setEditingMaterial] = useState<PackingMaterial | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    unit: 'pcs',
    purchaseCost: 0,
    packingCharge: 0,
    availableStock: 0,
    minStockThreshold: 20,
    status: 'ACTIVE',
  });

  const [stockAdjustMaterial, setStockAdjustMaterial] = useState<PackingMaterial | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState<number>(0);
  const [stockAdjustNotes, setStockAdjustNotes] = useState('');

  const [configuringMenuProduct, setConfiguringMenuProduct] = useState<MenuConfigItem | null>(null);
  const [selectedProductMaterials, setSelectedProductMaterials] = useState<{ materialId: string; materialName: string; quantity: number }[]>([]);

  // ---------------------------------------------------------------------------
  // Loaders
  // ---------------------------------------------------------------------------

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.getPackingDashboard({
        status: orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
        orderType: orderTypeFilter === 'ALL' ? undefined : orderTypeFilter,
        search: orderSearch || undefined,
      });
      if (res?.orders) {
        setOrders(res.orders);
        setOrderCounts(res.counts || { all: 0, pending: 0, inProgress: 0, completed: 0 });
      }
    } catch (err: any) {
      toast.error('Failed to load packing orders: ' + (err.message || 'Error'));
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const res = await api.getPackingMaterials({
        status: materialStatusFilter === 'ACTIVE' || materialStatusFilter === 'INACTIVE' ? materialStatusFilter : undefined,
        lowStockOnly: materialStatusFilter === 'LOW_STOCK' ? true : undefined,
        search: materialSearch || undefined,
      });
      if (Array.isArray(res)) {
        setMaterials(res);
      }
    } catch (err: any) {
      toast.error('Failed to load packing materials: ' + (err.message || 'Error'));
    } finally {
      setMaterialsLoading(false);
    }
  };

  const loadMenuMapping = async () => {
    try {
      setMappingLoading(true);
      const res = await api.getMenuPackingConfig({ search: mappingSearch || undefined });
      if (Array.isArray(res)) {
        setMenuConfigs(res);
      }
    } catch (err: any) {
      toast.error('Failed to load menu packing config: ' + (err.message || 'Error'));
    } finally {
      setMappingLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const [sumRes, consRes, stockRes] = await Promise.all([
        api.getPackingReportsSummary({ startDate: reportDateFrom || undefined, endDate: reportDateTo || undefined }),
        api.getPackingConsumptionReport({ startDate: reportDateFrom || undefined, endDate: reportDateTo || undefined }),
        api.getPackingStockReport(),
      ]);
      setReportSummary(sumRes);
      setConsumptionReport(consRes);
      if (Array.isArray(stockRes)) setStockReport(stockRes);
    } catch (err: any) {
      toast.error('Failed to load packing reports: ' + (err.message || 'Error'));
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ORDERS') loadOrders();
    if (activeTab === 'MATERIALS') loadMaterials();
    if (activeTab === 'MAPPING') {
      loadMaterials();
      loadMenuMapping();
    }
    if (activeTab === 'REPORTS') loadReports();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ORDERS') {
      loadOrders();
      setCurrentPage(1);
    }
  }, [orderStatusFilter, orderTypeFilter, orderSearch]);

  useEffect(() => {
    if (activeTab === 'MATERIALS') {
      loadMaterials();
      setCurrentPage(1);
    }
  }, [materialStatusFilter, materialSearch]);

  useEffect(() => {
    if (activeTab === 'MAPPING') {
      loadMenuMapping();
      setCurrentPage(1);
    }
  }, [mappingSearch]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStartPacking = async (orderId: string) => {
    try {
      await api.updateOrderPackingStatus(orderId, { status: 'IN_PROGRESS' });
      toast.success('Packing marked as In Progress');
      loadOrders();
    } catch (err: any) {
      toast.error('Failed to update packing status: ' + (err.message || 'Error'));
    }
  };

  const openCompleteModal = (order: PackingOrder) => {
    setSelectedOrderForComplete(order);
    setCompletePackingStaff(order.serverName || 'Staff');
    setEditableOrderMaterials(JSON.parse(JSON.stringify(order.materials || [])));
  };

  const handleConfirmCompletePacking = async () => {
    if (!selectedOrderForComplete) return;
    try {
      await api.completeOrderPacking(selectedOrderForComplete.orderId, {
        staffName: completePackingStaff,
        modifiedMaterials: editableOrderMaterials,
      });
      toast.success(`Order #${selectedOrderForComplete.orderNumber} packing completed & inventory deducted.`);
      setSelectedOrderForComplete(null);
      loadOrders();
    } catch (err: any) {
      toast.error('Failed to complete packing: ' + (err.message || 'Error'));
    }
  };

  const openCreateMaterialModal = () => {
    setEditingMaterial(null);
    setMaterialForm({
      name: '',
      unit: 'pcs',
      purchaseCost: 0,
      packingCharge: 0,
      availableStock: 0,
      minStockThreshold: 20,
      status: 'ACTIVE',
    });
    setIsMaterialModalOpen(true);
  };

  const openEditMaterialModal = (m: PackingMaterial) => {
    setEditingMaterial(m);
    setMaterialForm({
      name: m.name,
      unit: m.unit,
      purchaseCost: m.purchaseCost,
      packingCharge: m.packingCharge,
      availableStock: m.availableStock,
      minStockThreshold: m.minStockThreshold,
      status: m.status,
    });
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!materialForm.name.trim()) {
      toast.error('Material name is required');
      return;
    }
    try {
      if (editingMaterial) {
        await api.updatePackingMaterial(editingMaterial.id, materialForm);
        toast.success('Packing material updated successfully');
      } else {
        await api.createPackingMaterial(materialForm);
        toast.success('Packing material created successfully');
      }
      setIsMaterialModalOpen(false);
      loadMaterials();
    } catch (err: any) {
      toast.error('Failed to save material: ' + (err.message || 'Error'));
    }
  };

  const handleAdjustStock = async () => {
    if (!stockAdjustMaterial || stockAdjustQty === 0) return;
    try {
      await api.adjustPackingMaterialStock(stockAdjustMaterial.id, {
        quantity: stockAdjustQty,
        notes: stockAdjustNotes || undefined,
      });
      toast.success(`Stock adjusted for ${stockAdjustMaterial.name}`);
      setStockAdjustMaterial(null);
      setStockAdjustQty(0);
      setStockAdjustNotes('');
      loadMaterials();
    } catch (err: any) {
      toast.error('Failed to adjust stock: ' + (err.message || 'Error'));
    }
  };

  const openMappingModal = (item: MenuConfigItem) => {
    setConfiguringMenuProduct(item);
    setSelectedProductMaterials(
      (item.materials || []).map((m) => ({
        materialId: m.materialId,
        materialName: m.materialName,
        quantity: m.quantity,
      }))
    );
  };

  const handleSaveMenuMapping = async () => {
    if (!configuringMenuProduct) return;
    try {
      await api.updateMenuPackingConfig(configuringMenuProduct.productId, {
        materials: selectedProductMaterials.filter((m) => m.quantity > 0),
      });
      toast.success(`Packing configuration updated for ${configuringMenuProduct.productName}`);
      setConfiguringMenuProduct(null);
      loadMenuMapping();
    } catch (err: any) {
      toast.error('Failed to save configuration: ' + (err.message || 'Error'));
    }
  };

  // ---------------------------------------------------------------------------
  // Active Tab Data Slicing for Pagination
  // ---------------------------------------------------------------------------

  const activeDataSet = useMemo(() => {
    if (activeTab === 'ORDERS') return orders;
    if (activeTab === 'MATERIALS') return materials;
    if (activeTab === 'MAPPING') return menuConfigs;
    if (activeTab === 'REPORTS') return consumptionReport?.byMaterial || [];
    return [];
  }, [activeTab, orders, materials, menuConfigs, consumptionReport]);

  const totalPages = Math.max(1, Math.ceil(activeDataSet.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return activeDataSet.slice(start, start + pageSize);
  }, [activeDataSet, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-12 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Action Buttons (No filler description)
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0B3D32] dark:text-emerald-400" />
            <span>Packing Management</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            href="/quick-sale"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Quick Sale</span>
          </Link>

          <button
            type="button"
            onClick={openCreateMaterialModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MAIN TABS (Box-type, no numbers)
          ----------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'ORDERS' as const, label: 'Packing Orders' },
          { id: 'MATERIALS' as const, label: 'Packing Materials' },
          { id: 'MAPPING' as const, label: 'Menu Item Mapping' },
          { id: 'REPORTS' as const, label: 'Reports & Analytics' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap',
                isActive
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
                  : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =======================================================================
          TAB 1: PACKING ORDERS QUEUE
          ======================================================================= */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-3">
          {/* Toolbar: Sub-tabs & Compact Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Order Status Filters */}
              {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as OrderStatusFilter[]).map((st) => {
                const isActive = orderStatusFilter === st;
                const label = st === 'ALL' ? 'All Orders' : st === 'PENDING' ? 'Pending' : st === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none',
                      isActive
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200 font-bold'
                        : 'bg-white dark:bg-surface-card text-slate-600 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Order Type Filter */}
              {(['ALL', 'TAKEAWAY', 'DELIVERY'] as OrderTypeFilter[]).map((ot) => {
                const isActive = orderTypeFilter === ot;
                const label = ot === 'ALL' ? 'All Types' : ot === 'TAKEAWAY' ? 'Takeaway' : 'Delivery';
                return (
                  <button
                    key={ot}
                    type="button"
                    onClick={() => setOrderTypeFilter(ot)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none',
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-800 dark:bg-emerald-600 dark:text-white font-bold'
                        : 'bg-white dark:bg-surface-card text-slate-600 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Side: Compact Search Box */}
            <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, items..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
              />
              {orderSearch && (
                <button
                  type="button"
                  onClick={() => setOrderSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Orders DataTable */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ORDER & TYPE</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ORDERED ITEMS</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">REQUIRED PACKING MATERIALS</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">PACKING CHARGE</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">PACKING STATUS</th>
                    <th className="py-2.5 px-3 text-right w-44">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        Loading packing orders...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No takeaway or delivery orders found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    (paginatedData as PackingOrder[]).map((order, idx) => {
                      const isPending = order.packingStatus === 'PENDING' || !order.packingStatus;
                      const isInProgress = order.packingStatus === 'IN_PROGRESS';
                      const isCompleted = order.packingStatus === 'COMPLETED';

                      return (
                        <tr key={order.orderId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                            {(safeCurrentPage - 1) * pageSize + idx + 1}
                          </td>

                          {/* Order & Type */}
                          <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                                {order.orderNumber}
                              </span>
                              <span
                                className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] uppercase border',
                                  order.orderType === 'DELIVERY'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                )}
                              >
                                {order.orderType}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {order.customerName ? `${order.customerName} • ` : ''}
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Ordered Items */}
                          <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5 max-w-[220px]">
                              {order.items.slice(0, 3).map((item, iIdx) => (
                                <div key={iIdx} className="text-xs text-slate-800 dark:text-slate-200 truncate">
                                  <span className="font-semibold">{item.quantity}x</span> {item.productName}
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-[10px] text-slate-400 italic">+{order.items.length - 3} more items</span>
                              )}
                            </div>
                          </td>

                          {/* Required Packing Materials */}
                          <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                            {order.materials.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">No materials assigned</span>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap max-w-[280px]">
                                {order.materials.map((m, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  >
                                    <span className="font-bold text-[#0B3D32] dark:text-emerald-400">{m.quantity}x</span>
                                    <span>{m.materialName}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Packing Charge */}
                          <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              Rs. {order.packingCharge.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Cost: Rs. {order.totalActualCost.toLocaleString()}
                            </div>
                          </td>

                          {/* Packing Status */}
                          <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase inline-flex items-center gap-1 border',
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : isInProgress
                                  ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              )}
                            >
                              {isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
                              {isInProgress && <Clock className="w-2.5 h-2.5 animate-spin" />}
                              {isPending && <AlertTriangle className="w-2.5 h-2.5" />}
                              <span>{isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}</span>
                            </span>
                            {order.packedBy && (
                              <div className="text-[10px] text-slate-400 mt-0.5">By {order.packedBy}</div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleStartPacking(order.orderId)}
                                  className="px-2 py-1 rounded-[3px] border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                                >
                                  Start
                                </button>
                              )}

                              {!isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => openCompleteModal(order)}
                                  className="px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold text-[11px] cursor-pointer transition-colors shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                >
                                  Complete
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openCompleteModal(order)}
                                  className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: PACKING MATERIALS LIST
          ======================================================================= */}
      {activeTab === 'MATERIALS' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'ACTIVE', 'LOW_STOCK', 'INACTIVE'] as const).map((filter) => {
                const isActive = materialStatusFilter === filter;
                const label = filter === 'ALL' ? 'All Materials' : filter === 'ACTIVE' ? 'Active' : filter === 'LOW_STOCK' ? 'Low Stock' : 'Inactive';
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMaterialStatusFilter(filter)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none',
                      isActive
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200 font-bold'
                        : 'bg-white dark:bg-surface-card text-slate-600 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Search material..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
              />
              {materialSearch && (
                <button
                  type="button"
                  onClick={() => setMaterialSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Materials DataTable */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">MATERIAL NAME</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">UNIT</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">PURCHASE COST</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">PACKING CHARGE</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">AVAILABLE STOCK</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">STATUS</th>
                    <th className="py-2.5 px-3 text-right w-44">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {materialsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        Loading materials...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No packing materials found. Click "+ New Material" to create one.
                      </td>
                    </tr>
                  ) : (
                    (paginatedData as PackingMaterial[]).map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                          {(safeCurrentPage - 1) * pageSize + idx + 1}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{m.name}</span>
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 uppercase font-mono text-slate-600 dark:text-slate-300">
                          {m.unit}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-medium">
                          Rs. {m.purchaseCost.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-[#0B3D32] dark:text-emerald-400">
                          Rs. {m.packingCharge.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right">
                          <span className={cn('font-bold', m.isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white')}>
                            {m.availableStock} {m.unit}
                          </span>
                          {m.isLowStock && (
                            <span className="ml-1.5 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Low (Min {m.minStockThreshold})
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-center">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase border',
                              m.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {m.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setStockAdjustMaterial(m);
                                setStockAdjustQty(0);
                              }}
                              className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-[11px] cursor-pointer shadow-2xs"
                              title="Restock or adjust inventory"
                            >
                              Stock ±
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMaterialModal(m)}
                              className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-[11px] cursor-pointer shadow-2xs"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: MENU ITEM MAPPING
          ======================================================================= */}
      {activeTab === 'MAPPING' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Configure default packaging materials automatically generated for each menu item:
            </span>

            <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                placeholder="Search food item..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
              />
              {mappingSearch && (
                <button
                  type="button"
                  onClick={() => setMappingSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Menu Mapping DataTable */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">MENU ITEM</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">CATEGORY</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">PRICE</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">ASSIGNED PACKING MATERIALS</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">PACKING CHARGE</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">MATERIAL COST</th>
                    <th className="py-2.5 px-3 text-right w-36">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {mappingLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        Loading menu packing configurations...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No menu items found.
                      </td>
                    </tr>
                  ) : (
                    (paginatedData as MenuConfigItem[]).map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                          {(safeCurrentPage - 1) * pageSize + idx + 1}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                          {item.productName}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-slate-500">
                          {item.category}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-medium">
                          Rs. {item.price.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800">
                          {item.materials.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">None configured</span>
                          ) : (
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.materials.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  <span className="font-bold text-[#0B3D32] dark:text-emerald-400">{m.quantity}x</span>
                                  <span>{m.materialName}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-[#0B3D32] dark:text-emerald-400">
                          Rs. {item.estimatedPackingCharge.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right text-slate-500">
                          Rs. {item.estimatedCost.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => openMappingModal(item)}
                            className="px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-[11px] cursor-pointer shadow-2xs"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: REPORTS & ANALYTICS
          ======================================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Consumed</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                {reportSummary?.totalItemsConsumed || 0} <span className="text-xs font-normal text-slate-400">pcs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Packing Charges Billed</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                Rs. {(reportSummary?.totalPackingCharges || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actual Material Cost</span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                Rs. {(reportSummary?.totalMaterialCost || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Packing Margin</span>
              <div className="text-xl font-black text-[#0B3D32] dark:text-emerald-400 mt-1 tabular-nums">
                Rs. {(reportSummary?.netMargin || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
              <div className="text-xl font-black text-amber-600 mt-1 tabular-nums">
                {reportSummary?.lowStockCount || 0} <span className="text-xs font-normal text-slate-400">items</span>
              </div>
            </div>
          </div>

          {/* Consumption by Material Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Packing Material Consumption Breakdown
            </h3>
            <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">MATERIAL</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">TOTAL CONSUMED</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">TOTAL COST</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">CHARGES COLLECTED</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">NET PROFIT</th>
                    <th className="py-2.5 px-3 text-right">ORDERS PACKED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                        Loading consumption report...
                      </td>
                    </tr>
                  ) : (consumptionReport?.byMaterial || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                        No consumption records logged yet. Complete takeaway or delivery orders to see consumption.
                      </td>
                    </tr>
                  ) : (
                    (consumptionReport.byMaterial as any[]).map((row, idx) => (
                      <tr key={row.materialId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                          {row.materialName}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-slate-800 dark:text-slate-200">
                          {row.totalQuantity} {row.unit}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right text-rose-600 font-medium">
                          Rs. {row.totalCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right text-emerald-600 font-bold">
                          Rs. {row.totalPackingCharge.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-[#0B3D32] dark:text-emerald-400">
                          Rs. {row.netMargin.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {row.ordersCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          DATATABLES PAGINATION FOOTER
          Left: Show [10 v] entries per page | Showing X to Y of Z entries
          Right: [< Previous] [1] [2] [Next >]
          ----------------------------------------------------------------------- */}
      {activeTab !== 'REPORTS' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 font-medium text-[11px]">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-[28px] px-2 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 font-medium text-[11px]">entries per page</span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>

            <div>
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {activeDataSet.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(safeCurrentPage * pageSize, activeDataSet.length)}
              </strong>{' '}
              of <strong className="text-slate-800 dark:text-slate-200">{activeDataSet.length}</strong> entries
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                ) {
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                        isCurrent
                          ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                          : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400 select-none font-bold">
                      …
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          MODAL 1: COMPLETE PACKING & ADJUST MATERIALS
          ======================================================================= */}
      {selectedOrderForComplete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Order #{selectedOrderForComplete.orderNumber} Packaging Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForComplete(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Order Info Summary */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Order Type</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedOrderForComplete.orderType}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Customer</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedOrderForComplete.customerName || 'Walk-in Guest'}
                  </div>
                </div>
              </div>

              {/* Materials Consumed Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Packaging Materials Required</span>
                  <span className="text-[11px] text-slate-500">Staff can adjust quantities before marking complete:</span>
                </div>

                <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {editableOrderMaterials.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic">No materials assigned to this order.</div>
                  ) : (
                    editableOrderMaterials.map((m, mIdx) => (
                      <div key={m.materialId} className="p-2.5 flex items-center justify-between gap-3 bg-white dark:bg-surface-card">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs">{m.materialName}</div>
                          <div className="text-[10px] text-slate-400">Charge: Rs. {m.packingCharge} • Cost: Rs. {m.unitCost}</div>
                        </div>

                        {selectedOrderForComplete.packingStatus !== 'COMPLETED' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...editableOrderMaterials];
                                next[mIdx].quantity = Math.max(1, next[mIdx].quantity - 1);
                                setEditableOrderMaterials(next);
                              }}
                              className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-xs">{m.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...editableOrderMaterials];
                                next[mIdx].quantity += 1;
                                setEditableOrderMaterials(next);
                              }}
                              className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-xs font-mono">{m.quantity} {m.unit}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedOrderForComplete.packingStatus !== 'COMPLETED' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Packer / Staff Name
                  </label>
                  <input
                    type="text"
                    value={completePackingStaff}
                    onChange={(e) => setCompletePackingStaff(e.target.value)}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setSelectedOrderForComplete(null)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>

              {selectedOrderForComplete.packingStatus !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleConfirmCompletePacking}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Confirm Packing Completed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: CREATE / EDIT PACKING MATERIAL
          ======================================================================= */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingMaterial ? 'Edit Packing Material' : 'New Packing Material'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food Box, Sauce Container, Paper Bag..."
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2 text-xs text-slate-800 dark:text-white bg-white dark:bg-surface-card focus:outline-none focus:border-[#0B3D32]"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box</option>
                    <option value="bag">Bag</option>
                    <option value="roll">Roll</option>
                    <option value="set">Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={materialForm.status}
                    onChange={(e) => setMaterialForm({ ...materialForm, status: e.target.value })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2 text-xs text-slate-800 dark:text-white bg-white dark:bg-surface-card focus:outline-none focus:border-[#0B3D32]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Cost (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={materialForm.purchaseCost}
                    onChange={(e) => setMaterialForm({ ...materialForm, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling / Packing Charge (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={materialForm.packingCharge}
                    onChange={(e) => setMaterialForm({ ...materialForm, packingCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={materialForm.availableStock}
                    onChange={(e) => setMaterialForm({ ...materialForm, availableStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min / Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={materialForm.minStockThreshold}
                    onChange={(e) => setMaterialForm({ ...materialForm, minStockThreshold: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMaterial}
                className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
              >
                Save Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3: STOCK ADJUSTMENT
          ======================================================================= */}
      {stockAdjustMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-2xl max-w-sm w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Stock: {stockAdjustMaterial.name}</h3>
              <button
                type="button"
                onClick={() => setStockAdjustMaterial(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {stockAdjustMaterial.availableStock} {stockAdjustMaterial.unit}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Adjustment (positive to add, negative to deduct)
                </label>
                <input
                  type="number"
                  placeholder="+50 or -10"
                  value={stockAdjustQty || ''}
                  onChange={(e) => setStockAdjustQty(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery, damage, count discrepancy..."
                  value={stockAdjustNotes}
                  onChange={(e) => setStockAdjustNotes(e.target.value)}
                  className="w-full h-[30px] rounded-[3px] border border-slate-300 dark:border-border-default px-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setStockAdjustMaterial(null)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={stockAdjustQty === 0}
                onClick={handleAdjustStock}
                className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: CONFIGURE MENU ITEM PACKING MATERIALS
          ======================================================================= */}
      {configuringMenuProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[3px] shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Configure Packing for: {configuringMenuProduct.productName}
              </h3>
              <button
                type="button"
                onClick={() => setConfiguringMenuProduct(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-500 text-[11px]">
                Select which packing materials are required when 1 portion of this item is ordered for takeaway or delivery:
              </p>

              <div className="space-y-2">
                {materials.filter((m) => m.status === 'ACTIVE').map((mat) => {
                  const existing = selectedProductMaterials.find((x) => x.materialId === mat.id);
                  const isSelected = !!existing;
                  const qty = existing?.quantity || 0;

                  return (
                    <div
                      key={mat.id}
                      className={cn(
                        'p-3 rounded-[3px] border flex items-center justify-between gap-3 transition-colors',
                        isSelected
                          ? 'border-[#0B3D32] bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-card'
                      )}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{mat.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Unit: {mat.unit} • Charge: Rs. {mat.packingCharge} • Cost: Rs. {mat.purchaseCost}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (qty <= 1) {
                                  setSelectedProductMaterials(selectedProductMaterials.filter((x) => x.materialId !== mat.id));
                                } else {
                                  setSelectedProductMaterials(
                                    selectedProductMaterials.map((x) => (x.materialId === mat.id ? { ...x, quantity: x.quantity - 1 } : x))
                                  );
                                }
                              }}
                              className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductMaterials(
                                  selectedProductMaterials.map((x) => (x.materialId === mat.id ? { ...x, quantity: x.quantity + 1 } : x))
                                );
                              }}
                              className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductMaterials(selectedProductMaterials.filter((x) => x.materialId !== mat.id));
                              }}
                              className="ml-1 text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductMaterials([
                                ...selectedProductMaterials,
                                { materialId: mat.id, materialName: mat.name, quantity: 1 },
                              ]);
                            }}
                            className="px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-[11px]"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setConfiguringMenuProduct(null)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMenuMapping}
                className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


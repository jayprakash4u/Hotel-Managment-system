'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Plus,
  Download,
  Calendar,
  X,
  Eye,
  MoreVertical,
  Printer,
  FileText,
  Ban,
  ChefHat,
  Wine,
  Table2,
  BedDouble,
  Bike,
  ShoppingBag,
  Armchair,
  Clock,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { ActiveRestaurantOrderData, BillData } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { getOrderDepartmentInfo } from '@/components/common/ActiveOrdersView';
import {
  OrderDetailsModal,
  formatDateDisplay,
  formatTimeDisplay,
  formatOrderType,
  getPaymentStatusMeta,
} from '@/components/orders/OrderDetailsModal';
import { CancelOrderModal } from '@/components/orders/CancelOrderModal';
import { RestaurantReceiptModal, ReceiptModalProps } from '@/components/common/RestaurantReceiptModal';
import { ViewBillModal } from '@/components/billing/ViewBillModal';

const formatNpr = (val: number) => {
  return `Rs. ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type DatePreset = 'TODAY' | 'YESTERDAY' | 'ALL_TIME' | 'CUSTOM';

export const OrdersManagementView: React.FC = () => {
  const toast = useToast();
  const { user } = useRole();

  // Core Data State
  const [orders, setOrders] = useState<ActiveRestaurantOrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Status Filter: Box-Type Buttons (as we have earlier)
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Dates: default to Today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Table filters & controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'KOT' | 'BOT' | 'BOTH'>('ALL');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<'orderNumber' | 'date' | 'total' | 'status'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Modals & Drawers State
  const [viewingOrder, setViewingOrder] = useState<ActiveRestaurantOrderData | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<ActiveRestaurantOrderData | null>(null);
  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);

  // Receipt Modal State
  const [receiptModal, setReceiptModal] = useState<ReceiptModalProps>({
    isOpen: false,
    onClose: () => setReceiptModal((prev) => ({ ...prev, isOpen: false })),
    orderNumber: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // Invoice Modal State
  const [viewingBill, setViewingBill] = useState<BillData | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState<boolean>(false);

  // Fetch Orders from DB
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const params: any = {
        outlet: 'RESTAURANT',
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await api.getRestaurantOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load restaurant orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Click outside to close action dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.order-action-dropdown')) {
        setActiveDropdownOrderId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter (Box-Type)
      if (selectedStatusTab !== 'ALL') {
        if (selectedStatusTab === 'PENDING') {
          if (o.status !== 'RECEIVED' && (o.status as string) !== 'PENDING') return false;
        } else if (selectedStatusTab === 'COMPLETED') {
          if (o.status !== 'COMPLETED' && o.status !== 'BILLED') return false;
        } else {
          if (o.status !== selectedStatusTab) return false;
        }
      }

      // 2. Source / Order Type Filter
      if (sourceFilter !== 'ALL') {
        if (sourceFilter === 'DINE_IN' && !o.table?.tableNumber && o.orderType !== 'DINE_IN') return false;
        if (sourceFilter === 'ROOM_SERVICE' && !o.room?.number && o.orderType !== 'ROOM_SERVICE') return false;
        if (sourceFilter === 'TAKEAWAY' && o.orderType !== 'TAKEAWAY') return false;
        if (sourceFilter === 'DELIVERY' && o.orderType !== 'DELIVERY') return false;
        if (sourceFilter === 'COUNTER_SALE' && !['COUNTER_SALE', 'DIRECT', 'NO_TABLE', 'QUICK_BILL'].includes(o.orderType as string)) return false;
      }

      // 3. Department Filter (Kitchen / Bar / Both)
      if (departmentFilter !== 'ALL') {
        const dept = getOrderDepartmentInfo(o);
        if (departmentFilter === 'KOT' && !dept.hasKot) return false;
        if (departmentFilter === 'BOT' && !dept.hasBot) return false;
        if (departmentFilter === 'BOTH' && !dept.isBoth) return false;
      }

      // 4. Payment Status Filter
      if (paymentStatusFilter !== 'ALL') {
        const payMeta = getPaymentStatusMeta(o);
        if (paymentStatusFilter === 'ROOM_FOLIO') {
          if (payMeta.key !== 'ROOM_FOLIO') return false;
        } else if (paymentStatusFilter === 'PAID') {
          if (payMeta.key !== 'PAID') return false;
        } else if (paymentStatusFilter === 'UNPAID') {
          if (payMeta.key !== 'UNPAID') return false;
        } else if (paymentStatusFilter === 'PARTIAL') {
          if (payMeta.key !== 'PARTIAL') return false;
        } else if (paymentStatusFilter === 'REFUNDED') {
          if (payMeta.key !== 'REFUNDED') return false;
        }
      }

      // 5. Universal Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchOrderNo = o.orderNumber?.toLowerCase().includes(q);
        const matchKot = o.kotNumber?.toLowerCase().includes(q);
        const matchBot = o.botNumber?.toLowerCase().includes(q);
        const matchCust = o.customerName?.toLowerCase().includes(q);
        const matchPhone = o.customerPhone?.toLowerCase().includes(q);
        const matchTable = o.table?.tableNumber?.toLowerCase().includes(q);
        const matchRoom = o.room?.number?.toLowerCase().includes(q);
        const matchGuest = o.guest?.firstName?.toLowerCase().includes(q) || o.guest?.lastName?.toLowerCase().includes(q);
        const matchItems = o.items?.some((it) => it.productName.toLowerCase().includes(q));

        if (!matchOrderNo && !matchKot && !matchBot && !matchCust && !matchPhone && !matchTable && !matchRoom && !matchGuest && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedStatusTab, sourceFilter, departmentFilter, paymentStatusFilter, searchQuery]);

  // Sorted Orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'orderNumber') {
        comparison = a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'total') {
        comparison = (a.total || 0) - (b.total || 0);
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredOrders, sortField, sortAsc]);

  // Pagination Slice
  const totalEntries = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = useMemo(() => {
    return sortedOrders.slice(startIndex, startIndex + pageSize);
  }, [sortedOrders, startIndex, pageSize]);

  // Sorting Handler
  const handleSort = (field: 'orderNumber' | 'date' | 'total' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatusTab('ALL');
    setSourceFilter('ALL');
    setDepartmentFilter('ALL');
    setPaymentStatusFilter('ALL');
    setStartDate(todayStr);
    setEndDate(todayStr);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportOrders = () => {
    if (sortedOrders.length === 0) {
      toast.warning('No orders available to export.');
      return;
    }

    try {
      const headers = [
        'SN',
        'Order Number',
        'Date & Time',
        'Order Type',
        'Source',
        'Customer Name',
        'Phone Number',
        'Items Count',
        'Order Amount (NPR)',
        'Payment Status',
        'Order Status',
        'Staff',
      ];

      const csvRows = sortedOrders.map((o, idx) => [
        idx + 1,
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString()}"`,
        `"${o.orderType}"`,
        `"${o.table?.tableNumber ? `Table ${o.table.tableNumber}` : o.room?.number ? `Room ${o.room.number}` : o.orderType}"`,
        `"${o.customerName || o.guest?.firstName ? `${o.customerName || `${o.guest?.firstName} ${o.guest?.lastName || ''}`}` : 'Walk-in Customer'}"`,
        `"${o.customerPhone || o.guest?.phone || ''}"`,
        o.items?.length || 0,
        o.total || 0,
        `"${o.billPaymentStatus || (o.isPaid ? 'PAID' : 'UNPAID')}"`,
        `"${o.status}"`,
        `"${o.serverName || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Orders_Export_${startDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${sortedOrders.length} orders to CSV.`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Failed to export orders to CSV.');
    }
  };

  // Print Receipt Handler
  const handlePrintReceipt = (order: ActiveRestaurantOrderData) => {
    const dept = getOrderDepartmentInfo(order);
    setReceiptModal({
      isOpen: true,
      onClose: () => setReceiptModal((prev) => ({ ...prev, isOpen: false })),
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.table?.tableNumber || null,
      seatingNote: order.table?.section || null,
      createdAt: order.createdAt,
      serverName: order.serverName,
      customerName: order.customerName || undefined,
      customerPhone: order.customerPhone || undefined,
      items: (order.items || []).map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        notes: it.notes,
      })),
      subtotal: order.subtotal || 0,
      discountAmount: order.discountAmount,
      discountPercent: order.discountPercent,
      tax: order.tax || 0,
      serviceCharge: order.serviceCharge,
      packingCharge: order.packingCharge,
      total: order.total || 0,
      paidAmount: order.isPaid ? order.total : (order.bill?.amountPaid || 0),
      paymentMethod: order.paymentMethod || order.bill?.paymentMethod || (order.isPaid ? 'CASH' : undefined),
      paymentStatus: order.billPaymentStatus || (order.isPaid ? 'PAID' : 'UNPAID'),
      ticketType: 'BILL',
      kotNumber: dept.kotNumber,
      botNumber: dept.botNumber,
    });
  };

  // Print KOT Ticket Handler
  const handlePrintKot = (order: ActiveRestaurantOrderData) => {
    const dept = getOrderDepartmentInfo(order);
    const kotItems = (order.items || []).filter((it) => it.department !== 'BOT');
    setReceiptModal({
      isOpen: true,
      onClose: () => setReceiptModal((prev) => ({ ...prev, isOpen: false })),
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.table?.tableNumber || null,
      seatingNote: order.table?.section || null,
      createdAt: order.createdAt,
      serverName: order.serverName,
      items: kotItems.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        notes: it.notes,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      ticketType: 'KOT',
      kotNumber: dept.kotNumber || order.kotNumber,
    });
  };

  // Print BOT Ticket Handler
  const handlePrintBot = (order: ActiveRestaurantOrderData) => {
    const dept = getOrderDepartmentInfo(order);
    const botItems = (order.items || []).filter((it) => it.department === 'BOT');
    setReceiptModal({
      isOpen: true,
      onClose: () => setReceiptModal((prev) => ({ ...prev, isOpen: false })),
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.table?.tableNumber || null,
      seatingNote: order.table?.section || null,
      createdAt: order.createdAt,
      serverName: order.serverName,
      items: botItems.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        notes: it.notes,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      ticketType: 'BOT',
      botNumber: dept.botNumber || order.botNumber,
    });
  };

  // View Bill / Invoice Handler
  const handleViewInvoice = async (bill: BillData | null, order: ActiveRestaurantOrderData) => {
    if (bill) {
      setViewingBill(bill);
      setIsBillModalOpen(true);
      return;
    }

    try {
      const billsRes = await api.getBills({ search: order.orderNumber });
      if (billsRes && billsRes.items && billsRes.items.length > 0) {
        setViewingBill(billsRes.items[0]);
        setIsBillModalOpen(true);
      } else {
        toast.info(`No tax invoice record found for order #${order.orderNumber}. Generate a bill first.`);
      }
    } catch (err) {
      console.error('Failed to lookup invoice:', err);
      toast.error('Could not retrieve invoice for this order.');
    }
  };

  return (
    <div className="w-full space-y-3 select-none font-sans">
      {/* 1. TOP HEADER (Standard pattern matching all other pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Orders
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Refresh orders list"
          >
            <RefreshCw className={cn('w-3 h-3 text-slate-500', refreshing && 'animate-spin')} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. BOX-TYPE STATUS FILTER BUTTONS (As we have earlier) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'PREPARING', label: 'Preparing' },
          { id: 'READY', label: 'Ready' },
          { id: 'SERVED', label: 'Served' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => {
          const isActive = selectedStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStatusTab(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap shadow-2xs',
                isActive
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] font-bold dark:bg-emerald-700 dark:border-emerald-700 shadow-xs'
                  : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TOOLBAR CONTROLS (DataTables exact layout: Show entries | Today | Yestdy | Date range | Clear | Search) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pt-1">
        {/* Left Side: Show entries + Date Controls + Source / Payment Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Show entries */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Quick Date Presets */}
          <button
            onClick={() => {
              setStartDate(todayStr);
              setEndDate(todayStr);
              setCurrentPage(1);
            }}
            className={cn(
              'h-7 px-2.5 text-xs font-medium rounded border transition cursor-pointer',
              startDate === todayStr && endDate === todayStr
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            )}
          >
            Today
          </button>

          <button
            onClick={() => {
              setStartDate(yesterdayStr);
              setEndDate(yesterdayStr);
              setCurrentPage(1);
            }}
            className={cn(
              'h-7 px-2.5 text-xs font-medium rounded border transition cursor-pointer',
              startDate === yesterdayStr && endDate === yesterdayStr
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            )}
          >
            Yestdy
          </button>

          {/* Date range pickers */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-7 px-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-7 px-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
          >
            Clear
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          {/* Source / Type Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            <option value="DINE_IN">Dine-in</option>
            <option value="COUNTER_SALE">Counter Sale</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
            <option value="ROOM_SERVICE">Room Service</option>
          </select>

          {/* Department Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="KOT">Kitchen (KOT)</option>
            <option value="BOT">Bar (BOT)</option>
            <option value="BOTH">Kitchen &amp; Bar</option>
          </select>

          {/* Payment Status Dropdown */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="ROOM_FOLIO">Charged to Room</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Right Side: Search Input with no placeholder */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Search:</span>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
              className="h-7 w-48 sm:w-56 px-2 pr-6 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN ORDERS TABLE (DataTables Grid Layout) */}
      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
            <tr>
              {/* 1. SN */}
              <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">
                SN
              </th>

              {/* 2. Order No. */}
              <th
                onClick={() => handleSort('orderNumber')}
                className="py-2.5 px-3.5 w-36 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Order No.</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                </div>
              </th>

              {/* 3. Date & Time */}
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 w-36 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Date &amp; Time</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                </div>
              </th>

              {/* 4. Order Type */}
              <th className="py-2.5 px-3 w-28 border-r border-slate-200 dark:border-slate-700">
                Order Type
              </th>

              {/* 5. Source / Table / Room */}
              <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700">
                Source
              </th>

              {/* 6. Items */}
              <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200 dark:border-slate-700">
                Items
              </th>

              {/* 8. Order Amount */}
              <th
                onClick={() => handleSort('total')}
                className="py-2.5 px-3.5 w-28 text-right border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>Order Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                </div>
              </th>

              {/* 9. Payment Status */}
              <th className="py-2.5 px-3 w-28 text-center border-r border-slate-200 dark:border-slate-700">
                Payment Status
              </th>

              {/* 10. Order Status */}
              <th
                onClick={() => handleSort('status')}
                className="py-2.5 px-3 w-28 text-center border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  <span>Order Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70" />
                </div>
              </th>

              {/* 11. Action */}
              <th className="py-2.5 px-3 w-32 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                    <span>Loading orders from database...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button
                      onClick={() => fetchOrders()}
                      className="px-3 py-1 rounded border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-50"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                  No orders found matching the selected filters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((ord, idx) => {
                const sn = startIndex + idx + 1;
                const dept = getOrderDepartmentInfo(ord);

                const getStatusPill = (st: string) => {
                  switch (st?.toUpperCase()) {
                    case 'RECEIVED':
                    case 'PENDING':
                      return { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' };
                    case 'PREPARING':
                      return { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', label: 'Preparing' };
                    case 'READY':
                      return { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', label: 'Ready' };
                    case 'SERVED':
                      return { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', label: 'Served' };
                    case 'BILLED':
                    case 'COMPLETED':
                      return { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'Completed' };
                    case 'CANCELLED':
                      return { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Cancelled' };
                    default:
                      return { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', label: st || 'Unknown' };
                  }
                };

                const orderPill = getStatusPill(ord.status);
                const payPill = getPaymentStatusMeta(ord);

                const renderSource = () => {
                  if (ord.table?.tableNumber) {
                    return (
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Table2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Table {ord.table.tableNumber}</span>
                      </div>
                    );
                  }
                  if (ord.room?.number) {
                    return (
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <BedDouble className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Room {ord.room.number}</span>
                      </div>
                    );
                  }
                  if (ord.orderType === 'DELIVERY') {
                    return (
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Bike className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Delivery</span>
                      </div>
                    );
                  }
                  if (ord.orderType === 'TAKEAWAY') {
                    return (
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Takeaway</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <Armchair className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Counter Sale</span>
                    </div>
                  );
                };

                const customerName =
                  ord.customerName ||
                  (ord.guest?.firstName ? `${ord.guest.firstName} ${ord.guest.lastName || ''}`.trim() : null) ||
                  'Walk-in Customer';

                return (
                  <tr
                    key={ord.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                  >
                    {/* 1. SN */}
                    <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {sn}
                    </td>

                    {/* 2. Order No. */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">
                      <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        #{ord.orderNumber}
                      </div>
                    </td>

                    {/* 3. Date & Time */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <div className="font-medium text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatDateDisplay(ord.createdAt)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatTimeDisplay(ord.createdAt)}
                      </div>
                    </td>

                    {/* 4. Order Type */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatOrderType(ord.orderType)}
                    </td>

                    {/* 5. Source / Table / Room */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs">
                      {renderSource()}
                    </td>

                    {/* 6. Items */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {(() => {
                        const count = ord.items?.length || 0;
                        return (
                          <div className="inline-flex flex-col items-center">
                            <span>{count} {count === 1 ? 'Item' : 'Items'}</span>
                            {count === 0 && (ord.status === 'COMPLETED' || ord.status === 'BILLED') && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-sans font-normal">
                                (Empty Order)
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 7. Order Amount */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {formatNpr(ord.total || 0)}
                    </td>

                    {/* 9. Payment Status (Clean colored dot + plain text) */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', payPill.dot)} />
                        <span className={payPill.text}>{payPill.label}</span>
                      </span>
                    </td>

                    {/* 10. Order Status (Clean colored dot + plain text) */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', orderPill.dot)} />
                        <span className={orderPill.text}>{orderPill.label}</span>
                      </span>
                    </td>

                    {/* 11. Action (View + More) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 relative order-action-dropdown">
                        <button
                          onClick={() => setViewingOrder(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownOrderId(activeDropdownOrderId === ord.id ? null : ord.id);
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Action Dropdown Menu */}
                        {activeDropdownOrderId === ord.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 text-left text-xs">
                            <button
                              onClick={() => {
                                setActiveDropdownOrderId(null);
                                handlePrintReceipt(ord);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-400" />
                              <span>Print Receipt</span>
                            </button>

                            {dept.hasKot && (
                              <button
                                onClick={() => {
                                  setActiveDropdownOrderId(null);
                                  handlePrintKot(ord);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                              >
                                <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                                <span>Print KOT Ticket</span>
                              </button>
                            )}

                            {dept.hasBot && (
                              <button
                                onClick={() => {
                                  setActiveDropdownOrderId(null);
                                  handlePrintBot(ord);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                              >
                                <Wine className="w-3.5 h-3.5 text-violet-500" />
                                <span>Print BOT Ticket</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setActiveDropdownOrderId(null);
                                handleViewInvoice(ord.bill || null, ord);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                              <span>View Invoice</span>
                            </button>

                            {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                              <button
                                onClick={() => {
                                  setActiveDropdownOrderId(null);
                                  setCancellingOrder(ord);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Cancel Order</span>
                              </button>
                            )}
                          </div>
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

      {/* 5. PAGINATION FOOTER */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
        <div>
          Showing <span className="font-semibold">{totalEntries === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="font-semibold">{Math.min(startIndex + pageSize, totalEntries)}</span> of{' '}
          <span className="font-semibold">{totalEntries}</span> entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  'w-6 h-6 rounded text-xs font-semibold transition cursor-pointer',
                  currentPage === pageNum
                    ? 'bg-[#0B3D32] text-white'
                    : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* View Order Details Drawer / Modal */}
      <OrderDetailsModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onPrintReceipt={handlePrintReceipt}
        onPrintKot={handlePrintKot}
        onPrintBot={handlePrintBot}
        onViewInvoice={handleViewInvoice}
        onCancelOrder={(ord) => {
          setViewingOrder(null);
          setCancellingOrder(ord);
        }}
      />

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={!!cancellingOrder}
        order={cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onOrderCancelled={() => fetchOrders(true)}
        currentUser={user}
      />

      {/* Receipt Modal (Print / Thermal View) */}
      <RestaurantReceiptModal {...receiptModal} />

      {/* Bill / Invoice Modal */}
      <ViewBillModal
        isOpen={isBillModalOpen}
        bill={viewingBill}
        onClose={() => {
          setIsBillModalOpen(false);
          setViewingBill(null);
        }}
      />
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Download,
  Eye,
  CreditCard,
  RotateCcw,
  Ban,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  Receipt,
  Building2,
  DollarSign,
  User,
  ShoppingBag,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Calendar,
  Percent,
  Check,
  Truck,
  Package,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  PurchaseTransactionListItem,
  PurchaseTransactionsSummary,
  PurchaseItem,
  PurchasePaymentRecord,
  PurchaseReturnRecord,
  SupplierRecord,
  InventoryItemData
} from '@/lib/types';

export default function PurchaseTransactionsTab() {
  // Filters state
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [purchaseType, setPurchaseType] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [receivingStatus, setReceivingStatus] = useState('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PurchaseTransactionListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<PurchaseTransactionsSummary>({
    totalPurchases: 0,
    totalPurchaseInvoices: 0,
    paidPurchases: 0,
    unpaidPurchases: 0,
    partiallyPaidPurchases: 0,
    purchaseReturns: 0,
    outstandingPayables: 0,
  });

  // Reference lists
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemData[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);

  // Modals state
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create Purchase Modal
  const [newPurchaseModalOpen, setNewPurchaseModalOpen] = useState(false);
  const [newPurchaseNumber, setNewPurchaseNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBranch, setSelectedBranch] = useState('Main Kitchen');
  const [selectedWarehouse, setSelectedWarehouse] = useState('Central Store');
  const [formPurchaseType, setFormPurchaseType] = useState('INVENTORY');
  const [formReceivingStatus, setFormReceivingStatus] = useState('RECEIVED');
  const [formPurchaseOrderRef, setFormPurchaseOrderRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDiscountAmount, setFormDiscountAmount] = useState<number>(0);
  const [formFreightCharges, setFormFreightCharges] = useState<number>(0);
  const [formRoundOff, setFormRoundOff] = useState<number>(0);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(0);
  const [formPaymentMode, setFormPaymentMode] = useState('CASH');
  const [formPaymentRef, setFormPaymentRef] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Dynamic Item Rows in Create Purchase
  interface PurchaseLineItem {
    id: string;
    inventoryItemId?: string | null;
    itemCode?: string | null;
    description: string;
    category: string;
    quantity: number;
    unit: string;
    unitCost: number;
    discountAmount: number;
    taxPercent: number;
    warehouse: string;
    lineTotal: number;
  }

  const [formItems, setFormItems] = useState<PurchaseLineItem[]>([
    {
      id: 'item-1',
      inventoryItemId: null,
      itemCode: '',
      description: '',
      category: 'Food Supplies',
      quantity: 1,
      unit: 'KG',
      unitCost: 0,
      discountAmount: 0,
      taxPercent: 0,
      warehouse: 'Central Store',
      lineTotal: 0,
    },
  ]);

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PurchaseTransactionListItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState('CASH');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Return / Debit Note Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<any | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<
    { description: string; inventoryItemId?: string | null; unit: string; maxQty: number; returnQty: number; unitCost: number; reason: string }[]
  >([]);
  const [returnReasonGlobal, setReturnReasonGlobal] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Receive Goods (GRN) Modal
  const [grnModalOpen, setGrnModalOpen] = useState(false);
  const [grnTarget, setGrnTarget] = useState<PurchaseTransactionListItem | null>(null);
  const [grnNumber, setGrnNumber] = useState('');
  const [grnWarehouse, setGrnWarehouse] = useState('Central Store');
  const [grnReceivedBy, setGrnReceivedBy] = useState('Store Manager');
  const [grnNotes, setGrnNotes] = useState('');
  const [grnSubmitting, setGrnSubmitting] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<PurchaseTransactionListItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<any | null>(null);

  // Apply Date Preset helper
  const handleDatePresetChange = (preset: 'ALL' | 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
    setPage(1);
  };

  // Initial date preset
  useEffect(() => {
    handleDatePresetChange('THIS_MONTH');
  }, []);

  // Fetch reference suppliers and inventory items
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [sups, inv] = await Promise.all([
          api.getSuppliers({ activeOnly: true }),
          api.getInventory()
        ]);
        setSuppliers(sups || []);
        setInventoryItems(inv || []);
      } catch (err) {
        console.error('Failed to load supplier/inventory lookup:', err);
      }
    };
    fetchLookups();
  }, []);

  // Fetch purchase transactions
  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPurchaseTransactions({
        page,
        pageSize,
        search: search.trim() || undefined,
        supplierId: supplierFilter !== 'ALL' ? supplierFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branch: branchFilter !== 'ALL' ? branchFilter : undefined,
        purchaseType: purchaseType !== 'ALL' ? purchaseType : undefined,
        paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
        receivingStatus: receivingStatus !== 'ALL' ? receivingStatus : undefined,
      });

      setItems(res.items || []);
      setTotalItems(res.totalCount || 0);
      setTotalPages(Math.max(1, Math.ceil((res.totalCount || 0) / pageSize)));
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch purchase transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, pageSize, supplierFilter, branchFilter, purchaseType, paymentStatus, receivingStatus, startDate, endDate]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSupplierFilter('ALL');
    setBranchFilter('ALL');
    setPurchaseType('ALL');
    setPaymentStatus('ALL');
    setReceivingStatus('ALL');
    handleDatePresetChange('THIS_MONTH');
  };

  // Open Details Modal
  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const data = await api.getPurchaseTransactionById(id);
      setSelectedTx(data);
    } catch (err: any) {
      alert('Failed to load transaction details: ' + (err?.message || ''));
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open New Purchase Modal
  const handleOpenNewPurchase = async () => {
    try {
      const nextNumRes = await api.getNextPurchaseNumber();
      setNewPurchaseNumber(nextNumRes?.purchaseNumber || `PUR-${new Date().getFullYear()}-0001`);
      
      const pos = await api.getPendingPurchaseOrders();
      setPendingPOs(pos || []);
    } catch (e) {
      console.error(e);
      setNewPurchaseNumber(`PUR-${new Date().getFullYear()}-0001`);
    }

    // Reset create form
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate(new Date().toISOString().slice(0, 10));
    setSelectedBranch('Main Kitchen');
    setSelectedWarehouse('Central Store');
    setFormPurchaseType('INVENTORY');
    setFormReceivingStatus('RECEIVED');
    setFormPurchaseOrderRef('');
    setFormNotes('');
    setFormDiscountAmount(0);
    setFormFreightCharges(0);
    setFormRoundOff(0);
    setFormPaidAmount(0);
    setFormPaymentMode('CASH');
    setFormPaymentRef('');

    setFormItems([
      {
        id: 'item-1',
        inventoryItemId: null,
        itemCode: '',
        description: '',
        category: 'Food Supplies',
        quantity: 1,
        unit: 'KG',
        unitCost: 0,
        discountAmount: 0,
        taxPercent: 0,
        warehouse: 'Central Store',
        lineTotal: 0,
      },
    ]);

    setNewPurchaseModalOpen(true);
  };

  // Selected supplier details
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Handle PO conversion
  const handleSelectPOToConvert = (poId: string) => {
    if (!poId) return;
    const po = pendingPOs.find((p) => p.id === poId);
    if (!po) return;

    if (po.supplierId) {
      setSelectedSupplierId(po.supplierId);
    }
    setFormPurchaseOrderRef(po.orderNumber);
    if (po.warehouse) setSelectedWarehouse(po.warehouse);
    if (po.branchOrOutlet) setSelectedBranch(po.branchOrOutlet);

    if (po.items && Array.isArray(po.items) && po.items.length > 0) {
      const newItems: PurchaseLineItem[] = po.items.map((it: any, idx: number) => {
        const qty = it.quantity || 1;
        const cost = it.unitCost || 0;
        const discount = it.discountAmount || 0;
        const taxRate = it.taxPercent || 0;
        const netBase = Math.max(0, qty * cost - discount);
        const taxAmount = netBase * (taxRate / 100);
        return {
          id: `item-${idx + 1}`,
          inventoryItemId: it.inventoryItemId || null,
          itemCode: it.itemCode || '',
          description: it.description || it.itemName || 'Item',
          category: it.category || 'Supplies',
          quantity: qty,
          unit: it.unit || 'PCS',
          unitCost: cost,
          discountAmount: discount,
          taxPercent: taxRate,
          warehouse: po.warehouse || 'Central Store',
          lineTotal: netBase + taxAmount,
        };
      });
      setFormItems(newItems);
    }
  };

  // Calculation helpers for Create Purchase Form
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    let itemsDiscount = 0;
    let taxTotal = 0;

    formItems.forEach((it) => {
      const gross = it.quantity * it.unitCost;
      const disc = it.discountAmount || 0;
      const netBase = Math.max(0, gross - disc);
      const tax = netBase * ((it.taxPercent || 0) / 100);
      subtotal += gross;
      itemsDiscount += disc;
      taxTotal += tax;
    });

    const totalDiscount = itemsDiscount + (formDiscountAmount || 0);
    const taxableBase = Math.max(0, subtotal - totalDiscount);
    const freight = formFreightCharges || 0;
    const round = formRoundOff || 0;
    const grandTotal = Math.max(0, taxableBase + taxTotal + freight + round);
    const paid = Math.min(grandTotal, Math.max(0, formPaidAmount || 0));
    const due = Math.max(0, grandTotal - paid);

    return {
      subtotal,
      totalDiscount,
      taxTotal,
      freight,
      round,
      grandTotal,
      paid,
      due,
    };
  }, [formItems, formDiscountAmount, formFreightCharges, formRoundOff, formPaidAmount]);

  // Add Item Row
  const handleAddItemRow = () => {
    setFormItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        inventoryItemId: null,
        itemCode: '',
        description: '',
        category: 'Supplies',
        quantity: 1,
        unit: 'KG',
        unitCost: 0,
        discountAmount: 0,
        taxPercent: 0,
        warehouse: selectedWarehouse,
        lineTotal: 0,
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (id: string) => {
    if (formItems.length === 1) return;
    setFormItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item Row Field
  const handleUpdateItemRow = (id: string, field: keyof PurchaseLineItem, val: any) => {
    setFormItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };

        // When inventory item is picked from lookup
        if (field === 'inventoryItemId') {
          const inv = inventoryItems.find((x) => x.id === val);
          if (inv) {
            updated.description = inv.name;
            updated.itemCode = inv.sku || '';
            updated.unit = inv.unit || 'PCS';
            updated.category = inv.category || 'Supplies';
            if (inv.costPerUnit) updated.unitCost = inv.costPerUnit;
          }
        }

        const gross = (updated.quantity || 0) * (updated.unitCost || 0);
        const disc = updated.discountAmount || 0;
        const netBase = Math.max(0, gross - disc);
        const tax = netBase * ((updated.taxPercent || 0) / 100);
        updated.lineTotal = netBase + tax;
        return updated;
      })
    );
  };

  // Submit Create Purchase
  const handleSubmitNewPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier');
      return;
    }

    if (formItems.length === 0 || formItems.some((it) => !it.description.trim() || it.quantity <= 0 || it.unitCost < 0)) {
      alert('Please ensure all items have a description, valid quantity (> 0), and valid unit cost');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.createPurchaseTransaction({
        supplierId: selectedSupplierId,
        supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
        supplierInvoiceDate: supplierInvoiceDate || undefined,
        branchOrOutlet: selectedBranch,
        warehouse: selectedWarehouse,
        purchaseType: formPurchaseType,
        purchaseOrderRef: formPurchaseOrderRef.trim() || undefined,
        items: formItems.map((it) => ({
          inventoryItemId: it.inventoryItemId || null,
          itemCode: it.itemCode || null,
          description: it.description.trim(),
          category: it.category || 'Supplies',
          quantity: it.quantity,
          unit: it.unit,
          unitCost: it.unitCost,
          discountAmount: it.discountAmount || 0,
          taxPercent: it.taxPercent || 0,
          warehouse: it.warehouse || selectedWarehouse,
        })),
        discountAmount: formDiscountAmount || 0,
        freightCharges: formFreightCharges || 0,
        roundOff: formRoundOff || 0,
        paidAmount: formPaidAmount || 0,
        paymentMode: formPaymentMode,
        paymentReference: formPaymentRef.trim() || undefined,
        notes: formNotes.trim() || undefined,
        receivingStatus: formReceivingStatus,
        createdBy: 'Admin / Inventory Clerk',
      });

      setNewPurchaseModalOpen(false);
      fetchPurchases();
    } catch (err: any) {
      alert(err?.message || 'Failed to create purchase transaction');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (item: PurchaseTransactionListItem) => {
    setPaymentTarget(item);
    setPayAmount(item.dueAmount > 0 ? item.dueAmount : 0);
    setPayMode('CASH');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef('');
    setPayNotes('');
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }

    if (payAmount > paymentTarget.dueAmount + 0.01) {
      alert(`Payment amount (Rs. ${payAmount}) cannot exceed outstanding due of Rs. ${paymentTarget.dueAmount}`);
      return;
    }

    setPaySubmitting(true);
    try {
      await api.recordPurchasePayment(paymentTarget.id, {
        amount: payAmount,
        paymentMode: payMode,
        paymentDate: payDate,
        paymentReference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
        paidBy: 'Accounts Cashier',
      });

      setPaymentModalOpen(false);
      fetchPurchases();
      if (detailModalOpen && selectedTx?.id === paymentTarget.id) {
        handleViewDetail(paymentTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to record supplier payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Open Goods Received Note (GRN) Modal
  const handleOpenGRN = (item: PurchaseTransactionListItem) => {
    setGrnTarget(item);
    setGrnNumber(`GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setGrnWarehouse(item.warehouse || 'Central Store');
    setGrnReceivedBy('Store Incharge');
    setGrnNotes('');
    setGrnModalOpen(true);
  };

  // Submit GRN
  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnTarget) return;

    setGrnSubmitting(true);
    try {
      await api.receivePurchaseGoods(grnTarget.id, {
        grnNumber: grnNumber.trim(),
        warehouse: grnWarehouse,
        receivedBy: grnReceivedBy,
        notes: grnNotes.trim() || undefined,
        receivingStatus: 'RECEIVED',
      });

      setGrnModalOpen(false);
      fetchPurchases();
      if (detailModalOpen && selectedTx?.id === grnTarget.id) {
        handleViewDetail(grnTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to receive goods');
    } finally {
      setGrnSubmitting(false);
    }
  };

  // Open Return / Debit Note Modal
  const handleOpenReturn = async (item: PurchaseTransactionListItem) => {
    setReturnReasonGlobal('');
    try {
      const detail = await api.getPurchaseTransactionById(item.id);
      setReturnTarget(detail);
      const itemsList = detail.items || [];
      setReturnItemsState(
        itemsList.map((it: any) => ({
          description: it.description,
          inventoryItemId: it.inventoryItemId || null,
          unit: it.unit || 'PCS',
          maxQty: it.quantity,
          returnQty: 0,
          unitCost: it.unitCost,
          reason: '',
        }))
      );
      setReturnModalOpen(true);
    } catch (err: any) {
      alert('Failed to load purchase items for return');
    }
  };

  // Submit Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;

    const itemsToReturn = returnItemsState.filter((it) => it.returnQty > 0);
    if (itemsToReturn.length === 0) {
      alert('Please specify a return quantity of at least 1 item');
      return;
    }

    if (!returnReasonGlobal.trim()) {
      alert('Please enter a return reason');
      return;
    }

    setReturnSubmitting(true);
    try {
      await api.processPurchaseReturn(returnTarget.id, {
        items: itemsToReturn.map((it) => ({
          itemDescription: it.description,
          inventoryItemId: it.inventoryItemId || null,
          quantity: it.returnQty,
          unit: it.unit,
          unitCost: it.unitCost,
          reason: it.reason || returnReasonGlobal.trim(),
        })),
        reason: returnReasonGlobal.trim(),
        processedBy: 'Store Supervisor',
      });

      setReturnModalOpen(false);
      fetchPurchases();
      if (detailModalOpen && selectedTx?.id === returnTarget.id) {
        handleViewDetail(returnTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to process purchase return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Open Cancel Modal
  const handleOpenCancel = (item: PurchaseTransactionListItem) => {
    setCancelTarget(item);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  // Submit Cancel
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;

    setCancelSubmitting(true);
    try {
      await api.cancelPurchaseTransaction(cancelTarget.id, {
        reason: cancelReason.trim(),
        cancelledBy: 'Authorized Manager',
      });

      setCancelModalOpen(false);
      fetchPurchases();
      if (detailModalOpen && selectedTx?.id === cancelTarget.id) {
        handleViewDetail(cancelTarget.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel purchase transaction');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Open Print Modal
  const handleOpenPrint = async (itemOrId: string | PurchaseTransactionListItem) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    try {
      const detail = await api.getPurchaseTransactionById(id);
      setPrintTarget(detail);
      setPrintModalOpen(true);
    } catch (err: any) {
      alert('Failed to load transaction for printing');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      alert('No purchase records to export.');
      return;
    }

    const headers = [
      'Purchase No',
      'Supplier Invoice No',
      'Date',
      'Supplier',
      'PAN/VAT',
      'Purchase Type',
      'Branch/Outlet',
      'Warehouse',
      'PO Ref',
      'GRN Ref',
      'Subtotal',
      'Discount',
      'Tax',
      'Freight',
      'Grand Total',
      'Paid Amount',
      'Due Amount',
      'Payment Status',
      'Receiving Status',
      'Status',
      'Created By'
    ];

    const rows = items.map((t) => [
      t.purchaseNumber,
      t.supplierInvoiceNumber || '-',
      t.purchaseDate ? t.purchaseDate.slice(0, 10) : '-',
      `"${t.supplierName.replace(/"/g, '""')}"`,
      t.panVatNumber || '-',
      t.purchaseType,
      t.branchOrOutlet || '-',
      t.warehouse || '-',
      t.purchaseOrderRef || '-',
      t.grnNumber || '-',
      t.subtotal.toFixed(2),
      t.discount.toFixed(2),
      t.tax.toFixed(2),
      t.freightCharges.toFixed(2),
      t.grandTotal.toFixed(2),
      t.paidAmount.toFixed(2),
      t.dueAmount.toFixed(2),
      t.paymentStatus,
      t.receivingStatus,
      t.transactionStatus,
      t.createdBy
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Purchase Transactions
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchases}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh purchases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenNewPurchase}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Purchase</span>
          </button>
        </div>
      </div>

      {/* 4. Filter Toolbar */}
      <div className="p-3 bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-2.5">
        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Period:</span>
          </span>
          {(['ALL', 'TODAY', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleDatePresetChange(preset)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                datePreset === preset
                  ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {preset === 'ALL' && 'All Dates'}
              {preset === 'TODAY' && 'Today'}
              {preset === 'THIS_MONTH' && 'This Month'}
              {preset === 'LAST_MONTH' && 'Last Month'}
              {preset === 'THIS_YEAR' && 'This Year'}
            </button>
          ))}
        </div>

        {/* Advanced Filter Form */}
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search purchase no, invoice no, notes..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Supplier */}
          <div>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'SUP'})
                </option>
              ))}
            </select>
          </div>

          {/* Branch / Outlet */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Outlets / Branches</option>
              <option value="Main Kitchen">Main Kitchen</option>
              <option value="Restaurant Dine-In">Restaurant Dine-In</option>
              <option value="Rooftop Bar">Rooftop Bar</option>
              <option value="Banquet Hall">Banquet Hall</option>
            </select>
          </div>

          {/* Purchase Type */}
          <div>
            <select
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Purchase Types</option>
              <option value="INVENTORY">Inventory Purchase</option>
              <option value="CASH">Cash Purchase</option>
              <option value="CREDIT">Credit Purchase</option>
              <option value="EXPENSE">Operating Expense</option>
              <option value="ASSET">Fixed Asset</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          {/* Row 2: Custom Date From, To, Receiving Status, Action Buttons */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              title="From Date"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('ALL');
              }}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              title="To Date"
            />
          </div>

          <div>
            <select
              value={receivingStatus}
              onChange={(e) => setReceivingStatus(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Goods Receiving</option>
              <option value="RECEIVED">Received</option>
              <option value="PENDING">Pending Delivery</option>
              <option value="PARTIAL">Partially Received</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 lg:col-span-3">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 5. Purchase Transactions Table */}
      <div className="bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading purchase transactions...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-[1.25]" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No Purchase Transactions Found</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No purchase records match the selected filters. Click "Add New Purchase" to record inventory or supplier invoices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Purchase No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Inv No / Ref</th>
                  <th className="py-2.5 px-3">Type / Branch</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Due</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-center">Goods</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((tx) => {
                  const isCancelled = tx.transactionStatus === 'CANCELLED';
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                        isCancelled ? 'opacity-60 bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Purchase No */}
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.purchaseNumber}</span>
                          {isCancelled && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                              CANCELLED
                            </span>
                          )}
                        </div>
                        {tx.journalEntryId && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                            GL Posted
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.purchaseDate ? tx.purchaseDate.slice(0, 10) : '-'}
                      </td>

                      {/* Supplier */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {tx.supplierName}
                        </div>
                        {tx.panVatNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">PAN: {tx.panVatNumber}</div>
                        )}
                      </td>

                      {/* Supplier Invoice / PO Ref */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        <div className="font-mono text-slate-800 dark:text-slate-200">
                          {tx.supplierInvoiceNumber || '-'}
                        </div>
                        {tx.purchaseOrderRef && (
                          <div className="text-[10px] text-slate-400">PO: {tx.purchaseOrderRef}</div>
                        )}
                      </td>

                      {/* Type & Branch */}
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.purchaseType}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5">
                          {tx.branchOrOutlet || 'Main'}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">
                        Rs. {tx.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Paid */}
                      <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        Rs. {tx.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Due */}
                      <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        Rs. {tx.dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            tx.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : tx.paymentStatus === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>

                      {/* Goods Receiving Badge */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            tx.receivingStatus === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : tx.receivingStatus === 'PARTIAL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {tx.receivingStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(tx.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>

                          {!isCancelled && tx.dueAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(tx)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          {!isCancelled && tx.receivingStatus !== 'RECEIVED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenGRN(tx)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                              title="Receive Goods (GRN)"
                            >
                              <PackageCheck className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturn(tx)}
                              className="p-1 text-purple-600 hover:text-purple-800 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition-colors"
                              title="Purchase Return / Debit Note"
                            >
                              <RotateCcw className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenPrint(tx)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(tx)}
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title="Cancel Transaction"
                            >
                              <Ban className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Permanent DataTables Pagination Controls Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A]">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, totalItems)} of {totalItems} entries
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-1.5 py-0.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pNum = page - 2 + i;
                if (pNum > totalPages) pNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-7 h-7 text-xs font-bold rounded transition-colors ${
                    page === pNum
                      ? 'bg-[#0B3D32] text-white dark:bg-emerald-600'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW PURCHASE TRANSACTION                                  */}
      {/* ========================================================================= */}
      {newPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-300 stroke-[1.25]" />
                <div>
                  <h2 className="text-base font-bold">New Purchase Transaction</h2>
                  <div className="text-xs text-emerald-200">Auto Number: {newPurchaseNumber}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewPurchaseModalOpen(false)}
                className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitNewPurchase} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Optional PO Conversion dropdown */}
              {pendingPOs.length > 0 && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Convert Approved Purchase Order:
                    </span>
                  </div>
                  <select
                    onChange={(e) => handleSelectPOToConvert(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded focus:outline-hidden"
                  >
                    <option value="">-- Choose Approved PO to preload items --</option>
                    {pendingPOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.orderNumber} - {po.supplierName} (Rs. {po.totalAmount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 1: Supplier & Live Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'SUP'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Live Info Box */}
                <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                  {activeSupplier ? (
                    <>
                      <div>
                        <span className="text-slate-400">PAN/VAT:</span>{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {activeSupplier.panVatNumber || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span>{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{activeSupplier.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Terms:</span>{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {activeSupplier.paymentTermsDays ? `${activeSupplier.paymentTermsDays} Days` : 'Net 30'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Payable Balance:</span>{' '}
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          Rs. {(((activeSupplier as any).balance ?? activeSupplier.openingBalance ?? 0) as number).toLocaleString()}
                        </span>
                      </div>
                      {activeSupplier.creditLimit && activeSupplier.creditLimit > 0 && (
                        <div>
                          <span className="text-slate-400">Credit Limit:</span>{' '}
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Rs. {activeSupplier.creditLimit.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Select a supplier to inspect credit &amp; tax details</span>
                  )}
                </div>
              </div>

              {/* Row 2: Invoicing & Outlet Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Invoice No
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-99882"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={supplierInvoiceDate}
                    onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Outlet
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Main Kitchen">Main Kitchen</option>
                    <option value="Restaurant Dine-In">Restaurant Dine-In</option>
                    <option value="Rooftop Bar">Rooftop Bar</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receiving Warehouse
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Central Store">Central Store</option>
                    <option value="Dry Storage">Dry Storage</option>
                    <option value="Cold Room / Chiller">Cold Room / Chiller</option>
                    <option value="Bar Storage">Bar Storage</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Purchase Type & Goods Receiving Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Type
                  </label>
                  <select
                    value={formPurchaseType}
                    onChange={(e) => setFormPurchaseType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="INVENTORY">Inventory Purchase (Stock Tracked)</option>
                    <option value="CASH">Cash Purchase</option>
                    <option value="CREDIT">Credit Purchase</option>
                    <option value="EXPENSE">Operating Expense</option>
                    <option value="ASSET">Fixed Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Goods Receiving Status
                  </label>
                  <select
                    value={formReceivingStatus}
                    onChange={(e) => setFormReceivingStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="RECEIVED">Directly Received (Update Stock Now)</option>
                    <option value="PENDING">Pending Delivery (Awaiting GRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PO Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={formPurchaseOrderRef}
                    onChange={(e) => setFormPurchaseOrderRef(e.target.value)}
                    placeholder="e.g. PO-2026-0042"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Purchase Line Items</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#0B3D32] text-white dark:bg-emerald-600 rounded flex items-center gap-1 hover:opacity-90"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 px-2.5">Item / Inventory Link</th>
                        <th className="py-2 px-2">Qty</th>
                        <th className="py-2 px-2">Unit</th>
                        <th className="py-2 px-2">Rate (Rs.)</th>
                        <th className="py-2 px-2">Disc</th>
                        <th className="py-2 px-2">Tax %</th>
                        <th className="py-2 px-2 text-right">Line Total</th>
                        <th className="py-2 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {formItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          {/* Item Link / Description */}
                          <td className="py-1.5 px-2.5 min-w-[220px]">
                            <div className="space-y-1">
                              {inventoryItems.length > 0 && (
                                <select
                                  value={item.inventoryItemId || ''}
                                  onChange={(e) => handleUpdateItemRow(item.id, 'inventoryItemId', e.target.value || null)}
                                  className="w-full px-1.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                                >
                                  <option value="">-- Pick from Inventory --</option>
                                  {inventoryItems.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.name} (Stock: {inv.currentStock} {inv.unit})
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItemRow(item.id, 'description', e.target.value)}
                                placeholder="Item name / description *"
                                required
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                              />
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="py-1.5 px-2 w-20">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemRow(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full px-2 py-1 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-1.5 px-2 w-20">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItemRow(item.id, 'unit', e.target.value)}
                              placeholder="KG"
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded uppercase"
                            />
                          </td>

                          {/* Unit Cost */}
                          <td className="py-1.5 px-2 w-24">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitCost}
                              onChange={(e) => handleUpdateItemRow(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full px-2 py-1 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                            />
                          </td>

                          {/* Disc */}
                          <td className="py-1.5 px-2 w-20">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.discountAmount}
                              onChange={(e) => handleUpdateItemRow(item.id, 'discountAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                            />
                          </td>

                          {/* Tax % */}
                          <td className="py-1.5 px-2 w-20">
                            <select
                              value={item.taxPercent}
                              onChange={(e) => handleUpdateItemRow(item.id, 'taxPercent', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={13}>13% (VAT)</option>
                            </select>
                          </td>

                          {/* Line Total */}
                          <td className="py-1.5 px-2 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                            Rs. {item.lineTotal.toFixed(2)}
                          </td>

                          {/* Action */}
                          <td className="py-1.5 px-2 text-center w-12">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(item.id)}
                              disabled={formItems.length === 1}
                              className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary & Payment Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                {/* Left: Notes & Immediate Payment */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Notes / Reference
                    </label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Enter supplier terms, delivery conditions, or internal comments..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                      Immediate Payment (Cash / Advance / Partial)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500">Paid Amount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={formPaidAmount}
                          onChange={(e) => setFormPaidAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">Payment Mode</label>
                        <select
                          value={formPaymentMode}
                          onChange={(e) => setFormPaymentMode(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        >
                          <option value="CASH">Cash in Hand</option>
                          <option value="BANK">Bank Transfer</option>
                          <option value="QR">FonePay / QR</option>
                          <option value="CARD">Card Payment</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500">Payment Ref / Cheque No</label>
                        <input
                          type="text"
                          value={formPaymentRef}
                          onChange={(e) => setFormPaymentRef(e.target.value)}
                          placeholder="e.g. TXN-1092 / Cheque #4928"
                          className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Subtotal, Charges, and Grand Total */}
                <div className="space-y-1.5 text-xs bg-white dark:bg-slate-900 p-3.5 rounded border border-slate-200 dark:border-slate-800 font-medium">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {formCalculations.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Extra Discount:</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formDiscountAmount}
                      onChange={(e) => setFormDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-1.5 py-0.5 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Freight / Transport:</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formFreightCharges}
                      onChange={(e) => setFormFreightCharges(parseFloat(e.target.value) || 0)}
                      className="w-24 px-1.5 py-0.5 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Total Tax:</span>
                    <span className="font-mono">Rs. {formCalculations.taxTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Round Off:</span>
                    <input
                      type="number"
                      step="any"
                      value={formRoundOff}
                      onChange={(e) => setFormRoundOff(parseFloat(e.target.value) || 0)}
                      className="w-24 px-1.5 py-0.5 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-[#0B3D32] dark:text-emerald-400">
                      Rs. {formCalculations.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>Paid Amount:</span>
                    <span className="font-mono">Rs. {formCalculations.paid.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                    <span>Remaining Due:</span>
                    <span className="font-mono">Rs. {formCalculations.due.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded shadow-xs flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Purchase Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT                                                  */}
      {/* ========================================================================= */}
      {paymentModalOpen && paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-300 stroke-[1.25]" />
                <span className="font-bold">Record Supplier Payment</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase No:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{paymentTarget.purchaseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{paymentTarget.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grand Total:</span>
                  <span className="font-mono">Rs. {paymentTarget.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-mono text-emerald-600">Rs. {paymentTarget.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400">
                  <span>Outstanding Due:</span>
                  <span className="font-mono">Rs. {paymentTarget.dueAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={paymentTarget.dueAmount}
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Account</option>
                    <option value="QR">FonePay / QR</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Cheque No
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. Bank slip, Cheque number"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 rounded flex items-center gap-1.5"
                >
                  {paySubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GOODS RECEIVED NOTE (GRN)                                        */}
      {/* ========================================================================= */}
      {grnModalOpen && grnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-300 stroke-[1.25]" />
                <span className="font-bold">Receive Goods (GRN)</span>
              </div>
              <button type="button" onClick={() => setGrnModalOpen(false)} className="text-emerald-100 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase No:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{grnTarget.purchaseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{grnTarget.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-amber-600">{grnTarget.receivingStatus}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GRN Reference Number *
                </label>
                <input
                  type="text"
                  value={grnNumber}
                  onChange={(e) => setGrnNumber(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Warehouse
                  </label>
                  <select
                    value={grnWarehouse}
                    onChange={(e) => setGrnWarehouse(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  >
                    <option value="Central Store">Central Store</option>
                    <option value="Dry Storage">Dry Storage</option>
                    <option value="Cold Room / Chiller">Cold Room / Chiller</option>
                    <option value="Bar Storage">Bar Storage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Received By
                  </label>
                  <input
                    type="text"
                    value={grnReceivedBy}
                    onChange={(e) => setGrnReceivedBy(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inspection Notes / Quality Remarks
                </label>
                <input
                  type="text"
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  placeholder="e.g. Package inspected, all seals intact"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGrnModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grnSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] dark:bg-emerald-600 rounded flex items-center gap-1.5"
                >
                  {grnSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                  <span>Accept Goods &amp; Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PURCHASE RETURN / DEBIT NOTE                                    */}
      {/* ========================================================================= */}
      {returnModalOpen && returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs my-8">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-300 stroke-[1.25]" />
                <span className="font-bold">Purchase Return &amp; Debit Note</span>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase No:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{returnTarget.purchaseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{returnTarget.supplierName}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Specify Returned Quantities:
                </span>
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 px-2.5">Item Description</th>
                        <th className="py-2 px-2 text-right">Purchased Qty</th>
                        <th className="py-2 px-2 text-right">Unit Rate</th>
                        <th className="py-2 px-2 text-right">Return Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {returnItemsState.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          <td className="py-2 px-2.5 font-medium">{it.description}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">
                            {it.maxQty} {it.unit}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">Rs. {it.unitCost.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max={it.maxQty}
                              step="any"
                              value={it.returnQty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setReturnItemsState((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, returnQty: Math.min(it.maxQty, val) } : x))
                                );
                              }}
                              className="w-20 px-2 py-1 text-xs text-right font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Return *
                </label>
                <input
                  type="text"
                  value={returnReasonGlobal}
                  onChange={(e) => setReturnReasonGlobal(e.target.value)}
                  placeholder="e.g. Expired goods, quality discrepancy, damaged packaging"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-1.5"
                >
                  {returnSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Issue Debit Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAIL VIEW                                                     */}
      {/* ========================================================================= */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs my-8">
            <div className="flex items-center justify-between p-3.5 bg-[#0B3D32] text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-300 stroke-[1.25]" />
                <span className="font-bold">Purchase Transaction Details</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading || !selectedTx ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>Loading transaction details...</span>
              </div>
            ) : (
              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Header Info Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Purchase Number</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{selectedTx.purchaseNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Supplier</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{selectedTx.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Invoice No</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedTx.supplierInvoiceNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Purchase Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedTx.purchaseDate ? selectedTx.purchaseDate.slice(0, 10) : '-'}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">Purchased Items</h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-2.5">Item Description</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                          <th className="py-2 px-2 text-right">Rate (Rs.)</th>
                          <th className="py-2 px-2 text-right">Disc</th>
                          <th className="py-2 px-2 text-right">Tax %</th>
                          <th className="py-2 px-2.5 text-right">Total (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {(selectedTx.items || []).map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-2.5 font-medium">{it.description}</td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">Rs. {it.unitCost?.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono">Rs. {(it.discountAmount || 0).toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono">{it.taxPercent || 0}%</td>
                            <td className="py-1.5 px-2.5 text-right font-bold font-mono">
                              Rs. {(it.totalCost || it.lineTotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History */}
                {selectedTx.payments && selectedTx.payments.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">Payment Records</h3>
                    <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                            <th className="py-1.5 px-2.5">Date</th>
                            <th className="py-1.5 px-2">Mode</th>
                            <th className="py-1.5 px-2">Reference</th>
                            <th className="py-1.5 px-2 text-right">Amount</th>
                            <th className="py-1.5 px-2.5">Paid By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {selectedTx.payments.map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-2.5 text-slate-600">{p.paymentDate ? p.paymentDate.slice(0, 10) : '-'}</td>
                              <td className="py-1.5 px-2 font-semibold">{p.paymentMethod}</td>
                              <td className="py-1.5 px-2 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-emerald-600 font-mono">
                                Rs. {(p.amount || 0).toFixed(2)}
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-500">{p.paidBy || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Financial Summary Totals */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex justify-end">
                  <div className="w-64 space-y-1 font-medium">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs. {selectedTx.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Discount:</span>
                      <span className="font-mono">Rs. {selectedTx.discount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Tax Amount:</span>
                      <span className="font-mono">Rs. {selectedTx.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Freight Charges:</span>
                      <span className="font-mono">Rs. {selectedTx.freightCharges?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-600">Rs. {selectedTx.grandTotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Paid:</span>
                      <span className="font-mono">Rs. {selectedTx.paidAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Due:</span>
                      <span className="font-mono">Rs. {selectedTx.dueAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenPrint(selectedTx)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CANCEL TRANSACTION                                              */}
      {/* ========================================================================= */}
      {cancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3.5 bg-rose-700 text-white">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 stroke-[1.25]" />
                <span className="font-bold">Cancel Purchase Transaction</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-rose-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel} className="p-4 space-y-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                Are you sure you want to cancel purchase <strong>{cancelTarget.purchaseNumber}</strong>? This will
                reverse inventory movements and void linked journal entries.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason *
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Order cancelled, duplicate bill entered"
                  required
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded flex items-center gap-1.5"
                >
                  {cancelSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: PRINTABLE A4 PURCHASE INVOICE / VOUCHER                         */}
      {/* ========================================================================= */}
      {printModalOpen && printTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden my-8 p-6 print:p-0 print:m-0 print:border-none print:shadow-none">
            {/* Action Bar (hidden during browser print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <span className="font-bold text-sm text-[#0B3D32]">Purchase Voucher Print Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#092e26] rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="space-y-4 text-xs font-sans">
              {/* Hotel & Restaurant Header */}
              <div className="text-center pb-3 border-b-2 border-slate-800">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  EVEREST FAMILY RESTAURANT &amp; HOTEL
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Main Road, Lakeside, Pokhara, Nepal | Phone: +977-61-520000 | PAN: 601234567
                </p>
                <div className="inline-block px-3 py-0.5 mt-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  PURCHASE VOUCHER / GOODS INWARD NOTE
                </div>
              </div>

              {/* Document Meta & Supplier Details */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Supplier Details:</div>
                  <div className="font-bold text-sm text-slate-900">{printTarget.supplierName}</div>
                  <div>Code: {printTarget.supplierCode || 'SUP'}</div>
                  <div>PAN / VAT No: {printTarget.panVatNumber || 'N/A'}</div>
                  <div>Branch / Outlet: {printTarget.branchOrOutlet || 'Main Kitchen'}</div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Voucher Info:</div>
                  <div>
                    <span className="text-slate-500">Purchase No:</span>{' '}
                    <strong className="font-mono text-slate-900">{printTarget.purchaseNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Supplier Inv No:</span>{' '}
                    <strong className="font-mono">{printTarget.supplierInvoiceNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>{' '}
                    {printTarget.purchaseDate ? printTarget.purchaseDate.slice(0, 10) : '-'}
                  </div>
                  <div>
                    <span className="text-slate-500">Warehouse:</span> {printTarget.warehouse || 'Central Store'}
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Status:</span>{' '}
                    <span className="font-bold uppercase">{printTarget.paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded overflow-hidden mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                      <th className="py-2 px-2.5">S.N.</th>
                      <th className="py-2 px-2.5">Item Description</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Rate (Rs.)</th>
                      <th className="py-2 px-2 text-right">Disc</th>
                      <th className="py-2 px-2 text-right">Tax %</th>
                      <th className="py-2 px-2.5 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(printTarget.items || []).map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 px-2.5 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-2.5 font-medium">{it.description}</td>
                        <td className="py-2 px-2 text-right font-mono">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">Rs. {it.unitCost?.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono">Rs. {(it.discountAmount || 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono">{it.taxPercent || 0}%</td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold">
                          Rs. {(it.totalCost || it.lineTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary Footer */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 font-medium text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {printTarget.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono">Rs. {printTarget.discount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (VAT):</span>
                    <span className="font-mono">Rs. {printTarget.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Freight / Transport:</span>
                    <span className="font-mono">Rs. {printTarget.freightCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="font-mono">Rs. {printTarget.grandTotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid:</span>
                    <span className="font-mono">Rs. {printTarget.paidAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Payable:</span>
                    <span className="font-mono">Rs. {printTarget.dueAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-4 gap-4 pt-16 text-center text-[10px] text-slate-600 uppercase font-semibold">
                <div className="border-t border-slate-400 pt-1">Prepared By</div>
                <div className="border-t border-slate-400 pt-1">Store Incharge</div>
                <div className="border-t border-slate-400 pt-1">Verified By (Accounts)</div>
                <div className="border-t border-slate-400 pt-1">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

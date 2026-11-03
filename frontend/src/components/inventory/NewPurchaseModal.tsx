'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  ShoppingBag,
  Layers,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency } from '@/lib/utils';
import { useMasterOptions } from '@/lib/mastersData';
import { SupplierRecord, PurchaseType, PurchasePaymentMethod, PurchasePaymentStatus } from '@/lib/types';
import { SupplierSearchDropdown } from './SupplierSearchDropdown';

interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  department?: string;
  category?: string;
  trackStock?: boolean;
  costPerUnit?: number;
  purchaseUnit?: string;
  conversionFactor?: number;
}

interface PurchaseLineRow {
  keyId: string;
  itemId?: string;
  itemName: string;
  category: string;
  department: string;
  quantity: number | '';
  purchaseUnit: string;
  stockUnit: string;
  conversionFactor: number;
  unitCost: number | '';
  trackStock: boolean;
}

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseCreated: () => void;
  preselectedItemId?: string;
  initialDepartment?: 'HOTEL' | 'RESTAURANT';
}


export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchaseCreated,
  preselectedItemId,
  initialDepartment = 'RESTAURANT',
}) => {
  const toast = useToast();

  const getTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };



  // 1. Wizard Mode: If not chosen yet, ask choice, or default
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('SIMPLE');
  const [hasChosenType, setHasChosenType] = useState<boolean>(false);

  // General Fields
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDate());
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState<string>('');
  const [supplierPanVatNumber, setSupplierPanVatNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  // Financials for Full Details
  const [discount, setDiscount] = useState<number | ''>(0);
  const [tax, setTax] = useState<number | ''>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>('PAID');

  // Items in Purchase
  const [itemsList, setItemsList] = useState<InventoryItemOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const { activeItems: masterUnits } = useMasterOptions('units');
  const dynamicUnits = useMemo(() => {
    const list: string[] = [];
    masterUnits.forEach((u) => {
      if (u.name && !list.includes(u.name)) list.push(u.name);
    });
    itemsList.forEach((it) => {
      if (it.unit && !list.includes(it.unit)) list.push(it.unit);
      if (it.purchaseUnit && !list.includes(it.purchaseUnit)) list.push(it.purchaseUnit);
    });
    const fallbacks = ['Pieces', 'Bottles', 'Cans', 'Kg', 'Litres', 'Boxes', 'Packets', 'Cartons', 'Sets'];
    fallbacks.forEach((f) => {
      if (!list.some((existing) => existing.toLowerCase() === f.toLowerCase())) {
        list.push(f);
      }
    });
    return list;
  }, [masterUnits, itemsList]);

  const [lineRows, setLineRows] = useState<PurchaseLineRow[]>([
    {
      keyId: 'row-1',
      itemId: '',
      itemName: '',
      category: 'GENERAL',
      department: initialDepartment,
      quantity: 1,
      purchaseUnit: 'pieces',
      stockUnit: 'pieces',
      conversionFactor: 1.0,
      unitCost: '',
      trackStock: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Fetch available inventory items
  useEffect(() => {
    if (!isOpen) return;
    const fetchInventory = async () => {
      setIsLoadingItems(true);
      try {
        const res = await fetch('/api/inventory/items');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItemsList(json.data);
          // If preselected item given
          if (preselectedItemId) {
            const found = json.data.find((i: InventoryItemOption) => i.id === preselectedItemId);
            if (found) {
              setLineRows([
                {
                  keyId: 'row-init',
                  itemId: found.id,
                  itemName: found.name,
                  category: found.category || 'GENERAL',
                  department: found.department || initialDepartment,
                  quantity: 1,
                  purchaseUnit: found.purchaseUnit || found.unit || 'pieces',
                  stockUnit: found.unit || 'pieces',
                  conversionFactor: found.conversionFactor || 1.0,
                  unitCost: found.costPerUnit || '',
                  trackStock: found.trackStock ?? true,
                },
              ]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load items', e);
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchInventory();
    setIdempotencyKey(`idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  }, [isOpen, preselectedItemId, initialDepartment]);

  // Handle supplier change & auto-populate PAN/VAT
  const handleSupplierSelect = (supplier: SupplierRecord | null) => {
    setSelectedSupplier(supplier);
    if (supplier?.panVatNumber) {
      setSupplierPanVatNumber(supplier.panVatNumber);
    }
  };

  // Add Row
  const handleAddRow = () => {
    setLineRows((prev) => [
      ...prev,
      {
        keyId: `row-${Date.now()}-${Math.random()}`,
        itemId: '',
        itemName: '',
        category: 'GENERAL',
        department: initialDepartment,
        quantity: 1,
        purchaseUnit: 'pieces',
        stockUnit: 'pieces',
        conversionFactor: 1.0,
        unitCost: '',
        trackStock: true,
      },
    ]);
  };

  // Remove Row
  const handleRemoveRow = (index: number) => {
    if (lineRows.length === 1) return;
    setLineRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Row
  const handleRowChange = (index: number, patch: Partial<PurchaseLineRow>) => {
    setLineRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  // When an existing inventory item is chosen for a row
  const handleSelectItem = (index: number, itemId: string) => {
    const item = itemsList.find((i) => i.id === itemId);
    if (!item) return;

    handleRowChange(index, {
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'GENERAL',
      department: item.department || initialDepartment,
      purchaseUnit: item.purchaseUnit || item.unit || 'pieces',
      stockUnit: item.unit || 'pieces',
      conversionFactor: item.conversionFactor || 1.0,
      unitCost: item.costPerUnit || '',
      trackStock: item.trackStock ?? true,
    });
  };

  // Calculations
  const subtotal = useMemo(() => {
    return lineRows.reduce((sum, row) => {
      const q = typeof row.quantity === 'number' ? row.quantity : 0;
      const c = typeof row.unitCost === 'number' ? row.unitCost : 0;
      return sum + q * c;
    }, 0);
  }, [lineRows]);

  const discVal = typeof discount === 'number' ? discount : 0;
  const taxVal = typeof tax === 'number' ? tax : 0;
  const chargesVal = typeof additionalCharges === 'number' ? additionalCharges : 0;

  const grandTotal = useMemo(() => {
    if (purchaseType === 'SIMPLE') {
      return subtotal;
    }
    const total = subtotal - discVal + taxVal + chargesVal;
    return Math.max(0, Math.round(total * 100) / 100);
  }, [purchaseType, subtotal, discVal, taxVal, chargesVal]);

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!purchaseDate) {
      toast.error('Date required', 'Please specify the purchase date.');
      return;
    }

    if (lineRows.length === 0) {
      toast.error('Items required', 'Please add at least one purchase item.');
      return;
    }

    for (let i = 0; i < lineRows.length; i++) {
      const row = lineRows[i];
      if (!row.itemName.trim()) {
        toast.error(`Item #${i + 1} Name Required`, 'Please select or enter an item name.');
        return;
      }
      if (!row.quantity || Number(row.quantity) <= 0) {
        toast.error(`Item #${i + 1} Quantity Invalid`, 'Quantity must be greater than zero.');
        return;
      }
      if (row.unitCost === '' || Number(row.unitCost) < 0) {
        toast.error(`Item #${i + 1} Cost Invalid`, 'Please provide a valid unit price/cost.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        purchaseType,
        purchaseDate,
        supplierId: selectedSupplier ? selectedSupplier.id : null,
        supplierInvoiceNumber: purchaseType === 'FULL' && supplierInvoiceNumber.trim() ? supplierInvoiceNumber.trim() : null,
        supplierPanVatNumber: purchaseType === 'FULL' && supplierPanVatNumber.trim() ? supplierPanVatNumber.trim() : null,
        items: lineRows.map((r) => {
          const qty = Number(r.quantity) || 0;
          const cost = Number(r.unitCost) || 0;
          return {
            itemId: r.itemId || null,
            itemName: r.itemName,
            category: r.category,
            department: r.department,
            quantity: qty,
            purchaseUnit: r.purchaseUnit,
            stockUnit: r.stockUnit,
            conversionFactor: Number(r.conversionFactor) || 1.0,
            unitCost: cost,
            totalCost: Math.round(qty * cost * 100) / 100,
            trackStock: r.trackStock,
          };
        }),
        subtotal: Math.round(subtotal * 100) / 100,
        discount: purchaseType === 'FULL' ? discVal : 0,
        tax: purchaseType === 'FULL' ? taxVal : 0,
        additionalCharges: purchaseType === 'FULL' ? chargesVal : 0,
        grandTotal,
        paymentMethod: purchaseType === 'FULL' ? paymentMethod : 'CASH',
        paymentStatus: purchaseType === 'FULL' ? paymentStatus : 'PAID',
        notes: notes.trim() || null,
        attachmentUrl: purchaseType === 'FULL' && attachmentUrl.trim() ? attachmentUrl.trim() : null,
        createdBy: 'Admin',
        idempotencyKey,
      };

      const res = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json && json.success) {
        toast.success(
          'Purchase Saved Successfully',
          `${purchaseType === 'SIMPLE' ? 'Simple' : 'Full'} Purchase recorded. Total: Rs. ${grandTotal.toLocaleString()}`
        );
        onPurchaseCreated();
        onClose();
      } else {
        toast.error('Failed to save purchase', json?.message || 'Server error occurred.');
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Could not connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden font-sans">
        {/* ======================= MODAL HEADER ======================= */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {purchaseType === 'SIMPLE' ? 'New Purchase Entry' : 'New Purchase Invoice'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================= TYPE TOGGLE BAR ======================= */}
        <div className="px-5 py-2.5 bg-white dark:bg-[#071F1A] border-b border-slate-200 dark:border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Mode</span>
          <div className="grid grid-cols-2 gap-2 sm:w-80">
            <button
              type="button"
              onClick={() => setPurchaseType('SIMPLE')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer',
                purchaseType === 'SIMPLE'
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Simple</span>
            </button>

            <button
              type="button"
              onClick={() => setPurchaseType('FULL')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer',
                purchaseType === 'FULL'
                  ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detailed</span>
            </button>
          </div>
        </div>

        {/* ======================= FORM BODY ======================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* SECTION 1: HEADER & SUPPLIER INFORMATION */}
          <div className="bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-border-default rounded-[3px] p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-border-default pb-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0B3D32]" />
                General Information
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Purchase Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Purchase Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* Dynamic Supplier Dropdown */}
              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Supplier <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <SupplierSearchDropdown
                  value={selectedSupplier ? selectedSupplier.id : null}
                  onChange={handleSupplierSelect}
                  placeholder="Search supplier (or leave blank for Walk-in)..."
                />
              </div>

              {/* Full Details Purchase specific supplier fields */}
              {purchaseType === 'FULL' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Invoice Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Invoice #"
                      value={supplierInvoiceNumber}
                      onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Supplier PAN/VAT Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="PAN / VAT #"
                      value={supplierPanVatNumber}
                      onChange={(e) => setSupplierPanVatNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Invoice Attachment Link <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or doc id"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 2: PURCHASE ITEMS TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0B3D32]" />
                Purchase Items ({lineRows.length})
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#0B3D32] dark:text-emerald-400 hover:bg-slate-50 text-xs font-bold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-300 dark:border-border-default rounded-[3px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                    <th className="py-2 px-2.5 w-10 text-center">#</th>
                    <th className="py-2 px-2.5 min-w-[200px]">Item Description</th>
                    <th className="py-2 px-2.5 w-28">Quantity</th>
                    <th className="py-2 px-2.5 w-28">Purchase Unit</th>
                    {purchaseType === 'FULL' && <th className="py-2 px-2.5 w-28">Stock Factor</th>}
                    <th className="py-2 px-2.5 w-32">Unit Price (Rs.)</th>
                    <th className="py-2 px-2.5 w-28 text-right">Line Total</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#071F1A]">
                  {lineRows.map((row, index) => {
                    const rowQty = typeof row.quantity === 'number' ? row.quantity : 0;
                    const rowCost = typeof row.unitCost === 'number' ? row.unitCost : 0;
                    const rowTotal = Math.round(rowQty * rowCost * 100) / 100;

                    return (
                      <tr key={row.keyId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {/* Index */}
                        <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Item Name & Quick Picker */}
                        <td className="py-2 px-2.5">
                          <div className="space-y-1">
                            {/* Inventory Item Selector */}
                            <select
                              value={row.itemId || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSelectItem(index, e.target.value);
                                } else {
                                  handleRowChange(index, { itemId: '', itemName: '' });
                                }
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-[3px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0B3D32]"
                            >
                              <option value="">-- Select from Inventory (Optional) --</option>
                              {itemsList.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.department || 'GENERAL'} · Current: {item.currentStock} {item.unit})
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              required
                              placeholder="Item name"
                              value={row.itemName}
                              onChange={(e) => handleRowChange(index, { itemName: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32]"
                            />

                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={row.trackStock}
                                  onChange={(e) => handleRowChange(index, { trackStock: e.target.checked })}
                                  className="rounded text-[#0B3D32] focus:ring-0 cursor-pointer"
                                />
                                <span>Track in Inventory</span>
                              </label>
                            </div>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-2.5 align-top">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            placeholder="0"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                              handleRowChange(index, { quantity: val });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Purchase Unit */}
                        <td className="py-2 px-2.5 align-top">
                          <input
                            type="text"
                            list="purchase-unit-options"
                            placeholder="Unit"
                            value={row.purchaseUnit}
                            onChange={(e) => handleRowChange(index, { purchaseUnit: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Stock Factor (Full details only) */}
                        {purchaseType === 'FULL' && (
                          <td className="py-2 px-2.5 align-top">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={row.conversionFactor}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1.0;
                                handleRowChange(index, { conversionFactor: val });
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                            />
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              1 {row.purchaseUnit} = {row.conversionFactor} stock {row.stockUnit}
                            </span>
                          </td>
                        )}

                        {/* Unit Price */}
                        <td className="py-2 px-2.5 align-top">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="0.00"
                            value={row.unitCost}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                              handleRowChange(index, { unitCost: val });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-2.5 align-top text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs pt-2">
                          Rs. {rowTotal.toLocaleString()}
                        </td>

                        {/* Delete Row */}
                        <td className="py-2 px-2 text-center align-top pt-2">
                          {lineRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(index)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove item row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <datalist id="purchase-unit-options">
              {dynamicUnits.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          {/* SECTION 3: TOTALS & PAYMENT DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Left: Notes & Payment Info */}
            <div className="space-y-3">
              {purchaseType === 'FULL' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PurchasePaymentMethod)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank Transfer / UPI</option>
                      <option value="CARD">Card Payment</option>
                      <option value="CREDIT">Supplier Credit (Pay Later)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PurchasePaymentStatus)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                    >
                      <option value="PAID">Paid</option>
                      <option value="PARTIALLY_PAID">Partially Paid</option>
                      <option value="UNPAID">Unpaid / Due</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={purchaseType === 'FULL' ? 3 : 2}
                  placeholder="Optional purchase notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-border-default rounded-[3px] bg-white dark:bg-[#071F1A] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            {/* Right: Calculations Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-border-default rounded-[3px] p-3.5 space-y-2 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-border-default pb-1.5 flex items-center justify-between">
                <span>Summary & Calculations</span>
                
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-300">
                <span>Subtotal ({lineRows.length} items):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              {/* Additional Calculations for Full Details */}
              {purchaseType === 'FULL' && (
                <>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Discount (-):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-24 px-1.5 py-0.5 text-right border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Tax / VAT (+):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={tax}
                      onChange={(e) => setTax(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-24 px-1.5 py-0.5 text-right border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Delivery / Charges (+):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={additionalCharges}
                      onChange={(e) =>
                        setAdditionalCharges(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-24 px-1.5 py-0.5 text-right border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </>
              )}

              {/* Grand Total */}
              <div className="border-t border-slate-300 dark:border-border-default pt-2 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* ======================= MODAL FOOTER ======================= */}
          <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-between">
            <span></span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] text-xs font-bold text-white transition-all shadow-xs cursor-pointer',
                  isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#0B3D32] hover:bg-[#082d25] active:scale-98'
                )}
              >
                <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


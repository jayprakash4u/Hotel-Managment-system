'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { useMasterOptions } from '@/lib/mastersData';
import { SupplierRecord } from '@/lib/types';
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
  unit: string;
  unitCost: number | '';
  trackStock: boolean;
  isDropdownOpen?: boolean;
  selectedIndex?: number;
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

  // Top Service Strip Fields
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayDate());
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState<string>('');
  const [supplierPanVatNumber, setSupplierPanVatNumber] = useState<string>('');
  const [department, setDepartment] = useState<'RESTAURANT' | 'HOTEL'>(initialDepartment);

  // Line Rows
  const [lineRows, setLineRows] = useState<PurchaseLineRow[]>([
    {
      keyId: 'row-1',
      itemId: '',
      itemName: '',
      category: 'GENERAL',
      department: initialDepartment,
      quantity: 1,
      unit: 'Pcs',
      unitCost: '',
      trackStock: true,
      isDropdownOpen: false,
      selectedIndex: 0,
    },
  ]);

  // Inventory catalog for inline autocomplete
  const [itemsList, setItemsList] = useState<InventoryItemOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Financials
  const [disPercent, setDisPercent] = useState<string>('');
  const [disAmt, setDisAmt] = useState<string>('');
  const [taxAmt, setTaxAmt] = useState<string>('');
  const [isVatBill, setIsVatBill] = useState<boolean>(false);
  const [paidAmt, setPaidAmt] = useState<string>('');
  const [isPaidAmtCustomized, setIsPaidAmtCustomized] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [remarks, setRemarks] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Master Units
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
    const fallbacks = ['Pcs', 'Kg', 'Ltr', 'Box', 'Bottle', 'Packet', 'Can', 'Carton', 'Set'];
    fallbacks.forEach((f) => {
      if (!list.some((existing) => existing.toLowerCase() === f.toLowerCase())) {
        list.push(f);
      }
    });
    return list;
  }, [masterUnits, itemsList]);

  // Load Inventory Items
  useEffect(() => {
    if (!isOpen) return;
    const fetchInventory = async () => {
      setIsLoadingItems(true);
      try {
        const res = await fetch('/api/inventory/items');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItemsList(json.data);

          if (preselectedItemId) {
            const found = json.data.find((i: InventoryItemOption) => i.id === preselectedItemId);
            if (found) {
              setLineRows([
                {
                  keyId: 'row-init',
                  itemId: found.id,
                  itemName: found.name,
                  category: found.category || 'GENERAL',
                  department: (found.department as 'RESTAURANT' | 'HOTEL') || initialDepartment,
                  quantity: 1,
                  unit: found.purchaseUnit || found.unit || 'Pcs',
                  unitCost: found.costPerUnit || '',
                  trackStock: found.trackStock ?? true,
                  isDropdownOpen: false,
                  selectedIndex: 0,
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

  // Handle Supplier Selection
  const handleSupplierSelect = (supplier: SupplierRecord | null) => {
    setSelectedSupplier(supplier);
    if (supplier?.panVatNumber) {
      setSupplierPanVatNumber(supplier.panVatNumber);
    }
  };

  // Add / Remove Row
  const handleAddRow = () => {
    setLineRows((prev) => [
      ...prev,
      {
        keyId: `row-${Date.now()}-${Math.random()}`,
        itemId: '',
        itemName: '',
        category: 'GENERAL',
        department,
        quantity: 1,
        unit: 'Pcs',
        unitCost: '',
        trackStock: true,
        isDropdownOpen: false,
        selectedIndex: 0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (lineRows.length === 1) {
      // Clear row instead of removing last row
      setLineRows([
        {
          keyId: `row-${Date.now()}`,
          itemId: '',
          itemName: '',
          category: 'GENERAL',
          department,
          quantity: 1,
          unit: 'Pcs',
          unitCost: '',
          trackStock: true,
          isDropdownOpen: false,
          selectedIndex: 0,
        },
      ]);
      return;
    }
    setLineRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, patch: Partial<PurchaseLineRow>) => {
    setLineRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  // Select Item from autocomplete popup
  const handleSelectAutocompleteItem = (index: number, item: InventoryItemOption) => {
    handleRowChange(index, {
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'GENERAL',
      department: (item.department as 'RESTAURANT' | 'HOTEL') || department,
      unit: item.purchaseUnit || item.unit || 'Pcs',
      unitCost: item.costPerUnit || '',
      trackStock: item.trackStock ?? true,
      isDropdownOpen: false,
      selectedIndex: 0,
    });
  };

  // Financial Calculations
  const basicTotal = useMemo(() => {
    return lineRows.reduce((sum, row) => {
      const q = typeof row.quantity === 'number' ? row.quantity : 0;
      const c = typeof row.unitCost === 'number' ? row.unitCost : 0;
      return sum + q * c;
    }, 0);
  }, [lineRows]);

  // Discount % change
  const handleDisPercentChange = (val: string) => {
    setDisPercent(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p >= 0 && basicTotal > 0) {
      const calculatedAmt = (basicTotal * p) / 100;
      setDisAmt(calculatedAmt.toFixed(2));
    } else {
      setDisAmt('');
    }
  };

  // Discount Amt change
  const handleDisAmtChange = (val: string) => {
    setDisAmt(val);
    const a = parseFloat(val);
    if (!isNaN(a) && a >= 0 && basicTotal > 0) {
      const calculatedPercent = (a / basicTotal) * 100;
      setDisPercent(calculatedPercent.toFixed(1));
    } else {
      setDisPercent('');
    }
  };

  // VAT Bill Toggle (13%)
  const handleVatToggle = (checked: boolean) => {
    setIsVatBill(checked);
    if (checked) {
      const discount = parseFloat(disAmt) || 0;
      const taxable = Math.max(0, basicTotal - discount);
      const vat = Math.round(taxable * 0.13 * 100) / 100;
      setTaxAmt(vat.toFixed(2));
    } else {
      setTaxAmt('0');
    }
  };

  // Keep VAT updated if basicTotal or disAmt changes while isVatBill is checked
  useEffect(() => {
    if (isVatBill) {
      const discount = parseFloat(disAmt) || 0;
      const taxable = Math.max(0, basicTotal - discount);
      const vat = Math.round(taxable * 0.13 * 100) / 100;
      setTaxAmt(vat.toFixed(2));
    }
  }, [isVatBill, basicTotal, disAmt]);

  const numericDiscount = parseFloat(disAmt) || 0;
  const numericTax = parseFloat(taxAmt) || 0;

  const grandTotal = useMemo(() => {
    const total = basicTotal - numericDiscount + numericTax;
    return Math.max(0, Math.round(total * 100) / 100);
  }, [basicTotal, numericDiscount, numericTax]);

  // Sync paid amount if not manually changed, or if payment mode changes
  useEffect(() => {
    if (paymentMode === 'Credit') {
      setPaidAmt('0');
    } else if (!isPaidAmtCustomized) {
      setPaidAmt(grandTotal > 0 ? grandTotal.toFixed(0) : '');
    }
  }, [grandTotal, paymentMode, isPaidAmtCustomized]);

  const numericPaid = parseFloat(paidAmt) || 0;
  const balanceDue = Math.max(0, Math.round((grandTotal - numericPaid) * 100) / 100);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseDate) {
      toast.error('Date required', 'Please specify the purchase date.');
      return;
    }

    const validRows = lineRows.filter((r) => r.itemName.trim() !== '');
    if (validRows.length === 0) {
      toast.error('Items required', 'Please add at least one purchase item.');
      return;
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      if (!row.quantity || Number(row.quantity) <= 0) {
        toast.error(`Item #${i + 1} Quantity Invalid`, 'Quantity must be greater than zero.');
        return;
      }
      if (row.unitCost === '' || Number(row.unitCost) < 0) {
        toast.error(`Item #${i + 1} Rate Invalid`, 'Please provide a valid unit rate.');
        return;
      }
    }

    if (paymentMode === 'Credit' && !selectedSupplier) {
      toast.error('Supplier Required', 'Credit purchases require a registered supplier.');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentStatus =
        paymentMode === 'Credit'
          ? 'Unpaid'
          : numericPaid >= grandTotal
          ? 'Paid'
          : numericPaid > 0
          ? 'Partially Paid'
          : 'Unpaid';

      const payload = {
        purchaseType: 'FULL',
        purchaseDate,
        supplierId: selectedSupplier ? selectedSupplier.id : null,
        supplierName: selectedSupplier ? selectedSupplier.name : 'Walk-in Supplier',
        invoiceNumber: supplierInvoiceNumber.trim() || null,
        panVatNumber: supplierPanVatNumber.trim() || null,
        items: validRows.map((r) => {
          const qty = Number(r.quantity) || 0;
          const cost = Number(r.unitCost) || 0;
          return {
            itemId: r.itemId || null,
            itemName: r.itemName.trim(),
            category: r.category || 'GENERAL',
            department: r.department || department,
            quantity: qty,
            unit: r.unit || 'Pcs',
            purchaseUnit: r.unit || 'Pcs',
            unitCost: cost,
            totalCost: Math.round(qty * cost * 100) / 100,
            conversionFactor: 1.0,
            trackStock: r.trackStock ?? true,
          };
        }),
        subtotal: Math.round(basicTotal * 100) / 100,
        discount: Math.round(numericDiscount * 100) / 100,
        tax: Math.round(numericTax * 100) / 100,
        additionalCharges: 0,
        totalAmount: grandTotal,
        paymentMethod: paymentMode,
        paymentStatus,
        notes: remarks.trim() || null,
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
          'Purchase Saved',
          `Purchase recorded. Total: Rs. ${grandTotal.toLocaleString()}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl my-4 flex flex-col max-h-[94vh] overflow-hidden font-sans">
        
        {/* ======================= MODAL HEADER ======================= */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Purchase Entry
              </h2>
              <span className="text-[10px] font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-[2px]">
                PO-{purchaseDate.replace(/-/g, '')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================= TOP SERVICE STRIP ======================= */}
        <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#061D18] border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date */}
            <div className="w-36">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Date
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Supplier Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Supplier
              </label>
              <SupplierSearchDropdown
                value={selectedSupplier ? selectedSupplier.id : null}
                onChange={handleSupplierSelect}
                placeholder="Select supplier..."
                className="text-xs"
              />
            </div>

            {/* Invoice # */}
            <div className="w-32">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Invoice #
              </label>
              <input
                type="text"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                placeholder="Invoice #"
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>

            {/* Department */}
            <div className="w-32">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as 'RESTAURANT' | 'HOTEL')}
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              >
                <option value="RESTAURANT">Restaurant</option>
                <option value="HOTEL">Hotel</option>
              </select>
            </div>

            {/* PAN / VAT # */}
            <div className="w-28">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                PAN / VAT #
              </label>
              <input
                type="text"
                value={supplierPanVatNumber}
                onChange={(e) => setSupplierPanVatNumber(e.target.value)}
                placeholder="PAN / VAT"
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#071F1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>
          </div>
        </div>

        {/* ======================= BILLING FORM BODY ======================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
          
          {/* ===================================================================
              CENTRAL BILLING GRID (MATCHING QUICK SALE POS TABLE)
              =================================================================== */}
          <div
            className={cn(
              'border border-slate-200 dark:border-slate-800 rounded-[3px] bg-white dark:bg-[#071F1A] shadow-2xs transition-all flex-1',
              lineRows.some((r) => r.isDropdownOpen) ? 'min-h-[380px] pb-40 overflow-visible' : 'overflow-visible'
            )}
          >
            <div className="w-full overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#061D18]">
                    <th className="py-2 px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">#</th>
                    <th className="py-2 px-3.5 text-left border-r border-slate-200 dark:border-slate-800">Particular</th>
                    <th className="py-2 px-2.5 text-center w-28 border-r border-slate-200 dark:border-slate-800">Unit</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Rate</th>
                    <th className="py-2 px-3 text-center w-20 border-r border-slate-200 dark:border-slate-800">Qty</th>
                    <th className="py-2 px-3.5 text-right w-28 border-r border-slate-200 dark:border-slate-800">Amount</th>
                    <th className="py-1 px-2 text-center w-24">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 dark:hover:text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer select-none"
                        title="Add row"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#071F1A]">
                  {lineRows.map((row, index) => {
                    const rowQty = typeof row.quantity === 'number' ? row.quantity : 0;
                    const rowCost = typeof row.unitCost === 'number' ? row.unitCost : 0;
                    const rowTotal = Math.round(rowQty * rowCost * 100) / 100;

                    const filteredItems = itemsList.filter((it) => {
                      if (!row.itemName) return true;
                      const q = row.itemName.toLowerCase();
                      return (
                        it.name.toLowerCase().includes(q) ||
                        (it.sku && it.sku.toLowerCase().includes(q)) ||
                        (it.category && it.category.toLowerCase().includes(q))
                      );
                    });

                    return (
                      <tr key={row.keyId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        {/* # */}
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100 dark:border-slate-800/80">
                          {index + 1}
                        </td>

                        {/* Particular (Autocomplete search) */}
                        <td className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className="relative">
                            <input
                              type="text"
                              value={row.itemName}
                              placeholder="search item & Add"
                              onFocus={() => handleRowChange(index, { isDropdownOpen: true })}
                              onChange={(e) => {
                                handleRowChange(index, {
                                  itemName: e.target.value,
                                  itemId: '',
                                  isDropdownOpen: true,
                                  selectedIndex: 0,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (!row.isDropdownOpen) return;
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  handleRowChange(index, {
                                    selectedIndex: Math.min(
                                      filteredItems.length - 1,
                                      (row.selectedIndex || 0) + 1
                                    ),
                                  });
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  handleRowChange(index, {
                                    selectedIndex: Math.max(0, (row.selectedIndex || 0) - 1),
                                  });
                                } else if (e.key === 'Enter') {
                                  if (filteredItems.length > 0 && filteredItems[row.selectedIndex || 0]) {
                                    e.preventDefault();
                                    handleSelectAutocompleteItem(
                                      index,
                                      filteredItems[row.selectedIndex || 0]
                                    );
                                  } else {
                                    handleRowChange(index, { isDropdownOpen: false });
                                  }
                                } else if (e.key === 'Escape') {
                                  handleRowChange(index, { isDropdownOpen: false });
                                }
                              }}
                              className={cn(
                                'w-full px-2 py-1 text-xs bg-white dark:bg-[#061D18] border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-[2px] text-slate-900 dark:text-white font-medium shadow-xs',
                                row.isDropdownOpen && 'z-30'
                              )}
                            />

                            {/* Dropdown under Particular (Teal Header POS Style) */}
                            {row.isDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => handleRowChange(index, { isDropdownOpen: false })}
                                />
                                <div className="absolute left-0 top-full mt-1 z-30 w-[520px] max-w-[90vw] bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-[4px] overflow-hidden animate-in fade-in-0 duration-75">
                                  {/* Teal Header Bar */}
                                  <div className="bg-[#00838F] text-white px-2.5 py-1.5 flex items-center text-[10px] font-bold tracking-wider uppercase select-none border-b border-[#006978]">
                                    <span className="w-48 text-left">ITEM</span>
                                    <span className="w-28 text-left">DEPT / CAT</span>
                                    <span className="w-16 text-center">STOCK</span>
                                    <span className="w-20 text-right">LAST RATE</span>
                                    <span className="w-16 text-center">UNIT</span>
                                  </div>

                                  {/* Items List */}
                                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    {filteredItems.length === 0 ? (
                                      <div className="py-4 text-center text-xs text-slate-500">
                                        No catalog item found. Press Enter to use &quot;{row.itemName}&quot;.
                                      </div>
                                    ) : (
                                      filteredItems.map((item, idx) => {
                                        const isSelected = idx === (row.selectedIndex || 0);
                                        return (
                                          <div
                                            key={item.id}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              handleSelectAutocompleteItem(index, item);
                                            }}
                                            onMouseEnter={() =>
                                              handleRowChange(index, { selectedIndex: idx })
                                            }
                                            className={cn(
                                              'px-2.5 py-1.5 flex items-center cursor-pointer transition-colors',
                                              isSelected
                                                ? 'bg-[#1C3144] text-white'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                            )}
                                          >
                                            <span className="w-48 text-left font-semibold truncate">
                                              {item.name}
                                            </span>
                                            <span className="w-28 text-left text-[11px] opacity-80 truncate">
                                              {item.department || item.category || '-'}
                                            </span>
                                            <span className="w-16 text-center font-mono opacity-80">
                                              {item.currentStock ?? '-'}
                                            </span>
                                            <span className="w-20 text-right font-mono font-medium">
                                              {item.costPerUnit ? item.costPerUnit.toFixed(2) : '-'}
                                            </span>
                                            <span className="w-16 text-center text-[11px] opacity-80">
                                              {item.purchaseUnit || item.unit || 'Pcs'}
                                            </span>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="py-1.5 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <input
                            type="text"
                            list="purchase-unit-list"
                            value={row.unit}
                            onChange={(e) => handleRowChange(index, { unit: e.target.value })}
                            className="w-full px-1.5 py-1 text-center text-xs border border-slate-200 dark:border-slate-700 rounded-[2px] bg-white dark:bg-[#061D18] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Rate */}
                        <td className="py-1.5 px-2.5 border-r border-slate-100 dark:border-slate-800/80">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={row.unitCost}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                              handleRowChange(index, { unitCost: val });
                            }}
                            className="w-full px-2 py-1 text-right text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 rounded-[2px] bg-white dark:bg-[#061D18] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Qty */}
                        <td className="py-1.5 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                              handleRowChange(index, { quantity: val });
                            }}
                            className="w-full px-1.5 py-1 text-center text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 rounded-[2px] bg-white dark:bg-[#061D18] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                          />
                        </td>

                        {/* Amount */}
                        <td className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800/80">
                          <div className="bg-[#E9ECEF] dark:bg-slate-800/80 px-2 py-1 rounded-[2px] font-mono text-xs text-right font-semibold text-slate-800 dark:text-slate-200">
                            {rowTotal.toFixed(2)}
                          </div>
                        </td>

                        {/* Action / Delete row */}
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <datalist id="purchase-unit-list">
            {dynamicUnits.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          {/* ===================================================================
              BOTTOM FINANCIALS & TENDER PANEL (EXACT MATCH TO QUICK SALE)
              =================================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] p-3 bg-white dark:bg-[#071F1A] shadow-2xs space-y-2.5 shrink-0">
            {/* Row 1: Basic Total | Dis % | Dis Amt | Tax/VAT | Grand Total | Paid Amt. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Basic Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={basicTotal.toFixed(2)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-slate-800 dark:text-slate-200 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dis %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder="0"
                  value={disPercent}
                  onChange={(e) => handleDisPercentChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Dis Amt
                </label>
                <input
                  type="number"
                  min={0}
                  max={basicTotal}
                  step="any"
                  placeholder="0"
                  value={disAmt}
                  onChange={(e) => handleDisAmtChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tax / VAT
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={taxAmt}
                  onChange={(e) => setTaxAmt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Grand Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={grandTotal.toFixed(2)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] text-emerald-700 dark:text-emerald-400 cursor-default"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Paid Amt.
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder={grandTotal.toFixed(0)}
                  value={paidAmt}
                  onChange={(e) => {
                    setPaidAmt(e.target.value);
                    setIsPaidAmtCustomized(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>
            </div>

            {/* Row 2: Balance / Due | Payment Mode | Remarks | VAT Bill Checkbox | Action Buttons */}
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div className="w-28">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Balance / Due
                </label>
                <input
                  type="text"
                  readOnly
                  value={balanceDue.toFixed(2)}
                  className={cn(
                    'w-full px-2.5 py-1.5 text-xs font-mono font-medium bg-[#E9ECEF] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[3px] cursor-default',
                    balanceDue > 0
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-slate-800 dark:text-slate-200'
                  )}
                />
              </div>

              <div className="w-36">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaymentMode(val);
                    if (val === 'Credit') {
                      setPaidAmt('0');
                      setIsPaidAmtCustomized(true);
                    } else if (paidAmt === '0') {
                      setPaidAmt(grandTotal > 0 ? grandTotal.toFixed(0) : '');
                      setIsPaidAmtCustomized(false);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#0B3D32] cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank / Online</option>
                  <option value="Credit">Credit</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Remarks / Notes */}
              <div className="w-48 sm:w-56">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional note..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#061D18] border border-slate-300 dark:border-slate-700 rounded-[3px] text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Action Buttons: VAT Bill & Save */}
              <div className="ml-auto flex items-end gap-2.5">
                {/* VAT Bill Checkbox */}
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 pb-1.5 mr-1">
                  <input
                    type="checkbox"
                    checked={isVatBill}
                    onChange={(e) => handleVatToggle(e.target.checked)}
                    className="w-4 h-4 text-[#0B3D32] accent-[#0B3D32] rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span>VAT Bill</span>
                    {isVatBill && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        13%
                      </span>
                    )}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
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
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Purchase'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

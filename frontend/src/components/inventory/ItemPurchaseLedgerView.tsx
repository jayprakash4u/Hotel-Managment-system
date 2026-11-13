'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BackButton } from '@/components/common/BackButton';
import {
  Search,
  Calendar,
  Filter,
  Receipt,
  FileText,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import {
  InventoryItemData,
  ItemPurchaseLedgerSummary,
  ItemPurchaseLedgerTransaction,
  SupplierRecord,
} from '@/lib/types';

interface ItemPurchaseLedgerViewProps {
  initialItemId?: string | null;
  items: InventoryItemData[];
  suppliers: SupplierRecord[];
  onClose?: () => void;
  isModal?: boolean;
}

export const ItemPurchaseLedgerView: React.FC<ItemPurchaseLedgerViewProps> = ({
  initialItemId,
  items,
  suppliers,
  onClose,
  isModal = false,
}) => {
  const toast = useToast();

  // Selected Item
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId || (items[0]?.id || ''));
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<ItemPurchaseLedgerSummary | null>(null);
  const [transactions, setTransactions] = useState<ItemPurchaseLedgerTransaction[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Transaction for View Details Modal
  const [selectedTx, setSelectedTx] = useState<ItemPurchaseLedgerTransaction | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load item-specific purchase ledger
  const loadLedger = async (itemId: string) => {
    if (!itemId) return;
    setLoading(true);
    try {
      if (itemId === 'ALL') {
        const data = await api.getPurchasesLedger();
        setTransactions(data || []);

        const totalQty = (data || []).reduce((acc, t) => acc + (t.convertedStockQuantity || 0), 0);
        const totalAmount = (data || []).reduce((acc, t) => acc + (t.totalPurchaseAmount || 0), 0);
        const dates = (data || []).map((t) => new Date(t.purchaseDate).getTime()).filter((t) => !isNaN(t));

        setSummary({
          itemId: 'ALL',
          itemName: 'All Inventory Items',
          itemCode: 'ALL-ITEMS',
          category: 'All Categories',
          department: 'ALL',
          stockUnit: 'units',
          purchaseUnit: 'units',
          trackStock: true,
          currentStock: items.reduce((acc, i) => acc + (i.trackStock ? i.currentStock : 0), 0),
          totalQuantityPurchased: totalQty,
          totalPurchaseAmount: totalAmount,
          firstPurchaseDate: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null,
          lastPurchaseDate: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null,
          totalTransactions: data.length,
        });
      } else {
        const res = await api.getItemPurchases(itemId);
        setSummary(res.summary);
        setTransactions(res.transactions || []);
      }
    } catch (err: any) {
      console.error('Error loading item purchase ledger:', err);
      toast.error('Ledger Load Failed', err.message || 'Could not fetch item purchase ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItemId) {
      loadLedger(selectedItemId);
    }
  }, [selectedItemId]);

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (supplierFilter !== 'ALL') {
        if (supplierFilter === 'WALK_IN') {
          if (tx.supplierId) return false;
        } else if (tx.supplierId !== supplierFilter) {
          return false;
        }
      }

      if (paymentStatusFilter !== 'ALL') {
        if (tx.paymentStatus.toUpperCase() !== paymentStatusFilter.toUpperCase()) {
          return false;
        }
      }

      if (purchaseTypeFilter !== 'ALL') {
        if (tx.purchaseType.toUpperCase() !== purchaseTypeFilter.toUpperCase()) {
          return false;
        }
      }

      if (startDate) {
        const txDate = new Date(tx.purchaseDate).toISOString().slice(0, 10);
        if (txDate < startDate) return false;
      }

      if (endDate) {
        const txDate = new Date(tx.purchaseDate).toISOString().slice(0, 10);
        if (txDate > endDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPo = tx.purchaseNumber?.toLowerCase().includes(q);
        const matchInv = tx.invoiceNumber?.toLowerCase().includes(q);
        const matchSup = tx.supplierName?.toLowerCase().includes(q);
        const matchItem = tx.itemName?.toLowerCase().includes(q);
        if (!matchPo && !matchInv && !matchSup && !matchItem) return false;
      }

      return true;
    });
  }, [transactions, supplierFilter, paymentStatusFilter, purchaseTypeFilter, startDate, endDate, searchQuery]);

  // Paginated list
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const selectedItemObj = useMemo(() => {
    return items.find((i) => i.id === selectedItemId);
  }, [items, selectedItemId]);

  return (
    <div className={cn('space-y-4 font-sans select-none', isModal ? 'p-1' : '')}>
      {/* 1. Sub-Header & Item Selector */}
      {!isModal && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Item Purchase Ledger
          </span>

          {/* Item Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Item:
            </label>
            <div className="relative min-w-[220px]">
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[30px] px-2.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0B3D32] shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Items (Global Ledger)</option>
                <optgroup label="Inventory Items">
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.sku})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      )}
      {isModal && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Item Purchase Ledger
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          PURCHASE LEDGER SUMMARY CARDS (SPEC SECTION 5)
         ========================================================================= */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Card 1: Item Identity */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Item Details
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={summary.itemName}>
              {summary.itemName}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Code: {summary.itemCode}
            </div>
          </div>

          {/* Card 2: Category & Unit */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Category & Units
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
              {summary.category}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Stock Unit: <strong className="text-slate-700 dark:text-slate-300">{summary.stockUnit}</strong>
            </div>
          </div>

          {/* Card 3: Total Quantity Purchased */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Total Qty Purchased
            </span>
            <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 font-mono mt-1">
              {summary.totalQuantityPurchased.toLocaleString()} {summary.stockUnit}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Current Available: {summary.trackStock ? `${summary.currentStock} ${summary.stockUnit}` : 'Not Tracked'}
            </div>
          </div>

          {/* Card 4: Total Purchase Amount */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Total Purchase Amount
            </span>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              Rs. {summary.totalPurchaseAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cumulative spending
            </div>
          </div>

          {/* Card 5: First Purchase Date */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              First Purchase Date
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">
              {summary.firstPurchaseDate ? new Date(summary.firstPurchaseDate).toLocaleDateString('en-GB') : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Initial transaction
            </div>
          </div>

          {/* Card 6: Last Purchase & Total Tx */}
          <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Last Purchase / Total Tx
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">
              {summary.lastPurchaseDate ? new Date(summary.lastPurchaseDate).toLocaleDateString('en-GB') : '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-bold text-[#00A884]">{summary.totalTransactions}</span> purchases recorded
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FILTER BAR (SPEC SECTION 5)
         ========================================================================= */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs">
          {/* Left: Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO #, Invoice #, Supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#00A884]"
              />
            </div>

            {/* Supplier Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Supplier:</span>
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#00A884] cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Suppliers</option>
                <option value="WALK_IN">Walk-in / Unregistered</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Payment:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#00A884] cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            {/* Purchase Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Type:</span>
              <select
                value={purchaseTypeFilter}
                onChange={(e) => {
                  setPurchaseTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#00A884] cursor-pointer"
              >
                <option value="ALL">All Purchase Types</option>
                <option value="SIMPLE">Simple Purchase</option>
                <option value="FULL">Full Details Purchase</option>
              </select>
            </div>
          </div>

          {/* Right: Date Range & Clear */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] focus:outline-none focus:border-[#00A884]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] focus:outline-none focus:border-[#00A884]"
              />
            </div>

            {(searchQuery || supplierFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || purchaseTypeFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSupplierFilter('ALL');
                  setPaymentStatusFilter('ALL');
                  setPurchaseTypeFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-[3px] bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PURCHASE LEDGER TABLE (SPEC SECTION 5)
         ========================================================================= */}
      <div className="bg-white dark:bg-[#071F1A] rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Purchase Number</th>
                <th className="py-2.5 px-3">Purchase Date</th>
                {selectedItemId === 'ALL' && <th className="py-2.5 px-3">Item Name</th>}
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3 text-right">Purchase Qty</th>
                <th className="py-2.5 px-3">Purchase Unit</th>
                <th className="py-2.5 px-3 text-right">Converted Stock Qty</th>
                <th className="py-2.5 px-3 text-right">Total Purchase Amount</th>
                <th className="py-2.5 px-3 text-center">Purchase Type</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-center">Payment Status</th>
                <th className="py-2.5 px-3">Invoice Number</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={selectedItemId === 'ALL' ? 14 : 13} className="py-8 text-center text-slate-400">
                    Loading item purchase ledger...
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={selectedItemId === 'ALL' ? 14 : 13} className="py-8 text-center text-slate-400">
                    No purchase records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const serialNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={`${tx.purchaseId}-${tx.purchaseNumber}-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. # */}
                      <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {serialNum}
                      </td>

                      {/* 2. Purchase Number */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                        {tx.purchaseNumber}
                      </td>

                      {/* 3. Purchase Date */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {tx.purchaseDate ? new Date(tx.purchaseDate).toLocaleDateString('en-GB') : '—'}
                      </td>

                      {/* Extra: Item Name (only in ALL items view) */}
                      {selectedItemId === 'ALL' && (
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {tx.itemName}
                        </td>
                      )}

                      {/* 4. Supplier Name */}
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {tx.supplierName}
                      </td>

                      {/* 5. Purchase Quantity */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        {tx.purchaseQuantity}
                      </td>

                      {/* 6. Purchase Unit */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">
                        {tx.purchaseUnit}
                      </td>

                      {/* 7. Converted Stock Quantity */}
                      <td className="py-2 px-3 text-right font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                        {tx.convertedStockQuantity} {tx.stockUnit}
                      </td>

                      {/* 8. Total Purchase Amount (STRICT RULE: TOTAL AMOUNT ONLY, NO UNIT COSTS) */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        Rs. {tx.totalPurchaseAmount.toLocaleString()}
                      </td>

                      {/* 9. Purchase Type */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            tx.purchaseType === 'SIMPLE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                          )}
                        >
                          {tx.purchaseType === 'SIMPLE' ? 'Simple' : 'Full Details'}
                        </span>
                      </td>

                      {/* 10. Payment Method */}
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {tx.paymentMethod}
                      </td>

                      {/* 11. Payment Status */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            tx.paymentStatus.toUpperCase() === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : tx.paymentStatus.toUpperCase() === 'PARTIALLY PAID'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          )}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>

                      {/* 12. Invoice Number */}
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {tx.invoiceNumber}
                      </td>

                      {/* 13. Actions */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTx(tx)}
                          className="px-2 py-1 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-2">
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredTransactions.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} records
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INDIVIDUAL PURCHASE DETAILS MODAL (SPEC SECTION 5)
         ========================================================================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#071F1A] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A884] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Purchase Record Details
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    PO #{selectedTx.purchaseNumber} · {selectedTx.purchaseType === 'SIMPLE' ? 'Simple Purchase' : 'Full Details Purchase'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Purchase Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Purchase Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Purchase Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{selectedTx.purchaseNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Purchase Date & Time</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">
                    {new Date(selectedTx.purchaseDate).toLocaleString('en-GB')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Purchase Type</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-400">{selectedTx.purchaseType}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Supplier Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Supplier Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Supplier Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedTx.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Number</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{selectedTx.supplierPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PAN / VAT Number</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{selectedTx.supplierPan || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Address</span>
                  <span className="text-slate-800 dark:text-slate-100 truncate">{selectedTx.supplierAddress || '—'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Item Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                3. Item Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Item Name & Code</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTx.itemName || summary?.itemName}</span>
                  <span className="block text-[10px] font-mono text-slate-400">{selectedTx.itemCode || summary?.itemCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Purchase Qty & Unit</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {selectedTx.purchaseQuantity} {selectedTx.purchaseUnit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Conversion Factor</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">
                    1 {selectedTx.purchaseUnit} = {selectedTx.conversionFactor} {selectedTx.stockUnit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Converted Stock Qty</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    {selectedTx.convertedStockQuantity} {selectedTx.stockUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Financial Information (NO UNIT COSTS SHOWN) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                4. Financial Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Purchase Amount</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    Rs. {selectedTx.totalPurchaseAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Method</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{selectedTx.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedTx.paymentStatus}</span>
                </div>
                {selectedTx.subtotal !== undefined && selectedTx.subtotal > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Subtotal</span>
                    <span className="font-mono text-slate-700">Rs. {selectedTx.subtotal.toLocaleString()}</span>
                  </div>
                )}
                {selectedTx.discount !== undefined && selectedTx.discount > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Discount</span>
                    <span className="font-mono text-amber-700">Rs. {selectedTx.discount.toLocaleString()}</span>
                  </div>
                )}
                {selectedTx.tax !== undefined && selectedTx.tax > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tax</span>
                    <span className="font-mono text-slate-700">Rs. {selectedTx.tax.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Documents and Other Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                5. Documents and Audit Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Supplier Invoice Number</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{selectedTx.invoiceNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Created By</span>
                  <span className="text-slate-800 dark:text-slate-100">{selectedTx.createdBy || 'Admin'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Record Status</span>
                  <span className="font-semibold text-emerald-600 uppercase">{selectedTx.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Notes</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{selectedTx.notes || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


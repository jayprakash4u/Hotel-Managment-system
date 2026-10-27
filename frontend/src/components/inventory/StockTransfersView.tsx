'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Hotel,
  UtensilsCrossed,
  Info,
} from 'lucide-react';
import { InventoryItem } from './DepartmentInventoryView';
import { useRole } from '@/context/RoleContext';

export interface StockTransferRecord {
  id: string;
  transferNumber: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  sourceDepartment: string;
  destinationDepartment: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

interface StockTransfersViewProps {
  transfers: StockTransferRecord[];
  items: InventoryItem[];
  isTransfersEnabled: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export const StockTransfersView: React.FC<StockTransfersViewProps> = ({
  transfers,
  items,
  isTransfersEnabled,
  loading,
  onRefresh,
}) => {
  const toast = useToast();
  const { user } = useRole();
  const [searchQuery, setSearchQuery] = useState('');

  // Transfer Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceDept, setSourceDept] = useState<'HOTEL' | 'RESTAURANT'>('HOTEL');
  const [destDept, setDestDept] = useState<'HOTEL' | 'RESTAURANT'>('RESTAURANT');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [transferQty, setTransferQty] = useState<string>('1');
  const [reason, setReason] = useState('');

  // Source item selection
  const sourceItems = items.filter((i) => i.department.toUpperCase() === sourceDept.toUpperCase());
  const selectedSourceItem = sourceItems.find((i) => i.id === selectedItemId);

  const handleOpenTransferModal = () => {
    setError(null);
    const initialSrc = 'HOTEL';
    const initialDest = 'RESTAURANT';
    const firstItem = items.find((i) => i.department === initialSrc);
    setSourceDept(initialSrc);
    setDestDept(initialDest);
    setSelectedItemId(firstItem?.id || '');
    setTransferQty('1');
    setReason('');
    setIsTransferModalOpen(true);
  };

  const handleSourceDeptChange = (newSrc: 'HOTEL' | 'RESTAURANT') => {
    const newDest = newSrc === 'HOTEL' ? 'RESTAURANT' : 'HOTEL';
    setSourceDept(newSrc);
    setDestDept(newDest);
    const firstItem = items.find((i) => i.department === newSrc);
    setSelectedItemId(firstItem?.id || '');
    setTransferQty('1');
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedItemId || !selectedSourceItem) {
      setError('Please choose an item from the source department.');
      return;
    }

    const qty = parseInt(transferQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Transfer quantity must be at least 1.');
      return;
    }

    if (qty > selectedSourceItem.currentStock) {
      setError(
        `Insufficient stock in ${sourceDept}. Available: ${selectedSourceItem.currentStock} ${selectedSourceItem.unit}, Requested: ${qty}.`
      );
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `TRF-${selectedItemId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDepartment: sourceDept,
          destinationDepartment: destDept,
          sourceItemId: selectedItemId,
          quantity: qty,
          reason: reason.trim() || `Inter-department transfer: ${sourceDept} -> ${destDept}`,
          performedBy: user?.name || 'Authorized Staff',
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to complete stock transfer');
      }

      toast.celebrate(
        'Stock Transferred!',
        json.message || `Transferred ${qty} ${selectedSourceItem.unit} from ${sourceDept} to ${destDept}.`
      );

      setIsTransferModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while transferring stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transfers
  const filteredTransfers = transfers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.transferNumber.toLowerCase().includes(q) ||
      t.itemName.toLowerCase().includes(q) ||
      (t.reason && t.reason.toLowerCase().includes(q)) ||
      t.performedBy.toLowerCase().includes(q)
    );
  });

  // If business has only one department enabled, show clear notice
  if (!isTransfersEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Stock Transfers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inter-department stock transfers between Hotel and Restaurant
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Stock Transfers Require Multi-Department Business Setup
          </div>
          <p className="leading-relaxed">
            Stock transfers are designed for properties that have <strong>both Hotel and Restaurant</strong> modules active. Currently, your business setup is configured for a single operational department.
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            To enable inter-department stock transfers, go to <strong>Administration &gt; Business Setup</strong> and enable the combined &ldquo;Hotel &amp; Restaurant&rdquo; configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Atomic stock reallocation between Hotel Inventory and Restaurant Inventory
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenTransferModal}
            leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
          >
            + Transfer Stock
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Recorded Transfers
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {transfers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Inter-department inventory movements</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Hotel to Restaurant
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {transfers.filter((t) => t.sourceDepartment === 'HOTEL').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Transfers originating from Hotel store</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-[#071F1A] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Restaurant to Hotel
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
            {transfers.filter((t) => t.sourceDepartment === 'RESTAURANT').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Transfers originating from Restaurant</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#071F1A] dark:border-slate-800 shadow-2xs">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Search transfer #, item name, note..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#071F1A] shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-900/60">
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Reference #</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Transfer Date</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Item Transferred</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Quantity</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Source</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Destination</TableHead>
              <TableHead className="font-bold text-xs text-slate-900 dark:text-white">Authorized By</TableHead>
              <TableHead className="text-right font-bold text-xs text-slate-900 dark:text-white">Note / Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B3D32] dark:text-emerald-400 mb-2" />
                  Loading transfer ledger...
                </TableCell>
              </TableRow>
            ) : filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <ArrowLeftRight className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No stock transfers found</p>
                    <p className="text-[11px] text-slate-400">
                      {searchQuery
                        ? 'No transfers match your search query.'
                        : 'No inter-department stock transfers recorded yet.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((t) => (
                <TableRow key={t.id} className="text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <TableCell className="font-semibold text-slate-900 dark:text-white font-mono">
                    {t.transferNumber}
                  </TableCell>

                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {formatDateTime(t.createdAt)}
                  </TableCell>

                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    <div>{t.itemName}</div>
                    {t.sku && <div className="text-[10px] text-slate-400 font-mono">{t.sku}</div>}
                  </TableCell>

                  <TableCell className="font-mono font-bold text-slate-900 dark:text-white">
                    {t.quantity} <span className="text-[10px] font-normal text-slate-500 uppercase">{t.unit}</span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                        t.sourceDepartment === 'HOTEL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}
                    >
                      {t.sourceDepartment}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                        t.destinationDepartment === 'HOTEL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      )}
                    >
                      {t.destinationDepartment}
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {t.performedBy}
                  </TableCell>

                  <TableCell className="text-right text-slate-500 max-w-xs truncate" title={t.reason}>
                    {t.reason || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EXECUTE ATOMIC STOCK TRANSFER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Execute Inter-Department Stock Transfer"
        description="Transfer stock atomically: balance is deducted from source and credited to destination"
        size="md"
      >
        <form onSubmit={handleSubmitTransfer} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Department Direction */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Source Department *"
              required
              value={sourceDept}
              onChange={(e) => handleSourceDeptChange(e.target.value as any)}
            >
              <option value="HOTEL">Hotel Inventory</option>
              <option value="RESTAURANT">Restaurant Inventory</option>
            </Select>

            <Select label="Destination Department *" disabled value={destDept}>
              <option value="HOTEL">Hotel Inventory</option>
              <option value="RESTAURANT">Restaurant Inventory</option>
            </Select>
          </div>

          {/* Source Item */}
          <div>
            <Select
              label="Item to Transfer *"
              required
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">-- Choose item in {sourceDept} --</option>
              {sourceItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) — Available: {item.currentStock} {item.unit}
                </option>
              ))}
            </Select>
          </div>

          {/* Selected Item Stock Info */}
          {selectedSourceItem && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Available balance in {sourceDept}:
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {selectedSourceItem.currentStock} {selectedSourceItem.unit}
              </span>
            </div>
          )}

          {/* Quantity */}
          <Input
            label="Quantity to Transfer *"
            type="number"
            min={1}
            max={selectedSourceItem?.currentStock || 9999}
            required
            value={transferQty}
            onChange={(e) => setTransferQty(e.target.value)}
          />

          {/* Reason / Reference */}
          <Input
            label="Reason / Authorization Note *"
            required
            placeholder="e.g. Restocking Presidential Suite minibar from restaurant cellar"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Transfer Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

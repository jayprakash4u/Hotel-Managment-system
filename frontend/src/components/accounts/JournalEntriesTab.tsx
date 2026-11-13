'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit2,
  RotateCcw,
  BookOpen,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { JournalEntryItem, AccountItem, JournalEntriesSummary } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export default function JournalEntriesTab() {
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<JournalEntriesSummary>({
    totalEntries: 0,
    postedEntries: 0,
    draftEntries: 0,
    reversedEntries: 0,
    periodDebit: 0,
    periodCredit: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [entryTypeFilter, setEntryTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Available accounts for dropdown in new entry
  const [availableAccounts, setAvailableAccounts] = useState<AccountItem[]>([]);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryItem | null>(null);

  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversalTarget, setReversalTarget] = useState<JournalEntryItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Journal Entry Form State
  const [entryNumber, setEntryNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState('GENERAL');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [sourceModule, setSourceModule] = useState('MANUAL');
  const [lines, setLines] = useState<Array<{ accountId: string; lineDescription: string; debit: number; credit: number }>>([
    { accountId: '', lineDescription: '', debit: 0, credit: 0 },
    { accountId: '', lineDescription: '', debit: 0, credit: 0 },
  ]);

  const loadAccounts = async () => {
    try {
      const res = await api.getChartOfAccounts({ activeOnly: true });
      setAvailableAccounts(res.accounts || []);
    } catch (err: any) {
      console.error('Failed to load accounts for journal entry', err);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await api.getJournalEntries({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        entryType: entryTypeFilter === 'ALL' ? undefined : entryTypeFilter,
        search: searchQuery || undefined,
        page,
        pageSize,
      });
      setEntries(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      error(err?.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [page, pageSize, statusFilter, entryTypeFilter, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEntries();
  };

  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleOpenNewEntry = async () => {
    setIsEditingDraft(false);
    setEditingEntryId(null);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryType('GENERAL');
    setReference('');
    setDescription('');
    setSourceModule('MANUAL');
    setLines([
      { accountId: '', lineDescription: '', debit: 0, credit: 0 },
      { accountId: '', lineDescription: '', debit: 0, credit: 0 },
    ]);

    try {
      const nextRes = await api.getNextJournalNumber();
      setEntryNumber(nextRes.nextNumber);
    } catch (err) {
      setEntryNumber('');
    }

    setIsEntryModalOpen(true);
  };

  const handleOpenEditDraft = (je: JournalEntryItem) => {
    if (je.status !== 'DRAFT') {
      error('Only draft entries can be edited.');
      return;
    }
    setIsEditingDraft(true);
    setEditingEntryId(je.id);
    setEntryNumber(je.entryNumber);
    setEntryDate(je.entryDate ? je.entryDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEntryType(je.entryType || 'GENERAL');
    setReference(je.reference || '');
    setDescription(je.description || '');
    setSourceModule(je.sourceModule || 'MANUAL');
    if (je.lines && je.lines.length > 0) {
      setLines(
        je.lines.map((l) => ({
          accountId: l.accountId,
          lineDescription: l.lineDescription || '',
          debit: l.debit || 0,
          credit: l.credit || 0,
        }))
      );
    } else {
      setLines([
        { accountId: '', lineDescription: '', debit: 0, credit: 0 },
        { accountId: '', lineDescription: '', debit: 0, credit: 0 },
      ]);
    }
    setIsEntryModalOpen(true);
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', lineDescription: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      error('A journal entry must have at least 2 lines (double-entry).');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    if (field === 'debit') {
      const num = Math.max(0, parseFloat(value) || 0);
      updated[index].debit = num;
      if (num > 0) updated[index].credit = 0; // Debit & Credit are mutually exclusive on same line
    } else if (field === 'credit') {
      const num = Math.max(0, parseFloat(value) || 0);
      updated[index].credit = num;
      if (num > 0) updated[index].debit = 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setLines(updated);
  };

  // Double-entry calculation helpers
  const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveEntry = async (targetStatus: 'DRAFT' | 'POSTED') => {
    if (!description.trim()) {
      error('Description / Narration is required.');
      return;
    }

    if (targetStatus === 'POSTED') {
      if (!isBalanced) {
        error(
          `Voucher is not balanced! Total Debit: Rs. ${totalDebit.toFixed(2)}, Total Credit: Rs. ${totalCredit.toFixed(2)}, Difference: Rs. ${difference.toFixed(2)}`
        );
        return;
      }

      const invalidLine = lines.find((l) => !l.accountId || (l.debit === 0 && l.credit === 0));
      if (invalidLine) {
        error('Every row must have an active ledger account and a non-zero debit or credit amount.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        entryNumber: entryNumber.trim() || undefined,
        entryDate,
        entryType,
        reference: reference.trim() || undefined,
        description: description.trim(),
        status: targetStatus,
        sourceModule,
        lines: lines
          .filter((l) => l.accountId && (l.debit > 0 || l.credit > 0 || targetStatus === 'DRAFT'))
          .map((l) => ({
            accountId: l.accountId,
            lineDescription: l.lineDescription.trim() || undefined,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
      };

      if (isEditingDraft && editingEntryId) {
        await api.updateJournalEntry(editingEntryId, payload);
        success(targetStatus === 'POSTED' ? 'Draft voucher posted successfully!' : 'Draft voucher updated successfully.');
      } else {
        await api.createJournalEntry(payload);
        success(targetStatus === 'POSTED' ? 'Journal Voucher posted successfully!' : 'Journal Voucher saved as draft.');
      }

      setIsEntryModalOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err?.message || 'Failed to save journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostDraftQuick = async (je: JournalEntryItem) => {
    if (je.status !== 'DRAFT') return;
    try {
      await api.postJournalEntry(je.id);
      success(`Journal Voucher ${je.entryNumber} posted successfully!`);
      if (isViewModalOpen) setIsViewModalOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err?.message || 'Failed to post draft voucher');
    }
  };

  const handleDeleteDraft = async (je: JournalEntryItem) => {
    if (je.status !== 'DRAFT') {
      error('Only draft entries can be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete draft voucher ${je.entryNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteJournalEntry(je.id);
      success(`Draft voucher ${je.entryNumber} deleted successfully.`);
      if (isViewModalOpen) setIsViewModalOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err?.message || 'Failed to delete draft voucher');
    }
  };

  const handleOpenReverseModal = (je: JournalEntryItem) => {
    if (je.status !== 'POSTED') {
      error('Only posted journal entries can be reversed.');
      return;
    }
    setReversalTarget(je);
    setReversalReason('');
    setIsReverseModalOpen(true);
  };

  const handleConfirmReversal = async () => {
    if (!reversalTarget) return;
    try {
      setReversing(true);
      await api.reverseJournalEntry(reversalTarget.id, { reason: reversalReason.trim() || undefined });
      success(`Journal Voucher ${reversalTarget.entryNumber} reversed successfully.`);
      setIsReverseModalOpen(false);
      if (isViewModalOpen) setIsViewModalOpen(false);
      loadEntries();
    } catch (err: any) {
      error(err?.message || 'Failed to reverse journal entry');
    } finally {
      setReversing(false);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      error('No journal entries to export');
      return;
    }
    const headers = ['Voucher No', 'Date', 'Type', 'Description', 'Reference', 'Debit', 'Credit', 'Status'];
    const rows = entries.map((e) => [
      `"${e.entryNumber}"`,
      `"${new Date(e.entryDate).toISOString().split('T')[0]}"`,
      `"${e.entryType}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.reference || ''}"`,
      e.totalDebit.toFixed(2),
      e.totalCredit.toFixed(2),
      `"${e.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Journal_Entries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Journal entries exported to CSV');
  };

  const handlePrintVoucher = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Journal Entries
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadEntries}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh entries"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Journal Entry</span>
          </button>
        </div>
      </div>

      {/* 3. Filter & Controls Toolbar */}
      <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {(['ALL', 'POSTED', 'DRAFT', 'REVERSED'] as const).map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border',
                    isSelected
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750'
                  )}
                >
                  {st === 'ALL' ? 'All' : st === 'POSTED' ? 'Posted' : st === 'DRAFT' ? 'Draft' : 'Reversed'}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Entry Type, Date Range, Search & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Entry Type Filter */}
            <select
              value={entryTypeFilter}
              onChange={(e) => {
                setEntryTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-[#0B3D32] cursor-pointer"
              title="Filter by Entry Type"
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL">General</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="OPENING">Opening</option>
              <option value="CLOSING">Closing</option>
            </select>

            {/* Inline Date Filter */}
            <div className="flex items-center gap-1.5 h-[28px] px-2 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                title="End Date"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  title="Clear Date Filter"
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Bar with Clear Button */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JV#, ref, memo..."
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 text-xs font-medium text-slate-800 dark:text-white shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={loadEntries}
              className="inline-flex items-center justify-center w-7 h-7 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Refresh journal entries"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Journal Entries Table */}
      <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                <th className="py-3 px-3 w-28 border-r border-slate-200/70 dark:border-slate-800">JOURNAL NO.</th>
                <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">DATE</th>
                <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">TYPE</th>
                <th className="py-3 px-3 border-r border-slate-200/70 dark:border-slate-800">DESCRIPTION</th>
                <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">REFERENCE</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">TOTAL DEBIT</th>
                <th className="py-3 px-3 text-right w-28 border-r border-slate-200/70 dark:border-slate-800">TOTAL CREDIT</th>
                <th className="py-3 px-3 w-24 text-center border-r border-slate-200/70 dark:border-slate-800">STATUS</th>
                <th className="py-3 px-3 w-24 border-r border-slate-200/70 dark:border-slate-800">CREATED BY</th>
                <th className="py-3 px-3 w-28 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0B3D32] dark:text-emerald-400" />
                    <span>Loading Journal Entries...</span>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No journal vouchers found</p>
                    
                  </td>
                </tr>
              ) : (
                entries.map((je, idx) => (
                  <tr
                    key={je.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(je);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline">
                        {je.entryNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      {new Date(je.entryDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60">
                      <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {je.entryType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800/60">
                      <div className="line-clamp-1">{je.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                      {je.reference || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-900 dark:text-sky-300 border-r border-slate-100 dark:border-slate-800/60">
                      Rs. {formatCurrency(je.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300 border-r border-slate-100 dark:border-slate-800/60">
                      Rs. {formatCurrency(je.totalCredit)}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800/60">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-bold border uppercase tracking-wider',
                          je.status === 'POSTED' &&
                            'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                          je.status === 'DRAFT' &&
                            'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                          je.status === 'REVERSED' &&
                            'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                          je.status === 'VOID' &&
                            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        )}
                      >
                        {je.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px] truncate border-r border-slate-100 dark:border-slate-800/60">
                      {je.createdBy || 'Admin'}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {/* View Action */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEntry(je);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1 rounded-[3px] text-slate-500 hover:text-[#0B3D32] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                          title="View Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Actions for DRAFT */}
                        {je.status === 'DRAFT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditDraft(je)}
                              className="p-1 rounded-[3px] text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800 shadow-2xs"
                              title="Edit Draft Voucher"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePostDraftQuick(je)}
                              className="p-1 rounded-[3px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                              title="Post Draft Voucher"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(je)}
                              className="p-1 rounded-[3px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 shadow-2xs"
                              title="Delete Draft Voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Actions for POSTED */}
                        {je.status === 'POSTED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenReverseModal(je)}
                            className="p-1 rounded-[3px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                            title="Reverse Voucher (Contra Entry)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DataTables Pagination Footer (Hotel & Restaurant Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 select-none">
        {/* Left side: Show Entries per page + Entries summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 font-medium text-[11px]">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
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
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(page * pageSize, totalCount)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> entries
          </div>
        </div>

        {/* Right side: Prev / Page Numbers / Next (Permanently Visible) */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {Array.from({ length: Math.max(1, totalPages) }).map((_, idx) => {
            const pageNum = idx + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'min-w-[28px] h-7 px-2 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                    isCurrent
                      ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === page - 2 || pageNum === page + 2) {
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
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL: CREATE / EDIT JOURNAL ENTRY
          ========================================================================= */}
      {isEntryModalOpen && (
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={isEditingDraft ? `Edit Draft Journal Voucher: ${entryNumber}` : 'Create New Journal Voucher'}
          className="max-w-4xl"
        >
          <div className="space-y-4 pt-1">
            {/* Header Form Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Number
                </label>
                <input
                  type="text"
                  value={entryNumber}
                  onChange={(e) => setEntryNumber(e.target.value)}
                  placeholder="Auto (e.g. JV-2026-0001)"
                  className="w-full px-3 py-1.5 font-mono text-xs rounded-[3px] bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-[3px] text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Entry Type
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-[3px] text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
                >
                  <option value="GENERAL">General Journal</option>
                  <option value="ADJUSTMENT">Adjustment Entry</option>
                  <option value="OPENING">Opening Entry</option>
                  <option value="CLOSING">Closing Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Bill #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. INV-9042, CHQ-4401"
                  className="w-full px-3 py-1.5 font-mono text-xs rounded-[3px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
                />
              </div>
            </div>

            {/* Description / Narration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Narration <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Settlement of monthly kitchen fuel bill via Bank Account"
                className="w-full px-3 py-1.5 text-xs rounded-[3px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            {/* Dynamic Lines Table */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                  <span>Debit &amp; Credit Ledger Lines</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-8 text-center border-r border-slate-200/70 dark:border-slate-800">#</th>
                      <th className="py-2.5 px-3 min-w-[240px] border-r border-slate-200/70 dark:border-slate-800">
                        Account (Chart of Accounts)
                      </th>
                      <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200/70 dark:border-slate-800">
                        Line Memo / Narration
                      </th>
                      <th className="py-2.5 px-3 w-36 text-right border-r border-slate-200/70 dark:border-slate-800">
                        Debit (Rs.)
                      </th>
                      <th className="py-2.5 px-3 w-36 text-right border-r border-slate-200/70 dark:border-slate-800">
                        Credit (Rs.)
                      </th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 dark:border-slate-800/60">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-100 dark:border-slate-800/60">
                          <select
                            required
                            value={l.accountId}
                            onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                            className="w-full px-2 py-1 rounded-[3px] text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                          >
                            <option value="">-- Select Active Posting Account --</option>
                            {availableAccounts
                              .filter((a) => !a.isGroup && a.isActive)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  [{a.accountCode}] {a.accountName} ({a.accountType})
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-100 dark:border-slate-800/60">
                          <input
                            type="text"
                            value={l.lineDescription}
                            onChange={(e) => handleLineChange(idx, 'lineDescription', e.target.value)}
                            placeholder="Optional line memo"
                            className="w-full px-2 py-1 rounded-[3px] text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-100 dark:border-slate-800/60">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.debit || ''}
                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 font-mono text-xs text-right font-bold rounded-[3px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-900 dark:text-sky-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-100 dark:border-slate-800/60">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.credit || ''}
                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 font-mono text-xs text-right font-bold rounded-[3px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-900 dark:text-amber-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length <= 2}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 font-mono font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-600 dark:text-slate-400">
                        Totals:
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-900 dark:text-sky-300 font-extrabold border-r border-slate-200 dark:border-slate-800">
                        Rs. {formatCurrency(totalDebit)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-900 dark:text-amber-300 font-extrabold border-r border-slate-200 dark:border-slate-800">
                        Rs. {formatCurrency(totalCredit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Balancing Verification Status Banner */}
            <div
              className={cn(
                'p-3 rounded-[3px] border flex items-center justify-between text-xs',
                isBalanced
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              )}
            >
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {isBalanced ? 'Balanced: Total Debits equal Total Credits' : 'Out of Balance'}
                  </span>
                  {!isBalanced && (
                    <span className="block text-[11px] mt-0.5">
                      Debits must equal Credits to post to General Ledger. Difference:{' '}
                      <strong className="font-mono">Rs. {difference.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <span className="font-mono font-black text-sm">
                Rs. {formatCurrency(totalDebit)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveEntry('DRAFT')}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={!isBalanced || submitting}
                  onClick={() => handleSaveEntry('POSTED')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#083027] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-40 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Post Entry</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: REVERSE JOURNAL VOUCHER
          ========================================================================= */}
      {isReverseModalOpen && reversalTarget && (
        <Modal
          isOpen={isReverseModalOpen}
          onClose={() => setIsReverseModalOpen(false)}
          title={`Reverse Journal Voucher: ${reversalTarget.entryNumber}`}
          className="max-w-md"
        >
          <div className="space-y-3.5 pt-1 text-xs">
            <div className="p-3 rounded-[3px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold">Permanent Accounting Reversal</span>
                  <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    A contra reversal entry will be posted with swapped Debits and Credits, offsetting all ledger balances. The original voucher {reversalTarget.entryNumber} will be marked as REVERSED to maintain an indelible audit trail.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Reversal <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Inadvertent double payment, wrong expense ledger selected, or supplier credit adjustment"
                className="w-full px-3 py-2 rounded-[3px] text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0B3D32]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReverseModalOpen(false)}
                className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reversing}
                onClick={handleConfirmReversal}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {reversing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm &amp; Reverse Voucher</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: VIEW / PRINT JOURNAL VOUCHER
          ========================================================================= */}
      {isViewModalOpen && selectedEntry && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Journal Voucher: ${selectedEntry.entryNumber}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-1">
            {/* Header info */}
            <div className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Voucher Number</span>
                  <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                    {selectedEntry.entryNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {new Date(selectedEntry.entryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10.5px]">Type:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEntry.entryType || 'GENERAL'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Status:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEntry.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Reference:</span>{' '}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedEntry.reference || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10.5px]">Created By:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEntry.createdBy || 'Staff'}
                  </span>
                </div>
              </div>

              {selectedEntry.reversedFromId && (
                <div className="p-2 rounded-[3px] bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Contra Reversal Voucher of entry: {selectedEntry.reversedFromId}
                </div>
              )}

              <div>
                <span className="text-slate-400 text-[10.5px]">Description / Narration:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedEntry.description}
                </p>
              </div>
            </div>

            {/* Lines Table */}
            <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Account</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800">Memo</th>
                    <th className="py-2.5 px-3 text-right w-32 border-r border-slate-200/70 dark:border-slate-800">Debit (Rs.)</th>
                    <th className="py-2.5 px-3 text-right w-32">Credit (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {selectedEntry.lines?.map((line, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800/60">
                        <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-400">
                          {line.accountCode}
                        </span>{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          — {line.accountName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                        {line.lineDescription || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-900 dark:text-sky-300 border-r border-slate-100 dark:border-slate-800/60">
                        {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300">
                        {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 font-mono font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      Total:
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-900 dark:text-sky-300 font-extrabold border-r border-slate-200 dark:border-slate-800">
                      Rs. {formatCurrency(selectedEntry.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-900 dark:text-amber-300 font-extrabold">
                      Rs. {formatCurrency(selectedEntry.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Printable Signatures Box (Visible when printing or viewing) */}
            <div className="hidden print:grid grid-cols-3 gap-6 pt-10 text-center text-xs">
              <div className="border-t border-slate-400 pt-1">
                <span className="font-bold">Prepared By</span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span className="font-bold">Verified By</span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <span className="font-bold">Approved / Manager</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                {selectedEntry.status === 'POSTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenReverseModal(selectedEntry);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reverse Voucher</span>
                  </button>
                )}

                {selectedEntry.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleOpenEditDraft(selectedEntry);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostDraftQuick(selectedEntry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Post Now</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold transition-colors cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wallet,
  ShieldCheck,
  FileText,
  ExternalLink,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Info,
  X,
} from 'lucide-react';
import { balanceSheetApi } from '@/lib/api';
import {
  BalanceSheetComparisonMode,
  BalanceSheetViewMode,
  BalanceSheetStatementResponse,
  BalanceSheetLineItem,
  BalanceSheetSubGroup,
  BalanceSheetDrilldownResponse,
  DiscrepancyDiagnosticResponse,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function BalanceSheetTab() {
  // Filters & State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [asOfDate, setAsOfDate] = useState<string>(todayStr);
  const [comparisonMode, setComparisonMode] = useState<BalanceSheetComparisonMode>('NONE');
  const [compareAsOfDate, setCompareAsOfDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<BalanceSheetViewMode>('DETAILED');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<BalanceSheetStatementResponse | null>(null);

  // Expand / collapse section state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'current-assets': true,
    'fixed-assets': true,
    'accum-deprec': false,
    'current-liabilities': true,
    'non-current-liabilities': true,
    'equity': true,
  });

  // Drilldown modal state
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);
  const [drilldownData, setDrilldownData] = useState<BalanceSheetDrilldownResponse | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Investigation modal state
  const [investigateLoading, setInvestigateLoading] = useState<boolean>(false);
  const [investigationData, setInvestigationData] = useState<DiscrepancyDiagnosticResponse | null>(null);
  const [isInvestigateOpen, setIsInvestigateOpen] = useState<boolean>(false);

  // Fetch statement data
  const loadStatement = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await balanceSheetApi.getStatement({
        asOfDate,
        comparisonMode,
        compareAsOfDate: comparisonMode === 'CUSTOM' ? compareAsOfDate : undefined,
        viewMode,
      });

      if (res) {
        setStatement(res);
      } else {
        setError('Failed to load Balance Sheet. Invalid response.');
      }
    } catch (err: any) {
      console.error('Failed to load balance sheet statement:', err);
      setError(err?.message || 'Failed to generate Balance Sheet statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [asOfDate, comparisonMode, compareAsOfDate, viewMode]);

  // Quick Date Preset Handlers
  const handleQuickPreset = (preset: 'today' | 'month-end' | 'prev-month-end' | 'quarter-end' | 'year-end') => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-based

    let targetDate = new Date();

    if (preset === 'today') {
      targetDate = new Date();
    } else if (preset === 'month-end') {
      // Last day of current month
      targetDate = new Date(year, month + 1, 0);
    } else if (preset === 'prev-month-end') {
      // Last day of previous month
      targetDate = new Date(year, month, 0);
    } else if (preset === 'quarter-end') {
      // Last day of current calendar quarter
      const currentQuarter = Math.floor(month / 3);
      const quarterEndMonth = (currentQuarter + 1) * 3; // 3, 6, 9, 12
      targetDate = new Date(year, quarterEndMonth, 0);
    } else if (preset === 'year-end') {
      // Dec 31 of current year
      targetDate = new Date(year, 12, 0);
    }

    const iso = targetDate.toISOString().split('T')[0];
    setAsOfDate(iso);
  };

  // Toggle collapse state
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(expandedSections).forEach((k) => (next[k] = true));
    if (statement) {
      statement.assets.currentAssetGroups.forEach((g) => (next[g.groupKey] = true));
      statement.liabilities.currentLiabilityGroups.forEach((g) => (next[g.groupKey] = true));
      statement.liabilities.nonCurrentLiabilityGroups.forEach((g) => (next[g.groupKey] = true));
    }
    setExpandedSections(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(expandedSections).forEach((k) => (next[k] = false));
    if (statement) {
      statement.assets.currentAssetGroups.forEach((g) => (next[g.groupKey] = false));
      statement.liabilities.currentLiabilityGroups.forEach((g) => (next[g.groupKey] = false));
      statement.liabilities.nonCurrentLiabilityGroups.forEach((g) => (next[g.groupKey] = false));
    }
    setExpandedSections(next);
  };

  // Open drilldown for an account
  const handleOpenDrilldown = async (accountId: string) => {
    try {
      setDrilldownLoading(true);
      setIsDrilldownOpen(true);
      const res = await balanceSheetApi.getAccountDrilldown(accountId, asOfDate);
      if (res) {
        setDrilldownData(res);
      }
    } catch (err: any) {
      console.error('Failed to load drilldown:', err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Open investigation
  const handleOpenInvestigation = async () => {
    try {
      setInvestigateLoading(true);
      setIsInvestigateOpen(true);
      const res = await balanceSheetApi.investigateDiscrepancy(asOfDate);
      if (res) {
        setInvestigationData(res);
      }
    } catch (err: any) {
      console.error('Failed to run discrepancy investigation:', err);
    } finally {
      setInvestigateLoading(false);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!statement) return;

    const rows: string[][] = [
      ['EVEREST FAMILY RESTAURANT - STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)'],
      [`As of Date: ${statement.formattedAsOfDate}`],
      [`Currency: Nepalese Rupee (NPR)`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Classification / Account Code', 'Account Name', 'Subcategory', 'Current Balance (NPR)', 'Compare Balance (NPR)', 'Variance (NPR)', 'Variance %'],
    ];

    const addLine = (i: BalanceSheetLineItem, indent = '  ') => {
      rows.push([
        `${indent}${i.accountCode}`,
        i.accountName,
        i.subCategory,
        (i.isContra ? -i.currentBalance : i.currentBalance).toFixed(2),
        (i.isContra ? -i.compareBalance : i.compareBalance).toFixed(2),
        i.variance.toFixed(2),
        `${i.variancePercentage}%`,
      ]);
    };

    // Assets
    rows.push(['ASSETS']);
    rows.push(['Current Assets']);
    statement.assets.currentAssetGroups.forEach((g) => {
      rows.push([`  ${g.title}`, '', '', g.currentTotal.toFixed(2), g.compareTotal.toFixed(2), g.variance.toFixed(2), `${g.variancePercentage}%`]);
      g.items.forEach((item) => addLine(item, '    '));
    });
    rows.push(['TOTAL CURRENT ASSETS', '', '', statement.assets.totalCurrentAssets.toFixed(2), statement.assets.compareTotalCurrentAssets.toFixed(2)]);

    rows.push([]);
    rows.push(['Non-Current Assets (Fixed Assets Gross Cost)']);
    statement.assets.fixedAssetsCostItems.forEach((item) => addLine(item, '  '));
    rows.push(['Total Fixed Assets (Cost)', '', '', statement.assets.totalFixedAssetsCost.toFixed(2), statement.assets.compareTotalFixedAssetsCost.toFixed(2)]);

    rows.push(['Less: Accumulated Depreciation']);
    statement.assets.accumulatedDepreciationItems.forEach((item) => addLine(item, '  '));
    rows.push(['Total Accumulated Depreciation', '', '', (-statement.assets.totalAccumulatedDepreciation).toFixed(2), (-statement.assets.compareTotalAccumulatedDepreciation).toFixed(2)]);
    rows.push(['NET FIXED ASSETS', '', '', statement.assets.netFixedAssets.toFixed(2), statement.assets.compareNetFixedAssets.toFixed(2)]);

    rows.push(['TOTAL ASSETS', '', '', statement.assets.totalAssets.toFixed(2), statement.assets.compareTotalAssets.toFixed(2), statement.assets.variance.toFixed(2), `${statement.assets.variancePercentage}%`]);

    // Liabilities
    rows.push([]);
    rows.push(['LIABILITIES']);
    rows.push(['Current Liabilities']);
    statement.liabilities.currentLiabilityGroups.forEach((g) => {
      rows.push([`  ${g.title}`, '', '', g.currentTotal.toFixed(2), g.compareTotal.toFixed(2), g.variance.toFixed(2), `${g.variancePercentage}%`]);
      g.items.forEach((item) => addLine(item, '    '));
    });
    rows.push(['TOTAL CURRENT LIABILITIES', '', '', statement.liabilities.totalCurrentLiabilities.toFixed(2), statement.liabilities.compareTotalCurrentLiabilities.toFixed(2)]);

    rows.push(['Non-Current Liabilities (Long-Term)']);
    statement.liabilities.nonCurrentLiabilityGroups.forEach((g) => {
      rows.push([`  ${g.title}`, '', '', g.currentTotal.toFixed(2), g.compareTotal.toFixed(2), g.variance.toFixed(2), `${g.variancePercentage}%`]);
      g.items.forEach((item) => addLine(item, '    '));
    });
    rows.push(['TOTAL NON-CURRENT LIABILITIES', '', '', statement.liabilities.totalNonCurrentLiabilities.toFixed(2), statement.liabilities.compareTotalNonCurrentLiabilities.toFixed(2)]);
    rows.push(['TOTAL LIABILITIES', '', '', statement.liabilities.totalLiabilities.toFixed(2), statement.liabilities.compareTotalLiabilities.toFixed(2), statement.liabilities.variance.toFixed(2), `${statement.liabilities.variancePercentage}%`]);

    // Equity
    rows.push([]);
    rows.push(["OWNER'S EQUITY"]);
    statement.equity.items.forEach((item) => addLine(item, '  '));
    rows.push(["TOTAL OWNER'S EQUITY", '', '', statement.equity.totalEquity.toFixed(2), statement.equity.compareTotalEquity.toFixed(2), statement.equity.variance.toFixed(2), `${statement.equity.variancePercentage}%`]);

    rows.push([]);
    rows.push(['TOTAL LIABILITIES AND EQUITY', '', '', statement.summary.totalLiabilitiesAndEquity.toFixed(2), statement.summary.compareTotalLiabilitiesAndEquity.toFixed(2)]);
    rows.push(['BALANCE DIFFERENCE (Assets - Liab & Equity)', '', '', statement.summary.balanceDifference.toFixed(2), statement.summary.compareBalanceDifference.toFixed(2)]);
    rows.push(['STATUS', statement.summary.isBalanced ? 'BALANCED' : 'OUT OF BALANCE']);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Balance_Sheet_${statement.asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Currency Formatter
  const fmt = (num: number, isCurrency = true) => {
    if (isNaN(num)) return isCurrency ? 'Rs. 0.00' : '0.00';
    const formatted = Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (num < 0) {
      return isCurrency ? `(Rs. ${formatted})` : `(${formatted})`;
    }
    return isCurrency ? `Rs. ${formatted}` : formatted;
  };

  // Filter items if search is provided
  const filterItem = (item: BalanceSheetLineItem) => {
    if (!searchQuery.trim()) return true;
    const s = searchQuery.toLowerCase();
    return (
      item.accountCode.toLowerCase().includes(s) ||
      item.accountName.toLowerCase().includes(s) ||
      item.subCategory.toLowerCase().includes(s)
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Balance Sheet
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadStatement}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            title="Refresh financial calculations"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 stroke-[1.25]', loading && 'animate-spin')} />
            <span>Generate</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !statement}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !statement}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar Card */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* As Of Date Picker */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>As of Date (Point in Time)</span>
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'month-end', label: 'Month End' },
                { id: 'prev-month-end', label: 'Prev Month End' },
                { id: 'quarter-end', label: 'Quarter End' },
                { id: 'year-end', label: 'Year End' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleQuickPreset(btn.id as any)}
                  className="px-2 py-1 text-[11px] font-medium rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Mode */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comparison Mode
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as BalanceSheetComparisonMode)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="NONE">No Comparison</option>
              <option value="PREVIOUS_MONTH_END">Compare Previous Month End</option>
              <option value="PREVIOUS_YEAR_END">Compare Previous Year End</option>
              <option value="CUSTOM">Custom Comparison Date</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Statement Detail
            </label>
            <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
              <button
                onClick={() => setViewMode('DETAILED')}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-semibold text-center transition-colors',
                  viewMode === 'DETAILED'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-card)] text-slate-600 dark:text-slate-300 hover:bg-[var(--surface-hover)]'
                )}
              >
                Detailed
              </button>
              <button
                onClick={() => setViewMode('CONDENSED')}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-semibold text-center transition-colors',
                  viewMode === 'CONDENSED'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-card)] text-slate-600 dark:text-slate-300 hover:bg-[var(--surface-hover)]'
                )}
              >
                Condensed
              </button>
            </div>
          </div>
        </div>

        {/* Custom Comparison Date Picker if selected */}
        {comparisonMode === 'CUSTOM' && (
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Custom Comparison As Of Date:
            </span>
            <input
              type="date"
              value={compareAsOfDate}
              onChange={(e) => setCompareAsOfDate(e.target.value)}
              className="px-3 py-1 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Main Statement Content */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden">
        {/* Table Toolbar & Search */}
        <div className="p-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search account code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-medium rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-300 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-medium rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-300 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p>Compiling General Ledger entries and generating Balance Sheet...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadStatement}
              className="mt-3 px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-700 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Balance Sheet Statement Table */}
        {!loading && !error && statement && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-2.5 px-4 w-[45%]">Particulars / Chart of Accounts</th>
                  <th className="py-2.5 px-3 text-right">As of {statement.formattedAsOfDate} (NPR)</th>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <th className="py-2.5 px-3 text-right">
                        Prior ({statement.formattedCompareAsOfDate || 'Comparison'}) (NPR)
                      </th>
                      <th className="py-2.5 px-3 text-right">Variance (NPR)</th>
                      <th className="py-2.5 px-3 text-right">Variance %</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-center w-16">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-slate-800 dark:text-slate-200">
                {/* ======================================================== */}
                {/* SECTION A: ASSETS                                        */}
                {/* ======================================================== */}
                <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                  <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                    A. ASSETS
                  </td>
                </tr>

                {/* --- 1. Current Assets Header --- */}
                <tr
                  onClick={() => toggleSection('current-assets')}
                  className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {expandedSections['current-assets'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Current Assets</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {fmt(statement.assets.totalCurrentAssets)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {fmt(statement.assets.compareTotalCurrentAssets)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {fmt(statement.assets.totalCurrentAssets - statement.assets.compareTotalCurrentAssets)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {statement.assets.compareTotalCurrentAssets !== 0
                          ? `${(
                              ((statement.assets.totalCurrentAssets - statement.assets.compareTotalCurrentAssets) /
                                Math.abs(statement.assets.compareTotalCurrentAssets)) *
                              100
                            ).toFixed(1)}%`
                          : '-'}
                      </td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Current Assets Subgroups */}
                {expandedSections['current-assets'] &&
                  statement.assets.currentAssetGroups.map((group) => {
                    const isGroupExpanded = expandedSections[group.groupKey] ?? true;
                    return (
                      <React.Fragment key={group.groupKey}>
                        {/* Subgroup Header */}
                        <tr
                          onClick={() => toggleSection(group.groupKey)}
                          className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 font-medium text-slate-700 dark:text-slate-300 hover:bg-[var(--surface-hover)]/60"
                        >
                          <td className="py-1.5 px-4 pl-8 flex items-center gap-1.5">
                            {isGroupExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="font-semibold text-xs">{group.title}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold">
                            {fmt(group.currentTotal)}
                          </td>
                          {statement.comparisonMode !== 'NONE' && (
                            <>
                              <td className="py-1.5 px-3 text-right">{fmt(group.compareTotal)}</td>
                              <td className="py-1.5 px-3 text-right">{fmt(group.variance)}</td>
                              <td className="py-1.5 px-3 text-right">{group.variancePercentage}%</td>
                            </>
                          )}
                          <td className="py-1.5 px-3 text-center">-</td>
                        </tr>

                        {/* Line Items under Subgroup */}
                        {isGroupExpanded &&
                          viewMode === 'DETAILED' &&
                          group.items.filter(filterItem).map((item) => (
                            <tr
                              key={item.accountId}
                              className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400 transition-colors"
                            >
                              <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-[11px] text-slate-400 mr-2">
                                    {item.accountCode}
                                  </span>
                                  <span>{item.accountName}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                                  {item.subCategory}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100">
                                {fmt(item.currentBalance)}
                              </td>
                              {statement.comparisonMode !== 'NONE' && (
                                <>
                                  <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                    {fmt(item.compareBalance)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono">
                                    {fmt(item.variance)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                                    {item.variancePercentage}%
                                  </td>
                                </>
                              )}
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  onClick={() => handleOpenDrilldown(item.accountId)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                                  title="View General Ledger transactions"
                                >
                                  <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}

                {/* --- 2. Non-Current Assets (Fixed Assets) --- */}
                <tr
                  onClick={() => toggleSection('fixed-assets')}
                  className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {expandedSections['fixed-assets'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Non-Current Assets (Fixed Assets Cost)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {fmt(statement.assets.totalFixedAssetsCost)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-medium">
                        {fmt(statement.assets.compareTotalFixedAssetsCost)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {fmt(statement.assets.totalFixedAssetsCost - statement.assets.compareTotalFixedAssetsCost)}
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Fixed Asset Cost Items */}
                {expandedSections['fixed-assets'] &&
                  viewMode === 'DETAILED' &&
                  statement.assets.fixedAssetsCostItems.filter(filterItem).map((item) => (
                    <tr
                      key={item.accountId}
                      className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[11px] text-slate-400 mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                          {item.subCategory}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100">
                        {fmt(item.currentBalance)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                            {fmt(item.compareBalance)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                            {item.variancePercentage}%
                          </td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenDrilldown(item.accountId)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                          title="View General Ledger transactions"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* --- 3. Less: Accumulated Depreciation --- */}
                <tr
                  onClick={() => toggleSection('accum-deprec')}
                  className="cursor-pointer bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 font-semibold text-rose-800 dark:text-rose-300 transition-colors"
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {expandedSections['accum-deprec'] ? (
                      <ChevronDown className="w-4 h-4 text-rose-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-rose-500" />
                    )}
                    <span>Less: Accumulated Depreciation (Contra-Assets)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-rose-700 dark:text-rose-400">
                    ({fmt(statement.assets.totalAccumulatedDepreciation)})
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-medium">
                        ({fmt(statement.assets.compareTotalAccumulatedDepreciation)})
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Accumulated Depreciation Contra Items */}
                {expandedSections['accum-deprec'] &&
                  viewMode === 'DETAILED' &&
                  statement.assets.accumulatedDepreciationItems.filter(filterItem).map((item) => (
                    <tr
                      key={item.accountId}
                      className="hover:bg-[var(--surface-hover)] text-rose-700 dark:text-rose-400/80 transition-colors"
                    >
                      <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[11px] text-slate-400 mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                          Contra-Asset
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">
                        ({fmt(item.currentBalance)})
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-1.5 px-3 text-right font-mono">
                            ({fmt(item.compareBalance)})
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                            {item.variancePercentage}%
                          </td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenDrilldown(item.accountId)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                          title="View General Ledger transactions"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* Net Fixed Assets Row */}
                <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold border-t border-b border-[var(--border-subtle)]">
                  <td className="py-2 px-4 pl-8">Net Fixed Assets (Cost less Depreciation)</td>
                  <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                    {fmt(statement.assets.netFixedAssets)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right">
                        {fmt(statement.assets.compareNetFixedAssets)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {fmt(statement.assets.netFixedAssets - statement.assets.compareNetFixedAssets)}
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Total Assets Summary Banner */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 font-extrabold text-emerald-900 dark:text-emerald-200 text-sm border-t-2 border-b-2 border-emerald-600/40">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>TOTAL ASSETS (Current + Net Fixed Assets)</span>
                  </td>
                  <td className="py-3 px-3 text-right text-base text-emerald-800 dark:text-emerald-300">
                    {fmt(statement.assets.totalAssets)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        {fmt(statement.assets.compareTotalAssets)}
                      </td>
                      <td className="py-3 px-3 text-right">{fmt(statement.assets.variance)}</td>
                      <td className="py-3 px-3 text-right">{statement.assets.variancePercentage}%</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>

                {/* ======================================================== */}
                {/* SECTION B: LIABILITIES                                   */}
                {/* ======================================================== */}
                <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                  <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                    B. LIABILITIES
                  </td>
                </tr>

                {/* Current Liabilities Header */}
                <tr
                  onClick={() => toggleSection('current-liabilities')}
                  className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {expandedSections['current-liabilities'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Current Liabilities</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {fmt(statement.liabilities.totalCurrentLiabilities)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-medium">
                        {fmt(statement.liabilities.compareTotalCurrentLiabilities)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {fmt(
                          statement.liabilities.totalCurrentLiabilities -
                            statement.liabilities.compareTotalCurrentLiabilities
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Current Liabilities Subgroups */}
                {expandedSections['current-liabilities'] &&
                  statement.liabilities.currentLiabilityGroups.map((group) => {
                    const isGroupExpanded = expandedSections[group.groupKey] ?? true;
                    return (
                      <React.Fragment key={group.groupKey}>
                        <tr
                          onClick={() => toggleSection(group.groupKey)}
                          className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 font-medium text-slate-700 dark:text-slate-300 hover:bg-[var(--surface-hover)]/60"
                        >
                          <td className="py-1.5 px-4 pl-8 flex items-center gap-1.5">
                            {isGroupExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="font-semibold text-xs">{group.title}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold">
                            {fmt(group.currentTotal)}
                          </td>
                          {statement.comparisonMode !== 'NONE' && (
                            <>
                              <td className="py-1.5 px-3 text-right">{fmt(group.compareTotal)}</td>
                              <td className="py-1.5 px-3 text-right">{fmt(group.variance)}</td>
                              <td className="py-1.5 px-3 text-right">{group.variancePercentage}%</td>
                            </>
                          )}
                          <td className="py-1.5 px-3 text-center">-</td>
                        </tr>

                        {isGroupExpanded &&
                          viewMode === 'DETAILED' &&
                          group.items.filter(filterItem).map((item) => (
                            <tr
                              key={item.accountId}
                              className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400 transition-colors"
                            >
                              <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-[11px] text-slate-400 mr-2">
                                    {item.accountCode}
                                  </span>
                                  <span>{item.accountName}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                                  {item.subCategory}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100">
                                {fmt(item.currentBalance)}
                              </td>
                              {statement.comparisonMode !== 'NONE' && (
                                <>
                                  <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                    {fmt(item.compareBalance)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                                  <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                                    {item.variancePercentage}%
                                  </td>
                                </>
                              )}
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  onClick={() => handleOpenDrilldown(item.accountId)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                                  title="View General Ledger transactions"
                                >
                                  <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}

                {/* Non-Current Liabilities Header */}
                <tr
                  onClick={() => toggleSection('non-current-liabilities')}
                  className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {expandedSections['non-current-liabilities'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Non-Current Liabilities (Long-Term)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {fmt(statement.liabilities.totalNonCurrentLiabilities)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-medium">
                        {fmt(statement.liabilities.compareTotalNonCurrentLiabilities)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {fmt(
                          statement.liabilities.totalNonCurrentLiabilities -
                            statement.liabilities.compareTotalNonCurrentLiabilities
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Non-Current Liabilities Subgroups */}
                {expandedSections['non-current-liabilities'] &&
                  statement.liabilities.nonCurrentLiabilityGroups.map((group) => {
                    const isGroupExpanded = expandedSections[group.groupKey] ?? true;
                    return (
                      <React.Fragment key={group.groupKey}>
                        <tr
                          onClick={() => toggleSection(group.groupKey)}
                          className="cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 font-medium text-slate-700 dark:text-slate-300 hover:bg-[var(--surface-hover)]/60"
                        >
                          <td className="py-1.5 px-4 pl-8 flex items-center gap-1.5">
                            {isGroupExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="font-semibold text-xs">{group.title}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold">
                            {fmt(group.currentTotal)}
                          </td>
                          {statement.comparisonMode !== 'NONE' && (
                            <>
                              <td className="py-1.5 px-3 text-right">{fmt(group.compareTotal)}</td>
                              <td className="py-1.5 px-3 text-right">{fmt(group.variance)}</td>
                              <td className="py-1.5 px-3 text-right">{group.variancePercentage}%</td>
                            </>
                          )}
                          <td className="py-1.5 px-3 text-center">-</td>
                        </tr>

                        {isGroupExpanded &&
                          viewMode === 'DETAILED' &&
                          group.items.filter(filterItem).map((item) => (
                            <tr
                              key={item.accountId}
                              className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400 transition-colors"
                            >
                              <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-[11px] text-slate-400 mr-2">
                                    {item.accountCode}
                                  </span>
                                  <span>{item.accountName}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                                  {item.subCategory}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100">
                                {fmt(item.currentBalance)}
                              </td>
                              {statement.comparisonMode !== 'NONE' && (
                                <>
                                  <td className="py-1.5 px-3 text-right font-mono text-slate-500">
                                    {fmt(item.compareBalance)}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                                  <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                                    {item.variancePercentage}%
                                  </td>
                                </>
                              )}
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  onClick={() => handleOpenDrilldown(item.accountId)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                                  title="View General Ledger transactions"
                                >
                                  <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}

                {/* Total Liabilities Banner */}
                <tr className="bg-amber-50 dark:bg-amber-950/30 font-extrabold text-amber-900 dark:text-amber-200 text-sm border-t-2 border-b-2 border-amber-600/40">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>TOTAL LIABILITIES (Current + Non-Current)</span>
                  </td>
                  <td className="py-3 px-3 text-right text-base text-amber-800 dark:text-amber-300">
                    {fmt(statement.liabilities.totalLiabilities)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        {fmt(statement.liabilities.compareTotalLiabilities)}
                      </td>
                      <td className="py-3 px-3 text-right">{fmt(statement.liabilities.variance)}</td>
                      <td className="py-3 px-3 text-right">{statement.liabilities.variancePercentage}%</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>

                {/* ======================================================== */}
                {/* SECTION C: OWNER'S EQUITY                                */}
                {/* ======================================================== */}
                <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                  <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                    C. OWNER&apos;S EQUITY
                  </td>
                </tr>

                {/* Equity Line Items */}
                {statement.equity.items.filter(filterItem).map((item) => (
                  <tr
                    key={item.accountId}
                    className="hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <td className="py-2 px-4 pl-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{item.accountCode}</span>
                        <span className="font-semibold">{item.accountName}</span>
                        {item.accountCode === 'P&L-NET' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            Current Period Net Profit
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                        {item.subCategory}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {item.isContra ? `(${fmt(Math.abs(item.currentBalance))})` : fmt(item.currentBalance)}
                    </td>
                    {statement.comparisonMode !== 'NONE' && (
                      <>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {fmt(item.compareBalance)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{fmt(item.variance)}</td>
                        <td className="py-2 px-3 text-right font-mono text-[11px]">
                          {item.variancePercentage}%
                        </td>
                      </>
                    )}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleOpenDrilldown(item.accountId)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                        title="View underlying vouchers"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Total Equity Banner */}
                <tr className="bg-indigo-50 dark:bg-indigo-950/30 font-extrabold text-indigo-900 dark:text-indigo-200 text-sm border-t-2 border-b-2 border-indigo-600/40">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>TOTAL OWNER&apos;S EQUITY</span>
                  </td>
                  <td className="py-3 px-3 text-right text-base text-indigo-800 dark:text-indigo-300">
                    {fmt(statement.equity.totalEquity)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        {fmt(statement.equity.compareTotalEquity)}
                      </td>
                      <td className="py-3 px-3 text-right">{fmt(statement.equity.variance)}</td>
                      <td className="py-3 px-3 text-right">{statement.equity.variancePercentage}%</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>

                {/* ======================================================== */}
                {/* FINAL EQUATION VERIFICATION & RECONCILIATION             */}
                {/* ======================================================== */}
                <tr className="bg-slate-200/80 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-sm border-t-2 border-b">
                  <td className="py-3 px-4">TOTAL LIABILITIES + EQUITY</td>
                  <td className="py-3 px-3 text-right text-base">
                    {fmt(statement.summary.totalLiabilitiesAndEquity)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right">
                        {fmt(statement.summary.compareTotalLiabilitiesAndEquity)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {fmt(
                          statement.summary.totalLiabilitiesAndEquity -
                            statement.summary.compareTotalLiabilitiesAndEquity
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>

                {/* Balance Difference Row */}
                <tr
                  className={cn(
                    'font-extrabold text-sm',
                    statement.summary.isBalanced
                      ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                  )}
                >
                  <td className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statement.summary.isBalanced ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        BALANCE DIFFERENCE (Total Assets - [Total Liabilities + Equity])
                      </span>
                    </div>
                    {!statement.summary.isBalanced && (
                      <button
                        onClick={handleOpenInvestigation}
                        className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Investigate Discrepancy
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-base font-mono">
                    {statement.summary.isBalanced ? 'Rs. 0.00' : fmt(statement.summary.balanceDifference)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right font-mono">
                        {fmt(statement.summary.compareBalanceDifference)}
                      </td>
                      <td className="py-3 px-3 text-right">-</td>
                      <td className="py-3 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">
                    {statement.summary.isBalanced ? (
                      <span className="text-emerald-600 font-bold">OK</span>
                    ) : (
                      <span className="text-rose-600 font-bold">WARN</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account GL Drilldown Modal */}
      {isDrilldownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>General Ledger Audit Drilldown</span>
                </h3>
                {drilldownData && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Account: <strong className="text-slate-800 dark:text-slate-200">{drilldownData.accountCode} - {drilldownData.accountName}</strong> | As of: {drilldownData.asOfDate}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsDrilldownOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {drilldownLoading && (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p>Loading journal vouchers up to {asOfDate}...</p>
                </div>
              )}

              {!drilldownLoading && drilldownData && (
                <>
                  {/* Account Summary Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Opening Balance</span>
                      <span className="font-semibold">{fmt(drilldownData.openingBalance)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Total Posted Debits</span>
                      <span className="font-semibold text-emerald-600">{fmt(drilldownData.totalDebits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Total Posted Credits</span>
                      <span className="font-semibold text-rose-600">{fmt(drilldownData.totalCredits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Closing Balance (As of Date)</span>
                      <span className="font-bold text-indigo-600">{fmt(drilldownData.closingBalance)}</span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="rounded-lg border border-[var(--border-default)] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--surface-subtle)] text-slate-500 text-[10px] uppercase font-bold border-b border-[var(--border-default)]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Voucher #</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Reference</th>
                          <th className="py-2 px-3 w-[35%]">Narration</th>
                          <th className="py-2 px-3 text-right">Debit</th>
                          <th className="py-2 px-3 text-right">Credit</th>
                          <th className="py-2 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {drilldownData.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                              No journal voucher entries posted for this account prior to {asOfDate}.
                            </td>
                          </tr>
                        ) : (
                          drilldownData.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-[var(--surface-hover)]">
                              <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                {new Date(tx.entryDate).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-3 font-semibold text-indigo-600">
                                {tx.entryNumber}
                              </td>
                              <td className="py-2 px-3 text-[10px] uppercase text-slate-500">
                                {tx.entryType}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {tx.reference || '-'}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                {tx.narration}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-600">
                                {tx.debit > 0 ? fmt(tx.debit) : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-rose-600">
                                {tx.credit > 0 ? fmt(tx.credit) : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {fmt(tx.runningBalance)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[var(--border-default)] flex justify-end bg-[var(--surface-subtle)]">
              <button
                onClick={() => setIsDrilldownOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Diagnostic Investigation Modal */}
      {isInvestigateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Balance Sheet Discrepancy Diagnostics
                </h3>
              </div>
              <button
                onClick={() => setIsInvestigateOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {investigateLoading && (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p>Running automated double-entry ledger audits...</p>
                </div>
              )}

              {!investigateLoading && investigationData && (
                <>
                  {/* Status Banner */}
                  <div
                    className={cn(
                      'p-3 rounded-lg border',
                      investigationData.isBalanced
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    )}
                  >
                    <div className="font-bold text-sm">
                      {investigationData.isBalanced
                        ? 'Books Are In Balance (Zero Discrepancy)'
                        : `Out of Balance by ${fmt(Math.abs(investigationData.balanceDifference))}`}
                    </div>
                    <p className="mt-1 text-[11px]">
                      Assets: {fmt(investigationData.totalAssets)} | Liabilities: {fmt(investigationData.totalLiabilities)} | Equity: {fmt(investigationData.totalEquity)}
                    </p>
                  </div>

                  {/* Audit Findings */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-600" />
                      Audit Findings
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-300">
                      {investigationData.auditFindings.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Recommended Corrective Actions
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-300">
                      {investigationData.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Links */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                    <Link
                      href="/accounts?tab=chart-of-accounts"
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-indigo-600 font-semibold"
                    >
                      Open Chart of Accounts
                    </Link>
                    <Link
                      href="/accounts?tab=journal-entries"
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-indigo-600 font-semibold"
                    >
                      Open Journal Entries
                    </Link>
                    <Link
                      href="/accounts?tab=trial-balance"
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-indigo-600 font-semibold"
                    >
                      Open Trial Balance
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border-default)] flex justify-end bg-[var(--surface-subtle)]">
              <button
                onClick={() => setIsInvestigateOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Header (visible only during window.print) */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">Everest Family Restaurant</h1>
        <h2 className="text-sm font-semibold text-slate-600">Statement of Financial Position (Balance Sheet)</h2>
        <p className="text-xs text-slate-500 mt-1">
          As of: {statement?.formattedAsOfDate} | Currency: NPR | Generated on: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

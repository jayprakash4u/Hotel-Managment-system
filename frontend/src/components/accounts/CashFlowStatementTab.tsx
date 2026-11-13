'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDollarSign,
  BarChart3,
  Layers,
} from 'lucide-react';
import { cashFlowApi } from '@/lib/api';
import {
  CashFlowComparisonMode,
  CashFlowPresentationMethod,
  CashFlowStatementResponse,
  CashFlowLineItem,
  CashFlowActivitySection,
  CashAccountBalanceSummary,
  CashFlowDrilldownResponse,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function CashFlowStatementTab() {
  // Filters & State
  const now = new Date();
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayStr);
  const [endDate, setEndDate] = useState<string>(lastDayStr);
  const [comparisonMode, setComparisonMode] = useState<CashFlowComparisonMode>('NONE');
  const [compareStartDate, setCompareStartDate] = useState<string>('');
  const [compareEndDate, setCompareEndDate] = useState<string>('');
  const [method, setMethod] = useState<CashFlowPresentationMethod>('DIRECT');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<CashFlowStatementResponse | null>(null);

  // Expand / collapse state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'cash-accounts': false,
    'operating-inflows': true,
    'operating-outflows': true,
    'investing': true,
    'financing': true,
    'indirect-working-capital': true,
    'monthly-trends': false,
  });

  // Drilldown modal state
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);
  const [drilldownData, setDrilldownData] = useState<CashFlowDrilldownResponse | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Fetch statement data
  const loadStatement = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await cashFlowApi.getStatement({
        startDate,
        endDate,
        comparisonMode,
        compareStartDate: comparisonMode === 'CUSTOM' ? compareStartDate : undefined,
        compareEndDate: comparisonMode === 'CUSTOM' ? compareEndDate : undefined,
        method,
      });

      if (res) {
        setStatement(res);
      } else {
        setError('Failed to load Cash Flow Statement. Invalid response.');
      }
    } catch (err: any) {
      console.error('Failed to load cash flow statement:', err);
      setError(err?.message || 'Failed to generate Cash Flow statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [startDate, endDate, comparisonMode, compareStartDate, compareEndDate, method]);

  // Quick Date Preset Handlers
  const handleQuickPreset = (preset: 'today' | 'this-week' | 'this-month' | 'prev-month' | 'this-quarter' | 'this-year') => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();

    let s = new Date();
    let e = new Date();

    if (preset === 'today') {
      s = new Date();
      e = new Date();
    } else if (preset === 'this-week') {
      const day = d.getDay(); // 0 is Sunday
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      s = new Date(d.setDate(diffToMonday));
      e = new Date();
    } else if (preset === 'this-month') {
      s = new Date(year, month, 1);
      e = new Date(year, month + 1, 0);
    } else if (preset === 'prev-month') {
      s = new Date(year, month - 1, 1);
      e = new Date(year, month, 0);
    } else if (preset === 'this-quarter') {
      const q = Math.floor(month / 3);
      s = new Date(year, q * 3, 1);
      e = new Date(year, (q + 1) * 3, 0);
    } else if (preset === 'this-year') {
      s = new Date(year, 0, 1);
      e = new Date(year, 11, 31);
    }

    setStartDate(s.toISOString().split('T')[0]);
    setEndDate(e.toISOString().split('T')[0]);
  };

  // Toggle collapse state
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      'cash-accounts': true,
      'operating-inflows': true,
      'operating-outflows': true,
      'investing': true,
      'financing': true,
      'indirect-working-capital': true,
      'monthly-trends': true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      'cash-accounts': false,
      'operating-inflows': false,
      'operating-outflows': false,
      'investing': false,
      'financing': false,
      'indirect-working-capital': false,
      'monthly-trends': false,
    });
  };

  // Open drilldown for a category
  const handleOpenDrilldown = async (itemKey: string, activityType: string) => {
    try {
      setDrilldownLoading(true);
      setIsDrilldownOpen(true);
      const res = await cashFlowApi.getCategoryDrilldown({
        itemKey,
        startDate,
        endDate,
        activityType,
      });
      if (res) {
        setDrilldownData(res);
      }
    } catch (err: any) {
      console.error('Failed to load drilldown transactions:', err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!statement) return;

    const rows: string[][] = [
      ['EVEREST FAMILY RESTAURANT - CASH FLOW STATEMENT'],
      [`Period: ${statement.formattedPeriod}`],
      [`Method: ${statement.presentationMethod} METHOD`],
      [`Currency: Nepalese Rupee (NPR)`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Activity / Category', 'Current Amount (NPR)', 'Compare Amount (NPR)', 'Variance (NPR)', 'Variance %', 'Tx Count'],
    ];

    const addLine = (i: CashFlowLineItem, indent = '  ') => {
      rows.push([
        `${indent}${i.title}`,
        i.currentAmount.toFixed(2),
        i.compareAmount.toFixed(2),
        i.variance.toFixed(2),
        `${i.variancePercentage}%`,
        i.transactionCount.toString(),
      ]);
    };

    if (statement.presentationMethod === 'DIRECT') {
      // Operating
      rows.push(['OPERATING ACTIVITIES']);
      rows.push(['  Cash Inflows from Operations:']);
      statement.operatingActivities.inflows.forEach((i) => addLine(i, '    '));
      rows.push(['  Total Operating Inflows', statement.operatingActivities.totalInflows.toFixed(2)]);

      rows.push(['  Cash Outflows for Operations:']);
      statement.operatingActivities.outflows.forEach((i) => addLine(i, '    '));
      rows.push(['  Total Operating Outflows', (-statement.operatingActivities.totalOutflows).toFixed(2)]);
      rows.push(['NET CASH FLOW FROM OPERATING ACTIVITIES', statement.operatingActivities.netCashFlow.toFixed(2)]);

      // Investing
      rows.push([]);
      rows.push(['INVESTING ACTIVITIES']);
      if (statement.investingActivities.inflows.length > 0) {
        rows.push(['  Cash Inflows from Investing:']);
        statement.investingActivities.inflows.forEach((i) => addLine(i, '    '));
      }
      rows.push(['  Cash Outflows for Capital Expenditures:']);
      statement.investingActivities.outflows.forEach((i) => addLine(i, '    '));
      rows.push(['NET CASH FLOW FROM INVESTING ACTIVITIES', statement.investingActivities.netCashFlow.toFixed(2)]);

      // Financing
      rows.push([]);
      rows.push(['FINANCING ACTIVITIES']);
      if (statement.financingActivities.inflows.length > 0) {
        rows.push(['  Cash Inflows from Financing:']);
        statement.financingActivities.inflows.forEach((i) => addLine(i, '    '));
      }
      if (statement.financingActivities.outflows.length > 0) {
        rows.push(['  Cash Outflows for Financing:']);
        statement.financingActivities.outflows.forEach((i) => addLine(i, '    '));
      }
      rows.push(['NET CASH FLOW FROM FINANCING ACTIVITIES', statement.financingActivities.netCashFlow.toFixed(2)]);
    } else if (statement.indirectMethod) {
      rows.push(['OPERATING ACTIVITIES (INDIRECT METHOD)']);
      rows.push(['  Net Profit / (Loss) for the Period', statement.indirectMethod.netProfitOrLoss.toFixed(2)]);
      rows.push(['  Non-Cash Adjustments:']);
      statement.indirectMethod.nonCashAdjustments.forEach((i) => addLine(i, '    '));
      rows.push(['  Working Capital Adjustments:']);
      statement.indirectMethod.workingCapitalAdjustments.forEach((w) => {
        rows.push([`    ${w.title}`, w.cashFlowImpact.toFixed(2), '', '', '', '']);
      });
      rows.push(['NET CASH FLOW FROM OPERATING ACTIVITIES', statement.indirectMethod.netOperatingCashFlow.toFixed(2)]);
    }

    // Summary
    rows.push([]);
    rows.push(['NET INCREASE / (DECREASE) IN CASH', statement.summary.netChangeInCash.toFixed(2)]);
    rows.push(['OPENING CASH & CASH EQUIVALENTS', statement.summary.openingCashBalance.toFixed(2)]);
    rows.push(['CLOSING CASH & CASH EQUIVALENTS', statement.summary.closingCashBalance.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cash_Flow_Statement_${statement.startDate}_to_${statement.endDate}.csv`);
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

  // Filter line item
  const filterItem = (item: CashFlowLineItem) => {
    if (!searchQuery.trim()) return true;
    const s = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(s) || item.itemKey.toLowerCase().includes(s);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="p-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.25]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[1.25]" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Cash Flow Statement
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Actual cash &amp; cash-equivalent inflows and outflows (Operating, Investing, Financing)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadStatement}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
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
          {/* Start Date */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* End Date */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Quick Period Presets */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Period Filters
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'this-week', label: 'This Week' },
                { id: 'this-month', label: 'This Month' },
                { id: 'prev-month', label: 'Prev Month' },
                { id: 'this-quarter', label: 'This Quarter' },
                { id: 'this-year', label: 'This Year' },
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
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compare
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as CashFlowComparisonMode)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="NONE">No Comparison</option>
              <option value="PREVIOUS_PERIOD">Previous Period</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* Presentation Method Toggle */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Method
            </label>
            <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden">
              <button
                onClick={() => setMethod('DIRECT')}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-semibold text-center transition-colors',
                  method === 'DIRECT'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-card)] text-slate-600 dark:text-slate-300 hover:bg-[var(--surface-hover)]'
                )}
              >
                Direct
              </button>
              <button
                onClick={() => setMethod('INDIRECT')}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-semibold text-center transition-colors',
                  method === 'INDIRECT'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-card)] text-slate-600 dark:text-slate-300 hover:bg-[var(--surface-hover)]'
                )}
              >
                Indirect
              </button>
            </div>
          </div>
        </div>

        {/* Custom Comparison Range Inputs */}
        {comparisonMode === 'CUSTOM' && (
          <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Custom Comparison Period:
            </span>
            <input
              type="date"
              value={compareStartDate}
              onChange={(e) => setCompareStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={compareEndDate}
              onChange={(e) => setCompareEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* 5 Compact Summary Cards */}
      {statement && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Opening Cash */}
          <div className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <span>Opening Cash</span>
              <Landmark className="w-3.5 h-3.5 text-slate-400 stroke-[1.25]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {fmt(statement.summary.openingCashBalance)}
            </div>
            <p className="text-[10px] text-slate-400">As of period start date</p>
          </div>

          {/* 2. Total Inflows */}
          <div className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Total Inflows</span>
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[1.25]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              +{fmt(statement.summary.totalCashInflow)}
            </div>
            <p className="text-[10px] text-slate-400">Revenue, collections &amp; deposits</p>
          </div>

          {/* 3. Total Outflows */}
          <div className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Total Outflows</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.25]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
              -{fmt(statement.summary.totalCashOutflow)}
            </div>
            <p className="text-[10px] text-slate-400">Purchases, payroll &amp; capex</p>
          </div>

          {/* 4. Net Change in Cash */}
          <div
            className={cn(
              'p-3.5 rounded-xl border shadow-sm space-y-1.5',
              statement.summary.netChangeInCash >= 0
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/40'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300/40'
            )}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span className={statement.summary.netChangeInCash >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                Net Cash Change
              </span>
              {statement.summary.netChangeInCash >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <div
              className={cn(
                'text-xl font-bold tracking-tight',
                statement.summary.netChangeInCash >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              )}
            >
              {statement.summary.netChangeInCash >= 0 ? '+' : ''}
              {fmt(statement.summary.netChangeInCash)}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Op: {fmt(statement.summary.operatingCashFlow)}</span>
              <span>Inv: {fmt(statement.summary.investingCashFlow)}</span>
            </div>
          </div>

          {/* 5. Closing Cash */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
              <span>Closing Cash</span>
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.25]" />
            </div>
            <div className="text-xl font-bold tracking-tight text-indigo-900 dark:text-indigo-200">
              {fmt(statement.summary.closingCashBalance)}
            </div>
            <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
              Reconciles with Balance Sheet
            </p>
          </div>
        </div>
      )}

      {/* Cash Accounts Reconciliation Strip (Collapsible) */}
      {statement && statement.cashAccounts.length > 0 && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('cash-accounts')}
            className="w-full p-3.5 bg-[var(--surface-subtle)] flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Cash &amp; Bank Accounts Reconciliation Breakdown ({statement.cashAccounts.length} Accounts)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>
                Total Available: <strong>{fmt(statement.summary.closingCashBalance)}</strong>
              </span>
              {expandedSections['cash-accounts'] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {expandedSections['cash-accounts'] && (
            <div className="p-4 border-t border-[var(--border-default)] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2 px-3">Account Code &amp; Name</th>
                    <th className="py-2 px-3">Subcategory</th>
                    <th className="py-2 px-3 text-right">Opening Balance</th>
                    <th className="py-2 px-3 text-right text-emerald-600">Inflows (+)</th>
                    <th className="py-2 px-3 text-right text-rose-600">Outflows (-)</th>
                    <th className="py-2 px-3 text-right">Net Movement</th>
                    <th className="py-2 px-3 text-right font-bold">Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {statement.cashAccounts.map((ca) => (
                    <tr key={ca.accountId} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-mono text-[11px] text-slate-400 mr-2">{ca.accountCode}</span>
                        <span>{ca.accountName}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{ca.subCategory}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {fmt(ca.openingBalance)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">
                        +{fmt(ca.totalInflows)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600">
                        -{fmt(ca.totalOutflows)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {fmt(ca.netChange)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {fmt(ca.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main Statement Table */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cash flow item..."
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
            <p>Compiling posted cash &amp; bank transactions and generating Cash Flow statement...</p>
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

        {/* Statement Content */}
        {!loading && !error && statement && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-2.5 px-4 w-[45%]">Activity / Cash Flow Category</th>
                  <th className="py-2.5 px-3 text-right">Current Period ({statement.formattedPeriod}) (NPR)</th>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Prior ({statement.formattedComparePeriod || 'Comparison'}) (NPR)</th>
                      <th className="py-2.5 px-3 text-right">Variance (NPR)</th>
                      <th className="py-2.5 px-3 text-right">Variance %</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-center w-16">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-slate-800 dark:text-slate-200">
                {/* DIRECT METHOD PRESENTATION */}
                {statement.presentationMethod === 'DIRECT' ? (
                  <>
                    {/* ======================================================== */}
                    {/* 1. OPERATING ACTIVITIES                                  */}
                    {/* ======================================================== */}
                    <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                      <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                        1. CASH FLOWS FROM OPERATING ACTIVITIES
                      </td>
                    </tr>

                    {/* Operating Cash Inflows */}
                    <tr
                      onClick={() => toggleSection('operating-inflows')}
                      className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                    >
                      <td className="py-2 px-4 flex items-center gap-2">
                        {expandedSections['operating-inflows'] ? (
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="text-emerald-800 dark:text-emerald-300">Cash Receipts from Operating Activities (Inflows)</span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        +{fmt(statement.operatingActivities.totalInflows)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2 px-3 text-right font-medium">
                            +{fmt(statement.operatingActivities.compareTotalInflows)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {fmt(statement.operatingActivities.totalInflows - statement.operatingActivities.compareTotalInflows)}
                          </td>
                          <td className="py-2 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-2 px-3 text-center">-</td>
                    </tr>

                    {expandedSections['operating-inflows'] &&
                      statement.operatingActivities.inflows.filter(filterItem).map((item) => (
                        <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                          <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                            <span>{item.title}</span>
                            <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-medium">
                            +{fmt(item.currentAmount)}
                          </td>
                          {statement.comparisonMode !== 'NONE' && (
                            <>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                              <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                            </>
                          )}
                          <td className="py-1.5 px-3 text-center">
                            <button
                              onClick={() => handleOpenDrilldown(item.itemKey, 'OPERATING')}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                              title="View cash transactions"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Operating Cash Outflows */}
                    <tr
                      onClick={() => toggleSection('operating-outflows')}
                      className="cursor-pointer bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] font-semibold transition-colors"
                    >
                      <td className="py-2 px-4 flex items-center gap-2">
                        {expandedSections['operating-outflows'] ? (
                          <ChevronDown className="w-4 h-4 text-rose-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-rose-800 dark:text-rose-300">Cash Payments for Operating Expenses (Outflows)</span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 dark:text-rose-400">
                        -{fmt(statement.operatingActivities.totalOutflows)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2 px-3 text-right font-medium">
                            -{fmt(statement.operatingActivities.compareTotalOutflows)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {fmt(statement.operatingActivities.totalOutflows - statement.operatingActivities.compareTotalOutflows)}
                          </td>
                          <td className="py-2 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-2 px-3 text-center">-</td>
                    </tr>

                    {expandedSections['operating-outflows'] &&
                      statement.operatingActivities.outflows.filter(filterItem).map((item) => (
                        <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                          <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                            <span>{item.title}</span>
                            <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-rose-600 font-medium">
                            -{fmt(item.currentAmount)}
                          </td>
                          {statement.comparisonMode !== 'NONE' && (
                            <>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                              <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                            </>
                          )}
                          <td className="py-1.5 px-3 text-center">
                            <button
                              onClick={() => handleOpenDrilldown(item.itemKey, 'OPERATING')}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                              title="View cash transactions"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Net Operating Cash Flow Banner */}
                    <tr className="bg-emerald-50/70 dark:bg-emerald-950/30 font-extrabold text-emerald-950 dark:text-emerald-200 border-t border-b border-emerald-300/40">
                      <td className="py-2.5 px-4 pl-8">NET CASH FLOW GENERATED FROM OPERATING ACTIVITIES</td>
                      <td className="py-2.5 px-3 text-right text-sm font-mono text-emerald-800 dark:text-emerald-300">
                        {fmt(statement.operatingActivities.netCashFlow)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.operatingActivities.compareNetCashFlow)}</td>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.operatingActivities.variance)}</td>
                          <td className="py-2.5 px-3 text-right">{statement.operatingActivities.variancePercentage}%</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>

                    {/* ======================================================== */}
                    {/* 2. INVESTING ACTIVITIES                                  */}
                    {/* ======================================================== */}
                    <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                      <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                        2. CASH FLOWS FROM INVESTING ACTIVITIES
                      </td>
                    </tr>

                    {/* Investing Inflows */}
                    {statement.investingActivities.inflows.filter(filterItem).map((item) => (
                      <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-medium">
                          +{fmt(item.currentAmount)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenDrilldown(item.itemKey, 'INVESTING')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                            title="View cash transactions"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Investing Outflows */}
                    {statement.investingActivities.outflows.filter(filterItem).map((item) => (
                      <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-rose-600 font-medium">
                          -{fmt(item.currentAmount)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenDrilldown(item.itemKey, 'INVESTING')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                            title="View cash transactions"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Net Investing Cash Flow Banner */}
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-extrabold text-slate-900 dark:text-white border-t border-b">
                      <td className="py-2.5 px-4 pl-8">NET CASH FLOW USED IN INVESTING ACTIVITIES</td>
                      <td className="py-2.5 px-3 text-right text-sm font-mono">
                        {fmt(statement.investingActivities.netCashFlow)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.investingActivities.compareNetCashFlow)}</td>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.investingActivities.variance)}</td>
                          <td className="py-2.5 px-3 text-right">{statement.investingActivities.variancePercentage}%</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>

                    {/* ======================================================== */}
                    {/* 3. FINANCING ACTIVITIES                                  */}
                    {/* ======================================================== */}
                    <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                      <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                        3. CASH FLOWS FROM FINANCING ACTIVITIES
                      </td>
                    </tr>

                    {/* Financing Inflows */}
                    {statement.financingActivities.inflows.filter(filterItem).map((item) => (
                      <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-medium">
                          +{fmt(item.currentAmount)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenDrilldown(item.itemKey, 'FINANCING')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                            title="View cash transactions"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Financing Outflows */}
                    {statement.financingActivities.outflows.filter(filterItem).map((item) => (
                      <tr key={item.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-10 flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.transactionCount} entries</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-rose-600 font-medium">
                          -{fmt(item.currentAmount)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">{fmt(item.compareAmount)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{fmt(item.variance)}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px]">{item.variancePercentage}%</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => handleOpenDrilldown(item.itemKey, 'FINANCING')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                            title="View cash transactions"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.25]" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Net Financing Cash Flow Banner */}
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-extrabold text-slate-900 dark:text-white border-t border-b">
                      <td className="py-2.5 px-4 pl-8">NET CASH FLOW FROM FINANCING ACTIVITIES</td>
                      <td className="py-2.5 px-3 text-right text-sm font-mono">
                        {fmt(statement.financingActivities.netCashFlow)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.financingActivities.compareNetCashFlow)}</td>
                          <td className="py-2.5 px-3 text-right">{fmt(statement.financingActivities.variance)}</td>
                          <td className="py-2.5 px-3 text-right">{statement.financingActivities.variancePercentage}%</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>
                  </>
                ) : (
                  /* ======================================================== */
                  /* INDIRECT METHOD PRESENTATION                             */
                  /* ======================================================== */
                  <>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                      <td colSpan={statement.comparisonMode !== 'NONE' ? 6 : 3} className="py-2.5 px-4 text-sm tracking-wide">
                        OPERATING ACTIVITIES (INDIRECT RECONCILIATION METHOD)
                      </td>
                    </tr>

                    {/* Net Profit Base */}
                    <tr className="hover:bg-[var(--surface-hover)] font-semibold">
                      <td className="py-2 px-4 pl-8 flex items-center justify-between">
                        <span>Net Profit / (Loss) for the Period (from P&amp;L)</span>
                        <Link href="/accounts?tab=profit-loss" className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]">
                          <span>P&amp;L Report</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {fmt(statement.indirectMethod?.netProfitOrLoss ?? 0)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2 px-3 text-right font-mono">-</td>
                          <td className="py-2 px-3 text-right font-mono">-</td>
                          <td className="py-2 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-2 px-3 text-center">-</td>
                    </tr>

                    {/* Non-Cash Adjustments */}
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 font-semibold text-slate-700 dark:text-slate-300">
                      <td className="py-1.5 px-4 pl-8">Non-Cash Adjustments to Net Profit</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        +{fmt(statement.indirectMethod?.totalNonCashAdjustments ?? 0)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-1.5 px-3 text-right font-mono">-</td>
                          <td className="py-1.5 px-3 text-right font-mono">-</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-center">-</td>
                    </tr>

                    {statement.indirectMethod?.nonCashAdjustments.map((adj) => (
                      <tr key={adj.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-12">{adj.title}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-600">
                          +{fmt(adj.currentAmount)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono">-</td>
                            <td className="py-1.5 px-3 text-right font-mono">-</td>
                            <td className="py-1.5 px-3 text-right">-</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">-</td>
                      </tr>
                    ))}

                    {/* Working Capital Adjustments */}
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 font-semibold text-slate-700 dark:text-slate-300">
                      <td className="py-1.5 px-4 pl-8">Working Capital Changes (Receivables, Inventory, Payables)</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        {fmt(statement.indirectMethod?.totalWorkingCapitalAdjustments ?? 0)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-1.5 px-3 text-right font-mono">-</td>
                          <td className="py-1.5 px-3 text-right font-mono">-</td>
                          <td className="py-1.5 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-center">-</td>
                    </tr>

                    {statement.indirectMethod?.workingCapitalAdjustments.map((wc) => (
                      <tr key={wc.itemKey} className="hover:bg-[var(--surface-hover)] text-slate-600 dark:text-slate-400">
                        <td className="py-1.5 px-4 pl-12 flex items-center justify-between">
                          <span>{wc.title}</span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline-block">{wc.explanation}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium">
                          {wc.cashFlowImpact >= 0 ? `+${fmt(wc.cashFlowImpact)}` : fmt(wc.cashFlowImpact)}
                        </td>
                        {statement.comparisonMode !== 'NONE' && (
                          <>
                            <td className="py-1.5 px-3 text-right font-mono">-</td>
                            <td className="py-1.5 px-3 text-right font-mono">-</td>
                            <td className="py-1.5 px-3 text-right">-</td>
                          </>
                        )}
                        <td className="py-1.5 px-3 text-center">-</td>
                      </tr>
                    ))}

                    {/* Net Operating Cash Flow (Indirect) */}
                    <tr className="bg-emerald-50/70 dark:bg-emerald-950/30 font-extrabold text-emerald-950 dark:text-emerald-200 border-t border-b border-emerald-300/40">
                      <td className="py-2.5 px-4 pl-8">NET CASH FLOW FROM OPERATING ACTIVITIES (INDIRECT)</td>
                      <td className="py-2.5 px-3 text-right text-sm font-mono text-emerald-800 dark:text-emerald-300">
                        {fmt(statement.indirectMethod?.netOperatingCashFlow ?? statement.summary.operatingCashFlow)}
                      </td>
                      {statement.comparisonMode !== 'NONE' && (
                        <>
                          <td className="py-2.5 px-3 text-right font-mono">-</td>
                          <td className="py-2.5 px-3 text-right font-mono">-</td>
                          <td className="py-2.5 px-3 text-right">-</td>
                        </>
                      )}
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>
                  </>
                )}

                {/* ======================================================== */}
                {/* FINAL CASH FLOW SUMMARY & RECONCILIATION                 */}
                {/* ======================================================== */}
                <tr className="bg-indigo-50/80 dark:bg-indigo-950/40 font-extrabold text-indigo-950 dark:text-indigo-200 text-sm border-t-2 border-b">
                  <td className="py-3 px-4 flex items-center justify-between">
                    <span>NET INCREASE / (DECREASE) IN CASH &amp; CASH EQUIVALENTS</span>
                  </td>
                  <td className="py-3 px-3 text-right text-base font-mono text-indigo-900 dark:text-indigo-100">
                    {statement.summary.netChangeInCash >= 0 ? '+' : ''}
                    {fmt(statement.summary.netChangeInCash)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-mono">
                        {fmt(statement.summary.compareNetChangeInCash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{fmt(statement.summary.varianceNetChange)}</td>
                      <td className="py-3 px-3 text-right">{statement.summary.variancePercentageNetChange}%</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>

                {/* Opening Cash Balance Row */}
                <tr className="hover:bg-[var(--surface-hover)] font-semibold text-slate-700 dark:text-slate-300">
                  <td className="py-2 px-4 pl-8">Opening Cash &amp; Cash Equivalents (at {statement.startDate})</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {fmt(statement.summary.openingCashBalance)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-2 px-3 text-right font-mono">{fmt(statement.summary.compareOpeningCashBalance)}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {fmt(statement.summary.openingCashBalance - statement.summary.compareOpeningCashBalance)}
                      </td>
                      <td className="py-2 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-center">-</td>
                </tr>

                {/* Closing Cash Balance Row */}
                <tr className="bg-slate-200/90 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-sm border-t-2 border-b-2">
                  <td className="py-3 px-4 pl-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>CLOSING CASH &amp; CASH EQUIVALENTS (at {statement.endDate})</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Reconciled with Balance Sheet
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-base font-mono">
                    {fmt(statement.summary.closingCashBalance)}
                  </td>
                  {statement.comparisonMode !== 'NONE' && (
                    <>
                      <td className="py-3 px-3 text-right font-mono">{fmt(statement.summary.compareClosingCashBalance)}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        {fmt(statement.summary.closingCashBalance - statement.summary.compareClosingCashBalance)}
                      </td>
                      <td className="py-3 px-3 text-right">-</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center">
                    <span className="text-emerald-600 font-bold">MATCH</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Cash Flow Trend Visualizer (Collapsible) */}
      {statement && statement.monthlyTrends.length > 0 && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('monthly-trends')}
            className="w-full p-3.5 bg-[var(--surface-subtle)] flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Monthly Cash Flow Trends (Past 6 Months)
              </span>
            </div>
            {expandedSections['monthly-trends'] ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections['monthly-trends'] && (
            <div className="p-4 border-t border-[var(--border-default)] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3 text-right text-emerald-600">Total Inflows</th>
                    <th className="py-2 px-3 text-right text-rose-600">Total Outflows</th>
                    <th className="py-2 px-3 text-right">Operating Flow</th>
                    <th className="py-2 px-3 text-right">Investing Flow</th>
                    <th className="py-2 px-3 text-right">Financing Flow</th>
                    <th className="py-2 px-3 text-right font-bold">Net Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {statement.monthlyTrends.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2 px-3 font-semibold">{m.monthLabel}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">+{fmt(m.totalInflow)}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600">-{fmt(m.totalOutflow)}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(m.operatingCashFlow)}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(m.investingCashFlow)}</td>
                      <td className="py-2 px-3 text-right font-mono">{fmt(m.financingCashFlow)}</td>
                      <td
                        className={cn(
                          'py-2 px-3 text-right font-mono font-bold',
                          m.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        )}
                      >
                        {m.netChange >= 0 ? '+' : ''}
                        {fmt(m.netChange)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cash Flow Transaction Drilldown Modal */}
      {isDrilldownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Cash Flow Transaction Audit Trail</span>
                </h3>
                {drilldownData && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category: <strong className="text-slate-800 dark:text-slate-200">{drilldownData.title}</strong> | Activity: {drilldownData.activityType} ({drilldownData.formattedPeriod})
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

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {drilldownLoading && (
                <div className="p-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <p>Loading underlying journal voucher lines...</p>
                </div>
              )}

              {!drilldownLoading && drilldownData && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Transaction Count</span>
                      <span className="font-semibold">{drilldownData.transactionCount} transactions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase">Total Category Cash Movement</span>
                      <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                        {drilldownData.category === 'INFLOW' ? '+' : '-'}
                        {fmt(drilldownData.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border-default)] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--surface-subtle)] text-slate-500 text-[10px] uppercase font-bold border-b border-[var(--border-default)]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Voucher #</th>
                          <th className="py-2 px-3">Module</th>
                          <th className="py-2 px-3">Cash / Bank Account</th>
                          <th className="py-2 px-3">Offset Account</th>
                          <th className="py-2 px-3 w-[30%]">Narration</th>
                          <th className="py-2 px-3 text-right">Amount (NPR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {drilldownData.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                              No transactions recorded for this category in the selected period.
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
                                {tx.sourceModule}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                <span className="font-mono text-[10px] text-slate-400 mr-1">{tx.cashAccountCode}</span>
                                <span>{tx.cashAccountName}</span>
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                <span className="font-mono text-[10px] text-slate-400 mr-1">{tx.contraAccountCode}</span>
                                <span>{tx.contraAccountName}</span>
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                {tx.description}
                              </td>
                              <td
                                className={cn(
                                  'py-2 px-3 text-right font-mono font-bold',
                                  tx.isInflow ? 'text-emerald-600' : 'text-rose-600'
                                )}
                              >
                                {tx.isInflow ? '+' : '-'}
                                {fmt(tx.amount)}
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

      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">Everest Family Restaurant</h1>
        <h2 className="text-sm font-semibold text-slate-600">Statement of Cash Flows ({statement?.presentationMethod} Method)</h2>
        <p className="text-xs text-slate-500 mt-1">
          Period: {statement?.formattedPeriod} | Currency: NPR | Generated on: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

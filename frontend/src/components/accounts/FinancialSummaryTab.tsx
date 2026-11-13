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
  Users,
  Truck,
  DollarSign,
} from 'lucide-react';
import { financialSummaryApi } from '@/lib/api';
import { FinancialSummaryDashboardResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function FinancialSummaryTab() {
  // Date State - Default to Current Month
  const now = new Date();
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayStr);
  const [endDate, setEndDate] = useState<string>(lastDayStr);
  const [comparisonMode, setComparisonMode] = useState<string>('PREVIOUS_PERIOD');
  const [compareStartDate, setCompareStartDate] = useState<string>('');
  const [compareEndDate, setCompareEndDate] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialSummaryDashboardResponse | null>(null);

  // Fetch Dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await financialSummaryApi.getDashboard({
        startDate,
        endDate,
        comparisonMode,
        compareStartDate: comparisonMode === 'CUSTOM' ? compareStartDate : undefined,
        compareEndDate: comparisonMode === 'CUSTOM' ? compareEndDate : undefined,
      });

      if (res) {
        setData(res);
      } else {
        setError('Failed to load Financial Summary. Invalid response.');
      }
    } catch (err: any) {
      console.error('Failed to load financial summary dashboard:', err);
      setError(err?.message || 'Failed to generate Financial Summary dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [startDate, endDate, comparisonMode, compareStartDate, compareEndDate]);

  // Quick Date Preset Handlers
  const handleQuickPreset = (preset: 'today' | 'this-week' | 'this-month' | 'this-quarter' | 'this-year') => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();

    let s = new Date();
    let e = new Date();

    if (preset === 'today') {
      s = new Date();
      e = new Date();
    } else if (preset === 'this-week') {
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      s = new Date(d.setDate(diffToMonday));
      e = new Date();
    } else if (preset === 'this-month') {
      s = new Date(year, month, 1);
      e = new Date(year, month + 1, 0);
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

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!data) return;

    const rows: string[][] = [
      ['EVEREST FAMILY RESTAURANT - FINANCIAL SUMMARY DASHBOARD'],
      [`Reporting Period: ${data.formattedPeriod}`],
      [`As of Financial Position Date: ${data.formattedAsOfDate}`],
      [`Currency: Nepalese Rupee (NPR)`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['1. PRIMARY FINANCIAL OVERVIEW'],
      ['Metric', 'Current Amount (NPR)', 'Prior Amount (NPR)', 'Variance (NPR)', 'Variance %'],
      ['Net Revenue', data.overviewCards.netRevenue.currentAmount.toFixed(2), data.overviewCards.netRevenue.compareAmount.toFixed(2), data.overviewCards.netRevenue.variance.toFixed(2), `${data.overviewCards.netRevenue.variancePercentage}%`],
      ['Net Profit', data.overviewCards.netProfit.currentAmount.toFixed(2), data.overviewCards.netProfit.compareAmount.toFixed(2), data.overviewCards.netProfit.variance.toFixed(2), `${data.overviewCards.netProfit.variancePercentage}%`],
      ['Cash and Bank Balance', data.overviewCards.cashAndBank.totalCashAndBank.toFixed(2), '', '', ''],
      ['Outstanding Payables', data.overviewCards.payables.totalOutstandingPayables.toFixed(2), '', '', ''],
      [],
      ['2. FINANCIAL PERFORMANCE (PROFIT & LOSS)'],
      ['Gross Sales', data.performance.grossSales.toFixed(2)],
      ['Less: Sales Discounts', (-data.performance.salesDiscounts).toFixed(2)],
      ['Less: Sales Returns', (-data.performance.salesReturns).toFixed(2)],
      ['Net Revenue', data.performance.netRevenue.toFixed(2)],
      ['Cost of Goods Sold (COGS)', (-data.performance.costOfGoodsSold).toFixed(2)],
      ['Gross Profit', data.performance.grossProfit.toFixed(2), `Gross Margin: ${data.performance.grossMarginPercentage}%`],
      ['Operating Expenses', (-data.performance.operatingExpenses).toFixed(2)],
      ['Depreciation Expense', (-data.performance.depreciationExpense).toFixed(2)],
      ['Other Income', data.performance.otherIncome.toFixed(2)],
      ['Other Expenses & Financing', (-data.performance.otherExpenses).toFixed(2)],
      ['Income Tax Expense', (-data.performance.incomeTaxExpense).toFixed(2)],
      ['Net Profit', data.performance.netProfit.toFixed(2), `Net Margin: ${data.performance.netMarginPercentage}%`],
      [],
      ['3. FINANCIAL POSITION (BALANCE SHEET)'],
      ['Total Assets', data.financialPosition.assets.totalAssets.toFixed(2)],
      ['  Cash & Cash Equivalents', (data.financialPosition.assets.cashInHand + data.financialPosition.assets.bankBalances + data.financialPosition.assets.digitalWalletBalances).toFixed(2)],
      ['  Accounts Receivable', data.financialPosition.assets.accountsReceivable.toFixed(2)],
      ['  Inventory', data.financialPosition.assets.inventory.toFixed(2)],
      ['  Fixed Assets (Net Book Value)', data.financialPosition.assets.fixedAssetsNet.toFixed(2)],
      ['Total Liabilities', data.financialPosition.liabilities.totalLiabilities.toFixed(2)],
      ['  Supplier Payables', data.financialPosition.liabilities.supplierPayables.toFixed(2)],
      ['  Bank Loans & Borrowings', data.financialPosition.liabilities.loanBalances.toFixed(2)],
      ['  Tax Obligations', data.financialPosition.liabilities.taxLiabilities.toFixed(2)],
      ['Total Owner\'s Equity', data.financialPosition.equity.totalEquity.toFixed(2)],
      ['  Owner\'s Capital', data.financialPosition.equity.ownersCapital.toFixed(2)],
      ['  Retained Earnings', data.financialPosition.equity.retainedEarnings.toFixed(2)],
      ['  Current Period Net Profit', data.financialPosition.equity.currentPeriodProfitOrLoss.toFixed(2)],
      ['Status', data.financialPosition.isBalanced ? 'BALANCED' : `OUT OF BALANCE (Diff: ${data.financialPosition.balanceDifference.toFixed(2)})`],
      [],
      ['4. CASH FLOW SUMMARY'],
      ['Opening Cash Balance', data.cashFlow.openingCashBalance.toFixed(2)],
      ['Operating Cash Flow', data.cashFlow.operatingCashFlow.toFixed(2)],
      ['Investing Cash Flow', data.cashFlow.investingCashFlow.toFixed(2)],
      ['Financing Cash Flow', data.cashFlow.financingCashFlow.toFixed(2)],
      ['Net Change in Cash', data.cashFlow.netChangeInCash.toFixed(2)],
      ['Closing Cash Balance', data.cashFlow.closingCashBalance.toFixed(2)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Financial_Summary_${data.startDate}_to_${data.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Financial Summary
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 stroke-[1.25]', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !data}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !data}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.25]" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Range & Quick Preset Toolbar */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Start Date */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* End Date (Also acts as point-in-time Balance Sheet date) */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 stroke-[1.25]" />
              <span>End Date (Position As Of)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Quick Presets */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: 'this-week', label: 'This Week' },
                { id: 'this-month', label: 'This Month' },
                { id: 'this-quarter', label: 'This Quarter' },
                { id: 'this-year', label: 'This Year' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleQuickPreset(btn.id as any)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Selector */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comparison
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 dark:text-slate-200"
            >
              <option value="PREVIOUS_PERIOD">Previous Period</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
              <option value="NONE">No Comparison</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <p>Compiling executive financial data across General Ledger and subledgers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-8 text-center text-xs text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-3 px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-700 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!loading && !error && data && (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* 1. PRIMARY 4 OVERVIEW CARDS                              */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Net Revenue */}
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Net Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 stroke-[1.25]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {fmt(data.overviewCards.netRevenue.currentAmount)}
              </div>
              {data.overviewCards.netRevenue.hasComparison ? (
                <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-slate-400">vs Prior:</span>
                  <span
                    className={cn(
                      'font-semibold flex items-center gap-0.5',
                      data.overviewCards.netRevenue.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {data.overviewCards.netRevenue.variance >= 0 ? '+' : ''}
                    {fmt(data.overviewCards.netRevenue.variance)} ({data.overviewCards.netRevenue.variancePercentage}%)
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-[var(--border-subtle)]">
                  Dining, Catering &amp; Online Sales
                </div>
              )}
            </div>

            {/* 2. Net Profit */}
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Net Profit</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                  {data.overviewCards.netMarginPercentage}% Margin
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  data.overviewCards.netProfit.currentAmount >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                )}
              >
                {fmt(data.overviewCards.netProfit.currentAmount)}
              </div>
              {data.overviewCards.netProfit.hasComparison ? (
                <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-slate-400">vs Prior:</span>
                  <span
                    className={cn(
                      'font-semibold flex items-center gap-0.5',
                      data.overviewCards.netProfit.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {data.overviewCards.netProfit.variance >= 0 ? '+' : ''}
                    {fmt(data.overviewCards.netProfit.variance)} ({data.overviewCards.netProfit.variancePercentage}%)
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-[var(--border-subtle)]">
                  After all operating &amp; non-operating costs
                </div>
              )}
            </div>

            {/* 3. Cash and Bank Balance */}
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Cash &amp; Bank Liquidity</span>
                <Landmark className="w-4 h-4 text-blue-600 stroke-[1.25]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {fmt(data.overviewCards.cashAndBank.totalCashAndBank)}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[var(--border-subtle)]">
                <span>Cash: {fmt(data.overviewCards.cashAndBank.cashInHand)}</span>
                <span>Bank: {fmt(data.overviewCards.cashAndBank.bankBalance)}</span>
                <span>Wallet: {fmt(data.overviewCards.cashAndBank.walletBalance)}</span>
              </div>
            </div>

            {/* 4. Outstanding Payables */}
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <span>Outstanding Payables</span>
                <Truck className="w-4 h-4 text-amber-600 stroke-[1.25]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {fmt(data.overviewCards.payables.totalOutstandingPayables)}
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                <span className="text-rose-600 font-semibold">
                  Overdue: {fmt(data.overviewCards.payables.overduePayables)}
                </span>
                <Link
                  href="/accounts?tab=supplier-ledger"
                  className="text-indigo-600 hover:underline flex items-center gap-0.5 text-[10px]"
                >
                  <span>{data.overviewCards.payables.supplierCount} Suppliers</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. PERFORMANCE & POSITION SIDE-BY-SIDE                   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Performance (P&L Breakdown) */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Financial Performance (P&amp;L Summary)
                  </h3>
                </div>
                <Link
                  href="/accounts?tab=profit-loss"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Full P&amp;L Statement</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 flex-1 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Gross Sales</span>
                  <span className="font-mono">{fmt(data.performance.grossSales)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="pl-3">Less: Sales Discounts &amp; Returns</span>
                  <span className="font-mono text-rose-600">
                    -{fmt(data.performance.salesDiscounts + data.performance.salesReturns)}
                  </span>
                </div>

                <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pt-1 border-t border-[var(--border-subtle)]">
                  <span>Net Revenue</span>
                  <span className="font-mono">{fmt(data.performance.netRevenue)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Cost of Goods Sold (COGS - Food &amp; Beverages)</span>
                  <span className="font-mono text-rose-600">-{fmt(data.performance.costOfGoodsSold)}</span>
                </div>

                <div className="flex justify-between items-center font-bold bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span>Gross Profit</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({data.performance.grossMarginPercentage}% Margin)
                    </span>
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300">
                    {fmt(data.performance.grossProfit)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Operating Expenses (Payroll, Rent, Utilities, Maintenance)</span>
                  <span className="font-mono text-rose-600">-{fmt(data.performance.operatingExpenses)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="pl-3">Depreciation &amp; Amortization Expense</span>
                  <span className="font-mono text-rose-600">-{fmt(data.performance.depreciationExpense)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Other Income (Bank Interest, Vendor Discounts)</span>
                  <span className="font-mono text-emerald-600">+{fmt(data.performance.otherIncome)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="pl-3">Other Expenses &amp; Loan Interest</span>
                  <span className="font-mono text-rose-600">-{fmt(data.performance.otherExpenses)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="pl-3">Corporate Income Tax Expense</span>
                  <span className="font-mono text-rose-600">-{fmt(data.performance.incomeTaxExpense)}</span>
                </div>

                <div className="flex justify-between items-center font-extrabold text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 p-2.5 rounded-lg border border-emerald-300/40">
                  <span className="flex items-center gap-2">
                    <span>Net Profit for Period</span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      ({data.performance.netMarginPercentage}% Net Margin)
                    </span>
                  </span>
                  <span className="font-mono">{fmt(data.performance.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Financial Position (Balance Sheet Summary) */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Financial Position (As of {data.financialPosition.formattedAsOfDate})
                  </h3>
                </div>
                <Link
                  href="/accounts?tab=balance-sheet"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Full Balance Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 flex-1 space-y-4 text-xs">
                {/* Assets Summary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-[var(--border-subtle)] pb-1">
                    <span>A. Total Assets</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300">
                      {fmt(data.financialPosition.assets.totalAssets)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 text-[11px] pl-2">
                    <div className="flex justify-between">
                      <span>Cash &amp; Bank:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {fmt(data.financialPosition.assets.cashInHand + data.financialPosition.assets.bankBalances + data.financialPosition.assets.digitalWalletBalances)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accounts Receivable:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.assets.accountsReceivable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Food &amp; Supplies Inventory:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.assets.inventory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Fixed Assets:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.assets.fixedAssetsNet)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities Summary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-[var(--border-subtle)] pb-1">
                    <span>B. Total Liabilities</span>
                    <span className="font-mono text-amber-700 dark:text-amber-300">
                      {fmt(data.financialPosition.liabilities.totalLiabilities)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 text-[11px] pl-2">
                    <div className="flex justify-between">
                      <span>Supplier Payables:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.liabilities.supplierPayables)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank Loans &amp; Debt:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.liabilities.loanBalances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Liabilities (VAT/TDS):</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.liabilities.taxLiabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Booking Advances:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.liabilities.customerAdvances)}</span>
                    </div>
                  </div>
                </div>

                {/* Equity Summary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-[var(--border-subtle)] pb-1">
                    <span>C. Owner&apos;s Equity</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300">
                      {fmt(data.financialPosition.equity.totalEquity)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 text-[11px] pl-2">
                    <div className="flex justify-between">
                      <span>Owner Capital:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.equity.ownersCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retained Earnings:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.equity.retainedEarnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Net Earnings:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{fmt(data.financialPosition.equity.currentPeriodProfitOrLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Less Drawings:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">({fmt(data.financialPosition.equity.lessDrawings)})</span>
                    </div>
                  </div>
                </div>

                {/* Equation Balance Status Bar */}
                <div
                  className={cn(
                    'p-2.5 rounded-lg border flex items-center justify-between font-semibold text-xs',
                    data.financialPosition.isBalanced
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-200'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {data.financialPosition.isBalanced ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>Accounting Equation: Assets = Liab + Equity</span>
                  </div>
                  <span className="font-mono">
                    {data.financialPosition.isBalanced ? 'Balanced (0.00)' : `Diff: ${fmt(data.financialPosition.balanceDifference)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. CASH FLOW OVERVIEW & SUBLEDGERS                       */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cash Flow Summary Card */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Cash Flow Movements
                  </h3>
                </div>
                <Link
                  href="/accounts?tab=cash-flow"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Details</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Opening Cash (at start):</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{fmt(data.cashFlow.openingCashBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Operating Cash Flow:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {data.cashFlow.operatingCashFlow >= 0 ? '+' : ''}{fmt(data.cashFlow.operatingCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Investing Cash Flow:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {data.cashFlow.investingCashFlow >= 0 ? '+' : ''}{fmt(data.cashFlow.investingCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Financing Cash Flow:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {data.cashFlow.financingCashFlow >= 0 ? '+' : ''}{fmt(data.cashFlow.financingCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-[var(--border-subtle)]">
                  <span>Net Change in Cash:</span>
                  <span className="font-mono text-indigo-600">
                    {data.cashFlow.netChangeInCash >= 0 ? '+' : ''}{fmt(data.cashFlow.netChangeInCash)}
                  </span>
                </div>
                <div className="flex justify-between font-bold bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                  <span>Closing Cash (at end):</span>
                  <span className="font-mono text-slate-900 dark:text-white">{fmt(data.cashFlow.closingCashBalance)}</span>
                </div>
              </div>
            </div>

            {/* Receivables Subledger Summary Card */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Customer Receivables (AR)
                  </h3>
                </div>
                <Link
                  href="/accounts?tab=customer-ledger"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Ledger</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Outstanding AR</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {fmt(data.receivables.totalCustomerReceivables)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-[var(--border-subtle)]">
                  <span>Estimated Overdue:</span>
                  <span className="font-mono font-semibold text-rose-600">{fmt(data.receivables.overdueReceivables)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span>Active Credit Customers:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{data.receivables.customerCount} customers</span>
                </div>

                <Link
                  href="/accounts?tab=customer-ledger"
                  className="block text-center py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-indigo-600 font-semibold text-xs transition-colors"
                >
                  Open Customer Receivables
                </Link>
              </div>
            </div>

            {/* Payables Subledger Summary Card */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Supplier Payables (AP)
                  </h3>
                </div>
                <Link
                  href="/accounts?tab=supplier-ledger"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Ledger</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Outstanding AP</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {fmt(data.payables.totalSupplierPayables)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-[var(--border-subtle)]">
                  <span>Overdue Invoices:</span>
                  <span className="font-mono font-semibold text-rose-600">{fmt(data.payables.overduePayables)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span>Suppliers with Balances:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{data.payables.supplierCount} suppliers</span>
                </div>

                <Link
                  href="/accounts?tab=supplier-ledger"
                  className="block text-center py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-indigo-600 font-semibold text-xs transition-colors"
                >
                  Open Supplier Ledger
                </Link>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. VISUAL TREND TABLES                                   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Monthly Performance Trends (Past 6 Months)
                </span>
                <span className="text-[11px] text-slate-500">Revenue vs Costs vs Net Margin</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-slate-500 text-[10px] uppercase font-bold">
                      <th className="py-2 px-2">Month</th>
                      <th className="py-2 px-2 text-right">Revenue</th>
                      <th className="py-2 px-2 text-right">COGS</th>
                      <th className="py-2 px-2 text-right">Operating Costs</th>
                      <th className="py-2 px-2 text-right font-bold">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {data.performanceTrends.map((t) => (
                      <tr key={t.monthKey} className="hover:bg-[var(--surface-hover)]">
                        <td className="py-1.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{t.monthLabel}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-600">{fmt(t.netRevenue)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-rose-600">-{fmt(t.costOfGoodsSold)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-600 dark:text-slate-400">-{fmt(t.operatingExpenses)}</td>
                        <td
                          className={cn(
                            'py-1.5 px-2 text-right font-mono font-bold',
                            t.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {fmt(t.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cash Flow Trend */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Monthly Cash Flow Trends (Past 6 Months)
                </span>
                <span className="text-[11px] text-slate-500">Inflows vs Outflows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-slate-500 text-[10px] uppercase font-bold">
                      <th className="py-2 px-2">Month</th>
                      <th className="py-2 px-2 text-right text-emerald-600">Inflow</th>
                      <th className="py-2 px-2 text-right text-rose-600">Outflow</th>
                      <th className="py-2 px-2 text-right font-bold">Net Cash Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {data.cashFlowTrends.map((t) => (
                      <tr key={t.monthKey} className="hover:bg-[var(--surface-hover)]">
                        <td className="py-1.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{t.monthLabel}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-600">+{fmt(t.totalInflow)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-rose-600">-{fmt(t.totalOutflow)}</td>
                        <td
                          className={cn(
                            'py-1.5 px-2 text-right font-mono font-bold',
                            t.netChange >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {t.netChange >= 0 ? '+' : ''}{fmt(t.netChange)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">Everest Family Restaurant</h1>
        <h2 className="text-sm font-semibold text-slate-600">Executive Financial Summary Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">
          Period: {data?.formattedPeriod} | Position As Of: {data?.formattedAsOfDate} | Currency: NPR | Generated on: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}


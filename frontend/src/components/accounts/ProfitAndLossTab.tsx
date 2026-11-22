'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Printer,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  FileText,
  DollarSign,
  PieChart,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { profitAndLossApi } from '@/lib/api';
import {
  PnLStatementResponse,
  PnLSection,
  PnLLineItem,
  PnLComparisonMode,
  PnLDrilldownResponse
} from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function ProfitAndLossTab() {
  const router = useRouter();
  const { error: toastError } = useToast();

  // Primary State
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PnLStatementResponse | null>(null);

  // Filter & Period State
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [activePeriodPreset, setActivePeriodPreset] = useState<string>('THIS_MONTH');
  const [comparisonMode, setComparisonMode] = useState<PnLComparisonMode>('PREVIOUS_PERIOD');
  const [compareStartDate, setCompareStartDate] = useState('');
  const [compareEndDate, setCompareEndDate] = useState('');

  // UI Display Toggles
  const [showCharts, setShowCharts] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Drilldown Modal
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState<PnLDrilldownResponse | null>(null);
  const [isDrilldownModalOpen, setIsDrilldownModalOpen] = useState(false);

  // Period Preset Handlers
  const handleSelectPreset = (preset: string) => {
    setActivePeriodPreset(preset);
    const curr = new Date();

    if (preset === 'TODAY') {
      const todayStr = curr.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'THIS_WEEK') {
      const day = curr.getDay(); // 0 is Sunday
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(monday.toISOString().slice(0, 10));
      setEndDate(sunday.toISOString().slice(0, 10));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
      const lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'PREV_MONTH') {
      const firstDay = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      const lastDay = new Date(curr.getFullYear(), curr.getMonth(), 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'THIS_QUARTER') {
      const quarter = Math.floor(curr.getMonth() / 3);
      const firstDay = new Date(curr.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(curr.getFullYear(), (quarter + 1) * 3, 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'THIS_YEAR') {
      const firstDay = new Date(curr.getFullYear(), 0, 1);
      const lastDay = new Date(curr.getFullYear(), 11, 31);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    }
  };

  // Fetch P&L Statement
  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const res = await profitAndLossApi.getStatement({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        comparisonMode,
        compareStartDate: comparisonMode === 'CUSTOM' && compareStartDate ? new Date(compareStartDate).toISOString() : undefined,
        compareEndDate: comparisonMode === 'CUSTOM' && compareEndDate ? new Date(compareEndDate).toISOString() : undefined,
      });

      if (res) {
        setReportData(res);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to generate Profit & Loss statement.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, comparisonMode, compareStartDate, compareEndDate, toastError]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  // Section Toggle
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Open Account Drilldown
  const handleOpenDrilldown = async (item: PnLLineItem) => {
    if (!reportData) return;
    try {
      setDrilldownLoading(true);
      setIsDrilldownModalOpen(true);
      const res = await profitAndLossApi.getAccountDrilldown(
        item.accountId,
        reportData.period.startDate,
        reportData.period.endDate
      );
      setDrilldownData(res);
    } catch (err: any) {
      toastError('Failed to fetch account ledger drilldown: ' + (err?.message || ''));
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    const rows: any[] = [];

    // Header metadata
    rows.push(['EVEREST FAMILY RESTAURANT - PROFIT & LOSS STATEMENT']);
    rows.push([`Reporting Period: ${reportData.period.formattedPeriod}`]);
    if (reportData.period.hasComparison) {
      rows.push([`Comparison Period: ${reportData.period.formattedComparePeriod || ''}`]);
    }
    rows.push([]);

    reportData.sections.forEach((sec) => {
      rows.push([sec.title.toUpperCase(), '', '', '', '', '', '']);
      sec.items.forEach((item) => {
        rows.push([
          item.accountCode,
          `"${item.accountName.replace(/"/g, '""')}"`,
          item.subCategory,
          item.isContra ? -item.currentAmount : item.currentAmount,
          reportData.period.hasComparison ? (item.isContra ? -item.compareAmount : item.compareAmount) : '',
          reportData.period.hasComparison ? item.variance : '',
          reportData.period.hasComparison ? `${item.variancePercentage}%` : '',
        ]);
      });
      rows.push([
        '',
        `Total ${sec.title}`,
        '',
        sec.currentTotal,
        reportData.period.hasComparison ? sec.compareTotal : '',
        reportData.period.hasComparison ? sec.variance : '',
        reportData.period.hasComparison ? `${sec.variancePercentage}%` : '',
      ]);
      rows.push([]);
    });

    // Summary block
    const sum = reportData.summaryCards;
    rows.push(['FINANCIAL SUMMARY']);
    rows.push(['Total Net Revenue', '', '', sum.totalNetRevenue, reportData.period.hasComparison ? sum.compareNetRevenue : '']);
    rows.push(['Gross Profit', '', '', sum.grossProfit, reportData.period.hasComparison ? sum.compareGrossProfit : '', `Margin: ${sum.grossProfitMargin}%`]);
    rows.push(['Operating Profit (EBITDA)', '', '', sum.operatingProfit, reportData.period.hasComparison ? sum.compareOperatingProfit : '', `Margin: ${sum.operatingProfitMargin}%`]);
    rows.push(['Net Profit / Loss After Tax', '', '', sum.netProfitAfterTax, reportData.period.hasComparison ? sum.compareNetProfitAfterTax : '', `Margin: ${sum.netProfitMargin}%`]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Profit_and_Loss_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sum = reportData?.summaryCards;
  const period = reportData?.period;
  const hasComp = period?.hasComparison ?? false;

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* 1. Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href="/accounts" label="Back" />
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Profit &amp; Loss Statement (P&amp;L)
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCharts((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              showCharts
                ? 'bg-emerald-50 border-emerald-600 text-[#0B3D32] dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>{showCharts ? 'Hide Visuals' : 'Show Visuals'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={fetchStatement}
            disabled={loading}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0B3D32]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Controls & Period Selection Bar */}
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs space-y-3">
        {/* Preset Quick Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase">Period:</span>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'PREV_MONTH', label: 'Previous Month' },
            { id: 'THIS_QUARTER', label: 'This Quarter' },
            { id: 'THIS_YEAR', label: 'This Year' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleSelectPreset(chip.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activePeriodPreset === chip.id
                  ? 'bg-[#0B3D32] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Comparison Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePeriodPreset('CUSTOM');
              }}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePeriodPreset('CUSTOM');
              }}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Comparison Mode
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as PnLComparisonMode)}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#0B3D32]"
            >
              <option value="NONE">No Comparison</option>
              <option value="PREVIOUS_PERIOD">Compare Previous Period</option>
              <option value="PREVIOUS_YEAR">Compare Previous Year</option>
              <option value="CUSTOM">Custom Comparison</option>
            </select>
          </div>

          {comparisonMode === 'CUSTOM' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Compare Start
                </label>
                <input
                  type="date"
                  value={compareStartDate}
                  onChange={(e) => setCompareStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Compare End
                </label>
                <input
                  type="date"
                  value={compareEndDate}
                  onChange={(e) => setCompareEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchStatement}
              disabled={loading}
              className="w-full px-3 py-1.5 rounded font-semibold bg-[#0B3D32] hover:bg-[#082b23] text-white flex items-center justify-center gap-1.5 shadow-xs"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Optional Visual Analytics Section */}
      {showCharts && reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs">
          {/* Monthly Trend Bars */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
              <span>Monthly Financial Performance (Last 6 Months)</span>
              <span className="text-[10px] text-slate-400 font-normal">Revenue vs Expenses</span>
            </h4>
            <div className="space-y-2 text-xs">
              {reportData.monthlyTrends.map((m) => {
                const maxVal = Math.max(...reportData.monthlyTrends.map((t) => Math.max(t.revenue, t.operatingExpenses + t.cogs, 1)));
                const revWidth = `${Math.min(100, Math.round((m.revenue / maxVal) * 100))}%`;
                const costWidth = `${Math.min(100, Math.round(((m.cogs + m.operatingExpenses) / maxVal) * 100))}%`;

                return (
                  <div key={m.monthKey} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{m.monthLabel}</span>
                      <span className={`font-bold ${m.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Net: Rs. {m.netProfit.toLocaleString()}
                      </span>
                    </div>
                    {/* Revenue Bar */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: revWidth }} className="bg-emerald-500 rounded-full" title={`Revenue: Rs. ${m.revenue.toLocaleString()}`} />
                    </div>
                    {/* Cost & Expense Bar */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: costWidth }} className="bg-amber-500 rounded-full" title={`Costs: Rs. ${(m.cogs + m.operatingExpenses).toLocaleString()}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> COGS &amp; Operating Expenses
              </span>
            </div>
          </div>

          {/* Operating Expense Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
              <span>Operating Expense Distribution</span>
              <span className="text-[10px] text-slate-400 font-normal">By Subcategory</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              {reportData.expenseCategoryBreakdown.map((exp) => (
                <div key={exp.categoryName} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300">{exp.categoryName}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Rs. {exp.amount.toLocaleString()} ({exp.percentageOfExpenses}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, exp.percentageOfExpenses)}%` }}
                      className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Profit & Loss Statement Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-xs overflow-hidden">
        {/* Table Sub-header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Statement of Comprehensive Income
            </span>
            <div className="text-[11px] text-slate-500">
              Period: <span className="font-semibold text-slate-700 dark:text-slate-300">{period?.formattedPeriod}</span>
              {hasComp && period?.formattedComparePeriod && (
                <span> vs. <span className="font-semibold text-slate-700 dark:text-slate-300">{period.formattedComparePeriod}</span></span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Values in NPR (Rs.)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Particulars / Financial Accounts</th>
                <th className="py-2.5 px-3 text-right">Current Period</th>
                {hasComp && (
                  <>
                    <th className="py-2.5 px-3 text-right">Previous Period</th>
                    <th className="py-2.5 px-3 text-right">Variance (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Change (%)</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={hasComp ? 5 : 2} className="py-16 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                      <span>Reconciling General Ledger entries...</span>
                    </div>
                  </td>
                </tr>
              ) : !reportData ? (
                <tr>
                  <td colSpan={hasComp ? 5 : 2} className="py-12 text-center text-slate-400">
                    No accounting entries found for selected period.
                  </td>
                </tr>
              ) : (
                <>
                  {/* ======================================================== */}
                  {/* SECTION 1: OPERATING REVENUE                             */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'REVENUE');
                    if (!sec) return null;
                    const isCollapsed = collapsedSections[sec.sectionKey];

                    return (
                      <>
                        <tr
                          onClick={() => toggleSection(sec.sectionKey)}
                          className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors font-bold text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>A. {sec.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-bold">
                            Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {hasComp && (
                            <>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                                Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${sec.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sec.variance >= 0 ? '+' : ''} Rs. {sec.variance.toLocaleString()}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-semibold ${sec.variancePercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sec.variancePercentage >= 0 ? '+' : ''}{sec.variancePercentage}%
                              </td>
                            </>
                          )}
                        </tr>

                        {!isCollapsed &&
                          sec.items.map((item) => (
                            <tr
                              key={item.accountId}
                              onClick={() => handleOpenDrilldown(item)}
                              className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 px-3 pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-400">{item.accountCode}</span>
                                  <span className="hover:underline hover:text-[#0B3D32] dark:hover:text-emerald-400">
                                    {item.accountName}
                                  </span>
                                  {item.isContra && (
                                    <span className="text-[9px] px-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                                      Contra / Deduction
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">
                                {item.isContra ? `(Rs. ${item.currentAmount.toLocaleString()})` : `Rs. ${item.currentAmount.toLocaleString()}`}
                              </td>
                              {hasComp && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-500">
                                    {item.isContra ? `(Rs. ${item.compareAmount.toLocaleString()})` : `Rs. ${item.compareAmount.toLocaleString()}`}
                                  </td>
                                  <td className={`py-2 px-3 text-right font-medium ${item.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.variance >= 0 ? '+' : ''} Rs. {item.variance.toLocaleString()}
                                  </td>
                                  <td className={`py-2 px-3 text-right ${item.variancePercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage}%
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* SECTION 2: COST OF GOODS SOLD (COGS)                     */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'COGS');
                    if (!sec) return null;
                    const isCollapsed = collapsedSections[sec.sectionKey];

                    return (
                      <>
                        <tr
                          onClick={() => toggleSection(sec.sectionKey)}
                          className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors font-bold text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>B. {sec.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-bold">
                            Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {hasComp && (
                            <>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                                Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${sec.variance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {sec.variance >= 0 ? '+' : ''} Rs. {sec.variance.toLocaleString()}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-semibold ${sec.variancePercentage <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {sec.variancePercentage >= 0 ? '+' : ''}{sec.variancePercentage}%
                              </td>
                            </>
                          )}
                        </tr>

                        {!isCollapsed &&
                          sec.items.map((item) => (
                            <tr
                              key={item.accountId}
                              onClick={() => handleOpenDrilldown(item)}
                              className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 px-3 pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-400">{item.accountCode}</span>
                                  <span className="hover:underline hover:text-amber-700 dark:hover:text-amber-400">
                                    {item.accountName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">
                                Rs. {item.currentAmount.toLocaleString()}
                              </td>
                              {hasComp && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-500">
                                    Rs. {item.compareAmount.toLocaleString()}
                                  </td>
                                  <td className={`py-2 px-3 text-right font-medium ${item.variance <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {item.variance >= 0 ? '+' : ''} Rs. {item.variance.toLocaleString()}
                                  </td>
                                  <td className={`py-2 px-3 text-right ${item.variancePercentage <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage}%
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* TOTAL GROSS PROFIT ROW                                   */}
                  {/* ======================================================== */}
                  {sum && (
                    <tr className="bg-emerald-100/60 dark:bg-emerald-950/60 font-bold text-emerald-950 dark:text-emerald-200 border-y-2 border-emerald-300 dark:border-emerald-800">
                      <td className="py-3 px-3 uppercase tracking-wider text-xs">
                        Gross Profit (Net Revenue – COGS)
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-extrabold text-[#0B3D32] dark:text-emerald-300">
                        Rs. {sum.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="block text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                          {sum.grossProfitMargin}% Margin
                        </span>
                      </td>
                      {hasComp && (
                        <>
                          <td className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-400 font-semibold">
                            Rs. {sum.compareGrossProfit.toLocaleString()}
                            <span className="block text-[10px] font-normal">
                              {sum.compareGrossProfitMargin}% Margin
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-right font-bold ${sum.grossProfit >= sum.compareGrossProfit ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>
                            {sum.grossProfit >= sum.compareGrossProfit ? '+' : ''} Rs. {(sum.grossProfit - sum.compareGrossProfit).toLocaleString()}
                          </td>
                          <td className={`py-3 px-3 text-right font-bold ${sum.grossProfitGrowthPercentage >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>
                            {sum.grossProfitGrowthPercentage >= 0 ? '+' : ''}{sum.grossProfitGrowthPercentage}%
                          </td>
                        </>
                      )}
                    </tr>
                  )}

                  {/* ======================================================== */}
                  {/* SECTION 3: OPERATING EXPENSES                            */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'OPERATING_EXPENSES');
                    if (!sec) return null;
                    const isCollapsed = collapsedSections[sec.sectionKey];

                    return (
                      <>
                        <tr
                          onClick={() => toggleSection(sec.sectionKey)}
                          className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors font-bold text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>C. {sec.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-bold">
                            Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {hasComp && (
                            <>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                                Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${sec.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sec.variance >= 0 ? '+' : ''} Rs. {sec.variance.toLocaleString()}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-semibold ${sec.variancePercentage <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sec.variancePercentage >= 0 ? '+' : ''}{sec.variancePercentage}%
                              </td>
                            </>
                          )}
                        </tr>

                        {!isCollapsed &&
                          sec.items.map((item) => (
                            <tr
                              key={item.accountId}
                              onClick={() => handleOpenDrilldown(item)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 px-3 pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-400">{item.accountCode}</span>
                                  <span className="hover:underline hover:text-slate-900 dark:hover:text-white">
                                    {item.accountName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">({item.subCategory})</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">
                                Rs. {item.currentAmount.toLocaleString()}
                              </td>
                              {hasComp && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-500">
                                    Rs. {item.compareAmount.toLocaleString()}
                                  </td>
                                  <td className={`py-2 px-3 text-right font-medium ${item.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.variance >= 0 ? '+' : ''} Rs. {item.variance.toLocaleString()}
                                  </td>
                                  <td className={`py-2 px-3 text-right ${item.variancePercentage <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage}%
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* OPERATING PROFIT (EBITDA) ROW                            */}
                  {/* ======================================================== */}
                  {sum && (
                    <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 font-bold text-indigo-950 dark:text-indigo-200 border-y border-indigo-200 dark:border-indigo-800">
                      <td className="py-2.5 px-3 uppercase tracking-wider text-xs">
                        Operating Profit / EBITDA (Gross Profit – Operating Expenses)
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold text-indigo-900 dark:text-indigo-300">
                        Rs. {sum.operatingProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="block text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                          {sum.operatingProfitMargin}% Margin
                        </span>
                      </td>
                      {hasComp && (
                        <>
                          <td className="py-2.5 px-3 text-right text-indigo-700 dark:text-indigo-400">
                            Rs. {sum.compareOperatingProfit.toLocaleString()}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${sum.operatingProfit >= sum.compareOperatingProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {sum.operatingProfit >= sum.compareOperatingProfit ? '+' : ''} Rs. {(sum.operatingProfit - sum.compareOperatingProfit).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            —
                          </td>
                        </>
                      )}
                    </tr>
                  )}

                  {/* ======================================================== */}
                  {/* SECTION 4: OTHER INCOME                                  */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'OTHER_INCOME');
                    if (!sec) return null;
                    const isCollapsed = collapsedSections[sec.sectionKey];

                    return (
                      <>
                        <tr
                          onClick={() => toggleSection(sec.sectionKey)}
                          className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors font-bold text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>D. {sec.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-bold">
                            Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {hasComp && (
                            <>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                                Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium">
                                Rs. {sec.variance.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {sec.variancePercentage}%
                              </td>
                            </>
                          )}
                        </tr>

                        {!isCollapsed &&
                          sec.items.map((item) => (
                            <tr
                              key={item.accountId}
                              onClick={() => handleOpenDrilldown(item)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 px-3 pl-8">
                                <span className="font-mono text-[10px] text-slate-400 mr-2">{item.accountCode}</span>
                                {item.accountName}
                              </td>
                              <td className="py-2 px-3 text-right">Rs. {item.currentAmount.toLocaleString()}</td>
                              {hasComp && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-500">Rs. {item.compareAmount.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right">Rs. {item.variance.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right">{item.variancePercentage}%</td>
                                </>
                              )}
                            </tr>
                          ))}
                      </>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* SECTION 5: OTHER EXPENSES (FINANCING & LOSSES)           */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'OTHER_EXPENSES');
                    if (!sec) return null;
                    const isCollapsed = collapsedSections[sec.sectionKey];

                    return (
                      <>
                        <tr
                          onClick={() => toggleSection(sec.sectionKey)}
                          className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors font-bold text-slate-800 dark:text-slate-200"
                        >
                          <td className="py-2.5 px-3 flex items-center gap-1.5">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            <span>E. {sec.title}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-bold">
                            Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {hasComp && (
                            <>
                              <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                                Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium">
                                Rs. {sec.variance.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {sec.variancePercentage}%
                              </td>
                            </>
                          )}
                        </tr>

                        {!isCollapsed &&
                          sec.items.map((item) => (
                            <tr
                              key={item.accountId}
                              onClick={() => handleOpenDrilldown(item)}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 px-3 pl-8">
                                <span className="font-mono text-[10px] text-slate-400 mr-2">{item.accountCode}</span>
                                {item.accountName}
                              </td>
                              <td className="py-2 px-3 text-right">Rs. {item.currentAmount.toLocaleString()}</td>
                              {hasComp && (
                                <>
                                  <td className="py-2 px-3 text-right text-slate-500">Rs. {item.compareAmount.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right">Rs. {item.variance.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-right">{item.variancePercentage}%</td>
                                </>
                              )}
                            </tr>
                          ))}
                      </>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* SECTION 6: INCOME TAX EXPENSE                            */}
                  {/* ======================================================== */}
                  {(() => {
                    const sec = reportData.sections.find((s) => s.sectionKey === 'TAX_EXPENSE');
                    if (!sec) return null;

                    return (
                      <tr className="text-slate-600 dark:text-slate-400 font-medium">
                        <td className="py-2 px-3 pl-8">
                          <span>F. Income Tax Provision &amp; Expense</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          Rs. {sec.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {hasComp && (
                          <>
                            <td className="py-2 px-3 text-right text-slate-500">
                              Rs. {sec.compareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right">
                              Rs. {sec.variance.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {sec.variancePercentage}%
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* FINAL NET PROFIT / LOSS AFTER TAX ROW                    */}
                  {/* ======================================================== */}
                  {sum && (
                    <tr className={`border-t-2 border-b-4 font-bold ${
                      sum.netProfitAfterTax >= 0
                        ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700'
                        : 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700'
                    }`}>
                      <td className="py-3 px-3 uppercase tracking-wider text-sm font-extrabold flex items-center justify-between">
                        <span>Net Profit / (Loss) After Tax</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 font-bold">
                          {sum.netProfitAfterTax >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-base font-extrabold">
                        Rs. {sum.netProfitAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="block text-[11px] font-semibold opacity-90">
                          {sum.netProfitMargin}% Net Margin
                        </span>
                      </td>
                      {hasComp && (
                        <>
                          <td className="py-3 px-3 text-right font-bold opacity-80">
                            Rs. {sum.compareNetProfitAfterTax.toLocaleString()}
                            <span className="block text-[11px] font-normal">
                              {sum.compareNetProfitMargin}% Margin
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            {sum.netProfitAfterTax >= sum.compareNetProfitAfterTax ? '+' : ''} Rs. {(sum.netProfitAfterTax - sum.compareNetProfitAfterTax).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold">
                            {sum.netProfitGrowthPercentage >= 0 ? '+' : ''}{sum.netProfitGrowthPercentage}%
                          </td>
                        </>
                      )}
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ACCOUNT GENERAL LEDGER DRILLDOWN                                   */}
      {/* ========================================================================= */}
      {isDrilldownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0B3D32] dark:text-emerald-400">
                    {drilldownData?.account.accountCode}
                  </span>
                  <span className="text-slate-400">•</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {drilldownData?.account.accountName}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {drilldownData?.account.subCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  General Ledger audit drilldown for period: {period?.formattedPeriod}
                </p>
              </div>
              <button
                onClick={() => setIsDrilldownModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drilldownLoading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B3D32]" />
                <span>Loading General Ledger entries...</span>
              </div>
            ) : drilldownData ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Summary Banner */}
                <div className="grid grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Debit Entries</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      Rs. {drilldownData.totals.totalDebit.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Credit Entries</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      Rs. {drilldownData.totals.totalCredit.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Net Statement Movement</span>
                    <div className="font-bold text-[#0B3D32] dark:text-emerald-400">
                      Rs. {drilldownData.totals.netMovement.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Journal Vouchers</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {drilldownData.totals.transactionCount} Lines
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-semibold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">JV Number</th>
                        <th className="py-2 px-3">Narration &amp; Description</th>
                        <th className="py-2 px-3">Source Module</th>
                        <th className="py-2 px-3 text-right">Debit (Rs.)</th>
                        <th className="py-2 px-3 text-right">Credit (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {drilldownData.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(tx.entryDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 whitespace-nowrap">
                            {tx.entryNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                            <div>{tx.description}</div>
                            {tx.lineDescription && (
                              <div className="text-[11px] text-slate-500">{tx.lineDescription}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {tx.sourceModule}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                            {tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                            {tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
              <Link
                href={`/accounts?tab=general-ledger&accountCode=${drilldownData?.account.accountCode || ''}`}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full General Ledger</span>
              </Link>

              <button
                onClick={() => setIsDrilldownModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

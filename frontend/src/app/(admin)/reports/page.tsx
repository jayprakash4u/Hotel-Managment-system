'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, UtensilsCrossed, Download, BarChart3, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { DashboardMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

const TABS: Array<{ id: 'executive' | 'fnb' | 'pnl'; label: string; icon: any }> = [
  { id: 'executive', label: 'Executive Summary & RevPAR', icon: BarChart3 },
  { id: 'fnb', label: 'F&B & Outlets Performance', icon: UtensilsCrossed },
  { id: 'pnl', label: 'Profit & Loss', icon: DollarSign },
];

export default function ReportsPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'executive' | 'fnb' | 'inventory' | 'pnl'>('executive');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setMetrics(data);
    } catch (e: any) {
      toast.error('Failed to load reports', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    toast.success('Report Exported', 'CSV download initiated for audit archive.');
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports & Analytics" subtitle="Aggregating performance metrics..." />
        <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  // P&L Mock Calculations
  const roomRevenue = metrics.occupiedRooms * metrics.adr * 30;
  const fnbRevenue = 14500;
  const spaRevenue = 8200;
  const totalGrossRevenue = roomRevenue + fnbRevenue + spaRevenue;
  const operatingExpenses = 18400;
  const netOperatingProfit = totalGrossRevenue - operatingExpenses;
  const profitMargin = Math.round((netOperatingProfit / totalGrossRevenue) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Revenue velocity, ADR & RevPAR performance, F&B outlet yields, and Profit & Loss statements"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="gold" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export Report (CSV)
            </Button>
          </>
        }
      />

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Daily Rate (ADR)</span>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">{formatCurrency(metrics.adr)}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">+12.4% vs Industry Par</p>
            </div>

            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">RevPAR</span>
              <p className="text-2xl font-semibold text-amber-700 dark:text-amber-400 mt-1.5 font-heading">{formatCurrency(metrics.revpar)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Revenue Per Available Room</p>
            </div>

            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Occupancy</span>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 font-heading">{metrics.occupancyRate}%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">{metrics.occupiedRooms} Active Suites In-House</p>
            </div>

            <div className={`p-5 ${cardClass}`}>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Yield</span>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">{formatCurrency(totalGrossRevenue)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Lodging, Outlets & Spa Total</p>
            </div>
          </div>

          {/* Floor Performance Breakdown Table */}
          <div className={`p-6 ${cardClass} space-y-4`}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Floor & Category Yield Analysis</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Floor</TableHead>
                  <TableHead>Total Inventory</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Occupancy Rate</TableHead>
                  <TableHead className="text-right">Projected Monthly Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.floorBreakdown.map((fl) => {
                  const rate = fl.total > 0 ? Math.round((fl.occupied / fl.total) * 100) : 0;
                  const proj = fl.occupied * metrics.adr * 30;
                  return (
                    <TableRow key={fl.floor}>
                      <TableCell className="font-medium text-slate-900 dark:text-white">Floor {fl.floor}</TableCell>
                      <TableCell className="text-xs">{fl.total} Suites</TableCell>
                      <TableCell className="text-xs font-medium text-blue-600 dark:text-blue-400">{fl.occupied} In-House</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div style={{ width: `${rate}%` }} className="bg-amber-500 h-full" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-700 dark:text-amber-400">{formatCurrency(proj)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: F&B & OUTLETS PERFORMANCE */}
      {activeTab === 'fnb' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-5 ${cardClass}`}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Le Ciel Fine Dining</span>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1.5 font-heading">$8,450.00</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Avg check: $185.00 / table</p>
          </div>

          <div className={`p-5 ${cardClass}`}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Skyline 360 Lounge</span>
            <p className="text-xl font-semibold text-amber-700 dark:text-amber-400 mt-1.5 font-heading">$4,250.00</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cocktails & bottle service</p>
          </div>

          <div className={`p-5 ${cardClass}`}>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Zenith Wellness Spa</span>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 font-heading">$8,200.00</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Massages & facial treatments</p>
          </div>
        </div>
      )}

      {/* TAB 3: PROFIT & LOSS (P&L) */}
      {activeTab === 'pnl' && (
        <div className={`p-6 ${cardClass} space-y-5`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">Monthly Profit & Loss Statement</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fiscal Period: August 2026</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium">
              {profitMargin}% Operating Margin
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Rooms & Lodging Revenue</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(roomRevenue)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>F&B & Outlets Revenue</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(fnbRevenue)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
              <span>Zenith Spa & Amenities</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(spaRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-100 dark:border-slate-800 font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              <span>Total Gross Revenue</span>
              <span>{formatCurrency(totalGrossRevenue)}</span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">Operating Expenses</span>
              <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400">
                <span>Staff Salaries & Benefits</span>
                <span>$9,800.00</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400">
                <span>F&B Raw Materials & Produce</span>
                <span>$4,200.00</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400">
                <span>Utilities, Power & Water</span>
                <span>$3,200.00</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400">
                <span>Maintenance & Linen Restock</span>
                <span>$1,200.00</span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-100 dark:border-slate-800 font-semibold text-sm text-rose-600 dark:text-rose-400">
                <span>Total Operating Expenses</span>
                <span>{formatCurrency(operatingExpenses)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-base font-semibold text-slate-900 dark:text-white">
              <span>Net Operating Income (NOI)</span>
              <span className="text-amber-700 dark:text-amber-400 font-heading text-lg">{formatCurrency(netOperatingProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

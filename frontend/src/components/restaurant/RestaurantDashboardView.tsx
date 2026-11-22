'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  CalendarDays,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RestaurantDashboardSummaryData, WeeklySalesDayItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export const RestaurantDashboardView: React.FC = () => {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<RestaurantDashboardSummaryData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getRestaurantDashboardSummary();
      const data = (res as any)?.data || res;
      if (data && typeof data === 'object') {
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Failed to load restaurant dashboard summary:', err);
      if (isManual) {
        error('Could not refresh dashboard data. Please check your network connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format currency in NPR: रु 12,500
  const formatNpr = (amount: number | undefined | null): string => {
    const val = Number(amount) || 0;
    return val.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    });
  };

  const { maxSales, peakDay } = useMemo(() => {
    if (!summaryData?.weeklySales || summaryData.weeklySales.length === 0) {
      return { maxSales: 0, peakDay: null };
    }
    const salesArr = summaryData.weeklySales.map((d) => d.sales);
    const max = Math.max(...salesArr);
    const peak = summaryData.weeklySales.find((d) => d.sales === max && max > 0) || null;
    return { maxSales: max, peakDay: peak };
  }, [summaryData]);

  // Y-axis grid scale increments (4 intervals)
  const yAxisTicks = useMemo(() => {
    const ceiling = maxSales > 0 ? Math.ceil(maxSales * 1.2) : 10000;
    const factor = Math.pow(10, Math.floor(Math.log10(ceiling || 1)));
    const roundedCeiling = Math.ceil(ceiling / factor) * factor;
    return [
      roundedCeiling,
      Math.round((roundedCeiling * 3) / 4),
      Math.round(roundedCeiling / 2),
      Math.round(roundedCeiling / 4),
      0,
    ];
  }, [maxSales]);

  const maxChartValue = yAxisTicks[0] || 10000;

  // Loading Skeleton State
  if (loading && !summaryData) {
    return (
      <div className="space-y-4 animate-pulse select-none">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* 3 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-2"
            >
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-3">
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-52 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
      </div>
    );
  }

  const {
    todaySales = 0,
    yesterdaySales = 0,
    percentageChange = 0,
    isIncrease = true,
    last7DaysSales = 0,
    todayOrders = 0,
    currencySymbol = 'रु',
    weeklySales = [],
  } = summaryData || {};

  return (
    <div className="space-y-4 select-none font-sans">
      {/* 1. CLEAN HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Restaurant Dashboard
        </h1>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={cn('w-3 h-3 text-slate-500', refreshing && 'animate-spin')} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 2. SUMMARY CARDS (ONE ROW - 3 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Today's Sales */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Today&apos;s Sales</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
          </div>

          <div className="mt-2 mb-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {currencySymbol} {formatNpr(todaySales)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            {percentageChange === 0 ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Minus className="w-2.5 h-2.5" />
                0.0%
              </span>
            ) : isIncrease ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <ArrowUpRight className="w-3 h-3" />
                +{percentageChange}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                <ArrowDownRight className="w-3 h-3" />
                {percentageChange}%
              </span>
            )}
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">vs yesterday</span>
          </div>
        </div>

        {/* Card 2: Yesterday's Sales */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Yesterday&apos;s Sales</span>
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>

          <div className="mt-2 mb-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {currencySymbol} {formatNpr(yesterdaySales)}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Previous day
          </span>
        </div>

        {/* Card 3: Last 7 Days Sales */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Last 7 Days Sales</span>
            <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="mt-2 mb-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
              {currencySymbol} {formatNpr(last7DaysSales)}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Past 7 days
          </span>
        </div>
      </div>

      {/* 3. WEEKLY SALES REPORT (CLEAN BAR CHART ONLY) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-2xs">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Weekly Sales Report
          </h2>

          {peakDay && peakDay.sales > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
              Peak: {peakDay.dayName} ({currencySymbol} {formatNpr(peakDay.sales)})
            </span>
          )}
        </div>

        {/* Bar Chart */}
        <div className="pt-6 pb-2">
          {weeklySales.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400 dark:text-slate-500">
              No sales records found for the past seven days.
            </div>
          ) : (
            <div className="relative">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 select-none">
                {yAxisTicks.map((tick, idx) => (
                  <div key={idx} className="flex items-center w-full">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 w-12 text-right pr-2">
                      {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                    </span>
                    <div className="flex-1 border-b border-slate-100 dark:border-slate-800/80" />
                  </div>
                ))}
              </div>

              {/* 7 Bars Container */}
              <div className="relative h-56 pl-12 pt-2 pb-7 flex items-end justify-between gap-3 sm:gap-6">
                {weeklySales.map((item, idx) => {
                  const heightPercent =
                    maxChartValue > 0
                      ? Math.min(100, Math.max(item.sales > 0 ? 5 : 2, (item.sales / maxChartValue) * 100))
                      : 4;

                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={item.date}
                      className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Clean Hover Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-10 z-30 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] py-1 px-2.5 rounded shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-100">
                          <span className="font-bold">{currencySymbol} {formatNpr(item.sales)}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-1.5">({item.orderCount} orders)</span>
                        </div>
                      )}

                      {/* Bar Column Track */}
                      <div className="w-full max-w-[36px] sm:max-w-[44px] h-full flex items-end justify-center">
                        <div className="w-full h-full bg-slate-100/70 dark:bg-slate-800/50 rounded-t flex items-end justify-center overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={cn(
                              'w-full rounded-t transition-all duration-200',
                              item.isToday
                                ? 'bg-[#0B3D32] dark:bg-emerald-500 ring-1 ring-emerald-400/50'
                                : item.isHighest && item.sales > 0
                                ? 'bg-emerald-700 dark:bg-emerald-600'
                                : item.sales === 0
                                ? 'bg-slate-200 dark:bg-slate-700'
                                : 'bg-[#0B3D32]/85 dark:bg-emerald-600/80',
                              isHovered && 'brightness-110'
                            )}
                          />
                        </div>
                      </div>

                      {/* X-Axis Label */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            item.isToday
                              ? 'text-[#0B3D32] dark:text-emerald-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {item.dayName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

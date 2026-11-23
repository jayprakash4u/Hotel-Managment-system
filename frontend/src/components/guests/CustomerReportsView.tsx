'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  UtensilsCrossed,
  BedDouble,
  Clock,
  Download,
  Filter,
  Calendar,
  Eye,
} from 'lucide-react';
import { Guest360ProfileRecord } from '@/lib/guest360Data';
import { cn } from '@/lib/utils';

interface CustomerReportsViewProps {
  guests: Guest360ProfileRecord[];
  onSelectGuest: (guest: Guest360ProfileRecord) => void;
}

type ReportType =
  | 'MOST_FREQUENT'
  | 'HIGHEST_SPENDING'
  | 'RESTAURANT_SPENDING'
  | 'HOTEL_SPENDING'
  | 'INACTIVE_GUESTS'
  | 'MEMBERSHIP_DISTRIBUTION';

export function CustomerReportsView({ guests, onSelectGuest }: CustomerReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('HIGHEST_SPENDING');

  // Sorted and filtered report datasets
  const reportData = useMemo(() => {
    const list = [...guests];
    if (selectedReport === 'MOST_FREQUENT') {
      return list.sort((a, b) => b.totalVisits - a.totalVisits);
    }
    if (selectedReport === 'HIGHEST_SPENDING') {
      return list.sort((a, b) => b.totalSpending - a.totalSpending);
    }
    if (selectedReport === 'RESTAURANT_SPENDING') {
      return list.sort((a, b) => (b.restaurantSpending || 0) - (a.restaurantSpending || 0));
    }
    if (selectedReport === 'HOTEL_SPENDING') {
      return list.sort((a, b) => (b.roomSpending || 0) - (a.roomSpending || 0));
    }
    if (selectedReport === 'INACTIVE_GUESTS') {
      return list.filter((g) => g.currentStatus === 'CHECKED_OUT').sort((a, b) => a.lastVisitDate.localeCompare(b.lastVisitDate));
    }
    // Default membership
    return list.sort((a, b) => b.totalVisits - a.totalVisits);
  }, [guests, selectedReport]);

  return (
    <div className="space-y-4 text-xs select-none animate-in fade-in duration-150">
      {/* Report Switcher Header */}
      <div className="p-4 rounded-[4px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Customer Analytics &amp; Intelligence Reports
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Comprehensive business insights across hotel stays, restaurant visits, and VIP loyalty tiers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>

        {/* 6 Report Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedReport('HIGHEST_SPENDING')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] font-bold border transition-colors cursor-pointer',
              selectedReport === 'HIGHEST_SPENDING' ? 'bg-[#0B3D32] text-white border-[#0B3D32]' : 'bg-white border-slate-300 text-slate-700'
            )}
          >
            Highest Spending Guests
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('MOST_FREQUENT')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] font-bold border transition-colors cursor-pointer',
              selectedReport === 'MOST_FREQUENT' ? 'bg-[#0B3D32] text-white border-[#0B3D32]' : 'bg-white border-slate-300 text-slate-700'
            )}
          >
            Most Frequent Guests
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('RESTAURANT_SPENDING')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] font-bold border transition-colors cursor-pointer',
              selectedReport === 'RESTAURANT_SPENDING' ? 'bg-[#0B3D32] text-white border-[#0B3D32]' : 'bg-white border-slate-300 text-slate-700'
            )}
          >
            Restaurant Spending by Customer
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('HOTEL_SPENDING')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] font-bold border transition-colors cursor-pointer',
              selectedReport === 'HOTEL_SPENDING' ? 'bg-[#0B3D32] text-white border-[#0B3D32]' : 'bg-white border-slate-300 text-slate-700'
            )}
          >
            Hotel Spending by Customer
          </button>

          <button
            type="button"
            onClick={() => setSelectedReport('INACTIVE_GUESTS')}
            className={cn(
              'px-3 py-1.5 rounded-[3px] font-bold border transition-colors cursor-pointer',
              selectedReport === 'INACTIVE_GUESTS' ? 'bg-[#0B3D32] text-white border-[#0B3D32]' : 'bg-white border-slate-300 text-slate-700'
            )}
          >
            Inactive / Long-Absence Guests
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">Rank</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">Guest ID</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">Customer Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Membership</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Completed Visits</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">Room Spending</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">Dining Spending</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-right">Total Lifetime Spend</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Last Visit</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-200">
              {reportData.map((g, idx) => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60">
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                    #{idx + 1}
                  </td>
                  <td className="py-2 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700/60">
                    {g.id}
                  </td>
                  <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/60">
                    {g.fullName}
                  </td>
                  <td className="py-2 px-3.5 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                    {g.phone}
                  </td>
                  <td className="py-2 px-3.5 text-center border-r border-slate-200 dark:border-slate-700/60">
                    <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 font-bold text-[10px] uppercase">
                      {g.vipTier}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 font-mono font-bold text-center border-r border-slate-200 dark:border-slate-700/60">
                    {g.totalVisits} Stays
                  </td>
                  <td className="py-2 px-3.5 font-mono text-right border-r border-slate-200 dark:border-slate-700/60">
                    Rs. {(g.roomSpending || 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-3.5 font-mono text-right border-r border-slate-200 dark:border-slate-700/60">
                    Rs. {(g.restaurantSpending || 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-3.5 font-mono font-bold text-slate-900 dark:text-white text-right border-r border-slate-200 dark:border-slate-700/60">
                    Rs. {(g.totalSpending || 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-3.5 font-mono text-center border-r border-slate-200 dark:border-slate-700/60">
                    {g.lastVisitDate}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectGuest(g)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>360° Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

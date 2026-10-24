import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: React.ReactNode;
  iconColor?: 'forest' | 'burgundy' | 'blue' | 'amber' | 'purple' | 'teal' | 'slate';
  change?: {
    value: string | number;
    trend: 'positive' | 'negative' | 'neutral';
    label?: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  icon,
  iconColor = 'forest',
  change,
  className,
  ...props
}) => {
  const iconBgClasses = {
    forest: 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC] dark:bg-[#1A73E8]/30 dark:text-[#8AB4F8] dark:border-[#1A73E8]/40',
    burgundy: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA] dark:bg-[#DC2626]/20 dark:text-[#F87171] dark:border-[#DC2626]/40',
    blue: 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC] dark:bg-[#1A73E8]/20 dark:text-[#8AB4F8] dark:border-[#1A73E8]/40',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] dark:bg-[#D97706]/20 dark:text-[#FCD34D] dark:border-[#D97706]/40',
    purple: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC] dark:border-[#6D28D9]/40',
    teal: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF] dark:border-[#0F766E]/40',
    slate: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8] dark:border-[#475569]/40',
  };

  const trendClasses = {
    positive: 'text-[#166534] bg-[#DCFCE7] border-[#BBF7D0] dark:text-[#4ADE80] dark:bg-[#166534]/20 dark:border-[#166534]/40',
    negative: 'text-[#991B1B] bg-[#FEE2E2] border-[#FECACA] dark:text-[#F87171] dark:bg-[#991B1B]/20 dark:border-[#991B1B]/40',
    neutral: 'text-[#475569] bg-[#F1F5F9] border-[#E2E8F0] dark:text-[#94A3B8] dark:bg-[#475569]/20 dark:border-[#475569]/40',
  };

  return (
    <div
      className={cn(
        // Standard Section 8 KPI rules: White card, 1px solid #DCE3DF, colored icon, large dark metric, muted label
        'rounded-xl border border-[#DCE3DF] bg-white p-5 shadow-card transition-all duration-150',
        'hover:border-[#879B90] dark:bg-[#0d1e19] dark:border-[#1a332c] dark:hover:border-[#145447]',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64736C] dark:text-[#94A3B8]">{label}</span>
        {icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border text-sm', iconBgClasses[iconColor])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="font-heading text-2xl sm:text-3xl font-bold text-[#24352F] dark:text-white tracking-tight">
          {value}
        </div>

        {change && (
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold border', trendClasses[change.trend])}>
            {change.trend === 'positive' && <TrendingUp className="w-3 h-3" />}
            {change.trend === 'negative' && <TrendingDown className="w-3 h-3" />}
            {change.trend === 'neutral' && <Minus className="w-3 h-3" />}
            {change.value}
          </span>
        )}
      </div>

      {caption && (
        <p className="mt-1 text-xs text-[#64736C] dark:text-[#94A3B8]">
          {caption}
        </p>
      )}
    </div>
  );
};

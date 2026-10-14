import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, actions, className }) => {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#DCE3DF] dark:border-[#145447]/60 mb-6', className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#24352F] dark:text-white font-heading">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-[#64736C] dark:text-[#94A3B8] mt-1 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
};

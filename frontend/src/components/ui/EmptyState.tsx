import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#071512]/40',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#E8F2EE] border border-[#CBD5D0] text-[#0B3D32] dark:bg-[#0B3D32]/30 dark:border-[#145447] dark:text-[#E5EEE9] mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-[#24352F] dark:text-white font-heading">{title}</h3>
      {description && <p className="mt-1 text-xs text-[#64736C] dark:text-[#94A3B8] max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

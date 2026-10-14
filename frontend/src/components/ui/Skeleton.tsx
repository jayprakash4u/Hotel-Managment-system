import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#E8F2EE]/70 dark:bg-[#072D26]/50', className)}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#0d1e19] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-xl border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#0d1e19] p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#DCE3DF]">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-60 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-6 flex-1 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

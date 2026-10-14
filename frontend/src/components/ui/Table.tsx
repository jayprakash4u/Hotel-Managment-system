import React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-xl border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#1a332c] dark:bg-[#0d1e19]">
      <table ref={ref} className={cn('w-full caption-bottom text-sm text-left', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        // Neutral grey-green #F2F4F2 with dark text #24352F
        'bg-[#F2F4F2] border-b border-[#DCE3DF] text-xs font-semibold uppercase tracking-wider text-[#24352F] dark:bg-[#072D26]/70 dark:border-[#145447] dark:text-[#E5EEE9]',
        className
      )}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-[#E4E9E5] dark:divide-[#145447]/50', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        // Table row height 48-56px, hover row #F8FAF8, selected row #E8F2EE
        'transition-colors hover:bg-[#F8FAF8] data-[state=selected]:bg-[#E8F2EE] data-[state=selected]:font-medium',
        'dark:hover:bg-[#145447]/20 dark:data-[state=selected]:bg-[#145447]/40',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 sm:h-14 px-4 text-left align-middle font-bold text-[#24352F] dark:text-[#E5EEE9] [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'h-12 sm:h-14 p-4 align-middle [&:has([role=checkbox])]:pr-0 text-[#43534D] dark:text-[#CBD5E1]',
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

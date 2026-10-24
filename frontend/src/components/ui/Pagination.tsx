'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E4E9E5] dark:border-[#145447]/60 text-xs text-[#64736C] dark:text-[#94A3B8]">
      <div>
        Showing <span className="font-bold text-[#24352F] dark:text-white">{startItem}</span> to{' '}
        <span className="font-bold text-[#24352F] dark:text-white">{endItem}</span> of{' '}
        <span className="font-bold text-[#24352F] dark:text-white">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          className="h-9 px-2.5"
        >
          Previous
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-9 w-9 rounded-lg font-bold text-xs transition-all ${
              currentPage === page
                ? 'bg-[#1A73E8] text-white shadow-xs'
                : 'bg-white text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5F9] border border-[#CBD5E1] dark:bg-[#0F172A] dark:text-[#CBD5E1] dark:hover:text-white dark:border-[#334155]'
            }`}
          >
            {page}
          </button>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          className="h-9 px-2.5"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

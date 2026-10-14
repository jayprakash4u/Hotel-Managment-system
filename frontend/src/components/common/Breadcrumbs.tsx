'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#64736C] font-semibold">
        <Home className="w-3.5 h-3.5 text-[#0B3D32]" />
        <span className="text-[#24352F] font-bold">Front Desk & Hotel Operations</span>
      </div>
    );
  }

  const formatSegment = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#64736C] font-medium">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[#0B3D32] transition-colors text-[#64736C]"
      >
        <Home className="w-3.5 h-3.5 text-[#0B3D32]" />
        <span>PMS</span>
      </Link>

      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5D0] shrink-0" />
            {isLast ? (
              <span className="font-bold text-[#24352F] truncate max-w-[200px]">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link href={url} className="hover:text-[#0B3D32] transition-colors truncate max-w-[150px]">
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

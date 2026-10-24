'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  vipTier?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', vipTier, className }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'AG';
  };

  const vipRings: Record<string, string> = {
    GOLD: 'ring-2 ring-[#D97706]',
    PLATINUM: 'ring-2 ring-[#2563EB]',
    DIAMOND: 'ring-2 ring-[#7C3AED] shadow-xs',
  };

  const ring = vipTier && vipRings[vipTier] ? vipRings[vipTier] : 'border border-[#CBD5D0] dark:border-[#145447]';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-xl object-cover shrink-0', sizes[size], ring, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-[#E8F0FE] dark:bg-[#1A73E8]/20 flex items-center justify-center font-bold font-heading text-[#1A73E8] dark:text-[#8AB4F8] shrink-0 select-none',
        sizes[size],
        ring,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

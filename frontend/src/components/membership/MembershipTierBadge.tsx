'use client';

import React from 'react';
import {
  Shield,
  Star,
  Crown,
  Gem,
  Award,
} from 'lucide-react';
import { MembershipTier, MembershipTierIcon, getMembershipTiers } from '@/lib/loyalty';
import { cn } from '@/lib/utils';

export interface MembershipTierBadgeProps {
  tier?: MembershipTier | null;
  tierCode?: string;
  tierName?: string;
  icon?: MembershipTierIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIconOnly?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const TIER_ICONS: Record<MembershipTierIcon, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  star: Star,
  crown: Crown,
  gem: Gem,
  award: Award,
};

export const AVAILABLE_TIER_ICONS: { id: MembershipTierIcon; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'shield', label: 'Shield (Neutral/Bronze)', icon: Shield },
  { id: 'star', label: 'Star (Silver Metallic)', icon: Star },
  { id: 'crown', label: 'Crown (Gold Metallic)', icon: Crown },
  { id: 'gem', label: 'Gem (Platinum Metallic)', icon: Gem },
  { id: 'award', label: 'Award (Emblem)', icon: Award },
];

/**
 * Returns the distinctive visual icon component for a given icon identifier
 */
export function getTierIconComponent(iconName?: string): React.ComponentType<{ className?: string }> {
  const key = (iconName || '').toLowerCase() as MembershipTierIcon;
  return TIER_ICONS[key] || Shield;
}

/**
 * Enterprise Membership Tier Visual Badge & Icon
 * Supports Regular (Bronze/Neutral), Silver (Metallic), Gold (Metallic), and Platinum (Metallic)
 */
export const MembershipTierBadge: React.FC<MembershipTierBadgeProps> = ({
  tier,
  tierCode,
  tierName,
  icon,
  size = 'sm',
  showIconOnly = false,
  showLabel = true,
  className,
}) => {
  // Resolve tier from code if tier object not passed directly
  const resolvedCode = (tier?.code || tierCode || 'REGULAR').toUpperCase();
  const tiers = typeof window !== 'undefined' ? getMembershipTiers() : [];
  const matchedTier = tier || tiers.find((t) => t.code.toUpperCase() === resolvedCode);

  const displayName = tierName || matchedTier?.name || (
    resolvedCode === 'PLATINUM'
      ? 'Platinum Member'
      : resolvedCode === 'GOLD'
      ? 'Gold Member'
      : resolvedCode === 'SILVER'
      ? 'Silver Member'
      : 'Regular Member'
  );

  // Icon resolution: explicit prop > tier object > code fallback
  const resolvedIconKey: MembershipTierIcon = (
    icon ||
    (matchedTier?.icon as MembershipTierIcon) ||
    (resolvedCode.includes('PLATINUM')
      ? 'gem'
      : resolvedCode.includes('GOLD')
      ? 'crown'
      : resolvedCode.includes('SILVER')
      ? 'star'
      : 'shield')
  );

  const IconComponent = getTierIconComponent(resolvedIconKey);

  // Metallic & distinctive badge styles
  const isPlatinum = resolvedCode.includes('PLATINUM');
  const isGold = !isPlatinum && resolvedCode.includes('GOLD');
  const isSilver = !isPlatinum && !isGold && resolvedCode.includes('SILVER');
  const isRegular = !isPlatinum && !isGold && !isSilver;

  const styleClasses = isPlatinum
    ? 'bg-gradient-to-r from-indigo-50 via-slate-100 to-purple-50 text-indigo-950 border-indigo-300 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-900 dark:text-indigo-200 dark:border-indigo-700/80 shadow-2xs'
    : isGold
    ? 'bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 text-amber-950 border-amber-300 dark:from-amber-950/70 dark:via-amber-900/40 dark:to-amber-950/70 dark:text-amber-200 dark:border-amber-700/80 shadow-2xs'
    : isSilver
    ? 'bg-gradient-to-r from-slate-100 via-slate-50 to-slate-200 text-slate-800 border-slate-300 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-2xs'
    : 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-900/60 dark:text-stone-300 dark:border-stone-700 shadow-2xs';

  const iconColorClass = isPlatinum
    ? 'text-indigo-600 dark:text-indigo-400'
    : isGold
    ? 'text-amber-600 dark:text-amber-400'
    : isSilver
    ? 'text-slate-600 dark:text-slate-300'
    : 'text-stone-600 dark:text-stone-400';

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  if (showIconOnly) {
    return (
      <span
        title={displayName}
        className={cn(
          'inline-flex items-center justify-center rounded-[3px] border transition-all',
          styleClasses,
          size === 'xs' ? 'p-0.5' : size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2',
          className
        )}
      >
        <IconComponent className={cn(iconSizes, iconColorClass, 'stroke-[2]')} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-[3px] border tracking-wider transition-all select-none',
        styleClasses,
        sizeClasses,
        className
      )}
    >
      <IconComponent className={cn(iconSizes, iconColorClass, 'stroke-[2] shrink-0')} />
      {showLabel && <span className="uppercase">{displayName}</span>}
    </span>
  );
};

export default MembershipTierBadge;

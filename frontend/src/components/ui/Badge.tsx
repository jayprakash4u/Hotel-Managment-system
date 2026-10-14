import React from 'react';
import { cn, ROOM_STATUS_CONFIG, VIP_CONFIG, RESERVATION_STATUS_CONFIG, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { RoomStatusType, VipTierType, ReservationStatusType, HousekeepingPriorityType, PaymentStatusType } from '@/lib/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'progress' | 'teal' | 'neutral' | 'brand' | 'burgundy' | 'gold' | 'emerald' | 'rose' | 'cyan' | 'purple' | 'slate';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', dot = false, children, ...props }) => {
  const variants = {
    // Semantic Hospitality Tokens
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8]',
    success: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D]',
    error: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171]',
    info: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA]',
    progress: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC]',
    teal: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8]',
    brand: 'bg-[#E8F2EE] text-[#0B3D32] border-[#CBD5D0] dark:bg-[#0B3D32]/30 dark:text-[#E5EEE9]',
    burgundy: 'bg-[#F9E9EC] text-[#A51F36] border-[#A51F36]/30 dark:bg-[#A51F36]/20 dark:text-[#F87171]',

    // Backward compatibility aliases
    gold: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    emerald: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    rose: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    cyan: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    purple: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
    slate: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border transition-colors shadow-2xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

export const RoomStatusBadge: React.FC<{ status: RoomStatusType | string; className?: string }> = ({ status, className }) => {
  const config = (ROOM_STATUS_CONFIG as any)[status] || ROOM_STATUS_CONFIG.AVAILABLE;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border shadow-2xs',
        config.color,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

export const VipBadge: React.FC<{ tier: VipTierType | string; className?: string }> = ({ tier, className }) => {
  const config = VIP_CONFIG[tier as VipTierType] || VIP_CONFIG.STANDARD;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border shadow-2xs',
        config.color,
        className
      )}
    >
      <span className="text-[10px]">👑</span>
      {config.label}
    </span>
  );
};

export const ReservationStatusBadge: React.FC<{ status: ReservationStatusType | string; className?: string }> = ({ status, className }) => {
  const config = RESERVATION_STATUS_CONFIG[status as ReservationStatusType] || {
    label: status,
    color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border shadow-2xs',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border shadow-2xs',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: HousekeepingPriorityType | string; className?: string }> = ({ priority, className }) => {
  const configs: Record<string, { label: string; color: string }> = {
    URGENT: { label: 'Urgent', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] animate-pulse' },
    HIGH: { label: 'High Priority', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
    NORMAL: { label: 'Normal', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]' },
    LOW: { label: 'Low', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' },
  };

  const current = configs[priority] || configs.NORMAL;

  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border shadow-2xs', current.color, className)}>
      {current.label}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatusType | string; className?: string }> = ({ status, className }) => {
  const configs: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Paid in Full', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
    PARTIAL: { label: 'Partial Deposit', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
    UNPAID: { label: 'Unpaid / Open', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' },
    REFUNDED: { label: 'Refunded', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' },
  };

  const current = configs[status] || configs.UNPAID;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs', current.color, className)}>
      {current.label}
    </span>
  );
};

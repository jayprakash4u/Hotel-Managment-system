import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'danger' | 'warning' | 'brand' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    // Base styles: consistent heights, focus ring, loading and disabled states
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg active:scale-[0.98] select-none';

    // Triad Button Color System:
    // - Primary: Pure Blue #1A73E8, hover #1557B0, active #0D47A1, text #FFFFFF
    // - Destructive / Danger: Pure Red #DC2626, hover #B91C1C, active #991B1B, text #FFFFFF
    // - Warning / Gold: Pure Yellow #F59E0B, hover #D97706, active #B45309, text #FFFFFF
    // - Secondary: Surface white, border #CBD5E1, hover #F1F5F9, text #1E293B
    // - Outline: Transparent border #CBD5E1, text #475569
    // - Ghost: Transparent, hover #F1F5F9, text #475569
    const variants = {
      primary: 'bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#0D47A1] text-white font-semibold shadow-xs border border-[#1A73E8] focus:ring-3 focus:ring-[#1A73E8]/25',
      brand: 'bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#0D47A1] text-white font-semibold shadow-xs border border-[#1A73E8] focus:ring-3 focus:ring-[#1A73E8]/25',
      destructive: 'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-semibold shadow-xs border border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/25',
      danger: 'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-semibold shadow-xs border border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/25',
      warning: 'bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-white font-semibold shadow-xs border border-[#F59E0B] focus:ring-3 focus:ring-[#F59E0B]/25',
      gold: 'bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-white font-semibold shadow-xs border border-[#F59E0B] focus:ring-3 focus:ring-[#F59E0B]/25',
      secondary: 'bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#1E293B] border border-[#CBD5E1] shadow-2xs focus:ring-3 focus:ring-[#1A73E8]/20 dark:bg-[#0F172A] dark:hover:bg-[#1E293B] dark:text-[#E2E8F0] dark:border-[#334155]',
      outline: 'bg-transparent hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#475569] hover:text-[#1E293B] border border-[#CBD5E1] focus:ring-3 focus:ring-[#1A73E8]/20 dark:border-[#334155] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B]',
      ghost: 'bg-transparent hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#475569] hover:text-[#1E293B] focus:ring-2 focus:ring-[#1A73E8]/20 dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] dark:hover:text-white',
    };

    // Consistent heights: 36px compact (sm), 40px standard (md), 44-48px touch (lg)
    const sizes = {
      sm: 'h-9 min-h-[36px] text-xs px-3 gap-1.5',
      md: 'h-10 min-h-[40px] text-sm px-4 gap-2',
      lg: 'h-11 sm:h-12 min-h-[44px] text-base px-6 gap-2.5 font-semibold',
      icon: 'h-10 w-10 min-h-[40px] p-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

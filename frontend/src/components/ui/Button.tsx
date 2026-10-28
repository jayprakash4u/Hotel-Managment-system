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

    // Hospitality Color System:
    // - Primary / Brand: Deep Pine Emerald #0B3D32, hover #093027, active #06241D, text #FFFFFF, dark emerald-600
    // - Destructive / Danger: Brand Burgundy/Red #A51F36, hover #8E1B2F, active #731526, text #FFFFFF
    // - Warning / Gold: Warm Bronze/Amber #92400E, hover #78350F, active #5B2808, text #FFFFFF
    // - Secondary: Surface white, border #DCE3DF, hover #F2F6F4, text #24352F
    // - Outline: Transparent border #DCE3DF, text #4A6B5D
    // - Ghost: Transparent, hover #F2F6F4, text #4A6B5D
    const variants = {
      primary: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover-calc)] active:bg-[var(--brand-primary-active-calc)] text-white font-semibold shadow-xs border border-[var(--brand-primary)] focus:ring-3 focus-ring-[var(--brand-ring)]/25',
      brand: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover-calc)] active:bg-[var(--brand-primary-active-calc)] text-white font-semibold shadow-xs border border-[var(--brand-primary)] focus:ring-3 focus-ring-[var(--brand-ring)]/25',
      destructive: 'bg-[var(--accent-danger)] hover:bg-[#8E1B2F] active:bg-[#731526] text-white font-semibold shadow-xs border border-[var(--accent-danger)] focus:ring-3 focus-ring-[var(--accent-danger)]/25 dark:bg-rose-700 dark:hover:bg-rose-600',
      danger: 'bg-[var(--accent-danger)] hover:bg-[#8E1B2F] active:bg-[#731526] text-white font-semibold shadow-xs border border-[var(--accent-danger)] focus:ring-3 focus-ring-[var(--accent-danger)]/25 dark:bg-rose-700 dark:hover:bg-rose-600',
      warning: 'bg-[var(--accent-warning)] hover:bg-[#78350F] active:bg-[#5B2808] text-white font-semibold shadow-xs border border-[var(--accent-warning)] focus:ring-3 focus-ring-[var(--accent-warning)]/25 dark:bg-amber-600 dark:hover:bg-amber-500',
      gold: 'bg-[var(--accent-warning)] hover:bg-[#78350F] active:bg-[#5B2808] text-white font-semibold shadow-xs border border-[var(--accent-warning)] focus:ring-3 focus-ring-[var(--accent-warning)]/25 dark:bg-amber-600 dark:hover:bg-amber-500',
      secondary: 'bg-white hover:bg-[var(--surface-muted)] active:bg-[var(--divider)] text-[var(--text-body)] border border-[var(--border-default)] shadow-2xs focus:ring-3 focus-ring-[var(--brand-ring)]/20 dark:bg-[#071F1A] dark:hover:bg-[#093027] dark:text-[var(--text-inverse)] dark:border-[var(--border-default)]',
      outline: 'bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--divider)] text-[var(--text-muted)] hover:text-[var(--brand-primary)] border border-[var(--border-default)] focus:ring-3 focus-ring-[var(--brand-ring)]/20 dark:border-[var(--border-default)] dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--brand-primary)]',
      ghost: 'bg-transparent hover:bg-[var(--surface-muted)] active:bg-[var(--divider)] text-[var(--text-muted)] hover:text-[var(--brand-primary)] focus:ring-2 focus-ring-[var(--brand-ring)]/20 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--brand-primary)]',
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

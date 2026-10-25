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
      primary: 'bg-[#0B3D32] hover:bg-[#093027] active:bg-[#06241D] text-white font-semibold shadow-xs border border-[#0B3D32] focus:ring-3 focus:ring-[#0B3D32]/25 dark:bg-emerald-600 dark:hover:bg-emerald-500',
      brand: 'bg-[#0B3D32] hover:bg-[#093027] active:bg-[#06241D] text-white font-semibold shadow-xs border border-[#0B3D32] focus:ring-3 focus:ring-[#0B3D32]/25 dark:bg-emerald-600 dark:hover:bg-emerald-500',
      destructive: 'bg-[#A51F36] hover:bg-[#8E1B2F] active:bg-[#731526] text-white font-semibold shadow-xs border border-[#A51F36] focus:ring-3 focus:ring-[#A51F36]/25 dark:bg-rose-700 dark:hover:bg-rose-600',
      danger: 'bg-[#A51F36] hover:bg-[#8E1B2F] active:bg-[#731526] text-white font-semibold shadow-xs border border-[#A51F36] focus:ring-3 focus:ring-[#A51F36]/25 dark:bg-rose-700 dark:hover:bg-rose-600',
      warning: 'bg-[#92400E] hover:bg-[#78350F] active:bg-[#5B2808] text-white font-semibold shadow-xs border border-[#92400E] focus:ring-3 focus:ring-[#92400E]/25 dark:bg-amber-600 dark:hover:bg-amber-500',
      gold: 'bg-[#92400E] hover:bg-[#78350F] active:bg-[#5B2808] text-white font-semibold shadow-xs border border-[#92400E] focus:ring-3 focus:ring-[#92400E]/25 dark:bg-amber-600 dark:hover:bg-amber-500',
      secondary: 'bg-white hover:bg-[#F2F6F4] active:bg-[#E5EEE9] text-[#24352F] border border-[#DCE3DF] shadow-2xs focus:ring-3 focus:ring-[#0B3D32]/20 dark:bg-[#071F1A] dark:hover:bg-[#093027] dark:text-[#E2E8F0] dark:border-[#145447]',
      outline: 'bg-transparent hover:bg-[#F2F6F4] active:bg-[#E5EEE9] text-[#4A6B5D] hover:text-[#24352F] border border-[#DCE3DF] focus:ring-3 focus:ring-[#0B3D32]/20 dark:border-[#145447] dark:text-[#A4B8AE] dark:hover:bg-[#093027]',
      ghost: 'bg-transparent hover:bg-[#F2F6F4] active:bg-[#E5EEE9] text-[#4A6B5D] hover:text-[#24352F] focus:ring-2 focus:ring-[#0B3D32]/20 dark:text-[#A4B8AE] dark:hover:bg-[#093027] dark:hover:text-white',
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

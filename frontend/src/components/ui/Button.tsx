import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'danger' | 'brand' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    // Base styles: consistent heights, focus ring, loading and disabled states
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg active:scale-[0.98] select-none';

    // Button Color System per Design Spec:
    // - Primary: Forest green #0B3D32, hover #145447, active #072D26, text #FFFFFF
    // - Secondary: Surface white, border #DCE3DF, hover #F2F4F2, text #24352F
    // - Destructive: Burgundy red #A51F36, hover #8E1B2F, text #FFFFFF
    // - Outline: Transparent border #DCE3DF, text #43534D
    // - Ghost: Transparent, hover #F2F4F2, text #43534D
    const variants = {
      primary: 'bg-[#0B3D32] hover:bg-[#145447] active:bg-[#072D26] text-white font-semibold shadow-xs border border-[#0B3D32] focus:ring-3 focus:ring-[#0B3D32]/25',
      gold: 'bg-[#0B3D32] hover:bg-[#145447] active:bg-[#072D26] text-white font-semibold shadow-xs border border-[#0B3D32] focus:ring-3 focus:ring-[#0B3D32]/25', // backward compat
      secondary: 'bg-white hover:bg-[#F2F4F2] active:bg-[#E8F2EE] text-[#24352F] border border-[#DCE3DF] shadow-2xs focus:ring-3 focus:ring-[#0B3D32]/20 dark:bg-[#0f172a] dark:hover:bg-[#1e293b] dark:text-[#E2E8F0] dark:border-[#1e293b]',
      outline: 'bg-transparent hover:bg-[#F2F4F2] active:bg-[#E8F2EE] text-[#43534D] hover:text-[#24352F] border border-[#DCE3DF] focus:ring-3 focus:ring-[#0B3D32]/20 dark:border-[#1e293b] dark:text-[#CBD5E1] dark:hover:bg-[#1e293b]',
      destructive: 'bg-[#A51F36] hover:bg-[#8E1B2F] active:bg-[#7A1727] text-white font-semibold shadow-xs border border-[#A51F36] focus:ring-3 focus:ring-[#A51F36]/25',
      danger: 'bg-[#A51F36] hover:bg-[#8E1B2F] active:bg-[#7A1727] text-white font-semibold shadow-xs border border-[#A51F36] focus:ring-3 focus:ring-[#A51F36]/25',
      brand: 'bg-[#A51F36] hover:bg-[#8E1B2F] active:bg-[#7A1727] text-white font-semibold shadow-xs border border-[#A51F36] focus:ring-3 focus:ring-[#A51F36]/25',
      ghost: 'bg-transparent hover:bg-[#F2F4F2] active:bg-[#E8F2EE] text-[#43534D] hover:text-[#24352F] focus:ring-2 focus:ring-[#0B3D32]/20 dark:text-[#CBD5E1] dark:hover:bg-[#1e293b] dark:hover:text-white',
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

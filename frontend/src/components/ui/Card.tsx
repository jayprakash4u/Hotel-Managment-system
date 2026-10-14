import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Section 7 Layout Standards:
          // - Background: White #FFFFFF
          // - Border: 1px solid #DCE3DF
          // - Border radius: 12px (rounded-xl)
          // - Shadows: Soft and subtle
          'rounded-xl border border-[#DCE3DF] bg-white text-[#43534D] shadow-card transition-all duration-150 dark:bg-[#0d1e19] dark:border-[#1a332c] dark:text-[#CBD5E1]',
          variant === 'muted' && 'bg-[#F2F4F2] dark:bg-[#072D26]/40',
          variant === 'interactive' && 'hover:border-[#0B3D32] hover:shadow-xs cursor-pointer dark:hover:border-[#4ADE80]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-5 sm:p-6 border-b border-[#E4E9E5] dark:border-[#145447]/60', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-heading font-bold text-base sm:text-lg text-[#24352F] dark:text-white leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs text-[#64736C] dark:text-[#94A3B8] leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 sm:p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-4 sm:p-5 border-t border-[#E4E9E5] bg-[#F2F4F2]/50 dark:bg-[#072D26]/30 dark:border-[#145447]/60 rounded-b-xl', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

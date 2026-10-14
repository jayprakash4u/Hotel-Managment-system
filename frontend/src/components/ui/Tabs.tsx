'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnChange,
  children,
  className,
  ...props
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const currentVal = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (newVal: string) => {
    if (!isControlled) {
      setUncontrolledValue(newVal);
    }
    controlledOnChange?.(newVal);
  };

  return (
    <TabsContext.Provider value={{ value: currentVal, onValueChange: handleValueChange }}>
      <div className={cn('space-y-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pill' | 'underline';
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'pill', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variant === 'pill' &&
            'inline-flex items-center gap-1 p-1 rounded-xl bg-[#F2F4F2] border border-[#DCE3DF] dark:bg-[#072D26]/60 dark:border-[#145447]/60 overflow-x-auto max-w-full',
          variant === 'underline' &&
            'flex items-center gap-6 border-b border-[#DCE3DF] dark:border-[#145447]/60 overflow-x-auto max-w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  leftIcon?: React.ReactNode;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, leftIcon, children, ...props }, ref) => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = ctx.value === value;

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          // Clean 8px radius matching user spec, font-semibold text-xs
          'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 shrink-0 select-none',
          isActive
            ? 'bg-white text-[#24352F] shadow-xs font-bold border border-[#CBD5D0] dark:bg-[#0B3D32] dark:text-white dark:border-[#145447]'
            : 'text-[#64736C] hover:text-[#24352F] hover:bg-white/60 dark:text-[#B7CDC3] dark:hover:text-white dark:hover:bg-[#145447]/40',
          className
        )}
        {...props}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsContent must be used within Tabs');

    if (ctx.value !== value) return null;

    return (
      <div
        ref={ref}
        className={cn('focus:outline-none animate-in fade-in duration-150', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

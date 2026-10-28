import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, helperText, requiredIndicator, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[var(--text-body)] dark:text-[var(--text-body)]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[var(--accent-danger)] ml-1 font-bold">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-[42px] rounded-lg px-3.5 text-sm transition-all duration-150',
              'bg-[var(--surface-card)] border border-[var(--border-input)] text-[var(--text-body)] placeholder-[var(--text-placeholder)]',
              'hover:border-[var(--text-muted)]',
              'focus:border-[var(--brand-primary)] focus:outline-none focus:ring-3 focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
              'disabled:bg-[var(--surface-muted)] disabled:border-[var(--border-default)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed',
              'dark:bg-[var(--surface-card)] dark:border-[var(--border-input)] dark:text-[var(--text-body)] dark:placeholder-[var(--text-placeholder)] dark:focus:border-[var(--brand-primary)] dark:focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[var(--accent-danger)] hover:border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent-danger),transparent_82%)] dark:border-[var(--accent-danger)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[var(--accent-danger)] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  options?: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, requiredIndicator, id, options, disabled, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[var(--text-body)]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[var(--accent-danger)] ml-1 font-bold">*</span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-[42px] appearance-none rounded-lg px-3.5 pr-9 text-sm transition-all duration-150',
              'bg-[var(--surface-card)] border border-[var(--border-input)] text-[var(--text-body)]',
              'hover:border-[var(--text-muted)]',
              'focus:border-[var(--brand-primary)] focus:outline-none focus:ring-3 focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
              'disabled:bg-[var(--surface-muted)] disabled:border-[var(--border-default)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed',
              'dark:bg-[var(--surface-card)] dark:border-[var(--border-input)] dark:text-[var(--text-body)] dark:focus:border-[var(--brand-primary)] dark:focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
              error && 'border-[var(--accent-danger)] hover:border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent-danger),transparent_82%)] dark:border-[var(--accent-danger)]',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--surface-card)] text-[var(--text-body)] dark:bg-[var(--surface-card)] dark:text-[var(--text-body)]">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-xs text-[var(--accent-danger)] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, requiredIndicator, id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-[var(--text-body)]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[var(--accent-danger)] ml-1 font-bold">*</span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[90px] rounded-lg p-3 text-sm transition-all duration-150',
            'bg-[var(--surface-card)] border border-[var(--border-input)] text-[var(--text-body)] placeholder-[var(--text-placeholder)]',
            'hover:border-[var(--text-muted)]',
            'focus:border-[var(--brand-primary)] focus:outline-none focus:ring-3 focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
            'disabled:bg-[var(--surface-muted)] disabled:border-[var(--border-default)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed',
            'dark:bg-[var(--surface-card)] dark:border-[var(--border-input)] dark:text-[var(--text-body)] dark:placeholder-[var(--text-placeholder)] dark:focus:border-[var(--brand-primary)] dark:focus:ring-[color-mix(in_srgb,var(--brand-primary),transparent_82%)]',
            error && 'border-[var(--accent-danger)] hover:border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent-danger),transparent_82%)] dark:border-[var(--accent-danger)]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[var(--accent-danger)] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

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
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#24352F] dark:text-[#E2E8F0]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[#A51F36] ml-1 font-bold">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#64736C] dark:text-[#B7CDC3]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Standard styling: 8px border radius, 42-44px height, exact brand tokens
              'w-full h-[42px] rounded-lg px-3.5 text-sm transition-all duration-150',
              'bg-white border border-[#CBD5D0] text-[#24352F] placeholder-[#7A8982]',
              'hover:border-[#879B90]',
              'focus:border-[#0B3D32] focus:outline-none focus:ring-3 focus:ring-[#0B3D32]/15',
              'disabled:bg-[#F2F4F2] disabled:border-[#DCE3DF] disabled:text-[#89948E] disabled:cursor-not-allowed',
              'dark:bg-[#071512] dark:border-[#145447] dark:text-white dark:placeholder-[#64736C] dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/20 dark:disabled:bg-[#072D26]/40 dark:disabled:text-[#89948E]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#B42332] hover:border-[#B42332] focus:border-[#B42332] focus:ring-3 focus:ring-[#B42332]/15 dark:border-[#B42332]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#64736C] dark:text-[#B7CDC3]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#B42332] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-1">{helperText}</p>
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
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#24352F] dark:text-[#E2E8F0]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[#A51F36] ml-1 font-bold">*</span>
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
              'bg-white border border-[#CBD5D0] text-[#24352F]',
              'hover:border-[#879B90]',
              'focus:border-[#0B3D32] focus:outline-none focus:ring-3 focus:ring-[#0B3D32]/15',
              'disabled:bg-[#F2F4F2] disabled:border-[#DCE3DF] disabled:text-[#89948E] disabled:cursor-not-allowed',
              'dark:bg-[#071512] dark:border-[#145447] dark:text-white dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/20 dark:disabled:bg-[#072D26]/40 dark:disabled:text-[#89948E]',
              error && 'border-[#B42332] hover:border-[#B42332] focus:border-[#B42332] focus:ring-3 focus:ring-[#B42332]/15 dark:border-[#B42332]',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-[#24352F] dark:bg-[#071512] dark:text-white">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#64736C] dark:text-[#B7CDC3]">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-xs text-[#B42332] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-1">{helperText}</p>
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
          <label htmlFor={textareaId} className="block text-xs font-semibold text-[#24352F] dark:text-[#E2E8F0]">
            {label}
            {(requiredIndicator || props.required) && (
              <span className="text-[#A51F36] ml-1 font-bold">*</span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[90px] rounded-lg p-3 text-sm transition-all duration-150',
            'bg-white border border-[#CBD5D0] text-[#24352F] placeholder-[#7A8982]',
            'hover:border-[#879B90]',
            'focus:border-[#0B3D32] focus:outline-none focus:ring-3 focus:ring-[#0B3D32]/15',
            'disabled:bg-[#F2F4F2] disabled:border-[#DCE3DF] disabled:text-[#89948E] disabled:cursor-not-allowed',
            'dark:bg-[#071512] dark:border-[#145447] dark:text-white dark:placeholder-[#64736C] dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/20',
            error && 'border-[#B42332] hover:border-[#B42332] focus:border-[#B42332] focus:ring-3 focus:ring-[#B42332]/15 dark:border-[#B42332]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#B42332] font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

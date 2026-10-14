'use client';

import * as React from 'react';
import {
  useFormContext,
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
} from 'react-hook-form';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './Button';

// Main Form Context Provider
export const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField must be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-1.5', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, requiredIndicator, children, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
      <label
        ref={ref}
        htmlFor={formItemId}
        className={cn(
          'block text-xs font-semibold tracking-wide text-[#24352F] dark:text-[#E2E8F0]',
          error && 'text-[#B42332] dark:text-[#F87171]',
          className
        )}
        {...props}
      >
        {children}
        {requiredIndicator && <span className="text-[#A51F36] ml-1 font-bold">*</span>}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <div
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-xs text-[#64736C] dark:text-[#94A3B8] leading-relaxed', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        'text-xs font-semibold text-[#B42332] dark:text-[#F87171] flex items-center gap-1 mt-1 animate-in fade-in duration-150',
        className
      )}
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{body}</span>
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

// Form Level Error Alert (For server validation / HTTP 422 errors)
export interface FormErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  errors?: string[];
}

export const FormErrorAlert: React.FC<FormErrorAlertProps> = ({
  title = 'Validation Error',
  message,
  errors = [],
  className,
}) => {
  if (!message && errors.length === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 rounded-lg border bg-[#FEE2E2] border-[#FECACA] text-[#991B1B] dark:bg-[#991B1B]/20 dark:border-[#991B1B]/40 dark:text-[#F87171] space-y-1 text-xs animate-in fade-in',
        className
      )}
    >
      <div className="flex items-center gap-2 font-bold">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{title}</span>
      </div>
      {message && <p className="opacity-95 leading-relaxed">{message}</p>}
      {errors.length > 0 && (
        <ul className="list-disc pl-5 space-y-0.5 mt-1">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Form Level Success Alert
export interface FormSuccessAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
}

export const FormSuccessAlert: React.FC<FormSuccessAlertProps> = ({
  title = 'Action Successful',
  message,
  className,
}) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        'p-3.5 rounded-lg border bg-[#DCFCE7] border-[#BBF7D0] text-[#166534] dark:bg-[#166534]/20 dark:border-[#166534]/40 dark:text-[#4ADE80] flex items-start gap-2.5 text-xs animate-in fade-in',
        className
      )}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">{title}</p>
        <p className="opacity-95 leading-relaxed mt-0.5">{message}</p>
      </div>
    </div>
  );
};

// Automatic Submitting State Button
export interface FormSubmitButtonProps extends ButtonProps {
  loadingLabel?: string;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  children,
  loadingLabel = 'Processing...',
  disabled,
  className,
  ...props
}) => {
  const { formState } = useFormContext();
  const isSubmitting = formState.isSubmitting;

  return (
    <Button
      type="submit"
      variant="primary"
      size="md"
      disabled={disabled || isSubmitting}
      isLoading={isSubmitting}
      className={cn(className)}
      {...props}
    >
      {isSubmitting ? loadingLabel : children}
    </Button>
  );
};

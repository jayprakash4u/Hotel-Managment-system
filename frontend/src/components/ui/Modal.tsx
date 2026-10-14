'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Translucent Backdrop: Charcoal Green Overlay #24352F with 60% opacity */}
      <div
        className="fixed inset-0 bg-[#24352F]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog: White Surface #FFFFFF, Border #DCE3DF, 16px Radius (rounded-2xl) */}
      <div
        className={cn(
          'relative w-full bg-white border border-[#DCE3DF] rounded-2xl shadow-modal overflow-hidden z-10 my-8 transform transition-all flex flex-col max-h-[90vh]',
          'dark:bg-[#0d1e19] dark:border-[#1a332c]',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#E4E9E5] dark:border-[#145447]/60 shrink-0">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-base font-bold text-[#24352F] dark:text-white font-heading flex items-center gap-2">
                  {title}
                </h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#64736C] hover:text-[#24352F] hover:bg-[#F2F4F2] dark:hover:text-white dark:hover:bg-[#145447] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm text-[#43534D] dark:text-[#CBD5E1]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[#E4E9E5] bg-[#F2F4F2] dark:bg-[#072D26]/70 dark:border-[#145447]/60 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

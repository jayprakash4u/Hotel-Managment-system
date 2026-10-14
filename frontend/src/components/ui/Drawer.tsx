'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'right' | 'left';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
  position = 'right',
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

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  const isRight = position === 'right';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#24352F]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className={cn('fixed inset-y-0 flex max-w-full', isRight ? 'right-0 pl-10' : 'left-0 pr-10')}>
        <div
          className={cn(
            'w-screen bg-white border-[#DCE3DF] dark:bg-[#0d1e19] dark:border-[#1a332c] shadow-2xl flex flex-col',
            isRight ? 'border-l' : 'border-r',
            widthClasses[width]
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between p-5 border-b border-[#E4E9E5] dark:border-[#145447]/60">
              <div>
                {typeof title === 'string' ? (
                  <h3 className="text-base font-bold text-[#24352F] dark:text-white font-heading">{title}</h3>
                ) : (
                  title
                )}
                {description && <p className="text-xs text-[#64736C] dark:text-[#94A3B8] mt-0.5">{description}</p>}
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
          <div className="p-5 overflow-y-auto flex-1 text-sm text-[#43534D] dark:text-[#CBD5E1]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-[#E4E9E5] bg-[#F2F4F2] dark:bg-[#072D26]/70 dark:border-[#145447]/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  subtext?: string;
}

interface MasterSearchableSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  onAddNew?: (newValue: string, description?: string) => void;
  addNewTitle?: string;
  className?: string;
  triggerClassName?: string;
  compact?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  showInlinePlus?: boolean;
  showAttachedPlus?: boolean;
}

export default function MasterSearchableSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Type to search...',
  onAddNew,
  addNewTitle,
  className,
  triggerClassName,
  compact = false,
  allowClear = true,
  disabled = false,
  showInlinePlus = false,
  showAttachedPlus,
}: MasterSearchableSelectProps) {
  const hasAttachedPlus = Boolean(onAddNew && (showAttachedPlus !== undefined ? showAttachedPlus : !compact));
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtext && opt.subtext.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Current display label
  const displayLabel = useMemo(() => {
    if (!value) return '';
    const matched = normalizedOptions.find((o) => o.value === value);
    return matched ? matched.label : value;
  }, [normalizedOptions, value]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsAddModalOpen(false);
      }
    };

    if (isOpen || isAddModalOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isAddModalOpen]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    if (onAddNew) {
      onAddNew(trimmed, newItemDesc.trim() || undefined);
    }
    onChange(trimmed);
    setNewItemName('');
    setNewItemDesc('');
    setIsAddModalOpen(false);
    setIsOpen(false);
  };

  const handleOpenAddModal = () => {
    setNewItemName(searchQuery.trim());
    setNewItemDesc('');
    setIsAddModalOpen(true);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Label Row */}
      {label && (
        <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 select-none mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Select Control & attached '+' Add New button */}
      <div className="flex items-stretch w-full">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'relative flex items-center justify-between w-full select-none transition-colors cursor-pointer text-xs outline-none',
            compact
              ? (hasAttachedPlus
                  ? 'h-8 px-2.5 rounded-l-[3px] rounded-r-none border border-r-0 border-slate-300 dark:border-[#145447]'
                  : 'h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-[#145447]')
              : (hasAttachedPlus
                  ? 'h-9 px-3 rounded-l-[3px] rounded-r-none border border-r-0 border-slate-300 dark:border-[#145447]'
                  : 'h-9 px-3 rounded-[3px] border border-slate-300 dark:border-[#145447]'),
            'bg-white dark:bg-[#061B16] text-slate-900 dark:text-white',
            isOpen
              ? 'border-[#1A73E8] dark:border-blue-500 z-10'
              : 'hover:border-slate-400 dark:hover:border-blue-400',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-[#04120F]',
            triggerClassName
          )}
        >
          <span
            className={cn(
              'truncate mr-2 font-normal',
              !value ? 'text-slate-400 dark:text-neutral-400' : 'text-slate-900 dark:text-white'
            )}
          >
            {value ? displayLabel : placeholder}
          </span>

          <div className="flex items-center gap-1 shrink-0 text-slate-400 dark:text-neutral-400">
            {value && allowClear && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onChange('');
                  }
                }}
                title="Clear selection"
                className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3 stroke-[2]" />
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#1A73E8] dark:text-blue-400 shrink-0 stroke-[2]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 shrink-0 stroke-[2]" />
            )}
          </div>
        </div>

        {/* Attached Add New '+' Button: EXACT square matching field box height */}
        {hasAttachedPlus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAddModal();
            }}
            title={`Add new ${addNewTitle || label || 'option'}`}
            className={cn(
              'flex items-center justify-center transition-colors cursor-pointer shrink-0 text-white select-none',
              'bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#0D47A1] dark:bg-blue-600 dark:hover:bg-blue-500',
              'border border-[#1A73E8] hover:border-[#1557B0] dark:border-blue-600',
              'rounded-r-[3px] rounded-l-none',
              compact ? 'w-8 h-8' : 'w-9 h-9'
            )}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Dropdown Popup Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] shadow-lg overflow-hidden animate-in fade-in duration-100">
          {/* Top Search Input Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19]">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white outline-none focus:border-[#1A73E8] dark:focus:border-blue-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-[#1A73E8] text-white dark:bg-blue-600 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-[#E8F0FE] hover:text-[#1A73E8] dark:hover:bg-blue-950/40 dark:hover:text-blue-300'
                    )}
                  >
                    <div className="truncate pr-2">
                      <span>{opt.label}</span>
                      {opt.subtext && (
                        <span
                          className={cn(
                            'block text-[10px] truncate',
                            isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
                          )}
                        >
                          {opt.subtext}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                <p>No matching options</p>
                {onAddNew && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddNew(searchQuery.trim());
                      onChange(searchQuery.trim());
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="mt-2 block w-full px-2 py-1.5 rounded bg-[#1A73E8] text-white text-xs font-semibold hover:bg-[#1557B0] dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors cursor-pointer"
                  >
                    + Add &quot;{searchQuery.trim()}&quot;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Quick Add option if search query doesn't match an existing entry */}
          {onAddNew &&
            filteredOptions.length > 0 &&
            searchQuery.trim() &&
            !filteredOptions.some((o) => o.label.toLowerCase() === searchQuery.trim().toLowerCase()) && (
              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19]">
                <button
                  type="button"
                  onClick={() => {
                    onAddNew(searchQuery.trim());
                    onChange(searchQuery.trim());
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-[#1A73E8] hover:bg-[#E8F0FE] dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add &quot;{searchQuery.trim()}&quot;</span>
                </button>
              </div>
            )}
        </div>
      )}

      {/* Quick Add Modal Popup */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#1A73E8]/10 text-[#1A73E8] dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center">
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                  Add New {addNewTitle || label || 'Item'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQuickAddSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${addNewTitle || label || 'name'}`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white outline-none focus:border-[#1A73E8] dark:focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Details (Optional)
                </label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Optional notes or details"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white outline-none focus:border-[#1A73E8] dark:focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-blue-600 dark:hover:bg-blue-500 rounded transition-colors shadow-2xs cursor-pointer"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

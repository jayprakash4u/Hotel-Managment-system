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
}: MasterSearchableSelectProps) {
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
      {/* Label Row with clean, subtle '+' button on top-right */}
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 select-none">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {onAddNew && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              title={`Add new ${addNewTitle || label}`}
              className="w-4 h-4 rounded bg-[#0B3D32] hover:bg-[#145447] text-white flex items-center justify-center transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shrink-0"
            >
              <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}

      {/* Main Select Control & optional inline plus */}
      <div className="flex items-center gap-1.5 w-full">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'relative flex items-center justify-between w-full select-none transition-colors cursor-pointer text-xs outline-none',
            compact
              ? 'h-8 px-2.5 rounded border border-slate-300 dark:border-[#145447]'
              : 'px-3 py-2 rounded-lg border border-slate-300 dark:border-[#145447]',
            'bg-white dark:bg-[#061B16] text-slate-900 dark:text-white',
            isOpen
              ? 'border-[#0B3D32] dark:border-emerald-500'
              : 'hover:border-slate-400 dark:hover:border-emerald-600',
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
              <ChevronUp className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0 stroke-[2]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 shrink-0 stroke-[2]" />
            )}
          </div>
        </div>

        {/* When no label but inline plus is requested */}
        {!label && showInlinePlus && onAddNew && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            title={`Add new ${addNewTitle || 'option'}`}
            className="h-8 w-8 rounded border border-slate-300 dark:border-[#145447] bg-[#0B3D32] hover:bg-[#145447] text-white flex items-center justify-center transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Dropdown Popup Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-lg overflow-hidden animate-in fade-in duration-100">
          {/* Top Search Input Box */}
          <div className="p-2 border-b border-slate-100 dark:border-[#145447]/60 bg-[#FAFBF9] dark:bg-[#061B16]">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] dark:focus:border-emerald-500"
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
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-700 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-[#E8F2EE] hover:text-[#0B3D32] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300'
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
                    className="mt-2 block w-full px-2 py-1.5 rounded bg-[#0B3D32] text-white text-xs font-semibold hover:bg-[#145447] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer"
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
              <div className="p-1.5 border-t border-slate-100 dark:border-[#145447]/60 bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => {
                    onAddNew(searchQuery.trim());
                    onChange(searchQuery.trim());
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-[#0B3D32] hover:bg-[#E8F2EE] dark:text-emerald-400 dark:hover:bg-[#0A2E26] transition-colors flex items-center gap-1.5 cursor-pointer"
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
            className="w-full max-w-sm rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-[#145447] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#0B3D32]/10 text-[#0B3D32] dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center justify-center">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] dark:focus:border-emerald-500"
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#145447] bg-white dark:bg-[#061B16] text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] dark:focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#145447]/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0A2E26] rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#145447] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded transition-colors shadow-2xs cursor-pointer"
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

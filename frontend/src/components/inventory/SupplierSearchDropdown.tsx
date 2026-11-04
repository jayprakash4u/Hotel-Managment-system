'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Building2, User, Phone, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupplierRecord } from '@/lib/types';

interface SupplierSearchDropdownProps {
  value?: string | null;
  onChange: (supplier: SupplierRecord | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onSupplierSelected?: (supplier: SupplierRecord | null) => void;
}

export const SupplierSearchDropdown: React.FC<SupplierSearchDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select supplier...',
  disabled = false,
  required = false,
  className,
  onSupplierSelected,
}) => {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch active suppliers dynamically from Supplier Management API
  const fetchActiveSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/suppliers?activeOnly=true');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setSuppliers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSuppliers();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.code && s.code.toLowerCase().includes(term)) ||
        (s.phone && s.phone.toLowerCase().includes(term)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(term)) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.panVatNumber && s.panVatNumber.toLowerCase().includes(term))
    );
  }, [suppliers, searchTerm]);

  // Current selected supplier
  const selectedSupplier = useMemo(() => {
    if (!value) return null;
    return suppliers.find((s) => s.id === value) || null;
  }, [value, suppliers]);

  const handleSelect = (supplier: SupplierRecord | null) => {
    onChange(supplier);
    if (onSupplierSelected) {
      onSupplierSelected(supplier);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (onSupplierSelected) {
      onSupplierSelected(null);
    }
  };

  return (
    <div className={cn('relative w-full text-xs font-sans', className)} ref={containerRef}>
      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            if (!isOpen) {
              fetchActiveSuppliers(); // Fresh fetch whenever opened
            }
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          'flex items-center justify-between min-h-[34px] px-2.5 py-1.5 border rounded-[3px] bg-white dark:bg-[#071F1A] cursor-pointer transition-colors select-none text-xs',
          isOpen
            ? 'border-[#0B3D32] ring-1 ring-[#0B3D32]'
            : 'border-slate-300 dark:border-border-default hover:border-slate-400',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
          {selectedSupplier ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {selectedSupplier.name}
              </span>
              {selectedSupplier.phone && (
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-0.5 shrink-0">
                  <Phone className="w-2.5 h-2.5 inline" /> {selectedSupplier.phone}
                </span>
              )}
              {selectedSupplier.code && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded font-mono shrink-0">
                  {selectedSupplier.code}
                </span>
              )}
            </div>
          ) : value === 'WALK_IN' ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">Walk-in Supplier</span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder || 'Select supplier...'}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedSupplier && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Clear supplier"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#071F1A] border border-slate-300 dark:border-border-default rounded-[3px] shadow-lg max-h-72 flex flex-col overflow-hidden animate-in fade-in duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-border-default bg-slate-50/70 dark:bg-slate-900/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, PAN or code..."
                autoFocus
                className="w-full pl-7 pr-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
            </div>
          </div>

          {/* Suppliers List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56">
            {/* Option: Walk-in / Unregistered Supplier */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer',
                !value && 'bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold text-[#0B3D32] dark:text-emerald-400'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0 text-[10px]">
                  WI
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Walk-in / Unregistered Supplier</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                      Local / Cash Shop
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    No supplier profile or invoice number required
                  </div>
                </div>
              </div>
              {!value && <Check className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />}
            </button>

            {/* List of Registered Active Suppliers */}
            {isLoading ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading active suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {searchTerm ? 'No matching suppliers found.' : 'No active suppliers registered.'}
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                const isSelected = value === supplier.id;
                return (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer',
                      isSelected && 'bg-emerald-50/60 dark:bg-emerald-950/20 text-[#0B3D32] dark:text-emerald-400'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded-full bg-[#0B3D32]/10 text-[#0B3D32] dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {supplier.name}
                          </span>
                          {supplier.code && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {supplier.code}
                            </span>
                          )}
                          {supplier.category && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {supplier.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {supplier.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5" /> {supplier.phone}
                            </span>
                          )}
                          {supplier.contactPerson && (
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-2.5 h-2.5" /> {supplier.contactPerson}
                            </span>
                          )}
                          {supplier.panVatNumber && (
                            <span className="font-mono text-[10px] text-slate-400">
                              PAN: {supplier.panVatNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};


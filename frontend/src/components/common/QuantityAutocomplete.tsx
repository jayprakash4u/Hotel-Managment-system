'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronDown, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMasterOptions, SimpleMasterItem } from '@/lib/mastersData';

export interface QuantityAutocompleteProps {
  value: string;
  onChange: (quantityName: string) => void;
  availableQuantities?: Array<{ id: string; code?: string; name: string; isActive?: boolean }>;
  placeholder?: string;
  excludeNames?: string[];
  className?: string;
}

export function QuantityAutocomplete({
  value,
  onChange,
  availableQuantities,
  placeholder = 'Select unit',
  excludeNames = [],
  className,
}: QuantityAutocompleteProps) {
  const { activeItems: masterUnits } = useMasterOptions('units');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query state with external value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Determine list of units to display
  const unitsList = useMemo(() => {
    if (availableQuantities && availableQuantities.length > 0) {
      return availableQuantities.filter((item) => item.isActive !== false);
    }
    return masterUnits;
  }, [availableQuantities, masterUnits]);

  // Filter units based on user query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unitsList;
    return unitsList.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [unitsList, query]);

  const selectItem = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  const hasExactMatch = unitsList.some(
    (u) => u.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={cn('relative flex-1 min-w-0', className)}>
      <div className="relative flex items-center">
        <input
          type="text"
          required
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (
                suggestions.length > 0 &&
                !suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase())
              ) {
                selectItem(suggestions[0].name);
              } else {
                setIsOpen(false);
              }
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-2.5 pr-14 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
        />

        {/* Clear and Dropdown Toggle icons */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setQuery('');
                onChange('');
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            title="Browse Master Setup Units"
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                isOpen ? 'rotate-180 text-[#0B3D32] dark:text-emerald-400' : 'text-slate-400'
              )}
            />
          </button>
        </div>
      </div>

      {/* Dynamic Dropdown from Master Setup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar animate-in fade-in-50 duration-100">
          <div className="px-2.5 py-1.5 bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#E5EEE9] dark:border-[#145447] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
              Master Setup Units ({unitsList.length})
            </span>
            <span className="text-[9px] text-slate-400">Unit Setup</span>
          </div>

          <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
            {/* If user typed custom unit that's not in the list, offer quick use */}
            {query.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={() => selectItem(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-[#0B3D32] dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">Use &ldquo;{query.trim()}&rdquo;</span>
                <span className="ml-auto text-[9px] text-slate-400 uppercase font-mono">Custom</span>
              </button>
            )}

            {suggestions.length > 0 ? (
              suggestions.map((item) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase();
                const isUsedInOther = excludeNames.includes(item.name) && !isSelected;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]',
                      isUsedInOther && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.code && (
                        <span className="font-mono text-[9px] font-bold uppercase rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] px-1.5 py-0.5 text-[#0B3D32] dark:text-emerald-300 border border-slate-200 dark:border-[#145447]">
                          {item.code}
                        </span>
                      )}
                      <span className="truncate font-medium">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isUsedInOther && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          Already added
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                No matching units found. Type to use a custom unit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

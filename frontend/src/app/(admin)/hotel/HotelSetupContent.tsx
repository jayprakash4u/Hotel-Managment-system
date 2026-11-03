'use client';



import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Globe,
  UtensilsCrossed,
  Layers,
  DollarSign,
  Users,
  Sparkles,
  UserCheck,
  Clock,
  MapPin,
  Flag,
  Scale,
  Compass,
  ShieldCheck,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ArrowLeft,
  BedDouble,
  BedSingle,
  Building2,
  Coffee,
  Snowflake,
  Armchair,
  DoorOpen,
  HeartHandshake,
  LayoutList,
  Eye,
  Package,
} from 'lucide-react';
import { RoomSetupView } from '@/components/hotel/RoomSetupView';
import { RoomDetailsModal } from '@/components/hotel/RoomDetailsModal';

import {
  SubOptionBox,
  MasterCategory,
  QuantityPriceTier,
  MasterItemEntry,
  MASTER_CATEGORIES,
  HOTEL_CATEGORY,
  RESTAURANT_CATEGORY,
  INITIAL_MASTER_ITEMS,
  getFallbackItemsForSubBox,
  getSubBoxEntityName,
} from '@/lib/hotelSetupInitialData';
import {
  RoomRecord,
  saveHotelRoomsToStorage,
  loadHotelRoomsFromStorage,
} from '@/lib/hotelRoomsData';
import { cn } from '@/lib/utils';
import {
  DEFAULT_RELATIONSHIPS,
  DEFAULT_ID_DOCUMENT_TYPES,
  DEFAULT_NATIONALITIES,
  DEFAULT_PURPOSE_OF_VISIT,
  getMasterItems,
  saveMasterItems,
  SimpleMasterItem,
  MASTERS_UPDATED_EVENT,
} from '@/lib/mastersData';

interface CategoryAutocompleteProps {
  value: string;
  onChange: (categoryName: string) => void;
  onAddNewCategory?: (categoryName: string) => void;
  availableCategories: MasterItemEntry[];
  placeholder?: string;
}

function CategoryAutocomplete({
  value,
  onChange,
  onAddNewCategory,
  availableCategories,
  placeholder = 'Search category...',
}: CategoryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) {
          setQuery(value);
        }
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [query, value]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableCategories;
    return availableCategories.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchCode = cat.code?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [availableCategories, query]);

  const hasNoExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return !availableCategories.some((c) => c.name.toLowerCase() === q);
  }, [availableCategories, query]);

  const selectCategory = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateAndSelect = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (onAddNewCategory) {
      onAddNewCategory(trimmed);
    } else {
      onChange(trimmed);
    }
    setQuery(trimmed);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required
          value={query}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex((prev) =>
                prev < filteredCategories.length - 1 ? prev + 1 : 0
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCategories.length - 1
              );
            } else if (e.key === 'Enter') {
              if (isOpen) {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
                  selectCategory(filteredCategories[highlightedIndex].name);
                } else if (filteredCategories.length > 0 && !hasNoExactMatch) {
                  selectCategory(filteredCategories[0].name);
                } else if (hasNoExactMatch) {
                  handleCreateAndSelect(query.trim());
                } else {
                  setIsOpen(false);
                }
              }
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
        />

        {/* Clear and Dropdown Toggle */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setQuery('');
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Clear category"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            title="Toggle category list"
          >
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                isOpen ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar animate-in fade-in-50 duration-100">
          {filteredCategories.length > 0 && (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {filteredCategories.map((cat, idx) => {
                const isSelected = cat.name.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : isHighlighted
                        ? 'bg-slate-50 text-[#24352F] dark:bg-[#0A2E26] dark:text-[#E5EEE9]'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {cat.code && (
                        <span className="font-mono text-[9px] font-bold uppercase rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] px-1.5 py-0.5 text-[#0B3D32] dark:text-emerald-300 border border-slate-200 dark:border-[#145447]">
                          {cat.code}
                        </span>
                      )}
                      <span className="truncate font-medium">{cat.name}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Add New Category option if query has no exact match */}
          {hasNoExactMatch && (
            <div className={filteredCategories.length > 0 ? 'border-t border-slate-100 dark:border-[#145447]' : ''}>
              <button
                type="button"
                onClick={() => handleCreateAndSelect(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  Create <strong className="font-semibold">&quot;{query.trim()}&quot;</strong>
                </span>
              </button>
            </div>
          )}

          {filteredCategories.length === 0 && !hasNoExactMatch && (
            <div className="px-3 py-2.5 text-center text-xs text-slate-400">
              No categories found
            </div>
          )}
        </div>
      )}

    </div>
  );
}

interface QuantityAutocompleteProps {
  value: string;
  onChange: (quantityName: string) => void;
  availableQuantities: MasterItemEntry[];
  placeholder?: string;
  excludeNames?: string[];
}

function QuantityAutocomplete({
  value,
  onChange,
  availableQuantities,
  placeholder = 'Select or type unit...',
  excludeNames = [],
}: QuantityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query when value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter available quantities based on user input
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableQuantities;
    return availableQuantities.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [availableQuantities, query]);

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

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
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
              if (suggestions.length > 0 && !suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase())) {
                selectItem(suggestions[0].name);
              } else {
                setIsOpen(false);
              }
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
        />

        {/* Clear or Dropdown Chevron icon */}
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
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            title="Toggle suggestions"
          >
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                isOpen ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar animate-in fade-in-50 duration-100">
          {suggestions.length > 0 ? (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {suggestions.map((item) => {
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
                      isUsedInOther && 'opacity-50'
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
              })}
            </div>
          ) : (
            <div className="py-1">
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => selectItem(query.trim())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Create <strong className="font-semibold">&quot;{query.trim()}&quot;</strong>
                  </span>
                </button>
              ) : (
                <div className="px-3 py-2.5 text-center text-xs text-slate-400">No matching units</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RoomFacilitiesCategoryPickerProps {
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
  availableFacilities: MasterItemEntry[];
  availableCategories: MasterItemEntry[];
  onAddNewFacility?: (facilityName: string, categoryName: string) => void;
}

function RoomFacilitiesCategoryPicker({
  selectedFacilities,
  onChange,
  availableFacilities,
  availableCategories,
  onAddNewFacility,
}: RoomFacilitiesCategoryPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [customCategory, setCustomCategory] = useState<string>(
    availableCategories[0]?.name || 'Room Furniture'
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter available facilities that aren't already selected
  const unselectedFacilities = useMemo(() => {
    return availableFacilities.filter((f) => !selectedFacilities.includes(f.name));
  }, [availableFacilities, selectedFacilities]);

  // Suggestions based on search query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unselectedFacilities;
    return unselectedFacilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.code && f.code.toLowerCase().includes(q))
    );
  }, [unselectedFacilities, query]);


  // Add a facility
  const handleAddFacility = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedFacilities.includes(trimmed)) return;
    onChange([...selectedFacilities, trimmed]);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Add custom facility not currently in master
  const handleAddCustom = (name: string, category: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (onAddNewFacility) {
      onAddNewFacility(trimmed, category);
    } else {
      handleAddFacility(trimmed);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Remove a facility
  const handleRemoveFacility = (name: string) => {
    onChange(selectedFacilities.filter((f) => f !== name));
  };

  // Clear all facilities in a specific category
  const handleClearCategory = (categoryName: string) => {
    const toRemove = new Set(
      availableFacilities
        .filter((f) => (f.category || 'General') === categoryName)
        .map((f) => f.name)
    );
    onChange(selectedFacilities.filter((f) => !toRemove.has(f)));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && suggestions[highlightedIndex]) {
        handleAddFacility(suggestions[highlightedIndex].name);
      } else if (query.trim()) {
        const exactMatch = availableFacilities.find(
          (f) => f.name.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactMatch) {
          handleAddFacility(exactMatch.name);
        } else {
          handleAddCustom(query.trim(), customCategory);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // AUTOMATICALLY GROUP SELECTED FACILITIES CATEGORY-WISE
  const selectedCategoryGroups = useMemo(() => {
    const catMap = new Map<string, string[]>();

    // Seed categories from availableCategories
    availableCategories.forEach((cat) => {
      if (cat.name) catMap.set(cat.name, []);
    });

    // Populate selected facilities into their categories
    selectedFacilities.forEach((facName) => {
      const matched = availableFacilities.find(
        (f) => f.name.toLowerCase() === facName.toLowerCase()
      );
      const cat = matched?.category?.trim() || 'Room Furniture';
      if (!catMap.has(cat)) {
        catMap.set(cat, []);
      }
      catMap.get(cat)!.push(facName);
    });

    const groups: { category: string; items: string[] }[] = [];
    catMap.forEach((items, category) => {
      if (items.length > 0) {
        groups.push({ category, items });
      }
    });

    return groups;
  }, [selectedFacilities, availableFacilities, availableCategories]);

  return (
    <div className="space-y-2 pt-1">
      {/* Header with counter and clear button */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Room Facilities {selectedFacilities.length > 0 && `(${selectedFacilities.length})`}
        </label>
        {selectedFacilities.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-400 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search Input with Autocomplete Dropdown */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search facility (e.g. Chair, TV, Shower)..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-8 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestion Popover Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar">
            {suggestions.length > 0 ? (
              <div className="p-1 divide-y divide-[#F0F4F2] dark:divide-[#0E3B31]">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={item.id || item.name}
                      type="button"
                      onClick={() => handleAddFacility(item.name)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-[2px] transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-[#EEF4F1] text-[#0B3D32] font-semibold dark:bg-[#0A2E26] dark:text-emerald-300'
                          : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-medium">{item.name}</span>
                      </div>
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#F2F6F4] text-[#4A6458] border border-[#DCE3DF] dark:bg-[#082820] dark:text-emerald-300 dark:border-[#145447] shrink-0 ml-2">
                          {item.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Custom facility creation if query has text not in list */}
            {query.trim() && !availableFacilities.some((f) => f.name.toLowerCase() === query.trim().toLowerCase()) && (
              <div className="p-2 border-t border-[#F0F4F2] dark:border-[#0E3B31] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#0B3D32] dark:text-emerald-300 truncate">
                  Add &ldquo;{query.trim()}&rdquo; to:
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="rounded-[2px] border border-[#DCE3DF] bg-white px-2 py-1 text-[11px] font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddCustom(query.trim(), customCategory)}
                    className="px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Added Facilities: AUTOMATICALLY ORGANIZED CATEGORY-WISE */}
      {selectedCategoryGroups.length > 0 && (
        <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
          {selectedCategoryGroups.map((group) => (
            <div
              key={group.category}
              className="p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-1.5"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#355245] dark:text-emerald-300">
                    {group.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ({group.items.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCategory(group.category)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                >
                  Clear {group.category}
                </button>
              </div>

              {/* Facility Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {group.items.map((fac) => (
                  <span
                    key={fac}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-white dark:bg-[#0A2E26] text-[#0B3D32] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447] shadow-2xs group animate-in fade-in duration-100"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{fac}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(fac)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 rounded-[2px] p-0.5 transition-colors cursor-pointer"
                      title={`Remove ${fac}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotelSetupContent({
  initialCategory = 'general',
  initialSub = null,
}: {
  initialCategory?: string;
  initialSub?: string | null;
} = {}) {
  // Currently selected category (Default: 'general' or initialCategory)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategory === 'room-setup'
      ? 'room-setup'
      : initialCategory === 'restaurant-setup'
        ? 'restaurant-setup'
        : initialCategory === 'employee-setup'
          ? 'employee-setup'
          : 'general'
  );

  // Full-page Room Setup view state: default to true in Hotel Setup so clicking/opening Add Room directly shows the form
  const [showFullPageRoomSetup, setShowFullPageRoomSetup] = useState<boolean>(() => {
    if (initialCategory === 'room-setup') {
      return initialSub === 'room-list-setup' ? false : true;
    }
    return false;
  });
  const [selectedRoomRecordForEdit, setSelectedRoomRecordForEdit] = useState<RoomRecord | null>(null);
  const [viewingRoomRecord, setViewingRoomRecord] = useState<RoomRecord | null>(null);

  // Currently selected sub-box (Default: null or initialSub)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(
    initialSub || (initialCategory === 'room-setup' ? 'add-room-setup' : initialCategory === 'restaurant-setup' ? 'categories-setup' : null)
  );

  // Sync state if props change (e.g. navigating to Our Menu)
  useEffect(() => {
    if (initialCategory === 'room-setup') {
      setSelectedCategoryId('room-setup');
      if (initialSub === 'room-list-setup') {
        setSelectedSubId('room-list-setup');
        setShowFullPageRoomSetup(false);
      } else {
        setSelectedSubId('add-room-setup');
        setShowFullPageRoomSetup(true);
      }
    } else if (initialCategory === 'restaurant-setup') {
      setSelectedCategoryId('restaurant-setup');
      setSelectedSubId((prev) => (initialSub ? initialSub : prev || 'categories-setup'));
      setShowFullPageRoomSetup(false);
    } else {
      setSelectedCategoryId((prev) => (prev === 'employee-setup' ? 'employee-setup' : 'general'));
      if (initialSub !== undefined) setSelectedSubId(initialSub);
      setShowFullPageRoomSetup(false);
    }
  }, [initialCategory, initialSub]);

  // Search filter for options inside the secondary sub-sidebar (Level 2)
  const [searchOptionsQuery, setSearchOptionsQuery] = useState<string>('');

  // Table-level search and filter states
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  // Room-specific filter states for Level 2 Room Inventory
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  const [roomFloorFilter, setRoomFloorFilter] = useState<string>('all');

  // Editable master items map
  const [masterItemsMap, setMasterItemsMap] = useState<Record<string, MasterItemEntry[]>>(INITIAL_MASTER_ITEMS);

  // Room modal form state
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomFloor, setRoomFloor] = useState<string>('1st Floor');
  const [roomType, setRoomType] = useState<string>('Standard Room');
  const [roomACType, setRoomACType] = useState<string>('Air Conditioned (AC)');
  const [roomBedType, setRoomBedType] = useState<string>('King Bed');
  const [roomPrice, setRoomPrice] = useState<string>('200');
  const [roomCapacity, setRoomCapacity] = useState<string>('2');
  const [roomFacilities, setRoomFacilities] = useState<string[]>([]);
  const [roomNotes, setRoomNotes] = useState<string>('');

  // Hydrate custom rooms setup and relationships from localStorage in ONE single batched update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const updates: Record<string, MasterItemEntry[]> = {
          relationships: getMasterItems('relationships'),
          'id-document-types': getMasterItems('idDocumentTypes'),
          nationalities: getMasterItems('nationalities'),
          'purpose-of-visit': getMasterItems('purposeOfVisit'),
          'agent-setup': getMasterItems('bookingAgents'),
          'quantity-setup': getMasterItems('units') as unknown as MasterItemEntry[],
        };

        const storedRooms = localStorage.getItem('hotel_rooms_setup');
        if (storedRooms) {
          try {
            const parsed = JSON.parse(storedRooms);
            if (Array.isArray(parsed) && parsed.length > 0) {
              updates['add-room-setup'] = parsed;
              updates['room-list-setup'] = parsed;
            }
          } catch {}
        }

        const storedMenu = localStorage.getItem('hotel_menu_items');
        if (storedMenu) {
          try {
            const parsed = JSON.parse(storedMenu);
            if (Array.isArray(parsed) && parsed.length > 0) {
              updates['menu-items-setup'] = parsed;
            }
          } catch {}
        }

        const masterKeys = [
          'item-setup',
          'item-categories-setup',
          'room-type-master',
          'ac-type-master',
          'bed-type-master',
          'floor-master',
          'facility-category-master',
          'facility-master',
          'categories-setup',
          'table-setup',
          'table-categories-setup',
          'employee-setup',
          'staff-roles-setup',
          'departments-setup',
        ];
        masterKeys.forEach((key) => {
          const storedMaster = localStorage.getItem(`hotel_master_${key}`);
          if (storedMaster) {
            try {
              const parsedMaster = JSON.parse(storedMaster);
              if (Array.isArray(parsedMaster) && parsedMaster.length > 0) {
                updates[key] = parsedMaster;
              }
            } catch {}
          }
        });

        // Single batch update preventing multiple re-renders
        setMasterItemsMap((prev) => ({
          ...prev,
          ...updates,
        }));
      } catch (err) {}
    }

    const handleMastersUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'units') {
        setMasterItemsMap((prev) => ({
          ...prev,
          'quantity-setup': getMasterItems('units') as unknown as MasterItemEntry[],
        }));
      }
    };
    window.addEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdate);
    window.addEventListener('storage', handleMastersUpdate);

    return () => {
      window.removeEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdate);
      window.removeEventListener('storage', handleMastersUpdate);
    };
  }, []);

  // New item form state (Code, Display Name, Description, Category, Quantity Prices, Order)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newQuantityPrices, setNewQuantityPrices] = useState<
    Array<{ quantityName: string; price: string }>
  >([]);
  const [newOrder, setNewOrder] = useState<string>('');
  const [newTrackStock, setNewTrackStock] = useState<boolean>(false);
  const [newStock, setNewStock] = useState<string>('');
  const [newUnit, setNewUnit] = useState<string>('pieces');
  const [newBasePrice, setNewBasePrice] = useState<string>('');

  // Available categories for menu items setup
  const availableCategories = useMemo(() => {
    return masterItemsMap['categories-setup'] || INITIAL_MASTER_ITEMS['categories-setup'] || [];
  }, [masterItemsMap]);

  // Available categories for item & product setup (amenities, goods, products)
  const availableItemCategories = useMemo(() => {
    const saved = masterItemsMap['item-categories-setup'];
    if (saved && saved.length > 0) return saved;

    const defaults = [
      'Guest Amenities',
      'Housekeeping & Supplies',
      'Linen & Bedding',
      'Toiletries & Hygiene',
      'Minibar & Beverages',
      'Food & Snacks',
      'Room Assets & Electronics',
      'Maintenance & Hardware',
    ];
    const set = new Set<string>(defaults);
    (masterItemsMap['item-setup'] || INITIAL_MASTER_ITEMS['item-setup'] || []).forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).map((name, idx) => ({
      id: `item-cat-${idx + 1}`,
      code: `IC${idx + 1}`,
      name,
    }));
  }, [masterItemsMap]);

  // Available categories for facility master
  const availableFacilityCategories = useMemo(() => {
    return (
      masterItemsMap['facility-category-master'] ||
      INITIAL_MASTER_ITEMS['facility-category-master'] ||
      []
    );
  }, [masterItemsMap]);

  // Available quantities for quantity-based pricing & unit selection
  const availableQuantities = useMemo(() => {
    return (
      masterItemsMap['units'] ||
      masterItemsMap['quantity-setup'] ||
      (getMasterItems('units') as unknown as MasterItemEntry[]) ||
      INITIAL_MASTER_ITEMS['quantity-setup'] ||
      []
    );
  }, [masterItemsMap]);

  // Available room types from room-type-master
  const availableRoomTypes = useMemo(() => {
    return masterItemsMap['room-type-master'] || INITIAL_MASTER_ITEMS['room-type-master'] || [];
  }, [masterItemsMap]);

  // Available AC types from ac-type-master
  const availableACTypes = useMemo(() => {
    return masterItemsMap['ac-type-master'] || INITIAL_MASTER_ITEMS['ac-type-master'] || [];
  }, [masterItemsMap]);

  // Available bed types from bed-type-master
  const availableBedTypes = useMemo(() => {
    return masterItemsMap['bed-type-master'] || INITIAL_MASTER_ITEMS['bed-type-master'] || [];
  }, [masterItemsMap]);

  // Available floor levels from floor-master
  const availableFloors = useMemo(() => {
    return masterItemsMap['floor-master'] || INITIAL_MASTER_ITEMS['floor-master'] || [];
  }, [masterItemsMap]);

  // Available facilities from facility-master
  const availableFacilities = useMemo(() => {
    return masterItemsMap['facility-master'] || INITIAL_MASTER_ITEMS['facility-master'] || [];
  }, [masterItemsMap]);

  // Stable memoized references for RoomSetupView to avoid unnecessary re-renders
  const memoizedRoomTypeNames = useMemo(
    () => availableRoomTypes.map((t) => t.name),
    [availableRoomTypes]
  );
  const memoizedFloorNames = useMemo(
    () => availableFloors.map((f) => f.name),
    [availableFloors]
  );
  const memoizedACTypeNames = useMemo(
    () => availableACTypes.map((a) => a.name),
    [availableACTypes]
  );
  const memoizedBedTypeNames = useMemo(
    () => availableBedTypes.map((b) => b.name),
    [availableBedTypes]
  );
  const memoizedFacilityItems = useMemo(
    () =>
      availableFacilities.map((fac) => ({
        name: fac.name,
        category: fac.category || 'General',
      })),
    [availableFacilities]
  );


  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddForm) {
        setShowAddForm(false);
        setEditingItemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm]);

  const isHotelModule = initialCategory === 'room-setup';
  const isRestaurantModule = initialCategory === 'restaurant-setup';

  const hotelCategory = HOTEL_CATEGORY;
  const restaurantCategory = RESTAURANT_CATEGORY;

  // Categories to display in top row:
  // - In Master Setup (from Shared Modules): ONLY General Master and Employee & Staff Setup
  // - In Hotel Setup (from Hotel sidebar): Sub-boxes of hotelCategory shown directly in a single row
  // - In Restaurant Setup (from Restaurant sidebar): Sub-boxes of restaurantCategory shown directly in a single row
  const displayedCategories = useMemo(() => {
    if (isHotelModule) {
      return [hotelCategory];
    }
    if (isRestaurantModule) {
      return [restaurantCategory];
    }
    return MASTER_CATEGORIES.filter(
      (cat) => cat.id === 'general' || cat.id === 'employee-setup'
    );
  }, [isHotelModule, isRestaurantModule, hotelCategory, restaurantCategory]);

  // Active category: strictly constrained to dedicated module or displayedCategories
  const activeCategory = useMemo(() => {
    if (isHotelModule) return hotelCategory;
    if (isRestaurantModule) return restaurantCategory;
    return (
      displayedCategories.find((cat) => cat.id === selectedCategoryId) ||
      displayedCategories[0] ||
      MASTER_CATEGORIES[0]
    );
  }, [displayedCategories, selectedCategoryId, isHotelModule, isRestaurantModule, hotelCategory, restaurantCategory]);

  // Clean title for current category
  const categoryHeaderTitle = useMemo(() => {
    return activeCategory.name;
  }, [activeCategory]);

  // Active sub-option box (when selectedSubId is non-null)
  const activeSubBox = useMemo(() => {
    if (!selectedSubId) return activeCategory.subBoxes[0];
    return activeCategory.subBoxes.find((b) => b.id === selectedSubId) || activeCategory.subBoxes[0];
  }, [activeCategory, selectedSubId]);

  // Handle clicking a top category box (1 to 12) -> switches category and opens its Level 1 box grid
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubId(null); // Sub-options will show as boxes below the straight line!
    setSearchOptionsQuery('');
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking a sub-option box below the straight line -> opens Level 2 (sidebar + table)
  const handleSelectSubBox = (subId: string) => {
    setSelectedSubId(subId);
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking the Back button on the secondary sidebar -> returns to Level 1 box grid
  const handleBackToBoxes = () => {
    setSelectedSubId(null);
    setSearchOptionsQuery('');
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Filtered sub-options inside the secondary sidebar (Level 2)
  const filteredSubBoxes = useMemo(() => {
    if (!searchOptionsQuery.trim()) return activeCategory.subBoxes;
    const q = searchOptionsQuery.toLowerCase().trim();
    return activeCategory.subBoxes.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [activeCategory, searchOptionsQuery]);

  // Current items for the active sub-box
  const currentItems = useMemo(() => {
    if (activeSubBox.id === 'room-list-setup') {
      return masterItemsMap['add-room-setup'] || INITIAL_MASTER_ITEMS['add-room-setup'] || [];
    }
    if (masterItemsMap[activeSubBox.id]) {
      return masterItemsMap[activeSubBox.id];
    }
    return getFallbackItemsForSubBox(activeSubBox.id, activeSubBox.name);
  }, [activeSubBox, masterItemsMap]);

  const isRoomSetup = activeSubBox.id === 'add-room-setup' || activeSubBox.id === 'room-list-setup';
  const isItemSetup = activeSubBox.id === 'item-setup';
  const isMenuItem = activeSubBox.id === 'menu-items-setup';
  const isFacilityItem = activeSubBox.id === 'facility-master';
  const hasCategory = isMenuItem || isFacilityItem || isItemSetup;

  const currentCategoryList = useMemo(() => {
    if (isItemSetup) return availableItemCategories;
    if (isFacilityItem) return availableFacilityCategories;
    return availableCategories;
  }, [isItemSetup, isFacilityItem, availableItemCategories, availableFacilityCategories, availableCategories]);

  // Available unique categories for the table filter dropdown
  const tableCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    currentCategoryList.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    currentItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [currentCategoryList, currentItems]);

  // Filtered items in the table (search + category filter or room filters)
  const filteredItems = useMemo(() => {
    let items = currentItems;

    if (isRoomSetup) {
      if (roomTypeFilter !== 'all') {
        items = items.filter(
          (item) => (item.roomType || '').toLowerCase() === roomTypeFilter.toLowerCase()
        );
      }
      if (roomFloorFilter !== 'all') {
        items = items.filter(
          (item) => (item.floorLevel || '').toLowerCase() === roomFloorFilter.toLowerCase()
        );
      }
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase().trim();
        items = items.filter(
          (item) =>
            (item.roomNumber || item.code || '').toLowerCase().includes(q) ||
            (item.name || '').toLowerCase().includes(q) ||
            (item.roomType || '').toLowerCase().includes(q) ||
            (item.floorLevel || '').toLowerCase().includes(q) ||
            (item.bedType || '').toLowerCase().includes(q) ||
            (item.acType || '').toLowerCase().includes(q) ||
            (item.facilities || []).some((fac) => fac.toLowerCase().includes(q))
        );
      }
      return items;
    }

    if (hasCategory && tableCategoryFilter !== 'all') {
      items = items.filter(
        (item) => (item.category || '').toLowerCase() === tableCategoryFilter.toLowerCase()
      );
    }

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.unit && item.unit.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.quantityPrices &&
            item.quantityPrices.some((qp) => qp.quantityName.toLowerCase().includes(q)))
      );
    }

    return items;
  }, [currentItems, hasCategory, isRoomSetup, roomTypeFilter, roomFloorFilter, tableCategoryFilter, tableSearchQuery]);

  // Open modal to add a new item
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    if (isRoomSetup) {
      setSelectedRoomRecordForEdit(null);
      setSelectedSubId('add-room-setup');
      setShowFullPageRoomSetup(true);
      return;
    }

    if (activeSubBox.id === 'item-setup') {
      setNewCode('');
      setNewName('');
      setNewDescription('');
      setNewCategory(availableItemCategories[0]?.name || 'Guest Amenities');
      setNewUnit(availableQuantities[0]?.name || 'pieces');
      setNewBasePrice('');
      setNewTrackStock(true);
      setNewStock('50');
      setNewOrder(((masterItemsMap[activeSubBox.id] || currentItems).length + 1).toString());
      setShowAddForm(true);
      return;
    }

    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewCategory(
      activeSubBox.id === 'facility-master'
        ? availableFacilityCategories[0]?.name || 'Room Furniture'
        : availableCategories[0]?.name || ''
    );
    if (activeSubBox.id === 'menu-items-setup') {
      const defaultUnits = availableQuantities.slice(0, 2).map((q) => ({
        quantityName: q.name,
        price: '',
      }));
      setNewQuantityPrices(
        defaultUnits.length > 0
          ? defaultUnits
          : [
              { quantityName: 'Full Portion', price: '' },
              { quantityName: 'Half Portion', price: '' },
            ]
      );
    } else {
      setNewQuantityPrices(
        availableQuantities.length > 0
          ? [{ quantityName: availableQuantities[0].name, price: '' }]
          : [{ quantityName: 'Regular / Standard', price: '' }]
      );
    }
    setNewOrder(((masterItemsMap[activeSubBox.id] || currentItems).length + 1).toString());
    setShowAddForm(true);
  };

  // Open modal to view room details
  const handleOpenViewModal = (item: MasterItemEntry) => {
    const coverPhoto = item.imageUrl
      ? [{ id: 'cov', url: item.imageUrl, category: 'COVER' as const, isCover: true }]
      : [];
    const record: RoomRecord = {
      id: item.id,
      number: item.roomNumber || item.code,
      floor: parseInt((item.floorLevel || '1').replace(/\D/g, ''), 10) || 1,
      type: item.roomType || item.category || 'Standard Room',
      bedType: item.bedType || (availableBedTypes[0]?.name || 'King Bed'),
      acType: item.acType || (availableACTypes[0]?.name || 'Air Conditioned (AC)'),
      pricePerNight: item.basePrice || 3500,
      capacity: item.capacity || 2,
      operationalStatus: (item.status as any) || 'AVAILABLE',
      cleaningStatus: 'CLEAN',
      description: item.description,
      roomSize: item.roomSize,
      roomView: item.roomView,
      maxAdults: item.maxAdults || item.capacity || 2,
      maxChildren: item.maxChildren || 1,
      smokingPolicy: (item.smokingPolicy as any) || 'Non-Smoking',
      accessibility: item.accessibility,
      bedConfiguration: item.bedConfiguration || [{ bedType: item.bedType || 'King Bed', count: 1 }],
      bathroomFacilities: item.bathroomFacilities || item.facilities || [],
      amenities: item.amenities || [],
      photos: item.photos && item.photos.length > 0 ? item.photos : coverPhoto,
      extraAdultPrice: item.extraAdultPrice || 0,
      extraChildPrice: item.extraChildPrice || 0,
      weekendPrice: item.weekendPrice || 0,
      policies: item.policies,
    };
    setViewingRoomRecord(record);
  };

  // Open modal to edit an existing item
  const handleOpenEditModal = (item: MasterItemEntry) => {
    setEditingItemId(item.id);
    if (isRoomSetup) {
      const coverPhoto = item.imageUrl
        ? [{ id: 'cov', url: item.imageUrl, category: 'COVER' as const, isCover: true }]
        : [];
      const record: RoomRecord = {
        id: item.id,
        number: item.roomNumber || item.code,
        floor: parseInt((item.floorLevel || '1').replace(/\D/g, ''), 10) || 1,
        type: item.roomType || 'Standard Room',
        bedType: item.bedType || (availableBedTypes[0]?.name || 'King Bed'),
        acType: item.acType || (availableACTypes[0]?.name || 'Air Conditioned (AC)'),
        pricePerNight: item.basePrice || 3500,
        capacity: item.capacity || 2,
        operationalStatus: (item.status as any) || 'AVAILABLE',
        cleaningStatus: 'CLEAN',
        description: item.description,
        roomSize: item.roomSize,
        roomView: item.roomView,
        maxAdults: item.maxAdults || item.capacity || 2,
        maxChildren: item.maxChildren || 1,
        smokingPolicy: (item.smokingPolicy as any) || 'Non-Smoking',
        accessibility: item.accessibility,
        bedConfiguration: item.bedConfiguration || [{ bedType: item.bedType || 'King Bed', count: 1 }],
        bathroomFacilities: item.bathroomFacilities || item.facilities || [],
        amenities: item.amenities || [],
        photos: item.photos || coverPhoto,
        extraAdultPrice: item.extraAdultPrice || 0,
        extraChildPrice: item.extraChildPrice || 0,
        weekendPrice: item.weekendPrice || 0,
        policies: item.policies,
      };
      setSelectedRoomRecordForEdit(record);
      setShowFullPageRoomSetup(true);
      return;
    }

    if (activeSubBox.id === 'item-setup') {
      setNewCode(item.code);
      setNewName(item.name);
      setNewDescription(item.description || '');
      setNewCategory(item.category || availableItemCategories[0]?.name || 'Guest Amenities');
      setNewUnit(item.unit || item.quantityPrices?.[0]?.quantityName || 'pieces');
      setNewBasePrice(
        item.basePrice !== undefined
          ? item.basePrice.toString()
          : item.quantityPrices?.[0]?.price !== undefined
          ? item.quantityPrices[0].price.toString()
          : ''
      );
      setNewTrackStock(item.trackStock ?? true);
      setNewStock(item.stock !== undefined ? item.stock.toString() : '');
      setNewOrder((item.order || 1).toString());
      setShowAddForm(true);
      return;
    }

    setNewCode(item.code);
    setNewName(item.name);
    setNewDescription(item.description || '');
    setNewCategory(item.category || '');
    if (item.quantityPrices && item.quantityPrices.length > 0) {
      setNewQuantityPrices(
        item.quantityPrices.map((qp) => ({
          quantityName: qp.quantityName,
          price: qp.price.toString(),
        }))
      );
    } else if (item.basePrice !== undefined) {
      setNewQuantityPrices([
        {
          quantityName: availableQuantities[0]?.name || 'Regular / Standard',
          price: item.basePrice.toString(),
        },
      ]);
    } else {
      setNewQuantityPrices([
        {
          quantityName: availableQuantities[0]?.name || 'Regular / Standard',
          price: '',
        },
      ]);
    }
    setNewOrder((item.order || 1).toString());
    setNewTrackStock(Boolean(item.trackStock));
    setNewStock(item.trackStock && item.stock !== undefined ? item.stock.toString() : '');
    setShowAddForm(true);
  };

  // Add new category directly from the category autocomplete search
  const handleAddNewCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;

    if (activeSubBox.id === 'item-setup') {
      const existing = availableItemCategories.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        setNewCategory(existing.name);
        return;
      }

      const code =
        trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
        `IC${availableItemCategories.length + 1}`;

      const newCatEntry: MasterItemEntry = {
        id: `item-cat-${Date.now()}`,
        code,
        name: trimmed,
        order: availableItemCategories.length + 1,
        isActive: true,
      };

      setMasterItemsMap((prev) => {
        const updatedCats = [
          ...(prev['item-categories-setup'] || availableItemCategories),
          newCatEntry,
        ];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('hotel_master_item-categories-setup', JSON.stringify(updatedCats));
          } catch {}
        }
        return {
          ...prev,
          'item-categories-setup': updatedCats,
        };
      });
      setNewCategory(trimmed);
      return;
    }

    if (activeSubBox.id === 'facility-master') {
      const existing = availableFacilityCategories.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        setNewCategory(existing.name);
        return;
      }

      const code =
        trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
        `FAC${availableFacilityCategories.length + 1}`;

      const newCatEntry: MasterItemEntry = {
        id: `fcm-${Date.now()}`,
        code,
        name: trimmed,
        order: availableFacilityCategories.length + 1,
        isActive: true,
      };

      setMasterItemsMap((prev) => ({
        ...prev,
        'facility-category-master': [
          ...(prev['facility-category-master'] || availableFacilityCategories),
          newCatEntry,
        ],
      }));
      setNewCategory(trimmed);
      return;
    }

    // Default menu category
    const existing = availableCategories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setNewCategory(existing.name);
      return;
    }

    const code =
      trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      `CAT${availableCategories.length + 1}`;

    const newCatEntry: MasterItemEntry = {
      id: `cat-${Date.now()}`,
      code,
      name: trimmed,
      order: availableCategories.length + 1,
      isActive: true,
    };

    setMasterItemsMap((prev) => ({
      ...prev,
      'categories-setup': [...(prev['categories-setup'] || availableCategories), newCatEntry],
    }));
    setNewCategory(trimmed);
  };

  // Add new facility with category (called directly from Add Room modal inline picker)
  const handleAddNewFacilityWithCategory = (facilityName: string, categoryName: string) => {
    const trimmed = facilityName.trim();
    if (!trimmed) return;

    // Check if facility already exists
    const existing = availableFacilities.find(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (!roomFacilities.includes(existing.name)) {
        setRoomFacilities((prev) => [...prev, existing.name]);
      }
      return;
    }

    const code =
      trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      `FAC${availableFacilities.length + 1}`;

    const newFacEntry: MasterItemEntry = {
      id: `fm-${Date.now()}`,
      code,
      name: trimmed,
      category: categoryName || 'Room Furniture',
      order: availableFacilities.length + 1,
      isActive: true,
    };

    setMasterItemsMap((prev) => ({
      ...prev,
      'facility-master': [
        ...(prev['facility-master'] || availableFacilities),
        newFacEntry,
      ],
    }));

    // Auto-select for the current room
    setRoomFacilities((prev) => [...prev, trimmed]);
  };

  // Save new item or update existing item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRoomSetup) {
      if (!roomNumber.trim()) return;

      const parsedPrice = parseFloat(roomPrice) || 0;
      const parsedCap = parseInt(roomCapacity, 10) || 2;
      const parsedOrder = parseInt(newOrder, 10);
      const currentList = masterItemsMap['add-room-setup'] || currentItems;
      const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : currentList.length + 1;

      let updatedRooms: MasterItemEntry[];
      if (editingItemId) {
        updatedRooms = currentList.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                code: roomNumber.trim(),
                roomNumber: roomNumber.trim(),
                name: `Room ${roomNumber.trim()} (${roomType})`,
                floorLevel: roomFloor,
                roomType,
                acType: roomACType,
                bedType: roomBedType,
                basePrice: parsedPrice,
                capacity: parsedCap,
                status: item.status || 'AVAILABLE',
                facilities: roomFacilities,
                description: roomNotes.trim() || undefined,
                order,
              }
            : item
        );
      } else {
        const newRoom: MasterItemEntry = {
          id: `rm-${Date.now()}`,
          code: roomNumber.trim(),
          roomNumber: roomNumber.trim(),
          name: `Room ${roomNumber.trim()} (${roomType})`,
          floorLevel: roomFloor,
          roomType,
          acType: roomACType,
          bedType: roomBedType,
          basePrice: parsedPrice,
          capacity: parsedCap,
          status: 'AVAILABLE',
          facilities: roomFacilities,
          description: roomNotes.trim() || undefined,
          order,
          isActive: true,
        };
        updatedRooms = [...currentList, newRoom];
      }

      setMasterItemsMap((prev) => ({
        ...prev,
        'add-room-setup': updatedRooms,
        'room-list-setup': updatedRooms,
      }));

      // Synchronize to localStorage for /rooms and booking flows
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedRooms));
        } catch (err) {}
      }

      setShowAddForm(false);
      setEditingItemId(null);
      return;
    }

    if (!newName.trim()) return;

    const isItemSetup = activeSubBox.id === 'item-setup';
    const isMenuItem = activeSubBox.id === 'menu-items-setup';
    const isFacilityItem = activeSubBox.id === 'facility-master';
    if (isMenuItem && !newCategory.trim() && availableCategories.length > 0) return;
    if (isItemSetup && !newCategory.trim() && availableItemCategories.length > 0) return;

    const code = newCode.trim().toUpperCase() || newName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const currentList = masterItemsMap[activeSubBox.id] || currentItems;
    const parsedOrder = parseInt(newOrder, 10);
    const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : currentList.length + 1;

    // Process quantity prices & unit
    let parsedQuantityPrices: QuantityPriceTier[] | undefined = undefined;
    let computedBasePrice: number | undefined = undefined;
    let itemUnit: string | undefined = undefined;

    if (isItemSetup) {
      const p = parseFloat(newBasePrice);
      computedBasePrice = !isNaN(p) && p >= 0 ? p : undefined;
      itemUnit = newUnit.trim() || 'pieces';
      if (computedBasePrice !== undefined) {
        parsedQuantityPrices = [{ quantityName: itemUnit, price: computedBasePrice, isDefault: true }];
      }
    } else if (isMenuItem) {
      const validTiers = newQuantityPrices
        .filter((t) => t.quantityName.trim() && !isNaN(parseFloat(t.price)))
        .map((t) => {
          const matched = availableQuantities.find((q) => q.name === t.quantityName);
          return {
            quantityId: matched?.id,
            quantityName: t.quantityName.trim(),
            price: parseFloat(t.price),
          };
        });

      if (validTiers.length > 0) {
        parsedQuantityPrices = validTiers;
        computedBasePrice = validTiers[0].price;
      }
    }

    if (editingItemId) {
      setMasterItemsMap((prev) => {
        const updatedList = (prev[activeSubBox.id] || currentItems).map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                code: code || item.code,
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                ...(isItemSetup || isMenuItem || isFacilityItem
                  ? { category: newCategory.trim() || (isItemSetup ? 'Guest Amenities' : isFacilityItem ? 'Room Furniture' : 'General') }
                  : {}),
                basePrice: computedBasePrice ?? item.basePrice,
                quantityPrices: parsedQuantityPrices ?? item.quantityPrices,
                ...(isItemSetup
                  ? {
                      unit: itemUnit,
                      trackStock: newTrackStock,
                      stock: newTrackStock ? (parseInt(newStock, 10) || 0) : undefined,
                    }
                  : isMenuItem
                  ? {
                      trackStock: newTrackStock,
                      stock: newTrackStock ? (parseInt(newStock, 10) || 0) : undefined,
                    }
                  : {}),
                order,
              }
            : item
        );
        if (activeSubBox.id === 'relationships') saveMasterItems('relationships', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'id-document-types') saveMasterItems('idDocumentTypes', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'nationalities') saveMasterItems('nationalities', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'purpose-of-visit') saveMasterItems('purposeOfVisit', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'agent-setup') saveMasterItems('bookingAgents', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'quantity-setup') saveMasterItems('units', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'item-setup') saveMasterItems('items', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'menu-items-setup' && typeof window !== 'undefined') {
          try {
            localStorage.setItem('hotel_menu_items', JSON.stringify(updatedList));
          } catch (err) {}
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`hotel_master_${activeSubBox.id}`, JSON.stringify(updatedList));
          } catch (err) {}
        }
        return {
          ...prev,
          [activeSubBox.id]: updatedList,
        };
      });
    } else {
      const newItem: MasterItemEntry = {
        id: `${activeSubBox.id}-${Date.now()}`,
        code: code || 'NEW',
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        ...(isItemSetup || isMenuItem || isFacilityItem
          ? { category: newCategory.trim() || (isItemSetup ? 'Guest Amenities' : isFacilityItem ? 'Room Furniture' : 'General') }
          : {}),
        basePrice: computedBasePrice,
        quantityPrices: parsedQuantityPrices,
        ...(isItemSetup
          ? {
              unit: itemUnit,
              trackStock: newTrackStock,
              stock: newTrackStock ? (parseInt(newStock, 10) || 0) : undefined,
            }
          : isMenuItem
          ? {
              trackStock: newTrackStock,
              stock: newTrackStock ? (parseInt(newStock, 10) || 0) : undefined,
            }
          : {}),
        order,
        isActive: true,
      };

      setMasterItemsMap((prev) => {
        const updatedList = [...(prev[activeSubBox.id] || currentItems), newItem];
        if (activeSubBox.id === 'relationships') saveMasterItems('relationships', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'id-document-types') saveMasterItems('idDocumentTypes', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'nationalities') saveMasterItems('nationalities', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'purpose-of-visit') saveMasterItems('purposeOfVisit', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'agent-setup') saveMasterItems('bookingAgents', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'quantity-setup') saveMasterItems('units', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'item-setup') saveMasterItems('items', updatedList as unknown as SimpleMasterItem[]);
        if (activeSubBox.id === 'menu-items-setup' && typeof window !== 'undefined') {
          try {
            localStorage.setItem('hotel_menu_items', JSON.stringify(updatedList));
          } catch (err) {}
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`hotel_master_${activeSubBox.id}`, JSON.stringify(updatedList));
          } catch (err) {}
        }
        return {
          ...prev,
          [activeSubBox.id]: updatedList,
        };
      });
    }

    setEditingItemId(null);
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewCategory('');
    setNewQuantityPrices([]);
    setNewOrder('');
    setNewTrackStock(false);
    setNewStock('');
    setShowAddForm(false);
  };

  // Save from RoomSetupView (Full Page Quick Setup or Detailed Setup)
  const handleSaveRoom = (roomData: RoomRecord, andAddAnother?: boolean) => {
    const currentList = masterItemsMap['add-room-setup'] || currentItems;
    const coverPhoto = roomData.photos?.find((p) => p.isCover) || roomData.photos?.[0];

    const newMasterItem: MasterItemEntry = {
      id: roomData.id,
      code: roomData.number,
      roomNumber: roomData.number,
      name: `Room ${roomData.number}`,
      order: roomData.floor,
      description: roomData.description || `${roomData.type} - ${roomData.acType}, Floor ${roomData.floor}`,
      category: roomData.type,
      basePrice: roomData.pricePerNight,
      floorLevel: `${roomData.floor}${roomData.floor === 1 ? 'st' : roomData.floor === 2 ? 'nd' : roomData.floor === 3 ? 'rd' : 'th'} Floor`,
      roomType: roomData.type,
      acType: roomData.acType,
      bedType: roomData.bedType,
      capacity: roomData.capacity,
      status: roomData.operationalStatus,
      facilities: roomData.bathroomFacilities || [],
      imageUrl: coverPhoto?.url || '',
      roomSize: roomData.roomSize,
      roomView: roomData.roomView,
      maxAdults: roomData.maxAdults,
      maxChildren: roomData.maxChildren,
      smokingPolicy: roomData.smokingPolicy,
      accessibility: roomData.accessibility,
      bedConfiguration: roomData.bedConfiguration,
      bathroomFacilities: roomData.bathroomFacilities,
      amenities: roomData.amenities,
      photos: roomData.photos,
      extraAdultPrice: roomData.extraAdultPrice,
      extraChildPrice: roomData.extraChildPrice,
      weekendPrice: roomData.weekendPrice,
      policies: roomData.policies,
      isActive: true,
    };

    let updatedRooms: MasterItemEntry[];
    const existingIndex = currentList.findIndex((it) => it.id === roomData.id || it.code === roomData.number);
    if (existingIndex >= 0) {
      updatedRooms = [...currentList];
      updatedRooms[existingIndex] = newMasterItem;
    } else {
      updatedRooms = [newMasterItem, ...currentList];
    }

    setMasterItemsMap((prev) => ({
      ...prev,
      'add-room-setup': updatedRooms,
      'room-list-setup': updatedRooms,
    }));

    const allRoomsForStorage: RoomRecord[] = updatedRooms.map((it) => ({
      id: it.id,
      number: it.roomNumber || it.code,
      floor: parseInt((it.floorLevel || '1').replace(/\D/g, ''), 10) || 1,
      type: it.roomType || it.category || 'Standard Room',
      bedType: it.bedType || (availableBedTypes[0]?.name || 'King Bed'),
      acType: it.acType || (availableACTypes[0]?.name || 'Air Conditioned (AC)'),
      pricePerNight: it.basePrice || 3500,
      capacity: it.capacity || 2,
      operationalStatus: (it.status as any) || 'AVAILABLE',
      cleaningStatus: 'CLEAN',
      description: it.description,
      roomSize: it.roomSize,
      roomView: it.roomView,
      maxAdults: it.maxAdults || it.capacity || 2,
      maxChildren: it.maxChildren || 1,
      smokingPolicy: (it.smokingPolicy as any) || 'Non-Smoking',
      accessibility: it.accessibility,
      bedConfiguration: it.bedConfiguration || [{ bedType: it.bedType || 'King Bed', count: 1 }],
      bathroomFacilities: it.bathroomFacilities || it.facilities || [],
      amenities: it.amenities || [],
      photos: it.photos || (it.imageUrl ? [{ id: 'cov', url: it.imageUrl, category: 'COVER', isCover: true }] : []),
      extraAdultPrice: it.extraAdultPrice || 0,
      extraChildPrice: it.extraChildPrice || 0,
      weekendPrice: it.weekendPrice || 0,
      policies: roomData.policies,
    }));
    saveHotelRoomsToStorage(allRoomsForStorage);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedRooms));
      } catch { }
    }

    try {
      fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomData.number,
          floorNumber: roomData.floor,
          pricePerNight: roomData.pricePerNight,
          capacity: roomData.capacity,
          roomSize: roomData.roomSize,
          roomView: roomData.roomView,
          maxAdults: roomData.maxAdults,
          maxChildren: roomData.maxChildren,
          smokingPolicy: roomData.smokingPolicy,
          accessibility: roomData.accessibility,
          bedConfiguration: JSON.stringify(roomData.bedConfiguration || []),
          bathroomFacilities: JSON.stringify(roomData.bathroomFacilities || []),
          galleryImages: JSON.stringify(roomData.photos || []),
          policies: JSON.stringify(roomData.policies || {}),
          extraAdultPrice: roomData.extraAdultPrice,
          extraChildPrice: roomData.extraChildPrice,
          weekendPrice: roomData.weekendPrice,
          description: roomData.description,
        }),
      }).catch(() => { });
    } catch { }

    if (!andAddAnother) {
      setShowFullPageRoomSetup(false);
      setSelectedSubId('room-list-setup');
      setEditingItemId(null);
      setSelectedRoomRecordForEdit(null);
    }
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setMasterItemsMap((prev) => {
      if (isRoomSetup) {
        const roomList = prev['add-room-setup'] || currentItems;
        const updatedRooms = roomList.filter((item) => item.id !== itemId);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedRooms));
            saveHotelRoomsToStorage(
              updatedRooms.map((it) => ({
                id: it.id,
                number: it.roomNumber || it.code,
                floor: parseInt((it.floorLevel || '1').replace(/\D/g, ''), 10) || 1,
                type: it.roomType || it.category || 'Standard Room',
                bedType: it.bedType || 'King Bed',
                acType: it.acType || 'Air Conditioned (AC)',
                pricePerNight: it.basePrice || 3500,
                capacity: it.capacity || 2,
                operationalStatus: (it.status as any) || 'AVAILABLE',
                cleaningStatus: 'CLEAN',
              }))
            );
          } catch (err) {}
        }
        try {
          fetch(`/api/rooms/${itemId}`, { method: 'DELETE' }).catch(() => {});
        } catch {}
        return {
          ...prev,
          'add-room-setup': updatedRooms,
          'room-list-setup': updatedRooms,
        };
      }

      const list = prev[activeSubBox.id] || currentItems;
      const updatedList = list.filter((item) => item.id !== itemId);
      if (activeSubBox.id === 'menu-items-setup' && typeof window !== 'undefined') {
        try {
          localStorage.setItem('hotel_menu_items', JSON.stringify(updatedList));
        } catch (err) {}
      }
      if (activeSubBox.id === 'relationships') saveMasterItems('relationships', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'id-document-types') saveMasterItems('idDocumentTypes', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'nationalities') saveMasterItems('nationalities', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'purpose-of-visit') saveMasterItems('purposeOfVisit', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'agent-setup') saveMasterItems('bookingAgents', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'quantity-setup') saveMasterItems('units', updatedList as unknown as SimpleMasterItem[]);
      if (activeSubBox.id === 'item-setup') saveMasterItems('items', updatedList as unknown as SimpleMasterItem[]);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`hotel_master_${activeSubBox.id}`, JSON.stringify(updatedList));
        } catch (err) {}
      }
      return {
        ...prev,
        [activeSubBox.id]: updatedList,
      };
    });
  };

  const renderTableContent = () => (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-[#F7F5F0] dark:bg-[#071512] overflow-hidden">
            {/* Header Bar: Title, Count, Status Chips, Search & Filter Controls, Add Button */}
            <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EEE9] dark:border-[#145447]/60 bg-white/60 dark:bg-[#071F1A]/60 backdrop-blur-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
                  {activeSubBox.name}
                </h2>
                {isRoomSetup ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-[11px] font-bold bg-[#EEF4F1] text-[#0B3D32] border border-[#DCE3DF] dark:bg-[#0A2E26] dark:text-emerald-300 dark:border-[#145447]">
                    {filteredItems.length} {filteredItems.length === 1 ? 'Room' : 'Rooms'} Configured
                    {filteredItems.length !== currentItems.length && ` (of ${currentItems.length})`}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#F0F4F2] text-[#4D6358] border border-[#DCE3DF] dark:bg-[#0A2E26] dark:text-emerald-300 dark:border-[#145447]">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    {filteredItems.length !== currentItems.length && ` (of ${currentItems.length})`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#879B90]" />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder={
                      isRoomSetup
                        ? 'Search room no., type, floor...'
                        : `Search ${activeSubBox.name.toLowerCase()}...`
                    }
                    className="w-40 sm:w-52 pl-8 pr-7 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] placeholder-[#879B90] focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500"
                  />
                  {tableSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTableSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#879B90] hover:text-[#24352F] dark:hover:text-white"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Room Setup Type Filter */}
                {isRoomSetup && availableRoomTypes.length > 0 && (
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Room Types</option>
                    {availableRoomTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Room Setup Floor Filter */}
                {isRoomSetup && availableFloors.length > 0 && (
                  <select
                    value={roomFloorFilter}
                    onChange={(e) => setRoomFloorFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Floors</option>
                    {availableFloors.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Category Dropdown Filter (Menu Items Setup & Facility Master) */}
                {!isRoomSetup && hasCategory && tableCategoryOptions.length > 0 && (
                  <select
                    value={tableCategoryFilter}
                    onChange={(e) => setTableCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {tableCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {/* Clear filters button if filtering */}
                {(tableSearchQuery ||
                  (isRoomSetup &&
                    (roomTypeFilter !== 'all' ||
                      roomFloorFilter !== 'all')) ||
                  (!isRoomSetup && hasCategory && tableCategoryFilter !== 'all')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableSearchQuery('');
                      setRoomTypeFilter('all');
                      setRoomFloorFilter('all');
                      setTableCategoryFilter('all');
                    }}
                    className="text-xs text-[#0B3D32] hover:underline dark:text-emerald-400 font-semibold px-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {getSubBoxEntityName(activeSubBox)}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Table Area: Divided grid table */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-2xs">
                      {isRoomSetup ? (
                        <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM NO.</th>
                          <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM TYPE</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">FLOOR</th>
                          <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">AC TYPE</th>
                          <th className="py-2.5 px-3.5 w-32 border-r border-[#E5EEE9] dark:border-[#145447]">BED TYPE</th>
                          <th className="py-2.5 px-3.5 w-24 border-r border-[#E5EEE9] dark:border-[#145447]">CAPACITY</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">FARE</th>
                          <th className="py-2.5 px-3.5 min-w-[220px] border-r border-[#E5EEE9] dark:border-[#145447]">FACILITIES</th>
                          <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                        </tr>
                      ) : (
                        <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-14 sm:w-16 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                          <th className="py-2.5 px-3.5 w-24 sm:w-28 border-r border-[#E5EEE9] dark:border-[#145447]">CODE</th>
                          <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isMenuItem ? 'ITEM NAME' : isItemSetup ? 'ITEM / PRODUCT NAME' : isFacilityItem ? 'FACILITY NAME' : 'DISPLAY NAME'}
                          </th>
                          {hasCategory && (
                            <th className="py-2.5 px-3.5 w-36 sm:w-44 border-r border-[#E5EEE9] dark:border-[#145447]">CATEGORY</th>
                          )}
                          {isItemSetup && (
                            <>
                              <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">UNIT</th>
                              <th className="py-2.5 px-3.5 w-32 border-r border-[#E5EEE9] dark:border-[#145447]">BASE PRICE</th>
                              <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">STOCK TRACKING</th>
                            </>
                          )}
                          {isMenuItem && (
                            <th className="py-2.5 px-3.5 min-w-[220px] border-r border-[#E5EEE9] dark:border-[#145447]">UNIT & PRICING</th>
                          )}
                          <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                      {isRoomSetup ? (
                        filteredItems.map((item, index) => {
                          const isAC =
                            (item.acType || '').toLowerCase().includes('ac') &&
                            !(item.acType || '').toLowerCase().includes('non');

                          return (
                            <tr
                              key={item.id}
                              className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                            >
                              {/* Index */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20">
                                <span className="font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                                  {item.order ?? (index + 1)}
                                </span>
                              </td>

                              {/* Room Number */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#EEF4F1] dark:bg-[#0D362C] border border-[#D8E6DF] dark:border-[#145447]">
                                  <DoorOpen className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                                  <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                                    {item.roomNumber || item.code}
                                  </span>
                                </div>
                              </td>

                              {/* Room Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="font-semibold text-xs text-[#24352F] dark:text-white">
                                  {item.roomType || 'Standard Room'}
                                </div>
                              </td>

                              {/* Floor Level */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-[#F4F7F5] dark:bg-[#0A2E26] px-2 py-0.5 text-[11px] font-medium text-[#33463E] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447]">
                                  {item.floorLevel || '1st Floor'}
                                </span>
                              </td>

                              {/* Climate / AC Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-medium border',
                                    isAC
                                      ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700'
                                  )}
                                >
                                  <Snowflake className="w-3 h-3" />
                                  <span>{item.acType || (isAC ? 'AC' : 'Non-AC')}</span>
                                </span>
                              </td>

                              {/* Bed Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="text-xs font-medium text-[#24352F] dark:text-slate-200">
                                  {item.bedType || 'King Bed'}
                                </span>
                              </td>

                              {/* Capacity */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="font-mono text-xs font-semibold text-[#4D6358] dark:text-emerald-300">
                                  {item.capacity || 2} Guests
                                </span>
                              </td>

                              {/* Fare */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  रू {Number(item.basePrice ?? 200).toLocaleString()}
                                </span>
                              </td>

                              {/* Facilities Tag Pills */}
                              <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="flex flex-wrap items-center gap-1 max-w-md">
                                  {item.facilities && item.facilities.length > 0 ? (
                                    item.facilities.map((fac, fIdx) => (
                                      <span
                                        key={fIdx}
                                        className="inline-block rounded-[2px] bg-[#F7F9F8] dark:bg-[#082820] px-1.5 py-0.5 text-[10px] font-medium text-[#4A6458] dark:text-[#A4B8AE] border border-[#DEE6E2] dark:border-[#145447]"
                                      >
                                        {fac}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[#879B90] text-xs">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Action */}
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewModal(item)}
                                    title={`View Details for Room ${item.roomNumber || item.code}`}
                                    className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(item)}
                                    title={`Edit Room ${item.roomNumber || item.code}`}
                                    className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    title={`Delete Room ${item.roomNumber || item.code}`}
                                    className="p-1 rounded-[2px] text-[#879B90] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        filteredItems.map((item, index) => (
                          <tr
                            key={item.id}
                            className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                          >
                            {/* Order / Index */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20">
                              <span className="font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                                {item.order ?? (index + 1)}
                              </span>
                            </td>

                            {/* Code */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                              <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-2 py-0.5 text-[11px] font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                                {item.code}
                              </span>
                            </td>

                            {/* Item / Display Name */}
                            <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                              <div className="font-semibold text-xs text-[#24352F] dark:text-white">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] font-normal truncate max-w-sm mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </td>

                            {/* Category (Menu Items Setup, Facility Master & Item Setup) */}
                            {hasCategory && (
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-[#F4F7F5] dark:bg-[#0A2E26] px-2 py-0.5 text-[11px] font-medium text-[#33463E] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447]">
                                  {item.category || (isItemSetup ? 'Guest Amenities' : isFacilityItem ? 'Room Furniture' : 'General')}
                                </span>
                              </td>
                            )}

                            {/* Item Setup Columns: Unit, Base Price, Stock Tracking */}
                            {isItemSetup && (
                              <>
                                <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                  <span className="inline-flex items-center rounded-[2px] bg-white dark:bg-[#061B16] px-2 py-0.5 text-[11px] font-medium text-[#4D6358] dark:text-[#A4B8AE] border border-[#D5E0DB] dark:border-[#145447] capitalize">
                                    {item.unit || item.quantityPrices?.[0]?.quantityName || 'pieces'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                  <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                                    {item.basePrice !== undefined ? `रू ${Number(item.basePrice).toLocaleString()}` : '—'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                  {item.trackStock ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                                      Tracked {item.stock !== undefined ? `(${item.stock} ${item.unit || 'pcs'})` : ''}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                      Untracked
                                    </span>
                                  )}
                                </td>
                              </>
                            )}

                            {/* Unit & Pricing (Menu Items Setup - divided table-like pill) */}
                            {isMenuItem && (
                              <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.quantityPrices && item.quantityPrices.length > 0 ? (
                                    item.quantityPrices.map((qp, qIdx) => (
                                      <span
                                        key={qIdx}
                                        className="inline-flex items-stretch rounded-[2px] border border-[#D5E0DB] dark:border-[#145447] bg-white dark:bg-[#061B16] text-[11px] overflow-hidden shadow-2xs"
                                        title={`${qp.quantityName}: रू ${qp.price.toLocaleString()}`}
                                      >
                                        <span className="px-2 py-0.5 font-medium text-[#4D6358] dark:text-[#A4B8AE] bg-[#F7F9F8] dark:bg-[#092B23]">
                                          {qp.quantityName}
                                        </span>
                                        <span className="px-2 py-0.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border-l border-[#D5E0DB] dark:border-[#145447] bg-emerald-50/50 dark:bg-emerald-950/40">
                                          रू {Number(qp.price).toLocaleString()}
                                        </span>
                                      </span>
                                    ))
                                  ) : item.basePrice !== undefined ? (
                                    <span className="inline-flex items-stretch rounded-[2px] border border-[#D5E0DB] dark:border-[#145447] bg-white dark:bg-[#061B16] text-[11px] overflow-hidden shadow-2xs">
                                      <span className="px-2 py-0.5 font-medium text-[#4D6358] dark:text-[#A4B8AE] bg-[#F7F9F8] dark:bg-[#092B23]">
                                        Standard
                                      </span>
                                      <span className="px-2 py-0.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border-l border-[#D5E0DB] dark:border-[#145447] bg-emerald-50/50 dark:bg-emerald-950/40">
                                        रू {Number(item.basePrice).toLocaleString()}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-[#879B90] text-xs">—</span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Action */}
                            <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  title={`Edit ${item.name}`}
                                  className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  title={`Delete ${item.name}`}
                                  className="p-1 rounded-[2px] text-[#879B90] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={isRoomSetup ? 10 : isItemSetup ? 8 : isMenuItem ? 6 : hasCategory ? 5 : 4}
                            className="py-12 text-center text-xs text-[#879B90]"
                          >
                            {tableSearchQuery ||
                            (isRoomSetup &&
                              (roomTypeFilter !== 'all' ||
                                roomFloorFilter !== 'all')) ||
                            (hasCategory && tableCategoryFilter !== 'all') ? (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>No {activeSubBox.name.toLowerCase()} match your search / filter criteria</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTableSearchQuery('');
                                    setRoomTypeFilter('all');
                                    setRoomFloorFilter('all');
                                    setTableCategoryFilter('all');
                                  }}
                                  className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400"
                                >
                                  Clear filter
                                </button>
                              </div>
                            ) : (
                              `No ${activeSubBox.name.toLowerCase()} added yet`
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing <strong className="text-[#24352F] dark:text-white">{filteredItems.length}</strong> of{' '}
                      <strong className="text-[#24352F] dark:text-white">{currentItems.length}</strong> {activeSubBox.name}
                    </span>
                    {(tableSearchQuery ||
                      (isRoomSetup &&
                        (roomTypeFilter !== 'all' ||
                          roomFloorFilter !== 'all')) ||
                      (hasCategory && tableCategoryFilter !== 'all')) && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        Filtered
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px]">
                    {activeCategory.code} · {activeCategory.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
  );


  return (
    <div className="h-full flex flex-col min-h-0 select-none">
      {/* =========================================================================
          1. TOP ROW: SUB-OPTIONS (HOTEL / RESTAURANT) OR MASTER CATEGORIES
          Full width above the straight line! Sub-options shown in a single row!
         ========================================================================= */}
      {isHotelModule ? (
        <div className="shrink-0 flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 custom-scrollbar w-full">
          {hotelCategory.subBoxes.map((sub) => {
            const SubIcon = sub.icon;
            const isSelected =
              sub.id === 'add-room-setup'
                ? showFullPageRoomSetup
                : sub.id === 'room-list-setup'
                  ? !showFullPageRoomSetup && (selectedSubId === 'room-list-setup' || selectedSubId === 'add-room-setup')
                  : selectedSubId === sub.id && !showFullPageRoomSetup;

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (sub.id === 'add-room-setup') {
                    setSelectedSubId('add-room-setup');
                    setSelectedRoomRecordForEdit(null);
                    setShowFullPageRoomSetup(true);
                  } else if (sub.id === 'room-list-setup') {
                    setSelectedSubId('room-list-setup');
                    setShowFullPageRoomSetup(false);
                  } else {
                    setSelectedSubId(sub.id);
                    setShowFullPageRoomSetup(false);
                  }
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-2 text-center transition-all duration-150 shrink-0',
                  'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px] w-28 sm:w-36 md:w-40',
                  isSelected
                    ? 'border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200'
                    : 'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#0B3D32] hover:bg-[#FAFBF9] hover:shadow-xs dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-emerald-500 dark:hover:bg-[#093027]'
                )}
              >
                <div
                  className={cn(
                    'mb-1 transition-transform group-hover:scale-110',
                    isSelected
                      ? 'text-[#A51F36] dark:text-rose-300'
                      : 'text-[#A51F36] dark:text-rose-400'
                  )}
                >
                  <SubIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-2 px-0.5',
                    isSelected
                      ? 'font-bold text-[#A51F36] dark:text-rose-200'
                      : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {sub.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : isRestaurantModule ? (
        <div className="shrink-0 flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 custom-scrollbar w-full">
          {restaurantCategory.subBoxes.map((sub) => {
            const SubIcon = sub.icon;
            const isSelected = selectedSubId === sub.id;

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubId(sub.id);
                }}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-2 text-center transition-all duration-150 shrink-0',
                  'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px] w-28 sm:w-36 md:w-40',
                  isSelected
                    ? 'border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200'
                    : 'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#0B3D32] hover:bg-[#FAFBF9] hover:shadow-xs dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-emerald-500 dark:hover:bg-[#093027]'
                )}
              >
                <div
                  className={cn(
                    'mb-1 transition-transform group-hover:scale-110',
                    isSelected
                      ? 'text-[#A51F36] dark:text-rose-300'
                      : 'text-[#A51F36] dark:text-rose-400'
                  )}
                >
                  <SubIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-2 px-0.5',
                    isSelected
                      ? 'font-bold text-[#A51F36] dark:text-rose-200'
                      : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {sub.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-2.5">
          {displayedCategories.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategoryId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCategory(item.id)}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-2 text-center transition-all duration-150',
                  'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px] w-36 sm:w-44',
                  isSelected
                    ? 'border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200'
                    : 'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#0B3D32] hover:bg-[#FAFBF9] hover:shadow-xs dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-emerald-500 dark:hover:bg-[#093027]'
                )}
              >
                <div
                  className={cn(
                    'mb-1 transition-transform group-hover:scale-110',
                    isSelected
                      ? 'text-[#A51F36] dark:text-rose-300'
                      : 'text-[#A51F36] dark:text-rose-400'
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                </div>

                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-2 px-0.5',
                    isSelected
                      ? 'font-bold text-[#A51F36] dark:text-rose-200'
                      : 'text-[#24352F] dark:text-white'
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          2. STRAIGHT DIVIDER LINE (STATIC - EDGE-TO-EDGE)
          Full-bleed straight divider line pinned across the viewport.
         ========================================================================= */}
      <div className="shrink-0 -mx-3 sm:-mx-4 lg:-mx-5 border-b border-[#DCE3DF] dark:border-[#145447] my-2 sm:my-2.5" />

      {/* =========================================================================
          3. STRICTLY BELOW THE STRAIGHT LINE:
          - If showFullPageRoomSetup: Full-Page Room Setup Component (Quick + Detailed)
          - If isHotelModule or isRestaurantModule: Direct full-width table for active sub-box
          - If Master Setup: Level 1 grid of boxes or Level 2 sidebar + table
         ========================================================================= */}
      {showFullPageRoomSetup ? (
        <div className="flex-1 min-h-0 -mx-3 sm:-mx-4 lg:-mx-5 -mb-3 sm:-mb-4 lg:-mb-5 overflow-hidden">
          <RoomSetupView
            onBack={() => {
              setShowFullPageRoomSetup(false);
              setSelectedSubId('room-list-setup');
              setEditingItemId(null);
              setSelectedRoomRecordForEdit(null);
            }}
            onSave={handleSaveRoom}
            initialRoom={selectedRoomRecordForEdit}
            existingRoomTypes={memoizedRoomTypeNames}
            existingFloors={memoizedFloorNames}
            existingACTypes={memoizedACTypeNames}
            existingBedTypes={memoizedBedTypeNames}
            existingFacilities={memoizedFacilityItems}
          />
        </div>
      ) : (isHotelModule || isRestaurantModule) ? (
        <div className="-mx-3 sm:-mx-4 lg:-mx-5 -mb-3 sm:-mb-4 lg:-mb-5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderTableContent()}
        </div>
      ) : !selectedSubId ? (
        /* -----------------------------------------------------------------------
           LEVEL 1: Clean option boxes with icon and name ONLY below the straight line
           Top options & straight line remain static!
           ----------------------------------------------------------------------- */
        <div className="flex-1 min-h-0 flex flex-col pt-1 space-y-2.5 overflow-hidden">
          {/* Clean Category Title */}
          <div className="shrink-0 pb-0.5">
            <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
              {categoryHeaderTitle}
            </h2>
          </div>

          {/* Grid of Clean Option Boxes (Icon and Name Only) */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {activeCategory.subBoxes.map((sub) => {
                const SubBoxIcon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubBox(sub.id)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center p-2.5 sm:p-3 text-center transition-all duration-150',
                      'rounded-[3px] border shadow-2xs min-h-[76px] sm:min-h-[82px]',
                      'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#A51F36] hover:bg-[#FFF9F9] hover:shadow-xs',
                      'dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-rose-700 dark:hover:bg-[#1a080d]'
                    )}
                  >
                    <div className="mb-1.5 text-[#A51F36] group-hover:scale-110 transition-transform dark:text-rose-400">
                      <SubBoxIcon className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 px-0.5 text-[#24352F] group-hover:text-[#A51F36] dark:text-white dark:group-hover:text-rose-300">
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="-mx-3 sm:-mx-4 lg:-mx-5 -mb-3 sm:-mb-4 lg:-mb-5 flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#071F1A] flex flex-col select-none h-full min-h-0">
            {/* Clean Secondary Sidebar Header: Back Button, Header Name, One Search Box (STATIC) */}
            <div className="shrink-0 p-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-white dark:bg-[#061B16] space-y-2">
              <button
                type="button"
                onClick={handleBackToBoxes}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-bold text-[#4A6B5D] bg-[#F2F6F4] hover:bg-[#E8F2EE] hover:text-[#0B3D32] dark:bg-[#0A2E26] dark:text-[#A4B8AE] dark:hover:text-white dark:hover:bg-[#0E3B31] border border-[#DCE3DF] dark:border-[#145447] transition-all shadow-2xs"
                title="Back to all categories view"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>All Categories</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 pt-0.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
                  <activeCategory.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#24352F] dark:text-white font-heading tracking-tight truncate">
                    {categoryHeaderTitle}
                  </h3>
                  <p className="text-[10px] text-[#64736C] dark:text-[#8CA498] font-medium truncate">
                    Master Configuration
                  </p>
                </div>
              </div>

              <div className="relative pt-0.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879B90] dark:text-[#647F75]" />
                <input
                  type="text"
                  value={searchOptionsQuery}
                  onChange={(e) => setSearchOptionsQuery(e.target.value)}
                  placeholder="Search master list..."
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs transition-all focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:placeholder-[#647F75] dark:focus:border-emerald-500"
                />
                {searchOptionsQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchOptionsQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE Options List (Only scrolls internally within the sidebar) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredSubBoxes.map((sub) => {
                const SubBoxIcon = sub.icon;
                const isSelected = selectedSubId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubBox(sub.id)}
                    className={cn(
                      'w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-left transition-all duration-150',
                      isSelected
                        ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                        : 'text-[#24352F] hover:bg-white hover:text-[#0B3D32] hover:shadow-2xs dark:text-[#E5EEE9] dark:hover:bg-[#082921] dark:hover:text-emerald-300 font-medium'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] transition-colors',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'text-[#566D63] group-hover:text-[#0B3D32] dark:text-[#8CA498] dark:group-hover:text-emerald-300'
                      )}
                    >
                      <SubBoxIcon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>

                    <span className="text-xs truncate">{sub.name}</span>
                  </button>
                );
              })}
              {filteredSubBoxes.length === 0 && (
                <div className="py-8 text-center text-xs text-[#879B90] dark:text-[#647F75]">
                  <Search className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p>No master lists match &quot;{searchOptionsQuery}&quot;</p>
                </div>
              )}
            </div>
          </aside>
          {renderTableContent()}
        </div>
      )}

      {/* =========================================================================
          MODAL DIALOG: ADD/EDIT FORM (OVERLAY MODAL POPUP - NEVER INLINE)
          Fields: CODE, DISPLAY NAME, CATEGORY (for menu items), QUANTITY PRICING TIERS, ORDER
         ========================================================================= */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowAddForm(false);
            setEditingItemId(null);
          }}
        >
          <div
            className={cn(
              'w-full rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150',
              isRoomSetup ? 'max-w-2xl' : 'max-w-xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Clean and professional without boilerplate text */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32]/10 dark:bg-emerald-950/70 text-[#0B3D32] dark:text-emerald-300">
                  <activeSubBox.icon className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  {editingItemId ? 'Edit' : 'Add'} {getSubBoxEntityName(activeSubBox)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItemId(null);
                }}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNewItem}>
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {activeSubBox.id === 'item-setup' ? (
                  <>
                    {/* Item Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Item / Product Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Mineral Water (1 Ltr), Bath Towel, Herbal Shampoo"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    {/* Category, Code, Order Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Category (Autocomplete) */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={newCategory}
                          onChange={(name) => setNewCategory(name)}
                          onAddNewCategory={handleAddNewCategory}
                          availableCategories={availableItemCategories}
                          placeholder="Select or enter category..."
                        />
                      </div>

                      {/* Code */}
                      <div className="col-span-7 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Item Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="e.g. WAT-1L"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs placeholder:normal-case"
                        />
                      </div>

                      {/* Order */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Unit & Base Price Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Unit */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Unit of Measurement <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newUnit}
                          onChange={(e) => setNewUnit(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer capitalize"
                        >
                          {availableQuantities.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name} {u.code ? `(${u.code})` : ''}
                            </option>
                          ))}
                          {availableQuantities.length === 0 && (
                            <>
                              <option value="pieces">Pieces (pcs)</option>
                              <option value="bottle">Bottle (btl)</option>
                              <option value="box">Box (bx)</option>
                              <option value="pack">Pack (pk)</option>
                              <option value="set">Set (st)</option>
                              <option value="pair">Pair (pr)</option>
                              <option value="kg">Kilogram (kg)</option>
                              <option value="liter">Liter (ltr)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Base / Cost Price */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Base / Unit Price (रू)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none">
                            रू
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={newBasePrice}
                            onChange={(e) => setNewBasePrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock Inventory Tracking */}
                    <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16] p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <input
                          id="itemModalTrackStock"
                          type="checkbox"
                          checked={newTrackStock}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setNewTrackStock(val);
                            if (val && !newStock) setNewStock('50');
                          }}
                          className="w-4 h-4 rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32] border-[#C5D3CD] cursor-pointer mt-0.5"
                        />
                        <div>
                          <label htmlFor="itemModalTrackStock" className="text-xs font-bold text-[#24352F] dark:text-white cursor-pointer flex items-center gap-1.5">
                            <span>Track in Stock Inventory</span>
                            {newTrackStock ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Active Tracking
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Non-Stocked
                              </span>
                            )}
                          </label>
                          <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] mt-0.5">
                            Enable to track inventory stock for guest amenities, room replenishment, and consumption.
                          </p>
                        </div>
                      </div>

                      {newTrackStock && (
                        <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] space-y-1">
                          <label className="block text-xs font-bold text-[#24352F] dark:text-white">
                            Available Stock Quantity
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            placeholder="e.g. 50"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2.5 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Description (Optional) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Specifications (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Brief description or specifications..."
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>
                  </>
                ) : activeSubBox.id === 'menu-items-setup' ? (
                  <>
                    {/* Item Name (Primary Field, Prominent) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Item Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Dish name"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    {/* Category, Code, Order Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Category (Searchable Combobox with Suggestions) */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={newCategory}
                          onChange={(name) => setNewCategory(name)}
                          onAddNewCategory={handleAddNewCategory}
                          availableCategories={availableCategories}
                          placeholder="Select category"
                        />
                      </div>

                      {/* Code */}
                      <div className="col-span-7 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Item Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="Code (optional)"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs placeholder:normal-case"
                        />
                      </div>

                      {/* Order */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Unit & Pricing: Select multiple units with prices */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Unit & Portion Prices <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Select multiple units (Full, Half, Plate, etc.) and specify each portion price
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const usedNames = new Set(newQuantityPrices.map((q) => q.quantityName));
                            const nextAvailable = availableQuantities.find((q) => !usedNames.has(q.name));
                            setNewQuantityPrices((prev) => [
                              ...prev,
                              {
                                quantityName: nextAvailable ? nextAvailable.name : '',
                                price: '',
                              },
                            ]);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D32] hover:text-[#082b23] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Unit</span>
                        </button>
                      </div>

                      {/* Unit & Price Input Rows */}
                      <div className="space-y-2">
                        {newQuantityPrices.map((tier, idx) => {
                          const otherUsedNames = newQuantityPrices
                            .filter((_, i) => i !== idx)
                            .map((t) => t.quantityName);

                          return (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] shadow-2xs">
                              {/* Searchable Combobox */}
                              <div className="flex-1 min-w-0">
                                <QuantityAutocomplete
                                  value={tier.quantityName}
                                  onChange={(name) => {
                                    setNewQuantityPrices((prev) =>
                                      prev.map((t, i) => (i === idx ? { ...t, quantityName: name } : t))
                                    );
                                  }}
                                  availableQuantities={availableQuantities}
                                  excludeNames={otherUsedNames}
                                  placeholder="Select unit"
                                />
                              </div>

                              {/* Price Input with currency prefix */}
                              <div className="w-36 sm:w-44 relative shrink-0">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                                  रू
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  required
                                  placeholder="0.00"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewQuantityPrices((prev) =>
                                      prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                                    );
                                  }}
                                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                                />
                              </div>

                              {/* Remove Tier Button */}
                              {newQuantityPrices.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewQuantityPrices((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[3px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                                  title="Remove unit"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stock Tracking: Checkbox & Conditional Quantity */}
                    <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16] p-3 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <input
                          id="modalTrackStock"
                          type="checkbox"
                          checked={newTrackStock}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setNewTrackStock(val);
                            if (val && !newStock) setNewStock('50');
                          }}
                          className="w-4 h-4 rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32] border-[#C5D3CD] cursor-pointer mt-0.5"
                        />
                        <div>
                          <label htmlFor="modalTrackStock" className="text-xs font-bold text-[#24352F] dark:text-white cursor-pointer flex items-center gap-1.5">
                            <span>Track Stock</span>
                            {newTrackStock ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                Stocked Product
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Handmade / Prepared
                              </span>
                            )}
                          </label>
                          <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] mt-0.5">
                            {newTrackStock
                              ? 'Enable for purchased retail goods (Beer, Coca-Cola, Bottled Water). Stock is deducted upon sale.'
                              : 'Disable for dishes prepared on order (Tea, Coffee, Momo, Chowmein). No stock quantity required.'}
                          </p>
                        </div>
                      </div>

                      {newTrackStock && (
                        <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] space-y-1">
                          <label className="block text-xs font-bold text-[#24352F] dark:text-white">
                            Available Stock Quantity <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            required={newTrackStock}
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2.5 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : isFacilityItem ? (
                  <>
                    {/* Facility Name (Primary Field) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Facility Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Facility name"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    {/* Category, Facility Code & Order Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Facility Category */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Facility Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={newCategory}
                          onChange={(name) => setNewCategory(name)}
                          onAddNewCategory={handleAddNewCategory}
                          availableCategories={availableFacilityCategories}
                          placeholder="Select category"
                        />
                      </div>

                      <div className="col-span-7 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Facility Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="Code (optional)"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs placeholder:normal-case"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Specifications (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>
                  </>
                ) : isRoomSetup ? (
                  <>
                    {/* Room Number & Floor Level */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Number */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Room Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <DoorOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            placeholder="e.g. 101, 102, 205, 301"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-9 pr-3 text-xs font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Floor Level (From floor-master) */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Floor Level <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomFloor}
                          onChange={(e) => setRoomFloor(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableFloors.map((floor) => (
                            <option key={floor.id} value={floor.name}>
                              {floor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Room Type, AC Type & Bed Type */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Type (From room-type-master, auto-sync price) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Room Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomType}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setRoomType(selected);
                            const matched = availableRoomTypes.find((t) => t.name === selected);
                            if (matched && matched.basePrice) {
                              setRoomPrice(matched.basePrice.toString());
                            }
                          }}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableRoomTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* AC / Non-AC Climate (From ac-type-master) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          AC Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomACType}
                          onChange={(e) => setRoomACType(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableACTypes.map((ac) => (
                            <option key={ac.id} value={ac.name}>
                              {ac.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bed Configuration (From bed-type-master) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Bed Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomBedType}
                          onChange={(e) => setRoomBedType(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableBedTypes.map((bed) => (
                            <option key={bed.id} value={bed.name}>
                              {bed.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fare & Capacity Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Fare */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Fare (रू) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                            रू
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required
                            value={roomPrice}
                            onChange={(e) => setRoomPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Guest Capacity */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Guest Capacity <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="1">1 Guest</option>
                          <option value="2">2 Guests</option>
                          <option value="3">3 Guests</option>
                          <option value="4">4 Guests</option>
                          <option value="5">5 Guests</option>
                          <option value="6">6 Guests</option>
                        </select>
                      </div>
                    </div>

                    {/* Room Facilities: Clean Category-Grouped Amenity Selector with Search Suggestions */}
                    <RoomFacilitiesCategoryPicker
                      selectedFacilities={roomFacilities}
                      onChange={setRoomFacilities}
                      availableFacilities={availableFacilities}
                      availableCategories={availableFacilityCategories}
                      onAddNewFacility={handleAddNewFacilityWithCategory}
                    />

                    {/* Room Notes & Features */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Room Notes / Specifications (Optional)
                      </label>
                      <input
                        type="text"
                        value={roomNotes}
                        onChange={(e) => setRoomNotes(e.target.value)}
                        placeholder="Optional room notes or specifications..."
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard non-menu items setup */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={`${getSubBoxEntityName(activeSubBox)} name`}
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Details (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="Code"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs placeholder:normal-case"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItemId(null);
                  }}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-4 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isRoomSetup
                      ? !roomNumber.trim() || !roomPrice.trim() || !roomType.trim()
                      : isItemSetup
                      ? !newName.trim()
                      : !newName.trim() ||
                        (isMenuItem &&
                          ((!newCategory.trim() && availableCategories.length > 0) ||
                            newQuantityPrices.length === 0 ||
                            newQuantityPrices.some((t) => !t.quantityName.trim() || !t.price.trim()))) ||
                        (isFacilityItem && !newCategory.trim() && availableFacilityCategories.length > 0)
                  }
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editingItemId
                      ? `Update ${getSubBoxEntityName(activeSubBox)}`
                      : `Save ${getSubBoxEntityName(activeSubBox)}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ROOM DETAILS VIEW MODAL */}
      <RoomDetailsModal
        isOpen={!!viewingRoomRecord}
        onClose={() => setViewingRoomRecord(null)}
        room={viewingRoomRecord}
        onEdit={(roomToEdit: RoomRecord) => {
          setViewingRoomRecord(null);
          setSelectedRoomRecordForEdit(roomToEdit);
          setShowFullPageRoomSetup(true);
        }}
      />
    </div>
  );
}

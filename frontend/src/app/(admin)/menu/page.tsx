'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  UtensilsCrossed,
  Filter,
  Pencil,
  Wine,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { POSProductData, ProductVariant } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useMasterOptions } from '@/lib/mastersData';
import { INITIAL_MASTER_ITEMS } from '@/lib/hotelSetupInitialData';

interface MenuVariant {
  unit: string;
  price: number;
}

interface MenuGroupItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  variants: MenuVariant[];
  isVeg?: boolean;
  preparationMethod?: 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED';
}

interface MenuGroup {
  id: string;
  name: string;
  description: string;
  items: MenuGroupItem[];
}

const PRESET_BEVERAGE_UNITS = [
  'Glass',
  'Can',
  'Pitcher',
  '500ml Bottle',
  '1L Bottle',
  'Bottle (750ml)',
  'Cup / Mug',
  'Small',
  'Medium',
  'Large',
];

const PRESET_FOOD_UNITS = [
  'Single',
  'Plate',
  'Full',
  'Half',
  'Regular',
  'Quarter',
  'Bowl',
];

const MENU_GROUPS: MenuGroup[] = [
  // 1. Fast Food & Quick Bites
  {
    id: 'fast-food',
    name: 'Fast Food & Momos',
    description: 'Freshly steamed, fried & chilled momos, burgers and quick bites',
    items: [
      {
        id: 'ff-burger',
        code: 'BGR-01',
        name: 'Classic Chicken Burger',
        variants: [{ unit: 'Regular', price: 250 }],
      },
      {
        id: 'ff-1',
        code: 'MOMO-C',
        name: 'Chicken Steam Momo',
        variants: [
          { unit: 'Half', price: 100 },
          { unit: 'Full', price: 180 },
        ],
      },
      {
        id: 'ff-2',
        code: 'MOMO-V',
        name: 'Veg Steam Momo',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 80 },
          { unit: 'Full', price: 150 },
        ],
      },
      {
        id: 'ff-3',
        code: 'MOMO-B',
        name: 'Buff Steam Momo',
        variants: [
          { unit: 'Half', price: 90 },
          { unit: 'Full', price: 160 },
        ],
      },
      {
        id: 'ff-4',
        code: 'MOMO-CF',
        name: 'Chicken Fried Momo',
        variants: [
          { unit: 'Half', price: 120 },
          { unit: 'Full', price: 200 },
        ],
      },
      {
        id: 'ff-5',
        code: 'MOMO-VF',
        name: 'Veg Fried Momo',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 90 },
          { unit: 'Full', price: 160 },
        ],
      },
      {
        id: 'ff-6',
        code: 'MOMO-CHL',
        name: 'Chicken Chilly Momo (C-Momo)',
        variants: [
          { unit: 'Half', price: 140 },
          { unit: 'Full', price: 230 },
        ],
      },
      {
        id: 'ff-7',
        code: 'MOMO-PAN',
        name: 'Paneer Steam Momo',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 110 },
          { unit: 'Full', price: 190 },
        ],
      },
      {
        id: 'ff-8',
        code: 'FRY-01',
        name: 'Crispy French Fries (Peri Peri / Salted)',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 90 },
          { unit: 'Full', price: 150 },
        ],
      },
    ],
  },

  // 2. Main Course & Curries
  {
    id: 'main-course',
    name: 'Main Course & Curries',
    description: 'Traditional curries, gravies, and slow-cooked handi dishes',
    items: [
      {
        id: 'mc-1',
        code: 'PBM-01',
        name: 'Paneer Butter Masala',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 240 },
          { unit: 'Full', price: 420 },
        ],
      },
      {
        id: 'mc-2',
        code: 'CTM-01',
        name: 'Chicken Tikka Masala',
        variants: [
          { unit: 'Half', price: 280 },
          { unit: 'Full', price: 490 },
        ],
      },
      {
        id: 'mc-3',
        code: 'DAL-MKH',
        name: 'Dal Makhani Handi',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 190 },
          { unit: 'Full', price: 320 },
        ],
      },
      {
        id: 'mc-4',
        code: 'CHK-KAD',
        name: 'Chicken Kadai Peshawari',
        variants: [
          { unit: 'Half', price: 290 },
          { unit: 'Full', price: 510 },
        ],
      },
      {
        id: 'mc-5',
        code: 'MUT-ROG',
        name: 'Mutton Rogan Josh Handi',
        variants: [
          { unit: 'Half', price: 340 },
          { unit: 'Full', price: 580 },
        ],
      },
      {
        id: 'mc-6',
        code: 'MIX-VEG',
        name: 'Seasonal Mixed Vegetable Curry',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 170 },
          { unit: 'Full', price: 290 },
        ],
      },
      {
        id: 'mc-7',
        code: 'BRY-CHK',
        name: 'Hyderabadi Dum Chicken Biryani',
        variants: [
          { unit: 'Half', price: 280 },
          { unit: 'Full', price: 480 },
        ],
      },
      {
        id: 'mc-8',
        code: 'RICE-PL',
        name: 'Kashmiri Saffron Veg Pulao',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 160 },
          { unit: 'Full', price: 260 },
        ],
      },
    ],
  },

  // 3. Hot Tea & Coffee
  {
    id: 'tea-coffee',
    name: 'Tea & Coffee',
    description: 'Aromatic milk teas, artisan espresso brews, and herbal infusions',
    items: [
      {
        id: 'tc-1',
        code: 'TEA-MSL',
        name: 'Special Masala Milk Tea',
        isVeg: true,
        variants: [
          { unit: 'Small', price: 40 },
          { unit: 'Medium', price: 70 },
          { unit: 'Large', price: 120 },
        ],
      },
      {
        id: 'tc-2',
        code: 'COF-FR',
        name: 'Fresh Brewed Coffee',
        isVeg: true,
        variants: [
          { unit: 'Small', price: 80 },
          { unit: 'Medium', price: 120 },
          { unit: 'Large', price: 160 },
        ],
      },
      {
        id: 'tc-3',
        code: 'COF-LAT',
        name: 'Café Latte / Cappuccino',
        isVeg: true,
        variants: [
          { unit: 'Small', price: 110 },
          { unit: 'Medium', price: 150 },
          { unit: 'Large', price: 190 },
        ],
      },
      {
        id: 'tc-4',
        code: 'TEA-LEM',
        name: 'Hot Lemon Honey Ginger',
        isVeg: true,
        variants: [
          { unit: 'Small', price: 60 },
          { unit: 'Medium', price: 90 },
        ],
      },
      {
        id: 'tc-5',
        code: 'TEA-GRN',
        name: 'Himalayan Organic Green Tea',
        isVeg: true,
        variants: [
          { unit: 'Small', price: 50 },
          { unit: 'Medium', price: 80 },
        ],
      },
    ],
  },

  // 4. Cold Drinks, Sodas & Mocktails (Multi-Size Beverages)
  {
    id: 'drinks',
    name: 'Cold Drinks & Mocktails',
    description: 'Chilled sodas, signature mocktails, coolers, and traditional lassis',
    items: [
      {
        id: 'dr-sprite',
        code: 'BEV-SPR',
        name: 'Sprite',
        isVeg: true,
        variants: [
          { unit: 'Glass', price: 150 },
          { unit: 'Can', price: 100 },
          { unit: '500ml Bottle', price: 180 },
        ],
      },
      {
        id: 'dr-1',
        code: 'MOK-MOJ',
        name: 'Virgin Mint Mojito',
        isVeg: true,
        variants: [
          { unit: 'Glass', price: 180 },
          { unit: 'Pitcher', price: 550 },
        ],
      },
      {
        id: 'dr-2',
        code: 'LIME-01',
        name: 'Fresh Lime Soda (Sweet / Salt)',
        isVeg: true,
        variants: [
          { unit: 'Glass', price: 90 },
          { unit: 'Pitcher', price: 280 },
        ],
      },
      {
        id: 'dr-3',
        code: 'LAS-MNG',
        name: 'Sweet Mango Lassi',
        isVeg: true,
        variants: [
          { unit: 'Glass', price: 140 },
          { unit: 'Pitcher', price: 420 },
        ],
      },
      {
        id: 'dr-4',
        code: 'MOK-BLU',
        name: 'Blue Lagoon Citrus Cooler',
        isVeg: true,
        variants: [
          { unit: 'Glass', price: 190 },
          { unit: 'Pitcher', price: 580 },
        ],
      },
      {
        id: 'dr-5',
        code: 'COF-CLD',
        name: 'Cold Coffee with Ice Cream Float',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 170 }],
      },
    ],
  },

  // 5. Tandoori Breads & Naan
  {
    id: 'breads',
    name: 'Tandoori Breads & Naan',
    description: 'Clay oven baked fresh breads and stuffed kulchas',
    items: [
      {
        id: 'br-1',
        code: 'ROT-PLN',
        name: 'Plain Tandoori Roti',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 30 },
          { unit: 'Plate', price: 110 },
        ],
      },
      {
        id: 'br-2',
        code: 'ROT-BTR',
        name: 'Butter Tandoori Roti',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 40 },
          { unit: 'Plate', price: 150 },
        ],
      },
      {
        id: 'br-3',
        code: 'NAN-PLN',
        name: 'Plain Tandoori Naan',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 55 },
          { unit: 'Plate', price: 200 },
        ],
      },
      {
        id: 'br-4',
        code: 'NAN-BTR',
        name: 'Butter Naan',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 70 },
          { unit: 'Plate', price: 260 },
        ],
      },
      {
        id: 'br-5',
        code: 'NAN-GAR',
        name: 'Garlic Butter Naan',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 90 },
          { unit: 'Plate', price: 320 },
        ],
      },
    ],
  },

  // 6. Desserts & Sweets
  {
    id: 'desserts',
    name: 'Desserts & Sweets',
    description: 'Warm gulab jamuns, rasgullas, and artisan ice creams',
    items: [
      {
        id: 'des-1',
        code: 'GJ-01',
        name: 'Hot Gulab Jamun with Pistachio',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 70 },
          { unit: 'Plate', price: 130 },
        ],
      },
      {
        id: 'des-2',
        code: 'RAS-01',
        name: 'Bengali Spongy Rasgulla',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 60 },
          { unit: 'Plate', price: 110 },
        ],
      },
      {
        id: 'des-3',
        code: 'ICE-VAN',
        name: 'Vanilla / Chocolate Ice Cream Scoop',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 80 },
          { unit: 'Plate', price: 150 },
        ],
      },
      {
        id: 'des-4',
        code: 'BRW-ICE',
        name: 'Sizzling Hot Brownie with Vanilla Float',
        isVeg: true,
        variants: [{ unit: 'Plate', price: 240 }],
      },
    ],
  },
];

interface CustomMenuItem {
  id: string;
  code: string;
  name: string;
  category: string;
  variants: MenuVariant[];
  isVeg?: boolean;
  department?: 'KOT' | 'BOT';
  preparationMethod?: 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED';
}

function MenuCategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = 'Select category',
}: {
  value: string;
  onChange: (cat: string) => void;
  categories: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, query]);

  const selectCat = (cat: string) => {
    onChange(cat);
    setQuery(cat);
    setIsOpen(false);
  };

  const hasNoExact = query.trim() && !categories.some((c) => c.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <input
          type="text"
          required
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
        />
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
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-150', isOpen ? 'rotate-90' : 'rotate-0')} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A]">
          {filtered.length > 0 && (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {filtered.map((cat) => {
                const isSelected = cat.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => selectCat(cat)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                    )}
                  >
                    <span className="truncate font-medium">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
          {hasNoExact && (
            <div className={filtered.length > 0 ? 'border-t border-slate-100 dark:border-[#145447]' : ''}>
              <button
                type="button"
                onClick={() => selectCat(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                <span className="truncate">Create &quot;{query.trim()}&quot;</span>
              </button>
            </div>
          )}
          {filtered.length === 0 && !hasNoExact && (
            <div className="px-3 py-2.5 text-center text-xs text-slate-400">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuUnitCombobox({
  value,
  onChange,
  availableUnits,
  placeholder = 'Select unit',
}: {
  value: string;
  onChange: (unit: string) => void;
  availableUnits: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableUnits;
    return availableUnits.filter((u) => u.toLowerCase().includes(q));
  }, [availableUnits, query]);

  const selectUnit = (u: string) => {
    onChange(u);
    setQuery(u);
    setIsOpen(false);
  };

  const hasNoExact = query.trim() && !availableUnits.some((u) => u.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <input
          type="text"
          required
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
        />
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
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-150', isOpen ? 'rotate-90' : 'rotate-0')} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A]">
          {filtered.length > 0 && (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {filtered.map((u) => {
                const isSelected = u.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => selectUnit(u)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                    )}
                  >
                    <span className="truncate font-medium">{u}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
          {hasNoExact && (
            <div className={filtered.length > 0 ? 'border-t border-slate-100 dark:border-[#145447]' : ''}>
              <button
                type="button"
                onClick={() => selectUnit(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                <span className="truncate">Use &quot;{query.trim()}&quot;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OurMenuTablePage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [dbProducts, setDbProducts] = useState<POSProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Master menu items loaded from Restaurant Setup (Menu Items Setup)
  const [masterMenuItems, setMasterMenuItems] = useState<any[]>([]);

  // Custom added items from local state / localStorage
  const [customItems, setCustomItems] = useState<CustomMenuItem[]>([]);

  // Fetch dynamic units from master setup
  const { activeItems: masterUnits } = useMasterOptions('units');

  // Combined available units suggestions
  const allUnitOptions = useMemo(() => {
    const set = new Set<string>();
    PRESET_BEVERAGE_UNITS.forEach((u) => set.add(u));
    PRESET_FOOD_UNITS.forEach((u) => set.add(u));
    masterUnits.forEach((m) => set.add(m.name));
    return Array.from(set);
  }, [masterUnits]);

  // Add / Edit Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuGroupItem | null>(null);
  const [formItemName, setFormItemName] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formOrder, setFormOrder] = useState('1');
  const [formTrackStock, setFormTrackStock] = useState(false);
  const [formStock, setFormStock] = useState('');
  const [formPreparationMethod, setFormPreparationMethod] = useState<'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [formVariants, setFormVariants] = useState<{ unit: string; price: string }[]>([
    { unit: 'Piece (pc/pcs)', price: '' },
    { unit: 'Kilogram (kg)', price: '' },
  ]);

  // Bulk Bar Preparation Modal State
  const [isBulkPrepModalOpen, setIsBulkPrepModalOpen] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<'ALL' | 'BEVERAGES' | 'UNCONFIGURED'>('UNCONFIGURED');
  const [bulkMethods, setBulkMethods] = useState<Record<string, 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED'>>({});
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const fetchMenuProducts = async () => {
    setIsLoading(true);
    try {
      const products = await api.getPOSProducts({ outlet: 'RESTAURANT' });
      if (products && products.length > 0) {
        setDbProducts(products);
      }
    } catch (e) {
      console.warn('Could not fetch products from database', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuProducts();

    const loadMasterItems = () => {
      if (typeof window === 'undefined') return;
      try {
        const stored = localStorage.getItem('hotel_master_menu-items-setup');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMasterMenuItems(parsed);
            return;
          }
        }
        const fallbackHotel = localStorage.getItem('hotel_menu_items');
        if (fallbackHotel) {
          const parsedFallback = JSON.parse(fallbackHotel);
          if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
            setMasterMenuItems(parsedFallback);
            return;
          }
        }
        if (INITIAL_MASTER_ITEMS['menu-items-setup']) {
          setMasterMenuItems(INITIAL_MASTER_ITEMS['menu-items-setup']);
        }
      } catch (err) {
        console.warn('Failed to load menu items from setup:', err);
      }
    };

    loadMasterItems();

    const handleUpdate = () => {
      loadMasterItems();
    };

    window.addEventListener('menu_items_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('custom_menu_items');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Backward-compatibility: convert legacy `prices` object to `variants` array
            const migrated = parsed.map((item: any) => {
              if (item.variants && Array.isArray(item.variants)) {
                return item;
              }
              const variants: MenuVariant[] = [];
              if (item.prices && typeof item.prices === 'object') {
                Object.entries(item.prices).forEach(([unit, price]) => {
                  const num = Number(price);
                  if (!isNaN(num) && num > 0) {
                    variants.push({ unit, price: num });
                  }
                });
              }
              return {
                ...item,
                variants: variants.length > 0 ? variants : [{ unit: 'Regular', price: 0 }],
              };
            });
            setCustomItems(migrated);
          }
        }
      } catch (err) {}
    }

    return () => {
      window.removeEventListener('menu_items_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute clean groups synchronized with Menu Setup, customItems, and database products
  const dynamicGroups = useMemo(() => {
    const groupMap = new Map<string, MenuGroup>();

    // 1. Seed default category templates
    MENU_GROUPS.forEach((g) => {
      groupMap.set(g.name.toLowerCase().trim(), {
        ...g,
        items: [],
      });
    });

    const categoriesList = INITIAL_MASTER_ITEMS['categories-setup'] || [];
    categoriesList.forEach((cat) => {
      const key = cat.name.toLowerCase().trim();
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: cat.name,
          description: `Dishes & beverages in ${cat.name}`,
          items: [],
        });
      }
    });

    // 2. Primary Source: masterMenuItems from Restaurant Setup (Menu Items Setup)
    // If masterMenuItems is empty (e.g. before initial hydration), fallback to INITIAL_MASTER_ITEMS['menu-items-setup']
    const activeMasterList =
      masterMenuItems && masterMenuItems.length > 0
        ? masterMenuItems
        : INITIAL_MASTER_ITEMS['menu-items-setup'] || [];

    activeMasterList.forEach((item: any) => {
      // Respect isActive: if explicitly false, hide it from the Menu page!
      if (item.isActive === false) return;

      const catName = item.category || 'Special Dishes';
      const catKey = catName.toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: catName,
          description: `Fresh dishes & beverages in ${catName}`,
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      // Convert quantityPrices to variants
      let variants: MenuVariant[] = [];
      if (item.quantityPrices && Array.isArray(item.quantityPrices) && item.quantityPrices.length > 0) {
        variants = item.quantityPrices.map((qp: any) => ({
          unit: qp.quantityName || qp.unit || 'Regular',
          price: Number(qp.price) || 0,
        }));
      } else if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
        variants = item.variants;
      } else if (item.basePrice !== undefined) {
        variants = [{ unit: 'Regular', price: Number(item.basePrice) || 0 }];
      } else {
        variants = [{ unit: 'Regular', price: 0 }];
      }

      const existingIndex = grp.items.findIndex(
        (it) => it.id === item.id || it.code.toLowerCase() === (item.code || '').toLowerCase()
      );

      const isVeg =
        item.isVeg ??
        (item.name.toLowerCase().includes('veg') && !item.name.toLowerCase().includes('non-veg'));

      const mappedItem: MenuGroupItem = {
        id: item.id || `item-${item.code}`,
        code: item.code || 'ITEM',
        name: item.name,
        category: catName,
        variants,
        isVeg,
        preparationMethod: (item as any).preparationMethod || 'NOT_CONFIGURED',
      };

      if (existingIndex >= 0) {
        grp.items[existingIndex] = mappedItem;
      } else {
        grp.items.push(mappedItem);
      }
    });

    // 3. Merge locally added custom items
    customItems.forEach((ci) => {
      const catKey = (ci.category || 'Special Dishes').toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: ci.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: ci.category,
          description: `Dishes & beverages in ${ci.category}`,
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      const existingIndex = grp.items.findIndex(
        (it) => it.id === ci.id || it.code.toLowerCase() === ci.code.toLowerCase()
      );

      if (existingIndex >= 0) {
        grp.items[existingIndex] = {
          ...grp.items[existingIndex],
          name: ci.name,
          variants: ci.variants,
          isVeg: ci.isVeg,
          preparationMethod: ci.preparationMethod || grp.items[existingIndex].preparationMethod || 'NOT_CONFIGURED',
        };
      } else {
        grp.items.push({
          id: ci.id,
          code: ci.code,
          name: ci.name,
          category: ci.category,
          variants: ci.variants,
          isVeg: ci.isVeg,
          preparationMethod: ci.preparationMethod || 'NOT_CONFIGURED',
        });
      }
    });

    // 4. Merge database products (for POS products created via backend API)
    dbProducts.forEach((p) => {
      const catKey = (p.category || 'Special Dishes').toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: p.category ? p.category.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'special-dishes',
          name: p.category || 'Special Dishes',
          description: `Fresh dishes & beverages in ${p.category || 'Special Dishes'}`,
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      // Check for structured variants
      let variants: MenuVariant[] = [];
      if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        variants = p.variants;
      } else if (p.variantsJson) {
        try {
          const parsed = JSON.parse(p.variantsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            variants = parsed.map((v: any) => ({
              unit: v.unit || v.name || 'Regular',
              price: Number(v.price) || 0,
            }));
          }
        } catch { }
      }

      const baseName = p.name.replace(/\s*\([^)]*\)$/, '').trim();
      const existing = grp.items.find(
        (it) =>
          it.name.toLowerCase() === baseName.toLowerCase() ||
          it.code.toLowerCase() === p.id.slice(0, 8).toLowerCase()
      );

      if (variants.length > 0) {
        if (existing) {
          existing.variants = variants;
          if ((p as any).preparationMethod) existing.preparationMethod = (p as any).preparationMethod;
        } else {
          grp.items.push({
            id: p.id,
            code: p.id.slice(0, 8).toUpperCase(),
            name: baseName,
            category: p.category,
            variants,
            preparationMethod: (p as any).preparationMethod || 'NOT_CONFIGURED',
          });
        }
      }
    });

    return Array.from(groupMap.values()).filter((g) => g.items.length > 0);
  }, [masterMenuItems, customItems, dbProducts]);

  // Available categories for combobox
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    dynamicGroups.forEach((g) => {
      if (g.name) set.add(g.name);
    });
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_master_categories-setup');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((c: any) => {
              if (c.name) set.add(c.name);
            });
          }
        }
      } catch {}
    }
    return Array.from(set);
  }, [dynamicGroups]);

  // Available units for combobox
  const availableUnits = useMemo(() => {
    const set = new Set<string>([
      'Piece (pc/pcs)',
      'Kilogram (kg)',
      'Plate (10 Pcs)',
      'Plate (6 Pcs)',
      'Single Piece (1 Pc)',
      'Full Portion',
      'Half Portion',
      'Regular / Standard',
      'Large Portion',
      'Cup / Mug',
      'Glass (250ml)',
      'Bottle (750ml)',
      'Liter (ltr)',
    ]);
    allUnitOptions.forEach((u) => set.add(u));
    return Array.from(set);
  }, [allUnitOptions]);

  // Filtered menu groups & items
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return dynamicGroups
      .map((group) => {
        // Check group filter
        if (selectedGroupFilter !== 'all' && group.id !== selectedGroupFilter) {
          return { ...group, items: [] };
        }

        let items = group.items;

        // Check search query
        if (!q) {
          return { ...group, items };
        }

        const matchingItems = items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            group.name.toLowerCase().includes(q)
        );

        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [dynamicGroups, searchQuery, selectedGroupFilter]);

  // Open modal with fresh state
  const handleOpenAddModal = (presetCategory?: string) => {
    setEditingItem(null);
    setFormItemName('');
    setFormItemCode('');
    setFormCategory(presetCategory || '');
    setFormOrder('1');
    setFormTrackStock(false);
    setFormStock('');
    setFormPreparationMethod('NOT_CONFIGURED');
    setFormVariants([
      { unit: 'Piece (pc/pcs)', price: '' },
      { unit: 'Kilogram (kg)', price: '' },
    ]);
    setIsAddModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEditModal = (item: MenuGroupItem, fallbackCategory?: string) => {
    setEditingItem(item);
    setFormItemName(item.name);
    setFormItemCode(item.code);
    setFormCategory(item.category || fallbackCategory || '');
    setFormOrder('1');
    setFormTrackStock(false);
    setFormStock('');
    setFormPreparationMethod(item.preparationMethod || 'NOT_CONFIGURED');
    if (item.variants && item.variants.length > 0) {
      setFormVariants(item.variants.map((v) => ({ unit: v.unit, price: v.price.toString() })));
    } else {
      setFormVariants([{ unit: 'Piece (pc/pcs)', price: '' }]);
    }
    setIsAddModalOpen(true);
  };

  // Bulk bar preparation modal open
  const handleOpenBulkPrepModal = () => {
    const initialMap: Record<string, 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED'> = {};
    dynamicGroups.forEach((g) => {
      g.items.forEach((it) => {
        initialMap[it.id] = it.preparationMethod || 'NOT_CONFIGURED';
      });
    });
    setBulkMethods(initialMap);
    setIsBulkPrepModalOpen(true);
  };

  // Bulk save
  const handleSaveBulkPrep = async () => {
    setIsSavingBulk(true);
    try {
      const updates = Object.entries(bulkMethods).map(([productId, method]) => ({
        productId,
        preparationMethod: method,
      }));

      await api.bulkUpdatePreparationMethod(updates);

      if (typeof window !== 'undefined') {
        try {
          const storedCustom = JSON.parse(localStorage.getItem('custom_menu_items') || '[]');
          const updatedCustom = storedCustom.map((ci: any) => ({
            ...ci,
            preparationMethod: bulkMethods[ci.id] || ci.preparationMethod,
          }));
          localStorage.setItem('custom_menu_items', JSON.stringify(updatedCustom));

          const storedMaster = JSON.parse(localStorage.getItem('hotel_master_menu-items-setup') || '[]');
          const updatedMaster = storedMaster.map((mi: any) => ({
            ...mi,
            preparationMethod: bulkMethods[mi.id] || mi.preparationMethod,
          }));
          localStorage.setItem('hotel_master_menu-items-setup', JSON.stringify(updatedMaster));
          window.dispatchEvent(new Event('menu_items_updated'));
        } catch {}
      }

      await fetchMenuProducts();
      toast.success('Bar Preparation Saved', `Successfully updated preparation methods for ${updates.length} items.`);
      setIsBulkPrepModalOpen(false);
    } catch (err: any) {
      toast.error('Bulk Update Failed', err?.message || 'Could not save bulk preparation methods.');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Save new or edited menu item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      toast.error('Item Name Required', 'Please provide a name for the menu item.');
      return;
    }

    if (!formCategory.trim()) {
      toast.error('Category Required', 'Please select or enter a category.');
      return;
    }

    // Build valid variants array
    const validVariants: MenuVariant[] = [];
    formVariants.forEach((tier) => {
      const u = tier.unit.trim();
      const num = parseFloat(tier.price);
      if (u && !isNaN(num) && num >= 0) {
        validVariants.push({ unit: u, price: num });
      }
    });

    if (validVariants.length === 0) {
      toast.error('Price Required', 'Please enter at least one unit with a valid price.');
      return;
    }

    const code =
      formItemCode.trim().toUpperCase() ||
      formItemName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const parsedOrder = parseInt(formOrder, 10);
    const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : 1;

    // Check if editing existing item
    if (editingItem) {
      const updatedItem: CustomMenuItem = {
        id: editingItem.id,
        code,
        name: formItemName.trim(),
        category: formCategory.trim(),
        variants: validVariants,
        preparationMethod: formPreparationMethod,
      };

      try {
        await api.updatePOSProduct(editingItem.id, {
          name: formItemName.trim(),
          category: formCategory.trim(),
          price: validVariants[0]?.price || 0,
          outlet: 'RESTAURANT',
          trackStock: formTrackStock,
          variants: validVariants,
          variantsJson: JSON.stringify(validVariants),
          preparationMethod: formPreparationMethod,
        });
      } catch (err) {
        console.warn('Backend update error (persisting locally):', err);
      }

      const updatedList = customItems.map((ci) =>
        ci.id === editingItem.id || ci.code === editingItem.code ? updatedItem : ci
      );
      if (!customItems.some((ci) => ci.id === editingItem.id || ci.code === editingItem.code)) {
        updatedList.push(updatedItem);
      }
      setCustomItems(updatedList);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('custom_menu_items', JSON.stringify(updatedList));

          const existingHotel = JSON.parse(localStorage.getItem('hotel_menu_items') || '[]');
          const updatedHotel = existingHotel.map((it: any) =>
            it.id === editingItem.id || it.code === editingItem.code
              ? {
                  ...it,
                  name: updatedItem.name,
                  category: updatedItem.category,
                  basePrice: validVariants[0]?.price || 0,
                  variants: validVariants,
                  quantityPrices: validVariants.map((v: any) => ({
                    quantityName: v.unit,
                    price: v.price,
                  })),
                  preparationMethod: formPreparationMethod,
                }
              : it
          );
          localStorage.setItem('hotel_menu_items', JSON.stringify(updatedHotel));

          const existingMaster = JSON.parse(
            localStorage.getItem('hotel_master_menu-items-setup') || '[]'
          );
          const updatedMaster = existingMaster.map((it: any) =>
            it.id === editingItem.id || it.code === editingItem.code
              ? {
                  ...it,
                  name: updatedItem.name,
                  category: updatedItem.category,
                  basePrice: validVariants[0]?.price || 0,
                  variants: validVariants,
                  quantityPrices: validVariants.map((v: any) => ({
                    quantityName: v.unit,
                    price: v.price,
                  })),
                  preparationMethod: formPreparationMethod,
                }
              : it
          );
          localStorage.setItem('hotel_master_menu-items-setup', JSON.stringify(updatedMaster));
          window.dispatchEvent(new Event('menu_items_updated'));
        } catch (err) {}
      }

      fetchMenuProducts();
      toast.success('Menu Item Updated', `"${updatedItem.name}" updated successfully.`);
      setIsAddModalOpen(false);
      setEditingItem(null);
      return;
    }

    let dbId: string | null = null;
    // Persist to .NET backend
    try {
      const created = await api.createPOSProduct({
        category: formCategory.trim(),
        name: formItemName.trim(),
        price: validVariants[0]?.price || 0,
        outlet: 'RESTAURANT',
        trackStock: formTrackStock,
        isAvailable: true,
        variants: validVariants,
        variantsJson: JSON.stringify(validVariants),
        preparationMethod: formPreparationMethod,
      });
      if (created?.id) dbId = created.id;
    } catch {
      // Local persistence holds
    }

    const newCustomItem: CustomMenuItem = {
      id: dbId || `custom-${Date.now()}`,
      code,
      name: formItemName.trim(),
      category: formCategory.trim(),
      variants: validVariants,
      preparationMethod: formPreparationMethod,
    };

    const updatedList = [...customItems, newCustomItem];
    setCustomItems(updatedList);

    // Persist to custom_menu_items in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('custom_menu_items', JSON.stringify(updatedList));

        // Sync to hotel_menu_items so Master Setup has it too
        const existingHotel = JSON.parse(localStorage.getItem('hotel_menu_items') || '[]');
        const newHotelEntry = {
          id: newCustomItem.id,
          code: newCustomItem.code,
          name: newCustomItem.name,
          category: newCustomItem.category,
          basePrice: validVariants[0]?.price || 0,
          variants: validVariants,
          quantityPrices: validVariants.map((v) => ({
            quantityName: v.unit,
            price: v.price,
          })),
          trackStock: formTrackStock,
          stock: formTrackStock ? (parseInt(formStock, 10) || 0) : undefined,
          order,
          isActive: true,
          preparationMethod: formPreparationMethod,
        };
        localStorage.setItem(
          'hotel_menu_items',
          JSON.stringify([...existingHotel, newHotelEntry])
        );

        // Synchronize directly with Restaurant Setup Menu Items Setup
        const existingMaster = JSON.parse(localStorage.getItem('hotel_master_menu-items-setup') || '[]');
        const updatedMaster = [
          ...existingMaster.filter((it: any) => it.id !== newCustomItem.id && it.code !== newCustomItem.code),
          newHotelEntry,
        ];
        localStorage.setItem('hotel_master_menu-items-setup', JSON.stringify(updatedMaster));
        window.dispatchEvent(new Event('menu_items_updated'));
      } catch (err) {}
    }

    fetchMenuProducts();

    toast.success(
      'Menu Item Added',
      `"${newCustomItem.name}" with ${validVariants.length} portion unit(s) saved.`
    );
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full space-y-4 select-none font-sans">
      {/* =========================================================================
          1. TOP HEADER: Title & Actions
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Menu
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage dishes, beverages, portion pricing and bar preparation workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchMenuProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh menu items from database"
          >
            <RotateCcw className={cn('w-3.5 h-3.5 text-slate-500', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenBulkPrepModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-2xs cursor-pointer"
            title="Review and configure bar preparation methods (Ready to Serve vs Requires Preparation) for drinks"
          >
            <Wine className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Bar Prep Setup</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TOOLBAR: Search, Category Filter, Diet Filter & Clear
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or code..."
              className="w-full h-9 pl-9 pr-7 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative sm:w-56">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full h-9 appearance-none pl-3 pr-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Categories ({dynamicGroups.length})</option>
              {dynamicGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Clear filter */}
        {(searchQuery || selectedGroupFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedGroupFilter('all');
            }}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline px-1 self-start sm:self-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* =========================================================================
          4. MENU CATEGORY TABLES
         ========================================================================= */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
          >
            {/* Category Header */}
            <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {group.name}
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {/* Fixed Column 1: # */}
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-100 dark:border-slate-800/60">
                      #
                    </th>

                    {/* Fixed Column 2: CODE */}
                    <th className="py-2.5 px-3 w-28 text-center border-r border-slate-100 dark:border-slate-800/60">
                      CODE
                    </th>

                    {/* Fixed Column 3: ITEM NAME */}
                    <th className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800/60">
                      ITEM NAME
                    </th>

                    {/* Fixed Column 4: UNIT */}
                    <th className="py-2.5 px-4 w-36 sm:w-44 text-left border-r border-slate-100 dark:border-slate-800/60">
                      UNIT
                    </th>

                    {/* Fixed Column 5: PRICE */}
                    <th className="py-2.5 px-4 w-36 sm:w-44 text-left">
                      PRICE
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. # */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60 font-mono text-xs text-slate-400 dark:text-slate-500 align-middle">
                        {index + 1}
                      </td>

                      {/* 2. CODE */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-slate-100 dark:border-slate-800/60 align-middle">
                        <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </td>

                      {/* 3. ITEM NAME */}
                      <td className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                      </td>

                      {/* 4. UNIT */}
                      <td className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800/60 align-middle">
                        <div className="flex flex-col gap-1 py-0.5">
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="text-xs font-medium text-slate-600 dark:text-slate-300"
                              >
                                {v.unit}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* 5. PRICE */}
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex flex-col gap-1 py-0.5">
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                              >
                                Rs. {v.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span>No menu items match your search or filter</span>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGroupFilter('all');
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. ADD MENU ITEM MODAL: Matches Restaurant Setup Modal
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl rounded-[6px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#E5EEE9] dark:bg-[#0e3b31] text-[#0B3D32] dark:text-emerald-400">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white">
                  Add Menu Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMenuItem}>
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Item Name (Primary Field, Prominent) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    placeholder="Dish name"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                  />
                </div>

                {/* Category, Code, Order Grid */}
                <div className="grid grid-cols-12 gap-3">
                  {/* Category */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <MenuCategoryCombobox
                      value={formCategory}
                      onChange={setFormCategory}
                      categories={availableCategories}
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
                      value={formItemCode}
                      onChange={(e) => setFormItemCode(e.target.value)}
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
                      value={formOrder}
                      onChange={(e) => setFormOrder(e.target.value)}
                      placeholder="1"
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Unit & Portion Prices: Select multiple units with prices */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Unit &amp; Portion Prices <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Select multiple units (Full, Half, Plate, etc.) and specify each portion price
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const usedNames = new Set(formVariants.map((q) => q.unit));
                        const nextAvailable = availableUnits.find((q) => !usedNames.has(q));
                        setFormVariants((prev) => [
                          ...prev,
                          {
                            unit: nextAvailable || '',
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
                    {formVariants.map((tier, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] shadow-2xs"
                      >
                        {/* Searchable Combobox */}
                        <div className="flex-1 min-w-0">
                          <MenuUnitCombobox
                            value={tier.unit}
                            onChange={(name) => {
                              setFormVariants((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, unit: name } : t))
                              );
                            }}
                            availableUnits={availableUnits}
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
                              setFormVariants((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                              );
                            }}
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                          />
                        </div>

                        {/* Remove Tier Button */}
                        {formVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormVariants((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[3px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                            title="Remove unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Tracking: Checkbox & Conditional Quantity */}
                <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16] p-3 space-y-2 mt-2">
                  <div className="flex items-start gap-2">
                    <input
                      id="menuItemModalTrackStock"
                      type="checkbox"
                      checked={formTrackStock}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFormTrackStock(val);
                        if (val && !formStock) setFormStock('50');
                      }}
                      className="w-4 h-4 rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32] border-[#C5D3CD] cursor-pointer mt-0.5"
                    />
                    <div>
                      <label htmlFor="menuItemModalTrackStock" className="text-xs font-bold text-[#24352F] dark:text-white cursor-pointer flex items-center gap-1.5">
                        <span>Track Stock</span>
                        {formTrackStock ? (
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
                        {formTrackStock
                          ? 'Enable for purchased retail goods (Beer, Coca-Cola, Bottled Water). Stock is deducted upon sale.'
                          : 'Disable for dishes prepared on order (Tea, Coffee, Momo, Chowmein). No stock quantity required.'}
                      </p>
                    </div>
                  </div>

                  {formTrackStock && (
                    <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] space-y-1">
                      <label className="block text-xs font-bold text-[#24352F] dark:text-white">
                        Available Stock Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        required={formTrackStock}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 px-2.5 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-4 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !formItemName.trim() ||
                    !formCategory.trim() ||
                    formVariants.length === 0 ||
                    formVariants.some((t) => !t.unit.trim() || !t.price.trim())
                  }
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Menu Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

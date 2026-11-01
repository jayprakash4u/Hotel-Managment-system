'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Search,
  X,
  ChevronDown,
  Database,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { POSProductData } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useMasterOptions } from '@/lib/mastersData';
import { QuantityAutocomplete } from '@/components/common/QuantityAutocomplete';

export interface MenuGroupItem {
  id: string;
  code: string;
  name: string;
  prices: Record<string, number | null>;
}

export interface MenuGroup {
  id: string;
  name: string;
  description: string;
  unitHeaders: string[]; // e.g. ['Half', 'Full']
  items: MenuGroupItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  // 1. Fast Food & Momos (Measured in Half and Full)
  {
    id: 'fast-food',
    name: 'Fast Food & Momos',
    description: 'Freshly steamed, fried & chilled momos and quick bites',
    unitHeaders: ['Half', 'Full'],
    items: [
      {
        id: 'ff-1',
        code: 'MOMO-C',
        name: 'Chicken Steam Momo',
        prices: { Half: 100, Full: 180 },
      },
      {
        id: 'ff-2',
        code: 'MOMO-V',
        name: 'Veg Steam Momo',
        prices: { Half: 80, Full: 150 },
      },
      {
        id: 'ff-3',
        code: 'MOMO-B',
        name: 'Buff Steam Momo',
        prices: { Half: 90, Full: 160 },
      },
      {
        id: 'ff-4',
        code: 'MOMO-CF',
        name: 'Chicken Fried Momo',
        prices: { Half: 120, Full: 200 },
      },
      {
        id: 'ff-5',
        code: 'MOMO-VF',
        name: 'Veg Fried Momo',
        prices: { Half: 90, Full: 160 },
      },
      {
        id: 'ff-6',
        code: 'MOMO-CHL',
        name: 'Chicken Chilly Momo (C-Momo)',
        prices: { Half: 140, Full: 230 },
      },
      {
        id: 'ff-7',
        code: 'MOMO-PAN',
        name: 'Paneer Steam Momo',
        prices: { Half: 110, Full: 190 },
      },
      {
        id: 'ff-8',
        code: 'FRY-01',
        name: 'Crispy French Fries (Peri Peri / Salted)',
        prices: { Half: 90, Full: 150 },
      },
    ],
  },

  // 2. Main Course & Curries (Measured in Half and Full)
  {
    id: 'main-course',
    name: 'Main Course & Curries',
    description: 'Traditional curries, gravies, and slow-cooked handi dishes',
    unitHeaders: ['Half', 'Full'],
    items: [
      {
        id: 'mc-1',
        code: 'PBM-01',
        name: 'Paneer Butter Masala',
        prices: { Half: 240, Full: 420 },
      },
      {
        id: 'mc-2',
        code: 'CTM-01',
        name: 'Chicken Tikka Masala',
        prices: { Half: 280, Full: 490 },
      },
      {
        id: 'mc-3',
        code: 'DAL-MKH',
        name: 'Dal Makhani Handi',
        prices: { Half: 190, Full: 320 },
      },
      {
        id: 'mc-4',
        code: 'CHK-KAD',
        name: 'Chicken Kadai Peshawari',
        prices: { Half: 290, Full: 510 },
      },
      {
        id: 'mc-5',
        code: 'MUT-ROG',
        name: 'Mutton Rogan Josh Handi',
        prices: { Half: 340, Full: 580 },
      },
      {
        id: 'mc-6',
        code: 'MIX-VEG',
        name: 'Seasonal Mixed Vegetable Curry',
        prices: { Half: 170, Full: 290 },
      },
      {
        id: 'mc-7',
        code: 'BRY-CHK',
        name: 'Hyderabadi Dum Chicken Biryani',
        prices: { Half: 280, Full: 480 },
      },
      {
        id: 'mc-8',
        code: 'RICE-PL',
        name: 'Kashmiri Saffron Veg Pulao',
        prices: { Half: 160, Full: 260 },
      },
    ],
  },

  // 3. Hot Tea & Coffee (Measured in Small, Medium, Large)
  {
    id: 'tea-coffee',
    name: 'Tea & Coffee',
    description: 'Aromatic milk teas, artisan espresso brews, and herbal infusions',
    unitHeaders: ['Small', 'Medium', 'Large'],
    items: [
      {
        id: 'tc-1',
        code: 'TEA-MSL',
        name: 'Special Masala Milk Tea',
        prices: { Small: 40, Medium: 70, Large: 120 },
      },
      {
        id: 'tc-2',
        code: 'COF-FR',
        name: 'Fresh Brewed Coffee',
        prices: { Small: 80, Medium: 120, Large: 160 },
      },
      {
        id: 'tc-3',
        code: 'COF-LAT',
        name: 'Café Latte / Cappuccino',
        prices: { Small: 110, Medium: 150, Large: 190 },
      },
      {
        id: 'tc-4',
        code: 'TEA-LEM',
        name: 'Hot Lemon Honey Ginger',
        prices: { Small: 60, Medium: 90, Large: null },
      },
      {
        id: 'tc-5',
        code: 'TEA-GRN',
        name: 'Himalayan Organic Green Tea',
        prices: { Small: 50, Medium: 80, Large: null },
      },
    ],
  },

  // 4. Cold Drinks & Mocktails (Measured in Glass and Pitcher)
  {
    id: 'drinks',
    name: 'Cold Drinks & Mocktails',
    description: 'Chilled signature mocktails, coolers, and traditional lassis',
    unitHeaders: ['Glass', 'Pitcher'],
    items: [
      {
        id: 'dr-1',
        code: 'MOK-MOJ',
        name: 'Virgin Mint Mojito',
        prices: { Glass: 180, Pitcher: 550 },
      },
      {
        id: 'dr-2',
        code: 'LIME-01',
        name: 'Fresh Lime Soda (Sweet / Salt)',
        prices: { Glass: 90, Pitcher: 280 },
      },
      {
        id: 'dr-3',
        code: 'LAS-MNG',
        name: 'Sweet Mango Lassi',
        prices: { Glass: 140, Pitcher: 420 },
      },
      {
        id: 'dr-4',
        code: 'MOK-BLU',
        name: 'Blue Lagoon Citrus Cooler',
        prices: { Glass: 190, Pitcher: 580 },
      },
      {
        id: 'dr-5',
        code: 'COF-CLD',
        name: 'Cold Coffee with Ice Cream Float',
        prices: { Glass: 170, Pitcher: null },
      },
    ],
  },

  // 5. Tandoori Breads & Naan (Measured in Single and Basket)
  {
    id: 'breads',
    name: 'Tandoori Breads & Naan',
    description: 'Clay oven baked fresh breads and stuffed kulchas',
    unitHeaders: ['Single (1 Pc)', 'Basket (4 Pcs)'],
    items: [
      {
        id: 'br-1',
        code: 'ROT-PLN',
        name: 'Plain Tandoori Roti',
        prices: { 'Single (1 Pc)': 30, 'Basket (4 Pcs)': 110 },
      },
      {
        id: 'br-2',
        code: 'ROT-BTR',
        name: 'Butter Tandoori Roti',
        prices: { 'Single (1 Pc)': 40, 'Basket (4 Pcs)': 150 },
      },
      {
        id: 'br-3',
        code: 'NAN-PLN',
        name: 'Plain Tandoori Naan',
        prices: { 'Single (1 Pc)': 55, 'Basket (4 Pcs)': 200 },
      },
      {
        id: 'br-4',
        code: 'NAN-BTR',
        name: 'Butter Naan',
        prices: { 'Single (1 Pc)': 70, 'Basket (4 Pcs)': 260 },
      },
      {
        id: 'br-5',
        code: 'NAN-GAR',
        name: 'Garlic Butter Naan',
        prices: { 'Single (1 Pc)': 90, 'Basket (4 Pcs)': 320 },
      },
    ],
  },

  // 6. Desserts & Sweets (Measured in Single and Double)
  {
    id: 'desserts',
    name: 'Desserts & Sweets',
    description: 'Warm gulab jamuns, rasgullas, and artisan ice creams',
    unitHeaders: ['Single (1 Pc)', 'Plate (2 Pcs)'],
    items: [
      {
        id: 'des-1',
        code: 'GJ-01',
        name: 'Hot Gulab Jamun with Pistachio',
        prices: { 'Single (1 Pc)': 70, 'Plate (2 Pcs)': 130 },
      },
      {
        id: 'des-2',
        code: 'RAS-01',
        name: 'Bengali Spongy Rasgulla',
        prices: { 'Single (1 Pc)': 60, 'Plate (2 Pcs)': 110 },
      },
      {
        id: 'des-3',
        code: 'ICE-VAN',
        name: 'Vanilla / Chocolate Ice Cream Scoop',
        prices: { 'Single (1 Pc)': 80, 'Plate (2 Pcs)': 150 },
      },
      {
        id: 'des-4',
        code: 'BRW-ICE',
        name: 'Sizzling Hot Brownie with Vanilla Float',
        prices: { 'Single (1 Pc)': null, 'Plate (2 Pcs)': 240 },
      },
    ],
  },
];

interface CustomMenuItem {
  id: string;
  code: string;
  name: string;
  category: string;
  prices: Record<string, number>;
  isVeg?: boolean;
}

const COMMON_MENU_UNITS = [
  'Full',
  'Half',
  'Quarter',
  'Plate',
  'Plate (10 Pcs)',
  'Plate (6 Pcs)',
  'Glass (250ml)',
  'Cup / Mug',
  'Bottle (750ml)',
  'Bowl',
  'Piece',
];

export default function OurMenuTablePage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [dbProducts, setDbProducts] = useState<POSProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Custom added items from local state / localStorage
  const [customItems, setCustomItems] = useState<CustomMenuItem[]>([]);

  // Fetch units dynamically configured in Unit Setup under Master Setup
  const { activeItems: masterUnits } = useMasterOptions('units');

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formItemName, setFormItemName] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formCategory, setFormCategory] = useState('Fast Food & Momos');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(false);
  const [formPortions, setFormPortions] = useState<{ unitName: string; price: string }[]>([
    { unitName: 'Full Portion', price: '' },
    { unitName: 'Half Portion', price: '' },
  ]);

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
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('custom_menu_items');
        if (stored) {
          setCustomItems(JSON.parse(stored));
        }
      } catch (err) {}
    }
  }, []);

  // Compute dynamic groups merging default MENU_GROUPS, customItems, and database products
  const dynamicGroups = useMemo(() => {
    const groupMap = new Map<string, MenuGroup>();

    // 1. Seed default category templates
    MENU_GROUPS.forEach((g) => {
      groupMap.set(g.name.toLowerCase().trim(), {
        ...g,
        unitHeaders: [...g.unitHeaders],
        items: g.items.map((it) => ({ ...it, prices: { ...it.prices } })),
      });
    });

    // 2. Merge locally added custom items
    customItems.forEach((ci) => {
      const catKey = (ci.category || 'Special Dishes').toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: ci.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: ci.category,
          description: `Dishes & beverages in ${ci.category}`,
          unitHeaders: Object.keys(ci.prices),
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      const existing = grp.items.find(
        (it) => it.id === ci.id || it.code.toLowerCase() === ci.code.toLowerCase()
      );
      if (existing) {
        existing.prices = { ...existing.prices, ...ci.prices };
      } else {
        grp.items.push({
          id: ci.id,
          code: ci.code,
          name: ci.name,
          prices: ci.prices,
        });
      }
    });

    // 3. Merge database products
    dbProducts.forEach((p) => {
      const catKey = (p.category || 'Special Dishes').toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: p.category ? p.category.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'special-dishes',
          name: p.category || 'Special Dishes',
          description: `Fresh dishes & beverages in ${p.category || 'Special Dishes'}`,
          unitHeaders: ['Price'],
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      // Base dish name without (Half)/(Full)
      const baseName = p.name.replace(/\s*\([^)]*\)$/, '').trim();
      const isFull = p.name.toLowerCase().includes('(full)');
      const isHalf = p.name.toLowerCase().includes('(half)');

      const existing = grp.items.find(
        (it) => it.name.toLowerCase() === baseName.toLowerCase() || it.code.toLowerCase() === p.id.slice(0, 8).toLowerCase()
      );

      if (existing) {
        if (isFull) existing.prices['Full'] = p.price;
        else if (isHalf) existing.prices['Half'] = p.price;
        else if (grp.unitHeaders.length > 0) existing.prices[grp.unitHeaders[0]] = p.price;
      } else {
        const pricesObj: Record<string, number | null> = {};
        if (isFull) pricesObj['Full'] = p.price;
        else if (isHalf) pricesObj['Half'] = p.price;
        else pricesObj[grp.unitHeaders[0] || 'Standard'] = p.price;

        grp.items.push({
          id: p.id,
          code: p.id.slice(0, 8).toUpperCase(),
          name: baseName,
          prices: pricesObj,
        });
      }
    });

    // 4. Ensure all units present across items in a group appear as headers
    groupMap.forEach((grp) => {
      const allUnits = new Set<string>(grp.unitHeaders);
      grp.items.forEach((it) => {
        Object.keys(it.prices).forEach((u) => {
          if (it.prices[u] !== null && it.prices[u] !== undefined) {
            allUnits.add(u);
          }
        });
      });
      grp.unitHeaders = Array.from(allUnits);
    });

    return Array.from(groupMap.values()).filter((g) => g.items.length > 0);
  }, [dbProducts, customItems]);

  // Filtered menu groups & items
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return dynamicGroups.map((group) => {
      // Check group filter
      if (selectedGroupFilter !== 'all' && group.id !== selectedGroupFilter) {
        return { ...group, items: [] };
      }

      // Check search query
      if (!q) {
        return group;
      }

      const matchingItems = group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          group.name.toLowerCase().includes(q)
      );

      return {
        ...group,
        items: matchingItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [dynamicGroups, searchQuery, selectedGroupFilter]);

  // Open modal with fresh state
  const handleOpenAddModal = (presetCategory?: string) => {
    setFormItemName('');
    setFormItemCode('');
    setFormCategory(presetCategory || dynamicGroups[0]?.name || 'Fast Food & Momos');
    setCustomCategoryInput('');
    setFormIsVeg(false);
    const u1 = masterUnits[0]?.name || 'Full Portion';
    const u2 = masterUnits[1]?.name || 'Half Portion';
    setFormPortions([
      { unitName: u1, price: '' },
      { unitName: u2, price: '' },
    ]);
    setIsAddModalOpen(true);
  };

  // Add custom unit dynamically picking next unselected unit from Master Setup
  const handleAddCustomUnit = () => {
    const usedNames = new Set(formPortions.map((p) => p.unitName.trim().toLowerCase()));
    const nextUnused = masterUnits.find((u) => !usedNames.has(u.name.toLowerCase()));
    setFormPortions((prev) => [
      ...prev,
      { unitName: nextUnused ? nextUnused.name : '', price: '' },
    ]);
  };

  // Save new menu item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      toast.error('Item Name Required', 'Please provide a name for the menu item.');
      return;
    }

    const category =
      formCategory === '__NEW__'
        ? customCategoryInput.trim() || 'Special Dishes'
        : formCategory;

    // Build prices map
    const validPricesMap: Record<string, number> = {};
    formPortions.forEach((tier) => {
      const uName = tier.unitName.trim();
      const num = parseFloat(tier.price);
      if (uName && !isNaN(num) && num >= 0) {
        validPricesMap[uName] = num;
      }
    });

    if (Object.keys(validPricesMap).length === 0) {
      toast.error('Price Required', 'Please enter at least one unit with a valid price.');
      return;
    }

    const code =
      formItemCode.trim().toUpperCase() ||
      formItemName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const newCustomItem: CustomMenuItem = {
      id: `custom-${Date.now()}`,
      code,
      name: formItemName.trim(),
      category,
      prices: validPricesMap,
      isVeg: formIsVeg,
    };

    const updatedList = [...customItems, newCustomItem];
    setCustomItems(updatedList);

    // Persist to custom_menu_items
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
          basePrice: Object.values(validPricesMap)[0] || 0,
          quantityPrices: Object.entries(validPricesMap).map(([uName, uPrice]) => ({
            quantityName: uName,
            price: uPrice,
          })),
          order: existingHotel.length + 1,
          isActive: true,
        };
        localStorage.setItem('hotel_menu_items', JSON.stringify([...existingHotel, newHotelEntry]));
      } catch (err) {}
    }

    // Attempt backend persistence
    try {
      await api.createPOSProduct({
        category: newCustomItem.category,
        name: newCustomItem.name,
        price: Object.values(validPricesMap)[0] || 0,
        trackStock: false,
        isAvailable: true,
      });
    } catch {
      // Local persistence holds
    }

    toast.success(
      'Menu Item Added',
      `"${newCustomItem.name}" with ${Object.keys(validPricesMap).length} portion unit(s) added successfully.`
    );
    setIsAddModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col min-h-0 select-none">
      {/* =========================================================================
          PAGE HEADER: Title, Subtitle & Total Items Counter
         ========================================================================= */}
      <div className="shrink-0 pb-3 border-b border-[#E5EEE9] dark:border-[#145447] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600">
            <ChefHat className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#24352F] dark:text-white font-heading tracking-tight">
            Café Menu
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {dbProducts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Database Connected ({dbProducts.length} Items)</span>
            </span>
          )}
          <button
            type="button"
            onClick={fetchMenuProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Refresh menu items from database"
          >
            <RotateCcw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#082e25] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR: Search Bar, Category Filter Dropdown & Direct "Add Item" Button
         ========================================================================= */}
      <div className="shrink-0 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#879B90]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or code..."
            className="w-full pl-9 pr-7 py-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] placeholder-[#879B90] focus:outline-none focus:border-[#0B3D32] focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#879B90] hover:text-[#24352F] dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative sm:w-56">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-semibold focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories ({dynamicGroups.length})</option>
            {dynamicGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#879B90] pointer-events-none" />
        </div>

        {/* Clear filter */}
        {(searchQuery || selectedGroupFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedGroupFilter('all');
            }}
            className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400 px-1"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* =========================================================================
          MENU GROUPS: TABLE STYLE WITH MEASURED QUANTITY UNITS AS TABLE HEADERS
         ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 custom-scrollbar pr-1 pb-10">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            {/* Category Header */}
            <div className="px-1 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
                {group.name}
              </h2>
            </div>

            {/* Table Container with Column Dividers and Unit Headers */}
            <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                      {/* # (Order) */}
                      <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        #
                      </th>

                      {/* Code */}
                      <th className="py-2.5 px-3 w-20 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        Code
                      </th>

                      {/* Item Name */}
                      <th className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447]">
                        Item Name
                      </th>

                      {/* Measured Units as Table Headers (Full, Half, etc.) */}
                      {group.unitHeaders.map((unitHeader, idx) => (
                        <th
                          key={unitHeader}
                          className={cn(
                            'py-2.5 px-4 w-28 sm:w-36 text-right',
                            idx < group.unitHeaders.length - 1 &&
                              'border-r border-[#E5EEE9] dark:border-[#145447]'
                          )}
                        >
                          {unitHeader}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                    {group.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                      >
                        {/* Order # */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20 font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                          {index + 1}
                        </td>

                        {/* Code */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                            {item.code}
                          </span>
                        </td>

                        {/* Item Name */}
                        <td className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447] font-semibold text-xs sm:text-[13px] text-[#24352F] dark:text-white">
                          {item.name}
                        </td>

                        {/* Prices under respective Unit Headers */}
                        {group.unitHeaders.map((unitHeader, uIdx) => {
                          const price = item.prices[unitHeader];
                          const hasPrice = price !== undefined && price !== null;

                          return (
                            <td
                              key={unitHeader}
                              className={cn(
                                'py-2.5 px-4 text-right whitespace-nowrap',
                                uIdx < group.unitHeaders.length - 1 &&
                                  'border-r border-[#E5EEE9] dark:border-[#145447]'
                              )}
                            >
                              {hasPrice ? (
                                <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                                  Rs. {price.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="py-16 text-center text-xs text-[#879B90] bg-white dark:bg-[#07241E] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            <span>No menu items match your search or filter</span>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGroupFilter('all');
                }}
                className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400"
              >
                Reset filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADD MENU ITEM MODAL: Multiple Unit & Price Selection
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl rounded-lg bg-white shadow-2xl border border-slate-200 dark:bg-[#07241E] dark:border-[#145447] overflow-hidden z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white dark:bg-emerald-600">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    Add New Menu Item
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Set up dish name, category, and multiple portion unit prices
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dish / Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  placeholder="Enter dish name"
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                />
              </div>

              {/* Code & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formItemCode}
                    onChange={(e) => setFormItemCode(e.target.value)}
                    placeholder="Code (optional)"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs placeholder:normal-case"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Food Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    {dynamicGroups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add Custom Category</option>
                  </select>
                </div>
              </div>

              {formCategory === '__NEW__' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Category name"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                  />
                </div>
              )}

              {/* Multiple Unit Selection & Pricing */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#145447]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unit & Portion Prices <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Select multiple units and specify each portion rate
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomUnit}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D32] hover:text-[#082b23] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>

                {/* Selected Unit & Price Inputs */}
                <div className="space-y-2">
                  {formPortions.map((tier, idx) => {
                    const otherUsedNames = formPortions
                      .filter((_, i) => i !== idx)
                      .map((t) => t.unitName);

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <QuantityAutocomplete
                            value={tier.unitName}
                            onChange={(val) => {
                              setFormPortions((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, unitName: val } : t))
                              );
                            }}
                            excludeNames={otherUsedNames}
                            placeholder="Select unit"
                          />
                        </div>

                        <div className="w-36 sm:w-44 relative shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                            रू
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required
                            value={tier.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormPortions((prev) =>
                                prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                              );
                            }}
                            placeholder="0.00"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-7 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#071F1A] dark:text-white placeholder:text-slate-400/80 placeholder:font-normal placeholder:text-xs"
                          />
                        </div>

                        {formPortions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormPortions((prev) => prev.filter((_, i) => i !== idx))
                            }
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

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#145447]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-[3px] dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B3D32] hover:bg-[#082b23] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-[3px] shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function OurMenuTablePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Filtered menu groups & items
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return MENU_GROUPS.map((group) => {
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
  }, [searchQuery, selectedGroupFilter]);

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
      </div>

      {/* =========================================================================
          TOOLBAR: Search Bar & Category Filter Dropdown
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
            <option value="all">All Categories</option>
            {MENU_GROUPS.map((g) => (
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
            <div className="px-1">
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
    </div>
  );
}

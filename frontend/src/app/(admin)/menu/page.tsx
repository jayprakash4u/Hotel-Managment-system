'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Wine,
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
import { POSProductData, ProductVariant } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { useMasterOptions } from '@/lib/mastersData';

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
}

export default function OurMenuTablePage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [dbProducts, setDbProducts] = useState<POSProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formItemName, setFormItemName] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formCategory, setFormCategory] = useState('Fast Food & Momos');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formDepartment, setFormDepartment] = useState<'KOT' | 'BOT'>('KOT');
  const [formIsVeg, setFormIsVeg] = useState(false);
  const [formVariants, setFormVariants] = useState<{ unit: string; price: string }[]>([
    { unit: '', price: '' },
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
  }, []);

  // Compute clean groups merging default MENU_GROUPS, customItems, and database products
  const dynamicGroups = useMemo(() => {
    const groupMap = new Map<string, MenuGroup>();

    // 1. Seed default category templates
    MENU_GROUPS.forEach((g) => {
      groupMap.set(g.name.toLowerCase().trim(), {
        ...g,
        items: g.items.map((it) => ({
          ...it,
          variants: it.variants.map((v) => ({ ...v })),
        })),
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
        };
      } else {
        grp.items.push({
          id: ci.id,
          code: ci.code,
          name: ci.name,
          category: ci.category,
          variants: ci.variants,
          isVeg: ci.isVeg,
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
        } catch {
          // fallback
        }
      }

      // If no variants array, extract from (Half)/(Full) or single price
      const baseName = p.name.replace(/\s*\([^)]*\)$/, '').trim();
      const isFull = p.name.toLowerCase().includes('(full)');
      const isHalf = p.name.toLowerCase().includes('(half)');

      const existing = grp.items.find(
        (it) =>
          it.name.toLowerCase() === baseName.toLowerCase() ||
          it.code.toLowerCase() === p.id.slice(0, 8).toLowerCase()
      );

      if (variants.length > 0) {
        if (existing) {
          existing.variants = variants;
        } else {
          grp.items.push({
            id: p.id,
            code: p.id.slice(0, 8).toUpperCase(),
            name: baseName,
            category: p.category,
            variants,
          });
        }
      } else if (existing) {
        if (isFull) {
          const hasFull = existing.variants.some((v) => v.unit.toLowerCase() === 'full');
          if (!hasFull) existing.variants.push({ unit: 'Full', price: p.price });
        } else if (isHalf) {
          const hasHalf = existing.variants.some((v) => v.unit.toLowerCase() === 'half');
          if (!hasHalf) existing.variants.push({ unit: 'Half', price: p.price });
        } else {
          const hasReg = existing.variants.some((v) => v.unit.toLowerCase() === 'regular');
          if (!hasReg) existing.variants.push({ unit: 'Regular', price: p.price });
        }
      } else {
        const itemVariants: MenuVariant[] = [];
        if (isFull) itemVariants.push({ unit: 'Full', price: p.price });
        else if (isHalf) itemVariants.push({ unit: 'Half', price: p.price });
        else itemVariants.push({ unit: 'Regular', price: p.price });

        grp.items.push({
          id: p.id,
          code: p.id.slice(0, 8).toUpperCase(),
          name: baseName,
          category: p.category,
          variants: itemVariants,
        });
      }
    });

    return Array.from(groupMap.values()).filter((g) => g.items.length > 0);
  }, [dbProducts, customItems]);

  // Filtered menu groups & items
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return dynamicGroups
      .map((group) => {
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
      })
      .filter((group) => group.items.length > 0);
  }, [dynamicGroups, searchQuery, selectedGroupFilter]);

  // Open modal with fresh state
  const handleOpenAddModal = (presetCategory?: string) => {
    const cat = presetCategory || dynamicGroups[0]?.name || 'Cold Drinks & Mocktails';
    const isBev =
      cat.toLowerCase().includes('drink') ||
      cat.toLowerCase().includes('beverage') ||
      cat.toLowerCase().includes('mocktail') ||
      cat.toLowerCase().includes('coffee') ||
      cat.toLowerCase().includes('tea') ||
      cat.toLowerCase().includes('bar');

    setFormItemName('');
    setFormItemCode('');
    setFormCategory(cat);
    setFormDepartment(isBev ? 'BOT' : 'KOT');
    setCustomCategoryInput('');
    setFormIsVeg(false);
    setFormVariants([
      { unit: '', price: '' },
    ]);
    setIsAddModalOpen(true);
  };

  // Add a new unit & price row dynamically
  const handleAddVariantRow = () => {
    setFormVariants((prev) => [...prev, { unit: '', price: '' }]);
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

    const newCustomItem: CustomMenuItem = {
      id: `custom-${Date.now()}`,
      code,
      name: formItemName.trim(),
      category,
      variants: validVariants,
      isVeg: formIsVeg,
      department: formDepartment,
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
          department: formDepartment,
          basePrice: validVariants[0]?.price || 0,
          variants: validVariants,
          quantityPrices: validVariants.map((v) => ({
            quantityName: v.unit,
            price: v.price,
          })),
          order: existingHotel.length + 1,
          isActive: true,
        };
        localStorage.setItem(
          'hotel_menu_items',
          JSON.stringify([...existingHotel, newHotelEntry])
        );
      } catch (err) {}
    }

    // Persist to .NET backend with variants, variantsJson and department
    try {
      await api.createPOSProduct({
        category: newCustomItem.category,
        name: newCustomItem.name,
        price: validVariants[0]?.price || 0,
        department: formDepartment,
        trackStock: false,
        isAvailable: true,
        variants: validVariants,
        variantsJson: JSON.stringify(validVariants),
      });
    } catch {
      // Local persistence holds
    }

    toast.success(
      'Menu Item Added',
      `"${newCustomItem.name}" with ${validVariants.length} variant(s) added successfully.`
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
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#24352F] dark:text-white font-heading tracking-tight">
              Café Menu
            </h1>
            <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
              Multi-variant restaurant & beverage menu management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dbProducts.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
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
          TOOLBAR: Search Bar, Category Filter Dropdown & Clear Filters
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
          MENU GROUPS: FIXED 4-COLUMN TABLE (#, CODE, ITEM NAME, PRICE)
          No dynamic columns created. All variants stacked vertically in PRICE cell.
         ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 custom-scrollbar pr-1 pb-10">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            {/* Category Header */}
            <div className="px-1 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
                {group.name}
              </h2>
              <span className="text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Table Container with Fixed 4 Columns */}
            <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                      {/* Fixed Column 1: # */}
                      <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        #
                      </th>

                      {/* Fixed Column 2: CODE */}
                      <th className="py-2.5 px-3 w-28 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        CODE
                      </th>

                      {/* Fixed Column 3: ITEM NAME */}
                      <th className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447]">
                        ITEM NAME
                      </th>

                      {/* Fixed Column 4: PRICE (Stacked Variants) */}
                      <th className="py-2.5 px-4 w-52 sm:w-64 text-left">
                        PRICE
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                    {group.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                      >
                        {/* 1. # (Order) */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20 font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE] align-middle">
                          {index + 1}
                        </td>

                        {/* 2. CODE */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] align-middle">
                          <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                            {item.code}
                          </span>
                        </td>

                        {/* 3. ITEM NAME */}
                        <td className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447] align-middle">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-[13px] text-[#24352F] dark:text-white">
                              {item.name}
                            </span>
                            {item.isVeg !== undefined && (
                              <span
                                className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] border shrink-0',
                                  item.isVeg
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                                )}
                              >
                                {item.isVeg ? 'VEG' : 'NON-VEG'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. PRICE: Stacked variants inside this single cell */}
                        <td className="py-2 px-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {item.variants && item.variants.length > 0 ? (
                              item.variants.map((v, vIdx) => (
                                <div
                                  key={vIdx}
                                  className="flex items-center justify-between sm:justify-start gap-3 text-xs"
                                >
                                  <span className="font-medium text-slate-600 dark:text-slate-300 min-w-[70px] sm:min-w-[90px]">
                                    {v.unit}:
                                  </span>
                                  <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-300 whitespace-nowrap">
                                    Rs. {v.price.toLocaleString()}
                                  </span>
                                </div>
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
          ADD MENU ITEM MODAL: Dynamic Variants (Beverage & Food Sizes)
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
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white dark:bg-emerald-600">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Add Menu Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Dish / Drink Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500"
                />
              </div>

              {/* Code, Category & Department Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formItemCode}
                    onChange={(e) => setFormItemCode(e.target.value)}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Menu Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCategory(val);
                      const isBev =
                        val.toLowerCase().includes('drink') ||
                        val.toLowerCase().includes('beverage') ||
                        val.toLowerCase().includes('mocktail') ||
                        val.toLowerCase().includes('coffee') ||
                        val.toLowerCase().includes('tea') ||
                        val.toLowerCase().includes('bar');
                      setFormDepartment(isBev ? 'BOT' : 'KOT');
                    }}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as 'KOT' | 'BOT')}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="KOT">KOT – Kitchen</option>
                    <option value="BOT">BOT – Bar/Beverage</option>
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
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Dynamic Variants: Unit Dropdown + Price Input */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#145447]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Variants &amp; Unit Prices <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3D32] hover:text-[#082b23] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-[3px] border border-emerald-200 dark:border-emerald-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>

                {/* Datalist for autocomplete suggestions */}
                <datalist id="unit-options-list">
                  {allUnitOptions.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>

                {/* Selected Unit & Price Inputs */}
                <div className="space-y-2">
                  {formVariants.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 rounded-[3px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] dark:border-[#145447] shadow-2xs"
                    >
                      {/* Unit Selector / Input with Datalist */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          list="unit-options-list"
                          required
                          value={tier.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormVariants((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, unit: val } : t))
                            );
                          }}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#071F1A] dark:text-white"
                        />
                      </div>

                      {/* Price Input */}
                      <div className="w-32 sm:w-40 relative shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                          Rs.
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          required
                          value={tier.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormVariants((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                            );
                          }}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-9 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#071F1A] dark:text-white"
                        />
                      </div>

                      {/* Remove Row Button */}
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormVariants((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[3px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                          title="Remove unit variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
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

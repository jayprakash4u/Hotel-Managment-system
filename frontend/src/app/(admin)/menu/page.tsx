'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Search,
  X,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { POSProductData } from '@/lib/types';
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
          { unit: 'Half', price: 100 },
          { unit: 'Full', price: 170 },
        ],
      },
      {
        id: 'ff-6',
        code: 'MOMO-CJ',
        name: 'Chicken Jhol Momo',
        variants: [{ unit: 'Full', price: 220 }],
      },
      {
        id: 'ff-7',
        code: 'MOMO-CC',
        name: 'Chicken C. Momo (Chilli)',
        variants: [{ unit: 'Full', price: 240 }],
      },
      {
        id: 'ff-8',
        code: 'CHOW-C',
        name: 'Chicken Chowmein',
        variants: [
          { unit: 'Half', price: 110 },
          { unit: 'Full', price: 180 },
        ],
      },
      {
        id: 'ff-9',
        code: 'CHOW-V',
        name: 'Veg Chowmein',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 80 },
          { unit: 'Full', price: 140 },
        ],
      },
      {
        id: 'ff-10',
        code: 'CHOW-E',
        name: 'Egg Chowmein',
        variants: [
          { unit: 'Half', price: 95 },
          { unit: 'Full', price: 160 },
        ],
      },
      {
        id: 'ff-11',
        code: 'CHOW-M',
        name: 'Mixed Chowmein (Chicken + Egg)',
        variants: [{ unit: 'Full', price: 230 }],
      },
      {
        id: 'ff-12',
        code: 'THUK-C',
        name: 'Chicken Thukpa',
        variants: [{ unit: 'Full', price: 190 }],
      },
      {
        id: 'ff-13',
        code: 'THUK-V',
        name: 'Veg Thukpa',
        isVeg: true,
        variants: [{ unit: 'Full', price: 150 }],
      },
      {
        id: 'ff-14',
        code: 'SNK-FF',
        name: 'French Fries',
        isVeg: true,
        variants: [{ unit: 'Plate', price: 160 }],
      },
      {
        id: 'ff-15',
        code: 'SNK-CF',
        name: 'Crispy Fried Chicken (3 pcs)',
        variants: [{ unit: 'Plate', price: 280 }],
      },
      {
        id: 'ff-16',
        code: 'SNK-CW',
        name: 'Spicy Chicken Wings (6 pcs)',
        variants: [{ unit: 'Plate', price: 320 }],
      },
      {
        id: 'ff-17',
        code: 'SNK-SN',
        name: 'Chicken Sausage (Fried, 4 pcs)',
        variants: [{ unit: 'Plate', price: 180 }],
      },
    ],
  },

  // 2. Main Course & Traditional Meals
  {
    id: 'main-course',
    name: 'Main Course & Khana Sets',
    description: 'Authentic Nepali thali sets, biryanis, curries, naan & rice bowls',
    items: [
      {
        id: 'mc-1',
        code: 'SET-THN',
        name: 'Nepali Non-Veg Khana Set (Chicken)',
        variants: [{ unit: 'Full Set', price: 420 }],
      },
      {
        id: 'mc-2',
        code: 'SET-THM',
        name: 'Nepali Mutton Khana Set',
        variants: [{ unit: 'Full Set', price: 550 }],
      },
      {
        id: 'mc-3',
        code: 'SET-THV',
        name: 'Nepali Veg Khana Set',
        isVeg: true,
        variants: [{ unit: 'Full Set', price: 280 }],
      },
      {
        id: 'mc-4',
        code: 'CUR-CKD',
        name: 'Chicken Curry (Local / Broiler)',
        variants: [
          { unit: 'Half', price: 200 },
          { unit: 'Full', price: 350 },
        ],
      },
      {
        id: 'mc-5',
        code: 'CUR-MTN',
        name: 'Mutton Rogan Josh',
        variants: [
          { unit: 'Half', price: 320 },
          { unit: 'Full', price: 580 },
        ],
      },
      {
        id: 'mc-6',
        code: 'CUR-BTR',
        name: 'Butter Chicken (Murgh Makhani)',
        variants: [{ unit: 'Full', price: 420 }],
      },
      {
        id: 'mc-7',
        code: 'CUR-PNR',
        name: 'Paneer Butter Masala',
        isVeg: true,
        variants: [{ unit: 'Full', price: 340 }],
      },
      {
        id: 'mc-8',
        code: 'CUR-KDI',
        name: 'Kadai Chicken',
        variants: [{ unit: 'Full', price: 380 }],
      },
      {
        id: 'mc-9',
        code: 'CUR-DAL',
        name: 'Dal Makhani (Slow-cooked)',
        isVeg: true,
        variants: [{ unit: 'Full', price: 220 }],
      },
      {
        id: 'mc-10',
        code: 'CUR-DFY',
        name: 'Dal Fry / Dal Tadka',
        isVeg: true,
        variants: [{ unit: 'Full', price: 160 }],
      },
      {
        id: 'mc-11',
        code: 'BRY-CHK',
        name: 'Hyderabadi Chicken Biryani',
        variants: [{ unit: 'Full with Raita', price: 390 }],
      },
      {
        id: 'mc-12',
        code: 'BRY-MTN',
        name: 'Dum Mutton Biryani',
        variants: [{ unit: 'Full with Raita', price: 540 }],
      },
      {
        id: 'mc-13',
        code: 'BRY-VEG',
        name: 'Subz Veg Biryani',
        isVeg: true,
        variants: [{ unit: 'Full with Raita', price: 260 }],
      },
      {
        id: 'mc-14',
        code: 'RIC-FRY',
        name: 'Chicken Fried Rice',
        variants: [
          { unit: 'Half', price: 110 },
          { unit: 'Full', price: 180 },
        ],
      },
      {
        id: 'mc-15',
        code: 'RIC-VFR',
        name: 'Veg Fried Rice',
        isVeg: true,
        variants: [
          { unit: 'Half', price: 80 },
          { unit: 'Full', price: 140 },
        ],
      },
      {
        id: 'mc-16',
        code: 'RIC-EFR',
        name: 'Egg Fried Rice',
        variants: [
          { unit: 'Half', price: 95 },
          { unit: 'Full', price: 160 },
        ],
      },
      {
        id: 'mc-17',
        code: 'BRD-NAN',
        name: 'Butter Naan / Garlic Naan',
        isVeg: true,
        variants: [{ unit: 'Piece', price: 70 }],
      },
      {
        id: 'mc-18',
        code: 'BRD-ROT',
        name: 'Tandoori Roti',
        isVeg: true,
        variants: [{ unit: 'Piece', price: 35 }],
      },
    ],
  },

  // 3. Sekuwa, Tandoori & Sizzlers
  {
    id: 'grill-tandoori',
    name: 'Sekuwa, Grills & Tandoori',
    description: 'Charcoal fire roasted sekuwa, tandoori platters, sizzlers & kebabs',
    items: [
      {
        id: 'gt-1',
        code: 'SEK-CHK',
        name: 'Chicken Sekuwa (Charcoal Roasted)',
        variants: [
          { unit: 'Quarter (250g)', price: 280 },
          { unit: 'Half (500g)', price: 520 },
          { unit: 'Full (1 Kg)', price: 980 },
        ],
      },
      {
        id: 'gt-2',
        code: 'SEK-MTN',
        name: 'Mutton Sekuwa',
        variants: [
          { unit: 'Quarter (250g)', price: 420 },
          { unit: 'Half (500g)', price: 800 },
          { unit: 'Full (1 Kg)', price: 1550 },
        ],
      },
      {
        id: 'gt-3',
        code: 'SEK-POK',
        name: 'Pork Sekuwa',
        variants: [
          { unit: 'Quarter (250g)', price: 320 },
          { unit: 'Half (500g)', price: 600 },
          { unit: 'Full (1 Kg)', price: 1150 },
        ],
      },
      {
        id: 'gt-4',
        code: 'TND-CHK',
        name: 'Tandoori Chicken (Whole / Half)',
        variants: [
          { unit: 'Half', price: 380 },
          { unit: 'Full', price: 720 },
        ],
      },
      {
        id: 'gt-5',
        code: 'TND-TIK',
        name: 'Chicken Tikka (Boneless)',
        variants: [{ unit: 'Plate (6 pcs)', price: 380 }],
      },
      {
        id: 'gt-6',
        code: 'TND-PTK',
        name: 'Paneer Tikka (Tandoori)',
        isVeg: true,
        variants: [{ unit: 'Plate (6 pcs)', price: 320 }],
      },
      {
        id: 'gt-7',
        code: 'SIZ-CHK',
        name: 'Chicken Sizzler with Fries & Veggies',
        variants: [{ unit: 'Full Sizzler', price: 480 }],
      },
      {
        id: 'gt-8',
        code: 'SIZ-STK',
        name: 'Grilled Steak Sizzler with Mushroom Sauce',
        variants: [{ unit: 'Full Sizzler', price: 550 }],
      },
    ],
  },

  // 4. Hot Beverages
  {
    id: 'hot-drinks',
    name: 'Coffee & Hot Beverages',
    description: 'Espresso-based coffees, Himalayan milk tea, herbal teas and hot chocolate',
    items: [
      {
        id: 'hd-1',
        code: 'TEA-MLK',
        name: 'Special Masala Milk Tea',
        isVeg: true,
        variants: [{ unit: 'Cup', price: 45 }],
      },
      {
        id: 'hd-2',
        code: 'TEA-BLK',
        name: 'Black Tea (Organic Ilam)',
        isVeg: true,
        variants: [{ unit: 'Cup', price: 30 }],
      },
      {
        id: 'hd-3',
        code: 'TEA-LMN',
        name: 'Fresh Hot Lemon Tea with Honey',
        isVeg: true,
        variants: [{ unit: 'Cup', price: 60 }],
      },
      {
        id: 'hd-4',
        code: 'TEA-GRN',
        name: 'Green Tea (Himalayan Leaves)',
        isVeg: true,
        variants: [{ unit: 'Pot (serves 2)', price: 120 }],
      },
      {
        id: 'hd-5',
        code: 'COF-ESP',
        name: 'Espresso (Single Shot)',
        isVeg: true,
        variants: [
          { unit: 'Single', price: 90 },
          { unit: 'Double', price: 130 },
        ],
      },
      {
        id: 'hd-6',
        code: 'COF-AME',
        name: 'Caffe Americano',
        isVeg: true,
        variants: [
          { unit: 'Regular', price: 120 },
          { unit: 'Large', price: 160 },
        ],
      },
      {
        id: 'hd-7',
        code: 'COF-CAP',
        name: 'Cappuccino (Velvety Foam)',
        isVeg: true,
        variants: [
          { unit: 'Regular', price: 150 },
          { unit: 'Large', price: 190 },
        ],
      },
      {
        id: 'hd-8',
        code: 'COF-LAT',
        name: 'Caffe Latte',
        isVeg: true,
        variants: [
          { unit: 'Regular', price: 160 },
          { unit: 'Large', price: 210 },
        ],
      },
      {
        id: 'hd-9',
        code: 'COF-MOCH',
        name: 'Cafe Mocha (Dark Chocolate)',
        isVeg: true,
        variants: [{ unit: 'Regular', price: 210 }],
      },
      {
        id: 'hd-10',
        code: 'COF-HCH',
        name: 'Hot Chocolate Deluxe with Marshmallows',
        isVeg: true,
        variants: [{ unit: 'Mug', price: 180 }],
      },
    ],
  },

  // 5. Cold Drinks & Mocktails
  {
    id: 'cold-drinks',
    name: 'Cold Drinks, Juices & Mocktails',
    description: 'Chilled sodas, iced coffees, seasonal fruit smoothies and refreshing mocktails',
    items: [
      {
        id: 'cd-1',
        code: 'SOD-CC',
        name: 'Coca Cola',
        isVeg: true,
        variants: [
          { unit: 'Can (330ml)', price: 100 },
          { unit: '500ml Bottle', price: 120 },
        ],
      },
      {
        id: 'cd-2',
        code: 'SOD-SP',
        name: 'Sprite',
        isVeg: true,
        variants: [
          { unit: 'Can (330ml)', price: 100 },
          { unit: '500ml Bottle', price: 120 },
        ],
      },
      {
        id: 'cd-3',
        code: 'SOD-FN',
        name: 'Fanta Orange',
        isVeg: true,
        variants: [
          { unit: 'Can (330ml)', price: 100 },
          { unit: '500ml Bottle', price: 120 },
        ],
      },
      {
        id: 'cd-4',
        code: 'WAT-MIN',
        name: 'Mineral Water (Aquafina / Kinley)',
        isVeg: true,
        variants: [{ unit: '1L Bottle', price: 35 }],
      },
      {
        id: 'cd-5',
        code: 'MOK-MOJ',
        name: 'Virgin Mint Mojito',
        isVeg: true,
        variants: [{ unit: 'Tall Glass', price: 190 }],
      },
      {
        id: 'cd-6',
        code: 'MOK-BLU',
        name: 'Blue Lagoon Mocktail',
        isVeg: true,
        variants: [{ unit: 'Tall Glass', price: 210 }],
      },
      {
        id: 'cd-7',
        code: 'SHK-STR',
        name: 'Fresh Strawberry Milkshake',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 180 }],
      },
      {
        id: 'cd-8',
        code: 'SHK-CHO',
        name: 'Chocolate Oreo Milkshake',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 220 }],
      },
      {
        id: 'cd-9',
        code: 'COF-ICE',
        name: 'Iced Americano / Cold Brew',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 160 }],
      },
      {
        id: 'cd-10',
        code: 'JUC-ORG',
        name: 'Fresh Seasonal Orange Juice',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 180 }],
      },
      {
        id: 'cd-11',
        code: 'JUC-WAT',
        name: 'Fresh Watermelon Juice',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 150 }],
      },
      {
        id: 'cd-12',
        code: 'LAS-SWT',
        name: 'Sweet Curd Lassi',
        isVeg: true,
        variants: [{ unit: 'Glass', price: 110 }],
      },
    ],
  },

  // 6. Alcoholic Beverages & Beers
  {
    id: 'bar-drinks',
    name: 'Bar, Beers & Spirits',
    description: 'Chilled domestic & imported beers, single malts, whiskeys, rum and cocktails',
    items: [
      {
        id: 'bar-1',
        code: 'BER-GOR',
        name: 'Gorkha Premium Beer (650ml)',
        variants: [{ unit: 'Bottle (650ml)', price: 420 }],
      },
      {
        id: 'bar-2',
        code: 'BER-TUB',
        name: 'Tuborg Green Beer (650ml)',
        variants: [{ unit: 'Bottle (650ml)', price: 440 }],
      },
      {
        id: 'bar-3',
        code: 'BER-CAR',
        name: 'Carlsberg Danish Pilsner (650ml)',
        variants: [{ unit: 'Bottle (650ml)', price: 480 }],
      },
      {
        id: 'bar-4',
        code: 'BER-BRH',
        name: 'Barahsinghe Craft Beer (650ml)',
        variants: [{ unit: 'Bottle (650ml)', price: 460 }],
      },
      {
        id: 'bar-5',
        code: 'WHI-KHU',
        name: 'Old Monk / Khukri Coronation Rum',
        variants: [
          { unit: 'Peg (30ml)', price: 140 },
          { unit: 'Double (60ml)', price: 260 },
          { unit: 'Quarter (180ml)', price: 680 },
          { unit: 'Full Bottle', price: 2200 },
        ],
      },
      {
        id: 'bar-6',
        code: 'WHI-SIG',
        name: 'Signature Premier Grain Whisky',
        variants: [
          { unit: 'Peg (30ml)', price: 180 },
          { unit: 'Double (60ml)', price: 340 },
          { unit: 'Quarter (180ml)', price: 890 },
          { unit: 'Full Bottle', price: 2900 },
        ],
      },
      {
        id: 'bar-7',
        code: 'WHI-JRW',
        name: 'Johnnie Walker Red Label',
        variants: [
          { unit: 'Peg (30ml)', price: 280 },
          { unit: 'Double (60ml)', price: 520 },
          { unit: 'Quarter (180ml)', price: 1400 },
          { unit: 'Full Bottle', price: 4800 },
        ],
      },
      {
        id: 'bar-8',
        code: 'WHI-JRB',
        name: 'Johnnie Walker Black Label (12 Yrs)',
        variants: [
          { unit: 'Peg (30ml)', price: 420 },
          { unit: 'Double (60ml)', price: 780 },
          { unit: 'Full Bottle', price: 7900 },
        ],
      },
      {
        id: 'bar-9',
        code: 'VOD-ABS',
        name: 'Absolut Swedish Vodka',
        variants: [
          { unit: 'Peg (30ml)', price: 320 },
          { unit: 'Double (60ml)', price: 600 },
          { unit: 'Full Bottle', price: 5500 },
        ],
      },
      {
        id: 'bar-10',
        code: 'WIN-RED',
        name: 'House Red Wine (Chilean Cabernet)',
        variants: [
          { unit: 'Glass (150ml)', price: 380 },
          { unit: 'Bottle (750ml)', price: 1800 },
        ],
      },
    ],
  },
];

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [dbProducts, setDbProducts] = useState<POSProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Master menu items loaded from Restaurant Setup
  const [masterMenuItems, setMasterMenuItems] = useState<any[]>([]);

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
      fetchMenuProducts();
    };

    window.addEventListener('menu_items_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('menu_items_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Build merged groups
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

    // 2. Primary Source: masterMenuItems from Restaurant Setup
    const activeMasterList =
      masterMenuItems && masterMenuItems.length > 0
        ? masterMenuItems
        : INITIAL_MASTER_ITEMS['menu-items-setup'] || [];

    activeMasterList.forEach((item: any) => {
      if (item.isActive === false) return;

      const catName = item.category || 'Special Dishes';
      const catKey = catName.toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: catName,
          description: `Dishes & beverages in ${catName}`,
          items: [],
        };
        groupMap.set(catKey, grp);
      }

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
        preparationMethod: item.preparationMethod || 'NOT_CONFIGURED',
      };

      if (existingIndex >= 0) {
        grp.items[existingIndex] = mappedItem;
      } else {
        grp.items.push(mappedItem);
      }
    });

    // 3. Fallback: If group still empty, populate from template
    MENU_GROUPS.forEach((tpl) => {
      const key = tpl.name.toLowerCase().trim();
      const existing = groupMap.get(key);
      if (existing && existing.items.length === 0) {
        existing.items = [...tpl.items];
      }
    });

    // 4. Incorporate products from database
    dbProducts.forEach((prod) => {
      const catName = prod.category || 'General Menu';
      const catKey = catName.toLowerCase().trim();
      let grp = groupMap.get(catKey);
      if (!grp) {
        grp = {
          id: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: catName,
          description: `Dishes & beverages in ${catName}`,
          items: [],
        };
        groupMap.set(catKey, grp);
      }

      const itemCode = (prod as any).code || (prod as any).sku || prod.name.slice(0, 4).toUpperCase();
      const alreadyIn = grp.items.some(
        (it) => it.id === prod.id || it.code.toLowerCase() === itemCode.toLowerCase()
      );

      if (!alreadyIn) {
        let variants: MenuVariant[] = [];
        if (prod.variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
          variants = prod.variants.map((v) => ({ unit: v.unit, price: v.price }));
        } else {
          variants = [{ unit: (prod as any).unit || 'Regular', price: prod.price || 0 }];
        }

        grp.items.push({
          id: prod.id,
          code: itemCode,
          name: prod.name,
          category: catName,
          variants,
          isVeg: prod.name.toLowerCase().includes('veg') && !prod.name.toLowerCase().includes('non-veg'),
          preparationMethod: prod.preparationMethod || 'NOT_CONFIGURED',
        });
      }
    });

    return Array.from(groupMap.values()).filter((g) => g.items.length > 0);
  }, [masterMenuItems, dbProducts]);

  // Filter groups & items
  const filteredGroups = useMemo(() => {
    let result = dynamicGroups;

    if (selectedGroupFilter !== 'all') {
      result = result.filter((g) => g.id === selectedGroupFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              it.name.toLowerCase().includes(q) ||
              it.code.toLowerCase().includes(q) ||
              (it.category && it.category.toLowerCase().includes(q))
          ),
        }))
        .filter((g) => g.items.length > 0);
    }

    return result;
  }, [dynamicGroups, selectedGroupFilter, searchQuery]);

  return (
    <div className="w-full space-y-4 pb-12 select-none font-sans text-slate-800 dark:text-slate-100">
      {/* =========================================================================
          1. HEADER: Title, Refresh & Setup Link
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Menu
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchMenuProducts}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm cursor-pointer disabled:opacity-60"
            title="Refresh menu items from database"
          >
            <RotateCcw className={cn('w-3.5 h-3.5 text-slate-500', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/restaurant-setup?sub=menu-items-setup"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-sm"
            title="Manage and configure menu items in Restaurant Setup"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Menu Setup</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. TOOLBAR: Search & Category Filter
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or code..."
              className="w-full h-8 pl-8 pr-7 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          <div className="relative sm:w-60">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full h-8 appearance-none pl-3 pr-8 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
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
          3. MENU CATEGORY TABLES (READ-ONLY, NO EDIT/DELETE, CLEAN GRID)
         ========================================================================= */}
      <div className="space-y-5">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="rounded border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-850 shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {group.name}
                </h2>
              </div>
            </div>

            {/* Table with Vertical Column Lines */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none">
                    {/* Column 1: # */}
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-700">
                      SN
                    </th>

                    {/* Column 2: CODE (Plain font-mono, no box!) */}
                    <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700 font-mono">
                      CODE
                    </th>

                    {/* Column 3: ITEM NAME */}
                    <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700">
                      ITEM NAME
                    </th>

                    {/* Column 4: PORTION / UNIT */}
                    <th className="py-2.5 px-4 w-44 border-r border-slate-200 dark:border-slate-700">
                      PORTION / UNIT
                    </th>

                    {/* Column 5: PRICE */}
                    <th className="py-2.5 px-4 w-40 text-right">
                      PRICE (NPR)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {group.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors even:bg-slate-50/30 dark:even:bg-slate-900/10"
                    >
                      {/* 1. SN */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-400 dark:text-slate-500 align-middle">
                        {index + 1}
                      </td>

                      {/* 2. CODE - Clean plain font-mono text, NO rounded outline box */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-mono text-xs font-medium text-slate-700 dark:text-slate-300 align-middle">
                        {item.code}
                      </td>

                      {/* 3. ITEM NAME */}
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="flex items-center gap-2">
                          {item.isVeg !== undefined && (
                            <span
                              className={cn(
                                'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
                                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              )}
                              title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            />
                          )}
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* 4. PORTION / UNIT */}
                      <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 align-middle">
                        <div className="flex flex-col gap-0.5 py-0.5">
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

                      {/* 5. PRICE (NPR) */}
                      <td className="py-2.5 px-4 text-right align-middle">
                        <div className="flex flex-col gap-0.5 py-0.5 items-end">
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                              >
                                Rs. {v.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
          <div className="py-16 text-center text-xs text-slate-500 bg-white dark:bg-slate-850 rounded border border-slate-200 dark:border-slate-700/60 shadow-sm">
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
    </div>
  );
}

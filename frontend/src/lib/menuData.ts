'use client';

export interface MenuItemCatalogEntry {
  id: string;
  code: string;
  name: string;
  baseName?: string;
  category: string;
  portion?: string;
  unit?: string;
  availableUnits?: { unit: string; price: number }[];
  price: number;
  description?: string;
  trackStock?: boolean;
  stock?: number;
  isAvailable?: boolean;
  department?: 'KOT' | 'BOT';
}

// Setted Available Units by group for instant multi-unit ordering
const MOMO_UNITS = [
  { unit: 'Half', price: 100 },
  { unit: 'Full', price: 180 },
];

const VEG_MOMO_UNITS = [
  { unit: 'Half', price: 80 },
  { unit: 'Full', price: 150 },
];

const BUFF_MOMO_UNITS = [
  { unit: 'Half', price: 90 },
  { unit: 'Full', price: 160 },
];

const CHK_FRIED_MOMO_UNITS = [
  { unit: 'Half', price: 120 },
  { unit: 'Full', price: 200 },
];

const VEG_FRIED_MOMO_UNITS = [
  { unit: 'Half', price: 90 },
  { unit: 'Full', price: 160 },
];

const CHK_CHILLY_MOMO_UNITS = [
  { unit: 'Half', price: 140 },
  { unit: 'Full', price: 230 },
];

const PANEER_MOMO_UNITS = [
  { unit: 'Half', price: 110 },
  { unit: 'Full', price: 190 },
];

const FRIES_UNITS = [
  { unit: 'Half', price: 90 },
  { unit: 'Full', price: 150 },
];

// Full Setted Menu Catalog (Synchronized with Our Menu and Hotel Master Setup)
const RAW_MENU_CATALOG: MenuItemCatalogEntry[] = [
  // 1. Fast Food & Momos
  {
    id: 'mi-momo-c-full',
    code: 'MOMO-C',
    name: 'Chicken Steam Momo (Full)',
    baseName: 'Chicken Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: MOMO_UNITS,
    price: 180,
  },
  {
    id: 'mi-momo-c-half',
    code: 'MOMO-C-H',
    name: 'Chicken Steam Momo (Half)',
    baseName: 'Chicken Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: MOMO_UNITS,
    price: 100,
  },
  {
    id: 'mi-momo-v-full',
    code: 'MOMO-V',
    name: 'Veg Steam Momo (Full)',
    baseName: 'Veg Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: VEG_MOMO_UNITS,
    price: 150,
  },
  {
    id: 'mi-momo-v-half',
    code: 'MOMO-V-H',
    name: 'Veg Steam Momo (Half)',
    baseName: 'Veg Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: VEG_MOMO_UNITS,
    price: 80,
  },
  {
    id: 'mi-momo-b-full',
    code: 'MOMO-B',
    name: 'Buff Steam Momo (Full)',
    baseName: 'Buff Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: BUFF_MOMO_UNITS,
    price: 160,
  },
  {
    id: 'mi-momo-b-half',
    code: 'MOMO-B-H',
    name: 'Buff Steam Momo (Half)',
    baseName: 'Buff Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: BUFF_MOMO_UNITS,
    price: 90,
  },
  {
    id: 'mi-momo-cf-full',
    code: 'MOMO-CF',
    name: 'Chicken Fried Momo (Full)',
    baseName: 'Chicken Fried Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: CHK_FRIED_MOMO_UNITS,
    price: 200,
  },
  {
    id: 'mi-momo-cf-half',
    code: 'MOMO-CF-H',
    name: 'Chicken Fried Momo (Half)',
    baseName: 'Chicken Fried Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: CHK_FRIED_MOMO_UNITS,
    price: 120,
  },
  {
    id: 'mi-momo-vf-full',
    code: 'MOMO-VF',
    name: 'Veg Fried Momo (Full)',
    baseName: 'Veg Fried Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: VEG_FRIED_MOMO_UNITS,
    price: 160,
  },
  {
    id: 'mi-momo-vf-half',
    code: 'MOMO-VF-H',
    name: 'Veg Fried Momo (Half)',
    baseName: 'Veg Fried Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: VEG_FRIED_MOMO_UNITS,
    price: 90,
  },
  {
    id: 'mi-momo-chl-full',
    code: 'MOMO-CHL',
    name: 'Chicken Chilly C-Momo (Full)',
    baseName: 'Chicken Chilly C-Momo',
    category: 'Fast Food & Momos',
    portion: 'Full Portion',
    unit: 'Full',
    availableUnits: CHK_CHILLY_MOMO_UNITS,
    price: 230,
  },
  {
    id: 'mi-momo-chl-half',
    code: 'MOMO-CHL-H',
    name: 'Chicken Chilly C-Momo (Half)',
    baseName: 'Chicken Chilly C-Momo',
    category: 'Fast Food & Momos',
    portion: 'Half Portion',
    unit: 'Half',
    availableUnits: CHK_CHILLY_MOMO_UNITS,
    price: 140,
  },
  {
    id: 'mi-momo-pan-full',
    code: 'MOMO-PAN',
    name: 'Paneer Steam Momo (Full)',
    baseName: 'Paneer Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Full (10 Pcs)',
    unit: 'Full',
    availableUnits: PANEER_MOMO_UNITS,
    price: 190,
  },
  {
    id: 'mi-momo-pan-half',
    code: 'MOMO-PAN-H',
    name: 'Paneer Steam Momo (Half)',
    baseName: 'Paneer Steam Momo',
    category: 'Fast Food & Momos',
    portion: 'Half (5 Pcs)',
    unit: 'Half',
    availableUnits: PANEER_MOMO_UNITS,
    price: 110,
  },
  {
    id: 'mi-fry-full',
    code: 'FRY-01',
    name: 'Crispy French Fries (Full)',
    baseName: 'Crispy French Fries',
    category: 'Fast Food & Momos',
    portion: 'Large Basket',
    unit: 'Full',
    availableUnits: FRIES_UNITS,
    price: 150,
  },
  {
    id: 'mi-fry-half',
    code: 'FRY-01-H',
    name: 'Crispy French Fries (Half)',
    baseName: 'Crispy French Fries',
    category: 'Fast Food & Momos',
    portion: 'Regular Portion',
    unit: 'Half',
    availableUnits: FRIES_UNITS,
    price: 90,
  },
  {
    id: 'mi-bgr-01',
    code: 'BGR-01',
    name: 'Classic Chicken Burger',
    baseName: 'Classic Chicken Burger',
    category: 'Fast Food & Momos',
    portion: 'Regular',
    unit: 'Regular',
    availableUnits: [{ unit: 'Regular', price: 250 }],
    price: 250,
  },

  // 2. Main Course & Curries
  {
    id: 'mi-pbm-full',
    code: 'PBM-01',
    name: 'Paneer Butter Masala (Full)',
    baseName: 'Paneer Butter Masala',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 240 },
      { unit: 'Full', price: 420 },
    ],
    price: 420,
  },
  {
    id: 'mi-pbm-half',
    code: 'PBM-01-H',
    name: 'Paneer Butter Masala (Half)',
    baseName: 'Paneer Butter Masala',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 240 },
      { unit: 'Full', price: 420 },
    ],
    price: 240,
  },
  {
    id: 'mi-ctm-full',
    code: 'CTM-01',
    name: 'Chicken Tikka Masala (Full)',
    baseName: 'Chicken Tikka Masala',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 280 },
      { unit: 'Full', price: 490 },
    ],
    price: 490,
  },
  {
    id: 'mi-ctm-half',
    code: 'CTM-01-H',
    name: 'Chicken Tikka Masala (Half)',
    baseName: 'Chicken Tikka Masala',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 280 },
      { unit: 'Full', price: 490 },
    ],
    price: 280,
  },
  {
    id: 'mi-dal-full',
    code: 'DAL-MKH',
    name: 'Dal Makhani Handi (Full)',
    baseName: 'Dal Makhani Handi',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 190 },
      { unit: 'Full', price: 320 },
    ],
    price: 320,
  },
  {
    id: 'mi-dal-half',
    code: 'DAL-MKH-H',
    name: 'Dal Makhani Handi (Half)',
    baseName: 'Dal Makhani Handi',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 190 },
      { unit: 'Full', price: 320 },
    ],
    price: 190,
  },
  {
    id: 'mi-chk-kad-full',
    code: 'CHK-KAD',
    name: 'Chicken Kadai Peshawari (Full)',
    baseName: 'Chicken Kadai Peshawari',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 290 },
      { unit: 'Full', price: 510 },
    ],
    price: 510,
  },
  {
    id: 'mi-chk-kad-half',
    code: 'CHK-KAD-H',
    name: 'Chicken Kadai Peshawari (Half)',
    baseName: 'Chicken Kadai Peshawari',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 290 },
      { unit: 'Full', price: 510 },
    ],
    price: 290,
  },
  {
    id: 'mi-mut-rog-full',
    code: 'MUT-ROG',
    name: 'Mutton Rogan Josh Handi (Full)',
    baseName: 'Mutton Rogan Josh Handi',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 340 },
      { unit: 'Full', price: 580 },
    ],
    price: 580,
  },
  {
    id: 'mi-mut-rog-half',
    code: 'MUT-ROG-H',
    name: 'Mutton Rogan Josh Handi (Half)',
    baseName: 'Mutton Rogan Josh Handi',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 340 },
      { unit: 'Full', price: 580 },
    ],
    price: 340,
  },
  {
    id: 'mi-mix-veg-full',
    code: 'MIX-VEG',
    name: 'Seasonal Mixed Veg Curry (Full)',
    baseName: 'Seasonal Mixed Veg Curry',
    category: 'Main Course & Curries',
    portion: 'Full Handi',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 170 },
      { unit: 'Full', price: 290 },
    ],
    price: 290,
  },
  {
    id: 'mi-mix-veg-half',
    code: 'MIX-VEG-H',
    name: 'Seasonal Mixed Veg Curry (Half)',
    baseName: 'Seasonal Mixed Veg Curry',
    category: 'Main Course & Curries',
    portion: 'Half Handi',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 170 },
      { unit: 'Full', price: 290 },
    ],
    price: 170,
  },
  {
    id: 'mi-bry-chk-full',
    code: 'BRY-CHK',
    name: 'Hyderabadi Dum Chicken Biryani (Full)',
    baseName: 'Hyderabadi Dum Chicken Biryani',
    category: 'Main Course & Curries',
    portion: 'Full Pot',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 280 },
      { unit: 'Full', price: 480 },
    ],
    price: 480,
  },
  {
    id: 'mi-bry-chk-half',
    code: 'BRY-CHK-H',
    name: 'Hyderabadi Dum Chicken Biryani (Half)',
    baseName: 'Hyderabadi Dum Chicken Biryani',
    category: 'Main Course & Curries',
    portion: 'Half Pot',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 280 },
      { unit: 'Full', price: 480 },
    ],
    price: 280,
  },
  {
    id: 'mi-rice-pl-full',
    code: 'RICE-PL',
    name: 'Kashmiri Saffron Veg Pulao (Full)',
    baseName: 'Kashmiri Saffron Veg Pulao',
    category: 'Main Course & Curries',
    portion: 'Full Plate',
    unit: 'Full',
    availableUnits: [
      { unit: 'Half', price: 160 },
      { unit: 'Full', price: 260 },
    ],
    price: 260,
  },
  {
    id: 'mi-rice-pl-half',
    code: 'RICE-PL-H',
    name: 'Kashmiri Saffron Veg Pulao (Half)',
    baseName: 'Kashmiri Saffron Veg Pulao',
    category: 'Main Course & Curries',
    portion: 'Half Plate',
    unit: 'Half',
    availableUnits: [
      { unit: 'Half', price: 160 },
      { unit: 'Full', price: 260 },
    ],
    price: 160,
  },

  // 3. Tea & Coffee
  {
    id: 'mi-tea-msl-med',
    code: 'TEA-MSL',
    name: 'Special Masala Milk Tea (Medium)',
    baseName: 'Special Masala Milk Tea',
    category: 'Tea & Coffee',
    portion: 'Cup (Medium)',
    unit: 'Medium',
    availableUnits: [
      { unit: 'Small', price: 40 },
      { unit: 'Medium', price: 70 },
      { unit: 'Large', price: 120 },
    ],
    price: 70,
  },
  {
    id: 'mi-tea-msl-lrg',
    code: 'TEA-MSL-L',
    name: 'Special Masala Milk Tea (Large)',
    baseName: 'Special Masala Milk Tea',
    category: 'Tea & Coffee',
    portion: 'Pot (Large)',
    unit: 'Large',
    availableUnits: [
      { unit: 'Small', price: 40 },
      { unit: 'Medium', price: 70 },
      { unit: 'Large', price: 120 },
    ],
    price: 120,
  },
  {
    id: 'mi-cof-fr-med',
    code: 'COF-FR',
    name: 'Fresh Brewed Coffee (Medium)',
    baseName: 'Fresh Brewed Coffee',
    category: 'Tea & Coffee',
    portion: 'Cup (Medium)',
    unit: 'Medium',
    availableUnits: [
      { unit: 'Small', price: 80 },
      { unit: 'Medium', price: 120 },
      { unit: 'Large', price: 160 },
    ],
    price: 120,
  },
  {
    id: 'mi-cof-fr-lrg',
    code: 'COF-FR-L',
    name: 'Fresh Brewed Coffee (Large)',
    baseName: 'Fresh Brewed Coffee',
    category: 'Tea & Coffee',
    portion: 'Mug (Large)',
    unit: 'Large',
    availableUnits: [
      { unit: 'Small', price: 80 },
      { unit: 'Medium', price: 120 },
      { unit: 'Large', price: 160 },
    ],
    price: 160,
  },
  {
    id: 'mi-cof-lat-med',
    code: 'COF-LAT',
    name: 'Café Latte / Cappuccino (Medium)',
    baseName: 'Café Latte / Cappuccino',
    category: 'Tea & Coffee',
    portion: 'Cup (Medium)',
    unit: 'Medium',
    availableUnits: [
      { unit: 'Small', price: 110 },
      { unit: 'Medium', price: 150 },
      { unit: 'Large', price: 190 },
    ],
    price: 150,
  },
  {
    id: 'mi-cof-lat-lrg',
    code: 'COF-LAT-L',
    name: 'Café Latte / Cappuccino (Large)',
    baseName: 'Café Latte / Cappuccino',
    category: 'Tea & Coffee',
    portion: 'Mug (Large)',
    unit: 'Large',
    availableUnits: [
      { unit: 'Small', price: 110 },
      { unit: 'Medium', price: 150 },
      { unit: 'Large', price: 190 },
    ],
    price: 190,
  },
  {
    id: 'mi-tea-lem',
    code: 'TEA-LEM',
    name: 'Hot Lemon Honey Ginger',
    baseName: 'Hot Lemon Honey Ginger',
    category: 'Tea & Coffee',
    portion: 'Cup (Medium)',
    unit: 'Medium',
    availableUnits: [
      { unit: 'Small', price: 60 },
      { unit: 'Medium', price: 90 },
    ],
    price: 90,
  },
  {
    id: 'mi-tea-grn',
    code: 'TEA-GRN',
    name: 'Himalayan Organic Green Tea',
    baseName: 'Himalayan Organic Green Tea',
    category: 'Tea & Coffee',
    portion: 'Cup (Medium)',
    unit: 'Medium',
    availableUnits: [
      { unit: 'Small', price: 50 },
      { unit: 'Medium', price: 80 },
    ],
    price: 80,
  },

  // 4. Cold Drinks & Mocktails
  {
    id: 'mi-bev-spr-var',
    code: 'BEV-SPR',
    name: 'Sprite',
    baseName: 'Sprite',
    category: 'Cold Drinks & Mocktails',
    portion: 'Multiple Sizes',
    unit: 'Glass',
    availableUnits: [
      { unit: 'Glass', price: 150 },
      { unit: 'Can', price: 100 },
      { unit: '500ml Bottle', price: 180 },
      { unit: '1.5L Bottle', price: 320 },
    ],
    price: 150,
  },
  {
    id: 'mi-mok-moj-gls',
    code: 'MOK-MOJ',
    name: 'Virgin Mint Mojito (Glass)',
    baseName: 'Virgin Mint Mojito',
    category: 'Cold Drinks & Mocktails',
    portion: 'Glass',
    unit: 'Glass',
    availableUnits: [
      { unit: 'Glass', price: 180 },
      { unit: 'Pitcher', price: 550 },
    ],
    price: 180,
  },
  {
    id: 'mi-mok-moj-pit',
    code: 'MOK-MOJ-P',
    name: 'Virgin Mint Mojito (Pitcher)',
    baseName: 'Virgin Mint Mojito',
    category: 'Cold Drinks & Mocktails',
    portion: 'Pitcher (1 Litre)',
    unit: 'Pitcher',
    availableUnits: [
      { unit: 'Glass', price: 180 },
      { unit: 'Pitcher', price: 550 },
    ],
    price: 550,
  },
  {
    id: 'mi-lime-gls',
    code: 'LIME-01',
    name: 'Fresh Lime Soda (Glass)',
    baseName: 'Fresh Lime Soda',
    category: 'Cold Drinks & Mocktails',
    portion: 'Glass',
    unit: 'Glass',
    availableUnits: [
      { unit: 'Glass', price: 90 },
      { unit: 'Pitcher', price: 280 },
    ],
    price: 90,
  },
  {
    id: 'mi-lime-pit',
    code: 'LIME-01-P',
    name: 'Fresh Lime Soda (Pitcher)',
    baseName: 'Fresh Lime Soda',
    category: 'Cold Drinks & Mocktails',
    portion: 'Pitcher (1 Litre)',
    unit: 'Pitcher',
    availableUnits: [
      { unit: 'Glass', price: 90 },
      { unit: 'Pitcher', price: 280 },
    ],
    price: 280,
  },
  {
    id: 'mi-las-mng-gls',
    code: 'LAS-MNG',
    name: 'Sweet Mango Lassi (Glass)',
    baseName: 'Sweet Mango Lassi',
    category: 'Cold Drinks & Mocktails',
    portion: 'Tall Glass',
    unit: 'Glass',
    availableUnits: [
      { unit: 'Glass', price: 140 },
      { unit: 'Pitcher', price: 420 },
    ],
    price: 140,
  },
  {
    id: 'mi-las-mng-pit',
    code: 'LAS-MNG-P',
    name: 'Sweet Mango Lassi (Pitcher)',
    baseName: 'Sweet Mango Lassi',
    category: 'Cold Drinks & Mocktails',
    portion: 'Pitcher',
    unit: 'Pitcher',
    availableUnits: [
      { unit: 'Glass', price: 140 },
      { unit: 'Pitcher', price: 420 },
    ],
    price: 420,
  },
  {
    id: 'mi-mok-blu-gls',
    code: 'MOK-BLU',
    name: 'Blue Lagoon Citrus Cooler (Glass)',
    baseName: 'Blue Lagoon Citrus Cooler',
    category: 'Cold Drinks & Mocktails',
    portion: 'Glass',
    unit: 'Glass',
    availableUnits: [
      { unit: 'Glass', price: 190 },
      { unit: 'Pitcher', price: 580 },
    ],
    price: 190,
  },
  {
    id: 'mi-mok-blu-pit',
    code: 'MOK-BLU-P',
    name: 'Blue Lagoon Citrus Cooler (Pitcher)',
    baseName: 'Blue Lagoon Citrus Cooler',
    category: 'Cold Drinks & Mocktails',
    portion: 'Pitcher',
    unit: 'Pitcher',
    availableUnits: [
      { unit: 'Glass', price: 190 },
      { unit: 'Pitcher', price: 580 },
    ],
    price: 580,
  },
  {
    id: 'mi-cof-cld',
    code: 'COF-CLD',
    name: 'Cold Coffee with Ice Cream Float',
    baseName: 'Cold Coffee with Ice Cream Float',
    category: 'Cold Drinks & Mocktails',
    portion: 'Tall Glass',
    unit: 'Glass',
    availableUnits: [{ unit: 'Glass', price: 170 }],
    price: 170,
  },

  // 5. Tandoori Breads & Naan
  {
    id: 'mi-rot-pln',
    code: 'ROT-PLN',
    name: 'Plain Tandoori Roti (Single)',
    baseName: 'Plain Tandoori Roti',
    category: 'Tandoori Breads & Naan',
    portion: 'Single (1 Pc)',
    unit: 'Single (1 Pc)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 30 },
      { unit: 'Basket (4 Pcs)', price: 110 },
    ],
    price: 30,
  },
  {
    id: 'mi-rot-btr',
    code: 'ROT-BTR',
    name: 'Butter Tandoori Roti (Single)',
    baseName: 'Butter Tandoori Roti',
    category: 'Tandoori Breads & Naan',
    portion: 'Single (1 Pc)',
    unit: 'Single (1 Pc)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 40 },
      { unit: 'Basket (4 Pcs)', price: 150 },
    ],
    price: 40,
  },
  {
    id: 'mi-nan-pln',
    code: 'NAN-PLN',
    name: 'Plain Tandoori Naan (Single)',
    baseName: 'Plain Tandoori Naan',
    category: 'Tandoori Breads & Naan',
    portion: 'Single (1 Pc)',
    unit: 'Single (1 Pc)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 55 },
      { unit: 'Basket (4 Pcs)', price: 200 },
    ],
    price: 55,
  },
  {
    id: 'mi-nan-btr',
    code: 'NAN-BTR',
    name: 'Butter Naan (Single)',
    baseName: 'Butter Naan',
    category: 'Tandoori Breads & Naan',
    portion: 'Single (1 Pc)',
    unit: 'Single (1 Pc)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 70 },
      { unit: 'Basket (4 Pcs)', price: 260 },
    ],
    price: 70,
  },
  {
    id: 'mi-nan-gar',
    code: 'NAN-GAR',
    name: 'Garlic Butter Naan (Single)',
    baseName: 'Garlic Butter Naan',
    category: 'Tandoori Breads & Naan',
    portion: 'Single (1 Pc)',
    unit: 'Single (1 Pc)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 90 },
      { unit: 'Basket (4 Pcs)', price: 320 },
    ],
    price: 90,
  },
  {
    id: 'mi-nan-bsk',
    code: 'NAN-BSK',
    name: 'Assorted Naan Basket (4 Pcs)',
    baseName: 'Assorted Naan Basket',
    category: 'Tandoori Breads & Naan',
    portion: 'Basket (4 Pcs)',
    unit: 'Basket (4 Pcs)',
    availableUnits: [{ unit: 'Basket (4 Pcs)', price: 260 }],
    price: 260,
  },

  // 6. Desserts & Sweets
  {
    id: 'mi-des-gj-sgl',
    code: 'GJ-01',
    name: 'Hot Gulab Jamun (Plate 2 Pcs)',
    baseName: 'Hot Gulab Jamun with Pistachio',
    category: 'Desserts & Sweets',
    portion: 'Plate (2 Pcs)',
    unit: 'Plate (2 Pcs)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 70 },
      { unit: 'Plate (2 Pcs)', price: 130 },
    ],
    price: 130,
  },
  {
    id: 'mi-des-ras-sgl',
    code: 'RAS-01',
    name: 'Bengali Spongy Rasgulla (Plate 2 Pcs)',
    baseName: 'Bengali Spongy Rasgulla',
    category: 'Desserts & Sweets',
    portion: 'Plate (2 Pcs)',
    unit: 'Plate (2 Pcs)',
    availableUnits: [
      { unit: 'Single (1 Pc)', price: 60 },
      { unit: 'Plate (2 Pcs)', price: 110 },
    ],
    price: 110,
  },
  {
    id: 'mi-des-ice-van',
    code: 'ICE-VAN',
    name: 'Vanilla / Chocolate Ice Cream Scoop',
    baseName: 'Vanilla / Chocolate Ice Cream Scoop',
    category: 'Desserts & Sweets',
    portion: 'Double Scoop',
    unit: 'Double Scoop',
    availableUnits: [
      { unit: 'Single Scoop', price: 80 },
      { unit: 'Double Scoop', price: 150 },
    ],
    price: 150,
  },
  {
    id: 'mi-des-brw',
    code: 'BRW-ICE',
    name: 'Sizzling Hot Brownie with Ice Cream',
    baseName: 'Sizzling Hot Brownie with Ice Cream',
    category: 'Desserts & Sweets',
    portion: 'Sizzler Plate',
    unit: 'Plate',
    availableUnits: [{ unit: 'Plate', price: 240 }],
    price: 240,
  },

  // 7. Pizzas & Continental
  {
    id: 'mi-piz-mar',
    code: 'PIZ-MAR',
    name: 'Margherita Pizza 12"',
    baseName: 'Margherita Pizza',
    category: 'Pizzas & Continental',
    portion: '12 Inch Large',
    unit: '12 Inch Large',
    availableUnits: [
      { unit: 'Regular 8"', price: 380 },
      { unit: 'Medium 10"', price: 480 },
      { unit: '12 Inch Large', price: 580 },
    ],
    price: 580,
  },
];

/**
 * Consolidates menu items so that variant-specific items (like "Chicken Steam Momo (Full)" and "Chicken Steam Momo (Half)",
 * or "sprite (Bottle (750ml))" and "sprite") are merged into a single clean base item.
 * The resulting item contains all variants in availableUnits for table-row size selection.
 */
export function consolidateMenuCatalog(catalog: MenuItemCatalogEntry[]): MenuItemCatalogEntry[] {
  const map = new Map<string, MenuItemCatalogEntry>();

  for (const item of catalog) {
    if (!item || !item.name) continue;
    const rawName = item.name.trim();

    // Strip out all parenthetical portions to get clean canonical base name:
    // e.g. "Chicken Steam Momo (Full)" -> "Chicken Steam Momo"
    // e.g. "sprite (Bottle (750ml))" -> "Sprite"
    // e.g. "Fresh Brewed Coffee (Large)" -> "Fresh Brewed Coffee"
    let cleanBase = (
      item.baseName ||
      rawName
        .replace(/\s*\([^)]*(?:\([^)]*\))*[^)]*\)$/g, '')
        .replace(/\s*\([^)]*\)$/g, '')
    ).trim();

    // Standardize capitalization (e.g. "sprite" -> "Sprite")
    if (cleanBase.length > 0) {
      cleanBase = cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1);
    }

    const key = cleanBase.toLowerCase();

    // Extract unit & price from item
    let extractedUnit = item.unit || '';
    const parenMatch = rawName.match(/\((.+)\)$/);
    if (!extractedUnit && parenMatch) {
      extractedUnit = parenMatch[1].trim();
    }
    if (!extractedUnit) {
      extractedUnit = item.portion || 'Regular';
    }

    const itemUnits: { unit: string; price: number }[] = [];
    if (Array.isArray(item.availableUnits) && item.availableUnits.length > 0) {
      itemUnits.push(...item.availableUnits);
    } else if (item.price !== undefined) {
      itemUnits.push({ unit: extractedUnit, price: item.price });
    }

    const itemDept: 'KOT' | 'BOT' =
      item.department || (isBeverageCategory(item.category, cleanBase) ? 'BOT' : 'KOT');

    if (!map.has(key)) {
      const isMulti = itemUnits.length > 1;
      map.set(key, {
        ...item,
        id: item.id,
        code: item.code,
        name: cleanBase,
        baseName: cleanBase,
        category: item.category,
        department: itemDept,
        availableUnits: itemUnits,
        unit: isMulti ? '' : (itemUnits[0]?.unit || 'Regular'),
        price: itemUnits[0]?.price || item.price,
        portion: isMulti ? `${itemUnits.length} Sizes` : (item.portion || itemUnits[0]?.unit || '1'),
      });
    } else {
      const existing = map.get(key)!;
      // Merge unique units
      const mergedUnits = [...(existing.availableUnits || [])];
      for (const u of itemUnits) {
        const found = mergedUnits.find((eu) => eu.unit.toLowerCase() === u.unit.toLowerCase());
        if (!found) {
          mergedUnits.push(u);
        } else if (found.price === 0 && u.price > 0) {
          found.price = u.price;
        }
      }
      const isMulti = mergedUnits.length > 1;
      map.set(key, {
        ...existing,
        name: cleanBase,
        baseName: cleanBase,
        department: existing.department || itemDept,
        availableUnits: mergedUnits,
        unit: isMulti ? '' : (mergedUnits[0]?.unit || 'Regular'),
        price: (mergedUnits.length > 0 && Math.min(...mergedUnits.map((u) => u.price)) > 0)
          ? Math.min(...mergedUnits.map((u) => u.price))
          : existing.price,
        portion: isMulti ? `${mergedUnits.length} Sizes` : existing.portion,
        trackStock: existing.trackStock || item.trackStock,
        stock: existing.stock !== undefined ? existing.stock : item.stock,
      });
    }
  }

  return Array.from(map.values());
}

// Setted Menu Catalog (Clean, consolidated single-entry items with variant sizes)
export const DEFAULT_MENU_CATALOG: MenuItemCatalogEntry[] = consolidateMenuCatalog(RAW_MENU_CATALOG);

export const MENU_CATEGORIES = [
  'All',
  'Fast Food & Momos',
  'Main Course & Curries',
  'Tea & Coffee',
  'Cold Drinks & Mocktails',
  'Tandoori Breads & Naan',
  'Desserts & Sweets',
  'Pizzas & Continental',
] as const;

/**
 * Fetch all setted menu items dynamically.
 * Combines localStorage custom menu items (from Hotel Setup / Menu Masters)
 * with the full settled menu catalog.
 */
export function getSettedMenuItems(): MenuItemCatalogEntry[] {
  if (typeof window === 'undefined') {
    return DEFAULT_MENU_CATALOG;
  }

  try {
    const stored = localStorage.getItem('hotel_menu_items');
    if (!stored) {
      return DEFAULT_MENU_CATALOG;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_MENU_CATALOG;
    }

    // Unroll any custom master items that have quantity pricing tiers
    const customEntries: MenuItemCatalogEntry[] = [];
    parsed.forEach((item: any) => {
      if (!item.isActive && item.isActive !== undefined) return;

      const categoryName = item.category || 'General Menu';
      const baseName = item.name || 'Unnamed Dish';
      const itemCode = item.code || 'ITEM';

      if (Array.isArray(item.quantityPrices) && item.quantityPrices.length > 0) {
        const itemTiers = item.quantityPrices
          .filter((t: any) => t.price !== undefined && t.price !== null)
          .map((t: any) => ({
            unit: t.quantityName || 'Standard',
            price: Number(t.price) || 0,
          }));

        customEntries.push({
          id: item.id || `custom-${itemCode}`,
          code: itemCode,
          name: baseName,
          baseName,
          category: categoryName,
          portion: itemTiers.length > 1 ? `${itemTiers.length} Sizes` : (itemTiers[0]?.unit || 'Standard'),
          unit: itemTiers.length > 1 ? '' : (itemTiers[0]?.unit || 'Standard'),
          availableUnits: itemTiers,
          price: itemTiers[0]?.price || 0,
          description: item.description,
          trackStock: Boolean(item.trackStock),
          stock: item.stock !== undefined ? Number(item.stock) : undefined,
          isAvailable: item.isAvailable ?? true,
        });
      } else {
        customEntries.push({
          id: item.id || `custom-${itemCode}`,
          code: itemCode,
          name: baseName,
          baseName,
          category: categoryName,
          unit: 'Standard',
          availableUnits: [{ unit: 'Standard', price: Number(item.basePrice) || 0 }],
          price: Number(item.basePrice) || 0,
          description: item.description,
          trackStock: Boolean(item.trackStock),
          stock: item.stock !== undefined ? Number(item.stock) : undefined,
          isAvailable: item.isAvailable ?? true,
        });
      }
    });

    // Also load any custom menu items from Menu page
    try {
      const storedCustom = localStorage.getItem('custom_menu_items');
      if (storedCustom) {
        const parsedCustom = JSON.parse(storedCustom);
        if (Array.isArray(parsedCustom)) {
          parsedCustom.forEach((cItem: any) => {
            const baseName = cItem.name || 'Unnamed Dish';
            const itemCode = cItem.code || 'ITEM';
            const categoryName = cItem.category || 'General Menu';
            const variants = Array.isArray(cItem.variants) && cItem.variants.length > 0
              ? cItem.variants
              : (cItem.prices ? Object.entries(cItem.prices).map(([unit, price]) => ({ unit, price: Number(price) || 0 })) : []);

            if (variants.length > 0) {
              customEntries.push({
                id: cItem.id || `custom-${itemCode}`,
                code: itemCode,
                name: baseName,
                baseName,
                category: categoryName,
                unit: variants.length === 1 ? variants[0].unit : '',
                availableUnits: variants,
                price: variants[0]?.price || 0,
                trackStock: false,
                isAvailable: true,
              });
            }
          });
        }
      }
    } catch {}

    if (customEntries.length === 0) {
      return consolidateMenuCatalog(DEFAULT_MENU_CATALOG);
    }

    // Merge: custom entries first, then any default entries whose code isn't overridden
    const customCodes = new Set(customEntries.map((c) => c.code.toLowerCase()));
    const remainingDefaults = DEFAULT_MENU_CATALOG.filter(
      (d) => !customCodes.has(d.code.toLowerCase())
    );

    return consolidateMenuCatalog([...customEntries, ...remainingDefaults]);
  } catch {
    return consolidateMenuCatalog(DEFAULT_MENU_CATALOG);
  }
}

/**
 * Helper to resolve item unit metadata (baseName, currentUnit, and all setted available units with prices)
 */
export function resolveItemUnitInfo(
  item: {
    name: string;
    price: number;
    unit?: string;
    baseName?: string;
    availableUnits?: { unit: string; price: number }[];
    department?: 'KOT' | 'BOT';
    category?: string;
  },
  catalog?: MenuItemCatalogEntry[]
): {
  baseName: string;
  unit: string;
  availableUnits: { unit: string; price: number }[];
  department?: 'KOT' | 'BOT';
} {
  const menuList = catalog || getSettedMenuItems();
  const rawName = item.name.trim();
  const lowerName = rawName.toLowerCase();
  const baseFromParenthesis = rawName.replace(/\s*\([^)]*(?:\([^)]*\))*[^)]*\)$/g, '').replace(/\s*\([^)]*\)$/g, '').trim();

  // If item already has availableUnits array populated, use it directly
  if (item.availableUnits && item.availableUnits.length > 0) {
    let currentUnit = item.unit || '';
    if (!currentUnit && item.price > 0) {
      const priceMatched = item.availableUnits.find((u) => Math.abs(u.price - item.price) < 0.01);
      if (priceMatched) currentUnit = priceMatched.unit;
    }
    if (!currentUnit && item.availableUnits.length === 1) {
      currentUnit = item.availableUnits[0].unit;
    }
    const cleanBase = item.baseName || baseFromParenthesis;
    const dept: 'KOT' | 'BOT' = item.department || (isBeverageCategory(item.category, cleanBase) ? 'BOT' : 'KOT');
    return {
      baseName: cleanBase,
      unit: currentUnit,
      availableUnits: item.availableUnits,
      department: dept,
    };
  }

  // 1. Direct match by exact name or baseName
  const match = menuList.find(
    (m) =>
      m.name.toLowerCase() === lowerName ||
      (m.baseName && m.baseName.toLowerCase() === baseFromParenthesis.toLowerCase()) ||
      (m.baseName && m.baseName.toLowerCase() === lowerName) ||
      m.name.toLowerCase() === baseFromParenthesis.toLowerCase()
  );

  if (match && match.availableUnits && match.availableUnits.length > 0) {
    const cleanBase = match.baseName || baseFromParenthesis;
    let currentUnit = item.unit || '';
    if (!currentUnit && item.price > 0) {
      const priceMatched = match.availableUnits.find((u) => Math.abs(u.price - item.price) < 0.01);
      if (priceMatched) currentUnit = priceMatched.unit;
    }
    if (!currentUnit) {
      if (lowerName.includes('half')) currentUnit = 'Half';
      else if (lowerName.includes('full')) currentUnit = 'Full';
      else if (lowerName.includes('small')) currentUnit = 'Small';
      else if (lowerName.includes('medium')) currentUnit = 'Medium';
      else if (lowerName.includes('large')) currentUnit = 'Large';
      else if (lowerName.includes('glass')) currentUnit = 'Glass';
      else if (lowerName.includes('pitcher')) currentUnit = 'Pitcher';
      else if (lowerName.includes('can')) currentUnit = 'Can';
      else if (lowerName.includes('500ml')) currentUnit = '500ml Bottle';
      else if (lowerName.includes('750ml')) currentUnit = 'Bottle (750ml)';
      else if (match.availableUnits.length === 1) currentUnit = match.availableUnits[0].unit;
      else if (item.price > 0) currentUnit = match.availableUnits[0].unit;
    }
    if (currentUnit && !match.availableUnits.some((u) => u.unit.toLowerCase() === currentUnit.toLowerCase())) {
      const matchByName = match.availableUnits.find((u) => u.unit.toLowerCase() === currentUnit.toLowerCase());
      if (matchByName) {
        currentUnit = matchByName.unit;
      }
    }

    const dept: 'KOT' | 'BOT' = match.department || (isBeverageCategory(match.category || (item as any).category, cleanBase) ? 'BOT' : 'KOT');
    return {
      baseName: cleanBase,
      unit: currentUnit,
      availableUnits: match.availableUnits,
      department: dept,
    };
  }

  // 2. Partial match (e.g. "Chicken Steam Momo" inside "Chicken Steam Momo (Full)")
  const partial = menuList.find((m) => {
    const mBase = (m.baseName || m.name.replace(/\s*\([^)]*\)$/, '')).toLowerCase();
    return lowerName.includes(mBase) || mBase.includes(baseFromParenthesis.toLowerCase());
  });

  if (partial && partial.availableUnits && partial.availableUnits.length > 0) {
    const cleanBase = partial.baseName || baseFromParenthesis;
    let currentUnit = item.unit || '';
    if (!currentUnit && item.price > 0) {
      const priceMatched = partial.availableUnits.find((u) => Math.abs(u.price - item.price) < 0.01);
      if (priceMatched) currentUnit = priceMatched.unit;
    }
    if (!currentUnit) {
      if (lowerName.includes('half')) currentUnit = 'Half';
      else if (lowerName.includes('full')) currentUnit = 'Full';
      else if (partial.availableUnits.length === 1) currentUnit = partial.availableUnits[0].unit;
      else if (item.price > 0) currentUnit = partial.availableUnits[0].unit;
    }

    const dept: 'KOT' | 'BOT' = partial.department || (isBeverageCategory(partial.category || (item as any).category, cleanBase) ? 'BOT' : 'KOT');
    return {
      baseName: cleanBase,
      unit: currentUnit,
      availableUnits: partial.availableUnits,
      department: dept,
    };
  }

  // 3. Fallback for custom items without predefined tiers
  const fallbackUnit = item.unit || (lowerName.includes('half') ? 'Half' : 'Full');
  const fallbackDept: 'KOT' | 'BOT' = (item as any).department || (isBeverageCategory((item as any).category, item.baseName || baseFromParenthesis) ? 'BOT' : 'KOT');
  return {
    baseName: item.baseName || baseFromParenthesis,
    unit: fallbackUnit,
    availableUnits: item.availableUnits && item.availableUnits.length > 0
      ? item.availableUnits
      : [{ unit: fallbackUnit, price: item.price }],
    department: fallbackDept,
  };
}

/**
 * Checks whether an item or category belongs to Bar/Beverage (BOT) or Kitchen (KOT).
 */
export function isBeverageCategory(category?: string, name?: string): boolean {
  if (!category && !name) return false;
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  return (
    c.includes('drink') ||
    c.includes('mocktail') ||
    c.includes('cocktail') ||
    c.includes('beverage') ||
    c.includes('bar') ||
    c.includes('wine') ||
    c.includes('beer') ||
    c.includes('liquor') ||
    c.includes('coffee') ||
    c.includes('tea') ||
    c.includes('juice') ||
    c.includes('cold drink') ||
    n.includes('sprite') ||
    n.includes('coke') ||
    n.includes('coca-cola') ||
    n.includes('fanta') ||
    n.includes('pepsi') ||
    n.includes('mojito') ||
    n.includes('lemonade')
  );
}

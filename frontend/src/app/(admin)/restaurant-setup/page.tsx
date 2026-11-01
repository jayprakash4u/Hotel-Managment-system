'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Layers,
  Armchair,
  Building2,
  Scale,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  AlertCircle,
  Hash,
  DollarSign,
  Coffee,
  Users,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { getMasterItems, saveMasterItems, SimpleMasterItem, MASTERS_UPDATED_EVENT } from '@/lib/mastersData';
import { QuantityAutocomplete } from '@/components/common/QuantityAutocomplete';

// Types for the 5 Restaurant Setup Modules
export interface FoodCategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  isActive: boolean;
}

export interface ProductPortionPrice {
  id: string;
  unitName: string;
  price: number;
  isDefault?: boolean;
}

export interface RestaurantProductItem {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  portions: ProductPortionPrice[];
  isVeg: boolean;
  trackStock: boolean;
  stock?: number;
  description?: string;
  isActive: boolean;
}

export interface RestaurantTableItem {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'CLEANING';
  notes?: string;
  isActive: boolean;
}

export interface TableCategorySection {
  id: string;
  code: string;
  name: string;
  floorZone: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface MeasurementUnitItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
  isDefault?: boolean;
  isActive: boolean;
}

// Initial Default Data
const DEFAULT_FOOD_CATEGORIES: FoodCategoryItem[] = [
  { id: 'cat-1', code: 'APP', name: 'Appetizers & Starters', description: 'Crispy bites, finger foods, and momos', order: 1, color: 'emerald', isActive: true },
  { id: 'cat-2', code: 'SOUP', name: 'Soups & Salads', description: 'Healthy broth, organic tossed greens', order: 2, color: 'cyan', isActive: true },
  { id: 'cat-3', code: 'MAIN', name: 'Main Course Curries', description: 'Rich gravy curries, paneer & chicken delicacies', order: 3, color: 'amber', isActive: true },
  { id: 'cat-4', code: 'RICE', name: 'Rice & Biryani', description: 'Aromatic basmati, dum biryani, fried rice', order: 4, color: 'yellow', isActive: true },
  { id: 'cat-5', code: 'BREAD', name: 'Breads & Tandoori', description: 'Butter naan, garlic roti, tandoori paratha', order: 5, color: 'orange', isActive: true },
  { id: 'cat-6', code: 'PIZZA', name: 'Pizzas & Pastas', description: 'Wood-fired sourdough pizza & Italian pastas', order: 6, color: 'rose', isActive: true },
  { id: 'cat-7', code: 'DES', name: 'Desserts & Sweets', description: 'Warm gulab jamun, ice creams & pastries', order: 7, color: 'pink', isActive: true },
  { id: 'cat-8', code: 'HOTB', name: 'Hot Beverages', description: 'Espresso, cappuccino, masala tea & latte', order: 8, color: 'amber', isActive: true },
  { id: 'cat-9', code: 'CLDB', name: 'Cold Beverages & Mocktails', description: 'Virgin mojitos, fresh juices & iced teas', order: 9, color: 'sky', isActive: true },
  { id: 'cat-10', code: 'BAR', name: 'Cocktails & Spirits', description: 'Premium bar spirits, wines & signatures', order: 10, color: 'purple', isActive: true },
];

const DEFAULT_TABLE_CATEGORIES: TableCategorySection[] = [
  { id: 'sec-1', code: 'FINE', name: 'Indoor Fine Dining', floorZone: 'Ground Floor Main Hall', description: 'Climate-controlled restaurant hall with acoustic ambience', order: 1, isActive: true },
  { id: 'sec-2', code: 'ROOF', name: 'Skyline Rooftop Terrace', floorZone: '4th Floor Rooftop Open Air', description: 'Open-air terrace with mountain sunset and skyline view', order: 2, isActive: true },
  { id: 'sec-3', code: 'POOL', name: 'Poolside Lounge & Bar', floorZone: 'Pool Deck Outdoors', description: 'Heated poolside deck with casual lounge seating and bar service', order: 3, isActive: true },
  { id: 'sec-4', code: 'VIP', name: 'Private Executive Dining', floorZone: 'Mezzanine VIP Wing', description: 'Soundproof luxury private salons for corporate and VIP banquets', order: 4, isActive: true },
  { id: 'sec-5', code: 'GARDEN', name: 'Garden Patio & Lawn', floorZone: 'Central Garden Lawn', description: 'Lush green alfresco patio for daytime tea and garden dining', order: 5, isActive: true },
];

const DEFAULT_UNITS: MeasurementUnitItem[] = [
  { id: 'u-1', code: 'FULL', name: 'Full Portion', description: 'Standard full adult serving', order: 1, isDefault: true, isActive: true },
  { id: 'u-2', code: 'HALF', name: 'Half Portion', description: 'Half portion single serving', order: 2, isActive: true },
  { id: 'u-3', code: 'PLT', name: 'Plate (10 Pcs)', description: 'Standard 10 piece momo plate', order: 3, isActive: true },
  { id: 'u-4', code: 'PLT6', name: 'Plate (6 Pcs)', description: 'Standard 6 piece serving', order: 4, isActive: true },
  { id: 'u-5', code: '1PC', name: 'Single Piece (1 Pc)', description: 'Individual single unit item', order: 5, isActive: true },
  { id: 'u-6', code: 'REG', name: 'Regular / Standard', description: 'Standard single cup/glass item', order: 6, isActive: true },
  { id: 'u-7', code: 'LRG', name: 'Large Portion', description: 'Upsized family or shareable portion', order: 7, isActive: true },
  { id: 'u-8', code: 'CUP', name: 'Cup / Mug', description: 'Hot beverage ceramic cup', order: 8, isActive: true },
  { id: 'u-9', code: 'GLS', name: 'Glass (250ml)', description: 'Beverage or mocktail glass', order: 9, isActive: true },
  { id: 'u-10', code: 'BTL', name: 'Bottle (750ml)', description: 'Wine or spirit sealed bottle', order: 10, isActive: true },
];

const DEFAULT_PRODUCTS: RestaurantProductItem[] = [
  {
    id: 'prod-1',
    code: 'MOMO-C',
    name: 'Chicken Steam Momo',
    category: 'Appetizers & Starters',
    basePrice: 280,
    unit: 'Plate (10 Pcs)',
    portions: [
      { id: 'p-1', unitName: 'Plate (10 Pcs)', price: 280, isDefault: true },
      { id: 'p-2', unitName: 'Half Portion', price: 160 },
    ],
    isVeg: false,
    trackStock: false,
    description: 'Fresh minced chicken seasoned with Himalayan herbs in delicate dough wrap',
    isActive: true,
  },
  {
    id: 'prod-2',
    code: 'MOMO-V',
    name: 'Veg Fried Momo',
    category: 'Appetizers & Starters',
    basePrice: 220,
    unit: 'Plate (10 Pcs)',
    portions: [
      { id: 'p-3', unitName: 'Plate (10 Pcs)', price: 220, isDefault: true },
      { id: 'p-4', unitName: 'Half Portion', price: 130 },
    ],
    isVeg: true,
    trackStock: false,
    description: 'Crispy fried vegetable dumplings served with spicy tomato sesame dip',
    isActive: true,
  },
  {
    id: 'prod-3',
    code: 'PBM-01',
    name: 'Paneer Butter Masala',
    category: 'Main Course Curries',
    basePrice: 420,
    unit: 'Full Portion',
    portions: [
      { id: 'p-5', unitName: 'Full Portion', price: 420, isDefault: true },
      { id: 'p-6', unitName: 'Half Portion', price: 240 },
    ],
    isVeg: true,
    trackStock: false,
    description: 'Cottage cheese cubes simmered in a velvety buttery makhani gravy',
    isActive: true,
  },
  {
    id: 'prod-4',
    code: 'CTM-01',
    name: 'Chicken Tikka Masala',
    category: 'Main Course Curries',
    basePrice: 490,
    unit: 'Full Portion',
    portions: [
      { id: 'p-7', unitName: 'Full Portion', price: 490, isDefault: true },
      { id: 'p-8', unitName: 'Half Portion', price: 280 },
    ],
    isVeg: false,
    trackStock: false,
    description: 'Charcoal grilled chicken tikka in spiced tomato-onion reduction',
    isActive: true,
  },
  {
    id: 'prod-5',
    code: 'PIZ-MAR',
    name: 'Margherita Pizza 12"',
    category: 'Pizzas & Pastas',
    basePrice: 580,
    unit: 'Large Portion',
    portions: [
      { id: 'p-9', unitName: 'Large Portion', price: 580, isDefault: true },
      { id: 'p-10', unitName: 'Regular / Standard', price: 380 },
    ],
    isVeg: true,
    trackStock: false,
    description: 'Wood fired pizza with San Marzano tomato sauce, fresh mozzarella & basil',
    isActive: true,
  },
  {
    id: 'prod-6',
    code: 'BRD-BTR',
    name: 'Butter Naan',
    category: 'Breads & Tandoori',
    basePrice: 70,
    unit: 'Single Piece (1 Pc)',
    portions: [
      { id: 'p-11', unitName: 'Single Piece (1 Pc)', price: 70, isDefault: true },
      { id: 'p-12', unitName: 'Plate (6 Pcs)', price: 380 },
    ],
    isVeg: true,
    trackStock: false,
    description: 'Clay oven baked leavened flatbread glazed with melted clarified butter',
    isActive: true,
  },
  {
    id: 'prod-7',
    code: 'COF-CAP',
    name: 'Fresh Brewed Cappuccino',
    category: 'Hot Beverages',
    basePrice: 180,
    unit: 'Cup / Mug',
    portions: [
      { id: 'p-13', unitName: 'Cup / Mug', price: 180, isDefault: true },
      { id: 'p-14', unitName: 'Large Portion', price: 240 },
    ],
    isVeg: true,
    trackStock: false,
    description: 'Double shot espresso balanced with steamed milk and dense milk foam',
    isActive: true,
  },
];

const DEFAULT_TABLES: RestaurantTableItem[] = [
  { id: 't-1', tableNumber: 'T-101', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Window view table for couples', isActive: true },
  { id: 't-2', tableNumber: 'T-102', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Comfortable 4-seater booth', isActive: true },
  { id: 't-3', tableNumber: 'T-103', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Family dining center table', isActive: true },
  { id: 't-4', tableNumber: 'T-104', section: 'Indoor Fine Dining', capacity: 6, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Large group dining round table', isActive: true },
  { id: 't-5', tableNumber: 'ROOF-1', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Panoramic sunset view terrace', isActive: true },
  { id: 't-6', tableNumber: 'ROOF-2', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Rooftop cocktail lounge corner', isActive: true },
  { id: 't-7', tableNumber: 'ROOF-3', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Rooftop central dining space', isActive: true },
  { id: 't-8', tableNumber: 'POOL-1', section: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Sunbed poolside cabana table', isActive: true },
  { id: 't-9', tableNumber: 'POOL-2', section: 'Poolside Lounge & Bar', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Pool deck high-top bistro', isActive: true },
  { id: 't-10', tableNumber: 'VIP-SALON', section: 'Private Executive Dining', capacity: 10, status: 'AVAILABLE', cleaningStatus: 'CLEAN', notes: 'Soundproof executive salon with private service', isActive: true },
];

export default function RestaurantSetupPage() {
  const toast = useToast();

  // Active Setup Tab
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'tables' | 'table-categories' | 'units'>('categories');

  // Search Query for active tab
  const [searchQuery, setSearchQuery] = useState('');

  // Primary State collections with LocalStorage Hydration
  const [categories, setCategories] = useState<FoodCategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('restaurant_setup_categories');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_FOOD_CATEGORIES;
  });

  const [products, setProducts] = useState<RestaurantProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('restaurant_setup_products');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_PRODUCTS;
  });

  const [tables, setTables] = useState<RestaurantTableItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('restaurant_setup_tables');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_TABLES;
  });

  const [tableCategories, setTableCategories] = useState<TableCategorySection[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('restaurant_setup_table_categories');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_TABLE_CATEGORIES;
  });

  const [units, setUnits] = useState<MeasurementUnitItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const masterUnits = getMasterItems('units');
        if (masterUnits && masterUnits.length > 0) {
          return masterUnits as unknown as MeasurementUnitItem[];
        }
        const saved = localStorage.getItem('restaurant_setup_units');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_UNITS;
  });

  // Sync state changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('restaurant_setup_categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('restaurant_setup_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('restaurant_setup_tables', JSON.stringify(tables));
    } catch {}
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem('restaurant_setup_table_categories', JSON.stringify(tableCategories));
    } catch {}
  }, [tableCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('restaurant_setup_units', JSON.stringify(units));
      saveMasterItems('units', units as unknown as SimpleMasterItem[]);
    } catch {}
  }, [units]);

  // Real-time synchronization with Master Setup units
  useEffect(() => {
    const handleUnitsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'units') {
        const updated = getMasterItems('units');
        if (updated && updated.length > 0) {
          setUnits(updated as unknown as MeasurementUnitItem[]);
        }
      }
    };
    window.addEventListener(MASTERS_UPDATED_EVENT, handleUnitsUpdate);
    window.addEventListener('storage', handleUnitsUpdate);
    return () => {
      window.removeEventListener(MASTERS_UPDATED_EVENT, handleUnitsUpdate);
      window.removeEventListener('storage', handleUnitsUpdate);
    };
  }, []);

  // Synchronize with backend API for Tables on initial load
  useEffect(() => {
    const syncBackendTables = async () => {
      try {
        const res = await api.getTables();
        if (res && res.length > 0) {
          const apiTables: RestaurantTableItem[] = res.map((t: any) => ({
            id: t.id,
            tableNumber: t.tableNumber,
            section: t.section || 'Indoor Fine Dining',
            capacity: t.capacity || 4,
            status: t.status || 'AVAILABLE',
            cleaningStatus: t.cleaningStatus || 'CLEAN',
            notes: t.maintenanceNotes || '',
            isActive: true,
          }));
          setTables(apiTables);
        }
      } catch {
        // Fallback to local state if backend call is unavailable
      }
    };
    syncBackendTables();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formCategory, setFormCategory] = useState('');
  const [formBasePrice, setFormBasePrice] = useState<number>(100);
  const [formUnit, setFormUnit] = useState('Full Portion');
  const [formIsVeg, setFormIsVeg] = useState(false);
  const [formCapacity, setFormCapacity] = useState<number>(4);
  const [formSection, setFormSection] = useState('Indoor Fine Dining');
  const [formFloorZone, setFormFloorZone] = useState('');
  const [formStatus, setFormStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE'>('AVAILABLE');
  const [formCleaningStatus, setFormCleaningStatus] = useState<'CLEAN' | 'DIRTY' | 'CLEANING'>('CLEAN');
  const [formPortions, setFormPortions] = useState<ProductPortionPrice[]>([
    { id: 'p-1', unitName: 'Full Portion', price: 100, isDefault: true },
  ]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormOrder(
      activeTab === 'categories' ? categories.length + 1 :
      activeTab === 'units' ? units.length + 1 :
      activeTab === 'table-categories' ? tableCategories.length + 1 : 1
    );
    setFormCategory(categories[0]?.name || 'Appetizers & Starters');
    setFormBasePrice(250);
    setFormUnit(units[0]?.name || 'Full Portion');
    setFormIsVeg(false);
    setFormCapacity(4);
    setFormSection(tableCategories[0]?.name || 'Indoor Fine Dining');
    setFormFloorZone('Ground Floor');
    setFormStatus('AVAILABLE');
    setFormCleaningStatus('CLEAN');
    setFormPortions([
      { id: `p-${Date.now()}-1`, unitName: 'Full Portion', price: 250, isDefault: true },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: any) => {
    setModalMode('EDIT');
    setEditingId(item.id);
    setFormCode(item.code || item.tableNumber || '');
    setFormName(item.name || item.tableNumber || '');
    setFormDescription(item.description || item.notes || '');
    setFormOrder(item.order || 1);
    setFormCategory(item.category || categories[0]?.name || '');
    setFormBasePrice(item.basePrice || 100);
    setFormUnit(item.unit || units[0]?.name || '');
    setFormIsVeg(!!item.isVeg);
    setFormCapacity(item.capacity || 4);
    setFormSection(item.section || tableCategories[0]?.name || '');
    setFormFloorZone(item.floorZone || '');
    setFormStatus(item.status || 'AVAILABLE');
    setFormCleaningStatus(item.cleaningStatus || 'CLEAN');
    setFormPortions(
      item.portions && item.portions.length > 0
        ? [...item.portions]
        : [{ id: `p-${Date.now()}`, unitName: 'Full Portion', price: item.basePrice || 100, isDefault: true }]
    );
    setIsModalOpen(true);
  };

  // Save Form Handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'categories') {
      if (!formName.trim()) {
        toast.error('Category Name Required', 'Please enter a valid category name.');
        return;
      }
      if (modalMode === 'CREATE') {
        const newCat: FoodCategoryItem = {
          id: `cat-${Date.now()}`,
          code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim(),
          order: formOrder || categories.length + 1,
          color: 'emerald',
          isActive: true,
        };
        setCategories((prev) => [...prev, newCat]);
        toast.success('Category Added', `Food Category "${newCat.name}" created successfully.`);
      } else if (editingId) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  code: formCode.trim().toUpperCase() || c.code,
                  name: formName.trim(),
                  description: formDescription.trim(),
                  order: formOrder,
                }
              : c
          )
        );
        toast.success('Category Updated', `Category "${formName.trim()}" updated successfully.`);
      }
    } else if (activeTab === 'products') {
      if (!formName.trim()) {
        toast.error('Product Name Required', 'Please enter a valid product name.');
        return;
      }
      if (modalMode === 'CREATE') {
        const newProd: RestaurantProductItem = {
          id: `prod-${Date.now()}`,
          code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
          name: formName.trim(),
          category: formCategory,
          basePrice: formBasePrice,
          unit: formUnit,
          portions: formPortions,
          isVeg: formIsVeg,
          trackStock: false,
          description: formDescription.trim(),
          isActive: true,
        };
        setProducts((prev) => [...prev, newProd]);
        toast.success('Product Added', `Menu Item "${newProd.name}" (Rs. ${newProd.basePrice}) created.`);
      } else if (editingId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  code: formCode.trim().toUpperCase() || p.code,
                  name: formName.trim(),
                  category: formCategory,
                  basePrice: formBasePrice,
                  unit: formUnit,
                  portions: formPortions,
                  isVeg: formIsVeg,
                  description: formDescription.trim(),
                }
              : p
          )
        );
        toast.success('Product Updated', `Product "${formName.trim()}" updated.`);
      }
    } else if (activeTab === 'tables') {
      const tableNum = (formCode.trim() || formName.trim()).toUpperCase();
      if (!tableNum) {
        toast.error('Table Number Required', 'Please enter a valid table identifier (e.g. T-105, ROOF-4).');
        return;
      }
      if (modalMode === 'CREATE') {
        const newTable: RestaurantTableItem = {
          id: `tbl-${Date.now()}`,
          tableNumber: tableNum,
          section: formSection,
          capacity: formCapacity,
          status: formStatus,
          cleaningStatus: formCleaningStatus,
          notes: formDescription.trim(),
          isActive: true,
        };
        setTables((prev) => [...prev, newTable]);

        // Attempt live API backend persistence
        try {
          await api.createTable({
            tableNumber: newTable.tableNumber,
            section: newTable.section,
            capacity: newTable.capacity,
            status: newTable.status === 'AVAILABLE' ? 'FREE' : newTable.status,
            cleaningStatus: newTable.cleaningStatus,
            maintenanceNotes: newTable.notes,
          });
        } catch {
          // Local fallback holds
        }

        toast.success('Table Added', `Table "${newTable.tableNumber}" (${newTable.section}) created.`);
      } else if (editingId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? {
                  ...t,
                  tableNumber: tableNum,
                  section: formSection,
                  capacity: formCapacity,
                  status: formStatus,
                  cleaningStatus: formCleaningStatus,
                  notes: formDescription.trim(),
                }
              : t
          )
        );
        toast.success('Table Updated', `Table "${tableNum}" updated successfully.`);
      }
    } else if (activeTab === 'table-categories') {
      if (!formName.trim()) {
        toast.error('Section Name Required', 'Please enter a table section name.');
        return;
      }
      if (modalMode === 'CREATE') {
        const newSec: TableCategorySection = {
          id: `sec-${Date.now()}`,
          code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
          name: formName.trim(),
          floorZone: formFloorZone.trim() || 'Main Floor',
          description: formDescription.trim(),
          order: formOrder || tableCategories.length + 1,
          isActive: true,
        };
        setTableCategories((prev) => [...prev, newSec]);
        toast.success('Section Added', `Table Section "${newSec.name}" created.`);
      } else if (editingId) {
        setTableCategories((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  code: formCode.trim().toUpperCase() || s.code,
                  name: formName.trim(),
                  floorZone: formFloorZone.trim() || s.floorZone,
                  description: formDescription.trim(),
                  order: formOrder,
                }
              : s
          )
        );
        toast.success('Section Updated', `Table Section "${formName.trim()}" updated.`);
      }
    } else if (activeTab === 'units') {
      if (!formName.trim()) {
        toast.error('Unit Name Required', 'Please enter a portion/unit name.');
        return;
      }
      if (modalMode === 'CREATE') {
        const newUnit: MeasurementUnitItem = {
          id: `u-${Date.now()}`,
          code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim(),
          order: formOrder || units.length + 1,
          isDefault: units.length === 0,
          isActive: true,
        };
        setUnits((prev) => [...prev, newUnit]);
        toast.success('Unit Added', `Unit of Measurement "${newUnit.name}" created.`);
      } else if (editingId) {
        setUnits((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? {
                  ...u,
                  code: formCode.trim().toUpperCase() || u.code,
                  name: formName.trim(),
                  description: formDescription.trim(),
                  order: formOrder,
                }
              : u
          )
        );
        toast.success('Unit Updated', `Unit "${formName.trim()}" updated.`);
      }
    }

    setIsModalOpen(false);
  };

  // Delete Handler
  const handleDeleteItem = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    if (activeTab === 'categories') {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.info('Category Removed', `Food Category "${name}" was removed.`);
    } else if (activeTab === 'products') {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.info('Product Removed', `Menu Item "${name}" was removed.`);
    } else if (activeTab === 'tables') {
      setTables((prev) => prev.filter((t) => t.id !== id));
      toast.info('Table Removed', `Table "${name}" was removed.`);
    } else if (activeTab === 'table-categories') {
      setTableCategories((prev) => prev.filter((s) => s.id !== id));
      toast.info('Section Removed', `Table Section "${name}" was removed.`);
    } else if (activeTab === 'units') {
      setUnits((prev) => prev.filter((u) => u.id !== id));
      toast.info('Unit Removed', `Unit "${name}" was removed.`);
    }
  };

  // Portion Price Tier Helper
  const handleAddPortionTier = () => {
    setFormPortions((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, unitName: units[0]?.name || 'Portion', price: formBasePrice },
    ]);
  };

  const handleUpdatePortionTier = (id: string, field: 'unitName' | 'price', value: any) => {
    setFormPortions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePortionTier = (id: string) => {
    if (formPortions.length <= 1) {
      toast.error('At least one price tier required', 'Each product must have at least one selling price.');
      return;
    }
    setFormPortions((prev) => prev.filter((p) => p.id !== id));
  };

  // Filtered Items for active tab
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredTables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.tableNumber.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [tables, searchQuery]);

  const filteredTableCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tableCategories;
    return tableCategories.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.floorZone.toLowerCase().includes(q)
    );
  }, [tableCategories, searchQuery]);

  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return units;
    return units.filter((u) => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q));
  }, [units, searchQuery]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 space-y-3">
      {/* Top Breadcrumb & Module Pill */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-muted dark:text-muted">
            <Link href="/" className="hover:text-body transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/tables" className="hover:text-body transition-colors">
              Restaurant
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-body dark:text-slate-200">
              Master Setup
            </span>
          </div>

          <span className="rounded bg-success-subtle dark:bg-success-subtle border border-success dark:border-success px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wider">
            Restaurant Module · Master Setup
          </span>
        </div>

        {/* Restaurant Quick Navigation Strip */}
        <RestaurantManagementNavBoxes activeId="restaurant-setup" />
      </div>

      <div className="border-b border-border-default dark:border-border-default -mt-1" />

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border-default dark:border-border-default">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-body dark:text-body tracking-tight">
            Restaurant Setup
          </h1>
          <p className="text-xs text-muted dark:text-muted">
            Configure food categories, products/menu catalog, dining tables, sections, and measurement units.
          </p>
        </div>

        {/* Direct Action Button */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0B3D32] hover:bg-[#082C24] text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all dark:bg-brand dark:hover:bg-brand-hover cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            {activeTab === 'categories' ? 'Add Food Category' :
             activeTab === 'products' ? 'Add Product / Dish' :
             activeTab === 'tables' ? 'Add Dining Table' :
             activeTab === 'table-categories' ? 'Add Table Section' : 'Add Measurement Unit'}
          </span>
        </button>
      </div>

      {/* 5 Segmented Setup Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'categories', label: 'Food Categories', count: categories.length, icon: Layers },
            { id: 'products', label: 'Products & Dishes', count: products.length, icon: UtensilsCrossed },
            { id: 'tables', label: 'Table Setup', count: tables.length, icon: Armchair },
            { id: 'table-categories', label: 'Table Sections', count: tableCategories.length, icon: Building2 },
            { id: 'units', label: 'Unit Setup', count: units.length, icon: Scale },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-brand'
                    : 'bg-white border border-border-default text-[#4A6B5D] hover:bg-surface-muted dark:bg-surface-card dark:border-border-default dark:text-[#A4B8AE]'
                )}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-[3px] px-1.5 py-0.2 text-[10px] font-mono',
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-muted dark:bg-[#0E362C] text-muted dark:text-success'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Box */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${
              activeTab === 'categories' ? 'categories...' :
              activeTab === 'products' ? 'dishes or codes...' :
              activeTab === 'tables' ? 'table numbers...' :
              activeTab === 'table-categories' ? 'sections...' : 'units...'
            }`}
            className="w-full h-9 rounded-[4px] border border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-body placeholder-[#879B90] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-border-default dark:text-body transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body p-0.5 rounded transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="rounded-[4px] border border-border-default dark:border-border-default bg-white dark:bg-surface-card shadow-2xs overflow-hidden">
          {/* TAB 1: FOOD CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-[#F4F7F5] dark:bg-[#061B16] text-[10px] font-bold text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">CODE</th>
                    <th className="py-2.5 px-3">CATEGORY NAME</th>
                    <th className="py-2.5 px-3">DESCRIPTION</th>
                    <th className="py-2.5 px-3 w-24 text-center">ITEMS COUNT</th>
                    <th className="py-2.5 px-3 w-20 text-center">ORDER</th>
                    <th className="py-2.5 px-3 w-20 text-center">STATUS</th>
                    <th className="py-2.5 px-3 w-24 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredCategories.map((cat, idx) => {
                    const count = products.filter((p) => p.category === cat.name).length;
                    return (
                      <tr key={cat.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-brand dark:text-success">{cat.code}</td>
                        <td className="py-2.5 px-3 font-bold text-body flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{cat.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-muted">{cat.description || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-success font-mono font-bold text-[11px]">
                            {count} {count === 1 ? 'dish' : 'dishes'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted">{cat.order}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(cat)}
                              className="p-1 rounded text-muted hover:text-body hover:bg-surface-muted transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(cat.id, cat.name)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No food categories match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PRODUCTS & DISHES */}
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-[#F4F7F5] dark:bg-[#061B16] text-[10px] font-bold text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">ITEM CODE</th>
                    <th className="py-2.5 px-3">DISH / PRODUCT NAME</th>
                    <th className="py-2.5 px-3 w-40">CATEGORY</th>
                    <th className="py-2.5 px-3 w-28">BASE PRICE</th>
                    <th className="py-2.5 px-3">PORTION PRICING</th>
                    <th className="py-2.5 px-3 w-20 text-center">DIET</th>
                    <th className="py-2.5 px-3 w-20 text-center">STATUS</th>
                    <th className="py-2.5 px-3 w-24 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredProducts.map((prod, idx) => (
                    <tr key={prod.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-brand dark:text-success">{prod.code}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-body">{prod.name}</div>
                        {prod.description && <div className="text-[11px] text-muted truncate max-w-md">{prod.description}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-[3px] bg-surface-muted border border-border-default text-body text-[11px] font-semibold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-body">
                        Rs. {prod.basePrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {prod.portions.map((portion) => (
                            <span key={portion.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand/5 border border-brand/10 text-brand dark:text-success">
                              <span>{portion.unitName}:</span>
                              <span className="font-bold">Rs. {portion.price}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
                          prod.isVeg ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        )}>
                          {prod.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1 rounded text-muted hover:text-body hover:bg-surface-muted transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(prod.id, prod.name)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted">
                        No dishes or menu products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TABLE SETUP */}
          {activeTab === 'tables' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-[#F4F7F5] dark:bg-[#061B16] text-[10px] font-bold text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">TABLE NO.</th>
                    <th className="py-2.5 px-3">SECTION / AREA</th>
                    <th className="py-2.5 px-3 w-24 text-center">CAPACITY</th>
                    <th className="py-2.5 px-3 w-28 text-center">STATUS</th>
                    <th className="py-2.5 px-3 w-28 text-center">CLEANING</th>
                    <th className="py-2.5 px-3">SPECIAL NOTES / FEATURES</th>
                    <th className="py-2.5 px-3 w-24 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredTables.map((tbl, idx) => (
                    <tr key={tbl.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-brand dark:text-success text-sm">
                        {tbl.tableNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-[3px] bg-surface-muted border border-border-default text-body text-[11px] font-semibold">
                          {tbl.section}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-body font-mono">
                        {tbl.capacity} {tbl.capacity === 1 ? 'Guest' : 'Guests'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          tbl.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          tbl.status === 'OCCUPIED' ? 'bg-[#0B3D32] text-white' :
                          tbl.status === 'RESERVED' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        )}>
                          {tbl.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
                          tbl.cleaningStatus === 'CLEAN' ? 'bg-emerald-50 text-emerald-700' :
                          tbl.cleaningStatus === 'DIRTY' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                        )}>
                          {tbl.cleaningStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted">{tbl.notes || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(tbl)}
                            className="p-1 rounded text-muted hover:text-body hover:bg-surface-muted transition-colors cursor-pointer"
                            title="Edit Table"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(tbl.id, tbl.tableNumber)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTables.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No restaurant tables match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: TABLE CATEGORIES / SECTIONS */}
          {activeTab === 'table-categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-[#F4F7F5] dark:bg-[#061B16] text-[10px] font-bold text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">CODE</th>
                    <th className="py-2.5 px-3">SECTION NAME</th>
                    <th className="py-2.5 px-3">FLOOR / ZONE</th>
                    <th className="py-2.5 px-3">DESCRIPTION</th>
                    <th className="py-2.5 px-3 w-24 text-center">TABLES COUNT</th>
                    <th className="py-2.5 px-3 w-20 text-center">STATUS</th>
                    <th className="py-2.5 px-3 w-24 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredTableCategories.map((sec, idx) => {
                    const count = tables.filter((t) => t.section === sec.name).length;
                    return (
                      <tr key={sec.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-brand dark:text-success">{sec.code}</td>
                        <td className="py-2.5 px-3 font-bold text-body">{sec.name}</td>
                        <td className="py-2.5 px-3 text-muted">{sec.floorZone}</td>
                        <td className="py-2.5 px-3 text-muted">{sec.description || '—'}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-brand dark:text-success">
                          {count} {count === 1 ? 'table' : 'tables'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sec)}
                              className="p-1 rounded text-muted hover:text-body hover:bg-surface-muted transition-colors cursor-pointer"
                              title="Edit Section"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(sec.id, sec.name)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTableCategories.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No table sections match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: MEASUREMENT UNITS */}
          {activeTab === 'units' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-default bg-[#F4F7F5] dark:bg-[#061B16] text-[10px] font-bold text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">CODE</th>
                    <th className="py-2.5 px-3">UNIT / PORTION NAME</th>
                    <th className="py-2.5 px-3">DESCRIPTION / USAGE</th>
                    <th className="py-2.5 px-3 w-24 text-center">ORDER</th>
                    <th className="py-2.5 px-3 w-24 text-center">DEFAULT</th>
                    <th className="py-2.5 px-3 w-20 text-center">STATUS</th>
                    <th className="py-2.5 px-3 w-24 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredUnits.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-brand dark:text-success">{u.code}</td>
                      <td className="py-2.5 px-3 font-bold text-body">{u.name}</td>
                      <td className="py-2.5 px-3 text-muted">{u.description || '—'}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-muted">{u.order}</td>
                      <td className="py-2.5 px-3 text-center">
                        {u.isDefault ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand/10 text-brand dark:text-success">
                            Default
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1 rounded text-muted hover:text-body hover:bg-surface-muted transition-colors cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(u.id, u.name)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No measurement units match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-surface-card rounded-[4px] border border-border-default shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-[#FAFBF9] dark:bg-[#071F1A]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand dark:text-success" />
                <h3 className="text-sm font-bold text-body">
                  {modalMode === 'CREATE' ? 'Add New' : 'Edit'} {
                    activeTab === 'categories' ? 'Food Category' :
                    activeTab === 'products' ? 'Product / Menu Item' :
                    activeTab === 'tables' ? 'Dining Table' :
                    activeTab === 'table-categories' ? 'Table Section' : 'Measurement Unit'
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted hover:text-body rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar text-xs">
              {/* FOOD CATEGORY FORM */}
              {activeTab === 'categories' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-muted mb-1">Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. APP"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-muted mb-1">Category Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Appetizers & Starters"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief notes about dishes in this category..."
                      className="w-full p-2 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-[11px] font-bold text-muted mb-1">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={formOrder}
                      onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                      className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono focus:outline-none focus:border-brand"
                    />
                  </div>
                </>
              )}

              {/* PRODUCTS SETUP FORM */}
              {activeTab === 'products' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-muted mb-1">Item Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. MOMO-C"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-muted mb-1">Dish / Product Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Chicken Steam Momo"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Food Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-medium focus:outline-none focus:border-brand"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Base Price (Rs.) *</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        required
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Portion Price Tiers Builder */}
                  <div className="border border-border-default rounded-[4px] p-2.5 space-y-2 bg-[#FAFBF9] dark:bg-[#071F1A]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-body text-[11px] block">Portion Pricing Tiers (Full, Half, Plate, etc.)</span>
                        <span className="text-[10px] text-muted">Select multiple units and specify their prices</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPortionTier}
                        className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Tier
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {formPortions.map((tier, pIdx) => {
                        const otherUsedNames = formPortions
                          .filter((t) => t.id !== tier.id)
                          .map((t) => t.unitName);

                        return (
                          <div key={tier.id} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <QuantityAutocomplete
                                value={tier.unitName}
                                onChange={(val) => handleUpdatePortionTier(tier.id, 'unitName', val)}
                                excludeNames={otherUsedNames}
                                placeholder="Select or type unit..."
                              />
                            </div>
                          <div className="w-32 relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted font-mono text-[10px]">Rs.</span>
                            <input
                              type="number"
                              min={0}
                              value={tier.price}
                              onChange={(e) => handleUpdatePortionTier(tier.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full h-7.5 pl-7 pr-2 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold"
                            />
                          </div>
                          {formPortions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePortionTier(tier.id)}
                              className="p-1 text-muted hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove portion"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Description / Recipe Notes</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Ingredients, allergen warnings, or taste notes..."
                      className="w-full p-2 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                </>
              )}

              {/* TABLE SETUP FORM */}
              {activeTab === 'tables' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Table Number / Code *</label>
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. T-105 or ROOF-4"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Seating Capacity (Guests) *</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={formCapacity}
                        onChange={(e) => setFormCapacity(parseInt(e.target.value, 10) || 4)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Table Section / Area *</label>
                      <select
                        value={formSection}
                        onChange={(e) => setFormSection(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-medium focus:outline-none focus:border-brand"
                      >
                        {tableCategories.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Initial Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-medium focus:outline-none focus:border-brand"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Special Features / Location Notes</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Window side table, near fountain, power socket access..."
                      className="w-full p-2 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                </>
              )}

              {/* TABLE SECTION / CATEGORIES FORM */}
              {activeTab === 'table-categories' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-muted mb-1">Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. FINE"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-muted mb-1">Section Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Indoor Fine Dining"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Floor / Zone</label>
                      <input
                        type="text"
                        value={formFloorZone}
                        onChange={(e) => setFormFloorZone(e.target.value)}
                        placeholder="e.g. Ground Floor Hall"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">Display Order</label>
                      <input
                        type="number"
                        min={1}
                        value={formOrder}
                        onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Notes on acoustic setting, lighting or service rules..."
                      className="w-full p-2 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                </>
              )}

              {/* UNIT SETUP FORM */}
              {activeTab === 'units' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-muted mb-1">Unit Code</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. FULL"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-muted mb-1">Portion / Unit Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Full Portion"
                        className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted mb-1">Description / Usage</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Standard single plate serving"
                      className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-[11px] font-bold text-muted mb-1">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={formOrder}
                      onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                      className="w-full h-8 px-2.5 rounded-[3px] border border-border-default bg-white dark:bg-[#07241E] text-xs font-mono focus:outline-none focus:border-brand"
                    />
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-border-default bg-white text-muted hover:text-body text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#082C24] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  {modalMode === 'CREATE' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

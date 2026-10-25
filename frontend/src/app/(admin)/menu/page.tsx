'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Search,
  X,
  ChevronDown,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Package,
  Sparkles,
  Check,
  AlertCircle,
  Boxes,
  CookingPot,
  RefreshCw,
} from 'lucide-react';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { POSProductData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

// Standard menu categories
const PRESET_CATEGORIES = [
  'Fast Food & Momos',
  'Main Course & Curries',
  'Beverages & Drinks',
  'Starters & Quick Bites',
  'Tandoori & Grills',
  'Biryani & Rice Bowls',
  'Desserts & Sweets',
  'Breakfast Specials',
];

// Fallback initial items if backend empty or during offline dev
const INITIAL_FALLBACK_ITEMS: Partial<POSProductData>[] = [
  // Stocked Products (Beer, Coca-Cola, Bottled water, Packaged juice)
  {
    name: 'Coca-Cola (Bottled)',
    category: 'Beverages & Drinks',
    description: 'Chilled 500ml Coca-Cola bottle',
    price: 80,
    trackStock: true,
    stock: 100,
    isAvailable: true,
  },
  {
    name: 'Gorkha Strong Beer (650ml)',
    category: 'Beverages & Drinks',
    description: 'Crisp brewed lager chilled 650ml bottle',
    price: 380,
    trackStock: true,
    stock: 50,
    isAvailable: true,
  },
  {
    name: 'Mineral Water (1L Bottled)',
    category: 'Beverages & Drinks',
    description: 'Pure sealed mineral water bottle',
    price: 40,
    trackStock: true,
    stock: 150,
    isAvailable: true,
  },
  {
    name: 'Real Fruit Juice (Packaged)',
    category: 'Beverages & Drinks',
    description: '1L packaged mixed fruit tetra pack',
    price: 240,
    trackStock: true,
    stock: 30,
    isAvailable: true,
  },
  // Handmade / Prepared Items (Tea, Momo, Chowmein, Fried Rice)
  {
    name: 'Special Masala Milk Tea',
    category: 'Beverages & Drinks',
    description: 'Freshly brewed hot handmade spiced tea with herbs',
    price: 45,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Filter Coffee (Hot Brew)',
    category: 'Beverages & Drinks',
    description: 'Artisanal roasted hand-pulled espresso with frothy milk',
    price: 90,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Chicken Steam Momo (10 Pcs)',
    category: 'Fast Food & Momos',
    description: 'Handmade juicy chicken dumplings steamed fresh to order',
    price: 180,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Veg Steam Momo (10 Pcs)',
    category: 'Fast Food & Momos',
    description: 'Fresh minced cabbage, paneer and herb handmade dumplings',
    price: 150,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Chicken Fried Momo (10 Pcs)',
    category: 'Fast Food & Momos',
    description: 'Golden fried crispy handmade chicken momos',
    price: 200,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Special Chicken Chowmein',
    category: 'Fast Food & Momos',
    description: 'Wok-tossed handmade noodles with shredded chicken and veggies',
    price: 210,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Egg & Veg Fried Rice',
    category: 'Biryani & Rice Bowls',
    description: 'Aromatic wok-stirred basmati rice with farm eggs & crisp veggies',
    price: 190,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Main Course & Curries',
    description: 'Tender cottage cheese cooked in creamy tomato butter gravy',
    price: 320,
    trackStock: false,
    stock: 0,
    isAvailable: true,
  },
];

export default function MenuPage() {
  const toast = useToast();

  const [products, setProducts] = useState<POSProductData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'tracked' | 'untracked'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<POSProductData | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Beverages & Drinks');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTrackStock, setFormTrackStock] = useState<boolean>(false);
  const [formStock, setFormStock] = useState<string>('');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Load products from API
  const fetchMenuProducts = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getPOSProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else {
        // If DB has no products yet, seed initial fallback demo items into state
        setProducts(
          INITIAL_FALLBACK_ITEMS.map((item, idx) => ({
            id: `temp-${idx}`,
            outlet: 'RESTAURANT',
            category: item.category || 'General',
            name: item.name || 'Item',
            description: item.description || null,
            price: item.price || 0,
            stock: item.stock || 0,
            trackStock: item.trackStock ?? false,
            isAvailable: item.isAvailable ?? true,
            isActive: item.isAvailable ?? true,
          }))
        );
      }
    } catch (err: any) {
      console.warn('Could not fetch products from backend API, using initial catalog', err);
      setProducts(
        INITIAL_FALLBACK_ITEMS.map((item, idx) => ({
          id: `temp-${idx}`,
          outlet: 'RESTAURANT',
          category: item.category || 'General',
          name: item.name || 'Item',
          description: item.description || null,
          price: item.price || 0,
          stock: item.stock || 0,
          trackStock: item.trackStock ?? false,
          isAvailable: item.isAvailable ?? true,
          isActive: item.isAvailable ?? true,
        }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenuProducts();
  }, []);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Beverages & Drinks');
    setFormPrice('');
    setFormDescription('');
    setFormTrackStock(false);
    setFormStock('');
    setFormIsAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: POSProductData) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category || 'Beverages & Drinks');
    setFormPrice(item.price.toString());
    setFormDescription(item.description || '');
    setFormTrackStock(Boolean(item.trackStock));
    // For stocked items, fill actual stock; for untracked items, leave empty or default
    setFormStock(item.trackStock ? item.stock.toString() : '');
    setFormIsAvailable(item.isAvailable ?? item.isActive ?? true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError(null);
  };

  // Handle Form Submit
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validate Item Name
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Item name is required.');
      return;
    }

    // 2. Validate Category
    const trimmedCat = formCategory.trim();
    if (!trimmedCat) {
      setFormError('Please select or enter a category.');
      return;
    }

    // 3. Validate Price
    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Please enter a valid non-negative selling price.');
      return;
    }

    // 4. Validate Stock Tracking Requirements
    let parsedStock: number | undefined = undefined;
    if (formTrackStock) {
      // When Track Stock is enabled, require a valid non-negative stock quantity
      if (formStock.trim() === '') {
        setFormError('Stock quantity is required when stock tracking is enabled.');
        return;
      }
      parsedStock = parseInt(formStock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        setFormError('Stock quantity must be a non-negative whole number (0 or greater).');
        return;
      }
    } else {
      // When Track Stock is disabled, do not require stock quantity
      parsedStock = undefined;
    }

    // Auto-compute availability: when stock is 0 on a tracked product, mark unavailable
    let finalAvailability = formIsAvailable;
    if (formTrackStock && parsedStock !== undefined && parsedStock <= 0) {
      finalAvailability = false;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Edit Mode: update product without deleting unrelated fields
        const updated = await api.updatePOSProduct(editingItem.id, {
          name: trimmedName,
          category: trimmedCat,
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          trackStock: formTrackStock,
          stock: formTrackStock ? parsedStock : (editingItem.stock || 0),
          isAvailable: finalAvailability,
        });

        setProducts((prev) =>
          prev.map((p) => (p.id === editingItem.id ? { ...p, ...updated } : p))
        );
        toast.success(
          'Menu item updated',
          `"${trimmedName}" saved as ${formTrackStock ? `Stocked (${parsedStock} in stock)` : 'Handmade / Not Tracked'}.`
        );
      } else {
        // Create Mode
        const created = await api.createPOSProduct({
          outlet: 'RESTAURANT',
          name: trimmedName,
          category: trimmedCat,
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          trackStock: formTrackStock,
          stock: formTrackStock ? parsedStock : 0,
          isAvailable: finalAvailability,
        });

        setProducts((prev) => [created, ...prev]);
        toast.success(
          'Menu item created',
          `"${trimmedName}" added as ${formTrackStock ? `Stocked (${parsedStock} in stock)` : 'Handmade / Prepared'}.`
        );
      }

      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save menu item.');
      toast.error('Save failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteItem = async (item: POSProductData) => {
    if (!confirm(`Are you sure you want to delete "${item.name}" from the menu?`)) {
      return;
    }

    try {
      await api.deletePOSProduct(item.id);
      setProducts((prev) => prev.filter((p) => p.id !== item.id));
      toast.success('Item deleted', `"${item.name}" removed from the menu.`);
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  // Toggle availability directly from listing
  const handleToggleAvailability = async (item: POSProductData) => {
    const nextAvailability = !(item.isAvailable ?? item.isActive ?? true);
    try {
      const updated = await api.updatePOSProduct(item.id, {
        isAvailable: nextAvailability,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, ...updated } : p))
      );
      toast.success(
        nextAvailability ? 'Item Available' : 'Item Marked Unavailable',
        `"${item.name}" is now ${nextAvailability ? 'available for ordering' : 'hidden from new orders'}.`
      );
    } catch (err: any) {
      toast.error('Status update failed', err.message);
    }
  };

  // Extract all categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    PRESET_CATEGORIES.forEach((c) => set.add(c));
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      // Stock type filter
      let matchesStockType = true;
      if (stockFilter === 'tracked') {
        matchesStockType = Boolean(item.trackStock);
      } else if (stockFilter === 'untracked') {
        matchesStockType = !item.trackStock;
      }

      return matchesSearch && matchesCategory && matchesStockType;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Group filtered items by category
  const groupedProducts = useMemo(() => {
    const map = new Map<string, POSProductData[]>();
    filteredProducts.forEach((item) => {
      const cat = item.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [filteredProducts]);

  // Counts for summary pills
  const stats = useMemo(() => {
    const total = products.length;
    const tracked = products.filter((p) => p.trackStock).length;
    const untracked = total - tracked;
    const outOfStock = products.filter((p) => p.trackStock && p.stock <= 0).length;
    return { total, tracked, untracked, outOfStock };
  }, [products]);

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* =========================================================================
          RESTAURANT MANAGEMENT SUB-OPTIONS NAVIGATION (LINKED TO OUR MENU)
         ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/restaurant-management"
              className="font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Restaurant Management
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Our Menu & Stock Tracking
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMenuProducts(true)}
              disabled={refreshing}
              title="Refresh menu & stock from server"
              className="inline-flex items-center gap-1 rounded bg-[#F4F7F5] dark:bg-[#061B16] border border-[#DCE3DF] dark:border-[#145447] px-2 py-1 text-[11px] font-bold text-[#24352F] dark:text-[#A4B8AE] hover:text-[#0B3D32] dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <span className="rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Menu & Stock Control
            </span>
          </div>
        </div>

        <RestaurantManagementNavBoxes activeId="menu" />
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 -mt-1 mb-2" />

      {/* =========================================================================
          PAGE HEADER: Title, Summary Pills & Add Menu Item Button
         ========================================================================= */}
      <div className="shrink-0 pb-3 border-b border-[#E5EEE9] dark:border-[#145447] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#24352F] dark:text-white font-heading tracking-tight">
                Menu & Stock Management
              </h1>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-[3px] bg-[#EEF4F1] dark:bg-[#0A2E26] text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                {stats.total} Dishes & Products
              </span>
            </div>
            <p className="text-xs text-[#64736C] dark:text-[#A4B8AE] mt-0.5">
              Supports both <strong className="text-[#24352F] dark:text-white">stocked retail products</strong> (Beer, Coca-Cola) with automated inventory depletion and <strong className="text-[#24352F] dark:text-white">handmade/prepared items</strong> (Tea, Momo, Chowmein) prepared on order.
            </p>
          </div>
        </div>

        {/* Action Button: Add Menu Item */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#082d25] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUMMARY METRIC CARDS (Total, Stocked, Handmade, Out of Stock)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
          <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE] text-[11px] font-semibold">
            <span>All Menu Items</span>
            <ChefHat className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
          </div>
          <div className="text-xl font-black text-[#24352F] dark:text-white font-mono mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-[#879B90] mt-0.5">Dishes across all outlets</div>
        </div>

        <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
          <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE] text-[11px] font-semibold">
            <span>Stocked Products</span>
            <Boxes className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1">
            {stats.tracked}
          </div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Tracked with live stock count</div>
        </div>

        <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
          <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE] text-[11px] font-semibold">
            <span>Handmade / Prepared</span>
            <CookingPot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
            {stats.untracked}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Not Tracked (No stock limit)</div>
        </div>

        <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
          <div className="flex items-center justify-between text-[#64736C] dark:text-[#A4B8AE] text-[11px] font-semibold">
            <span>Out of Stock</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1">
            {stats.outOfStock}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Depleted tracked items</div>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR: Search, Category Filter, and Stock Tracking Filter
         ========================================================================= */}
      <div className="shrink-0 py-2.5 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#879B90]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or beverage..."
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
        <div className="relative w-44 sm:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-semibold focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#879B90] pointer-events-none" />
        </div>

        {/* Stock Type Filter */}
        <div className="relative w-48 sm:w-56">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-semibold focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">All Items (Stocked & Handmade)</option>
            <option value="tracked">Stocked Products Only (Tracked)</option>
            <option value="untracked">Handmade / Prepared (Not Tracked)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#879B90] pointer-events-none" />
        </div>

        {/* Clear filter */}
        {(searchQuery || selectedCategory !== 'all' || stockFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStockFilter('all');
            }}
            className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400 px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* =========================================================================
          MENU GROUPS TABLE LISTING (With Stock Quantity & Not Tracked Badges)
         ========================================================================= */}
      <div className="flex-1 min-h-0 space-y-6 pb-10">
        {groupedProducts.map((group) => (
          <div key={group.category} className="space-y-1.5">
            {/* Category Header */}
            <div className="px-1 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-[#24352F] dark:text-white font-heading tracking-tight flex items-center gap-2">
                <span>{group.category}</span>
                <span className="text-[11px] font-mono font-medium text-[#64736C] dark:text-[#A4B8AE]">
                  ({group.items.length} {group.items.length === 1 ? 'item' : 'items'})
                </span>
              </h2>
            </div>

            {/* Table Container */}
            <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                      {/* # */}
                      <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        #
                      </th>

                      {/* Item Name & Details */}
                      <th className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447]">
                        Menu Item / Specifications
                      </th>

                      {/* Category */}
                      <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">
                        Category
                      </th>

                      {/* Selling Price */}
                      <th className="py-2.5 px-4 w-28 text-right border-r border-[#E5EEE9] dark:border-[#145447]">
                        Selling Price
                      </th>

                      {/* Stock Tracking & Quantity */}
                      <th className="py-2.5 px-4 w-40 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        Stock Quantity
                      </th>

                      {/* Availability Status */}
                      <th className="py-2.5 px-3.5 w-32 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                        Availability
                      </th>

                      {/* Actions */}
                      <th className="py-2.5 px-3 w-20 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                    {group.items.map((item, index) => {
                      const isAvailable = item.isAvailable ?? item.isActive ?? true;

                      return (
                        <tr
                          key={item.id}
                          className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                        >
                          {/* Order # */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20 font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                            {index + 1}
                          </td>

                          {/* Item Name & Description */}
                          <td className="py-2.5 px-4 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-xs sm:text-[13px] text-[#24352F] dark:text-white">
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] mt-0.5 max-w-md">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] whitespace-nowrap">
                            <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-2 py-0.5 text-[10px] font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                              {item.category}
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                            <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                              Rs. {Number(item.price).toLocaleString()}
                            </span>
                          </td>

                          {/* Stock Quantity / Not Tracked Badge */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                            {item.trackStock ? (
                              item.stock > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
                                  <Package className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>{item.stock} in stock</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-2xs">
                                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>0 in stock (Out)</span>
                                </span>
                              )
                            ) : (
                              <span
                                title="Handmade dish prepared on order. Not subject to stock depletion."
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 select-none shadow-2xs cursor-help"
                              >
                                <CookingPot className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                <span>Not Tracked</span>
                              </span>
                            )}
                          </td>

                          {/* Availability Status */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(item)}
                              title={
                                isAvailable
                                  ? 'Click to toggle unavailable'
                                  : 'Click to toggle available'
                              }
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border transition-colors cursor-pointer',
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                )}
                              />
                              <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                            </button>
                          </td>

                          {/* Action (Edit & Delete) */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title={`Edit ${item.name}`}
                                className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item)}
                                title={`Delete ${item.name}`}
                                className="p-1 rounded-[2px] text-[#879B90] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {groupedProducts.length === 0 && (
          <div className="py-16 text-center text-xs text-[#879B90] bg-white dark:bg-[#07241E] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
            <ChefHat className="w-8 h-8 mx-auto text-[#879B90] mb-2 opacity-50" />
            <span className="font-semibold text-sm text-[#24352F] dark:text-white block mb-1">
              No menu items match your search or filter
            </span>
            <p className="text-xs text-[#64736C] dark:text-[#A4B8AE] max-w-sm mx-auto mb-3">
              Try adjusting your search query, selecting a different category, or adding a new menu item.
            </p>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStockFilter('all');
                }}
                className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400"
              >
                Reset filters
              </button>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-xs font-bold text-[#0B3D32] dark:text-emerald-400 hover:underline"
              >
                + Add New Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADD / EDIT MENU ITEM MODAL
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#07241E] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5EEE9] px-4 py-3 dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-[#0B3D32] text-white dark:bg-emerald-600 shadow-2xs">
                  {editingItem ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white">
                    {editingItem ? `Edit Menu Item: ${editingItem.name}` : 'Add New Menu Item'}
                  </h3>
                  <span className="text-[10px] text-[#64736C] dark:text-[#A4B8AE]">
                    {editingItem ? 'Update specifications and stock policy' : 'Configure dish name, selling price, and stock tracking'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded p-1 text-[#879B90] hover:bg-[#EEF4F1] hover:text-[#24352F] dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveMenuItem} className="p-4 space-y-3.5">
              {formError && (
                <div className="rounded-[3px] bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Item Name */}
              <div>
                <label className="block text-xs font-semibold text-[#24352F] dark:text-slate-200 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Coca-Cola (500ml), Chicken Steam Momo, Gorkha Strong Beer"
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* 2. Category & Selling Price Grid */}
              <div className="grid grid-cols-12 gap-3">
                {/* Category */}
                <div className="col-span-12 sm:col-span-7">
                  <label className="block text-xs font-semibold text-[#24352F] dark:text-slate-200 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full appearance-none rounded-[3px] border border-[#DCE3DF] bg-white px-3 pr-8 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#879B90] pointer-events-none" />
                  </div>
                </div>

                {/* Selling Price */}
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs font-semibold text-[#24352F] dark:text-slate-200 mb-1">
                    Selling Price (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 dark:text-slate-500 select-none">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-9 pr-3 text-xs font-mono font-bold text-[#0B3D32] dark:text-emerald-300 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Description (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Specifications (Optional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Chilled 500ml bottle or freshly steamed handmade dumplings"
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* 4. STOCK TRACKING SECTION: Track Stock Checkbox & Conditional Quantity */}
              <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#F7F9F8] dark:bg-[#061B16] p-3.5 space-y-3">
                {/* Checkbox: Track Stock */}
                <div className="flex items-start gap-2.5">
                  <div className="flex items-center h-5">
                    <input
                      id="trackStockCheckbox"
                      type="checkbox"
                      checked={formTrackStock}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormTrackStock(checked);
                        if (checked && formStock === '') {
                          // Suggest initial 50 stock when enabled
                          setFormStock('50');
                        }
                      }}
                      className="w-4 h-4 rounded-[2px] text-[#0B3D32] focus:ring-[#0B3D32] dark:focus:ring-emerald-500 border-[#C5D3CD] dark:border-[#145447] cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="trackStockCheckbox"
                      className="text-xs font-bold text-[#24352F] dark:text-white cursor-pointer flex items-center gap-1.5"
                    >
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
                    <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] mt-0.5 leading-relaxed">
                      {formTrackStock
                        ? 'Track inventory for stocked or packaged retail goods (Beer, Coca-Cola, Bottled Water, Packaged Juice). Sales will automatically decrease stock.'
                        : 'Disable for food & drinks prepared on order (Tea, Coffee, Momo, Chowmein, Fried Rice). No stock quantity required and won’t deplete inventory.'}
                    </p>
                  </div>
                </div>

                {/* Conditional Stock Quantity Field: Shown ONLY when Track Stock is enabled */}
                {formTrackStock && (
                  <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] space-y-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#24352F] dark:text-white">
                        Available Stock Quantity <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-[#0B3D32] dark:text-emerald-400 font-semibold font-mono">
                        Required non-negative number
                      </span>
                    </div>

                    <div className="relative">
                      <Package className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={0}
                        step={1}
                        required={formTrackStock}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-9 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-[#64736C] dark:text-[#A4B8AE]">
                      When stock reaches zero (0), the product will be automatically marked unavailable for new orders to prevent overselling.
                    </p>
                  </div>
                )}
              </div>

              {/* 5. Availability Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#24352F] dark:text-slate-200 mb-1">
                  Availability Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(true)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-[3px] border transition-all cursor-pointer',
                      formIsAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs ring-1 ring-emerald-500/20'
                        : 'bg-white text-slate-600 border-[#DCE3DF] dark:bg-[#061B16] dark:text-slate-400 dark:border-[#145447] hover:bg-slate-50'
                    )}
                  >
                    <Check className={cn('w-3.5 h-3.5', formIsAvailable ? 'text-emerald-600' : 'text-slate-400')} />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(false)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-[3px] border transition-all cursor-pointer',
                      !formIsAvailable
                        ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-2xs ring-1 ring-rose-500/20'
                        : 'bg-white text-slate-600 border-[#DCE3DF] dark:bg-[#061B16] dark:text-slate-400 dark:border-[#145447] hover:bg-slate-50'
                    )}
                  >
                    <X className={cn('w-3.5 h-3.5', !formIsAvailable ? 'text-rose-600' : 'text-slate-400')} />
                    <span>Unavailable</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-[#E5EEE9] dark:border-[#145447] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-2 text-xs font-bold text-[#64736C] hover:bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#082d25] dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Menu Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

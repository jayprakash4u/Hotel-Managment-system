'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Zap,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CheckCircle2,
  RotateCcw,
  CreditCard,
  Banknote,
  QrCode,
  ChefHat,
  User,
  Phone,
  AlertTriangle,
  Clock,
  Sparkles,
  X,
  History,
  TrendingUp,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { RestaurantManagementNavBoxes } from '@/components/common/RestaurantManagementNavBoxes';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { POSProductData, QuickSaleReceipt, DailySalesSummaryData } from '@/lib/types';
import { DEFAULT_MENU_CATALOG, MenuItemCatalogEntry, resolveItemUnitInfo } from '@/lib/menuData';

interface QuickCartItem {
  id: string;
  productId?: string;
  name: string;
  baseName?: string;
  category: string;
  unit?: string;
  availableUnits?: { unit: string; price: number }[];
  unitPrice: number;
  quantity: number;
  trackStock: boolean;
  stock?: number;
  notes?: string;
}

export default function QuickSalePage() {
  const toast = useToast();

  // Products state
  const [posProducts, setPosProducts] = useState<POSProductData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart & Order state
  const [cart, setCart] = useState<QuickCartItem[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(true);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(0); // Default 0% for counter takeaway
  const [sendToKitchen, setSendToKitchen] = useState<boolean>(false);

  // Customer & Cashier Info (strictly optional)
  const [showCustomerFields, setShowCustomerFields] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>('Counter Cashier');
  const [orderRemarks, setOrderRemarks] = useState<string>('');

  // Payment Tender state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState<QuickSaleReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Daily Sales Summary Drawer / Modal state
  const [dailySales, setDailySales] = useState<DailySalesSummaryData | null>(null);
  const [isDailySalesModalOpen, setIsDailySalesModalOpen] = useState<boolean>(false);
  const [isLoadingDailySales, setIsLoadingDailySales] = useState<boolean>(false);

  // Fetch POS Products & Daily Sales from API
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await api.getPOSProducts({ outlet: 'RESTAURANT' });
      if (data && data.length > 0) {
        setPosProducts(data);
      }
    } catch (err) {
      console.warn('Using local fallback catalog for POS products', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadDailySales = async () => {
    setIsLoadingDailySales(true);
    try {
      const data = await api.getDailySales();
      if (data) {
        setDailySales(data);
      }
    } catch (err) {
      console.warn('Could not load daily sales summary', err);
    } finally {
      setIsLoadingDailySales(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadDailySales();
  }, []);

  // Merged Catalog (Backend POS Products + Menu Catalog entries)
  const unifiedCatalog = useMemo(() => {
    const list: Array<{
      id: string;
      productId?: string;
      name: string;
      baseName?: string;
      category: string;
      unit?: string;
      availableUnits?: { unit: string; price: number }[];
      price: number;
      trackStock: boolean;
      stock: number;
      isAvailable: boolean;
      imageUrl?: string | null;
    }> = [];

    // Add POS products from database
    const posNameMap = new Set<string>();
    posProducts.forEach((p) => {
      posNameMap.add(p.name.toLowerCase().trim());
      list.push({
        id: p.id,
        productId: p.id,
        name: p.name,
        baseName: p.name,
        category: p.category || 'Retail & Drinks',
        price: p.price,
        trackStock: p.trackStock ?? false,
        stock: p.stock ?? 0,
        isAvailable: p.isAvailable ?? true,
        imageUrl: p.imageUrl,
      });
    });

    // Add default menu catalog items that aren't already represented
    DEFAULT_MENU_CATALOG.forEach((m) => {
      const clean = m.name.toLowerCase().trim();
      const cleanBase = (m.baseName || m.name).toLowerCase().trim();
      if (!posNameMap.has(clean) && !posNameMap.has(cleanBase)) {
        list.push({
          id: m.id,
          productId: undefined,
          name: m.name,
          baseName: m.baseName,
          category: m.category,
          unit: m.unit,
          availableUnits: m.availableUnits,
          price: m.price,
          trackStock: m.trackStock ?? false,
          stock: m.stock ?? 999,
          isAvailable: m.isAvailable ?? true,
        });
      }
    });

    return list;
  }, [posProducts]);

  // Available Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(unifiedCatalog.map((c) => c.category))).filter(Boolean);
    return ['ALL', ...cats];
  }, [unifiedCatalog]);

  // Filtered Catalog
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return unifiedCatalog.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.baseName && item.baseName.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [unifiedCatalog, selectedCategory, searchQuery]);

  // ---------------------------------------------------------------------------
  // Cart Actions
  // ---------------------------------------------------------------------------
  const handleAddToCart = (product: (typeof unifiedCatalog)[0]) => {
    // Check if out of stock
    if (product.trackStock && (product.stock <= 0 || !product.isAvailable)) {
      toast.error('Out of Stock', `"${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.productId && i.name === product.name);
      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        // Check stock limit for tracked items
        if (product.trackStock && item.quantity >= product.stock) {
          toast.error('Stock Limit Reached', `Only ${product.stock} units of "${product.name}" available in stock.`);
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: item.quantity + 1 };
        toast.info('Item Incremented', `${product.name} (x${item.quantity + 1})`);
        return updated;
      }

      toast.success('Item Added', `${product.name} · Rs. ${product.price}`);
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.productId,
          name: product.name,
          baseName: product.baseName,
          category: product.category,
          unit: product.unit,
          availableUnits: product.availableUnits,
          unitPrice: product.price,
          quantity: 1,
          trackStock: product.trackStock,
          stock: product.stock,
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            if (delta > 0 && item.trackStock && item.stock !== undefined && item.quantity >= item.stock) {
              toast.error('Stock Limit', `Only ${item.stock} units available in stock.`);
              return item;
            }
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as QuickCartItem[]
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountValue('0');
    setTenderedAmount('');
  };

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const parsed = parseFloat(discountValue) || 0;
    if (parsed <= 0 || subtotal <= 0) return 0;
    if (discountType === 'AMOUNT') {
      return Math.min(subtotal, parsed);
    }
    return (subtotal * Math.min(100, parsed)) / 100;
  }, [subtotal, discountType, discountValue]);

  const netAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = isTaxEnabled ? Math.round(netAfterDiscount * 0.10 * 100) / 100 : 0;
  const serviceChargeAmount = serviceChargeRate > 0 ? Math.round(netAfterDiscount * (serviceChargeRate / 100) * 100) / 100 : 0;
  const grandTotal = Math.max(0, Math.round((netAfterDiscount + taxAmount + serviceChargeAmount) * 100) / 100);

  const parsedTendered = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, parsedTendered - grandTotal);

  // ---------------------------------------------------------------------------
  // Complete Quick Sale Handler
  // ---------------------------------------------------------------------------
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is Empty', 'Please select at least one item from the catalog.');
      return;
    }

    if (paymentMethod === 'CASH' && tenderedAmount && parsedTendered < grandTotal) {
      toast.error('Insufficient Payment', `Tendered amount (Rs. ${parsedTendered}) is less than Total (Rs. ${grandTotal}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          notes: i.notes,
        })),
        paymentMethod,
        paidAmount: paymentMethod === 'CASH' && parsedTendered > 0 ? parsedTendered : grandTotal,
        discountPercent: discountType === 'PERCENT' ? parseFloat(discountValue) || 0 : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        tax: taxAmount,
        serviceCharge: serviceChargeAmount,
        serverName: cashierName.trim() || 'Counter Cashier',
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderRemarks.trim() || undefined,
        sendToKitchen,
        outlet: 'RESTAURANT',
      };

      const result = await api.quickSale(payload);

      toast.celebrate('Sale Completed!', `Bill #${result.receipt?.orderNumber || 'ORD'} paid successfully via ${paymentMethod}.`);

      // Set active receipt and open receipt modal for immediate printing
      setActiveReceipt(result.receipt);
      setIsReceiptModalOpen(true);

      // Reset cart and tender
      handleClearCart();
      setCustomerName('');
      setCustomerPhone('');
      setOrderRemarks('');

      // Refresh product stock and daily sales
      await loadProducts();
      await loadDailySales();
    } catch (err: any) {
      toast.error('Sale Failed', err.message || 'Error occurred while completing counter sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none animate-in fade-in duration-150">
      {/* =======================================================================
          TOP NAVIGATION BOXES (RESTAURANT HUB MODULES)
          ======================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Restaurant Management Suite
          </span>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Counter POS & Quick Sale</span>
          </span>
        </div>
        <RestaurantManagementNavBoxes activeId="quick-sale" />
      </div>

      {/* =======================================================================
          HEADER BAR: TITLE, DAILY SALES SUMMARY & RECENT RECEIPTS
          ======================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[3px] bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#24352F] dark:text-white font-heading">
                Quick Sale · Counter POS
              </h1>
              <span className="px-2 py-0.5 rounded-[2px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Walk-In / Takeaway
              </span>
            </div>
            <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
              No table or registration required · Instant inventory stock deduction & tax invoice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily Sales Quick Metric Button */}
          {dailySales && (
            <button
              type="button"
              onClick={() => setIsDailySalesModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-[#0B3D32] dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
              title="Click to view daily sales & payment report"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Today: Rs. {dailySales.totalSales.toFixed(0)}</span>
              <span className="font-mono text-[10px] opacity-75">({dailySales.totalOrders} bills)</span>
            </button>
          )}

          {/* Recent Bills History */}
          <button
            type="button"
            onClick={() => setIsDailySalesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] text-[#24352F] dark:text-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Recent Bills</span>
          </button>
        </div>
      </div>

      {/* =======================================================================
          MAIN 2-COLUMN POS TERMINAL LAYOUT
          LEFT (65%): PRODUCT CATALOG WITH CATEGORIES & SEARCH
          RIGHT (35%): BILLING TERMINAL & PAYMENT REGISTER
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =====================================================================
            LEFT PANEL: PRODUCT SEARCH, CATEGORIES & PRODUCT CARDS GRID
            ===================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Search Bar & Category Scroller */}
          <div className="p-3 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-2xs space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu item, bottled drink, snack, or retail product..."
                className="w-full rounded-[3px] border border-[#DCE3DF] bg-[#FAFBF9] dark:bg-[#061B16] py-2 pl-9 pr-8 text-xs font-semibold text-[#24352F] dark:text-white placeholder-slate-400 shadow-2xs focus:border-[#0B3D32] focus:bg-white focus:outline-none dark:border-[#145447]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1 rounded-[3px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                      isSelected
                        ? 'bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600'
                        : 'bg-white border border-[#DCE3DF] text-[#4A6B5D] hover:bg-slate-50 dark:bg-[#07241E] dark:border-[#145447] dark:text-[#A4B8AE]'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.trackStock && (product.stock <= 0 || !product.isAvailable);
              const cartItem = cart.find((i) => i.productId === product.productId && i.name === product.name);

              return (
                <div
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className={cn(
                    'relative flex flex-col justify-between p-3 rounded-[4px] border transition-all duration-150 shadow-2xs cursor-pointer select-none min-h-[110px]',
                    isOutOfStock
                      ? 'bg-slate-100/70 border-slate-200 opacity-60 dark:bg-slate-900/40 dark:border-slate-800 cursor-not-allowed'
                      : cartItem
                      ? 'bg-amber-50/60 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700 ring-1 ring-amber-400'
                      : 'bg-white border-[#DCE3DF] hover:border-[#0B3D32] hover:shadow-xs dark:bg-[#07241E] dark:border-[#145447] dark:hover:border-emerald-500'
                  )}
                >
                  {/* Top: Category & Stock Pill */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      {product.category}
                    </span>

                    {product.trackStock ? (
                      isOutOfStock ? (
                        <span className="px-1.5 py-0.2 rounded-[2px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[8px] font-bold uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-[2px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] font-bold font-mono">
                          {product.stock} in stock
                        </span>
                      )
                    ) : (
                      <span className="px-1 py-0.2 rounded-[2px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[8px] font-semibold">
                        Fresh Prep
                      </span>
                    )}
                  </div>

                  {/* Middle: Product Name */}
                  <h3 className="text-xs font-bold text-[#24352F] dark:text-white line-clamp-2 leading-snug">
                    {product.name}
                  </h3>

                  {/* Bottom: Price & Add Button */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#EAEFEA] dark:border-[#145447]/60">
                    <span className="text-xs font-black font-mono text-[#0B3D32] dark:text-emerald-300">
                      Rs. {product.price.toFixed(0)}
                    </span>

                    {cartItem ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] font-mono shadow-xs">
                        {cartItem.quantity}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-[2px] bg-[#0B3D32] text-white hover:bg-[#093027] text-xs font-bold transition-all shadow-2xs">
                        +
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center rounded-[4px] border border-[#DCE3DF] bg-white dark:border-[#145447] dark:bg-[#07241E]">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">No items match your search</h3>
              <p className="text-[11px] text-slate-500 mt-1">Try another term or pick from category pills above.</p>
            </div>
          )}
        </div>

        {/* =====================================================================
            RIGHT PANEL: BILLING REGISTER & PAYMENT TERMINAL
            ===================================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[4px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] shadow-sm flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="px-4 py-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#24352F] dark:text-white font-heading">
                  Active Bill · Counter
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Items Selected
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Optional Customer Information Toggle */}
          <div className="px-4 py-2 border-b border-[#E5EEE9] dark:border-[#145447] bg-slate-50/50 dark:bg-slate-900/20">
            <button
              type="button"
              onClick={() => setShowCustomerFields(!showCustomerFields)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B3D32] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer Info (Optional)</span>
              </span>
              <span className="text-[10px] text-slate-400">{showCustomerFields ? '▲ Hide' : '▼ Add'}</span>
            </button>

            {showCustomerFields && (
              <div className="grid grid-cols-2 gap-2 pt-2 pb-1 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white py-1 px-2 text-xs text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white py-1 px-2 text-xs font-mono text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3 max-h-[300px] overflow-y-auto space-y-2 divide-y divide-[#E5EEE9] dark:divide-[#145447]/60 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Cart is currently empty</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click any product on the left to add it.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#24352F] dark:text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Rs. {item.unitPrice.toFixed(0)} × {item.quantity} = Rs. {(item.unitPrice * item.quantity).toFixed(0)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-xs text-[#24352F] dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1 rounded-[2px] text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Calculations Breakdown */}
          <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-2 text-xs">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-[#24352F] dark:text-white">
                Rs. {subtotal.toFixed(2)}
              </span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 dark:text-slate-300">Discount</span>
                <div className="flex items-center gap-0.5 rounded-[2px] border border-[#DCE3DF] bg-white dark:bg-[#07241E] text-[10px] p-0.5">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={cn('px-1.5 py-0.2 rounded-[1px] font-bold cursor-pointer', discountType === 'PERCENT' ? 'bg-[#0B3D32] text-white' : 'text-slate-500')}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('AMOUNT')}
                    className={cn('px-1.5 py-0.2 rounded-[1px] font-bold cursor-pointer', discountType === 'AMOUNT' ? 'bg-[#0B3D32] text-white' : 'text-slate-500')}
                  >
                    Rs
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={discountType === 'PERCENT' ? 100 : subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-16 rounded-[2px] border border-[#DCE3DF] bg-white px-1.5 py-0.5 text-right text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                />
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold min-w-[70px] text-right">
                  -Rs. {discountAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tax (10% VAT) */}
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxEnabled}
                  onChange={(e) => setIsTaxEnabled(e.target.checked)}
                  className="rounded text-[#0B3D32] focus:ring-[#0B3D32]"
                />
                <span>VAT (10%)</span>
              </label>
              <span className="font-mono font-semibold text-[#24352F] dark:text-white">
                Rs. {taxAmount.toFixed(2)}
              </span>
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t border-[#E5EEE9] dark:border-[#145447] flex items-baseline justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#24352F] dark:text-white">
                Grand Total
              </span>
              <span className="text-xl font-black font-mono text-[#0B3D32] dark:text-emerald-400">
                Rs. {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Kitchen KOT Toggle (Requirement 7) */}
          <div className="px-4 py-2 border-t border-[#E5EEE9] dark:border-[#145447] bg-amber-50/50 dark:bg-amber-950/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToKitchen}
                onChange={(e) => setSendToKitchen(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                Send KOT to Kitchen Display (KDS)
              </div>
            </label>
          </div>

          {/* Payment Method Selector & Cash Tender */}
          <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] space-y-2.5">
            {/* Payment Method Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'UPI', label: 'QR / UPI', icon: QrCode },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = paymentMethod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(p.id as any);
                      if (p.id === 'CASH' && !tenderedAmount) {
                        setTenderedAmount(grandTotal > 0 ? grandTotal.toString() : '');
                      }
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-1.5 rounded-[3px] text-xs font-bold border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-[#0B3D32] border-[#0B3D32] text-white shadow-2xs dark:bg-emerald-600 dark:border-emerald-600'
                        : 'bg-white border-[#DCE3DF] text-slate-700 hover:bg-slate-50 dark:bg-[#07241E] dark:border-[#145447] dark:text-slate-200'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'CASH' && (
              <div className="p-2.5 rounded-[3px] border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 space-y-1.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Tendered Cash:</span>
                  <div className="relative w-28">
                    <input
                      type="number"
                      placeholder={grandTotal.toFixed(0)}
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      className="w-full rounded-[2px] border border-amber-300 bg-white py-1 px-2 text-right text-xs font-mono font-black text-[#24352F] focus:border-[#0B3D32] focus:outline-none dark:bg-[#07241E] dark:border-amber-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick Tender Currency Pills */}
                <div className="flex items-center gap-1 justify-end pt-1">
                  {[
                    { label: 'Exact', val: grandTotal },
                    { label: '+100', val: Math.ceil(grandTotal / 100) * 100 },
                    { label: '+500', val: Math.ceil(grandTotal / 500) * 500 },
                    { label: '+1000', val: Math.ceil(grandTotal / 1000) * 100 },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTenderedAmount(btn.val.toString())}
                      className="px-1.5 py-0.5 rounded-[2px] border border-amber-300 bg-white dark:bg-[#07241E] text-[10px] font-mono font-bold hover:bg-amber-100 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {parsedTendered > grandTotal && (
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200 dark:border-amber-900 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span>Change Due:</span>
                    <span className="font-mono text-sm">Rs. {changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Primary Button */}
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleProcessSale}
              className="w-full py-2.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Processing Counter Sale...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Complete Sale & Print Bill (Rs. {grandTotal.toFixed(0)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================================
          RECEIPT MODAL / THERMAL BILL PREVIEW (REQUIREMENT 5)
          ======================================================================= */}
      {isReceiptModalOpen && activeReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsReceiptModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[4px] bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-300 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Receipt
              </span>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Document */}
            <div id="quick-sale-receipt-print" className="p-6 font-mono text-xs space-y-3 bg-white text-black">
              {/* Restaurant Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-wider">AURA GRAND RESORT</h2>
                <p className="text-[10px] font-medium text-slate-600">Restaurant & Counter Bar POS</p>
                <p className="text-[9px] text-slate-500">Lakeside Blvd, Pokhara · PAN: 601239845</p>
                <div className="pt-1 text-[10px] font-bold uppercase text-slate-800">
                  TAX INVOICE · {activeReceipt.orderType}
                </div>
              </div>

              {/* Bill Details */}
              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-bold">{activeReceipt.orderNumber}</span>
                </div>
                {activeReceipt.kotNumber && (
                  <div className="flex justify-between">
                    <span>Kitchen KOT:</span>
                    <span className="font-bold">{activeReceipt.kotNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{new Date(activeReceipt.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{activeReceipt.cashierName}</span>
                </div>
                {activeReceipt.customerName && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{activeReceipt.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-slate-200">
                  <span>Item</span>
                  <span>Qty × Rate</span>
                  <span>Amount</span>
                </div>
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <span className="max-w-[150px] truncate">{item.productName}</span>
                    <span className="text-[10px] text-slate-600">
                      {item.quantity} × {item.unitPrice.toFixed(0)}
                    </span>
                    <span className="font-bold">{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {activeReceipt.subtotal.toFixed(2)}</span>
                </div>
                {activeReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-Rs. {activeReceipt.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (VAT 10%):</span>
                  <span>Rs. {activeReceipt.tax.toFixed(2)}</span>
                </div>
                {activeReceipt.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>Rs. {activeReceipt.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>Rs. {activeReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase">{activeReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tendered:</span>
                  <span>Rs. {activeReceipt.paidAmount.toFixed(2)}</span>
                </div>
                {activeReceipt.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Change Returned:</span>
                    <span>Rs. {activeReceipt.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-500">
                <p>Thank you for dining with us!</p>
                <p>Please visit again.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close (New Sale)
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DAILY SALES & RECENT TRANSACTIONS DRAWER / MODAL (REQUIREMENT 8)
          ======================================================================= */}
      {isDailySalesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDailySalesModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[4px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                    Restaurant Daily Sales & Counter Audit
                  </h3>
                  <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                    Reconciled sales by order type, payment breakdown and recent receipts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDailySalesModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {dailySales ? (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        Total Sales
                      </div>
                      <div className="text-lg font-black font-mono text-[#0B3D32] dark:text-emerald-300">
                        Rs. {dailySales.totalSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">{dailySales.totalOrders} total bills</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                        Quick Sales
                      </div>
                      <div className="text-lg font-black font-mono text-amber-900 dark:text-amber-200">
                        Rs. {dailySales.breakdownByType.quickSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-amber-700/80">Counter & Takeaway</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-0.5">
                        Dine-In Sales
                      </div>
                      <div className="text-lg font-black font-mono text-sky-900 dark:text-sky-200">
                        Rs. {dailySales.breakdownByType.dineInSales.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-sky-700/80">Floor Tables</div>
                    </div>

                    <div className="p-3 rounded-[3px] border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-0.5">
                        VAT Collected
                      </div>
                      <div className="text-lg font-black font-mono text-purple-900 dark:text-purple-200">
                        Rs. {dailySales.totalTax.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-purple-700/80">Discounts: Rs. {dailySales.totalDiscounts.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="p-3 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                      Payment Mode Reconciliation
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Cash:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.cashSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Card:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.cardSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">QR / UPI:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.upiSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#07241E] border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Room Folio:</span>
                        <span className="font-mono font-bold">Rs. {dailySales.breakdownByPayment.roomFolioSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Paid Transactions Table */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Recent Paid Bills
                    </div>
                    <div className="overflow-x-auto rounded-[3px] border border-[#DCE3DF] dark:border-[#145447]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                            <th className="p-2">Bill / Order</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Items</th>
                            <th className="p-2">Method</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447]">
                          {dailySales.recentOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-[#0E362C]/30">
                              <td className="p-2 font-mono font-bold text-[#0B3D32] dark:text-emerald-300">
                                {ord.orderNumber}
                              </td>
                              <td className="p-2">
                                <span className={cn(
                                  'px-1.5 py-0.2 rounded-[2px] text-[9px] font-bold uppercase',
                                  ord.orderType === 'COUNTER_SALE' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                                )}>
                                  {ord.orderType === 'COUNTER_SALE' ? 'Counter' : ord.tableNumber ? `Table ${ord.tableNumber}` : 'Dine-In'}
                                </span>
                              </td>
                              <td className="p-2 font-mono">{ord.itemCount} items</td>
                              <td className="p-2 font-bold uppercase text-[10px]">{ord.paymentMethod}</td>
                              <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">
                                Rs. {ord.total.toFixed(2)}
                              </td>
                              <td className="p-2 text-right text-[10px] text-slate-400 font-mono">
                                {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">Loading daily sales...</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex justify-end">
              <button
                type="button"
                onClick={() => setIsDailySalesModalOpen(false)}
                className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

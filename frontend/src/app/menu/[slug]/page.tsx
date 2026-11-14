'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  Clock,
  Info,
  ChevronRight,
  Leaf,
  Flame,
  X,
  AlertCircle,
  Share2,
  Heart,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface PublicVariant {
  unit: string;
  price: number;
}

interface PublicMenuItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  isVeg: boolean;
  variants: PublicVariant[];
}

interface PublicMenuData {
  restaurantName: string;
  restaurantSlug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  currency: string;
  welcomeMessage?: string;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  allowOnlineOrdering: boolean;
  tableNumber?: string;
  tableSection?: string;
  categories: string[];
  items: PublicMenuItem[];
  isDisabled?: boolean;
  isRevoked?: boolean;
  message?: string;
}

function MenuLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20 animate-pulse">
      <div className="h-48 sm:h-64 bg-stone-200 w-full" />
      <div className="max-w-3xl mx-auto px-4 -mt-12 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/60 flex items-center gap-4">
          <div className="w-20 h-20 bg-stone-200 rounded-2xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-stone-200 rounded-lg w-2/3" />
            <div className="h-4 bg-stone-200 rounded-lg w-1/2" />
          </div>
        </div>
        <div className="h-12 bg-stone-200 rounded-2xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-stone-200/60 p-4" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicMenuContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const qrToken = searchParams.get('qr') || undefined;
  const tableId = searchParams.get('tableId') || undefined;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);

  // Filter states
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Category refs for scroll tracking
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchMenu = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.getPublicMenu(slug, { qr: qrToken, tableId });
        if (!isMounted) return;

        if (res?.data) {
          if (res.data.isDisabled) {
            setErrorMsg(res.data.message || 'This digital menu is temporarily turned off by restaurant management.');
            setMenuData(res.data);
          } else if (res.data.isRevoked) {
            setErrorMsg(res.data.message || 'This QR code has expired or been revoked.');
            setMenuData(res.data);
          } else {
            setMenuData(res.data);
            if (res.data.categories && res.data.categories.length > 0) {
              setActiveCategory('ALL');
            }
          }
        } else {
          setErrorMsg('Unable to load menu. Restaurant not found or unavailable.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg('Restaurant menu not found or network connection unavailable.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMenu();
    return () => {
      isMounted = false;
    };
  }, [slug, qrToken, tableId]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    if (!menuData?.items) return [];
    return menuData.items.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (vegOnly && !item.isVeg) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [menuData, activeCategory, vegOnly, searchQuery]);

  // Group items by category for structured browsing
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, PublicMenuItem[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: menuData?.restaurantName || 'Digital Menu',
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'ALL') {
      window.scrollTo({ top: 220, behavior: 'smooth' });
      return;
    }
    const el = categoryRefs.current[cat];
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  // Loading State
  if (loading) {
    return <MenuLoadingSkeleton />;
  }

  // Error or Disabled State
  if (errorMsg || !menuData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Menu Notice</h2>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              {errorMsg || 'This digital menu is currently inaccessible. Please check with your dining server.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase transition shadow-sm"
            >
              Reload Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    restaurantName,
    logoUrl,
    coverImageUrl,
    address,
    currency = 'Rs.',
    welcomeMessage,
    showPrices,
    showImages,
    showDescriptions,
    tableNumber,
    tableSection,
    categories = [],
  } = menuData;

  const defaultCover =
    coverImageUrl ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 antialiased font-sans pb-24 selection:bg-[#0f3e30] selection:text-white">
      {/* 1. HERO COVER BANNER */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-stone-900">
        <img
          src={defaultCover}
          alt={restaurantName}
          className="w-full h-full object-cover opacity-80 scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Floating Top Nav (Share & Table info) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          {tableNumber ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Table {tableNumber}</span>
              {tableSection && <span className="text-stone-300 font-normal">&bull; {tableSection}</span>}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dining Menu</span>
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition border border-white/20 shadow-lg"
            title="Share Menu"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. RESTAURANT IDENTITY CARD */}
      <div className="max-w-3xl mx-auto px-4 -mt-14 relative z-10 space-y-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-stone-900/5 border border-stone-200/70">
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md flex-shrink-0 bg-white"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0f3e30] to-[#0a2c22] text-white flex items-center justify-center font-serif text-2xl font-black shadow-md flex-shrink-0">
                {restaurantName.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight truncate">
                  {restaurantName}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              </div>

              {welcomeMessage && (
                <p className="text-xs sm:text-sm text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {welcomeMessage}
                </p>
              )}

              {address && (
                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0 text-stone-400" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. SEARCH & VEG FILTER TOOLBAR */}
        <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-stone-200/70 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks or codes..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 border-0 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0f3e30]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Veg Only Toggle Switch */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-2xs whitespace-nowrap',
              vegOnly
                ? 'bg-emerald-800 text-white shadow-emerald-950/20'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full border',
                vegOnly ? 'bg-white border-white' : 'bg-emerald-600 border-emerald-700'
              )}
            />
            Pure Veg
          </button>
        </div>

        {/* 4. STICKY CATEGORY HORIZONTAL PILLS */}
        <div className="sticky top-2 z-30 bg-[#faf8f5]/95 backdrop-blur-md py-2 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-stone-200/60">
          <button
            onClick={() => scrollToCategory('ALL')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shadow-2xs',
              activeCategory === 'ALL'
                ? 'bg-[#0f3e30] text-white shadow-[#0f3e30]/20'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
            )}
          >
            All Items ({menuData.items.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs',
                activeCategory === cat
                  ? 'bg-[#0f3e30] text-white shadow-[#0f3e30]/20'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5. MENU SECTIONS & DISH CARDS */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-800 text-base">No dishes found</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              No menu items match your search &ldquo;{searchQuery}&rdquo; {vegOnly ? 'with Pure Veg filter' : ''}.
            </p>
            {(searchQuery || vegOnly || activeCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setVegOnly(false);
                  setActiveCategory('ALL');
                }}
                className="mt-2 text-xs font-bold text-[#0f3e30] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8 pt-2">
            {Object.entries(groupedByCategory).map(([catName, catItems]) => (
              <div
                key={catName}
                ref={(el) => {
                  categoryRefs.current[catName] = el;
                }}
                className="space-y-3 scroll-mt-28"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                  <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#0f3e30] rounded-full inline-block" />
                    {catName}
                  </h2>
                  <span className="text-xs font-medium text-stone-400">
                    {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'bg-white rounded-2xl p-4 border border-stone-200/70 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between gap-3',
                        !item.isAvailable && 'opacity-65'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Dish Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Veg/Non-Veg & Item Code */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'w-4 h-4 rounded-sm border flex items-center justify-center p-0.5 flex-shrink-0',
                                item.isVeg ? 'border-emerald-700' : 'border-rose-700'
                              )}
                              title={item.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                            >
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  item.isVeg ? 'bg-emerald-700' : 'bg-rose-700'
                                )}
                              />
                            </span>

                            {item.code && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 uppercase">
                                {item.code}
                              </span>
                            )}

                            {!item.isAvailable && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 uppercase">
                                Sold Out
                              </span>
                            )}
                          </div>

                          {/* Food Name */}
                          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug tracking-tight">
                            {item.name}
                          </h3>

                          {/* Food Description */}
                          {showDescriptions && item.description && (
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Optional Food Image */}
                        {showImages && item.imageUrl && (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-100">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>

                      {/* Portion Pricing Grid (Half / Full / Regular) */}
                      {showPrices && (
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {item.variants && item.variants.length > 0 ? (
                              item.variants.map((v, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-xs font-semibold text-stone-800"
                                >
                                  <span className="text-stone-400 font-normal text-[11px]">{v.unit}:</span>
                                  <span className="text-[#0f3e30] font-black">
                                    {currency} {v.price}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm font-black text-[#0f3e30]">
                                {currency} {item.price}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. FOOTER DISCLAIMER */}
        <div className="text-center py-8 text-xs text-stone-400 space-y-2 border-t border-stone-200/80 mt-12">
          {menuData.footerText ? (
            <p className="leading-relaxed max-w-md mx-auto text-stone-500 font-medium">
              {menuData.footerText}
            </p>
          ) : (
            <p>All prices are subject to local taxes and service charge.</p>
          )}
          <p className="text-[11px] text-stone-400">
            Powered by Himalayan Hospitality PMS &bull; Touchless QR Digital Menu
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PublicMenuPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<MenuLoadingSkeleton />}>
      <PublicMenuContent slug={params.slug} />
    </Suspense>
  );
}

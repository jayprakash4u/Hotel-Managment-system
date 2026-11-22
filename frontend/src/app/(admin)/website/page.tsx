'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Truck,
  BookOpen,
  Phone,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Save,
  Palette,
  Smartphone,
  Monitor,
  X,
  Download,
  ChevronRight,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  RestaurantWebsiteSettings,
  SocialLinkItem,
  UsefulLinkItem,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

type TabKey = 'settings' | 'appearance';
type ThemeKey = 'emerald' | 'slate' | 'warm' | 'midnight';

const THEMES: { id: ThemeKey; name: string; primary: string; accent: string; bg: string }[] = [
  { id: 'emerald', name: 'Emerald Luxury', primary: '#0B3D32', accent: '#10B981', bg: '#FBF9F5' },
  { id: 'slate', name: 'Slate Minimal', primary: '#1E293B', accent: '#475569', bg: '#F8FAFC' },
  { id: 'warm', name: 'Warm Bistro', primary: '#7C2D12', accent: '#EA580C', bg: '#FFFBEB' },
  { id: 'midnight', name: 'Midnight', primary: '#0F172A', accent: '#6366F1', bg: '#0B0F19' },
];

const SOCIAL_PLATFORMS = [
  { id: 'google', name: 'Google Review' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'other', name: 'Other Link' },
];

export default function RestaurantWebsitePage() {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [settings, setSettings] = useState<RestaurantWebsiteSettings | null>(null);

  // Settings State
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(false);
  const [shareMyMenu, setShareMyMenu] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<number>(0);
  const [minDeliveryOrder, setMinDeliveryOrder] = useState<number>(0);
  const [requireOrderConfirmation, setRequireOrderConfirmation] = useState<boolean>(true);

  // Contact & Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('10:00 AM - 10:00 PM');

  // Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLinkItem[]>([]);

  // Appearance
  const [publicRestaurantName, setPublicRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [footerText, setFooterText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('emerald');

  const [newSocialPlatform, setNewSocialPlatform] = useState('google');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('mobile');

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getWebsiteSettings();
      const data = (res as any)?.data || res;
      if (data) {
        setSettings(data);
        setIsDeliveryEnabled(Boolean(data.isDeliveryEnabled));
        setShareMyMenu(data.shareMyMenu !== false);
        setDeliveryFee(Number(data.deliveryFee) || 0);
        setFreeDeliveryAbove(Number(data.freeDeliveryAbove) || 0);
        setMinDeliveryOrder(Number(data.minDeliveryOrder) || 0);
        setRequireOrderConfirmation(data.requireOrderConfirmation !== false);
        setPhoneNumber(data.phoneNumber || '');
        setAddress(data.address || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
        setOpeningHours(data.openingHours || '10:00 AM - 10:00 PM');
        setPublicRestaurantName(data.publicRestaurantName || data.restaurantName || '');
        setLogoUrl(data.logoUrl || '');
        setCoverImageUrl(data.coverImageUrl || '');
        setWelcomeMessage(data.welcomeMessage || 'Welcome to our restaurant.');
        setFooterText(data.footerText || `© ${new Date().getFullYear()} ${data.restaurantName || 'Restaurant'}.`);
        setSelectedTheme((data.theme as ThemeKey) || 'emerald');
        setSocialLinks(data.socialLinks || []);
        setUsefulLinks(data.usefulLinks || []);
      }
    } catch (err) {
      console.error('Failed to load website settings:', err);
      error('Failed to load website settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const slug = settings?.restaurantSlug || 'restaurant';
    return `${window.location.origin}/menu/${slug}`;
  }, [settings?.restaurantSlug]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    success('Website URL copied.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.updateWebsiteSettings({
        isDeliveryEnabled,
        shareMyMenu,
        deliveryFee,
        freeDeliveryAbove,
        minDeliveryOrder,
        requireOrderConfirmation,
        phoneNumber,
        address,
        googleMapsUrl,
        openingHours,
        publicRestaurantName,
        logoUrl,
        coverImageUrl,
        welcomeMessage,
        footerText,
        theme: selectedTheme,
        socialLinks,
        usefulLinks,
      });
      success('Website settings updated.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      error('Failed to update website settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!newSocialUrl.trim()) return;
    let url = newSocialUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
    const plat = SOCIAL_PLATFORMS.find((p) => p.id === newSocialPlatform);
    setSocialLinks((prev) => [
      ...prev,
      { id: `soc-${Date.now()}`, platform: newSocialPlatform, url, label: plat?.name || newSocialPlatform },
    ]);
    setNewSocialUrl('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddUsefulLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
    setUsefulLinks((prev) => [...prev, { id: `link-${Date.now()}`, title: newLinkTitle.trim(), url }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveUsefulLink = (id: string) => {
    setUsefulLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleFileToDataUrl = (file: File, setter: (url: string) => void) => {
    if (file.size > 5 * 1024 * 1024) {
      error('File must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-4 select-none font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Restaurant Website
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh settings"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
              title="Open public website in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Live Site</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B3D32] hover:bg-[#082d25] text-white text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Save changes to website settings"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. TABS TOOLBAR */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer',
              activeTab === 'settings'
                ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Website Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer',
              activeTab === 'appearance'
                ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            )}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance & Preview</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEBSITE SETTINGS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* 1. PUBLIC WEBSITE LINK & QR ROW */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  Public URL:
                </span>
                <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 truncate select-all">
                  {publicUrl || 'Generating...'}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0B3D32] hover:bg-[#082d25] text-white transition shadow-2xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Share QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. SERVICES CARD */}
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Website Services
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Delivery Service */}
              <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Delivery Service
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeliveryEnabled}
                      onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0B3D32]"></div>
                  </label>
                </div>

                {/* Delivery Settings Inputs */}
                {isDeliveryEnabled && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Delivery Fee (रु)</span>
                      <input
                        type="number"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-7 px-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Free Above (रु)</span>
                      <input
                        type="number"
                        min="0"
                        value={freeDeliveryAbove}
                        onChange={(e) => setFreeDeliveryAbove(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-7 px-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Min Order (रु)</span>
                      <input
                        type="number"
                        min="0"
                        value={minDeliveryOrder}
                        onChange={(e) => setMinDeliveryOrder(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-7 px-2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Share My Menu */}
              <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Share My Menu
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {shareMyMenu ? 'Menu catalog is public' : 'Menu catalog is hidden'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareMyMenu}
                    onChange={(e) => setShareMyMenu(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0B3D32]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 3. RESTAURANT DETAILS CARD */}
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Restaurant Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Phone</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="10:00 AM - 10:00 PM"
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Google Maps Link</label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 4. SOCIAL & USEFUL LINKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Social Links */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Social Media Links
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {socialLinks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {s.platform}:
                    </span>
                    <span className="truncate max-w-[180px] font-mono text-[11px] text-slate-500">
                      {s.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {socialLinks.length === 0 && (
                  <div className="text-center py-2 text-xs text-slate-400">No social links added.</div>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <select
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  className="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="h-7 px-2.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Useful Links */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Useful External Links
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {usefulLinks.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{l.title}</span>
                    <span className="truncate max-w-[180px] font-mono text-[11px] text-slate-500">
                      {l.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUsefulLink(l.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {usefulLinks.length === 0 && (
                  <div className="text-center py-2 text-xs text-slate-400">No external links added.</div>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Title (e.g. Booking)"
                  className="w-28 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddUsefulLink}
                  className="h-7 px-2.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPEARANCE & PREVIEW                                               */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: BRANDING & THEME (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Branding */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Restaurant Branding
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Website Name</label>
                  <input
                    type="text"
                    value={publicRestaurantName}
                    onChange={(e) => setPublicRestaurantName(e.target.value)}
                    placeholder="Restaurant Name"
                    className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Logo URL</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <label className="h-8 px-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded flex items-center cursor-pointer shrink-0">
                        <Upload className="w-3 h-3" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileToDataUrl(f, setLogoUrl);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cover Banner URL</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <label className="h-8 px-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded flex items-center cursor-pointer shrink-0">
                        <Upload className="w-3 h-3" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileToDataUrl(f, setCoverImageUrl);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Welcome Tagline</label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome to our restaurant."
                    className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Footer Text</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="© 2026 Restaurant. All rights reserved."
                    className="w-full h-8 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Themes */}
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Website Theme
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {THEMES.map((th) => {
                  const isSel = selectedTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setSelectedTheme(th.id)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col gap-2',
                        isSel
                          ? 'border-[#0B3D32] ring-1 ring-[#0B3D32] bg-emerald-50/40 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {th.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: th.primary }} />
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: th.accent }} />
                        <span className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: th.bg }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE PREVIEW (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Preview
                </span>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={cn(
                      'p-1 rounded cursor-pointer',
                      previewViewport === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={cn(
                      'p-1 rounded cursor-pointer',
                      previewViewport === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulation Mock Frame */}
              <div
                className={cn(
                  'mx-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-all duration-200 text-stone-900',
                  previewViewport === 'mobile' ? 'max-w-[280px]' : 'w-full'
                )}
                style={{
                  backgroundColor:
                    selectedTheme === 'midnight'
                      ? '#0F172A'
                      : selectedTheme === 'warm'
                      ? '#FFFBEB'
                      : selectedTheme === 'slate'
                      ? '#F8FAFC'
                      : '#FAF8F5',
                }}
              >
                {/* Banner */}
                <div className="relative h-20 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-75"
                  />
                  {isDeliveryEnabled && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase">
                      Delivery
                    </span>
                  )}
                </div>

                {/* Identity & Content */}
                <div className="p-3 -mt-4 relative z-10 space-y-2">
                  <div className="bg-white/95 backdrop-blur-md rounded-lg p-2 shadow-2xs border border-stone-200 flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#0B3D32] text-white flex items-center justify-center font-bold text-xs">
                        {(publicRestaurantName || 'R').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">
                        {publicRestaurantName || 'Restaurant Name'}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{address || 'City, Address'}</div>
                    </div>
                  </div>

                  {/* Customer Quick Links */}
                  <div className="space-y-1">
                    <div className="p-1.5 px-2 rounded bg-white border border-stone-200 text-[10px] font-semibold flex items-center justify-between">
                      <span>View Final Bill / Invoice</span>
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                    </div>
                    <div className="p-1.5 px-2 rounded bg-white border border-stone-200 text-[10px] font-semibold flex items-center justify-between">
                      <span>Live Orders & Status</span>
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                    </div>
                  </div>

                  {/* Google Reviews */}
                  <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-center text-[10px] font-semibold text-amber-900 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Review us on Google</span>
                  </div>

                  <div className="text-[9px] text-center text-stone-400 pt-1">
                    {shareMyMenu ? 'Menu Catalog Visible' : 'Menu Private'}
                  </div>
                </div>
              </div>

              {publicUrl && (
                <div className="pt-1 text-center">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 w-full py-1.5 text-xs font-semibold text-[#0B3D32] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition"
                  >
                    <span>Open Public Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SHARE QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xs w-full p-5 text-center space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Website QR Code</span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-lg inline-block border border-slate-200 shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
                alt="QR Code"
                className="w-40 h-40 mx-auto"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-1.5 text-xs font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Copy URL
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(publicUrl)}`}
                download="website-qr.png"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 text-xs font-semibold rounded bg-[#0B3D32] hover:bg-[#082d25] text-white flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

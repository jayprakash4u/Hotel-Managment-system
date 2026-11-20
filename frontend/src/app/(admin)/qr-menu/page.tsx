'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Smartphone,
  Settings as SettingsIcon,
  LayoutDashboard,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  UtensilsCrossed,
  ShieldCheck,
  Building2,
  Sparkles,
  Lock,
  ArrowRight,
  X,
  Layers,
  Image as ImageIcon,
  DollarSign,
  FileText,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Calendar,
  ChevronDown,
  MoreVertical,
  MapPin,
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_TABLES } from '@/lib/tablesData';

type ActiveTab = 'QR_CODES' | 'SETTINGS' | 'PREVIEW';
type QrCardLayout = 'red-curve' | 'minimal-light' | 'dark-luxury';

interface QrMenuSettings {
  isEnabled: boolean;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  isOrderingEnabled: boolean;
  tableOrderingMode: string;
  restaurantName: string;
  logoUrl?: string;
  coverImageUrl?: string;
  welcomeMessage?: string;
  footerText?: string;
  currencySymbol: string;
  publicMenuUrl: string;
}

interface QrCodeItem {
  id: string;
  codeType: 'RESTAURANT' | 'TABLE';
  label: string;
  tableId?: string;
  tableNumber?: string;
  section?: string;
  capacity?: number;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
  createdAt: string;
  targetUrl: string;
  rawToken?: string;
}

interface RestaurantTableOption {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
}

export default function QrMenuPage() {
  const { success, error, info } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('QR_CODES');
  const [cardLayout, setCardLayout] = useState<QrCardLayout>('red-curve');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };
    if (isAreaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAreaDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
      }
    };
    if (showLayoutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLayoutMenu]);

  // Data states
  const [hotelSlug, setHotelSlug] = useState('himalayan-hotel');
  const [hotelName, setHotelName] = useState('Himalayan Hotel & Restaurant');
  const [settings, setSettings] = useState<QrMenuSettings>({
    isEnabled: true,
    showPrices: true,
    showImages: true,
    showDescriptions: true,
    isOrderingEnabled: false,
    tableOrderingMode: 'VIEW_ONLY',
    restaurantName: 'Himalayan Hotel & Restaurant',
    logoUrl: '',
    coverImageUrl: '',
    welcomeMessage: 'Welcome to Himalayan Hotel & Restaurant. Savor the authentic flavours of the Himalayas.',
    footerText: 'All prices are subject to 10% Service Charge & 13% VAT. Please inform staff of any allergies.',
    currencySymbol: 'Rs.',
    publicMenuUrl: '/menu/himalayan-hotel',
  });

  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [tables, setTables] = useState<RestaurantTableOption[]>([]);
  const [tableCategories, setTableCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Filtering for QR Codes list
  const [qrSearch, setQrSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');

  // Preview interactive state
  const [previewTableSelection, setPreviewTableSelection] = useState<string>('RESTAURANT');
  const [copiedLink, setCopiedLink] = useState(false);

  // Print modal state
  const [printModalItem, setPrintModalItem] = useState<QrCodeItem | 'ALL' | null>(null);

  // Load initial data
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      // 1. Fetch settings
      const settingsRes = await api.getQrMenuSettings();
      if (settingsRes?.data) {
        setSettings({
          isEnabled: settingsRes.data.isEnabled ?? true,
          showPrices: settingsRes.data.showPrices ?? true,
          showImages: settingsRes.data.showImages ?? true,
          showDescriptions: settingsRes.data.showDescriptions ?? true,
          isOrderingEnabled: settingsRes.data.isOrderingEnabled ?? false,
          tableOrderingMode: settingsRes.data.tableOrderingMode ?? 'VIEW_ONLY',
          restaurantName: settingsRes.data.restaurantName || 'Himalayan Hotel & Restaurant',
          logoUrl: settingsRes.data.logoUrl || '',
          coverImageUrl: settingsRes.data.coverImageUrl || '',
          welcomeMessage: settingsRes.data.welcomeMessage || '',
          footerText: settingsRes.data.footerText || '',
          currencySymbol: settingsRes.data.currencySymbol || 'Rs.',
          publicMenuUrl: settingsRes.data.publicMenuUrl || `/menu/${settingsRes.data.hotelSlug || 'himalayan-hotel'}`,
        });
        if (settingsRes.data.hotelSlug) setHotelSlug(settingsRes.data.hotelSlug);
        if (settingsRes.data.hotelName) setHotelName(settingsRes.data.hotelName);
      }

      // 2. Fetch QR codes, tables, and Table Categories from backend
      const [qrRes, tableCatsRes, directTablesRes] = await Promise.allSettled([
        api.getQrCodes(),
        api.getTableCategories(),
        api.getRestaurantTables(),
      ]);

      let fetchedQrs: QrCodeItem[] = [];
      let fetchedTables: any[] = [];
      let fetchedCats: any[] = [];

      if (qrRes.status === 'fulfilled' && qrRes.value) {
        const payload = (qrRes.value as any).data || qrRes.value;
        fetchedQrs = Array.isArray(payload) ? payload : (payload.qrCodes || []);
        if (payload.tables && Array.isArray(payload.tables) && payload.tables.length > 0) {
          fetchedTables = payload.tables;
        }
        if (payload.hotelSlug) setHotelSlug(payload.hotelSlug);
        if (payload.hotelName) setHotelName(payload.hotelName);
      }

      if (directTablesRes.status === 'fulfilled' && directTablesRes.value) {
        const payload = (directTablesRes.value as any).data || directTablesRes.value;
        if (Array.isArray(payload) && payload.length > 0) {
          fetchedTables = payload;
        }
      }

      // Check local storage if directTables was empty
      if (fetchedTables.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('aura_restaurant_tables_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              fetchedTables = parsed;
            }
          }
        } catch {}
      }

      // If still empty, use default live tables from Table Board
      if (fetchedTables.length === 0) {
        fetchedTables = [
          { id: 'pool-1', tableNumber: 'POOL - 1', section: 'Poolside Lounge & Bar', capacity: 4 },
          { id: 'pool-2', tableNumber: 'POOL - 2', section: 'Poolside Lounge & Bar', capacity: 2 },
          { id: 'roof-1', tableNumber: 'ROOF - 1', section: 'Skyline Rooftop Terrace', capacity: 2 },
          { id: 'roof-2', tableNumber: 'ROOF - 2', section: 'Skyline Rooftop Terrace', capacity: 4 },
          { id: 'roof-3', tableNumber: 'ROOF - 3', section: 'Skyline Rooftop Terrace', capacity: 4 },
          { id: 't-101', tableNumber: 'T-101', section: 'Indoor Fine Dining', capacity: 2 },
          { id: 't-102', tableNumber: 'T-102', section: 'Indoor Fine Dining', capacity: 4 },
          { id: 't-103', tableNumber: 'T-103', section: 'Indoor Fine Dining', capacity: 4 },
          { id: 't-104', tableNumber: 'T-104', section: 'Indoor Fine Dining', capacity: 6 },
          { id: 'vip-salon', tableNumber: 'VIP - 1', section: 'Private Executive Dining', capacity: 10 },
        ];
      }
      setTables(fetchedTables);

      if (tableCatsRes.status === 'fulfilled' && tableCatsRes.value) {
        const payload = (tableCatsRes.value as any).data || tableCatsRes.value;
        if (Array.isArray(payload) && payload.length > 0) {
          fetchedCats = payload;
          setTableCategories(payload);
        }
      }

      // Automatically synthesize stand cards for every table from Table Board that doesn't have a QR yet
      const existingTableIdsWithQr = new Set(
        fetchedQrs.map((q) => q.tableId || q.tableNumber).filter(Boolean)
      );

      const autoTableQrs: QrCodeItem[] = fetchedTables
        .filter((t: any) => !existingTableIdsWithQr.has(t.id) && !existingTableIdsWithQr.has(t.tableNumber))
        .map((t: any) => ({
          id: `qr-${t.id || t.tableNumber}`,
          codeType: 'TABLE',
          tableId: t.id,
          tableNumber: t.tableNumber,
          label: t.tableNumber,
          section: t.section || 'General Area',
          capacity: t.capacity || 4,
          isActive: true,
          scanCount: 0,
          createdAt: new Date().toISOString(),
          targetUrl: `/menu/${hotelSlug}?tableId=${t.id || t.tableNumber}`,
        }));

      let mergedQrs = [...fetchedQrs, ...autoTableQrs];

      // Ensure Master Restaurant QR exists
      if (!mergedQrs.some((q) => q.codeType === 'RESTAURANT')) {
        mergedQrs = [
          {
            id: 'master-qr',
            codeType: 'RESTAURANT',
            label: 'Main Restaurant Menu',
            isActive: true,
            scanCount: 0,
            createdAt: new Date().toISOString(),
            targetUrl: `/menu/${hotelSlug}`,
          },
          ...mergedQrs,
        ];
      }

      setQrCodes(mergedQrs);

      // 3. Fetch menu products for preview
      try {
        const productsRes = await api.getPOSProducts({ outlet: 'RESTAURANT' });
        if (Array.isArray(productsRes)) {
          setMenuItems(productsRes);
        } else if ((productsRes as any)?.data) {
          setMenuItems((productsRes as any).data);
        }
      } catch (err) {
        // Fallback gracefully
      }
    } catch (err: any) {
      console.error('Failed to load QR menu configuration:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const totalQrs = qrCodes.length;
    const activeQrs = qrCodes.filter((q) => q.isActive).length;
    const totalScans = qrCodes.reduce((sum, q) => sum + (q.scanCount || 0), 0);
    const tableQrsCount = qrCodes.filter((q) => q.codeType === 'TABLE').length;
    const tablesCount = tables.length;
    const hasRestaurantQr = qrCodes.some((q) => q.codeType === 'RESTAURANT');
    return { totalQrs, activeQrs, totalScans, tableQrsCount, tablesCount, hasRestaurantQr };
  }, [qrCodes, tables]);

  // Restaurant-wide QR item
  const restaurantQr = useMemo(() => {
    return qrCodes.find((q) => q.codeType === 'RESTAURANT');
  }, [qrCodes]);

  // Helpers to detect Cabin vs Table
  const isCabinItem = (item: QrCodeItem) => {
    const sec = (item.section || '').toLowerCase();
    const num = (item.tableNumber || '').toLowerCase();
    const lbl = (item.label || '').toLowerCase();
    return sec.includes('cabin') || num.includes('cabin') || lbl.includes('cabin') || num.startsWith('c');
  };

  const getCardBadge = (item: QrCodeItem) => {
    if (item.codeType === 'RESTAURANT') return 'MASTER MENU';
    let raw = (item.tableNumber || item.label || '').trim();
    if (!raw) return 'TABLE 1';

    // Remove any trailing parenthesized section like "(Dining Area)" or "(Cabin Space)"
    raw = raw.replace(/\s*\([^)]*\)\s*$/g, '').trim();

    if (isCabinItem(item)) {
      const clean = raw.replace(/^(cabin\s*)+/i, '').trim();
      return clean ? `CABIN ${clean.toUpperCase()}` : 'CABIN 1';
    }

    // Strip any repeated "table" words from the beginning
    if (/^(table\s*)+/i.test(raw)) {
      const clean = raw.replace(/^(table\s*)+/i, '').trim();
      return clean ? `TABLE ${clean.toUpperCase()}` : 'TABLE 1';
    }

    // Single numbers become "TABLE 1", "TABLE 2"
    if (/^\d+$/.test(raw)) {
      return `TABLE ${raw}`;
    }

    // Distinct named tables like "POOL - 1", "ROOF - 1", "VIP - 1", "T-101" stay clean
    return raw.toUpperCase();
  };

  const getTargetScanUrl = (item: QrCodeItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (item.codeType === 'RESTAURANT') {
      return `${origin}/menu/${hotelSlug}`;
    }
    const badge = getCardBadge(item);
    if (isCabinItem(item)) {
      return `${origin}/menu/${hotelSlug}?tableId=${item.tableId || item.id}&cabin=${encodeURIComponent(badge)}`;
    }
    return `${origin}/menu/${hotelSlug}?tableId=${item.tableId || item.id}&table=${encodeURIComponent(item.tableNumber || '')}`;
  };

  // Filtered Table QRs based on selected Dining Area and search query
  const filteredTableQrs = useMemo(() => {
    return qrCodes
      .filter((q) => q.codeType === 'TABLE')
      .filter((q) => {
        if (selectedSectionFilter !== 'ALL') {
          const qSec = (q.section || 'General Area').trim().toLowerCase();
          const filterSec = selectedSectionFilter.trim().toLowerCase();
          if (qSec !== filterSec) {
            return false;
          }
        }
        if (!qrSearch.trim()) return true;
        const s = qrSearch.toLowerCase();
        return (
          q.label?.toLowerCase().includes(s) ||
          q.tableNumber?.toLowerCase().includes(s) ||
          q.section?.toLowerCase().includes(s) ||
          getCardBadge(q).toLowerCase().includes(s)
        );
      });
  }, [qrCodes, selectedSectionFilter, qrSearch]);

  // Dynamically detect all dining areas matching Table Board:
  // Active areas (with tables/QRs) sorted by table count, followed by registered categories with 0 tables.
  const areaStats = useMemo(() => {
    const counts: Record<string, number> = {};

    // 1. Live tables
    tables.forEach((t: any) => {
      const sec = t.section?.trim() || 'General Area';
      counts[sec] = (counts[sec] || 0) + 1;
    });

    // 2. QR Codes
    qrCodes.forEach((q) => {
      if (q.codeType === 'TABLE' && q.section?.trim()) {
        const sec = q.section.trim();
        counts[sec] = (counts[sec] || 0) + 1;
      }
    });

    // Active dining areas sorted by table count descending
    const active = Object.keys(counts)
      .map((name) => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count);

    // Collect all registered category names across backend, setup master items, or defaults
    const categoryNamesSet = new Set<string>();

    // Standard dining categories matching Table Board and Hotel Setup defaults
    const baseKnownCategories = [
      'Indoor Fine Dining',
      'Skyline Rooftop Terrace',
      'Poolside Lounge & Bar',
      'Private Executive Dining',
      'Dining Hall',
      'Corridor Side',
      'Main Area',
    ];
    baseKnownCategories.forEach((cat) => categoryNamesSet.add(cat));

    // Also include any backend registered categories
    if (Array.isArray(tableCategories) && tableCategories.length > 0) {
      tableCategories.forEach((c: any) => {
        const name = (c.name || c.section || c.title)?.trim();
        if (name) categoryNamesSet.add(name);
      });
    }

    // Dynamic categories from local storage (if user configured them in Hotel Setup)
    if (typeof window !== 'undefined') {
      try {
        const storedCats = localStorage.getItem('hotel_master_table-categories-setup');
        if (storedCats) {
          const parsed = JSON.parse(storedCats);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              const n = (item.name || item.code)?.trim();
              if (n) categoryNamesSet.add(n);
            });
          }
        }
      } catch {}
    }

    // Empty categories: registered areas that currently have 0 tables
    const countsKeysLower = new Set(Object.keys(counts).map((k) => k.toLowerCase()));
    const empty = Array.from(categoryNamesSet)
      .filter((name) => !countsKeysLower.has(name.toLowerCase()))
      .map((name) => ({ name, count: 0 }));

    return { active, empty, all: [...active, ...empty] };
  }, [tables, tableCategories, qrCodes]);

  // Unique dining areas in exact Table Board order
  const allUniqueAreas = useMemo(() => {
    return areaStats.all.map((a) => a.name);
  }, [areaStats]);

  // Full public URL for browser
  const fullPublicMenuUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/menu/${hotelSlug}`;
    }
    return `https://yourdomain.com/menu/${hotelSlug}`;
  }, [hotelSlug]);

  // Copy Public Menu URL to clipboard
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(fullPublicMenuUrl);
      setCopiedLink(true);
      success('Public Menu URL copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.updateQrMenuSettings(settings);
      if (res?.data?.settings) {
        success('QR Menu settings updated successfully!');
      } else {
        success('Settings saved successfully.');
      }
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      error('Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Generate Restaurant-wide QR
  const handleGenerateRestaurantQr = async () => {
    try {
      const res = await api.generateQrCode({
        codeType: 'RESTAURANT',
        customLabel: `${hotelName} - Main Menu`,
      });
      success('Restaurant QR code generated successfully!');
      await loadData(true);
    } catch (err) {
      error('Failed to generate restaurant QR code.');
    }
  };

  // Generate QR for a specific table
  const handleGenerateTableQr = async (tableId: string) => {
    try {
      const res = await api.generateQrCode({
        codeType: 'TABLE',
        tableId: tableId,
      });
      success('Table QR code generated successfully!');
      await loadData(true);
    } catch (err) {
      error('Failed to generate table QR code.');
    }
  };

  // Batch generate for all tables
  const handleGenerateAllTableQrs = async () => {
    setGeneratingAll(true);
    try {
      const res = await api.generateAllTableQrs();
      const count = res?.data?.generatedCount ?? 0;
      success(`Successfully generated ${count} table QR codes!`);
      await loadData(true);
    } catch (err) {
      error('Failed to generate table QR codes.');
    } finally {
      setGeneratingAll(false);
    }
  };

  // Toggle QR Active/Inactive status
  const handleToggleQrStatus = async (item: QrCodeItem) => {
    try {
      const newStatus = !item.isActive;
      await api.toggleQrCodeStatus(item.id, newStatus);
      setQrCodes((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isActive: newStatus } : q))
      );
      success(`QR Code ${newStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      error('Failed to change QR status.');
    }
  };

  // Revoke / Regenerate token
  const handleRevokeQr = async (item: QrCodeItem) => {
    if (!window.confirm(`Revoke and regenerate QR token for "${item.label}"? Existing printed codes will be invalidated immediately.`)) {
      return;
    }
    try {
      await api.revokeQrCode(item.id);
      success('QR token revoked and refreshed with a new secure token.');
      await loadData(true);
    } catch (err) {
      error('Failed to revoke QR code.');
    }
  };

  // Download QR Code as PNG
  const handleDownloadPng = (canvasId: string, filename: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      error('QR Canvas element not ready.');
      return;
    }
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    success(`Downloaded ${filename}.png`);
  };

  // Download All QRs sequentially
  const handleDownloadAllQrs = async () => {
    const allToDownload = [
      ...(restaurantQr ? [restaurantQr] : []),
      ...filteredTableQrs,
    ];
    if (allToDownload.length === 0) {
      info('No QR codes available to download.');
      return;
    }
    success(`Downloading ${allToDownload.length} QR codes...`);
    for (let i = 0; i < allToDownload.length; i++) {
      const item = allToDownload[i];
      const filename = item.codeType === 'RESTAURANT'
        ? 'Restaurant-Master-QR'
        : getCardBadge(item).replace(/\s+/g, '-');
      handleDownloadPng(`qr-canvas-${item.id}`, filename);
      await new Promise((r) => setTimeout(r, 180));
    }
  };

  // Print Tent Card Window with active layout theme
  const handlePrintTentCards = (items: QrCodeItem[]) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      error('Please allow pop-ups to print tent cards.');
      return;
    }

    const cardsHtml = items
      .map((item) => {
        const badgeLabel = getCardBadge(item);
        const canvas = document.getElementById(`qr-canvas-${item.id}`) as HTMLCanvasElement;
        const imgDataUrl = canvas ? canvas.toDataURL('image/png') : '';

        return `
          <div class="tent-card ${cardLayout}">
            <div class="card-inner">
              <div class="header">
                <div class="welcome-text">WELCOME TO</div>
                <div class="hotel-title">${settings.restaurantName || hotelName}</div>
              </div>

              <div class="qr-container">
                <div class="qr-box">
                  <img src="${imgDataUrl}" alt="QR Code" class="qr-img" />
                  <div class="badge-pill">${badgeLabel}</div>
                </div>
              </div>

              <div class="curve-footer">
                <div class="explore-text">EXPLORE OUR MENU</div>
                <div class="powered-text">Powered by Himalayan PMS</div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Menu Stand Cards - ${hotelName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 10px;
              background: #fff;
              color: #111827;
            }
            .cards-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
            .tent-card {
              page-break-inside: avoid;
              background: #ffffff;
              padding: 6px;
            }
            .card-inner {
              border-radius: 24px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
            }

            /* RED CURVE LAYOUT (RestroX Style) */
            .tent-card.red-curve .card-inner,
            .tent-card.emerald-curve .card-inner {
              background: #fafafa;
              border: 1.5px solid #e2e8f0;
              padding-top: 22px;
            }
            .tent-card.red-curve .welcome-text,
            .tent-card.emerald-curve .welcome-text {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #64748b;
              text-transform: uppercase;
            }
            .tent-card.red-curve .hotel-title,
            .tent-card.emerald-curve .hotel-title {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              margin-top: 2px;
              letter-spacing: 0.5px;
              padding: 0 10px;
            }
            .tent-card.red-curve .qr-container,
            .tent-card.emerald-curve .qr-container {
              margin: 18px 0 12px;
            }
            .tent-card.red-curve .qr-box,
            .tent-card.emerald-curve .qr-box {
              position: relative;
              padding: 12px;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.06);
              border: 1px solid #e2e8f0;
              display: inline-block;
            }
            .tent-card.red-curve .qr-img,
            .tent-card.emerald-curve .qr-img {
              width: 170px;
              height: 170px;
              display: block;
            }
            .tent-card.red-curve .badge-pill,
            .tent-card.emerald-curve .badge-pill {
              position: absolute;
              bottom: -11px;
              left: 50%;
              transform: translateX(-50%);
              background: #dc2626;
              color: #ffffff;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 16px;
              border-radius: 9999px;
              letter-spacing: 1px;
              text-transform: uppercase;
              white-space: nowrap;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            }
            .tent-card.red-curve .curve-footer,
            .tent-card.emerald-curve .curve-footer {
              width: 100%;
              background: #dc2626;
              color: #ffffff;
              padding: 18px 12px 14px;
              border-top-left-radius: 40px;
              border-top-right-radius: 40px;
              margin-top: 10px;
            }
            .tent-card.red-curve .explore-text,
            .tent-card.emerald-curve .explore-text {
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 2px;
              color: #ffffff;
              text-transform: uppercase;
            }
            .tent-card.red-curve .powered-text,
            .tent-card.emerald-curve .powered-text {
              font-size: 8px;
              color: rgba(255,255,255,0.9);
              margin-top: 3px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            /* MINIMAL LIGHT LAYOUT */
            .tent-card.minimal-light .card-inner {
              background: #ffffff;
              border: 1.5px solid #0f172a;
              padding: 24px 16px 20px;
            }
            .tent-card.minimal-light .welcome-text {
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #94a3b8;
            }
            .tent-card.minimal-light .hotel-title {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
            }
            .tent-card.minimal-light .qr-container {
              margin: 16px 0;
            }
            .tent-card.minimal-light .qr-box {
              position: relative;
              padding: 10px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              display: inline-block;
            }
            .tent-card.minimal-light .qr-img {
              width: 165px;
              height: 165px;
              display: block;
            }
            .tent-card.minimal-light .badge-pill {
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              background: #0f172a;
              color: #fff;
              font-size: 11px;
              font-weight: 800;
              padding: 3px 14px;
              border-radius: 9999px;
              white-space: nowrap;
            }
            .tent-card.minimal-light .curve-footer {
              margin-top: 10px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              width: 100%;
            }
            .tent-card.minimal-light .explore-text {
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #0f172a;
            }
            .tent-card.minimal-light .powered-text {
              font-size: 8px;
              color: #94a3b8;
              margin-top: 2px;
            }

            /* DARK LUXURY LAYOUT */
            .tent-card.dark-luxury .card-inner {
              background: #090d16;
              border: 1.5px solid #1e293b;
              padding: 22px 14px 14px;
              color: #f8fafc;
            }
            .tent-card.dark-luxury .welcome-text {
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #d97706;
            }
            .tent-card.dark-luxury .hotel-title {
              font-size: 14px;
              font-weight: 900;
              color: #f8fafc;
              margin-top: 2px;
            }
            .tent-card.dark-luxury .qr-container {
              margin: 16px 0;
            }
            .tent-card.dark-luxury .qr-box {
              position: relative;
              padding: 10px;
              background: #fff;
              border-radius: 14px;
              display: inline-block;
            }
            .tent-card.dark-luxury .qr-img {
              width: 165px;
              height: 165px;
              display: block;
            }
            .tent-card.dark-luxury .badge-pill {
              position: absolute;
              bottom: -11px;
              left: 50%;
              transform: translateX(-50%);
              background: #d97706;
              color: #000;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 16px;
              border-radius: 9999px;
              letter-spacing: 1px;
              white-space: nowrap;
            }
            .tent-card.dark-luxury .curve-footer {
              width: 100%;
              background: #022c22;
              color: #ffffff;
              padding: 14px 10px 10px;
              border-top-left-radius: 36px;
              border-top-right-radius: 36px;
              margin-top: 10px;
            }
            .tent-card.dark-luxury .explore-text {
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 2px;
              color: #fbbf24;
            }
            .tent-card.dark-luxury .powered-text {
              font-size: 8px;
              color: #94a3b8;
              margin-top: 2px;
            }

            @media print {
              body { padding: 0; }
              .cards-grid { gap: 8mm; }
            }
          </style>
        </head>
        <body>
          <div class="cards-grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-5 select-none font-sans">
      {/* 1. TOP HEADER (EXACT RESTROX STYLE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            QR Codes
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative w-56 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={qrSearch}
              onChange={(e) => setQrSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-red-500 shadow-2xs"
            />
            {qrSearch && (
              <button
                type="button"
                onClick={() => setQrSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Download All QR Button (Red pill button matching RestroX) */}
          <button
            type="button"
            onClick={handleDownloadAllQrs}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Download all QR codes as images"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All QR</span>
          </button>

          {/* 3-Dot More / Layout Selector Popover */}
          <div className="relative" ref={layoutMenuRef}>
            <button
              type="button"
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-lg border transition cursor-pointer shadow-xs",
                showLayoutMenu
                  ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="QR Layout & More Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showLayoutMenu && (
              <div className="absolute right-0 top-11 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  Select QR Layout
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Option 1: Minimal Light */}
                  <button
                    type="button"
                    onClick={() => {
                      setCardLayout('minimal-light');
                      setShowLayoutMenu(false);
                    }}
                    className={cn(
                      "flex flex-col items-center p-2.5 rounded-xl border text-center transition cursor-pointer relative group",
                      cardLayout === 'minimal-light'
                        ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <div className="w-full h-22 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-between p-2 shadow-2xs">
                      <div className="w-10 h-1 bg-slate-300 rounded-full" />
                      <div className="w-9 h-9 border border-slate-200 rounded-xs flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="w-12 h-2 bg-slate-100 rounded-xs" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 whitespace-nowrap">Light</span>
                    {cardLayout === 'minimal-light' && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">✓</span>
                    )}
                  </button>

                  {/* Option 2: Black / Dark Luxury */}
                  <button
                    type="button"
                    onClick={() => {
                      setCardLayout('dark-luxury');
                      setShowLayoutMenu(false);
                    }}
                    className={cn(
                      "flex flex-col items-center p-2.5 rounded-xl border text-center transition cursor-pointer relative group",
                      cardLayout === 'dark-luxury'
                        ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <div className="w-full h-22 bg-[#18181b] border border-slate-700 rounded-lg flex flex-col items-center justify-between p-2 shadow-2xs">
                      <div className="w-10 h-1 bg-slate-500 rounded-full" />
                      <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-xs flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="w-12 h-2 bg-zinc-900 rounded-xs" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 whitespace-nowrap">Black</span>
                    {cardLayout === 'dark-luxury' && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">✓</span>
                    )}
                  </button>

                  {/* Option 3: Red Brand Curve (RestroX Reference) */}
                  <button
                    type="button"
                    onClick={() => {
                      setCardLayout('red-curve');
                      setShowLayoutMenu(false);
                    }}
                    className={cn(
                      "flex flex-col items-center p-2.5 rounded-xl border text-center transition cursor-pointer relative group",
                      cardLayout === 'red-curve'
                        ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <div className="w-full h-22 bg-[#fafafa] border border-slate-200 rounded-lg flex flex-col items-center justify-between p-1.5 shadow-2xs overflow-hidden">
                      <div className="w-10 h-1 bg-slate-300 rounded-full" />
                      <div className="w-9 h-9 bg-white border border-slate-200 rounded-xs flex items-center justify-center relative shadow-xs">
                        <QrCode className="w-5 h-5 text-slate-800" />
                        <span className="absolute -bottom-1 w-5 h-1 bg-red-600 rounded-full" />
                      </div>
                      <div className="w-full h-4 bg-red-600 -mx-1 -mb-1 rounded-t-lg" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 whitespace-nowrap">Red Curve</span>
                    {cardLayout === 'red-curve' && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">✓</span>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLayoutMenu(false);
                      handlePrintTentCards([
                        ...(restaurantQr && selectedSectionFilter === 'ALL' ? [restaurantQr] : []),
                        ...filteredTableQrs,
                      ]);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Print All Stand Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLayoutMenu(false);
                      setShowSettingsDrawer(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                  >
                    <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Digital Menu Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLayoutMenu(false);
                      handleGenerateAllTableQrs();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Refresh All QR Codes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. AREA SELECTOR DROPDOWN (DYNAMICALLY DETECTS AREAS FROM TABLE BOARD) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative shrink-0" ref={areaDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsAreaDropdownOpen(!isAreaDropdownOpen);
              if (!isAreaDropdownOpen) setAreaSearchQuery('');
            }}
            className="h-9 inline-flex items-center gap-2 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-slate-400 font-normal">Area:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {selectedSectionFilter === 'ALL' ? 'All Dining Areas' : selectedSectionFilter}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', isAreaDropdownOpen && 'rotate-180')} />
          </button>

          {isAreaDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-76 sm:w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
              {/* Search input inside dropdown */}
              <div className="relative flex items-center px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2 pointer-events-none" />
                <input
                  type="text"
                  value={areaSearchQuery}
                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                  placeholder="Search dining area..."
                  autoFocus
                  className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none border-none p-0"
                />
                {areaSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAreaSearchQuery('')}
                    className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                DINING AREAS
              </div>

              <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5 custom-scrollbar">
                {/* All Dining Areas */}
                {(!areaSearchQuery || 'all dining areas'.includes(areaSearchQuery.toLowerCase())) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSectionFilter('ALL');
                      setIsAreaDropdownOpen(false);
                      setAreaSearchQuery('');
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between rounded-lg transition-colors cursor-pointer my-0.5',
                      selectedSectionFilter === 'ALL'
                        ? 'text-red-700 dark:text-red-300 font-bold bg-red-50 dark:bg-red-950/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>All Dining Areas</span>
                    </span>
                    {selectedSectionFilter === 'ALL' && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                  </button>
                )}

                {/* Dynamically detected areas from Table Board */}
                {allUniqueAreas
                  .filter((secName) => !areaSearchQuery || secName.toLowerCase().includes(areaSearchQuery.toLowerCase()))
                  .map((secName) => {
                    const isSelected = selectedSectionFilter.toLowerCase() === secName.toLowerCase();
                    return (
                      <button
                        key={secName}
                        type="button"
                        onClick={() => {
                          setSelectedSectionFilter(secName);
                          setIsAreaDropdownOpen(false);
                          setAreaSearchQuery('');
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between rounded-lg transition-colors cursor-pointer my-0.5',
                          isSelected
                            ? 'text-red-700 dark:text-red-300 font-bold bg-red-50 dark:bg-red-950/30'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{secName}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. STAND CARDS GRID WITH PROFESSIONAL SIZING & SKELETON LOADER */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full max-w-[285px] mx-auto rounded-3xl border border-slate-200/90 bg-white dark:bg-slate-900 p-6 flex flex-col items-center animate-pulse shadow-xs"
            >
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-2" />
              <div className="w-36 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-6" />
              <div className="w-[165px] h-[165px] bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 shadow-2xs" />
              <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-t-2xl mt-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-1">
          {/* Master Restaurant QR Stand Card */}
          {selectedSectionFilter === 'ALL' && (
            <div
              className={cn(
                'w-full max-w-[285px] mx-auto rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center pt-7 relative group',
                cardLayout === 'red-curve' && 'bg-[#fbfbfb] border-slate-200/90',
                cardLayout === 'minimal-light' && 'bg-white border-slate-300',
                cardLayout === 'dark-luxury' && 'bg-[#090d16] border-slate-800 text-white'
              )}
            >
              {/* Top Header */}
              <div className="text-center px-4">
                <p
                  className={cn(
                    'text-[9px] uppercase font-bold tracking-[0.2em]',
                    cardLayout === 'dark-luxury' ? 'text-amber-400' : 'text-slate-400'
                  )}
                >
                  Welcome To
                </p>
                <h3
                  className={cn(
                    'text-xs font-black uppercase tracking-tight mt-0.5 line-clamp-1',
                    cardLayout === 'dark-luxury' ? 'text-slate-100' : 'text-slate-900'
                  )}
                >
                  {settings.restaurantName || hotelName}
                </h3>
              </div>

              {/* QR Canvas Box with Attached Badge */}
              <div className="relative my-4 px-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 relative">
                  {restaurantQr ? (
                    <QRCodeCanvas
                      id={`qr-canvas-${restaurantQr.id}`}
                      value={`${window.location.origin}/menu/${hotelSlug}`}
                      size={165}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-[155px] h-[155px] flex flex-col items-center justify-center p-3 text-center bg-slate-50 rounded-xl">
                      <QrCode className="w-8 h-8 text-slate-300 mb-1" />
                      <button
                        type="button"
                        onClick={handleGenerateRestaurantQr}
                        className="mt-2 text-[10px] font-bold text-rose-600 underline cursor-pointer"
                      >
                        Generate Master
                      </button>
                    </div>
                  )}

                  {/* Attached Pill Badge (Pinned directly below the QR box) */}
                  <div
                    className={cn(
                      'absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-0.5 rounded-full text-xs font-black shadow-md uppercase tracking-wider border-2 border-white',
                      cardLayout === 'red-curve' && 'bg-red-600 text-white',
                      cardLayout === 'minimal-light' && 'bg-slate-900 text-white',
                      cardLayout === 'dark-luxury' && 'bg-zinc-800 text-zinc-100'
                    )}
                  >
                    RECEPTION / MASTER
                  </div>
                </div>
              </div>

              {/* Bottom Accent Curve / Banner */}
              <div
                className={cn(
                  'w-full pt-4 pb-3 px-3 text-center rounded-t-[2.5rem] mt-2',
                  cardLayout === 'red-curve' && 'bg-red-600 text-white',
                  cardLayout === 'minimal-light' && 'bg-slate-100 text-slate-800 border-t border-slate-200',
                  cardLayout === 'dark-luxury' && 'bg-zinc-900 text-zinc-100 border-t border-zinc-800'
                )}
              >
                <p
                  className={cn(
                    'text-[10px] font-black uppercase tracking-[0.2em]',
                    cardLayout === 'red-curve' && 'text-white',
                    cardLayout === 'minimal-light' && 'text-slate-800',
                    cardLayout === 'dark-luxury' && 'text-zinc-200'
                  )}
                >
                  EXPLORE OUR MENU
                </p>
              </div>
              <div
                className={cn(
                  'w-full py-2 text-center text-[9px] font-bold uppercase tracking-wider',
                  cardLayout === 'dark-luxury' ? 'bg-[#18181b] text-zinc-400' : 'bg-white text-slate-500'
                )}
              >
                Powered by <span className="text-red-600 font-black">RestroX</span>
              </div>

              {/* Discreet Floating Action Buttons on Hover */}
              {restaurantQr && (
                <div className="absolute inset-x-3 bottom-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 bg-black/75 backdrop-blur-sm p-1.5 rounded-xl shadow-lg">
                  <button
                    type="button"
                    onClick={() => handlePrintTentCards([restaurantQr])}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                    title="Print Stand Card"
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(`qr-canvas-${restaurantQr.id}`, 'Restaurant-Master-QR')}
                    className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition cursor-pointer"
                    title="Download PNG"
                  >
                    PNG
                  </button>
                  <Link
                    href={`/menu/${hotelSlug}`}
                    target="_blank"
                    className="px-2 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition flex items-center gap-0.5"
                    title="Live Preview"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Table & Cabin Stand Cards */}
          {filteredTableQrs.map((item) => {
            const badgeLabel = getCardBadge(item);
            const targetScanUrl = getTargetScanUrl(item);
            const isCabin = isCabinItem(item);

            return (
              <div
                key={item.id}
                className={cn(
                  'w-full max-w-[285px] mx-auto rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center pt-7 relative group',
                  cardLayout === 'red-curve' && 'bg-[#fbfbfb] border-slate-200/90',
                  cardLayout === 'minimal-light' && 'bg-white border-slate-300',
                  cardLayout === 'dark-luxury' && 'bg-[#090d16] border-slate-800 text-white',
                  !item.isActive && 'opacity-60'
                )}
              >
                {/* Top Header */}
                <div className="text-center px-4">
                  <p
                    className={cn(
                      'text-[9px] uppercase font-bold tracking-[0.2em]',
                      cardLayout === 'dark-luxury' ? 'text-amber-400' : 'text-slate-400'
                    )}
                  >
                    Welcome To
                  </p>
                  <h3
                    className={cn(
                      'text-xs font-black uppercase tracking-tight mt-0.5 line-clamp-1',
                      cardLayout === 'dark-luxury' ? 'text-slate-100' : 'text-slate-900'
                    )}
                  >
                    {settings.restaurantName || hotelName}
                  </h3>
                </div>

                {/* QR Canvas Box with Attached Badge */}
                <div className="relative my-4 px-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 relative">
                    <QRCodeCanvas
                      id={`qr-canvas-${item.id}`}
                      value={targetScanUrl}
                      size={165}
                      level="H"
                      includeMargin={true}
                    />

                    {/* Attached Pill Badge (Pinned directly below the QR box) */}
                    <div
                      className={cn(
                        'absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-0.5 rounded-full text-xs font-black shadow-md uppercase tracking-wider border-2 border-white',
                        cardLayout === 'red-curve' && 'bg-red-600 text-white',
                        cardLayout === 'minimal-light' && 'bg-slate-900 text-white',
                        cardLayout === 'dark-luxury' && 'bg-zinc-800 text-zinc-100'
                      )}
                    >
                      {badgeLabel}
                    </div>
                  </div>
                </div>

                {/* Bottom Accent Curve / Banner */}
                <div
                  className={cn(
                    'w-full pt-4 pb-3 px-3 text-center rounded-t-[2.5rem] mt-2',
                    cardLayout === 'red-curve' && 'bg-red-600 text-white',
                    cardLayout === 'minimal-light' && 'bg-slate-100 text-slate-800 border-t border-slate-200',
                    cardLayout === 'dark-luxury' && 'bg-zinc-900 text-zinc-100 border-t border-zinc-800'
                  )}
                >
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-[0.2em]',
                      cardLayout === 'red-curve' && 'text-white',
                      cardLayout === 'minimal-light' && 'text-slate-800',
                      cardLayout === 'dark-luxury' && 'text-zinc-200'
                    )}
                  >
                    EXPLORE OUR MENU
                  </p>
                </div>
                <div
                  className={cn(
                    'w-full py-2 text-center text-[9px] font-bold uppercase tracking-wider',
                    cardLayout === 'dark-luxury' ? 'bg-[#18181b] text-zinc-400' : 'bg-white text-slate-500'
                  )}
                >
                  Powered by <span className="text-red-600 font-black">RestroX</span>
                </div>

                {/* Discreet Floating Action Buttons on Hover */}
                <div className="absolute inset-x-3 bottom-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 bg-black/75 backdrop-blur-sm p-1.5 rounded-xl shadow-lg">
                  <button
                    type="button"
                    onClick={() => handlePrintTentCards([item])}
                    className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-bold hover:bg-slate-100 transition cursor-pointer"
                    title="Print Stand Card"
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(`qr-canvas-${item.id}`, badgeLabel.replace(/\s+/g, '-'))}
                    className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition cursor-pointer"
                    title="Download PNG"
                  >
                    PNG
                  </button>
                  <Link
                    href={targetScanUrl}
                    target="_blank"
                    className="px-2 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition flex items-center gap-0.5"
                    title="Live Preview"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleQrStatus(item)}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                    className="text-white hover:text-rose-400 p-1 cursor-pointer"
                  >
                    {item.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredTableQrs.length === 0 && selectedSectionFilter !== 'ALL' && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            No dining tables in &ldquo;{selectedSectionFilter}&rdquo; yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tables created under this area on the Table Board page will automatically appear here with their generated QR code stand cards.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedSectionFilter('ALL')}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Show All Dining Areas
            </button>
            <Link
              href="/tables"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Go to Table Board &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER FOR SETTINGS (ZERO UNNECESSARY PARAGRAPHS, PURE TOGGLES) */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Digital Menu Settings
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Minimal Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Public Menu Online</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, isEnabled: !s.isEnabled }))}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.isEnabled ? "bg-emerald-600" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                      settings.isEnabled ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Food Prices</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, showPrices: !s.showPrices }))}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.showPrices ? "bg-emerald-600" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                      settings.showPrices ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Dish Photos</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, showImages: !s.showImages }))}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.showImages ? "bg-emerald-600" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                      settings.showImages ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Descriptions</span>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, showDescriptions: !s.showDescriptions }))}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.showDescriptions ? "bg-emerald-600" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                      settings.showDescriptions ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              {/* Clean Inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Restaurant Display Title</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => setSettings((s) => ({ ...s, restaurantName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Footer Disclaimer</label>
                  <input
                    type="text"
                    value={settings.footerText || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveSettings();
                  setShowSettingsDrawer(false);
                }}
                disabled={savingSettings}
                className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type ActiveTab = 'DASHBOARD' | 'SETTINGS' | 'QR_CODES' | 'PREVIEW';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

      // 2. Fetch QR codes & tables
      const qrRes = (await api.getQrCodes()) as any;
      if (qrRes?.data) {
        setQrCodes(qrRes.data.qrCodes || []);
        setTables(qrRes.data.tables || []);
        if (qrRes.data.hotelSlug) setHotelSlug(qrRes.data.hotelSlug);
        if (qrRes.data.hotelName) setHotelName(qrRes.data.hotelName);
      }

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
      error('Could not load QR menu data. Please try again.');
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

  // Filtered Table QRs
  const filteredTableQrs = useMemo(() => {
    return qrCodes
      .filter((q) => q.codeType === 'TABLE')
      .filter((q) => {
        if (selectedSectionFilter !== 'ALL' && q.section !== selectedSectionFilter) return false;
        if (!qrSearch.trim()) return true;
        const s = qrSearch.toLowerCase();
        return (
          q.label?.toLowerCase().includes(s) ||
          q.tableNumber?.toLowerCase().includes(s) ||
          q.section?.toLowerCase().includes(s)
        );
      });
  }, [qrCodes, selectedSectionFilter, qrSearch]);

  // Unique sections for filtering
  const sectionsList = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.section) set.add(t.section);
    });
    return Array.from(set);
  }, [tables]);

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

  // Print Tent Card Window
  const handlePrintTentCards = (items: QrCodeItem[]) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      error('Please allow pop-ups to print tent cards.');
      return;
    }

    const cardsHtml = items
      .map((item) => {
        const fullUrl = item.codeType === 'RESTAURANT'
          ? `${window.location.origin}/menu/${hotelSlug}`
          : `${window.location.origin}/menu/${hotelSlug}?tableId=${item.tableId}`;

        // Get SVG string from an on-page SVG if available or use canvas
        const canvas = document.getElementById(`qr-canvas-${item.id}`) as HTMLCanvasElement;
        const imgDataUrl = canvas ? canvas.toDataURL('image/png') : '';

        return `
          <div class="tent-card">
            <div class="card-border">
              <div class="header">
                <div class="hotel-title">${settings.restaurantName || hotelName}</div>
                <div class="subtitle">FINE DINING & HOSPITALITY</div>
              </div>

              <div class="qr-box">
                <img src="${imgDataUrl}" alt="QR Code" class="qr-img" />
              </div>

              <div class="table-badge">
                ${item.codeType === 'TABLE' ? `TABLE ${item.tableNumber || ''} &bull; ${item.section || 'DINING'}` : 'RESTAURANT DIGITAL MENU'}
              </div>

              <div class="callout">
                <div class="callout-main">Scan to View Our Digital Menu</div>
                <div class="callout-sub">Open your smartphone camera &bull; No app install required</div>
              </div>

              <div class="footer">
                ${item.capacity ? `<span>Seating: ${item.capacity} Guests</span> &bull; ` : ''}
                <span>Powered by Himalayan PMS</span>
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
          <title>Print QR Menu Tent Cards - ${hotelName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
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
              gap: 20px;
            }
            .tent-card {
              border: 1px dashed #9ca3af;
              padding: 12px;
              page-break-inside: avoid;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            .card-border {
              border: 2px solid #0f3e30;
              border-radius: 12px;
              padding: 24px 18px;
              width: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .hotel-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f3e30;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 10px;
              letter-spacing: 2px;
              color: #4b5563;
              margin-top: 2px;
              font-weight: 600;
            }
            .qr-box {
              margin: 18px 0;
              padding: 10px;
              background: #ffffff;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              display: inline-block;
            }
            .qr-img {
              width: 170px;
              height: 170px;
              display: block;
            }
            .table-badge {
              display: inline-block;
              background: #0f3e30;
              color: #ffffff;
              font-size: 13px;
              font-weight: 700;
              padding: 5px 14px;
              border-radius: 9999px;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .callout-main {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
            }
            .callout-sub {
              font-size: 11px;
              color: #6b7280;
              margin-top: 3px;
            }
            .footer {
              margin-top: 14px;
              font-size: 9px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            @media print {
              body { padding: 0; }
              .cards-grid { gap: 12mm; }
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
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-50/70 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md shadow-emerald-950/15 flex-shrink-0">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  QR Digital Menu
                </h1>
                <span className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold rounded-full border",
                  settings.isEnabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {settings.isEnabled ? 'Active & Live' : 'Menu Disabled'}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
                Generate contactless QR codes for your tables & restaurant, customize food display settings, and provide guests with an instantaneous mobile digital menu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={cn("w-4 h-4 text-slate-500", refreshing && "animate-spin")} />
              Sync
            </button>
            <Link
              href={`/menu/${hotelSlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 rounded-xl hover:bg-emerald-100/70 transition shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Public Menu
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {[
            { id: 'DASHBOARD', label: 'Overview & Stats', icon: LayoutDashboard },
            { id: 'SETTINGS', label: 'Menu Settings', icon: Sliders },
            { id: 'QR_CODES', label: 'Manage QR Codes', icon: QrCode, badge: qrCodes.length },
            { id: 'PREVIEW', label: 'Live Mobile Preview', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/15'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-400' : 'text-slate-400')} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-slate-700 text-emerald-300' : 'bg-slate-200 text-slate-600'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD / OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Public Status</p>
                <p className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  {settings.isEnabled ? 'Enabled' : 'Disabled'}
                  <span className={cn('w-2.5 h-2.5 rounded-full', settings.isEnabled ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-rose-500 ring-4 ring-rose-100')} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {settings.isEnabled ? 'Visible to customers online' : 'Turned off by manager'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total QR Codes</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalQrs}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeQrs} active & scannable
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Table QR Coverage</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {stats.tableQrsCount} <span className="text-sm font-normal text-slate-400">/ {stats.tablesCount} Tables</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.tableQrsCount === stats.tablesCount ? '100% tables covered' : `${stats.tablesCount - stats.tableQrsCount} pending generation`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Guest Scans</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalScans}</p>
                <p className="text-xs text-slate-500 mt-1">Logged server-side securely</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Public Menu URL Banner Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
              <QrCode className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Live Single Source of Truth Menu
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Restaurant Digital Menu Public Link
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Customers can access this URL directly or scan table QR codes. No app install or login required. All categories and dishes sync in real-time from your existing Menu Management module.
              </p>

              {/* URL Display & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-sm font-mono flex-1 overflow-x-auto">
                  <span className="text-slate-500 select-none">URL:</span>
                  <span className="text-emerald-400 font-semibold">{fullPublicMenuUrl}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-md shadow-emerald-950/30"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copied Link' : 'Copy Public URL'}
                </button>
                <Link
                  href={`/menu/${hotelSlug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition border border-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Live
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">QR Menu Settings</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Toggle prices, food images, descriptions, restaurant banner, welcome greeting and public currency.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className="mt-4 inline-flex items-center text-xs font-bold text-emerald-800 hover:text-emerald-900"
              >
                Configure Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Table QR Generation</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Generate table-wise QR codes, download print-ready acrylic tent cards, and manage individual table tokens.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('QR_CODES')}
                className="mt-4 inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                Manage QR Codes <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Live Mobile Preview</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Simulate the exact smartphone experience of your guests when they scan table or main restaurant QR codes.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('PREVIEW')}
                className="mt-4 inline-flex items-center text-xs font-bold text-purple-700 hover:text-purple-800"
              >
                Open Mobile Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QR MENU SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">QR Digital Menu Settings</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Configure what information your customers see when scanning QR codes in your restaurant.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-sm transition disabled:opacity-60"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Display Toggles & Visibility */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-800" />
                Customer View & Visibility Toggles
              </h3>

              {/* Master Enable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Enable Public Digital Menu</p>
                  <p className="text-xs text-slate-500">
                    When turned off, guests who scan QR codes will see a friendly &ldquo;Menu Temporarily Offline&rdquo; message.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, isEnabled: !s.isEnabled }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    settings.isEnabled ? "bg-emerald-800" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.isEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Show / Hide Prices */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Show Food Prices</p>
                  <p className="text-xs text-slate-500">
                    Display item and portion prices (e.g. Half / Full / Regular). Turn off for menu showcase without prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, showPrices: !s.showPrices }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    settings.showPrices ? "bg-emerald-800" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.showPrices ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Show / Hide Images */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Show Food Images</p>
                  <p className="text-xs text-slate-500">
                    Display dish photos in customer menu cards. If disabled, clean minimalist text cards will be rendered.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, showImages: !s.showImages }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    settings.showImages ? "bg-emerald-800" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.showImages ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Show / Hide Descriptions */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Show Food Descriptions</p>
                  <p className="text-xs text-slate-500">
                    Display ingredients, flavor notes and allergen info under each menu item.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, showDescriptions: !s.showDescriptions }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    settings.showDescriptions ? "bg-emerald-800" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      settings.showDescriptions ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Future Architecture: Online Ordering Notice Card */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Online Table Ordering
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Disabled by Default
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  In accordance with enterprise security guidelines, contactless online ordering is currently turned off. Customers use the digital menu for browsing and ordering directly with restaurant staff. The underlying architecture is prepared to enable contactless ordering in a future release.
                </p>
              </div>
            </div>

            {/* Right Column: Restaurant Branding & Text Information */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-800" />
                Restaurant Branding & Public Content
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Public Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) => setSettings((s) => ({ ...s, restaurantName: e.target.value }))}
                  placeholder="e.g. Himalayan Hotel & Fine Dining"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings((s) => ({ ...s, currencySymbol: e.target.value }))}
                  placeholder="Rs. or $"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Restaurant Logo URL
                </label>
                <input
                  type="url"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, logoUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/... or /logo.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cover Banner Image URL
                </label>
                <input
                  type="url"
                  value={settings.coverImageUrl || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, coverImageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-... (cover image for header banner)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Welcome Greeting / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={settings.welcomeMessage || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, welcomeMessage: e.target.value }))}
                  placeholder="Greeting shown to customers at the top of the menu..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Footer / Disclaimer Text
                </label>
                <textarea
                  rows={2}
                  value={settings.footerText || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
                  placeholder="Taxes, service charge details, allergy notices..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GENERATE & MANAGE QR CODES */}
      {/* ========================================================================= */}
      {activeTab === 'QR_CODES' && (
        <div className="space-y-8">
          {/* Section A: Restaurant-Wide QR Code */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1">
                  General Restaurant QR
                </div>
                <h2 className="text-xl font-bold text-slate-900">Main Restaurant QR Code</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  One master QR code for the entire dining hall, entrance lobby, takeaway counter or social media.
                </p>
              </div>

              {!restaurantQr ? (
                <button
                  onClick={handleGenerateRestaurantQr}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-sm transition"
                >
                  <QrCode className="w-4 h-4" />
                  Generate Restaurant QR
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleDownloadPng(`qr-canvas-${restaurantQr.id}`, `restaurant-qr-${hotelSlug}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Download PNG
                  </button>
                  <button
                    onClick={() => handlePrintTentCards([restaurantQr])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Display Card
                  </button>
                  <button
                    onClick={() => handleRevokeQr(restaurantQr)}
                    title="Regenerate secure token (invalidates old code)"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-700 text-xs font-semibold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate Token
                  </button>
                </div>
              )}
            </div>

            {restaurantQr ? (
              <div className="flex flex-col md:flex-row items-center gap-7 pt-6">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex-shrink-0">
                  <QRCodeCanvas
                    id={`qr-canvas-${restaurantQr.id}`}
                    value={`${window.location.origin}/menu/${hotelSlug}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-3 flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <span className="font-bold text-slate-900 text-lg">{restaurantQr.label}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold border",
                      restaurantQr.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      {restaurantQr.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Target URL: <span className="font-mono text-emerald-800 font-semibold">{window.location.origin}/menu/{hotelSlug}</span>
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500 pt-1">
                    <span>Scans: <strong className="text-slate-800">{restaurantQr.scanCount || 0}</strong></span>
                    <span>&bull;</span>
                    <span>Created: {new Date(restaurantQr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No restaurant-wide QR code generated yet. Click &ldquo;Generate Restaurant QR&rdquo; above.
              </div>
            )}
          </div>

          {/* Section B: Table-Wise QR Codes */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1">
                  Table-Wise Tent Cards
                </div>
                <h2 className="text-xl font-bold text-slate-900">Individual Table QR Codes</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Each QR code opens the digital menu pre-associated with the customer&rsquo;s specific table.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleGenerateAllTableQrs}
                  disabled={generatingAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-60"
                >
                  <Sparkles className={cn("w-4 h-4", generatingAll && "animate-spin")} />
                  {generatingAll ? 'Generating...' : 'Generate All Table QRs'}
                </button>
                {filteredTableQrs.length > 0 && (
                  <button
                    onClick={() => handlePrintTentCards(filteredTableQrs)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    Print All Tent Cards ({filteredTableQrs.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={qrSearch}
                  onChange={(e) => setQrSearch(e.target.value)}
                  placeholder="Search table number or area..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedSectionFilter('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition',
                    selectedSectionFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  All Areas ({qrCodes.filter(q => q.codeType === 'TABLE').length})
                </button>
                {sectionsList.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSectionFilter(sec)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition',
                      selectedSectionFilter === sec
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Tables QR Grid */}
            {filteredTableQrs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
                {filteredTableQrs.map((item) => {
                  const targetScanUrl = `${window.location.origin}/menu/${hotelSlug}?tableId=${item.tableId}`;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-2xl border p-5 bg-white transition hover:shadow-md flex flex-col justify-between space-y-4",
                        item.isActive ? "border-slate-200/90" : "border-slate-200 bg-slate-50/50 opacity-75"
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-lg tracking-tight">
                              Table {item.tableNumber || '—'}
                            </h3>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              item.isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-500"
                            )}>
                              {item.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {item.section || 'General Area'} &bull; {item.capacity ? `${item.capacity} Seats` : 'Dining'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleQrStatus(item)}
                          title={item.isActive ? "Deactivate QR" : "Activate QR"}
                          className="text-slate-400 hover:text-slate-700 transition"
                        >
                          {item.isActive ? (
                            <ToggleRight className="w-6 h-6 text-emerald-800" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* QR Visual */}
                      <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-100 shadow-inner">
                        <QRCodeCanvas
                          id={`qr-canvas-${item.id}`}
                          value={targetScanUrl}
                          size={140}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      {/* Footer Stats & Actions */}
                      <div className="space-y-3 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Scans: <strong className="text-slate-800">{item.scanCount || 0}</strong></span>
                          <button
                            onClick={() => handleRevokeQr(item)}
                            title="Regenerate secure token"
                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Revoke
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleDownloadPng(`qr-canvas-${item.id}`, `Table-${item.tableNumber}-${item.section}`)}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            PNG
                          </button>
                          <button
                            onClick={() => handlePrintTentCards([item])}
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-bold text-sm">No Table QR Codes Found</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Click &ldquo;Generate All Table QRs&rdquo; to automatically create cryptographically secure QR codes for every restaurant table.
                </p>
                <button
                  onClick={handleGenerateAllTableQrs}
                  disabled={generatingAll}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate All Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE MOBILE PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'PREVIEW' && (
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Controls Bar */}
          <div className="w-full max-w-xl bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Context:</span>
              <select
                value={previewTableSelection}
                onChange={(e) => setPreviewTableSelection(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-800"
              >
                <option value="RESTAURANT">Restaurant Wide (General Menu)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={
                previewTableSelection === 'RESTAURANT'
                  ? `/menu/${hotelSlug}`
                  : `/menu/${hotelSlug}?tableId=${previewTableSelection}`
              }
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Fullscreen in New Window
            </Link>
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="relative w-full max-w-[390px] h-[780px] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-12 ring-slate-800/60 overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Simulated Mobile Screen (Iframe or direct view) */}
            <div className="w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col relative z-20">
              <iframe
                src={
                  previewTableSelection === 'RESTAURANT'
                    ? `/menu/${hotelSlug}`
                    : `/menu/${hotelSlug}?tableId=${previewTableSelection}`
                }
                title="Customer Digital Menu Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

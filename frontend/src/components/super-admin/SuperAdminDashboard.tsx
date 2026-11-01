'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  UtensilsCrossed,
  Receipt,
  ShieldCheck,
  BarChart3,
  FileText,
  AlertTriangle,
  Users,
  Search,
  Menu,
  X,
  RefreshCw,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Lock,
  Unlock,
  SlidersHorizontal,
  Layers,
  Plus,
  Hotel,
  ArrowLeftRight,
  Download,
  ExternalLink,
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Database,
  ArrowLeft,
  Calendar,
  Check,
  Filter,
  DollarSign,
  Coffee,
  BedDouble,
  CreditCard,
  PhoneCall,
  UserCheck,
  CheckSquare,
  Globe,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  TrendingDown,
  Gem,
  Gift,
  MessageSquare,
  Camera,
  Upload,
  Pencil,
  Handshake,
  Store,
  Copy,
  Banknote,
  Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import {
  RoomWithDetails,
  ReservationData,
  TableReservationData,
  BillData,
  POSProductData,
  DashboardMetrics,
} from '@/lib/types';

// Super Admin Navigation Tabs
export type SuperAdminActiveTab =
  | 'dashboard'
  | 'client'
  | 'billing-setup'
  | 'client-billing'
  | 'receipt'
  | 'copy-test'
  | 'credit-approver'
  | 'billing-analysis'
  | 'generate-bill'
  | 'error-log'
  | 'refer-earn'
  | 'online-support';

export interface ClientRecord {
  id: string;
  clientCode: string; // Hotel Code e.g. "104"
  identifier: string; // Hotel Identifier e.g. "RAC"
  name: string; // Hotel Name e.g. "RHEUMATOLOGY AND ARTHRITIS CENTER"
  username: string; // Users e.g. "adminrac"
  email: string; // Email e.g. "rac@gmail.com"
  phone: string; // Hotel Phone e.g. "9817605348"
  address: string; // Address e.g. "Kamal Pokhari"
  currentDate: string; // Current Date e.g. "2021-09-26"
  isDeactivated: boolean; // Is Deactivated: false | true
  propertyType: string;
  contactPerson: string;
  location: string;
  totalRooms: number;
  totalTables: number;
  plan: string;
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'SUSPENDED' | 'DISABLED';
  joinedDate: string;
  nextRenewalDate: string;
  annualFee: number;
}

export interface ClientBillingRecord {
  id: string;
  invoiceNo: string;
  clientCode: string;
  clientName: string;
  plan: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export const SuperAdminDashboard: React.FC = () => {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<SuperAdminActiveTab>('client');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(true);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [fiscalYear, setFiscalYear] = useState('FY- 2081/82');

  // Company Logo State (allows uploading custom company logo)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('superadmin_company_logo');
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }
    } catch {}
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File Too Large', 'Please select a logo image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCompanyLogo(result);
        try {
          localStorage.setItem('superadmin_company_logo', result);
        } catch {}
        toast.success('Company Logo Saved', 'Your custom company logo has been updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Client Master State (Matching User's Reference Screenshot)
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilterStatus, setClientFilterStatus] = useState<'ACTIVE' | 'DISABLED' | 'ALL'>('ACTIVE');
  const [clientEntriesPerPage, setClientEntriesPerPage] = useState<number>(10);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Client Page Form Modal State (Matching User's Reference Screenshot & Hotel System Fields)
  const [formHotelName, setFormHotelName] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formHotelCode, setFormHotelCode] = useState('');
  const [formUsername, setFormUsername] = useState('admin');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCurrentDate, setFormCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formIsDeactivated, setFormIsDeactivated] = useState(false);
  const [formPropertyType, setFormPropertyType] = useState('Hotel & Resort');
  const [formRooms, setFormRooms] = useState(25);
  const [formPlan, setFormPlan] = useState('Enterprise Cloud');
  const [formFee, setFormFee] = useState(150000);

  // Client Billing State
  const [billingSearch, setBillingSearch] = useState('');
  const [billingFilterStatus, setBillingFilterStatus] = useState<string>('ALL');
  const [billingEntriesPerPage, setBillingEntriesPerPage] = useState<number>(10);
  const [selectedClientBillingForPayment, setSelectedClientBillingForPayment] = useState<ClientBillingRecord | null>(null);

  // Refer & Support Modals
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Clients Database (empty initial state, persists to localStorage when added)
  const [clients, setClients] = useState<ClientRecord[]>([]);

  // Client Billing Database (empty initial state, persists to localStorage when added)
  const [clientBilling, setClientBilling] = useState<ClientBillingRecord[]>([]);

  // Load any previously added clients from localStorage
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem('superadmin_clients');
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
      const savedBilling = localStorage.getItem('superadmin_client_billing');
      if (savedBilling) {
        setClientBilling(JSON.parse(savedBilling));
      }
    } catch {}
  }, []);

  // Dynamic Data State
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [hotelProfile, setHotelProfile] = useState<any>(null);

  // Payment Settlement State
  const [isSettlePaymentModalOpen, setIsSettlePaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchAllData = useCallback(async (showToastNotice = false) => {
    try {
      setIsRefreshing(true);
      const hotelRes = await api.getHotelProfile().catch(() => null);
      if (hotelRes) setHotelProfile(hotelRes);

      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (showToastNotice) {
        toast.success('Live Data Synced', 'Super Admin master records refreshed.');
      }
    } catch {
      // non-blocking
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData(false);
    setCurrentDateStr(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );
  }, [fetchAllData]);

  // Filtered Clients (Matching User's Reference Screenshot)
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = (menuSearchQuery || clientSearch).trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.identifier && c.identifier.toLowerCase().includes(q)) ||
        (c.clientCode && c.clientCode.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q));

      let matchesStatus = true;
      if (clientFilterStatus === 'ACTIVE') {
        matchesStatus = !c.isDeactivated;
      } else if (clientFilterStatus === 'DISABLED') {
        matchesStatus = Boolean(c.isDeactivated);
      }
      return matchesSearch && matchesStatus;
    });
  }, [clients, menuSearchQuery, clientSearch, clientFilterStatus]);

  // Filtered Client Billing
  const filteredClientBilling = useMemo(() => {
    return clientBilling.filter((b) => {
      const q = (menuSearchQuery || billingSearch).toLowerCase();
      const matchesSearch =
        b.clientName.toLowerCase().includes(q) ||
        b.invoiceNo.toLowerCase().includes(q) ||
        b.clientCode.toLowerCase().includes(q) ||
        b.plan.toLowerCase().includes(q);
      const matchesStatus = billingFilterStatus === 'ALL' || b.paymentStatus === billingFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clientBilling, menuSearchQuery, billingSearch, billingFilterStatus]);

  const handleOpenClientBillingSettleModal = (record: ClientBillingRecord) => {
    setSelectedClientBillingForPayment(record);
    setPaymentAmount(record.balanceDue);
    setPaymentMethod('UPI');
    setPaymentNotes('SaaS License Renewal Payment');
    setIsSettlePaymentModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientBillingForPayment || paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const updated = clientBilling.map((b) => {
        if (b.id === selectedClientBillingForPayment.id) {
          const newPaid = b.amountPaid + paymentAmount;
          const newBalance = Math.max(0, b.amount - newPaid);
          return {
            ...b,
            amountPaid: newPaid,
            balanceDue: newBalance,
            paymentStatus: (newBalance === 0 ? 'PAID' : 'PARTIAL') as 'PAID' | 'PARTIAL' | 'UNPAID',
            paymentMethod,
          };
        }
        return b;
      });
      setClientBilling(updated);
      try {
        localStorage.setItem('superadmin_client_billing', JSON.stringify(updated));
      } catch {}

      toast.success(
        'Payment Recorded',
        `Rs. ${paymentAmount.toLocaleString()} recorded for ${selectedClientBillingForPayment.clientName}.`
      );
      setIsSettlePaymentModalOpen(false);
      setSelectedClientBillingForPayment(null);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Client Modal Open Handlers
  const handleOpenAddClient = () => {
    setEditingClient(null);
    setFormHotelName('');
    setFormIdentifier('');
    setFormHotelCode(String(100 + clients.length + 1));
    setFormUsername('admin');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormCurrentDate(new Date().toISOString().split('T')[0]);
    setFormIsDeactivated(false);
    setFormPropertyType('Hotel & Resort');
    setFormRooms(25);
    setFormPlan('Enterprise Cloud');
    setFormFee(150000);
    setIsNewClientModalOpen(true);
  };

  const handleOpenEditClient = (client: ClientRecord) => {
    setEditingClient(client);
    setFormHotelName(client.name);
    setFormIdentifier(client.identifier || client.clientCode);
    setFormHotelCode(client.clientCode);
    setFormUsername(client.username || 'admin');
    setFormEmail(client.email || '');
    setFormPhone(client.phone || '');
    setFormAddress(client.address || client.location || '');
    setFormCurrentDate(client.currentDate || client.joinedDate || new Date().toISOString().split('T')[0]);
    setFormIsDeactivated(Boolean(client.isDeactivated));
    setFormPropertyType(client.propertyType || 'Hotel & Resort');
    setFormRooms(client.totalRooms || 25);
    setFormPlan(client.plan || 'Enterprise Cloud');
    setFormFee(client.annualFee || 150000);
    setIsNewClientModalOpen(true);
  };

  const handleToggleClientStatus = (clientId: string) => {
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        const nextDeactivated = !c.isDeactivated;
        return {
          ...c,
          isDeactivated: nextDeactivated,
          status: nextDeactivated ? ('DISABLED' as const) : ('ACTIVE' as const),
        };
      }
      return c;
    });
    setClients(updated);
    try {
      localStorage.setItem('superadmin_clients', JSON.stringify(updated));
    } catch {}
    toast.success('Status Updated', 'Client active / deactivated status toggled.');
  };

  const handleSyncUsers = (client: ClientRecord) => {
    toast.success('Users Synced', `User credentials and roles synchronized for ${client.name}.`);
  };

  const handleClientDN = (client: ClientRecord) => {
    toast.info('Client Master Info', `Code: ${client.clientCode} · Identifier: ${client.identifier || client.clientCode} · Active: ${!client.isDeactivated}`);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHotelName || !formPhone) {
      toast.error('Missing Required Fields', 'Please complete Hotel Name and Phone Number.');
      return;
    }

    const code = formHotelCode || String(100 + clients.length + 1);
    const identifier = formIdentifier.toUpperCase() || code;
    const today = formCurrentDate || new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (editingClient) {
      const updated = clients.map((c) => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            name: formHotelName,
            identifier,
            clientCode: code,
            username: formUsername || 'admin',
            email: formEmail || `${formUsername}@hotel.com`,
            phone: formPhone,
            address: formAddress,
            location: formAddress,
            currentDate: today,
            isDeactivated: formIsDeactivated,
            status: formIsDeactivated ? ('DISABLED' as const) : ('ACTIVE' as const),
            propertyType: formPropertyType,
            totalRooms: Number(formRooms) || 20,
            plan: formPlan,
            annualFee: Number(formFee) || 120000,
          };
        }
        return c;
      });
      setClients(updated);
      try {
        localStorage.setItem('superadmin_clients', JSON.stringify(updated));
      } catch {}
      toast.success('Client Updated', `${formHotelName} updated successfully.`);
    } else {
      const newId = `cl-${Date.now()}`;
      const newClient: ClientRecord = {
        id: newId,
        clientCode: code,
        identifier,
        name: formHotelName,
        username: formUsername || 'admin',
        email: formEmail || `${formUsername}@hotel.com`,
        phone: formPhone,
        address: formAddress || 'Nepal',
        location: formAddress || 'Nepal',
        contactPerson: formUsername,
        currentDate: today,
        isDeactivated: formIsDeactivated,
        status: formIsDeactivated ? 'DISABLED' : 'ACTIVE',
        propertyType: formPropertyType,
        totalRooms: Number(formRooms) || 20,
        totalTables: 8,
        plan: formPlan,
        joinedDate: today,
        nextRenewalDate: nextYear,
        annualFee: Number(formFee) || 120000,
      };

      const newInvoice: ClientBillingRecord = {
        id: `cb-${Date.now()}`,
        invoiceNo: `INV-2026-${String(80 + clientBilling.length + 1).padStart(3, '0')}`,
        clientCode: code,
        clientName: formHotelName,
        plan: `${formPlan} (Annual)`,
        billingPeriod: `${today} - ${nextYear}`,
        issueDate: today,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Number(formFee) || 120000,
        amountPaid: 0,
        balanceDue: Number(formFee) || 120000,
        paymentStatus: 'UNPAID',
      };

      const updatedClients = [newClient, ...clients];
      const updatedBilling = [newInvoice, ...clientBilling];
      setClients(updatedClients);
      setClientBilling(updatedBilling);
      try {
        localStorage.setItem('superadmin_clients', JSON.stringify(updatedClients));
        localStorage.setItem('superadmin_client_billing', JSON.stringify(updatedBilling));
      } catch {}

      toast.success('Client Added', `${formHotelName} (${code}) added to Master directory.`);
    }

    setIsNewClientModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F3F7] dark:bg-[#07131D] text-slate-800 dark:text-slate-100 flex flex-row font-sans transition-colors duration-200 antialiased overflow-hidden">
      {/* =========================================================================
          LEFT SIDEBAR: RED, BLACK & BLUE COLOR PATTERN
          - Top: Company Logo Header
          - Body: Deep Black (#0D0E12)
          - Search menu
          - DashBoard (Blue accent)
          - Master -> Client, Client Billing
          - Refer & Earn (Red accent)
          - Online Support (Blue accent)
         ========================================================================= */}
      <aside
        className={cn(
          'flex flex-col bg-[#0D0E12] text-slate-100 transition-all duration-300 z-30 select-none shrink-0 shadow-xl border-r border-[#1C1F28]',
          isSidebarOpen ? 'w-56 sm:w-60' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
        )}
      >
        {/* =====================================================================
            1. COMPANY LOGO HEADER (Top of Sidebar with Red, Black & Blue branding)
           ===================================================================== */}
        <div className="h-14 sm:h-15 px-3 bg-white dark:bg-[#0D0E12] border-b border-slate-200 dark:border-[#1C1F28] flex items-center justify-between shrink-0 relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />

          {companyLogo ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer w-full h-full py-1"
              title="Click to change Company Logo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogo}
                alt="Company Logo"
                className="max-h-10 max-w-[170px] object-contain"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer w-full"
              title="Click to upload your custom Company Logo"
            >
              <div className="flex items-center gap-2 select-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0D0E12] border border-[#252A36] text-white shadow-2xs">
                  <Hotel className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex items-center">
                  <span className="text-black dark:text-white font-black text-xl tracking-tight font-heading">
                    hotel
                  </span>
                  <span className="text-[#DC2626] font-black text-xl ml-0.5">+</span>
                  <span className="text-[#2563EB] font-bold text-xs uppercase tracking-wider ml-1 mt-1">
                    master
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick upload trigger button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload / Change Company Logo"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#DC2626] cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =====================================================================
            2. SEARCH MENU (Obsidian Black Input with Blue focus)
           ===================================================================== */}
        <div className="p-2.5 border-b border-[#1C1F28]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full h-8 pl-8 pr-2 text-xs rounded-sm bg-[#161820] border border-[#252836] text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* =====================================================================
            3. SIDEBAR NAVIGATION ITEMS (DashBoard, Master, Refer, Support)
           ===================================================================== */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 text-xs font-medium">
          {/* Item 1: DashBoard (Gem icon in Blue) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer',
              activeTab === 'dashboard'
                ? 'bg-[#181B24] text-blue-400 font-bold border-l-3 border-[#2563EB]'
                : 'text-slate-300 hover:bg-[#161820] hover:text-white'
            )}
          >
            <Gem className="w-4 h-4 text-blue-400 shrink-0" />
            <span>DashBoard</span>
          </button>

          {/* Item 2: Master (Database icon) */}
          <div>
            <button
              type="button"
              onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors cursor-pointer',
                ['client', 'billing-setup', 'client-billing', 'receipt', 'copy-test', 'credit-approver', 'billing-analysis', 'generate-bill', 'error-log'].includes(activeTab)
                  ? 'bg-[#181B24] text-white font-bold'
                  : 'text-slate-300 hover:bg-[#161820] hover:text-white'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Master</span>
              </div>
              {isMasterMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Suboptions under Master: 9 items with left icons and no numbers matching Reference Screenshot */}
            {isMasterMenuOpen && (
              <div className="bg-[#101217] py-1 space-y-0.5">
                {/* 1. Client */}
                <button
                  onClick={() => setActiveTab('client')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'client'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Handshake className={cn("w-4 h-4 shrink-0", activeTab === 'client' ? "text-blue-400" : "text-slate-400")} />
                  <span>Client</span>
                </button>

                {/* 2. BillingSetup */}
                <button
                  onClick={() => setActiveTab('billing-setup')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'billing-setup'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Store className={cn("w-4 h-4 shrink-0", activeTab === 'billing-setup' ? "text-blue-400" : "text-slate-400")} />
                  <span>BillingSetup</span>
                </button>

                {/* 3. Client Billing */}
                <button
                  onClick={() => setActiveTab('client-billing')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'client-billing'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <CreditCard className={cn("w-4 h-4 shrink-0", activeTab === 'client-billing' ? "text-blue-400" : "text-slate-400")} />
                  <span>Client Billing</span>
                </button>

                {/* 4. Receipt */}
                <button
                  onClick={() => setActiveTab('receipt')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'receipt'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Receipt className={cn("w-4 h-4 shrink-0", activeTab === 'receipt' ? "text-blue-400" : "text-slate-400")} />
                  <span>Receipt</span>
                </button>

                {/* 5. Copy Test */}
                <button
                  onClick={() => setActiveTab('copy-test')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'copy-test'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Copy className={cn("w-4 h-4 shrink-0", activeTab === 'copy-test' ? "text-blue-400" : "text-slate-400")} />
                  <span>Copy Test</span>
                </button>

                {/* 6. Credit Approver */}
                <button
                  onClick={() => setActiveTab('credit-approver')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'credit-approver'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <ShieldCheck className={cn("w-4 h-4 shrink-0", activeTab === 'credit-approver' ? "text-blue-400" : "text-slate-400")} />
                  <span>Credit Approver</span>
                </button>

                {/* 7. Billing Analysis */}
                <button
                  onClick={() => setActiveTab('billing-analysis')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'billing-analysis'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <BarChart3 className={cn("w-4 h-4 shrink-0", activeTab === 'billing-analysis' ? "text-blue-400" : "text-slate-400")} />
                  <span>Billing Analysis</span>
                </button>

                {/* 8. Generate Bill */}
                <button
                  onClick={() => setActiveTab('generate-bill')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'generate-bill'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Banknote className={cn("w-4 h-4 shrink-0", activeTab === 'generate-bill' ? "text-blue-400" : "text-slate-400")} />
                  <span>Generate Bill</span>
                </button>

                {/* 9. Error Log */}
                <button
                  onClick={() => setActiveTab('error-log')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-5 py-2 text-[11px] font-medium text-left transition-colors cursor-pointer',
                    activeTab === 'error-log'
                      ? 'bg-[#181B24] text-white font-bold border-l-3 border-[#2563EB]'
                      : 'text-slate-300 hover:bg-[#161820] hover:text-white'
                  )}
                >
                  <Bug className={cn("w-4 h-4 shrink-0", activeTab === 'error-log' ? "text-blue-400" : "text-slate-400")} />
                  <span>Error Log</span>
                </button>
              </div>
            )}
          </div>

          {/* Item 3: Refer & Earn (Gift icon in Red) */}
          <button
            onClick={() => setIsReferModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-slate-300 hover:bg-[#161820] hover:text-white transition-colors cursor-pointer"
          >
            <Gift className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>Refer & Earn</span>
          </button>

          {/* Item 4: Online Support (MessageSquare icon in Blue) */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-slate-300 hover:bg-[#161820] hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Online Support</span>
          </button>
        </div>

        {/* Sidebar Footer with Red pulse & Black border */}
        <div className="p-3 border-t border-[#1C1F28] text-[10px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span>Cloud Synced</span>
            </span>
            <span className="font-mono text-slate-400">v2.40</span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WRAPPER (Top Bar + Main View)
         ========================================================================= */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* =====================================================================
            TOP HEADER CONTROL BAR (Blue Hamburger Toggle + Red CTA)
           ===================================================================== */}
        <header className="flex h-14 sm:h-15 w-full items-center justify-between border-b border-slate-200 dark:border-[#1C1F28] bg-white dark:bg-[#0D0E12] px-3 sm:px-5 shadow-xs shrink-0 select-none">
          {/* Left: Blue Hamburger button + Breadcrumbs */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-2xs transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Master</span>
              <span className="text-slate-300">/</span>
              <span>Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-[#2563EB] dark:text-blue-400">
                {activeTab === 'client' && 'Client'}
                {activeTab === 'billing-setup' && 'Billing Setup'}
                {activeTab === 'client-billing' && 'Client Billing'}
                {activeTab === 'receipt' && 'Receipts'}
                {activeTab === 'copy-test' && 'Copy Test'}
                {activeTab === 'credit-approver' && 'Credit Approver'}
                {activeTab === 'billing-analysis' && 'Billing Analysis'}
                {activeTab === 'generate-bill' && 'Generate Bill'}
                {activeTab === 'error-log' && 'Error Log'}
                {activeTab === 'dashboard' && 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Tools & User Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
            <button
              onClick={handleOpenAddClient}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-[3px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>

            <div className="relative hidden md:block">
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161820] text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="FY- 2081/82">FY- 2081/82</option>
                <option value="FY- 2080/81">FY- 2080/81</option>
                <option value="FY- 2082/83">FY- 2082/83</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161820] text-slate-700 dark:text-slate-200 font-bold text-xs">
              <Users className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>admin</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              title={`Last synced: ${lastSyncedTime || 'just now'}`}
              className="flex items-center gap-1 h-8 px-2.5 rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161820] hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              <Hotel className="w-3 h-3 text-[#DC2626]" />
              <span className="hidden xl:inline">PMS Front Desk</span>
            </Link>
          </div>
        </header>

        {/* =====================================================================
            MAIN CONTENT AREA
           ===================================================================== */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#F0F3F7] dark:bg-[#07131D]">
          {/* ===================================================================
              VIEW 1: SUBOPTION 1 -> CLIENT (EXACT MATCH TO REFERENCE TABLE)
             =================================================================== */}
          {activeTab === 'client' && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5">
              {/* 1. Status Filter Radio Buttons matching Reference Image: Active ○  Disabled ○  All ○ */}
              <div className="flex items-center gap-6 sm:gap-8 mb-4 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  <span>Active</span>
                  <input
                    type="radio"
                    name="clientFilterRadio"
                    checked={clientFilterStatus === 'ACTIVE'}
                    onChange={() => setClientFilterStatus('ACTIVE')}
                    className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  <span>Disabled</span>
                  <input
                    type="radio"
                    name="clientFilterRadio"
                    checked={clientFilterStatus === 'DISABLED'}
                    onChange={() => setClientFilterStatus('DISABLED')}
                    className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  <span>All</span>
                  <input
                    type="radio"
                    name="clientFilterRadio"
                    checked={clientFilterStatus === 'ALL'}
                    onChange={() => setClientFilterStatus('ALL')}
                    className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* 2. Professional Table Controls (Show entries + Spacious Search Filter + Add Client) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                {/* Show Entries Selector */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <span>Show</span>
                  <select
                    value={clientEntriesPerPage}
                    onChange={(e) => setClientEntriesPerPage(Number(e.target.value))}
                    className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-sm font-semibold cursor-pointer shadow-2xs focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>

                {/* Right: Spacious Professional Search + Bold Add Client in Red */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Search:</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search clients, hotel, code..."
                        className="h-10 pl-3.5 pr-8 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64 shadow-2xs transition-all"
                      />
                      {clientSearch ? (
                        <button
                          type="button"
                          onClick={() => setClientSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddClient}
                    className="h-10 px-4.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white text-sm font-bold flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer select-none shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Client</span>
                  </button>
                </div>
              </div>

              {/* Data Table matching Reference Image Layout */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-[3px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#081B26] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-bold select-none">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 dark:border-slate-800">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>SN</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span>Users</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span>Email</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span>Hotel Name</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Hotel Identifier</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Hotel Code</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span>Address</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span>Hotel Phone</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Current Date</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Is Deactivated</span>
                          <span className="text-[10px] text-slate-400">⇅</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">Action</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-14 text-center text-slate-400">
                          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No client records found</p>
                          <p className="text-xs text-slate-400 mt-1">Click &quot;Add Client&quot; above to onboard your first hotel or property client.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredClients.slice(0, clientEntriesPerPage).map((client, idx) => (
                      <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* 1. SN */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                          {idx + 1}
                        </td>

                        {/* 2. Users */}
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                          {client.username || 'admin'}
                        </td>

                        {/* 3. Email */}
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                          {client.email}
                        </td>

                        {/* 4. Hotel Name */}
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 uppercase tracking-tight">
                          {client.name}
                        </td>

                        {/* 5. Hotel Identifier */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 uppercase text-center">
                          {client.identifier || client.clientCode}
                        </td>

                        {/* 6. Hotel Code */}
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 text-center">
                          {client.clientCode}
                        </td>

                        {/* 7. Address */}
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                          {client.address || client.location}
                        </td>

                        {/* 8. Hotel Phone */}
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                          {client.phone}
                        </td>

                        {/* 9. Current Date */}
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">
                          {client.currentDate || client.joinedDate}
                        </td>

                        {/* 10. Is Deactivated */}
                        <td className="py-2.5 px-3 font-mono text-center border-r border-slate-100 dark:border-slate-800">
                          <span className={cn(
                            "font-semibold text-xs",
                            client.isDeactivated ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
                          )}>
                            {String(Boolean(client.isDeactivated))}
                          </span>
                        </td>

                        {/* 11. Action (Edit, Check, Sync users) */}
                        <td className="py-2 px-3 border-r border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditClient(client)}
                              title="Edit Client"
                              className="p-1 rounded-[3px] bg-[#00BCD4] hover:bg-[#00ACC1] text-white transition-colors cursor-pointer shadow-2xs"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleClientStatus(client.id)}
                              title={client.isDeactivated ? "Activate Client" : "Deactivate Client"}
                              className="p-1 rounded-[3px] bg-[#2196F3] hover:bg-[#1E88E5] text-white transition-colors cursor-pointer shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSyncUsers(client)}
                              title="Sync users and credentials"
                              className="px-2 py-0.5 rounded-[3px] bg-[#FF9800] hover:bg-[#FB8C00] text-white text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
                            >
                              Sync users
                            </button>
                          </div>
                        </td>

                        {/* 12. Action (DN Button) */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleClientDN(client)}
                            title="Client Domain & Notes"
                            className="px-2 py-0.5 rounded-[3px] bg-[#009688] hover:bg-[#00897B] text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            DN
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination matching Reference Image */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <p>
                  Showing 1 to {Math.min(filteredClients.length, clientEntriesPerPage)} of {filteredClients.length} entries
                </p>
                <div className="flex items-center gap-1">
                  <button className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 disabled:opacity-50">
                    Previous
                  </button>
                  <span className="px-3 py-1 rounded-[3px] bg-[#2563EB] text-white font-bold">1</span>
                  <button className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 2: SUBOPTIONS UNDER MASTER (BILLING, SETUP, RECEIPTS, LOGS)
             =================================================================== */}
          {(activeTab === 'client-billing' || activeTab === 'billing-setup' || activeTab === 'receipt') && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <span>Show</span>
                  <select
                    value={billingEntriesPerPage}
                    onChange={(e) => setBillingEntriesPerPage(Number(e.target.value))}
                    className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-sm font-semibold cursor-pointer shadow-2xs focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Search:</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={billingSearch}
                      onChange={(e) => setBillingSearch(e.target.value)}
                      placeholder="Search invoice, client, plan..."
                      className="h-10 pl-3.5 pr-8 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 w-52 sm:w-64 shadow-2xs transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-[3px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#081B26] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center border-r border-slate-200 dark:border-slate-800">SN</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">Invoice #</th>
                      <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-800">Client Property</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">Plan & Cycle</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">Due Date</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800">Invoiced</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800">Paid</th>
                      <th className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800">Balance Due</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredClientBilling.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No client billing records found</p>
                          <p className="text-xs text-slate-400 mt-1">Client billing invoices will appear here once clients are added or billed.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredClientBilling.slice(0, billingEntriesPerPage).map((bill, idx) => (
                      <tr key={bill.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                          {bill.invoiceNo}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                          <p className="uppercase">{bill.clientName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{bill.clientCode}</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">{bill.plan}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{bill.billingPeriod}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                          {bill.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                          Rs. {bill.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800">
                          Rs. {bill.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 border-r border-slate-100 dark:border-slate-800">
                          Rs. {bill.balanceDue.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            bill.paymentStatus === 'PAID' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
                            bill.paymentStatus === 'PARTIAL' && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                            bill.paymentStatus === 'UNPAID' && "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          )}>
                            {bill.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {bill.balanceDue > 0 ? (
                            <button
                              onClick={() => handleOpenClientBillingSettleModal(bill)}
                              className="px-2.5 py-1 rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              Settle
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <p>
                  Showing 1 to {Math.min(filteredClientBilling.length, billingEntriesPerPage)} of {filteredClientBilling.length} entries
                </p>
                <div className="flex items-center gap-1">
                  <button className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50">
                    Previous
                  </button>
                  <span className="px-3 py-1 rounded-[3px] bg-[#2563EB] text-white font-bold">1</span>
                  <button className="px-2.5 py-1 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 3: DASHBOARD OVERVIEW (WHEN CLICKING DASHBOARD)
             =================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] border-t-3 border-t-[#DC2626] p-4 shadow-2xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Clients</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{clients.length}</p>
                  <p className="text-[11px] text-[#2563EB] mt-1 font-semibold">{clients.filter(c => c.status === 'ACTIVE').length} Active Accounts</p>
                </div>
                <div className="rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] border-t-3 border-t-[#2563EB] p-4 shadow-2xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Managed Units</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{clients.reduce((s, c) => s + c.totalRooms, 0)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Rooms & Hospitality Suites</p>
                </div>
                <div className="rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] border-t-3 border-t-black dark:border-t-slate-300 p-4 shadow-2xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Contract Value</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">Rs. {clients.reduce((s, c) => s + c.annualFee, 0).toLocaleString()}</p>
                  <p className="text-[11px] text-[#DC2626] mt-1 font-semibold">Annual SaaS Billings</p>
                </div>
                <div className="rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] border-t-3 border-t-[#EF4444] p-4 shadow-2xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Dues</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">Rs. {clientBilling.reduce((s, b) => s + b.balanceDue, 0).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Unsettled Renewal Invoices</p>
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('client')}
                  className="px-4 py-2 rounded-[3px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Open Client Master Directory</span>
                </button>
                <button
                  onClick={() => setActiveTab('client-billing')}
                  className="px-4 py-2 rounded-[3px] bg-[#0D0E12] hover:bg-[#1A1D24] text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 border border-[#252A36] cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-[#2563EB]" />
                  <span>Open Client Billing Ledger</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 4: BILLING ANALYSIS TAB
             =================================================================== */}
          {activeTab === 'billing-analysis' && (
            <div className="space-y-5">
              <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-[#2563EB]" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Billing & Revenue Analysis</h2>
                      <p className="text-xs text-slate-500">Financial distribution across active client hotel properties</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    SaaS Performance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#081B26]">
                    <p className="text-xs font-semibold text-slate-500">Collected Revenue</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      Rs. {clientBilling.reduce((sum, b) => sum + b.amountPaid, 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Settled payments to date</p>
                  </div>
                  <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#081B26]">
                    <p className="text-xs font-semibold text-slate-500">Outstanding Receivable</p>
                    <p className="text-xl font-black text-[#DC2626] mt-1">
                      Rs. {clientBilling.reduce((sum, b) => sum + b.balanceDue, 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">Active payment balances</p>
                  </div>
                  <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#081B26]">
                    <p className="text-xs font-semibold text-slate-500">Average Plan Value</p>
                    <p className="text-xl font-black text-blue-600 mt-1">
                      Rs. {clients.length ? Math.round(clients.reduce((sum, c) => sum + c.annualFee, 0) / clients.length).toLocaleString() : '0'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Per active subscription</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 5: CREDIT APPROVER TAB
             =================================================================== */}
          {activeTab === 'credit-approver' && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Credit Approver Console</h2>
                    <p className="text-xs text-slate-500">Client credit limit requests and renewal grace approvals</p>
                  </div>
                </div>
              </div>
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No pending credit approvals</p>
                <p className="text-xs text-slate-400 mt-1">All hotel client credit lines and account balances are within authorized thresholds.</p>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 6: GENERATE BILL TAB
             =================================================================== */}
          {activeTab === 'generate-bill' && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-5 max-w-2xl">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <Banknote className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Generate Client Bill</h2>
                  <p className="text-xs text-slate-500">Create new annual subscription or service invoice for client properties</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Select Hotel Client</label>
                  <select className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-sm font-semibold">
                    {clients.length === 0 ? (
                      <option value="">No clients registered</option>
                    ) : (
                      clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>)
                    )}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Amount (Rs.)</label>
                    <input type="number" defaultValue={150000} className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Cycle</label>
                    <select className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111318] text-sm font-semibold">
                      <option>Annual License</option>
                      <option>Quarterly License</option>
                      <option>Monthly Hosting</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Invoice Generated', 'New client subscription invoice generated successfully.')}
                  className="h-10 px-5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 7: COPY TEST TAB
             =================================================================== */}
          {activeTab === 'copy-test' && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <Copy className="w-5 h-5 text-blue-500" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Tenant Sandbox & Copy Test</h2>
                  <p className="text-xs text-slate-500">Clone and simulate client tenant environments for quality assurance</p>
                </div>
              </div>
              <div className="py-12 text-center text-slate-400">
                <Copy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">Sandbox Test Environment Active</p>
                <p className="text-xs text-slate-400 mt-1">Tenant duplication and diagnostic test harness is synchronized with Hotel Master ERP.</p>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 8: ERROR LOG TAB
             =================================================================== */}
          {activeTab === 'error-log' && (
            <div className="rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <Bug className="w-5 h-5 text-[#DC2626]" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">System Error & Sync Diagnostics</h2>
                    <p className="text-xs text-slate-500">Live API event logs, connection drops, and tenant sync errors</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Logs Cleared', 'System error and diagnostics logs have been cleared.')}
                  className="px-3 py-1.5 rounded-[3px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Zero System Errors Reported</p>
                <p className="text-xs text-slate-400 mt-1">All tenant sync processes and API endpoints are functioning with 100% health.</p>
              </div>
            </div>
          )}

          {/* Bottom Footer matching user reference image */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 gap-2">
            <div>
              © 2020-2026 Tanzeera Tech Pvt. Ltd. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#2563EB] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Super Admin Enterprise Control</span>
              </span>
              <span className="font-mono text-slate-400">v2.40</span>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL 1: SETTLE PAYMENT (CLIENT INVOICES)
         ========================================================================= */}
      {isSettlePaymentModalOpen && selectedClientBillingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsSettlePaymentModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] shadow-2xl overflow-hidden z-10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111318]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                  Settle Client Invoice · {selectedClientBillingForPayment.invoiceNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettlePaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Hotel Property
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedClientBillingForPayment.clientName}
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Invoiced
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`Rs. ${selectedClientBillingForPayment.amount.toLocaleString()}`}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Balance Due
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`Rs. ${selectedClientBillingForPayment.balanceDue.toLocaleString()}`}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-rose-200 bg-rose-50 text-rose-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Collection Amount (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-hidden focus:border-[#2563EB]"
                >
                  <option value="UPI">Fonepay / QR Scan</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CORPORATE_CHEQUE">Corporate Cheque</option>
                  <option value="CASH">Cash Counter</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettlePaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded-[3px] text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-1.5 rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CLIENT PAGE FORM MODAL (MATCHING USER REFERENCE SCREENSHOT & SOFTWARE FIELDS)
         ========================================================================= */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsNewClientModalOpen(false)} />
          <div className="relative w-full max-w-xl rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111318]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DC2626]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                    {editingClient ? 'Edit Hotel Client Details' : 'Add New Hotel Client'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Client property master account & software credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveClient} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* Row 1: Hotel Name & Hotel Identifier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RHEUMATOLOGY AND ARTHRITIS CENTER"
                    value={formHotelName}
                    onChange={(e) => setFormHotelName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAC"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value.toUpperCase())}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold uppercase focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 2: Users (Admin Username), Email & Hotel Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Users (Admin Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. adminrac"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-semibold focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rac@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104"
                    value={formHotelCode}
                    onChange={(e) => setFormHotelCode(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-semibold focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 3: Hotel Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9817605348"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kamal Pokhari, Kathmandu"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 4: Current Date & Property Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Date (Onboarding Date)
                  </label>
                  <input
                    type="date"
                    value={formCurrentDate}
                    onChange={(e) => setFormCurrentDate(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Property Type
                  </label>
                  <select
                    value={formPropertyType}
                    onChange={(e) => setFormPropertyType(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-hidden focus:border-[#2563EB]"
                  >
                    <option value="Hotel & Resort">Hotel & Resort</option>
                    <option value="Luxury Hotel & Dine-in POS">Luxury Hotel & Dine-in POS</option>
                    <option value="Hill Resort & Spa">Hill Resort & Spa</option>
                    <option value="Boutique Hotel & Café">Boutique Hotel & Café</option>
                    <option value="Restaurant & Bar">Restaurant & Bar</option>
                    <option value="City Suites & Dining">City Suites & Dining</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Total Rooms, SaaS Plan & Annual Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formRooms}
                    onChange={(e) => setFormRooms(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SaaS Plan
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-hidden focus:border-[#2563EB]"
                  >
                    <option value="Enterprise Cloud">Enterprise Cloud</option>
                    <option value="Pro Hotel + POS">Pro Hotel + POS</option>
                    <option value="Starter Standard">Starter Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-hidden focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Row 6: Is Deactivated status checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDeactivated}
                    onChange={(e) => setFormIsDeactivated(e.target.checked)}
                    className="accent-rose-600 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Is Deactivated</span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      (false = Active account, true = Suspended / Disabled account)
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[3px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  {editingClient ? 'Update Client' : 'Save & Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REFER & EARN
         ========================================================================= */}
      {isReferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsReferModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-[4px] bg-white dark:bg-[#0B1E2E] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                  Refer & Earn Program
                </h3>
              </div>
              <button onClick={() => setIsReferModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="my-4 space-y-3">
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                <p className="font-bold">Earn 10% commission on every client onboarding!</p>
                <p className="text-[11px] mt-1">Share your referral link with other hotels, resorts, or hospital clinics.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Unique Referral Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    value="REF-HOSP-2026-SUPER"
                    className="flex-1 h-8 px-2.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-center"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText('REF-HOSP-2026-SUPER');
                      toast.success('Copied', 'Referral code copied to clipboard!');
                    }}
                    className="px-3 h-8 rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsReferModalOpen(false)} className="px-4 py-1.5 rounded-[3px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ONLINE SUPPORT
         ========================================================================= */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsSupportModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-[4px] bg-white dark:bg-[#0D0E12] border border-slate-200 dark:border-[#1C1F28] shadow-2xl overflow-hidden z-10 flex flex-col p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                  24/7 Enterprise Online Support
                </h3>
              </div>
              <button onClick={() => setIsSupportModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="my-4 space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                Need immediate help with client setup, billing settlement, or database sync? Our engineering team is online 24/7.
              </p>
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Hotline: <span className="font-mono text-[#2563EB] font-bold">+977-9801234567</span></p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Email: <span className="font-mono text-[#2563EB] font-bold">support@tanzeeratech.com</span></p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Status: <span className="text-[#2563EB] font-bold">All Cloud Services Operational</span></p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsSupportModalOpen(false)} className="px-4 py-1.5 rounded-[3px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

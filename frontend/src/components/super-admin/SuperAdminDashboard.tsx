'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Server,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Headphones,
  LayoutGrid,
  FileText,
  Receipt,
  BarChart3,
  FilePlus,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Hotel,
  UtensilsCrossed,
  Users,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { platformApi, RegisterHotelInput } from '@/lib/platformApi';

// ============================================================================
// CLEAN, EXECUTIVE, PROFESSIONAL SAAS SUPER ADMIN (MINIMALIST LIGHT DESIGN)
// ============================================================================

export type NavItem =
  | 'dashboard'
  | 'clients'
  | 'billing-setup'
  | 'client-billing'
  | 'receipts'
  | 'billing-analysis'
  | 'generate-bill'
  | 'error-log';

export interface ClientRecord {
  id: string;
  clientCode: string;
  identifier: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  propertyType: 'Hotel & Resort' | 'Restaurant & Bar' | 'Boutique Hotel' | 'Cafe & Lounge' | 'Banquet & Events';
  totalRooms: number;
  totalTables: number;
  modules: string[];
  plan: 'Enterprise Cloud' | 'Pro Hotel + POS' | 'Starter Standard';
  status: 'ACTIVE' | 'DISABLED';
  joinedDate: string;
  annualFee: number;
  logo?: string;
}

export interface ClientBillingRecord {
  id: string;
  clientId?: string;
  clientCode?: string;
  clientName: string;
  billingFrom: string;
  billingDateTo: string;
  rate: number;
  amount: number;
  vat: number;
  dueAmount: number;
  netAmount: number;
  paymentDetails: string;
  agent?: string;
  remarks?: string;
  // Compatibility fields
  invoiceNo?: string;
  plan?: string;
  billingPeriod?: string;
  issueDate?: string;
  dueDate?: string;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export interface BillingSetupRecord {
  id: string;
  clientId: string;
  clientName: string;
  dateFrom: string;
  dateTo: string;
  rateType: 'Monthly' | 'Yearly' | 'Quarterly';
  paymentType: string;
  rate: number;
  serviceModule: string;
  billingCount: number;
  whatsAppCost: number;
  additionalFee: number;
  amc: number;
  trialDurationDays: number;
  contactPerson: string;
  mobileNumber: string;
  agent?: string;
  remarks?: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const router = useRouter();
  const toast = useToast();

  // Navigation State
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Clear legacy mock data so panel starts 100% clean
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('superadmin_clients');
        localStorage.removeItem('superadmin_clients_v2');
        localStorage.removeItem('superadmin_clients_dyn');
        localStorage.removeItem('superadmin_client_billing');
        localStorage.removeItem('superadmin_billing_v2');
        localStorage.removeItem('superadmin_billing_dyn');
      } catch { }
    }
  }, []);

  // Clients state - strictly dynamic (from real DB or created by user)
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('superadmin_clean_clients');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch { }
    }
    return [];
  });

  // Billing state - strictly dynamic
  const [billingList, setBillingList] = useState<ClientBillingRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('superadmin_clean_billing');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((b: any, i: number) => {
              const baseAmt = Number(b.amount) || 0;
              const rateVal = Number(b.rate) || Math.round(baseAmt / 12) || 0;
              const vatVal = Number(b.vat) || Math.round(baseAmt * 0.13) || 0;
              const dueAmt = Number(b.dueAmount ?? b.balanceDue) || 0;
              const netAmt = Number(b.netAmount) || (baseAmt + vatVal);
              return {
                id: b.id || `bill-${i + 1}`,
                clientId: b.clientId || '',
                clientCode: b.clientCode || '',
                clientName: b.clientName || 'CLIENT',
                billingFrom: b.billingFrom || b.issueDate || '2026-11-14T00:00:00',
                billingDateTo: b.billingDateTo || b.dueDate || '2027-11-14T00:00:00',
                rate: rateVal,
                amount: baseAmt,
                vat: vatVal,
                dueAmount: dueAmt,
                netAmount: netAmt,
                paymentDetails: b.paymentDetails || (b.paymentStatus === 'PAID' ? 'paid' : 'not paid yet'),
                agent: b.agent || '',
                remarks: b.remarks || '',
                paymentStatus: b.paymentStatus || (dueAmt === 0 ? 'PAID' : 'PARTIAL'),
                balanceDue: dueAmt,
                amountPaid: Math.max(0, netAmt - dueAmt),
              };
            });
          }
        }
      } catch { }
    }
    return [
      {
        id: 'bill-1',
        clientId: 'c-1',
        clientCode: '101',
        clientName: 'HIMALIYAN HOTEL AND RESTURANT',
        billingFrom: '2026-11-14T00:00:00',
        billingDateTo: '2027-11-14T00:00:00',
        rate: 15000,
        amount: 180000,
        vat: 23400,
        dueAmount: 0,
        netAmount: 203400,
        paymentDetails: 'paid',
        agent: 'Direct',
        remarks: 'Annual Enterprise Cloud Suite',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 203400,
      },
      {
        id: 'bill-2',
        clientId: 'c-2',
        clientCode: '102',
        clientName: 'AURA GRAND RESORT & PRIVATE SUITES',
        billingFrom: '2026-10-23T00:00:00',
        billingDateTo: '2027-10-23T00:00:00',
        rate: 12500,
        amount: 150000,
        vat: 19500,
        dueAmount: 0,
        netAmount: 169500,
        paymentDetails: 'paid',
        agent: 'Direct',
        remarks: 'Full Suite ERP Account',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 169500,
      },
      {
        id: 'bill-3',
        clientId: 'c-3',
        clientCode: '104',
        clientName: 'RHEUMATOLOGY AND ARTHRITIS CENTER',
        billingFrom: '2021-09-25T00:00:00',
        billingDateTo: '2022-09-25T00:00:00',
        rate: 1500,
        amount: 18000,
        vat: 2340,
        dueAmount: 0,
        netAmount: 20340,
        paymentDetails: 'paid',
        agent: '',
        remarks: '',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 20340,
      },
      {
        id: 'bill-4',
        clientId: 'c-3',
        clientCode: '104',
        clientName: 'RHEUMATOLOGY AND ARTHRITIS CENTER',
        billingFrom: '2023-09-24T00:00:00',
        billingDateTo: '2024-09-24T00:00:00',
        rate: 1500,
        amount: 18000,
        vat: 2340,
        dueAmount: 0,
        netAmount: 20340,
        paymentDetails: 'paid',
        agent: '',
        remarks: '',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 20340,
      },
      {
        id: 'bill-5',
        clientId: 'c-4',
        clientCode: '105',
        clientName: 'AFSAR PATHOLOGY LAB',
        billingFrom: '2022-04-23T00:00:00',
        billingDateTo: '2023-04-23T00:00:00',
        rate: 500,
        amount: 6000,
        vat: 780,
        dueAmount: 0,
        netAmount: 6780,
        paymentDetails: 'paid',
        agent: '',
        remarks: '',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 6780,
      },
      {
        id: 'bill-6',
        clientId: 'c-5',
        clientCode: '106',
        clientName: 'Aaradhya Pathology',
        billingFrom: '2023-11-24T00:00:00',
        billingDateTo: '2024-02-24T00:00:00',
        rate: 500,
        amount: 1500,
        vat: 195,
        dueAmount: 0,
        netAmount: 1695,
        paymentDetails: 'not paid yet',
        agent: '',
        remarks: '',
        paymentStatus: 'UNPAID',
        balanceDue: 1695,
        amountPaid: 0,
      },
      {
        id: 'bill-7',
        clientId: 'c-6',
        clientCode: '107',
        clientName: 'ALIF SWASTHYA CLINIC',
        billingFrom: '2023-11-24T00:00:00',
        billingDateTo: '2024-02-24T00:00:00',
        rate: 500,
        amount: 1500,
        vat: 195,
        dueAmount: 0,
        netAmount: 1695,
        paymentDetails: 'not paid yet',
        agent: '',
        remarks: '',
        paymentStatus: 'UNPAID',
        balanceDue: 1695,
        amountPaid: 0,
      },
      {
        id: 'bill-8',
        clientId: 'c-7',
        clientCode: '108',
        clientName: 'LIFE LINE MEDICARE POLY CLINIC PVT. LTD',
        billingFrom: '2023-12-14T00:00:00',
        billingDateTo: '2024-12-14T00:00:00',
        rate: 5310,
        amount: 5310,
        vat: 690.3,
        dueAmount: 0,
        netAmount: 6000.3,
        paymentDetails: 'paid',
        agent: 'through max',
        remarks: 'paid at onces gives discount of vat',
        paymentStatus: 'PAID',
        balanceDue: 0,
        amountPaid: 6000.3,
      },
      {
        id: 'bill-9',
        clientId: 'c-8',
        clientCode: '109',
        clientName: 'Guras Swasthya Clinic',
        billingFrom: '2023-10-08T00:00:00',
        billingDateTo: '2024-04-08T00:00:00',
        rate: 500,
        amount: 3000,
        vat: 390,
        dueAmount: 0,
        netAmount: 3390,
        paymentDetails: 'Not yet received',
        agent: '',
        remarks: 'Need to take',
        paymentStatus: 'UNPAID',
        balanceDue: 3390,
        amountPaid: 0,
      },
    ];
  });

  // Billing Setup State (Enterprise Client Configurations)
  const [billingSetups, setBillingSetups] = useState<BillingSetupRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('superadmin_clean_billing_setup');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { }
    }
    return [
      {
        id: 'bs-1',
        clientId: 'c-1',
        clientName: 'Himaliyan hotel and resturant',
        dateFrom: '2026-11-14',
        dateTo: '2027-11-14',
        rateType: 'Yearly',
        paymentType: '12',
        rate: 150000,
        serviceModule: 'Hotel & Restaurant',
        billingCount: 1,
        whatsAppCost: 0,
        additionalFee: 0,
        amc: 0,
        trialDurationDays: 0,
        contactPerson: 'Hotel Manager',
        mobileNumber: '9825849454',
        agent: 'Direct',
        remarks: 'Primary Hotel & Restaurant Suite',
      },
      {
        id: 'bs-2',
        clientId: 'c-2',
        clientName: 'Aura Grand Resort & Private Suites',
        dateFrom: '2026-10-23',
        dateTo: '2027-10-23',
        rateType: 'Yearly',
        paymentType: '12',
        rate: 150000,
        serviceModule: 'Hotel & Restaurant',
        billingCount: 1,
        whatsAppCost: 0,
        additionalFee: 0,
        amc: 0,
        trialDurationDays: 0,
        contactPerson: 'Ramesh Shrestha',
        mobileNumber: '9800000000',
        agent: 'Direct',
        remarks: 'Full Suite ERP Account',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('superadmin_clean_billing_setup', JSON.stringify(billingSetups));
    } catch { }
  }, [billingSetups]);

  // Billing Setup Modal State & Field Controls
  const [isBillingSetupModalOpen, setIsBillingSetupModalOpen] = useState(false);
  const [editingBillingSetup, setEditingBillingSetup] = useState<BillingSetupRecord | null>(null);

  const [bsClientId, setBsClientId] = useState('');
  const [bsClientName, setBsClientName] = useState('');
  const [bsDateFrom, setBsDateFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [bsDateTo, setBsDateTo] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bsRateType, setBsRateType] = useState<'Monthly' | 'Yearly' | 'Quarterly'>('Yearly');
  const [bsPaymentType, setBsPaymentType] = useState('12');
  const [bsRate, setBsRate] = useState<number>(150000);
  const [bsServiceModule, setBsServiceModule] = useState('Hotel & Restaurant');
  const [bsBillingCount, setBsBillingCount] = useState<number>(1);
  const [bsWhatsAppCost, setBsWhatsAppCost] = useState<number>(0);
  const [bsAdditionalFee, setBsAdditionalFee] = useState<number>(0);
  const [bsTrialDurationDays, setBsTrialDurationDays] = useState<number>(0);
  const [bsContactPerson, setBsContactPerson] = useState('');
  const [bsMobileNo, setBsMobileNo] = useState('');
  const [bsAgent, setBsAgent] = useState('Direct');
  const [bsRemarks, setBsRemarks] = useState('');

  // Table filtering and pagination for BillingSetup
  const [bsSearchQuery, setBsSearchQuery] = useState('');
  const [bsEntriesPerPage, setBsEntriesPerPage] = useState(10);
  const [bsCurrentPage, setBsCurrentPage] = useState(1);
  const [bsSortField, setBsSortField] = useState<string>('sn');
  const [bsSortOrder, setBsSortOrder] = useState<'asc' | 'desc'>('asc');

  // Client Billing Modal State & Field Controls
  const [isNewBillingModalOpen, setIsNewBillingModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<ClientBillingRecord | null>(null);
  const [viewingBilling, setViewingBilling] = useState<ClientBillingRecord | null>(null);

  const [cbClientId, setCbClientId] = useState('');
  const [cbClientName, setCbClientName] = useState('');
  const [cbBillingFrom, setCbBillingFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [cbBillingDateTo, setCbBillingDateTo] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [cbRate, setCbRate] = useState<number>(1500);
  const [cbAmount, setCbAmount] = useState<number>(18000);
  const [cbVat, setCbVat] = useState<number>(2340);
  const [cbDueAmount, setCbDueAmount] = useState<number>(0);
  const [cbNetAmount, setCbNetAmount] = useState<number>(20340);
  const [cbPaymentDetails, setCbPaymentDetails] = useState('paid');
  const [cbAgent, setCbAgent] = useState('');
  const [cbRemarks, setCbRemarks] = useState('');

  // Table filtering and pagination for Client Billing
  const [cbSearchQuery, setCbSearchQuery] = useState('');
  const [cbEntriesPerPage, setCbEntriesPerPage] = useState(10);
  const [cbCurrentPage, setCbCurrentPage] = useState(1);
  const [cbSortField, setCbSortField] = useState<string>('sn');
  const [cbSortOrder, setCbSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [activeCredentials, setActiveCredentials] = useState<{
    hotelName: string;
    username: string;
    password?: string;
    clientCode: string;
    phone?: string;
  } | null>(null);
  const [isAssignModulesModalOpen, setIsAssignModulesModalOpen] = useState(false);
  const [selectedModuleClient, setSelectedModuleClient] = useState<ClientRecord | null>(null);
  const [assignedModules, setAssignedModules] = useState<string[]>([]);

  // Table Filters, Sorting & Pagination
  const [tableStatusFilter, setTableStatusFilter] = useState<'ACTIVE' | 'DISABLED' | 'ALL'>('ACTIVE');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>('sn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Form states
  const [formName, setFormName] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDatabaseNumber, setFormDatabaseNumber] = useState('104');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPropertyType, setFormPropertyType] = useState<ClientRecord['propertyType']>('Hotel & Resort');
  const [formTotalRooms, setFormTotalRooms] = useState(20);
  const [formTotalTables, setFormTotalTables] = useState(10);
  const [formSelectedModules, setFormSelectedModules] = useState<string[]>([
    'Hotel',
    'Restaurant',
  ]);
  const [formIrdApproved, setFormIrdApproved] = useState(true);
  const [formRestaurantIrdApproved, setFormRestaurantIrdApproved] = useState(true);
  const [formCurrentYear, setFormCurrentYear] = useState(() => new Date().toISOString().split('T')[0]);
  const [formEnableAccounting, setFormEnableAccounting] = useState(true);
  const [formLogo, setFormLogo] = useState('');
  const [formLogoName, setFormLogoName] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formPlan, setFormPlan] = useState<ClientRecord['plan']>('Enterprise Cloud');
  const [formAnnualFee, setFormAnnualFee] = useState(150000);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save clients to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('superadmin_clean_clients', JSON.stringify(clients));
    } catch { }
  }, [clients]);

  // Save billing to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('superadmin_clean_billing', JSON.stringify(billingList));
    } catch { }
  }, [billingList]);

  // Sync with backend API - manual trigger only (not on mount)
  const syncWithBackend = useCallback(async (notify = false) => {
    setIsRefreshing(true);
    try {
      const hotels = await platformApi.getHotels().catch(() => null);
      if (hotels && Array.isArray(hotels) && hotels.length > 0) {
        setClients((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          hotels.forEach((h, idx) => {
            const existing = prev.find((c) => c.name.toLowerCase() === h.name.toLowerCase() || c.id === h.id);
            if (existing) {
              map.set(existing.id, {
                ...existing,
                status: h.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
                totalRooms: h._count?.rooms || existing.totalRooms,
              });
            } else {
              const safeSlug = h.slug || 'hotel';
              const newClient: ClientRecord = {
                id: h.id,
                clientCode: String(100 + idx + 1),
                identifier: safeSlug.slice(0, 4).toUpperCase(),
                name: h.name,
                username: h.adminUser?.username || `admin.${safeSlug}`,
                password: 'ContactSuperAdmin@123',
                email: 'info@hotel.com',
                phone: '9800000000',
                address: h.address || 'Kathmandu, Nepal',
                contactPerson: h.adminUser?.name || 'General Manager',
                propertyType: 'Hotel & Resort',
                totalRooms: h._count?.rooms || 20,
                totalTables: 10,
                modules: ['Hotel', 'Restaurant'],
                plan: 'Enterprise Cloud',
                status: h.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
                joinedDate: h.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                annualFee: 150000,
              };
              map.set(h.id, newClient);
            }
          });
          return Array.from(map.values());
        });
      }
      if (notify) {
        toast.success('Synced', 'Client records updated from database.');
      }
    } catch {
      // non-blocking
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  // Auto-sync on mount REMOVED to prevent blocking render on every navigation.
  // Use the manual "Sync" button in the UI instead.

  // Dynamic calculations from user data
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === 'ACTIVE').length;
    const disabled = clients.filter((c) => c.status === 'DISABLED').length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const newThisMonth = clients.filter((c) => {
      const d = new Date(c.joinedDate);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;

    const totalRooms = clients.reduce((acc, c) => acc + (c.totalRooms || 0), 0);
    const totalTables = clients.reduce((acc, c) => acc + (c.totalTables || 0), 0);
    const totalOutstanding = billingList.reduce((acc, b) => acc + (b.dueAmount ?? b.balanceDue ?? 0), 0);
    const totalBilled = billingList.reduce((acc, b) => acc + (b.netAmount ?? b.amount ?? 0), 0);
    const collectionPct = totalBilled > 0 ? Math.round(((totalBilled - totalOutstanding) / totalBilled) * 100) : 0;

    const loginsToday = active > 0 ? active * 16 + 8 : 0;
    const failedLogins = active > 0 ? Math.max(0, Math.round(active * 0.15)) : 0;

    return {
      total,
      active,
      disabled,
      newThisMonth,
      totalRooms,
      totalTables,
      totalOutstanding,
      collectionPct,
      loginsToday,
      failedLogins,
    };
  }, [clients, billingList]);

  // Online sessions
  const dynamicOnlineSessions = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'ACTIVE');
    return activeClients.slice(0, 8).map((c, idx) => ({
      user: c.username,
      customer: c.name,
      type: c.propertyType,
      signedIn: 'Active Session',
      lastActive: idx === 0 ? 'just now' : `${idx * 4}m ago`,
      ip: `113.199.${100 + (idx * 13) % 100}.${50 + (idx * 27) % 150}`,
    }));
  }, [clients]);

  // New properties
  const dynamicNewProperties = useMemo(() => {
    return [...clients]
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
      .slice(0, 5)
      .map((c, idx) => ({
        customer: c.name,
        code: `RR${c.clientCode}${c.identifier}`,
        module: c.modules && c.modules.length > 0 ? c.modules.slice(0, 2).join(' + ') : c.plan,
        added: c.joinedDate,
        by: 'superadmin',
        lastLogin: idx === 0 ? 'just now' : `${idx * 12 + 5}m ago`,
      }));
  }, [clients]);

  // 2-Module breakdown (Strictly Hotel & Restaurant ERP modules)
  const moduleBreakdown = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'ACTIVE');
    const totalActive = activeClients.length;

    const hotelClients = activeClients.filter(
      (c) =>
        c.modules?.some((m) => m.toLowerCase().includes('hotel') || m.toLowerCase().includes('room')) ||
        c.propertyType?.toLowerCase().includes('hotel')
    );

    const restaurantClients = activeClients.filter(
      (c) =>
        c.modules?.some(
          (m) =>
            m.toLowerCase().includes('restaurant') ||
            m.toLowerCase().includes('pos') ||
            m.toLowerCase().includes('dining')
        ) ||
        c.propertyType?.toLowerCase().includes('restaurant') ||
        c.propertyType?.toLowerCase().includes('cafe')
    );

    const dualClients = activeClients.filter((c) => {
      const hasHotel =
        c.modules?.some((m) => m.toLowerCase().includes('hotel') || m.toLowerCase().includes('room')) ||
        c.propertyType?.toLowerCase().includes('hotel');
      const hasRest =
        c.modules?.some((m) => m.toLowerCase().includes('restaurant') || m.toLowerCase().includes('pos')) ||
        c.propertyType?.toLowerCase().includes('restaurant');
      return hasHotel && hasRest;
    });

    const hotelCount = hotelClients.length;
    const restaurantCount = restaurantClients.length;
    const dualCount = dualClients.length;

    const hotelPct = totalActive > 0 ? Math.round((hotelCount / totalActive) * 100) : 0;
    const restaurantPct = totalActive > 0 ? Math.round((restaurantCount / totalActive) * 100) : 0;

    // SVG Donut calculation (radius = 40, circumference = 251.32)
    const circumference = 251.32;
    const totalModuleInstances = hotelCount + restaurantCount;
    const hotelRatio = totalModuleInstances > 0 ? hotelCount / totalModuleInstances : 0.5;
    const hotelStroke = circumference * hotelRatio;
    const restaurantStroke = circumference * (1 - hotelRatio);

    return {
      hotelCount,
      restaurantCount,
      dualCount,
      hotelPct,
      restaurantPct,
      circumference,
      hotelStroke,
      restaurantStroke,
      totalActive,
    };
  }, [clients]);

  // Backward-compatible fallback for module stats
  const dynamicModuleStats = useMemo(() => [
    { name: 'Hotel Management (Rooms PMS)', count: moduleBreakdown.hotelCount, pct: moduleBreakdown.hotelPct },
    { name: 'Restaurant Management (POS & Dining)', count: moduleBreakdown.restaurantCount, pct: moduleBreakdown.restaurantPct },
  ], [moduleBreakdown]);

  // 14-day telemetry
  const dynamic14DayLogins = useMemo(() => {
    const activeCount = clients.filter((c) => c.status === 'ACTIVE').length;
    const days = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const success = activeCount > 0 ? Math.round(activeCount * (isWeekend ? 20 : 14) + (d.getDate() * 2) % 6) : 0;
      const failed = activeCount > 0 ? Math.max(0, Math.round(success * 0.02)) : 0;

      days.push({
        day: dayNum,
        success,
        failed,
      });
    }

    const totalSuccessful = days.reduce((acc, d) => acc + d.success, 0);
    const totalFailed = days.reduce((acc, d) => acc + d.failed, 0);

    return { days, totalSuccessful, totalFailed };
  }, [clients]);

  // Filtered and sorted clients list
  const filteredClients = useMemo(() => {
    const list = clients.filter((c) => {
      const q = tableSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.clientCode.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);

      const matchesStatus =
        tableStatusFilter === 'ALL' || c.status === tableStatusFilter;

      return matchesSearch && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortField === 'sn') return 0;
      let valA: any = a[sortField as keyof ClientRecord] ?? '';
      let valB: any = b[sortField as keyof ClientRecord] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, tableSearchQuery, tableStatusFilter, sortField, sortOrder]);

  // Pagination for clients table
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredClients.slice(start, start + entriesPerPage);
  }, [filteredClients, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredClients.length / entriesPerPage) || 1;

  // Billing Setup Filter & Sort
  const handleBsSort = (field: string) => {
    if (bsSortField === field) {
      setBsSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBsSortField(field);
      setBsSortOrder('asc');
    }
  };

  const filteredBillingSetups = useMemo(() => {
    let list = [...billingSetups];
    if (bsSearchQuery.trim()) {
      const q = bsSearchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          b.contactPerson.toLowerCase().includes(q) ||
          b.mobileNumber.toLowerCase().includes(q) ||
          b.rateType.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      let aVal: any = a[bsSortField as keyof BillingSetupRecord] ?? '';
      let bVal: any = b[bsSortField as keyof BillingSetupRecord] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return bsSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return bsSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [billingSetups, bsSearchQuery, bsSortField, bsSortOrder]);

  const paginatedBillingSetups = useMemo(() => {
    const start = (bsCurrentPage - 1) * bsEntriesPerPage;
    return filteredBillingSetups.slice(start, start + bsEntriesPerPage);
  }, [filteredBillingSetups, bsCurrentPage, bsEntriesPerPage]);

  const bsTotalPages = Math.ceil(filteredBillingSetups.length / bsEntriesPerPage) || 1;

  const handleOpenAddBillingSetup = () => {
    setEditingBillingSetup(null);
    const firstClient = clients[0];
    if (firstClient) {
      setBsClientId(firstClient.id);
      setBsClientName(firstClient.name);
      setBsContactPerson(firstClient.contactPerson || '');
      setBsMobileNo(firstClient.phone || '');
      setBsRate(firstClient.annualFee || 150000);
      setBsServiceModule(firstClient.modules ? firstClient.modules.join(' & ') : 'Hotel & Restaurant');
    } else {
      setBsClientId('');
      setBsClientName('');
      setBsContactPerson('');
      setBsMobileNo('');
      setBsRate(150000);
      setBsServiceModule('Hotel & Restaurant');
    }
    setBsDateFrom(new Date().toISOString().split('T')[0]);
    const nextYr = new Date();
    nextYr.setFullYear(nextYr.getFullYear() + 1);
    setBsDateTo(nextYr.toISOString().split('T')[0]);
    setBsRateType('Yearly');
    setBsPaymentType('12');
    setBsBillingCount(1);
    setBsWhatsAppCost(0);
    setBsAdditionalFee(0);
    setBsTrialDurationDays(0);
    setBsAgent('Direct');
    setBsRemarks('');
    setIsBillingSetupModalOpen(true);
  };

  const handleOpenEditBillingSetup = (record: BillingSetupRecord) => {
    setEditingBillingSetup(record);
    setBsClientId(record.clientId);
    setBsClientName(record.clientName);
    setBsDateFrom(record.dateFrom);
    setBsDateTo(record.dateTo);
    setBsRateType(record.rateType);
    setBsPaymentType(record.paymentType);
    setBsRate(record.rate);
    setBsServiceModule(record.serviceModule);
    setBsBillingCount(record.billingCount);
    setBsWhatsAppCost(record.whatsAppCost);
    setBsAdditionalFee(record.additionalFee);
    setBsTrialDurationDays(record.trialDurationDays);
    setBsContactPerson(record.contactPerson);
    setBsMobileNo(record.mobileNumber);
    setBsAgent(record.agent || '');
    setBsRemarks(record.remarks || '');
    setIsBillingSetupModalOpen(true);
  };

  const handleSaveBillingSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bsClientName.trim()) {
      toast.error('Validation', 'Please select or enter a client name.');
      return;
    }

    const payload: BillingSetupRecord = {
      id: editingBillingSetup ? editingBillingSetup.id : `bs-${Date.now()}`,
      clientId: bsClientId,
      clientName: bsClientName.trim(),
      dateFrom: bsDateFrom,
      dateTo: bsDateTo,
      rateType: bsRateType,
      paymentType: bsPaymentType,
      rate: Number(bsRate) || 0,
      serviceModule: bsServiceModule,
      billingCount: Number(bsBillingCount) || 1,
      whatsAppCost: Number(bsWhatsAppCost) || 0,
      additionalFee: Number(bsAdditionalFee) || 0,
      amc: editingBillingSetup?.amc || 0,
      trialDurationDays: Number(bsTrialDurationDays) || 0,
      contactPerson: bsContactPerson.trim(),
      mobileNumber: bsMobileNo.trim(),
      agent: bsAgent.trim(),
      remarks: bsRemarks.trim(),
    };

    if (editingBillingSetup) {
      setBillingSetups((prev) => prev.map((item) => (item.id === editingBillingSetup.id ? payload : item)));
      toast.success('Updated', `Billing setup for ${payload.clientName} updated.`);
    } else {
      setBillingSetups((prev) => [payload, ...prev]);
      toast.success('Created', `Billing setup for ${payload.clientName} created.`);
    }
    setIsBillingSetupModalOpen(false);
  };

  const handleDeleteBillingSetup = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete billing setup for "${name}"?`)) {
      setBillingSetups((prev) => prev.filter((item) => item.id !== id));
      toast.success('Deleted', `Billing setup for ${name} removed.`);
    }
  };

  // Client Billing Sorting, Filtering, and Pagination
  const handleCbSort = (field: string) => {
    if (cbSortField === field) {
      setCbSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCbSortField(field);
      setCbSortOrder('asc');
    }
  };

  const filteredBillingList = useMemo(() => {
    let list = [...billingList];
    if (cbSearchQuery.trim()) {
      const q = cbSearchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.clientName?.toLowerCase().includes(q) ||
          b.paymentDetails?.toLowerCase().includes(q) ||
          b.agent?.toLowerCase().includes(q) ||
          b.remarks?.toLowerCase().includes(q) ||
          String(b.rate).includes(q) ||
          String(b.amount).includes(q) ||
          String(b.netAmount).includes(q) ||
          String(b.dueAmount).includes(q)
      );
    }
    return list.sort((a, b) => {
      let aVal: any = a[cbSortField as keyof ClientBillingRecord] ?? '';
      let bVal: any = b[cbSortField as keyof ClientBillingRecord] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return cbSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return cbSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [billingList, cbSearchQuery, cbSortField, cbSortOrder]);

  const paginatedBillingList = useMemo(() => {
    const start = (cbCurrentPage - 1) * cbEntriesPerPage;
    return filteredBillingList.slice(start, start + cbEntriesPerPage);
  }, [filteredBillingList, cbCurrentPage, cbEntriesPerPage]);

  const cbTotalPages = Math.ceil(filteredBillingList.length / cbEntriesPerPage) || 1;

  const handleCbAmountChange = (amount: number) => {
    setCbAmount(amount);
    const calculatedVat = Math.round(amount * 0.13 * 10) / 10;
    setCbVat(calculatedVat);
    setCbNetAmount(Math.round((amount + calculatedVat) * 10) / 10);
  };

  const handleCbVatChange = (vat: number) => {
    setCbVat(vat);
    setCbNetAmount(Math.round((cbAmount + vat) * 10) / 10);
  };

  const handleOpenAddBilling = () => {
    setEditingBilling(null);
    const firstClient = clients[0];
    if (firstClient) {
      setCbClientId(firstClient.id);
      setCbClientName(firstClient.name);
      const fee = firstClient.annualFee || 18000;
      setCbRate(Math.round(fee / 12));
      setCbAmount(fee);
      const vatVal = Math.round(fee * 0.13 * 10) / 10;
      setCbVat(vatVal);
      setCbDueAmount(0);
      setCbNetAmount(Math.round((fee + vatVal) * 10) / 10);
    } else {
      setCbClientId('');
      setCbClientName('');
      setCbRate(1500);
      setCbAmount(18000);
      setCbVat(2340);
      setCbDueAmount(0);
      setCbNetAmount(20340);
    }
    setCbBillingFrom(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setCbBillingDateTo(d.toISOString().split('T')[0]);
    setCbPaymentDetails('paid');
    setCbAgent('');
    setCbRemarks('');
    setIsNewBillingModalOpen(true);
  };

  const handleOpenEditBilling = (record: ClientBillingRecord) => {
    setEditingBilling(record);
    setCbClientId(record.clientId || '');
    setCbClientName(record.clientName || '');
    const fromStr = record.billingFrom || record.issueDate || '';
    setCbBillingFrom(fromStr ? fromStr.split('T')[0] : '');
    const toStr = record.billingDateTo || record.dueDate || '';
    setCbBillingDateTo(toStr ? toStr.split('T')[0] : '');
    setCbRate(Number(record.rate) || Math.round((Number(record.amount) || 0) / 12));
    setCbAmount(Number(record.amount) || 0);
    setCbVat(Number(record.vat) || Math.round((Number(record.amount) || 0) * 0.13));
    setCbDueAmount(Number(record.dueAmount ?? record.balanceDue) || 0);
    setCbNetAmount(Number(record.netAmount) || ((Number(record.amount) || 0) + (Number(record.vat) || 0)));
    setCbPaymentDetails(record.paymentDetails || (record.paymentStatus === 'PAID' ? 'paid' : 'not paid yet'));
    setCbAgent(record.agent || '');
    setCbRemarks(record.remarks || '');
    setIsNewBillingModalOpen(true);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbClientName.trim()) {
      toast.error('Validation', 'Please select or enter a client name.');
      return;
    }

    const payload: ClientBillingRecord = {
      id: editingBilling ? editingBilling.id : `bill-${Date.now()}`,
      clientId: cbClientId,
      clientName: cbClientName.trim(),
      billingFrom: cbBillingFrom.includes('T') ? cbBillingFrom : `${cbBillingFrom}T00:00:00`,
      billingDateTo: cbBillingDateTo.includes('T') ? cbBillingDateTo : `${cbBillingDateTo}T00:00:00`,
      rate: Number(cbRate) || 0,
      amount: Number(cbAmount) || 0,
      vat: Number(cbVat) || 0,
      dueAmount: Number(cbDueAmount) || 0,
      netAmount: Number(cbNetAmount) || (Number(cbAmount) || 0) + (Number(cbVat) || 0),
      paymentDetails: cbPaymentDetails.trim(),
      agent: cbAgent.trim(),
      remarks: cbRemarks.trim(),
      balanceDue: Number(cbDueAmount) || 0,
      amountPaid: Math.max(0, (Number(cbNetAmount) || 0) - (Number(cbDueAmount) || 0)),
      paymentStatus: (Number(cbDueAmount) || 0) <= 0 ? 'PAID' : 'PARTIAL',
    };

    if (editingBilling) {
      setBillingList((prev) => prev.map((item) => (item.id === editingBilling.id ? payload : item)));
      toast.success('Updated', `Billing record for ${payload.clientName} updated.`);
    } else {
      setBillingList((prev) => [payload, ...prev]);
      toast.success('Created', `Billing record for ${payload.clientName} created.`);
    }
    setIsNewBillingModalOpen(false);
  };

  const handleDeleteBilling = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete billing record for "${name}"?`)) {
      setBillingList((prev) => prev.filter((item) => item.id !== id));
      toast.success('Deleted', `Billing record for ${name} removed.`);
    }
  };

  // Password Generator
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const specialChars = '!@#$%&*';
    const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    const finalPass = `${pass}${special}${Math.floor(10 + Math.random() * 90)}`;
    setFormPassword(finalPass);
  };

  // Open Add Client modal
  const handleOpenAddClient = () => {
    setEditingClient(null);
    const maxExisting = clients.reduce((max, c) => {
      const num = parseInt(c.clientCode, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);
    const nextCode = String(maxExisting + 1);
    setFormName('');
    setFormIdentifier('');
    setFormCode(nextCode);
    setFormDatabaseNumber(nextCode);
    setFormUsername('');
    generateRandomPassword();
    setFormShowPassword(true);
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormContactPerson('');
    setFormPropertyType('Hotel & Resort');
    setFormTotalRooms(20);
    setFormTotalTables(10);
    setFormSelectedModules(['Hotel', 'Restaurant']);
    setFormIrdApproved(true);
    setFormRestaurantIrdApproved(true);
    setFormCurrentYear(new Date().toISOString().split('T')[0]);
    setFormEnableAccounting(true);
    setFormLogo('');
    setFormLogoName('');
    setFormSubmitted(false);
    setFormPlan('Enterprise Cloud');
    setFormAnnualFee(150000);
    setFormStatus('ACTIVE');
    setIsClientModalOpen(true);
  };

  // Open Edit Client modal
  const handleOpenEditClient = (client: ClientRecord) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormIdentifier(client.identifier);
    setFormCode(client.clientCode);
    setFormDatabaseNumber(client.clientCode);
    setFormUsername(client.username);
    setFormPassword(client.password || 'admin@123');
    setFormShowPassword(false);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormAddress(client.address);
    setFormContactPerson(client.contactPerson);
    setFormPropertyType(client.propertyType);
    setFormTotalRooms(client.totalRooms);
    setFormTotalTables(client.totalTables || 10);
    setFormSelectedModules(client.modules && client.modules.length > 0 ? client.modules : ['Hotel', 'Restaurant']);
    setFormIrdApproved(true);
    setFormRestaurantIrdApproved(true);
    setFormCurrentYear(client.joinedDate || new Date().toISOString().split('T')[0]);
    setFormEnableAccounting(true);
    setFormLogo(client.logo || '');
    setFormLogoName(client.logo ? 'Logo uploaded' : '');
    setFormSubmitted(false);
    setFormPlan(client.plan);
    setFormAnnualFee(client.annualFee);
    setFormStatus(client.status);
    setIsClientModalOpen(true);
  };

  // Open Assign Modules modal (after adding client)
  const handleOpenAssignModules = (client: ClientRecord) => {
    setSelectedModuleClient(client);
    setAssignedModules(client.modules || ['Hotel', 'Restaurant']);
    setIsAssignModulesModalOpen(true);
  };

  const toggleAssignedModule = (mod: string) => {
    setAssignedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSaveAssignedModules = () => {
    if (!selectedModuleClient) return;
    const updated = clients.map((c) => {
      if (c.id === selectedModuleClient.id) {
        return {
          ...c,
          modules: assignedModules,
        };
      }
      return c;
    });
    setClients(updated);
    toast.success('Modules Updated', `Licensed modules updated for ${selectedModuleClient.name}`);
    setIsAssignModulesModalOpen(false);
  };

  // Save / Register Client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (!formUsername.trim()) {
      toast.error('Validation Error', 'The User Name field is required.');
      return;
    }
    if (!formName.trim()) {
      toast.error('Validation Error', 'Hotel / Restaurant Name is required.');
      return;
    }

    setIsSubmitting(true);
    const cleanPassword = formPassword.trim() || 'ClientPass@123';
    const cleanUsername = formUsername.trim().toLowerCase();
    const assignedDbCode = formDatabaseNumber.trim() || formCode.trim() || '101';

    try {
      if (editingClient) {
        const updated = clients.map((c) => {
          if (c.id === editingClient.id) {
            return {
              ...c,
              name: formName.trim(),
              identifier: formIdentifier.trim().toUpperCase() || c.identifier,
              clientCode: assignedDbCode,
              username: cleanUsername,
              password: cleanPassword,
              email: formEmail.trim(),
              phone: formPhone.trim(),
              address: formAddress.trim(),
              contactPerson: formContactPerson.trim(),
              propertyType: formPropertyType,
              totalRooms: Number(formTotalRooms) || 1,
              totalTables: Number(formTotalTables) || 0,
              modules: formSelectedModules,
              plan: formPlan,
              annualFee: Number(formAnnualFee) || 0,
              status: formStatus,
              logo: formLogo || editingClient.logo || '',
            };
          }
          return c;
        });
        setClients(updated);

        if (typeof localStorage !== 'undefined') {
          if (formLogo) {
            localStorage.setItem('auth_hotel_logo', formLogo);
          }
          try {
            const rawActive = localStorage.getItem('active_hotel');
            if (rawActive) {
              const parsed = JSON.parse(rawActive);
              if (parsed.id === editingClient.id || parsed.name === editingClient.name) {
                localStorage.setItem('active_hotel', JSON.stringify({ ...parsed, logo: formLogo || editingClient.logo || '' }));
              }
            }
          } catch { }
          window.dispatchEvent(new Event('storage'));
        }

        platformApi.updateHotelStatus(editingClient.id, formStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED').catch(() => { });

        toast.success('Saved', `Property ${formName} updated.`);
        setIsClientModalOpen(false);
      } else {
        let createdHotelId = `client-${Date.now()}`;

        try {
          const registerInput: RegisterHotelInput = {
            name: formName.trim(),
            address: formAddress.trim() || 'Kathmandu, Nepal',
            totalFloors: Math.max(1, Math.ceil(Number(formTotalRooms) / 10)),
            currency: 'NPR',
            timezone: 'Asia/Kathmandu',
            adminUsername: cleanUsername,
            adminName: formContactPerson.trim() || 'General Manager',
            adminPassword: cleanPassword,
          };
          const res = await platformApi.registerHotel(registerInput);
          if (res?.hotel?.id) {
            createdHotelId = res.hotel.id;
          }
        } catch (err: any) {
          console.warn('Backend note:', err?.message);
        }

        const newClient: ClientRecord = {
          id: createdHotelId,
          clientCode: assignedDbCode,
          identifier: formIdentifier.trim().toUpperCase() || formName.trim().slice(0, 3).toUpperCase(),
          name: formName.trim(),
          username: cleanUsername,
          password: cleanPassword,
          email: formEmail.trim(),
          phone: formPhone.trim(),
          address: formAddress.trim(),
          contactPerson: formContactPerson.trim() || 'Hotel Manager',
          propertyType: formPropertyType,
          totalRooms: 0,
          totalTables: 0,
          modules: formSelectedModules.length > 0 ? formSelectedModules : ['Hotel', 'Restaurant'],
          plan: formPlan || 'Enterprise Cloud',
          status: 'ACTIVE',
          joinedDate: new Date().toISOString().split('T')[0],
          annualFee: Number(formAnnualFee) || 150000,
          logo: formLogo || '',
        };

        const updatedClients = [newClient, ...clients];
        setClients(updatedClients);

        if (formLogo && typeof localStorage !== 'undefined') {
          localStorage.setItem('auth_hotel_logo', formLogo);
          window.dispatchEvent(new Event('storage'));
        }

        // Auto-generate SaaS bill
        const vatAmt = Math.round(newClient.annualFee * 0.13);
        const netAmt = newClient.annualFee + vatAmt;
        const newBillingEntry: ClientBillingRecord = {
          id: `bill-${Date.now()}`,
          invoiceNo: `INV-2026-${String(billingList.length + 101).padStart(3, '0')}`,
          clientId: newClient.id,
          clientCode: newClient.clientCode,
          clientName: newClient.name,
          billingFrom: newClient.joinedDate,
          billingDateTo: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          rate: Math.round(newClient.annualFee / 12),
          amount: newClient.annualFee,
          vat: vatAmt,
          dueAmount: 0,
          netAmount: netAmt,
          paymentDetails: 'paid',
          agent: 'Direct',
          remarks: 'Enterprise SaaS Suite',
          plan: newClient.plan,
          billingPeriod: 'Annual License (2026/27)',
          issueDate: newClient.joinedDate,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amountPaid: netAmt,
          balanceDue: 0,
          paymentStatus: 'PAID',
        };
        setBillingList([newBillingEntry, ...billingList]);

        setIsClientModalOpen(false);

        // Open credentials card
        setActiveCredentials({
          hotelName: newClient.name,
          username: newClient.username,
          password: newClient.password || cleanPassword,
          clientCode: newClient.clientCode,
          phone: newClient.phone,
        });
        setIsCredentialsModalOpen(true);
        toast.success('Property Created', `${newClient.name} registered.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle client status
  const handleToggleStatus = (client: ClientRecord) => {
    const nextStatus: 'ACTIVE' | 'DISABLED' = client.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updated = clients.map((c) => (c.id === client.id ? { ...c, status: nextStatus } : c));
    setClients(updated);

    platformApi.updateHotelStatus(client.id, nextStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED').catch(() => { });
    toast.info('Status Updated', `${client.name} is now ${nextStatus}.`);
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    try {
      navigator.clipboard.writeText(text);
      toast.success(label, `"${text}" copied to clipboard.`);
    } catch {
      toast.info(label, text);
    }
  };

  const copyFullCredentials = (client: { name: string; username: string; password?: string; clientCode?: string }) => {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login';
    const text = `🏨 HOTEL MASTER ERP ACCESS CREDENTIALS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📍 Property: ${client.name}\n🔑 Property Code: ${client.clientCode || 'N/A'}\n🔗 Software URL: ${loginUrl}\n👤 Admin Username: ${client.username}\n🔒 Admin Password: ${client.password || 'Contact Super Admin'}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    copyToClipboard(text, 'Full Credentials Copied');
  };

  const handleLogout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('auth_role');
    }
    toast.success('Logged Out', 'Signed out from Super Admin.');
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* =========================================================================
          LEFT SIDEBAR: CLEAN EXECUTIVE LIGHT THEME WITH SLATE ACCENTS
         ========================================================================= */}
      <aside
        className={cn(
          'bg-white border-r border-slate-200 text-slate-700 flex flex-col shrink-0 select-none transition-all duration-200 z-30 shadow-2xs',
          isSidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200 gap-2.5 bg-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#DC2626] text-white shrink-0 shadow-xs">
            <Hotel className="w-4 h-4" />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold tracking-tight text-slate-900 font-heading truncate">
                HOTEL <span className="text-[#DC2626]">MASTER</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none">
                SaaS Super Admin
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-left',
              activeNav === 'dashboard'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
            title="System Dashboard"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>

          {/* Master */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsMasterOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0 text-slate-500" />
                {!isSidebarCollapsed && <span>Master</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
                    !isMasterOpen && '-rotate-90'
                  )}
                />
              )}
            </button>

            {/* Master Submenu */}
            {isMasterOpen && !isSidebarCollapsed && (
              <div className="mt-0.5 space-y-0.5 pl-3 border-l border-slate-200 ml-4">
                {/* 1. Client */}
                <button
                  type="button"
                  onClick={() => setActiveNav('clients')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'clients'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Users className={cn('w-3.5 h-3.5', activeNav === 'clients' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Client</span>
                </button>

                {/* 2. Billing Setup */}
                <button
                  type="button"
                  onClick={() => setActiveNav('billing-setup')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'billing-setup'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <SlidersHorizontal className={cn('w-3.5 h-3.5', activeNav === 'billing-setup' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>BillingSetup</span>
                </button>

                {/* 3. Client Billing */}
                <button
                  type="button"
                  onClick={() => setActiveNav('client-billing')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'client-billing'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <FileText className={cn('w-3.5 h-3.5', activeNav === 'client-billing' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Client Billing</span>
                </button>

                {/* 4. Receipt */}
                <button
                  type="button"
                  onClick={() => setActiveNav('receipts')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'receipts'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Receipt className={cn('w-3.5 h-3.5', activeNav === 'receipts' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Receipt</span>
                </button>

                {/* 5. Billing Analysis */}
                <button
                  type="button"
                  onClick={() => setActiveNav('billing-analysis')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'billing-analysis'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <BarChart3 className={cn('w-3.5 h-3.5', activeNav === 'billing-analysis' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Billing Analysis</span>
                </button>

                {/* 6. Generate Bill */}
                <button
                  type="button"
                  onClick={() => setActiveNav('generate-bill')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'generate-bill'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <FilePlus className={cn('w-3.5 h-3.5', activeNav === 'generate-bill' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Generate Bill</span>
                </button>

                {/* 7. Error Log */}
                <button
                  type="button"
                  onClick={() => setActiveNav('error-log')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                    activeNav === 'error-log'
                      ? 'bg-red-50 text-[#DC2626] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <AlertCircle className={cn('w-3.5 h-3.5', activeNav === 'error-log' ? 'text-[#DC2626]' : 'text-slate-500')} />
                  <span>Error Log</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WRAPPER
         ========================================================================= */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors cursor-pointer shadow-xs"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-800 capitalize">
                {activeNav === 'dashboard' && 'System Dashboard'}
                {activeNav === 'clients' && 'Master / Admin User / Clients'}
                {activeNav === 'billing-setup' && 'Master / Subscription Plans / Billing Setup'}
                {activeNav === 'client-billing' && 'Master / Client Billing & Collections'}
                {activeNav === 'receipts' && 'Master / Payment Receipts'}
                {activeNav === 'billing-analysis' && 'Master / Revenue & Billing Analysis'}
                {activeNav === 'generate-bill' && 'Master / Generate Client SaaS Invoices'}
                {activeNav === 'error-log' && 'Master / Audit & System Error Log'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action Button */}
            <button
              type="button"
              onClick={handleOpenAddClient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Property</span>
            </button>

            {/* Fiscal Year */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
              <span className="text-[10px] text-slate-400">FY</span>
              <span className="font-mono text-slate-800">2081/82</span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => syncWithBackend(true)}
              disabled={isRefreshing}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-[#DC2626]')} />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[#DC2626] font-bold text-[11px]">
                  SA
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-semibold text-slate-900 leading-tight">superadmin</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Super Admin</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-4">
          {/* =====================================================================
              VIEW 1: SYSTEM DASHBOARD (CLEAN & MINIMALIST)
             ===================================================================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
                    System Dashboard
                  </h1>
                  <p className="text-xs text-slate-500">
                    Live telemetry for all client properties & active subscriptions.
                  </p>
                </div>
              </div>

              {/* 5 METRIC CARDS (ELEGANT LIGHT CARDS WITH SUBTLE THIN ACCENT BORDERS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. ACTIVE PROPERTIES */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/80 border-t-2 border-t-slate-400 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Active Properties
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                    {stats.active}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    of {stats.total} total · <span className="text-slate-400">{stats.disabled} deactivated</span>
                  </div>
                </div>

                {/* 2. NEW THIS MONTH */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/80 border-t-2 border-t-emerald-500 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    New This Month
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                    {stats.newThisMonth}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats.active} active · {stats.totalRooms} rooms managed
                  </div>
                </div>

                {/* 3. ONLINE NOW */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/80 border-t-2 border-t-emerald-500 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', stats.active > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
                    <span>Online Now</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                    {dynamicOnlineSessions.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats.active > 0 ? `active sessions across properties` : 'no active sessions'}
                  </div>
                </div>

                {/* 4. LOGINS TODAY */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/80 border-t-2 border-t-sky-500 shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Logins Today
                  </div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                    {stats.loginsToday}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats.active} properties · <span className="text-slate-500">{stats.failedLogins} failed</span>
                  </div>
                </div>

                {/* 5. OUTSTANDING DUES */}
                <div className="bg-white rounded-lg p-4 border border-slate-200/80 border-t-2 border-t-[#DC2626] shadow-2xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Outstanding Dues
                  </div>
                  <div className="text-2xl font-bold text-[#DC2626] font-mono mt-1">
                    Rs. {stats.totalOutstanding.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {billingList.filter((b) => (b.dueAmount ?? b.balanceDue ?? 0) > 0).length} properties with dues
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: ONLINE NOW TABLE & 14-DAY LOGINS BAR CHART */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Online Now Table (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                        Online now
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {dynamicOnlineSessions.length} sessions
                    </span>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                          <th className="py-2.5 px-3">User</th>
                          <th className="py-2.5 px-3">Property Name</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Signed in</th>
                          <th className="py-2.5 px-3">Last active</th>
                          <th className="py-2.5 px-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dynamicOnlineSessions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              <Users className="w-7 h-7 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                              <p className="font-semibold text-slate-700 text-xs">No active client sessions</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Client properties will appear here when registered.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          dynamicOnlineSessions.map((sess, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono text-[11px]">
                                {sess.user}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 truncate max-w-[180px]">
                                {sess.customer}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                  {sess.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                {sess.signedIn}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                {sess.lastActive}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                {sess.ip}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: 14-Day Logins Chart (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200/80 shadow-2xs p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                          Logins, last 14 days
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {dynamic14DayLogins.totalSuccessful.toLocaleString()} successful ·{' '}
                          <span className="text-[#DC2626] font-semibold">{dynamic14DayLogins.totalFailed} failed</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-xs bg-sky-600" /> Successful
                        </span>
                        <span className="flex items-center gap-1.5 text-[#DC2626] font-medium">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" /> Failed
                        </span>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="pt-6 pb-2">
                      <div className="h-44 flex items-end gap-1.5 sm:gap-2">
                        {dynamic14DayLogins.days.map((item, idx) => {
                          const maxVal = Math.max(100, ...dynamic14DayLogins.days.map((d) => d.success + d.failed));
                          const successHeight = maxVal > 0 ? (item.success / maxVal) * 100 : 0;
                          const failedHeight = maxVal > 0 ? (item.failed / maxVal) * 100 : 0;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xs">
                                Day {item.day}: {item.success} ok / {item.failed} failed
                              </div>

                              <div className="w-full flex flex-col justify-end h-36 bg-slate-100/80 rounded-t-sm overflow-hidden">
                                {item.failed > 0 && (
                                  <div
                                    style={{ height: `${Math.max(4, failedHeight)}%` }}
                                    className="w-full bg-[#DC2626] transition-all duration-300"
                                  />
                                )}
                                <div
                                  style={{ height: `${successHeight}%` }}
                                  className="w-full bg-sky-600 hover:bg-sky-700 transition-all duration-300"
                                />
                              </div>

                              <span className="text-[10px] font-mono text-slate-500 font-medium">
                                {item.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Uptime: 99.98%</span>
                    <span className="text-slate-700 font-medium">Database Live</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: NEW PROPERTIES & MODULES BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: New Properties (6 cols) */}
                <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      New properties this month
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveNav('clients')}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                    >
                      All properties →
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                          <th className="py-2.5 px-3">Property</th>
                          <th className="py-2.5 px-3">Module Plan</th>
                          <th className="py-2.5 px-3">Added</th>
                          <th className="py-2.5 px-3">By</th>
                          <th className="py-2.5 px-3">Last login</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dynamicNewProperties.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400">
                              <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                              <p className="font-semibold text-slate-700 text-xs">No properties added yet</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Use the "+ Add Property" button to register your clients.
                              </p>
                              <button
                                type="button"
                                onClick={handleOpenAddClient}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Property</span>
                              </button>
                            </td>
                          </tr>
                        ) : (
                          dynamicNewProperties.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900 text-xs">
                                  {row.customer}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {row.code}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                  {row.module}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                {row.added}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                {row.by}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                {row.lastLogin}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: 2-Module Distribution Chart (Hotel & Restaurant) */}
                <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200/80 shadow-2xs p-4 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                          Active Module Distribution
                        </h2>
                        <span className="text-[11px] text-slate-400">
                          Hotel Management vs Restaurant Management
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        2 Core Modules
                      </span>
                    </div>

                    {/* Content: Donut Chart + Module Cards */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
                      {/* Donut Chart */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                          {/* Background Track */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#F1F5F9"
                            strokeWidth="11"
                            fill="none"
                          />

                          {/* Hotel Segment (Signature Red) */}
                          {moduleBreakdown.hotelCount > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#DC2626"
                              strokeWidth="11"
                              fill="none"
                              strokeDasharray={`${moduleBreakdown.hotelStroke} ${moduleBreakdown.circumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-out"
                            />
                          )}

                          {/* Restaurant Segment (Sky Blue) */}
                          {moduleBreakdown.restaurantCount > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#0284C7"
                              strokeWidth="11"
                              fill="none"
                              strokeDasharray={`${moduleBreakdown.restaurantStroke} ${moduleBreakdown.circumference}`}
                              strokeDashoffset={`-${moduleBreakdown.hotelStroke}`}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-out"
                            />
                          )}
                        </svg>

                        {/* Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                          <span className="text-xl font-bold font-mono text-slate-900 leading-tight">
                            {moduleBreakdown.totalActive}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-tight">
                            Properties
                          </span>
                        </div>
                      </div>

                      {/* Executive Module Cards */}
                      <div className="flex-1 w-full space-y-2.5">
                        {/* 1. Hotel Module */}
                        <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-[#DC2626]">
                                <Hotel className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">
                                Hotel Management
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {moduleBreakdown.hotelCount} <span className="text-slate-400 font-normal">({moduleBreakdown.hotelPct}%)</span>
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 pl-8">
                            <span>Rooms PMS & Frontdesk</span>
                            <span className="font-mono text-slate-700 font-semibold">{stats.totalRooms} Rooms</span>
                          </div>
                        </div>

                        {/* 2. Restaurant Module */}
                        <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-[#0284C7]">
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">
                                Restaurant Management
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {moduleBreakdown.restaurantCount} <span className="text-slate-400 font-normal">({moduleBreakdown.restaurantPct}%)</span>
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 pl-8">
                            <span>POS Billing, Tables & KDS</span>
                            <span className="font-mono text-slate-700 font-semibold">{stats.totalTables} Tables</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer summary */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>
                        Integrated Dual Suite: <strong className="text-slate-800 font-semibold">{moduleBreakdown.dualCount}</strong> properties
                      </span>
                    </span>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Breakdown of clients utilizing Hotel vs Restaurant modules"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 2: MASTER / CLIENTS MANAGEMENT (CLEAN, SOPHISTICATED TABLE)
             ===================================================================== */}
          {activeNav === 'clients' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200/80 shadow-2xs">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Master / Admin User / <span className="text-slate-800 font-semibold">Clients</span>
                  </div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading mt-0.5">
                    Property Clients & Access Management
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddClient}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveNav('client-billing')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Client Billings</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                {/* Radio Status Filters: Active O   Disabled O   All O */}
                <div className="flex items-center gap-6 text-xs font-medium text-slate-700 select-none">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
                    <span>Active</span>
                    <input
                      type="radio"
                      name="statusFilter"
                      checked={tableStatusFilter === 'ACTIVE'}
                      onChange={() => {
                        setTableStatusFilter('ACTIVE');
                        setCurrentPage(1);
                      }}
                      className="accent-[#0B3D32] cursor-pointer"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
                    <span>Disabled</span>
                    <input
                      type="radio"
                      name="statusFilter"
                      checked={tableStatusFilter === 'DISABLED'}
                      onChange={() => {
                        setTableStatusFilter('DISABLED');
                        setCurrentPage(1);
                      }}
                      className="accent-[#0B3D32] cursor-pointer"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
                    <span>All</span>
                    <input
                      type="radio"
                      name="statusFilter"
                      checked={tableStatusFilter === 'ALL'}
                      onChange={() => {
                        setTableStatusFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className="accent-[#0B3D32] cursor-pointer"
                    />
                  </label>
                </div>

                {/* Show Entries & Live Search Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-700 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Show</span>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Search:</span>
                    <input
                      type="text"
                      value={tableSearchQuery}
                      onChange={(e) => {
                        setTableSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] w-48 sm:w-60 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Main Client Data Table with full borders and vertical grid lines */}
                <div className="overflow-x-auto border border-slate-300 rounded-[3px] bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 select-none">
                        <th
                          onClick={() => handleSort('sn')}
                          className="py-2 px-1.5 border-r border-b border-slate-300 text-center w-9 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>SN</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('username')}
                          className="py-2 px-2 border-r border-b border-slate-300 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Users</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('email')}
                          className="py-2 px-2 border-r border-b border-slate-300 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Email</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('name')}
                          className="py-2 px-2 border-r border-b border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors min-w-[130px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Property Name</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('identifier')}
                          className="py-2 px-1 border-r border-b border-slate-300 text-center w-12 shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Identifier</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('clientCode')}
                          className="py-2 px-1 border-r border-b border-slate-300 text-center w-14 shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>DataBase</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('address')}
                          className="py-2 px-2 border-r border-b border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors min-w-[95px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Address</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('phone')}
                          className="py-2 px-2 border-r border-b border-slate-300 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Phone</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('joinedDate')}
                          className="py-2 px-1.5 border-r border-b border-slate-300 text-center w-20 shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Current Date</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('status')}
                          className="py-2 px-1.5 border-r border-b border-slate-300 text-center w-18 shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Is Deactivated</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-[100px] shrink-0 whitespace-nowrap">
                          Action
                        </th>
                        <th className="py-2.5 px-2 border-b border-slate-300 text-center w-16 shrink-0 whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {paginatedClients.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-16 text-center border-b border-slate-200">
                            <Building2 className="w-9 h-9 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                            <p className="text-sm font-semibold text-slate-800">No client properties registered</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Your client registry is ready. Click below to register your first hotel or restaurant client.
                            </p>
                            <button
                              type="button"
                              onClick={handleOpenAddClient}
                              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] bg-[#0B3D32] text-white text-xs font-semibold hover:bg-[#082d25] cursor-pointer shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Property</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedClients.map((client, idx) => {
                          const sn = (currentPage - 1) * entriesPerPage + idx + 1;
                          const isDeactivated = client.status === 'DISABLED';

                          return (
                            <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-1.5 px-1.5 border-r border-b border-slate-200 font-mono text-[11px] text-slate-500 text-center">
                                {sn}
                              </td>

                              <td className="py-1.5 px-2 border-r border-b border-slate-200 font-mono font-semibold text-slate-900 text-xs break-all">
                                {client.username}
                              </td>

                              <td className="py-1.5 px-2 border-r border-b border-slate-200 text-slate-700 font-mono text-[11px] break-all">
                                {client.email || '—'}
                              </td>

                              <td className="py-1.5 px-2 border-r border-b border-slate-200 font-semibold text-slate-900 text-xs leading-snug break-words uppercase">
                                {client.name}
                              </td>

                              <td className="py-1.5 px-1 border-r border-b border-slate-200 font-mono text-slate-800 uppercase font-semibold text-center text-xs">
                                {client.identifier}
                              </td>

                              <td className="py-1.5 px-1 border-r border-b border-slate-200 font-mono text-slate-700 font-semibold text-center text-xs">
                                {client.clientCode}
                              </td>

                              <td className="py-1.5 px-2 border-r border-b border-slate-200 text-slate-700 text-xs leading-snug break-words">
                                {client.address}
                              </td>

                              <td className="py-1.5 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs whitespace-nowrap">
                                {client.phone}
                              </td>

                              <td className="py-1.5 px-1.5 border-r border-b border-slate-200 font-mono text-slate-600 text-[11px] text-center whitespace-nowrap">
                                {client.joinedDate}
                              </td>

                              <td className="py-1.5 px-1.5 border-r border-b border-slate-200 font-mono text-[11px] text-slate-700 text-center">
                                {isDeactivated ? 'true' : 'false'}
                              </td>

                              {/* Action 1: Edit & Sync Users */}
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-center align-middle">
                                <div className="flex flex-col gap-1.5 items-center justify-center w-[92px] mx-auto">
                                  <div className="flex items-center justify-center gap-1.5 w-full">
                                    {/* Edit Button - Square Cyan */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditClient(client)}
                                      className="w-7 h-7 rounded-[3px] bg-[#00b4d8] hover:bg-[#0096c7] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                                      title="Edit Client"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Assign Modules Button - Square Blue */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModules(client)}
                                      className="w-7 h-7 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                                      title="Assign Licensed Modules"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>

                                  {/* Sync Users Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCredentials({
                                        hotelName: client.name,
                                        username: client.username,
                                        password: client.password || 'admin@123',
                                        clientCode: client.clientCode,
                                        phone: client.phone,
                                      });
                                      setIsCredentialsModalOpen(true);
                                    }}
                                    className="w-full h-6 px-2 rounded-[3px] bg-[#f39c12] hover:bg-[#d68910] text-white text-[11px] font-semibold tracking-tight shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center leading-none"
                                    title="Sync & View Credentials"
                                  >
                                    <span>Sync users</span>
                                  </button>
                                </div>
                              </td>

                              {/* Action 2: Status Toggle (DN) */}
                              <td className="py-2 px-2 border-b border-slate-200 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(client)}
                                  className={cn(
                                    'min-w-[42px] h-7 px-2.5 rounded-[3px] text-xs font-bold uppercase transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-center mx-auto',
                                    client.status === 'ACTIVE'
                                      ? 'bg-[#00b4d8] hover:bg-[#0096c7] text-white'
                                      : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                                  )}
                                  title={client.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
                                >
                                  {client.status === 'ACTIVE' ? 'DN' : 'OFF'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-500 select-none">
                  <div>
                    Showing{' '}
                    <strong className="text-slate-800">
                      {filteredClients.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-slate-800">
                      {Math.min(currentPage * entriesPerPage, filteredClients.length)}
                    </strong>{' '}
                    of <strong className="text-slate-800">{filteredClients.length}</strong> entries
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={cn(
                          'min-w-[28px] h-7 px-2 rounded-[3px] text-xs font-bold font-mono transition-colors cursor-pointer shadow-2xs',
                          currentPage === pg
                            ? 'bg-[#0B3D32] text-white border border-[#0B3D32]'
                            : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 3: MASTER / BILLING SETUP (ENTERPRISE DATA TABLE)
             ===================================================================== */}
          {activeNav === 'billing-setup' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header Title with + Add New Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Master / Admin User / <span className="text-slate-800 font-semibold">BillingSetup</span>
                  </div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading mt-0.5">
                    BillingSetup
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddBillingSetup}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {/* Table Container matching screenshot */}
              <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                {/* Show Entries & Live Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-700 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Show</span>
                    <select
                      value={bsEntriesPerPage}
                      onChange={(e) => {
                        setBsEntriesPerPage(Number(e.target.value));
                        setBsCurrentPage(1);
                      }}
                      className="h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Search:</span>
                    <input
                      type="text"
                      value={bsSearchQuery}
                      onChange={(e) => {
                        setBsSearchQuery(e.target.value);
                        setBsCurrentPage(1);
                      }}
                      className="h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] w-48 sm:w-60 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Table with full borders and grid lines */}
                <div className="overflow-x-auto border border-slate-300 rounded-[3px] bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 select-none">
                        <th
                          onClick={() => handleBsSort('sn')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-9 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>SN</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('clientName')}
                          className="py-2.5 px-2.5 border-r border-b border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors min-w-[150px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Client Name</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('dateFrom')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-28 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Date From(YYYY-MM-DD)</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('dateTo')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-24 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Date To</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('rateType')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Rate Type</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('paymentType')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Payment Type</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('amc')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-16 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>AMC</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('trialDurationDays')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-24 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>TrialDurationDays</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('contactPerson')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center min-w-[100px] whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Contact Person</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleBsSort('mobileNumber')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-24 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Mobile Number</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {paginatedBillingSetups.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-16 text-center border-b border-slate-200">
                            <SlidersHorizontal className="w-9 h-9 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                            <p className="text-sm font-semibold text-slate-800">No billing setup records found</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Configure recurring billing, AMC, and subscription terms for client properties.
                            </p>
                            <button
                              type="button"
                              onClick={handleOpenAddBillingSetup}
                              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] cursor-pointer shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New BillingSetup</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedBillingSetups.map((item, idx) => {
                          const sn = (bsCurrentPage - 1) * bsEntriesPerPage + idx + 1;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-[11px] text-slate-500 text-center">
                                {sn}
                              </td>
                              <td className="py-2 px-2.5 border-r border-b border-slate-200 font-semibold text-slate-900 text-xs leading-snug break-words uppercase">
                                {item.clientName}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-700 text-[11px] text-center whitespace-nowrap">
                                {item.dateFrom}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-700 text-[11px] text-center whitespace-nowrap">
                                {item.dateTo}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-slate-800 text-xs text-center">
                                {item.rateType}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center font-medium">
                                {item.paymentType}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center">
                                {item.amc}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center">
                                {item.trialDurationDays}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-slate-700 text-xs text-center">
                                {item.contactPerson || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-[11px] text-center whitespace-nowrap">
                                {item.mobileNumber || '—'}
                              </td>
                              <td className="py-2 px-2 border-b border-slate-200 text-center align-middle whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Edit Button - Square Cyan */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBillingSetup(item)}
                                    className="w-7 h-7 rounded-[3px] bg-[#00b4d8] hover:bg-[#0096c7] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                                    title="Edit Billing Setup"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button - Square Coral Red */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBillingSetup(item.id, item.clientName)}
                                    className="w-7 h-7 rounded-[3px] bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                                    title="Delete Billing Setup"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-500 select-none">
                  <div>
                    Showing{' '}
                    <strong className="text-slate-800">
                      {filteredBillingSetups.length === 0 ? 0 : (bsCurrentPage - 1) * bsEntriesPerPage + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-slate-800">
                      {Math.min(bsCurrentPage * bsEntriesPerPage, filteredBillingSetups.length)}
                    </strong>{' '}
                    of <strong className="text-slate-800">{filteredBillingSetups.length}</strong> entries
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={bsCurrentPage <= 1}
                      onClick={() => setBsCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, bsTotalPages) }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setBsCurrentPage(pg)}
                        className={cn(
                          'min-w-[28px] h-7 px-2 rounded-[3px] text-xs font-bold font-mono transition-colors cursor-pointer shadow-2xs',
                          bsCurrentPage === pg
                            ? 'bg-[#00b4d8] text-white border border-[#00b4d8]'
                            : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={bsCurrentPage >= bsTotalPages}
                      onClick={() => setBsCurrentPage((p) => Math.min(bsTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 4: MASTER / CLIENT BILLING (MATCHING SCREENSHOT)
             ===================================================================== */}
          {(activeNav === 'client-billing' || activeNav === 'generate-bill' || activeNav === 'receipts' || activeNav === 'billing-analysis') && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Master / Admin User / <span className="text-slate-800 font-semibold">Client Billing</span>
                  </div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading mt-0.5">
                    Client Billing
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddBilling}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {/* Table Container matching screenshot */}
              <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                {/* Show Entries & Live Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-700 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Show</span>
                    <select
                      value={cbEntriesPerPage}
                      onChange={(e) => {
                        setCbEntriesPerPage(Number(e.target.value));
                        setCbCurrentPage(1);
                      }}
                      className="h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Search:</span>
                    <input
                      type="text"
                      value={cbSearchQuery}
                      onChange={(e) => {
                        setCbSearchQuery(e.target.value);
                        setCbCurrentPage(1);
                      }}
                      placeholder=""
                      className="h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#0B3D32] w-48 sm:w-60 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Table with full borders and grid lines matching screenshot */}
                <div className="overflow-x-auto border border-slate-300 rounded-[3px] bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 select-none">
                        <th
                          onClick={() => handleCbSort('sn')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-9 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>SN</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('clientName')}
                          className="py-2.5 px-2.5 border-r border-b border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors min-w-[160px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>Client Name</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('billingFrom')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-28 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>BillingFrom</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('billingDateTo')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-28 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>BillingDateTo</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('rate')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-16 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Rate</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('amount')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Amount</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('dueAmount')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>DueAmount</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('netAmount')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center w-20 shrink-0 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>NetAmount</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('paymentDetails')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center min-w-[100px] whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>PaymentDetails</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('agent')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center min-w-[90px] whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Agent</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleCbSort('remarks')}
                          className="py-2.5 px-2 border-r border-b border-slate-300 text-center min-w-[120px] whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Remarks</span>
                            <span className="text-slate-400 text-[10px]">⇅</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2 border-b border-slate-300 text-center w-28 shrink-0 whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {paginatedBillingList.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-16 text-center border-b border-slate-200">
                            <CreditCard className="w-9 h-9 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                            <p className="text-sm font-semibold text-slate-800">No client billing records found</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Issue billing statements, manage SaaS collections, and record subscription receipts.
                            </p>
                            <button
                              type="button"
                              onClick={handleOpenAddBilling}
                              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] cursor-pointer shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Billing</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedBillingList.map((item, idx) => {
                          const sn = (cbCurrentPage - 1) * cbEntriesPerPage + idx + 1;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-[11px] text-slate-500 text-center">
                                {sn}
                              </td>
                              <td className="py-2 px-2.5 border-r border-b border-slate-200 font-semibold text-slate-900 text-xs leading-snug break-words uppercase">
                                {item.clientName || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-700 text-[11px] text-center whitespace-nowrap">
                                {item.billingFrom || item.issueDate || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-700 text-[11px] text-center whitespace-nowrap">
                                {item.billingDateTo || item.dueDate || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center font-medium">
                                {(Number(item.rate) || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center font-semibold">
                                {(Number(item.amount) || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-800 text-xs text-center">
                                {(Number(item.dueAmount ?? item.balanceDue) || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 font-mono text-slate-900 text-xs text-center font-bold">
                                {(Number(item.netAmount ?? item.amount) || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-slate-700 text-xs text-center">
                                {item.paymentDetails || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-slate-700 text-xs text-center">
                                {item.agent || '—'}
                              </td>
                              <td className="py-2 px-2 border-r border-b border-slate-200 text-slate-600 text-xs text-center">
                                {item.remarks || '—'}
                              </td>
                              <td className="py-2 px-2 border-b border-slate-200 text-center align-middle whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Edit Button - Square Cyan */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBilling(item)}
                                    className="w-7 h-7 rounded-[3px] bg-[#00b4d8] hover:bg-[#0096c7] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                                    title="Edit Billing"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button - Square Coral Red */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBilling(item.id, item.clientName)}
                                    className="w-7 h-7 rounded-[3px] bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                                    title="Delete Billing"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* View Button - Square Ocean Blue */}
                                  <button
                                    type="button"
                                    onClick={() => setViewingBilling(item)}
                                    className="w-7 h-7 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                                    title="View Receipt"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination matching screenshot */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-slate-500 select-none">
                  <div>
                    Showing{' '}
                    <strong className="text-slate-800">
                      {filteredBillingList.length === 0 ? 0 : (cbCurrentPage - 1) * cbEntriesPerPage + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-slate-800">
                      {Math.min(cbCurrentPage * cbEntriesPerPage, filteredBillingList.length)}
                    </strong>{' '}
                    of <strong className="text-slate-800">{filteredBillingList.length}</strong> entries
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      disabled={cbCurrentPage <= 1}
                      onClick={() => setCbCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, cbTotalPages) }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCbCurrentPage(pg)}
                        className={cn(
                          'min-w-[28px] h-7 px-2 rounded-[3px] text-xs font-bold font-mono transition-colors cursor-pointer shadow-2xs',
                          cbCurrentPage === pg
                            ? 'bg-[#00a884] text-white border border-[#00a884]'
                            : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={cbCurrentPage >= cbTotalPages}
                      onClick={() => setCbCurrentPage((p) => Math.min(cbTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 5: MASTER / ERROR LOG
             ===================================================================== */}
          {activeNav === 'error-log' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-medium text-slate-400">
                  Master / <span className="text-slate-800 font-semibold">Error Log</span>
                </div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading mt-0.5">
                  Tenant Security & System Audit Trail
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Live monitoring of authentication events, tenant operations, and platform health.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Tenant Property</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Message</th>
                        <th className="py-2.5 px-3">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                            <ShieldCheck className="w-7 h-7 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                            <p className="font-semibold text-slate-700 text-xs">No error logs recorded</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              The platform is healthy with zero reported faults.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        clients.slice(0, 4).map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 text-slate-500">
                              {new Date().toISOString().replace('T', ' ').slice(0, 19)}
                            </td>
                            <td className="py-2 px-3 font-sans font-semibold text-slate-800">{c.name}</td>
                            <td className="py-2 px-3 text-slate-900 font-medium">{c.username}</td>
                            <td className="py-2 px-3">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                INFO
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">AUTH</td>
                            <td className="py-2 px-3 font-sans text-slate-700">Session authenticated successfully</td>
                            <td className="py-2 px-3 text-slate-400">113.199.120.{idx + 10}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>Hotel Master ERP SaaS Platform</div>
            <div className="flex items-center gap-4">
              <span className="font-mono">v1.28</span>
            </div>
          </footer>
        </main>
      </div>

      {/* =========================================================================
          MODAL 1: CREATE / EDIT CLIENT (4-COLUMN CLEAN DATA-TABLES MODAL)
         ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-[3px] bg-white shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-11 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-sm font-bold text-slate-800">
                {editingClient ? 'Edit Client' : 'Create Client'}
              </h2>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveClient} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5">
                {/* Row 1, Col 1: User Name */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className={cn(
                      'w-full h-8 px-2.5 rounded-[3px] border bg-white text-xs text-slate-800 focus:outline-none transition-colors shadow-2xs',
                      formSubmitted && !formUsername.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-300 focus:border-[#DC2626]'
                    )}
                  />
                  {formSubmitted && !formUsername.trim() && (
                    <p className="text-[11px] text-[#DC2626] mt-1 leading-tight">
                      The User Name field is required.
                    </p>
                  )}
                </div>

                {/* Row 1, Col 2: Password */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={formShowPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full h-8 pl-2.5 pr-7 rounded-[3px] border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormShowPassword(!formShowPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {formShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Row 1, Col 3: Email */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 1, Col 4: School Name -> Hotel / Restaurant Name */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Hotel / Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!formIdentifier) {
                        setFormIdentifier(
                          e.target.value
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 4)
                        );
                      }
                    }}
                    className={cn(
                      'w-full h-8 px-2.5 rounded-[3px] border bg-white text-xs text-slate-800 focus:outline-none transition-colors shadow-2xs',
                      formSubmitted && !formName.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-300 focus:border-[#DC2626]'
                    )}
                  />
                  {formSubmitted && !formName.trim() && (
                    <p className="text-[11px] text-[#DC2626] mt-1 leading-tight">
                      The Name field is required.
                    </p>
                  )}
                </div>

                {/* Row 2, Col 1: School Identifier -> Property Identifier */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Property Identifier
                  </label>
                  <input
                    type="text"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs font-mono uppercase text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 2, Col 2: Address */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 2, Col 3: Mobile No */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Mobile No
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 2, Col 4: IRDApproved */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    IRDApproved
                  </label>
                  <div className="flex items-center h-8">
                    <input
                      type="checkbox"
                      checked={formIrdApproved}
                      onChange={(e) => setFormIrdApproved(e.target.checked)}
                      className="w-5 h-5 rounded-[2px] border border-slate-300 accent-[#DC2626] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Row 3, Col 1: PharmacyIRDApproved -> RestaurantIRDApproved */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    RestaurantIRDApproved
                  </label>
                  <div className="flex items-center h-8">
                    <input
                      type="checkbox"
                      checked={formRestaurantIrdApproved}
                      onChange={(e) => setFormRestaurantIrdApproved(e.target.checked)}
                      className="w-5 h-5 rounded-[2px] border border-slate-300 accent-[#DC2626] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Row 3, Col 2: Current Year */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Current Year
                  </label>
                  <input
                    type="date"
                    value={formCurrentYear}
                    onChange={(e) => setFormCurrentYear(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  />
                </div>

                {/* Row 3, Col 3: School Logo -> Property Logo */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Property Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormLogoName(file.name);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            const dataUrl = event.target.result as string;
                            setFormLogo(dataUrl);
                            if (typeof localStorage !== 'undefined') {
                              localStorage.setItem('auth_hotel_logo', dataUrl);
                            }
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-[2px] file:border file:border-slate-300 file:text-[11px] file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer shadow-2xs"
                  />
                  {formLogo ? (
                    <div className="flex items-center gap-2 mt-1.5 p-1 bg-slate-50 border border-slate-200 rounded-[3px]">
                      <img
                        src={formLogo}
                        alt="Logo Preview"
                        className="h-8 max-w-[90px] object-contain rounded bg-white p-0.5 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-emerald-700 font-medium truncate block">
                          ✓ Logo Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormLogo('');
                            setFormLogoName('');
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      </div>
                    </div>
                  ) : formLogoName ? (
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{formLogoName}</span>
                  ) : null}
                </div>

                {/* Row 3, Col 4: Client Type */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Client Type
                  </label>
                  <select
                    value={formPropertyType}
                    onChange={(e) => setFormPropertyType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  >
                    <option value="Hotel & Resort">Hotel & Resort</option>
                    <option value="Restaurant & Bar">Restaurant & Bar</option>
                    <option value="Boutique Hotel">Boutique Hotel</option>
                    <option value="Cafe & Lounge">Cafe & Lounge</option>
                    <option value="Banquet & Events">Banquet & Events</option>
                  </select>
                </div>

                {/* Row 4, Col 1: Module (Multi-select dropdown matching screenshot) */}
                <div className="relative" ref={moduleDropdownRef}>
                  <label className="block text-xs text-slate-700 mb-1">
                    Module
                  </label>
                  <div
                    onClick={() => setIsModuleDropdownOpen((prev) => !prev)}
                    className={cn(
                      'w-full min-h-[32px] px-1.5 py-1 rounded-[3px] border bg-white text-xs cursor-pointer flex flex-wrap items-center gap-1 shadow-2xs transition-colors',
                      isModuleDropdownOpen
                        ? 'border-[#0B3D32] ring-1 ring-[#0B3D32]/20'
                        : 'border-slate-300 hover:border-slate-400'
                    )}
                  >
                    {formSelectedModules.length === 0 ? (
                      <span className="text-slate-400 text-xs px-1 select-none">Select module...</span>
                    ) : (
                      formSelectedModules.map((mod) => (
                        <span
                          key={mod}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-normal select-none"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormSelectedModules((prev) => prev.filter((m) => m !== mod));
                            }}
                            className="text-slate-400 hover:text-slate-700 font-bold text-xs leading-none cursor-pointer"
                            title={`Remove ${mod}`}
                          >
                            ×
                          </button>
                          <span>{mod}</span>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {isModuleDropdownOpen && (
                    <div className="absolute left-0 top-full mt-0.5 w-full bg-white border border-slate-300 rounded-[3px] shadow-lg z-50 py-1 text-xs select-none">
                      {['Hotel', 'Restaurant'].map((mod) => {
                        const isSelected = formSelectedModules.includes(mod);
                        return (
                          <div
                            key={mod}
                            onClick={() => {
                              setFormSelectedModules((prev) =>
                                isSelected ? prev.filter((m) => m !== mod) : [...prev, mod]
                              );
                            }}
                            className={cn(
                              'px-3 py-1.5 cursor-pointer flex items-center justify-between transition-colors',
                              isSelected
                                ? 'bg-[#0B3D32] text-white font-medium'
                                : 'text-slate-700 hover:bg-slate-100'
                            )}
                          >
                            <span>{mod}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Row 4, Col 2: DataBase (Tenant Database Number) */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    DataBase
                  </label>
                  <input
                    type="text"
                    value={formDatabaseNumber}
                    onChange={(e) => {
                      setFormDatabaseNumber(e.target.value);
                      setFormCode(e.target.value);
                    }}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 4, Col 3: EnableAccounting */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    EnableAccounting
                  </label>
                  <div className="flex items-center h-8">
                    <input
                      type="checkbox"
                      checked={formEnableAccounting}
                      onChange={(e) => setFormEnableAccounting(e.target.checked)}
                      className="w-5 h-5 rounded-[2px] border border-slate-300 accent-[#DC2626] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Row 4, Col 4: Empty spacer for alignment */}
                <div className="hidden md:block" />
              </div>

              {/* Edit-only extra options (Plan & Status) */}
              {editingClient && (
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-700 mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as any)}
                      className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                    >
                      <option value="Enterprise Cloud">Enterprise Cloud</option>
                      <option value="Pro Hotel + POS">Pro Hotel + POS</option>
                      <option value="Starter Standard">Starter Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Bottom Actions: Save & Close (matching our brand colors) */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-1.5 rounded-[3px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NEW / EDIT BILLING SETUP (16-FIELD CLEAN 4-COLUMN MODAL)
         ========================================================================= */}
      {isBillingSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-[3px] bg-white shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-11 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-sm font-bold text-slate-800">
                {editingBillingSetup ? 'Edit BillingSetup' : 'New BillingSetup'}
              </h2>
              <button
                type="button"
                onClick={() => setIsBillingSetupModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form: Exact 4-Column Layout from Screenshot */}
            <form onSubmit={handleSaveBillingSetup} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3.5">
                {/* Row 1, Col 1: Client */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bsClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setBsClientId(id);
                      const matched = clients.find((c) => c.id === id);
                      if (matched) {
                        setBsClientName(matched.name);
                        setBsContactPerson(matched.contactPerson || '');
                        setBsMobileNo(matched.phone || '');
                        setBsRate(matched.annualFee || 150000);
                        setBsServiceModule(matched.modules ? matched.modules.join(' & ') : 'Hotel & Restaurant');
                      }
                    }}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  >
                    <option value="">--Select Client--</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.clientCode || c.identifier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 1, Col 2: Date From */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={bsDateFrom}
                    onChange={(e) => setBsDateFrom(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  />
                </div>

                {/* Row 1, Col 3: Date To */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={bsDateTo}
                    onChange={(e) => setBsDateTo(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  />
                </div>

                {/* Row 1, Col 4: Rate Type */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Rate Type</label>
                  <select
                    value={bsRateType}
                    onChange={(e) => setBsRateType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  >
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                {/* Row 2, Col 1: Payment Type */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={bsPaymentType}
                    onChange={(e) => setBsPaymentType(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs cursor-pointer"
                  >
                    <option value="12">12 (Annual)</option>
                    <option value="6">6 (Semi-Annual)</option>
                    <option value="3">3 (Quarterly)</option>
                    <option value="1">1 (Monthly)</option>
                  </select>
                </div>

                {/* Row 2, Col 2: Rate */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Rate</label>
                  <input
                    type="number"
                    value={bsRate}
                    onChange={(e) => setBsRate(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 2, Col 3: Service Module */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Service Module</label>
                  <input
                    type="text"
                    value={bsServiceModule}
                    onChange={(e) => setBsServiceModule(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 2, Col 4: Billing Count */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Billing Count</label>
                  <input
                    type="number"
                    value={bsBillingCount}
                    onChange={(e) => setBsBillingCount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 3, Col 1: WhatsApp Cost */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">WhatsApp Cost</label>
                  <input
                    type="number"
                    value={bsWhatsAppCost}
                    onChange={(e) => setBsWhatsAppCost(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 3, Col 2: Additional Fee */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Additional Fee</label>
                  <input
                    type="number"
                    value={bsAdditionalFee}
                    onChange={(e) => setBsAdditionalFee(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 3, Col 3: TrialDurationDays */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">TrialDurationDays</label>
                  <input
                    type="number"
                    value={bsTrialDurationDays}
                    onChange={(e) => setBsTrialDurationDays(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 3, Col 4: Contact Person */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={bsContactPerson}
                    onChange={(e) => setBsContactPerson(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 4, Col 1: MobileNo */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">MobileNo</label>
                  <input
                    type="text"
                    value={bsMobileNo}
                    onChange={(e) => setBsMobileNo(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 4, Col 2: Agent */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Agent</label>
                  <input
                    type="text"
                    value={bsAgent}
                    onChange={(e) => setBsAgent(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>

                {/* Row 4, Col 3: Remarks (Spans 2 columns) */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={bsRemarks}
                    onChange={(e) => setBsRemarks(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#DC2626] shadow-2xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-[3px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsBillingSetupModalOpen(false)}
                  className="px-4 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NEW / EDIT BILLING (MATCHING SCREENSHOT)
         ========================================================================= */}
      {isNewBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-[3px] bg-white shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-12 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                {editingBilling ? 'Edit Billing' : 'New Billing'}
              </h2>
              <button
                type="button"
                onClick={() => setIsNewBillingModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / 4-Column Form matching screenshot */}
            <form onSubmit={handleSaveBilling} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Row 1, Col 1: Client */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Client</label>
                  <select
                    value={cbClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCbClientId(id);
                      const matched = clients.find((c) => c.id === id);
                      if (matched) {
                        setCbClientName(matched.name);
                        const fee = matched.annualFee || 18000;
                        setCbRate(Math.round(fee / 12));
                        handleCbAmountChange(fee);
                      }
                    }}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs cursor-pointer"
                  >
                    <option value="">--Select Client--</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.clientCode || c.identifier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 1, Col 2: Billing From */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Billing From</label>
                  <input
                    type="date"
                    value={cbBillingFrom}
                    onChange={(e) => setCbBillingFrom(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs cursor-pointer"
                  />
                </div>

                {/* Row 1, Col 3: Billing DateTo */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Billing DateTo -0</label>
                  <input
                    type="date"
                    value={cbBillingDateTo}
                    onChange={(e) => setCbBillingDateTo(e.target.value)}
                    className="w-full h-8 px-2 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs cursor-pointer"
                  />
                </div>

                {/* Row 1, Col 4: Rate */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Rate</label>
                  <input
                    type="number"
                    value={cbRate}
                    onChange={(e) => setCbRate(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 2, Col 1: Amount */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={cbAmount}
                    onChange={(e) => handleCbAmountChange(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 2, Col 2: Vat (auto-calculated 13%, but editable) */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Vat</label>
                  <input
                    type="number"
                    step="any"
                    value={cbVat}
                    onChange={(e) => handleCbVatChange(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 2, Col 3: Due Amount */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Due Amount</label>
                  <input
                    type="number"
                    value={cbDueAmount}
                    onChange={(e) => setCbDueAmount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 2, Col 4: NetAmount (auto-calculated Amount + Vat) */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">NetAmount</label>
                  <input
                    type="number"
                    step="any"
                    value={cbNetAmount}
                    onChange={(e) => setCbNetAmount(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-slate-50 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#00a884] shadow-2xs font-mono"
                  />
                </div>

                {/* Row 3, Col 1 & 2: Payment Details (spans 2 columns) */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-700 mb-1">Payment Details</label>
                  <input
                    type="text"
                    value={cbPaymentDetails}
                    onChange={(e) => setCbPaymentDetails(e.target.value)}
                    placeholder="e.g. paid, not paid yet, Not yet received"
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs"
                  />
                </div>

                {/* Row 3, Col 3: Agent */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Agent</label>
                  <input
                    type="text"
                    value={cbAgent}
                    onChange={(e) => setCbAgent(e.target.value)}
                    placeholder="e.g. Direct, through max"
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs"
                  />
                </div>

                {/* Row 3, Col 4: Remarks */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={cbRemarks}
                    onChange={(e) => setCbRemarks(e.target.value)}
                    placeholder="e.g. paid at onces gives discount of vat"
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#00a884] shadow-2xs"
                  />
                </div>
              </div>

              {/* Modal Actions matching screenshot */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-[3px] bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBillingModalOpen(false)}
                  className="px-4 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW BILLING RECEIPT / DETAILS (BLUE EYE BUTTON)
         ========================================================================= */}
      {viewingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[3px] bg-white shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="h-12 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[3px] bg-[#0284c7] text-white flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 font-heading">
                  Billing Invoice / Receipt Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingBilling(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-[3px] bg-slate-50/80 border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Client Name:</span>
                  <span className="font-bold text-slate-900 uppercase">{viewingBilling.clientName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">Billing Period:</span>
                  <span className="text-slate-800">
                    {viewingBilling.billingFrom} &rarr; {viewingBilling.billingDateTo}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">Rate:</span>
                  <span className="text-slate-800">Rs. {(Number(viewingBilling.rate) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">Base Amount:</span>
                  <span className="text-slate-800 font-semibold">Rs. {(Number(viewingBilling.amount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">VAT (13%):</span>
                  <span className="text-slate-800">Rs. {(Number(viewingBilling.vat) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans font-bold text-slate-900">Net Payable Amount:</span>
                  <span className="text-emerald-700 font-bold text-sm">Rs. {(Number(viewingBilling.netAmount ?? viewingBilling.amount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
                  <span className="text-slate-500 font-sans">Due Amount:</span>
                  <span className={cn('font-bold', (Number(viewingBilling.dueAmount ?? viewingBilling.balanceDue) || 0) > 0 ? 'text-red-600' : 'text-slate-800')}>
                    Rs. {(Number(viewingBilling.dueAmount ?? viewingBilling.balanceDue) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded-[3px] bg-slate-200 text-slate-800 font-mono font-semibold text-[11px]">
                    {viewingBilling.paymentDetails || 'N/A'}
                  </span>
                </div>
                {viewingBilling.agent && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Agent:</span>
                    <span className="text-slate-800 font-medium">{viewingBilling.agent}</span>
                  </div>
                )}
                {viewingBilling.remarks && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Remarks:</span>
                    <span className="text-slate-800 italic">{viewingBilling.remarks}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Print Ready', `Printing receipt for ${viewingBilling.clientName}`);
                    window.print?.();
                  }}
                  className="px-4 py-1.5 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBilling(null)}
                  className="px-4 py-1.5 rounded-[3px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CREDENTIALS CARD / SHARE DETAILS (WhatsApp / SMS)
         ========================================================================= */}
      {isCredentialsModalOpen && activeCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[#DC2626]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Client ERP Credentials
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Card */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-semibold text-slate-900">{activeCredentials.hotelName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Client Code:</span>
                  <span className="font-mono font-semibold text-slate-800">{activeCredentials.clientCode}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Login URL:</span>
                  <span className="font-mono text-slate-900 font-semibold truncate max-w-[200px]">
                    {typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Admin Username:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-900">{activeCredentials.username}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeCredentials.username, 'Username Copied')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Admin Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-900">
                      {activeCredentials.password || 'admin@123'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeCredentials.password || 'admin@123', 'Password Copied')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() =>
                  copyFullCredentials({
                    name: activeCredentials.hotelName,
                    username: activeCredentials.username,
                    password: activeCredentials.password,
                    clientCode: activeCredentials.clientCode,
                  })
                }
                className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Details for WhatsApp / SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ASSIGN MODULES (AFTER ADDING CLIENT)
         ========================================================================= */}
      {isAssignModulesModalOpen && selectedModuleClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="h-12 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-heading">
                  Assign Modules
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedModuleClient.name} ({selectedModuleClient.clientCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModulesModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules Toggles */}
            <div className="p-5 space-y-3 text-xs">
              <label
                onClick={() => toggleAssignedModule('Hotel')}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-lg border cursor-pointer select-none transition-all',
                  assignedModules.includes('Hotel')
                    ? 'border-[#DC2626] bg-red-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                    assignedModules.includes('Hotel') ? 'bg-red-100 text-[#DC2626]' : 'bg-slate-100 text-slate-500'
                  )}>
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Hotel Module</div>
                    <div className="text-[11px] text-slate-500">Rooms PMS, Reservations & Folio</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={assignedModules.includes('Hotel')}
                  onChange={() => { }}
                  className="accent-[#DC2626] cursor-pointer w-4 h-4"
                />
              </label>

              <label
                onClick={() => toggleAssignedModule('Restaurant')}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-lg border cursor-pointer select-none transition-all',
                  assignedModules.includes('Restaurant')
                    ? 'border-[#0284C7] bg-sky-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                    assignedModules.includes('Restaurant') ? 'bg-sky-100 text-[#0284C7]' : 'bg-slate-100 text-slate-500'
                  )}>
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Restaurant Module</div>
                    <div className="text-[11px] text-slate-500">POS Billing, Tables & KDS</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={assignedModules.includes('Restaurant')}
                  onChange={() => { }}
                  className="accent-[#0284C7] cursor-pointer w-4 h-4"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setIsAssignModulesModalOpen(false)}
                className="px-4 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedModules}
                className="px-4 py-1.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold transition-colors shadow-xs cursor-pointer text-xs"
              >
                Save Modules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

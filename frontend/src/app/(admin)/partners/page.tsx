'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users2,
  Compass,
  UserCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  DollarSign,
  Receipt,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  BusinessPartner,
  PartnerType,
  PaymentResponsibility,
  PaymentTerms,
  ReferralType,
  CommissionType,
  CommissionBasis,
  CommissionPaymentRule,
  PartnerCommission,
  PartnerCommissionPayment,
  CorporateStatementEntry,
  loadBusinessPartnersFromStorage,
  saveBusinessPartnersToStorage,
  loadCommissionsFromStorage,
  saveCommissionsToStorage,
  loadCommissionPaymentsFromStorage,
  saveCommissionPaymentsToStorage,
  loadCorporateStatementsFromStorage,
  saveCorporateStatementsToStorage,
  SEED_CORPORATE_STATEMENTS,
  generatePartnerCode,
  calculatePartnerCommission,
} from '@/lib/businessPartners';

export default function BusinessPartnersPage() {
  const toast = useToast();

  // Master Data States
  const [partners, setPartners] = useState<BusinessPartner[]>(() => loadBusinessPartnersFromStorage());
  const [commissions, setCommissions] = useState<PartnerCommission[]>(() => loadCommissionsFromStorage());
  const [payments, setPayments] = useState<PartnerCommissionPayment[]>(() => loadCommissionPaymentsFromStorage());
  const [corporateStatements, setCorporateStatements] = useState<Record<string, CorporateStatementEntry[]>>(() => loadCorporateStatementsFromStorage());

  // Navigation Tabs: Corporate | Travel Agents | Individual Referral | Commission & Settlement
  const [activeTab, setActiveTab] = useState<
    'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL' | 'SETTLEMENT'
  >('CORPORATE');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [profilePartner, setProfilePartner] = useState<BusinessPartner | null>(null);
  const [profileTab, setProfileTab] = useState<'OVERVIEW' | 'RESERVATIONS' | 'COMMISSIONS' | 'STATEMENT' | 'PAYMENTS'>('OVERVIEW');

  // Settlement Selection & Payout Modal
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'WALLET' | 'OTHER'>('BANK_TRANSFER');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Commission & Settlement tab specific filters & pagination
  const [commissionStatusTab, setCommissionStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');
  const [commissionSearchQuery, setCommissionSearchQuery] = useState('');
  const [commissionCurrentPage, setCommissionCurrentPage] = useState(1);
  const [commissionPageSize, setCommissionPageSize] = useState(10);

  // Partner Form State
  const [partnerTypeForm, setPartnerTypeForm] = useState<PartnerType>('CORPORATE');
  const [formData, setFormData] = useState<Partial<BusinessPartner>>({
    country: 'Nepal',
    status: 'ACTIVE',
    commissionEnabled: false,
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    defaultPaymentResponsibility: 'COMPANY_PAYS',
    paymentTerms: 'NET_30',
  });

  // Keep storage in sync with other windows
  useEffect(() => {
    const handleSync = () => {
      setPartners(loadBusinessPartnersFromStorage());
      setCommissions(loadCommissionsFromStorage());
      setPayments(loadCommissionPaymentsFromStorage());
      setCorporateStatements(loadCorporateStatementsFromStorage());
    };
    window.addEventListener('business_partners_updated', handleSync);
    window.addEventListener('partner_commissions_updated', handleSync);
    window.addEventListener('partner_payments_updated', handleSync);
    window.addEventListener('corporate_statements_updated', handleSync);
    return () => {
      window.removeEventListener('business_partners_updated', handleSync);
      window.removeEventListener('partner_commissions_updated', handleSync);
      window.removeEventListener('partner_payments_updated', handleSync);
      window.removeEventListener('corporate_statements_updated', handleSync);
    };
  }, []);

  // System configured currency helper
  const appCurrency = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_base_currency') || localStorage.getItem('property_currency');
        if (stored) return stored.toUpperCase();
        const setupMaster = localStorage.getItem('hotel_setup_master_currencies') || localStorage.getItem('hotel_setup_currencies');
        if (setupMaster) {
          const parsed = JSON.parse(setupMaster);
          const defaultCur = Array.isArray(parsed) ? parsed.find((c: any) => c.isDefault) || parsed[0] : null;
          if (defaultCur?.code) return defaultCur.code.toUpperCase();
        }
      } catch {}
    }
    return 'NPR';
  }, []);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      // Tab filter
      if (activeTab === 'CORPORATE' && p.partnerType !== 'CORPORATE') return false;
      if (activeTab === 'TRAVEL_AGENT' && p.partnerType !== 'TRAVEL_AGENT') return false;
      if (activeTab === 'INDIVIDUAL_REFERRAL' && p.partnerType !== 'INDIVIDUAL_REFERRAL') return false;

      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      // Search filter (Code, Name, Contact, Phone, Email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = p.partnerCode.toLowerCase().includes(q);
        const matchName = p.partnerName.toLowerCase().includes(q);
        const matchContact = p.contactPerson ? p.contactPerson.toLowerCase().includes(q) : false;
        const matchPhone = p.phone.includes(q);
        const matchEmail = p.email ? p.email.toLowerCase().includes(q) : false;
        return matchCode || matchName || matchContact || matchPhone || matchEmail;
      }
      return true;
    });
  }, [partners, activeTab, statusFilter, searchQuery]);

  // Pagination calculations for Partners
  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedPartners = useMemo(() => {
    return filteredPartners.slice(startIndex, startIndex + pageSize);
  }, [filteredPartners, startIndex, pageSize]);

  // Reset page when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  // Filtered & Paginated Commissions for Commission & Settlement Tab
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (commissionStatusTab !== 'ALL' && c.status !== commissionStatusTab) return false;
      if (commissionSearchQuery.trim()) {
        const q = commissionSearchQuery.toLowerCase().trim();
        return (
          c.partnerName.toLowerCase().includes(q) ||
          c.partnerCode.toLowerCase().includes(q) ||
          c.bookingCode.toLowerCase().includes(q) ||
          c.guestName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [commissions, commissionStatusTab, commissionSearchQuery]);

  const totalCommissionPages = Math.max(1, Math.ceil(filteredCommissions.length / commissionPageSize));
  const safeCommissionCurrentPage = Math.min(commissionCurrentPage, totalCommissionPages);
  const commissionStartIndex = (safeCommissionCurrentPage - 1) * commissionPageSize;
  const paginatedCommissions = useMemo(() => {
    return filteredCommissions.slice(commissionStartIndex, commissionStartIndex + commissionPageSize);
  }, [filteredCommissions, commissionStartIndex, commissionPageSize]);

  useEffect(() => {
    setCommissionCurrentPage(1);
  }, [commissionStatusTab, commissionSearchQuery]);

  // Open Create Modal
  const handleOpenAddModal = (initialType?: PartnerType) => {
    const chosenType = initialType || (activeTab === 'CORPORATE' ? 'CORPORATE' : activeTab === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : activeTab === 'INDIVIDUAL_REFERRAL' ? 'INDIVIDUAL_REFERRAL' : 'CORPORATE');
    setPartnerTypeForm(chosenType);
    setFormData({
      partnerCode: '',
      country: 'Nepal',
      status: 'ACTIVE',
      companyType: chosenType === 'CORPORATE' ? 'Private Limited' : undefined,
      defaultPaymentResponsibility: 'COMPANY_ACCOUNT',
      defaultBillingArrangement: 'COMPANY_ACCOUNT',
      paymentTerms: 'NET_30',
      creditLimit: chosenType === 'CORPORATE' ? 100000 : 0,
      referralType: chosenType === 'INDIVIDUAL_REFERRAL' ? 'TOURIST_GUIDE' : undefined,
      commissionEnabled: chosenType !== 'CORPORATE',
      commissionType: chosenType === 'INDIVIDUAL_REFERRAL' ? 'FIXED_PER_BOOKING' : 'PERCENTAGE',
      commissionValue: chosenType === 'INDIVIDUAL_REFERRAL' ? 500 : 10,
      commissionBasis: 'ROOM_CHARGES',
      commissionPaymentRule: 'AFTER_CHECKOUT',
    });
    setEditingPartner(null);
    setIsAddPartnerOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setPartnerTypeForm(partner.partnerType);
    setFormData({ ...partner });
    setIsAddPartnerOpen(true);
  };

  // Save Partner (Create or Update)
  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerCode?.trim()) {
      toast.error('Partner Code is required.');
      return;
    }
    if (!formData.partnerName?.trim()) {
      toast.error('Partner Name is required.');
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error('Phone Number is required.');
      return;
    }

    const partnerCodeFormatted = formData.partnerCode.trim().toUpperCase();
    const isDuplicate = partners.some(
      (p) => p.partnerCode.toUpperCase() === partnerCodeFormatted && p.id !== editingPartner?.id
    );
    if (isDuplicate) {
      toast.error('Duplicate Partner Code', `Partner code "${partnerCodeFormatted}" is already in use.`);
      return;
    }

    if (editingPartner) {
      // Update
      const updatedList = partners.map((p) =>
        p.id === editingPartner.id
          ? ({
              ...p,
              ...formData,
              partnerCode: partnerCodeFormatted,
              partnerType: partnerTypeForm,
              creditAllowed: partnerTypeForm === 'CORPORATE' ? formData.creditAllowed !== false : undefined,
              negotiatedRoomRate: undefined,
              updatedAt: new Date().toISOString(),
            } as BusinessPartner)
          : p
      );
      setPartners(updatedList);
      saveBusinessPartnersToStorage(updatedList);
      toast.success('Partner Updated', `${formData.partnerName} updated successfully.`);
    } else {
      // Create
      const isCreditAllowed = partnerTypeForm === 'CORPORATE' ? formData.creditAllowed !== false : false;
      const newPartner: BusinessPartner = {
        id: `bp_${Date.now()}`,
        partnerCode: partnerCodeFormatted,
        partnerType: partnerTypeForm,
        partnerName: formData.partnerName.trim(),
        contactPerson: formData.contactPerson?.trim() || undefined,
        designation: formData.designation?.trim() || undefined,
        phone: formData.phone.trim(),
        alternativePhone: formData.alternativePhone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        country: formData.country || 'Nepal',
        province: formData.province || undefined,
        district: formData.district || undefined,
        city: formData.city || undefined,
        address: formData.address || undefined,
        panVatNumber: formData.panVatNumber || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        companyType: partnerTypeForm === 'CORPORATE' ? formData.companyType || 'Private Limited' : undefined,
        defaultBillingArrangement: formData.defaultBillingArrangement || (isCreditAllowed ? 'COMPANY_ACCOUNT' : 'GUEST_DIRECT'),
        defaultPaymentResponsibility: formData.defaultPaymentResponsibility || (isCreditAllowed ? 'COMPANY_PAYS' : 'GUEST_PAYS'),
        creditAllowed: isCreditAllowed,
        creditLimit: Number(formData.creditLimit) || 0,
        paymentTerms: formData.paymentTerms || 'NET_30',
        customPaymentTermsDays: Number(formData.customPaymentTermsDays) || 0,
        negotiatedDiscountPercent: Number(formData.negotiatedDiscountPercent) || 0,
        negotiatedRoomRate: undefined,
        referralType: partnerTypeForm === 'INDIVIDUAL_REFERRAL' ? formData.referralType || 'LOCAL_INDIVIDUAL' : undefined,
        commissionEnabled: !!formData.commissionEnabled,
        commissionType: formData.commissionType || 'PERCENTAGE',
        commissionValue: Number(formData.commissionValue) || 0,
        commissionBasis: formData.commissionBasis || 'ROOM_CHARGES',
        commissionPaymentRule: formData.commissionPaymentRule || 'AFTER_CHECKOUT',
        totalBookings: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        outstandingCommission: 0,
        corporateReceivableBalance: 0,
        status: (formData.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = [newPartner, ...partners];
      setPartners(updatedList);
      saveBusinessPartnersToStorage(updatedList);
      toast.success('Partner Created', `${newPartner.partnerName} (${newPartner.partnerCode}) created successfully.`);
    }

    setIsAddPartnerOpen(false);
  };

  // Toggle Partner Status
  const handleToggleStatus = (partner: BusinessPartner) => {
    const newStatus = partner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = partners.map((p) =>
      p.id === partner.id ? { ...p, status: newStatus as 'ACTIVE' | 'INACTIVE', updatedAt: new Date().toISOString() } : p
    );
    setPartners(updated);
    saveBusinessPartnersToStorage(updated);
    toast.info('Status Updated', `${partner.partnerName} marked as ${newStatus}.`);
  };

  // Commission Approval
  const handleApproveCommission = (commissionId: string) => {
    const updated = commissions.map((c) =>
      c.id === commissionId
        ? {
            ...c,
            status: 'APPROVED' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: 'Hotel Manager',
          }
        : c
    );
    setCommissions(updated);
    saveCommissionsToStorage(updated);
    toast.success('Commission Approved', 'The commission has been approved for settlement.');
  };

  // Open Payout Modal
  const handleOpenPayout = () => {
    if (selectedCommissionIds.length === 0) {
      toast.info('Please select at least one approved commission to payout.');
      return;
    }
    setPayoutReference('');
    setPayoutNotes('');
    setIsPayoutModalOpen(true);
  };

  // Confirm Payout
  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const toPay = commissions.filter((c) => selectedCommissionIds.includes(c.id));
    if (toPay.length === 0) return;

    const totalAmount = toPay.reduce((sum, c) => sum + c.commissionAmount, 0);
    const partnerId = toPay[0].partnerId;
    const partner = partners.find((p) => p.id === partnerId);

    const newPayment: PartnerCommissionPayment = {
      id: `cpay_${Date.now()}`,
      partnerId,
      partnerCode: partner?.partnerCode || toPay[0].partnerCode,
      partnerName: partner?.partnerName || toPay[0].partnerName,
      paymentNumber: `CPAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      paymentDate: new Date().toISOString(),
      amount: totalAmount,
      paymentMethod: payoutMethod,
      referenceNumber: payoutReference.trim() || undefined,
      paidBy: 'Hotel Manager',
      notes: payoutNotes.trim() || undefined,
      commissionIds: selectedCommissionIds,
      createdAt: new Date().toISOString(),
    };

    // Update commissions
    const updatedCommissions = commissions.map((c) =>
      selectedCommissionIds.includes(c.id)
        ? {
            ...c,
            status: 'PAID' as const,
            paidAt: new Date().toISOString(),
            paymentId: newPayment.id,
          }
        : c
    );
    setCommissions(updatedCommissions);
    saveCommissionsToStorage(updatedCommissions);

    // Save payment
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    saveCommissionPaymentsToStorage(updatedPayments);

    // Update partner aggregate numbers
    const updatedPartners = partners.map((p) => {
      if (p.id === partnerId) {
        const newPaid = p.totalCommissionPaid + totalAmount;
        const newOutstanding = Math.max(0, p.totalCommissionEarned - newPaid);
        return {
          ...p,
          totalCommissionPaid: newPaid,
          outstandingCommission: newOutstanding,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setPartners(updatedPartners);
    saveBusinessPartnersToStorage(updatedPartners);

    setSelectedCommissionIds([]);
    setIsPayoutModalOpen(false);
    toast.success(
      'Payout Completed',
      `Paid NPR ${totalAmount.toLocaleString()} to ${newPayment.partnerName} (${newPayment.paymentNumber}).`
    );
  };

  // Aggregate stats
  const partnerCounts = useMemo(() => {
    return {
      all: partners.length,
      corporate: partners.filter((p) => p.partnerType === 'CORPORATE').length,
      travelAgents: partners.filter((p) => p.partnerType === 'TRAVEL_AGENT').length,
      referrals: partners.filter((p) => p.partnerType === 'INDIVIDUAL_REFERRAL').length,
      active: partners.filter((p) => p.status === 'ACTIVE').length,
      totalCommissionPayable: commissions
        .filter((c) => c.status === 'APPROVED' || c.status === 'PENDING')
        .reduce((sum, c) => sum + c.commissionAmount, 0),
      totalCorporateReceivables: partners.reduce((sum, p) => sum + (p.corporateReceivableBalance || 0), 0),
    };
  }, [partners, commissions]);

  return (
    <div className="space-y-3.5 w-full min-w-0 pb-16 select-none">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Clean Title & Primary Action
          ----------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Business Partners
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add New Partner</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MAIN MODULE TABS: Clean Boxed Buttons (No numbers, no NPR badges)
          ----------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('CORPORATE')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'CORPORATE'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Corporate / Companies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRAVEL_AGENT')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'TRAVEL_AGENT'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Travel Agents</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INDIVIDUAL_REFERRAL')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'INDIVIDUAL_REFERRAL'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Individual Referral Partners</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTLEMENT')}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'SETTLEMENT'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Commission &amp; Settlement</span>
        </button>
      </div>

      {/* -----------------------------------------------------------------------
          TAB CONTENT 1 TO 4: PARTNER DIRECTORY VIEWS
          ----------------------------------------------------------------------- */}
      {activeTab !== 'SETTLEMENT' ? (
        <>
          {/* FILTER TOOLBAR: Show entries (Far Left) + Status Filter + Instant Search (No Placeholder) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Show [ 10 ] entries per page (Far Left) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-[28px] px-2 border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] bg-white dark:bg-[#07241E] text-xs font-semibold text-[#24352F] dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">entries per page</span>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-[28px] px-2 border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] bg-white dark:bg-[#07241E] text-xs font-semibold text-[#24352F] dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Instant Search Bar (No Placeholder) */}
            <div className="relative w-full sm:w-64 shrink-0 sm:ml-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN DATATABLE */}
          <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                    <th className="py-2.5 px-2.5 w-[105px] border-r border-[#E5EEE9] dark:border-[#145447]">PARTNER CODE</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">PARTNER NAME</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">TYPE</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">CONTACT / PHONE</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">COMMERCIAL TERMS</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">CREDIT TERMS</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-center">BOOKINGS</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-right">OUTSTANDING</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-center">STATUS</th>
                    <th className="py-2.5 px-3.5 text-right w-[140px]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-slate-700 dark:text-slate-200">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                        No business partners found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedPartners.map((p, idx) => {
                      const isCorporate = p.partnerType === 'CORPORATE';
                      const isTravelAgent = p.partnerType === 'TRAVEL_AGENT';
                      const isReferral = p.partnerType === 'INDIVIDUAL_REFERRAL';

                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            'group transition-colors border-b border-[#E5EEE9] dark:border-[#145447]',
                            'bg-white even:bg-[#F9FAFB] dark:bg-[#07241E] dark:even:bg-[#061B16]',
                            'hover:bg-[#F1F5F9] dark:hover:bg-[#0B3D32]/20'
                          )}
                        >
                          {/* # */}
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#64736C] dark:text-[#A4B8AE] border-r border-[#E5EEE9] dark:border-[#145447]">
                            {startIndex + idx + 1}
                          </td>

                          {/* Code (Compact Width) */}
                          <td className="py-2.5 px-2.5 w-[105px] font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {p.partnerCode}
                          </td>

                          {/* Name & Subtitle */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-bold text-[#24352F] dark:text-white text-xs hover:underline cursor-pointer" onClick={() => { setProfilePartner(p); setProfileTab('OVERVIEW'); }}>
                              {p.partnerName}
                            </div>
                            <div className="text-[10px] text-[#879B90] dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {p.panVatNumber && <span>PAN: {p.panVatNumber}</span>}
                              {p.city && <span>• {p.city}</span>}
                            </div>
                          </td>

                          {/* Partner Type Badge */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isCorporate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-900">
                                <Building2 className="w-3 h-3" />
                                <span>Corporate</span>
                              </span>
                            )}
                            {isTravelAgent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold text-[10px] border border-purple-200 dark:border-purple-900">
                                <Compass className="w-3 h-3" />
                                <span>Travel Agent</span>
                              </span>
                            )}
                            {isReferral && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px] border border-amber-200 dark:border-amber-900">
                                <UserCheck className="w-3 h-3" />
                                <span>Individual Referral</span>
                              </span>
                            )}
                          </td>

                          {/* Contact Person & Phone */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-semibold text-xs text-[#24352F] dark:text-slate-200">
                              {p.contactPerson || '—'}
                            </div>
                            <div className="text-[11px] font-mono text-[#64736C] dark:text-[#A4B8AE]">
                              {p.phone}
                            </div>
                          </td>

                          {/* Commercial Terms (Billing / Commission / Discount) */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isCorporate ? (
                              <div>
                                <div className="font-bold text-xs text-[#24352F] dark:text-white">
                                  {p.defaultBillingArrangement === 'SPLIT_BILLING' || p.defaultPaymentResponsibility === 'SPLIT'
                                    ? 'Split Billing'
                                    : p.creditAllowed === false || p.defaultBillingArrangement === 'GUEST_DIRECT' || p.defaultPaymentResponsibility === 'GUEST_PAYS'
                                    ? 'Guest Direct'
                                    : 'Company Account'}
                                </div>
                                {p.negotiatedDiscountPercent && p.negotiatedDiscountPercent > 0 ? (
                                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                    {p.negotiatedDiscountPercent}% Disc.
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                    Standard Rates
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {p.commissionEnabled && p.commissionValue ? (
                                  <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                    {p.commissionType === 'PERCENTAGE'
                                      ? `${p.commissionValue}% Comm.`
                                      : p.commissionType === 'FIXED_PER_BOOKING'
                                      ? `${appCurrency} ${p.commissionValue.toLocaleString()} / Booking`
                                      : `${appCurrency} ${p.commissionValue.toLocaleString()} / Night`}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">No Commission</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Credit Terms (Separate Column) */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isCorporate ? (
                              p.creditAllowed === false || p.defaultBillingArrangement === 'GUEST_DIRECT' || p.defaultPaymentResponsibility === 'GUEST_PAYS' ? (
                                <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">No Credit</span>
                              ) : (
                                <div>
                                  <div className="font-semibold text-xs text-[#0B3D32] dark:text-emerald-400">
                                    {p.paymentTerms === 'CUSTOM' && p.customPaymentTermsDays
                                      ? `${p.customPaymentTermsDays} Days Net`
                                      : `${p.paymentTerms ? p.paymentTerms.replace('NET_', '') : '30'} Days Credit`}
                                  </div>
                                  {p.creditLimit && p.creditLimit > 0 ? (
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                      Limit: {appCurrency} {p.creditLimit.toLocaleString()}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            ) : (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {p.commissionPaymentRule?.replace(/_/g, ' ') || 'After Checkout'}
                              </div>
                            )}
                          </td>

                          {/* Total Bookings */}
                          <td className="py-2.5 px-3.5 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {p.totalBookings}
                          </td>

                          {/* Outstanding (Payable vs Receivable) */}
                          <td className="py-2.5 px-3.5 text-right font-mono border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isCorporate ? (
                              <div>
                                <div className={cn(
                                  "font-bold text-xs",
                                  p.corporateReceivableBalance > 0 ? "text-blue-700 dark:text-blue-400" : "text-slate-500"
                                )}>
                                  NPR {(p.corporateReceivableBalance || 0).toLocaleString()}
                                </div>
                                <div className="text-[9px] uppercase tracking-wide text-slate-400 font-sans">
                                  Receivable
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className={cn(
                                  "font-bold text-xs",
                                  p.outstandingCommission > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-500"
                                )}>
                                  NPR {(p.outstandingCommission || 0).toLocaleString()}
                                </div>
                                <div className="text-[9px] uppercase tracking-wide text-slate-400 font-sans">
                                  Payable Comm
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3.5 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-bold text-[10px]',
                                p.status === 'ACTIVE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400')} />
                              <span>{p.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3.5 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setProfilePartner(p);
                                  setProfileTab('OVERVIEW');
                                }}
                                className="p-1 rounded-[2px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="View Partner Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1 rounded-[2px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Partner"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(p)}
                                className={cn(
                                  'p-1 rounded-[2px] transition-colors cursor-pointer',
                                  p.status === 'ACTIVE'
                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                )}
                                title={p.status === 'ACTIVE' ? 'Deactivate Partner' : 'Activate Partner'}
                              >
                                {p.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
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

            {/* DATATABLES PAGINATION FOOTER */}
            <div className="p-2.5 border-t border-[#DCE3DF] dark:border-[#145447] bg-[#F4F7F5] dark:bg-[#061B16] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64736C] dark:text-[#A4B8AE]">
              <div>
                Showing {filteredPartners.length === 0 ? 0 : startIndex + 1} to{' '}
                {Math.min(startIndex + pageSize, filteredPartners.length)} of {filteredPartners.length} entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold shadow-2xs"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={cn(
                      'w-7 h-7 rounded-[3px] font-bold text-xs transition-all shadow-2xs cursor-pointer',
                      safeCurrentPage === num
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-700'
                        : 'border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* -----------------------------------------------------------------------
           TAB CONTENT 5: COMMISSION & SETTLEMENT ENGINE (Clean Boxed Style)
           ----------------------------------------------------------------------- */
        <div className="space-y-2.5">
          {/* TOOLBAR: Show entries (Far Left) + Boxed Status Tabs + Search & Record Payout (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Show [ 10 ] entries per page */}
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">Show</span>
                <select
                  value={commissionPageSize}
                  onChange={(e) => {
                    setCommissionPageSize(Number(e.target.value));
                    setCommissionCurrentPage(1);
                  }}
                  className="h-[28px] px-2 border border-[#DCE3DF] dark:border-[#145447] rounded-[3px] bg-white dark:bg-[#07241E] text-xs font-semibold text-[#24352F] dark:text-slate-200 focus:outline-none focus:border-[#0B3D32] cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">entries per page</span>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Status Tabs as Clean Boxed Buttons (No numbers, no badges) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'PENDING', 'APPROVED', 'PAID'] as const).map((st) => {
                  const isActive = commissionStatusTab === st;
                  const label = st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'APPROVED' ? 'Approved' : 'Paid';
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCommissionStatusTab(st)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-all cursor-pointer select-none whitespace-nowrap',
                        isActive
                          ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs font-bold dark:bg-emerald-700 dark:border-emerald-700'
                          : 'bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 border-[#DCE3DF] dark:border-[#145447] hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Search Box (No placeholder) & Record Payout Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:ml-auto">
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={commissionSearchQuery}
                  onChange={(e) => setCommissionSearchQuery(e.target.value)}
                  className="w-full h-[28px] rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:text-white dark:focus:border-emerald-500"
                />
                {commissionSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCommissionSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenPayout}
                disabled={selectedCommissionIds.length === 0}
                className="inline-flex items-center gap-1.5 h-[28px] px-3 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-all shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payout</span>
              </button>
            </div>
          </div>

          {/* Commission Table */}
          <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                      <input
                        type="checkbox"
                        checked={
                          selectedCommissionIds.length > 0 &&
                          selectedCommissionIds.length === filteredCommissions.filter((c) => c.status === 'APPROVED').length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommissionIds(filteredCommissions.filter((c) => c.status === 'APPROVED').map((c) => c.id));
                          } else {
                            setSelectedCommissionIds([]);
                          }
                        }}
                        className="rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
                        title="Select all approved commissions"
                      />
                    </th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">PARTNER</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">BOOKING / GUEST</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">STAY DATES</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-right">ELIGIBLE CHARGES</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">RATE</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-right">COMMISSION</th>
                    <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-center">STATUS</th>
                    <th className="py-2.5 px-3.5 text-right w-[120px]">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-slate-700 dark:text-slate-200">
                  {filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                        No commission records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedCommissions.map((c) => {
                      const isSelected = selectedCommissionIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            'group transition-colors border-b border-[#E5EEE9] dark:border-[#145447]',
                            'bg-white even:bg-[#F9FAFB] dark:bg-[#07241E] dark:even:bg-[#061B16]',
                            'hover:bg-[#F1F5F9] dark:hover:bg-[#0B3D32]/20',
                            isSelected && 'bg-emerald-50/50 even:bg-emerald-50/70 dark:bg-emerald-950/20'
                          )}
                        >
                          {/* Checkbox (Only selectable if APPROVED) */}
                          <td className="py-2.5 px-3 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                            {c.status === 'APPROVED' ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCommissionIds([...selectedCommissionIds, c.id]);
                                  } else {
                                    setSelectedCommissionIds(selectedCommissionIds.filter((id) => id !== c.id));
                                  }
                                }}
                                className="rounded-[2px] border-slate-300 text-[#0B3D32] focus:ring-0 cursor-pointer"
                              />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* Partner */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-bold text-xs text-[#24352F] dark:text-white">{c.partnerName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{c.partnerCode}</div>
                          </td>

                          {/* Booking & Guest */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            <div className="font-semibold text-xs text-[#24352F] dark:text-white">{c.guestName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{c.bookingCode}</div>
                          </td>

                          {/* Stay Dates */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-xs">
                            <div>{c.checkIn} to {c.checkOut}</div>
                            <div className="text-[10px] text-slate-500">{c.roomNights} Nights</div>
                          </td>

                          {/* Eligible Amount */}
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-xs border-r border-[#E5EEE9] dark:border-[#145447]">
                            {c.eligibleAmount.toLocaleString()}
                          </td>

                          {/* Rate */}
                          <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447] text-xs">
                            {c.commissionType === 'PERCENTAGE'
                              ? `${c.commissionRate}%`
                              : c.commissionType === 'FIXED_PER_BOOKING'
                              ? 'Flat / Res'
                              : 'Flat / Night'}
                          </td>

                          {/* Commission Amount */}
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {c.commissionAmount.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3.5 text-center border-r border-[#E5EEE9] dark:border-[#145447]">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-bold text-[10px]',
                                c.status === 'PAID'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : c.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                              )}
                            >
                              <span>{c.status}</span>
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3.5 text-right">
                            {c.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => handleApproveCommission(c.id)}
                                className="px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white hover:bg-[#093027] text-[11px] font-semibold cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                            ) : c.status === 'APPROVED' ? (
                              <span className="text-[11px] font-semibold text-emerald-600">Approved</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Paid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* DATATABLES PAGINATION FOOTER */}
            <div className="p-2.5 border-t border-[#DCE3DF] dark:border-[#145447] bg-[#F4F7F5] dark:bg-[#061B16] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64736C] dark:text-[#A4B8AE]">
              <div>
                Showing {filteredCommissions.length === 0 ? 0 : commissionStartIndex + 1} to{' '}
                {Math.min(commissionStartIndex + commissionPageSize, filteredCommissions.length)} of {filteredCommissions.length} entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCommissionCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCommissionCurrentPage === 1}
                  className="px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold shadow-2xs"
                >
                  Previous
                </button>

                {Array.from({ length: totalCommissionPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCommissionCurrentPage(num)}
                    className={cn(
                      'w-7 h-7 rounded-[3px] font-bold text-xs transition-all shadow-2xs cursor-pointer',
                      safeCommissionCurrentPage === num
                        ? 'bg-[#0B3D32] text-white dark:bg-emerald-700'
                        : 'border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCommissionCurrentPage((p) => Math.min(totalCommissionPages, p + 1))}
                  disabled={safeCommissionCurrentPage === totalCommissionPages}
                  className="px-2.5 py-1 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL 1: ADD / EDIT PARTNER MODAL
          ----------------------------------------------------------------------- */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#07241E] border border-slate-300 dark:border-[#145447] rounded-[4px] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {editingPartner ? `Edit Business Partner (${editingPartner.partnerCode})` : 'Register New Business Partner'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePartner} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Partner Type Selector (Tabs) */}
              {!editingPartner && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Partner Category *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerTypeForm('CORPORATE');
                        setFormData((prev) => ({
                          ...prev,
                          companyType: 'Private Limited',
                          commissionEnabled: false,
                        }));
                      }}
                      className={cn(
                        'p-2.5 rounded-[3px] border text-left transition-all cursor-pointer flex items-center gap-2',
                        partnerTypeForm === 'CORPORATE'
                          ? 'border-[#0B3D32] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#0B3D32] dark:text-emerald-400 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <div className="text-xs">Corporate / Company</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPartnerTypeForm('TRAVEL_AGENT');
                        setFormData((prev) => ({
                          ...prev,
                          commissionEnabled: true,
                          commissionType: 'PERCENTAGE',
                          commissionValue: 10,
                        }));
                      }}
                      className={cn(
                        'p-2.5 rounded-[3px] border text-left transition-all cursor-pointer flex items-center gap-2',
                        partnerTypeForm === 'TRAVEL_AGENT'
                          ? 'border-[#0B3D32] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#0B3D32] dark:text-emerald-400 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <Compass className="w-4 h-4 shrink-0" />
                      <div className="text-xs">Travel Agent</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPartnerTypeForm('INDIVIDUAL_REFERRAL');
                        setFormData((prev) => ({
                          ...prev,
                          referralType: 'TOURIST_GUIDE',
                          commissionEnabled: true,
                          commissionType: 'FIXED_PER_BOOKING',
                          commissionValue: 500,
                        }));
                      }}
                      className={cn(
                        'p-2.5 rounded-[3px] border text-left transition-all cursor-pointer flex items-center gap-2',
                        partnerTypeForm === 'INDIVIDUAL_REFERRAL'
                          ? 'border-[#0B3D32] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#0B3D32] dark:text-emerald-400 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <div className="text-xs">Individual Referral</div>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Basic Information */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
                  <span>1. Basic Profile</span>
                </div>

                {/* Row 1: Partner Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Partner Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CRP-101, AGT-05"
                      value={formData.partnerCode || ''}
                      onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                      className="w-full h-[28px] px-2.5 font-mono border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-bold text-[#0B3D32] dark:text-emerald-400 focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {partnerTypeForm === 'CORPORATE' ? 'Company Name *' : partnerTypeForm === 'TRAVEL_AGENT' ? 'Agency Name *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.partnerName || ''}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                {/* Row 2: Phone, Contact Person, Designation/Referral Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {partnerTypeForm === 'INDIVIDUAL_REFERRAL' ? 'Alternative Phone' : 'Contact Person'}
                    </label>
                    <input
                      type="text"
                      value={partnerTypeForm === 'INDIVIDUAL_REFERRAL' ? (formData.alternativePhone || '') : (formData.contactPerson || '')}
                      onChange={(e) =>
                        partnerTypeForm === 'INDIVIDUAL_REFERRAL'
                          ? setFormData({ ...formData, alternativePhone: e.target.value })
                          : setFormData({ ...formData, contactPerson: e.target.value })
                      }
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {partnerTypeForm === 'INDIVIDUAL_REFERRAL' ? 'Referral Category' : 'Designation'}
                    </label>
                    {partnerTypeForm === 'INDIVIDUAL_REFERRAL' ? (
                      <select
                        value={formData.referralType || 'TOURIST_GUIDE'}
                        onChange={(e) => setFormData({ ...formData, referralType: e.target.value as ReferralType })}
                        className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                      >
                        <option value="LOCAL_INDIVIDUAL">Local Individual</option>
                        <option value="TOURIST_GUIDE">Tourist Guide</option>
                        <option value="TAXI_DRIVER">Taxi Driver</option>
                        <option value="FREELANCE_AGENT">Freelance Agent</option>
                        <option value="OTHER">Other</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.designation || ''}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                      />
                    )}
                  </div>
                </div>

                {/* Row 3: Email, PAN/VAT, City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      PAN / VAT Number {partnerTypeForm !== 'INDIVIDUAL_REFERRAL' && '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.panVatNumber || ''}
                      onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>

                {/* Row 4: Full Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              {/* 2. Corporate Specific Billing & Credit Settings */}
              {partnerTypeForm === 'CORPORATE' && (() => {
                const isCreditChecked = formData.creditAllowed !== false;
                const arrangementVal = formData.defaultBillingArrangement || formData.defaultPaymentResponsibility || 'COMPANY_ACCOUNT';

                return (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Corporate Credit &amp; Commercial Terms
                    </div>

                    {/* Credit Facility Checkmark */}
                    <div className="p-2.5 rounded-[3px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isCreditChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData,
                              creditAllowed: checked,
                              defaultBillingArrangement: checked ? 'COMPANY_ACCOUNT' : 'GUEST_DIRECT',
                              defaultPaymentResponsibility: checked ? 'COMPANY_PAYS' : 'GUEST_PAYS',
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#0B3D32] focus:ring-[#0B3D32] accent-[#0B3D32]"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Allow Credit Facility (Pay to Company Credit Account)
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-6 leading-tight">
                        Simple rule: If they pay upon stay or checkout it is settled immediately. If unpaid, charges go to company credit account.
                      </p>
                    </div>

                    {/* Credit Settings (When Checked) */}
                    {isCreditChecked ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Default Billing Arrangement
                          </label>
                          <select
                            value={
                              arrangementVal === 'SPLIT' || arrangementVal === 'SPLIT_BILLING'
                                ? 'SPLIT_BILLING'
                                : 'COMPANY_ACCOUNT'
                            }
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setFormData({
                                ...formData,
                                defaultBillingArrangement: val,
                                defaultPaymentResponsibility: val,
                              });
                            }}
                            className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                          >
                            <option value="COMPANY_ACCOUNT">Company Account (All Charges)</option>
                            <option value="SPLIT_BILLING">Split Billing (Company Room, Guest Incidentals)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Credit Terms
                          </label>
                          <select
                            value={formData.paymentTerms || 'NET_30'}
                            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTerms })}
                            className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                          >
                            <option value="IMMEDIATE">Immediate (Upon Check-out)</option>
                            <option value="NET_7">7 Days Credit</option>
                            <option value="NET_15">15 Days Credit</option>
                            <option value="NET_30">30 Days Credit</option>
                            <option value="CUSTOM">Custom Days</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Credit Limit ({appCurrency}, Optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0 for unlimited"
                            value={formData.creditLimit ?? 0}
                            onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                            className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-500 italic">
                        No credit facility enabled &mdash; guests or company must pay directly upon stay or checkout.
                      </div>
                    )}

                    {/* Room Selection & Corporate Discount */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Corporate Discount (% Off Room Rate, Optional)
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 10 (Leave 0 for standard hotel room rates)"
                          value={formData.negotiatedDiscountPercent ?? 0}
                          onChange={(e) => setFormData({ ...formData, negotiatedDiscountPercent: Number(e.target.value) })}
                          className="w-full sm:w-48 h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                        />
                        <span className="text-[11px] text-slate-500 italic">
                          Guests can choose any room category; this discount applies to the selected room&apos;s rate.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Commission Settings (Travel Agents & Referrals) */}
              {partnerTypeForm !== 'CORPORATE' && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Commission &amp; Referral Payout Rules
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.commissionEnabled}
                        onChange={(e) => setFormData({ ...formData, commissionEnabled: e.target.checked })}
                        className="rounded-[2px] text-[#0B3D32] focus:ring-0"
                      />
                      <span>Enable Commission</span>
                    </label>
                  </div>

                  {formData.commissionEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Commission Structure
                        </label>
                        <select
                          value={formData.commissionType || 'PERCENTAGE'}
                          onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as CommissionType })}
                          className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED_PER_BOOKING">Fixed Amount Per Reservation (NPR)</option>
                          <option value="FIXED_PER_ROOM_NIGHT">Fixed Amount Per Room Night (NPR)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Commission Value {formData.commissionType === 'PERCENTAGE' ? '(%)' : '(NPR)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.commissionValue ?? 0}
                          onChange={(e) => setFormData({ ...formData, commissionValue: Number(e.target.value) })}
                          className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Release / Payout Rule
                        </label>
                        <select
                          value={formData.commissionPaymentRule || 'AFTER_CHECKOUT'}
                          onChange={(e) => setFormData({ ...formData, commissionPaymentRule: e.target.value as CommissionPaymentRule })}
                          className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                        >
                          <option value="AFTER_CHECKOUT">After Guest Checkout</option>
                          <option value="AFTER_FULL_PAYMENT">After Full Bill Settlement</option>
                          <option value="MANUAL_APPROVAL">Manual Management Approval</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status & Notes */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status || 'ACTIVE'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Internal Commercial Notes
                    </label>
                    <input
                      type="text"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  {editingPartner ? 'Save Changes' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL 2: 360 PARTNER PROFILE & CORPORATE ACCOUNT STATEMENT
          ----------------------------------------------------------------------- */}
      {profilePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#07241E] border border-slate-300 dark:border-[#145447] rounded-[4px] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[3px] bg-[#0B3D32] text-white dark:bg-emerald-600">
                  {profilePartner.partnerType === 'CORPORATE' ? <Building2 className="w-4 h-4" /> : profilePartner.partnerType === 'TRAVEL_AGENT' ? <Compass className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      {profilePartner.partnerName}
                    </h2>
                    <span className="font-mono text-xs font-bold text-[#0B3D32] dark:text-emerald-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-[2px] border border-slate-300 dark:border-slate-700">
                      {profilePartner.partnerCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {profilePartner.partnerType.replace('_', ' ')} • {profilePartner.city || 'Nepal'} • {profilePartner.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfilePartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Sub-Tabs */}
            <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setProfileTab('OVERVIEW')}
                className={cn(
                  'py-2.5 border-b-2 transition-all cursor-pointer',
                  profileTab === 'OVERVIEW'
                    ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-500 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Profile Overview
              </button>

              {profilePartner.partnerType === 'CORPORATE' && (
                <button
                  type="button"
                  onClick={() => setProfileTab('STATEMENT')}
                  className={cn(
                    'py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                    profileTab === 'STATEMENT'
                      ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-500 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Corporate Account Statement</span>
                </button>
              )}

              {profilePartner.commissionEnabled && (
                <button
                  type="button"
                  onClick={() => setProfileTab('COMMISSIONS')}
                  className={cn(
                    'py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                    profileTab === 'COMMISSIONS'
                      ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-500 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Commission Ledger</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setProfileTab('PAYMENTS')}
                className={cn(
                  'py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                  profileTab === 'PAYMENTS'
                    ? 'border-[#0B3D32] text-[#0B3D32] dark:border-emerald-500 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Payment History</span>
              </button>
            </div>

            {/* Profile Tab Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {profileTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  {/* Financial Status Quick Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Linked Bookings</div>
                      <div className="text-base font-bold font-mono mt-0.5 text-slate-800 dark:text-white">
                        {profilePartner.totalBookings}
                      </div>
                    </div>
                    {profilePartner.partnerType === 'CORPORATE' ? (
                      <>
                        <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Credit Limit</div>
                          <div className="text-base font-bold font-mono mt-0.5 text-slate-800 dark:text-white">
                            NPR {(profilePartner.creditLimit || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Payment Terms</div>
                          <div className="text-base font-bold mt-0.5 text-slate-800 dark:text-white">
                            {profilePartner.paymentTerms?.replace('NET_', '')} Days
                          </div>
                        </div>
                        <div className="p-3 rounded-[3px] bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                          <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold uppercase">Outstanding Receivable</div>
                          <div className="text-base font-bold font-mono mt-0.5 text-blue-800 dark:text-blue-200">
                            NPR {(profilePartner.corporateReceivableBalance || 0).toLocaleString()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Comm Earned</div>
                          <div className="text-base font-bold font-mono mt-0.5 text-slate-800 dark:text-white">
                            NPR {(profilePartner.totalCommissionEarned || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Comm Paid</div>
                          <div className="text-base font-bold font-mono mt-0.5 text-slate-800 dark:text-white">
                            NPR {(profilePartner.totalCommissionPaid || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-[3px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">Unsettled Payable</div>
                          <div className="text-base font-bold font-mono mt-0.5 text-amber-800 dark:text-amber-200">
                            NPR {(profilePartner.outstandingCommission || 0).toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Commercial & Contact Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-[3px] space-y-2">
                      <div className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                        Contact Information
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Contact Person:</span>
                        <span className="font-semibold">{profilePartner.contactPerson || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Designation:</span>
                        <span className="font-semibold">{profilePartner.designation || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Primary Phone:</span>
                        <span className="font-mono font-semibold">{profilePartner.phone}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Alternative Phone:</span>
                        <span className="font-mono">{profilePartner.alternativePhone || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-mono">{profilePartner.email || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Address:</span>
                        <span>{profilePartner.address || profilePartner.city || '—'}</span>
                      </div>
                    </div>

                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-[3px] space-y-2">
                      <div className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                        Commercial &amp; Legal Terms
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">PAN / VAT:</span>
                        <span className="font-mono font-bold">{profilePartner.panVatNumber || 'Not Registered'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Registration Number:</span>
                        <span className="font-mono">{profilePartner.registrationNumber || '—'}</span>
                      </div>
                      {profilePartner.partnerType === 'CORPORATE' ? (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Credit Facility:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {profilePartner.defaultPaymentResponsibility === 'GUEST_PAYS' || profilePartner.creditAllowed === false
                                ? 'No Credit (Direct Settlement)'
                                : `✓ Allowed (${profilePartner.paymentTerms?.replace('NET_', '') || '30'} Days Credit)`}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Corporate Discount:</span>
                            <span className="font-bold">
                              {profilePartner.negotiatedDiscountPercent
                                ? `${profilePartner.negotiatedDiscountPercent}% Off Any Room`
                                : 'Standard Room Rates'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Commission Rule:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {profilePartner.commissionEnabled
                                ? `${profilePartner.commissionType} (${profilePartner.commissionValue})`
                                : 'None'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Calculation Basis:</span>
                            <span>{profilePartner.commissionBasis?.replace('_', ' ')}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Internal Notes:</span>
                        <span className="italic text-slate-600 dark:text-slate-300">{profilePartner.notes || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Corporate Statement View */}
              {profileTab === 'STATEMENT' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-[3px] bg-slate-50 dark:bg-[#061B16] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Corporate Account Statement</div>
                      <div className="text-[11px] text-slate-500">
                        Tracks all charges billed directly to {profilePartner.partnerName} and payments received.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Current Balance Due</div>
                      <div className="text-base font-bold font-mono text-blue-700 dark:text-blue-400">
                        NPR {(profilePartner.corporateReceivableBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        <tr>
                          <th className="py-2 px-3">DATE</th>
                          <th className="py-2 px-3">INVOICE / RECEIPT #</th>
                          <th className="py-2 px-3">BOOKING REF / GUEST</th>
                          <th className="py-2 px-3">DESCRIPTION</th>
                          <th className="py-2 px-3 text-right">DEBIT (NPR)</th>
                          <th className="py-2 px-3 text-right">CREDIT (NPR)</th>
                          <th className="py-2 px-3 text-right">RUNNING BALANCE</th>
                          <th className="py-2 px-3 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {((corporateStatements[profilePartner.id] && corporateStatements[profilePartner.id].length > 0)
                          ? corporateStatements[profilePartner.id]
                          : (SEED_CORPORATE_STATEMENTS[profilePartner.id] || [])
                        ).map((stmt) => (
                          <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3 font-mono text-[11px]">{stmt.date}</td>
                            <td className="py-2 px-3 font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">{stmt.referenceNumber}</td>
                            <td className="py-2 px-3">
                              <div className="font-semibold">{stmt.guestName || '—'}</div>
                              <div className="font-mono text-[10px] text-slate-500">{stmt.reservationReference}</div>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              <div>{stmt.description}</div>
                              {stmt.actualPayerName && (
                                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium mt-0.5">
                                  Payer: <strong className="font-semibold">{stmt.actualPayerName}</strong> ({stmt.receivedFrom === 'GUEST_EMPLOYEE' ? 'Guest / Employee' : stmt.receivedFrom === 'COMPANY' ? 'Company Direct' : 'Other'}) &bull; Credited to Company Ledger
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">{stmt.debit > 0 ? stmt.debit.toLocaleString() : '—'}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">{stmt.credit > 0 ? stmt.credit.toLocaleString() : '—'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">NPR {stmt.runningBalance.toLocaleString()}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold",
                                stmt.paymentStatus === 'PAID' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              )}>
                                {stmt.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commission Ledger View */}
              {profileTab === 'COMMISSIONS' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Earned Commission Ledger for {profilePartner.partnerName}
                  </div>
                  <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        <tr>
                          <th className="py-2 px-3">BOOKING</th>
                          <th className="py-2 px-3">GUEST</th>
                          <th className="py-2 px-3">STAY DATES</th>
                          <th className="py-2 px-3 text-right">ELIGIBLE CHARGES</th>
                          <th className="py-2 px-3 text-right">COMMISSION</th>
                          <th className="py-2 px-3 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {commissions
                          .filter((c) => c.partnerId === profilePartner.id)
                          .map((c) => (
                            <tr key={c.id}>
                              <td className="py-2 px-3 font-mono font-bold">{c.bookingCode}</td>
                              <td className="py-2 px-3 font-semibold">{c.guestName}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{c.checkIn} to {c.checkOut} ({c.roomNights} N)</td>
                              <td className="py-2 px-3 text-right font-mono">NPR {c.eligibleAmount.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                NPR {c.commissionAmount.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-[2px] text-[10px] font-bold",
                                  c.status === 'PAID' ? "bg-slate-100 text-slate-700" : c.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                )}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History View */}
              {profileTab === 'PAYMENTS' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    {profilePartner.partnerType === 'CORPORATE'
                      ? `Corporate Payment Receipts & Collections for ${profilePartner.partnerName}`
                      : `Commission Payout Vouchers & Receipts for ${profilePartner.partnerName}`}
                  </div>
                  <div className="rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {profilePartner.partnerType === 'CORPORATE' ? (
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-3">DATE</th>
                            <th className="py-2 px-3">RECEIPT / REF #</th>
                            <th className="py-2 px-3">PAYER NAME</th>
                            <th className="py-2 px-3">PAYER TYPE</th>
                            <th className="py-2 px-3">RESPONSIBLE ACCOUNT</th>
                            <th className="py-2 px-3">METHOD</th>
                            <th className="py-2 px-3 text-right">AMOUNT (NPR)</th>
                            <th className="py-2 px-3">NOTES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {((corporateStatements[profilePartner.id] && corporateStatements[profilePartner.id].length > 0)
                            ? corporateStatements[profilePartner.id]
                            : (SEED_CORPORATE_STATEMENTS[profilePartner.id] || [])
                          )
                            .filter((s) => s.type === 'PAYMENT' || s.credit > 0)
                            .map((stmt) => (
                              <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-2 px-3 font-mono text-[11px]">{stmt.date}</td>
                                <td className="py-2 px-3 font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-400">
                                  {stmt.referenceNumber}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                                  {stmt.actualPayerName || stmt.guestName || profilePartner.partnerName}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    {stmt.receivedFrom === 'GUEST_EMPLOYEE'
                                      ? 'Guest / Employee'
                                      : stmt.receivedFrom === 'OTHER'
                                      ? 'Third Party'
                                      : 'Company Direct'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                  {profilePartner.partnerName} (Company A/R)
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                  {stmt.description.includes('via') ? stmt.description.split('via')[1]?.split('—')[0]?.trim() || 'Bank / Cash' : 'Direct Credit'}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  NPR {stmt.credit.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">
                                  {stmt.description}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#F4F7F5] dark:bg-[#061B16] border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-3">VOUCHER #</th>
                            <th className="py-2 px-3">DATE</th>
                            <th className="py-2 px-3">METHOD</th>
                            <th className="py-2 px-3">REFERENCE</th>
                            <th className="py-2 px-3 text-right">PAID AMOUNT</th>
                            <th className="py-2 px-3">PAID BY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {payments
                            .filter((p) => p.partnerId === profilePartner.id)
                            .map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400">{p.paymentNumber}</td>
                                <td className="py-2 px-3 font-mono text-[11px]">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                <td className="py-2 px-3 font-semibold">{p.paymentMethod.replace('_', ' ')}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{p.referenceNumber || '—'}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  NPR {p.amount.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-slate-600">{p.paidBy}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Footer */}
            <div className="px-5 py-3 bg-[#F4F7F5] dark:bg-[#061B16] border-t border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Partner registered on {new Date(profilePartner.createdAt).toLocaleDateString()}
              </div>
              <button
                type="button"
                onClick={() => setProfilePartner(null)}
                className="px-3 py-1.5 rounded-[3px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL 3: COMMISSION PAYOUT SETTLEMENT
          ----------------------------------------------------------------------- */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#07241E] border border-slate-300 dark:border-[#145447] rounded-[4px] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-4 py-3 bg-[#F4F7F5] dark:bg-[#061B16] border-b border-[#DCE3DF] dark:border-[#145447] flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
                <span>Record Commission Payout Voucher</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="p-4 space-y-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-[3px] flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Total Settlement Amount:
                </span>
                <span className="text-base font-black font-mono text-emerald-900 dark:text-emerald-100">
                  NPR{' '}
                  {commissions
                    .filter((c) => selectedCommissionIds.includes(c.id))
                    .reduce((sum, c) => sum + c.commissionAmount, 0)
                    .toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full h-[28px] px-2 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (Nabil, Global IME, etc.)</option>
                  <option value="CASH">Cash Voucher</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="WALLET">Digital Wallet (eSewa / Khalti)</option>
                  <option value="OTHER">Other Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Reference / Cheque No / Slip Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-982184 or Cheque #019284"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disbursement Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared for October arrivals"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full h-[28px] px-2.5 border border-slate-300 dark:border-slate-700 rounded-[3px] bg-white dark:bg-[#061B16] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold transition-colors shadow-2xs dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  Disburse &amp; Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

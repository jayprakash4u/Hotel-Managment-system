'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Award,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
  Building2,
  SlidersHorizontal,
  Coffee,
  Check,
  ArrowRight,
  Filter,
  DollarSign,
  PieChart,
  UserCheck,
  History,
  Tag,
  HelpCircle,
  Percent,
} from 'lucide-react';
import {
  Guest360ProfileRecord,
  GuestDocumentRecord,
  HotelVisitRecord,
  RestaurantHistoryOrder,
  PaymentInvoiceRecord,
  GuestNoteRecord,
  BusinessMode,
  getFrequentlyOrderedItems,
  saveGuest360Profiles,
  saveBusinessMode,
} from '@/lib/guest360Data';
import { MembershipTier, calculateTierProgress } from '@/lib/loyalty';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Guest360ProfileViewProps {
  guest: Guest360ProfileRecord;
  allGuests: Guest360ProfileRecord[];
  configuredTiers: MembershipTier[];
  businessMode: BusinessMode;
  onUpdateGuest: (updated: Guest360ProfileRecord) => void;
  onBusinessModeChange: (mode: BusinessMode) => void;
  onClose: () => void;
}

type TabKey = 'OVERVIEW' | 'VISIT_HISTORY' | 'RESTAURANT_HISTORY' | 'PAYMENTS_INVOICES' | 'MEMBERSHIP' | 'NOTES';

export function Guest360ProfileView({
  guest,
  allGuests,
  configuredTiers,
  businessMode,
  onUpdateGuest,
  onBusinessModeChange,
  onClose,
}: Guest360ProfileViewProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('VISIT_HISTORY');

  // Visit Details Inspection Modal state
  const [inspectedVisit, setInspectedVisit] = useState<HotelVisitRecord | null>(null);

  // Restaurant Order Inspection Modal state
  const [inspectedOrder, setInspectedOrder] = useState<RestaurantHistoryOrder | null>(null);

  // Link / Merge Guest Modal state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSearchTerm, setMergeSearchTerm] = useState('');
  const [selectedMergeCandidate, setSelectedMergeCandidate] = useState<Guest360ProfileRecord | null>(null);

  // Add Note Modal state
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<GuestNoteRecord['category']>('ROOM_PREFERENCE');

  // Visit History Filter & Pagination States
  const [visitSearchQuery, setVisitSearchQuery] = useState('');
  const [visitPaymentFilter, setVisitPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Frequently Ordered Items Calculation
  const topOrderedItems = useMemo(() => {
    return getFrequentlyOrderedItems(guest.restaurantOrders || []);
  }, [guest.restaurantOrders]);

  // Tier progression
  const tierProgress = useMemo(() => {
    return calculateTierProgress(guest.totalVisits || 0, configuredTiers);
  }, [guest.totalVisits, configuredTiers]);

  // Handle Note Submission
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: GuestNoteRecord = {
      id: `nt-${Date.now()}`,
      note: newNoteText.trim(),
      category: newNoteCategory,
      createdBy: 'Front Desk Staff',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = {
      ...guest,
      notes: [newNote, ...(guest.notes || [])],
    };

    onUpdateGuest(updated);
    setNewNoteText('');
    setShowAddNoteModal(false);
    toast.success('Note Added', 'Customer preference note saved to profile.');
  };

  // Document Viewing & Upload State
  const [viewingDoc, setViewingDoc] = useState<GuestDocumentRecord | null>(null);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocType, setUploadDocType] = useState<GuestDocumentRecord['docType']>('Citizenship');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  const handleDownloadDoc = (doc: GuestDocumentRecord) => {
    const textContent = `=====================================================
HOTEL GUEST IDENTITY & VERIFICATION ARCHIVE
=====================================================
Guest Name:       ${guest.fullName}
Guest ID:         ${guest.id}
Document Title:   ${doc.title}
Document Type:    ${doc.docType}
ID / Ref Number:  ${doc.docNumber || 'N/A'}
File Format:      ${doc.fileType.toUpperCase()} (${doc.fileSize})
Archived Date:    ${doc.uploadedAt}
Verified By:      ${doc.uploadedBy || 'Front Desk Operations'}
Status:           ${doc.status}
=====================================================
Certified authentic copy retained on guest master file.`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}_${guest.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document Downloaded', `Downloaded "${doc.title}".`);
  };

  const handleSaveUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      toast.error('Missing Title', 'Please enter a document title.');
      return;
    }

    const newDoc: GuestDocumentRecord = {
      id: `doc-${Date.now()}`,
      title: uploadTitle.trim(),
      docType: uploadDocType,
      docNumber: uploadDocNumber.trim() || undefined,
      fileType: uploadFileName.toLowerCase().endsWith('.png') ? 'png' : uploadFileName.toLowerCase().endsWith('.jpg') ? 'jpg' : 'pdf',
      fileSize: '1.2 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: 'Front Desk Reception',
      status: 'VERIFIED',
    };

    const existingDocs = guest.documents || [];
    const updated = {
      ...guest,
      documents: [newDoc, ...existingDocs],
    };

    onUpdateGuest(updated);
    setShowUploadDocModal(false);
    setUploadTitle('');
    setUploadDocNumber('');
    setUploadFileName('');
    toast.success('Document Attached', `Attached "${newDoc.title}" to guest profile.`);
  };

  // Handle Merging Two Customers
  const handleConfirmMerge = () => {
    if (!selectedMergeCandidate) return;

    const mergedVisits = [...(guest.visits || []), ...(selectedMergeCandidate.visits || [])];
    const mergedOrders = [...(guest.restaurantOrders || []), ...(selectedMergeCandidate.restaurantOrders || [])];
    const mergedPayments = [...(guest.paymentsAndInvoices || []), ...(selectedMergeCandidate.paymentsAndInvoices || [])];
    const mergedNotes = [...(guest.notes || []), ...(selectedMergeCandidate.notes || [])];

    // Deduplicate visits by reservationNumber
    const uniqueVisitsMap = new Map<string, HotelVisitRecord>();
    mergedVisits.forEach((v) => uniqueVisitsMap.set(v.reservationNumber, v));
    const finalVisits = Array.from(uniqueVisitsMap.values()).sort((a, b) => b.visitNumber - a.visitNumber);

    // Deduplicate restaurant orders
    const uniqueOrdersMap = new Map<string, RestaurantHistoryOrder>();
    mergedOrders.forEach((o) => uniqueOrdersMap.set(o.orderNumber, o));
    const finalOrders = Array.from(uniqueOrdersMap.values());

    const combinedSpending = (guest.totalSpending || 0) + (selectedMergeCandidate.totalSpending || 0);
    const combinedRoomSpending = (guest.roomSpending || 0) + (selectedMergeCandidate.roomSpending || 0);
    const combinedRestSpending = (guest.restaurantSpending || 0) + (selectedMergeCandidate.restaurantSpending || 0);
    const combinedOtherSpending = (guest.otherServicesSpending || 0) + (selectedMergeCandidate.otherServicesSpending || 0);

    const updated: Guest360ProfileRecord = {
      ...guest,
      totalVisits: finalVisits.length,
      totalNights: (guest.totalNights || 0) + (selectedMergeCandidate.totalNights || 0),
      totalSpending: combinedSpending,
      roomSpending: combinedRoomSpending,
      restaurantSpending: combinedRestSpending,
      otherServicesSpending: combinedOtherSpending,
      totalPaid: (guest.totalPaid || 0) + (selectedMergeCandidate.totalPaid || 0),
      outstandingBalance: (guest.outstandingBalance || 0) + (selectedMergeCandidate.outstandingBalance || 0),
      visits: finalVisits,
      restaurantOrders: finalOrders,
      paymentsAndInvoices: mergedPayments,
      notes: mergedNotes,
    };

    onUpdateGuest(updated);
    setShowMergeModal(false);
    setSelectedMergeCandidate(null);
    toast.success('Records Linked', `Successfully unified records with ${selectedMergeCandidate.fullName} (${selectedMergeCandidate.id}).`);
  };

  // Filtered visits list
  const filteredVisits = useMemo(() => {
    return (guest.visits || []).filter((v) => {
      if (visitPaymentFilter === 'PAID' && v.paymentStatus !== 'PAID') return false;
      if (visitPaymentFilter === 'UNPAID' && v.paymentStatus === 'PAID') return false;

      if (visitSearchQuery.trim()) {
        const q = visitSearchQuery.toLowerCase().trim();
        const matchRes = v.reservationNumber.toLowerCase().includes(q);
        const matchRoom = v.roomNumber.toLowerCase().includes(q);
        const matchType = v.roomType.toLowerCase().includes(q);
        return matchRes || matchRoom || matchType;
      }
      return true;
    });
  }, [guest.visits, visitPaymentFilter, visitSearchQuery]);

  // DataTable pagination calculations for visits
  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4 w-full min-w-0 select-none animate-in fade-in duration-150">
      {/* -----------------------------------------------------------------------
          TOP HEADER: Guest Identity, Contact, Status, Business Mode & Actions
          ----------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-surface-card p-4 rounded-[4px] border border-slate-300 dark:border-border-default shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity & Contact */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-[3px] bg-[#0B3D32] text-white flex items-center justify-center font-black text-lg shadow-2xs shrink-0 font-heading">
              {guest.firstName ? guest.firstName[0] : 'G'}
              {guest.lastName ? guest.lastName[0] : ''}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  {guest.fullName}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {guest.id}
                </span>

                {/* Membership Badge */}
                <span
                  className={cn(
                    'font-mono text-xs font-bold px-2.5 py-0.5 rounded-[2px] border uppercase tracking-wider',
                    guest.vipTier === 'PLATINUM'
                      ? 'bg-slate-900 text-indigo-300 border-indigo-700'
                      : guest.vipTier === 'GOLD'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  )}
                >
                  ★ {guest.vipTier} MEMBER
                </span>

                {/* Current Presence Status */}
                {guest.currentStatus === 'IN_HOUSE' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In-House (Room {guest.currentRoom || 'Assigned'})
                  </span>
                ) : guest.currentStatus === 'RESERVED' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-blue-50 text-blue-700 border border-blue-300 uppercase">
                    Upcoming Reservation
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    Checked Out
                  </span>
                )}
              </div>

              {/* Subtitle Contact Row */}
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono font-medium">{guest.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guest.email || '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guest.address || 'Kathmandu, Nepal'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Close / Return Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start lg:self-center shrink-0"
            title="Close 360° Profile"
            aria-label="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          EXECUTIVE SUMMARY: 8 METRICS KPI CARDS
          ----------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. Total Hotel Visits */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Visits</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {guest.totalVisits || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Completed Stays</span>
        </div>

        {/* 2. Total Nights Stayed */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Nights</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {guest.totalNights || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Nights Occupied</span>
        </div>

        {/* 3. Room Spend */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Room Spend</span>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
            Rs. {(guest.roomSpending || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Room Tariff</span>
        </div>

        {/* 4. Dining Spend */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Dining Spend</span>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
            Rs. {(guest.restaurantSpending || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Food &amp; Beverage</span>
        </div>

        {/* 5. Other Services */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Other Services</span>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
            Rs. {(guest.otherServicesSpending || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Laundry, Transport</span>
        </div>

        {/* 6. Total Spending */}
        <div className="p-3 rounded-[3px] border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block tracking-wider">
            Total Spent
          </span>
          <div className="text-base font-black text-[#0B3D32] dark:text-emerald-400 font-mono mt-0.5">
            Rs. {(guest.totalSpending || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Lifetime Spent</span>
        </div>

        {/* 7. Last Visit */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Last Visit</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 truncate">
            {guest.lastVisitDate || 'Recent'}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Latest Activity</span>
        </div>

        {/* 8. Outstanding Balance */}
        <div className="p-3 rounded-[3px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Due Balance</span>
          <div
            className={cn(
              'text-base font-black font-mono mt-0.5',
              (guest.outstandingBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
            )}
          >
            Rs. {(guest.outstandingBalance || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {(guest.outstandingBalance || 0) > 0 ? 'Payment Due' : 'All Settled'}
          </span>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          GUEST IDENTIFICATION & DOCUMENTS (Clean Human-Crafted Area)
          ----------------------------------------------------------------------- */}
      <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 bg-[#FAFBFB] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Guest Identification &amp; Documents
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadDocModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>

        {(!guest.documents || guest.documents.length === 0) ? (
          <div className="py-6 text-center text-slate-400 text-xs italic">
            No identity documents or registration forms attached yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {guest.documents.map((doc) => (
              <div
                key={doc.id}
                className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-slate-900 dark:text-white font-semibold">{doc.title}</strong>
                      {doc.docNumber && (
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                          {doc.docNumber}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {doc.docType} · {doc.fileType.toUpperCase()} ({doc.fileSize}) · Uploaded on {doc.uploadedAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium cursor-pointer shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium cursor-pointer shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------------
          COMPLETE HOTEL STAY & VISIT HISTORY (10-Row Table)
          ----------------------------------------------------------------------- */}
      {(!guest.visits || guest.visits.length === 0) && (guest.restaurantOrders && guest.restaurantOrders.length > 0) ? null : (
        <div className="space-y-3">
          {/* Filter Bar & Page Size */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 font-semibold text-xs">Filter:</span>
                <button
                  type="button"
                  onClick={() => {
                    setVisitPaymentFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer text-xs',
                    visitPaymentFilter === 'ALL'
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] font-bold'
                      : 'bg-white dark:bg-surface-card border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  All Visits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisitPaymentFilter('PAID');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer text-xs',
                    visitPaymentFilter === 'PAID'
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] font-bold'
                      : 'bg-white dark:bg-surface-card border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  Paid Visits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisitPaymentFilter('UNPAID');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer text-xs',
                    visitPaymentFilter === 'UNPAID'
                      ? 'bg-[#0B3D32] text-white border-[#0B3D32] font-bold'
                      : 'bg-white dark:bg-surface-card border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  Pending Balance
                </button>
              </div>

              {/* Entries per page */}
              <div className="flex items-center gap-1 text-slate-500 text-xs pl-2 border-l border-slate-200 dark:border-slate-700">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-[25px] px-1.5 rounded-[2px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-card text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={visitSearchQuery}
                onChange={(e) => {
                  setVisitSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[29px] rounded-[3px] border border-slate-300 dark:border-border-default pl-8 pr-2.5 text-xs font-medium text-slate-800 dark:text-white bg-white dark:bg-surface-card"
              />
            </div>
          </div>

          {/* Visits Clean Table View */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="px-3.5 py-2.5 bg-[#FAFBFB] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hotel Stays &amp; Visit History
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Reservation #</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Room Number</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Stay Duration &amp; Dates</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Room Spend</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Dining Spend</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Other Services</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-bold">Total Spent</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Payment Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedVisits.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No hotel stay visits found for this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedVisits.map((v) => {
                      return (
                        <tr
                          key={v.reservationNumber}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-center border-r border-slate-200 dark:border-slate-700/60 text-slate-500">
                            #{v.visitNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/60">
                            {v.reservationNumber}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60">
                            <span className="font-bold text-slate-900 dark:text-white">Room {v.roomNumber}</span>
                            <span className="text-slate-400 text-[11px] block">{v.roomType}</span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700/60 font-mono">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {v.durationNights} {v.durationNights === 1 ? 'Night' : 'Nights'}
                            </div>
                            <div className="text-[11px] text-slate-400">{v.checkIn} → {v.checkOut}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 text-right border-r border-slate-200 dark:border-slate-700/60">
                            Rs. {v.roomCharges.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 text-right border-r border-slate-200 dark:border-slate-700/60">
                            Rs. {v.restaurantSpending.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 text-right border-r border-slate-200 dark:border-slate-700/60">
                            Rs. {v.otherServices.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B3D32] dark:text-emerald-400 text-right border-r border-slate-200 dark:border-slate-700/60">
                            Rs. {v.totalVisitAmount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-[2px] font-bold text-[10px] uppercase tracking-wider',
                                v.paymentStatus === 'PAID'
                                   ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                   : 'bg-rose-100 text-rose-800'
                              )}
                            >
                              {v.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectedVisit(v)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer: Left: Showing X to Y of Z entries | Right: Prev / Next */}
            <div className="px-3.5 py-2.5 bg-[#FAFBFB] dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
              <div>
                Showing{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {filteredVisits.length === 0 ? 0 : startIndex + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.min(startIndex + pageSize, filteredVisits.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-800 dark:text-slate-200">{filteredVisits.length}</strong>{' '}
                entries
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 font-medium">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                    ) {
                      const isCurrent = pageNum === safeCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            'min-w-[26px] h-[26px] px-1.5 font-mono text-xs font-bold rounded-[3px] transition-colors cursor-pointer flex items-center justify-center shadow-2xs',
                            isCurrent
                              ? 'bg-[#0B3D32] text-white border border-[#0B3D32] dark:bg-emerald-700'
                              : 'bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === safeCurrentPage - 2 || pageNum === safeCurrentPage + 2) {
                      return (
                        <span key={pageNum} className="px-1 text-slate-400 select-none font-bold">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          RESTAURANT ORDERS (For customers with only dining history)
          ----------------------------------------------------------------------- */}
      {(!guest.visits || guest.visits.length === 0) && (guest.restaurantOrders && guest.restaurantOrders.length > 0) && (
        <div className="space-y-3.5">
          {/* Restaurant Orders Table */}
          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="px-3.5 py-2.5 bg-[#FAFBFB] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                All Dining &amp; Room Service Orders
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Order Number</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Order Date &amp; Time</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Order Type</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Table / Source</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Items</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Payment Method</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-200">
                  {(!guest.restaurantOrders || guest.restaurantOrders.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No restaurant orders found for this guest.
                      </td>
                    </tr>
                  ) : (
                    guest.restaurantOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/60">
                          {ord.orderNumber}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                          {ord.orderDate} {ord.orderTime}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700/60">
                          <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                            {ord.orderType}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700/60 font-semibold text-slate-800 dark:text-slate-200">
                          {ord.tableOrSource}
                        </td>
                        <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700/60 max-w-[240px] truncate" title={ord.itemsSummary}>
                          {ord.itemsSummary}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white text-right border-r border-slate-200 dark:border-slate-700/60">
                          Rs. {ord.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                          <span className="px-2 py-0.5 rounded-[2px] border border-slate-200 text-[11px] font-medium">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                          <span className={cn(
                            'px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase',
                            ord.isRoomCharged ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          )}>
                            {ord.isRoomCharged ? 'Room Charge' : 'Direct Paid'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectedOrder(ord)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Items</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB CONTENT 4: PAYMENTS & INVOICES LEDGER
          ----------------------------------------------------------------------- */}
      {activeTab === 'PAYMENTS_INVOICES' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-[3px] text-xs text-amber-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Accounting Rule:</strong> Room-charged restaurant orders are reflected as linked hotel folios to prevent duplicate revenue recognition. Direct restaurant payments, room tariff settlements, and deposits are tracked with zero overlap.
            </p>
          </div>

          <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Reference No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Transaction Type</th>
                    <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 min-w-[220px]">Description</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">Amount</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Payment Method</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-200">
                  {(!guest.paymentsAndInvoices || guest.paymentsAndInvoices.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No financial records found.
                      </td>
                    </tr>
                  ) : (
                    guest.paymentsAndInvoices.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60">
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700/60">
                          {tx.date}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/60">
                          {tx.referenceNo}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700/60">
                          <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                          {tx.description}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white text-right border-r border-slate-200 dark:border-slate-700/60">
                          Rs. {tx.amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                          {tx.paymentMethod}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-[2px] bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB CONTENT 5: MEMBERSHIP & LOYALTY SECTION
          ----------------------------------------------------------------------- */}
      {activeTab === 'MEMBERSHIP' && businessMode !== 'RESTAURANT_ONLY' && (
        <div className="space-y-4">
          <div className="rounded-[4px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-amber-700 block tracking-wider">Current Membership</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase font-heading mt-0.5">
                  ★ {tierProgress.currentTier.name} Member
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enrolled since <strong className="text-slate-800 dark:text-slate-200">{guest.memberSince || '2024'}</strong> · Stays counted: <span className="font-mono font-bold">{guest.totalVisits || 0}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Privilege Discount</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {tierProgress.currentTier.discountPercent}% OFF
                </span>
              </div>
            </div>

            {/* Progress Bar towards Next Tier */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  Next Tier: {tierProgress.nextTier ? tierProgress.nextTier.name : 'Highest VIP Level Reached'}
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  Progress: {guest.totalVisits || 0} / {tierProgress.nextTier ? tierProgress.nextTier.minStays : guest.totalVisits} Stays
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 shadow-xs bg-amber-500"
                  style={{ width: `${tierProgress.progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {tierProgress.progressSummaryText}
              </p>
            </div>

            {/* Configured Benefits */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Eligible Benefits &amp; Privileges
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {tierProgress.currentTier.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-[2px] bg-slate-50 border border-slate-100 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB CONTENT 6: SERVICE NOTES & PREFERENCES
          ----------------------------------------------------------------------- */}
      {activeTab === 'NOTES' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Customer Service Preferences &amp; Private Staff Notes
            </h3>
            <button
              type="button"
              onClick={() => setShowAddNoteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Preference Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(!guest.notes || guest.notes.length === 0) ? (
              <div className="col-span-2 p-8 text-center text-slate-400 text-xs bg-white rounded-[3px] border border-slate-200">
                No preferences recorded yet. Click &quot;Add Preference Note&quot; to record room or food preferences.
              </div>
            ) : (
              guest.notes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-[3px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-card shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-300">
                      {n.category.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-mono">{n.createdAt}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    &quot;{n.note}&quot;
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Recorded by: <strong>{n.createdBy}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: VISIT DETAILS QUICK BILLING BREAKDOWN
          ----------------------------------------------------------------------- */}
      {inspectedVisit && (() => {
        const diningItems = (inspectedVisit.restaurantOrders || []).flatMap((ro) => {
          const items = (ro.items && ro.items.length > 0)
            ? ro.items
            : (ro.itemsSummary || '').split(',').map((p, idx) => {
                const match = p.trim().match(/^(.+?)\s*\(([0-9]+)\)$/);
                if (match) {
                  const qty = parseInt(match[2], 10) || 1;
                  const unit = Math.round(ro.amount / (qty || 1));
                  return { id: `gen-${idx}`, name: match[1].trim(), quantity: qty, price: unit, total: qty * unit };
                }
                return { id: `gen-${idx}`, name: p.trim(), quantity: 1, price: ro.amount, total: ro.amount };
              });
          return items.map((it) => ({
            ...it,
            orderRef: ro.orderNumber,
          }));
        });

        const services = inspectedVisit.otherServicesList || [];
        const totalItemsCount = 1 + diningItems.length + services.length;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
            onClick={() => setInspectedVisit(null)}
          >
            <div
              className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#FAFBFB] dark:bg-slate-900/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      Stay Bill · {inspectedVisit.reservationNumber}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {inspectedVisit.paymentStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Room {inspectedVisit.roomNumber} ({inspectedVisit.roomType}) · {inspectedVisit.checkIn} to {inspectedVisit.checkOut} ({inspectedVisit.durationNights} {inspectedVisit.durationNights === 1 ? 'Night' : 'Nights'})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedVisit(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Single Quick Bill Table */}
              <div className="p-4 overflow-y-auto max-h-[72vh]">
                <div className="rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold select-none">
                      <tr>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-10">#</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Particulars / Description</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Category</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-center">Qty</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right font-mono">Rate (Rs.)</th>
                        <th className="py-2 px-3 text-right font-mono font-bold">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {/* 1. Room Tariff */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700">1</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                          Room Tariff ({inspectedVisit.roomType} · Room {inspectedVisit.roomNumber})
                        </td>
                        <td className="py-2 px-3 text-slate-500 border-r border-slate-200 dark:border-slate-700">Room Stay</td>
                        <td className="py-2 px-3 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                          {inspectedVisit.durationNights} {inspectedVisit.durationNights === 1 ? 'Night' : 'Nights'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">
                          {inspectedVisit.roomRatePerNight.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {inspectedVisit.roomCharges.toLocaleString()}
                        </td>
                      </tr>

                      {/* 2. Dining Items */}
                      {diningItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700">
                            {idx + 2}
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                            {item.name} <span className="text-slate-400 font-mono text-[11px]">({item.orderRef})</span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 border-r border-slate-200 dark:border-slate-700">Dining Order</td>
                          <td className="py-2 px-3 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                            {item.quantity} {item.quantity === 1 ? 'Plate' : 'Plates'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">
                            {item.price.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}

                      {/* 3. Additional Services */}
                      {services.map((srv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700">
                            {diningItems.length + idx + 2}
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                            {srv.serviceName}
                          </td>
                          <td className="py-2 px-3 text-slate-500 border-r border-slate-200 dark:border-slate-700">Service Charge</td>
                          <td className="py-2 px-3 text-center font-mono border-r border-slate-200 dark:border-slate-700">1</td>
                          <td className="py-2 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">
                            {srv.amount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {srv.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Quick Bill Totals Footer */}
                    <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 bg-[#FAFBFB] dark:bg-slate-900/60 font-semibold text-xs">
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          Total Bill:
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {inspectedVisit.totalVisitAmount.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          Amount Paid:
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          Rs. {inspectedVisit.amountPaid.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200 dark:border-slate-700">
                        <td colSpan={5} className="py-2 px-3 text-right text-slate-900 dark:text-white font-bold border-r border-slate-200 dark:border-slate-700">
                          Balance Due:
                        </td>
                        <td className={cn(
                          'py-2 px-3 text-right font-mono font-black',
                          inspectedVisit.balanceDue > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                        )}>
                          Rs. {inspectedVisit.balanceDue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 border-t border-slate-200 dark:border-border-default bg-[#FAFBFB] dark:bg-slate-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Total Items: {totalItemsCount} · Billed under {inspectedVisit.reservationNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedVisit(null)}
                  className="px-3.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* -----------------------------------------------------------------------
          MODAL: RESTAURANT ORDER ITEMS BREAKDOWN
          ----------------------------------------------------------------------- */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 rounded-[3px] shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Order: {inspectedOrder.orderNumber}</h3>
                <div className="text-[11px] text-slate-500 font-mono">{inspectedOrder.orderDate} {inspectedOrder.orderTime} · {inspectedOrder.tableOrSource}</div>
              </div>
              <button type="button" onClick={() => setInspectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                {inspectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{it.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Qty: {it.quantity} × Rs. {it.price}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">Rs. {it.total.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
                <span>Total Bill:</span>
                <span className="font-mono text-[#0B3D32]">Rs. {inspectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectedOrder(null)}
                className="px-3 py-1 rounded-[2px] bg-slate-200 hover:bg-slate-300 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: LINK / MERGE CUSTOMER RECORDS (Section 2)
          ----------------------------------------------------------------------- */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 rounded-[3px] shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Link / Merge Customer Identity</h3>
              <button type="button" onClick={() => setShowMergeModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-slate-600">
                Unify restaurant-only orders or duplicate guest profiles under primary ID <strong>{guest.id} ({guest.fullName})</strong> without losing transaction history.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Search Customer by Name or Phone:</label>
                <input
                  type="text"
                  value={mergeSearchTerm}
                  onChange={(e) => setMergeSearchTerm(e.target.value)}
                  placeholder="e.g. 9841234567 or Sunita Thapa..."
                  className="w-full h-8 px-2.5 rounded-[2px] border border-slate-300 text-xs text-slate-800"
                />
              </div>

              {/* Candidate Matches */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {allGuests
                  .filter((g) => g.id !== guest.id && (g.fullName.toLowerCase().includes(mergeSearchTerm.toLowerCase()) || g.phone.includes(mergeSearchTerm)))
                  .slice(0, 4)
                  .map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedMergeCandidate(candidate)}
                      className={cn(
                        'p-2.5 rounded border flex items-center justify-between cursor-pointer transition-colors',
                        selectedMergeCandidate?.id === candidate.id ? 'border-[#0B3D32] bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{candidate.fullName} ({candidate.id})</div>
                        <div className="text-[11px] text-slate-500 font-mono">Phone: {candidate.phone} · Visits: {candidate.totalVisits}</div>
                      </div>
                      <span className="font-mono font-bold text-xs">Rs. {candidate.totalSpending.toLocaleString()}</span>
                    </div>
                  ))}
              </div>

              {selectedMergeCandidate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                  <strong>Confirm Action:</strong> All {selectedMergeCandidate.visits?.length || 0} hotel visits and {selectedMergeCandidate.restaurantOrders?.length || 0} restaurant orders from <strong>{selectedMergeCandidate.fullName}</strong> will be merged into <strong>{guest.fullName}</strong>.
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-3 py-1.5 rounded-[2px] border border-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedMergeCandidate}
                onClick={handleConfirmMerge}
                className="px-4 py-1.5 rounded-[2px] bg-[#0B3D32] hover:bg-[#093027] disabled:opacity-40 text-white font-bold cursor-pointer"
              >
                Merge &amp; Link Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: ADD PREFERENCE NOTE (Section 12)
          ----------------------------------------------------------------------- */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-card border border-slate-300 rounded-[3px] shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <form onSubmit={handleAddNote}>
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900">Record Guest Preference / Note</h3>
                <button type="button" onClick={() => setShowAddNoteModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-[2px] border border-slate-300 text-xs font-semibold"
                  >
                    <option value="ROOM_PREFERENCE">Room Preference (e.g. Upper floor, quiet)</option>
                    <option value="FOOD_PREFERENCE">Dining &amp; Food Preference (e.g. Extra spicy)</option>
                    <option value="SPECIAL_REQUEST">Special Request (e.g. Early check-in)</option>
                    <option value="GENERAL">General Operational Note</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Service Note:</label>
                  <textarea
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="e.g. Prefers Room 203 when available. Requests extra towels and quiet corner."
                    className="w-full p-2.5 rounded-[2px] border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3 py-1 rounded-[2px] border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-[2px] bg-[#0B3D32] hover:bg-[#093027] text-white font-bold cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: DOCUMENT PREVIEW (Clean Human-Style Document Viewer)
          ----------------------------------------------------------------------- */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#FAFBFB] dark:bg-slate-900/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  {viewingDoc.title}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {viewingDoc.docType} · {viewingDoc.docNumber || guest.id} · {viewingDoc.fileType.toUpperCase()} ({viewingDoc.fileSize})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Paper Canvas Preview */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-900/30 overflow-y-auto max-h-[60vh]">
              <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-6 shadow-sm space-y-4">
                {/* Official Stamp Ribbon */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Official Hotel Record</span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{viewingDoc.title}</strong>
                  </div>
                  <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Verified
                  </span>
                </div>

                {/* Structured Metadata Fields */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Holder</span>
                    <span className="font-bold text-slate-900 dark:text-white">{guest.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Document ID Number</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingDoc.docNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Classification</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{viewingDoc.docType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nationality / Country</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{guest.country || 'Nepal'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Archived Date</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{viewingDoc.uploadedAt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified By</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{viewingDoc.uploadedBy || 'Front Desk Operations'}</span>
                  </div>
                </div>

                {/* Document Scan Body Mockup */}
                <div className="p-6 rounded border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-center space-y-1.5">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    Digital Scan Retained on Secure Hotel File
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Authentic scan copy verified for guest identity compliance and local regulatory registration requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-border-default bg-[#FAFBFB] dark:bg-slate-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {viewingDoc.fileType.toUpperCase()} File · {viewingDoc.fileSize}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-semibold cursor-pointer text-xs transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          MODAL: ATTACH / UPLOAD NEW GUEST DOCUMENT
          ----------------------------------------------------------------------- */}
      {showUploadDocModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setShowUploadDocModal(false)}
        >
          <div
            className="bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default rounded-[4px] shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#FAFBFB] dark:bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Attach Guest Document / Scan
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUploadDoc} className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Classification:
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs font-semibold text-slate-800 dark:text-white"
                >
                  <option value="Citizenship">Citizenship Certificate</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="National ID">National ID Card</option>
                  <option value="Registration Form (GRC)">Guest Registration Card (GRC)</option>
                  <option value="Visa / Entry Stamp">Visa / Entry Stamp</option>
                  <option value="Other">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title / Description:
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Citizenship Card (Front & Back) or Signed GRC"
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ID Number / Reference (Optional):
                </label>
                <input
                  type="text"
                  value={uploadDocNumber}
                  onChange={(e) => setUploadDocNumber(e.target.value)}
                  placeholder="e.g. 27-01-72-0451 or RES-010"
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Document File (PDF, JPG, PNG):
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFileName(f.name);
                      if (!uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-[3px] file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-50 hover:file:bg-slate-100 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-border-default flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-semibold cursor-pointer text-xs transition-colors shadow-2xs"
                >
                  Save &amp; Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

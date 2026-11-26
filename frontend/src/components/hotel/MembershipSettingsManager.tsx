'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Percent,
  BedDouble,
  RotateCcw,
  Search,
  X,
  Check,
} from 'lucide-react';
import {
  MembershipTier,
  MembershipTierIcon,
  DEFAULT_MEMBERSHIP_TIERS,
  getMembershipTiers,
  saveMembershipTiers,
  validateMembershipTiers,
} from '@/lib/loyalty';
import { MembershipTierBadge, AVAILABLE_TIER_ICONS } from '@/components/membership/MembershipTierBadge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  { name: 'Slate / Regular', color: '#64748B', textColor: 'text-slate-800 dark:text-slate-200', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-300 dark:border-slate-700', style: 'silver' as const },
  { name: 'Silver / Grey', color: '#475569', textColor: 'text-slate-800 dark:text-slate-200', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-300 dark:border-slate-700', style: 'silver' as const },
  { name: 'Gold / Amber', color: '#D97706', textColor: 'text-amber-800 dark:text-amber-300', bgColor: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-300 dark:border-amber-800', style: 'gold' as const },
  { name: 'Platinum / Indigo', color: '#4F46E5', textColor: 'text-indigo-800 dark:text-indigo-300', bgColor: 'bg-indigo-50 dark:bg-indigo-950/50', borderColor: 'border-indigo-300 dark:border-indigo-800', style: 'platinum' as const },
  { name: 'Diamond / Cyan', color: '#0284C7', textColor: 'text-sky-800 dark:text-sky-300', bgColor: 'bg-sky-50 dark:bg-sky-950/50', borderColor: 'border-sky-300 dark:border-sky-800', style: 'custom' as const },
  { name: 'Emerald / Green', color: '#059669', textColor: 'text-emerald-800 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', borderColor: 'border-emerald-300 dark:border-emerald-800', style: 'custom' as const },
];

export const MembershipSettingsManager: React.FC = () => {
  const toast = useToast();
  const [tiers, setTiers] = useState<MembershipTier[]>(() => getMembershipTiers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [minNights, setMinNights] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedColorPreset, setSelectedColorPreset] = useState(COLOR_PRESETS[0]);
  const [selectedIcon, setSelectedIcon] = useState<MembershipTierIcon>('shield');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Sync state on external update
  useEffect(() => {
    const handleUpdated = () => setTiers(getMembershipTiers());
    window.addEventListener('hotel_membership_tiers_updated', handleUpdated);
    return () => window.removeEventListener('hotel_membership_tiers_updated', handleUpdated);
  }, []);

  // Filtered tiers based on search query
  const filteredTiers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tiers;
    return tiers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tiers, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredTiers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTiers = useMemo(() => {
    return filteredTiers.slice(startIndex, startIndex + pageSize);
  }, [filteredTiers, startIndex, pageSize]);

  const openCreateModal = () => {
    setEditingTier(null);
    setName('');
    setCode('');
    const maxNights = tiers.reduce((max, t) => Math.max(max, t.minNights || 0), 0);
    setMinNights(maxNights + 5);
    setDiscountPercent(15);
    setSelectedColorPreset(COLOR_PRESETS[3]);
    setSelectedIcon('crown');
    setBenefits(['Room Fare Discount', 'Priority Check-In']);
    setBenefitInput('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (tier: MembershipTier) => {
    setEditingTier(tier);
    setName(tier.name);
    setCode(tier.code);
    setMinNights(tier.minNights || tier.minStays || 0);
    setDiscountPercent(tier.hotelDiscountValue ?? tier.discountPercent ?? 0);
    const matchedPreset =
      COLOR_PRESETS.find((p) => p.color.toLowerCase() === tier.color.toLowerCase()) || COLOR_PRESETS[0];
    setSelectedColorPreset(matchedPreset);
    setSelectedIcon(tier.icon || (tier.code === 'PLATINUM' ? 'gem' : tier.code === 'GOLD' ? 'crown' : tier.code === 'SILVER' ? 'star' : 'shield'));
    setBenefits(tier.benefits || []);
    setBenefitInput('');
    setIsActive(tier.isActive);
    setIsModalOpen(true);
  };

  const handleAddBenefit = () => {
    const trimmed = benefitInput.trim();
    if (!trimmed) return;
    if (benefits.includes(trimmed)) {
      toast.warning('Already added', 'This benefit is already listed.');
      return;
    }
    setBenefits([...benefits, trimmed]);
    setBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Validation Error', 'Tier Name is required.');
      return;
    }
    if (!code.trim()) {
      toast.error('Validation Error', 'Tier Code is required.');
      return;
    }

    const updatedTierData: MembershipTier = {
      id: editingTier ? editingTier.id : `tier-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      minNights: Number(minNights) || 0,
      minStays: Math.ceil((Number(minNights) || 0) / 3),
      icon: selectedIcon,
      hotelDiscountEnabled: (Number(discountPercent) || 0) > 0,
      hotelDiscountType: 'PERCENTAGE',
      hotelDiscountValue: Number(discountPercent) || 0,
      restaurantDiscountEnabled: false,
      restaurantDiscountType: 'PERCENTAGE',
      restaurantDiscountValue: 0,
      discountPercent: Number(discountPercent) || 0,
      color: selectedColorPreset.color,
      textColor: selectedColorPreset.textColor,
      bgColor: selectedColorPreset.bgColor,
      borderColor: selectedColorPreset.borderColor,
      badgeStyle: selectedColorPreset.style,
      description: '',
      benefits: benefits.length > 0 ? benefits : ['Standard Room Rates'],
      isActive,
      order: editingTier ? editingTier.order : tiers.length + 1,
    };

    const nextTiers = editingTier
      ? tiers.map((t) => (t.id === editingTier.id ? updatedTierData : t))
      : [...tiers, updatedTierData];

    const validation = validateMembershipTiers(nextTiers);
    if (!validation.isValid) {
      toast.error('Configuration Error', validation.error || 'Invalid tier configuration.');
      return;
    }

    saveMembershipTiers(nextTiers);
    setTiers(getMembershipTiers());
    setIsModalOpen(false);
    toast.success('Saved Successfully', `${updatedTierData.name} tier configuration updated.`);
  };

  const handleDeleteTier = (tier: MembershipTier) => {
    if (tiers.length <= 1) {
      toast.error('Cannot Delete', 'At least one membership tier must remain active.');
      return;
    }
    if (!window.confirm(`Delete "${tier.name}" membership tier?`)) return;
    const filtered = tiers.filter((t) => t.id !== tier.id);
    saveMembershipTiers(filtered);
    setTiers(getMembershipTiers());
    toast.info('Tier Removed', `${tier.name} tier has been deleted.`);
  };

  const handleToggleActive = (tier: MembershipTier) => {
    const updated = tiers.map((t) => (t.id === tier.id ? { ...t, isActive: !t.isActive } : t));
    saveMembershipTiers(updated);
    setTiers(getMembershipTiers());
    toast.info('Status Updated', `${tier.name} is now ${!tier.isActive ? 'Active' : 'Deactivated'}.`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all membership tiers back to default Regular, Silver, Gold, and Platinum?')) {
      saveMembershipTiers(DEFAULT_MEMBERSHIP_TIERS);
      setTiers(DEFAULT_MEMBERSHIP_TIERS);
      toast.success('Reset Complete', 'Default membership tiers restored.');
    }
  };

  // Helper to format night range display
  const getNightRangeLabel = (tier: MembershipTier, idx: number, all: MembershipTier[]) => {
    const nights = tier.minNights || 0;
    if (nights === 0) {
      const nextTier = all[idx + 1];
      if (nextTier) {
        return `0 – ${(nextTier.minNights || 1) - 1} Nights`;
      }
      return '0+ Nights';
    }
    const nextTier = all[idx + 1];
    if (nextTier) {
      return `${nights} – ${(nextTier.minNights || nights + 1) - 1} Nights`;
    }
    return `${nights}+ Nights`;
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden text-xs">
      {/* Header Bar: Title, Show entries per page, Instant Search, Reset Defaults, Add Button (Matches Room Types, AC Types, etc.) */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EEE9] dark:border-[#145447]/60 bg-white/60 dark:bg-[#071F1A]/60 backdrop-blur-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
            Membership Settings
          </h2>

          {/* Show [ 10 ] entries per page */}
          <div className="flex items-center gap-1.5 text-xs text-[#24352F] dark:text-slate-300 pl-2 sm:pl-3 border-l border-[#DCE3DF] dark:border-[#145447]">
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
              <option value={100}>100</option>
            </select>
            <span className="text-[#64736C] dark:text-[#A4B8AE] font-medium text-[11px]">entries per page</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#879B90]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search membership settings..."
              className="w-40 sm:w-52 pl-8 pr-7 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] placeholder-[#879B90] focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#879B90] hover:text-[#24352F] dark:hover:text-white"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reset Defaults button */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-medium text-[#24352F] dark:text-slate-200 hover:bg-[#FAFBF9] dark:hover:bg-[#093027] transition-colors cursor-pointer shadow-2xs"
            title="Restore default tiers"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#879B90]" />
            <span>Reset Defaults</span>
          </button>

          {/* Add Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] text-xs font-bold text-white shadow-2xs hover:bg-[#093027] dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Membership Tier</span>
          </button>
        </div>
      </div>

      {/* Scrollable Table Area: Divided grid table matching other Hotel Setup masters */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 shadow-2xs">
                <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                  <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">TIER CODE</th>
                  <th className="py-2.5 px-3.5 w-48 border-r border-[#E5EEE9] dark:border-[#145447]">TIER NAME</th>
                  <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">QUALIFYING NIGHTS</th>
                  <th className="py-2.5 px-3.5 w-44 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM FARE DISCOUNT</th>
                  <th className="py-2.5 px-3.5 min-w-[220px] border-r border-[#E5EEE9] dark:border-[#145447]">PRIVILEGES &amp; INCLUSIONS</th>
                  <th className="py-2.5 px-3 w-24 text-center border-r border-[#E5EEE9] dark:border-[#145447]">STATUS</th>
                  <th className="py-2.5 px-3 w-24 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {paginatedTiers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#879B90]">
                      No membership tiers match your search query.
                    </td>
                  </tr>
                ) : (
                  paginatedTiers.map((tier, idx) => {
                    const discountVal = tier.hotelDiscountValue ?? tier.discountPercent ?? 0;
                    return (
                      <tr
                        key={tier.id}
                        className={cn(
                          'group border-b border-[#E5EEE9] dark:border-[#145447] transition-colors',
                          'bg-white even:bg-[#F9FAFB] dark:bg-[#07241E] dark:even:bg-[#061B16]',
                          'hover:bg-[#F1F5F9] dark:hover:bg-[#0B3D32]/20',
                          !tier.isActive && 'opacity-60'
                        )}
                      >
                        {/* Order Index */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          <span className="font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                            {startIndex + idx + 1}
                          </span>
                        </td>

                        {/* Tier Code */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-2 py-0.5 text-[11px] font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                            {tier.code}
                          </span>
                        </td>

                        {/* Tier Name with Distinctive Visual Badge & Icon */}
                        <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                          <MembershipTierBadge tier={tier} size="sm" />
                        </td>

                        {/* Qualifying Nights */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          <span className="font-mono text-xs font-semibold text-[#4D6358] dark:text-emerald-300 flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-[#879B90]" />
                            <span>{getNightRangeLabel(tier, startIndex + idx, filteredTiers)}</span>
                          </span>
                        </td>

                        {/* Room Fare Discount */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          {discountVal > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-[2px]">
                              <Percent className="w-3 h-3" />
                              <span>{discountVal}% Room Fare</span>
                            </span>
                          ) : (
                            <span className="text-[#879B90] text-xs">0% (Standard Rates)</span>
                          )}
                        </td>

                        {/* Privileges & Inclusions */}
                        <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                          <div className="flex flex-wrap items-center gap-1 max-w-md">
                            {tier.benefits && tier.benefits.length > 0 ? (
                              tier.benefits.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="inline-block rounded-[2px] bg-[#F7F9F8] dark:bg-[#082820] px-1.5 py-0.5 text-[10px] font-medium text-[#4A6458] dark:text-[#A4B8AE] border border-[#DEE6E2] dark:border-[#145447]"
                                >
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#879B90] text-xs">—</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(tier)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-bold border transition-all cursor-pointer select-none',
                              tier.isActive
                                ? 'bg-emerald-50 text-[#0B3D32] border-emerald-300 hover:bg-emerald-100 dark:bg-[#072B22] dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-[#0C3B2E]'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                tier.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              )}
                            />
                            <span>{tier.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <button
                              type="button"
                              onClick={() => openEditModal(tier)}
                              className="p-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs transition-colors"
                              title={`Edit ${tier.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {tiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTier(tier)}
                                className="p-1 rounded-[3px] border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 cursor-pointer shadow-2xs transition-colors"
                                title={`Delete ${tier.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* DataTables Pagination Footer: Showing X to Y of Z entries */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-xs text-[#64736C] dark:text-[#A4B8AE] select-none">
            <div className="text-[11px]">
              Showing{' '}
              <strong className="text-[#24352F] dark:text-white">
                {totalEntries === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#24352F] dark:text-white">
                {Math.min(startIndex + pageSize, totalEntries)}
              </strong>{' '}
              of{' '}
              <strong className="text-[#24352F] dark:text-white">{totalEntries}</strong>{' '}
              entries
            </div>

            {/* Pagination buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7F5] dark:hover:bg-[#0A2E26] cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'px-2.5 py-1 rounded-[2px] text-xs font-semibold cursor-pointer border',
                      currentPage === pageNum
                        ? 'bg-[#0B3D32] border-[#0B3D32] text-white'
                        : 'border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-[#24352F] dark:text-slate-200 hover:bg-[#F4F7F5]'
                    )}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded-[2px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F7F5] dark:hover:bg-[#0A2E26] cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Membership Tier */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32]/10 dark:bg-emerald-950/70 text-[#0B3D32] dark:text-emerald-300">
                  <Award className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  {editingTier ? `Edit ${editingTier.name}` : 'Add Membership Tier'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTier}>
              <div className="p-5 space-y-3.5">
                {/* Row 1: Name and Code */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tier Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingTier) setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                      }}
                      placeholder="e.g. Diamond Member"
                      className="w-full h-8 px-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs font-medium text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tier Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      placeholder="e.g. DIAMOND"
                      className="w-full h-8 px-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] font-mono text-xs font-bold text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs uppercase"
                    />
                  </div>
                </div>

                {/* Row 2: Qualifying Nights & Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Qualifying Nights <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={minNights}
                      onChange={(e) => setMinNights(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full h-8 px-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] font-mono text-xs text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Room Fare Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                        }
                        className="w-full h-8 pl-2.5 pr-7 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] font-mono text-xs text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                      />
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 3: Color Palette & Icon Emblem Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      {COLOR_PRESETS.map((preset) => {
                        const isSelected = selectedColorPreset.color === preset.color;
                        return (
                          <button
                            key={preset.color}
                            type="button"
                            onClick={() => setSelectedColorPreset(preset)}
                            title={preset.name}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer',
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-[#0B3D32] dark:ring-emerald-400 scale-105'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                            )}
                            style={{ backgroundColor: preset.color }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Badge Icon Emblem
                    </label>
                    <div className="flex items-center gap-1.5">
                      {AVAILABLE_TIER_ICONS.map((opt) => {
                        const IconComp = opt.icon;
                        const isSelected = selectedIcon === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedIcon(opt.id)}
                            title={opt.label}
                            className={cn(
                              'w-7 h-7 rounded-[3px] border flex items-center justify-center transition-all cursor-pointer',
                              isSelected
                                ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs'
                                : 'bg-white dark:bg-[#07241E] border-[#DCE3DF] dark:border-[#145447] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#093027]'
                            )}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="p-2 rounded-[3px] bg-[#F8FAF9] dark:bg-[#061B16] border border-[#E5EEE9] dark:border-[#145447] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Badge Preview:</span>
                  <MembershipTierBadge
                    tierCode={code || 'TIER'}
                    tierName={name || 'Tier Name'}
                    icon={selectedIcon}
                    size="sm"
                  />
                </div>

                {/* Row 4: Privileges & Inclusions (Clean tag chips) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Privileges &amp; Inclusions
                  </label>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                      placeholder="e.g. Priority Check-In..."
                      className="flex-1 h-8 px-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#07241E] text-xs text-[#24352F] dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="h-8 px-3 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white font-semibold text-xs cursor-pointer shadow-2xs"
                    >
                      Add
                    </button>
                  </div>

                  {/* Active benefit tags */}
                  {benefits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                      {benefits.map((b, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          <span>{b}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(i)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 5: Status */}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B3D32] focus:ring-[#0B3D32] cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-5 py-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  {editingTier ? 'Update Tier' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipSettingsManager;

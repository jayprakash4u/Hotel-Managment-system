'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Percent,
  BedDouble,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import {
  MembershipTier,
  DEFAULT_MEMBERSHIP_TIERS,
  getMembershipTiers,
  saveMembershipTiers,
  validateMembershipTiers,
} from '@/lib/loyalty';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  { name: 'Silver / Slate', color: '#64748B', textColor: 'text-slate-800 dark:text-slate-200', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-300 dark:border-slate-700', style: 'silver' as const },
  { name: 'Gold / Amber', color: '#D97706', textColor: 'text-amber-800 dark:text-amber-300', bgColor: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-300 dark:border-amber-800', style: 'gold' as const },
  { name: 'Platinum / Indigo', color: '#4F46E5', textColor: 'text-indigo-800 dark:text-indigo-300', bgColor: 'bg-indigo-50 dark:bg-indigo-950/50', borderColor: 'border-indigo-300 dark:border-indigo-800', style: 'platinum' as const },
  { name: 'Diamond / Cyan', color: '#0284C7', textColor: 'text-sky-800 dark:text-sky-300', bgColor: 'bg-sky-50 dark:bg-sky-950/50', borderColor: 'border-sky-300 dark:border-sky-800', style: 'custom' as const },
  { name: 'Emerald / Green', color: '#059669', textColor: 'text-emerald-800 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', borderColor: 'border-emerald-300 dark:border-emerald-800', style: 'custom' as const },
  { name: 'Ruby / Rose', color: '#E11D48', textColor: 'text-rose-800 dark:text-rose-300', bgColor: 'bg-rose-50 dark:bg-rose-950/50', borderColor: 'border-rose-300 dark:border-rose-800', style: 'custom' as const },
];

export const MembershipSettingsManager: React.FC = () => {
  const toast = useToast();
  const [tiers, setTiers] = useState<MembershipTier[]>(() => getMembershipTiers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [minStays, setMinStays] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedColorPreset, setSelectedColorPreset] = useState(COLOR_PRESETS[0]);
  const [description, setDescription] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Sync state on external update
  useEffect(() => {
    const handleUpdated = () => setTiers(getMembershipTiers());
    window.addEventListener('hotel_membership_tiers_updated', handleUpdated);
    return () => window.removeEventListener('hotel_membership_tiers_updated', handleUpdated);
  }, []);

  const openCreateModal = () => {
    setEditingTier(null);
    setName('');
    setCode('');
    // Suggest next min stays based on highest existing
    const maxStays = tiers.reduce((max, t) => Math.max(max, t.minStays), 0);
    setMinStays(maxStays + 5);
    setDiscountPercent(15);
    setSelectedColorPreset(COLOR_PRESETS[3]); // Diamond
    setDescription('');
    setBenefits(['Direct Discount on Room Bookings', 'Priority Room Key Handover']);
    setBenefitInput('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (tier: MembershipTier) => {
    setEditingTier(tier);
    setName(tier.name);
    setCode(tier.code);
    setMinStays(tier.minStays);
    setDiscountPercent(tier.discountPercent);
    const matchedPreset = COLOR_PRESETS.find((p) => p.color.toLowerCase() === tier.color.toLowerCase()) || COLOR_PRESETS[0];
    setSelectedColorPreset(matchedPreset);
    setDescription(tier.description || '');
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
      minStays: Number(minStays) || 0,
      discountPercent: Number(discountPercent) || 0,
      color: selectedColorPreset.color,
      textColor: selectedColorPreset.textColor,
      bgColor: selectedColorPreset.bgColor,
      borderColor: selectedColorPreset.borderColor,
      badgeStyle: selectedColorPreset.style,
      description: description.trim(),
      benefits: benefits.length > 0 ? benefits : ['Standard Hotel Membership Benefits'],
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
    if (window.confirm('Reset all loyalty membership levels back to default Silver, Gold, and Platinum?')) {
      saveMembershipTiers(DEFAULT_MEMBERSHIP_TIERS);
      setTiers(DEFAULT_MEMBERSHIP_TIERS);
      toast.success('Reset Complete', 'Default Silver, Gold, and Platinum membership tiers restored.');
    }
  };

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[3px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Award className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Customer Loyalty &amp; Membership Settings
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Configure hotel loyalty tiers, minimum completed stay thresholds, booking discounts, and guest benefits. Stays are calculated automatically upon checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            title="Restore default Silver, Gold, Platinum tiers"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Membership Tier</span>
          </button>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tiers.map((tier, idx) => {
          return (
            <div
              key={tier.id}
              className={cn(
                'rounded-lg border bg-white dark:bg-surface-card overflow-hidden shadow-2xs flex flex-col justify-between transition-all',
                tier.isActive ? 'border-slate-300 dark:border-border-default' : 'opacity-60 border-dashed border-slate-300'
              )}
            >
              {/* Card Header with Color Banner */}
              <div
                className="p-3.5 border-b border-slate-200 dark:border-border-default flex items-center justify-between"
                style={{ borderTop: `4px solid ${tier.color}` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-[3px] flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                    style={{ backgroundColor: tier.color }}
                  >
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {tier.name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        {tier.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Level {idx + 1}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(tier)}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-[3px] border cursor-pointer transition-colors',
                      tier.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 space-y-3 flex-1">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[3px] bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Min Stays</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1 mt-0.5">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                      {tier.minStays} {tier.minStays === 1 ? 'Stay' : 'Stays'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Discount</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1 mt-0.5">
                      <Percent className="w-3.5 h-3.5" />
                      {tier.discountPercent}% Off
                    </span>
                  </div>
                </div>

                {tier.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    {tier.description}
                  </p>
                )}

                {/* Benefits List */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Member Privileges &amp; Benefits
                  </span>
                  <ul className="space-y-1">
                    {tier.benefits && tier.benefits.length > 0 ? (
                      tier.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[10px] text-slate-400 italic">Standard membership privileges</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 border-t border-slate-200 dark:border-border-default bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditModal(tier)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  <Pencil className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>

                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTier(tier)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[3px] border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Membership Tier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[3px] bg-white dark:bg-surface-card shadow-2xl border border-slate-300 dark:border-border-default overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-12 px-5 border-b border-slate-200 dark:border-border-default flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-[3px] flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedColorPreset.color }}
                >
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingTier ? `Edit ${editingTier.name} Membership Level` : 'Add New Membership Level'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTier} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingTier) setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    }}
                    placeholder="e.g. Diamond, VIP Silver"
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tier Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. DIAMOND"
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs uppercase"
                  />
                </div>
              </div>

              {/* Threshold & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Completed Stays <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minStays}
                    onChange={(e) => setMinStays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Guest qualifies after completing this many stays.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Direct Booking Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full h-8 pl-2.5 pr-7 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Applied on room reservations for this tier.
                  </span>
                </div>
              </div>

              {/* Color Preset Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tier Theme &amp; Badge Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = selectedColorPreset.color === preset.color;
                    return (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setSelectedColorPreset(preset)}
                        className={cn(
                          'p-2 rounded-[3px] border text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                          isSelected
                            ? 'border-slate-900 dark:border-white ring-2 ring-offset-1 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-border-default hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-2xs"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                          {preset.name.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this membership level..."
                  className="w-full h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                />
              </div>

              {/* Benefits Editor */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Member Benefits &amp; Privileges
                </label>
                <div className="flex items-center gap-1.5 mb-2">
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
                    placeholder="e.g. Free Breakfast Upgrade, Late Checkout..."
                    className="flex-1 h-8 px-2.5 rounded-[3px] border border-slate-300 dark:border-border-default bg-white dark:bg-surface-card text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D32] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="h-8 px-3 rounded-[3px] bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs cursor-pointer shadow-2xs"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {benefits.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-1.5 rounded-[2px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-slate-800 dark:text-slate-200">{b}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(i)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tierActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B3D32] focus:ring-[#0B3D32] cursor-pointer"
                />
                <label htmlFor="tierActiveCheck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Activate this tier for automatic upgrades and discount eligibility
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-border-default flex items-center justify-end gap-2">
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

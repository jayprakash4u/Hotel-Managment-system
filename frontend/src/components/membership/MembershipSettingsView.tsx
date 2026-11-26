'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Building,
  UtensilsCrossed,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Percent,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  MembershipTier,
  getMembershipTiers,
  saveMembershipTiers,
  DEFAULT_MEMBERSHIP_TIERS,
  validateMembershipTiers,
} from '@/lib/loyalty';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export function MembershipSettingsView() {
  const toast = useToast();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New tier form state
  const [newTierName, setNewTierName] = useState('');
  const [newTierCode, setNewTierCode] = useState('');
  const [newTierNights, setNewTierNights] = useState(0);
  const [newTierHotelDiscount, setNewTierHotelDiscount] = useState(0);
  const [newTierRestDiscount, setNewTierRestDiscount] = useState(0);
  const [newTierDesc, setNewTierDesc] = useState('');

  // Discount Restrictions State
  const [restrictions, setRestrictions] = useState({
    allowPromoStacking: false,
    excludeAlcohol: true,
    excludeMinibar: true,
    minBillForDiscount: 0,
    qualificationPeriodMonths: 12,
  });

  // Load tiers from API with fallback to local storage
  const loadTiers = async () => {
    setLoading(true);
    try {
      const remoteTiers = await api.getMembershipTiers();
      if (Array.isArray(remoteTiers) && remoteTiers.length > 0) {
        const mapped: MembershipTier[] = remoteTiers.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          minNights: t.minNights,
          minStays: Math.round(t.minNights / 2.5),
          hotelDiscountEnabled: t.hotelDiscountEnabled,
          hotelDiscountType: t.hotelDiscountType,
          hotelDiscountValue: t.hotelDiscountValue,
          hotelMaxDiscount: t.hotelMaxDiscount,
          restaurantDiscountEnabled: t.restaurantDiscountEnabled,
          restaurantDiscountType: t.restaurantDiscountType,
          restaurantDiscountValue: t.restaurantDiscountValue,
          restaurantMaxDiscount: t.restaurantMaxDiscount,
          color: t.color,
          textColor: 'text-slate-800 dark:text-slate-200',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          borderColor: 'border-slate-300 dark:border-slate-700',
          badgeStyle: (t.code.toLowerCase() as any) || 'custom',
          description: t.description,
          benefits: (() => {
            try {
              return JSON.parse(t.benefitsJson || '[]');
            } catch {
              return [];
            }
          })(),
          isActive: t.isActive,
          order: t.displayOrder,
        }));
        setTiers(mapped);
        saveMembershipTiers(mapped);
      } else {
        setTiers(getMembershipTiers());
      }
    } catch {
      setTiers(getMembershipTiers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleToggleTierStatus = async (tierId: string) => {
    const updated = tiers.map((t) => (t.id === tierId ? { ...t, isActive: !t.isActive } : t));
    setTiers(updated);
    saveMembershipTiers(updated);

    const target = updated.find((t) => t.id === tierId);
    if (target) {
      try {
        await api.updateMembershipTier(target.id, { isActive: target.isActive });
      } catch {
        // Non-blocking sync
      }
      toast.success(
        'Tier Status Updated',
        `"${target.name}" is now ${target.isActive ? 'active and available' : 'deactivated'}.`
      );
    }
  };

  const handleSaveTierEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    const validation = validateMembershipTiers(
      tiers.map((t) => (t.id === editingTier.id ? editingTier : t))
    );
    if (!validation.isValid) {
      toast.error('Validation Error', validation.error || 'Please check tier rules.');
      return;
    }

    const updated = tiers.map((t) => (t.id === editingTier.id ? editingTier : t));
    setTiers(updated);
    saveMembershipTiers(updated);

    try {
      await api.updateMembershipTier(editingTier.id, {
        name: editingTier.name,
        description: editingTier.description,
        minNights: editingTier.minNights,
        hotelDiscountEnabled: editingTier.hotelDiscountEnabled,
        hotelDiscountType: editingTier.hotelDiscountType,
        hotelDiscountValue: editingTier.hotelDiscountValue,
        hotelMaxDiscount: editingTier.hotelMaxDiscount,
        restaurantDiscountEnabled: editingTier.restaurantDiscountEnabled,
        restaurantDiscountType: editingTier.restaurantDiscountType,
        restaurantDiscountValue: editingTier.restaurantDiscountValue,
        restaurantMaxDiscount: editingTier.restaurantMaxDiscount,
        benefitsJson: JSON.stringify(editingTier.benefits),
        isActive: editingTier.isActive,
      });
    } catch {
      // Non-blocking sync
    }

    setEditingTier(null);
    toast.success('Membership Tier Saved', `Changes to "${editingTier.name}" have been saved.`);
  };

  const handleAddNewTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierName.trim() || !newTierCode.trim()) {
      toast.error('Input Required', 'Tier Name and Code are required.');
      return;
    }

    const newTier: MembershipTier = {
      id: `tier-${Date.now()}`,
      code: newTierCode.trim().toUpperCase(),
      name: newTierName.trim(),
      minNights: Number(newTierNights) || 0,
      hotelDiscountEnabled: Number(newTierHotelDiscount) > 0,
      hotelDiscountType: 'PERCENTAGE',
      hotelDiscountValue: Number(newTierHotelDiscount) || 0,
      restaurantDiscountEnabled: Number(newTierRestDiscount) > 0,
      restaurantDiscountType: 'PERCENTAGE',
      restaurantDiscountValue: Number(newTierRestDiscount) || 0,
      color: '#0B3D32',
      textColor: 'text-slate-800 dark:text-slate-200',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      borderColor: 'border-slate-300 dark:border-slate-700',
      badgeStyle: 'custom',
      description: newTierDesc.trim() || 'Custom membership privilege level',
      benefits: ['Custom Member Privileges'],
      isActive: true,
      order: tiers.length + 1,
    };

    const updated = [...tiers, newTier];
    const validation = validateMembershipTiers(updated);
    if (!validation.isValid) {
      toast.error('Validation Error', validation.error || 'Please check tier rules.');
      return;
    }

    setTiers(updated);
    saveMembershipTiers(updated);

    try {
      await api.createMembershipTier({
        code: newTier.code,
        name: newTier.name,
        description: newTier.description,
        minNights: newTier.minNights,
        hotelDiscountEnabled: newTier.hotelDiscountEnabled,
        hotelDiscountType: newTier.hotelDiscountType,
        hotelDiscountValue: newTier.hotelDiscountValue,
        restaurantDiscountEnabled: newTier.restaurantDiscountEnabled,
        restaurantDiscountType: newTier.restaurantDiscountType,
        restaurantDiscountValue: newTier.restaurantDiscountValue,
        benefitsJson: JSON.stringify(newTier.benefits),
        isActive: true,
        displayOrder: newTier.order,
      });
    } catch {
      // Non-blocking sync
    }

    setIsAddModalOpen(false);
    setNewTierName('');
    setNewTierCode('');
    setNewTierNights(0);
    setNewTierHotelDiscount(0);
    setNewTierRestDiscount(0);
    setNewTierDesc('');
    toast.success('New Tier Created', `"${newTier.name}" has been added to membership levels.`);
  };

  return (
    <div className="space-y-6">
      {/* Critical Business Rule Banner */}
      <div className="p-3.5 rounded-[4px] border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-emerald-950 dark:text-emerald-100 block">
            Critical Operating Principle: Membership Status is Automatic, Discounts are Manual
          </strong>
          Guests automatically advance between tiers based on verified completed hotel nights after check-out.
          However, membership discounts must <span className="underline font-semibold">NEVER be applied automatically</span>.
          Front desk and restaurant billing staff must explicitly toggle the &quot;Apply Membership Discount&quot; checkbox during billing settlement.
        </div>
      </div>

      {/* -------------------------------------------------------------------
          SECTION A: MEMBERSHIP TIERS TABLE
          ------------------------------------------------------------------- */}
      <div className="rounded-[4px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#F8FAFC] dark:bg-[#061B16] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              A. Membership Tiers &amp; Completed Night Thresholds
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTiers}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[3px] bg-[#0B3D32] hover:bg-[#093027] text-white shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Membership Tier</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs select-none">
              <tr>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">Tier / Level</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Qualifying Nights</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Hotel Discount</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Restaurant Discount</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700">Benefits &amp; Privileges</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-200">
              {tiers.map((t) => (
                <tr
                  key={t.id}
                  className="bg-white even:bg-[#F9FAFB] dark:bg-slate-900 dark:even:bg-slate-800/35 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/70 transition-colors border-b border-slate-200 dark:border-slate-700/60"
                >
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color || '#64748B' }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider">{t.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center font-mono font-bold text-slate-900 dark:text-white">
                    {t.minNights}+ nights
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center">
                    {t.hotelDiscountEnabled ? (
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        <Building className="w-3 h-3" />
                        {t.hotelDiscountType === 'FIXED' ? `Rs. ${t.hotelDiscountValue}` : `${t.hotelDiscountValue}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Disabled</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center">
                    {t.restaurantDiscountEnabled ? (
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                        <UtensilsCrossed className="w-3 h-3" />
                        {t.restaurantDiscountType === 'FIXED' ? `Rs. ${t.restaurantDiscountValue}` : `${t.restaurantDiscountValue}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Disabled</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {t.benefits && t.benefits.length > 0 ? (
                        t.benefits.slice(0, 3).map((b, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 truncate"
                            title={b}
                          >
                            {b}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No benefits listed</span>
                      )}
                      {t.benefits && t.benefits.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 font-bold">
                          +{t.benefits.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-200 dark:border-slate-700/60 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleTierStatus(t.id)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer',
                        t.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setEditingTier(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-[#0B3D32] dark:text-emerald-400" />
                      <span>Configure</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          SECTION B: SEPARATE HOTEL & RESTAURANT DISCOUNT CONFIGURATION
          ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hotel Discount Rules Card */}
        <div className="rounded-[4px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              B1. Hotel Room Folio Discount Rules
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Hotel discounts are applied specifically to room rate charges and nightly accommodation.
            When checking out or settling a folio, checking &quot;Apply Membership Discount&quot; recalculates
            the net room charge based on the guest&apos;s verified tier.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Default Silver Discount:</span>
              <strong className="font-mono text-slate-900 dark:text-white">5% direct</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Default Gold Discount:</span>
              <strong className="font-mono text-slate-900 dark:text-white">10% direct</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Default Platinum Discount:</span>
              <strong className="font-mono text-slate-900 dark:text-white">15% direct</strong>
            </div>
          </div>
        </div>

        {/* Restaurant Dining Discount Rules Card */}
        <div className="rounded-[4px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              B2. Restaurant &amp; Dining POS Discount Rules
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Restaurant discounts apply to eligible food and beverage orders in Quick Sale POS, Table Orders,
            and Bar outlets. Staff must manually check the discount box after identifying the member.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Default Silver Dining:</span>
              <span className="font-mono text-slate-400">0% (Hotel-only tier)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Default Gold Dining:</span>
              <strong className="font-mono text-slate-900 dark:text-white">5% direct</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Default Platinum Dining:</span>
              <strong className="font-mono text-slate-900 dark:text-white">10% direct</strong>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          SECTION C: DISCOUNT RESTRICTIONS & POLICY GOVERNANCE
          ------------------------------------------------------------------- */}
      <div className="rounded-[4px] border border-slate-200 dark:border-border-default bg-white dark:bg-surface-card p-4 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-[#0B3D32] dark:text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
            C. Discount Restrictions &amp; Financial Exclusions
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
            <input
              type="checkbox"
              checked={restrictions.allowPromoStacking}
              onChange={(e) => setRestrictions({ ...restrictions, allowPromoStacking: e.target.checked })}
              className="mt-0.5 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Allow Stacking with Promo Codes &amp; Manual Discounts
              </span>
              <span className="text-slate-500 text-[11px]">
                When disabled, membership discount overrides other promotional discounts rather than compounding.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
            <input
              type="checkbox"
              checked={restrictions.excludeAlcohol}
              onChange={(e) => setRestrictions({ ...restrictions, excludeAlcohol: e.target.checked })}
              className="mt-0.5 rounded text-[#0B3D32] focus:ring-[#0B3D32]"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Exclude Hard Liquor &amp; Tobacco from Dining Discount
              </span>
              <span className="text-slate-500 text-[11px]">
                Discounts apply only to food and non-alcoholic beverages; bar alcohol sales remain at standard pricing.
              </span>
            </div>
          </label>
        </div>

        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            <strong>Statutory Exclusions:</strong> Membership discounts strictly apply before government VAT and service charges. Taxes are never discounted.
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          EDIT TIER MODAL
          ------------------------------------------------------------------- */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-[4px] bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#F8FAFC] dark:bg-[#061B16] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-heading">
                Configure {editingTier.name} ({editingTier.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTierEdits} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTier.name}
                    onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qualifying Completed Nights
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingTier.minNights}
                    onChange={(e) => setEditingTier({ ...editingTier, minNights: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingTier.description}
                  onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                />
              </div>

              {/* Hotel Discount Controls */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                    Hotel Room Discount
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTier.hotelDiscountEnabled}
                      onChange={(e) => setEditingTier({ ...editingTier, hotelDiscountEnabled: e.target.checked })}
                      className="rounded text-[#0B3D32]"
                    />
                    <span className="text-[11px] font-semibold">Enabled</span>
                  </label>
                </div>
                {editingTier.hotelDiscountEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Discount Type</label>
                      <select
                        value={editingTier.hotelDiscountType}
                        onChange={(e) => setEditingTier({ ...editingTier, hotelDiscountType: e.target.value as any })}
                        className="w-full h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (Rs.)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Discount Value</label>
                      <input
                        type="number"
                        min={0}
                        value={editingTier.hotelDiscountValue}
                        onChange={(e) => setEditingTier({ ...editingTier, hotelDiscountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Restaurant Discount Controls */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                    Restaurant Dining Discount
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTier.restaurantDiscountEnabled}
                      onChange={(e) => setEditingTier({ ...editingTier, restaurantDiscountEnabled: e.target.checked })}
                      className="rounded text-[#0B3D32]"
                    />
                    <span className="text-[11px] font-semibold">Enabled</span>
                  </label>
                </div>
                {editingTier.restaurantDiscountEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Discount Type</label>
                      <select
                        value={editingTier.restaurantDiscountType}
                        onChange={(e) => setEditingTier({ ...editingTier, restaurantDiscountType: e.target.value as any })}
                        className="w-full h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (Rs.)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Discount Value</label>
                      <input
                        type="number"
                        min={0}
                        value={editingTier.restaurantDiscountValue}
                        onChange={(e) => setEditingTier({ ...editingTier, restaurantDiscountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="w-full h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded bg-[#0B3D32] hover:bg-[#093027] text-white cursor-pointer shadow-2xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          ADD NEW TIER MODAL
          ------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-[4px] bg-white dark:bg-surface-card border border-slate-300 dark:border-border-default shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-border-default bg-[#F8FAFC] dark:bg-[#061B16] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-heading">
                Add Custom Membership Tier
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTier} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tier Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Member, Corporate VIP"
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    System Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIAMOND"
                    value={newTierCode}
                    onChange={(e) => setNewTierCode(e.target.value.toUpperCase())}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qualifying Nights *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newTierNights}
                    onChange={(e) => setNewTierNights(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B3D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hotel Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newTierHotelDiscount}
                    onChange={(e) => setNewTierHotelDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Restaurant Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newTierRestDiscount}
                    onChange={(e) => setNewTierRestDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Tier overview..."
                  value={newTierDesc}
                  onChange={(e) => setNewTierDesc(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded bg-[#0B3D32] hover:bg-[#093027] text-white cursor-pointer shadow-2xs"
                >
                  Create Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building, Percent, RefreshCw, Award } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AppearanceSettings } from '@/components/common/AppearanceSettings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { MembershipSettingsView } from '@/components/membership/MembershipSettingsView';
import { cn } from '@/lib/utils';

const cardClass = 'rounded-xl bg-surface-card border border-border-default dark:bg-surface-card dark:border-border-default';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'membership' ? 'MEMBERSHIP' : 'GENERAL';
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MEMBERSHIP'>(initialTab);
  const toast = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const [propertyConfig, setPropertyConfig] = useState({
    propertyName: 'Hotel OS',
    tagline: 'Front Desk & Stays',
    currency: 'USD ($)',
    country: 'United States',
    vatRate: 10,
    serviceChargeRate: 5,
    checkInTime: '15:00',
    checkOutTime: '11:00',
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configuration Saved', 'System settings and tax rates updated.');
  };

  const handleResetDemoData = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await api.seedDatabase();
      toast.celebrate('Demo Database Re-Seeded!', 'Fresh rooms, guests, and active folios restored.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      toast.error('Reset failed', e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="System Settings & Configuration"
        subtitle="Property profile, tax & surcharge rules, membership tiers & discounts, theme & appearance"
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-border-default pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer border',
            activeTab === 'GENERAL'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50'
          )}
        >
          <Building className="w-3.5 h-3.5" />
          <span>General &amp; Property Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEMBERSHIP')}
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] text-xs font-bold transition-all cursor-pointer border',
            activeTab === 'MEMBERSHIP'
              ? 'bg-[#0B3D32] text-white border-[#0B3D32] shadow-2xs dark:bg-emerald-700 dark:border-emerald-700'
              : 'bg-white dark:bg-surface-card text-slate-700 dark:text-slate-300 border-slate-300 dark:border-border-default hover:bg-slate-50'
          )}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Membership &amp; Loyalty Program</span>
        </button>
      </div>

      {activeTab === 'MEMBERSHIP' ? (
        <MembershipSettingsView />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveSettings} className={`p-6 ${cardClass} space-y-5`}>
              <div className="border-b border-border-default dark:border-border-default">
                <Building className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-body dark:text-body font-heading">Property &amp; Brand Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Property Brand Name *"
                  value={propertyConfig.propertyName}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, propertyName: e.target.value })}
                />
                <Input
                  label="Currency"
                  value={propertyConfig.currency}
                  onChange={(e) => setPropertyConfig({ ...propertyConfig, currency: e.target.value })}
                />
              </div>

              <Input
                label="Brand Tagline"
                value={propertyConfig.tagline}
                onChange={(e) => setPropertyConfig({ ...propertyConfig, tagline: e.target.value })}
              />

              <div className="pt-4 border-t border-border-default dark:border-border-default space-y-4">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted" />
                  <h3 className="text-sm font-semibold text-body dark:text-body font-heading">Taxes &amp; Service Fees</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Occupancy &amp; Sales Tax (%)"
                    type="number"
                    value={propertyConfig.vatRate}
                    onChange={(e) => setPropertyConfig({ ...propertyConfig, vatRate: parseInt(e.target.value, 10) || 0 })}
                  />
                  <Input
                    label="Service Charge (%)"
                    type="number"
                    value={propertyConfig.serviceChargeRate}
                    onChange={(e) => setPropertyConfig({ ...propertyConfig, serviceChargeRate: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-default dark:border-border-default flex justify-end">
                <Button variant="primary" size="md" type="submit">
                  Save Property Configuration
                </Button>
              </div>
            </form>
          </div>

          {/* Right Col: Theme & Appearance + Reset Demo */}
          <div className="space-y-6">
            <AppearanceSettings />

            {/* Quick Demo Re-seed trigger */}
            <div className={`p-6 ${cardClass} space-y-4`}>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-body dark:text-body font-heading">Data Management</h3>
              </div>

              <p className="text-xs text-muted dark:text-muted leading-relaxed">
                Reset the database with rich demo data (25+ rooms across 5 floors, VIP guests, active restaurant orders, KOTs, and inventory).
              </p>

              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs"
                onClick={handleResetDemoData}
                isLoading={isResetting}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />}
              >
                Re-Seed Database (Demo Reset)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

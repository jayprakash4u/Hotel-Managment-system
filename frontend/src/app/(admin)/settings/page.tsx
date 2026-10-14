'use client';

import React, { useState } from 'react';
import { Building, Percent, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

export default function SettingsPage() {
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
        subtitle="Property profile, tax & surcharge rules, outlet operational parameters, and database seed controls"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className={`p-6 ${cardClass} space-y-5`}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Property & Brand Profile</h3>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Taxes & Service Fees</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Occupancy & Sales Tax (%)"
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="gold" size="md" type="submit">
                Save Property Configuration
              </Button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Data Management & Reset */}
        <div className="space-y-6">
          <div className={`p-6 ${cardClass} space-y-4`}>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">Data Management</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reset the SQLite database with rich demo data (25+ rooms across 5 floors, VIP guests, active restaurant orders, KOTs, and inventory).
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
    </div>
  );
}

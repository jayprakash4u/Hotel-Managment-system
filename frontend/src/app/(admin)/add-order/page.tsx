'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Receipt, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { ReservationData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const cardClass = 'rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800';

interface OrderLine {
  description: string;
  unitPrice: number;
  quantity: number;
}

const emptyLine = (): OrderLine => ({ description: '', unitPrice: 0, quantity: 1 });

function AddOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const resId = searchParams.get('res') || '';

  const [loading, setLoading] = useState(true);
  const [stay, setStay] = useState<ReservationData | null>(null);
  const [outlet, setOutlet] = useState('RESTAURANT');
  const [lines, setLines] = useState<OrderLine[]>([emptyLine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!resId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await api.getReservation(resId);
        setStay(data);
      } catch (e: any) {
        toast.error('Failed to load stay', e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resId]);

  const updateLine = (index: number, patch: Partial<OrderLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const total = lines.reduce((sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 0), 0);
  const validLines = lines.filter((l) => l.description.trim() && l.unitPrice > 0 && l.quantity > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stay) return;
    if (validLines.length === 0) {
      toast.error('No items to add', 'Enter at least one item with a name and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const line of validLines) {
        await api.addFolioItem({
          reservationId: stay.id,
          outlet,
          description: line.description.trim(),
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          billedBy: 'Front Desk',
        });
      }

      toast.celebrate('Order Added to Room!', `${formatCurrency(total)} charged to Room ${stay.room.number}.`);
      router.push('/active-stays');
    } catch (e: any) {
      toast.error('Failed to add order', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 text-sm text-slate-500 dark:text-slate-400">
        Stay not found.{' '}
        <Link href="/active-stays" className="text-amber-700 dark:text-amber-400 hover:underline">
          Back to Active Stays
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/active-stays"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white font-heading">
              Add Order — Room {stay.room.number} ({stay.guest.firstName})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter what the guest ordered and its price — it's charged straight to their bill</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`p-6 ${cardClass} space-y-5`}>
        <Select label="Outlet / Category" value={outlet} onChange={(e) => setOutlet(e.target.value)}>
          <option value="RESTAURANT">Restaurant / Kitchen</option>
          <option value="ROOFTOP_BAR">Bar / Drinks</option>
          <option value="ROOM_SERVICE">Room Service</option>
          <option value="ZENITH_SPA">Spa</option>
          <option value="MINIBAR">Minibar</option>
          <option value="LAUNDRY">Laundry</option>
          <option value="OTHER">Other</option>
        </Select>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 px-0.5">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-right">Price ($)</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input
                  placeholder="e.g. Chicken Momo, Coca-Cola, Laundry..."
                  value={line.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.00"
                  value={line.unitPrice || ''}
                  onChange={(e) => updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="text-right"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value, 10) || 1 })}
                  className="text-right"
                />
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatCurrency((line.unitPrice || 0) * (line.quantity || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add another item
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Total to Room</span>
          <span className="text-lg font-semibold text-amber-700 dark:text-amber-400 font-heading">{formatCurrency(total)}</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link href="/active-stays" className="w-1/3">
            <Button variant="secondary" type="button" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button variant="gold" type="submit" isLoading={isSubmitting} className="w-2/3">
            Add Order to Room
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AddOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</div>}>
      <AddOrderContent />
    </Suspense>
  );
}

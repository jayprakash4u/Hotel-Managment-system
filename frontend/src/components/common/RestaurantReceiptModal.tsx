'use client';

import React from 'react';
import { X, Printer, CheckCircle2, UtensilsCrossed, Table2, Armchair, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  receiptNumber?: string;
  orderType?: string;
  tableNumber?: string | null;
  seatingNote?: string | null;
  createdAt?: string;
  serverName?: string;
  customerName?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercent?: number;
  tax: number;
  serviceCharge?: number;
  total: number;
  paidAmount?: number;
  changeDue?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
}

export const RestaurantReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  receiptNumber,
  orderType,
  tableNumber,
  seatingNote,
  createdAt,
  serverName,
  customerName,
  customerPhone,
  items,
  subtotal,
  discountAmount = 0,
  discountPercent = 0,
  tax,
  serviceCharge = 0,
  total,
  paidAmount,
  changeDue = 0,
  paymentMethod = 'CASH',
  paymentStatus = 'PAID',
}) => {
  if (!isOpen) return null;

  const effectiveReceiptNo = receiptNumber || `REC-${orderNumber.replace('ORD-', '')}`;
  const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();
  const effectivePaid = paidAmount !== undefined ? paidAmount : total;
  const balanceDue = Math.max(0, total - effectivePaid);

  const serviceLabel = tableNumber
    ? `Table ${tableNumber}`
    : orderType === 'TAKEAWAY'
    ? 'Takeaway / Counter'
    : `No Table${seatingNote ? ` (${seatingNote})` : ''}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-[#071F1A] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Customer Receipt</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper (Print Area) */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-900 dark:text-slate-100 print:p-0 print:text-black">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
            <h2 className="text-base font-black tracking-tight uppercase">HOTEL & RESTAURANT</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Grand Fine Dining & Hospitality</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Tax Invoice / Receipt</p>
          </div>

          {/* Receipt & Order Metadata */}
          <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Receipt No:</span>
              <span className="font-bold">{effectiveReceiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Order No:</span>
              <span className="font-bold">{orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Service:</span>
              <span className="font-bold inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                {tableNumber ? (
                  <Table2 className="w-3 h-3" />
                ) : orderType === 'TAKEAWAY' ? (
                  <ShoppingBag className="w-3 h-3" />
                ) : (
                  <Armchair className="w-3 h-3" />
                )}
                <span>{serviceLabel}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
              <span>{formattedDate}</span>
            </div>
            {serverName && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Server / Cashier:</span>
                <span>{serverName}</span>
              </div>
            )}
            {customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                <span>
                  {customerName}
                  {customerPhone ? ` (${customerPhone})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="w-1/2">Item</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-16 text-right">Rate</span>
              <span className="w-16 text-right">Amount</span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-xs py-0.5">
                <div className="w-1/2 pr-1">
                  <p className="font-medium truncate">{it.productName}</p>
                  {it.notes && <p className="text-[10px] italic text-slate-400">Note: {it.notes}</p>}
                </div>
                <span className="w-12 text-center">{it.quantity}</span>
                <span className="w-16 text-right font-mono text-[11px]">{formatCurrency(it.unitPrice)}</span>
                <span className="w-16 text-right font-mono font-bold text-[11px]">
                  {formatCurrency(it.total || it.unitPrice * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount{discountPercent > 0 ? ` (${discountPercent}%)` : ''}:</span>
                <span className="font-mono font-bold">- {formatCurrency(discountAmount)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">VAT / Tax (10%):</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
            )}

            {serviceCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service Charge (5%):</span>
                <span className="font-mono">{formatCurrency(serviceCharge)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment & Balance */}
          <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Payment Status:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
              <span className="font-bold">{paymentMethod || 'CASH'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Amount Paid:</span>
              <span className="font-mono font-bold">{formatCurrency(effectivePaid)}</span>
            </div>
            {changeDue > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Change Returned:</span>
                <span className="font-mono font-bold">{formatCurrency(changeDue)}</span>
              </div>
            )}
            {balanceDue > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Balance Due:</span>
                <span className="font-mono font-bold">{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 space-y-1 text-slate-400 dark:text-slate-500 text-[10px]">
            <p className="font-bold text-slate-700 dark:text-slate-300">Thank you for visiting!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0B3D32] hover:bg-[#093027] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

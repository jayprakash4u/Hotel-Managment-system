'use client';

import React from 'react';
import { X, Printer, Table2, Armchair, ShoppingBag } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

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
  ticketType?: 'BILL' | 'KOT' | 'BOT' | 'ALL';
  kotNumber?: string;
  botNumber?: string;
  hotelName?: string;
  outletName?: string;
}

function formatTicketDate(dateVal?: string | Date): string {
  try {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return String(dateVal || '');
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}-${month}-${year} ${hoursStr}:${mins} ${ampm}`;
  } catch {
    return new Date().toLocaleDateString();
  }
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
  ticketType = 'KOT',
  kotNumber,
  botNumber,
  hotelName = 'DEMO HOTEL',
  outletName = 'The Terrace Restaurant',
}) => {
  if (!isOpen) return null;

  const isKot = ticketType === 'KOT';
  const isBot = ticketType === 'BOT';
  const isAll = ticketType === 'ALL';
  const isOrderTicket = ticketType !== 'BILL';

  // Clean values matching reference ticket
  const cleanOrderNo = orderNumber.replace(/^ORD-?/i, '') || orderNumber;
  const formattedTicketDate = formatTicketDate(createdAt);
  const cleanTableNo = tableNumber
    ? tableNumber.replace(/^Table\s*/i, '')
    : orderType === 'TAKEAWAY'
    ? 'Takeaway'
    : (seatingNote || 'Quick Order');
  const userName = (serverName || 'ADMIN').toUpperCase();
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const effectiveReceiptNo = isKot
    ? kotNumber || receiptNumber || `KOT-${cleanOrderNo}`
    : isBot
    ? botNumber || receiptNumber || `BOT-${cleanOrderNo}`
    : receiptNumber || `REC-${cleanOrderNo}`;

  const effectivePaid = paidAmount !== undefined ? paidAmount : total;
  const balanceDue = Math.max(0, total - effectivePaid);

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
        className={cn(
          "w-full rounded-lg bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col",
          isOrderTicket ? "max-w-[360px]" : "max-w-md dark:bg-[#071F1A] dark:border-slate-800"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {isKot ? 'Kitchen Order Ticket (KOT)' : isBot ? 'Bar Order Ticket (BOT)' : isAll ? 'Order Ticket' : 'Customer Receipt'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =========================================================================
            TICKET PRINT AREA (80mm Thermal Receipt Layout)
           ========================================================================= */}
        <div
          id="thermal-receipt-ticket"
          className="p-6 overflow-y-auto bg-white text-slate-900 print:p-0 print:text-black selection:bg-slate-200"
        >
          {isOrderTicket ? (
            /* =========================================================================
               KOT / BOT / ORDER TICKET (Matching User's Reference Screenshot)
               ========================================================================= */
            <div className="font-sans text-slate-950 text-xs leading-relaxed select-text px-1">
              {/* 1. Header: Hotel & Restaurant */}
              <div className="text-center">
                <h2 className="text-sm font-black tracking-wide uppercase text-slate-950">
                  {hotelName}
                </h2>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  {outletName}
                </p>
              </div>

              {/* Top Divider Line */}
              <div className="border-t border-slate-900 my-2.5" />

              {/* 2. Order Metadata */}
              <div className="space-y-1 text-xs font-medium text-slate-950">
                <div className="flex items-center">
                  <span className="w-24 shrink-0 text-slate-900">Order No. :</span>
                  <span className="font-semibold">{cleanOrderNo}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 shrink-0 text-slate-900">Date :</span>
                  <span className="font-semibold">{formattedTicketDate}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 shrink-0 text-slate-900">Table No. :</span>
                  <span className="font-semibold">{cleanTableNo}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 shrink-0 text-slate-900">User :</span>
                  <span className="font-semibold uppercase">{userName}</span>
                </div>
              </div>

              {/* Centered ORDER TICKET Title with no top line, just margin */}
              <div className="text-center font-black text-xs tracking-wider uppercase text-slate-950 pt-3 pb-1">
                ORDER TICKET
              </div>

              {/* Single Divider under ORDER TICKET */}
              <div className="border-t border-slate-900 my-1" />

              {/* 3. Items Header */}
              <div className="flex justify-between items-center text-xs font-black uppercase text-slate-950 py-0.5">
                <span>ITEMS</span>
                <span className="text-right">QTY</span>
              </div>
              <div className="border-t border-slate-900 my-1" />

              {/* 4. Line Items */}
              <div className="space-y-1.5 py-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs text-slate-950">
                    <div className="pr-2">
                      <p className="font-semibold text-slate-950">{it.productName}</p>
                      {it.notes && (
                        <p className="text-[10px] text-slate-600 italic">Note: {it.notes}</p>
                      )}
                    </div>
                    <span className="font-bold shrink-0 text-slate-950">
                      {Number(it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider above Total Items */}
              <div className="border-t border-slate-900 my-2" />

              {/* 5. Total Items */}
              <div className="flex justify-between items-center text-xs font-bold text-slate-950">
                <span>Total Items</span>
                <span className="font-black">{totalQuantity.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            /* =========================================================================
               CUSTOMER BILL / RECEIPT (Tax Invoice Format)
               ========================================================================= */
            <div className="font-mono text-xs text-slate-900 dark:text-slate-100 print:text-black space-y-4">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                <h2 className="text-base font-black tracking-tight uppercase">
                  {hotelName}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {outletName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Tax Invoice / Receipt</p>
              </div>

              {/* Metadata */}
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
                    <span>{cleanTableNo}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
                  <span>{formattedTicketDate}</span>
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
                      <p className="font-bold truncate text-[13px]">{it.productName}</p>
                      {it.notes && <p className="text-[10px] italic font-normal text-slate-500 dark:text-slate-400">Note: {it.notes}</p>}
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
          )}
        </div>

        {/* Modal Actions (Hidden on print) */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
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
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isKot ? 'Print KOT' : isBot ? 'Print BOT' : isAll ? 'Print Ticket' : 'Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

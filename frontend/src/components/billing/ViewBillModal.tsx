'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileText,
  Receipt,
  Hotel,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  User,
  Phone,
  BedDouble,
  Hash,
  CreditCard,
  Building2,
  Calendar,
  Share2,
} from 'lucide-react';
import { BillData, BillLineItem, BillPaymentRecord } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export interface ViewBillModalProps {
  bill: BillData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment?: (bill: BillData) => void;
  hotelProfile?: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    gstVatNumber?: string;
    currencySymbol?: string;
  };
}

export const ViewBillModal: React.FC<ViewBillModalProps> = ({
  bill,
  isOpen,
  onClose,
  onOpenRecordPayment,
  hotelProfile,
}) => {
  const toast = useToast();

  // Layout mode switcher: 'AUTO' uses default according to billingType, or user can override
  const [layoutOverride, setLayoutOverride] = useState<'AUTO' | 'POS' | 'RESTAURANT' | 'HOTEL'>('AUTO');

  const activeLayout = useMemo(() => {
    if (!bill) return 'POS';
    if (layoutOverride !== 'AUTO') return layoutOverride;
    if (bill.billingType === 'HOTEL_CHECKOUT') return 'HOTEL';
    if (bill.billingType === 'QUICK_BILL') return 'POS';
    return 'RESTAURANT';
  }, [bill, layoutOverride]);

  if (!isOpen || !bill) return null;

  // Parse items safely
  let items: BillLineItem[] = [];
  try {
    items = bill.itemsJson ? JSON.parse(bill.itemsJson) : [];
  } catch {
    items = [];
  }

  // Parse payments safely
  let payments: BillPaymentRecord[] = [];
  try {
    payments = bill.paymentsJson ? JSON.parse(bill.paymentsJson) : [];
  } catch {
    payments = [];
  }

  const hotel = {
    name: hotelProfile?.name || 'Aura Grand Resort & Spa',
    address: hotelProfile?.address || 'Lakeside Boulevard, Pokhara',
    city: hotelProfile?.city || 'Pokhara',
    country: hotelProfile?.country || 'Nepal',
    phone: hotelProfile?.phone || '+977-61-460123',
    email: hotelProfile?.email || 'billing@auragrand.com',
    taxId: hotelProfile?.taxId || 'PAN-601948203',
    vatNumber: hotelProfile?.gstVatNumber || 'VAT-10928374',
    currency: hotelProfile?.currencySymbol || 'Rs.',
  };

  const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyBillNo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bill.billNumber);
      toast.success('Copied', `Bill #${bill.billNumber} copied to clipboard.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            TOP BAR: Title, Layout Switcher & Actions (Hidden during print)
            ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#DCE3DF] dark:border-[#145447] bg-[#F8FAF9] dark:bg-[#07241E] print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black font-mono text-[#24352F] dark:text-white">
                  {bill.billNumber}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyBillNo}
                  title="Copy Bill Number"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Generated {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Document Layout Mode Tabs */}
            <div className="flex items-center bg-white dark:bg-[#0A2E26] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setLayoutOverride('AUTO')}
                className={cn(
                  'px-2 py-0.5 rounded-[2px] font-semibold transition-colors',
                  layoutOverride === 'AUTO'
                    ? 'bg-[#0B3D32] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3D32]'
                )}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setLayoutOverride('POS')}
                className={cn(
                  'px-2 py-0.5 rounded-[2px] font-semibold transition-colors',
                  layoutOverride === 'POS'
                    ? 'bg-[#0B3D32] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3D32]'
                )}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setLayoutOverride('RESTAURANT')}
                className={cn(
                  'px-2 py-0.5 rounded-[2px] font-semibold transition-colors',
                  layoutOverride === 'RESTAURANT'
                    ? 'bg-[#0B3D32] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3D32]'
                )}
              >
                Dining Bill
              </button>
              <button
                type="button"
                onClick={() => setLayoutOverride('HOTEL')}
                className={cn(
                  'px-2 py-0.5 rounded-[2px] font-semibold transition-colors',
                  layoutOverride === 'HOTEL'
                    ? 'bg-[#0B3D32] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3D32]'
                )}
              >
                Hotel Invoice
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#0B3D32] hover:bg-[#124D40] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Reprint</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            MODAL BODY: Render Chosen Document Layout
            ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#071F1A]">
          {/* Print Stylesheet Hook */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-bill-document,
              #printable-bill-document * {
                visibility: visible !important;
              }
              #printable-bill-document {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 16px !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}</style>

          <div
            id="printable-bill-document"
            className="mx-auto bg-white text-slate-900 border border-slate-200 shadow-sm rounded p-5 sm:p-7 select-text"
          >
            {/* -------------------------------------------------------------
                LAYOUT 1: QUICK BILL / COUNTER POS RECEIPT (Thermal style)
                ------------------------------------------------------------- */}
            {activeLayout === 'POS' && (
              <div className="max-w-xs mx-auto font-mono text-xs leading-relaxed space-y-3">
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <h2 className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                    {hotel.name}
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">{hotel.address}</p>
                  <p className="text-[10px] text-slate-600">
                    Tel: {hotel.phone} · PAN: {hotel.taxId}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase mt-1">
                    *** CUSTOMER CASH RECEIPT ***
                  </p>
                </div>

                <div className="flex justify-between text-[11px] pt-1 border-b border-dashed border-slate-200 pb-1.5">
                  <div>
                    <div><strong>Bill #:</strong> {bill.billNumber}</div>
                    {bill.orderNumber && <div><strong>Order:</strong> {bill.orderNumber}</div>}
                    <div><strong>Cashier:</strong> {bill.serverOrStaff || 'Counter'}</div>
                  </div>
                  <div className="text-right">
                    <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                    <div>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {bill.customerName && <div>Guest: {bill.customerName}</div>}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-left">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center w-8">Qty</th>
                      <th className="py-1 text-right w-14">Rate</th>
                      <th className="py-1 text-right w-16">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-1 font-sans">{it.name}</td>
                        <td className="py-1 text-center">{it.quantity}</td>
                        <td className="py-1 text-right">{it.unitPrice.toFixed(2)}</td>
                        <td className="py-1 text-right font-bold">{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-slate-800 pt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {bill.subtotal.toFixed(2)}</span>
                  </div>
                  {bill.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Discount ({bill.discountPercent}%):</span>
                      <span>-Rs. {bill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {bill.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>Rs. {bill.serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {bill.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>Rs. {bill.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-400">
                    <span>GRAND TOTAL:</span>
                    <span>Rs. {bill.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-dashed border-slate-200">
                    <span>Amount Paid ({bill.paymentMethod}):</span>
                    <span>Rs. {bill.amountPaid.toFixed(2)}</span>
                  </div>
                  {bill.balanceDue > 0 ? (
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>BALANCE DUE:</span>
                      <span>Rs. {bill.balanceDue.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>STATUS:</span>
                      <span>PAID IN FULL</span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-dashed border-slate-300">
                  <p>Thank you for choosing {hotel.name}!</p>
                  <p>Reprint: Permanent Record #{bill.billNumber}</p>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 2: RESTAURANT ITEMIZED DINING BILL
                ------------------------------------------------------------- */}
            {activeLayout === 'RESTAURANT' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Header */}
                <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <UtensilsCrossed className="w-4 h-4" />
                      <span className="tracking-wider uppercase text-sm font-heading">{hotel.name} Fine Dining</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{hotel.address} · Tel: {hotel.phone}</p>
                    <p className="text-[10px] text-slate-400">VAT Reg: {hotel.vatNumber} · PAN: {hotel.taxId}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      Restaurant Tax Bill
                    </span>
                    <h3 className="font-mono font-bold text-sm text-slate-900 mt-1">{bill.billNumber}</h3>
                    <p className="text-[10px] text-slate-500">{formattedDate}</p>
                  </div>
                </div>

                {/* Dining Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Table / Outlet</span>
                    <strong className="text-slate-800 font-semibold">
                      {bill.tableNumber ? `Table ${bill.tableNumber}` : bill.roomNumber ? `Room ${bill.roomNumber}` : 'Dine-In / Walk-In'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order #</span>
                    <strong className="text-slate-800 font-semibold">{bill.orderNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Server / Staff</span>
                    <strong className="text-slate-800 font-semibold">{bill.serverOrStaff || 'Front Staff'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Guest</span>
                    <strong className="text-slate-800 font-semibold truncate block">
                      {bill.customerName || 'Restaurant Guest'}
                    </strong>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      <th className="p-2 border-b">Particulars / Dish</th>
                      <th className="p-2 border-b text-center w-12">Qty</th>
                      <th className="p-2 border-b text-right w-20">Rate</th>
                      <th className="p-2 border-b text-right w-24">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-medium text-slate-900">
                          {it.name}
                          {it.notes && <span className="text-[10px] text-slate-400 block italic">({it.notes})</span>}
                        </td>
                        <td className="p-2 text-center">{it.quantity}</td>
                        <td className="p-2 text-right text-slate-600">Rs. {it.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-slate-900">Rs. {it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Dining Totals Grid */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                  <div className="text-[11px] text-slate-500 space-y-1 sm:max-w-xs">
                    <p><strong>Payment Method:</strong> {bill.paymentMethod}</p>
                    {bill.notes && <p><strong>Notes:</strong> {bill.notes}</p>}
                    <p className="italic text-[10px] text-slate-400 pt-2">
                      All food and beverages are inclusive of state hospitality duties. Thank you for dining with us!
                    </p>
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>Rs. {bill.subtotal.toFixed(2)}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount ({bill.discountPercent}%):</span>
                        <span>-Rs. {bill.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.serviceCharge > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Service Charge:</span>
                        <span>Rs. {bill.serviceCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>VAT / Tax (10%):</span>
                        <span>Rs. {bill.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-300">
                      <span>Grand Total:</span>
                      <span>Rs. {bill.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200 text-[11px]">
                      <span>Amount Paid:</span>
                      <span>Rs. {bill.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t-2 border-slate-300">
                      <span>Balance Due:</span>
                      <span className={bill.balanceDue > 0 ? 'text-rose-600 font-mono' : 'text-emerald-700'}>
                        Rs. {bill.balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-between items-end border-t border-slate-200 text-[10px] text-slate-400">
                  <div className="border-t border-slate-300 pt-1 w-36 text-center">
                    Guest Signature
                  </div>
                  <div className="border-t border-slate-300 pt-1 w-36 text-center">
                    Authorized Cashier
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 3: HOTEL CHECKOUT TAX INVOICE
                ------------------------------------------------------------- */}
            {activeLayout === 'HOTEL' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Formal Letterhead */}
                <div className="flex items-start justify-between border-b pb-4 border-slate-300">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-[#0B3D32] text-white shrink-0">
                      <Hotel className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-base text-[#0B3D32] uppercase tracking-wide">
                        {hotel.name}
                      </h2>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {hotel.address}, {hotel.city}, {hotel.country}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Phone: {hotel.phone} · Email: {hotel.email}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        PAN: <strong>{hotel.taxId}</strong> · VAT Reg No: <strong>{hotel.vatNumber}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#0B3D32] text-white font-bold text-[10px] uppercase tracking-wider">
                      Tax Invoice
                    </span>
                    <h3 className="font-mono font-bold text-base text-slate-900 mt-1">
                      {bill.billNumber}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Date: {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                    {bill.bookingCode && (
                      <p className="text-[10px] font-mono text-slate-600">
                        Stay Folio: <strong>{bill.bookingCode}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Guest & Stay Folio Details Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-slate-50 border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Guest Name
                    </span>
                    <span className="font-bold text-slate-900 block truncate">
                      {bill.customerName || 'Registered Guest'}
                    </span>
                    {bill.customerPhone && (
                      <span className="text-[10px] text-slate-500 block">{bill.customerPhone}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Room Number
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {bill.roomNumber ? `Room ${bill.roomNumber}` : 'Hotel Stay'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Deluxe Category</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Stay Reference
                    </span>
                    <span className="font-mono font-bold text-slate-900 block">
                      {bill.bookingCode || 'BK-STAY'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Status: Checked Out</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Billed By
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {bill.serverOrStaff || 'Front Desk Lead'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Duty Cashier</span>
                  </div>
                </div>

                {/* Folio Line Items Table */}
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center">
                    <span>Stay Folio Ledger & Room Services Breakdown</span>
                    <span>All Amounts in NPR (Rs.)</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="p-2 w-8">#</th>
                        <th className="p-2">Description / Folio Item</th>
                        <th className="p-2 w-28">Outlet / Department</th>
                        <th className="p-2 text-center w-12">Qty</th>
                        <th className="p-2 text-right w-20">Unit Rate</th>
                        <th className="p-2 text-right w-24">Total (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-medium text-slate-900">
                            {it.name}
                            {it.notes && (
                              <span className="text-[10px] text-slate-400 block italic">({it.notes})</span>
                            )}
                          </td>
                          <td className="p-2 text-[10px] font-mono text-slate-500">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold">
                              {it.category || 'ROOM_CHARGE'}
                            </span>
                          </td>
                          <td className="p-2 text-center">{it.quantity}</td>
                          <td className="p-2 text-right text-slate-600">{it.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">{it.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Payment History Ledger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Payments Recorded Ledger */}
                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block border-b pb-1">
                      Recorded Payment Transactions
                    </span>
                    {payments.length > 0 ? (
                      <div className="space-y-1">
                        {payments.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-700">
                            <div>
                              <span className="font-semibold">{p.paymentMethod}</span>
                              {p.transactionRef && (
                                <span className="text-[10px] text-slate-400 ml-1">({p.transactionRef})</span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-emerald-700">
                              Rs. {p.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[10px]">No advance payments recorded.</p>
                    )}
                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                      Payment Status: <strong className="uppercase">{bill.paymentStatus}</strong>
                    </div>
                  </div>

                  {/* Calculations Box */}
                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Billed Charges:</span>
                      <span className="font-mono font-semibold">Rs. {bill.subtotal.toFixed(2)}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Folio Courtesy Discount:</span>
                        <span className="font-mono">-Rs. {bill.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Govt. VAT / Hospitality Tax (10%):</span>
                        <span className="font-mono">Rs. {bill.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[#0B3D32] pt-1.5 border-t border-slate-300">
                      <span>Grand Invoiced Total:</span>
                      <span className="font-mono">Rs. {bill.grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200 text-[11px]">
                      <span>Total Payments Collected:</span>
                      <span className="font-mono font-bold">Rs. {bill.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t-2 border-slate-400">
                      <span className="text-slate-900">Remaining Balance:</span>
                      <span className={cn('font-mono', bill.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700')}>
                        Rs. {bill.balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal Tax Notes & Signatures */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-3">
                  <p className="italic">
                    I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company, or association fails to pay for any part of the full amount of these charges.
                  </p>
                  <div className="flex justify-between items-end pt-4">
                    <div className="border-t border-slate-400 pt-1 w-44 text-center">
                      Guest Signature
                    </div>
                    <div className="border-t border-slate-400 pt-1 w-44 text-center">
                      Front Desk Manager / Auditor
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            MODAL FOOTER: Summary & Quick Actions
            ===================================================================== */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#DCE3DF] dark:border-[#145447] bg-[#F8FAF9] dark:bg-[#07241E] print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-[2px]',
                bill.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : bill.paymentStatus === 'PARTIAL'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              )}
            >
              Status: {bill.paymentStatus}
            </span>

            {bill.balanceDue > 0 && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Due: Rs. {bill.balanceDue.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {bill.balanceDue > 0 && onOpenRecordPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(bill);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#0B3D32] hover:bg-[#124D40] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Reprint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useRef } from 'react';
import { X, Printer, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { QuickBillRecord, formatSourceName } from '@/lib/quickBillingData';
import { formatCurrency, cn } from '@/lib/utils';

export interface QuickBillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: QuickBillRecord | null;
  isProforma?: boolean;
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  hotelPan?: string;
}

export const QuickBillReceiptModal: React.FC<QuickBillReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  isProforma = false,
  hotelName = 'Aura Grand Resort & Restaurant',
  hotelAddress = 'Lakeside-6, Pokhara, Nepal',
  hotelPhone = '+977 61-465890',
  hotelPan = '302489112',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVatBill = bill.billType === 'VAT' && !isProforma;
  const isPaid = bill.status === 'PAID';

  // Group items by round number for transparent order timeline
  const roundsMap = new Map<number, typeof bill.items>();
  bill.items.forEach((item) => {
    const r = item.roundNumber || 1;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r)!.push(item);
  });
  const sortedRounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-[#071F1A] rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[3px]",
              isProforma ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-[#0B3D32]/10 text-[#0B3D32] dark:bg-emerald-950/70 dark:text-emerald-300"
            )}>
              {isProforma ? <AlertTriangle className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#24352F] dark:text-white font-heading uppercase tracking-wide">
                {isProforma ? 'Proforma Bill Preview' : isVatBill ? 'Tax Invoice (VAT)' : 'Payment Receipt'}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {bill.masterBillNumber} {bill.vatInvoiceNumber ? `· ${bill.vatInvoiceNumber}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/60 dark:bg-[#051713]/60">
          <div
            ref={printRef}
            className={cn(
              "relative bg-white text-slate-900 p-6 rounded-[2px] border border-dashed border-slate-300 shadow-xs font-mono text-[11px] leading-relaxed mx-auto max-w-[340px]",
              isProforma && "border-amber-300"
            )}
          >
            {/* Proforma Watermark */}
            {isProforma && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-12 z-0">
                <span className="text-4xl font-extrabold text-amber-900 uppercase rotate-[-35deg] tracking-widest border-4 border-amber-900 p-3">
                  PROFORMA BILL
                </span>
              </div>
            )}

            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 relative z-10">
              <h2 className="text-sm font-extrabold tracking-tight uppercase text-slate-950 font-sans">
                {hotelName}
              </h2>
              <p className="text-[10px] text-slate-600">{hotelAddress}</p>
              <p className="text-[10px] text-slate-600">Tel: {hotelPhone}</p>
              <p className="text-[10px] font-bold text-slate-700">PAN / VAT: {hotelPan}</p>

              {/* Title Badge */}
              <div className="mt-2 pt-1 border-t border-dotted border-slate-300">
                {isProforma ? (
                  <div className="bg-amber-50 text-amber-900 border border-amber-300 py-1 px-2 rounded text-[10px] font-black uppercase tracking-wider">
                    ⚠️ PROFORMA BILL – NOT A TAX INVOICE
                  </div>
                ) : isVatBill ? (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 py-1 px-2 rounded text-[10px] font-black uppercase tracking-wider">
                    TAX INVOICE (VAT)
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-900 py-0.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider">
                    RESTAURANT SALES RECEIPT
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px] relative z-10">
              <div className="flex justify-between">
                <span className="text-slate-500">Master Bill #:</span>
                <span className="font-bold text-slate-900">{bill.masterBillNumber}</span>
              </div>
              {bill.vatInvoiceNumber && (
                <div className="flex justify-between bg-emerald-50/70 px-1 py-0.5 rounded text-emerald-950">
                  <span className="font-bold">VAT Invoice #:</span>
                  <span className="font-extrabold">{bill.vatInvoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Token / Customer:</span>
                <span className="font-bold text-slate-900">{bill.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span>{formatSourceName(bill.source)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>
                  {new Date(bill.openedAt).toLocaleDateString('en-GB')}{' '}
                  {new Date(bill.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {bill.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold">{bill.customerName}</span>
                </div>
              )}
              {bill.customerPan && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer PAN:</span>
                  <span className="font-mono font-bold">{bill.customerPan}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Staff / Cashier:</span>
                <span>{bill.staffUser}</span>
              </div>
            </div>

            {/* Itemized Table Grouped by Rounds */}
            <div className="py-2 border-b border-dashed border-slate-300 relative z-10">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200 uppercase text-slate-600">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt</span>
              </div>

              <div className="divide-y divide-dotted divide-slate-200 mt-1">
                {sortedRounds.map((roundNum) => {
                  const roundItems = roundsMap.get(roundNum) || [];
                  const firstTime = roundItems[0]?.addedAt ? new Date(roundItems[0].addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={roundNum} className="py-1">
                      {sortedRounds.length > 1 && (
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider py-0.5 bg-slate-50 px-1 rounded flex justify-between">
                          <span>Round {roundNum}</span>
                          <span>{firstTime}</span>
                        </div>
                      )}
                      {roundItems.map((item) => (
                        <div key={item.id} className="py-1 text-[10.5px]">
                          <div className="flex justify-between font-medium">
                            <span className="w-1/2 pr-1 truncate font-semibold">{item.name}</span>
                            <span className="w-1/6 text-center text-slate-700">{item.quantity}</span>
                            <span className="w-1/6 text-right text-slate-600">{item.unitPrice}</span>
                            <span className="w-1/6 text-right font-bold text-slate-900">{item.total}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[9px] text-slate-500 italic pl-1">↳ {item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px] relative z-10">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({bill.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-semibold">रू {bill.subtotal.toFixed(2)}</span>
              </div>

              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Discount {bill.discountPercent > 0 ? `(${bill.discountPercent}%)` : ''}:</span>
                  <span className="font-semibold">-रू {bill.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {isVatBill && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <span>रू {bill.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>VAT (13%):</span>
                    <span>+रू {bill.vatAmount.toFixed(2)}</span>
                  </div>
                </>
              )}

              {bill.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Round Off:</span>
                  <span>{bill.roundOff > 0 ? `+रू ${bill.roundOff.toFixed(2)}` : `-रू ${Math.abs(bill.roundOff).toFixed(2)}`}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1 border-t border-slate-300 font-sans">
                <span>NET PAYABLE:</span>
                <span>रू {bill.grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Settlement Information */}
              {isPaid ? (
                <div className="pt-2 mt-1 border-t border-dotted border-slate-200 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{bill.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tendered / Paid:</span>
                    <span className="font-semibold">रू {bill.paidAmount.toFixed(2)}</span>
                  </div>
                  {bill.changeDue > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Change Returned:</span>
                      <span className="font-bold">रू {bill.changeDue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Settled At:</span>
                    <span>
                      {bill.paidAt ? new Date(bill.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 mt-1 border-t border-dotted border-amber-300 text-center text-[10px] text-amber-900 font-bold bg-amber-50 py-1 rounded">
                  ⚠️ PAYMENT PENDING · FINAL RECEIPT ISSUED UPON SETTLEMENT
                </div>
              )}
            </div>

            {/* Footer Disclaimer & Barcode simulation */}
            <div className="text-center pt-3 text-[9px] text-slate-500 space-y-1 relative z-10">
              <p className="font-semibold text-slate-700">Thank you for dining with us!</p>
              <p>Please visit again</p>
              <div className="pt-1 flex items-center justify-center gap-1 text-[8px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>Audited POS Record · Sequence-Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[3px] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer",
                isProforma
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#0B3D32] hover:bg-[#082e25] dark:bg-emerald-600 dark:hover:bg-emerald-500"
              )}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isProforma ? 'Print Proforma' : 'Print Bill Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


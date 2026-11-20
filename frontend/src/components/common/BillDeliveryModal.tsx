'use client';

import React, { useState } from 'react';
import { X, Printer, MessageCircle, Mail, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export interface BillDeliveryData {
  orderNumber: string;
  receiptNumber: string;
  invoiceDate: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  restaurantName?: string;
  items?: { productName: string; quantity: number; unitPrice: number; total: number }[];
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  serviceCharge?: number;
}

interface BillDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BillDeliveryData | null;
  onPrint: () => void;
  onDownloadPdf: () => void;
}

export const BillDeliveryModal: React.FC<BillDeliveryModalProps> = ({
  isOpen,
  onClose,
  data,
  onPrint,
  onDownloadPdf,
}) => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const restaurantName = data.restaurantName || 'Restaurant';

  const handleDownloadPdf = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/bill-delivery/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: data.orderNumber, restaurantName: data.restaurantName }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to browser print
      onDownloadPdf();
    }
  };

  const handleEmailSend = async (email: string) => {
    if (!data) return;
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`/api/bill-delivery/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: data.orderNumber, email, restaurantName: data.restaurantName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed');
      setEmailStatus('Email sent successfully');
    } catch (e: any) {
      setEmailStatus(e?.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };
  const handleWhatsApp = () => {
    const phone = whatsappNumber.trim() || data.customerPhone?.trim() || '';
    if (!phone) {
      setShowWhatsappInput(true);
      return;
    }
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(
      `Thank you for visiting ${restaurantName}. Your bill ${data.receiptNumber} for NPR ${data.total.toFixed(2)} is ready. Thank you!`
    );
    const url = `https://wa.me/${cleaned}?text=${message}`;
    window.open(url, '_blank');
    setShowWhatsappInput(false);
  };

  const handleEmail = async () => {
    const email = emailAddress.trim() || data?.customerEmail?.trim() || '';
    if (!email) {
      setShowEmailInput(true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('Invalid email address');
      return;
    }
    await handleEmailSend(email);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071F1A] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Bill Generated Successfully</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Bill Details */}
        <div className="bg-slate-50 dark:bg-[#061D18] rounded-md p-3 space-y-1.5 text-xs border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Invoice No:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{data.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Date/Time:</span>
            <span className="font-medium text-slate-900 dark:text-white">{data.invoiceDate}</span>
          </div>
          {data.customerName && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total Amount:</span>
            <span className="font-bold text-slate-900 dark:text-white">NPR {data.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
            <span className="font-medium text-slate-900 dark:text-white">{data.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Payment Status:</span>
            <span className="font-medium text-green-600">{data.paymentStatus}</span>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Delivery Options:</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Print */}
            <button
              onClick={onPrint}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#061D18] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              Print Bill
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => {
                if (data.customerPhone) {
                  handleWhatsApp();
                } else {
                  setShowWhatsappInput(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            {/* Email */}
            <button
              onClick={() => {
                if (data.customerEmail) {
                  handleEmail();
                } else {
                  setShowEmailInput(true);
                }
              }}
              disabled={isSendingEmail}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Email
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* WhatsApp Input */}
        {showWhatsappInput && (
          <div className="space-y-2 border-t pt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Number (with country code)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="flex-1 px-2.5 py-1.5 text-xs border rounded bg-white dark:bg-[#061D18] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
              <button
                onClick={handleWhatsApp}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700"
              >
                Share
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              WhatsApp will open — complete sharing manually. PDF not sent automatically.
            </p>
          </div>
        )}

        {/* Email Input */}
        {showEmailInput && (
          <div className="space-y-2 border-t pt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="customer@example.com"
                className="flex-1 px-2.5 py-1.5 text-xs border rounded bg-white dark:bg-[#061D18] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3D32]"
              />
              <button
                onClick={handleEmail}
                disabled={isSendingEmail}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
            {emailStatus && (
              <p className="text-[10px] text-slate-500">{emailStatus}</p>
            )}
          </div>
        )}

        {/* Status messages */}
        {emailStatus && !showEmailInput && (
          <p className="text-xs text-slate-500 border-t pt-2">{emailStatus}</p>
        )}
      </div>
    </div>
  );
};

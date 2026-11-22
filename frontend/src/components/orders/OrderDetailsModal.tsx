'use client';

import React from 'react';
import {
  X,
  Printer,
  FileText,
  ChefHat,
  Wine,
  Ban,
  Table2,
  BedDouble,
  Bike,
  ShoppingBag,
  Armchair,
} from 'lucide-react';
import { ActiveRestaurantOrderData, BillData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getOrderDepartmentInfo } from '@/components/common/ActiveOrdersView';

export interface OrderDetailsModalProps {
  isOpen: boolean;
  order: ActiveRestaurantOrderData | null;
  onClose: () => void;
  onPrintReceipt: (order: ActiveRestaurantOrderData) => void;
  onPrintKot?: (order: ActiveRestaurantOrderData) => void;
  onPrintBot?: (order: ActiveRestaurantOrderData) => void;
  onViewInvoice?: (bill: BillData | null, order: ActiveRestaurantOrderData) => void;
  onCancelOrder?: (order: ActiveRestaurantOrderData) => void;
}

export const formatNpr = (val: number) => {
  return `Rs. ${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDateDisplay = (dateStr: string | Date | undefined) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatTimeDisplay = (dateStr: string | Date | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatOrderType = (type?: string | null) => {
  if (!type) return 'Counter Sale';
  const upper = type.toUpperCase().trim();
  switch (upper) {
    case 'DINE_IN':
    case 'DINEIN':
      return 'Dine-in';
    case 'COUNTER_SALE':
    case 'COUNTERSALE':
    case 'COUNTER':
    case 'DIRECT':
    case 'QUICK_BILL':
    case 'NO_TABLE':
      return 'Counter Sale';
    case 'TAKEAWAY':
    case 'TAKE_AWAY':
      return 'Takeaway';
    case 'DELIVERY':
      return 'Delivery';
    case 'ROOM_SERVICE':
    case 'ROOMSERVICE':
      return 'Room Service';
    case 'ONLINE':
      return 'Online Order';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ');
  }
};

export const getPaymentStatusMeta = (order: {
  isPaid?: boolean;
  paymentMethod?: string | null;
  billPaymentStatus?: string | null;
  bill?: { paymentMethod?: string | null; paymentStatus?: string | null } | null;
}) => {
  const pMethod = (order.paymentMethod || order.bill?.paymentMethod || '').toUpperCase().trim();
  const effPayment = (order.billPaymentStatus || order.bill?.paymentStatus || (order.isPaid ? 'PAID' : 'UNPAID')).toUpperCase().trim();

  if (pMethod === 'ROOM_FOLIO' || effPayment === 'ROOM_FOLIO' || effPayment === 'CHARGED_TO_ROOM') {
    return {
      dot: 'bg-sky-500',
      text: 'text-sky-700 dark:text-sky-400',
      label: 'Charged to Room',
      key: 'ROOM_FOLIO',
    };
  }

  if (effPayment === 'PARTIAL' || effPayment === 'PARTIALLY_PAID') {
    return {
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Partially Paid',
      key: 'PARTIAL',
    };
  }

  if (effPayment === 'REFUNDED' || effPayment === 'VOID') {
    return {
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-400',
      label: 'Refunded',
      key: 'REFUNDED',
    };
  }

  if (order.isPaid || effPayment === 'PAID') {
    return {
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Paid',
      key: 'PAID',
    };
  }

  return {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    label: 'Unpaid',
    key: 'UNPAID',
  };
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  order,
  onClose,
  onPrintReceipt,
  onPrintKot,
  onPrintBot,
  onViewInvoice,
  onCancelOrder,
}) => {
  if (!isOpen || !order) return null;

  const dept = getOrderDepartmentInfo(order);

  // Status dot & color helpers
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED':
      case 'PENDING':
        return { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' };
      case 'PREPARING':
        return { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', label: 'Preparing' };
      case 'READY':
        return { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', label: 'Ready' };
      case 'SERVED':
        return { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', label: 'Served' };
      case 'BILLED':
      case 'COMPLETED':
        return { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'Completed' };
      case 'CANCELLED':
        return { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Cancelled' };
      default:
        return { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', label: status || 'Unknown' };
    }
  };

  const orderStatusMeta = getStatusColor(order.status);
  const paymentStatusMeta = getPaymentStatusMeta(order);

  // Source icon & label
  const renderSource = () => {
    if (order.table?.tableNumber) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <Table2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dine-in · Table {order.table.tableNumber}{order.table.section ? ` (${order.table.section})` : ''}</span>
        </span>
      );
    }
    if (order.room?.number) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <BedDouble className="w-3.5 h-3.5 text-sky-600" />
          <span>Room Service · Room {order.room.number}</span>
        </span>
      );
    }
    if (order.orderType === 'DELIVERY') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <Bike className="w-3.5 h-3.5 text-indigo-600" />
          <span>Delivery</span>
        </span>
      );
    }
    if (order.orderType === 'TAKEAWAY') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
          <span>Takeaway</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
        <Armchair className="w-3.5 h-3.5 text-purple-600" />
        <span>Counter Sale</span>
      </span>
    );
  };

  const subtotal = order.subtotal || 0;
  const orderDiscount = order.discountAmount || 0;
  const totalTax = order.tax || 0;
  const serviceCharge = order.serviceCharge || 0;
  const grandTotal = order.total || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              #{order.orderNumber}
            </h2>

            {/* Order Status */}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <span className={cn('w-1.5 h-1.5 rounded-full', orderStatusMeta.dot)} />
              <span className={orderStatusMeta.text}>{orderStatusMeta.label}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Payment Status */}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <span className={cn('w-1.5 h-1.5 rounded-full', paymentStatusMeta.dot)} />
              <span className={paymentStatusMeta.text}>{paymentStatusMeta.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintReceipt(order)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Compact Order Info Bar */}
        <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="block text-slate-400 text-[11px]">Date &amp; Time</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDateDisplay(order.createdAt)}{' '}
                <span className="text-slate-400 font-mono text-[11px]">
                  {formatTimeDisplay(order.createdAt)}
                </span>
              </span>
            </div>

            <div>
              <span className="block text-slate-400 text-[11px]">Order Type &amp; Source</span>
              <div>{renderSource()}</div>
            </div>

            <div>
              <span className="block text-slate-400 text-[11px]">Staff</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {order.serverName || 'Staff'}
              </span>
            </div>

            <div>
              <span className="block text-slate-400 text-[11px]">Payment Method</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {paymentStatusMeta.key === 'ROOM_FOLIO' ? 'Room Folio' : (order.paymentMethod || order.bill?.paymentMethod || (order.isPaid ? 'Cash' : 'Pending'))}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="p-5 space-y-4">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8F9FA] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200 dark:border-slate-700">#</th>
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Item Name</th>
                  <th className="py-2 px-2 w-16 text-center border-r border-slate-200 dark:border-slate-700">Dept</th>
                  <th className="py-2 px-2.5 w-12 text-center border-r border-slate-200 dark:border-slate-700">Qty</th>
                  <th className="py-2 px-3 w-24 text-right border-r border-slate-200 dark:border-slate-700">Price</th>
                  <th className="py-2 px-3 w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No items recorded.
                    </td>
                  </tr>
                ) : (
                  order.items?.map((it, idx) => {
                    const isCancelled = it.status === 'CANCELLED';
                    return (
                      <tr
                        key={it.id || idx}
                        className={cn(
                          'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                          isCancelled && 'line-through text-slate-400'
                        )}
                      >
                        <td className="py-2 px-2.5 text-center text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{it.productName}</span>
                          {it.notes && (
                            <span className="block text-[10px] text-slate-400 italic">{it.notes}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                          <span
                            className={cn(
                              it.department === 'BOT'
                                ? 'text-violet-700 dark:text-violet-400'
                                : 'text-amber-700 dark:text-amber-400'
                            )}
                          >
                            {it.department || 'KOT'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-medium border-r border-slate-200 dark:border-slate-700">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-700">
                          {formatNpr(it.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatNpr(it.total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Financial Summary Aligned Right */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formatNpr(subtotal)}</span>
              </div>

              {orderDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatNpr(orderDiscount)}</span>
                </div>
              )}

              {serviceCharge > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Service Charge:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatNpr(serviceCharge)}</span>
                </div>
              )}

              {totalTax > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT / Tax:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatNpr(totalTax)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-[#0B3D32] dark:text-emerald-400">{formatNpr(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-[#F8F9FA] dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            {dept.hasKot && onPrintKot && (
              <button
                type="button"
                onClick={() => onPrintKot(order)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Print KOT</span>
              </button>
            )}

            {dept.hasBot && onPrintBot && (
              <button
                type="button"
                onClick={() => onPrintBot(order)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
              >
                <Wine className="w-3.5 h-3.5 text-violet-600" />
                <span>Print BOT</span>
              </button>
            )}

            {(order.bill || order.status === 'BILLED' || order.status === 'COMPLETED') && onViewInvoice && (
              <button
                type="button"
                onClick={() => onViewInvoice(order.bill || null, order)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Invoice</span>
              </button>
            )}

            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && onCancelOrder && (
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import {
  X,
  History,
  Receipt,
  Printer,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  DollarSign,
  Loader2,
  Clock,
} from 'lucide-react';
import { TableItem } from '@/lib/tablesData';
import { cn } from '@/lib/utils';

export interface TableHistoryOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType?: string;
  total: number;
  subtotal: number;
  paidAmount?: number;
  isPaid: boolean;
  paymentMethod?: string;
  serverName?: string;
  createdAt: string;
  guestName?: string;
  itemsCount: number;
  items?: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface TableHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  history: TableHistoryOrder[];
  isLoading: boolean;
  onReprintOrder: (order: TableHistoryOrder) => void;
}

export const TableHistoryModal: React.FC<TableHistoryModalProps> = ({
  isOpen,
  onClose,
  table,
  history,
  isLoading,
  onReprintOrder,
}) => {
  if (!isOpen || !table) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#07241E] rounded-xl border border-slate-200 dark:border-[#145447] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#145447]/60 bg-slate-50/50 dark:bg-[#0B3D32]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Table {table.tableNumber}
                </h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {table.section}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order & Payment History (from central billing records)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Loading history records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Past Orders Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No historical billing records exist for Table {table.tableNumber}. Orders will appear here once settled or billed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((order) => {
                const isPaid = order.isPaid || order.status === 'PAID' || order.status === 'COMPLETED';
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#07241E] hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : order.status === 'BILLED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {order.guestName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {order.guestName}
                            </span>
                          )}
                          {order.paymentMethod && (
                            <span className="flex items-center gap-1 font-mono uppercase">
                              <CreditCard className="w-3.5 h-3.5" />
                              {order.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                          Rs. {Number(order.total || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {order.itemsCount || order.items?.length || 0} items
                        </div>
                      </div>
                    </div>

                    {/* Items brief */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        {order.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {item.quantity}x {item.productName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Server: {order.serverName || 'Staff'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onReprintOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 transition-colors border border-emerald-200 dark:border-emerald-800"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Reprint Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#145447]/60 bg-slate-50/50 dark:bg-[#0B3D32]/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

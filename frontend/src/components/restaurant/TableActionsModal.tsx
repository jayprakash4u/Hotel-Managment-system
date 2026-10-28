'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Receipt,
  Printer,
  CalendarCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wrench,
  Check,
  FileText,
  Users,
  Eye,
  History,
  Info,
  DollarSign,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { TableItem, calculateOrderItemTotal } from '@/lib/tablesData';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';

export interface TableActionsModalProps {
  table: TableItem | null;
  isOpen?: boolean;
  onClose: () => void;
  // Order actions
  onStartOrder?: (table: TableItem) => void;
  onAddItems?: (table: TableItem) => void;
  onViewOrder?: (table: TableItem) => void;
  onMarkServed?: (table: TableItem) => void;
  onViewOrderHistory?: (table: TableItem) => void;
  // Reservation actions
  onBookTable?: (table: TableItem) => void;
  onViewReservation?: (table: TableItem, reservation: any) => void;
  onEditReservation?: (table: TableItem, reservation: any) => void;
  onCancelReservation?: (table: TableItem, reservation: any) => void;
  onSeatGuests?: (table: TableItem, reservation: any) => void;
  // Billing actions
  onViewBill?: (table: TableItem) => void;
  onSettleBill?: (table: TableItem) => void;
  onPrintBill?: (table: TableItem) => void;
  onViewPaymentHistory?: (table: TableItem) => void;
  // Table management actions
  onUpdateCleaningStatus?: (table: TableItem, cleaningStatus: 'CLEAN' | 'DIRTY' | 'CLEANING') => void;
  onUpdateServiceStatus?: (table: TableItem, status: 'AVAILABLE' | 'OUT_OF_SERVICE', notes?: string) => void;
}

export const TableActionsDropdown: React.FC<TableActionsModalProps> = ({
  table,
  onClose,
  onStartOrder,
  onAddItems,
  onViewOrder,
  onMarkServed,
  onViewOrderHistory,
  onBookTable,
  onViewReservation,
  onEditReservation,
  onCancelReservation,
  onSeatGuests,
  onViewBill,
  onSettleBill,
  onPrintBill,
  onViewPaymentHistory,
  onUpdateCleaningStatus,
  onUpdateServiceStatus,
}) => {
  const toast = useToast();
  const [activeSubView, setActiveSubView] = useState<
    'NONE' | 'DETAILS' | 'MAINTENANCE_NOTES' | 'CONFIRM_OUT_OF_SERVICE' | 'CONFIRM_CANCEL_RES'
  >('NONE');
  const [maintenanceNotesInput, setMaintenanceNotesInput] = useState('');

  if (!table) return null;

  const isOccupied = table.status === 'OCCUPIED';
  const isAvailable = table.status === 'AVAILABLE';
  const isReserved = table.status === 'RESERVED';
  const isBilled = table.status === 'BILLED';
  const isOutOfService = table.status === 'OUT_OF_SERVICE';

  const cleaningStatus = table.cleaningStatus || 'CLEAN';
  const isClean = cleaningStatus === 'CLEAN';
  const isDirty = cleaningStatus === 'DIRTY' || cleaningStatus === 'CLEANING';

  const orderItems = table.orders || [];
  const hasActiveOrder = orderItems.length > 0 || isOccupied || isBilled;
  const orderTotal = orderItems.reduce(
    (sum, item) => sum + calculateOrderItemTotal(item).total,
    0
  );

  const activeRes = (table.upcomingReservations || []).find(
    (r: any) => r.status === 'CONFIRMED' || r.status === 'PENDING' || r.status === 'SEATED'
  );

  const { role } = useRole();

  // Role permissions
  const showOrderActions = role === 'ADMIN' || role === 'POS_CASHIER' || role === 'FRONT_DESK' || role === 'CHEF';
  const showReservationActions = role === 'ADMIN' || role === 'FRONT_DESK' || role === 'POS_CASHIER';
  const showBillingActions = role === 'ADMIN' || role === 'POS_CASHIER' || role === 'FINANCE_OFFICER';
  const showTableManagement = role === 'ADMIN' || role === 'HOUSEKEEPING' || role === 'POS_CASHIER' || role === 'FRONT_DESK';

  // Business Rules Checks
  const canStartOrder = isAvailable && isClean && !isReserved && !isOutOfService;
  const canSeatGuests = (isReserved || !!activeRes) && isClean && !isOutOfService;
  const canBookTable = !isOutOfService && !isReserved && !activeRes;
  const canMarkClean = !isOccupied;

  const handleMarkDirty = () => {
    onClose();
    onUpdateCleaningStatus?.(table, 'DIRTY');
    toast.info(`Table ${table.tableNumber} Marked Dirty`, 'Housekeeping needed before seating new guests.');
  };

  const handleMarkCleaned = () => {
    onClose();
    if (!canMarkClean) {
      toast.warning('Action Blocked', 'Cannot mark an occupied table clean while guests are dining.');
      return;
    }
    onUpdateCleaningStatus?.(table, 'CLEAN');
    toast.success(`Table ${table.tableNumber} Cleaned`, 'Table is sanitised and ready for service.');
  };

  const handleConfirmOutOfService = () => {
    onClose();
    onUpdateServiceStatus?.(table, 'OUT_OF_SERVICE', maintenanceNotesInput.trim() || 'Scheduled maintenance');
    toast.warning(`Table ${table.tableNumber} Out of Service`, 'Table blocked from orders & reservations.');
  };

  const handleReturnToService = () => {
    onClose();
    onUpdateServiceStatus?.(table, 'AVAILABLE');
    toast.success(`Table ${table.tableNumber} Returned to Service`, `Table is now active (${cleaningStatus}).`);
  };

  // Helper row renderer: clean, monochrome, simple (no rainbow colors)
  const renderOptionRow = ({
    icon: Icon,
    label,
    rightText,
    onClick,
    disabled = false,
    disabledReason,
    danger = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    rightText?: string;
    onClick?: () => void;
    disabled?: boolean;
    disabledReason?: string;
    danger?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) {
          onClick();
        }
      }}
      title={disabled ? disabledReason : undefined}
      className={cn(
        'w-full px-3 py-2 flex items-center justify-between text-left border-b border-white/10 last:border-b-0 transition-colors select-none',
        disabled
          ? 'opacity-35 cursor-not-allowed bg-black/10'
          : danger
          ? 'hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-rose-400 cursor-pointer group'
          : 'hover:bg-white/10 active:bg-white/15 text-slate-200 hover:text-white cursor-pointer group'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-1">
        <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-white transition-colors" />
        <span className="text-[12px] font-medium truncate">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 font-mono">
        {rightText && <span>{rightText}</span>}
        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>
    </button>
  );

  return (
    <>
      {/* Transparent Click-Outside Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Clean, Simple Dropdown Box Positioned Just Below 3 Dots */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-full mt-1 w-44 sm:w-48 rounded-md bg-[#0C1815] text-white border border-white/15 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 select-none divide-y divide-white/10 text-left"
      >
        {/* Options Body */}
        <div className="overflow-y-auto max-h-[300px] divide-y divide-white/10 custom-scrollbar">
          {activeSubView === 'NONE' ? (
            <>
              {/* Housekeeping Role */}
              {role === 'HOUSEKEEPING' ? (
                <>
                  {isDirty &&
                    renderOptionRow({
                      icon: Sparkles,
                      label: 'Mark Cleaned',
                      onClick: handleMarkCleaned,
                    })}
                  {isClean &&
                    renderOptionRow({
                      icon: AlertCircle,
                      label: 'Mark Dirty',
                      onClick: handleMarkDirty,
                    })}
                  {isOutOfService &&
                    renderOptionRow({
                      icon: Check,
                      label: 'Return to Service',
                      onClick: handleReturnToService,
                    })}
                  {renderOptionRow({
                    icon: Info,
                    label: 'Table Details',
                    onClick: () => setActiveSubView('DETAILS'),
                  })}
                </>
              ) : (
                <>
                  {/* OCCUPIED / HAS ACTIVE ORDER */}
                  {(isOccupied || hasActiveOrder) && (
                    <>
                      {showOrderActions &&
                        renderOptionRow({
                          icon: Plus,
                          label: 'Add Items',
                          onClick: () => {
                            onClose();
                            onAddItems?.(table);
                          },
                        })}

                      {showOrderActions &&
                        renderOptionRow({
                          icon: Eye,
                          label: 'View Order',
                          rightText: `${orderItems.length} items`,
                          onClick: () => {
                            onClose();
                            onViewOrder?.(table);
                          },
                        })}

                      {showBillingActions &&
                        renderOptionRow({
                          icon: DollarSign,
                          label: 'Record Payment',
                          rightText: orderTotal > 0 ? `Rs. ${orderTotal.toFixed(0)}` : undefined,
                          onClick: () => {
                            onClose();
                            onSettleBill?.(table);
                          },
                        })}

                      {showBillingActions &&
                        renderOptionRow({
                          icon: Printer,
                          label: 'Print Bill',
                          onClick: () => {
                            onClose();
                            onPrintBill?.(table);
                          },
                        })}

                      {showOrderActions &&
                        renderOptionRow({
                          icon: CheckCircle2,
                          label: 'Mark Served',
                          onClick: () => {
                            onClose();
                            onMarkServed?.(table);
                          },
                        })}

                      {showTableManagement && isClean &&
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })}

                      {renderOptionRow({
                        icon: History,
                        label: 'Order History',
                        onClick: () => {
                          onClose();
                          onViewOrderHistory?.(table);
                        },
                      })}
                    </>
                  )}

                  {/* AVAILABLE TABLE */}
                  {isAvailable && !hasActiveOrder && (
                    <>
                      {showOrderActions &&
                        renderOptionRow({
                          icon: UtensilsCrossed,
                          label: 'Start Order',
                          disabled: !canStartOrder,
                          disabledReason: 'Clean table before starting order',
                          onClick: () => {
                            onClose();
                            onStartOrder?.(table);
                          },
                        })}

                      {showReservationActions &&
                        renderOptionRow({
                          icon: Calendar,
                          label: 'Book Now',
                          disabled: !canBookTable,
                          onClick: () => {
                            onClose();
                            onBookTable?.(table);
                          },
                        })}

                      {showTableManagement && isDirty && (
                        renderOptionRow({
                          icon: Sparkles,
                          label: 'Mark Cleaned',
                          onClick: handleMarkCleaned,
                        })
                      )}

                      {showTableManagement && isClean && (
                        renderOptionRow({
                          icon: AlertCircle,
                          label: 'Mark Dirty',
                          onClick: handleMarkDirty,
                        })
                      )}

                      {showTableManagement && (
                        renderOptionRow({
                          icon: Wrench,
                          label: 'Out of Service',
                          onClick: () => setActiveSubView('CONFIRM_OUT_OF_SERVICE'),
                        })
                      )}
                    </>
                  )}

                  {/* RESERVED TABLE */}
                  {isReserved && !isOccupied && (
                    <>
                      {showReservationActions &&
                        renderOptionRow({
                          icon: Users,
                          label: 'Seat Guests',
                          disabled: !canSeatGuests,
                          disabledReason: 'Clean table before seating guests',
                          onClick: () => {
                            onClose();
                            onSeatGuests?.(table, activeRes);
                          },
                        })}

                      {activeRes && showReservationActions && (
                        <>
                          {renderOptionRow({
                            icon: CalendarCheck,
                            label: 'View Reservation',
                            rightText: `${activeRes.partySize}p`,
                            onClick: () => {
                              onClose();
                              onViewReservation?.(table, activeRes);
                            },
                          })}

                          {renderOptionRow({
                            icon: FileText,
                            label: 'Edit Reservation',
                            onClick: () => {
                              onClose();
                              onEditReservation?.(table, activeRes);
                            },
                          })}

                          {renderOptionRow({
                            icon: AlertCircle,
                            label: 'Cancel Reservation',
                            danger: true,
                            onClick: () => setActiveSubView('CONFIRM_CANCEL_RES'),
                          })}
                        </>
                      )}
                    </>
                  )}

                  {/* BILLED TABLE */}
                  {isBilled && (
                    <>
                      {showBillingActions &&
                        renderOptionRow({
                          icon: DollarSign,
                          label: 'Record Payment',
                          rightText: `Rs. ${orderTotal.toFixed(0)}`,
                          onClick: () => {
                            onClose();
                            onSettleBill?.(table);
                          },
                        })}

                      {showBillingActions &&
                        renderOptionRow({
                          icon: Receipt,
                          label: 'View Bill',
                          onClick: () => {
                            onClose();
                            onViewBill?.(table);
                          },
                        })}

                      {showBillingActions &&
                        renderOptionRow({
                          icon: Printer,
                          label: 'Print Bill',
                          onClick: () => {
                            onClose();
                            onPrintBill?.(table);
                          },
                        })}

                      {showOrderActions &&
                        renderOptionRow({
                          icon: Plus,
                          label: 'Add Items',
                          onClick: () => {
                            onClose();
                            onAddItems?.(table);
                          },
                        })}
                    </>
                  )}

                  {/* OUT OF SERVICE */}
                  {isOutOfService && (
                    <>
                      {showTableManagement &&
                        renderOptionRow({
                          icon: Check,
                          label: 'Return to Service',
                          onClick: handleReturnToService,
                        })}

                      {(table.maintenanceNotes || isOutOfService) &&
                        renderOptionRow({
                          icon: FileText,
                          label: 'Maintenance Notes',
                          onClick: () => setActiveSubView('MAINTENANCE_NOTES'),
                        })}
                    </>
                  )}

                  {/* Table Details */}
                  {renderOptionRow({
                    icon: Info,
                    label: 'Table Details',
                    onClick: () => setActiveSubView('DETAILS'),
                  })}
                </>
              )}
            </>
          ) : (
            /* Simple, Clean Subviews */
            <div className="p-2.5 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubView('NONE')}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>

              {/* DETAILS */}
              {activeSubView === 'DETAILS' && (
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Section:</span>
                    <span className="text-white font-medium">{table.section}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Capacity:</span>
                    <span className="text-white font-medium">{table.capacity}p</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-white font-medium">{table.status}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Cleanliness:</span>
                    <span className="text-white font-medium">{cleaningStatus}</span>
                  </div>
                  {orderTotal > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-mono font-medium">Rs. {orderTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* OUT OF SERVICE */}
              {activeSubView === 'CONFIRM_OUT_OF_SERVICE' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-300 font-medium block">
                    Mark Out of Service?
                  </span>
                  <input
                    type="text"
                    value={maintenanceNotesInput}
                    onChange={(e) => setMaintenanceNotesInput(e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full px-2 py-1 rounded bg-black/40 border border-white/20 text-white text-[11px] placeholder:text-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubView('NONE')}
                      className="px-2 py-0.5 rounded border border-white/20 text-slate-300 text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOutOfService}
                      className="px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-medium text-[10px]"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* MAINTENANCE NOTES */}
              {activeSubView === 'MAINTENANCE_NOTES' && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px]">Notes:</span>
                  <p className="p-2 rounded bg-black/40 border border-white/10 text-slate-300 text-[11px]">
                    {table.maintenanceNotes || 'No notes specified.'}
                  </p>
                </div>
              )}

              {/* CONFIRM CANCEL RESERVATION */}
              {activeSubView === 'CONFIRM_CANCEL_RES' && activeRes && (
                <div className="space-y-2">
                  <span className="text-slate-300 text-[11px] block">
                    Cancel {activeRes.customerName}?
                  </span>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSubView('NONE')}
                      className="px-2 py-0.5 rounded border border-white/20 text-slate-300 text-[10px]"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubView('NONE');
                        onClose();
                        onCancelReservation?.(table, activeRes);
                      }}
                      className="px-2.5 py-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-[10px]"
                    >
                      Cancel Res
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Backwards compatibility export
export const TableActionsModal: React.FC<TableActionsModalProps> = (props) => {
  return <TableActionsDropdown {...props} />;
};

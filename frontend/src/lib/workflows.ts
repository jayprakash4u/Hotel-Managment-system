// Domain Workflows & Finite State Machines (FSM) for Grand Hospitality Management System

// ============================================================================
// 1. RESERVATION STATE LIFECYCLE
// PENDING -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT -> COMPLETED
// Alternates: CANCELLED, NO_SHOW
// ============================================================================
export type ReservationState =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export const RESERVATION_TRANSITIONS: Record<ReservationState, ReservationState[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

// ============================================================================
// 2. ROOM STATE LIFECYCLE
// AVAILABLE -> RESERVED -> OCCUPIED -> DIRTY -> CLEANING -> AVAILABLE
// Out of Order: MAINTENANCE -> OUT_OF_SERVICE -> DIRTY -> AVAILABLE
// ============================================================================
export type RoomState =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'DIRTY'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export const ROOM_TRANSITIONS: Record<RoomState, RoomState[]> = {
  AVAILABLE: ['RESERVED', 'OCCUPIED', 'DIRTY', 'MAINTENANCE', 'OUT_OF_SERVICE'],
  RESERVED: ['OCCUPIED', 'AVAILABLE', 'CANCELLED' as any],
  OCCUPIED: ['DIRTY'], // Guest checkout moves room to DIRTY
  DIRTY: ['CLEANING', 'AVAILABLE'], // Housekeeping start
  CLEANING: ['AVAILABLE', 'DIRTY'], // Cleaned & inspected
  MAINTENANCE: ['DIRTY', 'OUT_OF_SERVICE', 'AVAILABLE'], // Repair resolved
  OUT_OF_SERVICE: ['MAINTENANCE', 'DIRTY', 'AVAILABLE'],
};

// ============================================================================
// 3. CAFE / RESTAURANT ORDER LIFECYCLE
// DRAFT -> CONFIRMED -> KITCHEN -> PREPARING -> READY -> SERVED -> COMPLETED
// Alternates: CANCELLED, VOIDED
// ============================================================================
export type CafeOrderState =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'VOIDED';

export const CAFE_ORDER_TRANSITIONS: Record<CafeOrderState, CafeOrderState[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['KITCHEN', 'CANCELLED'],
  KITCHEN: ['PREPARING', 'VOIDED'],
  PREPARING: ['READY', 'VOIDED'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  VOIDED: [],
};

// ============================================================================
// 4. FINANCIAL PAYMENT LIFECYCLE
// PENDING -> PARTIALLY_PAID -> PAID
// Alternates: REFUNDED, PARTIALLY_REFUNDED, FAILED, VOIDED
// ============================================================================
export type PaymentState =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED'
  | 'VOIDED';

export const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  PENDING: ['PARTIALLY_PAID', 'PAID', 'FAILED', 'VOIDED'],
  PARTIALLY_PAID: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  PAID: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  FAILED: ['PENDING'],
  VOIDED: [],
};

// ============================================================================
// 5. INVENTORY PURCHASE ORDER LIFECYCLE
// DRAFT -> ORDERED -> PARTIALLY_RECEIVED -> RECEIVED
// Alternates: CANCELLED
// ============================================================================
export type PurchaseOrderState =
  | 'DRAFT'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

// ============================================================================
// 6. HOUSEKEEPING TASK LIFECYCLE
// PENDING -> IN_PROGRESS -> INSPECTED -> COMPLETED
// ============================================================================
export type HousekeepingState = 'PENDING' | 'IN_PROGRESS' | 'INSPECTED' | 'COMPLETED';

// ============================================================================
// 7. MAINTENANCE TICKET LIFECYCLE
// OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
// ============================================================================
export type MaintenanceTicketState = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// ============================================================================
// WORKFLOW HELPER & VALIDATION FUNCTIONS
// ============================================================================

export function canTransitionReservation(from: ReservationState, to: ReservationState): boolean {
  return RESERVATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionRoom(from: RoomState, to: RoomState): boolean {
  return ROOM_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionCafeOrder(from: CafeOrderState, to: CafeOrderState): boolean {
  return CAFE_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionPayment(from: PaymentState, to: PaymentState): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

// Visual State Token Configurations
export const STATE_BADGE_CONFIGS = {
  // Reservation
  PENDING: { label: 'Pending Deposit', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
  CHECKED_IN: { label: 'Checked In (In-House)', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]' },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' },
  COMPLETED: { label: 'Stay Completed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
  CANCELLED: { label: 'Cancelled', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' },
  NO_SHOW: { label: 'No Show', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' },

  // Room
  AVAILABLE: { label: 'Available', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
  OCCUPIED: { label: 'Occupied', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]' },
  RESERVED: { label: 'Reserved', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' },
  DIRTY: { label: 'Cleaning Required', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
  CLEANING: { label: 'Cleaning in Progress', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] animate-pulse' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' },
  OUT_OF_SERVICE: { label: 'Out of order', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' },

  // Cafe Order
  DRAFT: { label: 'Draft Order', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]' },
  KITCHEN: { label: 'Sent to Kitchen', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]' },
  PREPARING: { label: 'Kitchen Preparing', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] animate-pulse' },
  READY: { label: 'Ready to Serve', color: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] font-bold' },
  SERVED: { label: 'Served to Table', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
  VOIDED: { label: 'Cancelled / Voided', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' },

  // Payment
  PAID: { label: 'Paid in Full', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' },
  REFUNDED: { label: 'Refunded', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' },
  FAILED: { label: 'Payment Failed', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' },
};

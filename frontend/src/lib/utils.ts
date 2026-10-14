import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ReservationStatusType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Room.amenities is stored as a JSON-encoded string in the DB; API routes that
// include a raw `room` relation must parse it before it reaches the frontend,
// which expects `amenities: string[]` (see RoomWithDetails / ReservationData).
export function parseAmenities(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return [raw];
  }
}

// Currency Formatter
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Date Formatter
export function formatDate(dateStringOrDate: string | Date | undefined | null): string {
  if (!dateStringOrDate) return 'N/A';
  try {
    const date = typeof dateStringOrDate === 'string' ? parseISO(dateStringOrDate) : dateStringOrDate;
    return format(date, 'MMM dd, yyyy');
  } catch {
    return String(dateStringOrDate);
  }
}

export function formatDateTime(dateStringOrDate: string | Date | undefined | null): string {
  if (!dateStringOrDate) return 'N/A';
  try {
    const date = typeof dateStringOrDate === 'string' ? parseISO(dateStringOrDate) : dateStringOrDate;
    return format(date, 'MMM dd, yyyy hh:mm a');
  } catch {
    return String(dateStringOrDate);
  }
}

export function formatRelativeTime(dateStringOrDate: string | Date | undefined | null): string {
  if (!dateStringOrDate) return 'N/A';
  try {
    const date = typeof dateStringOrDate === 'string' ? parseISO(dateStringOrDate) : dateStringOrDate;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return String(dateStringOrDate);
  }
}

// Status Badges & Semantic Operational Styling Tokens
export const ROOM_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40',
    dot: 'bg-[#16A34A]',
    badge: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    iconColor: 'text-[#166534]',
  },
  INSPECTED: {
    label: 'Inspected',
    color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40',
    dot: 'bg-[#16A34A]',
    badge: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    iconColor: 'text-[#166534]',
  },
  OCCUPIED: {
    label: 'Occupied',
    color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA] dark:border-[#1D4ED8]/40',
    dot: 'bg-[#2563EB]',
    badge: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
    iconColor: 'text-[#1D4ED8]',
  },
  RESERVED: {
    label: 'Reserved',
    color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC] dark:border-[#6D28D9]/40',
    dot: 'bg-[#7C3AED]',
    badge: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
    iconColor: 'text-[#6D28D9]',
  },
  CLEANING: {
    label: 'Cleaning',
    color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D] dark:border-[#92400E]/40',
    dot: 'bg-[#D97706]',
    badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    iconColor: 'text-[#92400E]',
  },
  DIRTY: {
    label: 'Cleaning',
    color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D] dark:border-[#92400E]/40',
    dot: 'bg-[#D97706]',
    badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    iconColor: 'text-[#92400E]',
  },
  OUT_OF_ORDER: {
    label: 'Out of order',
    color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171] dark:border-[#991B1B]/40',
    dot: 'bg-[#DC2626]',
    badge: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    iconColor: 'text-[#991B1B]',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8] dark:border-[#475569]/40',
    dot: 'bg-[#64748B]',
    badge: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    iconColor: 'text-[#475569]',
  },
};

export const VIP_CONFIG = {
  STANDARD: { label: 'Standard Guest', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]', discount: 0 },
  SILVER: { label: 'Silver VIP', color: 'bg-[#E8F2EE] text-[#0B3D32] border-[#CBD5D0]', discount: 0.05 },
  GOLD: { label: 'Gold VIP', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]', discount: 0.10 },
  PLATINUM: { label: 'Platinum VIP', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]', discount: 0.15 },
  DIAMOND: { label: 'Diamond Royal', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] shadow-xs', discount: 0.20 },
};

export const RESERVATION_STATUS_CONFIG: Record<ReservationStatusType, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D] dark:border-[#92400E]/40' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA] dark:border-[#1D4ED8]/40' },
  CHECKED_OUT: { label: 'Checked Out', color: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8] dark:border-[#475569]/40' },
  COMPLETED: { label: 'Completed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40' },
  CANCELLED: { label: 'Cancelled', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171] dark:border-[#991B1B]/40' },
  NO_SHOW: { label: 'No Show', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC] dark:border-[#6D28D9]/40' },
};

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA]' },
  RECEIVED: { label: 'Received', color: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA]' },
  ACCEPTED: { label: 'Accepted', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]' },
  PREPARING: { label: 'Preparing', color: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC]' },
  READY: { label: 'Ready to serve', color: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF]' },
  READY_TO_SERVE: { label: 'Ready to serve', color: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF]' },
  SERVED: { label: 'Served / Completed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]' },
  COMPLETED: { label: 'Completed', color: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]' },
  CANCELLED: { label: 'Cancelled', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171]' },
  VOIDED: { label: 'Cancelled / Voided', color: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171]' },
  DELAYED: { label: 'Delayed', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D]' },
};

// Unique Reference Generators
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RES-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateTicketCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MNT-${num}`;
}

export function generateInvoiceCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `INV-2026-${num}`;
}

// Turns a hotel name into a URL-safe slug for the public booking portal (/portal/[slug]).
// Callers should append a short random suffix on collision (see /api/platform/hotels).
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'hotel';
}

// Financial Billing Calculator
export interface FolioSummary {
  roomTotal: number;
  restaurantTotal: number;
  barTotal: number;
  spaTotal: number;
  roomServiceTotal: number;
  minibarTotal: number;
  otherTotal: number;
  subtotal: number;
  taxRate: number; // 0.10
  taxAmount: number;
  serviceChargeRate: number; // 0.05
  serviceChargeAmount: number;
  discountRate: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
}

export function calculateFolio(
  items: Array<{ outlet: string; total: number }>,
  paidAmount: number = 0,
  vipDiscountRate: number = 0
): FolioSummary {
  let roomTotal = 0;
  let restaurantTotal = 0;
  let barTotal = 0;
  let spaTotal = 0;
  let roomServiceTotal = 0;
  let minibarTotal = 0;
  let otherTotal = 0;

  for (const item of items) {
    switch (item.outlet) {
      case 'ROOM_CHARGE':
        roomTotal += item.total;
        break;
      case 'RESTAURANT':
        restaurantTotal += item.total;
        break;
      case 'ROOFTOP_BAR':
        barTotal += item.total;
        break;
      case 'ZENITH_SPA':
        spaTotal += item.total;
        break;
      case 'ROOM_SERVICE':
        roomServiceTotal += item.total;
        break;
      case 'MINIBAR':
        minibarTotal += item.total;
        break;
      default:
        otherTotal += item.total;
        break;
    }
  }

  const subtotal = roomTotal + restaurantTotal + barTotal + spaTotal + roomServiceTotal + minibarTotal + otherTotal;
  const discountRate = vipDiscountRate;
  const discountAmount = subtotal * discountRate;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = 0.10; // 10% Occupancy & Sales Tax
  const taxAmount = taxableAmount * taxRate;
  const serviceChargeRate = 0.05; // 5% Resort Service Charge
  const serviceChargeAmount = taxableAmount * serviceChargeRate;
  const grandTotal = taxableAmount + taxAmount + serviceChargeAmount;
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  return {
    roomTotal,
    restaurantTotal,
    barTotal,
    spaTotal,
    roomServiceTotal,
    minibarTotal,
    otherTotal,
    subtotal,
    taxRate,
    taxAmount,
    serviceChargeRate,
    serviceChargeAmount,
    discountRate,
    discountAmount,
    grandTotal,
    paidAmount,
    balanceDue,
  };
}

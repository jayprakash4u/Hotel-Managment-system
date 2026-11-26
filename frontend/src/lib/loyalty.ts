// Complete Hotel & Restaurant Membership Management Architecture
// Supports: Automatic membership creation, completed nights tier upgrades,
// separate hotel & restaurant discount controls, manual billing checkbox validation.

export type MembershipTierIcon = 'shield' | 'star' | 'crown' | 'gem' | 'award';

export interface MembershipTier {
  id: string;
  code: string; // REGULAR, SILVER, GOLD, PLATINUM, CUSTOM
  name: string;
  minNights: number; // Primary qualifying criteria: completed hotel nights
  minStays?: number; // Optional secondary criteria
  icon?: MembershipTierIcon; // Distinctive visual tier badge icon
  
  // Hotel Discount Configuration
  hotelDiscountEnabled: boolean;
  hotelDiscountType: 'PERCENTAGE' | 'FIXED';
  hotelDiscountValue: number; // e.g. 10 for 10%
  hotelMaxDiscount?: number | null;

  // Restaurant Discount Configuration
  restaurantDiscountEnabled: boolean;
  restaurantDiscountType: 'PERCENTAGE' | 'FIXED';
  restaurantDiscountValue: number; // e.g. 5 for 5%
  restaurantMaxDiscount?: number | null;

  // Legacy field for backwards compatibility
  discountPercent?: number;

  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeStyle: 'regular' | 'silver' | 'gold' | 'platinum' | 'custom';
  description: string;
  benefits: string[];
  isActive: boolean;
  order: number;
}

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'tier-regular',
    code: 'REGULAR',
    name: 'Regular Member',
    minNights: 0,
    minStays: 0,
    icon: 'shield',
    hotelDiscountEnabled: false,
    hotelDiscountType: 'PERCENTAGE',
    hotelDiscountValue: 0,
    restaurantDiscountEnabled: false,
    restaurantDiscountType: 'PERCENTAGE',
    restaurantDiscountValue: 0,
    discountPercent: 0,
    color: '#64748B',
    textColor: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badgeStyle: 'regular',
    description: 'Standard guest profile for new and occasional guests (0–4 qualifying nights).',
    benefits: [
      'Standard Room Rates',
      'Direct Front Desk Assistance',
    ],
    isActive: true,
    order: 1,
  },
  {
    id: 'tier-silver',
    code: 'SILVER',
    name: 'Silver Member',
    minNights: 5,
    minStays: 2,
    icon: 'star',
    hotelDiscountEnabled: true,
    hotelDiscountType: 'PERCENTAGE',
    hotelDiscountValue: 5,
    restaurantDiscountEnabled: false,
    restaurantDiscountType: 'PERCENTAGE',
    restaurantDiscountValue: 0,
    discountPercent: 5,
    color: '#475569',
    textColor: 'text-slate-800 dark:text-slate-200',
    bgColor: 'bg-slate-100 dark:bg-slate-800/80',
    borderColor: 'border-slate-400 dark:border-slate-600',
    badgeStyle: 'silver',
    description: 'Preferred status for returning guests with 5–14 qualifying nights.',
    benefits: [
      '5% Room Fare Discount',
      'Priority Check-In',
    ],
    isActive: true,
    order: 2,
  },
  {
    id: 'tier-gold',
    code: 'GOLD',
    name: 'Gold Member',
    minNights: 15,
    minStays: 5,
    icon: 'crown',
    hotelDiscountEnabled: true,
    hotelDiscountType: 'PERCENTAGE',
    hotelDiscountValue: 10,
    restaurantDiscountEnabled: false,
    restaurantDiscountType: 'PERCENTAGE',
    restaurantDiscountValue: 0,
    discountPercent: 10,
    color: '#D97706',
    textColor: 'text-amber-800 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-300 dark:border-amber-800',
    badgeStyle: 'gold',
    description: 'VIP status for frequent guests with 15–29 qualifying nights.',
    benefits: [
      '10% Room Fare Discount',
      'Priority Check-In',
      'Late Check-Out (upon availability)',
    ],
    isActive: true,
    order: 3,
  },
  {
    id: 'tier-platinum',
    code: 'PLATINUM',
    name: 'Platinum Member',
    minNights: 30,
    minStays: 10,
    icon: 'gem',
    hotelDiscountEnabled: true,
    hotelDiscountType: 'PERCENTAGE',
    hotelDiscountValue: 15,
    restaurantDiscountEnabled: false,
    restaurantDiscountType: 'PERCENTAGE',
    restaurantDiscountValue: 0,
    discountPercent: 15,
    color: '#4F46E5',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
    badgeStyle: 'platinum',
    description: 'Executive status for elite frequent guests with 30+ qualifying nights.',
    benefits: [
      '15% Room Fare Discount',
      'Complimentary Room Upgrade (upon availability)',
      'Priority Check-In',
      'Late Check-Out (upon availability)',
    ],
    isActive: true,
    order: 4,
  },
];

const STORAGE_KEY = 'hotel_membership_tiers';

// Retrieve configured tiers from localStorage or fallback to defaults
export function getMembershipTiers(): MembershipTier[] {
  if (typeof window === 'undefined') return DEFAULT_MEMBERSHIP_TIERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.minNights ?? a.minStays ?? 0) - (b.minNights ?? b.minStays ?? 0));
      }
    }
  } catch (err) {
    console.error('Error loading membership tiers:', err);
  }
  return DEFAULT_MEMBERSHIP_TIERS;
}

// Save membership tiers to localStorage and dispatch event
export function saveMembershipTiers(tiers: MembershipTier[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...tiers].sort((a, b) => a.minNights - b.minNights);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent('hotel_membership_tiers_updated', { detail: sorted }));
  } catch (err) {
    console.error('Error saving membership tiers:', err);
  }
}

// Validate tier configuration rules
export function validateMembershipTiers(tiers: MembershipTier[]): { isValid: boolean; error?: string } {
  if (!tiers || tiers.length === 0) {
    return { isValid: false, error: 'At least one membership tier must be configured.' };
  }

  const names = new Set<string>();
  const codes = new Set<string>();
  for (const t of tiers) {
    const trimmedName = t.name.trim().toLowerCase();
    const trimmedCode = t.code.trim().toUpperCase();
    if (!trimmedName) return { isValid: false, error: 'Tier name cannot be empty.' };
    if (!trimmedCode) return { isValid: false, error: 'Tier code cannot be empty.' };
    if (names.has(trimmedName)) return { isValid: false, error: `Duplicate tier name: "${t.name}".` };
    if (codes.has(trimmedCode)) return { isValid: false, error: `Duplicate tier code: "${t.code}".` };
    names.add(trimmedName);
    codes.add(trimmedCode);

    if (t.minNights < 0) return { isValid: false, error: `Min nights for ${t.name} cannot be negative.` };
    if (t.hotelDiscountValue < 0) return { isValid: false, error: `Hotel discount for ${t.name} cannot be negative.` };
    if (t.restaurantDiscountValue < 0) return { isValid: false, error: `Restaurant discount for ${t.name} cannot be negative.` };
  }

  const sorted = [...tiers].sort((a, b) => a.minNights - b.minNights);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].minNights === sorted[i + 1].minNights) {
      return {
        isValid: false,
        error: `Tiers "${sorted[i].name}" and "${sorted[i + 1].name}" have the same night threshold (${sorted[i].minNights}). Each tier must have a unique minimum night threshold.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculate total completed hotel nights and stays for a guest.
 * Rules per specifications:
 * 1. Count actual completed nights after checkout (status === 'CHECKED_OUT').
 * 2. Cancelled and no-show reservations DO NOT count.
 * 3. Uncompleted (pending, reserved, in-house) DO NOT count.
 * 4. Multi-room reservations do NOT multiply qualifying nights.
 * 5. Room changes during the same reservation do NOT duplicate.
 */
export function calculateGuestCompletedNightsAndStays(
  guestQuery: { id?: string; phone?: string; email?: string; name?: string },
  allBookings: any[]
): {
  completedNights: number;
  completedStays: number;
  totalSpending: number;
  lastStayDate?: string;
  completedBookingIds: string[];
} {
  if (!allBookings || allBookings.length === 0) {
    return { completedNights: 0, completedStays: 0, totalSpending: 0, completedBookingIds: [] };
  }

  const normalizedPhone = (guestQuery.phone || '').replace(/\D/g, '').slice(-10);
  const normalizedEmail = (guestQuery.email || '').trim().toLowerCase();
  const normalizedName = (guestQuery.name || '').trim().toLowerCase();

  const matchedCompletedBookings = new Map<string, any>();

  for (const b of allBookings) {
    if (b.status !== 'CHECKED_OUT') continue;

    let isMatch = false;
    if (guestQuery.id && (b.guest?.id === guestQuery.id || b.guestId === guestQuery.id)) {
      isMatch = true;
    } else if (normalizedPhone && b.guest?.phone) {
      const bPhone = (b.guest.phone || '').replace(/\D/g, '').slice(-10);
      if (bPhone && bPhone === normalizedPhone) isMatch = true;
    } else if (normalizedEmail && b.guest?.email) {
      if ((b.guest.email || '').trim().toLowerCase() === normalizedEmail) isMatch = true;
    } else if (normalizedName && b.guest) {
      const fullName = `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.trim().toLowerCase();
      if (fullName && fullName === normalizedName) isMatch = true;
    }

    if (isMatch && b.id) {
      // If booking code exists, de-duplicate multi-room bookings sharing the same stay code
      const stayKey = b.bookingCode ? `${guestQuery.phone || guestQuery.id || ''}_${b.bookingCode}` : b.id;
      if (!matchedCompletedBookings.has(stayKey)) {
        matchedCompletedBookings.set(stayKey, b);
      }
    }
  }

  let totalNights = 0;
  let totalSpending = 0;
  let lastStayDate: string | undefined = undefined;

  matchedCompletedBookings.forEach((b) => {
    // Calculate nights accurately
    let nights = Number(b.nights);
    if (!nights || isNaN(nights) || nights <= 0) {
      try {
        const inD = new Date(b.checkIn);
        const outD = new Date(b.checkOut);
        const diffDays = Math.round((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
        nights = Math.max(1, diffDays);
      } catch {
        nights = 1;
      }
    }
    totalNights += nights;

    const roomCost = Number(b.roomCharges ?? b.totalCharges ?? b.rate ?? 0);
    const orderCost = Number(b.cafeTotal ?? b.restaurantOrdersTotal ?? 0);
    totalSpending += roomCost + orderCost;

    const outDate = b.checkOut || b.departureDate;
    if (outDate) {
      if (!lastStayDate || outDate > lastStayDate) {
        lastStayDate = outDate;
      }
    }
  });

  return {
    completedNights: totalNights,
    completedStays: matchedCompletedBookings.size,
    totalSpending,
    lastStayDate,
    completedBookingIds: Array.from(matchedCompletedBookings.keys()),
  };
}

// Backwards compatibility alias
export function calculateGuestCompletedStays(
  guestQuery: { id?: string; phone?: string; email?: string; name?: string },
  allBookings: any[]
) {
  return calculateGuestCompletedNightsAndStays(guestQuery, allBookings);
}

// Determine qualifying membership tier based on completed nights
export function determineEligibleTier(completedNights: number, tiers?: MembershipTier[]): MembershipTier {
  const activeTiers = (tiers || getMembershipTiers())
    .filter((t) => t.isActive)
    .sort((a, b) => b.minNights - a.minNights); // Highest night threshold first

  for (const tier of activeTiers) {
    if (completedNights >= tier.minNights) {
      return tier;
    }
  }

  const sortedAsc = [...activeTiers].sort((a, b) => a.minNights - b.minNights);
  return sortedAsc[0] || DEFAULT_MEMBERSHIP_TIERS[0];
}

export interface TierProgressInfo {
  currentTier: MembershipTier;
  nextTier: MembershipTier | null;
  completedNights: number;
  nightsNeededForNext: number;
  progressPercent: number;
  progressSummaryText: string;
}

export function calculateTierProgress(completedNights: number, tiers?: MembershipTier[]): TierProgressInfo {
  const allTiers = (tiers || getMembershipTiers())
    .filter((t) => t.isActive)
    .sort((a, b) => a.minNights - b.minNights);

  const currentTier = determineEligibleTier(completedNights, allTiers);

  const nextTierIndex = allTiers.findIndex((t) => t.id === currentTier.id) + 1;
  const nextTier = nextTierIndex < allTiers.length ? allTiers[nextTierIndex] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      completedNights,
      nightsNeededForNext: 0,
      progressPercent: 100,
      progressSummaryText: `Top Elite Status! You have unlocked all ${currentTier.name} VIP privileges.`,
    };
  }

  const baseNights = currentTier.minNights;
  const targetNights = nextTier.minNights;
  const nightsNeeded = Math.max(0, targetNights - completedNights);

  const span = targetNights - baseNights;
  const earnedInLevel = Math.max(0, completedNights - baseNights);
  const progressPercent = span > 0 ? Math.min(100, Math.round((earnedInLevel / span) * 100)) : 100;

  return {
    currentTier,
    nextTier,
    completedNights,
    nightsNeededForNext: nightsNeeded,
    progressPercent,
    progressSummaryText: `${nightsNeeded} more qualifying ${nightsNeeded === 1 ? 'night' : 'nights'} to reach ${nextTier.name}.`,
  };
}

/**
 * Calculate membership discount amount for a given tier, module (HOTEL or RESTAURANT), and subtotal.
 * CRITICAL RULE: Manual checkbox must be toggled on by staff. Never apply automatically.
 */
export function calculateMembershipDiscount(
  tier: MembershipTier | null | undefined,
  module: 'HOTEL' | 'RESTAURANT',
  eligibleSubtotal: number
): {
  isEligible: boolean;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  discountLabel: string;
} {
  if (!tier || !tier.isActive || eligibleSubtotal <= 0) {
    return { isEligible: false, discountType: 'PERCENTAGE', discountValue: 0, discountAmount: 0, discountLabel: '' };
  }

  const isHotel = module === 'HOTEL';
  const isEnabled = isHotel ? tier.hotelDiscountEnabled : tier.restaurantDiscountEnabled;
  const discountType = isHotel ? tier.hotelDiscountType : tier.restaurantDiscountType;
  const discountValue = isHotel ? tier.hotelDiscountValue : tier.restaurantDiscountValue;
  const maxDiscount = isHotel ? tier.hotelMaxDiscount : tier.restaurantMaxDiscount;

  if (!isEnabled || discountValue <= 0) {
    return { isEligible: false, discountType, discountValue: 0, discountAmount: 0, discountLabel: '' };
  }

  let amount = 0;
  if (discountType === 'FIXED') {
    amount = Math.min(eligibleSubtotal, discountValue);
  } else {
    amount = Math.round(eligibleSubtotal * (discountValue / 100.0));
  }

  if (maxDiscount && maxDiscount > 0) {
    amount = Math.min(amount, maxDiscount);
  }

  amount = Math.max(0, Math.min(eligibleSubtotal, amount));

  const discountLabel = discountType === 'FIXED'
    ? `${tier.name} Discount (Fixed)`
    : `${tier.name} Discount (${discountValue}%)`;

  return {
    isEligible: true,
    discountType,
    discountValue,
    discountAmount: amount,
    discountLabel,
  };
}

// Process automatic upgrade at checkout based on completed nights
export function checkAndApplyCheckoutUpgrade(
  checkedOutBooking: any,
  allBookings: any[]
): { wasUpgraded: boolean; previousTierName?: string; newTier?: MembershipTier; completedNights: number; stayCount: number } {
  if (!checkedOutBooking || !checkedOutBooking.guest) {
    return { wasUpgraded: false, completedNights: 0, stayCount: 0 };
  }

  const { completedNights, completedStays } = calculateGuestCompletedNightsAndStays(checkedOutBooking.guest, allBookings);
  const eligibleTier = determineEligibleTier(completedNights);

  const prevTierName = checkedOutBooking.guest.vipTier || 'REGULAR';
  const wasUpgraded = eligibleTier.code.toUpperCase() !== prevTierName.toUpperCase();

  return {
    wasUpgraded,
    previousTierName: prevTierName,
    newTier: eligibleTier,
    completedNights,
    stayCount: completedStays,
  };
}

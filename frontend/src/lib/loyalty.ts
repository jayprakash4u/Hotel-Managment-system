// Customer Loyalty & Membership Program Logic for Hotel Management System

export interface MembershipTier {
  id: string;
  code: string;
  name: string;
  minStays: number;
  discountPercent: number;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeStyle: 'silver' | 'gold' | 'platinum' | 'custom';
  description: string;
  benefits: string[];
  isActive: boolean;
  order: number;
}

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'tier-silver',
    code: 'SILVER',
    name: 'Silver',
    minStays: 0,
    discountPercent: 0,
    color: '#64748B',
    textColor: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badgeStyle: 'silver',
    description: 'Basic membership for new and occasional hotel guests',
    benefits: [
      'Welcome Refreshment on Arrival',
      'Complimentary High-Speed Wi-Fi',
      'Standard Check-In & Check-Out',
      'Earn Stays toward Tier Upgrades',
    ],
    isActive: true,
    order: 1,
  },
  {
    id: 'tier-gold',
    code: 'GOLD',
    name: 'Gold',
    minStays: 5,
    discountPercent: 5,
    color: '#D97706',
    textColor: 'text-amber-800 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-300 dark:border-amber-800',
    badgeStyle: 'gold',
    description: 'Preferred status for repeat hotel guests with 5+ completed stays',
    benefits: [
      '5% Direct Discount on Room Bookings',
      'Early Check-In from 10:00 AM (Subject to availability)',
      'Complimentary Morning Breakfast Upgrade',
      'Priority Front Desk Assistance',
      'Free Room Key Duplication on Request',
    ],
    isActive: true,
    order: 2,
  },
  {
    id: 'tier-platinum',
    code: 'PLATINUM',
    name: 'Platinum',
    minStays: 10,
    discountPercent: 10,
    color: '#4F46E5',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
    badgeStyle: 'platinum',
    description: 'VIP status for loyal guests with 10+ completed stays',
    benefits: [
      '10% Direct Discount on Room Bookings',
      'Guaranteed Complimentary Room Upgrade (Subject to availability)',
      'Free Late Check-Out up to 2:00 PM',
      'Executive Lounge & Rooftop Access',
      'Dedicated Hospitality Concierge & Priority Check-in',
      'Complimentary Laundry (2 items per stay)',
    ],
    isActive: true,
    order: 3,
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
        return parsed.sort((a, b) => a.minStays - b.minStays);
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
    const sorted = [...tiers].sort((a, b) => a.minStays - b.minStays);
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

  // Check unique names and codes
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

    if (t.minStays < 0) return { isValid: false, error: `Min stays for ${t.name} cannot be negative.` };
    if (t.discountPercent < 0 || t.discountPercent > 100) {
      return { isValid: false, error: `Discount for ${t.name} must be between 0% and 100%.` };
    }
  }

  // Check that thresholds are ascending and non-overlapping
  const sorted = [...tiers].sort((a, b) => a.minStays - b.minStays);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].minStays === sorted[i + 1].minStays) {
      return {
        isValid: false,
        error: `Tiers "${sorted[i].name}" and "${sorted[i + 1].name}" have the same stay threshold (${sorted[i].minStays}). Each tier must have a unique minimum stay threshold.`,
      };
    }
  }

  return { isValid: true };
}

// Calculate total completed hotel stays for a given guest
// Rules:
// 1. One completed reservation counts as one stay (regardless of nights or room changes).
// 2. Only status === 'CHECKED_OUT' counts.
// 3. Cancelled, pending, confirmed, no-show, in-house do NOT count.
// 4. Repeated checkouts of the same reservation ID are counted once.
export function calculateGuestCompletedStays(
  guestQuery: { id?: string; phone?: string; email?: string; name?: string },
  allBookings: any[]
): { completedStays: number; totalSpending: number; lastStayDate?: string; completedBookingIds: string[] } {
  if (!allBookings || allBookings.length === 0) {
    return { completedStays: 0, totalSpending: 0, completedBookingIds: [] };
  }

  const normalizedPhone = (guestQuery.phone || '').replace(/\D/g, '').slice(-10);
  const normalizedEmail = (guestQuery.email || '').trim().toLowerCase();
  const normalizedName = (guestQuery.name || '').trim().toLowerCase();

  const matchedCompletedBookings = new Map<string, any>();

  for (const b of allBookings) {
    // Only completed stays count
    if (b.status !== 'CHECKED_OUT') continue;

    // Guest matching logic
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
      matchedCompletedBookings.set(b.id, b);
    }
  }

  let totalSpending = 0;
  let lastStayDate: string | undefined = undefined;

  matchedCompletedBookings.forEach((b) => {
    // Tally financials safely
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
    completedStays: matchedCompletedBookings.size,
    totalSpending,
    lastStayDate,
    completedBookingIds: Array.from(matchedCompletedBookings.keys()),
  };
}

// Determine qualifying membership tier based on completed stay count
export function determineEligibleTier(completedStays: number, tiers?: MembershipTier[]): MembershipTier {
  const activeTiers = (tiers || getMembershipTiers())
    .filter((t) => t.isActive)
    .sort((a, b) => b.minStays - a.minStays); // highest threshold first

  for (const tier of activeTiers) {
    if (completedStays >= tier.minStays) {
      return tier;
    }
  }

  // Fallback to the lowest active tier or default Silver
  const sortedAsc = [...activeTiers].sort((a, b) => a.minStays - b.minStays);
  return sortedAsc[0] || DEFAULT_MEMBERSHIP_TIERS[0];
}

// Calculate membership tier progression metrics
export interface TierProgressInfo {
  currentTier: MembershipTier;
  nextTier: MembershipTier | null;
  completedStays: number;
  staysNeededForNext: number;
  progressPercent: number;
  progressSummaryText: string;
}

export function calculateTierProgress(completedStays: number, tiers?: MembershipTier[]): TierProgressInfo {
  const allTiers = (tiers || getMembershipTiers())
    .filter((t) => t.isActive)
    .sort((a, b) => a.minStays - b.minStays);

  const currentTier = determineEligibleTier(completedStays, allTiers);

  // Find next higher tier
  const nextTierIndex = allTiers.findIndex((t) => t.id === currentTier.id) + 1;
  const nextTier = nextTierIndex < allTiers.length ? allTiers[nextTierIndex] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      completedStays,
      staysNeededForNext: 0,
      progressPercent: 100,
      progressSummaryText: `Top Level Achieved! You have unlocked all ${currentTier.name} VIP privileges.`,
    };
  }

  const baseStays = currentTier.minStays;
  const targetStays = nextTier.minStays;
  const staysNeeded = Math.max(0, targetStays - completedStays);

  const span = targetStays - baseStays;
  const earnedInLevel = Math.max(0, completedStays - baseStays);
  const progressPercent = span > 0 ? Math.min(100, Math.round((earnedInLevel / span) * 100)) : 100;

  return {
    currentTier,
    nextTier,
    completedStays,
    staysNeededForNext: staysNeeded,
    progressPercent,
    progressSummaryText: `${staysNeeded} more ${staysNeeded === 1 ? 'stay' : 'stays'} to reach ${nextTier.name}.`,
  };
}

// Process automatic upgrade at checkout
export function checkAndApplyCheckoutUpgrade(
  checkedOutBooking: any,
  allBookings: any[]
): { wasUpgraded: boolean; previousTierName?: string; newTier?: MembershipTier; stayCount: number } {
  if (!checkedOutBooking || !checkedOutBooking.guest) {
    return { wasUpgraded: false, stayCount: 0 };
  }

  const tiers = getMembershipTiers();
  const guestQuery = {
    id: checkedOutBooking.guest.id,
    phone: checkedOutBooking.guest.phone,
    email: checkedOutBooking.guest.email,
    name: `${checkedOutBooking.guest.firstName || ''} ${checkedOutBooking.guest.lastName || ''}`.trim(),
  };

  const { completedStays } = calculateGuestCompletedStays(guestQuery, allBookings);
  const newTier = determineEligibleTier(completedStays, tiers);

  // Check previous tier recorded on booking or guest
  const prevCode = (checkedOutBooking.guest.vipTier || 'SILVER').toUpperCase();
  const previousTier = tiers.find((t) => t.code.toUpperCase() === prevCode) || DEFAULT_MEMBERSHIP_TIERS[0];

  // Upgraded if minStays of new tier is higher than previous tier's minStays
  const wasUpgraded = newTier.minStays > previousTier.minStays;

  // Persist updated VIP tier to registered guests storage
  if (typeof window !== 'undefined') {
    try {
      const storedGuestsRaw = localStorage.getItem('hotel_registered_guests');
      if (storedGuestsRaw) {
        const storedGuests = JSON.parse(storedGuestsRaw);
        if (Array.isArray(storedGuests)) {
          const updated = storedGuests.map((g: any) => {
            const isMatch =
              (guestQuery.id && g.id === guestQuery.id) ||
              (guestQuery.phone && g.phone === guestQuery.phone) ||
              (guestQuery.name && g.name?.toLowerCase() === guestQuery.name.toLowerCase());

            if (isMatch) {
              return {
                ...g,
                vipTier: newTier.code,
                membershipLevel: newTier.name,
                completedStays,
              };
            }
            return g;
          });
          localStorage.setItem('hotel_registered_guests', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to update registered guests with new tier:', err);
    }
  }

  return {
    wasUpgraded,
    previousTierName: previousTier.name,
    newTier,
    stayCount: completedStays,
  };
}

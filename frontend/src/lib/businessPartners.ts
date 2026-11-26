export type PartnerType = 'CORPORATE' | 'TRAVEL_AGENT' | 'INDIVIDUAL_REFERRAL';

export type BillingArrangement =
  | 'COMPANY_ACCOUNT'
  | 'GUEST_DIRECT'
  | 'SPLIT_BILLING'
  | 'COMPANY_PAYS'
  | 'GUEST_PAYS'
  | 'SPLIT';

export type PaymentResponsibility = BillingArrangement;

export type PaymentTerms = 'IMMEDIATE' | 'NET_7' | 'NET_15' | 'NET_30' | 'CUSTOM';

export type ReferralType =
  | 'LOCAL_INDIVIDUAL'
  | 'TOURIST_GUIDE'
  | 'TAXI_DRIVER'
  | 'FREELANCE_AGENT'
  | 'OTHER';

export type CommissionType =
  | 'PERCENTAGE'
  | 'FIXED_PER_BOOKING'
  | 'FIXED_PER_ROOM_NIGHT';

export type CommissionBasis = 'ROOM_CHARGES' | 'TOTAL_RESERVATION_CHARGES';

export type CommissionPaymentRule =
  | 'AFTER_CHECKOUT'
  | 'AFTER_FULL_PAYMENT'
  | 'MANUAL_APPROVAL';

export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface BusinessPartner {
  id: string;
  hotelId?: string;
  partnerCode: string; // e.g. CRP-1001, AGT-2001, REF-3001
  partnerType: PartnerType;
  partnerName: string;
  contactPerson?: string;
  designation?: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  website?: string;

  // Address Information
  country: string;
  province?: string;
  district?: string;
  city?: string;
  address?: string;

  // Legal / Tax Information
  panVatNumber?: string;
  registrationNumber?: string;

  // Corporate Specific
  companyType?: string; // Private Limited, Public Limited, Government, NGO/INGO, Other
  defaultBillingArrangement?: BillingArrangement;
  defaultPaymentResponsibility?: PaymentResponsibility;
  creditAllowed?: boolean; // Checkmarked credit facility (if unpaid, goes to credit)
  creditLimit?: number;
  paymentTerms?: PaymentTerms;
  customPaymentTermsDays?: number;
  negotiatedDiscountPercent?: number; // Corporate discount applied to any room
  negotiatedRoomRate?: number; // Deprecated flat rate (guests can choose any room)

  // Referral Specific
  referralType?: ReferralType;

  // Commission Settings
  commissionEnabled: boolean;
  commissionType: CommissionType;
  commissionValue: number;
  commissionBasis: CommissionBasis;
  commissionPaymentRule: CommissionPaymentRule;

  // Financial Aggregations
  totalBookings: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  outstandingCommission: number;
  corporateReceivableBalance: number; // For corporate partners (hotel accounts receivable)

  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerCommission {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  partnerType: PartnerType;
  reservationId: string;
  bookingCode: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomNights: number;
  roomRate: number;
  eligibleAmount: number;
  commissionType: CommissionType;
  commissionRate: number;
  commissionAmount: number;
  calculationBasis: CommissionBasis;
  status: CommissionStatus;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paymentId?: string;
  notes?: string;
  createdAt: string;
}

export interface PartnerCommissionPayment {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCode: string;
  paymentNumber: string; // CPAY-2026-0001
  paymentDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'WALLET' | 'OTHER';
  referenceNumber?: string;
  paidBy: string;
  notes?: string;
  commissionIds: string[];
  createdAt: string;
}

export interface CorporateStatementEntry {
  id: string;
  partnerId: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'ADJUSTMENT';
  referenceNumber: string; // Invoice # or Payment Voucher #
  reservationReference?: string;
  guestName?: string;
  description: string;
  debit: number; // Charges billed to company
  credit: number; // Payments made by company or on behalf of company
  runningBalance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  actualPayerName?: string;
  receivedFrom?: 'COMPANY' | 'GUEST_EMPLOYEE' | 'OTHER';
  allocatedTo?: 'COMPANY_ACCOUNT' | 'GUEST_FOLIO';
}

const STORAGE_PARTNERS_KEY = 'hospitality_business_partners_master';
const STORAGE_COMMISSIONS_KEY = 'hospitality_partner_commissions';
const STORAGE_PAYMENTS_KEY = 'hospitality_partner_commission_payments';

export const SEED_BUSINESS_PARTNERS: BusinessPartner[] = [
  {
    id: 'bp_corp_001',
    partnerCode: 'CRP-1001',
    partnerType: 'CORPORATE',
    partnerName: 'Himalayan Technology Solutions Pvt. Ltd.',
    contactPerson: 'Suresh Adhikari',
    designation: 'HR & Administrative Manager',
    phone: '9851023456',
    alternativePhone: '01-4432190',
    email: 'corporate@himalayantech.com.np',
    website: 'https://himalayantech.com.np',
    country: 'Nepal',
    province: 'Bagmati Province',
    district: 'Kathmandu',
    city: 'Kathmandu',
    address: 'Lazimpat, Ward 2',
    panVatNumber: '601293849',
    registrationNumber: 'PVT-78921/076',
    companyType: 'Private Limited',
    defaultBillingArrangement: 'COMPANY_ACCOUNT',
    defaultPaymentResponsibility: 'COMPANY_PAYS',
    creditAllowed: true,
    creditLimit: 300000,
    paymentTerms: 'NET_30',
    customPaymentTermsDays: 30,
    negotiatedDiscountPercent: 12,
    commissionEnabled: false,
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    totalBookings: 14,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0,
    outstandingCommission: 0,
    corporateReceivableBalance: 48200,
    status: 'ACTIVE',
    notes: 'Key IT client. Standard executive room corporate bookings.',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-11-20T10:30:00Z',
  },
  {
    id: 'bp_corp_002',
    partnerCode: 'CRP-1002',
    partnerType: 'CORPORATE',
    partnerName: 'Apex Infrastructure & Construction',
    contactPerson: 'Rabin Shrestha',
    designation: 'Procurement Director',
    phone: '9801298765',
    alternativePhone: '01-5523490',
    email: 'info@apexinfra.com.np',
    website: 'https://apexinfra.com.np',
    country: 'Nepal',
    province: 'Bagmati Province',
    district: 'Lalitpur',
    city: 'Lalitpur',
    address: 'Kupondole Height',
    panVatNumber: '609823145',
    registrationNumber: 'PVT-56123/074',
    companyType: 'Private Limited',
    defaultBillingArrangement: 'SPLIT_BILLING',
    defaultPaymentResponsibility: 'SPLIT',
    creditAllowed: true,
    creditLimit: 150000,
    paymentTerms: 'NET_15',
    customPaymentTermsDays: 15,
    negotiatedDiscountPercent: 10,
    commissionEnabled: false,
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    totalBookings: 8,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0,
    outstandingCommission: 0,
    corporateReceivableBalance: 24000,
    status: 'ACTIVE',
    notes: 'Split payment: Room paid by company, incidentals paid by guest.',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-11-22T14:15:00Z',
  },
  {
    id: 'bp_agent_001',
    partnerCode: 'AGT-2001',
    partnerType: 'TRAVEL_AGENT',
    partnerName: 'Annapurna Trekking & Travels',
    contactPerson: 'Dawa Sherpa',
    designation: 'Managing Director',
    phone: '9846019283',
    alternativePhone: '061-463201',
    email: 'bookings@annapurnatreks.com',
    website: 'https://annapurnatreks.com',
    country: 'Nepal',
    province: 'Gandaki Province',
    district: 'Kaski',
    city: 'Pokhara',
    address: 'Lakeside, Street 14',
    panVatNumber: '302918475',
    registrationNumber: 'TRV-4412/071',
    commissionEnabled: true,
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    totalBookings: 22,
    totalCommissionEarned: 38400,
    totalCommissionPaid: 29000,
    outstandingCommission: 9400,
    corporateReceivableBalance: 0,
    status: 'ACTIVE',
    notes: 'Specializes in European hiking and trekking groups.',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-11-24T16:00:00Z',
  },
  {
    id: 'bp_agent_002',
    partnerCode: 'AGT-2002',
    partnerType: 'TRAVEL_AGENT',
    partnerName: 'Himalayan Horizon Safaris',
    contactPerson: 'Pooja Thapa',
    designation: 'Operations Coordinator',
    phone: '9851145678',
    email: 'info@himalayanhorizons.com',
    country: 'Nepal',
    province: 'Bagmati Province',
    district: 'Kathmandu',
    city: 'Kathmandu',
    address: 'Thamel Bhagwati Marg',
    panVatNumber: '304918239',
    commissionEnabled: true,
    commissionType: 'FIXED_PER_ROOM_NIGHT',
    commissionValue: 600,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_FULL_PAYMENT',
    totalBookings: 9,
    totalCommissionEarned: 16200,
    totalCommissionPaid: 16200,
    outstandingCommission: 0,
    corporateReceivableBalance: 0,
    status: 'ACTIVE',
    notes: 'Fixed NPR 600 per room night. Reliable partner.',
    createdAt: '2026-04-12T08:30:00Z',
    updatedAt: '2026-11-18T12:00:00Z',
  },
  {
    id: 'bp_ref_001',
    partnerCode: 'REF-3001',
    partnerType: 'INDIVIDUAL_REFERRAL',
    partnerName: 'Ram Bahadur Gurung',
    phone: '9841238910',
    alternativePhone: '9813298711',
    email: 'ram.gurung.guide@gmail.com',
    country: 'Nepal',
    city: 'Pokhara',
    address: 'Damside, Ward 7',
    referralType: 'TOURIST_GUIDE',
    commissionEnabled: true,
    commissionType: 'FIXED_PER_BOOKING',
    commissionValue: 1200,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    totalBookings: 11,
    totalCommissionEarned: 13200,
    totalCommissionPaid: 10800,
    outstandingCommission: 2400,
    corporateReceivableBalance: 0,
    status: 'ACTIVE',
    notes: 'Licensed senior mountain and city tourist guide.',
    createdAt: '2026-05-18T14:00:00Z',
    updatedAt: '2026-11-25T09:40:00Z',
  },
  {
    id: 'bp_ref_002',
    partnerCode: 'REF-3002',
    partnerType: 'INDIVIDUAL_REFERRAL',
    partnerName: 'Bikash Tamang',
    phone: '9803124567',
    country: 'Nepal',
    city: 'Kathmandu',
    address: 'Airport Road, Sinamangal',
    referralType: 'TAXI_DRIVER',
    commissionEnabled: true,
    commissionType: 'FIXED_PER_BOOKING',
    commissionValue: 500,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'MANUAL_APPROVAL',
    totalBookings: 7,
    totalCommissionEarned: 3500,
    totalCommissionPaid: 2500,
    outstandingCommission: 1000,
    corporateReceivableBalance: 0,
    status: 'ACTIVE',
    notes: 'Airport taxi driver who recommends hotel for walk-in arrivals.',
    createdAt: '2026-06-20T11:20:00Z',
    updatedAt: '2026-11-21T18:10:00Z',
  },
  {
    id: 'bp_ref_003',
    partnerCode: 'REF-3003',
    partnerType: 'INDIVIDUAL_REFERRAL',
    partnerName: 'Kishor Shrestha',
    phone: '9851088776',
    country: 'Nepal',
    city: 'Kathmandu',
    address: 'New Road',
    referralType: 'LOCAL_INDIVIDUAL',
    commissionEnabled: false,
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    commissionBasis: 'ROOM_CHARGES',
    commissionPaymentRule: 'AFTER_CHECKOUT',
    totalBookings: 3,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0,
    outstandingCommission: 0,
    corporateReceivableBalance: 0,
    status: 'ACTIVE',
    notes: 'Friendly local contact who refers relatives without commission.',
    createdAt: '2026-07-02T13:00:00Z',
    updatedAt: '2026-11-15T15:20:00Z',
  },
];

export const SEED_COMMISSIONS: PartnerCommission[] = [
  {
    id: 'comm_001',
    partnerId: 'bp_agent_001',
    partnerCode: 'AGT-2001',
    partnerName: 'Annapurna Trekking & Travels',
    partnerType: 'TRAVEL_AGENT',
    reservationId: 'RES-7712',
    bookingCode: 'BK-1082',
    guestName: 'Markus Weber',
    checkIn: '2026-11-18',
    checkOut: '2026-11-22',
    roomNights: 4,
    roomRate: 6000,
    eligibleAmount: 24000,
    commissionType: 'PERCENTAGE',
    commissionRate: 10,
    commissionAmount: 2400,
    calculationBasis: 'ROOM_CHARGES',
    status: 'APPROVED',
    approvedAt: '2026-11-22T12:00:00Z',
    approvedBy: 'Hotel Manager',
    createdAt: '2026-11-22T10:15:00Z',
  },
  {
    id: 'comm_002',
    partnerId: 'bp_agent_001',
    partnerCode: 'AGT-2001',
    partnerName: 'Annapurna Trekking & Travels',
    partnerType: 'TRAVEL_AGENT',
    reservationId: 'RES-7740',
    bookingCode: 'BK-1095',
    guestName: 'Elena Rostova',
    checkIn: '2026-11-23',
    checkOut: '2026-11-26',
    roomNights: 3,
    roomRate: 5000,
    eligibleAmount: 15000,
    commissionType: 'PERCENTAGE',
    commissionRate: 10,
    commissionAmount: 1500,
    calculationBasis: 'ROOM_CHARGES',
    status: 'PENDING',
    createdAt: '2026-11-26T08:00:00Z',
  },
  {
    id: 'comm_003',
    partnerId: 'bp_ref_001',
    partnerCode: 'REF-3001',
    partnerName: 'Ram Bahadur Gurung',
    partnerType: 'INDIVIDUAL_REFERRAL',
    reservationId: 'RES-7735',
    bookingCode: 'BK-1090',
    guestName: 'David Miller',
    checkIn: '2026-11-21',
    checkOut: '2026-11-25',
    roomNights: 4,
    roomRate: 5500,
    eligibleAmount: 22000,
    commissionType: 'FIXED_PER_BOOKING',
    commissionRate: 1200,
    commissionAmount: 1200,
    calculationBasis: 'ROOM_CHARGES',
    status: 'APPROVED',
    approvedAt: '2026-11-25T11:00:00Z',
    approvedBy: 'Hotel Manager',
    createdAt: '2026-11-25T10:00:00Z',
  },
  {
    id: 'comm_004',
    partnerId: 'bp_ref_002',
    partnerCode: 'REF-3002',
    partnerName: 'Bikash Tamang',
    partnerType: 'INDIVIDUAL_REFERRAL',
    reservationId: 'RES-7751',
    bookingCode: 'BK-1102',
    guestName: 'Koji Tanaka',
    checkIn: '2026-11-24',
    checkOut: '2026-11-26',
    roomNights: 2,
    roomRate: 4500,
    eligibleAmount: 9000,
    commissionType: 'FIXED_PER_BOOKING',
    commissionRate: 500,
    commissionAmount: 500,
    calculationBasis: 'ROOM_CHARGES',
    status: 'PENDING',
    createdAt: '2026-11-26T09:30:00Z',
  },
];

export const SEED_COMMISSION_PAYMENTS: PartnerCommissionPayment[] = [
  {
    id: 'cpay_001',
    partnerId: 'bp_agent_001',
    partnerCode: 'AGT-2001',
    partnerName: 'Annapurna Trekking & Travels',
    paymentNumber: 'CPAY-20261115-102',
    paymentDate: '2026-11-15T14:00:00Z',
    amount: 14000,
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'NABIL-TXN-9021849',
    paidBy: 'Accountant',
    notes: 'Settlement for October & early November trekking groups.',
    commissionIds: ['comm_hist_01', 'comm_hist_02'],
    createdAt: '2026-11-15T14:00:00Z',
  },
  {
    id: 'cpay_002',
    partnerId: 'bp_ref_001',
    partnerCode: 'REF-3001',
    partnerName: 'Ram Bahadur Gurung',
    paymentNumber: 'CPAY-20261110-098',
    paymentDate: '2026-11-10T16:30:00Z',
    amount: 4800,
    paymentMethod: 'CASH',
    referenceNumber: 'CASH-REC-441',
    paidBy: 'Hotel Manager',
    notes: 'Cash payout for 4 tourist referrals.',
    commissionIds: ['comm_hist_03'],
    createdAt: '2026-11-10T16:30:00Z',
  },
];

export const SEED_CORPORATE_STATEMENTS: Record<string, CorporateStatementEntry[]> = {
  bp_corp_001: [
    {
      id: 'stmt_001',
      partnerId: 'bp_corp_001',
      date: '2026-11-01',
      type: 'INVOICE',
      referenceNumber: 'INV-CORP-2026-081',
      reservationReference: 'BK-1044',
      guestName: 'Anil Bhattarai (Tech Consultant)',
      description: 'Room 201 (5 nights @ NPR 4,800) + Meals',
      debit: 28400,
      credit: 0,
      runningBalance: 28400,
      paymentStatus: 'PAID',
    },
    {
      id: 'stmt_002',
      partnerId: 'bp_corp_001',
      date: '2026-11-10',
      type: 'PAYMENT',
      referenceNumber: 'RCT-CORP-2026-044',
      description: 'Bank Transfer Payment via Nabil Bank Ltd',
      debit: 0,
      credit: 28400,
      runningBalance: 0,
      paymentStatus: 'PAID',
    },
    {
      id: 'stmt_003',
      partnerId: 'bp_corp_001',
      date: '2026-11-16',
      type: 'INVOICE',
      referenceNumber: 'INV-CORP-2026-092',
      reservationReference: 'BK-1070',
      guestName: 'Prashant Dahal (Project Lead)',
      description: 'Room 204 (4 nights @ NPR 4,800)',
      debit: 19200,
      credit: 0,
      runningBalance: 19200,
      paymentStatus: 'UNPAID',
    },
    {
      id: 'stmt_004',
      partnerId: 'bp_corp_001',
      date: '2026-11-20',
      type: 'INVOICE',
      referenceNumber: 'INV-CORP-2026-105',
      reservationReference: 'BK-1088',
      guestName: 'Sunita Regmi (QA Director)',
      description: 'Room 105 (6 nights @ NPR 4,800) + Laundry',
      debit: 29000,
      credit: 0,
      runningBalance: 48200,
      paymentStatus: 'UNPAID',
    },
  ],
  bp_corp_002: [
    {
      id: 'stmt_101',
      partnerId: 'bp_corp_002',
      date: '2026-11-12',
      type: 'INVOICE',
      referenceNumber: 'INV-CORP-2026-089',
      reservationReference: 'BK-1062',
      guestName: 'Birendra Thapa (Site Engineer)',
      description: 'Room 302 (4 nights @ NPR 5,200) - Room only',
      debit: 20800,
      credit: 0,
      runningBalance: 20800,
      paymentStatus: 'UNPAID',
    },
    {
      id: 'stmt_102',
      partnerId: 'bp_corp_002',
      date: '2026-11-18',
      type: 'INVOICE',
      referenceNumber: 'INV-CORP-2026-099',
      reservationReference: 'BK-1078',
      guestName: 'Suman Gautam (Surveyor)',
      description: 'Room 104 (2 nights @ NPR 1,600 negotiated)',
      debit: 3200,
      credit: 0,
      runningBalance: 24000,
      paymentStatus: 'UNPAID',
    },
  ],
};

// ---------------------------------------------------------------------------
// Storage Management Functions
// ---------------------------------------------------------------------------

export function loadBusinessPartnersFromStorage(): BusinessPartner[] {
  if (typeof window === 'undefined') return SEED_BUSINESS_PARTNERS;
  try {
    const raw = localStorage.getItem(STORAGE_PARTNERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(SEED_BUSINESS_PARTNERS));
      return SEED_BUSINESS_PARTNERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Migrate: Clean up any old flat room rates and ensure creditAllowed flag is initialized
      const cleaned = parsed.map((p: BusinessPartner) => {
        if (p.partnerType === 'CORPORATE') {
          const isDirect = p.defaultBillingArrangement === 'GUEST_DIRECT' || p.defaultPaymentResponsibility === 'GUEST_PAYS';
          return {
            ...p,
            creditAllowed: p.creditAllowed !== undefined ? p.creditAllowed : !isDirect,
            negotiatedRoomRate: undefined, // Guests can choose any room; do not lock to fixed room fare
          };
        }
        return p;
      });
      return cleaned;
    }
    return SEED_BUSINESS_PARTNERS;
  } catch (err) {
    console.error('Failed to load business partners from localStorage:', err);
    return SEED_BUSINESS_PARTNERS;
  }
}

export function saveBusinessPartnersToStorage(partners: BusinessPartner[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(partners));
    window.dispatchEvent(new CustomEvent('business_partners_updated'));
  } catch (err) {
    console.error('Failed to save business partners to localStorage:', err);
  }
}

export function loadCommissionsFromStorage(): PartnerCommission[] {
  if (typeof window === 'undefined') return SEED_COMMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_COMMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_COMMISSIONS_KEY, JSON.stringify(SEED_COMMISSIONS));
      return SEED_COMMISSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_COMMISSIONS;
  } catch (err) {
    console.error('Failed to load commissions from localStorage:', err);
    return SEED_COMMISSIONS;
  }
}

export function saveCommissionsToStorage(commissions: PartnerCommission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_COMMISSIONS_KEY, JSON.stringify(commissions));
    window.dispatchEvent(new CustomEvent('partner_commissions_updated'));
  } catch (err) {
    console.error('Failed to save commissions to localStorage:', err);
  }
}

export function loadCommissionPaymentsFromStorage(): PartnerCommissionPayment[] {
  if (typeof window === 'undefined') return SEED_COMMISSION_PAYMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(SEED_COMMISSION_PAYMENTS));
      return SEED_COMMISSION_PAYMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_COMMISSION_PAYMENTS;
  } catch (err) {
    console.error('Failed to load commission payments from localStorage:', err);
    return SEED_COMMISSION_PAYMENTS;
  }
}

export function saveCommissionPaymentsToStorage(payments: PartnerCommissionPayment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
    window.dispatchEvent(new CustomEvent('partner_payments_updated'));
  } catch (err) {
    console.error('Failed to save commission payments to localStorage:', err);
  }
}

// ---------------------------------------------------------------------------
// Commission Calculation & Helper Utilities
// ---------------------------------------------------------------------------

export function calculatePartnerCommission(
  partner: BusinessPartner,
  roomCharges: number,
  totalCharges: number,
  nights: number
): number {
  if (!partner.commissionEnabled || partner.commissionValue <= 0) {
    return 0;
  }

  const baseAmount = partner.commissionBasis === 'TOTAL_RESERVATION_CHARGES' ? totalCharges : roomCharges;

  switch (partner.commissionType) {
    case 'PERCENTAGE':
      return Math.round((baseAmount * partner.commissionValue) / 100);
    case 'FIXED_PER_BOOKING':
      return Math.round(partner.commissionValue);
    case 'FIXED_PER_ROOM_NIGHT':
      return Math.round(partner.commissionValue * Math.max(1, nights));
    default:
      return 0;
  }
}

export function generatePartnerCode(type: PartnerType, existingPartners: BusinessPartner[]): string {
  const prefix = type === 'CORPORATE' ? 'CRP' : type === 'TRAVEL_AGENT' ? 'AGT' : 'REF';
  const sameTypeCount = existingPartners.filter((p) => p.partnerType === type).length;
  return `${prefix}-${1001 + sameTypeCount}`;
}

export const STORAGE_STATEMENTS_KEY = 'hospitality_corporate_statements_map';

export function loadCorporateStatementsFromStorage(): Record<string, CorporateStatementEntry[]> {
  if (typeof window === 'undefined') return SEED_CORPORATE_STATEMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_STATEMENTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_STATEMENTS_KEY, JSON.stringify(SEED_CORPORATE_STATEMENTS));
      return SEED_CORPORATE_STATEMENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load corporate statements from localStorage:', err);
    return SEED_CORPORATE_STATEMENTS;
  }
}

export function saveCorporateStatementsToStorage(statements: Record<string, CorporateStatementEntry[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_STATEMENTS_KEY, JSON.stringify(statements));
    window.dispatchEvent(new CustomEvent('corporate_statements_updated'));
  } catch (err) {
    console.error('Failed to save corporate statements to localStorage:', err);
  }
}

export function recordCorporatePaymentTransaction(params: {
  partnerId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  reservationCode?: string;
  guestName?: string;
  actualPayerName?: string;
  receivedFrom: 'COMPANY' | 'GUEST_EMPLOYEE' | 'OTHER';
  notes?: string;
}): void {
  const allStatements = loadCorporateStatementsFromStorage();
  const currentPartnerEntries = allStatements[params.partnerId] || [];

  const lastBalance = currentPartnerEntries.length > 0
    ? currentPartnerEntries[currentPartnerEntries.length - 1].runningBalance
    : 0;
  const newBalance = Math.max(0, lastBalance - params.amount);

  let desc = `Payment received via ${params.paymentMethod}`;
  if (params.receivedFrom === 'GUEST_EMPLOYEE' && params.actualPayerName) {
    desc = `Payment received from ${params.actualPayerName} (Guest/Employee) on behalf of company via ${params.paymentMethod}`;
  } else if (params.receivedFrom === 'OTHER' && params.actualPayerName) {
    desc = `Payment received from ${params.actualPayerName} (Third Party) via ${params.paymentMethod}`;
  } else if (params.receivedFrom === 'COMPANY') {
    desc = `Direct settlement by company via ${params.paymentMethod}`;
  }
  if (params.notes) {
    desc += ` — ${params.notes}`;
  }

  const newEntry: CorporateStatementEntry = {
    id: `stmt_${Date.now()}`,
    partnerId: params.partnerId,
    date: new Date().toISOString().slice(0, 10),
    type: 'PAYMENT',
    referenceNumber: params.referenceNumber || `RCT-${Math.floor(1000 + Math.random() * 9000)}`,
    reservationReference: params.reservationCode,
    guestName: params.guestName,
    description: desc,
    debit: 0,
    credit: params.amount,
    runningBalance: newBalance,
    paymentStatus: 'PAID',
    actualPayerName: params.actualPayerName,
    receivedFrom: params.receivedFrom,
    allocatedTo: 'COMPANY_ACCOUNT',
  };

  const updatedEntries = [...currentPartnerEntries, newEntry];
  allStatements[params.partnerId] = updatedEntries;
  saveCorporateStatementsToStorage(allStatements);

  // Also update partner's corporateReceivableBalance in partner master
  const allPartners = loadBusinessPartnersFromStorage();
  const updatedPartners = allPartners.map((p) => {
    if (p.id === params.partnerId) {
      return {
        ...p,
        corporateReceivableBalance: newBalance,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });
  saveBusinessPartnersToStorage(updatedPartners);
}

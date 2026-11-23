import { RoomBooking, getBookingFinancials } from '@/app/(admin)/reservations/reservationsData';
import { MembershipTier, DEFAULT_MEMBERSHIP_TIERS, determineEligibleTier, calculateTierProgress } from '@/lib/loyalty';

export type BusinessMode = 'HOTEL_AND_RESTAURANT' | 'HOTEL_ONLY' | 'RESTAURANT_ONLY';

export interface OrderItemDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface VisitRestaurantOrder {
  orderNumber: string;
  orderDate: string;
  orderTime?: string;
  itemsSummary: string;
  items?: OrderItemDetail[];
  amount: number;
  paymentType: 'ROOM_CHARGE' | 'PAID_DIRECT';
  paymentMethod?: string;
  status: 'SERVED' | 'BILLED' | 'SETTLED';
}

export interface VisitOtherService {
  id: string;
  serviceName: string;
  date: string;
  amount: number;
  referenceNo?: string;
}

export interface HotelVisitRecord {
  visitNumber: number;
  reservationNumber: string;
  bookingId?: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomNumber: string;
  roomType: string;
  durationNights: number;
  guestsCount?: number;
  bookingSource?: string;
  roomRatePerNight: number;
  roomCharges: number;
  restaurantSpending: number;
  otherServices: number;
  totalVisitAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  reservationStatus: 'CHECKED_OUT' | 'CHECKED_IN' | 'RESERVED';
  restaurantOrders: VisitRestaurantOrder[];
  otherServicesList: VisitOtherService[];
}

export interface RestaurantHistoryOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  orderType: 'DINE_IN' | 'ROOM_SERVICE' | 'TAKEAWAY';
  tableOrSource: string;
  items: OrderItemDetail[];
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Fonepay' | 'Room Charge';
  paymentStatus: 'PAID' | 'BILLED_TO_ROOM' | 'UNPAID';
  isRoomCharged: boolean;
  linkedReservation?: string;
}

export interface PaymentInvoiceRecord {
  id: string;
  date: string;
  referenceNo: string;
  transactionType: 'HOTEL_INVOICE' | 'RESTAURANT_ORDER' | 'ROOM_CHARGE_POSTING' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  description: string;
  amount: number;
  paymentMethod: string;
  status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'REFUNDED';
  isCreditAdjustment?: boolean;
}

export interface GuestNoteRecord {
  id: string;
  note: string;
  category: 'ROOM_PREFERENCE' | 'FOOD_PREFERENCE' | 'GENERAL' | 'SPECIAL_REQUEST';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isArchived?: boolean;
}

export interface GuestDocumentRecord {
  id: string;
  title: string;
  docType: 'Citizenship' | 'Passport' | 'Driving License' | 'National ID' | 'Registration Form (GRC)' | 'Visa / Entry Stamp' | 'Other';
  docNumber?: string;
  fileType: 'pdf' | 'jpg' | 'png';
  fileSize: string;
  uploadedAt: string;
  uploadedBy?: string;
  visitRef?: string;
  status: 'VERIFIED' | 'PENDING';
  fileUrl?: string;
}

export interface Guest360ProfileRecord {
  id: string; // GST-001
  legacyId?: string; // gst-101
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  idType: string;
  idNumber: string;
  memberSince: string;
  vipTier: 'SILVER' | 'GOLD' | 'PLATINUM';
  currentStatus: 'IN_HOUSE' | 'RESERVED' | 'CHECKED_OUT';
  currentRoom?: string;

  // Spending & Activity Metrics
  totalVisits: number;
  totalNights: number;
  totalSpending: number;
  roomSpending: number;
  restaurantSpending: number;
  otherServicesSpending: number;
  totalPaid: number;
  outstandingBalance: number;
  totalRefunds: number;
  lastVisitDate: string;

  // History & Sub-records
  visits: HotelVisitRecord[];
  restaurantOrders: RestaurantHistoryOrder[];
  paymentsAndInvoices: PaymentInvoiceRecord[];
  notes: GuestNoteRecord[];
  documents?: GuestDocumentRecord[];
}

// ============================================================================
// INITIAL REALISTIC HIGH-FIDELITY GUEST 360 DATA
// Exact match with user prompt specifications for Ram Sharma (GST-001)
// ============================================================================

export const INITIAL_GUEST_360_PROFILES: Guest360ProfileRecord[] = [
  {
    id: 'GST-001',
    legacyId: 'gst-101',
    fullName: 'Ram Sharma',
    firstName: 'Ram',
    lastName: 'Sharma',
    phone: '9841234567',
    email: 'ram.sharma@example.com',
    address: 'New Baneshwor, Ward 10, Kathmandu',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-01-72-0451',
    memberSince: '2024-01-15',
    vipTier: 'GOLD',
    currentStatus: 'CHECKED_OUT',
    totalVisits: 10,
    totalNights: 18,
    totalSpending: 85000,
    roomSpending: 55000,
    restaurantSpending: 12000,
    otherServicesSpending: 18000,
    totalPaid: 85000,
    outstandingBalance: 0,
    totalRefunds: 0,
    lastVisitDate: '2026-11-22',
    visits: [
      {
        visitNumber: 10,
        reservationNumber: 'RES-010',
        checkIn: '2026-11-20',
        checkOut: '2026-11-22',
        checkInTime: '12:30 PM',
        checkOutTime: '11:15 AM',
        roomNumber: '203',
        roomType: 'Executive Deluxe Suite',
        durationNights: 2,
        guestsCount: 2,
        bookingSource: 'Direct Front Desk',
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1500,
        otherServices: 300,
        totalVisitAmount: 7800,
        amountPaid: 7800,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-101',
            orderDate: '2026-11-20',
            orderTime: '01:45 PM',
            itemsSummary: 'Chicken Momo (2), Coke (2)',
            items: [
              { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
              { id: 'it-2', name: 'Coke', quantity: 2, price: 70, total: 140 },
            ],
            amount: 500,
            paymentType: 'ROOM_CHARGE',
            paymentMethod: 'Room Charge',
            status: 'SETTLED',
          },
          {
            orderNumber: 'ORD-102',
            orderDate: '2026-11-21',
            orderTime: '08:30 AM',
            itemsSummary: 'Chowmein (2), Milk Tea (2)',
            items: [
              { id: 'it-3', name: 'Chowmein', quantity: 2, price: 160, total: 320 },
              { id: 'it-4', name: 'Milk Tea', quantity: 2, price: 40, total: 80 },
            ],
            amount: 400,
            paymentType: 'PAID_DIRECT',
            paymentMethod: 'Fonepay',
            status: 'SETTLED',
          },
          {
            orderNumber: 'ORD-103',
            orderDate: '2026-11-21',
            orderTime: '07:30 PM',
            itemsSummary: 'Pizza (1), Fresh Juice (2)',
            items: [
              { id: 'it-5', name: 'Pizza', quantity: 1, price: 420, total: 420 },
              { id: 'it-6', name: 'Fresh Juice', quantity: 2, price: 90, total: 180 },
            ],
            amount: 600,
            paymentType: 'ROOM_CHARGE',
            paymentMethod: 'Room Charge',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [
          { id: 'srv-1', serviceName: 'Express Laundry Service', date: '2026-11-21', amount: 300, referenceNo: 'LND-894' },
        ],
      },
      {
        visitNumber: 9,
        reservationNumber: 'RES-009',
        checkIn: '2026-10-15',
        checkOut: '2026-10-17',
        roomNumber: '203',
        roomType: 'Executive Deluxe Suite',
        durationNights: 2,
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1400,
        otherServices: 2200,
        totalVisitAmount: 9600,
        amountPaid: 9600,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-089',
            orderDate: '2026-10-15',
            itemsSummary: 'Chicken Momo (2), Coke (1), Coffee (2)',
            items: [
              { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
              { id: 'it-2', name: 'Coke', quantity: 1, price: 70, total: 70 },
              { id: 'it-7', name: 'Coffee', quantity: 2, price: 100, total: 200 },
            ],
            amount: 630,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
          {
            orderNumber: 'ORD-092',
            orderDate: '2026-10-16',
            itemsSummary: 'Chicken Biryani (2), Butter Naan (2)',
            items: [
              { id: 'it-8', name: 'Chicken Biryani', quantity: 2, price: 300, total: 600 },
              { id: 'it-9', name: 'Butter Naan', quantity: 2, price: 85, total: 170 },
            ],
            amount: 770,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [
          { id: 'srv-2', serviceName: 'Airport Pick-up Shuttle', date: '2026-10-15', amount: 2200 },
        ],
      },
      {
        visitNumber: 8,
        reservationNumber: 'RES-008',
        checkIn: '2026-09-02',
        checkOut: '2026-09-04',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        durationNights: 2,
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1200,
        otherServices: 1800,
        totalVisitAmount: 9000,
        amountPaid: 9000,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-076',
            orderDate: '2026-09-02',
            itemsSummary: 'Buff Momo (2), Chowmein (2), Milk Tea (2)',
            items: [
              { id: 'it-8-1', name: 'Buff Momo', quantity: 2, price: 220, total: 440 },
              { id: 'it-8-2', name: 'Chowmein', quantity: 2, price: 320, total: 640 },
              { id: 'it-8-3', name: 'Milk Tea', quantity: 2, price: 60, total: 120 },
            ],
            amount: 1200,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [
          { id: 'srv-3', serviceName: 'Spa & Wellness Session', date: '2026-09-03', amount: 1800 },
        ],
      },
      {
        visitNumber: 7,
        reservationNumber: 'RES-007',
        checkIn: '2026-07-12',
        checkOut: '2026-07-14',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        durationNights: 2,
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1100,
        otherServices: 1900,
        totalVisitAmount: 9000,
        amountPaid: 9000,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-065',
            orderDate: '2026-07-12',
            itemsSummary: 'Chicken Burger (2), French Fries (2), Coke (2)',
            items: [
              { id: 'it-7-1', name: 'Chicken Burger', quantity: 2, price: 350, total: 700 },
              { id: 'it-7-2', name: 'French Fries', quantity: 2, price: 130, total: 260 },
              { id: 'it-7-3', name: 'Coke', quantity: 2, price: 70, total: 140 },
            ],
            amount: 1100,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 6,
        reservationNumber: 'RES-006',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        roomNumber: '203',
        roomType: 'Executive Deluxe Suite',
        durationNights: 2,
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1300,
        otherServices: 2000,
        totalVisitAmount: 9300,
        amountPaid: 9300,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-054',
            orderDate: '2026-05-20',
            itemsSummary: 'Pasta Alfredo (2), Garlic Bread (1), Iced Tea (2)',
            items: [
              { id: 'it-6-1', name: 'Pasta Alfredo', quantity: 2, price: 450, total: 900 },
              { id: 'it-6-2', name: 'Garlic Bread', quantity: 1, price: 160, total: 160 },
              { id: 'it-6-3', name: 'Iced Tea', quantity: 2, price: 120, total: 240 },
            ],
            amount: 1300,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 5,
        reservationNumber: 'RES-005',
        checkIn: '2026-04-05',
        checkOut: '2026-04-07',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        durationNights: 2,
        roomRatePerNight: 3000,
        roomCharges: 6000,
        restaurantSpending: 1200,
        otherServices: 2200,
        totalVisitAmount: 9400,
        amountPaid: 9400,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-043',
            orderDate: '2026-04-05',
            itemsSummary: 'Chicken Steam Momo (3), Cold Drink (2)',
            items: [
              { id: 'it-5-1', name: 'Chicken Steam Momo', quantity: 3, price: 350, total: 1050 },
              { id: 'it-5-2', name: 'Cold Drink', quantity: 2, price: 75, total: 150 },
            ],
            amount: 1200,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 4,
        reservationNumber: 'RES-004',
        checkIn: '2026-02-18',
        checkOut: '2026-02-20',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        durationNights: 2,
        roomRatePerNight: 2800,
        roomCharges: 5600,
        restaurantSpending: 1150,
        otherServices: 2250,
        totalVisitAmount: 9000,
        amountPaid: 9000,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-032',
            orderDate: '2026-02-18',
            itemsSummary: 'Chicken Sekuwa (2), Khaja Set (2), Coke (2)',
            items: [
              { id: 'it-4-1', name: 'Chicken Sekuwa', quantity: 2, price: 320, total: 640 },
              { id: 'it-4-2', name: 'Khaja Set', quantity: 2, price: 185, total: 370 },
              { id: 'it-4-3', name: 'Coke', quantity: 2, price: 70, total: 140 },
            ],
            amount: 1150,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 3,
        reservationNumber: 'RES-003',
        checkIn: '2026-01-10',
        checkOut: '2026-01-12',
        roomNumber: '102',
        roomType: 'Deluxe Garden Suite',
        durationNights: 2,
        roomRatePerNight: 2700,
        roomCharges: 5400,
        restaurantSpending: 1100,
        otherServices: 2000,
        totalVisitAmount: 8500,
        amountPaid: 8500,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-021',
            orderDate: '2026-01-10',
            itemsSummary: 'Fried Rice (2), Chilli Chicken (1), Lemon Soda (2)',
            items: [
              { id: 'it-3-1', name: 'Fried Rice', quantity: 2, price: 280, total: 560 },
              { id: 'it-3-2', name: 'Chilli Chicken', quantity: 1, price: 400, total: 400 },
              { id: 'it-3-3', name: 'Lemon Soda', quantity: 2, price: 70, total: 140 },
            ],
            amount: 1100,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 2,
        reservationNumber: 'RES-002',
        checkIn: '2025-11-25',
        checkOut: '2025-11-26',
        roomNumber: '104',
        roomType: 'Standard Room',
        durationNights: 1,
        roomRatePerNight: 2400,
        roomCharges: 2400,
        restaurantSpending: 1050,
        otherServices: 1850,
        totalVisitAmount: 5300,
        amountPaid: 5300,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-012',
            orderDate: '2025-11-25',
            itemsSummary: 'Club Sandwich (2), Coffee (2), Brownie (1)',
            items: [
              { id: 'it-2-1', name: 'Club Sandwich', quantity: 2, price: 320, total: 640 },
              { id: 'it-2-2', name: 'Coffee', quantity: 2, price: 110, total: 220 },
              { id: 'it-2-3', name: 'Brownie', quantity: 1, price: 190, total: 190 },
            ],
            amount: 1050,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
      {
        visitNumber: 1,
        reservationNumber: 'RES-001',
        checkIn: '2025-10-04',
        checkOut: '2025-10-05',
        roomNumber: '104',
        roomType: 'Standard Room',
        durationNights: 1,
        roomRatePerNight: 5600,
        roomCharges: 5600,
        restaurantSpending: 1000,
        otherServices: 1500,
        totalVisitAmount: 8100,
        amountPaid: 8100,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_OUT',
        restaurantOrders: [
          {
            orderNumber: 'ORD-003',
            orderDate: '2025-10-04',
            itemsSummary: 'Chicken Chowmein (2), Masala Tea (2), Coke (2)',
            items: [
              { id: 'it-1-1', name: 'Chicken Chowmein', quantity: 2, price: 360, total: 720 },
              { id: 'it-1-2', name: 'Masala Tea', quantity: 2, price: 70, total: 140 },
              { id: 'it-1-3', name: 'Coke', quantity: 2, price: 70, total: 140 },
            ],
            amount: 1000,
            paymentType: 'ROOM_CHARGE',
            status: 'SETTLED',
          },
        ],
        otherServicesList: [],
      },
    ],
    restaurantOrders: [
      {
        id: 'ro-1',
        orderNumber: 'ORD-101',
        orderDate: '2026-11-20',
        orderTime: '01:45 PM',
        orderType: 'ROOM_SERVICE',
        tableOrSource: 'Room 203',
        itemsSummary: 'Chicken Momo (2), Coke (2)',
        items: [
          { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
          { id: 'it-2', name: 'Coke', quantity: 2, price: 70, total: 140 },
        ],
        totalAmount: 500,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
        linkedReservation: 'RES-010',
      },
      {
        id: 'ro-2',
        orderNumber: 'ORD-102',
        orderDate: '2026-11-21',
        orderTime: '08:30 AM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-4',
        itemsSummary: 'Chowmein (2), Milk Tea (2)',
        items: [
          { id: 'it-3', name: 'Chowmein', quantity: 2, price: 160, total: 320 },
          { id: 'it-4', name: 'Milk Tea', quantity: 2, price: 40, total: 80 },
        ],
        totalAmount: 400,
        paymentMethod: 'Fonepay',
        paymentStatus: 'PAID',
        isRoomCharged: false,
        linkedReservation: 'RES-010',
      },
      {
        id: 'ro-3',
        orderNumber: 'ORD-103',
        orderDate: '2026-11-21',
        orderTime: '07:30 PM',
        orderType: 'ROOM_SERVICE',
        tableOrSource: 'Room 203',
        itemsSummary: 'Pizza (1), Fresh Juice (2)',
        items: [
          { id: 'it-5', name: 'Pizza', quantity: 1, price: 420, total: 420 },
          { id: 'it-6', name: 'Fresh Juice', quantity: 2, price: 90, total: 180 },
        ],
        totalAmount: 600,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
        linkedReservation: 'RES-010',
      },
      {
        id: 'ro-4',
        orderNumber: 'ORD-089',
        orderDate: '2026-10-15',
        orderTime: '06:15 PM',
        orderType: 'ROOM_SERVICE',
        tableOrSource: 'Room 203',
        itemsSummary: 'Chicken Momo (2), Coke (1), Coffee (2)',
        items: [
          { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
          { id: 'it-2', name: 'Coke', quantity: 1, price: 70, total: 70 },
          { id: 'it-7', name: 'Coffee', quantity: 2, price: 100, total: 200 },
        ],
        totalAmount: 630,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
        linkedReservation: 'RES-009',
      },
      {
        id: 'ro-5',
        orderNumber: 'ORD-092',
        orderDate: '2026-10-16',
        orderTime: '08:00 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-2',
        itemsSummary: 'Chicken Biryani (2), Butter Naan (2)',
        items: [
          { id: 'it-8', name: 'Chicken Biryani', quantity: 2, price: 300, total: 600 },
          { id: 'it-9', name: 'Butter Naan', quantity: 2, price: 85, total: 170 },
        ],
        totalAmount: 770,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
        linkedReservation: 'RES-009',
      },
      {
        id: 'ro-6',
        orderNumber: 'ORD-076',
        orderDate: '2026-09-03',
        orderTime: '01:00 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-5',
        itemsSummary: 'Chicken Momo (4), Coke (2)',
        items: [
          { id: 'it-1', name: 'Chicken Momo', quantity: 4, price: 180, total: 720 },
          { id: 'it-2', name: 'Coke', quantity: 2, price: 70, total: 140 },
        ],
        totalAmount: 860,
        paymentMethod: 'Cash',
        paymentStatus: 'PAID',
        isRoomCharged: false,
      },
      {
        id: 'ro-7',
        orderNumber: 'ORD-065',
        orderDate: '2026-08-10',
        orderTime: '02:30 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-1',
        itemsSummary: 'Chowmein (3), Coke (2), Chicken Momo (2)',
        items: [
          { id: 'it-3', name: 'Chowmein', quantity: 3, price: 160, total: 480 },
          { id: 'it-2', name: 'Coke', quantity: 2, price: 70, total: 140 },
          { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
        ],
        totalAmount: 980,
        paymentMethod: 'Card',
        paymentStatus: 'PAID',
        isRoomCharged: false,
      },
      {
        id: 'ro-8',
        orderNumber: 'ORD-051',
        orderDate: '2026-07-13',
        orderTime: '07:45 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-3',
        itemsSummary: 'Pizza (2), Chowmein (2)',
        items: [
          { id: 'it-5', name: 'Pizza', quantity: 2, price: 420, total: 840 },
          { id: 'it-3', name: 'Chowmein', quantity: 2, price: 160, total: 320 },
        ],
        totalAmount: 1160,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
        linkedReservation: 'RES-007',
      },
      {
        id: 'ro-9',
        orderNumber: 'ORD-038',
        orderDate: '2026-05-21',
        orderTime: '08:15 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-6',
        itemsSummary: 'Chicken Momo (2), Pizza (1)',
        items: [
          { id: 'it-1', name: 'Chicken Momo', quantity: 2, price: 180, total: 360 },
          { id: 'it-5', name: 'Pizza', quantity: 1, price: 420, total: 420 },
        ],
        totalAmount: 780,
        paymentMethod: 'Cash',
        paymentStatus: 'PAID',
        isRoomCharged: false,
      },
      {
        id: 'ro-10',
        orderNumber: 'ORD-019',
        orderDate: '2026-03-12',
        orderTime: '12:45 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-4',
        itemsSummary: 'Chowmein (1), Chicken Biryani (1)',
        items: [
          { id: 'it-3', name: 'Chowmein', quantity: 1, price: 160, total: 160 },
          { id: 'it-8', name: 'Chicken Biryani', quantity: 1, price: 300, total: 300 },
        ],
        totalAmount: 460,
        paymentMethod: 'Fonepay',
        paymentStatus: 'PAID',
        isRoomCharged: false,
      },
    ],
    paymentsAndInvoices: [
      {
        id: 'tx-1',
        date: '2026-11-22',
        referenceNo: 'INV-2026-1120',
        transactionType: 'HOTEL_INVOICE',
        description: 'Settlement for Stay RES-010 (2 nights Room 203 + Services)',
        amount: 7800,
        paymentMethod: 'Fonepay',
        status: 'PAID',
      },
      {
        id: 'tx-2',
        date: '2026-11-21',
        referenceNo: 'PAY-ORD-102',
        transactionType: 'PAYMENT',
        description: 'Direct Payment for Dining Order ORD-102',
        amount: 400,
        paymentMethod: 'Fonepay',
        status: 'PAID',
      },
      {
        id: 'tx-3',
        date: '2026-10-17',
        referenceNo: 'INV-2026-1015',
        transactionType: 'HOTEL_INVOICE',
        description: 'Folio Settlement for Stay RES-009',
        amount: 9600,
        paymentMethod: 'Card',
        status: 'PAID',
      },
      {
        id: 'tx-4',
        date: '2026-09-04',
        referenceNo: 'INV-2026-0902',
        transactionType: 'HOTEL_INVOICE',
        description: 'Folio Settlement for Stay RES-008',
        amount: 9000,
        paymentMethod: 'Cash',
        status: 'PAID',
      },
    ],
    notes: [
      {
        id: 'nt-1',
        note: 'Prefers Room 203 when available. Enjoys upper floor garden & mountain view.',
        category: 'ROOM_PREFERENCE',
        createdBy: 'Front Desk Supervisor',
        createdAt: '2026-10-15',
      },
      {
        id: 'nt-2',
        note: 'Usually orders Chicken Momo with extra spicy tomato chutney.',
        category: 'FOOD_PREFERENCE',
        createdBy: 'Head Chef / POS Cashier',
        createdAt: '2026-10-16',
      },
      {
        id: 'nt-3',
        note: 'Prefers a quiet room away from the main elevator shaft.',
        category: 'SPECIAL_REQUEST',
        createdBy: 'Operations Manager',
        createdAt: '2026-09-02',
      },
      {
        id: 'nt-4',
        note: 'Usually requests early check-in (11:00 AM) when arriving from morning domestic flights.',
        category: 'GENERAL',
        createdBy: 'Front Desk Staff',
        createdAt: '2026-07-12',
      },
    ],
    documents: [
      {
        id: 'doc-001',
        title: 'Citizenship Certificate (Front & Back)',
        docType: 'Citizenship',
        docNumber: '27-01-72-0451',
        fileType: 'pdf',
        fileSize: '1.4 MB',
        uploadedAt: '2024-01-15',
        uploadedBy: 'Front Desk Reception',
        status: 'VERIFIED',
      },
      {
        id: 'doc-002',
        title: 'Guest Registration Card (GRC)',
        docType: 'Registration Form (GRC)',
        docNumber: 'RES-010',
        fileType: 'pdf',
        fileSize: '840 KB',
        uploadedAt: '2026-11-20',
        uploadedBy: 'Front Desk Check-in',
        visitRef: 'RES-010',
        status: 'VERIFIED',
      },
      {
        id: 'doc-003',
        title: 'National Driving License',
        docType: 'Driving License',
        docNumber: 'DL-01-55-9012',
        fileType: 'jpg',
        fileSize: '2.2 MB',
        uploadedAt: '2025-04-12',
        uploadedBy: 'Front Desk Reception',
        status: 'VERIFIED',
      },
    ],
  },
  {
    id: 'GST-002',
    legacyId: 'gst-102',
    fullName: 'Priya Sharma',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '9801987654',
    email: 'priya.sharma@nepalcorp.com',
    address: 'Jhamsikhel, Lalitpur',
    country: 'Nepal',
    idType: 'National ID',
    idNumber: '102-4589-99',
    memberSince: '2023-08-20',
    vipTier: 'PLATINUM',
    currentStatus: 'IN_HOUSE',
    currentRoom: '201',
    totalVisits: 12,
    totalNights: 28,
    totalSpending: 148500,
    roomSpending: 112000,
    restaurantSpending: 24500,
    otherServicesSpending: 12000,
    totalPaid: 148500,
    outstandingBalance: 0,
    totalRefunds: 0,
    lastVisitDate: '2026-11-23',
    visits: [
      {
        visitNumber: 12,
        reservationNumber: 'BK-2001',
        checkIn: '2026-11-20',
        checkOut: '2026-11-24',
        roomNumber: '201',
        roomType: 'Executive Ocean Suite',
        durationNights: 4,
        roomRatePerNight: 4900,
        roomCharges: 19600,
        restaurantSpending: 7800,
        otherServices: 1500,
        totalVisitAmount: 28900,
        amountPaid: 28900,
        balanceDue: 0,
        paymentStatus: 'PAID',
        reservationStatus: 'CHECKED_IN',
        restaurantOrders: [],
        otherServicesList: [],
      },
    ],
    restaurantOrders: [
      {
        id: 'ro-p1',
        orderNumber: 'ORD-201',
        orderDate: '2026-11-21',
        orderTime: '08:15 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table VIP-1',
        itemsSummary: 'Grilled Salmon (2), Red Wine (1), Caesar Salad (2)',
        items: [
          { id: 'it-s1', name: 'Grilled Salmon', quantity: 2, price: 1400, total: 2800 },
          { id: 'it-s2', name: 'Red Wine', quantity: 1, price: 3200, total: 3200 },
          { id: 'it-s3', name: 'Caesar Salad', quantity: 2, price: 450, total: 900 },
        ],
        totalAmount: 6900,
        paymentMethod: 'Room Charge',
        paymentStatus: 'BILLED_TO_ROOM',
        isRoomCharged: true,
      },
    ],
    paymentsAndInvoices: [],
    notes: [
      {
        id: 'nt-p1',
        note: 'Corporate account executive. Always provide late checkout when available.',
        category: 'SPECIAL_REQUEST',
        createdBy: 'General Manager',
        createdAt: '2024-02-10',
      },
    ],
  },
  {
    id: 'GST-003',
    legacyId: 'gst-103',
    fullName: 'Bikash Gurung',
    firstName: 'Bikash',
    lastName: 'Gurung',
    phone: '9856012345',
    email: 'bikash.gurung@outlook.com',
    address: 'Lakeside 6, Pokhara',
    country: 'Nepal',
    idType: 'Driving License',
    idNumber: 'DL-06-88741',
    memberSince: '2024-04-10',
    vipTier: 'SILVER',
    currentStatus: 'IN_HOUSE',
    currentRoom: '104',
    totalVisits: 2,
    totalNights: 5,
    totalSpending: 12000,
    roomSpending: 9600,
    restaurantSpending: 2400,
    otherServicesSpending: 0,
    totalPaid: 12000,
    outstandingBalance: 0,
    totalRefunds: 0,
    lastVisitDate: '2026-11-23',
    visits: [],
    restaurantOrders: [],
    paymentsAndInvoices: [],
    notes: [],
  },
  {
    id: 'GST-004',
    legacyId: 'gst-104',
    fullName: 'Siddharth Shrestha',
    firstName: 'Siddharth',
    lastName: 'Shrestha',
    phone: '9813245678',
    email: 'siddharth@shresthait.com',
    address: 'New Road, Kathmandu',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-02-74-8841',
    memberSince: '2024-02-14',
    vipTier: 'GOLD',
    currentStatus: 'RESERVED',
    currentRoom: '101',
    totalVisits: 6,
    totalNights: 14,
    totalSpending: 42000,
    roomSpending: 35000,
    restaurantSpending: 7000,
    otherServicesSpending: 0,
    totalPaid: 35000,
    outstandingBalance: 7000,
    totalRefunds: 0,
    lastVisitDate: '2026-11-20',
    visits: [],
    restaurantOrders: [],
    paymentsAndInvoices: [],
    notes: [],
  },
  {
    id: 'GST-005',
    legacyId: 'gst-105',
    fullName: 'Elena Rostova',
    firstName: 'Elena',
    lastName: 'Rostova',
    phone: '+44 7911 123456',
    email: 'elena.rostova@traveler.co.uk',
    address: '14 Kensington High St, London',
    country: 'United Kingdom',
    idType: 'Passport',
    idNumber: 'GB94827104',
    memberSince: '2023-11-05',
    vipTier: 'PLATINUM',
    currentStatus: 'CHECKED_OUT',
    totalVisits: 10,
    totalNights: 26,
    totalSpending: 118400,
    roomSpending: 89000,
    restaurantSpending: 21400,
    otherServicesSpending: 8000,
    totalPaid: 118400,
    outstandingBalance: 0,
    totalRefunds: 0,
    lastVisitDate: '2026-10-26',
    visits: [],
    restaurantOrders: [],
    paymentsAndInvoices: [],
    notes: [],
  },
  {
    id: 'CUST-101',
    fullName: 'Sunita Thapa',
    firstName: 'Sunita',
    lastName: 'Thapa',
    phone: '9841998877',
    email: 'sunita.thapa@gmail.com',
    address: 'Pulchowk, Lalitpur',
    country: 'Nepal',
    idType: 'Citizenship',
    idNumber: '27-01-79-1122',
    memberSince: '2024-03-01',
    vipTier: 'SILVER',
    currentStatus: 'CHECKED_OUT',
    totalVisits: 0,
    totalNights: 0,
    totalSpending: 18500,
    roomSpending: 0,
    restaurantSpending: 18500,
    otherServicesSpending: 0,
    totalPaid: 18500,
    outstandingBalance: 0,
    totalRefunds: 0,
    lastVisitDate: '2026-11-18',
    visits: [],
    restaurantOrders: [
      {
        id: 'ro-sunita-1',
        orderNumber: 'ORD-980',
        orderDate: '2026-11-18',
        orderTime: '01:30 PM',
        orderType: 'DINE_IN',
        tableOrSource: 'Table T-8',
        itemsSummary: 'Buff Momo (3), Cold Coffee (2)',
        items: [
          { id: 'it-b1', name: 'Buff Momo', quantity: 3, price: 170, total: 510 },
          { id: 'it-b2', name: 'Cold Coffee', quantity: 2, price: 140, total: 280 },
        ],
        totalAmount: 790,
        paymentMethod: 'Fonepay',
        paymentStatus: 'PAID',
        isRoomCharged: false,
      },
    ],
    paymentsAndInvoices: [],
    notes: [
      {
        id: 'nt-sunita-1',
        note: 'Regular lunch diner from nearby corporate office.',
        category: 'GENERAL',
        createdBy: 'POS Manager',
        createdAt: '2024-03-15',
      },
    ],
  },
];

// ============================================================================
// STORAGE & AGGREGATION UTILITIES
// ============================================================================

const STORAGE_KEY_GUEST_360 = 'hotel_guest_360_profiles';
const STORAGE_KEY_BUSINESS_MODE = 'hotel_business_mode_config';

export function loadGuest360Profiles(): Guest360ProfileRecord[] {
  if (typeof window === 'undefined') return INITIAL_GUEST_360_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GUEST_360);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GUEST_360, JSON.stringify(INITIAL_GUEST_360_PROFILES));
      return INITIAL_GUEST_360_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GUEST_360_PROFILES;
  }
}

export function saveGuest360Profiles(profiles: Guest360ProfileRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GUEST_360, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent('guest_360_updated'));
  } catch (err) {
    console.error('Failed to save guest 360 profiles:', err);
  }
}

export function getBusinessMode(): BusinessMode {
  if (typeof window === 'undefined') return 'HOTEL_AND_RESTAURANT';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BUSINESS_MODE) as BusinessMode;
    return saved || 'HOTEL_AND_RESTAURANT';
  } catch {
    return 'HOTEL_AND_RESTAURANT';
  }
}

export function saveBusinessMode(mode: BusinessMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESS_MODE, mode);
    window.dispatchEvent(new CustomEvent('business_mode_updated'));
  } catch (err) {
    console.error('Failed to save business mode:', err);
  }
}

/**
 * Calculates top frequently ordered items with exact occurrence counts
 */
export function getFrequentlyOrderedItems(orders: RestaurantHistoryOrder[]): { name: string; count: number }[] {
  const counts: Record<string, number> = {};

  orders.forEach((ord) => {
    (ord.items || []).forEach((it) => {
      const normalizedName = it.name.trim();
      counts[normalizedName] = (counts[normalizedName] || 0) + (it.quantity || 1);
    });
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

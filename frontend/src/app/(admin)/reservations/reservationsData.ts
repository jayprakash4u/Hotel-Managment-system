// Shared types, mock data, and storage helpers for Room Reservations

export interface CafeOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CafeOrder {
  id: string;
  orderNumber: string;
  timestamp: string;
  status: 'DELIVERED' | 'PREPARING' | 'BILLED';
  items: CafeOrderItem[];
  subtotal: number;
}

export interface PaymentEntry {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
  type: 'ADVANCE' | 'PARTIAL' | 'SETTLEMENT';
  notes?: string;
}

export interface PastBookingRecord {
  bookingCode: string;
  roomNumber: string;
  roomType: string;
  dates: string;
  amount: number;
  status: string;
}

export interface RoomBooking {
  id: string;
  bookingCode: string; // e.g. BK-1001
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED';
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    idType: string;
    idNumber: string;
    country: string;
    vipTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  };
  room: {
    id: string;
    number: string;
    type: string;
    acType: 'AC' | 'Non-AC';
    bedType: string;
    floorLevel: string;
    pricePerNight: number;
  };
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  roomCharges: number;
  cafeOrders: CafeOrder[];
  payments: PaymentEntry[];
  bookingHistory: PastBookingRecord[];
  notes?: string;
}

export const INITIAL_BOOKINGS: RoomBooking[] = [
  {
    id: 'bk-1001',
    bookingCode: 'BK-1001',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-1',
      firstName: 'Ram',
      lastName: 'Sharma',
      phone: '+977 9841234567',
      email: 'ram.sharma@gmail.com',
      address: 'New Baneshwor, Kathmandu',
      idType: 'Citizenship',
      idNumber: 'CT-27-01-72-0451',
      country: 'Nepal',
      vipTier: 'GOLD',
    },
    room: {
      id: 'rm-101',
      number: '101',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-15',
    checkOut: '2026-10-17',
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [
      {
        id: 'ord-101',
        orderNumber: 'CO-201',
        timestamp: '15 Oct 2026, 02:45 PM',
        status: 'DELIVERED',
        subtotal: 850,
        items: [
          { id: 'it-1', name: 'Chicken Steam Momo', quantity: 2, price: 250, total: 500 },
          { id: 'it-2', name: 'Fresh Masala Tea', quantity: 2, price: 80, total: 160 },
          { id: 'it-3', name: 'Crispy French Fries', quantity: 1, price: 190, total: 190 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-1',
        receiptNo: 'REC-1001-A',
        date: '15 Oct 2026, 11:30 AM',
        amount: 3000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Advance deposit paid at check-in counter',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0894',
        roomNumber: '104',
        roomType: 'Standard Room',
        dates: '12 Aug 2026 – 14 Aug 2026',
        amount: 4800,
        status: 'Completed',
      },
      {
        bookingCode: 'BK-0721',
        roomNumber: '102',
        roomType: 'Deluxe Room',
        dates: '02 Jan 2026 – 04 Jan 2026',
        amount: 7000,
        status: 'Completed',
      },
    ],
    notes: 'Airport pickup requested on arrival. Prefers quiet corner room.',
  },
  {
    id: 'bk-1002',
    bookingCode: 'BK-1002',
    status: 'RESERVED',
    guest: {
      id: 'gst-2',
      firstName: 'Sita',
      lastName: 'Rai',
      phone: '+977 9801987654',
      email: 'sita.rai@outlook.com',
      address: 'Dharan, Sunsari',
      idType: 'National ID',
      idNumber: 'NID-98213401',
      country: 'Nepal',
      vipTier: 'STANDARD',
    },
    room: {
      id: 'rm-103',
      number: '103',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-16',
    checkOut: '2026-10-18',
    nights: 2,
    roomCharges: 4000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-2',
        receiptNo: 'REC-1002-A',
        date: '14 Oct 2026, 04:15 PM',
        amount: 1500,
        method: 'ESEWA_KHALTI',
        type: 'ADVANCE',
        notes: 'Online booking advance reservation deposit',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0610',
        roomNumber: '103',
        roomType: 'Standard Room',
        dates: '10 May 2026 – 12 May 2026',
        amount: 4000,
        status: 'Completed',
      },
    ],
    notes: 'Late arrival expected around 7:00 PM. Twin bed arrangement requested.',
  },
  {
    id: 'bk-1003',
    bookingCode: 'BK-1003',
    status: 'CHECKED_OUT',
    guest: {
      id: 'gst-3',
      firstName: 'Hari',
      lastName: 'Thapa',
      phone: '+977 9813554433',
      email: 'hari.thapa@nepalmail.com',
      address: 'Lakeside, Pokhara',
      idType: 'Driving License',
      idNumber: 'DL-01-09-54321',
      country: 'Nepal',
      vipTier: 'STANDARD',
    },
    room: {
      id: 'rm-102',
      number: '102',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-14',
    checkOut: '2026-10-15',
    nights: 1,
    roomCharges: 3500,
    cafeOrders: [
      {
        id: 'ord-102',
        orderNumber: 'CO-198',
        timestamp: '14 Oct 2026, 08:30 PM',
        status: 'BILLED',
        subtotal: 420,
        items: [
          { id: 'it-4', name: 'Club Chicken Sandwich', quantity: 1, price: 300, total: 300 },
          { id: 'it-5', name: 'Americano Coffee', quantity: 1, price: 120, total: 120 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-3',
        receiptNo: 'REC-1003-A',
        date: '14 Oct 2026, 01:00 PM',
        amount: 2000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Deposit received during check-in',
      },
      {
        id: 'pay-4',
        receiptNo: 'REC-1003-F',
        date: '15 Oct 2026, 11:45 AM',
        amount: 1920,
        method: 'CARD',
        type: 'SETTLEMENT',
        notes: 'Final settlement paid during checkout',
      },
    ],
    bookingHistory: [],
    notes: 'Checked out cleanly at 11:45 AM. Key card returned.',
  },
  {
    id: 'bk-1004',
    bookingCode: 'BK-1004',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-4',
      firstName: 'Bikash',
      lastName: 'Gurung',
      phone: '+977 9856011223',
      email: 'bikash.gurung@gmail.com',
      address: 'Butwal, Rupandehi',
      idType: 'Citizenship',
      idNumber: 'CT-38-02-74-8899',
      country: 'Nepal',
      vipTier: 'SILVER',
    },
    room: {
      id: 'rm-104',
      number: '104',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-13',
    checkOut: '2026-10-16',
    nights: 3,
    roomCharges: 6000,
    cafeOrders: [
      {
        id: 'ord-103',
        orderNumber: 'CO-195',
        timestamp: '14 Oct 2026, 09:10 AM',
        status: 'DELIVERED',
        subtotal: 650,
        items: [
          { id: 'it-6', name: 'Continental Breakfast', quantity: 1, price: 450, total: 450 },
          { id: 'it-7', name: 'Fresh Orange Juice', quantity: 1, price: 200, total: 200 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-5',
        receiptNo: 'REC-1004-A',
        date: '13 Oct 2026, 02:00 PM',
        amount: 3000,
        method: 'UPI_QR',
        type: 'ADVANCE',
        notes: 'QR code advance payment',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0511',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '14 Feb 2026 – 16 Feb 2026',
        amount: 7500,
        status: 'Completed',
      },
    ],
    notes: 'Extended stay request possible for 1 more night.',
  },
  {
    id: 'bk-1005',
    bookingCode: 'BK-1005',
    status: 'RESERVED',
    guest: {
      id: 'gst-5',
      firstName: 'Anita',
      lastName: 'Shrestha',
      phone: '+977 9849988776',
      email: 'anita.shrestha@gmail.com',
      address: 'Patan, Lalitpur',
      idType: 'Passport',
      idNumber: 'PP-NP-1299384',
      country: 'Nepal',
      vipTier: 'PLATINUM',
    },
    room: {
      id: 'rm-101',
      number: '101',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-18',
    checkOut: '2026-10-20',
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-6',
        receiptNo: 'REC-1005-A',
        date: '15 Oct 2026, 09:30 AM',
        amount: 3500,
        method: 'BANK_TRANSFER',
        type: 'ADVANCE',
        notes: 'Bank transfer reservation deposit',
      },
    ],
    bookingHistory: [
      {
        bookingCode: 'BK-0775',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '20 Jun 2026 – 22 Jun 2026',
        amount: 7200,
        status: 'Completed',
      },
      {
        bookingCode: 'BK-0420',
        roomNumber: '101',
        roomType: 'Deluxe Room',
        dates: '01 Jan 2026 – 03 Jan 2026',
        amount: 7500,
        status: 'Completed',
      },
    ],
    notes: 'VIP guest. Welcome drinks upon arrival.',
  },
  {
    id: 'bk-0980',
    bookingCode: 'BK-0980',
    status: 'CHECKED_OUT',
    guest: {
      id: 'gst-6',
      firstName: 'Sunita',
      lastName: 'Karki',
      phone: '+977 9841882244',
      email: 'sunita.karki@gmail.com',
      address: 'Jawalakhel, Lalitpur',
      idType: 'Citizenship',
      idNumber: 'CT-28-02-71-3321',
      country: 'Nepal',
      vipTier: 'SILVER',
    },
    room: {
      id: 'rm-102',
      number: '102',
      type: 'Deluxe Room',
      acType: 'AC',
      bedType: 'King Bed',
      floorLevel: '1st Floor',
      pricePerNight: 3500,
    },
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [
      {
        id: 'ord-104',
        orderNumber: 'CO-188',
        timestamp: '11 Oct 2026, 03:20 PM',
        status: 'BILLED',
        subtotal: 490,
        items: [
          { id: 'it-8', name: 'Club Chicken Sandwich', quantity: 1, price: 300, total: 300 },
          { id: 'it-9', name: 'Fresh Lime Soda', quantity: 1, price: 110, total: 110 },
          { id: 'it-10', name: 'Fresh Masala Tea', quantity: 1, price: 80, total: 80 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-7',
        receiptNo: 'REC-0980-A',
        date: '10 Oct 2026, 11:15 AM',
        amount: 3500,
        method: 'BANK_TRANSFER',
        type: 'ADVANCE',
        notes: 'Reservation advance deposit received',
      },
      {
        id: 'pay-8',
        receiptNo: 'REC-0980-F',
        date: '12 Oct 2026, 11:30 AM',
        amount: 3990,
        method: 'CARD',
        type: 'SETTLEMENT',
        notes: 'Room balance & cafe settlement on checkout',
      },
    ],
    bookingHistory: [],
    notes: 'Regular business traveler. Room kept clean and tidy.',
  },
  {
    id: 'bk-0972',
    bookingCode: 'BK-0972',
    status: 'CHECKED_OUT',
    guest: {
      id: 'gst-7',
      firstName: 'Pradeep',
      lastName: 'Adhikari',
      phone: '+977 9801776655',
      email: 'pradeep.adhikari@yahoo.com',
      address: 'Bharatpur, Chitwan',
      idType: 'Driving License',
      idNumber: 'DL-04-03-99881',
      country: 'Nepal',
      vipTier: 'STANDARD',
    },
    room: {
      id: 'rm-103',
      number: '103',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-08',
    checkOut: '2026-10-10',
    nights: 2,
    roomCharges: 4000,
    cafeOrders: [
      {
        id: 'ord-105',
        orderNumber: 'CO-182',
        timestamp: '09 Oct 2026, 07:45 PM',
        status: 'BILLED',
        subtotal: 640,
        items: [
          { id: 'it-11', name: 'Chicken Pizza 9"', quantity: 1, price: 450, total: 450 },
          { id: 'it-12', name: 'Crispy French Fries', quantity: 1, price: 190, total: 190 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-9',
        receiptNo: 'REC-0972-A',
        date: '08 Oct 2026, 01:45 PM',
        amount: 2000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Counter advance receipt',
      },
      {
        id: 'pay-10',
        receiptNo: 'REC-0972-F',
        date: '10 Oct 2026, 10:15 AM',
        amount: 2640,
        method: 'CASH',
        type: 'SETTLEMENT',
        notes: 'Cash checkout settlement',
      },
    ],
    bookingHistory: [],
    notes: 'Requested early check-in at 1:45 PM.',
  },
  {
    id: 'bk-0965',
    bookingCode: 'BK-0965',
    status: 'CHECKED_OUT',
    guest: {
      id: 'gst-8',
      firstName: 'Dorje',
      lastName: 'Lama',
      phone: '+977 9851123456',
      email: 'dorje.lama@everest.np',
      address: 'Namche Bazaar, Solukhumbu',
      idType: 'Passport',
      idNumber: 'PP-NP-9988776',
      country: 'Nepal',
      vipTier: 'GOLD',
    },
    room: {
      id: 'rm-104',
      number: '104',
      type: 'Standard Room',
      acType: 'Non-AC',
      bedType: 'Twin Beds',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: '2026-10-04',
    checkOut: '2026-10-07',
    nights: 3,
    roomCharges: 6000,
    cafeOrders: [
      {
        id: 'ord-106',
        orderNumber: 'CO-175',
        timestamp: '05 Oct 2026, 01:10 PM',
        status: 'BILLED',
        subtotal: 500,
        items: [
          { id: 'it-13', name: 'Chicken Steam Momo', quantity: 2, price: 250, total: 500 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-11',
        receiptNo: 'REC-0965-A',
        date: '04 Oct 2026, 03:00 PM',
        amount: 3000,
        method: 'UPI_QR',
        type: 'ADVANCE',
        notes: 'PhonePe/Fonepay QR advance deposit',
      },
      {
        id: 'pay-12',
        receiptNo: 'REC-0965-F',
        date: '07 Oct 2026, 12:00 PM',
        amount: 3500,
        method: 'ESEWA_KHALTI',
        type: 'SETTLEMENT',
        notes: 'Settled full balance via eSewa digital wallet',
      },
    ],
    bookingHistory: [],
    notes: 'Tour guide organizer. Key returned on checkout.',
  },
];

export interface CancellationRecord {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  cancelledAt: string;
  reason: string;
  originalAmount: number;
  depositPaid: number;
  refundStatus: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND' | 'NO_DEPOSIT';
  refundAmount: number;
  notes?: string;
}

export const INITIAL_CANCELLATIONS: CancellationRecord[] = [
  {
    id: 'can-1',
    bookingCode: 'BK-1006',
    guestName: 'Sita Sharma',
    guestPhone: '+977 9841998877',
    guestEmail: 'sita.sharma@gmail.com',
    roomNumber: '102',
    roomType: 'Deluxe Room',
    checkIn: '2026-10-17',
    checkOut: '2026-10-19',
    nights: 2,
    cancelledAt: '16 Oct 2026, 02:15 PM',
    reason: 'Flight delayed & schedule change due to mountain weather',
    originalAmount: 7000,
    depositPaid: 2000,
    refundStatus: 'FULL_REFUND',
    refundAmount: 2000,
    notes: 'Full deposit returned to guest via eSewa transfer',
  },
  {
    id: 'can-2',
    bookingCode: 'BK-0988',
    guestName: 'Rajesh Khadka',
    guestPhone: '+977 9801239876',
    guestEmail: 'rajesh.khadka@nepalmail.com',
    roomNumber: '104',
    roomType: 'Standard Room',
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    nights: 2,
    cancelledAt: '09 Oct 2026, 11:30 AM',
    reason: 'Family emergency / sudden medical treatment in town',
    originalAmount: 4000,
    depositPaid: 1000,
    refundStatus: 'FULL_REFUND',
    refundAmount: 1000,
    notes: 'Exempted cancellation penalty upon customer medical verification',
  },
  {
    id: 'can-3',
    bookingCode: 'BK-0952',
    guestName: 'Maya Tamang',
    guestPhone: '+977 9818776655',
    guestEmail: 'maya.tamang@yahoo.com',
    roomNumber: '101',
    roomType: 'Deluxe Room',
    checkIn: '2026-10-05',
    checkOut: '2026-10-07',
    nights: 2,
    cancelledAt: '04 Oct 2026, 05:40 PM',
    reason: 'Business workshop postponed to next month',
    originalAmount: 7000,
    depositPaid: 0,
    refundStatus: 'NO_DEPOSIT',
    refundAmount: 0,
    notes: 'Direct phone reservation hold with zero advance collected',
  },
];

export const AVAILABLE_ROOMS_CATALOG = [
  { id: 'rm-101', number: '101', type: 'Deluxe Room', acType: 'AC' as const, bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500 },
  { id: 'rm-102', number: '102', type: 'Deluxe Room', acType: 'AC' as const, bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500 },
  { id: 'rm-103', number: '103', type: 'Standard Room', acType: 'Non-AC' as const, bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000 },
  { id: 'rm-104', number: '104', type: 'Standard Room', acType: 'Non-AC' as const, bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000 },
];

export const CAFE_MENU_ITEMS = [
  { id: 'm-1', name: 'Chicken Steam Momo', price: 250 },
  { id: 'm-2', name: 'Veg Fried Momo', price: 200 },
  { id: 'm-3', name: 'Fresh Masala Tea', price: 80 },
  { id: 'm-4', name: 'Americano Coffee', price: 120 },
  { id: 'm-5', name: 'Club Chicken Sandwich', price: 300 },
  { id: 'm-6', name: 'Crispy French Fries', price: 190 },
  { id: 'm-7', name: 'Chicken Pizza 9"', price: 450 },
  { id: 'm-8', name: 'Fresh Lime Soda', price: 110 },
];

export const RESERVATIONS_STORAGE_KEY = 'hotel_room_bookings_list';
export const CANCELLATIONS_STORAGE_KEY = 'hotel_cancellations_list';

export function loadBookingsFromStorage(): RoomBooking[] {
  if (typeof window === 'undefined') return INITIAL_BOOKINGS;
  try {
    const raw = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure new seed bookings are present if missing
        const existingIds = new Set(parsed.map((b: RoomBooking) => b.id));
        const missingSeeds = INITIAL_BOOKINGS.filter((seed) => !existingIds.has(seed.id));
        if (missingSeeds.length > 0) {
          const merged = [...parsed, ...missingSeeds];
          localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse bookings from localStorage', err);
  }
  return INITIAL_BOOKINGS;
}

export function saveBookingsToStorage(bookings: RoomBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.warn('Failed to save bookings to localStorage', err);
  }
}

export function loadCancellationsFromStorage(): CancellationRecord[] {
  if (typeof window === 'undefined') return INITIAL_CANCELLATIONS;
  try {
    const raw = localStorage.getItem(CANCELLATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cancellations from localStorage', err);
  }
  return INITIAL_CANCELLATIONS;
}

export function saveCancellationsToStorage(cancellations: CancellationRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANCELLATIONS_STORAGE_KEY, JSON.stringify(cancellations));
  } catch (err) {
    console.warn('Failed to save cancellations to localStorage', err);
  }
}

export function getBookingFinancials(booking: RoomBooking) {
  const roomCharges = booking.roomCharges || 0;
  const cafeTotal = (booking.cafeOrders || []).reduce((sum, order) => sum + (order.subtotal || 0), 0);
  const totalCharges = roomCharges + cafeTotal;
  const totalPaid = (booking.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = Math.max(0, totalCharges - totalPaid);

  return {
    roomCharges,
    cafeTotal,
    totalCharges,
    totalPaid,
    balanceDue,
    isSettled: balanceDue === 0,
  };
}

export function findBooking(bookings: RoomBooking[], identifier: string): RoomBooking | undefined {
  if (!identifier) return undefined;
  const cleanId = identifier.trim().toLowerCase();
  return bookings.find(
    (b) =>
      b.id.toLowerCase() === cleanId ||
      b.bookingCode.toLowerCase() === cleanId ||
      b.bookingCode.toLowerCase().replace('-', '') === cleanId.replace('-', '')
  );
}

// -----------------------------------------------------------------------------
// Consolidated Reporting Extractors & Helpers
// -----------------------------------------------------------------------------

export interface ConsolidatedStayRecord {
  bookingId: string;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  vipTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  roomNumber: string;
  roomType: string;
  floorLevel: string;
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomCharges: number;
  cafeTotal: number;
  totalCharges: number;
  totalPaid: number;
  balanceDue: number;
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED';
  notes?: string;
}

export function getAllStayRecords(bookings: RoomBooking[]): ConsolidatedStayRecord[] {
  return bookings.map((b) => {
    const fin = getBookingFinancials(b);
    return {
      bookingId: b.id,
      bookingCode: b.bookingCode,
      guestName: `${b.guest.firstName} ${b.guest.lastName}`,
      guestPhone: b.guest.phone,
      guestEmail: b.guest.email,
      vipTier: b.guest.vipTier,
      roomNumber: b.room.number,
      roomType: b.room.type,
      floorLevel: b.room.floorLevel,
      pricePerNight: b.room.pricePerNight,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      roomCharges: fin.roomCharges,
      cafeTotal: fin.cafeTotal,
      totalCharges: fin.totalCharges,
      totalPaid: fin.totalPaid,
      balanceDue: fin.balanceDue,
      status: b.status,
      notes: b.notes,
    };
  });
}

export interface ConsolidatedOrderRecord {
  id: string;
  orderNumber: string;
  timestamp: string;
  bookingId: string;
  bookingCode: string;
  roomNumber: string;
  guestName: string;
  items: CafeOrderItem[];
  itemCount: number;
  subtotal: number;
  status: 'DELIVERED' | 'PREPARING' | 'BILLED';
}

export function getAllCafeOrders(bookings: RoomBooking[]): ConsolidatedOrderRecord[] {
  const orders: ConsolidatedOrderRecord[] = [];
  bookings.forEach((b) => {
    (b.cafeOrders || []).forEach((order) => {
      const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        timestamp: order.timestamp,
        bookingId: b.id,
        bookingCode: b.bookingCode,
        roomNumber: b.room.number,
        guestName: `${b.guest.firstName} ${b.guest.lastName}`,
        items: order.items || [],
        itemCount,
        subtotal: order.subtotal,
        status: order.status,
      });
    });
  });
  return orders;
}

export interface ConsolidatedPaymentRecord {
  id: string;
  receiptNo: string;
  date: string;
  bookingId: string;
  bookingCode: string;
  roomNumber: string;
  guestName: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
  type: 'ADVANCE' | 'PARTIAL' | 'SETTLEMENT';
  notes?: string;
}

export function getAllPaymentTransactions(bookings: RoomBooking[]): ConsolidatedPaymentRecord[] {
  const transactions: ConsolidatedPaymentRecord[] = [];
  bookings.forEach((b) => {
    (b.payments || []).forEach((p) => {
      transactions.push({
        id: p.id,
        receiptNo: p.receiptNo,
        date: p.date,
        bookingId: b.id,
        bookingCode: b.bookingCode,
        roomNumber: b.room.number,
        guestName: `${b.guest.firstName} ${b.guest.lastName}`,
        amount: p.amount,
        method: p.method,
        type: p.type,
        notes: p.notes,
      });
    });
  });
  return transactions;
}

export interface HotelRevenueMetrics {
  totalGrossRevenue: number;
  roomRevenue: number;
  cafeRevenue: number;
  totalCollected: number;
  totalBalanceDue: number;
  totalBookings: number;
  completedStays: number;
  inHouseStays: number;
  reservedStays: number;
  totalCancellations: number;
  cancellationRate: number;
  totalRefunds: number;
  averageDailyRate: number;
  revPar: number;
  occupancyRate: number;
  totalNightsSold: number;
  availableRoomsCount: number;
  categoryBreakdown: Array<{
    category: string;
    roomsCount: number;
    nightsSold: number;
    roomRevenue: number;
    avgRate: number;
  }>;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    upiQr: number;
    esewaKhalti: number;
    bankTransfer: number;
  };
}

export function calculateHotelRevenueMetrics(
  bookings: RoomBooking[],
  cancellations: CancellationRecord[]
): HotelRevenueMetrics {
  let roomRevenue = 0;
  let cafeRevenue = 0;
  let totalCollected = 0;
  let totalBalanceDue = 0;
  let totalNightsSold = 0;
  let completedStays = 0;
  let inHouseStays = 0;
  let reservedStays = 0;

  const paymentBreakdown = {
    cash: 0,
    card: 0,
    upiQr: 0,
    esewaKhalti: 0,
    bankTransfer: 0,
  };

  const categoryMap: Record<string, { rooms: Set<string>; nights: number; revenue: number; rates: number[] }> = {};

  bookings.forEach((b) => {
    const fin = getBookingFinancials(b);
    roomRevenue += fin.roomCharges;
    cafeRevenue += fin.cafeTotal;
    totalCollected += fin.totalPaid;
    totalBalanceDue += fin.balanceDue;
    totalNightsSold += b.nights || 0;

    if (b.status === 'CHECKED_OUT') completedStays++;
    else if (b.status === 'CHECKED_IN') inHouseStays++;
    else if (b.status === 'RESERVED') reservedStays++;

    // Category breakdown
    const cat = b.room.type || 'Standard Room';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { rooms: new Set(), nights: 0, revenue: 0, rates: [] };
    }
    categoryMap[cat].rooms.add(b.room.number);
    categoryMap[cat].nights += b.nights || 0;
    categoryMap[cat].revenue += fin.roomCharges;
    categoryMap[cat].rates.push(b.room.pricePerNight);

    // Payments breakdown
    (b.payments || []).forEach((p) => {
      if (p.method === 'CASH') paymentBreakdown.cash += p.amount;
      else if (p.method === 'CARD') paymentBreakdown.card += p.amount;
      else if (p.method === 'UPI_QR') paymentBreakdown.upiQr += p.amount;
      else if (p.method === 'ESEWA_KHALTI') paymentBreakdown.esewaKhalti += p.amount;
      else if (p.method === 'BANK_TRANSFER') paymentBreakdown.bankTransfer += p.amount;
    });
  });

  const totalGrossRevenue = roomRevenue + cafeRevenue;
  const totalCancellations = cancellations.length;
  const totalBookingsAttempted = bookings.length + totalCancellations;
  const cancellationRate = totalBookingsAttempted > 0 ? Math.round((totalCancellations / totalBookingsAttempted) * 100) : 0;
  const totalRefunds = cancellations.reduce((sum, c) => sum + (c.refundAmount || 0), 0);

  const availableRoomsCount = AVAILABLE_ROOMS_CATALOG.length;
  const averageDailyRate = totalNightsSold > 0 ? Math.round(roomRevenue / totalNightsSold) : 2750;
  const occupancyRate = availableRoomsCount > 0 ? Math.round((inHouseStays / availableRoomsCount) * 100) : 75;
  const revPar = Math.round((occupancyRate / 100) * averageDailyRate);

  const categoryBreakdown = Object.keys(categoryMap).map((cat) => {
    const data = categoryMap[cat];
    const avgRate = data.rates.length > 0 ? Math.round(data.rates.reduce((a, b) => a + b, 0) / data.rates.length) : 0;
    return {
      category: cat,
      roomsCount: data.rooms.size,
      nightsSold: data.nights,
      roomRevenue: data.revenue,
      avgRate,
    };
  });

  return {
    totalGrossRevenue,
    roomRevenue,
    cafeRevenue,
    totalCollected,
    totalBalanceDue,
    totalBookings: bookings.length,
    completedStays,
    inHouseStays,
    reservedStays,
    totalCancellations,
    cancellationRate,
    totalRefunds,
    averageDailyRate,
    revPar,
    occupancyRate,
    totalNightsSold,
    availableRoomsCount,
    categoryBreakdown,
    paymentMethodBreakdown: paymentBreakdown,
  };
}

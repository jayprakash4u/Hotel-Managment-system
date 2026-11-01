// Shared types, mock data, and storage helpers for Room Reservations

export function getRelativeDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export interface AccompanyingGuest {
  id?: string;
  name: string;
  age?: number | string;
  gender?: string;
  relation?: string;
  idNumber?: string;
}

export interface RoomBooking {
  id: string;
  bookingCode: string; // e.g. BK-1001
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
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
    // Extended KYC & verification fields
    idIssueDate?: string;
    idExpiryDate?: string;
    idIssuePlace?: string;
    idDocumentImage?: string;
    idDocumentImages?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    purposeOfVisit?: string;
    arrivedFrom?: string;
    proceedingTo?: string;
    vehicleNumber?: string;
    accompanyingGuests?: AccompanyingGuest[];
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
  // Extended Check-in physical allocation fields
  keyCardNumber?: string;
  keyCardsIssued?: number;
  luggageCount?: number;
  luggageTag?: string;
  checkInTime?: string;
  securityDeposit?: number;
  bookingAgent?: string;
}

export const INITIAL_BOOKINGS: RoomBooking[] = [
  {
    id: 'bk-1002-occ',
    bookingCode: 'BK-1020',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-102',
      firstName: 'Aarav',
      lastName: 'Karki',
      phone: '+977 9841234567',
      email: 'aarav.karki@gmail.com',
      address: 'Kathmandu, Nepal',
      idType: 'Citizenship',
      idNumber: 'CT-27-01-72-0451',
      country: 'Nepal',
      vipTier: 'GOLD',
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
    checkIn: getRelativeDate(0),
    checkOut: getRelativeDate(3),
    nights: 3,
    roomCharges: 10500,
    cafeOrders: [
      {
        id: 'ord-102-demo',
        orderNumber: 'CO-205',
        timestamp: 'Yesterday, 07:30 PM',
        status: 'DELIVERED',
        subtotal: 500,
        items: [
          { id: 'it-1', name: 'Chicken Steam Momo', quantity: 2, price: 250, total: 500 },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-102-demo',
        receiptNo: 'REC-1020-A',
        date: 'Yesterday, Advance Deposit',
        amount: 5000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Deposit paid during check-in',
      },
    ],
    bookingHistory: [],
    notes: 'VIP Gold guest in-house. Checked in yesterday.',
  },
  {
    id: 'bk-1001',
    bookingCode: 'BK-1001',
    status: 'RESERVED',
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
    checkIn: getRelativeDate(0),
    checkOut: getRelativeDate(2),
    nights: 2,
    roomCharges: 7000,
    cafeOrders: [
      {
        id: 'ord-101',
        orderNumber: 'CO-201',
        timestamp: 'Today, 02:45 PM',
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
        date: 'Today, Advance Deposit',
        amount: 2000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Reservation advance deposit paid at booking',
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
    checkIn: getRelativeDate(0),
    checkOut: getRelativeDate(2),
    nights: 2,
    roomCharges: 4000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-2',
        receiptNo: 'REC-1002-A',
        date: 'Today, Advance',
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
    checkIn: getRelativeDate(0),
    checkOut: getRelativeDate(3),
    nights: 3,
    roomCharges: 6000,
    cafeOrders: [
      {
        id: 'ord-103',
        orderNumber: 'CO-195',
        timestamp: 'Yesterday, 09:10 AM',
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
        date: 'Yesterday, Advance',
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
    checkIn: getRelativeDate(2),
    checkOut: getRelativeDate(4),
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
  {
    id: 'bk-1010',
    bookingCode: 'BK-1010',
    status: 'RESERVED',
    guest: {
      id: 'gst-10',
      firstName: 'Rahul',
      lastName: 'Gupta',
      phone: '+977 9841987654',
      email: 'rahul.gupta@gmail.com',
      address: 'Birgunj, Nepal',
      idType: 'Citizenship',
      idNumber: 'CT-34-02-76-1122',
      country: 'Nepal',
      vipTier: 'SILVER',
    },
    room: {
      id: 'rm-105',
      number: '105',
      type: 'Standard Non-AC',
      acType: 'Non-AC',
      bedType: 'Queen Bed',
      floorLevel: '1st Floor',
      pricePerNight: 2000,
    },
    checkIn: getRelativeDate(1),
    checkOut: getRelativeDate(4),
    nights: 3,
    roomCharges: 6000,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-12',
        receiptNo: 'REC-1010-A',
        date: 'Today, Advance',
        amount: 2000,
        method: 'CASH',
        type: 'ADVANCE',
        notes: 'Advance reservation deposit',
      },
    ],
    bookingHistory: [],
    notes: '3-night stay hold. Non-AC room requested.',
  },
  {
    id: 'bk-2001',
    bookingCode: 'BK-2001',
    status: 'CHECKED_IN',
    guest: {
      id: 'gst-2001',
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+977 9811223344',
      email: 'priya.sharma@nepalcorp.com',
      address: 'Pokhara, Kaski',
      idType: 'Citizenship',
      idNumber: 'CT-45-01-81-2233',
      country: 'Nepal',
      vipTier: 'PLATINUM',
    },
    room: {
      id: 'rm-201',
      number: '201',
      type: 'Super Deluxe Ocean Suite',
      acType: 'AC',
      bedType: 'Emperor Bed',
      floorLevel: '2nd Floor',
      pricePerNight: 7500,
    },
    checkIn: getRelativeDate(0),
    checkOut: getRelativeDate(3),
    nights: 3,
    roomCharges: 22500,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-2001-a',
        receiptNo: 'REC-2001-A',
        date: 'Today, Full Prepayment',
        amount: 22500,
        method: 'CARD',
        type: 'SETTLEMENT',
        notes: 'Full stay pre-settlement paid via Corporate Card',
      },
    ],
    bookingHistory: [],
    notes: 'Executive corporate stay (3 nights). High floor suite assigned.',
  },
  {
    id: 'bk-3001',
    bookingCode: 'BK-3001',
    status: 'RESERVED',
    guest: {
      id: 'gst-3001',
      firstName: 'Michael',
      lastName: 'Brown',
      phone: '+1 415 889 9001',
      email: 'michael.brown@techcorp.com',
      address: 'San Francisco, CA, USA',
      idType: 'Passport',
      idNumber: 'PP-US-991283',
      country: 'United States',
      vipTier: 'GOLD',
    },
    room: {
      id: 'rm-301',
      number: '301',
      type: 'Royal Club Penthouse',
      acType: 'AC',
      bedType: 'Emperor Bed',
      floorLevel: '3rd Floor',
      pricePerNight: 9500,
    },
    checkIn: getRelativeDate(1),
    checkOut: getRelativeDate(4),
    nights: 3,
    roomCharges: 28500,
    cafeOrders: [],
    payments: [
      {
        id: 'pay-3001-a',
        receiptNo: 'REC-3001-A',
        date: 'Today, Advance Deposit',
        amount: 10000,
        method: 'CARD',
        type: 'ADVANCE',
        notes: 'International reservation deposit paid',
      },
    ],
    bookingHistory: [],
    notes: '3 nights reserved for International conference speaker.',
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

export interface AvailableRoomOption {
  id: string;
  number: string;
  type: string;
  acType: 'AC' | 'Non-AC';
  bedType: string;
  floorLevel: string;
  pricePerNight: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'IN_CLEANING';
}

export const AVAILABLE_ROOMS_CATALOG: AvailableRoomOption[] = [
  { id: 'rm-101', number: '101', type: 'Deluxe Room', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', type: 'Deluxe Room', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', type: 'Standard Room', acType: 'Non-AC', bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-104', number: '104', type: 'Standard Room', acType: 'Non-AC', bedType: 'Twin Beds', floorLevel: '1st Floor', pricePerNight: 2000, status: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', type: 'Deluxe Room', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'DIRTY', cleaningStatus: 'DIRTY' },
  { id: 'rm-201', number: '201', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'Super King Bed', floorLevel: '2nd Floor', pricePerNight: 5500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'Super King Bed', floorLevel: '2nd Floor', pricePerNight: 5500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
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

export function resetBookingsToInitial(): RoomBooking[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
  }
  return INITIAL_BOOKINGS;
}

export function loadBookingsFromStorage(): RoomBooking[] {
  if (typeof window === 'undefined') return INITIAL_BOOKINGS;
  try {
    const raw = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (raw) {
      const parsed: RoomBooking[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;

        // 1. Ensure Aarav Karki (bk-1002-occ) is on Room 102, CHECKED_IN for 3 nights from today
        const aarav = parsed.find((b) => b.id === 'bk-1002-occ');
        if (aarav) {
          if (
            aarav.checkIn !== getRelativeDate(0) ||
            aarav.checkOut !== getRelativeDate(3) ||
            aarav.nights !== 3 ||
            aarav.room.number !== '102'
          ) {
            aarav.room.number = '102';
            aarav.room.id = 'rm-102';
            aarav.checkIn = getRelativeDate(0);
            aarav.checkOut = getRelativeDate(3);
            aarav.nights = 3;
            aarav.status = 'CHECKED_IN';
            modified = true;
          }
        } else {
          const occ102 = INITIAL_BOOKINGS.find((b) => b.id === 'bk-1002-occ');
          if (occ102) {
            parsed.unshift({ ...occ102 });
            modified = true;
          }
        }

        // 2. Ensure Rahul Gupta (bk-1010) is moved to Room 105 (Standard Non-AC) to prevent overlap on Room 102
        const rahul = parsed.find((b) => b.id === 'bk-1010');
        if (rahul) {
          if (
            rahul.room.number === '102' ||
            rahul.checkIn !== getRelativeDate(1) ||
            rahul.checkOut !== getRelativeDate(4)
          ) {
            rahul.room = {
              id: 'rm-105',
              number: '105',
              type: 'Standard Non-AC',
              acType: 'Non-AC',
              bedType: 'Queen Bed',
              floorLevel: '1st Floor',
              pricePerNight: 2000,
            };
            rahul.checkIn = getRelativeDate(1);
            rahul.checkOut = getRelativeDate(4);
            rahul.nights = 3;
            modified = true;
          }
        } else {
          const initRahul = INITIAL_BOOKINGS.find((b) => b.id === 'bk-1010');
          if (initRahul) {
            parsed.push({ ...initRahul });
            modified = true;
          }
        }

        // 3. Purge any duplicate/conflicting bookings on Room 102 during Aarav's stay
        const cleaned = parsed.filter((b) => {
          if (b.id === 'bk-1002-occ') return true;
          // If any other booking is on Room 102 and active, remove or move
          if (b.room.number === '102' && b.status !== 'CHECKED_OUT' && b.status !== 'CANCELLED') {
            if (b.id === 'bk-1010') {
              b.room.number = '105';
              b.room.id = 'rm-105';
              return true;
            }
            modified = true;
            return false;
          }
          // Also deduplicate any other booking for Aarav Karki
          if (
            b.guest.firstName.toLowerCase() === 'aarav' &&
            b.guest.lastName.toLowerCase() === 'karki' &&
            b.id !== 'bk-1002-occ'
          ) {
            modified = true;
            return false;
          }
          return true;
        });
        parsed.length = 0;
        parsed.push(...cleaned);

        // 4. Ensure Ram Sharma (bk-1001) is on Room 101 for 2 nights (Today to +2)
        const ram = parsed.find((b) => b.id === 'bk-1001');
        if (ram && (ram.checkIn !== getRelativeDate(0) || ram.checkOut !== getRelativeDate(2))) {
          ram.checkIn = getRelativeDate(0);
          ram.checkOut = getRelativeDate(2);
          ram.nights = 2;
          ram.room.number = '101';
          modified = true;
        }

        // 5. Ensure Anita Shrestha (bk-1005) is on Room 101 for 2 nights (+2 to +4)
        const anita = parsed.find((b) => b.id === 'bk-1005');
        if (anita && (anita.checkIn !== getRelativeDate(2) || anita.checkOut !== getRelativeDate(4))) {
          anita.checkIn = getRelativeDate(2);
          anita.checkOut = getRelativeDate(4);
          anita.nights = 2;
          anita.room.number = '101';
          modified = true;
        }

        // 6. Ensure Sita Rai (bk-1002) is on Room 103 for 2 nights (Today to +2)
        const sita = parsed.find((b) => b.id === 'bk-1002');
        if (sita && (sita.checkIn !== getRelativeDate(0) || sita.checkOut !== getRelativeDate(2))) {
          sita.checkIn = getRelativeDate(0);
          sita.checkOut = getRelativeDate(2);
          sita.nights = 2;
          sita.room.number = '103';
          modified = true;
        }

        // 7. Ensure Bikash Gurung (bk-1004) is on Room 104 for 3 nights (Today to +3, CHECKED_IN)
        const bikash = parsed.find((b) => b.id === 'bk-1004');
        if (
          bikash &&
          (bikash.checkIn !== getRelativeDate(0) ||
            bikash.checkOut !== getRelativeDate(3) ||
            bikash.nights !== 3)
        ) {
          bikash.checkIn = getRelativeDate(0);
          bikash.checkOut = getRelativeDate(3);
          bikash.nights = 3;
          bikash.status = 'CHECKED_IN';
          bikash.room.number = '104';
          modified = true;
        }

        // 8. Add demo bookings for Room 201 and Room 301 if not present
        if (!parsed.some((b) => b.id === 'bk-2001')) {
          const init201 = INITIAL_BOOKINGS.find((b) => b.id === 'bk-2001');
          if (init201) {
            parsed.push({ ...init201 });
            modified = true;
          }
        }
        if (!parsed.some((b) => b.id === 'bk-3001')) {
          const init301 = INITIAL_BOOKINGS.find((b) => b.id === 'bk-3001');
          if (init301) {
            parsed.push({ ...init301 });
            modified = true;
          }
        }

        if (modified) {
          localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(parsed));
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

export function performCheckIn(
  bookings: RoomBooking[],
  bookingId: string,
  params?: {
    assignedRoomId?: string;
    depositAmount?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
    verifiedGuest?: Partial<RoomBooking['guest']>;
    keyCardNumber?: string;
    keyCardsIssued?: number;
    luggageCount?: number;
    luggageTag?: string;
    checkInTime?: string;
    securityDeposit?: number;
    notes?: string;
  }
): { updatedBookings: RoomBooking[]; checkedInBooking: RoomBooking | undefined } {
  let checkedIn: RoomBooking | undefined;

  const next = bookings.map((b) => {
    if (b.id !== bookingId) return b;

    let targetRoom = b.room;
    if (params?.assignedRoomId) {
      const foundCatalog = AVAILABLE_ROOMS_CATALOG.find((r) => r.id === params.assignedRoomId);
      if (foundCatalog) {
        targetRoom = {
          id: foundCatalog.id,
          number: foundCatalog.number,
          type: foundCatalog.type,
          acType: foundCatalog.acType,
          bedType: foundCatalog.bedType,
          floorLevel: foundCatalog.floorLevel,
          pricePerNight: foundCatalog.pricePerNight,
        };
      }
    }

    const newPayments = [...(b.payments || [])];
    if (params?.depositAmount && params.depositAmount > 0) {
      newPayments.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${b.bookingCode}-CHK`,
        date: 'Today, Check-in Payment',
        amount: params.depositAmount,
        method: params.paymentMethod || 'CASH',
        type: 'ADVANCE',
        notes: params.securityDeposit && params.securityDeposit > 0
          ? `Check-in deposit & security collected: Rs. ${params.depositAmount}`
          : 'Payment received during Front Desk check-in',
      });
    }

    const updated: RoomBooking = {
      ...b,
      status: 'CHECKED_IN',
      room: targetRoom,
      guest: {
        ...b.guest,
        ...(params?.verifiedGuest || {}),
      },
      payments: newPayments,
      keyCardNumber: params?.keyCardNumber || b.keyCardNumber,
      keyCardsIssued: params?.keyCardsIssued ?? b.keyCardsIssued,
      luggageCount: params?.luggageCount ?? b.luggageCount,
      luggageTag: params?.luggageTag || b.luggageTag,
      checkInTime: params?.checkInTime || b.checkInTime || 'Today, Front Desk',
      securityDeposit: params?.securityDeposit ?? b.securityDeposit,
      notes: params?.notes !== undefined ? params.notes : b.notes,
    };
    checkedIn = updated;
    return updated;
  });

  saveBookingsToStorage(next);
  syncRoomStatuses(next);
  return { updatedBookings: next, checkedInBooking: checkedIn };
}

export function performDirectCheckIn(
  bookings: RoomBooking[],
  payload: {
    guest: RoomBooking['guest'];
    room: RoomBooking['room'];
    checkIn: string;
    checkOut: string;
    nights: number;
    roomCharges: number;
    payments?: PaymentEntry[];
    depositAmount?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
    keyCardNumber?: string;
    keyCardsIssued?: number;
    luggageCount?: number;
    luggageTag?: string;
    checkInTime?: string;
    securityDeposit?: number;
    notes?: string;
  }
): { updatedBookings: RoomBooking[]; checkedInBooking: RoomBooking } {
  const newBookingId = `bk-${Date.now().toString().slice(-4)}`;
  const newBookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

  const payments: PaymentEntry[] = [...(payload.payments || [])];
  if (payload.depositAmount && payload.depositAmount > 0) {
    payments.push({
      id: `pay-${Date.now()}`,
      receiptNo: `REC-${newBookingCode}-CHK`,
      date: 'Today, Check-in Payment',
      amount: payload.depositAmount,
      method: payload.paymentMethod || 'CASH',
      type: payload.depositAmount >= payload.roomCharges ? 'SETTLEMENT' : 'ADVANCE',
      notes: 'Direct Walk-In check-in payment collected at front desk',
    });
  }

  const newBooking: RoomBooking = {
    id: newBookingId,
    bookingCode: newBookingCode,
    status: 'CHECKED_IN',
    guest: payload.guest,
    room: payload.room,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    nights: payload.nights,
    roomCharges: payload.roomCharges,
    cafeOrders: [],
    payments,
    bookingHistory: [],
    notes: payload.notes,
    keyCardNumber: payload.keyCardNumber,
    keyCardsIssued: payload.keyCardsIssued,
    luggageCount: payload.luggageCount,
    luggageTag: payload.luggageTag,
    checkInTime: payload.checkInTime || 'Today, Front Desk',
    securityDeposit: payload.securityDeposit,
  };

  const next = [newBooking, ...bookings];
  saveBookingsToStorage(next);
  syncRoomStatuses(next);
  return { updatedBookings: next, checkedInBooking: newBooking };
}

export function performCheckOut(
  bookings: RoomBooking[],
  bookingId: string,
  params?: {
    settlementAmount?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'UPI_QR' | 'ESEWA_KHALTI' | 'BANK_TRANSFER';
    housekeepingNotes?: string;
  }
): { updatedBookings: RoomBooking[]; checkedOutBooking: RoomBooking | undefined } {
  let checkedOut: RoomBooking | undefined;

  const next = bookings.map((b) => {
    if (b.id !== bookingId) return b;

    const newPayments = [...(b.payments || [])];
    if (params?.settlementAmount && params.settlementAmount > 0) {
      newPayments.push({
        id: `pay-${Date.now()}`,
        receiptNo: `REC-${b.bookingCode}-SETTLE`,
        date: 'Today, Checkout Settle',
        amount: params.settlementAmount,
        method: params.paymentMethod || 'CASH',
        type: 'SETTLEMENT',
        notes: 'Final settlement payment collected at Check-in Desk',
      });
    }

    const updated: RoomBooking = {
      ...b,
      status: 'CHECKED_OUT',
      payments: newPayments,
      notes: params?.housekeepingNotes
        ? `${b.notes ? b.notes + ' | ' : ''}${params.housekeepingNotes}`
        : b.notes,
    };
    checkedOut = updated;
    return updated;
  });

  saveBookingsToStorage(next);
  syncRoomStatuses(next);
  return { updatedBookings: next, checkedOutBooking: checkedOut };
}

export function addCafeOrderToBooking(
  bookings: RoomBooking[],
  bookingId: string,
  items: { name: string; quantity: number; price: number }[]
): RoomBooking[] {
  const next = bookings.map((b) => {
    if (b.id !== bookingId) return b;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const newOrder: CafeOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `CO-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: 'Today, Dining Order',
      status: 'DELIVERED',
      items: items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      subtotal,
    };

    return {
      ...b,
      cafeOrders: [...(b.cafeOrders || []), newOrder],
    };
  });

  saveBookingsToStorage(next);
  return next;
}

export function syncRoomStatuses(bookings: RoomBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('hotel_rooms_setup');
    let roomsList: any[] = raw ? JSON.parse(raw) : [];

    const activeRoomsMap = new Map<string, string>();
    const checkoutRooms = new Set<string>();

    bookings.forEach((b) => {
      if (b.status === 'CHECKED_IN') {
        activeRoomsMap.set(b.room.number, `${b.guest.firstName} ${b.guest.lastName}`);
      } else if (b.status === 'CHECKED_OUT') {
        checkoutRooms.add(b.room.number);
      }
    });

    if (roomsList.length > 0) {
      roomsList = roomsList.map((r: any) => {
        const roomNum = r.roomNumber || r.number;
        if (activeRoomsMap.has(roomNum)) {
          return { ...r, status: 'OCCUPIED', guestName: activeRoomsMap.get(roomNum) };
        }
        if (checkoutRooms.has(roomNum) && r.status !== 'OCCUPIED') {
          return { ...r, status: 'DIRTY', guestName: undefined };
        }
        return r;
      });
      localStorage.setItem('hotel_rooms_setup', JSON.stringify(roomsList));
    }
  } catch (err) {
    console.warn('Failed to sync room statuses with hotel_rooms_setup', err);
  }
}

// -----------------------------------------------------------------------------
// Date-Based Room Availability & Occupancy Functions (Overlap Calculation)
// -----------------------------------------------------------------------------

export function doDatesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2;
}

export function isRoomAvailableForDates(
  roomNumber: string,
  checkIn: string,
  checkOut: string,
  bookings: RoomBooking[],
  excludeBookingId?: string
): boolean {
  if (!checkIn || !checkOut || checkIn >= checkOut) return false;

  const hasConflict = bookings.some((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'CHECKED_OUT' || b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
    if (b.room.number !== roomNumber) return false;

    return doDatesOverlap(b.checkIn, b.checkOut, checkIn, checkOut);
  });

  return !hasConflict;
}

export interface RoomAvailabilityResult extends AvailableRoomOption {
  isAvailableForDates: boolean;
  conflictBooking?: RoomBooking;
}

export function getAvailableRoomsForDates(
  checkIn: string,
  checkOut: string,
  bookings: RoomBooking[],
  catalog: AvailableRoomOption[] = AVAILABLE_ROOMS_CATALOG
): RoomAvailabilityResult[] {
  return catalog.map((room) => {
    const conflictBooking = bookings.find((b) => {
      if (b.status === 'CHECKED_OUT' || b.status === 'CANCELLED' || b.status === 'NO_SHOW') return false;
      if (b.room.number !== room.number) return false;
      return doDatesOverlap(b.checkIn, b.checkOut, checkIn, checkOut);
    });

    const isAvailableForDates = !conflictBooking && room.status !== 'MAINTENANCE';

    return {
      ...room,
      isAvailableForDates,
      conflictBooking,
    };
  });
}

export function getRoomOccupancyInfo(
  roomNumber: string,
  bookings: RoomBooking[],
  todayStr: string = getRelativeDate(0)
) {
  // Currently staying (in-house right now)
  const currentOccupant = bookings.find(
    (b) => b.room.number === roomNumber && b.status === 'CHECKED_IN'
  );

  // Future reservations (arriving on or after today)
  const futureBookings = bookings
    .filter(
      (b) =>
        b.room.number === roomNumber &&
        b.status === 'RESERVED' &&
        b.checkIn >= todayStr
    )
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const nextBooking = futureBookings[0];

  return {
    currentOccupant,
    nextBooking,
    futureBookings,
  };
}

export function markBookingAsNoShow(bookings: RoomBooking[], bookingId: string): RoomBooking[] {
  const next = bookings.map((b) => {
    if (b.id !== bookingId) return b;
    return {
      ...b,
      status: 'NO_SHOW' as const,
      notes: `${b.notes ? b.notes + ' | ' : ''}Guest marked as No-Show on ${getRelativeDate(0)}`,
    };
  });
  saveBookingsToStorage(next);
  syncRoomStatuses(next);
  return next;
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
  status: 'CHECKED_IN' | 'RESERVED' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
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

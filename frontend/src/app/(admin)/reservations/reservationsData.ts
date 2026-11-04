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


export const AVAILABLE_ROOMS_CATALOG: AvailableRoomOption[] = [
  { id: '748e33547b6b42178a3a4d991591fd25', number: '101', type: 'Deluxe Garden Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: '0b7a5291976f467092670071dcf3a6e5', number: '102', type: 'Deluxe Garden Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'fcb2247532e248aa9d7544fca47856e8', number: '103', type: 'Standard Twin Room', acType: 'Non-AC', bedType: '2 Queen Beds', floorLevel: '1st Floor', pricePerNight: 2400, status: 'AVAILABLE', cleaningStatus: 'DIRTY' },
  { id: '6835a95a55a94faab412da5f0afcf43f', number: '104', type: 'Standard Twin Room', acType: 'Non-AC', bedType: '2 Queen Beds', floorLevel: '1st Floor', pricePerNight: 2400, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: '639d7e4058aa42b8b162e2a61a2f8b54', number: '105', type: 'Deluxe Garden Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '1st Floor', pricePerNight: 3500, status: 'MAINTENANCE', cleaningStatus: 'DIRTY' },
  { id: 'e7f73a6dcffc4309bf743d331fa0fa87', number: '201', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'Super King Bed', floorLevel: '2nd Floor', pricePerNight: 4900, status: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: '18a4eeb348c44a5f81ad82facda7be34', number: '202', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'Super King Bed', floorLevel: '2nd Floor', pricePerNight: 4900, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'ddeeb358d00d4433b6f0870e0da8bf80', number: '203', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '2nd Floor', pricePerNight: 4900, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: '600ee80d872e4f8e87ff34f6a11fde47', number: '204', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '2nd Floor', pricePerNight: 4900, status: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: '6ac773799a3747ff8f99363d3c813462', number: '205', type: 'Executive Ocean Suite', acType: 'AC', bedType: 'King Bed', floorLevel: '2nd Floor', pricePerNight: 4900, status: 'MAINTENANCE', cleaningStatus: 'DIRTY' },
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
    localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
    localStorage.removeItem(CANCELLATIONS_STORAGE_KEY);
    localStorage.removeItem('hotel_pms_bookings_v2');
  }
  return [];
}

export function clearAllBookings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
  localStorage.removeItem(CANCELLATIONS_STORAGE_KEY);
  localStorage.removeItem('hotel_pms_bookings_v2');
  localStorage.removeItem('hotel_rooms_setup_v2');
}

export function loadBookingsFromStorage(): RoomBooking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (raw) {
      const parsed: RoomBooking[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse bookings from localStorage', err);
  }
  return [];
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
  if (typeof window === 'undefined') return [];
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
  return [];
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

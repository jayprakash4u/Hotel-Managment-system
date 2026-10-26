export type RoomSetupStatusType = 'OPERATIONAL' | 'UNDER_CONSTRUCTION' | 'OUT_OF_SERVICE';

export type RoomStatusType = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE';

export type ReservationStatusType = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatusType = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED' | 'VOIDED';

export type VipTierType = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export type HousekeepingPriorityType = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type HousekeepingTaskType = 'FULL_CLEAN' | 'TOUCH_UP' | 'TURNDOWN' | 'DEEP_CLEAN' | 'INSPECTION';

export type HousekeepingStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type MaintenanceCategoryType = 'PLUMBING' | 'HVAC' | 'ELECTRICAL' | 'FURNITURE' | 'APPLIANCE' | 'OTHER';

export type MaintenanceStatusType = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type OutletType = 'RESTAURANT' | 'ROOFTOP_BAR' | 'ZENITH_SPA' | 'ROOM_SERVICE' | 'MINIBAR' | 'GENERAL';

export type UserRole = 'ADMIN' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'POS_CASHIER' | 'CHEF' | 'FINANCE_OFFICER' | 'GUEST';

export interface HotelData {
  id: string;
  name: string;
  slug?: string;
  address: string;
  totalFloors: number;
  currency: string;
  timezone: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface HotelAdminSessionUser {
  username: string;
  name: string;
  hotelId: string;
  hotelName: string;
}

export interface PlatformSessionUser {
  username: string;
  name: string;
}

export interface PlatformHotelSummary extends HotelData {
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  adminUser: { username: string; name: string; isActive: boolean; lastLoginAt: string | null } | null;
  _count: { rooms: number; guests: number; reservations: number };
}

export interface RoomTypeData {
  id: string;
  hotelId?: string | null;
  name: string;
  hasAC: boolean;
  bedType: string;
  maxCapacity: number;
  basePrice: number;
  amenities: string[];
  imageUrl?: string | null;
  description?: string | null;
  roomCount?: number;
  operationalCount?: number;
  underConstructionCount?: number;
}

export interface RoomWithDetails {
  id: string;
  hotelId?: string | null;
  roomTypeId?: string | null;
  roomType?: RoomTypeData | null;
  number: string;
  floor: number;
  type: string;
  hasAC: boolean;
  bedType: string;
  pricePerNight: number;
  capacity: number;
  setupStatus: RoomSetupStatusType;
  status: RoomStatusType;
  amenities: string[];
  imageUrl: string;
  description: string;
  activeReservation?: {
    id: string;
    bookingCode: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
    vipTier: string;
    status: string;
  } | null;
  activeHousekeepingTask?: {
    id: string;
    taskType: string;
    assignedTo: string;
    priority: string;
    status: string;
  } | null;
  activeMaintenanceTicket?: {
    id: string;
    ticketCode: string;
    title: string;
    priority: string;
    status: string;
  } | null;
}

export interface GuestData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  idType: string;
  country: string;
  vipTier: VipTierType;
  loyaltyPoints: number;
  preferences?: string | null;
  notes?: string | null;
  totalStays?: number;
  totalSpent?: number;
  reservations?: Array<{
    id: string;
    bookingCode: string;
    roomNumber: string;
    roomType: string;
    checkIn: string | Date;
    checkOut: string | Date;
    status: string;
    totalAmount: number;
  }>;
}

export interface ReservationData {
  id: string;
  bookingCode: string;
  guestId: string;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber?: string;
    vipTier: string;
  };
  roomId: string;
  room: {
    id: string;
    number: string;
    type: string;
    pricePerNight: number;
    floor: number;
    amenities?: string[];
  };
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatusType;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatusType;
  source: string;
  specialRequests?: string | null;
  folioItems?: FolioItemData[];
}

export interface FolioItemData {
  id: string;
  reservationId: string;
  outlet: string;
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
  billedBy: string;
  timestamp: string;
}

export interface HousekeepingTaskData {
  id: string;
  roomId: string;
  room: {
    id: string;
    number: string;
    type: string;
    floor: number;
    status: string;
  };
  assignedTo: string;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriorityType;
  status: HousekeepingStatusType;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface MaintenanceTicketData {
  id: string;
  ticketCode: string;
  roomId: string;
  room: {
    id: string;
    number: string;
    type: string;
    floor: number;
  };
  title: string;
  description: string;
  category: MaintenanceCategoryType;
  priority: HousekeepingPriorityType;
  status: MaintenanceStatusType;
  reportedBy: string;
  assignedTo?: string | null;
  reportedAt: string;
  resolvedAt?: string | null;
}

export interface POSProductData {
  id: string;
  hotelId?: string;
  outlet: string;
  category: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  trackStock: boolean;
  isAvailable?: boolean;
  isActive?: boolean;
  imageUrl?: string | null;
}

export interface InventoryItemData {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  lastRestocked: string;
}

export interface StaffData {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTitle?: string;
  avatar: string;
  shift: string;
  phone?: string;
}

export interface DashboardMetrics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  todayArrivals: number;
  todayDepartures: number;
  inHouseGuests: number;
  todayRevenue: number;
  monthRevenue: number;
  adr: number;
  revpar: number;
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'checkin' | 'checkout' | 'booking' | 'pos' | 'housekeeping' | 'maintenance';
  }>;
  floorBreakdown: Array<{
    floor: number;
    total: number;
    occupied: number;
    available: number;
    dirty: number;
    maintenance: number;
  }>;
}

export interface TableReservationData {
  id: string;
  hotelId: string;
  tableId?: string | null;
  table?: {
    id: string;
    tableNumber: string;
    section: string;
    capacity: number;
    status: string;
  } | null;
  guestId?: string | null;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  } | null;
  customerName: string;
  phoneNumber: string;
  reservationDate: string;
  reservationTime: string;
  durationMinutes: number;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  specialRequests?: string | null;
  internalNotes?: string | null;
  reservationCode: string;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuickSaleItem {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface QuickSalePayload {
  items: QuickSaleItem[];
  paymentMethod: string;
  paidAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  tax?: number;
  serviceCharge?: number;
  serverName?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  sendToKitchen?: boolean;
  outlet?: string;
}

export interface QuickSaleReceipt {
  orderNumber: string;
  kotNumber?: string;
  status: string;
  outlet: string;
  orderType: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    productId?: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    total: number;
    notes?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeDue: number;
  timestamp: string;
}

export interface DailySalesSummaryData {
  date: string;
  totalOrders: number;
  totalSales: number;
  totalSubtotal: number;
  totalTax: number;
  totalDiscounts: number;
  breakdownByType: {
    dineInSales: number;
    quickSales: number;
    roomServiceSales: number;
  };
  breakdownByPayment: {
    cashSales: number;
    cardSales: number;
    upiSales: number;
    roomFolioSales: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    kotNumber?: string;
    orderType: string;
    tableNumber?: string;
    status: string;
    serverName: string;
    total: number;
    paymentMethod: string;
    itemCount: number;
    createdAt: string;
  }>;
}

export interface RestaurantOrderItemData {
  id?: string;
  orderId?: string;
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  notes?: string;
}

export interface ActiveRestaurantOrderData {
  id: string;
  hotelId?: string;
  orderNumber: string;
  kotNumber?: string;
  outlet: string;
  tableId?: string | null;
  table?: { id: string; tableNumber: string; section?: string; capacity?: number };
  roomId?: string | null;
  room?: { id: string; number: string };
  guestId?: string | null;
  guest?: { id: string; firstName: string; lastName: string; phone?: string };
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'BILLED' | 'COMPLETED' | 'CANCELLED';
  orderType: 'DINE_IN' | 'NO_TABLE' | 'TAKEAWAY' | 'ROOM_SERVICE' | 'COUNTER_SALE';
  serverName: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod?: string | null;
  isPaid: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: RestaurantOrderItemData[];
}


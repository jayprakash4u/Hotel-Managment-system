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

export interface ProductVariant {
  unit: string;
  price: number;
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
  variants?: ProductVariant[];
  variantsJson?: string | null;
  department?: 'KOT' | 'BOT';
}

export interface InventoryItemData {
  id: string;
  name: string;
  department: 'HOTEL' | 'RESTAURANT' | string;
  category: string;
  sku: string;
  trackStock?: boolean;
  currentStock: number;
  minThreshold: number;
  unit: string;
  purchaseUnit?: string | null;
  conversionFactor?: number;
  costPerUnit: number;
  lastRestocked: string;
  previousStock?: number | null;
  recentlyAddedStock?: number | null;
  previousPurchaseDate?: string | null;
  lastPurchaseDate?: string | null;
  lastPurchaseQuantity?: string | null;
  previousPurchaseAmount?: number | null;
  lastPurchaseAmount?: number | null;
  totalPurchaseAmount?: number;
  lastSupplierName?: string | null;
  lastSupplier?: string | null;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED' | string;
  supplier?: { id: string; name: string };
  supplierId?: string | null;
}

export interface ItemPurchaseLedgerTransaction {
  sn: number;
  purchaseId: string;
  purchaseNumber: string;
  purchaseDate: string;
  supplierName: string;
  supplierId?: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  supplierAddress?: string | null;
  supplierPan?: string | null;
  purchaseQuantity: number;
  purchaseUnit: string;
  stockUnit: string;
  conversionFactor: number;
  convertedStockQuantity: number;
  totalPurchaseAmount: number;
  purchaseType: 'SIMPLE' | 'FULL' | string;
  paymentMethod: string;
  paymentStatus: string;
  invoiceNumber?: string | null;
  status: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  additionalCharges?: number;
  notes?: string | null;
  attachmentUrl?: string | null;
  createdBy?: string;
  createdAt: string;
  itemId?: string;
  itemName?: string;
  itemCode?: string;
  category?: string;
}

export interface ItemPurchaseLedgerSummary {
  itemId: string;
  itemName: string;
  itemCode: string;
  category: string;
  department: string;
  stockUnit: string;
  purchaseUnit: string;
  trackStock: boolean;
  currentStock: number;
  totalQuantityPurchased: number;
  totalPurchaseAmount: number;
  firstPurchaseDate?: string | null;
  lastPurchaseDate?: string | null;
  totalTransactions: number;
}

export interface StockMovementLedgerRecord {
  id: string;
  createdAt: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  category: string;
  department: string;
  movementType: string;
  referenceNumber: string;
  quantityIn: number;
  quantityOut: number;
  quantity: number;
  previousBalance?: number | null;
  newBalance?: number | null;
  stockUnit: string;
  reason: string;
  performedBy: string;
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

export interface TableCategoryData {
  id: string;
  hotelId?: string;
  name: string;
  description?: string | null;
  floor?: string | null;
  displayOrder: number;
  isActive: boolean;
  tableCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantTableData {
  id: string;
  hotelId?: string;
  tableNumber: string;
  section: string;
  categoryId?: string | null;
  category?: TableCategoryData | null;
  capacity: number;
  status: 'FREE' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLED' | 'CLEANING' | 'OUT_OF_SERVICE';
  cleaningStatus?: 'CLEAN' | 'DIRTY' | 'CLEANING';
  maintenanceNotes?: string | null;
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
  endTime?: string;
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
  packingCharge?: number;
  orderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | string;
  serverName?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  sendToKitchen?: boolean;
  outlet?: string;
  customerId?: string;
  overrideLimit?: boolean;
  overrideReason?: string;
  tableId?: string;
  tableNumber?: string;
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
  packingCharge?: number;
  packingStatus?: string;
  packingDetailsJson?: string;
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
  department?: 'KOT' | 'BOT';
  dispatchedQuantity?: number;
  kotNumber?: string;
  botNumber?: string;
}

export interface ActiveRestaurantOrderData {
  id: string;
  hotelId?: string;
  orderNumber: string;
  kotNumber?: string;
  botNumber?: string;
  outlet: string;
  tableId?: string | null;
  table?: { id: string; tableNumber: string; section?: string; capacity?: number };
  roomId?: string | null;
  room?: { id: string; number: string };
  guestId?: string | null;
  guest?: { id: string; firstName: string; lastName: string; phone?: string };
  customerName?: string | null;
  customerPhone?: string | null;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'SERVED' | 'BILLED' | 'COMPLETED' | 'CANCELLED';
  orderType: 'DINE_IN' | 'NO_TABLE' | 'TAKEAWAY' | 'ROOM_SERVICE' | 'COUNTER_SALE' | 'ONLINE' | 'DELIVERY';
  serverName: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  tax: number;
  serviceCharge: number;
  packingCharge?: number;
  packingStatus?: string;
  packingDetailsJson?: string;
  total: number;
  paymentMethod?: string | null;
  isPaid: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: RestaurantOrderItemData[];
}

export type BillingType = 'QUICK_BILL' | 'WALK_IN' | 'TABLE_ORDER' | 'ROOM_SERVICE' | 'HOTEL_CHECKOUT';
export type BillPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'CREDIT' | 'VOID' | 'REFUNDED';

export interface BillLineItem {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  category?: string;
  notes?: string;
}

export interface BillPaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionRef?: string;
  receivedBy?: string;
  notes?: string;
}

export interface BillData {
  id: string;
  hotelId: string;
  billNumber: string;
  billingType: BillingType;
  orderId?: string | null;
  orderNumber?: string | null;
  reservationId?: string | null;
  bookingCode?: string | null;
  guestId?: string | null;
  roomNumber?: string | null;
  tableNumber?: string | null;
  serverOrStaff?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  serviceCharge: number;
  packingCharge?: number;
  packingStatus?: string;
  packingDetailsJson?: string;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: BillPaymentStatus;
  paymentMethod: string;
  itemsJson: string;
  paymentsJson: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSummaryData {
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  totalBills: number;
}

export interface GetBillsResponse {
  items: BillData[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: BillingSummaryData;
}

export interface ReservationAlertData {
  id: string;
  hotelId: string;
  reservationId: string;
  reservationCode: string;
  customerName: string;
  phoneNumber: string;
  partySize: number;
  reservationTime: string;
  reservationDate?: string | null;
  tableId?: string | null;
  tableNumber: string;
  section: string;
  tableCleaningStatus: string;
  tableStatus: string;
  alertType: 'PREPARATION_15MIN' | 'TABLE_DIRTY' | 'OVERDUE_OCCUPIED' | string;
  scheduledFor: string;
  triggeredAt?: string | null;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED' | 'CANCELLED';
  severity: 'INFO' | 'WARNING' | 'DANGER';
  title: string;
  message: string;
  targetRoles: string;
  isRead: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  createdAt: string;
}



// =========================================================================
// INVENTORY & SUPPLIER MANAGEMENT TYPES
// =========================================================================

export type SupplierCategory =
  | 'Grocery'
  | 'Beverage'
  | 'Alcohol'
  | 'Meat'
  | 'Vegetables'
  | 'General'
  | 'Other';

export interface SupplierRecord {
  id: string;
  code?: string;
  name: string;
  contactPerson?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  category?: string;
  notes?: string;
  isActive?: boolean;
  creditLimit?: number;
  paymentTermsDays?: number;
  openingBalance?: number;
  advanceBalance?: number;
  currentBalance?: number;
  supplierType?: string;
  branchOrOutlet?: string;
  purchasesCount?: number;
  itemsCount?: number;
  purchases?: any[];
  items?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseType = 'SIMPLE' | 'FULL';
export type PurchasePaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
export type PurchasePaymentMethod = 'CASH' | 'BANK' | 'CARD' | 'CREDIT' | 'OTHER';

export interface PurchaseLineItem {
  itemId?: string;
  itemName: string;
  category?: string;
  department?: string;
  quantity: number;
  purchaseUnit?: string;
  stockUnit?: string;
  conversionFactor?: number;
  unitCost: number;
  totalCost: number;
  trackStock?: boolean;
}

export interface PurchaseRecord {
  id: string;
  poNumber: string;
  purchaseType?: PurchaseType | string;
  purchaseDate?: string;
  orderedAt?: string;
  receivedAt?: string;
  supplierId?: string | null;
  supplierName?: string;
  supplierInvoiceNumber?: string | null;
  invoiceNumber?: string | null;
  supplierPanVatNumber?: string | null;
  panVatNumber?: string | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  additionalCharges?: number;
  totalAmount: number;
  paymentMethod?: PurchasePaymentMethod | string;
  paymentStatus: PurchasePaymentStatus | string;
  notes?: string | null;
  attachmentUrl?: string | null;
  createdBy?: string | null;
  status: string;
  itemsJson: string;
  allocationsJson?: string;
  items?: PurchaseLineItem[];
  supplier?: SupplierRecord | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerType = 'CASH' | 'CREDIT' | 'CORPORATE';
export type CreditStatus = 'ACTIVE' | 'BLOCKED';

export interface CustomerData {
  id: string;
  hotelId?: string | null;
  customerCode?: string;
  name: string;
  phone: string;
  email?: string | null;
  panVatNumber?: string | null;
  address?: string | null;
  customerType: CustomerType | string;
  creditLimit: number;
  creditStatus: CreditStatus;
  creditTerms?: number;
  advanceBalance?: number;
  branchOrOutlet?: string;
  openingBalance: number;
  currentOutstanding: number;
  availableCredit: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerLedgerEntryData {
  id: string;
  customerId: string;
  customerName?: string;
  billId?: string | null;
  date: string;
  referenceNumber?: string | null;
  billNumber?: string | null;
  description: string;
  entryType: 'DEBIT' | 'CREDIT';
  debit: number;
  credit: number;
  balance: number;
  paymentMode?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface CustomerUnpaidBillData {
  id: string;
  billNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  balanceDue?: number;
  dueDate?: string;
  outlet?: string;
  paymentStatus: string;
  itemsSummary?: string;
}

export interface ReceiveCreditPaymentPayload {
  customerId: string;
  billIds: string[];
  amount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'WALLET';
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface CreditOverridePayload {
  customerId: string;
  billNumber?: string;
  billAmount: number;
  creditLimit: number;
  currentOutstanding: number;
  overrideAmount: number;
  reason: string;
}

export interface CreditCustomerSummaryReport {
  customerId: string;
  customerName: string;
  phone: string;
  customerType: string;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  creditStatus: string;
  oldestUnpaidBillDate?: string | null;
  unpaidBillsCount: number;
}



// ==========================================
// ACCOUNTING: CHART OF ACCOUNTS & JOURNAL ENTRIES & GENERAL LEDGER
// ==========================================

export type AccountCategoryType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'REVENUE' | 'EXPENSE';

export interface AccountItem {
  id: string;
  hotelId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountCategoryType;
  subCategory: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  parentId?: string | null;
  accountLevel: number;
  isGroup: boolean;
  isControlAccount: boolean;
  allowManualEntries: boolean;
  openingBalance: number;
  openingBalanceDate?: string | null;
  currentBalance: number;
  description?: string | null;
  isActive: boolean;
  isSystemAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChartOfAccountsSummary {
  totalAccounts: number;
  postingAccountsCount?: number;
  groupAccountsCount?: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalIncome: number;
  totalRevenue?: number;
  totalExpenses: number;
  netProfitLoss: number;
}

export interface ChartOfAccountsResponse {
  accounts: AccountItem[];
  summary: ChartOfAccountsSummary;
}

export interface AccountMappingItem {
  id: string;
  hotelId: string;
  transactionType: string;
  transactionCategory: string;
  debitAccountId: string;
  debitAccount?: AccountItem;
  creditAccountId: string;
  creditAccount?: AccountItem;
  taxAccountId?: string | null;
  taxAccount?: AccountItem;
  serviceChargeAccountId?: string | null;
  serviceChargeAccount?: AccountItem;
  discountAccountId?: string | null;
  discountAccount?: AccountItem;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLineItem {
  id?: string;
  journalEntryId?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  lineDescription?: string;
  debit: number;
  credit: number;
}

export interface JournalEntryItem {
  id: string;
  hotelId: string;
  entryNumber: string;
  entryDate: string;
  entryType: 'GENERAL' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING' | string;
  reference?: string | null;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'POSTED' | 'DRAFT' | 'REVERSED' | 'VOID' | string;
  sourceModule: string;
  createdBy: string;
  postedBy?: string | null;
  postedAt?: string | null;
  reversedFromId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  lines: JournalEntryLineItem[];
}

export interface JournalEntriesSummary {
  totalEntries: number;
  postedEntries: number;
  draftEntries: number;
  reversedEntries: number;
  periodDebit: number;
  periodCredit: number;
}

export interface JournalEntriesResponse {
  items: JournalEntryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary?: JournalEntriesSummary;
}

export interface CreateJournalEntryPayload {
  entryNumber?: string;
  entryDate?: string;
  entryType?: string;
  reference?: string;
  description: string;
  status?: 'DRAFT' | 'POSTED' | string;
  sourceModule?: string;
  lines: Array<{
    accountId: string;
    lineDescription?: string;
    debit: number;
    credit: number;
  }>;
}

export interface GeneralLedgerTransaction {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  entryType?: string;
  reference?: string | null;
  description: string;
  lineDescription?: string | null;
  sourceModule: string;
  sourceTransactionId?: string | null;
  status?: string;
  createdBy?: string;
  postedBy?: string | null;
  postedAt?: string | null;
  reversedFromId?: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerReport {
  account: AccountItem | null;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  netChange: number;
  transactionCount: number;
  transactions: GeneralLedgerTransaction[];
}

export interface AllAccountsLedgerItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  subCategory?: string;
  normalBalance: string;
  openingBalance: number;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  closingDebit: number;
  closingCredit: number;
}

export interface AllAccountsLedgerReport {
  fromDate: string;
  toDate: string;
  accountType: string;
  totalAccounts: number;
  totals: {
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
  accounts: AllAccountsLedgerItem[];
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  subCategory?: string;
  normalBalance: string;
  openingBalance: number;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceTotals {
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceReport {
  fromDate: string;
  toDate: string;
  accountType: string;
  showZeroBalances: boolean;
  totalAccounts: number;
  isBalanced: boolean;
  difference: number;
  totals: TrialBalanceTotals;
  accounts: TrialBalanceItem[];
}

// ==========================================
// Sales Transactions Module Types
// ==========================================
export interface SalesTransactionListItem {
  id: string;
  hotelId: string;
  billNumber: string;
  billingType: string;
  salesChannel: string;
  outlet: string;
  orderId?: string | null;
  orderNumber?: string | null;
  tableNumber?: string | null;
  roomNumber?: string | null;
  serverOrStaff: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryCharge: number;
  packingCharge: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  refundAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  transactionStatus: string;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
}

export interface SalesTransactionsSummary {
  totalSales: number;
  totalInvoices: number;
  paidSales: number;
  unpaidSales: number;
  partiallyPaidCount: number;
  salesReturnsCount: number;
  refundAmount: number;
  netSales: number;
}

export interface GetSalesTransactionsResponse {
  items: SalesTransactionListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: SalesTransactionsSummary;
}

export interface SalesTransactionItemDetail {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  notes?: string;
}

// ==========================================
// Customer Ledger & Receivables Module Types
// ==========================================
export interface CustomerLedgerRecord {
  id: string;
  customerId: string;
  billId?: string | null;
  invoiceNumber?: string | null;
  paymentId?: string | null;
  entryDate: string;
  dueDate?: string | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  referenceType: string;
  referenceId?: string | null;
  paymentMode?: string | null;
  outlet: string;
  paymentStatus?: string | null;
  createdBy?: string | null;
  journalEntryId?: string | null;
}

export interface CustomerAgingBucket {
  billId: string;
  billNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  agingBucket: string;
}

export interface CustomerAgingReport {
  customer: {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
    creditTerms: number;
    currentOutstanding: number;
    advanceBalance: number;
  };
  agingSummary: {
    currentNotDue: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    above90Days: number;
    totalOverdue: number;
    totalReceivable: number;
  };
  invoices: CustomerAgingBucket[];
}

export interface CustomerStatementReport {
  hotel: {
    name: string;
    address: string;
    phone: string;
    email: string;
    panVat: string;
    currency: string;
    currencySymbol: string;
  };
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  ledger: any;
}


export interface SalesTransactionPaymentDetail {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionRef?: string;
  receivedBy?: string;
  notes?: string;
}

// ==========================================
// Customer Ledger & Receivables Module Types
// ==========================================
export interface CustomerLedgerRecord {
  id: string;
  customerId: string;
  billId?: string | null;
  invoiceNumber?: string | null;
  paymentId?: string | null;
  entryDate: string;
  dueDate?: string | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  referenceType: string;
  referenceId?: string | null;
  paymentMode?: string | null;
  outlet: string;
  paymentStatus?: string | null;
  createdBy?: string | null;
  journalEntryId?: string | null;
}

export interface CustomerAgingBucket {
  billId: string;
  billNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  agingBucket: string;
}

export interface CustomerAgingReport {
  customer: {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
    creditTerms: number;
    currentOutstanding: number;
    advanceBalance: number;
  };
  agingSummary: {
    currentNotDue: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    above90Days: number;
    totalOverdue: number;
    totalReceivable: number;
  };
  invoices: CustomerAgingBucket[];
}

export interface CustomerStatementReport {
  hotel: {
    name: string;
    address: string;
    phone: string;
    email: string;
    panVat: string;
    currency: string;
    currencySymbol: string;
  };
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  ledger: any;
}


export interface SalesTransactionReturnDetail {
  returnId: string;
  returnDate: string;
  returnedBy: string;
  reason: string;
  returnSubtotal: number;
  returnTax: number;
  totalRefundAmount: number;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    reason?: string;
    restockInventory: boolean;
  }[];
}

export interface SalesTransactionDetail {
  transaction: {
    id: string;
    hotelId: string;
    billNumber: string;
    billingType: string;
    salesChannel: string;
    outlet: string;
    orderId?: string | null;
    orderNumber?: string | null;
    tableNumber?: string | null;
    roomNumber?: string | null;
    serverOrStaff: string;
    customerId?: string | null;
    customerName: string;
    customerPhone?: string | null;
    customer?: {
      id: string;
      name: string;
      phone: string;
      address?: string;
      customerType?: string;
      currentOutstanding: number;
      creditLimit: number;
    } | null;
    subtotal: number;
    discountAmount: number;
    discountPercent: number;
    taxableAmount: number;
    taxAmount: number;
    serviceCharge: number;
    deliveryCharge: number;
    packingCharge: number;
    roundOff: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    refundAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    transactionStatus: string;
    cancellationReason?: string | null;
    cancelledBy?: string | null;
    cancelledAt?: string | null;
    returnReason?: string | null;
    returnedBy?: string | null;
    returnedAt?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    paidAt?: string | null;
    items: SalesTransactionItemDetail[];
    payments: SalesTransactionPaymentDetail[];
    returns: SalesTransactionReturnDetail[];
  };
  accounting?: {
    id: string;
    entryNumber: string;
    entryDate: string;
    reference: string;
    description: string;
    totalDebit: number;
    totalCredit: number;
    status: string;
    lines: {
      id: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      lineDescription?: string;
      debit: number;
      credit: number;
    }[];
  } | null;
  hotel: {
    name: string;
    slug: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    panVat: string;
    currency: string;
    currencySymbol: string;
  };
}

export interface CreateSalesTransactionRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  salesChannel: string;
  outlet?: string;
  tableNumber?: string;
  roomNumber?: string;
  cashierOrStaff?: string;
  items: {
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    notes?: string;
  }[];
  invoiceDiscountAmount?: number;
  taxRatePercent?: number;
  serviceChargePercent?: number;
  deliveryCharge?: number;
  packingCharge?: number;
  payments?: {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionRef?: string;
    receivedBy?: string;
    notes?: string;
  }[];
  notes?: string;
}

// ==========================================
// Customer Ledger & Receivables Module Types
// ==========================================
export interface CustomerLedgerRecord {
  id: string;
  customerId: string;
  billId?: string | null;
  invoiceNumber?: string | null;
  paymentId?: string | null;
  entryDate: string;
  dueDate?: string | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  referenceType: string;
  referenceId?: string | null;
  paymentMode?: string | null;
  outlet: string;
  paymentStatus?: string | null;
  createdBy?: string | null;
  journalEntryId?: string | null;
}

export interface CustomerAgingBucket {
  billId: string;
  billNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  agingBucket: string;
}

export interface CustomerAgingReport {
  customer: {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
    creditTerms: number;
    currentOutstanding: number;
    advanceBalance: number;
  };
  agingSummary: {
    currentNotDue: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    above90Days: number;
    totalOverdue: number;
    totalReceivable: number;
  };
  invoices: CustomerAgingBucket[];
}

export interface CustomerStatementReport {
  hotel: {
    name: string;
    address: string;
    phone: string;
    email: string;
    panVat: string;
    currency: string;
    currencySymbol: string;
  };
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  ledger: any;
}




export interface CustomerAgingBucket {
  billId: string;
  billNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  agingBucket: string;
}

export interface CustomerAgingReport {
  customer: {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
    creditTerms: number;
    currentOutstanding: number;
    advanceBalance: number;
  };
  agingSummary: {
    currentNotDue: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    above90Days: number;
    totalOverdue: number;
    totalReceivable: number;
  };
  invoices: CustomerAgingBucket[];
}

export interface CustomerStatementReport {
  hotel: {
    name: string;
    address: string;
    phone: string;
    email: string;
    panVat: string;
    currency: string;
    currencySymbol: string;
  };
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  ledger: any;
}



export interface PurchaseItem {
  itemId?: string;
  itemName: string;
  itemCode?: string;
  category?: string;
  unit?: string;
  purchaseUnit?: string;
  conversionFactor: number;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  department?: string;
  warehouse?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface PurchasePaymentRecord {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  paidBy?: string;
  cashOrBankAccount?: string;
  notes?: string;
}

export interface PurchaseReturnItem {
  itemName: string;
  itemId?: string;
  returnQuantity: number;
  unitCost: number;
  returnSubtotal: number;
  taxAmount: number;
  totalRefundAmount: number;
  reason?: string;
  deductStock: boolean;
}

export interface PurchaseReturnRecord {
  returnId: string;
  returnNumber: string;
  returnDate: string;
  returnedBy: string;
  reason: string;
  returnSubtotal: number;
  returnTax: number;
  totalRefundAmount: number;
  debitNoteNumber?: string;
  items: PurchaseReturnItem[];
}

export interface PurchaseTransactionListItem {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber: string;
  purchaseDate: string;
  invoiceDate: string;
  dueDate?: string;
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  panVatNumber?: string;
  purchaseType: string;
  branchOrOutlet: string;
  warehouse: string;
  purchaseOrderRef?: string;
  grnNumber?: string;
  subtotal: number;
  discount: number;
  tax: number;
  freightCharges: number;
  additionalCharges: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  receivingStatus: string;
  transactionStatus: string;
  createdBy: string;
  approvedBy?: string;
  journalEntryId?: string;
  notes?: string;
  itemsCount: number;
  itemsSummary: string;
  items?: PurchaseItem[];
  payments?: PurchasePaymentRecord[];
  returns?: PurchaseReturnRecord[];
}

export interface PurchaseTransactionsSummary {
  totalPurchases: number;
  totalPurchaseInvoices: number;
  paidPurchases: number;
  unpaidPurchases: number;
  partiallyPaidPurchases: number;
  purchaseReturns: number;
  outstandingPayables: number;
}


// ============================================================================
// SUPPLIER LEDGER TYPES
// ============================================================================

export interface SupplierLedgerEntryData {
  id: string;
  entryDate: string;
  transactionNumber?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  purchaseInvoiceNumber?: string;
  description: string;
  creditAmount: number;
  debitAmount: number;
  balance: number;
  dueDate?: string;
  referenceType: string;
  referenceId?: string;
  paymentMode?: string;
  branchOrOutlet?: string;
  journalEntryId?: string;
  notes?: string;
  createdBy?: string;
  status: string;
}

export interface SupplierLedgerSummary {
  openingPayableBalance: number;
  totalPurchases: number;
  totalPayments: number;
  purchaseReturns: number;
  debitNotes: number;
  creditNotes: number;
  outstandingPayable: number;
  supplierAdvanceBalance: number;
  overdueAmount: number;
  creditLimit?: number;
  paymentTermsDays?: number;
}

export interface SupplierUnpaidPurchaseData {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  dueDate?: string;
  isOverdue: boolean;
  daysOverdue: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  branchOrOutlet?: string;
  status?: string;
  paymentStatus?: string;
}

export interface SupplierAgingReport {
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  currentNotDue: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdueAbove90: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoices: {
    id: string;
    purchaseNumber: string;
    supplierInvoiceNumber?: string;
    purchaseDate: string;
    dueDate: string;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    isOverdue: boolean;
    daysOverdue: number;
  }[];
}

export interface SupplierStatementReport {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPan: string;
  restaurantPhone: string;
  statementNumber: string;
  statementDate: string;
  startDate: string;
  endDate: string;
  supplier: {
    name: string;
    code: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    panVatNumber?: string;
    advanceBalance?: number;
  };
  openingBalance: number;
  closingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  transactions: {
    date: string;
    referenceNumber: string;
    referenceType: string;
    description: string;
    purchaseInvoiceNumber?: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
  outstandingInvoices: {
    id: string;
    purchaseNumber: string;
    invoiceNumber?: string;
    purchaseDate: string;
    dueDate: string;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
  }[];
}

export interface CashAccountRecord {
  id: string;
  accountName: string;
  accountCode: string;
  branchOrOutlet: string;
  accountType: string;
  openingBalance: number;
  openingBalanceDate?: string;
  currentBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  todayCashIn: number;
  todayCashOut: number;
  responsibleEmployee?: string;
  isActive: boolean;
  description?: string;
}

export interface CashAccountsSummary {
  totalCashBalance: number;
  cashReceived: number;
  cashPaid: number;
  todayCashBalance: number;
}

export interface CashTransactionItem {
  id: string;
  date: string;
  referenceNumber: string;
  entryNumber: string;
  transactionType: string;
  description: string;
  cashIn: number;
  cashOut: number;
  runningBalance: number;
  sourceModule: string;
  createdBy: string;
  journalEntryId: string;
  accountId: string;
  accountName: string;
  accountCode: string;
}

export interface CashReconciliationRecord {
  id: string;
  reconciliationNumber: string;
  reconciliationDate: string;
  accountId: string;
  systemBalance: number;
  physicalCount: number;
  difference: number;
  status: 'MATCHED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  explanation?: string;
  denominationsJson?: string;
  reconciledBy: string;
  approvedBy?: string;
  approvedAt?: string;
  journalEntryId?: string;
  account?: {
    accountName: string;
    accountCode: string;
  };
}

export interface BankWalletAccountRecord {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'BANK' | 'WALLET';
  subCategory: string;
  bankName?: string;
  accountNumber?: string;
  rawAccountNumber?: string;
  accountHolderName?: string;
  branch: string;
  walletProvider?: string;
  merchantId?: string;
  rawMerchantId?: string;
  registeredMobileNumber?: string;
  directBankSettlement?: boolean;
  openingBalance: number;
  openingBalanceDate: string;
  currentBalance: number;
  totalIn: number;
  totalOut: number;
  isActive: boolean;
  description?: string;
}

export interface BankWalletSummary {
  totalAccountBalance: number;
  totalBankBalance: number;
  totalWalletBalance: number;
}

export interface BankWalletTransactionItem {
  id: string;
  date: string;
  referenceNumber: string;
  entryNumber: string;
  description: string;
  transactionType: string;
  debit: number;
  credit: number;
  runningBalance: number;
  sourceModule: string;
  status: string;
  createdBy: string;
  journalEntryId: string;
}




// ============================================================================
// SUPPLIER LEDGER TYPES
// ============================================================================

export interface SupplierLedgerEntryData {
  id: string;
  entryDate: string;
  transactionNumber?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  purchaseInvoiceNumber?: string;
  description: string;
  creditAmount: number;
  debitAmount: number;
  balance: number;
  dueDate?: string;
  referenceType: string;
  referenceId?: string;
  paymentMode?: string;
  branchOrOutlet?: string;
  journalEntryId?: string;
  notes?: string;
  createdBy?: string;
  status: string;
}

export interface SupplierLedgerSummary {
  openingPayableBalance: number;
  totalPurchases: number;
  totalPayments: number;
  purchaseReturns: number;
  debitNotes: number;
  creditNotes: number;
  outstandingPayable: number;
  supplierAdvanceBalance: number;
  overdueAmount: number;
  creditLimit?: number;
  paymentTermsDays?: number;
}

export interface SupplierUnpaidPurchaseData {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  dueDate?: string;
  isOverdue: boolean;
  daysOverdue: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  branchOrOutlet?: string;
  status?: string;
  paymentStatus?: string;
}

export interface SupplierAgingReport {
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  currentNotDue: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdueAbove90: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoices: {
    id: string;
    purchaseNumber: string;
    supplierInvoiceNumber?: string;
    purchaseDate: string;
    dueDate: string;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    isOverdue: boolean;
    daysOverdue: number;
  }[];
}

export interface SupplierStatementReport {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPan: string;
  restaurantPhone: string;
  statementNumber: string;
  statementDate: string;
  startDate: string;
  endDate: string;
  supplier: {
    name: string;
    code: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    panVatNumber?: string;
    advanceBalance?: number;
  };
  openingBalance: number;
  closingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  transactions: {
    date: string;
    referenceNumber: string;
    referenceType: string;
    description: string;
    purchaseInvoiceNumber?: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
  outstandingInvoices: {
    id: string;
    purchaseNumber: string;
    invoiceNumber?: string;
    purchaseDate: string;
    dueDate: string;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
  }[];
}

export interface CashAccountRecord {
  id: string;
  accountName: string;
  accountCode: string;
  branchOrOutlet: string;
  accountType: string;
  openingBalance: number;
  openingBalanceDate?: string;
  currentBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  todayCashIn: number;
  todayCashOut: number;
  responsibleEmployee?: string;
  isActive: boolean;
  description?: string;
}

export interface CashAccountsSummary {
  totalCashBalance: number;
  cashReceived: number;
  cashPaid: number;
  todayCashBalance: number;
}

export interface CashTransactionItem {
  id: string;
  date: string;
  referenceNumber: string;
  entryNumber: string;
  transactionType: string;
  description: string;
  cashIn: number;
  cashOut: number;
  runningBalance: number;
  sourceModule: string;
  createdBy: string;
  journalEntryId: string;
  accountId: string;
  accountName: string;
  accountCode: string;
}

export interface CashReconciliationRecord {
  id: string;
  reconciliationNumber: string;
  reconciliationDate: string;
  accountId: string;
  systemBalance: number;
  physicalCount: number;
  difference: number;
  status: 'MATCHED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  explanation?: string;
  denominationsJson?: string;
  reconciledBy: string;
  approvedBy?: string;
  approvedAt?: string;
  journalEntryId?: string;
  account?: {
    accountName: string;
    accountCode: string;
  };
}

export interface BankWalletAccountRecord {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'BANK' | 'WALLET';
  subCategory: string;
  bankName?: string;
  accountNumber?: string;
  rawAccountNumber?: string;
  accountHolderName?: string;
  branch: string;
  walletProvider?: string;
  merchantId?: string;
  rawMerchantId?: string;
  registeredMobileNumber?: string;
  directBankSettlement?: boolean;
  openingBalance: number;
  openingBalanceDate: string;
  currentBalance: number;
  totalIn: number;
  totalOut: number;
  isActive: boolean;
  description?: string;
}

export interface BankWalletSummary {
  totalAccountBalance: number;
  totalBankBalance: number;
  totalWalletBalance: number;
}

export interface BankWalletTransactionItem {
  id: string;
  date: string;
  referenceNumber: string;
  entryNumber: string;
  description: string;
  transactionType: string;
  debit: number;
  credit: number;
  runningBalance: number;
  sourceModule: string;
  status: string;
  createdBy: string;
  journalEntryId: string;
}



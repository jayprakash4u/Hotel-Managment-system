export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  baseName?: string;
  category?: string;
  unit?: string;
  availableUnits?: { unit: string; price: number }[];
  price: number;
  quantity: number;
  discount?: number;
  discountType?: 'PERCENT' | 'AMOUNT';
  remarks?: string;
  status?: 'DRAFT' | 'KITCHEN' | 'PREPARING' | 'READY' | 'SERVED';
  kotNumber?: string;
  department?: 'KOT' | 'BOT';
  dispatchedQuantity?: number;
  botNumber?: string;
  preparationMethod?: 'READY_TO_SERVE' | 'REQUIRES_PREPARATION' | 'NOT_CONFIGURED';
}

export function calculateOrderItemTotal(item: OrderItem): {
  subtotal: number;
  discountAmount: number;
  total: number;
} {
  const subtotal = item.price * item.quantity;
  const discValue = item.discount || 0;
  let discountAmount = 0;
  if (discValue > 0) {
    if (item.discountType === 'AMOUNT') {
      discountAmount = Math.min(subtotal, discValue);
    } else {
      discountAmount = (subtotal * Math.min(100, discValue)) / 100;
    }
  }
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total };
}

export interface TableItem {
  id: string;
  tableNumber: string;
  section: string;
  categoryId?: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLED' | 'CLEANING' | 'OUT_OF_SERVICE';
  cleaningStatus?: 'CLEAN' | 'DIRTY' | 'CLEANING';
  maintenanceNotes?: string;
  currentGuest?: string;
  guestPhone?: string;
  orders?: OrderItem[];
  activeOrderId?: string;
  kotNumber?: string;
  discountPercent?: number;
  discountAmount?: number;
  roundOff?: number;
  paidAmount?: number;
  paymentMode?: string;
  billRemarks?: string;
  upcomingReservations?: any[];
  orderNumber?: string;
  orderType?: string;
  isNoTable?: boolean;
  notes?: string;
  seatingNote?: string;
}

export const DEFAULT_TABLES: TableItem[] = [
  { id: 'tbl-1', tableNumber: 'T-01', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-2', tableNumber: 'T-02', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-3', tableNumber: 'T-03', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-4', tableNumber: 'T-04', section: 'Indoor Fine Dining', capacity: 6, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-5', tableNumber: 'T-05', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-6', tableNumber: 'T-06', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-7', tableNumber: 'T-07', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-8', tableNumber: 'T-08', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-9', tableNumber: 'T-09', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-10', tableNumber: 'T-10', section: 'Skyline Rooftop Terrace', capacity: 6, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-11', tableNumber: 'T-11', section: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-12', tableNumber: 'T-12', section: 'Poolside Lounge & Bar', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-13', tableNumber: 'T-13', section: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-14', tableNumber: 'T-14', section: 'Private Executive Dining', capacity: 10, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-15', tableNumber: 'T-15', section: 'Private Executive Dining', capacity: 12, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-16', tableNumber: 'T-16', section: 'Private Executive Dining', capacity: 8, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-17', tableNumber: 'T-17', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
  { id: 'tbl-18', tableNumber: 'T-18', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'AVAILABLE', cleaningStatus: 'CLEAN', orders: [] },
];

const MOCK_DEMO_GUESTS = new Set([
  'Alexander Hayes',
  'Sophia Loren',
  'Marcus Sterling',
  'David Miller',
  'Elena Rostova',
  'Lady Genevieve',
]);

export function loadTablesFromStorage(): TableItem[] {
  if (typeof window === 'undefined') return DEFAULT_TABLES;
  try {
    const raw = localStorage.getItem('aura_restaurant_tables_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: TableItem) => {
          const cleanOrders = (t.orders || []).filter((o) => !o.id?.startsWith('ord-init'));
          const isMockGuest = t.currentGuest && MOCK_DEMO_GUESTS.has(t.currentGuest);
          return {
            ...t,
            currentGuest: isMockGuest ? undefined : t.currentGuest,
            guestPhone: isMockGuest ? undefined : t.guestPhone,
            status: isMockGuest && cleanOrders.length === 0 ? 'AVAILABLE' : t.status,
            orders: cleanOrders,
            cleaningStatus: t.cleaningStatus || (t.status === 'CLEANING' ? 'DIRTY' : 'CLEAN'),
            maintenanceNotes: t.maintenanceNotes || '',
          };
        });
      }
    }
  } catch {}
  return DEFAULT_TABLES;
}


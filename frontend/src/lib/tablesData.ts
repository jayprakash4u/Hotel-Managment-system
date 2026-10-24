export interface OrderItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}

export interface TableItem {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentGuest?: string;
  guestPhone?: string;
  orders?: OrderItem[];
}

export const DEFAULT_TABLES: TableItem[] = [
  { id: 'tbl-1', tableNumber: 'T-01', section: 'Indoor Fine Dining', capacity: 4, status: 'OCCUPIED', currentGuest: 'Alexander Hayes', guestPhone: '+1 555-0192', orders: [] },
  { id: 'tbl-2', tableNumber: 'T-02', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-3', tableNumber: 'T-03', section: 'Indoor Fine Dining', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-4', tableNumber: 'T-04', section: 'Indoor Fine Dining', capacity: 6, status: 'OCCUPIED', currentGuest: 'Sophia Loren', guestPhone: '+1 555-0144', orders: [] },
  { id: 'tbl-5', tableNumber: 'T-05', section: 'Indoor Fine Dining', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-6', tableNumber: 'T-06', section: 'Indoor Fine Dining', capacity: 4, status: 'RESERVED', currentGuest: 'Marcus Sterling', guestPhone: '+1 555-0129', orders: [] },
  { id: 'tbl-7', tableNumber: 'T-07', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-8', tableNumber: 'T-08', section: 'Skyline Rooftop Terrace', capacity: 2, status: 'OCCUPIED', currentGuest: 'David Miller', guestPhone: '+1 555-0188', orders: [] },
  { id: 'tbl-9', tableNumber: 'T-09', section: 'Skyline Rooftop Terrace', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-10', tableNumber: 'T-10', section: 'Skyline Rooftop Terrace', capacity: 6, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-11', tableNumber: 'T-11', section: 'Poolside Lounge & Bar', capacity: 4, status: 'OCCUPIED', currentGuest: 'Elena Rostova', guestPhone: '+1 555-0163', orders: [] },
  { id: 'tbl-12', tableNumber: 'T-12', section: 'Poolside Lounge & Bar', capacity: 2, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-13', tableNumber: 'T-13', section: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-14', tableNumber: 'T-14', section: 'Private Executive Dining', capacity: 10, status: 'AVAILABLE', orders: [] },
  { id: 'tbl-15', tableNumber: 'T-15', section: 'Private Executive Dining', capacity: 12, status: 'OCCUPIED', currentGuest: 'Lady Genevieve', guestPhone: '+1 555-0111', orders: [] },
  { id: 'tbl-16', tableNumber: 'T-16', section: 'Private Executive Dining', capacity: 8, status: 'AVAILABLE', orders: [] },
];

export function loadTablesFromStorage(): TableItem[] {
  if (typeof window === 'undefined') return DEFAULT_TABLES;
  try {
    const raw = localStorage.getItem('hotel_dining_tables');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_TABLES;
}

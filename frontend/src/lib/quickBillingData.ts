'use client';

// =======================================================================
// QUICK BILLING POS DATA MODEL & SEQUENTIAL SERIES ENGINE
// Rules Enforced:
// 1. Save ≠ Print. A bill can be saved as OPEN without printing.
// 2. Open Order tick decides lane:
//    - Ticked -> saved as OPEN, goes to Open Orders area, editable in rounds.
//    - Unticked -> normal quick bill, printed/paid, straight to History.
// 3. One customer / one order = one bill record. Repeat rounds added as lines.
// 4. Two independent sequential number series:
//    - Master Bill # for EVERY bill (e.g. BILL-1001, no gaps, no reuse).
//    - VAT Invoice # only for VAT bills (e.g. INV-0001, legal series).
// 5. Open bills cannot be printed as final tax invoice (only PROFORMA).
// 6. Once PAID, locked forever. Voids require reason. Never delete.
// 7. Day closing requires 0 open orders; warns staff if any open orders remain.
// =======================================================================

export type BillSource = 'NO_TABLE' | 'QUICK' | 'RESTAURANT' | 'HOTEL';
export type BillType = 'NORMAL' | 'VAT';
export type BillStatus = 'OPEN' | 'PAID' | 'CANCELLED';

export interface BillItemRound {
  id: string;
  roundNumber: number;
  addedAt: string; // ISO string
  productId?: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  notes?: string;
}

export interface QuickBillRecord {
  id: string;
  masterBillNumber: string;        // Sequential: BILL-1001, BILL-1002...
  vatInvoiceNumber?: string;       // Sequential: INV-0001, INV-0002... (only when settled as VAT)
  isOpenOrder: boolean;            // The lane switch (Ticked vs Unticked)
  status: BillStatus;              // 'OPEN' | 'PAID' | 'CANCELLED'
  token: string;                   // Mandatory for open orders (e.g. "Token #7", "Chair #3")
  source: BillSource;              // 'NO_TABLE' | 'QUICK' | 'RESTAURANT' | 'HOTEL'
  billType: BillType;              // 'NORMAL' | 'VAT'
  items: BillItemRound[];          // Items with rounds and timestamps
  currentRound: number;            // 1, 2, 3...
  
  // Financial breakdown
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  vatPercent: number;              // 13% for VAT bills, 0 for Normal
  vatAmount: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  changeDue: number;
  paymentMethod: string;           // 'CASH' | 'CARD' | 'QR_PAY' | 'CREDIT' | 'ROOM_FOLIO'
  
  // Customer info (Optional)
  customerName?: string;
  customerPhone?: string;
  customerPan?: string;            // Required / recommended for VAT bills
  
  // Auditing
  openedAt: string;                // ISO timestamp
  lastUpdatedAt: string;           // ISO timestamp
  paidAt?: string;                 // ISO timestamp when settled
  cancelledAt?: string;            // ISO timestamp if cancelled
  cancelReason?: string;           // Mandatory if cancelled
  staffUser: string;               // Staff name / user id
  notes?: string;
}

export interface DayClosingSummary {
  date: string;
  totalSales: number;
  totalNormalSales: number;
  totalVatSales: number;
  totalVatAmount: number;
  normalBillsCount: number;
  vatBillsCount: number;
  cancelledBillsCount: number;
  openBillsCount: number;
  salesBySource: Record<BillSource, { count: number; total: number }>;
  firstBillNumber: string;
  lastBillNumber: string;
  continuityIntact: boolean;
  missingBillNumbers: string[];
  openOrdersRemaining: QuickBillRecord[];
}

const STORAGE_KEYS = {
  BILLS: 'restaurant_quick_bills',
  MASTER_SEQ: 'restaurant_bill_master_seq',
  VAT_SEQ: 'restaurant_vat_invoice_seq',
  UPDATED_EVENT: 'restaurant_quick_bills_updated',
} as const;

// Helper to format source name for display
export function formatSourceName(source: BillSource): string {
  switch (source) {
    case 'NO_TABLE':
      return 'No-table (Chair / Lounge)';
    case 'QUICK':
      return 'Quick Walk-in (Pack / Takeaway)';
    case 'RESTAURANT':
      return 'Restaurant Dine-in';
    case 'HOTEL':
      return 'Hotel Guest';
    default:
      return source;
  }
}

// Generate next sequential Master Bill # (e.g. BILL-1001, no gaps, no reuse)
export function getNextMasterBillNumber(): string {
  if (typeof window === 'undefined') return 'BILL-1001';
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_SEQ);
    let current = raw ? parseInt(raw, 10) : 1000;
    if (isNaN(current) || current < 1000) current = 1000;
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.MASTER_SEQ, next.toString());
    return `BILL-${next}`;
  } catch {
    return `BILL-${Date.now().toString().slice(-4)}`;
  }
}

// Generate next sequential legal VAT Invoice # (e.g. INV-0001, strictly sequential)
export function getNextVatInvoiceNumber(): string {
  if (typeof window === 'undefined') return 'INV-0001';
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VAT_SEQ);
    let current = raw ? parseInt(raw, 10) : 0;
    if (isNaN(current) || current < 0) current = 0;
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.VAT_SEQ, next.toString());
    return `INV-${String(next).padStart(4, '0')}`;
  } catch {
    return `INV-${String(Date.now()).slice(-4)}`;
  }
}

// Peek next sequence without incrementing (for preview)
export function peekNextMasterBillNumber(): string {
  if (typeof window === 'undefined') return 'BILL-1001';
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_SEQ);
    let current = raw ? parseInt(raw, 10) : 1000;
    if (isNaN(current) || current < 1000) current = 1000;
    return `BILL-${current + 1}`;
  } catch {
    return 'BILL-1001';
  }
}

// Initial seed bills for demonstration & immediate testing
function getInitialBills(): QuickBillRecord[] {
  const now = new Date();
  const tMinus15m = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const tMinus35m = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
  const tMinus55m = new Date(now.getTime() - 55 * 60 * 1000).toISOString();
  const tMinus2h = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const tMinus1h = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

  return [
    // Open Order 1: Token #7 sitting on chair with multiple rounds
    {
      id: 'qb-1001',
      masterBillNumber: 'BILL-1001',
      isOpenOrder: true,
      status: 'OPEN',
      token: 'Token #7 (Corner Chair)',
      source: 'NO_TABLE',
      billType: 'NORMAL',
      currentRound: 2,
      openedAt: tMinus35m,
      lastUpdatedAt: tMinus15m,
      staffUser: 'Ramesh T.',
      items: [
        {
          id: 'item-1001-1',
          roundNumber: 1,
          addedAt: tMinus35m,
          name: 'Chicken Steam Momo',
          category: 'Appetizers & Starters',
          unit: 'Plate (10 Pcs)',
          unitPrice: 280,
          quantity: 2,
          total: 560,
        },
        {
          id: 'item-1001-2',
          roundNumber: 1,
          addedAt: tMinus35m,
          name: 'Mineral Water (1 Ltr)',
          category: 'Beverages',
          unit: 'Bottle',
          unitPrice: 50,
          quantity: 1,
          total: 50,
        },
        {
          id: 'item-1001-3',
          roundNumber: 2,
          addedAt: tMinus15m,
          name: 'Tuborg Classic Beer (650ml)',
          category: 'Bar & Beverages',
          unit: 'Bottle',
          unitPrice: 480,
          quantity: 2,
          total: 960,
          notes: 'Chilled bottle with glasses',
        },
      ],
      subtotal: 1570,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1570,
      vatPercent: 0,
      vatAmount: 0,
      roundOff: 0,
      grandTotal: 1570,
      paidAmount: 0,
      changeDue: 0,
      paymentMethod: 'CASH',
      notes: 'Customer sitting at lounge chair, ordering in rounds',
    },
    // Open Order 2: Token #12 sitting on chair
    {
      id: 'qb-1002',
      masterBillNumber: 'BILL-1002',
      isOpenOrder: true,
      status: 'OPEN',
      token: 'Token #12 (Balcony Barstool)',
      source: 'NO_TABLE',
      billType: 'VAT',
      currentRound: 1,
      openedAt: tMinus55m,
      lastUpdatedAt: tMinus55m,
      staffUser: 'Priya S.',
      items: [
        {
          id: 'item-1002-1',
          roundNumber: 1,
          addedAt: tMinus55m,
          name: 'Chicken Sekuwa Platter',
          category: 'Appetizers & Starters',
          unit: 'Plate',
          unitPrice: 420,
          quantity: 1,
          total: 420,
        },
        {
          id: 'item-1002-2',
          roundNumber: 1,
          addedAt: tMinus55m,
          name: 'Fresh Mint Lemonade',
          category: 'Beverages',
          unit: 'Glass',
          unitPrice: 160,
          quantity: 2,
          total: 320,
        },
      ],
      subtotal: 740,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 740,
      vatPercent: 13,
      vatAmount: 96.2,
      roundOff: -0.2,
      grandTotal: 836,
      paidAmount: 0,
      changeDue: 0,
      paymentMethod: 'QR_PAY',
    },
    // Settled Bill 1: Walk-in Pack Customer (Never in open orders)
    {
      id: 'qb-1003',
      masterBillNumber: 'BILL-1003',
      isOpenOrder: false,
      status: 'PAID',
      token: 'Pack Walk-in',
      source: 'QUICK',
      billType: 'NORMAL',
      currentRound: 1,
      openedAt: tMinus2h,
      lastUpdatedAt: tMinus2h,
      paidAt: tMinus2h,
      staffUser: 'Ramesh T.',
      items: [
        {
          id: 'item-1003-1',
          roundNumber: 1,
          addedAt: tMinus2h,
          name: 'Chicken Fried Rice',
          category: 'Main Course',
          unit: 'Plate',
          unitPrice: 260,
          quantity: 2,
          total: 520,
          notes: 'Packed for takeaway',
        },
        {
          id: 'item-1003-2',
          roundNumber: 1,
          addedAt: tMinus2h,
          name: 'Coca-Cola (500ml)',
          category: 'Beverages',
          unit: 'Bottle',
          unitPrice: 90,
          quantity: 2,
          total: 180,
        },
      ],
      subtotal: 700,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 700,
      vatPercent: 0,
      vatAmount: 0,
      roundOff: 0,
      grandTotal: 700,
      paidAmount: 700,
      changeDue: 0,
      paymentMethod: 'CASH',
      customerName: 'Sanjay Subedi',
    },
    // Settled Bill 2: Settled VAT Invoice
    {
      id: 'qb-1004',
      masterBillNumber: 'BILL-1004',
      vatInvoiceNumber: 'INV-0001',
      isOpenOrder: false,
      status: 'PAID',
      token: 'Corporate Guest',
      source: 'HOTEL',
      billType: 'VAT',
      currentRound: 1,
      openedAt: tMinus1h,
      lastUpdatedAt: tMinus1h,
      paidAt: tMinus1h,
      staffUser: 'Sunita G.',
      items: [
        {
          id: 'item-1004-1',
          roundNumber: 1,
          addedAt: tMinus1h,
          name: 'Buff Chilli Momo',
          category: 'Appetizers & Starters',
          unit: 'Plate',
          unitPrice: 240,
          quantity: 3,
          total: 720,
        },
        {
          id: 'item-1004-2',
          roundNumber: 1,
          addedAt: tMinus1h,
          name: 'Mineral Water (1 Ltr)',
          category: 'Beverages',
          unit: 'Bottle',
          unitPrice: 50,
          quantity: 4,
          total: 200,
        },
      ],
      subtotal: 920,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 920,
      vatPercent: 13,
      vatAmount: 119.6,
      roundOff: 0.4,
      grandTotal: 1040,
      paidAmount: 1040,
      changeDue: 0,
      paymentMethod: 'CARD',
      customerName: 'Vertex Tech Pvt Ltd',
      customerPan: '601245892',
    },
  ];
}

// Load all bills from storage
export function getAllQuickBills(): QuickBillRecord[] {
  if (typeof window === 'undefined') return getInitialBills();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Seed initial demo data
    const initial = getInitialBills();
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(initial));
    localStorage.setItem(STORAGE_KEYS.MASTER_SEQ, '1004');
    localStorage.setItem(STORAGE_KEYS.VAT_SEQ, '1');
    return initial;
  } catch (err) {
    console.error('Failed to load quick bills', err);
    return getInitialBills();
  }
}

// Save or update a quick bill
export function saveQuickBill(bill: QuickBillRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const bills = getAllQuickBills();
    const idx = bills.findIndex((b) => b.id === bill.id);
    let updated: QuickBillRecord[];
    if (idx >= 0) {
      updated = [...bills];
      updated[idx] = { ...bill, lastUpdatedAt: new Date().toISOString() };
    } else {
      updated = [bill, ...bills];
    }
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(STORAGE_KEYS.UPDATED_EVENT, { detail: bill }));
  } catch (err) {
    console.error('Failed to save quick bill', err);
  }
}

// Check if a token number is already active in Open Orders (validation rule)
export function isTokenInActiveOpenOrders(token: string, currentBillId?: string): boolean {
  if (!token || !token.trim()) return false;
  const normalized = token.trim().toLowerCase();
  const bills = getAllQuickBills();
  return bills.some(
    (b) =>
      b.status === 'OPEN' &&
      b.id !== currentBillId &&
      b.token.trim().toLowerCase() === normalized
  );
}

// Get only active open orders (Screen B)
export function getActiveOpenOrders(): QuickBillRecord[] {
  return getAllQuickBills().filter((b) => b.status === 'OPEN');
}

// Get bill history (all PAID and CANCELLED bills)
export function getBillHistory(): QuickBillRecord[] {
  return getAllQuickBills()
    .filter((b) => b.status !== 'OPEN')
    .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
}

// Settle an open bill with final payment and print
export function settleOpenBill(
  billId: string,
  settlement: {
    paymentMethod: string;
    billType?: BillType;
    paidAmount?: number;
    discountPercent?: number;
    discountAmount?: number;
    roundOff?: number;
    customerName?: string;
    customerPhone?: string;
    customerPan?: string;
    notes?: string;
  }
): QuickBillRecord | null {
  const bills = getAllQuickBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return null;
  if (bill.status !== 'OPEN') {
    throw new Error('This bill has already been settled or cancelled.');
  }

  const finalBillType = settlement.billType || bill.billType;
  let vatInvoiceNum = bill.vatInvoiceNumber;
  if (finalBillType === 'VAT' && !vatInvoiceNum) {
    vatInvoiceNum = getNextVatInvoiceNumber();
  }

  const subtotal = bill.subtotal;
  const disAmt = settlement.discountAmount ?? bill.discountAmount;
  const disPct = settlement.discountPercent ?? bill.discountPercent;
  const taxable = Math.max(0, subtotal - disAmt);
  const vatAmount = finalBillType === 'VAT' ? Math.round(taxable * 0.13 * 100) / 100 : 0;
  const roundOff = settlement.roundOff ?? bill.roundOff;
  const grandTotal = Math.max(0, Math.round((taxable + vatAmount + roundOff) * 100) / 100);
  const paidAmount = settlement.paidAmount !== undefined ? settlement.paidAmount : grandTotal;
  const changeDue = Math.max(0, Math.round((paidAmount - grandTotal) * 100) / 100);

  const settledBill: QuickBillRecord = {
    ...bill,
    status: 'PAID',
    billType: finalBillType,
    vatInvoiceNumber: vatInvoiceNum,
    vatPercent: finalBillType === 'VAT' ? 13 : 0,
    vatAmount,
    taxableAmount: taxable,
    discountAmount: disAmt,
    discountPercent: disPct,
    roundOff,
    grandTotal,
    paidAmount,
    changeDue,
    paymentMethod: settlement.paymentMethod || bill.paymentMethod || 'CASH',
    customerName: settlement.customerName || bill.customerName,
    customerPhone: settlement.customerPhone || bill.customerPhone,
    customerPan: settlement.customerPan || bill.customerPan,
    notes: settlement.notes || bill.notes,
    paidAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  saveQuickBill(settledBill);
  return settledBill;
}

// Cancel a bill (with mandatory reason, never deletes number)
export function cancelBill(billId: string, cancelReason: string, staffUser = 'Cashier'): QuickBillRecord | null {
  const bills = getAllQuickBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return null;
  if (bill.status === 'CANCELLED') return bill;

  const cancelledBill: QuickBillRecord = {
    ...bill,
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
    cancelReason: cancelReason.trim() || 'Order cancelled by staff',
    lastUpdatedAt: new Date().toISOString(),
    staffUser,
  };

  saveQuickBill(cancelledBill);
  return cancelledBill;
}

// Calculate Day Closing Summary & Verification
export function calculateDayClosing(): DayClosingSummary {
  const bills = getAllQuickBills();
  const openOrders = bills.filter((b) => b.status === 'OPEN');
  const paidBills = bills.filter((b) => b.status === 'PAID');
  const cancelledBills = bills.filter((b) => b.status === 'CANCELLED');

  const totalSales = paidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalNormalSales = paidBills.filter((b) => b.billType === 'NORMAL').reduce((sum, b) => sum + b.grandTotal, 0);
  const totalVatSales = paidBills.filter((b) => b.billType === 'VAT').reduce((sum, b) => sum + b.grandTotal, 0);
  const totalVatAmount = paidBills.filter((b) => b.billType === 'VAT').reduce((sum, b) => sum + b.vatAmount, 0);

  // Sales by source
  const sources: BillSource[] = ['NO_TABLE', 'QUICK', 'RESTAURANT', 'HOTEL'];
  const salesBySource: Record<BillSource, { count: number; total: number }> = {
    NO_TABLE: { count: 0, total: 0 },
    QUICK: { count: 0, total: 0 },
    RESTAURANT: { count: 0, total: 0 },
    HOTEL: { count: 0, total: 0 },
  };

  paidBills.forEach((b) => {
    if (salesBySource[b.source]) {
      salesBySource[b.source].count += 1;
      salesBySource[b.source].total += b.grandTotal;
    }
  });

  // Number continuity check
  const sortedBills = [...bills].sort((a, b) => {
    const numA = parseInt(a.masterBillNumber.replace('BILL-', ''), 10) || 0;
    const numB = parseInt(b.masterBillNumber.replace('BILL-', ''), 10) || 0;
    return numA - numB;
  });

  const firstBillNumber = sortedBills[0]?.masterBillNumber || 'N/A';
  const lastBillNumber = sortedBills[sortedBills.length - 1]?.masterBillNumber || 'N/A';

  const missingBillNumbers: string[] = [];
  if (sortedBills.length > 1) {
    const firstNum = parseInt(sortedBills[0].masterBillNumber.replace('BILL-', ''), 10);
    const lastNum = parseInt(sortedBills[sortedBills.length - 1].masterBillNumber.replace('BILL-', ''), 10);
    if (!isNaN(firstNum) && !isNaN(lastNum)) {
      const presentSet = new Set(
        sortedBills.map((b) => parseInt(b.masterBillNumber.replace('BILL-', ''), 10))
      );
      for (let i = firstNum; i <= lastNum; i++) {
        if (!presentSet.has(i)) {
          missingBillNumbers.push(`BILL-${i}`);
        }
      }
    }
  }

  return {
    date: new Date().toLocaleDateString('en-GB'),
    totalSales,
    totalNormalSales,
    totalVatSales,
    totalVatAmount,
    normalBillsCount: paidBills.filter((b) => b.billType === 'NORMAL').length,
    vatBillsCount: paidBills.filter((b) => b.billType === 'VAT').length,
    cancelledBillsCount: cancelledBills.length,
    openBillsCount: openOrders.length,
    salesBySource,
    firstBillNumber,
    lastBillNumber,
    continuityIntact: missingBillNumbers.length === 0,
    missingBillNumbers,
    openOrdersRemaining: openOrders,
  };
}

// Calculate human-readable time elapsed
export function getTimeElapsed(dateString: string): { text: string; minutes: number; alertLevel: 'normal' | 'warn' | 'danger' } {
  try {
    const opened = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - opened);
    const minutes = Math.floor(diffMs / (1000 * 60));

    let text = `${minutes}m ago`;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rem = minutes % 60;
      text = `${hours}h ${rem}m ago`;
    }

    let alertLevel: 'normal' | 'warn' | 'danger' = 'normal';
    if (minutes >= 45) {
      alertLevel = 'danger'; // Over 45 minutes open -> high ageing alert
    } else if (minutes >= 20) {
      alertLevel = 'warn'; // 20-45 minutes
    }

    return { text, minutes, alertLevel };
  } catch {
    return { text: 'Just now', minutes: 0, alertLevel: 'normal' };
  }
}



// =======================================================================
// ALIAS & CONVENIENCE WRAPPERS
// =======================================================================
export const getOpenOrders = getActiveOpenOrders;
export const getPaidBills = getBillHistory;
export const getAllBills = getAllQuickBills;
export const isTokenInUse = isTokenInActiveOpenOrders;
export const cancelOpenOrder = cancelBill;
export const timeElapsed = (dateString: string) => getTimeElapsed(dateString).text;

export function saveOpenOrder(data: {
  token: string;
  source: BillSource;
  billType: BillType;
  customerName?: string;
  customerPhone?: string;
  customerPan?: string;
  items: BillItemRound[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  roundOff?: number;
  grandTotal: number;
  notes?: string;
  staffUser?: string;
}): QuickBillRecord {
  const masterBillNumber = getNextMasterBillNumber();
  const bill: QuickBillRecord = {
    id: 'bill-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    masterBillNumber,
    isOpenOrder: true,
    status: 'OPEN',
    token: data.token,
    source: data.source,
    billType: data.billType,
    items: data.items,
    currentRound: 1,
    subtotal: data.subtotal,
    discountPercent: data.discountPercent || 0,
    discountAmount: data.discountAmount || 0,
    taxableAmount: data.taxableAmount || data.subtotal,
    vatPercent: data.vatPercent || (data.billType === 'VAT' ? 13 : 0),
    vatAmount: data.vatAmount || 0,
    roundOff: data.roundOff || 0,
    grandTotal: data.grandTotal,
    paidAmount: 0,
    changeDue: 0,
    paymentMethod: 'UNPAID',
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerPan: data.customerPan,
    openedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    staffUser: data.staffUser || 'Counter Cashier',
    notes: data.notes,
  };
  saveQuickBill(bill);
  return bill;
}

export function addItemsToOpenOrder(
  billId: string,
  newItems: BillItemRound[],
  extra?: {
    discountPercent?: number;
    discountAmount?: number;
    roundOff?: number;
    notes?: string;
  }
): QuickBillRecord | null {
  const bills = getAllQuickBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) return null;

  const combinedItems = [...bill.items, ...newItems];
  const subtotal = combinedItems.reduce((s, it) => s + it.total, 0);
  const discountAmount = extra?.discountAmount ?? bill.discountAmount;
  const discountPercent = extra?.discountPercent ?? bill.discountPercent;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = bill.billType === 'VAT' ? Math.round(taxableAmount * 0.13 * 100) / 100 : 0;
  const roundOff = extra?.roundOff ?? bill.roundOff;
  const grandTotal = Math.max(0, Math.round((taxableAmount + vatAmount + roundOff) * 100) / 100);

  const updated: QuickBillRecord = {
    ...bill,
    items: combinedItems,
    currentRound: (bill.currentRound || 1) + 1,
    subtotal,
    discountAmount,
    discountPercent,
    taxableAmount,
    vatAmount,
    roundOff,
    grandTotal,
    notes: extra?.notes || bill.notes,
    lastUpdatedAt: new Date().toISOString(),
  };

  saveQuickBill(updated);
  return updated;
}

export function settleAndPrintBill(
  billId: string,
  settlement: {
    paymentMethod: string;
    paidAmount?: number;
    billType?: BillType;
  }
): QuickBillRecord | null {
  return settleOpenBill(billId, settlement);
}

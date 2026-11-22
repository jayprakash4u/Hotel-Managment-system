import { SupplierRecord } from './types';

export const INITIAL_DEFAULT_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-1',
    code: 'SUP-101',
    name: 'Himalayan Dairy & Fresh Farm',
    category: 'Grocery',
    contactPerson: 'Hari Krishna Sharma',
    contactName: 'Hari Krishna Sharma',
    phone: '9841112233',
    email: 'info@himalayandairy.com',
    address: 'Kalimati, Kathmandu',
    panVatNumber: '302918274',
    isActive: true,
    creditLimit: 100000,
    paymentTermsDays: 15,
    openingBalance: 0,
    purchasesCount: 14,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sup-2',
    code: 'SUP-102',
    name: 'Organic Greens & Veg Hub',
    category: 'Vegetables',
    contactPerson: 'Sunil Shrestha',
    contactName: 'Sunil Shrestha',
    phone: '9851020304',
    email: 'sales@organicgreens.np',
    address: 'Balkhu, Kathmandu',
    panVatNumber: '601827364',
    isActive: true,
    creditLimit: 50000,
    paymentTermsDays: 7,
    openingBalance: 0,
    purchasesCount: 22,
    createdAt: '2026-01-18T00:00:00Z',
  },
  {
    id: 'sup-3',
    code: 'SUP-103',
    name: 'Quality Housekeeping Linens',
    category: 'General',
    contactPerson: 'Bikash Adhikari',
    contactName: 'Bikash Adhikari',
    phone: '9801234567',
    email: 'orders@qualitylinens.com',
    address: 'New Road, Kathmandu',
    panVatNumber: '300991823',
    isActive: true,
    creditLimit: 200000,
    paymentTermsDays: 30,
    openingBalance: 0,
    purchasesCount: 8,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'sup-4',
    code: 'SUP-104',
    name: 'Eco Clean Chemical Supplies',
    category: 'General',
    contactPerson: 'Rajendra Thapa',
    contactName: 'Rajendra Thapa',
    phone: '9849887766',
    email: 'contact@ecoclean.com.np',
    address: 'Patan Industrial Estate, Lalitpur',
    panVatNumber: '602991024',
    isActive: true,
    creditLimit: 75000,
    paymentTermsDays: 15,
    openingBalance: 0,
    purchasesCount: 6,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'sup-5',
    code: 'SUP-105',
    name: 'Highland Beverages & Spirits',
    category: 'Beverage',
    contactPerson: 'Prakash Gurung',
    contactName: 'Prakash Gurung',
    phone: '9812349876',
    email: 'orders@highlandbeverages.np',
    address: 'Thamel, Kathmandu',
    panVatNumber: '301122334',
    isActive: true,
    creditLimit: 150000,
    paymentTermsDays: 30,
    openingBalance: 0,
    purchasesCount: 11,
    createdAt: '2026-02-20T00:00:00Z',
  },
];

const LOCAL_STORAGE_KEY = 'hotel_master_suppliers';
const EVENT_NAME = 'hotel_suppliers_updated';

// Helper to read localStorage safely
export function getLocalSuppliers(): SupplierRecord[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_SUPPLIERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_SUPPLIERS));
      return INITIAL_DEFAULT_SUPPLIERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEFAULT_SUPPLIERS;
  } catch {
    return INITIAL_DEFAULT_SUPPLIERS;
  }
}

// Helper to save to localStorage safely
export function setLocalSuppliers(suppliers: SupplierRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(suppliers));
    notifySuppliersUpdated();
  } catch {
    // ignore
  }
}

// Broadcast event when suppliers change
export function notifySuppliersUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

// Subscribe to supplier updates
export function subscribeToSuppliers(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

// Fetch active or all suppliers with API and local fallback
export async function fetchSuppliersList(activeOnly = false): Promise<SupplierRecord[]> {
  try {
    const query = activeOnly ? '?activeOnly=true' : '';
    const res = await fetch(`/api/suppliers${query}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Sync API data to localStorage
        setLocalSuppliers(json.data);
        return activeOnly ? json.data.filter((s: SupplierRecord) => s.isActive !== false) : json.data;
      } else if (Array.isArray(json) && json.length > 0) {
        setLocalSuppliers(json);
        return activeOnly ? json.filter((s: SupplierRecord) => s.isActive !== false) : json;
      }
    }
  } catch {
    // Fallback to localStorage
  }

  const local = getLocalSuppliers();
  return activeOnly ? local.filter((s) => s.isActive !== false) : local;
}

// Save or Update Supplier with API and local fallback
export async function persistSupplier(payload: Partial<SupplierRecord>): Promise<SupplierRecord> {
  const isEditing = Boolean(payload.id);
  let savedRecord: SupplierRecord | null = null;

  try {
    const url = isEditing ? `/api/suppliers/${payload.id}` : '/api/suppliers';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        savedRecord = json.data;
      }
    }
  } catch {
    // API failed, fallback to local storage
  }

  // Local fallback
  const current = getLocalSuppliers();
  if (isEditing) {
    const index = current.findIndex((s) => s.id === payload.id);
    if (index >= 0) {
      const updated: SupplierRecord = {
        ...current[index],
        ...payload,
        name: payload.name || current[index].name,
      } as SupplierRecord;
      current[index] = updated;
      savedRecord = updated;
    }
  } else {
    const newId = payload.id || `sup-${Date.now()}`;
    const code = payload.code || `SUP-${current.length + 101}`;
    const newSupplier: SupplierRecord = {
      id: newId,
      code,
      name: payload.name || 'New Supplier',
      category: payload.category || 'General',
      contactPerson: payload.contactPerson || '',
      phone: payload.phone || '',
      email: payload.email || '',
      address: payload.address || '',
      panVatNumber: payload.panVatNumber || '',
      isActive: payload.isActive !== false,
      creditLimit: payload.creditLimit || 0,
      paymentTermsDays: payload.paymentTermsDays || 0,
      openingBalance: payload.openingBalance || 0,
      purchasesCount: 0,
      createdAt: new Date().toISOString(),
    };
    current.unshift(newSupplier);
    savedRecord = newSupplier;
  }

  setLocalSuppliers(current);
  return savedRecord || (payload as SupplierRecord);
}

// Delete Supplier with API and local fallback
export async function removeSupplier(id: string): Promise<boolean> {
  try {
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  const current = getLocalSuppliers();
  const updated = current.filter((s) => s.id !== id);
  setLocalSuppliers(updated);
  return true;
}

// Toggle status with API and local fallback
export async function toggleSupplierActiveStatus(id: string): Promise<SupplierRecord | null> {
  try {
    await fetch(`/api/suppliers/${id}/toggle-status`, { method: 'PATCH' });
  } catch {
    // ignore
  }

  const current = getLocalSuppliers();
  const index = current.findIndex((s) => s.id === id);
  if (index >= 0) {
    current[index] = {
      ...current[index],
      isActive: current[index].isActive === false ? true : false,
    };
    setLocalSuppliers(current);
    return current[index];
  }
  return null;
}

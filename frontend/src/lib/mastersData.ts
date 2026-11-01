'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SimpleMasterItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
}

export const MASTERS_STORAGE_KEYS = {
  relationships: 'hotel_relationships_master',
  idDocumentTypes: 'hotel_id_document_types_master',
  nationalities: 'hotel_nationalities_master',
  purposeOfVisit: 'hotel_purpose_of_visit_master',
  bookingAgents: 'hotel_booking_agents_master',
  units: 'hotel_units_master',
} as const;

export type MasterType = keyof typeof MASTERS_STORAGE_KEYS;
export const MASTERS_UPDATED_EVENT = 'hotel_masters_updated';

// 1. Default Relationships
export const DEFAULT_RELATIONSHIPS: SimpleMasterItem[] = [
  { id: 'rel-1', code: 'SPO', name: 'Spouse', description: 'Husband, wife, or domestic partner', isDefault: true, isActive: true, order: 1 },
  { id: 'rel-2', code: 'CHD', name: 'Child', description: 'Son or daughter', isActive: true, order: 2 },
  { id: 'rel-3', code: 'PRN', name: 'Parent', description: 'Father or mother', isActive: true, order: 3 },
  { id: 'rel-4', code: 'SIB', name: 'Sibling', description: 'Brother or sister', isActive: true, order: 4 },
  { id: 'rel-5', code: 'FRN', name: 'Friend', description: 'Personal companion or acquaintance', isActive: true, order: 5 },
  { id: 'rel-6', code: 'COL', name: 'Colleague', description: 'Work colleague or business associate', isActive: true, order: 6 },
  { id: 'rel-7', code: 'REL', name: 'Relative', description: 'Extended family member or relative', isActive: true, order: 7 },
  { id: 'rel-8', code: 'BIZ', name: 'Business Partner', description: 'Commercial partner or co-traveler', isActive: true, order: 8 },
  { id: 'rel-9', code: 'OTH', name: 'Other', description: 'Other relationship', isActive: true, order: 9 },
];

// 2. Default ID Document Types
export const DEFAULT_ID_DOCUMENT_TYPES: SimpleMasterItem[] = [
  { id: 'idt-1', code: 'CIT', name: 'Citizenship Card', description: 'National citizenship identity document', isDefault: true, isActive: true, order: 1 },
  { id: 'idt-2', code: 'PAS', name: 'Passport', description: 'International travel passport', isActive: true, order: 2 },
  { id: 'idt-3', code: 'DL', name: 'Driving License', description: 'Motor vehicle driving license', isActive: true, order: 3 },
  { id: 'idt-4', code: 'NID', name: 'National ID Card', description: 'Government issued national identity card', isActive: true, order: 4 },
  { id: 'idt-5', code: 'VID', name: 'Voter ID Card', description: 'Election voter identification card', isActive: true, order: 5 },
  { id: 'idt-6', code: 'PAN', name: 'PAN Card', description: 'Permanent account number tax card', isActive: true, order: 6 },
  { id: 'idt-7', code: 'DIP', name: 'Diplomatic / Official ID', description: 'Diplomatic or official government identity document', isActive: true, order: 7 },
];

// 3. Default Nationalities
export const DEFAULT_NATIONALITIES: SimpleMasterItem[] = [
  { id: 'nat-1', code: 'NPL', name: 'Nepal', description: 'Federal Democratic Republic of Nepal', isDefault: true, isActive: true, order: 1 },
  { id: 'nat-2', code: 'IND', name: 'India', description: 'Republic of India', isActive: true, order: 2 },
  { id: 'nat-3', code: 'USA', name: 'United States', description: 'United States of America', isActive: true, order: 3 },
  { id: 'nat-4', code: 'GBR', name: 'United Kingdom', description: 'United Kingdom of Great Britain and N. Ireland', isActive: true, order: 4 },
  { id: 'nat-5', code: 'AUS', name: 'Australia', description: 'Commonwealth of Australia', isActive: true, order: 5 },
  { id: 'nat-6', code: 'CAN', name: 'Canada', description: 'Dominion of Canada', isActive: true, order: 6 },
  { id: 'nat-7', code: 'DEU', name: 'Germany', description: 'Federal Republic of Germany', isActive: true, order: 7 },
  { id: 'nat-8', code: 'FRA', name: 'France', description: 'French Republic', isActive: true, order: 8 },
  { id: 'nat-9', code: 'CHN', name: 'China', description: "People's Republic of China", isActive: true, order: 9 },
  { id: 'nat-10', code: 'JPN', name: 'Japan', description: 'State of Japan', isActive: true, order: 10 },
  { id: 'nat-11', code: 'SGP', name: 'Singapore', description: 'Republic of Singapore', isActive: true, order: 11 },
  { id: 'nat-12', code: 'ARE', name: 'United Arab Emirates', description: 'UAE', isActive: true, order: 12 },
  { id: 'nat-13', code: 'THA', name: 'Thailand', description: 'Kingdom of Thailand', isActive: true, order: 13 },
  { id: 'nat-14', code: 'BGD', name: 'Bangladesh', description: "People's Republic of Bangladesh", isActive: true, order: 14 },
  { id: 'nat-15', code: 'BTN', name: 'Bhutan', description: 'Kingdom of Bhutan', isActive: true, order: 15 },
  { id: 'nat-16', code: 'LKA', name: 'Sri Lanka', description: 'Democratic Socialist Republic of Sri Lanka', isActive: true, order: 16 },
  { id: 'nat-17', code: 'OTH', name: 'Other / International', description: 'Other foreign citizenship', isActive: true, order: 17 },
];

// 4. Default Purpose of Visit
export const DEFAULT_PURPOSE_OF_VISIT: SimpleMasterItem[] = [
  { id: 'pov-1', code: 'LEIS', name: 'Tourism / Leisure', description: 'Vacation, holiday, sightseeing and recreation', isDefault: true, isActive: true, order: 1 },
  { id: 'pov-2', code: 'CORP', name: 'Business / Corporate', description: 'Corporate meetings, client visits, or trade', isActive: true, order: 2 },
  { id: 'pov-3', code: 'TRAN', name: 'Transit / Airport Layover', description: 'En-route stopover or short airline layover', isActive: true, order: 3 },
  { id: 'pov-4', code: 'CONF', name: 'Conference / Seminar', description: 'Academic, professional or industry conventions', isActive: true, order: 4 },
  { id: 'pov-5', code: 'FAM', name: 'Family / Social Event', description: 'Wedding, reunion, family gathering', isActive: true, order: 5 },
  { id: 'pov-6', code: 'MED', name: 'Medical / Health', description: 'Hospital consultation, treatment, or wellness retreat', isActive: true, order: 6 },
  { id: 'pov-7', code: 'OFF', name: 'Official / Diplomatic', description: 'Government, diplomatic or consular delegation', isActive: true, order: 7 },
  { id: 'pov-8', code: 'PILG', name: 'Pilgrimage / Cultural', description: 'Temple, monastery, or heritage pilgrimage', isActive: true, order: 8 },
  { id: 'pov-9', code: 'OTH', name: 'Other', description: 'Other non-categorized visit purpose', isActive: true, order: 9 },
];

// 5. Default Booking Agents
export const DEFAULT_BOOKING_AGENTS: SimpleMasterItem[] = [
  { id: 'agt-1', code: 'AGT-001', name: 'Walk-In Direct', description: 'Direct guest walk-in without agent', isDefault: true, isActive: true, order: 1 },
  { id: 'agt-2', code: 'AGT-002', name: 'Himalayan Travels', description: 'Kathmandu based inbound tour operator', isActive: true, order: 2 },
  { id: 'agt-3', code: 'AGT-003', name: 'Everest Holidays', description: 'Trekking and expedition booking agent', isActive: true, order: 3 },
  { id: 'agt-4', code: 'AGT-004', name: 'Nepal Vista Tours', description: 'Cultural and heritage tour specialist', isActive: true, order: 4 },
  { id: 'agt-5', code: 'AGT-005', name: 'Booking.com OTA', description: 'Online travel agency channel', isActive: true, order: 5 },
  { id: 'agt-6', code: 'AGT-006', name: 'Agoda OTA', description: 'Global online hotel reservation portal', isActive: true, order: 6 },
  { id: 'agt-7', code: 'AGT-007', name: 'MakeMyTrip / Goibibo', description: 'Regional OTA partner', isActive: true, order: 7 },
  { id: 'agt-8', code: 'AGT-008', name: 'Expedia Group', description: 'International online distribution channel', isActive: true, order: 8 },
];

// 6. Default Restaurant & Bar Units / Quantities
export const DEFAULT_UNITS: SimpleMasterItem[] = [
  // Beverage Sizes
  { id: 'qty-gls', code: 'GLS', name: 'Glass', order: 1, isActive: true },
  { id: 'qty-can', code: 'CAN', name: 'Can', order: 2, isActive: true },
  { id: 'qty-pit', code: 'PIT', name: 'Pitcher', order: 3, isActive: true },
  { id: 'qty-b500', code: 'B500', name: '500ml Bottle', order: 4, isActive: true },
  { id: 'qty-b1l', code: 'B1L', name: '1L Bottle', order: 5, isActive: true },
  { id: 'qty-b750', code: 'B750', name: 'Bottle (750ml)', order: 6, isActive: true },
  { id: 'qty-cup', code: 'CUP', name: 'Cup / Mug', order: 7, isActive: true },
  { id: 'qty-sml', code: 'SML', name: 'Small', order: 8, isActive: true },
  { id: 'qty-med', code: 'MED', name: 'Medium', order: 9, isActive: true },
  { id: 'qty-lrg', code: 'LRG', name: 'Large', order: 10, isActive: true },

  // Food Sizes
  { id: 'qty-sngl', code: 'SNGL', name: 'Single', order: 11, isActive: true },
  { id: 'qty-plt', code: 'PLT', name: 'Plate', order: 12, isActive: true },
  { id: 'qty-full', code: 'FULL', name: 'Full', order: 13, isDefault: true, isActive: true },
  { id: 'qty-half', code: 'HALF', name: 'Half', order: 14, isActive: true },
  { id: 'qty-reg', code: 'REG', name: 'Regular', order: 15, isActive: true },
  { id: 'qty-qtr', code: 'QTR', name: 'Quarter', order: 16, isActive: true },
  { id: 'qty-bwl', code: 'BWL', name: 'Bowl', order: 17, isActive: true },
];

const DEFAULT_MAP: Record<MasterType, SimpleMasterItem[]> = {
  relationships: DEFAULT_RELATIONSHIPS,
  idDocumentTypes: DEFAULT_ID_DOCUMENT_TYPES,
  nationalities: DEFAULT_NATIONALITIES,
  purposeOfVisit: DEFAULT_PURPOSE_OF_VISIT,
  bookingAgents: DEFAULT_BOOKING_AGENTS,
  units: DEFAULT_UNITS,
};

export function getMasterItems(type: MasterType): SimpleMasterItem[] {
  if (typeof window === 'undefined') return DEFAULT_MAP[type];
  try {
    const raw = localStorage.getItem(MASTERS_STORAGE_KEYS[type]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error(`Failed to read master ${type}`, err);
  }
  return DEFAULT_MAP[type];
}

export function saveMasterItems(type: MasterType, items: SimpleMasterItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTERS_STORAGE_KEYS[type], JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT, { detail: { type, items } }));
    window.dispatchEvent(new Event('hotel_relationships_master_updated'));
  } catch (err) {
    console.error(`Failed to save master ${type}`, err);
  }
}

export function addMasterItem(type: MasterType, name: string, description?: string): SimpleMasterItem {
  const current = getMasterItems(type);
  const trimmed = name.trim();
  const existing = current.find((i) => i.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return existing;
  }
  const prefix = type.slice(0, 3).toUpperCase();
  const code = trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || `${prefix}${current.length + 1}`;
  const newItem: SimpleMasterItem = {
    id: `${type}-${Date.now()}`,
    code,
    name: trimmed,
    description: description?.trim() || undefined,
    order: current.length + 1,
    isActive: true,
  };
  const updated = [...current, newItem];
  saveMasterItems(type, updated);
  return newItem;
}

export function useMasterOptions(type: MasterType) {
  const [items, setItems] = useState<SimpleMasterItem[]>(() => getMasterItems(type));

  const refresh = useCallback(() => {
    setItems(getMasterItems(type));
  }, [type]);

  useEffect(() => {
    refresh();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === type) {
        refresh();
      }
    };

    window.addEventListener(MASTERS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', refresh);
    window.addEventListener('hotel_relationships_master_updated', refresh);

    return () => {
      window.removeEventListener(MASTERS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('hotel_relationships_master_updated', refresh);
    };
  }, [type, refresh]);

  const activeItems = items.filter((i) => i.isActive !== false);
  const names = activeItems.map((i) => i.name);
  const defaultItem = activeItems.find((i) => i.isDefault)?.name || activeItems[0]?.name || '';

  const addItem = useCallback(
    (name: string, description?: string) => {
      const created = addMasterItem(type, name, description);
      refresh();
      return created;
    },
    [type, refresh]
  );

  return {
    items,
    activeItems,
    names,
    defaultItem,
    addItem,
    refresh,
  };
}

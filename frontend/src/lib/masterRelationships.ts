'use client';

import { useState, useEffect } from 'react';

export interface MasterRelationshipItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
}

export const HOTEL_RELATIONSHIPS_STORAGE_KEY = 'hotel_relationships_master';
export const RELATIONSHIPS_UPDATED_EVENT = 'hotel_relationships_master_updated';

export const DEFAULT_RELATIONSHIPS: MasterRelationshipItem[] = [
  { id: 'rel-1', code: 'SPO', name: 'Spouse', description: 'Husband, wife, or domestic partner', isDefault: true, isActive: true, order: 1 },
  { id: 'rel-2', code: 'CHD', name: 'Child', description: 'Son or daughter', isActive: true, order: 2 },
  { id: 'rel-3', code: 'PRN', name: 'Parent', description: 'Father or mother', isActive: true, order: 3 },
  { id: 'rel-4', code: 'SIB', name: 'Sibling', description: 'Brother or sister', isActive: true, order: 4 },
  { id: 'rel-5', code: 'FRN', name: 'Friend', description: 'Personal friend or traveling companion', isActive: true, order: 5 },
  { id: 'rel-6', code: 'COL', name: 'Colleague', description: 'Work colleague or business associate', isActive: true, order: 6 },
  { id: 'rel-7', code: 'REL', name: 'Relative', description: 'Extended family relative', isActive: true, order: 7 },
  { id: 'rel-8', code: 'BIZ', name: 'Business Partner', description: 'Commercial partner or co-traveler', isActive: true, order: 8 },
  { id: 'rel-9', code: 'OTH', name: 'Other', description: 'Other relationship', isActive: true, order: 9 },
];

export function getStoredRelationships(): MasterRelationshipItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_RELATIONSHIPS;
  }
  try {
    const raw = localStorage.getItem(HOTEL_RELATIONSHIPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading relationships from localStorage', err);
  }
  return DEFAULT_RELATIONSHIPS;
}

export function saveStoredRelationships(items: MasterRelationshipItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOTEL_RELATIONSHIPS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(RELATIONSHIPS_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed saving relationships to localStorage', err);
  }
}

export function useMasterRelationships() {
  const [relationships, setRelationships] = useState<MasterRelationshipItem[]>(getStoredRelationships);

  useEffect(() => {
    setRelationships(getStoredRelationships());

    const handleUpdate = () => {
      setRelationships(getStoredRelationships());
    };

    window.addEventListener(RELATIONSHIPS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(RELATIONSHIPS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeRelationships = relationships.filter((r) => r.isActive !== false);

  const defaultRelationship =
    activeRelationships.find((r) => r.isDefault)?.name ||
    activeRelationships[0]?.name ||
    'Spouse';

  return {
    relationships,
    activeRelationships,
    defaultRelationship,
  };
}

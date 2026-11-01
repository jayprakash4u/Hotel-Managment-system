export type OperationalStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type CleaningStatus = 'CLEAN' | 'DIRTY' | 'IN_CLEANING';

export interface RoomRecord {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType: string;
  acType: 'AC' | 'Non-AC';
  pricePerNight: number;
  capacity: number;
  operationalStatus: OperationalStatus;
  cleaningStatus: CleaningStatus;
  maintenanceReason?: string;
}

export const DEFAULT_HOTEL_ROOMS: RoomRecord[] = [
  { id: 'rm-101', number: '101', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-102', number: '102', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-103', number: '103', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'DIRTY' },
  { id: 'rm-104', number: '104', floor: 1, type: 'Standard Twin Room', bedType: '2 Queen Beds', acType: 'Non-AC', pricePerNight: 2400, capacity: 4, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-105', number: '105', floor: 1, type: 'Deluxe Garden Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 3500, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'AC Servicing & Plumbing' },
  { id: 'rm-201', number: '201', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-202', number: '202', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-203', number: '203', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-204', number: '204', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-205', number: '205', floor: 2, type: 'Executive Ocean Suite', bedType: 'King Bed', acType: 'AC', pricePerNight: 4900, capacity: 3, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Painting & Touchup' },
  { id: 'rm-301', number: '301', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-302', number: '302', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'AVAILABLE', cleaningStatus: 'CLEAN' },
  { id: 'rm-303', number: '303', floor: 3, type: 'Royal Club Suite', bedType: 'Super King Bed', acType: 'AC', pricePerNight: 6200, capacity: 2, operationalStatus: 'MAINTENANCE', cleaningStatus: 'DIRTY', maintenanceReason: 'Electrical Inspection' },
  { id: 'rm-401', number: '401', floor: 4, type: 'Horizon Penthouse Suite', bedType: 'Emperor King Bed', acType: 'AC', pricePerNight: 9500, capacity: 4, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
  { id: 'rm-501', number: '501', floor: 5, type: 'Presidential Suite', bedType: 'Royal Emperor Bed', acType: 'AC', pricePerNight: 18500, capacity: 6, operationalStatus: 'OCCUPIED', cleaningStatus: 'CLEAN' },
];

export function loadHotelRoomsFromStorage(): RoomRecord[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('hotel_rooms_setup_v2') || localStorage.getItem('hotel_rooms_setup');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return DEFAULT_HOTEL_ROOMS;
}

export function saveHotelRoomsToStorage(rooms: RoomRecord[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('hotel_rooms_setup_v2', JSON.stringify(rooms));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

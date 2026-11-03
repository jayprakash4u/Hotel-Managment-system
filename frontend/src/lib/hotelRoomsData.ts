export type OperationalStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type CleaningStatus = 'CLEAN' | 'DIRTY' | 'IN_CLEANING';

export type PhotoCategory = 'COVER' | 'BEDROOM' | 'BATHROOM' | 'BALCONY' | 'VIEW' | 'OTHER';

export interface PhotoItem {
  id: string;
  url: string;
  caption?: string;
  category: PhotoCategory;
  isCover?: boolean;
}

export interface BedConfigItem {
  bedType: string;
  count: number;
}

export interface RoomPolicies {
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  childPolicy?: string;
  extraBedPolicy?: string;
  petPolicy?: string;
  customRules?: string;
}

export interface RoomRecord {
  id: string;
  number: string;
  floor: number;
  type: string;
  bedType: string;
  acType: string;
  pricePerNight: number;
  capacity: number;
  operationalStatus: OperationalStatus;
  cleaningStatus: CleaningStatus;
  maintenanceReason?: string;

  // Extended Detailed Room Attributes
  description?: string;
  roomSize?: string;
  roomView?: string;
  maxAdults?: number;
  maxChildren?: number;
  smokingPolicy?: 'Non-Smoking' | 'Smoking Permitted';
  accessibility?: string;
  bedConfiguration?: BedConfigItem[];
  bathroomFacilities?: string[];
  amenities?: string[];
  photos?: PhotoItem[];
  extraAdultPrice?: number;
  extraChildPrice?: number;
  weekendPrice?: number;
  policies?: RoomPolicies;
}

export const STANDARD_BED_TYPES = [
  'Single Bed',
  'Twin Beds',
  'Double Bed',
  'Queen Bed',
  'King Bed',
  'Super King Bed',
  'Sofa Bed',
  'Bunk Bed',
  'Custom Bed',
];

export const STANDARD_BATHROOM_FACILITIES = [
  'Private Bathroom',
  'Shared Bathroom',
  'Walk-in Shower',
  'Rain Shower',
  'Bathtub',
  'Western Toilet',
  'Bidet',
  'Hot and Cold Water',
  '24/7 Hot Water',
  'Hair Dryer',
  'Lighted Mirror',
  'Premium Toiletries',
  'Fresh Towels',
  'Bathrobes',
  'Slippers',
];

export const AMENITY_CATEGORIES = [
  {
    category: 'Bedroom',
    items: ['Wardrobe', 'Bedside Table', 'Reading Lamp', 'Sofa', 'Dressing Mirror', 'Extra Pillows', 'Blackout Curtains'],
  },
  {
    category: 'Electronics and Appliances',
    items: ['TV', 'Smart TV', 'Cable TV', 'Air Conditioning', 'Heating', 'Electric Kettle', 'Mini Fridge', 'Telephone', 'Electronic Safe', 'Hair Dryer', 'Iron & Board'],
  },
  {
    category: 'Internet and Workspace',
    items: ['Free High-Speed Wi-Fi', 'Study Table & Desk', 'Ergonomic Chair', 'Desk Lamp', 'Universal Power Outlets'],
  },
  {
    category: 'Food and Refreshments',
    items: ['Complimentary Drinking Water', 'Tea and Coffee Maker', 'Minibar', 'Refrigerator', 'In-room Dining Menu'],
  },
  {
    category: 'Other Facilities',
    items: ['Slippers', 'Daily Housekeeping', 'Laundry Service', 'Balcony / Terrace', 'Mountain View', 'City View', 'Soundproofing', 'Fire Extinguisher'],
  },
];

export const DEFAULT_HOTEL_ROOMS: RoomRecord[] = [
  {
    id: 'rm-101',
    number: '101',
    floor: 1,
    type: 'Deluxe Garden Suite',
    bedType: 'King Bed',
    acType: 'AC',
    pricePerNight: 3500,
    capacity: 2,
    operationalStatus: 'OCCUPIED',
    cleaningStatus: 'CLEAN',
    roomSize: '360 sq ft',
    roomView: 'Garden View',
    maxAdults: 2,
    maxChildren: 1,
    smokingPolicy: 'Non-Smoking',
    description: 'Serene ground-floor suite opening directly to resort botanical gardens with teak finishes.',
    bedConfiguration: [{ bedType: 'King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Rain Shower', 'Hot and Cold Water', 'Hair Dryer', 'Premium Toiletries', 'Fresh Towels'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Mini Fridge', 'Electric Kettle', 'Wardrobe'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&auto=format&fit=crop&q=80', caption: 'King Bedroom', category: 'COVER', isCover: true },
      { id: 'p-2', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&auto=format&fit=crop&q=80', caption: 'Rain Shower Bathroom', category: 'BATHROOM' },
      { id: 'p-3', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&auto=format&fit=crop&q=80', caption: 'Garden Balcony', category: 'BALCONY' },
    ],
    policies: {
      checkInTime: '02:00 PM',
      checkOutTime: '11:00 AM',
      cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in',
      childPolicy: 'Children under 6 stay free when using existing bedding',
      petPolicy: 'Pets not permitted',
    },
  },
  {
    id: 'rm-102',
    number: '102',
    floor: 1,
    type: 'Deluxe Garden Suite',
    bedType: 'King Bed',
    acType: 'AC',
    pricePerNight: 3500,
    capacity: 2,
    operationalStatus: 'AVAILABLE',
    cleaningStatus: 'CLEAN',
    roomSize: '360 sq ft',
    roomView: 'Garden View',
    maxAdults: 2,
    maxChildren: 1,
    smokingPolicy: 'Non-Smoking',
    description: 'Serene retreat surrounded by lush tropical landscaping and sunny patio.',
    bedConfiguration: [{ bedType: 'King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Rain Shower', 'Hot and Cold Water', 'Hair Dryer', 'Fresh Towels'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Mini Fridge'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&auto=format&fit=crop&q=80', caption: 'Suite Bedroom', category: 'COVER', isCover: true },
    ],
    policies: {
      checkInTime: '02:00 PM',
      checkOutTime: '11:00 AM',
      cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in',
    },
  },
  {
    id: 'rm-103',
    number: '103',
    floor: 1,
    type: 'Standard Twin Room',
    bedType: '2 Queen Beds',
    acType: 'Non-AC',
    pricePerNight: 2400,
    capacity: 4,
    operationalStatus: 'AVAILABLE',
    cleaningStatus: 'DIRTY',
    roomSize: '300 sq ft',
    roomView: 'Courtyard View',
    maxAdults: 3,
    maxChildren: 2,
    smokingPolicy: 'Non-Smoking',
    description: 'Spacious non-AC dual-queen layout ideal for families and small groups.',
    bedConfiguration: [{ bedType: 'Queen Bed', count: 2 }],
    bathroomFacilities: ['Private Bathroom', 'Western Toilet', 'Hot and Cold Water', 'Fresh Towels'],
    amenities: ['Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Electric Kettle', 'Wardrobe'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900&auto=format&fit=crop&q=80', caption: 'Twin Bedroom', category: 'COVER', isCover: true },
    ],
  },
  {
    id: 'rm-104',
    number: '104',
    floor: 1,
    type: 'Standard Twin Room',
    bedType: '2 Queen Beds',
    acType: 'Non-AC',
    pricePerNight: 2400,
    capacity: 4,
    operationalStatus: 'AVAILABLE',
    cleaningStatus: 'CLEAN',
    roomSize: '300 sq ft',
    roomView: 'Courtyard View',
    maxAdults: 3,
    maxChildren: 2,
    smokingPolicy: 'Non-Smoking',
    description: 'Comfortable non-AC garden-view room equipped with two plush queen beds.',
    bedConfiguration: [{ bedType: 'Queen Bed', count: 2 }],
    bathroomFacilities: ['Private Bathroom', 'Western Toilet', 'Hot and Cold Water', 'Fresh Towels'],
    amenities: ['Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Wardrobe'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&auto=format&fit=crop&q=80', caption: 'Comfort Bedroom', category: 'COVER', isCover: true },
    ],
  },
  {
    id: 'rm-105',
    number: '105',
    floor: 1,
    type: 'Deluxe Garden Suite',
    bedType: 'King Bed',
    acType: 'AC',
    pricePerNight: 3500,
    capacity: 2,
    operationalStatus: 'MAINTENANCE',
    cleaningStatus: 'DIRTY',
    maintenanceReason: 'AC Servicing & Plumbing',
    roomSize: '360 sq ft',
    bedConfiguration: [{ bedType: 'King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Rain Shower'],
    amenities: ['Air Conditioning', 'Free High-Speed Wi-Fi'],
  },
  {
    id: 'rm-201',
    number: '201',
    floor: 2,
    type: 'Executive Ocean Suite',
    bedType: 'Super King Bed',
    acType: 'AC',
    pricePerNight: 4900,
    capacity: 2,
    operationalStatus: 'OCCUPIED',
    cleaningStatus: 'CLEAN',
    roomSize: '450 sq ft',
    roomView: 'Panoramic Ocean View',
    maxAdults: 2,
    maxChildren: 1,
    smokingPolicy: 'Non-Smoking',
    description: 'Captivating ocean panorama from private glass balcony with jacuzzi bathtub.',
    bedConfiguration: [{ bedType: 'Super King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Bathtub', 'Rain Shower', 'Hot and Cold Water', 'Hair Dryer', 'Bathrobes', 'Slippers'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Minibar', 'Tea and Coffee Maker', 'Electronic Safe'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&auto=format&fit=crop&q=80', caption: 'Executive Suite', category: 'COVER', isCover: true },
      { id: 'p-2', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80', caption: 'Ocean Balcony', category: 'VIEW' },
    ],
    policies: {
      checkInTime: '02:00 PM',
      checkOutTime: '12:00 PM',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
    },
  },
  {
    id: 'rm-202',
    number: '202',
    floor: 2,
    type: 'Executive Ocean Suite',
    bedType: 'Super King Bed',
    acType: 'AC',
    pricePerNight: 4900,
    capacity: 2,
    operationalStatus: 'OCCUPIED',
    cleaningStatus: 'CLEAN',
    roomSize: '450 sq ft',
    roomView: 'Ocean View',
    bedConfiguration: [{ bedType: 'Super King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Bathtub', 'Rain Shower', 'Hot and Cold Water'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Minibar'],
  },
  {
    id: 'rm-203',
    number: '203',
    floor: 2,
    type: 'Executive Ocean Suite',
    bedType: 'Super King Bed',
    acType: 'AC',
    pricePerNight: 4900,
    capacity: 2,
    operationalStatus: 'AVAILABLE',
    cleaningStatus: 'CLEAN',
    roomSize: '450 sq ft',
    roomView: 'Ocean View',
    bedConfiguration: [{ bedType: 'Super King Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Bathtub', 'Rain Shower', 'Hot and Cold Water'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Minibar'],
  },
  {
    id: 'rm-301',
    number: '301',
    floor: 3,
    type: 'Royal Club Suite',
    bedType: 'Super King Bed',
    acType: 'AC',
    pricePerNight: 6200,
    capacity: 2,
    operationalStatus: 'OCCUPIED',
    cleaningStatus: 'CLEAN',
    roomSize: '550 sq ft',
    roomView: 'Mountain & Skyline View',
    maxAdults: 2,
    maxChildren: 1,
    smokingPolicy: 'Non-Smoking',
    description: 'Includes full VIP Executive Club access, evening mocktails and champagne service.',
    bedConfiguration: [{ bedType: 'Super King Bed', count: 1 }, { bedType: 'Sofa Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Walk-in Shower', 'Bathtub', 'Bidet', 'Hot and Cold Water', 'Hair Dryer', 'Bathrobes'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Minibar', 'Electronic Safe', 'Daily Housekeeping', 'Study Table & Desk'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80', caption: 'Royal Suite', category: 'COVER', isCover: true },
    ],
  },
  {
    id: 'rm-401',
    number: '401',
    floor: 4,
    type: 'Horizon Penthouse Suite',
    bedType: 'Emperor King Bed',
    acType: 'AC',
    pricePerNight: 9500,
    capacity: 4,
    operationalStatus: 'OCCUPIED',
    cleaningStatus: 'CLEAN',
    roomSize: '850 sq ft',
    roomView: '360 Horizon View',
    maxAdults: 4,
    maxChildren: 2,
    smokingPolicy: 'Non-Smoking',
    description: 'Sprawling high-elevation penthouse with 220-degree horizon views, dining area & butler pantry.',
    bedConfiguration: [{ bedType: 'Emperor King Bed', count: 1 }, { bedType: 'Queen Bed', count: 1 }],
    bathroomFacilities: ['Private Bathroom', 'Bathtub', 'Rain Shower', 'Bidet', '24/7 Hot Water', 'Bathrobes', 'Slippers'],
    amenities: ['Air Conditioning', 'Smart TV', 'Free High-Speed Wi-Fi', 'Complimentary Drinking Water', 'Minibar', 'Refrigerator', 'In-room Dining Menu', 'Electronic Safe'],
    photos: [
      { id: 'p-1', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=80', caption: 'Penthouse Living', category: 'COVER', isCover: true },
    ],
  },
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
      localStorage.setItem('hotel_rooms_setup', JSON.stringify(rooms));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

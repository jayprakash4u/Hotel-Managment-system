import React from 'react';
import {
  Globe,
  UserCheck,
  Users,
  MapPin,
  Compass,
  Flag,
  Sparkles,
  Clock,
  DollarSign,
  Scale,
  ShieldCheck,
  HeartHandshake,
  UtensilsCrossed,
  Layers,
  Armchair,
  Building2,
  BedDouble,
  DoorOpen,
  LayoutList,
  Snowflake,
  BedSingle,
  Package,
} from 'lucide-react';
import {
  DEFAULT_RELATIONSHIPS,
  DEFAULT_PURPOSE_OF_VISIT,
} from './mastersData';

export interface SubOptionBox {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface MasterCategory {
  id: string;
  code: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  subBoxes: SubOptionBox[];
}

export interface QuantityPriceTier {
  quantityId?: string;
  quantityName: string;
  price: number;
  isDefault?: boolean;
}

export interface MasterItemEntry {
  id: string;
  code: string;
  name: string;
  order?: number;
  description?: string;
  category?: string;
  basePrice?: number;
  quantityPrices?: QuantityPriceTier[];
  isDefault?: boolean;
  isActive?: boolean;
  trackStock?: boolean;
  stock?: number;
  unit?: string;
  roomNumber?: string;
  floorLevel?: string;
  roomType?: string;
  acType?: string;
  bedType?: string;
  capacity?: number;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';
  facilities?: string[];
  imageUrl?: string;
  roomSize?: string;
  roomView?: string;
  maxAdults?: number;
  maxChildren?: number;
  smokingPolicy?: string;
  accessibility?: string;
  bedConfiguration?: any[];
  bathroomFacilities?: string[];
  amenities?: string[];
  photos?: any[];
  extraAdultPrice?: number;
  extraChildPrice?: number;
  weekendPrice?: number;
  policies?: any;
  guestName?: string;
  guestPhone?: string;
  contact?: string;
  phone?: string;
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: 'general',
    code: '01',
    name: 'General Master',
    icon: Globe,
    subBoxes: [
      {
        id: 'salutations',
        name: 'Salutations',
        icon: UserCheck,
        description: 'Manage guest honorifics, prefixes, and titles used across profiles and reservations',
      },
      {
        id: 'gender',
        name: 'Gender',
        icon: Users,
        description: 'Manage gender identities, prefixes, and guest profile attributes',
      },
      {
        id: 'caste',
        name: 'Caste / Community',
        icon: Users,
        description: 'Manage guest demographic, caste, and cultural community categories',
      },
      {
        id: 'countries',
        name: 'Countries',
        icon: Globe,
        description: 'Manage countries, country dialing codes, ISO standards, and capital cities',
      },
      {
        id: 'states',
        name: 'States / Provinces',
        icon: MapPin,
        description: 'Manage states, federal provinces, and administrative territories',
      },
      {
        id: 'districts',
        name: 'Districts & Cities',
        icon: Compass,
        description: 'Manage local districts, municipal zones, and metropolitan cities',
      },
      {
        id: 'nationalities',
        name: 'Nationalities',
        icon: Flag,
        description: 'Manage recognized guest citizenship and nationality designations',
      },
      {
        id: 'languages',
        name: 'Languages',
        icon: Sparkles,
        description: 'Manage supported system interface and guest communication languages',
      },
      {
        id: 'timezones',
        name: 'Time Zones',
        icon: Clock,
        description: 'Manage hotel regional time zones, UTC offsets, and daylight configurations',
      },
      {
        id: 'currencies',
        name: 'Currencies',
        icon: DollarSign,
        description: 'Manage base and foreign transaction currencies, ISO codes, and symbols',
      },
      {
        id: 'units',
        name: 'Units of Measurement',
        icon: Scale,
        description: 'Manage inventory, procurement, and billing units of measurement',
      },
      {
        id: 'item-setup',
        name: 'Item & Product Setup',
        icon: Package,
        description: 'Configure hotel room amenities, guest supplies, inventory products, and goods',
      },
      {
        id: 'id-document-types',
        name: 'ID Document Types',
        icon: ShieldCheck,
        description: 'Manage valid ID document types for guest KYC verification',
      },
      {
        id: 'agent-setup',
        name: 'Agent Setup',
        icon: Users,
        description: 'Manage travel agents and booking agents for reservations',
      },
      {
        id: 'relationships',
        name: 'Relationships',
        icon: HeartHandshake,
        description: 'Manage guest relationship types for accompanying and additional guests',
      },
      {
        id: 'purpose-of-visit',
        name: 'Purpose of Visit',
        icon: Compass,
        description: 'Manage guest travel and visit purpose categories (Tourism, Corporate, Event, etc.)',
      },
    ],
  },
  {
    id: 'restaurant-setup',
    code: '02',
    name: 'Restaurant Setup',
    icon: UtensilsCrossed,
    subBoxes: [
      {
        id: 'categories-setup',
        name: 'Food Categories Setup',
        icon: Layers,
        description: 'Manage food & beverage categories like Appetizers, Main Course, Beverages, Desserts',
      },
      {
        id: 'menu-items-setup',
        name: 'Menu Setup',
        icon: UtensilsCrossed,
        description: 'Manage dishes, beverages, item codes, orders, portion rates, and menu products',
      },
      {
        id: 'table-setup',
        name: 'Table Setup',
        icon: Armchair,
        description: 'Configure restaurant dining tables, seating capacity, table numbers, and statuses',
      },
      {
        id: 'table-categories-setup',
        name: 'Table Categories Setup',
        icon: Building2,
        description: 'Configure restaurant table sections: Fine Dining, Rooftop Terrace, Poolside Bar, VIP Salon',
      },
      {
        id: 'quantity-setup',
        name: 'Unit Setup',
        icon: Scale,
        description: 'Manage portion quantities and serving sizes: Full, Half, Regular, Small, Large, Pieces',
      },
    ],
  },
  {
    id: 'room-setup',
    code: '03',
    name: 'Hotel & Room Setup',
    icon: BedDouble,
    subBoxes: [
      {
        id: 'add-room-setup',
        name: 'Add Room',
        icon: DoorOpen,
        description: 'Register and configure hotel rooms with quick setup or detailed setup',
      },
      {
        id: 'room-list-setup',
        name: 'Room List',
        icon: LayoutList,
        description: 'View, filter, manage, and inspect all configured hotel rooms and inventory',
      },
      {
        id: 'room-type-master',
        name: 'Room Types',
        icon: BedDouble,
        description: 'Configure hotel room categories, deluxe suites, standard rooms, and fares',
      },
      {
        id: 'ac-type-master',
        name: 'AC Types',
        icon: Snowflake,
        description: 'Configure air-conditioned (AC) and non-AC climate options',
      },
      {
        id: 'bed-type-master',
        name: 'Bed Types',
        icon: BedSingle,
        description: 'Configure bed configurations: Single, Double, Queen, King, and Twin beds',
      },
      {
        id: 'floor-master',
        name: 'Floor Levels',
        icon: Building2,
        description: 'Configure hotel floors and building levels: Ground, 1st, 2nd, 3rd floors',
      },
      {
        id: 'facility-category-master',
        name: 'Facility Categories',
        icon: Layers,
        description: 'Manage amenity classifications: Furniture, Bathroom, Electronics',
      },
      {
        id: 'facility-master',
        name: 'Room Facilities',
        icon: Armchair,
        description: 'Manage in-room items & amenities: Work Desk, Smart TV, Shower, Toilet',
      },
    ],
  },
  {
    id: 'employee-setup',
    code: '04',
    name: 'Employee & Staff Setup',
    icon: Users,
    subBoxes: [
      {
        id: 'employee-setup',
        name: 'Employee Directory',
        icon: UserCheck,
        description: 'Manage hotel & restaurant employee roster, contact details, shifts, and active staff profiles',
      },
      {
        id: 'staff-roles-setup',
        name: 'Staff Roles & Access',
        icon: ShieldCheck,
        description: 'Configure staff designations, role permissions, and operational duties',
      },
      {
        id: 'departments-setup',
        name: 'Departments',
        icon: Building2,
        description: 'Manage hotel departments: Food & Beverage, Front Office, Housekeeping, Accounts',
      },
    ],
  },
  {
    id: 'general-product-setup',
    code: '05',
    name: 'General Product Setup',
    icon: Package,
    subBoxes: [
      {
        id: 'product-categories-setup',
        name: 'Product Categories',
        icon: Layers,
        description: 'Manage product categories for general inventory and supplies',
      },
      {
        id: 'product-setup',
        name: 'Products',
        icon: UtensilsCrossed,
        description: 'Manage general products, SKUs, pricing, and stock details',
      },
      {
        id: 'product-units-setup',
        name: 'Units of Measurement',
        icon: Scale,
        description: 'Manage measurement units for products and inventory',
      },
      {
        id: 'suppliers-setup',
        name: 'Suppliers',
        icon: Users,
        description: 'Manage supplier directory, contact details, and credit terms',
      },
    ],
  },
];

export const HOTEL_CATEGORY: MasterCategory = MASTER_CATEGORIES.find((cat) => cat.id === 'room-setup')!;
export const RESTAURANT_CATEGORY: MasterCategory = MASTER_CATEGORIES.find((cat) => cat.id === 'restaurant-setup')!;

export const INITIAL_MASTER_ITEMS: Record<string, MasterItemEntry[]> = {
  relationships: DEFAULT_RELATIONSHIPS,
  'purpose-of-visit': DEFAULT_PURPOSE_OF_VISIT,
  salutations: [
    { id: 'sal-1', code: 'MR', name: 'Mr.', description: 'Standard adult male honorific', isDefault: true, isActive: true },
    { id: 'sal-2', code: 'MRS', name: 'Mrs.', description: 'Standard married female title', isActive: true },
    { id: 'sal-3', code: 'MS', name: 'Ms.', description: 'General female title regardless of marital status', isActive: true },
    { id: 'sal-4', code: 'MISS', name: 'Miss', description: 'Unmarried female title', isActive: true },
    { id: 'sal-5', code: 'DR', name: 'Dr.', description: 'Medical doctor or doctoral degree holder', isActive: true },
    { id: 'sal-6', code: 'PROF', name: 'Prof.', description: 'Professor / Senior academic faculty title', isActive: true },
    { id: 'sal-7', code: 'REV', name: 'Rev.', description: 'Reverend / Religious clergy title', isActive: true },
    { id: 'sal-8', code: 'HON', name: 'Hon.', description: 'The Honorable / Judicial, Parliamentary, or State title', isActive: true },
    { id: 'sal-9', code: 'SIR', name: 'Sir', description: 'Formal honorific / Knighthood title', isActive: true },
    { id: 'sal-10', code: 'MDM', name: 'Madam / Dame', description: 'Formal female honorific / Dame', isActive: true },
    { id: 'sal-11', code: 'LDY', name: 'Lady', description: 'Aristocratic / Peerage title', isActive: true },
    { id: 'sal-12', code: 'LRD', name: 'Lord', description: 'Aristocratic / Peerage title', isActive: true },
    { id: 'sal-13', code: 'CPT', name: 'Capt.', description: 'Captain / Commercial aviation or maritime', isActive: true },
    { id: 'sal-14', code: 'MAJ', name: 'Maj.', description: 'Major / Armed forces title', isActive: true },
    { id: 'sal-15', code: 'COL', name: 'Col.', description: 'Colonel / Armed forces title', isActive: true },
    { id: 'sal-16', code: 'ENG', name: 'Eng.', description: 'Engineer / Professional engineering title', isActive: true },
    { id: 'sal-17', code: 'ARC', name: 'Arch.', description: 'Architect / Professional title', isActive: true },
    { id: 'sal-18', code: 'ADV', name: 'Adv.', description: 'Advocate / Senior legal counsel title', isActive: true },
    { id: 'sal-19', code: 'MX', name: 'Mx.', description: 'Gender-neutral honorific title', isActive: true },
  ],
  gender: [
    { id: 'gen-1', code: 'M', name: 'Male', description: 'Cisgender male', isDefault: true, isActive: true },
    { id: 'gen-2', code: 'F', name: 'Female', description: 'Cisgender female', isActive: true },
    { id: 'gen-3', code: 'NB', name: 'Non-Binary', description: 'Non-binary gender identity', isActive: true },
    { id: 'gen-4', code: 'TM', name: 'Transgender Male', description: 'Transgender male identity', isActive: true },
    { id: 'gen-5', code: 'TF', name: 'Transgender Female', description: 'Transgender female identity', isActive: true },
    { id: 'gen-6', code: 'GQ', name: 'Genderqueer', description: 'Genderqueer / fluid identity', isActive: true },
    { id: 'gen-7', code: 'AG', name: 'Agender', description: 'Without gender identity', isActive: true },
    { id: 'gen-8', code: 'PNS', name: 'Prefer Not to Say', description: 'Undisclosed by guest', isActive: true },
    { id: 'gen-9', code: 'OTH', name: 'Other', description: 'Custom specified identity', isActive: true },
  ],
  caste: [
    { id: 'cst-1', code: 'GEN', name: 'General', description: 'General community classification', isDefault: true, isActive: true },
    { id: 'cst-2', code: 'BRA', name: 'Brahmin', description: 'Traditional demographic classification', isActive: true },
    { id: 'cst-3', code: 'KSH', name: 'Kshatriya / Chhetri', description: 'Traditional demographic classification', isActive: true },
    { id: 'cst-4', code: 'VAI', name: 'Vaishya', description: 'Traditional demographic classification', isActive: true },
    { id: 'cst-5', code: 'JAN', name: 'Janajati / Indigenous', description: 'Indigenous nationalities & ethnic groups', isActive: true },
    { id: 'cst-6', code: 'DAL', name: 'Dalit', description: 'Community demographic group', isActive: true },
    { id: 'cst-7', code: 'MAD', name: 'Madhesi', description: 'Tarai / Madhes community group', isActive: true },
    { id: 'cst-8', code: 'OTH', name: 'Other', description: 'Other community classification', isActive: true },
  ],
  countries: [
    { id: 'c-1', code: 'NPL', name: 'Nepal', description: '+977 · Capital: Kathmandu · Base Currency: NPR', isDefault: true, isActive: true },
    { id: 'c-2', code: 'IND', name: 'India', description: '+91 · Capital: New Delhi · INR', isActive: true },
    { id: 'c-3', code: 'CHN', name: 'China', description: '+86 · Capital: Beijing · CNY', isActive: true },
    { id: 'c-4', code: 'USA', name: 'United States', description: '+1 · Capital: Washington D.C. · USD', isActive: true },
    { id: 'c-5', code: 'GBR', name: 'United Kingdom', description: '+44 · Capital: London · GBP', isActive: true },
    { id: 'c-6', code: 'AUS', name: 'Australia', description: '+61 · Capital: Canberra · AUD', isActive: true },
    { id: 'c-7', code: 'DEU', name: 'Germany', description: '+49 · Capital: Berlin · EUR', isActive: true },
    { id: 'c-8', code: 'FRA', name: 'France', description: '+33 · Capital: Paris · EUR', isActive: true },
    { id: 'c-9', code: 'JPN', name: 'Japan', description: '+81 · Capital: Tokyo · JPY', isActive: true },
    { id: 'c-10', code: 'CAN', name: 'Canada', description: '+1 · Capital: Ottawa · CAD', isActive: true },
    { id: 'c-11', code: 'SGP', name: 'Singapore', description: '+65 · Capital: Singapore · SGD', isActive: true },
    { id: 'c-12', code: 'ARE', name: 'United Arab Emirates', description: '+971 · Capital: Abu Dhabi · AED', isActive: true },
    { id: 'c-13', code: 'THA', name: 'Thailand', description: '+66 · Capital: Bangkok · THB', isActive: true },
    { id: 'c-14', code: 'BGD', name: 'Bangladesh', description: '+880 · Capital: Dhaka · BDT', isActive: true },
    { id: 'c-15', code: 'BTN', name: 'Bhutan', description: '+975 · Capital: Thimphu · BTN', isActive: true },
    { id: 'c-16', code: 'LKA', name: 'Sri Lanka', description: '+94 · Capital: Colombo · LKR', isActive: true },
    { id: 'c-17', code: 'MDV', name: 'Maldives', description: '+960 · Capital: Malé · MVR', isActive: true },
    { id: 'c-18', code: 'KOR', name: 'South Korea', description: '+82 · Capital: Seoul · KRW', isActive: true },
    { id: 'c-19', code: 'CHE', name: 'Switzerland', description: '+41 · Capital: Bern · CHF', isActive: true },
    { id: 'c-20', code: 'NLD', name: 'Netherlands', description: '+31 · Capital: Amsterdam · EUR', isActive: true },
    { id: 'c-21', code: 'ITA', name: 'Italy', description: '+39 · Capital: Rome · EUR', isActive: true },
    { id: 'c-22', code: 'ESP', name: 'Spain', description: '+34 · Capital: Madrid · EUR', isActive: true },
    { id: 'c-23', code: 'MYS', name: 'Malaysia', description: '+60 · Capital: Kuala Lumpur · MYR', isActive: true },
    { id: 'c-24', code: 'IDN', name: 'Indonesia', description: '+62 · Capital: Jakarta · IDR', isActive: true },
  ],
  states: [
    { id: 'st-1', code: 'PR-03', name: 'Bagmati Province', description: 'Province 3 · Capital: Hetauda / Kathmandu', isDefault: true, isActive: true },
    { id: 'st-2', code: 'PR-04', name: 'Gandaki Province', description: 'Province 4 · Capital: Pokhara', isActive: true },
    { id: 'st-3', code: 'PR-01', name: 'Koshi Province', description: 'Province 1 · Capital: Biratnagar', isActive: true },
    { id: 'st-4', code: 'PR-05', name: 'Lumbini Province', description: 'Province 5 · Capital: Butwal / Deukhuri', isActive: true },
    { id: 'st-5', code: 'PR-02', name: 'Madhesh Province', description: 'Province 2 · Capital: Janakpur', isActive: true },
    { id: 'st-6', code: 'PR-06', name: 'Karnali Province', description: 'Province 6 · Capital: Birendranagar', isActive: true },
    { id: 'st-7', code: 'PR-07', name: 'Sudurpashchim Province', description: 'Province 7 · Capital: Dhangadhi / Godawari', isActive: true },
    { id: 'st-8', code: 'IN-MH', name: 'Maharashtra', description: 'Republic of India · Capital: Mumbai', isActive: true },
    { id: 'st-9', code: 'IN-DL', name: 'NCT of Delhi', description: 'Republic of India · Capital: New Delhi', isActive: true },
    { id: 'st-10', code: 'IN-KA', name: 'Karnataka', description: 'Republic of India · Capital: Bengaluru', isActive: true },
    { id: 'st-11', code: 'US-CA', name: 'California', description: 'United States · Capital: Sacramento', isActive: true },
    { id: 'st-12', code: 'US-NY', name: 'New York', description: 'United States · Capital: Albany', isActive: true },
    { id: 'st-13', code: 'US-TX', name: 'Texas', description: 'United States · Capital: Austin', isActive: true },
    { id: 'st-14', code: 'AU-NSW', name: 'New South Wales', description: 'Commonwealth of Australia · Capital: Sydney', isActive: true },
  ],
  districts: [
    { id: 'dst-1', code: 'KTM', name: 'Kathmandu', description: 'Bagmati Province · Capital Metropolitan City', isDefault: true, isActive: true },
    { id: 'dst-2', code: 'LTP', name: 'Lalitpur (Patan)', description: 'Bagmati Province · Arts & Heritage Sub-Metropolitan', isActive: true },
    { id: 'dst-3', code: 'BKT', name: 'Bhaktapur', description: 'Bagmati Province · Ancient Cultural City', isActive: true },
    { id: 'dst-4', code: 'PKR', name: 'Pokhara (Kaski)', description: 'Gandaki Province · Annapurna Tourism Capital', isActive: true },
    { id: 'dst-5', code: 'CTW', name: 'Bharatpur (Chitwan)', description: 'Bagmati Province · Wildlife & National Park Hub', isActive: true },
    { id: 'dst-6', code: 'BRT', name: 'Biratnagar (Morang)', description: 'Koshi Province · Industrial Metropolitan City', isActive: true },
    { id: 'dst-7', code: 'BRG', name: 'Birgunj (Parsa)', description: 'Madhesh Province · Trade & Commercial Gateway', isActive: true },
    { id: 'dst-8', code: 'JNK', name: 'Janakpurdham (Dhanusha)', description: 'Madhesh Province · Historical Religious Capital', isActive: true },
    { id: 'dst-9', code: 'BTW', name: 'Butwal (Rupandehi)', description: 'Lumbini Province · Commercial Transit Hub', isActive: true },
    { id: 'dst-10', code: 'DRN', name: 'Dharan (Sunsari)', description: 'Koshi Province · Eastern Foothills Sub-Metro', isActive: true },
    { id: 'dst-11', code: 'HTD', name: 'Hetauda (Makwanpur)', description: 'Bagmati Province · Provincial Administrative Capital', isActive: true },
    { id: 'dst-12', code: 'NPJ', name: 'Nepalgunj (Banke)', description: 'Lumbini Province · Western Commercial City', isActive: true },
    { id: 'dst-13', code: 'DNG', name: 'Dhangadhi (Kailali)', description: 'Sudurpashchim Province · Commercial Gateway', isActive: true },
    { id: 'dst-14', code: 'BOM', name: 'Mumbai Central', description: 'Maharashtra, India · Financial Capital', isActive: true },
    { id: 'dst-15', code: 'DEL', name: 'South Delhi', description: 'NCT of Delhi, India', isActive: true },
    { id: 'dst-16', code: 'NYC', name: 'Manhattan', description: 'New York City, USA', isActive: true },
    { id: 'dst-17', code: 'LON', name: 'City of Westminster', description: 'Greater London, United Kingdom', isActive: true },
    { id: 'dst-18', code: 'DXB', name: 'Downtown Dubai', description: 'Emirate of Dubai, UAE', isActive: true },
  ],
  nationalities: [
    { id: 'nat-1', code: 'NPL', name: 'Nepali', description: 'Citizen of Nepal', isDefault: true, isActive: true },
    { id: 'nat-2', code: 'IND', name: 'Indian', description: 'Citizen of Republic of India', isActive: true },
    { id: 'nat-3', code: 'USA', name: 'American', description: 'Citizen of United States of America', isActive: true },
    { id: 'nat-4', code: 'GBR', name: 'British', description: 'Citizen of United Kingdom', isActive: true },
    { id: 'nat-5', code: 'AUS', name: 'Australian', description: 'Citizen of Commonwealth of Australia', isActive: true },
    { id: 'nat-6', code: 'CHN', name: 'Chinese', description: "Citizen of People's Republic of China", isActive: true },
    { id: 'nat-7', code: 'DEU', name: 'German', description: 'Citizen of Federal Republic of Germany', isActive: true },
    { id: 'nat-8', code: 'FRA', name: 'French', description: 'Citizen of French Republic', isActive: true },
    { id: 'nat-9', code: 'JPN', name: 'Japanese', description: 'Citizen of Japan', isActive: true },
    { id: 'nat-10', code: 'CAN', name: 'Canadian', description: 'Citizen of Canada', isActive: true },
    { id: 'nat-11', code: 'SGP', name: 'Singaporean', description: 'Citizen of Republic of Singapore', isActive: true },
    { id: 'nat-12', code: 'ARE', name: 'Emirati', description: 'Citizen of United Arab Emirates', isActive: true },
    { id: 'nat-13', code: 'THA', name: 'Thai', description: 'Citizen of Kingdom of Thailand', isActive: true },
    { id: 'nat-14', code: 'BGD', name: 'Bangladeshi', description: "Citizen of People's Republic of Bangladesh", isActive: true },
    { id: 'nat-15', code: 'BTN', name: 'Bhutanese', description: 'Citizen of Kingdom of Bhutan', isActive: true },
    { id: 'nat-16', code: 'LKA', name: 'Sri Lankan', description: 'Citizen of Sri Lanka', isActive: true },
    { id: 'nat-17', code: 'CHE', name: 'Swiss', description: 'Citizen of Swiss Confederation', isActive: true },
    { id: 'nat-18', code: 'ITA', name: 'Italian', description: 'Citizen of Italian Republic', isActive: true },
    { id: 'nat-19', code: 'NLD', name: 'Dutch', description: 'Citizen of the Netherlands', isActive: true },
  ],
  languages: [
    { id: 'lng-1', code: 'EN', name: 'English', description: 'Global Lingua Franca · Primary system language', isDefault: true, isActive: true },
    { id: 'lng-2', code: 'NE', name: 'Nepali (नेपाली)', description: 'Devanagari script · Official language of Nepal', isActive: true },
    { id: 'lng-3', code: 'HI', name: 'Hindi (हिन्दी)', description: 'Devanagari script · National language of India', isActive: true },
    { id: 'lng-4', code: 'ZH', name: 'Chinese Mandarin (中文)', description: 'Simplified Chinese · East Asia commerce', isActive: true },
    { id: 'lng-5', code: 'ES', name: 'Spanish (Español)', description: 'Ibero-American standard', isActive: true },
    { id: 'lng-6', code: 'FR', name: 'French (Français)', description: 'International diplomacy standard', isActive: true },
    { id: 'lng-7', code: 'DE', name: 'German (Deutsch)', description: 'Central European standard', isActive: true },
    { id: 'lng-8', code: 'JA', name: 'Japanese (日本語)', description: 'Kanji, Hiragana & Katakana', isActive: true },
    { id: 'lng-9', code: 'AR', name: 'Arabic (العربية)', description: 'Modern Standard Arabic · RTL', isActive: true },
    { id: 'lng-10', code: 'RU', name: 'Russian (Русский)', description: 'Cyrillic script', isActive: true },
    { id: 'lng-11', code: 'KO', name: 'Korean (한국어)', description: 'Hangul script', isActive: true },
    { id: 'lng-12', code: 'PT', name: 'Portuguese (Português)', description: 'Latin American & Iberian', isActive: true },
    { id: 'lng-13', code: 'IT', name: 'Italian (Italiano)', description: 'Romance language', isActive: true },
    { id: 'lng-14', code: 'MAI', name: 'Maithili (मैथिली)', description: 'Mithila cultural region · Terai', isActive: true },
    { id: 'lng-15', code: 'BHO', name: 'Bhojpuri (भोजपुरी)', description: 'Bhojpur cultural region', isActive: true },
    { id: 'lng-16', code: 'NEW', name: 'Nepal Bhasa (नेपाल भाषा)', description: 'Newari · Indigenous Kathmandu Valley', isActive: true },
  ],
  timezones: [
    { id: 'tz-1', code: '+05:45', name: 'Asia/Kathmandu', description: 'Nepal Standard Time (NPT) · UTC+05:45', isDefault: true, isActive: true },
    { id: 'tz-2', code: '+05:30', name: 'Asia/Kolkata', description: 'Indian Standard Time (IST) · UTC+05:30', isActive: true },
    { id: 'tz-3', code: '+06:00', name: 'Asia/Dhaka', description: 'Bangladesh Standard Time (BST) · UTC+06:00', isActive: true },
    { id: 'tz-4', code: '+06:00', name: 'Asia/Thimphu', description: 'Bhutan Standard Time (BTT) · UTC+06:00', isActive: true },
    { id: 'tz-5', code: '+07:00', name: 'Asia/Bangkok', description: 'Indochina Time (ICT) · UTC+07:00', isActive: true },
    { id: 'tz-6', code: '+08:00', name: 'Asia/Singapore', description: 'Singapore Standard Time (SGT) · UTC+08:00', isActive: true },
    { id: 'tz-7', code: '+09:00', name: 'Asia/Tokyo', description: 'Japan Standard Time (JST) · UTC+09:00', isActive: true },
    { id: 'tz-8', code: '+04:00', name: 'Asia/Dubai', description: 'Gulf Standard Time (GST) · UTC+04:00', isActive: true },
    { id: 'tz-9', code: '+00:00', name: 'Europe/London', description: 'Greenwich Mean Time (GMT / BST)', isActive: true },
    { id: 'tz-10', code: '+01:00', name: 'Europe/Paris', description: 'Central European Time (CET / CEST)', isActive: true },
    { id: 'tz-11', code: '+01:00', name: 'Europe/Berlin', description: 'Central European Time (CET / CEST)', isActive: true },
    { id: 'tz-12', code: '-05:00', name: 'America/New_York', description: 'Eastern Standard Time (EST / EDT)', isActive: true },
    { id: 'tz-13', code: '-06:00', name: 'America/Chicago', description: 'Central Standard Time (CST / CDT)', isActive: true },
    { id: 'tz-14', code: '-08:00', name: 'America/Los_Angeles', description: 'Pacific Standard Time (PST / PDT)', isActive: true },
    { id: 'tz-15', code: '+10:00', name: 'Australia/Sydney', description: 'Australian Eastern Standard Time (AEST)', isActive: true },
    { id: 'tz-16', code: '+00:00', name: 'UTC', description: 'Coordinated Universal Time', isActive: true },
  ],
  currencies: [
    { id: 'cur-1', code: 'NPR', name: 'Nepalese Rupee (रू)', description: 'Currency Code: 524 · Symbol: Rs. / रू · Base Currency', isDefault: true, isActive: true },
    { id: 'cur-2', code: 'USD', name: 'US Dollar ($)', description: 'Currency Code: 840 · Symbol: $ · Global benchmark', isActive: true },
    { id: 'cur-3', code: 'INR', name: 'Indian Rupee (₹)', description: 'Currency Code: 356 · Peg: 1 INR = 1.60 NPR', isActive: true },
    { id: 'cur-4', code: 'EUR', name: 'Euro (€)', description: 'Currency Code: 978 · Symbol: € · European Union', isActive: true },
    { id: 'cur-5', code: 'GBP', name: 'British Pound (£)', description: 'Currency Code: 826 · Symbol: £ · UK Sterling', isActive: true },
    { id: 'cur-6', code: 'AUD', name: 'Australian Dollar (A$)', description: 'Currency Code: 036 · Symbol: A$', isActive: true },
    { id: 'cur-7', code: 'CAD', name: 'Canadian Dollar (C$)', description: 'Currency Code: 124 · Symbol: C$', isActive: true },
    { id: 'cur-8', code: 'JPY', name: 'Japanese Yen (¥)', description: 'Currency Code: 392 · Symbol: ¥', isActive: true },
    { id: 'cur-9', code: 'CNY', name: 'Chinese Yuan (¥)', description: 'Currency Code: 156 · Symbol: ¥ · Renminbi', isActive: true },
    { id: 'cur-10', code: 'AED', name: 'UAE Dirham (د.إ)', description: 'Currency Code: 784 · Symbol: AED / د.إ', isActive: true },
    { id: 'cur-11', code: 'SGD', name: 'Singapore Dollar (S$)', description: 'Currency Code: 702 · Symbol: S$', isActive: true },
    { id: 'cur-12', code: 'THB', name: 'Thai Baht (฿)', description: 'Currency Code: 764 · Symbol: ฿', isActive: true },
    { id: 'cur-13', code: 'CHF', name: 'Swiss Franc (CHF)', description: 'Currency Code: 756 · Symbol: CHF', isActive: true },
    { id: 'cur-14', code: 'QAR', name: 'Qatari Riyal (ر.ق)', description: 'Currency Code: 634 · Symbol: QR', isActive: true },
    { id: 'cur-15', code: 'MYR', name: 'Malaysian Ringgit (RM)', description: 'Currency Code: 458 · Symbol: RM', isActive: true },
  ],
  units: [
    { id: 'un-1', code: 'PCS', name: 'Piece (pc/pcs)', description: 'Discrete item count for rooms & retail', isDefault: true, isActive: true },
    { id: 'un-2', code: 'KG', name: 'Kilogram (kg)', description: 'Metric mass · 1000g · Kitchen bulk goods', isActive: true },
    { id: 'un-3', code: 'G', name: 'Gram (g)', description: 'Precision mass · Spices & pastry recipes', isActive: true },
    { id: 'un-4', code: 'L', name: 'Litre (L)', description: 'Liquid volume · Milk, cooking oil, beverages', isActive: true },
    { id: 'un-5', code: 'ML', name: 'Millilitre (mL)', description: 'Fluid volume · Mini-bar bottles & syrups', isActive: true },
    { id: 'un-6', code: 'BOX', name: 'Box (box)', description: 'Packaging unit · Amenities & tissue packs', isActive: true },
    { id: 'un-7', code: 'PKT', name: 'Packet (pkt)', description: 'Sealed pouch · Coffee, sugar, amenities', isActive: true },
    { id: 'un-8', code: 'BTL', name: 'Bottle (btl)', description: 'Beverage bottle · Wine, mineral water, spirits', isActive: true },
    { id: 'un-9', code: 'CAN', name: 'Can (can)', description: 'Canned soda, beer & pantry preserves', isActive: true },
    { id: 'un-10', code: 'DOZ', name: 'Dozen (doz)', description: '12-unit pack · Eggs, bakery, seasonal fruits', isActive: true },
    { id: 'un-11', code: 'CTN', name: 'Carton (ctn)', description: 'Master shipping carton for warehouse bulk', isActive: true },
    { id: 'un-12', code: 'ROL', name: 'Roll (roll)', description: 'Rolled items · Toilet rolls, foils, clingwrap', isActive: true },
    { id: 'un-13', code: 'SET', name: 'Set (set)', description: 'Grouped item · Linen set, cutlery set', isActive: true },
    { id: 'un-14', code: 'PR', name: 'Pair (pr)', description: 'Two matched units · Guest slippers, gloves', isActive: true },
    { id: 'un-15', code: 'NGT', name: 'Night (night)', description: 'Room billing unit per night of occupancy', isActive: true },
    { id: 'un-16', code: 'HR', name: 'Hour (hr)', description: 'Hourly rental · Meeting room, banquet hall', isActive: true },
  ],
  'id-document-types': [
    { id: 'idt-1', code: 'CIT', name: 'Citizenship Card', description: 'National citizenship identity document', isDefault: true, isActive: true },
    { id: 'idt-2', code: 'PAS', name: 'Passport', description: 'International travel passport', isActive: true },
    { id: 'idt-3', code: 'DL', name: 'Driving License', description: 'Motor vehicle driving license', isActive: true },
    { id: 'idt-4', code: 'NID', name: 'National ID Card', description: 'Government issued national identity card', isActive: true },
    { id: 'idt-5', code: 'VID', name: 'Voter ID Card', description: 'Election voter identification card', isActive: true },
    { id: 'idt-6', code: 'PAN', name: 'PAN Card', description: 'Permanent account number tax card', isActive: true },
    { id: 'idt-7', code: 'DIP', name: 'Diplomatic / Official ID', description: 'Diplomatic or official government identity document', isActive: true },
  ],
  'agent-setup': [
    { id: 'agt-1', code: 'AGT-001', name: 'Himalayan Travels', description: 'Kathmandu based inbound tour operator', contact: 'info@himalayantravels.com', phone: '+977 1-4444444', isDefault: true, isActive: true },
    { id: 'agt-2', code: 'AGT-002', name: 'Everest Holidays', description: 'Trekking and expedition booking agent', contact: 'bookings@everestholidays.com', phone: '+977 1-5555555', isActive: true },
    { id: 'agt-3', code: 'AGT-003', name: 'Nepal Vista Tours', description: 'Cultural and heritage tour specialist', contact: 'sales@nepalvista.com', phone: '+977 1-6666666', isActive: true },
    { id: 'agt-4', code: 'AGT-004', name: 'Walk-In Direct', description: 'Direct walk-in guest without agent', contact: '', phone: '', isActive: true },
  ],
  'categories-setup': [
    { id: 'cat-1', code: 'APP', name: 'Appetizers & Starters', order: 1, isDefault: true, isActive: true },
    { id: 'cat-2', code: 'SOUP', name: 'Soups & Salads', order: 2, isActive: true },
    { id: 'cat-3', code: 'MAIN', name: 'Main Course', order: 3, isActive: true },
    { id: 'cat-4', code: 'RICE', name: 'Rice & Biryani', order: 4, isActive: true },
    { id: 'cat-5', code: 'BREAD', name: 'Breads & Tandoori', order: 5, isActive: true },
    { id: 'cat-6', code: 'PIZZA', name: 'Pizzas & Pastas', order: 6, isActive: true },
    { id: 'cat-7', code: 'DES', name: 'Desserts & Sweets', order: 7, isActive: true },
    { id: 'cat-8', code: 'HOTB', name: 'Hot Beverages', order: 8, isActive: true },
    { id: 'cat-9', code: 'CLDB', name: 'Cold Beverages & Mocktails', order: 9, isActive: true },
    { id: 'cat-10', code: 'BAR', name: 'Cocktails & Spirits', order: 10, isActive: true },
  ],
  'menu-items-setup': [
    {
      id: 'mi-1',
      code: 'MOMO-C',
      name: 'Chicken Steam Momo',
      category: 'Appetizers & Starters',
      basePrice: 280,
      quantityPrices: [
        { quantityName: 'Plate (10 Pcs)', price: 280, isDefault: true },
        { quantityName: 'Half Portion', price: 160 },
      ],
      order: 1,
      isDefault: true,
      isActive: true,
    },
    {
      id: 'mi-2',
      code: 'MOMO-V',
      name: 'Veg Fried Momo',
      category: 'Appetizers & Starters',
      basePrice: 220,
      quantityPrices: [
        { quantityName: 'Plate (10 Pcs)', price: 220, isDefault: true },
        { quantityName: 'Half Portion', price: 130 },
      ],
      order: 2,
      isActive: true,
    },
    {
      id: 'mi-3',
      code: 'PBM-01',
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      basePrice: 420,
      quantityPrices: [
        { quantityName: 'Full Portion', price: 420, isDefault: true },
        { quantityName: 'Half Portion', price: 240 },
      ],
      order: 3,
      isActive: true,
    },
    {
      id: 'mi-4',
      code: 'CTM-01',
      name: 'Chicken Tikka Masala',
      category: 'Main Course',
      basePrice: 490,
      quantityPrices: [
        { quantityName: 'Full Portion', price: 490, isDefault: true },
        { quantityName: 'Half Portion', price: 280 },
      ],
      order: 4,
      isActive: true,
    },
    {
      id: 'mi-5',
      code: 'PIZ-MAR',
      name: 'Margherita Pizza 12"',
      category: 'Pizzas & Pastas',
      basePrice: 580,
      quantityPrices: [
        { quantityName: 'Regular / Standard', price: 380 },
        { quantityName: 'Large Portion', price: 580, isDefault: true },
      ],
      order: 5,
      isActive: true,
    },
    {
      id: 'mi-6',
      code: 'DAL-MKH',
      name: 'Dal Makhani Handi',
      category: 'Main Course',
      basePrice: 320,
      quantityPrices: [
        { quantityName: 'Full Portion', price: 320, isDefault: true },
        { quantityName: 'Half Portion', price: 190 },
      ],
      order: 6,
      isActive: true,
    },
    {
      id: 'mi-7',
      code: 'BRD-BTR',
      name: 'Butter Naan',
      category: 'Breads & Tandoori',
      basePrice: 70,
      quantityPrices: [
        { quantityName: 'Single Piece (1 Pc)', price: 70, isDefault: true },
        { quantityName: 'Plate (6 Pcs)', price: 380 },
      ],
      order: 7,
      isActive: true,
    },
    {
      id: 'mi-8',
      code: 'BRY-CHK',
      name: 'Hyderabadi Chicken Biryani',
      category: 'Rice & Biryani',
      basePrice: 480,
      quantityPrices: [
        { quantityName: 'Full Portion', price: 480, isDefault: true },
        { quantityName: 'Half Portion', price: 280 },
      ],
      order: 8,
      isActive: true,
    },
    {
      id: 'mi-9',
      code: 'DES-GJ',
      name: 'Gulab Jamun (2 Pcs)',
      category: 'Desserts & Sweets',
      basePrice: 150,
      quantityPrices: [
        { quantityName: 'Single Piece (1 Pc)', price: 80 },
        { quantityName: 'Regular / Standard', price: 150, isDefault: true },
      ],
      order: 9,
      isActive: true,
    },
    {
      id: 'mi-10',
      code: 'COF-CAP',
      name: 'Fresh Brewed Cappuccino',
      category: 'Hot Beverages',
      basePrice: 180,
      quantityPrices: [
        { quantityName: 'Cup / Mug', price: 180, isDefault: true },
        { quantityName: 'Large Portion', price: 240 },
      ],
      order: 10,
      isActive: true,
    },
    {
      id: 'mi-11',
      code: 'MOK-MOJ',
      name: 'Virgin Mint Mojito',
      category: 'Cold Beverages & Mocktails',
      basePrice: 220,
      quantityPrices: [
        { quantityName: 'Glass (250ml)', price: 220, isDefault: true },
        { quantityName: 'Platter / Family Pack', price: 650 },
      ],
      order: 11,
      isActive: true,
    },
  ],
  'quantity-setup': [
    { id: 'qty-1', code: 'FULL', name: 'Full Portion', order: 1, isDefault: true, isActive: true },
    { id: 'qty-2', code: 'HALF', name: 'Half Portion', order: 2, isActive: true },
    { id: 'qty-3', code: 'REG', name: 'Regular / Standard', order: 3, isActive: true },
    { id: 'qty-4', code: 'SML', name: 'Small Portion', order: 4, isActive: true },
    { id: 'qty-5', code: 'LRG', name: 'Large Portion', order: 5, isActive: true },
    { id: 'qty-6', code: '1PC', name: 'Single Piece (1 Pc)', order: 6, isActive: true },
    { id: 'qty-7', code: '6PCS', name: 'Plate (6 Pcs)', order: 7, isActive: true },
    { id: 'qty-8', code: '10PCS', name: 'Plate (10 Pcs)', order: 8, isActive: true },
    { id: 'qty-9', code: 'PLTR', name: 'Platter / Family Pack', order: 9, isActive: true },
    { id: 'qty-10', code: 'CUP', name: 'Cup / Mug', order: 10, isActive: true },
    { id: 'qty-11', code: 'GLS', name: 'Glass (250ml)', order: 11, isActive: true },
    { id: 'qty-12', code: 'BTL', name: 'Bottle (750ml)', order: 12, isActive: true },
  ],
  'room-type-master': [
    { id: 'rtm-1', code: 'STD', name: 'Standard Room', description: 'Standard hotel room with essential comforts and ensuite bathroom', basePrice: 200, order: 1, isDefault: true, isActive: true },
    { id: 'rtm-2', code: 'DLX', name: 'Deluxe Room', description: 'Deluxe room category with upgraded amenities, view, and seating lounge', basePrice: 350, order: 2, isActive: true },
    { id: 'rtm-3', code: 'SUT', name: 'Executive Suite', description: 'Spacious luxury suite with separate master living area and panoramic vista', basePrice: 550, order: 3, isActive: true },
  ],
  'ac-type-master': [
    { id: 'act-1', code: 'AC', name: 'Air Conditioned (AC)', description: 'Automated individual climate control cooling and heating unit', order: 1, isDefault: true, isActive: true },
    { id: 'act-2', code: 'NON-AC', name: 'Non-Air Conditioned (Non-AC)', description: 'Naturally ventilated guest room with high-efficiency ceiling fan', order: 2, isActive: true },
  ],
  'bed-type-master': [
    { id: 'btm-1', code: 'SGL', name: 'Single Bed', description: '38 in × 75 in (97 cm × 191 cm) · Compact solo traveler accommodation', order: 1, isActive: true },
    { id: 'btm-2', code: 'DBL', name: 'Double Bed', description: '54 in × 75 in (137 cm × 191 cm) · Full double occupancy standard', order: 2, isActive: true },
    { id: 'btm-3', code: 'QEN', name: 'Queen Bed', description: '60 in × 80 in (152 cm × 203 cm) · Superior guest comfort mattress', order: 3, isActive: true },
    { id: 'btm-4', code: 'KNG', name: 'King Bed', description: '76 in × 80 in (193 cm × 203 cm) · Premium luxury master king bed', order: 4, isDefault: true, isActive: true },
    { id: 'btm-5', code: 'TWN', name: 'Twin Beds', description: 'Two matched individual single beds for flexible twin sharing', order: 5, isActive: true },
  ],
  'floor-master': [
    { id: 'flm-1', code: 'GND', name: 'Ground Floor', description: 'Lobby level · Reception proximity & direct garden terrace access', order: 1, isDefault: true, isActive: true },
    { id: 'flm-2', code: '1ST', name: '1st Floor', description: 'First floor accommodation level · Elevator & stairway access', order: 2, isActive: true },
    { id: 'flm-3', code: '2ND', name: '2nd Floor', description: 'Second floor accommodation level with elevated garden views', order: 3, isActive: true },
    { id: 'flm-4', code: '3RD', name: '3rd Floor', description: 'Third floor accommodation level · Quiet executive suites wing', order: 4, isActive: true },
  ],
  'facility-category-master': [
    { id: 'fcm-1', code: 'FUR', name: 'Room Furniture', description: 'Study desks, wardrobes, bedside tables & vanity seating', order: 1, isDefault: true, isActive: true },
    { id: 'fcm-2', code: 'BTH', name: 'Bathroom & Sanitary', description: 'Sanitary fixtures, rainfall showers, commodes & bath amenities', order: 2, isActive: true },
    { id: 'fcm-3', code: 'ELE', name: 'Electronics & Appliances', description: 'Smart UHD televisions, digital safes, minibars & kettles', order: 3, isActive: true },
  ],
  'facility-master': [
    // Room Furniture
    { id: 'fm-1', code: 'TBL', name: 'Work Desk & Study Table', category: 'Room Furniture', description: 'Solid wood ergonomic study desk with executive chair', order: 1, isActive: true },
    { id: 'fm-2', code: 'WDR', name: 'Wardrobe & Luggage Rack', category: 'Room Furniture', description: 'Full-height wooden wardrobe with hangers and luggage stand', order: 2, isActive: true },
    { id: 'fm-3', code: 'VNT', name: 'Dressing Vanity Mirror', category: 'Room Furniture', description: 'Full-length illuminated vanity mirror with beauty shelf', order: 3, isActive: true },
    { id: 'fm-4', code: 'NST', name: 'Bedside Nightstand & Lamp', category: 'Room Furniture', description: 'Dual bedside tables with touch-controlled reading lamps', order: 4, isActive: true },
    { id: 'fm-5', code: 'CHR', name: 'Executive Chair', category: 'Room Furniture', description: 'Ergonomic cushioned high-back executive room chair', order: 5, isActive: true },

    // Bathroom & Sanitary
    { id: 'fm-6', code: 'WTL', name: 'Western Commode Toilet', category: 'Bathroom & Sanitary', description: 'Ceramic dual-flush hygienic western commode installation', order: 6, isDefault: true, isActive: true },
    { id: 'fm-7', code: 'SHW', name: 'Rainfall Shower Set', category: 'Bathroom & Sanitary', description: 'Thermostatic overhead rainfall and handheld shower wand', order: 7, isActive: true },
    { id: 'fm-8', code: 'HWT', name: '24h Hot & Cold Water Supply', category: 'Bathroom & Sanitary', description: 'Continuous pressurized instant hot and cold water system', order: 8, isActive: true },
    { id: 'fm-9', code: 'HDR', name: 'Hair Dryer & Shaving Socket', category: 'Bathroom & Sanitary', description: '1800W wall-mounted hair dryer with dual voltage socket', order: 9, isActive: true },
    { id: 'fm-10', code: 'AMN', name: 'Luxury Toiletries Kit', category: 'Bathroom & Sanitary', description: 'Organic shampoo, conditioner, dental kit, soap and towels', order: 10, isActive: true },

    // Electronics & Appliances
    { id: 'fm-11', code: 'TV', name: 'Smart LED TV 55"', category: 'Electronics & Appliances', description: '55" Ultra HD 4K smart television with streaming apps', order: 11, isActive: true },
    { id: 'fm-12', code: 'WFI', name: 'High-Speed WiFi Access', category: 'Electronics & Appliances', description: 'Dedicated in-room gigabit fiber Wi-Fi network coverage', order: 12, isActive: true },
    { id: 'fm-13', code: 'FRG', name: 'Mini Refrigerator', category: 'Electronics & Appliances', description: 'Silent absorption minibar chiller for beverages and snacks', order: 13, isActive: true },
    { id: 'fm-14', code: 'KTL', name: 'Electric Kettle & Tea Kit', category: 'Electronics & Appliances', description: 'Fast boil kettle with complimentary tea, coffee and mugs', order: 14, isActive: true },
    { id: 'fm-15', code: 'SFE', name: 'Digital Electronic Safe', category: 'Electronics & Appliances', description: 'Motorized digital keypad safe box for valuables and laptops', order: 15, isActive: true },
  ],
  'add-room-setup': [
    {
      id: 'rm-101',
      code: '101',
      roomNumber: '101',
      name: 'Room 101',
      floorLevel: '1st Floor',
      roomType: 'Deluxe Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 350,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Deluxe garden view king room with ensuite shower and study desk',
      order: 1,
      isActive: true,
    },
    {
      id: 'rm-102',
      code: '102',
      roomNumber: '102',
      name: 'Room 102',
      floorLevel: '1st Floor',
      roomType: 'Deluxe Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 350,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Deluxe garden view king room with executive furnishings',
      order: 2,
      isActive: true,
    },
    {
      id: 'rm-103',
      code: '103',
      roomNumber: '103',
      name: 'Room 103',
      floorLevel: '1st Floor',
      roomType: 'Standard Room',
      acType: 'Non-Air Conditioned (Non-AC)',
      bedType: 'Twin Beds',
      basePrice: 200,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Standard comfortable twin sharing bedroom',
      order: 3,
      isActive: true,
    },
    {
      id: 'rm-104',
      code: '104',
      roomNumber: '104',
      name: 'Room 104',
      floorLevel: '1st Floor',
      roomType: 'Standard Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'Double Bed',
      basePrice: 220,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet'],
      description: 'Standard double bed with climate control',
      order: 4,
      isActive: true,
    },
    {
      id: 'rm-105',
      code: '105',
      roomNumber: '105',
      name: 'Room 105',
      floorLevel: '1st Floor',
      roomType: 'Standard Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'Single Bed',
      basePrice: 180,
      capacity: 1,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Western Commode Toilet'],
      description: 'Compact solo traveler accommodation with smart TV',
      order: 5,
      isActive: true,
    },
    {
      id: 'rm-201',
      code: '201',
      roomNumber: '201',
      name: 'Room 201',
      floorLevel: '2nd Floor',
      roomType: 'Executive Suite',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 550,
      capacity: 3,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Second floor executive suite with living area and ocean view',
      order: 6,
      isActive: true,
    },
    {
      id: 'rm-202',
      code: '202',
      roomNumber: '202',
      name: 'Room 202',
      floorLevel: '2nd Floor',
      roomType: 'Deluxe Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'Queen Bed',
      basePrice: 350,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Second floor deluxe queen room with private balcony',
      order: 7,
      isActive: true,
    },
    {
      id: 'rm-203',
      code: '203',
      roomNumber: '203',
      name: 'Room 203',
      floorLevel: '2nd Floor',
      roomType: 'Executive Suite',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 550,
      capacity: 3,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Executive suite with master bedroom and lounge',
      order: 8,
      isActive: true,
    },
    {
      id: 'rm-301',
      code: '301',
      roomNumber: '301',
      name: 'Room 301',
      floorLevel: '3rd Floor',
      roomType: 'Executive Suite',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 550,
      capacity: 4,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Top floor executive suite with premium furnishings',
      order: 9,
      isActive: true,
    },
    {
      id: 'rm-302',
      code: '302',
      roomNumber: '302',
      name: 'Room 302',
      floorLevel: '3rd Floor',
      roomType: 'Deluxe Room',
      acType: 'Air Conditioned (AC)',
      bedType: 'King Bed',
      basePrice: 350,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Smart LED TV 55"', 'Rainfall Shower Set', 'Western Commode Toilet', 'Work Desk & Study Table'],
      description: 'Quiet third floor deluxe king accommodation',
      order: 10,
      isActive: true,
    },
    {
      id: 'rm-001',
      code: '001',
      roomNumber: '001',
      name: 'Room 001',
      floorLevel: 'Ground Floor',
      roomType: 'Standard Room',
      acType: 'Non-Air Conditioned (Non-AC)',
      bedType: 'Queen Bed',
      basePrice: 200,
      capacity: 2,
      status: 'AVAILABLE',
      facilities: ['Rainfall Shower Set', 'Western Commode Toilet'],
      description: 'Ground floor accessible room with direct garden path',
      order: 11,
      isActive: true,
    },
  ],
  'table-setup': [
    { id: 'tbl-1', code: 'T-101', name: 'Table T-101', category: 'Dining Hall', capacity: 4, status: 'AVAILABLE', description: 'Central family dining table', order: 1, isActive: true },
    { id: 'tbl-2', code: 'T-102', name: 'Table T-102', category: 'Dining Hall', capacity: 4, status: 'AVAILABLE', description: 'Dining hall booth seating', order: 2, isActive: true },
    { id: 'tbl-3', code: 'T-103', name: 'Table T-103', category: 'Dining Hall', capacity: 6, status: 'AVAILABLE', description: 'Spacious dining hall round table', order: 3, isActive: true },
    { id: 'tbl-4', code: 'C-01', name: 'Table C-01', category: 'Corridor Side', capacity: 2, status: 'AVAILABLE', description: 'Window view corridor table for two', order: 4, isActive: true },
    { id: 'tbl-5', code: 'C-02', name: 'Table C-02', category: 'Corridor Side', capacity: 2, status: 'AVAILABLE', description: 'Quiet corridor aisle table', order: 5, isActive: true },
    { id: 'tbl-6', code: 'C-03', name: 'Table C-03', category: 'Corridor Side', capacity: 4, status: 'AVAILABLE', description: 'Scenic glass corridor table', order: 6, isActive: true },
    { id: 'tbl-7', code: 'M-01', name: 'Table M-01', category: 'Main Area', capacity: 4, status: 'AVAILABLE', description: 'Prime center restaurant table', order: 7, isActive: true },
    { id: 'tbl-8', code: 'M-02', name: 'Table M-02', category: 'Main Area', capacity: 4, status: 'AVAILABLE', description: 'Main hall cozy corner table', order: 8, isActive: true },
    { id: 'tbl-9', code: 'ROOF-1', name: 'Table ROOF-1', category: 'Skyline Rooftop Terrace', capacity: 2, status: 'AVAILABLE', description: 'Panoramic mountain view terrace table', order: 9, isActive: true },
    { id: 'tbl-10', code: 'POOL-1', name: 'Table POOL-1', category: 'Poolside Lounge & Bar', capacity: 4, status: 'AVAILABLE', description: 'Sunbed poolside cabana table', order: 10, isActive: true },
  ],
  'table-categories-setup': [
    { id: 'sec-dhall', code: 'DHALL', name: 'Dining Hall', description: 'Spacious indoor main dining hall with family seating', order: 1, isDefault: true, isActive: true },
    { id: 'sec-corr', code: 'CORR', name: 'Corridor Side', description: 'Scenic window aisle and peaceful corridor dining', order: 2, isActive: true },
    { id: 'sec-main', code: 'MAIN', name: 'Main Area', description: 'Central restaurant hub and vibrant dining floor', order: 3, isActive: true },
    { id: 'sec-1', code: 'FINE', name: 'Indoor Fine Dining', description: 'Climate-controlled restaurant hall with acoustic ambience', order: 4, isActive: true },
    { id: 'sec-2', code: 'ROOF', name: 'Skyline Rooftop Terrace', description: 'Open-air terrace with mountain sunset and skyline view', order: 5, isActive: true },
    { id: 'sec-3', code: 'POOL', name: 'Poolside Lounge & Bar', description: 'Heated poolside deck with casual lounge seating and bar service', order: 6, isActive: true },
    { id: 'sec-4', code: 'VIP', name: 'Private Executive Dining', description: 'Soundproof luxury private salons for corporate and VIP banquets', order: 7, isActive: true },
    { id: 'sec-5', code: 'GARDEN', name: 'Garden Patio & Lawn', description: 'Lush green alfresco patio for daytime tea and garden dining', order: 8, isActive: true },
  ],
  'employee-setup': [
    { id: 'emp-1', code: 'EMP-001', name: 'Ramesh Thapa', category: 'Front Desk', contact: 'ramesh@hotel.com', phone: '+977 9801122334', description: 'Front Desk Shift Supervisor · Morning Shift', order: 1, isActive: true },
    { id: 'emp-2', code: 'EMP-002', name: 'Priya Sharma', category: 'Food & Beverage', contact: 'priya@hotel.com', phone: '+977 9802233445', description: 'Senior Restaurant Captain · Evening Shift', order: 2, isActive: true },
    { id: 'emp-3', code: 'EMP-003', name: 'Suman Shrestha', category: 'Kitchen (KDS)', contact: 'suman@hotel.com', phone: '+977 9803344556', description: 'Executive Head Chef', order: 3, isActive: true },
    { id: 'emp-4', code: 'EMP-004', name: 'Bikram Adhikari', category: 'Housekeeping', contact: 'bikram@hotel.com', phone: '+977 9804455667', description: 'Floor Housekeeping Lead', order: 4, isActive: true },
    { id: 'emp-5', code: 'EMP-005', name: 'Sunita Gurung', category: 'Accounts & POS', contact: 'sunita@hotel.com', phone: '+977 9805566778', description: 'Senior Cashier & Audit Lead', order: 5, isActive: true },
  ],
  'staff-roles-setup': [
    { id: 'role-1', code: 'ADMIN', name: 'Hotel Administrator', description: 'Full system access, configurations, master setups, and reports', order: 1, isDefault: true, isActive: true },
    { id: 'role-2', code: 'FRONT_DESK', name: 'Front Desk Receptionist', description: 'Room bookings, check-in, check-out, guest registration', order: 2, isActive: true },
    { id: 'role-3', code: 'CAPTAIN', name: 'Restaurant Captain / Waiter', description: 'Table order taking, KOT punching, bill settlements', order: 3, isActive: true },
    { id: 'role-4', code: 'CHEF', name: 'Executive Chef / Kitchen Staff', description: 'Kitchen Display System (KDS) order prep and recipe tracking', order: 4, isActive: true },
    { id: 'role-5', code: 'CASHIER', name: 'POS Cashier', description: 'Fast counter sales, quick bill receipts, cash collection', order: 5, isActive: true },
    { id: 'role-6', code: 'HOUSEKEEPING', name: 'Housekeeping Attendant', description: 'Room cleaning status updates, linen, and minibar inspection', order: 6, isActive: true },
  ],
  'departments-setup': [
    { id: 'dept-1', code: 'FNB', name: 'Food & Beverage (F&B)', description: 'Restaurant, kitchen, bar, banquets & room service operations', order: 1, isDefault: true, isActive: true },
    { id: 'dept-2', code: 'FO', name: 'Front Office & Concierge', description: 'Lobby operations, reservations, check-ins, guest relations', order: 2, isActive: true },
    { id: 'dept-3', code: 'HK', name: 'Housekeeping & Maintenance', description: 'Room sanitation, facility upkeep, laundry & linens', order: 3, isActive: true },
    { id: 'dept-4', code: 'ACC', name: 'Accounts, Finance & Stores', description: 'Inventory, procurement, night audit, settlements & ledgers', order: 4, isActive: true },
    { id: 'dept-5', code: 'MGT', name: 'Executive Management', description: 'General administration, HR, marketing & revenue strategy', order: 5, isActive: true },
  ],
  'item-setup': [],
  'product-setup': [],
};

export function getFallbackItemsForSubBox(subId: string, subName: string): MasterItemEntry[] {
  if (
    subId === 'item-setup' ||
    subId === 'product-setup' ||
    subId === 'product-categories-setup' ||
    subId === 'suppliers-setup'
  ) {
    return [];
  }
  return [
    { id: `${subId}-1`, code: '01', name: `Standard ${subName.replace(/s$/, '')}`, description: 'Default standard property tier', isDefault: true, isActive: true },
    { id: `${subId}-2`, code: '02', name: `Deluxe ${subName.replace(/s$/, '')}`, description: 'Upgraded premium tier specification', isActive: true },
    { id: `${subId}-3`, code: '03', name: `Executive ${subName.replace(/s$/, '')}`, description: 'Executive business tier classification', isActive: true },
    { id: `${subId}-4`, code: '04', name: `Suite ${subName.replace(/s$/, '')}`, description: 'Luxury suite classification setup', isActive: true },
    { id: `${subId}-5`, code: '05', name: `Presidential ${subName.replace(/s$/, '')}`, description: 'Top-tier VIP classification', isActive: true },
    { id: `${subId}-6`, code: '06', name: `Express ${subName.replace(/s$/, '')}`, description: 'Quick turnaround configuration', isActive: true },
    { id: `${subId}-7`, code: '07', name: `Custom ${subName.replace(/s$/, '')}`, description: 'Custom resort profile definition', isActive: true },
    { id: `${subId}-8`, code: '08', name: `Special ${subName.replace(/s$/, '')}`, description: 'Event or seasonal variation', isActive: true },
  ];
}

export function getSubBoxEntityName(box: { id: string; name: string }): string {
  if (box.id === 'item-setup' || box.id === 'product-setup') return 'Item / Product';
  if (box.id === 'product-categories-setup') return 'Product Category';
  if (box.id === 'suppliers-setup') return 'Supplier';
  if (box.id === 'add-room-setup' || box.id === 'room-list-setup') return 'Room';
  if (box.id === 'menu-items-setup') return 'Menu Item';
  if (box.id === 'categories-setup') return 'Food Category';
  if (box.id === 'quantity-setup') return 'Portion / Unit';
  if (box.id === 'table-setup') return 'Dining Table';
  if (box.id === 'table-categories-setup') return 'Table Category / Section';
  if (box.id === 'employee-setup') return 'Employee / Staff';
  if (box.id === 'staff-roles-setup') return 'Staff Role';
  if (box.id === 'departments-setup') return 'Department';
  if (box.id === 'room-type-master' || box.id === 'room-types-setup') return 'Room Type';
  if (box.id === 'ac-type-master') return 'AC Type';
  if (box.id === 'bed-type-master' || box.id === 'bed-types-setup') return 'Bed Type';
  if (box.id === 'floor-master' || box.id === 'floors-wings-setup') return 'Floor Level';
  if (box.id === 'facility-category-master') return 'Facility Category';
  if (box.id === 'facility-master') return 'Room Facility';
  if (box.id === 'room-amenities-setup') return 'Room Amenity';
  if (box.id === 'room-plans-setup') return 'Meal Plan';
  if (box.id === 'housekeeping-status-setup') return 'Room Status';
  if (box.id === 'id-document-types') return 'ID Document Type';
  if (box.id === 'agent-setup') return 'Agent';
  if (box.id === 'relationships') return 'Relationship';
  if (box.id === 'purpose-of-visit') return 'Purpose of Visit';
  let clean = box.name
    .replace(/\s+Master$/i, '')
    .replace(/\s+\(optional\)$/i, '')
    .replace(/\s+Setup$/i, '')
    .trim();
  if (clean.endsWith('ies')) clean = clean.slice(0, -3) + 'y';
  else if (clean.endsWith('es') && !clean.endsWith('ses')) clean = clean.slice(0, -2);
  else if (clean.endsWith('s') && !clean.endsWith('ss')) clean = clean.slice(0, -1);
  return clean;
}


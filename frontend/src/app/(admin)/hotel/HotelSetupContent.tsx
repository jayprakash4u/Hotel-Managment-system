'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Globe,
  UtensilsCrossed,
  Layers,
  DollarSign,
  Users,
  Sparkles,
  UserCheck,
  Clock,
  MapPin,
  Flag,
  Scale,
  Compass,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ArrowLeft,
  BedDouble,
  BedSingle,
  Building2,
  Coffee,
  Snowflake,
  Armchair,
  DoorOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  roomNumber?: string;
  floorLevel?: string;
  roomType?: string;
  acType?: string;
  bedType?: string;
  capacity?: number;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE';
  facilities?: string[];
  guestName?: string;
  guestPhone?: string;
}

const MASTER_CATEGORIES: MasterCategory[] = [
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
    ],
  },
  {
    id: 'menu-setup',
    code: '02',
    name: 'Menu Setup',
    icon: UtensilsCrossed,
    subBoxes: [
      {
        id: 'categories-setup',
        name: 'Categories Setup',
        icon: Layers,
        description: 'Manage food & beverage categories like Appetizers, Main Course, Beverages, Desserts',
      },
      {
        id: 'menu-items-setup',
        name: 'Menu Items Setup',
        icon: UtensilsCrossed,
        description: 'Manage dishes, beverages, item codes, orders, and menu items',
      },
      {
        id: 'quantity-setup',
        name: 'Quantity Setup',
        icon: Scale,
        description: 'Manage portion quantities and serving sizes: Full, Half, Regular, Small, Large, Pieces',
      },
    ],
  },
  {
    id: 'room-setup',
    code: '03',
    name: 'Room Setup',
    icon: BedDouble,
    subBoxes: [
      {
        id: 'add-room-setup',
        name: 'Add Room',
        icon: DoorOpen,
        description: 'Register and configure hotel rooms, room types, floor levels, AC types, bed types, fare, and facilities',
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
];

const INITIAL_MASTER_ITEMS: Record<string, MasterItemEntry[]> = {
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
};

function getFallbackItemsForSubBox(subId: string, subName: string): MasterItemEntry[] {
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

function getSubBoxEntityName(box: { id: string; name: string }): string {
  if (box.id === 'add-room-setup') return 'Room';
  if (box.id === 'menu-items-setup') return 'Menu Item';
  if (box.id === 'categories-setup') return 'Menu Category';
  if (box.id === 'quantity-setup') return 'Portion / Unit';
  if (box.id === 'room-type-master' || box.id === 'room-types-setup') return 'Room Type';
  if (box.id === 'ac-type-master') return 'AC Type';
  if (box.id === 'bed-type-master' || box.id === 'bed-types-setup') return 'Bed Type';
  if (box.id === 'floor-master' || box.id === 'floors-wings-setup') return 'Floor Level';
  if (box.id === 'facility-category-master') return 'Facility Category';
  if (box.id === 'facility-master') return 'Room Facility';
  if (box.id === 'room-amenities-setup') return 'Room Amenity';
  if (box.id === 'room-plans-setup') return 'Meal Plan';
  if (box.id === 'housekeeping-status-setup') return 'Room Status';
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

interface CategoryAutocompleteProps {
  value: string;
  onChange: (categoryName: string) => void;
  onAddNewCategory?: (categoryName: string) => void;
  availableCategories: MasterItemEntry[];
  placeholder?: string;
}

function CategoryAutocomplete({
  value,
  onChange,
  onAddNewCategory,
  availableCategories,
  placeholder = 'Search category...',
}: CategoryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) {
          setQuery(value);
        }
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [query, value]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableCategories;
    return availableCategories.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchCode = cat.code?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [availableCategories, query]);

  const hasNoExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return !availableCategories.some((c) => c.name.toLowerCase() === q);
  }, [availableCategories, query]);

  const selectCategory = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateAndSelect = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (onAddNewCategory) {
      onAddNewCategory(trimmed);
    } else {
      onChange(trimmed);
    }
    setQuery(trimmed);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required
          value={query}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex((prev) =>
                prev < filteredCategories.length - 1 ? prev + 1 : 0
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCategories.length - 1
              );
            } else if (e.key === 'Enter') {
              if (isOpen) {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
                  selectCategory(filteredCategories[highlightedIndex].name);
                } else if (filteredCategories.length > 0 && !hasNoExactMatch) {
                  selectCategory(filteredCategories[0].name);
                } else if (hasNoExactMatch) {
                  handleCreateAndSelect(query.trim());
                } else {
                  setIsOpen(false);
                }
              }
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
        />

        {/* Clear and Dropdown Toggle */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setQuery('');
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Clear category"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            title="Toggle category list"
          >
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                isOpen ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar animate-in fade-in-50 duration-100">
          {filteredCategories.length > 0 && (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {filteredCategories.map((cat, idx) => {
                const isSelected = cat.name.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : isHighlighted
                        ? 'bg-slate-50 text-[#24352F] dark:bg-[#0A2E26] dark:text-[#E5EEE9]'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {cat.code && (
                        <span className="font-mono text-[9px] font-bold uppercase rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] px-1.5 py-0.5 text-[#0B3D32] dark:text-emerald-300 border border-slate-200 dark:border-[#145447]">
                          {cat.code}
                        </span>
                      )}
                      <span className="truncate font-medium">{cat.name}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Add New Category option if query has no exact match */}
          {hasNoExactMatch && (
            <div className={filteredCategories.length > 0 ? 'border-t border-slate-100 dark:border-[#145447]' : ''}>
              <button
                type="button"
                onClick={() => handleCreateAndSelect(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  Create <strong className="font-semibold">&quot;{query.trim()}&quot;</strong>
                </span>
              </button>
            </div>
          )}

          {filteredCategories.length === 0 && !hasNoExactMatch && (
            <div className="px-3 py-2.5 text-center text-xs text-slate-400">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuantityAutocompleteProps {
  value: string;
  onChange: (quantityName: string) => void;
  availableQuantities: MasterItemEntry[];
  placeholder?: string;
  excludeNames?: string[];
}

function QuantityAutocomplete({
  value,
  onChange,
  availableQuantities,
  placeholder = 'Select or type unit...',
  excludeNames = [],
}: QuantityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query when value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter available quantities based on user input
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableQuantities;
    return availableQuantities.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      return matchName || matchCode;
    });
  }, [availableQuantities, query]);

  const selectItem = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <input
          type="text"
          required
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions.length > 0 && !suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase())) {
                selectItem(suggestions[0].name);
              } else {
                setIsOpen(false);
              }
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-3 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
        />

        {/* Clear or Dropdown Chevron icon */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setQuery('');
                onChange('');
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            title="Toggle suggestions"
          >
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                isOpen ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar animate-in fade-in-50 duration-100">
          {suggestions.length > 0 ? (
            <div className="py-1 divide-y divide-slate-100 dark:divide-[#0e3b31]">
              {suggestions.map((item) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase();
                const isUsedInOther = excludeNames.includes(item.name) && !isSelected;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-emerald-50 text-[#0B3D32] font-bold dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]',
                      isUsedInOther && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.code && (
                        <span className="font-mono text-[9px] font-bold uppercase rounded-[2px] bg-slate-100 dark:bg-[#0A2E26] px-1.5 py-0.5 text-[#0B3D32] dark:text-emerald-300 border border-slate-200 dark:border-[#145447]">
                          {item.code}
                        </span>
                      )}
                      <span className="truncate font-medium">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isUsedInOther && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          Already added
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-1">
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => selectItem(query.trim())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-[#0B3D32] dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-[#0A2E26] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Create <strong className="font-semibold">&quot;{query.trim()}&quot;</strong>
                  </span>
                </button>
              ) : (
                <div className="px-3 py-2.5 text-center text-xs text-slate-400">No matching units</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RoomFacilitiesCategoryPickerProps {
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
  availableFacilities: MasterItemEntry[];
  availableCategories: MasterItemEntry[];
  onAddNewFacility?: (facilityName: string, categoryName: string) => void;
}

function RoomFacilitiesCategoryPicker({
  selectedFacilities,
  onChange,
  availableFacilities,
  availableCategories,
  onAddNewFacility,
}: RoomFacilitiesCategoryPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [customCategory, setCustomCategory] = useState<string>(
    availableCategories[0]?.name || 'Room Furniture'
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter available facilities that aren't already selected
  const unselectedFacilities = useMemo(() => {
    return availableFacilities.filter((f) => !selectedFacilities.includes(f.name));
  }, [availableFacilities, selectedFacilities]);

  // Suggestions based on search query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unselectedFacilities;
    return unselectedFacilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.code && f.code.toLowerCase().includes(q))
    );
  }, [unselectedFacilities, query]);


  // Add a facility
  const handleAddFacility = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedFacilities.includes(trimmed)) return;
    onChange([...selectedFacilities, trimmed]);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Add custom facility not currently in master
  const handleAddCustom = (name: string, category: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (onAddNewFacility) {
      onAddNewFacility(trimmed, category);
    } else {
      handleAddFacility(trimmed);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Remove a facility
  const handleRemoveFacility = (name: string) => {
    onChange(selectedFacilities.filter((f) => f !== name));
  };

  // Clear all facilities in a specific category
  const handleClearCategory = (categoryName: string) => {
    const toRemove = new Set(
      availableFacilities
        .filter((f) => (f.category || 'General') === categoryName)
        .map((f) => f.name)
    );
    onChange(selectedFacilities.filter((f) => !toRemove.has(f)));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && suggestions[highlightedIndex]) {
        handleAddFacility(suggestions[highlightedIndex].name);
      } else if (query.trim()) {
        const exactMatch = availableFacilities.find(
          (f) => f.name.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactMatch) {
          handleAddFacility(exactMatch.name);
        } else {
          handleAddCustom(query.trim(), customCategory);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // AUTOMATICALLY GROUP SELECTED FACILITIES CATEGORY-WISE
  const selectedCategoryGroups = useMemo(() => {
    const catMap = new Map<string, string[]>();

    // Seed categories from availableCategories
    availableCategories.forEach((cat) => {
      if (cat.name) catMap.set(cat.name, []);
    });

    // Populate selected facilities into their categories
    selectedFacilities.forEach((facName) => {
      const matched = availableFacilities.find(
        (f) => f.name.toLowerCase() === facName.toLowerCase()
      );
      const cat = matched?.category?.trim() || 'Room Furniture';
      if (!catMap.has(cat)) {
        catMap.set(cat, []);
      }
      catMap.get(cat)!.push(facName);
    });

    const groups: { category: string; items: string[] }[] = [];
    catMap.forEach((items, category) => {
      if (items.length > 0) {
        groups.push({ category, items });
      }
    });

    return groups;
  }, [selectedFacilities, availableFacilities, availableCategories]);

  return (
    <div className="space-y-2 pt-1">
      {/* Header with counter and clear button */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Room Facilities {selectedFacilities.length > 0 && `(${selectedFacilities.length})`}
        </label>
        {selectedFacilities.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-400 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search Input with Autocomplete Dropdown */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search facility (e.g. Chair, TV, Shower)..."
            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-8 pr-8 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestion Popover Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-[3px] border border-[#DCE3DF] bg-white shadow-xl dark:border-[#145447] dark:bg-[#071F1A] custom-scrollbar">
            {suggestions.length > 0 ? (
              <div className="p-1 divide-y divide-[#F0F4F2] dark:divide-[#0E3B31]">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={item.id || item.name}
                      type="button"
                      onClick={() => handleAddFacility(item.name)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-[2px] transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-[#EEF4F1] text-[#0B3D32] font-semibold dark:bg-[#0A2E26] dark:text-emerald-300'
                          : 'text-[#24352F] hover:bg-[#FAFBF9] dark:text-[#E5EEE9] dark:hover:bg-[#0A2E26]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-medium">{item.name}</span>
                      </div>
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#F2F6F4] text-[#4A6458] border border-[#DCE3DF] dark:bg-[#082820] dark:text-emerald-300 dark:border-[#145447] shrink-0 ml-2">
                          {item.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Custom facility creation if query has text not in list */}
            {query.trim() && !availableFacilities.some((f) => f.name.toLowerCase() === query.trim().toLowerCase()) && (
              <div className="p-2 border-t border-[#F0F4F2] dark:border-[#0E3B31] bg-[#FAFBF9] dark:bg-[#061B16] flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#0B3D32] dark:text-emerald-300 truncate">
                  Add &ldquo;{query.trim()}&rdquo; to:
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="rounded-[2px] border border-[#DCE3DF] bg-white px-2 py-1 text-[11px] font-medium text-[#24352F] dark:border-[#145447] dark:bg-[#07241E] dark:text-white"
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddCustom(query.trim(), customCategory)}
                    className="px-2.5 py-1 rounded-[2px] bg-[#0B3D32] text-white text-xs font-bold hover:bg-[#093027] transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Added Facilities: AUTOMATICALLY ORGANIZED CATEGORY-WISE */}
      {selectedCategoryGroups.length > 0 && (
        <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
          {selectedCategoryGroups.map((group) => (
            <div
              key={group.category}
              className="p-2.5 rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-1.5"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#355245] dark:text-emerald-300">
                    {group.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ({group.items.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCategory(group.category)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                >
                  Clear {group.category}
                </button>
              </div>

              {/* Facility Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {group.items.map((fac) => (
                  <span
                    key={fac}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-white dark:bg-[#0A2E26] text-[#0B3D32] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447] shadow-2xs group animate-in fade-in duration-100"
                  >
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{fac}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(fac)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 rounded-[2px] p-0.5 transition-colors cursor-pointer"
                      title={`Remove ${fac}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotelSetupContent({
  initialCategory = 'general',
  initialSub = null,
}: {
  initialCategory?: string;
  initialSub?: string | null;
} = {}) {
  // Currently selected category (Default: 'general' or initialCategory)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategory);

  // Currently selected sub-box (Default: null or initialSub)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(initialSub);

  // Sync state if props change (e.g. navigating to Our Menu)
  useEffect(() => {
    if (initialCategory) setSelectedCategoryId(initialCategory);
    if (initialSub !== undefined) setSelectedSubId(initialSub);
  }, [initialCategory, initialSub]);

  // Search filter for options inside the secondary sub-sidebar (Level 2)
  const [searchOptionsQuery, setSearchOptionsQuery] = useState<string>('');

  // Table-level search and filter states
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  // Room-specific filter states for Level 2 Room Inventory
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  const [roomFloorFilter, setRoomFloorFilter] = useState<string>('all');

  // Editable master items map
  const [masterItemsMap, setMasterItemsMap] = useState<Record<string, MasterItemEntry[]>>(INITIAL_MASTER_ITEMS);

  // Room modal form state
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomFloor, setRoomFloor] = useState<string>('1st Floor');
  const [roomType, setRoomType] = useState<string>('Standard Room');
  const [roomACType, setRoomACType] = useState<string>('Air Conditioned (AC)');
  const [roomBedType, setRoomBedType] = useState<string>('King Bed');
  const [roomPrice, setRoomPrice] = useState<string>('200');
  const [roomCapacity, setRoomCapacity] = useState<string>('2');
  const [roomFacilities, setRoomFacilities] = useState<string[]>([]);
  const [roomNotes, setRoomNotes] = useState<string>('');

  // Hydrate custom rooms setup from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hotel_rooms_setup');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMasterItemsMap((prev) => ({
              ...prev,
              'add-room-setup': parsed,
            }));
          }
        }
      } catch (err) {}
    }
  }, []);

  // New item form state (Code, Display Name, Description, Category, Quantity Prices, Order)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newQuantityPrices, setNewQuantityPrices] = useState<
    Array<{ quantityName: string; price: string }>
  >([]);
  const [newOrder, setNewOrder] = useState<string>('');

  // Available categories for menu items setup
  const availableCategories = useMemo(() => {
    return masterItemsMap['categories-setup'] || INITIAL_MASTER_ITEMS['categories-setup'] || [];
  }, [masterItemsMap]);

  // Available categories for facility master
  const availableFacilityCategories = useMemo(() => {
    return (
      masterItemsMap['facility-category-master'] ||
      INITIAL_MASTER_ITEMS['facility-category-master'] ||
      []
    );
  }, [masterItemsMap]);

  // Available quantities for quantity-based pricing
  const availableQuantities = useMemo(() => {
    return masterItemsMap['quantity-setup'] || INITIAL_MASTER_ITEMS['quantity-setup'] || [];
  }, [masterItemsMap]);

  // Available room types from room-type-master
  const availableRoomTypes = useMemo(() => {
    return masterItemsMap['room-type-master'] || INITIAL_MASTER_ITEMS['room-type-master'] || [];
  }, [masterItemsMap]);

  // Available AC types from ac-type-master
  const availableACTypes = useMemo(() => {
    return masterItemsMap['ac-type-master'] || INITIAL_MASTER_ITEMS['ac-type-master'] || [];
  }, [masterItemsMap]);

  // Available bed types from bed-type-master
  const availableBedTypes = useMemo(() => {
    return masterItemsMap['bed-type-master'] || INITIAL_MASTER_ITEMS['bed-type-master'] || [];
  }, [masterItemsMap]);

  // Available floor levels from floor-master
  const availableFloors = useMemo(() => {
    return masterItemsMap['floor-master'] || INITIAL_MASTER_ITEMS['floor-master'] || [];
  }, [masterItemsMap]);

  // Available facilities from facility-master
  const availableFacilities = useMemo(() => {
    return masterItemsMap['facility-master'] || INITIAL_MASTER_ITEMS['facility-master'] || [];
  }, [masterItemsMap]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddForm) {
        setShowAddForm(false);
        setEditingItemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm]);

  // Active category
  const activeCategory =
    MASTER_CATEGORIES.find((cat) => cat.id === selectedCategoryId) || MASTER_CATEGORIES[0];

  // Clean title for current category
  const categoryHeaderTitle = useMemo(() => {
    return activeCategory.name;
  }, [activeCategory]);

  // Active sub-option box (when selectedSubId is non-null)
  const activeSubBox = useMemo(() => {
    if (!selectedSubId) return activeCategory.subBoxes[0];
    return activeCategory.subBoxes.find((b) => b.id === selectedSubId) || activeCategory.subBoxes[0];
  }, [activeCategory, selectedSubId]);

  // Handle clicking a top category box (1 to 12) -> switches category and opens its Level 1 box grid
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubId(null); // Sub-options will show as boxes below the straight line!
    setSearchOptionsQuery('');
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking a sub-option box below the straight line -> opens Level 2 (sidebar + table)
  const handleSelectSubBox = (subId: string) => {
    setSelectedSubId(subId);
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking the Back button on the secondary sidebar -> returns to Level 1 box grid
  const handleBackToBoxes = () => {
    setSelectedSubId(null);
    setSearchOptionsQuery('');
    setTableSearchQuery('');
    setTableCategoryFilter('all');
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Filtered sub-options inside the secondary sidebar (Level 2)
  const filteredSubBoxes = useMemo(() => {
    if (!searchOptionsQuery.trim()) return activeCategory.subBoxes;
    const q = searchOptionsQuery.toLowerCase().trim();
    return activeCategory.subBoxes.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [activeCategory, searchOptionsQuery]);

  // Current items for the active sub-box
  const currentItems = useMemo(() => {
    if (masterItemsMap[activeSubBox.id]) {
      return masterItemsMap[activeSubBox.id];
    }
    return getFallbackItemsForSubBox(activeSubBox.id, activeSubBox.name);
  }, [activeSubBox, masterItemsMap]);

  const isRoomSetup = activeSubBox.id === 'add-room-setup';
  const isMenuItem = activeSubBox.id === 'menu-items-setup';
  const isFacilityItem = activeSubBox.id === 'facility-master';
  const hasCategory = isMenuItem || isFacilityItem;

  const currentCategoryList = useMemo(() => {
    if (isFacilityItem) return availableFacilityCategories;
    return availableCategories;
  }, [isFacilityItem, availableFacilityCategories, availableCategories]);

  // Available unique categories for the table filter dropdown
  const tableCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    currentCategoryList.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    currentItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [currentCategoryList, currentItems]);

  // Filtered items in the table (search + category filter or room filters)
  const filteredItems = useMemo(() => {
    let items = currentItems;

    if (isRoomSetup) {
      if (roomTypeFilter !== 'all') {
        items = items.filter(
          (item) => (item.roomType || '').toLowerCase() === roomTypeFilter.toLowerCase()
        );
      }
      if (roomFloorFilter !== 'all') {
        items = items.filter(
          (item) => (item.floorLevel || '').toLowerCase() === roomFloorFilter.toLowerCase()
        );
      }
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase().trim();
        items = items.filter(
          (item) =>
            (item.roomNumber || item.code || '').toLowerCase().includes(q) ||
            (item.name || '').toLowerCase().includes(q) ||
            (item.roomType || '').toLowerCase().includes(q) ||
            (item.floorLevel || '').toLowerCase().includes(q) ||
            (item.bedType || '').toLowerCase().includes(q) ||
            (item.acType || '').toLowerCase().includes(q) ||
            (item.facilities || []).some((fac) => fac.toLowerCase().includes(q))
        );
      }
      return items;
    }

    if (hasCategory && tableCategoryFilter !== 'all') {
      items = items.filter(
        (item) => (item.category || '').toLowerCase() === tableCategoryFilter.toLowerCase()
      );
    }

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.quantityPrices &&
            item.quantityPrices.some((qp) => qp.quantityName.toLowerCase().includes(q)))
      );
    }

    return items;
  }, [currentItems, hasCategory, isRoomSetup, roomTypeFilter, roomFloorFilter, tableCategoryFilter, tableSearchQuery]);

  // Open modal to add a new item
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    if (isRoomSetup) {
      setRoomNumber('');
      setRoomFloor(availableFloors[0]?.name || '1st Floor');
      const defaultType = availableRoomTypes[0]?.name || 'Standard Room';
      setRoomType(defaultType);
      const matchedType = availableRoomTypes.find((t) => t.name === defaultType);
      setRoomPrice(matchedType?.basePrice?.toString() || '200');
      setRoomACType(availableACTypes[0]?.name || 'Air Conditioned (AC)');
      setRoomBedType(availableBedTypes[0]?.name || 'King Bed');
      setRoomCapacity('2');
      const defaultFacs = availableFacilities.filter((f) => f.isDefault).map((f) => f.name);
      setRoomFacilities(defaultFacs.length > 0 ? defaultFacs : ['Western Commode Toilet']);
      setRoomNotes('');
      setNewOrder(((masterItemsMap['add-room-setup'] || currentItems).length + 1).toString());
      setShowAddForm(true);
      return;
    }

    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewCategory(
      activeSubBox.id === 'facility-master'
        ? availableFacilityCategories[0]?.name || 'Room Furniture'
        : availableCategories[0]?.name || ''
    );
    setNewQuantityPrices(
      availableQuantities.length > 0
        ? [{ quantityName: availableQuantities[0].name, price: '' }]
        : [{ quantityName: 'Regular / Standard', price: '' }]
    );
    setNewOrder(((masterItemsMap[activeSubBox.id] || currentItems).length + 1).toString());
    setShowAddForm(true);
  };

  // Open modal to edit an existing item
  const handleOpenEditModal = (item: MasterItemEntry) => {
    setEditingItemId(item.id);
    if (isRoomSetup) {
      setRoomNumber(item.roomNumber || item.code || '');
      setRoomFloor(item.floorLevel || availableFloors[0]?.name || '1st Floor');
      setRoomType(item.roomType || availableRoomTypes[0]?.name || 'Standard Room');
      setRoomACType(item.acType || availableACTypes[0]?.name || 'Air Conditioned (AC)');
      setRoomBedType(item.bedType || availableBedTypes[0]?.name || 'King Bed');
      setRoomPrice((item.basePrice ?? 200).toString());
      setRoomCapacity((item.capacity ?? 2).toString());
      setRoomFacilities(item.facilities || []);
      setRoomNotes(item.description || '');
      setNewOrder((item.order || 1).toString());
      setShowAddForm(true);
      return;
    }

    setNewCode(item.code);
    setNewName(item.name);
    setNewDescription(item.description || '');
    setNewCategory(item.category || '');
    if (item.quantityPrices && item.quantityPrices.length > 0) {
      setNewQuantityPrices(
        item.quantityPrices.map((qp) => ({
          quantityName: qp.quantityName,
          price: qp.price.toString(),
        }))
      );
    } else if (item.basePrice !== undefined) {
      setNewQuantityPrices([
        {
          quantityName: availableQuantities[0]?.name || 'Regular / Standard',
          price: item.basePrice.toString(),
        },
      ]);
    } else {
      setNewQuantityPrices([
        {
          quantityName: availableQuantities[0]?.name || 'Regular / Standard',
          price: '',
        },
      ]);
    }
    setNewOrder((item.order || 1).toString());
    setShowAddForm(true);
  };

  // Add new category directly from the category autocomplete search
  const handleAddNewCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;

    if (activeSubBox.id === 'facility-master') {
      const existing = availableFacilityCategories.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        setNewCategory(existing.name);
        return;
      }

      const code =
        trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
        `FAC${availableFacilityCategories.length + 1}`;

      const newCatEntry: MasterItemEntry = {
        id: `fcm-${Date.now()}`,
        code,
        name: trimmed,
        order: availableFacilityCategories.length + 1,
        isActive: true,
      };

      setMasterItemsMap((prev) => ({
        ...prev,
        'facility-category-master': [
          ...(prev['facility-category-master'] || availableFacilityCategories),
          newCatEntry,
        ],
      }));
      setNewCategory(trimmed);
      return;
    }

    // Default menu category
    const existing = availableCategories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setNewCategory(existing.name);
      return;
    }

    const code =
      trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      `CAT${availableCategories.length + 1}`;

    const newCatEntry: MasterItemEntry = {
      id: `cat-${Date.now()}`,
      code,
      name: trimmed,
      order: availableCategories.length + 1,
      isActive: true,
    };

    setMasterItemsMap((prev) => ({
      ...prev,
      'categories-setup': [...(prev['categories-setup'] || availableCategories), newCatEntry],
    }));
    setNewCategory(trimmed);
  };

  // Add new facility with category (called directly from Add Room modal inline picker)
  const handleAddNewFacilityWithCategory = (facilityName: string, categoryName: string) => {
    const trimmed = facilityName.trim();
    if (!trimmed) return;

    // Check if facility already exists
    const existing = availableFacilities.find(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (!roomFacilities.includes(existing.name)) {
        setRoomFacilities((prev) => [...prev, existing.name]);
      }
      return;
    }

    const code =
      trimmed.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') ||
      `FAC${availableFacilities.length + 1}`;

    const newFacEntry: MasterItemEntry = {
      id: `fm-${Date.now()}`,
      code,
      name: trimmed,
      category: categoryName || 'Room Furniture',
      order: availableFacilities.length + 1,
      isActive: true,
    };

    setMasterItemsMap((prev) => ({
      ...prev,
      'facility-master': [
        ...(prev['facility-master'] || availableFacilities),
        newFacEntry,
      ],
    }));

    // Auto-select for the current room
    setRoomFacilities((prev) => [...prev, trimmed]);
  };

  // Save new item or update existing item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRoomSetup) {
      if (!roomNumber.trim()) return;

      const parsedPrice = parseFloat(roomPrice) || 0;
      const parsedCap = parseInt(roomCapacity, 10) || 2;
      const parsedOrder = parseInt(newOrder, 10);
      const currentList = masterItemsMap['add-room-setup'] || currentItems;
      const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : currentList.length + 1;

      let updatedRooms: MasterItemEntry[];
      if (editingItemId) {
        updatedRooms = currentList.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                code: roomNumber.trim(),
                roomNumber: roomNumber.trim(),
                name: `Room ${roomNumber.trim()} (${roomType})`,
                floorLevel: roomFloor,
                roomType,
                acType: roomACType,
                bedType: roomBedType,
                basePrice: parsedPrice,
                capacity: parsedCap,
                status: item.status || 'AVAILABLE',
                facilities: roomFacilities,
                description: roomNotes.trim() || undefined,
                order,
              }
            : item
        );
      } else {
        const newRoom: MasterItemEntry = {
          id: `rm-${Date.now()}`,
          code: roomNumber.trim(),
          roomNumber: roomNumber.trim(),
          name: `Room ${roomNumber.trim()} (${roomType})`,
          floorLevel: roomFloor,
          roomType,
          acType: roomACType,
          bedType: roomBedType,
          basePrice: parsedPrice,
          capacity: parsedCap,
          status: 'AVAILABLE',
          facilities: roomFacilities,
          description: roomNotes.trim() || undefined,
          order,
          isActive: true,
        };
        updatedRooms = [...currentList, newRoom];
      }

      setMasterItemsMap((prev) => ({
        ...prev,
        'add-room-setup': updatedRooms,
      }));

      // Synchronize to localStorage for /rooms and booking flows
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedRooms));
        } catch (err) {}
      }

      setShowAddForm(false);
      setEditingItemId(null);
      return;
    }

    if (!newName.trim()) return;

    const isMenuItem = activeSubBox.id === 'menu-items-setup';
    const isFacilityItem = activeSubBox.id === 'facility-master';
    if (isMenuItem && !newCategory.trim() && availableCategories.length > 0) return;

    const code = newCode.trim().toUpperCase() || newName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const currentList = masterItemsMap[activeSubBox.id] || currentItems;
    const parsedOrder = parseInt(newOrder, 10);
    const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : currentList.length + 1;

    // Process quantity prices
    let parsedQuantityPrices: QuantityPriceTier[] | undefined = undefined;
    let computedBasePrice: number | undefined = undefined;

    if (isMenuItem) {
      const validTiers = newQuantityPrices
        .filter((t) => t.quantityName.trim() && !isNaN(parseFloat(t.price)))
        .map((t) => {
          const matched = availableQuantities.find((q) => q.name === t.quantityName);
          return {
            quantityId: matched?.id,
            quantityName: t.quantityName.trim(),
            price: parseFloat(t.price),
          };
        });

      if (validTiers.length > 0) {
        parsedQuantityPrices = validTiers;
        computedBasePrice = validTiers[0].price;
      }
    }

    if (editingItemId) {
      setMasterItemsMap((prev) => ({
        ...prev,
        [activeSubBox.id]: (prev[activeSubBox.id] || currentItems).map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                code: code || item.code,
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                ...(isMenuItem || isFacilityItem
                  ? { category: newCategory.trim() || (isFacilityItem ? 'Room Furniture' : 'General') }
                  : {}),
                basePrice: computedBasePrice ?? item.basePrice,
                quantityPrices: parsedQuantityPrices ?? item.quantityPrices,
                order,
              }
            : item
        ),
      }));
    } else {
      const newItem: MasterItemEntry = {
        id: `${activeSubBox.id}-${Date.now()}`,
        code: code || 'NEW',
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        ...(isMenuItem || isFacilityItem
          ? { category: newCategory.trim() || (isFacilityItem ? 'Room Furniture' : 'General') }
          : {}),
        basePrice: computedBasePrice,
        quantityPrices: parsedQuantityPrices,
        order,
        isActive: true,
      };

      setMasterItemsMap((prev) => ({
        ...prev,
        [activeSubBox.id]: [...(prev[activeSubBox.id] || currentItems), newItem],
      }));
    }

    setEditingItemId(null);
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewCategory('');
    setNewQuantityPrices([]);
    setNewOrder('');
    setShowAddForm(false);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setMasterItemsMap((prev) => {
      const list = prev[activeSubBox.id] || currentItems;
      const updatedList = list.filter((item) => item.id !== itemId);
      if (activeSubBox.id === 'add-room-setup' && typeof window !== 'undefined') {
        try {
          localStorage.setItem('hotel_rooms_setup', JSON.stringify(updatedList));
        } catch (err) {}
      }
      return {
        ...prev,
        [activeSubBox.id]: updatedList,
      };
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0 select-none">
      {/* =========================================================================
          1. TOP ROW: 12 MASTER CATEGORIES (STATIC - LOCKED AT TOP, NEVER SCROLLS)
          Full width above the straight line!
         ========================================================================= */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-2.5">
        {MASTER_CATEGORIES.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedCategoryId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectCategory(item.id)}
              className={cn(
                'group relative flex flex-col items-center justify-center p-2 text-center transition-all duration-150',
                'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px] w-36 sm:w-44',
                isSelected
                  ? 'border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200'
                  : 'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#0B3D32] hover:bg-[#FAFBF9] hover:shadow-xs dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-emerald-500 dark:hover:bg-[#093027]'
              )}
            >
              <div
                className={cn(
                  'mb-1 transition-transform group-hover:scale-110',
                  isSelected
                    ? 'text-[#A51F36] dark:text-rose-300'
                    : 'text-[#A51F36] dark:text-rose-400'
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
              </div>

              <span
                className={cn(
                  'text-[10px] sm:text-[11px] font-semibold leading-tight line-clamp-2 px-0.5',
                  isSelected
                    ? 'font-bold text-[#A51F36] dark:text-rose-200'
                    : 'text-[#24352F] dark:text-white'
                )}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          2. STRAIGHT DIVIDER LINE (STATIC - EDGE-TO-EDGE)
          Full-bleed straight divider line pinned across the viewport.
         ========================================================================= */}
      <div className="shrink-0 -mx-3 sm:-mx-4 lg:-mx-5 border-b border-[#DCE3DF] dark:border-[#145447] my-2 sm:my-2.5" />

      {/* =========================================================================
          3. STRICTLY BELOW THE STRAIGHT LINE:
          Level 1: If selectedSubId === null -> Sub-options show in BOX TYPE
          Level 2: If selectedSubId !== null -> Secondary Sidebar on Left + Added Items Table on Right
          Notice: Everything stays strictly below the straight divider line!
         ========================================================================= */}
      {!selectedSubId ? (
        /* -----------------------------------------------------------------------
           LEVEL 1: Clean option boxes with icon and name ONLY below the straight line
           Top options & straight line remain static!
           ----------------------------------------------------------------------- */
        <div className="flex-1 min-h-0 flex flex-col pt-1 space-y-2.5 overflow-hidden">
          {/* Clean Category Title */}
          <div className="shrink-0 pb-0.5">
            <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
              {categoryHeaderTitle}
            </h2>
          </div>

          {/* Grid of Clean Option Boxes (Icon and Name Only) */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {activeCategory.subBoxes.map((sub) => {
                const SubBoxIcon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubBox(sub.id)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center p-2.5 sm:p-3 text-center transition-all duration-150',
                      'rounded-[3px] border shadow-2xs min-h-[76px] sm:min-h-[82px]',
                      'border-[#DCE3DF] bg-white text-[#24352F] hover:border-[#A51F36] hover:bg-[#FFF9F9] hover:shadow-xs',
                      'dark:border-[#145447] dark:bg-[#07241E] dark:text-[#E5EEE9] dark:hover:border-rose-700 dark:hover:bg-[#1a080d]'
                    )}
                  >
                    <div className="mb-1.5 text-[#A51F36] group-hover:scale-110 transition-transform dark:text-rose-400">
                      <SubBoxIcon className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 px-0.5 text-[#24352F] group-hover:text-[#A51F36] dark:text-white dark:group-hover:text-rose-300">
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* -----------------------------------------------------------------------
           LEVEL 2: STATIC SECONDARY SIDEBAR + INDEPENDENT SCROLLING RIGHT SIDE PAGE
           Secondary sidebar and top master options are completely STATIC.
           Only the right side table scrolls when items overflow.
           ----------------------------------------------------------------------- */
        <div className="-mx-3 sm:-mx-4 lg:-mx-5 -mb-3 sm:-mb-4 lg:-mb-5 flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* STATIC Secondary Sidebar (Locked, Does NOT scroll with right side page) */}
          <aside className="w-full lg:w-60 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#071F1A] flex flex-col select-none h-full min-h-0">
            {/* Clean Secondary Sidebar Header: Back Button, Header Name, One Search Box (STATIC) */}
            <div className="shrink-0 p-3 border-b border-[#E5EEE9] dark:border-[#145447] bg-white dark:bg-[#061B16] space-y-2">
              <button
                type="button"
                onClick={handleBackToBoxes}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-bold text-[#4A6B5D] bg-[#F2F6F4] hover:bg-[#E8F2EE] hover:text-[#0B3D32] dark:bg-[#0A2E26] dark:text-[#A4B8AE] dark:hover:text-white dark:hover:bg-[#0E3B31] border border-[#DCE3DF] dark:border-[#145447] transition-all shadow-2xs"
                title="Back to all categories view"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>All Categories</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 pt-0.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#0B3D32] text-white shadow-2xs dark:bg-emerald-700">
                  <activeCategory.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#24352F] dark:text-white font-heading tracking-tight truncate">
                    {categoryHeaderTitle}
                  </h3>
                  <p className="text-[10px] text-[#64736C] dark:text-[#8CA498] font-medium truncate">
                    Master Configuration
                  </p>
                </div>
              </div>

              <div className="relative pt-0.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879B90] dark:text-[#647F75]" />
                <input
                  type="text"
                  value={searchOptionsQuery}
                  onChange={(e) => setSearchOptionsQuery(e.target.value)}
                  placeholder="Search master list..."
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs transition-all focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:placeholder-[#647F75] dark:focus:border-emerald-500"
                />
                {searchOptionsQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchOptionsQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE Options List (Only scrolls internally within the sidebar) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredSubBoxes.map((sub) => {
                const SubBoxIcon = sub.icon;
                const isSelected = selectedSubId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubBox(sub.id)}
                    className={cn(
                      'w-full group flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-left transition-all duration-150',
                      isSelected
                        ? 'bg-[#0B3D32] text-white shadow-2xs font-bold dark:bg-emerald-700'
                        : 'text-[#24352F] hover:bg-white hover:text-[#0B3D32] hover:shadow-2xs dark:text-[#E5EEE9] dark:hover:bg-[#082921] dark:hover:text-emerald-300 font-medium'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] transition-colors',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'text-[#566D63] group-hover:text-[#0B3D32] dark:text-[#8CA498] dark:group-hover:text-emerald-300'
                      )}
                    >
                      <SubBoxIcon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>

                    <span className="text-xs truncate">{sub.name}</span>
                  </button>
                );
              })}
              {filteredSubBoxes.length === 0 && (
                <div className="py-8 text-center text-xs text-[#879B90] dark:text-[#647F75]">
                  <Search className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p>No master lists match &quot;{searchOptionsQuery}&quot;</p>
                </div>
              )}
            </div>
          </aside>

          {/* -----------------------------------------------------------------------
              RIGHT AREA: INDEPENDENT SCROLLING TABLE FOR THE SELECTED OPTION
             ----------------------------------------------------------------------- */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-[#F7F5F0] dark:bg-[#071512] overflow-hidden">
            {/* Header Bar: Title, Count, Status Chips, Search & Filter Controls, Add Button */}
            <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EEE9] dark:border-[#145447]/60 bg-white/60 dark:bg-[#071F1A]/60 backdrop-blur-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
                  {activeSubBox.name}
                </h2>
                {isRoomSetup ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-[11px] font-bold bg-[#EEF4F1] text-[#0B3D32] border border-[#DCE3DF] dark:bg-[#0A2E26] dark:text-emerald-300 dark:border-[#145447]">
                    {filteredItems.length} {filteredItems.length === 1 ? 'Room' : 'Rooms'} Configured
                    {filteredItems.length !== currentItems.length && ` (of ${currentItems.length})`}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#F0F4F2] text-[#4D6358] border border-[#DCE3DF] dark:bg-[#0A2E26] dark:text-emerald-300 dark:border-[#145447]">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    {filteredItems.length !== currentItems.length && ` (of ${currentItems.length})`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#879B90]" />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder={
                      isRoomSetup
                        ? 'Search room no., type, floor...'
                        : `Search ${activeSubBox.name.toLowerCase()}...`
                    }
                    className="w-40 sm:w-52 pl-8 pr-7 py-1.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] placeholder-[#879B90] focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500"
                  />
                  {tableSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTableSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#879B90] hover:text-[#24352F] dark:hover:text-white"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Room Setup Type Filter */}
                {isRoomSetup && availableRoomTypes.length > 0 && (
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Room Types</option>
                    {availableRoomTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Room Setup Floor Filter */}
                {isRoomSetup && availableFloors.length > 0 && (
                  <select
                    value={roomFloorFilter}
                    onChange={(e) => setRoomFloorFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Floors</option>
                    {availableFloors.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Category Dropdown Filter (Menu Items Setup & Facility Master) */}
                {!isRoomSetup && hasCategory && tableCategoryOptions.length > 0 && (
                  <select
                    value={tableCategoryFilter}
                    onChange={(e) => setTableCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-[3px] border border-[#DCE3DF] bg-white text-[#24352F] font-medium focus:outline-none focus:border-[#0B3D32] dark:border-[#145447] dark:bg-[#061B16] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {tableCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {/* Clear filters button if filtering */}
                {(tableSearchQuery ||
                  (isRoomSetup &&
                    (roomTypeFilter !== 'all' ||
                      roomFloorFilter !== 'all')) ||
                  (!isRoomSetup && hasCategory && tableCategoryFilter !== 'all')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableSearchQuery('');
                      setRoomTypeFilter('all');
                      setRoomFloorFilter('all');
                      setTableCategoryFilter('all');
                    }}
                    className="text-xs text-[#0B3D32] hover:underline dark:text-emerald-400 font-semibold px-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {getSubBoxEntityName(activeSubBox)}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Table Area: Divided grid table */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-2xs">
                      {isRoomSetup ? (
                        <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM NO.</th>
                          <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">ROOM TYPE</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">FLOOR</th>
                          <th className="py-2.5 px-3.5 w-36 border-r border-[#E5EEE9] dark:border-[#145447]">AC TYPE</th>
                          <th className="py-2.5 px-3.5 w-32 border-r border-[#E5EEE9] dark:border-[#145447]">BED TYPE</th>
                          <th className="py-2.5 px-3.5 w-24 border-r border-[#E5EEE9] dark:border-[#145447]">CAPACITY</th>
                          <th className="py-2.5 px-3.5 w-28 border-r border-[#E5EEE9] dark:border-[#145447]">FARE</th>
                          <th className="py-2.5 px-3.5 min-w-[220px] border-r border-[#E5EEE9] dark:border-[#145447]">FACILITIES</th>
                          <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                        </tr>
                      ) : (
                        <tr className="border-b border-[#DCE3DF] bg-[#F4F7F5] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#4D6358] dark:text-[#A4B8AE] uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-14 sm:w-16 text-center border-r border-[#E5EEE9] dark:border-[#145447]">#</th>
                          <th className="py-2.5 px-3.5 w-24 sm:w-28 border-r border-[#E5EEE9] dark:border-[#145447]">CODE</th>
                          <th className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                            {isMenuItem ? 'ITEM NAME' : isFacilityItem ? 'FACILITY NAME' : 'DISPLAY NAME'}
                          </th>
                          {hasCategory && (
                            <th className="py-2.5 px-3.5 w-36 sm:w-44 border-r border-[#E5EEE9] dark:border-[#145447]">CATEGORY</th>
                          )}
                          {isMenuItem && (
                            <th className="py-2.5 px-3.5 min-w-[220px] border-r border-[#E5EEE9] dark:border-[#145447]">UNIT & PRICING</th>
                          )}
                          <th className="py-2.5 px-3 w-20 text-center">ACTION</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                      {isRoomSetup ? (
                        filteredItems.map((item, index) => {
                          const isAC =
                            (item.acType || '').toLowerCase().includes('ac') &&
                            !(item.acType || '').toLowerCase().includes('non');

                          return (
                            <tr
                              key={item.id}
                              className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                            >
                              {/* Index */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20">
                                <span className="font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                                  {item.order ?? (index + 1)}
                                </span>
                              </td>

                              {/* Room Number */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#EEF4F1] dark:bg-[#0D362C] border border-[#D8E6DF] dark:border-[#145447]">
                                  <DoorOpen className="w-3.5 h-3.5 text-[#0B3D32] dark:text-emerald-400 shrink-0" />
                                  <span className="font-mono font-bold text-xs text-[#0B3D32] dark:text-emerald-300">
                                    {item.roomNumber || item.code}
                                  </span>
                                </div>
                              </td>

                              {/* Room Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="font-semibold text-xs text-[#24352F] dark:text-white">
                                  {item.roomType || 'Standard Room'}
                                </div>
                              </td>

                              {/* Floor Level */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-[#F4F7F5] dark:bg-[#0A2E26] px-2 py-0.5 text-[11px] font-medium text-[#33463E] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447]">
                                  {item.floorLevel || '1st Floor'}
                                </span>
                              </td>

                              {/* Climate / AC Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-medium border',
                                    isAC
                                      ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700'
                                  )}
                                >
                                  <Snowflake className="w-3 h-3" />
                                  <span>{item.acType || (isAC ? 'AC' : 'Non-AC')}</span>
                                </span>
                              </td>

                              {/* Bed Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="text-xs font-medium text-[#24352F] dark:text-slate-200">
                                  {item.bedType || 'King Bed'}
                                </span>
                              </td>

                              {/* Capacity */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="font-mono text-xs font-semibold text-[#4D6358] dark:text-emerald-300">
                                  {item.capacity || 2} Guests
                                </span>
                              </td>

                              {/* Fare */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  रू {Number(item.basePrice ?? 200).toLocaleString()}
                                </span>
                              </td>

                              {/* Facilities Tag Pills */}
                              <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="flex flex-wrap items-center gap-1 max-w-md">
                                  {item.facilities && item.facilities.length > 0 ? (
                                    item.facilities.map((fac, fIdx) => (
                                      <span
                                        key={fIdx}
                                        className="inline-block rounded-[2px] bg-[#F7F9F8] dark:bg-[#082820] px-1.5 py-0.5 text-[10px] font-medium text-[#4A6458] dark:text-[#A4B8AE] border border-[#DEE6E2] dark:border-[#145447]"
                                      >
                                        {fac}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[#879B90] text-xs">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Action */}
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(item)}
                                    title={`Edit Room ${item.roomNumber || item.code}`}
                                    className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    title={`Delete Room ${item.roomNumber || item.code}`}
                                    className="p-1 rounded-[2px] text-[#879B90] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        filteredItems.map((item, index) => (
                          <tr
                            key={item.id}
                            className="group hover:bg-[#F8FAF9] dark:hover:bg-[#093027]/40 transition-colors"
                          >
                            {/* Order / Index */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9]/40 dark:bg-[#061B16]/20">
                              <span className="font-mono text-[11px] font-semibold text-[#64736C] dark:text-[#A4B8AE]">
                                {item.order ?? (index + 1)}
                              </span>
                            </td>

                            {/* Code */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                              <span className="inline-block rounded-[2px] bg-[#EEF4F1] dark:bg-[#0D362C] px-2 py-0.5 text-[11px] font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border border-[#D8E6DF] dark:border-[#145447]">
                                {item.code}
                              </span>
                            </td>

                            {/* Item / Display Name */}
                            <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                              <div className="font-semibold text-xs text-[#24352F] dark:text-white">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-[#64736C] dark:text-[#A4B8AE] font-normal truncate max-w-sm mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </td>

                            {/* Category (Menu Items Setup & Facility Master) */}
                            {hasCategory && (
                              <td className="py-2.5 px-3.5 whitespace-nowrap border-r border-[#E5EEE9] dark:border-[#145447]">
                                <span className="inline-flex items-center rounded-[2px] bg-[#F4F7F5] dark:bg-[#0A2E26] px-2 py-0.5 text-[11px] font-medium text-[#33463E] dark:text-emerald-200 border border-[#DCE3DF] dark:border-[#145447]">
                                  {item.category || (isFacilityItem ? 'Room Furniture' : 'General')}
                                </span>
                              </td>
                            )}

                            {/* Unit & Pricing (Menu Items Setup - divided table-like pill) */}
                            {isMenuItem && (
                              <td className="py-2.5 px-3.5 border-r border-[#E5EEE9] dark:border-[#145447]">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.quantityPrices && item.quantityPrices.length > 0 ? (
                                    item.quantityPrices.map((qp, qIdx) => (
                                      <span
                                        key={qIdx}
                                        className="inline-flex items-stretch rounded-[2px] border border-[#D5E0DB] dark:border-[#145447] bg-white dark:bg-[#061B16] text-[11px] overflow-hidden shadow-2xs"
                                        title={`${qp.quantityName}: रू ${qp.price.toLocaleString()}`}
                                      >
                                        <span className="px-2 py-0.5 font-medium text-[#4D6358] dark:text-[#A4B8AE] bg-[#F7F9F8] dark:bg-[#092B23]">
                                          {qp.quantityName}
                                        </span>
                                        <span className="px-2 py-0.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border-l border-[#D5E0DB] dark:border-[#145447] bg-emerald-50/50 dark:bg-emerald-950/40">
                                          रू {Number(qp.price).toLocaleString()}
                                        </span>
                                      </span>
                                    ))
                                  ) : item.basePrice !== undefined ? (
                                    <span className="inline-flex items-stretch rounded-[2px] border border-[#D5E0DB] dark:border-[#145447] bg-white dark:bg-[#061B16] text-[11px] overflow-hidden shadow-2xs">
                                      <span className="px-2 py-0.5 font-medium text-[#4D6358] dark:text-[#A4B8AE] bg-[#F7F9F8] dark:bg-[#092B23]">
                                        Standard
                                      </span>
                                      <span className="px-2 py-0.5 font-mono font-bold text-[#0B3D32] dark:text-emerald-300 border-l border-[#D5E0DB] dark:border-[#145447] bg-emerald-50/50 dark:bg-emerald-950/40">
                                        रू {Number(item.basePrice).toLocaleString()}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-[#879B90] text-xs">—</span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Action */}
                            <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  title={`Edit ${item.name}`}
                                  className="p-1 rounded-[2px] text-[#64736C] hover:text-[#0B3D32] hover:bg-[#EEF4F1] dark:text-[#A4B8AE] dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  title={`Delete ${item.name}`}
                                  className="p-1 rounded-[2px] text-[#879B90] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={isRoomSetup ? 10 : isMenuItem ? 6 : hasCategory ? 5 : 4}
                            className="py-12 text-center text-xs text-[#879B90]"
                          >
                            {tableSearchQuery ||
                            (isRoomSetup &&
                              (roomTypeFilter !== 'all' ||
                                roomFloorFilter !== 'all')) ||
                            (hasCategory && tableCategoryFilter !== 'all') ? (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>No {activeSubBox.name.toLowerCase()} match your search / filter criteria</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTableSearchQuery('');
                                    setRoomTypeFilter('all');
                                    setRoomFloorFilter('all');
                                    setTableCategoryFilter('all');
                                  }}
                                  className="text-xs font-semibold text-[#0B3D32] hover:underline dark:text-emerald-400"
                                >
                                  Clear filter
                                </button>
                              </div>
                            ) : (
                              `No ${activeSubBox.name.toLowerCase()} added yet`
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing <strong className="text-[#24352F] dark:text-white">{filteredItems.length}</strong> of{' '}
                      <strong className="text-[#24352F] dark:text-white">{currentItems.length}</strong> {activeSubBox.name}
                    </span>
                    {(tableSearchQuery ||
                      (isRoomSetup &&
                        (roomTypeFilter !== 'all' ||
                          roomFloorFilter !== 'all')) ||
                      (hasCategory && tableCategoryFilter !== 'all')) && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        Filtered
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px]">
                    {activeCategory.code} · {activeCategory.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DIALOG: ADD/EDIT FORM (OVERLAY MODAL POPUP - NEVER INLINE)
          Fields: CODE, DISPLAY NAME, CATEGORY (for menu items), QUANTITY PRICING TIERS, ORDER
         ========================================================================= */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            setShowAddForm(false);
            setEditingItemId(null);
          }}
        >
          <div
            className={cn(
              'w-full rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150',
              isRoomSetup ? 'max-w-2xl' : 'max-w-xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Clean and professional without boilerplate text */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#0B3D32]/10 dark:bg-emerald-950/70 text-[#0B3D32] dark:text-emerald-300">
                  <activeSubBox.icon className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  {editingItemId ? 'Edit' : 'Add'} {getSubBoxEntityName(activeSubBox)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItemId(null);
                }}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNewItem}>
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {activeSubBox.id === 'menu-items-setup' ? (
                  <>
                    {/* Item Name (Primary Field, Prominent) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Item Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Chicken Steam Momo"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>

                    {/* Category, Code, Order Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Category (Searchable Combobox with Suggestions) */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={newCategory}
                          onChange={(name) => setNewCategory(name)}
                          onAddNewCategory={handleAddNewCategory}
                          availableCategories={availableCategories}
                          placeholder="Search or select category..."
                        />
                      </div>

                      {/* Code */}
                      <div className="col-span-7 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Item Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="e.g. MOMO-CHK"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Order */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Unit & Pricing: Simple and clean */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Unit <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const usedNames = new Set(newQuantityPrices.map((q) => q.quantityName));
                            const nextAvailable = availableQuantities.find((q) => !usedNames.has(q.name));
                            setNewQuantityPrices((prev) => [
                              ...prev,
                              {
                                quantityName: nextAvailable ? nextAvailable.name : '',
                                price: '',
                              },
                            ]);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D32] hover:text-[#082b23] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Unit</span>
                        </button>
                      </div>

                      {/* Unit & Price Rows */}
                      <div className="space-y-2">
                        {newQuantityPrices.map((tier, idx) => {
                          const otherUsedNames = newQuantityPrices
                            .filter((_, i) => i !== idx)
                            .map((t) => t.quantityName);

                          return (
                            <div key={idx} className="flex items-center gap-2">
                              {/* Searchable Combobox */}
                              <div className="flex-1 min-w-0">
                                <QuantityAutocomplete
                                  value={tier.quantityName}
                                  onChange={(name) => {
                                    setNewQuantityPrices((prev) =>
                                      prev.map((t, i) => (i === idx ? { ...t, quantityName: name } : t))
                                    );
                                  }}
                                  availableQuantities={availableQuantities}
                                  excludeNames={otherUsedNames}
                                  placeholder="Unit (e.g. Plate, Full, Half)"
                                />
                              </div>

                              {/* Price Input with currency prefix */}
                              <div className="w-32 sm:w-36 relative shrink-0">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                                  रू
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  required
                                  placeholder="0.00"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewQuantityPrices((prev) =>
                                      prev.map((t, i) => (i === idx ? { ...t, price: val } : t))
                                    );
                                  }}
                                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500"
                                />
                              </div>

                              {/* Remove Tier Button */}
                              {newQuantityPrices.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewQuantityPrices((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[3px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                                  title="Remove unit"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : isFacilityItem ? (
                  <>
                    {/* Facility Name (Primary Field) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Facility Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Work Desk & Study Table, Smart LED TV 55&quot;, Rainfall Shower Set"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>

                    {/* Category, Facility Code & Order Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Facility Category */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Facility Category <span className="text-rose-500">*</span>
                        </label>
                        <CategoryAutocomplete
                          value={newCategory}
                          onChange={(name) => setNewCategory(name)}
                          onAddNewCategory={handleAddNewCategory}
                          availableCategories={availableFacilityCategories}
                          placeholder="Select category (e.g. Room Furniture)..."
                        />
                      </div>

                      <div className="col-span-7 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Facility Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="e.g. TBL"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Specifications (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="e.g. Dimensions, brand, or feature notes"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                  </>
                ) : isRoomSetup ? (
                  <>
                    {/* Room Number & Floor Level */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Number */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Room Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <DoorOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            autoFocus
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            placeholder="e.g. 101, 102, 205, 301"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-9 pr-3 text-xs font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Floor Level (From floor-master) */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Floor Level <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomFloor}
                          onChange={(e) => setRoomFloor(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableFloors.map((floor) => (
                            <option key={floor.id} value={floor.name}>
                              {floor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Room Type, AC Type & Bed Type */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Type (From room-type-master, auto-sync price) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Room Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomType}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setRoomType(selected);
                            const matched = availableRoomTypes.find((t) => t.name === selected);
                            if (matched && matched.basePrice) {
                              setRoomPrice(matched.basePrice.toString());
                            }
                          }}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableRoomTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* AC / Non-AC Climate (From ac-type-master) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          AC Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomACType}
                          onChange={(e) => setRoomACType(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableACTypes.map((ac) => (
                            <option key={ac.id} value={ac.name}>
                              {ac.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bed Configuration (From bed-type-master) */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Bed Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomBedType}
                          onChange={(e) => setRoomBedType(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          {availableBedTypes.map((bed) => (
                            <option key={bed.id} value={bed.name}>
                              {bed.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fare & Capacity Grid */}
                    <div className="grid grid-cols-12 gap-3">
                      {/* Room Fare */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Fare (रू) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                            रू
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            required
                            value={roomPrice}
                            onChange={(e) => setRoomPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Guest Capacity */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Guest Capacity <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(e.target.value)}
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="1">1 Guest</option>
                          <option value="2">2 Guests</option>
                          <option value="3">3 Guests</option>
                          <option value="4">4 Guests</option>
                          <option value="5">5 Guests</option>
                          <option value="6">6 Guests</option>
                        </select>
                      </div>
                    </div>

                    {/* Room Facilities: Clean Category-Grouped Amenity Selector with Search Suggestions */}
                    <RoomFacilitiesCategoryPicker
                      selectedFacilities={roomFacilities}
                      onChange={setRoomFacilities}
                      availableFacilities={availableFacilities}
                      availableCategories={availableFacilityCategories}
                      onAddNewFacility={handleAddNewFacilityWithCategory}
                    />

                    {/* Room Notes & Features */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Room Notes / Specifications (Optional)
                      </label>
                      <input
                        type="text"
                        value={roomNotes}
                        onChange={(e) => setRoomNotes(e.target.value)}
                        placeholder="Optional room notes or specifications..."
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard non-menu items setup */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={`e.g. ${getSubBoxEntityName(activeSubBox)} Name`}
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Description / Details (Optional)
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="e.g. Specifications, dimensions, or details"
                        className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="e.g. 01"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newOrder}
                          onChange={(e) => setNewOrder(e.target.value)}
                          placeholder="1"
                          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-medium text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItemId(null);
                  }}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-4 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isRoomSetup
                      ? !roomNumber.trim() || !roomPrice.trim() || !roomType.trim()
                      : !newName.trim() ||
                        (isMenuItem &&
                          ((!newCategory.trim() && availableCategories.length > 0) ||
                            newQuantityPrices.length === 0 ||
                            newQuantityPrices.some((t) => !t.quantityName.trim() || !t.price.trim()))) ||
                        (isFacilityItem && !newCategory.trim() && availableFacilityCategories.length > 0)
                  }
                  className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editingItemId
                      ? `Update ${getSubBoxEntityName(activeSubBox)}`
                      : `Save ${getSubBoxEntityName(activeSubBox)}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

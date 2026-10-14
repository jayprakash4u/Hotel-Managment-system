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
  placeholder = 'Type to search quantity...',
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
        setQuery(value);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [value]);

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

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <input
          type="text"
          required
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder={placeholder}
          className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1.5 pl-2.5 pr-8 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#071F1A] dark:text-white dark:focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-normal"
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
            <div className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
              No matching quantity found in Quantity Setup
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HotelSetupPage() {
  // Currently selected category (Default: 'general')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('general');

  // Currently selected sub-box (Default: null -> options appear in BOX TYPE below straight line!)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Search filter for options inside the secondary sub-sidebar (Level 2)
  const [searchOptionsQuery, setSearchOptionsQuery] = useState<string>('');

  // Editable master items map
  const [masterItemsMap, setMasterItemsMap] = useState<Record<string, MasterItemEntry[]>>(INITIAL_MASTER_ITEMS);

  // New item form state (Code, Display Name, Category, Quantity Prices, Order)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newQuantityPrices, setNewQuantityPrices] = useState<
    Array<{ quantityName: string; price: string }>
  >([]);
  const [newOrder, setNewOrder] = useState<string>('');

  // Available categories for menu items setup
  const availableCategories = useMemo(() => {
    return masterItemsMap['categories-setup'] || INITIAL_MASTER_ITEMS['categories-setup'] || [];
  }, [masterItemsMap]);

  // Available quantities for quantity-based pricing
  const availableQuantities = useMemo(() => {
    return masterItemsMap['quantity-setup'] || INITIAL_MASTER_ITEMS['quantity-setup'] || [];
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
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking a sub-option box below the straight line -> opens Level 2 (sidebar + table)
  const handleSelectSubBox = (subId: string) => {
    setSelectedSubId(subId);
    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle clicking the Back button on the secondary sidebar -> returns to Level 1 box grid
  const handleBackToBoxes = () => {
    setSelectedSubId(null);
    setSearchOptionsQuery('');
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

  // Added items on the page (clean, direct display)
  const filteredItems = currentItems;

  // Open modal to add a new item
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    setNewCode('');
    setNewName('');
    setNewCategory(availableCategories[0]?.name || '');
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
    setNewCode(item.code);
    setNewName(item.name);
    setNewCategory(item.category || availableCategories[0]?.name || '');
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

  // Save new item or update existing item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const isMenuItem = activeSubBox.id === 'menu-items-setup';
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
                ...(isMenuItem ? { category: newCategory.trim() || availableCategories[0]?.name || 'General' } : {}),
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
        ...(isMenuItem ? { category: newCategory.trim() || availableCategories[0]?.name || 'General' } : {}),
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
    setNewCategory('');
    setNewQuantityPrices([]);
    setNewOrder('');
    setShowAddForm(false);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setMasterItemsMap((prev) => {
      const list = prev[activeSubBox.id] || currentItems;
      return {
        ...prev,
        [activeSubBox.id]: list.filter((item) => item.id !== itemId),
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
          <aside className="w-full lg:w-48 xl:w-52 shrink-0 border-b lg:border-b-0 lg:border-r border-[#DCE3DF] dark:border-[#145447] bg-white dark:bg-[#071F1A] flex flex-col select-none h-full min-h-0">
            {/* Clean Secondary Sidebar Header: Back Button, Header Name, One Search Box (STATIC) */}
            <div className="shrink-0 p-2.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] space-y-1.5">
              <button
                type="button"
                onClick={handleBackToBoxes}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#4A6B5D] hover:text-[#0B3D32] dark:text-[#A4B8AE] dark:hover:text-emerald-300 transition-colors"
                title="Back to options box view"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>

              <h3 className="text-xs sm:text-sm font-bold text-[#24352F] dark:text-white font-heading tracking-tight truncate">
                {categoryHeaderTitle}
              </h3>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#879B90] dark:text-[#647F75]" />
                <input
                  type="text"
                  value={searchOptionsQuery}
                  onChange={(e) => setSearchOptionsQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-[3px] border border-[#DCE3DF] bg-white py-1 pl-7 pr-6 text-[11px] font-medium text-[#24352F] placeholder-[#879B90] shadow-2xs transition-all focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:placeholder-[#647F75] dark:focus:border-emerald-500"
                />
                {searchOptionsQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchOptionsQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE Options List (Only scrolls internally within the sidebar) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filteredSubBoxes.map((sub) => {
                const SubBoxIcon = sub.icon;
                const isSelected = selectedSubId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubBox(sub.id)}
                    className={cn(
                      'w-full group flex items-center justify-between px-2 py-1.5 rounded-[3px] text-left transition-all duration-150',
                      isSelected
                        ? 'border border-[#A51F36] bg-[#FFF5F6] text-[#A51F36] ring-1 ring-[#A51F36] dark:border-rose-700 dark:bg-[#320810] dark:text-rose-200 shadow-2xs font-bold'
                        : 'border border-transparent hover:border-[#FAD2D8] hover:bg-[#FFF9F9] text-[#24352F] dark:text-[#E5EEE9] dark:hover:border-rose-900/60 dark:hover:bg-[#1a080d]'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] transition-colors',
                          isSelected
                            ? 'bg-[#A51F36] text-white dark:bg-rose-700'
                            : 'bg-[#FFF5F6] text-[#A51F36] group-hover:bg-[#FCE7E9] dark:bg-[#320810] dark:text-rose-300'
                        )}
                      >
                        <SubBoxIcon className="w-3 h-3 stroke-[2]" />
                      </div>

                      <span className="text-[11px] sm:text-xs truncate">{sub.name}</span>
                    </div>

                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-transform ml-1',
                        isSelected
                          ? 'text-[#A51F36] dark:text-rose-300 translate-x-0.5'
                          : 'text-slate-400 opacity-50 group-hover:opacity-100'
                      )}
                    />
                  </button>
                );
              })}
              {filteredSubBoxes.length === 0 && (
                <div className="py-8 text-center text-xs text-[#879B90]">
                  No options match &quot;{searchOptionsQuery}&quot;
                </div>
              )}
            </div>
          </aside>

          {/* -----------------------------------------------------------------------
              RIGHT AREA: INDEPENDENT SCROLLING TABLE FOR THE SELECTED OPTION
             ----------------------------------------------------------------------- */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-[#F7F5F0] dark:bg-[#071512] overflow-hidden">
            {/* Clean Header Bar: Title and Add Button Only (STATIC) */}
            <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between border-b border-[#E5EEE9] dark:border-[#145447]/60 bg-white/40 dark:bg-[#071F1A]/40">
              <h2 className="text-base sm:text-lg font-bold text-[#24352F] dark:text-white font-heading tracking-tight">
                {activeSubBox.name}
              </h2>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 rounded-[3px] bg-[#0B3D32] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093027] transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {activeSubBox.name.replace(/s$/, '')}</span>
              </button>
            </div>

            {/* Scrollable Table Area: ONLY THIS SCROLLS when items overflow */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
              <div className="overflow-hidden rounded-[3px] border border-[#DCE3DF] bg-white shadow-2xs dark:border-[#145447] dark:bg-[#07241E]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-[#E5EEE9] bg-[#FAFBF9] dark:border-[#145447] dark:bg-[#061B16] text-[10px] font-bold text-[#64736C] dark:text-[#A4B8AE] uppercase tracking-wider">
                        <th className="py-2.5 px-3.5 w-20 text-center">ORDER</th>
                        <th className="py-2.5 px-3.5 w-24">CODE</th>
                        <th className="py-2.5 px-3.5">DISPLAY NAME</th>
                        {activeSubBox.id === 'menu-items-setup' && (
                          <>
                            <th className="py-2.5 px-3.5 w-36">CATEGORY</th>
                            <th className="py-2.5 px-3.5 min-w-[220px]">QUANTITY & PRICING</th>
                          </>
                        )}
                        <th className="py-2.5 px-3.5 w-24 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EEE9] dark:divide-[#145447] text-xs">
                      {filteredItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="group hover:bg-[#FAFBF9] dark:hover:bg-[#093027] transition-colors"
                        >
                          {/* Order */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE]">
                              {item.order ?? (index + 1)}
                            </span>
                          </td>

                          {/* Code */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="rounded-[2px] bg-[#F0F4F2] px-2 py-0.5 text-[10px] font-bold font-mono text-[#0B3D32] dark:bg-[#0D362C] dark:text-emerald-300">
                              {item.code}
                            </span>
                          </td>

                          {/* Display Name */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-[#24352F] dark:text-white">
                            {item.name}
                          </td>

                          {/* Category (Menu Items Setup) */}
                          {activeSubBox.id === 'menu-items-setup' && (
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-[2px] bg-[#FFF5F6] border border-[#FAD2D8] px-2 py-0.5 text-[10px] font-bold text-[#A51F36] dark:bg-[#320810] dark:border-rose-800 dark:text-rose-200">
                                {item.category || 'General'}
                              </span>
                            </td>
                          )}

                          {/* Quantity & Pricing (Menu Items Setup) */}
                          {activeSubBox.id === 'menu-items-setup' && (
                            <td className="py-2.5 px-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.quantityPrices && item.quantityPrices.length > 0 ? (
                                  item.quantityPrices.map((qp, qIdx) => (
                                    <span
                                      key={qIdx}
                                      className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold border bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-[#093027] dark:border-[#145447] dark:text-[#E5EEE9]"
                                      title={qp.quantityName}
                                    >
                                      <span className="opacity-75">{qp.quantityName}:</span>
                                      <span className="font-mono font-bold text-[#0B3D32] dark:text-emerald-300">
                                        रू {qp.price.toLocaleString()}
                                      </span>
                                    </span>
                                  ))
                                ) : item.basePrice !== undefined ? (
                                  <span className="inline-flex items-center gap-1 rounded-[2px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200">
                                    रू {item.basePrice.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Action */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title={`Edit ${item.name}`}
                                className="opacity-70 group-hover:opacity-100 p-1 rounded-[2px] text-slate-500 hover:text-[#0B3D32] hover:bg-emerald-50 dark:hover:bg-[#0A2E26] dark:hover:text-emerald-300 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                title={`Delete ${item.name}`}
                                className="opacity-70 group-hover:opacity-100 p-1 rounded-[2px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={activeSubBox.id === 'menu-items-setup' ? 6 : 4} className="py-12 text-center text-xs text-[#879B90]">
                            No {activeSubBox.name.toLowerCase()} added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  <span>
                    Total <strong className="text-[#24352F] dark:text-white">{currentItems.length}</strong> {activeSubBox.name}
                  </span>
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
            className="w-full max-w-lg rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  {editingItemId ? 'Edit' : 'Add New'} {activeSubBox.name.replace(/s$/, '')}
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  {activeSubBox.id === 'menu-items-setup'
                    ? 'Configure category, item details, portions and quantity pricing'
                    : 'Enter code, display name and order'}
                </p>
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
              <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Category Selection for Menu Items */}
                {activeSubBox.id === 'menu-items-setup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                      CATEGORY *
                    </label>
                    <select
                      required
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                    >
                      <option value="" disabled>-- Select Category --</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 1. Code */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. MOMO-CHK"
                    autoFocus={activeSubBox.id !== 'menu-items-setup'}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>

                {/* 2. Display Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    DISPLAY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`e.g. ${activeSubBox.name.replace(/s$/, '')} Name`}
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-semibold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>

                {/* Dynamic Quantity & Pricing Section for Menu Items (Searchable Combobox) */}
                {activeSubBox.id === 'menu-items-setup' && (
                  <div className="rounded-[3px] border border-[#DCE3DF] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16] p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] font-bold text-[#24352F] dark:text-white uppercase tracking-wider">
                          Quantity & Pricing *
                        </span>
                        <span className="text-[10px] text-[#64736C] dark:text-[#A4B8AE]">
                          Search and select quantities from Quantity Setup with their selling prices.
                        </span>
                      </div>
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
                        className="inline-flex items-center gap-1 rounded-[2px] bg-[#0B3D32]/10 border border-[#0B3D32]/20 px-2.5 py-1 text-[10px] font-bold text-[#0B3D32] hover:bg-[#0B3D32]/20 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Portion</span>
                      </button>
                    </div>

                    {/* Assigned Quantities & Prices List */}
                    <div className="space-y-2">
                      {newQuantityPrices.map((tier, idx) => {
                        const otherUsedNames = newQuantityPrices
                          .filter((_, i) => i !== idx)
                          .map((t) => t.quantityName);

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white dark:bg-[#07241E] p-2 rounded-[3px] border border-[#E5EEE9] dark:border-[#145447]"
                          >
                            {/* Searchable Combobox Dropdown */}
                            <div className="flex-1 min-w-0">
                              <label className="block text-[9px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-0.5 uppercase">
                                Quantity (Search from Setup) *
                              </label>
                              <QuantityAutocomplete
                                value={tier.quantityName}
                                onChange={(name) => {
                                  setNewQuantityPrices((prev) =>
                                    prev.map((t, i) => (i === idx ? { ...t, quantityName: name } : t))
                                  );
                                }}
                                availableQuantities={availableQuantities}
                                excludeNames={otherUsedNames}
                                placeholder="Type to search e.g. Full, Half, Plate..."
                              />
                            </div>

                            {/* Price Input */}
                            <div className="w-32 sm:w-36">
                              <label className="block text-[9px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-0.5 uppercase">
                                Price (रू) *
                              </label>
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
                                className="w-full rounded-[2px] border border-[#DCE3DF] bg-white py-1.5 px-2 text-xs font-mono font-bold text-[#24352F] focus:border-[#0B3D32] focus:outline-none dark:border-[#145447] dark:bg-[#071F1A] dark:text-white"
                              />
                            </div>

                            {/* Remove Tier Button */}
                            {newQuantityPrices.length > 1 && (
                              <div className="pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewQuantityPrices((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-[2px] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Remove this portion"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Order */}
                <div>
                  <label className="block text-[11px] font-bold text-[#64736C] dark:text-[#A4B8AE] mb-1">
                    ORDER
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newOrder}
                    onChange={(e) => setNewOrder(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-[3px] border border-[#DCE3DF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#24352F] shadow-2xs focus:border-[#0B3D32] focus:outline-none focus:ring-1 focus:ring-[#0B3D32] dark:border-[#145447] dark:bg-[#07241E] dark:text-white dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItemId(null);
                  }}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !newName.trim() ||
                    (activeSubBox.id === 'menu-items-setup' &&
                      ((!newCategory.trim() && availableCategories.length > 0) ||
                        newQuantityPrices.length === 0 ||
                        newQuantityPrices.some((t) => !t.quantityName.trim() || !t.price.trim())))
                  }
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {editingItemId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

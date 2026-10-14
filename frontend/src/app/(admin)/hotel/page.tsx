'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Building2,
  BedDouble,
  UtensilsCrossed,
  ChefHat,
  Boxes,
  DollarSign,
  Users,
  Sparkles,
  HeartHandshake,
  Bell,
  Lock,
  UserCheck,
  Clock,
  ShieldCheck,
  MapPin,
  Flag,
  Scale,
  Compass,
  Tag,
  Receipt,
  FileText,
  SlidersHorizontal,
  Layers,
  Calendar,
  Wrench,
  Key,
  Check,
  X,
  Search,
  Plus,
  Trash2,
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

export interface MasterItemEntry {
  id: string;
  code: string;
  name: string;
  order?: number;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: 'general',
    code: '01',
    name: 'General Masters',
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
    id: 'hotel-property',
    code: '02',
    name: 'Hotel & Property Masters',
    icon: Building2,
    subBoxes: [
      { id: 'hotel-types', name: 'Hotel Types', icon: Building2, description: 'Resort and property style classifications' },
      { id: 'property-categories', name: 'Property Categories', icon: Layers, description: 'Star rating and brand tiers' },
      { id: 'facilities', name: 'Hotel Facilities', icon: Sparkles, description: 'General guest and property amenities' },
      { id: 'amenities', name: 'Amenities', icon: Tag, description: 'In-room amenities and guest comforts' },
      { id: 'room-views', name: 'Room Views', icon: Compass, description: 'Mountain, lake, garden, and city views' },
      { id: 'bed-types', name: 'Bed Types', icon: BedDouble, description: 'King, Queen, Twin, and Sofa bed standards' },
      { id: 'room-types', name: 'Room Types', icon: BedDouble, description: 'Deluxe, Suite, Standard, Villa configurations' },
      { id: 'room-classes', name: 'Room Classes', icon: Key, description: 'Pricing tier classifications' },
      { id: 'room-features', name: 'Room Features', icon: SlidersHorizontal, description: 'Balcony, jacuzzi, and smoking policies' },
      { id: 'housekeeping-statuses', name: 'Housekeeping Statuses', icon: Sparkles, description: 'Clean, Dirty, Inspected, Out-of-order' },
    ],
  },
  {
    id: 'room-booking',
    code: '03',
    name: 'Room Booking Masters',
    icon: BedDouble,
    subBoxes: [
      { id: 'booking-sources', name: 'Booking Sources', icon: Globe, description: 'OTAs, Walk-in, Direct Web, Corporate' },
      { id: 'booking-types', name: 'Booking Types', icon: Tag, description: 'Confirmed, Provisional, Waitlist' },
      { id: 'reservation-statuses', name: 'Reservation Statuses', icon: Check, description: 'Booked, Checked-in, Checked-out, Cancelled' },
      { id: 'stay-purposes', name: 'Stay Purposes', icon: Compass, description: 'Leisure, Business, Conference, Wedding' },
      { id: 'rate-plans', name: 'Rate Plans', icon: DollarSign, description: 'EP, CP, MAP, AP, Non-refundable' },
      { id: 'meal-plans', name: 'Meal Plans', icon: UtensilsCrossed, description: 'Room Only, Breakfast Included, Full Board' },
      { id: 'cancellation-reasons', name: 'Cancellation Reasons', icon: Clock, description: 'Change of plans, Weather, Emergency' },
      { id: 'no-show-reasons', name: 'No-Show Reasons', icon: Users, description: 'Flight delay, Emergency, Unreachable' },
      { id: 'guest-categories', name: 'Guest Categories', icon: UserCheck, description: 'VIP, Regular, Corporate, Diplomat' },
      { id: 'id-document-types', name: 'ID Document Types', icon: FileText, description: 'Citizenship, Passport, Driving License' },
    ],
  },
  {
    id: 'restaurant-tables',
    code: '04',
    name: 'Restaurant & Table Masters',
    icon: UtensilsCrossed,
    subBoxes: [
      { id: 'restaurant-outlets', name: 'Restaurant Outlets', icon: UtensilsCrossed, description: 'Fine dining, Rooftop bar, Coffee lounge' },
      { id: 'dining-areas', name: 'Dining Areas', icon: Compass, description: 'Indoor, Terrace, Garden, Poolside' },
      { id: 'table-types', name: 'Table Types', icon: Layers, description: 'Standard 2-top, 4-top, Booth, Banquet round' },
      { id: 'table-configurations', name: 'Table Configurations', icon: Users, description: 'Seating capacity and layout rules' },
      { id: 'table-statuses', name: 'Table Statuses', icon: Check, description: 'Vacant, Occupied, Reserved, Billed' },
      { id: 'seating-preferences', name: 'Seating Preferences', icon: Sparkles, description: 'Window view, Smoking, Quiet corner' },
      { id: 'service-types', name: 'Service Types', icon: Tag, description: 'Dine-in, Takeaway, Room Delivery' },
      { id: 'order-types', name: 'Order Types', icon: FileText, description: 'Regular, Express, Banquet, Complimentary' },
      { id: 'order-sources', name: 'Order Sources', icon: Globe, description: 'Table POS, QR Digital Menu, Phone' },
      { id: 'kot-types', name: 'KOT Types', icon: ChefHat, description: 'Kitchen Order Ticket routing classifications' },
    ],
  },
  {
    id: 'menu-food',
    code: '05',
    name: 'Menu & Food Masters',
    icon: ChefHat,
    subBoxes: [
      { id: 'menu-categories', name: 'Menu Categories', icon: ChefHat, description: 'Appetizers, Mains, Desserts, Beverages' },
      { id: 'subcategories', name: 'Subcategories', icon: Layers, description: 'Pasta, Curries, Cocktails, Mocktails' },
      { id: 'cuisine-types', name: 'Cuisine Types', icon: Globe, description: 'Nepali, Continental, Indian, Italian, Asian' },
      { id: 'food-types', name: 'Food Types', icon: UtensilsCrossed, description: 'Vegetarian, Non-Vegetarian, Vegan, Halal' },
      { id: 'dietary-preferences', name: 'Dietary Preferences', icon: Sparkles, description: 'Gluten-Free, Dairy-Free, Nut-Free' },
      { id: 'allergen-types', name: 'Allergen Types', icon: ShieldCheck, description: 'Peanuts, Shellfish, Dairy, Soy warnings' },
      { id: 'portion-sizes', name: 'Portion Sizes', icon: Scale, description: 'Small, Regular, Large, Family pack' },
      { id: 'add-on-groups', name: 'Add-on Groups', icon: Tag, description: 'Extra cheese, Sauce choice, Side fries' },
      { id: 'modifier-options', name: 'Modifier Options', icon: SlidersHorizontal, description: 'Cooking style, Spice level' },
      { id: 'menu-item-tags', name: 'Menu Item Tags', icon: Tag, description: "Chef's Special, Spicy, Recommended" },
    ],
  },
  {
    id: 'inventory-purchase',
    code: '06',
    name: 'Inventory & Purchase Masters',
    icon: Boxes,
    subBoxes: [
      { id: 'stock-categories', name: 'Stock Categories', icon: Boxes, description: 'Food & Beverage, Linen, Amenities, Cleaning' },
      { id: 'item-groups', name: 'Item Groups', icon: Layers, description: 'Dairy, Meat, Dry grocery, Guest toiletries' },
      { id: 'stock-items', name: 'Stock Items', icon: Tag, description: 'Individual inventory SKU records' },
      { id: 'stock-units', name: 'Stock Units', icon: Scale, description: 'Packaging and issuing units' },
      { id: 'storage-locations', name: 'Storage Locations', icon: MapPin, description: 'Cold storage, Dry store, Wine cellar' },
      { id: 'warehouses', name: 'Warehouses', icon: Building2, description: 'Main hotel store, Outlet mini-stores' },
      { id: 'suppliers', name: 'Suppliers', icon: Users, description: 'Registered vendors and distributor profiles' },
      { id: 'purchase-types', name: 'Purchase Types', icon: DollarSign, description: 'Direct cash, Credit PO, Contract delivery' },
      { id: 'adjustment-reasons', name: 'Adjustment Reasons', icon: Clock, description: 'Damage, Expiry, Theft, Spill' },
      { id: 'reorder-rules', name: 'Reorder Rules', icon: SlidersHorizontal, description: 'Min-Max reorder point automation' },
    ],
  },
  {
    id: 'finance-tax',
    code: '07',
    name: 'Finance & Tax Masters',
    icon: DollarSign,
    subBoxes: [
      { id: 'payment-methods', name: 'Payment Methods', icon: DollarSign, description: 'Cash, Card, QR Scan, Bank Wire' },
      { id: 'payment-gateways', name: 'Payment Gateways', icon: Globe, description: 'Fonepay, Stripe, Himalayan Bank, eSewa' },
      { id: 'tax-categories', name: 'Tax Categories', icon: Receipt, description: 'VAT, Service Charge, Luxury Tax' },
      { id: 'tax-rates', name: 'Tax Rates', icon: Tag, description: '13% VAT, 10% Service Charge, 0% Exempt' },
      { id: 'charge-types', name: 'Charge Types', icon: DollarSign, description: 'Room rent, Minibar, Laundry, Airport transfer' },
      { id: 'discount-types', name: 'Discount Types', icon: Tag, description: 'Corporate, Managerial, Seasonal promo' },
      { id: 'expense-categories', name: 'Expense Categories', icon: Layers, description: 'Utilities, Maintenance, Kitchen supplies' },
      { id: 'ledger-groups', name: 'Ledger Groups', icon: FileText, description: 'Assets, Liabilities, Revenue, Expenditure' },
      { id: 'account-types', name: 'Account Types', icon: Building2, description: 'Cash drawer, Bank account, Accounts receivable' },
      { id: 'cost-centers', name: 'Cost Centers', icon: Compass, description: 'Front desk, Restaurant, Spa, Banquet' },
    ],
  },
  {
    id: 'employee-hr',
    code: '08',
    name: 'Employee & HR Masters',
    icon: Users,
    subBoxes: [
      { id: 'departments', name: 'Departments', icon: Building2, description: 'Front Desk, F&B, Housekeeping, Accounts' },
      { id: 'designations', name: 'Designations', icon: ShieldCheck, description: 'General Manager, Duty Manager, Receptionist' },
      { id: 'employment-types', name: 'Employment Types', icon: Tag, description: 'Full-time, Part-time, Seasonal, Trainee' },
      { id: 'employee-categories', name: 'Employee Categories', icon: Users, description: 'Executive, Staff, Contractual' },
      { id: 'shifts', name: 'Shifts', icon: Clock, description: 'Morning (06-14), Evening (14-22), Night (22-06)' },
      { id: 'attendance-statuses', name: 'Attendance Statuses', icon: Check, description: 'Present, Absent, Late, On-Duty' },
      { id: 'leave-types', name: 'Leave Types', icon: Calendar, description: 'Casual, Sick, Annual, Maternity' },
      { id: 'holiday-types', name: 'Holiday Types', icon: Sparkles, description: 'National public holidays, Hotel holidays' },
      { id: 'payroll-components', name: 'Payroll Components', icon: DollarSign, description: 'Basic salary, Allowances, PF deduction' },
      { id: 'salary-grades', name: 'Salary Grades', icon: Layers, description: 'Pay scale grade levels and bands' },
    ],
  },
  {
    id: 'housekeeping-maintenance',
    code: '09',
    name: 'Housekeeping & Maintenance',
    icon: Sparkles,
    subBoxes: [
      { id: 'cleaning-types', name: 'Cleaning Types', icon: Sparkles, description: 'Daily tidy, Deep clean, Check-out clean' },
      { id: 'cleaning-statuses', name: 'Cleaning Statuses', icon: Check, description: 'Pending, In-Progress, Completed' },
      { id: 'linen-types', name: 'Linen Types', icon: Layers, description: 'Bedsheet, Pillowcase, Bath towel, Face towel' },
      { id: 'maintenance-categories', name: 'Maintenance Categories', icon: Wrench, description: 'Plumbing, Electrical, HVAC, Carpentry' },
      { id: 'complaint-types', name: 'Complaint Types', icon: Tag, description: 'AC not cooling, No hot water, TV issue' },
      { id: 'work-order-priorities', name: 'Work Order Priorities', icon: Clock, description: 'Low, Medium, High, Emergency VIP' },
      { id: 'asset-categories', name: 'Asset Categories', icon: Boxes, description: 'Furniture, Electronics, Kitchen machinery' },
      { id: 'lost-found-categories', name: 'Lost & Found Categories', icon: Compass, description: 'Valuables, Documents, Clothing, Electronics' },
    ],
  },
  {
    id: 'customer-loyalty',
    code: '10',
    name: 'Customer & Loyalty Masters',
    icon: HeartHandshake,
    subBoxes: [
      { id: 'guest-categories', name: 'Guest Categories', icon: UserCheck, description: 'Repeat guest, Influencer, Corporate VIP' },
      { id: 'customer-groups', name: 'Customer Groups', icon: Users, description: 'Wedding parties, Conference delegates' },
      { id: 'loyalty-tiers', name: 'Loyalty Tiers', icon: Sparkles, description: 'Silver, Gold, Platinum, Diamond' },
      { id: 'loyalty-points-rules', name: 'Loyalty Points Rules', icon: Tag, description: 'Earn 1 point per $10 spent' },
      { id: 'feedback-categories', name: 'Feedback Categories', icon: HeartHandshake, description: 'Cleanliness, Staff courtesy, Food quality' },
      { id: 'complaint-categories', name: 'Complaint Categories', icon: Bell, description: 'Noise disturbance, Billing discrepancy' },
      { id: 'communication-preferences', name: 'Communication Preferences', icon: Globe, description: 'Email, WhatsApp, SMS, No Marketing' },
    ],
  },
  {
    id: 'workflow-notification',
    code: '11',
    name: 'Workflow & Notification Masters',
    icon: Bell,
    subBoxes: [
      { id: 'approval-types', name: 'Approval Types', icon: Check, description: 'Discount approval, Complimentary room' },
      { id: 'approval-levels', name: 'Approval Levels', icon: Layers, description: 'Supervisor, Duty Manager, General Manager' },
      { id: 'notification-types', name: 'Notification Types', icon: Bell, description: 'Booking confirmation, Check-in alert' },
      { id: 'alert-rules', name: 'Alert Rules', icon: Sparkles, description: 'Low stock warning, High bill alert' },
      { id: 'booking-rules', name: 'Booking Rules', icon: BedDouble, description: 'Min stay over peak dates, deposit rules' },
      { id: 'order-priority-levels', name: 'Order Priority Levels', icon: Clock, description: 'Standard, Rush, VIP' },
      { id: 'reason-codes', name: 'Reason Codes', icon: Tag, description: 'Complimentary, Void item, Room upgrade' },
    ],
  },
  {
    id: 'system-security',
    code: '12',
    name: 'System & Security Masters',
    icon: Lock,
    subBoxes: [
      { id: 'user-roles', name: 'User Roles', icon: ShieldCheck, description: 'Admin, Front Desk Agent, Cashier, HK Supervisor' },
      { id: 'permission-groups', name: 'Permission Groups', icon: Lock, description: 'Billing access, Rate modification, Reports' },
      { id: 'access-policies', name: 'Access Policies', icon: Key, description: 'IP restrictions, 2FA enforcement' },
      { id: 'audit-event-categories', name: 'Audit Event Categories', icon: FileText, description: 'Login, Price override, Bill cancellation' },
      { id: 'document-types', name: 'Document Types', icon: FileText, description: 'Invoice, Folio receipt, Registration card' },
      { id: 'numbering-series', name: 'Numbering Series', icon: Tag, description: 'INV-2026-0001, KOT-0001 numbering patterns' },
      { id: 'fiscal-periods', name: 'Fiscal Periods', icon: Calendar, description: 'Financial year periods and tax quarters' },
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

export default function HotelSetupPage() {
  // Currently selected category (Default: 'general')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('general');

  // Currently selected sub-box (Default: null -> options appear in BOX TYPE below straight line!)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Search filter for options inside the secondary sub-sidebar (Level 2)
  const [searchOptionsQuery, setSearchOptionsQuery] = useState<string>('');

  // Editable master items map
  const [masterItemsMap, setMasterItemsMap] = useState<Record<string, MasterItemEntry[]>>(INITIAL_MASTER_ITEMS);

  // New item form state (Code, Display Name, Order only)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newOrder, setNewOrder] = useState<string>('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddForm) {
        setShowAddForm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm]);

  // Active category
  const activeCategory =
    MASTER_CATEGORIES.find((cat) => cat.id === selectedCategoryId) || MASTER_CATEGORIES[0];

  // Clean title for current category setup (e.g. "General Setup", "Hotel & Property Setup")
  const categoryHeaderTitle = useMemo(() => {
    return activeCategory.name.includes('Masters')
      ? activeCategory.name.replace(/Masters$/, 'Setup').trim()
      : `${activeCategory.name} Setup`;
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
  };

  // Handle clicking a sub-option box below the straight line -> opens Level 2 (sidebar + table)
  const handleSelectSubBox = (subId: string) => {
    setSelectedSubId(subId);
    setShowAddForm(false);
  };

  // Handle clicking the Back button on the secondary sidebar -> returns to Level 1 box grid
  const handleBackToBoxes = () => {
    setSelectedSubId(null);
    setSearchOptionsQuery('');
    setShowAddForm(false);
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

  // Add new item (Code, Display Name, Order only - no description)
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const code = newCode.trim().toUpperCase() || newName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const currentList = masterItemsMap[activeSubBox.id] || currentItems;
    const parsedOrder = parseInt(newOrder, 10);
    const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : currentList.length + 1;

    const newItem: MasterItemEntry = {
      id: `${activeSubBox.id}-${Date.now()}`,
      code: code || 'NEW',
      name: newName.trim(),
      order,
      isActive: true,
    };

    setMasterItemsMap((prev) => ({
      ...prev,
      [activeSubBox.id]: [...(prev[activeSubBox.id] || currentItems), newItem],
    }));

    setNewCode('');
    setNewName('');
    setNewOrder('');
    setShowAddForm(false);
  };

  // Toggle active status
  const handleToggleStatus = (itemId: string) => {
    setMasterItemsMap((prev) => {
      const list = prev[activeSubBox.id] || currentItems;
      return {
        ...prev,
        [activeSubBox.id]: list.map((item) =>
          item.id === itemId ? { ...item, isActive: !item.isActive } : item
        ),
      };
    });
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
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
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
                'rounded-[3px] border shadow-2xs min-h-[66px] sm:min-h-[70px]',
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
                onClick={() => {
                  setNewCode('');
                  setNewName('');
                  setNewOrder(((masterItemsMap[activeSubBox.id] || currentItems).length + 1).toString());
                  setShowAddForm(true);
                }}
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
                        <th className="py-2.5 px-3.5 w-28 text-center">DEFAULT</th>
                        <th className="py-2.5 px-3.5 w-28 text-center">STATUS</th>
                        <th className="py-2.5 px-3.5 w-20 text-right">ACTION</th>
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

                          {/* Default Badge */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            {item.isDefault ? (
                              <span className="inline-block rounded-[2px] bg-[#FFF5F6] border border-[#FAD2D8] px-2 py-0.5 text-[10px] font-bold text-[#A51F36] dark:bg-[#320810] dark:border-rose-800 dark:text-rose-200">
                                Default
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold transition-all',
                                item.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                              )}
                              title="Click to toggle status"
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  item.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
                                )}
                              />
                              {item.isActive !== false ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              title={`Delete ${item.name}`}
                              className="opacity-60 group-hover:opacity-100 p-1 rounded-[2px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-xs text-[#879B90]">
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
          MODAL DIALOG: ADD NEW FORM (OVERLAY MODAL POPUP - NEVER INLINE)
          Fields: CODE, DISPLAY NAME, ORDER only (NO description!)
         ========================================================================= */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="w-full max-w-md rounded-[3px] bg-white dark:bg-[#071F1A] border border-[#DCE3DF] dark:border-[#145447] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5EEE9] dark:border-[#145447] bg-[#FAFBF9] dark:bg-[#061B16]">
              <div>
                <h3 className="text-sm font-bold text-[#24352F] dark:text-white font-heading">
                  Add New {activeSubBox.name.replace(/s$/, '')}
                </h3>
                <p className="text-[11px] text-[#64736C] dark:text-[#A4B8AE]">
                  Enter code, display name and order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-[2px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#0A2E26] dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body - ONLY 3 FIELDS: CODE, DISPLAY NAME, ORDER */}
            <form onSubmit={handleSaveNewItem}>
              <div className="p-5 space-y-3.5">
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
                    placeholder="e.g. MR"
                    autoFocus
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
                  onClick={() => setShowAddForm(false)}
                  className="rounded-[3px] border border-[#DCE3DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64736C] hover:bg-slate-50 dark:border-[#145447] dark:bg-[#07241E] dark:text-[#A4B8AE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="rounded-[3px] bg-[#0B3D32] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#093027] disabled:opacity-40 transition-colors dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

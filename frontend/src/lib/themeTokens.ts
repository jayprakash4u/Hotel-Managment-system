/**
 * Unified Design System & Token Specifications for Hospitality OS
 * Single Source of Truth for:
 * 1. Color tokens
 * 2. Typography scale
 * 3. Spacing scale
 * 4. Border radius scale
 * 5. Shadow scale
 * 6. Animation standards
 * 7. Responsive breakpoints
 */

// 1. COLOR TOKENS
export const BRAND_PALETTE = {
  // Brand Anchors (Pure Blue #1A73E8, Pure Red #DC2626, Pure Yellow #F59E0B)
  primary: '#1A73E8',         // Pure Vibrant Blue (Primary CTAs, Active States, Key Actions)
  primaryHover: '#1557B0',
  primaryActive: '#0D47A1',
  primarySubtle: '#E8F0FE',

  secondary: '#DC2626',       // Pure Signal Red (Destructive, Critical, Danger Alerts)
  secondaryHover: '#B91C1C',
  secondaryActive: '#991B1B',
  secondarySubtle: '#FEF2F2',

  tertiary: '#F59E0B',        // Pure Yellow / Amber (Pending, Hold Room, Warning)
  tertiaryHover: '#D97706',
  tertiaryActive: '#B45309',
  tertiarySubtle: '#FEF3C7',

  // Surfaces & Backgrounds
  pageBackground: '#F8FAFC',  // Enterprise Slate-50 Background
  surface: '#FFFFFF',         // Crisp White Card / Panel Surface
  surfaceMuted: '#F1F5F9',    // Slate-100 (Table headers, secondary panels)
  surfaceHover: '#F8FAFC',    // Slate-50 Row Hover
  surfaceSelected: '#E8F0FE', // Blue Tint Selected State

  // Borders & Dividers
  border: '#E2E8F0',          // Standard Card & Component Border
  borderSubtle: '#E2E8F0',
  divider: '#EDF2F7',         // Content & Section Separators

  // Typography
  heading: '#0F172A',         // Slate-900 Headings
  bodyText: '#334155',        // Slate-700 Body text
  mutedText: '#64748B',       // Slate-500 Metadata & Timestamps
  placeholderText: '#94A3B8', // Slate-400 Input placeholder
  disabledText: '#CBD5E1',    // Disabled content & controls

  // Form Controls
  inputBorder: '#CBD5E1',
  inputBorderHover: '#94A3B8',
  inputBorderFocus: '#1A73E8',
  inputBorderError: '#DC2626',
} as const;

export const SEMANTIC_STATUSES = {
  success: {
    text: '#166534',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    dot: '#16A34A',
    label: 'Success / Completed',
    description: 'Payment received, booking confirmed, order served, check-in complete',
  },
  warning: {
    text: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
    dot: '#D97706',
    label: 'Warning / Pending',
    description: 'Pending approval, low stock, late arrival, payment due',
  },
  error: {
    text: '#991B1B',
    bg: '#FEE2E2',
    border: '#FECACA',
    dot: '#DC2626',
    label: 'Error / Critical',
    description: 'Payment failed, expired item, critical stock shortage',
  },
  info: {
    text: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    dot: '#2563EB',
    label: 'Information',
    description: 'New booking, reservation, informational notification',
  },
  neutral: {
    text: '#475569',
    bg: '#F1F5F9',
    border: '#E2E8F0',
    dot: '#64748B',
    label: 'Neutral / Inactive',
    description: 'Draft, archived, disabled, not started',
  },
  progress: {
    text: '#6D28D9',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    dot: '#7C3AED',
    label: 'In Progress',
    description: 'Order preparation, report processing, stock transfer in progress',
  },
  teal: {
    text: '#0F766E',
    bg: '#CCFBF1',
    border: '#99F6E4',
    dot: '#0D9488',
    label: 'Ready to Serve',
    description: 'Kitchen plating completed, pass ready for floor runner',
  },
} as const;

export const ROOM_STATUS_TOKENS = {
  AVAILABLE: {
    color: 'Green',
    label: 'Available',
    text: '#166534',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    dot: '#16A34A',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40',
    dotClass: 'bg-[#16A34A]',
  },
  INSPECTED: {
    color: 'Green',
    label: 'Inspected',
    text: '#166534',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    dot: '#16A34A',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80] dark:border-[#166534]/40',
    dotClass: 'bg-[#16A34A]',
  },
  OCCUPIED: {
    color: 'Blue',
    label: 'Occupied',
    text: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    dot: '#2563EB',
    classes: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA] dark:border-[#1D4ED8]/40',
    dotClass: 'bg-[#2563EB]',
  },
  RESERVED: {
    color: 'Purple',
    label: 'Reserved',
    text: '#6D28D9',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    dot: '#7C3AED',
    classes: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC] dark:border-[#6D28D9]/40',
    dotClass: 'bg-[#7C3AED]',
  },
  CLEANING: {
    color: 'Amber',
    label: 'Cleaning',
    text: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
    dot: '#D97706',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D] dark:border-[#92400E]/40',
    dotClass: 'bg-[#D97706]',
  },
  DIRTY: {
    color: 'Amber',
    label: 'Cleaning',
    text: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
    dot: '#D97706',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D] dark:border-[#92400E]/40',
    dotClass: 'bg-[#D97706]',
  },
  OUT_OF_ORDER: {
    color: 'Red',
    label: 'Out of order',
    text: '#991B1B',
    bg: '#FEE2E2',
    border: '#FECACA',
    dot: '#DC2626',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171] dark:border-[#991B1B]/40',
    dotClass: 'bg-[#DC2626]',
  },
  MAINTENANCE: {
    color: 'Slate',
    label: 'Maintenance',
    text: '#475569',
    bg: '#F1F5F9',
    border: '#E2E8F0',
    dot: '#64748B',
    classes: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-[#475569]/20 dark:text-[#94A3B8] dark:border-[#475569]/40',
    dotClass: 'bg-[#64748B]',
  },
} as const;

export const ORDER_STATUS_TOKENS = {
  NEW: {
    color: 'Blue',
    label: 'New / Received',
    classes: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA]',
  },
  RECEIVED: {
    color: 'Blue',
    label: 'New / Received',
    classes: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#1D4ED8]/20 dark:text-[#60A5FA]',
  },
  ACCEPTED: {
    color: 'Green',
    label: 'Accepted',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]',
  },
  PREPARING: {
    color: 'Purple',
    label: 'Preparing',
    classes: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE] dark:bg-[#6D28D9]/20 dark:text-[#C084FC]',
  },
  READY: {
    color: 'Teal',
    label: 'Ready to Serve',
    classes: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF]',
  },
  READY_TO_SERVE: {
    color: 'Teal',
    label: 'Ready to Serve',
    classes: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4] dark:bg-[#0F766E]/20 dark:text-[#2DD4BF]',
  },
  SERVED: {
    color: 'Green',
    label: 'Served / Completed',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]',
  },
  COMPLETED: {
    color: 'Green',
    label: 'Completed',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#166534]/20 dark:text-[#4ADE80]',
  },
  CANCELLED: {
    color: 'Red',
    label: 'Cancelled',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171]',
  },
  VOIDED: {
    color: 'Red',
    label: 'Cancelled / Voided',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#991B1B]/20 dark:text-[#F87171]',
  },
  DELAYED: {
    color: 'Amber',
    label: 'Delayed',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#92400E]/20 dark:text-[#FCD34D]',
  },
} as const;

export const FINANCIAL_METRIC_COLORS = {
  roomRevenue: '#0B3D32',
  restaurantRevenue: '#A51F36',
  otherRevenue: '#94B5A7',
  expenses: '#C2414B',
  profit: '#15803D',
  pendingDues: '#D97706',
  previousComparison: '#94A3B8',
  forecast: '#7C6BB1',
} as const;

export const SIDEBAR_NAV_TOKENS = {
  background: '#0B3D32',
  textDefault: '#E5EEE9',
  textHover: '#FFFFFF',
  activeItemBg: '#A51F36',
  activeItemHover: '#8E1B2F',
  mutedIcon: '#B7CDC3',
  activeIcon: '#FFFFFF',
} as const;


// 2. TYPOGRAPHY SCALE
export const TYPOGRAPHY_SCALE = {
  fontFamilies: {
    sans: 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'var(--font-outfit), Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  sizes: {
    'display-2xl': { size: '48px', lineHeight: '1.15', letterSpacing: '-0.02em', weight: '800' },
    'display-xl': { size: '36px', lineHeight: '1.20', letterSpacing: '-0.02em', weight: '700' },
    'heading-1': { size: '30px', lineHeight: '1.25', letterSpacing: '-0.015em', weight: '700' },
    'heading-2': { size: '24px', lineHeight: '1.30', letterSpacing: '-0.01em', weight: '700' },
    'heading-3': { size: '20px', lineHeight: '1.35', letterSpacing: '-0.01em', weight: '600' },
    'heading-4': { size: '16px', lineHeight: '1.40', letterSpacing: '-0.005em', weight: '600' },
    'body-lg': { size: '16px', lineHeight: '1.50', letterSpacing: '0em', weight: '400' },
    'body-md': { size: '14px', lineHeight: '1.50', letterSpacing: '0em', weight: '400' },
    'body-sm': { size: '13px', lineHeight: '1.45', letterSpacing: '0em', weight: '400' },
    'caption': { size: '12px', lineHeight: '1.40', letterSpacing: '0.01em', weight: '500' },
    'micro': { size: '10px', lineHeight: '1.30', letterSpacing: '0.04em', weight: '700' },
  },
} as const;


// 3. SPACING SCALE (Multiples of 4px)
export const SPACING_SCALE = {
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',
  '5': '20px',    // Standard Card Inner Padding (Compact)
  '6': '24px',    // Standard Card Inner Padding (Spacious)
  '8': '32px',    // Section Gap
  '10': '40px',   // Page Content Spacing
  '12': '48px',   // Major Module Spacing
  '16': '64px',
} as const;


// 4. BORDER RADIUS SCALE
// Explicitly matches user's request: Button radius is a clean, professional 8px (rounded-lg)
export const BORDER_RADIUS_SCALE = {
  none: '0px',
  sm: '4px',       // Micro chips, checkboxes
  md: '6px',       // Small action tags
  lg: '8px',       // Standard Button (User Spec), Input, Select, Textarea
  xl: '12px',      // Standard Card, Table container, Dropdown popover
  '2xl': '16px',   // Modal dialogs, Drawers
  full: '9999px',  // Status dots, Badges, Pills
} as const;


// 5. SHADOW SCALE (Soft, subtle enterprise shadows)
export const SHADOW_SCALE = {
  '2xs': '0 1px 2px 0 rgba(11, 61, 50, 0.04)',
  xs: '0 1px 3px 0 rgba(11, 61, 50, 0.05), 0 1px 2px -1px rgba(11, 61, 50, 0.04)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  dropdown: '0 4px 16px -2px rgba(11, 61, 50, 0.08), 0 2px 6px -1px rgba(11, 61, 50, 0.04)',
  modal: '0 20px 25px -5px rgba(11, 61, 50, 0.10), 0 8px 10px -6px rgba(11, 61, 50, 0.06)',
  focus: '0 0 0 3px rgba(11, 61, 50, 0.15)',
  focusDestructive: '0 0 0 3px rgba(165, 31, 54, 0.15)',
} as const;


// 6. ANIMATION STANDARDS
export const ANIMATION_STANDARDS = {
  durations: {
    fast: '150ms',   // Button active, hover, toggle
    normal: '200ms', // Dropdown open, badge state transition
    slow: '300ms',   // Modal slide, drawer reveal
  },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;


// 7. RESPONSIVE BREAKPOINTS
export const RESPONSIVE_BREAKPOINTS = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait / iPad
  lg: '1024px',  // Desktop (Sidebar collapses below this)
  xl: '1280px',  // Standard Enterprise Dashboard (1280px / 7xl container)
  '2xl': '1536px', // Wide display / TV matrix
} as const;

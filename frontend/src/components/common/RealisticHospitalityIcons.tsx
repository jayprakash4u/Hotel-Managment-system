import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Pure Realistic, Fine-Stroke Hospitality Icons (strokeWidth=1.25)
 * Crafted specifically for hotel and restaurant management ERPs.
 */

// 1. Hotel: Front Desk Concierge Service Bell (Dashboard)
export const HotelConciergeBellIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Bell Push Button / Plunger */}
    <path d="M12 3v3" />
    <path d="M10 3h4" />
    {/* Bell Dome */}
    <path d="M4 16h16c-.8-5.2-3.8-9-8-9s-7.2 3.8-8 9z" />
    {/* Pedestal Stand */}
    <path d="M2 19h20" />
    <path d="M6 19v-1.5" />
    <path d="M18 19v-1.5" />
    <path d="M12 16v1.5" />
  </svg>
);

// 2. Hotel: Luxury Suite Double Bed (Room Board)
export const HotelRoomBoardBedIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Headboard */}
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    {/* Two Plush Pillows */}
    <rect x="5" y="8" width="5.5" height="3" rx="1" />
    <rect x="13.5" y="8" width="5.5" height="3" rx="1" />
    {/* Mattress & Folded Duvet Turn-Down */}
    <path d="M3 13.5h18" />
    <path d="M3 13.5c0 2.5 1.8 3.5 4.5 3.5h9c2.7 0 4.5-1 4.5-3.5" />
    {/* Bed Frame & Legs */}
    <path d="M4 17v4" />
    <path d="M20 17v4" />
  </svg>
);

// 3. Hotel: Direct Booking Calendar with Key (Book Now)
export const HotelBookNowIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Calendar Binder Rings */}
    <path d="M8 2v3M16 2v3" />
    {/* Calendar Page */}
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    {/* Booking Plus Badge inside calendar */}
    <path d="M12 12v6M9 15h6" />
    {/* Mini Key Tag */}
    <circle cx="17.5" cy="17.5" r="1.5" />
  </svg>
);

// 4. Hotel: Advance Reservations (Calendar with Verified Checkmark)
export const HotelReservationsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M8 2v3M16 2v3" />
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18" />
    {/* Date grid dots */}
    <circle cx="7.5" cy="13" r=".75" fill="currentColor" />
    <circle cx="11.5" cy="13" r=".75" fill="currentColor" />
    {/* Confirmed checkmark */}
    <path d="M14 14.5l2 2 4-4" />
  </svg>
);

// 5. Hotel: Guest Arrival & Check-In (Luggage Suitcase & Arrival Key)
export const HotelCheckInLuggageIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Telescopic Handle */}
    <path d="M9 7V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
    {/* Suitcase Body */}
    <rect x="5" y="7" width="14" height="13" rx="2" />
    {/* Central Ribs / Zippers */}
    <path d="M5 11.5h14" />
    <path d="M5 15.5h14" />
    {/* Suitcase Grip Handle */}
    <path d="M10.5 7v1h3V7" />
    {/* Wheels */}
    <circle cx="8" cy="21.5" r="1" />
    <circle cx="16" cy="21.5" r="1" />
  </svg>
);

// 6. Hotel: Guest Departure & Check-Out (Keycard Return & Departure Arrow)
export const HotelCheckOutKeyIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Hotel Door / Room Portal */}
    <path d="M11 21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7" />
    <path d="M11 3v18" />
    <circle cx="8" cy="12" r=".75" fill="currentColor" />
    {/* Key / Card Settlement Arrow pointing Outbound */}
    <path d="M15 12h7" />
    <path d="M19 8.5l3.5 3.5-3.5 3.5" />
    {/* Key Tag Ring */}
    <circle cx="15" cy="8" r="2" />
    <path d="M15 10v2" />
  </svg>
);

// 7. Hotel: In-House Guests (Resident Room Guests)
export const HotelInHouseGuestsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Primary Guest Silhouette */}
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    {/* Accompanying Room Guest */}
    <path d="M15 6.5a2.5 2.5 0 0 1 0 5" />
    <path d="M16.5 14.5c2 .5 3.5 2 3.5 4.5" />
    {/* Resident Room Key Tag in Corner */}
    <path d="M18 10h3M19.5 9v2" />
  </svg>
);

// 8. Hotel: VIP Guest Directory & CRM (Guest Passport Profile Card)
export const HotelGuestDirectoryIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Directory Card */}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    {/* Guest Avatar Photo ID */}
    <circle cx="8" cy="10" r="2.5" />
    <path d="M4.5 16.5c0-2 1.5-3 3.5-3s3.5 1 3.5 3" />
    {/* Information Lines */}
    <path d="M13.5 8.5h4.5" />
    <path d="M13.5 11.5h4.5" />
    <path d="M13.5 14.5h3" />
  </svg>
);

// 9. Hotel: Housekeeping (Room Spray Bottle & Clean Sparkles)
export const HotelHousekeepingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Spray Bottle Nozzle */}
    <path d="M7 6h5v2H7z" />
    <path d="M12 6l2.5 1.5-1 1.5H12" />
    <path d="M9 4v2" />
    {/* Spray Trigger */}
    <path d="M11 9c0 1.5-.5 2.5-1.5 3" />
    {/* Bottle Body */}
    <path d="M6 10h4l1 3v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7l1-3z" />
    {/* Sparkles */}
    <path d="M18 4l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z" />
    <path d="M19 14l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4z" />
  </svg>
);

// 10. Hotel: Hotel Setup & Room Configuration (Boutique Hotel Facade)
export const HotelSetupBuildingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Classical Pediment Roof */}
    <path d="M12 2.5L20 6H4l8-3.5z" />
    {/* Main Facade */}
    <rect x="4" y="6" width="16" height="15" rx="1" />
    {/* Grand Entrance */}
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    {/* Guest Windows */}
    <rect x="6.5" y="8.5" width="2.5" height="2.5" rx=".5" />
    <rect x="15" y="8.5" width="2.5" height="2.5" rx=".5" />
    <rect x="6.5" y="13.5" width="2.5" height="2.5" rx=".5" />
    <rect x="15" y="13.5" width="2.5" height="2.5" rx=".5" />
  </svg>
);

// =========================================================================
// RESTAURANT MODULE ICONS
// =========================================================================

// 11. Restaurant: Dashboard (Executive Dining Cloche Platter)
export const RestaurantDashboardIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Serving Platter Base */}
    <path d="M2 19h20" />
    {/* Dome Handle */}
    <path d="M12 4v2" />
    <circle cx="12" cy="4" r="1" />
    {/* Cloche Dome Cover */}
    <path d="M4 16c.5-5.5 4-9.5 8-9.5s7.5 4 8 9.5H4z" />
    {/* Steam / Aroma curls */}
    <path d="M8 19v1.5M16 19v1.5" />
  </svg>
);

// 12. Restaurant: Real Dining Table with Chairs (Table Board)
export const RestaurantDiningTableIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Central Dining Tabletop */}
    <rect x="6" y="9" width="12" height="3" rx="1" />
    {/* Table Legs / Pedestal */}
    <path d="M9 12v7M15 12v7" />
    <path d="M8 19h8" />
    {/* Plate on table */}
    <ellipse cx="12" cy="9" rx="2" ry=".75" />
    {/* Left Dining Chair */}
    <path d="M2 5v7a1 1 0 0 0 1 1h3" />
    <path d="M3 13v7" />
    {/* Right Dining Chair */}
    <path d="M22 5v7a1 1 0 0 1-1 1h-3" />
    <path d="M21 13v7" />
  </svg>
);

// 13. Restaurant: Reserved Dining Table (Table Reservations)
export const RestaurantTableReservationIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Table surface */}
    <path d="M3 15h18" />
    <path d="M6 15v6M18 15v6" />
    {/* 3D Tent Card 'RESERVED' */}
    <path d="M7.5 15l4.5-9 4.5 9z" />
    <path d="M9.5 11.5h5" />
    {/* Dining clock / time reservation badge */}
    <circle cx="19.5" cy="5.5" r="2.5" />
    <path d="M19.5 4.5v1h1" />
  </svg>
);

// 14. Restaurant: Quick Bill / Counter POS Terminal (Quick Bill)
export const RestaurantQuickBillPOSIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* POS Monitor Screen */}
    <rect x="3" y="4" width="13" height="10" rx="1.5" />
    {/* Monitor Stand */}
    <path d="M9.5 14v3" />
    <path d="M6 17h7" />
    {/* Thermal Receipt Paper Printing Out */}
    <path d="M17 5h4v9h-4" />
    <path d="M17 7h4M17 10h3" />
    {/* Cash Register / Keypad Base */}
    <rect x="2" y="18" width="20" height="3" rx=".5" />
    {/* Screen sales line */}
    <path d="M6 8h7M6 11h4" />
  </svg>
);

// 15. Restaurant: Kitchen Display System (Chef Hat / KDS)
export const RestaurantKitchenDisplayIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Headband / Brim */}
    <rect x="5.5" y="16" width="13" height="3.5" rx=".75" />
    {/* Pleated Puffy Chef Hat Toque */}
    <path d="M6 16c-1.8-1.5-1.5-5 1-6.5C6.5 6 9.5 4 12 4s5.5 2 5 5.5c2.5 1.5 2.8 5 1 6.5" />
    {/* Hat Vertical Pleats */}
    <path d="M9.5 9v7M14.5 9v7" />
    {/* Gentle Culinary Steam */}
    <path d="M12 1.5v1.5" />
  </svg>
);

// 16. Restaurant: Kitchen Order Ticket / KOT (Orders)
export const RestaurantOrderTicketIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* KOT Hanging Rail Clip */}
    <path d="M3 4h18" />
    <rect x="9.5" y="2" width="5" height="3" rx=".5" />
    {/* Order Ticket Paper with zig-zag tear bottom */}
    <path d="M5 5h14v14l-2.3-1-2.4 1-2.3-1-2.3 1-2.4-1-2.3 1V5z" />
    {/* Itemized Order Lines */}
    <path d="M8 9h8" />
    <path d="M8 12h8" />
    <path d="M8 15h5" />
  </svg>
);

// 17. Restaurant: Leather-Bound Dining Menu (Menu)
export const RestaurantMenuBookIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Open Book Spread */}
    <path d="M12 6c-3-1.8-6-1.8-8 0v13c2-1.5 5-1.5 8 0 3-1.5 6-1.5 8 0V6c-2-1.8-5-1.8-8 0z" />
    {/* Center Spine */}
    <path d="M12 6v13" />
    {/* Fork on Left Page */}
    <path d="M6.5 9.5v2m1.5-2v2m-1.5-1h1.5m-.75 1v3.5" />
    {/* Knife on Right Page */}
    <path d="M16 9.5v5c.8 0 1.2-1.5 1.2-3V9.5h-1.2z" />
  </svg>
);

// 18. Restaurant: Restaurant Setup & Outlets (Storefront with Awning)
export const RestaurantSetupIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Scalloped Awning Canopy */}
    <path d="M3 8.5L5 4h14l2 4.5" />
    <path d="M3 8.5c0 1.5 1 2 2.25 2s2.25-.5 2.25-2c0 1.5 1 2 2.25 2s2.25-.5 2.25-2c0 1.5 1 2 2.25 2s2.25-.5 2.25-2c0 1.5 1 2 2.25 2s2.25-.5 2.25-2" />
    {/* Dining Storefront Walls & Window */}
    <path d="M4 10.5v9.5h16v-9.5" />
    <rect x="7" y="13" width="4" height="4" rx=".5" />
    {/* Entrance Door */}
    <path d="M14 20v-5h3v5" />
  </svg>
);


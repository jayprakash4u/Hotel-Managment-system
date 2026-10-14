// Granular RBAC Permission System: Module -> Resource -> Action

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'cancel'
  | 'checkin'
  | 'checkout'
  | 'assign'
  | 'update_status'
  | 'resolve'
  | 'refund'
  | 'void'
  | 'receive'
  | 'transfer'
  | 'adjust'
  | 'approve_adjustment'
  | 'manage_vip'
  | 'assign_shift'
  | 'assign_roles'
  | 'export'
  | 'open_shift'
  | 'close_shift'
  | 'tally'
  | 'charge_to_room'
  | 'toggle_availability';

export interface PermissionDefinition {
  module: string;
  moduleLabel: string;
  resource: string;
  resourceLabel: string;
  action: PermissionAction;
  actionLabel: string;
  key: string; // formatted as "module:resource:action" e.g. "hotel:reservations:create"
  description: string;
}

// Complete System Permissions Matrix
export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // 1. Hotel Operations
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'view', actionLabel: 'View Reservations', key: 'hotel:reservations:view', description: 'View booking calendar, reservation lists, and guest folios' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'create', actionLabel: 'Create Reservation', key: 'hotel:reservations:create', description: 'Create new reservations and direct walk-ins' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'update', actionLabel: 'Modify Reservation', key: 'hotel:reservations:update', description: 'Update dates, room assignments, and guest details' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'cancel', actionLabel: 'Cancel Reservation', key: 'hotel:reservations:cancel', description: 'Cancel existing bookings with cancellation policies' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'delete', actionLabel: 'Delete Reservation', key: 'hotel:reservations:delete', description: 'Permanently purge reservation records' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'checkin', actionLabel: 'Perform Check-In', key: 'hotel:reservations:checkin', description: 'Check-in arriving guests and assign room keys' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'reservations', resourceLabel: 'Reservations', action: 'checkout', actionLabel: 'Perform Check-Out', key: 'hotel:reservations:checkout', description: 'Settle bill, complete checkout, and flag room dirty' },

  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'rooms', resourceLabel: 'Rooms & Matrix', action: 'view', actionLabel: 'View Rooms Matrix', key: 'hotel:rooms:view', description: 'View room tape chart, floor matrix, and live room states' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'rooms', resourceLabel: 'Rooms & Matrix', action: 'update_status', actionLabel: 'Update Room Status', key: 'hotel:rooms:update_status', description: 'Change status to Available, Dirty, Inspected, Out of Order' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'rooms', resourceLabel: 'Rooms & Matrix', action: 'assign', actionLabel: 'Assign Room', key: 'hotel:rooms:assign', description: 'Assign rooms to guests or VIP upgrades' },

  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'housekeeping', resourceLabel: 'Housekeeping', action: 'view', actionLabel: 'View Tasks', key: 'hotel:housekeeping:view', description: 'View cleaning schedule and room inspection queues' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'housekeeping', resourceLabel: 'Housekeeping', action: 'assign', actionLabel: 'Assign Housekeeper', key: 'hotel:housekeeping:assign', description: 'Dispatch cleaning tasks to attendants' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'housekeeping', resourceLabel: 'Housekeeping', action: 'update_status', actionLabel: 'Update Clean Status', key: 'hotel:housekeeping:update_status', description: 'Mark cleaning in progress or completed' },

  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'maintenance', resourceLabel: 'Maintenance', action: 'view', actionLabel: 'View Work Orders', key: 'hotel:maintenance:view', description: 'View maintenance tickets and repair logs' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'maintenance', resourceLabel: 'Maintenance', action: 'create', actionLabel: 'Report Issue', key: 'hotel:maintenance:create', description: 'Create repair ticket and place room out of order' },
  { module: 'hotel', moduleLabel: 'Hotel Operations', resource: 'maintenance', resourceLabel: 'Maintenance', action: 'resolve', actionLabel: 'Resolve Ticket', key: 'hotel:maintenance:resolve', description: 'Mark maintenance task resolved and notify housekeeping' },

  // 2. Cafe / Restaurant
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'tables', resourceLabel: 'Tables & Floor', action: 'view', actionLabel: 'View Table Matrix', key: 'restaurant:tables:view', description: 'View dining floor plans and table states' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'tables', resourceLabel: 'Tables & Floor', action: 'assign', actionLabel: 'Seat Table', key: 'restaurant:tables:assign', description: 'Seat guests and mark table occupied' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'pos', resourceLabel: 'POS Terminal', action: 'view', actionLabel: 'Open POS', key: 'restaurant:pos:view', description: 'Access POS terminal for orders and outlet billing' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'pos', resourceLabel: 'POS Terminal', action: 'create', actionLabel: 'Create Order', key: 'restaurant:pos:create', description: 'Punch orders and generate KOTs' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'pos', resourceLabel: 'POS Terminal', action: 'void', actionLabel: 'Void Order Item', key: 'restaurant:pos:void', description: 'Void or cancel ordered items' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'pos', resourceLabel: 'POS Terminal', action: 'charge_to_room', actionLabel: 'Charge to Room Folio', key: 'restaurant:pos:charge_to_room', description: 'Post restaurant bill directly to in-house room folio' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'kot', resourceLabel: 'KOT Kitchen Display', action: 'view', actionLabel: 'View Kitchen Display', key: 'restaurant:kot:view', description: 'View live kitchen order tickets' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'kot', resourceLabel: 'KOT Kitchen Display', action: 'update_status', actionLabel: 'Bump KOT Status', key: 'restaurant:kot:update_status', description: 'Update preparation status (Preparing, Ready, Served)' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'menu', resourceLabel: 'Menu Management', action: 'view', actionLabel: 'View Menu Items', key: 'restaurant:menu:view', description: 'Browse menu catalog and prices' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'menu', resourceLabel: 'Menu Management', action: 'update', actionLabel: 'Edit Menu Pricing', key: 'restaurant:menu:update', description: 'Update dish prices, descriptions, and recipes' },
  { module: 'restaurant', moduleLabel: 'Cafe & Restaurant', resource: 'menu', resourceLabel: 'Menu Management', action: 'toggle_availability', actionLabel: 'Toggle 86 / Sold Out', key: 'restaurant:menu:toggle_availability', description: 'Mark item in stock or 86 out of stock' },

  // 3. Inventory
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'stock', resourceLabel: 'Stock Tracking', action: 'view', actionLabel: 'View Stock Quantities', key: 'inventory:stock:view', description: 'View real-time stock levels, par levels, and alerts' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'stock', resourceLabel: 'Stock Tracking', action: 'receive', actionLabel: 'Receive Inbound Stock', key: 'inventory:stock:receive', description: 'Log incoming stock deliveries' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'stock', resourceLabel: 'Stock Tracking', action: 'transfer', actionLabel: 'Stock Transfer', key: 'inventory:stock:transfer', description: 'Transfer stock between main store and outlets' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'stock', resourceLabel: 'Stock Tracking', action: 'adjust', actionLabel: 'Adjust Stock / Wastage', key: 'inventory:stock:adjust', description: 'Record spoilage, breakage, or inventory variance' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'stock', resourceLabel: 'Stock Tracking', action: 'approve_adjustment', actionLabel: 'Approve Stock Variance', key: 'inventory:stock:approve_adjustment', description: 'Approve large inventory write-offs' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'purchases', resourceLabel: 'Purchase Orders', action: 'view', actionLabel: 'View Purchase Orders', key: 'inventory:purchases:view', description: 'View supplier PO history and pending orders' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'purchases', resourceLabel: 'Purchase Orders', action: 'create', actionLabel: 'Issue Purchase Order', key: 'inventory:purchases:create', description: 'Create and send purchase order to vendors' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'suppliers', resourceLabel: 'Suppliers', action: 'view', actionLabel: 'View Suppliers', key: 'inventory:suppliers:view', description: 'Access supplier vendor directory' },
  { module: 'inventory', moduleLabel: 'Inventory & Stock', resource: 'suppliers', resourceLabel: 'Suppliers', action: 'create', actionLabel: 'Add Supplier', key: 'inventory:suppliers:create', description: 'Register new vendor partner' },

  // 4. Finance
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'folios', resourceLabel: 'Guest Folios', action: 'view', actionLabel: 'View Folios', key: 'finance:folios:view', description: 'Inspect itemized charges, taxes, and service fees' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'folios', resourceLabel: 'Guest Folios', action: 'update', actionLabel: 'Post Charge / Discount', key: 'finance:folios:update', description: 'Add manual charge, laundry, or discount to folio' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'payments', resourceLabel: 'Payments', action: 'view', actionLabel: 'View Payments Log', key: 'finance:payments:view', description: 'Audit payments received across all terminals' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'payments', resourceLabel: 'Payments', action: 'create', actionLabel: 'Collect Payment', key: 'finance:payments:create', description: 'Record cash, credit card, or bank transfer receipts' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'payments', resourceLabel: 'Payments', action: 'refund', actionLabel: 'Issue Refund', key: 'finance:payments:refund', description: 'Process guest refund or security deposit returns' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'payments', resourceLabel: 'Payments', action: 'void', actionLabel: 'Void Transaction', key: 'finance:payments:void', description: 'Void erroneous payment transaction' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'cash_register', resourceLabel: 'Cash Register & Shifts', action: 'view', actionLabel: 'View Cash Register', key: 'finance:cash_register:view', description: 'View shift cash float and drawer totals' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'cash_register', resourceLabel: 'Cash Register & Shifts', action: 'open_shift', actionLabel: 'Open Shift Float', key: 'finance:cash_register:open_shift', description: 'Start shift and input opening cash float' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'cash_register', resourceLabel: 'Cash Register & Shifts', action: 'close_shift', actionLabel: 'Close Shift & Tally', key: 'finance:cash_register:close_shift', description: 'Reconcile drawer cash and perform shift handover' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'expenses', resourceLabel: 'Operating Expenses', action: 'view', actionLabel: 'View Expenses', key: 'finance:expenses:view', description: 'View petty cash and vendor expense ledger' },
  { module: 'finance', moduleLabel: 'Finance & Cashier', resource: 'expenses', resourceLabel: 'Operating Expenses', action: 'create', actionLabel: 'Record Expense', key: 'finance:expenses:create', description: 'Log operational expense voucher' },

  // 5. People & CRM
  { module: 'people', moduleLabel: 'People & CRM', resource: 'guests', resourceLabel: 'Guests CRM', action: 'view', actionLabel: 'View Guests', key: 'people:guests:view', description: 'Search guest stay records and preferences' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'guests', resourceLabel: 'Guests CRM', action: 'create', actionLabel: 'Register Guest', key: 'people:guests:create', description: 'Add new guest profile' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'guests', resourceLabel: 'Guests CRM', action: 'manage_vip', actionLabel: 'Modify VIP Tier', key: 'people:guests:manage_vip', description: 'Upgrade guest to Silver, Gold, Platinum, Diamond VIP' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'staff', resourceLabel: 'Staff Directory', action: 'view', actionLabel: 'View Staff', key: 'people:staff:view', description: 'View employee roster and contact directory' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'staff', resourceLabel: 'Staff Directory', action: 'assign_shift', actionLabel: 'Assign Shift Schedule', key: 'people:staff:assign_shift', description: 'Set work shifts and duty rosters' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'users', resourceLabel: 'Users & Roles', action: 'view', actionLabel: 'View System Roles', key: 'people:users:view', description: 'Audit system users and role permissions' },
  { module: 'people', moduleLabel: 'People & CRM', resource: 'users', resourceLabel: 'Users & Roles', action: 'assign_roles', actionLabel: 'Grant RBAC Permissions', key: 'people:users:assign_roles', description: 'Assign or revoke granular permissions' },

  // 6. Reports & Analytics
  { module: 'reports', moduleLabel: 'Reports & Analytics', resource: 'occupancy', resourceLabel: 'Occupancy & RevPAR', action: 'view', actionLabel: 'View Occupancy Reports', key: 'reports:occupancy:view', description: 'Analyze ADR, RevPAR, and occupancy velocity' },
  { module: 'reports', moduleLabel: 'Reports & Analytics', resource: 'occupancy', resourceLabel: 'Occupancy & RevPAR', action: 'export', actionLabel: 'Export Occupancy Data', key: 'reports:occupancy:export', description: 'Export CSV / PDF reports' },
  { module: 'reports', moduleLabel: 'Reports & Analytics', resource: 'fnb_sales', resourceLabel: 'F&B Sales Reports', action: 'view', actionLabel: 'View Dining Analytics', key: 'reports:fnb_sales:view', description: 'Analyze restaurant, bar, and spa revenue' },
  { module: 'reports', moduleLabel: 'Reports & Analytics', resource: 'pnl', resourceLabel: 'P&L Financial Reports', action: 'view', actionLabel: 'View Profit & Loss', key: 'reports:pnl:view', description: 'View income vs expense profitability' },

  // 7. Settings
  { module: 'settings', moduleLabel: 'System Settings', resource: 'property', resourceLabel: 'Property Config', action: 'view', actionLabel: 'View Settings', key: 'settings:property:view', description: 'View hotel configuration' },
  { module: 'settings', moduleLabel: 'System Settings', resource: 'property', resourceLabel: 'Property Config', action: 'update', actionLabel: 'Modify Settings', key: 'settings:property:update', description: 'Update hotel tax rates, currencies, and policies' },
];

// Pre-configured Role Mappings
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'], // Wildcard: Super Admin has full access to everything

  FRONT_DESK: [
    'hotel:reservations:view',
    'hotel:reservations:create',
    'hotel:reservations:update',
    'hotel:reservations:cancel',
    'hotel:reservations:checkin',
    'hotel:reservations:checkout',
    'hotel:rooms:view',
    'hotel:rooms:update_status',
    'hotel:rooms:assign',
    'hotel:housekeeping:view',
    'hotel:maintenance:view',
    'hotel:maintenance:create',
    'restaurant:tables:view',
    'restaurant:pos:view',
    'restaurant:pos:charge_to_room',
    'finance:folios:view',
    'finance:folios:update',
    'finance:payments:view',
    'finance:payments:create',
    'finance:cash_register:view',
    'finance:cash_register:open_shift',
    'finance:cash_register:close_shift',
    'people:guests:view',
    'people:guests:create',
    'people:guests:manage_vip',
    'people:staff:view',
    'reports:occupancy:view',
  ],

  HOUSEKEEPING: [
    'hotel:rooms:view',
    'hotel:rooms:update_status',
    'hotel:housekeeping:view',
    'hotel:housekeeping:update_status',
    'hotel:maintenance:view',
    'hotel:maintenance:create',
    'inventory:stock:view',
    'inventory:stock:adjust',
    'people:staff:view',
  ],

  POS_CASHIER: [
    'restaurant:tables:view',
    'restaurant:tables:assign',
    'restaurant:pos:view',
    'restaurant:pos:create',
    'restaurant:pos:void',
    'restaurant:pos:charge_to_room',
    'restaurant:kot:view',
    'restaurant:menu:view',
    'restaurant:menu:toggle_availability',
    'finance:payments:create',
    'finance:cash_register:view',
    'finance:cash_register:open_shift',
    'finance:cash_register:close_shift',
    'inventory:stock:view',
    'people:guests:view',
  ],

  CHEF: [
    'restaurant:kot:view',
    'restaurant:kot:update_status',
    'restaurant:menu:view',
    'restaurant:menu:toggle_availability',
    'inventory:stock:view',
    'inventory:stock:adjust',
    'people:staff:view',
  ],

  FINANCE_OFFICER: [
    'finance:folios:view',
    'finance:folios:update',
    'finance:payments:view',
    'finance:payments:create',
    'finance:payments:refund',
    'finance:payments:void',
    'finance:cash_register:view',
    'finance:expenses:view',
    'finance:expenses:create',
    'inventory:purchases:view',
    'hotel:reservations:view',
    'people:guests:view',
    'reports:occupancy:view',
    'reports:fnb_sales:view',
    'reports:pnl:view',
    'reports:occupancy:export',
  ],

  GUEST: [
    'restaurant:menu:view',
    'hotel:rooms:view',
  ],
};

// Check if a role possesses a specific permission
export function checkPermission(userRole: string, permissionKey: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  if (rolePerms.includes('*')) return true;

  // Exact match
  if (rolePerms.includes(permissionKey)) return true;

  // Wildcard match on module or resource: e.g. "hotel:reservations:*" or "hotel:*"
  const [targetModule, targetResource, targetAction] = permissionKey.split(':');
  if (rolePerms.includes(`${targetModule}:*`)) return true;
  if (rolePerms.includes(`${targetModule}:${targetResource}:*`)) return true;

  return false;
}

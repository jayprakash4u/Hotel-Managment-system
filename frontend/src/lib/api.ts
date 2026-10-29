import { RoomWithDetails, ReservationData, GuestData, HousekeepingTaskData, MaintenanceTicketData, POSProductData, InventoryItemData, DashboardMetrics, TableReservationData, QuickSalePayload, QuickSaleReceipt, DailySalesSummaryData } from './types';

// Generic API caller with error handling
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  // Auth (Hotel Admin)
  login: (username: string, password: string) => {
    return fetcher<{ username: string; name: string; hotelName: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: () => {
    return fetcher<any>('/api/auth/logout', { method: 'POST' });
  },

  getMe: () => {
    return fetcher<{ username: string; name: string; hotelId: string; hotelName: string }>('/api/auth/me');
  },

  // Hotel Profile & Setup
  getHotelProfile: () => {
    return fetcher<any>('/api/hotel');
  },

  updateHotelProfile: (data: any) => {
    return fetcher<any>('/api/hotel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Room Types
  getRoomTypes: () => {
    return fetcher<any[]>('/api/room-types');
  },

  createRoomType: (data: any) => {
    return fetcher<any>('/api/room-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Rooms
  getRooms: (params?: { floor?: string; status?: string; type?: string; setupStatus?: string; acFilter?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<RoomWithDetails[]>(`/api/rooms?${query}`);
  },

  createRoom: (data: any) => {
    return fetcher<RoomWithDetails>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  batchCreateRooms: (data: any) => {
    return fetcher<{ message: string; count: number; data: RoomWithDetails[] }>('/api/rooms/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRoomStatus: (id: string, data: { status: string; setupStatus?: string; notes?: string; assignedTo?: string; taskType?: string; priority?: string }) => {
    return fetcher<any>(`/api/rooms/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Reservations
  getReservations: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<ReservationData[]>(`/api/reservations?${query}`);
  },

  getReservation: (id: string) => {
    return fetcher<ReservationData>(`/api/reservations/${id}`);
  },

  createReservation: (data: any) => {
    return fetcher<ReservationData>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  checkInGuest: (id: string) => {
    return fetcher<ReservationData>(`/api/reservations/${id}/checkin`, {
      method: 'POST',
    });
  },

  checkOutGuest: (id: string, data?: { finalPaymentAmount?: number; housekeepingNotes?: string }) => {
    return fetcher<ReservationData>(`/api/reservations/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Guests
  getGuests: (params?: { search?: string; vipTier?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<GuestData[]>(`/api/guests?${query}`);
  },

  createGuest: (data: Partial<GuestData>) => {
    return fetcher<GuestData>('/api/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Folio
  addFolioItem: (data: { reservationId: string; outlet: string; description: string; unitPrice: number; quantity?: number; billedBy?: string }) => {
    return fetcher<any>('/api/folio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteFolioItem: (id: string) => {
    return fetcher<any>(`/api/folio?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Housekeeping
  getHousekeepingTasks: (params?: { status?: string; priority?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<HousekeepingTaskData[]>(`/api/housekeeping?${query}`);
  },

  createHousekeepingTask: (data: any) => {
    return fetcher<HousekeepingTaskData>('/api/housekeeping', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateHousekeepingTask: (data: { id: string; status?: string; notes?: string; assignedTo?: string }) => {
    return fetcher<HousekeepingTaskData>('/api/housekeeping', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Maintenance
  getMaintenanceTickets: (params?: { status?: string; category?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<MaintenanceTicketData[]>(`/api/maintenance?${query}`);
  },

  createMaintenanceTicket: (data: any) => {
    return fetcher<MaintenanceTicketData>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMaintenanceTicket: (data: { id: string; status?: string; assignedTo?: string; description?: string }) => {
    return fetcher<MaintenanceTicketData>('/api/maintenance', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // POS
  getPOSProducts: (params?: { outlet?: string; category?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<POSProductData[]>(`/api/pos?${query}`);
  },

  createPOSProduct: (data: {
    hotelId?: string;
    outlet?: string;
    category: string;
    name: string;
    description?: string;
    price: number;
    trackStock: boolean;
    stock?: number;
    isAvailable?: boolean;
    imageUrl?: string;
  }) => {
    return fetcher<POSProductData>('/api/pos/product', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePOSProduct: (
    id: string,
    data: {
      outlet?: string;
      category?: string;
      name?: string;
      description?: string;
      price?: number;
      trackStock?: boolean;
      stock?: number;
      isAvailable?: boolean;
      imageUrl?: string;
    }
  ) => {
    return fetcher<POSProductData>(`/api/pos/product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePOSProduct: (id: string) => {
    return fetcher<{ id: string; name: string }>(`/api/pos/product/${id}`, {
      method: 'DELETE',
    });
  },

  createPOSOrder: (data: any) => {
    return fetcher<any>('/api/pos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancelOrder: (id: string) => {
    return fetcher<any>(`/api/pos/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  // Restaurant & Dine-In Tables
  getTables: (params?: { date?: string }) => {
    const query = params?.date ? `?date=${encodeURIComponent(params.date)}` : '';
    return fetcher<any[]>(`/api/restaurant/tables${query}`);
  },

  getRestaurantTables: (params?: { date?: string }) => {
    const query = params?.date ? `?date=${encodeURIComponent(params.date)}` : '';
    return fetcher<any[]>(`/api/restaurant/tables${query}`);
  },

  createTable: (data: any) => {
    return fetcher<any>('/api/restaurant/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  releaseTable: (id: string) => {
    return fetcher<any>(`/api/restaurant/tables/${id}/release`, {
      method: 'POST',
    });
  },

  updateTableStatus: (id: string, data: { status?: string; cleaningStatus?: string; maintenanceNotes?: string }) => {
    return fetcher<any>(`/api/restaurant/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  markTableServed: (id: string) => {
    return fetcher<any>(`/api/restaurant/tables/${id}/mark-served`, {
      method: 'POST',
    });
  },

  getTableOrderHistory: (id: string) => {
    return fetcher<any[]>(`/api/restaurant/tables/${id}/history`);
  },

  getRestaurantOrders: (params?: { outlet?: string; status?: string; tableId?: string; orderType?: string; activeOnly?: boolean; search?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<any[]>(`/api/restaurant/orders?${query}`);
  },

  getRestaurantOrderById: (id: string) => {
    return fetcher<any>(`/api/restaurant/orders/${encodeURIComponent(id)}`);
  },

  assignTableToOrder: (orderId: string, tableId: string) => {
    return fetcher<any>(`/api/restaurant/orders/${encodeURIComponent(orderId)}/assign-table`, {
      method: 'POST',
      body: JSON.stringify({ tableId }),
    });
  },

  getActiveTableOrder: (tableId: string) => {
    return fetcher<any>(`/api/restaurant/tables/${tableId}/active-order`);
  },

  createRestaurantOrder: (data: any) => {
    return fetcher<any>('/api/restaurant/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addItemsToRestaurantOrder: (orderId: string, data: { items: any[]; notes?: string }) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRestaurantOrderItems: (orderId: string, data: { items: any[]; notes?: string }) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/items`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteRestaurantOrderItem: (orderId: string, itemId: string) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  updateRestaurantOrderStatus: (id: string, data: { status: string; notes?: string }) => {
    return fetcher<any>(`/api/restaurant/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  generateRestaurantBill: (orderId: string, data?: { discountPercent?: number; discountAmount?: number; roundOff?: number; remarks?: string }) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/generate-bill`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  settleRestaurantOrder: (orderId: string, data: {
    paymentMethod: string;
    roomNumber?: string;
    roomId?: string;
    reservationId?: string;
    serverName?: string;
    paidAmount?: number;
    discountPercent?: number;
    discountAmount?: number;
    roundOff?: number;
    remarks?: string;
  }) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/settle`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyRoomStay: (roomNumber: string) => {
    return fetcher<any>(`/api/restaurant/verify-room/${encodeURIComponent(roomNumber)}`);
  },

  // Quick Sale / Counter Sale
  quickSale: (data: QuickSalePayload) => {
    return fetcher<{ order: any; receipt: QuickSaleReceipt; message: string }>('/api/restaurant/quick-sale', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDailySales: (date?: string) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return fetcher<DailySalesSummaryData>(`/api/restaurant/daily-sales${query}`);
  },

  // Table Reservations (Workflow & Availability)
  getTableReservations: (params?: { date?: string; status?: string; tableId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<TableReservationData[]>(`/api/restaurant/reservations?${query}`);
  },

  getTableReservation: (id: string) => {
    return fetcher<TableReservationData>(`/api/restaurant/reservations/${id}`);
  },

  checkTableAvailability: (params: {
    date?: string;
    time?: string;
    endTime?: string;
    partySize?: number;
    durationMinutes?: number;
    bufferMinutes?: number;
    excludeReservationId?: string;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<{
      requestedDate: string;
      requestedTime: string;
      requestedEndTime?: string;
      partySize: number;
      durationMinutes: number;
      bufferMinutes?: number;
      availableCount: number;
      totalTables: number;
      availableTables: Array<{ id: string; tableNumber: string; section: string; capacity: number; isAvailable: boolean }>;
      allTables: Array<{
        id: string;
        tableNumber: string;
        section: string;
        capacity: number;
        isAvailable: boolean;
        conflictReason?: string;
        conflictingReservation?: {
          id?: string;
          reservationCode?: string;
          startTime?: string;
          endTime?: string;
          reservationTime?: string;
          durationMinutes?: number;
          bufferMinutes?: number;
        };
      }>;
    }>(`/api/restaurant/reservations/available-tables?${query}`);
  },

  createTableReservation: (data: {
    customerName: string;
    phoneNumber: string;
    reservationDate: string;
    reservationTime: string;
    endTime?: string;
    partySize?: number;
    durationMinutes?: number;
    bufferMinutes?: number;
    tableId?: string;
    specialRequests?: string;
    internalNotes?: string;
    status?: string;
  }) => {
    return fetcher<TableReservationData>('/api/restaurant/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTableReservation: (id: string, data: any) => {
    return fetcher<TableReservationData>(`/api/restaurant/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateTableReservationStatus: (id: string, status: string, notes?: string) => {
    return fetcher<TableReservationData>(`/api/restaurant/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  seatTableReservation: (id: string, data?: { tableId?: string; serverName?: string }) => {
    return fetcher<{
      reservation: TableReservationData;
      table: any;
      order: any;
      message: string;
    }>(`/api/restaurant/reservations/${id}/seat`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Restaurant Settings & Walk-In Assignment
  getRestaurantSettings: () => {
    return fetcher<{
      estimatedDiningMinutes: number;
      cleaningBufferMinutes: number;
      advanceAlertMinutes: number;
    }>('/api/restaurant/settings');
  },

  updateRestaurantSettings: (data: {
    estimatedDiningMinutes: number;
    cleaningBufferMinutes: number;
    advanceAlertMinutes?: number;
  }) => {
    return fetcher<{
      estimatedDiningMinutes: number;
      cleaningBufferMinutes: number;
      advanceAlertMinutes: number;
    }>('/api/restaurant/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  checkWalkInAvailability: (tableId: string, params?: {
    estimatedDiningMinutes?: number;
    cleaningBufferMinutes?: number;
    simulatedTime?: string;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<{
      isAllowed: boolean;
      warning?: string;
      nextReservation?: any;
      estimatedMinutes: number;
      bufferMinutes: number;
      tableStatus: string;
      cleaningStatus: string;
    }>(`/api/restaurant/tables/${tableId}/walkin-check?${query}`);
  },

  seatWalkInCustomer: (tableId: string, data?: {
    customerName?: string;
    guestCount?: number;
    serverName?: string;
    notes?: string;
    estimatedDiningMinutes?: number;
    cleaningBufferMinutes?: number;
    simulatedTime?: string;
  }) => {
    return fetcher<{
      success: boolean;
      message: string;
      table: any;
      order: any;
    }>(`/api/restaurant/tables/${tableId}/seat-walkin`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // Inventory
  getInventory: (params?: { category?: string; department?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<InventoryItemData[]>(`/api/inventory?${query}`);
  },

  updateInventoryStock: (id: string, data: { quantityToAdd?: number; newStock?: number }) => {
    return fetcher<InventoryItemData>('/api/inventory', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    });
  },

  addStock: (data: {
    itemId: string;
    quantityAdded: number;
    unit: string;
    totalCost: number;
    supplierId?: string;
    purchaseDate: string;
    invoiceNumber?: string;
    performedBy?: string;
    idempotencyKey?: string;
  }) => {
    return fetcher<{
      item: any;
      purchase: any;
      movement: any;
    }>('/api/inventory/add-stock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Analytics
  getAnalytics: () => {
    return fetcher<DashboardMetrics>('/api/analytics');
  },

  // Billing & Invoicing (Unified Shared System)
  getBills: (params?: {
    search?: string;
    billingType?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.billingType) query.append('billingType', params.billingType);
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetcher<import('./types').GetBillsResponse>(`/api/billing/bills?${query.toString()}`);
  },

  getBillById: (id: string) => {
    return fetcher<{ bill: import('./types').BillData; hotel: any }>(`/api/billing/bills/${id}`);
  },

  recordBillPayment: (
    id: string,
    data: {
      amount: number;
      paymentMethod: string;
      transactionRef?: string;
      receivedBy?: string;
      notes?: string;
      idempotencyKey?: string;
    }
  ) => {
    return fetcher<import('./types').BillData>(`/api/billing/bills/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  voidBill: (id: string, data: { reason: string; authorizedBy?: string }) => {
    return fetcher<import('./types').BillData>(`/api/billing/bills/${id}/void`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reservation Alerts (15-Minute Advance Preparation & Overdue Warnings)
  getReservationAlerts: (params?: { activeOnly?: boolean; status?: string; tableId?: string; role?: string }) => {
    const query = new URLSearchParams();
    if (params?.activeOnly !== undefined) query.append('activeOnly', params.activeOnly.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.tableId) query.append('tableId', params.tableId);
    if (params?.role) query.append('role', params.role);
    return fetcher<import('./types').ReservationAlertData[]>(`/api/restaurant/alerts?${query.toString()}`);
  },

  acknowledgeReservationAlert: (id: string, staffName?: string, notes?: string) => {
    return fetcher<any>(`/api/restaurant/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ staffName, notes }),
    });
  },

  dismissReservationAlert: (id: string) => {
    return fetcher<any>(`/api/restaurant/alerts/${id}/dismiss`, {
      method: 'PATCH',
    });
  },

  // Seed / Reset
  seedDatabase: () => {
    return fetcher<any>('/api/seed', { method: 'POST' });
  },
};


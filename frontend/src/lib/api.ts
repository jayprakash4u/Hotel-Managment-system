import { RoomWithDetails, ReservationData, GuestData, HousekeepingTaskData, MaintenanceTicketData, POSProductData, InventoryItemData, DashboardMetrics, TableReservationData, QuickSalePayload, QuickSaleReceipt, DailySalesSummaryData } from './types';

// Generic API caller with error handling and timeout protection
async function fetcher<T>(url: string, options?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const timeoutMs = options?.timeoutMs ?? 2500;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error || `Request failed with status ${res.status}`);
    }
    return json.data as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timeout (${timeoutMs}ms) connecting to backend API`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth (Hotel Admin)
  login: (username: string, password: string) => {
    return fetcher<{ username: string; name: string; hotelName: string; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (res.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_token', res.token);
      }
      return res;
    });
  },

  logout: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
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

  updateRoom: (id: string, data: any) => {
    return fetcher<RoomWithDetails>(`/api/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteRoom: (id: string) => {
    return fetcher<{ id: string }>(`/api/rooms/${id}`, {
      method: 'DELETE',
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
    variants?: Array<{ unit: string; price: number }>;
    variantsJson?: string;
    department?: 'KOT' | 'BOT';
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
      department?: 'KOT' | 'BOT';
      isAvailable?: boolean;
      imageUrl?: string;
      variants?: Array<{ unit: string; price: number }>;
      variantsJson?: string;
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

  createTable: (data: { tableNumber: string; capacity?: number; section?: string; categoryId?: string; status?: string; cleaningStatus?: string; maintenanceNotes?: string; [key: string]: any }) => {
    return fetcher<any>('/api/restaurant/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTable: (id: string, data: { tableNumber?: string; capacity?: number; section?: string; categoryId?: string; status?: string; cleaningStatus?: string; maintenanceNotes?: string; [key: string]: any }) => {
    return fetcher<any>(`/api/restaurant/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTable: (id: string) => {
    return fetcher<any>(`/api/restaurant/tables/${id}`, {
      method: 'DELETE',
    });
  },

  bulkCreateTables: (data: { prefix?: string; startNumber?: number; count: number; capacity?: number; categoryId?: string; section?: string }) => {
    return fetcher<any[]>('/api/restaurant/tables/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTableCategories: () => {
    return fetcher<any[]>('/api/restaurant/table-categories');
  },

  createTableCategory: (data: { name: string; description?: string; floor?: string; displayOrder?: number }) => {
    return fetcher<any>('/api/restaurant/table-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTableCategory: (id: string, data: { name?: string; description?: string; floor?: string; displayOrder?: number; isActive?: boolean }) => {
    return fetcher<any>(`/api/restaurant/table-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTableCategory: (id: string) => {
    return fetcher<any>(`/api/restaurant/table-categories/${id}`, {
      method: 'DELETE',
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

  dispatchRestaurantOrderKot: (orderId: string) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/dispatch-kot`, {
      method: 'POST',
    });
  },

  dispatchRestaurantOrderBot: (orderId: string) => {
    return fetcher<any>(`/api/restaurant/orders/${orderId}/dispatch-bot`, {
      method: 'POST',
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

  getRestaurantOpenOrders: () => {
    return fetcher<any[]>('/api/restaurant/open-orders');
  },

  settleRestaurantOrder: (orderId: string, data: {
    paymentMethod?: string;
    roomNumber?: string;
    roomId?: string;
    reservationId?: string;
    serverName?: string;
    paidAmount?: number;
    discountPercent?: number;
    discountAmount?: number;
    roundOff?: number;
    remarks?: string;
    notes?: string;
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

  // ---------------------------------------------------------------------------
  // Restaurant Packing Management
  // ---------------------------------------------------------------------------
  getPackingMaterials: (params?: { status?: string; search?: string; lowStockOnly?: boolean }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<any[]>(`/api/restaurant/packing/materials?${query}`);
  },

  createPackingMaterial: (data: {
    name: string;
    unit: string;
    purchaseCost: number;
    packingCharge: number;
    availableStock: number;
    minStockThreshold?: number;
    status?: string;
  }) => {
    return fetcher<any>('/api/restaurant/packing/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePackingMaterial: (id: string, data: any) => {
    return fetcher<any>(`/api/restaurant/packing/materials/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePackingMaterial: (id: string) => {
    return fetcher<any>(`/api/restaurant/packing/materials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  adjustPackingMaterialStock: (id: string, data: { quantity: number; notes?: string; type?: string }) => {
    return fetcher<any>(`/api/restaurant/packing/materials/${encodeURIComponent(id)}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPackingDashboard: (params?: { status?: string; orderType?: string; search?: string; date?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<{
      orders: any[];
      counts: { all: number; pending: number; inProgress: number; completed: number };
    }>(`/api/restaurant/packing/dashboard?${query}`);
  },

  updateOrderPackingStatus: (orderId: string, data: { status: string; staffName?: string }) => {
    return fetcher<any>(`/api/restaurant/packing/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adjustOrderPackingMaterials: (orderId: string, data: { materials: any[] }) => {
    return fetcher<any>(`/api/restaurant/packing/orders/${encodeURIComponent(orderId)}/adjust-materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeOrderPacking: (orderId: string, data?: { staffName?: string; modifiedMaterials?: any[] }) => {
    return fetcher<any>(`/api/restaurant/packing/orders/${encodeURIComponent(orderId)}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  getMenuPackingConfig: (params?: { search?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<any[]>(`/api/restaurant/packing/menu-config?${query}`);
  },

  updateMenuPackingConfig: (productId: string, data: { materials: any[] }) => {
    return fetcher<any>(`/api/restaurant/packing/menu-config/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  calculatePacking: (items: { productId: string; quantity: number }[]) => {
    return fetcher<{
      materials: any[];
      totalPackingCharge: number;
      totalMaterialCost: number;
      totalItemsCount: number;
    }>('/api/restaurant/packing/calculate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  getPackingReportsSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<any>(`/api/restaurant/packing/reports/summary?${query}`);
  },

  getPackingConsumptionReport: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetcher<any>(`/api/restaurant/packing/reports/consumption?${query}`);
  },

  getPackingStockReport: () => {
    return fetcher<any[]>('/api/restaurant/packing/reports/stock');
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

  // Supplier Management
  getSuppliers: (params?: { activeOnly?: boolean; search?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.activeOnly !== undefined) query.append("activeOnly", params.activeOnly.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    return fetcher<import("./types").SupplierRecord[]>(`/api/suppliers?${query.toString()}`);
  },

  getSupplierById: (id: string) => {
    return fetcher<import("./types").SupplierRecord>(`/api/suppliers/${id}`);
  },

  createSupplier: (data: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    panVatNumber?: string;
    category?: string;
    notes?: string;
    isActive?: boolean;
  }) => {
    return fetcher<import("./types").SupplierRecord>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSupplier: (id: string, data: Partial<import("./types").SupplierRecord>) => {
    return fetcher<import("./types").SupplierRecord>(`/api/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  toggleSupplierStatus: (id: string) => {
    return fetcher<import("./types").SupplierRecord>(`/api/suppliers/${id}/toggle-status`, {
      method: "PATCH",
    });
  },

  deleteSupplier: (id: string) => {
    return fetcher<any>(`/api/suppliers/${id}`, {
      method: "DELETE",
    });
  },

  // Unified Purchase Management
  getPurchases: (params?: {
    search?: string;
    purchaseType?: string;
    supplierId?: string;
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.purchaseType) query.append("purchaseType", params.purchaseType);
    if (params?.supplierId) query.append("supplierId", params.supplierId);
    if (params?.paymentStatus) query.append("paymentStatus", params.paymentStatus);
    if (params?.fromDate) query.append("fromDate", params.fromDate);
    if (params?.toDate) query.append("toDate", params.toDate);
    return fetcher<import("./types").PurchaseRecord[]>(`/api/inventory/purchases?${query.toString()}`);
  },

  createPurchaseRecord: (data: {
    purchaseType?: string;
    purchaseDate?: string;
    supplierId?: string | null;
    supplierInvoiceNumber?: string | null;
    supplierPanVatNumber?: string | null;
    items: Array<{
      itemId?: string;
      itemName: string;
      category?: string;
      department?: string;
      quantity: number;
      purchaseUnit?: string;
      stockUnit?: string;
      conversionFactor?: number;
      unitCost: number;
      totalCost: number;
      trackStock?: boolean;
    }>;
    subtotal: number;
    discount?: number;
    tax?: number;
    additionalCharges?: number;
    grandTotal: number;
    paymentMethod?: string;
    paymentStatus?: string;
    notes?: string;
    attachmentUrl?: string;
    createdBy?: string;
    idempotencyKey?: string;
  }) => {
    return fetcher<import("./types").PurchaseRecord>("/api/inventory/purchases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Analytics
  // Item-wise Purchase History & Ledger
  getItemPurchases: (itemId: string) => {
    return fetcher<{
      summary: import('./types').ItemPurchaseLedgerSummary;
      transactions: import('./types').ItemPurchaseLedgerTransaction[];
    }>(`/api/inventory/items/${itemId}/purchases`);
  },

  getPurchasesLedger: (params?: {
    itemId?: string;
    search?: string;
    supplierId?: string;
    paymentStatus?: string;
    purchaseType?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.itemId) query.append('itemId', params.itemId);
    if (params?.search) query.append('search', params.search);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params?.purchaseType) query.append('purchaseType', params.purchaseType);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    return fetcher<import('./types').ItemPurchaseLedgerTransaction[]>(`/api/inventory/purchases/ledger?${query.toString()}`);
  },

  // Stock Movement Ledger
  getStockMovements: (params?: {
    department?: string;
    itemId?: string;
    movementType?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department);
    if (params?.itemId) query.append('itemId', params.itemId);
    if (params?.movementType) query.append('movementType', params.movementType);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.search) query.append('search', params.search);
    return fetcher<import('./types').StockMovementLedgerRecord[]>(`/api/inventory/movements?${query.toString()}`);
  },

  // Stock Adjustment
  recordStockAdjustment: (data: {
    itemId: string;
    adjustmentType: string;
    quantity: number;
    reason?: string;
    performedBy?: string;
  }) => {
    return fetcher<{
      item: import('./types').InventoryItemData;
      movement: any;
      referenceNumber: string;
    }>('/api/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

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

  // Customer Management & Credit Customers
  getCustomers: (params?: { type?: string; status?: string; search?: string; hasOutstanding?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.hasOutstanding !== undefined) query.append('hasOutstanding', String(params.hasOutstanding));
    return fetcher<import('./types').CustomerData[]>(`/api/customers?${query.toString()}`);
  },

  getCustomer: (id: string) => {
    return fetcher<import('./types').CustomerData>(`/api/customers/${id}`);
  },

  createCustomer: (data: {
    name: string;
    phone: string;
    address?: string;
    customerType: 'CASH' | 'CREDIT';
    creditLimit?: number;
    creditStatus?: 'ACTIVE' | 'BLOCKED';
    openingBalance?: number;
    notes?: string;
  }) => {
    return fetcher<import('./types').CustomerData>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCustomer: (id: string, data: {
    name: string;
    phone: string;
    address?: string;
    customerType: 'CASH' | 'CREDIT';
    creditLimit?: number;
    creditStatus?: 'ACTIVE' | 'BLOCKED';
    notes?: string;
  }) => {
    return fetcher<import('./types').CustomerData>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateCustomerStatus: (id: string, status: 'ACTIVE' | 'BLOCKED', reason?: string) => {
    return fetcher<import('./types').CustomerData>(`/api/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  getCustomerLedger: (id: string, params?: { fromDate?: string; toDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    return fetcher<{
      customer: import('./types').CustomerData;
      entries: import('./types').CustomerLedgerEntryData[];
      summary: {
        creditLimit: number;
        totalCreditGiven: number;
        totalPaymentReceived: number;
        currentOutstanding: number;
        availableCredit: number;
        creditStatus: string;
      };
    }>(`/api/customers/${id}/ledger?${query.toString()}`);
  },

  getCustomerUnpaidBills: (id: string) => {
    return fetcher<import('./types').CustomerUnpaidBillData[]>(`/api/customers/${id}/unpaid-bills`);
  },

  receiveCustomerPayment: (data: import('./types').ReceiveCreditPaymentPayload) => {
    return fetcher<{
      success: boolean;
      message: string;
      totalSettled: number;
      ledgerEntryId: string;
      newOutstanding: number;
      settledBills: any[];
    }>('/api/customers/receive-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  overrideCustomerCredit: (data: import('./types').CreditOverridePayload) => {
    return fetcher<{
      success: boolean;
      auditId: string;
      overrideAmount: number;
    }>('/api/customers/manager-override', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Credit Reports
  getCreditOutstandingCustomers: () => {
    return fetcher<any[]>('/api/billing/reports/credit-outstanding-customers');
  },

  getCreditOutstandingBills: () => {
    return fetcher<any[]>('/api/billing/reports/credit-outstanding-bills');
  },

  getCreditAgeingReport: () => {
    return fetcher<any[]>('/api/billing/reports/credit-ageing');
  },

  getCreditSummaryReport: () => {
    return fetcher<any>('/api/billing/reports/credit-summary');
  },

  // Accounts (Chart of Accounts, Journal Entries, General Ledger)
  getChartOfAccounts: (params?: { type?: string; search?: string; activeOnly?: boolean; parentId?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (params?.search) q.append('search', params.search);
    if (params?.activeOnly) q.append('activeOnly', 'true');
    if (params?.parentId) q.append('parentId', params.parentId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').ChartOfAccountsResponse>(`/api/accounts/chart${qs}`);
  },

  suggestAccountCode: (params?: { parentId?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.parentId) q.append('parentId', params.parentId);
    if (params?.type) q.append('type', params.type);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{ suggestedCode: string }>(`/api/accounts/chart/suggest-code${qs}`);
  },

  createAccount: (data: {
    accountCode: string;
    accountName: string;
    accountType: string;
    parentId?: string;
    subCategory?: string;
    normalBalance?: string;
    isGroup?: boolean;
    isControlAccount?: boolean;
    allowManualEntries?: boolean;
    openingBalance: number;
    description?: string;
    isActive?: boolean;
  }) => {
    return fetcher<import('./types').AccountItem>('/api/accounts/chart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAccount: (id: string, data: {
    accountName?: string;
    parentId?: string;
    subCategory?: string;
    description?: string;
    isActive?: boolean;
    allowManualEntries?: boolean;
    isControlAccount?: boolean;
  }) => {
    return fetcher<import('./types').AccountItem>(`/api/accounts/chart/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAccount: (id: string) => {
    return fetcher<{ id: string }>(`/api/accounts/chart/${id}`, {
      method: 'DELETE',
    });
  },

  seedDefaultAccounts: () => {
    return fetcher<{ added: number }>('/api/accounts/chart/seed-default', {
      method: 'POST',
    });
  },

  getAccountMappings: () => {
    return fetcher<import('./types').AccountMappingItem[]>('/api/accounts/mappings');
  },

  saveAccountMapping: (data: {
    transactionType: string;
    transactionCategory: string;
    debitAccountId: string;
    creditAccountId: string;
    taxAccountId?: string;
    serviceChargeAccountId?: string;
    discountAccountId?: string;
    description?: string;
  }) => {
    return fetcher<import('./types').AccountMappingItem>('/api/accounts/mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getJournalEntries: (params?: { fromDate?: string; toDate?: string; status?: string; entryType?: string; search?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.status) q.append('status', params.status);
    if (params?.entryType) q.append('entryType', params.entryType);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').JournalEntriesResponse>(`/api/accounts/journal-entries${qs}`);
  },

  getNextJournalNumber: () => {
    return fetcher<{ nextNumber: string }>('/api/accounts/journal-entries/next-number');
  },

  getJournalEntryById: (id: string) => {
    return fetcher<import('./types').JournalEntryItem>(`/api/accounts/journal-entries/${id}`);
  },

  createJournalEntry: (data: import('./types').CreateJournalEntryPayload) => {
    return fetcher<import('./types').JournalEntryItem>('/api/accounts/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateJournalEntry: (id: string, data: import('./types').CreateJournalEntryPayload) => {
    return fetcher<import('./types').JournalEntryItem>(`/api/accounts/journal-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteJournalEntry: (id: string) => {
    return fetcher<{ id: string }>(`/api/accounts/journal-entries/${id}`, {
      method: 'DELETE',
    });
  },

  postJournalEntry: (id: string) => {
    return fetcher<import('./types').JournalEntryItem>(`/api/accounts/journal-entries/${id}/post`, {
      method: 'POST',
    });
  },

  reverseJournalEntry: (id: string, data?: { reason?: string }) => {
    return fetcher<import('./types').JournalEntryItem>(`/api/accounts/journal-entries/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  voidJournalEntry: (id: string) => {
    return fetcher<import('./types').JournalEntryItem>(`/api/accounts/journal-entries/${id}/void`, {
      method: 'POST',
    });
  },

  getGeneralLedger: (params?: { accountId?: string; fromDate?: string; toDate?: string; sourceModule?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.accountId) q.append('accountId', params.accountId);
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.sourceModule) q.append('sourceModule', params.sourceModule);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').GeneralLedgerReport>(`/api/accounts/general-ledger${qs}`);
  },

  getAllAccountsLedger: (params?: { fromDate?: string; toDate?: string; accountType?: string }) => {
    const q = new URLSearchParams();
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.accountType) q.append('accountType', params.accountType);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').AllAccountsLedgerReport>(`/api/accounts/general-ledger/all-accounts${qs}`);
  },

  getTrialBalance: (params?: { fromDate?: string; toDate?: string; accountType?: string; showZeroBalances?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.accountType) q.append('accountType', params.accountType);
    if (params?.showZeroBalances !== undefined) q.append('showZeroBalances', params.showZeroBalances.toString());
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').TrialBalanceReport>(`/api/accounts/trial-balance${qs}`);
  },

  // Sales Transactions Management Module (Shared / Accounts)
  getSalesTransactions: (params?: {
    search?: string;
    salesChannel?: string;
    outlet?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    transactionStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.salesChannel) q.append('salesChannel', params.salesChannel);
    if (params?.outlet) q.append('outlet', params.outlet);
    if (params?.paymentMethod) q.append('paymentMethod', params.paymentMethod);
    if (params?.paymentStatus) q.append('paymentStatus', params.paymentStatus);
    if (params?.transactionStatus) q.append('transactionStatus', params.transactionStatus);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.sortOrder) q.append('sortOrder', params.sortOrder);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').GetSalesTransactionsResponse>(`/api/sales-transactions${qs}`);
  },

  getSalesTransactionById: (id: string) => {
    return fetcher<import('./types').SalesTransactionDetail>(`/api/sales-transactions/${id}`);
  },

  createSalesTransaction: (data: import('./types').CreateSalesTransactionRequest) => {
    return fetcher<{
      id: string;
      billNumber: string;
      grandTotal: number;
      amountPaid: number;
      balanceDue: number;
      paymentStatus: string;
      transactionStatus: string;
    }>('/api/sales-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordSalesPayment: (
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
    return fetcher<{
      id: string;
      billNumber: string;
      amountPaid: number;
      balanceDue: number;
      paymentStatus: string;
    }>(`/api/sales-transactions/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  processSalesReturn: (
    id: string,
    data: {
      returnItems: {
        name: string;
        quantity: number;
        unitPrice: number;
        reason?: string;
        restockInventory: boolean;
      }[];
      reason: string;
      authorizedBy?: string;
      refundPaymentMethod?: string;
    }
  ) => {
    return fetcher<{
      id: string;
      billNumber: string;
      refundAmount: number;
      transactionStatus: string;
      paymentStatus: string;
    }>(`/api/sales-transactions/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancelSalesTransaction: (id: string, data: { reason: string; authorizedBy?: string }) => {
    return fetcher<{
      id: string;
      billNumber: string;
      transactionStatus: string;
      paymentStatus: string;
    }>(`/api/sales-transactions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSalesMenuItems: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetcher<any[]>(`/api/sales-transactions/menu-items${qs}`);
  },

  getSalesCustomers: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetcher<any[]>(`/api/sales-transactions/customers${qs}`);
  },

  // Enhanced Customer Ledger Endpoints
  recordCustomerPaymentV2: (
    customerId: string,
    data: {
      amount: number;
      paymentMode: string;
      allocations?: { billId: string; amount: number }[];
      billIds?: string[];
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
      receivedBy?: string;
      outlet?: string;
    }
  ) => {
    return fetcher<any>(`/api/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  allocateCustomerAdvance: (
    customerId: string,
    data: {
      allocations: { billId: string; amount: number }[];
      notes?: string;
      authorizedBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/customers/${customerId}/advances/allocate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createCustomerAdjustment: (
    customerId: string,
    data: {
      adjustmentType: 'DEBIT' | 'CREDIT';
      amount: number;
      reason: string;
      referenceNumber?: string;
      approvedBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/customers/${customerId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCustomerAgingReport: (customerId: string) => {
    return fetcher<import('./types').CustomerAgingReport>(`/api/customers/${customerId}/aging`);
  },

  getCustomerStatementReport: (customerId: string, params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').CustomerStatementReport>(`/api/customers/${customerId}/statement${qs}`);
  },

  // Purchase Transactions Module
  getPurchaseTransactions: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
    branch?: string;
    purchaseType?: string;
    paymentStatus?: string;
    receivingStatus?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    if (params?.search) q.append('search', params.search);
    if (params?.supplierId) q.append('supplierId', params.supplierId);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.branch) q.append('branch', params.branch);
    if (params?.purchaseType) q.append('purchaseType', params.purchaseType);
    if (params?.paymentStatus) q.append('paymentStatus', params.paymentStatus);
    if (params?.receivingStatus) q.append('receivingStatus', params.receivingStatus);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      items: import('./types').PurchaseTransactionListItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      summary: import('./types').PurchaseTransactionsSummary;
    }>(`/api/purchase-transactions${qs}`);
  },

  getNextPurchaseNumber: () => {
    return fetcher<{ purchaseNumber: string }>('/api/purchase-transactions/next-number');
  },

  getPurchaseTransactionById: (id: string) => {
    return fetcher<import('./types').PurchaseTransactionListItem>(`/api/purchase-transactions/${id}`);
  },

  createPurchaseTransaction: (data: {
    supplierId: string;
    supplierInvoiceNumber?: string;
    supplierInvoiceDate?: string;
    branchOrOutlet?: string;
    warehouse?: string;
    purchaseType: string;
    purchaseOrderRef?: string;
    items: {
      inventoryItemId?: string | null;
      itemCode?: string | null;
      description: string;
      category?: string;
      quantity: number;
      unit: string;
      unitCost: number;
      discountAmount?: number;
      taxPercent?: number;
      warehouse?: string;
    }[];
    discountAmount?: number;
    freightCharges?: number;
    roundOff?: number;
    paidAmount?: number;
    paymentMode?: string;
    paymentReference?: string;
    notes?: string;
    receivingStatus?: string;
    createdBy?: string;
  }) => {
    return fetcher<import('./types').PurchaseTransactionListItem>('/api/purchase-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordPurchasePayment: (
    id: string,
    data: {
      amount: number;
      paymentMode: string;
      paymentDate?: string;
      paymentReference?: string;
      notes?: string;
      paidBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/purchase-transactions/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  processPurchaseReturn: (
    id: string,
    data: {
      items: {
        itemDescription: string;
        inventoryItemId?: string | null;
        quantity: number;
        unit: string;
        unitCost: number;
        reason?: string;
      }[];
      reason: string;
      notes?: string;
      processedBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/purchase-transactions/${id}/returns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  receivePurchaseGoods: (
    id: string,
    data: {
      grnNumber?: string;
      warehouse?: string;
      receivedBy?: string;
      notes?: string;
      receivingStatus?: string;
    }
  ) => {
    return fetcher<any>(`/api/purchase-transactions/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancelPurchaseTransaction: (
    id: string,
    data: {
      reason: string;
      notes?: string;
      cancelledBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/purchase-transactions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPendingPurchaseOrders: () => {
    return fetcher<any[]>('/api/purchase-transactions/purchase-orders');
  },

  // Enhanced Supplier Ledger Endpoints
  getSupplierLedgerV2: (
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
      transactionType?: string;
      outlet?: string;
      outstandingOnly?: boolean;
      overdueOnly?: boolean;
      invoiceNumber?: string;
    }
  ) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.transactionType && params.transactionType !== 'ALL') q.append('transactionType', params.transactionType);
    if (params?.outlet && params.outlet !== 'ALL') q.append('outlet', params.outlet);
    if (params?.outstandingOnly) q.append('outstandingOnly', 'true');
    if (params?.overdueOnly) q.append('overdueOnly', 'true');
    if (params?.invoiceNumber) q.append('invoiceNumber', params.invoiceNumber);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      supplier: import('./types').SupplierRecord;
      periodOpeningBalance: number;
      closingBalance: number;
      summary: import('./types').SupplierLedgerSummary;
      entries: import('./types').SupplierLedgerEntryData[];
    }>(`/api/suppliers/${id}/ledger${qs}`);
  },

  getSupplierUnpaidPurchases: (id: string) => {
    return fetcher<import('./types').SupplierUnpaidPurchaseData[]>(`/api/suppliers/${id}/unpaid-purchases`);
  },

  recordSupplierPaymentMulti: (
    id: string,
    data: {
      amount: number;
      paymentMode: string;
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
      voucherNumber?: string;
      branchOrOutlet?: string;
      paidBy?: string;
      allocations?: { purchaseOrderId: string; amount: number }[];
    }
  ) => {
    return fetcher<any>(`/api/suppliers/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordSupplierAdvance: (
    id: string,
    data: {
      amount: number;
      paymentMode: string;
      paymentDate?: string;
      referenceNumber?: string;
      notes?: string;
      branchOrOutlet?: string;
      paidBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/suppliers/${id}/advances`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  allocateSupplierAdvance: (
    id: string,
    data: {
      allocations: { purchaseOrderId: string; amount: number }[];
      notes?: string;
      authorizedBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/suppliers/${id}/advances/allocate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createSupplierAdjustment: (
    id: string,
    data: {
      adjustmentType: 'DEBIT' | 'CREDIT';
      amount: number;
      reason: string;
      referenceNumber?: string;
      approvedBy?: string;
    }
  ) => {
    return fetcher<any>(`/api/suppliers/${id}/adjustments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSupplierAgingReport: (id: string) => {
    return fetcher<import('./types').SupplierAgingReport>(`/api/suppliers/${id}/aging`);
  },

  getSupplierStatementReport: (id: string, params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<import('./types').SupplierStatementReport>(`/api/suppliers/${id}/statement${qs}`);
  },

  // Cash Accounts Management
  getCashAccounts: (params?: {
    branch?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.branch) q.append('branch', params.branch);
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.dateFrom) q.append('dateFrom', params.dateFrom);
    if (params?.dateTo) q.append('dateTo', params.dateTo);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      summary: import('./types').CashAccountsSummary;
      accounts: import('./types').CashAccountRecord[];
      branches: string[];
    }>(`/api/cash-accounts${qs}`);
  },

  getCashAccountDetails: (id: string) => {
    return fetcher<import('./types').CashAccountRecord>(`/api/cash-accounts/${id}`);
  },

  getCashAccountTransactions: (
    id: string,
    params?: {
      fromDate?: string;
      toDate?: string;
      type?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) => {
    const q = new URLSearchParams();
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.type) q.append('type', params.type);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      periodOpeningBalance: number;
      periodClosingBalance: number;
      periodCashIn: number;
      periodCashOut: number;
      netMovement: number;
      totalRecords: number;
      page: number;
      pageSize: number;
      totalPages: number;
      transactions: import('./types').CashTransactionItem[];
    }>(`/api/cash-accounts/${id}/transactions${qs}`);
  },

  createCashAccount: (data: {
    accountName: string;
    accountCode?: string;
    branchOrOutlet?: string;
    description?: string;
    openingBalance: number;
    openingBalanceDate?: string;
    responsibleEmployee?: string;
    isActive?: boolean;
  }) => {
    return fetcher<any>('/api/cash-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCashAccount: (
    id: string,
    data: {
      accountName?: string;
      branchOrOutlet?: string;
      description?: string;
      responsibleEmployee?: string;
      isActive: boolean;
    }
  ) => {
    return fetcher<any>(`/api/cash-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  recordCashReceipt: (data: {
    accountId: string;
    date: string;
    receivedFrom: string;
    category: string;
    amount: number;
    referenceNumber?: string;
    description?: string;
    branch?: string;
    receivedBy?: string;
  }) => {
    return fetcher<any>('/api/cash-accounts/receipt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordCashPayment: (data: {
    accountId: string;
    date: string;
    payee: string;
    category: string;
    amount: number;
    referenceNumber?: string;
    description?: string;
    branch?: string;
    paidBy?: string;
  }) => {
    return fetcher<any>('/api/cash-accounts/payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  transferCash: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description?: string;
    reference?: string;
    transferredBy?: string;
  }) => {
    return fetcher<any>('/api/cash-accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reconcileCash: (data: {
    accountId: string;
    reconciliationDate: string;
    actualCountedCash: number;
    explanation?: string;
    denominationsJson?: string;
    reconciledBy: string;
    witnessManager?: string;
    autoApproveAdjustment?: boolean;
  }) => {
    return fetcher<any>('/api/cash-accounts/reconcile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCashReconciliations: (id: string) => {
    return fetcher<import('./types').CashReconciliationRecord[]>(`/api/cash-accounts/${id}/reconciliations`);
  },

  // Bank & Wallet Accounts
  getBankWalletAccounts: (params?: {
    type?: string;
    provider?: string;
    branch?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (params?.provider) q.append('provider', params.provider);
    if (params?.branch) q.append('branch', params.branch);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    if (params?.dateFrom) q.append('dateFrom', params.dateFrom);
    if (params?.dateTo) q.append('dateTo', params.dateTo);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      summary: import('./types').BankWalletSummary;
      bankAccounts: import('./types').BankWalletAccountRecord[];
      digitalWallets: import('./types').BankWalletAccountRecord[];
      branches: string[];
    }>(`/api/bank-wallet-accounts${qs}`);
  },

  getBankWalletAccountDetails: (id: string) => {
    return fetcher<import('./types').BankWalletAccountRecord>(`/api/bank-wallet-accounts/${id}`);
  },

  getBankWalletAccountTransactions: (
    id: string,
    params?: {
      fromDate?: string;
      toDate?: string;
      type?: string;
      source?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) => {
    const q = new URLSearchParams();
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);
    if (params?.type) q.append('type', params.type);
    if (params?.source) q.append('source', params.source);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('pageSize', params.pageSize.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetcher<{
      account: {
        id: string;
        accountName: string;
        accountCode: string;
        accountType: 'BANK' | 'WALLET';
      };
      periodOpeningBalance: number;
      periodClosingBalance: number;
      periodIn: number;
      periodOut: number;
      netMovement: number;
      totalRecords: number;
      page: number;
      pageSize: number;
      totalPages: number;
      transactions: import('./types').BankWalletTransactionItem[];
    }>(`/api/bank-wallet-accounts/${id}/transactions${qs}`);
  },

  createBankWalletAccount: (data: {
    accountName: string;
    accountType: 'BANK' | 'WALLET';
    accountCode?: string;
    openingBalance: number;
    openingDate?: string;
    branch?: string;
    notes?: string;
    isActive: boolean;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    walletProvider?: string;
    merchantId?: string;
    registeredMobileNumber?: string;
    settlementBankAccountId?: string;
    directBankSettlement?: boolean;
  }) => {
    return fetcher<any>('/api/bank-wallet-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBankWalletAccount: (
    id: string,
    data: {
      accountName: string;
      branch?: string;
      notes?: string;
      isActive: boolean;
      bankName?: string;
      accountNumber?: string;
      accountHolderName?: string;
      walletProvider?: string;
      merchantId?: string;
      registeredMobileNumber?: string;
      directBankSettlement?: boolean;
    }
  ) => {
    return fetcher<any>(`/api/bank-wallet-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  recordWalletSettlement: (data: {
    walletAccountId: string;
    destinationBankAccountId: string;
    grossAmount: number;
    walletCharges: number;
    otherDeductions: number;
    settlementDate: string;
    settlementReference: string;
    bankReference?: string;
    description?: string;
  }) => {
    return fetcher<any>('/api/bank-wallet-accounts/settlement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  transferBankWalletFunds: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    reference?: string;
    description?: string;
  }) => {
    return fetcher<any>('/api/bank-wallet-accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  recordBankWalletCharge: (data: {
    accountId: string;
    amount: number;
    date: string;
    chargeType: string;
    reference?: string;
    description?: string;
  }) => {
    return fetcher<any>('/api/bank-wallet-accounts/charges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};




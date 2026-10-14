import { RoomWithDetails, ReservationData, GuestData, HousekeepingTaskData, MaintenanceTicketData, POSProductData, InventoryItemData, DashboardMetrics } from './types';

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

  createPOSOrder: (data: any) => {
    return fetcher<any>('/api/pos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Inventory
  getInventory: (params?: { category?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<InventoryItemData[]>(`/api/inventory?${query}`);
  },

  updateInventoryStock: (id: string, data: { quantityToAdd?: number; newStock?: number }) => {
    return fetcher<InventoryItemData>('/api/inventory', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    });
  },

  // Analytics
  getAnalytics: () => {
    return fetcher<DashboardMetrics>('/api/analytics');
  },

  // Seed / Reset
  seedDatabase: () => {
    return fetcher<any>('/api/seed', { method: 'POST' });
  },
};

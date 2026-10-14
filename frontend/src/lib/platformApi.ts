import { PlatformHotelSummary } from './types';

// Mirrors the fetcher pattern in src/lib/api.ts, kept separate since the platform
// (software company admin) surface is a distinct concern from the hotel-scoped admin API.
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

export interface RegisterHotelInput {
  name: string;
  address: string;
  totalFloors: number;
  currency: string;
  timezone: string;
  adminUsername: string;
  adminName: string;
  adminPassword?: string;
}

export interface IssuedCredentials {
  username: string;
  password: string;
}

export const platformApi = {
  login: (username: string, password: string) => {
    return fetcher<{ username: string; name: string }>('/api/platform/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: () => {
    return fetcher<any>('/api/platform/auth/logout', { method: 'POST' });
  },

  getHotels: () => {
    return fetcher<PlatformHotelSummary[]>('/api/platform/hotels');
  },

  registerHotel: (data: RegisterHotelInput) => {
    return fetcher<{ hotel: PlatformHotelSummary; credentials: IssuedCredentials }>('/api/platform/hotels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateHotelStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    return fetcher<PlatformHotelSummary>(`/api/platform/hotels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  resetAdminPassword: (id: string) => {
    return fetcher<IssuedCredentials>(`/api/platform/hotels/${id}/reset-password`, {
      method: 'POST',
    });
  },
};

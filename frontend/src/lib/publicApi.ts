// Unauthenticated calls for the public guest booking portal (/portal, /portal/[slug]).
// Mirrors the fetcher pattern in src/lib/api.ts, kept separate since these endpoints
// carry no session and are reachable by anyone.
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

export interface PublicHotelSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
  currency: string;
}

export const publicApi = {
  getHotels: () => fetcher<PublicHotelSummary[]>('/api/public/hotels'),

  getHotelRooms: (slug: string) => fetcher<any[]>(`/api/public/hotels/${slug}/rooms`),

  createReservation: (slug: string, data: any) =>
    fetcher<any>(`/api/public/hotels/${slug}/reservations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

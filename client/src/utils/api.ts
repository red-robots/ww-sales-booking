import type { Room, Reservation, ReservationFormData } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  rooms: {
    list: () => request<Room[]>('/rooms'),
    get: (id: string) => request<Room>(`/rooms/${id}`),
    create: (data: Partial<Room>) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Room>) => request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
  },
  reservations: {
    list: (params?: { start?: string; end?: string; room_id?: string; status?: string }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
      return request<Reservation[]>(`/reservations${qs}`);
    },
    get: (id: string) => request<Reservation>(`/reservations/${id}`),
    create: (data: ReservationFormData) => request<Reservation>('/reservations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ReservationFormData>) => request<Reservation>(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/reservations/${id}`, { method: 'DELETE' }),
  },
};

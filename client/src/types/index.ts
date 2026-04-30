export interface Room {
  id: string;
  name: string;
  color: string;
  description?: string;
  capacity?: number;
}

export interface Reservation {
  id: string;
  room_id: string;
  title: string;
  status: 'held' | 'booked';
  start_datetime: string;
  end_datetime: string;
  notes?: string;
  client_name?: string;
  salesperson_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type ReservationFormData = Omit<Reservation, 'id' | 'created_at' | 'updated_at'>;

export type ViewMode = 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  viewMode: ViewMode;
  selectedRoomId: string | null;
  statusFilter: 'all' | 'held' | 'booked';
}

import { useState, useEffect, useCallback } from 'react';
import type { Room, Reservation, CalendarState } from '../types';
import { api } from '../utils/api';
import { getWeekRange, getDayRange } from '../utils/calendar';

export function useCalendarData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    viewMode: 'week',
    selectedRoomId: null,
    statusFilter: 'all',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const range = calendarState.viewMode === 'week'
        ? getWeekRange(calendarState.currentDate)
        : getDayRange(calendarState.currentDate);

      const [roomsData, reservationsData] = await Promise.all([
        api.rooms.list(),
        api.reservations.list({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
          ...(calendarState.selectedRoomId ? { room_id: calendarState.selectedRoomId } : {}),
          ...(calendarState.statusFilter !== 'all' ? { status: calendarState.statusFilter } : {}),
        }),
      ]);

      setRooms(roomsData);
      setReservations(reservationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [calendarState.currentDate, calendarState.viewMode, calendarState.selectedRoomId, calendarState.statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    rooms,
    reservations,
    loading,
    error,
    calendarState,
    setCalendarState,
    refetch: fetchData,
  };
}

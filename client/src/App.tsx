import { useState, useCallback } from 'react';
import type { Reservation, ReservationFormData, ViewMode } from './types';
import { useCalendarData } from './hooks/useCalendarData';
import { nextWeek, prevWeek, nextDay, prevDay } from './utils/calendar';
import { api } from './utils/api';
import CalendarToolbar from './components/CalendarToolbar';
import CalendarGrid from './components/CalendarGrid';
import ReservationModal from './components/ReservationModal';
import RoomLegend from './components/RoomLegend';

export default function App() {
  const { rooms, reservations, loading, error, calendarState, setCalendarState, refetch } = useCalendarData();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [defaultRoomId, setDefaultRoomId] = useState<string | undefined>();
  const [defaultStart, setDefaultStart] = useState<Date | undefined>();

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      setCalendarState((prev) => {
        if (direction === 'today') return { ...prev, currentDate: new Date() };
        const nav = prev.viewMode === 'week'
          ? direction === 'next' ? nextWeek : prevWeek
          : direction === 'next' ? nextDay : prevDay;
        return { ...prev, currentDate: nav(prev.currentDate) };
      });
    },
    [setCalendarState]
  );

  const handleViewChange = useCallback(
    (view: ViewMode) => {
      setCalendarState((prev) => ({ ...prev, viewMode: view }));
    },
    [setCalendarState]
  );

  const handleRoomFilter = useCallback(
    (roomId: string | null) => {
      setCalendarState((prev) => ({ ...prev, selectedRoomId: roomId }));
    },
    [setCalendarState]
  );

  const handleStatusFilter = useCallback(
    (status: 'all' | 'held' | 'booked') => {
      setCalendarState((prev) => ({ ...prev, statusFilter: status }));
    },
    [setCalendarState]
  );

  const handleSlotClick = useCallback(
    (roomId: string, _day: Date, startTime: Date) => {
      setEditingReservation(null);
      setDefaultRoomId(roomId);
      setDefaultStart(startTime);
      setModalOpen(true);
    },
    []
  );

  const handleReservationClick = useCallback((reservation: Reservation) => {
    setEditingReservation(reservation);
    setDefaultRoomId(undefined);
    setDefaultStart(undefined);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data: ReservationFormData) => {
      if (editingReservation) {
        await api.reservations.update(editingReservation.id, data);
      } else {
        await api.reservations.create(data);
      }
      await refetch();
    },
    [editingReservation, refetch]
  );

  const handleDelete = useCallback(async () => {
    if (!editingReservation) return;
    await api.reservations.delete(editingReservation.id);
    await refetch();
  }, [editingReservation, refetch]);

  const handleReservationDrop = useCallback(
    async (reservationId: string, update: { room_id: string; start_datetime: string; end_datetime: string }) => {
      try {
        await api.reservations.update(reservationId, update);
        await refetch();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to move reservation');
        await refetch();
      }
    },
    [refetch]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 p-3 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Room Calendar</h1>
        <button
          onClick={() => {
            setEditingReservation(null);
            setDefaultRoomId(undefined);
            setDefaultStart(new Date());
            setModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + New Reservation
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0">
        <CalendarToolbar
          calendarState={calendarState}
          rooms={rooms}
          onNavigate={handleNavigate}
          onViewChange={handleViewChange}
          onRoomFilter={handleRoomFilter}
          onStatusFilter={handleStatusFilter}
        />
      </div>

      {/* Legend */}
      <div className="flex-shrink-0">
        <RoomLegend rooms={rooms} />
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">Loading...</div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
              <button onClick={refetch} className="ml-2 underline">
                Retry
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <CalendarGrid
            currentDate={calendarState.currentDate}
            viewMode={calendarState.viewMode}
            rooms={rooms}
            reservations={reservations}
            selectedRoomId={calendarState.selectedRoomId}
            onSlotClick={handleSlotClick}
            onReservationClick={handleReservationClick}
            onReservationDrop={handleReservationDrop}
          />
        )}
      </div>

      {/* Modal */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={editingReservation ? handleDelete : undefined}
        rooms={rooms}
        reservation={editingReservation}
        defaultRoomId={defaultRoomId}
        defaultStart={defaultStart}
      />
    </div>
  );
}

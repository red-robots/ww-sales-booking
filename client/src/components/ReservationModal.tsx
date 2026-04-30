import { useState, useEffect } from 'react';
import type { Room, Reservation, ReservationFormData } from '../types';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReservationFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  rooms: Room[];
  reservation?: Reservation | null;
  defaultRoomId?: string;
  defaultStart?: Date;
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  rooms,
  reservation,
  defaultRoomId,
  defaultStart,
}: ReservationModalProps) {
  const isEditing = !!reservation;

  const getDefaultEnd = (start: Date) => {
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return end;
  };

  const [formData, setFormData] = useState({
    room_id: '',
    title: '',
    status: 'held' as 'held' | 'booked',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    notes: '',
    client_name: '',
    salesperson_name: '',
    created_by: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (reservation) {
      const start = new Date(reservation.start_datetime);
      const end = new Date(reservation.end_datetime);
      setFormData({
        room_id: reservation.room_id,
        title: reservation.title,
        status: reservation.status,
        start_date: format(start, 'yyyy-MM-dd'),
        start_time: format(start, 'HH:mm'),
        end_date: format(end, 'yyyy-MM-dd'),
        end_time: format(end, 'HH:mm'),
        notes: reservation.notes || '',
        client_name: reservation.client_name || '',
        salesperson_name: reservation.salesperson_name || '',
        created_by: reservation.created_by || '',
      });
    } else {
      const start = defaultStart || new Date();
      const end = getDefaultEnd(start);
      setFormData({
        room_id: defaultRoomId || rooms[0]?.id || '',
        title: '',
        status: 'held',
        start_date: format(start, 'yyyy-MM-dd'),
        start_time: format(start, 'HH:mm'),
        end_date: format(end, 'yyyy-MM-dd'),
        end_time: format(end, 'HH:mm'),
        notes: '',
        client_name: '',
        salesperson_name: '',
        created_by: '',
      });
    }
    setError(null);
  }, [isOpen, reservation, defaultRoomId, defaultStart, rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start_datetime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
    const end_datetime = new Date(`${formData.end_date}T${formData.end_time}`).toISOString();

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      setError('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        room_id: formData.room_id,
        title: formData.title,
        status: formData.status,
        start_datetime,
        end_datetime,
        notes: formData.notes || undefined,
        client_name: formData.client_name || undefined,
        salesperson_name: formData.salesperson_name || undefined,
        created_by: formData.created_by || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Delete this reservation?')) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === formData.room_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            {isEditing && <StatusBadge status={reservation!.status} />}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Meeting title"
            />
          </div>

          {/* Room and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
              <select
                required
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: selectedRoom.color }} />
                  <span className="text-xs text-slate-400">
                    {selectedRoom.capacity ? `Capacity: ${selectedRoom.capacity}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'held' | 'booked' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="held">Held</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>

          {/* Start date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client and Salesperson */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Salesperson</label>
              <input
                type="text"
                value={formData.salesperson_name}
                onChange={(e) => setFormData({ ...formData, salesperson_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional notes"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing && reservation!.status === 'held' && (
                <button
                  type="button"
                  onClick={async () => {
                    setFormData((f) => ({ ...f, status: 'booked' }));
                    // Auto-submit with booked status
                    const start_datetime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
                    const end_datetime = new Date(`${formData.end_date}T${formData.end_time}`).toISOString();
                    setSaving(true);
                    try {
                      await onSave({
                        room_id: formData.room_id,
                        title: formData.title,
                        status: 'booked',
                        start_datetime,
                        end_datetime,
                        notes: formData.notes || undefined,
                        client_name: formData.client_name || undefined,
                        salesperson_name: formData.salesperson_name || undefined,
                        created_by: formData.created_by || undefined,
                      });
                      onClose();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to save');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

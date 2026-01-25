import { useEffect, useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  XCircle,
  Check,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Venue {
  id: string;
  name: string;
  category: string;
}

interface Booking {
  id: string;
  booking_datetime: string;
  party_size: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  special_requests: string;
  status: string;
  confirmation_code: string;
  created_at: string;
}

interface BookableUnit {
  id: string;
  unit_name: string;
  unit_type: string;
  capacity: number;
  min_capacity: number;
  section: string;
  is_active: boolean;
}

interface VenueManagementProps {
  onNavigate: (page: string) => void;
}

export function VenueManagement({ onNavigate }: VenueManagementProps) {
  const { user, userRole } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<BookableUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'capacity'>('bookings');
  const [loading, setLoading] = useState(true);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<BookableUnit | null>(null);

  useEffect(() => {
    if (userRole && userRole === 'CUSTOMER') {
      onNavigate('home');
    }
  }, [userRole]);

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      loadBookings();
      loadTables();
    }
  }, [selectedVenue]);

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, category')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setVenues(data || []);

      if (data && data.length > 0 && !selectedVenue) {
        setSelectedVenue(data[0].id);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!selectedVenue) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', selectedVenue)
        .in('status', ['CONFIRMED', 'CHECKED_IN'])
        .order('booking_datetime', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadTables = async () => {
    if (!selectedVenue) return;

    try {
      const { data, error } = await supabase
        .from('bookable_units')
        .select('*')
        .eq('venue_id', selectedVenue)
        .order('unit_name', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId);

      if (error) throw error;

      alert('Booking cancelled successfully');
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const handleToggleTableStatus = async (tableId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bookable_units')
        .update({ is_active: !currentStatus })
        .eq('id', tableId);

      if (error) throw error;

      loadTables();
    } catch (error) {
      console.error('Error updating table status:', error);
      alert('Failed to update table status');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase
        .from('bookable_units')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your venues...</p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Venues Found</h2>
        <p className="text-gray-600 mb-6">You don't have any venues yet. Create one to start managing bookings.</p>
        <button
          onClick={() => onNavigate('admin')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Admin Panel
        </button>
      </div>
    );
  }

  const selectedVenueData = venues.find(v => v.id === selectedVenue);

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to home</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Venue Management</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Venue</label>
          <select
            value={selectedVenue || ''}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline h-5 w-5 mr-2" />
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'capacity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline h-5 w-5 mr-2" />
              Capacity Management ({tables.length} tables)
            </button>
          </nav>
        </div>

        {activeTab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.customer_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateTime(booking.booking_datetime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{booking.party_size} people</span>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {booking.customer_email}
                          </div>
                          {booking.customer_phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {booking.customer_phone}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Confirmation:</span> {booking.confirmation_code}
                          </div>
                        </div>

                        {booking.special_requests && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Special requests:</span> {booking.special_requests}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'capacity' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Manage your tables and seating capacity. Inactive tables won't be available for bookings.
              </p>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>Add Table</span>
              </button>
            </div>

            {tables.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No tables configured yet</p>
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Your First Table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`border rounded-lg p-4 ${
                      table.is_active
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-300 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{table.unit_name}</h3>
                        {table.section && (
                          <p className="text-sm text-gray-500">{table.section}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingTable(table)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {table.min_capacity === table.capacity
                            ? `${table.capacity} seats`
                            : `${table.min_capacity}-${table.capacity} seats`
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleTableStatus(table.id, table.is_active)}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        table.is_active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {table.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(showAddTableModal || editingTable) && (
        <TableModal
          venueId={selectedVenue!}
          table={editingTable}
          onClose={() => {
            setShowAddTableModal(false);
            setEditingTable(null);
          }}
          onSuccess={() => {
            setShowAddTableModal(false);
            setEditingTable(null);
            loadTables();
          }}
        />
      )}
    </div>
  );
}

interface TableModalProps {
  venueId: string;
  table: BookableUnit | null;
  onClose: () => void;
  onSuccess: () => void;
}

function TableModal({ venueId, table, onClose, onSuccess }: TableModalProps) {
  const [unitName, setUnitName] = useState(table?.unit_name || '');
  const [capacity, setCapacity] = useState(table?.capacity || 4);
  const [minCapacity, setMinCapacity] = useState(table?.min_capacity || 2);
  const [section, setSection] = useState(table?.section || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (table) {
        const { error } = await supabase
          .from('bookable_units')
          .update({
            unit_name: unitName,
            capacity: capacity,
            min_capacity: minCapacity,
            section: section || null,
          })
          .eq('id', table.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookable_units')
          .insert({
            venue_id: venueId,
            unit_type: 'TABLE',
            unit_name: unitName,
            capacity: capacity,
            min_capacity: minCapacity,
            section: section || null,
            is_active: true,
          });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving table:', error);
      alert('Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {table ? 'Edit Table' : 'Add New Table'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Name
            </label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g., Table 1, Window Table"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section (optional)
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g., Patio, Main Dining, Bar"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Capacity
              </label>
              <input
                type="number"
                value={minCapacity}
                onChange={(e) => setMinCapacity(parseInt(e.target.value))}
                min="1"
                max={capacity}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Capacity
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                min={minCapacity}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : table ? 'Update' : 'Add Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

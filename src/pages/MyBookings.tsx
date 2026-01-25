import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Booking, Venue } from '../types';

interface MyBookingsProps {
  onNavigate: (page: string, data?: any) => void;
}

interface BookingWithVenue extends Booking {
  venue: Venue;
}

export function MyBookings({ onNavigate }: MyBookingsProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('user_id', user.id)
        .order('booking_datetime', { ascending: false });

      if (error) throw error;
      setBookings(data as any || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId);

      if (error) throw error;
      loadBookings();
    } catch (error: any) {
      alert('Failed to cancel booking: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    const bookingDate = booking.booking_datetime ? new Date(booking.booking_datetime) : null;
    const now = new Date();
    if (filter === 'upcoming') {
      return bookingDate && bookingDate >= now && booking.status !== 'CANCELLED';
    } else {
      return bookingDate && bookingDate < now || booking.status === 'CANCELLED';
    }
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your reservations</p>
      </div>

      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'past'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'upcoming'
              ? "You don't have any upcoming reservations"
              : "You don't have any past reservations"}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Explore Venues
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingDate = booking.booking_datetime
              ? new Date(booking.booking_datetime)
              : null;

            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {booking.venue.name}
                      </h3>
                      {booking.venue.location?.city && (
                        <div className="flex items-center space-x-1 text-gray-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{booking.venue.location.city}</span>
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="text-sm font-medium">{booking.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {bookingDate && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700">
                            {bookingDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700">
                            {bookingDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">{booking.party_size} people</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confirmation Code</span>
                      <span className="text-lg font-bold text-gray-900">
                        {booking.confirmation_code}
                      </span>
                    </div>
                  </div>

                  {booking.status === 'CONFIRMED' && bookingDate && bookingDate >= new Date() && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onNavigate('venue-detail', { venueId: booking.venue_id })}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View Venue
                      </button>
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="px-6 py-2 bg-white text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

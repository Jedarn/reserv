import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, Users, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Venue } from '../types';

interface BookingConfirmationProps {
  bookingId: string;
  onNavigate: (page: string) => void;
}

export function BookingConfirmation({ bookingId, onNavigate }: BookingConfirmationProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', bookingData.venue_id)
        .single();

      if (venueError) throw venueError;
      setVenue(venueData);
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading confirmation...</p>
      </div>
    );
  }

  if (!booking || !venue) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const bookingDate = booking.booking_datetime
    ? new Date(booking.booking_datetime)
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-green-100 text-lg">
            Your reservation has been successfully confirmed
          </p>
        </div>

        <div className="p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmation Code</p>
                <p className="text-3xl font-bold text-blue-600">{booking.confirmation_code}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reservation Details</h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <MapPin className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{venue.name}</p>
                {venue.location?.address && (
                  <p className="text-sm text-gray-600">{venue.location.address}</p>
                )}
                {venue.location?.city && (
                  <p className="text-sm text-gray-600">{venue.location.city}</p>
                )}
              </div>
            </div>

            {bookingDate && (
              <>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {bookingDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {bookingDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">
                  {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{booking.customer_email}</span>
              </div>
              {booking.customer_phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{booking.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {booking.special_requests && (
            <div className="border-t pt-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Requests</h3>
              <p className="text-gray-700">{booking.special_requests}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                A confirmation email has been sent to <strong>{booking.customer_email}</strong>.
                Please arrive 10 minutes before your reservation time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onNavigate('my-bookings')}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                View My Bookings
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="flex-1 py-3 bg-white text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Star, DollarSign, Clock, Users, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Venue, AvailabilityRule, BookableUnit } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface VenueDetailProps {
  venueId: string;
  onNavigate: (page: string, data?: any) => void;
}

export function VenueDetail({ venueId, onNavigate }: VenueDetailProps) {
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);

  useEffect(() => {
    loadVenueDetails();
  }, [venueId]);

  const loadVenueDetails = async () => {
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .maybeSingle();

      if (venueError) throw venueError;
      setVenue(venueData);

      const { data: rulesData, error: rulesError } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (rulesError) throw rulesError;
      setAvailabilityRules(rulesData || []);
    } catch (error) {
      console.error('Error loading venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time');
      return;
    }

    onNavigate('booking', {
      venueId,
      venue,
      date: selectedDate,
      time: selectedTime,
      partySize,
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDays = Math.max(...availabilityRules.map(r => r.advance_booking_days), 30);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading venue details...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Venue not found</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const dayOfWeek = selectedDate ? new Date(selectedDate).getDay() : -1;
  const todayRules = availabilityRules.filter(r => r.day_of_week === dayOfWeek);

  return (
    <div>
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to venues</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {venue.images && venue.images.length > 0 && (
          <img
            src={venue.images[0]}
            alt={venue.name}
            className="w-full h-96 object-cover"
          />
        )}

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{venue.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                {venue.location?.city && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-5 w-5" />
                    <span>{venue.location.city}</span>
                  </div>
                )}
                {venue.price_range && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-5 w-5" />
                    <span>{venue.price_range}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
              <Star className="h-6 w-6 text-yellow-500 fill-current" />
              <span className="text-2xl font-bold text-gray-900">{venue.rating.toFixed(1)}</span>
            </div>
          </div>

          {venue.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>
          )}

          {venue.amenities && venue.amenities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(venue.category === 'RESTAURANT' || venue.category === 'CAFE') && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make a Reservation</h2>

              {availabilityRules.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-2">Reservations Not Available</h3>
                      <p className="text-sm text-yellow-800 mb-3">
                        This venue hasn't set up their availability schedule yet. Please check back later or contact the venue directly.
                      </p>
                      {venue.contact?.phone && (
                        <p className="text-sm text-yellow-800">
                          Phone: <a href={`tel:${venue.contact.phone}`} className="underline">{venue.contact.phone}</a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime('');
                        }}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Time
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        disabled={!selectedDate || todayRules.length === 0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!selectedDate
                            ? 'Select a date first'
                            : todayRules.length === 0
                            ? 'Closed on this day'
                            : 'Select time'}
                        </option>
                        {todayRules.flatMap((rule) =>
                          generateTimeSlots(rule.open_time, rule.close_time, rule.slot_duration_minutes)
                        )
                          .filter((slot, index, self) => self.indexOf(slot) === index)
                          .map((slot) => (
                            <option key={slot} value={slot}>
                              {formatTime(slot)}
                            </option>
                          ))}
                      </select>
                      {selectedDate && todayRules.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">This venue is closed on the selected day</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="inline h-4 w-4 mr-1" />
                        Party Size
                      </label>
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                          <option key={size} value={size}>
                            {size} {size === 1 ? 'person' : 'people'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleBookNow}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {user ? 'Continue to Booking' : 'Sign In to Book'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateTimeSlots(openTime: string, closeTime: string, slotDuration: number): string[] {
  const slots: string[] = [];

  const openParts = openTime.split(':');
  const closeParts = closeTime.split(':');
  const openHour = parseInt(openParts[0]);
  const openMin = parseInt(openParts[1]);
  const closeHour = parseInt(closeParts[0]);
  const closeMin = parseInt(closeParts[1]);

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  while (currentMinutes + slotDuration <= closeMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    slots.push(timeString);
    currentMinutes += 30;
  }

  return slots;
}

function formatTime(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

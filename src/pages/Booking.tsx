import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Venue, BookableUnit } from '../types';

interface BookingProps {
  venueId: string;
  venue: Venue;
  date: string;
  time: string;
  partySize: number;
  onNavigate: (page: string, data?: any) => void;
}

export function Booking({ venueId, venue, date, time, partySize, onNavigate }: BookingProps) {
  const { user } = useAuth();
  const [availableUnits, setAvailableUnits] = useState<BookableUnit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [currentHold, setCurrentHold] = useState<any>(null);

  useEffect(() => {
    loadAvailableUnits();
  }, []);

  useEffect(() => {
    if (holdExpiry) {
      const timer = setInterval(() => {
        const now = new Date();
        if (now >= holdExpiry) {
          alert('Your hold has expired. Please try again.');
          onNavigate('venue-detail', { venueId });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [holdExpiry]);

  const loadAvailableUnits = async () => {
    try {
      const bookingDateTime = new Date(`${date}T${time}`);

      const { data: units, error: unitsError } = await supabase
        .from('bookable_units')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .eq('unit_type', 'TABLE')
        .gte('capacity', partySize);

      if (unitsError) throw unitsError;

      const endDateTime = new Date(bookingDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 90);

      const { data: existingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, booking_units(bookable_unit_id)')
        .eq('venue_id', venueId)
        .gte('booking_datetime', bookingDateTime.toISOString())
        .lte('booking_datetime', endDateTime.toISOString())
        .neq('status', 'CANCELLED');

      if (bookingsError) throw bookingsError;

      const { data: activeHolds, error: holdsError } = await supabase
        .from('holds')
        .select('*, hold_units(bookable_unit_id)')
        .eq('venue_id', venueId)
        .eq('status', 'ACTIVE')
        .gte('expires_at', new Date().toISOString())
        .gte('booking_datetime', bookingDateTime.toISOString())
        .lte('booking_datetime', endDateTime.toISOString());

      if (holdsError) throw holdsError;

      const bookedUnitIds = new Set(
        existingBookings?.flatMap((b: any) => b.booking_units.map((bu: any) => bu.bookable_unit_id)) || []
      );
      const heldUnitIds = new Set(
        activeHolds?.flatMap((h: any) => h.hold_units?.map((hu: any) => hu.bookable_unit_id) || []) || []
      );

      const available = units?.filter(
        (u) => !bookedUnitIds.has(u.id) && !heldUnitIds.has(u.id)
      ) || [];

      setAvailableUnits(available);
    } catch (error) {
      console.error('Error loading available units:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHold = async () => {
    if (!user) return;
    if (selectedUnits.length === 0) {
      alert('Please select at least one table');
      return;
    }

    setCreating(true);
    try {
      const bookingDateTime = new Date(`${date}T${time}`);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      const { data: hold, error: holdError } = await supabase
        .from('holds')
        .insert({
          user_id: user.id,
          venue_id: venueId,
          hold_type: 'RESTAURANT',
          booking_datetime: bookingDateTime.toISOString(),
          party_size: partySize,
          expires_at: expiresAt.toISOString(),
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (holdError) throw holdError;

      const holdUnits = selectedUnits.map((unitId) => ({
        hold_id: hold.id,
        bookable_unit_id: unitId,
      }));

      const { error: holdUnitsError } = await supabase
        .from('hold_units')
        .insert(holdUnits);

      if (holdUnitsError) throw holdUnitsError;

      setCurrentHold(hold);
      setHoldExpiry(expiresAt);
    } catch (error: any) {
      console.error('Error creating hold:', error);
      alert('Failed to create hold: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const confirmBooking = async () => {
    if (!user || !currentHold) return;
    if (!customerName || !customerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const bookingDateTime = new Date(`${date}T${time}`);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          venue_id: venueId,
          booking_type: 'RESTAURANT',
          booking_datetime: bookingDateTime.toISOString(),
          party_size: partySize,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          special_requests: specialRequests || null,
          status: 'CONFIRMED',
          payment_status: 'PENDING',
          total_amount: 0,
          deposit_amount: 0,
          confirmation_code: '',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const bookingUnits = selectedUnits.map((unitId) => ({
        booking_id: booking.id,
        bookable_unit_id: unitId,
      }));

      const { error: bookingUnitsError } = await supabase
        .from('booking_units')
        .insert(bookingUnits);

      if (bookingUnitsError) throw bookingUnitsError;

      const { error: holdUpdateError } = await supabase
        .from('holds')
        .update({ status: 'CONVERTED' })
        .eq('id', currentHold.id);

      if (holdUpdateError) throw holdUpdateError;

      onNavigate('booking-confirmation', { bookingId: booking.id });
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getRemainingTime = () => {
    if (!holdExpiry) return '';
    const now = new Date();
    const diff = holdExpiry.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading available tables...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => onNavigate('venue-detail', { venueId })}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to venue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">{date}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold text-gray-900">{time}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Party Size</p>
                  <p className="font-semibold text-gray-900">{partySize} people</p>
                </div>
              </div>
            </div>

            {!currentHold ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Table(s)</h3>
                {availableUnits.length === 0 ? (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">No tables available</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Unfortunately, there are no tables available for the selected time. Please try a different time slot.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {availableUnits.map((unit) => (
                      <div
                        key={unit.id}
                        onClick={() => {
                          setSelectedUnits((prev) =>
                            prev.includes(unit.id)
                              ? prev.filter((id) => id !== unit.id)
                              : [...prev, unit.id]
                          );
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedUnits.includes(unit.id)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <h4 className="font-semibold text-gray-900">{unit.unit_name}</h4>
                        <p className="text-sm text-gray-600">Capacity: {unit.capacity} people</p>
                        {unit.section && (
                          <p className="text-sm text-gray-600">Section: {unit.section}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {availableUnits.length > 0 && (
                  <button
                    onClick={createHold}
                    disabled={creating || selectedUnits.length === 0}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating Hold...' : 'Continue'}
                  </button>
                )}
              </>
            ) : (
              <>
                {holdExpiry && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-900">Hold expires in:</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{getRemainingTime()}</span>
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special requests or dietary requirements..."
                    />
                  </div>
                </div>

                <button
                  onClick={confirmBooking}
                  disabled={creating || !customerName || !customerEmail}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {creating ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Venue</span>
                <span className="font-medium text-gray-900">{venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-900">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium text-gray-900">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Party Size</span>
                <span className="font-medium text-gray-900">{partySize}</span>
              </div>
              {selectedUnits.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tables</span>
                  <span className="font-medium text-gray-900">{selectedUnits.length}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  Your table will be held for 10 minutes. Please complete your booking within this time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

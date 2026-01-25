import { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Edit, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Venue } from '../types';

interface AdminProps {
  onNavigate: (page: string, data?: any) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const { user, userRole } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookingsCount, setBookingsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole && userRole !== 'ADMIN') {
      onNavigate('home');
    }
  }, [userRole]);

  useEffect(() => {
    if (user) {
      loadVenues();
    }
  }, [user]);

  const loadVenues = async () => {
    if (!user) return;

    try {
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (venuesError) throw venuesError;
      setVenues(venuesData || []);

      const counts: Record<string, number> = {};
      for (const venue of venuesData || []) {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id)
          .eq('status', 'CONFIRMED');

        if (!error && count !== null) {
          counts[venue.id] = count;
        }
      }
      setBookingsCount(counts);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Venue Management</h1>
          <p className="text-gray-600">Manage your venues, inventory, and bookings</p>
        </div>
        <button
          onClick={() => onNavigate('venue-form', { mode: 'create' })}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Venue</span>
        </button>
      </div>

      {venues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first venue
          </p>
          <button
            onClick={() => onNavigate('venue-form', { mode: 'create' })}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {venue.images && venue.images.length > 0 ? (
                <img
                  src={venue.images[0]}
                  alt={venue.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200"></div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{venue.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      venue.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {venue.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {venue.location?.city && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.location.city}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium text-gray-900">{venue.category}</span>
                </div>

                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <span className="text-sm text-gray-600">Active Bookings</span>
                  <span className="text-lg font-bold text-blue-600">
                    {bookingsCount[venue.id] || 0}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate('venue-detail', { venueId: venue.id })}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => onNavigate('venue-form', { mode: 'edit', venueId: venue.id })}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

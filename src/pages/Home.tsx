import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Star, DollarSign, Utensils, Coffee, Hotel, Music, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Venue, VenueCategory } from '../types';

interface HomeProps {
  onNavigate: (page: string, data?: any) => void;
}

const categoryIcons = {
  RESTAURANT: Utensils,
  CAFE: Coffee,
  HOTEL: Hotel,
  EVENT: Calendar,
  CONCERT: Music,
};

const categoryLabels = {
  RESTAURANT: 'Restaurants',
  CAFE: 'Cafés',
  HOTEL: 'Hotels',
  EVENT: 'Events',
  CONCERT: 'Concerts',
};

export function Home({ onNavigate }: HomeProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | 'ALL'>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [venues, searchQuery, selectedCategory, selectedPriceRange]);

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVenues = () => {
    let filtered = venues;

    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }

    if (selectedPriceRange !== 'ALL') {
      filtered = filtered.filter((v) => v.price_range === selectedPriceRange);
    }

    setFilteredVenues(filtered);
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Discover & Reserve</h1>
        <p className="text-xl text-blue-100 mb-6">
          Find and book restaurants, cafés, hotels, events, and concerts all in one place
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {(Object.keys(categoryLabels) as VenueCategory[]).map((cat) => {
                const Icon = categoryIcons[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{categoryLabels[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPriceRange('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPriceRange === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {['$', '$$', '$$$', '$$$$'].map((price) => (
                <button
                  key={price}
                  onClick={() => setSelectedPriceRange(price)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPriceRange === price
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading venues...</p>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No venues found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => {
            const Icon = categoryIcons[venue.category];
            return (
              <div
                key={venue.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => onNavigate('venue-detail', { venueId: venue.id })}
              >
                {venue.images && venue.images.length > 0 ? (
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Icon className="h-16 w-16 text-blue-600" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">{venue.name}</h3>
                    <div className="flex items-center space-x-1 text-yellow-500 ml-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{venue.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Icon className="h-4 w-4" />
                    <span>{categoryLabels[venue.category]}</span>
                    {venue.price_range && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4" />
                          <span>{venue.price_range}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {venue.location?.city && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.location.city}</span>
                    </div>
                  )}

                  {venue.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.description}</p>
                  )}

                  <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Venue, VenueCategory, BookableUnit } from '../types';

interface VenueFormProps {
  mode: 'create' | 'edit';
  venueId?: string;
  onNavigate: (page: string) => void;
}

const categories: VenueCategory[] = ['RESTAURANT', 'CAFE', 'HOTEL', 'EVENT', 'CONCERT'];
const priceRanges = ['$', '$$', '$$$', '$$$$'];

export function VenueForm({ mode, venueId, onNavigate }: VenueFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VenueCategory>('RESTAURANT');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [priceRange, setPriceRange] = useState('$$');
  const [imageUrl, setImageUrl] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [tables, setTables] = useState<BookableUnit[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(2);
  const [newTableSection, setNewTableSection] = useState('');

  useEffect(() => {
    if (mode === 'edit' && venueId) {
      loadVenue();
      loadTables();
    }
  }, [mode, venueId]);

  const loadVenue = async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) throw error;

      setName(data.name);
      setCategory(data.category);
      setDescription(data.description || '');
      setCity(data.location?.city || '');
      setAddress(data.location?.address || '');
      setCountry(data.location?.country || '');
      setPhone(data.contact?.phone || '');
      setEmail(data.contact?.email || '');
      setWebsite(data.contact?.website || '');
      setPriceRange(data.price_range || '$$');
      setImageUrl(data.images?.[0] || '');
      setAmenitiesInput(data.amenities?.join(', ') || '');
      setIsActive(data.is_active);
    } catch (error) {
      console.error('Error loading venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from('bookable_units')
        .select('*')
        .eq('venue_id', venueId)
        .eq('unit_type', 'TABLE')
        .order('unit_name');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const amenities = amenitiesInput
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const venueData = {
        name,
        category,
        description: description || null,
        location: {
          address: address || undefined,
          city: city || undefined,
          country: country || undefined,
        },
        contact: {
          phone: phone || undefined,
          email: email || undefined,
          website: website || undefined,
        },
        images: imageUrl ? [imageUrl] : [],
        price_range: priceRange,
        amenities,
        is_active: isActive,
        owner_id: user.id,
      };

      if (mode === 'create') {
        const { error } = await supabase.from('venues').insert(venueData);
        if (error) throw error;
      } else if (venueId) {
        const { error } = await supabase
          .from('venues')
          .update(venueData)
          .eq('id', venueId);
        if (error) throw error;
      }

      onNavigate('admin');
    } catch (error: any) {
      alert('Failed to save venue: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addTable = async () => {
    if (!venueId || !newTableName) return;

    try {
      const { error } = await supabase.from('bookable_units').insert({
        venue_id: venueId,
        unit_type: 'TABLE',
        unit_name: newTableName,
        capacity: newTableCapacity,
        min_capacity: Math.max(1, newTableCapacity - 2),
        section: newTableSection || null,
        is_active: true,
      });

      if (error) throw error;

      setNewTableName('');
      setNewTableCapacity(2);
      setNewTableSection('');
      loadTables();
    } catch (error: any) {
      alert('Failed to add table: ' + error.message);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase
        .from('bookable_units')
        .delete()
        .eq('id', tableId);

      if (error) throw error;
      loadTables();
    } catch (error: any) {
      alert('Failed to delete table: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading venue...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => onNavigate('admin')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to admin</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Create Venue' : 'Edit Venue'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="The Grand Restaurant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VenueCategory)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your venue..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="USA"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 555-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="info@venue.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://venue.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priceRanges.map((price) => (
                  <option key={price} value={price}>
                    {price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amenities (comma separated)
            </label>
            <input
              type="text"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="WiFi, Parking, Wheelchair Accessible"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Venue is active and visible to customers
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : mode === 'create' ? 'Create Venue' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {mode === 'edit' && venueId && (category === 'RESTAURANT' || category === 'CAFE') && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tables Management</h2>

            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Table</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Table name (e.g., Table 1)"
                />
                <input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Capacity"
                />
                <input
                  type="text"
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Section (optional)"
                />
                <button
                  onClick={addTable}
                  disabled={!newTableName}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{table.unit_name}</h4>
                    <p className="text-sm text-gray-600">
                      Capacity: {table.capacity} people
                      {table.section && ` • Section: ${table.section}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

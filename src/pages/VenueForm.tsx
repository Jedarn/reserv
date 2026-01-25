import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Venue, VenueCategory, BookableUnit, AvailabilityRule } from '../types';

interface VenueFormProps {
  mode: 'create' | 'edit';
  venueId?: string;
  onNavigate: (page: string) => void;
}

const categories: VenueCategory[] = ['RESTAURANT', 'CAFE', 'HOTEL', 'EVENT', 'CONCERT'];
const priceRanges = ['$', '$$', '$$$', '$$$$'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DaySchedule {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  advanceBookingDays: number;
  minPartySize: number;
  maxPartySize: number;
}

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

  const [schedules, setSchedules] = useState<DaySchedule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isOpen: false,
      openTime: '11:00',
      closeTime: '22:00',
      slotDuration: 90,
      advanceBookingDays: 30,
      minPartySize: 1,
      maxPartySize: 12,
    }))
  );

  useEffect(() => {
    if (mode === 'edit' && venueId) {
      loadVenue();
      loadTables();
      loadAvailabilityRules();
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

  const loadAvailabilityRules = async () => {
    if (!venueId) return;

    try {
      const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const newSchedules = schedules.map((schedule) => {
          const rule = data.find((r) => r.day_of_week === schedule.dayOfWeek);
          if (rule) {
            return {
              dayOfWeek: schedule.dayOfWeek,
              isOpen: true,
              openTime: rule.open_time.substring(0, 5),
              closeTime: rule.close_time.substring(0, 5),
              slotDuration: rule.slot_duration_minutes,
              advanceBookingDays: rule.advance_booking_days,
              minPartySize: rule.min_party_size,
              maxPartySize: rule.max_party_size,
            };
          }
          return schedule;
        });
        setSchedules(newSchedules);
      }
    } catch (error) {
      console.error('Error loading availability rules:', error);
    }
  };

  const saveAvailabilityRules = async () => {
    if (!venueId) return;

    try {
      const { error: deleteError } = await supabase
        .from('availability_rules')
        .delete()
        .eq('venue_id', venueId);

      if (deleteError) throw deleteError;

      const rulesToInsert = schedules
        .filter((schedule) => schedule.isOpen)
        .map((schedule) => ({
          venue_id: venueId,
          day_of_week: schedule.dayOfWeek,
          open_time: schedule.openTime + ':00',
          close_time: schedule.closeTime + ':00',
          slot_duration_minutes: schedule.slotDuration,
          advance_booking_days: schedule.advanceBookingDays,
          min_party_size: schedule.minPartySize,
          max_party_size: schedule.maxPartySize,
          is_active: true,
        }));

      if (rulesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('availability_rules')
          .insert(rulesToInsert);

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      throw new Error('Failed to save availability rules: ' + error.message);
    }
  };

  const updateSchedule = (dayOfWeek: number, field: keyof DaySchedule, value: any) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, [field]: value } : schedule
      )
    );
  };

  const applyToAllDays = () => {
    const firstOpenDay = schedules.find((s) => s.isOpen);
    if (!firstOpenDay) return;

    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.isOpen
          ? {
              ...schedule,
              openTime: firstOpenDay.openTime,
              closeTime: firstOpenDay.closeTime,
              slotDuration: firstOpenDay.slotDuration,
              advanceBookingDays: firstOpenDay.advanceBookingDays,
              minPartySize: firstOpenDay.minPartySize,
              maxPartySize: firstOpenDay.maxPartySize,
            }
          : schedule
      )
    );
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
          <>
            <div className="mt-12 pt-8 border-t">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Operating Hours</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Set your venue's availability schedule. Customers can only book during these hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyToAllDays}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Copy to All Open Days
                </button>
              </div>

              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.dayOfWeek}
                    className={`p-4 border rounded-lg ${
                      schedule.isOpen ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule.isOpen}
                          onChange={(e) =>
                            updateSchedule(schedule.dayOfWeek, 'isOpen', e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        <span className="font-medium text-gray-900">
                          {daysOfWeek[schedule.dayOfWeek]}
                        </span>
                      </div>

                      {schedule.isOpen ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Open</label>
                            <input
                              type="time"
                              value={schedule.openTime}
                              onChange={(e) =>
                                updateSchedule(schedule.dayOfWeek, 'openTime', e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Close</label>
                            <input
                              type="time"
                              value={schedule.closeTime}
                              onChange={(e) =>
                                updateSchedule(schedule.dayOfWeek, 'closeTime', e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Slot (min)</label>
                            <input
                              type="number"
                              value={schedule.slotDuration}
                              onChange={(e) =>
                                updateSchedule(
                                  schedule.dayOfWeek,
                                  'slotDuration',
                                  Number(e.target.value)
                                )
                              }
                              min={30}
                              max={240}
                              step={15}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Advance Days</label>
                            <input
                              type="number"
                              value={schedule.advanceBookingDays}
                              onChange={(e) =>
                                updateSchedule(
                                  schedule.dayOfWeek,
                                  'advanceBookingDays',
                                  Number(e.target.value)
                                )
                              }
                              min={1}
                              max={90}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Party</label>
                            <input
                              type="number"
                              value={schedule.minPartySize}
                              onChange={(e) =>
                                updateSchedule(
                                  schedule.dayOfWeek,
                                  'minPartySize',
                                  Number(e.target.value)
                                )
                              }
                              min={1}
                              max={20}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Max Party</label>
                            <input
                              type="number"
                              value={schedule.maxPartySize}
                              onChange={(e) =>
                                updateSchedule(
                                  schedule.dayOfWeek,
                                  'maxPartySize',
                                  Number(e.target.value)
                                )
                              }
                              min={1}
                              max={50}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-6 text-sm text-gray-500">Closed</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveAvailabilityRules();
                      alert('Operating hours saved successfully!');
                    } catch (error: any) {
                      alert(error.message);
                    }
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  <Clock className="h-5 w-5" />
                  <span>Save Operating Hours</span>
                </button>
              </div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}

export type VenueCategory = 'RESTAURANT' | 'CAFE' | 'HOTEL' | 'EVENT' | 'CONCERT';
export type UnitType = 'TABLE' | 'SEAT' | 'ROOM';
export type PriceTier = 'STANDARD' | 'PREMIUM' | 'VIP';
export type BookingType = 'RESTAURANT' | 'EVENT' | 'HOTEL';
export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type HoldStatus = 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'RELEASED';

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  description: string | null;
  location: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  images: string[];
  rating: number;
  price_range: string | null;
  amenities: string[];
  policies: any;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookableUnit {
  id: string;
  venue_id: string;
  unit_type: UnitType;
  unit_name: string;
  capacity: number;
  min_capacity: number;
  section: string | null;
  position: { x?: number; y?: number };
  price_tier: PriceTier;
  base_price: number;
  attributes: any;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  venue_id: string;
  event_instance_id: string | null;
  booking_type: BookingType;
  booking_datetime: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  party_size: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  special_requests: string | null;
  status: BookingStatus;
  total_amount: number;
  deposit_amount: number;
  payment_status: PaymentStatus;
  confirmation_code: string;
  qr_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hold {
  id: string;
  user_id: string;
  venue_id: string;
  event_instance_id: string | null;
  hold_type: BookingType;
  booking_datetime: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  party_size: number;
  expires_at: string;
  status: HoldStatus;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  venue_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  slot_duration_minutes: number;
  advance_booking_days: number;
  min_party_size: number;
  max_party_size: number;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  units?: BookableUnit[];
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string;
          name: string;
          category: 'RESTAURANT' | 'CAFE' | 'HOTEL' | 'EVENT' | 'CONCERT';
          description: string | null;
          location: any;
          contact: any;
          images: any;
          rating: number;
          price_range: string | null;
          amenities: any;
          policies: any;
          owner_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      bookable_units: {
        Row: {
          id: string;
          venue_id: string;
          unit_type: 'TABLE' | 'SEAT' | 'ROOM';
          unit_name: string;
          capacity: number;
          min_capacity: number;
          section: string | null;
          position: any;
          price_tier: 'STANDARD' | 'PREMIUM' | 'VIP';
          base_price: number;
          attributes: any;
          is_active: boolean;
          created_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          venue_id: string;
          event_instance_id: string | null;
          booking_type: 'RESTAURANT' | 'EVENT' | 'HOTEL';
          booking_datetime: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          party_size: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          special_requests: string | null;
          status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
          total_amount: number;
          deposit_amount: number;
          payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
          confirmation_code: string;
          qr_code: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      holds: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          event_instance_id: string | null;
          hold_type: 'RESTAURANT' | 'EVENT' | 'HOTEL';
          booking_datetime: string | null;
          check_in_date: string | null;
          check_out_date: string | null;
          party_size: number;
          expires_at: string;
          status: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'RELEASED';
          created_at: string;
        };
      };
    };
  };
};

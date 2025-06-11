export interface Business {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  user_id: number | null;
  latitude?: number;
  longitude?: number;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  business_id: number;
  status?: 'active' | 'inactive';
  category?: string;
  image?: string;
}

export interface Review {
  id: number;
  name: string;
  user_name?: string;
  profileImage?: string;
  rating: number;
  comment: string;
  date: string;
  user_id?: number;
  business_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RawReview {
  id: number;
  user_name?: string;
  user_id?: number;
  rating: number;
  comment: string;
  business_id: number;
  created_at: string;
}

export interface RecentReview {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceName?: string;
}

export interface Availability {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  business_id: number;
}

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface BusinessDetailState {
  business: Business | null;
  services: Service[];
  reviews: Review[];
  availability: Availability[];
  mapCoordinates: MapCoordinates | null;
  isLoading: boolean;
  isMapLoading: boolean;
  hasMapCoordinates: boolean;
  mapError: string;
  isOwner: boolean;
  userRole: string;
}

export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalServices: number;
  bookingsByMonth: { month: string; count: number }[];
  popularServices: { name: string; bookings: number }[];
  revenueByService: { name: string; revenue: number }[];
  customerRetention: number;
}

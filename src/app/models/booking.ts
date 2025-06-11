/**
 * Interfaces relacionadas con reservas (bookings)
 */

export interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'rechazada';
  total_price?: number;
  notes?: string;
}

export interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | 'rechazada';
}

export interface BookingStatus {
  value: string;
  label: string;
}

export interface WeeklyStats {
  bookings: number;
  revenue: number;
  rating: number;
}

export interface DashboardMetric {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

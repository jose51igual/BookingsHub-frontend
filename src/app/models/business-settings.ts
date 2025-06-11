/**
 * Interfaces relacionadas con configuración de negocios
 */

export interface BusinessSettings {
  business_name: string;
  business_description: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  business_website?: string;
  business_hours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  notifications: {
    emailBookings: boolean;
    smsReminders: boolean;
    emailReviews: boolean;
    pushNotifications: boolean;
  };
  booking_settings: {
    advance_booking_days: number;
    cancellation_hours: number;
    require_deposit: boolean;
    deposit_percentage: number;
    auto_confirm: boolean;
  };
  payment_settings: {
    accept_cash: boolean;
    accept_card: boolean;
    accept_online: boolean;
  };
}

export interface BusinessProfile {
  id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  city?: string;
  category?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

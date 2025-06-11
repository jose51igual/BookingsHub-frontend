/**
 * Interfaces relacionadas con servicios
 */

export interface BusinessService {
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

export interface ServiceBusiness {
  id: number;
  name: string;
  business_name: string;
  business_address: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  address: string;
  rating?: number;
  image?: string;
  reviewCount?: number;
  isOpen?: boolean;
  isFeatured?: boolean;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category?: string;
  image?: string;
  benefits?: string;
}

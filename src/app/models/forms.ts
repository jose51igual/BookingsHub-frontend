/**
 * Interfaces relacionadas con formularios de registro
 */

export interface BaseFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

export interface ClientFormData extends BaseFormData {
  last_name: string;
  birth_date: string;
}

export interface BusinessFormData extends BaseFormData {
  businessData: {
    name: string;
    address: string;
    city: string;
    category: string;
    description?: string;
  };
}

export type AccountType = 'client' | 'business';

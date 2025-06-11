/**
 * Interfaces relacionadas con usuarios y autenticación
 */

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'cliente' | 'negocio' | 'admin';
  businessId?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

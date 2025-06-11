export interface Employee {
  id?: number;
  business_id: number;
  name: string;
  position?: string;
  specialties?: string[];
  profile_image?: string;
  service_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  startTime: string; // formato HH:mm
  endTime: string;   // formato HH:mm
  breakTime?: {
    start: string;
    end: string;
  };
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  position: string;
  bio?: string;
  available_days: string[];
  work_hours: {
    start: string;
    end: string;
  };
  experience_years?: number;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  position?: string;
  bio?: string;
  available_days?: string[];
  work_hours?: {
    start: string;
    end: string;
  };
  is_active?: boolean;
  experience_years?: number;
}

export interface EmployeeService {
  id: number;
  employee_id: number;
  service_id: number;
  is_primary: boolean; // Si es el empleado principal para este servicio
}

export interface EmployeeAvailability {
  id: number;
  employee_id: number;
  date: string;
  time_slot: string;
  is_available: boolean;
  booking_id?: number; // Si está ocupado por una reserva
}

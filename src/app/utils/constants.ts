/**
 * Constantes compartidas para la aplicación Bookings Hub
 */

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  // Errores generales
  GENERIC: 'Ha ocurrido un error. Inténtalo de nuevo.',
  NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT: 'La operación ha tardado demasiado. Inténtalo de nuevo.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  
  // Errores de carga
  LOAD_DATA: 'Error al cargar datos',
  LOAD_SERVICES: 'No se pudieron cargar los servicios. Intenta de nuevo.',
  LOAD_BUSINESSES: 'Error al cargar los negocios',
  LOAD_BOOKINGS: 'Error al cargar las reservas',
  LOAD_EMPLOYEES: 'Error al cargar los empleados',
  LOAD_ANALYTICS: 'Error al cargar las estadísticas',
  
  // Errores de autenticación
  LOGIN_FAILED: 'Error durante el inicio de sesión',
  REGISTER_FAILED: 'Error durante el registro',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  
  // Errores de formularios
  FORM_INVALID: 'Por favor, corrige los errores en el formulario',
  REQUIRED_FIELDS: 'Todos los campos marcados con * son obligatorios',
  
  // Errores de mapas
  GEOCODING_ERROR: 'Error al geocodificar la dirección',
  MAP_LOAD_ERROR: 'Error al cargar el mapa',
  COORDINATES_ERROR: 'No se pudieron obtener las coordenadas'
};

/**
 * Mensajes de éxito comunes
 */
export const SUCCESS_MESSAGES = {
  // Operaciones generales
  SAVE_SUCCESS: 'Guardado exitosamente',
  UPDATE_SUCCESS: 'Actualizado exitosamente',
  DELETE_SUCCESS: 'Eliminado exitosamente',
  CREATE_SUCCESS: 'Creado exitosamente',
  
  // Autenticación
  LOGIN_SUCCESS: 'Sesión iniciada correctamente',
  REGISTER_SUCCESS: 'Registro completado exitosamente',
  LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
  
  // Específicos
  BOOKING_SUCCESS: 'Reserva realizada exitosamente',
  BOOKING_CANCELLED: 'Reserva cancelada exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  PASSWORD_UPDATED: 'Contraseña actualizada exitosamente',
  SERVICE_CREATED: 'Servicio creado exitosamente',
  SERVICE_UPDATED: 'Servicio actualizado exitosamente',
  EMPLOYEE_CREATED: 'Empleado agregado exitosamente',
  EMPLOYEE_UPDATED: 'Empleado actualizado exitosamente'
};

/**
 * Mensajes de carga
 */
export const LOADING_MESSAGES = {
  DEFAULT: 'Cargando...',
  SAVING: 'Guardando...',
  LOADING_DATA: 'Cargando datos...',
  PROCESSING: 'Procesando...',
  AUTHENTICATING: 'Autenticando...',
  UPLOADING: 'Subiendo archivos...',
  DELETING: 'Eliminando...',
  UPDATING: 'Actualizando...'
};

/**
 * Rutas principales de la aplicación
 */
export const APP_ROUTES = {
  // Rutas de cliente
  HOME: '/inicio',
  SERVICES: '/negocios',
  BOOKINGS: '/mis-reservas',
  PROFILE: '/perfil',
  BUSINESS_DETAIL: (id: number | string) => `/negocio/${id}`,
  SERVICE_DETAIL: (id: number | string) => `/detalle-servicio/${id}`,
  BOOKING_DETAIL: '/reserva',
  
  // Rutas de autenticación
  LOGIN: '/iniciar-sesion',
  REGISTER: '/registro',
  REGISTER_TYPE: '/tipo-registro',
  FORGOT_PASSWORD: '/recuperar-contrasena',
  RESET_PASSWORD: '/restablecer-contrasena',
  
  // Rutas de negocio
  BUSINESS_DASHBOARD: '/panel-negocio',
  BUSINESS_MAIN: '/panel-negocio/principal',
  BUSINESS_BOOKINGS: '/panel-negocio/reservas',
  BUSINESS_SERVICES: '/panel-negocio/servicios',
  BUSINESS_AVAILABILITY: '/panel-negocio/disponibilidad',
  BUSINESS_EMPLOYEES: '/panel-negocio/empleados',
  BUSINESS_ANALYTICS: '/panel-negocio/estadisticas',
  BUSINESS_SETTINGS: '/panel-negocio/configuracion',
  BUSINESS_PROFILE: '/panel-negocio/perfil',
  SERVICE_CREATE: '/panel-negocio/crear-servicio',
  SERVICE_EDIT: (id: number | string) => `/panel-negocio/editar-servicio/${id}`,
  
  // Rutas de reseñas
  CREATE_REVIEW: '/reviews/create',
  REVIEWS_LIST: (businessId: number | string) => `/reviews/business/${businessId}`
};

/**
 * Roles de usuario
 */
export enum UserRole {
  CLIENT = 'cliente',
  BUSINESS = 'negocio',
  ADMIN = 'admin'
}

/**
 * Estados de reserva
 */
export enum BookingStatus {
  PENDING = 'pendiente',
  CONFIRMED = 'confirmada',
  COMPLETED = 'completada',
  CANCELED = 'cancelada'
}

/**
 * Días de la semana
 */
export enum WeekDay {
  MONDAY = 'Lunes',
  TUESDAY = 'Martes',
  WEDNESDAY = 'Miércoles',
  THURSDAY = 'Jueves',
  FRIDAY = 'Viernes',
  SATURDAY = 'Sábado',
  SUNDAY = 'Domingo'
}

/**
 * Días de la semana para formularios de horarios
 */
export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

/**
 * Categorías de negocios unificadas
 * Estas categorías deben coincidir con las del backend
 */
export const BUSINESS_CATEGORIES = [
  { id: 'belleza-y-cuidado-personal', name: 'Belleza y cuidado personal', icon: 'cut-outline' },
  { id: 'salud-y-bienestar', name: 'Salud y bienestar', icon: 'medical-outline' },
  { id: 'consultoria', name: 'Consultoría', icon: 'business-outline' },
  { id: 'educacion', name: 'Educación', icon: 'school-outline' },
  { id: 'tecnologia', name: 'Tecnología', icon: 'hardware-chip-outline' },
  { id: 'reparaciones', name: 'Reparaciones', icon: 'build-outline' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles-outline' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: 'musical-notes-outline' },
  { id: 'deportes', name: 'Deportes', icon: 'fitness-outline' },
  { id: 'otros', name: 'Otros', icon: 'ellipsis-horizontal-outline' }
] as const;

/**
 * Mapeo de categorías del backend al frontend
 * Para manejar diferencias en nombres entre backend y frontend
 */
export const CATEGORY_MAPPING: Record<string, string> = {
  // Categorías que ya están en formato correcto (deben mapearse a sí mismas)
  'belleza-y-cuidado-personal': 'belleza-y-cuidado-personal',
  'salud-y-bienestar': 'salud-y-bienestar',
  'consultoria': 'consultoria',
  'educacion': 'educacion',
  'tecnologia': 'tecnologia',
  'reparaciones': 'reparaciones',
  'limpieza': 'limpieza',
  'entretenimiento': 'entretenimiento',
  'deportes': 'deportes',
  'otros': 'otros',

  // Variaciones de "Belleza y cuidado personal"
  'belleza y cuidado personal': 'belleza-y-cuidado-personal',
  'belleza': 'belleza-y-cuidado-personal',
  'peluqueria': 'belleza-y-cuidado-personal',
  'barberia': 'belleza-y-cuidado-personal',
  'spa': 'belleza-y-cuidado-personal',
  'estetica': 'belleza-y-cuidado-personal',
  
  // Variaciones de "Salud y bienestar"
  'salud y bienestar': 'salud-y-bienestar',
  'salud': 'salud-y-bienestar',
  'dental': 'salud-y-bienestar',
  'masajes': 'salud-y-bienestar',
  'medicina': 'salud-y-bienestar',
  
  // Variaciones de "Consultoría"
  'asesoria': 'consultoria',
  'negocios': 'consultoria',
  
  // Variaciones de "Educación"
  'clases': 'educacion',
  'tutoria': 'educacion',
  
  // Variaciones de "Tecnología"
  'informatica': 'tecnologia',
  'software': 'tecnologia',
  
  // Variaciones de "Deportes"
  'fitness': 'deportes',
  'gimnasio': 'deportes',
  
  // Otros
  'general': 'otros'
};

/**
 * Función para normalizar categorías del backend
 */
export function normalizeCategory(category: string): string {
  if (!category) return 'otros';
  
  const normalized = category.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] || 'otros';
}

/**
 * Duración de elementos en cache (en ms)
 */
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutos
  MEDIUM: 30 * 60 * 1000, // 30 minutos
  LONG: 24 * 60 * 60 * 1000 // 1 día
};

/**
 * Mensajes comunes de la aplicación
 */
export const APP_MESSAGES = {
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  NETWORK_ERROR: 'Error de conexión. Por favor, comprueba tu conexión a internet.',
  GENERIC_ERROR: 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.',
  BOOKING_SUCCESS: 'Reserva realizada con éxito.',
  BOOKING_UPDATE: 'Reserva actualizada correctamente.',
  BOOKING_CANCEL: 'Reserva cancelada correctamente.',
  PROFILE_UPDATE: 'Perfil actualizado correctamente.',
  PASSWORD_RESET: 'Se ha enviado un enlace para restablecer tu contraseña. Revisa tu correo electrónico.'
};

/**
 * Especialidades para empleados
 */
export const EMPLOYEE_SPECIALTIES = [
  'Corte de cabello',
  'Coloración',
  'Peinados',
  'Manicure',
  'Pedicure',
  'Masajes',
  'Tratamientos faciales',
  'Depilación',
  'Maquillaje',
  'Cejas y pestañas',
  'Fisioterapia',
  'Nutrición',
  'Entrenamiento personal',
  'Consultoría',
  'Reparación',
  'Instalación',
  'Otros'
] as const;

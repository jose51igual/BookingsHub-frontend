/**
 * Archivo índice unificado para todas las utilidades
 * Esto facilita la importación y evita importaciones dispersas
 */

// Exportar todas las utilidades comunes
export * from './common.utils';

// Exportar utilidades específicas de rating
export * from './rating.utils';

// Exportar utilidades de mapas
export * from './map-utils';
export * from './map-coordinates.utils';

// Exportar constantes
export * from './constants';

// Exportar utilidades de formularios
export * from './form.utils';

// Exportar utilidades de estado de reservas (evitar conflicto con BookingStatus enum)
export {
  type StatusColor,
  type BookingStatus as BookingStatusType,
  statusColorMap,
  statusTextMap,
  getStatusColor,
  getStatusText,
  mapBackendStatusToFrontend,
  mapBookingStatus,
  availableStatuses,
  isValidStatus
} from './status.utils';

// Alias para facilitar la importación
export { getStatusColor as getBookingStatusColor } from './status.utils';

// Exportar utilidades de fechas y tiempo
export * from './date.utils';

// Alias para facilitar la importación
export { formatTime24Hour as formatTime, formatDate as formatDateUtil } from './date.utils';

// Exportar utilidades de usuario y perfiles (evitar conflicto con isValidEmail)
export {
  getInitials,
  formatDisplayName,
  getRoleDisplayText,
  handleAuthError,
  isValidPhone,
  formatPhoneNumber,
  generateAvatarUrl,
  validatePasswordStrength,
  formatContactInfo
} from './user.utils';

// Exportar utilidades de alertas y modales
export * from './alert.utils';

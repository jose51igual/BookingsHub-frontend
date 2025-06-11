/**
 * Tipos para manejar estados de reservas
 */
export type StatusColor = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'rechazada';
export type FilterStatus = BookingStatus | 'all';

/**
 * Mapeo de estados de reserva a colores de Ionic
 */
export const statusColorMap: Record<string, StatusColor> = {
  'pendiente': 'warning',
  'confirmada': 'success',
  'completada': 'primary',
  'cancelada': 'danger',
  'rechazada': 'danger'
};

/**
 * Mapeo de estados de reserva a textos legibles
 */
export const statusTextMap: Record<string, string> = {
  'pendiente': 'Pendiente',
  'confirmada': 'Confirmada',
  'completada': 'Completada',
  'cancelada': 'Cancelada',
  'rechazada': 'Rechazada'
};

/**
 * Obtiene el color para un estado de reserva
 */
export function getStatusColor(status: string): StatusColor {
  return statusColorMap[status.toLowerCase()] || 'medium';
}

/**
 * Obtiene el texto legible para un estado de reserva
 */
export function getStatusText(status: string): string {
  return statusTextMap[status.toLowerCase()] || status;
}

/**
 * Convierte estados del backend al formato estándar del frontend
 */
export function mapBackendStatusToFrontend(status: string): BookingStatus {
  const normalizedStatus = status.toLowerCase();
  
  // Mapear diferentes formatos de estado que pueden venir del backend
  switch (normalizedStatus) {
    case 'pending':
    case 'pendiente':
      return 'pendiente';
    case 'confirmed':
    case 'confirmada':
      return 'confirmada';
    case 'completed':
    case 'completada':
      return 'completada';
    case 'cancelled':
    case 'canceled':
    case 'cancelada':
      return 'cancelada';
    case 'rejected':
    case 'rechazada':
      return 'rechazada';
    default:
      return 'pendiente';
  }
}

/**
 * Alias para mapBackendStatusToFrontend
 */
export const mapBookingStatus = mapBackendStatusToFrontend;

/**
 * Lista de estados disponibles para reservas
 */
export const availableStatuses: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada', label: 'Canceladas' }
];

/**
 * Valida si un estado es válido
 */
export function isValidStatus(status: string): boolean {
  return Object.keys(statusTextMap).includes(status.toLowerCase());
}

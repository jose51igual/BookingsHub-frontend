/**
 * Utilidades para formateo de fechas y tiempo
 */

/**
 * Formatea una fecha en formato legible en español
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    
    return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
  } catch {
    return typeof dateString === 'string' ? dateString : '';
  }
}

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 */
export function formatDateShort(dateString: string | Date): string {
  return formatDate(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha para input HTML (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | Date): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return typeof dateString === 'string' ? dateString : '';
  }
}

/**
 * Formatea una hora en formato 12 horas (HH:MM AM/PM)
 */
export function formatTime12Hour(timeString: string): string {
  if (!timeString) return '';
  
  try {
    // Manejar tanto timestamps como strings de hora
    let time: string;
    
    if (timeString.includes('T') || timeString.includes(' ')) {
      // Es un timestamp completo
      const date = new Date(timeString);
      time = date.toTimeString().split(' ')[0];
    } else {
      // Es solo una hora (HH:MM o HH:MM:SS)
      time = timeString;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString;
  }
}

/**
 * Formatea una hora en formato 24 horas (HH:MM)
 */
export function formatTime24Hour(timeString: string): string {
  if (!timeString) return '';
  
  try {
    // Manejar tanto timestamps como strings de hora
    if (timeString.includes('T') || timeString.includes(' ')) {
      // Es un timestamp completo
      const date = new Date(timeString);
      return date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    } else {
      // Es solo una hora, asegurar formato HH:MM
      const timeParts = timeString.split(':');
      const hours = timeParts[0].padStart(2, '0');
      const minutes = (timeParts[1] || '00').padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch {
    return timeString;
  }
}

/**
 * Combina fecha y hora en un formato legible
 */
export function formatDateTime(date: string | Date, time?: string): string {
  const formattedDate = formatDate(date);
  if (!time) return formattedDate;
  
  const formattedTime = formatTime12Hour(time);
  return `${formattedDate} a las ${formattedTime}`;
}

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtiene la hora actual en formato HH:MM
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().substring(0, 5);
}

/**
 * Calcula la diferencia entre fechas en días
 */
export function daysDifference(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: string | Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.getDate() === checkDate.getDate() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getFullYear() === checkDate.getFullYear();
}

/**
 * Verifica si una fecha es del pasado
 */
export function isPastDate(date: string | Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * Verifica si una fecha es del futuro
 */
export function isFutureDate(date: string | Date): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate > today;
}

/**
 * Determina si un negocio está abierto basado en diferentes criterios
 */
export function isBusinessOpen(business: any): boolean {
  // Si el negocio tiene is_open definido explícitamente, usarlo
  if (business.is_open !== undefined && business.is_open !== null) {
    // Manejar diferentes tipos de datos del backend
    if (typeof business.is_open === 'boolean') {
      return business.is_open;
    }
    if (typeof business.is_open === 'number') {
      return business.is_open === 1;
    }
    if (typeof business.is_open === 'string') {
      return business.is_open.toLowerCase() === 'true' || business.is_open === '1';
    }
  }

  // Si no hay información específica de estado, verificar horarios (si los hay)
  if (business.working_hours || business.schedule) {
    return isOpenBySchedule(business.working_hours || business.schedule);
  }

  // Si es un negocio activo/verificado, asumir que está abierto en horario comercial
  if (business.is_active !== false && business.status !== 'inactive') {
    return isBusinessHours();
  }

  // Por defecto, asumir que está abierto (para evitar que todo aparezca cerrado)
  return true;
}

/**
 * Verifica si es horario comercial general (9 AM - 6 PM, Lun-Sab)
 */
export function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  // Lunes a Sábado (1-6), 9 AM a 6 PM
  return day >= 1 && day <= 6 && hour >= 9 && hour < 18;
}

/**
 * Verifica si está abierto según horarios específicos
 */
export function isOpenBySchedule(schedule: any): boolean {
  if (!schedule) return true;
  
  const now = new Date();
  const day = now.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[day];
  
  const daySchedule = schedule[currentDay];
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Biblioteca de utilidades para la aplicación Bookings Hub
 * Contiene funciones reutilizables y helpers para uso en la aplicación
 */

/**
 * Formatea una fecha en el formato local español
 * @param date Fecha a formatear
 * @param includeTime Si debe incluir la hora
 * @returns Fecha formateada
 */
export function formatLocalDate(date: Date | string, includeTime = false): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('es-ES', options);
}

/**
 * Formatea un precio en euros
 * @param price Precio a formatear
 * @returns Precio formateado
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

/**
 * Formatea un rating con 1 decimal
 * @param rating Rating a formatear
 * @returns Rating formateado
 */
export function formatRating(rating: number | string | undefined): string {
  if (!rating || rating === 0) return '0.0';
  
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (isNaN(numericRating)) return '0.0';
  
  return numericRating.toFixed(1);
}

/**
 * Genera un texto truncado con puntos suspensivos
 * @param text Texto a truncar
 * @param maxLength Longitud máxima
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Genera un color aleatorio en hexadecimal
 * @returns Color hexadecimal
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Calcula el tiempo restante entre dos fechas en formato legible
 * @param targetDate Fecha objetivo
 * @returns Tiempo restante en formato legible
 */
export function timeUntil(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  
  const diffInMs = target.getTime() - now.getTime();
  if (diffInMs <= 0) return 'Finalizado';
  
  const diffInSecs = Math.floor(diffInMs / 1000);
  const days = Math.floor(diffInSecs / 86400);
  const hours = Math.floor((diffInSecs % 86400) / 3600);
  const minutes = Math.floor((diffInSecs % 3600) / 60);
  
  if (days > 0) {
    return `${days} día${days > 1 ? 's' : ''} y ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
}

/**
 * Valida si un email tiene formato correcto
 * @param email Email a validar
 * @returns true si el email es válido
 */
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

/**
 * Genera un slug a partir de un texto
 * @param text Texto para generar slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâãå]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calcula tiempo relativo desde una fecha
 * @param date - Fecha como string
 * @returns String con tiempo relativo (ej: "Hace 2 días")
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
  return `Hace ${Math.floor(diffInDays / 365)} años`;
}

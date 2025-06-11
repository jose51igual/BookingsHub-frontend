/**
 * Utilidades para manejo de perfiles y usuarios
 */

import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

/**
 * Obtiene las iniciales de un nombre completo
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'N/A';
  
  const names = name.trim().split(' ').filter(n => n.length > 0);
  
  if (names.length === 0) return 'N/A';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  // Tomar primera letra del primer nombre y primera letra del último nombre
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
}

/**
 * Formatea un nombre para mostrar (capitaliza primera letra de cada palabra)
 */
export function formatDisplayName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Obtiene el texto legible para un rol de usuario
 */
export function getRoleDisplayText(role: string): string {
  const roleMap: Record<string, string> = {
    'cliente': 'Cliente',
    'negocio': 'Propietario de Negocio',
    'admin': 'Administrador',
    'employee': 'Empleado'
  };
  
  return roleMap[role?.toLowerCase()] || 'Usuario';
}

/**
 * Maneja errores de autenticación de forma centralizada
 * Cierra sesión y redirige al login
 */
export async function handleAuthError(authService: any, router: Router): Promise<void> {
  try {
    await firstValueFrom(authService.logout());
    await router.navigateByUrl('/login');
  } catch (logoutError) {
    console.error('Error during logout after auth error', logoutError);
    // Forzar navegación aunque falle el logout
    await router.navigateByUrl('/login');
  }
}

/**
 * Valida si un email tiene formato válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida si un teléfono tiene formato válido (básico)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Permitir números con o sin espacios, guiones, paréntesis
  const phoneRegex = /^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remover caracteres no numéricos excepto el +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si tiene código de país (+), formatear con espacios
  if (cleaned.startsWith('+')) {
    const countryCode = cleaned.substring(0, 3);
    const number = cleaned.substring(3);
    
    if (number.length >= 8) {
      // Formato: +XX XXXX XXXX
      return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
    }
  }
  
  // Para números locales, formatear según la longitud
  if (cleaned.length === 10) {
    // Formato: (XXX) XXX-XXXX
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone; // Retornar original si no se puede formatear
}

/**
 * Genera una URL de avatar por defecto usando las iniciales
 */
export function generateAvatarUrl(name: string, size: number = 100): string {
  const initials = getInitials(name);
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', 'FF8A80', '81C784'];
  
  // Usar hash simple del nombre para consistencia en el color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const bgColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${bgColor}&color=fff&bold=true`;
}

/**
 * Valida fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password) {
    return { isValid: false, score: 0, feedback: ['La contraseña es requerida'] };
  }
  
  if (password.length < 6) {
    feedback.push('Debe tener al menos 6 caracteres');
  } else {
    score += 1;
  }
  
  if (password.length >= 8) {
    score += 1;
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Debe contener al menos una letra minúscula');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Debe contener al menos una letra mayúscula');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Debe contener al menos un número');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Debe contener al menos un carácter especial');
  }
  
  const isValid = score >= 3 && password.length >= 6;
  
  return { isValid, score, feedback };
}

/**
 * Formatea la información de contacto para mostrar
 */
export function formatContactInfo(contact: {
  email?: string;
  phone?: string;
  address?: string;
}): { icon: string; value: string; type: string }[] {
  const result: { icon: string; value: string; type: string }[] = [];
  
  if (contact.email) {
    result.push({
      icon: 'mail-outline',
      value: contact.email,
      type: 'email'
    });
  }
  
  if (contact.phone) {
    result.push({
      icon: 'call-outline',
      value: formatPhoneNumber(contact.phone),
      type: 'phone'
    });
  }
  
  if (contact.address) {
    result.push({
      icon: 'location-outline',
      value: contact.address,
      type: 'address'
    });
  }
  
  return result;
}

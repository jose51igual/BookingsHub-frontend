/**
 * Archivo índice para exportar todos los servicios
 * Esto facilita la importación y descubrimiento de servicios
 */

// Servicios de autenticación
export { AuthSignalService } from './auth/auth-signal.service';
export { GoogleAuthService } from './auth/google-auth.service';

// Servicios core
export { LoadingSignalService } from './core/loading-signal.service';
export { NotificationService } from './core/notification.service';
export { BaseDataLoaderService } from './core/base-data-loader.service';

// Servicios de utilidades
export { StorageService } from './utils/storage.service';
export { GeoService } from './utils/geo.service';

// Servicios de API
export * from './api/index';

/**
 * Configuración de la aplicación
 * Proporciona una interfaz para la configuración centralizada
 */

import { InjectionToken } from '@angular/core';

/**
 * Interfaz para la configuración global de la aplicación
 */
export interface AppConfig {
  /**
   * Nombre de la aplicación
   */
  appName: string;
  
  /**
   * URL de la API
   */
  apiUrl: string;
  
  /**
   * Versión de la aplicación
   */
  version: string;
  
  /**
   * Si estamos en modo producción
   */
  production: boolean;
  
  /**
   * Entorno actual
   */
  environment: 'development' | 'staging' | 'production';
  
  /**
   * Configuración de Google
   */
  google: {
    clientId: string;
    mapsApiKey: string;
    geocodeApiKey?: string;
  };
  
  /**
   * Nivel de logging
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  /**
   * DSN para Sentry si está configurado
   */
  sentryDsn?: string;
  
  /**
   * Si se deben habilitar los mocks para desarrollo
   */
  enableMocks?: boolean;
  
  /**
   * Tiempo de caducidad del token en milisegundos
   */
  tokenExpirationTime?: number;
}

/**
 * Token de inyección para la configuración de la aplicación
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

/**
 * Configuración por defecto de la aplicación
 * Se puede sobrescribir en providers.ts
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Bookings Hub',
  apiUrl: 'http://localhost:3000/api',
  version: '1.0.0',
  production: false,
  environment: 'development',
  google: {
    clientId: '318468418060-u333rd9caq6nandaqc8s2rh9eeljl573.apps.googleusercontent.com',
    mapsApiKey: 'AIzaSyBWjBzljWH92Nrad0s9ICNBFf1mDjcVgCs',
    geocodeApiKey: ''
  },
  logLevel: 'debug',
  enableMocks: true,
  tokenExpirationTime: 24 * 60 * 60 * 1000 // 24 horas
};

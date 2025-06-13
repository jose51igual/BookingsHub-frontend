/**
 * Entorno de desarrollo local para la aplicación
 * Este archivo contiene la configuración específica para el entorno de desarrollo.
 * Asegúrate de reemplazar las claves API y otros valores sensibles antes de desplegar.
 */

export const environment = {
  production: false,
  stage: 'development',
  apiUrl: 'http://localhost:3000/api',
  googleClientId: '475066989409-0ouas1mfjhpvqvtlh1ik3v2qm98q5q4f.apps.googleusercontent.com',
  googleMapsApiKey: 'AIzaSyCD-VXgLmnUYH0PbvIgn2hIsnKm-77K_W8',
  geocodeApiKey: 'AIzaSyCD-VXgLmnUYH0PbvIgn2hIsnKm-77K_W8',
  logLevel: 'debug',
  sentryDsn: '',
  version: '1.0.0-dev',
  enableMocks: false
};

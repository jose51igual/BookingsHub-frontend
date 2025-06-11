/**
 * Entorno de producción para la aplicación
 * 
 * IMPORTANTE: Este archivo será generado automáticamente por GitHub Actions
 * durante el proceso de despliegue. No edites manualmente las URLs de producción.
 */
export const environment = {
  production: true,
  stage: 'production',
  apiUrl: 'https://213.165.93.50:3000/api', // Será reemplazado por GitHub Actions
  googleClientId: '318468418060-u333rd9caq6nandaqc8s2rh9eeljl573.apps.googleusercontent.com',
  googleMapsApiKey: '', // Se configurará desde GitHub Secrets
  geocodeApiKey: '', // Se configurará desde GitHub Secrets
  logLevel: 'error',
  sentryDsn: '', // Se configurará desde GitHub Secrets
  version: '1.0.0',
  enableMocks: false
};

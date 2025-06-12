/**
 * Entorno de producción para la aplicación
 * 
 * IMPORTANTE: Este archivo será generado automáticamente por GitHub Actions
 * durante el proceso de despliegue. No edites manualmente las URLs de producción.
 */
export const environment = {
  production: true,
  stage: 'production',
  apiUrl: 'https://api.bookingshub.es/api',
  googleClientId: '', // Se configurará desde GitHub Secrets
  googleMapsApiKey: '', // Se configurará desde GitHub Secrets
  geocodeApiKey: '', // Se configurará desde GitHub Secrets
  logLevel: 'error',
  sentryDsn: '', // Se configurará desde GitHub Secrets
  version: '1.0.0',
  enableMocks: false
};

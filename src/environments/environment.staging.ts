/**
 * Entorno de QA/Staging para pruebas
 */
export const environment = {
  production: true,
  stage: 'staging',
  apiUrl: 'https://your-staging-domain.com/api', // Será reemplazado por GitHub Actions
  googleClientId: '318468418060-u333rd9caq6nandaqc8s2rh9eeljl573.apps.googleusercontent.com',
  googleMapsApiKey: '', // Se configurará desde GitHub Secrets
  geocodeApiKey: '', // Se configurará desde GitHub Secrets
  logLevel: 'warn',
  sentryDsn: '', // Se configurará desde GitHub Secrets
  version: '1.0.0-staging',
  enableMocks: false
};

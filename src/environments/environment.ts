/**
 * Entorno de desarrollo local para la aplicación
 * 
 * CONFIGURACIÓN DE GOOGLE MAPS:
 * 1. Obtén una API key en Google Cloud Console
 * 2. Habilita "Maps JavaScript API" 
 * 3. Reemplaza 'YOUR_GOOGLE_MAPS_API_KEY' con tu API key real
 * 4. Para más detalles ver: docs/google-maps-setup.md
 */
export const environment = {
  production: false,
  stage: 'development',
  apiUrl: 'http://localhost:3000/api', // IP local para conexión desde dispositivo móvil
  googleClientId: '318468418060-u333rd9caq6nandaqc8s2rh9eeljl573.apps.googleusercontent.com',
  googleMapsApiKey: '', // Temporalmente vacío para evitar errores
  geocodeApiKey: '',
  logLevel: 'debug',
  sentryDsn: '',
  version: '1.0.0-dev',
  enableMocks: false // Deshabilitar mocks - usar solo API
};

import type { CapacitorConfig } from '@capacitor/cli';
import { environment } from './src/environments/environment';

const config: CapacitorConfig = {
  appId: 'io.ionic.bookingshub',
  appName: 'Bookings Hub',
  webDir: 'dist/app',
  server: {
    androidScheme: 'https',
    // Configuración para desarrollo en dispositivos
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#222428",
      showSpinner: false
    },
    CapacitorGoogleMaps: {
      apiKey: environment.googleMapsApiKey, // Reemplazar con tu clave de API
    }
    // GoogleAuth deshabilitado temporalmente para evitar crashes
    // GoogleAuth: {
    //   scopes: ["profile", "email"],
    //   serverClientId: "YOUR_SERVER_CLIENT_ID",
    //   forceCodeForRefreshToken: true
    // }
  }
};

export default config;

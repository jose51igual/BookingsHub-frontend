import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.bookingshub',
  appName: 'Bookings Hub',
  webDir: 'dist/app',
  server: {
    androidScheme: 'https',
    // Configuración para desarrollo en dispositivos
    cleartext: true
  },  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#222428",
      showSpinner: false
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

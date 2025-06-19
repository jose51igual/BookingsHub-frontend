import type { CapacitorConfig } from '@capacitor/cli';
import { environment } from './src/environments/environment';

const config: CapacitorConfig = {
  appId: 'io.ionic.bookingshub',
  appName: 'Bookings Hub',
  webDir: 'dist/app',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#222428",
      showSpinner: false
    },
    CapacitorGoogleMaps: {
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#667eea'
    }
  }
};

export default config;

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { defineCustomElements } from '@ionic/core/loader';

// Importaciones para iconos de Ionic
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { APP_PROVIDERS } from './app/shared/providers';

// Importar el interceptor de autenticación
import { authInterceptor } from './app/interceptors/auth.interceptor.function';

// Registrar todos los iconos de Ionic disponibles
const ioniconsToRegister: Record<string, string> = {};
Object.keys(allIcons).forEach(key => {
  ioniconsToRegister[key] = (allIcons as any)[key];
});
addIcons(ioniconsToRegister);

// Registrar datos de localización para español
registerLocaleData(localeEs, 'es-ES');

if (environment.production) {
  enableProdMode();
}

// Define una función para inicializar la aplicación
const initApp = async () => {
  try {
    await defineCustomElements(window);    
    await bootstrapApplication(AppComponent, {
      providers: [
        { provide: LOCALE_ID, useValue: 'es-ES' },
        // Aseguramos que HttpClient esté disponible para toda la aplicación
        provideHttpClient(
          withInterceptors([authInterceptor])
        ),
        // Configuramos Ionic con el proveedor standalone
        provideIonicAngular({
          mode: 'md',
          animated: true,
          scrollAssist: true,
          inputShims: true
        }),
        // Incluimos todos los proveedores globales de la aplicación
        ...APP_PROVIDERS,
        // Configuramos el router
        provideRouter(
          routes,
          withViewTransitions(),
          withComponentInputBinding()
        )
      ]
    });
  } catch (err) {
    console.error('Error al iniciar la aplicación:', err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initApp());
} else {
  initApp();
}
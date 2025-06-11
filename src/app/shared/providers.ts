/**
 * Configuración centralizada de providers para la aplicación
 * Siguiendo las mejores prácticas de Angular 19 con Ionic 8 en modo standalone
 */

import { EnvironmentProviders, Provider, importProvidersFrom, CUSTOM_ELEMENTS_SCHEMA, provideZoneChangeDetection } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { authInterceptor } from '../interceptors/auth.interceptor.function';
import { provideAnimations } from '@angular/platform-browser/animations';

// Nuevos imports para Ionic 8 standalone
import { IonicRouteStrategy } from '@ionic/angular/standalone';

/**
 * Array de providers globales para la aplicación
 */
export const APP_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  importProvidersFrom(IonicStorageModule.forRoot({
    name: 'bookings_hub_db'
  })),
  provideHttpClient(
    withInterceptors([authInterceptor]),
    withInterceptorsFromDi()
  ),
  provideAnimations(),
  provideZoneChangeDetection({ eventCoalescing: true })
];

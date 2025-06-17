import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StorageService } from '@services/index';
import { environment } from '../../environments/environment';

export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const storageService = inject(StorageService);
  const router = inject(Router);

  // Solo interceptamos solicitudes a nuestra API
  if (!request.url.includes(environment.apiUrl)) {
    return next(request);
  }

  // Rutas que NO requieren autenticación
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/businesses',
    '/api/businesses/featured',
    '/api/businesses/search',
    '/api/businesses/category/'
  ];

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/api/businesses' && request.method === 'GET' && request.url.endsWith('/api/businesses')) {
      return true;
    }
    return request.url.includes(route);
  });

  // Si es una ruta pública, no añadir token
  if (isPublicRoute) {
    return next(request);
  }

  // Para rutas protegidas, añadir token si existe
  return from(storageService.get('auth_token')).pipe(
    switchMap(token => {
      
      if (token) {
        const authReq = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        return next(authReq);
      } else {
        return next(request);
      }
    }),
    catchError((error) => {
      if (error.status === 401) {
        // No redirigir al login si es un error de contraseña incorrecta en perfil
        const isProfilePasswordError = request.url.includes('/users/profile') && 
                                      request.method === 'PUT' &&
                                      error.error?.message?.includes('Contraseña actual incorrecta');
        
        if (!isProfilePasswordError) {
          storageService.remove('auth_token');
          storageService.remove('user_data');
          router.navigate(['/iniciar-sesion'], { 
            queryParams: { session_expired: 'true' } 
          });
        }
      }
      return throwError(() => error);
    })
  );
}

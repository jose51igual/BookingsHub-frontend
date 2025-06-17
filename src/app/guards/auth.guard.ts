import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthSignalService } from '@services/index';

/**
 * Guard de autenticación que maneja todos los casos de protección de rutas
 */
export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthSignalService);
  const router = inject(Router);

  // Obtener configuración de la ruta
  const config = {
    requireAuth: route.data?.['requireAuth'] ?? true,
    requiredRole: route.data?.['requiredRole'] || null,
    redirectTo: route.data?.['redirectTo'] || '/iniciar-sesion',
    allowUnauthenticated: route.data?.['allowUnauthenticated'] || false,
    redirectAuthenticated: route.data?.['redirectAuthenticated'] || false,
    roleRedirect: route.data?.['roleRedirect'] || false,
    clientRedirect: route.data?.['clientRedirect'] || '/inicio',
    businessRedirect: route.data?.['businessRedirect'] || '/panel-negocio/principal'
  };

  if (authService.isLoading) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(checkAccess());
      }, 1000);
    });
  }

  return checkAccess();

  function checkAccess(): boolean {
    const isAuthenticated = authService.isAuthenticated;
    const user = authService.user;
    const userRole = user?.role;

    // Caso 1: Redirección automática según rol (para ruta raíz)
    if (config.roleRedirect) {
      if (!isAuthenticated) {
        router.navigate(['/iniciar-sesion']);
        return false;
      }

      if (userRole === 'cliente') {
        router.navigate([config.clientRedirect]);
        return false;
      } else if (userRole === 'negocio') {
        router.navigate([config.businessRedirect]);
        return false;
      } else {
        router.navigate(['/home']);
        return false;
      }
    }

    // Caso 2: Redireccionar usuarios autenticados (páginas de auth)
    if (config.redirectAuthenticated && isAuthenticated) {
      if (userRole === 'cliente') {
        router.navigate([config.clientRedirect]);
        return false;
      } else if (userRole === 'negocio') {
        router.navigate([config.businessRedirect]);
        return false;
      }
    }

    // Caso 3: Ruta pública (no requiere autenticación)
    if (config.allowUnauthenticated) {
      return true;
    }

    // Caso 4: Requiere autenticación
    if (config.requireAuth && !isAuthenticated) {
      router.navigate([config.redirectTo]);
      return false;
    }

    // Caso 5: Requiere rol específico
    if (config.requiredRole && userRole !== config.requiredRole) {
      if (!isAuthenticated) {
        router.navigate(['/iniciar-sesion']);
        return false;
      }

      // Redireccionar al área correcta según el rol
      if (userRole === 'cliente' && config.requiredRole === 'negocio') {
        router.navigate([config.clientRedirect]);
        return false;
      } else if (userRole === 'negocio' && config.requiredRole === 'cliente') {
        router.navigate([config.businessRedirect]);
        return false;
      } else {
        router.navigate(['/iniciar-sesion']);
        return false;
      }
    }

    return true;
  }
};

export const clientGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRole: 'cliente' };
  return AuthGuard(route, state);
};

export const businessGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRole: 'negocio' };
  return AuthGuard(route, state);
};

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, roleRedirect: true };
  return AuthGuard(route, state);
};

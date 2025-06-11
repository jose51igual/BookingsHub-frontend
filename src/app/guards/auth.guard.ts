import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthSignalService } from '@services/index';

/**
 * Guard de autenticación consolidado que maneja todos los casos de protección de rutas
 * 
 * Configuraciones disponibles en route.data:
 * - requireAuth: boolean (default: true) - Requiere autenticación
 * - requiredRole: 'cliente' | 'negocio' | null - Rol específico requerido
 * - redirectTo: string - Ruta de redirección personalizada para usuarios no autorizados
 * - allowUnauthenticated: boolean - Permite acceso sin autenticación (para rutas públicas)
 * - redirectAuthenticated: boolean - Redirije usuarios autenticados (para páginas de auth)
 * - roleRedirect: boolean - Redirije automáticamente según el rol del usuario
 * - clientRedirect: string - Ruta de redirección para clientes
 * - businessRedirect: string - Ruta de redirección para negocios
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

  // Si el servicio está cargando, esperar un momento
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
    const currentPath = route.routeConfig?.path || '';

    // Solo loguear para rutas importantes o cuando hay problemas
    const shouldLog = config.roleRedirect || 
                     config.redirectAuthenticated || 
                     (!config.allowUnauthenticated && !isAuthenticated) ||
                     (config.requiredRole && userRole !== config.requiredRole);

    if (shouldLog) {
      console.log('🔐 AuthGuard Debug:', {
        path: currentPath,
        isAuthenticated,
        userRole,
        config: {
          requireAuth: config.requireAuth,
          requiredRole: config.requiredRole,
          allowUnauthenticated: config.allowUnauthenticated,
          roleRedirect: config.roleRedirect
        }
      });
    }

    // Caso 1: Redirección automática según rol (para ruta raíz)
    if (config.roleRedirect) {
      console.log('🔀 AuthGuard: Redirección automática según rol');
      if (!isAuthenticated) {
        console.log('❌ AuthGuard: Usuario no autenticado, redirigiendo a login');
        router.navigate(['/iniciar-sesion']);
        return false;
      }

      if (userRole === 'cliente') {
        console.log('👤 AuthGuard: Cliente detectado, redirigiendo a inicio');
        router.navigate([config.clientRedirect]);
        return false;
      } else if (userRole === 'negocio') {
        console.log('🏢 AuthGuard: Negocio detectado, redirigiendo a panel');
        router.navigate([config.businessRedirect]);
        return false;
      } else {
        console.log('❓ AuthGuard: Rol desconocido, redirigiendo a login');
        router.navigate(['/iniciar-sesion']);
        return false;
      }
    }

    // Caso 2: Redireccionar usuarios autenticados (páginas de auth)
    if (config.redirectAuthenticated && isAuthenticated) {
      console.log('🚫 AuthGuard: Usuario autenticado intentando acceder a página de auth');
      if (userRole === 'cliente') {
        console.log('👤 AuthGuard: Redirigiendo cliente autenticado a inicio');
        router.navigate([config.clientRedirect]);
        return false;
      } else if (userRole === 'negocio') {
        console.log('🏢 AuthGuard: Redirigiendo negocio autenticado a panel');
        router.navigate([config.businessRedirect]);
        return false;
      }
    }

    // Caso 3: Ruta pública (no requiere autenticación)
    if (config.allowUnauthenticated) {
      console.log('🌐 AuthGuard: Ruta pública, acceso permitido');
      return true;
    }

    // Caso 4: Requiere autenticación
    if (config.requireAuth && !isAuthenticated) {
      console.log('🔒 AuthGuard: Requiere autenticación, redirigiendo a login');
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

// Guards específicos para compatibilidad (funcionan como aliases)
export const clientGuard: CanActivateFn = (route, state) => {
  // Configurar datos de ruta para cliente
  route.data = { ...route.data, requiredRole: 'cliente' };
  return AuthGuard(route, state);
};

export const businessGuard: CanActivateFn = (route, state) => {
  // Configurar datos de ruta para negocio
  route.data = { ...route.data, requiredRole: 'negocio' };
  return AuthGuard(route, state);
};

export const roleRedirectGuard: CanActivateFn = (route, state) => {
  // Configurar datos de ruta para redirección automática
  route.data = { ...route.data, roleRedirect: true };
  return AuthGuard(route, state);
};

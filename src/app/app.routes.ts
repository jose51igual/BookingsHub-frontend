import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
{
  path: '',
  canActivate: [AuthGuard],
  data: { roleRedirect: true },
  loadComponent: () => import('./pages/shared/home/home.page').then(m => m.HomePage)
},
  
  // Layout principal para rutas públicas y de clientes
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      // Rutas públicas - accesibles sin autenticación
      {
        path: 'inicio',
        canActivate: [AuthGuard],
        data: { allowUnauthenticated: true },
        loadComponent: () => import('./pages/shared/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'negocios',
        canActivate: [AuthGuard],
        data: { allowUnauthenticated: true },
        loadComponent: () => import('./pages/services/discovery/services-discovery.page').then(m => m.ServicesPage)
      },
      {
        path: 'negocio/:id',
        canActivate: [AuthGuard],
        data: { allowUnauthenticated: true },
        loadComponent: () => import('./pages/shared/business-detail/business-detail.page').then(m => m.BusinessDetailPage)
      },
      {
        path: 'detalle-servicio/:id',
        data: { 
          allowUnauthenticated: true,
          requireAuth: false
        },
        loadComponent: () => import('./pages/shared/service-detail/service-detail.page').then(m => m.ServiceDetailPage)
      },
      
      // Rutas protegidas
      {
        path: 'mis-reservas',
        canActivate: [AuthGuard],
        data: { requiredRole: 'cliente' },
        loadComponent: () => import('./pages/bookings/client-bookings/client-bookings.page').then(m => m.ClientBookingsPage)
      },
      {
        path: 'perfil',
        canActivate: [AuthGuard],
        data: { requiredRole: 'cliente' },
        loadComponent: () => import('./pages/profiles/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'reserva',
        canActivate: [AuthGuard],
        data: { requiredRole: 'cliente' },
        loadComponent: () => import('./pages/shared/booking-detail/booking-detail.page').then(m => m.BookingDetailPage)
      },
      // Rutas de reviews
      {
        path: 'reviews/create',
        canActivate: [AuthGuard],
        data: { requiredRole: 'cliente' },
        loadComponent: () => import('./pages/reviews/review-create/review-create.page').then(m => m.CreateReviewPage)
      },
      {
        path: 'reviews/business/:id',
        canActivate: [AuthGuard],
        data: { allowUnauthenticated: true },
        loadComponent: () => import('./pages/reviews/reviews-list/reviews-list.page').then(m => m.ReviewsListPage)
      }
    ]
  },
  // Business Dashboard Routes
  {
    path: 'panel-negocio',
    canActivate: [AuthGuard],
    data: { requiredRole: 'negocio' },
    loadComponent: () => import('./layouts/business-dashboard').then(m => m.BusinessDashboardComponent),
    children: [
      {
        path: 'principal',
        loadComponent: () => import('./pages/businesses/management/business-dashboard-main.page').then(m => m.BusinessDashboardMainPage)
      },
      {
        path: 'reservas',
        loadComponent: () => import('./pages/bookings/business-management/bookings-management.page').then(m => m.BookingsManagementPage)
      },
      {
        path: 'servicios',
        loadComponent: () => import('./pages/services/management/services-management.page').then(m => m.BusinessServicesPage)
      },
      {
        path: 'disponibilidad',
        loadComponent: () => import('./pages/businesses/management/business-availability.page').then(m => m.BusinessAvailabilityPage)
      },
      {
        path: 'empleados',
        loadComponent: () => import('./pages/employees/employee-management.page').then(m => m.EmployeeManagementPage)
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/analytics/analytics.page').then(m => m.AnalyticsPage)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/businesses/management/business-settings.page').then(m => m.BusinessSettingsPage)
      },
      {
        path: 'crear-servicio',
        loadComponent: () => import('./pages/services/management/service-editor.page').then(m => m.ServiceCreatePage)
      },
      {
        path: 'editar-servicio/:id',
        loadComponent: () => import('./pages/services/management/service-editor.page').then(m => m.ServiceCreatePage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/businesses/profile/business-profile.page').then(m => m.BusinessProfilePage)
      },
      {
        path: 'resenas',
        loadComponent: () => import('./pages/reviews/reviews-list/reviews-list.page').then(m => m.ReviewsListPage)
      },
      {
        path: '',
        redirectTo: 'principal',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'iniciar-sesion',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true, redirectAuthenticated: true, preload: true },
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registro',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true, redirectAuthenticated: true, preload: true }, 
    loadComponent: () => import('./pages/auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'tipo-registro',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true, redirectAuthenticated: true },
    loadComponent: () => import('./pages/auth/register-type/register-type.page').then(m => m.RegisterTypePage)
  },  {
    path: 'auth/callback',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true },
    loadComponent: () => import('./pages/auth/callback/callback.page').then(m => m.CallbackPage)
  },
  {
    path: 'auth/success',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true },
    loadComponent: () => import('./pages/auth/callback/callback.page').then(m => m.CallbackPage)
  },
  {
    path: 'auth/error',
    canActivate: [AuthGuard],
    data: { allowUnauthenticated: true },
    loadComponent: () => import('./pages/auth/callback/callback.page').then(m => m.CallbackPage)
  },
  {
    path: '**',
    redirectTo: '/inicio',
    pathMatch: 'full'
  }
];

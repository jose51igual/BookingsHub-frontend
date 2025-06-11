import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BusinessService, ServiceService, EmployeeService, BookingService, AnalyticsService } from '@services/api/index';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { ErrorAlertComponent } from '@components/index';
import { Business, Service, Employee, Booking, WeeklyStats } from '@interfaces/index';
import { APP_ROUTES } from '@utils/constants';
import { formatRating } from '@utils/common.utils';

@Component({
  selector: 'app-business-management',
  templateUrl: './business-management.page.html',
  styleUrls: ['./business-management.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    ErrorAlertComponent
  ]
})
export class BusinessManagementPage {
  // Signals reactivos para el estado
  readonly businessData = signal<Business | null>(null);
  readonly services = signal<Service[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly recentBookings = signal<Booking[]>([]);
  readonly weeklyStats = signal<WeeklyStats>({ bookings: 0, revenue: 0, rating: 0 });
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  
  // Computed signals
  readonly hasBusinessData = computed(() => !!this.businessData());
  readonly servicesCount = computed(() => this.services().length);
  readonly employeesCount = computed(() => this.employees().length);
  readonly bookingsCount = computed(() => this.recentBookings().length);
  
  // Inyección moderna de servicios
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly serviceService = inject(ServiceService);
  private readonly employeeService = inject(EmployeeService);
  private readonly bookingService = inject(BookingService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);

  constructor() {
    this.loadAllData();
  }

  // Método centralizado para cargar todos los datos
  private async loadAllData(): Promise<void> {
    try {
      // Paso 1: Cargar datos del negocio
      const businessResponse = await this.dataLoader.fromObservable(
        this.businessService.getBusinessByUserId(),
        {
          loadingSignal: this.isLoading,
          errorMessage: 'No se pudo cargar la información del negocio'
        }
      );

      if (!businessResponse) {
        await this.handleNoBusinessFound();
        return;
      }

      this.businessData.set(businessResponse);
      const businessId = businessResponse.id;

      // Paso 2: Cargar datos relacionados en paralelo
      await this.loadBusinessRelatedData(businessId);

    } catch (error) {
      console.error('Error loading business management data:', error);
      this.errorMessage.set('Error al cargar los datos del negocio');
    }
  }

  // Cargar datos relacionados del negocio en paralelo
  private async loadBusinessRelatedData(businessId: number): Promise<void> {
    try {
      const [servicesResult, employeesResult, bookingsResult, statsResult] = await Promise.all([
        this.dataLoader.fromObservable(
          this.serviceService.getServicesByBusiness(businessId),
          { errorMessage: 'Error al cargar servicios' }
        ),
        this.dataLoader.fromObservable(
          this.employeeService.getEmployeesByBusiness(businessId),
          { errorMessage: 'Error al cargar empleados' }
        ),
        this.dataLoader.fromObservable(
          this.bookingService.getRecentBookingsByBusiness(businessId),
          { errorMessage: 'Error al cargar reservas recientes' }
        ),
        this.dataLoader.fromObservable(
          this.analyticsService.getWeeklyStatsByBusiness(businessId),
          { errorMessage: 'Error al cargar estadísticas' }
        )
      ]);

      // Actualizar signals con resultados (usando arrays vacíos como fallback)
      this.services.set(servicesResult || []);
      this.employees.set(employeesResult || []);
      this.recentBookings.set(bookingsResult || []);
      this.weeklyStats.set(statsResult || { bookings: 0, revenue: 0, rating: 0 });

    } catch (error) {
      console.error('Error loading business related data:', error);
      // Establecer valores por defecto en caso de error
      this.services.set([]);
      this.employees.set([]);
      this.recentBookings.set([]);
      this.weeklyStats.set({ bookings: 0, revenue: 0, rating: 0 });
    }
  }

  // Manejar caso cuando no se encuentra negocio
  private async handleNoBusinessFound(): Promise<void> {
    const shouldCreate = await this.notificationService.showConfirmAlert(
      'No tienes un negocio',
      '¿Te gustaría crear tu primer negocio ahora?',
      'Crear Negocio',
      'Más tarde'
    );

    if (shouldCreate) {
      this.router.navigate([APP_ROUTES.BUSINESS_PROFILE]);
    } else {
      this.router.navigate([APP_ROUTES.HOME]);
    }
  }

  // Métodos de navegación simplificados usando constantes
  readonly navigateToServices = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SERVICES]);
  };

  readonly navigateToAvailability = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_AVAILABILITY]);
  };

  readonly navigateToBookings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_BOOKINGS]);
  };

  readonly navigateToAnalytics = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_ANALYTICS]);
  };

  readonly navigateToSettings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SETTINGS]);
  };

  readonly navigateToEmployees = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_EMPLOYEES]);
  };

  readonly editService = (serviceId: number): void => {
    this.router.navigate([APP_ROUTES.SERVICE_EDIT(serviceId)]);
  };

  readonly createNewService = (): void => {
    const business = this.businessData();
    if (business) {
      this.router.navigate([APP_ROUTES.SERVICE_CREATE]);
    } else {
      this.router.navigate([APP_ROUTES.SERVICE_CREATE]);
    }
  };

  readonly openBusinessSettings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SETTINGS]);
  };

  readonly clearError = (): void => {
    this.errorMessage.set(null);
  };

  // Utilidades para el template
  readonly formatRating = formatRating;
}

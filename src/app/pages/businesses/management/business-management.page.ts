import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BusinessService, ServiceService, EmployeeService, BookingService, AnalyticsService } from '@services/api/index';
import { NotificationService, BaseDataLoaderService } from '@services/index';
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
    RouterModule
  ]
})
export class BusinessManagementPage {
 businessData = signal<Business | null>(null);
 services = signal<Service[]>([]);
 employees = signal<Employee[]>([]);
 recentBookings = signal<Booking[]>([]);
 weeklyStats = signal<WeeklyStats>({ bookings: 0, revenue: 0, rating: 0 });
 isLoading = signal<boolean>(false);
 errorMessage = signal<string | null>(null);
  
 hasBusinessData = computed(() => !!this.businessData());
 servicesCount = computed(() => this.services().length);
 employeesCount = computed(() => this.employees().length);
 bookingsCount = computed(() => this.recentBookings().length);
  
  private router = inject(Router);
  private businessService = inject(BusinessService);
  private serviceService = inject(ServiceService);
  private employeeService = inject(EmployeeService);
  private bookingService = inject(BookingService);
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);

  constructor() {
    this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    try {
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

      await this.loadBusinessRelatedData(businessId);

    } catch (error) {
      console.error('Error loading business management data:', error);
      this.errorMessage.set('Error al cargar los datos del negocio');
    }
  }

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

      this.services.set(servicesResult || []);
      this.employees.set(employeesResult || []);
      this.recentBookings.set(bookingsResult || []);
      this.weeklyStats.set(statsResult || { bookings: 0, revenue: 0, rating: 0 });

    } catch (error) {
      console.error('Error loading business related data:', error);
      this.services.set([]);
      this.employees.set([]);
      this.recentBookings.set([]);
      this.weeklyStats.set({ bookings: 0, revenue: 0, rating: 0 });
    }
  }

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

 navigateToServices = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SERVICES]);
  };

 navigateToAvailability = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_AVAILABILITY]);
  };

 navigateToBookings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_BOOKINGS]);
  };

 navigateToAnalytics = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_ANALYTICS]);
  };

 navigateToSettings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SETTINGS]);
  };

 navigateToEmployees = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_EMPLOYEES]);
  };

 editService = (serviceId: number): void => {
    this.router.navigate([APP_ROUTES.SERVICE_EDIT(serviceId)]);
  };

 createNewService = (): void => {
    const business = this.businessData();
    if (business) {
      this.router.navigate([APP_ROUTES.SERVICE_CREATE]);
    } else {
      this.router.navigate([APP_ROUTES.SERVICE_CREATE]);
    }
  };

 openBusinessSettings = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_SETTINGS]);
  };

 clearError = (): void => {
    this.errorMessage.set(null);
  };

 formatRating = formatRating;
}

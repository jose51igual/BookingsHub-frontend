import { Component, inject, signal, computed, effect } from '@angular/core';
import { LoadingController, AlertController, ActionSheetController, IonicModule, ModalController } from '@ionic/angular';
import { BookingService } from '@services/api';
import { AuthSignalService, BaseDataLoaderService, NotificationService } from '@services/index';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { 
  getStatusColor, 
  getStatusText, 
  mapBackendStatusToFrontend,
  formatDate,
  formatTime12Hour,
  isToday,
  isFutureDate,
  isPastDate,
  createAlertHelper,
  APP_ROUTES
} from '@utils/index';

@Component({
  selector: 'app-client-bookings',
  templateUrl: './client-bookings.page.html',
  styleUrls: ['./client-bookings.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class ClientBookingsPage {
  // Inyección de dependencias con inject()
  private bookingService = inject(BookingService);
  private authService = inject(AuthSignalService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);
  private router = inject(Router);
  private dataLoader = inject(BaseDataLoaderService);
  private notificationService = inject(NotificationService);
  private alertHelper = createAlertHelper(this.alertController, this.actionSheetController);

  // Estado reactivo con signals
  bookings = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  selectedSegment = signal<string>('upcoming');
  errorMessage = signal<string>('');
  
  // Filtros
  searchTerm = signal<string>('');
  statusFilter = signal<string>('');
  sortBy = signal<string>('date');

  // Computed properties para filtrar reservas usando utilidades de fecha
  upcomingBookings = computed(() => {
    return this.bookings().filter(booking => {
      if (!booking.booking_date) return false;
      
      return isFutureDate(booking.booking_date) || 
        (isToday(booking.booking_date) && booking.status !== 'cancelada');
    });
  });

  pastBookings = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.bookings().filter(booking => {
      if (!booking.booking_date) return false;
      
      const bookingDate = new Date(booking.booking_date);
      return bookingDate < today || 
        (bookingDate.getTime() === today.getTime() && booking.status === 'cancelada');
    });
  });

  // Computed para verificar si hay reservas
  hasBookings = computed(() => this.bookings().length > 0);
  hasUpcomingBookings = computed(() => this.upcomingBookings().length > 0);
  hasPastBookings = computed(() => this.pastBookings().length > 0);

  // Computed para filtros
  filteredUpcomingBookings = computed(() => {
    return this.filterAndSortBookings(this.upcomingBookings());
  });

  filteredPastBookings = computed(() => {
    return this.filterAndSortBookings(this.pastBookings());
  });

  // Computed para reservas mostradas según el segmento
  displayedBookings = computed(() => {
    return this.selectedSegment() === 'upcoming' 
      ? this.filteredUpcomingBookings() 
      : this.filteredPastBookings();
  });

  constructor() {
    // Inicializar carga de reservas
    setTimeout(() => {
      const user = this.authService.user;
      const isAuthenticated = this.authService.isAuthenticated;
      const isAuthLoading = this.authService.isLoading;

      if (!isAuthLoading && isAuthenticated && user?.role === 'cliente') {
        this.loadBookings();
      } else if (!isAuthLoading && !isAuthenticated) {
        this.router.navigate(['/iniciar-sesion']);
      } else if (!isAuthLoading && user?.role !== 'cliente') {
        this.router.navigate(['/panel-negocio/principal']);
      }
    }, 0);
  }

  async loadBookings() {
    const response = await this.dataLoader.fromObservable(
      this.bookingService.getUserBookings(),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error al cargar las reservas. Verifica tu conexión e inténtalo de nuevo.'
      }
    );

    if (response) {
      // Extraer el array de reservas de la respuesta según la estructura de la API
      let bookings: any[] = [];
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          bookings = response.data;
        } else if (Array.isArray(response)) {
          bookings = response;
        }
      }
      
      // Normalizar datos de reservas con utilidades
      const normalizedBookings = bookings.map(booking => ({
        ...booking,
        status: mapBackendStatusToFrontend(booking.status || 'pendiente'),
        booking_date: booking.booking_date || booking.date,
        booking_time: formatTime12Hour(booking.booking_time || booking.time),
        // Extraer datos de las relaciones anidadas
        service_name: booking.services?.name || 'Servicio no disponible',
        business_name: booking.businesses?.name || 'Negocio no disponible',
        employee_name: booking.employees?.name || null,
        price: booking.services?.price || null,
        duration: booking.services?.duration_minutes || null
      }));
      
      this.bookings.set(normalizedBookings);
    }
  }

  // Métodos para filtros
  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value.toLowerCase());
  }

  onStatusFilterChange(event: any) {
    this.statusFilter.set(event.detail.value);
  }

  onSortChange(event: any) {
    this.sortBy.set(event.detail.value);
  }

  filterAndSortBookings(bookings: any[]): any[] {
    let filtered = [...bookings];

    // Filtrar por búsqueda
    if (this.searchTerm()) {
      filtered = filtered.filter(booking => 
        (booking.service_name?.toLowerCase() || '').includes(this.searchTerm()) ||
        (booking.business_name?.toLowerCase() || '').includes(this.searchTerm())
      );
    }

    // Filtrar por estado
    if (this.statusFilter()) {
      filtered = filtered.filter(booking => booking.status === this.statusFilter());
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'service':
          return (a.service_name || '').localeCompare(b.service_name || '');
        case 'business':
          return (a.business_name || '').localeCompare(b.business_name || '');
        case 'date':
        default:
          const dateA = new Date(a.booking_date + ' ' + a.booking_time);
          const dateB = new Date(b.booking_date + ' ' + b.booking_time);
          return dateB.getTime() - dateA.getTime(); // Orden inverso: más reciente primero
      }
    });

    return filtered;
  }

  clearError() {
    this.errorMessage.set('');
  }

  segmentChanged(event: any) {
    this.selectedSegment.set(event.detail.value);
    
    // Animación suave para cambio de segmento
    const bookingsContainer = document.querySelector('.bookings-container');
    if (bookingsContainer) {
      bookingsContainer.classList.add('fade-out');
      setTimeout(() => {
        bookingsContainer.classList.remove('fade-out');
        bookingsContainer.classList.add('fade-in');
        setTimeout(() => {
          bookingsContainer.classList.remove('fade-in');
        }, 300);
      }, 100);
    }
  }

  // Usar utilidades centralizadas para estado
  getStatusColor = getStatusColor;
  getStatusText = getStatusText;

  async updateStatus(booking: any, newStatus: string) {
    const normalizedStatus = mapBackendStatusToFrontend(newStatus);
    
    await this.notificationService.withLoading(async () => {
      // Usar el método correcto según el estado
      let apiCall;
      switch (normalizedStatus) {
        case 'cancelada':
          apiCall = this.bookingService.cancelBooking(booking.id);
          break;
        case 'confirmada':
          apiCall = this.bookingService.confirmBooking(booking.id);
          break;
        case 'completada':
          apiCall = this.bookingService.completeBooking(booking.id);
          break;
        default:
          apiCall = this.bookingService.updateBookingStatus(booking.id, normalizedStatus as any);
          break;
      }
      
      await firstValueFrom(apiCall);
      
      // Actualizar el booking en el estado
      const updatedBookings = this.bookings().map(b =>
        b.id === booking.id ? { ...b, status: normalizedStatus } : b
      );
      this.bookings.set(updatedBookings);
    }, 'Actualizando estado...');
    
    await this.notificationService.showSuccess('Éxito', 'El estado de la reserva ha sido actualizado');
  }

  async cancelBooking(booking: any) {
    const confirmed = await this.alertHelper.showConfirmation(
      'Confirmar cancelación',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      'Sí, cancelar',
      'No'
    );

    if (confirmed) {
      await this.updateStatus(booking, 'cancelada');
    }
  }

  viewBookingDetails(booking: any) {
    this.router.navigate(['/reserva'], {
      state: { booking: booking }
    });
  }

  private isNavigating = false; // Flag para evitar navegaciones múltiples

  async reviewBooking(booking: any) {
    // Evitar navegaciones múltiples
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    
    try {
      // Validar datos requeridos
      if (!booking?.business_id || !booking?.id) {
        await this.notificationService.showError('Error de Datos', 'Datos de reserva incompletos');
        return;
      }

      // Navegar de forma optimizada
      await this.router.navigate([APP_ROUTES.CREATE_REVIEW], {
        queryParams: {
          businessId: booking.business_id,
          bookingId: booking.id,
          businessName: booking.business_name || 'Negocio'
        },
        // Optimizar la navegación
        replaceUrl: false,
        skipLocationChange: false
      });
    } catch (error) {
      console.error('Error navegando a reseñas:', error);
      await this.notificationService.showError('Error de Navegación', 'Error al abrir formulario de reseña');
    } finally {
      // Reset flag después de un pequeño delay
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }
  }

  async refreshBookings(event?: any) {
    await this.loadBookings();
    if (event) {
      event.target.complete();
    }
  }

  // Usar utilidad centralizada para formateo de tiempo
  formatBookingTime = formatTime12Hour;
}

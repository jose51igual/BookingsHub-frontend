import { Component, inject, signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ActionSheetController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BusinessService, BookingService } from '@services/api/index';
import { BaseDataLoaderService, NotificationService } from '@services/index';
import { 
  getStatusColor, 
  getStatusText, 
  mapBackendStatusToFrontend,
  formatDate,
  formatTime12Hour,
  formatDateForInput,
  createAlertHelper,
  availableStatuses,
} from '@utils/index';
import { Booking } from '@interfaces/index';

@Component({
  selector: 'app-bookings-management',
  templateUrl: './bookings-management.page.html',
  styleUrls: ['./bookings-management.page.css'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule
  ]
})
export class BookingsManagementPage {
  private readonly businessService = inject(BusinessService);
  private readonly bookingService = inject(BookingService);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly dataLoader = inject(BaseDataLoaderService);
  private readonly notificationService = inject(NotificationService);
  private readonly alertHelper = createAlertHelper(this.alertController, this.actionSheetController);

  readonly bookings = signal<Booking[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedStatus = signal<string>('all');
  readonly searchTerm = signal<string>('');
  readonly selectedDate = signal<string>('');

  readonly availableStatuses = availableStatuses;

  readonly filteredBookings = computed(() => {
    const bookings = this.bookings();
    const status = this.selectedStatus();
    const search = this.searchTerm().toLowerCase();
    const date = this.selectedDate();

    return bookings.filter(booking => {
      const matchesStatus = status === 'all' || booking.status === status;
      const matchesSearch = !search || 
        booking.customer_name.toLowerCase().includes(search) ||
        booking.service_name.toLowerCase().includes(search);
      
      let matchesDate = true;
      if (date) {
        const bookingDate = formatDateForInput(booking.booking_date);
        const selectedDate = formatDateForInput(date);
        matchesDate = bookingDate === selectedDate;
      }
      
      return matchesStatus && matchesSearch && matchesDate;
    });
  });

  readonly datesWithBookings = computed(() => {
    const dates = new Set<string>();
    this.bookings().forEach(booking => {
      if (booking.booking_date) {
        dates.add(booking.booking_date);
      }
    });
    return Array.from(dates);
  });

  readonly todaysBookings = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.bookings().filter(booking => booking.booking_date === today);
  });

  readonly upcomingBookings = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.bookings().filter(booking => booking.booking_date > today);
  });

  readonly totalBookings = computed(() => this.bookings().length);
  readonly confirmedBookings = computed(() => 
    this.bookings().filter(b => b.status === 'confirmada').length
  );
  readonly completedBookings = computed(() => 
    this.bookings().filter(b => b.status === 'completada').length
  );

  constructor() {
    this.loadBookings();
  }

  readonly loadBookings = async (): Promise<void> => {
    const response = await this.dataLoader.fromObservable(
      this.businessService.getBusinessByUserId(),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'No se pudo cargar la información del negocio'
      }
    );

    if (!response) {
      console.error('No se recibió respuesta del servicio de negocio');
      return;
    }

    const businessData = (response as any)?.data || response;
    const businessId = businessData?.id;
    
    if (!businessId) {
      console.error('La respuesta no contiene un ID de negocio válido:', response);
      await this.notificationService.showError('Error', 'No se pudo obtener la información del negocio');
      return;
    }

    try {
      const bookingsResponse = await this.dataLoader.fromObservable(
        this.bookingService.getBusinessBookings(businessId),
        {
          loadingSignal: this.isLoading,
          errorMessage: 'Error al cargar las reservas. Intenta nuevamente.'
        }
      );

      if (bookingsResponse) {
        // Extraer el array de reservas, manejando diferentes estructuras de respuesta
        let rawBookings = [];
        if (Array.isArray(bookingsResponse)) {
          rawBookings = bookingsResponse;
        } else if ((bookingsResponse as any).data && Array.isArray((bookingsResponse as any).data)) {
          rawBookings = (bookingsResponse as any).data;
        } else {
          rawBookings = [];
        }
        
        const formattedBookings: Booking[] = rawBookings.map((booking: any) => ({
          id: booking.id,
          customer_name: booking.users?.name || 'Cliente no identificado',
          customer_email: booking.users?.email || 'Email no disponible',
          service_name: booking.services?.name || 'Servicio no especificado',
          booking_date: formatDateForInput(booking.booking_date || booking.date),
          booking_time: formatTime12Hour(booking.booking_time || booking.time),
          status: mapBackendStatusToFrontend(booking.status || 'pendiente'),
          total_price: parseFloat(booking.services?.price || booking.price || 0),
          notes: booking.notes || ''
        }));
        
        this.bookings.set(formattedBookings);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      if (error.status === 404) {
        this.bookings.set([]);
      } else {
        await this.notificationService.showError('Error', 'Error al cargar las reservas. Intenta nuevamente.');
      }
    }
  };

  // Manejadores de filtros
  readonly onStatusChange = (event: any): void => {
    this.selectedStatus.set(event.detail.value);
  };

  readonly onSearchChange = (event: any): void => {
    this.searchTerm.set(event.detail.value);
  };

  readonly onDateChange = (event: any): void => {
    const value = event.detail.value;
    if (value) {
      // Extraer solo la fecha (YYYY-MM-DD) del valor del ion-datetime
      const dateOnly = value.split('T')[0];
      this.selectedDate.set(dateOnly);
    } else {
      this.selectedDate.set('');
    }
  };

  // Limpiar filtro de fecha
  readonly clearDateFilter = (): void => {
    this.selectedDate.set('');
  };

  // Limpiar todos los filtros
  readonly clearAllFilters = (): void => {
    this.selectedStatus.set('all');
    this.searchTerm.set('');
    this.selectedDate.set('');
  };

  // Configuración para fechas destacadas en el calendario
  readonly getHighlightedDates = () => {
    const datesWithBookings = this.datesWithBookings();
    return datesWithBookings.map(date => ({
      date: date,
      textColor: 'var(--ion-color-primary-contrast)',
      backgroundColor: 'var(--ion-color-primary)'
    }));
  };

  // Obtener color del estado usando utilidad centralizada
  readonly getStatusColor = getStatusColor;

  // Obtener etiqueta del estado usando utilidad centralizada
  readonly getStatusLabel = getStatusText;

  // Actualizar estado de reserva usando NotificationService
  readonly updateBookingStatus = async (booking: Booking, newStatus?: any): Promise<void> => {
    const normalizedStatus = mapBackendStatusToFrontend(newStatus || 'cancelada');
    
      await firstValueFrom(this.bookingService.updateBookingStatus(booking.id, normalizedStatus));
      
      // Actualizar el estado local después de la llamada exitosa
      const updatedBookings = this.bookings().map(b => 
        b.id === booking.id ? { ...b, status: normalizedStatus } : b
      );
      this.bookings.set(updatedBookings);
    
    await this.notificationService.showSuccess('Éxito', 'Estado de reserva actualizado correctamente');
  };

  // Ver detalle de reserva usando un modal más elegante
  readonly viewBookingDetail = async (booking: Booking): Promise<void> => {
    const alert = await this.alertController.create({
      header: `Reserva #${booking.id}`,
      cssClass: 'booking-detail-alert',
      message: `
        <div class="booking-detail-content">
          <div class="booking-detail-section">
            <h4><ion-icon name="person-outline"></ion-icon> Cliente</h4>
            <p><strong>${booking.customer_name}</strong></p>
            <p class="email">${booking.customer_email}</p>
          </div>
          
          <div class="booking-detail-section">
            <h4><ion-icon name="construct-outline"></ion-icon> Servicio</h4>
            <p>${booking.service_name}</p>
          </div>
          
          <div class="booking-detail-section">
            <h4><ion-icon name="calendar-outline"></ion-icon> Fecha y Hora</h4>
            <p>${formatDate(booking.booking_date)} a las ${booking.booking_time}</p>
          </div>
          
          <div class="booking-detail-section">
            <h4><ion-icon name="cash-outline"></ion-icon> Precio</h4>
            <p class="price">$${(booking.total_price || 0).toFixed(2)}</p>
          </div>
          
          <div class="booking-detail-section">
            <h4><ion-icon name="flag-outline"></ion-icon> Estado</h4>
            <p class="status status-${booking.status}">${getStatusText(booking.status)}</p>
          </div>
          
          ${booking.notes ? `
          <div class="booking-detail-section">
            <h4><ion-icon name="document-text-outline"></ion-icon> Notas</h4>
            <p class="notes">${booking.notes}</p>
          </div>
          ` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        ...(booking.status === 'confirmada' ? [{
          text: 'Cancelar Reserva',
          cssClass: 'danger-button',
          handler: () => {
            this.cancelBooking(booking);
          }
        }] : [])
      ]
    });

    await alert.present();
  };

  // Cancelar reserva
  readonly cancelBooking = async (booking: Booking): Promise<void> => {
    const confirmed = await this.alertHelper.showConfirmation(
      'Cancelar Reserva',
      `¿Estás seguro de que deseas cancelar la reserva de ${booking.customer_name}?`,
      'Sí, cancelar',
      'No'
    );

    if (confirmed) {
      await this.updateBookingStatus(booking, 'cancelada');
    }
  };

  // Mostrar opciones de cambio de estado usando AlertHelper
  readonly showStatusChangeOptions = async (booking: Booking): Promise<void> => {
    const result = await this.alertHelper.showStatusOptions(booking.status);
    
    if (result && result !== booking.status) {
      await this.updateBookingStatus(booking, result);
    }
  };
}

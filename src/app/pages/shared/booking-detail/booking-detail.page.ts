import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { BusinessService, BookingService } from '@services/api';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { APP_ROUTES } from '@utils/constants';
import { getBookingStatusColor, formatDate, formatTime } from '@utils/index';
import { showConfirmAlert } from '@utils/alert.utils';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class BookingDetailPage {
  // Signals para estado reactivo
  readonly booking = signal<any>(null);
  readonly business = signal<any>(null);
  readonly isLoading = signal<boolean>(false);

  // Computed properties
  readonly hasBooking = computed(() => !!this.booking());
  readonly canCancel = computed(() => 
    this.booking() && this.booking().status !== 'cancelada'
  );
  readonly statusColor = computed(() => 
    getBookingStatusColor(this.booking()?.status)
  );

  // Servicios inyectados
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly businessService = inject(BusinessService);
  private readonly bookingService = inject(BookingService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);

  constructor() {
    this.initializeFromNavigation();
  }

  private initializeFromNavigation(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.booking.set(navigation.extras.state['booking']);
    }

    // Effect para cargar datos iniciales
    effect(() => {
      if (!this.hasBooking()) {
        this.goBack();
        return;
      }
      
      this.loadBusinessDetails();
    });
  }

  private async loadBusinessDetails(): Promise<void> {
    const bookingData = this.booking();
    if (!bookingData || !bookingData.business_id) {
      return;
    }

    const business = await this.dataLoader.fromObservable(
      this.businessService.getBusinessById(bookingData.business_id),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error cargando detalles del negocio'
      }
    );

    if (business) {
      this.business.set(business);
    }
  }

  readonly goBack = (): void => {
    this.location.back();
  };

  readonly formatDate = (date: string): string => {
    return formatDate(date);
  };

  readonly formatBookingTime = (bookingTime: any): string => {
    return formatTime(bookingTime);
  };

  readonly openMap = (): void => {
    const businessData = this.business();
    if (!businessData || !businessData.address) return;
    
    const address = encodeURIComponent(businessData.address);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(mapUrl, '_blank');
  };

  readonly cancelBooking = async (): Promise<void> => {
    const bookingData = this.booking();
    if (!bookingData || bookingData.status === 'cancelada') return;
    
    const shouldCancel = await showConfirmAlert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      'Sí, cancelar',
      'No'
    );

    if (!shouldCancel) return;
    
    const cancelled = await this.dataLoader.fromObservable(
      this.bookingService.cancelBooking(bookingData.id),
      {
        successMessage: 'Reserva cancelada exitosamente',
        errorMessage: 'Error cancelando la reserva'
      }
    );

    if (cancelled) {
      this.booking.update(booking => ({ ...booking, status: 'cancelada' }));
    }
  };

  readonly leaveReview = (): void => {
    const bookingData = this.booking();
    if (bookingData) {
      this.router.navigate([APP_ROUTES.CREATE_REVIEW], {
        queryParams: {
          bookingId: bookingData.id,
          businessId: bookingData.business_id,
          businessName: this.business()?.name || 'este negocio'
        }
      });
    }
  };
}

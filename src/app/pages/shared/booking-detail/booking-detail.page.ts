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
  
 booking = signal<any>(null);
 business = signal<any>(null);
 isLoading = signal<boolean>(false);

  // Computed properties
 hasBooking = computed(() => !!this.booking());
 canCancel = computed(() => 
    this.booking() && this.booking().status !== 'cancelada'
  );
 statusColor = computed(() => 
    getBookingStatusColor(this.booking()?.status)
  );

  // Servicios inyectados
  private router = inject(Router);
  private location = inject(Location);
  private businessService = inject(BusinessService);
  private bookingService = inject(BookingService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);

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

 goBack = (): void => {
    this.location.back();
  };

 formatDate = (date: string): string => {
    return formatDate(date);
  };

 formatBookingTime = (bookingTime: any): string => {
    return formatTime(bookingTime);
  };

 openMap = (): void => {
    const businessData = this.business();
    if (!businessData || !businessData.address) return;
    
    const address = encodeURIComponent(businessData.address);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(mapUrl, '_blank');
  };

 cancelBooking = async (): Promise<void> => {
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

 leaveReview = (): void => {
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

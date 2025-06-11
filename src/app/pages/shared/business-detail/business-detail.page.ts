import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ModalController, IonicModule } from '@ionic/angular';
import { CommonModule, formatNumber } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import { BusinessService, ServiceService, ReviewService } from '@services/api/index';
import { AuthSignalService, NotificationService, GeoService } from '@services/index';
import { MapComponent } from '@components/business/map/map.component';
import { Business, Service, Review } from '@interfaces/index';
import { APP_ROUTES } from '../../../utils/constants';

@Component({
  selector: 'app-business-detail',
  templateUrl: './business-detail.page.html',
  styleUrls: ['./business-detail.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    MapComponent
  ]
})
export class BusinessDetailPage implements OnDestroy {
  // Propiedades principales
  business = signal<Business | null>(null);
  services = signal<Service[]>([]);
  mockReviews = signal<Review[]>([]); // Mantengo el nombre para compatibilidad con el template
  
  // Estado del componente
  businessId = signal<number>(0);
  isOwner = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  
  // Computed signals que se actualizan automáticamente cuando cambia el auth service
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  userRole = computed(() => this.authService.user?.role || '');
  currentUserId = computed(() => this.authService.user?.id || null);
  
  // Propiedades del mapa
  mapLat = signal<number>(0);
  mapLng = signal<number>(0);
  hasMapCoordinates = signal<boolean>(false);
  isMapLoading = signal<boolean>(true);
  mapError = signal<string>('');

  // Subject para manejar la limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Inyección moderna de servicios
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private businessService = inject(BusinessService);
  private serviceService = inject(ServiceService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthSignalService);
  private geoService = inject(GeoService);
  private loadingController = inject(LoadingController);
  private notificationService = inject(NotificationService);
  private modalController = inject(ModalController);

  constructor() {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.businessId.set(idParam ? parseInt(idParam, 10) : 0);

    if (!this.businessId()) {
      this.notificationService.showError('Error', 'ID de negocio inválido');
      this.router.navigate(['/inicio']);
      return;
    }

    // Configurar estado de carga inicial
    this.isLoading.set(true);
    this.checkUserAuthentication();
    this.loadAllData();
  }

  private checkUserAuthentication(): void {
    // Los computed signals se actualizan automáticamente
    // Solo necesitamos verificar si el usuario es propietario
    if (this.isAuthenticated() && this.currentUserId()) {
      this.checkIfUserIsOwner(this.currentUserId()!);
    }
  }

  private async loadAllData(): Promise<void> {
    const loading = await this.showLoadingIndicator('Cargando detalles del negocio...');

    try {
      await Promise.all([
        this.loadBusinessDetails(),
        this.loadBusinessServices(),
        this.loadBusinessReviews()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      await this.notificationService.showError('Error', 'Error al cargar los detalles del negocio');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  private async loadBusinessDetails(): Promise<void> {
    try {
      const business = await firstValueFrom(this.businessService.getBusinessById(this.businessId()));
      this.business.set(business);
      this.checkOwnership();
      this.loadMapCoordinates();
    } catch (error) {
      console.error('Error al cargar detalles del negocio:', error);
      throw error;
    }
  }

  private async loadBusinessServices(): Promise<void> {
    try {
      const response = await firstValueFrom(this.serviceService.getServicesByBusiness(this.businessId()));
      console.log('Services response:', response); // Debug log
      
      // Usar directamente la respuesta del servicio
      this.services.set(response || []);
      
      // Asegurar que services es un array
      if (!Array.isArray(response)) {
        console.warn('Services no es un array:', response);
        this.services.set([]);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      this.services.set([]);
    }
  }

  private async loadBusinessReviews(): Promise<void> {
    try {
      const response = await firstValueFrom(this.reviewService.getBusinessReviews(this.businessId()));
      console.log('Reviews response:', response); // Debug log
      
      // Extraer los datos del response del API
      const reviews = response || [];
      this.mockReviews.set(this.mapReviewsToViewModel(reviews));
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
      this.mockReviews.set([]);
    }
  }

  private checkIfUserIsOwner(userId: number): void {
    this.isOwner.set(userId === this.business()?.user_id);
  }

  private checkOwnership(): void {
    if (this.isAuthenticated()) {
      const user = this.authService.user;
      if (user && this.business()) {
        this.isOwner.set(user.id === this.business()!.user_id);
      }
    }
  }

  private mapReviewsToViewModel(reviews: any[]): Review[] {
    // Asegurar que reviews es un array
    if (!Array.isArray(reviews)) {
      console.warn('Reviews no es un array:', reviews);
      return [];
    }

    return reviews.map((review: any) => ({
      id: review.id,
      name: review.user_name || 'Usuario',
      profileImage: `https://i.pravatar.cc/100?u=${review.user_id || Math.random()}`,
      rating: Number(review.rating) || 0,
      comment: review.comment,
      date: new Date(review.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));
  }
  
  formatRating(rating: number | string | undefined): string {
    if (!rating || rating === 0) return '0.0';
    
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    if (isNaN(numericRating)) return '0.0';
    
    // Usar formatNumber de Angular para formatear con 1 decimal
    return formatNumber(numericRating, 'es-ES', '1.1-1');
  }

  private loadMapCoordinates(): void {
    if (!this.business()?.address) {
      this.setMapError('No hay dirección disponible para este negocio');
      return;
    }

    this.isMapLoading.set(true);

    this.geoService.geocodeAddress(this.business()!.address)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (location) => {
          if (location) {
            this.setMapCoordinates(location.lat, location.lng);
          } else {
            this.setMapError('No se pudieron obtener las coordenadas para esta dirección');
          }
        },
        error: (error) => {
          console.error('Error al geocodificar dirección:', error);
          this.setMapError('Error al obtener las coordenadas del mapa');
        },
        complete: () => {
          this.isMapLoading.set(false);
        }
      });
  }

  private setMapCoordinates(lat: number, lng: number): void {
    this.mapLat.set(lat);
    this.mapLng.set(lng);
    this.hasMapCoordinates.set(true);
    this.mapError.set('');
  }

  private setMapError(message: string): void {
    this.hasMapCoordinates.set(false);
    this.isMapLoading.set(false);
    this.mapError.set(message);
  }

  // Métodos públicos para la interfaz
  navigateToServiceDetail(serviceId: number): void {
    if (!this.isAuthenticated()) {
      this.showLoginRequiredAlert();
      return;
    }
    this.router.navigate([APP_ROUTES.SERVICE_DETAIL(serviceId)]);
  }

  /**
   * Maneja el click en el botón de reserva
   * Si está autenticado, va al detalle del servicio
   * Si no está autenticado, muestra el alert de login
   */
  handleBookingClick(serviceId: number): void {
    const authenticated = this.isAuthenticated();
    const role = this.userRole();
    
    console.log('DEBUG - handleBookingClick:', {
      authenticated,
      role,
      condition: authenticated && role === 'cliente',
      serviceId
    });
    
    if (authenticated && role === 'cliente') {
      this.navigateToServiceDetail(serviceId);
    } else {
      this.showLoginRequiredAlert();
    }
  }

  async showLoginRequiredAlert(): Promise<void> {
    const result = await this.notificationService.showConfirmAlert(
      'Iniciar Sesión',
      'Necesitas iniciar sesión para realizar reservas. ¿Quieres hacerlo ahora?',
      'Iniciar Sesión',
      'Cancelar'
    );
    
    if (result) {
      this.router.navigate(['/iniciar-sesion']);
    }
  }

  onMapLoaded(event: any): void {
    console.log('Mapa cargado:', event);
    // Mapa cargado correctamente
  }

  onMapLoadError(error: any): void {
    console.error('Error al cargar el mapa:', error);
    this.setMapError(typeof error === 'string' ? error : 'Error al cargar el mapa');
  }

  // Métodos para interacciones del usuario
  async addService(): Promise<void> {
    // Navegar a la página de creación de servicios
    await this.router.navigate(['/panel-negocio/servicio-nuevo']);
  }

  openInMaps(): void {
    if (!this.business()?.address) return;

    const address = encodeURIComponent(this.business()!.address);
    let mapsUrl = '';

    if (this.hasMapCoordinates()) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.mapLat()},${this.mapLng()}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    }

    window.open(mapsUrl, '_blank');
  }

  viewAllReviews(): void {
    this.router.navigate(['/reviews/business', this.businessId()]);
  }

  private async showLoadingIndicator(message: string) {
    const loading = await this.loadingController.create({
      message,
      duration: 10000
    });
    await loading.present();
    return loading;
  }
}

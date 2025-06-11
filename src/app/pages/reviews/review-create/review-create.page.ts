import { Component, inject, signal, effect } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonBackButton, IonButtons, IonItem, IonTextarea, IonIcon, IonAlert, IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '@services/api/index';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { APP_ROUTES } from '@utils/constants';
import { getRatingArray, getRatingText } from '@utils/rating.utils';

@Component({
  selector: 'app-create-review',
  templateUrl: './review-create.page.html',
  styleUrls: ['./review-create.page.css'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonBackButton, 
    IonButtons, IonItem, IonTextarea, IonIcon, IonAlert, IonSpinner, FormsModule
  ]
})
export class CreateReviewPage {
  // Signals para estado reactivo
  readonly businessId = signal<number>(0);
  readonly bookingId = signal<number | undefined>(undefined);
  readonly businessName = signal<string>('');
  readonly review = signal({
    rating: 0,
    comment: ''
  });
  readonly isSubmitting = signal<boolean>(false);
  readonly showAlert = signal<boolean>(false);
  readonly alertType = signal<'success' | 'error'>('success');
  readonly alertMessage = signal<string>('');

  // Servicios inyectados
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reviewService = inject(ReviewService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);

  constructor() {
    // Cargar datos desde los query params de la URL
    this.route.queryParams.subscribe(params => {
      console.log('Query params recibidos:', params);
      
      if (params['businessId']) {
        this.businessId.set(+params['businessId'] || 0);
        this.bookingId.set(params['bookingId'] ? +params['bookingId'] : undefined);
        this.businessName.set(params['businessName'] || 'este negocio');
        
        console.log('Datos cargados:', {
          businessId: this.businessId(),
          bookingId: this.bookingId(),
          businessName: this.businessName()
        });
      } else {
        // Si no hay parámetros necesarios, redirigir con error
        setTimeout(() => {
          this.notificationService.showError('Error', 'No se pudieron cargar los datos de la reserva');
          this.router.navigate([APP_ROUTES.BOOKINGS]);
        }, 100);
      }
    });
  }

  readonly setRating = (rating: number): void => {
    this.review.update(current => ({ ...current, rating }));
  };

  readonly updateComment = (comment: string): void => {
    this.review.update(current => ({ ...current, comment }));
  };

  readonly submitReview = async (): Promise<void> => {
    if (!this.isValidReview()) {
      this.notificationService.showError('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    const currentReview = this.review();
    const reviewData = {
      business_id: this.businessId(),
      rating: currentReview.rating,
      comment: currentReview.comment.trim() || undefined,
      ...(this.bookingId() && { booking_id: this.bookingId() })
    };

    const created = await this.dataLoader.fromObservable(
      this.reviewService.createReview(reviewData),
      {
        loadingSignal: this.isSubmitting,
        successMessage: '¡Reseña enviada exitosamente! Gracias por tu opinión.',
        errorMessage: 'Error al enviar la reseña. Por favor intenta de nuevo.'
      }
    );

    if (created) {
      // Redirigir después de un breve delay
      setTimeout(() => {
        this.router.navigate([APP_ROUTES.BOOKINGS]);
      }, 1500);
    }
  };

  // Utilidades de rating
  readonly getRatingText = (): string => getRatingText(this.review().rating);
  readonly getRatingArray = getRatingArray;

  readonly isValidReview = (): boolean => {
    return this.review().rating > 0 && !this.isSubmitting();
  };

  readonly onAlertDismiss = (): void => {
    this.showAlert.set(false);
  };
}

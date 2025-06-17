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
  
 businessId = signal<number>(0);
 bookingId = signal<number | undefined>(undefined);
 businessName = signal<string>('');
 review = signal({
    rating: 0,
    comment: ''
  });
 isSubmitting = signal<boolean>(false);
 showAlert = signal<boolean>(false);
 alertType = signal<'success' | 'error'>('success');
 alertMessage = signal<string>('');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reviewService = inject(ReviewService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);

  constructor() {
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

 setRating = (rating: number): void => {
    this.review.update(current => ({ ...current, rating }));
  };

 updateComment = (comment: string): void => {
    this.review.update(current => ({ ...current, comment }));
  };

 submitReview = async (): Promise<void> => {
    if (!this.isValidReview()) {
      const businessId = this.businessId();
      const currentReview = this.review();
      const trimmedComment = currentReview.comment.trim();
      
      let errorMessage = 'Por favor completa todos los campos requeridos:';
      
      if (businessId <= 0) {
        errorMessage = 'Error: No se pudo identificar el negocio';
      } else if (currentReview.rating <= 0) {
        errorMessage = 'Por favor selecciona una calificación';
      } else if (trimmedComment.length > 0 && trimmedComment.length < 10) {
        errorMessage = 'El comentario debe tener al menos 10 caracteres';
      }
      
      this.notificationService.showError('Error', errorMessage);
      return;
    }

    const currentReview = this.review();
    const trimmedComment = currentReview.comment.trim();

    const reviewData: any = {
      business_id: this.businessId(),
      rating: currentReview.rating
    };
    
    if (trimmedComment.length > 0) {
      reviewData.comment = trimmedComment;
    }
    
    const bookingId = this.bookingId();
    if (bookingId && bookingId > 0) {
      reviewData.booking_id = bookingId;
    }

    console.log('Enviando datos de reseña:', reviewData);

    const created = await this.dataLoader.fromObservable(
      this.reviewService.createReview(reviewData),
      {
        loadingSignal: this.isSubmitting,
        successMessage: '¡Reseña enviada exitosamente! Gracias por tu opinión.',
        errorMessage: 'Error al enviar la reseña. Por favor intenta de nuevo.'
      }
    );

    if (created) {
      setTimeout(() => {
        this.router.navigate([APP_ROUTES.BOOKINGS]);
      }, 1500);
    }
  };

 getRatingText = (): string => getRatingText(this.review().rating);
 getRatingArray = getRatingArray;

 isValidReview = (): boolean => {
    const currentReview = this.review();
    const businessId = this.businessId();
    
    if (this.isSubmitting()) return false;
    if (businessId <= 0) return false;
    if (currentReview.rating <= 0 || currentReview.rating > 5) return false;
    
    const trimmedComment = currentReview.comment.trim();
    if (trimmedComment.length > 0 && trimmedComment.length < 10) return false;
    
    return true;
  };

 onAlertDismiss = (): void => {
    this.showAlert.set(false);
  };
}

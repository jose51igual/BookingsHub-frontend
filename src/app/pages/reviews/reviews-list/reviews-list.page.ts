import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonBackButton, IonButtons, IonItem, IonLabel, IonIcon, IonSearchbar, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService, BusinessService } from '@services/api/index';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { AuthSignalService } from '@services/index';
import { Review, Business } from '@interfaces/index';
import { APP_ROUTES } from '@utils/constants';
import { getStarArray, getRelativeTime, formatRating } from '@utils/index';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reviews-list',
  templateUrl: './reviews-list.page.html',
  styleUrls: ['./reviews-list.page.css'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonBackButton, 
    IonButtons, IonItem, IonLabel, IonIcon, IonSearchbar, IonSelect, IonSelectOption,
    IonCard, IonCardHeader, IonCardContent, IonRefresher, IonRefresherContent, 
    FormsModule
  ]
})
export class ReviewsListPage {
  
 businessId = signal<number | undefined>(undefined);
 business = signal<Business | undefined>(undefined);
 allReviews = signal<Review[]>([]);
 isLoading = signal<boolean>(false);
 error = signal<string | null>(null);
 isFromBusinessPanel = signal<boolean>(false);
  
  // Filtros
 sortBy = signal<string>('newest');
 filterRating = signal<string>('all');
 searchTerm = signal<string>('');

  // Reviews filtrados y ordenados
 filteredReviews = computed(() => {
    let reviews = [...this.allReviews()];
    
    // Filtrar por rating
    if (this.filterRating() !== 'all') {
      const rating = parseInt(this.filterRating());
      reviews = reviews.filter(review => review.rating === rating);
    }
    
    // Filtrar por búsqueda
    if (this.searchTerm().trim()) {
      const searchLower = this.searchTerm().toLowerCase();
      reviews = reviews.filter(review => 
        review.comment?.toLowerCase().includes(searchLower) ||
        review.user_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordenar
    reviews.sort((a, b) => {
      switch (this.sortBy()) {
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        case 'highest':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest':
          return (a.rating || 0) - (b.rating || 0);
        default:
          return 0;
      }
    });
    
    return reviews;
  });

  // Servicios inyectados
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reviewService = inject(ReviewService);
  private businessService = inject(BusinessService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);
  private authService = inject(AuthSignalService);

  constructor() {
    this.initializeFromRoute();
  }

  private initializeFromRoute(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.businessId.set(parseInt(id));
      this.isFromBusinessPanel.set(false);
      this.loadData();
    } else {
      this.isFromBusinessPanel.set(true);
      this.loadBusinessFromUser();
    }
  }

  private async loadBusinessFromUser(): Promise<void> {
    try {
      this.isLoading.set(true);
      
      const user = this.authService.user;
      
      if (!user?.id || user.role !== 'negocio') {
        this.notificationService.showError('Error', 'No se encontró información del negocio');
        return;
      }

      const response = await firstValueFrom(this.businessService.getBusinessByUserId());
      
      const businessData = (response as any)?.success ? (response as any).data : response;
      
      if (!businessData?.id) {
        this.notificationService.showError('Error', 'No se pudo obtener información del negocio');
        return;
      }

      this.businessId.set(businessData.id);
      this.business.set(businessData);
      
      await this.loadReviews();
      
    } catch (error) {
      console.error('ReviewsListPage] Error al cargar negocio del usuario:', error);
      this.notificationService.showError('Error', 'Error al cargar información del negocio');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadData(): Promise<void> {
    const businessId = this.businessId();
    if (!businessId) return;

    this.isLoading.set(true);
    
    try {
      if (this.isFromBusinessPanel() && this.business()) {
        await this.loadReviews();
      } else {
        const [businessResponse, reviewsResponse] = await Promise.all([
          this.dataLoader.fromObservable(
            this.businessService.getBusinessById(businessId),
            { 
              errorMessage: 'Error al cargar información del negocio'
            }
          ),
          this.dataLoader.fromObservable(
            this.reviewService.getBusinessReviews(businessId),
            { 
              errorMessage: 'Error al cargar las reseñas'
            }
          )
        ]);

        if (businessResponse) {
          this.business.set(businessResponse);
        }
        
        if (reviewsResponse) {
          this.allReviews.set(reviewsResponse);
        }
      }
    } catch (error) {
      this.error.set('Error al cargar los datos');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadReviews(): Promise<void> {
    const businessId = this.businessId();
    if (!businessId) {
      return;
    }

    try {
      const reviewsResponse = await firstValueFrom(
        this.reviewService.getBusinessReviews(businessId)
      );
      
      if (reviewsResponse) {
        this.allReviews.set(reviewsResponse);
      } else {
        this.allReviews.set([]);
      }
    } catch (error) {
      this.notificationService.showError('Error', 'Error al cargar las reseñas');
    }
  }

 onRefresh = async (event: any): Promise<void> => {
    await this.loadData();
    event.target.complete();
  };

 onSortChange = (value: string): void => {
    this.sortBy.set(value);
  };

 onFilterChange = (value: string): void => {
    this.filterRating.set(value);
  };

 onSearchInput = (event: any): void => {
    this.searchTerm.set(event.target.value || '');
  };

 goBack = (): void => {
    if (this.isFromBusinessPanel()) {
      this.router.navigate(['/panel-negocio/principal']);
    } else {
      const businessId = this.businessId();
      this.router.navigate([APP_ROUTES.BUSINESS_DETAIL(businessId || 0)]);
    }
  };

 getStarArray = getStarArray;
 getRelativeTime = getRelativeTime;
 formatRating = formatRating;
}

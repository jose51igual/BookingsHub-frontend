import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BusinessService } from '@services/api';
import { AuthSignalService, BaseDataLoaderService } from '@services/index';
import { ServiceCardComponent } from '@app/components/business/service-card/service-card.component';
import { LoadingIndicatorComponent } from '@app/components/ui/loading-indicator/loading-indicator.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state/empty-state.component';
import { Category, ServiceBusiness } from '@interfaces/index';
import { IonicModule } from '@ionic/angular';
import { BUSINESS_CATEGORIES, normalizeCategory, CATEGORY_MAPPING } from '@utils/constants';
import { isBusinessOpen } from '@utils/date.utils';


@Component({
  selector: 'app-services',
  templateUrl: './services-discovery.page.html',
  styleUrls: ['./services-discovery.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ServiceCardComponent,
    LoadingIndicatorComponent,
    EmptyStateComponent
  ]
})
export class ServicesPage {
  // Servicios inyectados con inject()
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthSignalService);
  private readonly dataLoader = inject(BaseDataLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals para estado reactivo
  readonly services = signal<ServiceBusiness[]>([]);
  readonly featuredServices = signal<ServiceBusiness[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('todas');

  // Categorías disponibles - usando las categorías unificadas
  readonly categories: readonly Category[] = [
    { id: 'todas', name: 'Todas', icon: 'apps-outline' },
    ...BUSINESS_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon
    }))
  ] as const;

  // Computed signals para datos derivados
  readonly userRole = computed(() => this.authService.user?.role || '');
  
  readonly isBusinessOwner = computed(() => this.userRole() === 'negocio');
  
  readonly userHasBusiness = computed(() => {
    const user = this.authService.user;
    // Verificar si el usuario tiene un negocio basado en su rol y datos
    return user?.role === 'negocio' && user?.businessId !== null && user?.businessId !== undefined;
  });
  
  readonly selectedCategoryName = computed(() => {
    const categoryId = this.selectedCategory();
    if (categoryId === 'todas') {
      return 'Todas las categorías';
    }
    return this.categories.find(c => c.id === categoryId)?.name || 'Categoría desconocida';
  });

  readonly hasActiveFilters = computed(() => 
    !!(this.searchQuery() || (this.selectedCategory() && this.selectedCategory() !== 'todas'))
  );

  readonly isShowingAllCategories = computed(() => 
    this.selectedCategory() === 'todas'
  );

  readonly filteredServices = computed(() => {
    let filtered = this.services();
    const searchTerm = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    
    // Filtrar por categoría
    if (category && category !== 'todas') {
      filtered = filtered.filter(service => {
        const serviceCategory = normalizeCategory(service.category);
        return serviceCategory === category;
      });
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm) ||
        service.address.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  });

  constructor() {
    // Cargar datos iniciales
    this.loadServices();
    
    // Effect para manejar parámetros de ruta (categoría desde home)
    effect(() => {
      this.route.queryParams.subscribe(params => {
        if (params['category']) {
          this.selectedCategory.set(params['category']);
        }
      });
    });
  }

  // Métodos de carga de datos
  private async loadServices(): Promise<void> {
    const response = await this.dataLoader.fromObservable(
      this.businessService.getAllBusinesses(),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'No se pudieron cargar los servicios. Intenta de nuevo.'
      }
    );

    if (response) {
      // Usar response.data que contiene el array de negocios
      const businesses = response.data || [];
      const services: ServiceBusiness[] = businesses.map((business: any) => {
        return {
          id: business.id,
          name: business.name,
          business_name: business.name,
          business_address: business.address || '',
          description: business.description || '',
          price: business.price || 0,
          duration: business.duration || 60,
          category: normalizeCategory(business.category || 'otros'), // Normalizar categoría
          address: business.address || '',
          image: business.image || '/assets/images/default-business.png',
          rating: parseFloat(business.rating) || 0,
          reviewCount: business.reviewCount || 0,
          isOpen: isBusinessOpen(business), // Usar nueva lógica inteligente
          isFeatured: business.is_featured === 1
        };
      });

      this.services.set(services);
      this.loadFeaturedServices();
    }
  }

  private loadFeaturedServices(): void {
    const featured = this.services().filter(service => service.isFeatured);
    this.featuredServices.set(featured);
  }

  // Manejadores de eventos
  onSearchChange(event: any): void {
    const value = event.detail?.value || '';
    this.searchQuery.set(value);
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  onServiceCardClick(service: ServiceBusiness): void {
    this.router.navigate(['/negocio', service.id]);
  }

  navigateToBusinessDashboard(): void {
    this.router.navigate(['/business-profile']);
  }

  // Método para reiniciar filtros
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('todas');
  }

  // Método para obtener mensaje del estado vacío
  getEmptyStateMessage(): string {
    const searchTerm = this.searchQuery();
    const category = this.selectedCategory();
    
    if (searchTerm) {
      return `No hay resultados para "${searchTerm}"`;
    }
    
    if (category && category !== 'todas') {
      return `No hay servicios en la categoría "${this.selectedCategoryName()}"`;
    }
    
    return 'Aún no hay servicios disponibles';
  }
}

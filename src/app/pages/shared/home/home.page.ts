import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

import { AuthSignalService } from '@services/index';
import { CategoryData } from '@interfaces/index';
import { BUSINESS_CATEGORIES } from '@utils/constants';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule
  ]
})
export class HomePage {
  private  authService = inject(AuthSignalService);
  private  router = inject(Router);

   categoriesLoaded = signal<boolean>(false);
   popularCategories = signal< CategoryData[]>(
    BUSINESS_CATEGORIES.slice(0, 6).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: this.getCategoryDescription(cat.id),
      icon: cat.icon,
      color: this.getCategoryColor(cat.id)
    }))
  );

   isAuthenticated = computed(() => !!this.authService.user);
  
   userName = computed(() => 
    this.authService.user?.name || 'Usuario'
  );
  
   isBusinessOwner = computed(() => 
    this.authService.user?.role === 'negocio'
  );
  
   hasBusinessId = computed(() => {
    const user = this.authService.user;
    return !!(user && (user as any).business_id);
  });
  
   userBusinessId = computed(() => {
    const user = this.authService.user;
    return user ? (user as any).business_id || null : null;
  });

  constructor() {
    this.loadCategories();
  }

  private loadCategories = (): void => {
    console.log('Categorías cargadas:', this.popularCategories().length);
    this.categoriesLoaded.set(true);
  };

  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      'belleza-y-cuidado-personal': 'Salones, peluquerías, spas',
      'salud-y-bienestar': 'Médicos, dentistas, terapias',
      'consultoria': 'Asesoría empresarial, negocios',
      'educacion': 'Clases, tutorías, cursos',
      'tecnologia': 'Informática, software, IT',
      'reparaciones': 'Mantenimiento, arreglos',
      'limpieza': 'Servicios de limpieza',
      'entretenimiento': 'Eventos, música, diversión',
      'deportes': 'Gimnasios, entrenadores, fitness',
      'otros': 'Servicios diversos'
    };
    return descriptions[categoryId] || 'Servicios profesionales';
  }

  private getCategoryColor(categoryId: string): string {
    const colors: Record<string, string> = {
      'belleza-y-cuidado-personal': '#ff6b6b',
      'salud-y-bienestar': '#feca57',
      'consultoria': '#96ceb4',
      'educacion': '#ff9ff3',
      'tecnologia': '#45b7d1',
      'reparaciones': '#fd79a8',
      'limpieza': '#00cec9',
      'entretenimiento': '#a29bfe',
      'deportes': '#4ecdc4',
      'otros': '#6c5ce7'
    };
    return colors[categoryId] || '#74b9ff';
  }

   navigateToCategory = (category: CategoryData): void => {
    console.log('Navegando a categoría:', category.name);
    this.router.navigate(['/negocios'], { 
      queryParams: { category: category.id }
    });
  };

   navigateToServices = (): void => {
    this.router.navigate(['/negocios']);
  };

   navigateToLogin = (): void => {
    this.router.navigate(['/iniciar-sesion']);
  };

   navigateToRegister = (): void => {
    this.router.navigate(['/tipo-registro']);
  };
}

import { Component, computed, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSignalService, NotificationService } from '@services/index';
import { AnalyticsService, BusinessService } from '@services/api/index';
import { firstValueFrom } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { DashboardMetric } from '../../../models/index';

@Component({
  selector: 'app-business-dashboard-main',
  templateUrl: './business-dashboard-main.page.html',
  styleUrls: ['./business-dashboard-main.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class BusinessDashboardMainPage {
  
  // Usuario actual
  user = computed(() => this.authService.user);
  
  // Métricas del dashboard
  metrics = signal<DashboardMetric[]>([
    {
      title: 'Reservas Hoy',
      value: '12',
      icon: 'calendar-outline',
      color: 'primary',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Ingresos del Mes',
      value: '$2,450',
      icon: 'cash-outline',
      color: 'success',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Clientes Nuevos',
      value: '8',
      icon: 'people-outline',
      color: 'tertiary',
      trend: '+22%',
      trendUp: true
    },
    {
      title: 'Calificación Promedio',
      value: '4.8',
      icon: 'star-outline',
      color: 'warning',
      trend: '+0.2',
      trendUp: true
    }
  ]);

  private router = inject(Router);
  private authService = inject(AuthSignalService);
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);

  constructor() {
    // Effect para cargar datos cuando el usuario esté disponible
    effect(() => {
      const user = this.authService.user;
      const isAuthenticated = this.authService.isAuthenticated;
      
      if (isAuthenticated && user?.role === 'negocio') {
        this.loadDashboardData();
      }
    });
  }

  private async loadDashboardData() {
    try {
      // Obtener analíticas para el dashboard (período de 1 mes)
        const response = await firstValueFrom(this.analyticsService.getBusinessAnalytics('1month'));
        
        if (response && response.success) {
          const data = response.data;
          
          // Formatear el rating promedio correctamente
          const averageRating = data.averageRating || 0;
          const formattedRating = averageRating > 0 ? averageRating.toFixed(1) : '0.0';
          
          // Actualizar métricas con datos reales
          this.metrics.set([
            {
              title: 'Reservas Hoy',
              value: data.totalBookings.toString(),
              icon: 'calendar-outline',
              color: 'primary',
              trend: '+15%', // Se podría calcular comparando con período anterior
              trendUp: true
            },
            {
              title: 'Ingresos del Mes',
              value: `$${data.totalRevenue.toFixed(2)}`,
              icon: 'cash-outline',
              color: 'success',
              trend: '+8%',
              trendUp: true
            },
            {
              title: 'Calificación Promedio',
              value: formattedRating,
              icon: 'star-outline',
              color: 'warning',
              trend: averageRating > 0 ? '+0.2' : '0',
              trendUp: averageRating > 0
            },
            {
              title: 'Servicios Activos',
              value: data.totalServices.toString(),
              icon: 'list-outline',
              color: 'tertiary',
              trend: '0',
              trendUp: true
            }
          ]);
        }
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      await this.notificationService.showError('Error', 'No se pudieron cargar los datos del dashboard');
    }
  }

  navigateToBookings() {
    this.router.navigate(['/panel-negocio/reservas']);
  }

  navigateToServices() {
    this.router.navigate(['/panel-negocio/servicios']);
  }

  navigateToAnalytics() {
    this.router.navigate(['/panel-negocio/estadisticas']);
  }

  navigateToReviews() {
    this.router.navigate(['/panel-negocio/resenas']);
  }
}

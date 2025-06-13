import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AnalyticsService } from '@services/api';
import { NotificationService } from '@services/index';
import { firstValueFrom } from 'rxjs';
import { AnalyticsData } from '@interfaces/index';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.css'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AnalyticsPage {
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);

  businessId: string = '';
  analyticsData: AnalyticsData | null = null;
  isLoading = signal(true);
  selectedPeriod = '3months';
  
  periodOptions = [
    { value: '1month', label: '1 Mes' },
    { value: '3months', label: '3 Meses' },
    { value: '6months', label: '6 Meses' },
    { value: '1year', label: '1 Año' }
  ];

  constructor() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    try {
      this.isLoading.set(true);
      
      // Obtener datos reales del API
      const response = await firstValueFrom(this.analyticsService.getBusinessAnalytics(this.selectedPeriod));
      
      if (response && response.success && response.data) {
        this.analyticsData = response.data;
      } else {
        throw new Error('Error en la respuesta del servidor');
        }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      await this.notificationService.showError('Error', 'Error al cargar las estadísticas');
      
      // En caso de error, cargar datos de muestra como fallback
      await this.loadSampleAnalytics();
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadSampleAnalytics() {
    // Simular tiempo de carga
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.analyticsData = {
      totalBookings: 156,
      totalRevenue: 12450.75,
      averageRating: 4.6,
      totalServices: 8,
      bookingsByMonth: [
        { month: 'Enero', count: 42 },
        { month: 'Febrero', count: 38 },
        { month: 'Marzo', count: 45 },
        { month: 'Abril', count: 52 },
        { month: 'Mayo', count: 48 },
        { month: 'Junio', count: 55 }
      ],
      popularServices: [
        { name: 'Corte de Cabello', bookings: 45 },
        { name: 'Manicure', bookings: 32 },
        { name: 'Pedicure', bookings: 28 },
        { name: 'Facial', bookings: 25 }
      ],
      revenueByService: [
        { name: 'Corte de Cabello', revenue: 4500 },
        { name: 'Manicure', revenue: 2800 },
        { name: 'Pedicure', revenue: 2100 },
        { name: 'Facial', revenue: 3050.75 }
      ],
      customerRetention: 78
    };
  }

  async onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    await this.loadAnalytics();
  }

  goToBookings() {
    this.router.navigate(['/panel-negocio/reservas']);
  }

  goToServices() {
    this.router.navigate(['/panel-negocio/servicios']);
  }

  exportData() {
    // Implementar exportación de datos
    if (!this.analyticsData) {
      this.notificationService.showWarning('Sin datos', 'No hay datos de analíticas para exportar');
      return;
    }

    try {
      // Crear un objeto con todos los datos de analíticas
      const dataToExport = {
        businessId: this.businessId,
        period: this.selectedPeriod,
        exportDate: new Date().toISOString(),
        analytics: this.analyticsData
      };

      // Convertir a JSON y crear blob
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${this.businessId}-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      
      // Ejecutar descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL del objeto
      window.URL.revokeObjectURL(url);
      
      this.notificationService.showSuccess('Éxito', 'Datos de analíticas exportados exitosamente');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      this.notificationService.showError('Error', 'Error al exportar datos');
    }
  }

  refreshData() {
    this.loadAnalytics();
  }
}

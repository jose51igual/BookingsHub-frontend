import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {  ActionSheetController, AlertController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { ServiceService, BusinessService } from '@services/api';
import { AuthSignalService, NotificationService, BaseDataLoaderService } from '@services/index';
import { ErrorAlertComponent } from '@components/ui/error-alert/error-alert.component';
import { IonicModule } from '@ionic/angular';
import { Service } from '@interfaces/index';
import { ERROR_MESSAGES } from '@utils/constants';

@Component({
  selector: 'app-business-services',
  templateUrl: './services-management.page.html',
  styleUrls: ['./services-management.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ErrorAlertComponent
  ]
})
export class BusinessServicesPage {
  private serviceService = inject(ServiceService);
  private businessService = inject(BusinessService);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);
  private router = inject(Router);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);

  services = signal<Service[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedService = signal<Service | null>(null);
  businessId = signal<number | null>(null);

  // Estados para los modales
  isActionSheetOpen = signal(false);
  isDeleteAlertOpen = signal(false);

  constructor() {
    this.loadBusinessInfo();
  }

  private async loadBusinessInfo() {
    try {
      const user = this.authService.user;
      const isAuthenticated = this.authService.isAuthenticated;
      
      if (!user?.id) {
        this.errorMessage.set('No se encontró información del usuario');
        return;
      }

      if (!isAuthenticated) {
        this.errorMessage.set('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }
      const response = await firstValueFrom(this.businessService.getBusinessByUserId());
      
      let business;
      if (response && typeof response === 'object') {
        if ((response as any).success && (response as any).data) {
          business = (response as any).data;
        } else if ((response as any).id) {
          business = response;
        }
      }
      
      if (business && business.id) {
        this.businessId.set(business.id);
        await this.loadServices();
      } else {
        this.errorMessage.set('No se encontró información del negocio. Asegúrate de haber creado un negocio primero.');
      }
    } catch (error: any) {
      console.error('Error cargando información del negocio:', error);
      console.error('Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      
      if (error.status === 403) {
        this.errorMessage.set('No tienes permisos para acceder a esta información. Verifica que hayas iniciado sesión correctamente.');
      } else if (error.status === 401) {
        this.errorMessage.set('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.status === 404) {
        this.errorMessage.set('No se encontró ningún negocio asociado a tu cuenta. Crea un negocio primero.');
      } else {
        this.errorMessage.set(error.message || 'Error al cargar información del negocio');
      }
    }
  }

  async loadServices() {
    const businessId = this.businessId();
    if (!businessId) {
      this.errorMessage.set('No se encontró información del negocio');
      return;
    }

    const services = await this.dataLoader.withLoadingAndError(
      async () => {
        const response = await firstValueFrom(this.serviceService.getServicesByBusiness(businessId));
        
        const services = response || [];
        
        if (Array.isArray(services)) {
          return services;
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      },
      {
        loadingSignal: this.isLoading,
        errorMessage: ERROR_MESSAGES.LOAD_SERVICES,
        showLoading: true
      }
    );

    if (services) {
      this.services.set(services);
      this.errorMessage.set('');
    } else {
      this.services.set([]);
      this.errorMessage.set('No se encontraron servicios para este negocio. Crea tu primer servicio.');
    }
  }

  async showServiceOptions(service: Service) {
    this.selectedService.set(service);
    
    const actionSheet = await this.actionSheetCtrl.create({
      header: service.name,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => {
            this.editService(service);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteService(service);
          }
        },
        {
          text: (service.status === 'active') ? 'Desactivar' : 'Activar',
          icon: (service.status === 'active') ? 'pause-outline' : 'play-outline',
          handler: () => {
            this.toggleServiceStatus(service);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  addService() {
    this.router.navigate(['/panel-negocio/crear-servicio']);
  }

  editService(service: Service) {
    this.router.navigate(['/panel-negocio/editar-servicio', service.id]);
  }

  async confirmDeleteService(service: Service) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteService(service);
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteService(service: Service) {
    const success = await this.dataLoader.withLoadingAndError(
      async () => {
        await firstValueFrom(this.serviceService.deleteService(service.id));
        
        const currentServices = this.services();
        this.services.set(currentServices.filter(s => s.id !== service.id));
        
        return true;
      },
      {
        errorMessage: 'Error al eliminar el servicio',
        showLoading: true,
        successMessage: 'Servicio eliminado correctamente'
      }
    );

    if (success) {
      await this.notificationService.showSuccess('Éxito', 'Servicio eliminado correctamente');
    }
  }

  async toggleServiceStatus(service: Service) {
    // Si no tiene status, por defecto se considera activo
    const currentStatus = service.status || 'active';
    const newStatus: 'active' | 'inactive' = currentStatus === 'active' ? 'inactive' : 'active';
    
    const success = await this.dataLoader.withLoadingAndError(
      async () => {
        await firstValueFrom(this.serviceService.updateService(service.id, {
          ...service,
          status: newStatus
        }));
        
        const currentServices = this.services();
        const updatedServices = currentServices.map(s => 
          s.id === service.id ? { ...s, status: newStatus } as Service : s
        );
        this.services.set(updatedServices);
        
        return true;
      },
      {
        errorMessage: 'Error al actualizar el servicio',
        showLoading: true
      }
    );

    if (success) {
      const statusText = newStatus === 'active' ? 'activado' : 'desactivado';
      await this.notificationService.showSuccess('Éxito', `Servicio ${statusText} correctamente`);
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  // Método para obtener ícono basado en categoría
  getCategoryIcon(category: string): string {
    const categoryIcons: { [key: string]: string } = {
      'Belleza y cuidado personal': 'flower-outline',
      'Salud y bienestar': 'fitness-outline',
      'Consultoría': 'bulb-outline',
      'Educación': 'school-outline',
      'Tecnología': 'laptop-outline',
      'Reparaciones': 'build-outline',
      'Limpieza': 'sparkles-outline',
      'Entretenimiento': 'musical-notes-outline',
      'Deportes': 'football-outline',
      'Otros': 'business-outline'
    };

    return categoryIcons[category] || categoryIcons['Otros'];
  }

  clearError() {
    this.errorMessage.set('');
  }
}

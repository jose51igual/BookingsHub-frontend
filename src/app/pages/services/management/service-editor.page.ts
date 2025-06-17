import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ServiceService, BusinessService } from '@services/api';
import { AuthSignalService, NotificationService, BaseDataLoaderService } from '@services/index';
import { IonicModule } from '@ionic/angular';
import { ServiceFormData } from '@interfaces/index';

@Component({
  selector: 'app-service-create',
  templateUrl: './service-editor.page.html',
  styleUrls: ['./service-editor.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class ServiceCreatePage {
  private serviceService = inject(ServiceService);
  private businessService = inject(BusinessService);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);
  private dataLoader = inject(BaseDataLoaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  
 errorMessage = signal<string>('');
 isSubmitting = signal(false);
 businessId = signal<number | null>(null);
 serviceId = signal<number | null>(null);
 isEditMode = signal(false);

 pageTitle = computed(() => 
    this.isEditMode() ? 'Editar Servicio' : 'Crear Servicio'
  );
  
 submitButtonText = computed(() => 
    this.isEditMode() ? 'Actualizar Servicio' : 'Crear Servicio'
  );

 loadingText = computed(() => 
    this.isSubmitting() ? (this.isEditMode() ? 'Actualizando...' : 'Creando...') : this.submitButtonText()
  );

 businessStatus = computed(() => {
    const businessId = this.businessId();
    if (businessId) {
      return { loaded: true, message: '' };
    } else if (this.isEditMode()) {
      return { loaded: false, message: 'Cargando información del servicio...' };
    } else {
      return { loaded: false, message: 'Cargando información del negocio...' };
    }
  });

  get isFormValid() {
    return this.serviceForm.valid;
  }
  
  get canSubmit() {
    const hasBusinessId = this.businessId() !== null;
    const isFormValid = this.isFormValid;
    const isNotSubmitting = !this.isSubmitting();
    
    return hasBusinessId && isFormValid && isNotSubmitting;
  }

 serviceForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    duration: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
    price: [0, [Validators.required, Validators.min(0)]],
    category: [''],
    image: [''],
    benefits: ['']
  });

 categories = [
    'Belleza y cuidado personal',
    'Salud y bienestar', 
    'Consultoría',
    'Educación',
    'Tecnología',
    'Reparaciones',
    'Limpieza',
    'Entretenimiento',
    'Deportes',
    'Otros'
  ] as const;

  constructor() {
    effect(() => {
      const serviceIdParam = this.route.snapshot.paramMap.get('id');
      
      if (serviceIdParam) {
        const id = parseInt(serviceIdParam);
        if (!isNaN(id)) {
          this.serviceId.set(id);
          this.isEditMode.set(true);
          this.loadServiceData();
        }
      } else {
        this.isEditMode.set(false);
        this.loadBusinessInfo();
      }
    });
  }

  private async loadBusinessInfo(): Promise<void> {
    try {
      const user = this.authService.user;
      
      if (!user?.id) {
        console.error('No user ID found');
        this.errorMessage.set('No se encontró información del usuario');
        return;
      }

      const response = await firstValueFrom(this.businessService.getUserBusinesses());

      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        const apiResponse = response as any;
        if (apiResponse.success && apiResponse.data) {
          const businessData = apiResponse.data;
          
          if (businessData.id) {
            this.businessId.set(businessData.id);
            this.errorMessage.set('');
          } else if (Array.isArray(businessData) && businessData.length > 0) {
            this.businessId.set(businessData[0].id);
            this.errorMessage.set('');
          } else {
            console.error('No valid business data found');
            this.errorMessage.set('No se encontró información del negocio');
          }
        } else {
          console.error('API response unsuccessful');
          this.errorMessage.set('No se encontró información del negocio');
        }
      } else if (Array.isArray(response) && response.length > 0) {
        this.businessId.set(response[0].id);
        this.businessId.set(response[0].id);
        this.errorMessage.set('');
      } else {
        console.error('No businesses found for user');
        this.errorMessage.set('No se encontró información del negocio');
      }
    } catch (error) {
      console.error('Error loading business info:', error);
      this.errorMessage.set('Error al cargar información del negocio');
    }
  }

  private async loadServiceData(): Promise<void> {
    const serviceId = this.serviceId();
    if (!serviceId) return;

    const service = await this.dataLoader.withLoadingAndError(
      async () => {
        return await firstValueFrom(this.serviceService.getServiceById(serviceId));
      },
      {
        errorMessage: 'Error al cargar los datos del servicio',
        showLoading: true
      }
    );

    if (service) {
      const formData = {
        name: service.name || '',
        description: service.description || '',
        duration: Number(service.duration) || 60,
        price: Number(service.price) || 0,
        category: service.category || '',
        image: service.image || '',
        benefits: ''
      };
      this.serviceForm.patchValue(formData);
      
      this.serviceForm.markAllAsTouched();
      
      if (service.business_id) {
        this.businessId.set(service.business_id);
      } else {
        await this.loadBusinessInfo();
      }
    }
  }

  async createService(): Promise<void> {
    if (!this.canSubmit) {
      this.markFormGroupTouched();
      return;
    }

    const businessId = this.businessId();
    if (!businessId) {
      const isEdit = this.isEditMode();
      if (isEdit) {
        this.errorMessage.set('Error: No se pudo identificar el negocio del servicio. Inténtalo de nuevo.');
      } else {
        this.errorMessage.set('Error: No se encontró información del negocio. Verifica que tu perfil de negocio esté completo.');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const serviceData: ServiceFormData = this.serviceForm.value;
    const isEdit = this.isEditMode();
    
    const success = await this.dataLoader.withLoadingAndError(
      async () => {
        if (isEdit) {
          const serviceId = this.serviceId();
          if (!serviceId) throw new Error('ID del servicio no encontrado');
          
          await firstValueFrom(this.serviceService.updateService(serviceId, serviceData));
        } else {
          await firstValueFrom(this.serviceService.createService(businessId, serviceData));
        }
        return true;
      },
      {
        errorMessage: `Error al ${isEdit ? 'actualizar' : 'crear'} el servicio`,
        showLoading: true,
        successMessage: `Servicio ${isEdit ? 'actualizado' : 'creado'} correctamente`
      }
    );

    if (success) {
      await this.notificationService.showSuccess(
        'Éxito', 
        `Servicio ${isEdit ? 'actualizado' : 'creado'} correctamente`
      );
      this.router.navigate(['/panel-negocio/servicios']);
    }
    
    this.isSubmitting.set(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.serviceForm.controls).forEach(key => {
      this.serviceForm.get(key)?.markAsTouched();
    });
  }

 getFieldErrors = computed(() => {
    const errors: Record<string, string> = {};
    
    Object.keys(this.serviceForm.controls).forEach(fieldName => {
      const field = this.serviceForm.get(fieldName);
      if (field?.errors && field.touched) {
        if (field.errors['required']) {
          errors[fieldName] = `${this.getFieldLabel(fieldName)} es requerido`;
        } else if (field.errors['minlength']) {
          errors[fieldName] = `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
        } else if (field.errors['maxlength']) {
          errors[fieldName] = `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
        } else if (field.errors['min']) {
          errors[fieldName] = `Valor mínimo: ${field.errors['min'].min}`;
        } else if (field.errors['max']) {
          errors[fieldName] = `Valor máximo: ${field.errors['max'].max}`;
        }
      }
    });
    
    return errors;
  });

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'El nombre del servicio',
      description: 'La descripción',
      price: 'El precio',
      duration: 'La duración'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  goBack(): void {
    this.router.navigate(['/panel-negocio/servicios']);
  }
}

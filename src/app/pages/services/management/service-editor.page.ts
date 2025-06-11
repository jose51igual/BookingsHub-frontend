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
  // Servicios inyectados con inject()
  private readonly serviceService = inject(ServiceService);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthSignalService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  // Signals para estado reactivo
  readonly errorMessage = signal<string>('');
  readonly isSubmitting = signal(false);
  readonly businessId = signal<number | null>(null);
  readonly serviceId = signal<number | null>(null);
  readonly isEditMode = signal(false);

  // Computed signals para validaciones y UI
  readonly pageTitle = computed(() => 
    this.isEditMode() ? 'Editar Servicio' : 'Crear Servicio'
  );
  
  readonly submitButtonText = computed(() => 
    this.isEditMode() ? 'Actualizar Servicio' : 'Crear Servicio'
  );

  readonly loadingText = computed(() => 
    this.isSubmitting() ? (this.isEditMode() ? 'Actualizando...' : 'Creando...') : this.submitButtonText()
  );

  readonly businessStatus = computed(() => {
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

  // Formulario reactivo usando validadores centralizados
  readonly serviceForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    duration: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
    price: [0, [Validators.required, Validators.min(0)]],
    category: [''],
    image: [''],
    benefits: ['']
  });

  // Categorías como readonly
  readonly categories = [
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
      console.log('=== SERVICE EDITOR EFFECT TRIGGERED ===');
      const serviceIdParam = this.route.snapshot.paramMap.get('id');
      console.log('Service ID param from route:', serviceIdParam);
      
      if (serviceIdParam) {
        const id = parseInt(serviceIdParam);
        console.log('Parsed service ID:', id);
        if (!isNaN(id)) {
          this.serviceId.set(id);
          this.isEditMode.set(true);
          this.loadServiceData();
        }
      } else {
        // Solo cargar info del negocio en modo creación
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

      console.log('Calling getUserBusinesses for user ID:', user.id);
      const response = await firstValueFrom(this.businessService.getUserBusinesses());
      console.log('Retrieved businesses:', response);
      
      // Verificar si la respuesta es un objeto con estructura {success, data, message}
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        const apiResponse = response as any; // Type assertion temporal
        if (apiResponse.success && apiResponse.data) {
          const businessData = apiResponse.data;
          
          // Verificar si data contiene un negocio directamente o es un array
          if (businessData.id) {
            // Si data es un objeto negocio directamente
            console.log('Setting business ID from single business:', businessData.id);
            this.businessId.set(businessData.id);
            this.errorMessage.set('');
            console.log('Business ID set successfully:', this.businessId());
          } else if (Array.isArray(businessData) && businessData.length > 0) {
            // Si data es un array de negocios
            console.log('Setting business ID from first business:', businessData[0].id);
            this.businessId.set(businessData[0].id);
            this.errorMessage.set('');
            console.log('Business ID set successfully:', this.businessId());
          } else {
            console.error('No valid business data found');
            this.errorMessage.set('No se encontró información del negocio');
          }
        } else {
          console.error('API response unsuccessful');
          this.errorMessage.set('No se encontró información del negocio');
        }
      } else if (Array.isArray(response) && response.length > 0) {
        // Si la respuesta es directamente un array de negocios
        console.log('Setting business ID from first business in array:', response[0].id);
        this.businessId.set(response[0].id);
        this.errorMessage.set('');
        console.log('Business ID set successfully:', this.businessId());
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

    console.log('Loading service data for ID:', serviceId);

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
      console.log('Service loaded:', service);
      
      // Convertir y validar los valores antes de hacer patch
      const formData = {
        name: service.name || '',
        description: service.description || '',
        duration: Number(service.duration) || 60,
        price: Number(service.price) || 0,
        category: service.category || '',
        image: service.image || '',
        benefits: '' // Los benefits no están en el servicio, mantener vacío
      };
      
      console.log('Form data to patch:', formData);
      this.serviceForm.patchValue(formData);
      
      // Marcar todos los campos como touched para que las validaciones se activen
      this.serviceForm.markAllAsTouched();
      
      // En modo edición, usar el business_id del servicio
      if (service.business_id) {
        this.businessId.set(service.business_id);
      } else {
        // Si no hay business_id en el servicio, intentar cargar del usuario
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

  // Métodos helper para validaciones del template usando computed
  readonly getFieldErrors = computed(() => {
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

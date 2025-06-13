import { Component, inject, signal, computed, effect, linkedSignal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  saveOutline,
  createOutline,
  storefrontOutline,
  locationOutline,
  callOutline,
  documentTextOutline,
  checkmarkOutline,
  alertCircleOutline,
  analyticsOutline,
  closeOutline
} from 'ionicons/icons';
import { BusinessService } from '@services/api';
import { AuthSignalService, NotificationService } from '@services/index';
import { BusinessProfile } from '@interfaces/index';

@Component({
  selector: 'app-business-profile',
  templateUrl: './business-profile.page.html',
  styleUrls: ['./business-profile.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class BusinessProfilePage {
  // Servicios inyectados con inject() - patrón estándar
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);
  private readonly authService = inject(AuthSignalService);
  private readonly notificationService = inject(NotificationService);

  // LinkedSignal para derivar automáticamente del AuthService - Angular 19
  readonly currentUser = linkedSignal(() => this.authService.user);

  // Signals de estado - patrón estándar
  readonly isLoading = signal<boolean>(true);
  readonly isEditMode = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly businessData = signal<BusinessProfile | null>(null);

  // Formulario reactivo - patrón estándar
  readonly businessForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: [''],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: [''],
    category: ['']
  });

  // Computed signals - patrón estándar
  readonly isFormValid = computed(() => this.businessForm.valid);
  readonly canSave = computed(() => this.isFormValid() && !this.isSaving());
  readonly hasBusinessData = computed(() => !!this.businessData());
  readonly displayName = computed(() => {
    const data = this.businessData();
    return data?.name || 'Mi Negocio';
  });
  
  constructor() {
    // Registrar iconos// Effect para cargar datos cuando cambia el usuario - Angular 19
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'negocio') {
        this.loadBusinessProfile();
      }
    });
  }

  // Método para limpiar errores - patrón estándar
  readonly clearError = (): void => {
    this.errorMessage.set(null);
  };

  // Método principal para cargar perfil del negocio - async/await pattern
  readonly loadBusinessProfile = async (): Promise<void> => {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      const user = this.currentUser();
      if (!user?.id) {
        this.errorMessage.set('Usuario no encontrado');
        return;
      }

      // Usar NotificationService para loading - patrón estándar
        // Llamada real al API para obtener el negocio del usuario
        const response: any = await firstValueFrom(this.businessService.getBusinessByUserId());
        
        // Manejar tanto el formato {success: true, data: {...}} como el formato directo
        let businessInfo;
        if (response && response.success && response.data) {
          businessInfo = response.data;
        } else if (response && response.id) {
          // Formato directo (por si acaso)
          businessInfo = response;
        } else {
          businessInfo = null;
        }
        
        if (businessInfo) {
          const business: BusinessProfile = {
            id: businessInfo.id,
            name: businessInfo.name || '',
            description: businessInfo.description || '',
            phone: businessInfo.phone || '',
            address: businessInfo.address || '',
            city: '', // No está en la interfaz Business
            category: businessInfo.category || '',
            email: businessInfo.email || '',
            created_at: '', // No está en la interfaz Business
            updated_at: '' // No está en la interfaz Business
          };
          
          this.businessData.set(business);
          this.populateForm(business);
          // Asegurar que esté en modo vista cuando hay datos
          this.isEditMode.set(false);
        } else {
          // Si no tiene negocio, activar modo de creación
          this.isEditMode.set(true);
        }
      
    } catch (error: any) {
      console.error('Error loading business profile:', error);
      // Si es error 404, significa que no tiene negocio creado
      if (error.status === 404) {
        this.isEditMode.set(true);
        await this.notificationService.showInfo('Crear Negocio', 'Aún no tienes un perfil de negocio. ¡Crea uno ahora!');
      } else {
        this.errorMessage.set('Error al cargar el perfil del negocio');
        await this.notificationService.showError('Error', 'No se pudo cargar el perfil del negocio');
      }
    } finally {
      this.isLoading.set(false);
    }
  };

  // Método helper para popular el formulario - patrón estándar
  private readonly populateForm = (business: BusinessProfile): void => {
    this.businessForm.patchValue({
      name: business.name,
      description: business.description || '',
      phone: business.phone,
      address: business.address,
      city: business.city || '',
      category: business.category || ''
    });
  };

  // Métodos de navegación y control - patrón estándar
  readonly enterEditMode = (): void => {
    this.isEditMode.set(true);
  };

  readonly cancelEdit = (): void => {
    this.isEditMode.set(false);
    // Recargar los datos originales desde el signal
    const business = this.businessData();
    if (business) {
      this.populateForm(business);
    }
  };

  readonly viewStatistics = (): void => {
    this.router.navigate(['/panel-negocio/estadisticas']);
  };

  // Método principal para guardar negocio - async/await pattern
  readonly saveBusiness = async (): Promise<void> => {
    if (!this.canSave()) return;

    try {
      this.isSaving.set(true);
      const businessData = this.businessForm.value;
      const currentBusiness = this.businessData();
      
        if (currentBusiness?.id) {
          const businessDataClean = {
            name: businessData.name || '',
            description: businessData.description || '',
            phone: businessData.phone || '',
            address: businessData.address || '',
            // city: businessData.city || '',
            category: businessData.category || ''
          };
          const response: any = await firstValueFrom(this.businessService.updateBusiness(currentBusiness.id, businessDataClean));
          
          // Actualizar el signal local con los datos actualizados
          const updatedBusiness: BusinessProfile = {
            ...currentBusiness,
            name: businessData.name || currentBusiness.name,
            description: businessData.description || currentBusiness.description || '',
            phone: businessData.phone || currentBusiness.phone,
            address: businessData.address || currentBusiness.address,
            category: businessData.category || currentBusiness.category || '',
            updated_at: new Date().toISOString()
          };
          
          this.businessData.set(updatedBusiness);
          this.isEditMode.set(false);
          
          await this.notificationService.showSuccess('Éxito', 'Negocio actualizado correctamente');
        } else {
          const businessDataClean = {
            name: businessData.name || '',
            description: businessData.description || '',
            phone: businessData.phone || '',
            address: businessData.address || '',
            city: businessData.city || '',
            category: businessData.category || ''
          };
          const response: any = await firstValueFrom(this.businessService.createBusiness(businessDataClean));
          
          let businessInfo;
          if (response && response.success && response.data) {
            businessInfo = response.data;
          } else if (response && response.id) {
            businessInfo = response;
          } else {
            businessInfo = null;
          }
          
          if (businessInfo) {
            const newBusiness: BusinessProfile = {
              id: businessInfo.id,
              name: businessInfo.name || businessData.name || '',
              description: businessInfo.description || businessData.description || '',
              phone: businessInfo.phone || businessData.phone || '',
              address: businessInfo.address || businessData.address || '',
              city: businessData.city || '',
              category: businessInfo.category || businessData.category || '',
              email: businessInfo.email || '',
              created_at: '',
              updated_at: ''
            };
            
            this.businessData.set(newBusiness);
            this.isEditMode.set(false);
            
            await this.notificationService.showSuccess('Éxito', 'Negocio creado correctamente');
            this.router.navigate(['/panel-negocio']);
          }
        }
      
    } catch (error: any) {
      console.error('Error saving business:', error);
      const errorMessage = error.error?.message || 'No se pudo guardar el negocio';
      this.errorMessage.set(errorMessage);
      await this.notificationService.showError('Error', errorMessage);
    } finally {
      this.isSaving.set(false);
    }
  };
}

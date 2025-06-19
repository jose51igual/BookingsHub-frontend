import { Component, inject, signal, computed, effect, linkedSignal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
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
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private businessService = inject(BusinessService);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);

 currentUser = linkedSignal(() => this.authService.user);

 isLoading = signal<boolean>(true);
 isEditMode = signal<boolean>(false);
 isSaving = signal<boolean>(false);
 errorMessage = signal<string | null>(null);
 businessData = signal<BusinessProfile | null>(null);

 businessForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: [''],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: [''],
    category: ['']
  });

 isFormValid = computed(() => this.businessForm.valid);
 canSave = computed(() => this.isFormValid() && !this.isSaving());
 hasBusinessData = computed(() => !!this.businessData());
 displayName = computed(() => {
    const data = this.businessData();
    return data?.name || 'Mi Negocio';
  });
  
  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'negocio') {
        this.loadBusinessProfile();
      }
    });
  }

 clearError = (): void => {
    this.errorMessage.set(null);
  };

 loadBusinessProfile = async (): Promise<void> => {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      const user = this.currentUser();
      if (!user?.id) {
        this.errorMessage.set('Usuario no encontrado');
        return;
      }

        const response: any = await firstValueFrom(this.businessService.getBusinessByUserId());
        
        let businessInfo;
        if (response && response.success && response.data) {
          businessInfo = response.data;
        } else if (response && response.id) {
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
            city: '',
            category: businessInfo.category || '',
            email: businessInfo.email || '',
            created_at: '',
            updated_at: '' 
          };
          
          this.businessData.set(business);
          this.populateForm(business);
          this.isEditMode.set(false);
        } else {
          this.isEditMode.set(true);
        }
      
    } catch (error: any) {
      console.error('Error loading business profile:', error);
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

  private populateForm = (business: BusinessProfile): void => {
    this.businessForm.patchValue({
      name: business.name,
      description: business.description || '',
      phone: business.phone,
      address: business.address,
      city: business.city || '',
      category: business.category || ''
    });
  };

 enterEditMode = (): void => {
    this.isEditMode.set(true);
  };

 cancelEdit = (): void => {
    this.isEditMode.set(false);
    const business = this.businessData();
    if (business) {
      this.populateForm(business);
    }
  };

 viewStatistics = (): void => {
    this.router.navigate(['/panel-negocio/estadisticas']);
  };

 saveBusiness = async (): Promise<void> => {
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
            category: businessData.category || ''
          };
          const response: any = await firstValueFrom(this.businessService.updateBusiness(currentBusiness.id, businessDataClean));
          
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

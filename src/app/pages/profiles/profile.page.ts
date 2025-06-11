import { Component, inject, signal, computed, effect, linkedSignal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from '@services/api';
import { AuthSignalService, NotificationService } from '@services/index';
import { ErrorAlertComponent } from '@components/ui/error-alert/error-alert.component';
import { User, UpdateUserData, ApiResponse } from '@interfaces/index';
import { CustomValidators } from '@utils/form.utils';
import { handleAuthError } from '@utils/user.utils';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    ErrorAlertComponent
  ]
})
export class ProfilePage {
  // Inyección moderna de servicios usando inject()
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthSignalService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Signals de estado
  readonly isLoading = signal<boolean>(true);
  readonly showPasswordForm = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isUpdatingProfile = signal<boolean>(false);
  readonly isUpdatingPassword = signal<boolean>(false);

  // linkedSignal para derivar automáticamente el usuario actual del AuthService
  readonly currentUser = linkedSignal(() => this.authService.user);

  // Signals locales para mostrar información actualizada en la UI
  readonly displayName = signal<string>('');
  readonly displayEmail = signal<string>('');

  // Signals para la validez de los formularios
  private readonly profileFormValid = signal<boolean>(false);
  private readonly passwordFormValid = signal<boolean>(false);

  // Computed signals para la UI
  readonly canUpdateProfile = computed(() => 
    this.profileFormValid() && !this.isUpdatingProfile()
  );

  readonly canUpdatePassword = computed(() => 
    this.passwordFormValid() && !this.isUpdatingPassword()
  );

  readonly userRole = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'negocio' ? 'Propietario de Negocio' : 'Cliente';
  });

  readonly memberSince = computed(() => {
    const createdAt = this.currentUser()?.created_at;
    return createdAt ? new Date(createdAt).toLocaleDateString('es-ES') : '';
  });

  // Validador personalizado para contraseñas coincidentes usando utilidad centralizada
  
  // Formularios reactivos
  readonly profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  readonly passwordForm = this.formBuilder.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required]]
  }, {
    validators: CustomValidators.matchingPasswords('new_password', 'confirm_password')
  });

  constructor() {
    // Effect para cargar el perfil cuando el usuario cambia
    effect(() => {
      const user = this.currentUser();
      if (user) {
        // Inicializar los signals de display
        this.displayName.set(user.name || '');
        this.displayEmail.set(user.email || '');
        this.loadUserProfile();
      }
    });

    // Effect para actualizar la validez de los formularios
    effect(() => {
      this.profileFormValid.set(this.profileForm.valid);
    });
    
    effect(() => {
      this.passwordFormValid.set(this.passwordForm.valid);
    });

    // Observar cambios en los formularios para actualizar los signals
    this.profileForm.statusChanges.subscribe(() => {
      this.profileFormValid.set(this.profileForm.valid);
    });
    
    this.passwordForm.statusChanges.subscribe(() => {
      this.passwordFormValid.set(this.passwordForm.valid);
    });

    // Debug effect para monitorear cambios en el displayEmail
    effect(() => {
      console.log('DisplayEmail signal changed to:', this.displayEmail());
    });
  }

  // Método para limpiar errores cuando se cierra la alerta
  readonly clearError = () => this.errorMessage.set(null);

  async loadUserProfile(): Promise<void> {
    try {
      await this.notificationService.withLoading(async () => {
        const response = await firstValueFrom(this.userService.getUserProfile());
        const user = response.data;
        
        this.profileForm.patchValue({
          name: user.name,
          email: user.email
        });

        // Actualizar los signals de display
        this.displayName.set(user.name || '');
        this.displayEmail.set(user.email || '');
        
        this.isLoading.set(false);
      }, 'Cargando perfil...');
      
    } catch (error: any) {
      console.error('Error loading profile', error);
      this.isLoading.set(false);
      this.errorMessage.set('No se pudo cargar la información del perfil');
      
      // Verificar si el error es por token inválido
      if (error.status === 401) {
        await handleAuthError(this.authService, this.router);
      }
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    try {
      this.isUpdatingProfile.set(true);

      const formValue = this.profileForm.value;
      console.log('Form value before update:', formValue);
      
      const updateData: UpdateUserData = {
        name: formValue.name || undefined,
        email: formValue.email || undefined
      };
      
      console.log('Update data being sent:', updateData);

      await this.notificationService.withLoading(async () => {
        await firstValueFrom(this.authService.updateUserProfile(updateData));
      }, 'Actualizando perfil...');
      
      console.log('Update successful, updating display signals');
      console.log('Form values:', formValue);
      
      // Actualizar los signals de display con los nuevos valores del formulario
      console.log('Updating display name to:', formValue.name);
      this.displayName.set(formValue.name || 'Usuario');
      
      console.log('Updating display email to:', formValue.email);
      this.displayEmail.set(formValue.email || 'Email no disponible');
      
      // Verificar que los signals se actualizaron
      console.log('Display name after update:', this.displayName());
      console.log('Display email after update:', this.displayEmail());
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Recargar datos de autenticación para refrescar la UI
      await this.authService.reloadAuthData();
      
      await this.notificationService.showSuccess('Éxito', 'Perfil actualizado con éxito');
      this.errorMessage.set(null);
      
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Error al actualizar el perfil';
      this.errorMessage.set(errorMessage);
      await this.notificationService.showError('Error', errorMessage);
      
      if (error.status === 401) {
        await handleAuthError(this.authService, this.router);
      }
    } finally {
      this.isUpdatingProfile.set(false);
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;

    try {
      this.isUpdatingPassword.set(true);

      const { current_password, new_password } = this.passwordForm.value;
      const updateData: UpdateUserData = { 
        current_password: current_password || undefined, 
        new_password: new_password || undefined 
      };

      await this.notificationService.withLoading(async () => {
        await firstValueFrom(this.authService.updateUserProfile(updateData));
      }, 'Actualizando contraseña...');
      
      this.showPasswordForm.set(false);
      this.passwordForm.reset();
      
      await this.notificationService.showSuccess('Éxito', 'Contraseña actualizada con éxito');
      this.errorMessage.set(null);
      
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Error al actualizar la contraseña';
      
      if (error.status === 401 && errorMessage.includes('Contraseña actual incorrecta')) {
        await this.notificationService.showError('Error', 'La contraseña actual es incorrecta');
        this.errorMessage.set('La contraseña actual es incorrecta');
      } else {
        await this.notificationService.showError('Error', errorMessage);
        this.errorMessage.set(errorMessage);
      }
    } finally {
      this.isUpdatingPassword.set(false);
    }
  }

  readonly togglePasswordForm = (): void => {
    const current = this.showPasswordForm();
    this.showPasswordForm.set(!current);
    if (!this.showPasswordForm()) {
      this.passwordForm.reset();
    }
  };

  async logout(): Promise<void> {
    try {
      await this.notificationService.withLoading(async () => {
        await firstValueFrom(this.authService.logout());
        await this.router.navigate(['/login'], { replaceUrl: true });
      }, 'Cerrando sesión...');
      
    } catch (error: any) {
      this.errorMessage.set('No se pudo cerrar la sesión');
      console.error('Logout error', error);
    }
  }
}

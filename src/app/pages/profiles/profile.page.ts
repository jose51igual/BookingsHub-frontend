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
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

 isLoading = signal<boolean>(true);
 showPasswordForm = signal<boolean>(false);
 errorMessage = signal<string | null>(null);
 isUpdatingProfile = signal<boolean>(false);
 isUpdatingPassword = signal<boolean>(false);

 currentUser = linkedSignal(() => this.authService.user);

 displayName = signal<string>('');
 displayEmail = signal<string>('');

  private profileFormValid = signal<boolean>(false);
  private passwordFormValid = signal<boolean>(false);

 canUpdateProfile = computed(() => 
    this.profileFormValid() && !this.isUpdatingProfile()
  );

 canUpdatePassword = computed(() => 
    this.passwordFormValid() && !this.isUpdatingPassword()
  );

 userRole = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'negocio' ? 'Propietario de Negocio' : 'Cliente';
  });

 memberSince = computed(() => {
    const createdAt = this.currentUser()?.created_at;
    return createdAt ? new Date(createdAt).toLocaleDateString('es-ES') : '';
  });

 profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

 passwordForm = this.formBuilder.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required]]
  }, {
    validators: CustomValidators.matchingPasswords('new_password', 'confirm_password')
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.displayName.set(user.name || '');
        this.displayEmail.set(user.email || '');
        this.loadUserProfile();
      }
    });

    effect(() => {
      this.profileFormValid.set(this.profileForm.valid);
    });
    
    effect(() => {
      this.passwordFormValid.set(this.passwordForm.valid);
    });

    this.profileForm.statusChanges.subscribe(() => {
      this.profileFormValid.set(this.profileForm.valid);
    });
    
    this.passwordForm.statusChanges.subscribe(() => {
      this.passwordFormValid.set(this.passwordForm.valid);
    });
  }

 clearError = () => this.errorMessage.set(null);

  async loadUserProfile(): Promise<void> {
    try {
      const response = await firstValueFrom(this.userService.getUserProfile());
      const user = response.data;
      
      this.profileForm.patchValue({
        name: user.name,
        email: user.email
      });

      this.displayName.set(user.name || '');
      this.displayEmail.set(user.email || '');
      
      this.isLoading.set(false);
      
    } catch (error: any) {
      console.error('Error loading profile', error);
      this.isLoading.set(false);
      this.errorMessage.set('No se pudo cargar la información del perfil');
      
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
      
      const updateData: UpdateUserData = {
        name: formValue.name || undefined,
        email: formValue.email || undefined
      };
      
      await firstValueFrom(this.authService.updateUserProfile(updateData));
      
      this.displayName.set(formValue.name || 'Usuario');

      this.displayEmail.set(formValue.email || 'Email no disponible');
      this.cdr.detectChanges();
      
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

      await firstValueFrom(this.authService.updateUserProfile(updateData));
      
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

 togglePasswordForm = (): void => {
    const current = this.showPasswordForm();
    this.showPasswordForm.set(!current);
    if (!this.showPasswordForm()) {
      this.passwordForm.reset();
    }
  };

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authService.logout());
      await this.router.navigate(['/login'], { replaceUrl: true });
      
    } catch (error: any) {
      this.errorMessage.set('No se pudo cerrar la sesión');
      console.error('Logout error', error);
    }
  }
}

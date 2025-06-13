import { Component, inject, signal, computed} from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GoogleAuthService, AuthSignalService} from '@services/index';
import { ErrorAlertComponent } from '@components/index';
import { LoginCredentials } from '@interfaces/index';
import { FormFactory } from '@utils/form.utils';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
    ErrorAlertComponent
  ]
})
export class LoginPage {
 private authService = inject(AuthSignalService);
 private googleAuthService = inject(GoogleAuthService);
 private router = inject(Router);

 showSessionExpiredMessage = signal<boolean>(false);
 errorMessage = signal<string | null>(null);
 showPassword = signal<boolean>(false);
 isSubmitting = signal<boolean>(false);

 loginForm: FormGroup = FormFactory.createLoginForm();

 canSubmit = computed(() => 
    this.loginForm.valid && !this.isSubmitting()
  );

 submitButtonText = computed(() => 
    this.isSubmitting() ? 'Iniciando sesión...' : 'Iniciar Sesión'
  );

 passwordFieldType = computed(() => 
    this.showPassword() ? 'text' : 'password'
  );

 passwordToggleIcon = computed(() => 
    this.showPassword() ? 'eye-off-outline' : 'eye-outline'
  );

  constructor() {
    this.initializeGoogleAuth();
  }

  private initializeGoogleAuth = async (): Promise<void> => {
    try {
      await this.googleAuthService.initGoogleAuth();
    } catch (error) {
      console.error('Error al inicializar Google Auth:', error);
    }
  };

 login = async (): Promise<void> => {
    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const credentials: LoginCredentials = this.loginForm.value;

    try {
      const credentials: LoginCredentials = this.loginForm.value;
      
      await new Promise<void>((resolve, reject) => {
        this.authService.login(credentials).subscribe({
          next: () => resolve(),
          error: (error) => reject(error)
        });
      });
    } catch (error: any) {
      this.errorMessage.set(error.error?.message || 'Credenciales inválidas');
    } finally {
      this.isSubmitting.set(false);
    }
  };

  navigateToRegister = (): void => {
    this.router.navigateByUrl('/tipo-registro', { replaceUrl: true });
  };

 navigateToHome = (): void => {
    this.router.navigateByUrl('/inicio');
  };

 loginWithGoogle = async (): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        this.googleAuthService.signInWithGoogle().subscribe({
          next: () => resolve(),
          error: (error) => reject(error)
        });
      });
    } catch (error: any) {
      console.error('Error en inicio de sesión con Google:', error);
      this.errorMessage.set('No se pudo iniciar sesión con Google. Por favor, intenta nuevamente.');
    }
  };

 clearError = (): void => {
    this.errorMessage.set(null);
  };
}

import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GoogleAuthService, AuthSignalService, NotificationService } from '@services/index';
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
  // Servicios inyectados con inject()
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthSignalService);
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);

  // Signals para estado reactivo
  readonly showSessionExpiredMessage = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Formulario reactivo usando FormFactory centralizada
  readonly loginForm: FormGroup = FormFactory.createLoginForm();

  // Computed signals
  readonly canSubmit = computed(() => 
    this.loginForm.valid && !this.isSubmitting()
  );

  readonly submitButtonText = computed(() => 
    this.isSubmitting() ? 'Iniciando sesión...' : 'Iniciar Sesión'
  );

  readonly passwordFieldType = computed(() => 
    this.showPassword() ? 'text' : 'password'
  );

  readonly passwordToggleIcon = computed(() => 
    this.showPassword() ? 'eye-off-outline' : 'eye-outline'
  );

  constructor() {
    // Efecto para manejar parámetros de ruta
    effect(() => {
      this.route.queryParams.subscribe(params => {
        const sessionExpired = params['session_expired'] === 'true';
        this.showSessionExpiredMessage.set(sessionExpired);
        if (sessionExpired) {
          this.errorMessage.set('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      });
    });

    // Inicializar la autenticación de Google
    this.initializeGoogleAuth();
  }

  // Inicializar Google Auth
  private initializeGoogleAuth = async (): Promise<void> => {
    try {
      await this.googleAuthService.initGoogleAuth();
    } catch (error) {
      console.error('Error al inicializar Google Auth:', error);
    }
  };

  // Manejar el envío del formulario de login
  readonly login = async (): Promise<void> => {
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

  // Navegar al registro
  readonly navigateToRegister = (): void => {
    this.router.navigateByUrl('/tipo-registro', { replaceUrl: true }  );
  };

  // Navegar al inicio
  readonly navigateToHome = (): void => {
    this.router.navigateByUrl('/inicio');
  };

  // Login con Google usando token directo
  readonly loginWithGoogle = async (): Promise<void> => {
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

  // Limpiar errores
  readonly clearError = (): void => {
    this.errorMessage.set(null);
  };
}

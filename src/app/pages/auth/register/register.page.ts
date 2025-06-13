import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { firstValueFrom } from 'rxjs';
import { AuthSignalService, NotificationService } from '@services/index';
import { IonicModule } from '@ionic/angular';
import { AccountType, BaseFormData, ClientFormData, BusinessFormData } from '@interfaces/index';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule
  ]
})
export class RegisterPage {
  // Servicios inyectados con inject()
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthSignalService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals para estado reactivo
  readonly accountType = signal<AccountType>('client');
  readonly termsAccepted = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string>('');
  readonly formValid = signal<boolean>(false);

  // Computed signals
  readonly pageTitle = computed(() => 
    this.accountType() === 'business' ? 'Registro de Negocio' : 'Registro de Cliente'
  );

  readonly submitButtonText = computed(() => 
    this.isSubmitting() 
      ? 'Creando cuenta...' 
      : this.accountType() === 'client' 
        ? 'Crear mi cuenta de cliente' 
        : 'Crear mi cuenta de negocio'
  );

  readonly canSubmit = computed(() => 
    this.formValid() && this.termsAccepted() && !this.isSubmitting()
  );

  readonly isFormInvalid = computed(() =>
    this.registerForm.invalid || !this.termsAccepted()
  );

  registerForm!: FormGroup;

  // Categorías de negocio como readonly
  readonly businessCategories = [
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
    // Inicializar el formulario inmediatamente con todos los campos
    this.initializeForm();
    
    // Suscribirse a cambios del formulario para actualizar el signal
    this.registerForm.statusChanges.subscribe(() => {
      this.formValid.set(this.registerForm.valid);
    });
    
    // También actualizar inmediatamente
    this.formValid.set(this.registerForm.valid);
    
    // Efecto para manejar parámetros de ruta
    effect(() => {
      this.route.queryParams.subscribe(params => {
        if (params['type'] && (params['type'] === 'client' || params['type'] === 'business')) {
          this.accountType.set(params['type']);
          this.updateFormForAccountType();
        }
      });
    });
  }

  private initializeForm(): void {
    // Crear formulario con TODOS los campos desde el inicio
    this.registerForm = this.formBuilder.group({
      // Campos base
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d]{7,15}$/)]],
      role: ['cliente', [Validators.required]],
      
      // Campos específicos de cliente
      last_name: ['', [Validators.required]],
      birth_date: ['', [Validators.required]],
      
      // Campos específicos de negocio
      business_name: ['', [Validators.required]],
      business_address: ['', [Validators.required]],
      business_city: ['', [Validators.required]],
      business_category: ['', [Validators.required]],
      business_description: ['']
    });
  }

  private updateFormForAccountType(): void {
    const accountType = this.accountType();
    
    // Actualizar el valor del rol
    this.registerForm.get('role')?.setValue(accountType === 'client' ? 'cliente' : 'negocio');
    
    if (accountType === 'business') {
      // Deshabilitar campos de cliente
      this.registerForm.get('last_name')?.clearValidators();
      this.registerForm.get('birth_date')?.clearValidators();
      this.registerForm.get('last_name')?.updateValueAndValidity();
      this.registerForm.get('birth_date')?.updateValueAndValidity();
      
      // Habilitar validadores de negocio
      this.registerForm.get('business_name')?.setValidators([Validators.required]);
      this.registerForm.get('business_address')?.setValidators([Validators.required]);
      this.registerForm.get('business_city')?.setValidators([Validators.required]);
      this.registerForm.get('business_category')?.setValidators([Validators.required]);
    } else {
      // Deshabilitar campos de negocio
      this.registerForm.get('business_name')?.clearValidators();
      this.registerForm.get('business_address')?.clearValidators();
      this.registerForm.get('business_city')?.clearValidators();
      this.registerForm.get('business_category')?.clearValidators();
      this.registerForm.get('business_name')?.updateValueAndValidity();
      this.registerForm.get('business_address')?.updateValueAndValidity();
      this.registerForm.get('business_city')?.updateValueAndValidity();
      this.registerForm.get('business_category')?.updateValueAndValidity();
      
      // Habilitar validadores de cliente
      this.registerForm.get('last_name')?.setValidators([Validators.required]);
      this.registerForm.get('birth_date')?.setValidators([Validators.required]);
    }
    
    // Actualizar validaciones
    this.registerForm.get('last_name')?.updateValueAndValidity();
    this.registerForm.get('birth_date')?.updateValueAndValidity();
    this.registerForm.get('business_name')?.updateValueAndValidity();
    this.registerForm.get('business_address')?.updateValueAndValidity();
    this.registerForm.get('business_city')?.updateValueAndValidity();
    this.registerForm.get('business_category')?.updateValueAndValidity();
    
    // Actualizar el signal del estado del formulario
    this.formValid.set(this.registerForm.valid);
  }

  async register(): Promise<void> {
    if (!this.canSubmit()) {
      if (!this.termsAccepted()) {
        await this.notificationService.showWarning(
          'Términos y Condiciones', 
          'Debes aceptar los Términos y Condiciones para continuar.'
        );
      }
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const formData = this.prepareFormData();
      
      await firstValueFrom(this.authService.register(formData));
      
      await this.notificationService.showSuccess(
        'Registro exitoso',
        'Tu cuenta ha sido creada. Por favor inicia sesión.'
      );
      
      this.router.navigateByUrl('/login', { replaceUrl: true });
      
    } catch (error: any) {
      const errorMessage = error?.error?.message || 'No se pudo crear la cuenta';
      this.errorMessage.set(errorMessage);
      await this.notificationService.showError('Error de registro', errorMessage);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private prepareFormData(): ClientFormData | BusinessFormData {
    const formValue = this.registerForm.value;
    const accountType = this.accountType();
    
    // Mapear el tipo de cuenta al rol del backend
    const role = accountType === 'business' ? 'negocio' : 'cliente';
    
    const userData: BaseFormData = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,
      role: role
    };

    // Datos específicos según el tipo de cuenta
    if (accountType === 'business') {
      return {
        ...userData,
        businessData: {
          name: formValue.business_name,
          address: formValue.business_address,
          city: formValue.business_city,
          category: formValue.business_category,
          description: formValue.business_description || ''
        }
      } as BusinessFormData;
    } else {
      return userData as ClientFormData;
    }
  }

  // Métodos helper para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `Este campo es requerido`;
      if (field.errors['email']) return `Email inválido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) return `Formato inválido`;
    }
    return '';
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  toggleTerms(): void {
    this.termsAccepted.set(!this.termsAccepted());
  }

  onTermsChange(event: any): void {
    this.termsAccepted.set(event.detail.checked);
  }
}

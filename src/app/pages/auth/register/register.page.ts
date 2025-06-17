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
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

 accountType = signal<AccountType>('client');
 termsAccepted = signal(false);
 isSubmitting = signal(false);
 errorMessage = signal<string>('');
 formValid = signal<boolean>(false);

 pageTitle = computed(() => 
    this.accountType() === 'business' ? 'Registro de Negocio' : 'Registro de Cliente'
  );

 submitButtonText = computed(() => 
    this.isSubmitting() 
      ? 'Creando cuenta...' 
      : this.accountType() === 'client' 
        ? 'Crear mi cuenta de cliente' 
        : 'Crear mi cuenta de negocio'
  );

 canSubmit = computed(() => 
    this.formValid() && this.termsAccepted() && !this.isSubmitting()
  );

 isFormInvalid = computed(() =>
    this.registerForm.invalid || !this.termsAccepted()
  );

  registerForm!: FormGroup;

 businessCategories = [
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
    this.initializeForm();
    
    this.registerForm.statusChanges.subscribe(() => {
      this.formValid.set(this.registerForm.valid);
    });
    
    this.formValid.set(this.registerForm.valid);
    
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
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d]{7,15}$/)]],
      role: ['cliente', [Validators.required]],
      
      last_name: ['', [Validators.required]],
      birth_date: ['', [Validators.required]],
      
      business_name: ['', [Validators.required]],
      business_address: ['', [Validators.required]],
      business_city: ['', [Validators.required]],
      business_category: ['', [Validators.required]],
      business_description: ['']
    });
  }

  private updateFormForAccountType(): void {
    const accountType = this.accountType();
    
    this.registerForm.get('role')?.setValue(accountType === 'client' ? 'cliente' : 'negocio');
    
    if (accountType === 'business') {
      this.registerForm.get('last_name')?.clearValidators();
      this.registerForm.get('birth_date')?.clearValidators();
      this.registerForm.get('last_name')?.updateValueAndValidity();
      this.registerForm.get('birth_date')?.updateValueAndValidity();
      
      this.registerForm.get('business_name')?.setValidators([Validators.required]);
      this.registerForm.get('business_address')?.setValidators([Validators.required]);
      this.registerForm.get('business_city')?.setValidators([Validators.required]);
      this.registerForm.get('business_category')?.setValidators([Validators.required]);
    } else {
      this.registerForm.get('business_name')?.clearValidators();
      this.registerForm.get('business_address')?.clearValidators();
      this.registerForm.get('business_city')?.clearValidators();
      this.registerForm.get('business_category')?.clearValidators();
      this.registerForm.get('business_name')?.updateValueAndValidity();
      this.registerForm.get('business_address')?.updateValueAndValidity();
      this.registerForm.get('business_city')?.updateValueAndValidity();
      this.registerForm.get('business_category')?.updateValueAndValidity();
      
      this.registerForm.get('last_name')?.setValidators([Validators.required]);
      this.registerForm.get('birth_date')?.setValidators([Validators.required]);
    }
    
    this.registerForm.get('last_name')?.updateValueAndValidity();
    this.registerForm.get('birth_date')?.updateValueAndValidity();
    this.registerForm.get('business_name')?.updateValueAndValidity();
    this.registerForm.get('business_address')?.updateValueAndValidity();
    this.registerForm.get('business_city')?.updateValueAndValidity();
    this.registerForm.get('business_category')?.updateValueAndValidity();
    
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
    
    const role = accountType === 'business' ? 'negocio' : 'cliente';
    
    const userData: BaseFormData = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,
      role: role
    };

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

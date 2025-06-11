import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors, FormBuilder } from '@angular/forms';
import { signal } from '@angular/core';

/**
 * Utilidades para formularios comunes
 * Elimina duplicación en validaciones y manejo de formularios
 */

// Validadores comunes
export const CommonValidators = {
  email: [Validators.required, Validators.email],
  password: [Validators.required, Validators.minLength(6)],
  required: [Validators.required],
  phone: [Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)],
  url: [Validators.pattern(/^https?:\/\/.+/)],
  positiveNumber: [Validators.required, Validators.min(0.01)],
  duration: [Validators.required, Validators.min(1), Validators.max(480)] // máximo 8 horas
};

// Validadores personalizados
export class CustomValidators {
  /**
   * Validador para contraseñas coincidentes
   * Uso: { validators: CustomValidators.matchingPasswords('password', 'confirmPassword') }
   */
  static matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordKey);
      const confirmPassword = group.get(confirmPasswordKey);

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ mismatch: true });
        return { mismatch: true };
      }

      // Limpiar errores si las contraseñas coinciden
      if (confirmPassword.hasError('mismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        const hasOtherErrors = Object.keys(errors).length > 0;
        confirmPassword.setErrors(hasOtherErrors ? errors : null);
      }

      return null;
    };
  }
}

// Factory para crear formularios comunes
export class FormFactory {
  
  /**
   * Crear formulario de login
   */
  static createLoginForm() {
    return new FormGroup({
      email: new FormControl('', CommonValidators.email),
      password: new FormControl('', CommonValidators.password)
    });
  }

  /**
   * Crear formulario de registro
   */
  static createRegisterForm() {
    return new FormGroup({
      name: new FormControl('', CommonValidators.required),
      email: new FormControl('', CommonValidators.email),
      password: new FormControl('', CommonValidators.password),
      phone: new FormControl('', CommonValidators.phone),
      role: new FormControl('cliente', CommonValidators.required)
    });
  }

  /**
   * Crear formulario de negocio
   */
  static createBusinessForm() {
    return new FormGroup({
      name: new FormControl('', CommonValidators.required),
      description: new FormControl('', CommonValidators.required),
      phone: new FormControl('', CommonValidators.phone),
      email: new FormControl('', CommonValidators.email),
      address: new FormControl('', CommonValidators.required),
      category: new FormControl('', CommonValidators.required),
      website: new FormControl('', CommonValidators.url)
    });
  }

  /**
   * Crear formulario de servicio
   */
  static createServiceForm() {
    return new FormGroup({
      name: new FormControl('', CommonValidators.required),
      description: new FormControl('', CommonValidators.required),
      price: new FormControl(0, CommonValidators.positiveNumber),
      duration: new FormControl(60, CommonValidators.duration),
      category: new FormControl('', CommonValidators.required),
      image: new FormControl('')
    });
  }

  /**
   * Crear formulario de empleado
   */
  static createEmployeeForm() {
    return new FormGroup({
      name: new FormControl('', CommonValidators.required),
      email: new FormControl('', CommonValidators.email),
      phone: new FormControl('', CommonValidators.phone),
      position: new FormControl('', CommonValidators.required),
      salary: new FormControl(0, CommonValidators.positiveNumber)
    });
  }
}

/**
 * Crea un formulario para empleados
 */
export function createEmployeeForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    position: [''],
    specialties: [[]]
  });
}

/**
 * Base class para componentes con formularios
 * Proporciona funcionalidad común para manejo de formularios
 */
export class BaseFormComponent {
  // Signals comunes para formularios
  isSubmitting = signal(false);
  formErrors = signal<string[]>([]);

  /**
   * Obtener errores de un campo específico
   */
  getFieldErrors(form: FormGroup, fieldName: string): string[] {
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return [];

    const errors: string[] = [];
    if (field.errors['required']) errors.push(`${fieldName} es requerido`);
    if (field.errors['email']) errors.push('Email no válido');
    if (field.errors['minlength']) errors.push(`Mínimo ${field.errors['minlength'].requiredLength} caracteres`);
    if (field.errors['pattern']) errors.push(`Formato de ${fieldName} no válido`);
    if (field.errors['min']) errors.push(`Valor mínimo: ${field.errors['min'].min}`);
    if (field.errors['max']) errors.push(`Valor máximo: ${field.errors['max'].max}`);

    return errors;
  }

  /**
   * Validar si un campo tiene errores
   */
  hasFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /**
   * Marcar todos los campos como touched para mostrar errores
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Resetear estado del formulario
   */
  resetFormState(): void {
    this.isSubmitting.set(false);
    this.formErrors.set([]);
  }

  /**
   * Extraer datos limpios del formulario (sin campos vacíos)
   */
  getCleanFormData(form: FormGroup): any {
    const formValue = form.value;
    const cleanData: any = {};
    
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanData[key] = value;
      }
    });

    return cleanData;
  }
}

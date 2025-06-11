import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { EmployeeService } from '@services/api';
import { AuthSignalService, NotificationService, BaseDataLoaderService } from '@services/index';
import { Employee } from '@interfaces/index';
import { APP_ROUTES, EMPLOYEE_SPECIALTIES } from '@utils/constants';
import { createEmployeeForm } from '@utils/form.utils';
import { showConfirmAlert } from '@utils/alert.utils';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.page.html',
  styleUrls: ['./employee-management.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule
  ]
})
export class EmployeeManagementPage {
  // Signals para estado reactivo
  readonly employees = signal<Employee[]>([]);
  readonly businessId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingEmployeeId = signal<number | null>(null);

  // Computed signals
  readonly hasEmployees = computed(() => this.employees().length > 0);
  readonly canAddEmployee = computed(() => !!this.businessId() && !this.isLoading());
  readonly employeesValid = computed(() => Array.isArray(this.employees()));

  // Servicios inyectados
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthSignalService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  // Formulario reactivo
  readonly employeeForm: FormGroup = createEmployeeForm(this.formBuilder);

  // Constantes
  readonly specialtyOptions = EMPLOYEE_SPECIALTIES;

  constructor() {
    this.loadBusinessInfo();
  }

  private async loadBusinessInfo(): Promise<void> {
    const user = this.authService.user;
    if (!user || user.role !== 'negocio') {
      this.router.navigate([APP_ROUTES.HOME]);
      return;
    }

    // TODO: Obtener business ID del usuario autenticado
    // Por ahora asumimos que existe
    this.businessId.set(1);
    await this.loadEmployees();
  }

  private async loadEmployees(): Promise<void> {
    const businessId = this.businessId();
    if (!businessId) return;
    
    const employees = await this.dataLoader.fromObservable(
      this.employeeService.getBusinessEmployees(businessId),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error al cargar los empleados'
      }
    );

    if (employees) {
      // Extraer los datos correctamente según el formato de respuesta
      let employeesArray = [];
      if (Array.isArray(employees)) {
        // Si ya es un array directamente
        employeesArray = employees;
      } else if ((employees as any).success && Array.isArray((employees as any).data)) {
        // Si viene en formato {success: true, data: [...]}
        employeesArray = (employees as any).data;
      } else if ((employees as any).data && Array.isArray((employees as any).data)) {
        // Si tiene propiedad data que es array
        employeesArray = (employees as any).data;
      }

      this.employees.set(employeesArray);
    } else {
      this.employees.set([]);
    }
  }

  readonly addEmployee = async (): Promise<void> => {
    if (!this.businessId() || this.employeeForm.invalid) return;

    const employeeData = {
      ...this.employeeForm.value,
      business_id: this.businessId()
    };

    const created = await this.dataLoader.fromObservable(
      this.employeeService.createEmployee(employeeData),
      {
        successMessage: 'Empleado agregado exitosamente',
        errorMessage: 'Error al agregar empleado'
      }
    );

    if (created) {
      await this.loadEmployees();
      this.resetForm();
    }
  };

  readonly updateEmployee = async (): Promise<void> => {
    if (!this.editingEmployeeId() || this.employeeForm.invalid) return;

    const updated = await this.dataLoader.fromObservable(
      this.employeeService.updateEmployee(this.editingEmployeeId()!, this.employeeForm.value),
      {
        successMessage: 'Empleado actualizado exitosamente',
        errorMessage: 'Error al actualizar empleado'
      }
    );

    if (updated) {
      await this.loadEmployees();
      this.resetForm();
    }
  };

  readonly editEmployee = (employee: Employee): void => {
    this.isEditing.set(true);
    this.editingEmployeeId.set(employee.id || null);
    this.employeeForm.patchValue(employee);
  };

  readonly deleteEmployee = async (employeeId: number): Promise<void> => {
    const confirmed = await showConfirmAlert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este empleado?',
      'Eliminar',
      'Cancelar'
    );

    if (confirmed) {
      const deleted = await this.dataLoader.fromObservable(
        this.employeeService.deleteEmployee(employeeId),
        {
          successMessage: 'Empleado eliminado exitosamente',
          errorMessage: 'Error al eliminar empleado'
        }
      );

      if (deleted) {
        await this.loadEmployees();
      }
    }
  };

  readonly resetForm = (): void => {
    this.employeeForm.reset();
    this.employeeForm.patchValue({ specialties: [] });
    this.isEditing.set(false);
    this.editingEmployeeId.set(null);
  };

  readonly onSpecialtyChange = (event: any): void => {
    const selectedSpecialties = event.detail.value;
    this.employeeForm.patchValue({ specialties: selectedSpecialties });
  };

  readonly isSpecialtySelected = (specialty: string): boolean => {
    const currentSpecialties = this.employeeForm.get('specialties')?.value || [];
    return currentSpecialties.includes(specialty);
  };

  readonly toggleSpecialty = (specialty: string): void => {
    const currentSpecialties = this.employeeForm.get('specialties')?.value || [];
    let updatedSpecialties;

    if (currentSpecialties.includes(specialty)) {
      updatedSpecialties = currentSpecialties.filter((s: string) => s !== specialty);
    } else {
      updatedSpecialties = [...currentSpecialties, specialty];
    }

    this.employeeForm.patchValue({ specialties: updatedSpecialties });
  };

  readonly goBack = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_PROFILE]);
  };
}
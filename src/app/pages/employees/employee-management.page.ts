import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { EmployeeService, BusinessService } from '@services/api';
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
  
 employees = signal<Employee[]>([]);
 businessId = signal<number | null>(null);
 isLoading = signal<boolean>(false);
 isEditing = signal<boolean>(false);
 editingEmployeeId = signal<number | null>(null);

  
 hasEmployees = computed(() => this.employees().length > 0);
 canAddEmployee = computed(() => !!this.businessId() && !this.isLoading());
 employeesValid = computed(() => Array.isArray(this.employees()));

  private employeeService = inject(EmployeeService);
  private businessService = inject(BusinessService);
  private authService = inject(AuthSignalService);
  private dataLoader = inject(BaseDataLoaderService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

 employeeForm: FormGroup = createEmployeeForm(this.formBuilder);

 specialtyOptions = EMPLOYEE_SPECIALTIES;

  constructor() {
    this.loadBusinessInfo();
  }

  private async loadBusinessInfo(): Promise<void> {
    const user = this.authService.user;
    console.log('🔍 Usuario actual:', user);
    
    if (!user) {
      this.router.navigate([APP_ROUTES.HOME]);
      return;
    }

    if (user.role !== 'negocio') {
      this.router.navigate([APP_ROUTES.HOME]);
      return;
    }

    const business = await this.dataLoader.fromObservable(
      this.businessService.getBusinessByUserId(),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error al cargar información del negocio'
      }
    );

    if (business) {
      let businessId = null;
      
      if (business.id) {
        businessId = business.id;
      } else if ((business as any).data && (business as any).data.id) {
        businessId = (business as any).data.id;
      } else if (Array.isArray(business) && business.length > 0) {
        businessId = business[0].id;
      }

      if (businessId) {
        this.businessId.set(businessId);
        await this.loadEmployees();
        return;
      }
    }
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
      let employeesArray = [];
      if (Array.isArray(employees)) {
        employeesArray = employees;
      } else if ((employees as any).success && Array.isArray((employees as any).data)) {
        employeesArray = (employees as any).data;
      } else if ((employees as any).data && Array.isArray((employees as any).data)) {
        employeesArray = (employees as any).data;
      }

      this.employees.set(employeesArray);
    } else {
      this.employees.set([]);
    }
  }

 addEmployee = async (): Promise<void> => {
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

 updateEmployee = async (): Promise<void> => {
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

 editEmployee = (employee: Employee): void => {
    this.isEditing.set(true);
    this.editingEmployeeId.set(employee.id || null);
    this.employeeForm.patchValue(employee);
  };

 deleteEmployee = async (employeeId: number): Promise<void> => {
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

 resetForm = (): void => {
    this.employeeForm.reset();
    this.employeeForm.patchValue({ specialties: [] });
    this.isEditing.set(false);
    this.editingEmployeeId.set(null);
  };

 onSpecialtyChange = (event: any): void => {
    const selectedSpecialties = event.detail.value;
    this.employeeForm.patchValue({ specialties: selectedSpecialties });
  };

 isSpecialtySelected = (specialty: string): boolean => {
    const currentSpecialties = this.employeeForm.get('specialties')?.value || [];
    return currentSpecialties.includes(specialty);
  };

 toggleSpecialty = (specialty: string): void => {
    const currentSpecialties = this.employeeForm.get('specialties')?.value || [];
    let updatedSpecialties;

    if (currentSpecialties.includes(specialty)) {
      updatedSpecialties = currentSpecialties.filter((s: string) => s !== specialty);
    } else {
      updatedSpecialties = [...currentSpecialties, specialty];
    }

    this.employeeForm.patchValue({ specialties: updatedSpecialties });
  };

 goBack = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_PROFILE]);
  };
}
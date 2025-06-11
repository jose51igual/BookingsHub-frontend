import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends BaseApiService {

  /**
   * Obtiene los empleados de un negocio
   */
  getBusinessEmployees(businessId: number): Observable<Employee[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/employees`);
  }

  /**
   * Crea un nuevo empleado
   */
  createEmployee(employeeData: Partial<Employee>): Observable<Employee> {
    return this.postWithAuth(`${this.apiUrl}/employees`, employeeData);
  }

  /**
   * Actualiza los datos de un empleado
   */
  updateEmployee(employeeId: number, employeeData: Partial<Employee>): Observable<Employee> {
    return this.putWithAuth(`${this.apiUrl}/employees/${employeeId}`, employeeData);
  }

  /**
   * Elimina un empleado
   */
  deleteEmployee(employeeId: number): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/employees/${employeeId}`);
  }

  /**
   * Obtiene la disponibilidad de un empleado para una fecha específica
   */
  getEmployeeAvailability(employeeId: number, date: string): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/employees/${employeeId}/availability?date=${date}`);
  }

  /**
   * Obtiene los empleados asignados a un servicio específico
   */
  getServiceEmployees(serviceId: number): Observable<{success: boolean, count: number, data: Employee[], message: string}> {
    return this.getWithAuth(`${this.apiUrl}/services/${serviceId}/employees`);
  }

  /**
   * Alias para mantener compatibilidad con código existente
   */
  getEmployeesByBusiness(businessId: number): Observable<Employee[]> {
    return this.getBusinessEmployees(businessId);
  }

  /**
   * Obtiene un empleado específico por ID
   */
  getEmployeeById(employeeId: number): Observable<Employee> {
    return this.getWithAuth(`${this.apiUrl}/employees/${employeeId}`);
  }

  /**
   * Asigna un empleado a un servicio
   */
  assignEmployeeToService(employeeId: number, serviceId: number): Observable<any> {
    return this.postWithAuth(`${this.apiUrl}/employees/${employeeId}/services`, { serviceId });
  }

  /**
   * Desasigna un empleado de un servicio
   */
  unassignEmployeeFromService(employeeId: number, serviceId: number): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/employees/${employeeId}/services/${serviceId}`);
  }
}

import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Service, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class ServiceService extends BaseApiService {

  /**
   * Obtiene un servicio por ID
   */
  getServiceById(id: number): Observable<Service> {
    return this.http.get<ApiResponse<Service>>(`${this.apiUrl}/services/${id}`, this.httpOptions).pipe(
      retry(2),
      map((response: ApiResponse<Service>) => {
        // Extraer el servicio de la respuesta estándar del backend
        return response.data || response as any;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo servicio
   */
  createService(businessId: number, serviceData: Partial<Service>): Observable<Service> {
    const serviceWithBusinessId = { ...serviceData, business_id: businessId };
    return this.postWithAuth(`${this.apiUrl}/services`, serviceWithBusinessId);
  }

  /**
   * Actualiza un servicio
   */
  updateService(serviceId: number, serviceData: Partial<Service>): Observable<Service> {
    return this.putWithAuth(`${this.apiUrl}/services/${serviceId}`, serviceData);
  }

  /**
   * Elimina un servicio
   */
  deleteService(serviceId: number): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/services/${serviceId}`);
  }

  /**
   * Obtiene los servicios de un negocio
   */
  getServicesByBusiness(businessId: number): Observable<Service[]> {
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/businesses/${businessId}/services`, this.httpOptions).pipe(
      retry(2),
      map((response: ApiResponse<Service[]>) => {
        return response.data || response as any;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Verifica la disponibilidad de un servicio
   */
  checkServiceAvailability(serviceId: number, date: string, time?: string): Observable<any> {
    const params = time ? `?date=${date}&time=${time}` : `?date=${date}`;
    return this.getWithAuth(`${this.apiUrl}/availability/check/${serviceId}${params}`);
  }

  /**
   * Obtiene los empleados asignados a un servicio
   */
  getServiceEmployees(serviceId: number): Observable<any[]> {
    return this.getWithAuth(`${this.apiUrl}/services/${serviceId}/employees`);
  }

  /**
   * Obtiene la disponibilidad de un servicio para un mes específico
   */
  getServiceAvailability(serviceId: number, year: number, month: number, employeeId?: number): Observable<any[]> {
    const baseUrl = `${this.apiUrl}/availability/check/${serviceId}`;
    
    // Para obtener la disponibilidad del mes, vamos día por día
    const daysInMonth = new Date(year, month, 0).getDate();
    const availabilityPromises: Observable<any>[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayParams = new URLSearchParams({ date });
      if (employeeId) {
        dayParams.append('employeeId', employeeId.toString());
      }
      
      const dayUrl = `${baseUrl}?${dayParams.toString()}`;
      availabilityPromises.push(
        this.http.get<any>(dayUrl).pipe(
          map(response => ({ 
            date, 
            available: response.available,
            availableSlots: response.availableSlots || []
          })),
          catchError(() => of({ date, available: false, availableSlots: [] }))
        )
      );
    }
    
    return forkJoin(availabilityPromises).pipe(
      map((results: any[]) => results.filter((result: any) => result.available))
    );
  }

  /**
   * Obtiene los horarios disponibles de un servicio para una fecha específica
   */
  getServiceTimeSlots(serviceId: number, date: string, employeeId?: number): Observable<string[]> {
    const params = new URLSearchParams({ date });
    if (employeeId) {
      params.append('employeeId', employeeId.toString());
    }
    
    const url = `${this.apiUrl}/availability/check/${serviceId}?${params.toString()}`;
    return this.http.get<any>(url).pipe(
      map(response => response.availableSlots || [])
    );
  }
}

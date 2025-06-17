import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService extends BaseApiService {

  /**
   * Establece la disponibilidad de un negocio
   */
  setBusinessAvailability(businessId: number, availabilityData: any): Observable<any> {
    return this.postWithAuth(`${this.apiUrl}/availability/business/${businessId}`, availabilityData);
  }

  /**
   * Obtiene la disponibilidad de un negocio
   */
  getBusinessAvailability(businessId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/availability/business/${businessId}`);
  }

  /**
   * Verifica la disponibilidad de un servicio para una fecha y hora específica
   */
  checkServiceAvailability(serviceId: number, date: string, time?: string): Observable<any> {
    const params = time ? `?date=${date}&time=${time}` : `?date=${date}`;
    return this.http.get(`${this.apiUrl}/availability/check/${serviceId}${params}`);
  }

  /**
   * Obtiene la disponibilidad de un empleado para una fecha específica
   */
  getEmployeeAvailability(employeeId: number, date: string): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/employees/${employeeId}/availability?date=${date}`);
  }

  /**
   * Obtiene la disponibilidad de un servicio para un mes específico
   */
  getServiceAvailability(serviceId: number, year: number, month: number, employeeId?: number): Observable<any[]> {
    const params = new URLSearchParams({ 
      year: year.toString(), 
      month: month.toString() 
    });
    
    if (employeeId) {
      params.append('employeeId', employeeId.toString());
    }
    
    const url = `${this.apiUrl}/services/${serviceId}/availability?${params.toString()}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        return response.data || response || [];
      }),
      catchError((error) => {
        console.error(`Error getting service availability:`, error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene los horarios disponibles de un servicio para una fecha específica
   */
  getServiceTimeSlots(serviceId: number, date: string, employeeId?: number): Observable<string[]> {
    // Extraer año y mes de la fecha
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; 
    
    const params = new URLSearchParams({ 
      year: year.toString(), 
      month: month.toString() 
    });
    
    if (employeeId) {
      params.append('employeeId', employeeId.toString());
    }
    
    const url = `${this.apiUrl}/services/${serviceId}/availability?${params.toString()}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const availabilityData = response.data || response || [];
        // Buscar el día específico en los datos de disponibilidad
        const dayData = availabilityData.find((day: any) => day.date === date);
        return dayData ? dayData.availableSlots || [] : [];
      }),
      catchError((error) => {
        console.warn(`Error loading time slots for ${date}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Establece la disponibilidad de un empleado
   */
  setEmployeeAvailability(employeeId: number, availabilityData: any): Observable<any> {
    return this.postWithAuth(`${this.apiUrl}/employees/${employeeId}/availability`, availabilityData);
  }

  /**
   * Actualiza la disponibilidad de un empleado
   */
  updateEmployeeAvailability(employeeId: number, availabilityId: number, availabilityData: any): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/employees/${employeeId}/availability/${availabilityId}`, availabilityData);
  }

  /**
   * Elimina la disponibilidad de un empleado
   */
  deleteEmployeeAvailability(employeeId: number, availabilityId: number): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/employees/${employeeId}/availability/${availabilityId}`);
  }
}

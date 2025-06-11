import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Business, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class BusinessService extends BaseApiService {

  /**
   * Obtiene todos los negocios
   */
  getAllBusinesses(): Observable<ApiResponse<Business[]>> {
    return this.http.get<ApiResponse<Business[]>>(`${this.apiUrl}/businesses`, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene negocios destacados
   */
  getFeaturedBusinesses(limit: number = 5): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.apiUrl}/businesses/featured?limit=${limit}`, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Busca negocios por término
   */
  searchBusinesses(term: string): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.apiUrl}/businesses/search?term=${encodeURIComponent(term)}`, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene negocios por categoría
   */
  getBusinessesByCategory(category: string): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.apiUrl}/businesses/category/${encodeURIComponent(category)}`, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un negocio por ID
   */
  getBusinessById(id: number): Observable<Business> {
    return this.http.get<any>(`${this.apiUrl}/businesses/${id}`, this.httpOptions).pipe(
      retry(1),
      map((response: any) => response.data || response),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo negocio
   */
  createBusiness(businessData: Partial<Business>): Observable<Business> {
    return this.postWithAuth(`${this.apiUrl}/businesses`, businessData);
  }

  /**
   * Actualiza un negocio
   */
  updateBusiness(id: number, businessData: Partial<Business>): Observable<Business> {
    return this.putWithAuth(`${this.apiUrl}/businesses/${id}`, businessData);
  }

  /**
   * Obtiene el negocio del usuario actual
   */
  getBusinessByUserId(): Observable<Business> {
    return this.getWithAuth(`${this.apiUrl}/businesses/user`);
  }

  /**
   * Obtiene los negocios del usuario
   */
  getUserBusinesses(userId?: number): Observable<Business[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/user`);
  }

  /**
   * Obtiene los servicios de un negocio
   */
  getBusinessServices(businessId: number): Observable<any[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/services`);
  }

  /**
   * Obtiene las reservas de un negocio
   */
  getBusinessBookings(businessId: number): Observable<any[]> {
    return this.getWithAuth(`${this.apiUrl}/bookings/business/${businessId}`);
  }

  /**
   * Obtiene los empleados de un negocio
   */
  getBusinessEmployees(businessId: number): Observable<any[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/employees`);
  }

  /**
   * Obtiene las reservas recientes de un negocio
   */
  getRecentBookingsByBusiness(businessId: number): Observable<any[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/bookings/recent`);
  }

  /**
   * Obtiene las estadísticas semanales de un negocio
   */
  getWeeklyStatsByBusiness(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/stats/weekly`);
  }

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
    return this.getWithAuth(`${this.apiUrl}/availability/business/${businessId}`);
  }

  /**
   * Actualiza la configuración de un negocio
   */
  updateBusinessSettings(settings: any): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/businesses/settings`, settings);
  }

  /**
   * Elimina la cuenta de un negocio
   */
  deleteBusinessAccount(): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/businesses/account`);
  }

  /**
   * Obtiene la configuración de un negocio
   */
  getBusinessSettings(): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/businesses/settings`);
  }
}

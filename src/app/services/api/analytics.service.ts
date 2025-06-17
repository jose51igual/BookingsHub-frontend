import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService extends BaseApiService {

  /**
   * Obtiene las analíticas del negocio
   */
  getBusinessAnalytics(period: string = '3months'): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business?period=${period}`);
  }

  /**
   * Obtiene las estadísticas semanales de un negocio
   */
  getWeeklyStatsByBusiness(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/stats/weekly`);
  }

  /**
   * Obtiene las estadísticas mensuales de un negocio
   */
  getMonthlyStatsByBusiness(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/stats/monthly`);
  }

  /**
   * Obtiene las estadísticas anuales de un negocio
   */
  getYearlyStatsByBusiness(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/stats/yearly`);
  }

  /**
   * Obtiene las estadísticas de reservas por servicio
   */
  getBookingStatsByService(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/services`);
  }

  /**
   * Obtiene las estadísticas de ingresos
   */
  getRevenueStats(businessId: number, period: string = '3months'): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/revenue?period=${period}`);
  }

  /**
   * Obtiene las estadísticas de clientes
   */
  getCustomerStats(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/customers`);
  }

  /**
   * Obtiene el resumen del dashboard
   */
  getDashboardSummary(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/dashboard`);
  }

  /**
   * Obtiene las estadísticas de empleados
   */
  getEmployeeStats(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/employees`);
  }

  /**
   * Obtiene las estadísticas de horarios más populares
   */
  getPopularTimesStats(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/analytics/business/${businessId}/popular-times`);
  }

  /**
   * Obtiene las reservas recientes del negocio
   */
  getRecentBookings(businessId?: number, limit: number = 5): Observable<any> {
    if (businessId) {
      return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/bookings/recent?limit=${limit}`);
    }
    return this.getWithAuth(`${this.apiUrl}/bookings/recent?limit=${limit}`);
  }
}

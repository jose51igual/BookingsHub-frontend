import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Booking, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends BaseApiService {

  /**
   * Crea una nueva reserva
   */
  createBooking(bookingData: Partial<Booking>): Observable<Booking> {
    return this.postWithAuth(`${this.apiUrl}/bookings`, bookingData);
  }

  /**
   * Obtiene las reservas del usuario actual
   */
  getUserBookings(userId?: number): Observable<Booking[]> {
    const url = userId 
      ? `${this.apiUrl}/bookings/user/${userId}` 
      : `${this.apiUrl}/bookings/user`;
    return this.getWithAuth(url);
  }

  /**
   * Obtiene las reservas de un negocio específico
   */
  getBusinessBookings(businessId: number): Observable<Booking[]> {
    return this.getWithAuth(`${this.apiUrl}/bookings/business/${businessId}`);
  }

  /**
   * Obtiene las reservas recientes de un negocio
   */
  getRecentBookingsByBusiness(businessId: number): Observable<Booking[]> {
    return this.getWithAuth(`${this.apiUrl}/businesses/${businessId}/bookings/recent`);
  }

  /**
   * Obtiene una reserva específica por ID
   */
  getBookingById(bookingId: number): Observable<Booking> {
    return this.getWithAuth(`${this.apiUrl}/bookings/${bookingId}`);
  }

  /**
   * Cancela una reserva
   */
  cancelBooking(bookingId: number): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/bookings/${bookingId}/status`, { status: 'cancelada' });
  }

  /**
   * Confirma una reserva
   */
  confirmBooking(bookingId: number): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/bookings/${bookingId}/status`, { status: 'confirmada' });
  }

  /**
   * Marca una reserva como completada
   */
  completeBooking(bookingId: number): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/bookings/${bookingId}/status`, { status: 'completada' });
  }

  /**
   * Actualiza el estado de una reserva
   */
  updateBookingStatus(bookingId: number, status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'rechazada'): Observable<any> {
    return this.putWithAuth(`${this.apiUrl}/bookings/${bookingId}/status`, { status });
  }
}

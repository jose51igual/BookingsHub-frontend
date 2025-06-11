import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { User, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService {

  /**
   * Obtiene el perfil del usuario actual
   */
  getUserProfile(): Observable<ApiResponse<User>> {
    return this.getWithAuth(`${this.apiUrl}/users/profile`);
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  updateUserProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.putWithAuth(`${this.apiUrl}/users/profile`, userData);
  }

  /**
   * Registra un nuevo usuario
   */
  register(userData: Partial<User>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/register`, userData, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Inicia sesión de usuario
   */
  login(credentials: { email: string, password: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/login`, credentials, this.httpOptions).pipe(
      retry(1),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => {
        return of({ success: true, data: null, message: 'Logout successful', count: 0 });
      }),
      map(() => ({ success: true, data: true, message: 'Logout successful', count: 0 }))
    );
  }

  /**
   * Obtiene las reservas del usuario
   */
  getUserBookings(userId?: number): Observable<ApiResponse<any>> {
    const url = userId 
      ? `${this.apiUrl}/bookings/user/${userId}` 
      : `${this.apiUrl}/bookings/user`;
    return this.getWithAuth(url);
  }
}

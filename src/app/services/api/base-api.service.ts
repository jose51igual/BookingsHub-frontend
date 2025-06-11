import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError, retry } from 'rxjs/operators';
import { StorageService } from '@services/index';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected apiUrl = environment.apiUrl;

  protected httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(
    protected http: HttpClient,
    protected storageService: StorageService
  ) { }

  // Helper methods for authenticated requests
  protected async getAuthHeaders(): Promise<HttpHeaders> {
    try {
      const token = await this.storageService.get('auth_token');
      if (!token) {
        console.warn('⚠️ No se encontró token de autenticación');
        return new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });
      } else {
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });
      }
    } catch (error) {
      console.error('Error al obtener token:', error);
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    }
  }

  protected getWithAuth(url: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.get(url, { headers }).pipe(
          retry(1),
          catchError(error => {
            console.error('🔐 API Service - Error in getWithAuth:', {
              url,
              status: error.status,
              statusText: error.statusText,
              error: error.error
            });
            return this.handleError(error);
          })
        );
      })
    );
  }

  protected postWithAuth(url: string, data: any): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post(url, data, { headers }).pipe(
          retry(1),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  protected putWithAuth(url: string, data: any): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.put(url, data, { headers }).pipe(
          retry(1),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  protected deleteWithAuth(url: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.delete(url, { headers }).pipe(
          retry(1),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  // Método genérico para manejar errores HTTP
  protected handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.status === 0) {
      // Error de conectividad o CORS
      console.error('Error de red o CORS:', error);
      errorMessage = 'Error de conexión: verifica tu conexión a internet o si el servidor está disponible.';
      
      // Podemos intentar utilizar un proxy CORS si es un error de CORS
      if (error.message && error.message.includes('CORS')) {
        return throwError(() => ({
          error: error,
          corsError: true,
          message: 'Error de CORS detectado, intentando con proxy...'
        }));
      }
    } else if (error.status === 401) {
      // Error no autorizado
      errorMessage = 'No autorizado: debes iniciar sesión nuevamente.';
    } else if (error.status === 403) {
      // Error de acceso prohibido
      errorMessage = 'Acceso denegado: no tienes permisos para realizar esta acción.';
    } else if (error.status === 404) {
      // Recurso no encontrado
      errorMessage = 'Recurso no encontrado: la URL solicitada no existe.';
    } else if (error.status === 500) {
      // Error del servidor
      errorMessage = 'Error del servidor: por favor, intenta nuevamente más tarde.';
    } else {
      // Otros errores
      errorMessage = `Error ${error.status}: ${error.error.message || 'Ocurrió un error desconocido'}`;
    }

    console.error('Error en la API:', error);
    return throwError(() => ({ error: error, message: errorMessage }));
  }
}

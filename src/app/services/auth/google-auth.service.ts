import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthSignalService } from './auth-signal.service';
import { environment } from '@environments/environment';
import { AuthResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  constructor(
    private http: HttpClient,
    private authService: AuthSignalService
  ) { }

  /**
   * Inicia el proceso de autenticación con Google
   * Redirige directamente al endpoint del backend que maneja todo el flujo OAuth
   */
  signInWithGoogle(): void {
    const loginUrl = `${environment.apiUrl}/auth/google/login`;
    console.log('🚀 Redirigiendo a Google Auth:', loginUrl);
    
    // El backend maneja todo el flujo OAuth y redirige de vuelta al frontend
    window.location.href = loginUrl;
  }

  /**
   * Maneja el éxito de la autenticación desde los parámetros de la URL
   * Este método se llama cuando el backend redirige a /auth/success
   * @param token - Token JWT recibido del backend
   * @param userInfo - Información del usuario recibida del backend
   */
  handleAuthSuccess(token: string, userInfo: any): void {
    try {
      console.log('✅ Procesando autenticación exitosa con Google');
      
      // Crear la respuesta en el formato esperado por el AuthSignalService
      const authResponse: AuthResponse = {
        success: true,
        message: 'Autenticación exitosa',
        data: {
          token: token,
          user: userInfo
        }
      };

      // Procesar la autenticación exitosa
      this.authService.handleGoogleAuthSuccess(authResponse);
      
    } catch (error) {
      console.error('❌ Error procesando autenticación exitosa:', error);
      throw error;
    }
  }

  /**
   * Maneja los errores de autenticación
   * Este método se llama cuando el backend redirige a /auth/error
   * @param errorCode - Código de error recibido del backend
   */
  handleAuthError(errorCode: string): void {
    console.error('❌ Error en autenticación con Google:', errorCode);
    
    let errorMessage = 'Error desconocido en la autenticación';
    
    switch (errorCode) {
      case 'no_code':
        errorMessage = 'No se recibió el código de autorización de Google';
        break;
      case 'invalid_code':
        errorMessage = 'El código de autorización es inválido o ha expirado';
        break;
      case 'server_error':
        errorMessage = 'Error interno del servidor durante la autenticación';
        break;
      default:
        errorMessage = `Error de autenticación: ${errorCode}`;
    }
    
    // Aquí puedes emitir el error a través de un subject o mostrar un toast
    throw new Error(errorMessage);
  }

  /**
   * Inicializa el servicio de Google Auth (método de compatibilidad)
   * En esta versión simplificada no es necesario inicializar nada
   */
  async initGoogleAuth(): Promise<void> {
    console.log('✅ Google Auth Service inicializado (modo simplificado)');
    return Promise.resolve();
  }

  /**
   * Método de compatibilidad para popup (simplificado)
   * Usa el mismo flujo de redirección que signInWithGoogle
   */
  signInWithGooglePopup(): Observable<any> {
    // En lugar de usar popup, usamos redirección completa
    this.signInWithGoogle();
    
    // Retornamos un observable que nunca se completa para mantener compatibilidad
    return new Observable(observer => {
      console.log('🔄 Redirigiendo a Google Auth (modo simplificado)');
      // No completamos el observable ya que la redirección maneja todo el flujo
    });
  }
}

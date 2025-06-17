import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
   * Inicia el proceso de autenticación con Google redirigiendo al endpoint de login
   */
  signInWithGoogle(): void {
    // Generar un estado aleatorio para prevenir ataques CSRF
    const state = this.generateRandomState();
    localStorage.setItem('google_auth_state', state);
    
    // Redirigir al endpoint de login de Google
    const loginUrl = `${environment.apiUrl}/auth/google/login?state=${encodeURIComponent(state)}`;
    console.log('🚀 Redirigiendo a Google Auth:', loginUrl);
    
    window.location.href = loginUrl;
  }

  /**
   * Maneja el callback de Google OAuth después de la autenticación
   * @param code - Código de autorización de Google
   * @param state - Estado para verificación CSRF
   * @returns Observable con la respuesta de autenticación
   */
  handleGoogleCallback(code: string, state: string): Observable<AuthResponse> {
    // Verificar el estado para prevenir ataques CSRF
    const storedState = localStorage.getItem('google_auth_state');
    if (state !== storedState) {
      throw new Error('Estado inválido - posible ataque CSRF');
    }

    // Limpiar el estado almacenado
    localStorage.removeItem('google_auth_state');

    // Llamar al endpoint de callback
    const callbackUrl = `${environment.apiUrl}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    
    return this.http.get<AuthResponse>(callbackUrl).pipe(
      tap((response: AuthResponse) => {
        if (response && response.data?.user && response.data?.token) {
          console.log('✅ Autenticación con Google exitosa');
          this.authService.handleGoogleAuthSuccess(response);
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados');
        }
      }),
      catchError((error) => {
        console.error('❌ Error en callback de Google:', error);
        throw error;
      })
    );
  }

  /**
   * Inicia el proceso de autenticación con Google usando popup
   * Este método abre un popup que redirige al endpoint de login
   */
  signInWithGooglePopup(): Observable<AuthResponse> {
    return new Observable(observer => {
      try {
        const state = this.generateRandomState();
        localStorage.setItem('google_auth_state', state);
        
        const loginUrl = `${environment.apiUrl}/auth/google/login?state=${encodeURIComponent(state)}`;
        
        // Abrir popup
        const popup = window.open(
          loginUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          observer.error(new Error('El popup fue bloqueado. Por favor permite popups para este sitio.'));
          return;
        }

        // Escuchar mensajes del popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            popup.close();
            
            // Manejar el callback con el código recibido
            this.handleGoogleCallback(event.data.code, event.data.state).subscribe({
              next: (response) => {
                observer.next(response);
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
            
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            popup.close();
            observer.error(new Error(event.data.error || 'Error en autenticación'));
          }
        };

        window.addEventListener('message', messageListener);

        // Verificar si el popup se cerró manualmente
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            observer.error(new Error('El popup fue cerrado por el usuario'));
          }
        }, 1000);

        // Timeout después de 60 segundos
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
            window.removeEventListener('message', messageListener);
            observer.error(new Error('Tiempo de espera agotado'));
          }
        }, 60000);

      } catch (error) {
        console.error('Error en popup OAuth:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Genera un estado aleatorio para prevenir ataques CSRF
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

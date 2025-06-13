import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AuthSignalService } from './auth-signal.service';
import { environment } from '@environments/environment';
import { AuthResponse } from '@interfaces/index';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private googleAuthInitialized = false;

  constructor(
    private http: HttpClient,
    private authService: AuthSignalService
  ) { }

  /**
   * Inicializa la API de Google Sign-In
   */
  async initGoogleAuth() {
    if (this.googleAuthInitialized) {
      return;
    }
    
    // Cargamos la biblioteca de Google
    return new Promise<void>((resolve) => {
      // Cargar el script de la API de Google si aún no está cargado
      if (!document.getElementById('google-auth-script')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.id = 'google-auth-script';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          this.googleAuthInitialized = true;
          resolve();
        };
        
        document.body.appendChild(script);
      } else {
        this.googleAuthInitialized = true;
        resolve();
      }
    });
  }

  /**
   * Redirige al usuario a Google para autenticación (nuevo flujo con callback)
   */
  redirectToGoogleAuth(): void {
    // Construir la URL de redirección de Google OAuth 2.0
    const clientId = environment.googleClientId;
    const redirectUri = `${environment.apiUrl}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    const state = this.generateRandomState();
    
    // Guardar el state en localStorage para verificación posterior
    localStorage.setItem('google_auth_state', state);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `include_granted_scopes=true`;
    
    console.log('🚀 Redirigiendo a Google Auth:', googleAuthUrl);
    
    // Redireccionar al usuario a Google
    window.location.href = googleAuthUrl;
  }

  /**
   * Genera un estado aleatorio para prevenir ataques CSRF
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Método alternativo usando renderButton en lugar de prompt
   */
  signInWithGoogleButton(): Observable<any> {
    return from(this.initGoogleAuth()).pipe(
      switchMap(() => {
        return this.handleGoogleSignInWithButton();
      }),
      switchMap(credential => {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
          token: credential.credential
        });
      }),
      tap((response: AuthResponse) => {
        if (response && response.data?.user && response.data?.token) {
          this.authService.handleGoogleAuthSuccess(response);
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados');
        }
      })
    );
  }

  /**
   * Maneja el inicio de sesión con Google (flujo actual con token directo)
   */
  signInWithGoogle(): Observable<any> {
    return from(this.initGoogleAuth()).pipe(
      switchMap(() => {
        return this.handleGoogleSignIn();
      }),
      switchMap(credential => {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
          token: credential.credential
        });
      }),
      tap((response: AuthResponse) => {
        // Procesamos la respuesta del servidor directamente con handleAuthSuccess
        if (response && response.data?.user && response.data?.token) {
          // Llamamos directamente a handleGoogleAuthSuccess
          this.authService.handleGoogleAuthSuccess(response);
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados');
        }
      })
    );
  }

  /**
   * Maneja el proceso de inicio de sesión con Google usando renderButton
   */
  private handleGoogleSignInWithButton(): Observable<any> {
    return new Observable(observer => {
      try {
        if (!environment.googleClientId || environment.googleClientId === 'TU_GOOGLE_CLIENT_ID') {
          const error = new Error('Google Client ID no está configurado');
          observer.error(error);
          return;
        }
        
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (credential: any) => {
            observer.next(credential);
            observer.complete();
          },
          error_callback: (error: any) => {
            console.error('Error en Google Sign-In callback:', error);
            observer.error(error);
          }
        });
        
        // Crear un botón temporal para el sign-in
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'google-signin-button-temp';
        buttonContainer.style.display = 'none';
        document.body.appendChild(buttonContainer);
        
        google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard'
        });
        
        // Simular click en el botón
        setTimeout(() => {
          const button = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            observer.error(new Error('No se pudo renderizar el botón de Google'));
          }
        }, 500);
        
      } catch (error) {
        console.error('Error en Google Sign-In con button:', error);
        observer.error(error);
      }
    });
  }

  /**
   * Maneja el proceso de inicio de sesión con Google
   */
  private handleGoogleSignIn(): Observable<any> {
    return new Observable(observer => {
      try {
        // Verificamos que el ID de cliente esté configurado
        if (!environment.googleClientId || environment.googleClientId === 'TU_GOOGLE_CLIENT_ID') {
          const error = new Error('Google Client ID no está configurado');
          observer.error(error);
          return;
        }
        
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (credential: any) => {
            observer.next(credential);
            observer.complete();
          },
          error_callback: (error: any) => {
            console.error('Error en Google Sign-In:', error);
            observer.error(error);
          }
        });
        
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            const error = new Error('Google Sign-In prompt no fue mostrado. Verifica la configuración de orígenes autorizados.');
            observer.error(error);
          } else if (notification.isSkippedMoment()) {
            const error = new Error('Google Sign-In prompt fue omitido por el usuario');
            observer.error(error);
          }
        });
      } catch (error) {
        console.error('Error en Google Sign-In:', error);
        observer.error(error);
      }
    });
  }
}

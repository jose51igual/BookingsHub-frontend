import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { AuthSignalService } from './auth-signal.service';
import { environment } from '@environments/environment';
import { AuthResponse } from '@interfaces/index';
import { throwError } from 'rxjs';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private googleAuthInitialized = false;
  private scriptLoadPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthSignalService
  ) { }

  /**
   * Inicializa la API de Google Sign-In
   */
  async initGoogleAuth(): Promise<void> {
    if (this.googleAuthInitialized) {
      return;
    }
    
    // Evitar cargar el script múltiples veces
    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }
    
    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      // Verificar si el script ya está cargado
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        this.googleAuthInitialized = true;
        resolve();
        return;
      }
      
      // Cargar el script de la API de Google si aún no está cargado
      if (!document.getElementById('google-auth-script')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.id = 'google-auth-script';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          // Esperar un poco para que la API se inicialice completamente
          setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
              this.googleAuthInitialized = true;
              resolve();
            } else {
              reject(new Error('Google Identity Services API no se cargó correctamente'));
            }
          }, 100);
        };
        
        script.onerror = () => {
          reject(new Error('Error al cargar la biblioteca de Google Identity Services'));
        };
        
        document.body.appendChild(script);
      } else {
        // Script ya existe, verificar si Google está disponible
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          this.googleAuthInitialized = true;
          resolve();
        } else {
          reject(new Error('Google Identity Services API no está disponible'));
        }
      }
    });
    
    return this.scriptLoadPromise;
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
   * Nuevo método usando popup directo con OAuth 2.0 (más confiable)
   */
  signInWithGooglePopup(): Observable<any> {
    return from(this.initGoogleAuth()).pipe(
      switchMap(() => {
        return this.handleGoogleOAuthPopup();
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
  }  /**
   * Método OAuth 2.0 popup más directo y confiable
   */
  private handleGoogleOAuthPopup(): Observable<any> {
    return new Observable(observer => {
      try {
        const clientId = environment.googleClientId;
        const redirectUri = `${window.location.origin}/auth/callback`;
        const scope = 'openid email profile';
        const responseType = 'code';
        const state = this.generateRandomState();
        
        // Guardar el state para verificación posterior
        localStorage.setItem('google_auth_state', state);
        
        // Construir URL de autorización
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent(scope)}&` +
          `response_type=${responseType}&` +
          `state=${state}&` +
          `prompt=select_account`;

        // Abrir popup con configuración específica para evitar problemas CORS
        const popup = window.open(
          authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('El popup fue bloqueado. Por favor permite popups para este sitio.');
        }

        // Escuchar mensajes del popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            
            // Intercambiar código por token
            this.exchangeCodeForToken(event.data.code).then(response => {
              observer.next({ credential: response });
              observer.complete();
            }).catch(error => {
              observer.error(error);
            });
            
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            observer.error(new Error(event.data.error || 'Error en autenticación'));
          }
        };

        window.addEventListener('message', messageListener);

        // Verificar si el popup se cerró manualmente
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            observer.error(new Error('El popup fue cerrado'));
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

      } catch (error: any) {
        console.error('Error en popup OAuth:', error);
        observer.error(error);
      }
    });
  }
  /**
   * Intercambia el código de autorización por un token JWT
   */
  private async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await this.http.get<AuthResponse>(`${environment.apiUrl}/auth/google/callback?code=${encodeURIComponent(code)}`).toPromise();

      if (response && response.data?.user && response.data?.token) {
        this.authService.handleGoogleAuthSuccess(response);
        return response;
      } else {
        throw new Error('La respuesta del servidor no contiene los datos esperados');
      }
    } catch (error: any) {
      console.error('Error intercambiando código por token:', error);
      throw new Error('Error procesando la autenticación con Google');
    }
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
   * Maneja el proceso de inicio de sesión con Google usando popup directo (más confiable)
   */
  private handleGoogleSignInDirect(): Observable<any> {
    return new Observable(observer => {
      try {
        console.log('🔄 Iniciando Google Sign-In con popup directo...');
        console.log('🌐 Current origin:', window.location.origin);
        console.log('🔑 Client ID:', environment.googleClientId);
        
        // Verificar que Google API esté disponible
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
          throw new Error('Google Identity Services API no está disponible');
        }
        
        // Verificar configuración del Client ID
        if (!environment.googleClientId || environment.googleClientId === 'TU_GOOGLE_CLIENT_ID' || environment.googleClientId === 'falta configurar') {
          throw new Error('Google Client ID no está configurado correctamente');
        }
        
        // Inicializar Google Identity Services
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (credential: any) => {
            console.log('✅ Credencial recibida exitosamente');
            observer.next(credential);
            observer.complete();
          },
          error_callback: (error: any) => {
            console.error('❌ Error en callback de Google:', error);
            observer.error(new Error(`Error en Google callback: ${JSON.stringify(error)}`));
          }
        });
        
        console.log('🚀 Abriendo popup de Google...');
        
        // Usar renderButton para crear un botón temporal y hacer click automáticamente
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'google-signin-button-temp';
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '-9999px';
        buttonContainer.style.left = '-9999px';
        document.body.appendChild(buttonContainer);
        
        google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          width: 250
        });
        
        // Esperar un poco y hacer click automáticamente
        setTimeout(() => {
          const button = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            console.log('�️ Simulando click en botón de Google...');
            button.click();
            // Limpiar el botón temporal después de un tiempo
            setTimeout(() => {
              if (buttonContainer.parentNode) {
                buttonContainer.parentNode.removeChild(buttonContainer);
              }
            }, 1000);
          } else {
            // Si no se puede renderizar el botón, intentar con prompt como fallback
            console.warn('⚠️ No se pudo renderizar botón, intentando con prompt...');
            this.fallbackToPrompt(observer);
          }
        }, 500);
        
      } catch (error: any) {
        console.error('❌ Error general en handleGoogleSignInDirect:', error.message);
        observer.error(error);
      }
    });
  }

  /**
   * Método fallback usando prompt (para casos donde el botón no funciona)
   */
  private fallbackToPrompt(observer: any): void {
    google.accounts.id.prompt((notification: any) => {
      console.log('🔍 Google prompt notification (fallback):', notification);
      
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : 'unknown';
        console.error('❌ Prompt not displayed. Reason:', reason);
        
        if (reason === 'opt_out_or_no_session') {
          // En este caso, mostrar un mensaje más amigable
          const error = new Error('Para iniciar sesión con Google, necesitas estar logueado en tu cuenta de Google en este navegador. Por favor, inicia sesión en Google primero y vuelve a intentar.');
          observer.error(error);
        } else {
          const error = new Error(`Google Sign-In no disponible. Razón: ${reason}. Asegúrate de estar logueado en Google y tener popups habilitados.`);
          observer.error(error);
        }
      } else if (notification.isSkippedMoment()) {
        const reason = notification.getSkippedReason ? notification.getSkippedReason() : 'unknown';
        console.warn('⚠️ Prompt skipped. Reason:', reason);
        const error = new Error(`Google Sign-In fue omitido. Razón: ${reason}`);
        observer.error(error);
      }
    });
  }
}

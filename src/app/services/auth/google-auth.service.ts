import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
   * Maneja el inicio de sesión con Google
   */
  signInWithGoogle(): Observable<any> {
    return from(this.initGoogleAuth()).pipe(
      switchMap(() => {
        return this.handleGoogleSignIn();
      }),
      switchMap(credential => {
        // Enviamos el token de Google al servidor para validar
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
          token: credential.credential
        });
      }),
      switchMap((response: AuthResponse) => {
        // Procesamos la respuesta del servidor (similar a login normal)
        if (response && response.data?.user && response.data?.token) {
          return from(this.authService.loginWithSocialCredentials(response));
        } else {
          throw new Error('La respuesta del servidor no contiene los datos esperados');
        }
      })
    );
  }

  /**
   * Maneja el proceso de inicio de sesión con Google
   */
  private handleGoogleSignIn(): Observable<any> {
    return new Observable(observer => {
      try {
        // Verificamos que el ID de cliente esté configurado
        if (!environment.googleClientId || environment.googleClientId === 'TU_GOOGLE_CLIENT_ID') {
          observer.error(new Error('Google Client ID no está configurado. Por favor, configura environment.googleClientId'));
          return;
        }
        
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (credential: any) => {
            observer.next(credential);
            observer.complete();
          },
          error_callback: (error: any) => {
            observer.error(error);
          }
        });
        
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            observer.error(new Error('Google Sign-In prompt not displayed or skipped'));
          }
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }
}

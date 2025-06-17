import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthSignalService, NotificationService } from '@services/index';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.page.html',
  styleUrls: ['./callback.page.css'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CallbackPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthSignalService);
  private notificationService = inject(NotificationService);

  // Estado del componente
  isProcessing = signal<boolean>(true);
  message = signal<string>('Procesando autenticación...');
  hasError = signal<boolean>(false);

  ngOnInit() {
    this.handleAuthCallback();
  }
  private async handleAuthCallback() {
    try {      // Obtener parámetros de la URL
      const queryParams = this.route.snapshot.queryParams;

      // Verificar si hay un error en la respuesta
      if (queryParams['error']) {
        throw new Error(queryParams['error_description'] || 'Error de autenticación');
      }

      // Verificar si hay token y datos de usuario (éxito del backend)
      if (queryParams['token'] && queryParams['user']) {
        await this.handleSuccessCallback(queryParams);
        return;
      }

      // Si hay código de autorización de Google, procesarlo
      if (queryParams['code']) {
        await this.handleGoogleAuthCode(queryParams);
        return;
      }

      throw new Error('Callback inválido: faltan parámetros requeridos');    } catch (error: any) {
      console.error('Error en callback de autenticación:', error);
      this.handleCallbackError(error.message || 'Error durante la autenticación');
    }
  }
  private async handleGoogleAuthCode(params: any) {
    this.message.set('Procesando autenticación con Google...');
    
    try {      // Verificar el state para prevenir ataques CSRF
      const receivedState = params.state;
      const storedState = localStorage.getItem('google_auth_state');
      
      if (!storedState) {
        console.warn('No hay estado almacenado, continuando sin verificación');
      } else if (receivedState !== storedState) {
        throw new Error('Estado de seguridad inválido');
      }

      // Limpiar el state almacenado
      localStorage.removeItem('google_auth_state');

      // Enviar mensaje al opener (ventana principal)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: params.code,
          state: params.state
        }, window.location.origin);
        
        // Cerrar el popup después de un pequeño delay
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        // Si no hay opener, redirigir al login con error
        console.error('No se pudo comunicar con la ventana principal');
        this.handleCallbackError('No se pudo completar la autenticación');
      }

    } catch (error: any) {
      console.error('Error procesando código de Google:', error);
      
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error.message
        }, window.location.origin);
        
        setTimeout(() => {
          window.close();
        }, 100);
      } else {
        this.handleCallbackError(error.message);
      }
    }
  }

  private async handleSuccessCallback(params: any) {
    try {
      this.message.set('¡Autenticación exitosa! Redirigiendo...');
      
      // Decodificar datos del usuario si están en formato JSON
      let userData;
      try {
        userData = JSON.parse(decodeURIComponent(params.user));
      } catch {
        userData = params.user;
      }

      // Simular respuesta del formato esperado por AuthSignalService
      const authResponse = {
        status: 'success',
        data: {
          token: params.token,
          user: userData
        }
      };

      // Procesar la autenticación exitosa
      this.authService.handleGoogleAuthSuccess(authResponse);

      // Mostrar notificación de éxito
      await this.notificationService.showSuccess(
        '¡Bienvenido!', 
        `Hola ${userData.name}, has iniciado sesión exitosamente.`
      );

      // Redirigir según el rol del usuario
      setTimeout(() => {
        if (userData.role === 'negocio') {
          this.router.navigate(['/panel-negocio'], { replaceUrl: true });
        } else {
          this.router.navigate(['/inicio'], { replaceUrl: true });
        }
      }, 1500);    } catch (error: any) {
      console.error('Error procesando callback exitoso:', error);
      this.handleCallbackError('Error procesando los datos de autenticación');
    }
  }


  private handleCallbackError(errorMessage: string) {
    this.hasError.set(true);
    this.isProcessing.set(false);
    this.message.set(errorMessage);

    // Mostrar notificación de error
    this.notificationService.showError('Error de autenticación', errorMessage);

    // Redirigir al login después de 5 segundos
    setTimeout(() => {
      this.router.navigate(['/iniciar-sesion'], { replaceUrl: true });
    }, 5000);
  }

  // Método para reintentar manualmente
  async retry() {
    this.router.navigate(['/iniciar-sesion'], { replaceUrl: true });
  }
}

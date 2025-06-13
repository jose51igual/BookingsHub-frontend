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
    try {
      // Obtener parámetros de la URL
      const queryParams = this.route.snapshot.queryParams;
      
      console.log('📥 Parámetros de callback recibidos:', queryParams);

      // Verificar si hay un error en la respuesta
      if (queryParams['error']) {
        throw new Error(queryParams['error_description'] || 'Error de autenticación');
      }

      // Verificar si hay token y datos de usuario (éxito del backend)
      if (queryParams['token'] && queryParams['user']) {
        await this.handleSuccessCallback(queryParams);
        return;
      }

      // Si no hay token, significa que es el callback inicial de Google
      // y necesitamos procesar el código de autorización
      if (queryParams['code']) {
        await this.handleAuthorizationCode(queryParams);
        return;
      }

      throw new Error('Callback inválido: faltan parámetros requeridos');

    } catch (error: any) {
      console.error('❌ Error en callback de autenticación:', error);
      this.handleCallbackError(error.message || 'Error durante la autenticación');
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
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error procesando callback exitoso:', error);
      this.handleCallbackError('Error procesando los datos de autenticación');
    }
  }

  private async handleAuthorizationCode(params: any) {
    this.message.set('Verificando con Google...');
    
    // Verificar el state para prevenir ataques CSRF
    const receivedState = params.state;
    const storedState = localStorage.getItem('google_auth_state');
    
    if (receivedState !== storedState) {
      throw new Error('Estado de seguridad inválido');
    }

    // Limpiar el state almacenado
    localStorage.removeItem('google_auth_state');

    // En este caso, el código debería ser procesado por el backend
    // pero como estamos en el frontend, mostraremos un mensaje
    this.message.set('Redirigiendo al servidor para procesar...');
    
    // En una implementación real, esto sería manejado por el backend
    // El backend recibe el código, lo intercambia por tokens y redirige aquí con el token JWT
    console.log('📝 Código de autorización recibido:', params.code);
    
    // Por ahora, simularemos un error ya que no tenemos backend configurado
    setTimeout(() => {
      this.handleCallbackError('Esta funcionalidad requiere configuración del backend');
    }, 2000);
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

import { Injectable, inject, signal } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { NotificationConfig } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  // Signals para estado de notificaciones
  readonly activeNotifications = signal<NotificationConfig[]>([]);

  // Métodos para mostrar diferentes tipos de notificaciones
  async showSuccess(title: string, message: string, duration = 3000): Promise<void> {
    await this.showToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  async showError(title: string, message: string, duration = 4000): Promise<void> {
    await this.showToast({
      type: 'error',
      title,
      message,
      duration
    });
  }

  async showWarning(title: string, message: string, duration = 3500): Promise<void> {
    await this.showToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  async showInfo(title: string, message: string, duration = 3000): Promise<void> {
    await this.showToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  // Método genérico para mostrar toast
  private async showToast(config: NotificationConfig): Promise<void> {
    const color = this.getToastColor(config.type);
    const icon = this.getToastIcon(config.type);

    const toast = await this.toastController.create({
      message: `${config.title}: ${config.message}`,
      duration: config.duration || 3000,
      color,
      icon,
      position: 'top',
      buttons: config.showCloseButton ? [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ] : undefined
    });

    await toast.present();
  }

  // Método para mostrar alertas de confirmación
  async showConfirmAlert(
    title: string, 
    message: string, 
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            handler: () => resolve(true)
          }
        ]
      });

      await alert.present();
    });
  }

  // Métodos privados para obtener colores e iconos
  private getToastColor(type: NotificationConfig['type']): string {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'medium';
    }
  }

  private getToastIcon(type: NotificationConfig['type']): string {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'info':
        return 'information-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }
}

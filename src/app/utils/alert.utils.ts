import { AlertController, AlertOptions, ActionSheetController, ActionSheetOptions } from '@ionic/angular';

/**
 * Utilidades para manejo de alertas y modales comunes
 */

/**
 * Configuraciones predefinidas para alertas comunes
 */
export const AlertConfigs = {
  /**
   * Alerta de confirmación para eliminar
   */
  deleteConfirmation: (itemName: string = 'este elemento'): AlertOptions => ({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que deseas eliminar ${itemName}? Esta acción no se puede deshacer.`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive'
      }
    ]
  }),

  /**
   * Alerta de confirmación para cancelar reserva
   */
  cancelBookingConfirmation: (): AlertOptions => ({
    header: 'Confirmar cancelación',
    message: '¿Estás seguro de que deseas cancelar esta reserva?',
    buttons: [
      {
        text: 'No',
        role: 'cancel'
      },
      {
        text: 'Sí, cancelar',
        role: 'destructive'
      }
    ]
  }),

  /**
   * Alerta de éxito genérica
   */
  success: (title: string, message: string): AlertOptions => ({
    header: title,
    message: message,
    buttons: ['OK']
  }),

  /**
   * Alerta de error genérica
   */
  error: (title: string = 'Error', message: string): AlertOptions => ({
    header: title,
    message: message,
    buttons: ['OK']
  }),

  /**
   * Alerta de información
   */
  info: (title: string, message: string): AlertOptions => ({
    header: title,
    message: message,
    buttons: ['OK']
  }),

  /**
   * Alerta con input para texto
   */
  textInput: (title: string, message: string, placeholder: string = ''): AlertOptions => ({
    header: title,
    message: message,
    inputs: [
      {
        name: 'text',
        type: 'text',
        placeholder: placeholder
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Confirmar'
      }
    ]
  }),

  /**
   * Alerta de selección con radio buttons
   */
  radioSelection: (title: string, message: string, options: { value: string; label: string; checked?: boolean }[]): AlertOptions => ({
    header: title,
    message: message,
    inputs: options.map(option => ({
      name: 'option',
      type: 'radio' as const,
      label: option.label,
      value: option.value,
      checked: option.checked || false
    })),
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Confirmar'
      }
    ]
  })
};

/**
 * Configuraciones predefinidas para action sheets
 */
export const ActionSheetConfigs = {
  /**
   * Action sheet para opciones de reserva
   */
  bookingOptions: (booking: { id: number; status: string }): ActionSheetOptions => ({
    header: 'Opciones de reserva',
    buttons: [
      ...(booking.status === 'pendiente' ? [{
        text: 'Confirmar',
        icon: 'checkmark-outline',
        data: 'confirm'
      }] : []),
      ...(booking.status !== 'cancelada' ? [{
        text: 'Cancelar reserva',
        icon: 'close-outline',
        role: 'destructive' as const,
        data: 'cancel'
      }] : []),
      {
        text: 'Ver detalles',
        icon: 'eye-outline',
        data: 'details'
      },
      {
        text: 'Cerrar',
        icon: 'close',
        role: 'cancel' as const
      }
    ]
  }),

  /**
   * Action sheet para cambio de estado
   */
  statusChange: (currentStatus: string): ActionSheetOptions => ({
    header: 'Cambiar estado',
    buttons: [
      ...(currentStatus !== 'pendiente' ? [{
        text: 'Marcar como pendiente',
        icon: 'time-outline',
        data: 'pendiente'
      }] : []),
      ...(currentStatus !== 'confirmada' ? [{
        text: 'Confirmar',
        icon: 'checkmark-outline',
        data: 'confirmada'
      }] : []),
      ...(currentStatus !== 'completada' ? [{
        text: 'Marcar como completada',
        icon: 'checkmark-circle-outline',
        data: 'completada'
      }] : []),
      ...(currentStatus !== 'cancelada' ? [{
        text: 'Cancelar',
        icon: 'close-outline',
        role: 'destructive' as const,
        data: 'cancelada'
      }] : []),
      {
        text: 'Cerrar',
        icon: 'close',
        role: 'cancel' as const
      }
    ]
  }),

  /**
   * Action sheet para más opciones
   */
  moreOptions: (options: { text: string; icon: string; action: string; destructive?: boolean }[]): ActionSheetOptions => ({
    header: 'Más opciones',
    buttons: [
      ...options.map(option => ({
        text: option.text,
        icon: option.icon,
        role: option.destructive ? 'destructive' as const : undefined,
        data: option.action
      })),
      {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel' as const
      }
    ]
  })
};

/**
 * Clase helper para mostrar alertas y action sheets fácilmente
 */
export class AlertHelper {
  constructor(
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) {}

  /**
   * Muestra una alerta de confirmación simple
   */
  async showConfirmation(
    title: string, 
    message: string, 
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ): Promise<boolean> {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: [
        {
          text: cancelText,
          role: 'cancel'
        },
        {
          text: confirmText,
          role: 'confirm'
        }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    return result.role === 'confirm';
  }

  /**
   * Muestra una alerta de error
   */
  async showError(message: string, title: string = 'Error'): Promise<void> {
    const alert = await this.alertController.create(AlertConfigs.error(title, message));
    await alert.present();
  }

  /**
   * Muestra una alerta de éxito
   */
  async showSuccess(message: string, title: string = 'Éxito'): Promise<void> {
    const alert = await this.alertController.create(AlertConfigs.success(title, message));
    await alert.present();
  }

  /**
   * Muestra una alerta de información
   */
  async showInfo(message: string, title: string = 'Información'): Promise<void> {
    const alert = await this.alertController.create(AlertConfigs.info(title, message));
    await alert.present();
  }

  /**
   * Muestra un input de texto
   */
  async showTextInput(
    title: string, 
    message: string, 
    placeholder: string = ''
  ): Promise<string | null> {
    const alert = await this.alertController.create(AlertConfigs.textInput(title, message, placeholder));
    await alert.present();
    
    const result = await alert.onDidDismiss();
    return result.role === 'confirm' ? result.data?.values?.text : null;
  }

  /**
   * Muestra una selección con radio buttons
   */
  async showRadioSelection(
    title: string,
    message: string,
    options: { value: string; label: string; checked?: boolean }[]
  ): Promise<string | null> {
    const alert = await this.alertController.create(AlertConfigs.radioSelection(title, message, options));
    await alert.present();
    
    const result = await alert.onDidDismiss();
    return result.role === 'confirm' ? result.data?.values?.option : null;
  }

  /**
   * Muestra un action sheet personalizado
   */
  async showActionSheet(config: ActionSheetOptions): Promise<string | null> {
    const actionSheet = await this.actionSheetController.create(config);
    await actionSheet.present();
    
    const result = await actionSheet.onDidDismiss();
    return result.data || null;
  }

  /**
   * Muestra opciones para una reserva
   */
  async showBookingOptions(booking: { id: number; status: string }): Promise<string | null> {
    return this.showActionSheet(ActionSheetConfigs.bookingOptions(booking));
  }

  /**
   * Muestra opciones para cambiar estado
   */
  async showStatusOptions(currentStatus: string): Promise<string | null> {
    return this.showActionSheet(ActionSheetConfigs.statusChange(currentStatus));
  }
}

/**
 * Factory function para crear AlertHelper
 */
export function createAlertHelper(
  alertController: AlertController,
  actionSheetController: ActionSheetController
): AlertHelper {
  return new AlertHelper(alertController, actionSheetController);
}

/**
 * Funciones standalone para alerts comunes sin necesidad de inyectar controladores
 */

/**
 * Muestra una alerta de confirmación simple
 */
export async function showConfirmAlert(
  title: string,
  message: string,
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar'
): Promise<boolean> {
  const { AlertController } = await import('@ionic/angular');
  const alertController = new AlertController();
  
  const alert = await alertController.create({
    header: title,
    message: message,
    buttons: [
      {
        text: cancelText,
        role: 'cancel'
      },
      {
        text: confirmText,
        role: 'confirm'
      }
    ]
  });

  await alert.present();
  const result = await alert.onDidDismiss();
  return result.role === 'confirm';
}

/**
 * Muestra una alerta destructiva con confirmación por texto
 */
export async function showDestructiveAlert(
  title: string,
  message: string,
  confirmationText: string,
  placeholder: string = 'Escribe para confirmar'
): Promise<boolean> {
  const { AlertController } = await import('@ionic/angular');
  const alertController = new AlertController();
  
  const alert = await alertController.create({
    header: title,
    message: message,
    inputs: [
      {
        name: 'confirmation',
        type: 'text',
        placeholder: placeholder
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: (data) => {
          return data.confirmation === confirmationText;
        }
      }
    ]
  });

  await alert.present();
  const result = await alert.onDidDismiss();
  return result.role === 'destructive';
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { BusinessService } from '@services/api/index';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { BusinessSettings } from '@interfaces/index';
import { APP_ROUTES, DAYS_OF_WEEK } from '@utils/constants';
import { showConfirmAlert, showDestructiveAlert } from '@utils/alert.utils';

@Component({
  selector: 'app-business-settings',
  templateUrl: './business-settings.page.html',
  styleUrls: ['./business-settings.page.css'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BusinessSettingsPage {
  // Signals para estado reactivo
 settings = signal<BusinessSettings>({
    business_name: '',
    business_description: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    business_website: '',
    business_hours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '10:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '14:00', isOpen: false }
    },
    notifications: {
      emailBookings: true,
      smsReminders: false,
      emailReviews: true,
      pushNotifications: true
    },
    booking_settings: {
      advance_booking_days: 30,
      cancellation_hours: 24,
      require_deposit: false,
      deposit_percentage: 20,
      auto_confirm: false
    },
    payment_settings: {
      accept_cash: true,
      accept_card: true,
      accept_online: false
    }
  });

 isLoading = signal<boolean>(false);
 isSaving = signal<boolean>(false);

  // Constantes
 days = DAYS_OF_WEEK;

  // Servicios inyectados
  private router = inject(Router);
  private businessService = inject(BusinessService);
  private dataLoader = inject(BaseDataLoaderService);

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const defaultSettings = this.settings();
    
    const loadedSettings = await this.dataLoader.fromObservable(
      this.businessService.getBusinessSettings(),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error al cargar la configuración'
      }
    );

    if (loadedSettings) {
      this.settings.set({ ...defaultSettings, ...loadedSettings });
    }
  }

  async saveSettings(): Promise<void> {
    const saved = await this.dataLoader.fromObservable(
      this.businessService.updateBusinessSettings(this.settings()),
      {
        loadingSignal: this.isSaving,
        successMessage: 'Configuración guardada exitosamente',
        errorMessage: 'No se pudo guardar la configuración'
      }
    );

    if (saved) {
      console.log('Configuración guardada exitosamente');
    }
  }

  async resetSettings(): Promise<void> {
    const shouldReset = await showConfirmAlert(
      'Restablecer Configuración',
      '¿Estás seguro de que deseas restablecer toda la configuración a los valores predeterminados?',
      'Restablecer',
      'Cancelar'
    );

    if (shouldReset) {
      await this.loadSettings();
    }
  }

  async deleteAccount(): Promise<void> {
    const shouldDelete = await showDestructiveAlert(
      'Eliminar Cuenta',
      '⚠️ Esta acción no se puede deshacer. Se eliminarán todos tus datos, servicios y reservas.',
      'ELIMINAR',
      'Escribe "ELIMINAR" para confirmar'
    );

    if (shouldDelete) {
      await this.performAccountDeletion();
    }
  }

  private async performAccountDeletion(): Promise<void> {
    const deleted = await this.dataLoader.fromObservable(
      this.businessService.deleteBusinessAccount(),
      {
        successMessage: 'Tu cuenta ha sido eliminada exitosamente',
        errorMessage: 'No se pudo eliminar la cuenta'
      }
    );

    if (deleted) {
      console.log('Cuenta eliminada');
      this.router.navigate([APP_ROUTES.LOGIN]);
    }
  }

  // Métodos para actualizar campos individuales
  updateBusinessName(value: string): void {
    this.settings.update(current => ({ ...current, business_name: value }));
  }

  updateBusinessDescription(value: string): void {
    this.settings.update(current => ({ ...current, business_description: value }));
  }

  updateBusinessPhone(value: string): void {
    this.settings.update(current => ({ ...current, business_phone: value }));
  }

  updateBusinessEmail(value: string): void {
    this.settings.update(current => ({ ...current, business_email: value }));
  }

  updateBusinessAddress(value: string): void {
    this.settings.update(current => ({ ...current, business_address: value }));
  }

  updateBusinessWebsite(value: string): void {
    this.settings.update(current => ({ ...current, business_website: value }));
  }

  updateDayOpen(day: string, isOpen: boolean): void {
    this.settings.update(current => ({
      ...current,
      business_hours: {
        ...current.business_hours,
        [day]: {
          ...current.business_hours[day as keyof typeof current.business_hours],
          isOpen
        }
      }
    }));
  }

  updateDayTime(day: string, timeType: 'open' | 'close', event: any): void {
    const time = event.detail.value;
    if (time) {
      this.settings.update(current => ({
        ...current,
        business_hours: {
          ...current.business_hours,
          [day]: {
            ...current.business_hours[day as keyof typeof current.business_hours],
            [timeType]: time
          }
        }
      }));
    }
  }

  updateNotificationSetting(setting: string, value: boolean): void {
    this.settings.update(current => ({
      ...current,
      notifications: {
        ...current.notifications,
        [setting]: value
      }
    }));
  }

  updateBookingSetting(setting: string, value: any): void {
    this.settings.update(current => ({
      ...current,
      booking_settings: {
        ...current.booking_settings,
        [setting]: value
      }
    }));
  }

  updateBookingNumber(setting: string, event: any): void {
    const value = Number(event.detail.value);
    if (!isNaN(value)) {
      this.updateBookingSetting(setting, value);
    }
  }

  updatePaymentSetting(setting: string, value: boolean): void {
    this.settings.update(current => ({
      ...current,
      payment_settings: {
        ...current.payment_settings,
        [setting]: value
      }
    }));
  }

  // Métodos de navegación simplificados
 goToAvailability = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_AVAILABILITY]);
  };

 goToAnalytics = (): void => {
    this.router.navigate([APP_ROUTES.BUSINESS_ANALYTICS]);
  };
}

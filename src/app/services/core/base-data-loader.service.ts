import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';

/**
 * Servicio base para manejar operaciones comunes de carga de datos
 * Elimina la duplicación de lógica try/catch/loading en todos los componentes
 */
@Injectable({
  providedIn: 'root'
})
export class BaseDataLoaderService {
  private readonly notificationService = inject(NotificationService);

  /**
   * Wrapper genérico para operaciones async con manejo automático de loading y errores
   * @param operation - Función async que devuelve una Promise
   * @param loadingSignal - Signal de loading opcional para actualizar
   * @param errorMessage - Mensaje de error personalizado
   * @param showLoading - Si mostrar loading visual
   * @returns Promise con el resultado o null en caso de error
   */
  async withLoadingAndError<T>(
    operation: () => Promise<T>,
    options: {
      loadingSignal?: any;
      errorMessage?: string;
      showLoading?: boolean;
      successMessage?: string;
    } = {}
  ): Promise<T | null> {
    const { 
      loadingSignal, 
      errorMessage = 'Error al cargar datos',
      showLoading = false,
      successMessage
    } = options;

    let loading: any = null;

    try {
      // Activar loading signal si existe
      if (loadingSignal) {
        loadingSignal.set(true);
      }

      // Mostrar loading visual si se solicita
      if (showLoading) {
        loading = await this.notificationService.showLoading({ message: 'Cargando...' });
      }

      // Ejecutar operación
      const result = await operation();

      // Mostrar mensaje de éxito si se especifica
      if (successMessage) {
        await this.notificationService.showSuccess('Éxito', successMessage);
      }

      return result;
    } catch (error: any) {
      console.error('Error en operación:', error);
      await this.notificationService.showError('Error', errorMessage);
      return null;
    } finally {
      // Desactivar loading signal
      if (loadingSignal) {
        loadingSignal.set(false);
      }

      // Ocultar loading visual
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  /**
   * Wrapper específico para operaciones con Observable que necesitan convertirse a Promise
   * @param observable - Observable que devuelve firstValueFrom
   * @param options - Opciones de loading y error
   */
  async fromObservable<T>(
    observable: Observable<T>,
    options: {
      loadingSignal?: any;
      errorMessage?: string;
      showLoading?: boolean;
      successMessage?: string;
    } = {}
  ): Promise<T | null> {
    return this.withLoadingAndError(
      () => firstValueFrom(observable),
      options
    );
  }

  /**
   * Crear un signal de loading con estado inicial false
   */
  createLoadingSignal() {
    return signal(false);
  }

  /**
   * Crear un signal de datos genérico
   */
  createDataSignal<T>(initialValue: T) {
    return signal<T>(initialValue);
  }

  /**
   * Crear un computed que indica si hay alguna operación cargando
   */
  createIsLoadingComputed(...loadingSignals: any[]) {
    return computed(() => loadingSignals.some(signal => signal()));
  }
}

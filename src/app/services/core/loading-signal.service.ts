import { Injectable, Signal, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { LoadingState } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class LoadingSignalService {
  // Estado privado como signal
  private state = signal<LoadingState>({
    isLoading: false,
    message: ''
  });

  // Signals públicos
  public readonly isLoading = signal<boolean>(false);
  public readonly message = signal<string>('');
  
  // Observable para compatibilidad con código existente
  public isLoading$: Observable<boolean> = toObservable(this.isLoading);

  constructor() {
    // Efecto para registrar cambios de estado
    effect(() => {
      const current = this.state();
      if (current.isLoading) {
        console.log(`Loading started: ${current.message}`);
      } else if (current.message) {
        console.log('Loading ended');
      }
    });
  }

  /**
   * Mostrar el indicador de carga
   * @param msg Mensaje a mostrar
   */
  public show(msg: string = 'Cargando...'): void {
    console.log(`Mostrando carga: ${msg}`);
    this.state.set({
      isLoading: true,
      message: msg
    });
    
    // Actualizar también los signals públicos
    this.isLoading.set(true);
    this.message.set(msg);
    
    // Seguridad: asegurar que nunca se quede cargando indefinidamente
    setTimeout(() => {
      if (this.isLoading()) {
        console.warn(`Forzando cierre de indicador "${msg}" después de 10 segundos`);
        this.hide();
      }
    }, 10000);
  }

  /**
   * Ocultar el indicador de carga
   */
  public hide(): void {
    this.state.set({
      isLoading: false,
      message: ''
    });
    
    // Actualizar también los signals públicos
    this.isLoading.set(false);
    this.message.set('');
  }

  /**
   * Actualizar el mensaje mientras se está cargando
   * @param message Nuevo mensaje a mostrar
   */
  public updateMessage(message: string): void {
    if (this.state().isLoading) {
      this.state.update(state => ({
        ...state,
        message
      }));
      
      // Actualizar también el signal público
      this.message.set(message);
    }
  }
}

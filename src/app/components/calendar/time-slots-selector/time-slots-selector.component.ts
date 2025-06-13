import { Component, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AvailabilityService } from '@services/api';
import { NotificationService } from '@services/index';

@Component({
  selector: 'app-time-slots-selector',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './time-slots-selector.component.html',
  styleUrls: ['./time-slots-selector.component.css'],
})
export class TimeSlotsSelectorComponent {
  // Servicios inyectados
  private  availabilityService = inject(AvailabilityService);
  private  notificationService = inject(NotificationService);

  // Inputs
  serviceId = input.required<number>();
  employeeId = input<number | null>(null);
  selectedDate = input<Date | null>(null);

  // Outputs
  timeSelected = output<string>();

  // Estado interno
  availableTimeSlots = signal<string[]>([]);
  isLoading = signal<boolean>(false);
  selectedTimeSlot = signal<string | null>(null);

  constructor() {
    // Cargar horarios cuando cambia la fecha seleccionada
    effect(() => {
      const date = this.selectedDate();
      const serviceId = this.serviceId();
      
      if (date && serviceId) {
        this.loadAvailableTimeSlots(date);
      } else {
        this.availableTimeSlots.set([]);
        this.selectedTimeSlot.set(null);
      }
    });
  }

  private async loadAvailableTimeSlots(date: Date) {
    this.isLoading.set(true);
    this.selectedTimeSlot.set(null);
    
    try {
      const dateStr = this.formatDateToYYYYMMDD(date);
      
      const timeSlots = await firstValueFrom(this.availabilityService.getServiceTimeSlots(
        this.serviceId(),
        dateStr,
        this.employeeId() || undefined
      ));
      
      this.availableTimeSlots.set(timeSlots || []);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      this.notificationService.showError(
        'Error', 
        'No se pudieron cargar los horarios disponibles.'
      );
      this.availableTimeSlots.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectTime(timeSlot: string) {
    this.selectedTimeSlot.set(timeSlot);
    this.timeSelected.emit(timeSlot);
  }

  formatSelectedDate(): string {
    const date = this.selectedDate();
    return date ? date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    }) : '';
  }
}

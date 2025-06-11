import { Component, input, model, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CalendarDay } from '@interfaces/index';

// Re-exportar para uso en otros componentes
export { CalendarDay } from '@interfaces/index';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './calendar-grid.component.html',
  styleUrls: ['./calendar-grid.component.css'],
})
export class CalendarGridComponent {
  // Inputs
  isLoading = input<boolean>(false);
  hasError = input<boolean>(false);
  errorMessage = input<string>('');

  // Model inputs para two-way binding
  currentDate = model<Date>(new Date());
  selectedDate = model<Date | null>(null);

  // Outputs
  dateSelected = output<Date>();
  monthChanged = output<Date>();
  retryRequested = output<void>();

  // Estado interno
  calendarDays = signal<CalendarDay[]>([]);
  currentMonthYear = signal<string>('');

  // Valores calculados
  daysOfWeek = computed(() => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']);

  constructor() {
    // Regenerar calendario cuando cambia la fecha actual
    effect(() => {
      const current = this.currentDate();
      this.updateMonthYear();
      this.generateCalendarDays();
    });

    // Actualizar selección cuando cambia selectedDate
    effect(() => {
      const selected = this.selectedDate();
      this.updateSelectedDay();
    });
  }

  private updateMonthYear() {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const current = this.currentDate();
    this.currentMonthYear.set(`${months[current.getMonth()]} ${current.getFullYear()}`);
  }

  private generateCalendarDays() {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isAvailable: false,
        isSelected: false
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: isToday,
        date: date,
        isAvailable: false, // Se actualizará desde el componente padre
        isSelected: this.isDateSelected(date)
      });
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 filas de 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
        isAvailable: false,
        isSelected: false
      });
    }
    
    this.calendarDays.set(days);
  }

  private isDateSelected(date: Date): boolean {
    const selected = this.selectedDate();
    if (!selected) return false;
    
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  }

  private updateSelectedDay() {
    const updatedDays = this.calendarDays().map(day => ({
      ...day,
      isSelected: this.isDateSelected(day.date)
    }));
    
    this.calendarDays.set(updatedDays);
  }

  updateDayAvailability(availableDates: string[]) {
    const updatedDays = this.calendarDays().map(day => {
      if (!day.isCurrentMonth) return day;
      
      const dateStr = this.formatDateToYYYYMMDD(day.date);
      const isAvailable = availableDates.includes(dateStr);
      
      return {
        ...day,
        isAvailable
      };
    });
    
    this.calendarDays.set(updatedDays);
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth || !day.isAvailable) return;
    
    this.selectedDate.set(day.date);
    this.dateSelected.emit(day.date);
  }

  previousMonth() {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentDate.set(newDate);
    this.monthChanged.emit(newDate);
  }

  nextMonth() {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentDate.set(newDate);
    this.monthChanged.emit(newDate);
  }

  onRetry() {
    this.retryRequested.emit();
  }
}

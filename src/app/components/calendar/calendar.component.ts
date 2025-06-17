import { Component, Input, Output, EventEmitter, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CalendarGridComponent, CalendarDay } from './calendar-grid/calendar-grid.component';
import { TimeSlotsSelectorComponent } from './time-slots-selector/time-slots-selector.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    CalendarGridComponent,
    TimeSlotsSelectorComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent{
  @Input() serviceId?: number;
  @Input() selectedEmployee?: any;
  @Input() minDate?: string;
  
  @Output() dateSelected = new EventEmitter<string>();
  @Output() timeSelected = new EventEmitter<string>();
  
  currentDate = signal<Date>(new Date());
  selectedDate = signal<Date | null>(null);
  selectedTime = signal<string>('');
  
  ngOnInit() {
    if (!this.minDate) {
      this.minDate = new Date().toISOString().split('T')[0];
    }
  }

  onDateSelected(date: Date) {
    this.selectedDate.set(date);
    this.selectedTime.set('');
    
    const dateString = date.toISOString().split('T')[0];
    this.dateSelected.emit(dateString);
  }

  onTimeSelected(time: string) {
    this.selectedTime.set(time);
    this.timeSelected.emit(time);
  }

  get serviceIdValue(): number | undefined {
    return this.serviceId;
  }

  get employeeIdValue(): number | null {
    return this.selectedEmployee?.id || null;
  }
}

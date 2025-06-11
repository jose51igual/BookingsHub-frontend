/**
 * Interfaces relacionadas con el calendario
 */

export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  date: Date;
  isAvailable: boolean;
  isSelected: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeekDay {
  name: string;
  key: string;
  enabled: boolean;
  slots: TimeSlot[];
}

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

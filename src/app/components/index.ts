/**
 * Archivo índice para exportar todos los componentes compartidos
 * Organizado por categorías para mejor mantenimiento
 */

// UI Components - Componentes de interfaz de usuario
export { LoadingComponent } from './ui/loading/loading.component';
export { LoadingIndicatorComponent } from './ui/loading-indicator/loading-indicator.component';
export { ErrorAlertComponent } from './ui/error-alert/error-alert.component';
export { EmptyStateComponent } from './ui/empty-state/empty-state.component';

// Business Components - Componentes específicos del negocio
export { ServiceCardComponent } from './business/service-card/service-card.component';
export { MapComponent } from './business/map/map.component';

// Calendar Components - Componentes del calendario
export { CalendarComponent } from './calendar/calendar.component';
export { CalendarGridComponent, type CalendarDay } from './calendar/calendar-grid/calendar-grid.component';
export { TimeSlotsSelectorComponent } from './calendar/time-slots-selector/time-slots-selector.component';

// Layout Components - Componentes de layout
export { default as FooterComponent } from './layout/footer/footer.component';

// Types - Tipos y interfaces
export type { AlertConfig, EmptyStateConfig, ServiceBusiness } from '@interfaces/index';

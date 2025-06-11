import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceService, AvailabilityService } from '@services/api';
import { NotificationService, BaseDataLoaderService } from '@services/index';
import { TimeSlot, WeekDay, Service } from '@interfaces/index';
import { APP_ROUTES, DAYS_OF_WEEK } from '@utils/constants';
import { showConfirmAlert } from '@utils/alert.utils';

interface BusinessHourTemplate {
  name: string;
  key: string;
  days: { enabled: boolean; slots: TimeSlot[] }[];
}

@Component({
  selector: 'app-business-availability',
  templateUrl: './business-availability.page.html',
  styleUrls: ['./business-availability.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class BusinessAvailabilityPage {
  // Signals para estado reactivo
  readonly businessId = signal<number>(0);
  readonly services = signal<Service[]>([]);
  readonly selectedServices = signal<number[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly weekDays = signal<WeekDay[]>([
    { name: 'Lunes', key: 'monday', enabled: false, slots: [] },
    { name: 'Martes', key: 'tuesday', enabled: false, slots: [] },
    { name: 'Miércoles', key: 'wednesday', enabled: false, slots: [] },
    { name: 'Jueves', key: 'thursday', enabled: false, slots: [] },
    { name: 'Viernes', key: 'friday', enabled: false, slots: [] },
    { name: 'Sábado', key: 'saturday', enabled: false, slots: [] },
    { name: 'Domingo', key: 'sunday', enabled: false, slots: [] }
  ]);

  // Computed signals
  readonly hasServices = computed(() => this.services().length > 0);
  readonly hasSelectedServices = computed(() => this.selectedServices().length > 0);
  readonly enabledDays = computed(() => this.weekDays().filter(day => day.enabled && day.slots.length > 0));
  readonly canSave = computed(() => this.hasSelectedServices() && this.enabledDays().length > 0);

  // Templates de horarios predefinidos
  readonly hourTemplates: BusinessHourTemplate[] = [
    {
      name: 'Oficina (Lun-Vie 9:00-18:00)',
      key: 'business',
      days: this.createBusinessHours()
    },
    {
      name: 'Tienda (Lun-Sáb 10:00-20:00)',
      key: 'shop',
      days: this.createShopHours()
    },
    {
      name: 'Salón (Mar-Sáb 9:00-19:00)',
      key: 'salon',
      days: this.createSalonHours()
    },
    {
      name: 'Restaurante (12:00-15:00, 19:00-23:00)',
      key: 'restaurant',
      days: this.createRestaurantHours()
    }
  ];

  // Servicios inyectados
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceService = inject(ServiceService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly notificationService = inject(NotificationService);
  private readonly dataLoader = inject(BaseDataLoaderService);

  constructor() {
    const businessIdParam = this.route.snapshot.paramMap.get('businessId');
    this.businessId.set(businessIdParam ? +businessIdParam : 0);
    this.loadData();
  }

  private async loadData(): Promise<void> {
    const services = await this.dataLoader.fromObservable(
      this.serviceService.getServicesByBusiness(this.businessId()),
      {
        loadingSignal: this.isLoading,
        errorMessage: 'Error al cargar los servicios'
      }
    );

    if (services) {
      this.services.set(services);
      await this.loadExistingAvailability();
    }
  }

  private async loadExistingAvailability(): Promise<void> {
    const availability = await this.dataLoader.fromObservable(
      this.availabilityService.getBusinessAvailability(this.businessId()),
      {
        errorMessage: 'Error al cargar la disponibilidad'
      }
    );

    if (availability && availability.length > 0) {
      this.applyExistingAvailability(availability);
    }
  }

  private applyExistingAvailability(availability: any[]): void {
    // Agrupar disponibilidad por día
    const availabilityMap = new Map();
    availability.forEach((item: any) => {
      const key = item.day_of_week;
      if (!availabilityMap.has(key)) {
        availabilityMap.set(key, []);
      }
      availabilityMap.get(key).push(item);
    });

    // Aplicar a los días de la semana
    const updatedDays = this.weekDays().map(day => {
      const dayAvailability = availabilityMap.get(day.key) || [];
      if (dayAvailability.length > 0) {
        return {
          ...day,
          enabled: true,
          slots: dayAvailability.map((item: any) => ({
            startTime: item.start_time.substring(0, 5),
            endTime: item.end_time.substring(0, 5)
          }))
        };
      }
      return day;
    });

    this.weekDays.set(updatedDays);

    // Establecer servicios seleccionados
    const serviceIds = [...new Set(availability.map((item: any) => item.service_id))];
    this.selectedServices.set(serviceIds.filter((id): id is number => typeof id === 'number'));
  }

  readonly toggleServiceSelection = (service: Service): void => {
    const selected = this.selectedServices();
    const index = selected.indexOf(service.id);
    
    if (index > -1) {
      this.selectedServices.set(selected.filter((_, i) => i !== index));
    } else {
      this.selectedServices.set([...selected, service.id]);
    }
  };

  readonly onDayToggle = (dayIndex: number): void => {
    const days = [...this.weekDays()];
    const day = days[dayIndex];
    
    if (day.enabled && day.slots.length === 0) {
      day.slots = [{ startTime: '09:00', endTime: '18:00' }];
    } else if (!day.enabled) {
      day.slots = [];
    }
    
    this.weekDays.set(days);
  };

  readonly addTimeSlot = (dayIndex: number): void => {
    const days = [...this.weekDays()];
    days[dayIndex].slots.push({
      startTime: '09:00',
      endTime: '18:00'
    });
    this.weekDays.set(days);
  };

  readonly removeTimeSlot = (dayIndex: number, slotIndex: number): void => {
    const days = [...this.weekDays()];
    days[dayIndex].slots.splice(slotIndex, 1);
    this.weekDays.set(days);
  };

  readonly applyTemplate = (templateKey: string): void => {
    const template = this.hourTemplates.find(t => t.key === templateKey);
    if (template) {
      const newDays = this.weekDays().map((day, index) => ({
        ...day,
        enabled: template.days[index].enabled,
        slots: [...template.days[index].slots]
      }));
      this.weekDays.set(newDays);
    }
  };

  readonly resetToDefault = (): void => {
    const resetDays = this.weekDays().map(day => ({
      ...day,
      enabled: false,
      slots: []
    }));
    this.weekDays.set(resetDays);
    this.selectedServices.set([]);
  };

  readonly saveAvailability = async (): Promise<void> => {
    if (!this.canSave()) {
      if (!this.hasSelectedServices()) {
        this.notificationService.showError('Error', 'Debes seleccionar al menos un servicio');
      } else if (this.enabledDays().length === 0) {
        this.notificationService.showError('Error', 'Debes configurar al menos un día con horarios');
      }
      return;
    }

    const availabilityData = this.buildAvailabilityData();
    
    const saved = await this.dataLoader.fromObservable(
      this.availabilityService.setBusinessAvailability(this.businessId(), availabilityData),
      {
        loadingSignal: this.isSaving,
        successMessage: 'La configuración de horarios ha sido guardada exitosamente',
        errorMessage: 'Error al guardar la configuración'
      }
    );

    if (saved) {
      const shouldGoBack = await showConfirmAlert(
        'Éxito',
        'La configuración de horarios ha sido guardada exitosamente',
        'Volver a Gestión',
        'Quedarse aquí'
      );

      if (shouldGoBack) {
        this.router.navigate([APP_ROUTES.BUSINESS_DASHBOARD]);
      }
    }
  };

  private buildAvailabilityData(): any[] {
    const availabilityData: any[] = [];
    
    this.selectedServices().forEach(serviceId => {
      this.enabledDays().forEach(day => {
        day.slots.forEach(slot => {
          availabilityData.push({
            service_id: serviceId,
            day_of_week: day.key,
            start_time: slot.startTime + ':00',
            end_time: slot.endTime + ':00'
          });
        });
      });
    });

    return availabilityData;
  }

  // Métodos privados para crear templates de horarios
  private createBusinessHours(): { enabled: boolean; slots: TimeSlot[] }[] {
    const businessSlots = [{ startTime: '09:00', endTime: '18:00' }];
    return Array.from({ length: 7 }, (_, i) => ({
      enabled: i < 5, // Lun-Vie
      slots: i < 5 ? [...businessSlots] : []
    }));
  }

  private createShopHours(): { enabled: boolean; slots: TimeSlot[] }[] {
    const shopSlots = [{ startTime: '10:00', endTime: '20:00' }];
    return Array.from({ length: 7 }, (_, i) => ({
      enabled: i < 6, // Lun-Sáb
      slots: i < 6 ? [...shopSlots] : []
    }));
  }

  private createSalonHours(): { enabled: boolean; slots: TimeSlot[] }[] {
    const salonSlots = [{ startTime: '09:00', endTime: '19:00' }];
    return Array.from({ length: 7 }, (_, i) => ({
      enabled: i >= 1 && i < 6, // Mar-Sáb
      slots: (i >= 1 && i < 6) ? [...salonSlots] : []
    }));
  }

  private createRestaurantHours(): { enabled: boolean; slots: TimeSlot[] }[] {
    const restaurantSlots = [
      { startTime: '12:00', endTime: '15:00' },
      { startTime: '19:00', endTime: '23:00' }
    ];
    return Array.from({ length: 7 }, () => ({
      enabled: true,
      slots: [...restaurantSlots]
    }));
  }
}

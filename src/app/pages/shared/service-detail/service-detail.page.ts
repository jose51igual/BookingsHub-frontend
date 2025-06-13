import { Component, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA, effect, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { 
  LoadingController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';

// Services
import { ServiceService } from '@services/api/service.service';
import { BusinessService } from '@services/api/business.service';
import { BookingService } from '@services/api/booking.service';
import { EmployeeService } from '@services/api/employee.service';
import { AvailabilityService } from '@services/api/availability.service';
import { AuthSignalService } from '@services/index';

// Types
import { Service, Business } from '../../../models/business.types';
import { Employee } from '../../../models/employee.interface';

// Constants
import { APP_ROUTES } from '@utils/constants';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-service-detail',
  templateUrl: './service-detail.page.html',
  styleUrls: ['./service-detail.page.css'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
IonicModule
  ]
})
export class ServiceDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private serviceService = inject(ServiceService);
  private businessService = inject(BusinessService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthSignalService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private employeeService = inject(EmployeeService);
  private availabilityService = inject(AvailabilityService);

  // Signals
  isInitialized = signal<boolean>(false);
  service = signal<Service | null>(null);
  business = signal<Business | null>(null);
  employees = signal<Employee[]>([]);
  selectedEmployee = signal<Employee | null>(null);
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  selectedDateTime = signal<string | null>(null);
  notes = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  availableDates = signal<string[]>([]);
  availableTimes = signal<string[]>([]);
  
  // Nueva lógica para calendario y horarios
  isLoadingAvailability = signal<boolean>(false);
  availabilityData = signal<any[]>([]);
  currentMonth = signal<number>(new Date().getMonth() + 1);
  currentYear = signal<number>(new Date().getFullYear());
  
  // Time slots from 9:00 to 21:00 with 30-minute intervals
  public timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];
  
  // Getter para usar en el template (alias para timeSlots)
  public get hours(): string[] {
    return this.timeSlots;
  }
  
  // Available time slots for selected date
  availableTimeSlots = signal<string[]>([]);

  // Computed values
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  currentUser = computed(() => this.authService.user);
  
  isOwner = computed(() => {
    const user = this.currentUser();
    const business = this.business();
    return user && business && user.id === business.user_id;
  });

  canBook = computed(() => {
    const hasDate = this.selectedDate();
    const hasTime = this.selectedTime();
    const hasService = this.service();
    const isAuthenticatedUser = this.isAuthenticated();
    const isClient = this.currentUser()?.role === 'cliente';
    const notOwner = !this.isOwner();
    
    // Verificar si hay empleados y si es requerido seleccionar uno
    const employees = this.employees() || []; // Asegurar que siempre sea un array
    const employeesLength = employees.length;
    const selectedEmployee = this.selectedEmployee();
    
    // Si hay empleados, debe haber uno seleccionado; si no hay empleados, no es necesario
    const hasEmployeeIfRequired = employeesLength === 0 || !!selectedEmployee;
    
    const canBookResult = hasDate && hasTime && hasService && isAuthenticatedUser && isClient && notOwner && hasEmployeeIfRequired;
    
    return canBookResult;
  });

  hasEmployees = computed(() => this.employees().length > 0);
  
  // Computed para contar días disponibles
  availableDaysCount = computed(() => {
    const availability = this.availabilityData();
    return availability.filter(day => day.available && day.availableSlots && day.availableSlots.length > 0).length;
  });
  
  // Computed for calendar date filtering
  isDateAvailable = computed(() => {
    return (dateStr: string) => {
      const availability = this.availabilityData();
      return availability.some(day => day.date === dateStr && day.available);
    };
  });
  
  // Combined datetime computed value
  combinedDateTime = computed(() => {
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (date && time) {
      return `${date}T${time}:00`;
    }
    return null;
  });

  // Date constraints
  public minDateTime = new Date().toISOString();
  public maxDateTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 días

  constructor() {
    // Cargar datos después del render inicial (reemplaza ngOnInit)
    afterNextRender(() => {
      this.loadServiceData();
      this.isInitialized.set(true);
    });

    // Efecto para monitorear cambios en datos de disponibilidad
    effect(() => {
      const availability = this.availabilityData();
      if (availability.length > 0) {
        console.log('Availability data changed, calendar should update');
      }
    });
  }

  public async loadServiceData() {
    const serviceId = this.route.snapshot.paramMap.get('id');
    
    if (!serviceId) {
      this.error.set('ID de servicio no válido');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Cargar servicio usando el observable
      this.serviceService.getServiceById(parseInt(serviceId, 10)).subscribe({
        next: (serviceData) => {
          this.service.set(serviceData);
          
          // Cargar negocio si existe business_id
          if (serviceData.business_id) {
            this.loadBusinessData(serviceData.business_id);
          }
          
          // Cargar empleados del servicio
          this.loadServiceEmployees(parseInt(serviceId, 10));
          
          // Cargar disponibilidad inicial para el mes actual
          this.loadAvailabilityData(parseInt(serviceId, 10));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading service:', error);
          this.error.set('Error al cargar el servicio');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error loading service:', error);
      this.error.set('Error de conexión. Inténtalo de nuevo.');
      this.isLoading.set(false);
    }
  }

  private loadBusinessData(businessId: number) {
    this.businessService.getBusinessById(businessId).subscribe({
      next: (businessData) => {
        this.business.set(businessData);
      },
      error: (error) => {
        console.error('Error loading business:', error);
      }
    });
  }

  private loadServiceEmployees(serviceId: number) {
    this.employeeService.getServiceEmployees(serviceId).subscribe({
      next: (response) => {
        // Extraer los datos del array de empleados de la respuesta
        const employees = response?.data || [];
        this.employees.set(employees);
        
        // Si solo hay un empleado, seleccionarlo automáticamente
        if (employees.length === 1) {
          this.selectedEmployee.set(employees[0]);
        }
      },
      error: (error) => {
        console.error('Error loading service employees:', error);
        // Si no hay empleados específicos, continuar sin error
        this.employees.set([]);
      }
    });
  }

  private loadAvailabilityData(serviceId: number, employeeId?: number) {
    this.isLoadingAvailability.set(true);
    
    const year = this.currentYear();
    const month = this.currentMonth();
    
    this.availabilityService.getServiceAvailability(serviceId, year, month, employeeId).subscribe({
      next: (availabilityData) => {
        console.log('Raw availability data loaded:', availabilityData);
        console.log('Number of days with data:', availabilityData.length);
        
        // Log some sample days to see the format
        if (availabilityData.length > 0) {
          console.log('Sample day data:', availabilityData[0]);
          console.log('First 5 days:', availabilityData.slice(0, 5));
        }
        
        this.availabilityData.set(availabilityData);
        this.isLoadingAvailability.set(false);
        
        // Forzar actualización del calendario después de cargar datos
        console.log('Availability data set, should trigger calendar update');
      },
      error: (error) => {
        console.error('Error loading availability data:', error);
        // En caso de error, crear disponibilidad por defecto para los próximos 30 días
        const defaultAvailability = this.generateDefaultAvailability();
        console.log('Using default availability:', defaultAvailability.length, 'days');
        this.availabilityData.set(defaultAvailability);
        this.isLoadingAvailability.set(false);
      }
    });
  }

  public onNotesChange(event: any) {
    const value = event.target.value;
    this.notes.set(value);
  }

  public formatSelectedDateTime(): string {
    const date = this.selectedDate();
    const time = this.selectedTime();
    
    if (!date || !time) return '';
    
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(duration?: number | string | null): string {
    if (duration === undefined || duration === null || duration === '') return 'No especificada';
    
    // Convertir a número si es string
    const numDuration = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    
    // Verificar que sea un número válido
    if (isNaN(numDuration) || numDuration <= 0) return 'No especificada';
    
    const hours = Math.floor(numDuration / 60);
    const minutes = numDuration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }

  formatPrice(price?: number | string | null): string {
    if (price === undefined || price === null || price === '') return 'Consultar precio';
    
    // Convertir a número si es string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Verificar que sea un número válido
    if (isNaN(numPrice) || numPrice < 0) return 'Consultar precio';
    
    return `€${numPrice.toFixed(2)}`;
  }

  async confirmBooking() {
    const service = this.service();
    const date = this.selectedDate();
    const time = this.selectedTime();
    const user = this.currentUser();

    if (!service || !date || !time || !user) {
      await this.showToast('Error: Datos de reserva incompletos', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Reserva',
      message: `¿Estás seguro de que quieres reservar "${service.name}" para el ${this.formatSelectedDateTime()}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => this.processBooking()
        }
      ]
    });

    await alert.present();
  }

  private async processBooking() {
    const loading = await this.loadingController.create({
      message: 'Creando reserva...'
    });
    await loading.present();

    try {
      const service = this.service();
      const business = this.business();
      const date = this.selectedDate();
      const time = this.selectedTime();

      if (!service || !business || !date || !time) {
        throw new Error('Datos de reserva incompletos');
      }

      // Enviar los datos en el formato que espera el backend
      const bookingData = {
        service_id: service.id,
        business_id: business.id,
        booking_date: date,
        booking_time: time,
        // Incluir empleado si fue seleccionado
        ...(this.selectedEmployee() && { employee_id: this.selectedEmployee()!.id }),
        // Incluir notas si hay
        ...(this.notes() && { notes: this.notes() })
      };

      console.log('Sending booking data:', bookingData);

      this.bookingService.createBooking(bookingData).subscribe({
        next: (response) => {
          // Actualizar la disponibilidad eliminando la hora reservada
          this.updateAvailability(date, time);
          
          this.showToast('¡Reserva confirmada exitosamente!', 'success');
          this.router.navigate([APP_ROUTES.BOOKINGS]);
          loading.dismiss();
        },
        error: (error) => {
          console.error('Error creating booking:', error);
          const message = error?.message || 'Error al crear la reserva';
          this.showToast(message, 'danger');
          loading.dismiss();
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      const message = error instanceof Error ? error.message : 'Error al crear la reserva';
      await this.showToast(message, 'danger');
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  navigateToBusinessDetail() {
    const business = this.business();
    if (business) {
      this.router.navigate([APP_ROUTES.BUSINESS_DETAIL(business.id)]);
    }
  }

  navigateToLogin() {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }

  goBack() {
    this.location.back();
  }

  public onEmployeeChange(event: any) {
    const employeeId = event.detail.value;
    const employee = this.employees().find(emp => emp.id === employeeId);
    this.selectedEmployee.set(employee || null);
    
    // Recargar disponibilidad para el empleado seleccionado
    const service = this.service();
    if (service && employeeId) {
      this.loadAvailabilityData(service.id!, employeeId);
    }
    
    // Limpiar selecciones anteriores
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.availableTimeSlots.set([]);
  }

  public onDateChange(event: any) {
    const selectedValue = event.detail?.value;
    if (selectedValue) {
      // Extraer solo la fecha (YYYY-MM-DD) del valor completo
      const dateOnly = selectedValue.split('T')[0];
      console.log('Date selected:', dateOnly);
      this.selectedDate.set(dateOnly);
      this.selectedTime.set('');
      this.loadTimeSlots(dateOnly);
    } else {
      // Si se cancela la selección
      this.selectedDate.set('');
      this.selectedTime.set('');
      this.availableTimeSlots.set([]);
    }
  }

  private loadTimeSlots(date: string) {
    const service = this.service();
    const selectedEmployee = this.selectedEmployee();
    
    if (!service) return;
    
    // Primero verificar si tenemos los datos de disponibilidad cargados
    const availability = this.availabilityData();
    const dayAvailability = availability.find(day => day.date === date);
    
    if (dayAvailability && dayAvailability.availableSlots) {
      // Usar los datos ya cargados
      this.availableTimeSlots.set(dayAvailability.availableSlots);
    } else {
      // Cargar desde el servidor
      this.availabilityService.getServiceTimeSlots(
        service.id!, 
        date, 
        selectedEmployee?.id
      ).subscribe({
        next: (availableSlots) => {
          console.log('Time slots loaded for', date, ':', availableSlots);
          this.availableTimeSlots.set(availableSlots);
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          // En caso de error, usar horarios por defecto
          this.availableTimeSlots.set(this.timeSlots);
        }
      });
    }
  }

  public onTimeSelect(time: string) {
    this.selectedTime.set(time);
  }

  public async deleteService() {
    const service = this.service();
    if (!service) return;

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este servicio?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.serviceService.deleteService(service.id).subscribe({
              next: () => {
                this.showToast('Servicio eliminado exitosamente', 'success');
                this.router.navigate(['/business/services']);
              },
              error: (error) => {
                console.error('Error deleting service:', error);
                this.showToast('Error al eliminar el servicio', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  public async handleRefresh(event: any) {
    try {
      await this.loadInitialData();
    } finally {
      event.target.complete();
    }
  }

  public async loadInitialData() {
    this.isLoading.set(true);
    const serviceId = parseInt(this.route.snapshot.params['id']);
    
    if (serviceId) {
      try {
        await this.loadServiceData();
        this.loadAvailabilityData(serviceId);
      } catch (error) {
        console.error('Error loading initial data:', error);
        this.showToast('Error al cargar los datos', 'danger');
      }
    }
    
    this.isLoading.set(false);
  }

  public navigateToBusiness(businessId?: number) {
    if (businessId) {
      this.router.navigate(['/businesses', businessId]);
    }
  }

  // Métodos para el template del calendario y horarios
  public isDateEnabled = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    // No permitir fechas pasadas
    if (checkDate < today) {
      return false;
    }
    
    const availability = this.availabilityData();
    if (availability.length === 0) {
      // Si no hay datos de disponibilidad, permitir cualquier fecha futura (excepto domingos)
      return checkDate.getDay() !== 0; // No domingos
    }
    
    // Verificar disponibilidad real
    return availability.some(day => day.date === dateStr && day.available && day.availableSlots?.length > 0);
  };

  public isSlotAvailable(hour: string): boolean {
    const selectedDate = this.selectedDate();
    if (!selectedDate) return false;
    
    // Primero verificar en availableTimeSlots (calculado para la fecha seleccionada)
    const availableSlots = this.availableTimeSlots();
    if (availableSlots.length > 0) {
      return availableSlots.includes(hour);
    }
    
    // Si no hay availableTimeSlots, verificar en availabilityData
    const availability = this.availabilityData();
    const dayData = availability.find(day => day.date === selectedDate);
    if (dayData && dayData.availableSlots) {
      return dayData.availableSlots.includes(hour);
    }
    
    // Por defecto, no disponible
    return false;
  }

  public isAvailable(hour: string): boolean {
    return this.isSlotAvailable(hour);
  }

  public isHourAvailable(hour: string): boolean {
    return this.isSlotAvailable(hour);
  }
  
  // Método para verificar si un slot de tiempo está disponible (alias)
  public isTimeSlotAvailable(timeSlot: string): boolean {
    return this.isSlotAvailable(timeSlot);
  }

  // Método para generar disponibilidad por defecto
  private generateDefaultAvailability() {
    const availability = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Saltar domingos (día 0)
      if (date.getDay() === 0) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      availability.push({
        date: dateStr,
        available: true,
        availableSlots: this.timeSlots.slice() // Copia de todos los horarios
      });
    }
    
    return availability;
  }

  // Método para actualizar disponibilidad después de una reserva
  private updateAvailability(date: string, time: string) {
    const availability = this.availabilityData();
    const updatedAvailability = availability.map(day => {
      if (day.date === date) {
        return {
          ...day,
          availableSlots: day.availableSlots.filter((slot: string) => slot !== time)
        };
      }
      return day;
    });
    
    this.availabilityData.set(updatedAvailability);
    
    // También actualizar los slots disponibles si es la fecha seleccionada
    if (this.selectedDate() === date) {
      const updatedSlots = this.availableTimeSlots().filter(slot => slot !== time);
      this.availableTimeSlots.set(updatedSlots);
    }
  }
}

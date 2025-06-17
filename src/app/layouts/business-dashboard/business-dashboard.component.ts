import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthSignalService } from '@services/index';
import { 
  IonIcon,
  ActionSheetController
} from '@ionic/angular/standalone';
import { FooterComponent } from '@app/components';
import { MenuItem } from '@interfaces/index';

@Component({
  selector: 'app-business-dashboard',
  templateUrl: './business-dashboard.component.html',
  styleUrls: ['./business-dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    FooterComponent
  ]
})
export class BusinessDashboardComponent {
  
  user = computed(() => this.authService.user);
  
  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/business-dashboard/main',
      icon: 'home-outline'
    },
    {
      title: 'Reservas',
      url: '/business-dashboard/bookings',
      icon: 'calendar-outline',
      badge: 3
    },
    {
      title: 'Servicios',
      url: '/business-dashboard/services',
      icon: 'list-outline'
    },
    {
      title: 'Disponibilidad',
      url: '/business-dashboard/availability',
      icon: 'time-outline'
    },
    {
      title: 'Empleados',
      url: '/business-dashboard/employees',
      icon: 'people-outline'
    },
    {
      title: 'Analíticas',
      url: '/business-dashboard/analytics',
      icon: 'analytics-outline'
    },
    {
      title: 'Configuración',
      url: '/business-dashboard/settings',
      icon: 'settings-outline'
    }
  ];

  constructor(
    private authService: AuthSignalService,
    private actionSheetController: ActionSheetController
  ) {}

  logout() {
    this.authService.logout().subscribe({
      next: () => {
      },
      error: (error) => {
        console.error('❌ Error al cerrar sesión:', error);
      }
    });
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user || !user.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0].charAt(0).toUpperCase() + names[1].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }

  getBookingsBadge(): number | undefined {
    const bookingsItem = this.menuItems.find(item => item.title === 'Reservas');
    return bookingsItem?.badge;
  }

  async showMoreOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Más opciones',
      buttons: [
        {
          text: 'Disponibilidad',
          icon: 'time-outline',
          handler: () => {
            window.location.href = '/business-dashboard/availability';
          }
        },
        {
          text: 'Analíticas',
          icon: 'analytics-outline',
          handler: () => {
            window.location.href = '/business-dashboard/analytics';
          }
        },
        {
          text: 'Configuración',
          icon: 'settings-outline',
          handler: () => {
            window.location.href = '/business-dashboard/settings';
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
}

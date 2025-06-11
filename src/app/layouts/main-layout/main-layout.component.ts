import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthSignalService } from '@services/index';
import FooterComponent from '@components/layout/footer/footer.component';

import { 
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-main-layout',
  templateUrl: 'main-layout.component.html',
  styleUrls: ['main-layout.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    IonIcon,
    FooterComponent
  ]
})
export class MainLayoutComponent {  
  // Computed properties para navegación condicional
  isAuthenticated = computed(() => this.authService.isAuthenticated);
  isBusiness = computed(() => {
    const user = this.authService.user;
    return user?.role === 'negocio';
  });
  
  constructor(private authService: AuthSignalService) {}

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Logout exitoso
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthSignalService, StorageService } from './services/index';

import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    IonApp,
    IonRouterOutlet
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  currentRoute = signal<string>('');
  
  private router = inject(Router);
  private authService = inject(AuthSignalService);
  private storageService = inject(StorageService);
  
  constructor() {
    this.initializeApp();
    
    effect(() => {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.currentRoute.set(event.url);

        document.body.classList.remove('login-page', 'register-page');

        if (event.url.includes('/login')) {
          document.body.classList.add('login-page');
        } else if (event.url.includes('/register')) {
          document.body.classList.add('register-page');
        }
      });
    });
  }
  
  async initializeApp() {
    try {
      await this.storageService.init();
      await this.authService.loadTokenAndUser();
    } catch (error) {
      console.error('Error al inicializar la aplicación: ', error);
    }
  }
}

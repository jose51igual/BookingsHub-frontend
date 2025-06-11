import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AnimationController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register-type',
  templateUrl: './register-type.page.html',
  styleUrls: ['./register-type.page.css'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule
  ]
})
export class RegisterTypePage {
  private readonly router = inject(Router);
  private readonly animationCtrl = inject(AnimationController);

  // Signals
  readonly selectedType = signal<string | null>(null);

  // Methods
  navigateToRegister = (type: 'client' | 'business'): void => {
    this.selectedType.set(type);
    
    // Efecto de selección visual con animación
    const element = document.querySelector(`.account-type.${type}`);
    if (element) {
      this.animationCtrl.create()
        .addElement(element)
        .duration(300)
        .iterations(1)
        .keyframes([
          { offset: 0, transform: 'scale(1)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
          { offset: 0.5, transform: 'scale(1.05)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)' },
          { offset: 1, transform: 'scale(1)', boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)' }
        ])
        .play();
    }
    
    // Retraso breve para mostrar la animación antes de navegar
    setTimeout(() => {
      this.router.navigate(['/registro'], { 
        queryParams: { type }
      });
    }, 400);
  };
}

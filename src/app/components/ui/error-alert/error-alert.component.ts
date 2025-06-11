import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="error-alert" *ngIf="isVisible()" [ngClass]="{ 'error-alert--floating': floating }">
      <div class="error-alert__content">
        <ion-icon name="alert-circle-outline" class="error-alert__icon"></ion-icon>
        <div class="error-alert__message">{{ message() }}</div>
        <ion-button 
          fill="clear" 
          class="error-alert__close" 
          (click)="dismiss()"
          aria-label="Cerrar alerta">
          <ion-icon name="close-outline"></ion-icon>
        </ion-button>
      </div>
    </div>
  `,
  styleUrls: ['./error-alert.component.css']
})
export class ErrorAlertComponent {
  @Input() set error(value: string | null) {
    if (value) {
      this.message.set(value);
      this.isVisible.set(true);
      
      if (this.autoClose) {
        setTimeout(() => {
          this.dismiss();
        }, this.autoCloseDelay);
      }
    } else {
      this.isVisible.set(false);
    }
  }
  
  @Input() autoClose: boolean = true;
  @Input() autoCloseDelay: number = 5000;
  @Input() floating: boolean = false;
  
  @Output() dismissed = new EventEmitter<void>();
  
  message = signal<string>('');
  isVisible = signal<boolean>(false);
  
  dismiss(): void {
    this.isVisible.set(false);
    this.dismissed.emit();
  }
}

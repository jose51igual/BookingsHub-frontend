import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EmptyStateConfig } from '@interfaces/index';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state-container">
      <div class="empty-state-content">
        <div class="empty-state-icon">
          <ion-icon [name]="config().icon"></ion-icon>
        </div>
        
        <h2 class="empty-state-title">{{ config().title }}</h2>
        <p class="empty-state-description">{{ config().description }}</p>
        
        @if (config().showAction !== false && config().actionText) {
          <ion-button 
            expand="block" 
            fill="outline" 
            class="empty-state-action"
            (click)="onActionClick()">
            {{ config().actionText }}
          </ion-button>
        }
      </div>
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      padding: 40px 20px;
      text-align: center;
    }

    .empty-state-content {
      max-width: 300px;
    }

    .empty-state-icon {
      margin-bottom: 16px;
    }

    .empty-state-icon ion-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      opacity: 0.6;
    }

    .empty-state-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .empty-state-description {
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.4;
      color: var(--ion-color-medium);
    }

    .empty-state-action {
      --border-radius: 8px;
      margin-top: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EmptyStateComponent {
  // Inputs
  readonly config = input.required<EmptyStateConfig>();

  // Outputs
  readonly actionClick = output<void>();

  // Methods
  onActionClick = (): void => {
    this.actionClick.emit();
  };
}

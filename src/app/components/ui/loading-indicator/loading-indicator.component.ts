import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-loading-indicator',
  template: `
    @if (show()) {
      <div class="loading-container" [ngClass]="{'fullscreen': fullscreen()}">
        <div class="loading-content">
          <ion-spinner [name]="spinnerType()" [color]="color()"></ion-spinner>
          @if (message()) {
            <p class="loading-message">{{ message() }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      min-height: 100px;
    }

    .loading-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      z-index: 9999;
      min-height: 100vh;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .loading-message {
      margin: 0;
      font-size: 14px;
      color: var(--ion-color-medium);
      text-align: center;
    }

    ion-spinner {
      width: 32px;
      height: 32px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class LoadingIndicatorComponent {
  // Inputs
 show = input(false);
 message = input<string>('');
 spinnerType = input<string>('crescent');
 color = input<string>('primary');
 fullscreen = input(false);
}

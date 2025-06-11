import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoadingSignalService } from '@services/index';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <div class="loading-container" *ngIf="loadingService.isLoading()">
      <div class="loading-backdrop"></div>
      <div class="loading-content">
        <ion-spinner name="circles"></ion-spinner>
        <p>{{ loadingService.message() }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
  public loadingService = inject(LoadingSignalService);
}

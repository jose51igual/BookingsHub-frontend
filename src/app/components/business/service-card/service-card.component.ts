import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { ServiceBusiness } from '@interfaces/index';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon
  ],
  template: `
    <ion-card 
      class="service-card"
      [class.featured]="business().isFeatured"
      [style.--animation-order]="animationOrder()"
      (click)="onCardClick()">
      
      <div class="service-image-container">
        <img 
          [src]="business().image" 
          [alt]="business().name"
          (error)="onImageError($event)"
          (load)="onImageLoad($event)">
        
        <div class="fallback-icon" style="display: none;">
          <ion-icon name="storefront-outline"></ion-icon>
        </div>
        
        @if (business().isFeatured) {
          <div class="featured-badge">
            <ion-icon name="star"></ion-icon>
            Destacado
          </div>
        }
        
        <div class="rating-overlay">
          <ion-icon name="star"></ion-icon>
          <span>{{ business().rating | number:'1.1-1' }}</span>
        </div>
        
        <div class="status-badge" [class.open]="business().isOpen" [class.closed]="!business().isOpen">
          {{ business().isOpen ? 'Abierto' : 'Cerrado' }}
        </div>
      </div>
      
      <ion-card-header>
        <ion-card-subtitle class="service-category">{{ business().category }}</ion-card-subtitle>
        <ion-card-title class="service-name">{{ business().name }}</ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <p class="service-description">{{ business().description }}</p>
        <div class="service-details">
          <div class="detail-item">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ business().address }}</span>
          </div>
          <div class="detail-item">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <span>{{ business().reviewCount }} reseñas</span>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styleUrls: ['./service-card.component.css']
})
export class ServiceCardComponent {
   business = input.required<ServiceBusiness>();
   animationOrder = input<number>(0);
  
   cardClick = output<ServiceBusiness>();

  onCardClick(): void {
    this.cardClick.emit(this.business());
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = img.parentElement?.querySelector('.fallback-icon') as HTMLElement;
    if (fallback) {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = img.parentElement?.querySelector('.fallback-icon') as HTMLElement;
    if (fallback) {
      img.style.display = 'block';
      fallback.style.display = 'none';
    }
  }
}

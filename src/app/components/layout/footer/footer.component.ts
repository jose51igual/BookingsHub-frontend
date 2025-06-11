import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [IonIcon, CommonModule]
})
export default class FooterComponent {
  currentYear = new Date().getFullYear();
}

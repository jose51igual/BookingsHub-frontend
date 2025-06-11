/**
 * Archivo compartido para importaciones comunes en componentes standalone
 * Esto simplifica la importación de módulos comunes en componentes standalone
 * y reduce la duplicación de código.
 */

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

/**
 * Array de módulos comúnmente usados en componentes de la aplicación
 */
export const COMMON_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  IonicModule,
  RouterModule
];

/**
 * Array de módulos básicos para componentes que no necesitan formularios
 */
export const BASIC_IMPORTS = [
  CommonModule,
  IonicModule,
  RouterModule
];

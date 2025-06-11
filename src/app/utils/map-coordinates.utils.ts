import { Injectable, inject, signal } from '@angular/core';
import { GeoService } from '@services/index';

/**
 * Composable para manejo de coordenadas de mapas
 * Elimina duplicación de lógica de geocodificación
 */
@Injectable({
  providedIn: 'root'
})
export class MapCoordinatesService {
  private geoService = inject(GeoService);

  /**
   * Crear signals para coordenadas de mapa
   */
  createMapSignals() {
    return {
      mapLat: signal<number>(0),
      mapLng: signal<number>(0),
      hasMapCoordinates: signal<boolean>(false),
      isMapLoading: signal<boolean>(true),
      mapError: signal<string>('')
    };
  }

  /**
   * Cargar coordenadas para una dirección
   */
  async loadCoordinates(
    address: string,
    signals: {
      mapLat: any;
      mapLng: any;
      hasMapCoordinates: any;
      isMapLoading: any;
      mapError: any;
    }
  ): Promise<void> {
    if (!address) return;

    signals.isMapLoading.set(true);
    signals.mapError.set('');

    try {
      this.geoService.geocodeAddress(address).subscribe({
        next: (location) => {
          if (location) {
            signals.mapLat.set(location.lat);
            signals.mapLng.set(location.lng);
            signals.hasMapCoordinates.set(true);
            signals.mapError.set('');
          } else {
            signals.hasMapCoordinates.set(false);
            signals.mapError.set('No se pudieron obtener las coordenadas');
          }
          signals.isMapLoading.set(false);
        },
        error: (error) => {
          console.error('Error al geocodificar dirección:', error);
          signals.hasMapCoordinates.set(false);
          signals.isMapLoading.set(false);
          signals.mapError.set('Error al geocodificar la dirección');
        }
      });
    } catch (error) {
      console.error('Error en geocodificación:', error);
      signals.hasMapCoordinates.set(false);
      signals.isMapLoading.set(false);
      signals.mapError.set('Error al geocodificar la dirección');
    }
  }
}

/**
 * Hook-style function para usar coordinates en componentes
 */
export function useMapCoordinates() {
  const coordinatesService = inject(MapCoordinatesService);
  const signals = coordinatesService.createMapSignals();

  return {
    ...signals,
    loadCoordinates: (address: string) => 
      coordinatesService.loadCoordinates(address, signals)
  };
}

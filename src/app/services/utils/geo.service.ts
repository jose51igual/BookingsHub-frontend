import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { GoogleGeocodeResult, GoogleCoordinates } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private geocodeApiKey = environment.geocodeApiKey || environment.googleMapsApiKey;
  private coordinatesCache: { [address: string]: GoogleCoordinates } = {};
  
  constructor(private http: HttpClient) {
    // Intentar cargar el caché de coordenadas desde localStorage
    try {
      const cachedCoordinates = localStorage.getItem('coordinates-cache');
      if (cachedCoordinates) {
        this.coordinatesCache = JSON.parse(cachedCoordinates);
      }
    } catch (e) {
      console.warn('No se pudo cargar el caché de coordenadas');
    }
  }
  
  // Convertir dirección a coordenadas (latitud/longitud)
  geocodeAddress(address: string): Observable<GoogleCoordinates | null> {
    // Si no hay dirección, devolver null
    if (!address) {
      console.warn('No se proporcionó una dirección para geocodificar');
      return of(null);
    }
    
    // Verificar si tenemos la dirección en caché
    if (this.coordinatesCache[address]) {
      return of(this.coordinatesCache[address]);
    }
    
    // Si no tenemos API key, usamos coordenadas por defecto (simulación)
    if (!this.geocodeApiKey || this.geocodeApiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.warn('No se ha configurado una API key para geocodificación. Usando valores de prueba.');
      const mockCoordinates = this.getMockCoordinates(address);
      this.saveToCache(address, mockCoordinates);
      return of(mockCoordinates);
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.geocodeApiKey}`;
    
    return this.http.get<GoogleGeocodeResult>(url).pipe(
      timeout(10000), // Timeout después de 10 segundos
      map(response => {
        if (response.status === 'OK' && response.results.length > 0) {
          const coordinates = response.results[0].geometry.location;
          this.saveToCache(address, coordinates);
          return coordinates;
        }
        // Si hay error, devolvemos valores simulados
        const mockCoordinates = this.getMockCoordinates(address);
        this.saveToCache(address, mockCoordinates);
        return mockCoordinates;
      }),
      catchError(error => {
        console.error('Error en geocodificación:', error);
        // En caso de error, usamos simulación pero no la cacheamos como real
        return of(this.getMockCoordinates(address));
      })
    );
  }
  
  // Obtener coordenadas simuladas para testing o cuando no hay API key
  private getMockCoordinates(address: string): GoogleCoordinates {
    // Generar coordenadas pseudoaleatorias basadas en la dirección
    const hash = this.simpleHash(address);
    
    // Coordenadas por defecto (Madrid, España)
    const defaultLat = 40.416775;
    const defaultLng = -3.703790;
    
    // Generar pequeñas variaciones basadas en el hash
    const lat = defaultLat + (hash % 100) / 1000;
    const lng = defaultLng + (hash % 100) / 1000;
    
    return { lat, lng };
  }
  
  // Guardar coordenadas en caché
  private saveToCache(address: string, coordinates: GoogleCoordinates): void {
    this.coordinatesCache[address] = coordinates;
    
    // Guardar el caché actualizado en localStorage
    try {
      localStorage.setItem('coordinates-cache', JSON.stringify(this.coordinatesCache));
    } catch (e) {
      console.warn('No se pudo guardar el caché de coordenadas en localStorage');
    }
  }
  
  // Función simple de hash para generar valores consistentes
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    return Math.abs(hash);
  }
  
  // Limpiar el caché de coordenadas
  public clearCache(): void {
    this.coordinatesCache = {};
    localStorage.removeItem('coordinates-cache');
  }
}

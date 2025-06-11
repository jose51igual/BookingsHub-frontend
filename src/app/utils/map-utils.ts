/**
 * Utilidades para trabajar con Google Maps en Capacitor
 * Esta clase ayuda a resolver los problemas de compatibilidad de tipos
 * al trabajar con @capacitor/google-maps
 */
import { GoogleMap } from '@capacitor/google-maps';

/**
 * Wrapper para GoogleMap.create que evita problemas de tipos
 * al configurar mapas de Google con Capacitor
 */
export class MapUtils {
  /**
   * Crea una instancia de GoogleMap utilizando la configuración proporcionada
   * @param options Opciones de configuración para el mapa
   * @returns Instancia de GoogleMap
   */
  static async createMap(options: {
    id: string;
    element: HTMLElement;
    apiKey: string;
    config: {
      center: { lat: number; lng: number };
      zoom: number;
      [key: string]: any;
    };
  }): Promise<GoogleMap> {
    // Usamos any para evitar el error de tipos
    return GoogleMap.create(options as any);
  }
}

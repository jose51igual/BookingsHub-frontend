import { Component, ViewChild, ElementRef, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { environment } from '@environments/environment';
import { GoogleMap } from '@capacitor/google-maps';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Esto permite usar elementos web personalizados como capacitor-google-map
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('map') mapRef!: ElementRef<HTMLElement>;
  @Input() lat: number = 40.416775; // Madrid por defecto
  @Input() lng: number = -3.703790;
  @Input() title: string = 'Ubicación';
  @Input() height: string = '200px';
  @Output() mapLoadError = new EventEmitter<string>(); // Nuevo evento para errores
  @Output() mapLoaded = new EventEmitter<boolean>(); // Evento cuando el mapa se carga exitosamente
  
  private map: GoogleMap | undefined;
  private markerId: string | undefined;
  private apiKey = environment.googleMapsApiKey;
  public hasError = false;
  public errorMessage = '';
  public isMapLoaded = false;  // Nuevo estado para controlar la carga

  constructor(private cdr: ChangeDetectorRef) { }

  async ngAfterViewInit() {
    // Verificar que hay una API key válida antes de intentar cargar el mapa
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || this.apiKey.trim() === '') {
      this.setError('⚠️ API key de Google Maps no configurada.\n\nPara configurar Google Maps:\n1. Ve a Google Cloud Console\n2. Habilita Maps JavaScript API\n3. Crea una API key\n4. Actualiza environment.ts\n\nVer docs/google-maps-setup.md para más detalles.');
      return;
    }

    // Esperar un poco más para asegurar que el DOM esté completamente renderizado
    setTimeout(async () => {
      if (this.lat && this.lng) {
        await this.createMap();
      } else {
        this.setError('No se proporcionaron coordenadas válidas para el mapa');
      }
    }, 500); // Aumentado el tiempo de espera
  }

  async ngOnChanges(changes: SimpleChanges) {
    // Si cambian las coordenadas y el mapa ya está creado
    if ((changes['lat'] || changes['lng']) && this.map) {
      this.isMapLoaded = false;
      await this.updateMapPosition();
    }
  }

  async createMap() {
    if (!this.mapRef || !this.mapRef.nativeElement) {
      this.setError('No se encontró el elemento de referencia del mapa');
      return;
    }

    // Verificar que el elemento esté visible y montado en el DOM con retry más inteligente
    const element = this.mapRef.nativeElement;
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkElementVisibility = () => {
      const rect = element.getBoundingClientRect();
      const isVisible = element.offsetParent !== null && rect.width > 0 && rect.height > 0;
      
      if (!isVisible && retryCount < maxRetries) {
        retryCount++;
        console.warn(`El elemento del mapa no está visible, reintentando... (${retryCount}/${maxRetries})`);
        setTimeout(() => checkElementVisibility(), 300);
        return false;
      }
      
      if (!isVisible && retryCount >= maxRetries) {
        this.setError('❌ No se pudo cargar el mapa: el elemento no está visible después de varios intentos.\n\nEsto puede ocurrir si:\n• El contenedor del mapa está oculto\n• Hay problemas de CSS que afectan la visibilidad\n• El elemento no se ha renderizado correctamente');
        return false;
      }
      
      return true;
    };

    if (!checkElementVisibility()) {
      return;
    }

    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      this.setError('⚠️ No se ha configurado una API key válida para Google Maps.\n\nRevisa environment.ts y configura tu API key.');
      return;
    }

    try {
      // Emitir evento de carga iniciada
      this.isMapLoaded = false;
      this.mapLoaded.emit(false);
      
      console.log('🗺️ Creando mapa con coordenadas:', { lat: this.lat, lng: this.lng });
      
      // Crear el mapa siguiendo la documentación oficial de Capacitor
      this.map = await GoogleMap.create({
        id: 'business-location-map',
        element: this.mapRef.nativeElement,
        apiKey: this.apiKey,
        config: {
          center: {
            lat: this.lat,
            lng: this.lng
          },
          zoom: 15,
          disableDefaultUI: false,
          // Opciones adicionales para evitar problemas
          gestureHandling: 'cooperative',
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        }
      });

      console.log('✅ Mapa creado exitosamente');

      // Añadir marcador
      this.markerId = await this.map.addMarker({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        title: this.title,
        draggable: false
      });

      console.log('📍 Marcador añadido exitosamente');

      // Establecer evento para mapa cargado
      setTimeout(() => {
        this.isMapLoaded = true;
        this.hasError = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
        this.mapLoaded.emit(true);
        console.log('🎉 Mapa completamente cargado y listo');
      }, 800);
      
    } catch (error: any) {
      console.error('❌ Error al crear el mapa:', error);
      
      let errorMessage = '❌ Error al cargar el mapa de Google Maps.\n\n';
      
      // Analizar el tipo de error para dar mensajes más específicos
      if (error?.message?.includes('InvalidKey') || error?.message?.includes('API key')) {
        errorMessage += '🔑 Problema con la API Key:\n• La API key es inválida o ha expirado\n• No tienes permisos para usar Maps JavaScript API\n• Revisa Google Cloud Console\n\n';
      } else if (error?.message?.includes('billing') || error?.message?.includes('quota')) {
        errorMessage += '💳 Problema de facturación:\n• Activa la facturación en Google Cloud\n• Verifica que no has superado los límites\n\n';
      } else if (error?.message?.includes('referer')) {
        errorMessage += '🌐 Problema de dominio:\n• Configura las restricciones de la API key\n• Añade localhost para desarrollo\n\n';
      } else {
        errorMessage += `🐛 Error técnico: ${error?.message || 'Error desconocido'}\n\n`;
      }
      
      errorMessage += 'Consulta docs/google-maps-setup.md para más información.';
      
      this.setError(errorMessage);
    }
  }

  async updateMapPosition() {
    if (!this.map) {
      await this.createMap();
      return;
    }

    try {
      // Actualizar la posición del mapa
      await this.map.setCamera({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        zoom: 15,
        animate: true
      });

      // Eliminar el marcador anterior
      if (this.markerId) {
        await this.map.removeMarker(this.markerId);
      }

      // Añadir un nuevo marcador
      this.markerId = await this.map.addMarker({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        title: this.title,
        draggable: false
      });
      
      // Resetear estado de error si anteriormente hubo un error
      if (this.hasError) {
        this.hasError = false;
        this.errorMessage = '';
      }
      
    } catch (error) {
      console.error('Error al actualizar el mapa:', error);
      this.setError('Error al actualizar la posición del mapa');
    }
  }

  private setError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isMapLoaded = false;
    console.warn('🚨 Error en el componente de mapa:', message);
    this.cdr.detectChanges(); // Forzar detección de cambios
    this.mapLoadError.emit(message);
    this.mapLoaded.emit(false);
  }

  // Método para ser llamado externamente para reintentar cargar el mapa
  public retryLoadMap() {
    console.log('🔄 Reintentando cargar el mapa...');
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => this.createMap(), 300);
  }

  ngOnDestroy() {
    // Limpiar el mapa al destruir el componente
    if (this.map) {
      this.map.destroy();
    }
  }
}

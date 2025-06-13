import { Component, ViewChild, ElementRef, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, HostListener } from '@angular/core';
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
  private resizeTimeout: any; // Para debounce del resize

  constructor(private cdr: ChangeDetectorRef) { }

  // Listener para detectar cambios de tamaño de ventana
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // Debounce para evitar demasiadas llamadas
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      // Solo redimensionar si el mapa está cargado y funcionando
      if (this.map && this.isMapLoaded && !this.hasError) {
        this.handleResize();
      } else {
      }
    }, 500); // Aumentar el debounce time
  }

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
    }, 100); // Reducido el tiempo de espera inicial
  }

  async ngOnChanges(changes: SimpleChanges) {
    // Si cambian las coordenadas y el mapa ya está creado, solo actualizarlo
    if ((changes['lat'] || changes['lng']) && this.map && this.isMapLoaded) {
      await this.updateMapPosition();
    }
    // No recrear el mapa por cambios en otras propiedades
  }

  async createMap() {
    // Si ya hay un mapa creado y funcionando, no intentar recrearlo
    if (this.map && this.isMapLoaded) {
      return;
    }

    if (!this.mapRef || !this.mapRef.nativeElement) {
      this.setError('No se encontró el elemento de referencia del mapa');
      return;
    }

    // Verificar que el elemento esté visible y montado en el DOM
    const element = this.mapRef.nativeElement;
    let retryCount = 0;
    const maxRetries = 10; // Reducir intentos
    
    const checkElementVisibility = () => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Mejorar la detección de visibilidad
      const isVisible = element.offsetParent !== null && 
                       rect.width > 0 && 
                       rect.height > 0 &&
                       computedStyle.display !== 'none' &&
                       computedStyle.visibility !== 'hidden';
      
      if (!isVisible && retryCount < maxRetries) {
        retryCount++;
        console.warn(`El elemento del mapa no está visible, reintentando... (${retryCount}/${maxRetries})`);
        setTimeout(() => checkElementVisibility(), 300); // Reducir tiempo entre intentos
        return false;
      }
      
      if (!isVisible && retryCount >= maxRetries) {
        console.warn('⚠️ Elemento no visible después de varios intentos, pero continuando...');
        return true;
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
      // Detectar si estamos en móvil
      const isMobile = window.innerWidth <= 768;
      
      // Asegurar que el contenedor tenga las dimensiones correctas
      const element = this.mapRef.nativeElement;
      if (isMobile) {
        // Forzar dimensiones en móvil
        element.style.width = '100%';
        element.style.height = '250px';
        element.style.minHeight = '250px';
      }
      
      // Crear el mapa siguiendo la documentación oficial de Capacitor
      this.map = await GoogleMap.create({
        id: `business-location-map-${Date.now()}`, // ID único para evitar conflictos
        element: element,
        apiKey: this.apiKey,
        config: {
          center: {
            lat: this.lat,
            lng: this.lng
          },
          zoom: isMobile ? 15 : 14, // Zoom apropiado para cada dispositivo
          disableDefaultUI: false, // Deshabilitar UI en móvil para más espacio
          // Opciones adicionales optimizadas para móvil
          gestureHandling: isMobile ? 'greedy' : 'cooperative',
          zoomControl: !isMobile,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          // Mejoras para dispositivos táctiles
          scrollwheel: true,
          disableDoubleClickZoom: false,
          draggable: true,
          // Asegurar que el mapa sea responsive
          styles: []
        }
      });

      // Añadir marcador
      this.markerId = await this.map.addMarker({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        title: this.title,
        draggable: false
      });

      // Establecer evento para mapa cargado con más tiempo en móvil
      const loadTimeout = isMobile ? 1200 : 800;
      setTimeout(() => {
        this.isMapLoaded = true;
        this.hasError = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
        this.mapLoaded.emit(true);
      }, loadTimeout);
      
    } catch (error: any) {      
      
      this.setError(error);
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
      this.setError('Error al actualizar la posición del mapa');
    }
  }

  // Método para manejar el resize de la ventana
  private async handleResize() {
    if (!this.map || !this.isMapLoaded || this.hasError) {
      return;
    }

    try {      
      const isMobile = window.innerWidth <= 768;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Solo recentrar el mapa (esto fuerza el redibujado sin recrear)
      await this.map.setCamera({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        zoom: isMobile ? 16 : 15,
        animate: false // Sin animación para evitar conflictos durante resize
      });
      
      
    } catch (error) {
      console.error('Error al redimensionar el mapa:', error);
    }
  }

  private setError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isMapLoaded = false;
    this.cdr.detectChanges(); // Forzar detección de cambios
    this.mapLoadError.emit(message);
    this.mapLoaded.emit(false);
  }

  // Método para ser llamado externamente para reintentar cargar el mapa
  public retryLoadMap() {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => this.createMap(), 300);
  }

  ngOnDestroy() {
    // Limpiar timeout del resize
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Limpiar el mapa al destruir el componente
    if (this.map) {
      this.map.destroy();
    }
  }
}

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
  @Output() mapLoadError = new EventEmitter<string>();
  @Output() mapLoaded = new EventEmitter<boolean>();
  
  private map: GoogleMap | undefined;
  private markerId: string | undefined;
  private apiKey = environment.googleMapsApiKey;
  public hasError = false;
  public errorMessage = '';
  public isMapLoaded = false; 
  private resizeTimeout: any;

  constructor(private cdr: ChangeDetectorRef) { }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.map && this.isMapLoaded && !this.hasError) {
        this.handleResize();
      } else {
      }
    }, 500);
  }

  async ngAfterViewInit() {
    // Verificar que hay una API key válida antes de intentar cargar el mapa
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || this.apiKey.trim() === '') {
      this.setError('API key de Google Maps no configurada.\n\nPara configurar Google Maps:\n1. Ve a Google Cloud Console\n2. Habilita Maps JavaScript API\n3. Crea una API key\n4. Actualiza environment.ts\n\nVer docs/google-maps-setup.md para más detalles.');
      return;
    }

    setTimeout(async () => {
      if (this.lat && this.lng) {
        await this.createMap();
      } else {
        this.setError('No se proporcionaron coordenadas válidas para el mapa');
      }
    }, 100);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if ((changes['lat'] || changes['lng']) && this.map && this.isMapLoaded) {
      await this.updateMapPosition();
    }
  }

  async createMap() {
    if (this.map && this.isMapLoaded) {
      return;
    }

    if (!this.mapRef || !this.mapRef.nativeElement) {
      this.setError('No se encontró el elemento de referencia del mapa');
      return;
    }

    const element = this.mapRef.nativeElement;
    let retryCount = 0;
    const maxRetries = 10; 
    
    const checkElementVisibility = () => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      const isVisible = element.offsetParent !== null && 
                       rect.width > 0 && 
                       rect.height > 0 &&
                       computedStyle.display !== 'none' &&
                       computedStyle.visibility !== 'hidden';
      
      if (!isVisible && retryCount < maxRetries) {
        retryCount++;
        console.warn(`El elemento del mapa no está visible, reintentando... (${retryCount}/${maxRetries})`);
        setTimeout(() => checkElementVisibility(), 300);
        return false;
      }
      
      if (!isVisible && retryCount >= maxRetries) {
        console.warn('Elemento no visible después de varios intentos, pero continuando...');
        return true;
      }
      
      return true;
    };

    if (!checkElementVisibility()) {
      return;
    }

    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      this.setError('No se ha configurado una API key válida para Google Maps.\n\nRevisa environment.ts y configura tu API key.');
      return;
    }

    try {
      this.isMapLoaded = false;
      this.mapLoaded.emit(false);      
      const isMobile = false;
      
      const element = this.mapRef.nativeElement;
      if (isMobile) {
        element.style.width = '100%';
        element.style.height = '250px';
        element.style.minHeight = '250px';
      }
      
      this.map = await GoogleMap.create({
        id: `business-location-map-${Date.now()}`,
        element: element,
        apiKey: this.apiKey,
        config: {
          center: {
            lat: this.lat,
            lng: this.lng
          },
          zoom: isMobile ? 15 : 14,
          disableDefaultUI: false,
          gestureHandling: isMobile ? 'greedy' : 'cooperative',
          zoomControl: !isMobile,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          draggable: true,
          styles: []
        }
      });

      this.markerId = await this.map.addMarker({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        title: this.title,
        draggable: false
      });

      const loadTimeout = isMobile ? 1200 : 800;
      setTimeout(() => {
        this.isMapLoaded = true;
        this.hasError = false;
        this.cdr.detectChanges(); 
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
      await this.map.setCamera({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        zoom: 15,
        animate: true
      });

      if (this.markerId) {
        await this.map.removeMarker(this.markerId);
      }

      this.markerId = await this.map.addMarker({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        title: this.title,
        draggable: false
      });
      
      if (this.hasError) {
        this.hasError = false;
        this.errorMessage = '';
      }
      
    } catch (error) {
      this.setError('Error al actualizar la posición del mapa');
    }
  }

  private async handleResize() {
    if (!this.map || !this.isMapLoaded || this.hasError) {
      return;
    }

    try {      
      const isMobile = window.innerWidth <= 768;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await this.map.setCamera({
        coordinate: {
          lat: this.lat,
          lng: this.lng
        },
        zoom: isMobile ? 16 : 15,
        animate: false
      });
      
      
    } catch (error) {
      console.error('Error al redimensionar el mapa:', error);
    }
  }

  private setError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isMapLoaded = false;
    this.cdr.detectChanges();
    this.mapLoadError.emit(message);
    this.mapLoaded.emit(false);
  }

  public retryLoadMap() {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => this.createMap(), 300);
  }

  ngOnDestroy() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    if (this.map) {
      this.map.destroy();
    }
  }
}

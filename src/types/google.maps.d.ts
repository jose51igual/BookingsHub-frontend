// Archivo de declaración de tipos para Google Maps
// Esto evita errores con el plugin @capacitor/google-maps

// Declaramos el namespace global de google.maps para que TypeScript lo reconozca
declare namespace google {
  namespace maps {
    // Interfaces utilizadas por el plugin @capacitor/google-maps
    interface MapOptions {
      [key: string]: any;
    }

    interface MapTypeStyle {
      [key: string]: any;
    }

    interface PolygonOptions {
      [key: string]: any;
    }

    interface CircleOptions {
      [key: string]: any;
    }

    interface PolylineOptions {
      [key: string]: any;
    }
  }
}

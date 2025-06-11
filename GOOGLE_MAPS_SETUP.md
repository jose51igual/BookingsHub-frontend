# 🗺️ Configuración Rápida de Google Maps

## ⚡ Pasos Rápidos

1. **Ve a [Google Cloud Console](https://console.cloud.google.com/)**

2. **Crea un proyecto nuevo** (si no tienes uno)

3. **Habilita estas APIs:**
   - Maps JavaScript API
   - Geocoding API

4. **Crea una API Key:**
   - Ve a "APIs y Servicios" > "Credenciales"
   - Clic en "Crear credenciales" > "Clave de API"
   - Copia la API key generada

5. **Configura en la app:**
   ```typescript
   // En frontend/src/environments/environment.ts
   googleMapsApiKey: 'TU_API_KEY_AQUÍ'
   ```

6. **Reinicia el servidor:**
   ```bash
   ionic serve
   ```

## 🔧 Solución de Problemas

### Error "InvalidKey"
- ✅ Verifica que la API key sea correcta
- ✅ Asegúrate de haber habilitado "Maps JavaScript API"
- ✅ Revisa las restricciones de dominio (permite `localhost` para desarrollo)

### Error "Billing"
- ✅ Activa la facturación en Google Cloud Console
- ✅ Google Maps tiene $200 gratis al mes (suficiente para desarrollo)

### Mapa no se carga
- ✅ Revisa la consola del navegador para errores
- ✅ Verifica que el elemento HTML esté visible
- ✅ Comprueba la conexión a internet

## 📖 Documentación Completa

Para más detalles, consulta: `docs/google-maps-setup.md`

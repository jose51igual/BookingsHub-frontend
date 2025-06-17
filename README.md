# 📱 BookingsHub Frontend

Una aplicación híbrida moderna para gestión de reservas de servicios, desarrollada con Angular 19 e Ionic 8.

## 🚀 Características

- **Aplicación híbrida**: Web y móvil nativo (Android/iOS)
- **Arquitectura moderna**: Angular 19 con Signals y componentes standalone
- **UI nativa**: Ionic 8 con componentes optimizados para móviles
- **Autenticación JWT**: Sistema de roles (cliente/negocio)
- **Mapas integrados**: Google Maps con Capacitor
- **Live reload**: Desarrollo en tiempo real

## 📋 Requisitos Previos

### Desarrollo Web
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Desarrollo Móvil (Opcional)
- **Android Studio** (para Android)
- **Xcode** (para iOS - solo macOS)
- **Java JDK** 11 o superior

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd BookingsHub-frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea los archivos de entorno según tu necesidad:

#### Desarrollo Local
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: 'TU_GOOGLE_MAPS_API_KEY',
  // ... más configuraciones
};
```

#### Producción
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.bookingshub.es/api',
  googleMapsApiKey: 'TU_GOOGLE_MAPS_API_KEY_PROD',
  // ... más configuraciones
};
```

### 4. Configurar Google Maps (Opcional)
Si necesitas funcionalidad de mapas:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto y habilita Maps JavaScript API
3. Genera una API key
4. Configúrala en `src/environments/environment.ts`

## 🚀 Comandos de Desarrollo

### Desarrollo Web
```bash
# Iniciar servidor de desarrollo
npm start
# o
ionic serve

# Build de desarrollo
npm run build

# Build de producción
npm run build:prod

# Ejecutar tests
npm test

# Linting
npm run lint
```

### Desarrollo Móvil

#### Preparar plataforma Android
```bash
# Instalar Ionic CLI globalmente (si no está instalado)
npm install -g @ionic/cli

# Sincronizar con Capacitor
ionic capacitor sync android

# Abrir Android Studio
ionic capacitor open android
```

#### Ejecutar en dispositivo/emulador
```bash
# Ejecutar en Android con live reload
ionic capacitor run android -l --external

# Solo ejecutar en Android
ionic capacitor run android
```

#### Compilar APK
```bash
# Desde la carpeta android
cd android
./gradlew assembleDebug

# APK generado en: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios de la aplicación
│   ├── guards/             # Guards de autenticación
│   ├── interceptors/       # Interceptores HTTP
│   ├── utils/              # Utilidades y helpers
│   ├── models/             # Interfaces y tipos
│   └── layouts/            # Layouts de página
├── assets/                 # Recursos estáticos
├── environments/           # Configuraciones de entorno
└── theme/                  # Estilos globales
```

## 🔧 Configuración Adicional

### Variables de Entorno en WSL (Windows)

Si desarrollas en Windows con WSL:

```bash
# Configurar Android Studio para Capacitor
echo 'export CAPACITOR_ANDROID_STUDIO_PATH="/mnt/c/Program Files/Android/Android Studio/bin/studio64.exe"' >> ~/.bashrc
source ~/.bashrc
```

### Configuración de Dispositivo Android

Para desarrollo con dispositivo físico:
1. Habilita "Opciones de desarrollador" en tu dispositivo
2. Activa "Depuración USB"
3. Conecta por USB y autoriza la conexión
4. Verifica con: `adb devices`

## 🌐 Despliegue

### Despliegue Web
```bash
# Build de producción
npm run build:prod

# Los archivos generados estarán en dist/app/
# Subir a tu servidor web o hosting
```

### Despliegue Android
```bash
# Generar APK de release
cd android
./gradlew assembleRelease

# O generar Bundle para Google Play
./gradlew bundleRelease
```

## 🔐 Autenticación

La aplicación utiliza JWT con dos tipos de usuario:
- **Cliente**: Gestiona sus reservas
- **Negocio**: Gestiona servicios y reservas recibidas

### Rutas Protegidas
- `/mis-reservas` - Solo clientes
- `/panel-negocio/*` - Solo negocios
- `/perfil` - Usuarios autenticados

## 🗺️ Funcionalidades Principales

### Para Clientes
- Explorar negocios y servicios
- Realizar reservas
- Gestionar reservas existentes
- Crear reseñas
- Ver detalles de negocios

### Para Negocios
- Panel de administración
- Gestión de servicios
- Gestión de empleados
- Configuración de horarios
- Gestión de reservas recibidas
- Análisis y estadísticas

## 🛠️ Solución de Problemas

### Error: "comando no encontrado"
```bash
# Instalar CLI globalmente
npm install -g @ionic/cli @angular/cli

# O usar npx
npx @ionic/cli serve
```

### Error: "Unable to launch Android Studio"
```bash
# Configurar variable de entorno
export CAPACITOR_ANDROID_STUDIO_PATH="/ruta/a/android/studio/bin/studio64.exe"
```

### Error: "No devices found"
```bash
# Verificar dispositivos conectados
adb devices

# Instalar adb si no está disponible
sudo apt install adb
```

### Error de compilación Android
```bash
# Limpiar build de Android
cd android
./gradlew clean
./gradlew build
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de desarrollo |
| `npm run build:prod` | Build de producción |
| `npm run build:staging` | Build de staging |
| `npm test` | Ejecutar tests |
| `npm run lint` | Análisis de código |
| `npm run prepare-android` | Preparar archivos para Android |
| `npm run android` | Ejecutar en Android con live reload |

### Desarrollo con Emulador
```bash
# Crear emulador en Android Studio
# Tools > AVD Manager > Create Virtual Device

# Ejecutar con live reload
ionic capacitor run android -l --external

# Hacer capturas desde Android Studio o usando:
adb exec-out screencap -p > captura.png
```

---

**Desarrollado con ❤️ usando Angular 19 + Ionic 8**

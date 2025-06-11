import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private cookieKeys = ['auth_token', 'user_data']; // Datos que queremos persistir en cookies
  private cookieExpireDays = 7; // Cookies expiran en 7 días
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor(private storage: Storage) {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
  }

  async init() {
    if (this.isInitialized) {
      return;
    }

    const storage = await this.storage.create();
    this._storage = storage;
    this.isInitialized = true;
    
    // Al iniciar, verificamos si hay datos en cookies que necesitamos restaurar
    for (const key of this.cookieKeys) {
      const fromCookie = this.getCookie(key);
      if (fromCookie) {
        try {
          const value = JSON.parse(fromCookie);
          await this._storage?.set(key, value);
        } catch (e) {
          // Si no es JSON válido, guardamos como string
          await this._storage?.set(key, fromCookie);
        }
      }
    }
  }

  public async set(key: string, value: any): Promise<any> {
    await this.initPromise; // Asegurar que esté inicializado
    
    // Si es una clave que queremos persistir, la guardamos en cookie también
    if (this.cookieKeys.includes(key)) {
      this.setCookie(key, typeof value === 'string' ? value : JSON.stringify(value), this.cookieExpireDays);
    }
    return this._storage?.set(key, value) || Promise.resolve();
  }

  public async get(key: string): Promise<any> {
    await this.initPromise; // Asegurar que esté inicializado
    return this._storage?.get(key) || Promise.resolve(null);
  }

  public async remove(key: string): Promise<any> {
    await this.initPromise; // Asegurar que esté inicializado
    
    // Si es una clave que queremos persistir, la eliminamos de las cookies también
    if (this.cookieKeys.includes(key)) {
      this.deleteCookie(key);
    }
    return this._storage?.remove(key) || Promise.resolve();
  }

  public async clear(): Promise<void> {
    await this.initPromise; // Asegurar que esté inicializado
    
    // Limpiamos todas las cookies de la lista
    this.cookieKeys.forEach(key => this.deleteCookie(key));
    return this._storage?.clear() || Promise.resolve();
  }

  public async keys(): Promise<string[]> {
    await this.initPromise; // Asegurar que esté inicializado
    return this._storage?.keys() || Promise.resolve([]);
  }

  // Métodos para manejar cookies
  private setCookie(name: string, value: string, days: number): void {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    
    // Configuración segura de cookies con SameSite=Lax para permitir
    // el envío de cookies en navegaciones entre páginas
    document.cookie = name + '=' + encodeURIComponent(value) + 
                      expires + 
                      '; path=/; SameSite=Lax';
  }

  private getCookie(name: string): string | null {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) {
          const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
          return value;
        }
      }
    } catch (error) {
      console.error(`Error al leer cookie ${name}:`, error);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    try {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
    } catch (error) {
      console.error(`Error al eliminar cookie ${name}:`, error);
    }
  }
}

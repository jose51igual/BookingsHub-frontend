import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { StorageService } from '../utils/storage.service';
import { NotificationService } from '../core/notification.service';
import { environment } from '@environments/environment';
import { toObservable } from '@angular/core/rxjs-interop';
import { User, UpdateUserData, AuthState } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class AuthSignalService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private notificationService = inject(NotificationService);

  state = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  public isAuthenticated$!: Observable<boolean>;
  public userId$!: Observable<number | null>;

  get user() { return this.state().user; }
  get token() { return this.state().token; }
  get isAuthenticated() { return this.state().isAuthenticated; }
  get isLoading() { return this.state().isLoading; }
  get error() { return this.state().error; }
  get userId() { return this.state().user?.id || null; }

  constructor() {
    this.isAuthenticated$ = toObservable(computed(() => this.state().isAuthenticated));
    this.userId$ = toObservable(computed(() => this.state().user?.id || null));
    
    this.initializeFromStorage();
  }

  private async initializeFromStorage() {
    this.state.update(state => ({ ...state, isLoading: true }));
    
    try {
      await this.storage.init();
      const token = await this.storage.get('auth_token');
      let userData = await this.storage.get('user_data');
      if (!userData) {
        userData = await this.storage.get('current_user');
      }
      
      if (token && userData) {
        this.state.update(state => ({
          ...state,
          token,
          user: userData,
          isAuthenticated: true,
          isLoading: false
        }));
      } else {
        this.state.update(state => ({
          ...state,
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false
        }));
      }
    } catch (error) {
      this.state.update(state => ({
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Error al cargar datos de sesión'
      }));
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    this.state.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => this.handleAuthError(error, 'Error durante el inicio de sesión'))
    );
  }

  register(userData: any): Observable<any> {
    this.state.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData).pipe(
      tap(response => console.log('Registro exitoso:', response)),
      catchError(error => this.handleAuthError(error, 'Error durante el registro'))
    );
  }

  logout(): Observable<any> {
    return of(null).pipe(
      tap(() => {
        this.storage.remove('auth_token');
        this.storage.remove('user_data');
        
        this.state.set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        
        this.router.navigate(['/iniciar-sesion'], { replaceUrl: true });
      })
    );
  }

  updateUserProfile(userData: UpdateUserData): Observable<User> {
    if (!this.user?.id) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    
    return this.http.put<{message: string, user: User}>(`${environment.apiUrl}/users/profile`, userData).pipe(
      map((response: {message: string, user: User}) => {
        return response.user;
      }),
      tap((updatedUser: User) => {
        // Actualizar el usuario en el estado
        this.state.update(state => {
          const newUser = {
            ...state.user!,
            ...updatedUser
          };
          return {
            ...state,
            user: newUser
          };
        });
                
        this.storage.set('user_data', this.state().user);
        this.storage.set('current_user', this.state().user);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private handleAuthSuccess(response: any) {
    const { token, user } = response.data;

    this.storage.set('auth_token', token);
    this.storage.set('user_data', user); 
        
    // Actualizar estado
    this.state.update(state => ({
      ...state,
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    }));

    if (user?.role === 'cliente') {
      this.router.navigate(['/inicio'], { replaceUrl: true });
    } else if (user?.role === 'negocio') {
      this.router.navigate(['/panel-negocio/principal'], { replaceUrl: true });
    } else {
      console.log('Rol no válido, permaneciendo en login');
    }
  }

  public handleGoogleAuthSuccess(response: any) {
    this.handleAuthSuccess(response);
  }

  private handleAuthError(error: any, defaultMessage: string): Observable<never> {
    const errorMessage = error.error?.message || defaultMessage;
    
    this.state.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage
    }));
    
    return throwError(() => error);
  }

  async presentAlert(header: string, message: string): Promise<void> {
    await this.notificationService.showError(header, message);
  }

  async loadTokenAndUser(): Promise<void> {
    await this.initializeFromStorage();
  }

  async reloadAuthData() {
    await this.initializeFromStorage();
  }
}

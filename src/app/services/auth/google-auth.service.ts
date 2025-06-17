import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  
  signInWithGoogle(): void {
    const loginUrl = `${environment.apiUrl}/auth/google/login`;    
    window.location.href = loginUrl;
  }

  async initGoogleAuth(): Promise<void> {
    return Promise.resolve();
  }
}

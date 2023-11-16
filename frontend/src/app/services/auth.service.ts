import { Injectable } from '@angular/core';
import { AuthPlayerInterface } from '../interfaces/auth.player.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  authenticate(data: AuthPlayerInterface) {
    localStorage.setItem('ichi-auth', JSON.stringify(data));
  }

  unauthenticate() {
    localStorage.removeItem('ichi-auth');
  }

  isAuthenticated(): boolean {
    const data = localStorage.getItem('ichi-auth');

    if (data !== null) {
      const obj = JSON.parse(data);
      return this.isAuthPlayer(obj);
    }

    return false;
  }

  private isAuthPlayer(obj: any): obj is AuthPlayerInterface {
    return 'id' in obj && 'nickname' in obj;
  }
}

import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  constructor(private readonly sessionStorageService: SessionStorageService) {}

  getJWTData() {
    const token = this.sessionStorageService.get('ichi-auth-token');

    if (token !== null) {
      try {
        return jwtDecode<any>(token);
      } catch (e) {
        return;
      }
    }
  }

  getPlayerId(): number|null {
    const jwtData = this.getJWTData();
    return jwtData !== undefined ? jwtData.userId : null;
  }

  getUsername(): string|null {
    const jwtData = this.getJWTData();
    return jwtData !== undefined ? jwtData.username : null;
  }
}

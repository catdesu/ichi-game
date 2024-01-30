import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { SessionStorageService } from './session-storage.service';
import { JWTInterface } from '../interfaces/jwt.interface';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  constructor(private readonly sessionStorageService: SessionStorageService) {}

  getJWTData() {
    const token = this.sessionStorageService.get('ichi-auth-token');

    if (token === null) return;
    
    try {
      return jwtDecode<JWTInterface>(token);
    } catch (e) {
      return;
    }
  }

  getPlayerId(): number | undefined {
    const jwtData = this.getJWTData();
    return jwtData?.userId;
  }

  getUsername(): string | undefined {
    const jwtData = this.getJWTData();
    return jwtData?.username;
  }
}

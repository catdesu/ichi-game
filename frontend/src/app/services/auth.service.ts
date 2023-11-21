import { Injectable } from '@angular/core';
import { AuthPlayerInterface } from '../interfaces/auth.player.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.development';
import { SessionStorageService } from './session-storage.service';
import { LoginDto } from '../components/login/dto/login.dto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isUserLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly http: HttpClient,
    private readonly sessionStorageService: SessionStorageService
  ) {}

  login(loginDto: LoginDto): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, loginDto);
  }

  authenticate(token: string) {
    this.isUserLoggedIn.next(true);
    this.sessionStorageService.set('ichi-auth-token', token);
  }

  unauthenticate() {
    this.isUserLoggedIn.next(false);
    this.sessionStorageService.remove('ichi-auth-token');
  }

  isAuthenticated(): boolean {
    const data = this.sessionStorageService.get('ichi-auth-token');

    return data !== null;
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { RegisterDto } from '../components/register/dto/register.dto';
import { PlayerInterface } from '../interfaces/player.interface';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {

  constructor(private readonly http: HttpClient) {}

  create(registerDto: RegisterDto): Observable<PlayerInterface> {
    return this.http.post<PlayerInterface>(`${environment.apiUrl}/players`, registerDto);
  }
}

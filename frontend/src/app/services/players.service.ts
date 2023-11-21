import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { RegisterDto } from '../components/register/dto/register.dto';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {

  constructor(private readonly http: HttpClient) { }

  create(registerDto: RegisterDto): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/players`, registerDto);
  }
}

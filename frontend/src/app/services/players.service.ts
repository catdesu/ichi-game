import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {

  constructor(private readonly http: HttpClient) { }

  create(username: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/players`, { username });
  }
}

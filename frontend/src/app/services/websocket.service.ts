import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private serverUrl: string = `${environment.apiUrl}game-room`;
  private socket: Socket = io('http://localhost:3000');

  constructor(private readonly authService: AuthService) { }

  connect(): void {
    console.log(this.serverUrl);
    this.socket = io(this.serverUrl);

    this.socket.on('connect', () => {
      console.log('connected');
    });
  }
}

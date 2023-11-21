import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment.development';
import { AuthService } from './auth.service';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private serverUrl: string = `${environment.apiUrl}/game-room`;
  private socket?: Socket;

  constructor(private readonly sessionsService: SessionStorageService) { }

  connect(): void {
    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: `${this.sessionsService.get('ichi-auth-token')}`
      }
    });

    this.socket.on('connect', () => {
      console.log('connected');
    });
  }

  createGame() {

  }

  joinGame() {
    
  }
}

import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment.development';
import { SessionStorageService } from './session-storage.service';
import { JwtService } from './jwt.service';
import { BehaviorSubject } from 'rxjs';
import { PlayerInterface } from '../interfaces/player.interface';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private serverUrl: string = `${environment.apiUrl}/game-room`;
  private socket?: Socket;
  public players = new BehaviorSubject<PlayerInterface[]>([]);
  public joined = new BehaviorSubject<boolean>(false);
  public isCreator = new BehaviorSubject<boolean>(false);
  public code = new BehaviorSubject<string>('');

  constructor(
    private readonly sessionsService: SessionStorageService,
    private readonly jwtService: JwtService
  ) {}

  connect(): void {
    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: `${this.sessionsService.get('ichi-auth-token')}`,
      },
    });

    this.socket.on('connect', () => {
      console.log('connected');
    });

    this.socket.on('create-response', (data) => this.handleCreateGame(data));
    this.socket.on('join-response', (data) => this.handleJoinGame(data));
  }

  createGame() {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('create', {
        playerId: playerId,
      });
    }
  }

  handleCreateGame(data: any) {
    this.joined.next(true);
    this.code.next(data.code);
    this.players.next(data.players);
  }

  joinGame(code: string) {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('join', {
        code: code,
        playerId: playerId,
      });
    }
  }

  handleJoinGame(data: any) {
    this.joined.next(true);
    this.code.next(data.code);
    this.players.next(data.players);
  }
}

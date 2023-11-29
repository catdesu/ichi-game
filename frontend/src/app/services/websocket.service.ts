import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment.development';
import { SessionStorageService } from './session-storage.service';
import { JwtService } from './jwt.service';
import { BehaviorSubject } from 'rxjs';
import { PlayerInterface } from '../interfaces/player.interface';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GameInterface } from '../interfaces/game.interface';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private serverUrl: string = `${environment.apiUrl}/game-room`;
  private socket?: Socket;
  public players = new BehaviorSubject<PlayerInterface[]>([]);
  public joined = new BehaviorSubject<boolean>(false);
  public started = new BehaviorSubject<boolean>(false);
  public code = new BehaviorSubject<string>('');
  public playerHand = new BehaviorSubject<string[]>([]);
  public playerCards = new BehaviorSubject<
    { username: string; cardsCount: number }[]
  >([]);
  public playedCard = new BehaviorSubject<string>('');
  public playableCards = new BehaviorSubject<string[]>([]);
  public turnOrder = new BehaviorSubject<{ username: string; isPlayerTurn: boolean }[]>([]);

  constructor(
    private readonly sessionsService: SessionStorageService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private readonly router: Router
  ) {}

  connect(): void {
    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: `${this.sessionsService.get('ichi-auth-token')}`,
      },
    });

    this.socket.on('invalid-token', () => this.handleInvalidToken());

    this.socket.on('connect', () => {
      console.log('connected');
    });

    this.socket.on('create-response', (data) => this.handleCreateGame(data));
    this.socket.on('join-response', (data) => this.handleJoinGame(data));
    this.socket.on('leave-response', (data) => this.handleLeaveGame(data));
    this.socket.on('start-response', (data) => this.handleStartGame(data));
    this.socket.on('play-card-response', (data) => this.handlePlayCard(data));
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
    this.joined.next(data.joined);
    this.code.next(data.code);
    this.players.next(data.players);
    this.playerHand.next(data.hand_cards);
    this.playedCard.next(data.played_card);
    this.playerCards.next(data.player_cards);
    this.started.next(data.started);
    this.playableCards.next(data.playable_cards);
    this.turnOrder.next(data.turnOrder);
  }

  leaveGame() {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('leave', {
        code: this.code.value,
        playerId: playerId,
      });
    }
  }

  handleLeaveGame(data: any) {
    if (data) {
      this.players.next(data.players);
    } else {
      this.resetState();
    }
  }

  handleInvalidToken() {
    this.authService.unauthenticate();
    this.toastrService.error('You are not logged in');
    this.router.navigate(['auth', 'login']);
  }

  startGame() {
    this.socket?.emit('start', {
      code: this.code.value,
    });
  }

  handleStartGame(data: GameInterface) {
    this.playerHand.next(data.hand_cards);
    this.playedCard.next(data.played_card);
    this.playerCards.next(data.player_cards);
    this.playableCards.next(data.playable_cards);
    this.turnOrder.next(data.turnOrder);
    this.started.next(data.started);
  }

  playCard(cardName: string) {
    this.socket?.emit('play-card', {
      card: cardName,
    });
  }

  handlePlayCard(data: any) {
    if (data.hand_cards) {
      this.playerHand.next(data.hand_cards);
    }

    if (data.player_cards) {
      this.playerCards.next(data.player_cards);
    }

    this.playedCard.next(data.played_card);
    this.playableCards.next(data.playable_cards);
    this.turnOrder.next(data.turnOrder);
  }

  resetState() {
    this.code.next('');
    this.players.next([]);
    this.joined.next(false);
    this.started.next(false);
    this.playerHand.next([]);
    this.playedCard.next('');
    this.playerCards.next([]);
    this.started.next(false);
    this.playableCards.next([]);
  }
}

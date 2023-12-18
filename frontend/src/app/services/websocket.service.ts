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
import { PlayerTurnInterface } from '../interfaces/player-turn.interface';

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
  public turnOrder = new BehaviorSubject<PlayerTurnInterface[]>([]);
  public message = new BehaviorSubject<string>('');
  public winner = new BehaviorSubject<string>('');
  public direction = new BehaviorSubject<boolean>(true);
  public pause = new BehaviorSubject<boolean>(false);
  public vote = new BehaviorSubject<boolean>(false);
  public voteResult = new BehaviorSubject<{resume: number, wait: number}>({resume: 0, wait: 0});

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
    this.socket.on('draw-card-response', (data) => this.handleDrawCard(data));
    this.socket.on('game-result', (data) => this.handleGameResult(data));
    this.socket.on('pause', (data) => this.handlePause(data));
    this.socket.on('vote-response', (data) => this.handleVoteFor(data));
  }

  disconnect() {
    this.socket?.disconnect();
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
    this.joined.next(data.joined);
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
    if (data.status && data.status === 'error') {
      this.toastrService.error(data.message);
    }

    this.pause.next(data.pause);
    this.vote.next(data.vote);
    this.joined.next(data.joined);
    this.code.next(data.code);
    this.players.next(data.players);
    this.playerHand.next(data.hand_cards);
    this.playedCard.next(data.played_card);
    this.playerCards.next(data.player_cards);
    this.started.next(data.started);
    this.playableCards.next(data.playable_cards);
    this.turnOrder.next(data.turnOrder);
    this.direction.next(data.direction);
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
    this.direction.next(data.direction);
  }

  playCard(cardName: string, chosenColor?: string) {
    const playCard: any = {
      card: cardName,
    }

    if (chosenColor) {
      playCard.chosenColor = chosenColor;
    };

    this.socket?.emit('play-card', playCard);
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
    this.direction.next(data.direction);
  }

  drawCard() {
    this.socket?.emit('draw-card');
  }

  handleDrawCard(data: any) {
    if (data.hand_cards) {
      this.playerHand.next(data.hand_cards);
    }

    if (data.playable_cards) {
      this.playableCards.next(data.playable_cards);
    }

    this.turnOrder.next(data.turnOrder);
    this.playerCards.next(data.player_cards);
    this.direction.next(data.direction);
  }

  handleGameResult(data: any) {
    if (data.winner) {
      this.winner.next(data.winner);
    }

    this.message.next(data.message);
  }

  handlePause(data: any) {
    this.pause.next(data.pause);
    this.vote.next(data.vote);
  }

  voteFor(vote: string) {
    const code = this.code.value;
    const voteMessage = {
      vote, code,
    };
    this.socket?.emit('vote', voteMessage);
  }

  handleVoteFor(data: any) {
    this.voteResult.next(data.voteResult);

    if (data.players) {
      this.players.next(data.players);
    }
    
    if (data.turnOrder) {
      this.turnOrder.next(data.turnOrder);
    }
    
    if (data.playerCards) {
      this.playerCards.next(data.playerCards);
    }
    
    if (data.pause) {
      this.pause.next(data.pause);
    }
    
    if (data.vote) {
      this.vote.next(data.vote);
    }
  }

  partialResetState() {
    this.started.next(false);
    this.playerHand.next([]);
    this.playedCard.next('');
    this.playerCards.next([]);
    this.started.next(false);
    this.playableCards.next([]);
    this.turnOrder.next([]);
    this.winner.next('');
    this.message.next('');
    this.direction.next(true);
    this.pause.next(false);
    this.vote.next(false);
    this.voteResult.next({resume: 0, wait: 0});
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
    this.turnOrder.next([]);
    this.winner.next('');
    this.message.next('');
    this.direction.next(true);
    this.pause.next(false);
    this.vote.next(false);
    this.voteResult.next({resume: 0, wait: 0});
  }
}

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
import { StartGameInterface } from '../interfaces/start-game.interface';
import { PlayerTurnInterface } from '../interfaces/player-turn.interface';
import { PlayerCardsInterface } from '../interfaces/player-cards.interface';
import { VoteResultInterface } from '../interfaces/vote-result.interface';
import { ChallengeInterface } from '../interfaces/challenge.interface';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private serverUrl: string = `${environment.apiUrl}/game-room`;
  private socket?: Socket;
  public defaultVoteResult = {resume: 0, wait: 0};
  public defaultChallenge = {username: '', previousCard: ''};
  public players = new BehaviorSubject<PlayerInterface[]>([]);
  public joined = new BehaviorSubject<boolean>(false);
  public started = new BehaviorSubject<boolean>(false);
  public code = new BehaviorSubject<string>('');
  public playerHand = new BehaviorSubject<string[]>([]);
  public playerCards = new BehaviorSubject<PlayerCardsInterface[]>([]);
  public playedCard = new BehaviorSubject<string>('');
  public playableCards = new BehaviorSubject<string[]>([]);
  public turnOrder = new BehaviorSubject<PlayerTurnInterface[]>([]);
  public message = new BehaviorSubject<string>('');
  public winner = new BehaviorSubject<string>('');
  public direction = new BehaviorSubject<boolean>(true);
  public pause = new BehaviorSubject<boolean>(false);
  public vote = new BehaviorSubject<boolean>(false);
  public voteResult = new BehaviorSubject<VoteResultInterface>(this.defaultVoteResult);
  public challenge = new BehaviorSubject<ChallengeInterface>(this.defaultChallenge);

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

    this.socket.on('connect', () => console.log('Connected'));
    this.socket.on('invalid-token', () => this.handleInvalidToken());
    this.socket.on('create-response', (data) => this.handleCreateGame(data));
    this.socket.on('join-response', (data) => this.handleJoinGame(data));
    this.socket.on('leave-response', (data) => this.handleLeaveGame(data));
    this.socket.on('start-response', (data) => this.handleStartGame(data));
    this.socket.on('play-card-response', (data) => this.handlePlayCard(data));
    this.socket.on('draw-card-response', (data) => this.handleDrawCard(data));
    this.socket.on('game-result', (data) => this.handleGameResult(data));
    this.socket.on('pause', (data) => this.handlePause(data));
    this.socket.on('vote-response', (data) => this.handleVoteFor(data));
    this.socket.on('ask-challenge', (data) => this.handleAskChallenge(data));
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  createGame(): void {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('create', {
        playerId: playerId,
      });
    }
  }

  handleCreateGame(data: any): void {
    this.joined.next(data.joined);
    this.code.next(data.code);
    this.players.next(data.players);
  }

  joinGame(code: string): void {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('join', {
        code: code,
        playerId: playerId,
      });
    }
  }

  handleJoinGame(data: any): void {
    if (data.status && data.status === 'error') {
      this.toastrService.error(data.message);
      return;
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

  leaveGame(): void {
    const playerId = this.jwtService.getPlayerId();

    if (playerId) {
      this.socket?.emit('leave', {
        code: this.code.value,
        playerId: playerId,
      });
    }
  }

  handleLeaveGame(data: any): void {
    if (data) {
      this.players.next(data.players);
    } else {
      this.resetState();
    }
  }

  handleInvalidToken(): void {
    this.authService.unauthenticate();
    this.toastrService.error('You are not logged in');
    this.router.navigate(['auth', 'login']);
  }

  startGame(): void {
    this.socket?.emit('start', {
      code: this.code.value,
    });
  }

  handleStartGame(data: StartGameInterface): void {
    this.playerHand.next(data.hand_cards);
    this.playedCard.next(data.played_card);
    this.playerCards.next(data.player_cards);
    this.playableCards.next(data.playable_cards);
    this.turnOrder.next(data.turnOrder);
    this.started.next(data.started);
    this.direction.next(data.direction);
  }

  playCard(cardName: string, cardToRemoveIndex: number, chosenColor?: string): void {
    const playCard: any = {
      card: cardName,
      cardIndex: cardToRemoveIndex,
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

  drawCard(): void {
    this.socket?.emit('draw-card');
  }

  handleDrawCard(data: any): void {
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

  handleGameResult(data: any): void {
    if (data.winner) {
      this.winner.next(data.winner);
    }

    this.message.next(data.message);
  }

  handlePause(data: any): void {
    this.pause.next(data.pause);
    this.vote.next(data.vote);
  }

  voteFor(vote: string): void {
    const code = this.code.value;
    const voteMessage = {
      vote, code,
    };
    this.socket?.emit('vote', voteMessage);
  }

  handleVoteFor(data: any): void {
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
    
    if (data.pause !== undefined) {
      this.pause.next(data.pause);
    }
    
    if (data.vote !== undefined) {
      this.vote.next(data.vote);
    }
  }

  handleAskChallenge(data: ChallengeInterface): void {
    this.challenge.next(data);
  }
  
  challengePlayer(isChallenging: boolean): void {
    this.socket?.emit('challenge', { isChallenging });
    this.challenge.next(this.defaultChallenge);
  }

  partialResetState(): void {
    this.started.next(false);
    this.playerHand.next([]);
    this.playedCard.next('');
    this.playerCards.next([]);
    this.playableCards.next([]);
    this.turnOrder.next([]);
    this.winner.next('');
    this.message.next('');
    this.direction.next(true);
    this.pause.next(false);
    this.vote.next(false);
    this.voteResult.next(this.defaultVoteResult);
    this.challenge.next(this.defaultChallenge);
  }

  resetState(): void {
    this.code.next('');
    this.players.next([]);
    this.joined.next(false);
    this.partialResetState();
  }
}

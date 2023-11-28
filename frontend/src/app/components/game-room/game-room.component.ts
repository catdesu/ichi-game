import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PlayerInterface } from 'src/app/interfaces/player.interface';
import { JwtService } from 'src/app/services/jwt.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css']
})
export class GameRoomComponent implements OnInit {
  joinGameForm: FormGroup = new FormGroup({
    code: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ]),
  });
  public playerPos = ['player_top', 'player_left', 'player_right'];
  public joined: boolean = false;
  public started: boolean = false;
  public code: string = '';
  public players: PlayerInterface[] = [];
  public playerHand: string[] = [];
  public playerCards: { username: string; cardsCount: number }[] = [];
  public playedCard: string = '';
  public playableCards: string[] = [];

  constructor(private readonly websocketService: WebsocketService, private readonly jwtService: JwtService) {}

  ngOnInit(): void {
    this.websocketService.connect();

    this.websocketService.joined.subscribe((joined) => {
      this.joined = joined;
    });

    this.websocketService.code.subscribe((code) => {
      this.code = code;
    });
    
    this.websocketService.players.subscribe((players) => {
      this.players = players;
    });
    
    this.websocketService.started.subscribe((started) => {
      this.started = started;
    });

    this.websocketService.playerHand.subscribe((playerHand) => {
      this.playerHand = playerHand;
    });

    this.websocketService.playerCards.subscribe((playerCards) => {
      this.playerCards = playerCards;
    });

    this.websocketService.playedCard.subscribe((playedCard) => {
      this.playedCard = playedCard;
    });
    
    this.websocketService.playableCards.subscribe((playableCards) => {
      this.playableCards = playableCards;
    });
  }

  createGame() {
    this.websocketService.createGame();
  }

  joinGame() {
    if (this.joinGameForm.invalid) {
      this.joinGameForm.get('code')?.markAsDirty;
      return;
    }

    const code = this.joinGameForm.get('code')?.value;
    this.websocketService.joinGame(code);
  }

  leaveGame() {
    this.websocketService.leaveGame();
  }

  startGame() {
    this.websocketService.startGame();
  }

  getCardStyle(cardName: string): object {
    const isPlayable = this.playableCards.includes(cardName);

    return {
      'background': `url("../../../assets/images/cards-front/${cardName}.png") center/cover`,
      'color': 'transparent',
      'filter': isPlayable ? 'none' : 'brightness(50%)',
    };
  }
  
  getTopCardStyle(cardName: string): object {
    return {
      'background': `url("../../../assets/images/cards-front/${cardName}.png") center/cover`,
      'color': 'transparent',
    };
  }

  playCard(cardName: string) {
    if (!this.playableCards.includes(cardName)) {
      
    }
  }
}

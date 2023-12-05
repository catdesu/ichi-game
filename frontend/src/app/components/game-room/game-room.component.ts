import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PlayerInterface } from 'src/app/interfaces/player.interface';
import { ColorDialogService } from 'src/app/services/color-dialog.service';
import { JwtService } from 'src/app/services/jwt.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css'],
})
export class GameRoomComponent implements OnInit {
  joinGameForm: FormGroup = new FormGroup({
    code: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ]),
  });
  public username: string = '';
  public playerPos = ['player_top', 'player_left', 'player_right'];
  public joined: boolean = false;
  public started: boolean = false;
  public code: string = '';
  public players: PlayerInterface[] = [];
  public playerHand: string[] = [];
  public playerCards: { username: string; cardsCount: number }[] = [];
  public playedCard: string = '';
  public playableCards: string[] = [];
  public turnOrder: { username: string; isPlayerTurn: boolean, hasDrawnThisTurn: boolean }[] = [];

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly jwtService: JwtService,
    private readonly colorDialogService: ColorDialogService
  ) {}

  ngOnInit(): void {
    this.websocketService.connect();

    this.username = this.jwtService.getUsername()!;

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

    this.websocketService.turnOrder.subscribe((turnOrder) => {
      this.turnOrder = turnOrder;
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

  async playCard(cardName: string) {
    if (this.turnOrder.find((player) => player.username === this.username)?.isPlayerTurn) {
      if (this.playableCards.includes(cardName)) {
        if (['changeColorW', 'draw4W'].includes(cardName)) {
          // todo: make a popup to choose a color
          const chosenColor = await this.colorDialogService.openColorDialog();
          const newCardName = cardName.replace(/W$/, chosenColor);
          this.websocketService.playCard(newCardName);
        } else {
          this.websocketService.playCard(cardName);
        }
      }
    }
  }

  drawCard() {
    if (this.turnOrder.find((player) => player.username === this.username)?.isPlayerTurn) {
      this.websocketService.drawCard();
    }
  }
}

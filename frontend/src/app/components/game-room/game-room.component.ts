import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Tooltip } from 'primeng/tooltip';
import { ChallengeInterface } from 'src/app/interfaces/challenge.interface';
import { PlayerCardsInterface } from 'src/app/interfaces/player-cards.interface';
import { PlayerTurnInterface } from 'src/app/interfaces/player-turn.interface';
import { PlayerInterface } from 'src/app/interfaces/player.interface';
import { VoteResultInterface } from 'src/app/interfaces/vote-result.interface';
import { ChallengeDialogService } from 'src/app/services/challenge-dialog.service';
import { ColorDialogService } from 'src/app/services/color-dialog.service';
import { JwtService } from 'src/app/services/jwt.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('visible', style({
        opacity: 1,
      })),
      state('hidden', style({
        opacity: 0,
      })),
      transition('visible => hidden', animate('500ms ease-out')),
      transition('hidden => visible', animate('500ms ease-in')),
    ]),   
  ],
})
export class GameRoomComponent implements OnInit {
  @ViewChild(Tooltip) tooltip!: Tooltip;
  joinGameForm: FormGroup = new FormGroup({
    code: new FormControl(null, [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ]),
  });
  public username: string = '';
  public tooltipText: string = 'Copy code';
  public playerPos = ['player_left', 'player_top', 'player_right'];
  public joined: boolean = false;
  public started: boolean = false;
  public code: string = '';
  public players: PlayerInterface[] = [];
  public playerHand: string[] = [];
  public playerCards: PlayerCardsInterface[] = [];
  public playedCard: string = '';
  public playableCards: string[] = [];
  public turnOrder: PlayerTurnInterface[] = [];
  public fieldColor: string = '';
  public message: string = '';
  public winner: string = '';
  public show: boolean = false;
  public direction: boolean = false;
  public pause: boolean = false;
  public vote: boolean = false;
  public voteResult: VoteResultInterface = this.websocketService.defaultVoteResult;
  public challenge: ChallengeInterface = this.websocketService.defaultChallenge;

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly jwtService: JwtService,
    private readonly colorDialogService: ColorDialogService,
    private readonly challengeDialogService: ChallengeDialogService,
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
      if (this.playedCard)
        this.fieldColor = this.playedCard.slice(-1);
    });

    this.websocketService.playableCards.subscribe((playableCards) => {
      this.playableCards = playableCards;
    });

    this.websocketService.turnOrder.subscribe((turnOrder) => {
      this.turnOrder = turnOrder;
    });
    
    this.websocketService.winner.subscribe((winner) => {
      this.winner = winner;
    });
    
    this.websocketService.message.subscribe((message) => {
      this.message = message;
      this.show = true;

      if (message !== '') {
        setTimeout(() => {
          this.show = false;
          this.message = '';
          this.websocketService.partialResetState();
        }, 5000);
      }
    });

    this.websocketService.direction.subscribe((direction) => {
      // Reverse direction true = reversed, false = normal
      this.direction = !direction;
    });
    
    this.websocketService.pause.subscribe((pause) => {
      this.pause = pause;
      this.show = pause ? pause : false;
    });
    
    this.websocketService.vote.subscribe((vote) => {
      this.vote = vote;
    });
    
    this.websocketService.voteResult.subscribe((voteResult) => {
      this.voteResult = voteResult;
    });
    
    this.websocketService.challenge.subscribe(async challenge => {
      this.challenge = challenge;

      if (challenge.username !== '' && challenge.previousCard !== '') {
        const isChallenging = await this.challengeDialogService.openChalengeDialog(challenge.username, challenge.previousCard);
        this.websocketService.challengePlayer(isChallenging);
      }
    });
  }

  createGame(): void {
    this.websocketService.createGame();
  }

  joinGame(): void {
    if (this.joinGameForm.invalid) {
      this.joinGameForm.get('code')?.markAsDirty;
      return;
    }

    const code = this.joinGameForm.get('code')?.value;
    this.websocketService.joinGame(code);
  }

  leaveGame(): void {
    this.websocketService.leaveGame();
  }

  startGame(): void {
    this.websocketService.startGame();
  }

  async copyCode(): Promise<void> {
    await navigator.clipboard.writeText(this.code);
    this.tooltipText = 'Copied to clipboard!';
    this.tooltip.activate();

    setTimeout(() => {
      this.tooltip.hide();
      this.tooltipText = 'Copy code';
    }, 2000);
  }

  async playCard(cardName: string, cardToRemoveIndex: number): Promise<void> {
    if (!this.turnOrder.find((player) => player.username === this.username)?.isPlayerTurn || this.pause) {
      return;
    }
    
    if (!this.playableCards.includes(cardName)) {
      return;
    }

    if (['changeColorW', 'draw4W'].includes(cardName)) {
      const chosenColor = await this.colorDialogService.openColorDialog();
      if (!chosenColor) return;
      cardName = cardName.replace(/W$/, chosenColor);
    }

    this.websocketService.playCard(cardName, cardToRemoveIndex);
  }

  drawCard(): void {
    if (this.turnOrder.find((player) => player.username === this.username)?.isPlayerTurn) {
      this.websocketService.drawCard();
    }
  }

  voteFor(vote: string): void {
    this.websocketService.voteFor(vote);
  }
}

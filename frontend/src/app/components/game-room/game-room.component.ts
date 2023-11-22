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
  public joined: boolean = false;
  public code: string = '';
  public players: PlayerInterface[] = [];

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
}

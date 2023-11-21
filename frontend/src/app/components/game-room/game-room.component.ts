import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
      Validators.min(6),
      Validators.max(6),
    ]),
  });

  constructor(private readonly websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.websocketService.connect();
  }

  createGame() {}

  joinGame() {}
}

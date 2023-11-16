import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './game-room.service';
import { SessionsInterface } from './interfaces/session.interface';
import { playersInterface } from './interfaces/players.interface';
import { GameRoomStatus } from './enums/game-room-status.enum';
import { ROOM_MAX_PLAYERS } from 'src/constants';

@WebSocketGateway({
  namespace: 'game-room',
  cors: 'localhost:4200',
  transports: ['websocket'],
})
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;
  private readonly sessions = new Map<string, SessionsInterface>();

  constructor(private readonly gameRoomService: GameRoomService) {}

  handleConnection(client: Socket): void {
    console.log(client.id, 'is connected');
  }

  handleDisconnect(client: Socket): void {
    console.log(client.id, 'is disconnected');
  }

  @SubscribeMessage('create')
  async handleCreateGameRoom(
    client: Socket,
    data: { playerId: number },
  ): Promise<void> {
    const { playerId } = data;
    const { gameRoom, player } =
      await this.gameRoomService.createGameRoom(playerId);
    const sessionPlayer: playersInterface = {
      id: client.id,
      username: player.username,
    };

    if (!this.sessions.has(gameRoom.code)) {
      this.sessions.set(gameRoom.code, {
        status: gameRoom.status,
        players: [sessionPlayer],
      });

      client.emit('create-response', {
        message: 'Game room created',
        code: gameRoom.code,
      });
    }
  }

  @SubscribeMessage('join')
  async handleJoinGameRoom(
    client: Socket,
    data: { code: string, playerId: number },
  ): Promise<void> {
    const { code, playerId } = data;
    
    if (!this.sessions.has(code)) {
      client.emit('join-response', `Room with this code does not exist!`);
      return;
    }

    const session = this.sessions.get(code);

    if (session.status !== GameRoomStatus.Open) {
      client.emit('join-response', { status: 'error', message: 'Room is not joinable!' });
      return;
    }

    if (session.players.length === ROOM_MAX_PLAYERS) {
      client.emit('join-response', { status: 'error', message: 'Room is already full!' });
      return;
    }

    const player = await this.gameRoomService.joinGameRoom(code, playerId);

    const sessionPlayer: playersInterface = {
      id: client.id,
      username: player.username,
    };

    session.players.push(sessionPlayer);

    session.players.forEach((player) => {
      client
        .to(player.id)
        .emit('join-response', `${sessionPlayer.username} joined`);
    });

    client.emit('join-response', `You joined the game room`);
  }

  @SubscribeMessage('game-start')
  handleGameStart(client: Socket, data: { code: string, playerId: number }) {}
  
  @SubscribeMessage('game-finished')
  handleGameFinished(client: Socket, data: { code: string }) {}
}

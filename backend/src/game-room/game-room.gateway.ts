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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'game-room',
  cors: 'localhost:4200',
  transports: ['websocket'],
})
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;
  private readonly sessions = new Map<string, SessionsInterface>();

  constructor(
    private readonly gameRoomService: GameRoomService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);

    const player = await this.gameRoomService.GetSessionPlayer(result);

    

    if (player.gameRoom !== null) {
      if (!this.sessions.has(player.gameRoom.code)) {
        const sessionPlayer: playersInterface = {
          id: client.id,
          isCreator: false,
          username: player.username,
        };

        this.sessions.set(player.gameRoom.code, {
          status: player.gameRoom.status,
          players: [sessionPlayer],
        });
      } else {
        if (!this.sessions.get(player.gameRoom.code).players.includes({ id: client.id, isCreator: false, username: player.username })) {
          this.sessions.get(player.gameRoom.code).players.push({
            id: client.id,
            isCreator: player.gameRoom.fk_creator_player_id === result.userId,
            username: player.username,
          });
        }
      }

      this.sessions.get(player.gameRoom.code).players.forEach((thisPlayer) => {
        client
          .to(thisPlayer.id)
          .emit('join-response', {
            status: 'success',
            code: player.gameRoom.code,
            isCreator: player.gameRoom.fk_creator_player_id === result.userId,
            players: this.sessions.get(player.gameRoom.code).players,
          });
      });

      client.emit('join-response', {
        status: 'success',
        code: player.gameRoom.code,
        players: this.sessions.get(player.gameRoom.code).players,
        joined: true,
      });
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);

    const player = await this.gameRoomService.GetSessionPlayer(result);

    if (player.gameRoom !== null) {
      if (this.sessions.has(player.gameRoom.code)) {
        this.sessions
          .get(player.gameRoom.code)
          .players.forEach((thisPlayer, index) => {
            if (thisPlayer.username === player.username) {
              this.sessions.get(player.gameRoom.code).players.splice(index, 1);
            }
          });
      }
  
      this.sessions.get(player.gameRoom.code).players.forEach((thisPlayer) => {
        client
          .to(thisPlayer.id)
          .emit('join-response', {
            status: 'success',
            isCreator: player.gameRoom.fk_creator_player_id === result.userId,
            players: this.sessions.get(player.gameRoom.code).players,
          });
      });
    }
  }

  @UseGuards(WsJwtGuard)
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
      isCreator: true,
      username: player.username,
    };

    if (!this.sessions.has(gameRoom.code)) {
      this.sessions.set(gameRoom.code, {
        status: gameRoom.status,
        players: [sessionPlayer],
      });

      client.emit('create-response', {
        message: 'Game room created',
        players: this.sessions.get(gameRoom.code).players,
        code: gameRoom.code,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join')
  async handleJoinGameRoom(
    client: Socket,
    data: { code: string; playerId: number },
  ): Promise<void> {
    const { code, playerId } = data;

    if (!this.sessions.has(code)) {
      client.emit('join-response', `Room with this code does not exist!`);
      return;
    }

    const session = this.sessions.get(code);

    if (session.status !== GameRoomStatus.Open) {
      client.emit('join-response', {
        status: 'error',
        message: 'Room is not joinable!',
      });
      return;
    }

    if (session.players.length === ROOM_MAX_PLAYERS) {
      client.emit('join-response', {
        status: 'error',
        message: 'Room is already full!',
      });
      return;
    }

    const player = await this.gameRoomService.joinGameRoom(code, playerId);

    const sessionPlayer: playersInterface = {
      id: client.id,
      isCreator: false,
      username: player.username,
    };

    session.players.push(sessionPlayer);

    session.players.forEach((player) => {
      client
        .to(player.id)
        .emit('join-response', { status: 'success', players: session.players });
    });

    client.emit('join-response', {
      status: 'success',
      code: code,
      players: session.players,
      joined: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave')
  async handleLeave(client: Socket, data: { code: string; playerId: number }) {
    await this.gameRoomService.leaveGameRoom(data.playerId);

    if (this.sessions.has(data.code)) {
      this.sessions.get(data.code).players.forEach((thisPlayer, index) => {
        if (thisPlayer.id === client.id) {
          this.sessions.get(data.code).players.splice(index, 1);
        }
      });

      if (this.sessions.get(data.code).players.length === 0) {
        this.sessions.delete(data.code);
        await this.gameRoomService.delete(data.code);
      } else {
        this.sessions.get(data.code).players.forEach((thisPlayer) => {
          client
            .to(thisPlayer.id)
            .emit('leave-response', {
              players: this.sessions.get(data.code).players,
            });
        });
      }
  
      client.emit('leave-response');
    }
  }

  @SubscribeMessage('start')
  handleGameStart(client: Socket, data: { code: string; playerId: number }) {}

  @SubscribeMessage('finished')
  handleGameFinished(client: Socket, data: { code: string }) {}
}

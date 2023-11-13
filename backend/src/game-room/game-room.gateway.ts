import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './game-room.service';

@WebSocketGateway({
  namespace: 'game-room',
  transports: ['websocket']
})
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameRoomService: GameRoomService) {}

  handleConnection(client: Socket): void {
    // Handle connection logic
  }

  handleDisconnect(client: Socket): void {
    // Handle disconnection logic
  }

  @SubscribeMessage('create-game-room')
  handleCreateGameRoom(client: Socket, data: { playerId: number }): void {
    const { playerId } = data;
    this.gameRoomService.createGameRoom(playerId);
  }

  @SubscribeMessage('join-game-room')
  handleJoinGameRoom(client: Socket, data: { code: string; playerId: number }): void {
    const { code, playerId } = data;
    this.gameRoomService.joinGameRoom(code, playerId);
  }
}

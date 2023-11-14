import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './game-room.service';

@WebSocketGateway({
  namespace: 'game-room',
  transports: ['websocket']
})
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;
  private readonly sessions = new Map<string, Socket[]>();

  constructor(private readonly gameRoomService: GameRoomService) {}

  handleConnection(client: Socket): void {
    // Handle connection logic
  }

  handleDisconnect(client: Socket): void {
    // Handle disconnection logic
  }

  @SubscribeMessage('create')
  async handleCreateGameRoom(client: Socket, data: { playerId: number }): Promise<void> {
    const { playerId } = data;
    const code = await this.gameRoomService.createGameRoom(playerId);
    
    // Notify the client that the game room was created
    client.emit('create-success', 'Game room created');
    
    // Add the client socket to the roomSockets map
    if (!this.sessions.has(code)) {
      this.sessions.set(code, []);
    }
    this.sessions.get(code).push(client);
  }

  @SubscribeMessage('join')
  handleJoinGameRoom(@MessageBody() data, client: Socket): void {
    const { code, playerId } = data;
    this.gameRoomService.joinGameRoom(code, playerId);

    client.emit('join-success', 'Game room joined');

    if (!this.sessions.has(code)) {
      this.sessions.set(code, []);
    }
    this.sessions.get(code).push(client);
  }
}

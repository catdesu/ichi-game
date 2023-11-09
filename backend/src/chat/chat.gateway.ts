import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'chat',
  transports: ['websocket']
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoinSession(@MessageBody('username') username: string, @ConnectedSocket() client: Socket): void {
    console.log(username, client.id);
  }

  @SubscribeMessage('send-message')
  handleSendMessage(client: any, payload: any): void {
    console.log(payload.username, payload.message);
    client.emit('receive-message', payload);
  }
}

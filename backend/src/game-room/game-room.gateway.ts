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
import packOfCards from './cards/pack-of-cards';
import { PlayersService } from 'src/players/players.service';
import { UpdatePlayerDto } from 'src/players/dto/update-player.dto';
import { CreateGameStateDto } from 'src/game-states/dto/create-game-state.dto';
import { GameStatesService } from 'src/game-states/game-states.service';

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
    private readonly playerService: PlayersService,
    private readonly gameStatesService: GameStatesService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);

    const player = await this.gameRoomService.GetSessionPlayer(result);

    if (player.gameRoom !== null) {
      if (player.gameRoom.status !== GameRoomStatus.Completed) {
        if (!this.sessions.has(player.gameRoom.code)) {
          const sessionPlayer: playersInterface = {
            id: client.id,
            isCreator: player.gameRoom.fk_creator_player_id === result.userId,
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
          if (client.id === thisPlayer.id) {
            client.emit('join-response', {
              status: 'success',
              code: player.gameRoom.code,
              players: this.sessions.get(player.gameRoom.code).players,
              joined: true,
            });
          } else {
            client.to(thisPlayer.id).emit('join-response', {
              status: 'success',
              code: player.gameRoom.code,
              isCreator: player.gameRoom.fk_creator_player_id === result.userId,
              players: this.sessions.get(player.gameRoom.code).players,
            });
          }
        });
      }
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
    data: { code: string, playerId: number },
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
        .emit('join-response', { status: 'success', code: code, players: session.players });
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
  async handleLeave(client: Socket, data: { code: string, playerId: number }) {
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start')
  async handleGameStart(client: Socket, data: { code: string }) {
    if (this.sessions.has(data.code)) {
      const session = this.sessions.get(data.code);
      const shuffleDeck: string[] = [...packOfCards.sort(() => Math.random() - 0.5)];
      const turnOrder: string[] = [];
      const discardPile: string[] = [];
      const cardToSkip: string[] = ['W', 'D4W'];
      const playerCards: { username: string, cardsCount: number }[] = [];

      session.players.forEach((thisPlayer) => {
        let playerHand: string[] = [];

        turnOrder.push(thisPlayer.username);

        for (let i = 0; i < 7; i++) {
          const drawnCard = shuffleDeck.pop();
          playerHand.push(drawnCard);
        }

        const updatedPlayer: UpdatePlayerDto = { hand_cards: JSON.stringify(playerHand) };
        this.playerService.updateByUsername(thisPlayer.username, updatedPlayer);
        thisPlayer.handCards = playerHand;
        playerCards.push({
          username: thisPlayer.username,
          cardsCount: playerHand.length
        });
      });

      let firstCardPlayed = shuffleDeck.pop();
      discardPile.push(firstCardPlayed);

      // Prevent beginnnig with a special card (without colour)
      while (cardToSkip.includes(firstCardPlayed)) {
        shuffleDeck.unshift(discardPile.pop());
        firstCardPlayed = shuffleDeck.pop();
        discardPile.push(firstCardPlayed);
      }

      // Set session game data
      session.deck = shuffleDeck;
      session.discardPile = discardPile;

      const player = await this.playerService.findOneByUsername(turnOrder[0]);
  
      const createGameStateDto: CreateGameStateDto = { 
        fk_game_room_id: player.fk_game_room_id,
        fk_current_player_id: player.id,
        deck: JSON.stringify(shuffleDeck),
        discard_pile: JSON.stringify(discardPile),
        turn_order: JSON.stringify(turnOrder),
      };

      this.gameStatesService.create(createGameStateDto);
      this.gameRoomService.startGameRoom(data.code);

      session.players.forEach((thisPlayer) => {
        const playerToIgnore = playerCards.filter((player) => player.username !== thisPlayer.username);
        const playerSession = { started: true, hand_cards: thisPlayer.handCards, played_card: firstCardPlayed, player_cards: playerToIgnore };

        if (client.id === thisPlayer.id) {
          client.emit('start-response', playerSession);
        } else {
          client.to(thisPlayer.id).emit('start-response', playerSession);
        }
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('finished')
  handleGameFinished(client: Socket, data: { code: string }) {}
}
